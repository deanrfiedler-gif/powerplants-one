import assert from "node:assert/strict";
import { test } from "node:test";
import { createHash } from "node:crypto";
import {
  blankScope,
  blankValve,
  blankMaster,
  blankArea,
  blankSource,
  blankCropGroup,
} from "../../src/estimating/fertigation/definition";
import { valveCsv } from "../../src/estimating/fertigation/output";
import {
  parseValveCsv,
  valveCsvHeaders,
} from "../../src/estimating/fertigation/valve-csv";
import {
  previewImport,
  requireConfirmableImport,
} from "../../src/estimating/fertigation/interchange";
const id = (n: number) =>
  `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
function fixture() {
  const scope = blankScope();
  scope.valves = [
    {
      ...blankValve(id(1)),
      label: 'Zero "measured"\nvalve',
      phase: "proposed",
      flow_basis: "measured",
      measured_flow_m3h: 0,
    },
    {
      ...blankValve(id(2)),
      label: "Unknown design",
      phase: "proposed",
      flow_basis: "design_allowance",
      design_flow_m3h: null,
    },
  ];
  return scope;
}
const serialize = (rows: string[][]) =>
  rows
    .map((row) =>
      row.map((cell) => `"${cell.replaceAll('"', '""')}"`).join(","),
    )
    .join("\r\n");
test("FN-T41/T44 declared valve CSV preview confirms a remapped incomplete draft, preserving unknown and zero", () => {
  const scope = fixture(),
    raw = valveCsv(scope),
    p = previewImport(raw, id(900));
  assert.equal(p.source_schema, "native_valves_csv_r01");
  assert.equal(p.held, false);
  assert.equal(p.source_hash, createHash("sha256").update(raw).digest("hex"));
  assert.equal(p.provenance.synthetic_origin, "unknown");
  assert.equal(p.provenance.original_project_id, null);
  const saved = requireConfirmableImport(p, p.source_hash, p.preview_hash);
  assert.notEqual(saved.valves[0].id, id(1));
  assert.equal(saved.valves[0].label, scope.valves[0].label);
  assert.equal(saved.valves[0].measured_flow_m3h, 0);
  assert.equal(saved.valves[1].design_flow_m3h, null);
  assert.equal(saved.valves[0].control.owner, "unknown");
  assert.ok(p.warnings.some((w) => w.includes("projection")));
});
test("FN-T40/T44 linked allocation CSV preserves graph references through unknown placeholders without canonical authority", () => {
  const s = fixture();
  s.masters = [blankMaster(id(3))];
  s.sources = [blankSource(id(4))];
  s.areas = [blankArea(id(5))];
  s.crop_groups = [blankCropGroup(id(6))];
  Object.assign(s.valves[0], {
    master_id: id(3),
    source_id: id(4),
    allocations: [
      {
        id: id(7),
        area_id: id(5),
        crop_group_id: id(6),
        container_count: 0,
        served_area_m2: null,
        flow_share_fraction: 0,
      },
      {
        id: id(8),
        area_id: id(5),
        crop_group_id: null,
        container_count: null,
        served_area_m2: 40,
        flow_share_fraction: 1,
      },
    ],
  });
  const p = previewImport(valveCsv(s), id(900)),
    v = p.scope.valves[0];
  assert.equal(p.held, false);
  assert.equal(p.scope.valves.length, 2);
  assert.equal(v.master_id, p.scope.masters[0].id);
  assert.equal(v.source_id, p.scope.sources[0].id);
  assert.equal(v.allocations[0].area_id, p.scope.areas[0].id);
  assert.equal(v.allocations[0].crop_group_id, p.scope.crop_groups[0].id);
  assert.equal(v.allocations[0].container_count, 0);
  assert.equal(p.scope.masters[0].phase, "unknown");
  assert.equal(p.scope.masters[0].source_id, null);
  assert.equal(p.scope.areas[0].facility_id, null);
  assert.equal(p.scope.crop_groups[0].area_id, null);
});
test("FN-T41 strict CSV rejects malformed quoting, missing/duplicate/unknown headers and row shape", () => {
  const good = parseValveCsv(valveCsv(fixture()));
  for (const raw of ['"unterminated', 'x"y,z', '"x"oops,z'])
    assert.throws(() => parseValveCsv(raw));
  for (const alter of [
    (r: string[][]) => r[0].pop(),
    (r: string[][]) => (r[0][0] = r[0][1]),
    (r: string[][]) => (r[0][0] = "unknown"),
    (r: string[][]) => r[1].pop(),
    (r: string[][]) => r.push([""]),
  ]) {
    const rows = structuredClone(good);
    alter(rows);
    assert.throws(() => previewImport(serialize(rows), id(900)));
  }
  assert.throws(
    () => previewImport(serialize([good[0]]), id(900)),
    /at least one/,
  );
});
test("FN-T41 repeated CSV physical valve conflicts, duplicate allocations and cross-type reuse are rejected", () => {
  const original = parseValveCsv(valveCsv(fixture())),
    col = (key: string) => original[0].indexOf(key);
  const allocationRow = () => {
    const r = [...original[1]];
    r[col("allocation_id")] = id(10);
    r[col("area_id")] = id(11);
    return r;
  };
  for (const rows of [
    [original[0], original[1], allocationRow()],
    [original[0], allocationRow(), allocationRow()],
    [original[0], allocationRow(), original[1]],
  ])
    assert.throws(() => previewImport(serialize(rows), id(900)));
  const conflict = [...allocationRow()];
  conflict[col("allocation_id")] = id(12);
  conflict[col("label")] = "Conflict";
  assert.throws(
    () =>
      previewImport(
        serialize([original[0], allocationRow(), conflict]),
        id(900),
      ),
    /disagree/,
  );
  const foreign = allocationRow();
  foreign[col("area_id")] = id(1);
  assert.throws(
    () => previewImport(serialize([original[0], foreign]), id(900)),
    /different record types/,
  );
});
test("FN-T41 CSV numeric coercion, enums, graph bounds and multibyte portable bounds are strict", () => {
  const original = parseValveCsv(valveCsv(fixture())),
    col = (key: string) => original[0].indexOf(key);
  for (const value of [
    " ",
    "0x10",
    "NaN",
    "Infinity",
    "-1",
    "1e999",
    "1000000000001",
  ]) {
    const r = structuredClone(original);
    r[1][col("measured_flow_m3h")] = value;
    assert.throws(() => previewImport(serialize(r), id(900)));
  }
  const r = structuredClone(original);
  r[1][col("phase")] = "Existing";
  assert.throws(() => previewImport(serialize(r), id(900)));
  assert.throws(() => parseValveCsv("é".repeat(4_194_305)), /bounded portable/);
});
test("FN-T42 CSV source changes and preview mutation cannot reuse confirmation", () => {
  const raw = valveCsv(fixture()),
    a = previewImport(raw, id(900)),
    b = previewImport(raw, id(901));
  assert.notDeepEqual(a.identity_map, b.identity_map);
  assert.throws(
    () => requireConfirmableImport(a, b.source_hash, b.preview_hash),
    /Regenerate/,
  );
  a.scope.valves[0].measured_flow_m3h = 100;
  assert.throws(
    () => requireConfirmableImport(a, a.source_hash, a.preview_hash),
    /has changed/,
  );
});
test("FN-T44 CSV spreadsheet escape prefixes are retained as literal source text; reordered headers and BOM are supported", () => {
  const s = fixture();
  s.valves[0].label = "=SUM(1,2)";
  const rows = parseValveCsv(valveCsv(s));
  assert.deepEqual(rows[0], [...valveCsvHeaders]);
  const reversed = rows.map((r) => [...r].reverse());
  const p = previewImport("\uFEFF" + serialize(reversed), id(900));
  assert.equal(p.scope.valves[0].label, "'=SUM(1,2)");
});
