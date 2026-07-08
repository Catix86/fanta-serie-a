import { AsyncPipe } from "@angular/common";
import { Component, inject } from "@angular/core";
import { combineLatest, map, tap } from "rxjs";
import { AuthService } from "../../core/services/auth.service";
import { DataService } from "../../core/services/data.service";
import { LeagueMatch } from "../../core/models";
import { leagueMatchResult } from "../../core/utils/scoring";
import { SectionHeaderComponent } from "../../shared/components/section-header/section-header.component";

interface CalendarMatchView extends LeagueMatch {
  homeTeamName: string;
  awayTeamName: string;
  homeLogoUrl: string;
  awayLogoUrl: string;
  homePoints: number;
  awayPoints: number;
  homeGoals: number;
  awayGoals: number;
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
            isClosed: closedRounds.has(round),
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
