import { test } from "node:test";
import assert from "node:assert/strict";
import { dependencyFailureCategory } from "../../src/platform/proof-diagnostics";

test("dependency diagnostics distinguish queue expiry, connection establishment and server query errors", () => {
  assert.equal(dependencyFailureCategory(new Error("timeout exceeded when trying to connect")), "pool-checkout-timeout");
  assert.equal(dependencyFailureCategory(new Error("Connection terminated due to connection timeout")), "connection-start-timeout");
  for (const [code, category] of [["ECONNREFUSED", "connection-refused"], ["57014", "query-cancelled"], ["53300", "connection-limit"], ["57P01", "database-shutdown"], ["40P01", "deadlock"], ["40001", "serialization-failure"]])
    assert.equal(dependencyFailureCategory(Object.assign(new Error("PRIVATE_CANARY"), { code })), category);
});

test("unrecognised and hostile errors cannot expose exception data or break diagnostics", () => {
  for (const value of [undefined, null, "PRIVATE_CANARY", new Error("PRIVATE_CANARY"), { code: "PRIVATE_CANARY" }, { message: "timeout exceeded when trying to connect PRIVATE_CANARY" }, { get message() { throw Error("PRIVATE_CANARY"); } }])
    assert.equal(dependencyFailureCategory(value), "unclassified");
});
