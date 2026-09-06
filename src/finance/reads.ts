import type { Principal } from "../platform/identity";
import { database, transaction } from "../platform/database";
import {
  hasPermission,
  requireCapability,
  scopeSql,
} from "../platform/permissions";
import { AppError } from "../platform/errors";
import { object, optionalId, uuid, choice } from "../shared/validation";
import {
  financeContext,
  financeWork,
  exactSource,
  definition,
  type FinanceCapability,
} from "./context";
import { currentRevision } from "./service";
export async function financeOptions(p: Principal, input: unknown = {}) {
  object(input, []);
  const c = database();
  await requireCapability(c, p, "finance.read");
  const works = (
      await c.query(
        `SELECT w.id,w.display_number,w.company_id,w.customer_id,w.site_id,s.display_name AS site_name,o.display_name AS customer_name FROM ppo.work_orders w JOIN ppo.sites s ON (s.workspace_id,s.id)=(w.workspace_id,w.site_id) JOIN ppo.organisations o ON (o.workspace_id,o.id)=(w.workspace_id,w.customer_id) WHERE w.workspace_id=$1 AND ${scopeSql("w.company_id", "w.site_id", "finance.read")} AND ${scopeSql("w.company_id", "w.site_id", "shared.finance.read")} ORDER BY w.id`,
        [p.workspace_id, p.actor_id],
      )
    ).rows,
    accounts = (
      await c.query(
        `SELECT a.id,a.version,a.company_id,a.organisation_id AS customer_id,a.currency,a.status,a.fixture_key FROM ppo.finance_accounts a WHERE a.workspace_id=$1 AND ${scopeSql("a.company_id", "NULL::uuid", "finance.read")} AND ${scopeSql("a.company_id", "NULL::uuid", "shared.finance.read")} ORDER BY a.id`,
        [p.workspace_id, p.actor_id],
      )
    ).rows;
  return {
    schema_version: 1,
    synthetic: true,
    works,
    accounts,
    definition: await definition(c, p),
  };
}
export async function financeSources(
  p: Principal,
  id: string,
  input: unknown = {},
) {
  object(input, []);
  return transaction(async (c) => {
    const w = await financeWork(c, p, id),
      reports = (
        await c.query(
          "SELECT r.id,r.display_number,r.current_revision_id AS revision_id,r.current_issue_id AS issue_id,v.id AS review_id,r.status FROM ppo.service_reports r JOIN ppo.appointments a ON (a.workspace_id,a.id)=(r.workspace_id,r.appointment_id) LEFT JOIN ppo.report_reviews v ON (v.workspace_id,v.revision_id)=(r.workspace_id,r.current_revision_id) WHERE r.workspace_id=$1 AND a.work_order_id=$2 ORDER BY r.id",
          [p.workspace_id, w.id],
        )
      ).rows,
      items = [];
    for (const r of reports) {
      try {
        items.push({
          ...r,
          ready: true,
          source: await exactSource(c, p, w, {
            report_id: r.id,
            revision_id: r.revision_id,
            review_id: r.review_id,
            issue_id: r.issue_id,
          }),
        });
      } catch (e) {
        if (!(e instanceof AppError)) throw e;
        items.push({ ...r, ready: false, blocker: e.message, code: e.code });
      }
    }
    return { schema_version: 1, synthetic: true, work_order_id: w.id, items };
  });
}
export async function listFinance(p: Principal, input: unknown = {}) {
  const q = object(input, ["company_id", "site_id", "after", "status"]),
    c = database();
  await requireCapability(c, p, "finance.read");
  const rows = (
    await c.query(
      `SELECT f.id,f.display_number,f.version,f.status,f.company_id,f.site_id,f.customer_id,f.account_id,f.currency,f.mode,f.needs_review,f.source_blocker,f.created_at,f.updated_at,u.display_name AS owner,w.display_number AS work_reference,o.display_name AS customer_name,a.fixture_key AS account_reference,(SELECT min(occurred_at) FROM ppo.finance_events e WHERE e.handoff_id=f.id AND e.kind='Submitted') AS submitted_at,(SELECT max(reviewed_at) FROM ppo.finance_reviews r WHERE r.handoff_id=f.id) AS reviewed_at,(SELECT max(claimed_at) FROM ppo.finance_processing_attempts t WHERE t.handoff_id=f.id) AS claimed_at FROM ppo.finance_handoffs f JOIN ppo.users u ON (u.workspace_id,u.id)=(f.workspace_id,f.owner_id) JOIN ppo.work_orders w ON (w.workspace_id,w.id)=(f.workspace_id,f.work_order_id) JOIN ppo.organisations o ON (o.workspace_id,o.id)=(f.workspace_id,f.customer_id) JOIN ppo.finance_accounts a ON (a.workspace_id,a.id)=(f.workspace_id,f.account_id) WHERE f.workspace_id=$1 AND ${scopeSql("f.company_id", "f.site_id", "finance.read")} AND ${scopeSql("f.company_id", "f.site_id", "shared.finance.read")} AND ($3::uuid IS NULL OR f.company_id=$3) AND ($4::uuid IS NULL OR f.site_id=$4) AND ($5::uuid IS NULL OR f.id>$5) AND ($6::text IS NULL OR f.status=$6) ORDER BY f.id LIMIT 51`,
      [
        p.workspace_id,
        p.actor_id,
        optionalId(q.company_id, "company_id"),
        optionalId(q.site_id, "site_id"),
        optionalId(q.after, "after"),
        q.status === undefined
          ? null
          : choice(q.status, "status", [
              "Draft",
              "ReadyForReview",
              "Returned",
              "Approved",
              "AwaitingERP",
              "OutcomeUnknown",
              "ReconciliationRequired",
              "Reconciled",
              "Cancelled",
            ]),
      ],
    )
  ).rows;
  return {
    schema_version: 1,
    synthetic: true,
    as_at: new Date().toISOString(),
    timezone: "UTC",
    items: rows.slice(0, 50),
    next_cursor: rows.length > 50 ? rows[49].id : null,
    due_policy: "Not defined",
    count_scope: "Current visible page only",
  };
}
export async function readFinance(
  p: Principal,
  id: string,
  input: unknown = {},
) {
  object(input, []);
  return transaction(async (c) => {
    const ctx = await financeContext(c, p, uuid(id, "handoff_id")),
      history: Record<string, unknown[]> = {};
    for (const [key, table, order] of [
      ["revisions", "finance_revisions", "revision"],
      ["reviews", "finance_reviews", "reviewed_at"],
      ["attempts", "finance_processing_attempts", "attempt"],
      ["outcomes", "finance_outcomes", "observed_at"],
      ["reconciliations", "finance_reconciliations", "reconciled_at"],
      ["corrections", "finance_corrections", "created_at"],
      ["events", "finance_events", "version"],
      ["jobs", "finance_render_jobs", "requested_at"],
      ["issues", "finance_issues", "issued_at"],
    ])
      history[key] = (
        await c.query(
          `SELECT * FROM ppo.${table} WHERE workspace_id=$1 AND handoff_id=$2 ORDER BY ${order} DESC`,
          [p.workspace_id, id],
        )
      ).rows;
    const lines = (
        await c.query(
          "SELECT l.*,(SELECT sum(quantity) FROM ppo.finance_allocation_holds h WHERE h.workspace_id=l.workspace_id AND h.root_entry_id=l.root_entry_id AND h.state<>'Released') AS reserved_quantity FROM ppo.finance_lines l WHERE workspace_id=$1 AND revision_id=$2 ORDER BY id",
          [p.workspace_id, ctx.h.current_revision_id],
        )
      ).rows,
      targets = (
        await c.query(
          "SELECT t.* FROM ppo.finance_simulator_targets t JOIN ppo.finance_outcomes o ON (o.workspace_id,o.target_id)=(t.workspace_id,t.id) WHERE o.workspace_id=$1 AND o.handoff_id=$2 ORDER BY t.id",
          [p.workspace_id, id],
        )
      ).rows;
    let readiness: { ready: boolean; code?: string; reason?: string } = {
      ready: true,
    };
    try {
      await currentRevision(c, p, ctx);
    } catch (e) {
      if (!(e instanceof AppError)) throw e;
      readiness = { ready: false, code: e.code, reason: e.message };
    }
    const capabilities: Record<string, boolean> = {};
    for (const cap of [
      "finance.prepare",
      "finance.review",
      "finance.process",
      "finance.reconcile",
      "finance.issue",
      "finance.account.read",
    ] as FinanceCapability[])
      capabilities[cap] = await hasPermission(
        c,
        p,
        cap,
        ctx.h.company_id,
        ctx.h.site_id,
      );
    return {
      schema_version: 1,
      synthetic: true,
      handoff: ctx.h,
      work: {
        id: ctx.w.id,
        reference: ctx.w.display_number,
        customer: ctx.w.customer_name,
        site: ctx.w.site_name,
      },
      account: {
        id: ctx.a.id,
        status: ctx.a.status,
        currency: ctx.a.currency,
        fixture_key: ctx.a.fixture_key,
      },
      ...history,
      lines,
      targets,
      readiness,
      capabilities,
      as_at: new Date().toISOString(),
      due_policy: "Not defined",
      customer_distribution: "Disabled",
    };
  });
}
