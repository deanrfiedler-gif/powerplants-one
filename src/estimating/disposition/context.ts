import { returnedSupplyBasis } from "../supply-followup/context";
import type { Checked } from "../supply-followup/authority";
import type { Principal } from "../../platform/identity";
import type { QueryClient } from "../../platform/permissions";
import { AppError, unavailable } from "../../platform/errors";
import { scopedOwner } from "../../shared/authority";
import { supplyRecord } from "../../supply/context";
import { factsFor } from "../../supply/reads";
import {
  currentFacts,
  decimal,
  type SupplyRecord,
  type Allocation,
} from "../../supply/model";
import { conversionAuthority, conversionContext } from "../conversion/context";
import { latestResolution } from "../conversion/model";
import type { ResponseEvent } from "../response/model";
import { releaseHash } from "../release/context";
import type { recordCommand } from "../../supply/validation";
export type DispositionEvent = {
  id: string;
  workspace_id: string;
  revision_id: string;
  execution_id: string;
  target_id: string;
  sequence: number;
  action: "Review" | "Apply";
  predecessor_id: string | null;
  review_id: string | null;
  decision: "Retain" | "ReviseQuantity" | "Hold";
  basis: DispositionBasis & {
    supply_followup?: Awaited<ReturnType<typeof returnedSupplyBasis>>;
  };
  basis_hash: string;
  command: ReturnType<typeof recordCommand> | null;
  review_hash: string;
  owner_id: string;
  due_date: string;
  next_action: string;
  reason: string;
  evidence: string;
  created_by: string;
  created_at: Date;
  operation_id: string;
  effect_version: number | null;
};
export type DispositionBasis = Awaited<ReturnType<typeof targetBasis>>;
// All values entering the hash are JSON values, including PostgreSQL timestamp strings.
export const dispositionHash = (v: unknown) =>
  releaseHash(JSON.parse(JSON.stringify(v)));
export function dispositionConflict(message: string): never {
  throw new AppError(409, "DispositionConflict", message);
}
export async function targetBasis(
  c: QueryClient,
  p: Principal,
  d: Awaited<ReturnType<typeof conversionContext>>,
  target: string,
) {
  const link = (
    await c.query<{
      execution_id: string;
      plan_id: string;
      line_id: string;
      revision_id: string;
    }>(
      "SELECT execution_id,plan_id,line_id,revision_id FROM ppo.quote_conversion_targets WHERE workspace_id=$1 AND target_id=$2 AND revision_id=$3",
      [p.workspace_id, target, d.q.id],
    )
  ).rows[0];
  if (!link) throw unavailable();
  const execution = d.executions.find((e) => e.id === link.execution_id)!;
  const plan = d.events.find((e) => e.id === link.plan_id)!;
  if (!execution || !plan?.plan) throw unavailable();
  const r = await supplyRecord(c, p, target);
  const snapshots = (
    await c.query<{ current: SupplyRecord; original: SupplyRecord }>(
      "SELECT (to_jsonb(s)||jsonb_build_object('quantity',s.quantity::text)) current,(r.snapshot||jsonb_build_object('quantity',r.snapshot->>'quantity')) original FROM ppo.supply_records s JOIN ppo.supply_revisions r ON (r.workspace_id,r.record_id,r.version)=(s.workspace_id,s.id,1) WHERE s.workspace_id=$1 AND s.id=$2",
      [p.workspace_id, target],
    )
  ).rows[0];
  const allocations = (
    await c.query<Allocation>(
      "SELECT * FROM ppo.supply_allocations WHERE workspace_id=$1 AND demand_id=$2 ORDER BY id",
      [p.workspace_id, target],
    )
  ).rows;
  const supplies = [];
  for (const a of allocations) {
    const s = await supplyRecord(c, p, a.supply_id);
    supplies.push({
      id: s.id,
      version: s.version,
      quantity: s.quantity,
      unit: s.unit,
      facts: currentFacts(await factsFor(c, p, s)),
    });
  }
  const children = [];
  for (const row of (
    await c.query<{ id: string }>(
      "SELECT id FROM ppo.supply_records WHERE workspace_id=$1 AND parent_id=$2 ORDER BY id",
      [p.workspace_id, target],
    )
  ).rows) {
    const child = await supplyRecord(c, p, row.id);
    children.push({
      id: child.id,
      kind: child.kind,
      version: child.version,
      quantity: child.quantity,
      unit: child.unit,
    });
  }
  const line = plan.plan.basis.lines.find((l) => l.line_id === link.line_id)!;
  const mapping = latestResolution(d.events, link.line_id);
  const source = {
    issue_id: d.currentIssue.id,
    response_id: d.state.response?.id ?? null,
    preparation_id: d.state.preparation?.id ?? null,
    receiving_id: d.receiving?.id ?? null,
    resolution_id: mapping?.id ?? null,
    unresolved: d.state.unresolved.map((e) => e.id),
    material_negotiation: d.state.material,
    timezone: d.basis?.target.timezone ?? null,
  };
  const originalSource = {
    issue_id: execution.issue_id,
    response_id: execution.response_id,
    preparation_id: execution.preparation_id,
    receiving_id: plan.plan.basis.receiving_id,
    resolution_id: line.resolution_id,
    unresolved: [] as string[],
    material_negotiation: false,
    timezone: plan.plan.basis.target.timezone,
  };
  const originalResponse = (
    await c.query<ResponseEvent>(
      "SELECT * FROM ppo.quote_response_events WHERE workspace_id=$1 AND id=$2",
      [p.workspace_id, execution.response_id],
    )
  ).rows[0];
  return {
    policy: "SYN-ES07-02",
    execution_id: execution.id,
    plan_id: plan.id,
    plan_hash: plan.plan_hash!,
    line_id: link.line_id,
    output_hash: execution.output_hash,
    original_evidence: {
      response: originalResponse,
      receiving: d.events.find((e) => e.id === plan.plan!.basis.receiving_id)!,
      resolution: d.events.find((e) => e.id === line.resolution_id)!,
    },
    current_evidence: {
      response: d.state.response,
      receiving: d.receiving,
      resolution: mapping,
    },
    original_source: originalSource,
    source,
    target: snapshots.current,
    original_target: snapshots.original,
    dependencies: {
      allocations,
      supplies,
      children,
      facts: currentFacts(await factsFor(c, p, r)),
    },
  };
}
export async function dispositionTarget(
  c: QueryClient,
  p: Principal,
  d: Awaited<ReturnType<typeof conversionContext>>,
  target: string,
  checked?: Checked,
) {
  const originalBasis = await targetBasis(c, p, d, target);
  const returned = await returnedSupplyBasis(c, p, target, checked);
  const basis = returned
    ? { ...originalBasis, supply_followup: returned }
    : originalBasis;
  const hash = dispositionHash(basis);
  const events = (
    await c.query<DispositionEvent>(
      "SELECT * FROM ppo.quote_disposition_events WHERE workspace_id=$1 AND target_id=$2 ORDER BY sequence",
      [p.workspace_id, target],
    )
  ).rows;
  const review = events.filter((e) => e.action === "Review").at(-1) ?? null;
  const applied = events.filter((e) => e.action === "Apply").at(-1) ?? null;
  const resolved =
    !!review && applied?.review_id === review.id && applied.basis_hash === hash;
  const sourceChanges = Object.keys(basis.source).filter(
    (k) =>
      dispositionHash(basis.source[k as keyof typeof basis.source]) !==
      dispositionHash(
        basis.original_source[k as keyof typeof basis.original_source],
      ),
  );
  const targetChanges = Object.keys(basis.target).filter(
    (k) =>
      dispositionHash(basis.target[k as keyof SupplyRecord]) !==
      dispositionHash(basis.original_target[k as keyof SupplyRecord]),
  );
  const revisionHolds: string[] = [];
  if (
    basis.target.kind !== "Demand" ||
    basis.target.data.demand_class !== "Forecast"
  )
    revisionHolds.push(
      "Only current Forecast demand can change quantity here; the Supply owner must review Approved demand.",
    );
  if (basis.dependencies.allocations.some((a) => decimal(a.quantity) > 0n))
    revisionHolds.push(
      "Active allocations require Supply allocation review before a quantity disposition.",
    );
  if (basis.dependencies.children.length)
    revisionHolds.push(
      "Retained return or service custody records require their owning workflow's follow-up.",
    );
  if (
    basis.dependencies.facts.some(
      (f) => !["Assessment", "Impact"].includes(f.kind),
    )
  )
    revisionHolds.push(
      "Purchasing, reservation, fulfilment or other consequential evidence requires Supply follow-up; quantity revision is held.",
    );
  const reviewHolds: string[] = [];
  if (
    returned &&
    ["Requested", "Accepted", "AdjustAllocation", "Retain", "Hold"].includes(
      returned.decision,
    ) &&
    returned.event_id !== returned.outcome_id
  )
    reviewHolds.push(
      "Supply follow-up remains pending. Recover or return its actual outcome before applying quotation disposition.",
    );
  if (review && !resolved) {
    if (review.basis_hash !== hash)
      reviewHolds.push(
        "Reviewed source, target version or downstream dependencies changed. Compare a replacement decision.",
      );
    if (review.decision === "Hold")
      reviewHolds.push(
        "Explicit continuing hold: complete the owned follow-up and record a replacement review.",
      );
    if (review.decision === "ReviseQuantity")
      reviewHolds.push(...revisionHolds);
    try {
      await scopedOwner(
        c,
        p,
        review.owner_id,
        basis.target.company_id,
        basis.target.site_id ?? undefined,
        "activity.edit",
      );
    } catch (e) {
      if (!(e instanceof AppError)) throw e;
      reviewHolds.push("The disposition follow-up owner is unavailable.");
    }
  }
  const affected =
    sourceChanges.length > 0 || basis.target.version !== 1 || events.length > 0;
  const explanations: Record<string, string> = {
    issue_id:
      "A successor issue supersedes the original offer; its acceptance does not transfer.",
    response_id:
      "The recorded response changed after conversion; review the corrected report and its evidence.",
    preparation_id:
      "The ES-06 preparation changed; the completed conversion retains its original handover.",
    receiving_id:
      "Receiving was corrected after conversion; compare the original and current decision.",
    resolution_id:
      "This source line's item resolution changed; the existing target retains its original item identity.",
    unresolved:
      "The outstanding clarification evidence changed; review the exact unresolved source questions.",
    material_negotiation:
      "Material negotiation affects applicability; it does not rewrite the completed target.",
    timezone:
      "The source site's timezone changed; review the target's retained scheduling context.",
  };
  return {
    target_id: target,
    basis,
    basis_hash: hash,
    events,
    sequence: events.at(-1)?.sequence ?? 0,
    review,
    applied,
    source_changes: sourceChanges,
    source_change_reasons: sourceChanges.map((k) => explanations[k]),
    target_changes: targetChanges,
    revision_holds: revisionHolds,
    review_holds: reviewHolds,
    status: resolved
      ? ("Resolved" as const)
      : affected
        ? ("Review required" as const)
        : ("Unchanged" as const),
    can_apply:
      !!review &&
      !reviewHolds.length &&
      !events.some((e) => e.review_id === review.id),
  };
}
export async function dispositionReceiptAuthority(
  c: QueryClient,
  p: Principal,
  id: string,
  operation: string,
) {
  const e = (
    await c.query<DispositionEvent>(
      "SELECT * FROM ppo.quote_disposition_events WHERE workspace_id=$1 AND revision_id=$2 AND created_by=$3 AND operation_id=$4",
      [p.workspace_id, id, p.actor_id, operation],
    )
  ).rows[0];
  if (!e) throw unavailable();
  await conversionAuthority(c, p, id, true);
  // Original dependency permissions also precede disclosure of frozen review evidence.
  await dispositionEvidenceAuthority(c, p, e);
}
export async function dispositionEvidenceAuthority(
  c: QueryClient,
  p: Principal,
  e: Pick<DispositionEvent, "basis">,
  checked: Checked = {
    revisions: new Set(),
    records: new Set(),
    credits: new Set(),
  },
) {
  if ("supply_followup" in e.basis && e.basis.supply_followup) {
    const { followupHistory } = await import("../supply-followup/authority");
    await followupHistory(c, p, e.basis.target.id, checked);
  }
  for (const x of [
    ...e.basis.dependencies.supplies,
    ...e.basis.dependencies.children,
  ]) {
    if (!checked.records.has(x.id)) {
      await supplyRecord(c, p, x.id);
      checked.records.add(x.id);
    }
  }
}
export async function dispositionHistoryAuthority(
  c: QueryClient,
  p: Principal,
  target: string,
  checked: Checked = {
    revisions: new Set(),
    records: new Set(),
    credits: new Set(),
  },
) {
  for (const e of (
    await c.query<DispositionEvent>(
      "SELECT * FROM ppo.quote_disposition_events WHERE workspace_id=$1 AND target_id=$2 ORDER BY sequence",
      [p.workspace_id, target],
    )
  ).rows)
    await dispositionEvidenceAuthority(c, p, e, checked);
}
export async function nativeDispositionReceiptAuthority(
  c: QueryClient,
  p: Principal,
  target: string,
  operation: string,
) {
  if (
    !(
      await c.query(
        "SELECT to_regclass('ppo.quote_disposition_events') present",
      )
    ).rows[0].present
  )
    return;
  const e = (
    await c.query<DispositionEvent>(
      "SELECT * FROM ppo.quote_disposition_events WHERE workspace_id=$1 AND target_id=$2 AND action='Apply' AND command->>'operation_id'=$3 AND created_by=$4",
      [p.workspace_id, target, operation, p.actor_id],
    )
  ).rows[0];
  if (e) {
    await conversionAuthority(c, p, e.revision_id, true);
    await dispositionEvidenceAuthority(c, p, e);
  } else if (
    (
      await c.query(
        "SELECT 1 FROM ppo.quote_disposition_events WHERE workspace_id=$1 AND target_id=$2 AND action='Review' AND command->>'operation_id'=$3",
        [p.workspace_id, target, operation],
      )
    ).rowCount
  ) {
    dispositionConflict(
      "This native operation belongs to an immutable disposition review. Apply that exact review through the quotation before recovering its original native receipt.",
    );
  }
}
