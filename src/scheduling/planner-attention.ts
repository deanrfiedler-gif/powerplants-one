// Presentation of current source evidence, never a dispatch or booking rule.
export type PlannerHoldSource = {
  id: string;
  status: string;
  actual_start_at?: string | null;
  dispatch_hold: boolean;
  dispatch_readiness?: { dispatch_hold: boolean; reasons: string[] } | null;
  policy_impacts?: { held: boolean }[];
};
export function plannerHeld(a: PlannerHoldSource) {
  if (!["Proposed", "Confirmed"].includes(a.status) || a.actual_start_at) return false;
  return (a.dispatch_readiness?.dispatch_hold ?? a.dispatch_hold) || !!a.policy_impacts?.some(x => x.held);
}
export function plannerHoldReasons(a: PlannerHoldSource): string[] {
  if (!plannerHeld(a)) return [];
  // A boolean hold has no category or expiry. Do not guess one from status or title.
  return a.dispatch_readiness?.reasons.length ? a.dispatch_readiness.reasons : ["On hold — a reason is not available in this read."];
}
