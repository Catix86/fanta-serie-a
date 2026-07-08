import { Component, inject, signal } from "@angular/core";
import { FormBuilder, ReactiveFormsModule, Validators } from "@angular/forms";
import { Router } from "@angular/router";
import { AuthService, ToastService } from "../../core";

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

  form = this.fb.nonNullable.group({
    username: ["", Validators.required],
    password: ["", Validators.required],
  });

  async submit() {
    try {
      this.loading.set(true);
      await this.auth.login(
        this.form.value.username!,
        this.form.value.password!,
      );
      await this.router.navigateByUrl("/home");
    } catch {
      this.toast.show("Credenziali non valide", "error");
    } finally {
      this.loading.set(false);
    }
  }

  goToRegister() {
    this.router.navigateByUrl("/register");
  }
}
