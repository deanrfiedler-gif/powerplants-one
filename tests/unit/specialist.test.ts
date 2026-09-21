import { validateInherited } from "../../src/estimating/specialist/context";
import type { DiscoveryRevision } from "../../src/estimating/discovery-workspace-context";
import assert from "node:assert/strict";
import { test } from "node:test";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import {
  initialProposal,
  definition,
} from "../../src/estimating/specialist/definition";
import {
  calculate,
  manualBasis,
  recoveredTorque,
} from "../../src/estimating/specialist/engine";
import { R } from "../../src/estimating/specialist/rational";
import { proposal, bounded } from "../../src/estimating/specialist/validation";
import {
  compare,
  comparePositions,
  requireResolved,
} from "../../src/estimating/specialist/compare";
import { fixtureProposal } from "../../src/estimating/specialist/fixture-policy";
import {
  extended,
  calculate as money,
  type CostLine,
} from "../../src/estimating/math";
const p = () => initialProposal();
test("ES08-T07/T16/T18/T21 source inventories retain exact identities", () => {
  assert.equal(definition.fields.length, 64);
  assert.equal(definition.lines.length, 143);
  assert.equal(definition.catalogue.parts.length, 101);
  assert.equal(definition.manual_rows.length, 14);
  assert.equal(definition.gates.length, 6);
  assert.equal(
    definition.catalogue.parameters.filter((p) => p.bound).length,
    8,
  );
});
test("ES08-T76 independent rational geometry and cloth literals", () => {
  const c = calculate(p());
  assert.equal(c.state, "Current");
  const expected = JSON.parse(
    readFileSync(
      new URL("../fixtures/es08-golden-r01.json", import.meta.url),
      "utf8",
    ),
  ).geometry as Record<string, string>;
  for (const [k, v] of Object.entries(expected))
    assert.equal(c.facts.find((f) => f.key === k)?.value.display, v, k);
  assert.equal(c.torque?.display, "100");
});
test("ES08-T10/T77 additional cut rounds before overhang; exact torque boundaries", () => {
  const s = p();
  s.inputs.shrink.raw = "10";
  s.extra_screens[0] = {
    ...s.extra_screens[0],
    count: "1",
    length: "1",
    overhang: "0.02",
    width: "2",
  };
  assert.equal(
    calculate(s).positions.find((l) => l.row === 227)?.quantity?.display,
    "2.48",
  );
  for (const [family, bands] of [
    [
      "Cable",
      [
        [600, 100, 300],
        [1800, 300, 400],
        [2400, 400, 800],
        [5800, 800, null],
      ],
    ],
    [
      "Pinion",
      [
        [1800, 100, 300],
        [5900, 300, 400],
        [7000, 400, 800],
      ],
    ],
  ] as const) {
    for (const [at, below, above] of bands) {
      assert.equal(
        recoveredTorque(R(at).sub("0.000001"), family)?.display() ?? null,
        below === null ? null : String(below),
      );
      assert.equal(
        recoveredTorque(at, family)?.display() ?? null,
        above === null ? null : String(above),
      );
      assert.equal(
        recoveredTorque(R(at).add("0.000001"), family)?.display() ?? null,
        above === null ? null : String(above),
      );
    }
  }
  assert.equal(recoveredTorque(500, "Cable", 123)?.display(), "123");
  assert.equal(recoveredTorque(500, "Pinion", 123)?.display(), "100");
});
test("ES08-T09/T15/T61 raw incomplete drafts persist structurally but invalid calculation has no numeric outputs", () => {
  for (const [field, value] of [
    ["span", ""],
    ["span", "-"],
    ["span", "1."],
    ["diameter", ""],
    ["fx", "0"],
    ["bay", "4.9"],
    ["bay", "5.1"],
    ["bay", "5.3"],
    ["bay", "2.1"],
    ["bay", "6"],
    ["across", "0"],
    ["shrink", "100"],
  ]) {
    const s = p();
    s.inputs[field].raw = value;
    assert.doesNotThrow(() => proposal(s));
    const c = calculate(s);
    assert.equal(c.state, "Invalid", `${field}=${value}`);
    assert.equal(c.positions.length, 0);
  }
  const s = p();
  s.inputs.bay.raw = "4.00";
  assert.equal(calculate(s).state, "Current");
});
test("ES08-T19/T21 all noncommercial parameter changes invalidate manual review; dormant parameters gain no consumer", () => {
  const s = p();
  for (const m of Object.values(s.manual_quantities)) {
    m.value = "0";
    m.basis_hash = manualBasis(s);
  }
  const before = calculate(s);
  assert.equal(before.manual_review_required.length, 0);
  s.parameters.drum_spare_factor.raw = "1.08";
  const after = calculate(s);
  assert.equal(after.manual_review_required.length, 14);
  assert.deepEqual(
    after.positions.map((l) => l.quantity),
    before.positions.map((l) => l.quantity),
  );
});
test("ES08-T23/T24 blank required rates withhold total and exact native amount rounds half-up", () => {
  const c = calculate(p());
  assert.equal(c.commercial.complete, false);
  assert.equal(c.commercial.total, null);
  assert.equal(extended("1.005", "1.00"), 101n);
  assert.equal(extended("1.005", "2.00"), 201n);
  assert.equal(R("1.0004").exact(3), null);
});
test("ES08-T29/T63/T68 independent comparison preserves deletion and incompatible identities", () => {
  const b = [{ key: "X", value: { sku: "A", quantity: 10 } }],
    c = [{ key: "X", value: { sku: "A", quantity: 12 } }],
    n = [{ key: "X", value: { sku: "A", quantity: 11 } }];
  let rows = compare(b, c, n, []);
  assert.equal(rows[0].kind, "Manual edit");
  assert.throws(() => requireResolved(rows));
  rows = compare(b, c, n, [
    { key: "X", choice: "keep", reason: "Keep reviewed manual quantity" },
  ]);
  assert.equal(rows[0].resolved?.quantity, 12);
  rows = compare(b, [], n, []);
  assert.equal(rows[0].kind, "Deleted");
  assert.equal(rows[0].required, true);
  assert.equal(
    compare(b, [], n, [
      { key: "X", choice: "omit", reason: "Deliberate deletion" },
    ])[0].resolved,
    null,
  );
  assert.equal(
    compare(
      b,
      c,
      [{ key: "X", value: { sku: "B", quantity: 11 } }],
      [],
      (a, b) => a.sku === b.sku,
    )[0].kind,
    "Incompatible",
  );
});
test("ES08-T53/T79 strict draft/depth/key/byte limits", () => {
  assert.throws(() => proposal({ ...p(), approved: true }));
  assert.throws(() => proposal(JSON.parse('{"__proto__":{}}')));
  let nested: unknown = {};
  for (let i = 0; i < 12; i++) nested = { next: nested };
  assert.throws(() => bounded(nested));
  assert.throws(() => bounded({ text: "é".repeat(140000) }));
  const s = p();
  s.inputs.span.raw = "x".repeat(301);
  assert.throws(() => proposal(s));
});
test("ES08-T22 28 recovered scenarios with three declared exact-decimal corrections", () => {
  // Trusted checked-in design is a regression oracle only. Independent numeric tests above establish arithmetic expectations.
  const ctx = vm.createContext({});
  for (const f of ["r02/evidence.js", "r03/catalogue.js", "r03/model.js"])
    vm.runInContext(readFileSync(`docs/design/specialist/${f}`, "utf8"), ctx);
  type Legacy = {
    inputs: Record<string, string>;
    manual: Record<string, { value: string }>;
  };
  const legacy = ctx.SS2 as {
    seed: () => Legacy;
    calculate: (s: Legacy) => {
      lines: { row: number; rawQty: number | null }[];
    };
  };
  const scenarios: Record<string, string>[] = [
    {},
    { drive: "Cable" },
    { drive: "Cable", cableLocation: "End" },
    { bays: "13" },
    { wider: "Yes" },
    { odd: "Yes" },
    { individual: "Yes" },
    { leading: "Profile" },
    { leading: "Tube - Steel", span: "8" },
    { bed: "Truss Clip" },
    { crossClips: "Yes" },
    { replaceLS: "Yes" },
    { extraTeks: "Yes" },
    { endBeams: "Yes", braces: "Yes", chain: "Yes" },
    { delay: "Yes" },
    { motors: "Yes" },
    { freight: "Yes" },
    { seals: "Yes" },
    { edge: "Weights" },
    { edge: "Blackout" },
    { twine: "No" },
    { droppers: "Yes" },
    { spans: "7", across: "3" },
    { shrink: "5", overhang: "0.45" },
    { installation: "Yes" },
    { bay: "5", sheet: "6" },
    { wallPulleys: "Yes", drive: "Cable" },
    { discount: "0", tape: "Yes", tapeRolls: "3" },
  ];
  for (const scenario of scenarios) {
    const s = p(),
      old = legacy.seed();
    Object.assign(old.inputs, scenario);
    for (const [key, v] of Object.entries(scenario)) s.inputs[key].raw = v;
    for (const [row, m] of Object.entries(old.manual))
      s.manual_quantities[`CE-LINE-${row}`].value = m.value;
    const current = calculate(s),
      prior = legacy.calculate(old);
    assert.equal(current.state, "Current", JSON.stringify(scenario));
    assert.equal(current.positions.length, 143);
    for (const line of prior.lines) {
      const actual =
        current.positions.find((l) => l.row === line.row)?.quantity?.display ??
        null;
      const corrections: Record<string, [number, number]> = {
        "bed:247": [1171, 1172],
        "replaceLS:243": [154, 155],
        "extraTeks:277": [617, 619],
      };
      const correction = corrections[`${Object.keys(scenario)[0]}:${line.row}`];
      if (correction) {
        assert.equal(line.rawQty, correction[0]);
        assert.equal(Number(actual), correction[1]);
      } else
        assert.equal(
          actual === null ? null : Number(actual),
          line.rawQty,
          `${JSON.stringify(scenario)} row ${line.row}`,
        );
    }
  }
});

test("ES08-T09/T11/T12/T13/T14/T17 six exact lookups, wall geometry and separate drive identities retain unresolved parts", () => {
  for (const [bay, width] of [
    ["2", "2.2"],
    ["2.13", "2.35"],
    ["3", "3.25"],
    ["4", "4.3"],
    ["4.5", "4.7"],
    ["5", "5.3"],
  ]) {
    const s = p();
    s.inputs.bay.raw = bay;
    s.inputs.sheet.raw = "6";
    assert.equal(
      calculate(s).facts.find((x) => x.key === "clothWidth")?.value.display,
      width,
    );
  }
  const s = p(),
    base = calculate(s);
  s.inputs.wallSpans.raw = "2";
  const wall = calculate(s);
  assert.deepEqual(
    wall.facts.find((x) => x.key === "width"),
    base.facts.find((x) => x.key === "width"),
  );
  assert.notEqual(
    wall.facts.find((x) => x.key === "cloth")?.value.display,
    base.facts.find((x) => x.key === "cloth")?.value.display,
  );
  for (const pipe of ["25", "32", "50"]) {
    s.inputs.drive.raw = "Cable";
    s.inputs.pipeDiameter.raw = pipe;
    s.gates["B263"].include = true;
    const c = calculate(s);
    assert.equal(c.state, "Current");
    assert.equal(s.inputs.diameter.raw, "27");
    assert.equal(s.inputs.cableLocation.raw, "Central");
    assert.equal(
      c.positions.find((x) => x.row === 263)?.quantity?.display,
      pipe === "25" ? "14" : "28",
    );
    if (pipe === "32")
      assert.ok(c.diagnostics.some((x) => x.code === "UNTESTED"));
  }
  s.inputs.drive.raw = "Pinion";
  s.inputs.pipeDiameter.raw = "25";
  const pinion = calculate(s);
  assert.equal(
    pinion.positions.find((x) => x.row === 264)?.part_state,
    "Conflict",
  );
  assert.equal(
    pinion.positions.find((x) => x.row === 273)?.part_id,
    "PPO.PRF.002.PIN",
  );
  assert.equal(pinion.positions.find((x) => x.row === 273)?.quantity, null);
  s.extra_screens[4] = {
    ...s.extra_screens[4],
    count: "2",
    length: "10",
    width: "4",
  };
  assert.equal(
    calculate(s).facts.find((x) => x.key === "motorArea")?.value.display,
    pinion.facts.find((x) => x.key === "motorArea")?.value.display,
  );
  assert.ok(calculate(s).diagnostics.some((x) => x.code === "REV-09"));
});
test("ES08-T20/T23/T24 explicit zero/no-purchase/exclusion and recovered freight/FX policy stay separate", () => {
  const s = fixtureProposal(),
    base = calculate(s);
  assert.equal(base.commercial.complete, true);
  s.illustrative_prices.find(
    (x) => x.key === "CE-LINE-240",
  )!.price.no_purchase = true;
  assert.deepEqual(calculate(s).commercial, base.commercial);
  s.illustrative_prices.find((x) => x.key === "CE-LINE-240")!.price.sell = "0";
  assert.equal(calculate(s).commercial.complete, true);
  s.illustrative_prices.find((x) => x.key === "CE-LINE-240")!.price.sell = "";
  assert.equal(calculate(s).commercial.total, null);
  s.exclusions.push({
    key: "CE-LINE-240",
    excluded: true,
    reason: "SYN retained stock",
  });
  const excluded = calculate(s);
  assert.equal(
    excluded.positions.find((x) => x.row === 240)?.quantity?.display,
    "6",
  );
  assert.equal(
    excluded.positions.find((x) => x.row === 240)?.effective_quantity?.display,
    "0",
  );
  assert.equal(excluded.commercial.complete, true);
});
test("ES08-T21 eight bound consumers and four recorded-only parameters follow named rules", () => {
  const s = p();
  for (const [k, v] of Object.entries({
    drive: "Cable",
    replaceLS: "Yes",
    bed: "Truss Clip",
    extraTeks: "Yes",
    odd: "Yes",
    delay: "Yes",
    twine: "Yes",
    endBeams: "Yes",
  }))
    s.inputs[k].raw = v;
  const base = calculate(s),
    qty = (c: ReturnType<typeof calculate>, r: number) =>
      c.positions.find((x) => x.row === r)!.quantity!.display;
  for (const [key, value, rows] of [
    ["ls_wire_spacing_m", "0.5", [243, 247, 277]],
    ["crosswire_clip_spare", "30", [247]],
    ["delay_unit_interval_m", "25", [293]],
    ["baling_twine_factor", "2.4", [260]],
    ["end_beam_divisor", "4", [250]],
  ] as const) {
    const next = structuredClone(s);
    next.parameters[key].raw = value;
    const c = calculate(next);
    for (const row of rows) assert.notEqual(qty(c, row), qty(base, row), key);
  }
  for (const [key, value, fact] of [
    ["odd_bay_default_m", "5", "length"],
    ["drive_span_deduction_m", "1", "spacing"],
  ]) {
    const next = structuredClone(s);
    next.parameters[key].raw = value;
    assert.notEqual(
      calculate(next).facts.find((x) => x.key === fact)?.value.display,
      base.facts.find((x) => x.key === fact)?.value.display,
    );
  }
  for (const key of [
    "crosswire_waste_factor",
    "cloth_markup_divisor",
    "cloth_fx_uplift",
    "drum_spare_factor",
  ]) {
    const next = structuredClone(s);
    next.parameters[key].raw = "9";
    assert.deepEqual(
      calculate(next).positions.map((x) => x.quantity),
      base.positions.map((x) => x.quantity),
    );
  }
});
test("ES08-T62 normalised calculation hash separates formatting and raw/evidence provenance", () => {
  const s = fixtureProposal(),
    a = calculate(s);
  s.inputs.span.raw = "6.400";
  s.inputs.shrink.raw = "1.00";
  s.extra_screens[0].count = "0.000";
  s.manual_quantities["CE-LINE-273"].value = "0.00";
  assert.equal(calculate(s).calculation_input_hash, a.calculation_input_hash);
  assert.notEqual(manualBasis(s), a.manual_basis_hash);
  assert.equal(
    calculate(s).normalized_inputs.find((x) => x.key === "shrink")?.value,
    "0.01",
  );
});
test("ES08-T78 Appendix E independent receiving choices produce 17/32,16/30,5/8 without changing unrelated ID", () => {
  const x: CostLine = {
      id: "11111111-1111-4111-8111-111111111111",
      description: "SYN X",
      quantity: "10",
      unit: "each",
      unit_cost: "1.00",
      unit_sell: "2.00",
      category: "Product",
      allowance: false,
      source: "SYN authored Appendix E",
      effective_date: "2026-09-21",
    },
    unrelated: CostLine = {
      ...x,
      id: "22222222-2222-4222-8222-222222222222",
      description: "SYN unrelated",
      quantity: "1",
      unit_cost: "5.00",
      unit_sell: "8.00",
    };
  for (const [choice, present, cost, sell] of [
    ["keep", true, "17.00", "32.00"],
    ["generated", true, "16.00", "30.00"],
    ["omit", false, "5.00", "8.00"],
    ["restore", false, "16.00", "30.00"],
  ] as const) {
    const rows = compare(
        [{ key: "X", value: x }],
        present ? [{ key: "X", value: { ...x, quantity: "12" } }] : [],
        [{ key: "X", value: { ...x, quantity: "11" } }],
        [{ key: "X", choice, reason: "SYN explicit Appendix E choice" }],
      ),
      lines = [
        unrelated,
        ...rows.flatMap((r) => (r.resolved ? [r.resolved] : [])),
      ],
      result = money(lines);
    assert.equal(result.cost, cost);
    assert.equal(result.sell, sell);
    assert.strictEqual(lines[0], unrelated);
  }
});

test("ES08-T29 inactive-to-active is Added; deliberate removal of an active baseline is Deleted", () => {
  const base = calculate(fixtureProposal()).positions;
  const next = structuredClone(base);
  const dormant = next.find((p) => p.quantity?.numerator === "0" && !p.manual)!;
  dormant.quantity = dormant.effective_quantity = {
    numerator: "1",
    denominator: "1",
    display: "1",
  };
  const rows = comparePositions(base, base, next, []);
  assert.equal(rows.find((r) => r.key === dormant.key)?.kind, "Added");
  const active = base.find(
    (p) => p.effective_quantity && p.effective_quantity.numerator !== "0",
  )!;
  assert.equal(
    comparePositions(
      base,
      base.filter((p) => p.key !== active.key),
      base,
      [],
    ).find((r) => r.key === active.key)?.kind,
    "Deleted",
  );
});

test("ES08-T08 source attribution refuses climate Zones as matching screen spans", () => {
  const p = fixtureProposal();
  p.inputs.spans.raw = "6";
  p.inputs.spans.attribution = {
    kind: "inherited",
    source_field: "saved-zone-fact",
    note: "SYN deliberately incompatible unit",
  };
  const revision = {
    input: {
      configuration: {
        facts: [
          {
            id: "saved-zone-fact",
            field: "RequiredZones",
            unit: "Zones",
            value: 6,
          },
        ],
      },
    },
  } as unknown as DiscoveryRevision;
  assert.throws(() => validateInherited(p, revision), {
    code: "SpecialistSourceChanged",
  });
  p.inputs.spans.attribution = {
    kind: "entered",
    source_field: "saved-zone-fact",
    note: "SYN forged attribution",
  };
  assert.throws(() => validateInherited(p, revision), {
    code: "SpecialistSourceChanged",
  });
  p.inputs.spans.attribution.source_field = null;
  assert.doesNotThrow(() => validateInherited(p, revision));
});
