"use client";
import { useEffect, useRef, useState } from "react";
import { SelectField } from "./business-ui";
import { Icon } from "./estimation-wizard-ui";
import {
  equipmentCatalogue,
  equipmentCatalogueDefinition,
  catalogueGroups,
  type CategoryId,
} from "../estimating/equipment-catalogue";
import {
  requiredSystemFields,
  type Configuration,
  type ProposedSystem,
} from "../estimating/configuration-definition";

export const catalogueOptions = catalogueGroups.map((f) => ({
  id: f.id,
  display_name: f.label,
}));
export const categoryOptions = (family: string) =>
  equipmentCatalogue
    .find((f) => f.id === family)
    ?.categories.map((c) => ({ id: c.id, display_name: c.label })) ?? [];

// Classification is an explicit working-copy change. No inferred r01 → r02 mapping,
// no lost fact fields, no changes to saved revisions or the current cost basis.
export function CatalogueUpgrade({
  value,
  ownerId,
  onChange,
  close,
}: {
  value: Configuration;
  ownerId: string;
  onChange: (value: Configuration) => void;
  close: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [choices, setChoices] = useState<
    Record<string, { family: string; category: string }>
  >({});
  useEffect(() => {
    const node = dialog.current!;
    node.showModal();
    return () => node.close();
  }, []);
  const ready = value.systems.every((s) => {
    const c = choices[s.id];
    return (
      c &&
      catalogueGroups.some((f) => f.id === c.family) &&
      (c.family === "Infrastructure" ||
        categoryOptions(c.family).some((x) => x.id === c.category))
    );
  });
  function apply() {
    if (!ready) return;
    const next = structuredClone(value);
    // The backend preserves these obligations across explicit reclassification.
    for (const system of value.systems)
      for (const field of requiredSystemFields(system)) {
        if (
          !next.facts.some(
            (f) => f.system_id === system.id && f.field === field,
          )
        ) {
          const numeric =
            field === "RequiredZones" || field === "VerifiedCapacity";
          next.facts.push({
            id: crypto.randomUUID(),
            lineage: null,
            system_id: system.id,
            field,
            role:
              field === "VerifiedCapacity"
                ? "Capability"
                : field === "EquipmentModel"
                  ? "Observation"
                  : "Requirement",
            value: null,
            unit: numeric ? "Zones" : "Text",
            state: "Unknown",
            source: "Historical requirement retained for review",
            evidence_ids: [],
            follow_up: {
              owner_id: ownerId,
              reason: "Confirm the retained requirement after reclassification",
            },
          });
        }
      }
    next.schema_version = 2;
    next.definition_id = equipmentCatalogueDefinition;
    next.systems = next.systems.map((s) => ({
      ...s,
      family: choices[s.id].family as ProposedSystem["family"],
      category_id:
        choices[s.id].family === "Infrastructure"
          ? null
          : (choices[s.id].category as CategoryId),
    }));
    onChange(next);
    close();
  }
  return (
    <dialog
      ref={dialog}
      className="es02-dialog"
      aria-label="Use six-family catalogue"
      onCancel={(e) => {
        e.preventDefault();
        close();
      }}
    >
      <div className="es02-dialog-head">
        <h2>Use six-family catalogue</h2>
        <button
          type="button"
          className="es02-button es02-button-icon"
          aria-label="Close catalogue review"
          onClick={close}
        >
          <Icon name="close" />
        </button>
      </div>
      <div className="es02-dialog-body">
        <p>
          Choose the family and category for every existing system. This changes
          your working copy. Saved revisions, evidence and prices stay with
          their original basis; saving requires fresh confirmation.
        </p>
        {value.systems.map((s) => (
          <section key={s.id} className="es02-section">
            <h3>{s.name || "Unnamed system"}</h3>
            <p className="es02-subtle">Current family: {s.family}</p>
            <div className="es02-grid-2">
              <SelectField
                label={`Family for ${s.name || "unnamed system"}`}
                name={`catalogue-family-${s.id}`}
                value={choices[s.id]?.family ?? ""}
                options={catalogueOptions}
                onChange={(family) =>
                  setChoices((prev) => ({
                    ...prev,
                    [s.id]: { family, category: "" },
                  }))
                }
              />
              {choices[s.id]?.family !== "Infrastructure" && (
                <SelectField
                  label={`Category for ${s.name || "unnamed system"}`}
                  name={`catalogue-category-${s.id}`}
                  value={choices[s.id]?.category ?? ""}
                  options={categoryOptions(choices[s.id]?.family ?? "")}
                  onChange={(category) =>
                    setChoices((prev) => ({
                      ...prev,
                      [s.id]: { ...prev[s.id], category },
                    }))
                  }
                />
              )}
            </div>
          </section>
        ))}
      </div>
      <div className="es02-dialog-foot">
        <button type="button" className="es02-button" onClick={close}>
          Cancel
        </button>
        <button
          type="button"
          className="es02-button es02-button-primary"
          disabled={!ready}
          onClick={apply}
        >
          Apply to working copy
        </button>
      </div>
    </dialog>
  );
}

export function AddSystemMenu({
  onAdd,
  initialFamily = "",
  autoOpen = false,
}: {
  onAdd: (
    family: ProposedSystem["family"],
    category?: CategoryId | null,
  ) => void;
  initialFamily?: string;
  autoOpen?: boolean;
}) {
  const ref = useRef<HTMLDetailsElement>(null);
  const [family, setFamily] = useState(initialFamily);
  useEffect(() => {
    if (autoOpen && ref.current) {
      ref.current.open = true;
      ref.current.querySelector("select")?.focus();
    }
  }, [autoOpen]);
  return (
    <details
      className="es02-add-menu"
      ref={ref}
      onKeyDown={(e) => {
        if (e.key === "Escape") {
          ref.current!.open = false;
          ref.current?.querySelector("summary")?.focus();
        }
      }}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node))
          ref.current!.open = false;
      }}
    >
      <summary className="es02-button es02-button-primary">
        <Icon name="plus" />
        Add system
        <Icon name="chevron-down" />
      </summary>
      <div className="es02-add-options">
        <SelectField
          label="System family"
          name="add-system-family"
          value={family}
          options={catalogueOptions}
          onChange={setFamily}
        />
        <p>
          {family === "Infrastructure"
            ? "Shared infrastructure is counted once."
            : "Choose a category"}
        </p>
        <div className="es02-category-list">
          {(family === "Infrastructure"
            ? [{ id: "", display_name: "Shared infrastructure" }]
            : categoryOptions(family)
          ).map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => {
                onAdd(
                  family as ProposedSystem["family"],
                  c.id ? (c.id as CategoryId) : null,
                );
                ref.current!.open = false;
              }}
            >
              {c.display_name}
            </button>
          ))}
        </div>
      </div>
    </details>
  );
}
