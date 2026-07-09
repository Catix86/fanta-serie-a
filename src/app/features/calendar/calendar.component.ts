import { AsyncPipe } from "@angular/common";
import { Component, inject, signal } from "@angular/core";
import { combineLatest, map, tap } from "rxjs";

import { AppUser, LeagueMatch, Lineup, TeamEvent } from "../../core/models";
import { AuthService } from "../../core/services/auth.service";
import { DataService } from "../../core/services/data.service";
import { effectiveLineup, leagueMatchResult } from "../../core/utils/scoring";
import { getSerieATeamLogo } from "../../core/constants/serie-a-team-logos";
import { SectionHeaderComponent } from "../../shared/components/section-header/section-header.component";

interface CalendarLineupTeamView {
  teamName: string;
  logoUrl: string;
  points: number;
  isCaptain: boolean;
}

interface CalendarMatchView extends LeagueMatch {
  homeTeamName: string;
  awayTeamName: string;
  homeLogoUrl: string;
  awayLogoUrl: string;
  homePoints: number;
  awayPoints: number;
  homeGoals: number;
  awayGoals: number;
  homeLineupTeams: CalendarLineupTeamView[];
  awayLineupTeams: CalendarLineupTeamView[];
  isCurrentUserMatch: boolean;
  resultClass: "home-win" | "away-win" | "draw";
}

interface CalendarRoundGroup {
  round: number;
  serieARound: number;
  isClosed: boolean;
  matches: CalendarMatchView[];
}

@Component({
  standalone: true,
  imports: [AsyncPipe, SectionHeaderComponent],
  templateUrl: "./calendar.component.html",
  styleUrl: "./calendar.component.scss",
})
export class CalendarComponent {
  private auth = inject(AuthService);
  private data = inject(DataService);

  private hasAutoScrolledToNextOpenRound = false;

  selectedMatch = signal<CalendarMatchView | null>(null);

  vm$ = combineLatest([
    this.auth.appUser$,
    this.data.users$(),
    this.data.lineups$(),
    this.data.events$(),
    this.data.leagueMatches$(),
    this.data.roundSettings$(),
  ]).pipe(
    map(
      ([currentUser, users, lineups, events, leagueMatches, roundSettings]) => {
        const usersMap = new Map(users.map((user) => [user.uid, user]));

        const closedRounds = new Set(
          roundSettings
            .filter((setting) => setting.status === "closed")
            .map((setting) => Number(setting.round)),
        );

        const rounds = Array.from(
          new Set(
            leagueMatches
              .map((match) => Number(match.round))
              .filter((round) => Number.isFinite(round)),
          ),
        ).sort((a, b) => a - b);

        const groups: CalendarRoundGroup[] = rounds.map((round) => {
          const isClosed = closedRounds.has(round);

          const matches = leagueMatches
            .filter((match) => Number(match.round) === round)
            .sort((a, b) => a.id.localeCompare(b.id))
            .map((match) => {
              const homeUser = usersMap.get(match.homeUid);
              const awayUser = usersMap.get(match.awayUid);

              const result = leagueMatchResult(match, lineups, events);

              return {
                ...match,
                homeTeamName: homeUser?.teamName || "Utente",
                awayTeamName: awayUser?.teamName || "Utente",
                homeLogoUrl: homeUser?.teamLogoUrl || "",
                awayLogoUrl: awayUser?.teamLogoUrl || "",
                homePoints: result.homePoints,
                awayPoints: result.awayPoints,
                homeGoals: result.homeGoals,
                awayGoals: result.awayGoals,
                homeLineupTeams: this.buildLineupTeams(
                  match.homeUid,
                  round,
                  lineups,
                  events,
                ),
                awayLineupTeams: this.buildLineupTeams(
                  match.awayUid,
                  round,
                  lineups,
                  events,
                ),
                isCurrentUserMatch:
                  match.homeUid === currentUser?.uid ||
                  match.awayUid === currentUser?.uid,
                resultClass: this.resultClass(
                  result.homeGoals,
                  result.awayGoals,
                ),
              };
            });

          return {
            round,
            serieARound: round,
            isClosed,
            matches,
          };
        });

        const nextOpenRound =
          groups.find((group) => !group.isClosed)?.round ?? null;

        return {
          currentUser,
          groups,
          nextOpenRound,
        };
      },
    ),
    tap((vm) => {
      if (this.hasAutoScrolledToNextOpenRound || vm.nextOpenRound === null) {
        return;
      }

      this.hasAutoScrolledToNextOpenRound = true;

      window.setTimeout(() => {
        this.scrollToRound(vm.nextOpenRound as number);
      }, 150);
    }),
  );

  openMatch(match: CalendarMatchView): void {
    this.selectedMatch.set(match);
  }

  closeMatch(): void {
    this.selectedMatch.set(null);
  }

  roundTitle(round: number): string {
    return `${round}ª Giornata`;
  }

  serieARoundTitle(round: number): string {
    return `${round}ª Serie A`;
  }

  scrollToRound(round: number): void {
    const element = document.getElementById(`calendar-round-${round}`);

    if (!element) {
      return;
    }

    element.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }

  private buildLineupTeams(
    uid: string,
    round: number,
    lineups: Lineup[],
    events: TeamEvent[],
  ): CalendarLineupTeamView[] {
    const lineup = effectiveLineup(uid, round, lineups);

    if (!lineup) {
      return [];
    }

    return lineup.teams.map((teamName) => ({
      teamName,
      logoUrl: getSerieATeamLogo(teamName),
      points: this.teamRoundPoints(teamName, round, events),
      isCaptain: lineup.captainTeam === teamName,
    }));
  }

  private teamRoundPoints(
    teamName: string,
    round: number,
    events: TeamEvent[],
  ): number {
    return events
      .filter(
        (event) =>
          event.scope !== "seasonal" &&
          Number(event.round) === round &&
          event.teamName === teamName,
      )
      .reduce((total, event) => total + event.points, 0);
  }

  private resultClass(
    homeGoals: number,
    awayGoals: number,
  ): "home-win" | "away-win" | "draw" {
    if (homeGoals > awayGoals) {
      return "home-win";
    }

    if (homeGoals < awayGoals) {
      return "away-win";
    }

    return "draw";
  }
}
