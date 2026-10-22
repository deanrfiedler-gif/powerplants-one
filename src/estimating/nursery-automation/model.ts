// N1 capture only. Numeric values are observations, never equipment ratings or calculations.
export const knowledge = [
  "Unknown",
  "Assumed",
  "CustomerAdvised",
  "SupplierDocumented",
  "TrialMeasured",
  "Conflict",
  "NotApplicable",
] as const;
export type Fact = {
  value: string | null;
  knowledge: (typeof knowledge)[number];
  source: string | null;
  alternatives: { value: string; source: string }[];
  owner: string | null;
  next_action: string | null;
};
export const fields = [
  {
    key: "crop",
    label: "Crop and plant handling",
    unit: "text",
    source: "F-01–F-07",
  },
  {
    key: "container",
    label: "Container shape, material and nesting",
    unit: "text",
    source: "F-01–F-07",
  },
  {
    key: "diameter_mm",
    label: "Container diameter",
    unit: "mm",
    source: "F-01–F-07",
  },
  {
    key: "height_mm",
    label: "Container height",
    unit: "mm",
    source: "F-01–F-07",
  },
  {
    key: "filled_mass_kg",
    label: "Filled container mass",
    unit: "kg",
    source: "F-01–F-07",
  },
  {
    key: "media",
    label: "Media and supply format",
    unit: "text",
    source: "G-01–G-07",
  },
  {
    key: "quality",
    label: "Fill quality and acceptance requirements",
    unit: "text",
    source: "H-01–H-06",
  },
  {
    key: "target_good_pots",
    label: "Required good pots per shift",
    unit: "pots",
    source: "E-01–E-06",
  },
  {
    key: "shift_minutes",
    label: "Available shift time",
    unit: "minutes",
    source: "E-01–E-06",
  },
  {
    key: "stops_minutes",
    label: "Planned stops per shift",
    unit: "minutes",
    source: "E-01–E-06",
  },
  {
    key: "changeovers",
    label: "Changeovers per shift",
    unit: "count",
    source: "E-01–E-06",
  },
  {
    key: "changeover_minutes",
    label: "Time per changeover",
    unit: "minutes",
    source: "E-01–E-06",
  },
  {
    key: "staffing",
    label: "Available operators",
    unit: "count",
    source: "E-01–E-06",
  },
] as const;
export type FactKey = (typeof fields)[number]["key"];
export type Scenario = {
  id: string;
  name: string;
  phase: "Current" | "Future";
  facts: Record<FactKey, Fact>;
};
export const deliveryKinds = [
  "Installation",
  "Commissioning",
  "Training",
  "EnablingWorks",
] as const;
export const applicability = [
  "Unknown",
  "Applicable",
  "NotApplicable",
] as const;
export const selections = [
  "Unknown",
  "Base",
  "Selected",
  "Offered",
  "Excluded",
  "Parked",
] as const;
export const responsibilities = [
  "Unknown",
  "PPO",
  "Supplier",
  "Customer",
  "Other",
] as const;
export type Delivery = {
  kind: (typeof deliveryKinds)[number];
  applicability: (typeof applicability)[number];
  selection: (typeof selections)[number];
  responsibility: (typeof responsibilities)[number];
  basis: string | null;
  owner: string | null;
  next_action: string | null;
};
export type Study = {
  schema_version: 1;
  name: string;
  project_type: "Replacement" | "ConnectedLine" | "StagedRetrofit" | "Unknown";
  system_id: string | null;
  current_process: string | null;
  site_requirements: Fact;
  candidate_ids: string[];
  scenarios: Scenario[];
  delivery: Delivery[];
};
export const blankFact = (): Fact => ({
  value: null,
  knowledge: "Unknown",
  source: null,
  alternatives: [],
  owner: null,
  next_action: null,
});
export const blankScenario = (id: string): Scenario => ({
  id,
  name: "Production scenario",
  phase: "Current",
  facts: Object.fromEntries(
    fields.map((f) => [f.key, blankFact()]),
  ) as Scenario["facts"],
});
export const blankStudy = (): Study => ({
  schema_version: 1,
  name: "Nursery automation study",
  project_type: "Unknown",
  system_id: null,
  current_process: null,
  site_requirements: blankFact(),
  candidate_ids: [],
  scenarios: [],
  delivery: deliveryKinds.map((kind) => ({
    kind,
    applicability: "Unknown",
    selection: "Unknown",
    responsibility: "Unknown",
    basis: null,
    owner: null,
    next_action: null,
  })),
});
export type Finding = {
  key: string;
  subject: string;
  message: string;
  owner: string | null;
  action: string;
};
export function findings(study: Study): Finding[] {
  const out: Finding[] = [];
  const fact = (key: string, subject: string, f: Fact) => {
    if (["Unknown", "Conflict", "Assumed"].includes(f.knowledge))
      out.push({
        key,
        subject,
        message:
          f.knowledge === "Conflict"
            ? "Conflicting evidence needs an explicit resolution."
            : f.knowledge === "Assumed"
              ? "Assumption requires confirmation."
              : "Information is unknown.",
        owner: f.owner,
        action: f.next_action ?? "Assign an owner and next action.",
      });
  };
  if (!study.scenarios.length)
    out.push({
      key: "scenarios",
      subject: "Production scenarios",
      message: "No scenario recorded.",
      owner: null,
      action: "Add the required current and future scenarios.",
    });
  if (!study.candidate_ids.length)
    out.push({
      key: "candidates",
      subject: "Equipment candidates",
      message: "No candidate selected.",
      owner: null,
      action: "Record a candidate for supplier review.",
    });
  if (!study.system_id)
    out.push({
      key: "system",
      subject: "Discovery system",
      message: "No exact system is bound.",
      owner: null,
      action: "Select a saved Discovery system before later handover.",
    });
  fact("site", "Site, utilities and access", study.site_requirements);
  for (const s of study.scenarios)
    for (const f of fields)
      fact(`${s.id}:${f.key}`, `${s.name}: ${f.label}`, s.facts[f.key]);
  for (const d of study.delivery)
    if (
      d.applicability === "Unknown" ||
      d.selection === "Unknown" ||
      d.responsibility === "Unknown" ||
      !d.basis
    )
      out.push({
        key: `delivery:${d.kind}`,
        subject: d.kind,
        message: "Delivery scope or coverage remains unresolved.",
        owner: d.owner,
        action:
          d.next_action ??
          "Record responsibility, selection and coverage evidence.",
      });
  return out;
}
