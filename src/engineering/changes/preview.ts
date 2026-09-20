import { sha256, snapshotOf, stamp, type Access, type LoadedChange } from "./context";
import { label, requestBlockers, type Destination, type HandoverContext, type RequestPurpose } from "./model";

// The exact preview of a set of requests. The server derives every payload from the records as they
// stand; the client contributes only purpose, destination, owner, action and date. The hash binds the
// payloads to the proposal, the present state of its sources and the policy version, so confirming a
// preview that no longer matches is refused rather than quietly applied with different content.
export type ProposedRequest = { id: string; purpose: RequestPurpose; destination: Destination; owner_id: string; requested_action: string; due: string | null; amends_id: string | null };

const effects: Record<RequestPurpose, string> = {
  InformationRequired: "Asks the owner for information. It is an investigation: it does not instruct anyone to implement, order, install or reschedule anything.",
  ImpactReview: "Asks the owner to review the impact on their records. It is an investigation: it does not instruct anyone to implement, order, install or reschedule anything.",
  PrepareRevisedRelease: "Asks the release owner to prepare the revised technical release. It does not issue that release and cannot instruct procurement or field work.",
  Implementation: "Hands the accepted technical change to this owner for their own decision. Accepting it records receipt of this exact payload; it proves no physical work and changes no order, stock, booking or asset record.",
  Amendment: "Tells a receiver who already accepted that the proposal has changed, for their explicit review. Their accepted payload and any completed work stay exactly as they were.",
};
export const handoverContext = (l: LoadedChange): HandoverContext => ({
  ...l.facts, decision_purpose: l.decision?.purpose ?? null,
  // Where a revised release is required, its issued purpose governs; otherwise the baseline's own issue does.
  issued_purpose: l.revision.requires_revised_release ? l.issued?.permitted_purpose ?? null : l.baseline?.snapshot.permitted_purpose ?? null,
  // Whole-scope is the only implementation path of this increment: no command accepts a subset of the assessed scope.
  partial: false,
});

export function requestPayload(l: LoadedChange, access: Access, r: ProposedRequest, correction: { note: string; previous_hash: string } | null = null) {
  const implementation = r.purpose === "Implementation" || r.purpose === "Amendment";
  return {
    schema_version: 1, synthetic: true, receiver: "SyntheticReceivingFixture", purpose: r.purpose, destination: r.destination, effect: effects[r.purpose],
    requested_action: r.requested_action, due: r.due, owner_id: r.owner_id, amends_id: r.amends_id, correction,
    change: { id: l.row.id, reference: l.row.reference, title: l.row.title, category: l.row.category, discipline: l.row.discipline, location: l.row.location, system_name: l.row.system_name, revision_number: l.revision.revision_number, revision_hash: l.revision.submitted_hash ?? l.revision.content_hash, revision_state: l.revision.state },
    context: { package_id: access.pkg.id, package: access.pkg.display_number, package_title: access.pkg.title, context_kind: access.pkg.context_kind, context_reference: access.pkg.context_reference, customer_name: access.pkg.customer_name, site_name: access.site_name },
    decision: l.decision ? { id: l.decision.id, result: l.decision.result, purpose: l.decision.purpose, decided_at: stamp(l.decision.decided_at), policy_version: l.decision.policy_version } : null,
    baseline: l.baseline?.snapshot ?? null,
    proposed: { reference: l.revision.proposed_reference, revision: l.revision.proposed_revision, issued: l.issued ? snapshotOf(l.issued) : null },
    rationale: l.revision.rationale, selected_option: l.revision.options.find((o) => o.key === l.revision.selected_option) ?? null,
    scope: l.objects.filter((o) => o.disposition === "Included").map((o) => ({ object_type: o.object_type, object_key: o.object_key, reference: o.reference, title: o.title, proposed_effect: o.proposed_effect, location: o.location, served_areas: o.served_areas, supply_state: o.supply_state })),
    exclusions: l.objects.filter((o) => o.disposition === "Excluded").map((o) => ({ reference: o.reference, title: o.title, reason: o.exclusion_reason })),
    sources: l.links.map((s) => ({ source_id: s.source_id, role: s.role, required: s.required, snapshot: s.snapshot })),
    // A receiver sees that a nontechnical prerequisite exists and how it stands. Amounts are never part of a payload.
    prerequisites: l.prerequisites.map((x) => ({ kind: x.kind, applicability: x.applicability, state: x.state })),
    retests: implementation ? l.verification.map((v) => ({ id: v.retest.id, criterion: v.retest.criterion, asset_or_system: v.retest.asset_or_system, configuration: v.retest.configuration, procedure_source_id: v.retest.procedure_source_id })) : [],
  };
}

export function buildPreview(l: LoadedChange, access: Access, proposed: ProposedRequest[]) {
  const context = handoverContext(l);
  const requests = proposed.map((r) => {
    const payload = requestPayload(l, access, r);
    return { ...r, payload, payload_hash: sha256(payload), blockers: requestBlockers(r.purpose, context), effect: effects[r.purpose] };
  });
  const counts = new Map<string, number>();
  for (const r of requests) counts.set(r.purpose, (counts.get(r.purpose) ?? 0) + 1);
  const investigation = (counts.get("InformationRequired") ?? 0) + (counts.get("ImpactReview") ?? 0), n = requests.length;
  // The confirm action is named for its effect and its actual count, never "Apply change".
  const confirm_label = !n ? "Nothing to create" : investigation === n ? `Create ${n} review request${n > 1 ? "s" : ""}` : counts.get("Implementation") === n ? `Submit ${n > 1 ? `${n} implementation handovers` : "implementation handover"}`
    : counts.get("PrepareRevisedRelease") === n ? "Request revised technical release" : `Create ${n} requests`;
  return {
    requests, confirm_label, blocked: requests.some((r) => r.blockers.length > 0),
    // What stays outstanding after these requests exist: a request is not an outcome.
    outstanding: [
      ...requests.map((r) => `${label(r.destination)} still has to accept, return or decline “${label(r.purpose)}”.`),
      ...(l.revision.requires_revised_release && !l.issued ? ["The revised technical release still has to be issued by its owner."] : []),
      ...l.verification.filter((v) => v.state !== "Passed").map((v) => `Retest still required: ${v.retest.criterion}`),
    ],
    preview_hash: sha256({
      change_id: l.row.id, revision_hash: l.revision.submitted_hash ?? l.revision.content_hash, decision_id: l.decision?.id ?? null, policy_version: access.policy?.policy_version ?? null,
      source_condition: l.condition.condition, sources: l.links.map((s) => ({ id: s.source_id, use: s.live?.use ?? "Missing", successor: s.live?.successor_id ?? null })),
      prerequisites: l.prerequisites.map((x) => [x.kind, x.applicability, x.state]), overlap_conflict: l.facts.overlap_conflict, payloads: requests.map((r) => r.payload_hash),
    }),
  };
}
