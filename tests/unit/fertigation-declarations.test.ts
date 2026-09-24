import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import {
  previewImport,
  requireConfirmableImport,
} from "../../src/estimating/fertigation/interchange";
import { proposedPlacement } from "../../src/estimating/fertigation/import-placement";
import { calculate } from "../../src/estimating/fertigation/engine";
import { validateScope } from "../../src/estimating/fertigation/validation";
import {
  declarations,
  declaredCoverage,
} from "../../src/estimating/fertigation/declarations";
import type { Scope } from "../../src/estimating/fertigation/types";

// r02's own synthetic sample, imported with the proposed placements (ADR-0044).
function importedSample(): Scope {
  const raw = readFileSync(
    "tests/fixtures/fertigation-r02-sample-export.json",
    "utf8",
  );
  const preview = previewImport(raw, "7a1c3f4e-2b5d-4c6e-8f90-1a2b3c4d5e6f");
  return requireConfirmableImport(
    preview,
    preview.source_hash,
    preview.preview_hash,
    preview.losses.map((l) => ({
      path: l.path,
      disposition: proposedPlacement(l.path),
    })),
  );
}

/** Leaf paths whose values differ between two scopes. */
function changedPaths(a: unknown, b: unknown, path = ""): string[] {
  if (Object.is(a, b)) return [];
  if (
    a &&
    b &&
    typeof a === "object" &&
    typeof b === "object" &&
    Array.isArray(a) === Array.isArray(b)
  ) {
    const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
    return [...keys].flatMap((k) =>
      changedPaths(
        (a as Record<string, unknown>)[k],
        (b as Record<string, unknown>)[k],
        path ? `${path}.${k}` : k,
      ),
    );
  }
  return [path];
}

test("FN-T113 the declarations register accounts for every finding an imported r02 draft opens with, and offers edits only on a stated basis", () => {
  const scope = importedSample();
  const calc = calculate(scope);
  assert.equal(calc.findings.length, 28);
  const items = declarations(scope, calc);
  assert.equal(declaredCoverage(items), 28, "every finding is addressed");
  const ids = new Set(calc.findings.map((f) => f.id));
  for (const d of items) {
    assert.ok(
      d.findingIds.every((id) => ids.has(id)),
      d.id,
    );
    assert.ok(d.options.length > 0, d.id);
    assert.ok(d.facts.length > 0, `${d.id} states what the draft records`);
    for (const o of d.options)
      assert.equal(
        !!o.transform,
        !!o.basis,
        `${d.id}/${o.id}: an edit always states its basis`,
      );
  }
  assert.deepEqual(
    [...new Set(items.map((d) => d.id))],
    ["D-01", "D-02", "D-06", "D-07", "D-08", "D-09", "D-10", "D-11", "D-12"],
  );
  // Phases are the root cause of density, flow and timing findings here.
  const phase = items.find((d) => d.id === "D-02")!;
  assert.deepEqual(phase.codes.sort(), [
    "density_area_unknown",
    "flow_unknown",
    "phase_unknown",
    "timing_incomplete",
  ]);
  // Controller, bank and strategy facts need new information: no edit.
  for (const id of ["D-07", "D-08", "D-09", "D-10", "D-11"])
    assert.ok(
      items.find((d) => d.id === id)!.options.every((o) => !o.transform),
      id,
    );

  // The recorded phase edit changes phases only, each from a recorded value.
  const recorded = phase.options.find((o) => o.id === "recorded")!;
  assert.equal(recorded.basis, "recorded");
  const next = validateScope(recorded.transform!(scope));
  const changed = changedPaths(scope, next);
  assert.ok(changed.length > 0);
  assert.ok(
    changed.every((p) => /^(crop_groups|groups)\.\d+\.phase$/.test(p)),
    changed.join(", "),
  );
  for (const crop of next.crop_groups)
    assert.equal(
      crop.phase,
      next.areas.find((a) => a.id === crop.area_id)!.phase,
    );
  const g1 = next.groups.find((g) => g.label.startsWith("G1"))!;
  assert.equal(g1.phase, "unknown", "a mixed group is not given a phase");
  assert.equal(
    phase.options.find((o) => o.id === `group:${g1.id}`)?.basis,
    "declared",
  );
});

test("FN-T114 applying the offered declarations clears 16 of the 28 findings, exposes one storage review and changes no recorded value", () => {
  let scope = importedSample();
  let calc = calculate(scope);
  const applied: string[] = [];
  for (let i = 0; i < 20; i++) {
    const option = declarations(scope, calc)
      .flatMap((d) => d.options.map((o) => ({ d, o })))
      .find(({ d, o }) => o.transform && (d.id !== "D-12" || o.id === "pump"));
    if (!option) break;
    const next = validateScope(option.o.transform!(scope));
    for (const p of changedPaths(scope, next)) {
      const before = p
        .split(".")
        .reduce<unknown>(
          (v, k) => (v as Record<string, unknown> | null)?.[k],
          scope,
        );
      assert.ok(
        before === "unknown" ||
          before === null ||
          (p.endsWith(".source_id") && before === null),
        `${option.d.id}/${option.o.id} changed recorded ${p}`,
      );
    }
    applied.push(`${option.d.id}/${option.o.id}`);
    scope = next;
    calc = calculate(scope);
  }
  assert.deepEqual(applied, [
    "D-01/single-pass-drip",
    "D-02/recorded",
    `D-02/group:${scope.groups.find((g) => g.label.startsWith("G1"))!.id}`,
    "D-02/scenarios",
    "D-06/bind",
    "D-12/pump",
  ]);
  const codes = calc.findings.map((f) => f.id.split(":")[0]);
  const original = new Set(
    calculate(importedSample()).findings.map((f) => f.id),
  );
  const kept = calc.findings.filter((f) => original.has(f.id));
  assert.equal(kept.length, 12, "16 of the 28 original findings clear");
  assert.deepEqual(
    calc.findings
      .filter((f) => !original.has(f.id))
      .map((f) => f.id.split(":")[0]),
    ["storage_overflow"],
  );
  assert.ok(
    !codes.includes("head_flow_basis"),
    "losses entered at 28 m³/h now match the operating peak",
  );
  assert.equal(calc.pump_peak_m3h.value, 28);
  assert.ok(
    codes.includes("storage_overflow"),
    "binding the source exposes the engine's own storage review",
  );
  const left = declarations(scope, calc);
  assert.ok(
    left.every((d) => d.options.every((o) => !o.transform)),
    "what remains needs new information",
  );
});

test("FN-T115 no edit is offered where the draft records a conflicting value or more than one source", () => {
  const scope = importedSample();
  scope.areas[0].context.hydraulic_arrangement = "recirculating";
  const calc = calculate(scope);
  const process = declarations(scope, calc).find((d) => d.id === "D-01")!;
  assert.ok(process.options.every((o) => !o.transform));

  const split = importedSample();
  const second = {
    ...structuredClone(split.sources[0]),
    id: "0b7c2a61-6f0e-4a55-9d3c-2b1f5e7a9c10",
    label: "SYN bore",
  };
  split.sources.push(second);
  split.valves[0].source_id = null;
  split.masters.push({
    ...structuredClone(split.masters[0]),
    id: "5d2e8f14-3a7b-4c9d-8e61-7f0a2b3c4d5e",
    label: "SYN second mainline",
    source_id: second.id,
  });
  split.valves[0].master_id = split.masters[1].id;
  for (const c of split.crop_groups)
    c.phase = split.areas.find((a) => a.id === c.area_id)!.phase;
  for (const g of split.groups) g.phase = "proposed";
  for (const s of split.scenarios) s.phase = "proposed";
  const source = declarations(split, calculate(split)).find(
    (d) => d.id === "D-06",
  );
  assert.ok(source, "storage source is still undeclared");
  assert.ok(source.options.every((o) => !o.transform));
});
