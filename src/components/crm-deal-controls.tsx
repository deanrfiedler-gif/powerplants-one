"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ProductIcon } from "./product-icons";
import {
  ErrorNotice,
  Field,
  SelectField,
  Stamp,
  ValidationFields,
  type Envelope,
  type Option,
} from "./business-ui";
import { denied, useCrmCommand, useCrmResource } from "./crm-state";
import { LookupField } from "./record-ui";
import type { readOpportunity } from "../crm/reads";
import type { OperationReceipt } from "../platform/operations";

export type DealRecord = Awaited<ReturnType<typeof readOpportunity>>;
export type DealMode = "snapshot" | "information" | "scope" | "stage";
export type StageUndo = {
  id: string;
  version: number;
  stage_id: string;
  qualification_note: string | null;
  identification_activity_id: string | null;
};
// Qualified is the one transition whose evidence the server requires:
// parseDealStage rejects it without a qualification outcome. Anything that
// issues a stage command without opening this dialog must ask here first.
export const stageRequiresEvidence = (stage: string) => stage === "Qualified";
const scopeLabels = {
  inclusions: "Inclusions",
  exclusions: "Exclusions",
  assumptions: "Assumptions",
  constraints: "Constraints",
  acceptance: "Acceptance requirements",
  timing: "Required timing",
  delivery: "Delivery arrangements",
};
export function dealAmount(value: string | null | undefined) {
  return value == null
    ? "Not estimated"
    : new Intl.NumberFormat("en-AU", {
        style: "currency",
        currency: "AUD",
      }).format(Number(value));
}
export function dealClose(value: string | null | undefined) {
  return value
    ? new Intl.DateTimeFormat("en-AU", {
        day: "numeric",
        month: "short",
        year: "numeric",
        timeZone: "UTC",
      }).format(new Date(value + "T00:00:00Z"))
    : "Close date not set";
}
export function useDesktopCRM() {
  const [wide, setWide] = useState(false);
  useEffect(() => {
    const m = matchMedia("(min-width: 781px)");
    const update = () => setWide(m.matches);
    update();
    m.addEventListener("change", update);
    return () => m.removeEventListener("change", update);
  }, []);
  return wide;
}

export function DealDialog({
  id,
  mode = "snapshot",
  targetStage,
  undo,
  onClose,
  onSaved,
}: {
  id: string;
  mode?: DealMode;
  targetStage?: string;
  undo?: StageUndo;
  onClose: () => void;
  onSaved: (
    receipt: OperationReceipt,
    previous: DealRecord,
    stage: boolean,
  ) => void;
}) {
  const ref = useRef<HTMLDialogElement>(null),
    [currentMode, setMode] = useState(mode),
    [dirty, setDirty] = useState(false),
    [pending, setPending] = useState(false);
  const resource = useCrmResource<Envelope<DealRecord>>(
      `crm/opportunities/${id}`,
    ),
    o = resource.data?.items[0];
  const close = () => {
    if (pending) return;
    if (dirty && !window.confirm("Discard these unsaved changes?")) return;
    onClose();
  };
  useEffect(() => {
    const d = ref.current,
      previous = document.activeElement as HTMLElement | null;
    d?.showModal();
    return () => {
      d?.close();
      previous?.focus({ preventScroll: true });
    };
  }, []);
  const accepted = (
    receipt: OperationReceipt,
    old: DealRecord,
    stage: boolean,
  ) => {
    setDirty(false);
    setPending(false);
    onSaved(receipt, old, stage);
  };
  return (
    <dialog
      ref={ref}
      className={`crm-deal-dialog mode-${currentMode}`}
      aria-labelledby="crm-dialog-title"
      onCancel={(e) => {
        e.preventDefault();
        close();
      }}
    >
      <header className="crm-dialog-head">
        <h2 id="crm-dialog-title">
          {currentMode === "snapshot"
            ? (o?.title ?? "Deal snapshot")
            : currentMode === "information"
              ? "Edit deal"
              : currentMode === "scope"
                ? "Edit requirements and scope"
                : "Change deal stage"}
        </h2>
        <button
          type="button"
          className="secondary icon-button"
          onClick={close}
          disabled={pending}
          aria-label="Close deal dialog"
        >
          <ProductIcon name="close" />
        </button>
      </header>
      <div className="crm-dialog-scroll">
        <ErrorNotice error={resource.error} />
        {!!resource.error && o && !denied(resource.error) && (
          <p role="status">
            Your entries are retained. Refresh the saved deal before saving
            changes.
          </p>
        )}
        {resource.loading && <p role="status">Loading deal…</p>}
        {!!resource.error && (
          <button onClick={resource.reload}>Try loading again</button>
        )}
        {o &&
          !denied(resource.error) &&
          (currentMode === "snapshot" ? (
            <>
              <p className="crm-snapshot-caption">
                {o.display_number}
                <span>
                  {o.stage_id} · {o.close_outcome}
                </span>
              </p>
              <div className="crm-snapshot-grid">
                <section>
                  <h3>Deal summary</h3>
                  <dl className="crm-facts">
                    <dt>Organisation</dt>
                    <dd>
                      <Link href={`/customers/${o.organisation_id}`}>
                        {o.organisation_name}
                      </Link>
                    </dd>
                    <dt>Customer contact</dt>
                    <dd>
                      {o.primary_person_id ? (
                        <Link href={`/people/${o.primary_person_id}`}>
                          {o.contact_name}
                        </Link>
                      ) : (
                        "Not yet identified"
                      )}
                    </dd>
                    <dt>Value · AUD, excl. GST</dt>
                    <dd>{dealAmount(o.value_amount)}</dd>
                    <dt>Expected close</dt>
                    <dd>{dealClose(o.expected_close_date)}</dd>
                    <dt>Deal owner</dt>
                    <dd>{o.owner_name}</dd>
                    <dt>Site</dt>
                    <dd>{o.site_name ?? o.site_unknown_reason}</dd>
                  </dl>
                  <button
                    className="secondary"
                    disabled={!o.can_edit || !!resource.error}
                    onClick={() => setMode("stage")}
                  >
                    Change stage · {o.stage_id}
                  </button>
                </section>
                <section>
                  <h3>Next activity</h3>
                  <div
                    className={`crm-snapshot-activity state-${o.next_action_state}`}
                  >
                    <strong>
                      {o.next_activity?.summary ?? "Plan the next step"}
                    </strong>
                    <p>
                      {o.next_activity?.due_needed ? (
                        "Due date needed"
                      ) : o.next_activity?.due_at ? (
                        <Stamp value={o.next_activity.due_at} />
                      ) : (
                        "No due date"
                      )}
                    </p>
                    <p>
                      Activity owner:{" "}
                      {o.next_activity?.owner_name ?? "Not assigned"}
                    </p>
                    {o.next_activity && (
                      <Link href={`/work/${o.next_activity.id}`}>
                        Open activity
                      </Link>
                    )}
                  </div>
                  <h3>Work context</h3>
                  <p className="crm-snapshot-context">{o.need_summary}</p>
                </section>
              </div>
            </>
          ) : (
            <DealEditor
              key={currentMode}
              o={o}
              mode={currentMode}
              targetStage={targetStage}
              undo={undo}
              onDirty={() => setDirty(true)}
              onPending={setPending}
              onCancel={close}
              onAccepted={accepted}
              reload={resource.reload}
              readFailed={!!resource.error}
            />
          ))}
      </div>
      {currentMode === "snapshot" && (
        <footer className="crm-dialog-footer">
          <button className="secondary" onClick={close}>
            Close
          </button>
          {o && !resource.error && (
            <Link className="primary-link" href={`/crm/opportunities/${o.id}`}>
              Open full deal
            </Link>
          )}
        </footer>
      )}
    </dialog>
  );
}
function DealEditor({
  o,
  mode,
  targetStage,
  undo,
  onDirty,
  onPending,
  onCancel,
  onAccepted,
  reload,
  readFailed,
}: {
  o: DealRecord;
  mode: Exclude<DealMode, "snapshot">;
  targetStage?: string;
  undo?: StageUndo;
  onDirty: () => void;
  onPending: (b: boolean) => void;
  onCancel: () => void;
  onAccepted: (r: OperationReceipt, o: DealRecord, stage: boolean) => void;
  reload: () => void;
  readFailed: boolean;
}) {
  const [version, setVersion] = useState(undo?.version ?? o.version),
    [title, setTitle] = useState(o.title),
    [contact, setContact] = useState(o.primary_person_id ?? ""),
    [unknown, setUnknown] = useState(o.contact_unknown_reason ?? ""),
    [value, setValue] = useState(o.value_amount ?? ""),
    [closeDate, setCloseDate] = useState(o.expected_close_date ?? ""),
    [need, setNeed] = useState(o.need_summary),
    [scope, setScope] = useState(o.scope_details ?? {}),
    [stage, setStage] = useState(undo?.stage_id ?? targetStage ?? o.stage_id),
    [note, setNote] = useState(
      undo?.qualification_note ?? o.qualification_note ?? "",
    ),
    [identification, setIdentification] = useState(
      undo?.identification_activity_id ?? o.identification_activity_id ?? "",
    ),
    [search, setSearch] = useState("");
  const command = useCrmCommand(
    (r) => onAccepted(r, o, mode === "stage"),
    "No unsaved changes",
    onPending,
  );
  const persons = useCrmResource<Envelope<Option>>(
    mode === "information"
      ? `crm/options?${new URLSearchParams({ kind: "Person", company_id: o.company_id, organisation_id: o.organisation_id, site_id: o.site_id ?? "", opportunity_id: o.id, q: search, limit: "20" })}`
      : null,
    true,
  );
  const blocked =
    command.busy || command.uncertain || !o.can_edit || readFailed;
  if (denied(command.error) || denied(persons.error))
    return <ErrorNotice error={command.error ?? persons.error} />;
  const send = () => {
    if (mode === "information")
      return command.send(`crm/opportunities/${o.id}/information`, {
        expected_version: version,
        title,
        primary_person_id: contact || null,
        contact_unknown_reason: contact ? null : unknown,
        value_amount: value || null,
        expected_close_date: closeDate || null,
        reason: "Edit deal information",
      });
    if (mode === "scope")
      return command.send(`crm/opportunities/${o.id}/scope`, {
        expected_version: version,
        need_summary: need,
        scope_details: scope,
        reason: "Edit requirements and scope",
      });
    return command.send(`crm/opportunities/${o.id}/stage`, {
      expected_version: version,
      stage_id: stage,
      qualification_note: stageRequiresEvidence(stage) ? note : null,
      identification_activity_id: stageRequiresEvidence(stage)
        ? identification || null
        : null,
      reason: undo ? "Undo the previous stage move" : "Change deal stage",
    });
  };
  return (
    <ValidationFields error={command.error}>
      <form
        noValidate
        onChange={() => {
          onDirty();
          command.dirty();
        }}
        onSubmit={(e) => {
          e.preventDefault();
          void send();
        }}
      >
        <p className="source-stamp">
          {o.title} · Saved version {o.version}
        </p>
        <ErrorNotice error={command.error} />
        <p role="status">{command.status}</p>
        {command.uncertain && (
          <button
            type="button"
            onClick={() => void command.reconcile()}
            disabled={command.busy}
          >
            Confirm original save outcome
          </button>
        )}
        {!!command.error && !command.uncertain && (
          <button type="button" className="secondary" onClick={reload}>
            Load current saved version for comparison
          </button>
        )}
        {version !== o.version && (
          <div className="crm-conflict">
            <p>
              The saved deal is now version {o.version}. Your proposal is
              retained. Saved title: {o.title}; saved stage: {o.stage_id}.
            </p>
            <button
              type="button"
              className="secondary"
              disabled={blocked}
              onClick={() => {
                setVersion(o.version);
                command.clearError();
              }}
            >
              Use current version for deliberate retry
            </button>
          </div>
        )}
        <fieldset disabled={blocked}>
          <legend className="sr-only">
            {mode === "scope"
              ? "Requirements and scope"
              : mode === "stage"
                ? "Deal stage"
                : "Deal information"}
          </legend>
          {mode === "information" && (
            <>
              <Field
                name="title"
                label="Deal title"
                value={title}
                onChange={setTitle}
                required
                maxLength={200}
              />
              <p className="scope-note">
                {o.organisation_name} · {o.site_name ?? "Site to be confirmed"}
                <br />
                Deal owner: {o.owner_name}
              </p>
              <LookupField
                name="primary_person_id"
                label="Customer contact"
                value={contact}
                onChange={(id) => {
                  setContact(id);
                  if (id) setUnknown("");
                }}
                search={search}
                onSearch={setSearch}
                options={[
                  ...(o.primary_person_id &&
                  o.contact_name &&
                  !persons.data?.items.some((p) => p.id === o.primary_person_id)
                    ? [
                        {
                          id: o.primary_person_id,
                          display_name: o.contact_name,
                        },
                      ]
                    : []),
                  ...(persons.data?.items ?? []),
                ]}
                loading={persons.loading}
                more={!!persons.data?.next_cursor}
                error={!!persons.error}
              />
              <ErrorNotice error={persons.error} />
              {!contact && (
                <Field
                  name="contact_unknown_reason"
                  label="Why is the contact unknown?"
                  value={unknown}
                  onChange={setUnknown}
                  required
                  multiline
                  maxLength={1000}
                />
              )}
              <div className="crm-form-pair">
                <Field
                  name="value_amount"
                  label="Deal value · AUD, excl. GST"
                  value={value}
                  onChange={setValue}
                  hint="Leave blank when not estimated."
                />
                <Field
                  name="expected_close_date"
                  label="Expected close date"
                  type="date"
                  value={closeDate}
                  onChange={setCloseDate}
                />
              </div>
            </>
          )}
          {mode === "scope" && (
            <>
              <Field
                name="need_summary"
                label="Customer need and objective"
                value={need}
                onChange={setNeed}
                required
                multiline
                maxLength={2000}
              />
              {Object.entries(scopeLabels).map(([key, label]) => (
                <Field
                  key={key}
                  name={key}
                  label={label}
                  value={scope[key] ?? ""}
                  onChange={(v) =>
                    setScope((old) => ({ ...old, [key]: v || null }))
                  }
                  multiline
                  maxLength={5000}
                />
              ))}
              <p className="scope-note">
                Saved commercial records retain their own scope. Review them
                separately when requirements change.
              </p>
            </>
          )}
          {mode === "stage" && (
            <>
              <SelectField
                name="stage_id"
                label="Deal stage"
                value={stage}
                onChange={setStage}
                options={[
                  { id: "Enquiry", display_name: "Enquiry" },
                  { id: "Qualified", display_name: "Qualified" },
                ]}
              />
              {stageRequiresEvidence(stage) && (
                <>
                  <Field
                    name="qualification_note"
                    label="Qualification outcome"
                    value={note}
                    onChange={setNote}
                    multiline
                    required
                    maxLength={2000}
                  />
                  {!o.primary_person_id && (
                    <SelectField
                      name="identification_activity_id"
                      label="Owned contact-identification action"
                      value={identification}
                      onChange={setIdentification}
                      options={o.actions
                        .filter(
                          (a) =>
                            a.owner_id === o.owner_id &&
                            ["Open", "InProgress"].includes(a.status) &&
                            ["CustomerContact", "RelationshipReview"].includes(
                              a.kind,
                            ),
                        )
                        .map((a) => ({ id: a.id, display_name: a.summary }))}
                    />
                  )}
                </>
              )}
              <p className="scope-note">
                Moving back to Enquiry keeps the previous qualification in
                history. Activities and sales outcome remain unchanged.
              </p>
            </>
          )}
        </fieldset>
        <footer className="crm-dialog-footer">
          <button
            type="button"
            className="secondary"
            disabled={command.busy || command.uncertain}
            onClick={onCancel}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={
              blocked ||
              version !== o.version ||
              (mode === "stage" && stage === o.stage_id)
            }
          >
            {mode === "information"
              ? "Save deal"
              : mode === "scope"
                ? "Save requirements and scope"
                : "Save stage"}
          </button>
        </footer>
      </form>
    </ValidationFields>
  );
}
export function DealInformation({
  o,
  onEdit,
  onStage,
}: {
  o: DealRecord;
  onEdit: () => void;
  onStage: () => void;
}) {
  return (
    <section className="crm-panel">
      <div className="crm-section-heading">
        <h2>Deal information</h2>
        {o.can_edit && (
          <button className="secondary" onClick={onEdit}>
            Edit deal
          </button>
        )}
      </div>
      <dl className="crm-facts crm-facts-grid">
        <dt>Organisation</dt>
        <dd>
          <Link href={`/customers/${o.organisation_id}`}>
            {o.organisation_name}
          </Link>
        </dd>
        <dt>Primary customer contact</dt>
        <dd>
          {o.primary_person_id ? (
            <Link href={`/people/${o.primary_person_id}`}>
              {o.contact_name}
            </Link>
          ) : (
            o.contact_unknown_reason
          )}
        </dd>
        <dt>Deal owner</dt>
        <dd>{o.owner_name}</dd>
        <dt>Stage</dt>
        <dd>
          <button
            className="text-action"
            disabled={!o.can_edit}
            onClick={onStage}
          >
            {o.stage_id}
          </button>
        </dd>
        <dt>Value · AUD, excl. GST</dt>
        <dd>{dealAmount(o.value_amount)}</dd>
        <dt>Expected close</dt>
        <dd>{dealClose(o.expected_close_date)}</dd>
      </dl>
    </section>
  );
}
export function DealScope({
  o,
  onEdit,
}: {
  o: DealRecord;
  onEdit: () => void;
}) {
  return (
    <section className="crm-panel crm-scope-section">
      <div className="crm-section-heading">
        <h2>Requirements and scope</h2>
        {o.can_edit && (
          <button className="secondary" onClick={onEdit}>
            Edit requirements and scope
          </button>
        )}
      </div>
      <h3>Customer need and objective</h3>
      <p className="crm-narrative">{o.need_summary}</p>
      {Object.entries(scopeLabels).map(([key, label]) => (
        <div key={key}>
          <h3>{label}</h3>
          <p className="crm-narrative">
            {o.scope_details?.[key] || "Not recorded"}
          </p>
        </div>
      ))}
    </section>
  );
}
