import type { QueryClient } from "../platform/permissions";
import type { Principal } from "../platform/identity";
import { AppError } from "../platform/errors";
import { visibleAppointment } from "../scheduling/planner";
import { sourceBinding } from "./context";

// Only stable identity and affected scope cross this operational boundary.
// Closed history stays issued; changed sources withdraw its current clearance.
export async function incidentHolds(
  c: QueryClient,
  p: Principal,
  appointment: string,
  exact?: { scope_item_id: string; asset_id: string },
) {
  const { a } = await visibleAppointment(c, p, appointment);
  const installed = (
    await c.query(
      "SELECT EXISTS(SELECT 1 FROM public.ppo_migrations WHERE version=56) AS installed,to_regclass('ppo.incidents') AS storage",
    )
  ).rows[0];
  if (!installed.storage) {
    if (installed.installed)
      throw new AppError(
        503,
        "IncidentSourceUnavailable",
        "Incident authority is unavailable; work cannot be treated as clear.",
      );
    return []; // Explicit pre-0056 upgrade compatibility only.
  }
  const rows = (
    await c.query<{
      id: string;
      appointment_id: string;
      state: string;
      hold: boolean;
      assessment: string;
      scope_item_id: string | null;
      asset_id: string | null;
      source_hash: string;
      sequence: number;
    }>(
      `SELECT i.id,i.appointment_id,i.state,i.hold,i.assessment,b.scope_item_id,b.asset_id,b.source_hash,b.sequence
    FROM ppo.incidents i LEFT JOIN ppo.incident_bindings b ON b.workspace_id=i.workspace_id AND b.incident_id=i.id
    WHERE i.workspace_id=$1 AND i.work_order_id=$2 AND i.state<>'Draft' ORDER BY i.id,b.sequence DESC`,
      [p.workspace_id, a.work_order_id],
    )
  ).rows;
  const holds: {
    id: string;
    scope_item_id: string;
    asset_id: string;
    held: boolean;
    message: string;
  }[] = [];
  for (const id of new Set(rows.map((x) => x.id))) {
    const bindings = rows.filter((x) => x.id === id),
      latest = bindings[0];
    if (!latest.scope_item_id || !latest.asset_id)
      throw new AppError(
        503,
        "IncidentSourceUnavailable",
        "Required incident scope is unavailable; authority requires review.",
      );
    let active = latest.hold || latest.assessment === "Unassessed";
    if (latest.state === "Closed") {
      try {
        const current = await sourceBinding(
          c,
          p,
          latest.appointment_id,
          latest.scope_item_id,
          latest.asset_id,
        );
        active = !current.known || current.source_hash !== latest.source_hash;
      } catch (e) {
        if (!(e instanceof AppError) || ![403, 404, 422].includes(e.status))
          throw e;
        active = true;
      }
    }
    if (!active) continue;
    // Retained bindings mean revised task IDs cannot remove a restriction on
    // the same asset. Unresolved source removal blocks appointment readiness;
    // exact unrelated equipment remains separate.
    const currentScopes = (
      await c.query<{ scope_item_id: string; asset_id: string }>(
        "SELECT scope_item_id,asset_id FROM ppo.scope_assets WHERE workspace_id=$1 AND scope_revision_id=$2",
        [p.workspace_id, a.scope_revision_id],
      )
    ).rows;
    const affected = exact
      ? bindings.filter(
          (x) =>
            x.asset_id === exact.asset_id &&
            (x.scope_item_id === exact.scope_item_id ||
              !currentScopes.some(
                (s) =>
                  s.scope_item_id === x.scope_item_id &&
                  s.asset_id === x.asset_id,
              )),
        )
      : bindings;
    for (const b of affected)
      if (!holds.some((h) => h.id === id && h.asset_id === b.asset_id))
        holds.push({
          id,
          scope_item_id: b.scope_item_id!,
          asset_id: b.asset_id!,
          held: true,
          message:
            "Incident scope hold — authorised incident review required. Factual recording remains available; attendance and equipment have not been stopped.",
        });
  }
  return holds;
}
