"use client";
import Link from "next/link";
import { useState } from "react";
import { ReadState, Field, ValidationFields } from "./business-ui";
import { Button } from "./ui/button";
import { useCrmCommand, useCrmResource } from "./crm-state";
import { EqCommandState, EqSelect, type EqOptions } from "./equipment-forms";
import type { equipmentTimeline } from "../equipment/timeline";
import type { equipmentWorkspace } from "../equipment/reads";

export function EquipmentTimeline({
  id,
  inspections = false,
}: {
  id: string;
  inspections?: boolean;
}) {
  const r = useCrmResource<Awaited<ReturnType<typeof equipmentTimeline>>>(
      `equipment/${id}/timeline`,
      true,
    ),
    [filter, setFilter] = useState("");
  const items =
    r.data?.items.filter((x) =>
      inspections ? x.source === "Inspection" : !filter || x.source === filter,
    ) ?? [];
  return (
    <section>
      <h2>
        {inspections
          ? "Linked Inspection attempts and retests"
          : "Documents & service timeline"}
      </h2>
      <p>
        Source records retain their own scope, revision, confidence and access.
        Current installation is never substituted for event-time location.
      </p>
      <ReadState loading={r.loading} error={r.error} retry={r.reload} />
      {r.data && (
        <>
          {r.data.partial && (
            <p role="status" className="eq-notice">
              Partial view: a source is unavailable or its bounded history has
              more records. Open the owning workspace for further history.
            </p>
          )}
          {!inspections && (
            <EqSelect
              required={false}
              label="Timeline source"
              value={filter}
              onChange={setFilter}
              options={[...new Set(r.data.items.map((x) => x.source))].map(
                (id) => ({ id, label: id }),
              )}
            />
          )}
          <p>
            {r.data.sources
              .map(
                (s) => `${s.name}: ${s.state}${s.bounded ? " (bounded)" : ""}`,
              )
              .join(" · ")}
          </p>
          {!items.length && (
            <p>
              No permitted {inspections ? "Inspection attempts" : "history"} in
              this view.
            </p>
          )}
          <ol className="eq-timeline">
            {items.map((x) => (
              <li key={x.key} className="eq-card">
                <h3>
                  {x.href ? <Link href={x.href}>{x.title}</Link> : x.title}
                </h3>
                <p>
                  <strong>{x.state}</strong> · {x.confidence}
                </p>
                <p className="eq-narrative">{x.summary}</p>
                <dl>
                  <dt>Source / revision</dt>
                  <dd>
                    {x.source} · {x.reference} · {x.revision}
                  </dd>
                  <dt>Occurred</dt>
                  <dd>
                    {x.occurred_at
                      ? new Date(x.occurred_at).toLocaleString("en-AU")
                      : "Not recorded"}
                  </dd>
                  <dt>Actor / owner</dt>
                  <dd>{x.actor ?? "Not recorded in source projection"}</dd>
                  <dt>Location at event</dt>
                  <dd>
                    {x.location}
                    {x.site_id && (
                      <>
                        {" "}
                        ·{" "}
                        <Link href={`/sites/${x.site_id}`}>Recorded Site</Link>
                      </>
                    )}
                  </dd>
                  <dt>Access</dt>
                  <dd>{x.access_class}</dd>
                </dl>
              </li>
            ))}
          </ol>
        </>
      )}
    </section>
  );
}
export function EquipmentIdentityForm({
  data,
  saved,
}: {
  data: Awaited<ReturnType<typeof equipmentWorkspace>>;
  saved: () => void;
}) {
  const [basis, setBasis] = useState(data.asset),
    [identity, setIdentity] = useState(data.context.identity_status),
    [serial, setSerial] = useState(data.context.serial ?? ""),
    [parent, setParent] = useState(data.asset.parent_asset_id ?? ""),
    [reason, setReason] = useState("");
  const options = useCrmResource<EqOptions>(
    `equipment/options?asset_id=${data.context.id}`,
    true,
  );
  const command = useCrmCommand(saved),
    changed = basis.version !== data.asset.version;
  return (
    <details>
      <summary>Correct canonical identity or component relationship</summary>
      <p>
        Evidence-backed correction is separate from QR lookup. Retain the
        physical Asset; a replacement needs its own identity.
      </p>
      <ValidationFields error={command.error}>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void command.send(`assets/${data.context.id}/revise-identity`, {
              expected_version: basis.version,
              identity_status: identity,
              serial: serial || null,
              parent_asset_id: parent || null,
              reason,
            });
          }}
        >
          <fieldset
            className="eq-form"
            disabled={command.busy || command.uncertain}
          >
            <legend>Identity basis version {basis.version}</legend>
            <EqSelect
              label="Reviewed identity state"
              value={identity}
              onChange={(v) => {
                setIdentity(v);
                command.dirty();
              }}
              options={["Verified", "Unresolved", "Disputed"].map((id) => ({
                id,
                label: id,
              }))}
            />
            <Field
              name="serial"
              label="Exact serial"
              value={serial}
              onChange={(v) => {
                setSerial(v);
                command.dirty();
              }}
            />
            <EqSelect
              label="Parent equipment"
              required={false}
              value={parent}
              onChange={(v) => {
                setParent(v);
                command.dirty();
              }}
              options={
                options.data?.assets
                  .filter(
                    (a) =>
                      a.id !== data.context.id &&
                      a.site_id === data.context.site_id,
                  )
                  .map((a) => ({
                    id: a.id,
                    label: `${a.display_number} · ${a.description}`,
                  })) ?? []
              }
            />
            <Field
              name="reason"
              label="Correction reason and physical evidence reference"
              required
              value={reason}
              onChange={(v) => {
                setReason(v);
                command.dirty();
              }}
            />
            {changed && (
              <p role="alert">
                This Asset changed. Compare your retained entries with the
                current record before accepting its version.
              </p>
            )}
            {changed && (
              <Button onClick={() => setBasis(data.asset)}>
                I reviewed the current Asset basis
              </Button>
            )}
            <Button type="submit" variant="primary" disabled={changed}>
              Save controlled identity correction
            </Button>
          </fieldset>
          <EqCommandState command={command} />
        </form>
      </ValidationFields>
    </details>
  );
}
