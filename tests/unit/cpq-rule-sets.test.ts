import assert from "node:assert/strict";
import { test } from "node:test";
import {
  compile,
  FormulaError,
  LIMITS,
  orderQuantity,
  RuleSetInvalid,
  RuleSetStop,
  runRuleSet,
  runTogether,
  testRuleSet,
  tryRunRuleSet,
  validateRuleSet,
  type Scope,
} from "../../src/cpq/rule-sets";
import { Fraction } from "../../src/cpq/expression";
import { synScreen } from "../fixtures/rule-sets/syn-screen";
import { synControl, synFertigation } from "../fixtures/rule-sets/syn-fertigation-control";

import type { ExpectedLines, RuleSetDefinition } from "../../src/cpq/rule-sets";

// Tests mutate copies into shapes the types forbid, to prove validation refuses them.
type Loose = RuleSetDefinition & Record<string, unknown>;
const clone = (v: RuleSetDefinition): Loose => JSON.parse(JSON.stringify(v)) as Loose;
const lines = (c: { expected: unknown }) => (c.expected as ExpectedLines);
const issues = (raw: unknown) => {
  try {
    validateRuleSet(raw);
  } catch (e) {
    if (e instanceof RuleSetInvalid) return e.issues;
    throw e;
  }
  return [];
};
const codes = (raw: unknown) => issues(raw).map((i) => i.code);

const scope = (over: Partial<Scope> = {}): Scope => ({
  names: new Map([
    ["a", "Number"],
    ["b", "Number"],
    ["flag", "YesNo"],
    ["drive", "Text"],
  ]),
  later: new Set(["later_value"]),
  choices: new Map([["drive", new Set(["Cable", "Pinion"])]]),
  tables: new Map([
    [
      "t",
      {
        key: "t",
        label: "T",
        source: "",
        columns: [
          { key: "k", type: "Number" as const },
          { key: "v", type: "Text" as const },
        ],
        keys: [{ column: "k", match: "AtLeast" as const }],
        rows: [{ k: "1", v: "x" }],
      },
    ],
  ]),
  parts: new Set(["P1"]),
  groups: new Set(["edge"]),
  labour: false,
  ...over,
});
const formulaCode = (source: string, sc: Scope = scope(), expected?: "Number" | "Text" | "YesNo") => {
  try {
    compile(source, sc, expected);
    return "OK";
  } catch (e) {
    assert.ok(e instanceof FormulaError, String(e));
    return e.code;
  }
};

test("language: precedence, types and every function compile", () => {
  assert.equal(compile("a + b * 2 - -1", scope()).type, "Number");
  assert.equal(compile("a < b and not flag or b >= 1", scope()).type, "YesNo");
  assert.equal(compile('if(flag, "x", drive)', scope()).type, "Text");
  assert.equal(compile("round(a / 3, 2) + ceil(a) + floor(b) + min(a, b, 3) + max(1, 2)", scope()).type, "Number");
  assert.equal(compile('lookup("t", "v", a)', scope()).type, "Text");
  assert.equal(compile('qty("P1") + minutes() + minutes("edge")', scope({ labour: true })).type, "Number");
  assert.deepEqual(compile("a + b + a", scope()).names, ["a", "b"]);
  // * binds tighter than +, and - is left associative.
  const tree = compile("10 - 4 - 3", scope()).tree;
  assert.equal(tree.k, "arith");
});

test("language: refuses what cannot be worked out, with a code", () => {
  assert.equal(formulaCode("a +"), "FORMULA_SYNTAX");
  assert.equal(formulaCode("a $ b"), "FORMULA_SYNTAX");
  assert.equal(formulaCode('"open'), "FORMULA_SYNTAX");
  assert.equal(formulaCode("a < b < 3"), "FORMULA_SYNTAX");
  assert.equal(formulaCode("nothing + 1"), "FORMULA_NAME");
  assert.equal(formulaCode("later_value + 1"), "FORMULA_FORWARD");
  assert.equal(formulaCode("sqrt(a)"), "FORMULA_FUNCTION");
  assert.equal(formulaCode('a + "x"'), "FORMULA_TYPE");
  assert.equal(formulaCode("drive = 3"), "FORMULA_TYPE");
  assert.equal(formulaCode('drive < "x"'), "FORMULA_TYPE");
  assert.equal(formulaCode('if(a, 1, 2)'), "FORMULA_TYPE");
  assert.equal(formulaCode('if(flag, 1, "x")'), "FORMULA_TYPE");
  assert.equal(formulaCode('drive = "Belt"'), "FORMULA_CHOICE");
  assert.equal(formulaCode('lookup("u", "v", a)'), "FORMULA_TABLE");
  assert.equal(formulaCode('lookup("t", "w", a)'), "FORMULA_TABLE");
  assert.equal(formulaCode('lookup("t", "v", drive)'), "FORMULA_TYPE");
  assert.equal(formulaCode('lookup("t", "v", a, b)'), "FORMULA_ARGUMENT");
  assert.equal(formulaCode('lookup(drive, "v", a)'), "FORMULA_ARGUMENT");
  assert.equal(formulaCode('qty("P1")'), "FORMULA_LABOUR_ONLY");
  assert.equal(formulaCode('qty("P9")', scope({ labour: true })), "FORMULA_PART");
  assert.equal(formulaCode('minutes("none")', scope({ labour: true })), "FORMULA_GROUP");
  assert.equal(formulaCode("ceil(1, 2)"), "FORMULA_ARGUMENT");
  assert.equal(formulaCode("a", scope(), "YesNo"), "FORMULA_TYPE");
  assert.equal(formulaCode("1234567890123456789 + 1"), "FORMULA_NUMBER");
  assert.equal(formulaCode("1".repeat(2049)), "FORMULA_LIMIT");
  assert.equal(formulaCode(Array(200).fill("a").join(" + ")), "FORMULA_LIMIT");
  assert.equal(formulaCode("(".repeat(40) + "a" + ")".repeat(40)), "FORMULA_LIMIT");
  assert.equal(formulaCode(""), "FORMULA_EMPTY");
});

test("validation: the synthetic families are valid and frozen", () => {
  for (const raw of [synScreen(), synFertigation(), synControl()]) {
    const checked = validateRuleSet(raw);
    assert.ok(Object.isFrozen(checked.definition));
    assert.ok(Object.isFrozen(checked.definition.rules[0]));
  }
});

test("validation: reports every structural problem with a path", () => {
  const raw = clone(synScreen());
  (raw as Record<string, unknown>).schema_version = 4;
  raw.inputs[1].key = "Bad Key";
  raw.inputs.push({ ...raw.inputs[0] });
  raw.derived[0].key = "spans";
  raw.inputs[4].choices = ["Cable"];
  raw.inputs[6].default = "Maybe";
  raw.inputs[7].default = null;
  raw.rules[0].choose = '"SYN-SCR-CLOTH"' as unknown as null;
  raw.rules[2].part = "SYN-NOPE";
  raw.tables[0].rows.push({ bay_size: "2", screen_width: "2.2" });
  raw.tables[0].keys[0].match = "AtLeast";
  raw.parts[4].ordering = { kind: "StockLength", length: "0" };
  raw.parts[1].group = "Drive Group";
  const found = issues(raw);
  const has = (path: string, code: string) =>
    assert.ok(found.some((i) => i.path === path && i.code === code), `${path} ${code} in ${JSON.stringify(found)}`);
  has("schema_version", "SCHEMA");
  has("inputs[1].key", "KEY");
  has("inputs[9].key", "DUPLICATE");
  has("derived[0].key", "DUPLICATE");
  has("inputs[4].choices", "CHOICES");
  has("inputs[6].default", "DEFAULT");
  has("inputs[7].default", "DEFAULT");
  has("rules[0]", "RULE_PART");
  has("rules[2].part", "RULE_PART");
  has("tables[0].rows[3].bay_size", "TABLE_ORDER");
  has("parts[4].ordering.length", "DECIMAL");
  has("parts[1].group", "KEY");
});

test("validation: formulas are checked in their own scope", () => {
  const forward = clone(synScreen());
  forward.derived[0].formula = "drives * 2";
  assert.ok(issues(forward).some((i) => i.path === "derived[0].formula" && i.code === "FORMULA_FORWARD"));

  const circular = clone(synScreen());
  circular.derived[3].formula = "le_tube_m + 1";
  assert.ok(issues(circular).some((i) => i.path === "derived[3].formula" && i.code === "FORMULA_FORWARD"));

  const asked = clone(synScreen());
  asked.inputs[7].asked_when = "target_drive_spacing > 2";
  assert.ok(issues(asked).some((i) => i.path === "inputs[7].asked_when" && i.code === "FORMULA_FORWARD"));

  const materialsQty = clone(synScreen());
  materialsQty.rules[0].quantity = 'qty("SYN-SCR-DRUM")';
  assert.ok(codes(materialsQty).includes("FORMULA_LABOUR_ONLY"));

  const wrongType = clone(synScreen());
  wrongType.rules[5].when = "total_length";
  assert.ok(issues(wrongType).some((i) => i.path === "rules[5].when" && i.code === "FORMULA_TYPE"));

  const choice = clone(synScreen());
  choice.rules[5].when = 'edge_fixing = "Hook"';
  assert.ok(codes(choice).includes("FORMULA_CHOICE"));
});

test("validation: reference cases must name real inputs, parts and values", () => {
  const raw = clone(synScreen());
  raw.reference_cases[0].inputs.colour = "Red";
  raw.reference_cases[0].inputs.bays = "8.5";
  lines(raw.reference_cases[0]).lines.push({ part: "SYN-NONE", quantity: "1" });
  lines(raw.reference_cases[0]).values.nothing = "1";
  const found = codes(raw);
  for (const c of ["CASE_INPUT", "CASE_LINE", "CASE_VALUE"]) assert.ok(found.includes(c), c);
});

test("validation: size and list limits refuse oversized rule sets", () => {
  const big = clone(synScreen());
  big.tables[0].rows = Array.from({ length: 2001 }, (_, i) => ({ bay_size: String(i + 1), screen_width: "1" }));
  assert.ok(codes(big).includes("LIMIT"));
  const huge = clone(synScreen());
  huge.padding = "x".repeat(600_000);
  assert.ok(codes(huge).includes("LIMIT"));
});

test("evaluation: the baseline case, line by line, with exact values", () => {
  const checked = validateRuleSet(synScreen());
  const run = runRuleSet(checked, { spans: "1", span_width: "6.4", bays: "8", bay_size: "3", drive_type: "Cable", edge_fixing: "Hooks" });
  const q = Object.fromEntries(run.lines.map((l) => [l.part, l.quantity]));
  assert.deepEqual(q, {
    "SYN-SCR-CLOTH": "182",
    "SYN-SCR-DRUM": "7",
    "SYN-SCR-TEK": "518",
    "SYN-SCR-LSWIRE": "449",
    "SYN-SCR-LETUBE": "44.8",
    "SYN-SCR-HOOK": "48",
    "SYN-INSTALL": "6.23",
  });
  const order = Object.fromEntries(run.lines.map((l) => [l.part, l.order_quantity]));
  assert.equal(order["SYN-SCR-TEK"], "600");
  assert.equal(order["SYN-SCR-LSWIRE"], "1800");
  assert.equal(order["SYN-SCR-LETUBE"], "48.8");
  assert.equal(run.values.drives, "7");
  assert.equal(run.lines.find((l) => l.part === "SYN-INSTALL")!.phase, "Labour");
  assert.deepEqual(run.lines.find((l) => l.part === "SYN-SCR-DRUM")!.rules, ["drive_head"]);
  assert.ok(!run.applied.includes("quad_clips"));
  const odd = run.inputs.find((i) => i.key === "odd_bay_size")!;
  assert.deepEqual([odd.asked, odd.from, odd.value], [false, "Default", "0"]);
  assert.deepEqual(run.rows_read, [
    { table: "bay_sizes", row: 0 },
    { table: "drive_factors", row: 0 },
    { table: "drive_parts", row: 0 },
  ]);
});

test("evaluation: inputs are checked and missing values stop the case", () => {
  const checked = validateRuleSet(synScreen());
  const base = { spans: "1", span_width: "6.4", bays: "8", bay_size: "3", drive_type: "Cable", edge_fixing: "Hooks" };
  const stop = (given: Record<string, string>) => {
    const r = tryRunRuleSet(checked, given);
    return r.status === "Stopped" ? r.code : "Done";
  };
  assert.equal(stop(base), "Done");
  assert.equal(stop({ ...base, bays: undefined as unknown as string }), "INPUT_MISSING");
  assert.equal(stop({ ...base, bays: "8.5" }), "INPUT_INVALID");
  assert.equal(stop({ ...base, spans: "0" }), "INPUT_INVALID");
  assert.equal(stop({ ...base, drive_type: "Belt" }), "INPUT_INVALID");
  assert.equal(stop({ ...base, colour: "Red" }), "INPUT_UNKNOWN");
  assert.equal(stop({ ...base, bay_size: "5" }), "LOOKUP_NO_ROW");
  // A value given for an input that is not asked is ignored in favour of its default.
  const ignored = runRuleSet(checked, { ...base, odd_bay_size: "9" });
  assert.equal(ignored.values.total_length, "24");
});

test("evaluation: range lookups take the first row at or above, per exact group", () => {
  const checked = validateRuleSet(synFertigation());
  const unit = (family: string, flow: string) =>
    runRuleSet(checked, { family, mainline_flow: flow, units: "1" }).values.unit_part;
  assert.equal(unit("SynJet", "30"), "SYN-FERT-JET300");
  assert.equal(unit("SynJet", "30.01"), "SYN-FERT-JET600");
  assert.equal(unit("SynJet", "150"), "SYN-FERT-JETBYP");
  assert.equal(unit("SynOne", "31"), "SYN-FERT-ONE600");
  const none = tryRunRuleSet(checked, { family: "SynOne", mainline_flow: "95", units: "1" });
  assert.equal(none.status, "Stopped");
  assert.equal(none.status === "Stopped" && none.code, "LOOKUP_NO_ROW");
  assert.match(none.status === "Stopped" ? none.message : "", /family SynOne, max_flow at or above 95/);
});

test("evaluation: AtMost tables, exact fractions, rounding and stops", () => {
  const raw = clone(synControl());
  raw.tables.push({
    key: "derate",
    label: "Derating",
    source: "SYN",
    columns: [
      { key: "temp", type: "Number" },
      { key: "factor", type: "Number" },
    ],
    keys: [{ column: "temp", match: "AtMost" }],
    rows: [
      { temp: "40", factor: "0.8" },
      { temp: "30", factor: "0.9" },
      { temp: "0", factor: "1" },
    ],
  });
  raw.inputs.push({ ...raw.inputs[1], key: "temperature", label: "Temperature", type: "Number" });
  raw.derived.push({ key: "factor", label: "Factor", unit: "", formula: 'lookup("derate", "factor", temperature)' });
  raw.derived.push({ key: "third", label: "Third", unit: "", formula: "relay_outputs_needed / 3" });
  raw.derived.push({ key: "rounded", label: "Rounded", unit: "", formula: "round(0 - 2.5) + round(2.5) + round(2.345, 2)" });
  raw.derived.push({ key: "ratio", label: "Ratio", unit: "", formula: "relay_outputs_needed / (relay_outputs_needed - 6)" });
  const checked = validateRuleSet(raw);
  const run = (temperature: string, outputs = "7") =>
    tryRunRuleSet(checked, { controller: "Compass 2", relay_outputs_needed: outputs, temperature });
  const r = run("35");
  assert.equal(r.status, "Done");
  if (r.status === "Done") {
    assert.equal(r.values.factor, "0.9");
    assert.equal(r.values.third, "7/3");
    assert.equal(r.values.rounded, "2.35");
  }
  const z = run("35", "6");
  assert.equal(z.status === "Stopped" && z.code, "DIVIDE_BY_ZERO");
});

test("evaluation: chosen parts must exist and quantities must not be negative", () => {
  const unknown = clone(synControl());
  unknown.tables[0].rows[0].part = "SYN-NOT-A-PART";
  const r1 = tryRunRuleSet(validateRuleSet(unknown), { controller: "Compass 2", relay_outputs_needed: "6" });
  assert.equal(r1.status === "Stopped" && r1.code, "CHOSEN_PART_UNKNOWN");

  const negative = clone(synControl());
  negative.rules[4].quantity = "25 - relay_outputs_needed";
  const r2 = tryRunRuleSet(validateRuleSet(negative), { controller: "Compass 2", relay_outputs_needed: "30" });
  assert.equal(r2.status === "Stopped" && r2.code, "QUANTITY_NEGATIVE");

  const zero = runRuleSet(validateRuleSet(negative), { controller: "Compass 2", relay_outputs_needed: "25" });
  assert.ok(zero.applied.includes("commissioning"));
  assert.ok(!zero.lines.some((l) => l.part === "SYN-COMMISSION"));
});

test("ordering rounds up to whole units, stock lengths and packs", () => {
  const f = (s: string) => Fraction.fromDecimal(s);
  const show = (v: Fraction) => v.exactDecimal(12);
  assert.equal(show(orderQuantity(f("44.8"), { kind: "StockLength", length: "6.1" })), "48.8");
  assert.equal(show(orderQuantity(f("12.2"), { kind: "StockLength", length: "6.1" })), "12.2");
  assert.equal(show(orderQuantity(f("101"), { kind: "Pack", size: "100" })), "200");
  assert.equal(show(orderQuantity(f("2.01"), { kind: "Whole" })), "3");
  assert.equal(show(orderQuantity(f("2.01"), { kind: "AsCalculated" })), "2.01");
});

test("reference cases: the synthetic families pass, and the screen coverage is exact", () => {
  const screen = testRuleSet(synScreen());
  assert.ok(screen.valid);
  if (!screen.valid) return;
  assert.deepEqual(
    screen.cases.map((c) => [c.key, c.status]),
    [
      ["baseline", "Pass"],
      ["pinion_two_spans_odd_bay", "Pass"],
      ["unlisted_bay", "Pass"],
    ],
  );
  assert.equal(screen.summary.lines, screen.summary.lines_matched);
  assert.deepEqual(
    screen.coverage.map((f) => [f.severity, f.code, f.subject]),
    [["Warning", "ROW_UNREAD", "bay_sizes"]],
  );
  assert.match(screen.coverage[0].message, /row 2 is read by no reference case/);

  for (const raw of [synFertigation(), synControl()]) {
    const t = testRuleSet(raw);
    assert.ok(t.valid && t.summary.failed === 0, JSON.stringify(t));
  }
});

test("reference cases: a wrong, missing or extra line fails the case", () => {
  const raw = clone(synScreen());
  const expected = lines(raw.reference_cases[0]);
  expected.lines[1].quantity = "8";
  expected.lines.splice(3, 1);
  expected.lines.push({ part: "SYN-SCR-QCLIP", quantity: "48" });
  expected.values.drives = "8";
  const t = testRuleSet(raw);
  assert.ok(t.valid);
  if (!t.valid) return;
  const c = t.cases[0];
  assert.equal(c.status, "Fail");
  assert.deepEqual(
    c.lines.filter((l) => !l.match).map((l) => [l.part, l.expected, l.got]),
    [
      ["SYN-SCR-DRUM", "8", "7"],
      ["SYN-SCR-LSWIRE", "0", "449"],
      ["SYN-SCR-QCLIP", "48", "0"],
    ],
  );
  assert.deepEqual(c.values.filter((v) => !v.match).map((v) => v.key), ["drives"]);

  const wrongStop = clone(synScreen());
  wrongStop.reference_cases[2].expected = { stop: "INPUT_MISSING" };
  const w = testRuleSet(wrongStop);
  assert.ok(w.valid && w.cases[2].status === "Fail");
});

test("coverage: each finding fires when it should", () => {
  const raw = clone(synScreen());
  raw.rules.push({ ...raw.rules[5], key: "hooks_again" });
  raw.rules[3].unit = "each";
  raw.inputs[5].choices = ["Hooks", "Quad Clip", "Clips"];
  raw.derived.push({ key: "unused", label: "Unused", unit: "", formula: "spans + 1" });
  raw.rules.push({ ...raw.rules[0], key: "never", part: "SYN-SCR-CLOTH", when: "spans > 100", unit: "m²" });
  const t = testRuleSet(raw);
  assert.ok(t.valid);
  if (!t.valid) return;
  const got = t.coverage.map((f) => [f.severity, f.code, f.subject]);
  for (const want of [
    ["Blocking", "DUPLICATE_RULE", "hooks_again"],
    ["Blocking", "OPTION_UNTESTED", "edge_fixing"],
    ["Blocking", "UNIT_MISMATCH", "ls_wire"],
    ["Warning", "RULE_NEVER_APPLIES", "never"],
    ["Warning", "DERIVED_UNREAD", "unused"],
  ])
    assert.ok(got.some((g) => JSON.stringify(g) === JSON.stringify(want)), JSON.stringify(want));

  const empty = clone(synScreen());
  empty.reference_cases = [];
  const e = testRuleSet(empty);
  assert.ok(e.valid && e.coverage.some((f) => f.code === "NO_REFERENCE_CASES" && f.severity === "Blocking"));
});

test("an invalid rule set is reported, not thrown, by testRuleSet", () => {
  const raw = clone(synScreen());
  raw.derived[0].formula = "drives";
  const t = testRuleSet(raw);
  assert.equal(t.valid, false);
  assert.ok(!t.valid && t.issues.some((i) => i.code === "FORMULA_FORWARD"));
});

test("together: fertigation passes values to control, and shared parts are flagged", () => {
  const fert = validateRuleSet(synFertigation());
  const ctrl = validateRuleSet(synControl());
  const job = runTogether([
    { name: "fertigation", rule_set: fert, inputs: { family: "SynJet", mainline_flow: "50", units: "2" }, receive: {} },
    {
      name: "control",
      rule_set: ctrl,
      inputs: { controller: "Compass 4", relay_outputs_needed: "38" },
      receive: {
        water_systems: { step: "fertigation", value: "water_systems" },
        dosing_channels: { step: "fertigation", value: "dosing_channels" },
      },
    },
  ]);
  const control = job.steps[1].result;
  assert.equal(control.status, "Done");
  if (control.status !== "Done") return;
  const q = Object.fromEntries(control.lines.map((l) => [l.part, l.quantity]));
  assert.equal(q["SYN-LIC-WATER"], "2");
  assert.equal(q["SYN-LIC-DOSING"], "10");
  assert.equal(q["SYN-CTRL-DOR6"], "4");
  assert.deepEqual(job.shared_parts, [
    { part: "SYN-COMMISSION", steps: ["fertigation", "control"] },
    { part: "SYN-PCLAB", steps: ["fertigation", "control"] },
  ]);
});

test("together: a stopped or missing source stops the receiving rule set", () => {
  const fert = validateRuleSet(synFertigation());
  const ctrl = validateRuleSet(synControl());
  const receive = { water_systems: { step: "fertigation", value: "water_systems" } };
  const stopped = runTogether([
    { name: "fertigation", rule_set: fert, inputs: { family: "SynOne", mainline_flow: "500", units: "1" }, receive: {} },
    { name: "control", rule_set: ctrl, inputs: { controller: "Compact", relay_outputs_needed: "1" }, receive },
  ]);
  const s = stopped.steps[1].result;
  assert.equal(s.status === "Stopped" && s.code, "UPSTREAM_STOPPED");

  const missing = runTogether([
    { name: "fertigation", rule_set: fert, inputs: { family: "SynOne", mainline_flow: "5", units: "1" }, receive: {} },
    { name: "control", rule_set: ctrl, inputs: { controller: "Compact", relay_outputs_needed: "1" }, receive: { water_systems: { step: "fertigation", value: "nope" } } },
  ]);
  const m = missing.steps[1].result;
  assert.equal(m.status === "Stopped" && m.code, "PASS_MISSING");

  const order = runTogether([{ name: "control", rule_set: ctrl, inputs: { controller: "Compact", relay_outputs_needed: "1" }, receive }]);
  const o = order.steps[0].result;
  assert.equal(o.status === "Stopped" && o.code, "STEP_ORDER");

  assert.throws(
    () =>
      runTogether([
        { name: "a", rule_set: ctrl, inputs: { controller: "Compact", relay_outputs_needed: "1" }, receive: {} },
        { name: "a", rule_set: ctrl, inputs: { controller: "Compact", relay_outputs_needed: "1" }, receive: {} },
      ]),
    (e: unknown) => e instanceof RuleSetStop && e.code === "STEP_DUPLICATE",
  );
});

test("together: one rule set can run once per controller on the same job", () => {
  const ctrl = validateRuleSet(synControl());
  const job = runTogether([
    { name: "house_1", rule_set: ctrl, inputs: { controller: "Compass 4", relay_outputs_needed: "20" }, receive: {} },
    { name: "house_2", rule_set: ctrl, inputs: { controller: "Compass 2", relay_outputs_needed: "6" }, receive: {} },
  ]);
  assert.deepEqual(
    job.shared_parts.map((s) => s.part),
    ["SYN-COMMISSION", "SYN-PCLAB"],
  );
});

test("evaluation: a case that needs too many steps stops", () => {
  const raw = clone(synControl());
  const rows = Array.from({ length: 2000 }, (_, i) => ({ controller: `C${i}`, relay_outputs: "1", part: "SYN-CTRL-C2" }));
  raw.tables[0].rows = [...rows.slice(0, 1997), ...raw.tables[0].rows];
  // 120 lookups, each scanning 2,000 rows to reach "Compact", exceed the 200,000-step budget.
  for (let i = 0; i < 40; i++)
    raw.derived.push({
      key: `heavy_${i}`,
      label: `Heavy ${i}`,
      unit: "",
      formula: Array.from({ length: 3 }, () => 'lookup("builtin_io", "relay_outputs", controller)').join(" + "),
    });
  const r = tryRunRuleSet(validateRuleSet(raw), { controller: "Compact", relay_outputs_needed: "1" });
  assert.equal(r.status === "Stopped" && r.code, "COMPUTATION_LIMIT");
});

test("the isolated CPQ worker checks and runs rule sets as data", async () => {
  const { ruleSetTestIsolated, ruleSetRunIsolated, ruleSetJobIsolated } = await import("../../src/cpq/runner");
  const tested = await ruleSetTestIsolated(synScreen());
  assert.ok("summary" in tested && tested.summary.failed === 0 && tested.summary.cases === 3);

  const ran = await ruleSetRunIsolated(synControl(), { controller: "Compass 4", relay_outputs_needed: "38" });
  assert.ok("result" in ran && ran.result.status === "Done");
  if ("result" in ran && ran.result.status === "Done")
    assert.equal(ran.result.lines.find((l) => l.part === "SYN-CTRL-DOR6")?.quantity, "4");

  const broken = clone(synControl());
  broken.derived[0].formula = "relay_modules";
  const refused = await ruleSetTestIsolated(broken);
  assert.equal(refused.valid, false);

  const job = await ruleSetJobIsolated([
    { name: "fertigation", definition: synFertigation(), inputs: { family: "SynJet", mainline_flow: "50", units: "2" }, receive: {} },
    {
      name: "control",
      definition: synControl(),
      inputs: { controller: "Compass 4", relay_outputs_needed: "38" },
      receive: { dosing_channels: { step: "fertigation", value: "dosing_channels" } },
    },
  ]);
  assert.ok("job" in job && "shared_parts" in job.job && job.job.shared_parts.length === 2);
  const badStep = await ruleSetJobIsolated([{ name: "control", definition: broken, inputs: {}, receive: {} }]);
  assert.ok(!badStep.valid && "step" in badStep && badStep.step === "control");
});

test("review: a half-invalid table is reported, never thrown", () => {
  const missing = clone(synControl());
  missing.tables[0].keys[0].column = "nope";
  const a = issues(missing);
  assert.ok(a.some((i) => i.path === "tables[0].keys[0].column" && i.code === "TABLE"));
  assert.ok(a.some((i) => i.code === "FORMULA_TABLE"));

  const untyped = clone(synControl());
  (untyped.tables[0].columns[0] as { type: unknown }).type = undefined;
  assert.ok(issues(untyped).some((i) => i.path === "tables[0].columns[0].type"));

  const ctor = clone(synFertigation());
  ctor.tables[0].columns[1].key = "constructor";
  ctor.tables[0].keys[1].column = "constructor";
  for (const row of ctor.tables[0].rows) delete row.max_flow;
  ctor.derived[0].formula = 'lookup("unit_by_flow", "part", family, mainline_flow)';
  const c = issues(ctor);
  assert.ok(c.some((i) => i.code === "TABLE" && /constructor/.test(i.message)));
});

test("review: a column called constructor works like any other", () => {
  const raw = clone(synFertigation());
  raw.tables[0].columns[1].key = "constructor";
  raw.tables[0].keys[1].column = "constructor";
  raw.tables[0].rows = raw.tables[0].rows.map(({ max_flow, ...rest }) => ({ ...rest, constructor: max_flow }));
  const run = runRuleSet(validateRuleSet(raw), { family: "SynJet", mainline_flow: "50", units: "1" });
  assert.equal(run.values.unit_part, "SYN-FERT-JET600");
});

test("review: odd expected values are compared, never thrown", () => {
  const raw = clone(synScreen());
  lines(raw.reference_cases[0]).values.drives = "1/0";
  lines(raw.reference_cases[1]).values.drives = `1/${"9".repeat(290)}`;
  const t = testRuleSet(raw);
  assert.ok(t.valid);
  if (!t.valid) return;
  assert.equal(t.cases[0].status, "Fail");
  assert.equal(t.cases[1].status, "Fail");
  lines(raw.reference_cases[0]).values.drives = "x".repeat(301);
  assert.ok(codes(raw).includes("LIMIT"));
});

test("review: malformed jobs and inherited names are refused cleanly", async () => {
  const { ruleSetWork } = await import("../../src/cpq/rule-sets/entry");
  const def = synControl();
  const bad = (steps: unknown) => ruleSetWork({ kind: "rule-set-job", steps } as never);
  assert.equal(bad("x").valid, false);
  assert.equal(bad([null]).valid, false);
  assert.equal(bad([{ name: "a", definition: def, inputs: {}, receive: { x: null } }]).valid, false);
  assert.equal(bad(Array.from({ length: 21 }, (_, i) => ({ name: `s${i}`, definition: def, inputs: {}, receive: {} }))).valid, false);

  const fert = validateRuleSet(synFertigation());
  const ctrl = validateRuleSet(synControl());
  const job = runTogether([
    { name: "fertigation", rule_set: fert, inputs: { family: "SynOne", mainline_flow: "5", units: "1" }, receive: {} },
    { name: "control", rule_set: ctrl, inputs: { controller: "Compact", relay_outputs_needed: "1" }, receive: { water_systems: { step: "fertigation", value: "constructor" } } },
  ]);
  const r = job.steps[1].result;
  assert.equal(r.status === "Stopped" && r.code, "PASS_MISSING");

  const inherited = tryRunRuleSet(ctrl, Object.assign(Object.create({ water_systems: "5" }), { controller: "Compact", relay_outputs_needed: "1" }));
  assert.ok(inherited.status === "Done" && inherited.inputs.find((i) => i.key === "water_systems")?.from === "Default");
});

test("review: realistic nesting is allowed and the depth limit counts brackets", () => {
  for (const ok of ["((((1))))", "max(1, min(2, ceil(floor(a))))", "round(max(0, ceil((a - 1) / 2)) * 3, 2)", "not not not flag"])
    assert.equal(formulaCode(ok), "OK", ok);
  assert.equal(formulaCode("(".repeat(33) + "1" + ")".repeat(33)), "FORMULA_LIMIT");
});

test("review: one range key per table, and reserved words are not keys", () => {
  const grid = clone(synFertigation());
  grid.tables[0].columns.push({ key: "pressure", type: "Number" });
  grid.tables[0].keys.push({ column: "pressure", match: "AtLeast" });
  grid.tables[0].rows = grid.tables[0].rows.map((r) => ({ ...r, pressure: "5" }));
  assert.ok(issues(grid).some((i) => i.path === "tables[0].keys" && /only one range key/.test(i.message)));

  for (const word of ["true", "and", "lookup"]) {
    const raw = clone(synControl());
    raw.derived[1].key = word;
    assert.ok(issues(raw).some((i) => i.path === "derived[1].key" && i.code === "RESERVED"), word);
  }
});

test("review: coverage reads the values cases ran with, and compares parsed conditions", () => {
  const raw = clone(synScreen());
  raw.inputs.push({
    key: "seal",
    label: "Seal colour",
    question: "Seal colour?",
    unit: "",
    type: "Choice",
    choices: ["Grey", "Black"],
    minimum: null,
    maximum: null,
    default: "Grey",
    required: false,
    asked_when: "spans > 5",
  });
  raw.reference_cases[0].inputs.seal = "Black";
  raw.rules.push({ ...raw.rules[5], key: "hooks_spaced", when: 'edge_fixing="Hooks"' });
  const t = testRuleSet(raw);
  assert.ok(t.valid);
  if (!t.valid) return;
  assert.ok(t.coverage.some((f) => f.code === "OPTION_UNTESTED" && /Black/.test(f.message)));
  assert.ok(t.coverage.some((f) => f.code === "DUPLICATE_RULE" && f.subject === "hooks_spaced"));
});

test("review: every case in one test shares a step budget", () => {
  const raw = clone(synControl());
  const rows = Array.from({ length: 1997 }, (_, i) => ({ controller: `C${i}`, relay_outputs: "1", part: "SYN-CTRL-C2" }));
  raw.tables[0].rows = [...rows, ...raw.tables[0].rows];
  for (let i = 0; i < 30; i++)
    raw.derived.push({
      key: `heavy_${i}`,
      label: `Heavy ${i}`,
      unit: "",
      formula: Array.from({ length: 3 }, () => 'lookup("builtin_io", "relay_outputs", controller)').join(" + "),
    });
  raw.reference_cases = Array.from({ length: 12 }, (_, i) => ({
    key: `case_${i}`,
    label: `Case ${i}`,
    source: "Budget test",
    inputs: { controller: "Compact", relay_outputs_needed: "1" },
    expected: { stop: "NONE" },
  }));
  const t = testRuleSet(raw);
  assert.ok(t.valid);
  if (!t.valid) return;
  assert.equal(t.cases[0].run.status, "Done");
  const last = t.cases[11].run;
  assert.ok(last.status === "Stopped" && last.code === "COMPUTATION_LIMIT" && /together/.test(last.message));
});

// Second independent review (Codex, PR #688 at ddf3283f): F1–F12. Each test below fails on that head.
// A small rule set built inline, so each probe shows only what it tests.
const probe = (over: Record<string, unknown> = {}) => ({
  schema_version: 5,
  kind: "RuleSet",
  key: "probe",
  label: "Probe",
  family: "SYN",
  inputs: [],
  derived: [],
  tables: [],
  parts: [],
  rules: [],
  reference_cases: [],
  passes: [],
  ...over,
});
const input = (key: string, over: Record<string, unknown> = {}) => ({
  key,
  label: key,
  question: key,
  unit: "",
  type: "Number",
  choices: [],
  minimum: null,
  maximum: null,
  default: null,
  required: true,
  asked_when: null,
  ...over,
});
const derived = (key: string, formula: string) => ({ key, label: key, unit: "", formula });
const part = (key = "P", unit = "each") => ({ key, description: key, unit, group: "parts", ordering: { kind: "AsCalculated" }, install_minutes: "0" });
const rule = (key: string, quantity: string, over: Record<string, unknown> = {}) => ({
  key,
  description: key,
  phase: "Materials",
  when: "true",
  part: "P",
  choose: null,
  quantity,
  unit: null,
  ...over,
});
const refCase = (expected: unknown, inputs: Record<string, string> = {}) => ({ key: "case_a", label: "A", source: "Worked by hand", inputs, expected });
const tested = (raw: unknown) => {
  const t = testRuleSet(raw);
  assert.ok(t.valid, JSON.stringify(!t.valid && t.issues));
  return t;
};

test("review 2 F1: a supplied value of the wrong kind is refused, never replaced by the default", async () => {
  const { ruleSetWork } = await import("../../src/cpq/rule-sets/entry");
  const def = probe({ inputs: [input("n", { default: "2", required: false })], derived: [derived("answer", "n")] });
  const run = (inputs: unknown) => ruleSetWork({ kind: "rule-set-run", definition: def, inputs } as never);
  const refused = run({ n: 999 });
  assert.ok(!refused.valid && refused.issues.some((i) => i.path === "inputs.n" && i.code === "SHAPE"));
  assert.equal(run("n=2").valid, false);
  const unknown = run({ wrong: "1" });
  assert.ok("result" in unknown && unknown.result.status === "Stopped" && unknown.result.code === "INPUT_UNKNOWN");
  const job = ruleSetWork({ kind: "rule-set-job", steps: [{ name: "a", definition: def, inputs: { n: 999 }, receive: {} }] } as never);
  assert.ok(!job.valid && job.issues.some((i) => i.path === "steps[0].inputs.n"));

  // The engine itself tells a missing value from a wrong one.
  const checked = validateRuleSet(def);
  const direct = tryRunRuleSet(checked, { n: 999 as never });
  assert.ok(direct.status === "Stopped" && direct.code === "INPUT_INVALID");
  const absent = runRuleSet(checked, { n: undefined as never });
  assert.equal(absent.inputs[0].from, "Default");
  assert.equal(runRuleSet(checked, { n: "5" }).values.answer, "5");
});

test("review 2 F2: Text and YesNo values must match exactly; only Numbers compare by value", () => {
  const def = (values: Record<string, string>) =>
    probe({
      derived: [derived("code", '"01"'), derived("width", "6.1"), derived("flag", "1 > 0")],
      reference_cases: [refCase({ lines: [], values })],
    });
  assert.equal(tested(def({ code: "1" })).cases[0].status, "Fail");
  assert.equal(tested(def({ code: "01", width: "6.10", flag: "Yes" })).cases[0].status, "Pass");
  assert.equal(tested(def({ flag: "yes" })).cases[0].status, "Fail");
});

test("review 2 F3: range rows are ordered within each numeric group, however its key is written", () => {
  const table = (rows: Record<string, string>[], match = "AtLeast") => ({
    key: "t",
    label: "T",
    source: "SYN",
    columns: [
      { key: "g", type: "Number" },
      { key: "k", type: "Number" },
      { key: "v", type: "Text" },
    ],
    keys: [
      { column: "g", match: "Exact" },
      { column: "k", match },
    ],
    rows,
  });
  const order = (rows: Record<string, string>[], match?: string) =>
    issues(probe({ tables: [table(rows, match)] }))
      .filter((i) => i.code === "TABLE_ORDER")
      .map((i) => i.path);
  const rowsOf = (pairs: [string, string][]) => pairs.map(([g, k]) => ({ g, k, v: `${g}:${k}` }));
  assert.deepEqual(order(rowsOf([["1", "10"], ["1.0", "5"]])), ["tables[0].rows[1].k"]);
  assert.deepEqual(order(rowsOf([["01", "10"], ["1", "5"]])), ["tables[0].rows[1].k"]);
  assert.deepEqual(order(rowsOf([["0", "5"], ["-0", "10"]]), "AtMost"), ["tables[0].rows[1].k"]);
  // Different groups are ordered on their own.
  assert.deepEqual(order(rowsOf([["1", "10"], ["2", "5"]])), []);
});

test("review 2 F4: a range key on a text column is reported, never thrown", async () => {
  const def = probe({
    tables: [
      {
        key: "t",
        label: "T",
        source: "SYN",
        columns: [
          { key: "k", type: "Text" },
          { key: "v", type: "Text" },
        ],
        keys: [{ column: "k", match: "AtLeast" }],
        rows: [
          { k: "a", v: "A" },
          { k: "b", v: "B" },
        ],
      },
    ],
  });
  const t = testRuleSet(def);
  assert.ok(!t.valid && t.issues.some((i) => i.path === "tables[0].keys[0].match" && i.code === "TABLE"));
  const { ruleSetWork } = await import("../../src/cpq/rule-sets/entry");
  assert.equal(ruleSetWork({ kind: "rule-set-test", definition: def }).valid, false);
});

test("review 2 F5: numbers pass exactly between rule sets, and the receiver still checks them", () => {
  const source = (value: string) => ({ name: "a", rule_set: validateRuleSet(probe({ passes: [{ key: "out", value }] })), inputs: {}, receive: {} });
  const receiver = (over: Record<string, unknown> = {}) => ({
    name: "b",
    rule_set: validateRuleSet(probe({ key: "consumer", inputs: [input("n", over)], derived: [derived("triple", "n * 3")] })),
    inputs: {},
    receive: { n: { step: "a", value: "out" } },
  });
  const result = (value: string, over?: Record<string, unknown>) => runTogether([source(value), receiver(over)]).steps[1].result;
  const third = result("1 / 3");
  assert.ok(third.status === "Done" && third.values.triple === "1" && third.inputs[0].value === "1/3", JSON.stringify(third));
  const big = result("100000000000 * 1000000000000");
  assert.ok(big.status === "Done" && big.values.triple === "300000000000000000000000", JSON.stringify(big));
  for (const [over, why] of [
    [{ type: "WholeNumber" }, /whole number/],
    [{ maximum: "0.3" }, /maximum/],
  ] as const) {
    const r = result("1 / 3", over);
    assert.ok(r.status === "Stopped" && r.code === "INPUT_INVALID" && why.test(r.message), JSON.stringify(r));
  }
});

test("review 2 F6: an expected line may be an exact fraction or a long whole number", () => {
  const def = (quantity: string, expected: string) =>
    probe({ parts: [part()], rules: [rule("r", quantity)], reference_cases: [refCase({ lines: [{ part: "P", quantity: expected }], values: {} })] });
  assert.equal(tested(def("1 / 3", "1/3")).cases[0].status, "Pass");
  assert.equal(tested(def("1 / 3", "2/6")).cases[0].status, "Pass");
  assert.equal(tested(def("1 / 3", "0.333333333333")).cases[0].status, "Fail");
  assert.equal(tested(def("100000000000 * 1000000000000", "100000000000000000000000")).cases[0].status, "Pass");
  for (const bad of ["1/0", "-1/3", "one third"])
    assert.ok(
      issues(def("1", bad)).some((i) => i.path === "reference_cases[0].expected.lines[0].quantity" && i.code === "DECIMAL"),
      bad,
    );
});

test("review 2 F7: a case that stops still counts what it used, and only that", () => {
  const def = probe({
    inputs: [input("pick", { type: "Choice", choices: ["A", "B"], default: "A", required: false, asked_when: "false" })],
    tables: [
      {
        key: "t",
        label: "T",
        source: "SYN",
        columns: [
          { key: "k", type: "Number" },
          { key: "v", type: "Number" },
        ],
        keys: [{ column: "k", match: "Exact" }],
        rows: [{ k: "1", v: "2" }],
      },
    ],
    derived: [derived("looked", 'lookup("t", "v", 1)')],
    parts: [part()],
    rules: [rule("first", "looked"), rule("second", "1 / 0", { when: "looked > 0" })],
    reference_cases: [refCase({ stop: "DIVIDE_BY_ZERO" }, { pick: "B" })],
  });
  const t = tested(def);
  assert.equal(t.cases[0].status, "Pass");
  const run = t.cases[0].run;
  assert.ok(run.status === "Stopped" && run.trace?.inputs[0].value === "A" && run.trace.applied.includes("first"));
  const found = t.coverage.map((f) => `${f.code} ${f.subject} ${f.message}`);
  assert.ok(found.some((f) => f.startsWith("OPTION_UNTESTED pick") && f.includes("“B”")), found.join("\n"));
  assert.ok(!found.some((f) => f.includes("“A”")), found.join("\n"));
  assert.ok(!found.some((f) => f.startsWith("ROW_UNREAD") || f.startsWith("RULE_NEVER_APPLIES first")), found.join("\n"));
});

test("review 2 F8: a chosen part's unit is checked even when its quantity is zero", () => {
  const def = (over: Record<string, unknown>) =>
    probe({
      parts: [part("P", "each"), part("Q", "m")],
      rules: [rule("r", "0", { part: null, unit: "m", ...over })],
      reference_cases: [refCase({ lines: [], values: {} })],
    });
  const mismatch = (raw: unknown) =>
    tested(raw)
      .coverage.filter((f) => f.code === "UNIT_MISMATCH")
      .map((f) => f.message);
  assert.deepEqual(mismatch(def({ choose: 'if(1 > 0, "P", "Q")' })), ["Rule r counts in m, but P is sold in each"]);
  // A part the formula always chooses is checked even if the rule never applies.
  assert.deepEqual(mismatch(def({ choose: '"P"', when: "false" })), ["Rule r counts in m, but P is sold in each"]);
  assert.deepEqual(mismatch(def({ choose: '"Q"' })), []);
});

test("review 2 F9: oversized names and values give a short refusal", async () => {
  const { ruleSetWork } = await import("../../src/cpq/rule-sets/entry");
  const huge = "x".repeat(1_000_000);
  const unknown = ruleSetWork({ kind: "rule-set-run", definition: probe(), inputs: { [huge]: "1" } });
  assert.ok("result" in unknown && unknown.result.status === "Stopped" && unknown.result.code === "INPUT_UNKNOWN");
  assert.ok(JSON.stringify(unknown).length < 1_000);
  const long = ruleSetWork({ kind: "rule-set-run", definition: probe({ inputs: [input("n")] }), inputs: { n: huge } });
  assert.ok(!long.valid && long.issues.some((i) => i.path === "inputs.n" && i.code === "LIMIT"));
  assert.ok(JSON.stringify(long).length < 1_000);
  const many = Object.fromEntries(Array.from({ length: 101 }, (_, i) => [`k${i}`, "1"]));
  assert.equal(ruleSetWork({ kind: "rule-set-run", definition: probe(), inputs: many }).valid, false);
  const job = ruleSetWork({
    kind: "rule-set-job",
    steps: [{ name: "a", definition: probe(), inputs: {}, receive: { [huge]: { step: "a", value: "b" } } }],
  });
  assert.ok("job" in job && "steps" in job.job, JSON.stringify(job).slice(0, 300));
  assert.ok(JSON.stringify(job).length < 2_000);
  const step = job.job.steps[0].result;
  assert.ok(step.status === "Stopped" && step.code === "INPUT_UNKNOWN");

  // Copying a very large request into the worker can abort the whole process (an 80 MB value did), so the
  // runner measures it first and refuses it without starting a worker.
  const { ruleSetRunIsolated, ruleSetJobIsolated } = await import("../../src/cpq/runner");
  const over = "x".repeat(LIMITS.requestCharacters);
  await assert.rejects(ruleSetRunIsolated(probe(), { n: over }), (e: { code?: string }) => e.code === "PayloadTooLarge");
  await assert.rejects(ruleSetJobIsolated([{ name: "a", definition: probe(), inputs: { n: over }, receive: {} }]), (e: { code?: string }) => e.code === "PayloadTooLarge");
  const cyclic: Record<string, unknown> = {};
  cyclic.self = cyclic;
  await assert.rejects(ruleSetRunIsolated(cyclic, {}), (e: { code?: string }) => e.code === "PayloadTooLarge");
});

test("review 2 F10: an unknown kind of rule set work is refused", async () => {
  const { ruleSetWork } = await import("../../src/cpq/rule-sets/entry");
  const r = ruleSetWork({ kind: "rule-set-typo", steps: [{ name: "a", definition: probe(), inputs: {}, receive: {} }] } as never);
  assert.ok(!r.valid && r.issues.some((i) => i.path === "kind" && i.code === "KIND"));
});

test("review 2 F11: a received name that is not an input is refused, including __proto__", () => {
  const a = { name: "a", rule_set: validateRuleSet(probe({ passes: [{ key: "out", value: "1" }] })), inputs: {}, receive: {} };
  for (const receive of [JSON.parse('{"__proto__":{"step":"a","value":"out"}}'), { nope: { step: "a", value: "out" } }]) {
    const r = runTogether([a, { name: "b", rule_set: validateRuleSet(probe()), inputs: {}, receive }]).steps[1].result;
    assert.ok(r.status === "Stopped" && r.code === "INPUT_UNKNOWN", JSON.stringify(r));
  }
});

test("review 2 F12: runTogether enforces the 20-step limit itself", () => {
  const checked = validateRuleSet(probe());
  const job = (n: number) => runTogether(Array.from({ length: n }, (_, i) => ({ name: `s_${i}`, rule_set: checked, inputs: {}, receive: {} })));
  assert.equal(job(20).steps.length, 20);
  assert.throws(() => job(21), (e) => e instanceof RuleSetStop && e.code === "STEP_LIMIT");
});

test("review 2: duplicate rules are found by parsed condition, so spaces inside quotes count", () => {
  const def = probe({
    derived: [derived("code", '"A B"')],
    parts: [part()],
    rules: [
      rule("spaced", "1", { when: 'code = "A B"' }),
      rule("joined", "1", { when: 'code = "AB"' }),
      rule("respaced", "1", { when: 'code  =  "A B"' }),
    ],
    reference_cases: [refCase({ lines: [{ part: "P", quantity: "2" }], values: {} })],
  });
  const dup = tested(def)
    .coverage.filter((f) => f.code === "DUPLICATE_RULE")
    .map((f) => f.subject);
  assert.deepEqual(dup, ["respaced"]);
});

// Codex's follow-up review of PR #688 at 3cf8bebc: F4 follow-up, F9-a and F9-b. Each test below fails on that head.
const rejectsAsTooLarge = (p: Promise<unknown>, why: string) =>
  assert.rejects(p, (e: { code?: string }) => e.code === "PayloadTooLarge", why);

test("review 3 F4: a column declared twice with different types is reported, never thrown", async () => {
  const def = (first: string, second: string) =>
    probe({
      tables: [
        {
          key: "t",
          label: "T",
          source: "SYN",
          columns: [
            { key: "k", type: first },
            { key: "k", type: second },
            { key: "v", type: "Text" },
          ],
          keys: [{ column: "k", match: "AtLeast" }],
          rows: [
            { k: "a", v: "A" },
            { k: "b", v: "B" },
          ],
        },
      ],
    });
  // The first declaration is the column; the second is only reported.
  const textFirst = testRuleSet(def("Text", "Number"));
  assert.ok(!textFirst.valid);
  const found = textFirst.issues.map((i) => `${i.path} ${i.code}`);
  assert.ok(found.includes("tables[0].columns[1].key DUPLICATE"), found.join("\n"));
  assert.ok(found.includes("tables[0].keys[0].match TABLE"), found.join("\n"));
  const numberFirst = testRuleSet(def("Number", "Text"));
  assert.ok(!numberFirst.valid);
  const again = numberFirst.issues.map((i) => `${i.path} ${i.code}`);
  assert.ok(again.includes("tables[0].columns[1].key DUPLICATE") && again.includes("tables[0].rows[0].k DECIMAL"), again.join("\n"));

  const { ruleSetTestIsolated } = await import("../../src/cpq/runner");
  const worker = await ruleSetTestIsolated(def("Text", "Number"));
  assert.ok(!worker.valid && worker.issues.some((i) => i.path === "tables[0].columns[1].key" && i.code === "DUPLICATE"));
});

test("review 3 F9-a: only plain data reaches the worker, and what is measured is what is sent", async () => {
  const { ruleSetJobIsolated, ruleSetRunIsolated, ruleSetTestIsolated } = await import("../../src/cpq/runner");
  const def = probe({ inputs: [input("n", { default: "2", required: false })], derived: [derived("answer", "n")] });
  class Inputs {
    n = "999";
  }
  const getter = Object.defineProperty({}, "n", { enumerable: true, get: () => "999" });
  const odd: [string, unknown][] = [
    ["Map", new Map([["n", "999"]])],
    ["ArrayBuffer", new ArrayBuffer(16)],
    ["Date", new Date(0)],
    ["class instance", new Inputs()],
    ["accessor", getter],
    ["proxy", new Proxy({ n: "999" }, {})],
  ];
  for (const [why, value] of odd) {
    await rejectsAsTooLarge(ruleSetRunIsolated(def, value as never), `run inputs: ${why}`);
    await rejectsAsTooLarge(ruleSetTestIsolated(probe({ reference_cases: [refCase({ lines: [], values: {} }, value as never)] })), `test: ${why}`);
    await rejectsAsTooLarge(ruleSetJobIsolated([{ name: "a", definition: def, inputs: value as never, receive: {} }]), `job: ${why}`);
  }
  await rejectsAsTooLarge(ruleSetTestIsolated(new Map([["schema_version", 5]])), "a Map definition");
  // A request too deep to be a rule set is refused before it is copied.
  let deep: unknown = "x";
  for (let i = 0; i < LIMITS.requestDepth + 1; i++) deep = [deep];
  await rejectsAsTooLarge(ruleSetTestIsolated(probe({ extra: deep })), "too deep");
  // Plain data still runs, and a name such as __proto__ stays an ordinary name in the copy.
  const plain = await ruleSetRunIsolated(def, { n: "5" });
  assert.ok("result" in plain && plain.result.status === "Done" && plain.result.values.answer === "5", JSON.stringify(plain));
  const proto = await ruleSetRunIsolated(def, JSON.parse('{"__proto__":"1"}'));
  assert.ok("result" in proto && proto.result.status === "Stopped" && proto.result.code === "INPUT_UNKNOWN", JSON.stringify(proto));

  // Called in-process, the worker's entry refuses the same containers instead of reading them as empty.
  const { ruleSetWork } = await import("../../src/cpq/rule-sets/entry");
  const direct = ruleSetWork({ kind: "rule-set-run", definition: def, inputs: new Map([["n", "999"]]) as never });
  assert.ok(!direct.valid && direct.issues.some((i) => i.path === "inputs" && i.code === "SHAPE"), JSON.stringify(direct));
  assert.ok(issues(probe({ reference_cases: [refCase({ lines: [], values: {} }, new Map() as never)] })).some((i) => i.path === "reference_cases[0].inputs" && i.code === "SHAPE"));
});

test("review 3 F9-b: definition problems echo short names, and only so many are listed", async () => {
  const short = (list: { path: string; message: string }[]) => list.every((i) => i.path.length < 200 && i.message.length < 300);
  const huge = "x".repeat(100_000);
  const { ruleSetTestIsolated } = await import("../../src/cpq/runner");
  const caseInput = await ruleSetTestIsolated(probe({ reference_cases: [refCase({ lines: [], values: {} }, { [huge]: "1" })] }));
  assert.ok(!caseInput.valid && caseInput.issues[0].code === "CASE_INPUT" && short(caseInput.issues), JSON.stringify(caseInput).slice(0, 300));

  // Every other place a definition's own names are echoed, within the definition size limit.
  const long = "x".repeat(20_000);
  const echoed = issues(
    probe({
      key: long,
      inputs: [input(long)],
      derived: [derived("d", `${"y".repeat(2_000)} + 1`)],
      tables: [
        {
          key: "t",
          label: "T",
          source: "SYN",
          columns: [
            { key: long, type: "Text" },
            { key: "n", type: "Number" },
            { key: "v", type: "Text" },
          ],
          keys: [{ column: long, match: "Exact" }],
          rows: [{ n: long, v: "a", [long]: "a" }],
        },
      ],
      parts: [{ ...part(), group: long }],
      rules: [rule("r", "1", { part: long })],
      reference_cases: [refCase({ lines: [{ part: long, quantity: "1" }], values: { [long]: "1" } })],
    }),
  );
  assert.ok(echoed.length > 10 && short(echoed), JSON.stringify(echoed).slice(0, 600));

  // Codex's amplification probe: one long column name and 20 rows without it.
  const amplified = probe({
    tables: [
      {
        key: "t",
        label: "T",
        source: "SYN",
        columns: [
          { key: "y".repeat(1_000), type: "Text" },
          { key: "v", type: "Text" },
        ],
        keys: [{ column: "v", match: "Exact" }],
        rows: Array.from({ length: 20 }, () => ({ v: "a" })),
      },
    ],
  });
  assert.ok(JSON.stringify(testRuleSet(amplified)).length < 5_000);

  // However many problems there are, the list stops at the limit and says how many more there were.
  const columns = Array.from({ length: LIMITS.columns }, (_, i) => ({ key: `c${i}`, type: "Text" }));
  const many = issues(
    probe({
      tables: [{ key: "t", label: "T", source: "SYN", columns, keys: [{ column: "c0", match: "Exact" }], rows: Array.from({ length: LIMITS.rows }, () => ({})) }],
    }),
  );
  assert.equal(many.length, LIMITS.issues + 1);
  const last = many[LIMITS.issues];
  assert.equal(last.code, "ISSUE_LIMIT");
  assert.equal(last.message, `${LIMITS.columns * LIMITS.rows - LIMITS.issues} more problems are not shown`);
  const worker = await ruleSetTestIsolated(probe({ tables: [{ key: "t", label: "T", source: "SYN", columns, keys: [{ column: "c0", match: "Exact" }], rows: Array.from({ length: LIMITS.rows }, () => ({})) }] }));
  assert.ok(!worker.valid && worker.issues.length === LIMITS.issues + 1 && JSON.stringify(worker).length < 50_000);
});
