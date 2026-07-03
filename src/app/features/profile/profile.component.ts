import { AsyncPipe } from "@angular/common";
import { Component, inject } from "@angular/core";
import { Router } from "@angular/router";
import { combineLatest, map } from "rxjs";

import { AuthService } from "../../core/services/auth.service";
import { DataService } from "../../core/services/data.service";
import {
  SERIE_A_TEAMS,
  rosterCost,
  teamPrice,
} from "../../core/constants/serie-a-teams";
import {
  TeamColorConfig,
  getTeamColors,
} from "../../core/constants/serie-a-team-colors";
import { standings } from "../../core/utils/scoring";

@Component({
  standalone: true,
  imports: [AsyncPipe],
  templateUrl: "./profile.component.html",
  styleUrl: "./profile.component.scss",
})
export class ProfileComponent {
  private auth = inject(AuthService);
  private data = inject(DataService);
  private router = inject(Router);

  vm$ = combineLatest([
    this.auth.appUser$,
    this.data.users$(),
    this.data.fixtures$(),
    this.data.lineups$(),
    this.data.events$(),
  ]).pipe(
    map(([user, users, fixtures, lineups, events]) => {
      const table = standings(users, fixtures, lineups, events);
      const myStanding = user
        ? table.find((row) => row.uid === user.uid)
        : undefined;

      return {
        user,
        myStanding,
      };
    }),
  );

  rosterCost(teams: string[]): number {
    return rosterCost(teams);
  }

  teamPrice(teamName: string): number {
    return teamPrice(teamName);
  }

  teamColors(teamName: string): TeamColorConfig {
    return getTeamColors(teamName);
  }

  previousPlacement(teamName: string): number {
    const orderedTeams = [...SERIE_A_TEAMS].sort((a, b) => b.price - a.price);

    const index = orderedTeams.findIndex((team) => team.name === teamName);

    return index >= 0 ? index + 1 : 0;
  }

  async logout(): Promise<void> {
    await this.auth.logout();
    await this.router.navigateByUrl("/login");
  }
}
