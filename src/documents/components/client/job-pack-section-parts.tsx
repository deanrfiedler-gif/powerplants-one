"use client";
import Link from "next/link";
import { friendly } from "../../../components/business-ui";
import { formatStamp, historyKindLabel, revisionLabel } from "../../pack-view";
import type { StructuredSection } from "../../section-readers";
import type { SectionControl, ScopeItem } from "../../section-text";
import { Pair } from "./job-pack-ui";
const recorded = (value: string | null) => value || "Not recorded";
function Controls({ value }: { value: SectionControl[] }) {
  return value.length ? (
    <dl className="jp-structured-controls">
      {value.map((c, i) => (
        <div key={i}>
          <dt>{c.label}</dt>
          <dd>
            <strong>{friendly(c.outcome)}</strong>
            {c.reason && <p className="jp-body-copy">{c.reason}</p>}
            <small>
              Evidence: {recorded(c.evidence_title)}
              {c.evidence_hash && ` · ${c.evidence_hash.slice(0, 12)}…`}
            </small>
          </dd>
        </div>
      ))}
    </dl>
  ) : (
    <p>No controls recorded in this saved section.</p>
  );
}
function Requirements({ items }: { items: ScopeItem[] }) {
  return (
    <ol className="jp-structured-list">
      {items.map((i) => (
        <li key={i.sequence} value={i.sequence}>
          <ul>
            {i.completion_requirements.map((text, n) => (
              <li key={n}>{text}</li>
            ))}
          </ul>
        </li>
      ))}
    </ol>
  );
}
export function SectionParts({
  section,
  zone,
}: {
  section: StructuredSection;
  zone: string;
}) {
  switch (section.kind) {
    case "arrangements": {
      const a = section.value;
      return (
        <dl className="jp-info-grid">
          <Pair label="Location" wide>
            {a.location}
          </Pair>
          <Pair label="Site contact">{a.contact?.name ?? "Not recorded"}</Pair>
          <Pair label="Phone">{recorded(a.contact?.phone ?? null)}</Pair>
          <Pair label="Email">{recorded(a.contact?.email ?? null)}</Pair>
          <Pair label="Access instructions" wide>
            {recorded(a.access)}
          </Pair>
          <Pair label="Customer date agreement" wide>
            {a.commitment}
            <small className="jp-structured-help">
              A customer date agreement is not pack acknowledgement.
            </small>
          </Pair>
        </dl>
      );
    }
    case "scope": {
      const s = section.value;
      return (
        <>
          <p className="jp-subheading">
            Approved scope {revisionLabel(s.revision)}
          </p>
          <p className="jp-body-copy">{s.summary}</p>
          <h3 className="jp-subheading">Approved tasks</h3>
          <ol className="jp-structured-list">
            {s.items.map((i) => (
              <li key={i.sequence} value={i.sequence}>
                <strong>{friendly(i.task_kind)}</strong>
                <p className="jp-body-copy">{i.task_description}</p>
                <p>Completion:</p>
                <ul>
                  {i.completion_requirements.map((r, n) => (
                    <li key={n}>{r}</li>
                  ))}
                </ul>
                {i.shutdown_condition && (
                  <p className="jp-body-copy">
                    Shutdown condition: {i.shutdown_condition}
                  </p>
                )}
              </li>
            ))}
          </ol>
          <div className="jp-note">
            <strong>Scope limits</strong>
            <p className="jp-body-copy">Exclusions: {s.exclusions}</p>
            <p className="jp-body-copy">
              Diagnostic limits: {recorded(s.diagnostic_limit)}
            </p>
          </div>
        </>
      );
    }
    case "equipment":
      return (
        <>
          {!section.value.some((i) => i.assets.length) && (
            <p>No equipment recorded in this saved scope.</p>
          )}
          {section.value
            .flatMap((i) => i.assets)
            .map((a, i) => (
              <div className="jp-structured-item" key={i}>
                <dl className="jp-info-grid">
                  <Pair label="Equipment" wide>
                    {a.display_number} · {a.description}
                  </Pair>
                  <Pair label="Identity status">
                    {friendly(a.identity_status)}
                  </Pair>
                  <Pair label="Serial">{recorded(a.serial)}</Pair>
                  <Pair label="Configuration" wide>
                    {recorded(a.configuration_description)}
                  </Pair>
                </dl>
                {a.method && (
                  <p className="jp-note">
                    Identification only · {a.method} · limits:{" "}
                    {recorded(a.limits)}
                  </p>
                )}
                {a.asset_id && (
                  <Link
                    className="jp-text-button"
                    href={`/equipment/${a.asset_id}`}
                  >
                    View equipment record →
                  </Link>
                )}
              </div>
            ))}
        </>
      );
    case "history":
      return section.value.length ? (
        <>
          {section.value.map((h) => (
            <article className="jp-history-item" key={h.id}>
              <span className="jp-kind">{historyKindLabel(h.kind)}</span>
              <div>
                <p className="jp-body-copy">{h.summary}</p>
                <small>
                  {formatStamp(h.occurred_at, zone)} · {friendly(h.confidence)}
                </small>
              </div>
            </article>
          ))}
        </>
      ) : (
        <p>
          No service-audience history selected. The preparation notes must
          explain the review or relevant absence.
        </p>
      );
    case "controls":
      return (
        <>
          <p className="jp-structured-help">
            Readiness captured in this saved revision. Current assessments are
            in Pack readiness.
          </p>
          <Controls value={section.value} />
        </>
      );
    case "site-controls":
      return (
        <>
          <dl className="jp-info-grid">
            <Pair label="Access" wide>
              {section.value.access}
            </Pair>
            <Pair label="Biosecurity" wide>
              {section.value.biosecurity}
            </Pair>
          </dl>
          <Controls value={section.value.controls} />
          <p className="jp-note">
            Stop if site access, isolation, shutdown authority or competency
            cannot be confirmed. Tool-preparation exceptions do not waive these
            controls.
          </p>
        </>
      );
    case "completion":
      return (
        <>
          <Requirements items={section.value.items} />
          <p className="jp-note jp-body-copy">{section.value.standing}</p>
        </>
      );
  }
}
