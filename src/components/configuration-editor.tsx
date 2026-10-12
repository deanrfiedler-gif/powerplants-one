"use client";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { Field, SelectField } from "./business-ui";
import { FollowUpFields, labels, type FormOptions } from "./discovery-fields";
import {
  configurationCounts,
  configurationFields,
  coverageLabel,
  equipmentFamilies,
  filterSystems,
  type Area,
  type Configuration,
  type ConfigurationFact,
  type DiscoveryFinding,
  type Family,
  type ProposedSystem,
  type Responsibility,
  type ScopeState,
} from "../estimating/configuration-definition";
import { useIdentity } from "./business-session";
import { useScopePreferences, systemColumns } from "./scope-preferences";
import {
  Icon,
  StateTag,
  Tag,
  TableScroll,
  plural,
  type WizardIconName,
} from "./estimation-wizard-ui";

// ES-02 configuration editors, composed to design board r01 (boards S1–S3 and 10): a flush
// single-line table with one selected row, and a padded two-column editor beneath it. Every
// change here edits the working proposal only; nothing saves, selects or confirms.

// A finding or summary row asks an editor to show its record and field (board P9).
export type Focus = { entity_id: string | null; field: string; nonce: number };

// Family presentation: an outline glyph and the kind of system each family holds. The family
// list itself is the configuration definition's (PPO-ES02-CONFIG-r01); the six-family decision
// of 23 September 2026 needs its successor definition before it can appear here.
const familyGlyph: Record<Family, WizardIconName> = {
  ControlsClimate: "controls",
  Fertigation: "water",
  MonitoringWeather: "climate",
  NurseryMachinery: "automation",
  Infrastructure: "infrastructure",
  Other: "other",
};
const familyHint: Record<Family, string> = {
  ControlsClimate: "Controllers, fans, heating, screens",
  Fertigation: "Dosing, irrigation, water treatment",
  MonitoringWeather: "Sensors, weather stations",
  NurseryMachinery: "Benches, trolleys, potting",
  Infrastructure: "Network, power, shared services",
  Other: "Unsupported or historical values",
};
export const familyLabel = (id: string) =>
  equipmentFamilies.find((f) => f.id === id)?.label ?? id;
export const familyIcon = (id: string): WizardIconName =>
  familyGlyph[id as Family] ?? "other";
const intentLabel = (intent: ProposedSystem["intent"]) =>
  intent === "RetainExpand" ? "Retain + expand" : intent;
// "Greenhouse 1 + Greenhouse 2" reads as "Greenhouses 1 + 2" in a single-line column; the
// saved membership is unchanged and the full label stays in the cell's title.
const compactCoverage = (label: string) => {
  const parts = label.split(" + ");
  if (parts.length < 2) return label;
  const matches = parts.map((p) => /^(.*\S)\s+(\d+)$/.exec(p));
  const prefix = matches[0]?.[1];
  if (!prefix || /s$/i.test(prefix) || matches.some((m) => !m || m[1] !== prefix))
    return label;
  return `${prefix}s ${matches.map((m) => m![2]).join(" + ")}`;
};

// Checkbox chips: a validated multi-select that keeps real checkboxes and labels.
function Chips({
  label,
  options,
  values,
  onChange,
  empty = "Nothing to choose from",
  max,
}: {
  label: string;
  options: { id: string; label: string }[];
  values: string[];
  onChange: (ids: string[]) => void;
  empty?: string;
  max?: number;
}) {
  return (
    <div className="es02-chips" role="group" aria-label={label}>
      {options.length === 0 && (
        <span className="es02-chips-empty">{empty}</span>
      )}
      {options.map((o) => (
        <label key={o.id} className="es02-chip">
          <input
            type="checkbox"
            checked={values.includes(o.id)}
            disabled={
              max !== undefined && !values.includes(o.id) && values.length >= max
            }
            onChange={(e) =>
              onChange(
                e.target.checked
                  ? [...values, o.id]
                  : values.filter((id) => id !== o.id),
              )
            }
          />
          <span>{o.label}</span>
        </label>
      ))}
    </div>
  );
}
function LabelledChips({
  label,
  hint,
  ...rest
}: Parameters<typeof Chips>[0] & { hint?: ReactNode }) {
  return (
    <div className="es02-field">
      <span className="es02-label">{label}</span>
      <Chips label={label} {...rest} />
      {hint && <small>{hint}</small>}
    </div>
  );
}
function RowMenu({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false),
    id = useId();
  return (
    <div
      className="es02-menu-root"
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) setOpen(false);
      }}
      onKeyDown={(e) => {
        if (e.key === "Escape") setOpen(false);
      }}
    >
      <button
        type="button"
        className="es02-button es02-button-icon"
        aria-label={label}
        title={label}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen(!open)}
      >
        <Icon name="more" />
      </button>
      {open && (
        <div
          id={id}
          className="es02-menu-list"
          role="menu"
          aria-label={label}
          onClick={() => setOpen(false)}
        >
          {children}
        </div>
      )}
    </div>
  );
}

type Props = {
  value: Configuration;
  onChange: (value: Configuration) => void;
  options: FormOptions;
  findings: readonly DiscoveryFinding[];
  onEvidence: (id?: string) => void;
  readOnly?: boolean;
  evaluated?: boolean;
  focus?: Focus | null;
};

// Focus a field by its element id once the editor has rendered the record.
function useFieldFocus(
  focus: Focus | null | undefined,
  owns: (focus: Focus) => boolean,
  select: (focus: Focus) => void,
  elementId: (focus: Focus) => string | null,
) {
  const applied = useRef<number>(0);
  useEffect(() => {
    if (!focus || applied.current === focus.nonce || !owns(focus)) return;
    applied.current = focus.nonce;
    select(focus);
    const id = elementId(focus);
    window.setTimeout(() => {
      const element = id ? document.getElementById(id) : null;
      element?.scrollIntoView({ block: "center" });
      element?.focus({ preventScroll: true });
    }, 60);
  }, [focus, owns, select, elementId]);
}

export function FamilyOverview({
  value,
  filter,
  onFilter,
  onAdd,
  onConfigure,
  readOnly = false,
  variant = "compact",
}: {
  value: Configuration;
  filter?: string;
  onFilter?: (id: string) => void;
  onAdd?: (family: Family) => void;
  onConfigure?: () => void;
  readOnly?: boolean;
  variant?: "full" | "compact";
}) {
  const counts = configurationCounts(value);
  const names = (family: string) =>
    value.systems
      .filter((s) => s.family === family)
      .map((s) => s.name || "New system")
      .join(" · ");
  const cards = equipmentFamilies.filter(
    (f) => f.id !== "Infrastructure" && (f.id !== "Other" || counts.families.Other > 0),
  );
  const infra = counts.families.Infrastructure;
  const card = (f: (typeof equipmentFamilies)[number], infraCard = false) => {
    const count = counts.families[f.id];
    return (
      <div
        key={f.id}
        className={`es02-family${infraCard ? " es02-family-infra" : ""}`}
      >
        <button
          type="button"
          className="es02-family-filter"
          disabled={!onFilter && !onConfigure}
          aria-pressed={onFilter ? filter === f.id : undefined}
          aria-label={`${f.label} ${count} systems`}
          onClick={() => (onFilter ? onFilter(f.id) : onConfigure?.())}
        >
          <strong>
            <Icon name={familyGlyph[f.id]} />
            {f.label}
          </strong>
          <span>{plural(count, "system")}</span>
          <small>{count ? names(f.id) : variant === "full" ? familyHint[f.id] : ""}</small>
        </button>
        {onAdd && !infraCard && (
          <button
            type="button"
            className="es02-button es02-button-sm es02-family-add"
            disabled={readOnly}
            aria-label={`Add ${f.label} system`}
            onClick={() => onAdd(f.id)}
          >
            <Icon name="plus" className="es02-icon es02-icon-sm" />
            Add
          </button>
        )}
      </div>
    );
  };
  const infraFamily = equipmentFamilies.find((f) => f.id === "Infrastructure")!;
  return (
    <section
      className="es02-section es02-families"
      aria-label="Equipment families in this estimate"
    >
      <div className="es02-section-head">
        <div>
          <h2>Equipment families in this estimate</h2>
          <p>
            {plural(counts.systems, "system")} · each counted once
          </p>
        </div>
        <div className="es02-actions">
          {onConfigure && (
            <button type="button" className="es02-link" onClick={onConfigure}>
              Configure systems
              <Icon name="arrow-right" className="es02-icon es02-icon-sm" />
            </button>
          )}
          {onFilter && (
            <button
              type="button"
              className="es02-button"
              onClick={() => onFilter("")}
              aria-pressed={!filter}
            >
              All families
            </button>
          )}
        </div>
      </div>
      <div className="es02-family-grid">
        {cards.map((f) => card(f))}
        {variant === "compact" && card(infraFamily, true)}
      </div>
      {variant === "full" && (
        <div className="es02-families-row">
          <strong>
            <Icon name="infrastructure" />
            Shared infrastructure
          </strong>
          <span>
            {plural(infra, "system")}
            {infra ? ` · ${names("Infrastructure")}` : ""} · covers all areas and is
            counted once
          </span>
          {onConfigure && (
            <button type="button" className="es02-link" onClick={onConfigure}>
              Filter
            </button>
          )}
        </div>
      )}
    </section>
  );
}

export function AreasEditor({
  value,
  onChange,
  options,
  onEvidence,
  readOnly = false,
  focus,
}: Omit<Props, "options"> & {
  options: Pick<FormOptions, "owner" | "owners" | "facilities">;
}) {
  const [selected, setSelected] = useState<string | null>(null),
    a = value.areas.find((a) => a.id === selected);
  useFieldFocus(
    focus,
    (f) => value.areas.some((a) => a.id === f.entity_id),
    (f) => setSelected(f.entity_id),
    (f) => (f.field === "state" ? "area.state" : "area.label"),
  );
  const update = (patch: Partial<Area>) =>
    a &&
    onChange({
      ...value,
      areas: value.areas.map((x) => (x.id === a.id ? { ...x, ...patch } : x)),
    });
  const own = { owner_id: options.owner.id, reason: "" };
  const growing = value.areas.filter((x) => x.purpose === "Growing").length;
  const remove = (area: Area) => {
    const dependants =
      value.systems.filter((s) => s.coverage.area_ids.includes(area.id)).length +
      value.responsibilities.filter((r) => r.area_ids.includes(area.id)).length;
    if (dependants) {
      window.alert(
        `${dependants} working systems or responsibilities refer to this area. Reassign their membership before removing it.`,
      );
      return;
    }
    if (
      window.confirm(
        `Remove ${area.label || "this area"} from the working proposal? Saved history and prices remain unchanged.`,
      )
    ) {
      onChange({ ...value, areas: value.areas.filter((x) => x.id !== area.id) });
      setSelected(null);
    }
  };
  return (
    <section className="es02-section" aria-label="Estimating areas">
      <div className="es02-section-head">
        <div>
          <h2>Areas</h2>
          <p>
            Stable estimating areas within the one site. An ancillary location is
            scoped, but it is not a growing area.
          </p>
        </div>
        <div className="es02-actions">
          <button
            type="button"
            className="es02-button"
            disabled={readOnly}
            onClick={() => {
              const id = crypto.randomUUID();
              onChange({
                ...value,
                areas: [
                  ...value.areas,
                  {
                    id,
                    lineage: null,
                    label: "",
                    facility_id: null,
                    purpose: "Unknown",
                    use: null,
                    stage: null,
                    source: "",
                    evidence_ids: [],
                    state: "Unknown",
                    follow_up: own,
                  },
                ],
              });
              setSelected(id);
            }}
          >
            <Icon name="plus" className="es02-icon es02-icon-sm" />
            Add area
          </button>
        </div>
      </div>
      {value.areas.length > 0 ? (
        <TableScroll label="Estimating areas table">
          <table>
            <thead>
              <tr>
                {[
                  "Area",
                  "Facility",
                  "Use / crop context",
                  "Stage",
                  "Evidence / state",
                  "Actions",
                ].map((x) => (
                  <th key={x} scope="col">
                    {x}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {value.areas.map((area) => (
                <tr key={area.id} data-selected={area.id === selected}>
                  <td>
                    <button
                      type="button"
                      className="es02-cell-link"
                      aria-pressed={area.id === selected}
                      onClick={() => setSelected(area.id)}
                    >
                      {area.label || "New area"}
                    </button>
                  </td>
                  <td>
                    {options.facilities.find((f) => f.id === area.facility_id)
                      ?.display_name ?? (
                      <span className="es02-secondary">
                        {area.facility_id
                          ? "Saved Facility"
                          : "Proposed · no Facility record"}
                      </span>
                    )}
                  </td>
                  <td>
                    {area.purpose === "Growing"
                      ? "Growing area"
                      : area.purpose === "Ancillary"
                        ? "Ancillary location"
                        : "Purpose unknown"}
                    {area.use ? ` · ${area.use}` : ""}
                  </td>
                  <td>
                    {area.stage ?? <span className="es02-secondary">—</span>}
                  </td>
                  <td>
                    <button
                      type="button"
                      className="es02-cell-evidence"
                      onClick={() => onEvidence(area.evidence_ids[0])}
                    >
                      {area.source || "Evidence not recorded"}
                    </button>{" "}
                    <StateTag value={area.state} />
                  </td>
                  <td>
                    <RowMenu label={`Actions for ${area.label || "new area"}`}>
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => setSelected(area.id)}
                      >
                        Edit area
                      </button>
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => onEvidence(area.evidence_ids[0])}
                      >
                        View evidence
                      </button>
                      <button
                        type="button"
                        role="menuitem"
                        disabled={readOnly}
                        onClick={() => remove(area)}
                      >
                        Remove area
                      </button>
                    </RowMenu>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableScroll>
      ) : (
        <p className="es02-empty">
          No estimating areas recorded. NoSiteRequired scope can use attributed
          non-area coverage.
        </p>
      )}
      {value.areas.length > 0 && (
        <p className="es02-table-foot">
          <span>
            <strong>{plural(growing, "growing area")}</strong> ·{" "}
            {plural(value.areas.length, "scoped location")}
          </span>
          <span>Up to 10 Facilities per scope</span>
        </p>
      )}
      {a && (
        <fieldset
          disabled={readOnly}
          className="es02-editor es02-fields"
          aria-label="Selected area editor"
        >
          <div className="es02-editor-head">
            <h3>{a.label || "New estimating area"}</h3>
            <StateTag value={a.state} />
            <div className="es02-actions">
              <button
                type="button"
                className="es02-button es02-button-danger"
                onClick={() => remove(a)}
              >
                Remove area
              </button>
            </div>
          </div>
          <div className="es02-grid-3">
            <Field
              label="Area name"
              name="area.label"
              value={a.label}
              onChange={(label) => update({ label })}
              maxLength={100}
            />
            <SelectField
              label="Area purpose"
              name="area.purpose"
              value={a.purpose}
              options={labels(["Growing", "Ancillary", "Unknown"])}
              onChange={(purpose) =>
                update({ purpose: purpose as Area["purpose"] })
              }
            />
            <SelectField
              label="Area Facility"
              name="area.facility"
              value={a.facility_id ?? ""}
              options={options.facilities}
              onChange={(facility_id) =>
                update({ facility_id: facility_id || null })
              }
            />
            <Field
              label="Use / crop context"
              name="area.use"
              value={a.use ?? ""}
              onChange={(use) => update({ use: use || null })}
              maxLength={500}
            />
            <Field
              label="Stage"
              name="area.stage"
              value={a.stage ?? ""}
              onChange={(stage) => update({ stage: stage || null })}
              maxLength={100}
            />
            <SelectField
              label="Area state"
              name="area.state"
              value={a.state}
              options={labels(["Answered", "Confirmed", "Unknown", "Assumed"])}
              onChange={(state) =>
                update({
                  state: state as ScopeState,
                  follow_up:
                    state === "Confirmed" ? null : (a.follow_up ?? own),
                })
              }
            />
            <div className="es02-span-2">
              <Field
                label="Area source"
                name="area.source"
                value={a.source}
                onChange={(source) => update({ source })}
                maxLength={500}
              />
            </div>
          </div>
          <LabelledChips
            label="Area evidence"
            options={value.evidence.map((e) => ({
              id: e.id,
              label: e.observation || "New observation",
            }))}
            values={a.evidence_ids}
            onChange={(evidence_ids) => update({ evidence_ids })}
            empty="No evidence recorded yet"
          />
          {a.follow_up && (
            <FollowUpFields
              label="Area"
              value={a.follow_up}
              owners={options.owners}
              onChange={(follow_up) => update({ follow_up })}
            />
          )}
        </fieldset>
      )}
    </section>
  );
}

export function SystemsEditor({
  value,
  onChange,
  options,
  findings,
  onEvidence,
  readOnly = false,
  evaluated = true,
  focus,
}: Props) {
  const [family, setFamily] = useState(""),
    [area, setArea] = useState(""),
    [search, setSearch] = useState(""),
    [selected, setSelected] = useState<string | null>(null),
    [review, setReview] = useState(false),
    [technical, setTechnical] = useState(false);
  const identity = useIdentity(),
    preferences = useScopePreferences(
      `${identity.workspace_id}:${identity.actor_id}:es02-systems`,
    );
  const technicalId = useId();
  const columns = preferences.value.order,
    hidden = preferences.value.hidden;
  const defaultWidth: Record<string, number> = {
    System: 170,
    "Area coverage": 150,
    "Equipment ref.": 130,
    Intent: 120,
    Evidence: 130,
    State: 130,
    Family: 150,
  };
  const moveColumn = (column: string, direction: number) => {
    const order = [...columns],
      index = order.indexOf(column),
      next = index + direction;
    if (index < 1 || next < 1 || next >= order.length) return;
    [order[index], order[next]] = [order[next], order[index]];
    preferences.save({ ...preferences.value, order });
  };
  const rows = filterSystems(value, { family, area, search })
      .sort(
        (a, b) =>
          equipmentFamilies.findIndex((f) => f.id === a.family) -
            equipmentFamilies.findIndex((f) => f.id === b.family) ||
          a.name.localeCompare(b.name),
      )
      .filter((s) => !review || findings.some((f) => f.entity_id === s.id)),
    system = rows.find((s) => s.id === selected);
  const configFindings = findings.filter((f) => f.step === "Configuration"),
    findingSystems = new Set(configFindings.map((f) => f.entity_id)).size,
    own = { owner_id: options.owner.id, reason: "" };
  const clearFilters = () => {
    setFamily("");
    setArea("");
    setSearch("");
    setReview(false);
  };
  useFieldFocus(
    focus,
    (f) => value.systems.some((s) => s.id === f.entity_id),
    (f) => {
      clearFilters();
      setSelected(f.entity_id);
      if (f.field !== "coverage") setTechnical(true);
    },
    (f) => {
      if (f.field === "coverage") return "coverage.mode";
      const fact = value.facts.find(
        (x) => x.system_id === f.entity_id && x.field === f.field,
      );
      return fact ? `${fact.id}.state` : "add-fact";
    },
  );
  const changeFilter = (fn: () => void) => {
    fn();
    setSelected(null);
  };
  const update = (patch: Partial<ProposedSystem>) =>
    system &&
    onChange({
      ...value,
      systems: value.systems.map((s) =>
        s.id === system.id ? { ...s, ...patch } : s,
      ),
    });
  const add = (family: Family = "Other") => {
    const id = crypto.randomUUID();
    onChange({
      ...value,
      systems: [
        ...value.systems,
        {
          id,
          lineage: null,
          name: "",
          family,
          type: "",
          intent: "New",
          proposed_work: "",
          equipment_ids: [],
          evidence_ids: [],
          coverage: {
            mode: "Unknown",
            area_ids: [],
            source: null,
            reason: "",
            follow_up: own,
          },
        },
      ],
    });
    clearFilters();
    setSelected(id);
  };
  const removeSystem = (target: ProposedSystem) => {
    const factIds = value.facts
      .filter((f) => f.system_id === target.id)
      .map((f) => f.id);
    if (
      window.confirm(
        `Remove ${target.name || "this system"}, its ${factIds.length} working facts and their follow-ups, and its responsibility memberships? Saved history and costs remain unchanged.`,
      )
    ) {
      onChange({
        ...value,
        systems: value.systems.filter((s) => s.id !== target.id),
        facts: value.facts.filter((f) => f.system_id !== target.id),
        follow_ups: value.follow_ups.filter(
          (f) => !factIds.includes(f.fact_id ?? ""),
        ),
        responsibilities: value.responsibilities.map((r) => ({
          ...r,
          system_ids: r.system_ids.filter((id) => id !== target.id),
        })),
      });
      setSelected(null);
    }
  };
  const fact = (
    f: ConfigurationFact,
    patch: Partial<ConfigurationFact>,
    reviewState = false,
  ) =>
    onChange({
      ...value,
      facts: value.facts.map((x) =>
        x.id === f.id
          ? {
              ...x,
              ...(!reviewState && f.state === "Confirmed"
                ? { state: "Answered" as const, follow_up: own }
                : {}),
              ...patch,
            }
          : x,
      ),
    });
  const stateWord = (s: ProposedSystem) => {
    const needs = configFindings.filter((f) => f.entity_id === s.id);
    return !evaluated
      ? "Not checked"
      : needs.length
        ? needs
            .map((f) =>
              f.field === "VerifiedCapacity"
                ? "Confirm capacity"
                : f.field === "EquipmentModel"
                  ? "Confirm model"
                  : f.field === "coverage"
                    ? "Confirm coverage"
                    : "To confirm",
            )
            .join(" · ")
        : "Confirmed";
  };
  const equipmentLabel = (s: ProposedSystem) =>
    s.equipment_ids
      .map(
        (id) =>
          options.equipment.find((e) => e.id === id)?.display_name ??
          "Saved equipment",
      )
      .join(", ");
  const systemFacts = system
    ? value.facts.filter((f) => f.system_id === system.id)
    : [];
  const fieldLabel = (id: string) =>
    configurationFields.find((d) => d.id === id)?.label ?? id;
  return (
    <>
      <FamilyOverview
        value={value}
        filter={family}
        onFilter={(f) => changeFilter(() => setFamily(f))}
        onAdd={add}
        readOnly={readOnly}
        variant="compact"
      />
      <div className="es02-info-row">
        <Icon name="info" />
        <div>
          <strong>Suggested configuration, estimator-led decisions.</strong>
          <p>
            Requirements, source evidence and review decisions stay with the
            draft. Equipment suitability needs a technical review.
          </p>
        </div>
        <button type="button" className="es02-link" onClick={() => onEvidence()}>
          <Icon name="document" className="es02-icon es02-icon-sm" />
          View configuration evidence
        </button>
      </div>
      <section className="es02-section" aria-label="Systems & configuration">
        <div className="es02-section-head">
          <div>
            <h2>Systems & configuration</h2>
            <p>
              Define systems, area coverage and the evidence behind each
              configuration.
            </p>
          </div>
        </div>
        <div className="es02-toolbar">
          <div className="es02-search">
            <Icon name="search" className="es02-icon es02-icon-sm" />
            <Field
              label="Search systems"
              name="system-search"
              placeholder="Search systems"
              value={search}
              onChange={(q) => changeFilter(() => setSearch(q))}
            />
          </div>
          <SelectField
            label="Area filter"
            name="area-filter"
            value={area || "all"}
            empty="All areas"
            options={[
              { id: "all", display_name: "All areas" },
              ...value.areas.map((a) => ({ id: a.id, display_name: a.label })),
            ]}
            onChange={(a) => changeFilter(() => setArea(a === "all" ? "" : a))}
          />
          <details className="es02-columns">
            <summary>
              <Icon name="columns" className="es02-icon es02-icon-sm" />
              Columns
            </summary>
            <div className="es02-columns-list">
              {columns.map((c, i) => (
                <div key={c}>
                  <label>
                    <input
                      type="checkbox"
                      disabled={c === "System"}
                      checked={!hidden.includes(c)}
                      onChange={(e) =>
                        preferences.save({
                          ...preferences.value,
                          hidden: e.target.checked
                            ? hidden.filter((h) => h !== c)
                            : [...hidden, c],
                        })
                      }
                    />
                    {c}
                  </label>
                  <label className="es02-width">
                    Width
                    <input
                      type="range"
                      aria-label={`${c} column width`}
                      min={110}
                      max={600}
                      step={10}
                      value={preferences.value.widths[c] ?? 180}
                      onChange={(e) =>
                        preferences.save({
                          ...preferences.value,
                          widths: {
                            ...preferences.value.widths,
                            [c]: Number(e.target.value),
                          },
                        })
                      }
                    />
                  </label>
                  <button
                    type="button"
                    className="es02-button es02-button-sm es02-button-icon"
                    aria-label={`Move ${c} left`}
                    disabled={i <= 1}
                    onClick={() => moveColumn(c, -1)}
                  >
                    <Icon name="arrow-left" className="es02-icon es02-icon-sm" />
                  </button>
                  <button
                    type="button"
                    className="es02-button es02-button-sm es02-button-icon"
                    aria-label={`Move ${c} right`}
                    disabled={i === 0 || i === columns.length - 1}
                    onClick={() => moveColumn(c, 1)}
                  >
                    <Icon name="arrow-right" className="es02-icon es02-icon-sm" />
                  </button>
                </div>
              ))}
            </div>
          </details>
          <RowMenu label="More table actions">
            <button type="button" role="menuitem" onClick={clearFilters}>
              Clear filters
            </button>
            <button
              type="button"
              role="menuitem"
              onClick={() =>
                preferences.save({
                  ...preferences.value,
                  hidden: ["Family"],
                  order: [...systemColumns],
                  widths: {},
                })
              }
            >
              Reset columns
            </button>
          </RowMenu>
          <span className="es02-spacer" />
          <button
            type="button"
            className="es02-button es02-button-primary"
            disabled={readOnly}
            onClick={() => add()}
          >
            <Icon name="plus" className="es02-icon es02-icon-sm" />
            Add system
          </button>
        </div>
        {!evaluated && (
          <p className="es02-attention" role="status">
            <span className="es02-dot es02-dot-neutral" />
            <strong>Configuration not checked</strong>
            <span>for this working proposal.</span>
          </p>
        )}
        {evaluated && configFindings.length > 0 && (
          <div className="es02-attention">
            <span className="es02-dot es02-dot-warning" />
            <strong>
              {plural(configFindings.length, "configuration finding")}
            </strong>
            <span>· on {plural(findingSystems, "system")}</span>
            <button
              type="button"
              className="es02-link"
              aria-pressed={review}
              onClick={() => {
                const next = !review;
                clearFilters();
                setReview(next);
                setSelected(null);
              }}
            >
              {review ? "Show all systems" : "Review items"}
              <Icon name="chevron-right" className="es02-icon es02-icon-sm" />
            </button>
          </div>
        )}
        <TableScroll label="Systems table">
          <table className="es02-systems-table">
            <thead>
              <tr>
                {columns
                  .filter((c) => !hidden.includes(c))
                  .map((c) => (
                    <th
                      key={c}
                      scope="col"
                      style={{
                        minWidth: preferences.value.widths[c] ?? defaultWidth[c] ?? 140,
                        width: preferences.value.widths[c],
                      }}
                    >
                      {c}
                    </th>
                  ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((s) => {
                const state = stateWord(s);
                const cells: ReactNode[] = [
                  <button
                    type="button"
                    key="name"
                    className="es02-cell-link"
                    aria-pressed={system?.id === s.id}
                    onClick={() => setSelected(s.id)}
                  >
                    <Icon name={familyGlyph[s.family] ?? "other"} className="es02-icon es02-icon-sm" />
                    {s.name || "New system"}
                  </button>,
                  <span key="coverage" title={coverageLabel(s, value.areas)}>
                    {compactCoverage(coverageLabel(s, value.areas))}
                  </span>,
                  equipmentLabel(s) ? (
                    <span>
                      {s.equipment_ids.map((id, i) => {
                        const [reference, ...rest] = (
                          options.equipment.find((e) => e.id === id)?.display_name ??
                          "Saved equipment"
                        ).split(" · ");
                        return (
                          <span key={id}>
                            {i > 0 ? ", " : ""}
                            {reference}
                            {rest.length > 0 && (
                              <span className="es02-secondary"> · {rest.join(" · ")}</span>
                            )}
                          </span>
                        );
                      })}
                    </span>
                  ) : (
                    <span className="es02-secondary">Proposed</span>
                  ),
                  intentLabel(s.intent),
                  <button
                    type="button"
                    key="evidence"
                    className="es02-cell-evidence"
                    onClick={() => onEvidence(s.evidence_ids[0])}
                  >
                    {value.evidence.find((e) => e.id === s.evidence_ids[0])
                      ?.observation || "Evidence not recorded"}
                  </button>,
                  <StateTag key="state" value={state} />,
                  familyLabel(s.family),
                ];
                return (
                  <tr key={s.id} data-selected={system?.id === s.id}>
                    {columns
                      .filter((c) => !hidden.includes(c))
                      .map((c) => (
                        <td key={c}>{cells[systemColumns.indexOf(c)]}</td>
                      ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </TableScroll>
        {!rows.length && (
          <p className="es02-empty">
            <span>
              {value.systems.length ? (
                <>
                  <strong>No matching systems.</strong> 0 of{" "}
                  {plural(value.systems.length, "system")} · no selection
                  {search ? ` · nothing matches “${search}”` : ""}
                  {family ? ` in ${familyLabel(family)}` : ""}
                  {area ? ` in ${value.areas.find((a) => a.id === area)?.label ?? "this area"}` : ""}
                  {review ? " · no systems carry a finding" : ""}.
                </>
              ) : (
                "No systems recorded yet. Add a system from a family card or the toolbar."
              )}
            </span>
            {(search || family || area || review) && (
              <button type="button" className="es02-button es02-button-sm" onClick={() => changeFilter(clearFilters)}>
                Clear filters
              </button>
            )}
          </p>
        )}
        <p className="es02-table-foot">
          <span>
            <strong>
              {rows.length === value.systems.length
                ? plural(value.systems.length, "system")
                : `${rows.length} of ${plural(value.systems.length, "system")}`}
            </strong>{" "}
            · {system ? 1 : 0} selected
          </span>
          <span>Shared systems are counted once.</span>
        </p>
        {system ? (
          <section className="es02-editor" aria-label="Selected system editor">
            <div className="es02-editor-head">
              <h3>{system.name || "New system"}</h3>
              <Tag tone={system.intent === "New" ? "info" : "neutral"}>
                {system.intent === "New" ? "Proposed system" : "Existing equipment"}
              </Tag>
              <div className="es02-actions">
                {system.equipment_ids.map((id) => (
                  <a
                    key={id}
                    className="es02-button"
                    href={`/equipment/${id}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <Icon name="external" className="es02-icon es02-icon-sm" />
                    View equipment
                  </a>
                ))}
                <button
                  type="button"
                  className="es02-button"
                  aria-expanded={technical}
                  aria-controls={technicalId}
                  onClick={() => setTechnical(!technical)}
                >
                  Technical details
                  <Icon name="chevron-down" className="es02-icon es02-icon-sm es02-icon-toggle" />
                </button>
                <button
                  type="button"
                  className="es02-button es02-button-danger"
                  disabled={readOnly}
                  onClick={() => removeSystem(system)}
                >
                  Remove system
                </button>
              </div>
            </div>
            <fieldset disabled={readOnly} className="es02-fields">
              <div className="es02-grid-2">
                <Field
                  label="System name"
                  name="system.name"
                  value={system.name}
                  maxLength={100}
                  onChange={(name) => update({ name })}
                />
                <div>
                  <SelectField
                    label="Equipment family"
                    name="system.family"
                    value={system.family}
                    options={equipmentFamilies.map((f) => ({
                      id: f.id,
                      display_name: f.label,
                    }))}
                    onChange={(family) => update({ family: family as Family })}
                  />
                  <small className="es02-subtle" style={{ display: "block", marginTop: -8, marginBottom: 12, fontSize: 12 }}>
                    Presentation family. Separate from the Product supply, Defined
                    labour and Freight work tags.
                  </small>
                </div>
                <LabelledChips
                  label="Equipment references"
                  options={options.equipment.map((e) => ({
                    id: e.id,
                    label: e.display_name,
                  }))}
                  values={system.equipment_ids}
                  onChange={(equipment_ids) => update({ equipment_ids })}
                  empty="No permitted equipment in this Site · the system stays Proposed"
                  hint="Selecting equipment offers observed facts; it never confirms a requirement."
                />
                <SelectField
                  label="Intent"
                  name="system.intent"
                  value={system.intent}
                  options={[
                    { id: "New", display_name: "New" },
                    { id: "Retain", display_name: "Retain" },
                    { id: "RetainExpand", display_name: "Retain + expand" },
                  ]}
                  onChange={(intent) =>
                    update({ intent: intent as ProposedSystem["intent"] })
                  }
                />
                <Field
                  label="System type"
                  name="system.type"
                  value={system.type}
                  maxLength={100}
                  onChange={(type) => update({ type })}
                />
                <SelectField
                  label="Area coverage"
                  name="coverage.mode"
                  value={system.coverage.mode}
                  options={[
                    { id: "Defined", display_name: "Defined area coverage" },
                    { id: "NotAreaSpecific", display_name: "Not area-specific" },
                    { id: "Unknown", display_name: "Unknown coverage" },
                  ]}
                  onChange={(mode) =>
                    update({
                      coverage: {
                        mode: mode as ProposedSystem["coverage"]["mode"],
                        area_ids: [],
                        source: null,
                        reason: mode === "Defined" ? null : "",
                        follow_up: mode === "Unknown" ? own : null,
                      },
                    })
                  }
                />
                <div className="es02-span-2">
                  {system.coverage.mode === "Defined" ? (
                    <LabelledChips
                      label="Covered areas"
                      options={value.areas.map((a) => ({ id: a.id, label: a.label || "New area" }))}
                      values={system.coverage.area_ids}
                      onChange={(area_ids) =>
                        update({ coverage: { ...system.coverage, area_ids } })
                      }
                      empty="Add an area in Requirements first"
                      hint={`Defined area coverage · ${system.coverage.area_ids.length} of ${plural(value.areas.length, "scoped location")}. Adding an area never extends this system on its own.`}
                    />
                  ) : (
                    <div className="es02-grid-2">
                      <Field
                        label="Coverage reason"
                        name="coverage.reason"
                        value={system.coverage.reason ?? ""}
                        onChange={(reason) =>
                          update({ coverage: { ...system.coverage, reason } })
                        }
                        maxLength={500}
                      />
                      <Field
                        label="Coverage source"
                        name="coverage.source"
                        value={system.coverage.source ?? ""}
                        onChange={(source) =>
                          update({
                            coverage: { ...system.coverage, source: source || null },
                          })
                        }
                        maxLength={500}
                      />
                      {system.coverage.follow_up && (
                        <div className="es02-span-2">
                          <FollowUpFields
                            label="Coverage"
                            value={system.coverage.follow_up}
                            owners={options.owners}
                            onChange={(follow_up) =>
                              update({ coverage: { ...system.coverage, follow_up } })
                            }
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <div className="es02-span-2">
                  <Field
                    label="Proposed work"
                    name="system.proposed_work"
                    value={system.proposed_work}
                    maxLength={1000}
                    multiline
                    onChange={(proposed_work) => update({ proposed_work })}
                  />
                </div>
                <div className="es02-span-2">
                  <LabelledChips
                    label="System evidence"
                    options={value.evidence.map((e) => ({
                      id: e.id,
                      label: e.observation || "New observation",
                    }))}
                    values={system.evidence_ids}
                    onChange={(evidence_ids) => update({ evidence_ids })}
                    empty="No evidence recorded yet"
                    hint={
                      <button
                        type="button"
                        className="es02-link"
                        onClick={() => onEvidence(system.evidence_ids[0])}
                      >
                        View evidence
                      </button>
                    }
                  />
                </div>
              </div>
            </fieldset>
            <h4 className="es02-h3">Evidence</h4>
            {systemFacts.length ? (
              <div className="es02-facts">
                <TableScroll label={`Evidence facts for ${system.name || "this system"}`}>
                  <table>
                    <thead>
                      <tr>
                        <th scope="col">Fact</th>
                        <th scope="col">Value</th>
                        <th scope="col">Source and state</th>
                      </tr>
                    </thead>
                    <tbody>
                      {systemFacts.map((f) => (
                        <tr key={f.id}>
                          <td>
                            {fieldLabel(f.field)}
                            <br />
                            <span className="es02-secondary">{f.role}</span>
                          </td>
                          <td>
                            <strong>
                              {f.value == null || f.value === ""
                                ? f.state === "Unknown"
                                  ? "Not yet verified"
                                  : "No value"
                                : `${f.value}${f.unit === "Zones" ? ` ${Number(f.value) === 1 ? "zone" : "zones"}` : ""}`}
                            </strong>
                          </td>
                          <td>
                            {f.source || (
                              <span className="es02-secondary">
                                {f.state === "Unknown" ? "Check required" : "No source"}
                              </span>
                            )}{" "}
                            <StateTag value={f.state === "Unknown" ? "Not verified" : f.state} />
                            {f.follow_up && (
                              <>
                                <br />
                                <span className="es02-secondary">
                                  Follow-up ·{" "}
                                  {f.follow_up.reason || "reason to record"} ·{" "}
                                  {options.owners.find((o) => o.id === f.follow_up?.owner_id)
                                    ?.display_name ?? "Recorded owner"}
                                </span>
                              </>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </TableScroll>
              </div>
            ) : (
              <p className="es02-note">
                No typed facts recorded for this system. Technical details holds
                the supported facts; required capacity and observed capability
                stay separate.
              </p>
            )}
            <div id={technicalId} hidden={!technical} className="es02-details-body">
              <fieldset disabled={readOnly} className="es02-fields" aria-label="Technical details">
                <p className="es02-note">
                  Required capacity and observed equipment capability are
                  separate. No calculator or engineering certification is
                  implied.
                </p>
                {systemFacts.map((f) => (
                  <fieldset className="es02-fact" key={f.id}>
                    <legend>{fieldLabel(f.field)}</legend>
                    <div className="es02-fact-head">
                      <StateTag value={f.state} />
                      <div className="es02-actions">
                        <button
                          type="button"
                          className="es02-link"
                          onClick={() => {
                            if (window.confirm("Remove this working fact and its follow-ups?"))
                              onChange({
                                ...value,
                                facts: value.facts.filter((x) => x.id !== f.id),
                                follow_ups: value.follow_ups.filter((x) => x.fact_id !== f.id),
                              });
                          }}
                        >
                          Remove fact
                        </button>
                      </div>
                    </div>
                    <div className="es02-grid-2">
                      <SelectField
                        label="Fact role"
                        name={`${f.id}.role`}
                        value={f.role}
                        options={labels(["Requirement", "Observation", "Capability", "Assumption"])}
                        onChange={(role) => fact(f, { role: role as ConfigurationFact["role"] })}
                      />
                      <SelectField
                        label="Fact state"
                        name={`${f.id}.state`}
                        value={f.state}
                        options={labels(["Answered", "Confirmed", "Unknown", "Assumed"])}
                        onChange={(state) =>
                          fact(
                            f,
                            {
                              state: state as ScopeState,
                              ...(state === "Unknown" ? { value: null } : {}),
                              follow_up: state === "Confirmed" ? null : (f.follow_up ?? own),
                            },
                            true,
                          )
                        }
                      />
                      <Field
                        label={`${fieldLabel(f.field)} (${f.unit})`}
                        name={`${f.id}.value`}
                        value={f.value == null ? "" : String(f.value)}
                        onChange={(v) =>
                          fact(f, {
                            value: f.unit === "Zones" ? (v === "" ? null : Number(v)) : v,
                            ...(f.state === "Unknown"
                              ? { state: "Answered", follow_up: f.follow_up ?? own }
                              : {}),
                          })
                        }
                        type={f.unit === "Zones" ? "number" : "text"}
                      />
                      <Field
                        label="Fact source"
                        name={`${f.id}.source`}
                        value={f.source}
                        onChange={(source) => fact(f, { source })}
                        maxLength={500}
                      />
                    </div>
                    <LabelledChips
                      label={`${fieldLabel(f.field)} evidence`}
                      options={value.evidence.map((e) => ({ id: e.id, label: e.observation || "New observation" }))}
                      values={f.evidence_ids}
                      onChange={(evidence_ids) => fact(f, { evidence_ids })}
                      empty="No evidence recorded yet"
                    />
                    {f.follow_up && (
                      <FollowUpFields
                        label={`Fact ${f.field}`}
                        value={f.follow_up}
                        owners={options.owners}
                        onChange={(follow_up) => fact(f, { follow_up }, true)}
                      />
                    )}
                  </fieldset>
                ))}
                <div className="es02-grid-2">
                  <SelectField
                    label="Add technical fact"
                    name="add-fact"
                    value=""
                    empty="Choose a supported fact…"
                    options={configurationFields
                      .filter((d) => !value.facts.some((f) => f.system_id === system.id && f.field === d.id))
                      .map((d) => ({ id: d.id, display_name: d.label }))}
                    onChange={(id) => {
                      const d = configurationFields.find((f) => f.id === id);
                      if (d)
                        onChange({
                          ...value,
                          facts: [
                            ...value.facts,
                            {
                              id: crypto.randomUUID(),
                              lineage: null,
                              system_id: system.id,
                              field: d.id,
                              role: d.role,
                              value: null,
                              unit: d.unit,
                              state: "Unknown",
                              source: "",
                              evidence_ids: [],
                              follow_up: own,
                            },
                          ],
                        });
                    }}
                  />
                </div>
              </fieldset>
            </div>
          </section>
        ) : (
          <p className="es02-editor-prompt">
            Select a system to edit its configuration. Working edits stay in the
            proposal when filters change.
          </p>
        )}
      </section>
    </>
  );
}

const partyLabel = (party: Responsibility["party"]) =>
  party === "PPO" ? "Powerplants" : party;
const participationLabel = (p: Responsibility["participation"]) =>
  p === "Optional" ? "Optional extra" : p;

export function ResponsibilitiesEditor({
  value,
  onChange,
  options,
  readOnly = false,
  focus,
}: Props) {
  const own = { owner_id: options.owner.id, reason: "" };
  const [selected, setSelected] = useState<string | null>(null),
    r = value.responsibilities.find((x) => x.id === selected);
  useFieldFocus(
    focus,
    (f) => value.responsibilities.some((x) => x.id === f.entity_id),
    (f) => setSelected(f.entity_id),
    (f) => (f.entity_id ? `${f.entity_id}.${f.field === "party" ? "party" : "work"}` : null),
  );
  const update = (patch: Partial<Responsibility>) =>
    r &&
    onChange({
      ...value,
      responsibilities: value.responsibilities.map((x) =>
        x.id === r.id ? { ...x, ...patch } : x,
      ),
    });
  const subject = (x: Responsibility) =>
    [
      ...x.system_ids.map((id) => value.systems.find((s) => s.id === id)?.name ?? "Saved system"),
      ...x.area_ids.map((id) => value.areas.find((a) => a.id === id)?.label ?? "Saved area"),
    ].join(" · ");
  const included = value.responsibilities.filter((x) => x.participation === "Included").length,
    optional = value.responsibilities.filter((x) => x.participation === "Optional").length,
    excluded = value.responsibilities.filter((x) => x.participation === "Excluded").length,
    gaps = value.responsibilities.filter((x) => x.party === "Unknown").length;
  const removeItem = (x: Responsibility) => {
    if (window.confirm(`Remove ${x.work || "this work item"} from the working proposal?`)) {
      onChange({
        ...value,
        responsibilities: value.responsibilities.filter((y) => y.id !== x.id),
      });
      setSelected(null);
    }
  };
  return (
    <>
      <section className="es02-section" aria-label="Scope responsibilities">
        <div className="es02-section-head">
          <div>
            <h2>Scope & responsibilities</h2>
            <p>
              Responsibility labels are proposals. They book nothing and commit
              nobody.
            </p>
          </div>
          <div className="es02-actions">
            <button
              type="button"
              className="es02-button"
              disabled={readOnly}
              onClick={() => {
                const id = crypto.randomUUID();
                onChange({
                  ...value,
                  responsibilities: [
                    ...value.responsibilities,
                    {
                      id,
                      lineage: null,
                      area_ids: [],
                      system_ids: [],
                      work: "",
                      participation: "Included",
                      party: "Unknown",
                      requested_on: null,
                      source: "",
                      state: "Unknown",
                      follow_up: own,
                    },
                  ],
                });
                setSelected(id);
              }}
            >
              <Icon name="plus" className="es02-icon es02-icon-sm" />
              Add work item
            </button>
          </div>
        </div>
        {value.responsibilities.length > 0 ? (
          <TableScroll label="Scope and responsibilities table">
            <table>
              <thead>
                <tr>
                  {[
                    "Area / system",
                    "Work item",
                    "Inclusion",
                    "Responsible",
                    "Requested timing",
                    "Source",
                    "Confirmation",
                    "Next action",
                    "Actions",
                  ].map((h) => (
                    <th key={h} scope="col">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {value.responsibilities.map((x) => (
                  <tr key={x.id} data-selected={x.id === selected}>
                    <td>{subject(x) || <span className="es02-secondary">—</span>}</td>
                    <td>
                      <button
                        type="button"
                        className="es02-cell-link"
                        aria-pressed={x.id === selected}
                        onClick={() => setSelected(x.id)}
                      >
                        {x.work || "New work item"}
                      </button>
                    </td>
                    <td>
                      <Tag tone={x.participation === "Included" ? "neutral" : x.participation === "Optional" ? "info" : "danger"}>
                        {participationLabel(x.participation)}
                      </Tag>
                    </td>
                    <td>
                      {x.party === "Unknown" ? (
                        <span className="es02-secondary">Unknown</span>
                      ) : (
                        partyLabel(x.party)
                      )}
                    </td>
                    <td>{x.requested_on ?? <span className="es02-secondary">—</span>}</td>
                    <td>{x.source || <span className="es02-secondary">—</span>}</td>
                    <td>
                      <StateTag value={x.state === "Unknown" ? "Deferred" : x.state} />
                    </td>
                    <td>
                      {x.party === "Unknown"
                        ? "Assign party"
                        : x.follow_up?.reason || <span className="es02-secondary">—</span>}
                    </td>
                    <td>
                      <RowMenu label={`Actions for ${x.work || "new work item"}`}>
                        <button type="button" role="menuitem" onClick={() => setSelected(x.id)}>
                          Edit work item
                        </button>
                        <button type="button" role="menuitem" disabled={readOnly} onClick={() => removeItem(x)}>
                          Remove work item
                        </button>
                      </RowMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableScroll>
        ) : (
          <p className="es02-empty">
            No work items recorded. Add the work each party is proposed to carry
            out; nothing here books or commits anyone.
          </p>
        )}
        {value.responsibilities.length > 0 && (
          <p className="es02-table-foot">
            <span>
              <strong>{included} included</strong> · {optional} optional extra ·{" "}
              {excluded} excluded
            </span>
            <span>{plural(gaps, "responsibility gap", "No responsibility gaps")}</span>
          </p>
        )}
        {r && (
          <fieldset disabled={readOnly} className="es02-editor es02-fields" aria-label="Selected work item editor">
            <div className="es02-editor-head">
              <h3>{r.work || "New work item"}</h3>
              <StateTag value={r.state} />
              <div className="es02-actions">
                <button type="button" className="es02-button es02-button-danger" onClick={() => removeItem(r)}>
                  Remove work item
                </button>
              </div>
            </div>
            <div className="es02-grid-2">
              <div className="es02-span-2">
                <Field
                  label="Work item"
                  name={`${r.id}.work`}
                  value={r.work}
                  multiline
                  maxLength={1000}
                  onChange={(work) => update({ work })}
                />
              </div>
              <SelectField
                label="Participation"
                name={`${r.id}.participation`}
                value={r.participation}
                options={[
                  { id: "Included", display_name: "Included" },
                  { id: "Optional", display_name: "Optional extra" },
                  { id: "Excluded", display_name: "Excluded" },
                ]}
                onChange={(participation) =>
                  update({ participation: participation as Responsibility["participation"] })
                }
              />
              <SelectField
                label="Responsible party"
                name={`${r.id}.party`}
                value={r.party}
                options={[
                  { id: "PPO", display_name: "Powerplants" },
                  { id: "Customer", display_name: "Customer" },
                  { id: "Supplier", display_name: "Supplier" },
                  { id: "Unknown", display_name: "Unknown" },
                ]}
                onChange={(party) => update({ party: party as Responsibility["party"] })}
              />
              <Field
                label="Requested date"
                name={`${r.id}.date`}
                type="date"
                value={r.requested_on ?? ""}
                onChange={(requested_on) => update({ requested_on: requested_on || null })}
                hint="A requested date is not a delivery commitment."
              />
              <Field
                label="Responsibility source"
                name={`${r.id}.source`}
                value={r.source}
                maxLength={500}
                onChange={(source) => update({ source })}
              />
              <SelectField
                label="Responsibility state"
                name={`${r.id}.state`}
                value={r.state}
                options={labels(["Answered", "Confirmed", "Unknown", "Assumed"])}
                onChange={(state) =>
                  update({
                    state: state as ScopeState,
                    follow_up: state === "Confirmed" ? null : (r.follow_up ?? own),
                  })
                }
              />
              <LabelledChips
                label="Areas"
                options={value.areas.map((a) => ({ id: a.id, label: a.label || "New area" }))}
                values={r.area_ids}
                onChange={(area_ids) => update({ area_ids })}
                empty="No areas recorded"
              />
              <LabelledChips
                label="Systems"
                options={value.systems.map((s) => ({ id: s.id, label: s.name || "New system" }))}
                values={r.system_ids}
                onChange={(system_ids) => update({ system_ids })}
                empty="No systems recorded"
              />
            </div>
            {r.follow_up && (
              <FollowUpFields
                label="Responsibility"
                value={r.follow_up}
                owners={options.owners}
                onChange={(follow_up) => update({ follow_up })}
              />
            )}
          </fieldset>
        )}
      </section>
      <section className="es02-section" aria-label="Discovery follow-ups">
        <div className="es02-section-head">
          <div>
            <h2>Discovery follow-ups</h2>
            <p>
              Owned questions that keep discovery incomplete until they are
              answered. A linked Activity is only ever an existing permitted one.
            </p>
          </div>
          <div className="es02-actions">
            <button
              type="button"
              className="es02-button"
              disabled={readOnly}
              onClick={() =>
                onChange({
                  ...value,
                  follow_ups: [
                    ...value.follow_ups,
                    { id: crypto.randomUUID(), lineage: null, ...own, due_on: null, fact_id: null, activity_id: null },
                  ],
                })
              }
            >
              <Icon name="plus" className="es02-icon es02-icon-sm" />
              Add discovery follow-up
            </button>
          </div>
        </div>
        <fieldset disabled={readOnly} className="es02-fields">
          {value.follow_ups.length === 0 && (
            <p className="es02-note">No discovery follow-ups recorded.</p>
          )}
          {value.follow_ups.map((f) => {
            const update = (patch: Partial<typeof f>) =>
              onChange({
                ...value,
                follow_ups: value.follow_ups.map((x) => (x.id === f.id ? { ...x, ...patch } : x)),
              });
            return (
              <fieldset className="es02-fact" key={f.id}>
                <legend>{f.reason || "New follow-up"}</legend>
                <div className="es02-fact-head">
                  <span className="es02-subtle">
                    {f.due_on ? `Recorded due ${f.due_on}` : "Due date unknown"}
                  </span>
                  <div className="es02-actions">
                    <button
                      type="button"
                      className="es02-link"
                      onClick={() =>
                        onChange({ ...value, follow_ups: value.follow_ups.filter((x) => x.id !== f.id) })
                      }
                    >
                      Remove follow-up
                    </button>
                  </div>
                </div>
                <FollowUpFields
                  label="Discovery follow-up"
                  value={f}
                  owners={options.owners}
                  onChange={(v) => update(v)}
                />
                <div className="es02-grid-3">
                  <Field
                    label="Recorded discovery due date"
                    name={`${f.id}.due`}
                    type="date"
                    value={f.due_on ?? ""}
                    onChange={(due_on) => update({ due_on: due_on || null })}
                  />
                  <SelectField
                    label="Originating fact"
                    name={`${f.id}.fact`}
                    value={f.fact_id ?? ""}
                    options={value.facts.map((v) => ({
                      id: v.id,
                      display_name: `${value.systems.find((s) => s.id === v.system_id)?.name} · ${v.field}`,
                    }))}
                    onChange={(fact_id) => update({ fact_id: fact_id || null })}
                  />
                  <Field
                    label="Existing Activity ID (optional)"
                    name={`${f.id}.activity`}
                    value={f.activity_id ?? ""}
                    onChange={(activity_id) => update({ activity_id: activity_id || null })}
                    hint="Only an actual permitted Activity is accepted. No Activity is created or completed here."
                  />
                </div>
              </fieldset>
            );
          })}
        </fieldset>
      </section>
    </>
  );
}
