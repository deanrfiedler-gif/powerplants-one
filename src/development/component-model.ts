export const componentCategories = [
  "Foundations",
  "Tables & grids",
  "Boards & cards",
  "Gantt",
  "Scheduling",
  "Forms",
  "Navigation",
  "Dialogs & overlays",
  "Feedback",
  "Mobile",
] as const;
export const exampleIds = [
  "products",
  "foundations",
  "buttons",
  "sales-table",
  "register-table",
  "area-editor",
  "sales-board",
  "forecast",
  "gantt",
  "planner",
  "appointment",
  "fields",
  "lookup",
  "validation",
  "tabs",
  "menu",
  "dialog",
  "drawer",
  "read-state",
  "status",
  "mobile-form",
] as const;
export type ExampleId = (typeof exampleIds)[number];
export const figmaMappingStates = [
  "Mapped",
  "Partial",
  "Proposal only",
  "None",
] as const;
export type ComponentRecord = {
  id: string;
  title: string;
  category: (typeof componentCategories)[number];
  module: string;
  purpose: string;
  owner: string;
  example: ExampleId | null;
  coverage: "Runnable" | "Host example" | "Reference only";
  states: { id: string; label: string; description: string }[];
  implementation: { path: string; symbol: string }[];
  dependencies: string[];
  reference: { path: string; anchor: string; status: string };
  specification: string;
  used_on: string[];
  desktop: string;
  mobile: string;
  keyboard: string;
  limitations: string;
  gaps: {
    id: string;
    expected: string;
    actual: string;
    action: string;
    priority: "High" | "Medium" | "Low";
    owner: string;
  }[];
  // Main components in the "PPO - Design" Figma file, cited by node ID only;
  // the file link stays out of the public repository (ADR-0053).
  figma: {
    status: (typeof figmaMappingStates)[number];
    location: string;
    components: { node: string; name: string }[];
    note: string;
  };
  review: {
    fingerprint: string;
    reviewer: string;
    date: string;
    evidence: string[];
    result: "Aligned" | "Differences recorded" | "Accepted exception";
  } | null;
};
export type ComponentManifest = {
  schema_version: 1;
  entries: ComponentRecord[];
};
export type ComponentView = ComponentRecord & {
  fingerprint: string;
  review_state: "Not reviewed" | "Current" | "Stale";
  source_url: string;
  history_url: string;
  reference_url: string;
};
export type ComponentLibrary = {
  entries: ComponentView[];
  errors: string[];
  checkout_commit: string | null;
  divergences: {
    token: string;
    values: Record<string, string>;
    status: string;
  }[];
};
export function componentReviewState(
  record: ComponentRecord,
  fingerprint: string,
): ComponentView["review_state"] {
  return !record.review ||
    !record.review.reviewer ||
    !record.review.date ||
    !record.review.evidence.length
    ? "Not reviewed"
    : record.review.fingerprint === fingerprint
      ? "Current"
      : "Stale";
}
