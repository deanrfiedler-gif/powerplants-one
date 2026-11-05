import {
  choice,
  invalid,
  object,
  optionalId,
  uuid,
} from "../../shared/validation";
import { windowNumber } from "../work-order-register-model";

export const sources = [
  "inspection",
  "incident",
  "completion",
  "response",
  "schedule",
] as const;
export type FindingSource = (typeof sources)[number];
export const views = [
  "open",
  "all",
  "needs_owner",
  "due_this_week",
  "recurring",
  "overdue",
  "waiting_review",
  "follow_up_completed",
  "closed",
  "superseded",
] as const;
export type FindingState =
  | "Open"
  | "NeedsOwner"
  | "WaitingReview"
  | "FollowUpCompleted"
  | "Closed"
  | "Superseded";
export type Finding = {
  id: string;
  source: FindingSource;
  source_id: string;
  source_record: {
    id: string;
    reference: string;
    version: number | null;
    href: string;
  };
  appointment: { id: string; reference: string };
  work_order: { id: string; reference: string };
  company_id: string;
  site: { id: string; name: string; timezone: string };
  equipment: { id: string; reference: string } | null;
  what_remains: string;
  native_state: string;
  state: FindingState;
  action: {
    id: string;
    version: number;
    summary: string;
    required_evidence: string | null;
    status: string;
    owner_id: string;
    owner_name: string;
    due_at: string | null;
    due_date_only: boolean;
    outcome: string | null;
    cancellation_reason: string | null;
    href: string;
  } | null;
  overdue: boolean;
  due_this_week?: boolean;
  recurrence?: {
    basis: "FailedCheck" | "NoStableFaultKey";
    partial: boolean;
    earlier: {
      id: string;
      reference: string;
      href: string;
      occurred_at: string;
      state: FindingState;
      correction: string | null;
    }[];
  };
  closes_when: string;
  closure_authority:
    | "InspectionReview"
    | "IncidentClosure"
    | "ServiceDisposition"
    | "ResponseCorrection"
    | "SchedulingFollowUp";
  updated_at: string;
};

export function findingKey(value: string) {
  const parts = value.split(":");
  if (parts.length !== 2)
    invalid("id", "Use the exact finding source and identifier.");
  return {
    source: choice(parts[0], "source", sources),
    id: uuid(parts[1], "source_id"),
  };
}

export function findingQuery(input: unknown) {
  const r = object(input, [
    "q",
    "source",
    "view",
    "site_id",
    "company_id",
    "owner_id",
    "offset",
    "limit",
  ]);
  if (
    r.q !== undefined &&
    (typeof r.q !== "string" ||
      r.q.length > 200 ||
      /[\u0000-\u001f\u007f]/.test(r.q))
  )
    invalid("q", "Use at most 200 printable characters.");
  return {
    q: ((r.q as string | undefined) ?? "").trim().toLocaleLowerCase("en-AU"),
    source: r.source === undefined ? null : choice(r.source, "source", sources),
    view:
      r.view === undefined ? ("open" as const) : choice(r.view, "view", views),
    site_id: optionalId(r.site_id, "site_id"),
    company_id: optionalId(r.company_id, "company_id"),
    owner_id: optionalId(r.owner_id, "owner_id"),
    offset: windowNumber(r.offset, "offset", 0, 1000000),
    limit: windowNumber(r.limit, "limit", 25, 50),
  };
}

export function inView(row: Finding, view: (typeof views)[number]) {
  const active = !["Closed", "Superseded"].includes(row.state);
  switch (view) {
    case "all":
      return true;
    case "open":
      return active;
    case "needs_owner":
      return row.state === "NeedsOwner";
    case "due_this_week":
      return active && !!row.due_this_week;
    case "recurring":
      return active && !!row.recurrence?.earlier.length;
    case "overdue":
      return active && row.overdue;
    case "waiting_review":
      return active && row.state === "WaitingReview";
    case "follow_up_completed":
      return active && row.action?.status === "Completed";
    case "closed":
      return row.state === "Closed";
    case "superseded":
      return row.state === "Superseded";
  }
}

export function followUpState(status: string | undefined): FindingState {
  return status === "Cancelled" || status === undefined
    ? "NeedsOwner"
    : status === "Completed"
      ? "FollowUpCompleted"
      : "Open";
}

export function isOverdue(row: Pick<Finding, "state" | "action">, now: Date) {
  return (
    !["Closed", "Superseded"].includes(row.state) &&
    !!row.action?.due_at &&
    ["Open", "InProgress"].includes(row.action.status) &&
    Date.parse(row.action.due_at) < now.getTime()
  );
}

// Monday to Sunday in the source site's civil calendar; never the browser zone.
export function dueThisWeek(
  row: Pick<Finding, "state" | "action" | "site">,
  now: Date,
) {
  if (
    ["Closed", "Superseded"].includes(row.state) ||
    !row.action?.due_at ||
    !["Open", "InProgress"].includes(row.action.status)
  )
    return false;
  const day = (value: Date) => {
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: row.site.timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(value);
    const get = (key: string) =>
      Number(parts.find((p) => p.type === key)!.value);
    return Date.UTC(get("year"), get("month") - 1, get("day"));
  };
  const today = day(now),
    weekday = new Date(today).getUTCDay();
  const monday = today - ((weekday + 6) % 7) * 86400000;
  const due = day(new Date(row.action.due_at));
  return due >= monday && due < monday + 7 * 86400000;
}

export function withinRecurrenceWindow(earlier: string, current: string) {
  const elapsed = Date.parse(current) - Date.parse(earlier);
  return elapsed > 0 && elapsed <= 90 * 86400000;
}
