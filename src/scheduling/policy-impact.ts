import { createHash } from "node:crypto";
import { transaction } from "../platform/database";
import type { Principal } from "../platform/identity";
import { canonical } from "../platform/operations";
import {
  requireCapability,
  hasPermission,
  scopeSql,
} from "../platform/permissions";
import { unavailable } from "../platform/errors";
import {
  object,
  uuid,
  optionalId,
  instant,
  invalid,
} from "../shared/validation";
import { visible, visibility } from "../shared/reads";
import { orderVisibility } from "../service/work-orders";
import { sameVersion, SCHEDULING_POLICY_ID } from "./validation";
import {
  policyImpactReasons,
  type PolicyImpactReview,
} from "./policy-impact-model";

const hash = (v: unknown) =>
  createHash("sha256").update(canonical(v)).digest("hex");
function whole(value: unknown, field: string, max: number) {
  if (
    typeof value !== "string" ||
    !/^[1-9]\d*$/.test(value) ||
    !Number.isSafeInteger(Number(value)) ||
    Number(value) > max
  )
    invalid(field, `Enter a whole number from 1 to ${max}.`);
  return Number(value);
}

export async function readPolicyImpact(
  p: Principal,
  input: unknown,
): Promise<PolicyImpactReview> {
  const q = object(input, [
    "policy_id",
    "expected_version",
    "effective_from",
    "max_visit_minutes",
    "site_id",
  ]);
  const id =
      q.policy_id === undefined
        ? SCHEDULING_POLICY_ID
        : uuid(q.policy_id, "policy_id"),
    site = optionalId(q.site_id, "site_id");
  const hasScenario = [
    q.expected_version,
    q.effective_from,
    q.max_visit_minutes,
  ].some((v) => v !== undefined);
  const proposal = hasScenario
    ? {
        expected_version: whole(
          q.expected_version,
          "expected_version",
          2147483647,
        ),
        effective_from: instant(q.effective_from, "effective_from"),
        max_visit_minutes: whole(
          q.max_visit_minutes,
          "max_visit_minutes",
          1440,
        ),
      }
    : null;
  return transaction(async (c) => {
    await c.query("SET TRANSACTION ISOLATION LEVEL REPEATABLE READ, READ ONLY");
    await requireCapability(c, p, "schedule.read");
    await requireCapability(c, p, "service.work_order.read");
    if (site) {
      const s = await visible(c, p, "Site", site);
      if (!(await hasPermission(c, p, "schedule.read", s.company_id, s.id)))
        throw unavailable();
    }
    const observed_at = (
      await c.query<{ at: Date }>("SELECT transaction_timestamp() AS at")
    ).rows[0].at.toISOString();
    const source = (
      await c.query(
        `SELECT id,version,name,effective_from,effective_to,source_as_at,evidence,max_visit_minutes,
       initial_contact_required,changed_contact_allowed,all_crew_skilled
       FROM ppo.scheduling_policies WHERE workspace_id=$1 AND id=$2 AND status='Published' AND synthetic`,
        [p.workspace_id, id],
      )
    ).rows[0];
    if (!source) throw unavailable();
    const policy = {
      ...source,
      effective_from: source.effective_from.toISOString(),
      effective_to: source.effective_to.toISOString(),
      source_as_at: source.source_as_at.toISOString(),
    };
    const result: PolicyImpactReview = {
      policy: { ...policy, content_hash: hash(policy) },
      scenario: null,
      observed_at,
      completeness:
        "Only permitted future, unstarted Confirmed bookings pinned to this policy; optional site restriction. Duration/effective-date analysis only. No publication or saved follow-up.",
      compared: 0,
      items: [],
    };
    if (!proposal) return result;
    sameVersion(source.version, proposal.expected_version, "policy");
    if (
      proposal.effective_from <= observed_at ||
      proposal.effective_from < policy.effective_from ||
      proposal.effective_from >= policy.effective_to
    )
      invalid(
        "effective_from",
        "Choose a future instant within the original policy's effective period.",
      );
    const scenario = {
      effective_from: proposal.effective_from,
      effective_to: policy.effective_to,
      max_visit_minutes: proposal.max_visit_minutes,
    };
    result.scenario = {
      ...scenario,
      content_hash: hash({
        policy_hash: result.policy.content_hash,
        ...scenario,
      }),
    };
    // Mirror the full work-order read boundary, including every historical scope asset.
    // Filter before the bound so hidden records cannot change completeness or leak counts.
    const rows = (
      await c.query(
        `SELECT a.id,a.display_number,a.version,a.schedule_version,a.assignment_version,a.scheduling_policy_id,
       a.start_at,a.end_at,a.site_id,s.display_name AS site_name,a.site_timezone,a.work_order_id,
       w.version AS work_order_version,w.service_owner_id,u.display_name AS service_owner_name
       FROM ppo.appointments a
       JOIN ppo.work_orders w ON (w.workspace_id,w.id)=(a.workspace_id,a.work_order_id)
       JOIN ppo.sites s ON (s.workspace_id,s.id)=(a.workspace_id,a.site_id)
       JOIN ppo.users u ON (u.workspace_id,u.id)=(w.workspace_id,w.service_owner_id)
       WHERE a.workspace_id=$1 AND a.scheduling_policy_id=$3 AND a.status='Confirmed'
       AND a.actual_start_at IS NULL AND a.actual_end_at IS NULL AND a.start_at>$4
       AND a.end_at>$5 AND a.start_at<$6 AND ($7::uuid IS NULL OR a.site_id=$7)
       AND ${scopeSql("a.company_id", "a.site_id", "schedule.read")} AND ${orderVisibility("w")}
       AND NOT EXISTS(SELECT 1 FROM ppo.scope_revisions r JOIN ppo.scope_assets sa
         ON (sa.workspace_id,sa.scope_revision_id)=(r.workspace_id,r.id)
         WHERE r.workspace_id=w.workspace_id AND r.work_order_id=w.id
         AND NOT EXISTS(SELECT 1 FROM ppo.assets asset WHERE asset.workspace_id=sa.workspace_id
           AND asset.id=sa.asset_id AND ${visibility("Asset", "asset")}))
       ORDER BY a.start_at,a.id LIMIT 201`,
        [
          p.workspace_id,
          p.actor_id,
          id,
          observed_at,
          scenario.effective_from,
          scenario.effective_to,
          site,
        ],
      )
    ).rows;
    if (rows.length > 200)
      invalid(
        "site_id",
        "More than 200 permitted bookings match. Choose a narrower site or later effective time; no partial result is returned.",
      );
    result.compared = rows.length;
    result.items = rows
      .map((row) => ({
        ...row,
        start_at: row.start_at.toISOString(),
        end_at: row.end_at.toISOString(),
        reasons: policyImpactReasons(
          row.start_at.toISOString(),
          row.end_at.toISOString(),
          scenario,
        ),
      }))
      .filter((row) => row.reasons.length > 0);
    return result;
  });
}
