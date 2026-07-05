import { Injectable, inject } from "@angular/core";
import { Auth } from "@angular/fire/auth";
import {
  Firestore,
  Timestamp,
  addDoc,
  collection,
  collectionData,
  doc,
  getDocs,
  serverTimestamp,
  setDoc,
  updateDoc,
  writeBatch,
} from "@angular/fire/firestore";
import { Observable } from "rxjs";
import { AppUser, Fixture, LeagueMatch, Lineup, TeamEvent } from "../models";
import { ruleById } from "../constants/bonus-rules";
import { SERIE_A_2026_27_SEED } from "../seed/serie-a-2026-27.seed";

export interface FixtureImportRow {
  id: string;
  round: number;
  homeTeam: string;
  awayTeam: string;
  kickoffAtIso: string;
}

@Injectable({ providedIn: "root" })
export class DataService {
  private db = inject(Firestore);
  private auth = inject(Auth);

  users$() {
    return collectionData(collection(this.db, "users")) as Observable<
      AppUser[]
    >;
  }

  fixtures$() {
    return collectionData(collection(this.db, "fixtures"), {
      idField: "id",
    }) as Observable<Fixture[]>;
  }

  lineups$() {
    return collectionData(collection(this.db, "lineups"), {
      idField: "id",
    }) as Observable<Lineup[]>;
  }

  events$() {
    return collectionData(collection(this.db, "teamEvents"), {
      idField: "id",
    }) as Observable<TeamEvent[]>;
  }

  leagueMatches$(): Observable<LeagueMatch[]> {
    return collectionData(collection(this.db, "leagueMatches"), {
      idField: "id",
    }) as Observable<LeagueMatch[]>;
  }

  async saveLineup(round: number, teams: string[], captainTeam: string) {
    const u = this.auth.currentUser;
    if (!u) throw new Error("No user");
    await setDoc(
      doc(this.db, `lineups/${u.uid}_${round}`),
      {
        uid: u.uid,
        round,
        teams,
        captainTeam,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    );
  }

  async addTeamEvents(
    fixture: Fixture,
    teamName: string,
    ruleIds: string[],
  ): Promise<void> {
    const user = this.auth.currentUser;

    if (!user) {
      throw new Error("No user");
    }

    await Promise.all(
      ruleIds.map((ruleId) => {
        const rule = ruleById(ruleId);

        if (!rule) {
          throw new Error("Rule not found");
        }

        return addDoc(collection(this.db, "teamEvents"), {
          scope: "match",
          fixtureId: fixture.id,
          round: fixture.round,
          teamName,
          ruleId,
          label: rule.label,
          description: rule.description,
          points: rule.points,
          createdAt: serverTimestamp(),
          createdBy: user.uid,
        });
      }),
    );
  }

  async setResult(fixture: Fixture, homeGoals: number, awayGoals: number) {
    await updateDoc(doc(this.db, `fixtures/${fixture.id}`), {
      homeGoals,
      awayGoals,
      status: "finished",
    });
  }

  async importSeedFixtures() {
    const batch = writeBatch(this.db);
    for (const f of SERIE_A_2026_27_SEED) {
      batch.set(doc(this.db, `fixtures/${f.id}`), {
        round: f.round,
        homeTeam: f.homeTeam,
        awayTeam: f.awayTeam,
        kickoffAt: Timestamp.fromDate(new Date(f.kickoffAtIso)),
        status: "scheduled",
      });
    }
    await batch.commit();
    return SERIE_A_2026_27_SEED.length;
  }

  async importFixturesFromRows(rows: FixtureImportRow[]): Promise<number> {
    const batch = writeBatch(this.db);

    for (const row of rows) {
      const kickoffAt = new Date(row.kickoffAtIso);

      if (Number.isNaN(kickoffAt.getTime())) {
        throw new Error(`Data non valida per ${row.id}`);
      }

      batch.set(
        doc(this.db, `fixtures/${row.id}`),
        {
          round: row.round,
          homeTeam: row.homeTeam.trim(),
          awayTeam: row.awayTeam.trim(),
          kickoffAt: Timestamp.fromDate(kickoffAt),
          status: "scheduled",
        },
        { merge: true },
      );
    }

    await batch.commit();

    return rows.length;
  }

  async generateLeagueCalendar(): Promise<number> {
    const usersSnapshot = await getDocs(collection(this.db, "users"));
    const fixturesSnapshot = await getDocs(collection(this.db, "fixtures"));

    const users = usersSnapshot.docs
      .map((document) => document.data() as AppUser)
      .filter((user) => user.role === "player" || user.role === "admin")
      .sort((a, b) => a.uid.localeCompare(b.uid));

    const rounds = Array.from(
      new Set(
        fixturesSnapshot.docs
          .map((document) => document.data() as Fixture)
          .map((fixture) => fixture.round),
      ),
    ).sort((a, b) => a - b);

    if (users.length < 2) {
      throw new Error("Servono almeno 2 utenti per generare il calendario.");
    }

    if (rounds.length === 0) {
      throw new Error("Non ci sono giornate Serie A inserite.");
    }

    const batch = writeBatch(this.db);
    let createdMatches = 0;

    for (const round of rounds) {
      const pairings = this.generateRoundPairings(users, round);

      for (const [homeUser, awayUser] of pairings) {
        const id = `round-${round}-${homeUser.uid}-${awayUser.uid}`;

        batch.set(
          doc(this.db, `leagueMatches/${id}`),
          {
            round,
            homeUid: homeUser.uid,
            awayUid: awayUser.uid,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          },
          { merge: true },
        );

        createdMatches += 1;
      }
    }

    await batch.commit();

    return createdMatches;
  }

  private generateRoundPairings(
    users: AppUser[],
    round: number,
  ): [AppUser, AppUser][] {
    const players = [...users];

    if (players.length % 2 !== 0) {
      players.push({
        uid: "BYE",
        username: "BYE",
        teamName: "BYE",
      } as AppUser);
    }

    const fixed = players[0];
    const rotating = players.slice(1);
    const rotationIndex = (round - 1) % rotating.length;

    const rotated = [
      ...rotating.slice(rotationIndex),
      ...rotating.slice(0, rotationIndex),
    ];

    const orderedPlayers = [fixed, ...rotated];
    const pairings: [AppUser, AppUser][] = [];

    for (let index = 0; index < orderedPlayers.length / 2; index += 1) {
      const homeUser = orderedPlayers[index];
      const awayUser = orderedPlayers[orderedPlayers.length - 1 - index];

      if (homeUser.uid === "BYE" || awayUser.uid === "BYE") {
        continue;
      }

      if (round % 2 === 0) {
        pairings.push([awayUser, homeUser]);
      } else {
        pairings.push([homeUser, awayUser]);
      }
    }

    return pairings;
  }

  async addSeasonalTeamEvents(
    teamName: string,
    ruleIds: string[],
  ): Promise<void> {
    const user = this.auth.currentUser;

    if (!user) {
      throw new Error("No user");
    }

    await Promise.all(
      ruleIds.map((ruleId) => {
        const rule = ruleById(ruleId);

        if (!rule) {
          throw new Error("Rule not found");
        }

        return addDoc(collection(this.db, "teamEvents"), {
          scope: "seasonal",
          teamName,
          ruleId,
          label: rule.label,
          description: rule.description,
          points: rule.points,
          createdAt: serverTimestamp(),
          createdBy: user.uid,
        });
      }),
    );
  }
}
