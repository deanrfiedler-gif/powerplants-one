import assert from "node:assert/strict";
import { test } from "node:test";
import { randomUUID, createHash } from "node:crypto";
import { assess } from "../../src/estimating/nursery-automation/assessment-engine";
import { parseAssessment } from "../../src/estimating/nursery-automation/assessment-validation";
import { assessmentOutputs } from "../../src/estimating/nursery-automation/assessment-output";
import { blankFact } from "../../src/estimating/nursery-automation/model";
import {
  assessmentCase,
  documented,
  na,
} from "../helpers/nursery-assessment-case";
test("N2 independently specified sequential capacity, shifts, buffer and unrounded target", () => {
  const f = assessmentCase(),
    r = assess(f.source, parseAssessment(f.input));
  assert.equal(r.technical_state, "ChecksSatisfied");
  assert.equal(r.scenarios[0].line_rate?.numerator, "2400");
  assert.equal(r.scenarios[0].running_minutes?.numerator, "360");
  assert.equal(r.scenarios[0].good_output?.numerator, "13680");
  assert.equal(r.buffers[0].minutes?.numerator, "6");
  assert.equal(r.scenarios[0].target_state, "MeetsTarget");
  f.scenario.facts.target_good_pots = documented("14000");
  assert.equal(assess(f.source, f.input).technical_state, "NotSuitable");
  f.scenario.facts.target_good_pots = documented("13680.001");
  assert.equal(
    assess(f.source, f.input).scenarios[0].target_state,
    "Shortfall",
  );
});
test("N2 trays require exact positive occupancy; net good is not discounted twice", () => {
  const f = assessmentCase(),
    c = f.input.scenarios[0].stages[2];
  c.rate = documented("300");
  c.rate_unit = "TraysPerHour";
  c.occupancy = documented("12");
  assert.equal(
    assess(f.source, f.input).scenarios[0].rates[2].normalized?.numerator,
    "3600",
  );
  for (const value of [blankFact(), documented("0")]) {
    c.occupancy = value;
    assert.equal(assess(f.source, f.input).scenarios[0].line_rate, null);
  }
  c.occupancy = documented("12");
  f.input.scenarios[0].stages.forEach((c) => (c.rate_basis = "NetGood"));
  assert.equal(
    assess(f.source, f.input).scenarios[0].good_output?.numerator,
    "14400",
  );
  f.input.scenarios[0].stages[0].rate_basis = "Gross";
  assert.equal(
    assess(f.source, f.input).scenarios[0].capacity_state,
    "NotAssessable",
  );
});
test("N2 known lower/upper failures survive unknown opposite bound; boundaries are explicit", () => {
  for (const dimension of [
    "diameter_mm",
    "height_mm",
    "filled_mass_kg",
  ] as const) {
    const f = assessmentCase(),
      l = f.input.scenarios[0].stages[2].limits.find(
        (l) => l.dimension === dimension,
      )!;
    l.minimum = documented("150");
    l.maximum = blankFact();
    assert.equal(assess(f.source, f.input).technical_state, "NotSuitable");
    l.minimum = blankFact();
    l.maximum = documented("1");
    assert.equal(assess(f.source, f.input).technical_state, "NotSuitable");
  }
  const f = assessmentCase(),
    l = f.input.scenarios[0].stages[2].limits[0];
  l.minimum = documented("100");
  assert.equal(assess(f.source, f.input).technical_state, "ChecksSatisfied");
  l.minimum_inclusive = false;
  assert.equal(assess(f.source, f.input).technical_state, "NotSuitable");
  l.minimum = na();
  l.maximum = na();
  assert.equal(assess(f.source, f.input).technical_state, "ChecksSatisfied");
});
test("N2 unsupported topology, incomplete manual stages and assumed counts cannot confirm capacity", () => {
  for (const topology of [
    "Branched",
    "SharedOperators",
    "Recirculating",
    "Asynchronous",
  ] as const) {
    const f = assessmentCase();
    f.input.topology = topology;
    assert.equal(assess(f.source, f.input).scenarios[0].line_rate, null);
  }
  const f = assessmentCase();
  f.input.stages[0].technical_count.knowledge = "Assumed";
  assert.equal(
    assess(f.source, f.input).scenarios[0].target_state,
    "NotAssessable",
  );
  f.input.stages[0].disposition = "Manual";
  f.scenario.facts.staffing = blankFact();
  assert.equal(assess(f.source, f.input).scenarios[0].line_rate, null);
  f.scenario.facts.staffing = documented("2");
  f.input.scenarios[0].stages[0].rate = blankFact();
  assert.equal(assess(f.source, f.input).scenarios[0].line_rate, null);
});
test("N2 configuration, customer requirements and every mandatory interface remain independent", () => {
  const f = assessmentCase();
  f.input.stages[2].configuration_evidence.state = "Unknown";
  assert.equal(assess(f.source, f.input).technical_state, "NeedsConfirmation");
  f.input.stages[2].configuration_evidence.state = "Compatible";
  f.scenario.facts.media = blankFact();
  assert.equal(assess(f.source, f.input).scenarios[0].line_rate, null);
  f.input.connections[0].checks[0].state = "Incompatible";
  assert.equal(assess(f.source, f.input).technical_state, "NotSuitable");
});
test("N2 phase, time, quality and zero distinctions prevent false passes", () => {
  const f = assessmentCase();
  f.input.stages[2].phase = "Future";
  assert.equal(assess(f.source, f.input).scenarios[0].line_rate, null);
  f.input.stages[2].phase = "Both";
  f.scenario.facts.stops_minutes = documented("481");
  assert.equal(assess(f.source, f.input).scenarios[0].good_output, null);
  f.scenario.facts.stops_minutes = documented("60");
  f.input.scenarios[0].good_fraction = documented("0");
  assert.equal(
    assess(f.source, f.input).scenarios[0].good_output?.numerator,
    "0",
  );
  f.input.scenarios[0].good_fraction = documented("1");
  assert.equal(
    assess(f.source, f.input).scenarios[0].good_output?.numerator,
    "14400",
  );
  f.input.connections[0].downstream_demand_per_minute = documented("0");
  assert.equal(assess(f.source, f.input).buffers[0].state, "NotApplicable");
});
test("N2 quantities separate equipment, installation, spare, waste and reviewed pack conversion", () => {
  const f = assessmentCase(),
    s = f.input.stages[0];
  s.technical_count = documented("2");
  s.installation_count = documented("2");
  s.spare_count = documented("1");
  s.pack_size = documented("2");
  let q = assess(f.source, f.input).quantities[0];
  assert.equal(q.purchase_need?.numerator, "3");
  assert.equal(q.purchase_units?.numerator, "4");
  assert.equal(q.installation?.numerator, "2");
  for (const disposition of [
    "Retained",
    "Reused",
    "CustomerSupplied",
    "Stock",
  ] as const) {
    s.disposition = disposition;
    q = assess(f.source, f.input).quantities[0];
    assert.equal(q.purchase_units?.numerator, "0");
    assert.equal(q.installation?.numerator, "2");
  }
  s.disposition = "New";
  s.selection = "Offered";
  assert.equal(
    assess(f.source, f.input).quantities[0].purchase_units?.numerator,
    "0",
  );
});
test("N2 validation rejects unknown fields, duplicate/orphan identities and oversized or invalid precision", () => {
  const f = assessmentCase();
  assert.deepEqual(parseAssessment(f.input), f.input);
  assert.throws(() => parseAssessment({ ...f.input, price: "100" }));
  assert.throws(() =>
    parseAssessment({
      ...f.input,
      stages: [f.input.stages[0], f.input.stages[0]],
    }),
  );
  f.input.scenarios[0].good_fraction = documented("1.001");
  assert.throws(() => parseAssessment(f.input));
  f.input.scenarios[0].good_fraction = documented("0.95");
  f.input.scenarios[0].stages[0].stage_id = randomUUID();
  assert.throws(() => parseAssessment(f.input));
});
test("N2 outputs retain deterministic exact evidence, escaped data and separate internal actions", () => {
  const f = assessmentCase();
  f.input.name = "<script>alert(1)</script>";
  f.input.owner = "SYN INTERNAL OWNER";
  f.input.stages[0].configuration_evidence.state = "Unknown";
  const id = randomUUID(),
    src = { id: randomUUID(), content_hash: "a".repeat(64), study: f.source },
    r = assess(f.source, f.input);
  const out = assessmentOutputs(id, src, f.input, r);
  assert.deepEqual(out, assessmentOutputs(id, src, f.input, r));
  assert.ok(out.study.html.includes("&lt;script&gt;"));
  assert.ok(!out.study.html.includes("<script>"));
  assert.ok(!out.study.html.includes("SYN INTERNAL OWNER"));
  assert.ok(out.clarifications.html.includes("SYN INTERNAL OWNER"));
  assert.equal(
    out.study.hash,
    createHash("sha256").update(out.study.html).digest("hex"),
  );
});

test("N2 simultaneous manual staffing cannot hide shared operators", () => {
  const f = assessmentCase();
  f.input.stages[3].disposition = "Manual";
  f.input.stages[4].disposition = "Manual";
  f.scenario.facts.staffing = documented("1");
  assert.equal(assess(f.source, f.input).scenarios[0].line_rate, null);
  f.scenario.facts.staffing = documented("2");
  assert.equal(assess(f.source, f.input).technical_state, "ChecksSatisfied");
  f.input.scenarios[0].stages[3].operators = blankFact();
  assert.equal(assess(f.source, f.input).scenarios[0].line_rate, null);
});
