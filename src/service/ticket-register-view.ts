// Presentation logic for the service requests register (SV-01, build plan I1). Pure and client-safe: no server
// module is imported, and nothing here decides a state, blocker or permitted action. The server read is the
// source of truth; these helpers only word and group what it returns.

export type RegisterItem = {
  id: string;
  display_number: string;
  summary: string;
  status: string;
  priority: string;
  received_at: string;
  channel: string;
  next_action: string | null;
  triage_owner_name: string;
  site: { id: string; display_number: string | null; display_name: string | null } | null;
  site_identification_needed: boolean;
  asset: { id: string; display_number: string | null; description: string | null } | null;
  customer: { id: string; display_name: string; basis: "SiteOperator" | "RequesterRelationship" } | null;
  clarification: {
    id: string;
    summary: string | null;
    owner_name: string | null;
    due_at: string | null;
    due_needed: boolean | null;
    status: string | null;
  } | null;
  clarification_unavailable: boolean;
  triage_blocker_count: number | null;
  work_orders: { id: string; display_number: string; status: string }[];
};

export type Tone = "neutral" | "danger" | "warning" | "info" | "success";
export type QueueKey = "all_open" | "new" | "needs_information" | "triaged" | "urgent" | "overdue_clarifications";

// The three states the application moves a request through today (D3). Later lanes arrive with ADR-0043.
export const nativeLanes = [
  { status: "New", label: "New", purpose: "Awaiting triage · blockers shown on each card" },
  { status: "NeedsInformation", label: "Needs information", purpose: "Owned clarification before triage" },
  { status: "Triaged", label: "Triaged", purpose: "Response set · work orders can be linked" },
] as const;

const stageLabels: Record<string, string> = {
  New: "New",
  NeedsInformation: "Needs information",
  Triaged: "Triaged",
  Active: "Active",
  Waiting: "Waiting",
  Resolved: "Resolved",
  Closed: "Closed",
  Cancelled: "Cancelled",
};

export function stageLabel(status: string) {
  return stageLabels[status] ?? status;
}

function span(minutes: number) {
  if (minutes < 60) return `${minutes} min`;
  if (minutes < 24 * 60) {
    const hours = Math.floor(minutes / 60),
      rest = minutes % 60;
    return rest >= 5 ? `${hours} h ${rest} min` : `${hours} h`;
  }
  return `${Math.floor(minutes / (24 * 60))} d`;
}

// A recorded time read against now: "in 30 min", "1 h overdue", "due now". Only recorded commitments are
// worded this way; no service level is invented (r06 SV-01).
export function relativeTime(now: Date, iso: string) {
  const minutes = Math.round((Date.parse(iso) - now.getTime()) / 60000);
  if (Math.abs(minutes) < 1) return { text: "due now", overdue: false };
  return minutes > 0
    ? { text: `in ${span(minutes)}`, overdue: false }
    : { text: `${span(-minutes)} overdue`, overdue: true };
}

export function clarificationOverdue(item: RegisterItem, now: Date) {
  const c = item.clarification;
  return (
    item.status === "NeedsInformation" &&
    !!c?.due_at &&
    (c.status === "Open" || c.status === "InProgress") &&
    Date.parse(c.due_at) < now.getTime()
  );
}

// Mirrors the server's queue counts (ticketQueues) so a toggle never disagrees with its badge.
export function queueMembership(item: RegisterItem, now: Date): QueueKey[] {
  if (item.status === "Closed" || item.status === "Cancelled") return [];
  const keys: QueueKey[] = ["all_open"];
  if (item.status === "New") keys.push("new");
  if (item.status === "NeedsInformation") keys.push("needs_information");
  if (item.status === "Triaged") keys.push("triaged");
  if (item.priority === "Urgent") keys.push("urgent");
  if (clarificationOverdue(item, now)) keys.push("overdue_clarifications");
  return keys;
}

// The one attention chip a row shows. A warning icon marks something someone must act on; a tick is never used
// here because none of these is a completed positive state.
export function attention(item: RegisterItem, now: Date): { text: string; tone: Tone } | null {
  if (clarificationOverdue(item, now))
    return { text: `Clarification ${relativeTime(now, item.clarification!.due_at!).text}`, tone: "danger" };
  if (item.triage_blocker_count)
    return {
      text: `${item.triage_blocker_count} triage blocker${item.triage_blocker_count === 1 ? "" : "s"}`,
      tone: "warning",
    };
  if (item.status === "New" && item.triage_blocker_count === 0) return { text: "Ready to triage", tone: "neutral" };
  if (item.clarification_unavailable) return { text: "Clarification not visible to you", tone: "neutral" };
  return null;
}

// The next-action block: the owned clarification when one is visible, otherwise the recorded next action,
// which has no due time in the native contract.
export function nextAction(item: RegisterItem, now: Date) {
  const c = item.clarification;
  if (c && (c.status === "Open" || c.status === "InProgress"))
    return {
      heading: "Owned clarification",
      text: c.summary ?? "",
      owner: c.owner_name,
      due: c.due_at ? relativeTime(now, c.due_at) : null,
      dueNeeded: !!c.due_needed,
    };
  return {
    heading: "Next action",
    text: item.next_action ?? "Not recorded",
    owner: item.triage_owner_name,
    due: null,
    dueNeeded: false,
  };
}

export function customerLabel(item: RegisterItem) {
  return item.customer?.display_name ?? "Customer not identified";
}

export function siteLabel(item: RegisterItem) {
  return item.site?.display_name ?? (item.site_identification_needed ? "Site not identified" : "Not recorded");
}

export function equipmentLabel(item: RegisterItem) {
  return item.asset?.description ?? item.asset?.display_number ?? "Not recorded";
}

export function workOrderLabel(order: RegisterItem["work_orders"][number]) {
  return `${order.display_number.replace(/^SYN-PPO-/, "")} · ${order.status.toLowerCase()}`;
}
