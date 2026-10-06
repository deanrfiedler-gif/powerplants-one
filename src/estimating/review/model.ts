import { createHash } from "node:crypto";
import { canonical } from "../../platform/operations";
import type { EstimateVersion } from "../context";
import type { SourceBinding } from "../sources/bindings";
import type { ReviewKind } from "./validation";

export type ReviewBasis = {
  contract: "SYN-ES04-01";
  estimate_hash: string;
  fingerprints: Record<ReviewKind, string>;
  context: Record<string, string | null>;
  discovery_revision_id: string | null;
  current_discovery_revision_id: string | null;
  source_heads: { id: string; version: number; revision_id: string }[];
};
const hash = (value: unknown) =>
  createHash("sha256").update(canonical(value)).digest("hex");
export const reviewBasisHash = (basis: ReviewBasis) => hash(basis);
// No totals or money are recalculated here. Reviews describe applicability to facts.
export function reviewBasis(
  v: EstimateVersion,
  bindings: SourceBinding[],
  sources: ReviewBasis["source_heads"],
  technicalLineage: unknown[],
  currentDiscovery: string | null,
  context: Record<string, string | null> = {},
): ReviewBasis {
  const lines = [...v.lines].sort((a, b) => a.id.localeCompare(b.id));
  const scope = {
    context,
    title: v.title,
    scope: v.scope,
    discovery: v.discovery_basis?.revision_id ?? null,
    current_discovery: currentDiscovery,
  };
  const identity = lines.map((l) => ({
    id: l.id,
    description: l.description,
    category: l.category,
    unit: l.unit,
    allowance: l.allowance ?? null,
  }));
  const source_heads = [...sources].sort((a, b) => a.id.localeCompare(b.id));
  return {
    contract: "SYN-ES04-01",
    estimate_hash: v.content_hash,
    context,
    discovery_revision_id: v.discovery_basis?.revision_id ?? null,
    current_discovery_revision_id: currentDiscovery,
    source_heads,
    fingerprints: {
      Completeness: hash({ scope, identity }),
      Technical: hash({
        scope,
        identity,
        quantities: lines.map((l) => ({ id: l.id, quantity: l.quantity })),
        lineage: technicalLineage,
      }),
      SourcePrice: hash({
        policy: v.policy,
        lines: lines.map((l) => ({
          id: l.id,
          quantity: l.quantity,
          unit: l.unit,
          unit_cost: l.unit_cost,
          unit_sell: l.unit_sell,
          source: l.source,
          effective_date: l.effective_date,
        })),
        bindings: [...bindings].sort((a, b) =>
          a.line_id.localeCompare(b.line_id),
        ),
        source_heads,
      }),
    },
  };
}
export type Finding = { id: string; line_id: string | null; detail: string };
export type Submission = {
  id: string;
  workspace_id: string;
  company_id: string;
  estimate_id: string;
  estimate_version_id: string;
  sequence: number;
  predecessor_id: string | null;
  basis: ReviewBasis;
  responses: { finding_id: string; response: string }[];
  created_by: string;
  created_at: Date;
  reason: string;
};
export type Decision = {
  id: string;
  workspace_id: string;
  estimate_id: string;
  submission_id: string;
  sequence: number;
  kind: ReviewKind;
  outcome: "Reviewed" | "Returned";
  findings: Finding[];
  reason: string;
  created_by: string;
  created_at: Date;
};
export function latestDecisions(
  submissions: Submission[],
  decisions: Decision[],
  basis: ReviewBasis,
) {
  return (["Completeness", "SourcePrice", "Technical"] as const).map((kind) => {
    const decision =
      decisions
        .filter((d) => d.kind === kind)
        .sort((a, b) => b.sequence - a.sequence)[0] ?? null;
    const origin = decision
      ? submissions.find((s) => s.id === decision.submission_id)!
      : null;
    const applicable =
      !!decision &&
      origin?.basis.fingerprints[kind] === basis.fingerprints[kind];
    return {
      kind,
      decision,
      applicable,
      state: decision
        ? applicable
          ? decision.outcome
          : "Changed basis"
        : "Not reviewed",
    };
  });
}
