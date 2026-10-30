import type { Appointment } from "./components/client/planner-screens.client";
import type { Pack } from "../documents/components/client/job-pack-types";
import { readableValue } from "../documents/pack-view";

export type AppointmentMode =
  "confirm" | "move" | "request" | "contact" | "readiness" | "cancel";
export type AppointmentCheck = {
  code: string;
  label: string;
  shortLabel: string;
  outcome: string;
  detail: string;
  gated?: boolean;
};
export const appointmentClosed = (a: Pick<Appointment, "status">) =>
  ["Cancelled", "Completed", "CompletedPendingReview"].includes(a.status);

// Customer site readiness (gate P4) as the server derives it for the current schedule
// version. Visits on a policy without P4 have no preparation and keep the gated wording.
export function siteReadinessCheck(a: Appointment) {
  const prep = a.preparation;
  if (!prep)
    return {
      outcome: "Not available",
      detail:
        "This visit's readiness policy does not include customer site readiness. Date agreement does not confirm site readiness.",
      gated: true,
    };
  const contact = a.contacts.find((c) => c.id === prep.contact_id);
  const notReady = contact?.site_checks
    ? Object.values(contact.site_checks).filter((c) => c.status === "NotReady")
        .length
    : 0;
  const detail =
    prep.outcome === "Pass"
      ? `Confirmed by ${contact?.recipient_name ?? "the site contact"}${prep.late ? ", late (after the window closed)" : ""}.`
      : prep.outcome === "Blocked"
        ? `The customer reported ${notReady || "a"} check${notReady === 1 ? "" : "s"} not ready. The service owner has a follow-up.`
        : contact
          ? "Not confirmed yet: the last contact was not a confirmation."
          : "Not recorded for this schedule. Record what the site contact confirms before the crew leaves.";
  return { outcome: prep.outcome, detail, gated: false };
}

// Presentation of existing server facts only. P5 is deliberately absent from gate arithmetic.
export function appointmentChecks(a: Appointment): AppointmentCheck[] {
  const parts = a.readiness.find((c) => c.criterion_code === "PartsReadiness");
  const controls = a.readiness.find(
    (c) => c.criterion_code === "DispatchControls",
  );
  const cancelled = a.status === "Cancelled";
  const site = siteReadinessCheck(a);
  const check = (
    code: string,
    label: string,
    shortLabel: string,
    outcome: string,
    detail: string,
    gated = false,
  ) => ({
    code,
    label,
    shortLabel,
    outcome: cancelled ? "NotApplicable" : outcome,
    detail: cancelled ? "Visit cancelled." : detail,
    gated,
  });
  return [
    check(
      "PartsReadiness",
      "Parts ready for the stated material scope",
      "Parts ready",
      parts?.outcome ?? "Unavailable",
      parts?.parts?.summary ??
        parts?.reason ??
        "This visit's readiness policy does not include Parts. No result is assumed.",
    ),
    check(
      "CustomerSiteReadiness",
      "Customer site readiness confirmed",
      "Customer site readiness",
      site.outcome,
      site.detail,
      site.gated,
    ),
    check(
      "DispatchControls",
      "Current site and isolation controls",
      "Site and isolation controls",
      controls?.outcome ?? "Unknown",
      controls?.reason ||
        "Review the current job pack and work-order readiness evidence.",
    ),
    check(
      "CrewCompetency",
      "Crew competency",
      "Crew competency",
      a.status === "Confirmed" ? "Checked at confirmation" : "Unknown",
      a.status === "Confirmed"
        ? "Checked for the complete crew when this visit was confirmed; current attendance checks still apply."
        : "Checked for the complete crew when the visit is confirmed.",
    ),
  ];
}

export function appointmentDispatch(
  a: Appointment,
  pack: Pack | null,
  current: boolean,
) {
  if (a.status === "Cancelled")
    return {
      title: "Cancelled",
      detail:
        a.cancellation_reason ||
        "The booking is cancelled. Arrange any further attendance through the work order.",
      tone: "neutral" as const,
      reasons: [] as string[],
    };
  if (appointmentClosed(a) || a.actual_start_at)
    return {
      title:
        a.actual_start_at && !appointmentClosed(a)
          ? "Visit started"
          : readableValue(a.status),
      detail:
        "Review retained visit evidence on the work order. Further attendance needs a separate visit.",
      tone: "neutral" as const,
      reasons: [] as string[],
    };
  if (!current)
    return {
      title: "Readiness unavailable",
      detail:
        "Showing the last successful appointment read. Refresh before taking an action.",
      tone: "attention" as const,
      reasons: [] as string[],
    };
  if (a.status === "Proposed")
    return {
      title: "Not confirmed yet",
      detail:
        "A proposed visit reserves no crew and no time. Confirm it once the customer has agreed the dates; crew competency is checked then.",
      tone: "attention" as const,
      reasons: [
        a.customer_commitment !== "Confirmed"
          ? "Customer dates not agreed"
          : "",
        "Crew not reserved",
      ].filter(Boolean),
    };
  if (a.status !== "Confirmed")
    return {
      title: "Readiness unavailable",
      detail:
        "Current visit authority is unavailable for this state. Ask the Service owner to review it.",
      tone: "attention" as const,
      reasons: [] as string[],
    };
  if (!pack)
    return {
      title: a.dispatch_hold ? "Dispatch held" : "Readiness unavailable",
      detail:
        "Current job-pack checks are needed to show dispatch readiness. Review the job pack below.",
      tone: "attention" as const,
      reasons: [] as string[],
    };
  const held =
    a.dispatch_hold ||
    !!a.policy_impacts?.some((p) => p.held) ||
    pack.readiness.dispatch_hold ||
    !pack.readiness.component_ready;
  return {
    title: held ? "Dispatch held" : "Ready to dispatch",
    detail: held
      ? "The crew can leave once the current dispatch checks pass and the complete crew has acknowledged the current job pack."
      : a.preparation
        ? "The current dispatch checks pass, including customer site readiness, and the complete crew has acknowledged the current job pack."
        : "The current dispatch checks pass and the complete crew has acknowledged the current job pack. This visit's policy does not include customer site readiness.",
    tone: held ? ("attention" as const) : ("positive" as const),
    reasons: pack.readiness.reasons,
  };
}

export function appointmentActions(a: Appointment, current: boolean) {
  const closed = appointmentClosed(a);
  return {
    contact: current && !closed && a.actions.can_contact,
    // The server accepts site readiness only for an unstarted Proposed or Confirmed visit on P4.
    readiness:
      current &&
      !closed &&
      a.actions.can_contact &&
      !!a.preparation &&
      !a.actual_start_at &&
      ["Proposed", "Confirmed"].includes(a.status),
    manage:
      current &&
      !closed &&
      !a.actual_start_at &&
      a.actions.can_manage &&
      ["Proposed", "Confirmed"].includes(a.status),
    request:
      current && !closed && a.actions.can_request && a.status === "Confirmed",
  };
}
