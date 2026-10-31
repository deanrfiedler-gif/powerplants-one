import { hasPermission, type QueryClient } from "../../platform/permissions";
import { commercialNames, commercialPresentation } from "./presentation";
import type { Principal } from "../../platform/identity";
import { transaction } from "../../platform/database";
import { AppError, unavailable } from "../../platform/errors";
import { companyContext } from "../../shared/authority";
import {
  choice,
  invalid,
  object,
  uuid,
  version,
} from "../../shared/validation";
import { page } from "../../shared/reads";
import { workingCompanyFor } from "../../platform/working-company";
import { documentContext } from "../../library/context";
import { responseContext } from "../../estimating/response/context";
import { deliverySalesSourcesInSnapshot } from "../../sales/delivery-binding";
import { kinds, cents, decimal, total, type Entry, type Event } from "./model";
import {
  authority,
  actions,
  entryRow,
  history,
  sourceAuthority,
} from "./context";
import { inspectSource, savedSource, sourceStatus } from "./sources";
import type { Source } from "./validation";
const denied = (e: unknown) =>
  e instanceof AppError && [403, 404].includes(e.status);
type NoticeCorrection = "Latest" | "Corrected" | "Unavailable" | null;
async function noticeCorrection(
  c: QueryClient,
  p: Principal,
  entry: Entry,
): Promise<NoticeCorrection> {
  if (entry.kind !== "Notice") return null;
  const successor = (
    await c.query<Entry>(
      "SELECT * FROM ppo.project_commercial_entries WHERE workspace_id=$1 AND project_id=$2 AND predecessor_id=$3 AND kind='Notice' LIMIT 1",
      [p.workspace_id, entry.project_id, entry.id],
    )
  ).rows[0];
  if (!successor) return "Latest";
  try {
    await sourceAuthority(c, p, successor);
    const latest = (await history(c, p, successor.id, undefined, 1))[0];
    await actions(c, p, entry.project_id, latest.content.action_ids);
    return "Corrected";
  } catch (error) {
    if (!denied(error)) throw error;
    return "Unavailable"; // Never disclose an inaccessible successor's identity or content.
  }
}
const projection = (e: Entry, v: Event) => ({
  id: e.id,
  kind: e.kind,
  basis_id: e.basis_id,
  predecessor_id: e.predecessor_id,
  version: v.version,
  state: v.state,
  content: v.content,
  command: v.command,
  note: v.note,
  reason: v.reason,
  disputed: v.disputed,
  recorded_by: v.created_by,
  recorded_at: v.created_at.toISOString(),
  action_basis: v.action_snapshot,
});

export async function readCommercialOptions(
  p: Principal,
  project: string,
  input: Record<string, string>,
) {
  const q = object(input, ["handover_id", "quote_revision_id", "document_id"]);
  return transaction(async (c) => {
    await c.query("SELECT 1 FROM ppo.workspaces WHERE id=$1 FOR SHARE", [
      p.workspace_id,
    ]);
    await authority(c, p, project, "prepare");
    const sales = await deliverySalesSourcesInSnapshot(
      c,
      p,
      "Projects",
      project,
    );
    const b = sales.items.find(
      (x) =>
        x.access === "Available" &&
        x.handover_id === uuid(q.handover_id, "handover_id"),
    );
    if (!b || b.access !== "Available") throw unavailable();
    const quote = await responseContext(
      c,
      p,
      uuid(q.quote_revision_id, "quote_revision_id"),
    );
    const header = (
      await c.query(
        "SELECT version FROM ppo.draft_quotes WHERE workspace_id=$1 AND id=$2",
        [p.workspace_id, quote.q.quote_id],
      )
    ).rows[0];
    const { d, r } = await documentContext(
      c,
      p,
      uuid(q.document_id, "document_id"),
    );
    const review = (
      await c.query(
        "SELECT id FROM ppo.library_reviews WHERE workspace_id=$1 AND revision_id=$2 AND outcome='Reviewed'",
        [p.workspace_id, r.id],
      )
    ).rows[0];
    if (!review || !quote.state.response) throw unavailable();
    const source: Source = {
      handover_id: b.handover_id,
      acceptance_event_id: b.acceptance_event_id,
      quotation: {
        kind: "Quotation",
        revision_id: quote.q.id,
        issue_id: quote.issue.id,
        response_event_id: quote.state.response.id,
        expected_quote_version: header.version,
        expected_response_sequence: quote.sequence,
        output_hash: quote.issue.output_hash!,
      },
      document_id: d.id,
      document_revision_id: r.id,
      document_review_id: review.id,
      document_version: d.version,
    };
    return {
      source: await inspectSource(c, p, project, source, true),
      synthetic: true,
      observed_at: new Date().toISOString(),
    };
  });
}
export async function readCommercial(
  p: Principal,
  project: string,
  input: Record<string, string> = {},
) {
  const q = object(input, ["id", "before_version", "limit", "cursor", "kind"]);
  if (
    q.before_version !== undefined &&
    (!/^[1-9][0-9]*$/.test(String(q.before_version)) ||
      Number(q.before_version) > 2147483647)
  )
    invalid(
      "before_version",
      "Use a positive event version within the supported integer range.",
    );
  return transaction(async (c) => {
    await c.query("SELECT 1 FROM ppo.workspaces WHERE id=$1 FOR SHARE", [
      p.workspace_id,
    ]);
    const pr = await authority(c, p, project);
    const context = {
      actor_id: p.actor_id,
      workspace_id: p.workspace_id,
      project: {
        id: pr.id,
        title: pr.title,
        display_number: pr.display_number,
        lifecycle: pr.lifecycle,
        coordinator_id: pr.coordinator_id,
        coordinator_name: pr.coordinator_name,
        customer_name: pr.customer_name,
        site_name: pr.site_name,
        timezone: pr.timezone,
      },
      can_prepare: await hasPermission(
        c,
        p,
        "project.commercial.prepare",
        pr.company_id,
        pr.site_id,
      ),
      can_review: await hasPermission(
        c,
        p,
        "project.commercial.review",
        pr.company_id,
        pr.site_id,
      ),
    };
    if (q.id !== undefined) {
      object(q, ["id", "before_version"]);
      const e = await entryRow(c, p, uuid(q.id, "id"));
      if (!e || e.project_id !== pr.id) throw unavailable();
      const source = await sourceAuthority(c, p, e),
        status = await sourceStatus(c, p, pr.id, source);
      const rows = await history(
        c,
        p,
        e.id,
        q.before_version === undefined
          ? undefined
          : version(Number(q.before_version)),
      );
      const current = (await history(c, p, e.id, undefined, 1))[0];
      const currentActions = await actions(c, p, pr.id, [
        ...new Set([current, ...rows].flatMap((x) => x.content.action_ids)),
      ]);
      const names = await commercialNames(c, p, [current, ...rows]);
      const authored = !!(
        await c.query(
          "SELECT 1 FROM ppo.project_commercial_events WHERE workspace_id=$1 AND entry_id=$2 AND created_by=$3 AND command IN ('Create','Revise','Submit') LIMIT 1",
          [p.workspace_id, e.id, p.actor_id],
        )
      ).rowCount;
      return {
        context,
        current_actions: currentActions.filter((a) =>
          current.content.action_ids.includes(a.id),
        ),
        can_prepare:
          context.can_prepare &&
          pr.lifecycle === "Active" &&
          [pr.coordinator_id, current.content.owner_id].includes(p.actor_id),
        can_decide:
          context.can_review && pr.lifecycle === "Active" && !authored,
        independent_review_required: authored,
        current: commercialPresentation(
          {
            ...projection(e, current),
            correction_status: await noticeCorrection(c, p, e),
          },
          names,
        ),
        history: rows
          .slice(0, 50)
          .map((v) => commercialPresentation(projection(e, v), names)),
        next_before_version: rows.length > 50 ? rows[49].version : null,
        source,
        source_status: status,
        synthetic: true,
        observed_at: new Date().toISOString(),
      };
    }
    if (q.before_version !== undefined)
      throw new AppError(422, "InvalidData", "History requires a record id.");
    const kind = q.kind === undefined ? null : choice(q.kind, "kind", kinds);
    const pg = page(
      { limit: q.limit, cursor: q.cursor },
      {
        workspace: p.workspace_id,
        actor: p.actor_id,
        company: workingCompanyFor(p.actor_id),
        project: pr.id,
        kind,
      },
    );
    const items: (ReturnType<typeof projection> & {
      source_status: "Current" | "Changed";
      activity_counts: { open: number; closed: number };
      correction_status: NoticeCorrection;
    })[] = [];
    // A dependent entry retains its basis's exact source. Reuse only within this
    // authorised project read; no source/permission result survives a new request.
    const sourceChecks = new Map<string, "Current" | "Changed">();
    const correctionHeads = new Map<string, string>();
    let after: string | null = null,
      partial = false;
    // Native signed cursors are encoded, not encrypted. Only a visible record may be their anchor.
    // Scan fixed-size batches before sorting permitted rows; never return a hidden ID.
    for (;;) {
      const rows: (Entry & Event)[] = (
        await c.query<Entry & Event>(
          `SELECT e.*,v.* FROM ppo.project_commercial_entries e JOIN LATERAL
        (SELECT * FROM ppo.project_commercial_events v WHERE v.workspace_id=e.workspace_id AND v.entry_id=e.id ORDER BY version DESC LIMIT 1) v ON true
        WHERE e.workspace_id=$1 AND e.project_id=$2 AND ($3::text IS NULL OR e.kind=$3) AND ($4::uuid IS NULL OR e.id>$4) ORDER BY e.id LIMIT 200`,
          [p.workspace_id, pr.id, kind, after],
        )
      ).rows;
      for (const r of rows) {
        if (r.kind === "Notice" && r.predecessor_id)
          correctionHeads.set(r.predecessor_id, r.id);
        try {
          const sourceKey = r.basis_id ?? r.id;
          let sourceState = sourceChecks.get(sourceKey);
          if (!sourceState) {
            const source = await sourceAuthority(c, p, r);
            sourceState = await sourceStatus(c, p, pr.id, source);
            sourceChecks.set(sourceKey, sourceState);
          }
          const linked = await actions(c, p, pr.id, r.content.action_ids);
          const closed = linked.filter((a) =>
            ["Completed", "Cancelled"].includes(a.state),
          ).length;
          items.push({
            ...projection(r, r),
            source_status: sourceState,
            activity_counts: { open: linked.length - closed, closed },
            correction_status: r.kind === "Notice" ? "Latest" : null,
          });
        } catch (e) {
          if (!denied(e)) throw e;
          partial = true;
        }
      }
      if (rows.length < 200) break;
      after = rows.at(-1)!.id;
    }
    const visibleIds = new Set(items.map((item) => item.id));
    for (const item of items) {
      const successor = correctionHeads.get(item.id);
      if (successor)
        item.correction_status = visibleIds.has(successor)
          ? "Corrected"
          : "Unavailable";
    }
    // Sort only authorised records. The signed cursor names a visible anchor; hidden IDs/counts never escape.
    items.sort(
      (a, b) =>
        b.recorded_at.localeCompare(a.recorded_at) || a.id.localeCompare(b.id),
    );
    const anchor = pg.after ? items.findIndex((x) => x.id === pg.after) : -1;
    if (pg.after && anchor < 0)
      invalid("cursor", "The result changed. Start a fresh read.");
    const remaining = items.slice(anchor + 1);
    const selected = remaining.slice(0, pg.limit);
    const names = await commercialNames(
      c,
      p,
      selected.map((x) => ({ content: x.content, created_by: x.recorded_by })),
    );
    const complete = !partial && remaining.length <= pg.limit;
    const counts =
      complete && !pg.after
        ? Object.fromEntries(
            kinds.map((k) => [k, items.filter((x) => x.kind === k).length]),
          )
        : null;
    return {
      context,
      counts,
      items: selected.map((x) => commercialPresentation(x, names)),
      next_cursor:
        remaining.length > pg.limit ? pg.cursor(selected.at(-1)!.id) : null,
      completeness: partial ? "Partial" : complete ? "Complete" : "Page",
      synthetic: true,
      observed_at: new Date().toISOString(),
    };
  });
}
export async function readCommercialFinance(
  p: Principal,
  project: string,
  input: Record<string, string> = {},
) {
  object(input, []);
  return transaction(async (c) => {
    await c.query("SELECT 1 FROM ppo.workspaces WHERE id=$1 FOR SHARE", [
      p.workspace_id,
    ]);
    const pr = await authority(c, p, project);
    await companyContext(c, p, pr.company_id, pr.site_id, "finance.read");
    await companyContext(
      c,
      p,
      pr.company_id,
      pr.site_id,
      "shared.finance.read",
    );
    const meta = {
      definition: "PJ05-FD08",
      definition_version: 1,
      project_id: pr.id,
      currency: "AUD",
      tax_basis: "ExcludingTax",
      synthetic: true,
      observed_at: new Date().toISOString(),
      unavailable_measures: [
        "billed_value",
        "cash_received",
        "open_receivable",
        "posted_cost",
        "open_commitment",
        "forecast_cost",
        "margin",
      ],
    };
    const held = (reason: string) => ({
      ...meta,
      status: "Held",
      reason,
      completeness: "Incomplete",
      basis_id: null,
      original_control_value: null,
      approved_change_value: null,
      adjusted_control_value: null,
      requested_pending: null,
      priced_pending: null,
      disputed: null,
      breakdown: [],
    });
    const basis = (
      await c.query<Entry>(
        "SELECT e.* FROM ppo.project_commercial_entries e JOIN ppo.project_commercial_events v ON (v.workspace_id,v.entry_id)=(e.workspace_id,e.id) WHERE e.workspace_id=$1 AND e.project_id=$2 AND e.kind='Basis' AND v.state='Approved'",
        [p.workspace_id, pr.id],
      )
    ).rows[0];
    if (!basis) return held("ApprovedBasisNeeded");
    const rows = (
      await c.query<Entry & Event>(
        `SELECT e.*,v.* FROM ppo.project_commercial_entries e JOIN LATERAL
      (SELECT * FROM ppo.project_commercial_events v WHERE v.workspace_id=e.workspace_id AND v.entry_id=e.id ORDER BY version DESC LIMIT 1) v ON true
      WHERE e.workspace_id=$1 AND e.basis_id=$2 AND e.kind='Variation' ORDER BY e.id`,
        [p.workspace_id, basis.id],
      )
    ).rows;
    const source = await savedSource(c, p, basis.id);
    let status: "Current" | "Changed";
    try {
      status = await sourceStatus(c, p, pr.id, source);
      const basisEvent = (await history(c, p, basis.id, undefined, 1))[0];
      await actions(c, p, pr.id, [
        ...new Set([basisEvent, ...rows].flatMap((x) => x.content.action_ids)),
      ]);
    } catch (e) {
      if (!denied(e)) throw e;
      return held("RequiredEvidenceUnavailable");
    }
    const approved = rows.filter((x) => x.state === "Approved"),
      pending = rows.filter(
        (x) =>
          ["Requested", "Assessed", "Submitted"].includes(x.state) &&
          !x.disputed,
      ),
      disputed = rows.filter((x) => x.disputed);
    const approvedTotal = total(approved.map((x) => x.content.priced_amount));
    return {
      ...meta,
      status: status === "Current" ? "Current" : "Held",
      reason: status === "Current" ? null : "SourceChanged",
      source_status: status,
      source,
      completeness: status === "Current" ? "Complete" : "Held",
      basis_id: basis.id,
      original_control_value: source.amount,
      approved_change_value: approvedTotal.value,
      adjusted_control_value:
        status === "Current" && approvedTotal.value !== null
          ? decimal(cents(source.amount) + cents(approvedTotal.value))
          : null,
      requested_pending: total(pending.map((x) => x.content.requested_amount)),
      priced_pending: total(
        pending
          .filter((x) => ["Assessed", "Submitted"].includes(x.state))
          .map((x) => x.content.priced_amount),
      ),
      disputed: total(disputed.map((x) => x.content.priced_amount)),
      breakdown: rows.map((x) => ({
        id: x.id,
        version: x.version,
        state: x.state,
        disputed: x.disputed,
        predecessor_id: x.predecessor_id,
        requested_amount: x.content.requested_amount,
        priced_amount: x.content.priced_amount,
      })),
    };
  });
}
