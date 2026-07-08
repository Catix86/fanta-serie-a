import { Component, inject, signal } from "@angular/core";
import { AsyncPipe } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { DataService } from "../../core/services/data.service";
import { BONUS_RULES } from "../../core/constants/bonus-rules";
import { Fixture } from "../../core/models";
import { ToastService } from "../../core/services/toast.service";
import { SectionHeaderComponent } from "../../shared/components/section-header/section-header.component";
import { SERIE_A_TEAMS } from "../../core/constants/serie-a-teams";
import { combineLatest, map } from "rxjs";

@Component({
  standalone: true,
  imports: [AsyncPipe, FormsModule, SectionHeaderComponent],
  templateUrl: "./admin.component.html",
  styleUrl: "./admin.component.scss",
})
export class AdminComponent {
  data = inject(DataService);
  toast = inject(ToastService);
  rules = BONUS_RULES;
  fixtures$ = this.data.fixtures$();
  selFixture?: Fixture;
  selTeam = "";
  ruleIds: string[] = [];
  saving = signal(false);
  calendarCsv = "";
  importingCalendar = signal(false);
  generatingLeagueCalendar = signal(false);
  eventScope: "match" | "seasonal" = "match";
  seasonalTeam = "";
  teamsList = SERIE_A_TEAMS.map((team) => team.name);

  updatingRound = signal<number | null>(null);

  roundsVm$ = combineLatest([this.fixtures$, this.data.roundSettings$()]).pipe(
    map(([fixtures, roundSettings]) => {
      const rounds = Array.from(
        new Set(
          fixtures
            .map((fixture) => Number(fixture.round))
            .filter((round) => Number.isFinite(round)),
        ),
      ).sort((a, b) => a - b);

      return rounds.map((round) => {
        const setting = roundSettings.find((item) => item.round === round);

        return {
          round,
          status: setting?.status ?? "open",
          closedAt: setting?.closedAt ?? null,
        };
      });
    }),
  );

  async generateLeagueCalendar(): Promise<void> {
    this.generatingLeagueCalendar.set(true);

    try {
      const count = await this.data.generateLeagueCalendar();

      this.toast.show(
        `${count} incontri generati/aggiornati.`,
        "success",
        3000,
      );
    } catch (error: any) {
      console.error("Errore generazione calendario incontri:", error);

      this.toast.show(
        error?.message || "Calendario incontri non generato.",
        "error",
        3000,
      );
    } finally {
      this.generatingLeagueCalendar.set(false);
    }
  }

  teams(f: Fixture) {
    return [f.homeTeam, f.awayTeam];
  }

  toggle(id: string) {
    this.ruleIds = this.ruleIds.includes(id)
      ? this.ruleIds.filter((x) => x !== id)
      : [...this.ruleIds, id];
  }

  async import() {
    const n = await this.data.importSeedFixtures();
    this.toast.show(`${n} partite importate`);
  }

  async addEvents(): Promise<void> {
    if (this.eventScope === "match") {
      if (!this.selFixture || !this.selTeam || !this.ruleIds.length) {
        this.toast.show(
          "Seleziona partita, squadra e bonus/malus.",
          "error",
          3000,
        );

        return;
      }

      const selectedRules = this.rules.filter((rule) =>
        this.ruleIds.includes(rule.id),
      );

      const hasInvalidScope = selectedRules.some(
        (rule) => rule.scope !== this.eventScope,
      );

      if (hasInvalidScope) {
        this.toast.show(
          "Hai selezionato bonus/malus non compatibili con il tipo di evento.",
          "error",
          3000,
        );

        return;
      }

      await this.data.addTeamEvents(
        this.selFixture,
        this.selTeam,
        this.ruleIds,
      );

      this.toast.show("Bonus/Malus partita inseriti.", "success", 3000);
      this.ruleIds = [];

      return;
    }

    if (!this.seasonalTeam || !this.ruleIds.length) {
      this.toast.show(
        "Seleziona squadra e bonus/malus stagionali.",
        "error",
        3000,
      );

      return;
    }

    await this.data.addSeasonalTeamEvents(this.seasonalTeam, this.ruleIds);

    this.toast.show("Bonus/Malus stagionali inseriti.", "success", 3000);
    this.ruleIds = [];
  }

  private parseFixturesCsv(csv: string) {
    const lines = csv
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

    const dataLines = lines[0]?.toLowerCase().startsWith("id,")
      ? lines.slice(1)
      : lines;

    return dataLines.map((line) => {
      const [id, round, homeTeam, awayTeam, kickoffAtIso] = line
        .split(",")
        .map((value) => value.trim());

      if (!id || !round || !homeTeam || !awayTeam || !kickoffAtIso) {
        throw new Error(`Riga CSV non valida: ${line}`);
      }

      return {
        id,
        round: Number(round),
        homeTeam,
        awayTeam,
        kickoffAtIso,
      };
    });
  }

  async importCalendarCsv(): Promise<void> {
    if (!this.calendarCsv.trim()) {
      this.toast.show("Incolla prima il CSV del calendario.", "error", 3000);
      return;
    }

    this.importingCalendar.set(true);

    try {
      const rows = this.parseFixturesCsv(this.calendarCsv);
      const count = await this.data.importFixturesFromRows(rows);

      this.toast.show(
        `${count} partite importate/aggiornate.`,
        "success",
        3000,
      );
      this.calendarCsv = "";
    } catch (error) {
      console.error("Errore import calendario:", error);
      this.toast.show("CSV non valido o import non riuscito.", "error", 3000);
    } finally {
      this.importingCalendar.set(false);
    }
  }

  fixtureDate(fixture: Fixture): Date {
    const kickoffAt: any = fixture.kickoffAt;

    if (kickoffAt?.toDate) {
      return kickoffAt.toDate();
    }

    return new Date(kickoffAt);
  }

  async closeRound(round: number): Promise<void> {
    this.updatingRound.set(round);

    try {
      await this.data.closeRound(round);

      this.toast.show(
        `Giornata ${round} chiusa correttamente.`,
        "success",
        3000,
      );
    } catch (error) {
      console.error("Errore chiusura giornata:", error);

      this.toast.show(
        `Impossibile chiudere la giornata ${round}.`,
        "error",
        3000,
      );
    } finally {
      this.updatingRound.set(null);
    }
  }

  async reopenRound(round: number): Promise<void> {
    this.updatingRound.set(round);

    try {
      await this.data.reopenRound(round);

      this.toast.show(
        `Giornata ${round} riaperta correttamente.`,
        "success",
        3000,
      );
    } catch (error) {
      console.error("Errore riapertura giornata:", error);

      this.toast.show(
        `Impossibile riaprire la giornata ${round}.`,
        "error",
        3000,
      );
    } finally {
      this.updatingRound.set(null);
    }
  }

  filteredRules() {
    return this.rules.filter((rule) => rule.scope === this.eventScope);
  }

  setEventScope(scope: "match" | "seasonal"): void {
    if (this.eventScope === scope) {
      return;
    }

    this.eventScope = scope;
    this.ruleIds = [];

    if (scope === "match") {
      this.seasonalTeam = "";
      return;
    }

    this.selFixture = undefined;
    this.selTeam = "";
  }

  filteredBonusRules() {
    return this.filteredRules().filter((rule) => rule.category === "bonus");
  }

  filteredMalusRules() {
    return this.filteredRules().filter((rule) => rule.category === "malus");
  }
}
