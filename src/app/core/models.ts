import { Timestamp } from "@angular/fire/firestore";

export type Role = "player" | "admin";

export interface AppUser {
  uid: string;
  username: string;
  role: Role;
  teamName: string;
  teamLogoUrl?: string;
  roster: string[];
  budgetUsed: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Fixture {
  id: string;
  round: number;
  homeTeam: string;
  awayTeam: string;
  kickoffAt: Timestamp;
}

export interface Lineup {
  id: string;
  uid: string;
  round: number;
  teams: string[];
  captainTeam: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export type TeamEventScope = "match" | "seasonal";

export interface TeamEvent {
  id: string;
  scope: TeamEventScope;
  fixtureId?: string;
  round?: number;
  teamName: string;
  ruleId: string;
  label: string;
  description: string;
  points: number;
  createdAt: Timestamp;
  createdBy: string;
}

export interface StandingRow {
  uid: string;
  username: string;
  teamName: string;
  fantasyPoints: number;
  leaguePoints: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  position: number;
}

export interface LeagueMatch {
  id: string;
  round: number;
  homeUid: string;
  awayUid: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface RoundSetting {
  id: string;
  round: number;
  status: "open" | "closed";
  closedAt?: Timestamp;
}

export interface RepairMarketSettings {
  id: string;
  isOpen: boolean;
  sessionId: string;
  openedAt?: Timestamp;
  closedAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface RepairMarketChange {
  id: string;
  sessionId: string;
  uid: string;
  originalRoster: string[];
  currentRoster: string[];
  changesUsed: number;
  updatedAt?: Timestamp;
}
