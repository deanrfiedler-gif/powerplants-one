import type { Principal } from "../../platform/identity";
import { type QueryClient } from "../../platform/permissions";
import { unavailable } from "../../platform/errors";
import { companyContext } from "../../shared/authority";
import { activityVisibility } from "../../activities/activities";
import { projectRow } from "../service";
import type { Entry, Event } from "./model";
import { savedSource, inspectSource } from "./sources";

export async function authority(
  c: QueryClient,
  p: Principal,
  project: string,
  duty: "read" | "prepare" | "review" = "read",
) {
  const row = await projectRow(c, p, project);
  await companyContext(
    c,
    p,
    row.company_id,
    row.site_id,
    "project.commercial.read",
  );
  if (duty !== "read")
    await companyContext(
      c,
      p,
      row.company_id,
      row.site_id,
      `project.commercial.${duty}`,
    );
  return row;
}
export async function entryRow(c: QueryClient, p: Principal, id: string) {
  return (
    (
      await c.query<Entry>(
        "SELECT * FROM ppo.project_commercial_entries WHERE workspace_id=$1 AND id=$2",
        [p.workspace_id, id],
      )
    ).rows[0] ?? null
  );
}
export async function history(
  c: QueryClient,
  p: Principal,
  id: string,
  before?: number,
  limit = 51,
) {
  return (
    await c.query<Event>(
      "SELECT * FROM ppo.project_commercial_events WHERE workspace_id=$1 AND entry_id=$2 AND ($3::int IS NULL OR version<$3) ORDER BY version DESC LIMIT $4",
      [p.workspace_id, id, before ?? null, limit],
    )
  ).rows;
}
export async function actions(
  c: QueryClient,
  p: Principal,
  project: string,
  ids: string[],
) {
  if (!ids.length) return [];
  const rows = (
    await c.query<{ id: string; version: number; state: string }>(
      `SELECT a.id,a.version,a.status AS state FROM ppo.activities a
    WHERE a.workspace_id=$1 AND a.id=ANY($3::uuid[]) AND ${activityVisibility("a", true, true, true)}
    AND EXISTS(SELECT 1 FROM ppo.activity_links l WHERE l.workspace_id=a.workspace_id AND l.activity_id=a.id AND l.object_type='Project' AND l.object_id=$4)
    AND EXISTS(SELECT 1 FROM ppo.projects pr WHERE pr.workspace_id=a.workspace_id AND pr.id=$4 AND pr.company_id=a.company_id AND pr.site_id=a.site_id) ORDER BY a.id`,
      [p.workspace_id, p.actor_id, ids, project],
    )
  ).rows;
  if (rows.length !== ids.length) throw unavailable();
  return rows;
}
export async function sourceAuthority(
  c: QueryClient,
  p: Principal,
  e: Entry,
  current = false,
) {
  const source = await savedSource(c, p, e.basis_id ?? e.id);
  await inspectSource(c, p, e.project_id, source.input, current, source);
  return source;
}
export async function commercialReceiptAuthority(
  c: QueryClient,
  p: Principal,
  id: string,
  operation: string,
) {
  const entry = await entryRow(c, p, id);
  if (!entry) throw unavailable();
  const event = (
    await c.query<Event>(
      "SELECT * FROM ppo.project_commercial_events WHERE workspace_id=$1 AND entry_id=$2 AND created_by=$3 AND operation_id=$4",
      [p.workspace_id, id, p.actor_id, operation],
    )
  ).rows[0];
  if (!event) throw unavailable();
  await authority(
    c,
    p,
    entry.project_id,
    event.command === "Decide" ? "review" : "prepare",
  );
  await sourceAuthority(c, p, entry);
  await actions(c, p, entry.project_id, event.content.action_ids);
}
