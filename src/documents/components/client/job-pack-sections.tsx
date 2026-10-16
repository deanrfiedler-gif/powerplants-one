"use client";
import Link from "next/link";
import { sectionKeys, type SectionKey } from "../../validation";
import {
  formatDate,
  formatStamp,
  packSectionShortTitles,
  packSectionTitles,
  visitWindow,
  type BasisDrift,
} from "../../pack-view";
import type { Pack, PackParts, PackRevision } from "./job-pack-types";
import { Badge, Icon, Pair, Person } from "./job-pack-ui";
import { readSection } from "../../section-readers";
import { SectionParts } from "./job-pack-section-parts";

export const sectionId = (prefix: "s" | "p", key: SectionKey) =>
  `${prefix}-${sectionKeys.indexOf(key) + 1}`;
// Exact identities stay exact in the issued manifest; on the page a long one is abbreviated.
const short = (value: string) =>
  value.length > 16 ? value.slice(0, 12) + "…" : value;
export const sectionNumber = (key: SectionKey) =>
  String(sectionKeys.indexOf(key) + 1).padStart(2, "0");
const number = sectionNumber;

// Which linked records each section's frozen context was composed from.
export const sectionSources: Record<SectionKey, BasisDrift["source"][]> = {
  identification: ["Work order", "Appointment", "Customer record"],
  customer_arrangements: ["Site record", "Appointment", "Customer record"],
  scope: ["Work order"],
  equipment: ["Work order"],
  history: [],
  technical_information: [],
  readiness: ["Work order", "Appointment"],
  site_controls: ["Site record", "Work order"],
  completion: ["Work order", "Pack template"],
};
const entryTags: Partial<Record<SectionKey, string>> = {
  history: "Selected from service history",
  technical_information: "Selected exact document versions",
};
const noteHeadings: Record<SectionKey, string> = {
  identification: "Visit identification notes",
  customer_arrangements: "Visit arrangements",
  scope: "Technician briefing",
  equipment: "Equipment verification notes",
  history: "History review notes",
  technical_information: "Technical reference notes",
  readiness: "Collection and preparation instructions",
  site_controls: "Work arrangements",
  completion: "Escalation and remaining work",
};

export function SourceTag({
  section,
  revision,
  drift,
}: {
  section: SectionKey;
  revision: PackRevision;
  drift: BasisDrift[];
}) {
  const s = revision.snapshot,
    zone = s.appointment.timezone,
    entry = entryTags[section];
  if (entry)
    return (
      <span className="jp-source-tag">
        <Icon name="edit" />
        <span>{entry}</span>
      </span>
    );
  const sources = sectionSources[section],
    changed = drift.some((d) => sources.includes(d.source)),
    versions: Record<string, string> = {
      "Work order": `work order v${s.work.version} · scope v${s.work.scope_version}`,
      Appointment: `appointment v${s.appointment.version}`,
      "Site record": `site record v${s.site.version}`,
      "Customer record": `customer record v${s.customer.version}`,
      "Pack template": `template v${s.template.version}`,
    };
  return (
    <span className={`jp-source-tag${changed ? " changed" : ""}`}>
      <Icon name={changed ? "warning" : "source"} />
      <span>
        From {sources.map((x) => versions[x]).join(" + ")}
        <span className="jp-as-at">
          as at {formatStamp(revision.created_at, zone)}
          {changed ? " · changed since this revision" : ""}
        </span>
      </span>
    </span>
  );
}

export function ChangedSectionSources({
  section,
  drift,
}: {
  section: SectionKey;
  drift: BasisDrift[];
}) {
  const changes = drift.filter((item) =>
    sectionSources[section].includes(item.source),
  );
  if (!changes.length) return null;
  return (
    <div className="jp-section-changes" aria-label="Source version comparison">
      <strong>Review changed sources</strong>
      <p>
        The saved content below is retained. Saving composes a new revision from
        current records.
      </p>
      {changes.map((item) => (
        <div className="jp-source-comparison" key={item.field}>
          <span>
            {item.source} · {item.label}
          </span>
          <dl>
            <div>
              <dt>Saved revision</dt>
              <dd>{item.from}</dd>
            </div>
            <div>
              <dt>Current source</dt>
              <dd>{item.to ?? "Current source unavailable"}</dd>
            </div>
          </dl>
        </div>
      ))}
    </div>
  );
}

function Identification({
  revision,
  appointmentId,
  staff,
}: {
  revision: PackRevision;
  appointmentId: string;
  staff: boolean;
}) {
  const s = revision.snapshot,
    a = s.appointment;
  return (
    <dl className="jp-info-grid">
      <Pair label="Customer">{s.customer.name}</Pair>
      <Pair label="Service site">{s.site.name}</Pair>
      <Pair label="Work order">
        {s.work.reference} · v{s.work.version}
      </Pair>
      <Pair label="Appointment">
        {staff ? (
          <Link href={`/service/appointments/${appointmentId}`}>
            {a.reference}
          </Link>
        ) : (
          a.reference
        )}{" "}
        · v{a.version}
      </Pair>
      <Pair label="Visit window" wide>
        {formatDate(a.start_at, a.timezone, true)}
        <br />
        {visitWindow(a.start_at, a.end_at, a.timezone)}
      </Pair>
      <Pair label="Assigned crew" wide>
        <span className="jp-button-row">
          {s.recipients.map((r) => (
            <span key={r.assignment_id} className="jp-button-row">
              <Person name={r.name} />
              <Badge>{r.role}</Badge>
            </span>
          ))}
        </span>
      </Pair>
    </dl>
  );
}

// The frozen context of one section, without its heading or the coordinator's notes. The Job pack view
// shows it under the section title; the Preparation view shows the same body as linked context beside the
// field, so a coordinator writes against exactly what the last save froze.
export function SectionBody({
  section,
  pack,
  revision,
}: {
  section: SectionKey;
  pack: Pack;
  revision: PackRevision;
}) {
  const s = revision.snapshot,
    frozen = s.sections[section];
  if (section === "identification")
    return (
      <Identification
        revision={revision}
        appointmentId={pack.appointment_id}
        staff={
          pack.actions.can_prepare ||
          pack.actions.can_check ||
          pack.actions.can_issue
        }
      />
    );
  const structured = readSection(section, s, revision.id, pack.section_view);
  if (structured)
    return (
      <>
        <SectionParts section={structured} zone={s.appointment.timezone} />
        <details className="jp-exact">
          <summary>Exact text as it will be issued</summary>
          <p className="jp-body-copy">{frozen.text}</p>
        </details>
      </>
    );
  if (section === "technical_information")
    return (
      <>
        {s.sources.map((d) => (
          <div className="jp-document-row" key={d.id}>
            <span className="jp-doc-icon">
              <Icon name="document" />
            </span>
            <div className="jp-doc-main">
              {d.title}
              <small>
                Version {short(d.version_id)} · SHA-256 {short(d.hash)} ·{" "}
                {d.byte_count} bytes
              </small>
            </div>
          </div>
        ))}
        <details className="jp-exact">
          <summary>Exact source text as it will be issued</summary>
          <p className="jp-body-copy">{frozen.text}</p>
        </details>
      </>
    );
  return <p className="jp-body-copy">{frozen.text}</p>;
}

function Section({
  section,
  pack,
  revision,
}: {
  section: SectionKey;
  pack: Pack;
  revision: PackRevision;
}) {
  const frozen = revision.snapshot.sections[section],
    id = sectionId("s", section);
  return (
    <section
      id={id}
      className="jp-paper-section"
      tabIndex={-1}
      aria-labelledby={`${id}-title`}
      data-section={section}
    >
      <div className="jp-section-head">
        <h2 id={`${id}-title`}>
          <span className="jp-section-number">{number(section)}</span>
          {packSectionTitles[section]}
        </h2>
        <SourceTag
          section={section}
          revision={revision}
          drift={pack.basis_drift ?? []}
        />
      </div>
      <SectionBody section={section} pack={pack} revision={revision} />
      <p className="jp-subheading">{noteHeadings[section]}</p>
      <p className="jp-body-copy">{frozen.notes}</p>
      {section === "readiness" && pack.readiness.parts && (
        <LiveParts parts={pack.readiness.parts} />
      )}
    </section>
  );
}
// A1-D4. Live part readiness beside the issued text. It is read from Supply Chain at every view and is
// never part of the issued pack, its hash or OUT-09 (R9).
function LiveParts({ parts }: { parts: PackParts }) {
  const ready = "Ready for the stated material scope";
  return (
    <div
      className="jp-live-parts"
      role="note"
      aria-label="Parts readiness now, from Supply Chain"
    >
      <p className="jp-live-heading">
        Parts readiness now · from Supply Chain, not part of the issued pack
      </p>
      {parts.lines.length ? (
        <ul>
          {parts.lines.map((l) => (
            <li key={l.id}>
              <span>
                {l.title} · {l.quantity} {l.unit}
              </span>
              <small className={l.state === ready ? "ready" : "attention"}>
                {l.state === ready
                  ? "ready"
                  : `${l.state.toLowerCase()}${l.promised_on ? ` · promised ${l.promised_on}` : ""}`}
              </small>
            </li>
          ))}
        </ul>
      ) : (
        <p className="jp-body-copy">{parts.summary}.</p>
      )}
      {parts.unlinked.length > 0 && (
        <p className="jp-body-copy">
          Not linked to this visit:{" "}
          {parts.unlinked.map((d) => d.title).join("; ")}.
        </p>
      )}
    </div>
  );
}

export function PackSections({
  pack,
  revision,
}: {
  pack: Pack;
  revision: PackRevision;
}) {
  return (
    <>
      {sectionKeys.map((k) => (
        <Section key={k} section={k} pack={pack} revision={revision} />
      ))}
    </>
  );
}

export function ContentsRail({
  prefix,
  title,
  label,
  current,
  flagged,
  onJump,
  foot,
}: {
  prefix: "s" | "p";
  title: string;
  label: string;
  current: string;
  flagged: SectionKey[];
  onJump: (id: string) => void;
  foot: React.ReactNode;
}) {
  return (
    <aside className="jp-contents" aria-label={title}>
      <h2 className="jp-rail-title">{title.toUpperCase()}</h2>
      <nav aria-label={label}>
        {sectionKeys.map((k) => {
          const id = sectionId(prefix, k);
          return (
            <a
              key={k}
              href={`#${id}`}
              aria-current={current === id ? "true" : undefined}
              onClick={(e) => {
                e.preventDefault();
                onJump(id);
              }}
            >
              <span className="jp-nav-number">{number(k)}</span>
              <span>{packSectionShortTitles[k]}</span>
              {flagged.includes(k) && (
                <>
                  <Icon name="warning" />
                  <span className="jp-sr">Needs attention</span>
                </>
              )}
            </a>
          );
        })}
      </nav>
      <label className="jp-mobile-jump">
        Jump to a section
        <select
          aria-label={`Jump to ${label.toLowerCase()}`}
          value={current}
          onChange={(e) => onJump(e.target.value)}
        >
          {sectionKeys.map((k) => (
            <option key={k} value={sectionId(prefix, k)}>
              {number(k)} · {packSectionTitles[k]}
              {flagged.includes(k) ? " ⚠ needs attention" : ""}
            </option>
          ))}
        </select>
      </label>
      <p className="jp-rail-foot">{foot}</p>
    </aside>
  );
}
