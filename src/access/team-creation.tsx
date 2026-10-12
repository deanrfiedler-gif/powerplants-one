"use client";
import { useEffect, useState } from "react";
import { Button } from "../components/ui/button";
import {
  api,
  ErrorNotice,
  Field,
  type Failure,
  isDenied,
  ReadState,
  SelectField,
  ValidationFields,
  useResource,
} from "../components/business-ui";
import { useUnsavedChanges } from "../components/record-ui";
import { useRecoverableCommand } from "../shared/ui/use-recoverable-command";
import type { JournalEntry } from "../shared/lib/command-journal";

type Context = {
  actor: { actor_id: string; workspace_id: string };
  can_create: boolean;
  people: { id: string; display_name: string }[];
};
const base = "admin/access/teams";
const target = "/admin/access/roles#saved-local-teams";
const accepts = (entry: JournalEntry) =>
  entry.path === base &&
  entry.target === target &&
  (entry.phase === "accepted" ||
    (entry.body.team_id === entry.record_id &&
      entry.body.expected_version === 0));
const transport = <T,>(path: string, body?: unknown) =>
  api<T>(path.startsWith("operations/") ? `${base}/${path}` : path, body);
const hidden = (error: unknown) =>
  (error as Failure)?.code !== "LocalOnly" &&
  (isDenied(error) || (error as Failure)?.code === "WorkingCompanySelected");

export function LocalTeamCreation({
  onDenied,
  onInspect,
}: {
  onDenied: (error: unknown) => void;
  onInspect: (id: string) => void;
}) {
  const context = useResource<Context>(`${base}/context`);
  useEffect(() => {
    if (hidden(context.error)) onDenied(context.error);
  }, [context.error, onDenied]);
  return (
    <section aria-label="Record a local team">
      <ReadState
        loading={context.loading}
        error={context.error}
        retry={context.reload}
      />
      {context.data &&
        !context.loading &&
        !context.error &&
        (context.data.can_create ? (
          <TeamForm
            key={`${context.data.actor.workspace_id}:${context.data.actor.actor_id}`}
            context={context.data}
            onDenied={onDenied}
            onInspect={onInspect}
            refresh={context.reload}
          />
        ) : (
          <p>
            Your current duty permits team inspection. Recording a team requires
            Workspace team-creation authority.
          </p>
        ))}
    </section>
  );
}

function TeamForm({
  context,
  onDenied,
  onInspect,
  refresh,
}: {
  context: Context;
  onDenied: (error: unknown) => void;
  onInspect: (id: string) => void;
  refresh: () => void;
}) {
  const command = useRecoverableCommand({
    key: `ppo-access-team:${context.actor.workspace_id}:${context.actor.actor_id}:create`,
    scope: context.actor,
    accepts,
    transport,
    acceptsReceipt: (entry, receipt) =>
      receipt.record_id === entry.record_id &&
      receipt.record_version === 1 &&
      receipt.state === "Recorded",
  });
  const [name, setName] = useState(""),
    [purpose, setPurpose] = useState(""),
    [reason, setReason] = useState(""),
    [lead, setLead] = useState(""),
    [member, setMember] = useState(""),
    [members, setMembers] = useState<string[]>([]),
    [afterReceipt, setAfterReceipt] = useState<string | null>(null);
  const blocked = command.busy || !!command.pending || !command.ready;
  const another =
    !!command.accepted &&
    afterReceipt === command.accepted.receipt.operation_id;
  const formVisible = !command.accepted || another;
  const dirty =
    formVisible &&
    !!(name || purpose || reason || lead || member || members.length);
  useUnsavedChanges(
    dirty && !command.pending,
    command.busy || !!command.pending,
  );
  useEffect(() => {
    if (hidden(command.error)) onDenied(command.error);
  }, [command.error, onDenied]);
  const choices = context.people.map((p) => ({
    ...p,
    display_name: `${p.display_name} · ${p.id}`,
  }));
  const reset = () => {
    setName("");
    setPurpose("");
    setReason("");
    setLead("");
    setMember("");
    setMembers([]);
  };
  if (hidden(command.error))
    return <ReadState loading={false} error={command.error} retry={refresh} />;
  return (
    <>
      <h3>Record a local team</h3>
      <p>
        Choose a lead and 1–20 people explicitly. The initial roster cannot be
        edited. Neither membership nor the lead label grants access or review
        authority.
      </p>
      <ErrorNotice error={command.error} />
      {command.pending && (
        <div className="callout" role="status">
          <p>
            The original team creation is awaiting confirmation. Its exact
            submitted values are retained in this tab.
          </p>
          <p className="narrative">
            Team ID: {command.pending.record_id}
            <br />
            Operation ID: {command.pending.body.operation_id}
          </p>
          <Button
            disabled={command.busy}
            onClick={() => void command.recover()}
          >
            Check original result
          </Button>{" "}
          <Button disabled={command.busy} onClick={() => void command.retry()}>
            Retry unchanged action
          </Button>
        </div>
      )}
      {command.accepted && (
        <div role="status">
          <p>Local team recorded. No grants changed.</p>
          <p className="narrative">
            Team ID: {command.accepted.receipt.record_id}
            <br />
            Operation ID: {command.accepted.receipt.operation_id}
          </p>
          <Button
            onClick={() => onInspect(command.accepted!.receipt.record_id)}
          >
            Inspect saved team
          </Button>{" "}
          {!another && (
            <Button
              onClick={() => {
                reset();
                setAfterReceipt(command.accepted!.receipt.operation_id);
              }}
            >
              Record another team
            </Button>
          )}
        </div>
      )}
      {formVisible && (
        <ValidationFields error={command.error}>
          <form
            onSubmit={async (event) => {
              event.preventDefault();
              if (blocked) return;
              const id = crypto.randomUUID();
              const receipt = await command.send(
                base,
                {
                  team_id: id,
                  expected_version: 0,
                  name,
                  purpose,
                  reason,
                  lead_id: lead,
                  member_ids: members,
                },
                target,
                "Local team",
                id,
              );
              if (receipt) {
                reset();
                setAfterReceipt(null);
              }
            }}
          >
            <fieldset disabled={blocked}>
              <legend>Immutable initial roster</legend>
              <Field
                name="name"
                label="Team name"
                value={name}
                onChange={setName}
                maxLength={100}
                required
              />
              <Field
                name="purpose"
                label="Team purpose"
                value={purpose}
                onChange={setPurpose}
                maxLength={1000}
                required
                multiline
                hint="10–1000 characters."
              />
              <SelectField
                name="lead_id"
                label="Team lead"
                value={lead}
                onChange={setLead}
                options={choices}
                required
              />
              <p className="narrative">
                Selected lead ID: {lead || "None selected"}
              </p>
              <SelectField
                name="member_ids"
                label="Person to add to initial roster"
                value={member}
                onChange={setMember}
                options={choices.filter((p) => !members.includes(p.id))}
                disabled={members.length >= 20}
              />
              <Button
                type="button"
                disabled={!member || members.length >= 20}
                onClick={() => {
                  setMembers([...members, member]);
                  setMember("");
                }}
              >
                Add selected person
              </Button>
              <p>
                {members.length} of 20 people selected. The lead is included
                only if you add them.
              </p>
              <ul aria-label="Selected initial roster">
                {members.map((id) => (
                  <li key={id} className="narrative">
                    {choices.find((p) => p.id === id)?.display_name}{" "}
                    <Button
                      type="button"
                      variant="quiet"
                      aria-label={`Remove ${context.people.find((p) => p.id === id)?.display_name} ${id}`}
                      onClick={() =>
                        setMembers(members.filter((v) => v !== id))
                      }
                    >
                      Remove
                    </Button>
                  </li>
                ))}
              </ul>
              <Field
                name="reason"
                label="Team creation reason"
                value={reason}
                onChange={setReason}
                maxLength={1000}
                required
                multiline
                hint="10–1000 characters retained in creation history."
              />
              <div className="actions">
                <Button type="submit">Record team</Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    if (
                      !dirty ||
                      window.confirm(
                        "Discard this unsubmitted team draft and refresh available people?",
                      )
                    )
                      refresh();
                  }}
                >
                  Refresh available people
                </Button>
              </div>
            </fieldset>
          </form>
        </ValidationFields>
      )}
    </>
  );
}
