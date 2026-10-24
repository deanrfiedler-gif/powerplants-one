import assert from "node:assert/strict";
import { test } from "node:test";
import {
  compile,
  FormulaError,
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
