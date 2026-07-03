export interface SerieATeam { name:string; price:number; tier:1|2|3|4|5; }
export const INITIAL_BUDGET = 100;
export const ROSTER_SIZE = 10;
export const LINEUP_SIZE = 6;
export const SERIE_A_TEAMS: SerieATeam[] = [
 {name:'Inter',price:28,tier:1},{name:'Napoli',price:26,tier:1},{name:'Milan',price:25,tier:1},{name:'Juventus',price:25,tier:1},{name:'Atalanta',price:22,tier:2},{name:'Roma',price:21,tier:2},{name:'Lazio',price:20,tier:2},{name:'Fiorentina',price:18,tier:2},{name:'Bologna',price:18,tier:2},{name:'Como',price:17,tier:2},{name:'Torino',price:13,tier:3},{name:'Genoa',price:12,tier:3},{name:'Udinese',price:12,tier:3},{name:'Sassuolo',price:12,tier:3},{name:'Cagliari',price:10,tier:4},{name:'Parma',price:10,tier:4},{name:'Lecce',price:9,tier:4},{name:'Venezia',price:8,tier:4},{name:'Frosinone',price:7,tier:5},{name:'Monza',price:7,tier:5}
];
export function teamPrice(name:string){return SERIE_A_TEAMS.find(t=>t.name===name)?.price ?? 999;}
export function rosterCost(teams:string[]){return teams.reduce((s,t)=>s+teamPrice(t),0);}
