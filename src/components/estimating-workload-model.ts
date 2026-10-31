import type { readEstimatingWorkload } from "../estimating/workload";
import { workloadLabels } from "../estimating/workload-query";
export type Workload = Awaited<ReturnType<typeof readEstimatingWorkload>>;
export type WorkloadItem = Workload["items"][number];
export type SavedEstimate = {
  id: string;
  display_number: string;
  version: number;
  version_id: string;
  title: string;
  customer: string;
  updated_at: string;
  sell_total: string | null;
  state: string;
};
export type SavedEstimates = {
  items: SavedEstimate[];
  limit: number;
  can_create: boolean;
  next_offset: number | null;
};
export const workloadFilterKeys = ["q", "view", "owner", "sort"] as const;
export function workloadLocation(
  params: URLSearchParams,
  values: Record<string, string>,
) {
  const next = new URLSearchParams(params);
  for (const [key, value] of Object.entries(values)) {
    if (value) next.set(key, value);
    else next.delete(key);
  }
  return `/estimating${next.size ? `?${next}` : ""}`;
}
export function savedEstimateHref(e: { id: string; version_id: string }) {
  return `/estimating/estimates/${e.id}?version_id=${e.version_id}`;
}
export function discoverySummary(item: WorkloadItem) {
  const w = item.workspace,
    selected = w?.options.find((o) => o.id === w.selected_option_id);
  if (!w || !selected) return "No discovery workspace";
  const count = w.options.filter((o) => o.state === "Active").length;
  return `Option ${selected.label} · r${selected.revision} · ${count} ${count === 1 ? "alternative" : "alternatives"}`;
}
export function workloadFingerprint(items: WorkloadItem[]) {
  // Include all exposed facts, not just the opportunity version: linked sources can change independently.
  return JSON.stringify(items);
}
export function workloadSequence(items: WorkloadItem[], ids: string[]) {
  return items
    .filter((i) => ids.includes(i.opportunity.id))
    .toSorted(
      (a, b) =>
        b.updated_at.localeCompare(a.updated_at) ||
        a.opportunity.id.localeCompare(b.opportunity.id),
    );
}
export function workloadCsv(items: WorkloadItem[]) {
  // Excel-compatible CSV. Treat every text cell as untrusted, including leading whitespace/control chars.
  const cell = (value: unknown) => {
    const text = String(value ?? "");
    return (
      '"' +
      (/^[\s\u0000-\u001f]*[=+@-]/u.test(text) ? "'" + text : text).replaceAll(
        '"',
        '""',
      ) +
      '"'
    );
  };
  return [
    [
      "Opportunity",
      "Sales source version",
      "Title",
      "Customer",
      "Readiness",
      "Estimating owner",
      "Sales owner",
      "Last changed",
    ],
    ...items.map((i) => [
      i.opportunity.display_number,
      i.opportunity.version,
      i.opportunity.title,
      i.customer,
      workloadLabels[i.state],
      i.estimating_owner ?? "Not allocated",
      i.sales_owner,
      i.updated_at,
    ]),
  ]
    .map((row) => row.map(cell).join(","))
    .join("\r\n");
}
export const shortDate = (value: string) =>
  new Intl.DateTimeFormat("en-AU", {
    day: "numeric",
    month: "short",
    ...(new Date(value).getFullYear() !== new Date().getFullYear()
      ? { year: "numeric" as const }
      : {}),
    timeZone: "Australia/Brisbane",
  }).format(new Date(value));
export const readTime = (value: string) =>
  new Intl.DateTimeFormat("en-AU", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Australia/Brisbane",
  }).format(new Date(value));
