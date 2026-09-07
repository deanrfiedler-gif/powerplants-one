"use client";
import { useId, useRef, useState } from "react";
import Link from "next/link";
import {
  api,
  useResource,
  useCommand,
  ErrorNotice,
  ReadState,
  isDenied,
  Stamp,
  friendly,
  type Envelope,
} from "./business-ui";
import type { Job } from "./field-screens";
import type { readReport } from "../reports/service";
import { responseChoices } from "../reports/validation";
import { sha256 } from "../offline/protocol";
import { queue } from "../offline/store";
import { useIdentity } from "./business-session";
type Report = Awaited<ReturnType<typeof readReport>>["items"][number];
type Presentation = {
  id: string;
  revision_id: string;
  kind: string;
  content_hash: string;
};
function Input({
  label,
  value,
  onChange,
  options,
  multiline = false,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options?: readonly string[];
  multiline?: boolean;
  type?: string;
}) {
  const id = useId();
  return (
    <div className="report-field">
      <label htmlFor={id}>{label}</label>
      {options ? (
        <select
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        >
          {options.map((v) => (
            <option key={v} value={v}>
              {friendly(v)}
            </option>
          ))}
        </select>
      ) : multiline ? (
        <textarea
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={3}
        />
      ) : (
        <input
          id={id}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
    </div>
  );
}
function Synthetic() {
  return (
    <p className="field-preview">
      <strong>Synthetic service review — private prototype</strong> Attendance,
      remaining work, report issue and customer response are separate facts.
      Customer response does not approve billing.
    </p>
  );
}
export function CompletionSubmission({
  job,
  reload,
}: {
  job: Job;
  reload: () => void;
}) {
  const identity = useIdentity();
  const c = useCommand(),
    [localError, setLocalError] = useState<unknown>(null),
    [id] = useState(() => job.report?.id ?? crypto.randomUUID()),
    [end, setEnd] = useState(
      () => job.accepted_end_at ?? new Date().toISOString(),
    ),
    [reason, setReason] = useState("");
  const d = job.draft_revisions[0],
    r = job.report;
  return (
    <section className="business-card">
      <h2>Submit exact completion</h2>
      <p>
        Saving a draft does not submit it. Submission freezes your current
        evidence and declarations for review. Resolve all unsent local evidence
        in the offline workspace before submitting here.
      </p>
      {r && (
        <p>
          <Link href={`/service/reports/${r.id}`}>
            Open report review and revision history
          </Link>{" "}
          · {friendly(r.status)}
        </p>
      )}
      {d && (!r || ["Draft", "Returned"].includes(r.status)) ? (
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            setLocalError(null);
            try {
              if (localStorage.getItem("ppo-offline-marker")) {
                const originals = await queue(identity);
                const pending = originals.filter(
                  (x) =>
                    x.original.appointment_id === job.id &&
                    x.original.command !== "CustomerResponse" &&
                    x.status.state !== "ServerSaved",
                );
                if (pending.length)
                  throw Error(
                    "Resolve this attendance’s retained offline originals before a new online submission. Open the offline workspace and retry or review each original; no submission was sent.",
                  );
              }
            } catch (error) {
              setLocalError({
                message:
                  error instanceof Error
                    ? error.message
                    : "The offline originals could not be checked. Verify the saved workspace before submitting.",
              });
              return;
            }
            if (
              await c.send(`appointments/${job.id}/submit-completion`, {
                id,
                attendance_id: job.attendance!.id,
                draft_revision_id: d.id,
                expected_draft_version: job.draft!.version,
                expected_report_version: r?.version ?? 0,
                expected_appointment_version: job.version,
                attendance_end_at: end,
                reason,
              })
            )
              reload();
          }}
        >
          <p>
            Draft v{d.version} · {d.scope_outcome} ·{" "}
            {job.entries.filter((e) => !e.superseded).length} current entries
          </p>
          <Input
            label="Attendance end (ISO date with timezone)"
            value={end}
            onChange={setEnd}
          />
          <Input
            label="Submission reason"
            value={reason}
            onChange={setReason}
            multiline
          />
          <ErrorNotice error={localError ?? c.error} />
          <button disabled={c.busy}>Submit exact evidence for review</button>
          <p role="status">{c.saved}</p>
        </form>
      ) : (
        <p>
          {d
            ? "This submitted set is frozen. A reviewer can return it; an accepted report needs an explicit correction cycle."
            : "Save a complete declaration draft before submission."}
        </p>
      )}
    </section>
  );
}
export function ReportListScreen() {
  const r = useResource<
    Envelope<{
      id: string;
      reference: string;
      revision: number;
      status: string;
      appointment_reference: string;
    }>
  >("reports");
  return (
    <main className="business-shell report-screen">
      <h1>Service review and reports</h1>
      <Synthetic />
      <ErrorNotice error={r.error} />
      <p>
        Recent permitted reports from a bounded 200-record window. Older reports
        remain linked to their original attendance.
      </p>
      <button onClick={r.reload}>Refresh reports</button>
      {r.loading && <p role="status">Loading reports…</p>}
      {!r.loading && !r.error && r.data?.items.length === 0 && (
        <p>
          No permitted submissions appear in this recent window. Technicians
          submit from their job’s Completion tab.
        </p>
      )}
      {!r.loading && !r.error && r.data?.items.map((x) => (
        <article className="business-card" key={x.id}>
          <h2>
            <Link href={`/service/reports/${x.id}`}>{x.reference}</Link>
          </h2>
          <p>
            {x.appointment_reference} · revision {x.revision} ·{" "}
            {friendly(x.status)}
          </p>
        </article>
      ))}
    </main>
  );
}
function ReviewForm({ r, reload }: { r: Report; reload: () => void }) {
  const c = useCommand(),
    v = r.revisions[0],
    [decision, setDecision] = useState("Approved"),
    [selectedRecipient, setSelectedRecipient] = useState(""),
    [remarks, setRemarks] = useState(""),
    [authority, setAuthority] = useState("Current"),
    [entries, setEntries] = useState(() =>
      (
        v.snapshot.entries as {
          id: string;
          version: number;
          kind: string;
          payload: Record<string, unknown>;
        }[]
      ).map((e) => ({ ...e, decision: "Approved", remarks: "" })),
    );
  return (
    <form
      className="business-card"
      onSubmit={async (e) => {
        e.preventDefault();
        if (
          await c.send(`reports/${r.id}/review`, {
            expected_version: r.version,
            revision_id: v.id,
            source_hash: v.source_hash,
            decision,
            entry_decisions: entries.map((x) => ({
              id: x.id,
              version: x.version,
              decision: x.decision,
              remarks: x.remarks,
            })),
            authority_disposition: authority,
            remarks,
            recipient_id: decision === "Approved" ? selectedRecipient || null : null,
            reason: remarks,
          })
        )
          reload();
      }}
    >
      <h2>Review exact submitted entries</h2>
      <p>
        Reviewing preserves every technician original. Return factual
        corrections to the technician. Quantities shown here remain captured
        quantities; approval records the exact same reviewed quantity, without
        financial treatment.
      </p>
      {entries.map((x, i) => (
        <fieldset key={x.id}>
          <legend>
            {x.kind} · v{x.version}
          </legend>
          <dl>
            {Object.entries(x.payload).map(([k, value]) => (
              <div key={k}>
                <dt>{friendly(k)}</dt>
                <dd>{String(value ?? "—")}</dd>
              </div>
            ))}
          </dl>
          <Input
            label={`Entry ${i + 1} decision`}
            value={x.decision}
            options={["Approved", "Returned"]}
            onChange={(value) =>
              setEntries(
                entries.map((a, n) =>
                  n === i ? { ...a, decision: value } : a,
                ),
              )
            }
          />
          <Input
            label={`Entry ${i + 1} review reason`}
            value={x.remarks}
            multiline
            onChange={(value) =>
              setEntries(
                entries.map((a, n) => (n === i ? { ...a, remarks: value } : a)),
              )
            }
          />
        </fieldset>
      ))}
      <Input
        label="Review decision"
        value={decision}
        options={["Approved", "Returned"]}
        onChange={setDecision}
      />
      <Input
        label="Authority disposition"
        value={authority}
        options={["Current", "OriginalAttendanceOnly"]}
        onChange={setAuthority}
      />
      <p>
        Original attendance only records changed scope or pack context; it
        grants no new physical work authority.
      </p>
      <Input
        label="Review remarks (internal)"
        value={remarks}
        onChange={setRemarks}
        multiline
      />
      {decision === "Approved" && (
        <div className="report-field">
          <label htmlFor="report-customer-audience">Customer audience</label>
          <select id="report-customer-audience" value={selectedRecipient} onChange={(e) => setSelectedRecipient(e.target.value)}>
            <option value="">Select the permitted site contact</option>
            {r.permitted_recipient && <option value={r.permitted_recipient.id}>{r.permitted_recipient.name} · Site primary contact</option>}
          </select>
          <p>The exact reviewed report is prepared for this named contact. This selection does not send or deliver it.</p>
          {!r.permitted_recipient && <p>No currently permitted active primary contact is available. Resolve the site contact before approving; a return remains available.</p>}
        </div>
      )}
      <ErrorNotice error={c.error} />
      <button disabled={c.busy}>Commit exact review</button>
    </form>
  );
}
function ResponseForm({
  r,
  v,
  presentedAt,
  reload,
}: {
  r: Report;
  v: Presentation;
  presentedAt: string;
  reload: () => void;
}) {
  const c = useCommand(),
    [id] = useState(() => crypto.randomUUID()),
    [choice, setChoice] = useState("Accepted"),
    [name, setName] = useState(""),
    [role, setRole] = useState(""),
    [remarks, setRemarks] = useState(""),
    [next, setNext] = useState(""),
    [captured, setCaptured] = useState(""),
    [signature, setSignature] = useState<null | {
      sha256: string;
      byte_count: number;
      content_base64: string;
    }>(null),
    [fileError, setFileError] = useState<unknown>(null),
    [markLoading, setMarkLoading] = useState(false),
    markSelection = useRef(0);
  return (
    <form
      className="business-card"
      onSubmit={async (e) => {
        e.preventDefault();
        if (markLoading || fileError || c.busy) return;
        const capturedAt = captured || new Date().toISOString();
        setCaptured(capturedAt);
        if (
          await c.send(`reports/${r.id}/respond`, {
            id,
            presentation_id: v.id,
            revision_id: v.revision_id,
            presentation_kind: v.kind,
            presented_hash: v.content_hash,
            expected_report_version: r.version,
            response: choice,
            respondent_name: choice === "Unavailable" ? null : name,
            respondent_role: choice === "Unavailable" ? null : role,
            remarks: remarks || null,
            next_action: next || null,
            presented_at: presentedAt,
            captured_at: capturedAt,
            signature: choice === "Unavailable" ? null : signature,
            reason: "Synthetic customer response to exact presented content.",
          })
        )
          reload();
      }}
    >
      <h2>Record customer response</h2>
      <p>
        <strong>{friendly(v.kind)}</strong> · exact content{" "}
        <code>{v.content_hash}</code>
      </p>
      <p>
        Presentation recorded <Stamp value={presentedAt} />. A fictional name or
        synthetic mark is not independently verified identity, project
        acceptance or Finance approval.
      </p>
      <Input
        label="Customer response"
        value={choice}
        onChange={(value) => {
          setChoice(value);
          if (value === "Unavailable") {
            markSelection.current++;
            setSignature(null);
            setFileError(null);
            setMarkLoading(false);
          }
        }}
        options={responseChoices}
      />
      {choice !== "Unavailable" && (
        <>
          <Input
            label="Stated respondent name (synthetic)"
            value={name}
            onChange={setName}
          />
          <Input
            label="Stated respondent role"
            value={role}
            onChange={setRole}
          />
          <label className="report-field">
            Optional synthetic signature PNG
            <input
              type="file"
              accept="image/png"
              onChange={async (e) => {
                const selection = ++markSelection.current;
                setFileError(null);
                setSignature(null);
                setMarkLoading(true);
                try {
                  const f = e.target.files?.[0];
                  if (!f) return;
                  if (f.size > 4194304)
                    throw Error("Choose a PNG no larger than 4 MiB.");
                  const bytes = new Uint8Array(await f.arrayBuffer());
                  let text = "";
                  for (let n = 0; n < bytes.length; n += 32768)
                    text += String.fromCharCode(
                      ...bytes.subarray(n, n + 32768),
                    );
                  const hash = await sha256(bytes);
                  if (selection !== markSelection.current) return;
                  setSignature({
                    sha256: hash,
                    byte_count: bytes.length,
                    content_base64: btoa(text),
                  });
                } catch (error) {
                  if (selection === markSelection.current)
                    setFileError({ message: (error as Error).message });
                } finally {
                  if (selection === markSelection.current)
                    setMarkLoading(false);
                }
              }}
            />
          </label>
        </>
      )}
      <Input
        label={
          choice === "Unavailable"
            ? "Unavailable reason"
            : "Response remarks / reservations"
        }
        value={remarks}
        onChange={setRemarks}
        multiline
      />
      <Input
        label="Owned next action (required unless accepted)"
        value={next}
        onChange={setNext}
        multiline
      />
      <p>Follow-up is assigned to the current service owner.</p>
      <Input
        label="Captured at (ISO date with timezone)"
        value={captured}
        onChange={setCaptured}
      />
      <p>
        Leave capture time blank to record the first save attempt. An uncertain
        retry retains that exact time.
      </p>
      {markLoading && <p role="status">Checking the selected synthetic PNG…</p>}
      <ErrorNotice error={fileError ?? c.error} />
      <button disabled={c.busy || !!fileError || markLoading}>
        Save response to presented content
      </button>
      <p role="status">{c.saved}</p>
    </form>
  );
}
export function ReportScreen({ id }: { id: string }) {
  const resource = useResource<Envelope<Report>>(`reports/${id}`),
    r = resource.data?.items[0],
    c = useCommand(),
    [reason, setReason] = useState(""),
    [shown, setShown] = useState<{
      v: Presentation;
      at: string;
      version: number;
      html: string;
    } | null>(null),
    [error, setError] = useState<unknown>(null);
  const reload = () => {
    setShown(null);
    resource.reload();
  };
  async function preview(v: Presentation) {
    try {
      setError(null);
      const res = await fetch(
        `/api/v1/reports/${id}/html?presentation_id=${v.id}`,
        { cache: "no-store" },
      );
      if (!res.ok) throw await res.json();
      const html = await res.text();
      if ((await sha256(html)) !== v.content_hash)
        throw {
          message:
            "The presented bytes differ from the exact report hash. Refresh and recover the original report.",
        };
      setShown({ v, at: new Date().toISOString(), version: r!.version, html });
    } catch (e) {
      setError(e);
    }
  }
  if (isDenied(error) || isDenied(c.error)) return <ErrorNotice error={isDenied(error) ? error : c.error} />;
  if (r && shown)
    return (
      <main className="business-shell report-screen">
        <h1>Customer report presentation</h1>
        <Synthetic />
        <button className="secondary" onClick={() => setShown(null)}>
          Return to staff review
        </button>
        <iframe
          title="Exact customer-safe report presentation"
          sandbox=""
          className="report-preview"
          srcDoc={shown.html}
        />
        {r.can_respond &&
        shown.v.revision_id === r.revisions[0].id &&
        ["Reviewed", "Issued"].includes(r.status) ? (
          <ResponseForm
            key={`${shown.v.id}:${shown.at}`}
            r={{ ...r, version: shown.version }}
            v={shown.v}
            presentedAt={shown.at}
            reload={reload}
          />
        ) : (
          <p>
            Historical presentation retained. A prior response or signature
            cannot be transferred to a successor.
          </p>
        )}
      </main>
    );
  return (
    <main className="business-shell report-screen">
      <Link href="/service/reports">All service reports</Link>
      <h1>{r?.reference ?? "Service report"}</h1>
      <Synthetic />
      <ReadState loading={resource.loading} error={resource.error} retry={reload} retained={!!r} />
      <ErrorNotice error={error ?? c.error} />
      <button className="secondary" onClick={reload}>
        Refresh exact report
      </button>
      {!r ? (
        resource.loading ? <p role="status">Loading report…</p> : null
      ) : (
        <>
          <section className="business-card">
            <h2>
              Revision {r.revision} · {friendly(r.status)}
            </h2>
            <p>
              Visit: <strong>{friendly(r.appointment.status)}</strong> · This
              technician’s attendance:{" "}
              <strong>
                {r.reviews.some((review) => review.decision === "Approved")
                  ? "Accepted"
                  : "Awaiting accepted review"}
              </strong>{" "}
              ·
              Work order: {r.work_order.status} · Finance: {r.finance_state}
            </p>
            <p>
              <Link href={`/my-jobs/${r.appointment.id}`}>
                Technician evidence and correction
              </Link>{" "}
              ·{" "}
              <Link href={`/service/work-orders/${r.work_order.id}`}>
                Remaining work and return proposal
              </Link>
            </p>
            <p>
              A proposed return requires the existing scope and booking checks.
              It is not a confirmed booking.
            </p>
          </section>
          <section className="business-card">
            <h2>Exact submitted completion</h2>
            <p>
              Outcome:{" "}
              <strong>
                {r.revisions[0].snapshot.completion.scope_outcome}
              </strong>{" "}
              · Time: {r.revisions[0].snapshot.completion.time_declaration} ·
              Materials:{" "}
              {r.revisions[0].snapshot.completion.material_declaration}
            </p>
            <p className="preserve-lines">
              {r.revisions[0].snapshot.completion.work_performed}
            </p>
            <p>
              <strong>Exclusions:</strong>{" "}
              {r.revisions[0].snapshot.completion.exclusions}
            </p>
            <p>
              <strong>Remaining work:</strong>{" "}
              {r.revisions[0].snapshot.completion.remaining_work}
            </p>
            {r.revisions[0].snapshot.completion.task_outcomes.map(
              (t: {
                scope_item_id: string;
                outcome: string;
                reason: string;
              }) => (
                <p key={t.scope_item_id}>
                  <strong>{t.outcome}</strong> · {t.reason}
                </p>
              ),
            )}
            {r.revisions[0].snapshot.completion.blockers.map(
              (b: string, i: number) => (
                <p className="note" key={i}>
                  {b}
                </p>
              ),
            )}
          </section>
          {r.status === "Submitted" && r.can_review && (
            <ReviewForm key={r.version} r={r} reload={reload} />
          )}
          {r.reviews.map(
            (v: {
              id: string;
              revision_id: string;
              decision: string;
              remarks: string;
              entry_decisions: {
                id: string;
                decision: string;
                remarks: string;
              }[];
            }) => (
              <section className="business-card" key={v.id}>
                <h2>{v.decision} review</h2>
                <p>{v.remarks}</p>
                {v.entry_decisions
                  .filter((e) => e.decision === "Returned")
                  .map((e) => (
                    <p key={e.id}>
                      <strong>Returned entry:</strong> {e.remarks} ·{" "}
                      <code>{e.id}</code>
                    </p>
                  ))}
              </section>
            ),
          )}
          {r.status === "Reviewed" && r.can_issue && (
            <section className="business-card">
              <h2>Generate and issue controlled report</h2>
              <p>
                Exact reviewed evidence, named site contact and current template
                are checked before and after durable rendering. Rendering alone
                is not issuance.
              </p>
              <button
                disabled={c.busy}
                onClick={async () => {
                  const v = r.revisions[0],
                    review = r.reviews.find(
                      (x: { revision_id: string; decision: string }) =>
                        x.revision_id === v.id && x.decision === "Approved",
                    );
                  if (
                    await c.send(`reports/${id}/issue`, {
                      expected_version: r.version,
                      revision_id: v.id,
                      review_id: review.id,
                      template_id: r.template.id,
                      template_version: r.template.version,
                      reason:
                        "Generate and issue the exact synthetic reviewed report.",
                    })
                  )
                    reload();
                }}
              >
                Request exact report issue
              </button>
            </section>
          )}
          {r.jobs.map(
            (j: {
              id: string;
              state: string;
              error_code: string | null;
              attempts: number;
            }) => (
              <section className="business-card" key={j.id}>
                <h2>Output attempt · {friendly(j.state)}</h2>
                <p>
                  {j.error_code ?? "Original output identity retained"} ·
                  attempts {j.attempts}
                </p>
                {r.can_issue &&
                  !["Issued", "StaleSource"].includes(j.state) && (
                    <button
                      onClick={async () => {
                        try {
                          await api(`report-render-jobs/${j.id}/retry`, {});
                          reload();
                        } catch (e) {
                          setError(e);
                        }
                      }}
                    >
                      Generate / recover original report
                    </button>
                  )}
                {j.state === "StaleSource" && (
                  <p>
                    Open a correction cycle and submit a successor. This owned
                    stale output cannot be issued.
                  </p>
                )}
              </section>
            ),
          )}
          <section className="business-card">
            <h2>Immutable report presentations</h2>
            {r.presentations.length === 0 && (
              <p>No reviewed presentation is available.</p>
            )}
            {r.presentations.map((v: Presentation) => (
              <article key={v.id}>
                <h3>
                  {friendly(v.kind)} ·{" "}
                  {v.revision_id === r.revisions[0].id
                    ? "current revision"
                    : "prior revision retained"}
                </h3>
                <p className="report-hash">{v.content_hash}</p>
                <button onClick={() => void preview(v)}>
                  Present {friendly(v.kind)}
                </button>
                {v.kind === "IssuedReport" && (
                  <a
                    href={`/api/v1/reports/${id}/pdf?presentation_id=${v.id}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Open exact A4 PDF
                  </a>
                )}
              </article>
            ))}
          </section>
          <section className="business-card">
            <h2>Response history</h2>
            {r.responses.length === 0 && (
              <p>No response has been accepted by the server.</p>
            )}
            {r.responses.map(
              (v: {
                id: string;
                response: string;
                respondent_name: string | null;
                remarks: string | null;
                next_action: string | null;
                presented_hash: string;
                received_at: string;
                signature_hash: string | null;
              }) => (
                <article key={v.id}>
                  <h3>
                    {friendly(v.response)} ·{" "}
                    {v.respondent_name ?? "No respondent available"}
                  </h3>
                  <p>{v.remarks}</p>
                  <p>{v.next_action}</p>
                  <p className="report-hash">
                    Bound content: {v.presented_hash}
                  </p>
                  <p>
                    Server received <Stamp value={v.received_at} />
                  </p>
                  {v.signature_hash && (
                    <a
                      href={`/api/v1/customer-responses/${v.id}/signature`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      View protected original synthetic mark
                    </a>
                  )}
                </article>
              ),
            )}
          </section>
          {r.can_amend && ["Reviewed", "Issued"].includes(r.status) && (
            <section className="business-card">
              <h2>Open a report correction cycle</h2>
              <p>
                Accepted attendance and previous reports remain immutable.
                Correct an original entry, save a successor draft and resubmit
                for review. Further physical work needs a separate authorised
                visit.
              </p>
              <Input
                label="Report correction reason"
                value={reason}
                onChange={setReason}
                multiline
              />
              <button
                disabled={c.busy}
                onClick={async () => {
                  if (
                    await c.send(`reports/${id}/amend`, {
                      expected_version: r.version,
                      revision_id: r.revisions[0].id,
                      reason,
                    })
                  )
                    reload();
                }}
              >
                Open successor correction
              </button>
            </section>
          )}
          <section className="business-card">
            <h2>Owned actions</h2>
            {r.follow_ups.map(
              (f: {
                id: string;
                summary: string;
                owner_name: string;
                status: string;
              }) => (
                <p key={f.id}>
                  <Link href={`/work/${f.id}`}>{f.summary}</Link>
                  <br />
                  {f.owner_name} · {f.status}
                </p>
              ),
            )}
          </section>
        </>
      )}
    </main>
  );
}
