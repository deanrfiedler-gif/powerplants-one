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
import type { readRelease } from "../estimating/release/reads";
import "./quotation-release.css";
type Detail = Awaited<ReturnType<typeof readRelease>>;
const accepts = (e: JournalEntry) =>
  /^estimating\/quotes\/[a-f0-9-]{36}\/release\/(prepare|approval|issue|distribution)$/.test(
    e.path,
  ) && /^\/estimating\/quotes\/[a-f0-9-]{36}\/release$/.test(e.target);
const capture = (d: Detail) => ({
  quote: d.quote_version,
  sequence: d.sequence,
  hash: d.preview.basis_hash,
  output: d.job.output_hash,
  approval: d.approval?.id,
  predecessor: d.preview.predecessor_issue_id,
});
export function QuotationRelease({ id }: { id: string }) {
  const identity = useIdentity(),
    resource = useCrmResource<Detail>(`estimating/quotes/${id}/release`, true);
  return (
    <div className="quotation-release">
      <PageHeader
        eyebrow="Estimating · ES-05"
        title="Synthetic quotation release"
        description="Prepare, independently approve, issue exact output and record a distribution simulation as separate facts."
      />
      <ErrorNotice error={resource.error} />
      {resource.loading && (
        <p role="status">Loading permitted release evidence…</p>
      )}
      {!resource.data && !!resource.error && (
        <Button onClick={resource.reload}>Retry permitted read</Button>
      )}
      {resource.data && (
        <ReleaseBody
          key={`${identity.workspace_id}:${identity.actor_id}:${id}`}
          detail={resource.data}
          reload={resource.reload}
        />
      )}
    </div>
  );
}
function ReleaseBody({
  detail: d,
  reload,
}: {
  detail: Detail;
  reload: () => void;
}) {
  const key = `ppo:es05:${d.revision.quote_id}`,
    path = `estimating/quotes/${d.revision.id}/release`;
  const command = useRecoverableCommand({
    key,
    scope: useIdentity(),
    accepts,
    transport: api,
    journalLimit: 65536,
  });
  const [basis, setBasis] = useState(capture(d)),
    [reason, setReason] = useState(""),
    [confirmed, setConfirmed] = useState(""),
    [approval, setApproval] = useState("Approved"),
    [distribution, setDistribution] = useState("Unknown"),
    [rendering, setRendering] = useState(false),
    [renderError, setRenderError] = useState<unknown>(null);
  const pending = !!command.pending,
    stale = JSON.stringify(basis) !== JSON.stringify(capture(d)),
    blocked =
      !command.ready ||
      command.busy ||
      pending ||
      !!command.accepted ||
      stale ||
      rendering;
  useUnsavedChanges(
    !!reason && !command.accepted,
    pending || command.busy || rendering,
  );
  const common = {
    reason,
    synthetic_only: confirmed === "yes",
    expected_quote_version: basis.quote,
    expected_release_sequence: basis.sequence,
  };
  const submit = async (
    action: "prepare" | "approval" | "issue" | "distribution",
  ) => {
    const id = action === "prepare" ? crypto.randomUUID() : d.revision.id;
    const previous = d.events.filter((e) => e.issue_id === d.issue?.id).at(-1);
    const body =
      action === "prepare"
        ? {
            ...common,
            id,
            basis_hash: basis.hash,
            predecessor_issue_id: basis.predecessor,
          }
        : action === "approval"
          ? { ...common, outcome: approval, output_hash: basis.output }
          : action === "issue"
            ? {
                ...common,
                approval_id: basis.approval,
                output_hash: basis.output,
              }
            : {
                ...common,
                issue_id: d.issue!.id,
                attempt_id:
                  previous?.outcome === "Unknown"
                    ? previous.attempt_id
                    : crypto.randomUUID(),
                resolves_event_id:
                  previous?.outcome === "Unknown" ? previous.id : null,
                outcome: distribution,
              };
    await command.send(
      `${path}/${action}`,
      body,
      `/estimating/quotes/${id}/release`,
      `Synthetic quotation ${action}`,
      id,
    );
  };
  const render = async () => {
    setRendering(true);
    setRenderError(null);
    try {
      await api(`estimating/quotes/${d.revision.id}/render`, {});
      reload();
    } catch (e) {
      setRenderError(e);
    } finally {
      setRendering(false);
    }
  };
  if (denied(command.error) || denied(renderError))
    return (
      <>
        <ErrorNotice error={command.error ?? renderError} />
        <p>
          Current authority no longer permits this evidence. The original
          command is retained for authorised recovery.
        </p>
        <Button onClick={() => window.location.reload()}>
          Reload permitted release
        </Button>
      </>
    );
  const latestDistribution = d.events
      .filter((e) => e.issue_id === d.issue?.id)
      .at(-1),
    canRecordDistribution =
      d.can.distribute && latestDistribution?.outcome !== "SimulatedDelivered";
  return (
    <>
      <section className="release-panel">
        <h2>
          {d.revision.snapshot.display_number} · revision {d.revision.version}
        </h2>
        <p>{d.revision.snapshot.title}</p>
        <p className="release-notice">
          <strong>No commercial validity.</strong> {d.policy.terms} Operative
          terms, financial exceptions and validity period: Not configured.
        </p>
        <p>
          <ButtonLink
            href={`/estimating/estimates/${d.revision.estimate_id}?version_id=${d.revision.estimate_version_id}`}
          >
            Open exact saved estimate
          </ButtonLink>
        </p>
        <div className="release-stages">
          <section>
            <h3>Preparation</h3>
            <Status value={d.base ? "Prepared" : "Draft source"} />
            <p>Output: {d.job.state}</p>
          </section>
          <section>
            <h3>Approval</h3>
            <Status value={d.approval?.outcome ?? "Not approved"} />
            <p>
              {d.current ? "Current applicable basis" : "Changed basis — held"}
            </p>
          </section>
          <section>
            <h3>Exact issue</h3>
            <Status value={d.issue ? "Issued" : "Not issued"} />
            <p>
              {d.issue
                ? "Original issue retained"
                : "Approval alone does not issue"}
            </p>
          </section>
          <section>
            <h3>Distribution</h3>
            <Status value={latestDistribution?.outcome ?? "Not recorded"} />
            <p>Simulation only; no customer communication</p>
          </section>
        </div>
        {d.hold && <p role="status">{d.hold}</p>}
        {d.issue && <ButtonLink href={`/estimating/quotes/${d.revision.id}/response`}>Open exact quotation response</ButtonLink>}
        {!!d.preview.problems.length && (
          <ul>
            {d.preview.problems.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
        )}
        <details>
          <summary>Exact source, recipient, terms and template</summary>
          <dl className="release-evidence">
            <dt>Saved estimate</dt>
            <dd>{d.revision.estimate_version_id}</dd>
            <dt>Recipient</dt>
            <dd>
              {(d.base?.basis ?? d.preview.source).recipient.customer} ·{" "}
              {(d.base?.basis ?? d.preview.source).recipient.contact ??
                "Not configured"}
            </dd>
            <dt>Retained binding</dt>
            <dd>
              {d.base?.basis_hash ??
                "Prepare after reviewing the observed basis"}
            </dd>
            <dt>Template</dt>
            <dd>{d.revision.template_version}</dd>
            <dt>Demonstration conditions</dt>
            <dd>{d.policy.terms_version}</dd>
            <dt>Original HTML / PDF</dt>
            <dd>
              {d.job.hashes?.html ?? "Not rendered"}
              <br />
              {d.job.hashes?.pdf ?? "Not rendered"}
            </dd>
            <dt>Quote / release sequence</dt>
            <dd>
              {d.quote_version} / {d.sequence}
            </dd>
          </dl>
          <p>
            The initial manual offer retains one exact estimate option and its
            include/print choices. Optional commercial packages are unavailable.
          </p>
        </details>
      </section>
      <ErrorNotice error={command.error} />
      <ErrorNotice error={renderError} />
      {!command.ready && (
        <p role="status">Checking original-operation recovery…</p>
      )}
      {pending && (
        <section
          className="release-panel"
          aria-label="Original release recovery"
        >
          <h2>Resolve the original action</h2>
          <p>
            Outcome unknown. An unavailable receipt does not prove failure. New
            decisions are held.
          </p>
          <p className="release-evidence">
            Operation {command.pending!.body.operation_id}
          </p>
          <div className="release-actions">
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
        <section className="release-panel" role="status">
          <h2>Saved to the server</h2>
          <p>
            {command.accepted.receipt.state} · release sequence{" "}
            {command.accepted.receipt.record_version}
          </p>
          <Button
            onClick={() => {
              try {
                sessionStorage.removeItem(key + ":accepted");
              } catch {
                /* Original server receipt remains retained. */
              }
              window.location.assign(command.accepted!.entry.target);
            }}
          >
            Open saved release
          </Button>
        </section>
      )}
      {stale && (
        <section className="release-panel" role="status">
          <h2>Release basis changed</h2>
          <p>
            Your rationale is retained. Compare the current source and exact
            output before using the new basis.
          </p>
          <Button
            disabled={pending || command.busy}
            onClick={() => setBasis(capture(d))}
          >
            Use current release basis
          </Button>
        </section>
      )}
      <section className="release-panel">
        <h2>Exact document</h2>
        <p>
          {d.job.state} · {d.job.attempts} render attempts. A ready document is
          not an issue.
        </p>
        {d.job.state === "Ready" ? (
          <div className="release-actions">
            <ButtonLink
              href={`/api/v1/estimating/quotes/${d.revision.id}/file?kind=pdf`}
              target="_blank"
              rel="noreferrer"
            >
              Open exact PDF
            </ButtonLink>
            <ButtonLink
              href={`/api/v1/estimating/quotes/${d.revision.id}/file?kind=html`}
              target="_blank"
              rel="noreferrer"
            >
              Open exact HTML
            </ButtonLink>
          </div>
        ) : (
          <p>
            Its preparation owner can generate or recover the exact retained
            output.
          </p>
        )}
        {d.base && d.can.render && d.job.state !== "Ready" && (
          <Button disabled={blocked} onClick={() => void render()}>
            {rendering
              ? "Generating exact output…"
              : "Generate or recover exact output"}
          </Button>
        )}
        <details>
          <summary>Read customer-safe prepared content</summary>
          <p>
            {d.revision.snapshot.customer} · {d.revision.snapshot.contact}
          </p>
          <p>{d.revision.snapshot.scope.included}</p>
          {d.revision.snapshot.items.map((item, i) => (
            <article className="release-history" key={i}>
              <strong>{item.description}</strong>
              <p>
                {item.quantity ? `${item.quantity} ${item.unit}` : "Included"} ·
                AUD {item.amount}
              </p>
            </article>
          ))}
          <p>
            <strong>Total AUD {d.revision.snapshot.total}</strong> · excluding
            tax; tax not calculated
          </p>
          <p>Excluded: {d.revision.snapshot.scope.excluded}</p>
          <p>Assumptions: {d.revision.snapshot.scope.assumptions}</p>
        </details>
      </section>
      {(d.can.prepare ||
        d.can.approve ||
        d.can.issue ||
        canRecordDistribution ||
        !!reason ||
        pending ||
        !!command.accepted) && (
        <section className="release-panel">
          <h2>Record the next controlled step</h2>
          <ValidationFields error={command.error}>
            <fieldset disabled={blocked}>
              <Field
                name="reason"
                label="Release rationale or simulation evidence"
                value={reason}
                onChange={setReason}
                required
                multiline
                maxLength={1000}
              />
              <SelectField
                name="synthetic_only"
                label="Demonstration policy acknowledgement"
                value={confirmed}
                onChange={setConfirmed}
                empty="Choose explicitly"
                options={[
                  {
                    id: "yes",
                    display_name: "Synthetic only — no commercial validity",
                  },
                ]}
              />
              {d.can.prepare && (
                <div>
                  <p>
                    Preparation creates a new quotation revision with its own
                    exact source and output. No earlier approval is inherited.
                  </p>
                  <Button
                    disabled={confirmed !== "yes"}
                    onClick={() => void submit("prepare")}
                  >
                    Prepare synthetic release successor
                  </Button>
                </div>
              )}
              {d.can.approve && (
                <div>
                  <SelectField
                    name="approval_outcome"
                    label="Independent approval outcome"
                    value={approval}
                    onChange={setApproval}
                    options={[
                      {
                        id: "Approved",
                        display_name: "Approved for synthetic issue only",
                      },
                      {
                        id: "Returned",
                        display_name: "Returned for a new preparation",
                      },
                    ]}
                  />
                  <Button
                    disabled={confirmed !== "yes"}
                    onClick={() => void submit("approval")}
                  >
                    Record exact approval decision
                  </Button>
                </div>
              )}
              {d.can.issue && (
                <div>
                  <p>
                    Issue retains the exact independently approved HTML/PDF. It
                    records no customer delivery.
                  </p>
                  <Button
                    disabled={confirmed !== "yes"}
                    onClick={() => void submit("issue")}
                  >
                    Issue exact synthetic document
                  </Button>
                </div>
              )}
              {canRecordDistribution && (
                <div>
                  <SelectField
                    name="distribution_outcome"
                    label="Recorded simulation outcome"
                    value={distribution}
                    onChange={setDistribution}
                    options={[
                      {
                        id: "Unknown",
                        display_name: "Unknown — hold another attempt",
                      },
                      {
                        id: "SimulatedDelivered",
                        display_name: "Simulated delivered — no actual send",
                      },
                      {
                        id: "SimulatedFailed",
                        display_name: "Simulated failed",
                      },
                    ]}
                  />
                  {latestDistribution?.outcome === "Unknown" && (
                    <p>
                      Resolve the retained unknown attempt. Its original
                      identity and outcome remain in history.
                    </p>
                  )}
                  <Button
                    disabled={confirmed !== "yes"}
                    onClick={() => void submit("distribution")}
                  >
                    {latestDistribution?.outcome === "Unknown"
                      ? "Record original simulation resolution"
                      : "Record distribution simulation"}
                  </Button>
                </div>
              )}
            </fieldset>
          </ValidationFields>
        </section>
      )}
      <Button disabled={command.busy || rendering} onClick={reload}>
        Refresh current release evidence
      </Button>
      <section className="release-panel">
        <h2>Immutable release history</h2>
        {!d.events.length && <p>No release fact has been recorded.</p>}
        {d.events.map((e) => (
          <article className="release-history" key={e.id}>
            <h3>
              {e.action} · {e.outcome}
            </h3>
            <p>{e.reason}</p>
            <p className="release-evidence">
              Actor {e.created_by} ·{" "}
              {new Date(e.created_at).toLocaleString("en-AU")}
              <br />
              Event {e.id} · sequence {e.sequence}
            </p>
            {e.resolves_event_id && (
              <p className="release-evidence">
                Attributable resolution of {e.resolves_event_id}
              </p>
            )}
            {e.action === "Issue" && (
              <p className="release-evidence">
                Preceding issue:{" "}
                {d.revisions.find((r) => r.id === e.revision_id)
                  ?.predecessor_issue_id ?? "First issue"}
                <br />
                Original HTML {e.hashes?.html}
                <br />
                Original PDF {e.hashes?.pdf}
              </p>
            )}
            <ButtonLink href={`/estimating/quotes/${e.revision_id}/release`}>
              Open exact revision
            </ButtonLink>
          </article>
        ))}
      </section>
    </>
  );
}
