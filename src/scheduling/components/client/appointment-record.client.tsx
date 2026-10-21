"use client";
import Link from "next/link";
import { IncidentVisitMenu } from "../../../incidents/visit-menu";
import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  api,
  isDenied,
  ReadState,
  Stamp,
  type Envelope,
} from "../../../components/business-ui";
import { Button, ButtonLink } from "../../../components/ui/button";
import { RegisterChip } from "../../../components/ui/register-table";
import {
  SharedRecord,
  RecordFactSection,
} from "../../../components/ui/shared-record";
import { WorklistMenu } from "../../../components/crm-worklist-tools";
import { ProductIcon } from "../../../components/product-icons";
import { usePhoneHeader } from "../../../shell/phone-header";
import { formatRange, zoneDisplayName } from "../../../shell/date-format";
import { visitPreparationGuidance } from "../../../field/visit-guidance";
import { readableValue } from "../../../documents/pack-view";
import { returnReasonsText } from "../../../documents/pack-view";
import type { Pack } from "../../../documents/components/client/job-pack-types";
import {
  appointmentActions,
  appointmentChecks,
  appointmentClosed,
  appointmentDispatch,
  type AppointmentCheck,
  type AppointmentMode,
} from "../../appointment-presentation";
import { showAppointmentDates } from "./booking-continuation.client";
import { PolicyResolution } from "./policy-resolution.client";
import type { Appointment } from "./planner-screens.client";
import "../../../app/styles/organisations.css";
import "./appointment-record.css";

type PackEntry = {
  pack: {
    id: string;
    display_number: string;
    status: string;
    needs_review: boolean;
  } | null;
  can_prepare: boolean;
};
const labels: Record<AppointmentMode, string> = {
  confirm: "Confirm appointment",
  move: "Move or reassign",
  contact: "Record contact",
  request: "Propose change",
  cancel: "Cancel appointment",
};
const initials = (name: string) =>
  name
    .split(/\s+/)
    .slice(0, 2)
    .map((s) => s[0])
    .join("");
const words = (value: string) =>
  ({
    ManualPhone: "Phone",
    ManualEmail: "Email",
    InPerson: "In person",
    NoResponse: "No answer",
    Confirmed: "Agreed",
  })[value] ?? readableValue(value);
const checkTone = (outcome: string) =>
  outcome === "Pass"
    ? "positive"
    : ["Blocked", "Unknown", "PermittedException"].includes(outcome)
      ? "attention"
      : "neutral";

function Facts({ rows }: { rows: [string, ReactNode][] }) {
  return (
    <dl className="sv04-facts">
      {rows.map(([label, value]) => (
        <div key={label}>
          <dt>{label}</dt>
          <dd>{value}</dd>
        </div>
      ))}
    </dl>
  );
}
function Heading({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <header className="sv04-section-heading">
      <h2>{title}</h2>
      {children && <span>{children}</span>}
    </header>
  );
}
function Check({
  item,
  children,
}: {
  item: AppointmentCheck;
  children?: ReactNode;
}) {
  return (
    <div className="sv04-check" data-tone={checkTone(item.outcome)}>
      <ProductIcon
        name={
          item.outcome === "Pass"
            ? "converted"
            : item.outcome === "Blocked"
              ? "warning"
              : "info"
        }
      />
      <div>
        <div className="sv04-check-title">
          <strong>
            <span className="sv04-wide-label">{item.label}</span>
            <span className="sv04-phone-label">{item.shortLabel}</span>
          </strong>
          <span>{words(item.outcome)}</span>
        </div>
        <p>{item.detail}</p>
        {children}
      </div>
    </div>
  );
}

// Pack data has its own permission/read boundary, tied to the successful appointment read.
// A late pack result cannot clear a newer hold; refreshing does not remount command editors.
export function AppointmentRecord({
  a,
  current,
  observedAt,
  returnTo,
  onAction,
  onRefresh,
  mode,
  form,
  requests,
  packData,
  packState,
}: {
  a: Appointment;
  current: boolean;
  observedAt: string;
  returnTo: string;
  onAction: (mode: AppointmentMode) => void;
  onRefresh: () => void;
  mode: AppointmentMode | null;
  form: ReactNode;
  requests: ReactNode;
  packData: Pack | null;
  packState: ReactNode;
}) {
  const pack = current ? packData : null;
  const actions = appointmentActions(a, current),
    closed = appointmentClosed(a);
  const dispatch = appointmentDispatch(a, pack, current),
    checks = appointmentChecks(a);
  const issue = pack?.issues.find((i) => i.id === pack.current_issue_id);
  const recipients = pack?.readiness.recipients ?? [];
  const acknowledged = recipients.filter(
    (r) => r.acknowledged_at && r.presented_hash === issue?.output_hash,
  ).length;
  const packTitle = issue
    ? `Job pack r${String(issue.revision).padStart(2, "0")}`
    : "Job pack";
  const packHref = pack ? `/service/packs/${pack.id}` : "#sv04-pack";
  const workHref = `/service/work-orders/${a.work_order_id}`;
  const link = (href: string, children: ReactNode) =>
    current ? <Link href={href}>{children}</Link> : <span>{children}</span>;
  const visit = formatRange(a.start_at, a.end_at, a.site_timezone);
  const more = [
    ...(actions.request
      ? [{ label: "Propose change", onSelect: () => onAction("request") }]
      : []),
    ...(actions.manage
      ? [{ label: "Cancel appointment", onSelect: () => onAction("cancel") }]
      : []),
    { label: "Refresh saved appointment", onSelect: onRefresh },
  ];
  usePhoneHeader({
    title: "Appointment detail",
    record: { position: a.display_number, more },
  });
  const editor = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (mode) {
      editor.current?.scrollIntoView({ block: "start", behavior: "smooth" });
      editor.current?.focus({ preventScroll: true });
    }
  }, [mode]);
  const primary = actions.manage && (
    <Button
      variant="primary"
      onClick={() => onAction(a.status === "Proposed" ? "confirm" : "move")}
    >
      {a.status === "Proposed" ? "Confirm appointment" : "Move or reassign"}
    </Button>
  );
  const contact = actions.contact && (
    <Button onClick={() => onAction("contact")}>Record contact</Button>
  );
  const status = (
    <>
      <RegisterChip tone="neutral">{readableValue(a.status)}</RegisterChip>
      {dispatch.title !== readableValue(a.status) && (
        <RegisterChip tone={dispatch.tone}>{dispatch.title}</RegisterChip>
      )}
    </>
  );
  const crew = a.assignments.filter((x) => x.active);
  const summary: [string, ReactNode][] = [
    ["State", readableValue(a.status)],
    ["Visit", visit],
    ["Site time", zoneDisplayName(a.site_timezone, a.start_at)],
    [
      "Customer dates",
      a.customer_commitment === "Confirmed"
        ? "Agreed for this schedule"
        : words(a.customer_commitment),
    ],
    ["Work order", link(workHref, a.work_order_display_number)],
    [
      "Scope",
      `r${String(a.scope_revision).padStart(2, "0")}${a.scope_review_required ? " · review required" : ""}`,
    ],
    ["Job pack", pack ? link(packHref, packTitle) : "See current pack status"],
    [
      "Observed",
      <Stamp key="observed" value={observedAt} timezone={a.site_timezone} />,
    ],
    [
      "Readiness rules",
      pack?.readiness_policy
        ? `Dispatch checks · version ${pack.readiness_policy.version}`
        : "Current work-order policy",
    ],
  ];
  const customer: [string, ReactNode][] = [
    [
      "Customer",
      a.customer_id
        ? link(
            `/customers/${a.customer_id}`,
            a.customer_name ?? "Not available",
          )
        : (a.customer_name ?? "Not available"),
    ],
    ["Site", link(`/sites/${a.site_id}`, a.site_name)],
    ["Site contact", a.primary_contact_name ?? "Not available"],
  ];
  const tasks = [
    ...a.followups,
    ...(pack?.follow_ups ?? []).filter(
      (f) => !a.followups.some((x) => x.activity_id === f.activity_id),
    ),
  ];
  return (
    <SharedRecord
      id="ppo-appointment"
      title={a.scope_summary}
      reference={a.display_number}
      status={status}
      statusPlacement="title"
      meta={
        <>
          <span>{a.display_number}</span>
          <span>
            {a.service_owner_name
              ? `${a.service_owner_name} · Service owner`
              : "Service owner not available"}
          </span>
          <span>Work order {link(workHref, a.work_order_display_number)}</span>
        </>
      }
      actions={
        <>
          {contact}
          {primary}
          <IncidentVisitMenu appointmentId={a.id} />
          <WorklistMenu label="Appointment actions" icon="more">
            {more.map((action) => (
              <Button
                key={action.label}
                variant="quiet"
                data-menu-close
                onClick={action.onSelect}
              >
                {action.label}
              </Button>
            ))}
            {link(returnTo, "Back to planner")}
            {link(showAppointmentDates(a, returnTo), "View visit in planner")}
          </WorklistMenu>
        </>
      }
      sourcesLabel="Appointment readiness summary"
      sources={
        <>
          <strong>{dispatch.title}</strong>
          <span>Parts · {words(checks[0].outcome)}</span>
          <span>
            {packTitle} ·{" "}
            {issue
              ? `${acknowledged} of ${recipients.length} acknowledged`
              : "See pack status"}
          </span>
          <span>Site readiness · Not available yet</span>
          <span>Site and isolation controls · {words(checks[2].outcome)}</span>
          <span>Crew · {words(checks[3].outcome)}</span>
        </>
      }
      facts={
        <>
          <RecordFactSection title="Summary">
            <Facts rows={summary} />
          </RecordFactSection>
          <RecordFactSection title="Customer and site">
            <Facts rows={customer} />
            <small>Customer and site come from the work order.</small>
          </RecordFactSection>
          <RecordFactSection title={`Crew (${crew.length})`}>
            {crew.map((x) => (
              <article key={x.id}>
                <strong>{x.name}</strong>{" "}
                <RegisterChip tone="neutral">
                  {x.crew_role === "Lead" ? "Lead technician" : x.crew_role}
                </RegisterChip>
                <small>
                  {x.travel_before_minutes} min travel before ·{" "}
                  {x.travel_after_minutes} min after · {x.travel_reason}
                </small>
              </article>
            ))}
            {!crew.length && (
              <p>
                No crew reserved. Proposed attendance does not reserve people.
              </p>
            )}
          </RecordFactSection>
        </>
      }
      tabs={null}
      stickyAction={
        !closed && (contact || primary) ? (
          <>
            {contact}
            {primary}
          </>
        ) : undefined
      }
    >
      <div className="sv04-phone-status">
        {status}
        <IncidentVisitMenu appointmentId={a.id} />
      </div>
      <section
        className="sv04-card sv04-dispatch"
        aria-label="Dispatch decision"
      >
        <div className="sv04-decision-heading">
          <ProductIcon
            name={dispatch.tone === "positive" ? "converted" : "warning"}
          />
          <h2>{dispatch.title}</h2>
          {dispatch.reasons.length > 0 && (
            <RegisterChip tone={dispatch.tone}>
              {dispatch.reasons.length} reasons
            </RegisterChip>
          )}
        </div>
        <p className="sv04-decision-copy">{dispatch.detail}</p>
        {dispatch.reasons.map((reason, index) => (
          <div className="sv04-blocker" key={index}>
            <ProductIcon name="warning" />
            <div>
              <strong>{reason}</strong>
            </div>
            {current && (
              <a
                href={
                  a.status === "Proposed"
                    ? "#sv04-visit"
                    : reason.startsWith("Parts")
                      ? "#sv04-parts"
                      : "#sv04-pack"
                }
              >
                Review
              </a>
            )}
          </div>
        ))}
        {!closed && (
          <p className="sv04-note">
            A supply change can raise the dispatch hold again. The booking never
            moves by itself.
          </p>
        )}
        {closed && (
          <p className="sv04-decision-copy">
            {link(
              `${workHref}#planned-visits`,
              "Review work-order visits and preparation",
            )}
          </p>
        )}
      </section>
      {form && (
        <div
          className="sv04-editor"
          ref={editor}
          tabIndex={-1}
          aria-label={mode ? labels[mode] : "Appointment editor"}
        >
          {!current && (
            <p role="status">Refresh the appointment before saving.</p>
          )}
          <fieldset disabled={!current}>{form}</fieldset>
        </div>
      )}
      <section aria-label="Dispatch checks">
        <Heading title="Dispatch checks">
          {a.status === "Cancelled"
            ? "Not checked: visit cancelled"
            : "From current records · never ticked by hand"}
        </Heading>
        <div className="sv04-card">
          {checks.map((item) => (
            <div
              key={item.code}
              id={item.code === "PartsReadiness" ? "sv04-parts" : undefined}
            >
              <Check item={item}>
                {item.code === "PartsReadiness" && a.status !== "Cancelled" && (
                  <>
                    <ul className="sv04-parts-lines">
                      {a.readiness
                        .find((c) => c.criterion_code === "PartsReadiness")
                        ?.parts?.lines.map((line) => (
                          <li key={line.id}>
                            {a.actions.can_read_supply
                              ? link(
                                  `/supply/material-readiness?record=${line.id}`,
                                  line.title,
                                )
                              : line.title}{" "}
                            · {line.state}
                            {line.shortage && line.shortage !== "0"
                              ? ` · ${line.shortage} ${line.unit} short`
                              : ""}
                            {line.promised_on
                              ? ` · promised ${line.promised_on}`
                              : ""}
                          </li>
                        ))}
                    </ul>
                    <small>Parts updates are managed in Supply Chain.</small>
                  </>
                )}
                {item.code === "DispatchControls" &&
                  a.status !== "Cancelled" &&
                  current &&
                  link(
                    `${workHref}?returnTo=${encodeURIComponent(`/service/appointments/${a.id}`)}#visit-${a.id}`,
                    "Review work-order readiness",
                  )}
              </Check>
            </div>
          ))}
        </div>
      </section>
      {a.status !== "Proposed" && !closed && (
        <p className="sv04-note">
          <ProductIcon name="info" />
          Job pack deadline · Not available yet.
        </p>
      )}
      <section id="sv04-visit" className="sv04-phone-visit">
        <Heading title="Visit">
          {zoneDisplayName(a.site_timezone, a.start_at)}
        </Heading>
        <Facts
          rows={[
            ["Reference", a.display_number],
            ["Visit", visit],
            ...customer,
            ["Work order", link(workHref, a.work_order_display_number)],
            [
              "Customer dates",
              a.customer_commitment === "Confirmed"
                ? "Agreed for this schedule"
                : words(a.customer_commitment),
            ],
          ]}
        />
        <details>
          <summary>Crew and visit details</summary>
          <Facts
            rows={summary.filter(
              ([label]) =>
                ![
                  "Visit",
                  "Work order",
                  "Customer dates",
                  "Site time",
                ].includes(label),
            )}
          />
          {crew.map((x) => (
            <p key={x.id}>
              <strong>
                {x.name} · {x.crew_role}
              </strong>
              <br />
              {x.travel_before_minutes} min travel before ·{" "}
              {x.travel_after_minutes} min after · {x.travel_reason}
            </p>
          ))}
          {!crew.length && <p>No crew reserved.</p>}
        </details>
      </section>
      <section id="sv04-pack" aria-label="Visit job pack">
        <Heading title={packTitle}>
          {issue ? (
            <>
              <Stamp value={issue.issued_at} timezone={a.site_timezone} />
              {issue.issued_by_name && ` · ${issue.issued_by_name}`} ·{" "}
              {acknowledged} of {recipients.length} acknowledged
            </>
          ) : (
            "Current issue and individual responses"
          )}
        </Heading>
        {packState}
        {pack && (
          <>
            <div className="sv04-card">
              {recipients.map((r) => {
                const returned = r.return_id && !r.return_answered_at;
                const agreed =
                  r.acknowledged_at && r.presented_hash === issue?.output_hash;
                return (
                  <article className="sv04-crew" key={r.id}>
                    <span className="sv04-avatar" aria-hidden="true">
                      {initials(r.display_name)}
                    </span>
                    <div>
                      <strong>{r.display_name}</strong>
                      <small>
                        {crew.find((x) => x.id === r.assignment_id)
                          ?.crew_role ?? "Issue recipient"}
                      </small>
                      <small>
                        {agreed ? (
                          <>
                            <Stamp
                              value={r.acknowledged_at}
                              timezone={a.site_timezone}
                            />{" "}
                            · exact issue acknowledged
                          </>
                        ) : returned ? (
                          returnReasonsText(r.return_reasons ?? [])
                        ) : r.return_answered_at ? (
                          "Return answered; awaiting acknowledgement"
                        ) : (
                          "Awaiting explicit response"
                        )}
                      </small>
                      {returned && r.return_note && <p>{r.return_note}</p>}
                      {r.return_answer && <p>{r.return_answer}</p>}
                      {pack.returns
                        ?.filter(
                          (t) =>
                            t.actor_id === r.user_id &&
                            t.issue_id !== issue?.id,
                        )
                        .slice(0, 1)
                        .map((t) => (
                          <small key={t.id}>
                            Returned r{String(t.revision).padStart(2, "0")} ·{" "}
                            {returnReasonsText(t.reason_codes)} · {t.note}
                          </small>
                        ))}
                    </div>
                    <RegisterChip tone={agreed ? "positive" : "attention"}>
                      {agreed
                        ? "Acknowledged"
                        : returned
                          ? "Returned"
                          : "Awaiting"}
                    </RegisterChip>
                  </article>
                );
              })}
              {!recipients.length && (
                <p className="sv04-empty">
                  No recipients on a current visible issue. Preparation and
                  acknowledgement remain separate.
                </p>
              )}
            </div>
            <p>{link(packHref, "Open job pack")}</p>
          </>
        )}
      </section>
      <section aria-label="Customer contact">
        <Heading title="Customer contact">
          Recorded here; PPO sends nothing to the customer
        </Heading>
        <div className="sv04-card">
          {a.contacts.map((c) => (
            <article className="sv04-contact" key={c.id}>
              <RegisterChip
                tone={c.outcome === "Confirmed" ? "positive" : "neutral"}
              >
                Dates · {words(c.outcome)}
              </RegisterChip>
              <div>
                <strong>
                  {c.recipient_name} · {words(c.channel)}
                </strong>
                <p>{c.notes}</p>
              </div>
              <small>
                Recorded{" "}
                <Stamp value={c.occurred_at} timezone={a.site_timezone} /> ·
                schedule v{c.schedule_version}
                {c.schedule_version !== a.schedule_version &&
                  " · earlier schedule"}
              </small>
            </article>
          ))}
          {!a.contacts.length && (
            <p className="sv04-empty">
              No recorded customer contact. No date agreement is assumed.
            </p>
          )}
        </div>
      </section>
      <section aria-label="Follow-ups">
        <Heading title="Follow-ups">Tasks visible for this visit</Heading>
        <div className="sv04-card">
          {tasks.map((f) => (
            <article className="sv04-task" key={f.activity_id}>
              <ProductIcon name="work" />
              <div>
                <strong>{link(`/work/${f.activity_id}`, f.summary)}</strong>
                <small>Task · {f.owner_name ?? "Owner not available"}</small>
              </div>
              <div>
                <small>
                  {"due_needed" in f ? (
                    f.due_needed ? (
                      "Due date needed"
                    ) : (
                      <Stamp value={f.due_at} timezone={a.site_timezone} />
                    )
                  ) : (
                    "Open task for its due date"
                  )}
                </small>
                <small>{readableValue(f.status)}</small>
              </div>
            </article>
          ))}
          {!tasks.length && (
            <p className="sv04-empty">
              No follow-up visible in your permitted scope.
            </p>
          )}
        </div>
      </section>
      <section aria-label="Schedule change requests">
        <Heading title="Schedule change requests">
          {a.requests.filter((r) => r.status === "Pending").length} pending
        </Heading>
        <div className="sv04-card sv04-requests">{requests}</div>
      </section>
      {(["Unknown", "Blocked"].includes(a.preparation_status) ||
        a.status === "Proposed" ||
        a.scope_review_required ||
        a.authorisation_blockers.length > 0 ||
        a.policy_impacts?.length ||
        a.readiness.some(
          (c) => !checks.some((x) => x.code === c.criterion_code),
        )) && (
        <section aria-label="Other visit checks">
          <Heading title="Other visit checks" />
          <p>
            {visitPreparationGuidance(
              a.status,
              a.preparation_status,
              a.scope_review_required,
            )}
          </p>
          {["Unknown", "Blocked"].includes(a.preparation_status) && (
            <p>
              Readiness assessment does not change this preparation state.
              Review with the service owner; use controlled cancellation and a
              new proposal where permitted. Preparation cannot be corrected in
              place by this screen.
            </p>
          )}
          {a.scope_review_required && (
            <p className="sv04-note">
              Scope review required. A successor draft grants no extra work
              authority.
            </p>
          )}
          {a.authorisation_blockers.map((b, i) => (
            <p key={i}>{b.message}</p>
          ))}
          {a.readiness
            .filter((c) => !checks.some((x) => x.code === c.criterion_code))
            .map((c) => (
              <p key={c.criterion_code}>
                <strong>
                  {c.label} · {words(c.outcome)}
                </strong>
                <br />
                {c.reason}
              </p>
            ))}
          {a.policy_impacts?.map((impact) => (
            <article key={impact.impact_id}>
              <strong>
                Scheduling policy {impact.held ? "hold" : "impact"}
              </strong>
              <p>
                Source publication: {impact.publication_id} ·{" "}
                {impact.disposition}
              </p>
              <p>
                {impact.reason} · {impact.owner_name}
              </p>
              <p>{impact.next_action}</p>
              {current && !closed && a.actions.can_resolve_policy && (
                <PolicyResolution
                  impactId={impact.impact_id}
                  onSaved={onRefresh}
                />
              )}
            </article>
          ))}
        </section>
      )}
      <details className="sv04-integrity">
        <summary>
          Integrity details · original proposal, versions and record IDs
        </summary>
        <p>
          Appointment v{a.version} · Crew v{a.assignment_version} · Schedule v
          {a.schedule_version} · Work order v{a.work_order_version}
        </p>
        <p>Appointment: {a.id}</p>
        <p>Work order: {a.work_order_id}</p>
        <p>
          Scope: {a.scope_revision_id} · {a.scope_hash}
        </p>
        <p>
          Scheduling policy: {a.policy.name} · v{a.policy.version}
        </p>
        <p>
          Preparation: {readableValue(a.preparation_status)} · Pack requirement:{" "}
          {readableValue(a.pack_requirement)}
        </p>
        <p>
          Original proposal:{" "}
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
        <p>Proposal SHA-256: {a.proposal.content_hash}</p>
        {a.history.map((h) => (
          <p key={h.version}>
            v{h.version} · {readableValue(h.snapshot.status)} ·{" "}
            <Stamp value={h.snapshot.start_at} timezone={a.site_timezone} /> ·
            Commitment {readableValue(h.snapshot.customer_commitment)}
          </p>
        ))}
        <p>
          {link(showAppointmentDates(a, returnTo), "View visit in planner")} ·{" "}
          {link(returnTo, "Back to planner")}
        </p>
      </details>
    </SharedRecord>
  );
}

export function AppointmentPackRead({
  appointmentId,
  current,
  observedAt,
  children,
}: {
  appointmentId: string;
  current: boolean;
  observedAt: string;
  children: (pack: Pack | null, state: ReactNode) => ReactNode;
}) {
  const [revision, setRevision] = useState(0);
  const basis = `${appointmentId}:${observedAt}:${revision}`;
  const [result, setResult] = useState<{
    basis: string;
    entry: PackEntry | null;
    pack: Pack | null;
    error: unknown;
  } | null>(null);
  useEffect(() => {
    let live = true;
    if (current)
      void (async () => {
        let entry: PackEntry | null = null;
        try {
          entry = await api<PackEntry>(`appointments/${appointmentId}/pack`);
          const data = entry.pack
            ? await api<Envelope<Pack>>(`packs/${entry.pack.id}`)
            : null;
          const pack =
            data?.items.find((p) => p.appointment_id === appointmentId) ?? null;
          if (entry.pack && !pack)
            throw {
              message:
                "The current pack response did not contain this appointment. Refresh pack status.",
            };
          if (live) setResult({ basis, entry, pack, error: null });
        } catch (error) {
          if (live) setResult({ basis, entry, pack: null, error });
        }
      })();
    return () => {
      live = false;
    };
  }, [appointmentId, current, basis]);
  const ready = current && result?.basis === basis;
  const error = ready ? result.error : null;
  const entry = ready && !error ? result.entry : null;
  const state = (
    <>
      {!current ? (
        <p role="status">
          Refresh the appointment to check its current job pack.
        </p>
      ) : (
        <>
          {isDenied(error) ? (
            <p role="status">
              Job pack access is unavailable to this identity.
            </p>
          ) : (
            <ReadState
              loading={!ready}
              error={error}
              retry={() => setRevision((n) => n + 1)}
            />
          )}
          {entry &&
            !entry.pack &&
            (entry.can_prepare ? (
              <p>
                No visible pack.{" "}
                <ButtonLink
                  href={`/service/packs/new?appointment_id=${appointmentId}`}
                >
                  Prepare job pack
                </ButtonLink>
              </p>
            ) : (
              <p>
                No job pack is available to this identity. Ask the service
                coordinator to review preparation.
              </p>
            ))}
          {ready && (
            <Button variant="quiet" onClick={() => setRevision((n) => n + 1)}>
              Refresh pack status
            </Button>
          )}
        </>
      )}
    </>
  );
  return children(ready && !error ? result.pack : null, state);
}
