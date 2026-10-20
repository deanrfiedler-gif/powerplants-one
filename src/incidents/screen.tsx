"use client";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Fragment, useRef, useState, type ReactNode } from "react";
import { api, ReadState, Field, ErrorNotice } from "../components/business-ui";
import { useCrmResource } from "../components/crm-state";
import { useIdentity } from "../components/business-session";
import {
  useUnsavedChanges,
  LocalDateTimeField,
  RecordTabs,
  RecordPanel,
} from "../components/record-ui";
import { ButtonLink } from "../components/ui/button";
import {
  SharedRecord,
  RecordFactSection,
} from "../components/ui/shared-record";
import { ProductIcon } from "../components/product-icons";
import { usePhoneHeader } from "../shell/phone-header";
import { RecordIdentity } from "../shell/record-identity";
import { IncidentRegister } from "./register";
import {
  IncidentSection,
  IncidentState,
  SubmitIncident,
  useIncidentOnline,
} from "./parts";
import { incidentLabel, incidentTime } from "./presentation";
import { Button } from "../components/ui/button";
import { useRecoverableCommand } from "../shared/ui/use-recoverable-command";
import type { JournalEntry } from "../shared/lib/command-journal";
import type { readIncident } from "./service";
import { priorities, type Facts } from "./model";
import "../app/incidents.css";
import "../app/styles/organisations.css";
type View = Awaited<ReturnType<typeof readIncident>>;
type Context = {
  appointment: {
    id: string;
    reference: string;
    work_order: string;
    status: string;
    timezone: string;
    site: string;
    scheduled_start_at: string;
    scheduled_end_at: string;
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
  disabled = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  children: ReactNode;
  disabled?: boolean;
}) {
  return (
    <label>
      {label}
      <select
        disabled={disabled}
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
  return mode === "list" ? (
    <IncidentRegister key={identity.actor_id} />
  ) : (
    <div
      id="ppo-incidents"
      className="incidents"
      key={identity.actor_id}
      data-module-layout="full-bleed"
    >
      {mode === "new" ? <Capture /> : <Record />}
    </div>
  );
}
function useCommands(
  key: string,
  enabled: boolean,
  onSaved: (id: string) => void,
) {
  const online = useIncidentOnline();
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
  const panel = (!online ||
    command.busy ||
    !!command.pending ||
    !!command.error) && (
    <section className="fi06-command" aria-label="Incident save state">
      <p role="status">
        {!online
          ? "Not connected — reports are never queued offline"
          : command.busy
            ? "Saving — wait for the server receipt"
            : command.pending
              ? "We don’t know if your report arrived"
              : command.saved || "Reports save online only"}
      </p>
      <p>
        {command.pending
          ? "Recover sends exactly what you submitted, with the same ID. If it arrived, the original receipt is recovered; nothing is reported twice."
          : "Unsaved changes are only on this screen. Nothing is sent to triage until you submit."}
      </p>
      <ErrorNotice error={command.error} />
      {command.pending && (
        <div className="button-row">
          <Button
            disabled={command.busy || !online}
            onClick={() => void recover(false)}
          >
            Check original receipt
          </Button>
          <Button
            disabled={command.busy || !online}
            onClick={() => void recover(true)}
          >
            Recover the original
          </Button>
        </div>
      )}
    </section>
  );
  return {
    send,
    sendReceipt: (fields: Record<string, unknown>) =>
      command.send(
        "service/incidents",
        fields,
        target(String(fields.id)),
        "Incident command",
        String(fields.id),
      ),
    panel,
    pending: command.pending,
    accepted: command.accepted,
    startSeparate: () => {
      sessionStorage.removeItem(journalKey + ":accepted");
      window.location.reload();
    },
    locked:
      command.busy ||
      !!command.pending ||
      !command.ready ||
      !enabled ||
      !online,
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
  timezone = "Australia/Brisbane",
  scope = "the exact affected scope",
  selection,
  submit,
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
  timezone?: string;
  scope?: string;
  selection?: ReactNode;
  submit?: (
    facts: Facts,
    reason: string,
    version?: number | string,
  ) => Promise<boolean>;
}) {
  const [draft, setDraft] = useState(initial),
    [reason, setReason] = useState(""),
    [dirty, setDirty] = useState(false),
    [originalVersion, setOriginalVersion] = useState(version),
    [confirm, setConfirm] = useState(false);
  const release = useUnsavedChanges(dirty, locked && dirty);
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
  const save = async (submitting = false) => {
    if (locked) return;
    const accepted = await (submitting && submit ? submit : send)(
      draft,
      reason,
      originalVersion,
    );
    if (accepted) {
      release();
      setDirty(false);
      onDirty?.(false);
      setConfirm(false);
    }
  };
  return (
    <form
      className="fi06-facts-form"
      onSubmit={(e) => {
        e.preventDefault();
        if (
          (e.nativeEvent as SubmitEvent).submitter?.getAttribute(
            "data-intent",
          ) === "submit"
        )
          setConfirm(true);
        else void save();
      }}
    >
      {selection && <div className="fi06-selection">{selection}</div>}
      <fieldset disabled={locked}>
        <legend className="fi06-sr-only">Factual event record</legend>
        {version !== originalVersion && (
          <p role="alert">
            The saved version changed. Your input is retained. Compare the
            current history before continuing.{" "}
            <Button onClick={() => setOriginalVersion(version)}>
              Use current version for this correction
            </Button>
          </p>
        )}
        {dirty && (
          <p className="fi06-edit-state" role="status">
            Unsaved changes
          </p>
        )}
        <IncidentSection title="What and where">
          <fieldset className="fi06-classification">
            <legend>Event classification</legend>
            <div>
              {["Observation", "NearMiss", "Incident", "Unknown"].map(
                (value) => (
                  <label key={value}>
                    <input
                      type="radio"
                      name="classification"
                      value={value}
                      checked={draft.classification === value}
                      onChange={() => change("classification", value)}
                    />
                    <span>{incidentLabel(value)}</span>
                  </label>
                ),
              )}
            </div>
            <p>Classification is not a risk assessment. Triage assesses it.</p>
          </fieldset>
          <LocalDateTimeField
            name="occurred_at"
            label="Occurred"
            value={draft.occurred_at}
            onChange={(v) => change("occurred_at", v)}
            timezone={timezone}
          />
        </IncidentSection>
        <IncidentSection title="What happened">
          <Field
            name="summary"
            label="Operational summary"
            value={draft.summary}
            onChange={(v) => change("summary", v)}
            maxLength={160}
            required
          />
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
          <Field
            name="source_reference"
            label="Source reference"
            value={draft.source_reference}
            onChange={(v) => change("source_reference", v)}
            hint="Where these facts came from. Visible to permitted readers; keep private information in Restricted details."
            maxLength={600}
            required
          />
        </IncidentSection>
        {sensitive && (
          <IncidentSection title="Restricted details">
            <p className="fi06-hint">
              Only you and authorised sensitive reviewers can read this. Leave
              it empty if there is nothing sensitive.
            </p>
            <Field
              name="restricted_details"
              label="Restricted details"
              value={draft.restricted_details ?? ""}
              onChange={(v) => change("restricted_details", v)}
              multiline
              maxLength={4000}
            />
          </IncidentSection>
        )}
        <IncidentSection title="Reason for this report">
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
            multiline
          />
        </IncidentSection>
        <div className="fi06-form-actions">
          <Button type="submit">{label}</Button>
          {submit && (
            <Button variant="primary" type="submit" data-intent="submit">
              Submit report
            </Button>
          )}
        </div>
      </fieldset>
      {confirm && (
        <SubmitIncident
          summary={draft.summary}
          classification={draft.classification}
          scope={scope}
          restricted={!!draft.restricted_details}
          locked={locked}
          onClose={() => setConfirm(false)}
          onSubmit={() => {
            setConfirm(false);
            void save(true);
          }}
        />
      )}
    </form>
  );
}
function Capture() {
  const query = useSearchParams(),
    router = useRouter(),
    appointment = query.get("appointment_id"),
    [id] = useState(() => crypto.randomUUID()),
    [selection, setSelection] = useState(
      query.get("scope_item_id") && query.get("asset_id")
        ? `${query.get("scope_item_id")}:${query.get("asset_id")}`
        : "",
    ),
    created = useRef<number | null>(null),
    [savedDraft, setSavedDraft] = useState(false);
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
  const go = (saved: string) => {
    setTimeout(() => router.push(target(saved)), 0);
  };
  const command = useCommands(
    `new.${appointment}`,
    !!preview.data?.selected &&
      !!r.data?.can_report &&
      !r.error &&
      !preview.error,
    go,
  );
  usePhoneHeader({
    title: "Report an incident",
    record: {
      position: "Report an incident",
      more: [
        { label: "Open My jobs", onSelect: () => router.push("/my-jobs") },
      ],
    },
  });
  const save = async (
    facts: Facts,
    reason: string,
    source_hash: number | string | undefined,
    submit = false,
  ) => {
    const receipt = await command.sendReceipt(
      created.current === null
        ? {
            action: "create",
            id,
            appointment_id: appointment,
            scope_item_id: selected?.scope_item_id,
            asset_id: selected?.asset_id,
            source_hash,
            facts,
            reason,
          }
        : {
            action: "save",
            id,
            expected_version: created.current,
            facts,
            reason,
          },
    );
    if (!receipt) return false;
    created.current = receipt.record_version;
    setSavedDraft(true);
    if (submit) {
      const submitted = await command.sendReceipt({
        action: "submit",
        id,
        expected_version: receipt.record_version,
        reason,
      });
      if (!submitted) return false;
    }
    go(id);
    return true;
  };
  return (
    <>
      <ReadState
        loading={r.loading || preview.loading}
        error={r.error || preview.error}
        retry={() => {
          r.reload();
          preview.reload();
        }}
        retained={!!r.data}
      />
      {!appointment && (
        <IncidentSection title="Choose a visit">
          <p>Choose Report an incident from the visit’s More menu.</p>
          <ButtonLink href="/my-jobs">Open My jobs</ButtonLink>
        </IncidentSection>
      )}
      {r.data && (
        <SharedRecord
          id="fi06-report"
          title="Report an incident"
          reference={r.data.appointment.reference}
          status={<IncidentState state="Draft" />}
          statusPlacement="title"
          meta={
            <span>
              From visit {r.data.appointment.reference} ·{" "}
              {savedDraft
                ? "Draft saved · not submitted"
                : "New report · not saved"}
            </span>
          }
          actions={
            <ButtonLink href={`/my-jobs/${r.data.appointment.id}`}>
              Open visit
            </ButtonLink>
          }
          sourcesLabel="Before you submit"
          sources={
            <>
              <strong>Before you submit</strong>
              <span>
                {selected ? "Exact scope chosen" : "Choose the exact scope"}
              </span>
              <span>Classification · facts · reason</span>
              <span>Online save required</span>
            </>
          }
          facts={
            <>
              <RecordFactSection title="Your visit">
                <dl>
                  <dt>When</dt>
                  <dd>
                    {incidentTime(
                      r.data.appointment.scheduled_start_at,
                      r.data.appointment.timezone,
                    )}
                  </dd>
                  <dt>Site</dt>
                  <dd>{r.data.appointment.site}</dd>
                  <dt>Work order</dt>
                  <dd>{r.data.appointment.work_order}</dd>
                  <dt>Visit</dt>
                  <dd>{r.data.appointment.reference}</dd>
                </dl>
              </RecordFactSection>
              <RecordFactSection title="Equipment">
                <p>
                  {selected?.display_name ?? "Choose the affected equipment"}
                </p>
                <p>{selected?.task_description}</p>
              </RecordFactSection>
            </>
          }
          tabs={<div className="fi06-report-tabs">Report</div>}
        >
          {command.panel}
          {!r.data.can_report && (
            <p role="alert">
              You can read this visit but cannot report an incident from it.
            </p>
          )}
          {preview.data?.selected && !preview.data.selected.known && (
            <p className="fi06-note">
              Configuration is unknown. Factual reporting is allowed; closure
              requires assessment.
            </p>
          )}
          {(savedDraft || command.accepted) && (
            <p>
              Draft saved.{" "}
              <Link href={target(command.accepted?.receipt.record_id ?? id)}>
                Open saved incident
              </Link>
              . Submission needs its own confirmed receipt.
            </p>
          )}
          <FactsForm
            initial={emptyFacts()}
            version={preview.data?.selected?.source_hash}
            locked={command.locked || (!!command.accepted && !savedDraft)}
            label="Save draft"
            timezone={r.data.appointment.timezone}
            scope={selected?.display_name}
            selection={
              <Select
                label="Exact affected scope and equipment"
                disabled={!!command.pending || !!command.accepted}
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
            }
            send={(facts, reason, hash) => save(facts, reason, hash)}
            submit={(facts, reason, hash) => save(facts, reason, hash, true)}
          />
          <IncidentSection title="Evidence">
            <p>
              Save the draft to retain original evidence against this incident.
              PNG and plain text are supported.
            </p>
          </IncidentSection>
        </SharedRecord>
      )}
    </>
  );
}
function Record() {
  const params = useParams<{ id: string }>(),
    id = params.id,
    r = useCrmResource<View>(`service/incidents/${id}`),
    [editing, setEditing] = useState<string | null>(null),
    [tab, setTab] = useState("report"),
    [correcting, setCorrecting] = useState(false),
    [confirm, setConfirm] = useState(false);
  const command = useCommands(id, !!r.data && !r.error, () => {
    setEditing(null);
    setCorrecting(false);
    r.reload();
  });
  const v = r.data,
    otherLocked = command.locked || !!editing;
  const mark = (section: string) => (dirty: boolean) =>
    setEditing(dirty ? section : null);
  const send: Send = (fields) =>
    command.send({ id, expected_version: v?.row.version, ...fields });
  usePhoneHeader(
    v
      ? {
          title: v.row.facts.summary,
          record: {
            position:
              v.row.state === "Draft"
                ? "Report an incident"
                : v.context.reference,
            more: [
              { label: "Refresh incident", onSelect: r.reload },
              { label: "Evidence", onSelect: () => setTab("evidence") },
              { label: "History", onSelect: () => setTab("history") },
            ],
          },
        }
      : null,
  );
  const submitFacts = async (
    facts: Facts,
    reason: string,
    expected_version?: string | number,
  ) => {
    if (JSON.stringify(facts) === JSON.stringify(v?.row.facts))
      return command.send({ action: "submit", id, reason, expected_version });
    const receipt = await command.sendReceipt({
      action: "save",
      id,
      facts,
      reason,
      expected_version,
    });
    if (!receipt) return false;
    return command.send({
      action: "submit",
      id,
      reason,
      expected_version: receipt.record_version,
    });
  };
  const tabs = [
    {
      id: "report",
      label: v?.row.state === "Draft" ? "Report" : "Factual report",
    },
    ...(v?.row.state !== "Draft"
      ? [
          { id: "review", label: "Triage and review" },
          { id: "actions", label: `Actions ${v?.actions.length ?? 0}` },
        ]
      : []),
    { id: "evidence", label: `Evidence ${v?.evidence.length ?? 0}` },
    { id: "history", label: "History" },
  ];
  return (
    <>
      <ReadState
        loading={r.loading}
        error={r.error}
        retry={r.reload}
        retained={!!v}
      />
      {r.error && (
        <p className="fi06-note">
          Last-known context only. Current incident authority is unavailable;
          incident operations are never queued offline.
        </p>
      )}
      {v && (
        <>
          <RecordIdentity
            reference={v.context.reference}
            title={v.row.facts.summary}
          />
          <SharedRecord
            id="fi06-record"
            title={
              v.row.state === "Draft"
                ? "Report an incident"
                : v.row.facts.summary
            }
            reference={v.context.reference}
            status={<IncidentState state={v.row.state} />}
            statusPlacement="title"
            meta={
              <span>
                {incidentLabel(v.row.facts.classification)} ·{" "}
                {v.context.reporter} ·{" "}
                {v.row.state === "Draft" ? "Last saved" : "Reported"}{" "}
                {incidentTime(
                  v.row.state === "Draft"
                    ? v.row.updated_at
                    : v.row.reported_at,
                  v.context.timezone,
                )}{" "}
                · v{v.row.version}
              </span>
            }
            actions={
              <>
                <ButtonLink href={`/my-jobs/${v.row.appointment_id}`}>
                  Open visit
                </ButtonLink>
                {v.duties.triage && v.row.state === "Submitted" && (
                  <Button variant="primary" onClick={() => setTab("review")}>
                    Start triage
                  </Button>
                )}
                {v.duties.close && v.row.state === "Accepted" && (
                  <Button
                    variant="primary"
                    onClick={() => {
                      setTab("review");
                      requestAnimationFrame(() =>
                        document.getElementById("review-reason")?.focus(),
                      );
                    }}
                  >
                    Close incident
                  </Button>
                )}
                <Button
                  aria-label="Refresh saved record"
                  disabled={command.locked}
                  onClick={r.reload}
                >
                  <ProductIcon name="changes" />
                </Button>
              </>
            }
            sourcesLabel={
              v.row.state === "Draft" ? "Before you submit" : "Before closure"
            }
            sources={
              <>
                <strong>
                  {v.row.state === "Draft"
                    ? "Before you submit"
                    : "Before closure"}
                </strong>
                {(v.row.state === "Draft"
                  ? [
                      "Exact scope chosen",
                      "Classification recorded",
                      "Facts recorded",
                      "Reason required",
                    ]
                  : [
                      v.operational_hold ? "Scope held" : "No hold",
                      v.row.assessment === "Assessed"
                        ? `Assessed · ${v.row.priority.toLowerCase()}`
                        : "Assessment · not yet",
                      v.actions.length
                        ? `${v.actions.filter((a) => a.activity.status === "Completed").length}/${v.actions.length} actions complete`
                        : "Corrective actions · none yet",
                      `${v.actions.filter((a) => a.accepted_by && a.assignment_current).length}/${v.actions.length} action evidence accepted`,
                      v.row.state === "Accepted" || v.row.state === "Closed"
                        ? "Incident content accepted"
                        : "Incident content · not accepted",
                      v.source_current
                        ? "Sources current"
                        : "Sources need review",
                    ]
                ).map((text) => (
                  <span key={text}>{text}</span>
                ))}
              </>
            }
            facts={
              <>
                <RecordFactSection title="Summary">
                  <dl>
                    {[
                      ["State", incidentLabel(v.row.state)],
                      [
                        "Classification",
                        incidentLabel(v.row.facts.classification),
                      ],
                      ["Reporter", v.context.reporter],
                      [
                        "Occurred",
                        incidentTime(
                          v.row.facts.occurred_at,
                          v.context.timezone,
                        ),
                      ],
                      [
                        "Reported",
                        incidentTime(v.row.reported_at, v.context.timezone),
                      ],
                      ["Assessment", incidentLabel(v.row.assessment)],
                      ["Priority", v.row.priority],
                      ["Version", `v${v.row.version}`],
                    ].map(([label, value]) => (
                      <Fragment key={label}>
                        <dt>{label}</dt>
                        <dd>{value}</dd>
                      </Fragment>
                    ))}
                  </dl>
                </RecordFactSection>
                <RecordFactSection title="Affected scope">
                  <dl>
                    <dt>Site</dt>
                    <dd>{v.context.site}</dd>
                    <dt>Equipment</dt>
                    <dd>
                      <Link href={`/equipment/${v.binding.asset_id}`}>
                        {v.context.equipment}
                      </Link>
                    </dd>
                    <dt>Task</dt>
                    <dd>{v.context.task}</dd>
                  </dl>
                  <p>
                    Bound when the report was made. Submitted scope stays held
                    until closure.
                  </p>
                </RecordFactSection>
                <RecordFactSection title="Visit">
                  <Link href={`/my-jobs/${v.row.appointment_id}`}>
                    {v.context.appointment}
                  </Link>
                  <p>
                    {incidentTime(
                      v.context.scheduled_start_at,
                      v.context.timezone,
                    )}
                  </p>
                  <p>{v.context.work_order}</p>
                </RecordFactSection>
              </>
            }
            tabs={
              <RecordTabs
                id="incident"
                label="Incident sections"
                tabs={tabs}
                value={tab}
                onChange={setTab}
              />
            }
            stickyAction={
              <>
                <ButtonLink href={`/my-jobs/${v.row.appointment_id}`}>
                  Open visit
                </ButtonLink>
                {v.duties.evidence && v.row.state !== "Closed" && (
                  <Button variant="primary" onClick={() => setTab("evidence")}>
                    Add evidence
                  </Button>
                )}
              </>
            }
          >
            {command.panel}
            <RecordPanel id="incident" tab="report" value={tab}>
              {v.row.state !== "Draft" && (
                <section className="fi06-hold fi06-card">
                  <div className="fi06-fact-row">
                    <ProductIcon name="warning" />
                    <div>
                      <strong>
                        {v.operational_hold
                          ? `Scope held: ${v.context.equipment}`
                          : "No current hold from this incident"}
                      </strong>
                      <p>
                        {v.operational_hold
                          ? "A submitted report holds its exact scope. Triage does not release it; only independent closure does."
                          : "Recheck every receiving-domain restriction before further work."}
                      </p>
                    </div>
                  </div>
                  <div className="fi06-fact-row">
                    <ProductIcon name="calendar" />
                    <div>
                      <strong>
                        Readiness and Start for later visits check this scope
                      </strong>
                      <p>
                        Attendance, timers and inspection evidence continue.
                        Existing attendance is not changed.
                      </p>
                    </div>
                  </div>
                  <div className="fi06-fact-row">
                    <ProductIcon name="documents" />
                    <div>
                      <strong>You can still add evidence</strong>
                      <p>
                        New files are added as originals; nothing is replaced.
                      </p>
                    </div>
                  </div>
                </section>
              )}
              {(v.row.state === "Draft" || correcting) && v.duties.save ? (
                <FactsForm
                  initial={v.row.facts}
                  version={v.row.version}
                  onDirty={mark("facts")}
                  sensitive={v.sensitive}
                  locked={command.locked || (!!editing && editing !== "facts")}
                  label={
                    v.row.state === "Draft"
                      ? "Save draft"
                      : "Save factual correction"
                  }
                  timezone={v.context.timezone}
                  scope={v.context.equipment}
                  selection={
                    <p>
                      <strong>Exact affected scope and equipment</strong>
                      <br />
                      {v.context.task} · {v.context.equipment}
                    </p>
                  }
                  send={(facts, reason, expected_version) =>
                    send({ action: "save", facts, reason, expected_version })
                  }
                  submit={
                    v.duties.submit &&
                    ["Draft", "Returned", "ClarificationRequired"].includes(
                      v.row.state,
                    )
                      ? submitFacts
                      : undefined
                  }
                />
              ) : (
                <>
                  <h2 className="fi06-content-title">
                    {v.duties.save ? "Your report" : "Original report"}{" "}
                    <small>
                      version {v.row.version} · facts are never edited in place
                    </small>
                  </h2>
                  <section className="fi06-card fi06-factual">
                    {[
                      ["Summary", v.row.facts.summary],
                      ["Observations", v.row.facts.observations],
                      ["Immediate response", v.row.facts.immediate_response],
                      [
                        "Classification",
                        `${incidentLabel(v.row.facts.classification)} · ${incidentTime(v.row.facts.occurred_at, v.context.timezone)}`,
                      ],
                      ["Source reference", v.row.facts.source_reference],
                      [
                        "Restricted details",
                        v.sensitive
                          ? v.row.facts.restricted_details || "None recorded"
                          : "Restricted to the reporter and authorised sensitive reviewers",
                      ],
                    ].map(([label, text]) => (
                      <div className="fi06-fact-row" key={label}>
                        <ProductIcon name="info" />
                        <div>
                          <strong>{label}</strong>
                          <p>{text}</p>
                        </div>
                      </div>
                    ))}
                  </section>
                  {v.duties.save && v.row.state !== "Closed" && (
                    <Button
                      disabled={otherLocked}
                      onClick={() => setCorrecting(true)}
                    >
                      Correct report
                    </Button>
                  )}
                  {v.duties.submit &&
                    ["Returned", "ClarificationRequired"].includes(
                      v.row.state,
                    ) && (
                      <Button
                        disabled={otherLocked}
                        onClick={() => setConfirm(true)}
                      >
                        Submit report
                      </Button>
                    )}
                </>
              )}
              {v.row.state === "Draft" && (
                <p>Open Evidence to add original files to this saved draft.</p>
              )}
            </RecordPanel>
            {v.row.state !== "Draft" && (
              <RecordPanel id="incident" tab="review" value={tab}>
                {v.row.state === "Accepted" && (
                  <IncidentSection title="Ready to close the incident">
                    <p>
                      Closing releases this incident’s hold and issues an
                      internal outcome. It completes nothing for the visit, work
                      order or customer.
                    </p>
                    <h3>Preview · not issued</h3>
                    <p>
                      {v.row.facts.summary} ·{" "}
                      {incidentLabel(v.row.facts.classification)} ·{" "}
                      {v.row.assessment}
                    </p>
                    <p>
                      Exact task: {v.context.task} · Equipment:{" "}
                      {v.context.equipment}
                    </p>
                    <p>
                      Keeps the report, triage, {v.actions.length} corrective
                      actions and accepted operational evidence. Restricted
                      details and evidence stay out.
                    </p>
                    <p>
                      Remaining work: recheck current readiness, assignment,
                      scheduling and inspection restrictions in their receiving
                      domains.
                    </p>
                    <p>
                      A changed source or missing original file refuses closure.
                      The HTML and PDF are generated only by a successful close
                      command.
                    </p>
                  </IncidentSection>
                )}
                <ReviewControls
                  view={v}
                  send={send}
                  locked={command.locked || (!!editing && editing !== "review")}
                  onDirty={mark("review")}
                />
                <IncidentSection title="Reviewed scoped outcomes">
                  {!v.outputs.length && <p>No issued incident outcome.</p>}
                  {v.outputs.map((o) => (
                    <div key={o.id}>
                      <p>
                        {o.current
                          ? "Current incident closure"
                          : "Historical output — current applicability withdrawn"}
                      </p>
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
                    </div>
                  ))}
                </IncidentSection>
              </RecordPanel>
            )}
            {v.row.state !== "Draft" && (
              <RecordPanel id="incident" tab="actions" value={tab}>
                <ActionEvidence
                  view={v}
                  send={send}
                  locked={
                    command.locked || (!!editing && editing !== "actions")
                  }
                  onDirty={mark("actions")}
                />
              </RecordPanel>
            )}
            <RecordPanel id="incident" tab="evidence" value={tab}>
              <IncidentSection title="Retained evidence">
                {!v.evidence.length && <p>No retained evidence.</p>}
                {v.evidence.map((e) => (
                  <EvidenceRow key={e.id} incident={id} evidence={e} />
                ))}
              </IncidentSection>
              <EvidenceForm
                view={v}
                send={send}
                locked={command.locked || (!!editing && editing !== "evidence")}
                onDirty={mark("evidence")}
              />
            </RecordPanel>
            <RecordPanel id="incident" tab="history" value={tab}>
              <IncidentSection title="Original report and retained history">
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
                    Linked inspection defect {v.row.defect_id}; correction and
                    retest stay in inspections.
                  </p>
                )}
                {v.events.map((e) => (
                  <details key={e.id}>
                    <summary>
                      Version {e.version} · {e.action} ·{" "}
                      {incidentTime(e.recorded_at, v.context.timezone)}
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
              </IncidentSection>
            </RecordPanel>
          </SharedRecord>
          {confirm && (
            <SubmitIncident
              summary={v.row.facts.summary}
              classification={v.row.facts.classification}
              scope={v.context.equipment}
              restricted={!!v.row.facts.restricted_details}
              locked={otherLocked}
              onClose={() => setConfirm(false)}
              onSubmit={() =>
                void send({
                  action: "submit",
                  reason: "Submit factual report for independent triage",
                }).then((ok) => {
                  if (ok) setConfirm(false);
                })
              }
            />
          )}
        </>
      )}
    </>
  );
}
function EvidenceRow({
  incident,
  evidence: e,
}: {
  incident: string;
  evidence: View["evidence"][number];
}) {
  return (
    <div className="fi06-fact-row">
      <ProductIcon name="documents" />
      <div>
        <a
          href={`/api/v1/service/incidents/${incident}/files?evidence_id=${e.id}`}
          target="_blank"
          rel="noreferrer"
        >
          {e.label}
        </a>
        <p>
          {e.audience} · {e.byte_count} bytes
        </p>
        <p className="fi06-hash">SHA-256 {e.content_hash}</p>
      </div>
    </div>
  );
}
function ActionEvidence({
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
  const [reasons, setReasons] = useState<Record<string, string>>({}),
    [chosen, setChosen] = useState<Record<string, string>>({}),
    [dirty, setDirty] = useState(false),
    [version, setVersion] = useState(v.row.version);
  useUnsavedChanges(dirty, locked && dirty);
  if (!dirty && version !== v.row.version) setVersion(v.row.version);
  const decision = async (fields: Record<string, unknown>) => {
    if (await send({ expected_version: version, ...fields })) {
      setDirty(false);
      onDirty(false);
    }
  };
  return (
    <>
      <h2 className="fi06-content-title">Owned corrective actions</h2>
      {version !== v.row.version && (
        <p role="alert">
          The saved record changed. Compare the current evidence and history.{" "}
          <Button onClick={() => setVersion(v.row.version)}>
            Use current version for this evidence decision
          </Button>
        </p>
      )}
      {!v.actions.length && (
        <p>No corrective actions assigned. Assign one in Triage and review.</p>
      )}
      {v.actions.map((a) => {
        const reason = reasons[a.id] ?? "";
        return (
          <IncidentSection key={a.id} title={a.instruction}>
            <p>
              An owned activity in My Work. Completing it does not accept its
              evidence.
            </p>
            <Link href={`/work/${a.activity_id}`}>Open activity</Link>
            <p>
              {a.activity.status} · Owner {a.activity.owner_id} · Due{" "}
              {incidentTime(a.activity.due_at, v.context.timezone)}
              {a.activity.overdue ? " · Overdue" : ""}
            </p>
            <p>
              {a.assignment_current
                ? "Assignment matches the incident"
                : "Assignment changed — fresh review required"}{" "}
              ·{" "}
              {a.accepted_by
                ? "Evidence independently accepted"
                : "Evidence awaiting acceptance"}
            </p>
            {!a.assignment_current && v.duties.adopt_assignment && (
              <Button
                disabled={locked}
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
            <h3>Evidence to accept</h3>
            {v.evidence
              .filter((e) => e.action_id === a.id)
              .map((e) => (
                <div key={e.id}>
                  <EvidenceRow incident={v.row.id} evidence={e} />
                  {v.duties.accept_action && v.row.state !== "Closed" && (
                    <label className="fi06-evidence-choice">
                      <input
                        type="radio"
                        name={`action-evidence-${a.id}`}
                        value={e.id}
                        disabled={locked}
                        checked={chosen[a.id] === e.id}
                        onChange={() => {
                          setChosen({ ...chosen, [a.id]: e.id });
                          setDirty(true);
                          onDirty(true);
                        }}
                      />
                      Use {e.label} as the exact acceptance evidence
                    </label>
                  )}
                </div>
              ))}
            {v.duties.accept_action && v.row.state !== "Closed" && (
              <fieldset disabled={locked}>
                <legend className="fi06-sr-only">
                  Independent evidence decision
                </legend>
                <Field
                  name={`action-reason-${a.id}`}
                  label="Reason for your decision"
                  value={reason}
                  onChange={(value) => {
                    setReasons({ ...reasons, [a.id]: value });
                    setDirty(true);
                    onDirty(true);
                  }}
                  required
                  maxLength={1000}
                />
                <div className="button-row">
                  <Button
                    variant="primary"
                    disabled={locked || !chosen[a.id] || !reason.trim()}
                    onClick={() =>
                      void decision({
                        action: "accept_action",
                        action_id: a.id,
                        evidence_id: chosen[a.id],
                        reason,
                      })
                    }
                  >
                    Accept evidence
                  </Button>
                  <Button
                    disabled={locked || !reason.trim() || !v.duties.review}
                    onClick={() =>
                      void decision({
                        action: "review",
                        decision: "Returned",
                        reason,
                      })
                    }
                  >
                    Return for correction
                  </Button>
                </div>
                <p>
                  Acceptance records one exact evidence file for this action.
                  Return for correction returns the incident for correction; it
                  does not delete files.
                </p>
              </fieldset>
            )}
          </IncidentSection>
        );
      })}
      <p>
        Accepting evidence does not close the incident. Closure rechecks
        independent authority, completed actions, exact original files and
        current sources.
      </p>
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
    [assessment, setAssessment] = useState<string>(v.row.assessment),
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
    <section className="fi06-review">
      <h2 className="fi06-content-title">Triage and independent review</h2>
      <IncidentSection title={`The report · version ${v.row.version}`}>
        <strong>
          {v.row.facts.summary} · {incidentLabel(v.row.facts.classification)}
        </strong>
        <p>
          {incidentTime(v.row.facts.occurred_at, v.context.timezone)} ·{" "}
          {v.context.reporter} · {v.row.facts.immediate_response}
        </p>
      </IncidentSection>
      <ReadState loading={c.loading} error={c.error} retry={c.reload} />
      <fieldset
        className="fi06-card"
        disabled={locked}
        onChange={() => {
          setDirty(true);
          onDirty(true);
        }}
      >
        <legend className="fi06-sr-only">Incident review</legend>
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
          label={
            v.row.state === "Submitted"
              ? "Basis for the assessment"
              : "Review or closure reason"
          }
          value={reason}
          onChange={setReason}
          maxLength={1000}
          required
          multiline
        />
        {v.duties.triage && !["Accepted", "Closed"].includes(v.row.state) && (
          <>
            <div className="incident-fields">
              <Select
                label="Assessment"
                value={assessment}
                onChange={setAssessment}
              >
                <option>Unassessed</option>
                <option>Assessed</option>
              </Select>

              <Select label="Priority" value={priority} onChange={setPriority}>
                {priorities.map((x) => (
                  <option key={x}>{x}</option>
                ))}
              </Select>
              <Select
                label="Accountable owner"
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
              <LocalDateTimeField
                name="due_at"
                label="Due time"
                timezone={v.context.timezone}
                value={due}
                onChange={setDue}
                required
              />
            </div>
            <p>
              Triage keeps the scope held. Only closure releases it. Corrective
              actions are assigned separately.
            </p>
            <Button
              variant="primary"
              disabled={
                !reason.trim() ||
                !owner ||
                !due ||
                priority === "Unknown" ||
                assessment !== "Assessed"
              }
              onClick={() =>
                void decision("triage", {
                  owner_id: owner,
                  due_at: due,
                  priority,
                  assessment,
                  hold: true,
                })
              }
            >
              Save triage
            </Button>
            <details>
              <summary>Review decisions and corrective work</summary>
              <div className="button-row">
                {[
                  "Returned",
                  "ClarificationRequired",
                  "OnHold",
                  "InReview",
                ].map((x) => (
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
                ))}
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
                label="Linked inspection defect (optional)"
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
                        {t.task_description} · {t.display_name}
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
            </details>
          </>
        )}
        <div className="button-row">
          {v.duties.accept && !["Accepted", "Closed"].includes(v.row.state) && (
            <Button onClick={() => void decision("accept")}>
              Accept exact closure evidence
            </Button>
          )}
          {v.duties.close && v.row.state === "Accepted" && (
            <Button
              variant="primary"
              disabled={!reason.trim()}
              onClick={() => void decision("close")}
            >
              Close incident and issue internal outcome
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
