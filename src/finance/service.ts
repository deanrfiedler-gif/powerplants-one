import { randomUUID } from "node:crypto";
import type { PoolClient } from "pg";
import type { Principal } from "../platform/identity";
import {
  sharedOperation,
  canonical,
  lockOperation,
  priorReceipt,
} from "../platform/operations";
import { transaction } from "../platform/database";
import { digest } from "../documents/store";
import { insert } from "../documents/packs";
import { sameVersion } from "../scheduling/validation";
import { choice, uuid } from "../shared/validation";
import { unavailable } from "../platform/errors";
import {
  financeContext,
  financeWork,
  financeAccount,
  accountCurrent,
  definition,
  exactSource,
  blocked,
  hash,
  type SourceEntry,
  type SourceRef,
} from "./context";
import {
  editCommand,
  command,
  scenarios,
  scaled,
  decimal,
  basis,
} from "./validation";

type Context = Awaited<ReturnType<typeof financeContext>>;
type Mutation = { operation_id: string; reason: string };
export async function event(
  c: PoolClient,
  p: Principal,
  h: Context["h"],
  cmd: Mutation,
  kind: string,
  details: Record<string, unknown> = {},
) {
  await insert(c, "finance_events", {
    id: randomUUID(),
    workspace_id: p.workspace_id,
    handoff_id: h.id,
    version: h.version,
    status: h.status,
    revision_id: h.current_revision_id,
    actor_id: p.actor_id,
    operation_id: cmd.operation_id,
    kind,
    reason: cmd.reason,
    details,
  });
  return {
    ...h,
    state: h.status,
    audit_details: { ...details, revision_id: h.current_revision_id },
  };
}
export async function bump(
  c: PoolClient,
  p: Principal,
  h: Context["h"],
  cmd: Mutation,
  kind: string,
  fields: Record<string, unknown> = {},
  details: Record<string, unknown> = {},
) {
  const e = Object.entries(fields),
    updated = (
      await c.query(
        `UPDATE ppo.finance_handoffs SET version=version+1,updated_by=$3,updated_at=clock_timestamp()${e.map((x, i) => `,${x[0]}=$${i + 4}`).join("")} WHERE workspace_id=$1 AND id=$2 RETURNING *`,
        [p.workspace_id, h.id, p.actor_id, ...e.map((x) => x[1])],
      )
    ).rows[0];
  return event(c, p, updated, cmd, kind, details);
}
export async function currentRevision(
  c: PoolClient,
  p: Principal,
  ctx: Context,
  checkSource = true,
) {
  const v = (
    await c.query(
      "SELECT * FROM ppo.finance_revisions WHERE workspace_id=$1 AND id=$2",
      [p.workspace_id, ctx.h.current_revision_id],
    )
  ).rows[0];
  if (!v) throw unavailable();
  if (checkSource) {
    if (ctx.h.needs_review) blocked("SourceChanged", ctx.h.source_blocker);
    const d = await definition(c, p);
    if (
      d.id !== v.definition_id ||
      d.version !== v.definition_version ||
      d.policy_version !== v.policy_version
    )
      blocked(
        "FinancePolicyChanged",
        "Re-review the exact current Finance policy and definition.",
      );
    await accountCurrent(c, p, ctx.a);
    const sources = [];
    for (const ref of v.source_snapshot.reports as SourceRef[])
      sources.push(await exactSource(c, p, ctx.w, ref));
    if (hash({ ...v.source_snapshot, reports: sources }) !== v.source_hash)
      blocked("SourceChanged", "The exact Finance source snapshot changed.");
    const entries = new Map(
      sources.flatMap((s) => s.entries).map((e) => [e.id, e]),
    );
    for (const line of await financeLines(c, p, v.id)) {
      const e = entries.get(line.entry_id);
      if (
        !e ||
        e.version !== line.entry_version ||
        e.root_entry_id !== line.root_entry_id ||
        e.report_revision_id !== line.report_revision_id ||
        scaled(e.quantity) !== scaled(line.captured_quantity) ||
        scaled(e.quantity) !== scaled(line.reviewed_quantity) ||
        e.uom !== line.uom ||
        e.direction !== line.direction ||
        e.source_entry_hash !== line.source_entry_hash
      )
        blocked(
          "ExactAllocationSourceRequired",
          "An allocation differs from its exact approved source entry/version/hash.",
        );
    }
  }
  return v;
}
async function noPossibleEffect(c: PoolClient, p: Principal, h: Context["h"]) {
  if (
    (
      await c.query(
        "SELECT 1 FROM ppo.finance_processing_attempts a WHERE a.workspace_id=$1 AND a.handoff_id=$2 AND a.dispatch_started_at IS NOT NULL AND NOT EXISTS(SELECT 1 FROM ppo.finance_outcomes o WHERE o.workspace_id=a.workspace_id AND o.attempt_id=a.id AND o.outcome='NotProcessed')",
        [p.workspace_id, h.id],
      )
    ).rowCount
  )
    blocked(
      "ProcessingEvidenceLocked",
      "A possible or accepted target requires recorded outcome and a linked correction; original allocations cannot be released.",
    );
}
async function revision(
  c: PoolClient,
  p: Principal,
  ctx: Context,
  cmd: ReturnType<typeof editCommand>,
) {
  const d = await definition(c, p);
  if (ctx.a.currency !== d.definition.currency.code)
    blocked(
      "UnsupportedCurrencyBasis",
      "The selected account currency has no independently specified Finance fixture definition.",
    );
  if (
    d.id !== cmd.definition_id ||
    d.version !== cmd.definition_version ||
    d.policy_version !== cmd.policy_version
  )
    blocked(
      "FinancePolicyChanged",
      "Reload the current Finance definition and policy.",
    );
  await accountCurrent(c, p, ctx.a);
  const sources = [];
  for (const ref of cmd.reports)
    sources.push(await exactSource(c, p, ctx.w, ref));
  const source_snapshot = {
      schema_version: 1,
      synthetic: true,
      company_id: ctx.w.company_id,
      customer_id: ctx.w.customer_id,
      account_id: ctx.a.id,
      currency: ctx.a.currency,
      mapping_hash: hash(ctx.a.mapping_snapshot),
      reports: sources,
    },
    rID = randomUUID();
  const r = await insert(c, "finance_revisions", {
    id: rID,
    workspace_id: p.workspace_id,
    handoff_id: ctx.h.id,
    revision: ctx.h.revision + 1,
    predecessor_id: ctx.h.current_revision_id,
    definition_id: d.id,
    definition_version: d.version,
    policy_version: d.policy_version,
    source_snapshot,
    source_hash: hash(source_snapshot),
    treatment_basis: cmd.treatment_basis,
    remaining_work_basis: cmd.remaining_work_basis,
    reason: cmd.reason,
    actor_id: p.actor_id,
    operation_id: cmd.operation_id,
  });
  for (const s of sources)
    await insert(c, "finance_sources", {
      workspace_id: p.workspace_id,
      revision_id: r.id,
      report_id: s.report_id,
      report_revision_id: s.revision_id,
      review_id: s.review_id,
      issue_id: s.issue_id,
      source_hash: s.source_hash,
    });
  const entries = new Map<string, SourceEntry>(
      sources.flatMap((s) => s.entries).map((e) => [e.id, e]),
    ),
    groups = new Map<string, string>();
  for (const l of cmd.lines) {
    const e = entries.get(l.entry_id);
    if (!e) throw unavailable();
    if (l.target_group) {
      const grain = `${e.uom}:${e.direction}`;
      if (groups.has(l.target_group) && groups.get(l.target_group) !== grain)
        blocked(
          "TargetGrainMismatch",
          "A shared target group must have the same unit and direction.",
        );
      groups.set(l.target_group, grain);
    }
    await insert(c, "finance_lines", {
      id: randomUUID(),
      workspace_id: p.workspace_id,
      revision_id: r.id,
      report_revision_id: e.report_revision_id,
      entry_id: e.id,
      entry_version: e.version,
      root_entry_id: e.root_entry_id,
      captured_quantity: e.quantity,
      reviewed_quantity: e.quantity,
      allocated_quantity: l.quantity,
      billable_quantity:
        l.disposition === "Billable"
          ? l.quantity
          : l.disposition === "NonBillable"
            ? "0"
            : null,
      uom: e.uom,
      direction: e.direction,
      disposition: l.disposition,
      reason: l.reason,
      target_group: l.target_group,
      source_entry_hash: e.source_entry_hash,
    });
  }
  return r;
}
export async function saveFinance(
  p: Principal,
  id: string | null,
  input: unknown,
) {
  const cmd = editCommand(id, input);
  return sharedOperation(
    p,
    cmd,
    id ? "ReviseFinance" : "CreateFinance",
    async (c) => {
      const w = await financeWork(c, p, cmd.work_order_id, "finance.prepare"),
        a = await financeAccount(c, p, cmd.account_id, "finance.prepare");
      if (w.customer_id !== a.organisation_id || w.company_id !== a.company_id)
        throw unavailable();
      if (id) {
        const ctx = await financeContext(c, p, id, "finance.prepare");
        if (
          ctx.h.work_order_id !== w.id ||
          ctx.h.account_id !== a.id ||
          ctx.h.mode !== cmd.mode
        )
          throw unavailable();
        return ctx;
      }
      return { w, a, h: null };
    },
    async (c, initial) => {
      let h = initial.h;
      if (h) {
        sameVersion(h.version, cmd.expected_version!);
        if (!["Draft", "Returned"].includes(h.status))
          blocked("FinanceStateChanged", "Revise a Draft or Returned handoff.");
        await noPossibleEffect(c, p, h);
        await c.query(
          "UPDATE ppo.finance_allocation_holds SET state='Released' WHERE workspace_id=$1 AND handoff_id=$2 AND state='Held'",
          [p.workspace_id, h.id],
        );
      } else
        h = await insert(c, "finance_handoffs", {
          id: cmd.id,
          workspace_id: p.workspace_id,
          company_id: initial.w.company_id,
          site_id: initial.w.site_id,
          work_order_id: initial.w.id,
          customer_id: initial.w.customer_id,
          account_id: initial.a.id,
          mode: cmd.mode,
          currency: initial.a.currency,
          owner_id: p.actor_id,
          correlation_id: randomUUID(),
          created_by: p.actor_id,
          updated_by: p.actor_id,
        });
      // The initial aggregate event is retained even though its first revision is appended in this transaction.
      if (!id) await event(c, p, h, cmd, "Created");
      const r = await revision(c, p, { ...initial, h }, cmd);
      return bump(c, p, h, cmd, "DraftSaved", {
        status: "Draft",
        revision: r.revision,
        current_revision_id: r.id,
        needs_review: false,
        source_blocker: null,
        active_attempt_id: null,
        processing_owner_id: null,
      });
    },
    "FinancialHandoff",
    "FinanceDraftSaved",
  );
}
export async function financeLines(
  c: PoolClient,
  p: Principal,
  revisionID: string,
) {
  return (
    await c.query(
      "SELECT * FROM ppo.finance_lines WHERE workspace_id=$1 AND revision_id=$2 ORDER BY id",
      [p.workspace_id, revisionID],
    )
  ).rows;
}
export async function submitFinance(p: Principal, id: string, input: unknown) {
  const { cmd } = command(id, input);
  return sharedOperation(
    p,
    cmd,
    "SubmitFinance",
    (c) => financeContext(c, p, id, "finance.prepare"),
    async (c, ctx) => {
      sameVersion(ctx.h.version, cmd.expected_version);
      if (ctx.h.status !== "Draft")
        blocked("FinanceStateChanged", "Submit the current Draft revision.");
      const v = await currentRevision(c, p, ctx),
        lines = await financeLines(c, p, v.id),
        totals = new Map<string, bigint>();
      for (const l of lines)
        totals.set(
          l.entry_id,
          (totals.get(l.entry_id) ?? 0n) + scaled(l.allocated_quantity),
        );
      for (const s of v.source_snapshot.reports)
        for (const e of s.entries as SourceEntry[])
          if (totals.get(e.id) !== scaled(e.quantity))
            blocked(
              "AllocationIncomplete",
              "Disposition the complete reviewed quantity of every selected report entry, including non-billable quantities.",
            );
      for (const l of lines)
        await insert(c, "finance_allocation_holds", {
          workspace_id: p.workspace_id,
          handoff_id: id,
          revision_id: v.id,
          line_id: l.id,
          root_entry_id: l.root_entry_id,
          quantity: l.allocated_quantity,
          state: "Held",
        });
      return bump(c, p, ctx.h, cmd, "Submitted", { status: "ReadyForReview" });
    },
    "FinancialHandoff",
    "FinanceSubmitted",
  );
}
export async function reviewFinance(p: Principal, id: string, input: unknown) {
  const { v, cmd: base } = command(id, input, [
      "revision_id",
      "source_hash",
      "decision",
    ]),
    cmd = {
      ...base,
      revision_id: uuid(v.revision_id, "revision_id"),
      source_hash: basis(v.source_hash, "source_hash"),
      decision: choice(v.decision, "decision", [
        "Approved",
        "Returned",
      ] as const),
    };
  return sharedOperation(
    p,
    cmd,
    "ReviewFinance",
    (c) => financeContext(c, p, id, "finance.review"),
    async (c, ctx) => {
      sameVersion(ctx.h.version, cmd.expected_version);
      if (
        !(
          ctx.h.status === "ReadyForReview" ||
          (ctx.h.status === "Approved" && cmd.decision === "Returned")
        ) ||
        ctx.h.owner_id === p.actor_id
      )
        blocked(
          "FinanceReviewRequired",
          "An independent synthetic Finance reviewer must review ReadyForReview.",
        );
      const r = await currentRevision(c, p, ctx, cmd.decision === "Approved");
      if (r.id !== cmd.revision_id || r.source_hash !== cmd.source_hash)
        blocked(
          "SourceChanged",
          "Review the exact submitted Finance revision and hash.",
        );
      if (ctx.h.status === "Approved") {
        await noPossibleEffect(c, p, ctx.h);
        const approved = (
          await c.query(
            "SELECT id FROM ppo.finance_reviews WHERE workspace_id=$1 AND revision_id=$2 AND decision='Approved'",
            [p.workspace_id, r.id],
          )
        ).rows[0];
        return bump(
          c,
          p,
          ctx.h,
          cmd,
          "ApprovalReturned",
          { status: "Returned" },
          {
            original_review_id: approved.id,
            source_hash: r.source_hash,
            correction_reason: cmd.reason,
          },
        );
      }
      if (
        cmd.decision === "Approved" &&
        (await financeLines(c, p, r.id)).some(
          (l) => !["Billable", "NonBillable"].includes(l.disposition),
        )
      )
        blocked(
          "FinancialTreatmentIncomplete",
          "Resolve every Pending, WarrantyReview and GoodwillReview disposition before approval.",
        );
      await insert(c, "finance_reviews", {
        id: randomUUID(),
        workspace_id: p.workspace_id,
        handoff_id: id,
        revision_id: r.id,
        decision: cmd.decision,
        source_hash: r.source_hash,
        definition_id: r.definition_id,
        policy_version: r.policy_version,
        reason: cmd.reason,
        actor_id: p.actor_id,
        operation_id: cmd.operation_id,
      });
      return bump(c, p, ctx.h, cmd, "Reviewed", { status: cmd.decision });
    },
    "FinancialHandoff",
    "FinanceReviewed",
  );
}
export async function cancelFinance(p: Principal, id: string, input: unknown) {
  const { cmd } = command(id, input);
  return sharedOperation(
    p,
    cmd,
    "CancelFinance",
    (c) => financeContext(c, p, id, "finance.prepare"),
    async (c, ctx) => {
      sameVersion(ctx.h.version, cmd.expected_version);
      if (
        !["Draft", "Returned", "ReadyForReview", "Approved"].includes(
          ctx.h.status,
        )
      )
        blocked("FinanceStateChanged", "Cancel only before a possible effect.");
      await noPossibleEffect(c, p, ctx.h);
      await c.query(
        "UPDATE ppo.finance_allocation_holds SET state='Released' WHERE workspace_id=$1 AND handoff_id=$2 AND state='Held'",
        [p.workspace_id, id],
      );
      return bump(c, p, ctx.h, cmd, "Cancelled", { status: "Cancelled" });
    },
    "FinancialHandoff",
    "FinanceDraftSaved",
  );
}
export type TargetLine = {
  id: string;
  group: string;
  quantity: string;
  uom: string;
  direction: string;
  source_allocations: { line_id: string; quantity: string }[];
};
function targetLines(
  lines: Awaited<ReturnType<typeof financeLines>>,
): TargetLine[] {
  const groups = new Map<string, TargetLine>();
  for (const l of lines) {
    if (l.disposition !== "Billable") continue;
    let t = groups.get(l.target_group);
    if (!t) {
      t = {
        id: randomUUID(),
        group: l.target_group,
        quantity: "0",
        uom: l.uom,
        direction: l.direction,
        source_allocations: [],
      };
      groups.set(l.target_group, t);
    }
    t.quantity = decimal(scaled(t.quantity) + scaled(l.billable_quantity));
    t.source_allocations.push({
      line_id: l.id,
      quantity: decimal(scaled(l.billable_quantity)),
    });
  }
  return [...groups.values()].sort((a, b) => a.group.localeCompare(b.group));
}
export async function beginFinanceProcessing(
  p: Principal,
  id: string,
  input: unknown,
) {
  const { v, cmd: base } = command(id, input, ["scenario"]),
    cmd = { ...base, scenario: choice(v.scenario, "scenario", scenarios) };
  return sharedOperation(
    p,
    cmd,
    "BeginFinanceProcessing",
    (c) => financeContext(c, p, id, "finance.process"),
    async (c, ctx) => {
      sameVersion(ctx.h.version, cmd.expected_version);
      if (ctx.h.status !== "Approved")
        blocked(
          "FinanceStateChanged",
          "Only current Approved evidence can be claimed once.",
        );
      if (
        ctx.h.mode === "SyntheticManual" &&
        cmd.scenario === "AcceptedThenTimeout"
      )
        blocked(
          "SyntheticModeMismatch",
          "F-07 timeout simulation requires explicitly selected SyntheticApi mode.",
        );
      const r = await currentRevision(c, p, ctx),
        review = (
          await c.query(
            "SELECT * FROM ppo.finance_reviews WHERE workspace_id=$1 AND revision_id=$2 AND decision='Approved'",
            [p.workspace_id, r.id],
          )
        ).rows[0];
      const attempt = (
          await c.query(
            "SELECT coalesce(max(attempt),0)+1 AS n FROM ppo.finance_processing_attempts WHERE workspace_id=$1 AND handoff_id=$2",
            [p.workspace_id, id],
          )
        ).rows[0].n,
        prior = (
          await c.query(
            "SELECT source_snapshot FROM ppo.finance_processing_attempts WHERE workspace_id=$1 AND handoff_id=$2 AND revision_id=$3 ORDER BY attempt LIMIT 1",
            [p.workspace_id, id, r.id],
          )
        ).rows[0];
      // A retry retains the original target line identities and hash as well as the correlation.
      const snapshot = prior?.source_snapshot ?? {
          revision_id: r.id,
          source_hash: r.source_hash,
          review_id: review.id,
          company_id: ctx.h.company_id,
          customer_id: ctx.h.customer_id,
          account_id: ctx.h.account_id,
          currency: ctx.h.currency,
          correlation_id: ctx.h.correlation_id,
          kind: "SyntheticServiceCharge",
          lines: targetLines(await financeLines(c, p, r.id)),
        },
        a = await insert(c, "finance_processing_attempts", {
          id: randomUUID(),
          workspace_id: p.workspace_id,
          handoff_id: id,
          revision_id: r.id,
          review_id: review.id,
          attempt,
          actor_id: p.actor_id,
          operation_id: cmd.operation_id,
          correlation_id: ctx.h.correlation_id,
          input_hash: hash(snapshot),
          source_snapshot: snapshot,
          scenario: cmd.scenario,
        });
      return bump(
        c,
        p,
        ctx.h,
        cmd,
        "ProcessingClaimed",
        {
          status: "AwaitingERP",
          processing_owner_id: p.actor_id,
          active_attempt_id: a.id,
        },
        { attempt_id: a.id, correlation_id: ctx.h.correlation_id },
      );
    },
    "FinancialHandoff",
    "FinanceProcessingClaimed",
  );
}
// An independently committed synthetic target boundary. A lookup of a missing result
// fences this attempt as NotProcessed; a late dispatch can never create an effect afterwards.
async function simulator(
  p: Principal,
  id: string,
  attemptID: string,
  lookup: boolean,
) {
  return transaction(async (c) => {
    await c.query("SELECT 1 FROM ppo.workspaces WHERE id=$1 FOR UPDATE", [
      p.workspace_id,
    ]);
    const ctx = await financeContext(c, p, id, "finance.process");
    const a = (
      await c.query(
        "SELECT * FROM ppo.finance_processing_attempts WHERE workspace_id=$1 AND handoff_id=$2 AND id=$3 FOR UPDATE",
        [p.workspace_id, id, attemptID],
      )
    ).rows[0];
    if (!a || a.actor_id !== p.actor_id || ctx.h.active_attempt_id !== a.id)
      throw unavailable();
    const prior = (
      await c.query(
        "SELECT * FROM ppo.finance_simulator_results WHERE workspace_id=$1 AND attempt_id=$2",
        [p.workspace_id, a.id],
      )
    ).rows[0];
    if (prior) return prior;
    let target = null;
    if (
      !lookup &&
      a.scenario !== "NotProcessed" &&
      a.source_snapshot.lines.length
    ) {
      await currentRevision(c, p, ctx);
      target = (
        await c.query(
          "SELECT * FROM ppo.finance_simulator_targets WHERE workspace_id=$1 AND correlation_id=$2",
          [p.workspace_id, a.correlation_id],
        )
      ).rows[0];
      if (target && target.input_hash !== a.input_hash)
        blocked(
          "OriginalTargetConflict",
          "The original correlation belongs to different approved target content.",
        );
      if (!target) {
        const lines: TargetLine[] = structuredClone(a.source_snapshot.lines);
        if (a.scenario === "Partial")
          lines[0].quantity = decimal(scaled(lines[0].quantity) / 2n);
        target = await insert(c, "finance_simulator_targets", {
          id: randomUUID(),
          workspace_id: p.workspace_id,
          handoff_id: id,
          account_id: ctx.h.account_id,
          company_id: ctx.h.company_id,
          customer_id: ctx.h.customer_id,
          currency: ctx.h.currency,
          correlation_id: a.correlation_id,
          input_hash: a.input_hash,
          attempt_id: a.id,
          kind: "SyntheticServiceCharge",
          status: a.scenario === "Partial" ? "Partial" : "Accepted",
          lines: JSON.stringify(lines),
        });
      }
    }
    return insert(c, "finance_simulator_results", {
      id: randomUUID(),
      workspace_id: p.workspace_id,
      attempt_id: a.id,
      target_id: target?.id ?? null,
      outcome: target ? "Processed" : "NotProcessed",
      evidence: {
        provider: "PPO-SyntheticTarget-v1",
        synthetic: true,
        attempt_id: a.id,
        correlation_id: a.correlation_id,
        input_hash: a.input_hash,
        target: target ?? null,
        fenced: true,
        reason: lookup
          ? "Original operation lookup; missing result is durably fenced before any late dispatch."
          : "Controlled synthetic fixture result.",
      },
    });
  });
}
export type ProcessingHooks = {
  afterTarget?: () => Promise<void>;
  beforeRecord?: () => Promise<void>;
};
export async function recordFinanceOutcome(
  p: Principal,
  id: string,
  input: unknown,
  hooks: ProcessingHooks = {},
) {
  const { v, cmd: base } = command(id, input, ["attempt_id", "action"]),
    cmd = {
      ...base,
      attempt_id: uuid(v.attempt_id, "attempt_id"),
      action: choice(v.action, "action", [
        "Dispatch",
        "LookupOriginal",
      ] as const),
    },
    payloadHash = digest(
      canonical({ command: "RecordFinanceOutcome", ...cmd }),
    );
  const prepared = await transaction(async (c) => {
    await lockOperation(c, p, cmd.operation_id);
    await c.query("SELECT 1 FROM ppo.workspaces WHERE id=$1 FOR UPDATE", [
      p.workspace_id,
    ]);
    const ctx = await financeContext(c, p, id, "finance.process"),
      prior = await priorReceipt(c, p, cmd.operation_id, payloadHash);
    if (prior) return { receipt: prior };
    sameVersion(ctx.h.version, cmd.expected_version);
    if (
      !["AwaitingERP", "OutcomeUnknown"].includes(ctx.h.status) ||
      ctx.h.active_attempt_id !== cmd.attempt_id
    )
      blocked(
        "FinanceStateChanged",
        "Record or investigate the original active processing attempt.",
      );
    const a = (
      await c.query(
        "SELECT * FROM ppo.finance_processing_attempts WHERE workspace_id=$1 AND id=$2",
        [p.workspace_id, cmd.attempt_id],
      )
    ).rows[0];
    if (cmd.action === "Dispatch") {
      if (a.dispatch_started_at || ctx.h.status === "OutcomeUnknown")
        blocked(
          "OriginalLookupRequired",
          "The original may already have an effect. Use original-operation lookup; do not dispatch again.",
        );
      await currentRevision(c, p, ctx);
      await c.query(
        "UPDATE ppo.finance_processing_attempts SET dispatch_started_at=clock_timestamp() WHERE workspace_id=$1 AND id=$2",
        [p.workspace_id, a.id],
      );
    }
    return { scenario: a.scenario };
  });
  if (prepared.receipt) return { receipt: prepared.receipt, replayed: true };
  const result = await simulator(
    p,
    id,
    cmd.attempt_id,
    cmd.action === "LookupOriginal",
  );
  await hooks.afterTarget?.();
  return sharedOperation(
    p,
    cmd,
    "RecordFinanceOutcome",
    (c) => financeContext(c, p, id, "finance.process"),
    async (c, ctx) => {
      sameVersion(ctx.h.version, cmd.expected_version);
      if (
        ctx.h.active_attempt_id !== cmd.attempt_id ||
        !["AwaitingERP", "OutcomeUnknown"].includes(ctx.h.status)
      )
        blocked(
          "FinanceStateChanged",
          "The original processing claim changed. Its target remains retained.",
        );
      const unknown =
          cmd.action === "Dispatch" &&
          prepared.scenario === "AcceptedThenTimeout",
        outcome = unknown ? "Unknown" : result.outcome,
        evidence = unknown
          ? {
              synthetic: true,
              provider: "PPO-SyntheticTarget-v1",
              attempt_id: cmd.attempt_id,
              correlation_id: ctx.h.correlation_id,
              status: "TimeoutAfterPossibleAcceptance",
            }
          : result.evidence;
      const o = await insert(c, "finance_outcomes", {
        id: randomUUID(),
        workspace_id: p.workspace_id,
        handoff_id: id,
        attempt_id: cmd.attempt_id,
        target_id: outcome === "Processed" ? result.target_id : null,
        outcome,
        method:
          cmd.action === "Dispatch" ? "SimulatorReceipt" : "OriginalLookup",
        evidence,
        evidence_hash: hash(evidence),
        actor_id: p.actor_id,
        operation_id: cmd.operation_id,
      });
      const billable = (
          await financeLines(c, p, ctx.h.current_revision_id)
        ).some((l) => l.disposition === "Billable"),
        state = unknown
          ? "OutcomeUnknown"
          : outcome === "Processed" || !billable
            ? "ReconciliationRequired"
            : ctx.h.needs_review
              ? "Returned"
              : "Approved";
      if (outcome === "Processed")
        await c.query(
          "UPDATE ppo.finance_allocation_holds SET state='Consumed' WHERE workspace_id=$1 AND handoff_id=$2 AND state='Held'",
          [p.workspace_id, id],
        );
      await c.query(
        "UPDATE ppo.outbox_jobs SET status=$4,error_code=$5 WHERE workspace_id=$1 AND actor_id=$2 AND operation_id=(SELECT operation_id FROM ppo.finance_processing_attempts WHERE workspace_id=$1 AND id=$3) AND kind='FinanceProcessingClaimed'",
        [
          p.workspace_id,
          p.actor_id,
          cmd.attempt_id,
          unknown ? "OutcomeUnknown" : "Done",
          unknown ? "OriginalLookupRequired" : null,
        ],
      );
      await hooks.beforeRecord?.();
      return bump(
        c,
        p,
        ctx.h,
        cmd,
        "OutcomeRecorded",
        {
          status: state,
          ...(["Approved", "Returned"].includes(state)
            ? { active_attempt_id: null, processing_owner_id: null }
            : {}),
        },
        { outcome_id: o.id, outcome },
      );
    },
    "FinancialHandoff",
    "FinanceOutcomeRecorded",
  );
}
export async function reconcileFinance(
  p: Principal,
  id: string,
  input: unknown,
) {
  const { v, cmd: base } = command(id, input, ["outcome_id", "basis"]),
    cmd = {
      ...base,
      outcome_id: uuid(v.outcome_id, "outcome_id"),
      basis: basis(v.basis, "basis"),
    };
  return sharedOperation(
    p,
    cmd,
    "ReconcileFinance",
    (c) => financeContext(c, p, id, "finance.reconcile"),
    async (c, ctx) => {
      sameVersion(ctx.h.version, cmd.expected_version);
      if (
        ctx.h.status !== "ReconciliationRequired" ||
        ctx.h.processing_owner_id === p.actor_id
      )
        blocked(
          "FinanceStateChanged",
          "A separate reconciler must compare the recorded outcome.",
        );
      await currentRevision(c, p, ctx);
      const o = (
        await c.query(
          "SELECT * FROM ppo.finance_outcomes WHERE workspace_id=$1 AND handoff_id=$2 AND id=$3",
          [p.workspace_id, id, cmd.outcome_id],
        )
      ).rows[0];
      if (
        !o ||
        o.attempt_id !== ctx.h.active_attempt_id ||
        o.outcome === "Unknown"
      )
        blocked(
          "OutcomeEvidenceRequired",
          "Use an evidenced result from the current original attempt.",
        );
      const a = (
          await c.query(
            "SELECT * FROM ppo.finance_processing_attempts WHERE workspace_id=$1 AND id=$2",
            [p.workspace_id, o.attempt_id],
          )
        ).rows[0],
        lines = await financeLines(c, p, ctx.h.current_revision_id),
        expected = a.source_snapshot.lines as TargetLine[];
      let mapping: TargetLine[] = [];
      if (expected.length) {
        const t = (
          await c.query(
            "SELECT * FROM ppo.finance_simulator_targets WHERE workspace_id=$1 AND id=$2",
            [p.workspace_id, o.target_id],
          )
        ).rows[0];
        if (
          !t ||
          o.outcome !== "Processed" ||
          t.status !== "Accepted" ||
          t.account_id !== ctx.h.account_id ||
          t.company_id !== ctx.h.company_id ||
          t.customer_id !== ctx.h.customer_id ||
          t.currency !== ctx.h.currency ||
          t.input_hash !== a.input_hash ||
          hash(t.lines) !== hash(expected)
        )
          blocked(
            "TargetDifference",
            "Target quantities, allocations, unit, direction and account must match exactly. Keep the item open and record a linked correction request.",
          );
        mapping = t.lines;
      } else if (o.outcome !== "NotProcessed")
        blocked(
          "UnexpectedTarget",
          "No-posting dispositions require verified NotProcessed evidence.",
        );
      const no_posting = lines
        .filter((l) => l.disposition === "NonBillable")
        .map((l) => ({
          line_id: l.id,
          quantity: l.allocated_quantity,
          uom: l.uom,
          reason: l.reason,
        }));
      await insert(c, "finance_reconciliations", {
        id: randomUUID(),
        workspace_id: p.workspace_id,
        handoff_id: id,
        revision_id: ctx.h.current_revision_id,
        outcome_id: o.id,
        result: expected.length ? "Matched" : "NoPostingRequired",
        line_mapping: JSON.stringify(mapping),
        no_posting: JSON.stringify(no_posting),
        basis: cmd.basis,
        actor_id: p.actor_id,
        operation_id: cmd.operation_id,
      });
      await c.query(
        "UPDATE ppo.finance_allocation_holds SET state='Consumed' WHERE workspace_id=$1 AND handoff_id=$2 AND state='Held'",
        [p.workspace_id, id],
      );
      return bump(c, p, ctx.h, cmd, "Reconciled", { status: "Reconciled" });
    },
    "FinancialHandoff",
    "FinanceReconciled",
  );
}
export async function requestFinanceCorrection(
  p: Principal,
  id: string,
  input: unknown,
) {
  const { v, cmd: base } = command(id, input, ["disposition"]),
    cmd = {
      ...base,
      disposition: choice(v.disposition, "disposition", [
        "Investigate",
        "CorrectionRequested",
        "ReversalRequested",
      ] as const),
    };
  return sharedOperation(
    p,
    cmd,
    "RequestFinanceCorrection",
    (c) => financeContext(c, p, id, "finance.reconcile"),
    async (c, ctx) => {
      sameVersion(ctx.h.version, cmd.expected_version);
      if (
        !["OutcomeUnknown", "ReconciliationRequired", "Reconciled"].includes(
          ctx.h.status,
        )
      )
        blocked(
          "FinanceStateChanged",
          "Link corrections to retained possible/processed evidence.",
        );
      const o = (
        await c.query(
          "SELECT id FROM ppo.finance_outcomes WHERE workspace_id=$1 AND handoff_id=$2 ORDER BY observed_at DESC LIMIT 1",
          [p.workspace_id, id],
        )
      ).rows[0];
      await insert(c, "finance_corrections", {
        id: randomUUID(),
        workspace_id: p.workspace_id,
        handoff_id: id,
        source_revision_id: ctx.h.current_revision_id,
        outcome_id: o?.id ?? null,
        reason: cmd.reason,
        disposition: cmd.disposition,
        actor_id: p.actor_id,
        operation_id: cmd.operation_id,
      });
      return bump(c, p, ctx.h, cmd, "CorrectionRequested", {
        status:
          ctx.h.status === "OutcomeUnknown"
            ? "OutcomeUnknown"
            : "ReconciliationRequired",
      });
    },
    "FinancialHandoff",
    "FinanceReconciled",
  );
}
