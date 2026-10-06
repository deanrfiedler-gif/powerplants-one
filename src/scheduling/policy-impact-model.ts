// This bounded scenario is not booking authority or a publication receipt.
export type PolicyScenario = {
  effective_from: string;
  effective_to: string;
  max_visit_minutes: number;
};
export type PolicyImpactReason =
  "CrossesEffectiveDate" | "DurationLimitExceeded";
export function policyImpactReasons(
  start: string,
  end: string,
  scenario: PolicyScenario,
): PolicyImpactReason[] {
  const from = Date.parse(start),
    to = Date.parse(end),
    effective = Date.parse(scenario.effective_from),
    expiry = Date.parse(scenario.effective_to);
  if (to <= effective || from >= expiry) return [];
  const reasons: PolicyImpactReason[] = [];
  if (from < effective) reasons.push("CrossesEffectiveDate");
  if (to - from > scenario.max_visit_minutes * 60000)
    reasons.push("DurationLimitExceeded");
  return reasons;
}
export const policyImpactLabels: Record<PolicyImpactReason, string> = {
  CrossesEffectiveDate: "Visit crosses the proposed effective time",
  DurationLimitExceeded: "Visit exceeds the proposed duration limit",
};
export type PolicyImpactReview = {
  policy: {
    id: string;
    version: number;
    name: string;
    effective_from: string;
    effective_to: string;
    source_as_at: string;
    evidence: string;
    max_visit_minutes: number;
    content_hash: string;
  };
  scenario: (PolicyScenario & { content_hash: string }) | null;
  observed_at: string;
  completeness: string;
  compared: number;
  items: {
    id: string;
    display_number: string;
    version: number;
    schedule_version: number;
    assignment_version: number;
    scheduling_policy_id: string;
    start_at: string;
    end_at: string;
    site_id: string;
    site_name: string;
    site_timezone: string;
    work_order_id: string;
    work_order_version: number;
    service_owner_id: string;
    service_owner_name: string;
    reasons: PolicyImpactReason[];
  }[];
};
