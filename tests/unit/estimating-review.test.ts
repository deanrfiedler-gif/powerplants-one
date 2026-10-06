import assert from "node:assert/strict";
import { test } from "node:test";
import { randomUUID } from "node:crypto";
import { reviewBasis } from "../../src/estimating/review/model";
import {
  decideInput,
  submitInput,
} from "../../src/estimating/review/validation";
import type { EstimateVersion } from "../../src/estimating/context";
import { manualLines } from "../helpers/estimating";
import { crmBase } from "../helpers/crm";
test("ES04 applicable facts distinguish scope, prices, quantities and source observations", () => {
  const v = {
    title: "Synthetic",
    scope: { included: "A", excluded: "B", assumptions: "C" },
    lines: manualLines(),
    policy: "SYN-EST-ARITHMETIC-01",
    content_hash: "a".repeat(64),
  } as EstimateVersion;
  const basis = (
    x = v,
    heads: { id: string; version: number; revision_id: string }[] = [],
  ) => reviewBasis(x, [], heads, [], null).fingerprints;
  const original = basis(),
    cost = basis({
      ...v,
      lines: v.lines.map((l) => ({
        ...l,
        unit_cost: "100.00",
        unit_sell: "200.00",
      })),
    });
  assert.equal(original.Completeness, cost.Completeness);
  assert.equal(original.Technical, cost.Technical);
  assert.notEqual(original.SourcePrice, cost.SourcePrice);
  const scope = basis({
    ...v,
    scope: { ...v.scope, included: "Changed scope" },
  });
  assert.notEqual(original.Completeness, scope.Completeness);
  assert.notEqual(original.Technical, scope.Technical);
  assert.equal(original.SourcePrice, scope.SourcePrice);
  const quantity = basis({
    ...v,
    lines: v.lines.map((l) => ({ ...l, quantity: "3" })),
  });
  assert.equal(original.Completeness, quantity.Completeness);
  assert.notEqual(original.Technical, quantity.Technical);
  assert.notEqual(original.SourcePrice, quantity.SourcePrice);
  const source = basis(v, [
    { id: randomUUID(), version: 2, revision_id: randomUUID() },
  ]);
  assert.equal(original.Technical, source.Technical);
  assert.notEqual(original.SourcePrice, source.SourcePrice);
  assert.deepEqual(
    original,
    basis({
      ...v,
      id: randomUUID(),
      scope_revision_id: randomUUID(),
      lines: [...v.lines].reverse(),
    }),
  );
});
test("ES04 rejects invented commercial outcomes, missing return findings and altered envelopes", () => {
  const id = randomUUID(),
    decision = {
      ...crmBase(),
      submission_id: randomUUID(),
      kind: "Completeness",
      outcome: "Reviewed",
      expected_version: 1,
      expected_review_version: 1,
      findings: [],
    };
  assert.equal(decideInput(id, decision).outcome, "Reviewed");
  for (const patch of [
    { outcome: "Approved" },
    { kind: "Commercial" },
    { outcome: "Returned" },
    { schema_version: 2 },
    { threshold: 10 },
    { expected_review_version: -1 },
  ])
    assert.throws(() => decideInput(id, { ...decision, ...patch }));
  const submission = {
    ...crmBase(),
    estimate_version_id: randomUUID(),
    basis_hash: "a".repeat(64),
    expected_version: 1,
    expected_review_version: 0,
    responses: [],
  };
  assert.equal(submitInput(id, submission).basis_hash, submission.basis_hash);
  for (const basis_hash of [undefined, "", "a", "A".repeat(64)])
    assert.throws(() => submitInput(id, { ...submission, basis_hash }));
  assert.throws(() =>
    submitInput(id, {
      ...crmBase(),
      estimate_version_id: randomUUID(),
      basis_hash: "a".repeat(64),
      expected_version: 1,
      expected_review_version: 0,
      responses: [{ finding_id: randomUUID(), response: "" }],
    }),
  );
});
