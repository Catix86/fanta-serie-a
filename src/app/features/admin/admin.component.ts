import { Component, inject, signal } from "@angular/core";
import { AsyncPipe } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { DataService } from "../../core/services/data.service";
import {
  BONUS_RULES,
  BonusRule,
  RuleCategory,
  RuleScope,
} from "../../core/constants/bonus-rules";
import { Fixture, RepairMarketSettings } from "../../core/models";
import { ToastService } from "../../core/services/toast.service";
import { SectionHeaderComponent } from "../../shared/components/section-header/section-header.component";
import { SERIE_A_TEAMS } from "../../core/constants/serie-a-teams";
import { combineLatest, map, Observable } from "rxjs";

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
  eventScope: RuleScope = "match";
  seasonalTeam = "";
  teamsList = SERIE_A_TEAMS.map((team) => team.name);
  selectedRound: number | null = null;
  selectedRuleCategory: RuleCategory | null = null;

  repairMarketSettings$: Observable<RepairMarketSettings> =
    this.data.repairMarketSettings$();
  updatingRepairMarket = signal(false);

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
    if (!this.canSelectRules() || this.ruleIds.length === 0) {
      this.toast.show("Completa tutte le selezioni richieste.", "error", 3000);

      return;
    }

    const selectedRules = this.ruleIds
      .map((ruleId) => this.rules.find((rule) => rule.id === ruleId))
      .filter((rule): rule is BonusRule => Boolean(rule));

    const hasInvalidRule = selectedRules.some(
      (rule) =>
        rule.scope !== this.eventScope ||
        rule.category !== this.selectedRuleCategory,
    );

    if (hasInvalidRule) {
      this.toast.show(
        "La selezione contiene regole non compatibili.",
        "error",
        3000,
      );

      return;
    }

    if (this.eventScope === "seasonal" && this.ruleIds.length > 1) {
      this.toast.show(
        "Per un evento squadra puoi selezionare un solo bonus o malus.",
        "error",
        3000,
      );

      return;
    }

    try {
      const insertedEvents = this.ruleIds.length;

      if (this.eventScope === "match") {
        if (!this.selFixture || !this.selTeam) {
          return;
        }

        await this.data.addTeamEvents(
          this.selFixture,
          this.selTeam,
          this.ruleIds,
        );
      } else {
        if (!this.seasonalTeam) {
          return;
        }

        await this.data.addSeasonalTeamEvents(this.seasonalTeam, this.ruleIds);
      }

      this.toast.show(
        insertedEvents === 1
          ? "Evento inserito correttamente."
          : `${insertedEvents} eventi inseriti correttamente.`,
        "success",
        3000,
      );

      this.ruleIds = [];
    } catch (error) {
      console.error("Errore inserimento bonus/malus:", error);

      this.toast.show("Inserimento bonus/malus non riuscito.", "error", 3000);
    }
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

  filteredRules(): BonusRule[] {
    if (!this.selectedRuleCategory) {
      return [];
    }

    return this.rules.filter(
      (rule) =>
        rule.scope === this.eventScope &&
        rule.category === this.selectedRuleCategory,
    );
  }

  setEventScope(scope: RuleScope): void {
    if (this.eventScope === scope) {
      return;
    }

    this.eventScope = scope;

    this.selectedRound = null;
    this.selFixture = undefined;
    this.selTeam = "";
    this.seasonalTeam = "";
    this.selectedRuleCategory = null;
    this.ruleIds = [];
  }

  filteredBonusRules() {
    return this.filteredRules().filter((rule) => rule.category === "bonus");
  }

  filteredMalusRules() {
    return this.filteredRules().filter((rule) => rule.category === "malus");
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

  ruleQuantity(ruleId: string): number {
    return this.ruleIds.filter((id) => id === ruleId).length;
  }

  selectRule(ruleId: string): void {
    if (!this.canSelectRules()) {
      this.toast.show(
        "Completa prima tutte le selezioni richieste.",
        "error",
        3000,
      );

      return;
    }

    if (this.eventScope === "seasonal") {
      this.ruleIds = [ruleId];
      return;
    }

    this.ruleIds = [...this.ruleIds, ruleId];
  }

  incrementRule(ruleId: string): void {
    this.ruleIds = [...this.ruleIds, ruleId];
  }

  decrementRule(ruleId: string): void {
    if (this.eventScope !== "match") {
      if (this.ruleIds.includes(ruleId)) {
        this.ruleIds = [];
      }

      return;
    }

    const ruleIndex = this.ruleIds.lastIndexOf(ruleId);

    if (ruleIndex < 0) {
      return;
    }

    this.ruleIds = this.ruleIds.filter((_, index) => index !== ruleIndex);
  }

  isRuleSelected(ruleId: string): boolean {
    return this.ruleIds.includes(ruleId);
  }

  selectedRulesCount(): number {
    return this.ruleIds.length;
  }

  selectedDistinctRulesCount(): number {
    return new Set(this.ruleIds).size;
  }

  openRoundsVm$ = combineLatest([
    this.fixtures$,
    this.data.roundSettings$(),
  ]).pipe(
    map(([fixtures, roundSettings]) => {
      const closedRounds = new Set(
        roundSettings
          .filter((setting) => setting.status === "closed")
          .map((setting) => Number(setting.round)),
      );

      const rounds = Array.from(
        new Set(
          fixtures
            .map((fixture) => Number(fixture.round))
            .filter((round) => Number.isFinite(round)),
        ),
      )
        .filter((round) => !closedRounds.has(round))
        .sort((a, b) => a - b);

      return rounds.map((round) => {
        const roundFixtures = fixtures
          .filter((fixture) => Number(fixture.round) === round)
          .sort(
            (a, b) =>
              this.fixtureDate(a).getTime() - this.fixtureDate(b).getTime(),
          );

        return {
          round,
          firstKickoff: roundFixtures[0]
            ? this.fixtureDate(roundFixtures[0])
            : null,
        };
      });
    }),
  );

  roundOptionLabel(round: number, firstKickoff: Date | null): string {
    const roundLabel = `${round}ª giornata`;

    if (!firstKickoff) {
      return roundLabel;
    }

    const dateLabel = new Intl.DateTimeFormat("it-IT", {
      day: "2-digit",
      month: "short",
    })
      .format(firstKickoff)
      .replace(".", "");

    return `${roundLabel} - ${dateLabel}`;
  }

  fixturesForSelectedRound(fixtures: Fixture[]): Fixture[] {
    if (this.selectedRound === null) {
      return [];
    }

    return fixtures
      .filter((fixture) => Number(fixture.round) === this.selectedRound)
      .sort(
        (a, b) => this.fixtureDate(a).getTime() - this.fixtureDate(b).getTime(),
      );
  }

  onRoundChange(round: number | null): void {
    this.selectedRound = round;
    this.selFixture = undefined;
    this.selTeam = "";
    this.selectedRuleCategory = null;
    this.ruleIds = [];
  }

  onFixtureChange(fixture: Fixture | undefined): void {
    this.selFixture = fixture;
    this.selTeam = "";
    this.selectedRuleCategory = null;
    this.ruleIds = [];
  }

  onMatchTeamChange(teamName: string): void {
    this.selTeam = teamName;
    this.selectedRuleCategory = null;
    this.ruleIds = [];
  }

  onSeasonalTeamChange(teamName: string): void {
    this.seasonalTeam = teamName;
    this.selectedRuleCategory = null;
    this.ruleIds = [];
  }

  setRuleCategory(category: RuleCategory): void {
    if (this.selectedRuleCategory === category) {
      return;
    }

    this.selectedRuleCategory = category;
    this.ruleIds = [];
  }

  canSelectRules(): boolean {
    if (!this.selectedRuleCategory) {
      return false;
    }

    if (this.eventScope === "match") {
      return Boolean(
        this.selectedRound !== null && this.selFixture && this.selTeam,
      );
    }

    return Boolean(this.seasonalTeam);
  }
}
