export type RuleCategory = "bonus" | "malus";
export type RuleScope = "match" | "seasonal";

export interface BonusRule {
  id: string;
  category: RuleCategory;
  scope: RuleScope;
  points: number;
  label: string;
  description: string;
}

export const BONUS_RULES: BonusRule[] = [
  {
    id: "muso-corto",
    category: "bonus",
    scope: "match",
    points: 2,
    label: "Muso corto",
    description: "Vittoria con un solo gol di scarto.",
  },
  {
    id: "legno",
    category: "bonus",
    scope: "match",
    points: 3,
    label: "Il legno",
    description: "Un giocatore colpisce il palo o la traversa.",
  },
  {
    id: "incornata",
    category: "bonus",
    scope: "match",
    points: 5,
    label: "Incornata",
    description: "Gol di testa.",
  },
  {
    id: "panchinaro-oro",
    category: "bonus",
    scope: "match",
    points: 5,
    label: "Panchinaro d’oro",
    description: "Gol segnato da un subentrato dalla panchina.",
  },
  {
    id: "bolide",
    category: "bonus",
    scope: "match",
    points: 5,
    label: "Bolide",
    description: "Gol da fuori area.",
  },
  {
    id: "goleada",
    category: "bonus",
    scope: "match",
    points: 10,
    label: "Goleada",
    description: "La squadra segna con 3 o più gol di scarto.",
  },
  {
    id: "clean-sheet",
    category: "bonus",
    scope: "match",
    points: 10,
    label: "Porta inviolata",
    description: "La squadra non subisce gol.",
  },
  {
    id: "bastardone",
    category: "bonus",
    scope: "match",
    points: 5,
    label: "Bastardone",
    description: "Gol a porta vuota.",
  },
  {
    id: "doppietta",
    category: "bonus",
    scope: "match",
    points: 20,
    label: "Doppietta",
    description: "Due gol segnati in una sola partita.",
  },
  {
    id: "rigore-procurato",
    category: "bonus",
    scope: "match",
    points: 3,
    label: "Rigore procurato",
    description: "Alla squadra viene assegnato un rigore.",
  },
  {
    id: "pennellata-vincente",
    category: "bonus",
    scope: "match",
    points: 10,
    label: "Pennellata vincente",
    description: "Gol segnato direttamente da calcio punizione o angolo.",
  },
  {
    id: "rovesciata",
    category: "bonus",
    scope: "match",
    points: 10,
    label: "Rovesciata",
    description: "Gol in rovesciata.",
  },
  {
    id: "rigore-parato",
    category: "bonus",
    scope: "match",
    points: 5,
    label: "Ipnotizzatore",
    description: "Il portiere para un rigore.",
  },
  {
    id: "sorpresa",
    category: "bonus",
    scope: "match",
    points: 15,
    label: "Sorpresa",
    description:
      "La squadra vince contro un avversario che ha più di 15 punti.",
  },
  {
    id: "tripletta",
    category: "bonus",
    scope: "match",
    points: 30,
    label: "Tripletta",
    description: "Tre gol o più segnati in una sola partita.",
  },
  {
    id: "gioco-pulito",
    category: "bonus",
    scope: "match",
    points: 5,
    label: "Gioco pulito",
    description: "La squadra non riceve ammonizioni o espulsioni.",
  },
];

export const MALUS_RULES: BonusRule[] = [
  {
    id: "sconfitta",
    category: "malus",
    scope: "match",
    points: -5,
    label: "Sconfitta",
    description: "La squadra perde.",
  },
  {
    id: "noia-mortale",
    category: "malus",
    scope: "match",
    points: -5,
    label: "Noia mortale",
    description: "La squadra pareggia 0-0.",
  },
  {
    id: "autogol",
    category: "malus",
    scope: "match",
    points: -5,
    label: "Autogol",
    description: "Autogol di un proprio giocatore.",
  },
  {
    id: "imbarcata",
    category: "malus",
    scope: "match",
    points: -10,
    label: "Imbarcata",
    description: "La squadra perde subendo 3 o più gol.",
  },
  {
    id: "rigore-fallito",
    category: "malus",
    scope: "match",
    points: -5,
    label: "Rigore fallito",
    description: "Rigore sbagliato o parato.",
  },
  {
    id: "illusione-var",
    category: "malus",
    scope: "match",
    points: -5,
    label: "Illusione VAR",
    description: "Gol annullato dopo verifica al monitor VAR dell'arbitro.",
  },
  {
    id: "cagata-difensiva",
    category: "malus",
    scope: "match",
    points: -5,
    label: "Cagata difensiva",
    description: "Errore difensivo che porta al gol gli avversari.",
  },
  {
    id: "rosso",
    category: "malus",
    scope: "match",
    points: -10,
    label: "Rosso",
    description: "Cartellino rosso diretto a un giocatore.",
  },
  {
    id: "recidivo",
    category: "malus",
    scope: "match",
    points: -5,
    label: "Recidivo",
    description: "Cartellino rosso per somma di ammonizioni a un giocatore.",
  },
  {
    id: "ct-espulso",
    category: "malus",
    scope: "match",
    points: -15,
    label: "Allenatore espulso",
    description: "Espulsione dell’allenatore.",
  },
  {
    id: "scenata",
    category: "malus",
    scope: "match",
    points: -5,
    label: "Scenata",
    description: "Il calciatore della squadra si arrabbia quando sostituito.",
  },
  {
    id: "nervi-tesi",
    category: "malus",
    scope: "match",
    points: -10,
    label: "Nervi tesi",
    description: "Si verifica una rissa tra le due squadre in campo.",
  },
  {
    id: "brutta-sorpresa",
    category: "malus",
    scope: "match",
    points: -15,
    label: "Brutta sorpresa",
    description:
      "La squadra perde contro un avversario che ha meno di 15 punti.",
  },
  {
    id: "esultanza-trash",
    category: "malus",
    scope: "match",
    points: 5,
    label: "Esultanza trash",
    description: "Esultanza memorabile o volgare.",
  },
  {
    id: "invasione",
    category: "malus",
    scope: "match",
    points: -25,
    label: "Invasione di campo",
    description: "Tifoso in campo con maglia o bandiera.",
  },
];

export const SEASONAL_RULES: BonusRule[] = [
  {
    id: "senza-sconfitte",
    category: "bonus",
    scope: "seasonal",
    points: 20,
    label: "Senza sconfitte",
    description: "La squadra non perde per 10 partite di fila.",
  },
  {
    id: "campione-di-inverno",
    category: "bonus",
    scope: "seasonal",
    points: 50,
    label: "Campione di inverno",
    description: "La squadra è in testa dopo il girone d'andata.",
  },
  {
    id: "striscia-vincente",
    category: "bonus",
    scope: "seasonal",
    points: 30,
    label: "Striscia vincente",
    description: "La squadra vince 10 partite di fila.",
  },
  {
    id: "senza-vittorie",
    category: "malus",
    scope: "seasonal",
    points: -20,
    label: "Senza vittorie",
    description: "La squadra non vince da 10 partite di fila.",
  },
  {
    id: "caprone-di-inverno",
    category: "malus",
    scope: "seasonal",
    points: -50,
    label: "Caprone di inverno",
    description: "La squadra è ultima dopo il girone d'andata.",
  },
  {
    id: "striscia-perdente",
    category: "malus",
    scope: "seasonal",
    points: -30,
    label: "Striscia perdente",
    description: "La squadra perde 10 partite di fila.",
  },
];

export const ALL_RULES: BonusRule[] = [
  ...BONUS_RULES,
  ...MALUS_RULES,
  ...SEASONAL_RULES,
];

export function ruleById(id: string) {
  return ALL_RULES.find((r) => r.id === id);
}
