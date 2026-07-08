import { Component, inject, signal } from "@angular/core";
import { FormBuilder, ReactiveFormsModule, Validators } from "@angular/forms";
import { Router } from "@angular/router";
import { FormsModule } from "@angular/forms";
import {
  AuthService,
  getSerieATeamLogo,
  ToastService,
  INITIAL_BUDGET,
  ROSTER_SIZE,
  SERIE_A_TEAMS,
  rosterCost,
} from "../../core";

type RegistrationStep = "account" | "team";

@Component({
  standalone: true,
  imports: [ReactiveFormsModule, FormsModule],
  templateUrl: "./register.component.html",
  styleUrl: "./auth.scss",
})
export class RegisterComponent {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);
  private toast = inject(ToastService);

  teams = SERIE_A_TEAMS;
  budget = INITIAL_BUDGET;
  size = ROSTER_SIZE;

  maxUsernameLength = 16;
  maxTeamNameLength = 24;
  teamLogoUrl = "";
  teamLogoPreview = "";
  maxTeamLogoUrlLength = 500;

  currentStep = signal<RegistrationStep>("account");
  selected: string[] = [];
  loading = signal(false);

  form = this.fb.nonNullable.group({
    username: [
      "",
      [
        Validators.required,
        Validators.minLength(3),
        Validators.maxLength(this.maxUsernameLength),
      ],
    ],
    password: ["", [Validators.required, Validators.minLength(6)]],
    teamName: [
      "",
      [
        Validators.required,
        Validators.minLength(3),
        Validators.maxLength(this.maxTeamNameLength),
      ],
    ],
  });

  goToTeamStep(): void {
    if (!this.canContinueToTeamStep()) {
      this.form.controls.username.markAsTouched();
      this.form.controls.password.markAsTouched();

      if (this.form.controls.username.hasError("maxlength")) {
        this.toast.show(
          `Username troppo lungo. Massimo ${this.maxUsernameLength} caratteri.`,
          "error",
          3000,
        );

        return;
      }

      this.toast.show(
        "Inserisci username e password prima di continuare.",
        "error",
        3000,
      );

      return;
    }

    this.currentStep.set("team");
  }

  goToAccountStep(): void {
    this.currentStep.set("account");
  }

  toggle(teamName: string): void {
    if (this.isSelected(teamName)) {
      this.selected = this.selected.filter((team) => team !== teamName);
      return;
    }

    if (this.selected.length >= this.size) {
      this.toast.show(
        `Hai già selezionato ${this.size} squadre. Deselezionane una per cambiarla.`,
        "error",
        3000,
      );

      return;
    }

    this.selected = [...this.selected, teamName];

    if (this.selected.length === this.size) {
      this.toast.show(
        `Hai selezionato tutte le ${this.size} squadre disponibili.`,
        "success",
        3000,
      );
    }
  }

  isSelected(teamName: string): boolean {
    return this.selected.includes(teamName);
  }

  cost(): number {
    return rosterCost(this.selected);
  }

  remainingBudget(): number {
    return this.budget - this.cost();
  }

  selectedCount(): number {
    return this.selected.length;
  }

  canSelectMoreTeams(): boolean {
    return this.selected.length < this.size;
  }

  isOverBudget(): boolean {
    return this.cost() > this.budget;
  }

  goToBack(): void {
    this.router.navigateByUrl("/login");
  }

  canSave(): boolean {
    return (
      this.form.valid &&
      this.selected.length === this.size &&
      this.cost() <= this.budget &&
      this.isValidImageUrl(this.teamLogoUrl) &&
      this.teamLogoUrl.length <= this.maxTeamLogoUrlLength
    );
  }

  async submit(): Promise<void> {
    if (!this.canSave()) {
      if (this.form.invalid) {
        if (this.form.controls.username.hasError("maxlength")) {
          this.currentStep.set("account");

          this.toast.show(
            `Username troppo lungo. Massimo ${this.maxUsernameLength} caratteri.`,
            "error",
            3000,
          );

          return;
        }

        if (this.form.controls.teamName.hasError("maxlength")) {
          this.currentStep.set("team");

          this.toast.show(
            `Nome team troppo lungo. Massimo ${this.maxTeamNameLength} caratteri.`,
            "error",
            3000,
          );

          return;
        }

        this.currentStep.set("account");
        this.form.markAllAsTouched();
        this.toast.show("Compila tutti i campi richiesti.", "error", 3000);

        return;
      }

      if (this.selected.length !== this.size) {
        this.currentStep.set("team");
        this.toast.show(
          `Devi selezionare esattamente ${this.size} squadre.`,
          "error",
          3000,
        );

        return;
      }

      if (this.cost() > this.budget) {
        this.currentStep.set("team");
        this.toast.show(
          `Budget superato di ${this.cost() - this.budget} FC.`,
          "error",
          3000,
        );

        return;
      }

      if (!this.isValidImageUrl(this.teamLogoUrl)) {
        this.currentStep.set("team");
        this.toast.show("Inserisci una URL logo valida.", "error", 3000);
        return;
      }

      if (this.teamLogoUrl.length > this.maxTeamLogoUrlLength) {
        this.currentStep.set("team");
        this.toast.show(
          `URL logo troppo lunga. Massimo ${this.maxTeamLogoUrlLength} caratteri.`,
          "error",
          3000,
        );
        return;
      }

      this.toast.show("Registrazione non valida.", "error", 3000);
      return;
    }

    try {
      this.loading.set(true);

      const value = this.form.getRawValue();

      await this.auth.register(
        value.username,
        value.password,
        value.teamName,
        this.selected,
        this.teamLogoUrl,
      );

      await this.router.navigateByUrl("/home");
    } catch (error: any) {
      console.error("Errore registrazione:", error);

      const code = error?.code;
      const message = error?.message;

      if (message === "USERNAME_NON_VALIDO") {
        this.toast.show(
          "Username non valido. Usa almeno 3 caratteri.",
          "error",
          3000,
        );
      } else if (code === "auth/email-already-in-use") {
        this.toast.show("Username già registrato.", "error", 3000);
      } else if (code === "auth/invalid-email") {
        this.toast.show("Username non valido.", "error", 3000);
      } else if (code === "auth/weak-password") {
        this.toast.show(
          "Password troppo debole. Usa almeno 6 caratteri.",
          "error",
          3000,
        );
      } else if (code === "auth/operation-not-allowed") {
        this.toast.show(
          "Abilita Email/Password in Firebase Authentication.",
          "error",
          3000,
        );
      } else {
        this.toast.show(
          `Registrazione non riuscita: ${code || message || "errore sconosciuto"}`,
          "error",
          4000,
        );
      }
    } finally {
      this.loading.set(false);
    }
  }

  canContinueToTeamStep(): boolean {
    return (
      this.form.controls.username.valid && this.form.controls.password.valid
    );
  }

  teamLogo(teamName: string): string {
    return getSerieATeamLogo(teamName);
  }

  onTeamLogoUrlChange(value: string): void {
    this.teamLogoUrl = value.trim();
    this.teamLogoPreview = this.isValidImageUrl(this.teamLogoUrl)
      ? this.teamLogoUrl
      : "";
  }

  isValidImageUrl(value: string): boolean {
    if (!value) {
      return true;
    }

    try {
      const url = new URL(value);

      return url.protocol === "https:" || url.protocol === "http:";
    } catch {
      return false;
    }
  }

  onLogoPreviewError(): void {
    this.teamLogoPreview = "";
  }
}
