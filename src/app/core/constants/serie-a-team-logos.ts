export const SERIE_A_TEAM_LOGOS: Record<string, string> = {
  Atalanta: "assets/serie-a-logos/atalanta.png",
  Bologna: "assets/serie-a-logos/bologna.png",
  Cagliari: "assets/serie-a-logos/cagliari.png",
  Como: "assets/serie-a-logos/como.png",
  Fiorentina: "assets/serie-a-logos/fiorentina.png",
  Frosinone: "assets/serie-a-logos/frosinone.png",
  Genoa: "assets/serie-a-logos/genoa.png",
  Inter: "assets/serie-a-logos/inter.png",
  Juventus: "assets/serie-a-logos/juventus.png",
  Lazio: "assets/serie-a-logos/lazio.png",
  Lecce: "assets/serie-a-logos/lecce.png",
  Milan: "assets/serie-a-logos/milan.png",
  Monza: "assets/serie-a-logos/monza.png",
  Napoli: "assets/serie-a-logos/napoli.png",
  Parma: "assets/serie-a-logos/parma.png",
  Roma: "assets/serie-a-logos/roma.png",
  Sassuolo: "assets/serie-a-logos/sassuolo.png",
  Torino: "assets/serie-a-logos/torino.png",
  Udinese: "assets/serie-a-logos/udinese.png",
  Venezia: "assets/serie-a-logos/venezia.png",
};

export function getSerieATeamLogo(teamName: string): string {
  return SERIE_A_TEAM_LOGOS[teamName] ?? "assets/favicon.svg";
}
