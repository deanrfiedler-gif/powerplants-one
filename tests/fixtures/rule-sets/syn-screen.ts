// SYN retractable screens: a fictional software fixture, not an operating rule set.
// It uses the structures the offline proof found in a private screen workbook (derived lengths,
// drives from a target spacing, a bay-size table, per-drive factors by drive type, stock lengths,
// a chosen part and labour from installation minutes) with invented SYN parts and values.
// Expected quantities are worked by hand below, never produced by the engine (ADR-0066 Q3).
import type { RuleSetDefinition, RuleSetInput, RuleSetPart, RuleSetRule } from "../../../src/cpq/rule-sets";

const number = (key: string, label: string, unit: string, extra: Partial<RuleSetInput> = {}): RuleSetInput => ({
  key,
  label,
  question: `${label}?`,
  unit,
  type: "Number",
  choices: [],
  minimum: "0",
  maximum: null,
  default: null,
  required: true,
  asked_when: null,
  ...extra,
});

const part = (key: string, description: string, unit: string, group: string, ordering: RuleSetPart["ordering"], install_minutes: string): RuleSetPart => ({
  key,
  description,
  unit,
  group,
  ordering,
  install_minutes,
});

const rule = (key: string, quantity: string, extra: Partial<RuleSetRule> = {}): RuleSetRule => ({
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

export const synScreen = (): RuleSetDefinition => ({
  schema_version: 5,
  kind: "RuleSet",
  key: "syn_screen",
  label: "SYN retractable screens",
  family: "SYN screens",
  inputs: [
    number("spans", "Spans", "each", { type: "WholeNumber", minimum: "1", maximum: "20" }),
    number("span_width", "Span width", "m", { minimum: "1", maximum: "20" }),
    number("bays", "Bays down the length", "each", { type: "WholeNumber", minimum: "1", maximum: "200" }),
    number("bay_size", "Bay size", "m"),
    number("drive_type", "Drive type", "", { type: "Choice", choices: ["Cable", "Pinion"], minimum: null }),
    number("edge_fixing", "Edge fixing", "", { type: "Choice", choices: ["Hooks", "Quad Clip"], minimum: null }),
    number("odd_bay", "One bay extra long", "", { type: "YesNo", minimum: null, default: "No", required: false }),
    number("odd_bay_size", "Odd bay size", "m", { default: "0", required: false, asked_when: "odd_bay" }),
    number("target_drive_spacing", "Target drive spacing", "m", { minimum: "1", default: "3.5", required: false }),
  ],
  derived: [
    { key: "total_length", label: "Total length", unit: "m", formula: "bays * bay_size + if(odd_bay, odd_bay_size - bay_size, 0)" },
    { key: "total_width", label: "Total width", unit: "m", formula: "spans * span_width" },
    { key: "screen_width", label: "Screen width", unit: "m", formula: 'lookup("bay_sizes", "screen_width", bay_size)' },
    { key: "drives", label: "Drives", unit: "each", formula: "max(1, ceil(total_length / target_drive_spacing))" },
    { key: "ls_wires", label: "Light-seal wires", unit: "each", formula: "ceil(total_length / 0.4) + 1" },
    { key: "le_tube_m", label: "Leading-edge tube", unit: "m", formula: "round((span_width - 0.3) * drives * 1.05, 1)" },
  ],
  tables: [
    {
      key: "bay_sizes",
      label: "Bay sizes",
      source: "SYN fixture values",
      columns: [{ key: "bay_size", type: "Number" }, { key: "screen_width", type: "Number" }],
      keys: [{ column: "bay_size", match: "Exact" }],
      rows: [
        { bay_size: "3", screen_width: "3.25" },
        { bay_size: "4", screen_width: "4.3" },
        { bay_size: "4.5", screen_width: "4.7" },
      ],
    },
    {
      key: "drive_parts",
      label: "Drive head by drive type",
      source: "SYN fixture values",
      columns: [{ key: "drive_type", type: "Text" }, { key: "part", type: "Text" }],
      keys: [{ column: "drive_type", match: "Exact" }],
      rows: [
        { drive_type: "Cable", part: "SYN-SCR-DRUM" },
        { drive_type: "Pinion", part: "SYN-SCR-PINION" },
      ],
    },
    {
      key: "drive_factors",
      label: "Fixings per drive",
      source: "SYN fixture values",
      columns: [{ key: "component", type: "Text" }, { key: "drive_type", type: "Text" }, { key: "per_drive", type: "Number" }],
      keys: [{ column: "component", match: "Exact" }, { column: "drive_type", match: "Exact" }],
      rows: [
        { component: "tek_screw", drive_type: "Cable", per_drive: "74" },
        { component: "tek_screw", drive_type: "Pinion", per_drive: "108" },
      ],
    },
  ],
  parts: [
    part("SYN-SCR-CLOTH", "SYN screen cloth", "m²", "cloth", { kind: "AsCalculated" }, "0"),
    part("SYN-SCR-DRUM", "SYN drive drum", "each", "drive", { kind: "Whole" }, "20"),
    part("SYN-SCR-PINION", "SYN pinion drive", "each", "drive", { kind: "Whole" }, "30"),
    part("SYN-SCR-TEK", "SYN tek screw", "each", "fixings", { kind: "Pack", size: "100" }, "0"),
    part("SYN-SCR-LSWIRE", "SYN light-seal wire", "m", "wire", { kind: "StockLength", length: "1800" }, "0"),
    part("SYN-SCR-LETUBE", "SYN leading-edge tube", "m", "edge", { kind: "StockLength", length: "6.1" }, "2"),
    part("SYN-SCR-HOOK", "SYN edge hook", "each", "edge", { kind: "Whole" }, "0.5"),
    part("SYN-SCR-QCLIP", "SYN quad clip", "each", "edge", { kind: "Whole" }, "0.5"),
    part("SYN-INSTALL", "SYN installer hours", "h", "labour", { kind: "AsCalculated" }, "0"),
  ],
  rules: [
    rule("cloth", "round(bays * spans * screen_width * (span_width + 0.6), 2)", { part: "SYN-SCR-CLOTH", unit: "m²" }),
    rule("drive_head", "drives", { choose: 'lookup("drive_parts", "part", drive_type)' }),
    rule("tek_screws", 'drives * lookup("drive_factors", "per_drive", "tek_screw", drive_type)', { part: "SYN-SCR-TEK" }),
    rule("ls_wire", "ceil(ls_wires * total_width * 1.15)", { part: "SYN-SCR-LSWIRE", unit: "m" }),
    rule("le_tube", "le_tube_m", { part: "SYN-SCR-LETUBE" }),
    rule("hooks", "ceil(total_length / 0.5)", { part: "SYN-SCR-HOOK", when: 'edge_fixing = "Hooks"' }),
    rule("quad_clips", "ceil(total_length / 0.5)", { part: "SYN-SCR-QCLIP", when: 'edge_fixing = "Quad Clip"' }),
    rule("install", "round(minutes() / 60, 2) + 2", { part: "SYN-INSTALL", phase: "Labour" }),
  ],
  passes: [],
  reference_cases: [
    {
      key: "baseline",
      label: "One span, eight 3 m bays, cable drive, hooks",
      source: "Hand calculation in tests/fixtures/rule-sets/syn-screen.ts",
      inputs: { spans: "1", span_width: "6.4", bays: "8", bay_size: "3", drive_type: "Cable", edge_fixing: "Hooks" },
      // total length 8 × 3 = 24; drives ceil(24 / 3.5 = 6.86) = 7; wires ceil(24 / 0.4) + 1 = 61
      // tube round(6.1 × 7 × 1.05 = 44.835, 1) = 44.8; cloth 8 × 1 × 3.25 × 7.0 = 182
      // tek 7 × 74 = 518; wire ceil(61 × 6.4 × 1.15 = 448.96) = 449; hooks ceil(24 / 0.5) = 48
      // minutes 7 × 20 + 44.8 × 2 + 48 × 0.5 = 253.6; install round(253.6 / 60 = 4.2267, 2) + 2 = 6.23
      expected: {
        lines: [
          { part: "SYN-SCR-CLOTH", quantity: "182" },
          { part: "SYN-SCR-DRUM", quantity: "7" },
          { part: "SYN-SCR-TEK", quantity: "518" },
          { part: "SYN-SCR-LSWIRE", quantity: "449" },
          { part: "SYN-SCR-LETUBE", quantity: "44.8" },
          { part: "SYN-SCR-HOOK", quantity: "48" },
          { part: "SYN-INSTALL", quantity: "6.23" },
        ],
        values: { total_length: "24", drives: "7", ls_wires: "61", le_tube_m: "44.8" },
      },
    },
    {
      key: "pinion_two_spans_odd_bay",
      label: "Two spans, twelve 4.5 m bays with a 5 m odd bay, pinion drive, quad clips",
      source: "Hand calculation in tests/fixtures/rule-sets/syn-screen.ts",
      inputs: {
        spans: "2", span_width: "9.6", bays: "12", bay_size: "4.5", drive_type: "Pinion",
        edge_fixing: "Quad Clip", odd_bay: "Yes", odd_bay_size: "5",
      },
      // total length 12 × 4.5 + (5 − 4.5) = 54.5; width 2 × 9.6 = 19.2; drives ceil(54.5 / 3.5 = 15.57) = 16
      // wires ceil(136.25) + 1 = 138; tube round(9.3 × 16 × 1.05 = 156.24, 1) = 156.2
      // cloth 12 × 2 × 4.7 × 10.2 = 1150.56; tek 16 × 108 = 1728; wire ceil(138 × 19.2 × 1.15 = 3047.04) = 3048
      // clips ceil(54.5 / 0.5) = 109; minutes 16 × 30 + 156.2 × 2 + 109 × 0.5 = 846.9
      // install round(846.9 / 60 = 14.115, 2) = 14.12 (half away from zero) + 2 = 16.12
      expected: {
        lines: [
          { part: "SYN-SCR-CLOTH", quantity: "1150.56" },
          { part: "SYN-SCR-PINION", quantity: "16" },
          { part: "SYN-SCR-TEK", quantity: "1728" },
          { part: "SYN-SCR-LSWIRE", quantity: "3048" },
          { part: "SYN-SCR-LETUBE", quantity: "156.2" },
          { part: "SYN-SCR-QCLIP", quantity: "109" },
          { part: "SYN-INSTALL", quantity: "16.12" },
        ],
        values: { total_length: "54.5", drives: "16" },
      },
    },
    {
      key: "unlisted_bay",
      label: "A 5 m bay is not in the bay-size table",
      source: "Bay-size table in tests/fixtures/rule-sets/syn-screen.ts",
      inputs: { spans: "1", span_width: "6.4", bays: "8", bay_size: "5", drive_type: "Cable", edge_fixing: "Hooks" },
      expected: { stop: "LOOKUP_NO_ROW" },
    },
  ],
});
