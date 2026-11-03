import type {
  customerCommunicationQueue,
  readCustomerCommunication,
} from "./reads";
import type { readMessageClassSwitches } from "./switches";
import { holdSummary, type HoldReason, type State } from "./model";
export type MessageQueue = Awaited<
  ReturnType<typeof customerCommunicationQueue>
>;
export type MessageRow = MessageQueue["items"][number];
export type MessageDetail = Awaited<
  ReturnType<typeof readCustomerCommunication>
>;
export type MessageSwitches = Awaited<
  ReturnType<typeof readMessageClassSwitches>
>;
export type MessageView = "to-send" | "follow-up" | "all" | "classes";
export const messageViews: { id: MessageView; label: string }[] = [
  { id: "to-send", label: "To send" },
  { id: "follow-up", label: "Needs follow-up" },
  { id: "all", label: "All messages" },
  { id: "classes", label: "Message classes" },
];
export function inMessageView(m: Pick<MessageRow, "state">, view: MessageView) {
  return view === "to-send"
    ? m.state === "Prepared"
    : view === "follow-up"
      ? ["Held", "Failed", "OutcomeUnknown"].includes(m.state)
      : true;
}
export function messageState(m: {
  state: State;
  hold_reason: HoldReason | null;
  last_evidence?: string;
}) {
  if (m.state === "Prepared") return "To send";
  if (m.state === "Held")
    return m.hold_reason === "DoNotNotify"
      ? "Held · do not notify"
      : `Held · ${m.hold_reason ? holdSummary(m.hold_reason) : "see history"}`;
  if (m.state === "Sent") return "Sent (simulated) · delivery not confirmed";
  if (m.state === "Delivered")
    return "Delivered (simulated) · positive evidence";
  if (m.state === "Failed")
    return /non-delivery report/i.test(m.last_evidence ?? "")
      ? "Failed (simulated) · bounced"
      : "Failed (simulated) · not delivered";
  if (m.state === "OutcomeUnknown") return "Outcome unknown";
  if (m.state === "Withdrawn") return "Withdrawn · never sent";
  return `${m.state} (simulated)`;
}
export const messageTone = (state: State) =>
  state === "Failed"
    ? ("negative" as const)
    : ["Held", "OutcomeUnknown"].includes(state)
      ? ("attention" as const)
      : state === "Delivered"
        ? ("positive" as const)
        : ("neutral" as const);
export const sourceHref = (m: MessageRow) =>
  m.source.type === "Project"
    ? `/projects/${m.source.id}`
    : `/supply/material-readiness?record=${m.source.id}`;
export const messageDate = (value: string) =>
  new Date(value).toLocaleString("en-AU", {
    timeZone: "Australia/Brisbane",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }) + " AEST";

// Counts are lower bounds when the candidate window filled before source authorization.
export function messageCounts(queue: MessageQueue | null) {
  if (!queue) return undefined;
  return Object.fromEntries(
    (["to-send", "follow-up"] as const).map((view) => {
      const count = queue.items.filter((m) => inMessageView(m, view)).length;
      return [view, queue.limit_reached ? `${count}+` : count];
    }),
  );
}
export const messageWindowWarning =
  "The 200-candidate limit was reached. More messages may be outside this window; counts and empty views are incomplete.";
export const messageRecipientName = (value: string | null) => value ?? "No named contact";
export const messageRecipientAddress = (value: string | null) => value ?? "no address";
export const messageSubject = (value: string | null) => value ?? "No exact content was prepared";
export const messageFactLabels: Record<string, string> = {
  "customer.name": "Customer",
  "recipient.name": "Recipient",
  "source.reference": "Source reference",
  "site.name": "Site",
  "dispatch.carrier": "Carrier",
  "dispatch.tracking_number": "Consignment",
  "dispatch.quantity": "This movement",
  "dispatch.dispatched_quantity": "Dispatched",
  "dispatch.outstanding_quantity": "Outstanding",
  "dispatch.unit": "Unit",
  "delivery.customer_eta": "Customer ETA",
  "delay.previous_eta": "Previous customer ETA",
  "delay.reason": "Delay reason",
};
export function messageFactLabel(key: string) {
  const readable = key.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/[._-]+/g, " ");
  return messageFactLabels[key] ?? readable.charAt(0).toUpperCase() + readable.slice(1);
}
export function messageFactValue(key: string, value: string | null) {
  if (value === null) return "Not recorded";
  return ["delivery.customer_eta", "delay.previous_eta"].includes(key)
    ? messageDate(value)
    : value;
}
