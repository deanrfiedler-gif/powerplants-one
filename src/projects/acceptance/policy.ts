import type {
  Decision,
  Detail,
  Obligation,
  Requirement,
  SourceDetails,
  SourceFacts,
  Unit,
} from "./model";
export const POLICY = "synthetic-pj09-v1";
export function requirementOutcome(
  r: Pick<Requirement, "mandatory" | "applicability_reference" | "source">,
) {
  if (r.source.availability !== "Current") return "Cannot assess" as const;
  if (
    r.source.outcome === "Not required" &&
    (r.mandatory || !r.applicability_reference)
  )
    return "Outstanding" as const;
  return r.source.outcome;
}
export const sameUnits = (a: readonly string[], b: readonly string[]) =>
  a.length === b.length &&
  [...a].sort().every((id, i) => id === [...b].sort()[i]);
export function sourceEvidenceValid(kind: string, d: SourceDetails) {
  if (!d.evidence?.trim()) return false;
  if (kind === "Training")
    return !!d.delivered_on && !!d.attendance && !!d.competence;
  if (kind === "Manual")
    return !!d.availability_evidence && !!d.source_reference;
  if (kind === "Backup")
    return (
      d.backup_available === true &&
      d.identity_verified === true &&
      d.restore_verified === true
    );
  if (kind === "Technical")
    return (
      !!d.release && !!d.tests_required && d.tests_accepted === d.tests_required
    );
  if (kind === "Commercial")
    return !!d.as_at && d.completeness === "Complete" && !!d.source_reference;
  return true;
}
export function requirementGates(
  requirements: Requirement[],
  gates: Requirement["gate"][],
) {
  return requirements
    .filter(
      (r) =>
        gates.includes(r.gate) &&
        !["Satisfied", "Not required"].includes(r.outcome),
    )
    .map((r) => `${r.title}: ${r.outcome} — ${r.source.explanation}`);
}
export function residualAllowed(o: Obligation) {
  return (
    o.state === "Completed" ||
    (o.eligible &&
      o.transfer_accepted &&
      !!o.conditions &&
      !!o.control_reference &&
      !!o.due_basis &&
      !!o.required_evidence &&
      !!o.review_rule &&
      o.owner_id !== o.recipient_id)
  );
}
export function closeoutGates(
  d: Pick<
    Detail,
    "units" | "requirements" | "obligations" | "outcomes" | "stage"
  >,
) {
  const gates = requirementGates(d.requirements, [
    "Technical",
    "Handover",
    "Closeout",
    "Commercial",
  ]);
  if (d.stage.state !== "In review")
    gates.push("Submit the exact stage revision for review.");
  if (!d.units.some((u) => u.disposition === "Included"))
    gates.push("No exact scope is included.");
  if (d.outcomes.technical !== "Accepted")
    gates.push(
      "Technical applicability must be accepted for the current evidence.",
    );
  if (!["Accepted", "With conditions"].includes(d.outcomes.customer))
    gates.push("A validated customer response to the exact scope is required.");
  if (d.outcomes.service !== "Accepted")
    gates.push(
      "Independent Service receiving of the current stage pack is required.",
    );
  if (!["Complete", "Not required"].includes(d.outcomes.commercial))
    gates.push("Commercial disposition remains outstanding.");
  for (const o of d.obligations)
    if (!residualAllowed(o))
      gates.push(
        `${o.title}: completion or an eligible independently accepted continuing obligation is required.`,
      );
  return [...new Set(gates)];
}
export function projectClosureGates(
  units: Unit[],
  stages: Detail[],
  decisions: Decision[],
  sources: SourceFacts[] = [],
) {
  const gates: string[] = [];
  if (!units.length)
    gates.push("The complete project scope ledger has not been established.");
  for (const u of units.filter((u) => u.required)) {
    const covering = stages.filter((s) =>
      s.units.some((x) => x.id === u.id && x.disposition === "Included"),
    );
    if (!covering.length)
      gates.push(`${u.title}: required project scope is unallocated.`);
    for (const s of covering)
      if (s.stage.closeout !== "Closed" || s.closeout_gates.length)
        gates.push(`${s.stage.title}: current stage closeout is required.`);
  }
  for (const s of stages)
    if (s.stage.closeout !== "Closed" || s.closeout_gates.length)
      gates.push(`${s.stage.title}: not closed against current gates.`);
  const commercial = decisions.find(
    (d) => d.kind === "Commercial" && d.revision === null,
  );
  if (
    commercial &&
    !sources.some(
      (s) =>
        s.id === commercial.subject_id &&
        s.availability === "Current" &&
        s.fingerprint === commercial.snapshot.source_fingerprint,
    )
  )
    gates.push(
      "Whole-project commercial source changed or cannot be assessed.",
    );
  if (!commercial || !["Complete", "Not required"].includes(commercial.outcome))
    gates.push("Independent whole-project commercial disposition is required.");
  return [...new Set(gates)];
}
