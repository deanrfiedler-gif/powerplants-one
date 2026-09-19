// Presentation logic for the Job Pack page (SC-06). Pure and client-safe: no server module is imported,
// and nothing here decides readiness, applicability or authority. The server read remains the source of truth.
import { sectionKeys, type PackInput, type SectionKey } from "./validation";
import type { PackSnapshot } from "./render";

// Accepted r03 screen titles. OUT-09 keeps sectionLabels until its next template version,
// so two of the nine headings differ between this page and the issued document.
export const packSectionTitles: Record<SectionKey, string> = {
  identification: "Job and visit details",
  customer_arrangements: "Customer arrangements",
  scope: "Authorised scope and limits",
  equipment: "Equipment and configuration",
  history: "History and unresolved issues",
  technical_information: "Technical information",
  readiness: "Parts, tools and readiness",
  site_controls: "Site controls",
  completion: "Completion and escalation",
};
export const packSectionShortTitles: Record<SectionKey, string> = {
  identification: "Job and visit",
  customer_arrangements: "Customer arrangements",
  scope: "Scope and limits",
  equipment: "Equipment",
  history: "Service history",
  technical_information: "Technical information",
  readiness: "Parts, tools and readiness",
  site_controls: "Site controls",
  completion: "Completion requirements",
};
export const preparationFieldLabels: Record<SectionKey, string> = {
  identification: "Visit identification notes",
  customer_arrangements: "Arrival and customer arrangements",
  scope: "Technician briefing",
  equipment: "Equipment verification notes",
  history: "History review notes",
  technical_information: "Technical reference notes",
  readiness: "Tools and collection instructions",
  site_controls: "Visit-specific work arrangements",
  completion: "Escalation and remaining-work instructions",
};
export const revisionLabel = (revision: number) =>
  `r${String(revision).padStart(2, "0")}`;
export const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(-2)
    .map((part) => part[0]!.toUpperCase())
    .join("");

// One event stamp for the whole page: "dd Mon yyyy · HH:mm ZONE", with the zone taken from the site record.
const parts = (
  value: string | Date,
  timeZone: string,
  options: Intl.DateTimeFormatOptions,
) =>
  Object.fromEntries(
    new Intl.DateTimeFormat("en-AU", { timeZone, ...options })
      .formatToParts(new Date(value))
      .map((part) => [part.type, part.value]),
  );
const month = (value: string) => value.replace(/\.$/, "").slice(0, 3);
export const zoneLabel = (value: string | Date, timeZone: string) =>
  parts(value, timeZone, { timeZoneName: "short" }).timeZoneName ?? timeZone;
export const offsetLabel = (value: string | Date, timeZone: string) =>
  (
    parts(value, timeZone, { timeZoneName: "longOffset" }).timeZoneName ?? "GMT"
  ).replace("GMT", "") || "+00:00";
export function formatDate(
  value: string | Date,
  timeZone: string,
  long = false,
) {
  const p = parts(value, timeZone, {
    weekday: long ? "long" : undefined,
    day: "numeric",
    month: long ? "long" : "short",
    year: "numeric",
  });
  return long
    ? `${p.weekday}, ${p.day} ${p.month} ${p.year}`
    : `${p.day} ${month(p.month!)} ${p.year}`;
}
export const formatTime = (value: string | Date, timeZone: string) => {
  const p = parts(value, timeZone, {
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });
  return `${p.hour}:${p.minute}`;
};
export const formatStamp = (value: string | Date, timeZone: string) =>
  `${formatDate(value, timeZone)} · ${formatTime(value, timeZone)} ${zoneLabel(value, timeZone)}`;
export const visitWindow = (start: string, end: string, timeZone: string) =>
  `${formatTime(start, timeZone)}–${formatTime(end, timeZone)} · ${zoneLabel(start, timeZone)} (UTC${offsetLabel(start, timeZone)})`;

// Field-level change record between two saved preparation inputs.
export type PackChange = {
  field: string;
  label: string;
  from: string;
  to: string;
};
export type ChangeNames = {
  sources: Record<string, string>;
  history: Record<string, string>;
};
export const emptyInput = (): PackInput => ({
  sections: Object.fromEntries(
    sectionKeys.map((k) => [k, ""]),
  ) as PackInput["sections"],
  source_ids: [],
  history_ids: [],
});
export const summarise = (value: unknown) => {
  const text = String(value ?? "").trim();
  return text ? (text.length > 70 ? text.slice(0, 67) + "…" : text) : "(empty)";
};
export function inputDiff(
  before: PackInput | null,
  after: PackInput,
  names: ChangeNames,
): PackChange[] {
  const prior = before ?? emptyInput(),
    changes: PackChange[] = [];
  for (const key of sectionKeys) {
    const a = (prior.sections[key] ?? "").trim(),
      b = (after.sections[key] ?? "").trim();
    if (a !== b)
      changes.push({
        field: key,
        label: preparationFieldLabels[key],
        from: summarise(a),
        to: summarise(b),
      });
  }
  const selections = [
    [
      "source_ids",
      "Technical references",
      prior.source_ids,
      after.source_ids,
      names.sources,
    ],
    [
      "history_ids",
      "Service history",
      prior.history_ids,
      after.history_ids,
      names.history,
    ],
  ] as const;
  for (const [field, label, a, b, lookup] of selections) {
    const name = (id: string) => lookup[id] ?? "Record no longer listed",
      added = b.filter((id) => !a.includes(id)),
      removed = a.filter((id) => !b.includes(id));
    if (added.length || removed.length)
      changes.push({
        field,
        label,
        from: removed.length ? "removed " + removed.map(name).join("; ") : "",
        to: added.length ? "added " + added.map(name).join("; ") : "",
      });
  }
  return changes;
}

// Readiness rows come from the server registry. This only counts and labels them.
export type CriterionOutcome =
  "Unknown" | "Pass" | "Blocked" | "PermittedException" | "NotApplicable";
export type PackCriterion = {
  criterion_code: string;
  label: string;
  blocking_stage: string;
  exception_allowed: boolean;
  not_applicable_allowed: boolean;
  outcome: CriterionOutcome;
  recorded_outcome: CriterionOutcome;
  stale: boolean;
  expired: boolean;
  reason: string | null;
  assessed_by_name: string | null;
  assessed_at: string | null;
  valid_until: string | null;
  evidence_title: string | null;
};
export const outcomeLabels: Record<CriterionOutcome, string> = {
  Pass: "Pass",
  Blocked: "Blocked",
  PermittedException: "Permitted exception",
  NotApplicable: "Not applicable",
  Unknown: "Unknown",
};
export const satisfied = (outcome: string) =>
  ["Pass", "PermittedException", "NotApplicable"].includes(outcome);
export function readinessSummary(criteria: PackCriterion[]) {
  const blocked = criteria.filter((c) => !satisfied(c.outcome)),
    exceptions = criteria.filter(
      (c) => c.outcome === "PermittedException",
    ).length,
    notApplicable = criteria.filter(
      (c) => c.outcome === "NotApplicable",
    ).length,
    met = criteria.length - blocked.length;
  return {
    blocked,
    exceptions,
    notApplicable,
    satisfied: met,
    total: criteria.length,
    text: `${met} of ${criteria.length} criteria satisfied${exceptions ? ` · ${exceptions} permitted exception${exceptions === 1 ? "" : "s"}` : ""}${notApplicable ? ` · ${notApplicable} not applicable` : ""}`,
  };
}

// The versions a revision was prepared against, and how the current records differ.
// Advisory only: Check and Issue recompute the exact snapshot and remain the authority.
export type PackBasis = {
  appointment_version: number | null;
  schedule_version: number | null;
  assignment_version: number | null;
  booking_hash: string | null;
  work_version: number | null;
  scope_id: string | null;
  scope_version: number | null;
  scope_hash: string | null;
  site_version: number | null;
  customer_version: number | null;
  template_version: number | null;
  policy_version: number | null;
};
export const basisOf = (s: PackSnapshot): PackBasis => ({
  appointment_version: s.appointment.version,
  schedule_version: s.appointment.schedule_version,
  assignment_version: s.appointment.assignment_version,
  booking_hash: s.appointment.booking_hash,
  work_version: s.work.version,
  scope_id: s.work.scope_id,
  scope_version: s.work.scope_version,
  scope_hash: s.work.scope_hash,
  site_version: s.site.version,
  customer_version: s.customer.version,
  template_version: s.template.version,
  policy_version: s.template.policy_version,
});
export type BasisDrift = {
  source:
    | "Appointment"
    | "Work order"
    | "Site record"
    | "Customer record"
    | "Pack template";
  field: keyof PackBasis;
  label: string;
  from: string;
  // null: the current record could not be read, which is not the same as unchanged.
  to: string | null;
};
const basisFields: [keyof PackBasis, BasisDrift["source"], string][] = [
  ["appointment_version", "Appointment", "record version"],
  ["schedule_version", "Appointment", "schedule version"],
  ["assignment_version", "Appointment", "crew assignment version"],
  ["booking_hash", "Appointment", "booking"],
  ["work_version", "Work order", "record version"],
  ["scope_id", "Work order", "scope revision"],
  ["scope_version", "Work order", "scope version"],
  ["scope_hash", "Work order", "scope content"],
  ["site_version", "Site record", "record version"],
  ["customer_version", "Customer record", "record version"],
  ["template_version", "Pack template", "template version"],
  ["policy_version", "Pack template", "policy version"],
];
const opaque: (keyof PackBasis)[] = ["booking_hash", "scope_id", "scope_hash"];
// Issue and acknowledgement themselves advance the appointment record version, so once a revision is issued
// only the two versions the server's applicability rule compares can mean the pack no longer applies.
const issuedFields: (keyof PackBasis)[] = [
  "schedule_version",
  "assignment_version",
];
export function basisDrift(
  prepared: PackBasis,
  current: PackBasis,
  issued = false,
) {
  const drift: BasisDrift[] = [];
  for (const [field, source, label] of basisFields) {
    if (issued && !issuedFields.includes(field)) continue;
    const from = prepared[field],
      to = current[field];
    if (from === to) continue;
    const show = (v: string | number | null) =>
      v == null
        ? null
        : opaque.includes(field)
          ? String(v).slice(0, 8)
          : `v${v}`;
    drift.push({
      source,
      field,
      label,
      from: show(from) ?? "none",
      to: show(to),
    });
  }
  return drift;
}
export const driftSources = (drift: BasisDrift[]) => [
  ...new Set(drift.map((d) => d.source)),
];

// What the page calls the pack's state. Derived from the server state only.
export type PackTone = "neutral" | "warning" | "green" | "blue";
export function statusPresentation(
  pack: {
    status: string;
    needs_review: boolean;
    current_issue_id: string | null;
  },
  currentJobState?: string | null,
): { label: string; tone: PackTone } {
  if (pack.status === "Withdrawn")
    return { label: "Withdrawn", tone: "neutral" };
  if (pack.status === "Issued")
    return pack.needs_review
      ? { label: "Review required", tone: "warning" }
      : { label: "Issued", tone: "green" };
  if (pack.status === "Checked") {
    if (currentJobState === "StaleSource")
      return { label: "Source changed · successor needed", tone: "warning" };
    if (currentJobState === "Failed")
      return { label: "Output recovery needed", tone: "warning" };
    if (["Queued", "Running", "Durable"].includes(currentJobState ?? ""))
      return { label: "Output in preparation", tone: "blue" };
    return { label: "Checked · not issued", tone: "blue" };
  }
  if (pack.status === "Returned")
    return { label: "Returned for preparation", tone: "warning" };
  return pack.current_issue_id
    ? { label: "Successor draft · not issued", tone: "warning" }
    : { label: "Draft · not issued", tone: "neutral" };
}

// One chronological record assembled from what the read already returns.
export type TimelineEvent = {
  id: string;
  kind: "prepare" | "review" | "source" | "issue" | "distribution";
  title: string;
  detail: string;
  at: string;
  actor: string | null;
  changes: PackChange[];
  href?: string;
};
export type TimelineSource = {
  revisions: {
    id: string;
    revision: number;
    input: PackInput;
    change_reason: string;
    created_at: string;
    created_by_name?: string | null;
  }[];
  checks: {
    id: string;
    revision_id: string;
    decision: string;
    reason: string;
    checked_at: string;
    actor_name?: string | null;
  }[];
  jobs: {
    id: string;
    revision_id: string;
    state: string;
    attempts: number;
    error_code: string | null;
    requested_at: string;
    actor_name?: string | null;
  }[];
  issues: {
    id: string;
    revision: number;
    issued_at: string;
    manifest: { filename: string };
    issued_by_name?: string | null;
  }[];
  events: {
    id: string;
    kind: string;
    reason: string;
    occurred_at: string;
    actor_name?: string | null;
  }[];
  distribution: {
    id: string;
    display_name: string;
    kind: string;
    occurred_at: string;
  }[];
  readiness: {
    recipients: {
      id: string;
      display_name: string;
      acknowledged_at: string | null;
    }[];
  };
};
const eventTitles: Record<string, string> = {
  ReviewRequired: "Review required",
  Superseded: "Issue superseded",
  Withdrawn: "Issue withdrawn",
};
export function packTimeline(
  pack: TimelineSource,
  names: ChangeNames,
): TimelineEvent[] {
  const ascending = [...pack.revisions].sort((a, b) => a.revision - b.revision),
    revisionOf = new Map(pack.revisions.map((r) => [r.id, r.revision])),
    label = (id: string) =>
      revisionOf.has(id) ? revisionLabel(revisionOf.get(id)!) : "a revision",
    events: TimelineEvent[] = [];
  ascending.forEach((r, i) =>
    events.push({
      id: r.id,
      kind: "prepare",
      title:
        i === 0
          ? `Draft ${revisionLabel(r.revision)} prepared`
          : `Preparation ${revisionLabel(r.revision)} saved`,
      detail: r.change_reason,
      at: r.created_at,
      actor: r.created_by_name ?? null,
      changes: inputDiff(ascending[i - 1]?.input ?? null, r.input, names),
    }),
  );
  for (const c of pack.checks)
    events.push({
      id: c.id,
      kind: "review",
      title:
        c.decision === "Checked"
          ? `Revision ${label(c.revision_id)} checked`
          : `Preparation ${label(c.revision_id)} returned`,
      detail: c.reason,
      at: c.checked_at,
      actor: c.actor_name ?? null,
      changes: [],
    });
  for (const j of pack.jobs)
    events.push({
      id: j.id,
      kind: "issue",
      title: `Exact output requested for ${label(j.revision_id)}`,
      detail: `${j.state} · ${j.attempts} attempt${j.attempts === 1 ? "" : "s"}${j.error_code ? ` · ${j.error_code}` : ""}. A queued or generated output is not an issue.`,
      at: j.requested_at,
      actor: j.actor_name ?? null,
      changes: [],
    });
  for (const i of pack.issues)
    events.push({
      id: i.id,
      kind: "issue",
      title: `Issued ${revisionLabel(i.revision)}`,
      detail: i.manifest.filename,
      at: i.issued_at,
      actor: i.issued_by_name ?? null,
      changes: [],
      href: `/documents/${i.id}`,
    });
  // The issue row already records an Issued event.
  for (const e of pack.events.filter((x) => x.kind !== "Issued"))
    events.push({
      id: e.id,
      kind: e.kind === "ReviewRequired" ? "source" : "issue",
      title: eventTitles[e.kind] ?? e.kind,
      detail: e.reason,
      at: e.occurred_at,
      actor: e.actor_name ?? null,
      changes: [],
    });
  for (const d of pack.distribution)
    events.push({
      id: d.id,
      kind: "distribution",
      title: `${d.kind} · ${d.display_name}`,
      detail:
        "A distribution fact. It is not an acknowledgement and no message is sent.",
      at: d.occurred_at,
      actor: null,
      changes: [],
    });
  for (const r of pack.readiness.recipients.filter((x) => x.acknowledged_at))
    events.push({
      id: `ack-${r.id}`,
      kind: "review",
      title: `Acknowledged by ${r.display_name}`,
      detail: "Explicit acknowledgement of the exact current issue.",
      at: r.acknowledged_at!,
      actor: r.display_name,
      changes: [],
    });
  return events.sort(
    (a, b) =>
      new Date(b.at).getTime() - new Date(a.at).getTime() ||
      a.id.localeCompare(b.id),
  );
}
