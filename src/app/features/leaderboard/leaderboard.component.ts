import { AsyncPipe } from "@angular/common";
import { Component, inject, signal } from "@angular/core";
import { combineLatest, map } from "rxjs";
import { SectionHeaderComponent } from "../../shared/components/section-header/section-header.component";
import { DataService } from "../../core/services/data.service";
import { standings } from "../../core/utils/scoring";

type LeaderboardTab = "fantasy" | "league";

@Component({
  standalone: true,
  imports: [AsyncPipe, SectionHeaderComponent],
  templateUrl: "./leaderboard.component.html",
  styleUrl: "./leaderboard.component.scss",
})
export class LeaderboardComponent {
  private data = inject(DataService);

  activeTab = signal<LeaderboardTab>("fantasy");

  vm$ = combineLatest([
    this.data.users$(),
    this.data.fixtures$(),
    this.data.lineups$(),
    this.data.events$(),
    this.data.leagueMatches$(),
    this.data.roundSettings$(),
  ]).pipe(
    map(([users, fixtures, lineups, events, leagueMatches, roundSettings]) => {
      const rows = standings(users, fixtures, lineups, events, leagueMatches, roundSettings);

      return {
        fantasy: rows,
        league: [...rows].sort((a, b) => {
          if (b.leaguePoints !== a.leaguePoints) {
            return b.leaguePoints - a.leaguePoints;
          }

          const bGoalDifference = b.goalsFor - b.goalsAgainst;
          const aGoalDifference = a.goalsFor - a.goalsAgainst;

          if (bGoalDifference !== aGoalDifference) {
            return bGoalDifference - aGoalDifference;
          }

          return b.goalsFor - a.goalsFor;
        }),
      };
    }),
  );

  setTab(tab: LeaderboardTab): void {
    this.activeTab.set(tab);
  }

  played(row: { wins: number; draws: number; losses: number }): number {
    return row.wins + row.draws + row.losses;
  }

  goalDifference(row: { goalsFor: number; goalsAgainst: number }): number {
    return row.goalsFor - row.goalsAgainst;
  }
}
