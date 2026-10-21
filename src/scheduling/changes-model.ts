import type { Appointment } from "./index";
import { hasOpenSchedulingFollowup } from "./workspace-model";

export const changeQueues = [
  { id: "review", label: "Needs review" },
  { id: "requests", label: "Change requests" },
  { id: "contact", label: "Customer follow-up" },
  { id: "cancellations", label: "Cancellations" },
  { id: "history", label: "History / all visits" },
] as const;
export type ChangeQueue = (typeof changeQueues)[number]["id"];
export function inChangeQueue(a: Appointment, queue: ChangeQueue) {
  if (queue === "history") return true;
  if (queue === "requests") return a.requests.length > 0;
  if (queue === "contact") return hasOpenSchedulingFollowup(a);
  if (queue === "cancellations") return a.status === "Cancelled";
  // Q2: a policy hold alone never adds a visit to Needs review.
  return (
    a.requests.some((r) => r.status === "Pending") ||
    a.customer_commitment === "Changed" ||
    a.scope_review_required ||
    hasOpenSchedulingFollowup(a)
  );
}
export function changeQueueCounts(items: Appointment[]) {
  return Object.fromEntries(
    changeQueues.map((q) => [
      q.id,
      items.filter((a) => inChangeQueue(a, q.id)).length,
    ]),
  ) as Record<ChangeQueue, number>;
}
export function changeReasons(a: Appointment) {
  const reasons: string[] = a.requests
    .filter((r) => r.status === "Pending")
    .map((r) =>
      r.source_type === "TechnicianRequest"
        ? "Technician change request"
        : "Change request",
    );
  if (a.customer_commitment === "Changed")
    reasons.push("Customer contact changed");
  if (a.scope_review_required) reasons.push("Scope review needed");
  if (hasOpenSchedulingFollowup(a)) reasons.push("Follow-up open");
  return [...new Set(reasons)];
}
export const currentCrew = (a: Appointment) =>
  a.assignments.filter(
    (x) => x.active && x.assignment_version === a.assignment_version,
  );
export type ChangeRequest = Appointment["requests"][number] & {
  created_at?: string;
  created_by_name?: string;
  decision_at?: string;
  decision_by_name?: string;
};
export type BookingRevision = Appointment["history"][number] & {
  snapshot: Appointment["history"][number]["snapshot"] & {
    schedule_version?: number;
    assignment_version?: number;
    updated_at?: string;
    site_timezone?: string;
  };
};
export type ChangeReview = Omit<Appointment, "requests" | "history"> & {
  requests: ChangeRequest[];
  history: BookingRevision[];
  observed_at: string;
  consequences: {
    state: "Available" | "Unavailable";
    pack: {
      id: string;
      reference: string;
      revision: number | null;
      acknowledged: number;
      recipients: number;
      current: boolean;
    } | null;
    dispatch_hold: boolean | null;
    reasons: string[];
  };
};
export function requestBasis(a: ChangeReview, request: ChangeRequest) {
  return a.history.find(
    (h) => h.snapshot.schedule_version === request.expected_schedule_version,
  );
}
// Describe only differences backed by retained revisions and assignment identities.
export function staleBookingChanges(a: ChangeReview, request: ChangeRequest) {
  if (a.schedule_version === request.expected_schedule_version) return [];
  const basis = requestBasis(a, request);
  if (!basis)
    return [
      "The booking changed; the original schedule details are unavailable.",
    ];
  const later = a.history
    .filter((h) => h.version > basis.version)
    .toSorted((x, y) => x.version - y.version);
  let before = basis;
  const changes: { text: string; at?: string }[] = [];
  for (const next of later) {
    if (
      next.snapshot.assignment_version !== before.snapshot.assignment_version
    ) {
      const oldCrew = a.assignments.filter(
        (x) => x.assignment_version === before.snapshot.assignment_version,
      );
      const newCrew = a.assignments.filter(
        (x) => x.assignment_version === next.snapshot.assignment_version,
      );
      for (const person of newCrew.filter(
        (x) => !oldCrew.some((y) => y.resource_id === x.resource_id),
      ))
        changes.push({
          text: `${person.name} was added`,
          at: next.snapshot.updated_at,
        });
      for (const person of oldCrew.filter(
        (x) => !newCrew.some((y) => y.resource_id === x.resource_id),
      ))
        changes.push({
          text: `${person.name} was removed`,
          at: next.snapshot.updated_at,
        });
      if (!oldCrew.length || !newCrew.length)
        changes.push({
          text: "The crew changed; some earlier assignment details are unavailable",
          at: next.snapshot.updated_at,
        });
    }
    if (
      next.snapshot.start_at !== before.snapshot.start_at ||
      next.snapshot.end_at !== before.snapshot.end_at
    )
      changes.push({
        text: "The booked time changed",
        at: next.snapshot.updated_at,
      });
    if (
      next.snapshot.customer_commitment !== before.snapshot.customer_commitment
    )
      changes.push({
        text: `Customer commitment became ${next.snapshot.customer_commitment}`,
        at: next.snapshot.updated_at,
      });
    before = next;
  }
  return changes.length
    ? changes.map(
        (c) =>
          c.text +
          (c.at
            ? ` at ${new Intl.DateTimeFormat("en-AU", { timeZone: a.site_timezone, hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(new Date(c.at))}`
            : ""),
      )
    : [
        "The booking schedule version changed. Review the current booking before deciding.",
      ];
}
