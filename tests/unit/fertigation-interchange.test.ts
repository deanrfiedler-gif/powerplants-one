import assert from "node:assert/strict";
import { test } from "node:test";
import { createHash } from "node:crypto";
import {
  blankScope,
  blankArea,
  blankValve,
  blankMaster,
  blankSource,
  families,
} from "../../src/estimating/fertigation/definition";
import { calculate } from "../../src/estimating/fertigation/engine";
import { nativeExport } from "../../src/estimating/fertigation/output";
import { bounded, MAX_BYTES } from "../../src/estimating/fertigation/context";
import { PORTABLE_BYTES } from "../../src/estimating/fertigation/portable-limits";
import {
  legacyProject as legacy,
  legacyJson,
} from "../helpers/fertigation-legacy";
import { largeFertigationScope } from "../helpers/fertigation-large";
import {
  previewImport,
  requireConfirmableImport,
  parseImportJson,
} from "../../src/estimating/fertigation/interchange";

const id = (n: number) =>
  `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
test("FN-T44/T56 large native export imports within its portable envelope without enlarging the editable graph", () => {
  const scope = largeFertigationScope(),
    calculation = calculate(scope);
  const exported = nativeExport(
    {
      scope_id: id(800),
      reference: "SYN-PPO-FRT-000001",
      revision_id: id(801),
      revision_number: 1,
      content_hash: "a".repeat(64),
      source_revision_id: id(802),
      source_context_hash: "b".repeat(64),
      created_at: "2026-09-22T00:00:00.000Z",
      calculation_edition: calculation.edition,
    },
    scope,
    calculation,
  );
  const raw = JSON.stringify(exported, null, 2);
  assert.ok(Buffer.byteLength(JSON.stringify(scope)) < MAX_BYTES);
  assert.ok(Buffer.byteLength(raw) > MAX_BYTES);
  assert.ok(Buffer.byteLength(raw) < PORTABLE_BYTES);
  assert.doesNotThrow(() => bounded({ raw_json: raw }, PORTABLE_BYTES));
  assert.throws(
    () => bounded({ raw_json: raw }),
    (e) => JSON.stringify(e).includes("2 MiB"),
  );
  const preview = previewImport(raw, id(900));
  assert.equal(preview.held, false);
  const imported = requireConfirmableImport(
    preview,
    preview.source_hash,
    preview.preview_hash,
  );
  assert.equal(imported.areas.length, 100);
  assert.equal(imported.valves.length, 1000);
  assert.notEqual(imported.valves[0].id, scope.valves[0].id);
  assert.equal(imported.valves[0].master_id, imported.masters[0].id);
  assert.equal(calculate(imported).schedule.events.length, 300);
  exported.calculation.connected_flow_m3h.value = 999999;
  const untrusted = previewImport(JSON.stringify(exported), id(901));
  assert.equal("calculation" in untrusted.scope, false);
  assert.equal(calculate(untrusted.scope).connected_flow_m3h.value, 1000);
  for (const valve of scope.valves) valve.notes = "x".repeat(1200);
  assert.ok(Buffer.byteLength(JSON.stringify(scope)) > MAX_BYTES);
  assert.throws(
    () => previewImport(JSON.stringify(exported), id(902)),
    (e) => JSON.stringify(e).includes("snapshot exceeds 2 MiB"),
  );
  assert.throws(
    () => bounded({ raw_json: "x".repeat(PORTABLE_BYTES) }, PORTABLE_BYTES),
    (e) => JSON.stringify(e).includes("8 MiB"),
  );
});
function native() {
  const scope = blankScope();
  scope.name = "Import fixture";
  scope.areas = [
    {
      ...blankArea(id(1)),
      label: "Known area",
      facility_id: id(100),
      facility_version: 2,
    },
  ];
  scope.sources = [{ ...blankSource(id(2)), label: "Tank" }];
  scope.masters = [
    { ...blankMaster(id(3)), label: "Master", source_id: id(2) },
  ];
  scope.valves = [
    {
      ...blankValve(id(4)),
      label: "Valve",
      master_id: id(3),
      source_id: id(2),
      asset_id: id(101),
      notes: `Keep this literal identity text ${id(4)}`,
      allocations: [
        {
          id: id(5),
          area_id: id(1),
          crop_group_id: null,
          container_count: null,
          served_area_m2: 20,
          flow_share_fraction: 1,
        },
      ],
    },
  ];
  return JSON.stringify(
    nativeExport(
      {
        scope_id: id(800),
        reference: "SYN-PPO-FRT-000001",
        revision_id: id(801),
        revision_number: 2,
        content_hash: "a".repeat(64),
        source_revision_id: id(802),
        source_context_hash: "b".repeat(64),
        created_at: "2026-09-22T00:00:00.000Z",
        calculation_edition: calculate(scope).edition,
      },
      scope,
      calculate(scope),
    ),
  );
}
test("FN-T40/T44 native import remaps children and every relationship without changing literal text", () => {
  const result = previewImport(native(), id(900));
  assert.equal(result.held, false);
  assert.notEqual(result.scope.valves[0].id, id(4));
  assert.equal(result.scope.valves[0].master_id, result.scope.masters[0].id);
  assert.equal(
    result.scope.valves[0].allocations[0].area_id,
    result.scope.areas[0].id,
  );
  assert.equal(
    result.scope.valves[0].notes,
    `Keep this literal identity text ${id(4)}`,
  );
  assert.deepEqual(
    requireConfirmableImport(result, result.source_hash, result.preview_hash),
    result.scope,
  );
});
test("FN-T40 native source canonical IDs never become implicit authority", () => {
  const r = previewImport(native(), id(900));
  assert.equal(r.scope.areas[0].facility_id, null);
  assert.equal(r.scope.areas[0].facility_version, null);
  assert.equal(r.scope.valves[0].asset_id, null);
  assert.ok(r.warnings.some((s) => s.includes("mapping cleared")));
});
test("FN-T42 same namespace/source repeats exact mapping, independent imports get different identities", () => {
  const a = previewImport(native(), id(900)),
    b = previewImport(native(), id(900)),
    c = previewImport(native(), id(901));
  assert.equal(a.preview_hash, b.preview_hash);
  assert.deepEqual(a.identity_map, b.identity_map);
  assert.notDeepEqual(a.identity_map, c.identity_map);
});
test("FN-T42 stale or altered previews cannot confirm", () => {
  const r = previewImport(native(), id(900));
  assert.throws(
    () => requireConfirmableImport(r, "f".repeat(64), r.preview_hash),
    /Regenerate/,
  );
  r.scope.name = "Altered after preview";
  assert.throws(
    () => requireConfirmableImport(r, r.source_hash, r.preview_hash),
    /has changed/,
  );
});
test("FN-T41 duplicate JSON keys and hostile prototypes fail before last-wins parsing", () => {
  for (const raw of [
    '{"a":1,"a":2}',
    '{"x":{"same":0,"same":1}}',
    '{"__proto__":{}}',
    '{"constructor":{}}',
    '{"x":[{"prototype":1}]}',
  ])
    assert.throws(() => parseImportJson(raw));
});
test("FN-T41 malformed JSON, invalid numbers, depth and multibyte size are bounded", () => {
  for (const raw of [
    '{"x":1e10000}',
    '{"a":01}',
    '{"a":1,}',
    "[1,]",
    "true false",
    '"unterminated',
    "[".repeat(18) + "0" + "]".repeat(18),
  ])
    assert.throws(() => parseImportJson(raw));
  assert.throws(
    () => parseImportJson(JSON.stringify("界".repeat(3_000_000))),
    /8 MiB/,
  );
});
test("FN-T40/T66 schema1/2 legacy preview preserves area meaning, unknown context and original exact hash", () => {
  for (const schema of [1, 2] as const) {
    const original = legacyJson(legacy(schema)),
      r = previewImport(original, id(900));
    assert.equal(
      r.source_hash,
      createHash("sha256").update(original).digest("hex"),
    );
    assert.equal(r.source_schema, `standalone_${schema}`);
    assert.equal(r.scope.areas[0].area_m2, 20000);
    assert.deepEqual(r.scope.production_context.tags, ["unknown"]);
    assert.equal(r.scope.production_context.hydraulic_arrangement, "unknown");
    assert.equal(r.provenance.original_revision, 3);
    assert.equal(r.provenance.synthetic_origin, true);
  }
});
test("FN-T40 populated unmapped legacy fields remain held with explicit losses", () => {
  const p = legacy(2);
  (p.project as Record<string, unknown>).customer =
    "Unmapped customer declaration";
  const r = previewImport(legacyJson(p), id(900));
  assert.equal(r.held, true);
  assert.deepEqual(
    r.scope.candidates.map((c) => c.family),
    families,
  );
  assert.ok(r.losses.some((l) => l.path === "project.customer"));
  assert.throws(
    () => requireConfirmableImport(r, r.source_hash, r.preview_hash),
    /unmapped data/,
  );
});
test("FN-T43 imported local reviews remain original unverified provenance, never native signatures", () => {
  const p = legacy(1);
  p.review = {
    name: "Untrusted supplied reviewer",
    revision: 3,
    note: "Approved",
    role: "Engineer",
    date: "2026-09-22",
  };
  const r = previewImport(legacyJson(p), id(900));
  assert.equal(r.provenance.historical_reviews, "unverified_source_only");
  assert.equal(r.held, true);
  assert.equal("review" in r.scope, false);
});
test("FN-T41 duplicate legacy identities and broken relationships reject atomically", () => {
  const p = legacy(2);
  p.sources = [{ id: "block-1", name: "Duplicate" }];
  assert.throws(
    () => previewImport(legacyJson(p), id(900)),
    /duplicate legacy/,
  );
  const q = legacy(2);
  q.selected_scenario_id = "foreign";
  assert.throws(
    () => previewImport(legacyJson(q), id(900)),
    /invalid selected record/,
  );
});
test("FN-T43 missing legacy synthetic provenance cannot silently become ordinary data", () => {
  const p = legacy(2);
  delete p.synthetic;
  assert.throws(
    () => previewImport(legacyJson(p), id(900)),
    /complete declared portable/,
  );
});
test("FN-T44 native export calculations are untrusted and never admitted into scope", () => {
  const p = JSON.parse(native());
  p.calculation = { approved: true, flow: 1000 };
  const r = previewImport(JSON.stringify(p), id(900));
  assert.equal("calculation" in r.scope, false);
  assert.equal(calculate(r.scope).connected_flow_m3h.value, null);
});
test("FN-T38/T44 native attachment references explicitly hold preview until authorised byte reattachment", () => {
  const p = JSON.parse(native());
  p.scope.evidence = [
    {
      id: id(33),
      label: "Original PNG",
      kind: "document_reference",
      reference: `ppo-file:${id(34)}`,
      source_revision: "r01",
      sha256: "a".repeat(64),
      captured_date: null,
      attribution: "Synthetic",
      applicability: "Fixture",
      notes: "",
    },
  ];
  const r = previewImport(JSON.stringify(p), id(900));
  assert.equal(r.held, true);
  assert.ok(
    r.losses.some(
      (l) => l.path.endsWith(".reference") && l.reason.includes("Reattach"),
    ),
  );
  assert.throws(
    () => requireConfirmableImport(r, r.source_hash, r.preview_hash),
    /unmapped data/,
  );
});
test("FN-T40 richer r02 mapping preserves technical arrays and relationships without granting confirmation", () => {
  const p = legacy(2);
  p.sources = [
    {
      id: "source-1",
      name: "Source",
      phase: "Existing",
      reliable_flow_m3h: 20,
    },
  ];
  p.water_samples = [
    {
      id: "sample-1",
      name: "Sample",
      source_id: "source-1",
      sample_date: "2026-09-22",
      laboratory: "Synthetic laboratory",
      ph: 6.5,
      ec_mscm: 0.5,
      alkalinity: "20",
      alkalinity_unit: "mg/L as CaCO3",
    },
  ];
  p.pipes = [
    {
      id: "pipe-1",
      name: "Pipe",
      length_m: 100,
      internal_diameter_mm: 50,
      design_flow_m3h: 10,
    },
  ];
  p.filters = [
    {
      id: "filter-1",
      name: "Filter",
      type: "Disc filter",
      flow_path: "Pump discharge",
      capacity_m3h: 20,
    },
  ];
  p.recipes = [
    {
      id: "recipe-1",
      name: "Feed",
      author: "Synthetic adviser",
      revision: "r01",
      ec_basis: "Final delivered EC",
      ec_target_mscm: 1.5,
      ph_target: 6,
      composition: "Explicit source text; not inferred chemistry",
    },
  ];
  p.stocks = [
    {
      id: "stock-1",
      name: "Stock",
      recipe_id: "recipe-1",
      function: "Nutrient",
      dose_l_m3: 2,
      maximum_lph: 50,
    },
  ];
  p.controllers = [
    {
      id: "controller-1",
      name: "Controller",
      family: "Connext",
      model: "Synthetic",
      serial: "SYN-1",
      software: "test",
      licences: "unconfirmed",
    },
  ];
  p.io = [
    {
      id: "bank-1",
      name: "Bank",
      controller_id: "controller-1",
      bank_id: "bus-a/bank1",
      signal_type: "Digital output",
      voltage: "24 V AC",
      installed: 8,
      used: 0,
      reserved: 1,
      faulty: 0,
      required: 2,
    },
  ];
  p.sensors = [
    {
      id: "sensor-1",
      name: "Pressure",
      type: "Pressure",
      controller_id: "controller-1",
      io_bank_id: "bank-1",
      signal_type: "Analogue input 4–20 mA",
      channel_demand: 1,
      cohort_ids: [],
      sampling: "Source header",
    },
  ];
  p.strategies = [
    {
      id: "strategy-1",
      name: "Strategy requirement",
      trigger: "Manual",
      sensor_id: "sensor-1",
      group_ids: [],
      reset_period: "Operator review",
      fallback: "Unknown",
    },
  ];
  p.evidence = [
    {
      id: "evidence-1",
      name: "Recorded source",
      reference: "SUP-REF",
      date: "2026-09-22",
      author: "Synthetic supplier",
      related: "Pump",
      notes: "Not a confirmation",
    },
  ];
  p.hydraulics = {
    pump_model: "Synthetic pump",
    speed_rpm: 2900,
    static_head_m: -2,
    pipe_loss_m: 3,
    head_basis_flow_m3h: 10,
  };
  p.curve_points = [
    { q: 10, h: 20, power: 3 },
    { q: 20, h: 10, efficiency: 80 },
  ];
  const r = previewImport(legacyJson(p), id(900)),
    s = r.scope;
  assert.equal(s.water_samples[0].source_id, s.sources[0].id);
  assert.equal(s.water_samples[0].analytical_units, "mg/L as CaCO3");
  assert.equal(s.filters[0].path, "pump");
  assert.equal(s.pipes[0].internal_diameter_mm, 50);
  assert.equal(s.stocks[0].recipe_id, s.recipes[0].id);
  assert.equal(s.recipes[0].ec_basis, "final");
  assert.equal(s.banks[0].controller_id, s.controllers[0].id);
  assert.equal(s.sensors[0].control.bank_id, s.banks[0].id);
  assert.equal(s.strategies[0].sensor_id, s.sensors[0].id);
  assert.equal(s.hydraulics.static_head_m, -2);
  assert.equal(s.hydraulics.curve_points[0].power_kw, 3);
  assert.equal(s.hydraulics.curve_points[0].efficiency_percent, null);
  assert.equal(s.evidence[0].kind, "observation");
  assert.equal(s.channels.length, 0);
  assert.ok(r.losses.some((l) => l.path === "stocks.stock-1.maximum_lph"));
  assert.equal(r.held, true);
});
test("FN-T40 richer preview still refuses foreign technical references and retains unsupported field losses", () => {
  const p = legacy(2);
  p.water_samples = [{ id: "sample-1", name: "Sample", source_id: "foreign" }];
  assert.throws(() => previewImport(legacyJson(p), id(900)), /broken legacy/);
  const q = legacy(2);
  q.filters = [
    {
      id: "filter-1",
      name: "Filter",
      flow_path: "Pump discharge",
      backwash_pressure_bar: 3,
    },
  ];
  const r = previewImport(legacyJson(q), id(900));
  assert.ok(
    r.losses.some((l) => l.path === "filters.filter-1.backwash_pressure_bar"),
  );
  assert.equal(r.held, true);
});
test("FN-T43 native re-export retains declared synthetic import lineage without upgrading false to live", () => {
  for (const flag of [true, false, "unknown"] as const) {
    const prior = previewImport(legacyJson(legacy(2)), id(900)),
      p = JSON.parse(native());
    delete p.synthetic;
    p.import_provenance = [
      {
        revision_id: id(802),
        source_hash: prior.source_hash,
        source_schema: prior.source_schema,
        preview_hash: prior.preview_hash,
        provenance: { ...prior.provenance, synthetic_origin: flag },
        identity_map: prior.identity_map,
      },
    ];
    const r = previewImport(JSON.stringify(p), id(901));
    assert.equal(r.provenance.synthetic_origin, flag);
    assert.equal(
      r.provenance.inherited_sources[0].source_hash,
      prior.source_hash,
    );
    assert.ok(r.warnings.some((w) => w.includes("unverified external")));
  }
});
test("FN-T43 native exported synthetic truth survives roundtrip and cannot be cleared by false lineage", () => {
  const p = JSON.parse(native());
  assert.equal(p.synthetic, true);
  assert.equal(
    previewImport(JSON.stringify(p), id(901)).provenance.synthetic_origin,
    true,
  );
  const prior = previewImport(legacyJson(legacy(2)), id(900));
  p.import_provenance = [
    {
      source_hash: prior.source_hash,
      source_schema: prior.source_schema,
      preview_hash: prior.preview_hash,
      provenance: { ...prior.provenance, synthetic_origin: false },
      identity_map: prior.identity_map,
    },
  ];
  assert.equal(
    previewImport(JSON.stringify(p), id(901)).provenance.synthetic_origin,
    true,
  );
  delete p.import_provenance;
  p.synthetic = false;
  const external = previewImport(JSON.stringify(p), id(901));
  assert.equal(external.provenance.synthetic_origin, false);
  assert.ok(external.warnings.some((w) => w.includes("unverified external")));
  p.synthetic = "false";
  assert.throws(
    () => previewImport(JSON.stringify(p), id(901)),
    /explicit boolean/,
  );
});
