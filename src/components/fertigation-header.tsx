"use client";
import { useId, type ReactNode } from "react";
import { WorklistMenu } from "./crm-worklist-tools";
import { Button, ButtonLink, Chip, Icon } from "./fertigation-ui";

/*
 * The record workspace header (design board J, D2): the scope's name and
 * reference, its saved-revision state, History, Report and the one primary
 * action, then a context row with the Discovery binding, the scope state, the
 * operating scenario and the synthetic flag. The shell owns navigation and
 * branding above it; the module keeps only what belongs to the record.
 */

export type StatusTone =
  "saved" | "dirty" | "conflict" | "pending" | "readonly";

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
  exportHref,
  valveExportHref,
  compact = false,
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
  exportHref: string;
  valveExportHref: string;
  compact?: boolean;
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
    <header className={`fn-record-head${compact ? " fn-record-compact" : ""}`}>
      <div className="fn-record-row">
        <div className="fn-record-identity">
          <h1 className="fn-record-name">{name}</h1>
          <span
            className={`fn-status-wrap fn-status-${statusTone}`}
            role="status"
          >
            <span className="fn-status">{status}</span>
          </span>
        </div>
        <div className="fn-record-actions">
          <Button variant="secondary" icon="history" onClick={onHistory}>
            History
          </Button>
          {!historical && (
            <Button
              variant="primary"
              icon="save"
              onClick={onSave}
              disabled={!canSave}
            >
              Save revision
            </Button>
          )}
          <WorklistMenu
            label="Scope actions"
            icon="more"
            className="fn-record-menu"
          >
            <a
              data-menu-close
              href={reportHref}
              target="_blank"
              rel="noreferrer"
            >
              Report
            </a>
            <button data-menu-close type="button" onClick={onValves}>
              Irrigation valves
            </button>
            <button
              data-menu-close
              type="button"
              onClick={onCompare}
              disabled={historical || !dirty}
            >
              Compare draft
            </button>
            <a data-menu-close href={exportHref} download>
              Export exact saved scope
            </a>
            <a data-menu-close href={valveExportHref} download>
              Export valve CSV
            </a>
            <button data-menu-close type="button" onClick={onHistory}>
              Copy saved revision
            </button>
            <button data-menu-close type="button" onClick={onHistory}>
              Restore saved revision
            </button>
            <button data-menu-close type="button" onClick={onHistory}>
              Archive scope
            </button>
          </WorklistMenu>
        </div>
      </div>
      <div className="fn-record-meta">
        <span>
          {reference} · Scope {state.toLowerCase()}
        </span>
        <span className={sourceChanged ? "fn-context-changed" : undefined}>
          {binding}
        </span>
        {savedAt && <span>saved {savedAt}</span>}
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
          </div>
        </div>
        <div className="fn-context-facts">
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
          <Chip tone="info">Synthetic demonstration</Chip>
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
      <ButtonLink
        variant="secondary"
        icon="report"
        href={reportHref}
        target="_blank"
        rel="noreferrer"
      >
        Report
      </ButtonLink>
      {!historical && (
        <Button
          variant="primary"
          icon="save"
          onClick={onSave}
          disabled={!canSave}
        >
          Save revision
        </Button>
      )}
    </div>
  );
}
