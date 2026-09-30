"use client";
import { useState } from "react";
import {
  ErrorNotice,
  Field,
  SelectField,
  ReadState,
  useCommand,
  useResource,
} from "../../../components/business-ui";
import { Button } from "../../../components/ui/button";
import type { readPolicyImpact } from "../../policy-resolution";

export function PolicyResolution({
  impactId,
  onSaved,
}: {
  impactId: string;
  onSaved: () => void;
}) {
  const [replacement, setReplacement] = useState(""),
    [outcome, setOutcome] = useState("VerifiedNoConflict"),
    [reason, setReason] = useState(""),
    [query, setQuery] = useState<string | null>(null);
  const read = useResource<Awaited<ReturnType<typeof readPolicyImpact>>>(query);
  const command = useCommand(),
    pending = !!(command.error as { retryable?: boolean } | null)?.retryable;
  function evaluate() {
    const next =
      `schedule/policy-impacts/${impactId}` +
      (outcome === "Replaced"
        ? `?replacement_id=${encodeURIComponent(replacement)}`
        : "");
    setQuery(next);
    if (query === next) read.reload();
  }
  async function save() {
    const r = read.data;
    if (!r || read.error || read.loading) return;
    if (
      await command.send(`schedule/policy-impacts/${impactId}/resolve`, {
        impact_hash: r.impact.content_hash,
        expected_appointment_version: r.appointment.version,
        expected_resolution: r.expected_resolution,
        dependency_fingerprint: r.dependency_fingerprint,
        outcome,
        replacement: r.replacement,
        reason,
      })
    ) {
      read.reload();
      onSaved();
    }
  }
  return (
    <details className="planner-form">
      <summary>Resolve scheduling impact after a controlled change</summary>
      <p>
        Acknowledgement and Activity completion give no start authority. Make
        the controlled booking change or cancellation first, then evaluate it
        here.
      </p>
      <fieldset disabled={command.busy || pending}>
        <legend>Resolution evidence</legend>
        <SelectField
          name={`policy-outcome-${impactId}`}
          label="Controlled outcome"
          value={outcome}
          onChange={(v) => {
            setOutcome(v);
            setQuery(null);
          }}
          options={[
            {
              id: "VerifiedNoConflict",
              display_name: "Changed booking",
            },
            { id: "Cancelled", display_name: "Cancelled" },
            {
              id: "Replaced",
              display_name: "Cancelled and replaced",
            },
          ]}
        />
        {outcome === "Replaced" && (
          <Field
            name={`policy-replacement-${impactId}`}
            label="Replacement appointment ID"
            value={replacement}
            onChange={(v) => {
              setReplacement(v);
              setQuery(null);
            }}
          />
        )}
        <Field
          name={`policy-reason-${impactId}`}
          label="Resolution reason"
          multiline
          value={reason}
          onChange={setReason}
          maxLength={1000}
        />
        <Button onClick={evaluate}>Evaluate current booking</Button>
      </fieldset>
      {!pending && <ReadState {...read} retry={read.reload} />}
      {!read.loading && !read.error && read.data && query && (
        <p>
          Current disposition: {read.data.disposition}.{" "}
          {outcome === "VerifiedNoConflict" && (
            <>
              Booking evaluation:{" "}
              {read.data.evaluation.current.candidate.evaluation.outcome}.{" "}
            </>
          )}
          Saving rechecks this exact evidence and all required authority.
        </p>
      )}
      <ErrorNotice error={command.error} />
      {command.saved && (
        <p role="status">
          Policy resolution saved. Independent readiness checks still apply.
        </p>
      )}
      {pending && (
        <p>
          Result uncertain. Retry this unchanged resolution to recover the
          original receipt.
        </p>
      )}
      <Button
        variant="primary"
        busy={command.busy}
        disabled={
          !query || !read.data || !!read.error || read.loading || !reason.trim()
        }
        onClick={() => void save()}
      >
        {pending ? "Retry original resolution" : "Save verified resolution"}
      </Button>
    </details>
  );
}
