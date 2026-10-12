import type { Project } from "./model";

export const projectViews = [
  "Active",
  "Mine",
  "Closed",
  "All",
  "Overdue",
  "AtRisk",
  "NoTarget",
] as const;
export type ProjectView = (typeof projectViews)[number];
export const projectSorts = [
  "target",
  "title",
  "milestone",
  "risk",
  "customer",
  "coordinator",
  "status",
  "reference",
] as const;
export type ProjectSort = (typeof projectSorts)[number];
export type ProjectRegisterRow = Project & {
  created_at: string;
  next_milestone: {
    id: string;
    title: string;
    finish_date: string | null;
  } | null;
  milestone_overdue: boolean;
  at_risk: number;
};
export type ProjectRegisterData = {
  items: ProjectRegisterRow[];
  counts: Record<ProjectView, number>;
  active_count: number;
  total: number;
  next_cursor: string | null;
  observed_at: string;
  completeness: "Page";
  options: {
    customers: { id: string; name: string }[];
    coordinators: { id: string; name: string }[];
  };
};

// Prefix spreadsheet control characters before quoting; a permitted title must never become a formula.
export function projectCsv(rows: readonly ProjectRegisterRow[]) {
  const cell = (value: unknown) => {
    const text = String(value ?? "");
    return `"${(/^[\s]*[=+@-]|^[\t\r\n]/.test(text) ? "'" + text : text).replaceAll('"', '""')}"`;
  };
  return [
    [
      "Project",
      "Next milestone",
      "Milestone date",
      "Target date",
      "Tasks at risk",
      "Customer",
      "Site",
      "Coordinator",
      "Status",
      "Reference",
    ],
    ...rows.map((p) => [
      p.title,
      p.next_milestone?.title ?? "No remaining milestones",
      p.next_milestone?.finish_date ?? "Unscheduled",
      p.target_date ?? "Not set",
      p.at_risk,
      p.customer_name,
      p.site_name,
      p.coordinator_name,
      p.lifecycle,
      p.display_number,
    ]),
  ]
    .map((row) => row.map(cell).join(","))
    .join("\r\n");
}
