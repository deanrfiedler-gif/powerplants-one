"use client";
import { useState } from "react";
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
  type ScopeState,
} from "../estimating/configuration-definition";
import { useIdentity } from "./business-session";
import { useScopePreferences, systemColumns } from "./scope-preferences";

const checks = (
  options: { id: string; label: string }[],
  values: string[],
  change: (ids: string[]) => void,
) => (
  <div className="es02-checks">
    {options.map((o) => (
      <label key={o.id}>
        <input
          type="checkbox"
          checked={values.includes(o.id)}
          onChange={(e) =>
            change(
              e.target.checked
                ? [...values, o.id]
                : values.filter((id) => id !== o.id),
            )
          }
        />
        {o.label}
      </label>
    ))}
  </div>
);
type Props = {
  value: Configuration;
  onChange: (value: Configuration) => void;
  options: FormOptions;
  findings: readonly DiscoveryFinding[];
  onEvidence: (id?: string) => void;
  readOnly?: boolean;
  evaluated?: boolean;
};
export function FamilyOverview({
  value,
  filter,
  onFilter,
  onAdd,
  onConfigure,
  readOnly = false,
}: {
  value: Configuration;
  filter?: string;
  onFilter?: (id: string) => void;
  onAdd?: (family: Family) => void;
  onConfigure?: () => void;
  readOnly?: boolean;
}) {
  const counts = configurationCounts(value);
  return (
    <section
      className="es02-families"
      aria-label="Equipment families in this estimate"
    >
      <div className="es02-section-title">
        <h2>Equipment families in this estimate</h2>
        {onConfigure && (
          <button type="button" onClick={onConfigure}>
            Configure systems →
          </button>
        )}
        {onFilter && (
          <button
            type="button"
            onClick={() => onFilter("")}
            aria-pressed={!filter}
          >
            All families
          </button>
        )}
      </div>
      <div className="es02-family-grid">
        {equipmentFamilies.slice(0, 4).map((f) => (
          <div key={f.id}>
            <button
              type="button"
              disabled={!onFilter && !onConfigure}
              aria-pressed={filter === f.id}
              onClick={() => (onFilter ? onFilter(f.id) : onConfigure?.())}
            >
              {f.label}
              <span className="mw-tag">{counts.families[f.id]} systems</span>
            </button>
            {onAdd && (
              <button
                type="button"
                disabled={readOnly}
                aria-label={`Add ${f.label} system`}
                onClick={() => onAdd(f.id)}
              >
                + Add
              </button>
            )}
          </div>
        ))}
      </div>
      <div className="es02-toolbar">
        {equipmentFamilies
          .slice(4)
          .filter((f) => f.id !== "Other" || counts.families.Other > 0)
          .map((f) => (
            <button
              type="button"
              key={f.id}
              aria-pressed={filter === f.id}
              onClick={() => (onFilter ? onFilter(f.id) : onConfigure?.())}
            >
              {f.label} <span className="mw-tag">{counts.families[f.id]}</span>
            </button>
          ))}
      </div>
    </section>
  );
}
export function AreasEditor({
  value,
  onChange,
  options,
  onEvidence,
  readOnly = false,
}: Props) {
  const [selected, setSelected] = useState<string | null>(null),
    a = value.areas.find((a) => a.id === selected);
  const update = (patch: Partial<Area>) =>
    a &&
    onChange({
      ...value,
      areas: value.areas.map((x) => (x.id === a.id ? { ...x, ...patch } : x)),
    });
  const own = { owner_id: options.owner.id, reason: "" };
  return (
    <section aria-label="Estimating areas">
      <div className="es02-section-title">
        <h2>Estimating areas</h2>
        <button
          type="button"
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
          + Add area
        </button>
      </div>
      <div className="es02-table-scroll">
        <table>
          <thead>
            <tr>
              {[
                "Area",
                "Facility",
                "Use/crop context",
                "Stage",
                "Evidence/state",
                "Actions",
              ].map((x) => (
                <th key={x}>{x}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {value.areas.map((a) => (
              <tr key={a.id}>
                <td>
                  <button type="button" onClick={() => setSelected(a.id)}>
                    {a.label || "New area"}
                  </button>{" "}
                  · {a.purpose}
                </td>
                <td>
                  {options.facilities.find((f) => f.id === a.facility_id)
                    ?.display_name ??
                    (a.facility_id ? "Saved Facility" : "Not linked")}
                </td>
                <td>{a.use ?? "Not recorded"}</td>
                <td>{a.stage ?? "Not recorded"}</td>
                <td>
                  <button
                    type="button"
                    onClick={() => onEvidence(a.evidence_ids[0])}
                  >
                    {a.source || "Evidence not recorded"}
                  </button>{" "}
                  · {a.state}
                </td>
                <td>
                  <button
                    type="button"
                    disabled={readOnly}
                    onClick={() => {
                      const dependants =
                        value.systems.filter((s) =>
                          s.coverage.area_ids.includes(a.id),
                        ).length +
                        value.responsibilities.filter((r) =>
                          r.area_ids.includes(a.id),
                        ).length;
                      if (dependants) {
                        window.alert(
                          `${dependants} working systems or responsibilities refer to this area. Reassign their membership before removing it.`,
                        );
                        return;
                      }
                      if (
                        window.confirm(
                          `Remove ${a.label || "this area"} from the working proposal? Saved history and prices remain unchanged.`,
                        )
                      ) {
                        onChange({
                          ...value,
                          areas: value.areas.filter((x) => x.id !== a.id),
                        });
                        setSelected(null);
                      }
                    }}
                  >
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!value.areas.length && (
        <p>
          No estimating areas recorded. NoSiteRequired scope can use attributed
          non-area coverage.
        </p>
      )}
      {a && (
        <fieldset disabled={readOnly} className="es02-editor">
          <h3>{a.label || "New estimating area"}</h3>
          <div className="e2-grid">
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
            <Field
              label="Area source"
              name="area.source"
              value={a.source}
              onChange={(source) => update({ source })}
              maxLength={500}
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
          </div>
          {checks(
            value.evidence.map((e) => ({ id: e.id, label: e.observation })),
            a.evidence_ids,
            (evidence_ids) => update({ evidence_ids }),
          )}
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
}: Props) {
  const [family, setFamily] = useState(""),
    [area, setArea] = useState(""),
    [search, setSearch] = useState(""),
    [selected, setSelected] = useState<string | null>(null),
    [review, setReview] = useState(false);
  const identity = useIdentity(),
    preferences = useScopePreferences(
      `${identity.workspace_id}:${identity.actor_id}:es02-systems`,
    );
  const columns = preferences.value.order,
    hidden = preferences.value.hidden;
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
    own = { owner_id: options.owner.id, reason: "" };
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
    setFamily("");
    setArea("");
    setSearch("");
    setReview(false);
    setSelected(id);
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
  return (
    <>
      <FamilyOverview
        value={value}
        filter={family}
        onFilter={(f) => changeFilter(() => setFamily(f))}
        onAdd={add}
        readOnly={readOnly}
      />
      <div className="es02-guidance">
        <strong>Suggested configuration, estimator-led decisions.</strong>
        <p>
          Requirements, source evidence and review decisions stay with the
          draft. Equipment suitability needs a technical review.
        </p>
        <button type="button" onClick={() => onEvidence()}>
          View configuration evidence
        </button>
      </div>
      <section aria-label="Systems & configuration">
        <h2>Systems & configuration</h2>
        <p>
          Define systems, area coverage and the evidence behind each
          configuration.
        </p>
        <div className="es02-toolbar">
          <Field
            label="Search systems"
            name="system-search"
            value={search}
            onChange={(q) => changeFilter(() => setSearch(q))}
          />
          <SelectField
            label="Area filter"
            name="area-filter"
            value={area || "all"}
            options={[
              { id: "all", display_name: "All areas" },
              ...value.areas.map((a) => ({ id: a.id, display_name: a.label })),
            ]}
            onChange={(a) => changeFilter(() => setArea(a === "all" ? "" : a))}
          />
          <details className="es02-columns">
            <summary>Columns</summary>
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
                <label>
                  Width (px)
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
                  aria-label={`Move ${c} left`}
                  disabled={i <= 1}
                  onClick={() => moveColumn(c, -1)}
                >
                  ←
                </button>
                <button
                  type="button"
                  aria-label={`Move ${c} right`}
                  disabled={i === 0 || i === columns.length - 1}
                  onClick={() => moveColumn(c, 1)}
                >
                  →
                </button>
              </div>
            ))}
          </details>
          <button
            type="button"
            className="es02-primary"
            disabled={readOnly}
            onClick={() => add()}
          >
            + Add system
          </button>
        </div>
        {!evaluated && (
          <p role="status">
            Configuration not checked for this working proposal.
          </p>
        )}
        {evaluated && configFindings.length > 0 && (
          <div className="es02-attention">
            <span aria-hidden="true">△</span> {configFindings.length}{" "}
            configuration items need confirmation{" "}
            <button
              type="button"
              onClick={() => {
                setReview(!review);
                setFamily("");
                setArea("");
                setSearch("");
                setSelected(null);
              }}
            >
              {review ? "Show all systems" : "Review items"}
            </button>
          </div>
        )}
        <div className="es02-table-scroll">
          <table className="es02-systems-table">
            <thead>
              <tr>
                {columns
                  .filter((c) => !hidden.includes(c))
                  .map((c) => (
                    <th
                      key={c}
                      style={{
                        minWidth: preferences.value.widths[c] ?? 140,
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
                const needs = configFindings.filter(
                  (f) => f.entity_id === s.id,
                );
                const cells = [
                  <button
                    type="button"
                    key="name"
                    aria-pressed={system?.id === s.id}
                    onClick={() => setSelected(s.id)}
                  >
                    {s.name || "New system"}
                  </button>,
                  coverageLabel(s, value.areas),
                  s.equipment_ids
                    .map(
                      (id) =>
                        options.equipment.find((e) => e.id === id)
                          ?.display_name ?? "Saved equipment",
                    )
                    .join(", ") || "Proposed",
                  labels([s.intent])[0].display_name,
                  <button
                    type="button"
                    key="evidence"
                    onClick={() => onEvidence(s.evidence_ids[0])}
                  >
                    {value.evidence.find((e) => e.id === s.evidence_ids[0])
                      ?.observation ?? "Evidence not recorded"}
                  </button>,
                  !evaluated
                    ? "Not checked"
                    : needs.length
                      ? needs
                          .map((f) =>
                            f.field === "VerifiedCapacity"
                              ? "Confirm capacity"
                              : f.field === "EquipmentModel"
                                ? "Confirm model"
                                : "To confirm",
                          )
                          .join(" · ")
                      : "Confirmed",
                  equipmentFamilies.find((f) => f.id === s.family)?.label ??
                    s.family,
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
        </div>
        {!rows.length && (
          <p>
            No matching systems.{" "}
            <button
              type="button"
              onClick={() =>
                changeFilter(() => {
                  setFamily("");
                  setArea("");
                  setSearch("");
                  setReview(false);
                })
              }
            >
              Clear filters
            </button>
          </p>
        )}
        <p className="es02-table-footer">
          {rows.length === value.systems.length
            ? `${value.systems.length} systems`
            : `${rows.length} of ${value.systems.length} systems`}{" "}
          · {system ? 1 : 0} selected{" "}
          <span>Shared systems are counted once.</span>
        </p>
        {system ? (
          <section className="es02-editor" aria-label="Selected system editor">
            <div className="es02-section-title">
              <h3>{system.name || "New system"}</h3>
              {system.intent !== "New" && (
                <span className="mw-tag">Existing equipment</span>
              )}
              {system.equipment_ids.map((id) => (
                <a
                  key={id}
                  href={`/equipment/${id}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  View equipment
                </a>
              ))}
              <button
                type="button"
                disabled={readOnly}
                onClick={() => {
                  const factIds = value.facts
                    .filter((f) => f.system_id === system.id)
                    .map((f) => f.id);
                  if (
                    window.confirm(
                      `Remove ${system.name || "this system"}, its ${factIds.length} working facts and their follow-ups, and its responsibility memberships? Saved history and costs remain unchanged.`,
                    )
                  ) {
                    onChange({
                      ...value,
                      systems: value.systems.filter((s) => s.id !== system.id),
                      facts: value.facts.filter(
                        (f) => f.system_id !== system.id,
                      ),
                      follow_ups: value.follow_ups.filter(
                        (f) => !factIds.includes(f.fact_id ?? ""),
                      ),
                      responsibilities: value.responsibilities.map((r) => ({
                        ...r,
                        system_ids: r.system_ids.filter(
                          (id) => id !== system.id,
                        ),
                      })),
                    });
                    setSelected(null);
                  }
                }}
              >
                Remove system
              </button>
            </div>
            <fieldset disabled={readOnly} className="es02-fields">
              <div className="e2-grid">
                <Field
                  label="System name"
                  name="system.name"
                  value={system.name}
                  maxLength={100}
                  onChange={(name) => update({ name })}
                />
                <div>
                  <h4>Equipment references</h4>
                  {checks(
                    options.equipment.map((e) => ({
                      id: e.id,
                      label: e.display_name,
                    })),
                    system.equipment_ids,
                    (equipment_ids) => update({ equipment_ids }),
                  )}
                </div>
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
                <Field
                  label="System type"
                  name="system.type"
                  value={system.type}
                  maxLength={100}
                  onChange={(type) => update({ type })}
                />
                <SelectField
                  label="Intent"
                  name="system.intent"
                  value={system.intent}
                  options={labels(["New", "Retain", "RetainExpand"])}
                  onChange={(intent) =>
                    update({ intent: intent as ProposedSystem["intent"] })
                  }
                />
                <Field
                  label="Proposed work"
                  name="system.proposed_work"
                  value={system.proposed_work}
                  maxLength={1000}
                  multiline
                  onChange={(proposed_work) => update({ proposed_work })}
                />
              </div>
              <SelectField
                label="Area coverage"
                name="coverage.mode"
                value={system.coverage.mode}
                options={labels(["Defined", "NotAreaSpecific", "Unknown"])}
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
              {system.coverage.mode === "Defined" ? (
                checks(
                  value.areas.map((a) => ({ id: a.id, label: a.label })),
                  system.coverage.area_ids,
                  (area_ids) =>
                    update({ coverage: { ...system.coverage, area_ids } }),
                )
              ) : (
                <>
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
                        coverage: {
                          ...system.coverage,
                          source: source || null,
                        },
                      })
                    }
                    maxLength={500}
                  />
                  {system.coverage.follow_up && (
                    <FollowUpFields
                      label="Coverage"
                      value={system.coverage.follow_up}
                      owners={options.owners}
                      onChange={(follow_up) =>
                        update({ coverage: { ...system.coverage, follow_up } })
                      }
                    />
                  )}
                </>
              )}
              <h3>System evidence</h3>
              {checks(
                value.evidence.map((e) => ({ id: e.id, label: e.observation })),
                system.evidence_ids,
                (evidence_ids) => update({ evidence_ids }),
              )}
              <button
                type="button"
                onClick={() => onEvidence(system.evidence_ids[0])}
              >
                View evidence
              </button>
              <details open>
                <summary>Technical details</summary>
                <p>
                  Required capacity and observed equipment capability are
                  separate. No calculator or engineering certification is
                  implied.
                </p>
                {value.facts
                  .filter((f) => f.system_id === system.id)
                  .map((f) => (
                    <fieldset className="es02-fact" key={f.id}>
                      <legend>
                        {configurationFields.find((d) => d.id === f.field)
                          ?.label ?? f.field}
                      </legend>
                      <div className="e2-grid">
                        <SelectField
                          label="Fact role"
                          name={`${f.id}.role`}
                          value={f.role}
                          options={labels([
                            "Requirement",
                            "Observation",
                            "Capability",
                            "Assumption",
                          ])}
                          onChange={(role) =>
                            fact(f, { role: role as ConfigurationFact["role"] })
                          }
                        />
                        <SelectField
                          label="Fact state"
                          name={`${f.id}.state`}
                          value={f.state}
                          options={labels([
                            "Answered",
                            "Confirmed",
                            "Unknown",
                            "Assumed",
                          ])}
                          onChange={(state) =>
                            fact(
                              f,
                              {
                                state: state as ScopeState,
                                ...(state === "Unknown" ? { value: null } : {}),
                                follow_up:
                                  state === "Confirmed"
                                    ? null
                                    : (f.follow_up ?? own),
                              },
                              true,
                            )
                          }
                        />
                        <Field
                          label={`${configurationFields.find((d) => d.id === f.field)?.label} (${f.unit})`}
                          name={`${f.id}.value`}
                          value={f.value == null ? "" : String(f.value)}
                          onChange={(v) =>
                            fact(f, {
                              value:
                                f.unit === "Zones"
                                  ? v === ""
                                    ? null
                                    : Number(v)
                                  : v,
                              ...(f.state === "Unknown"
                                ? {
                                    state: "Answered",
                                    follow_up: f.follow_up ?? own,
                                  }
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
                      {checks(
                        value.evidence.map((e) => ({
                          id: e.id,
                          label: e.observation,
                        })),
                        f.evidence_ids,
                        (evidence_ids) => fact(f, { evidence_ids }),
                      )}
                      {f.follow_up && (
                        <FollowUpFields
                          label={`Fact ${f.field}`}
                          value={f.follow_up}
                          owners={options.owners}
                          onChange={(follow_up) => fact(f, { follow_up }, true)}
                        />
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          if (
                            window.confirm(
                              "Remove this working fact and its follow-ups?",
                            )
                          )
                            onChange({
                              ...value,
                              facts: value.facts.filter((x) => x.id !== f.id),
                              follow_ups: value.follow_ups.filter(
                                (x) => x.fact_id !== f.id,
                              ),
                            });
                        }}
                      >
                        Remove fact
                      </button>
                    </fieldset>
                  ))}
                <SelectField
                  label="Add technical fact"
                  name="add-fact"
                  value=""
                  options={configurationFields
                    .filter(
                      (d) =>
                        !value.facts.some(
                          (f) => f.system_id === system.id && f.field === d.id,
                        ),
                    )
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
              </details>
            </fieldset>
          </section>
        ) : (
          <p className="es02-editor">
            Select a visible system to edit its configuration. Working edits
            remain in the proposal when filters change.
          </p>
        )}
      </section>
    </>
  );
}
export function ResponsibilitiesEditor({
  value,
  onChange,
  options,
  readOnly = false,
}: Props) {
  const own = { owner_id: options.owner.id, reason: "" };
  return (
    <fieldset
      disabled={readOnly}
      className="es02-fields"
      aria-label="Scope responsibilities"
    >
      <h2>Responsibilities & requested timing</h2>
      <p>
        Participation records discovery scope only. Optional and excluded items
        do not alter manual estimate totals.
      </p>
      {value.responsibilities.map((r) => {
        const update = (patch: Partial<typeof r>) =>
          onChange({
            ...value,
            responsibilities: value.responsibilities.map((x) =>
              x.id === r.id ? { ...x, ...patch } : x,
            ),
          });
        return (
          <fieldset className="es02-fact" key={r.id}>
            <legend>{r.work || "New responsibility"}</legend>
            <div className="e2-grid">
              <Field
                label="Work item"
                name={`${r.id}.work`}
                value={r.work}
                multiline
                maxLength={1000}
                onChange={(work) => update({ work })}
              />
              <SelectField
                label="Participation"
                name={`${r.id}.participation`}
                value={r.participation}
                options={labels(["Included", "Excluded", "Optional"])}
                onChange={(participation) =>
                  update({
                    participation: participation as typeof r.participation,
                  })
                }
              />
              <SelectField
                label="Responsible party"
                name={`${r.id}.party`}
                value={r.party}
                options={labels(["PPO", "Customer", "Supplier", "Unknown"])}
                onChange={(party) => update({ party: party as typeof r.party })}
              />
              <Field
                label="Requested date"
                name={`${r.id}.date`}
                type="date"
                value={r.requested_on ?? ""}
                onChange={(requested_on) =>
                  update({ requested_on: requested_on || null })
                }
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
                options={labels([
                  "Answered",
                  "Confirmed",
                  "Unknown",
                  "Assumed",
                ])}
                onChange={(state) =>
                  update({
                    state: state as ScopeState,
                    follow_up:
                      state === "Confirmed" ? null : (r.follow_up ?? own),
                  })
                }
              />
            </div>
            <h3>Areas</h3>
            {checks(
              value.areas.map((a) => ({ id: a.id, label: a.label })),
              r.area_ids,
              (area_ids) => update({ area_ids }),
            )}
            <h3>Systems</h3>
            {checks(
              value.systems.map((s) => ({ id: s.id, label: s.name })),
              r.system_ids,
              (system_ids) => update({ system_ids }),
            )}
            {r.follow_up && (
              <FollowUpFields
                label="Responsibility"
                value={r.follow_up}
                owners={options.owners}
                onChange={(follow_up) => update({ follow_up })}
              />
            )}
            <button
              type="button"
              onClick={() =>
                onChange({
                  ...value,
                  responsibilities: value.responsibilities.filter(
                    (x) => x.id !== r.id,
                  ),
                })
              }
            >
              Remove responsibility
            </button>
          </fieldset>
        );
      })}
      <button
        type="button"
        onClick={() =>
          onChange({
            ...value,
            responsibilities: [
              ...value.responsibilities,
              {
                id: crypto.randomUUID(),
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
          })
        }
      >
        + Add responsibility
      </button>
      <h2>Discovery follow-ups</h2>
      {value.follow_ups.map((f) => {
        const update = (patch: Partial<typeof f>) =>
          onChange({
            ...value,
            follow_ups: value.follow_ups.map((x) =>
              x.id === f.id ? { ...x, ...patch } : x,
            ),
          });
        return (
          <fieldset className="es02-fact" key={f.id}>
            <FollowUpFields
              label="Discovery follow-up"
              value={f}
              owners={options.owners}
              onChange={(v) => update(v)}
            />
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
              onChange={(activity_id) =>
                update({ activity_id: activity_id || null })
              }
              hint="Only an actual permitted Activity is accepted. Its live due date is separate; no Activity is created or completed here."
            />
            <button
              type="button"
              onClick={() =>
                onChange({
                  ...value,
                  follow_ups: value.follow_ups.filter((x) => x.id !== f.id),
                })
              }
            >
              Remove follow-up
            </button>
          </fieldset>
        );
      })}
      <button
        type="button"
        onClick={() =>
          onChange({
            ...value,
            follow_ups: [
              ...value.follow_ups,
              {
                id: crypto.randomUUID(),
                lineage: null,
                ...own,
                due_on: null,
                fact_id: null,
                activity_id: null,
              },
            ],
          })
        }
      >
        + Add discovery follow-up
      </button>
      <p>
        Delivery routing: Not configured. Requested dates do not create
        commitments.
      </p>
    </fieldset>
  );
}
