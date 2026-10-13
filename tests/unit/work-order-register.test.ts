import assert from "node:assert/strict";
import { test } from "node:test";
import {
  authorisationState,
  visitScopeReviewRequired,
  workOrderRegisterQuery,
} from "../../src/service/work-order-register-model";
test("authorised originals retain their outcome while a successor carries its own readiness", () => {
  assert.equal(authorisationState("Authorised", "a", "a", 2), "Authorised");
  assert.equal(authorisationState("Authorised", "b", "a", 0), "SuccessorDraft");
  assert.equal(authorisationState("Draft", null, null, 1), "ScopeNeeded");
  assert.equal(authorisationState("Draft", "a", null, 1), "Blocked");
  assert.equal(authorisationState("Draft", "a", null, 0), "ReadyToAuthorise");
});
test("visit review requires the exact current authorised revision and version", () => {
  const v = { scope_revision_id: "a", scope_version: 2 };
  assert.equal(visitScopeReviewRequired("a", "a", 2, v), false);
  for (const [current, authorised, version] of [
    ["a", null, 2],
    ["b", "a", 2],
    ["a", "a", 3],
    ["a", "a", undefined],
  ] as const)
    assert.equal(
      visitScopeReviewRequired(current, authorised, version, v),
      true,
    );
});
test("register queries reject malformed and unbounded inputs without interpreting search operators", () => {
  assert.equal(workOrderRegisterQuery({ q: "%_" }).q, "%_");
  for (const input of [
    { limit: 0 },
    { limit: 26 },
    { limit: "1e1" },
    { offset: Infinity },
    { offset: " " },
    { q: "x\u0000" },
    { unknown: 1 },
  ])
    assert.throws(() => workOrderRegisterQuery(input));
});
