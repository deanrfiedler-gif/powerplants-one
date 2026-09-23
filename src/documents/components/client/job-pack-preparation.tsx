"use client";
import Link from "next/link";
import { ErrorNotice, useFieldError } from "../../../components/business-ui";
import { sectionKeys, type PackInput, type SectionKey } from "../../validation";
import {
  historyLabel,
  packSectionTitles,
  preparationFieldLabels,
  preparationHelp,
  readinessSummary,
  revisionLabel,
} from "../../pack-view";
import type {
  Pack,
  PackHistory,
  PackRevision,
  PackSource,
} from "./job-pack-types";
import { Badge, Icon } from "./job-pack-ui";
import { SectionBody, SourceTag, sectionId, sectionNumber } from "./job-pack-sections";

// The server limit, not r03's. A note is 1–6000 characters (packInput).
const LIMIT = 6000,
  COUNT_FROM = 5500;

const helpId = (key: SectionKey) => `jp-help-${key}`,
  errorId = (key: SectionKey) => `jp-error-${key}`;

// The nine notes are the whole of the pack's free text, so each field says what belongs in it and shows the
// frozen context the last save composed. Nothing here decides readiness: that is assessed at the appointment.
function NoteField({
  section,
  value,
  disabled,
  onChange,
}: {
  section: SectionKey;
  value: string;
  disabled: boolean;
  onChange: (text: string) => void;
}) {
  const error = useFieldError(section),
    remaining = LIMIT - value.length,
    described = [error ? errorId(section) : null, helpId(section)]
      .filter(Boolean)
      .join(" ");
  return (
    <div className="jp-field">
      <label htmlFor={`section-${section}`}>
        {preparationFieldLabels[section]}
      </label>
      <textarea
        id={`section-${section}`}
        data-validation-field={section}
        rows={3}
        maxLength={LIMIT}
        value={value}
        disabled={disabled}
        aria-invalid={error ? true : undefined}
        aria-describedby={described}
        onChange={(e) => onChange(e.target.value)}
      />
      {error && (
        <span id={errorId(section)} className="jp-field-error">
          {error}
        </span>
      )}
      <small id={helpId(section)}>
        {preparationHelp[section]}
        {value.length >= COUNT_FROM && (
          <>
            {" "}
            <span aria-live="polite">
              {remaining} character{remaining === 1 ? "" : "s"} remaining.
            </span>
          </>
        )}
      </small>
    </div>
  );
}

function Selection({
  id,
  field,
  legend,
  help,
  children,
}: {
  id: string;
  field: string;
  legend: string;
  help: string;
  children: React.ReactNode;
}) {
  const error = useFieldError(field);
  return (
    <fieldset
      id={id}
      className="jp-bare-fieldset"
      data-validation-field={field}
      tabIndex={-1}
      aria-invalid={error ? true : undefined}
    >
      <legend className="jp-subheading first">{legend}</legend>
      <p className="jp-muted jp-small jp-gap-bottom">{help}</p>
      {children}
      {error && <span className="jp-field-error">{error}</span>}
    </fieldset>
  );
}

export type PreparationProps = {
  // A pack that has never been saved has no snapshot, so every section states where its context will come from.
  pack?: Pack;
  revision?: PackRevision;
  sources: PackSource[];
  history: PackHistory[];
  value: PackInput;
  onChange: (next: PackInput) => void;
  dirty: boolean;
  busy: boolean;
  saveState: string;
  error: unknown;
  onSave: () => void;
  onDiscard: () => void;
};

export function PreparationForm({
  pack,
  revision,
  sources,
  history,
  value,
  onChange,
  dirty,
  busy,
  saveState,
  error,
  onSave,
  onDiscard,
}: PreparationProps) {
  const issued = !!pack?.current_issue_id && pack.status !== "Withdrawn",
    next = revision ? revisionLabel(revision.revision + 1) : null,
    set = (key: SectionKey, text: string) =>
      onChange({ ...value, sections: { ...value.sections, [key]: text } }),
    toggle = (field: "source_ids" | "history_ids", id: string, on: boolean) =>
      onChange({
        ...value,
        [field]: on
          ? [...value[field], id]
          : value[field].filter((x) => x !== id),
      });
  return (
    <form
      className="jp-preparation"
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        onSave();
      }}
    >
      <ErrorNotice error={error} />
      <div className="jp-paper">
        <div className="jp-form-intro">
          <h2>{next ? `Prepare revision ${next}` : "Prepare the first revision"}</h2>
          <p>
            Every save creates a new immutable revision with its own reason.
            {issued
              ? " Saving raises an amendment: dispatch is held at once, and a fresh check, issue and every crew acknowledgement are required."
              : ""}
            {revision
              ? ""
              : " Linked context is composed from the current records when you save."}
          </p>
        </div>
        <fieldset className="jp-bare-fieldset" disabled={busy}>
          <legend className="jp-sr">Job pack preparation entries</legend>
          {sectionKeys.map((key) => {
            const id = sectionId("p", key);
            return (
              <section
                key={key}
                id={id}
                className="jp-paper-section"
                tabIndex={-1}
                aria-labelledby={`${id}-title`}
                data-section={key}
              >
                <div className="jp-section-head">
                  <h3 id={`${id}-title`}>
                    <span className="jp-section-number">
                      {sectionNumber(key)}
                    </span>
                    {packSectionTitles[key]}
                  </h3>
                  {revision ? (
                    <SourceTag
                      section={key}
                      revision={revision}
                      drift={pack?.basis_drift ?? []}
                    />
                  ) : (
                    <span className="jp-source-tag">
                      <Icon name="source" />
                      <span>Composed from current records when you save</span>
                    </span>
                  )}
                </div>
                {pack &&
                  revision &&
                  // Section 01 is the visit's key facts, so its grid stays in view. The rest of the frozen
                  // context is long text the coordinator writes against rather than reads every time, so it
                  // is one activation away and the nine fields stay scannable.
                  (key === "identification" ? (
                    <div className="jp-linked-context">
                      <SectionBody
                        section={key}
                        pack={pack}
                        revision={revision}
                      />
                    </div>
                  ) : (
                    <details className="jp-exact jp-linked-context">
                      <summary>View source details</summary>
                      <div className="jp-linked-body">
                        <SectionBody
                          section={key}
                          pack={pack}
                          revision={revision}
                        />
                      </div>
                    </details>
                  ))}
                {key === "history" && (
                  <Selection
                    id="jp-select-history"
                    field="history_ids"
                    legend="Relevant service history"
                    help="Select the records this crew must read before attending. At most 30."
                  >
                    {history.length ? (
                      history.map((h) => (
                        <label
                          className="jp-check-choice"
                          key={h.id}
                          htmlFor={`history-${h.id}`}
                        >
                          <input
                            type="checkbox"
                            id={`history-${h.id}`}
                            checked={value.history_ids.includes(h.id)}
                            onChange={(e) =>
                              toggle("history_ids", h.id, e.target.checked)
                            }
                          />
                          <span>{historyLabel(h)}</span>
                        </label>
                      ))
                    ) : (
                      <p className="jp-muted jp-small">
                        No permitted service history is available for selection.
                        Explain the absence in the note below.
                      </p>
                    )}
                  </Selection>
                )}
                {key === "technical_information" && (
                  <Selection
                    id="jp-select-sources"
                    field="source_ids"
                    legend="Exact technical sources"
                    help="Select the exact document versions the crew works from. At least one, at most 20."
                  >
                    {sources.map((s) => (
                      <label
                        className={`jp-check-choice${s.available ? "" : " unavailable"}`}
                        key={s.id}
                        htmlFor={`source-${s.id}`}
                      >
                        <input
                          type="checkbox"
                          id={`source-${s.id}`}
                          checked={value.source_ids.includes(s.id)}
                          disabled={!s.available}
                          onChange={(e) =>
                            toggle("source_ids", s.id, e.target.checked)
                          }
                        />
                        <span>
                          {s.title}
                          <small>
                            {s.available
                              ? "Available exact version"
                              : "Unavailable — recover the original source"}
                          </small>
                        </span>
                      </label>
                    ))}
                  </Selection>
                )}
                {key === "readiness" && pack?.actions.can_prepare && (
                  <p className="jp-note">
                    Tool readiness is a recorded assessment, not a pack entry.{" "}
                    <Link
                      href={`/service/appointments/${pack.appointment_id}`}
                    >
                      Assess readiness at the appointment
                    </Link>
                    .
                  </p>
                )}
                <NoteField
                  section={key}
                  value={value.sections[key]}
                  disabled={busy}
                  onChange={(text) => set(key, text)}
                />
              </section>
            );
          })}
        </fieldset>
      </div>
      {/* The bar stays with the form at every width; on a phone the shell reserves its own bar's height beneath. */}
      <footer className="jp-form-actions">
        <p role="status">{saveState}</p>
        <div className="jp-button-row">
          <button
            type="button"
            className="jp-quiet"
            disabled={!dirty || busy}
            onClick={onDiscard}
          >
            Discard changes
          </button>
          <button type="submit" className="jp-primary" disabled={!dirty || busy}>
            Save preparation…
          </button>
        </div>
      </footer>
    </form>
  );
}

// What the saved record says while the coordinator works. It never restates a readiness decision: the count
// deliberately avoids the phrase the Job pack view's readiness heading owns.
export function PreparationStatusCard({
  pack,
  revision,
}: {
  pack?: Pack;
  revision?: PackRevision;
}) {
  const summary = pack?.criteria ? readinessSummary(pack.criteria) : null;
  return (
    <section className="jp-side-card">
      <div className="jp-side-heading">
        <h2>Preparation status</h2>
        <span className="jp-muted jp-small">
          {revision
            ? `Saved ${revisionLabel(revision.revision)} · ${pack?.status}`
            : "Not yet saved"}
        </span>
      </div>
      <div className="jp-side-body">
        {pack?.basis ? (
          <div className="jp-readiness-context">
            <div>
              <strong>Prepared against</strong>
              <br />
              Work order v{pack.basis.work_version} · scope v
              {pack.basis.scope_version} · appointment v
              {pack.basis.appointment_version} · site record v
              {pack.basis.site_version}
              {(pack.basis_drift ?? []).map((d) => (
                <span key={d.field}>
                  <br />
                  <span className="changed">
                    {d.source} {d.label}: {d.from} →{" "}
                    {d.to ?? "current record unavailable"}
                  </span>
                </span>
              ))}
            </div>
          </div>
        ) : (
          <p>
            The customer, appointment, approved scope, site record and equipment
            are composed by the server when you save, each at its current
            version.
          </p>
        )}
        {summary && (
          <p className="jp-gap-top">
            <strong className="jp-ink">
              Readiness: {summary.satisfied} of {summary.total} satisfied
            </strong>
            <br />
            Readiness is assessed at the appointment and checked before issue.
          </p>
        )}
        {pack?.actions.can_prepare && (
          <p className="jp-side-foot">
            <Link href={`/service/appointments/${pack.appointment_id}`}>
              Assess readiness at the appointment
            </Link>
          </p>
        )}
      </div>
    </section>
  );
}

export function PreparationGuidanceCard() {
  return (
    <section className="jp-side-card">
      <div className="jp-side-heading">
        <h2>Where information comes from</h2>
      </div>
      <div className="jp-side-body">
        <p>
          <strong className="jp-ink">Linked records</strong>
          <br />
          Customer, appointment, approved scope, site record and equipment are
          composed by the server when you save, each at its current version.
        </p>
        <p className="jp-gap-top">
          <strong className="jp-ink">Preparation entries</strong>
          <br />
          Nine reviewed notes, the exact document versions and the service
          history you select. Notes cannot extend the authorised scope.
        </p>
      </div>
    </section>
  );
}

export function UnsavedBadge() {
  return <Badge tone="warning">Unsaved changes</Badge>;
}
