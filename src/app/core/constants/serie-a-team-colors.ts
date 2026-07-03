export interface TeamColorConfig {
  primary: string;
  secondary: string;
  text: string;
}

export const SERIE_A_TEAM_COLORS: Record<string, TeamColorConfig> = {
  Inter: {
    primary: '#0057a8',
    secondary: '#050505',
    text: '#ffffff'
  },
  Milan: {
    primary: '#fb090b',
    secondary: '#050505',
    text: '#ffffff'
  },
  Juventus: {
    primary: '#ffffff',
    secondary: '#050505',
    text: '#020617'
  },
  Napoli: {
    primary: '#12a0d7',
    secondary: '#003c7a',
    text: '#ffffff'
  },
  Roma: {
    primary: '#8e1f2f',
    secondary: '#f0bc42',
    text: '#ffffff'
  },
  Lazio: {
    primary: '#87ceeb',
    secondary: '#ffffff',
    text: '#020617'
  },
  Atalanta: {
    primary: '#0057a6',
    secondary: '#050505',
    text: '#ffffff'
  },
  Fiorentina: {
    primary: '#5f249f',
    secondary: '#ffffff',
    text: '#ffffff'
  },
  Bologna: {
    primary: '#1b3a6b',
    secondary: '#a71930',
    text: '#ffffff'
  },
  Como: {
    primary: '#005bbb',
    secondary: '#ffffff',
    text: '#ffffff'
  },
  Torino: {
    primary: '#7c1d1d',
    secondary: '#3b0a0a',
    text: '#ffffff'
  },
  Genoa: {
    primary: '#ad1919',
    secondary: '#003d7c',
    text: '#ffffff'
  },
  Udinese: {
    primary: '#050505',
    secondary: '#ffffff',
    text: '#ffffff'
  },
  Sassuolo: {
    primary: '#0b8f43',
    secondary: '#050505',
    text: '#ffffff'
  },
  Cagliari: {
    primary: '#0033a0',
    secondary: '#d4001a',
    text: '#ffffff'
  },
  Parma: {
    primary: '#0046ad',
    secondary: '#fedb00',
    text: '#ffffff'
  },
  Lecce: {
    primary: '#e31b23',
    secondary: '#ffd100',
    text: '#ffffff'
  },
  Venezia: {
    primary: '#111111',
    secondary: '#ff6a00',
    text: '#ffffff'
  },
  Frosinone: {
    primary: '#005baa',
    secondary: '#ffd100',
    text: '#ffffff'
  },
  Monza: {
    primary: '#e30613',
    secondary: '#ffffff',
    text: '#ffffff'
  }
};

export function getTeamColors(teamName: string): TeamColorConfig {
  return SERIE_A_TEAM_COLORS[teamName] ?? {
    primary: '#334155',
    secondary: '#0f172a',
    text: '#ffffff'
  };
}