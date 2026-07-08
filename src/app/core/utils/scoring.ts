import {
  AppUser,
  Fixture,
  LeagueMatch,
  Lineup,
  RoundSetting,
  StandingRow,
  TeamEvent,
} from "../models";

const FIRST_GOAL_THRESHOLD = 120;
const POINTS_PER_GOAL = 55;
const MAX_GOALS = 7;

export function roundDeadline(fixtures: Fixture[], round: number): Date | null {
  const fs = fixtures
    .filter((f) => f.round === round)
    .map((f) => toDate(f.kickoffAt))
    .sort((a, b) => a.getTime() - b.getTime());
  return fs[0] ? new Date(fs[0].getTime() - 5 * 60 * 1000) : null;
}

export function isRoundLocked(fixtures: Fixture[], round: number) {
  const d = roundDeadline(fixtures, round);
  return d ? Date.now() >= d.getTime() : false;
}

export function toDate(v: any): Date {
  return v?.toDate ? v.toDate() : new Date(v);
}

export function effectiveLineup(
  uid: string,
  round: number,
  lineups: Lineup[],
): Lineup | undefined {
  for (let r = round; r >= 1; r--) {
    const l = lineups.find((x) => x.uid === uid && x.round === r);
    if (l) return { ...l, round };
  }
  return undefined;
}

export function lineupScore(
  uid: string,
  round: number,
  lineups: Lineup[],
  events: TeamEvent[],
): number {
  return lineupFantasyRoundScore(uid, round, lineups, events);
}

function pairUsers(users: AppUser[], round: number) {
  const arr = [...users].sort((a, b) => a.uid.localeCompare(b.uid));
  if (arr.length % 2) arr.push({ uid: "BYE" } as any);
  const n = arr.length,
    fixed = arr[0],
    rest = arr.slice(1);
  const rot = (round - 1) % (n - 1);
  const r = [...rest.slice(rot), ...rest.slice(0, rot)];
  const pairs: [[AppUser, AppUser]] | any = [];
  pairs.push([fixed, r[0]]);
  for (let i = 1; i < n / 2; i++) pairs.push([r[i], r[n - 1 - i]]);
  return pairs.filter(([a, b]: any) => a.uid !== "BYE" && b.uid !== "BYE") as [
    AppUser,
    AppUser,
  ][];
}

export function standings(
  users: AppUser[],
  fixtures: Fixture[],
  lineups: Lineup[],
  events: TeamEvent[],
  leagueMatches: LeagueMatch[] = [],
  roundSettings: RoundSetting[] = [],
): StandingRow[] {
  const closedRounds = roundSettings
    .filter((roundSetting) => roundSetting.status === "closed")
    .map((roundSetting) => Number(roundSetting.round))
    .filter((round) => Number.isFinite(round))
    .sort((a, b) => a - b);

  const rows = new Map(
    users.map((user) => [
      user.uid,
      {
        uid: user.uid,
        username: user.username,
        teamName: user.teamName,
        fantasyPoints: 0,
        leaguePoints: 0,
        wins: 0,
        draws: 0,
        losses: 0,
        goalsFor: 0,
        goalsAgainst: 0,
        position: 0,
      } as StandingRow,
    ]),
  );

  for (const user of users) {
    const row = rows.get(user.uid);

    if (!row) {
      continue;
    }

    const roundFantasyPoints = closedRounds.reduce(
      (total, round) =>
        total + lineupFantasyRoundScore(user.uid, round, lineups, events),
      0,
    );

    const seasonalPoints = seasonalFantasyScore(user.roster, events);

    row.fantasyPoints = roundFantasyPoints + seasonalPoints;
  }

  for (const round of closedRounds) {
    const roundLeagueMatches = leagueMatches.filter(
      (leagueMatch) => Number(leagueMatch.round) === round,
    );

    const matchesToUse =
      roundLeagueMatches.length > 0
        ? roundLeagueMatches
        : pairUsers(users, round).map(
            ([homeUser, awayUser]) =>
              ({
                id: `fallback-${round}-${homeUser.uid}-${awayUser.uid}`,
                round,
                homeUid: homeUser.uid,
                awayUid: awayUser.uid,
              }) as LeagueMatch,
          );

    for (const match of matchesToUse) {
      const homeRow = rows.get(match.homeUid);
      const awayRow = rows.get(match.awayUid);

      if (!homeRow || !awayRow) {
        continue;
      }

      const result = leagueMatchResult(match, lineups, events);

      homeRow.goalsFor += result.homeGoals;
      homeRow.goalsAgainst += result.awayGoals;

      awayRow.goalsFor += result.awayGoals;
      awayRow.goalsAgainst += result.homeGoals;

      if (result.homeGoals > result.awayGoals) {
        homeRow.wins += 1;
        awayRow.losses += 1;
        homeRow.leaguePoints += 3;
      } else if (result.homeGoals < result.awayGoals) {
        awayRow.wins += 1;
        homeRow.losses += 1;
        awayRow.leaguePoints += 3;
      } else {
        homeRow.draws += 1;
        awayRow.draws += 1;
        homeRow.leaguePoints += 1;
        awayRow.leaguePoints += 1;
      }
    }
  }

  return [...rows.values()]
    .sort((a, b) => {
      if (b.fantasyPoints !== a.fantasyPoints) {
        return b.fantasyPoints - a.fantasyPoints;
      }

      return b.leaguePoints - a.leaguePoints;
    })
    .map((row, index) => ({
      ...row,
      position: index + 1,
    }));
}

export function goalsFromFantasyPoints(points: number): number {
  const normalizedPoints = Math.max(0, Math.floor(points));

  if (normalizedPoints < FIRST_GOAL_THRESHOLD) {
    return 0;
  }

  const goals =
    Math.floor((normalizedPoints - FIRST_GOAL_THRESHOLD) / POINTS_PER_GOAL) + 1;

  return Math.min(goals, MAX_GOALS);
}

export function leagueMatchResult(
  leagueMatch: LeagueMatch,
  lineups: Lineup[],
  events: TeamEvent[],
): {
  homePoints: number;
  awayPoints: number;
  homeGoals: number;
  awayGoals: number;
} {
  const homePoints = lineupLeagueRoundScore(
    leagueMatch.homeUid,
    leagueMatch.round,
    lineups,
    events,
  );

  const awayPoints = lineupLeagueRoundScore(
    leagueMatch.awayUid,
    leagueMatch.round,
    lineups,
    events,
  );

  return {
    homePoints,
    awayPoints,
    homeGoals: goalsFromFantasyPoints(homePoints),
    awayGoals: goalsFromFantasyPoints(awayPoints),
  };
}

export function lineupFantasyRoundScore(
  uid: string,
  round: number,
  lineups: Lineup[],
  events: TeamEvent[],
): number {
  const lineup = effectiveLineup(uid, round, lineups);

  if (!lineup) {
    return 0;
  }

  return events
    .filter(
      (event) =>
        event.scope !== "seasonal" &&
        event.round === round &&
        lineup.teams.includes(event.teamName),
    )
    .reduce((total, event) => {
      const multiplier = event.teamName === lineup.captainTeam ? 2 : 1;

      return total + event.points * multiplier;
    }, 0);
}

export function lineupLeagueRoundScore(
  uid: string,
  round: number,
  lineups: Lineup[],
  events: TeamEvent[],
): number {
  const lineup = effectiveLineup(uid, round, lineups);

  if (!lineup) {
    return 0;
  }

  return events
    .filter(
      (event) =>
        event.scope !== "seasonal" &&
        event.round === round &&
        lineup.teams.includes(event.teamName),
    )
    .reduce((total, event) => {
      return total + event.points;
    }, 0);
}

export function seasonalFantasyScore(
  roster: string[],
  events: TeamEvent[],
): number {
  return events
    .filter(
      (event) => event.scope === "seasonal" && roster.includes(event.teamName),
    )
    .reduce((total, event) => total + event.points, 0);
}
