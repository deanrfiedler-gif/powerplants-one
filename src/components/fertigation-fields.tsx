"use client";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { ErrorNotice } from "./business-ui";
import type { Scope } from "../estimating/fertigation/types";
import { parseCurve } from "../estimating/fertigation/engine";
import {
  baseRecord,
  blankArea,
  blankCandidate,
  blankControl,
  blankCropGroup,
  blankGroup,
  blankMaster,
  blankScenario,
  blankSource,
  blankValve,
} from "../estimating/fertigation/definition";

export type Register = {
  [K in keyof Scope]: Scope[K] extends { id: string; label: string }[]
    ? K
    : never;
}[keyof Scope];
export const registerNames: Record<Register, [string, string]> = {
  areas: ["Growing areas", "growing area"],
  crop_groups: ["Crop groups", "crop group"],
  valves: ["Irrigation valves", "irrigation valve"],
  masters: ["Mainline / master valves", "mainline / master valve"],
  sources: ["Water sources & storage", "water source"],
  groups: ["Operating groups", "operating group"],
  scenarios: ["Scenarios", "scenario"],
  pipes: ["Pipes", "pipe"],
  filters: ["Filtration & treatment", "filter or treatment"],
  water_samples: ["Water analysis", "water sample"],
  recipes: ["Recipes", "recipe"],
  stocks: ["Stock requirements", "stock requirement"],
  channels: ["Configured injection channels", "injection channel"],
  controllers: ["Controllers", "controller"],
  banks: ["Physical I/O banks", "I/O bank"],
  sensors: ["Sensors", "sensor"],
  strategies: ["Strategies", "strategy"],
  candidates: ["Configured candidates", "candidate"],
  evidence: ["Evidence references", "evidence reference"],
  actions: ["Responsibilities & open actions", "action"],
};
export function newRecord(register: Register) {
  const id = crypto.randomUUID(),
    b = baseRecord(id);
  switch (register) {
    case "areas":
      return blankArea(id);
    case "crop_groups":
      return blankCropGroup(id);
    case "valves":
      return blankValve(id);
    case "masters":
      return blankMaster(id);
    case "sources":
      return blankSource(id);
    case "groups":
      return blankGroup(id);
    case "scenarios":
      return blankScenario(id);
    case "candidates":
      return blankCandidate(id, "NutriOne");
    case "pipes":
      return {
        ...b,
        from: "",
        to: "",
        length_m: null,
        internal_diameter_mm: null,
        design_flow_m3h: null,
        loss_basis: "",
      };
    case "filters":
      return {
        ...b,
        process: "",
        path: "unknown",
        capacity_m3h: null,
        dirty_loss_m: null,
        backwash_m3h: null,
        discharge: "",
      };
    case "water_samples":
      return {
        ...b,
        source_id: null,
        sample_date: null,
        laboratory: "",
        ph: null,
        ec_mscm: null,
        alkalinity: "",
        analytical_units: "",
      };
    case "recipes":
      return {
        ...b,
        author: "",
        revision: "",
        ec_target_mscm: null,
        ph_target: null,
        ec_basis: "unknown",
        composition: "",
        changeover: "",
      };
    case "stocks":
      return {
        ...b,
        recipe_id: null,
        function: "nutrient",
        dose_l_m3: null,
        usable_l: null,
        concentration: "",
        conditions: "",
      };
    case "channels":
      return {
        ...b,
        candidate_id: null,
        stock_id: null,
        minimum_lph: null,
        maximum_lph: null,
        conditions: "",
      };
    case "controllers":
      return {
        ...b,
        family: "unknown",
        asset_id: null,
        model: "",
        serial: "",
        software: "",
        licences: "",
      };
    case "banks":
      return {
        ...b,
        controller_id: null,
        physical_bank: "",
        signal: "unknown",
        voltage: "",
        installed: null,
        used: null,
        reserved: null,
        faulty: null,
        manual_required: null,
      };
    case "sensors":
      return {
        ...b,
        measurement: "",
        crop_group_id: null,
        control: blankControl(),
        representative_basis: "",
      };
    case "strategies":
      return {
        ...b,
        trigger: "",
        sensor_id: null,
        group_ids: [],
        reset_basis: "",
        fallback: "",
        capability_evidence_id: null,
      };
    case "evidence":
      return {
        id,
        label: "",
        kind: "observation",
        reference: "",
        source_revision: "",
        sha256: null,
        captured_date: null,
        attribution: "",
        applicability: "",
        notes: "",
      };
    case "actions":
      return {
        ...b,
        owner: "",
        due_date: null,
        purpose: "question",
        status: "open",
      };
  }
}
type Fields = Record<string, unknown>;
const names: Record<string, string> = {
  label: "Label / reference",
  phase: "Phase",
  intent: "Proposed work",
  source_id: "Water source",
  master_id: "Mainline / master valve",
  asset_id: "Installed Asset ID (optional)",
  area_id: "Growing area",
  crop_group_id: "Crop group",
  flow_basis: "Hydraulic demand basis",
  measured_flow_m3h: "Measured valve flow (m³/h)",
  design_flow_m3h: "Design allowance (m³/h)",
  pressure_bar: "Required pressure (bar)",
  controller_id: "Controller",
  bank_id: "Physical I/O bank",
  channel: "Physical channel / address",
  additional_channels: "Additional physical channels",
  owner: "Control owner",
  evidence_ids: "Evidence references",
  flow_evidence_id: "Flow evidence",
  area_m2: "Represented area",
  entered_area_unit: "Area entry unit",
  represented_area_m2: "Represented crop area (m²)",
  served_area_m2: "Served area (m²)",
  flow_share_fraction: "Explicit share of valve flow (fraction)",
  tags: "Production contexts (multiple allowed)",
  source_note: "Source / observation / assumptions",
  crop_description: "Crop or plant description",
  growing_system: "Growing system",
  application_method: "Irrigation application method",
  hydraulic_arrangement: "Hydraulic / process arrangement",
  container_count: "Actual containers",
  containers_per_ha: "Containers per ha",
  plants_per_container: "Plants per container",
  plant_count: "Actual plants",
  daily_l_per_container: "Daily requirement (L/container)",
  drain_fraction: "Drain fraction of gross",
  drain_definition_confirmed: "Drain denominator definition confirmed",
  family: "Product family",
  maximum_m3h: "Entered maximum flow (m³/h)",
  minimum_m3h: "Entered minimum flow (m³/h)",
  minimum_pressure_bar: "Entered minimum pressure (bar)",
  maximum_pressure_bar: "Entered maximum pressure (bar)",
  proposed_pressure_bar: "Proposed pressure at declared boundary (bar)",
  pressure_boundary: "Pressure boundary",
  flow_lph: "Emitter / hub flow (L/h)",
  count: "Independent emitters per container basis",
  containers_per_emitter: "Containers served per emitter / hub",
  outlets_per_hub: "Outlets per hub (does not multiply flow)",
  verified_container_lph: "Verified flow (L/h/container)",
  start_minute: "Start minute of day",
  end_minute: "End minute of day",
  spacing_min: "Cycle spacing (minutes)",
  ec_mscm: "EC (mS/cm)",
  ec_target_mscm: "Recorded EC target (mS/cm)",
  ph_target: "Recorded pH target",
  dose_l_m3: "Confirmed dose (L/m³)",
  initial_storage_m3: "Initial storage (m³)",
  refill_m3h: "Continuous refill (m³/h)",
  reserve_m3: "Required reserve (m³)",
  physical_bank: "Physical bank identity",
  capability_evidence_id: "Capability evidence",
  curve_evidence_id: "Curve evidence",
  head_basis_flow_m3h: "Head-loss basis flow (m³/h)",
  speed_rpm: "Curve speed (rpm)",
  internal_diameter_mm: "Actual internal diameter (mm)",
  design_flow_m3h_: "Design flow (m³/h)",
  inrush_va: "Inrush (VA)",
  holding_va: "Holding load (VA)",
  nominal_storage_m3: "Nominal storage (m³)",
  usable_storage_m3: "Usable storage (m³)",
  reliable_flow_m3h: "Reliable flow (m³/h)",
  usable_l: "Usable stock (L)",
  minimum_lph: "Entered minimum injection (L/h)",
  maximum_lph: "Entered maximum injection (L/h)",
  area_basis: "Area measurement role",
  facility_id: "Canonical Facility ID (optional)",
  facility_version: "Captured Facility version",
  evidence_id: "Evidence reference",
  shortened: "Shortlisted",
};
export const human = (key: string) =>
  names[key] ?? key.replaceAll("_", " ").replace(/^./, (x) => x.toUpperCase());
const enums: Record<string, string[]> = {
  phase: ["unknown", "existing", "proposed", "future", "excluded"],
  intent: ["unknown", "retain", "replace", "new", "inspect"],
  flow_basis: ["unknown", "emitter_inventory", "measured", "design_allowance"],
  pressure_boundary: ["unknown", "unit_inlet", "unit_outlet"],
  area_basis: ["unknown", "footprint", "planted", "effective"],
  entered_area_unit: ["m2", "ha"],
  growing_system: ["unknown", "hydroponic_soilless", "soil", "other"],
  application_method: ["unknown", "drip", "overhead", "ebb_and_flow", "other"],
  hydraulic_arrangement: [
    "unknown",
    "single_pass",
    "collected_return",
    "recirculating",
    "mixed",
  ],
  tags: [
    "unknown",
    "commercial_berries",
    "commercial_nursery",
    "medicinal_cannabis",
    "other",
  ],
  demand_basis: ["unknown", "gross", "net"],
  method: ["unknown", "independent", "verified_per_container"],
  signal: [
    "unknown",
    "digital_output",
    "digital_input",
    "analogue_input",
    "analogue_output",
    "pulse",
    "bus",
  ],
  "control.owner": ["unknown", "ppo_controller", "manual", "external"],
  flush_to_crop: ["unknown", "yes", "no"],
  other_path: ["unknown", "none", "pump_only", "through_unit"],
  spacing_basis: ["unknown", "start_to_start", "end_to_start"],
  path: ["unknown", "pump", "unit", "crop"],
  ec_basis: ["unknown", "final", "increment"],
  function: ["nutrient", "acid", "alkali", "treatment", "spare"],
  kind: ["observation", "assumption", "document_reference"],
  purpose: ["question", "responsibility", "commissioning_criterion", "review"],
  status: ["open", "recorded"],
  required: ["unknown", "yes", "no"],
  mode: ["unknown", "wired", "wireless"],
};
const relations: Record<string, Register> = {
  area_id: "areas",
  crop_group_id: "crop_groups",
  source_id: "sources",
  master_id: "masters",
  recipe_id: "recipes",
  stock_id: "stocks",
  candidate_id: "candidates",
  controller_id: "controllers",
  bank_id: "banks",
  sensor_id: "sensors",
  evidence_id: "evidence",
  flow_evidence_id: "evidence",
  curve_evidence_id: "evidence",
  capability_evidence_id: "evidence",
  evidence_ids: "evidence",
  valve_ids: "valves",
  group_ids: "groups",
};
const nullableText = (key: string) =>
  key.endsWith("_id") || key.endsWith("_date") || key === "sha256";
function unpack(value: unknown): unknown {
  if (typeof value === "number") return String(value);
  if (Array.isArray(value)) return value.map(unpack);
  if (value && typeof value === "object")
    return Object.fromEntries(
      Object.entries(value).map(([k, v]) => [k, unpack(v)]),
    );
  return value;
}
function pack(raw: Fields, template: Fields): Fields {
  return Object.fromEntries(
    Object.entries(raw).map(([key, value]) => {
      const original = template[key];
      if (Array.isArray(value))
        return [
          key,
          value.map((item, i) =>
            typeof item === "object" && item
              ? pack(
                  item as Fields,
                  ((Array.isArray(original)
                    ? original[i]
                    : null) as Fields) ?? {
                    container_count: null,
                    served_area_m2: null,
                    flow_share_fraction: null,
                  },
                )
              : item,
          ),
        ];
      if (value && typeof value === "object")
        return [key, pack(value as Fields, original as Fields)];
      if (
        (original === null && !nullableText(key)) ||
        typeof original === "number"
      ) {
        if (value === null || value === "") return [key, null];
        if (
          !/^\d+(?:\.\d+)?$/.test(String(value)) ||
          !Number.isFinite(Number(value))
        )
          throw {
            message: `${human(key)} must be a finite non-negative number, or blank for unknown.`,
          };
        return [key, Number(value)];
      }
      return [key, nullableText(key) && value === "" ? null : value];
    }),
  );
}

export function FertigationDialog({
  title,
  close,
  children,
  decision = false,
  open = true,
  closeDisabled = false,
}: {
  title: string;
  close: () => void;
  children: ReactNode;
  decision?: boolean;
  open?: boolean;
  closeDisabled?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null,
      dialog = ref.current!;
    if (open) dialog.showModal();
    return () => {
      dialog.close();
      if (opener?.isConnected) opener.focus();
    };
  }, [open]);
  return (
    <dialog
      ref={ref}
      className={`fn-dialog${decision ? " fn-decision" : ""}`}
      aria-label={title}
      onCancel={(e) => {
        e.preventDefault();
        if (!closeDisabled) close();
      }}
    >
      <header>
        <h2>{title}</h2>
        <button
          type="button"
          onClick={close}
          disabled={closeDisabled}
          aria-label={`Close ${title}`}
        >
          Close
        </button>
      </header>
      {children}
    </dialog>
  );
}

export function ObjectFields({
  value,
  template,
  update,
  scope,
  prefix = "record",
  technical = true,
  disabled = false,
}: {
  value: Fields;
  template: Fields;
  update: (value: Fields) => void;
  scope: Scope;
  prefix?: string;
  technical?: boolean;
  disabled?: boolean;
}) {
  return (
    <div className="fn-fields">
      {Object.entries(value).map(([key, item]) => {
        if (key === "id" || key === "schema_version" || key === "curve_points")
          return null;
        if (
          !technical &&
          [
            "control",
            "emitter",
            "inrush_va",
            "holding_va",
            "feedback",
            "voltage",
          ].includes(key)
        )
          return null;
        const id = `${prefix}-${key}`,
          set = (next: unknown) => update({ ...value, [key]: next });
        if (Array.isArray(item)) {
          if (key === "allocations")
            return (
              <fieldset key={key} className="fn-wide">
                <legend>Served areas & crop allocations</legend>
                <p className="fn-note">
                  A physical valve may serve several areas. Unknown quantities
                  stay blank; no proportional split is inferred.
                </p>
                {item.map((a, i) => (
                  <fieldset key={(a as { id: string }).id}>
                    <legend>Allocation {i + 1}</legend>
                    <ObjectFields
                      value={a as Fields}
                      template={
                        (template.allocations as Fields[])?.[i] ?? {
                          container_count: null,
                          served_area_m2: null,
                          flow_share_fraction: null,
                        }
                      }
                      scope={scope}
                      prefix={`${id}-${i}`}
                      disabled={disabled}
                      update={(n) =>
                        set(item.map((old, index) => (index === i ? n : old)))
                      }
                    />
                    <button
                      type="button"
                      disabled={disabled}
                      onClick={() =>
                        set(item.filter((_, index) => index !== i))
                      }
                    >
                      Remove allocation {i + 1}
                    </button>
                  </fieldset>
                ))}
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() =>
                    set([
                      ...item,
                      {
                        id: crypto.randomUUID(),
                        area_id: null,
                        crop_group_id: null,
                        container_count: null,
                        served_area_m2: null,
                        flow_share_fraction: null,
                      },
                    ])
                  }
                >
                  Add service allocation
                </button>
              </fieldset>
            );
          const choices =
            key === "tags"
              ? enums.tags.map((x) => ({ id: x, label: human(x) }))
              : ((scope[relations[key]] ?? []) as {
                  id: string;
                  label: string;
                }[]);
          return (
            <fieldset key={key} className="fn-wide">
              <legend>{human(key)}</legend>
              {choices.length ? (
                choices.map((choice) => (
                  <label className="fn-check" key={choice.id}>
                    <input
                      type="checkbox"
                      disabled={disabled}
                      checked={item.includes(choice.id)}
                      onChange={(e) =>
                        set(
                          e.target.checked
                            ? [...item, choice.id]
                            : item.filter((x) => x !== choice.id),
                        )
                      }
                    />
                    {choice.label}
                  </label>
                ))
              ) : (
                <p>No matching records yet. Add them in their register.</p>
              )}
              {key === "group_ids" && "cycles" in value && item.length > 0 && (
                <div className="fn-note">
                  <strong>Sequential execution order</strong>
                  {item.map((selected, index) => (
                    <div className="fn-actions" key={String(selected)}>
                      <span>
                        {index + 1}.{" "}
                        {choices.find((c) => c.id === selected)?.label}
                      </span>
                      <button
                        type="button"
                        disabled={disabled || index === 0}
                        onClick={() => {
                          const reordered = [...item];
                          [reordered[index - 1], reordered[index]] = [
                            reordered[index],
                            reordered[index - 1],
                          ];
                          set(reordered);
                        }}
                      >
                        Move up
                      </button>
                      <button
                        type="button"
                        disabled={disabled || index === item.length - 1}
                        onClick={() => {
                          const reordered = [...item];
                          [reordered[index + 1], reordered[index]] = [
                            reordered[index],
                            reordered[index + 1],
                          ];
                          set(reordered);
                        }}
                      >
                        Move down
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </fieldset>
          );
        }
        if (item && typeof item === "object")
          return (
            <fieldset key={key} className="fn-wide">
              <legend>{human(key)}</legend>
              <ObjectFields
                value={item as Fields}
                template={template[key] as Fields}
                scope={scope}
                prefix={id}
                technical={technical}
                disabled={disabled}
                update={set}
              />
            </fieldset>
          );
        if (typeof item === "boolean")
          return (
            <label className="fn-check" key={key} htmlFor={id}>
              <input
                id={id}
                type="checkbox"
                disabled={disabled}
                checked={item}
                onChange={(e) => set(e.target.checked)}
              />
              {human(key)}
            </label>
          );
        const choices = relations[key]
          ? [
              { id: "", label: "Unknown / unassigned" },
              ...(scope[relations[key]] as { id: string; label: string }[]),
            ]
          : (key === "family"
              ? "shortlisted" in value
                ? [
                    "NutriOne",
                    "NutriFit",
                    "NutriJet Inline",
                    "NutriJet Bypass",
                    "NutriFlex",
                  ]
                : ["unknown", "Compass", "Compact CC", "Connext", "other"]
              : key === "owner" && "signal" in value
                ? enums["control.owner"]
                : enums[key]
            )?.map((x) => ({ id: x, label: x === "m2" ? "m²" : human(x) }));
        const isNumber =
          (template[key] === null && !nullableText(key)) ||
          typeof template[key] === "number";
        const areaHa = key === "area_m2" && value.entered_area_unit === "ha";
        const shown =
          areaHa &&
          item !== null &&
          item !== "" &&
          /^\d+(?:\.\d+)?$/.test(String(item))
            ? String(Number(item) / 10000)
            : String(item ?? "");
        return (
          <label
            key={key}
            htmlFor={id}
            className={
              [
                "notes",
                "source_note",
                "composition",
                "conditions",
                "applicability",
                "reference",
                "basis",
              ].includes(key)
                ? "fn-wide"
                : undefined
            }
          >
            {human(key)}
            {key === "area_m2" ? ` (${areaHa ? "ha" : "m²"})` : ""}
            {choices ? (
              <select
                id={id}
                disabled={disabled}
                value={String(item ?? "")}
                onChange={(e) => set(e.target.value || null)}
              >
                {choices.map((x) => (
                  <option key={x.id} value={x.id}>
                    {x.label}
                  </option>
                ))}
              </select>
            ) : (
              <input
                id={id}
                data-validation-field={key}
                disabled={disabled}
                value={shown}
                inputMode={isNumber ? "decimal" : undefined}
                type={key.endsWith("_date") ? "date" : "text"}
                maxLength={isNumber ? 24 : 1000}
                placeholder={isNumber ? "Unknown" : undefined}
                onChange={(e) =>
                  set(
                    areaHa &&
                      e.target.value !== "" &&
                      /^\d+(?:\.\d+)?$/.test(e.target.value)
                      ? String(Number(e.target.value) * 10000)
                      : e.target.value,
                  )
                }
              />
            )}
          </label>
        );
      })}
    </div>
  );
}

export function FertigationEditor({
  title,
  record,
  scope,
  onApply,
  close,
  readOnly = false,
  open = true,
}: {
  title: string;
  record: object;
  scope: Scope;
  onApply: (record: object) => void;
  close: () => void;
  readOnly?: boolean;
  open?: boolean;
}) {
  const [value, setValue] = useState(() => unpack(record) as Fields),
    [technical, setTechnical] = useState(false),
    [curve, setCurve] = useState(() =>
      "curve_points" in record
        ? (record as Scope["hydraulics"]).curve_points
            .map((p) =>
              [
                p.flow_m3h,
                p.head_m,
                p.efficiency_percent ?? "",
                p.power_kw ?? "",
              ].join(","),
            )
            .join("\n")
        : null,
    ),
    [error, setError] = useState<unknown>(null);
  return (
    <FertigationDialog title={title} close={close} open={open}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          try {
            const next = pack(value, record as Fields);
            if (curve !== null) next.curve_points = parseCurve(curve);
            onApply(next);
          } catch (err) {
            setError(err);
          }
        }}
      >
        <div className="fn-dialog-body">
          <p className="fn-note">
            {readOnly
              ? "Exact saved revision. This record is read-only."
              : "Apply changes to the working draft, then use Save revision to store them on the server. Blank numeric values mean unknown."}
          </p>
          <label className="fn-check">
            <input
              type="checkbox"
              checked={technical}
              onChange={(e) => setTechnical(e.target.checked)}
            />
            Show technical fields
          </label>
          <ErrorNotice error={error} />
          <ObjectFields
            value={value}
            template={record as Fields}
            scope={scope}
            update={setValue}
            technical={technical}
            disabled={readOnly}
          />
          {curve !== null && (
            <fieldset>
              <legend>Exact pump curve points</legend>
              <p className="fn-note">
                One row per point: flow (m³/h), head (m), optional efficiency
                (%), optional power (kW). Keep empty columns: 10,20,,3 records 3
                kW with efficiency unknown. No extrapolation.
              </p>
              <label htmlFor="fertigation-curve">
                Curve points (CSV)
                <textarea
                  id="fertigation-curve"
                  rows={8}
                  disabled={readOnly}
                  value={curve}
                  onChange={(e) => setCurve(e.target.value)}
                />
              </label>
            </fieldset>
          )}
        </div>
        <footer>
          {!readOnly && (
            <button className="fn-primary" type="submit">
              Apply to draft
            </button>
          )}
          <button type="button" onClick={close}>
            {readOnly ? "Close" : "Keep entries and close"}
          </button>
        </footer>
      </form>
    </FertigationDialog>
  );
}
