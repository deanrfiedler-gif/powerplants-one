"use client";
import { useState } from "react";
import { Field, SelectField, ValidationFields } from "../business-ui";
import { CommandStatus, type CsOptions } from "../cs-forms";
import { useCrmCommand } from "../crm-state";
import { Button } from "../ui/button";
import {
  useSurveyFormFocus,
  SurveySection,
  SurveyFacts,
  surveyDate,
  surveyBoundary,
  type SurveyWorkspace,
} from "./survey-ui";
import type { SurveyContent } from "../../shared/cs/model";
export type SurveyAction =
  "review" | "return" | "handover" | "submit" | "revise";
export function SurveyActionForm({
  data,
  options,
  action,
  onSaved,
  onClose,
}: {
  data: SurveyWorkspace;
  options: CsOptions;
  action: SurveyAction;
  onSaved: () => void;
  onClose: () => void;
}) {
  const [base] = useState(() => ({
    record: data.record,
    snapshot: data.snapshots.find(
      (s) => s.kind === "Submission" && s.revision === data.record.revision,
    ),
  }));
  const [decision, setDecision] = useState(
      action === "return" ? "return" : "review",
    ),
    [note, setNote] = useState(""),
    [destination, setDestination] = useState("Estimating"),
    [owner, setOwner] = useState("");
  const formRef = useSurveyFormFocus();
  const command = useCrmCommand(
    () => {
      onSaved();
      onClose();
    },
    "Unsaved",
    undefined,
    true,
    ["view"],
  );
  const reviewing = action === "review" || action === "return";
  const content = (base.snapshot?.basis.content ??
    base.record.content) as SurveyContent;
  const gaps = content.observations.filter(
    (o) => o.significant && ["Unknown", "Assumption"].includes(o.kind),
  );
  const canAct =
    data.can_edit && (!reviewing || data.survey?.independent_reviewer);
  const title = reviewing
    ? "Review submission"
    : action === "handover"
      ? "Record reviewed handover"
      : action === "submit"
        ? "Submit for review"
        : "Start successor draft";
  return (
    <form
      ref={formRef}
      className="srv-form"
      onChange={command.dirty}
      onSubmit={(e) => {
        e.preventDefault();
        if (!canAct) return;
        void command.send("cs/Survey/" + base.record.id + "/actions", {
          expected_version: base.record.version,
          action: reviewing ? decision : action,
          snapshot_id: base.snapshot?.id ?? null,
          reason: note,
          ...(action === "handover"
            ? { destination, receiving_owner_id: owner }
            : {}),
        });
      }}
    >
      <SurveySection title={title}>
        <SurveyFacts
          items={[
            [
              reviewing || action === "handover" ? "Exact snapshot" : "Draft",
              base.record.display_number +
                " · revision " +
                base.record.revision,
            ],
            [
              "Prepared by",
              data.survey?.people.find((p) => p.id === base.record.owner_id)
                ?.display_name ?? "Not recorded",
            ],
            [
              "Recorded by",
              data.survey?.people.find(
                (p) => p.id === content.visit?.recorder_id,
              )?.display_name ?? "Not recorded",
            ],
            [
              "Contents",
              content.observations.length +
                " observations · " +
                data.photos.length +
                " original photos",
            ],
            [
              "Known gaps",
              gaps.length + " significant Unknowns or Assumptions",
            ],
          ]}
        />
        {data.survey?.sources.some((s) => s.changed) && (
          <p className="srv-notice">
            A source changed since submission. You may review this retained
            submission as it stands, or return it for clarification. The
            submitted snapshot stays unchanged.
          </p>
        )}
        <ValidationFields error={command.error}>
          <fieldset disabled={command.busy || command.uncertain}>
            {reviewing && (
              <div
                className="srv-kind-chips"
                role="group"
                aria-label="Review decision"
              >
                <Button
                  aria-pressed={decision === "review"}
                  onClick={() => {
                    setDecision("review");
                    command.dirty();
                  }}
                >
                  Mark reviewed
                </Button>
                <Button
                  aria-pressed={decision === "return"}
                  onClick={() => {
                    setDecision("return");
                    command.dirty();
                  }}
                >
                  Return with clarification
                </Button>
              </div>
            )}
            {action === "handover" && (
              <>
                <div
                  className="srv-kind-chips"
                  role="group"
                  aria-label="Receiving workflow"
                >
                  {["Estimating", "Engineering"].map((v) => (
                    <Button
                      key={v}
                      aria-pressed={destination === v}
                      onClick={() => {
                        setDestination(v);
                        setOwner("");
                        command.dirty();
                      }}
                    >
                      {v}
                    </Button>
                  ))}
                </div>
                <SelectField
                  name="receiving_owner_id"
                  label="Accountable receiving owner"
                  value={owner}
                  onChange={setOwner}
                  options={
                    destination === "Estimating"
                      ? options.owners.estimating
                      : options.owners.engineering
                  }
                  required
                />
              </>
            )}
            <Field
              name="reason"
              label={
                reviewing
                  ? decision === "return"
                    ? "Clarification required"
                    : "Review note"
                  : action === "handover"
                    ? "Handover reason"
                    : "Reason"
              }
              value={note}
              onChange={setNote}
              required
              multiline
              maxLength={2000}
            />
            <p className="srv-note">
              {reviewing
                ? decision === "review"
                  ? "Marking reviewed keeps exactly this revision and records the open follow-ups as acknowledged known gaps."
                  : "Returning keeps this submission and records what must be clarified in a successor draft."
                : action === "handover"
                  ? "The receiving owner decides whether to adopt this exact reviewed source. Nothing is sent and no estimate or engineering basis is changed."
                  : action === "revise"
                    ? "The reviewed or returned revision and its evidence remain retained. The successor opens as a new draft revision."
                    : "Submission locks this revision until an independent reviewer records a decision."}
            </p>
            <p className="srv-note">{surveyBoundary}</p>
            <footer className="srv-form-actions">
              <Button
                onClick={() => {
                  if (
                    !command.hasUnsavedChanges ||
                    window.confirm("Discard this unsaved decision?")
                  ) {
                    command.discard();
                    onClose();
                  }
                }}
              >
                Cancel
              </Button>
              <Button type="submit" variant="primary" disabled={!canAct}>
                {reviewing
                  ? decision === "return"
                    ? "Return with clarification"
                    : "Mark reviewed"
                  : title}
              </Button>
            </footer>
          </fieldset>
        </ValidationFields>
        {!canAct && (
          <p role="status">
            {data.can_edit
              ? "The owner, recorder and submitter cannot review this submission. An independent permitted editor is required."
              : "You have view access to this survey."}
          </p>
        )}
        <CommandStatus command={command} />
      </SurveySection>
    </form>
  );
}
export function SurveyDecisions({ data }: { data: SurveyWorkspace }) {
  return (
    <SurveySection title="Decisions on this survey">
      {data.events.length ? (
        data.events.map((e) => (
          <article className="srv-decision" key={e.id}>
            <strong>
              {e.kind === "Handover"
                ? "Handover recorded to " + e.details.destination
                : e.kind}
            </strong>
            <p>
              {surveyDate(e.recorded_at, data.survey?.site.timezone, true)} ·{" "}
              {data.survey?.people.find((p) => p.id === e.recorded_by)
                ?.display_name ?? "Recorded user"}
            </p>
            <p>{e.details.reason}</p>
            {e.details.acknowledged_gaps?.length > 0 && (
              <p>
                {e.details.acknowledged_gaps.length} open follow-ups
                acknowledged as known gaps.
              </p>
            )}
            {e.details.receiving_decision && (
              <p>{e.details.receiving_decision}</p>
            )}
          </article>
        ))
      ) : (
        <p>No review or handover has been recorded.</p>
      )}
    </SurveySection>
  );
}
