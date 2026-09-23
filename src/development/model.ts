export type GuideSection = {
  section_id: string;
  title: string;
  paragraphs: string[];
  steps: string[];
  headers: string[];
  rows: string[][];
};
export type Guide = {
  guide_key: string;
  entry_key: string;
  title: string;
  status: string;
  revision: string;
  content_mode: string;
  source_commit: string;
  sections: GuideSection[];
  related_entry_keys: string[];
};
export type Entry = {
  key: string;
  title: string;
  kind: "scope" | "route" | "system";
  module: string;
  summary: string;
  path: string | null;
  source_paths: string[];
  guide_key: string | null;
  design_path: string;
  html_path: string | null;
  image_paths: string[];
  dependencies: string[];
  scope_status: string;
  visual_status: string;
  functional_status: string;
  deployment_status: string;
  review_fingerprint: string | null;
  reviewed_at: string | null;
  owner: string;
  build_rank: number | null;
  related_keys: string[];
};
export type Register = {
  schema_version: 1;
  title: string;
  source_baseline: string;
  local_base: string;
  live_base: string;
  shared_sources: string[];
  entries: Entry[];
};
export type Resource = {
  id: string;
  path: string;
  title: string;
  type: "markdown" | "html" | "image";
  sha256: string;
  missing: boolean;
  current: boolean;
  group: string;
  module: string | null;
};
export type CatalogEntry = Entry & {
  source_present: boolean;
  fingerprint: string;
  review_state: "Not reviewed" | "Current" | "Stale";
  guide_status: string;
  resources: Resource[];
  issues: string[];
};
export type Catalog = {
  schema_version: 1;
  title: string;
  observed_at: string;
  source_baseline: string;
  fingerprint: string;
  local_base: string;
  live_base: string;
  entries: CatalogEntry[];
  journeys: Resource[];
  tokens: { name: string; value: string }[];
  unregistered_routes: string[];
  errors: string[];
};

export function origin(value: string): string {
  const u = new URL(value);
  if (
    !["http:", "https:"].includes(u.protocol) ||
    u.username ||
    u.password ||
    u.search ||
    u.hash ||
    u.pathname !== "/"
  )
    throw Error(
      "Enter a server address without a page path, credentials or query.",
    );
  return u.origin;
}
export function resolveDestination(
  path: string,
  base: string,
  parameters: Record<string, string>,
): string | null {
  let valid = true;
  const resolved = path.replace(/\[([^\]]+)\]|\{([^}]+)\}/g, (_match, a, b) => {
    const key = String(a || b),
      value = parameters[key] || "";
    const ok =
      key === "view"
        ? [
            "configure",
            "parts",
            "pricing",
            "compare",
            "definition",
            "history",
          ].includes(value)
        : /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
            value,
          );
    if (!ok) valid = false;
    return encodeURIComponent(value);
  });
  if (!path.startsWith("/") || path.startsWith("//")) return null;
  return valid ? origin(base) + resolved : null;
}
export function matchEntry(entries: Entry[], pathname: string) {
  return (
    entries.find((e) => e.kind === "route" && e.path === pathname) ??
    entries
      .filter((e) => e.kind === "route" && e.path?.includes("["))
      .sort((a, b) => b.path!.length - a.path!.length)
      .find((e) => {
        const pattern = e.path!.split("/"),
          actual = pathname.split("/");
        return (
          pattern.length === actual.length &&
          pattern.every((p, i) =>
            p.startsWith("[") ? !!actual[i] : p === actual[i],
          )
        );
      })
  );
}
export const resourceHref = (id: string, download = false, sha = "") =>
  `/api/development/reference?id=${encodeURIComponent(id)}${download ? "&download=1" : ""}${sha ? "&sha=" + encodeURIComponent(sha) : ""}`;
