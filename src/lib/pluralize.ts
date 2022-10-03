// Need to edit this function? consider swapping for https://www.npmjs.com/package/pluralize
export function pluralize(word: string, count: number, inclusive?: boolean) {
  const rules = new Map<string, string>();
  rules.set("policy", "policies");
  const s = count !== 1 ? rules.get(word) || `${word}s` : word;
  return inclusive ? `${count} ${s}` : s;
}
