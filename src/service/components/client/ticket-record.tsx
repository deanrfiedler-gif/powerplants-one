"use client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { usePublishRecordIdentity } from "../../../shell/record-identity";
import { useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { Button, ButtonLink } from "../../../components/ui/button";
import {
  EnumField,
  ErrorNotice,
  Field,
  ReadState,
  SelectField,
  ValidationFields,
  useCommand,
  useResource,
  type Envelope,
  type Option,
  type Failure,
} from "../../../components/business-ui";
import { IntakeForm, TriageActions, type Intake } from "../../../components/intake-screens";
import { LocalDateTimeField, RecordPanel, RecordTabs, useUnsavedChanges } from "../../../components/record-ui";
import { ProductIcon } from "../../../components/product-icons";
import { usePhoneHeader } from "../../../shell/phone-header";
import { stageLabel, channelLabel } from "../../ticket-register-view";
import type { ticketStatements } from "../../statements";

const label = (source: Intake["site"] | Intake["asset"] | Intake["requester"]) => {
  return source && "display_name" in source
    ? String(source.display_name)
    : source && "description" in source
      ? String(source.description)
      : "Not recorded";
};
const stamp = (iso: string) =>
  new Intl.DateTimeFormat("en-AU", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Australia/Brisbane",
  }).format(new Date(iso));
export function ServiceDialog({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const changed = useRef(false);
  const close = () => {
    if (ref.current?.querySelector("[data-save-uncertain=true],fieldset[disabled]")) return;
    if (
      changed.current &&
      ref.current?.querySelector("form,input,textarea,select") &&
      !window.confirm("Discard the unsaved entries in this form?")
    )
      return;
    onClose();
  };
  useEffect(() => {
    const node = ref.current,
      opener = document.activeElement as HTMLElement | null;
    node?.showModal();
    return () => {
      node?.close();
      opener?.focus();
    };
  }, []);
  return (
    <dialog
      ref={ref}
      className="sv-dialog"
      aria-label={title}
      onInputCapture={() => {
        changed.current = true;
      }}
      onChangeCapture={() => {
        changed.current = true;
      }}
      onCancel={(e) => {
        e.preventDefault();
        close();
      }}
    >
      <header>
        <h2>{title}</h2>
        <Button aria-label="Close" variant="quiet" onClick={close}>
          <ProductIcon name="close" />
        </Button>
      </header>
      {children}
    </dialog>
  );
}
function DetailFields({ t }: { t: Intake }) {
  return (
    <div className="sv-details">
      <section>
        <h2>Request details</h2>
        <dl>
          <dt>Stage</dt>
          <dd>{stageLabel(t.status)}</dd>
          <dt>Priority</dt>
          <dd>{t.priority}</dd>
          <dt>Request owner</dt>
          <dd>{t.owner_name}</dd>
          <dt>Received</dt>
          <dd>
            {stamp(t.received_at)}
            <small>
              {t.received_time_basis === "LegacyUnverified" ? "Retained time — unverified" : "User-reported time"}
            </small>
          </dd>
          <dt>Channel</dt>
          <dd>{channelLabel(t.channel)}</dd>
          <dt>Requester</dt>
          <dd>
            {t.requester_id ? (
              <Link href={`/people/${t.requester_id}`}>{label(t.requester)}</Link>
            ) : (
              <span className="sv-unknown">{t.requester_description || "Not identified"}</span>
            )}
          </dd>
        </dl>
      </section>
      <section>
        <h2>Customer and site</h2>
        <dl>
          <dt>Customer</dt>
          <dd>
            {t.customer ? (
              <Link href={`/customers/${t.customer.id}`}>{t.customer.display_name}</Link>
            ) : (
              <span className="sv-unknown">Not identified</span>
            )}
          </dd>
          <dt>Site</dt>
          <dd>
            {t.site_id ? (
              <Link href={`/sites/${t.site_id}`}>{label(t.site)}</Link>
            ) : (
              <span className="sv-unknown">Not identified</span>
            )}
          </dd>
          <dt>Equipment</dt>
          <dd>
            {t.asset_id ? (
              <Link href={`/equipment/${t.asset_id}`}>{label(t.asset)}</Link>
            ) : (
              <span className="sv-unknown">Not recorded</span>
            )}
          </dd>
        </dl>
        <small>
          Site and equipment can change before triage. Corrections retain their earlier values in the audit history.
        </small>
      </section>
      <section>
        <h2>Linked work ({t.work_orders.length})</h2>
        {t.work_orders.map((w) => (
          <p key={w.id}>
            <Link href={`/service/work-orders/${w.id}`}>{w.display_number}</Link>{" "}
            <span className="sv-tag">{w.status}</span>
          </p>
        ))}
        {!t.work_orders.length && <p>No visible work order linked</p>}
      </section>
    </div>
  );
}
function TriageForm({
  t,
  onSaved,
  onCancel,
  onInformation,
}: {
  t: Intake;
  onSaved: () => void;
  onCancel: () => void;
  onInformation: () => void;
}) {
  const phone = useSyncExternalStore(
    (listener) => {
      const m = window.matchMedia("(max-width: 780px)");
      m.addEventListener("change", listener);
      return () => m.removeEventListener("change", listener);
    },
    () => window.matchMedia("(max-width: 780px)").matches,
    () => false,
  );
  const [basis, setBasis] = useState(t);
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    heading.current?.focus();
  }, []);
  const cmd = useCommand(),
    [expected, setExpected] = useState(t.version),
    [activityVersion, setActivityVersion] = useState(t.clarification_activity?.version),
    [reviewing, setReviewing] = useState(false),
    [discard, setDiscard] = useState(false);
  const [v, setV] = useState({
    priority: t.priority,
    triage_owner_id: t.triage_owner_id,
    priority_reason: t.priority_reason ?? "",
    next_action: t.next_action ?? "",
    clarification_outcome: t.clarification_outcome ?? "",
    reason: "",
  });
  const [error, setError] = useState<Failure | null>(null);
  const failure = error ?? cmd.error;
  const dirty =
    !!v.reason ||
    !!v.clarification_outcome ||
    v.priority !== t.priority ||
    v.priority_reason !== (t.priority_reason ?? "") ||
    v.next_action !== (t.next_action ?? "") ||
    v.triage_owner_id !== t.triage_owner_id;
  useUnsavedChanges(dirty, cmd.busy);
  const owners = useResource<Envelope<Option>>(
    `selectors/owners?${new URLSearchParams({ company_id: basis.company_id, ...(basis.site_id ? { site_id: basis.site_id } : {}), purpose: "Ticket" })}`,
  );
  const completeActivity = basis.status === "NeedsInformation" && basis.clarification_activity?.can_complete;
  const set = (key: keyof typeof v, value: string) => setV((old) => ({ ...old, [key]: value }));
  const cancel = () => {
    if (cmd.busy || (cmd.error as Failure | null)?.retryable) return;
    if (dirty) setDiscard(true);
    else onCancel();
  };
  const field = (key: keyof typeof v, title: string, hint?: string) => (
    <Field
      name={key}
      label={title}
      hint={hint}
      value={v[key]}
      onChange={(value) => set(key, value)}
      multiline
      maxLength={key === "reason" ? 1000 : 2000}
      required
    />
  );
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    const required = [
      "reason",
      "priority_reason",
      "next_action",
      ...(basis.status === "NeedsInformation" ? ["clarification_outcome"] : []),
    ] as (keyof typeof v)[];
    const missing = required.filter((k) => !v[k].trim());
    if (missing.length) {
      setError({
        message: `Fix ${missing.length} ${missing.length === 1 ? "entry" : "entries"} before saving.`,
        field_errors: missing.map((k) => ({
          field: k,
          message: "Enter this value before completing triage.",
        })),
      });
      return;
    }
    const result = await cmd.send(`service/tickets/${t.id}/triage`, {
      expected_version: expected,
      reason: v.reason,
      clarification_outcome: v.clarification_outcome || null,
      review: {
        priority: v.priority,
        triage_owner_id: v.triage_owner_id,
        priority_reason: v.priority_reason,
        next_action: v.next_action,
      },
      ...(completeActivity ? { clarification_version: activityVersion } : {}),
    });
    if (result) onSaved();
  }
  const conflict = (cmd.error as Failure | null)?.code === "VersionConflict";
  const current = useResource<Envelope<Intake>>(reviewing ? `service/tickets/${t.id}` : null),
    latest = current.data?.items[0];
  return (
    <form
      className="sv-triage-form"
      role={phone ? "dialog" : undefined}
      aria-modal={phone || undefined}
      aria-label={phone ? "Complete triage" : undefined}
      onKeyDown={(event) => {
        if (!phone) return;
        if (event.key === "Escape") {
          event.preventDefault();
          cancel();
        }
        if (event.key === "Tab") {
          const controls = Array.from(
            event.currentTarget.querySelectorAll<HTMLElement>(
              'button:not(:disabled),[href],input:not(:disabled),select:not(:disabled),textarea:not(:disabled),[tabindex="0"]',
            ),
          ).filter((el) => el.getClientRects().length > 0);
          const first = controls[0],
            last = controls.at(-1);
          if (event.shiftKey && (document.activeElement === first || document.activeElement === heading.current)) {
            event.preventDefault();
            last?.focus();
          } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first?.focus();
          }
        }
      }}
      data-save-uncertain={!!(cmd.error as Failure | null)?.retryable || undefined}
      onSubmit={submit}
      noValidate
    >
      <div className="sv-form-scroll">
        <div className="sv-edit-heading">
          <h2 ref={heading} tabIndex={-1}>
            Complete triage
          </h2>
          <span className="sv-tag">{stageLabel(basis.status)} → Triaged</span>
          <Button className="sv-phone-close" variant="quiet" aria-label="Close triage" onClick={cancel}>
            <ProductIcon name="close" />
          </Button>
        </div>
        <p className="sv-phone-intro">
          {t.display_number} · Nothing moves until you save. A newer revision refuses the save and keeps your entries.
        </p>
        <ValidationFields error={failure}>
          <ErrorNotice
            error={
              conflict
                ? {
                    code: "VersionConflict",
                    message:
                      "Not saved. A newer request revision exists. Your entries are kept; review the changes before saving again.",
                  }
                : failure
            }
          />
          <section className="sv-triage-request">
            <h3>Request</h3>
            <p>{t.summary}</p>
            <p>
              {t.customer?.display_name ?? "Customer not identified"} · {label(t.site)}
            </p>
          </section>
          {conflict && reviewing && (
            <section className="sv-conflict">
              {reviewing && (
                <>
                  <ReadState loading={current.loading} error={current.error} retry={current.reload} />
                  {latest && !current.loading && !current.error && (
                    <>
                      <dl>
                        <dt>Current stage and site</dt>
                        <dd>
                          {stageLabel(latest.status)} · {label(latest.site)}
                        </dd>
                        <dt>Current revision</dt>
                        <dd>{latest.version}</dd>
                        <dt>Priority and reason</dt>
                        <dd>
                          {latest.priority}: {latest.priority_reason}
                        </dd>
                        <dt>Request owner</dt>
                        <dd>{latest.owner_name}</dd>
                        <dt>Next action</dt>
                        <dd>{latest.next_action}</dd>
                        <dt>Clarification</dt>
                        <dd>{latest.clarification_activity?.status ?? "None"}</dd>
                      </dl>
                      <Button
                        disabled={!latest.can_edit_intake}
                        onClick={() => {
                          setExpected(latest.version);
                          setBasis(latest);
                          setActivityVersion(latest.clarification_activity?.version);
                          cmd.clear();
                          setReviewing(false);
                        }}
                      >
                        Keep my entries against revision {latest.version}
                      </Button>
                    </>
                  )}
                </>
              )}
            </section>
          )}
          <fieldset disabled={cmd.busy || !!(cmd.error as Failure | null)?.retryable}>
            <section className="sv-form-section">
              <h3>Response decision</h3>
              {basis.status === "NeedsInformation" &&
                field(
                  "clarification_outcome",
                  "Clarification outcome",
                  "Record the customer’s answer or your finding.",
                )}
              <div className="sv-two-fields">
                <EnumField
                  name="priority"
                  label="Reviewed priority"
                  value={v.priority}
                  onChange={(value) => set("priority", value)}
                  values={["Low", "Normal", "High", "Urgent"]}
                />
                <SelectField
                  name="triage_owner_id"
                  label="Request owner"
                  required
                  value={v.triage_owner_id}
                  onChange={(value) => set("triage_owner_id", value)}
                  options={owners.data?.items ?? []}
                />
              </div>
              {field("priority_reason", "Priority reason", "Why this priority. Urgent priority bypasses no control.")}
              {field(
                "next_action",
                "Next action",
                "What the owner does next. Work, coverage and visits are decided on the work order.",
              )}
              {field("reason", "Reason for this triage action")}
              {completeActivity && (
                <p className="sv-note">Saving also completes your linked clarification activity with this outcome.</p>
              )}
              {basis.status === "NeedsInformation" &&
                basis.clarification_activity?.status !== "Completed" &&
                !completeActivity && (
                  <p className="sv-unknown">The clarification’s current owner must complete it before triage.</p>
                )}
            </section>
          </fieldset>
        </ValidationFields>
        <ReadState loading={owners.loading} error={owners.error} retry={owners.reload} />
      </div>
      <footer className="sv-savebar">
        <small>
          Completing triage moves this request to Triaged (revision {expected + 1}). It authorises no work and books no
          visit.
        </small>
        <Button onClick={cancel} disabled={cmd.busy || !!(cmd.error as Failure | null)?.retryable}>
          Cancel
        </Button>
        <Button
          className="sv-info-action"
          onClick={onInformation}
          disabled={dirty || cmd.busy || basis.status !== "New"}
        >
          Request information
        </Button>
        {conflict ? (
          <Button variant="primary" onClick={() => setReviewing(true)} disabled={reviewing && current.loading}>
            Review changes
          </Button>
        ) : (
          <Button
            type="submit"
            variant="primary"
            busy={cmd.busy}
            disabled={reviewing || owners.loading || !!owners.error}
          >
            Complete triage
          </Button>
        )}
      </footer>
      {discard && (
        <ServiceDialog title="Discard triage entries?" onClose={() => setDiscard(false)}>
          <p>Your saved request is unchanged.</p>
          <footer>
            <Button onClick={() => setDiscard(false)}>Keep editing</Button>
            <Button variant="danger" onClick={onCancel}>
              Discard entries
            </Button>
          </footer>
        </ServiceDialog>
      )}
    </form>
  );
}
export type TicketStatementDraft = {
  body: string;
  source_label: string;
  occurred_at: string;
  channel: string;
  reason: string;
};
function StatementForm({
  t,
  onSaved,
  onCancel,
  initial,
}: {
  t: Intake;
  onSaved: () => void;
  onCancel: () => void;
  initial?: TicketStatementDraft;
}) {
  const cmd = useCommand(),
    [id] = useState(() => crypto.randomUUID()),
    [body, setBody] = useState(initial?.body ?? ""),
    [source, setSource] = useState(initial?.source_label ?? ""),
    [when, setWhen] = useState(initial?.occurred_at ?? new Date().toISOString()),
    [channel, setChannel] = useState(initial?.channel ?? t.channel),
    [reason, setReason] = useState(initial?.reason ?? ""),
    [expected, setExpected] = useState(t.version),
    [comparing, setComparing] = useState(false);
  const current = useResource<Envelope<Intake>>(comparing ? `service/tickets/${t.id}` : null),
    latest = current.data?.items[0];
  const conflict = (cmd.error as Failure | null)?.code === "VersionConflict",
    uncertain = !!(cmd.error as Failure | null)?.retryable;
  const cancel = () => {
    if (cmd.busy || uncertain) return;
    if ((body || source || reason) && !window.confirm("Discard this unsaved customer statement?")) return;
    onCancel();
  };
  useUnsavedChanges(!!body || !!source || !!reason, cmd.busy);
  return (
    <form
      data-save-uncertain={uncertain || undefined}
      onSubmit={async (e) => {
        e.preventDefault();
        if (
          await cmd.send(`service/tickets/${t.id}/statements`, {
            id,
            expected_version: expected,
            body,
            source_label: source,
            occurred_at: when,
            channel,
            reason,
          })
        )
          onSaved();
      }}
    >
      <div className="sv-form-scroll">
        <p>
          Keep the customer’s words as reported symptoms. This does not change the priority, request owner or stage.
        </p>
        <ValidationFields error={cmd.error}>
          <ErrorNotice error={cmd.error} />
          {conflict && (
            <div className="sv-conflict">
              <p>Your statement is kept. Review the current request before recording it against a newer revision.</p>
              <Button onClick={() => setComparing(true)}>Review changes</Button>
              {comparing && (
                <>
                  <ReadState loading={current.loading} error={current.error} retry={current.reload} />
                  {latest && !current.loading && !current.error && (
                    <>
                      <p>
                        Revision {latest.version} · {stageLabel(latest.status)} · {latest.priority} ·{" "}
                        {latest.owner_name}
                      </p>
                      <Button
                        disabled={!latest.can_record_statement}
                        onClick={() => {
                          setExpected(latest.version);
                          cmd.clear();
                          setComparing(false);
                        }}
                      >
                        Keep statement against revision {latest.version}
                      </Button>
                    </>
                  )}
                </>
              )}
            </div>
          )}
          <fieldset disabled={cmd.busy || uncertain}>
            <Field
              name="body"
              label="Customer statement"
              value={body}
              onChange={setBody}
              required
              multiline
              maxLength={10000}
            />
            <Field
              name="source_label"
              label="Who said this?"
              value={source}
              onChange={setSource}
              required
              maxLength={200}
            />
            <LocalDateTimeField name="occurred_at" label="When was it said?" value={when} onChange={setWhen} />
            <EnumField
              name="channel"
              label="Channel"
              value={channel}
              onChange={setChannel}
              values={["Phone", "Email", "Manual", "PlannedMaintenance", "Other"]}
            />
            <Field
              name="reason"
              label="Reason for recording"
              value={reason}
              onChange={setReason}
              required
              maxLength={1000}
            />
          </fieldset>
        </ValidationFields>
      </div>
      <footer className="sv-savebar">
        <Button onClick={cancel} disabled={cmd.busy || uncertain}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" busy={cmd.busy} disabled={conflict || comparing}>
          Record statement
        </Button>
      </footer>
    </form>
  );
}
function LinkedWork({ order, active }: { order: Intake["work_orders"][number]; active: boolean }) {
  const r = useResource<
      Envelope<{
        summary?: string;
        blockers: { message: string }[];
        visits: { id: string; display_number: string; status: string }[];
      }>
    >(active ? `service/work-orders/${order.id}` : null),
    w = r.data?.items[0];
  return (
    <section className="sv-decision sv-work-card">
      <header>
        <h2>
          <ProductIcon name="work" />
          {order.display_number}
        </h2>
        <span className="sv-tag">{order.status}</span>
      </header>
      <p>Work orders own scope, authorisation, coverage and visits. This request keeps its own stage.</p>
      <ReadState loading={r.loading} error={r.error} retry={r.reload} />
      {w && !r.error && !r.loading && (
        <>
          <div className="sv-decision-row">
            <ProductIcon name="warning" />
            <div>
              <strong>
                Authorisation:{" "}
                {order.status === "Authorised"
                  ? "authorised"
                  : w.blockers.length
                    ? `blocked · ${w.blockers.length} items`
                    : "ready for review"}
              </strong>
              {w.blockers.map((b, i) => (
                <small key={i}>{b.message}</small>
              ))}
            </div>
            <Link href={`/service/work-orders/${order.id}`}>Open work order</Link>
          </div>
          <div className="sv-decision-row">
            <ProductIcon name="calendar" />
            <div>
              <strong>Visits: {w.visits.length ? w.visits.length : "none proposed"}</strong>
              {w.visits.map((v) => (
                <small key={v.id}>
                  {v.display_number} · {v.status}
                </small>
              ))}
            </div>
            <Link href="/schedule">Open planner</Link>
          </div>
        </>
      )}
      <h2 className="sv-check-title">Who owns what</h2>
      <div className="sv-checks">
        <div>
          <section>
            <strong>Request</strong>
            <p>Service requests · the request owner keeps the customer informed.</p>
          </section>
        </div>
        <div>
          <section>
            <strong>Work order: {order.status}</strong>
            <p>Service operations · scope, authorisation and coverage.</p>
          </section>
        </div>
        <div>
          <section>
            <strong>Visits</strong>
            <p>Schedule · bookings and crew. Parts readiness is assessed through the work order.</p>
          </section>
        </div>
      </div>
    </section>
  );
}
function RecordBody({ t, reload, snapshot = false }: { t: Intake; reload: () => void; snapshot?: boolean }) {
  const params = useSearchParams(),
    router = useRouter();
  const sequence = (params.get("sequence") ?? "")
      .split(",")
      .filter((id) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id))
      .slice(0, 25),
    position = sequence.indexOf(t.id);
  const go = (offset: number) =>
    router.push(`/service/tickets/${sequence[position + offset]}?sequence=${sequence.join(",")}`);
  usePublishRecordIdentity(snapshot ? null : t.display_number, t.summary);
  const [tab, setTab] = useState("triage"),
    [mode, setMode] = useState<"triage" | "details" | "information" | "statement" | null>(null);
  const statements = useResource<Awaited<ReturnType<typeof ticketStatements>>>(
    tab === "updates" || tab === "reported" ? `service/tickets/${t.id}/statements` : null,
  );
  const saved = () => {
    setMode(null);
    reload();
    statements.reload();
  };
  usePhoneHeader(
    snapshot
      ? null
      : {
          title: t.summary,
          record: {
            position: `${t.display_number} · revision ${t.version}`,
            previous:
              position >= 0
                ? {
                    label: "Previous request",
                    disabled: position === 0,
                    onSelect: () => go(-1),
                  }
                : undefined,
            next:
              position >= 0
                ? {
                    label: "Next request",
                    disabled: position === sequence.length - 1,
                    onSelect: () => go(1),
                  }
                : undefined,
          },
        },
  );
  const a = t.clarification_activity,
    overdue = !!a?.due_at && new Date(a.due_at) < new Date() && ["Open", "InProgress"].includes(a.status);
  const checks = [
    { name: "Site identified", pass: !!t.site_id, value: label(t.site) },
    {
      name: "Equipment identified",
      pass: !!t.asset_id,
      value: t.asset_id ? label(t.asset) : "Not recorded — optional for triage",
    },
    {
      name: "Impact and backup recorded",
      pass: !!t.impact,
      value: t.impact ?? "Not recorded",
    },
    {
      name: "Priority and its reason",
      pass: !!t.priority_reason,
      value: t.priority + ": " + (t.priority_reason ?? "Not recorded"),
    },
    {
      name: "Clarification answered",
      pass: t.status !== "NeedsInformation" || a?.status === "Completed",
      value:
        t.status !== "NeedsInformation" ? "No open clarification" : (a?.outcome ?? "The customer has not answered"),
    },
  ];
  const actions = (
    <>
      <Button onClick={() => setMode("details")} disabled={!t.can_edit_intake || mode === "triage"}>
        Update details
      </Button>
      {t.status === "Triaged" && t.work_orders[0] ? (
        <ButtonLink variant="primary" href={`/service/work-orders/${t.work_orders[0].id}`}>
          Open work order
        </ButtonLink>
      ) : (
        <Button variant="primary" onClick={() => setMode("triage")} disabled={!t.can_edit_intake || mode === "triage"}>
          Complete triage
        </Button>
      )}
    </>
  );
  return (
    <>
      <header className="sv-record-header">
        <div className="sv-record-back">
          <Link href="/service/tickets">Service requests</Link>
          {position >= 0 && (
            <span>
              {position + 1} of {sequence.length}{" "}
              <Button aria-label="Previous request" disabled={position === 0} onClick={() => go(-1)}>
                ↑
              </Button>
              <Button aria-label="Next request" disabled={position === sequence.length - 1} onClick={() => go(1)}>
                ↓
              </Button>
            </span>
          )}
          {snapshot && <ButtonLink href={`/service/tickets/${t.id}`}>Open record</ButtonLink>}
        </div>
        <div className="sv-record-title">
          <h1>{t.summary}</h1>
          <span className="sv-tag">{stageLabel(t.status)}</span>
          <div className="sv-record-actions">
            {actions}
            <details>
              <summary aria-label="More request actions">…</summary>
              <Button onClick={() => setMode("statement")} disabled={!t.can_record_statement || mode === "triage"}>
                Record customer statement
              </Button>
              <Button onClick={() => setMode("information")} disabled={!t.can_edit || mode === "triage"}>
                Request information
              </Button>
            </details>
          </div>
        </div>
        <p>
          {t.display_number} · {t.owner_name} · Request owner · Received {stamp(t.received_at)} by{" "}
          {channelLabel(t.channel).toLowerCase()} · revision {t.version}
        </p>
      </header>
      <div className="sv-phone-status">
        <span className="sv-tag">{stageLabel(t.status)}</span>
        {overdue && <span className="sv-unknown">Clarification overdue</span>}
      </div>
      <div className="sv-readiness" aria-label="Triage readiness">
        <strong>Before triage</strong>
        {checks.map((c) => (
          <span key={c.name} className={c.pass ? "sv-pass" : "sv-unknown"}>
            <ProductIcon name={c.pass ? "check" : "warning"} />
            {c.name}
          </span>
        ))}
      </div>
      <div className="sv-record-columns">
        <aside className="sv-details-desktop">
          <DetailFields t={t} />
        </aside>
        <div className="sv-record-main">
          <RecordTabs
            id="sv-record"
            label="Request views"
            disabled={mode === "triage"}
            value={mode === "triage" ? "triage" : tab}
            onChange={setTab}
            tabs={[
              { id: "details", label: "Details" },
              { id: "triage", label: "Triage" },
              { id: "reported", label: "Reported issue" },
              { id: "linked", label: `Linked work (${t.work_orders.length})` },
              { id: "updates", label: "Updates" },
              { id: "history", label: "History" },
            ]}
          />
          {mode === "triage" ? (
            <div
              className="sv-triage-panel"
              role="tabpanel"
              id="sv-record-panel-triage"
              aria-labelledby="sv-record-tab-triage"
            >
              <TriageForm
                t={t}
                onSaved={saved}
                onCancel={() => setMode(null)}
                onInformation={() => setMode("information")}
              />
            </div>
          ) : (
            <div className="sv-record-scroll">
              <RecordPanel id="sv-record" tab="details" value={tab}>
                <DetailFields t={t} />
              </RecordPanel>
              <RecordPanel id="sv-record" tab="triage" value={tab}>
                <section className="sv-decision">
                  <header>
                    <h2>
                      <ProductIcon name={t.status === "Triaged" ? "check" : "warning"} />
                      {stageLabel(t.status)}
                    </h2>
                    {overdue && <span className="sv-tag">1 overdue</span>}
                  </header>
                  <p>
                    {t.status === "Triaged"
                      ? "Triage is complete. Work authorisation, coverage and booking remain separate decisions."
                      : t.status === "NeedsInformation"
                        ? "Triage waits for an answer. Complete triage records how it was resolved and what happens next."
                        : "Review the reported issue and complete the intake checks before triage."}
                  </p>
                  {a && (
                    <div className="sv-decision-row">
                      <ProductIcon name="warning" />
                      <div>
                        <strong>{overdue ? "Clarification overdue" : "Owned clarification"}</strong>
                        <small>
                          {a.owner_name} · {a.due_at ? stamp(a.due_at) : "Due time needed"} · {a.status}
                        </small>
                      </div>
                      <Link href={`/work/${a.id}`}>Open</Link>
                    </div>
                  )}
                  {t.open_questions && (
                    <div className="sv-decision-row">
                      <ProductIcon name="warning" />
                      <div>
                        <strong>Open question</strong>
                        <small>{t.open_questions}</small>
                      </div>
                      <Button variant="quiet" disabled={!t.can_edit_intake} onClick={() => setMode("triage")}>
                        Answer
                      </Button>
                    </div>
                  )}
                  {t.clarification_unavailable && (
                    <p className="sv-unknown">The clarification is outside your activity access.</p>
                  )}
                </section>
                <h2 className="sv-check-title">
                  Triage checks{" "}
                  <small>
                    {checks.filter((c) => c.pass).length} of {checks.length} complete
                  </small>
                </h2>
                <div className="sv-checks">
                  {checks.map((c) => (
                    <div key={c.name} data-pass={c.pass}>
                      <ProductIcon name={c.pass ? "check" : "warning"} />
                      <section>
                        <strong>
                          {c.name}{" "}
                          <span className={c.pass ? "sv-pass" : "sv-unknown"}>{c.pass ? "Pass" : "Unknown"}</span>
                        </strong>
                        <p>{c.value}</p>
                      </section>
                    </div>
                  ))}
                </div>
                {t.triage_blockers
                  .filter(
                    (b) => !["site_id", "impact", "priority_reason", "clarification_activity_id"].includes(b.field),
                  )
                  .map((b) => (
                    <p className="sv-unknown" key={b.field}>
                      {b.message}
                    </p>
                  ))}
                <p className="sv-note">
                  Triage is not authorisation. Work, coverage and visits are decided on the work order.
                </p>
              </RecordPanel>
              <RecordPanel id="sv-record" tab="reported" value={tab}>
                <h2>Reported issue</h2>
                <h3>Original reported symptoms</h3>
                <p className="sv-narrative">{t.symptom}</p>
                <h3>Impact and backup</h3>
                <p className="sv-narrative">{t.impact ?? "Not recorded"}</p>
                <Button onClick={() => setMode("statement")} disabled={!t.can_record_statement}>
                  Record customer statement
                </Button>
              </RecordPanel>
              <RecordPanel id="sv-record" tab="linked" value={tab}>
                <h2>Linked work</h2>
                {t.work_orders.map((w) => (
                  <LinkedWork key={w.id} order={w} active={tab === "linked"} />
                ))}
                {!t.work_orders.length && <p>No visible work order linked.</p>}
                <p className="sv-note">A linked work order has its own readiness and authorisation checks.</p>
              </RecordPanel>
              <RecordPanel id="sv-record" tab="updates" value={tab}>
                <h2>Customer statements</h2>
                <Button onClick={() => setMode("statement")} disabled={!t.can_record_statement}>
                  Record customer statement
                </Button>
                <ReadState loading={statements.loading} error={statements.error} retry={statements.reload} />
                {!statements.loading && !statements.error && statements.data && (
                  <>
                    {statements.data.items.map((s) => (
                      <article className="sv-statement" key={s.id}>
                        <h3>
                          {s.source_label} <span className="sv-tag">Reported symptom</span>
                        </h3>
                        <p className="sv-narrative">{s.body}</p>
                        <small>
                          {stamp(s.occurred_at)} · {channelLabel(s.channel)} · recorded by {s.recorded_by_name} ·
                          revision {s.ticket_version}
                        </small>
                      </article>
                    ))}
                    {!statements.data.items.length && <p>No customer statements recorded.</p>}
                    {statements.data.partial && <p>Showing the latest 100 statements.</p>}
                  </>
                )}
              </RecordPanel>
              <RecordPanel id="sv-record" tab="history" value={tab}>
                <h2>History</h2>
                {t.history.map((e) => (
                  <article className="sv-statement" key={e.id}>
                    <strong>{e.kind.replace(/([a-z])([A-Z])/g, "$1 $2")}</strong>
                    <p>
                      {e.actor_name} · {stamp(e.occurred_at)} · revision {e.record_version}
                    </p>
                  </article>
                ))}
                {!t.history.length && <p>No command history recorded.</p>}
                {t.history_partial && <p>Showing the latest 100 events.</p>}
              </RecordPanel>
            </div>
          )}
        </div>
      </div>
      {!mode && (
        <footer className="sv-phone-actions">
          <Button
            aria-label="Record customer statement"
            disabled={!t.can_record_statement || mode === "triage"}
            onClick={() => setMode("statement")}
          >
            …
          </Button>
          {t.can_edit_intake || (t.status === "Triaged" && t.work_orders.length > 0) ? (
            actions
          ) : (
            <small>
              {t.status === "Triaged"
                ? "Triage complete. No visible work order linked."
                : `View only. Triage needs service request edit permission; ask the request owner, ${t.owner_name}.`}
            </small>
          )}
        </footer>
      )}
      {!t.can_edit_intake && t.status !== "Triaged" && (
        <p className="sv-view-only">
          View only. Request changes from someone with service request edit permission for this site.
        </p>
      )}
      {mode === "statement" && (
        <ServiceDialog title="Record customer statement" onClose={() => setMode(null)}>
          <StatementForm t={t} onSaved={saved} onCancel={() => setMode(null)} />
        </ServiceDialog>
      )}
      {mode === "details" && (
        <ServiceDialog title="Update details" onClose={() => setMode(null)}>
          <IntakeForm ticket={t} reload={saved} />
        </ServiceDialog>
      )}
      {mode === "information" && (
        <ServiceDialog title="Request information" onClose={() => setMode(null)}>
          <TriageActions ticket={t} target="NeedsInformation" reload={saved} />
        </ServiceDialog>
      )}
    </>
  );
}
function SnapshotBody({
  t,
  reload,
  statementDraft,
  onStatementSaved,
  onStatementCancelled,
}: {
  t: Intake;
  reload: () => void;
  statementDraft?: TicketStatementDraft;
  onStatementSaved?: () => void;
  onStatementCancelled?: () => void;
}) {
  const [tab, setTab] = useState("triage"),
    [editing, setEditing] = useState<"triage" | "statement" | "information" | null>(
      statementDraft ? "statement" : null,
    );
  const saved = () => {
    setEditing(null);
    reload();
  };
  if (editing === "statement")
    return (
      <StatementForm
        t={t}
        initial={statementDraft}
        onSaved={onStatementSaved ?? saved}
        onCancel={onStatementCancelled ?? (() => setEditing(null))}
      />
    );
  if (editing === "information")
    return (
      <>
        <Button onClick={() => setEditing(null)}>Back to snapshot</Button>
        <TriageActions ticket={t} reload={saved} target="NeedsInformation" />
      </>
    );
  if (editing === "triage")
    return (
      <TriageForm
        t={t}
        onSaved={() => {
          setEditing(null);
          reload();
        }}
        onCancel={() => setEditing(null)}
        onInformation={() => setEditing("information")}
      />
    );
  return (
    <div className="sv-snapshot-columns">
      <div className="sv-snapshot-summary">
        <div className="sv-form-scroll">
          <h2>{t.summary}</h2>
          <small>
            {t.display_number} · received {stamp(t.received_at)} by {channelLabel(t.channel).toLowerCase()}
          </small>
          <p>
            <span className="sv-tag">{stageLabel(t.status)}</span>
          </p>
          <h3>Summary</h3>
          <p>
            {t.customer?.display_name ?? "Customer not identified"}
            <small>Customer</small>
          </p>
          <p>
            {label(t.site)}
            <small>{t.site_id ? "Site · recorded at intake" : "Site not identified"}</small>
          </p>
          <p>
            {label(t.asset)}
            <small>Equipment</small>
          </p>
          <p>
            {t.owner_name}
            <small>Request owner</small>
          </p>
          <p>
            {t.requester ? label(t.requester) : t.requester_description || "Not identified"}
            <small>Caller</small>
          </p>
          <h3>Reported issue</h3>
          <Button disabled={!t.can_record_statement} onClick={() => setEditing("statement")}>
            Record customer statement
          </Button>
          <p className="sv-narrative">
            {t.symptom}
            <small>Reported symptom · in the customer’s words</small>
          </p>
          <p>
            {t.impact ?? "Impact not recorded"}
            <small>Impact and backup</small>
          </p>
          <p>
            {t.priority}: {t.priority_reason ?? "Priority reason not recorded"}
          </p>
          <p className="sv-snapshot-limit">
            Triage records the intake assessment. Work authorisation, coverage, readiness and booking are separate later
            decisions, made on the work order. Urgent priority bypasses no control.
          </p>
        </div>
        <footer className="sv-savebar">
          <ButtonLink href={`/service/tickets/${t.id}`}>Open request</ButtonLink>

          <Button variant="primary" disabled={!t.can_edit_intake} onClick={() => setEditing("triage")}>
            Complete triage
          </Button>
        </footer>
      </div>
      <div className="sv-snapshot-main">
        <section className="sv-decision">
          <RecordTabs
            id="sv-snapshot"
            label="Snapshot views"
            value={tab}
            onChange={setTab}
            tabs={[
              { id: "triage", label: "Triage" },
              { id: "linked", label: "Linked work" },
            ]}
          />
          <RecordPanel id="sv-snapshot" tab="triage" value={tab}>
            <p>
              Before triage · {t.triage_blockers.length}{" "}
              {t.triage_blockers.length === 1 ? "requirement" : "requirements"} open
            </p>
            {[
              {
                name: "Site identified",
                ok: !!t.site_id,
                value: label(t.site),
              },
              {
                name: "Equipment identified",
                ok: !!t.asset_id,
                value: label(t.asset),
              },
              {
                name: "Impact and priority rationale recorded",
                ok: !!t.impact && !!t.priority_reason,
                value: t.impact ?? "Not recorded",
              },
            ].map((c) => (
              <div className="sv-decision-row" key={c.name}>
                <ProductIcon name={c.ok ? "check" : "warning"} />
                <div>
                  {c.name}
                  <small>{c.value}</small>
                </div>
              </div>
            ))}
            {t.clarification_activity && (
              <div className="sv-decision-row">
                <ProductIcon name="warning" />
                <div>
                  Owned clarification
                  <small>
                    {t.clarification_activity.summary} · {t.clarification_activity.owner_name}
                  </small>
                </div>
              </div>
            )}
            {t.open_questions && (
              <div className="sv-decision-row">
                <ProductIcon name="info" />
                <div>
                  Open question<small>{t.open_questions}</small>
                </div>
              </div>
            )}
          </RecordPanel>
          <RecordPanel id="sv-snapshot" tab="linked" value={tab}>
            {t.work_orders.map((w) => (
              <p key={w.id}>
                <Link href={`/service/work-orders/${w.id}`}>{w.display_number}</Link> · {w.status}
              </p>
            ))}
            {!t.work_orders.length && <p>No visible work order linked.</p>}
          </RecordPanel>
        </section>
        <h2>History</h2>
        <ol className="sv-history">
          {t.history.slice(0, 6).map((h) => (
            <li key={h.id}>
              {h.kind.replace(/([a-z])([A-Z])/g, "$1 $2")}
              <small>
                {stamp(h.occurred_at)} · {h.actor_name}
              </small>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
export function TicketRecord({
  id,
  snapshot = false,
  statementDraft,
  onStatementSaved,
  onStatementCancelled,
}: {
  id: string;
  snapshot?: boolean;
  statementDraft?: TicketStatementDraft;
  onStatementSaved?: () => void;
  onStatementCancelled?: () => void;
}) {
  const r = useResource<Envelope<Intake>>(`service/tickets/${id}`),
    t = r.data?.items[0];
  return (
    <section
      id={snapshot ? undefined : "ppo-service-record"}
      className="sv-record"
      data-module-layout="full-bleed"
      aria-label="Service request"
    >
      <ReadState loading={r.loading} error={r.error} retry={r.reload} />
      {t &&
        !r.loading &&
        !r.error &&
        (snapshot ? (
          <SnapshotBody
            key={t.id}
            t={t}
            reload={r.reload}
            statementDraft={statementDraft}
            onStatementSaved={onStatementSaved}
            onStatementCancelled={onStatementCancelled}
          />
        ) : (
          <RecordBody key={t.id} t={t} reload={r.reload} />
        ))}
    </section>
  );
}
