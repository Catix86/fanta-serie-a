import { AsyncPipe } from "@angular/common";
import { Component, inject, signal } from "@angular/core";
import { combineLatest, map } from "rxjs";

import {
  AppUser,
  DataService,
  Fixture,
  getSerieATeamLogo,
  rosterCost,
  SERIE_A_TEAMS,
  teamPrice,
  TeamEvent,
  toDate,
} from "../../core";

import { AuthService } from "../../core/services/auth.service";
import { SectionHeaderComponent } from "../../shared/components/section-header/section-header.component";

type SquadsViewMode = "fanta" | "serieA";

interface SerieATeamView {
  teamName: string;
  logoUrl: string;
  totalPoints: number;
  matchPoints: number;
  seasonalPoints: number;
  eventsCount: number;
}

interface SerieATeamEventView {
  id: string;
  label: string;
  points: number;
  category: "bonus" | "malus";
}

interface SerieAMatchEventsView {
  id: string;
  round: number;
  fixtureTitle: string;
  kickoffAt: Date | null;
  totalPoints: number;
  events: SerieATeamEventView[];
}

interface SeasonalTeamEventView {
  id: string;
  label: string;
  points: number;
  category: "bonus" | "malus";
}

interface SelectedSerieATeamView {
  teamName: string;
  logoUrl: string;
  totalPoints: number;
  matchPoints: number;
  seasonalPoints: number;
  matchGroups: SerieAMatchEventsView[];
  seasonalEvents: SeasonalTeamEventView[];
}

@Component({
  standalone: true,
  imports: [AsyncPipe, SectionHeaderComponent],
  templateUrl: "./squads.component.html",
  styleUrl: "./squads.component.scss",
})
export class SquadsComponent {
  private auth = inject(AuthService);
  private data = inject(DataService);

  viewMode = signal<SquadsViewMode>("fanta");

  selectedUser = signal<AppUser | null>(null);
  currentUser = signal<AppUser | null>(null);

  selectedSerieATeam = signal<SelectedSerieATeamView | null>(null);

  vm$ = combineLatest([
    this.auth.appUser$,
    this.data.users$(),
    this.data.fixtures$(),
    this.data.events$(),
  ]).pipe(
    map(([currentUser, users, fixtures, events]) => {
      this.currentUser.set(currentUser);
      
      const otherUsers = users
        // .filter((user) => user.uid !== currentUser?.uid)
        .filter((user) => user.roster?.length > 0)
        .sort((a, b) => a.teamName.localeCompare(b.teamName, "it"));

      const serieATeams: SerieATeamView[] = SERIE_A_TEAMS.map((team) => {
        const teamEvents = events.filter(
          (event) => event.teamName === team.name,
        );

        const matchPoints = teamEvents
          .filter((event) => event.scope !== "seasonal")
          .reduce((total, event) => total + Number(event.points), 0);

        const seasonalPoints = teamEvents
          .filter((event) => event.scope === "seasonal")
          .reduce((total, event) => total + Number(event.points), 0);

        return {
          teamName: team.name,
          logoUrl: getSerieATeamLogo(team.name),
          totalPoints: matchPoints + seasonalPoints,
          matchPoints,
          seasonalPoints,
          eventsCount: teamEvents.length,
        };
      }).sort((a, b) => {
        if (b.totalPoints !== a.totalPoints) {
          return b.totalPoints - a.totalPoints;
        }

        return a.teamName.localeCompare(b.teamName, "it");
      });

      return {
        currentUser,
        otherUsers,
        serieATeams,
        fixtures,
        events,
      };
    }),
  );

  setViewMode(mode: SquadsViewMode): void {
    this.viewMode.set(mode);

    this.closeUserSquad();
    this.closeSerieATeam();
  }

  openUserSquad(user: AppUser): void {
    this.selectedUser.set(user);
  }

  closeUserSquad(): void {
    this.selectedUser.set(null);
  }

  openSerieATeam(
    team: SerieATeamView,
    fixtures: Fixture[],
    events: TeamEvent[],
  ): void {
    const teamEvents = events.filter(
      (event) => event.teamName === team.teamName,
    );

    const matchEvents = teamEvents.filter(
      (event) => event.scope !== "seasonal",
    );

    const seasonalEvents = teamEvents
      .filter((event) => event.scope === "seasonal")
      .map((event) => ({
        id: event.id,
        label: event.label,
        points: Number(event.points),
        category: this.eventCategory(event),
      }))
      .sort((a, b) => a.label.localeCompare(b.label, "it"));

    const eventsByFixture = new Map<string, TeamEvent[]>();

    for (const event of matchEvents) {
      const fixture = this.resolveEventFixture(event, fixtures);

      const groupingKey = fixture?.id
        ? fixture.id
        : `round-${Number(event.round)}`;

      const currentEvents = eventsByFixture.get(groupingKey) ?? [];

      eventsByFixture.set(groupingKey, [...currentEvents, event]);
    }

    const matchGroups: SerieAMatchEventsView[] = Array.from(
      eventsByFixture.entries(),
    )
      .map(([groupingKey, groupedEvents]) => {
        const firstEvent = groupedEvents[0];

        const fixture = this.resolveEventFixture(firstEvent, fixtures);

        const round = Number(fixture?.round ?? firstEvent.round ?? 0);

        const eventViews = groupedEvents
          .map((event) => ({
            id: event.id,
            label: event.label,
            points: Number(event.points),
            category: this.eventCategory(event),
          }))
          .sort((a, b) => {
            if (b.points !== a.points) {
              return b.points - a.points;
            }

            return a.label.localeCompare(b.label, "it");
          });

        return {
          id: groupingKey,
          round,
          fixtureTitle: fixture
            ? `${fixture.homeTeam} - ${fixture.awayTeam}`
            : `Partita della giornata ${round}`,
          kickoffAt: fixture ? toDate(fixture.kickoffAt) : null,
          totalPoints: eventViews.reduce(
            (total, event) => total + event.points,
            0,
          ),
          events: eventViews,
        };
      })
      .sort((a, b) => {
        if (a.round !== b.round) {
          return b.round - a.round;
        }

        const dateA = a.kickoffAt?.getTime() ?? 0;
        const dateB = b.kickoffAt?.getTime() ?? 0;

        return dateB - dateA;
      });

    this.selectedSerieATeam.set({
      teamName: team.teamName,
      logoUrl: team.logoUrl,
      totalPoints: team.totalPoints,
      matchPoints: team.matchPoints,
      seasonalPoints: team.seasonalPoints,
      matchGroups,
      seasonalEvents,
    });
  }

  closeSerieATeam(): void {
    this.selectedSerieATeam.set(null);
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

  eventPointsLabel(points: number): string {
    return points > 0 ? `+${points}` : `${points}`;
  }

  trackEvent(event: SerieATeamEventView | SeasonalTeamEventView): string {
    return event.id;
  }

  private resolveEventFixture(
    event: TeamEvent,
    fixtures: Fixture[],
  ): Fixture | undefined {
    if (event.fixtureId) {
      const fixtureById = fixtures.find(
        (fixture) => fixture.id === event.fixtureId,
      );

      if (fixtureById) {
        return fixtureById;
      }
    }

    return fixtures.find(
      (fixture) =>
        Number(fixture.round) === Number(event.round) &&
        (fixture.homeTeam === event.teamName ||
          fixture.awayTeam === event.teamName),
    );
  }

  private eventCategory(event: TeamEvent): "bonus" | "malus" {
    return Number(event.points) >= 0 ? "bonus" : "malus";
  }
}
