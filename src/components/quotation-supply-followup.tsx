"use client";
import "./quotation-release.css";
import { useEffect, useState } from "react";
import { Field, SelectField, Status, ErrorNotice } from "./business-ui";
import { Button, ButtonLink } from "./ui/button";
import { useUnsavedChanges } from "./record-ui";
import { useCrmResource } from "./crm-state";
import type { FollowupDetail } from "../estimating/supply-followup/context";
import type { receivingWorklist } from "../estimating/supply-followup/reads";
export type SupplyFollowupAction =
  "supply-refer" | "supply-receive" | "supply-review" | "supply-apply";
const capture = (t: FollowupDetail) => ({
  hash: t.basis_hash,
  sequence: t.sequence,
  referral: t.referral?.id ?? null,
  receiving: t.receiving?.id ?? null,
  review: t.review?.id ?? null,
});
export function SupplyFollowupQueue() {
  const resource = useCrmResource<
    Awaited<ReturnType<typeof receivingWorklist>>
  >("supply/conversion-followups", true);
  return (
    <section className="quotation-release">
      <div className="release-panel">
        <h2>My quotation Supply referrals</h2>
        <p>
          Accept ownership for review, return evidence or record a continuing
          hold. This is synthetic coordination only.
        </p>
        <ErrorNotice error={resource.error} />
        {resource.loading && <p role="status">Loading permitted referrals…</p>}
        {resource.data && (
          <>
            {!resource.data.rows.length && (
              <p>No permitted referrals assigned to you.</p>
            )}
            <ul>
              {resource.data.rows.map((r) => (
                <li key={r.referral_id}>
                  <ButtonLink
                    href={`/estimating/quotes/${r.revision_id}/conversion#supply-followup`}
                  >
                    {r.title}
                  </ButtonLink>{" "}
                  · {r.status} · {r.date_needed ? "Date needed" : r.due_date} ·{" "}
                  {r.next_action}
                </li>
              ))}
            </ul>
          </>
        )}
        <Button onClick={resource.reload}>Refresh my referrals</Button>
      </div>
    </section>
  );
}
export function QuotationSupplyFollowups({
  targets,
  actor,
  blocked,
  send,
}: {
  targets: FollowupDetail[];
  actor: string;
  blocked: boolean;
  send: (
    action: SupplyFollowupAction,
    body: Record<string, unknown>,
  ) => Promise<void>;
}) {
  const [selected, setSelected] = useState(targets[0]?.target_id ?? ""),
    [dirty, setDirty] = useState(false);
  const t = targets.find((x) => x.target_id === selected) ?? targets[0];
  if (!t) return null;
  return (
    <section className="release-panel" id="supply-followup">
      <h2>6. Owned Supply follow-up</h2>
      <p>
        Refer an exact held exception to a permitted Supply owner. Acceptance is
        for review only. It grants no commercial approval, procurement
        authority, supplier agreement or authority to begin work.
      </p>
      <ButtonLink href="/supply/changes">
        Open my Supply receiving worklist
      </ButtonLink>
      <SelectField
        name="supply-target"
        label="Supply follow-up target"
        value={t.target_id}
        disabled={blocked}
        options={targets.map((x) => ({
          id: x.target_id,
          display_name: x.basis.conversion.target.title,
        }))}
        onChange={(id) => {
          if (
            !dirty ||
            window.confirm(
              "Discard this unsaved Supply proposal and switch target?",
            )
          )
            setSelected(id);
        }}
      />
      <FollowupTarget
        key={t.target_id}
        t={t}
        actor={actor}
        blocked={blocked}
        send={send}
        onDirty={setDirty}
      />
    </section>
  );
}
function FollowupTarget({
  t,
  actor,
  blocked,
  send,
  onDirty,
}: {
  t: FollowupDetail;
  actor: string;
  blocked: boolean;
  send: (
    action: SupplyFollowupAction,
    body: Record<string, unknown>,
  ) => Promise<void>;
  onDirty: (v: boolean) => void;
}) {
  const [basis, setBasis] = useState(capture(t)),
    [owner, setOwner] = useState(actor),
    [due, setDue] = useState(""),
    [dateNeeded, setDateNeeded] = useState("yes"),
    [next, setNext] = useState(""),
    [reason, setReason] = useState(""),
    [evidence, setEvidence] = useState(""),
    [ack, setAck] = useState(""),
    [receiving, setReceiving] = useState("Accepted"),
    [decision, setDecision] = useState("Retain"),
    [allocation, setAllocation] = useState(
      t.basis.conversion.dependencies.allocations[0]?.id ?? "",
    ),
    [amount, setAmount] = useState(""),
    [dependency, setDependency] = useState(
      t.reservation_dependencies.find((x) => !x.holds.length)?.fact.id ?? "",
    ),
    [outcome, setOutcome] = useState(""),
    [observedAt, setObservedAt] = useState(""),
    [lookup, setLookup] = useState("");
  const dirty = !!(
    reason ||
    evidence ||
    next ||
    due ||
    ack ||
    amount ||
    outcome ||
    observedAt ||
    lookup ||
    owner !== actor ||
    decision !== "Retain" ||
    receiving !== "Accepted"
  );
  useEffect(() => onDirty(dirty), [dirty, onDirty]);
  useUnsavedChanges(dirty && !blocked, false);
  const stale = JSON.stringify(basis) !== JSON.stringify(capture(t)),
    r = t.basis.conversion.target,
    own = t.referral?.owner_id === actor;
  const disabled =
    blocked ||
    stale ||
    !t.can_write ||
    ack !== "yes" ||
    !reason.trim() ||
    !evidence.trim();
  const common = {
    target_id: t.target_id,
    execution_id: t.execution_id,
    expected_sequence: basis.sequence,
    basis_hash: basis.hash,
    reason,
    evidence,
    synthetic_only: ack === "yes",
  };
  return (
    <>
      <Status value={t.status} />
      <p>
        Original conversion demand:{" "}
        {t.basis.conversion.original_target.quantity} {r.unit}. Current{" "}
        {r.quantity} {r.unit}, version {r.version}, {r.data.demand_class}.
        Company {r.company_id}; entity{" "}
        {r.external_key?.entity ?? "SupplyDemand"}; key{" "}
        {r.external_key?.key ?? r.id}.
      </p>
      <p>
        Quotation source exception: issue {t.basis.conversion.source.issue_id};
        response {t.basis.conversion.source.response_id}; receiving{" "}
        {t.basis.conversion.source.receiving_id}. Native Supply changes retain
        their own versions and impacts below.
      </p>
      <details>
        <summary>
          Current allocations, shared supply and affected demands
        </summary>
        {!t.basis.position.length && <p>No linked allocations.</p>}
        {t.basis.position.map((g) => (
          <section key={g.supply.id}>
            <h3>{g.supply.title}</h3>
            <p>
              Supply {g.supply.id} · version {g.supply.version} · company{" "}
              {g.supply.company_id} · entity{" "}
              {g.supply.external_key?.entity ?? "Native Supply"} ·{" "}
              {g.supply.quantity} {g.supply.unit} incoming;{" "}
              {g.usable ?? "Unknown"} usable. Allocated: {g.incoming_allocated}{" "}
              incoming / {g.usable_allocated} usable.
            </p>
            <ul>
              {g.allocations.map((a) => (
                <li key={a.id}>
                  Allocation {a.id}, version {a.version}: {a.quantity} {a.unit},{" "}
                  {a.basis}; demand {a.demand_id}.
                </li>
              ))}
            </ul>
            {g.demands.map((d) => (
              <div key={d.record.id}>
                <p>
                  {d.record.id === t.target_id
                    ? "Original converted demand"
                    : "Other demand sharing this supply"}
                  : {d.record.title} · {d.record.id} · version{" "}
                  {d.record.version} · {d.record.quantity} {d.record.unit} ·{" "}
                  {d.record.data.demand_class}.
                </p>
                <ul>
                  {d.facts.map((f) => (
                    <li key={f.id}>
                      {f.kind} · {f.id} · version {f.version} · {f.evidence}
                    </li>
                  ))}
                  {d.children.map((c) => (
                    <li key={c.record.id}>
                      {c.record.kind} dependency {c.record.id}, version{" "}
                      {c.record.version}, {c.record.quantity} {c.record.unit}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
            <ul>
              {g.facts.map((f) => (
                <li key={f.id}>
                  Supply {f.kind} · {f.id} · version {f.version} · {f.evidence}
                </li>
              ))}
            </ul>
          </section>
        ))}
      </details>
      <details open={t.reservation_dependencies.length > 0}>
        <summary>Native reservation outcome dependencies</summary>
        <p>
          Reconcile an original Unknown reservation outcome from complete lookup
          evidence. This records an observation; it does not execute, release or
          reverse a reservation. Missing receipts are inconclusive.
        </p>
        {!t.reservation_dependencies.length && (
          <p>
            No supported reservation outcome dependency. Other purchasing,
            receipt, fulfilment, custody and return evidence stays with its
            owning workflow.
          </p>
        )}
        {t.reservation_dependencies.map(({ fact, holds }) => (
          <div key={fact.id}>
            <p>
              Fact {fact.id} · version {fact.version} · predecessor{" "}
              {fact.predecessor_id ?? "None"} · original source operation{" "}
              {fact.data.source_operation} · {fact.data.effect}:{" "}
              {fact.data.state} · {fact.completeness} · observed{" "}
              {fact.observed_at}.
            </p>
            <p>
              {fact.evidence} · lookup: {fact.data.lookup_evidence}
            </p>
            <ul>
              {holds.map((h) => (
                <li key={h}>{h}</li>
              ))}
            </ul>
          </div>
        ))}
        <p>
          Native action preserves demand quantity/class, all allocations and
          other demands. Remaining operational holds require separate owning
          decisions.
        </p>
      </details>
      {!!t.adjustment_holds.length && (
        <div role="note">
          <strong>Allocation action holds</strong>
          <ul>
            {t.adjustment_holds.map((h) => (
              <li key={h}>{h}</li>
            ))}
          </ul>
        </div>
      )}
      {t.referral && (
        <p>
          Referral {t.referral.id} · owner {t.referral.owner_id} ·{" "}
          {t.referral.date_needed
            ? "Date needed"
            : `Due ${t.referral.due_date}`}{" "}
          · {t.referral.next_action}. Shared Activity {t.referral.activity_id};
          completion does not resolve this exception.
        </p>
      )}
      {t.outcome && (
        <div role="note">
          <h3>Returned Supply evidence</h3>
          <p>
            {t.outcome.decision} · outcome {t.outcome.id} · reviewed decision{" "}
            {t.outcome.review_id ?? "Receiving decision"} · actor{" "}
            {t.outcome.created_by} · {String(t.outcome.created_at)}.
          </p>
          <p>
            {t.outcome.evidence} ·{" "}
            {t.outcome_current
              ? "Returned position matches current evidence."
              : "Evidence has changed since this outcome; reassess explicitly."}
          </p>
          {t.outcome.native_receipt && (
            <p>
              Actual native Supply receipt {t.outcome.native_receipt.receipt_id}{" "}
              · operation {t.outcome.native_receipt.operation_id} · resulting
              demand version {t.outcome.native_receipt.record_version}.
            </p>
          )}
          <p>
            Return to section 5 for a new exact disposition review and separate
            application. An Approved target remains held for demand quantity
            revision. Separate Supply impacts remain owned.
          </p>
          <ButtonLink href="#completed-dispositions">
            Reassess completed-conversion disposition
          </ButtonLink>
        </div>
      )}
      {stale && (
        <p role="alert">
          Saved Supply evidence changed. Your proposal is retained. Compare the
          current position before using it.
        </p>
      )}
      <Button onClick={() => setBasis(capture(t))} disabled={blocked}>
        Use current Supply evidence
      </Button>
      <div className="release-fields">
        <Field
          name="supply-reason"
          label="Supply follow-up reason"
          value={reason}
          onChange={setReason}
          required
        />
        <Field
          name="supply-evidence"
          label="Supply follow-up evidence"
          value={evidence}
          onChange={setEvidence}
          required
        />
        <SelectField
          name="supply-ack"
          label="Supply synthetic boundary"
          value={ack}
          onChange={setAck}
          options={[
            {
              id: "yes",
              display_name:
                "Synthetic review only; no commercial or work authority",
            },
          ]}
        />
      </div>
      <details open={!t.referral}>
        <summary>Refer, correct or reassign owned follow-up</summary>
        <p>
          A replacement requires an explicit returned/held acknowledgement or
          applied outcome from the current referral.
        </p>
        <Field
          name="supply-owner"
          label="Receiving Supply owner ID"
          value={owner}
          onChange={setOwner}
          required
        />
        <SelectField
          name="supply-date-needed"
          label="Supply due-date state"
          value={dateNeeded}
          onChange={setDateNeeded}
          options={[
            { id: "yes", display_name: "Date needed" },
            { id: "no", display_name: "Known due date" },
          ]}
        />
        {dateNeeded === "no" && (
          <Field
            name="supply-due"
            label="Supply due date"
            type="date"
            value={due}
            onChange={setDue}
          />
        )}
        <Field
          name="supply-next"
          label="Proposed Supply follow-up"
          value={next}
          onChange={setNext}
          required
        />
        <Button
          disabled={disabled || !t.can_refer || !next.trim()}
          onClick={() =>
            void send("supply-refer", {
              ...common,
              predecessor_id: basis.referral,
              owner_id: owner,
              due_date: dateNeeded === "yes" ? null : due,
              date_needed: dateNeeded === "yes",
              next_action: next,
            })
          }
        >
          Refer to Supply owner
        </Button>
      </details>
      {t.referral && (
        <>
          <h3>Supply receiving decision</h3>
          <p>
            {own
              ? "You are the named receiving owner."
              : "Only the currently permitted receiving owner can acknowledge, review or apply."}
          </p>
          <SelectField
            name="supply-receive"
            label="Supply receiving decision"
            value={receiving}
            onChange={setReceiving}
            options={[
              { id: "Accepted", display_name: "Accept for review" },
              { id: "Returned", display_name: "Return with reasons" },
              { id: "Held", display_name: "Continue receiving hold" },
            ]}
          />
          <Button
            disabled={disabled || !own}
            onClick={() =>
              void send("supply-receive", {
                ...common,
                referral_id: basis.referral,
                predecessor_id: basis.receiving,
                decision: receiving,
              })
            }
          >
            Record Supply receiving decision
          </Button>
          <h3>Review the native Supply position</h3>
          <SelectField
            name="supply-decision"
            label="Supply position decision"
            value={decision}
            onChange={setDecision}
            options={[
              { id: "Retain", display_name: "Retain current position" },
              { id: "Hold", display_name: "Continue hold" },
              {
                id: "AdjustAllocation",
                display_name: "Adjust existing allocation quantity",
              },
              {
                id: "ReconcileReservationOutcome",
                display_name: "Reconcile unknown reservation outcome",
              },
            ]}
          />
          {decision === "AdjustAllocation" && (
            <>
              <SelectField
                name="supply-allocation"
                label="Existing allocation"
                value={allocation}
                onChange={setAllocation}
                options={t.basis.conversion.dependencies.allocations.map(
                  (a) => ({
                    id: a.id,
                    display_name: `${a.basis}: ${a.quantity} ${a.unit} · ${a.id} · v${a.version}`,
                  }),
                )}
              />
              <Field
                name="supply-quantity"
                label="Proposed allocation quantity"
                value={amount}
                onChange={setAmount}
              />
              <p>
                Use an exact decimal with at most six places. Zero retains the
                native allocation at zero; it does not release an ERP
                reservation or cancel a supplier commitment.
              </p>
            </>
          )}
          {decision === "ReconcileReservationOutcome" && (
            <>
              <SelectField
                name="supply-dependency"
                label="Original reservation outcome"
                value={dependency}
                onChange={setDependency}
                options={t.reservation_dependencies.map((x) => ({
                  id: x.fact.id,
                  display_name: `${x.fact.data.source_operation} · ${x.fact.data.state} · ${x.fact.id}`,
                }))}
              />
              <SelectField
                name="supply-outcome-state"
                label="Evidenced reservation outcome"
                value={outcome}
                onChange={setOutcome}
                options={[
                  {
                    id: "Confirmed",
                    display_name: "Confirmed by original-operation evidence",
                  },
                  {
                    id: "Failed",
                    display_name:
                      "Failed according to original-operation evidence",
                  },
                  {
                    id: "Absent",
                    display_name: "Absent according to complete source lookup",
                  },
                ]}
              />
              <Field
                name="supply-observed-at"
                label="Outcome observation time (UTC ISO ending Z)"
                value={observedAt}
                onChange={setObservedAt}
                required
              />
              <Field
                name="supply-lookup"
                label="Complete original-operation lookup evidence"
                value={lookup}
                onChange={setLookup}
                required
              />
              <p>
                The source operation and Reservation effect remain exact. Do not
                infer Absent from an unavailable PPO receipt. Other dependencies
                continue to hold allocation adjustment.
              </p>
            </>
          )}
          <Button
            disabled={
              disabled ||
              !own ||
              (decision === "ReconcileReservationOutcome" &&
                (!outcome ||
                  !observedAt.trim() ||
                  !lookup.trim() ||
                  !t.reservation_dependencies.some(
                    (x) => x.fact.id === dependency && !x.holds.length,
                  ))) ||
              t.receiving?.decision !== "Accepted" ||
              (decision === "AdjustAllocation" && !!t.adjustment_holds.length)
            }
            onClick={() =>
              void send("supply-review", {
                ...common,
                referral_id: basis.referral,
                receiving_id: basis.receiving,
                predecessor_id: basis.review,
                decision,
                allocation_id:
                  decision === "AdjustAllocation" ? allocation : null,
                quantity: decision === "AdjustAllocation" ? amount : null,
                ...(decision === "ReconcileReservationOutcome"
                  ? {
                      dependency_id: dependency,
                      outcome_state: outcome,
                      observed_at: observedAt,
                      lookup_evidence: lookup,
                    }
                  : {}),
              })
            }
          >
            Record Supply position review
          </Button>
          {t.review && (
            <>
              <p>
                Exact review {t.review.id}: {t.review.decision}
                {t.review.command &&
                  "record_id" in t.review.command &&
                  `: original ${t.review.command.predecessor_id}; source operation ${t.review.command.data.source_operation}; ${t.review.command.data.state}; observed ${t.review.command.observed_at}; lookup ${t.review.command.data.lookup_evidence}; demand version ${t.review.command.expected_version}`}
                {t.review.command &&
                  "supply_id" in t.review.command &&
                  ` to ${t.review.command.quantity} ${t.review.command.unit}, allocation version ${t.review.command.expected_version}, demand version ${t.review.command.demand_version}, supply version ${t.review.command.supply_version}`}
                .
              </p>
              <ul>
                {t.review_holds.map((h) => (
                  <li key={h}>{h}</li>
                ))}
              </ul>
              <Button
                disabled={disabled || !own || !t.can_apply}
                onClick={() =>
                  void send("supply-apply", {
                    ...common,
                    referral_id: basis.referral,
                    review_id: basis.review,
                    review_hash: t.review!.review_hash,
                  })
                }
              >
                Apply exact Supply review
              </Button>
            </>
          )}
        </>
      )}
      <details>
        <summary>Immutable Supply follow-up history</summary>
        {t.events.map((e) => (
          <details key={e.id}>
            <summary>
              {e.sequence}. {e.action}: {e.decision}
            </summary>
            <p>
              {e.id} · actor {e.created_by} · {String(e.created_at)} · owner{" "}
              {e.owner_id} · original operation {e.operation_id}.
            </p>
            <p>
              {e.reason} · {e.evidence}
            </p>
            <p>
              Referral {e.referral_id} · predecessor{" "}
              {e.predecessor_id ?? "None"} · acceptance{" "}
              {e.receiving_id ?? "None"} · review {e.review_id ?? "None"} ·
              execution {e.execution_id} · source line{" "}
              {e.basis.conversion.line_id}.
            </p>
            {e.command && "record_id" in e.command && (
              <p>
                Native Supply:Fact:ExternalOutcome {e.command.operation_id},
                successor fact {e.command.id}, original fact{" "}
                {e.command.predecessor_id}, original source operation{" "}
                {e.command.data.source_operation}: {e.command.data.state};
                complete lookup {e.command.data.lookup_evidence}; original
                native receipt {e.native_receipt?.receipt_id ?? "Not executed"}.
              </p>
            )}
            {e.command && "supply_id" in e.command && (
              <p>
                Native Supply:Allocate {e.command.operation_id}, allocation{" "}
                {e.command.id}, {e.command.quantity} {e.command.unit}; original
                native receipt {e.native_receipt?.receipt_id ?? "Not executed"}.
              </p>
            )}
          </details>
        ))}
      </details>
    </>
  );
}
