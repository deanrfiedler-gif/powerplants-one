import { transaction } from "../platform/database";
import { AppError, unavailable } from "../platform/errors";
import type { Principal } from "../platform/identity";
import {
  hasPermission,
  requireCapability,
  type QueryClient,
} from "../platform/permissions";
import { visible } from "../shared/reads";
import { choice, invalid, uuid } from "../shared/validation";
import { visibleActivity } from "../activities/activities";
import { handoverBasis, handoverRecord, hashBasis } from "./handover-service";
import {
  submittedRevision,
  matchesReceivingView,
  receivingCsv,
  receivingViews,
  type BriefPerson,
  type ReceivingBrief,
  type ReceivingQueue,
  type ReceivingSnapshot,
} from "./receiving-queue-model";
const iso = (value: Date | string) => new Date(value).toISOString();
const stale = () =>
  new AppError(
    409,
    "ReceivingQueueChanged",
    "The submitted briefs or your access changed. Refresh the queue and select again.",
  );
async function project(
  c: QueryClient,
  p: Principal,
  id: string,
): Promise<ReceivingSnapshot | null> {
  const { row, o, history } = await handoverRecord(c, p, id);
  if (
    row.kind !== "Estimating" ||
    !(await hasPermission(
      c,
      p,
      "estimating.edit",
      row.company_id,
      row.site_id ?? undefined,
    ))
  )
    throw unavailable();
  const revision = submittedRevision(row, history);
  if (!revision) return null;
  const { submitted, decision, events, state, receiver } = revision;
  const currentHash = hashBasis(
    await handoverBasis(c, p, row, submitted.content),
  );
  const customer = await visible(c, p, "Organisation", row.organisation_id);
  const site = row.site_id ? await visible(c, p, "Site", row.site_id) : null;
  const people = new Map<string, BriefPerson>();
  async function person(id: string): Promise<BriefPerson> {
    const cached = people.get(id);
    if (cached) return cached;
    // Participant labels of an authorised record, never an unscoped directory.
    const user = (
      await c.query<{ display_name: string }>(
        "SELECT display_name FROM ppo.users WHERE workspace_id=$1 AND id=$2",
        [p.workspace_id, id],
      )
    ).rows[0];
    const value = { id, name: user?.display_name ?? "Name unavailable" };
    people.set(id, value);
    return value;
  }
  const frozenOpportunity = submitted.basis?.opportunity as
    { title?: string } | undefined;
  const base = {
    id: row.id,
    revision: submitted.revision,
    submission_id: submitted.id,
    opportunity: {
      id: o.id,
      reference: o.display_number,
      title: frozenOpportunity?.title ?? o.title,
    },
    customer: {
      id: customer.id as string,
      name: customer.display_name as string,
    },
    site: site
      ? { id: site.id as string, name: site.display_name as string }
      : null,
    receiving_owner: receiver ? await person(receiver) : null,
    sales_owner: await person(submitted.recorded_by),
    state,
    source_changed: submitted.source_hash !== currentHash,
    updated_at: iso(decision.recorded_at),
    submitted_at: iso(submitted.recorded_at),
    requested_date: submitted.content.requested_date,
    date_reason: submitted.content.date_reason,
  };
  const brief: ReceivingBrief = {
    ...base,
    token: hashBasis({ ...base, currentHash, version: decision.version }),
  };
  const next = submitted.content.next_activity_id
    ? await visibleActivity(c, p, submitted.content.next_activity_id)
    : null;
  return {
    brief,
    content: submitted.content,
    next_action: next
      ? {
          id: next.id,
          summary: next.summary,
          due_at: next.due_at ? iso(next.due_at) : null,
          owner: next.owner_id ? await person(next.owner_id) : null,
        }
      : null,
    history: await Promise.all(
      events.map(async (e) => ({
        id: e.id,
        revision: e.revision,
        action: e.action,
        note: e.note,
        question_id: e.question_id,
        recorded_at: iso(e.recorded_at),
        actor: await person(e.recorded_by),
      })),
    ),
    observed_at: new Date().toISOString(),
  };
}
async function population(c: QueryClient, p: Principal) {
  await requireCapability(c, p, "estimating.edit");
  await requireCapability(c, p, "crm.opportunity.read");
  const ids = (
    await c.query<{ id: string }>(
      `SELECT h.id FROM ppo.sales_handovers h WHERE h.workspace_id=$1 AND h.kind='Estimating'
    AND EXISTS (SELECT 1 FROM ppo.sales_workflow_events e WHERE e.workspace_id=h.workspace_id AND e.record_id=h.id AND e.action='Submit') ORDER BY h.id`,
      [p.workspace_id],
    )
  ).rows;
  const items: ReceivingBrief[] = [];
  let completeness: ReceivingQueue["completeness"] = "Complete";
  for (const { id } of ids) {
    try {
      const snapshot = await project(c, p, id);
      if (snapshot) items.push(snapshot.brief);
    } catch (e) {
      if (e instanceof AppError && [403, 404].includes(e.status)) continue;
      if (e instanceof AppError && e.status === 503) {
        completeness = "Partial";
        continue;
      }
      throw e;
    }
  }
  items.sort(
    (a, b) =>
      b.updated_at.localeCompare(a.updated_at) || a.id.localeCompare(b.id),
  );
  return { items, completeness };
}
function integer(value: string | undefined, fallback: number, max: number) {
  if (value === undefined) return fallback;
  if (
    !/^\d+$/.test(value) ||
    !Number.isSafeInteger(Number(value)) ||
    Number(value) > max
  )
    invalid("page", "Use a valid page size or position.");
  return Number(value);
}
export async function listReceivingBriefs(
  p: Principal,
  query: Record<string, string> = {},
): Promise<ReceivingQueue> {
  const view = choice(
    query.view ?? "All",
    "view",
    receivingViews.map((v) => v.id),
  );
  const customer = query.customer ? uuid(query.customer, "customer") : "";
  const owner = query.owner ? uuid(query.owner, "owner") : "";
  const q = (query.q ?? "").trim().toLocaleLowerCase("en-AU");
  if (q.length > 200) invalid("q", "Use at most 200 characters.");
  const offset = integer(query.offset, 0, 1_000_000),
    limit = integer(query.limit, 50, 100);
  if (!limit) invalid("limit", "Choose a page size from 1 to 100.");
  return transaction(async (c) => {
    await c.query("SET TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY");
    const all = await population(c, p);
    const filtered = all.items.filter(
      (r) =>
        (!customer || r.customer.id === customer) &&
        (!owner || r.receiving_owner?.id === owner) &&
        (!q ||
          [
            r.opportunity.reference,
            r.opportunity.title,
            r.customer.name,
            r.receiving_owner?.name,
            r.sales_owner.name,
          ]
            .join(" ")
            .toLocaleLowerCase("en-AU")
            .includes(q)),
    );
    const counts = Object.fromEntries(
      receivingViews.map((v) => [
        v.id,
        filtered.filter((r) => matchesReceivingView(r, v.id, p.actor_id))
          .length,
      ]),
    ) as ReceivingQueue["counts"];
    const rows = filtered.filter((r) =>
      matchesReceivingView(r, view, p.actor_id),
    );
    const basis = hashBasis({
      actor: p.actor_id,
      workspace: p.workspace_id,
      view,
      customer,
      owner,
      q,
      limit,
      completeness: all.completeness,
      rows: all.items.map((r) => [r.id, r.token]),
    });
    if ((offset > 0 && !query.basis) || (query.basis && query.basis !== basis))
      throw stale();
    const unique = (values: BriefPerson[]) =>
      [...new Map(values.map((v) => [v.id, v])).values()].sort(
        (a, b) => a.name.localeCompare(b.name) || a.id.localeCompare(b.id),
      );
    return {
      items: rows.slice(offset, offset + limit),
      counts,
      total: rows.length,
      permitted_total: all.items.length,
      customers: unique(all.items.map((r) => r.customer)),
      owners: unique(
        all.items.flatMap((r) =>
          r.receiving_owner ? [r.receiving_owner] : [],
        ),
      ),
      offset,
      limit,
      has_more: offset + limit < rows.length,
      basis,
      completeness: all.completeness,
      observed_at: new Date().toISOString(),
    };
  });
}
export async function readReceivingBrief(
  p: Principal,
  id: string,
  query: Record<string, string> = {},
) {
  return transaction(async (c) => {
    await c.query("SET TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY");
    const result = await project(c, p, uuid(id, "id"));
    if (!result) throw unavailable();
    if (
      (query.revision && Number(query.revision) !== result.brief.revision) ||
      (query.token && query.token !== result.brief.token)
    )
      throw stale();
    return result;
  });
}
export async function exportReceivingBriefs(p: Principal, selection: string) {
  const selected = selection.split(",").map((item) => {
    const [id, token, extra] = item.split(":");
    if (extra || !/^[a-f0-9]{64}$/.test(token ?? ""))
      invalid("selection", "Select current brief revisions again.");
    return { id: uuid(id, "selection"), token };
  });
  if (
    !selected.length ||
    selected.length > 100 ||
    new Set(selected.map((r) => r.id)).size !== selected.length
  )
    invalid(
      "selection",
      "Select between 1 and 100 distinct briefs on this page.",
    );
  return transaction(async (c) => {
    await c.query("SET TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY");
    const rows: ReceivingBrief[] = [];
    for (const item of selected) {
      const result = await project(c, p, item.id);
      if (!result) throw unavailable();
      if (result.brief.token !== item.token) throw stale();
      rows.push(result.brief);
    }
    return {
      csv: receivingCsv(rows),
      count: rows.length,
      observed_at: new Date().toISOString(),
    };
  });
}
