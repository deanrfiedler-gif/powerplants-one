import type { Principal } from "../../platform/identity";
import { transaction } from "../../platform/database";
import { AppError, unavailable } from "../../platform/errors";
import {
  requireCapability,
  type QueryClient,
} from "../../platform/permissions";
import { object } from "../../shared/validation";
import {
  findingKey,
  findingQuery,
  inView,
  isOverdue,
  dueThisWeek,
  views,
  type Finding,
} from "./model";
import { authorise, candidateSql, project, type Candidate } from "./sources";
import { recurrenceFor } from "./recurrence";
import { candidateWindow } from "./window";

async function begin(c: QueryClient, p: Principal) {
  // Native mutations use this same serialization boundary. Clock-based grants
  // are still rechecked before publishing, since a lock does not stop expiry.
  await c.query("SELECT 1 FROM ppo.workspaces WHERE id=$1 FOR UPDATE", [
    p.workspace_id,
  ]);
  await requireCapability(c, p, "shared.read");
  await requireCapability(c, p, "service.work_order.read");
  await requireCapability(c, p, "schedule.read");
}
const denied = (e: unknown) =>
  e instanceof AppError && [403, 404].includes(e.status);

export async function readFindings(p: Principal, input: unknown = {}) {
  const f = findingQuery(input);
  return transaction(async (c) => {
    await begin(c, p);
    const candidates = await candidateWindow(c, p, f);
    const permitted: { row: Finding; source: Candidate }[] = [];
    let partial = false;
    for (const source of candidates.slice(0, f.limit)) {
      try {
        const row = await project(c, p, source);
        permitted.push({ row, source });
      } catch (e) {
        if (!denied(e)) throw e;
        partial = true;
      }
    }
    // Recheck all count contributors, not just the returned page. Hidden
    // sources never supply facets, totals, continuation offsets or errors.
    const rows: Finding[] = [];
    for (const { row, source } of permitted) {
      try {
        row.recurrence = await recurrenceFor(c, p, row);
        partial ||= row.recurrence.partial;
        await authorise(c, p, source);
        rows.push(row);
      } catch (e) {
        if (!denied(e)) throw e;
        partial = true;
      }
    }
    let more = candidates.length > f.limit;
    if (more) {
      try {
        await authorise(c, p, candidates[f.limit]);
      } catch (e) {
        if (!denied(e)) throw e;
        more = false;
        partial = true;
      }
    }
    await requireCapability(c, p, "shared.read");
    await requireCapability(c, p, "service.work_order.read");
    await requireCapability(c, p, "schedule.read");
    const now = (await c.query<{ now: Date }>("SELECT clock_timestamp() now"))
      .rows[0].now;
    for (const row of rows) {
      row.overdue = isOverdue(row, now);
      row.due_this_week = dueThisWeek(row, now);
    }
    const selected = rows.filter((r) => inView(r, f.view));
    return {
      items: selected,
      options: {
        owners: Array.from(
          new Map(
            rows.flatMap((r) =>
              r.action
                ? [
                    [
                      r.action.owner_id,
                      { id: r.action.owner_id, label: r.action.owner_name },
                    ] as const,
                  ]
                : [],
            ),
          ).values(),
        ),
        sites: Array.from(
          new Map(
            rows.map((r) => [r.site.id, { id: r.site.id, label: r.site.name }]),
          ).values(),
        ),
      },
      total: selected.length,
      counts: Object.fromEntries(
        views.map((v) => [v, rows.filter((r) => inView(r, v)).length]),
      ),
      count_scope: "AuthorisedCandidateWindow",
      view: f.view,
      offset: f.offset,
      limit: f.limit,
      next_offset: more ? f.offset + f.limit : null,
      as_of: now.toISOString(),
      completeness: partial ? "Partial" : "Complete",
      synthetic: true,
    };
  });
}

export async function readFinding(
  p: Principal,
  key: string,
  input: unknown = {},
) {
  object(input, []);
  const parsed = findingKey(key);
  return transaction(async (c) => {
    await begin(c, p);
    const source = (
      await c.query<Candidate>(
        `SELECT * FROM (${candidateSql}) f WHERE source=$2 AND id=$3::uuid`,
        [p.workspace_id, parsed.source, parsed.id],
      )
    ).rows[0];
    if (!source) throw unavailable();
    const item = await project(c, p, source);
    item.recurrence = await recurrenceFor(c, p, item);
    await authorise(c, p, source);
    const now = (await c.query<{ now: Date }>("SELECT clock_timestamp() now"))
      .rows[0].now;
    item.overdue = isOverdue(item, now);
    item.due_this_week = dueThisWeek(item, now);
    return { item, as_of: now.toISOString(), synthetic: true };
  });
}
