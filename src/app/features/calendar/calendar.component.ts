import { AsyncPipe } from "@angular/common";
import { Component, inject, signal } from "@angular/core";
import { toObservable } from "@angular/core/rxjs-interop";
import { combineLatest, map } from "rxjs";

import { DataService } from "../../core/services/data.service";
import { SectionHeaderComponent } from "../../shared/components/section-header/section-header.component";
import { leagueMatchResult } from "../../core/utils/scoring";

@Component({
  standalone: true,
  imports: [AsyncPipe, SectionHeaderComponent],
  templateUrl: "./calendar.component.html",
  styleUrl: "./calendar.component.scss",
})
export class CalendarComponent {
  private data = inject(DataService);

  selectedRound = signal<number | null>(null);
  private selectedRound$ = toObservable(this.selectedRound);

  vm$ = combineLatest([
    this.data.users$(),
    this.data.lineups$(),
    this.data.events$(),
    this.data.leagueMatches$(),
    this.data.roundSettings$(),
    this.selectedRound$,
  ]).pipe(
    map(
      ([
        users,
        lineups,
        events,
        leagueMatches,
        roundSettings,
        selectedRound,
      ]) => {
        const usersMap = new Map(users.map((user) => [user.uid, user]));

        const rounds = Array.from(
          new Set(
            leagueMatches
              .map((match) => Number(match.round))
              .filter((round) => Number.isFinite(round)),
          ),
        ).sort((a, b) => a - b);

        const firstRound = rounds[0] ?? null;

        const currentRound =
          selectedRound !== null && rounds.includes(selectedRound)
            ? selectedRound
            : firstRound;

        const roundSetting = roundSettings.find(
          (setting) => Number(setting.round) === currentRound,
        );

        const isClosed = roundSetting?.status === "closed";

        const matches = leagueMatches
          .filter((match) => Number(match.round) === currentRound)
          .sort((a, b) => a.id.localeCompare(b.id))
          .map((match) => {
            const result = leagueMatchResult(match, lineups, events);

            return {
              ...match,
              homeUser: usersMap.get(match.homeUid),
              awayUser: usersMap.get(match.awayUid),
              ...result,
            };
          });

        return {
          rounds,
          currentRound,
          isClosed,
          matches,
        };
      },
    ),
  );

  selectRound(round: number): void {
    this.selectedRound.set(round);
  }
}
