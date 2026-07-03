import { Timestamp } from "@angular/fire/firestore";
export type Role = "player" | "admin";
export interface AppUser {
  uid: string;
  username: string;
  role: Role;
  teamName: string;
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
  status: "scheduled" | "live" | "finished";
  homeGoals?: number;
  awayGoals?: number;
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
export interface TeamEvent {
  id: string;
  fixtureId: string;
  round: number;
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
