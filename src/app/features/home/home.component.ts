import { AsyncPipe } from "@angular/common";
import { Component, DestroyRef, inject, signal } from "@angular/core";
import { Router } from "@angular/router";
import { interval, combineLatest, map, Observable } from "rxjs";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { SectionHeaderComponent } from "../../shared/components/section-header/section-header.component";
import {
  AuthService,
  DataService,
  getSerieATeamLogo,
  rosterCost,
  roundDeadline,
  standings,
  toDate,
  teamPrice,
  leagueMatchResult,
  AppUser,
  LeagueMatch,
  Lineup,
  TeamEvent,
  RepairMarketSettings,
  ToastService,
  INITIAL_BUDGET,
  SERIE_A_TEAMS,
} from "../../core";

interface HomeLeagueMatchView {
  round: number;
  homeTeamName: string;
  awayTeamName: string;
  homeLogoUrl: string;
  awayLogoUrl: string;
  homeGoals: number;
  awayGoals: number;
  homePoints: number;
  awayPoints: number;
  isCurrentUserHome: boolean;
  isClosed: boolean;
}

@Component({
  standalone: true,
  imports: [AsyncPipe, SectionHeaderComponent],
  templateUrl: "./home.component.html",
  styleUrl: "./home.component.scss",
})
export class HomeComponent {
  private auth = inject(AuthService);
  private data = inject(DataService);
  private toast = inject(ToastService);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);
  logoutConfirmOpen = signal(false);

  repairMarketModalOpen = signal(false);
  repairMarketSaving = signal(false);
  repairRoster = signal<string[]>([]);

  repairMarketSettings$: Observable<RepairMarketSettings> =
    this.data.repairMarketSettings$();
  updatingRepairMarket = signal(false);

  now = signal(Date.now());

  marketTeams = SERIE_A_TEAMS;
  initialBudget = INITIAL_BUDGET;

  vm$ = combineLatest([
    this.auth.appUser$,
    this.data.users$(),
    this.data.fixtures$(),
    this.data.lineups$(),
    this.data.events$(),
    this.data.leagueMatches$(),
    this.data.roundSettings$(),
    this.data.repairMarketSettings$(),
    this.data.repairMarketChanges$(),
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
        repairMarketSettings,
        repairMarketChanges,
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

        const closedRoundNumbers = roundSettings
          .filter((setting) => setting.status === "closed")
          .map((setting) => Number(setting.round))
          .filter((round) => Number.isFinite(round))
          .sort((a, b) => a - b);

        const closedRounds = new Set(closedRoundNumbers);

        const availableRounds = Array.from(
          new Set(
            fixtures
              .map((fixture) => Number(fixture.round))
              .filter((round) => Number.isFinite(round)),
          ),
        ).sort((a, b) => a - b);

        const previousRound =
          closedRoundNumbers.length > 0
            ? closedRoundNumbers[closedRoundNumbers.length - 1]
            : null;

        const nextRound =
          availableRounds.find((round) => !closedRounds.has(round)) ?? null;

        const deadline = nextRound ? roundDeadline(fixtures, nextRound) : null;

        const hasLineup =
          Boolean(me) &&
          nextRound !== null &&
          lineups.some(
            (lineup) => lineup.uid === me?.uid && lineup.round === nextRound,
          );

        const usersMap = new Map(users.map((user) => [user.uid, user]));

        const previousLeagueMatch =
          me && previousRound
            ? this.buildUserMatchView(
                me.uid,
                previousRound,
                usersMap,
                leagueMatches,
                lineups,
                events,
                true,
              )
            : null;

        const nextLeagueMatch =
          me && nextRound
            ? this.buildUserMatchView(
                me.uid,
                nextRound,
                usersMap,
                leagueMatches,
                lineups,
                events,
                false,
              )
            : null;

        const currentRepairMarketChange =
          me && repairMarketSettings.sessionId
            ? (repairMarketChanges.find(
                (change) =>
                  change.uid === me.uid &&
                  change.sessionId === repairMarketSettings.sessionId,
              ) ?? null)
            : null;

        return {
          me,
          myFantasyStanding,
          myLeagueStanding,
          fantasyPosition: myFantasyStanding?.position ?? null,
          fantasyPoints: myFantasyStanding?.fantasyPoints ?? 0,
          leaguePosition: myLeagueIndex >= 0 ? myLeagueIndex + 1 : null,
          leaguePoints: myLeagueStanding?.leaguePoints ?? 0,
          previousRound,
          nextRound,
          deadline,
          hasLineup,
          previousLeagueMatch,
          nextLeagueMatch,
          repairMarketSettings,
          currentRepairMarketChange,
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

  private buildUserMatchView(
    uid: string,
    round: number,
    usersMap: Map<string, AppUser>,
    leagueMatches: LeagueMatch[],
    lineups: Lineup[],
    events: TeamEvent[],
    isClosed: boolean,
  ): HomeLeagueMatchView | null {
    const match = leagueMatches.find(
      (item) =>
        Number(item.round) === round &&
        (item.homeUid === uid || item.awayUid === uid),
    );

    if (!match) {
      return null;
    }

    const homeUser = usersMap.get(match.homeUid);
    const awayUser = usersMap.get(match.awayUid);

    const result = leagueMatchResult(match, lineups, events);

    return {
      round,
      homeTeamName: homeUser?.teamName || "Utente",
      awayTeamName: awayUser?.teamName || "Utente",
      homeLogoUrl: homeUser?.teamLogoUrl || "",
      awayLogoUrl: awayUser?.teamLogoUrl || "",
      homeGoals: result.homeGoals,
      awayGoals: result.awayGoals,
      homePoints: result.homePoints,
      awayPoints: result.awayPoints,
      isCurrentUserHome: match.homeUid === uid,
      isClosed,
    };
  }

  goToLineup(): void {
    this.router.navigateByUrl("/formazione");
  }

  goToCalendar(): void {
    this.router.navigateByUrl("/calendario");
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

  async toggleRepairMarket(settings: RepairMarketSettings): Promise<void> {
    this.updatingRepairMarket.set(true);

    try {
      if (settings.isOpen) {
        await this.data.closeRepairMarket();

        this.toast.show("Mercato di riparazione chiuso.", "success", 3000);
      } else {
        await this.data.openRepairMarket();

        this.toast.show("Mercato di riparazione aperto.", "success", 3000);
      }
    } catch (error) {
      console.error("Errore mercato riparazione:", error);

      this.toast.show("Operazione mercato non riuscita.", "error", 3000);
    } finally {
      this.updatingRepairMarket.set(false);
    }
  }

  openRepairMarketModal(user: AppUser): void {
    this.repairRoster.set([...user.roster]);
    this.repairMarketModalOpen.set(true);
  }

  closeRepairMarketModal(): void {
    this.repairMarketModalOpen.set(false);
  }

  isRepairTeamSelected(teamName: string): boolean {
    return this.repairRoster().includes(teamName);
  }

  repairRosterCost(): number {
    return rosterCost(this.repairRoster());
  }

  repairChangesUsed(originalRoster: string[]): number {
    return originalRoster.filter(
      (teamName) => !this.repairRoster().includes(teamName),
    ).length;
  }
  
  toggleRepairTeam(teamName: string, originalRoster: string[]): void {
    const currentRoster = this.repairRoster();
    const isSelected = currentRoster.includes(teamName);
    const isOriginal = originalRoster.includes(teamName);

    if (isSelected) {
      const candidateRoster = currentRoster.filter((team) => team !== teamName);

      const changesUsed = originalRoster.filter(
        (team) => !candidateRoster.includes(team),
      ).length;

      if (changesUsed > 4) {
        this.toast.show(
          "Hai già raggiunto il limite massimo di 4 cambi.",
          "error",
          3000,
        );

        return;
      }

      this.repairRoster.set(candidateRoster);
      return;
    }

    if (!isSelected && !isOriginal && currentRoster.length >= 10) {
      this.toast.show(
        "Devi prima rimuovere una squadra dalla tua rosa.",
        "error",
        3000,
      );

      return;
    }

    this.repairRoster.set([...currentRoster, teamName]);
  }

  canSaveRepairMarket(originalRoster: string[]): boolean {
    return (
      this.repairRoster().length === 10 &&
      this.repairRosterCost() <= 100 &&
      this.repairChangesUsed(originalRoster) <= 4
    );
  }

  async saveRepairMarket(
    user: AppUser,
    sessionId: string,
    originalRoster: string[],
  ): Promise<void> {
    if (!this.canSaveRepairMarket(originalRoster)) {
      return;
    }

    this.repairMarketSaving.set(true);

    try {
      await this.data.saveRepairMarketRoster(
        user.uid,
        user.roster,
        this.repairRoster(),
        sessionId,
      );

      this.closeRepairMarketModal();
    } finally {
      this.repairMarketSaving.set(false);
    }
  }

  isOriginalRepairTeam(teamName: string, originalRoster: string[]): boolean {
    return originalRoster.includes(teamName);
  }

  isKeptRepairTeam(teamName: string, originalRoster: string[]): boolean {
    return (
      this.isOriginalRepairTeam(teamName, originalRoster) &&
      this.isRepairTeamSelected(teamName)
    );
  }

  isRemovedRepairTeam(teamName: string, originalRoster: string[]): boolean {
    return (
      this.isOriginalRepairTeam(teamName, originalRoster) &&
      !this.isRepairTeamSelected(teamName)
    );
  }

  isAddedRepairTeam(teamName: string, originalRoster: string[]): boolean {
    return (
      !this.isOriginalRepairTeam(teamName, originalRoster) &&
      this.isRepairTeamSelected(teamName)
    );
  }
}
