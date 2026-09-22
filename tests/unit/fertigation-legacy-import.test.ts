import assert from "node:assert/strict";
import { test } from "node:test";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { legacyProject, legacyRecord } from "../helpers/fertigation-legacy";
import {
  previewImport,
  requireConfirmableImport,
} from "../../src/estimating/fertigation/interchange";
import { validateLegacyProject } from "../../src/estimating/fertigation/legacy-validation";
import { calculate } from "../../src/estimating/fertigation/engine";
import { nativeExport } from "../../src/estimating/fertigation/output";
import { legacyContract } from "../../src/estimating/fertigation/legacy-contract";
const id = (n: number) =>
  `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
function graph(schema: 1 | 2) {
  const p = legacyProject(schema);
  p.sources = [
    legacyRecord(
      "sources",
      {
        id: "source-1",
        name: "Source",
        phase: "Proposed",
        reliable_flow_m3h: 10,
      },
      schema,
    ),
  ];
  p.mainlines = [
    legacyRecord(
      "mainlines",
      {
        id: "master-1",
        name: "Master",
        phase: "Proposed",
        source_id: "source-1",
      },
      schema,
    ),
  ];
  p.valves = [
    legacyRecord(
      "valves",
      {
        id: "valve-1",
        name: "Measured zero",
        phase: "Proposed",
        mainline_id: "master-1",
        flow_basis: "Measured",
        measured_flow_m3h: 0,
      },
      schema,
    ),
    legacyRecord(
      "valves",
      {
        id: "valve-2",
        name: "Design flow",
        phase: "Proposed",
        mainline_id: "master-1",
        flow_basis: "Design allowance",
        design_flow_m3h: 2.5,
      },
      schema,
    ),
  ];
  return p;
}
test("FN-T40 fully mapped issued schema1/2 valve/master graphs explicitly confirm as unverified native drafts", () => {
  for (const schema of [1, 2] as const) {
    const source = graph(schema),
      raw = JSON.stringify(source),
      p = previewImport(raw, id(900));
    assert.equal(p.held, false, JSON.stringify(p.losses));
    const scope = requireConfirmableImport(p, p.source_hash, p.preview_hash);
    assert.equal(p.source_schema, `standalone_${schema}`);
    assert.equal(scope.valves.length, 2);
    assert.equal(scope.valves[0].measured_flow_m3h, 0);
    assert.equal(scope.valves[1].measured_flow_m3h, null);
    assert.equal(scope.valves[0].master_id, scope.masters[0].id);
    assert.equal(scope.masters[0].source_id, scope.sources[0].id);
    assert.equal(scope.valves[1].asset_id, null);
    assert.equal(calculate(scope).connected_flow_m3h.value, 2.5);
    assert.equal(p.provenance.original_revision, 3);
    assert.deepEqual(p.provenance.legacy_metadata?.capture_stage, "Discovery");
    assert.equal(p.provenance.legacy_metadata?.updated_at, source.updated_at);
    assert.equal(p.source_hash, createHash("sha256").update(raw).digest("hex"));
    assert.equal(p.provenance.historical_reviews, "none");
    assert.equal("review" in scope, false);
    assert.deepEqual(scope.production_context.tags, ["unknown"]);
  }
});
test("FN-T40 schema1 upgrade supplies only declared r02 defaults without altering source revision or provenance", () => {
  const p = graph(1),
    original = structuredClone(p),
    upgraded = validateLegacyProject(p);
  assert.deepEqual(p, original);
  assert.equal(upgraded.revision, 3);
  assert.equal(upgraded.schema_version, 1);
  assert.equal(upgraded.updated_at, p.updated_at);
  for (const [kind, c] of Object.entries(legacyContract)) {
    const rows = c.singleton ? [upgraded[kind]] : (upgraded[kind] as unknown[]);
    for (const value of rows)
      for (const [key, field] of Object.entries(c.fields))
        if (field.added_in_schema_2)
          assert.ok(Object.hasOwn(value as object, key));
  }
  const broken = graph(1);
  delete (broken.project as Record<string, unknown>).name;
  assert.throws(
    () => previewImport(JSON.stringify(broken), id(900)),
    /required issued/,
  );
});
test("FN-T41 issued legacy validation rejects missing/unknown fields, invalid options and malformed dates or whole counts", () => {
  for (const change of [
    (p: Record<string, unknown>) => {
      delete (p.valves as Record<string, unknown>[])[0].flow_basis;
    },
    (p: Record<string, unknown>) => {
      (p.project as Record<string, unknown>).unrecognised = "cannot drop";
    },
    (p: Record<string, unknown>) => {
      (p.valves as Record<string, unknown>[])[0].flow_basis = "Invented";
    },
    (p: Record<string, unknown>) => {
      p.water_samples = [
        legacyRecord("water_samples", {
          id: "sample-1",
          name: "Sample",
          sample_date: "2026-02-30",
        }),
      ];
    },
    (p: Record<string, unknown>) => {
      p.cohorts = [
        legacyRecord("cohorts", {
          id: "crop-1",
          name: "Crop",
          actual_containers: 1.5,
        }),
      ];
    },
  ]) {
    const p = graph(2);
    change(p);
    assert.throws(() => previewImport(JSON.stringify(p), id(900)));
  }
});
test("FN-T40/T43 actual history, blobs, orphan emitter facts, unknown stock function and unmapped paths stay held", () => {
  const changes = [
    (p: Record<string, unknown>) => {
      p.activity = [{ action: "Captured", date: "2026-09-22", revision: 3 }];
    },
    (p: Record<string, unknown>) => {
      p.evidence = [
        legacyRecord("evidence", {
          id: "e-1",
          name: "Original bytes",
          attachment: {
            name: "a.png",
            type: "image/png",
            size: 1,
            data: "data:image/png;base64,AA==",
          },
        }),
      ];
    },
    (p: Record<string, unknown>) => {
      p.cohorts = [
        legacyRecord("cohorts", {
          id: "c-1",
          name: "Unallocated",
          flow_method: "Independent drippers",
          emitters_per_container: 1,
          emitter_lph: 2,
        }),
      ];
    },
    (p: Record<string, unknown>) => {
      p.stocks = [
        legacyRecord("stocks", { id: "s-1", name: "Unknown function" }),
      ];
    },
    (p: Record<string, unknown>) => {
      p.groups = [
        legacyRecord("groups", {
          id: "g-1",
          name: "External water",
          other_path: "A bypass not yet declared",
        }),
      ];
    },
  ];
  for (const change of changes) {
    const p = graph(2);
    change(p);
    const preview = previewImport(JSON.stringify(p), id(900));
    assert.equal(preview.held, true);
    assert.ok(preview.losses.length);
    assert.throws(
      () =>
        requireConfirmableImport(
          preview,
          preview.source_hash,
          preview.preview_hash,
        ),
      /unmapped/,
    );
  }
});
test("FN-T43 legacy capture and measurement declarations survive native lineage without becoming evidence verification", () => {
  const p = graph(2);
  (p.blocks as Record<string, unknown>[])[0].area_basis = "Measured boundary";
  (p.blocks as Record<string, unknown>[])[0].evidence_status =
    "Customer advised";
  const imported = previewImport(JSON.stringify(p), id(900)),
    scope = imported.scope,
    calculation = calculate(scope);
  const exported = nativeExport(
    {
      scope_id: id(100),
      reference: "SYN-PPO-FRT-000001",
      revision_id: id(101),
      revision_number: 1,
      content_hash: "a".repeat(64),
      source_revision_id: id(102),
      source_context_hash: "b".repeat(64),
      created_at: "2026-09-22T00:00:00Z",
      calculation_edition: calculation.edition,
    },
    scope,
    calculation,
  );
  const raw = {
    ...exported,
    import_provenance: [
      {
        source_hash: imported.source_hash,
        source_schema: imported.source_schema,
        preview_hash: imported.preview_hash,
        provenance: imported.provenance,
        identity_map: imported.identity_map,
      },
    ],
  };
  const next = previewImport(JSON.stringify(raw), id(901));
  assert.equal(
    next.provenance.inherited_sources[0].legacy_metadata
      ?.area_measurement_bases["block-1"],
    "Measured boundary",
  );
  assert.equal(
    next.provenance.inherited_sources[0].legacy_metadata?.evidence_declarations[
      "block-1"
    ],
    "Customer advised",
  );
  assert.equal(next.scope.areas[0].evidence_ids.length, 0);
  assert.equal(imported.held, false);
  assert.equal(imported.scope.areas[0].area_m2, 20000);
  assert.equal(imported.scope.areas[0].entered_area_unit, "ha");
  assert.equal(imported.scope.areas[0].area_basis, "planted");
  assert.equal(next.scope.areas[0].area_m2, 20000);
  assert.equal(next.scope.areas[0].area_basis, "planted");
});

test("FN-T40/T43 legacy analogue ranges remain exact source declarations without collapsing incompatible physical signals", () => {
  const source = graph(2);
  source.controllers = [
    legacyRecord("controllers", {
      id: "controller-1",
      name: "SYN controller",
      family: "Compass",
    }),
  ];
  source.io = [
    legacyRecord("io", {
      id: "bank-1",
      name: "SYN bank",
      controller_id: "controller-1",
      bank_id: "AI-1",
      signal_type: "Analogue input 4–20 mA",
      voltage: "24 V supply",
      installed: 10,
      used: 0,
      reserved: 0,
      faulty: 0,
      required: 1,
    }),
  ];
  Object.assign((source.valves as Record<string, unknown>[])[0], {
    controller_id: "controller-1",
    io_bank_id: "bank-1",
    io_signal_type: "Analogue input 0–10 V",
    channel_demand: 1,
    control_address: "AI-1.1",
  });
  const original = JSON.stringify(source),
    imported = previewImport(original, id(920));
  assert.equal(imported.held, false, JSON.stringify(imported.losses));
  const scope = requireConfirmableImport(
    imported,
    imported.source_hash,
    imported.preview_hash,
  );
  assert.equal(scope.banks[0].signal, "unknown");
  assert.equal(scope.valves[0].control.signal, "unknown");
  assert.match(scope.banks[0].notes, /Analogue input 4–20 mA/);
  assert.match(scope.valves[0].control.basis, /Analogue input 0–10 V/);
  assert.equal(scope.banks[0].voltage, "24 V supply");
  assert.equal(scope.valves[0].control.additional_channels, 1);
  // Even after an explicit native phase assessment, the exact analogue ranges
  // have not become the same compatible physical signal category.
  scope.controllers[0].phase = "proposed";
  scope.banks[0].phase = "proposed";
  assert.equal(calculate(scope).io[0].spare.value, null);
  assert.match(
    imported.warnings.join(" "),
    /cannot distinguish 4–20 mA from 0–10 V/,
  );
  assert.equal(JSON.stringify(source), original);
});
test("FN-T40 strict legacy declaration is pinned to the untouched issued r02 source", () => {
  const bytes = readFileSync(
    "reference/ui/priva-fertigation-scoping-workbench-r02.html",
  );
  assert.equal(
    createHash("sha256").update(bytes).digest("hex"),
    "b51bf2cab7cb1af54e33a0ec739921c4ca1a08da918165d615ead347d6463ab9",
  );
  assert.equal(Object.keys(legacyContract).length, 25);
  assert.equal(
    Object.values(legacyContract).reduce(
      (n, c) => n + Object.keys(c.fields).length,
      0,
    ),
    493,
  );
});
