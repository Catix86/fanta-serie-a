import { AsyncPipe } from "@angular/common";
import { Component, DestroyRef, inject, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { Router } from "@angular/router";
import { interval, combineLatest, map } from "rxjs";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { SectionHeaderComponent } from "../../shared/components/section-header/section-header.component";
import { AuthService } from "../../core/services/auth.service";
import { DataService } from "../../core/services/data.service";
import { LINEUP_SIZE, teamPrice } from "../../core/constants/serie-a-teams";
import { getSerieATeamLogo } from "../../core/constants/serie-a-team-logos";
import { isRoundLocked, roundDeadline } from "../../core/utils/scoring";
import { ToastService } from "../../core/services/toast.service";

@Component({
  standalone: true,
  imports: [AsyncPipe, FormsModule, SectionHeaderComponent],
  templateUrl: "./lineup.component.html",
  styleUrl: "./lineup.component.scss",
})
export class LineupComponent {
  private auth = inject(AuthService);
  private data = inject(DataService);
  private toast = inject(ToastService);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);

  size = LINEUP_SIZE;

  selected: string[] = [];
  captain = "";

  saving = signal(false);
  now = signal(Date.now());

  vm$ = combineLatest([
    this.auth.appUser$,
    this.data.fixtures$(),
    this.data.lineups$(),
    this.data.roundSettings$(),
  ]).pipe(
    map(([me, fixtures, lineups, roundSettings]) => {
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
        availableRounds.find((round) => !closedRounds.has(round)) ??
        availableRounds[0] ??
        1;

      const existingLineup = me
        ? lineups.find(
            (lineup) => lineup.uid === me.uid && lineup.round === nextRound,
          )
        : undefined;

      const roster = me?.roster || [];

      if (existingLineup && this.selected.length === 0) {
        const validSelectedTeams = existingLineup.teams.filter((teamName) =>
          roster.includes(teamName),
        );

        this.selected = validSelectedTeams;

        this.captain = validSelectedTeams.includes(existingLineup.captainTeam)
          ? existingLineup.captainTeam
          : "";
      }

      this.normalizeSelectedTeamsForRoster(roster);

      return {
        me,
        round: nextRound,
        locked: isRoundLocked(fixtures, nextRound),
        deadline: roundDeadline(fixtures, nextRound),
        existingLineup,
      };
    }),
  );

  constructor() {
    interval(1000)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.now.set(Date.now());
      });
  }

  goBack(): void {
    this.router.navigateByUrl("/home");
  }

  toggleTeam(teamName: string): void {
    if (this.selected.includes(teamName)) {
      this.selected = this.selected.filter((team) => team !== teamName);

      if (this.captain === teamName) {
        this.captain = "";
      }

      return;
    }

    if (this.selected.length >= this.size) {
      this.toast.show(
        `Hai già selezionato ${this.size} squadre.`,
        "error",
        3000,
      );

      return;
    }

    this.selected = [...this.selected, teamName];

    if (this.selected.length === this.size) {
      this.toast.show(
        `Hai selezionato tutte le ${this.size} squadre.`,
        "success",
        3000,
      );
    }
  }

  toggleCaptain(teamName: string, event: Event): void {
    event.stopPropagation();

    if (!this.selected.includes(teamName)) {
      this.toast.show(
        "Prima devi schierare la squadra per renderla capitano.",
        "error",
        3000,
      );

      return;
    }

    this.captain = this.captain === teamName ? "" : teamName;
  }

  isSelected(teamName: string): boolean {
    return this.selected.includes(teamName);
  }

  isCaptain(teamName: string): boolean {
    return this.captain === teamName;
  }

  teamPrice(teamName: string): number {
    return teamPrice(teamName);
  }

  teamRank(teamName: string, roster: string[] | undefined): number {
    if (!roster) {
      return 0;
    }

    const orderedRoster = [...roster].sort(
      (a, b) => this.teamPrice(b) - this.teamPrice(a),
    );

    return orderedRoster.indexOf(teamName) + 1;
  }

  teamLogo(teamName: string): string {
    return getSerieATeamLogo(teamName);
  }

  countdown(deadline: Date | null): string {
    if (!deadline) {
      return "--g --h --m --s";
    }

    const remainingMs = Math.max(0, deadline.getTime() - this.now());
    const totalSeconds = Math.floor(remainingMs / 1000);

    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return `${days}g ${hours}h ${minutes}m ${seconds}s`;
  }

  canSave(locked: boolean, roster: string[] = []): boolean {
    return (
      !locked &&
      this.selected.length === this.size &&
      this.selected.every((teamName) => roster.includes(teamName)) &&
      Boolean(this.captain) &&
      this.selected.includes(this.captain)
    );
  }

  async save(round: number): Promise<void> {
    if (this.selected.length !== this.size || !this.captain) {
      this.toast.show(
        `Scegli ${this.size} squadre e il capitano.`,
        "error",
        3000,
      );

      return;
    }

    try {
      this.saving.set(true);

      await this.data.saveLineup(round, this.selected, this.captain);

      this.toast.show("Formazione salvata correttamente.", "success", 3000);
    } catch (error) {
      console.error("Errore salvataggio formazione:", error);
      this.toast.show("Formazione non salvata.", "error", 3000);
    } finally {
      this.saving.set(false);
    }
  }

  private normalizeSelectedTeamsForRoster(roster: string[]): void {
    const validSelectedTeams = this.selected.filter((teamName) =>
      roster.includes(teamName),
    );

    if (validSelectedTeams.length !== this.selected.length) {
      this.selected = validSelectedTeams;
    }

    if (this.captain && !validSelectedTeams.includes(this.captain)) {
      this.captain = "";
    }
  }
}
