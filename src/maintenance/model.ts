import {
  choice,
  dateOnly,
  invalid,
  label,
  narrative,
  object,
  optionalId,
  optionalNarrative,
  uuid,
} from "../shared/validation";
import { coverageStates, list } from "../service/work-scope-validation";

export const sourceStates = [
  "Available",
  "Partial",
  "Unavailable",
  "Unknown",
] as const;
export const remedyTypes = [
  "Investigate",
  "Repair",
  "Return",
  "Replace",
  "Loan",
] as const;
export const responseStates = [
  "Accepted",
  "Reservations",
  "Disagreed",
  "Unavailable",
] as const;
export const supplierStates = [
  "Reviewing",
  "MoreInformation",
  "Approved",
  "PartiallyApproved",
  "Rejected",
] as const;
export type CoverageState = (typeof coverageStates)[number];
export const nullableDate = (v: unknown, field: string) =>
  v == null || v === "" ? null : dateOnly(v, field);
export const text = (v: unknown, field: string) => narrative(v, field, 4000);
export function sourceFields(v: unknown) {
  const x = object(v, [
    "reference",
    "revision",
    "availability",
    "source_date",
    "content",
    "access_class",
  ]);
  return {
    reference: label(x.reference, "reference", 200),
    revision: label(x.revision, "revision", 100),
    availability: choice(x.availability, "availability", sourceStates),
    source_date: nullableDate(x.source_date, "source_date"),
    content: text(x.content, "content"),
    access_class: choice(
      x.access_class ?? "RestrictedService",
      "access_class",
      ["Internal", "RestrictedService", "RestrictedFinance"] as const,
    ),
  };
}
export function agreementFields(v: unknown) {
  const x = object(v, [
    "title",
    "effective_from",
    "effective_to",
    "service_scope",
    "exclusions",
    "response_terms",
    "charging_basis",
    "billing_owner_id",
    "responsibilities",
    "source",
    "sites",
  ]);
  const effective_from = dateOnly(x.effective_from, "effective_from"),
    effective_to = dateOnly(x.effective_to, "effective_to");
  if (effective_to < effective_from)
    invalid("effective_to", "Expiry must be on or after the effective date.");
  const sites = list(
    x.sites,
    "sites",
    (v) => {
      const s = object(v, [
        "site_id",
        "mode",
        "facility_ids",
        "asset_ids",
        "excluded_facility_ids",
        "excluded_asset_ids",
      ]);
      const ids = (k: string) => list(s[k] ?? [], k, (v) => uuid(v, k));
      const result = {
        site_id: uuid(s.site_id, "site_id"),
        mode: choice(s.mode, "mode", [
          "WholeSite",
          "SelectedFacilities",
        ] as const),
        facility_ids: ids("facility_ids"),
        asset_ids: ids("asset_ids"),
        excluded_facility_ids: ids("excluded_facility_ids"),
        excluded_asset_ids: ids("excluded_asset_ids"),
      };
      if (result.mode === "SelectedFacilities" && !result.facility_ids.length)
        invalid(
          "facility_ids",
          "Choose the facilities covered by this revision.",
        );
      if (result.mode === "WholeSite" && result.facility_ids.length)
        invalid(
          "facility_ids",
          "Whole-site scope does not use a selected-facility list.",
        );
      return result;
    },
    1,
    20,
  );
  if (new Set(sites.map((s) => s.site_id)).size !== sites.length)
    invalid("sites", "Each site may appear once.");
  return {
    title: label(x.title, "title", 200),
    effective_from,
    effective_to,
    service_scope: text(x.service_scope, "service_scope"),
    exclusions: text(x.exclusions, "exclusions"),
    response_terms: optionalNarrative(x.response_terms, "response_terms", 2000),
    charging_basis: text(x.charging_basis, "charging_basis"),
    billing_owner_id: uuid(x.billing_owner_id, "billing_owner_id"),
    responsibilities: text(x.responsibilities, "responsibilities"),
    source: sourceFields(x.source),
    sites,
  };
}
export type AgreementContent = ReturnType<typeof agreementFields>;
export function agreementCurrentness(
  state: string,
  x: AgreementContent,
  date: string,
) {
  if (state !== "Active") return state;
  return date < x.effective_from
    ? "NotYetEffective"
    : date > x.effective_to
      ? "Expired"
      : "Current";
}
export function scopeIncludes(
  x: AgreementContent,
  site: string,
  asset: string | null,
  facility: string | null,
) {
  const s = x.sites.find((v) => v.site_id === site);
  if (
    !s ||
    (asset && s.excluded_asset_ids.includes(asset)) ||
    (facility && s.excluded_facility_ids.includes(facility))
  )
    return false;
  if (
    s.mode === "SelectedFacilities" &&
    (!facility || !s.facility_ids.includes(facility))
  )
    return false;
  return !s.asset_ids.length || (!!asset && s.asset_ids.includes(asset));
}
export function planFields(v: unknown) {
  const x = object(v, [
    "title",
    "agreement_revision_id",
    "task_set_reference",
    "task_set_revision",
    "interval",
    "interval_source",
    "anchor",
    "timezone",
    "window_months",
    "tolerance",
    "effective_from",
    "tasks",
  ]);
  const timezone = label(x.timezone, "timezone", 100);
  try {
    new Intl.DateTimeFormat("en-AU", { timeZone: timezone }).format();
  } catch {
    invalid("timezone", "Choose a valid IANA timezone.");
  }
  const window_months = Number(x.window_months);
  if (
    !Number.isInteger(window_months) ||
    window_months < 1 ||
    window_months > 12
  )
    invalid("window_months", "Use a bounded 1–12 month generation window.");
  const tasks = list(
    x.tasks,
    "tasks",
    (v) => {
      const t = object(v, [
        "id",
        "description",
        "expected_outcome",
        "completion_requirements",
        "kind",
      ]);
      return {
        id: uuid(t.id, "task_id"),
        description: text(t.description, "description"),
        expected_outcome: text(t.expected_outcome, "expected_outcome"),
        completion_requirements: text(
          t.completion_requirements,
          "completion_requirements",
        ),
        kind: choice(t.kind, "kind", [
          "Inspection",
          "Identification",
          "Intervention",
        ] as const),
      };
    },
    1,
    20,
  );
  if (new Set(tasks.map((t) => t.id)).size !== tasks.length)
    invalid("tasks", "Task identities must be unique within the revision.");
  return {
    title: label(x.title, "title", 200),
    agreement_revision_id: uuid(
      x.agreement_revision_id,
      "agreement_revision_id",
    ),
    task_set_reference: label(x.task_set_reference, "task_set_reference", 200),
    task_set_revision: label(x.task_set_revision, "task_set_revision", 100),
    interval: choice(x.interval, "interval", ["Monthly", "Quarterly"] as const),
    interval_source: sourceFields(x.interval_source),
    anchor: dateOnly(x.anchor, "anchor"),
    timezone,
    window_months,
    tolerance: optionalNarrative(x.tolerance, "tolerance", 2000),
    effective_from: dateOnly(x.effective_from, "effective_from"),
    tasks,
  };
}
export type PlanContent = ReturnType<typeof planFields>;
export function monthDate(anchor: string, offset: number) {
  const [year, month, day] = anchor.split("-").map(Number);
  const d = new Date(0);
  d.setUTCFullYear(year, month - 1 + offset, 1);
  const end = new Date(d);
  end.setUTCMonth(end.getUTCMonth() + 1, 0);
  const last = end.getUTCDate();
  d.setUTCDate(Math.min(day, last));
  return d.toISOString().slice(0, 10);
}
export function occurrenceDates(
  plan: PlanContent,
  from: string,
  until: string,
) {
  dateOnly(from, "from");
  dateOnly(until, "until");
  if (until < from || until > monthDate(from, plan.window_months))
    invalid(
      "until",
      "Keep the preview inside the sourced bounded generation window.",
    );
  const step = plan.interval === "Monthly" ? 1 : 3;
  const months =
    (Number(from.slice(0, 4)) - Number(plan.anchor.slice(0, 4))) * 12 +
    Number(from.slice(5, 7)) -
    Number(plan.anchor.slice(5, 7));
  let offset = Math.max(0, Math.floor(months / step) * step);
  const dates: string[] = [];
  for (let i = 0; i < 101; i++, offset += step) {
    const due = monthDate(plan.anchor, offset);
    if (due > until) return dates;
    if (due >= from && due >= plan.effective_from) dates.push(due);
    if (dates.length > 100)
      invalid("until", "Generate at most 100 occurrences at a time.");
  }
  invalid("until", "The generation window is too large.");
}
export function minorUnits(v: unknown, field: string, allowZero = false) {
  if (
    !Number.isSafeInteger(v) ||
    Number(v) < (allowZero ? 0 : 1) ||
    Number(v) > 1_000_000_000_000
  )
    invalid(field, "Enter an exact integer amount in minor units.");
  return Number(v);
}
export function supplierApproval(
  state: string,
  amount: number,
  claimed: number,
  credited: number,
) {
  if (
    (state === "Approved" && amount !== claimed) ||
    (state === "PartiallyApproved" && (amount <= 0 || amount >= claimed)) ||
    (!["Approved", "PartiallyApproved"].includes(state) && amount !== 0) ||
    amount < credited
  )
    invalid(
      "approved_minor",
      "The amount must match the supplier response and cannot invalidate linked credit evidence.",
    );
}
export function assessmentFields(v: unknown) {
  const x = object(v, [
    "status",
    "basis",
    "cause",
    "owner_id",
    "review_due",
    "next_action",
    "event_date",
    "agreement_revision_id",
    "facility_id",
  ]);
  const status = choice(x.status, "status", coverageStates),
    review_due = nullableDate(x.review_due, "review_due");
  if (["Unknown", "Disputed"].includes(status) && !review_due)
    invalid(
      "review_due",
      "Unresolved coverage requires an owned dated review.",
    );
  return {
    status,
    basis: text(x.basis, "basis"),
    cause: text(x.cause, "cause"),
    owner_id: uuid(x.owner_id, "owner_id"),
    review_due,
    next_action: text(x.next_action, "next_action"),
    event_date: dateOnly(x.event_date, "event_date"),
    agreement_revision_id: optionalId(
      x.agreement_revision_id,
      "agreement_revision_id",
    ),
    facility_id: optionalId(x.facility_id, "facility_id"),
  };
}
