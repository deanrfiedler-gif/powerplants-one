"use client";
import Link from "next/link";
import type { OperationReceipt } from "../platform/operations";
import { useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  FacilityRecordLayout,
  FacilityPath,
  FacilitySnapshotDetails,
  FacilityOverviewCards,
} from "./facility-record-layout";
import { Button, ButtonLink } from "./ui/button";
import { usePhoneHeader } from "../shell/phone-header";
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
  const r = useCrmResource<Facility>(`facilities/${id}/workspace`, true),
    params = useSearchParams();
  const [tab, setTab] = useState(
      ["equipment", "sources", "history"].includes(params.get("tab") ?? "")
        ? params.get("tab")!
        : "overview",
    ),
    [pin, setPin] = useState(false);
  const [pinGuard, setPinGuard] = useState({ dirty: false, pending: false });
  const f = r.data;
  usePhoneHeader(
    compact
      ? null
      : { title: f ? String(f.details.name) : "Facility", record: {} },
  );
  const selectTab = (value: string) => {
    if (
      pinGuard.pending ||
      (pinGuard.dirty && !window.confirm("Discard the unsaved pin proposal?"))
    )
      return;
    setTab(value);
    setPin(false);
    setPinGuard({ dirty: false, pending: false });
  };
  if (!f)
    return <ReadState loading={r.loading} error={r.error} retry={r.reload} />;
  if (compact)
    return (
      <div className="facility-snapshot">
        <Button
          className="facility-snapshot-close"
          aria-label="Close facility snapshot"
          onClick={onClose}
        >
          ×
        </Button>
        <div className="facility-snapshot-left">
          <header>
            <h2>{String(f.details.name)}</h2>
            <p>
              <FacilityPath facility={f} /> · version {f.version}
            </p>
          </header>
          <FacilitySnapshotDetails facility={f} />
          <footer className="facility-actions">
            <ButtonLink href={`/sites/${f.site_id}`}>Open site</ButtonLink>
            <ButtonLink variant="primary" href={`/facilities/${id}`}>
              Open facility
            </ButtonLink>
          </footer>
        </div>
        <div className="facility-snapshot-right">
          <FacilityEquipment facility={f} compact />
          <FacilityHistory id={id} timezone={f.timezone} compact />
        </div>
      </div>
    );
  return (
    <FacilityRecordLayout facility={f}>
      <RecordTabs
        id="facility"
        label="Facility record"
        value={tab}
        onChange={selectTab}
        tabs={[
          { id: "overview", label: "Overview" },
          { id: "equipment", label: "Equipment" },
          { id: "sources", label: "Sources" },
          { id: "history", label: "History" },
        ]}
      />
      <div className="facility-record-scroll">
        <RecordPanel id="facility" tab="overview" value={tab}>
          <FacilityOverviewCards
            facility={f}
            onSources={() => selectTab("sources")}
          />
        </RecordPanel>
        <RecordPanel id="facility" tab="equipment" value={tab}>
          {tab === "equipment" && (
            <>
              <FacilityEquipment facility={f} />
              <details className="facility-legacy-controls">
                <summary>Manage service links</summary>
                <FacilityRelated facility={f} />
              </details>
            </>
          )}
        </RecordPanel>
        <RecordPanel id="facility" tab="sources" value={tab}>
          {tab === "sources" && (
            <>
              <FacilityOverview facility={f} />
              {f.can_edit && (
                <Button
                  onClick={() => {
                    if (
                      !pinGuard.pending &&
                      (!pinGuard.dirty ||
                        window.confirm("Discard the unsaved pin proposal?"))
                    )
                      setPin(!pin);
                  }}
                >
                  {pin
                    ? "Close pin form"
                    : f.pin
                      ? "Review location pin"
                      : "Record location pin"}
                </Button>
              )}
              {pin && (
                <PinForm facility={f} reload={r.reload} guard={setPinGuard} />
              )}
            </>
          )}
        </RecordPanel>
        <RecordPanel id="facility" tab="history" value={tab}>
          {tab === "history" && (
            <FacilityHistory id={id} timezone={f.timezone} />
          )}
        </RecordPanel>
      </div>
    </FacilityRecordLayout>
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
  serves?: { id: string; name: string }[];
  serving_since?: string;
};
function FacilityEquipment({
  facility: f,
  compact = false,
}: {
  facility: Facility;
  compact?: boolean;
}) {
  const current = useFacilityPages<Equipment>(`facilities/${f.id}/equipment`);
  const ended = useFacilityPages<{
    id: string;
    equipment_id: string;
    description: string;
    display_number: string;
    installed_name: string | null;
    ended_at: string;
    end_reason: string;
    ended_by_name: string;
  }>(`facilities/${f.id}/equipment?state=ended`);
  if (compact)
    return (
      <section className="facility-snapshot-equipment facility-card">
        <h2>Equipment</h2>
        <ReadState
          loading={current.loading || ended.loading}
          error={current.error || ended.error}
          retry={() => {
            current.reload();
            ended.reload();
          }}
        />
        {!current.loading &&
          !ended.loading &&
          !current.error &&
          !ended.error && (
            <>
              <p>
                {current.items.filter((a) => a.installed).length} installed here
                · {current.items.filter((a) => a.link_id).length} serve this
                area · {ended.items.length} ended
                {current.next || ended.next ? " (loaded records)" : ""}
              </p>
              {current.items.map((a) => (
                <div className="facility-snapshot-equipment-row" key={a.id}>
                  <Link href={`/equipment/${a.id}`}>{a.description}</Link> ·{" "}
                  {a.installed ? "installed here" : "serves this area"}
                  <small>
                    {a.installed
                      ? "Serves "
                      : `Installed in ${a.installed_name ?? "site only"} · serves `}
                    {a.serves?.map((s) => s.name).join(", ") ||
                      "no recorded areas"}
                  </small>
                </div>
              ))}
              {ended.items.map((a) => (
                <div
                  className="facility-snapshot-equipment-row facility-meta"
                  key={a.id}
                >
                  {a.description} · service ended{" "}
                  <Stamp value={a.ended_at} timezone={f.timezone} />
                  <small>
                    Reason: {a.end_reason} · {a.ended_by_name}
                  </small>
                </div>
              ))}
              {current.next && (
                <Button onClick={current.more}>More equipment</Button>
              )}
              {ended.next && (
                <Button onClick={ended.more}>More ended links</Button>
              )}
            </>
          )}
      </section>
    );
  return (
    <section className="facility-equipment-view">
      <h2>Equipment for this area</h2>
      <p className="facility-banner">
        “Installed in” is where the equipment physically is. “Serves” is an
        explicit link to each area it controls or supplies. Each is changed on
        its own and neither is inferred from the other.
      </p>
      <ReadState
        loading={current.loading || ended.loading}
        error={current.error || ended.error}
        retry={() => {
          current.reload();
          ended.reload();
        }}
      />
      {!current.loading && !ended.loading && !current.error && !ended.error && (
        <>
          <div className="facility-table-scroll">
            <table className="facility-equipment-table">
              <thead>
                <tr>
                  <th>Equipment</th>
                  <th>Installed in</th>
                  <th>Serves</th>
                  <th>This area</th>
                </tr>
              </thead>
              {[
                {
                  label: "Installed here",
                  items: current.items.filter((a) => a.installed),
                },
                {
                  label: "Serves this area, installed elsewhere",
                  items: current.items.filter((a) => !a.installed && a.link_id),
                },
              ].map((group) => (
                <tbody key={group.label}>
                  <tr className="facility-group-band">
                    <th colSpan={4}>
                      {group.label} · {group.items.length}
                      {current.next ? " loaded" : ""}
                    </th>
                  </tr>
                  {group.items.map((a) => (
                    <tr key={a.id}>
                      <td>
                        <Link href={`/equipment/${a.id}`}>{a.description}</Link>
                      </td>
                      <td>{a.installed_name ?? "Site only"}</td>
                      <td>
                        {a.serves?.length
                          ? a.serves.map((s, i) => (
                              <span key={s.id}>
                                {i > 0 ? ", " : ""}
                                <Link href={`/facilities/${s.id}`}>
                                  {s.name}
                                </Link>
                              </span>
                            ))
                          : "No recorded service links"}
                      </td>
                      <td>
                        {a.installed
                          ? a.link_id
                            ? "Installed and serves"
                            : "Installed only"
                          : "Serves this area"}
                      </td>
                    </tr>
                  ))}
                  {!group.items.length && (
                    <tr>
                      <td colSpan={4}>
                        {current.next
                          ? "None in the loaded page; more equipment is available."
                          : "No linked equipment."}
                      </td>
                    </tr>
                  )}
                </tbody>
              ))}
              <tbody>
                <tr className="facility-group-band">
                  <th colSpan={4}>
                    Service ended · {ended.items.length}
                    {ended.next ? " loaded" : ""}
                  </th>
                </tr>
                {ended.items.map((a) => (
                  <tr key={a.id}>
                    <td>
                      <Link href={`/equipment/${a.equipment_id}`}>
                        {a.description}
                      </Link>
                    </td>
                    <td>{a.installed_name ?? "Site only or unavailable"}</td>
                    <td>Ended for this area</td>
                    <td>
                      <Stamp value={a.ended_at} timezone={f.timezone} />
                    </td>
                  </tr>
                ))}
                {!ended.items.length && (
                  <tr>
                    <td colSpan={4}>No ended service links.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {ended.items.map((a) => (
            <p className="facility-meta" key={a.id}>
              {a.description}: {a.end_reason} · {a.ended_by_name}
            </p>
          ))}
          <div className="facility-actions">
            {current.next && (
              <Button onClick={current.more}>More equipment</Button>
            )}
            {ended.next && (
              <Button onClick={ended.more}>More ended links</Button>
            )}
            <Link href={`/equipment?site_id=${f.site_id}`}>
              Open the equipment register for {f.site_name}
            </Link>
          </div>
        </>
      )}
    </section>
  );
}
function FacilityRelated({ facility: f }: { facility: Facility }) {
  const r = useFacilityPages<Equipment>(`facilities/${f.id}/equipment`),
    [adding, setAdding] = useState(false),
    [addGuard, setAddGuard] = useState({ dirty: false, pending: false }),
    [end, setEnd] = useState<Equipment | null>(null),
    [reason, setReason] = useState("");
  const [acceptedAction, setAcceptedAction] = useState<OperationReceipt | null>(
    null,
  );
  const command = useCrmCommand((receipt) => {
    setAcceptedAction(receipt);
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
      {acceptedAction && (
        <p role="status">
          Saved to the server. Equipment version {acceptedAction.record_version}
          . Operation {acceptedAction.operation_id}.
        </p>
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
          accepted={(receipt) => {
            setAcceptedAction(receipt);
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
  accepted: (receipt: OperationReceipt) => void;
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
function FacilityHistory({
  id,
  timezone,
  compact = false,
}: {
  id: string;
  timezone: string;
  compact?: boolean;
}) {
  const r = useFacilityPages<Event>(`facilities/${id}/history`);
  if (compact)
    return (
      <section className="facility-snapshot-history">
        <h2>History</h2>
        <ReadState loading={r.loading} error={r.error} retry={r.reload} />
        {!r.loading && !r.error && !r.items.length && (
          <p>No retained changes.</p>
        )}
        {r.items.map((e) => (
          <article key={e.id}>
            <p>{e.reason}</p>
            <small>
              <Stamp value={e.occurred_at} timezone={timezone} /> · {e.actor}
            </small>
          </article>
        ))}
        {r.next && <Button onClick={r.more}>More history</Button>}
      </section>
    );
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
