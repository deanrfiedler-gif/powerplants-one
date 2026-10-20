import type { RegisterRow } from "./reads";

export const facilityViews = {
  all: "All facilities",
  growing: "Growing areas",
  non_growing: "Non-growing",
  incomplete: "Details to complete",
} as const;
export type FacilityView = keyof typeof facilityViews;
export type FacilityViewCounts = Record<FacilityView, number>;
export const growingUses = [
  "propagation",
  "production",
  "trials",
  "mixed",
] as const;

// Rebase a retained proposal without reversing unrelated concurrent changes.
export function carryProposalForward(
  before: Record<string, unknown>,
  draft: Record<string, unknown>,
  latest: Record<string, unknown>,
) {
  return {
    ...latest,
    ...Object.fromEntries(
      Object.entries(draft).filter(
        ([key, value]) => JSON.stringify(value) !== JSON.stringify(before[key]),
      ),
    ),
  };
}

export function detailsToComplete(
  row: Pick<RegisterRow, "structure_type" | "use" | "footprint_m2">,
) {
  return (
    !row.structure_type ||
    row.structure_type === "unknown" ||
    !row.use ||
    row.use === "unknown" ||
    row.footprint_m2 === null
  );
}

export function measurement(value: unknown, unit = "") {
  if (value === null || value === undefined || value === "")
    return "Not recorded";
  const number = Number(value);
  return Number.isFinite(number)
    ? `${new Intl.NumberFormat("en-AU", { maximumFractionDigits: 6 }).format(number)}${unit}`
    : "Not recorded";
}

// Parents absent from a filtered/paged read are not fabricated as result rows.
// Their recorded path stays visible in the relationship cell.
export function hierarchyRows(rows: RegisterRow[]) {
  const present = new Set(rows.map((r) => r.id)),
    visited = new Set<string>();
  const children = new Map<string | null, RegisterRow[]>();
  for (const row of rows) {
    const parent =
      row.parent_facility_id && present.has(row.parent_facility_id)
        ? row.parent_facility_id
        : null;
    children.set(parent, [...(children.get(parent) ?? []), row]);
  }
  const result: { row: RegisterRow; depth: number }[] = [];
  function walk(parent: string | null, depth: number) {
    for (const row of children.get(parent) ?? []) {
      if (visited.has(row.id)) continue;
      visited.add(row.id);
      result.push({ row, depth });
      walk(row.id, depth + 1);
    }
  }
  walk(null, 0);
  for (const row of rows)
    if (!visited.has(row.id)) result.push({ row, depth: 0 });
  return result;
}
