import { transaction } from "../platform/database";
import type { Principal } from "../platform/identity";
import {
  requireCapability,
  scopeSql,
  hasPermission,
} from "../platform/permissions";
import { AppError, unavailable } from "../platform/errors";
import { supplyRecord } from "./context";
import type { SupplyRecord, Allocation } from "./model";
import {
  inventoryIdentity,
  inventoryItems,
  filterInventory,
  type InventoryObservation,
} from "./inventory-model";

export async function inventory(
  p: Principal,
  query: Record<string, string> = {},
) {
  return transaction(async (c) => {
    await c.query("SET TRANSACTION ISOLATION LEVEL REPEATABLE READ");
    await requireCapability(c, p, "supply.read");
    const anchor = query.record ? await supplyRecord(c, p, query.record) : null;
    if (anchor && anchor.kind !== "Supply") throw unavailable();
    // Narrow search by whole exact item groups, never by individual observation rows.
    // Every candidate still passes native linked-context authority before projection.
    const candidates = (
      await c.query<SupplyRecord>(
        `SELECT r.* FROM ppo.supply_records r WHERE r.workspace_id=$1
       AND ${scopeSql("r.company_id", "r.site_id", "supply.read")} AND ${scopeSql("r.company_id", "r.site_id")}
       AND ($3::uuid IS NOT NULL OR (r.kind='Supply' AND r.data->>'supply_kind'='Stock'))
       AND ($3::uuid IS NULL OR (r.company_id=$3 AND r.item=$4 AND r.unit=$5))
       AND ($3::uuid IS NOT NULL OR $6::text='' OR EXISTS (
         SELECT 1 FROM ppo.supply_records m JOIN ppo.companies co ON co.workspace_id=m.workspace_id AND co.id=m.company_id
         WHERE m.workspace_id=r.workspace_id AND m.company_id=r.company_id AND m.item=r.item AND m.unit=r.unit
         AND m.kind='Supply' AND m.data->>'supply_kind'='Stock'
         AND ${scopeSql("m.company_id", "m.site_id", "supply.read")} AND ${scopeSql("m.company_id", "m.site_id")}
         AND (strpos(lower(m.item),$6)>0 OR strpos(lower(m.title),$6)>0 OR strpos(lower(co.display_name),$6)>0)))
       ORDER BY r.updated_at DESC,r.id LIMIT 2001`,
        [
          p.workspace_id,
          p.actor_id,
          anchor?.company_id ?? null,
          anchor?.item ?? null,
          anchor?.unit ?? null,
          (query.q ?? "").trim().toLowerCase(),
        ],
      )
    ).rows;
    const permitted: SupplyRecord[] = [];
    for (const r of candidates.slice(0, 2000)) {
      try {
        permitted.push(await supplyRecord(c, p, r.id));
      } catch (e) {
        if (!(e instanceof AppError) || ![403, 404].includes(e.status)) throw e;
      }
    }
    const stocks = permitted.filter(
      (r) => r.kind === "Supply" && r.data.supply_kind === "Stock",
    );
    const observations: InventoryObservation[] = [];
    for (const r of stocks) {
      const labels = (
        await c.query<{
          company_name: string;
          owner_name: string;
          usable: string | null;
        }>(
          `SELECT co.display_name AS company_name,u.display_name AS owner_name,ppo.supply_usable($1,$2)::text AS usable
         FROM ppo.companies co JOIN ppo.users u ON u.workspace_id=co.workspace_id AND u.id=$4
         WHERE co.workspace_id=$1 AND co.id=$3`,
          [p.workspace_id, r.id, r.company_id, r.owner_id],
        )
      ).rows[0];
      observations.push({ ...r, ...labels });
    }
    const items = inventoryItems(observations);
    const limited = candidates.length > 2000;
    // A cut-off source scan cannot establish a full item quantity.
    if (limited)
      for (const item of items) {
        for (const key of Object.keys(
          item.quantities,
        ) as (keyof typeof item.quantities)[])
          item.quantities[key] = null;
        item.completeness = "Partial";
      }
    const selected = anchor
      ? items.find((i) => inventoryIdentity(i) === inventoryIdentity(anchor))
      : undefined;
    if (anchor && !selected) throw unavailable();
    const matched = filterInventory(items, query);
    const facets = filterInventory(items, {
      ...query,
      location: "",
      unit: "",
      completeness: "",
    });
    const activity = selected
      ? permitted.filter(
          (r) => inventoryIdentity(r) === inventoryIdentity(selected),
        )
      : [];
    const allocations: (Allocation & { demand_title: string })[] = [];
    if (selected) {
      const rows = (
        await c.query<Allocation>(
          "SELECT * FROM ppo.supply_allocations WHERE workspace_id=$1 AND supply_id=ANY($2::uuid[]) ORDER BY id",
          [
            p.workspace_id,
            permitted.filter((r) => r.kind === "Supply").map((r) => r.id),
          ],
        )
      ).rows;
      for (const a of rows) {
        try {
          const demand = await supplyRecord(c, p, a.demand_id);
          await supplyRecord(c, p, a.supply_id);
          allocations.push({ ...a, demand_title: demand.title });
        } catch (e) {
          if (!(e instanceof AppError) || ![403, 404].includes(e.status))
            throw e;
        }
      }
    }
    const recordingSource = selected?.observations[0] ?? anchor;
    return {
      items: matched.slice(0, 100),
      limit: 100,
      bounded: limited || matched.length > 100,
      source_scan_limited: limited,
      observed_at: new Date().toISOString(),
      locations: [
        ...new Set(
          facets.flatMap((r) =>
            r.observations.map((o) => o.data.warehouse || "Location unknown"),
          ),
        ),
      ].sort(),
      units: [...new Set(facets.map((r) => r.unit))].sort(),
      selected: selected ?? null,
      activity,
      allocations,
      can_record: await hasPermission(
        c,
        p,
        "supply.coordinate",
        recordingSource?.company_id,
        recordingSource?.site_id ?? undefined,
      ),
      reservation: "Not configured" as const,
    };
  });
}
export type InventoryRead = Awaited<ReturnType<typeof inventory>>;
