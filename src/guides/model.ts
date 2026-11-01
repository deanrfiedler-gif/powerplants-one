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

// The compiled body (ADR-0065, decision 3). These are the only nodes a guide can hold: the compiler refuses every
// other Markdown construct, and text holds the characters the author typed (React escapes it at render).
export type InlineNode =
  | { kind: "text"; text: string }
  | { kind: "strong"; children: InlineNode[] }
  | { kind: "emphasis"; children: InlineNode[] }
  | { kind: "code"; text: string }
  | { kind: "break" }
  | { kind: "link"; href: string; children: InlineNode[] };

export type BlockNode =
  | { kind: "paragraph"; children: InlineNode[] }
  | { kind: "heading"; children: InlineNode[] } // a ### heading
  | { kind: "list"; ordered: boolean; items: BlockNode[][] }
  | { kind: "table"; header: InlineNode[][]; rows: InlineNode[][][] }
  | { kind: "callout"; tone: "note" | "warning" | "important"; children: BlockNode[] };

// How deeply lists, callouts, bold and italic text and links may sit inside one another. The compiler refuses a guide
// that goes deeper, and the renderer draws nothing past this depth, so a model edited by hand cannot exhaust the stack.
export const maxNesting = 8;

// A ## heading and the blocks under it. `id` is the heading's explicit {#section-id}.
export type GuideSection = { id: string; title: InlineNode[]; blocks: BlockNode[] };

export type CompiledGuide = {
  path: string;
  front: GuideFrontMatter;
  lead: BlockNode[]; // the blocks before the first ## heading
  sections: GuideSection[];
  contentHash: string; // SHA-256 hex of the reviewed content; review fields are excluded
  references: { href: string; line: number }[]; // every link, with its own file line
};

// What reading docs/guides gives: the guides that compiled and passed every cross-check, and every error found.
export type GuideLibrary = { guides: CompiledGuide[]; errors: GuideError[] };
