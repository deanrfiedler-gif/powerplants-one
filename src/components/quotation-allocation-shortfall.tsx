"use client";
import { useEffect, useState, type ComponentProps } from "react";
import { Field, SelectField, Status } from "./business-ui";
import { Button } from "./ui/button";
import type { ReceiptCorrection } from "./quotation-receipt-correction";

export function AllocationShortfall({
  t,
  actor,
  disabled,
  blocked,
  common,
  send,
  onDirty,
}: ComponentProps<typeof ReceiptCorrection>) {
  const state = t.allocation_shortfall;
  const [selected, setSelected] = useState(
    state.candidates[0]?.correction.id ?? "",
  );
  const [amounts, setAmounts] = useState<Record<string, string>>({});
  const [decisions, setDecisions] = useState<Record<string, string>>({});
  const [dirty, setDirty] = useState(false);
  useEffect(() => onDirty(dirty), [dirty, onDirty]);
  const candidate = state.candidates.find((c) => c.correction.id === selected);
  const original =
    candidate &&
    t.receipt_correction.events.find(
      (e) => e.id === candidate.correction.receipt_proposal_id,
    );
  const applied =
    state.proposal &&
    t.events.find(
      (e) =>
        e.action === "Apply" && e.allocation_proposal_id === state.proposal!.id,
    );
  const owned =
    t.can_write &&
    t.referral?.owner_id === actor &&
    t.receiving?.decision === "Accepted";
  return (
    <section aria-label="Shared Supply allocation shortfall">
      <h3>Resolve shared Shipment allocation shortfall</h3>
      <p>
        Review a complete permitted reduction proposal. Each changed Demand
        owner must decide separately, even if they accepted the Receipt
        correction. A valid capacity position leaves unmet Demand and
        independent operational holds visible.
      </p>
      {!state.candidates.length && !state.proposal && (
        <p>
          No current shortfall from an applied Receipt correction is available.
        </p>
      )}
      {state.candidates.length > 0 && (
        <>
          <SelectField
            name="shortfall-correction"
            label="Applied Receipt correction"
            value={selected}
            disabled={blocked}
            options={state.candidates.map((c) => ({
              id: c.correction.id,
              display_name: `${c.group.supply.reference}: ${c.shortfall} ${c.group.supply.unit} shortfall`,
            }))}
            onChange={setSelected}
          />
          {candidate && (
            <>
              <p>
                Correction outcome {candidate.correction.id}; review{" "}
                {candidate.correction.review_id}; native receipt{" "}
                {candidate.correction.native_receipt?.receipt_id}. Current
                usable capacity {candidate.group.usable}{" "}
                {candidate.group.supply.unit}; allocated{" "}
                {candidate.group.usable_allocated}; shortfall{" "}
                {candidate.shortfall}.
              </p>
              <details>
                <summary>
                  Original Receipt, corrected evidence and exact shared position
                </summary>
                <p>
                  Supply {candidate.group.supply.id}, version{" "}
                  {candidate.group.supply.version}; company{" "}
                  {candidate.group.supply.company_id}; item{" "}
                  {candidate.group.supply.item}; unit{" "}
                  {candidate.group.supply.unit}; provenance{" "}
                  {candidate.group.supply.source_reference}; entity keys{" "}
                  {JSON.stringify(candidate.group.supply.external_key)}.
                </p>
                <p>
                  Original Receipt evidence:{" "}
                  {JSON.stringify(
                    original?.dependencies.group.facts.filter(
                      (f) => f.kind === "Receipt",
                    ) ?? [],
                  )}
                </p>
                <p>
                  Corrected current Receipt evidence:{" "}
                  {JSON.stringify(
                    candidate.group.facts.filter((f) => f.kind === "Receipt"),
                  )}
                </p>
                <p>
                  Receipt receiving decisions:{" "}
                  {candidate.correction.effect_receiving_ids.join(", ")}. These
                  decisions provide no allocation consent.
                </p>
                {candidate.group.demands.map((d) => (
                  <section key={d.record.id}>
                    <h4>{d.record.reference}</h4>
                    <p>
                      Demand {d.record.id}; owner {d.record.owner_id}; version{" "}
                      {d.record.version}; quantity {d.record.quantity}{" "}
                      {d.record.unit}; class {d.record.data.demand_class};
                      source {d.record.source_reference}; entity keys{" "}
                      {JSON.stringify(d.record.external_key)}.
                    </p>
                    <p>
                      Facts and holds: {JSON.stringify(d.facts)}. Children:{" "}
                      {JSON.stringify(d.children)}.
                    </p>
                  </section>
                ))}
              </details>
              {owned && (
                <fieldset disabled={disabled}>
                  <legend>Exact proposed allocation reductions</legend>
                  <p>
                    Leave a quantity blank to preserve it. Enter the exact new
                    quantity to reduce it, including zero. The server checks the
                    complete final position before saving the proposal.
                  </p>
                  {candidate.group.allocations.map((a) => (
                    <div key={a.id}>
                      <p>
                        Allocation {a.id}, version {a.version}; Demand{" "}
                        {a.demand_id}; current {a.quantity} {a.unit}, {a.basis}.
                      </p>
                      {a.basis === "Usable" && (
                        <Field
                          name={`shortfall-quantity-${a.id}`}
                          label={`New quantity for allocation ${a.id}`}
                          value={amounts[a.id] ?? ""}
                          onChange={(v) => {
                            setAmounts({ ...amounts, [a.id]: v });
                            setDirty(true);
                          }}
                        />
                      )}
                    </div>
                  ))}
                  <Button
                    disabled={
                      !candidate.group.allocations.some((a) =>
                        (amounts[a.id] ?? "").trim(),
                      )
                    }
                    onClick={() =>
                      void send("shortfall-propose", {
                        ...common,
                        referral_id: t.referral!.id,
                        receiving_id: t.receiving!.id,
                        predecessor_id: state.proposal?.id ?? null,
                        correction_id: candidate.correction.id,
                        reductions: candidate.group.allocations
                          .filter((a) => (amounts[a.id] ?? "").trim())
                          .map((a) => ({
                            allocation_id: a.id,
                            quantity: amounts[a.id].trim(),
                          })),
                      })
                    }
                  >
                    Propose exact allocation reductions
                  </Button>
                </fieldset>
              )}
            </>
          )}
        </>
      )}
      {state.proposal && (
        <>
          <h4>
            {applied
              ? "Completed allocation proposal and retained receiving"
              : "Independently receive the allocation proposal"}
          </h4>
          <p>
            Proposal {state.proposal.id}; predecessor{" "}
            {state.proposal.predecessor_id ?? "None"}; correction outcome{" "}
            {state.proposal.dependencies.correction.id}; operation{" "}
            {state.proposal.command.operation_id};{" "}
            {"changes" in state.proposal.command
              ? "atomic native multi-allocation reduction"
              : "existing native single-allocation adjustment"}
            .
          </p>
          <p>
            Reason: {state.proposal.reason}. Evidence: {state.proposal.evidence}
            . Proposed by {state.proposal.created_by} at{" "}
            {String(state.proposal.created_at)}.
          </p>
          <p>
            Reviewed capacity {state.effects?.usable}; allocated{" "}
            {state.effects?.before_allocated} → {state.effects?.allocated};
            resulting shortfall {state.effects?.shortfall}.{" "}
            {state.effects?.effect}
          </p>
          <ul>
            {state.effects?.allocations.map((a) => (
              <li key={a.id}>
                {a.id}: {a.before} → {a.after} {a.unit} (
                {a.changed ? "reduced" : "preserved"}); Demand {a.demand_id}.
              </li>
            ))}
          </ul>
          <ul>
            {state.effects?.demands.map((d) => (
              <li key={d.record.id}>
                {d.record.reference}: Demand {d.record.quantity} {d.record.unit}
                , resulting Usable allocation {d.allocated}, unmet {d.unmet},
                picked lower bound {d.picked}; owner {d.record.owner_id};{" "}
                {d.changed
                  ? "independent decision required; version and Requested Impact will change"
                  : "record and allocation preserved"}
                . Readiness evidence: {JSON.stringify(d.readiness)}.
              </li>
            ))}
          </ul>
          {!applied &&
            state.holds.map((h) => (
              <p key={h} role="status">
                Held: {h}
              </p>
            ))}
          {state.required.map((r) => (
            <section
              key={r.demand.id}
              aria-label={`Allocation receiving ${r.demand.reference}`}
            >
              <p>
                {r.demand.reference}:{" "}
                <Status value={r.decision?.decision ?? "Not received"} /> ·
                owner {r.demand.owner_id}; decision {r.decision?.id ?? "None"};
                predecessor {r.decision?.predecessor_id ?? "None"}; actor{" "}
                {r.decision?.created_by ?? "None"};{" "}
                {String(r.decision?.created_at ?? "")}. {r.decision?.reason} ·{" "}
                {r.decision?.evidence}
              </p>
              {!applied && (
                <>
                  {r.holds.map((h) => (
                    <p key={h}>{h}</p>
                  ))}
                  {r.can_receive && (
                    <fieldset disabled={disabled || state.holds.length > 0}>
                      <SelectField
                        name={`shortfall-receiving-${r.demand.id}`}
                        label={`Allocation receiving decision for ${r.demand.reference}`}
                        value={decisions[r.demand.id] ?? "Accepted"}
                        options={["Accepted", "Returned", "Held"].map((v) => ({
                          id: v,
                          display_name: v,
                        }))}
                        onChange={(v) => {
                          setDecisions({ ...decisions, [r.demand.id]: v });
                          setDirty(true);
                        }}
                      />
                      <Button
                        onClick={() =>
                          void send("shortfall-receive", {
                            ...common,
                            referral_id: t.referral!.id,
                            proposal_id: state.proposal!.id,
                            proposal_hash: state.proposal!.proposal_hash,
                            predecessor_id: r.decision?.id ?? null,
                            demand_id: r.demand.id,
                            decision: decisions[r.demand.id] ?? "Accepted",
                          })
                        }
                      >
                        Record allocation decision for {r.demand.reference}
                      </Button>
                    </fieldset>
                  )}
                </>
              )}
            </section>
          ))}
          {owned && !applied && (
            <Button
              disabled={
                disabled ||
                state.holds.length > 0 ||
                state.required.some((r) => r.holds.length > 0)
              }
              onClick={() =>
                void send("supply-review", {
                  ...common,
                  referral_id: t.referral!.id,
                  receiving_id: t.receiving!.id,
                  predecessor_id: t.review?.id ?? null,
                  decision: "ReduceAllocations",
                  allocation_id: null,
                  quantity: null,
                  allocation_proposal_id: state.proposal!.id,
                })
              }
            >
              Review independently received reductions
            </Button>
          )}
          {applied && (
            <p>
              Native outcome {applied.id}; original receipt{" "}
              {applied.native_receipt?.receipt_id}. Re-evaluate readiness and
              explicitly review any current ES-07 exception. Unmet Demand and
              Requested Impacts remain separately owned.
            </p>
          )}
        </>
      )}
      <details>
        <summary>Retained allocation proposals and receiving lineage</summary>
        {state.events.map((e) => (
          <p key={e.id}>
            {e.action} {e.id}; predecessor {e.predecessor_id ?? "None"};
            proposal {e.proposal_id}; Demand{" "}
            {e.demand_id ?? "Complete shared position"}; {e.decision}; actor{" "}
            {e.created_by}; {String(e.created_at)}; {e.reason} · {e.evidence}.
          </p>
        ))}
      </details>
    </section>
  );
}
