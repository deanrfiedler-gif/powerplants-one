"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { JobPackEntry } from "../../../documents/components/client/job-pack-entry";
import { useSearchParams } from "next/navigation";
import { SchedulingNavigation } from "./workspace-navigation.client";
import { DemandPanel } from "./demand-panel.client";
import {
  BookingContinuation,
  showAppointmentDates,
} from "./booking-continuation.client";
import { BookingRecovery, useBookingCommand } from "./booking-recovery.client";
import {
  appointmentHref,
  plannerContext,
  plannerHref,
  safePlannerReturn,
} from "../../navigation";
import { useIdentity } from "../../../components/business-session";
import {
  ErrorNotice,
  Field,
  EnumField,
  SelectField,
  PageHeader,
  Status,
  Stamp,
  ReadState,
  useCommand,
  useResource,
  ValidationFields,
  type Envelope,
} from "../../../components/business-ui";
import { addDays, intervalsOverlap, localDateTime, utcFromLocal } from "../../time";
import type { CrewInput } from "../../validation";
export type Resource = {
  id: string;
  name: string;
  version: number;
  active: boolean;
  status: string;
  base_timezone: string;
  source_as_at: string;
  calendar: {
    id: string;
    name: string;
    version: number;
    timezone: string;
    intervals: { weekday: number; start_minute: number; end_minute: number }[];
  };
  skills: { skill_code: string; status: string; valid_to: string }[];
  blocks?: { id: string; start_at: string; end_at: string; kind: string }[];
  exceptions?: { id: string; start_at: string; end_at: string; kind: string }[];
  busy?: { start_at: string; end_at: string }[];
};
type Request = {
  id: string;
  version: number;
  status: string;
  source_type: string;
  source_reference: string;
  source_version: string;
  reason: string;
  proposed_start: string;
  proposed_end: string;
  crew: CrewInput;
  decision_reason: string | null;
  created_by: string;
  expected_schedule_version: number;
};
export type Appointment = {
  id: string;
  display_number: string;
  version: number;
  assignment_version: number;
  schedule_version: number;
  status: string;
  start_at: string;
  end_at: string;
  site_timezone: string;
  site_id: string;
  site_name: string;
  customer_name?: string;
  scope_revision_id: string;
  scope_version: number;
  scope_revision: number;
  scope_summary: string;
  scope_hash: string;
  scope_review_required: boolean;
  policy_version_id: string;
  policy: { id: string; version: number; name: string };
  primary_contact_id: string | null;
  work_order_id: string;
  work_order_display_number: string;
  work_order_version: number;
  customer_commitment: string;
  preparation_status: string;
  dispatch_hold: boolean;
  pack_requirement: string;
  cancellation_reason?: string;
  requested_window_start: string | null;
  requested_window_end: string | null;
  assignments: (CrewInput[number] & {
    id: string;
    active: boolean;
    assignment_version: number;
    name: string;
  })[];
  readiness: {
    criterion_code: string;
    label: string;
    outcome: string;
    reason: string;
    blocking_stage: string;
  }[];
  authorisation_blockers: { field: string; message: string }[];
  contacts: {
    id: string;
    outcome: string;
    channel: string;
    occurred_at: string;
    recipient_name: string;
    notes: string;
    schedule_version: number;
  }[];
  requests: Request[];
  followups: {
    activity_id: string;
    summary: string;
    status: string;
    due_needed: boolean;
    owner_id?: string;
    owner_name?: string;
    due_at: string | null;
  }[];
  proposal: {
    proposal_version: number;
    content_hash: string;
    snapshot: { start_at: string; end_at: string };
  };
  history: {
    version: number;
    content_hash: string;
    snapshot: {
      status: string;
      start_at: string;
      end_at: string;
      customer_commitment: string;
    };
  }[];
  actions: { can_manage: boolean; can_request: boolean; can_contact: boolean };
};
export type ScheduleAppointment = Omit<
  Appointment,
  | "readiness"
  | "authorisation_blockers"
  | "contacts"
  | "followups"
  | "proposal"
  | "history"
  | "requests"
> & {
  requests: Pick<Request, "id" | "status">[];
  projection: "ScheduleSummary";
};
type BookingBasis = Omit<ScheduleAppointment, "requests" | "projection">;
export type Schedule = Envelope<ScheduleAppointment> & {
  resources: Resource[];
  display_timezone: string;
  from: string;
  to: string;
};
export type Demand = {
  id: string;
  display_number: string;
  version: number;
  site_id: string;
  customer_name: string;
  site_name: string;
  site_timezone: string;
  authorised_scope_revision: number;
  authorised_scope_version: number;
  authorised_scope_summary: string;
  projection: "UnassignedDemand";
};
const dayFormatter = new Intl.DateTimeFormat("en-AU", {
  weekday: "short",
  day: "numeric",
  month: "short",
  timeZone: "UTC",
});
const displayDay = (day: string) =>
  dayFormatter.format(new Date(day + "T12:00:00Z"));
const minuteText = (n: number) =>
  `${String(Math.floor(n / 60)).padStart(2, "0")}:${String(n % 60).padStart(2, "0")}`;
const shortTime = (iso: string, zone: string) =>
  new Intl.DateTimeFormat("en-AU", {
    timeZone: zone,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(new Date(iso));
function VersionLine({ a }: { a: BookingBasis }) {
  return (
    <p className="read-meta">
      Appointment v{a.version} · Crew v{a.assignment_version} · Schedule v
      {a.schedule_version} · Work order v{a.work_order_version}
    </p>
  );
}
function bookingVersions(a: BookingBasis) {
  return {
    expected_version: a.version,
    expected_work_order_version: a.work_order_version,
    expected_assignment_version: a.assignment_version,
    scope_revision_id: a.scope_revision_id,
    scope_version: a.scope_version,
    policy_version_id: a.policy_version_id,
    scheduling_policy_id: a.policy.id,
    scheduling_policy_version: a.policy.version,
  };
}
function BookingForm({
  appointment,
  mode,
  onSaved,
  initialStart,
  initialCrew,
  onClose,
}: {
  appointment: BookingBasis;
  mode: "confirm" | "move" | "request";
  onSaved: () => void;
  initialStart?: string;
  initialCrew?: CrewInput;
  onClose?: () => void;
}) {
  const [basis, setBasis] = useState(appointment),
    [start, setStart] = useState(
      localDateTime(
        initialStart ?? appointment.start_at,
        appointment.site_timezone,
      ),
    ),
    [end, setEnd] = useState(
      localDateTime(
        initialStart
          ? new Date(
              Date.parse(initialStart) +
                Date.parse(appointment.end_at) -
                Date.parse(appointment.start_at),
            ).toISOString()
          : appointment.end_at,
        appointment.site_timezone,
      ),
    );
  const initial =
    initialCrew ?? appointment.assignments.filter((x) => x.active);
  const [crew, setCrew] = useState(
    initial.length
      ? initial.map((x) => ({
          resource_id: x.resource_id,
          crew_role: x.crew_role as string,
          before: String(x.travel_before_minutes),
          after: String(x.travel_after_minutes),
          travel_reason: x.travel_reason,
        }))
      : [
          {
            resource_id: "",
            crew_role: "Lead",
            before: "",
            after: "",
            travel_reason: "",
          },
        ],
  );
  const [reason, setReason] = useState(""),
    [source, setSource] = useState(
      appointment.actions.can_manage ? "Manual" : "TechnicianRequest",
    ),
    [reference, setReference] = useState(""),
    [sourceVersion, setSourceVersion] = useState(""),
    [localError, setLocalError] = useState<unknown>(null);
  const resources = useResource<Envelope<Resource>>(
      `selectors/resources?site_id=${appointment.site_id}`,
    ),
    memoryCommand = useCommand(),
    durableCommand = useBookingCommand(mode === "confirm"),
    savedRecord = useResource<Envelope<Appointment>>(
      `appointments/${appointment.id}`,
    );
  const command = mode === "confirm" ? durableCommand : memoryCommand;
  const target = appointmentHref(
    appointment.id,
    safePlannerReturn(useSearchParams().get("returnTo")),
  );
  const reviewed = savedRecord.data?.items[0];
  const latest =
    reviewed && reviewed.version >= appointment.version
      ? reviewed
      : appointment;
  const retryPending = !!(command.error as { retryable?: boolean } | null)
    ?.retryable;
  const title =
    mode === "confirm"
      ? "Confirm appointment"
      : mode === "move"
        ? "Move or reassign"
        : "Propose a schedule change";
  const patch = (i: number, field: string, value: string) =>
    setCrew(crew.map((x, n) => (n === i ? { ...x, [field]: value } : x)));
  async function save(e: React.FormEvent) {
    e.preventDefault();
    setLocalError(null);
    try {
      const members = crew.map((x) => {
        const r = resources.data?.items.find((r) => r.id === x.resource_id);
        if (!r) throw Error("Choose a permitted resource for every crew role.");
        if (x.before === "" || x.after === "")
          throw Error(
            "Enter each travel allowance explicitly, including zero when reviewed.",
          );
        return {
          resource_id: r.id,
          resource_version: r.version,
          calendar_version: r.calendar.version,
          crew_role: x.crew_role,
          travel_before_minutes: Number(x.before),
          travel_after_minutes: Number(x.after),
          travel_reason: x.travel_reason,
        };
      });
      const fields =
        mode === "request"
          ? {
              id: crypto.randomUUID(),
              expected_version: basis.version,
              source_type: source,
              source_reference: reference,
              source_version: sourceVersion,
              start_at: utcFromLocal(start, basis.site_timezone),
              end_at: utcFromLocal(end, basis.site_timezone),
              crew: members,
              reason,
            }
          : {
              ...bookingVersions(basis),
              crew: members,
              reason,
              ...(mode === "move"
                ? {
                    start_at: utcFromLocal(start, basis.site_timezone),
                    end_at: utcFromLocal(end, basis.site_timezone),
                  }
                : {}),
            };
      // The stable request UUID is held below for uncertain retries, like the original operation ID.
      if (mode === "request") fields.id = requestId.current;
      const receipt =
        mode === "confirm"
          ? await durableCommand.send(
              `appointments/${basis.id}/confirm`,
              fields,
              target,
              "Confirmation",
              basis.id,
            )
          : await memoryCommand.send(
              `appointments/${basis.id}/${mode === "request" ? "change-requests" : mode}`,
              fields,
            );
      if (receipt) onSaved();
    } catch (e) {
      setLocalError({
        message: e instanceof Error ? e.message : "Check the proposal.",
      });
    }
  }
  const requestId = useRef(crypto.randomUUID());
  return (
    <section className="planner-form" aria-label={title}>
      <h2>{title}</h2>
      <p>
        {mode === "request"
          ? "A pending request changes no booking or reservation."
          : "The server checks every crew member, travel allowance and work control before saving."}
      </p>
      <p>
        <strong>{basis.display_number}</strong> ·{" "}
        {basis.work_order_display_number}
      </p>
      <VersionLine a={basis} />
      <ReadState {...resources} retry={resources.reload} />
      {mode === "confirm" && <BookingRecovery command={durableCommand} />}
      <ErrorNotice
        error={localError ?? (mode === "confirm" ? null : command.error)}
      />
      {command.saved &&
        (mode !== "confirm" ||
          durableCommand.accepted?.entry.label === "Confirmation") && (
          <p role="status" className="save-notice">
            {mode === "request"
              ? "Change request saved. Existing booking retained."
              : "Appointment saved. Dispatch remains held."}
          </p>
        )}
      <button
        className="secondary"
        type="button"
        disabled={command.busy || savedRecord.loading}
        onClick={savedRecord.reload}
      >
        Review saved appointment
      </button>
      <ReadState {...savedRecord} retry={savedRecord.reload} />
      {(latest.version !== basis.version ||
        latest.work_order_version !== basis.work_order_version) && (
        <div className="planner-warning">
          <p>
            The saved appointment is now v{latest.version}. Your proposal still
            uses v{basis.version}.
          </p>
          <p>
            Saved interval:{" "}
            <Stamp value={latest.start_at} timezone={latest.site_timezone} /> –{" "}
            <Stamp value={latest.end_at} timezone={latest.site_timezone} />.
            Crew:{" "}
            {latest.assignments
              .filter((x) => x.active)
              .map((x) => x.name)
              .join(", ") || "None reserved"}
            .
          </p>
          {retryPending && (
            <p>
              Retry the unchanged pending action to recover its original receipt
              before using new versions.
            </p>
          )}
          <button
            className="secondary"
            type="button"
            disabled={
              retryPending ||
              (mode === "confirm" && !!durableCommand.pending) ||
              command.busy ||
              savedRecord.loading ||
              !!savedRecord.error
            }
            onClick={() => {
              setBasis(latest);
              command.clear();
            }}
          >
            Use reviewed current versions
          </button>
        </div>
      )}
      <ValidationFields error={localError ?? command.error}>
        <form onSubmit={save}>
          <fieldset
            disabled={
              command.busy ||
              resources.loading ||
              !!resources.error ||
              (mode === "confirm" &&
                (!!durableCommand.pending || !durableCommand.ready))
            }
          >
            <legend>Visit · {basis.site_timezone}</legend>
            {mode === "confirm" ? (
              <p>
                <Stamp value={basis.start_at} timezone={basis.site_timezone} />{" "}
                – <Stamp value={basis.end_at} timezone={basis.site_timezone} />
              </p>
            ) : (
              <div className="form-grid">
                <Field
                  name="planner-start"
                  label="Start (site time)"
                  type="datetime-local"
                  required
                  value={start}
                  onChange={setStart}
                />
                <Field
                  name="planner-end"
                  label="Finish (site time)"
                  type="datetime-local"
                  required
                  value={end}
                  onChange={setEnd}
                />
              </div>
            )}
            {basis.requested_window_start && (
              <p>
                Customer window:{" "}
                <Stamp
                  value={basis.requested_window_start}
                  timezone={basis.site_timezone}
                />{" "}
                –{" "}
                <Stamp
                  value={basis.requested_window_end}
                  timezone={basis.site_timezone}
                />
              </p>
            )}
            {crew.map((x, i) => (
              <fieldset className="crew-editor" key={i}>
                <legend>Crew member {i + 1}</legend>
                <div className="form-grid">
                  <SelectField
                    name={`resource-${i}`}
                    label={`Resource ${i + 1}`}
                    required
                    value={x.resource_id}
                    onChange={(v) => patch(i, "resource_id", v)}
                    options={(resources.data?.items ?? []).map((r) => ({
                      id: r.id,
                      display_name: r.name + (!r.active ? " · Inactive" : ""),
                    }))}
                  />
                  <EnumField
                    name={`role-${i}`}
                    label={`Crew role ${i + 1}`}
                    value={x.crew_role}
                    onChange={(v) => patch(i, "crew_role", v)}
                    values={["Lead", "Technician", "Specialist"]}
                  />
                  <Field
                    name={`before-${i}`}
                    label={`Travel before ${i + 1} (minutes)`}
                    type="number"
                    required
                    value={x.before}
                    onChange={(v) => patch(i, "before", v)}
                  />
                  <Field
                    name={`after-${i}`}
                    label={`Travel after ${i + 1} (minutes)`}
                    type="number"
                    required
                    value={x.after}
                    onChange={(v) => patch(i, "after", v)}
                  />
                </div>
                <Field
                  name={`travel-reason-${i}`}
                  label={`Travel basis ${i + 1}`}
                  required
                  value={x.travel_reason}
                  onChange={(v) => patch(i, "travel_reason", v)}
                  maxLength={1000}
                  hint="Record the reviewed allowance. Zero is an explicit choice; no route estimate is inferred."
                />
                {x.resource_id && (
                  <p className="read-meta">
                    {
                      resources.data?.items.find((r) => r.id === x.resource_id)
                        ?.calendar.name
                    }{" "}
                    · Resource v
                    {
                      resources.data?.items.find((r) => r.id === x.resource_id)
                        ?.version
                    }
                  </p>
                )}
                {crew.length > 1 && (
                  <button
                    type="button"
                    className="secondary"
                    onClick={() => setCrew(crew.filter((_, n) => n !== i))}
                  >
                    Remove crew member {i + 1}
                  </button>
                )}
              </fieldset>
            ))}
            {crew.length < 6 && (
              <button
                type="button"
                className="secondary"
                onClick={() =>
                  setCrew([
                    ...crew,
                    {
                      resource_id: "",
                      crew_role: "Technician",
                      before: "",
                      after: "",
                      travel_reason: "",
                    },
                  ])
                }
              >
                Add crew member
              </button>
            )}
            {mode === "request" && (
              <div className="form-grid">
                <EnumField
                  name="request-source"
                  label="Request source"
                  value={source}
                  onChange={setSource}
                  values={
                    basis.actions.can_manage
                      ? ["Manual", "ProjectReference", "TechnicianRequest"]
                      : ["TechnicianRequest"]
                  }
                />
                <Field
                  name="source-reference"
                  label="Source reference"
                  required
                  value={reference}
                  onChange={setReference}
                />
                <Field
                  name="source-version"
                  label="Source version"
                  required
                  value={sourceVersion}
                  onChange={setSourceVersion}
                />
              </div>
            )}
            <Field
              name="change-reason"
              label={mode === "confirm" ? "Booking reason" : "Change reason"}
              multiline
              required
              maxLength={1000}
              value={reason}
              onChange={setReason}
            />
            <p className="planner-warning">
              {mode === "move"
                ? "A saved date, time or crew change requires customer contact and pack review. Dispatch stays held."
                : "Booking does not mean attendance, dispatch or pack acknowledgement."}
            </p>
            <div className="button-row">
              <button type="submit">
                {command.busy
                  ? "Checking and saving…"
                  : mode === "confirm"
                    ? "Confirm booking"
                    : mode === "move"
                      ? "Save proposed move"
                      : "Save change request"}
              </button>
              {onClose && (
                <button type="button" className="secondary" onClick={onClose}>
                  Close proposal
                </button>
              )}
            </div>
          </fieldset>
        </form>
      </ValidationFields>
    </section>
  );
}
function ContactForm({ a, onSaved }: { a: Appointment; onSaved: () => void }) {
  const [outcome, setOutcome] = useState("Attempted"),
    [channel, setChannel] = useState("Simulated"),
    [notes, setNotes] = useState(""),
    command = useBookingCommand(),
    id = useRef(crypto.randomUUID()),
    occurred = useRef<string | null>(null);
  const target = appointmentHref(
    a.id,
    safePlannerReturn(useSearchParams().get("returnTo")),
  );
  async function save(e: React.FormEvent) {
    e.preventDefault();
    occurred.current ??= new Date().toISOString();
    const result = await command.send(
      `appointments/${a.id}/contacts`,
      {
        id: id.current,
        expected_version: a.version,
        recipient_id: a.primary_contact_id,
        channel,
        outcome,
        occurred_at: occurred.current,
        notes,
        reason:
          a.status === "Cancelled"
            ? "Record manual cancellation contact"
            : "Record manual scheduling contact",
      },
      target,
      "Customer contact",
      id.current,
    );
    if (result) {
      id.current = crypto.randomUUID();
      occurred.current = null;
      onSaved();
    }
  }
  return (
    <section className="planner-form" aria-label="Record customer contact">
      <h2>Record customer contact</h2>
      <p>
        Manual or simulated record only. “Confirmed” records agreement to{" "}
        {a.status === "Cancelled"
          ? "the cancellation"
          : "these exact visit dates"}
        ; it is separate from sending, delivery and pack acknowledgement.
      </p>
      <BookingRecovery command={command} />
      {command.saved &&
        command.accepted?.entry.label === "Customer contact" && (
          <p role="status" className="save-notice">
            Contact outcome saved.
          </p>
        )}
      <form onSubmit={save}>
        <fieldset
          disabled={
            command.busy ||
            !!command.pending ||
            !command.ready ||
            !a.primary_contact_id
          }
        >
          <legend>Current site contact</legend>
          <p>
            Contact ID:{" "}
            <span className="record-id">
              {a.primary_contact_id ??
                "No current site contact — resolve site context first."}
            </span>
          </p>
          <div className="form-grid">
            <EnumField
              name="contact-channel"
              label="Contact channel"
              value={channel}
              onChange={setChannel}
              values={["Simulated", "ManualPhone", "ManualEmail", "InPerson"]}
            />
            <EnumField
              name="contact-outcome"
              label="Contact outcome"
              value={outcome}
              onChange={setOutcome}
              values={["Attempted", "Confirmed", "NoResponse", "Failed"]}
            />
          </div>
          <Field
            name="contact-notes"
            label="Contact notes"
            multiline
            required
            maxLength={2000}
            value={notes}
            onChange={setNotes}
          />
          <button>
            {command.busy ? "Saving contact…" : "Save contact outcome"}
          </button>
        </fieldset>
      </form>
    </section>
  );
}
function CancelForm({ a, onSaved }: { a: Appointment; onSaved: () => void }) {
  const [reason, setReason] = useState(""),
    command = useCommand();
  return (
    <section className="planner-form" aria-label="Cancel appointment">
      <h2>Cancel appointment</h2>
      <p>
        Future reservations are released together. Proposal, booking evidence
        and receipts remain. Actual work prevents cancellation.
      </p>
      <ErrorNotice error={command.error} />
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          if (
            await command.send(`appointments/${a.id}/cancel`, {
              expected_version: a.version,
              expected_work_order_version: a.work_order_version,
              expected_assignment_version: a.assignment_version,
              reason,
            })
          )
            onSaved();
        }}
      >
        <fieldset disabled={command.busy}>
          <legend>Cancellation reason</legend>
          <Field
            name="cancel-reason"
            label="Cancellation reason"
            multiline
            required
            value={reason}
            onChange={setReason}
            maxLength={1000}
          />
          <button className="danger">
            {command.busy
              ? "Checking cancellation…"
              : "Cancel future appointment"}
          </button>
        </fieldset>
      </form>
    </section>
  );
}
export function RequestDecision({
  a,
  request,
  onSaved,
}: {
  a: Appointment;
  request: Request;
  onSaved: () => void;
}) {
  const p = useIdentity(),
    [reason, setReason] = useState(""),
    command = useCommand();
  const resources = useResource<Envelope<Resource>>(`selectors/resources?site_id=${a.site_id}`);
  const resourceName = (id: string) => resources.data?.items.find(r => r.id === id)?.name ?? "Resource identity unavailable";
  async function decide(action: string) {
    const body =
      action === "accept"
        ? {
            ...bookingVersions(a),
            expected_request_version: request.version,
            reason,
          }
        : {
            expected_version: a.version,
            expected_request_version: request.version,
            reason,
          };
    if (
      await command.send(
        `schedule-change-requests/${request.id}/${action}`,
        body,
      )
    )
      onSaved();
  }
  return (
    <article className="change-request">
      <div className="planner-card-head">
        <strong>
          {request.source_type} · {request.source_reference}
        </strong>
        <Status value={request.status} />
      </div>
      <p>{request.reason}</p>
      <div className="scheduling-comparison" aria-label="Current versus proposed booking">
        <section><h3>Current booking</h3><p><Stamp value={a.start_at} timezone={a.site_timezone}/> – <Stamp value={a.end_at} timezone={a.site_timezone}/></p>
          {a.assignments.filter(x=>x.active && x.assignment_version===a.assignment_version).map(x=><p key={x.id}>{x.name} · {x.crew_role} · Travel before {x.travel_before_minutes} min / after {x.travel_after_minutes} min. Basis: {x.travel_reason}</p>)}
          <p>Customer: {a.customer_commitment} · Dispatch {a.dispatch_hold ? "held" : "not held"} · Pack: {a.pack_requirement}</p>
        </section>
        <section><h3>Requested booking</h3><p><Stamp value={request.proposed_start} timezone={a.site_timezone}/> – <Stamp value={request.proposed_end} timezone={a.site_timezone}/></p>
          {request.crew.map(x=><p key={x.resource_id}>{resourceName(x.resource_id)} · {x.crew_role} · Travel before {x.travel_before_minutes} min / after {x.travel_after_minutes} min. Basis: {x.travel_reason}</p>)}
          <p>Site timezone: {a.site_timezone}. Acceptance rechecks the whole crew, calendars, skills and reservations. Changed booking facts require fresh customer contact and preparation review.</p>
        </section>
      </div>
      <p>Requested against schedule v{request.expected_schedule_version}; current v{a.schedule_version}. {request.expected_schedule_version !== a.schedule_version && "Stale request ? review current booking before deciding."}</p>
      <p>
        <Stamp value={request.proposed_start} timezone={a.site_timezone} /> –{" "}
        <Stamp value={request.proposed_end} timezone={a.site_timezone} /> ·{" "}
        {a.site_timezone}
      </p>
      <p>
        {request.crew.length} crew members · Source v{request.source_version} ·
        Request v{request.version}
      </p>
      <small className="record-id">Request {request.id}</small>
      {request.decision_reason && <p>Decision: {request.decision_reason}</p>}
      {request.status === "Pending" &&
        (a.actions.can_manage || request.created_by === p.actor_id) && (
          <>
            <ErrorNotice error={command.error} />
            <Field
              name={`decision-${request.id}`}
              label="Decision reason"
              value={reason}
              onChange={setReason}
              maxLength={1000}
            />
            <div className="button-row">
              {a.actions.can_manage && (
                <>
                  <button
                    disabled={command.busy || !reason.trim()}
                    onClick={() => void decide("accept")}
                  >
                    Accept and check move
                  </button>
                  <button
                    className="secondary"
                    disabled={command.busy || !reason.trim()}
                    onClick={() => void decide("reject")}
                  >
                    Reject request
                  </button>
                </>
              )}
              <button
                className="secondary"
                disabled={command.busy || !reason.trim()}
                onClick={() => void decide("cancel")}
              >
                Cancel request
              </button>
            </div>
          </>
        )}
    </article>
  );
}
export function AppointmentScreen({ id }: { id: string }) {
  useIdentity();
  const search = useSearchParams();
  const returnTo = safePlannerReturn(search.get("returnTo"));
  const target = appointmentHref(id, returnTo);
  const recovery = useBookingCommand();
  const resource = useResource<Envelope<Appointment>>(`appointments/${id}`),
    a = resource.data?.items[0],
    [mode, setMode] = useState<
      "confirm" | "move" | "request" | "contact" | "cancel" | null
    >(null);
  const reload = useRef(resource.reload);
  useEffect(() => {
    reload.current = resource.reload;
  }, [resource.reload]);
  const acceptedOperation = recovery.accepted?.receipt.operation_id;
  useEffect(() => {
    if (acceptedOperation) reload.current();
  }, [acceptedOperation]);
  return (
    <>
      <PageHeader
        eyebrow="Service Operations · SC-08"
        title="Appointment"
        description="Attendance, work authority and customer commitment remain distinct."
        action={
          <Link className="button secondary" href={returnTo}>
            {returnTo.startsWith("/schedule/") ? "Back to scheduling review" : "Back to planner"}
          </Link>
        }
      />
      <BookingRecovery command={recovery} />
      <ReadState {...resource} retry={resource.reload} />
      {a && (
        <>
          <section className="planner-summary">
            <div>
              <p className="eyebrow">{a.site_name}</p>
              <h2>{a.display_number}</h2>
              <p>{a.scope_summary}</p>
              <p>
                Work order{" "}
                <Link href={`/service/work-orders/${a.work_order_id}`}>
                  {a.work_order_display_number}
                </Link>{" "}
                · Scope r{String(a.scope_revision).padStart(2, "0")}
              </p>
              <VersionLine a={a} />
            </div>
            <div>
              <Status value={a.status} />
              <p>
                <Stamp value={a.start_at} timezone={a.site_timezone} /> –{" "}
                <Stamp value={a.end_at} timezone={a.site_timezone} />
              </p>
              <strong>{a.site_timezone}</strong>
              <p>
                Customer commitment: <Status value={a.customer_commitment} />
              </p>
            </div>
          </section>
          {!!resource.error && (
            <p className="planner-warning">
              Showing the last successful read. Current availability is unknown.
            </p>
          )}
          <p>
            <Link href={showAppointmentDates(a, returnTo)}>
              Show its dates / View in planner
            </Link>
          </p>
          <div className="planner-holds">
            <strong>
              {a.dispatch_hold
                ? "Dispatch held"
                : "Crew responses recorded — check current pack readiness"}
            </strong>
            <span>
              {a.pack_requirement === "ReviewRequired"
                ? "Pack review required"
                : a.pack_requirement === "CancellationReviewRequired"
                  ? "Cancellation consequences require review"
                  : a.pack_requirement === "AwaitingAcknowledgement"
                    ? "Awaiting individual crew acknowledgement"
                    : a.pack_requirement === "Acknowledged"
                      ? "Acknowledgements recorded against the issued pack"
                      : "Pack preparation required"}{" "}
              · Open the job pack to check current applicability and controls.
            </span>
          </div>
          {a.scope_review_required && (
            <p role="status" className="planner-warning">
              Scope review required. A successor draft grants no extra work
              authority.
            </p>
          )}
          {a.cancellation_reason && (
            <p className="planner-warning">
              Cancellation reason: {a.cancellation_reason}
            </p>
          )}
          <div className="button-row planner-actions">
            {a.actions.can_manage && a.status !== "Cancelled" && (
              <>
                <button
                  disabled={resource.loading || !!resource.error}
                  onClick={() =>
                    setMode(a.status === "Proposed" ? "confirm" : "move")
                  }
                >
                  {a.status === "Proposed"
                    ? "Confirm appointment"
                    : "Move or reassign"}
                </button>
                <button
                  disabled={resource.loading || !!resource.error}
                  className="secondary"
                  onClick={() => setMode("cancel")}
                >
                  Cancel appointment
                </button>
              </>
            )}
            {a.actions.can_request && a.status === "Confirmed" && (
              <button
                disabled={resource.loading || !!resource.error}
                className="secondary"
                onClick={() => setMode("request")}
              >
                Propose change
              </button>
            )}
            {a.actions.can_contact && (
              <button
                disabled={resource.loading || !!resource.error}
                className="secondary"
                onClick={() => setMode("contact")}
              >
                Record contact
              </button>
            )}
            <button
              disabled={resource.loading || !!resource.error}
              className="secondary"
              onClick={resource.reload}
            >
              Refresh saved appointment
            </button>
          </div>
          {(mode === "confirm" || mode === "move" || mode === "request") && (
            <BookingForm
              key={`${id}:${mode}`}
              appointment={a}
              mode={mode}
              onSaved={resource.reload}
              onClose={() => setMode(null)}
            />
          )}
          {mode === "contact" && (
            <ContactForm
              key={`${a.id}:${a.version}`}
              a={a}
              onSaved={resource.reload}
            />
          )}
          {mode === "cancel" && a.status !== "Cancelled" && (
            <CancelForm a={a} onSaved={resource.reload} />
          )}
          <div className="planner-detail-grid">
            <section className="panel">
              <h2>Current crew</h2>
              {a.assignments.filter((x) => x.active).length ? (
                a.assignments
                  .filter((x) => x.active)
                  .map((x) => (
                    <article className="crew-summary" key={x.id}>
                      <strong>{x.name}</strong>
                      <p>
                        {x.crew_role} · {x.travel_before_minutes} min before /{" "}
                        {x.travel_after_minutes} min after
                      </p>
                      <small>{x.travel_reason}</small>
                    </article>
                  ))
              ) : (
                <p>
                  No resources reserved. Proposed attendance does not reserve a
                  crew.
                </p>
              )}
            </section>
            <section className="panel">
              <h2>Readiness and preparation</h2>
              <p>
                Preparation: <Status value={a.preparation_status} />
              </p>
              <p>
                <Link
                  href={`/service/work-orders/${a.work_order_id}?returnTo=${encodeURIComponent(target)}#visit-${a.id}`}
                >
                  Review readiness on the work order
                </Link>
              </p>
              {["Unknown", "Blocked"].includes(a.preparation_status) && (
                <p className="planner-warning">
                  Readiness assessment does not change this preparation state.
                  Review with the service owner; use controlled cancellation and
                  a new proposal where permitted. Preparation cannot be
                  corrected in place by this screen.
                </p>
              )}
              {a.authorisation_blockers.map((b, i) => (
                <p className="planner-warning" key={i}>
                  {b.message}
                </p>
              ))}
              {a.readiness
                .filter((x) => x.criterion_code !== "CrewCompetency")
                .map((x) => (
                  <p key={x.criterion_code}>
                    <strong>{x.label}:</strong> {x.outcome}
                    <small>{x.reason}</small>
                  </p>
                ))}
              <p>
                <strong>Crew competency:</strong>{" "}
                {a.status === "Confirmed"
                  ? "Checked against the saved booking evidence."
                  : "Rechecked for the complete crew during confirmation."}
              </p>
              <p className="read-meta">
                {a.policy.name} · v{a.policy.version}
              </p>
            </section>
          </div>
          <section className="panel">
            <h2>Owned follow-up</h2>
            {a.followups.length ? (
              a.followups.map((f) => (
                <article className="followup-row" key={f.activity_id}>
                  <Link href={`/work/${f.activity_id}`}>{f.summary}</Link>
                  <Status value={f.status} />
                  <span>
                    {f.due_needed ? (
                      "Due date needed"
                    ) : (
                      <Stamp value={f.due_at} />
                    )}
                  </span>
                </article>
              ))
            ) : (
              <p>No follow-up visible in your permitted scope.</p>
            )}
          </section>
          <section className="panel">
            <h2>Schedule change requests</h2>
            {a.requests.length ? (
              a.requests.map((r) => (
                <RequestDecision
                  key={r.id}
                  a={a}
                  request={r}
                  onSaved={resource.reload}
                />
              ))
            ) : (
              <p>
                No change requests. Pending requests never reserve capacity.
              </p>
            )}
          </section>
          <section className="panel">
            <h2>Contact history</h2>
            {a.contacts.length ? (
              a.contacts.map((c) => (
                <article className="contact-entry" key={c.id}>
                  <Status value={c.outcome} />
                  <p>
                    {c.recipient_name} · {c.channel} · Schedule v
                    {c.schedule_version}
                  </p>
                  <p>{c.notes}</p>
                  <small>
                    <Stamp value={c.occurred_at} timezone={a.site_timezone} />
                  </small>
                </article>
              ))
            ) : (
              <p>No recorded customer contact. No date agreement is assumed.</p>
            )}
          </section>
          <details className="panel">
            <summary>Original proposal and version history</summary>
            <p>
              Original dates:{" "}
              <Stamp
                value={a.proposal.snapshot.start_at}
                timezone={a.site_timezone}
              />{" "}
              –{" "}
              <Stamp
                value={a.proposal.snapshot.end_at}
                timezone={a.site_timezone}
              />
            </p>
            <p className="record-id">
              Proposal SHA-256: {a.proposal.content_hash}
            </p>
            {a.history.map((h) => (
              <p key={h.version}>
                v{h.version} · {h.snapshot.status} ·{" "}
                <Stamp value={h.snapshot.start_at} timezone={a.site_timezone} />{" "}
                · Commitment {h.snapshot.customer_commitment}
              </p>
            ))}
          </details>
          <section className="panel" aria-label="Job pack handover">
            <h2>Job pack</h2>
            <JobPackEntry appointmentId={a.id} />
          </section>
          <details className="panel">
            <summary>Exact record identities and observed context</summary>
            <p className="record-id">Appointment: {a.id}</p>
            <p className="record-id">Work order: {a.work_order_id}</p>
            <p className="record-id">
              Scope: {a.scope_revision_id} · Content v{a.scope_version}
            </p>
            <p className="record-id">Scope SHA-256: {a.scope_hash}</p>
          </details>
          <p className="read-meta">
            Permitted records · Observed{" "}
            <Stamp
              value={resource.data!.observed_at}
              timezone={a.site_timezone}
            />{" "}
            · {a.site_timezone}
          </p>
        </>
      )}
    </>
  );
}
export function AppointmentCard({
  a,
  zone,
  drag,
  onMove,
}: {
  a: ScheduleAppointment;
  zone: string;
  drag?: (event: React.DragEvent) => void;
  onMove?: (a: ScheduleAppointment) => void;
}) {
  return (
    <article
      className={`appointment-card ${a.status.toLowerCase()}`}
      draggable={!!drag}
      onDragStart={drag}
      aria-label={`${a.display_number} ${a.status}`}
    >
      <div className="planner-card-head">
        <strong>
          {shortTime(a.start_at, zone)}–{shortTime(a.end_at, zone)}
        </strong>
        <Status value={a.status} />
      </div>
      <Link href={`/service/appointments/${a.id}`}>{a.display_number}</Link>
      <p>{a.site_name}</p>
      <p className="card-scope">{a.scope_summary}</p>
      <small>
        {a.work_order_display_number} · Scope r
        {String(a.scope_revision).padStart(2, "0")}
      </small>
      <small>
        {a.assignments
          .filter((x) => x.active)
          .map((x) => `${x.name} (${x.crew_role})`)
          .join(" · ") || "No crew reserved"}
      </small>
      <p className="card-hold">
        {a.scope_review_required ? "Scope review required · " : ""}Dispatch held
        · Customer {a.customer_commitment}
      </p>
      <small>
        Appointment v{a.version} · {a.site_timezone}
      </small>
      {onMove && a.actions.can_manage && a.status === "Confirmed" && (
        <button className="secondary compact" onClick={() => onMove(a)}>
          Move or reassign
        </button>
      )}
    </article>
  );
}
export function PlannerBoard({
  data,
  days,
  mode,
  zone,
  usable,
  onDrop,
  onMove,
  onDragNotice,
}: {
  data: Schedule;
  days: string[];
  mode: "day" | "week";
  zone: string;
  usable: boolean;
  onDrop: (event: React.DragEvent, day: string, resource: Resource) => void;
  onMove: (appointment: ScheduleAppointment) => void;
  onDragNotice: (message: string) => void;
}) {
  // Calculate each timestamp's displayed day once for this render instead of
  // once per appointment × resource × day. This map ends with the render.
  const displayDates = new Map<string, string>();
  const onDay = (iso: string, d: string) => {
    let value = displayDates.get(iso);
    if (value === undefined) {
      value = localDateTime(iso, zone).slice(0, 10);
      displayDates.set(iso, value);
    }
    return value === d;
  };
  const dayBounds = new Map(
    days.map((d) => [
      d,
      {
        start: Date.parse(utcFromLocal(d + "T00:00", zone)),
        end: Date.parse(utcFromLocal(addDays(d, 1) + "T00:00", zone)),
      },
    ]),
  );
  return (
    <section
      className={`planner-board ${mode}`}
      aria-label={`${mode === "week" ? "Week" : "Day"} resource planner`}
    >
      {!data.resources.length && (
        <p className="empty-state">
          No permitted resources in this filter. Availability is not assumed.
        </p>
      )}
      {data.resources.map((r) => (
        <section
          className="resource-lane"
          key={r.id}
          aria-label={`${r.name} resource lane`}
        >
          <header>
            <h2><Link href={`/service/technicians/${r.id}`}>{r.name}</Link></h2>
            <span>
              {r.active ? "Published resource" : "Inactive · cannot book"}
            </span>
            <small>
              {r.calendar.name} · {r.calendar.timezone}
            </small>
            <small>
              Resource v{r.version} · Calendar v{r.calendar.version}
            </small>
            <details>
              <summary>Calendar, skills and evidence</summary>
              {r.calendar.intervals.map((i) => (
                <p key={`${i.weekday}-${i.start_minute}`}>
                  {
                    [
                      "Sunday",
                      "Monday",
                      "Tuesday",
                      "Wednesday",
                      "Thursday",
                      "Friday",
                      "Saturday",
                    ][i.weekday]
                  }{" "}
                  {minuteText(i.start_minute)}–{minuteText(i.end_minute)} ·{" "}
                  {r.calendar.timezone}
                </p>
              ))}
              {r.skills.map((s) => (
                <p key={s.skill_code}>
                  {s.skill_code} · {s.status} through{" "}
                  <Stamp value={s.valid_to} timezone={r.base_timezone} />
                </p>
              ))}
              <small>
                Source as at{" "}
                <Stamp value={r.source_as_at} timezone={r.base_timezone} />
              </small>
            </details>
          </header>
          <div
            className="lane-days"
            tabIndex={mode === "week" ? 0 : undefined}
            role="region"
            aria-label={`${r.name} days`}
            style={{ "--planner-days": days.length } as React.CSSProperties}
          >
            {days.map((d) => {
              const weekday = new Date(d + "T12:00:00Z").getUTCDay(),
                slots = r.calendar.intervals.filter(
                  (i) => i.weekday === weekday,
                ),
                events = data.items.filter(
                  (a) =>
                    onDay(a.start_at, d) &&
                    a.assignments.some(
                      (x) => x.resource_id === r.id && x.active,
                    ),
                ),
                blocks = (r.blocks ?? []).filter(
                  (b) =>
                    Date.parse(b.start_at) < dayBounds.get(d)!.end &&
                    Date.parse(b.end_at) > dayBounds.get(d)!.start,
                ),
                busy = (r.busy ?? []).filter(
                  (b) =>
                    Date.parse(b.start_at) < dayBounds.get(d)!.end &&
                    Date.parse(b.end_at) > dayBounds.get(d)!.start,
                ),
                closed = (r.exceptions ?? []).filter((b) =>
                  intervalsOverlap(b.start_at, b.end_at,
                    new Date(dayBounds.get(d)!.start).toISOString(),
                    new Date(dayBounds.get(d)!.end).toISOString()),
                );
              return (
                <div
                  key={d}
                  className="planner-day-cell"
                  data-day={d}
                  onDragOver={(e) => {
                    if (usable) e.preventDefault();
                  }}
                  onDrop={(e) => onDrop(e, d, r)}
                  aria-label={`${r.name} ${displayDay(d)}`}
                >
                  <h3>{displayDay(d)}</h3>
                  <p className="calendar-slot">
                    {zone !== r.calendar.timezone
                      ? "Working hours: see resource calendar"
                      : slots.length
                        ? slots
                            .map(
                              (i) =>
                                `${minuteText(i.start_minute)}–${minuteText(i.end_minute)}`,
                            )
                            .join(", ")
                        : "Non-working day"}
                    <br />
                    {r.calendar.timezone}
                  </p>
                  {blocks.map((b) => (
                    <p className="availability-block" key={b.id}>
                      <strong>{b.kind}</strong>
                      <br />
                      {shortTime(b.start_at, zone)}–{shortTime(b.end_at, zone)}
                    </p>
                  ))}
                  {closed.map((b) => (
                    <p className="availability-block" key={b.id}>
                      Calendar closed
                    </p>
                  ))}
                  {busy.length > 0 && (
                    <details className="reserved-periods">
                      <summary>
                        {busy.length} reserved{" "}
                        {busy.length === 1 ? "period" : "periods"} · includes
                        travel
                      </summary>
                      <p>
                        Capacity remains reserved across appointment filters.
                      </p>
                      {busy.map((b) => (
                        <p key={b.start_at}>
                          <Stamp value={b.start_at} timezone={zone} /> –{" "}
                          <Stamp value={b.end_at} timezone={zone} />
                        </p>
                      ))}
                    </details>
                  )}
                  {events.map((a) => (
                    <AppointmentCard
                      key={a.id}
                      a={a}
                      zone={zone}
                      drag={
                        usable &&
                        a.actions.can_manage &&
                        a.status === "Confirmed"
                          ? (e) => {
                              e.dataTransfer.setData("text/plain", a.id);
                              onDragNotice(
                                "Dragging proposes a move. The original booking remains saved.",
                              );
                            }
                          : undefined
                      }
                      onMove={usable ? onMove : undefined}
                    />
                  ))}
                  {!events.length && !blocks.length && !closed.length && (
                    <p className="lane-empty">
                      No displayed booking
                      <br />
                      <small>Server checks all reservations</small>
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      ))}
    </section>
  );
}

export function PlannerScreen() {
  useIdentity();
  const search = useSearchParams();
  const context = plannerContext(new URLSearchParams(search.toString()));
  const { day, mode, zone, site, resource: resourceFilter, status } = context;
  const returnTo = plannerHref(context);
  const update = (patch: Partial<typeof context>) =>
    window.history.replaceState(
      null,
      "",
      plannerHref({ ...context, ...patch }) +
        (search.get("returnTo")
          ? "&returnTo=" +
            encodeURIComponent(safePlannerReturn(search.get("returnTo")))
          : ""),
    );
  const setDay = (day: string) => update({ day }),
    setMode = (mode: "day" | "week") => update({ mode });
  const setZone = (zone: string) => update({ zone }),
    setSite = (site: string) => update({ site, resource: "" });
  const setResourceFilter = (resource: string) => update({ resource }),
    setStatus = (status: string) => update({ status });
  const [planId, setPlanId] = useState<string | null>(null);
  const [demandLimit, setDemandLimit] = useState(50);
  const [move, setMove] = useState<{
      a: ScheduleAppointment;
      start?: string;
      crew?: CrewInput;
    } | null>(null),
    [dragNotice, setDragNotice] = useState("");
  const days = Array.from({ length: mode === "week" ? 7 : 1 }, (_, i) =>
      addDays(day, i),
    ),
    from = utcFromLocal(day + "T00:00", zone),
    to = utcFromLocal(addDays(day, days.length) + "T00:00", zone);
  const query = new URLSearchParams({
    from,
    to,
    timezone: zone,
    ...(site ? { site_id: site } : {}),
    ...(resourceFilter ? { resource_id: resourceFilter } : {}),
    ...(status ? { status } : {}),
  });
  const result = useResource<Schedule>("schedule?" + query.toString()),
    sites =
      useResource<Envelope<{ id: string; display_name: string }>>(
        "sites?limit=50",
      );
  // Demand is authorised work with no appointment, so it is not bounded by the
  // displayed period. It reads separately from the schedule: a failed schedule
  // read must never render as "no unassigned demand".
  const demand = useResource<Envelope<Demand> & { limit: number }>(
    `schedule/demand?limit=${demandLimit}` + (site ? "&site_id=" + site : ""),
  );
  const data = result.data,
    usable = !!data && !result.error && !result.loading;
  const modal = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    if (move) {
      modal.current?.showModal();
    } else modal.current?.close();
  }, [move]);
  function close() {
    setMove(null);
    setDragNotice("");
  }
  function drop(e: React.DragEvent, d: string, resource: Resource) {
    e.preventDefault();
    if (!usable) return;
    const id = e.dataTransfer.getData("text/plain"),
      a = data?.items.find((x) => x.id === id);
    if (!a || a.status !== "Confirmed" || !a.actions.can_manage) return;
    try {
      const start = utcFromLocal(
        d + localDateTime(a.start_at, zone).slice(10),
        zone,
      );
      const old = a.assignments.filter((x) => x.active),
        crew = old.map((x) => ({
          resource_id: x.resource_id,
          resource_version: x.resource_version,
          calendar_version: x.calendar_version,
          crew_role: x.crew_role,
          travel_before_minutes: x.travel_before_minutes,
          travel_after_minutes: x.travel_after_minutes,
          travel_reason: x.travel_reason,
        }));
      // A drop changes the date. Crew is reviewed explicitly in the equivalent form, never guessed from a lane.
      setMove({ a, start, crew });
      setDragNotice(
        `Move proposed for ${displayDay(d)}. ${resource.name} lane is a review target; confirm the complete crew in the form. Original booking retained until saved.`,
      );
    } catch {
      setDragNotice(
        "This local time is ambiguous or unavailable. Use Move or reassign to choose a valid site time.",
      );
    }
  }
  return (
    <>
      {/* The shell banner and the module tab strip both already name this
          page, so the heading block is redundant on screen. It stays in the
          document for assistive technology and heading order. */}
      <h1 className="sr-only">Service planner</h1>
      <SchedulingNavigation />
      <BookingContinuation />
      {search.get("returnTo") && (
        <p>
          <Link href={safePlannerReturn(search.get("returnTo"))}>
            Return to previous planner context
          </Link>
        </p>
      )}
      <section className="planner-toolbar" aria-label="Planner controls">
        <div className="planner-date">
          <button
            className="secondary"
            aria-label="Previous period"
            onClick={() => setDay(addDays(day, -days.length))}
          >
            ←
          </button>
          <Field
            name="planner-date"
            label="Starting date"
            type="date"
            value={day}
            onChange={(v) => {
              if (v) setDay(v);
            }}
          />
          <button
            className="secondary"
            aria-label="Next period"
            onClick={() => setDay(addDays(day, days.length))}
          >
            →
          </button>
        </div>
        {/* aria-pressed drives the selected thumb, so the class no longer
            has to carry the state as well. */}
        <div className="view-switch" aria-label="Planner view">
          <button aria-pressed={mode === "day"} onClick={() => setMode("day")}>
            Day
          </button>
          <button
            aria-pressed={mode === "week"}
            onClick={() => setMode("week")}
          >
            Week
          </button>
        </div>
        <EnumField
          name="display-timezone"
          label="Display timezone"
          value={zone}
          onChange={setZone}
          values={["Australia/Brisbane", "Australia/Melbourne", "UTC"]}
        />
        {/* The removed heading block carried the only route to work orders,
            so it moves into the control bar with the other page actions. */}
        <div className="planner-toolbar-actions">
          <button className="secondary" onClick={result.reload}>
            Refresh planner
          </button>
          <Link className="button secondary" href="/service/work-orders">
            Work orders
          </Link>
        </div>
      </section>
      <div className="planner-filters">
        <SelectField
          name="site-filter"
          label="Site"
          value={site}
          onChange={(v) => {
            setSite(v);
          }}
          empty="All permitted sites"
          options={sites.data?.items ?? []}
        />
        <SelectField
          name="resource-filter"
          label="Resource"
          value={resourceFilter}
          onChange={setResourceFilter}
          empty="All permitted resources"
          options={(data?.resources ?? []).map((r) => ({
            id: r.id,
            display_name: r.name,
          }))}
        />
        <SelectField
          name="status-filter"
          label="Appointment state"
          value={status}
          onChange={setStatus}
          empty="All states"
          options={["Proposed", "Confirmed", "Cancelled"].map((id) => ({
            id,
            display_name: id,
          }))}
        />
      </div>
      <ReadState {...result} retry={result.reload} />
      {!!sites.error && (
        <p className="planner-warning">Site choices could not be refreshed.</p>
      )}
      {result.error && (
        <p className="planner-warning">
          Availability is unknown. A failed read does not mean resources are
          free. Refresh before proposing a move.
        </p>
      )}
      {data && (
        <>
          <div className="planner-stat-row">
            <div>
              <strong>
                {usable
                  ? data.items.filter((a) => a.status === "Confirmed").length
                  : "—"}
              </strong>
              <span>Confirmed visits</span>
            </div>
            <div>
              <strong>
                {usable
                  ? data.items.filter((a) => a.status === "Proposed").length
                  : "—"}
              </strong>
              <span>Proposed · no reservation</span>
            </div>
            <div>
              <strong>
                {usable
                  ? data.items.filter((a) =>
                      a.requests.some((r) => r.status === "Pending"),
                    ).length
                  : "—"}
              </strong>
              <span>Visits with pending requests</span>
            </div>
            <div>
              <strong>{usable ? data.resources.length : "—"}</strong>
              <span>Permitted resource lanes</span>
            </div>
          </div>
          <p className="read-meta">
            {displayDay(day)} – {displayDay(addDays(day, days.length - 1))} ·
            Display {zone} · Observed{" "}
            <Stamp value={data.observed_at} timezone={zone} /> ·{" "}
            {usable
              ? "Complete permitted result within this date/site/resource filter"
              : "Last successful read · current counts unavailable"}
          </p>
          <p className="planner-legend">
            <span>Confirmed = reserved crew</span>
            <span>Proposed = no capacity reserved</span>
            <span>Dispatch remains held</span>
          </p>
          {mode === "week" && (
            <p className="planner-scroll-hint">
              Scroll within each resource lane to compare days. Keyboard: focus
              the days and use arrow keys, or choose Day.
            </p>
          )}
          <PlannerBoard
            data={data}
            days={days}
            mode={mode}
            zone={zone}
            usable={usable}
            onDrop={drop}
            onMove={(a) => setMove({ a })}
            onDragNotice={setDragNotice}
          />
          <section className="panel proposal-section">
            <h2>Proposed and cancelled appointments</h2>
            <p>
              Proposals retain exact work authority and reserve no resource.
              Open an appointment to review readiness, contact and crew.
            </p>
            <div className="proposal-grid">
              {data.items
                .filter((a) => a.status !== "Confirmed")
                .map((a) => (
                  <AppointmentCard key={a.id} a={a} zone={zone} />
                ))}
            </div>
            {!data.items.some((a) => a.status !== "Confirmed") && (
              <p className="empty-state">
                No proposed or cancelled appointments in this filtered period.
              </p>
            )}
          </section>
          {!data.items.length && (
            <p className="empty-state">
              No permitted appointments in this period. Resource evidence still
              applies.
            </p>
          )}
        </>
      )}
      <section className="panel proposal-section">
        <h2 id="unassigned-demand-heading" tabIndex={-1}>
          Unassigned demand
        </h2>
        <p>
          Authorised work without a non-cancelled appointment. Work whose only
          visits were cancelled can appear again. Draft work is excluded. Demand
          is independent of calendar dates, resource and status filters; the
          selected site and your permitted scope apply.
        </p>
        {demand.loading && <p role="status">Loading permitted records…</p>}
        {/* Demand is a secondary read on this page, so it reports its own
            failure in place — the same treatment the site selector above
            gets — instead of raising a second page-level alert. When one
            identity is refused both reads fail for the same reason, and two
            identical permission banners carrying two different support
            references tell the reader nothing the first did not. */}
        {!!demand.error && (
          <>
            <p className="planner-warning" role="status">
              Unassigned demand is unknown. A failed read does not mean every
              authorised work order is scheduled.
            </p>
            <button className="secondary compact" onClick={demand.reload}>
              Retry loading demand
            </button>
          </>
        )}
        {demand.data && !demand.error && (
          <>
            <div className="proposal-grid">
              {demand.data.items.map((w) => (
                <article
                  className="appointment-card proposed"
                  key={w.id}
                  aria-label={`${w.display_number} unassigned`}
                >
                  <Link href={`/service/work-orders/${w.id}`}>
                    {w.display_number}
                  </Link>
                  <p>{w.site_name}</p>
                  <p className="card-scope">{w.authorised_scope_summary}</p>
                  <small>
                    {w.customer_name} · Authorised scope r
                    {String(w.authorised_scope_revision).padStart(2, "0")}
                  </small>
                  <p className="card-hold">Needs a visit proposal</p>
                  <small>
                    Work order v{w.version} · {w.site_timezone}
                  </small>
                  <button
                    className="pl01-primary"
                    disabled={demand.loading}
                    onClick={() => setPlanId(w.id)}
                  >
                    Plan visit
                  </button>
                </article>
              ))}
            </div>
            {!demand.data.items.length && (
              <p className="empty-state">
                No eligible unassigned work in the permitted result.
              </p>
            )}
            <p className="read-meta">
              {demand.data.items.length} shown ·{" "}
              {demand.data.completeness === "Complete"
                ? "Complete permitted result"
                : `Partial result · bounded to ${demand.data.limit}; more eligible work may exist`}{" "}
              · Observed{" "}
              <Stamp value={demand.data.observed_at} timezone={zone} /> ({zone})
            </p>
            {demand.data.completeness === "Partial" &&
              (demandLimit < 200 ? (
                <button
                  className="secondary"
                  onClick={() => setDemandLimit(200)}
                >
                  Show up to 200 permitted orders
                </button>
              ) : (
                <p>
                  Narrow by site to inspect this bounded result. There is no
                  next page.
                </p>
              ))}
          </>
        )}
      </section>
      {planId && (
        <DemandPanel
          key={planId}
          id={planId}
          returnTo={returnTo}
          onClose={() => setPlanId(null)}
          onSaved={() => {
            demand.reload();
            result.reload();
          }}
        />
      )}
      {dragNotice && (
        <p role="status" className="planner-warning">
          {dragNotice}
        </p>
      )}
      <dialog
        ref={modal}
        className="planner-dialog"
        onCancel={(e) => {
          e.preventDefault();
          close();
        }}
      >
        <button className="secondary dialog-close" onClick={close}>
          Close move
        </button>
        {move && (
          <>
            <p role="status" className="planner-warning">
              {dragNotice ||
                "Review the proposed move. The current booking stays reserved until the server accepts this change."}
            </p>
            <BookingForm
              key={`${move.a.id}:${move.start ?? "keyboard"}`}
              appointment={
                data?.items.find((a) => a.id === move.a.id) ?? move.a
              }
              mode="move"
              initialStart={move.start}
              initialCrew={move.crew}
              onSaved={() => {
                result.reload();
                setDragNotice(
                  "Move saved. Customer contact and pack review remain required; dispatch stays held.",
                );
              }}
              onClose={close}
            />
          </>
        )}
      </dialog>
    </>
  );
}
