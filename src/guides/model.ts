// The user guide model (ADR-0065). No Node imports here: client components read these types.
export const guideStatuses = ["Draft", "InReview", "Reviewed", "Published", "Superseded", "Withdrawn"] as const;
export type GuideStatus = (typeof guideStatuses)[number];

export type GuideFrontMatter = {
  // Binding and PPO keys
  guide_key: string;
  entry_key: string;
  also_applies_to: string[];
  carried_over_from: string | null;
  shown_before_review: boolean;
  contents: Record<string, string>; // section id -> contents button label
  list_styles: Record<string, "journey">; // section id -> list style
  // Page guide template keys (Q11)
  document_id: string | null;
  title: string;
  versioning: "git";
  status: GuideStatus;
  issued_revision: string | null;
  audience: string | null;
  owner_role: string;
  reviewer: string | null;
  reviewed_at: string | null;
  reviewed_content_hash: string | null;
  review_due_at: string | null;
  source_commit: string;
  workflow_basis: string | null;
  runtime_evidence: string | null;
  resource_ids: string[];
  supersedes: string | null;
  section_aliases: Record<string, string>;
  change_summary: string | null;
};

// `line` is the 1-based line of the guide file, so an author can go straight to it.
export type GuideError = { path: string; line: number; message: string };
