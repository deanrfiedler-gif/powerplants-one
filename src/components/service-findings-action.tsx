"use client";
import { useEffect, useState, type RefObject } from "react";
import {
  api,
  ErrorNotice,
  Field,
  isDenied,
  ReadState,
  SelectField,
  Stamp,
  useCommand,
  useResource,
  ValidationFields,
  type Envelope,
  type Option,
  type Failure,
} from "./business-ui";
import { LocalDateTimeField, useUnsavedChanges } from "./record-ui";
import { Button, ButtonLink } from "./ui/button";
import type { readNextAction } from "../service/findings/next-action";
type Data = Awaited<ReturnType<typeof readNextAction>>;
export function FindingActionEditor({
  data,
  guard,
  onSaved,
  onRevoked,
}: {
  data: Data;
  guard: RefObject<() => boolean>;
  onSaved: () => void;
  onRevoked: () => void;
}) {
  const [editing, setEditing] = useState(!data.item.action && data.can_edit);
  const [current, setCurrent] = useState(data),
    [owner, setOwner] = useState(data.item.action?.owner_id ?? ""),
    [due, setDue] = useState(data.item.action?.due_at ?? ""),
    [instruction, setInstruction] = useState(data.item.action?.summary ?? ""),
    [evidence, setEvidence] = useState(
      data.item.action?.required_evidence ?? "",
    ),
    [reason, setReason] = useState(""),
    [comparison, setComparison] = useState<Data | null>(null),
    [compareError, setCompareError] = useState<unknown>(null),
    [comparing, setComparing] = useState(false);
  const cmd = useCommand(),
    row = current.item,
    path = `service/findings/${row.id}/next-action`;
  const owners = useResource<Envelope<Option>>(
    editing && current.can_edit
      ? `selectors/owners?${new URLSearchParams({ company_id: row.company_id, site_id: row.site.id, purpose: "Activity", access_class: "RestrictedService", ...(row.action ? { activity_id: row.action.id } : {}) })}`
      : null,
  );
  const uncertain = !!(cmd.error as Failure)?.retryable,
    locked = cmd.busy || uncertain || comparing;
  const dirty =
    editing &&
    (owner !== (row.action?.owner_id ?? "") ||
      due !== (row.action?.due_at ?? "") ||
      instruction !== (row.action?.summary ?? "") ||
      evidence !== (row.action?.required_evidence ?? "") ||
      !!reason);
  useUnsavedChanges(dirty, locked);
  useEffect(() => {
    guard.current = () =>
      !locked &&
      (!dirty || window.confirm("Discard unsaved next-action changes?"));
    return () => {
      guard.current = () => true;
    };
  }, [dirty, locked, guard]);
  useEffect(() => {
    if (isDenied(cmd.error) || isDenied(owners.error)) onRevoked();
  }, [cmd.error, owners.error, onRevoked]);
  if (isDenied(cmd.error) || isDenied(owners.error) || isDenied(compareError))
    return <ErrorNotice error={cmd.error || owners.error || compareError} />;
  async function save() {
    const result = await cmd.send(path, {
      source_token: current.source_token,
      expected_version: current.expected_version,
      owner_id: owner,
      due_at: due,
      instruction,
      required_evidence: evidence.trim() ? evidence : null,
      reason,
    });
    if (result) {
      setEditing(false);
      setReason("");
      onSaved();
    } else if (isDenied(cmd.error)) onRevoked();
  }
  async function compare() {
    setComparing(true);
    setCompareError(null);
    try {
      setComparison(await api<Data>(path));
    } catch (e) {
      setCompareError(e);
      if (isDenied(e)) onRevoked();
    } finally {
      setComparing(false);
    }
  }
  if (!editing)
    return (
      <section className="sv07-next-action">
        <h3>Next action</h3>
        {row.action ? (
          <>
            <p>{row.action.summary}</p>
            <p>In My Work · {row.action.id}</p>
            <dl>
              <dt>Owner</dt>
              <dd>{row.action.owner_name}</dd>
              <dt>Due</dt>
              <dd>
                <Stamp value={row.action.due_at} timezone={row.site.timezone} />
              </dd>
              <dt>Instruction</dt>
              <dd>{row.action.summary}</dd>
              <dt>Evidence needed</dt>
              <dd>{row.action.required_evidence ?? "Not specified"}</dd>
            </dl>
          </>
        ) : (
          <p>No next action is set.</p>
        )}
        {current.can_edit ? (
          <Button onClick={() => setEditing(true)}>
            {row.action ? "Change next action" : "Set the next action"}
          </Button>
        ) : (
          <p>
            {current.blocked_reason === "ViewOnly"
              ? "You can read this finding but not change its next action. A coordinator with service access sets it."
              : "The source or activity needs its own disposition before another next action can be saved."}
          </p>
        )}
        {row.action && (
          <ButtonLink href={row.action.href}>Open in My Work</ButtonLink>
        )}
        <p>
          Changing the next action updates the same My Work activity, with its
          changes kept in history. It never closes this finding.
        </p>
      </section>
    );
  return (
    <form
      className="sv07-action-form"
      onSubmit={(e) => {
        e.preventDefault();
        void save();
      }}
    >
      <h3>{row.action ? "Change next action" : "Set the next action"}</h3>
      <ValidationFields error={cmd.error}>
        <ErrorNotice error={cmd.error} />
        <ErrorNotice error={compareError} />
        <fieldset disabled={locked || !current.can_edit}>
          <SelectField
            name="finding-owner"
            validationField="owner_id"
            label="Owner"
            value={owner}
            onChange={setOwner}
            options={owners.data?.items ?? []}
            required
          />
          <LocalDateTimeField
            name="finding-due"
            validationField="due_at"
            label="Due"
            value={due}
            onChange={setDue}
            timezone={row.site.timezone}
          />
          <Field
            name="finding-instruction"
            validationField="instruction"
            label="Instruction"
            value={instruction}
            onChange={setInstruction}
            multiline
            maxLength={2000}
            required
          />
          <Field
            name="finding-evidence"
            validationField="required_evidence"
            label="Evidence needed"
            value={evidence}
            onChange={setEvidence}
            multiline
            maxLength={4000}
          />
          <Field
            name="finding-reason"
            validationField="reason"
            label="Reason for change"
            value={reason}
            onChange={setReason}
            multiline
            maxLength={2000}
            required
          />
        </fieldset>
        <ReadState
          loading={owners.loading}
          error={owners.error}
          retry={owners.reload}
        />
        <p>
          Saving creates or changes one owned My Work activity. It changes
          nothing on the source record. Only the source's own review closes this
          finding.
        </p>
        {uncertain && (
          <p role="status">
            Save outcome unconfirmed. Retry the unchanged action to recover its
            original receipt before changing anything.
          </p>
        )}
        {comparison && (
          <section className="sv07-notice">
            <h4>Current server next action</h4>
            <p>
              {comparison.item.action?.owner_name ?? "Unassigned"} ·{" "}
              {comparison.item.action?.summary ?? "Not set"}
            </p>
            <p>
              <Stamp
                value={comparison.item.action?.due_at}
                timezone={row.site.timezone}
              />
            </p>
            <p>
              {comparison.item.action?.required_evidence ??
                "Evidence not specified"}
            </p>
            <Button
              disabled={!comparison.can_edit}
              onClick={() => {
                setCurrent(comparison);
                setComparison(null);
                cmd.clear();
              }}
            >
              Use current version with my entries
            </Button>
            {!comparison.can_edit && (
              <p>
                Source disposition or access no longer permits editing. Open the
                source record.
              </p>
            )}
          </section>
        )}
        {(cmd.error as Failure)?.status === 409 && (
          <Button disabled={locked} onClick={() => void compare()}>
            Compare current next action
          </Button>
        )}
        <div className="sv07-form-actions">
          <Button
            type="submit"
            variant="primary"
            busy={cmd.busy}
            disabled={
              !current.can_edit ||
              comparing ||
              (!uncertain && (owners.loading || !!owners.error))
            }
          >
            {uncertain ? "Retry unchanged save" : "Save next action"}
          </Button>
          <Button
            disabled={locked}
            onClick={() => {
              if (
                !dirty ||
                window.confirm("Discard unsaved next-action changes?")
              ) {
                setEditing(false);
                setOwner(row.action?.owner_id ?? "");
                setDue(row.action?.due_at ?? "");
                setInstruction(row.action?.summary ?? "");
                setEvidence(row.action?.required_evidence ?? "");
                setReason("");
                setComparison(null);
                setCompareError(null);
                cmd.clear();
              }
            }}
          >
            Cancel
          </Button>
        </div>
      </ValidationFields>
    </form>
  );
}
