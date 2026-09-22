import assert from "node:assert/strict";
import { test } from "node:test";
import { randomUUID } from "node:crypto";
import {
  blankCandidate,
  baseRecord,
} from "../../src/estimating/fertigation/definition";
import { calculate } from "../../src/estimating/fertigation/engine";
import { validateScope } from "../../src/estimating/fertigation/validation";
import { candidateConstraints } from "../../src/estimating/fertigation/candidate-constraints";
import { largeFertigationScope } from "../helpers/fertigation-large";
function fixture() {
  const p = largeFertigationScope(),
    candidate = blankCandidate(randomUUID(), "NutriOne"),
    recipeId = randomUUID(),
    stockId = randomUUID(),
    channelId = randomUUID();
  Object.assign(candidate, {
    minimum_m3h: 0,
    maximum_m3h: 20,
    minimum_pressure_bar: 0,
    maximum_pressure_bar: 5,
    proposed_pressure_bar: 2,
    pressure_boundary: "unit_inlet",
    phase: "proposed",
  });
  p.candidates = [candidate];
  p.recipes = [
    {
      ...baseRecord(recipeId, "SYN attributed recipe"),
      phase: "proposed",
      author: "SYN fixture",
      revision: "r01",
      ec_target_mscm: null,
      ph_target: null,
      ec_basis: "unknown",
      composition: "SYN fixture only",
      changeover: "",
    },
  ];
  p.stocks = [
    {
      ...baseRecord(stockId, "SYN stock"),
      phase: "proposed",
      recipe_id: recipeId,
      function: "nutrient",
      dose_l_m3: 5.6,
      usable_l: 100,
      concentration: "SYN hypothetical input",
      conditions: "",
    },
  ];
  p.channels = [
    {
      ...baseRecord(channelId, "SYN channel"),
      phase: "proposed",
      candidate_id: candidate.id,
      stock_id: stockId,
      minimum_lph: 0,
      maximum_lph: 50,
      conditions: "",
    },
  ];
  p.groups[0].recipe_id = recipeId;
  return { p: validateScope(p), candidateId: candidate.id };
}
test("FN-T30/T31 structured candidate trace preserves 56 versus hypothetical50 failure despite missing source evidence", () => {
  const { p, candidateId } = fixture(),
    calculation = calculate(p),
    before = JSON.stringify({ p, calculation }),
    first = candidateConstraints(p, calculation, candidateId, 100, 25)!;
  const row = first.rows.find((r) => r.id.startsWith("injection:"))!;
  assert.equal(row.required.value, 56);
  assert.equal(row.required.unit, "L/h");
  assert.equal(row.capability.maximum, 50);
  assert.equal(row.status, "outside_entered_limits");
  assert.equal(row.capability.claim, "User-entered; unverified");
  assert.equal(row.sources.length, 0);
  assert.match(row.next_action, /Q07-Q10/);
  assert.equal(first.summary, "outside_entered_limits");
  assert.equal(first.manufacturer_confirmation, "pending");
  assert.equal(JSON.stringify({ p, calculation }), before);
});
test("FN-T28/T30 exact pressure boundary, zero and constraint pagination retain meaning without supplier certification", () => {
  const { p, candidateId } = fixture();
  p.candidates[0].proposed_pressure_bar = 0;
  p.candidates[0].minimum_pressure_bar = 0;
  let calculation = calculate(p),
    page = candidateConstraints(p, calculation, candidateId, 100, 25)!;
  const pressure = page.rows.find((r) => r.id === "pressure")!;
  assert.equal(pressure.required.value, 0);
  assert.equal(pressure.status, "within_entered_check_confirmation_pending");
  p.candidates[0].pressure_boundary = "unknown";
  calculation = calculate(p);
  page = candidateConstraints(p, calculation, candidateId, 100, 25)!;
  assert.equal(
    page.rows.find((r) => r.id === "pressure")!.required.value,
    null,
  );
  assert.equal(
    page.rows.find((r) => r.id === "pressure")!.status,
    "not_assessable",
  );
  const start = candidateConstraints(p, calculation, candidateId, 0, 25)!;
  assert.equal(start.rows.length, 25);
  assert.ok(start.total > 100);
  assert.equal(
    candidateConstraints(p, calculation, candidateId, 25, 25)!.rows[0].id ===
      start.rows[0].id,
    false,
  );
  assert.equal(candidateConstraints(p, calculation, randomUUID()), null);
});
test("FN-T74 candidate capability sources preserve attribution and hash but never become confirmed", () => {
  const { p, candidateId } = fixture(),
    evidenceId = randomUUID();
  p.evidence = [
    {
      id: evidenceId,
      label: "SYN source",
      kind: "document_reference",
      reference: "SYN exact document reference",
      source_revision: "r02",
      sha256: "a".repeat(64),
      captured_date: "2026-09-22",
      attribution: "Unverified supplied author",
      applicability: "Exact hypothetical candidate only",
      notes: "",
    },
  ];
  p.candidates[0].capability_evidence_id = evidenceId;
  const page = candidateConstraints(p, calculate(p), candidateId)!;
  assert.equal(page.rows[0].sources[0].sha256, "a".repeat(64));
  assert.equal(
    page.rows[0].sources[0].attribution,
    "Unverified supplied author",
  );
  assert.equal(page.rows[0].status, "not_assessable");
  assert.equal(page.technical_review, "not_configured");
});

test("FN-T30 partial numeric duties stay not assessable while contradictory entered bounds remain failures", () => {
  const { p, candidateId } = fixture(),
    calculation = calculate(p);
  p.candidates[0].minimum_m3h = 10;
  Object.assign(calculation.group_flows[0].unit, {
    value: 1,
    state: "unknown",
    reason: "An incomplete group has a partial numeric subtotal.",
  });
  let row = candidateConstraints(p, calculation, candidateId)!.rows.find(
    (r) => r.id === `flow:${p.groups[0].id}`,
  )!;
  assert.equal(row.required.value, 1);
  assert.equal(row.required.state, "unknown");
  assert.equal(row.status, "not_assessable");
  p.candidates[0].minimum_m3h = 30;
  row = candidateConstraints(p, calculation, candidateId)!.rows.find(
    (r) => r.id === `flow:${p.groups[0].id}`,
  )!;
  assert.equal(row.status, "outside_entered_limits");
});
