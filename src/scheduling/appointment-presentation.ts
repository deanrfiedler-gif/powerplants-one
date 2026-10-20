import type { Appointment } from "./components/client/planner-screens.client";
import type { Pack } from "../documents/components/client/job-pack-types";
import { readableValue } from "../documents/pack-view";

export type AppointmentMode =
  "confirm" | "move" | "request" | "contact" | "cancel";
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

// Presentation of existing server facts only. P4/P5 are deliberately absent from gate arithmetic.
export function appointmentChecks(a: Appointment): AppointmentCheck[] {
  const parts = a.readiness.find((c) => c.criterion_code === "PartsReadiness");
  const controls = a.readiness.find(
    (c) => c.criterion_code === "DispatchControls",
  );
  const cancelled = a.status === "Cancelled";
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
      "Not available",
      "Customer site-readiness recording is not available yet. Date agreement does not confirm site readiness.",
      true,
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
      : "The current dispatch checks pass and the complete crew has acknowledged the current job pack. Customer site readiness is not included in the current gate yet.",
    tone: held ? ("attention" as const) : ("positive" as const),
    reasons: pack.readiness.reasons,
  };
}

export function appointmentActions(a: Appointment, current: boolean) {
  const closed = appointmentClosed(a);
  return {
    contact: current && !closed && a.actions.can_contact,
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
