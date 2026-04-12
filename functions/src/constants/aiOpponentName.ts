export const AI_FIRST_NAMES = [
  "tom",
  "mike",
  "alex",
  "leo",
  "noah",
  "luca",
  "ben",
  "jonas",
  "felix",
  "max",
  "nico",
  "david",
  "sami",
  "finn",
  "timo",
];

export function getRandomAiFirstName(random: () => number = Math.random): string {
  const index = Math.floor(random() * AI_FIRST_NAMES.length);
  return AI_FIRST_NAMES[index] || "tom";
}

export function buildAiOpponentName(customElo?: number, random: () => number = Math.random): string {
  const baseName = `ki-${getRandomAiFirstName(random)}`;
  if (typeof customElo === "number") {
    return `${baseName} (ELO ${customElo})`;
  }
  return baseName;
}