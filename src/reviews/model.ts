export const reviewViews = [
  "mine",
  "all",
  "returned",
  "handovers",
  "sent",
  "history",
] as const;
export const reviewViewLabels = {
  mine: "My reviews",
  all: "All permitted",
  returned: "Returned to me",
  handovers: "Handovers",
  sent: "Sent by me",
  history: "History",
};
export type ReviewTask = {
  id: string;
  source: "ServiceReport" | "FinanceHandoff" | "EngineeringChange";
  module: string;
  record_id: string;
  package_id?: string;
  company_id?: string;
  reference: string;
  revision: string;
  version: number;
  kind: "Review" | "Handover";
  title: string;
  context: string | null;
  submitted_at: string | null;
  due: string | null;
  owner_id: string | null;
  owner_name: string | null;
  author_id: string | null;
  status: string;
  returned: boolean;
  return_reason: string | null;
  current: boolean;
  actionable: boolean;
  href: string;
};
export function inReviewView(
  t: ReviewTask,
  view: (typeof reviewViews)[number],
  actor: string,
) {
  if (view === "history") return !t.current;
  if (!t.current) return false;
  if (view === "mine") return t.actionable && t.owner_id === actor;
  if (view === "returned")
    return t.returned && (t.author_id === actor || t.owner_id === actor);
  if (view === "sent") return t.author_id === actor;
  if (view === "handovers") return t.kind === "Handover";
  return true;
}
