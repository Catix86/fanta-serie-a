export type RuleCategory = "attack" | "goal" | "defense" | "pop" | "malus" | "table";

export interface BonusRule {
  id: string;
  category: RuleCategory;
  points: number;
  label: string;
  description: string;
}

export const BONUS_RULES: BonusRule[] = [
  {
    id: "muso-corto",
    category: "attack",
    points: 2,
    label: "Muso corto",
    description: "Vittoria con un solo gol di scarto.",
  },
  {
    id: "goleada",
    category: "attack",
    points: 10,
    label: "Goleada",
    description: "La squadra segna con 3 o più gol di scarto.",
  },
  {
    id: "panchinaro-oro",
    category: "attack",
    points: 5,
    label: "Panchinaro d’oro",
    description: "Gol segnato da un subentrato dalla panchina.",
  },
  {
    id: "bolide",
    category: "goal",
    points: 5,
    label: "Bolide",
    description: "Gol da fuori area.",
  },
  {
    id: "incornata",
    category: "goal",
    points: 5,
    label: "Incornata",
    description: "Gol di testa.",
  },
  {
    id: "bastardone",
    category: "goal",
    points: 5,
    label: "Bastardone",
    description: "Gol a porta vuota.",
  },
  {
    id: "pennellata-vincente",
    category: "goal",
    points: 10,
    label: "Pennellata vincente",
    description: "Gol segnato direttamente da calcio punizione o angolo.",
  },
  {
    id: "rovesciata",
    category: "goal",
    points: 10,
    label: "Rovesciata",
    description: "Gol in rovesciata.",
  },
  {
    id: "doppietta",
    category: "goal",
    points: 20,
    label: "Doppietta",
    description: "Due gol segnati in una sola partita.",
  },
  {
    id: "tripletta",
    category: "goal",
    points: 30,
    label: "Tripletta",
    description: "Tre gol o più segnati in una sola partita.",
  },
  {
    id: "rigore-procurato",
    category: "attack",
    points: 3,
    label: "Rigore procurato",
    description: "Alla squadra viene assegnato un rigore.",
  },
  {
    id: "clean-sheet",
    category: "defense",
    points: 10,
    label: "Porta inviolata",
    description: "La squadra non subisce gol.",
  },
  {
    id: "rigore-parato",
    category: "defense",
    points: 5,
    label: "Ipnotizzatore",
    description: "Il portiere para un rigore.",
  },
  {
    id: "sorpresa",
    category: "pop",
    points: 15,
    label: "Sorpresa",
    description: "La squadra vince contro un avversario che ha più di 15 punti.",
  },
  {
    id: "legno",
    category: "pop",
    points: 3,
    label: "Il legno",
    description: "Un giocatore colpisce il palo o la traversa.",
  },
  {
    id: "esultanza-trash",
    category: "pop",
    points: 5,
    label: "Esultanza trash",
    description: "Esultanza memorabile o volgare.",
  },
  {
    id: "gioco-pulito",
    category: "pop",
    points: 5,
    label: "Gioco pulito",
    description: "La squadra non riceve ammonizioni o espulsioni.",
  },
  {
    id: "noia-mortale",
    category: "malus",
    points: -5,
    label: "Noia mortale",
    description: "La squadra pareggia 0-0.",
  },
  {
    id: "sconfitta",
    category: "malus",
    points: -5,
    label: "Sconfitta",
    description: "La squadra perde.",
  },
  {
    id: "autogol",
    category: "malus",
    points: -5,
    label: "Autogol",
    description: "Autogol di un proprio giocatore.",
  },
  {
    id: "imbarcata",
    category: "malus",
    points: -10,
    label: "Imbarcata",
    description: "La squadra perde subendo 3 o più gol.",
  },
  {
    id: "rosso",
    category: "malus",
    points: -10,
    label: "Rosso",
    description: "Cartellino rosso diretto a un giocatore.",
  },
  {
    id: "recidivo",
    category: "malus",
    points: -5,
    label: "Recidivo",
    description: "Cartellino rosso per somma di ammonizioni a un giocatore.",
  },
  {
    id: "ct-espulso",
    category: "malus",
    points: -15,
    label: "Allenatore espulso",
    description: "Espulsione dell’allenatore.",
  },
  {
    id: "rigore-fallito",
    category: "malus",
    points: -5,
    label: "Rigore fallito",
    description: "Rigore sbagliato o parato.",
  },
  {
    id: "illusione-var",
    category: "malus",
    points: -5,
    label: "Illusione VAR",
    description: "Gol annullato dopo verifica al monitor VAR dell'arbitro.",
  },
  {
    id: "invasione",
    category: "malus",
    points: -25,
    label: "Invasione di campo",
    description: "Tifoso in campo con maglia o bandiera.",
  },
  {
    id: "cagata-difensiva",
    category: "malus",
    points: -5,
    label: "Cagata difensiva",
    description: "Errore difensivo che porta al gol gli avversari.",
  },
  {
    id: "nervi-tesi",
    category: "malus",
    points: -10,
    label: "Nervi tesi",
    description: "Si verifica una rissa tra le due squadre in campo.",
  },
];

export function ruleById(id: string) {
  return BONUS_RULES.find((r) => r.id === id);
}
