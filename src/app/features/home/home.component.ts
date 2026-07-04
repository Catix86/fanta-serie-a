import { AsyncPipe } from "@angular/common";
import { Component, DestroyRef, inject, signal } from "@angular/core";
import { Router } from "@angular/router";
import { interval, combineLatest, map } from "rxjs";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { SectionHeaderComponent } from "../../shared/components/section-header/section-header.component";
import { AuthService } from "../../core/services/auth.service";
import { DataService } from "../../core/services/data.service";
import { roundDeadline, standings, toDate } from "../../core/utils/scoring";

@Component({
  standalone: true,
  imports: [AsyncPipe, SectionHeaderComponent],
  templateUrl: "./home.component.html",
  styleUrl: "./home.component.scss",
})
export class HomeComponent {
  private auth = inject(AuthService);
  private data = inject(DataService);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);

  now = signal(Date.now());

  vm$ = combineLatest([
    this.auth.appUser$,
    this.data.users$(),
    this.data.fixtures$(),
    this.data.lineups$(),
    this.data.events$(),
  ]).pipe(
    map(([me, users, fixtures, lineups, events]) => {
      const table = standings(users, fixtures, lineups, events);
      const myStanding = me
        ? table.find((row) => row.uid === me.uid)
        : undefined;

      const nextFixtures = fixtures
        .filter((fixture) => fixture.status !== "finished")
        .sort(
          (a, b) =>
            toDate(a.kickoffAt).getTime() - toDate(b.kickoffAt).getTime(),
        );

      const nextRound = nextFixtures[0]?.round ?? null;
      const deadline = nextRound ? roundDeadline(fixtures, nextRound) : null;

      const hasLineup =
        Boolean(me) &&
        nextRound !== null &&
        lineups.some(
          (lineup) => lineup.uid === me?.uid && lineup.round === nextRound,
        );

      const lastFinishedRound = Math.max(
        0,
        ...fixtures
          .filter((fixture) => fixture.status === "finished")
          .map((fixture) => fixture.round),
      );

      const lastRoundFixtures = fixtures
        .filter((fixture) => fixture.round === lastFinishedRound)
        .sort(
          (a, b) =>
            toDate(a.kickoffAt).getTime() - toDate(b.kickoffAt).getTime(),
        );

      return {
        me,
        myStanding,
        nextRound,
        deadline,
        hasLineup,
        lastFinishedRound,
        lastRoundFixtures,
      };
    }),
  );

  constructor() {
    interval(1000)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.now.set(Date.now());
      });
  }

  countdown(deadline: Date | null): {
    days: string;
    hours: string;
    minutes: string;
    seconds: string;
  } {
    if (!deadline) {
      return {
        days: "--",
        hours: "--",
        minutes: "--",
        seconds: "--",
      };
    }

    const remainingMs = Math.max(0, deadline.getTime() - this.now());

    const totalSeconds = Math.floor(remainingMs / 1000);
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return {
      days: String(days).padStart(2, "0"),
      hours: String(hours).padStart(2, "0"),
      minutes: String(minutes).padStart(2, "0"),
      seconds: String(seconds).padStart(2, "0"),
    };
  }

  goToLineup(): void {
    this.router.navigateByUrl("/formazione");
  }

  goToProfile(): void {
    this.router.navigateByUrl("/profilo");
  }

  async logout(): Promise<void> {
    await this.auth.logout();
    await this.router.navigateByUrl("/login");
  }

  toDate(value: unknown): Date {
    return toDate(value);
  }
}
