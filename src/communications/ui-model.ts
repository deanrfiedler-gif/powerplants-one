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
