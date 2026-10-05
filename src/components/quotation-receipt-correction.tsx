"use client";
import { useEffect, useState } from "react";
import { Field, SelectField, Status } from "./business-ui";
import { Button } from "./ui/button";
import { factSpecs, completeness, type Fields } from "../supply/model";
import type { FollowupDetail } from "../estimating/supply-followup/context";
import type { SupplyFollowupAction } from "./quotation-supply-followup";

export function ReceiptCorrection({
  t,
  actor,
  disabled,
  blocked,
  common,
  send,
  onDirty,
}: {
  t: FollowupDetail;
  actor: string;
  disabled: boolean;
  blocked: boolean;
  common: Record<string, unknown>;
  send: (
    action: SupplyFollowupAction,
    body: Record<string, unknown>,
  ) => Promise<void>;
  onDirty: (dirty: boolean) => void;
}) {
  const state = t.receipt_correction;
  const [selected, setSelected] = useState(state.candidates[0]?.fact.id ?? "");
  const candidate = state.candidates.find((x) => x.fact.id === selected);
  const [data, setData] = useState<Fields>(candidate?.fact.data ?? {});
  const [observed, setObserved] = useState(
    candidate ? new Date(candidate.fact.observed_at).toISOString() : "",
  );
  const [complete, setComplete] = useState<string>(
    candidate?.fact.completeness ?? "Complete",
  );
  const [evidence, setEvidence] = useState(candidate?.fact.evidence ?? "");
  const [dirty, setDirty] = useState(false);
  const [decisions, setDecisions] = useState<Record<string, string>>({});
  useEffect(() => onDirty(dirty), [dirty, onDirty]);
  const change = (key: string, value: string) => {
    setData({ ...data, [key]: value || null });
    setDirty(true);
  };
  return (
    <section aria-label="Receipt evidence correction">
      <h3>Correct existing Receipt evidence</h3>
      <p>
        This corrects a recorded observation. It does not reverse a physical
        receipt. Each allocated Demand owner must receive the exact proposed
        effects before review and separate application.
      </p>
      {!state.candidates.length && (
        <p>
          No existing Receipt on linked Supply. Receipt creation belongs to its
          native workflow.
        </p>
      )}
      <details>
        <summary>Original and current receipt evidence</summary>
        {state.candidates.map((x) => (
          <section key={x.fact.id}>
            <h4>{x.supply.title}</h4>
            <p>
              Supply {x.supply.id}, version {x.supply.version}; {x.supply.item},{" "}
              {x.supply.unit}. Company {x.supply.company_id}; source{" "}
              {x.supply.source_reference}; external key{" "}
              {JSON.stringify(x.supply.external_key)}.
            </p>
            <p>
              Current Receipt {x.fact.id}, version {x.fact.version}, predecessor{" "}
              {x.fact.predecessor_id ?? "None"}; {x.fact.completeness}; observed{" "}
              {String(x.fact.observed_at)}. {x.fact.evidence}
            </p>
            <dl>
              {factSpecs.Receipt.fields.map((f) => (
                <div key={f.key}>
                  <dt>{f.label}</dt>
                  <dd>{x.fact.data[f.key] ?? "Not evidenced"}</dd>
                </div>
              ))}
            </dl>
            {x.holds.map((h) => (
              <p key={h} role="note">
                {h}
              </p>
            ))}
          </section>
        ))}
      </details>
      {t.referral?.owner_id === actor &&
        t.receiving?.decision === "Accepted" &&
        !!state.candidates.length && (
          <details>
            <summary>Propose a Receipt correction for receiving</summary>
            <SelectField
              name="receipt-original"
              label="Existing Receipt to correct"
              value={selected}
              disabled={blocked}
              onChange={(id) => {
                const x = state.candidates.find((x) => x.fact.id === id)!;
                if (
                  dirty &&
                  !window.confirm(
                    "Discard the unsaved Receipt proposal and select another fact?",
                  )
                )
                  return;
                setSelected(id);
                setData(x.fact.data);
                setComplete(x.fact.completeness);
                setEvidence(x.fact.evidence);
                setObserved(new Date(x.fact.observed_at).toISOString());
                setDirty(false);
              }}
              options={state.candidates.map((x) => ({
                id: x.fact.id,
                display_name: `${x.supply.reference} · ${x.fact.id} · v${x.fact.version}`,
              }))}
            />
            <fieldset className="release-fields" disabled={blocked}>
              <legend>Corrected Receipt observation</legend>
              {factSpecs.Receipt.fields.map((f) =>
                f.choices ? (
                  <SelectField
                    key={f.key}
                    name={`receipt-${f.key}`}
                    label={`Corrected ${f.label}`}
                    value={data[f.key] ?? ""}
                    onChange={(v) => change(f.key, v)}
                    options={f.choices.map((v) => ({ id: v, display_name: v }))}
                  />
                ) : (
                  <Field
                    key={f.key}
                    name={`receipt-${f.key}`}
                    label={`Corrected ${f.label}`}
                    value={data[f.key] ?? ""}
                    onChange={(v) => change(f.key, v)}
                    required={f.required}
                  />
                ),
              )}
              <SelectField
                name="receipt-completeness"
                label="Corrected Receipt completeness"
                value={complete}
                disabled={blocked}
                onChange={(v) => {
                  setComplete(v);
                  setDirty(true);
                }}
                options={completeness.map((v) => ({ id: v, display_name: v }))}
              />
              <Field
                name="receipt-observed"
                label="Receipt observation time (UTC ISO ending Z)"
                value={observed}
                onChange={(v) => {
                  setObserved(v);
                  setDirty(true);
                }}
                required
              />
              <Field
                name="receipt-evidence"
                label="Corrected Receipt evidence"
                value={evidence}
                onChange={(v) => {
                  setEvidence(v);
                  setDirty(true);
                }}
                required
              />
            </fieldset>
            <p>
              Use exact decimal quantities with at most six places. Usable +
              quarantined ≤ inspected ≤ received; damaged is included in
              quarantine. Short is an observation. Allocations remain unchanged,
              including when usable capacity falls below them.
            </p>
            <Button
              disabled={disabled || !candidate || !!candidate.holds.length}
              onClick={() =>
                void send("receipt-propose", {
                  ...common,
                  referral_id: t.referral!.id,
                  receiving_id: t.receiving!.id,
                  predecessor_id: state.proposal?.id ?? null,
                  dependency_id: selected,
                  data,
                  completeness: complete,
                  observed_at: observed,
                  fact_evidence: evidence,
                })
              }
            >
              Save Receipt correction proposal
            </Button>
          </details>
        )}
      {state.proposal && (
        <>
          <h4>Receipt proposal and affected-demand decisions</h4>
          <p>
            Proposal {state.proposal.id}; original fact{" "}
            {state.proposal.command.predecessor_id}; Supply v
            {state.proposal.command.expected_version}. Proposed usable capacity{" "}
            {state.effects!.usable ?? "Unknown"}; retained usable allocations{" "}
            {state.effects!.allocated}; capacity shortfall{" "}
            {state.effects!.shortfall ?? "Unknown"}{" "}
            {state.dependencies!.group.supply.unit}.{" "}
            {state.effects!.capacity_basis}.
          </p>
          <p>
            {state.effects!.effect} Incomplete evidence:{" "}
            {state.effects!.incomplete ? "Yes — readiness remains held" : "No"}.
          </p>
          <details>
            <summary>Compare exact proposed values</summary>
            <dl>
              {factSpecs.Receipt.fields.map((f) => (
                <div key={f.key}>
                  <dt>{f.label}</dt>
                  <dd>
                    {state.proposal!.dependencies.group.facts.find(
                      (x) => x.id === state.proposal!.command.predecessor_id,
                    )?.data[f.key] ?? "Not evidenced"}{" "}
                    → {state.proposal!.command.data[f.key] ?? "Not evidenced"}
                  </dd>
                </div>
              ))}
            </dl>
          </details>
          {state.holds.map((h) => (
            <p role="note" key={h}>
              {h}
            </p>
          ))}
          {state.required.map((x) => (
            <section
              key={x.demand.id}
              aria-label={`Receiving for ${x.demand.reference}`}
            >
              <h4>Affected Demand {x.demand.reference}</h4>
              <p>
                {x.demand.id} · owner {x.demand.owner_id} · version{" "}
                {x.demand.version} · {x.demand.quantity} {x.demand.unit} ·{" "}
                {x.demand.data.demand_class}.
              </p>
              <Status value={x.decision?.decision ?? "Not received"} />
              {state.dependencies?.group.demands
                .filter((d) => d.record.id === x.demand.id)
                .map((d) => (
                  <p key={d.record.id}>
                    Current readiness: {d.material.readiness.state}; shortage{" "}
                    {d.material.readiness.shortage ?? "Unknown"}. Retained child
                    records {d.children.length}; current evidence{" "}
                    {d.facts.map((f) => f.kind).join(", ") || "None"}.
                  </p>
                ))}
              {x.decision && (
                <p>
                  Decision {x.decision.id}; actor {x.decision.created_by};{" "}
                  {String(x.decision.created_at)}. {x.decision.reason} ·{" "}
                  {x.decision.evidence}
                </p>
              )}
              {x.holds.map((h) => (
                <p key={h}>{h}</p>
              ))}
              {x.demand.owner_id === actor && (
                <>
                  <SelectField
                    name={`effect-${x.demand.id}`}
                    label={`Receiving decision for ${x.demand.reference}`}
                    value={decisions[x.demand.id] ?? "Accepted"}
                    disabled={blocked}
                    onChange={(v) =>
                      setDecisions({ ...decisions, [x.demand.id]: v })
                    }
                    options={[
                      {
                        id: "Accepted",
                        display_name: "Accept exact synthetic effects",
                      },
                      { id: "Returned", display_name: "Return with reasons" },
                      { id: "Held", display_name: "Continue hold" },
                    ]}
                  />
                  <Button
                    disabled={disabled || !!state.holds.length}
                    onClick={() =>
                      void send("receipt-receive", {
                        ...common,
                        referral_id: t.referral!.id,
                        proposal_id: state.proposal!.id,
                        proposal_hash: state.proposal!.proposal_hash,
                        predecessor_id: x.decision?.id ?? null,
                        demand_id: x.demand.id,
                        decision: decisions[x.demand.id] ?? "Accepted",
                      })
                    }
                  >
                    Record receiving for {x.demand.reference}
                  </Button>
                </>
              )}
            </section>
          ))}
        </>
      )}
      <details>
        <summary>Immutable Receipt proposals and receiving history</summary>
        {state.events.map((e) => (
          <section key={e.id}>
            <p>
              {e.action}: {e.decision} · {e.id} · proposal {e.proposal_id} ·
              predecessor {e.predecessor_id ?? "None"} · demand{" "}
              {e.demand_id ?? "Shared Supply"} · actor {e.created_by} ·{" "}
              {String(e.created_at)}.
            </p>
            <p>
              {e.reason} · {e.evidence} · native operation{" "}
              {e.command.operation_id}.
            </p>
          </section>
        ))}
      </details>
    </section>
  );
}
