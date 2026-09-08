"use client";
import { CompletionSubmission } from "./report-screens";
import Link from "next/link";
import Image from "next/image";
import { useRef, useState } from "react";
import {
  api,
  ErrorNotice,
  PageHeader,
  ReadState,
  Stamp,
  Status,
  Field,
  SelectField,
  EnumField,
  ValidationFields,
  useResource,
  type Envelope,
  type Failure,
} from "./business-ui";
import { useIdentity } from "./business-session";
import {
  fieldKinds,
  timeKinds,
  materialKinds,
  units,
  readingUnits,
  checkIds,
} from "../field/validation";
type Ref = { id: string; version: number };
type Photo = Ref & {
  actor_id: string;
  filename: string;
  status: string;
  sha256: string;
  byte_count: number;
  width: number | null;
  height: number | null;
  retrieval_verified: boolean;
  error_code: string | null;
};
type Entry = Ref & {
  actor_id: string;
  actor_name: string;
  kind: string;
  root_id: string;
  attendance_id: string;
  scope_item_id: string | null;
  asset_id: string | null;
  captured_at: string;
  received_at: string;
  payload: Record<string, string | number | boolean | string[] | null>;
  superseded: boolean;
  supersedes_entry_id: string | null;
  correction_reason: string | null;
  authority_state: string;
  issue_hash: string;
};
type Task = {
  id: string;
  sequence: number;
  description: string;
  kind: string;
  completion_requirements: string[];
  assets: {
    id: string;
    reference: string;
    description: string;
    identity_status: string;
    serial: string | null;
  }[];
};
export type Job = Ref & {
  report?: {
    id: string;
    version: number;
    revision: number;
    status: string;
  } | null;
  accepted_end_at?: string | null;
  reference: string;
  status: string;
  customer_name: string;
  site: {
    id: string;
    name: string;
    location: string;
    access: string;
    biosecurity: string;
  };
  contact: { name: string; phone: string | null; email: string | null } | null;
  work_order: {
    id: string;
    reference: string;
    status: string;
    service_owner_id: string;
  };
  scheduled_start_at: string;
  scheduled_end_at: string;
  actual_start_at: string | null;
  site_timezone: string;
  customer_commitment: string;
  schedule_version: number;
  assignment_version: number;
  scope_revision_id: string;
  scope_version: number;
  scope: {
    id: string;
    revision: number;
    version: number;
    hash: string;
    summary: string;
    exclusions: string;
    items: Task[];
  };
  assignment: {
    id: string;
    name: string;
    crew_role: string;
    assignment_version: number;
  };
  pack: {
    id: string;
    current_issue_id: string | null;
    output_hash: string;
    revision: number;
    status: string;
    needs_review: boolean;
  } | null;
  readiness: {
    component_ready: boolean;
    reasons: string[];
    recipients: {
      id: string;
      display_name: string;
      user_id: string;
      assignment_id: string;
      assignment_version: number;
      acknowledged_at: string | null;
    }[];
  };
  attendance: {
    id: string;
    actor_id: string;
    captured_at: string;
    received_at: string;
    authority_hash: string;
    issue_id: string;
    issue_hash: string;
  } | null;
  entries: Entry[];
  attachments: Photo[];
  draft: Ref | null;
  draft_revisions: {
    id: string;
    version: number;
    scope_outcome: string;
    work_performed: string;
    exclusions: string;
    remaining_work: string;
    time_declaration: string;
    material_declaration: string;
    declaration_reason: string;
    task_outcomes: { scope_item_id: string; outcome: string; reason: string }[];
    blockers: string[];
    evidence_changed: boolean;
    follow_up_activity_id: string | null;
    received_at: string;
  }[];
  follow_ups: {
    id: string;
    summary: string;
    status: string;
    owner_name: string;
  }[];
};
const message = "Field workflow preview — integrated acceptance incomplete";
function PreviewLabel() {
  return (
    <div className="field-preview">
      <strong>Synthetic prototype — not for operational use</strong>
      <span>{message}</span>
      <a href="/offline/index.html">Open offline field workspace</a>
    </div>
  );
}
function useSubmission(onSuccess?: () => void, initialSaved = "") {
  const pending = useRef<{
    path: string;
    body: Record<string, unknown>;
  } | null>(null);
  const [busy, setBusy] = useState(false),
    [error, setError] = useState<unknown>(null),
    [uncertain, setUncertain] = useState(false),
    [saved, setSaved] = useState(initialSaved);
  async function execute() {
    if (!pending.current || busy) return null;
    setBusy(true);
    setError(null);
    setSaved("");
    try {
      const receipt = await api<{ state: string }>(
        pending.current.path,
        pending.current.body,
      );
      pending.current = null;
      setUncertain(false);
      setSaved(`Server-saved · ${receipt.state}`);
      onSuccess?.();
      return receipt;
    } catch (e) {
      setError(e);
      const retry = !!(e as Failure).retryable;
      setUncertain(retry);
      if (!retry) pending.current = null;
      return null;
    } finally {
      setBusy(false);
    }
  }
  function run(path: string, fields: Record<string, unknown>) {
    if (uncertain) return execute();
    pending.current = {
      path,
      body: { operation_id: crypto.randomUUID(), schema_version: 1, ...fields },
    };
    return execute();
  }
  return {
    run,
    retry: execute,
    busy,
    error,
    uncertain,
    saved,
    dirty: () => {
      if (!pending.current) setSaved("");
    },
  };
}
function SaveState({
  s,
  dirty = false,
}: {
  s: ReturnType<typeof useSubmission>;
  dirty?: boolean;
}) {
  return (
    <>
      <ErrorNotice error={s.error} />
      <p role="status" className="save-state">
        {s.busy
          ? "Saving to the server…"
          : s.uncertain
            ? "Outcome uncertain — original submission retained in this open page."
            : s.saved ||
              (dirty
                ? "Unsaved changes — held in this page only."
                : "No unsaved changes.")}
      </p>
      {s.uncertain && (
        <button type="button" onClick={() => void s.retry()} disabled={s.busy}>
          Retry original submission
        </button>
      )}
    </>
  );
}
export function MyJobsScreen() {
  const [cursor, setCursor] = useState<string | null>(null);
  const r = useResource<
    Envelope<{
      id: string;
      reference: string;
      work_order_reference: string;
      site_name: string;
      site_timezone: string;
      start_at: string;
      end_at: string;
      status: string;
      my_started_at: string | null;
      dispatch_hold: boolean;
    }>
  >(`my-jobs${cursor ? `?cursor=${encodeURIComponent(cursor)}` : ""}`);
  return (
    <>
      <PageHeader
        eyebrow="Technician workspace · SC-09"
        title="My Jobs"
        description="Your assigned visits, current work context and online field capture."
        action={
          <button className="secondary" onClick={r.reload}>
            Refresh jobs
          </button>
        }
      />
      <PreviewLabel />
      <ReadState loading={r.loading} error={r.error} retry={r.reload} />
      {r.data && !r.loading && !r.error && (
        <>
          <p className="read-meta">
            Current assigned jobs · Read <Stamp value={r.data.observed_at} />
          </p>
          {!r.data.items.length ? (
            <p className="empty-state">
              No current assigned visits are available for this identity.
            </p>
          ) : (
            <div className="field-job-list">
              {r.data.items.map((j) => (
                <article className="field-job-card" key={j.id}>
                  <div>
                    <Status value={j.status} />
                    <h2>
                      <Link href={`/my-jobs/${j.id}`}>{j.reference}</Link>
                    </h2>
                    <strong>{j.site_name}</strong>
                    <p>{j.work_order_reference}</p>
                  </div>
                  <div>
                    <small>Scheduled visit · {j.site_timezone}</small>
                    <p>
                      <Stamp value={j.start_at} timezone={j.site_timezone} /> –{" "}
                      <Stamp value={j.end_at} timezone={j.site_timezone} />
                    </p>
                    <p>
                      {j.my_started_at ? (
                        <>
                          Your start saved <Stamp value={j.my_started_at} />
                        </>
                      ) : j.dispatch_hold ? (
                        "Review preparation before starting."
                      ) : (
                        "Open the job to recheck start authority."
                      )}
                    </p>
                    <Link href={`/my-jobs/${j.id}`} className="button-link">
                      Open field job
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          )}
          <div className="actions">
            {cursor && (
              <button onClick={() => setCursor(null)}>First page</button>
            )}
            {r.data.next_cursor && (
              <button onClick={() => setCursor(r.data!.next_cursor)}>
                Next jobs
              </button>
            )}
          </div>
        </>
      )}
    </>
  );
}
function StartPanel({ job, reload }: { job: Job; reload: () => void }) {
  const p = useIdentity(),
    s = useSubmission(reload),
    [reason, setReason] = useState("");
  const recipient = job.readiness.recipients.find(
    (x) => x.user_id === p.actor_id,
  );
  return (
    <section className="business-card field-start">
      <h2>Your attendance</h2>
      {job.attendance ? (
        <>
          <p className="success-notice">Your actual start is server-saved.</p>
          <p>
            Received <Stamp value={job.attendance.received_at} />. Captured{" "}
            <Stamp value={job.attendance.captured_at} />.
          </p>
          <small>
            Booking duration and crew acknowledgement have created no labour
            entries.
          </small>
        </>
      ) : (
        <>
          <p>
            {job.actual_start_at
              ? "Another crew member has started. Record only your own attendance."
              : "Read the authorised scope and current job pack before recording your own start."}
          </p>
          {job.pack?.current_issue_id && (
            <p>
              <Link href={`/documents/${job.pack.current_issue_id}`}>
                Read exact job pack r
                {String(job.pack.revision).padStart(2, "0")}
              </Link>{" "}
              ·{" "}
              <Link href={`/service/packs/${job.pack.id}`}>
                Pack acknowledgements
              </Link>
            </p>
          )}
          {recipient && !recipient.acknowledged_at && (
            <button
              onClick={() =>
                void s.run(
                  `pack-issues/${job.pack!.current_issue_id}/acknowledge`,
                  {
                    reason:
                      "SYN personal acknowledgement after reading the exact issued job pack",
                    assignment_id: recipient.assignment_id,
                    assignment_version: recipient.assignment_version,
                    presented_hash: job.pack!.output_hash,
                    captured_at: new Date().toISOString(),
                  },
                )
              }
              disabled={s.busy || s.uncertain}
            >
              I have read and acknowledge this exact pack
            </button>
          )}
          <ul>
            {job.readiness.recipients.map((x) => (
              <li key={x.id}>
                {x.display_name}:{" "}
                {x.acknowledged_at
                  ? "Acknowledged exact issue"
                  : "Awaiting personal acknowledgement"}
              </li>
            ))}
          </ul>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void s.run(`appointments/${job.id}/start`, {
                expected_version: job.version,
                schedule_version: job.schedule_version,
                assignment_id: job.assignment.id,
                assignment_version: job.assignment_version,
                issue_id: job.pack?.current_issue_id,
                issue_hash: job.pack?.output_hash,
                scope_revision_id: job.scope_revision_id,
                scope_version: job.scope_version,
                captured_at: new Date().toISOString(),
                reason,
              });
            }}
          >
            <fieldset disabled={s.busy || s.uncertain}>
              <Field
                name="start-reason"
                label="Start context"
                value={reason}
                onChange={(v) => {
                  setReason(v);
                  s.dirty();
                }}
                required
                multiline
                maxLength={1000}
                hint="Explain the actual start, including any difference from the scheduled time. Synthetic demonstration only."
              />
              <button disabled={!job.pack?.current_issue_id}>
                Record my actual start
              </button>
            </fieldset>
          </form>
        </>
      )}
      <SaveState s={s} dirty={!!reason && !job.attendance} />
    </section>
  );
}
function UploadPanel({ job, reload }: { job: Job; reload: () => void }) {
  const p = useIdentity(),
    s = useSubmission(reload),
    [file, setFile] = useState<File | null>(null),
    [prepared, setPrepared] = useState<{
      id: string;
      name: string;
      hash: string;
      base64: string;
      bytes: number;
    } | null>(null),
    [error, setError] = useState<unknown>(null),
    [preparing, setPreparing] = useState(false);
  async function choose(f: File | null) {
    setFile(f);
    setPrepared(null);
    setError(null);
    if (!f) return;
    if (f.size > 4194304) {
      setError({ message: "Choose a PNG up to 4 MiB." });
      return;
    }
    setPreparing(true);
    try {
      const data = new Uint8Array(await f.arrayBuffer()),
        hash = Array.from(
          new Uint8Array(await crypto.subtle.digest("SHA-256", data)),
        )
          .map((x) => x.toString(16).padStart(2, "0"))
          .join("");
      let binary = "";
      for (let i = 0; i < data.length; i += 8192)
        binary += String.fromCharCode(...data.subarray(i, i + 8192));
      const original = job.attachments.find(
        (a) =>
          a.actor_id === p.actor_id &&
          a.status === "Pending" &&
          a.sha256 === hash &&
          a.byte_count === data.length &&
          a.filename === f.name,
      );
      setPrepared({
        id: original?.id ?? crypto.randomUUID(),
        name: f.name,
        hash,
        base64: btoa(binary),
        bytes: data.length,
      });
    } catch {
      setError({
        message: "The selected file could not be read. Select it again.",
      });
    } finally {
      setPreparing(false);
    }
  }
  const registered = prepared
    ? job.attachments.find((x) => x.id === prepared.id)
    : null;
  return (
    <section className="business-card">
      <h2>Photo storage</h2>
      <p>
        Choose a fictional PNG: RGB/RGBA, non-interlaced, up to 4 MiB and 4096
        pixels per side. Embedded text/EXIF and animation are unsupported.
      </p>
      <label htmlFor="photo-file">Synthetic photo file</label>
      <input
        id="photo-file"
        type="file"
        accept="image/png"
        disabled={s.busy || s.uncertain || preparing}
        onChange={(e) => void choose(e.target.files?.[0] ?? null)}
      />
      <ErrorNotice error={error} />
      {preparing && <p role="status">Reading the selected file…</p>}
      {prepared && (
        <>
          <p>
            {file?.name} · {prepared.bytes.toLocaleString()} bytes ·{" "}
            {registered?.status ?? "Selected in this page; not uploaded"}
          </p>
          <div className="actions">
            {!registered && (
              <button
                disabled={s.busy || s.uncertain}
                onClick={() =>
                  void s.run("attachments/initiate", {
                    id: prepared.id,
                    appointment_id: job.id,
                    attendance_id: job.attendance!.id,
                    filename: prepared.name,
                    media_type: "image/png",
                    byte_count: prepared.bytes,
                    sha256: prepared.hash,
                    reason: "SYN initialise exact fictional photo upload",
                  })
                }
              >
                1. Register photo
              </button>
            )}
            {registered?.status === "Pending" && (
              <button
                disabled={s.busy || s.uncertain}
                onClick={() =>
                  void s.run(`attachments/${registered.id}/upload`, {
                    expected_version: registered.version,
                    content_base64: prepared.base64,
                    reason: "SYN transfer original fictional photo bytes",
                  })
                }
              >
                2. Upload original bytes
              </button>
            )}
          </div>
        </>
      )}
      {job.attachments.map((a) => (
        <div key={a.id} className="photo-row">
          <div>
            <strong>{a.filename}</strong>
            <p>
              <Status value={a.status} /> ·{" "}
              {a.status === "Available"
                ? a.retrieval_verified
                  ? "Original bytes verified"
                  : "Original bytes unavailable — recovery needed"
                : "Not available for completion"}
            </p>
            {a.retrieval_verified && (
              <a
                href={`/api/v1/attachments/${a.id}/bytes`}
                target="_blank"
                rel="noreferrer"
              >
                Preview original photo
              </a>
            )}
            {a.error_code && (
              <p>Original upload needs recovery: {a.error_code}</p>
            )}
          </div>
          {a.actor_id === p.actor_id &&
            ["Uploaded", "Quarantined"].includes(a.status) && (
              <button
                disabled={s.busy || s.uncertain}
                onClick={() =>
                  void s.run(`attachments/${a.id}/finalise`, {
                    expected_version: a.version,
                    reason: "SYN verify durable original photo and finalise",
                  })
                }
              >
                3. Verify and make available
              </button>
            )}
          {a.actor_id === p.actor_id &&
            a.status === "Pending" &&
            !registered && (
              <small>
                Reselect the original file with the same name, size and hash to
                resume this upload. Unsaved file contents are held only in the
                open page.
              </small>
            )}
        </div>
      ))}
      <SaveState s={s} dirty={!!prepared && !registered} />
    </section>
  );
}
function CaptureForm({
  job,
  source,
  reload,
  onDone,
}: {
  job: Job;
  source: Entry | null;
  reload: () => void;
  onDone: () => void;
}) {
  const s = useSubmission(() => {
      reload();
      onDone();
    }),
    [kind, setKind] = useState(source?.kind ?? "Time"),
    [entryId] = useState(() => crypto.randomUUID()),
    [captured, setCaptured] = useState(
      source?.captured_at ?? new Date().toISOString(),
    ),
    [task, setTask] = useState(source?.scope_item_id ?? ""),
    [asset, setAsset] = useState(source?.asset_id ?? ""),
    [reason, setReason] = useState(""),
    [values, setValues] = useState<Record<string, string>>(() =>
      Object.fromEntries(
        Object.entries(source?.payload ?? {})
          .map(([k, v]) => [
            k,
            Array.isArray(v) ? v.join(",") : v == null ? "" : String(v),
          ])
          .concat(
            source?.kind === "Reading"
              ? [
                  [
                    "value_kind",
                    source.payload.text_value !== null ? "Text" : "Numeric",
                  ],
                ]
              : [],
          )
          .concat(
            source?.kind === "Checklist"
              ? [["check_reason", String(source.payload.reason ?? "")]]
              : [],
          ),
      ),
    ),
    [changed, setChanged] = useState(false);
  const v = (key: string, fallback = "") => values[key] ?? fallback;
  function put(key: string, value: string) {
    setValues((x) => ({ ...x, [key]: value }));
    setChanged(true);
    s.dirty();
  }
  function f(
    key: string,
    label: string,
    options: { required?: boolean; multiline?: boolean; hint?: string } = {},
  ) {
    return (
      <Field
        key={key}
        name={key}
        label={label}
        value={v(key)}
        onChange={(x) => put(key, x)}
        maxLength={4000}
        {...options}
      />
    );
  }
  function en(
    key: string,
    label: string,
    options: readonly string[],
    fallback = options[0],
  ) {
    return (
      <EnumField
        name={key}
        label={label}
        value={v(key, fallback)}
        onChange={(x) => put(key, x)}
        values={options}
      />
    );
  }
  const attachments = job.attachments.map((a) => ({
    id: a.id,
    display_name: `${a.filename} · ${a.status}${a.retrieval_verified ? " · verified" : ""}`,
  }));
  function fields() {
    switch (kind) {
      case "Time":
        return {
          time_kind: v("time_kind", "Labour"),
          start_at: v("start_at"),
          end_at: v("end_at"),
          note: v("note") || null,
        };
      case "Material":
        return {
          movement_kind: v("movement_kind", "Consumed"),
          description: v("description"),
          item_reference: v("item_reference") || null,
          quantity: v("quantity"),
          uom: v("uom", "EA"),
          lot: v("lot") || null,
          serial: v("serial") || null,
          source_reference: v("source_reference") || null,
          stock_status: v("stock_status", "Unknown"),
        };
      case "Observation":
        return {
          finding: v("finding"),
          confidence: v("confidence", "Reported"),
          attempted_fix: v("attempted_fix") || null,
          result: v("result") || null,
          follow_up_required: v("follow_up_required", "true") === "true",
        };
      case "Reading":
        return {
          name: v("name"),
          numeric_value:
            v("value_kind", "Numeric") === "Numeric"
              ? v("numeric_value")
              : null,
          text_value:
            v("value_kind", "Numeric") === "Text" ? v("text_value") : null,
          unit: v("unit", "°C"),
          context: v("context"),
        };
      case "Checklist":
        return {
          check_id: v("check_id", checkIds[0]),
          result: v("result", "NotPerformed"),
          reason: v("check_reason", v("reason")) || null,
          evidence_ids: v("evidence_ids") ? v("evidence_ids").split(",") : [],
        };
      case "Photo":
        return { attachment_id: v("attachment_id"), caption: v("caption") };
    }
  }
  return (
    <section className="business-card">
      <h2>
        {source
          ? `Correct ${source.kind.toLowerCase()} evidence v${source.version}`
          : "Capture field evidence"}
      </h2>
      <p>
        {source
          ? "The original will remain unchanged. This creates a reasoned successor."
          : "Record actual observations and quantities. Capture creates no stock posting, billing or approval."}
      </p>
      <p>{job.entries.length} server-saved evidence versions in History.</p>
      <ValidationFields error={s.error}>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void s.run(
              source ? `field-entries/${source.id}/correct` : "field-entries",
              {
                id: entryId,
                appointment_id: job.id,
                attendance_id: job.attendance!.id,
                kind,
                scope_item_id: task || null,
                asset_id: asset || null,
                captured_at: captured,
                payload: fields(),
                reason,
                ...(source ? { expected_version: source.version } : {}),
              },
            );
          }}
        >
          <fieldset disabled={s.busy || s.uncertain}>
            {!source && (
              <EnumField
                name="evidence-kind"
                label="Evidence type"
                value={kind}
                onChange={(x) => {
                  setKind(x);
                  setValues({});
                  setChanged(true);
                  s.dirty();
                }}
                values={fieldKinds}
              />
            )}
            <div className="form-grid">
              <SelectField
                name="scope_item_id"
                label="Authorised task"
                value={task}
                onChange={(x) => {
                  setTask(x);
                  setAsset("");
                  setChanged(true);
                  s.dirty();
                }}
                options={job.scope.items.map((t) => ({
                  id: t.id,
                  display_name: `${t.sequence}. ${t.description}`,
                }))}
              />
              <SelectField
                name="asset_id"
                label="Affected asset"
                value={asset}
                onChange={(x) => {
                  setAsset(x);
                  setChanged(true);
                  s.dirty();
                }}
                options={(
                  job.scope.items.find((t) => t.id === task)?.assets ?? []
                ).map((a) => ({
                  id: a.id,
                  display_name: `${a.reference} · ${a.description} · ${a.identity_status}`,
                }))}
              />
            </div>
            {kind === "Time" && (
              <>
                {en("time_kind", "Time category", timeKinds, "Labour")}
                <div className="form-grid">
                  {f("start_at", "Time start (UTC ISO)", {
                    required: true,
                    hint: "Example: 2026-09-05T01:00:00Z",
                  })}
                  {f("end_at", "Time finish (UTC ISO)", {
                    required: true,
                    hint: "Finish follows start. Exact elapsed seconds are calculated by the server.",
                  })}
                </div>
                {f("note", "Time explanation", {
                  multiline: true,
                  hint: "Required for Waiting and Other. No automatic breaks, rounding or overtime.",
                })}
              </>
            )}
            {kind === "Material" && (
              <>
                {en("movement_kind", "Material direction", materialKinds)}
                {f("description", "Material description", {
                  required: true,
                  multiline: true,
                })}
                <div className="form-grid">
                  {f("quantity", "Positive quantity", { required: true })}
                  {en("uom", "Unit of measure", units)}
                  {f("item_reference", "Item reference", {
                    hint: "Optional. SYN-PART-LOT and SYN-PART-SERIAL require matching traceability.",
                  })}
                  {f("lot", "Lot reference")}
                  {f("serial", "Serial reference")}
                  {f("source_reference", "Stock/source reference")}
                </div>
                {en("stock_status", "Reference confidence", [
                  "Unknown",
                  "ReviewRequired",
                ])}
                <p>
                  Required or Removed creates an owned material follow-up. It
                  does not purchase, return or post stock.
                </p>
              </>
            )}
            {kind === "Observation" && (
              <>
                {f("finding", "Finding", { required: true, multiline: true })}
                {en("confidence", "Finding confidence", [
                  "Reported",
                  "Suspected",
                  "Verified",
                ])}
                {f("attempted_fix", "Attempted action", { multiline: true })}
                {f("result", "Action result", {
                  multiline: true,
                  hint: "Retain failed or uncertain fixes. Required when an action is recorded.",
                })}
                <SelectField
                  name="follow_up_required"
                  label="Follow-up required"
                  value={v("follow_up_required", "true")}
                  onChange={(x) => put("follow_up_required", x)}
                  options={[
                    {
                      id: "true",
                      display_name: "Yes — create owned follow-up",
                    },
                    { id: "false", display_name: "No" },
                  ]}
                />
                <p>
                  Finding confidence does not verify the equipment identity or
                  certify compliance.
                </p>
              </>
            )}
            {kind === "Reading" && (
              <>
                {f("name", "Reading name", { required: true })}
                {en("value_kind", "Value type", ["Numeric", "Text"])}
                {v("value_kind", "Numeric") === "Numeric"
                  ? f("numeric_value", "Numeric value", { required: true })
                  : f("text_value", "Text value", { required: true })}
                {en("unit", "Reading unit", readingUnits)}
                {f("context", "Measurement context", {
                  required: true,
                  multiline: true,
                })}
              </>
            )}
            {kind === "Checklist" && (
              <>
                <SelectField
                  name="check_id"
                  label="Synthetic checklist item"
                  value={v("check_id", checkIds[0])}
                  onChange={(x) => put("check_id", x)}
                  options={checkIds.map((id) => ({
                    id,
                    display_name: id.replace("SYN-", "").replaceAll("-", " "),
                  }))}
                />
                {en(
                  "result",
                  "Checklist result",
                  ["Pass", "Fail", "NotPerformed", "NotApplicable"],
                  "NotPerformed",
                )}
                {f("check_reason", "Checklist reason", {
                  multiline: true,
                  hint: "Required for every non-Pass result. Mandatory checks do not permit Not applicable.",
                })}
                <SelectField
                  name="evidence_ids"
                  label="Supporting photo"
                  value={v("evidence_ids")}
                  onChange={(x) => put("evidence_ids", x)}
                  options={attachments}
                />
                <p>
                  Site controls and optional-photo checks require photo evidence
                  for Pass. Fail and Not performed retain owned follow-up.
                </p>
              </>
            )}
            {kind === "Photo" && (
              <>
                <SelectField
                  name="attachment_id"
                  label="Durable photo reference"
                  value={v("attachment_id")}
                  onChange={(x) => put("attachment_id", x)}
                  options={attachments}
                  required
                />
                {f("caption", "Meaningful photo caption", {
                  required: true,
                  multiline: true,
                })}
              </>
            )}
            <Field
              name="captured_at"
              label="Evidence captured at (UTC ISO)"
              value={captured}
              onChange={(x) => {
                setCaptured(x);
                setChanged(true);
                s.dirty();
              }}
              required
              maxLength={40}
            />
            <Field
              name="capture-reason"
              validationField="reason"
              label={source ? "Correction reason" : "Capture context"}
              value={reason}
              onChange={(x) => {
                setReason(x);
                setChanged(true);
                s.dirty();
              }}
              required
              multiline
              maxLength={1000}
            />
            <div className="actions">
              <button>
                {source ? "Save successor correction" : "Save evidence online"}
              </button>
              {source && (
                <button type="button" className="secondary" onClick={onDone}>
                  Cancel correction
                </button>
              )}
            </div>
          </fieldset>
          <SaveState s={s} dirty={changed || !!reason} />
        </form>
      </ValidationFields>
    </section>
  );
}
function CompletionForm({ job, reload }: { job: Job; reload: () => void }) {
  const last = job.draft_revisions[0],
    s = useSubmission(
      reload,
      last ? `Server-saved · Draft v${last.version}` : "",
    ),
    [dirty, setDirty] = useState(false),
    [id] = useState(job.draft?.id ?? crypto.randomUUID()),
    [outcome, setOutcome] = useState(last?.scope_outcome ?? "Partial"),
    [work, setWork] = useState(last?.work_performed ?? ""),
    [excluded, setExcluded] = useState(
      last?.exclusions ?? job.scope.exclusions,
    ),
    [remaining, setRemaining] = useState(last?.remaining_work ?? ""),
    [time, setTime] = useState(last?.time_declaration ?? "Incomplete"),
    [material, setMaterial] = useState(
      last?.material_declaration ?? "Incomplete",
    ),
    [reason, setReason] = useState(last?.declaration_reason ?? ""),
    [tasks, setTasks] = useState(() =>
      job.scope.items.map(
        (t) =>
          last?.task_outcomes.find((x) => x.scope_item_id === t.id) ?? {
            scope_item_id: t.id,
            outcome: "Partial",
            reason: "",
          },
      ),
    );
  return (
    <section className="business-card">
      <h2>Prepare completion draft</h2>
      <p>
        Declare your own time and materials. Record outcomes for the authorised
        scope and remaining work. This saves a draft. Use the separate
        submission action for review; Finance remains outside this workflow.
      </p>
      <ValidationFields error={s.error}>
        <form
          onChange={() => {
            s.dirty();
            setDirty(true);
          }}
          onSubmit={(e) => {
            e.preventDefault();
            void s.run(`appointments/${job.id}/completion-draft`, {
              id,
              attendance_id: job.attendance!.id,
              expected_version: job.draft?.version ?? 0,
              scope_outcome: outcome,
              work_performed: work,
              exclusions: excluded,
              remaining_work: remaining,
              time_declaration: time,
              material_declaration: material,
              declaration_reason: reason,
              task_outcomes: tasks,
              entries: job.entries
                .filter(
                  (x) =>
                    !x.superseded && x.actor_id === job.attendance?.actor_id,
                )
                .map((x) => ({ id: x.id, version: x.version })),
              required_attachment_ids: job.attachments
                .filter(
                  (x) =>
                    x.status !== "Rejected" &&
                    x.actor_id === job.attendance?.actor_id,
                )
                .map((x) => x.id),
              reason: "SYN save technician completion preparation",
            });
          }}
        >
          <fieldset disabled={s.busy || s.uncertain}>
            <EnumField
              name="scope_outcome"
              label="Overall scope outcome"
              value={outcome}
              onChange={(x) => {
                setOutcome(x);
                s.dirty();
              }}
              values={["Complete", "Partial", "UnableToProceed"]}
            />
            <Field
              name="work_performed"
              label="Actual work performed"
              value={work}
              onChange={setWork}
              required
              multiline
              maxLength={4000}
            />
            <Field
              name="exclusions"
              label="Exclusions and limits"
              value={excluded}
              onChange={setExcluded}
              required
              multiline
              maxLength={4000}
            />
            <Field
              name="remaining_work"
              label="Remaining work and reasons"
              value={remaining}
              onChange={setRemaining}
              required
              multiline
              maxLength={4000}
            />
            <div className="form-grid">
              <EnumField
                name="time_declaration"
                label="My time declaration"
                value={time}
                onChange={setTime}
                values={["AllRecorded", "None", "Incomplete"]}
              />
              <EnumField
                name="material_declaration"
                label="My material declaration"
                value={material}
                onChange={setMaterial}
                values={["AllRecorded", "None", "Incomplete"]}
              />
            </div>
            <Field
              name="declaration_reason"
              label="Declaration explanation"
              value={reason}
              onChange={setReason}
              required
              multiline
              maxLength={2000}
            />
            {tasks.map((t, i) => (
              <div key={t.scope_item_id} className="task-declaration">
                <h3>
                  {
                    job.scope.items.find((x) => x.id === t.scope_item_id)
                      ?.description
                  }
                </h3>
                <EnumField
                  name={`task-outcome-${i}`}
                  label={`Task ${i + 1} outcome`}
                  value={t.outcome}
                  onChange={(v) =>
                    setTasks((old) =>
                      old.map((x, n) => (n === i ? { ...x, outcome: v } : x)),
                    )
                  }
                  values={["Complete", "Partial", "UnableToProceed"]}
                />
                <Field
                  name={`task-reason-${i}`}
                  label={`Task ${i + 1} explanation`}
                  value={t.reason}
                  onChange={(v) =>
                    setTasks((old) =>
                      old.map((x, n) => (n === i ? { ...x, reason: v } : x)),
                    )
                  }
                  required
                  multiline
                  maxLength={2000}
                />
              </div>
            ))}
            <p>
              {
                job.entries.filter(
                  (x) =>
                    !x.superseded && x.actor_id === job.attendance?.actor_id,
                ).length
              }{" "}
              current evidence versions will be referenced exactly. Unavailable
              photos remain visible blockers. Partial work creates a
              service-owner follow-up with its due date needing resolution.
            </p>
            <button>Save completion draft</button>
          </fieldset>
          <SaveState s={s} dirty={dirty} />
        </form>
      </ValidationFields>
    </section>
  );
}
function EvidenceHistory({
  job,
  onCorrect,
}: {
  job: Job;
  onCorrect?: (e: Entry) => void;
}) {
  const p = useIdentity();
  return (
    <section className="business-card">
      <h2>Saved evidence and corrections</h2>
      {!job.entries.length ? (
        <p className="empty-state">
          No evidence has been saved for this visit.
        </p>
      ) : (
        job.entries.map((e) => (
          <article
            className={`field-evidence ${e.superseded ? "superseded" : ""}`}
            key={e.id}
          >
            <div className="record-heading">
              <h3>
                {e.kind} · v{e.version}
              </h3>
              <Status
                value={
                  e.superseded
                    ? "Superseded"
                    : e.authority_state === "ReviewRequired"
                      ? "ReviewRequired"
                      : "Captured"
                }
              />
            </div>
            <p>
              {e.actor_name} · Captured <Stamp value={e.captured_at} /> · Server
              received <Stamp value={e.received_at} />
            </p>
            <dl className="field-values">
              {Object.entries(e.payload)
                .filter(([, v]) => v !== null)
                .map(([k, v]) => (
                  <div key={k}>
                    <dt>{k.replaceAll("_", " ")}</dt>
                    <dd>{Array.isArray(v) ? v.join(", ") : String(v)}</dd>
                  </div>
                ))}
            </dl>
            {e.kind === "Photo" &&
              job.attachments.some(
                (a) => a.id === e.payload.attachment_id && a.retrieval_verified,
              ) && (
                <a
                  href={`/api/v1/attachments/${e.payload.attachment_id}/bytes`}
                  target="_blank"
                  rel="noreferrer"
                >
                  <Image
                    unoptimized
                    width={96}
                    height={64}
                    className="field-photo"
                    src={`/api/v1/attachments/${e.payload.attachment_id}/bytes`}
                    alt={String(e.payload.caption)}
                  />
                </a>
              )}
            {e.supersedes_entry_id && (
              <p>
                Successor of {e.supersedes_entry_id}. Correction:{" "}
                {e.correction_reason}
              </p>
            )}
            <details>
              <summary>Exact evidence reference</summary>
              <p className="hash-text">
                Entry {e.id} · original issue SHA-256 {e.issue_hash}
              </p>
            </details>
            {onCorrect && !e.superseded && e.actor_id === p.actor_id && (
              <button className="secondary" onClick={() => onCorrect(e)}>
                Correct this {e.kind.toLowerCase()} entry
              </button>
            )}
          </article>
        ))
      )}
    </section>
  );
}
export function FieldJobScreen({ id }: { id: string }) {
  const r = useResource<Envelope<Job>>(`my-jobs/${id}`),
    [source, setSource] = useState<Entry | null>(null),
    [formEpoch, setFormEpoch] = useState(0),
    [tab, setTab] = useState("Capture");
  const job = r.data?.items[0];
  return (
    <>
      <PageHeader
        eyebrow="Technician workspace · SC-10"
        title={job?.reference ?? "Field Job"}
        description={
          job
            ? `${job.customer_name} · ${job.site.name}`
            : r.loading ? "Loading current assigned context" : "Current assigned context is unavailable"
        }
        action={
          <button className="secondary" onClick={r.reload}>
            Refresh job
          </button>
        }
      />
      <PreviewLabel />
      <p>
        <Link href="/my-jobs">← My Jobs</Link>
      </p>
      <ReadState loading={r.loading} error={r.error} retry={r.reload} retained={!!job} />
      {job && (
        <>
          <div className="field-summary">
            <Status value={job.status} />
            <span>
              {job.assignment.name} · {job.assignment.crew_role}
            </span>
            <span>
              {job.work_order.reference} · {job.work_order.status}
            </span>
          </div>
          <section className="business-card">
            <h2>Current work context</h2>
            <p>
              <strong>Scheduled:</strong>{" "}
              <Stamp
                value={job.scheduled_start_at}
                timezone={job.site_timezone}
              />{" "}
              –{" "}
              <Stamp
                value={job.scheduled_end_at}
                timezone={job.site_timezone}
              />{" "}
              · {job.site_timezone}
            </p>
            <p>
              <strong>Customer date agreement:</strong>{" "}
              {job.customer_commitment}. Pack acknowledgement is recorded
              separately.
            </p>
            <p>
              <strong>Location:</strong> {job.site.location}
            </p>
            {job.contact && (
              <p>
                <strong>Contact:</strong> {job.contact.name} ·{" "}
                {job.contact.phone ?? "Phone unknown"} ·{" "}
                {job.contact.email ?? "Email unknown"}
              </p>
            )}
            <p>
              <strong>Site access:</strong> {job.site.access}
            </p>
            <p>
              <strong>Biosecurity:</strong> {job.site.biosecurity}
            </p>
            <h3>
              Authorised scope r{String(job.scope.revision).padStart(2, "0")}
            </h3>
            <p>{job.scope.summary}</p>
            <p>
              <strong>Exclusions:</strong> {job.scope.exclusions}
            </p>
            {job.scope.items.map((t) => (
              <div className="field-task" key={t.id}>
                <h3>
                  {t.sequence}. {t.description}
                </h3>
                <p>{t.kind}</p>
                <ul>
                  {t.completion_requirements.map((x, i) => (
                    <li key={i}>{x}</li>
                  ))}
                </ul>
                {t.assets.map((a) => (
                  <p key={a.id}>
                    {a.reference} · {a.description} · Identity:{" "}
                    <strong>{a.identity_status}</strong> · Serial:{" "}
                    {a.serial ?? "Unknown"}
                  </p>
                ))}
              </div>
            ))}
            <details>
              <summary>Source versions and exact pack</summary>
              <p>
                Schedule v{job.schedule_version} · Assignment v
                {job.assignment_version} · Scope v{job.scope_version}
              </p>
              <p className="hash-text">Scope hash {job.scope.hash}</p>
              {job.pack?.current_issue_id && (
                <Link href={`/documents/${job.pack.current_issue_id}`}>
                  Open exact job pack r
                  {String(job.pack.revision).padStart(2, "0")}
                </Link>
              )}
            </details>
          </section>
          {job.readiness.reasons.length > 0 && (
            <section className="business-card field-blockers">
              <h2>
                {job.attendance
                  ? "Stop further work — authority needs review"
                  : "Start blockers"}
              </h2>
              <ul>
                {job.readiness.reasons.map((x, i) => (
                  <li key={i}>{x}</li>
                ))}
              </ul>
              {job.attendance && (
                <p>
                  Retain observations of what happened against your original
                  authority. New work needs service-owner review.
                </p>
              )}
            </section>
          )}
          <StartPanel job={job} reload={r.reload} />
          {!job.attendance && <EvidenceHistory job={job} />}
          {job.attendance && (
            <>
              <nav className="field-tabs" aria-label="Field workspace sections">
                {["Capture", "Photos", "History", "Completion"].map((t) => (
                  <button
                    key={t}
                    className={tab === t ? "" : "secondary"}
                    aria-pressed={tab === t}
                    onClick={() => setTab(t)}
                  >
                    {t}
                  </button>
                ))}
              </nav>
              <div hidden={tab !== "Capture"}>
                <CaptureForm
                  key={`${source?.id ?? "new"}:${formEpoch}`}
                  job={job}
                  source={source}
                  reload={r.reload}
                  onDone={() => {
                    setSource(null);
                    setFormEpoch((x) => x + 1);
                  }}
                />
              </div>
              <div hidden={tab !== "Photos"}>
                <UploadPanel job={job} reload={r.reload} />
              </div>
              <div hidden={tab !== "History"}>
                <EvidenceHistory
                  job={job}
                  onCorrect={(e) => {
                    setSource(e);
                    setTab("Capture");
                  }}
                />
              </div>
              <div hidden={tab !== "Completion"}>
                <CompletionSubmission
                  key={`submission-${job.report?.version ?? 0}`}
                  job={job}
                  reload={r.reload}
                />
                <CompletionForm
                  key={`draft-${job.draft?.version ?? 0}`}
                  job={job}
                  reload={r.reload}
                />
                {job.draft_revisions.map((v) => (
                  <section className="business-card" key={v.id}>
                    <h2>
                      Saved completion draft v{v.version} · {v.scope_outcome}
                    </h2>
                    <p>
                      Server-saved <Stamp value={v.received_at} />. Submission
                      is a separate action above.
                    </p>
                    <p>{v.work_performed}</p>
                    <p>
                      <strong>Remaining work:</strong> {v.remaining_work}
                    </p>
                    {v.evidence_changed && (
                      <p className="business-error">
                        Referenced evidence has a successor. Review and save a
                        new completion draft.
                      </p>
                    )}
                    {v.blockers.length > 0 && (
                      <ul>
                        {v.blockers.map((b, i) => (
                          <li key={i}>{b}</li>
                        ))}
                      </ul>
                    )}
                    {v.follow_up_activity_id && (
                      <Link href={`/work/${v.follow_up_activity_id}`}>
                        Owned remaining-work follow-up
                      </Link>
                    )}
                  </section>
                ))}
              </div>
            </>
          )}
          {job.follow_ups.length > 0 && (
            <section className="business-card">
              <h2>Unresolved work and ownership</h2>
              {job.follow_ups.map((f) => (
                <p key={f.id}>
                  <Link href={`/work/${f.id}`}>{f.summary}</Link>
                  <br />
                  {f.owner_name} · {f.status}
                </p>
              ))}
            </section>
          )}
          <p className="read-meta">
            Current view read <Stamp value={r.data!.observed_at} />. Refresh
            after another crew member saves. Leaving this page loses unsaved
            form contents.
          </p>
        </>
      )}
    </>
  );
}
