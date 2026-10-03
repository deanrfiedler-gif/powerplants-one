"use client";
import { useState } from "react";
import {
  api,
  ErrorNotice,
  Field,
  PageHeader,
  SelectField,
  Status,
  ValidationFields,
} from "./business-ui";
import { useIdentity } from "./business-session";
import { useCrmResource, denied } from "./crm-state";
import { useUnsavedChanges } from "./record-ui";
import { Button, ButtonLink } from "./ui/button";
import { useRecoverableCommand } from "../shared/ui/use-recoverable-command";
import type { JournalEntry } from "../shared/lib/command-journal";
import type { readResponse } from "../estimating/response/reads";
import { responseOutcomes } from "../estimating/response/model";
import "./quotation-release.css";
type Detail = Awaited<ReturnType<typeof readResponse>>;
const accepts = (e: JournalEntry) =>
  /^estimating\/quotes\/[a-f0-9-]{36}\/response\/(record|clarification|prepare)$/.test(
    e.path,
  ) && /^\/estimating\/quotes\/[a-f0-9-]{36}\/response$/.test(e.target);
const capture = (d: Detail) => ({
  sequence: d.sequence,
  issue: d.issue.id,
  hash: d.issue.output_hash,
  current: d.current,
  response: d.state.response?.id ?? null,
});
export function QuotationResponse({ id }: { id: string }) {
  const identity = useIdentity(),
    resource = useCrmResource<Detail>(`estimating/quotes/${id}/response`, true);
  return (
    <div className="quotation-release">
      <PageHeader
        eyebrow="Estimating · ES-06"
        title="Quotation response and negotiation"
        description="Record a reported response to one exact synthetic issue. Receiving and authority to start work remain separate."
      />
      <ErrorNotice error={resource.error} />
      {resource.loading && (
        <p role="status">Loading permitted response evidence…</p>
      )}
      {!resource.data && !!resource.error && (
        <Button onClick={resource.reload}>Retry permitted read</Button>
      )}
      {resource.data && (
        <ResponseBody
          key={`${identity.workspace_id}:${identity.actor_id}:${id}`}
          detail={resource.data}
          reload={resource.reload}
        />
      )}
    </div>
  );
}
function ResponseBody({
  detail: d,
  reload,
}: {
  detail: Detail;
  reload: () => void;
}) {
  const key = `ppo:es06:${d.revision.quote_id}`,
    path = `estimating/quotes/${d.revision.id}/response`;
  const command = useRecoverableCommand({
    key,
    scope: useIdentity(),
    accepts,
    transport: api,
    journalLimit: 65536,
  });
  const [basis, setBasis] = useState(capture(d)),
    [reason, setReason] = useState(""),
    [evidence, setEvidence] = useState(""),
    [respondent, setRespondent] = useState(""),
    [role, setRole] = useState(""),
    [time, setTime] = useState(""),
    [outcome, setOutcome] = useState("Accepted"),
    [action, setAction] = useState("Record"),
    [conditions, setConditions] = useState(""),
    [ack, setAck] = useState(""),
    [answer, setAnswer] = useState(""),
    [note, setNote] = useState(""),
    [due, setDue] = useState("");
  const stale = JSON.stringify(basis) !== JSON.stringify(capture(d));
  const blocked =
    !command.ready ||
    command.busy ||
    !!command.pending ||
    !!command.accepted ||
    stale ||
    !d.can_record;
  useUnsavedChanges(
    !!(reason || evidence || respondent || answer || note) && !command.accepted,
    !!command.pending || command.busy,
  );
  const common = {
    reason,
    evidence,
    synthetic_only: ack === "yes",
    issue_id: basis.issue,
    output_hash: basis.hash,
    expected_response_sequence: basis.sequence,
    response_id: basis.response,
  };
  const report = {
    outcome,
    respondent,
    claimed_role: role,
    responded_at: time,
    conditions: conditions.trim() || null,
  };
  async function send(
    kind: "record" | "clarification" | "prepare",
    extra: object,
  ) {
    await command.send(
      `${path}/${kind}`,
      { ...common, ...extra },
      `/${path}`,
      "Synthetic quotation response",
      d.revision.id,
    );
  }
  if (denied(command.error))
    return (
      <>
        <ErrorNotice error={command.error} />
        <p>
          Current authority no longer permits this evidence. The original
          command is retained for authorised recovery.
        </p>
        <Button onClick={() => window.location.reload()}>
          Reload permitted response
        </Button>
      </>
    );
  return (
    <>
      <section className="release-panel">
        <h2>
          {d.revision.snapshot.display_number} · revision {d.revision.version}
        </h2>
        <p className="release-notice">
          <strong>No commercial validity.</strong> Staff record a reported
          response only. Respondent authority, legal signature, validity/expiry
          and withdrawal policy: Not configured.
        </p>
        <Status
          value={d.current ? "Current issued offer" : "Superseded offer"}
        />
        <p>
          {d.revision.snapshot.customer} · {d.revision.snapshot.contact} · one
          exact estimate option
        </p>
        <div className="release-actions">
          <ButtonLink href={`/estimating/quotes/${d.revision.id}/release`}>
            Open exact ES-05 issue
          </ButtonLink>
          <ButtonLink
            href={`/api/v1/estimating/quotes/${d.revision.id}/file?kind=pdf`}
            target="_blank"
            rel="noreferrer"
          >
            Open original issued PDF
          </ButtonLink>
          <ButtonLink
            href={`/api/v1/estimating/quotes/${d.revision.id}/file?kind=html`}
            target="_blank"
            rel="noreferrer"
          >
            Open original issued HTML
          </ButtonLink>
        </div>
        <details>
          <summary>Exact offer binding</summary>
          <dl className="release-evidence">
            <dt>Issue UUID / output hash</dt>
            <dd>
              {d.issue.id}
              <br />
              {d.issue.output_hash}
            </dd>
            <dt>Estimate / saved version / option</dt>
            <dd>
              {d.revision.estimate_id}
              <br />
              {d.revision.estimate_version_id}
              <br />
              {d.base.basis.option_id}
            </dd>
            <dt>Recipient</dt>
            <dd>
              {d.base.basis.recipient.organisation_id}
              <br />
              {d.base.basis.recipient.person_id}
            </dd>
            <dt>Scope</dt>
            <dd>{d.revision.snapshot.scope.included}</dd>
            <dt>Template / terms</dt>
            <dd>
              {d.revision.template_version}
              <br />
              PPO-SYN-NONOPERATIVE-TERMS-r01
            </dd>
            <dt>Original HTML / PDF hashes</dt>
            <dd>
              {d.issue.html_hash}
              <br />
              {d.issue.pdf_hash}
            </dd>
          </dl>
          <p>
            Include/print choices are retained by this issue. No partial
            acceptance or combination is available.
          </p>
        </details>
      </section>
      <ErrorNotice error={command.error} />
      {command.pending && (
        <section className="release-panel" role="status">
          <h2>Resolve the original action</h2>
          <p>
            The original outcome is uncertain. Replacement actions are held. A
            missing receipt does not prove failure.
          </p>
          <p>Operation: {command.pending.body.operation_id}</p>
          <div className="release-actions">
            <Button
              disabled={command.busy}
              onClick={() => void command.recover()}
            >
              Recover original response receipt
            </Button>
            <Button
              disabled={command.busy}
              onClick={() => void command.retry()}
            >
              Retry exact original
            </Button>
          </div>
        </section>
      )}
      {command.accepted && (
        <section className="release-panel" role="status">
          <h2>Saved to the server</h2>
          <p>
            {command.accepted.receipt.state} · response sequence{" "}
            {command.accepted.receipt.record_version}
          </p>
          <Button
            onClick={() => {
              try {
                sessionStorage.removeItem(key + ":accepted");
              } catch {
                /* Server original is retained. */
              }
              window.location.assign(command.accepted!.entry.target);
            }}
          >
            Open saved response
          </Button>
        </section>
      )}
      {stale && (
        <section className="release-panel" role="status">
          <h2>Response basis changed</h2>
          <p>
            Your entries remain. Compare the current issue and history before
            recording against the new sequence.
          </p>
          <Button
            disabled={!!command.pending || command.busy}
            onClick={() => setBasis(capture(d))}
          >
            Use current response basis
          </Button>
        </section>
      )}
      <section className="release-panel">
        <h2>Reported response</h2>
        <Status
          value={d.state.response?.report?.outcome ?? "No response recorded"}
        />
        <p>
          {d.state.response
            ? `Exact response ${d.state.response.id}`
            : "Viewing or simulated distribution is not acceptance."}
        </p>
        {!!d.state.holds.length && (
          <ul>
            {d.state.holds.map((h) => (
              <li key={h}>{h}</li>
            ))}
          </ul>
        )}
        <p>
          Source edits and unissued preparations do not rewrite this offer. A
          material change must return through ES-05 preparation, approval and
          explicit successor issue.
        </p>
      </section>
      <section className="release-panel">
        <h2>Record staff evidence</h2>
        {!d.can_record && (
          <p>
            Only the current estimator with preparation permission can record
            this synthetic evidence.
          </p>
        )}
        <ValidationFields error={command.error}>
          <fieldset disabled={blocked}>
            <Field
              name="response-reason"
              validationField="reason"
              label="Reason for this record or correction"
              value={reason}
              onChange={setReason}
              maxLength={1000}
              required
            />
            <Field
              name="response-evidence"
              validationField="evidence"
              label="Synthetic response evidence"
              value={evidence}
              onChange={setEvidence}
              maxLength={4000}
              multiline
              required
              hint="Retain the reported wording or a synthetic evidence reference. This records no external communication."
            />
            <SelectField
              name="response-ack"
              validationField="synthetic_only"
              label="Synthetic recording acknowledgement"
              value={ack}
              onChange={setAck}
              options={[
                {
                  id: "yes",
                  display_name:
                    "Reported evidence only; no signature or work authority",
                },
              ]}
              required
            />
            <Field
              name="response-person"
              validationField="respondent"
              label="Stated respondent"
              value={respondent}
              onChange={setRespondent}
              required
            />
            <Field
              name="response-role"
              validationField="claimed_role"
              label="Claimed respondent role"
              value={role}
              onChange={setRole}
              required
            />
            <Field
              name="response-time"
              validationField="responded_at"
              label="Reported response time (UTC)"
              value={time}
              onChange={setTime}
              placeholder="2026-10-03T12:00:00.000Z"
              required
              hint="Use the reported time after issue, ending in Z. Recording time is set by the server."
            />
            <SelectField
              name="response-action"
              validationField="action"
              label="Record type"
              value={action}
              onChange={setAction}
              options={[
                { id: "Record", display_name: "Subsequent reported response" },
                {
                  id: "Correct",
                  display_name: "Correction of the current recorded response",
                },
              ]}
            />
            <SelectField
              name="response-outcome"
              validationField="outcome"
              label="Reported outcome"
              value={outcome}
              onChange={setOutcome}
              options={responseOutcomes.map((value) => ({
                id: value,
                display_name:
                  value === "Clarification"
                    ? "Information-only clarification"
                    : value === "Negotiation"
                      ? "Material negotiation — return to ES-05"
                      : value,
              }))}
            />
            <Field
              name="response-conditions"
              validationField="conditions"
              label="Unresolved conditions (if any)"
              value={conditions}
              onChange={setConditions}
              maxLength={2000}
              multiline
            />
            <p>
              {action === "Correct"
                ? "A correction retains its original; historical acceptance cannot become current through correction."
                : "The preceding response remains in history. Acceptance applies only to this exact issued content."}
            </p>
            <Button
              disabled={
                blocked ||
                (action === "Correct" && !basis.response) ||
                (action === "Record" &&
                  outcome === "Accepted" &&
                  (!d.current ||
                    d.state.material ||
                    !!d.state.unresolved.length))
              }
              onClick={() => void send("record", { action, report })}
            >
              Record exact reported response
            </Button>
          </fieldset>
        </ValidationFields>
        <Button disabled={!!command.pending || command.busy} onClick={reload}>
          Refresh permitted evidence
        </Button>
      </section>
      {!!d.state.unresolved.length && (
        <section className="release-panel">
          <h2>Information-only clarification</h2>
          <p>
            Answers must leave scope, price and terms unchanged. Record material
            changes as Negotiation above.
          </p>
          <fieldset disabled={blocked || !d.current || d.state.material}>
            <Field
              name="clarification-answer"
              validationField="answer"
              label="Information-only answer"
              value={answer}
              onChange={setAnswer}
              multiline
              maxLength={4000}
            />
            {d.state.unresolved.map((q) => {
              const answered = d.events.some(
                (e) => e.action === "Answer" && e.response_id === q.id,
              );
              return (
                <article className="release-history" key={q.id}>
                  <p>{q.evidence}</p>
                  <p>
                    Question: {q.id} ·{" "}
                    {answered
                      ? "Answered; reported confirmation needed"
                      : "Awaiting information-only answer"}
                  </p>
                  <Button
                    disabled={blocked}
                    onClick={() =>
                      void send("clarification", {
                        response_id: q.id,
                        action: answered ? "Confirm" : "Answer",
                        detail: answered
                          ? {
                              respondent,
                              claimed_role: role,
                              responded_at: time,
                            }
                          : { answer },
                      })
                    }
                  >
                    {answered
                      ? "Record respondent confirmation"
                      : "Record information-only answer"}
                  </Button>
                </article>
              );
            })}
          </fieldset>
        </section>
      )}
      <section className="release-panel">
        <h2>ES-07 receiving readiness</h2>
        <Status
          value={
            d.state.preparation
              ? d.state.preparedApplicable
                ? "Prepared for receiving review"
                : "Prepared handover held"
              : d.state.ready
                ? "Ready to prepare for receiving review"
                : "Held"
          }
        />
        <p>
          Acceptance, preparation, sending, receiving and downstream creation
          are separate facts. This page prepares only; nothing is sent, received
          or converted.
        </p>
        <ul>
          {d.policy.receiving_checks.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ul>
        {d.state.preparation && (
          <p>
            Retained preparation {d.state.preparation.id} · exact response{" "}
            {d.state.preparation.response_id} · owner{" "}
            {d.state.preparation.detail.owner_id} · due{" "}
            {d.state.preparation.detail.due_date}.{" "}
            {d.state.preparation.detail.note}
          </p>
        )}
        <fieldset
          disabled={blocked || !d.state.ready || d.state.preparedApplicable}
        >
          <p>
            Preparation owner: {d.owner_id}. ES-07 must independently establish
            its receiver.
          </p>
          <Field
            name="handover-due"
            validationField="due_date"
            label="Preparation follow-up due date"
            type="date"
            value={due}
            onChange={setDue}
            required
          />
          <Field
            name="handover-note"
            validationField="note"
            label="Receiving note and remaining checks"
            value={note}
            onChange={setNote}
            multiline
            maxLength={4000}
            required
          />
          <Button
            disabled={blocked || !d.state.ready || d.state.preparedApplicable}
            onClick={() =>
              void send("prepare", {
                owner_id: d.owner_id,
                due_date: due,
                note,
              })
            }
          >
            Prepare exact ES-07 review handover
          </Button>
        </fieldset>
      </section>
      <section className="release-panel">
        <h2>Immutable response history</h2>
        {!d.events.length && <p>No response evidence recorded.</p>}
        {d.events.map((e) => (
          <article className="release-history" key={e.id}>
            <h3>
              {e.sequence}. {e.action} · {e.report?.outcome ?? e.action}
            </h3>
            <p>
              Event {e.id} ·{" "}
              {e.response_id
                ? `Related response ${e.response_id}`
                : "First response"}
            </p>
            {e.report && (
              <p>
                {e.report.respondent} · claimed role {e.report.claimed_role} ·
                reported {e.report.responded_at}. Conditions:{" "}
                {e.report.conditions ?? "None reported"}
              </p>
            )}
            {e.detail.answer && (
              <p>Information-only answer: {e.detail.answer}</p>
            )}
            {e.detail.respondent && (
              <p>
                Confirmation: {e.detail.respondent} · claimed role{" "}
                {e.detail.claimed_role} · reported {e.detail.responded_at}
              </p>
            )}
            <p>
              Recorded by {e.created_by} at {String(e.created_at)}
            </p>
            <p>{e.reason}</p>
            <p>{e.evidence}</p>
            <p>
              {e.report && e.id !== d.state.response?.id
                ? "Earlier response; retained without current applicability."
                : !d.current
                  ? "Historical superseded offer; no receiving authority."
                  : "Exact issued content retained."}
            </p>
          </article>
        ))}
      </section>
    </>
  );
}
