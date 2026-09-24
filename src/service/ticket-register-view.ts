// Presentation logic for the service requests register (SV-01, build plan I1). Pure and client-safe: no server
// module is imported, and nothing here decides a state, blocker or permitted action. The server read is the
// source of truth; these helpers only word and group what it returns.

export type RegisterItem = {
  id: string;
  display_number: string;
  summary: string;
  status: string;
  priority: string;
  version: number;
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
  // I2: whether the triage and request-information commands would accept this actor for this request.
  can_edit_intake: boolean;
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

// Card chips. An overdue clarification already shows in the card's next-action block in the danger tone, so it
// is not repeated as a chip (SV-01); the list's Attention column uses attention() instead.
export function cardChips(item: RegisterItem): { text: string; tone: Tone }[] {
  const chips: { text: string; tone: Tone }[] = [];
  if (item.triage_blocker_count)
    chips.push({
      text: `${item.triage_blocker_count} triage blocker${item.triage_blocker_count === 1 ? "" : "s"}`,
      tone: "warning",
    });
  else if (item.status === "New" && item.triage_blocker_count === 0) chips.push({ text: "Ready to triage", tone: "neutral" });
  if (item.clarification_unavailable) chips.push({ text: "Clarification not visible to you", tone: "neutral" });
  return chips;
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

// Board moves offer only the transitions the native commands perform (D3): request information from New, and
// triage from New or Needs information. Anything later waits for ADR-0043.
export type MoveTarget = "NeedsInformation" | "Triaged";
export function moveTargets(item: Pick<RegisterItem, "status">): MoveTarget[] {
  if (item.status === "New") return ["NeedsInformation", "Triaged"];
  if (item.status === "NeedsInformation") return ["Triaged"];
  return [];
}

// Why Move is unavailable, in words, or null when it is available. The server still decides on submit.
export function moveUnavailable(item: Pick<RegisterItem, "status" | "can_edit_intake">) {
  if (!moveTargets(item).length) return "Triaged is the last stage the application supports today.";
  if (!item.can_edit_intake) return "Moving a request needs service request edit permission for its site.";
  return null;
}

const channels: Record<string, string> = {
  Phone: "phone",
  Email: "email",
  Manual: "manual entry",
  PlannedMaintenance: "planned maintenance",
  Other: "other channel",
};
export function channelLabel(channel: string) {
  return channels[channel] ?? channel.toLowerCase();
}

// Times read in the application's business time zone (the Stamp default), relative to the read's as-at time:
// "today 9:20 am", "yesterday 2:00 pm", otherwise "Mon 14 Sept, 2:00 pm".
export const businessTimeZone = "Australia/Brisbane";
function parts(date: Date) {
  return new Intl.DateTimeFormat("en-AU", {
    timeZone: businessTimeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}
export function formatWhen(iso: string, now: Date) {
  const date = new Date(iso);
  const time = new Intl.DateTimeFormat("en-AU", {
    timeZone: businessTimeZone,
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  })
    .format(date)
    .replace(/\s?(am|pm)$/i, (m) => ` ${m.trim().toLowerCase()}`);
  if (parts(date) === parts(now)) return `today ${time}`;
  if (parts(date) === parts(new Date(now.getTime() - 86400000))) return `yesterday ${time}`;
  const day = new Intl.DateTimeFormat("en-AU", {
    timeZone: businessTimeZone,
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(date);
  return `${day.replace(",", "")}, ${time}`;
}

export function initials(name: string | null | undefined) {
  const words = (name ?? "").trim().split(/\s+/).filter(Boolean);
  if (!words.length) return "?";
  return (words[0][0] + (words.length > 1 ? words[words.length - 1][0] : "")).toUpperCase();
}

// The accountable person for the next action: the owned clarification's owner when one is open and visible,
// otherwise the triage owner, who owns the recorded next action.
export function actionOwner(item: RegisterItem) {
  const c = item.clarification;
  return c && (c.status === "Open" || c.status === "InProgress") && c.owner_name ? c.owner_name : item.triage_owner_name;
}

// Action due wording for the list: the clarification's due time, a due time still needed, or no due time,
// because the native next action has none.
export function actionDue(item: RegisterItem, now: Date): { text: string; detail: string | null; tone: Tone } {
  const c = item.clarification;
  if (c && (c.status === "Open" || c.status === "InProgress")) {
    if (c.due_at) {
      const relative = relativeTime(now, c.due_at);
      return { text: formatWhen(c.due_at, now), detail: relative.text, tone: relative.overdue ? "danger" : "neutral" };
    }
    if (c.due_needed) return { text: "Due time needed", detail: null, tone: "warning" };
  }
  return { text: "No due time", detail: null, tone: "neutral" };
}
