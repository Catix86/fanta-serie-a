import { AsyncPipe } from "@angular/common";
import { Component, inject, signal } from "@angular/core";
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

  vm$ = combineLatest([
    this.data.users$(),
    this.data.fixtures$(),
    this.data.lineups$(),
    this.data.events$(),
    this.data.leagueMatches$(),
  ]).pipe(
    map(([users, fixtures, lineups, events, leagueMatches]) => {
      const usersMap = new Map(users.map((user) => [user.uid, user]));

      const rounds = Array.from(
        new Set(fixtures.map((fixture) => fixture.round)),
      ).sort((a, b) => a - b);

      const firstAvailableRound = rounds[0] ?? null;

      if (this.selectedRound() === null && firstAvailableRound !== null) {
        this.selectedRound.set(firstAvailableRound);
      }

      const currentRound = this.selectedRound() ?? firstAvailableRound;

      const matches = leagueMatches
        .filter((match) => match.round === currentRound)
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
        matches,
      };
    }),
  );

  selectRound(round: number): void {
    this.selectedRound.set(round);
  }
}
