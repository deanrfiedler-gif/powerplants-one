"use client";
import Link from "next/link";
import type { ReactNode } from "react";
import { Stamp } from "./business-ui";
import { CopyId } from "./facility-controls";
import { ButtonLink } from "./ui/button";
import { RegisterChip } from "./ui/register-table";
import { ShellIcon } from "./shell-icon";
import {
  displayValue,
  mapUrl,
  type Facility,
  type Source,
} from "../shared/facilities/definition";
import { measurement } from "../shared/facilities/presentation";
import { usePublishRecordIdentity } from "../shell/record-identity";

export function FacilityPath({ facility: f }: { facility: Facility }) {
  return (
    <>
      <Link href={`/sites/${f.site_id}`}>{f.site_name}</Link>
      {f.path.map((a) => (
        <span key={a.id}>
          {" "}
          › <Link href={`/facilities/${a.id}`}>{a.name}</Link>
        </span>
      ))}{" "}
      › {String(f.details.name)}
    </>
  );
}
export function FacilityRecordLayout({
  facility: f,
  children,
  editing = false,
}: {
  facility: Facility;
  children: ReactNode;
  editing?: boolean;
}) {
  usePublishRecordIdentity(String(f.details.name), String(f.details.name));
  return (
    <div className="facility-workspace facility-record">
      <h1 className="sr-only facility-phone-title">{String(f.details.name)}</h1>
      <header className="facility-record-header">
        <div className="facility-record-title">
          <h1>{String(f.details.name)}</h1>
          <RegisterChip tone="neutral">
            {displayValue(f.details.structure_type, "structure_type")}
          </RegisterChip>
          <div className="facility-actions">
            <ButtonLink href={`/sites/${f.site_id}`}>Open site</ButtonLink>
            {f.can_edit && !editing && (
              <ButtonLink variant="primary" href={`/facilities/${f.id}/edit`}>
                Correct details
              </ButtonLink>
            )}
          </div>
        </div>
        <div className="facility-record-meta">
          <FacilityPath facility={f} /> · {f.updated_by_name ?? f.updated_by} ·
          changed <Stamp value={f.updated_at} timezone={f.timezone} /> · Record
          ID <CopyId id={f.id} /> · version {f.version}
        </div>
      </header>
      <div className="facility-recorded">
        <strong>Details recorded</strong>
        {(
          [
            [
              "Structure type",
              f.details.structure_type &&
                f.details.structure_type !== "unknown",
            ],
            [
              "Use and crop",
              !!f.details.use &&
                f.details.use !== "unknown" &&
                !!f.details.crop,
            ],
            ["On-site position", !!f.details.on_site_position],
            ["Footprint", f.details.footprint_m2 !== null],
          ] as [string, unknown][]
        ).map(([label, value]) => (
          <span key={String(label)}>
            {value ? <ShellIcon name="check" /> : <ShellIcon name="help" />}
            {label}
            {!value && " not recorded"}
          </span>
        ))}
        <span className="facility-attention">
          {f.pin?.state === "confirmed" ? "Pin checked" : "Pin not checked"}
        </span>
        <span>
          Measurements {displayValue(f.details.measurement_basis).toLowerCase()}
        </span>
      </div>
      <div className="facility-phone-summary">
        <RegisterChip tone="neutral">
          {displayValue(f.details.structure_type, "structure_type")}
        </RegisterChip>
        <span>
          {displayValue(f.details.use, "use")} · {displayValue(f.details.crop)}
        </span>
      </div>
      <div className="facility-record-columns">
        <aside className="facility-record-details">
          <FacilityAreaDetails facility={f} />
        </aside>
        <div className="facility-record-main">{children}</div>
      </div>
      {!editing && (
        <footer className="facility-phone-footer">
          <ButtonLink href={`/sites/${f.site_id}`}>Open site</ButtonLink>
          {f.can_edit && (
            <ButtonLink variant="primary" href={`/facilities/${f.id}/edit`}>
              Correct details
            </ButtonLink>
          )}
        </footer>
      )}
    </div>
  );
}
export function FacilityAreaDetails({ facility: f }: { facility: Facility }) {
  const rows: [string, ReactNode][] = [
    [
      "Site",
      <Link key="site" href={`/sites/${f.site_id}`}>
        {f.site_name}
      </Link>,
    ],
    [
      "Within",
      f.path.length ? (
        <Link key="parent" href={`/facilities/${f.path.at(-1)!.id}`}>
          {f.path.at(-1)!.name}
        </Link>
      ) : (
        "Directly under site"
      ),
    ],
    [
      "Relationship",
      displayValue(f.details.parent_relationship, "parent_relationship"),
    ],
    ["Structure", displayValue(f.details.structure_type, "structure_type")],
    [
      "Cladding",
      displayValue(f.details.greenhouse_cladding, "greenhouse_cladding"),
    ],
    ["Bay count", displayValue(f.details.bay_count)],
    ["Use", displayValue(f.details.use, "use")],
    ["Crop / crop group", displayValue(f.details.crop)],
  ];
  return (
    <>
      <section>
        <h2>Area</h2>
        <dl>
          {rows.map(([label, value]) => (
            <div key={label}>
              <dt>{label}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>
      </section>
      <section>
        <h2>Location</h2>
        <dl>
          <div>
            <dt>On-site position</dt>
            <dd>{displayValue(f.details.on_site_position)}</dd>
          </div>
          <div>
            <dt>Location source</dt>
            <dd>
              {(f.details.location_source as Source | null)?.title ??
                "Not recorded"}
            </dd>
          </div>
          <div>
            <dt>Pin</dt>
            <dd>
              {f.pin
                ? f.pin.state === "confirmed"
                  ? "Checked"
                  : "Proposed, not checked"
                : "Not recorded"}
            </dd>
          </div>
        </dl>
        <p>
          Map handoff only: open the pin in external maps and check it with the
          grower. PPO shows no map and does not verify an arrival point.
        </p>
        {f.pin && (
          <a href={mapUrl(f.pin)!} target="_blank" rel="noopener noreferrer">
            Open pin in maps
          </a>
        )}
      </section>
      <section>
        <h2>Site context</h2>
        <Link href={`/sites/${f.site_id}`}>{f.site_name}</Link>
        <p>
          Access, biosecurity, readiness and visits are kept on the site. Work
          is not linked to individual areas.
        </p>
      </section>
    </>
  );
}
function SourceRow({
  source,
  onSources,
}: {
  source: Source | null;
  onSources: () => void;
}) {
  return (
    <div className="facility-card-row">
      <ShellIcon name="documents" />
      <div>
        <strong>
          {source ? `Source: ${source.title}` : "Source not recorded"}
        </strong>
        {source && (
          <small>
            Reported note · {source.source_date ?? "Date not recorded"} · source
            version {source.version}
          </small>
        )}
      </div>
      {source && (
        <button
          type="button"
          className="facility-text-action"
          onClick={onSources}
        >
          View source
        </button>
      )}
    </div>
  );
}
export function FacilityOverviewCards({
  facility: f,
  onSources,
}: {
  facility: Facility;
  onSources: () => void;
}) {
  return (
    <>
      {!f.can_edit && (
        <p className="facility-banner">
          View only. You can see {String(f.details.name)} because you can see{" "}
          {f.site_name}. Correcting details or linking equipment needs edit
          access to the site; areas have no separate access.
        </p>
      )}
      <section className="facility-card">
        <div className="facility-card-heading">
          <h2>Measurements</h2>
          <RegisterChip tone="neutral">
            {displayValue(f.details.measurement_basis, "measurement_basis")}
          </RegisterChip>
          <small>
            Observed {displayValue(f.details.measurement_observed_on)}
          </small>
        </div>
        <p className="facility-card-description">
          Each value is optional and stands alone. Nothing is totalled from the
          parts, and a value that was not recorded stays “Not recorded”, never
          zero.
        </p>
        <div className="facility-card-row">
          <ShellIcon name="engineering" />
          <div>
            <strong>
              Footprint {measurement(f.details.footprint_m2, " m²")}
            </strong>
            <small>
              Approximate length {measurement(f.details.length_m, " m")} · width{" "}
              {measurement(f.details.width_m, " m")} · maximum height{" "}
              {measurement(f.details.maximum_height_m, " m")}
            </small>
          </div>
          {f.can_edit && <Link href={`/facilities/${f.id}/edit`}>Correct</Link>}
        </div>
        <SourceRow
          source={f.details.measurement_source as Source | null}
          onSources={onSources}
        />
        <p className="facility-card-foot">
          A correction shows saved and proposed values side by side before it
          saves a new version.
        </p>
      </section>
      <div className="facility-growing-context">
        <h2 className="facility-section-heading">
          Growing context{" "}
          <small>dated observation, not a live crop record</small>
        </h2>
        <section className="facility-card">
          <div className="facility-card-row">
            <ShellIcon name="sites" />
            <div>
              <strong>
                {displayValue(f.details.use, "use")} ·{" "}
                {displayValue(f.details.crop)}
              </strong>
              <small>
                Season label: {displayValue(f.details.season_label)} · observed{" "}
                {displayValue(f.details.context_observed_on)} (site time)
              </small>
            </div>
            {f.can_edit && (
              <Link href={`/facilities/${f.id}/edit`}>Correct</Link>
            )}
          </div>
          <SourceRow
            source={f.details.context_source as Source | null}
            onSources={onSources}
          />
        </section>
      </div>
      <div className="facility-phone-location">
        <h2 className="facility-section-heading">
          Location <small>on this site</small>
        </h2>
        <section className="facility-card">
          <div className="facility-card-row">
            <ShellIcon name="sites" />
            <div>
              <strong>{displayValue(f.details.on_site_position)}</strong>
              <small>
                {(f.details.location_source as Source | null)?.title ??
                  "Source not recorded"}
              </small>
            </div>
          </div>
          <div className="facility-card-row">
            <ShellIcon name="sites" />
            <div>
              <strong>
                {f.pin
                  ? f.pin.state === "confirmed"
                    ? "Pin checked"
                    : "Pin proposed, not checked"
                  : "Pin not recorded"}
              </strong>
              <small>External maps · handoff only</small>
            </div>
            {f.pin && (
              <a
                href={mapUrl(f.pin)!}
                target="_blank"
                rel="noopener noreferrer"
              >
                Maps
              </a>
            )}
          </div>
          {f.path.length > 0 && (
            <div className="facility-card-row">
              <ShellIcon name="sites" />
              <div>
                <strong>Within {f.path.at(-1)!.name}</strong>
                <small>
                  {displayValue(
                    f.details.parent_relationship,
                    "parent_relationship",
                  )}{" "}
                  · nothing inherited
                </small>
              </div>
              <Link href={`/facilities/${f.path.at(-1)!.id}`}>Open</Link>
            </div>
          )}
          <div className="facility-card-row">
            <ShellIcon name="sites" />
            <div>
              <strong>{f.site_name}</strong>
              <small>Access, readiness and visits are on the site</small>
            </div>
            <Link href={`/sites/${f.site_id}`}>Site</Link>
          </div>
        </section>
      </div>
      <p className="facility-banner facility-estimate-note">
        Estimating keeps its own copy of this area’s name and version. A change
        here never reprices an estimate, grants permission to work or approves
        technical design.
      </p>
    </>
  );
}
