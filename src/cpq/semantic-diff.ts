export type SemanticChange = { path: string; before: unknown; after: unknown };
export function semanticChanges(
  before: unknown,
  after: unknown,
  path = "definition",
): SemanticChange[] {
  if (JSON.stringify(before) === JSON.stringify(after)) return [];
  if (
    Array.isArray(before) &&
    Array.isArray(after) &&
    [...before, ...after].every(
      (x) => x && typeof x === "object" && typeof x.key === "string",
    )
  ) {
    const keys = [...new Set([...before, ...after].map((x) => x.key))].sort();
    const result = keys.flatMap((key) =>
      semanticChanges(
        before.find((x) => x.key === key),
        after.find((x) => x.key === key),
        `${path}.${key}`,
      ),
    );
    if (
      before.map((x) => x.key).join(",") !==
        after.map((x) => x.key).join(",") &&
      keys.length === before.length &&
      keys.length === after.length
    )
      result.push({
        path: `${path}.order`,
        before: before.map((x) => x.key),
        after: after.map((x) => x.key),
      });
    return result;
  }
  if (
    before &&
    after &&
    typeof before === "object" &&
    typeof after === "object" &&
    !Array.isArray(before) &&
    !Array.isArray(after)
  ) {
    const a = before as Record<string, unknown>,
      b = after as Record<string, unknown>;
    return [...new Set([...Object.keys(a), ...Object.keys(b)])]
      .sort()
      .flatMap((key) => semanticChanges(a[key], b[key], `${path}.${key}`));
  }
  return [{ path, before: before ?? null, after: after ?? null }];
}
