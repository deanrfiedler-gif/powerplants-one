import type { Principal } from "../../platform/identity";
import type { QueryClient } from "../../platform/permissions";
import { supplyRecord } from "../../supply/context";
import { factsFor } from "../../supply/reads";
import {
  currentFacts,
  decimal,
  quantity,
  type Allocation,
} from "../../supply/model";

// Authorise every linked record before constructing even a count or historical
// snapshot. Exact strings survive JSON transport at the numeric precision limit.
export async function allocationPosition(
  c: QueryClient,
  p: Principal,
  target: string,
) {
  const own = (
    await c.query<Allocation>(
      "SELECT * FROM ppo.supply_allocations WHERE workspace_id=$1 AND demand_id=$2 ORDER BY id",
      [p.workspace_id, target],
    )
  ).rows;
  const result = [];
  for (const id of [...new Set(own.map((a) => a.supply_id))].sort()) {
    const supply = await supplyRecord(c, p, id);
    const allocations = (
      await c.query<Allocation>(
        "SELECT * FROM ppo.supply_allocations WHERE workspace_id=$1 AND supply_id=$2 ORDER BY id",
        [p.workspace_id, id],
      )
    ).rows;
    const demands = [];
    for (const demandId of [
      ...new Set(allocations.map((a) => a.demand_id)),
    ].sort()) {
      const demand = await supplyRecord(c, p, demandId);
      const children = [];
      for (const child of (
        await c.query<{ id: string }>(
          "SELECT id FROM ppo.supply_records WHERE workspace_id=$1 AND parent_id=$2 ORDER BY id",
          [p.workspace_id, demandId],
        )
      ).rows) {
        const record = await supplyRecord(c, p, child.id);
        children.push({
          record,
          facts: currentFacts(await factsFor(c, p, record)),
        });
      }
      demands.push({
        record: demand,
        facts: currentFacts(await factsFor(c, p, demand)),
        children,
      });
    }
    const usable = (
      await c.query<{ usable: string | null }>(
        "SELECT ppo.supply_usable($1,$2)::text usable",
        [p.workspace_id, id],
      )
    ).rows[0].usable;
    const total = (basis: string) =>
      quantity(
        allocations
          .filter((a) => a.basis === basis)
          .reduce((n, a) => n + decimal(a.quantity), 0n),
      );
    result.push({
      supply,
      facts: currentFacts(await factsFor(c, p, supply)),
      usable,
      incoming_allocated: total("Incoming"),
      usable_allocated: total("Usable"),
      allocations,
      demands,
    });
  }
  return result;
}
export type AllocationPosition = Awaited<ReturnType<typeof allocationPosition>>;
