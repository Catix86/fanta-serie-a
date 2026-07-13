import { inject } from "@angular/core";
import { CanActivateFn, Router } from "@angular/router";
import { map, take } from "rxjs";
import { AuthService } from "../services/auth.service";
import { Auth, authState } from "@angular/fire/auth";

export const adminGuard: CanActivateFn = () => {
  const a = inject(AuthService),
    r = inject(Router);

  return a.appUser$.pipe(
    take(1),
    map((u) => (u?.role === "admin" ? true : r.createUrlTree(["/home"]))),
  );
};

export const guestGuard: CanActivateFn = () => {
  const auth = inject(Auth);
  const router = inject(Router);

  return authState(auth).pipe(
    take(1),
    map((firebaseUser) => {
      return firebaseUser ? router.createUrlTree(["/home"]) : true;
    }),
  );
};
