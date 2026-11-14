export type ReadinessState =
  | "Blocked"
  | "AtRisk"
  | "EvidenceNeeded"
  | "NotAssessed"
  | "SatisfiedForSourceScope";

export type SourceKind =
  "EngineeringPackage" | "MaterialDemand" | "SpecialistPackage";
export type Evidence = {
  kind: SourceKind;
  id: string;
  version: number;
  reference: string | null;
  title: string;
  owner_id: string;
  source_state: string;
  source_status: "Current" | "Changed";
  state: ReadinessState;
  reason: string;
  observed_at: string;
  source_hash: string;
  href: string;
  basis: Record<string, unknown>;
};

export type SourceFamily = {
  kind: SourceKind;
  coverage: "Complete" | "Partial" | "Unavailable";
  evidence: "Available" | "Missing" | "Unavailable";
  items: Evidence[];
  count: number | null;
  count_scope: "PermittedCandidateWindow";
  limit: number;
};

// These are coordination observations. They never decide a project release.
export function readinessSummary(sources: SourceFamily[]) {
  const items = sources.flatMap((source) => source.items);
  const blocked = items.filter((item) => item.state === "Blocked").length;
  const atRisk = items.filter((item) => item.state === "AtRisk").length;
  return {
    state: blocked
      ? ("Blocked" as const)
      : atRisk
        ? ("AtRisk" as const)
        : ("NotAssessed" as const),
    blocked,
    at_risk: atRisk,
    count_scope: "PermittedCandidateWindow" as const,
    full_scope_assessed: false as const,
    can_release: false as const,
    reason:
      "Linked native evidence does not establish the complete project prerequisite scope or authorise release.",
  };
}

export function materialState(state: string): ReadinessState {
  switch (state) {
    case "Blocked":
      return "Blocked";
    case "At risk":
      return "AtRisk";
    case "Ready for the stated material scope":
      return "SatisfiedForSourceScope";
    case "Not assessed":
      return "NotAssessed";
    default:
      return "EvidenceNeeded";
  }
}
