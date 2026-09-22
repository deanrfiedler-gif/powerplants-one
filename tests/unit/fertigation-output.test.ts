import test from "node:test";
import assert from "node:assert/strict";
import {
  blankScope,
  blankScenario,
} from "../../src/estimating/fertigation/definition";
import { calculate } from "../../src/estimating/fertigation/engine";
import {
  csvCell,
  nativeExport,
  reportHtml,
  reportModel,
  type OutputBasis,
} from "../../src/estimating/fertigation/output";
const basis: OutputBasis = {
  scope_id: "scope",
  reference: "SYN-PPO-FERT-test",
  revision_id: "revision",
  revision_number: 1,
  content_hash: "a".repeat(64),
  source_revision_id: "discovery",
  source_context_hash: "b".repeat(64),
  created_at: "2026-09-22T00:00:00.000Z",
  calculation_edition: "PPO-FERT-NATIVE-CALC-r01",
};
test("FN-T45 customer allowlist removes free text and internal evidence before JSON and HTML", () => {
  const scope = blankScope();
  scope.name = "PRIVATE_SCOPE_CANARY";
  scope.production_context.crop_description = "PRIVATE_CROP_CANARY";
  scope.services.power = "PRIVATE_POWER_CANARY";
  scope.evidence.push({
    id: "e",
    label: "PRIVATE_FILE_CANARY",
    kind: "document_reference",
    reference: "private-url",
    source_revision: "secret",
    sha256: null,
    captured_date: null,
    attribution: "PRIVATE_PERSON_CANARY",
    applicability: "internal",
    notes: "<script>alert(1)</script>",
  });
  const calc = calculate(scope);
  calc.connected_flow_m3h.reason = "PRIVATE_REASON_CANARY";
  const customer = reportModel(basis, scope, calc, "customer");
  for (const serialized of [JSON.stringify(customer), reportHtml(customer)])
    assert.doesNotMatch(serialized, /PRIVATE_|private-url|alert\(1\)|secret/);
  const internal = reportHtml(reportModel(basis, scope, calc, "internal"));
  assert.match(internal, /PRIVATE_FILE_CANARY/);
  assert.doesNotMatch(internal, /<script>/);
});
test("FN-T46 exact report generation is deterministic and does not mutate input", () => {
  const scope = blankScope(),
    calc = calculate(scope),
    before = JSON.stringify(scope);
  assert.equal(
    reportHtml(reportModel(basis, scope, calc, "customer")),
    reportHtml(reportModel(basis, scope, calc, "customer")),
  );
  assert.equal(JSON.stringify(scope), before);
  assert.match(
    reportHtml(reportModel(basis, scope, calc, "customer")),
    /unknown/,
  );
});
test("FN-T45/T47 reports identify selected scenario, phases and exact authenticated review without leaking labels or notes", () => {
  const scope = blankScope();
  scope.scenarios = [
    {
      ...blankScenario("scenario-1"),
      label: "PRIVATE_SCENARIO_CANARY",
      phase: "proposed",
      include_future: true,
    },
  ];
  scope.selected_scenario_id = "scenario-1";
  const context = {
    author_id: "authenticated-author",
    review: {
      id: "review-1",
      disposition: "Reviewed; unresolved",
      created_by: "authenticated-reviewer",
      created_at: "2026-09-22T00:00:00.000Z",
      basis_hash: "c".repeat(64),
      note: "PRIVATE_REVIEW_CANARY",
    },
  };
  const customer = reportModel(
    basis,
    scope,
    calculate(scope),
    "customer",
    context,
  );
  assert.equal(customer.operating_basis.selected_scenario, "Scenario 1");
  assert.equal(customer.operating_basis.phase, "proposed");
  assert.deepEqual(customer.operating_basis.included_phases, [
    "existing",
    "proposed",
    "future",
  ]);
  assert.equal(customer.authorship.review?.basis_hash, "c".repeat(64));
  for (const rendered of [JSON.stringify(customer), reportHtml(customer)]) {
    assert.doesNotMatch(rendered, /PRIVATE_/);
    assert.match(rendered, /authenticated-reviewer/);
    assert.match(rendered, /Reviewed; unresolved/);
  }
  assert.match(
    reportHtml(
      reportModel(basis, scope, calculate(scope), "internal", context),
    ),
    /PRIVATE_SCENARIO_CANARY/,
  );
});
test("FN-T44 native export declares unavailable bytes and reviews; CSV formulas and quotes escape", () => {
  const scope = blankScope();
  assert.equal(
    nativeExport(basis, scope, calculate(scope)).format,
    "PPO-FERT-NATIVE-EXPORT-r01",
  );
  assert.equal(csvCell(' =HYPERLINK("x")'), '"\' =HYPERLINK(""x"")"');
  assert.equal(csvCell('line\n"two"'), '"line\n""two"""');
  assert.equal(csvCell(0), '"0"');
});
