import { Injectable, inject } from "@angular/core";
import {
  Auth,
  createUserWithEmailAndPassword,
  deleteUser,
  signInWithEmailAndPassword,
  signOut,
  user,
} from "@angular/fire/auth";
import {
  Firestore,
  doc,
  docData,
  serverTimestamp,
  setDoc,
} from "@angular/fire/firestore";
import { Observable, of, switchMap } from "rxjs";
import { AppUser } from "../models";
import { rosterCost } from "../constants/serie-a-teams";
@Injectable({ providedIn: "root" })
export class AuthService {
  private auth = inject(Auth);
  private db = inject(Firestore);
  firebaseUser$ = user(this.auth);
  appUser$: Observable<AppUser | null> = this.firebaseUser$.pipe(
    switchMap((u) =>
      u
        ? (docData(doc(this.db, `users/${u.uid}`)) as Observable<AppUser>)
        : of(null),
    ),
  );

  email(username: string): string {
    const normalizedUsername = username
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9._-]/g, "");

    if (!normalizedUsername || normalizedUsername.length < 3) {
      throw new Error("USERNAME_NON_VALIDO");
    }

    return `${normalizedUsername}@fantaseriea.app`;
  }

  async register(
    username: string,
    password: string,
    teamName: string,
    roster: string[],
  ): Promise<void> {
    const credential = await createUserWithEmailAndPassword(
      this.auth,
      this.email(username),
      password,
    );

    try {
      await setDoc(doc(this.db, `users/${credential.user.uid}`), {
        uid: credential.user.uid,
        username: username.trim(),
        role: "player",
        teamName: teamName.trim(),
        roster,
        budgetUsed: rosterCost(roster),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      await deleteUser(credential.user);
      throw error;
    }
  }

  login(username: string, password: string) {
    return signInWithEmailAndPassword(
      this.auth,
      this.email(username),
      password,
    );
  }
  logout() {
    return signOut(this.auth);
  }
}
