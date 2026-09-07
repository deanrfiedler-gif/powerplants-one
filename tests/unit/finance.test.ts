import assert from "node:assert/strict";
import { test } from "node:test";
import { quantity, scaled, decimal } from "../../src/finance/validation";
import { fixture } from "../../src/finance/accounts";
test("P10 quantities preserve exact six-place decimal conservation without floating point", () => {
  assert.equal(decimal(scaled("0.100001") + scaled("0.200002")), "0.300003");
  assert.equal(quantity("90.000000"), "90");
  for (const v of [90, "1e3", "-1", "0.0000001", " 2", "NaN", null])
    assert.throws(() => quantity(v));
});
test("P10 independently specified account fixtures do not sum visible pages or net unapplied cash", () => {
  assert.equal(fixture("F-01").source_balance, "600.00");
  assert.equal(fixture("F-02").source_balance, "600.00");
  assert.equal(fixture("F-02").unapplied_cash, "200.00");
  assert.equal(fixture("F-03").source_balance, "1000.00");
  assert.equal(fixture("F-04").source_balance, null);
  assert.equal(fixture("Failed").source_balance, null);
});
