// Presentation only. Current command guards remain the authority to arrive/work.
export function visitArrivalGuidance(
  status: string,
  ownAttendance: boolean,
  otherStart = false,
) {
  const closed = ["CompletedPendingReview", "Completed", "Cancelled"].includes(
    status,
  );
  const startable = ["Confirmed", "InProgress"].includes(status);
  const visit =
    status === "CompletedPendingReview"
      ? "This visit is closed to new arrivals. Submitted evidence awaits internal Service review."
      : status === "Completed"
        ? "This visit is closed. No new arrival can be recorded here."
        : status === "Cancelled"
          ? "This visit is cancelled. No new arrival can be recorded here."
          : status === "Proposed"
            ? "This visit is proposed and has not been booked. Preparation and scheduling are still required."
            : !startable
              ? "Arrival authority is unavailable for this visit state. Refresh the job and ask the Service owner to review it."
              : "";
  return {
    closed,
    startable,
    visit,
    personal: ownAttendance
      ? "Your actual start is server-saved. This is your retained attendance."
      : otherStart
        ? "Another crew member's attendance is not your attendance. You have no recorded arrival on this visit."
        : "You have no recorded arrival on this visit.",
    next: closed
      ? "Further attendance requires a separate visit with its own assignment, current scope, readiness, exact pack and personal acknowledgement."
      : startable
        ? "Review the current authorised scope and exact job pack. Recording your own arrival rechecks current permission and every start blocker."
        : "Review preparation with the Service owner. Opening a record does not authorise attendance.",
  };
}

export function visitPreparationGuidance(
  status: string,
  preparation: string,
  scopeReviewRequired: boolean,
) {
  if (["CompletedPendingReview", "Completed", "Cancelled"].includes(status))
    return visitArrivalGuidance(status, false).visit;
  if (scopeReviewRequired)
    return "Scope review required. This visit does not establish authority for the current work.";
  if (status === "Proposed")
    return preparation === "Preparing"
      ? "Preparation is recorded. Review readiness, customer agreement and suitable available crew before Scheduling accepts the booking."
      : "Preparation is incomplete. Service must review this proposal before booking; a readiness assessment does not change its preparation state.";
  if (status === "Confirmed")
    return "Booking is confirmed. Current assignment, competency, readiness, exact pack and personal acknowledgement still govern arrival.";
  if (status === "InProgress")
    return "Attendance is underway. Each crew member retains their own arrival and evidence.";
  return "Current visit authority is unavailable. Ask the Service owner to review it.";
}
