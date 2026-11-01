import {
  decimal,
  quantity,
  type SupplyRecord,
  type Completeness,
} from "./model";

export const inventoryQuantityKeys = [
  "on_hand",
  "available",
  "reserved",
  "held",
  "usable",
] as const;
export type InventoryQuantity = (typeof inventoryQuantityKeys)[number];
export type InventoryObservation = SupplyRecord & {
  company_name: string;
  owner_name: string;
  usable: string | null;
};
export type InventoryItem = {
  id: string;
  item: string;
  title: string;
  unit: string;
  company_id: string;
  company_name: string;
  observed_at: string;
  completeness: Completeness;
  observations: InventoryObservation[];
  quantities: Record<InventoryQuantity, string | null>;
  product_link: null;
  ambiguous_locations: boolean;
};
export const inventoryIdentity = (
  r: Pick<SupplyRecord, "company_id" | "item" | "unit">,
) => JSON.stringify([r.company_id, r.item, r.unit]);
export const inventoryLocation = (r: SupplyRecord) =>
  [r.data.warehouse, r.data.bin].filter(Boolean).join(" / ") ||
  "Location unknown";
export const inventoryQuantityText = (
  value: string | null | undefined,
  unit?: string,
) => (value == null ? "Unknown" : `${value}${unit ? ` ${unit}` : ""}`);

// Observations are not movements. Never add overlapping observations for the same
// site/warehouse/bin, or make a missing quantity into zero. No name-to-product matching.
export function inventoryItems(
  observations: InventoryObservation[],
): InventoryItem[] {
  const groups = new Map<string, InventoryObservation[]>();
  for (const r of observations) {
    if (r.kind !== "Supply" || r.data.supply_kind !== "Stock") continue;
    const key = inventoryIdentity(r);
    groups.set(key, [...(groups.get(key) ?? []), r]);
  }
  return [...groups.values()]
    .map((rows) => {
      rows.sort(
        (a, b) =>
          new Date(b.observed_at).getTime() -
            new Date(a.observed_at).getTime() || a.id.localeCompare(b.id),
      );
      const first = rows[0];
      const locations = rows.map((r) =>
        JSON.stringify([r.site_id, r.data.warehouse, r.data.bin]),
      );
      const ambiguous =
        new Set(locations).size !== rows.length ||
        rows.some((r) => !r.data.warehouse) ||
        rows.some((r) =>
          rows.some(
            (other) =>
              other !== r &&
              (!other.site_id || !r.site_id || other.site_id === r.site_id) &&
              other.data.warehouse === r.data.warehouse &&
              (!other.data.bin || !r.data.bin || other.data.bin === r.data.bin),
          ),
        );
      const quantities = Object.fromEntries(
        inventoryQuantityKeys.map((key) => {
          const values = rows.map((r) =>
            r.completeness === "Unavailable"
              ? null
              : key === "usable"
                ? r.usable
                : r.data[key],
          );
          return [
            key,
            ambiguous || values.some((v) => v == null)
              ? null
              : quantity(
                  values.reduce<bigint>((sum, v) => sum + decimal(v!), 0n),
                ),
          ];
        }),
      ) as InventoryItem["quantities"];
      const completeness: Completeness = rows.every(
        (r) => r.completeness === "Unavailable",
      )
        ? "Unavailable"
        : ambiguous || rows.some((r) => r.completeness !== "Complete")
          ? "Partial"
          : "Complete";
      return {
        id: first.id,
        item: first.item,
        title: first.title,
        unit: first.unit,
        company_id: first.company_id,
        company_name: first.company_name,
        observed_at: first.observed_at,
        completeness,
        observations: rows,
        quantities,
        product_link: null,
        ambiguous_locations: ambiguous,
      };
    })
    .sort(
      (a, b) =>
        a.title.localeCompare(b.title) ||
        a.company_id.localeCompare(b.company_id) ||
        a.unit.localeCompare(b.unit),
    );
}
export function filterInventory(
  items: InventoryItem[],
  query: Record<string, string>,
) {
  const search = (query.q ?? "").trim().toLowerCase();
  return items.filter(
    (r) =>
      (!search ||
        [r.item, r.title, r.company_name].some((v) =>
          v.toLowerCase().includes(search),
        )) &&
      (!query.completeness || r.completeness === query.completeness) &&
      (!query.unit || r.unit === query.unit) &&
      (!query.location ||
        r.observations.some(
          (o) => (o.data.warehouse || "Location unknown") === query.location,
        )) &&
      query.view !== "linked" &&
      (query.view !== "unknown" ||
        inventoryQuantityKeys.some((k) => r.quantities[k] === null)) &&
      (query.view !== "held" ||
        (r.quantities.held !== null && decimal(r.quantities.held) > 0n)) &&
      (query.view !== "partial" || r.completeness === "Partial"),
  );
}
