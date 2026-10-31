export type LibraryRevision = {
  id: string;
  revision: number;
  title: string;
  document_type: string;
  applicability: string;
  audience: string;
  owner_id: string;
  created_by: string;
  created_at: string;
  reason: string;
  source: {
    kind: "SyntheticText" | "JobPackIssue" | "ReportIssue";
    issue_id: string | null;
    content_hash: string;
    byte_count: number;
    content_type: string;
    author_id: string;
  };
};
export type Finding = {
  id: string;
  text: string;
  state: "Open" | "AwaitingReview" | "Closed";
  owner_id: string;
  owner_name?: string;
  due_date: string;
  created_at: string;
  created_by: string;
  response: string | null;
  response_by: string | null;
  response_at: string | null;
  acceptance: string | null;
  accepted_by: string | null;
  accepted_at: string | null;
};
export type LibraryItem = {
  document: {
    id: string;
    display_number: string;
    version: number;
    current_revision_id: string;
    state: "Current" | "Withdrawn";
    company_id: string;
    organisation_id: string;
    site_id: string | null;
    updated_at: string;
  };
  revision: LibraryRevision;
  availability: string;
  source_current: boolean;
  library_current: boolean;
  review_state: string;
  unresolved_findings: number;
  eligible_for_current_use: boolean;
  review: {
    id: string;
    outcome: string;
    purpose: string;
    rationale: string;
    reviewer_id: string;
    reviewer_name?: string;
    created_at: string;
    content_hash: string;
  } | null;
  actor_id: string;
  company_name?: string;
  organisation_name: string;
  site_name: string | null;
  owner_name: string;
  registered_by_name: string;
  source_author_name: string;
  can_register: boolean;
  can_review: boolean;
  independent_reviewer: boolean;
  findings?: Finding[];
};
export type LibraryPage = {
  items: LibraryItem[];
  next_cursor: string | null;
  next_after?: string | null;
  can_register: boolean;
};
export const documentTypes = [
  "Installation notes",
  "Procedure",
  "Schedule",
  "Issued job pack",
  "Issued service report",
  "Commissioning record",
];
export const libraryViews = [
  "Current documents",
  "My documents",
  "Withdrawn",
  "All documents",
  "Unreviewed",
  "Review outdated",
  "Returned",
  "Reviewed",
  "Content unavailable",
];
export const revisionName = (n: number) => "r" + String(n).padStart(2, "0");
export const reviewLabel = (state: string) =>
  state === "ReviewOutdated" ? "Review outdated" : state;
export type LibraryListContext = {
  query: string;
  listQuery: string;
  pages: number;
};
export const recordHref = (
  item: Pick<LibraryItem, "document" | "revision">,
  context?: LibraryListContext,
) => {
  const query = new URLSearchParams({ revision_id: item.revision.id });
  if (context) {
    query.set("from", context.query);
    query.set("list_query", context.listQuery);
    query.set("list_pages", String(context.pages));
  }
  return `/documents/library/${item.document.id}?${query}`;
};
export const targetPaths: Record<string, string> = {
  Organisation: "/customers",
  Site: "/sites",
  Asset: "/equipment",
  Project: "/projects",
  WorkOrder: "/service/work-orders",
  EngineeringPackage: "/engineering",
};
export function currentUseReasons(item: LibraryItem) {
  return [
    {
      label:
        item.document.state === "Withdrawn"
          ? "Withdrawn"
          : item.library_current
            ? "Current revision"
            : "Historical revision",
      ok: item.document.state === "Current" && item.library_current,
    },
    {
      label:
        item.review_state === "Reviewed"
          ? "Reviewed"
          : reviewLabel(item.review_state),
      ok: item.review_state === "Reviewed",
    },
    {
      label:
        item.availability === "Available"
          ? "Content available"
          : "Content unavailable",
      ok: item.availability === "Available",
    },
    {
      label: item.source_current ? "Source current" : "Source superseded",
      ok: item.source_current,
    },
    {
      label: item.unresolved_findings
        ? `${item.unresolved_findings} unresolved findings`
        : "No unresolved findings",
      ok: item.unresolved_findings === 0,
    },
  ];
}
