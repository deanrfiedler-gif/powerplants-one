"use client";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState, useSyncExternalStore } from "react";
import { api, ReadState, ErrorNotice } from "../components/business-ui";
import { useCrmResource } from "../components/crm-state";
import { useIdentity } from "../components/business-session";
import {
  RecordTabs,
  RecordPanel,
  useUnsavedChanges,
  LocalDateTimeField,
} from "../components/record-ui";
import { Button, ButtonLink } from "../components/ui/button";
import {
  useRecoverableCommand,
  type Receipt,
} from "../shared/ui/use-recoverable-command";
import { acceptsServiceInspectionEntry as accepts } from "./service-journal";
import type { loadServiceInspections, Mode } from "./service-context";
import type { previewServiceInspection } from "./service-commands";
import {
  criterionText,
  inspectionLabel,
  evaluate,
  type Reading,
} from "./model";
import { InspectionWorklist } from "./service-register-screen";
import { RegisterChip } from "../components/ui/register-table";
import { ProductIcon } from "../components/product-icons";
import { WizardDialog } from "../components/estimation-wizard-dialog";
import { RecordIdentity } from "../shell/record-identity";
import { usePhoneHeader } from "../shell/phone-header";
import "../app/service-inspections.css";
const subscribeOnline = (change: () => void) => {
  window.addEventListener("online", change);
  window.addEventListener("offline", change);
  return () => {
    window.removeEventListener("online", change);
    window.removeEventListener("offline", change);
  };
};
const subscribePhone = (change: () => void) => {
  const media = window.matchMedia("(max-width: 780px)");
  media.addEventListener("change", change);
  return () => media.removeEventListener("change", change);
};
const reviewLabel = (value: string) =>
  value === "InReview" ? "Awaiting review" : inspectionLabel(value);
const stamp = (value: Date | string | null | undefined) =>
  value
    ? new Date(value).toLocaleString("en-AU", {
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "Not recorded";
const snapshotText = (
  snapshot: Record<string, unknown>,
  section: string,
  key: string,
) => {
  const part = snapshot[section];
  const value =
    part && typeof part === "object"
      ? (part as Record<string, unknown>)[key]
      : null;
  return typeof value === "string" || typeof value === "number"
    ? String(value)
    : "Not recorded";
};

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
    <div
      id="ppo-service-inspections"
      className="service-inspections"
      data-module-layout="full-bleed"
    >
      {appointment ? (
        <Visit
          key={appointment}
          id={appointment}
          mode={mode}
          initialAttempt={query.get("attempt_id")}
        />
      ) : (
        <InspectionWorklist mode={mode} />
      )}
    </div>
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
  const [tab, setTab] = useState("readings"),
    [reviewing, setReviewing] = useState(false);
  const online = useSyncExternalStore(
    subscribeOnline,
    () => navigator.onLine,
    () => true,
  );
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
    if (body.action === "submit") setTab("readings");
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
    command.busy || !!command.pending || !command.ready || !!r.error || !online;
  function choose(attempt: string) {
    if (attempt === selected || command.pending || command.busy) return;
    if (dirty && !window.confirm("Switch attempt and discard unsaved changes?"))
      return;
    setSelected(attempt);
    setReviewing(false);
    window.history.replaceState(null, "", target + "&attempt_id=" + attempt);
  }
  const v = r.data,
    at =
      v?.attempts.find((a) => a.row.id === selected) ??
      (!selected ? v?.attempts.at(-1) : undefined);
  const capture = mode === "capture",
    title =
      v?.catalogue.find((t) => t.id === at?.binding.template_id)?.title ??
      "Inspections";
  const position = v && at ? v.attempts.indexOf(at) : -1;
  usePhoneHeader(
    v
      ? {
          title: at ? title : "Inspections",
          record: {
            position: at ? title : undefined,
            previous: {
              label: "Previous attempt",
              disabled: position <= 0 || locked,
              onSelect: () => choose(v.attempts[position - 1].row.id),
            },
            next: {
              label: "Next attempt",
              disabled:
                position < 0 || position >= v.attempts.length - 1 || locked,
              onSelect: () => choose(v.attempts[position + 1].row.id),
            },
          },
        }
      : null,
  );
  const editing =
    !!at &&
    capture &&
    at.row.state === "Draft" &&
    at.row.performer_id === v?.actor_id;
  const captureLocked = locked || !!v?.capture_gate;
  const tabs = capture
    ? [
        { id: "readings", label: "Checks" },
        { id: "evidence", label: "Evidence" },
        ...(editing ? [{ id: "findings", label: "Findings" }] : []),
        { id: "source", label: "Source" },
      ]
    : [
        { id: "readings", label: "Readings" },
        { id: "evidence", label: "Evidence" },
        { id: "retests", label: "Defects and retests" },
        { id: "history", label: "Review history" },
        { id: "outcome", label: "Outcome" },
      ];
  return (
    <>
      <ReadState loading={r.loading} error={r.error} retry={r.reload} />
      {v && (
        <>
          <RecordIdentity
            reference={v.appointment.display_number}
            title={title}
          />
          <header className="inspection-record-head">
            <div>
              <h1>
                {title}
                {at &&
                  ` · ${capture && at.row.predecessor_id ? "retest" : "attempt"} ${at.row.attempt_number}`}
              </h1>
              {at && (
                <RegisterChip
                  tone={
                    at.review === "Accepted"
                      ? "positive"
                      : at.review === "InReview"
                        ? "attention"
                        : at.review === "Returned"
                          ? "negative"
                          : "neutral"
                  }
                >
                  {at.row.state === "Draft" ? "Draft" : reviewLabel(at.review)}
                </RegisterChip>
              )}
            </div>
            <div className="inspection-head-actions" hidden={reviewing}>
              <ButtonLink
                href={
                  capture ? `/my-jobs/${id}` : `/service/appointments/${id}`
                }
              >
                Open visit
              </ButtonLink>
              {!capture &&
                at?.row.state === "Submitted" &&
                !["Accepted", "Returned"].includes(at.review) &&
                !reviewing && (
                  <Button
                    variant="primary"
                    disabled={
                      locked ||
                      !v.can_review ||
                      at.row.performer_id === v.actor_id
                    }
                    onClick={() => {
                      setReviewing(true);
                      setTab("readings");
                    }}
                  >
                    Review attempt
                  </Button>
                )}
              {!capture && at?.review === "Accepted" && !v.outputs.some((o) => o.attempt_id === at.row.id) && (
                <Button variant="primary" aria-label="Open outcome issue" disabled={locked || !v.can_issue} onClick={() => setTab("outcome")}>
                  Issue outcome
                </Button>
              )}
              {capture && !editing && (
                <Button
                  onClick={() => setSelected("new")}
                  disabled={captureLocked || dirty}
                >
                  New attempt
                </Button>
              )}
            </div>
            <p>
              {v.appointment.display_number} · {at?.row.plan_source.reference} ·{" "}
              {at?.row.performer_name}
              {at?.row.predecessor_id ? " · Retest" : ""} ·{" "}
              {at?.row.state === "Submitted"
                ? `Submitted ${stamp(at.row.submitted_at)}`
                : `Saved ${stamp(at?.row.updated_at)}`}
            </p>
            {at && (
              <p className="inspection-phone-status">
                Saved {stamp(at.row.updated_at)} ·{" "}
                {
                  at.results.filter(
                    (r) =>
                      r.raw_value !== null ||
                      r.choice !== null ||
                      r.entry_state !== "Recorded",
                  ).length
                }{" "}
                of {at.row.check_keys.length} checks recorded
              </p>
            )}
          </header>
          {at && (
            <div
              className="inspection-readiness"
              aria-label={capture ? "Before you submit" : "Before outcome"}
            >
              <strong>
                {capture ? "Before you submit" : "Before outcome"}
              </strong>
              <span>
                {capture
                  ? v.capture_gate
                    ? "Attendance or readiness required"
                    : "You are recorded as attending"
                  : `Readings · ${at.results.filter((x) => x.evaluation === "Pass").length} of ${at.row.check_keys.length} pass`}
              </span>
              <span>
                {at.instruments.length
                  ? "Instrument evidence retained"
                  : "Instrument not yet named"}
              </span>
              <span>
                Evidence ·{" "}
                {at.evidence.filter((e) => e.state === "Complete").length}
              </span>
              <span>
                {capture
                  ? `Saved ${stamp(at.row.updated_at)}`
                  : `Independent review · ${reviewLabel(at.review)}`}
              </span>
              {!capture && (
                <span>
                  {v.outputs.some((o) => o.attempt_id === at.row.id)
                    ? "Outcome issued"
                    : "Outcome not issued"}
                </span>
              )}
            </div>
          )}
          {capture && !at && v.capture_gate && (
            <div className="inspection-notice inspection-warning" role="status">
              <div>
                <strong>Can't record yet</strong>
                <p>{v.capture_gate}</p>
                <Link href={`/my-jobs/${id}`}>
                  Open My jobs and record attendance
                </Link>
              </div>
            </div>
          )}
          {!command.pending && <ErrorNotice error={command.error} />}
          {command.saved && (
            <p className="inspection-command-saved" role="status">
              {command.saved}
            </p>
          )}
          {command.pending && (
            <div className="inspection-notice inspection-warning inspection-recovery" role="status">
              <strong>Submission not confirmed</strong>
              <p>
                The original command is retained in this tab. Recover it before
                doing anything else. Do not submit another attempt.
              </p>
              <div className="button-row">
                <Button
                  disabled={command.busy || !online}
                  onClick={async () => {
                    const body = command.pending!.body,
                      receipt = await command.recover();
                    if (receipt) received(receipt, body);
                    else r.reload();
                  }}
                >
                  Recover the original
                </Button>
                <Button
                  disabled={command.busy || !online}
                  onClick={async () => {
                    const body = command.pending!.body,
                      receipt = await command.retry();
                    if (receipt) received(receipt, body);
                  }}
                >
                  Retry unchanged original
                </Button>
              </div>
            </div>
          )}
          <div
            className={`inspection-record-layout ${capture ? "inspection-capture" : ""} ${editing ? "inspection-editing" : ""}`}
          >
            <aside className="inspection-record-summary">
              <section>
                <h2>{capture ? "Your visit" : "Summary"}</h2>
                <dl>
                  <dt>State</dt>
                  <dd>
                    {at
                      ? at.row.state === "Draft"
                        ? "Draft"
                        : reviewLabel(at.review)
                      : "Not started"}
                  </dd>
                  {!capture && (
                    <>
                      <dt>Result</dt>
                      <dd>
                        {at?.results.filter((r) => r.evaluation === "Pass")
                          .length ?? 0}{" "}
                        of {at?.row.check_keys.length ?? 0} pass
                      </dd>
                      <dt>Reviewer</dt>
                      <dd>{identity.display_name} (you)</dd>
                    </>
                  )}
                  <dt>Performer</dt>
                  <dd>{at?.row.performer_name ?? "You"}</dd>
                  <dt>Tested</dt>
                  <dd>{stamp(at?.row.occurred_at)}</dd>
                  <dt>Submitted</dt>
                  <dd>{stamp(at?.row.submitted_at)}</dd>
                  <dt>Procedure</dt>
                  <dd>
                    {at?.row.plan_source.reference ?? "Choose a procedure"}
                  </dd>
                  <dt>Time zone</dt>
                  <dd>{v.appointment.site_timezone}</dd>
                </dl>
              </section>
              {at && (
                <section>
                  <h2>Equipment and scope</h2>
                  <p>
                    {snapshotText(
                      at.binding.snapshot,
                      "asset",
                      "display_number",
                    )}
                  </p>
                  <p>
                    {snapshotText(at.binding.snapshot, "asset", "description")}
                  </p>
                  <small>
                    Equipment, configuration and scope were bound when this
                    attempt was opened.
                  </small>
                </section>
              )}
              <section>
                <h2>Visit and issued pack</h2>
                <Link href={`/my-jobs/${id}`}>
                  {v.appointment.display_number}
                </Link>
                <p>
                  {stamp(v.appointment.start_at)} ·{" "}
                  {v.work_order.display_number}
                </p>
                <Link href={`/my-jobs/site-readiness?appointment_id=${id}`}>
                  Preparation and readiness
                </Link>
              </section>
              <section>
                <h2>Attempts</h2>
                {v.attempts.map((a) => (
                  <button
                    className="inspection-attempt-link"
                    type="button"
                    key={a.row.id}
                    disabled={locked}
                    aria-current={at?.row.id === a.row.id ? "page" : undefined}
                    onClick={() => choose(a.row.id)}
                  >
                    Attempt {a.row.attempt_number} · {a.row.performer_name}
                    <small>
                      {reviewLabel(a.review)}
                      {a.row.predecessor_id ? " · Retest" : ""}
                    </small>
                  </button>
                ))}
              </section>
            </aside>
            <div className="inspection-record-main">
              {at ? (
                <>
                  {!capture && (
                    <div className="inspection-review-actions">
                      <ButtonLink href={`/service/appointments/${id}`}>
                        Open visit
                      </ButtonLink>
                      <Button
                        variant="primary"
                        disabled={
                          locked ||
                          !v.can_review ||
                          at.row.state !== "Submitted" ||
                          ["Accepted", "Returned"].includes(at.review) ||
                          at.row.performer_id === v.actor_id
                        }
                        onClick={() => {
                          setTab("readings");
                          setReviewing(true);
                        }}
                      >
                        Review attempt
                      </Button>
                    </div>
                  )}
                  <RecordTabs
                    id="inspection-record"
                    label="Inspection record"
                    tabs={tabs}
                    value={tab}
                    onChange={setTab}
                  />
                  <div className="inspection-record-content">
                    {capture && (
                      <div
                        className={`inspection-notice ${!online || v.capture_gate ? "inspection-warning" : ""}`}
                        role="status"
                      >
                        <ProductIcon name="info" />
                        <div>
                          <strong>
                            {!online
                              ? `Not connected · last saved ${stamp(at.row.updated_at)}`
                              : v.capture_gate
                                ? "Can't record yet"
                                : "Inspections save online only"}
                          </strong>
                          <p>
                            {v.capture_gate ??
                              `Last saved ${stamp(at.row.updated_at)}. Anything entered after that stays on this screen until you save.`}
                          </p>
                          {v.capture_gate && (
                            <Link href={`/my-jobs/${id}`}>
                              Open My jobs and record attendance
                            </Link>
                          )}
                        </div>
                      </div>
                    )}
                    {editing && (
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
                        locked={captureLocked}
                        onDirty={setDirty}
                        path={path}
                        tab={tab}
                      />
                    )}
                    {!editing && (
                      <RecordPanel
                        id="inspection-record"
                        tab="readings"
                        value={tab}
                      >
                        {!editing && (
                          <>
                            {!capture && (
                              <section className="inspection-review-notice">
                                <strong>
                                  {at.review === "Accepted"
                                    ? "Accepted for internal outcome"
                                    : at.review === "Returned"
                                      ? "Returned · original attempt retained"
                                      : "Submitted for independent review"}
                                </strong>
                                <p>
                                  Accept, return, ask for clarification or put
                                  the attempt on hold. The technician's original
                                  readings are retained. Accepting issues
                                  nothing: the outcome is a separate step.
                                </p>
                                {at.review === "Returned" &&
                                  at.reviews.at(-1) && (
                                    <p>
                                      <strong>
                                        {at.reviews.at(-1)!.reason}
                                      </strong>
                                      <br />
                                      Returned by{" "}
                                      {
                                        at.reviews.at(-1)!.decided_by_name
                                      } · {stamp(at.reviews.at(-1)!.decided_at)}
                                    </p>
                                  )}
                                {at.row.predecessor_id && (
                                  <p>
                                    Retest of attempt{" "}
                                    {
                                      v.attempts.find(
                                        (x) =>
                                          x.row.id === at.row.predecessor_id,
                                      )?.row.attempt_number
                                    }
                                    . The original failure and correction remain
                                    in{" "}
                                    <button
                                      type="button"
                                      className="inspection-text-button"
                                      onClick={() => setTab("retests")}
                                    >
                                      Defects and retests
                                    </button>
                                    .
                                  </p>
                                )}
                                {at.row.predecessor_id &&
                                  v.defects
                                    .filter(
                                      (d) =>
                                        v.links.some(
                                          (l) =>
                                            l.attempt_id === at.row.id &&
                                            l.defect_id === d.id,
                                        ) && d.correction_note,
                                    )
                                    .map((d) => (
                                      <p key={d.id}>
                                        Correction recorded: {d.correction_note}{" "}
                                        {d.activity_id && (
                                          <Link href={`/work/${d.activity_id}`}>
                                            Open activity
                                          </Link>
                                        )}
                                      </p>
                                    ))}
                              </section>
                            )}
                            <Results attempt={at} path={path} failedFirst={reviewing} />
                            {capture && (
                              <>
                                {v.defects
                                  .filter(
                                    (d) =>
                                      d.source_attempt_id === at.row.id ||
                                      v.links.some(
                                        (l) =>
                                          l.attempt_id === at.row.id &&
                                          l.defect_id === d.id,
                                      ),
                                  )
                                  .map((d) => (
                                    <Defect
                                      key={d.id + ":" + epoch}
                                      defect={d}
                                      view={v}
                                      send={send}
                                      locked={captureLocked}
                                    />
                                  ))}
                                <Button
                                  disabled={captureLocked}
                                  onClick={() => choose("new")}
                                >
                                  New attempt or retest
                                </Button>
                              </>
                            )}
                          </>
                        )}
                        {capture &&
                          at.review === "ClarificationRequired" &&
                          at.row.performer_id === v.actor_id && (
                            <Review
                              attempt={at}
                              view={v}
                              send={send}
                              mode="capture"
                              locked={captureLocked}
                            />
                          )}
                        {reviewing && (
                          <section className="inspection-review-form">
                            <Review
                              key={at.row.id + ":" + epoch}
                              attempt={at}
                              view={v}
                              send={async (f, n) => {
                                const ok = await send(f, n);
                                if (ok) setReviewing(false);
                                return ok;
                              }}
                              mode={mode}
                              locked={locked || !v.can_review}
                            />
                            <Button
                              onClick={() => setReviewing(false)}
                              disabled={command.busy}
                            >
                              Cancel
                            </Button>
                          </section>
                        )}
                      </RecordPanel>
                    )}
                    {!editing && (
                      <RecordPanel
                        id="inspection-record"
                        tab="evidence"
                        value={tab}
                      >
                        <Evidence
                          attempt={at}
                          path={path}
                          send={send}
                          editable={editing}
                          locked={captureLocked || dirty}
                        />
                      </RecordPanel>
                    )}
                    {capture ? (
                      !editing && (
                        <RecordPanel
                          id="inspection-record"
                          tab="source"
                          value={tab}
                        >
                          <details>
                            <summary>
                              Exact equipment, work scope, template and
                              preparation
                            </summary>
                            <pre>
                              {JSON.stringify(at.binding.snapshot, null, 2)}
                            </pre>
                          </details>
                        </RecordPanel>
                      )
                    ) : (
                      <>
                        <RecordPanel
                          id="inspection-record"
                          tab="retests"
                          value={tab}
                        >
                          <h2>Defect, correction and fresh retest</h2>
                          <ol className="inspection-timeline">
                            {v.attempts
                              .filter(
                                (a) =>
                                  a.binding.asset_id === at.binding.asset_id &&
                                  a.binding.scope_item_id ===
                                    at.binding.scope_item_id,
                              )
                              .map((a) => (
                                <li key={a.row.id}>
                                  <button
                                    type="button"
                                    className="inspection-text-button"
                                    onClick={() => choose(a.row.id)}
                                  >
                                    Attempt {a.row.attempt_number} ·{" "}
                                    {a.results.some(
                                      (x) => x.evaluation === "Fail",
                                    )
                                      ? "Failed check"
                                      : reviewLabel(a.review)}
                                  </button>
                                  <p>
                                    {a.row.performer_name} ·{" "}
                                    {stamp(a.row.occurred_at)}
                                  </p>
                                  <p>
                                    {a.results.some((r) => r.evaluation === "Fail")
                                      ? a.results.filter((r) => r.evaluation === "Fail").map((r) => `${r.raw_value ?? r.choice ?? "Not recorded"} ${r.unit ?? ""}`).join(" · ")
                                      : `${a.results.filter((r) => r.evaluation === "Pass").length} of ${a.row.check_keys.length} checks pass`}
                                  </p>
                                  {a.reviews.map((review) => (
                                    <p key={review.id}>
                                      {inspectionLabel(review.decision)} ·{" "}
                                      {review.decided_by_name} · {stamp(review.decided_at)}
                                      <br />{review.reason}
                                    </p>
                                  ))}
                                  {v.defects
                                    .filter(
                                      (d) => d.source_attempt_id === a.row.id,
                                    )
                                    .map((d) => (
                                      <Defect
                                        key={d.id + ":" + epoch}
                                        defect={d}
                                        view={v}
                                        send={send}
                                        locked={locked}
                                      />
                                    ))}
                                  {a.row.id === at.row.id && (
                                    <div className="inspection-lineage-outcome">
                                      <p><strong>Independent review</strong><br />{reviewLabel(a.review)}</p>
                                      <button type="button" className="inspection-text-button" onClick={() => setTab("outcome")}>
                                        {v.outputs.some((o) => o.attempt_id === a.row.id) ? "Outcome issued" : "Outcome not issued"}
                                      </button>
                                      <p>Internal only · after acceptance</p>
                                    </div>
                                  )}
                                </li>
                              ))}
                          </ol>
                        </RecordPanel>
                        <RecordPanel
                          id="inspection-record"
                          tab="history"
                          value={tab}
                        >
                          <h2>Review history</h2>
                          {at.reviews.length ? (
                            at.reviews.map((review) => (
                              <p key={review.id}>
                                {inspectionLabel(review.decision)} ·{" "}
                                {review.decided_by_name} ·{" "}
                                {stamp(review.decided_at)} · {review.reason}
                              </p>
                            ))
                          ) : (
                            <p>No review recorded.</p>
                          )}
                        </RecordPanel>
                        <RecordPanel
                          id="inspection-record"
                          tab="outcome"
                          value={tab}
                        >
                          <h2>Internal inspection outcome</h2>
                          <p>
                            An outcome completes no visit, work order, Project,
                            customer acceptance or Finance process. Issuing
                            sends nothing to a customer.
                          </p>
                          {!!v.incident_holds.length && (
                            <p className="inspection-warning">
                              Incident scope restrictions are active. Earlier
                              issued bytes remain historical evidence.
                            </p>
                          )}
                          {at.review === "Accepted" && (
                            <Outcome
                              key={at.row.id}
                              attempt={at}
                              view={v}
                              send={send}
                              path={path}
                              locked={locked || !v.can_issue}
                            />
                          )}
                          {v.outputs
                            .filter((o) => o.attempt_id === at.row.id)
                            .map((o) => (
                              <section className="inspection-output" key={o.id}>
                                <strong>Issued internal outcome</strong>
                                <p>
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
                                <small>SHA-256 · {o.manifest_hash}</small>
                              </section>
                            ))}
                          {!v.outputs.some(
                            (o) => o.attempt_id === at.row.id,
                          ) && <p>No inspection outcome issued.</p>}
                        </RecordPanel>
                      </>
                    )}
                  </div>
                </>
              ) : capture ? (
                <OpenAttempt
                  view={v}
                  send={send}
                  locked={captureLocked || dirty}
                  onOpened={choose}
                />
              ) : (
                <p className="inspection-notice">Choose a retained attempt.</p>
              )}
            </div>
          </div>
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
  path,
  tab,
}: {
  path: string;
  tab: string;
  attempt: Attempt;
  view: View;
  send: Send;
  locked: boolean;
  onDirty: (dirty: boolean) => void;
}) {
  const phone = useSyncExternalStore(
    subscribePhone,
    () => window.matchMedia("(max-width: 780px)").matches,
    () => false,
  );
  const read = () =>
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
    }) as Reading[];
  const links = () =>
    Object.fromEntries(
      a.reading_instruments.map((x) => [x.check_key, x.instrument_id]),
    );
  const [version, setVersion] = useState(a.row.version),
    [dirty, setDirty] = useState(false),
    [readings, setReadings] = useState<Reading[]>(read),
    [instruments, setInstruments] = useState<Record<string, string>>(links),
    [occurred, setOccurred] = useState(
      a.row.occurred_at ? new Date(a.row.occurred_at).toISOString() : "",
    ),
    [findings, setFindings] = useState(a.row.findings ?? ""),
    [confirm, setConfirm] = useState(false);
  const [expanded, setExpanded] = useState<string[]>([]);
  if (!dirty && version !== a.row.version) {
    setVersion(a.row.version);
    setReadings(read());
    setInstruments(links());
    setFindings(a.row.findings ?? "");
    setOccurred(
      a.row.occurred_at ? new Date(a.row.occurred_at).toISOString() : "",
    );
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
  const evaluation = a.row.plan.map((d, i) => evaluate(d, readings[i]));
  const failed = evaluation.filter((e) => e.evaluation === "Fail").length;
  return (
    <form
      className="inspection-draft"
      onSubmit={async (e) => {
        e.preventDefault();
        if (locked || version !== a.row.version) return;
        if (
          await send(
            {
              action: "save",
              attempt_id: a.row.id,
              expected_version: version,
              occurred_at: occurred || null,
              readings: readings.map(({ evidence_ids, ...r }) => {
                void evidence_ids;
                return r;
              }),
              instrument_ids: [
                ...new Set(Object.values(instruments).filter(Boolean)),
              ],
              reading_instruments: Object.entries(instruments)
                .filter(([, instrument_id]) => instrument_id)
                .map(([check_key, instrument_id]) => ({
                  check_key,
                  instrument_id,
                })),
              findings: findings || null,
            },
            "Save inspection draft",
          )
        )
          setDirty(false);
      }}
    >
      <p className="inspection-draft-status" role="status">
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
      <RecordPanel
        id="inspection-record"
        tab="readings"
        value={phone ? "readings" : tab}
      >
        <div className="inspection-before-test">
          <h2>Before you test</h2>
          <p>
            <strong>
              {snapshotText(a.binding.snapshot, "asset", "display_number")}
            </strong>
            <br />
            Equipment and configuration bound when this attempt opened
          </p>
          <p>
            {a.row.plan_source.reference} · {a.row.check_keys.length} checks
          </p>
          <p>
            {v.capture_gate ??
              "Your attendance, issued pack and readiness currently permit capture."}
          </p>
        </div>
        <section className="inspection-checks">
          <h2>
            Checks ·{" "}
            {
              a.results.filter(
                (r) =>
                  r.raw_value !== null ||
                  r.choice !== null ||
                  r.entry_state !== "Recorded",
              ).length
            }{" "}
            of {a.row.check_keys.length} recorded
          </h2>
          <details className="inspection-test-time" open={!occurred}>
            <summary>Test time · {stamp(occurred)}</summary>
            <fieldset disabled={locked}>
              <legend>Test time</legend>
              <LocalDateTimeField
                name="inspection-occurred-at"
                label="Test time"
                timezone={v.appointment.site_timezone}
                value={occurred}
                onChange={(value) => {
                  setOccurred(value);
                  setDirty(true);
                }}
              />
              <Button
                onClick={() => {
                  setOccurred(new Date().toISOString());
                  setDirty(true);
                }}
              >
                Record current test time
              </Button>
            </fieldset>
          </details>
          {a.row.plan.map((d, i) => {
            const selected = v.instruments.find(
                (x) => x.id === instruments[d.key],
              ),
              result = evaluation[i];
            const saved = a.results.find((r) => r.check_key === d.key);
            if (
              saved &&
              (saved.raw_value !== null ||
                saved.choice !== null ||
                saved.entry_state !== "Recorded") &&
              !expanded.includes(d.key)
            )
              return (
                <button
                  type="button"
                  key={d.key}
                  className="inspection-saved-check"
                  disabled={locked}
                  onClick={() => setExpanded((old) => [...old, d.key])}
                >
                  <ProductIcon
                    name={
                      (saved.evaluation ?? result.evaluation) === "Pass"
                        ? "check"
                        : "info"
                    }
                  />
                  <span>
                    <strong>{d.name}</strong>
                    <small>
                      {saved.choice ??
                        `${saved.raw_value ?? ""} ${saved.unit ?? ""}`}{" "}
                      · {inspectionLabel(saved.evaluation ?? result.evaluation)}{" "}
                      ·{" "}
                      {selected?.reference ?? saved.reason ?? criterionText(d)}
                    </small>
                  </span>
                  <span className="inspection-sr">Edit saved check</span>
                </button>
              );
            return (
              <fieldset
                className="inspection-check"
                key={d.key}
                disabled={locked}
              >
                <legend>{d.name}</legend>
                <p>
                  {criterionText(d)} · {d.required ? "Required" : "Optional"}
                  {d.instrument_required
                    ? " · calibrated instrument required"
                    : ""}
                </p>
                {d.check_type === "Numeric" ? (
                  <div className="inspection-value-unit">
                    <label>
                      Value{" "}
                      <span className="inspection-sr">{d.name} reading</span>
                      <input
                        aria-label={d.name + " reading"}
                        inputMode="decimal"
                        value={readings[i].value ?? ""}
                        onChange={(e) =>
                          change(i, { value: e.target.value || null })
                        }
                      />
                    </label>
                    <label>
                      Unit
                      <select
                        aria-label={d.name + " unit"}
                        value={readings[i].unit ?? ""}
                        onChange={(e) => change(i, { unit: e.target.value })}
                      >
                        {(d.numeric
                          ? [
                              d.numeric.unit,
                              ...d.numeric.conversions.map((c) => c.from_unit),
                            ]
                          : [readings[i].unit ?? ""]
                        ).map((unit) => (
                          <option key={unit}>{unit}</option>
                        ))}
                      </select>
                    </label>
                  </div>
                ) : (
                  <div
                    className="inspection-choices"
                    role="radiogroup"
                    aria-label={d.name + " outcome"}
                  >
                    {d.qualitative?.choices.map((choice) => (
                      <label key={choice}>
                        <input
                          type="radio"
                          name={d.key + "-choice"}
                          checked={
                            readings[i].state === "Recorded" &&
                            readings[i].choice === choice
                          }
                          onChange={() =>
                            change(i, { choice, state: "Recorded" })
                          }
                        />
                        <span>{choice}</span>
                      </label>
                    ))}
                    <label>
                      <input
                        type="radio"
                        name={d.key + "-choice"}
                        checked={readings[i].state === "NotTested"}
                        onChange={() =>
                          change(i, { state: "NotTested", choice: null })
                        }
                      />
                      <span>Not tested</span>
                    </label>
                  </div>
                )}
                {d.instrument_required && (
                  <label>
                    <span>
                      Instrument <small>Required</small>
                    </span>
                    <select
                      aria-label={d.name + " instrument"}
                      value={instruments[d.key] ?? ""}
                      onChange={(e) => {
                        setInstruments({
                          ...instruments,
                          [d.key]: e.target.value,
                        });
                        setDirty(true);
                      }}
                    >
                      <option value="">Choose the instrument used</option>
                      {v.instruments.map((ins) => (
                        <option key={ins.id} value={ins.id}>
                          {ins.reference} · calibrated to {ins.valid_to}
                        </option>
                      ))}
                    </select>
                    {selected && (
                      <small>
                        <span className="inspection-instrument-selection">{selected.reference} · calibrated to {selected.valid_to}<br /></span>
                        {selected.measurement_type} ·{" "}
                        {selected.measurement_range} ·{" "}
                        {selected.measurement_unit} · certificate{" "}
                        {selected.certificate_reference ?? "unverified"} /{" "}
                        {selected.certificate_revision ?? "unverified"}
                      </small>
                    )}
                  </label>
                )}
                {(readings[i].value || readings[i].choice) && (
                  <p
                    className="inspection-evaluation"
                    data-result={result.evaluation}
                    role="status"
                  >
                    <ProductIcon
                      name={result.evaluation === "Pass" ? "check" : "info"}
                    />
                    {inspectionLabel(result.evaluation)}:{" "}
                    {result.reason ?? criterionText(d)}
                    {dirty ? " · not saved yet" : ""}
                  </p>
                )}
                <details className="inspection-observation">
                  <summary>Reason, observation or not tested</summary>
                  <label>
                    Entry state
                    <select
                      value={readings[i].state}
                      onChange={(e) =>
                        change(i, { state: e.target.value as Reading["state"] })
                      }
                    >
                      <option value="Recorded">Recorded</option>
                      <option value="NotTested">Not tested</option>
                      {d.condition?.outcome === "False" && (
                        <option value="NotApplicable">Not applicable</option>
                      )}
                    </select>
                  </label>
                  <label>
                    Reason / observation
                    <input
                      value={readings[i].reason ?? ""}
                      onChange={(e) =>
                        change(i, { reason: e.target.value || null })
                      }
                    />
                  </label>
                </details>
              </fieldset>
            );
          })}
        </section>
      </RecordPanel>
      <RecordPanel
        id="inspection-record"
        tab="evidence"
        value={phone ? "evidence" : tab}
      >
        <Evidence
          attempt={a}
          path={path}
          send={send}
          editable
          locked={locked || dirty}
        />
      </RecordPanel>
      <RecordPanel
        id="inspection-record"
        tab="findings"
        value={phone ? "findings" : tab}
      >
        <section className="inspection-findings">
          <h2>Findings</h2>
          <label htmlFor="inspection-findings">What you found</label>
          <textarea
            id="inspection-findings"
            disabled={locked}
            value={findings}
            maxLength={2000}
            onChange={(e) => {
              setFindings(e.target.value);
              setDirty(true);
            }}
          />
        </section>
      </RecordPanel>
      <RecordPanel
        id="inspection-record"
        tab="source"
        value={phone ? "readings" : tab}
      >
        <details>
          <summary>
            Exact equipment, work scope, template and preparation
          </summary>
          <pre>{JSON.stringify(a.binding.snapshot, null, 2)}</pre>
        </details>
      </RecordPanel>
      <div className="inspection-capture-actions">
        <Button type="submit" disabled={locked || version !== a.row.version}>
          Save draft
        </Button>
        <Button
          variant="primary"
          disabled={locked || dirty || version !== a.row.version}
          onClick={() => setConfirm(true)}
        >
          Submit inspection
        </Button>
      </div>
      {confirm && (
        <WizardDialog
          className="inspection-submit-dialog"
          title={`Submit attempt ${a.row.attempt_number}?`}
          subtitle={a.row.plan_source.reference}
          close={() => setConfirm(false)}
          dismissible={!locked}
          footer={
            <>
              <Button disabled={locked} onClick={() => setConfirm(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                disabled={locked || dirty}
                onClick={async () => {
                  await send(
                    {
                      action: "submit",
                      attempt_id: a.row.id,
                      expected_version: a.row.version,
                      owner_id: v.actor_id,
                    },
                    "Submit exact inspection",
                  );
                  setConfirm(false);
                }}
              >
                Submit attempt
              </Button>
            </>
          }
        >
          <p>
            {a.row.check_keys.length} checks ·{" "}
            {evaluation.filter((e) => e.evaluation === "Pass").length} pass ·{" "}
            {failed} fail
          </p>
          <p className="inspection-submit-passes">
            Pass: {a.row.plan.filter((_, i) => evaluation[i].evaluation === "Pass").map((d) => d.name).join(" · ") || "None"}
          </p>
          {a.row.plan
            .filter((_, i) => evaluation[i].evaluation !== "Pass")
            .map((d) => {
              const reading = readings.find((r) => r.check_key === d.key)!;
              return (
                <div className="inspection-summary" key={d.key}>
                  <strong>{d.name}</strong>
                  <p>
                    {reading.value} {reading.unit} · {criterionText(d)}
                  </p>
                  {d.instrument_required && <p>Instrument: {a.instruments.find((instrument) => a.reading_instruments.some((link) => link.check_key === d.key && link.instrument_id === instrument.instrument_id))?.snapshot.reference ?? "Not recorded"}</p>}
                </div>
              );
            })}
          {failed > 0 && (
            <p className="inspection-warning">
              A failed required check creates or links an owned defect and
              corrective activity. A fresh retest will be needed.
            </p>
          )}
          <p>
            Submitting freezes these readings and evidence for independent
            review. The server checks the exact procedure, instrument evidence
            and current readiness before accepting the attempt.
          </p>
        </WizardDialog>
      )}
    </form>
  );
}

function Results({ attempt: a, failedFirst = false }: { attempt: Attempt; path: string; failedFirst?: boolean }) {
  const plan = failedFirst ? [...a.row.plan].sort((x, y) => Number(a.results.some((r) => r.check_key === y.key && r.evaluation === "Fail")) - Number(a.results.some((r) => r.check_key === x.key && r.evaluation === "Fail"))) : a.row.plan;
  return (
    <>
      <h3>Submitted readings</h3>
      <div className="inspection-readings-list">
        {plan.map((d) => {
          const r = a.results.find((x) => x.check_key === d.key);
          const used = a.reading_instruments
            .filter((l) => l.check_key === d.key)
            .map((l) =>
              a.instruments.find((i) => i.instrument_id === l.instrument_id),
            )
            .filter((i) => !!i);
          return (
            <section key={d.key} className="inspection-reading-row">
              <ProductIcon name={r?.evaluation === "Pass" ? "check" : "info"} />
              <div>
                <strong>
                  {d.name}
                  {r?.choice || r?.raw_value
                    ? ` · ${r.choice ?? `${r.raw_value} ${r.unit ?? ""}`}`
                    : ""}{" "}
                  · {inspectionLabel(r?.evaluation ?? "NotTested")}
                </strong>
                <p>
                  {criterionText(d)}
                  {r?.reason ? ` · ${r.reason}` : ""}
                </p>
                {r?.evaluation_reason && <p>{r.evaluation_reason}</p>}
                {used.map((i) => (
                  <p key={i.instrument_id}>
                    {i.snapshot.reference} · calibrated to {i.snapshot.valid_to}{" "}
                    · {inspectionLabel(i.assessment)}
                  </p>
                ))}
                {d.instrument_required && !used.length && (
                  <p>
                    Instrument attribution was not recorded for this reading.
                  </p>
                )}
              </div>
            </section>
          );
        })}
        <section className="inspection-reading-row">
          <ProductIcon name="info" />
          <div>
            <strong>Findings</strong>
            <p>{a.row.findings ?? "No findings recorded."}</p>
          </div>
        </section>
      </div>
      <details className="inspection-retained-sources">
        <summary>Retained test-time sources and hashes</summary>
        <p>
          Performed {stamp(a.row.occurred_at)} · received{" "}
          {stamp(a.row.submitted_at)} · exact hash {a.row.submitted_hash}
        </p>
        {a.instruments.map((i) => (
          <p key={i.instrument_id}>
            {i.snapshot.reference} · retained {i.snapshot.calibration_reference}{" "}
            / {i.snapshot.calibration_version} · {i.snapshot.valid_from}–
            {i.snapshot.valid_to} · {inspectionLabel(i.assessment)} · {i.reason}{" "}
            · {i.snapshot.measurement_type ?? "Measurement type unavailable"} ·{" "}
            {i.snapshot.measurement_range ?? "Range unavailable"} ·{" "}
            {i.snapshot.measurement_unit ?? "Unit unavailable"} · certificate{" "}
            {i.snapshot.certificate_reference ?? "unavailable"} /{" "}
            {i.snapshot.certificate_revision ?? "unverified"}
          </p>
        ))}
      </details>
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
    [error, setError] = useState<unknown>(null),
    [adding, setAdding] = useState(false);
  return (
    <section className="inspection-evidence">
      <header>
        <h2>Evidence · {a.evidence.length}</h2>
        {editable && (
          <Button disabled={locked} onClick={() => setAdding(!adding)}>
            {adding ? "Cancel add" : "Add evidence"}
          </Button>
        )}
      </header>
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
          {!editable && (
            <details>
              <summary>Exact evidence hash</summary>
              <small>{e.content_hash}</small>
            </details>
          )}
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
      {editable && adding && (
        <fieldset disabled={locked}>
          <legend>Add evidence</legend>
          <p>
            Add a PNG up to 4 MiB or plain text up to 64 KiB. Choose the check
            this evidence supports.
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
    </section>
  );
}
function Review({
  attempt: a,
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
        <label>
          Decision reason
          <textarea
            required
            maxLength={2000}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </label>
        <p><small>{reason.length} / 2000 characters</small></p>
        {mode === "review" && (
          <label>
            Decision
            <select
              value={decision}
              onChange={(e) => setDecision(e.target.value)}
            >
              {["Accepted", "Returned", "ClarificationRequired", "OnHold"].map(
                (d) => (
                  <option key={d} value={d}>
                    {inspectionLabel(d)}
                  </option>
                ),
              )}
            </select>
          </label>
        )}
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
      </fieldset>
    </form>
  );
}
function Outcome({
  attempt: a,
  view: v,
  path,
  send,
  locked,
}: {
  attempt: Attempt;
  view: View;
  path: string;
  send: Send;
  locked: boolean;
}) {
  const prepared = v.preparations
    .filter(
      (o) => o.attempt_id === a.row.id && o.review_id === a.reviews.at(-1)?.id,
    )
    .at(-1);
  const [reason, setReason] = useState(prepared?.decision_reason ?? ""),
    [confirm, setConfirm] = useState(false);
  const issued = v.outputs.some((o) => o.attempt_id === a.row.id);
  if (issued) return null;
  return (
    <section className="inspection-output">
      <h2>
        {prepared ? "Outcome ready to issue" : "Prepare the exact outcome"}
      </h2>
      <p>
        The original failure, owned correction and linked retest remain in the
        outcome. Preparation creates retained HTML and PDF for you to inspect.
      </p>
      <label>
        Outcome reason
        <textarea
          value={reason}
          maxLength={2000}
          disabled={locked}
          onChange={(e) => setReason(e.target.value)}
        />
      </label>
      {prepared && (
        <div className="inspection-prepared">
          <strong>Prepared · Internal audience</strong>
          <p>
            <a
              href={`/api/v1/${path}/files?output_id=${prepared.id}`}
              target="_blank"
              rel="noreferrer"
            >
              Open exact HTML
            </a>{" "}
            ·{" "}
            <a
              href={`/api/v1/${path}/files?output_id=${prepared.id}&format=pdf`}
              target="_blank"
              rel="noreferrer"
            >
              Open exact PDF
            </a>
          </p>
          <dl>
            <dt>HTML SHA-256</dt>
            <dd>{prepared.bundle.html_sha256}</dd>
            <dt>PDF SHA-256</dt>
            <dd>{prepared.bundle.pdf_sha256}</dd>
          </dl>
        </div>
      )}
      <div className="button-row">
        <Button
          disabled={locked || !reason.trim() || a.applicability !== "Current"}
          onClick={() =>
            void send(
              {
                action: "prepare",
                id: crypto.randomUUID(),
                attempt_id: a.row.id,
                decision_reason: reason,
              },
              "Prepare inspection outcome",
            )
          }
        >
          Prepare HTML and PDF
        </Button>
        <Button
          variant="primary"
          disabled={
            locked ||
            !prepared ||
            prepared.decision_reason !== reason.trim() ||
            a.applicability !== "Current"
          }
          onClick={() => setConfirm(true)}
        >
          Issue outcome
        </Button>
      </div>
      {confirm && prepared && (
        <WizardDialog
          className="inspection-submit-dialog"
          title="Issue this internal outcome?"
          close={() => setConfirm(false)}
          dismissible={!locked}
          footer={
            <>
              <Button disabled={locked} onClick={() => setConfirm(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                disabled={locked}
                onClick={async () => {
                  await send(
                    {
                      action: "release",
                      id: prepared.id,
                      attempt_id: a.row.id,
                      decision_reason: prepared.decision_reason,
                    },
                    "Issue scoped inspection outcome",
                  );
                  setConfirm(false);
                }}
              >
                Issue outcome
              </Button>
            </>
          }
        >
          <p>
            The exact prepared HTML and PDF will be retained as the issued
            outcome. No customer message is sent. This does not complete the
            visit, work order, Project or Finance process.
          </p>
          <p>
            The server rechecks current scope, independent acceptance and open
            blockers before issuing.
          </p>
        </WizardDialog>
      )}
    </section>
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
    <article className="inspection-defect">
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
              maxLength={2000}
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
