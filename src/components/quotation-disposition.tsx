"use client";
import { useEffect, useState } from "react";
import { Field, SelectField, Status } from "./business-ui";
import { Button, ButtonLink } from "./ui/button";
import { useUnsavedChanges } from "./record-ui";
import type { readConversion } from "../estimating/conversion/reads";
type Detail = Awaited<ReturnType<typeof readConversion>>;
type Target = Detail["dispositions"][number];
const capture = (t: Target) => ({
  hash: t.basis_hash,
  sequence: t.sequence,
  review: t.review?.id ?? null,
  review_hash: t.review?.review_hash ?? null,
});
export function QuotationDispositions({
  detail: d,
  blocked,
  actor,
  send,
}: {
  detail: Detail;
  blocked: boolean;
  actor: string;
  send: (
    kind: "disposition-review" | "disposition-apply",
    body: Record<string, unknown>,
  ) => Promise<void>;
}) {
  const [targetId, setTargetId] = useState(d.dispositions[0]?.target_id ?? "");
  const [dirty, setDirty] = useState(false);
  const t =
    d.dispositions.find((t) => t.target_id === targetId) ?? d.dispositions[0];
  if (!t) return null;
  return (
    <section className="release-panel">
      <h2>5. Disposition of completed targets</h2>
      <p>
        The original conversion remains completed. Review each affected target
        against its exact source and downstream evidence. A note or saved review
        does not resolve an exception; apply the exact decision separately.
      </p>
      <ul>
        {d.dispositions.map((t) => (
          <li key={t.target_id}>
            {t.basis.target.title}: <strong>{t.status}</strong> · version{" "}
            {t.basis.target.version}
          </li>
        ))}
      </ul>
      {d.original_conversion_revision !== d.revision.id ? (
        <ButtonLink
          href={`/estimating/quotes/${d.original_conversion_revision}/conversion`}
        >
          Review original completed conversion
        </ButtonLink>
      ) : (
        <>
          <SelectField
            name="disposition-target"
            label="Completed target to review"
            value={t.target_id}
            onChange={(id) => {
              if (
                !dirty ||
                window.confirm(
                  "Switch target and discard this unsaved disposition proposal?",
                )
              )
                setTargetId(id);
            }}
            disabled={blocked}
            options={d.dispositions.map((t) => ({
              id: t.target_id,
              display_name: t.basis.target.title,
            }))}
          />
          <TargetReview
            key={t.target_id}
            target={t}
            blocked={blocked}
            actor={actor}
            send={send}
            onDirtyChange={setDirty}
          />
        </>
      )}
    </section>
  );
}
function TargetReview({
  target: t,
  blocked,
  actor,
  send,
  onDirtyChange,
}: {
  target: Target;
  blocked: boolean;
  actor: string;
  onDirtyChange: (dirty: boolean) => void;
  send: (
    kind: "disposition-review" | "disposition-apply",
    body: Record<string, unknown>,
  ) => Promise<void>;
}) {
  const [basis, setBasis] = useState(capture(t)),
    [decision, setDecision] = useState("Retain"),
    [quantity, setQuantity] = useState(t.basis.target.quantity),
    [reason, setReason] = useState(""),
    [evidence, setEvidence] = useState(""),
    [owner, setOwner] = useState(actor),
    [due, setDue] = useState(""),
    [next, setNext] = useState(""),
    [ack, setAck] = useState("");
  const stale = JSON.stringify(basis) !== JSON.stringify(capture(t)),
    r = t.basis.target,
    old = t.basis.original_target;
  const dirty = !!(
    reason ||
    evidence ||
    next ||
    due ||
    ack ||
    decision !== "Retain" ||
    owner !== actor ||
    quantity !== r.quantity
  );
  useEffect(() => onDirtyChange(dirty), [dirty, onDirtyChange]);
  useUnsavedChanges(dirty && !blocked, false);
  const body = {
    target_id: t.target_id,
    execution_id: t.basis.execution_id,
    expected_sequence: basis.sequence,
    reason,
    evidence,
    synthetic_only: ack === "yes",
  };
  return (
    <>
      <Status value={t.status} />
      <p>
        Original {old.quantity} {old.unit}, version 1 → current {r.quantity}{" "}
        {r.unit}, version {r.version}, {r.data.demand_class}. Target {r.id} ·
        company {r.company_id} · entity{" "}
        {r.external_key?.entity ?? "SupplyDemand"}.
      </p>
      <p>
        Source changes:{" "}
        {t.source_changes.length ? t.source_changes.join(", ") : "None"}.
        Downstream changes:{" "}
        {t.target_changes.length ? t.target_changes.join(", ") : "None"}.
        Unrelated drafts, sibling mappings and other targets do not invalidate
        this review.
      </p>
      <ul>
        {t.source_change_reasons.map((reason) => (
          <li key={reason}>{reason}</li>
        ))}
      </ul>
      <details>
        <summary>Original and current source evidence</summary>
        <dl className="release-evidence">
          <dt>Native company / site</dt>
          <dd>
            Original {old.company_id} / {old.site_id ?? "None"}; current{" "}
            {r.company_id} / {r.site_id ?? "None"}.
          </dd>
          <dt>Item and external company/entity keys</dt>
          <dd>
            Original item {old.item}; current item {r.item}.<br />
            Original{" "}
            {old.external_key
              ? `${old.external_key.provider} / ${old.external_key.configuration} / ${old.external_key.company} / ${old.external_key.entity} / ${old.external_key.key}`
              : "None"}
            .<br />
            Current{" "}
            {r.external_key
              ? `${r.external_key.provider} / ${r.external_key.configuration} / ${r.external_key.company} / ${r.external_key.entity} / ${r.external_key.key}`
              : "None"}
            .
          </dd>
          <dt>Completed execution / original plan / output</dt>
          <dd>
            {t.basis.execution_id}
            <br />
            {t.basis.plan_id}
            <br />
            {t.basis.output_hash}
          </dd>
          <dt>Original source line</dt>
          <dd>{t.basis.line_id}</dd>
          {Object.entries(t.basis.original_source).map(([key, value]) => (
            <div key={key}>
              <dt>{key}</dt>
              <dd>
                Original: {String(value)}
                <br />
                Current:{" "}
                {String(t.basis.source[key as keyof typeof t.basis.source])}
              </dd>
            </div>
          ))}
        </dl>
        <p>
          Use the immutable conversion history and exact ES-06 response above to
          inspect the original commercial plan, receiving decision, response
          report and issued output.
        </p>
        <p>
          Original response:{" "}
          {t.basis.original_evidence.response.report?.outcome} ·{" "}
          {t.basis.original_evidence.response.report?.respondent} ·{" "}
          {t.basis.original_evidence.response.evidence}
        </p>
        <p>
          Current response: {t.basis.current_evidence.response?.report?.outcome}{" "}
          · {t.basis.current_evidence.response?.report?.respondent} ·{" "}
          {t.basis.current_evidence.response?.evidence}
        </p>
        <p>
          Original receiving:{" "}
          {t.basis.original_evidence.receiving.receiving?.decision} ·{" "}
          {t.basis.original_evidence.receiving.evidence}
        </p>
        <p>
          Current receiving:{" "}
          {t.basis.current_evidence.receiving?.receiving?.decision} ·{" "}
          {t.basis.current_evidence.receiving?.evidence}
        </p>
        <p>
          Original mapping:{" "}
          {t.basis.original_evidence.resolution.resolution?.state} ·{" "}
          {t.basis.original_evidence.resolution.resolution?.label}; current
          mapping: {t.basis.current_evidence.resolution?.resolution?.state} ·{" "}
          {t.basis.current_evidence.resolution?.resolution?.label}.
        </p>
      </details>
      <details>
        <summary>Reviewed downstream dependencies</summary>
        <p>
          {t.basis.dependencies.allocations.length} retained allocations;{" "}
          {t.basis.dependencies.children.length} return/custody records;{" "}
          {t.basis.dependencies.facts.length} current native facts.
        </p>
        {t.basis.dependencies.allocations.map((a) => (
          <p key={a.id}>
            Allocation {a.id}, version {a.version}: {a.quantity} {a.unit},{" "}
            {a.basis}; Supply {a.supply_id}
          </p>
        ))}
        {t.basis.dependencies.children.map((c) => (
          <p key={c.id}>
            {c.kind} {c.id}, version {c.version}: {c.quantity} {c.unit}
          </p>
        ))}
        {t.basis.dependencies.supplies.map((s) => (
          <p key={s.id}>
            Supply {s.id}, version {s.version}: {s.quantity} {s.unit}; current
            evidence:{" "}
            {s.facts.map((f) => `${f.kind}: ${f.evidence}`).join("; ") ||
              "None"}
            .
          </p>
        ))}
        {t.basis.dependencies.facts.map((f) => (
          <p key={f.id}>
            {f.kind} {f.id}, version {f.version}: {f.evidence}
          </p>
        ))}
      </details>
      {t.revision_holds.length > 0 && (
        <ul>
          {t.revision_holds.map((h) => (
            <li key={h}>{h}</li>
          ))}
        </ul>
      )}
      {stale && (
        <div role="status">
          <p>
            Disposition evidence changed. Your proposal is retained; compare
            this target before a replacement decision.
          </p>
          <Button disabled={blocked} onClick={() => setBasis(capture(t))}>
            Use compared disposition evidence
          </Button>
        </div>
      )}
      <fieldset disabled={blocked || stale}>
        <legend>Attributable disposition evidence</legend>
        <Field
          name="disposition-reason"
          label="Disposition reason"
          value={reason}
          onChange={setReason}
          maxLength={1000}
        />
        <Field
          name="disposition-evidence"
          label="Disposition evidence"
          value={evidence}
          onChange={setEvidence}
          maxLength={4000}
        />
        <SelectField
          name="disposition-ack"
          label="Synthetic disposition acknowledgement"
          value={ack}
          onChange={setAck}
          options={[
            { id: "", display_name: "Choose explicitly" },
            {
              id: "yes",
              display_name: "Synthetic only; no commercial or work authority",
            },
          ]}
        />
        <SelectField
          name="disposition-decision"
          label="Disposition decision"
          value={decision}
          onChange={setDecision}
          options={[
            { id: "Retain", display_name: "Retain reviewed demand" },
            {
              id: "ReviseQuantity",
              display_name: "Revise eligible Forecast quantity",
            },
            { id: "Hold", display_name: "Continue hold with owned follow-up" },
          ]}
        />
        {decision === "ReviseQuantity" && (
          <Field
            name="disposition-quantity"
            label={`Proposed positive quantity (${r.unit})`}
            value={quantity}
            onChange={setQuantity}
          />
        )}
        <Field
          name="disposition-owner"
          label="Disposition follow-up owner UUID"
          value={owner}
          onChange={setOwner}
        />
        <Field
          name="disposition-due"
          label="Disposition follow-up due date"
          value={due}
          onChange={setDue}
          type="date"
        />
        <Field
          name="disposition-next"
          label="Disposition follow-up action"
          value={next}
          onChange={setNext}
          maxLength={1000}
        />
        <Button
          disabled={
            t.status === "Unchanged" ||
            (decision === "ReviseQuantity" && t.revision_holds.length > 0)
          }
          onClick={() =>
            void send("disposition-review", {
              ...body,
              predecessor_id: basis.review,
              basis_hash: basis.hash,
              decision,
              quantity: decision === "ReviseQuantity" ? quantity : null,
              owner_id: owner,
              due_date: due,
              next_action: next,
            })
          }
        >
          {t.review
            ? "Record replacement disposition review"
            : "Record disposition review"}
        </Button>
        {t.review && (
          <>
            <p>
              Reviewed {t.review.decision} by {t.review.created_by} at{" "}
              {String(t.review.created_at)}.{" "}
              {t.review.command
                ? `Exact proposed quantity: ${t.review.command.quantity} ${t.review.command.unit}.`
                : "No target mutation proposed."}
            </p>
            <p>
              {t.review.reason} · {t.review.evidence}
            </p>
            <p>
              Follow-up {t.review.owner_id} · {t.review.due_date} ·{" "}
              {t.review.next_action}
            </p>
            <ul>
              {t.review_holds.map((h) => (
                <li key={h}>{h}</li>
              ))}
            </ul>
            <Button
              disabled={!t.can_apply}
              onClick={() =>
                void send("disposition-apply", {
                  ...body,
                  review_id: basis.review,
                  review_hash: basis.review_hash,
                })
              }
            >
              Apply reviewed disposition
            </Button>
          </>
        )}
      </fieldset>
      <p>
        Retention resolves only the reviewed exception. Quantity revision
        preserves native histories and creates the existing owned Supply impact.
        Authority, signing, validity/expiry and withdrawal remain Not
        configured. No cancellation, replacement conversion, procurement or work
        release is authorised.
      </p>
      <details>
        <summary>Immutable disposition history</summary>
        {t.events.map((e) => (
          <article key={e.id}>
            <h4>
              {e.sequence}. {e.action} · {e.decision}
            </h4>
            <p>
              {e.id} · actor {e.created_by} · {String(e.created_at)}
            </p>
            <p>
              {e.reason} · {e.evidence}
            </p>
            <p>
              Preceding review {e.predecessor_id ?? "None"}; applied review{" "}
              {e.review_id ?? "None"}; target version{" "}
              {e.effect_version ?? e.basis.target.version}; exact quantity{" "}
              {e.command?.quantity ?? e.basis.target.quantity}{" "}
              {e.basis.target.unit}.
            </p>
            <p>
              Owner {e.owner_id} · due {e.due_date} · {e.next_action}
            </p>
            <p>
              Original operation {e.operation_id}; native operation{" "}
              {e.command?.operation_id ?? "No native mutation"}
            </p>
          </article>
        ))}
      </details>
    </>
  );
}
