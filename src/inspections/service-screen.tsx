"use client";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
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
import {
  useRecoverableCommand,
  type Receipt,
} from "../shared/ui/use-recoverable-command";
import { acceptsServiceInspectionEntry as accepts } from "./service-journal";
import type { loadServiceInspections, Mode } from "./service-context";
import type { previewServiceInspection } from "./service-commands";
import { criterionText, inspectionLabel, type Reading } from "./model";
import "../app/service-inspections.css";
type View = Awaited<ReturnType<typeof loadServiceInspections>>;
type Attempt = View["attempts"][number];
type Send = (
  fields: Record<string, unknown>,
  label: string,
) => Promise<boolean>;
export function ServiceInspectionScreen({ mode }: { mode: Mode }) {
  const query = useSearchParams(),
    appointment = query.get("appointment_id");
  return (
    <div id="ppo-service-inspections" className="service-inspections">
      <PageHeader
        eyebrow={mode === "capture" ? "Field work · FI-03" : "Service · FI-04"}
        title={mode === "capture" ? "Inspection capture" : "Inspection review"}
        description="Exact procedures, original evidence and retained corrections for a Service visit."
      />
      <p>
        Online inspection workflow · Synthetic procedures and limits ·{" "}
        <Link href={mode === "capture" ? "/my-jobs" : "/service/reports"}>
          {mode === "capture" ? "My Jobs" : "Service Review"}
        </Link>
      </p>
      {appointment ? (
        <Visit
          key={appointment}
          id={appointment}
          mode={mode}
          initialAttempt={query.get("attempt_id")}
        />
      ) : (
        <VisitList mode={mode} />
      )}
    </div>
  );
}
function VisitList({ mode }: { mode: Mode }) {
  const r = useCrmResource<{
    items: {
      id: string;
      reference: string;
      work_order: string;
      status: string;
    }[];
    window: string;
  }>(mode === "capture" ? "my-jobs/inspections" : "service/inspections", true);
  return (
    <>
      <ReadState loading={r.loading} error={r.error} retry={r.reload} />
      {r.data && (
        <section className="business-card">
          <h2>
            {mode === "capture" ? "Assigned visits" : "Submitted inspections"}
          </h2>
          <p>{r.data.window}</p>
          {r.data.items.length ? (
            r.data.items.map((j) => (
              <p key={j.id}>
                <Link
                  href={`/${mode === "capture" ? "my-jobs" : "service"}/inspections?appointment_id=${j.id}`}
                >
                  {j.reference} · {j.work_order}
                </Link>{" "}
                · {j.status}
              </p>
            ))
          ) : (
            <p>No permitted visits in this worklist.</p>
          )}
        </section>
      )}
    </>
  );
}
function Visit({
  id,
  mode,
  initialAttempt,
}: {
  id: string;
  mode: Mode;
  initialAttempt: string | null;
}) {
  const identity = useIdentity(),
    path =
      mode === "capture"
        ? `my-jobs/${id}/inspections`
        : `service/inspections/${id}`,
    target = `/${mode === "capture" ? "my-jobs" : "service"}/inspections?appointment_id=${id}`;
  const r = useCrmResource<View>(path),
    [epoch, setEpoch] = useState(0),
    [selected, setSelected] = useState<string | null>(initialAttempt);
  const [dirty, setDirty] = useState(false);
  const [savedDraft, setSavedDraft] = useState<{
    id: string;
    version: number;
    operation: string;
  } | null>(null);
  const command = useRecoverableCommand({
    key: `ppo.service-inspection.${identity.actor_id}.${id}`,
    scope: identity,
    accepts,
    transport: api,
    enabled: !!r.data && !r.error,
    journalLimit: 6_000_000,
  });
  const send: Send = async (fields, name) => {
    const receipt = await command.send(
      path,
      { reason: name, ...fields },
      target,
      name,
      id,
    );
    if (receipt) {
      received(receipt, fields);
      return true;
    }
    return false;
  };
  function received(receipt: Receipt, body: Record<string, unknown>) {
    if (body.action === "save" && typeof body.attempt_id === "string")
      setSavedDraft({
        id: body.attempt_id,
        version: receipt.record_version,
        operation: receipt.operation_id,
      });
    setEpoch((x) => x + 1);
    r.reload();
  }
  const locked =
    command.busy || !!command.pending || !command.ready || !!r.error;
  function choose(attempt: string) {
    if (attempt === selected || command.pending || command.busy) return;
    if (dirty && !window.confirm("Switch attempt and discard unsaved changes?"))
      return;
    setSelected(attempt);
    window.history.replaceState(null, "", target + "&attempt_id=" + attempt);
  }
  const v = r.data,
    at = v?.attempts.find((a) => a.row.id === selected);
  return (
    <>
      <ReadState loading={r.loading} error={r.error} retry={r.reload} />
      {v && (
        <>
          <section className="business-card">
            <h2>{v.appointment.display_number}</h2>
            <p>
              {v.work_order.display_number} · {v.appointment.status} ·{" "}
              <Link href={`/my-jobs/${id}`}>Visit and issued pack</Link> ·{" "}
              <Link href={`/my-jobs/site-readiness?appointment_id=${id}`}>
                Preparation
              </Link>
            </p>
            <p>
              Server drafts are retained. Unsaved edits exist only on this page.
              Disconnected inspection capture is unsupported. An uncertain
              original is retained in this tab across reload; closing the tab or
              clearing storage removes that recovery copy.
            </p>
            <p role="status">
              {command.busy
                ? "Saving — wait for the server receipt"
                : command.pending
                  ? "Uncertain result — recover the unchanged original"
                  : command.saved || "Saved records loaded from the server"}
            </p>
            <ErrorNotice error={command.error} />
            {command.pending && (
              <div className="button-row">
                <Button
                  disabled={command.busy}
                  onClick={async () => {
                    const body = command.pending!.body,
                      receipt = await command.recover();
                    if (receipt) received(receipt, body);
                    else r.reload();
                  }}
                >
                  Check original receipt
                </Button>
                <Button
                  disabled={command.busy}
                  onClick={async () => {
                    const body = command.pending!.body,
                      ok = await command.retry();
                    if (ok) {
                      received(ok, body);
                    }
                  }}
                >
                  Retry unchanged original
                </Button>
              </div>
            )}
            <Button onClick={r.reload} disabled={command.busy}>
              Refresh saved records
            </Button>
          </section>
          {mode === "capture" && (
            <OpenAttempt
              view={v}
              send={send}
              locked={locked || dirty}
              onOpened={choose}
            />
          )}
          <section className="business-card">
            <h2>Attempts and retained retests</h2>
            {v.attempts.length ? (
              v.attempts.map((a) => (
                <div key={a.row.id} className="inspection-summary">
                  <Button
                    aria-pressed={selected === a.row.id}
                    onClick={() => choose(a.row.id)}
                  >
                    Attempt {a.row.attempt_number} · {a.row.performer_name}
                  </Button>
                  <span>
                    {a.row.plan_source.reference} · {a.row.state} ·{" "}
                    {inspectionLabel(a.review)} · {a.applicability}
                  </span>
                  {a.row.predecessor_id && (
                    <span>
                      Retest of attempt{" "}
                      {
                        v.attempts.find(
                          (old) => old.row.id === a.row.predecessor_id,
                        )?.row.attempt_number
                      }
                    </span>
                  )}
                </div>
              ))
            ) : (
              <p>No saved attempt.</p>
            )}
          </section>
          {at && (
            <section className="business-card">
              <h2>Attempt {at.row.attempt_number}</h2>
              <p>
                {at.row.performer_name} · {at.row.plan_source.reference} ·{" "}
                {at.row.state} · {at.applicability}
              </p>
              {at.applicability_reasons.map((reason) => (
                <p key={reason} className="inspection-warning">
                  {reason}
                </p>
              ))}
              <details>
                <summary>
                  Exact equipment, work scope, template and preparation
                </summary>
                <pre>{JSON.stringify(at.binding.snapshot, null, 2)}</pre>
              </details>
              {at.row.state === "Draft" &&
              mode === "capture" &&
              at.row.performer_id === v.actor_id ? (
                <Draft
                  key={
                    at.row.id +
                    (savedDraft?.id === at.row.id &&
                    at.row.version >= savedDraft.version
                      ? ":" + savedDraft.operation
                      : "")
                  }
                  attempt={at}
                  view={v}
                  send={send}
                  locked={locked}
                  onDirty={setDirty}
                />
              ) : (
                <Results attempt={at} path={path} />
              )}
              <Evidence
                attempt={at}
                path={path}
                send={send}
                editable={
                  mode === "capture" &&
                  at.row.state === "Draft" &&
                  at.row.performer_id === v.actor_id
                }
                locked={locked}
              />
              {at.row.state === "Submitted" && (
                <>
                  <h3>Review history</h3>
                  {at.reviews.map((review) => (
                    <p key={review.id}>
                      {inspectionLabel(review.decision)} ·{" "}
                      {review.decided_by_name} · {String(review.decided_at)} ·{" "}
                      {review.reason}
                    </p>
                  ))}
                  {(mode === "review" ||
                    (at.review === "ClarificationRequired" &&
                      at.row.performer_id === v.actor_id)) && (
                    <Review
                      key={at.row.id + ":" + epoch}
                      attempt={at}
                      view={v}
                      send={send}
                      mode={mode}
                      locked={locked}
                    />
                  )}
                </>
              )}
            </section>
          )}
          <section className="business-card">
            <h2>Owned defects, corrections and retests</h2>
            {v.defects.length ? (
              v.defects.map((d) => (
                <Defect
                  key={d.id + ":" + epoch}
                  defect={d}
                  view={v}
                  send={send}
                  locked={locked}
                />
              ))
            ) : (
              <p>No defects recorded.</p>
            )}
          </section>
          <section className="business-card">
            <h2>Retained inspection output</h2>
            <p>
              Internal audience only. Incident clearance is unavailable. An
              inspection outcome completes no visit, work order, Project,
              customer acceptance or Finance process.
            </p>
            {v.outputs.length ? (
              v.outputs.map((o) => (
                <p key={o.id}>
                  Output {o.id} ·{" "}
                  {v.attempts.find((a) => a.row.id === o.attempt_id)
                    ?.applicability ?? "Unavailable"}{" "}
                  ·{" "}
                  <a
                    href={`/api/v1/${path}/files?output_id=${o.id}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Exact HTML
                  </a>{" "}
                  ·{" "}
                  <a
                    href={`/api/v1/${path}/files?output_id=${o.id}&format=pdf`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Exact PDF
                  </a>
                </p>
              ))
            ) : (
              <p>No inspection output issued.</p>
            )}
          </section>
        </>
      )}
    </>
  );
}
function OpenAttempt({
  view: v,
  send,
  locked,
  onOpened,
}: {
  view: View;
  send: Send;
  locked: boolean;
  onOpened: (id: string) => void;
}) {
  const [template, setTemplate] = useState(""),
    [target, setTarget] = useState(""),
    [predecessor, setPredecessor] = useState("");
  const selection = v.targets.find(
    (t) => `${t.scope_item_id}:${t.asset_id}` === target,
  );
  const preview = useCrmResource<
    Awaited<ReturnType<typeof previewServiceInspection>>
  >(
    template && selection
      ? `my-jobs/${v.appointment.id}/inspections/preview?template_id=${template}&scope_item_id=${selection.scope_item_id}&asset_id=${selection.asset_id}`
      : null,
    true,
  );
  return (
    <section className="business-card">
      <h2>Choose an applicable procedure</h2>
      <div className="inspection-fields">
        <label>
          Procedure
          <select
            value={template}
            onChange={(e) => setTemplate(e.target.value)}
          >
            <option value="">Choose a version</option>
            {v.catalogue
              .filter((t) => !t.retired)
              .map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title} · version {t.revision}
                </option>
              ))}
          </select>
        </label>
        <label>
          Equipment and task
          <select value={target} onChange={(e) => setTarget(e.target.value)}>
            <option value="">Choose exact work</option>
            {v.targets.map((t) => (
              <option
                key={t.scope_item_id + ":" + t.asset_id}
                value={t.scope_item_id + ":" + t.asset_id}
              >
                {t.asset_reference} · {t.task_description}
              </option>
            ))}
          </select>
        </label>
        <label>
          Retest lineage
          <select
            value={predecessor}
            onChange={(e) => setPredecessor(e.target.value)}
          >
            <option value="">Initial attempt</option>
            {v.attempts
              .filter((a) => a.row.state === "Submitted")
              .map((a) => (
                <option key={a.row.id} value={a.row.id}>
                  Fresh retest of attempt {a.row.attempt_number}
                </option>
              ))}
          </select>
        </label>
      </div>
      <ReadState
        loading={preview.loading}
        error={preview.error}
        retry={preview.reload}
      />
      {preview.data && (
        <>
          <h3>Exact selected basis</h3>
          {preview.data.checks.map((d) => (
            <p key={d.key}>
              {d.name} · {criterionText(d)} ·{" "}
              {d.required ? "Required" : "Optional"}
              {d.condition
                ? ` · ${d.condition.statement}: ${d.condition.outcome}`
                : ""}{" "}
              · {d.evidence_min} evidence ·{" "}
              {d.instrument_required
                ? "Instrument required"
                : "No instrument required"}
            </p>
          ))}
          <p>
            Configuration:{" "}
            {preview.data.configuration_reference ?? "Unavailable"}
          </p>
          <details>
            <summary>Read template source and preparation</summary>
            <pre>{JSON.stringify(preview.data.snapshot, null, 2)}</pre>
          </details>
          {preview.data.blockers.map((b) => (
            <p className="inspection-warning" key={b}>
              {b}
            </p>
          ))}
          <Button
            variant="primary"
            disabled={locked || preview.data.blockers.length > 0}
            onClick={async () => {
              const id = crypto.randomUUID();
              if (
                await send(
                  {
                    action: "open",
                    id,
                    template_id: template,
                    scope_item_id: selection!.scope_item_id,
                    asset_id: selection!.asset_id,
                    predecessor_id: predecessor || null,
                    binding_hash: preview.data!.binding_hash,
                  },
                  "Open inspection draft",
                )
              )
                onOpened(id);
            }}
          >
            Open inspection draft
          </Button>
        </>
      )}
    </section>
  );
}
function Draft({
  attempt: a,
  view: v,
  send,
  locked,
  onDirty,
}: {
  attempt: Attempt;
  view: View;
  send: Send;
  locked: boolean;
  onDirty: (dirty: boolean) => void;
}) {
  const [version, setVersion] = useState(a.row.version),
    [dirty, setDirty] = useState(false);
  const [readings, setReadings] = useState<Reading[]>(
    a.row.plan.map((d) => {
      const r = a.results.find((x) => x.check_key === d.key);
      return {
        check_key: d.key,
        state: r?.entry_state ?? "Recorded",
        value: r?.raw_value ?? null,
        unit: r?.unit ?? d.numeric?.unit ?? null,
        choice: r?.choice ?? null,
        reason: r?.reason ?? null,
        note: r?.note ?? null,
        evidence_ids: [],
      };
    }),
  );
  const [occurred, setOccurred] = useState(
    a.row.occurred_at
      ? new Date(a.row.occurred_at).toISOString().slice(0, 23)
      : "",
  );
  const [instrument, setInstrument] = useState(
      a.instruments[0]?.instrument_id ?? "",
    ),
    [findings, setFindings] = useState(a.row.findings ?? "");
  // A successful save or evidence mutation refreshes clean fields. Polling must never discard unsaved input.
  if (!dirty && version !== a.row.version) {
    setVersion(a.row.version);
    setReadings(
      a.row.plan.map((d) => {
        const r = a.results.find((x) => x.check_key === d.key);
        return {
          check_key: d.key,
          state: r?.entry_state ?? "Recorded",
          value: r?.raw_value ?? null,
          unit: r?.unit ?? d.numeric?.unit ?? null,
          choice: r?.choice ?? null,
          reason: r?.reason ?? null,
          note: r?.note ?? null,
          evidence_ids: [],
        };
      }),
    );
    setOccurred(
      a.row.occurred_at
        ? new Date(a.row.occurred_at).toISOString().slice(0, 23)
        : "",
    );
    setInstrument(a.instruments[0]?.instrument_id ?? "");
    setFindings(a.row.findings ?? "");
  }
  useUnsavedChanges(dirty, false);
  useEffect(() => {
    onDirty(dirty);
    return () => onDirty(false);
  }, [dirty, onDirty]);
  const change = (i: number, patch: Partial<Reading>) => {
    setDirty(true);
    setReadings((old) => old.map((r, j) => (i === j ? { ...r, ...patch } : r)));
  };
  const selectedInstrument = v.instruments.find((i) => i.id === instrument);
  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        if (
          await send(
            {
              action: "save",
              attempt_id: a.row.id,
              expected_version: version,
              occurred_at: occurred
                ? new Date(occurred + "Z").toISOString()
                : null,
              readings: readings.map(({ evidence_ids, ...r }) => {
                void evidence_ids;
                return r;
              }),
              instrument_ids: instrument ? [instrument] : [],
              findings: findings || null,
            },
            "Save inspection draft",
          )
        )
          setDirty(false);
      }}
    >
      <p role="status">
        {dirty ? "Unsaved edits — save before leaving" : "Saved draft"} ·
        version {version}
      </p>
      {version !== a.row.version && (
        <div className="inspection-warning">
          <p>
            Conflict: the saved draft is now version {a.row.version}. Your
            entries remain here.
          </p>
          <Button disabled={locked} onClick={() => setVersion(a.row.version)}>
            Use current version with my retained entries
          </Button>
        </div>
      )}
      <fieldset disabled={locked}>
        <legend>Raw readings and test context</legend>
        <div className="inspection-fields">
          <label>
            Test time (UTC)
            <input
              type="datetime-local"
              step="0.001"
              value={occurred}
              required
              onChange={(e) => {
                setOccurred(e.target.value);
                setDirty(true);
              }}
            />
          </label>
          <Button
            onClick={() => {
              setOccurred(new Date().toISOString().slice(0, 23));
              setDirty(true);
            }}
          >
            Record current test time
          </Button>
          <label>
            Instrument
            <select
              value={instrument}
              onChange={(e) => {
                setInstrument(e.target.value);
                setDirty(true);
              }}
            >
              <option value="">No instrument selected</option>
              {v.instruments.map((i) => (
                <option value={i.id} key={i.id}>
                  {i.reference} · {i.calibration_reference} · {i.valid_from} to{" "}
                  {i.valid_to}
                  {i.withdrawn_effective_from ? " · withdrawn" : ""}
                </option>
              ))}
            </select>
          </label>
        </div>
        {selectedInstrument && (
          <p>
            Selected catalogue evidence (retained when you save):{" "}
            {selectedInstrument.measurement_type ??
              "Measurement type unavailable"}{" "}
            · {selectedInstrument.measurement_range ?? "Range unavailable"} ·{" "}
            {selectedInstrument.measurement_unit ?? "Unit unavailable"} ·{" "}
            certificate{" "}
            {selectedInstrument.certificate_reference ?? "unavailable"} /{" "}
            {selectedInstrument.certificate_revision ?? "unverified"}.
          </p>
        )}
        {a.row.plan.map((d, i) => (
          <fieldset key={d.key}>
            <legend>{d.name}</legend>
            <p>
              {criterionText(d)} · {d.required ? "Required" : "Optional"} ·{" "}
              {d.numeric
                ? `${d.numeric.precision} decimal places; approved conversions: ${d.numeric.conversions.map((c) => c.from_unit + " × " + c.multiply + " + " + c.add).join(", ") || "none"}`
                : "Exact listed choice"}
            </p>
            <p>
              {d.condition
                ? d.condition.statement + " · " + d.condition.outcome
                : "Unconditional"}{" "}
              · Evidence required: {d.evidence_min} ·{" "}
              {d.instrument_required
                ? "Calibrated instrument required"
                : "Instrument optional"}
            </p>
            {d.instrument_basis && (
              <p>
                Required instrument basis: {d.instrument_basis.measurement_type}{" "}
                · {d.instrument_basis.range} · {d.instrument_basis.unit}, with a
                retained certificate reference and revision valid for the test
                time.
              </p>
            )}
            <div className="inspection-fields">
              <label>
                Entry state
                <select
                  value={readings[i].state}
                  onChange={(e) =>
                    change(i, { state: e.target.value as Reading["state"] })
                  }
                >
                  <option>Recorded</option>
                  <option>NotTested</option>
                  {d.condition?.outcome === "False" && (
                    <option>NotApplicable</option>
                  )}
                </select>
              </label>
              {d.check_type === "Numeric" ? (
                <>
                  <label>
                    {d.name} reading
                    <input
                      inputMode="decimal"
                      value={readings[i].value ?? ""}
                      onChange={(e) =>
                        change(i, { value: e.target.value || null })
                      }
                    />
                  </label>
                  <label>
                    Unit
                    <input
                      value={readings[i].unit ?? ""}
                      onChange={(e) =>
                        change(i, { unit: e.target.value || null })
                      }
                    />
                  </label>
                </>
              ) : (
                <label>
                  Outcome
                  <select
                    value={readings[i].choice ?? ""}
                    onChange={(e) =>
                      change(i, { choice: e.target.value || null })
                    }
                  >
                    <option value="">Choose an outcome</option>
                    {d.qualitative?.choices.map((choice) => (
                      <option key={choice}>{choice}</option>
                    ))}
                  </select>
                </label>
              )}
              <label>
                Reason / observation
                <input
                  value={readings[i].reason ?? ""}
                  onChange={(e) =>
                    change(i, { reason: e.target.value || null })
                  }
                />
              </label>
            </div>
          </fieldset>
        ))}
        <Field
          name="findings"
          label="Findings"
          value={findings}
          onChange={(value) => {
            setFindings(value);
            setDirty(true);
          }}
        />
        <div className="button-row">
          <Button
            type="submit"
            variant="primary"
            disabled={version !== a.row.version}
          >
            Save draft
          </Button>
          <Button
            disabled={dirty || version !== a.row.version}
            onClick={() =>
              void send(
                {
                  action: "submit",
                  attempt_id: a.row.id,
                  expected_version: a.row.version,
                  owner_id: v.actor_id,
                },
                "Submit exact inspection",
              )
            }
          >
            Submit exact attempt
          </Button>
        </div>
      </fieldset>
    </form>
  );
}
function Results({ attempt: a }: { attempt: Attempt; path: string }) {
  return (
    <>
      <h3>Submitted readings</h3>
      {a.row.plan.map((d) => {
        const r = a.results.find((x) => x.check_key === d.key);
        return (
          <div key={d.key} className="inspection-summary">
            <strong>{d.name}</strong>
            <span>
              {criterionText(d)} ·{" "}
              {r?.choice ?? `${r?.raw_value ?? ""} ${r?.unit ?? ""}`} ·{" "}
              {r?.evaluation ?? "Not tested"}
            </span>
            <span>
              {r?.reason} {r?.evaluation_reason}
            </span>
          </div>
        );
      })}
      <p>
        Performed at {String(a.row.occurred_at)} · received{" "}
        {String(a.row.submitted_at)} · exact hash {a.row.submitted_hash}
      </p>
      {a.instruments.map((i) => (
        <p key={i.instrument_id}>
          {i.snapshot.reference} · retained {i.snapshot.calibration_reference} /{" "}
          {i.snapshot.calibration_version} · {i.snapshot.valid_from}–
          {i.snapshot.valid_to} · {i.assessment} · {i.reason}
          {" · "}
          {i.snapshot.measurement_type ?? "Measurement type unavailable"}
          {" · "}
          {i.snapshot.measurement_range ?? "Range unavailable"}
          {" · "}
          {i.snapshot.measurement_unit ?? "Unit unavailable"}
          {" · certificate "}
          {i.snapshot.certificate_reference ?? "unavailable"} /{" "}
          {i.snapshot.certificate_revision ?? "unverified"}
        </p>
      ))}
    </>
  );
}
function Evidence({
  attempt: a,
  path,
  send,
  editable,
  locked,
}: {
  attempt: Attempt;
  path: string;
  send: Send;
  editable: boolean;
  locked: boolean;
}) {
  const [check, setCheck] = useState(a.row.plan[0]?.key ?? ""),
    [classification, setClassification] = useState("Internal"),
    [error, setError] = useState<unknown>(null);
  return (
    <>
      <h3>Exact evidence</h3>
      {a.evidence.map((e) => (
        <div key={e.id} className="inspection-summary">
          <span>
            {e.label} · {e.state} · {e.access_class} · {e.added_by_name} ·{" "}
            {a.row.plan.find((d) => d.key === e.check_key)?.name}
          </span>
          {e.state === "Complete" && (
            <a
              target="_blank"
              rel="noreferrer"
              href={`/api/v1/${path}/files?evidence_id=${e.id}`}
            >
              Open original evidence
            </a>
          )}
          <small>{e.content_hash}</small>
          {editable && (
            <Button
              disabled={locked}
              onClick={() =>
                void send(
                  {
                    action: "remove_evidence",
                    attempt_id: a.row.id,
                    expected_version: a.row.version,
                    evidence_id: e.id,
                  },
                  "Remove draft evidence",
                )
              }
            >
              Remove from draft
            </Button>
          )}
        </div>
      ))}
      {editable && (
        <fieldset disabled={locked}>
          <legend>Add evidence</legend>
          <p>
            Verified PNG up to 4 MiB, or plain text up to 64 KiB. Browser
            recovery storage must retain the exact original before upload;
            insufficient storage sends nothing.
          </p>
          <label>
            Evidence check
            <select value={check} onChange={(e) => setCheck(e.target.value)}>
              {a.row.plan.map((d) => (
                <option value={d.key} key={d.key}>
                  {d.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Access classification
            <select
              value={classification}
              onChange={(e) => setClassification(e.target.value)}
            >
              <option>Internal</option>
              <option>CustomerSafe</option>
            </select>
          </label>
          <label>
            Original file
            <input
              type="file"
              accept="image/png,text/plain"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                setError(null);
                try {
                  const bytes = new Uint8Array(await file.arrayBuffer());
                  if (bytes.length > 4194304)
                    throw Error("File exceeds 4 MiB.");
                  const digest = new Uint8Array(
                      await crypto.subtle.digest("SHA-256", bytes),
                    ),
                    sha256 = Array.from(digest, (b) =>
                      b.toString(16).padStart(2, "0"),
                    ).join("");
                  let binary = "";
                  for (const b of bytes) binary += String.fromCharCode(b);
                  await send(
                    {
                      action: "evidence",
                      attempt_id: a.row.id,
                      expected_version: a.row.version,
                      evidence: {
                        id: crypto.randomUUID(),
                        check_key: check,
                        label: file.name,
                        purpose: "Inspection check evidence",
                        access_class: classification,
                        kind: "StoredFile",
                        media_type: file.type,
                        byte_count: bytes.length,
                        sha256,
                        content_base64: btoa(binary),
                      },
                    },
                    "Retain exact inspection evidence",
                  );
                } catch (err) {
                  setError({
                    message:
                      err instanceof Error
                        ? err.message
                        : "Upload unavailable; original file remains with you.",
                  });
                }
              }}
            />
          </label>
          <ErrorNotice error={error} />
        </fieldset>
      )}
    </>
  );
}
function Review({
  attempt: a,
  view: v,
  send,
  mode,
  locked,
}: {
  attempt: Attempt;
  view: View;
  send: Send;
  mode: Mode;
  locked: boolean;
}) {
  const [reason, setReason] = useState(""),
    [decision, setDecision] = useState("Returned"),
    [due, setDue] = useState("");
  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        await send(
          {
            action: mode === "review" ? "review" : "clarify",
            id: crypto.randomUUID(),
            attempt_id: a.row.id,
            decision,
            decision_reason: reason,
            owner_id: a.row.performer_id,
            due:
              due || new Date(Date.now() + 86400000).toISOString().slice(0, 10),
          },
          mode === "review"
            ? "Review exact inspection"
            : "Provide clarification",
        );
      }}
    >
      <fieldset disabled={locked}>
        <legend>
          {mode === "review"
            ? "Independent review"
            : "Provide requested clarification"}
        </legend>
        {mode === "review" && (
          <label>
            Decision
            <select
              value={decision}
              onChange={(e) => setDecision(e.target.value)}
            >
              {["Accepted", "Returned", "ClarificationRequired", "OnHold"].map(
                (d) => (
                  <option key={d}>{d}</option>
                ),
              )}
            </select>
          </label>
        )}
        <label>
          Decision reason
          <textarea
            required
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </label>
        <label>
          Follow-up due
          <input
            type="date"
            value={due}
            onChange={(e) => setDue(e.target.value)}
          />
        </label>
        <p>
          Returned, clarified or held work remains owned by{" "}
          {a.row.performer_name}.
        </p>
        <Button
          type="submit"
          disabled={["Accepted", "Returned"].includes(a.review)}
          variant="primary"
        >
          Save review decision
        </Button>
        {mode === "review" && a.review === "Accepted" && (
          <Button
            disabled={!reason.trim() || a.applicability !== "Current"}
            onClick={() =>
              void send(
                {
                  action: "release",
                  id: crypto.randomUUID(),
                  attempt_id: a.row.id,
                  decision_reason: reason,
                },
                "Issue scoped inspection outcome",
              )
            }
          >
            Issue scoped inspection outcome
          </Button>
        )}
        <p>
          Service owner: {v.work_order.service_owner_id}. Review and release
          recheck current scope and authority.
        </p>
      </fieldset>
    </form>
  );
}
function Defect({
  defect: d,
  view: v,
  send,
  locked,
}: {
  defect: View["defects"][number];
  view: View;
  send: Send;
  locked: boolean;
}) {
  const [note, setNote] = useState("");
  return (
    <article>
      <h3>
        {d.reference} · {d.title}
      </h3>
      <p>
        {d.state} · owner {d.owner_name} · due {d.due}
      </p>
      <p>
        Original attempt{" "}
        {
          v.attempts.find((a) => a.row.id === d.source_attempt_id)?.row
            .attempt_number
        }{" "}
        · {d.correction_note ?? "Correction not recorded"}
        {d.closed_by_attempt_id
          ? " · accepted retest " +
            v.attempts.find((a) => a.row.id === d.closed_by_attempt_id)?.row
              .attempt_number
          : ""}
      </p>
      {d.activity_id ? (
        <p>
          <Link href={`/work/${d.activity_id}`}>Owned corrective Activity</Link>{" "}
          · {d.activity?.status}. Activity completion does not close this
          defect.
        </p>
      ) : (
        <p>Owned Activity unavailable.</p>
      )}
      {d.owner_id === v.actor_id && d.state !== "Closed" && (
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            await send(
              {
                action: "correct",
                defect_id: d.id,
                expected_version: d.version,
                note,
              },
              "Record owned correction",
            );
          }}
        >
          <label>
            Correction evidence and action
            <textarea
              required
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </label>
          <Button type="submit" disabled={locked || !note.trim()}>
            Record correction
          </Button>
        </form>
      )}
      <details>
        <summary>Retained correction events</summary>
        {v.events
          .filter((e) => e.action === "correct" && e.details.defect_id === d.id)
          .map((e, i) => (
            <p key={i}>
              {String(e.recorded_at)} · {e.actor_id} · {e.details.note}
            </p>
          ))}
      </details>
    </article>
  );
}
