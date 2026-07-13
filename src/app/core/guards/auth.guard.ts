import { inject } from "@angular/core";
import { CanActivateFn, Router } from "@angular/router";
import { Auth, authState } from "@angular/fire/auth";
import { map, take } from "rxjs";

export const authGuard: CanActivateFn = () => {
  const auth = inject(Auth);
  const router = inject(Router);

  return authState(auth).pipe(
    take(1),
    map((firebaseUser) => {
      return firebaseUser ? true : router.createUrlTree(["/login"]);
    }),
  );
};
