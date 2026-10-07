import type { Principal } from "../platform/identity";
import type { QueryClient } from "../platform/permissions";
import { bump, record, history, type Plan, type WarrantyCase } from "./context";
import { currentAssessment } from "./assessments";
import { reviewedResult } from "./service-evidence";
import { AppError } from "../platform/errors";

export async function maintenanceImpact(
  c: QueryClient,
  p: Principal,
  asset_id: string,
) {
  // Older-version upgrade proofs legitimately invoke Equipment before 0051.
  if (
    !(await c.query("SELECT to_regclass('ppo.maintenance_plans') AS relation"))
      .rows[0].relation
  )
    return { state: "Unavailable", plans: [], replacement_results: [] };
  const rows = (
    await c.query<Plan>(
      "SELECT * FROM ppo.maintenance_plans WHERE workspace_id=$1 AND asset_id=$2 ORDER BY id",
      [p.workspace_id, asset_id],
    )
  ).rows;
  for (const row of rows)
    try {
      await record(c, p, "plans", row.id);
    } catch (e) {
      if (e instanceof AppError && [403, 404].includes(e.status))
        throw new AppError(
          409,
          "ImpactUnavailable",
          "The owning maintenance plan requires access before Equipment change review.",
        );
      throw e;
    }
  const candidates = (
    await c.query(
      `SELECT r.id,p.case_id,p.id AS plan_id,p.assessment_id,p.context_hash,p.content_hash FROM ppo.maintenance_service_results r JOIN ppo.maintenance_work_requests q ON (q.workspace_id,q.id)=(r.workspace_id,r.request_id) JOIN ppo.warranty_resolution_plans p ON (p.workspace_id,p.id)=(q.workspace_id,q.resolution_plan_id) JOIN ppo.warranty_cases w ON (w.workspace_id,w.id)=(p.workspace_id,p.case_id) WHERE r.workspace_id=$1 AND w.asset_id=$2 AND p.remedy='Replace' AND r.outcome='Completed' AND NOT EXISTS(SELECT 1 FROM ppo.warranty_resolution_plans newer WHERE newer.workspace_id=p.workspace_id AND newer.case_id=p.case_id AND newer.revision>p.revision) ORDER BY r.id`,
      [p.workspace_id, asset_id],
    )
  ).rows;
  const replacement_results: {
    id: string;
    case_id: string;
    plan_id: string;
    ticket_id: string;
    work_order_id: string;
  }[] = [];
  for (const candidate of candidates) {
    try {
      const warranty = await record<WarrantyCase>(
        c,
        p,
        "cases",
        candidate.case_id,
      );
      const assessment = await currentAssessment(c, p, candidate.assessment_id);
      if (
        assessment.warranty_case_id !== warranty.id ||
        assessment.context_hash !== candidate.context_hash
      )
        continue;
      const events = await history(c, p, warranty.id);
      const authority = events
        .filter(
          (e) =>
            e.action === "Authority" && e.content.plan_id === candidate.plan_id,
        )
        .at(-1);
      const goodwill = events
        .filter(
          (e) =>
            e.action === "Goodwill" && e.content.plan_id === candidate.plan_id,
        )
        .at(-1);
      if (
        authority?.content.decision !== "Approved" ||
        authority.content.content_hash !== candidate.content_hash
      )
        continue;
      if (
        assessment.status !== "Covered" &&
        (goodwill?.content.decision !== "Approved" ||
          goodwill.content.content_hash !== candidate.content_hash)
      )
        continue;
      const result = await reviewedResult(c, p, candidate.id);
      replacement_results.push({
        id: result.id,
        case_id: warranty.id,
        plan_id: candidate.plan_id,
        ticket_id: result.ticket_id,
        work_order_id: result.work_order_id,
      });
    } catch (e) {
      if (e instanceof AppError && e.status === 409) continue;
      throw e;
    }
  }
  return {
    state: "Available",
    plans: rows.map((r) => ({
      id: r.id,
      reference: r.reference,
      version: r.version,
      revision_id: r.current_revision_id,
      state: r.state,
      owner_id: r.owner_id,
    })),
    replacement_results,
    effect:
      "Changed equipment requires review before new generation or work; historical occurrences retain their original context.",
  };
}

// The Equipment command already owns the source change. This derived review
// disposition preserves each plan's existing owner; it grants no new authority.
export async function requireMaintenanceReview(
  c: QueryClient,
  p: Principal,
  asset_id: string,
  change_id: string,
  reason: string,
) {
  if (
    !(await c.query("SELECT to_regclass('ppo.maintenance_plans') AS relation"))
      .rows[0].relation
  )
    return;
  const plans = (
    await c.query<Plan>(
      "SELECT * FROM ppo.maintenance_plans WHERE workspace_id=$1 AND asset_id=$2 ORDER BY id",
      [p.workspace_id, asset_id],
    )
  ).rows;
  for (const plan of plans)
    await bump(
      c,
      p,
      "plans",
      plan,
      "EquipmentReviewRequired",
      {
        equipment_change_id: change_id,
        owner_id: plan.owner_id,
        next_action:
          "Review future maintenance against the changed Equipment source. Historical obligations retain their original context.",
      },
      reason,
      { state: "ReviewRequired" },
    );
}
