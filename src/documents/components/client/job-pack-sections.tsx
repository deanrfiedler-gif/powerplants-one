"use client";
import { sectionKeys, type SectionKey } from "../../validation";
import {
  formatDate,
  formatStamp,
  packSectionShortTitles,
  packSectionTitles,
  visitWindow,
  type BasisDrift,
} from "../../pack-view";
import type { Pack, PackRevision } from "./job-pack-types";
import { Badge, Icon, Pair, Person } from "./job-pack-ui";

export const sectionId = (prefix: "s" | "p", key: SectionKey) =>
  `${prefix}-${sectionKeys.indexOf(key) + 1}`;
// Exact identities stay exact in the issued manifest; on the page a long one is abbreviated.
const short = (value: string) =>
  value.length > 16 ? value.slice(0, 12) + "…" : value;
const number = (key: SectionKey) =>
  String(sectionKeys.indexOf(key) + 1).padStart(2, "0");

// Which linked records each section's frozen context was composed from.
export const sectionSources: Record<SectionKey, BasisDrift["source"][]> = {
  identification: ["Work order", "Appointment"],
  customer_arrangements: ["Site record", "Appointment"],
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

function SourceTag({
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

function Identification({ revision }: { revision: PackRevision }) {
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
        {a.reference} · v{a.version}
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

function Section({
  section,
  pack,
  revision,
}: {
  section: SectionKey;
  pack: Pack;
  revision: PackRevision;
}) {
  const s = revision.snapshot,
    frozen = s.sections[section],
    id = sectionId("s", section),
    selected = s.history
      .map((h) => pack.history.find((x) => x.id === h.id))
      .filter((x): x is Pack["history"][number] => !!x);
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
      {section === "identification" ? (
        <Identification revision={revision} />
      ) : section === "history" &&
        s.history.length > 0 &&
        selected.length === s.history.length ? (
        selected.map((h) => (
          <article className="jp-history-item" key={h.id}>
            <span className="jp-kind">{h.kind}</span>
            <div>
              <p>{h.summary}</p>
            </div>
          </article>
        ))
      ) : section === "technical_information" ? (
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
      ) : (
        <p className="jp-body-copy">{frozen.text}</p>
      )}
      <p className="jp-subheading">{noteHeadings[section]}</p>
      <p className="jp-body-copy">{frozen.notes}</p>
    </section>
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
