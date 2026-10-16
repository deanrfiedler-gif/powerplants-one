import type { Principal } from "../../platform/identity";
import type { QueryClient } from "../../platform/permissions";
import { AppError, unavailable } from "../../platform/errors";
import { authority, packageRow, history, inspect, changed } from "./context";

export type SpecialistReference = { id: string; version: number };
export type SpecialistHandoverRow = {
  specialist_package_id?: string | null;
  specialist_version?: number | null;
};
export const specialistReference = (
  row: SpecialistHandoverRow,
): SpecialistReference | null =>
  row.specialist_package_id && row.specialist_version
    ? { id: row.specialist_package_id, version: row.specialist_version }
    : null;

// EN-06 owns release and receiving. PJ-06 supplies only its exact, independently
// accepted brief; checking this source never accepts or modifies another record.
export async function specialistHandoverSource(
  c: QueryClient,
  p: Principal,
  engineeringId: string,
  ref: SpecialistReference,
  current = false,
  prepare = false,
) {
  const pkg = await packageRow(c, p, ref.id);
  if (!pkg) throw unavailable();
  const project = await authority(
    c,
    p,
    pkg.project_id,
    prepare ? "prepare" : "read",
  );
  const event = (await history(c, p, pkg.id, ref.version + 1, 1))[0];
  if (
    !event ||
    event.version !== ref.version ||
    event.state !== "Accepted" ||
    event.content.engineering?.id !== engineeringId
  )
    throw unavailable();
  if (
    prepare &&
    p.actor_id !== project.coordinator_id &&
    p.actor_id !== event.content.owner_id
  )
    throw new AppError(
      403,
      "Forbidden",
      "The specialist package owner or Project coordinator prepares its handover.",
    );
  await inspect(c, p, pkg, event.content, false, event.source);
  if (current) {
    if (project.lifecycle !== "Active")
      throw new AppError(
        409,
        "ProjectNotActive",
        "An active Project is required for a new specialist handover or positive receiving decision.",
      );
    await inspect(c, p, pkg, event.content, true, event.source);
    if (
      (
        await c.query(
          `SELECT 1 FROM ppo.project_specialist_packages s JOIN ppo.project_specialist_events e
      ON (e.workspace_id,e.package_id)=(s.workspace_id,s.id)
      WHERE s.workspace_id=$1 AND s.predecessor_id=$2 AND e.state='Accepted'`,
          [p.workspace_id, pkg.id],
        )
      ).rowCount
    )
      throw changed();
  }
  return {
    id: pkg.id,
    version: event.version,
    source_hash: event.source_hash,
    accept_operation_id: event.operation_id,
    content: event.content,
  };
}

export async function specialistHandoverVisible(
  c: QueryClient,
  p: Principal,
  engineeringId: string,
  row: SpecialistHandoverRow,
) {
  const ref = specialistReference(row);
  if (!ref) return true;
  try {
    await specialistHandoverSource(c, p, engineeringId, ref);
    return true;
  } catch (error) {
    if (error instanceof AppError && [403, 404].includes(error.status))
      return false;
    throw error;
  }
}
