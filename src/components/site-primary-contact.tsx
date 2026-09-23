"use client";
import { useState } from "react";
import {
  ErrorNotice,
  Field,
  ValidationFields,
  type Envelope,
  type Option,
} from "./business-ui";
import { useCrmCommand, useCrmResource } from "./crm-state";
import { LookupField } from "./record-ui";

export function SitePrimaryContact({
  id,
  version,
  onSaved,
}: {
  id: string;
  version: number;
  onSaved: () => void;
}) {
  const [editing, setEditing] = useState<number | null>(null);
  return editing === null ? (
    <button className="secondary" onClick={() => setEditing(version)}>
      Change primary contact
    </button>
  ) : (
    <PrimaryContactForm
      id={id}
      version={editing}
      onSaved={() => {
        setEditing(null);
        onSaved();
      }}
    />
  );
}
function PrimaryContactForm({
  id,
  version,
  onSaved,
}: {
  id: string;
  version: number;
  onSaved: () => void;
}) {
  const [selected, setSelected] = useState(""),
    [search, setSearch] = useState(""),
    [reason, setReason] = useState(""),
    [clear, setClear] = useState(false);
  const r = useCrmResource<Envelope<Option>>(
    `sites/${id}/primary-contact/options?q=${encodeURIComponent(search)}`,
    true,
  );
  const command = useCrmCommand(onSaved);
  return (
    <form
      className="detail-section cs-form"
      onSubmit={(e) => {
        e.preventDefault();
        void command.send(`sites/${id}/primary-contact`, {
          expected_version: version,
          primary_contact_id: clear ? null : selected,
          reason,
        });
      }}
    >
      <h2>Site primary contact</h2>
      <p>
        Choose a permitted active contact in this company, or explicitly clear
        the selection. Changing the contact does not approve a service report.
      </p>
      <ValidationFields error={command.error}>
        <fieldset disabled={command.busy || command.uncertain}>
          <label>
            <input
              type="checkbox"
              checked={clear}
              onChange={(e) => {
                setClear(e.target.checked);
                command.dirty();
              }}
            />{" "}
            No primary contact recorded
          </label>
          {!clear && (
            <LookupField
              name="primary_contact_id"
              label="New primary contact"
              value={selected}
              onChange={(v) => {
                setSelected(v);
                command.dirty();
              }}
              search={search}
              onSearch={setSearch}
              options={r.data?.items ?? []}
              loading={r.loading}
              error={!!r.error}
              more={!!r.data?.next_cursor}
            />
          )}
          <Field
            name="reason"
            label="Reason for primary-contact change"
            value={reason}
            onChange={(v) => {
              setReason(v);
              command.dirty();
            }}
            required
          />
          <button type="submit" disabled={!clear && !selected}>
            Save primary contact
          </button>
        </fieldset>
      </ValidationFields>
      <ErrorNotice error={command.error} />
      <p role="status">{command.status}</p>
      {command.uncertain && (
        <button
          type="button"
          disabled={command.busy}
          onClick={() => void command.reconcile()}
        >
          Confirm original save
        </button>
      )}
    </form>
  );
}
