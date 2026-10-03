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
import type { readEstimateReview } from "../estimating/review/reads";
import type { ReviewKind } from "../estimating/review/validation";
import "./estimating.css";
import "./estimate-review.css";

type Detail = Awaited<ReturnType<typeof readEstimateReview>>;
const labels = {
  Completeness: "Completeness",
  SourcePrice: "Source-price review",
  Technical: "Technical review",
};
const accepts = (e: JournalEntry) =>
  /^estimating\/estimates\/[a-f0-9-]{36}\/review(?:\/decision)?$/.test(
    e.path,
  ) && /^\/estimating\/estimates\/[a-f0-9-]{36}\/review$/.test(e.target);
export function EstimateReview({ id }: { id: string }) {
  const identity = useIdentity(),
    resource = useCrmResource<Detail>(
      `estimating/estimates/${id}/review`,
      true,
    );
  return (
    <div className="estimate-review">
      <PageHeader
        eyebrow="Estimating · ES-04"
        title="Saved estimate review"
        description="Review exact saved evidence. Commercial approval and quotation issue remain separate."
      />
      <ButtonLink href={`/estimating/estimates/${id}`}>
        Open saved estimate
      </ButtonLink>
      <ErrorNotice error={resource.error} />
      {resource.loading && (
        <p role="status">Loading permitted review evidence…</p>
      )}
      {!resource.data && !!resource.error && (
        <Button onClick={resource.reload}>Retry permitted read</Button>
      )}
      {resource.data && (
        <ReviewBody
          key={`${identity.workspace_id}:${identity.actor_id}:${id}`}
          detail={resource.data}
          reload={resource.reload}
        />
      )}
    </div>
  );
}
function ReviewBody({
  detail: d,
  reload,
}: {
  detail: Detail;
  reload: () => void;
}) {
  const key = `ppo:es04:${d.estimate.id}`,
    path = `estimating/estimates/${d.estimate.id}/review`,
    target = `/estimating/estimates/${d.estimate.id}/review`;
  const command = useRecoverableCommand({
    key,
    scope: useIdentity(),
    accepts,
    transport: api,
    journalLimit: 65536,
  });
  const [basis, setBasis] = useState({
    estimate: d.estimate.version,
    review: d.sequence,
    version: d.saved.id,
    hash: d.basis_hash,
    submission: d.submissions.at(-1)?.id,
  });
  const [reason, setReason] = useState(""),
    [responses, setResponses] = useState<Record<string, string>>({}),
    [kind, setKind] = useState<ReviewKind>(
      d.statuses.find((s) => s.can_review)?.kind ?? "Completeness",
    ),
    [outcome, setOutcome] = useState("Reviewed"),
    [finding, setFinding] = useState(""),
    [line, setLine] = useState("");
  const pending = !!command.pending,
    changed = !!(reason || finding || Object.values(responses).some(Boolean));
  useUnsavedChanges(changed && !command.accepted, pending || command.busy);
  const stale =
    basis.estimate !== d.estimate.version ||
    basis.review !== d.sequence ||
    basis.version !== d.saved.id ||
    basis.hash !== d.basis_hash;
  const blocked =
    !command.ready || command.busy || pending || !!command.accepted || stale;
  const outstanding = d.statuses
    .filter((s) => s.decision?.outcome === "Returned")
    .flatMap((s) => s.decision!.findings);
  const submitted =
    d.versions.find(
      (v) => v.id === d.submissions.at(-1)?.estimate_version_id,
    ) ?? d.saved;
  const submit = async () => {
    await command.send(
      path,
      {
        expected_version: basis.estimate,
        expected_review_version: basis.review,
        estimate_version_id: basis.version,
        basis_hash: basis.hash,
        reason,
        responses: outstanding.map((f) => ({
          finding_id: f.id,
          response: responses[f.id] ?? "",
        })),
      },
      target,
      "Estimate submission",
      d.estimate.id,
    );
  };
  const decide = async () => {
    await command.send(
      path + "/decision",
      {
        expected_version: basis.estimate,
        expected_review_version: basis.review,
        submission_id: basis.submission,
        kind,
        outcome,
        reason,
        findings:
          outcome === "Returned"
            ? [{ line_id: line || null, detail: finding }]
            : [],
      },
      target,
      "Estimate review",
      d.estimate.id,
    );
  };
  if (denied(command.error))
    return (
      <>
        <ErrorNotice error={command.error} />
        <p>
          Review evidence is unavailable under current authority. The original
          command remains retained for authorised recovery.
        </p>
        <Button onClick={() => window.location.reload()}>
          Reload permitted review
        </Button>
      </>
    );
  return (
    <>
      <section className="est-panel" aria-label="Review basis">
        <h2>
          {d.estimate.display_number} · saved version {d.saved.version}
        </h2>
        <p>{d.saved.title}</p>
        <p>
          <Status value={d.outcome} /> · Review sequence {d.sequence}
        </p>
        <p>
          <strong>Commercial approval: Not configured.</strong>{" "}
          Pricing-exception rules: Not configured. Reviewed evidence does not
          authorise quotation issue or delivery.
        </p>
        <details>
          <summary>Exact current source identity</summary>
          <dl className="review-evidence">
            <dt>Saved version</dt>
            <dd>{d.saved.id}</dd>
            <dt>Content hash</dt>
            <dd>{d.saved.content_hash}</dd>
            <dt>Source headers observed</dt>
            <dd>
              {d.basis.source_heads.length
                ? d.basis.source_heads
                    .map((s) => `${s.id} v${s.version}`)
                    .join("; ")
                : "Manual source text and dates; no typed source bindings"}
            </dd>
          </dl>
        </details>
        <details>
          <summary>
            Read submitted scope and cost evidence · saved version{" "}
            {submitted.version}
          </summary>
          <p>{submitted.scope.included}</p>
          <p>Excluded: {submitted.scope.excluded}</p>
          <p>Assumptions: {submitted.scope.assumptions}</p>
          <p>
            Saved cost AUD {submitted.cost_total ?? "Unknown"} · saved sell AUD{" "}
            {submitted.sell_total ?? "Unknown"} · excluding tax
          </p>
          {submitted.lines.map((l) => (
            <article className="review-history" key={l.id}>
              <h3>{l.description}</h3>
              <p>
                {l.category} · {l.quantity} {l.unit} · allowance{" "}
                {l.allowance === undefined
                  ? "Not recorded"
                  : l.allowance
                    ? "Yes"
                    : "No"}
              </p>
              <p>
                Unit cost AUD {l.unit_cost} · unit sell AUD {l.unit_sell}
              </p>
              <p>
                {l.source} · source date {l.effective_date}
              </p>
              <p className="review-evidence">Line {l.id}</p>
            </article>
          ))}
        </details>
        <div className="review-kinds">
          {d.statuses.map((s) => (
            <section key={s.kind} aria-label={labels[s.kind]}>
              <h3>{labels[s.kind]}</h3>
              <Status value={s.state} />
              {s.decision && (
                <>
                  <p>{s.decision.reason}</p>
                  <p className="review-evidence">
                    Decision {s.decision.id} · actor {s.decision.created_by}
                  </p>
                  <p>
                    {s.applicable
                      ? "Still applicable to these facts"
                      : "Changed facts require a new decision"}{" "}
                    · original submission {s.decision.submission_id}
                  </p>
                </>
              )}
            </section>
          ))}
        </div>
      </section>
      <ErrorNotice error={command.error} />
      {!command.ready && (
        <p role="status">Checking same-tab recovery before another command…</p>
      )}
      {command.busy && <p role="status">Confirming the original action…</p>}
      {pending && (
        <section className="est-panel" aria-label="Original operation recovery">
          <h2>Resolve the original action</h2>
          <p>
            Outcome unknown. An unavailable receipt does not prove the action
            failed. New decisions are held.
          </p>
          <p className="review-evidence">
            Operation {command.pending!.body.operation_id}
          </p>
          <div className="review-actions">
            <Button
              disabled={command.busy}
              onClick={() => void command.recover()}
            >
              Check original outcome
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
        <section className="est-panel" role="status">
          <h2>Saved to the server</h2>
          <p>
            {command.accepted.receipt.state} · review sequence{" "}
            {command.accepted.receipt.record_version}
          </p>
          <Button
            onClick={() => {
              try {
                sessionStorage.removeItem(key + ":accepted");
              } catch {
                /* Server receipt remains authoritative. */
              }
              window.location.assign(target);
            }}
          >
            Open saved review
          </Button>
        </section>
      )}
      {stale && (
        <section className="est-panel" role="status">
          <h2>Saved basis changed</h2>
          <p>
            Your entered findings and rationale remain below. Compare the
            current saved evidence and history before using its new sequence.
          </p>
          <Button
            disabled={pending || command.busy}
            onClick={() =>
              setBasis({
                estimate: d.estimate.version,
                review: d.sequence,
                version: d.saved.id,
                hash: d.basis_hash,
                submission: d.submissions.at(-1)?.id,
              })
            }
          >
            Use current review basis
          </Button>
        </section>
      )}
      <section className="est-panel">
        <h2>Submit or review</h2>
        <p>
          Completeness checks scope documentation. Source-price review checks
          the retained manual prices and provenance. Technical review records
          scope and quantity evidence; it is not an Engineering release.
        </p>
        <ValidationFields error={command.error}>
          <fieldset disabled={blocked}>
            <Field
              name="reason"
              label="Submission or review rationale"
              value={reason}
              onChange={setReason}
              required
              multiline
              maxLength={1000}
            />
            {d.can_submit && (
              <>
                <h3>Owner correction and submission</h3>
                {outstanding.map((f) => (
                  <div key={f.id}>
                    <p>{f.detail}</p>
                    <Field
                      name={`response-${f.id}`}
                      label={`Response to finding ${f.id}`}
                      value={responses[f.id] ?? ""}
                      onChange={(v) =>
                        setResponses({ ...responses, [f.id]: v })
                      }
                      required
                      multiline
                      maxLength={1000}
                    />
                  </div>
                ))}
                <Button onClick={() => void submit()}>
                  Submit exact saved revision
                </Button>
              </>
            )}
            {d.statuses.some((s) => s.can_review) && (
              <>
                <h3>Independent evidence review</h3>
                <SelectField
                  name="kind"
                  label="Review kind"
                  value={kind}
                  onChange={(v) => setKind(v as ReviewKind)}
                  options={d.statuses
                    .filter((s) => s.can_review)
                    .map((s) => ({ id: s.kind, display_name: labels[s.kind] }))}
                />
                <SelectField
                  name="outcome"
                  label="Review outcome"
                  value={outcome}
                  onChange={setOutcome}
                  options={[
                    { id: "Reviewed", display_name: "Reviewed" },
                    { id: "Returned", display_name: "Returned" },
                  ]}
                />
                {outcome === "Returned" && (
                  <>
                    <SelectField
                      name="line_id"
                      label="Finding applies to"
                      value={line}
                      onChange={setLine}
                      empty="Whole submitted estimate"
                      options={
                        d.versions
                          .find(
                            (v) =>
                              v.id ===
                              d.submissions.at(-1)?.estimate_version_id,
                          )
                          ?.lines.map((l) => ({
                            id: l.id,
                            display_name: l.description,
                          })) ?? []
                      }
                    />
                    <Field
                      name="detail"
                      label="Finding requiring correction"
                      value={finding}
                      onChange={setFinding}
                      required
                      multiline
                      maxLength={1000}
                    />
                  </>
                )}
                <Button
                  disabled={
                    !d.statuses.some((s) => s.kind === kind && s.can_review)
                  }
                  onClick={() => void decide()}
                >
                  Record exact review decision
                </Button>
              </>
            )}
            {!d.can_submit && !d.statuses.some((s) => s.can_review) && (
              <p>
                No submission or decision action is available under the current
                duties and saved state.
              </p>
            )}
          </fieldset>
        </ValidationFields>
        <Button disabled={command.busy} onClick={reload}>
          Refresh current evidence
        </Button>
      </section>
      <section className="est-panel">
        <h2>Immutable submission and decision history</h2>
        {!d.submissions.length && (
          <p>No formal submission has been recorded.</p>
        )}
        {d.submissions.map((s) => (
          <article key={s.id} className="review-history">
            <h3>Submission sequence {s.sequence}</h3>
            <p>{s.reason}</p>
            <p className="review-evidence">
              {s.id} · saved version {s.estimate_version_id} · actor{" "}
              {s.created_by}
            </p>
            <ButtonLink
              href={`/estimating/estimates/${d.estimate.id}?version_id=${s.estimate_version_id}`}
            >
              Open exact submitted estimate
            </ButtonLink>
            {s.predecessor_id && (
              <p className="review-evidence">Predecessor {s.predecessor_id}</p>
            )}
            {s.responses.map((r) => (
              <p key={r.finding_id} className="review-evidence">
                Response to {r.finding_id}: {r.response}
              </p>
            ))}
            {d.decisions
              .filter((x) => x.submission_id === s.id)
              .map((x) => (
                <div key={x.id}>
                  <h4>
                    {labels[x.kind]} · {x.outcome}
                  </h4>
                  <p>{x.reason}</p>
                  <p className="review-evidence">
                    Actor {x.created_by} ·{" "}
                    {new Date(x.created_at).toLocaleString("en-AU")}
                  </p>
                  {x.findings.map((f) => (
                    <p key={f.id} className="review-evidence">
                      Finding {f.id}: {f.detail}
                      {f.line_id ? ` · Line ${f.line_id}` : " · Whole estimate"}
                    </p>
                  ))}
                </div>
              ))}
          </article>
        ))}
      </section>
    </>
  );
}
