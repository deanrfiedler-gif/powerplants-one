"use client";
import { useEffect, useRef, useState } from "react";
import {
  api,
  ErrorNotice,
  Field,
  SelectField,
  ValidationFields,
  type Failure,
} from "./business-ui";
import { Button } from "./ui/button";
import { WorklistPanel } from "./crm-worklist-tools";
import { useUnsavedChanges } from "./record-ui";
import type {
  OutputActionContext,
  OutputDetail,
} from "../outputs/presentation";

export type OutputIntent = {
  action:
    | "RequestIssue"
    | "RecoverIssue"
    | "WithdrawPack"
    | "PrepareDistribution"
    | "RecordDistribution"
    | "ReconcileDistribution";
  fields: Record<string, unknown>;
  label: string;
  target: string;
};
type Pending = {
  intent: OutputIntent;
  envelope: { kind: string; action: string; command: Record<string, unknown> };
};
type CommandResult = {
  state?: string;
  availability?: string;
  record_id?: string;
};
export function OutputCommand({
  detail,
  context,
  intent,
  onIntent,
  onSaved,
}: {
  detail: OutputDetail;
  context: OutputActionContext;
  intent: OutputIntent | null;
  onIntent: (intent: OutputIntent | null) => void;
  onSaved: (message: string) => void;
}) {
  const storageKey = `ppo.output.command:${context.workspace_id}:${context.actor_id}:${detail.output.kind}:${detail.output.id}`;
  const [pending, setPending] = useState<Pending | null>(null),
    [journalBlocked, setJournalBlocked] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState<unknown>(null),
    [reason, setReason] = useState(""),
    [evidence, setEvidence] = useState(""),
    [outcome, setOutcome] = useState("");
  const inFlight = useRef(false),
    recovered = useRef(false);
  useEffect(() => {
    let live = true;
    void Promise.resolve().then(() => {
      if (!live) return;
      try {
        const text = sessionStorage.getItem(storageKey);
        if (text) {
          const value = JSON.parse(text) as Pending;
          if (
            value.envelope.kind === detail.output.kind &&
            value.intent.action === value.envelope.action
          ) {
            setPending(value);
            onIntent(value.intent);
            recovered.current = true;
          } else throw new Error("Mismatched command journal");
        }
      } catch {
        setJournalBlocked(true);
        setError({
          message:
            "The retained recovery command could not be read. Check the native record before starting another action.",
        });
      }
    });
    return () => {
      live = false;
    };
    // The command owner is mounted for one authorised output identity.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey]);
  const release = useUnsavedChanges(
    !!intent && (!!reason || !!evidence || !!outcome),
    busy || !!pending,
  );
  const close = () => {
    if (busy || pending) return;
    onIntent(null);
    setReason("");
    setEvidence("");
    setOutcome("");
    setError(null);
  };
  const accepted = (result: CommandResult) => {
    sessionStorage.removeItem(storageKey);
    setPending(null);
    recovered.current = false;
    release();
    onIntent(null);
    setReason("");
    setEvidence("");
    setOutcome("");
    setError(null);
    onSaved(
      result.availability
        ? `Original preparation: ${result.state}. Exact output: ${result.availability}.`
        : `Native action confirmed${result.state ? `: ${result.state}` : ""}. Refreshing saved facts.`,
    );
  };
  const send = async () => {
    if (!intent || inFlight.current || journalBlocked) return;
    let original = pending;
    if (!original) {
      original = {
        intent,
        envelope: {
          kind: detail.output.kind,
          action: intent.action,
          command:
            intent.action === "RecoverIssue"
              ? intent.fields
              : {
                  ...intent.fields,
                  operation_id: crypto.randomUUID(),
                  schema_version: 1,
                  reason,
                  ...(["RecordDistribution", "ReconcileDistribution"].includes(
                    intent.action,
                  )
                    ? { evidence, outcome }
                    : {}),
                },
        },
      };
      try {
        sessionStorage.setItem(storageKey, JSON.stringify(original));
      } catch {
        setError({
          message:
            "Recovery storage is unavailable. This action has not been submitted. Enable session storage and try again.",
        });
        return;
      }
      setPending(original);
    }
    inFlight.current = true;
    setBusy(true);
    setError(null);
    try {
      accepted(
        await api<CommandResult>(
          `document-outputs/${detail.output.id}/actions`,
          original.envelope,
        ),
      );
    } catch (e) {
      const failure = e as Failure;
      // Once a response was lost, a subsequent refusal cannot prove the original did not commit.
      if (
        recovered.current ||
        failure.retryable ||
        !failure.status ||
        failure.status >= 500
      ) {
        recovered.current = true;
        setError(e);
      } else {
        sessionStorage.removeItem(storageKey);
        setPending(null);
        setError(e);
      }
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  };
  const receipt = async () => {
    if (!pending || inFlight.current) return;
    inFlight.current = true;
    setBusy(true);
    setError(null);
    try {
      accepted(
        await api<CommandResult>(
          `document-outputs/${detail.output.id}/operations?kind=${detail.output.kind}&operation_id=${pending.envelope.command.operation_id}`,
        ),
      );
    } catch (e) {
      setError(
        (e as Failure).status === 404
          ? {
              message:
                "No confirmed receipt is available yet. Keep this original command and retry it unchanged; absence of a receipt is not proof that it failed.",
            }
          : e,
      );
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  };
  if (!intent) return error ? <ErrorNotice error={error} /> : null;
  const isOutcome = ["RecordDistribution", "ReconcileDistribution"].includes(
      intent.action,
    ),
    isRecover = intent.action === "RecoverIssue",
    stale = (error as Failure)?.status === 409 && !pending;
  return (
    <WorklistPanel title={intent.label} onClose={close}>
      <form
        className="output-command"
        onSubmit={(e) => {
          e.preventDefault();
          void send();
        }}
      >
        <p>
          <strong>{detail.output.reference}</strong> · {intent.target}
        </p>
        {intent.action === "RequestIssue" && (
          <p>
            The source domain will recheck the current revision, review,
            template and your authority. A confirmed request queues preparation;
            an issue exists only after the original job finishes.
          </p>
        )}
        {intent.action === "WithdrawPack" && (
          <p>
            Withdraw the pack’s current issue and hold its appointment. Retained
            bytes and recorded responses remain unchanged. This affects the
            current pack even when you are viewing an earlier issue.
          </p>
        )}
        {isRecover && (
          <p>
            Resume this original preparation job with its recorded inputs. An
            issued job will not regenerate files. A live lease, stale source or
            missing retained bytes requires its native recovery path.
          </p>
        )}
        {intent.action.includes("Distribution") && (
          <p>
            This is a synthetic distribution record for one exact issue and
            recipient. It does not send externally or establish delivery,
            opening, downloading or acceptance.
          </p>
        )}
        {pending && (
          <div className="output-warning" role="status">
            <strong>
              {busy
                ? "Confirming original command…"
                : "Outcome not yet confirmed"}
            </strong>
            <p>
              The submitted values are retained for recovery in this browser
              tab. Check the original receipt or retry the identical command. Do
              not start another attempt.
            </p>
            <code>
              {String(
                pending.envelope.command.operation_id ??
                  pending.envelope.command.job_id,
              )}
            </code>
            {!!pending.envelope.command.reason && (
              <p>Submitted reason: {String(pending.envelope.command.reason)}</p>
            )}
            {!!pending.envelope.command.outcome && (
              <p>
                Submitted outcome: {String(pending.envelope.command.outcome)}
              </p>
            )}
          </div>
        )}
        <ValidationFields error={error}>
          <ErrorNotice error={error} />
          <fieldset disabled={busy || !!pending}>
            {!isRecover && (
              <Field
                name="reason"
                label="Reason"
                value={reason}
                onChange={setReason}
                multiline
                required
                maxLength={2000}
              />
            )}
            {isOutcome && (
              <>
                <SelectField
                  name="outcome"
                  label="Recorded outcome"
                  value={outcome}
                  onChange={setOutcome}
                  required
                  options={[
                    { id: "SimulatedSent", display_name: "Simulated sent" },
                    {
                      id: "SimulatedNotSent",
                      display_name: "Simulated not sent",
                    },
                    ...(intent.action === "RecordDistribution"
                      ? [
                          {
                            id: "OutcomeUnknown",
                            display_name: "Outcome unknown",
                          },
                        ]
                      : []),
                  ]}
                />
                <Field
                  name="evidence"
                  label="Evidence"
                  value={evidence}
                  onChange={setEvidence}
                  required
                  multiline
                  maxLength={2000}
                />
              </>
            )}
          </fieldset>
        </ValidationFields>
        {stale && (
          <p role="status">
            The saved record changed or no longer allows this action. Close this
            dialog and refresh the record before preparing a new confirmation.
            Your reason remains here to review.
          </p>
        )}
        <div className="output-actions">
          {pending && !!pending.envelope.command.operation_id && (
            <Button onClick={() => void receipt()} busy={busy}>
              Check original receipt
            </Button>
          )}
          <Button
            type="submit"
            variant={intent.action === "WithdrawPack" ? "danger" : "primary"}
            busy={busy}
            disabled={
              journalBlocked ||
              stale ||
              (!pending &&
                !isRecover &&
                (!reason.trim() ||
                  (isOutcome && (!evidence.trim() || !outcome))))
            }
          >
            {pending
              ? "Retry original command"
              : `Confirm ${intent.label.toLowerCase()}`}
          </Button>
          {!pending && (
            <Button onClick={close} disabled={busy}>
              Cancel
            </Button>
          )}
        </div>
      </form>
    </WorklistPanel>
  );
}
