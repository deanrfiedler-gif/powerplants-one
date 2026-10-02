"use client";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useState, type ReactNode } from "react";
import {
  api,
  PageHeader,
  ReadState,
  Field,
  ErrorNotice,
} from "../components/business-ui";
import { useCrmResource } from "../components/crm-state";
import { useIdentity } from "../components/business-session";
import { useUnsavedChanges } from "../components/record-ui";
import { Button } from "../components/ui/button";
import { useRecoverableCommand } from "../shared/ui/use-recoverable-command";
import type { JournalEntry } from "../shared/lib/command-journal";
import type { readIncident } from "./service";
import { classifications, priorities, type Facts } from "./model";
import "../app/incidents.css";
type View = Awaited<ReturnType<typeof readIncident>>;
type Context = {
  appointment: {
    id: string;
    reference: string;
    work_order: string;
    status: string;
  };
  targets: {
    scope_item_id: string;
    asset_id: string;
    task_description: string;
    display_name: string;
  }[];
  selected: { source_hash: string; known: boolean } | null;
  owners: { id: string; display_name: string }[];
  can_report: boolean;
};
type Send = (fields: Record<string, unknown>) => Promise<boolean>;
const target = (id: string) => `/service/incidents/${id}`;
function accepts(e: JournalEntry) {
  return (
    e.path === "service/incidents" &&
    !!e.record_id &&
    e.target === target(e.record_id) &&
    e.body?.schema_version === 1 &&
    typeof e.body.operation_id === "string" &&
    (e.phase === "accepted" || e.body.id === e.record_id)
  );
}
function Select({
  label,
  value,
  onChange,
  children,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  children: ReactNode;
}) {
  return (
    <label>
      {label}
      <select
        aria-label={label}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {children}
      </select>
    </label>
  );
}
export function IncidentScreen({ mode }: { mode: "list" | "new" | "record" }) {
  const identity = useIdentity();
  return (
    <div id="ppo-incidents" className="incidents" key={identity.actor_id}>
      <PageHeader
        eyebrow="Service · FI-06"
        title="Incidents and corrective actions"
        description="Factual reporting, owned work and independently reviewed scoped outcomes."
      />
      <p>
        Online synthetic workflow. Event classification is not a risk assessment
        or permission to proceed.
      </p>
      <p>
        <Link href="/service/incidents">Incident register</Link> ·{" "}
        <Link href="/my-jobs">My Jobs</Link> ·{" "}
        <Link href="/service/inspections">Inspection review</Link>
      </p>
      {mode === "list" ? (
        <Register />
      ) : mode === "new" ? (
        <Capture />
      ) : (
        <Record />
      )}
    </div>
  );
}
function Register() {
  const r = useCrmResource<{
    items: {
      id: string;
      summary: string;
      state: string;
      classification: string;
      assessment: string;
      priority: string;
      hold: boolean;
      due_at: string | null;
    }[];
    window: string;
  }>("service/incidents", true);
  return (
    <>
      <ReadState loading={r.loading} error={r.error} retry={r.reload} />
      <section className="business-card">
        <h2>Permitted incidents</h2>
        <p>
          Open an assigned visit to report an event with its exact work context.
          Reporting remains available under a hold.
        </p>
        {r.data && (
          <>
            <p>{r.data.window}</p>
            {!r.data.items.length && <p>No permitted incident records.</p>}
            {r.data.items.map((i) => (
              <article key={i.id} className="incident-summary">
                <h3>
                  <Link href={target(i.id)}>{i.summary}</Link>
                </h3>
                <p>
                  {i.classification} · {i.state} · {i.assessment} · {i.priority}
                </p>
                <p>
                  {i.hold ? "Scope held" : "No active hold from this record"} ·
                  Due: {i.due_at ?? "Unassigned"}
                </p>
              </article>
            ))}
          </>
        )}
      </section>
    </>
  );
}
function useCommands(
  key: string,
  enabled: boolean,
  onSaved: (id: string) => void,
) {
  const identity = useIdentity(),
    journalKey = `ppo.incident.${identity.actor_id}.${key}`,
    command = useRecoverableCommand({
      key: journalKey,
      scope: identity,
      accepts,
      transport: api,
      enabled,
      journalLimit: 3_000_000,
    });
  const send: Send = async (fields) => {
    const id = String(fields.id),
      receipt = await command.send(
        "service/incidents",
        fields,
        target(id),
        "Incident command",
        id,
      );
    if (receipt) {
      onSaved(receipt.record_id);
      return true;
    }
    return false;
  };
  const recover = async (retry: boolean) => {
    const receipt = await (retry ? command.retry() : command.recover());
    if (receipt) onSaved(receipt.record_id);
  };
  const panel = (
    <section className="business-card">
      <p role="status">
        {command.busy
          ? "Saving — wait for the server receipt"
          : command.pending
            ? "Uncertain result — recover the unchanged original"
            : command.saved || "Saved server context loaded"}
      </p>
      <p>
        Unsaved input exists only on this page. Incident operations are not
        queued offline. After an interrupted request, the result remains
        uncertain until its original receipt is checked. The recovery copy
        survives reload in this tab; closing the tab removes it.
      </p>
      <ErrorNotice error={command.error} />
      {command.pending && (
        <div className="button-row">
          <Button disabled={command.busy} onClick={() => void recover(false)}>
            Check original receipt
          </Button>
          <Button disabled={command.busy} onClick={() => void recover(true)}>
            Retry unchanged original
          </Button>
        </div>
      )}
    </section>
  );
  return {
    send,
    panel,
    accepted: command.accepted,
    startSeparate: () => {
      sessionStorage.removeItem(journalKey + ":accepted");
      window.location.reload();
    },
    locked: command.busy || !!command.pending || !command.ready || !enabled,
  };
}
const emptyFacts = (): Facts => ({
  classification: "Unknown",
  occurred_at: new Date().toISOString(),
  summary: "",
  observations: "",
  immediate_response: "",
  source_reference: "",
  restricted_details: null,
});
function FactsForm({
  initial,
  send,
  locked,
  label,
  sensitive = true,
  version,
  onDirty,
}: {
  initial: Facts;
  send: (
    facts: Facts,
    reason: string,
    version?: number | string,
  ) => Promise<boolean>;
  locked: boolean;
  label: string;
  sensitive?: boolean;
  version?: number | string;
  onDirty?: (dirty: boolean) => void;
}) {
  const [draft, setDraft] = useState(initial),
    [reason, setReason] = useState(""),
    [dirty, setDirty] = useState(false),
    [originalVersion, setOriginalVersion] = useState(version);
  useUnsavedChanges(dirty, locked && dirty);
  if (!dirty && version !== originalVersion) {
    setOriginalVersion(version);
    setDraft(initial);
  }
  const change = (k: keyof Facts, v: string) => {
    setDraft((d) => ({
      ...d,
      [k]: k === "restricted_details" ? v || null : v,
    }));
    setDirty(true);
    onDirty?.(true);
  };
  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        if (await send(draft, reason, originalVersion)) {
          setDirty(false);
          onDirty?.(false);
        }
      }}
    >
      <fieldset disabled={locked}>
        <legend>Factual event record</legend>
        <p>
          Summary, observations, response and source reference are visible to
          permitted affected users. Keep private information in Restricted
          details or Restricted evidence.
        </p>
        {version !== originalVersion && (
          <p role="alert">
            The saved version changed. Your input is retained. Compare the
            current history before continuing.{" "}
            <Button onClick={() => setOriginalVersion(version)}>
              Use current version for this correction
            </Button>
          </p>
        )}
        <p role="status">
          {dirty ? "Unsaved changes" : "Saved values / new report"}
        </p>
        <div className="incident-fields">
          <Select
            label="Event classification"
            value={draft.classification}
            onChange={(v) => change("classification", v)}
          >
            {classifications.map((v) => (
              <option key={v}>{v}</option>
            ))}
          </Select>
          <Field
            name="occurred_at"
            label="Occurrence time (UTC)"
            value={draft.occurred_at}
            onChange={(v) => change("occurred_at", v)}
            required
          />
          <Field
            name="summary"
            label="Operational summary"
            value={draft.summary}
            onChange={(v) => change("summary", v)}
            maxLength={160}
            required
          />
          <Field
            name="source_reference"
            label="Source reference"
            value={draft.source_reference}
            onChange={(v) => change("source_reference", v)}
            maxLength={600}
            required
          />
        </div>
        <Field
          name="observations"
          label="Factual observations"
          value={draft.observations}
          onChange={(v) => change("observations", v)}
          multiline
          maxLength={4000}
          required
        />
        <Field
          name="immediate_response"
          label="Immediate response already taken"
          value={draft.immediate_response}
          onChange={(v) => change("immediate_response", v)}
          multiline
          maxLength={2000}
          required
        />
        {sensitive && (
          <Field
            name="restricted_details"
            label="Restricted details — reporter and authorised sensitive reviewers"
            value={draft.restricted_details ?? ""}
            onChange={(v) => change("restricted_details", v)}
            multiline
            maxLength={4000}
          />
        )}
        <Field
          name="reason"
          label="Reason for this report or correction"
          value={reason}
          onChange={(v) => {
            setReason(v);
            setDirty(true);
            onDirty?.(true);
          }}
          required
          maxLength={1000}
        />
        <Button type="submit">{label}</Button>
      </fieldset>
    </form>
  );
}
function Capture() {
  const query = useSearchParams(),
    router = useRouter(),
    appointment = query.get("appointment_id"),
    [id] = useState(() => crypto.randomUUID()),
    [selection, setSelection] = useState("");
  const path = appointment
      ? `service/incidents/context?appointment_id=${appointment}`
      : null,
    r = useCrmResource<Context>(path);
  const selected = r.data?.targets.find(
      (x) => `${x.scope_item_id}:${x.asset_id}` === selection,
    ),
    preview = useCrmResource<Context>(
      path && selected
        ? `${path}&scope_item_id=${selected.scope_item_id}&asset_id=${selected.asset_id}`
        : null,
    );
  const command = useCommands(
    `new.${appointment}`,
    !!preview.data?.selected &&
      !!r.data?.can_report &&
      !r.error &&
      !preview.error,
    (saved) => router.push(target(saved)),
  );
  return (
    <>
      <ReadState
        loading={r.loading || preview.loading}
        error={r.error || preview.error}
        retry={() => {
          r.reload();
          preview.reload();
        }}
      />
      {!appointment && (
        <p>Choose Report incident from a permitted appointment.</p>
      )}
      {r.data && (
        <section className="business-card">
          <h2>Report from {r.data.appointment.reference}</h2>
          <p>
            {r.data.appointment.work_order} · {r.data.appointment.status}
          </p>
          <Select
            label="Exact affected scope and equipment"
            value={selection}
            onChange={setSelection}
          >
            <option value="">Choose an exact occurrence</option>
            {r.data.targets.map((x) => (
              <option
                key={`${x.scope_item_id}:${x.asset_id}`}
                value={`${x.scope_item_id}:${x.asset_id}`}
              >
                {x.task_description} · {x.display_name}
              </option>
            ))}
          </Select>
          {preview.data?.selected && !preview.data.selected.known && (
            <p>
              Configuration is unknown. Factual reporting is allowed; closure
              will require assessment.
            </p>
          )}
          {command.panel}
          {command.accepted && (
            <p>
              Saved report recovered.{" "}
              <Link href={target(command.accepted.receipt.record_id)}>
                Open saved incident
              </Link>{" "}
              <Button onClick={command.startSeparate}>
                Begin a separate report
              </Button>
            </p>
          )}
          <FactsForm
            initial={emptyFacts()}
            version={preview.data?.selected?.source_hash}
            locked={command.locked || !!command.accepted}
            label="Save incident draft"
            send={(facts, reason, source_hash) =>
              command.send({
                action: "create",
                id,
                appointment_id: appointment,
                scope_item_id: selected?.scope_item_id,
                asset_id: selected?.asset_id,
                source_hash,
                facts,
                reason,
              })
            }
          />
        </section>
      )}
    </>
  );
}
function Record() {
  const params = useParams<{ id: string }>(),
    id = params.id,
    r = useCrmResource<View>(`service/incidents/${id}`),
    [editing, setEditing] = useState<string | null>(null);
  const command = useCommands(id, !!r.data && !r.error, () => {
    setEditing(null);
    r.reload();
  });
  const v = r.data,
    otherLocked = command.locked || !!editing;
  const mark = (section: string) => (dirty: boolean) =>
    setEditing(dirty ? section : null);
  const send: Send = (fields) =>
    command.send({ id, expected_version: v?.row.version, ...fields });
  return (
    <>
      <ReadState loading={r.loading} error={r.error} retry={r.reload} />
      {r.error && (
        <p>
          Last-known context only. Current incident authority is unavailable;
          incident operations are not queued offline.
        </p>
      )}
      {v && (
        <>
          <section className="business-card">
            <h2>{v.row.facts.summary}</h2>
            <p>
              {v.row.state} · {v.row.assessment} · {v.row.priority} · Version{" "}
              {v.row.version}
            </p>
            <p>
              Reporter {v.context.reporter} · Reported{" "}
              {String(v.row.reported_at)}
            </p>
            <p>
              {v.context.work_order} · {v.context.appointment} ·{" "}
              {v.context.site}
              <br />
              {v.context.task} · Equipment{" "}
              <Link href={`/equipment/${v.binding.asset_id}`}>
                {v.binding.asset_id}
              </Link>
            </p>
            <p>
              <Link href={`/my-jobs/${v.row.appointment_id}`}>
                Affected visit
              </Link>{" "}
              ·{" "}
              <Link
                href={`/my-jobs/inspections?appointment_id=${v.row.appointment_id}`}
              >
                Inspection capture / retest
              </Link>{" "}
              ·{" "}
              <Link
                href={`/service/inspections?appointment_id=${v.row.appointment_id}`}
              >
                Independent inspection review
              </Link>
            </p>
            <p className="incident-notice">
              {v.operational_hold
                ? "Scope hold active. Factual reporting and corrective inspection evidence remain available. Existing attendance and equipment have not been stopped."
                : "This record imposes no current hold. Recheck every receiving-domain restriction."}
            </p>
            <p>
              {v.source_current
                ? "Exact source binding is current"
                : "Source reassessment required — retained facts remain available"}
            </p>
            {command.panel}
            <Button onClick={r.reload} disabled={command.locked}>
              Refresh saved record
            </Button>
          </section>
          <section className="business-card">
            <h2>Observations and corrections</h2>
            {v.duties.save && v.row.state !== "Closed" ? (
              <FactsForm
                initial={v.row.facts}
                version={v.row.version}
                onDirty={mark("facts")}
                sensitive={v.sensitive}
                locked={command.locked || (!!editing && editing !== "facts")}
                label="Save factual correction"
                send={(facts, reason, expected_version) =>
                  send({ action: "save", facts, reason, expected_version })
                }
              />
            ) : (
              <>
                <p>{v.row.facts.observations}</p>
                <p>Immediate response: {v.row.facts.immediate_response}</p>
                <p>Source: {v.row.facts.source_reference}</p>
                {v.sensitive && (
                  <p>
                    Restricted details:{" "}
                    {v.row.facts.restricted_details ?? "None recorded"}
                  </p>
                )}
              </>
            )}
            {v.duties.submit &&
              ["Draft", "Returned", "ClarificationRequired"].includes(
                v.row.state,
              ) && (
                <Button
                  disabled={otherLocked}
                  onClick={() =>
                    void send({
                      action: "submit",
                      reason: "Submit factual report for independent triage",
                    })
                  }
                >
                  Submit report
                </Button>
              )}
          </section>
          {v.row.state !== "Draft" && (
            <ReviewControls
              view={v}
              send={send}
              locked={command.locked || (!!editing && editing !== "review")}
              onDirty={mark("review")}
            />
          )}
          <EvidenceForm
            view={v}
            send={send}
            locked={command.locked || (!!editing && editing !== "evidence")}
            onDirty={mark("evidence")}
          />
          <section className="business-card">
            <h2>Owned corrective actions</h2>
            {!v.actions.length && <p>No corrective actions assigned.</p>}
            {v.actions.map((a) => (
              <article key={a.id} className="incident-summary">
                <h3>{a.instruction}</h3>
                <p>
                  <Link href={`/work/${a.activity_id}`}>Open Activity</Link> ·{" "}
                  {a.activity.status} · Owner {a.activity.owner_id} · Due{" "}
                  {String(a.activity.due_at)}
                  {a.activity.overdue
                    ? " · Overdue — owner follow-up required"
                    : ""}
                </p>
                <p>
                  {a.assignment_current
                    ? "Assignment matches the incident"
                    : "Activity assignment changed — incident reviewer must adopt it"}{" "}
                  ·{" "}
                  {a.accepted_evidence_id
                    ? "Evidence independently accepted"
                    : "Evidence awaiting acceptance"}
                </p>
                {!a.assignment_current && v.duties.adopt_assignment && (
                  <Button
                    disabled={otherLocked}
                    onClick={() =>
                      void send({
                        action: "adopt_assignment",
                        action_id: a.id,
                        activity_version: a.activity.version,
                        reason:
                          "Adopt current receiving Activity assignment and require fresh evidence acceptance",
                      })
                    }
                  >
                    Adopt current Activity assignment
                  </Button>
                )}
                {v.duties.accept_action &&
                  v.evidence
                    .filter((e) => e.action_id === a.id)
                    .map((e) => (
                      <Button
                        key={e.id}
                        disabled={otherLocked || v.row.state === "Closed"}
                        onClick={() =>
                          void send({
                            action: "accept_action",
                            action_id: a.id,
                            evidence_id: e.id,
                            reason:
                              "Independently reviewed exact corrective evidence",
                          })
                        }
                      >
                        Accept evidence: {e.label}
                      </Button>
                    ))}
              </article>
            ))}
          </section>
          <section className="business-card">
            <h2>Retained evidence</h2>
            {v.evidence.map((e) => (
              <p key={e.id}>
                <a
                  href={`/api/v1/service/incidents/${id}/files?evidence_id=${e.id}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  {e.label}
                </a>{" "}
                · {e.audience} · {e.byte_count} bytes · SHA-256 {e.content_hash}{" "}
                · {e.added_by} · {String(e.added_at)}
              </p>
            ))}
          </section>
          <section className="business-card">
            <h2>Reviewed scoped outcomes</h2>
            {!v.outputs.length && <p>No issued incident outcome.</p>}
            {v.outputs.map((o) => (
              <article key={o.id}>
                <p>
                  {o.current
                    ? "Current incident closure"
                    : "Historical output — current applicability withdrawn"}
                </p>
                <p>
                  <a
                    href={`/api/v1/service/incidents/${id}/files?output_id=${o.id}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Exact HTML outcome
                  </a>{" "}
                  ·{" "}
                  <a
                    href={`/api/v1/service/incidents/${id}/files?output_id=${o.id}&format=pdf`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Exact PDF outcome
                  </a>
                </p>
              </article>
            ))}
          </section>
          <section className="business-card">
            <h2>Original report and retained history</h2>
            {v.row.repeated_report_id && (
              <p>
                Related repeated report:{" "}
                <Link href={target(v.row.repeated_report_id)}>
                  {v.row.repeated_report_id}
                </Link>
                . Both obligations remain independent.
              </p>
            )}
            {v.row.defect_id && (
              <p>
                Linked inspection defect {v.row.defect_id}; correction, retest
                and technical acceptance remain in inspections.
              </p>
            )}
            {v.events.map((e) => (
              <details key={e.id}>
                <summary>
                  Version {e.version} · {e.action} · {String(e.recorded_at)}
                </summary>
                <p>Actor {e.actor_id}</p>
                {e.reason && <p>Reason: {e.reason}</p>}
                <p>{e.facts.observations}</p>
                <p>{e.facts.immediate_response}</p>
                {e.facts.restricted_details && (
                  <p>Restricted: {e.facts.restricted_details}</p>
                )}
              </details>
            ))}
          </section>
        </>
      )}
    </>
  );
}
function ReviewControls({
  view: v,
  send,
  locked,
  onDirty,
}: {
  view: View;
  send: Send;
  locked: boolean;
  onDirty: (dirty: boolean) => void;
}) {
  const c = useCrmResource<Context>(
      `service/incidents/context?appointment_id=${v.row.appointment_id}`,
      true,
    ),
    [reason, setReason] = useState(""),
    [owner, setOwner] = useState(v.row.owner_id ?? ""),
    [due, setDue] = useState(v.row.due_at ? String(v.row.due_at) : ""),
    [priority, setPriority] = useState<string>(v.row.priority),
    [instruction, setInstruction] = useState(""),
    [repeated, setRepeated] = useState(v.row.repeated_report_id ?? ""),
    [defect, setDefect] = useState(v.row.defect_id ?? ""),
    [scopeSelection, setScopeSelection] = useState(
      `${v.binding.scope_item_id}:${v.binding.asset_id}`,
    );
  const selected = c.data?.targets.find(
    (t) => `${t.scope_item_id}:${t.asset_id}` === scopeSelection,
  );
  const preview = useCrmResource<Context>(
    selected
      ? `service/incidents/context?appointment_id=${v.row.appointment_id}&scope_item_id=${selected.scope_item_id}&asset_id=${selected.asset_id}`
      : null,
    true,
  );
  const [dirty, setDirty] = useState(false),
    [version, setVersion] = useState(v.row.version);
  useUnsavedChanges(dirty, locked && dirty);
  if (!dirty && version !== v.row.version) setVersion(v.row.version);
  const decision = async (
    action: string,
    fields: Record<string, unknown> = {},
  ) => {
    if (await send({ action, reason, expected_version: version, ...fields })) {
      setDirty(false);
      onDirty(false);
    }
  };
  return (
    <section className="business-card">
      <h2>Triage and independent review</h2>
      <ReadState loading={c.loading} error={c.error} retry={c.reload} />
      <fieldset
        disabled={locked}
        onChange={() => {
          setDirty(true);
          onDirty(true);
        }}
      >
        <legend>Reasoned decisions</legend>
        {version !== v.row.version && (
          <p role="alert">
            Saved record changed. Compare its current facts and history.{" "}
            <Button onClick={() => setVersion(v.row.version)}>
              Use current version for this review
            </Button>
          </p>
        )}
        <Field
          name="review-reason"
          label="Review or closure reason"
          value={reason}
          onChange={setReason}
          maxLength={1000}
          required
        />
        {v.duties.triage && v.row.state !== "Closed" && (
          <>
            <div className="incident-fields">
              <Select
                label="Accountable or action owner"
                value={owner}
                onChange={setOwner}
              >
                <option value="">Choose owner</option>
                {c.data?.owners.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.display_name}
                  </option>
                ))}
              </Select>
              <Field
                name="due_at"
                label="Due time (UTC)"
                value={due}
                onChange={setDue}
                required
              />
              <Select
                label="Synthetic priority"
                value={priority}
                onChange={setPriority}
              >
                {priorities.map((x) => (
                  <option key={x}>{x}</option>
                ))}
              </Select>
            </div>
            <Button
              onClick={() =>
                void decision("triage", {
                  owner_id: owner,
                  due_at: due,
                  priority,
                  assessment: "Assessed",
                  hold: true,
                })
              }
            >
              Assess and retain scope hold
            </Button>
            <div className="button-row">
              {["Returned", "ClarificationRequired", "OnHold", "InReview"].map(
                (x) => (
                  <Button
                    key={x}
                    onClick={() => void decision("review", { decision: x })}
                  >
                    {x === "Returned"
                      ? "Return for correction"
                      : x === "ClarificationRequired"
                        ? "Request clarification"
                        : x === "OnHold"
                          ? "Hold review"
                          : "Continue review"}
                  </Button>
                ),
              )}
            </div>
            <Field
              name="instruction"
              label="Operational corrective instruction"
              value={instruction}
              onChange={setInstruction}
              multiline
              maxLength={2000}
            />
            <Button
              onClick={() =>
                void decision("action", {
                  action_id: crypto.randomUUID(),
                  owner_id: owner,
                  due_at: due,
                  instruction,
                })
              }
            >
              Create owned corrective Activity
            </Button>
            <Field
              name="repeat-id"
              label="Related repeated report ID (optional)"
              value={repeated}
              onChange={setRepeated}
            />
            <Field
              name="defect-id"
              label="Exact linked inspection defect ID (optional)"
              value={defect}
              onChange={setDefect}
            />
            <Button
              onClick={() =>
                void decision("link", {
                  repeated_report_id: repeated || null,
                  defect_id: defect || null,
                })
              }
            >
              Save explicit source links
            </Button>
            {!v.source_current && (
              <>
                <Select
                  label="Reassessed exact scope and equipment"
                  value={scopeSelection}
                  onChange={setScopeSelection}
                >
                  <option value="">Choose current scope</option>
                  {c.data?.targets.map((t) => (
                    <option
                      key={`${t.scope_item_id}:${t.asset_id}`}
                      value={`${t.scope_item_id}:${t.asset_id}`}
                    >
                      {t.task_description} � {t.display_name}
                    </option>
                  ))}
                </Select>
                <Button
                  disabled={!preview.data?.selected}
                  onClick={() =>
                    void decision("rebind", {
                      scope_item_id: selected?.scope_item_id,
                      asset_id: selected?.asset_id,
                      source_hash: preview.data?.selected?.source_hash,
                    })
                  }
                >
                  Rebind reviewed current sources
                </Button>
              </>
            )}
          </>
        )}
        <div className="button-row">
          {v.duties.accept && v.row.state !== "Closed" && (
            <Button onClick={() => void decision("accept")}>
              Accept exact closure evidence
            </Button>
          )}
          {v.duties.close && v.row.state === "Accepted" && (
            <Button onClick={() => void decision("close")}>
              Close and issue scoped outcome
            </Button>
          )}
          {v.duties.reopen && v.row.state === "Closed" && (
            <Button onClick={() => void decision("reopen")}>
              Reopen and restore scope hold
            </Button>
          )}
        </div>
      </fieldset>
      <p>
        Task completion does not accept evidence or close this incident. Closure
        never resolves an inspection defect or clears unrelated restrictions.
      </p>
    </section>
  );
}
function EvidenceForm({
  view: v,
  send,
  locked,
  onDirty,
}: {
  view: View;
  send: Send;
  locked: boolean;
  onDirty: (dirty: boolean) => void;
}) {
  const [action, setAction] = useState(""),
    [audience, setAudience] = useState("Operational"),
    [label, setLabel] = useState(""),
    [error, setError] = useState<unknown>(null),
    [file, setFile] = useState<File | null>(null),
    [reason, setReason] = useState("");
  const [dirty, setDirty] = useState(false),
    [version, setVersion] = useState(v.row.version);
  useUnsavedChanges(dirty, locked && dirty);
  if (!dirty && version !== v.row.version) setVersion(v.row.version);
  if (!v.duties.evidence || v.row.state === "Closed") return null;
  return (
    <section className="business-card">
      <h2>Append original evidence</h2>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          setError(null);
          try {
            if (
              !file ||
              !["image/png", "text/plain"].includes(file.type) ||
              file.size > (file.type === "text/plain" ? 65536 : 2097152)
            )
              throw Error(
                "Choose a verified PNG up to 2 MiB or plain text up to 64 KiB.",
              );
            const bytes = new Uint8Array(await file.arrayBuffer()),
              digest = await crypto.subtle.digest("SHA-256", bytes),
              sha256 = Array.from(new Uint8Array(digest), (b) =>
                b.toString(16).padStart(2, "0"),
              ).join("");
            let binary = "";
            for (const b of bytes) binary += String.fromCharCode(b);
            if (
              await send({
                action: "evidence",
                expected_version: version,
                evidence_id: crypto.randomUUID(),
                action_id: action || null,
                audience,
                label,
                media_type: file.type,
                byte_count: bytes.length,
                sha256,
                content_base64: btoa(binary),
                reason,
              })
            ) {
              setDirty(false);
              onDirty(false);
            }
          } catch (e) {
            setError({
              message:
                e instanceof Error
                  ? e.message
                  : "Evidence could not be prepared.",
            });
          }
        }}
      >
        <fieldset
          disabled={locked}
          onChange={() => {
            setDirty(true);
            onDirty(true);
          }}
        >
          <legend>Original file and association</legend>
          {version !== v.row.version && (
            <p role="alert">
              Saved record changed. Verify the file association before
              continuing.{" "}
              <Button onClick={() => setVersion(v.row.version)}>
                Use current version for this evidence
              </Button>
            </p>
          )}
          <Select label="Evidence for" value={action} onChange={setAction}>
            <option value="">Original incident report</option>
            {v.actions.map((a) => (
              <option key={a.id} value={a.id}>
                {a.instruction}
              </option>
            ))}
          </Select>
          <Select
            label="Evidence audience"
            value={audience}
            onChange={setAudience}
          >
            <option>Operational</option>
            {v.sensitive && <option>Restricted</option>}
          </Select>
          <Field
            name="evidence-label"
            label="Evidence label"
            value={label}
            onChange={setLabel}
            required
          />
          <label>
            Original PNG or plain-text file
            <input
              type="file"
              accept="image/png,text/plain"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
          </label>
          <p>
            PNG up to 2 MiB; plain UTF-8 text up to 64 KiB. Original bytes are
            retained. Corrections append a new file.
          </p>
          <Field
            name="evidence-reason"
            label="Evidence reason"
            value={reason}
            onChange={setReason}
            required
          />
          <Button type="submit">Save original evidence</Button>
          <ErrorNotice error={error} />
        </fieldset>
      </form>
    </section>
  );
}
