import { AsyncPipe } from "@angular/common";
import { Component, inject } from "@angular/core";
import { Router } from "@angular/router";
import { combineLatest, map } from "rxjs";
import { FormsModule } from "@angular/forms";
import { signal } from "@angular/core";
import { ToastService } from "../../core/services/toast.service";
import { AuthService } from "../../core/services/auth.service";
import { DataService } from "../../core/services/data.service";
import { getSerieATeamLogo } from "../../core/constants/serie-a-team-logos";
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
  imports: [AsyncPipe, FormsModule],
  templateUrl: "./profile.component.html",
  styleUrl: "./profile.component.scss",
})
export class ProfileComponent {
  private auth = inject(AuthService);
  private data = inject(DataService);
  private router = inject(Router);
  private toast = inject(ToastService);

  changePasswordOpen = signal(false);
  changingPassword = signal(false);

  currentPassword = "";
  newPassword = "";
  confirmNewPassword = "";

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

  openChangePassword(): void {
    this.currentPassword = "";
    this.newPassword = "";
    this.confirmNewPassword = "";
    this.changePasswordOpen.set(true);
  }

  closeChangePassword(): void {
    this.changePasswordOpen.set(false);
  }

  async submitPasswordChange(): Promise<void> {
    if (
      !this.currentPassword ||
      !this.newPassword ||
      !this.confirmNewPassword
    ) {
      this.toast.show("Compila tutti i campi password.", "error", 3000);
      return;
    }

    if (this.newPassword.length < 6) {
      this.toast.show(
        "La nuova password deve avere almeno 6 caratteri.",
        "error",
        3000,
      );
      return;
    }

    if (this.newPassword !== this.confirmNewPassword) {
      this.toast.show("Le nuove password non coincidono.", "error", 3000);
      return;
    }

    this.changingPassword.set(true);

    try {
      await this.auth.changePassword(this.currentPassword, this.newPassword);

      this.toast.show("Password aggiornata correttamente.", "success", 3000);
      this.closeChangePassword();
    } catch (error: any) {
      console.error("Errore cambio password:", error);

      const code = error?.code;

      if (
        code === "auth/wrong-password" ||
        code === "auth/invalid-credential"
      ) {
        this.toast.show("Password attuale non corretta.", "error", 3000);
      } else if (code === "auth/weak-password") {
        this.toast.show("La nuova password è troppo debole.", "error", 3000);
      } else if (code === "auth/requires-recent-login") {
        this.toast.show(
          "Sessione scaduta. Effettua nuovamente il login.",
          "error",
          3000,
        );
      } else {
        this.toast.show("Password non aggiornata.", "error", 3000);
      }
    } finally {
      this.changingPassword.set(false);
    }
  }

  teamLogo(teamName: string): string {
    return getSerieATeamLogo(teamName);
  }
}
