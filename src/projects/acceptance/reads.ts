import { pendingIntents } from "./intents";
import type { Principal } from "../../platform/identity";
import { database, transaction } from "../../platform/database";
import { unavailable } from "../../platform/errors";
import { object, uuid, invalid } from "../../shared/validation";
import { listProjects } from "../service";
import { todayInZone } from "../model";
import { visibility } from "../../shared/reads";
import {
  access,
  stageRow,
  sourcesFor,
  loadDetail,
  projectUnits,
  decisionsFor,
  hash,
  iso,
} from "./context";
import { projectClosureGates } from "./policy";
import { readBundle } from "./outputs";
import type { Detail, Stage, Workspace, Duty } from "./model";
export async function readWorkspace(
  p: Principal,
  input: unknown,
): Promise<Workspace & { project_facts_hash: string }> {
  const q = object(input, [
    "project",
    "stage",
    "q",
    "area",
    "technical",
    "customer",
    "service",
    "commercial",
    "owner",
    "dates",
    "source",
    "order",
    "offset",
    "limit",
    "view",
    "columns",
    "position",
    "panel",
  ]);
  for (const [key, value] of Object.entries(q))
    if (typeof value !== "string" || value.length > 200)
      invalid(key, "Use a short query value.");
  const projects = (await listProjects(p, { limit: 100 })).items;
  const projectId = q.project
    ? uuid(q.project, "project")
    : (projects.find((x) => x.display_number === "SYN-PPO-PRJ-000701")?.id ??
      projects[0]?.id);
  if (!projectId) throw unavailable();
  const offset = Number(q.offset ?? 0),
    limit = Number(q.limit ?? 20);
  if (
    !Number.isInteger(offset) ||
    offset < 0 ||
    !Number.isInteger(limit) ||
    limit < 1 ||
    limit > 50
  )
    invalid("offset", "Use a valid page of up to 50 stages.");
  return transaction(async (c) => {
    await c.query("SELECT 1 FROM ppo.workspaces WHERE id=$1 FOR SHARE", [
      p.workspace_id,
    ]);
    const { project, can } = await access(c, p, projectId),
      sources = await sourcesFor(c, p, project),
      ledger = await projectUnits(c, p, project.id);
    const rows = (
      await c.query<Stage>(
        "SELECT s.*,s.due::text,u.display_name AS owner_name FROM ppo.acceptance_stages s JOIN ppo.users u ON (u.workspace_id,u.id)=(s.workspace_id,s.owner_id) WHERE s.workspace_id=$1 AND s.project_id=$2 ORDER BY s.reference,s.id",
        [p.workspace_id, project.id],
      )
    ).rows.map((s) => ({ ...s, updated_at: iso(s.updated_at)! }));
    const all: Detail[] = [];
    for (const s of rows) all.push(await loadDetail(c, p, s, sources));
    const today = todayInZone(project.timezone),
      text = String(q.q ?? "").toLocaleLowerCase();
    const filtered = all.filter(
      (d) =>
        (!text ||
          `${d.stage.title} ${d.stage.reference} ${d.units.map((u) => u.title + " " + u.system_name).join(" ")}`
            .toLocaleLowerCase()
            .includes(text)) &&
        (!q.area || d.units.some((u) => u.id === q.area)) &&
        (!q.owner || d.stage.owner_id === q.owner) &&
        (!q.source || d.source_state === q.source) &&
        (["technical", "customer", "service", "commercial"] as const).every(
          (k) => !q[k] || d.outcomes[k] === q[k],
        ) &&
        (!q.dates ||
          (q.dates === "needed"
            ? !d.next.due
            : q.dates === "overdue"
              ? !!d.next.due && d.next.due < today
              : !!d.next.due && d.next.due >= today)),
    );
    filtered.sort(
      (a, b) =>
        (q.order === "reference"
          ? a.stage.reference.localeCompare(b.stage.reference)
          : q.order === "changed"
            ? b.stage.updated_at.localeCompare(a.stage.updated_at)
            : (a.next.due ?? "9999-12-31").localeCompare(
                b.next.due ?? "9999-12-31",
              )) ||
        a.stage.reference.localeCompare(b.stage.reference) ||
        a.stage.id.localeCompare(b.stage.id),
    );
    const selected = q.stage
      ? (all.find((d) => d.stage.id === uuid(q.stage, "stage")) ?? null)
      : null;
    if (q.stage && !selected) throw unavailable();
    const users = (
      await c.query<{ id: string; display_name: string }>(
        "SELECT id,display_name FROM ppo.users WHERE workspace_id=$1 AND active ORDER BY display_name,id",
        [p.workspace_id],
      )
    ).rows;
    const people: Workspace["people"] = [];
    for (const u of users)
      try {
        const a = await access(
          c,
          { ...p, actor_id: u.id, display_name: u.display_name },
          project.id,
        );
        people.push({
          id: u.id,
          name: u.display_name,
          duties: (Object.keys(a.can) as Duty[]).filter((k) => a.can[k]),
        });
      } catch (e) {
        if (!(
          e instanceof Error &&
          "status" in e &&
          [403, 404].includes(Number(e.status))
        ))
          throw e;
      }
    const customers = (
      await c.query<{ id: string; name: string }>(
        `SELECT DISTINCT pe.id,pe.display_name AS name FROM ppo.people pe JOIN ppo.relationships r ON (r.workspace_id,r.person_id)=(pe.workspace_id,pe.id) WHERE pe.workspace_id=$1 AND pe.active AND r.organisation_id=$3 AND r.valid_from<=CURRENT_DATE AND (r.valid_to IS NULL OR r.valid_to>CURRENT_DATE) AND ${visibility("Person", "pe")} ORDER BY pe.display_name,pe.id`,
        [p.workspace_id, p.actor_id, project.organisation_id],
      )
    ).rows;
    const decisions = await decisionsFor(c, p, project.id);
    return {
      project,
      project_decisions: decisions.filter((d) => d.revision === null),
      project_history: (
        await c.query(
          "SELECT e.id,e.kind,e.reason,e.snapshot,e.created_at,u.display_name AS actor_name FROM ppo.acceptance_events e JOIN ppo.users u ON (u.workspace_id,u.id)=(e.workspace_id,e.actor_id) WHERE e.workspace_id=$1 AND e.project_id=$2 AND e.stage_id IS NULL ORDER BY e.created_at DESC,e.id DESC LIMIT 200",
          [p.workspace_id, project.id],
        )
      ).rows.map((e) => ({
        ...e,
        reason: ["commercial", "source"].includes(e.kind)
          ? "Source or commercial basis updated; inspect the permitted source record."
          : e.reason,
        created_at: iso(e.created_at)!,
      })),
      recoveries: await pendingIntents(c, p, project.id),
      can,
      items: filtered.slice(offset, offset + limit),
      selected,
      total: filtered.length,
      offset,
      limit,
      ledger,
      project_gates: projectClosureGates(ledger, all, decisions, sources),
      projects: projects.map(({ id, title, display_number }) => ({
        id,
        title,
        display_number,
      })),
      people,
      customers,
      sources,
      observed_at: new Date().toISOString(),
      project_facts_hash: hash({
        ledger,
        stages: all
          .map((d) => [d.stage.id, d.stage.version, d.facts_hash])
          .sort((a, b) => String(a[0]).localeCompare(String(b[0]))),
        decisions: decisions
          .filter((d) => d.revision === null)
          .map((d) => d.id),
      }),
    };
  });
}
export async function readStage(p: Principal, id: string) {
  const s = await stageRow(database(), p, uuid(id, "stage"));
  return readWorkspace(p, { project: s.project_id, stage: s.id });
}
export async function file(p: Principal, id: string, format: string) {
  if (!["html", "pdf"].includes(format))
    invalid("format", "Choose HTML or PDF.");
  return transaction(async (c) => {
    const raw = (
      await c.query<{ stage_id: string }>(
        "SELECT stage_id FROM ppo.acceptance_manifests WHERE workspace_id=$1 AND id=$2",
        [p.workspace_id, uuid(id, "manifest")],
      )
    ).rows[0];
    if (!raw) throw unavailable();
    const s = await stageRow(c, p, raw.stage_id),
      a = await access(c, p, s.project_id),
      d = await loadDetail(c, p, s, await sourcesFor(c, p, a.project));
    if (d.requirements.some((r) => r.source.availability === "Restricted"))
      throw unavailable();
    const m = d.manifests.find((m) => m.id === id);
    if (!m) throw unavailable();
    const b = await readBundle(p, m.prepared);
    return {
      bytes: format === "pdf" ? b.pdf : Buffer.from(b.html),
      type: format === "pdf" ? "application/pdf" : "text/html; charset=utf-8",
      filename: `${s.reference}-handover-r${String(m.revision).padStart(2, "0")}.${format}`,
    };
  });
}
