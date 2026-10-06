export const responseOutcomes = [
  "Accepted",
  "Declined",
  "Clarification",
  "Negotiation",
] as const;
export type ReportedResponse = {
  outcome: (typeof responseOutcomes)[number];
  respondent: string;
  claimed_role: string;
  responded_at: string;
  conditions: string | null;
};
export type ResponseEvent = {
  id: string;
  workspace_id: string;
  quote_id: string;
  revision_id: string;
  issue_id: string;
  sequence: number;
  action: "Record" | "Correct" | "Answer" | "Confirm" | "Prepare";
  response_id: string | null;
  output_hash: string;
  report: ReportedResponse | null;
  detail: {
    answer?: string;
    respondent?: string;
    claimed_role?: string;
    responded_at?: string;
    owner_id?: string;
    due_date?: string;
    note?: string;
  };
  evidence: string;
  reason: string;
  created_by: string;
  created_at: Date;
  operation_id: string;
};
export const responsePolicy = {
  id: "SYN-ES06-01",
  synthetic_only: true,
  authority: "Not configured",
  signature: "Not configured",
  validity: "Not configured",
  withdrawal: "Not configured",
  receiving_checks: [
    "Verify respondent authority and operative terms",
    "Configure validity and commercial policy",
    "Independently receive the exact issue and response",
    "Resolve items and target lines before duplicate-safe conversion",
  ],
};
export function responseState(events: ResponseEvent[], currentIssue: boolean) {
  const reports = events.filter(
    (e) => e.action === "Record" || e.action === "Correct",
  );
  const response = reports.at(-1) ?? null;
  const material = reports.some((e) => e.report?.outcome === "Negotiation");
  const clarifications = reports.filter(
    (e) => e.report?.outcome === "Clarification",
  );
  // Explicit corrections replace their predecessor, but a later report cannot erase an unanswered question.
  const unresolved = clarifications.filter(
    (e) =>
      !events.some((x) => x.action === "Correct" && x.response_id === e.id) &&
      !events.some((x) => x.action === "Confirm" && x.response_id === e.id),
  );
  const holds: string[] = [];
  if (!currentIssue)
    holds.push("Superseded issue: the response remains historical.");
  if (material)
    holds.push(
      "Material negotiation requires an explicit ES-05 successor issue.",
    );
  if (unresolved.length)
    holds.push(
      "Information-only clarification needs an answer and reported respondent confirmation.",
    );
  if (response?.report?.outcome !== "Accepted")
    holds.push("No current reported acceptance.");
  if (response?.report?.conditions)
    holds.push(
      "Reported conditions remain unresolved; retain a subsequent exact response or correction.",
    );
  const preparations = events.filter((e) => e.action === "Prepare");
  const preparation = preparations.at(-1) ?? null;
  const preparedApplicable =
    !!preparation && !holds.length && preparation.response_id === response?.id;
  return {
    response,
    material,
    unresolved,
    holds,
    ready: holds.length === 0,
    preparation,
    preparedApplicable,
  };
}
