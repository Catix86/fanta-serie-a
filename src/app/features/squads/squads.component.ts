import { AsyncPipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { combineLatest, map } from 'rxjs';

import { AppUser } from '../../core/models';
import { AuthService } from '../../core/services/auth.service';
import { DataService } from '../../core/services/data.service';
import {
  rosterCost,
  teamPrice
} from '../../core/constants/serie-a-teams';
import { getSerieATeamLogo } from '../../core/constants/serie-a-team-logos';
import { SectionHeaderComponent } from '../../shared/components/section-header/section-header.component';

@Component({
  standalone: true,
  imports: [AsyncPipe, SectionHeaderComponent],
  templateUrl: './squads.component.html',
  styleUrl: './squads.component.scss'
})
export class SquadsComponent {
  private auth = inject(AuthService);
  private data = inject(DataService);

  selectedUser = signal<AppUser | null>(null);

  vm$ = combineLatest([
    this.auth.appUser$,
    this.data.users$()
  ]).pipe(
    map(([currentUser, users]) => {
      const otherUsers = users
        .filter(user => user.roster?.length > 0)
        .sort((a, b) => a.teamName.localeCompare(b.teamName, 'it'));

      return {
        currentUser,
        otherUsers
      };
    })
  );

  openUserSquad(user: AppUser): void {
    this.selectedUser.set(user);
  }

  closeUserSquad(): void {
    this.selectedUser.set(null);
  }

  teamLogo(teamName: string): string {
    return getSerieATeamLogo(teamName);
  }

  teamPrice(teamName: string): number {
    return teamPrice(teamName);
  }

  rosterCost(teams: string[]): number {
    return rosterCost(teams);
  }
}