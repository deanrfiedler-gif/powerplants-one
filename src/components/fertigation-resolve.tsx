"use client";
import { useId, useState } from "react";
import { ErrorNotice } from "./business-ui";
import { CalculationDelta } from "./fertigation-comparison";
import { RoleChip } from "./fertigation-cockpit";
import { FertigationDialog } from "./fertigation-fields";
import type {
  ResolutionOption,
  Resolvable,
} from "../estimating/fertigation/resolutions";
import type { Calculation, Scope } from "../estimating/fertigation/types";

const optionChip = (o: ResolutionOption): [string, string] =>
  !o.transform
    ? ["Needs new input", "fn-chip"]
    : o.basis === "recorded"
      ? ["From recorded values", "fn-chip fn-chip-success"]
      : o.basis === "declared"
        ? ["Your declaration", "fn-chip fn-chip-review"]
        : ["Draft edit available", "fn-chip fn-chip-success"];

/**
 * Resolve a contradiction (proposed feature F2) or make a declaration
 * (feature F1). Options restate the engine's pass condition; an option with a
 * draft edit can be previewed through the server and applied to the working
 * draft. Nothing is saved.
 *
 * Items may be recomputed from the current draft while the drawer is open
 * (declarations); the selection follows the item's key.
 */
export function ResolveDrawer({
  items,
  scope,
  calculation,
  canEdit,
  preview,
  apply,
  close,
  title = "Resolve a conflict",
  itemLabel = "Conflict",
  initialKey,
  keepOpen = false,
  tone = "conflict",
}: {
  items: Resolvable[];
  scope: Scope;
  calculation: Calculation;
  canEdit: boolean;
  preview: (proposal: Scope) => Promise<Calculation>;
  apply: (proposal: Scope, calculation: Calculation) => void;
  close: () => void;
  title?: string;
  itemLabel?: string;
  initialKey?: string;
  /** Stay open after applying, for working through several declarations. */
  keepOpen?: boolean;
  /** Declarations describe missing inputs, not contradictions. */
  tone?: "conflict" | "declaration";
}) {
  const [key, setKey] = useState(initialKey ?? items[0]?.key ?? ""),
    [choice, setChoice] = useState(""),
    [result, setResult] = useState<{
      key: string;
      option: string;
      proposal: Scope;
      calculation: Calculation;
    } | null>(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState<unknown>(null),
    [applied, setApplied] = useState<string | null>(null),
    selectId = useId();
  const item = items.find((it) => it.key === key) ?? items[0];
  if (!item)
    return (
      <FertigationDialog title={title} close={close}>
        <div className="fn-dialog-body fn-resolve">
          {applied && <p role="status">Applied: {applied}.</p>}
          <p>
            Nothing is left here that the draft can answer. Save a revision with
            a reason to keep the applied edits.
          </p>
        </div>
      </FertigationDialog>
    );
  const option = item.options.find((o) => o.id === choice) ?? item.options[0];
  const current =
    result && result.key === item.key && result.option === option.id
      ? result
      : null;
  async function run() {
    if (!option.transform) return;
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      // One transform per preview, so the identities applied are the ones shown.
      const proposal = option.transform(scope);
      setResult({
        key: item.key,
        option: option.id,
        proposal,
        calculation: await preview(proposal),
      });
    } catch (e) {
      setError(e);
    } finally {
      setBusy(false);
    }
  }
  return (
    <FertigationDialog title={title} close={close}>
      <div className="fn-dialog-body fn-resolve">
        {applied && (
          <p role="status">Applied to the working draft: {applied}.</p>
        )}
        {items.length > 1 && (
          <div className="fn-resolve-picker">
            <label htmlFor={selectId}>{itemLabel}</label>
            <select
              id={selectId}
              value={item.key}
              onChange={(e) => {
                setKey(e.target.value);
                setChoice("");
                setResult(null);
              }}
            >
              {items.map((it) => (
                <option key={it.key} value={it.key}>
                  {it.title}
                </option>
              ))}
            </select>
          </div>
        )}
        <div
          className={`fn-resolve-problem${tone === "declaration" ? " fn-resolve-declaration" : ""}`}
        >
          <strong>{item.title}</strong>
          <p>{item.message}</p>
        </div>
        {!!item.facts?.length && (
          <div className="fn-resolve-facts">
            <h3>What the draft records</h3>
            <ul>
              {item.facts.map((f) => (
                <li key={f}>{f}</li>
              ))}
            </ul>
          </div>
        )}
        <fieldset>
          <legend>Ways to resolve</legend>
          {item.options.map((o) => {
            const [chip, chipClass] = optionChip(o);
            return (
              <label
                key={o.id}
                className={`fn-resolve-option${o.id === option.id ? " fn-selected" : ""}`}
              >
                <span className="fn-resolve-choice">
                  <input
                    type="radio"
                    name="fn-resolution"
                    value={o.id}
                    checked={o.id === option.id}
                    onChange={() => {
                      setChoice(o.id);
                      setResult(null);
                    }}
                  />
                  <span>
                    <strong>{o.title}</strong>
                    <span className="fn-next-meta">
                      <RoleChip role={o.role} />
                      <span className={chipClass}>{chip}</span>
                    </span>
                  </span>
                </span>
                <small>{o.condition}</small>
                <small>{o.detail}</small>
              </label>
            );
          })}
        </fieldset>
        <ErrorNotice error={error} />
        {option.transform && (
          <p className="fn-actions">
            <button type="button" disabled={busy} onClick={() => void run()}>
              {busy ? "Calculating consequences…" : "Preview consequences"}
            </button>
          </p>
        )}
        {current && (
          <>
            <CalculationDelta
              beforeScope={scope}
              before={calculation}
              afterScope={current.proposal}
              after={current.calculation}
              beforeLabel="Now"
              afterLabel="With this option"
            />
            <p className="fn-actions">
              <button
                type="button"
                className="fn-primary"
                disabled={!canEdit}
                onClick={() => {
                  apply(current.proposal, current.calculation);
                  if (!keepOpen) close();
                  else {
                    setApplied(option.title);
                    setResult(null);
                    setChoice("");
                  }
                }}
              >
                Apply to working draft
              </button>
            </p>
          </>
        )}
        <p className="fn-subtle">
          Applying changes the working draft only. Nothing is saved until you
          save a revision with a reason; the saved revision stays as it is.
        </p>
      </div>
    </FertigationDialog>
  );
}
