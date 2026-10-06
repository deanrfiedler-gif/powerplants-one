"use client";
import { useEffect, useState, type ComponentProps } from "react";
import { SelectField, Status } from "./business-ui";
import { Button, ButtonLink } from "./ui/button";
import type { ReceiptCorrection } from "./quotation-receipt-correction";

export function MaterialResolution({
  t,
  actor,
  disabled,
  blocked,
  common,
  send,
  onDirty,
}: ComponentProps<typeof ReceiptCorrection>) {
  const s = t.material_resolution;
  const [selected, setSelected] = useState(s.candidates[0]?.impact.id ?? "");
  const c = s.candidates.find((c) => c.impact.id === selected);
  const [task, setTask] = useState(c?.tasks[0]?.id ?? "");
  const [decisions, setDecisions] = useState<Record<string, string>>({});
  const [review, setReview] = useState("Hold");
  const [dirty, setDirty] = useState(false);
  useEffect(() => onDirty(dirty), [dirty, onDirty]);
  const owned =
    t.can_write &&
    t.referral?.owner_id === actor &&
    t.receiving?.decision === "Accepted";
  const envelope = {
    ...common,
    referral_id: t.referral?.id,
    expected_material_sequence: s.sequence,
  };
  const proposal = s.proposal;
  const d = s.dependencies;
  return (
    <section aria-label="Owned downstream material resolution">
      <h3>Resolve the affected Project forecast</h3>
      <p>
        Withdraw both forecast dates from one unstarted Planned task. Each
        affected owner receives the complete exact proposal separately. Receipt
        and allocation acceptance do not authorise this action.
      </p>
      <p>
        Project dates and the selected Demand version change. The exact Impact
        receives a successor linked to verified Projects evidence.
        MaterialAction remains an Activity with its own lifecycle. Unmet Demand
        and independent holds remain.
      </p>
      {!c && !proposal && (
        <p>
          No affected Project-origin Demand with a current Requested Impact is
          available from a completed allocation reduction. Other downstream
          workflows require their own authorised follow-up.
        </p>
      )}
      {!!s.candidates.length && (
        <details open={!s.applied}>
          <summary>
            {s.applied
              ? "Propose further owned material follow-up"
              : "Select the exact affected Impact and Project task"}
          </summary>
          <SelectField
            name="material-impact"
            label="Affected Demand and Requested Impact"
            value={selected}
            disabled={blocked}
            options={s.candidates.map((x) => ({
              id: x.impact.id,
              display_name: `${x.demand.reference} · Impact ${x.impact.id}`,
            }))}
            onChange={(v) => {
              setSelected(v);
              setTask(
                s.candidates.find((x) => x.impact.id === v)?.tasks[0]?.id ?? "",
              );
              setDirty(true);
            }}
          />
          {c && (
            <>
              <p>
                Applied allocation outcome {c.outcome.id}; review{" "}
                {c.outcome.review_id}; native receipt{" "}
                {c.outcome.native_receipt?.receipt_id}. Project{" "}
                {c.project.title}, version {c.project.version}.
              </p>
              <SelectField
                name="material-task"
                label="Project task whose forecast is affected"
                value={task}
                disabled={blocked}
                options={c.tasks.map((x) => ({
                  id: x.id,
                  display_name: `${x.title} · ${x.status} · ${x.start_date ?? "Unscheduled"} to ${x.finish_date ?? "Unscheduled"}`,
                }))}
                onChange={(v) => {
                  setTask(v);
                  setDirty(true);
                }}
              />
              <Button
                disabled={disabled || !owned || !task}
                onClick={() =>
                  send("material-propose", {
                    ...envelope,
                    allocation_outcome_id: c.outcome.id,
                    demand_id: c.demand.id,
                    impact_id: c.impact.id,
                    task_id: task,
                    predecessor_id: proposal?.id ?? null,
                  })
                }
              >
                Propose exact forecast withdrawal
              </Button>
            </>
          )}
        </details>
      )}
      {proposal && d && (
        <>
          <h4>
            {s.applied
              ? "Current readiness after returned outcome"
              : "Current readiness and proposed effects"}
          </h4>
          <p>
            Demand {d.demand.reference}, version {d.demand.version}: required{" "}
            {d.demand.quantity} {d.demand.unit}; valid usable allocations{" "}
            {d.allocated}; unmet {d.unmet}.{" "}
            <Status value={d.material.readiness.state} />
          </p>
          <p>
            Impact {proposal.impact_id}; MaterialAction {d.activity.id}, version{" "}
            {d.activity.version}, {d.activity.state}. Referral{" "}
            {t.referral?.date_needed ? "Date needed" : t.referral?.due_date}.
          </p>
          <p>
            Selected Impact change: {d.impact.data.change}. Affected scope:{" "}
            {d.impact.data.affected}.
          </p>
          {s.applied?.decision === "WithdrawForecast" && (
            <p>
              Reviewed successor {s.applied.impact_command.id} links only this
              Impact predecessor to the verified Project forecast withdrawal.
            </p>
          )}
          <ul aria-label="Current material assessments and other impacts">
            {d.facts
              .filter(
                (f) =>
                  f.kind === "Assessment" ||
                  (f.kind === "Impact" &&
                    f.id !== proposal.impact_id &&
                    f.predecessor_id !== proposal.impact_id),
              )
              .map((f) => (
                <li key={f.id}>
                  {f.kind} {f.id}:{" "}
                  {f.data.state ?? f.data.readiness ?? "Recorded evidence"} ·{" "}
                  {f.data.change ?? f.evidence}
                </li>
              ))}
          </ul>
          <p>
            Project version {d.project.project.version}; task version{" "}
            {d.project.task.version}; {d.project.task.status},{" "}
            {d.project.task.progress}% complete. Proposed dates: Unscheduled.
            Current dates: {d.project.task.start_date ?? "Unscheduled"} to{" "}
            {d.project.task.finish_date ?? "Unscheduled"}.
          </p>
          <ButtonLink href={`/projects/${d.project.project.id}`}>
            Open owning Project
          </ButtonLink>
          <details>
            <summary>
              Exact source, Receipt, allocation, Impact and downstream evidence
            </summary>
            <pre>
              {JSON.stringify(
                {
                  quotation: proposal.basis.conversion,
                  original_allocation_outcome:
                    proposal.dependencies.allocation_outcome,
                  current: d,
                  project_command: proposal.project_command,
                  impact_command: proposal.impact_command,
                },
                null,
                2,
              )}
            </pre>
          </details>
          {[...s.holds, ...s.native_holds].map((h, i) => (
            <p key={i} role="status">
              Hold: {h}
            </p>
          ))}
          <h4>
            {s.applied
              ? "Completed receiving evidence"
              : "Independent receiving"}
          </h4>
          {s.required.map((r) => (
            <div key={r.role} className="release-panel">
              <p>
                {r.role} · record {r.record_id} · owner{" "}
                {r.owner_id ?? "Unavailable"}.{" "}
                <Status value={r.decision?.decision ?? "Not received"} />
              </p>
              {!s.applied && (
                <>
                  <SelectField
                    name={`material-${r.role}-decision`}
                    label={`${r.role} receiving decision`}
                    value={decisions[r.role] ?? "Held"}
                    disabled={blocked}
                    options={["Accepted", "Returned", "Held"].map((id) => ({
                      id,
                      display_name: id,
                    }))}
                    onChange={(v) => {
                      setDecisions({ ...decisions, [r.role]: v });
                      setDirty(true);
                    }}
                  />
                  <Button
                    disabled={
                      disabled ||
                      !r.can_receive ||
                      !!s.applied ||
                      !!s.holds.length
                    }
                    onClick={() =>
                      send("material-receive", {
                        ...envelope,
                        proposal_id: proposal.id,
                        proposal_hash: proposal.proposal_hash,
                        role: r.role,
                        decision: decisions[r.role] ?? "Held",
                        predecessor_id: r.decision?.id ?? null,
                      })
                    }
                  >
                    Record {r.role} decision
                  </Button>
                </>
              )}
              {r.holds.map((h, i) => (
                <p key={i}>{h}</p>
              ))}
            </div>
          ))}
          {!s.applied && (
            <>
              <SelectField
                name="material-review-decision"
                label="Material resolution review"
                value={review}
                disabled={blocked}
                options={[
                  {
                    id: "WithdrawForecast",
                    display_name: "Withdraw exact Project forecast",
                  },
                  {
                    id: "Retain",
                    display_name:
                      "Retain reviewed evidence; follow-up continues",
                  },
                  {
                    id: "Hold",
                    display_name: "Continuing owning-workflow hold",
                  },
                ]}
                onChange={(v) => {
                  setReview(v);
                  setDirty(true);
                }}
              />
              <Button
                disabled={
                  disabled ||
                  !s.can_write ||
                  !!s.applied ||
                  !!s.holds.length ||
                  (review === "WithdrawForecast" &&
                    (!!s.native_holds.length ||
                      s.required.some((r) => r.holds.length > 0)))
                }
                onClick={() =>
                  send("material-review", {
                    ...envelope,
                    proposal_id: proposal.id,
                    proposal_hash: proposal.proposal_hash,
                    predecessor_id: s.review?.id ?? null,
                    decision: review,
                  })
                }
              >
                Freeze material review
              </Button>
            </>
          )}
          {s.review && (
            <>
              <p>
                Immutable review {s.review.id}: {s.review.decision}. Review
                completion alone changes no operational record.
              </p>
              {s.review_holds.map((h, i) => (
                <p key={i}>Hold: {h}</p>
              ))}
              {!s.applied && (
                <Button
                  disabled={disabled || !s.can_apply}
                  onClick={() =>
                    send("material-apply", {
                      ...envelope,
                      review_id: s.review!.id,
                      review_hash: s.review!.review_hash,
                    })
                  }
                >
                  Apply reviewed material outcome
                </Button>
              )}
            </>
          )}
          {s.applied && (
            <div role="status">
              <h4>Returned material outcome</h4>
              <p>
                {s.applied.decision === "WithdrawForecast"
                  ? "Exact Project forecast withdrawn; scoped follow-up reviewed against native receipts."
                  : "Continuing operational follow-up; no native resolution applied."}{" "}
                Outcome {s.applied.id}. Unmet Demand: {s.applied.after?.unmet}{" "}
                {d.demand.unit}. Reassess current readiness and explicitly
                disposition any current ES-07 exception.
              </p>
              <details>
                <summary>
                  Original operations, receipts and resulting versions
                </summary>
                <pre>{JSON.stringify(s.applied, null, 2)}</pre>
              </details>
            </div>
          )}
          <details>
            <summary>
              Retained material receiving, review and outcome history
            </summary>
            <pre>{JSON.stringify(s.events, null, 2)}</pre>
          </details>
        </>
      )}
      <p>
        Commercial and cross-workflow approval policy: Not configured. This path
        does not authorise work, replenishment or external transactions.
      </p>
    </section>
  );
}
