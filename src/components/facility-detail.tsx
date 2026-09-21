"use client";
import Link from "next/link";
import { useState } from "react";
import {
  api,
  ErrorNotice,
  Field,
  PageHeader,
  ReadState,
  SelectField,
  Stamp,
  ValidationFields,
  type Envelope,
} from "./business-ui";
import { denied, useCrmCommand, useCrmResource } from "./crm-state";
import { LookupField, RecordPanel, RecordTabs } from "./record-ui";
import {
  Comparison,
  CopyId,
  SourceField,
  reviewOf,
  useFacilityPages,
} from "./facility-controls";
import {
  displayValue,
  fields,
  mapUrl,
  type Facility,
  type Preview,
  type SourceInput,
  type Source,
} from "../shared/facilities/definition";

export function FacilityOverview({
  facility: f,
  compact = false,
}: {
  facility: Facility;
  compact?: boolean;
}) {
  return (
    <>
      <p>
        <Link href={`/sites/${f.site_id}`}>{f.site_name}</Link>
        {f.path.map((a) => (
          <span key={a.id}>
            {" "}
            / <Link href={`/facilities/${a.id}`}>{a.name}</Link>
          </span>
        ))}
      </p>
      {f.details.parent_facility_id && (
        <p>
          {f.details.parent_relationship === "physically_within"
            ? "Within"
            : "Grouped under"}{" "}
          {f.path.at(-1)?.name}
        </p>
      )}
      <p className="facility-meta">
        Record ID <CopyId id={f.id} />
      </p>
      {(compact
        ? ["Structure", "Growing context", "Measurements"]
        : [...new Set(Object.values(fields).map((v) => v.group))]
      ).map((group) => (
        <section key={group} className="facility-section">
          <h2>{group}</h2>
          <dl className="facility-summary">
            {Object.entries(fields)
              .filter(
                ([k, v]) =>
                  v.group === group &&
                  ![
                    "name",
                    "parent_facility_id",
                    "parent_relationship",
                  ].includes(k) &&
                  (!compact ||
                    ["structure_type", "use", "crop", "footprint_m2"].includes(
                      k,
                    )) &&
                  (f.details[k] !== null ||
                    [
                      "structure_type",
                      "use",
                      "crop",
                      "footprint_m2",
                      "on_site_position",
                      "context_observed_on",
                      "measurement_source",
                      "measurement_basis",
                    ].includes(k)),
              )
              .map(([key, v]) => (
                <div key={key}>
                  <dt>{v.label}</dt>
                  <dd>{displayValue(f.details[key], key)}</dd>
                </div>
              ))}
          </dl>
        </section>
      ))}
      {!compact && (
        <section className="facility-section">
          <h2>Location pin</h2>
          {f.pin ? (
            <>
              <p>
                {f.pin.latitude}, {f.pin.longitude} ·{" "}
                {f.pin.state === "confirmed"
                  ? "Confirmed by a recorded check"
                  : "Proposed"}
              </p>
              <p>Checked on: {f.pin.checked_on ?? "Not recorded"}</p>
              <p>{displayValue(f.pin.source)}</p>
              {mapUrl(f.pin) && (
                <a
                  href={mapUrl(f.pin)!}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  View pin in Google Maps
                </a>
              )}
              <p>
                Internal inspection destination. Check the{" "}
                <Link href={`/sites/${f.site_id}`}>
                  Site arrival and access context
                </Link>{" "}
                before a visit.
              </p>
            </>
          ) : (
            <p>Not recorded. On-site position can be useful without a pin.</p>
          )}
        </section>
      )}
      <p className="facility-meta">
        Version {f.version} · Saved{" "}
        <Stamp value={f.updated_at} timezone={f.timezone} /> · Recorded actor{" "}
        {f.updated_by}
      </p>
    </>
  );
}
export function FacilityDetail({
  id,
  compact = false,
  onClose,
}: {
  id: string;
  compact?: boolean;
  onClose?: () => void;
}) {
  const r = useCrmResource<Facility>(`facilities/${id}/workspace`),
    [tab, setTab] = useState("overview"),
    [pin, setPin] = useState(false);
  const [pinGuard, setPinGuard] = useState({ dirty: false, pending: false });
  const leavePin = () =>
    !pinGuard.pending &&
    (!pinGuard.dirty || window.confirm("Discard the unsaved pin proposal?"));
  const f = r.data;
  return (
    <div
      className={compact ? "facility-inspector-content" : "facility-workspace"}
    >
      <ReadState loading={r.loading} error={r.error} retry={r.reload} />
      {f && (
        <>
          <PageHeader
            eyebrow="Facility / growing area"
            title={String(f.details.name)}
            action={
              <div className="facility-actions">
                {compact && (
                  <Link className="button secondary" href={`/facilities/${id}`}>
                    Open full record
                  </Link>
                )}
                {f.can_edit && (
                  <Link className="button" href={`/facilities/${id}/edit`}>
                    Edit
                  </Link>
                )}
                {onClose && (
                  <button type="button" className="secondary" onClick={onClose}>
                    Close
                  </button>
                )}
              </div>
            }
          />
          {!compact && (
            <RecordTabs
              id="facility"
              label="Facility record"
              value={tab}
              onChange={(v) => {
                if (leavePin()) {
                  setTab(v);
                  setPin(false);
                  setPinGuard({ dirty: false, pending: false });
                }
              }}
              tabs={[
                { id: "overview", label: "Overview" },
                { id: "related", label: "Related records" },
                { id: "history", label: "History" },
              ]}
            />
          )}
          {compact ? (
            <FacilityOverview facility={f} compact />
          ) : (
            <>
              <RecordPanel id="facility" tab="overview" value={tab}>
                <FacilityOverview facility={f} />
                {f.can_edit && (
                  <button
                    type="button"
                    className="secondary"
                    disabled={pinGuard.pending}
                    onClick={() => {
                      if (!pin || leavePin()) {
                        setPin((v) => !v);
                        setPinGuard({ dirty: false, pending: false });
                      }
                    }}
                  >
                    {pin
                      ? "Close pin form"
                      : f.pin
                        ? "Review location pin"
                        : "Record location pin"}
                  </button>
                )}
                {pin && (
                  <PinForm
                    key={f.id}
                    facility={f}
                    reload={r.reload}
                    guard={setPinGuard}
                  />
                )}
              </RecordPanel>
              <RecordPanel id="facility" tab="related" value={tab}>
                <FacilityRelated facility={f} />
              </RecordPanel>
              <RecordPanel id="facility" tab="history" value={tab}>
                {tab === "history" && (
                  <FacilityHistory id={id} timezone={f.timezone} />
                )}
              </RecordPanel>
            </>
          )}
        </>
      )}
    </div>
  );
}
function PinForm({
  facility: latest,
  reload,
  guard,
}: {
  facility: Facility;
  reload: () => void;
  guard: (v: { dirty: boolean; pending: boolean }) => void;
}) {
  const [f, setBaseline] = useState(latest);
  const sources = useFacilityPages<Source>(`facilities/${f.id}/sources`);
  const [latitude, setLatitude] = useState(f.pin?.latitude ?? ""),
    [longitude, setLongitude] = useState(f.pin?.longitude ?? "");
  const [state, setState] = useState(f.pin?.state ?? "proposed"),
    [checked, setChecked] = useState(f.pin?.checked_on ?? "");
  const [source, setSource] = useState<SourceInput | null>(
      f.pin?.source
        ? { kind: "existing_source", id: f.pin.source.id, version: 1 }
        : null,
    ),
    [reason, setReason] = useState(""),
    [preview, setPreview] = useState<Preview | null>(null),
    [error, setError] = useState<unknown>(null),
    [busy, setBusy] = useState(false),
    [remove, setRemove] = useState(false),
    [saved, setSaved] = useState(false);
  const command = useCrmCommand(
    () => {
      setSaved(true);
      guard({ dirty: false, pending: false });
      reload();
    },
    "Unsaved",
    (pending) => guard({ dirty: true, pending }),
  );
  const blocked = command.busy || command.uncertain || busy || saved;
  const dirty = () => {
    command.dirty();
    guard({ dirty: true, pending: false });
    setPreview(null);
    setError(null);
  };
  const pin = {
    latitude,
    longitude,
    state,
    checked_on: checked || null,
    source,
  };
  async function compare(removing = false) {
    setBusy(true);
    setRemove(removing);
    try {
      setPreview(
        await api<Preview>(`facilities/${f.id}/preview-pin`, {
          expected_version: f.version,
          pin: removing ? null : pin,
        }),
      );
    } catch (e) {
      setError(e);
    } finally {
      setBusy(false);
    }
  }
  if (denied(error) || denied(command.error))
    return <ErrorNotice error={error ?? command.error} />;
  return (
    <form
      className="facility-pin-form"
      onSubmit={(e) => {
        e.preventDefault();
        void compare();
      }}
    >
      <ValidationFields error={error ?? command.error}>
        <ErrorNotice error={error ?? command.error} />
        <h2>Review facility pin</h2>
        {latest.version !== f.version && !saved && (
          <p>
            The saved record changed. Your proposed coordinates remain here.{" "}
            <button
              type="button"
              className="secondary"
              disabled={blocked}
              onClick={() => {
                setBaseline(latest);
                setPreview(null);
                setError(null);
              }}
            >
              Use latest saved version for a fresh comparison
            </button>
          </p>
        )}
        <fieldset disabled={blocked || !!preview}>
          <div className="facility-grid">
            <Field
              name="latitude"
              label="Latitude"
              value={latitude}
              required
              onChange={(v) => {
                dirty();
                setLatitude(v);
                setState("proposed");
                setChecked("");
              }}
            />
            <Field
              name="longitude"
              label="Longitude"
              value={longitude}
              required
              onChange={(v) => {
                dirty();
                setLongitude(v);
                setState("proposed");
                setChecked("");
              }}
            />
            <ReadState
              loading={sources.loading}
              error={sources.error}
              retry={sources.reload}
            />
            {sources.next && (
              <button
                type="button"
                className="secondary"
                onClick={sources.more}
              >
                Load more retained sources
              </button>
            )}
            <SourceField
              name="pin_source"
              label="Pin source"
              value={source}
              existing={[
                ...sources.items,
                ...(f.pin?.source ? [f.pin.source] : []),
              ].filter((v, i, a) => a.findIndex((x) => x.id === v.id) === i)}
              onChange={(v) => {
                dirty();
                setSource(v);
                setState("proposed");
                setChecked("");
              }}
            />
            <div>
              <Field
                name="checked_on"
                label="Checked on"
                type="date"
                value={checked}
                onChange={(v) => {
                  dirty();
                  setChecked(v);
                  setState("proposed");
                }}
              />
              <SelectField
                name="state"
                label="Recorded check"
                empty="Choose…"
                value={state}
                options={[
                  { id: "proposed", display_name: "Proposed" },
                  {
                    id: "confirmed",
                    display_name: "Confirm these coordinates, source and date",
                  },
                ]}
                onChange={(v) => {
                  dirty();
                  setState(v as "proposed" | "confirmed");
                  if (v === "proposed") setChecked("");
                }}
              />
            </div>
          </div>
          <Field
            name="pin-reason"
            validationField="reason"
            label="Pin change reason"
            value={reason}
            required
            maxLength={1000}
            onChange={(v) => {
              dirty();
              setReason(v);
            }}
          />
        </fieldset>
        {preview ? (
          <Comparison
            preview={preview}
            onConfirm={blocked}
            onCancel={() => setPreview(null)}
            confirm={() =>
              void command.send(
                `facilities/${f.id}/pin${remove ? "/remove" : ""}`,
                {
                  expected_version: f.version,
                  reason,
                  ...(remove ? {} : { pin }),
                  review: reviewOf(preview),
                },
              )
            }
          />
        ) : (
          <div className="facility-actions">
            <button disabled={blocked}>Review pin</button>
            {f.pin && (
              <button
                type="button"
                className="secondary"
                disabled={blocked || !reason.trim()}
                onClick={() => void compare(true)}
              >
                Review removal
              </button>
            )}
          </div>
        )}
        <p role="status">
          {saved ? "Saved; refreshing latest details…" : command.status}
        </p>
        {command.uncertain && (
          <button
            type="button"
            onClick={() => void command.reconcile()}
            disabled={command.busy}
          >
            Check original action
          </button>
        )}
      </ValidationFields>
    </form>
  );
}
type Equipment = {
  id: string;
  description: string;
  display_number: string;
  version: number;
  facility_id: string | null;
  installed_name: string | null;
  installed: boolean;
  link_id: string | null;
  source: unknown;
};
function FacilityRelated({ facility: f }: { facility: Facility }) {
  const r = useFacilityPages<Equipment>(`facilities/${f.id}/equipment`),
    [adding, setAdding] = useState(false),
    [addGuard, setAddGuard] = useState({ dirty: false, pending: false }),
    [end, setEnd] = useState<Equipment | null>(null),
    [reason, setReason] = useState("");
  const command = useCrmCommand(() => {
    setEnd(null);
    setReason("");
    r.reload();
  });
  if (denied(r.error) || denied(command.error))
    return <ErrorNotice error={r.error ?? command.error} />;
  return (
    <>
      <ReadState loading={r.loading} error={r.error} retry={r.reload} />
      {r.error && (
        <p>Equipment links are unavailable; any retained rows may be stale.</p>
      )}
      {!r.loading && !r.error && (
        <p>
          {r.items.length} unique permitted equipment records loaded
          {r.next ? "; more available" : ""}.
        </p>
      )}
      {[
        { label: "Installed here", match: (a: Equipment) => a.installed },
        { label: "Serves this area", match: (a: Equipment) => !!a.link_id },
      ].map((group) => (
        <section className="facility-section" key={group.label}>
          <h2>{group.label}</h2>
          {!r.loading && !r.error && !r.items.some(group.match) && (
            <p>
              {r.next
                ? "None in the loaded equipment page; more records are available."
                : "No linked equipment."}
            </p>
          )}
          {r.items.filter(group.match).map((a) => (
            <article key={a.id} className="facility-equipment">
              <h3>
                <Link href={`/equipment/${a.id}`}>
                  {a.description} · {a.display_number}
                </Link>
              </h3>
              <p>
                Installed: {a.installed_name ?? "Site only"} · Record ID {a.id}
              </p>
              {!!a.source && <p>Service source: {displayValue(a.source)}</p>}
              {f.can_edit && group.label === "Serves this area" && (
                <button
                  type="button"
                  className="secondary"
                  onClick={() => {
                    setEnd(a);
                    setReason("");
                  }}
                >
                  End service relationship
                </button>
              )}
            </article>
          ))}
        </section>
      ))}
      {r.next && (
        <button type="button" className="secondary" onClick={r.more}>
          More equipment
        </button>
      )}
      {f.can_edit && (
        <button
          type="button"
          className="secondary"
          disabled={addGuard.pending}
          onClick={() => {
            if (
              !adding ||
              !addGuard.dirty ||
              window.confirm("Discard the unsaved service relationship?")
            ) {
              setAdding((v) => !v);
              setAddGuard({ dirty: false, pending: false });
            }
          }}
        >
          {adding ? "Close equipment form" : "Add serving equipment"}
        </button>
      )}
      {adding && (
        <AddService
          facility={f}
          guard={setAddGuard}
          accepted={() => {
            setAdding(false);
            setAddGuard({ dirty: false, pending: false });
            r.reload();
          }}
        />
      )}
      {end && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void command.send(
              `assets/${end.id}/served-facilities/${end.link_id}/end`,
              { expected_version: end.version, reason },
            );
          }}
        >
          <h3>
            End {end.display_number} serving {String(f.details.name)}
          </h3>
          <p>Installation and the historical association remain unchanged.</p>
          <ErrorNotice error={command.error} />
          <fieldset disabled={command.busy || command.uncertain}>
            <Field
              name="end-reason"
              validationField="reason"
              label="Reason for ending"
              value={reason}
              maxLength={1000}
              required
              onChange={(v) => {
                setReason(v);
                command.dirty();
              }}
            />
            <button>Confirm end</button>
            <button
              type="button"
              className="secondary"
              onClick={() => {
                if (
                  !command.hasUnsavedChanges ||
                  window.confirm("Discard the unsaved ending reason?")
                ) {
                  setEnd(null);
                  command.discard();
                }
              }}
            >
              Cancel
            </button>
          </fieldset>
          {command.uncertain && (
            <button type="button" onClick={() => void command.reconcile()}>
              Check original action
            </button>
          )}
        </form>
      )}
      <section className="facility-section">
        <h2>Work & documents</h2>
        <p>Facility work links are not yet supported.</p>
        <p>Facility document links are not yet supported.</p>
        <p>
          <Link href={`/sites/${f.site_id}`}>Open Site context</Link> for
          broader Site records and access information.
        </p>
      </section>
    </>
  );
}
function AddService({
  facility: f,
  accepted,
  guard,
}: {
  facility: Facility;
  accepted: () => void;
  guard: (v: { dirty: boolean; pending: boolean }) => void;
}) {
  const [search, setSearch] = useState(""),
    [asset, setAsset] = useState(""),
    [source, setSource] = useState<SourceInput | null>(null),
    [reason, setReason] = useState("");
  const r = useCrmResource<Envelope<Equipment>>(
      `assets?site_id=${f.site_id}&q=${encodeURIComponent(search)}&limit=50`,
    ),
    selected = useCrmResource<Envelope<Equipment>>(
      asset ? `assets/${asset}` : null,
      true,
    ),
    command = useCrmCommand(accepted, "Unsaved", (pending) =>
      guard({ dirty: true, pending }),
    );
  const sources = useFacilityPages<Source>(`facilities/${f.id}/sources`);
  const options = [
    ...(selected.data?.items ?? []),
    ...(r.data?.items ?? []),
  ].filter((v, i, a) => a.findIndex((x) => x.id === v.id) === i);
  return (
    <form
      onChange={() => guard({ dirty: true, pending: false })}
      onSubmit={(e) => {
        e.preventDefault();
        if (selected.data?.items[0])
          void command.send(`assets/${asset}/served-facilities/add`, {
            expected_version: selected.data.items[0].version,
            facility_id: f.id,
            source,
            reason,
          });
      }}
    >
      <ValidationFields error={command.error}>
        <ErrorNotice error={command.error} />
        <fieldset disabled={command.busy || command.uncertain}>
          <h3>Record one service relationship</h3>
          <p>
            {f.site_name} / {String(f.details.name)} · {f.id}
          </p>
          <LookupField
            name="asset"
            label="Equipment"
            value={asset}
            onChange={(id) => {
              setAsset(id);
              command.dirty();
            }}
            search={search}
            onSearch={setSearch}
            options={options.map((a) => ({
              id: a.id,
              display_name: `${a.description} · ${a.id}`,
              display_number: a.display_number,
            }))}
            loading={r.loading}
            more={!!r.data?.next_cursor}
            error={!!r.error}
          />
          {selected.data && (
            <p>
              Installed Facility:{" "}
              {selected.data.items[0].facility_id ? (
                <Link
                  href={`/facilities/${selected.data.items[0].facility_id}`}
                >
                  {selected.data.items[0].facility_id}
                </Link>
              ) : (
                "Site only"
              )}
              . Installation is unchanged by this action.
            </p>
          )}
          <ReadState
            loading={sources.loading}
            error={sources.error}
            retry={sources.reload}
          />
          {sources.next && (
            <button type="button" className="secondary" onClick={sources.more}>
              Load more retained sources
            </button>
          )}
          <SourceField
            existing={sources.items}
            name="service_source"
            label="Service relationship source"
            value={source}
            onChange={(v) => {
              setSource(v);
              command.dirty();
            }}
          />
          <Field
            name="service-reason"
            validationField="reason"
            label="Relationship reason"
            value={reason}
            required
            maxLength={1000}
            onChange={(v) => {
              setReason(v);
              command.dirty();
            }}
          />
          <button disabled={!selected.data}>Add service relationship</button>
        </fieldset>
        <p role="status">{command.status}</p>
        {command.uncertain && (
          <button type="button" onClick={() => void command.reconcile()}>
            Check original action
          </button>
        )}
      </ValidationFields>
    </form>
  );
}
type Event = {
  id: string;
  reason: string;
  occurred_at: string;
  actor: string;
  details: {
    command?: string;
    record_version?: number;
    changes?: {
      field: string;
      label: string;
      before: unknown;
      after: unknown;
    }[];
    after?: Record<string, unknown>;
    context_observation?: boolean;
  };
};
function FacilityHistory({ id, timezone }: { id: string; timezone: string }) {
  const r = useFacilityPages<Event>(`facilities/${id}/history`);
  return (
    <>
      <h2>Immutable change history</h2>
      <ReadState loading={r.loading} error={r.error} retry={r.reload} />
      {!r.loading && !r.error && !r.items.length && (
        <p>
          No retained command events are available for this legacy or authored
          fixture record.
        </p>
      )}
      {r.items.map((e) => (
        <article className="facility-history" key={e.id}>
          <h3>
            {e.details.command?.replace(/([a-z])([A-Z])/g, "$1 $2") ??
              "Recorded change"}{" "}
            · Version {e.details.record_version}
          </h3>
          <p>{e.reason}</p>
          <p>
            Recorded by {e.actor} ·{" "}
            <Stamp value={e.occurred_at} timezone={timezone} />
          </p>
          {e.details.context_observation && (
            <p>
              Context observation retained separately from the recording
              instant.
            </p>
          )}
          <dl>
            {e.details.changes?.map((c) => (
              <div key={c.field}>
                <dt>{c.label}</dt>
                <dd>
                  {displayValue(c.before, c.field)} →{" "}
                  {displayValue(c.after, c.field)}
                </dd>
              </div>
            )) ??
              Object.entries(e.details.after ?? {})
                .filter(([, v]) => v !== null)
                .map(([key, value]) => (
                  <div key={key}>
                    <dt>{fields[key]?.label ?? key}</dt>
                    <dd>{displayValue(value, key)}</dd>
                  </div>
                ))}
          </dl>
          <small>Event {e.id}</small>
        </article>
      ))}
      {r.next && (
        <button type="button" className="secondary" onClick={r.more}>
          More history
        </button>
      )}
    </>
  );
}
