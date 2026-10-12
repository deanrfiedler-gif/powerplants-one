"use client";
import { useId, type ReactNode } from "react";
import { Button, ButtonLink, Chip, Icon } from "./fertigation-ui";

/*
 * The record workspace header (design board J, D2): the scope's name and
 * reference, its saved-revision state, History, Report and the one primary
 * action, then a context row with the Discovery binding, the scope state, the
 * operating scenario and the synthetic flag. The shell owns navigation and
 * branding above it; the module keeps only what belongs to the record.
 */

export type StatusTone = "saved" | "dirty" | "conflict" | "pending" | "readonly";

export function FertigationHeader({
  name,
  reference,
  status,
  statusTone,
  savedAt,
  historical,
  dirty,
  canSave,
  onHistory,
  onSave,
  onCompare,
  onValves,
  reportHref,
  site,
  customer,
  binding,
  sourceChanged,
  state,
  scenarios,
  scenarioId,
  onScenario,
  scenarioDisabled,
}: {
  name: string;
  reference: string;
  status: string;
  statusTone: StatusTone;
  savedAt?: string;
  historical: boolean;
  dirty: boolean;
  canSave: boolean;
  onHistory: () => void;
  onSave: () => void;
  onCompare: () => void;
  onValves: () => void;
  reportHref: string;
  site: string | null;
  customer: string | null;
  binding: string;
  sourceChanged: boolean;
  state: string;
  scenarios: { id: string; label: string }[];
  scenarioId: string | null;
  onScenario: (id: string | null) => void;
  scenarioDisabled: boolean;
}) {
  const scenarioFieldId = useId();
  return (
    <header className="fn-record-head">
      <div className="fn-record-row">
        <div className="fn-record-identity">
          <h1>
            <span className="fn-record-name">{name}</span>
            <span className="fn-record-ref">{reference}</span>
          </h1>
        </div>
        <div className="fn-record-actions">
          <span className={`fn-status-wrap fn-status-${statusTone}`}>
            <span className="fn-status-dot" aria-hidden="true" />
            <span className="fn-status" role="status">
              {status}
            </span>
            {savedAt && <span className="fn-status-time">· {savedAt}</span>}
          </span>
          <span className="fn-record-divider" aria-hidden="true" />
          <Button variant="quiet" icon="list" onClick={onValves} className="fn-valves-jump">
            Irrigation valves
          </Button>
          <Button variant="secondary" icon="history" onClick={onHistory}>
            History
          </Button>
          <ButtonLink
            variant="secondary"
            icon="report"
            href={reportHref}
            target="_blank"
            rel="noreferrer"
          >
            Report
          </ButtonLink>
          {!historical && dirty && (
            <Button variant="secondary" icon="compare" onClick={onCompare}>
              Compare draft
            </Button>
          )}
          {!historical && (
            <Button variant="primary" icon="save" onClick={onSave} disabled={!canSave}>
              Save revision
            </Button>
          )}
        </div>
      </div>
      <div className="fn-context-row">
        <div className="fn-context-source">
          <span className="fn-context-mark" aria-hidden="true">
            <Icon name="leaf" className="fn-context-mark-icon" />
          </span>
          <div className="fn-context-text">
            <strong>
              {[site, customer].filter(Boolean).join(" · ") ||
                "Site and customer from the Discovery binding"}
            </strong>
            <span className={sourceChanged ? "fn-context-changed" : "fn-context-bound"}>
              <Icon
                name={sourceChanged ? "conflict" : "check"}
                className="fn-context-bound-icon"
              />
              {binding}
            </span>
          </div>
        </div>
        <div className="fn-context-facts">
          <span className="fn-context-fact">
            Scope
            <Chip tone={state === "Archived" ? "neutral" : "existing"}>{state}</Chip>
          </span>
          <label className="fn-context-scenario" htmlFor={scenarioFieldId}>
            <span>Operating scenario</span>
            <span className="fn-select">
              <select
                id={scenarioFieldId}
                value={scenarioId ?? ""}
                disabled={scenarioDisabled}
                onChange={(e) => onScenario(e.target.value || null)}
              >
                <option value="">Not selected</option>
                {scenarios.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </select>
              <Icon name="chevron-down" className="fn-select-icon" />
            </span>
          </label>
          <span className="fn-record-divider" aria-hidden="true" />
          <Chip tone="info" icon="info">
            Synthetic demonstration
          </Chip>
        </div>
      </div>
    </header>
  );
}

/** Phone only: Report and the primary action in a bar at the bottom (design board A). */
export function PhoneBar({
  reportHref,
  canSave,
  historical,
  onSave,
  children,
}: {
  reportHref: string;
  canSave: boolean;
  historical: boolean;
  onSave: () => void;
  children?: ReactNode;
}) {
  return (
    <div className="fn-phone-bar">
      {children}
      <ButtonLink variant="secondary" icon="report" href={reportHref} target="_blank" rel="noreferrer">
        Report
      </ButtonLink>
      {!historical && (
        <Button variant="primary" icon="save" onClick={onSave} disabled={!canSave}>
          Save revision
        </Button>
      )}
    </div>
  );
}
