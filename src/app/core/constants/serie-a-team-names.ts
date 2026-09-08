const TEAM_NAME_ALIASES: Record<string, string> = {
  "as roma": "Roma",
  "As Roma": "Roma",
  roma: "Roma",

  "ac milan": "Milan",
  "Ac Milan": "Milan",
  milan: "Milan",

  "fc internazionale": "Inter",
  "internazionale": "Inter",
  "inter milan": "Inter",
  inter: "Inter",

  "ssc napoli": "Napoli",
  napoli: "Napoli",

  "atalanta bc": "Atalanta",
  atalanta: "Atalanta",

  "acf fiorentina": "Fiorentina",
  fiorentina: "Fiorentina",

  "ss lazio": "Lazio",
  lazio: "Lazio",

  "juventus fc": "Juventus",
  juventus: "Juventus",

  "bologna fc": "Bologna",
  "bologna fc 1909": "Bologna",
  bologna: "Bologna",

  "torino fc": "Torino",
  torino: "Torino",
};

export function normalizeSerieATeamName(
  teamName: string | null | undefined,
): string {
  const cleanedName = (teamName ?? "")
    .trim()
    .replace(/\s+/g, " ");

  if (!cleanedName) {
    return "";
  }

  return (
    TEAM_NAME_ALIASES[cleanedName.toLowerCase()] ??
    cleanedName
  );
}

export function sameSerieATeam(
  firstTeam: string | null | undefined,
  secondTeam: string | null | undefined,
): boolean {
  return (
    normalizeSerieATeamName(firstTeam) ===
    normalizeSerieATeamName(secondTeam)
  );
}