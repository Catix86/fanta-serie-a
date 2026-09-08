import { Component, inject, signal } from "@angular/core";
import { FormBuilder, ReactiveFormsModule, Validators } from "@angular/forms";
import { Router } from "@angular/router";
import { AuthService, ToastService } from "../../core";
import { FirebaseError } from "firebase/app";

@Component({
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: "./login.component.html",
  styleUrl: "./auth.scss",
})
export class LoginComponent {
  fb = inject(FormBuilder);
  auth = inject(AuthService);
  router = inject(Router);
  toast = inject(ToastService);
  loading = signal(false);
  errorMessage = signal("");

  form = this.fb.nonNullable.group({
    username: ["", Validators.required],
    password: ["", Validators.required],
  });

  async submit() {
    console.log("submit", this.form.value);

    try {
      this.loading.set(true);

      await this.auth.login(
        this.form.value.username!,
        this.form.value.password!,
      );

      await this.router.navigateByUrl("/home");
    } catch (error: unknown) {
      const message = this.loginErrorMessage(error);
      console.error("Login error:", error, message);
      this.errorMessage.set(message);
      this.toast.show(message, "error", 4000);
    } finally {
      this.loading.set(false);
    }
  }

  goToRegister() {
    this.router.navigateByUrl("/register");
  }

  private loginErrorMessage(error: unknown): string {
    if (!(error instanceof FirebaseError)) {
      return "Si è verificato un errore imprevisto. Riprova.";
    }

    switch (error.code) {
      case "auth/invalid-credential":
      case "auth/wrong-password":
      case "auth/user-not-found":
        return "Nome utente o password non corretti.";

      case "auth/invalid-email":
        return "Il nome utente inserito non è valido.";

      case "auth/user-disabled":
        return "Questo account è stato disabilitato. Contatta l’amministratore.";

      case "auth/too-many-requests":
        return "Troppi tentativi di accesso. Attendi qualche minuto e riprova.";

      case "auth/network-request-failed":
        return "Problema di connessione. Controlla la rete e riprova.";

      case "auth/operation-not-allowed":
        return "L’accesso con password non è attivo. Contatta l’amministratore.";

      case "auth/internal-error":
        return "Firebase ha riscontrato un problema temporaneo. Riprova.";

      case "auth/invalid-api-key":
        return "Configurazione Firebase non valida.";

      default:
        return "Accesso non riuscito. Controlla i dati e riprova.";
    }
  }
}
