"use client";
import {
  EqField as Field,
  EqDateTimeField as LocalDateTimeField,
} from "./equipment-controls";
import { useState } from "react";
import { api, ErrorNotice, ReadState, ValidationFields } from "./business-ui";
import { Button } from "./ui/button";
import { useCrmCommand, useCrmResource } from "./crm-state";

import type { equipmentOptions } from "../equipment/options";
import type {
  equipmentChanges,
  previewEquipmentChange,
} from "../equipment/changes";
import type { EquipmentChange } from "../equipment/changes";
import { changeKinds } from "../equipment/model";
export type EqOptions = Awaited<ReturnType<typeof equipmentOptions>>;
export function EqCommandState({
  command,
}: {
  command: ReturnType<typeof useCrmCommand>;
}) {
  return (
    <>
      <ErrorNotice error={command.error} />
      <p role="status">{command.status}</p>
      {command.uncertain && (
        <Button onClick={() => void command.reconcile()} busy={command.busy}>
          Recover original operation
        </Button>
      )}
    </>
  );
}
export function EqSelect({
  label,
  value,
  onChange,
  options,
  required = true,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { id: string; label: string }[];
  required?: boolean;
}) {
  return (
    <label className="eq-select">
      {label}
      <select
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">{required ? "Select…" : "Not recorded"}</option>
        {options.map((o) => (
          <option key={o.id} value={o.id}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}
const changeLabels: Record<string, string> = {
  Configuration: "Configuration successor",
  Relocate: "Physical relocation",
  CorrectLocation: "Correct recorded location",
  Replace: "Replace with a separate Asset",
  Retire: "Retire / decommission",
};
export function EquipmentChangePanel({
  id,
  configuration,
  onSaved,
}: {
  id: string;
  configuration: boolean;
  onSaved: () => void;
}) {
  const r = useCrmResource<Awaited<ReturnType<typeof equipmentChanges>>>(
      `equipment/${id}/changes`,
      true,
    ),
    options = useCrmResource<EqOptions>(
      `equipment/options?asset_id=${id}`,
      true,
    );
  const [kind, setKind] = useState(
      configuration ? "Configuration" : "Relocate",
    ),
    [description, setDescription] = useState(""),
    [site, setSite] = useState(""),
    [facility, setFacility] = useState(""),
    [successor, setSuccessor] = useState(""),
    [source, setSource] = useState(""),
    [revision, setRevision] = useState(""),
    [reason, setReason] = useState(""),
    [consequences, setConsequences] = useState(""),
    [effective, setEffective] = useState(""),
    [preview, setPreview] = useState<Awaited<
      ReturnType<typeof previewEquipmentChange>
    > | null>(null),
    [previewError, setPreviewError] = useState<unknown>(null),
    [previewBusy, setPreviewBusy] = useState(false);
  const command = useCrmCommand(() => {
    r.reload();
    onSaved();
    setPreview(null);
  });
  const dirty = () => {
    command.dirty();
    setPreview(null);
  };
  async function loadPreview() {
    setPreviewBusy(true);
    setPreviewError(null);
    try {
      setPreview(await api(`equipment/${id}/impact`));
    } catch (e) {
      setPreviewError(e);
    } finally {
      setPreviewBusy(false);
    }
  }
  const changes =
    r.data?.items.filter((c) =>
      configuration ? c.kind === "Configuration" : c.kind !== "Configuration",
    ) ?? [];
  return (
    <section>
      <h2>
        {configuration
          ? "Propose a configuration successor"
          : "Propose a physical lifecycle change"}
      </h2>
      <p>
        {configuration
          ? "Retain the exact prior configuration. Describe hardware, firmware, software, interfaces and logical programmes only where supported by the source."
          : "Review both physical and served context. Resolve component relationships and open Service work before applying the change."}
      </p>
      <ReadState
        loading={options.loading || r.loading}
        error={options.error || r.error}
        retry={() => {
          options.reload();
          r.reload();
        }}
      />
      {options.data?.can_edit && (
        <ValidationFields error={command.error}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!preview) return;
              void command.send(`equipment/${id}/changes`, {
                id: crypto.randomUUID(),
                kind,
                expected_version: preview.impact.asset_version,
                basis_hash: preview.basis_hash,
                effective_at: effective,
                source_reference: source,
                source_revision: revision,
                reason,
                consequences,
                configuration: configuration ? description : null,
                site_id: ["Relocate", "CorrectLocation"].includes(kind)
                  ? site
                  : null,
                facility_id: ["Relocate", "CorrectLocation"].includes(kind)
                  ? facility || null
                  : null,
                successor_id: kind === "Replace" ? successor : null,
                successor_version:
                  kind === "Replace"
                    ? options.data!.assets.find((a) => a.id === successor)
                        ?.version
                    : null,
              });
            }}
          >
            <fieldset
              disabled={command.busy || command.uncertain}
              className="eq-form"
            >
              <legend>
                {configuration ? "Exact successor basis" : "Change details"}
              </legend>
              {!configuration && (
                <EqSelect
                  label="Change kind"
                  value={kind}
                  onChange={(v) => {
                    setKind(v);
                    dirty();
                  }}
                  options={changeKinds
                    .filter((k) => k !== "Configuration")
                    .map((id) => ({ id, label: changeLabels[id] }))}
                />
              )}
              {configuration && (
                <Field
                  name="configuration"
                  label="Configuration description"
                  multiline
                  maxLength={10000}
                  required
                  value={description}
                  onChange={(v) => {
                    setDescription(v);
                    dirty();
                  }}
                  hint="Name exact hardware/software/firmware and source revisions. A programme change does not rename an area."
                />
              )}
              {["Relocate", "CorrectLocation"].includes(kind) && (
                <>
                  <EqSelect
                    label="Destination Site"
                    value={site}
                    onChange={(v) => {
                      setSite(v);
                      setFacility("");
                      dirty();
                    }}
                    options={options.data.sites
                      .filter(
                        (s) => s.company_id === options.data!.asset?.company_id,
                      )
                      .map((s) => ({ id: s.id, label: s.display_name }))}
                  />
                  <EqSelect
                    label="Destination installed Facility"
                    required={false}
                    value={facility}
                    onChange={(v) => {
                      setFacility(v);
                      dirty();
                    }}
                    options={options.data.facilities
                      .filter((f) => f.site_id === site)
                      .map((f) => ({ id: f.id, label: f.name }))}
                  />
                </>
              )}
              {kind === "Replace" && (
                <EqSelect
                  label="Separate successor Asset"
                  value={successor}
                  onChange={(v) => {
                    setSuccessor(v);
                    dirty();
                  }}
                  options={options.data.assets
                    .filter(
                      (a) =>
                        a.id !== id &&
                        a.site_id === options.data!.asset?.site_id,
                    )
                    .map((a) => ({
                      id: a.id,
                      label: `${a.display_number} · ${a.description}`,
                    }))}
                />
              )}
              <LocalDateTimeField
                name="effective_at"
                label="Actual effective date and time"
                value={effective}
                onChange={(v) => {
                  setEffective(v);
                  dirty();
                }}
              />
              <Field
                name="source_reference"
                label="Source / evidence reference"
                required
                value={source}
                onChange={(v) => {
                  setSource(v);
                  dirty();
                }}
              />
              <Field
                name="source_revision"
                label="Exact source revision"
                required
                value={revision}
                onChange={(v) => {
                  setRevision(v);
                  dirty();
                }}
              />
              <Field
                name="reason"
                label="Reason for change"
                required
                value={reason}
                maxLength={1000}
                onChange={(v) => {
                  setReason(v);
                  dirty();
                }}
              />
              <Field
                name="consequences"
                label="Reviewed consequences"
                required
                value={consequences}
                maxLength={2000}
                multiline
                onChange={(v) => {
                  setConsequences(v);
                  dirty();
                }}
                hint="Address served areas, components, open Service work, warranty, maintenance, documents and configurations. Unknowns remain explicit."
              />
              <Button onClick={() => void loadPreview()} busy={previewBusy}>
                Preview current impact
              </Button>
              <ErrorNotice error={previewError} />
              {preview && (
                <div className="eq-notice">
                  <h3>
                    Current impact · Asset version{" "}
                    {preview.impact.asset_version}
                  </h3>
                  <p>
                    {preview.impact.children.length} child relationships ·{" "}
                    {preview.impact.served.length} active served links ·{" "}
                    {preview.impact.work.length} open Work Orders ·{" "}
                    {preview.impact.tickets.length} open requests
                  </p>
                  <p>
                    Configuration:{" "}
                    {preview.impact.configuration
                      ? `revision ${preview.impact.configuration.revision}`
                      : "Not recorded"}
                  </p>
                  <p>{preview.impact.maintenance}</p>
                  <p>{preview.impact.documents}</p>
                  <p>
                    This preview does not apply the change. The saved proposal
                    receives a separate review decision.
                  </p>
                  <Button type="submit" variant="primary">
                    Record proposal for review
                  </Button>
                </div>
              )}
            </fieldset>
            <EqCommandState command={command} />
          </form>
        </ValidationFields>
      )}
      {!options.data?.can_edit && options.data && (
        <p>Read only: current Equipment maintenance permission is required.</p>
      )}
      <h2>Retained change proposals and decisions</h2>
      {!changes.length && <p>No change proposals recorded.</p>}
      {changes.map((c) => (
        <EquipmentChangeReview
          key={c.id}
          change={c}
          options={options.data}
          canEdit={!!r.data?.can_edit}
          saved={() => {
            r.reload();
            onSaved();
          }}
        />
      ))}
    </section>
  );
}
function EquipmentChangeReview({
  change,
  options,
  canEdit,
  saved,
}: {
  change: EquipmentChange;
  options: EqOptions | null;
  canEdit: boolean;
  saved: () => void;
}) {
  const [reason, setReason] = useState(""),
    command = useCrmCommand(saved);
  return (
    <article className="eq-card">
      <h3>
        {changeLabels[change.kind]} · {change.state}
      </h3>
      <p>{change.reason}</p>
      <dl>
        <dt>Retained Asset basis</dt>
        <dd>
          Version {change.basis.asset_version} · {change.basis.lifecycle_status}
        </dd>
        <dt>Recorded physical location</dt>
        <dd>
          {options?.sites.find((s) => s.id === change.basis.site_id)
            ?.display_name ?? change.basis.site_id}{" "}
          /{" "}
          {options?.facilities.find((f) => f.id === change.basis.facility_id)
            ?.name ??
            change.basis.facility_id ??
            "Facility not recorded"}
        </dd>
        {change.proposal.site_id && (
          <>
            <dt>Proposed physical location</dt>
            <dd>
              {options?.sites.find((s) => s.id === change.proposal.site_id)
                ?.display_name ?? change.proposal.site_id}{" "}
              /{" "}
              {options?.facilities.find(
                (f) => f.id === change.proposal.facility_id,
              )?.name ??
                change.proposal.facility_id ??
                "Facility not recorded"}
            </dd>
          </>
        )}
        {change.proposal.successor_id && (
          <>
            <dt>Separate successor identity</dt>
            <dd>
              {options?.assets.find(
                (a) => a.id === change.proposal.successor_id,
              )?.display_number ?? change.proposal.successor_id}{" "}
              · reviewed version {change.proposal.successor_version}
            </dd>
          </>
        )}
        {change.kind === "Retire" && (
          <>
            <dt>Proposed physical state</dt>
            <dd>Decommissioned; original identity and history retained</dd>
          </>
        )}
        <dt>Exact prior configuration</dt>
        <dd>
          {change.basis.configuration
            ? `Revision ${change.basis.configuration.revision}: ${change.basis.configuration.description}`
            : "Not recorded"}
        </dd>
        {change.proposal.configuration && (
          <>
            <dt>Proposed successor configuration</dt>
            <dd className="eq-preserve">{change.proposal.configuration}</dd>
          </>
        )}
        <dt>Reviewed relationships and open work</dt>
        <dd>
          {change.basis.children.length} children · {change.basis.served.length}{" "}
          served areas · {change.basis.work.length} Work Orders ·{" "}
          {change.basis.tickets.length} requests
        </dd>
        <dt>Warranty retained with original identity</dt>
        <dd>
          {change.basis.warranty.start ?? "Start unknown"} /{" "}
          {change.basis.warranty.end ?? "End unknown"}
        </dd>
      </dl>
      <p>{change.basis.maintenance}</p>
      <p>{change.basis.documents}</p>
      <p>
        Source: {change.source_reference} · {change.source_revision}
      </p>
      <p>{change.proposal.consequences}</p>
      <p>
        Effective: {new Date(change.effective_at).toLocaleString("en-AU")} ·
        proposal version {change.version}
      </p>
      {change.review_reason && <p>Review: {change.review_reason}</p>}
      {change.state === "Proposed" && canEdit && (
        <ValidationFields error={command.error}>
          <fieldset disabled={command.busy || command.uncertain}>
            <legend>Explicit review decision</legend>
            <Field
              name="reason"
              label="Review reason"
              required
              value={reason}
              onChange={(v) => {
                setReason(v);
                command.dirty();
              }}
            />
            <div className="eq-actions">
              <Button
                variant="primary"
                disabled={!reason.trim()}
                onClick={() =>
                  void command.send(`equipment/changes/${change.id}/review`, {
                    expected_version: change.version,
                    decision: "Apply",
                    reason,
                  })
                }
              >
                Apply reviewed change
              </Button>
              <Button
                disabled={!reason.trim()}
                onClick={() =>
                  void command.send(`equipment/changes/${change.id}/review`, {
                    expected_version: change.version,
                    decision: "Reject",
                    reason,
                  })
                }
              >
                Reject proposal
              </Button>
            </div>
          </fieldset>
          <EqCommandState command={command} />
        </ValidationFields>
      )}
    </article>
  );
}
