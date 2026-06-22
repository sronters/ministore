const replacements: Record<string, string> = {
  ё: "е",
  й: "и",
  "2,5": "2.5",
  "3,2": "3.2"
};

export function normalizeText(value: string): string {
  return value
    .toLocaleLowerCase("ru")
    .replace(/[ёй]|2,5|3,2/g, (match) => replacements[match] ?? match)
    .replace(/[^a-zа-я0-9. ]/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function fuzzyIncludes(source: string, query: string): boolean {
  const normalizedSource = normalizeText(source);
  const normalizedQuery = normalizeText(query);
  if (!normalizedQuery) return true;
  if (normalizedSource.includes(normalizedQuery)) return true;

  return normalizedQuery.split(" ").every((part) => {
    if (normalizedSource.includes(part)) return true;
    return normalizedSource.split(" ").some((word) => levenshtein(word, part) <= 1 && part.length > 3);
  });
}

function levenshtein(left: string, right: string): number {
  const dp = Array.from({ length: left.length + 1 }, (_, row) =>
    Array.from({ length: right.length + 1 }, (_, col) => (row === 0 ? col : col === 0 ? row : 0))
  );

  for (let row = 1; row <= left.length; row += 1) {
    for (let col = 1; col <= right.length; col += 1) {
      const cost = left[row - 1] === right[col - 1] ? 0 : 1;
      dp[row][col] = Math.min(dp[row - 1][col] + 1, dp[row][col - 1] + 1, dp[row - 1][col - 1] + cost);
    }
  }

  return dp[left.length][right.length];
}
