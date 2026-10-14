const keys = ["q", "kind", "state", "lifecycle"] as const;

/** UI return state never becomes an extra API filter or an arbitrary redirect. */
export function catalogueQuery(params: Pick<URLSearchParams, "get">) {
  const query = new URLSearchParams();
  for (const key of keys) {
    const value = params.get(key);
    if (value) query.set(key, value);
  }
  return query.toString();
}
export type CatalogueReturn = {
  scope: string;
  query: string;
  selected: string;
  scroll: number;
};
export function readCatalogueReturn(
  raw: string | null,
  scope: string,
): CatalogueReturn | null {
  try {
    const value = JSON.parse(raw ?? "null");
    if (
      !value ||
      value.scope !== scope ||
      typeof value.query !== "string" ||
      value.query !== catalogueQuery(new URLSearchParams(value.query)) ||
      !/^[a-f0-9-]{36}$/i.test(value.selected) ||
      !Number.isFinite(value.scroll) ||
      value.scroll < 0 ||
      value.scroll > 500000
    )
      return null;
    return value;
  } catch {
    return null;
  }
}
export function catalogueHref(query: string) {
  const safe = catalogueQuery(new URLSearchParams(query));
  return `/products${safe ? `?${safe}` : ""}`;
}
