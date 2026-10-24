// SYN fertigation and SYN control: two fictional rule sets that work together on one job (ADR-0066 Q11).
// The fertigation rules choose a unit from a two-key range table and pass water systems and dosing
// channels to the control rules, which size relay modules from built-in outputs. Values are invented.
import type { RuleSetDefinition, RuleSetInput, RuleSetPart, RuleSetRule } from "../../../src/cpq/rule-sets";

const input = (key: string, label: string, type: RuleSetInput["type"], extra: Partial<RuleSetInput> = {}): RuleSetInput => ({
  key,
  label,
  question: `${label}?`,
  unit: "",
  type,
  choices: [],
  minimum: type === "Number" || type === "WholeNumber" ? "0" : null,
  maximum: null,
  default: null,
  required: true,
  asked_when: null,
  ...extra,
});
const part = (key: string, description: string, unit = "each", group = "equipment", install_minutes = "0"): RuleSetPart => ({
  key,
  description,
  unit,
  group,
  ordering: unit === "h" ? { kind: "AsCalculated" } : { kind: "Whole" },
  install_minutes,
});
const rule = (key: string, quantity: string, extra: Partial<RuleSetRule>): RuleSetRule => ({
  key,
  description: key.replace(/_/g, " "),
  phase: "Materials",
  when: "true",
  part: null,
  choose: null,
  quantity,
  unit: null,
  ...extra,
});

export const synFertigation = (): RuleSetDefinition => ({
  schema_version: 5,
  kind: "RuleSet",
  key: "syn_fertigation",
  label: "SYN fertigation",
  family: "SYN fertigation",
  inputs: [
    input("family", "System family", "Choice", { choices: ["SynJet", "SynOne"] }),
    input("mainline_flow", "Mainline flow", "Number", { unit: "m³/h" }),
    input("units", "Units", "WholeNumber", { minimum: "1" }),
    input("channels", "Fertiliser channels per unit", "WholeNumber", { minimum: "1", default: "4", required: false }),
  ],
  derived: [
    { key: "unit_part", label: "Unit", unit: "", formula: 'lookup("unit_by_flow", "part", family, mainline_flow)' },
    { key: "total_channels", label: "Dosing channels", unit: "each", formula: "units * (channels + 1)" },
  ],
  tables: [
    {
      key: "unit_by_flow",
      label: "Unit by family and mainline flow",
      source: "SYN fixture values",
      columns: [{ key: "family", type: "Text" }, { key: "max_flow", type: "Number" }, { key: "part", type: "Text" }],
      keys: [{ column: "family", match: "Exact" }, { column: "max_flow", match: "AtLeast" }],
      rows: [
        { family: "SynJet", max_flow: "30", part: "SYN-FERT-JET300" },
        { family: "SynJet", max_flow: "60", part: "SYN-FERT-JET600" },
        { family: "SynJet", max_flow: "1000", part: "SYN-FERT-JETBYP" },
        { family: "SynOne", max_flow: "30", part: "SYN-FERT-ONE300" },
        { family: "SynOne", max_flow: "90", part: "SYN-FERT-ONE600" },
      ],
    },
  ],
  parts: [
    part("SYN-FERT-JET300", "SYN SynJet 300"),
    part("SYN-FERT-JET600", "SYN SynJet 600"),
    part("SYN-FERT-JETBYP", "SYN SynJet bypass"),
    part("SYN-FERT-ONE300", "SYN SynOne 300"),
    part("SYN-FERT-ONE600", "SYN SynOne 600"),
    part("SYN-FERT-TANKKIT", "SYN tank connection kit"),
    part("SYN-COMMISSION", "SYN commissioning", "h", "labour"),
    part("SYN-PCLAB", "SYN project coordination", "h", "labour"),
  ],
  rules: [
    rule("unit", "units", { choose: "unit_part" }),
    rule("tank_kits", "units * channels", { part: "SYN-FERT-TANKKIT" }),
    rule("commissioning", "20 + 10 * (units - 1)", { part: "SYN-COMMISSION", phase: "Labour" }),
    rule("coordination", "6", { part: "SYN-PCLAB", phase: "Labour" }),
  ],
  passes: [
    { key: "water_systems", value: "units" },
    { key: "dosing_channels", value: "total_channels" },
  ],
  reference_cases: [
    {
      key: "synjet_50",
      label: "Two SynJets at 50 m³/h",
      source: "Hand calculation: 50 is above 30 and at or below 60, so the 600; channels 2 × (4 + 1) = 10",
      inputs: { family: "SynJet", mainline_flow: "50", units: "2" },
      expected: {
        lines: [
          { part: "SYN-FERT-JET600", quantity: "2" },
          { part: "SYN-FERT-TANKKIT", quantity: "8" },
          { part: "SYN-COMMISSION", quantity: "30" },
          { part: "SYN-PCLAB", quantity: "6" },
        ],
        values: { unit_part: "SYN-FERT-JET600", total_channels: "10" },
      },
    },
    {
      key: "synone_25",
      label: "One SynOne at 25 m³/h",
      source: "Hand calculation: 25 is at or below 30 in the SynOne rows",
      inputs: { family: "SynOne", mainline_flow: "25", units: "1" },
      expected: {
        lines: [
          { part: "SYN-FERT-ONE300", quantity: "1" },
          { part: "SYN-FERT-TANKKIT", quantity: "4" },
          { part: "SYN-COMMISSION", quantity: "20" },
          { part: "SYN-PCLAB", quantity: "6" },
        ],
        values: {},
      },
    },
  ],
});

export const synControl = (): RuleSetDefinition => ({
  schema_version: 5,
  kind: "RuleSet",
  key: "syn_control",
  label: "SYN control",
  family: "SYN control",
  inputs: [
    input("controller", "Controller", "Choice", { choices: ["Compass 2", "Compass 4", "Compact"] }),
    input("relay_outputs_needed", "Relay outputs needed", "WholeNumber"),
    input("water_systems", "Water systems", "WholeNumber", { default: "0", required: false }),
    input("dosing_channels", "Dosing channels", "WholeNumber", { default: "0", required: false }),
  ],
  derived: [
    { key: "builtin", label: "Built-in relay outputs", unit: "each", formula: 'lookup("builtin_io", "relay_outputs", controller)' },
    { key: "relay_modules", label: "Relay modules", unit: "each", formula: "max(0, ceil((relay_outputs_needed - builtin) / 6))" },
  ],
  tables: [
    {
      key: "builtin_io",
      label: "Built-in I/O",
      source: "SYN fixture values",
      columns: [{ key: "controller", type: "Text" }, { key: "relay_outputs", type: "Number" }, { key: "part", type: "Text" }],
      keys: [{ column: "controller", match: "Exact" }],
      rows: [
        { controller: "Compass 2", relay_outputs: "8", part: "SYN-CTRL-C2" },
        { controller: "Compass 4", relay_outputs: "16", part: "SYN-CTRL-C4" },
        { controller: "Compact", relay_outputs: "32", part: "SYN-CTRL-CC" },
      ],
    },
  ],
  parts: [
    part("SYN-CTRL-C2", "SYN controller size 2"),
    part("SYN-CTRL-C4", "SYN controller size 4"),
    part("SYN-CTRL-CC", "SYN compact controller"),
    part("SYN-CTRL-DOR6", "SYN six-relay module"),
    part("SYN-LIC-WATER", "SYN water system licence"),
    part("SYN-LIC-DOSING", "SYN dosing channel licence"),
    part("SYN-COMMISSION", "SYN commissioning", "h", "labour"),
    part("SYN-PCLAB", "SYN project coordination", "h", "labour"),
  ],
  rules: [
    rule("controller", "1", { choose: 'lookup("builtin_io", "part", controller)' }),
    rule("relay_modules", "relay_modules", { part: "SYN-CTRL-DOR6", when: "relay_modules > 0" }),
    rule("water_licences", "water_systems", { part: "SYN-LIC-WATER", when: "water_systems > 0" }),
    rule("dosing_licences", "dosing_channels", { part: "SYN-LIC-DOSING", when: "dosing_channels > 0" }),
    rule("commissioning", "25", { part: "SYN-COMMISSION", phase: "Labour" }),
    rule("coordination", "6", { part: "SYN-PCLAB", phase: "Labour" }),
  ],
  passes: [],
  reference_cases: [
    {
      key: "compass4_38",
      label: "Size 4 controller needing 38 relay outputs, fed by two fertigation units",
      source: "Hand calculation: (38 − 16) ÷ 6 = 3.67, rounded up to 4 modules",
      inputs: { controller: "Compass 4", relay_outputs_needed: "38", water_systems: "2", dosing_channels: "10" },
      expected: {
        lines: [
          { part: "SYN-CTRL-C4", quantity: "1" },
          { part: "SYN-CTRL-DOR6", quantity: "4" },
          { part: "SYN-LIC-WATER", quantity: "2" },
          { part: "SYN-LIC-DOSING", quantity: "10" },
          { part: "SYN-COMMISSION", quantity: "25" },
          { part: "SYN-PCLAB", quantity: "6" },
        ],
        values: { relay_modules: "4" },
      },
    },
    {
      key: "compass2_6",
      label: "Size 2 controller needing 6 relay outputs",
      source: "Hand calculation: 6 is within the 8 built in, so no modules",
      inputs: { controller: "Compass 2", relay_outputs_needed: "6" },
      expected: {
        lines: [
          { part: "SYN-CTRL-C2", quantity: "1" },
          { part: "SYN-COMMISSION", quantity: "25" },
          { part: "SYN-PCLAB", quantity: "6" },
        ],
        values: { relay_modules: "0" },
      },
    },
    {
      key: "compact_40",
      label: "Compact controller needing 40 relay outputs",
      source: "Hand calculation: (40 − 32) ÷ 6 = 1.33, rounded up to 2 modules",
      inputs: { controller: "Compact", relay_outputs_needed: "40" },
      expected: {
        lines: [
          { part: "SYN-CTRL-CC", quantity: "1" },
          { part: "SYN-CTRL-DOR6", quantity: "2" },
          { part: "SYN-COMMISSION", quantity: "25" },
          { part: "SYN-PCLAB", quantity: "6" },
        ],
        values: { relay_modules: "2" },
      },
    },
  ],
});
