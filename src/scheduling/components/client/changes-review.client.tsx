"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  ErrorNotice,
  Field,
  ReadState,
  Stamp,
  useResource,
} from "../../../components/business-ui";
import { Button, ButtonLink } from "../../../components/ui/button";
import { RegisterChip } from "../../../components/ui/register-table";
import {
  RecordTabs,
  RecordPanel,
  useUnsavedChanges,
} from "../../../components/record-ui";
import { WorklistMenu } from "../../../components/crm-worklist-tools";
import { usePublishRecordIdentity } from "../../../shell/record-identity";
import {
  currentCrew,
  staleBookingChanges,
  type ChangeRequest,
  type ChangeReview,
} from "../../changes-model";
import { useRequestDecision } from "./planner-screens.client";

export function VisitTime({
  start,
  end,
  zone,
}: {
  start: string;
  end: string;
  zone: string;
}) {
  const day = new Intl.DateTimeFormat("en-AU", {
    timeZone: zone,
    weekday: "short",
    day: "numeric",
    month: "short",
  });
  const time = new Intl.DateTimeFormat("en-AU", {
    timeZone: zone,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });
  return (
    <>
      <span>{day.format(new Date(start))}</span>
      <span>
        {time.format(new Date(start))}–{time.format(new Date(end))}
      </span>
    </>
  );
}
export const appointmentAction = (
  a: Pick<ChangeReview, "id">,
  returnTo: string,
  action?: "move" | "contact",
) =>
  "/service/appointments/" +
  a.id +
  "?" +
  new URLSearchParams({ returnTo, ...(action ? { action } : {}) });
const travel = (person: ChangeRequest["crew"][number]) =>
  `${person.travel_before_minutes} min before · ${person.travel_after_minutes} min after · ${person.travel_reason || "Reason unavailable"}`;
function ContactHistory({ a }: { a: ChangeReview }) {
  return (
    <div className="changes-history">
      {a.contacts.map((c) => (
        <article key={c.id}>
          <strong>
            {c.outcome} · {c.recipient_name || "Recipient unavailable"}
          </strong>
          <p>
            <Stamp value={c.occurred_at} timezone={a.site_timezone} /> ·{" "}
            {c.channel} · schedule v{c.schedule_version}
          </p>
          <p>{c.notes}</p>
        </article>
      ))}
      {!a.contacts.length && <p>No recorded customer contact returned.</p>}
    </div>
  );
}
function History({ a }: { a: ChangeReview }) {
  return (
    <>
      <ContactHistory a={a} />
      <div className="changes-history">
        {a.requests.map((r) => (
          <article key={r.id}>
            <strong>
              {r.status === "Pending"
                ? "Change request logged"
                : "Request " + r.status.toLowerCase()}{" "}
              ·{" "}
              {r.decision_by_name && r.status !== "Pending"
                ? r.decision_by_name
                : r.created_by_name}
            </strong>
            <p>
              {r.decision_at || r.created_at ? (
                <Stamp
                  value={r.decision_at || r.created_at}
                  timezone={a.site_timezone}
                />
              ) : (
                "Time unavailable"
              )}{" "}
              · request v{r.version}
            </p>
            <p>{r.decision_reason || r.reason}</p>
          </article>
        ))}
        {a.history.map((h) => (
          <article key={h.version}>
            <strong>
              Booking v{h.version} · {h.snapshot.status}
            </strong>
            <p>
              <Stamp value={h.snapshot.start_at} timezone={a.site_timezone} /> ·
              customer {h.snapshot.customer_commitment}
            </p>
          </article>
        ))}
      </div>
    </>
  );
}
function Consequences({ a }: { a: ChangeReview }) {
  const c = a.consequences;
  return (
    <section className="changes-consequences">
      <h3>If the booking changes</h3>
      <div>
        <strong>
          Customer: {a.customer_commitment} · fresh contact needed
        </strong>
        <p>
          {a.followups
            .filter((f) => ["Open", "InProgress"].includes(f.status))
            .map((f) => f.owner_name || "Owner unavailable")
            .join(", ") || "Review owned follow-up after saving the change"}
        </p>
      </div>
      <div>
        <strong>Job pack · crew acknowledges again</strong>
        {c.state === "Unavailable" ? (
          <p>Job-pack evidence unavailable under your current access.</p>
        ) : c.pack ? (
          <p>
            <Link href={"/service/packs/" + c.pack.id}>
              {c.pack.reference}
            </Link>
            {c.pack.revision !== null &&
              " · r" + String(c.pack.revision).padStart(2, "0")}{" "}
            ·{" "}
            {c.pack.current
              ? `${c.pack.acknowledged} of ${c.pack.recipients} acknowledged`
              : "Current acknowledgement unconfirmed; pack needs review"}
          </p>
        ) : (
          <p>No job pack returned.</p>
        )}
      </div>
      <div>
        <strong>Site readiness · gated</strong>
        <p>
          Gate P4 is not built. Site readiness for the new time is unconfirmed.
        </p>
      </div>
      <div>
        <strong>
          {c.state === "Unavailable"
            ? "Dispatch readiness unavailable"
            : c.dispatch_hold
              ? "Dispatch held"
              : "No dispatch hold returned"}
        </strong>
        <p>
          {c.state === "Unavailable"
            ? "Open the appointment to review permitted evidence."
            : c.reasons.length
              ? c.reasons.join(" · ")
              : "A changed booking requires a fresh readiness check."}
        </p>
      </div>
    </section>
  );
}
function BookedNow({ a }: { a: ChangeReview }) {
  return (
    <section className="changes-booked">
      <h3>Booked now</h3>
      <div>
        <strong>
          <VisitTime start={a.start_at} end={a.end_at} zone={a.site_timezone} />{" "}
          · {a.site_name}
        </strong>
        <p>Site time {a.site_timezone}</p>
      </div>
      {currentCrew(a).map((person) => (
        <div key={person.id}>
          <strong>
            {person.name} ·{" "}
            {person.crew_role === "Lead" ? "lead technician" : "technician"}
          </strong>
          <p>{travel(person)}</p>
        </div>
      ))}
      {!currentCrew(a).length && <p>Unassigned</p>}
      <div>
        <strong>
          Appointment v{a.version} · schedule v{a.schedule_version} · crew v
          {a.assignment_version}
        </strong>
        <p>The decision is checked against these versions.</p>
      </div>
    </section>
  );
}
function RequestCard({
  a,
  request,
  onSaved,
  returnTo,
}: {
  a: ChangeReview;
  request: ChangeRequest;
  onSaved: () => void;
  returnTo: string;
}) {
  const d = useRequestDecision(a, request, onSaved);
  useUnsavedChanges(
    !!d.reason.trim(),
    d.command.busy || !!(d.command.error as { retryable?: boolean } | null)?.retryable,
  );
  const stale = staleBookingChanges(a, request),
    crew = currentCrew(a);
  const pending = request.status === "Pending",
    canCancel =
      a.actions.can_manage ||
      (a.actions.can_request && request.created_by === d.p.actor_id);
  const mutable = pending && (a.actions.can_manage || canCancel);
  const name = (id: string) =>
    a.assignments.find((p) => p.resource_id === id)?.name ?? d.resourceName(id);
  const crewSummary = (people: ChangeRequest["crew"]) =>
    people.map((p) => `${name(p.resource_id)} (${p.crew_role})`).join(", ") ||
    "Unassigned";
  const travelSummary = (people: ChangeRequest["crew"]) => people.length && people.every(p => travel(p) === travel(people[0])) ? travel(people[0]) : people.map(p => `${name(p.resource_id)}: ${travel(p)}`).join("; ") || "No travel";
  // The accepted booking revision immediately precedes the saved decision. Its
  // predecessor is the actual Before, even when the request basis was stale.
  const saved = request.decision_at
    ? a.history
        .filter(
          (h) =>
            h.snapshot.updated_at &&
            Date.parse(h.snapshot.updated_at) <=
              Date.parse(request.decision_at!),
        )
        .toSorted((x, y) => y.version - x.version)
    : [];
  const before = request.status === "Accepted" ? saved[1] : undefined;
  const accepted = request.status === "Accepted" ? saved[0] : undefined;
  const leftCrew = before
    ? a.assignments.filter(
        (p) => p.assignment_version === before.snapshot.assignment_version,
      )
    : crew;
  const rightCrew = accepted
    ? a.assignments.filter(
        (p) => p.assignment_version === accepted.snapshot.assignment_version,
      )
    : request.crew;
  const left = before?.snapshot ?? a,
    right = accepted?.snapshot ?? {
      start_at: request.proposed_start,
      end_at: request.proposed_end,
    };
  const rows = [
    {
      label: "When",
      before: (
        <VisitTime
          start={left.start_at}
          end={left.end_at}
          zone={a.site_timezone}
        />
      ),
      after: (
        <VisitTime
          start={right.start_at}
          end={right.end_at}
          zone={a.site_timezone}
        />
      ),
      changed: left.start_at !== right.start_at || left.end_at !== right.end_at,
    },
    {
      label: "Crew",
      before: crewSummary(leftCrew),
      after: crewSummary(leftCrew) === crewSummary(rightCrew) ? "Same crew" : crewSummary(rightCrew),
      changed: crewSummary(leftCrew) !== crewSummary(rightCrew),
    },
    {
      label: "Travel",
      before: travelSummary(leftCrew),
      after: travelSummary(rightCrew),
      changed: travelSummary(leftCrew) !== travelSummary(rightCrew),
    },
    {
      label: "Time zone",
      before: a.site_timezone,
      after: a.site_timezone,
      changed: false,
    },
  ];
  return (
    <section
      className="changes-request"
      aria-label={"Change request " + request.id}
    >
      <header>
        <div>
          <strong>
            {request.source_type === "TechnicianRequest"
              ? "Technician request"
              : "Change request"}{" "}
            · logged by {request.created_by_name || "Person unavailable"}
          </strong>
          <p>
            {request.source_type} · request v{request.version}
            {request.created_at && (
              <>
                {" "}
                ·{" "}
                <Stamp value={request.created_at} timezone={a.site_timezone} />
              </>
            )}
          </p>
        </div>
        <RegisterChip
          tone={
            pending
              ? "attention"
              : request.status === "Accepted"
                ? "positive"
                : "neutral"
          }
        >
          {request.status}
        </RegisterChip>
        {pending && canCancel && (
          <WorklistMenu label="Request actions" text="…" choices>
            <button
              role="menuitem"
              data-menu-close
              disabled={d.command.busy || !d.reason.trim()}
              onClick={() => void d.decide("cancel")}
            >
              Cancel request
            </button>
            <p>Enter the decision reason before cancelling.</p>
          </WorklistMenu>
        )}
      </header>
      <p className="changes-request-reason">{request.reason}</p>
      {request.status === "Accepted" && (
        <p className="changes-success" role="status">
          Move accepted · decision saved.{" "}
          {a.customer_commitment === "Changed"
            ? "Fresh customer contact is needed."
            : "Review the latest customer commitment below."}
        </p>
      )}
      {request.status === "Accepted" && (!before || !accepted) ? (
        <p>
          Saved before/after booking evidence is unavailable. Open appointment
          history.
        </p>
      ) : (
        <div
          className="changes-comparison"
          role="table"
          aria-label="Booking comparison"
        >
          <div className="changes-comparison-head" role="row">
            <span role="columnheader">Booking detail</span>
            <strong role="columnheader">
              {accepted ? "Before" : "Booked now"}
            </strong>
            <strong role="columnheader">
              {accepted ? "Booked after decision" : "Requested"}
            </strong>
          </div>
          {rows.map((row) => (
            <div role="row" key={row.label}>
              <span role="rowheader">{row.label}</span>
              <div role="cell" data-label={accepted ? "Before" : "Booked now"}>
                {row.before}
              </div>
              <div
                role="cell"
                data-label={accepted ? "Booked after decision" : "Requested"}
                data-changed={row.changed || undefined}
              >
                {row.after}
                {row.changed && <small>Changed</small>}
              </div>
            </div>
          ))}
        </div>
      )}
      {pending && (
        <div
          className={stale.length ? "changes-stale" : "changes-request-basis"}
        >
          <strong>
            Requested against schedule v{request.expected_schedule_version} ·
            current v{a.schedule_version}
          </strong>
          {stale.length ? (
            stale.map((text) => <p key={text}>{text}</p>)
          ) : (
            <p>Not stale: nothing has changed since the request.</p>
          )}
        </div>
      )}
      {!pending && (
        <div className="changes-decision">
          <strong>
            Decision saved · {request.decision_by_name || "Person unavailable"}
          </strong>
          <p>
            {request.decision_at && (
              <Stamp value={request.decision_at} timezone={a.site_timezone} />
            )}
          </p>
          <p>{request.decision_reason}</p>
        </div>
      )}
      {mutable ? (
        <>
          <ErrorNotice error={d.command.error} />
          <fieldset disabled={d.command.busy || !!(d.command.error as { retryable?: boolean } | null)?.retryable}>
            <Field
              name={"decision-" + request.id}
              label="Decision reason"
              required
              multiline
              value={d.reason}
              onChange={d.setReason}
              maxLength={1000}
            />
          </fieldset>
          <div className="changes-decision-actions">
            {a.actions.can_manage && (
              <>
                <Button
                  variant="primary"
                  disabled={
                    !d.reason.trim() ||
                    d.policyPreparation.loading ||
                    !!d.policyPreparation.error ||
                    !d.policyPreparation.data
                  }
                  busy={d.command.busy}
                  onClick={() => void d.decide("accept")}
                >
                  Accept and check move
                </Button>
                <Button
                  disabled={!d.reason.trim()}
                  busy={d.command.busy}
                  onClick={() => void d.decide("reject")}
                >
                  Reject request
                </Button>
              </>
            )}
          </div>
          {a.actions.can_manage && (
            <>
              <Button
                variant="quiet"
                disabled={d.command.busy || !!(d.command.error as { retryable?: boolean } | null)?.retryable}
                onClick={d.policyPreparation.reload}
              >
                Review the current booking policy before deciding
              </Button>
              <ReadState
                {...d.policyPreparation}
                retry={d.policyPreparation.reload}
                focusOnError={false}
              />
            </>
          )}
        </>
      ) : (
        pending && (
          <p className="changes-note">
            View only — you can read this request. Booking decisions are
            unavailable under your current access.
          </p>
        )
      )}
      {request.status === "Accepted" && a.actions.can_contact && (
        <ButtonLink
          variant="primary"
          href={appointmentAction(a, returnTo, "contact")}
        >
          Record customer contact
        </ButtonLink>
      )}
    </section>
  );
}
function Followup({ a, returnTo }: { a: ChangeReview; returnTo: string }) {
  return (
    <div className="changes-followup">
      <h3>Owned follow-up</h3>
      {a.followups.map((f) => (
        <article key={f.activity_id}>
          <strong>{f.summary}</strong>
          <p>
            {f.owner_name || "Owner unavailable"} ·{" "}
            {f.due_at ? (
              <Stamp value={f.due_at} timezone={a.site_timezone} />
            ) : (
              "Due date needed"
            )}
          </p>
          <RegisterChip
            tone={
              f.status === "Completed"
                ? "positive"
                : ["Open", "InProgress"].includes(f.status)
                  ? "attention"
                  : "neutral"
            }
          >
            {f.status}
          </RegisterChip>
          <Link href={"/work/" + f.activity_id}>Open in My Work</Link>
        </article>
      ))}
      {!a.followups.length && <p>No permitted follow-up returned.</p>}
      <h3>Recorded customer contact</h3>
      <ContactHistory a={a} />
      {a.actions.can_contact && (
        <ButtonLink
          variant="primary"
          href={appointmentAction(a, returnTo, "contact")}
        >
          Record customer contact
        </ButtonLink>
      )}
      <p>
        Recording contact does not send a message or acknowledge the crew’s job
        pack.
      </p>
    </div>
  );
}
export function ChangesReview({
  id,
  returnTo,
  initialTab,
  onSaved,
  onClose,
  previous,
  next,
}: {
  id: string;
  returnTo: string;
  initialTab: string;
  onSaved: () => void;
  onClose: () => void;
  previous?: () => void;
  next?: () => void;
}) {
  const read = useResource<ChangeReview>("schedule/changes/" + id),
    a = !read.loading && !read.error ? read.data : null;
  const [tab, setTab] = useState(initialTab),
    heading = useRef<HTMLHeadingElement>(null);
  usePublishRecordIdentity(a?.display_number ?? null, a?.scope_summary ?? "");
  useEffect(() => {
    if (a) heading.current?.focus({ preventScroll: true });
  }, [a]);
  const reload = () => {
    read.reload();
    onSaved();
  };
  return (
    <div
      className="changes-snapshot"
      onKeyDown={(e) => {
        if (
          e.key === "Escape" &&
          !e.defaultPrevented &&
          !(e.target as HTMLElement).closest("[popover]")
        ) {
          e.preventDefault();
          onClose();
        }
      }}
    >
      <div className="changes-snapshot-nav">
        <Button aria-label="Close visit review" onClick={onClose}>
          ×
        </Button>
        <Button
          aria-label="Previous visit"
          onClick={previous}
          disabled={!previous}
        >
          ↑
        </Button>
        <Button aria-label="Next visit" onClick={next} disabled={!next}>
          ↓
        </Button>
      </div>
      {!a && (
        <div className="changes-state">
          <ReadState {...read} retry={read.reload} />
        </div>
      )}
      {a && (
        <>
          <header className="changes-snapshot-title">
            <h2 id="scheduling-review-heading" ref={heading} tabIndex={-1}>
              {a.scope_summary}
            </h2>
            <p>
              {a.display_number} · {a.work_order_display_number} ·{" "}
              {a.customer_name || a.site_name}
            </p>
            <RegisterChip
              tone={
                a.requests.some((r) => r.status === "Pending") ||
                a.customer_commitment === "Changed"
                  ? "attention"
                  : "neutral"
              }
            >
              {a.requests.some((r) => r.status === "Pending")
                ? "Change requested"
                : a.status}
            </RegisterChip>
            <span className="changes-attention">
              {" "}
              Customer {a.customer_commitment.toLowerCase()}
              {a.dispatch_hold && " · dispatch held"}
            </span>
          </header>
          <div className="changes-booking-column">
            <BookedNow a={a} />
            <Consequences a={a} />
            <p className="changes-note">
              A pending request reserves nothing. Accepting rechecks the whole
              crew, calendars, skills and reservations. Recording contact is not
              message delivery or crew pack acknowledgement.
            </p>
          </div>
          <div className="changes-review-column">
            <div className="changes-tab-card">
              <RecordTabs
                id="change-review"
                label="Visit review"
                value={tab}
                onChange={setTab}
                tabs={[
                  { id: "request", label: "Change request" },
                  {
                    id: "followup",
                    label: "Follow-up · " + a.followups.length,
                  },
                  { id: "history", label: "History · " + a.history.length },
                ]}
              />
              <RecordPanel id="change-review" tab="request" value={tab}>
                {a.requests.map((r) => (
                  <RequestCard
                    key={r.id + ":" + r.version + ":" + a.version}
                    a={a}
                    request={r}
                    returnTo={returnTo}
                    onSaved={reload}
                  />
                ))}
                {!a.requests.length && (
                  <p className="changes-no-request">
                    No change request returned. Use the appointment controls for
                    a controlled move.
                  </p>
                )}
              </RecordPanel>
              <RecordPanel id="change-review" tab="followup" value={tab}>
                <Followup a={a} returnTo={returnTo} />
              </RecordPanel>
              <RecordPanel id="change-review" tab="history" value={tab}>
                <History a={a} />
              </RecordPanel>
            </div>
            <details className="changes-history-disclosure">
              <summary>Contact and booking history</summary>
              <History a={a} />
            </details>
          </div>
          <footer className="changes-snapshot-footer">
            <WorklistMenu label="Visit actions" text="…" choices>
              <Link
                role="menuitem"
                data-menu-close
                href={
                  "/schedule?" +
                  new URLSearchParams({
                    day: a.start_at.slice(0, 10),
                    timezone: a.site_timezone,
                    site_id: a.site_id,
                  })
                }
              >
                View in planner
              </Link>
              {a.actions.can_manage && (
                <Link
                  role="menuitem"
                  data-menu-close
                  href={appointmentAction(a, returnTo, "move")}
                >
                  Move or reassign
                </Link>
              )}
              {a.actions.can_contact && (
                <Link
                  role="menuitem"
                  data-menu-close
                  href={appointmentAction(a, returnTo, "contact")}
                >
                  Record customer contact
                </Link>
              )}
            </WorklistMenu>
            {a.actions.can_manage && (
              <ButtonLink
                className="changes-move"
                href={appointmentAction(a, returnTo, "move")}
              >
                Move or reassign
              </ButtonLink>
            )}
            <ButtonLink variant="primary" href={appointmentAction(a, returnTo)}>
              Open appointment
            </ButtonLink>
          </footer>
        </>
      )}
    </div>
  );
}
