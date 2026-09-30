import type { QueryClient } from "../platform/permissions";
import type { Principal } from "../platform/identity";
import { AppError } from "../platform/errors";
import { visibleAppointment } from "./planner";
import { freshPolicyImpactEvidence } from "./policy-resolution";
import { canonical } from "../platform/operations";
import { digest, equal } from "./policy-values";

export type PolicyHold = {
  impact_id: string;
  publication_id: string;
  owner_id: string;
  owner_name: string;
  reason: string;
  disposition: "Unresolved" | "Stale" | "Current" | "Historical";
  held: boolean;
  next_action: string;
};

// The caller supplies a consistent transaction; mutations hold the workspace
// graph lock. Activity status and appointments.dispatch_hold are not authority.
export async function policyImpactHolds(
  c: QueryClient,
  p: Principal,
  id: string,
): Promise<PolicyHold[]> {
  const { a } = await visibleAppointment(c, p, id);
  if (
    !(
      await c.query(
        "SELECT to_regclass('ppo.scheduling_policy_impacts') AS relation",
      )
    ).rows[0].relation
  ) {
    if (
      (
        await c.query(
          "SELECT to_regclass('ppo.scheduling_policy_heads') AS relation",
        )
      ).rows[0].relation
    )
      throw new AppError(
        422,
        "PolicyUnavailable",
        "Published policy impact storage is unavailable.",
      );
    return [];
  }
  const impacts = (
    await c.query(
      `SELECT i.*,u.display_name AS owner_name,
      r.content AS resolution,r.content_hash AS resolution_hash,r.canonical_content AS resolution_bytes,r.replacement_id
     FROM ppo.scheduling_policy_impacts i
     JOIN ppo.users u ON u.workspace_id=i.workspace_id AND u.id=(i.content->>'impact_owner_id')::uuid
     LEFT JOIN LATERAL (SELECT * FROM ppo.scheduling_policy_resolutions r
       WHERE r.workspace_id=i.workspace_id AND r.impact_id=i.id ORDER BY sequence DESC LIMIT 1) r ON true
     WHERE i.workspace_id=$1 AND i.appointment_id=$2 ORDER BY i.id`,
      [p.workspace_id, id],
    )
  ).rows;
  if (!impacts.length) return [];
  const historical =
    !!a.actual_start_at ||
    !!a.actual_end_at ||
    ["InProgress", "Completed", "CompletedPendingReview"].includes(a.status) ||
    !!(
      await c.query(
        `SELECT 1 FROM ppo.field_attendances WHERE workspace_id=$1 AND appointment_id=$2
      UNION ALL SELECT 1 FROM ppo.field_entries WHERE workspace_id=$1 AND appointment_id=$2
      UNION ALL SELECT 1 FROM ppo.field_attachments WHERE workspace_id=$1 AND appointment_id=$2
      UNION ALL SELECT 1 FROM ppo.field_timers WHERE workspace_id=$1 AND appointment_id=$2 LIMIT 1`,
        [p.workspace_id, id],
      )
    ).rowCount;
  const evidence = new Map<string, string | null>();
  const result: PolicyHold[] = [];
  for (const i of impacts) {
    equal(i.content_hash, digest(i.content), "impact_hash");
    equal(i.canonical_content, canonical(i.content), "impact_bytes");
    let disposition: PolicyHold["disposition"] = historical
      ? "Historical"
      : "Unresolved";
    if (!historical && i.resolution) {
      equal(i.resolution_hash, digest(i.resolution), "resolution_hash");
      equal(i.resolution_bytes, canonical(i.resolution), "resolution_bytes");
      disposition = "Stale";
      try {
        const key = i.replacement_id ?? "";
        if (!evidence.has(key)) {
          const fresh = await freshPolicyImpactEvidence(
            c,
            p,
            id,
            i.replacement_id,
            true,
          );
          const now = (
            await c.query("SELECT clock_timestamp() AS at")
          ).rows[0].at.toISOString();
          evidence.set(
            key,
            fresh.recheck_before && now >= fresh.recheck_before
              ? null
              : fresh.dependency_fingerprint,
          );
        }
        if (i.resolution.dependency_fingerprint === evidence.get(key))
          disposition = "Current";
      } catch (e) {
        // Missing or newly inaccessible sources can never clear an impact. Do not
        // disclose the denied dependency through the appointment's hold summary.
        if (!(e instanceof AppError)) throw e;
      }
    }
    const unresolved = disposition === "Unresolved" || disposition === "Stale";
    const held = a.status !== "Cancelled" && unresolved;
    result.push({
      impact_id: i.id,
      publication_id: i.publication_id,
      owner_id: i.content.impact_owner_id,
      owner_name: i.owner_name,
      reason: i.content.impact_reason,
      disposition,
      held,
      next_action: unresolved
        ? "Ask the booking owner or scheduler to make a controlled change or cancellation/replacement, then obtain a fresh policy-impact resolution."
        : disposition === "Historical"
          ? "Retain the original publication and booking evidence."
          : "Continue the independent customer, preparation and pack checks. Later changes require a fresh resolution.",
    });
  }
  return result;
}
