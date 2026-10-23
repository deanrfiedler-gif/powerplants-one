"use client";
import { useId, useState } from "react";
import { Field } from "../../components/business-ui";
import { Button } from "../../components/ui/button";
import { knowledge, type Fact } from "./model";
export function Pick({
  label,
  value,
  values,
  change,
}: {
  label: string;
  value: string;
  values: readonly string[];
  change: (v: string) => void;
}) {
  return (
    <label className="nac-field">
      {label}
      <select value={value} onChange={(e) => change(e.target.value)}>
        {values.map((v) => (
          <option key={v}>{v}</option>
        ))}
      </select>
    </label>
  );
}
export function FactFields({
  label,
  unit = "text",
  fact,
  change,
}: {
  label: string;
  unit?: string;
  fact: Fact;
  change: (f: Fact) => void;
}) {
  const id = useId();
  const [stateError, setStateError] = useState("");
  const set = (patch: Partial<Fact>) => change({ ...fact, ...patch });
  return (
    <fieldset className="nac-fact">
      <legend>
        {label}
        {unit !== "text" ? ` (${unit})` : ""}
      </legend>
      <Pick
        label={`${label} evidence state`}
        value={fact.knowledge}
        values={knowledge}
        change={(v) => {
          const next = v as Fact["knowledge"];
          const clear = ["Unknown", "Conflict", "NotApplicable"].includes(next);
          const retain =
            clear &&
            fact.value !== null &&
            fact.source &&
            !fact.alternatives.some(
              (a) => a.value === fact.value && a.source === fact.source,
            );
          if (retain && fact.alternatives.length >= 5) {
            setStateError(
              "Five source claims are already retained. Record the resolution against an existing claim before changing the evidence state.",
            );
            return;
          }
          setStateError("");
          set({
            knowledge: next,
            value: clear ? null : fact.value,
            alternatives: retain
              ? [
                  ...fact.alternatives,
                  { value: fact.value!, source: fact.source! },
                ]
              : fact.alternatives,
          });
        }}
      />
      {stateError && <p role="alert">{stateError}</p>}
      {!["Unknown", "Conflict", "NotApplicable"].includes(fact.knowledge) && (
        <Field
          name={id + "-value"}
          label={label + " value"}
          maxLength={500}
          value={fact.value ?? ""}
          onChange={(value) => set({ value: value || null })}
        />
      )}
      <Field
        name={id + "-source"}
        label={label + " source or reason"}
        maxLength={500}
        value={fact.source ?? ""}
        onChange={(source) => set({ source: source || null })}
      />
      <div className="nac-grid">
        <Field
          name={id + "-owner"}
          label={label + " clarification owner"}
          maxLength={120}
          value={fact.owner ?? ""}
          onChange={(owner) => set({ owner: owner || null })}
        />
        <Field
          name={id + "-next"}
          label={label + " next action"}
          maxLength={500}
          value={fact.next_action ?? ""}
          onChange={(next_action) => set({ next_action: next_action || null })}
        />
      </div>
      {fact.alternatives.map((a, i) => (
        <div className="nac-grid" key={i}>
          <Field
            name={id + "-claim-" + i}
            label={`${label} source claim ${i + 1}`}
            maxLength={500}
            value={a.value}
            onChange={(value) =>
              set({
                alternatives: fact.alternatives.map((x, j) =>
                  j === i ? { ...x, value } : x,
                ),
              })
            }
          />
          <Field
            name={id + "-evidence-" + i}
            label={`${label} claim source ${i + 1}`}
            maxLength={500}
            value={a.source}
            onChange={(source) =>
              set({
                alternatives: fact.alternatives.map((x, j) =>
                  j === i ? { ...x, source } : x,
                ),
              })
            }
          />
        </div>
      ))}
      {fact.knowledge === "Conflict" && fact.alternatives.length < 5 && (
        <Button
          type="button"
          onClick={() =>
            set({
              alternatives: [...fact.alternatives, { value: "", source: "" }],
            })
          }
        >
          Add source claim
        </Button>
      )}
      {fact.alternatives.length > 0 && (
        <p>
          Earlier claims are retained. To resolve, select the evidence state,
          enter the chosen value and explain the resolution in its source and
          save reason.
        </p>
      )}
    </fieldset>
  );
}
