import type {
  MessageDetail,
  MessageQueue,
} from "../../src/communications/ui-model";
import { classRules, type State } from "../../src/communications/model";
export const ecCompany = "10000000-0000-4000-8000-000000000001";
export const ecActor = "10000000-0000-4000-8000-000000000002";
export const ecWorkspace = "10000000-0000-4000-8000-000000000003";
export function ecMessage(n: number, state: State = "Prepared"): MessageDetail {
  const cls = n === 2 ? "DelayNotice" : "DispatchNotice",
    rule = classRules[cls];
  return {
    id: `ec040000-0000-4000-8000-${String(n).padStart(12, "0")}`,
    message_class: cls,
    code: rule.code,
    label: rule.label,
    review: "Factual",
    state,
    version: 1,
    hold_reason: state === "Held" ? "DoNotNotify" : null,
    display_state: state,
    channel: "Synthetic",
    simulated: true,
    subject:
      n === 2
        ? "[SYN-SC-000202] Delay – dosing pump"
        : `[SYN-SC-00020${n}] Dispatch – motor M-4 seal kit`,
    recipient: {
      role: "Delivery contact on the demand",
      contact_id: "10000000-0000-4000-8000-000000000004",
      name: "SYN Priya Shah",
      address: "priya@hillview.example",
    },
    source: {
      type: "SupplyDemand",
      id: "10000000-0000-4000-8000-000000000005",
      reference: `SYN-SC-00020${n}`,
      fact_version: 2,
    },
    company_id: ecCompany,
    organisation_id: "10000000-0000-4000-8000-000000000006",
    customer_name: "SYN Hillview Growers",
    site_id: null,
    correction: false,
    supersedes_id: null,
    content_hash: "7f3a91c2".repeat(8),
    prepared_at: "2026-10-13T22:42:00.000Z",
    prepared_by: "SYN Robin Hale",
    sent_by: state === "Sent" ? "SYN Sasha Cole" : null,
    owner: { id: ecActor, name: "SYN Robin Hale" },
    follow_up: ["Held", "Failed", "OutcomeUnknown"].includes(state)
      ? { activity_id: "10000000-0000-4000-8000-000000000007", status: "Open" }
      : null,
    last_event_at: "2026-10-13T23:00:00.000Z",
    last_evidence:
      state === "Failed"
        ? "Synthetic non-delivery report: address unavailable"
        : "Prepared from exact native source facts.",
    sender: { id: ecActor, name: "SYN Sasha Cole" },
    actions: {
      confirm: state === "Prepared",
      withdraw: ["Prepared", "Held"].includes(state),
      reconcile: state === "OutcomeUnknown",
      duty: true,
      independent_sender: true,
    },
    current_hold: state === "Held" ? "DoNotNotify" : null,
    notice_preference: state === "Held" ? "DoNotNotify" : null,
    checked_at: "2026-10-13T23:00:00.000Z",
    body: "Hello Priya,\n\n4 EA of the motor M-4 seal kit moved on 13 October.\n\nCarrier: SYN Freight Co\nConsignment: SYN-CONSIGN-000001\n\n4 EA dispatched. 6 EA outstanding.\n\nTo stop these emails, reply to this email and ask us to stop.\n\nPowerplants",
    facts: {
      "customer.name": "SYN Hillview Growers",
      "recipient.name": "SYN Priya Shah",
      "site.name": "SYN Glasshouse 4",
      "source.reference": `SYN-SC-00020${n}`,
      "dispatch.carrier": "SYN Freight Co",
      "dispatch.tracking_number": "SYN-CONSIGN-000001",
      "dispatch.quantity": "4",
      "dispatch.dispatched_quantity": "4",
      "dispatch.outstanding_quantity": "6",
      "dispatch.unit": "EA",
      "delivery.customer_eta": "2026-11-03",
    },
    template: {
      id: "10000000-0000-4000-8000-000000000008",
      version: 3,
      definition_hash: "a".repeat(64),
    },
    history: [
      {
        version: 1,
        state,
        action: "Prepare",
        hold_reason: state === "Held" ? "DoNotNotify" : null,
        display_state:
          state === "Sent"
            ? "Sent (simulated) — delivery not confirmed"
            : state,
        provider_message_id: null,
        actor: "SYN Robin Hale",
        reason: "SYN fixture for the API-boundary presentation proof",
        evidence: "Exact prepared content retained.",
        occurred_at: "2026-10-13T22:42:00.000Z",
      },
    ],
    follow_ups: [],
  };
}
export function ecQueue(items: MessageDetail[]): MessageQueue {
  return {
    items,
    channel: "Synthetic",
    simulated: true,
    coverage:
      "Readable messages from a window of at most 200 candidates; counts and filters apply to this window.",
    observed_at: "2026-10-13T23:00:00.000Z",
  };
}
