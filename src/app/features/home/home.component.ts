import { AsyncPipe } from "@angular/common";
import { Component, DestroyRef, inject, signal } from "@angular/core";
import { Router } from "@angular/router";
import { interval, combineLatest, map } from "rxjs";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { SectionHeaderComponent } from "../../shared/components/section-header/section-header.component";
import { AuthService } from "../../core/services/auth.service";
import { DataService } from "../../core/services/data.service";
import { roundDeadline, standings, toDate } from "../../core/utils/scoring";
import { getSerieATeamLogo } from "../../core/constants/serie-a-team-logos";
import { rosterCost, teamPrice } from "../../core/constants/serie-a-teams";

@Component({
  standalone: true,
  imports: [AsyncPipe, SectionHeaderComponent],
  templateUrl: "./home.component.html",
  styleUrl: "./home.component.scss",
})
export class HomeComponent {
  private auth = inject(AuthService);
  private data = inject(DataService);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);
  logoutConfirmOpen = signal(false);

  now = signal(Date.now());

  vm$ = combineLatest([
    this.auth.appUser$,
    this.data.users$(),
    this.data.fixtures$(),
    this.data.lineups$(),
    this.data.events$(),
    this.data.leagueMatches$(),
    this.data.roundSettings$(),
  ]).pipe(
    map(
      ([
        me,
        users,
        fixtures,
        lineups,
        events,
        leagueMatches,
        roundSettings,
      ]) => {
        const fantasyTable = standings(
          users,
          fixtures,
          lineups,
          events,
          leagueMatches,
          roundSettings,
        );

        const leagueTable = [...fantasyTable].sort((a, b) => {
          if (b.leaguePoints !== a.leaguePoints) {
            return b.leaguePoints - a.leaguePoints;
          }

          const bGoalDifference = b.goalsFor - b.goalsAgainst;
          const aGoalDifference = a.goalsFor - a.goalsAgainst;

          if (bGoalDifference !== aGoalDifference) {
            return bGoalDifference - aGoalDifference;
          }

          return b.goalsFor - a.goalsFor;
        });

        const myFantasyStanding = me
          ? fantasyTable.find((row) => row.uid === me.uid)
          : undefined;

        const myLeagueIndex = me
          ? leagueTable.findIndex((row) => row.uid === me.uid)
          : -1;

        const myLeagueStanding =
          myLeagueIndex >= 0 ? leagueTable[myLeagueIndex] : undefined;

        const closedRounds = new Set(
          roundSettings
            .filter((setting) => setting.status === "closed")
            .map((setting) => Number(setting.round)),
        );

        const availableRounds = Array.from(
          new Set(
            fixtures
              .map((fixture) => Number(fixture.round))
              .filter((round) => Number.isFinite(round)),
          ),
        ).sort((a, b) => a - b);

        const nextRound =
          availableRounds.find((round) => !closedRounds.has(round)) ?? null;

        const deadline = nextRound ? roundDeadline(fixtures, nextRound) : null;

        const hasLineup =
          Boolean(me) &&
          nextRound !== null &&
          lineups.some(
            (lineup) => lineup.uid === me?.uid && lineup.round === nextRound,
          );

        const closedRoundNumbers = roundSettings
          .filter((setting) => setting.status === "closed")
          .map((setting) => Number(setting.round))
          .filter((round) => Number.isFinite(round))
          .sort((a, b) => a - b);

        const lastClosedRound =
          closedRoundNumbers.length > 0
            ? closedRoundNumbers[closedRoundNumbers.length - 1]
            : 0;

        const lastRoundFixtures = fixtures
          .filter((fixture) => Number(fixture.round) === lastClosedRound)
          .sort(
            (a, b) =>
              toDate(a.kickoffAt).getTime() - toDate(b.kickoffAt).getTime(),
          );

        return {
          me,
          myFantasyStanding,
          myLeagueStanding,
          fantasyPosition: myFantasyStanding?.position ?? null,
          leaguePosition: myLeagueIndex >= 0 ? myLeagueIndex + 1 : null,
          nextRound,
          deadline,
          hasLineup,
          lastClosedRound,
          lastRoundFixtures,
        };
      },
    ),
  );

  constructor() {
    interval(1000)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.now.set(Date.now());
      });
  }

  countdown(deadline: Date | null): {
    days: string;
    hours: string;
    minutes: string;
    seconds: string;
  } {
    if (!deadline) {
      return {
        days: "--",
        hours: "--",
        minutes: "--",
        seconds: "--",
      };
    }

    const remainingMs = Math.max(0, deadline.getTime() - this.now());

    const totalSeconds = Math.floor(remainingMs / 1000);
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return {
      days: String(days).padStart(2, "0"),
      hours: String(hours).padStart(2, "0"),
      minutes: String(minutes).padStart(2, "0"),
      seconds: String(seconds).padStart(2, "0"),
    };
  }

  goToLineup(): void {
    this.router.navigateByUrl("/formazione");
  }

  async logout(): Promise<void> {
    await this.auth.logout();
    await this.router.navigateByUrl("/login");
  }

  toDate(value: unknown): Date {
    return toDate(value);
  }

  teamLogo(teamName: string): string {
    return getSerieATeamLogo(teamName);
  }

  rosterCost(teams: string[]): number {
    return rosterCost(teams);
  }

  teamPrice(teamName: string): number {
    return teamPrice(teamName);
  }

  openAdminPanel(): void {
    this.router.navigateByUrl("/admin");
  }

  openLogoutConfirm(): void {
    this.logoutConfirmOpen.set(true);
  }

  closeLogoutConfirm(): void {
    this.logoutConfirmOpen.set(false);
  }

  async confirmLogout(): Promise<void> {
    this.logoutConfirmOpen.set(false);
    await this.logout();
  }
}
