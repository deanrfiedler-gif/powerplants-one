import { AppError } from "../platform/errors";
import { object } from "../shared/validation";
import type { SearchResults } from "./model";

export type SearchSource = {
  kind: string; path: string; label: "display_name" | "description" | "title" | "summary";
  read: (query: { q: string; limit: string }) => Promise<{ items: Record<string, unknown>[]; next_cursor: unknown }>;
};
export function searchQuery(input: unknown) {
  const value = object(input, ["q"]).q;
  if (typeof value !== "string" || value.trim().length < 2 || value.length > 200 || /[\u0000-\u001f\u007f]/.test(value))
    throw new AppError(422, "InvalidSearch", "Enter between 2 and 200 characters.");
  return value.trim();
}
export async function collectSearch(q: string, sources: SearchSource[]): Promise<SearchResults> {
  const result: SearchResults = { items: [], has_more: false, limit_per_type: 5 };
  // Reuse record readers, including their current grants and row-level projections.
  // Sequential domains keep this read from fanning out across the hosted pool.
  for (const source of sources) {
    try {
      const page = await source.read({ q, limit: "5" });
      result.has_more ||= !!page.next_cursor || page.items.length > 5;
      for (const row of page.items.slice(0, 5)) {
        if (typeof row.id !== "string" || typeof row[source.label] !== "string") continue;
        result.items.push({ id: `${source.kind}:${row.id}`, label: row[source.label] as string,
          reference: typeof row.display_number === "string" ? row.display_number : "",
          kind: source.kind, href: `${source.path}/${encodeURIComponent(row.id)}` });
      }
    } catch (error) {
      // A denied domain contributes no data. An outage must never look like no matches.
      if (!(error instanceof AppError && error.status === 403)) throw error;
    }
  }
  return result;
}
