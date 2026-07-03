export interface SerieATeam {
  name: string;
  price: number;
  tier: 1 | 2 | 3 | 4 | 5;
}

export const INITIAL_BUDGET = 100;
export const ROSTER_SIZE = 10;
export const LINEUP_SIZE = 6;

export const SERIE_A_TEAMS: SerieATeam[] = [
  { name: "Inter", price: 23, tier: 1 },
  { name: "Napoli", price: 20, tier: 1 },
  { name: "Roma", price: 18, tier: 2 },
  { name: "Juventus", price: 17, tier: 1 },
  { name: "Milan", price: 17, tier: 1 },
  { name: "Como", price: 15, tier: 2 },
  { name: "Atalanta", price: 13, tier: 2 },
  { name: "Lazio", price: 11, tier: 2 },
  { name: "Bologna", price: 9, tier: 2 },
  { name: "Fiorentina", price: 8, tier: 2 },
  { name: "Udinese", price: 7, tier: 3 },
  { name: "Sassuolo", price: 7, tier: 3 },
  { name: "Torino", price: 6, tier: 3 },
  { name: "Parma", price: 5, tier: 4 },
  { name: "Genoa", price: 5, tier: 3 },
  { name: "Cagliari", price: 4, tier: 4 },
  { name: "Lecce", price: 4, tier: 4 },
  { name: "Venezia", price: 4, tier: 4 },
  { name: "Frosinone", price: 4, tier: 5 },
  { name: "Monza", price: 4, tier: 5 },
];

export function teamPrice(name: string) {
  return SERIE_A_TEAMS.find((t) => t.name === name)?.price ?? 999;
}

export function rosterCost(teams: string[]) {
  return teams.reduce((s, t) => s + teamPrice(t), 0);
}
