"use client";
import { useState } from "react";
import { ErrorNotice } from "./business-ui";
import { CalculationDelta } from "./fertigation-comparison";
import { RoleChip } from "./fertigation-cockpit";
import { FertigationDialog } from "./fertigation-fields";
import type { Resolvable } from "../estimating/fertigation/resolutions";
import type { Calculation, Scope } from "../estimating/fertigation/types";

/**
 * Resolve a contradiction (proposed feature F2). Options restate the engine's
 * pass condition; an option with an unambiguous draft edit can be previewed
 * through the server and applied to the working draft. Nothing is saved.
 */
export function ResolveDrawer({
  items,
  scope,
  calculation,
  canEdit,
  preview,
  apply,
  close,
}: {
  items: Resolvable[];
  scope: Scope;
  calculation: Calculation;
  canEdit: boolean;
  preview: (proposal: Scope) => Promise<Calculation>;
  apply: (proposal: Scope, calculation: Calculation) => void;
  close: () => void;
}) {
  const [index, setIndex] = useState(0),
    [choice, setChoice] = useState(items[0]?.options[0]?.id ?? ""),
    [result, setResult] = useState<{
      option: string;
      proposal: Scope;
      calculation: Calculation;
    } | null>(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState<unknown>(null);
  const item = items[index];
  if (!item) return null;
  const option = item.options.find((o) => o.id === choice) ?? item.options[0];
  async function run() {
    if (!option.transform) return;
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      // One transform per preview, so the identities applied are the ones shown.
      const proposal = option.transform(scope);
      setResult({
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
    <FertigationDialog title="Resolve a conflict" close={close}>
      <div className="fn-dialog-body fn-resolve">
        {items.length > 1 && (
          <label>
            Conflict
            <select
              value={index}
              onChange={(e) => {
                const next = Number(e.target.value);
                setIndex(next);
                setChoice(items[next].options[0]?.id ?? "");
                setResult(null);
              }}
            >
              {items.map((it, i) => (
                <option key={it.key} value={i}>
                  {it.title}
                </option>
              ))}
            </select>
          </label>
        )}
        <div className="fn-resolve-problem">
          <strong>{item.title}</strong>
          <p>{item.message}</p>
        </div>
        <fieldset>
          <legend>Ways to resolve</legend>
          {item.options.map((o) => (
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
                    <span
                      className={`fn-chip ${o.transform ? "fn-chip-success" : ""}`}
                    >
                      {o.transform ? "Draft edit available" : "Needs new input"}
                    </span>
                  </span>
                </span>
              </span>
              <small>{o.condition}</small>
              <small>{o.detail}</small>
            </label>
          ))}
        </fieldset>
        <ErrorNotice error={error} />
        {option.transform && (
          <p className="fn-actions">
            <button type="button" disabled={busy} onClick={() => void run()}>
              {busy ? "Calculating consequences…" : "Preview consequences"}
            </button>
          </p>
        )}
        {result && result.option === option.id && (
          <>
            <CalculationDelta
              beforeScope={scope}
              before={calculation}
              afterScope={result.proposal}
              after={result.calculation}
              beforeLabel="Now"
              afterLabel="With this option"
            />
            <p className="fn-actions">
              <button
                type="button"
                className="fn-primary"
                disabled={!canEdit}
                onClick={() => {
                  apply(result.proposal, result.calculation);
                  close();
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
