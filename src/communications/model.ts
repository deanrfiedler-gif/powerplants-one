import type { Capability } from "../platform/permissions";

// D-025 message classes (decision paper section 3). M1-M3 are factual and M4 is reviewed; since
// 16 October a named person sends every one of them (C2 as changed).
export const messageClasses = [
  "DispatchNotice",
  "DelayNotice",
  "VisitConfirmation",
  "ProjectUpdate",
] as const;
export type MessageClass = (typeof messageClasses)[number];
export const sourceTypes = ["SupplyDemand", "Project"] as const;
export type SourceType = (typeof sourceTypes)[number];
type ClassRule = {
  code: "M1" | "M2" | "M3" | "M4";
  label: string;
  review: "Factual" | "Reviewed";
  // null until the stage that builds the class adds its source (M3 waits for S5 and appointments).
  source_type: SourceType | null;
  // The duty of the team that owns the class: the template publisher and the sender both need it.
  working: Capability;
};
export const classRules: Record<MessageClass, ClassRule> = {
  DispatchNotice: { code: "M1", label: "Dispatch notice", review: "Factual", source_type: "SupplyDemand", working: "supply.coordinate" },
  DelayNotice: { code: "M2", label: "Delay notice", review: "Factual", source_type: "SupplyDemand", working: "supply.coordinate" },
  VisitConfirmation: { code: "M3", label: "Visit confirmation", review: "Factual", source_type: null, working: "schedule.manage" },
  ProjectUpdate: { code: "M4", label: "Project update", review: "Reviewed", source_type: "Project", working: "project.edit" },
};

// R4 states, with Queued added for the named sender's confirmation.
export const states = [
  "Prepared",
  "Held",
  "Queued",
  "Submitted",
  "Sent",
  "Delivered",
  "Failed",
  "OutcomeUnknown",
  "Withdrawn",
] as const;
export type State = (typeof states)[number];
export type Action = "Prepare" | "Confirm" | "Hold" | "Withdraw" | "Record" | "Reconcile";
export const holdReasons = [
  "ClassSwitchedOff",
  "DoNotNotify",
  "NoRecipient",
  "MissingAddress",
  "RecipientNotCurrent",
  "RecipientChanged",
  "MissingData",
  "TemplateUnavailable",
] as const;
export type HoldReason = (typeof holdReasons)[number];

// The same table migration 0109's guard enforces; the application refuses first with a clear code.
const transitions: Record<State, Partial<Record<Action, readonly State[]>>> = {
  Prepared: { Confirm: ["Queued"], Hold: ["Held"], Withdraw: ["Withdrawn"] },
  Held: { Withdraw: ["Withdrawn"] },
  Queued: { Record: ["Submitted", "Failed", "OutcomeUnknown"], Hold: ["Held"] },
  Submitted: { Record: ["Sent", "Failed"] },
  Sent: { Record: ["Delivered", "Failed"] },
  OutcomeUnknown: { Reconcile: ["Queued", "Submitted", "Sent", "Failed"] },
  Delivered: {},
  Failed: {},
  Withdrawn: {},
};
export function allowed(from: State | null, action: Action, to: State) {
  if (from === null) return action === "Prepare" && (to === "Prepared" || to === "Held");
  return transitions[from][action]?.includes(to) ?? false;
}
// Held, Failed and OutcomeUnknown each keep one owned follow-up open (R5).
export const followUpStates: readonly State[] = ["Held", "Failed", "OutcomeUnknown"];
export const awaitingAction: readonly State[] = ["Prepared", ...followUpStates];

const holdText: Record<HoldReason, string> = {
  ClassSwitchedOff: "this message class is switched off",
  DoNotNotify: "the contact asked not to be notified",
  NoRecipient: "the record names no contact for this message",
  MissingAddress: "the contact has no email address",
  RecipientNotCurrent: "the contact is not a current contact of this customer",
  RecipientChanged: "the contact or address changed after preparation",
  MissingData: "a fact the template needs is not recorded",
  TemplateUnavailable: "no customer email template is published for this class",
};
export const holdSummary = (reason: HoldReason) => holdText[reason];
// Every state names the channel: S2 records simulated outcomes only, and Sent never implies delivery.
export function displayState(state: State, hold: HoldReason | null) {
  switch (state) {
    case "Prepared":
      return "Prepared — waiting for a named sender";
    case "Held":
      return `Held — not sent: ${hold ? holdText[hold] : "see history"}`;
    case "Queued":
      return "Queued (simulated) — confirmed by the sender";
    case "Submitted":
      return "Submitted (simulated) — accepted, not yet confirmed sent";
    case "Sent":
      return "Sent (simulated) — delivery not confirmed";
    case "Delivered":
      return "Delivered (simulated) — recipient's server accepted it";
    case "Failed":
      return "Failed (simulated) — not delivered";
    case "OutcomeUnknown":
      return "Outcome unknown — reconcile before any retry";
    case "Withdrawn":
      return "Withdrawn — never sent";
  }
}
