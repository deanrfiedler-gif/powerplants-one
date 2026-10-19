"use client";
import { useState } from "react";
import { ErrorNotice, Field, ValidationFields } from "./business-ui";
import { useCrmCommand } from "./crm-state";
import { WorklistPanel } from "./crm-worklist-tools";
import type { Customer360 } from "../shared/customer-360";

/** Existing identity revision and recovery; no new correction authority. */
export function OrganisationCorrection({
  current,
  reload,
  close,
}: {
  current: Customer360["context"];
  reload: () => void;
  close: () => void;
}) {
  const [name, setName] = useState(current.display_name),
    [reason, setReason] = useState("");
  const [basis, setBasis] = useState({
    version: current.version,
    parent: current.parent_organisation_id ?? null,
  });
  const cmd = useCrmCommand(() => {
    reload();
    close();
  });
  const locked = cmd.busy || cmd.uncertain;
  return (
    <WorklistPanel
      title="Correct organisation details"
      onClose={() => {
        if (
          !locked &&
          (!cmd.hasUnsavedChanges ||
            window.confirm("Discard this unsaved correction?"))
        ) {
          cmd.discard();
          close();
        }
      }}
    >
      <p>
        Correct the display name through the existing identity revision. Legal
        name, status, owner and sector cannot be changed here.
      </p>
      <ValidationFields error={cmd.error}>
        <ErrorNotice error={cmd.error} />
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!locked)
              void cmd.send(`customers/${current.id}/revise-identity`, {
                expected_version: basis.version,
                display_name: name,
                parent_organisation_id: basis.parent,
                reason,
              });
          }}
          onChange={cmd.dirty}
        >
          <fieldset disabled={locked}>
            <Field
              name="display_name"
              label="Display name"
              value={name}
              onChange={setName}
              required
              maxLength={200}
            />
            <Field
              name="reason"
              label="Reason for correction"
              value={reason}
              onChange={setReason}
              required
              maxLength={1000}
            />
            <button type="submit">Save correction</button>
          </fieldset>
        </form>
      </ValidationFields>
      <p role="status">{cmd.status}</p>
      {cmd.uncertain && (
        <button
          type="button"
          disabled={cmd.busy}
          onClick={() => void cmd.reconcile()}
        >
          Confirm original save
        </button>
      )}
      <button
        type="button"
        className="secondary"
        disabled={locked}
        onClick={reload}
      >
        Compare current saved version
      </button>
      {current.version !== basis.version && (
        <section>
          <h3>Current saved organisation</h3>
          <p>
            {current.display_name} · Version {current.version}
          </p>
          <p>
            Your proposed name remains above. Review the current identity before
            using this version.
          </p>
          <button
            type="button"
            disabled={locked}
            onClick={() => {
              setBasis({
                version: current.version,
                parent: current.parent_organisation_id ?? null,
              });
              cmd.clearError();
            }}
          >
            Use reviewed version with my entries
          </button>
        </section>
      )}
    </WorklistPanel>
  );
}
