import { test } from "node:test";
import assert from "node:assert/strict";
import { databasePoolLimits } from "../../src/platform/database";

test("database pool serves every declared concurrent load read without relaxing failure bounds", () => {
  const declaredUsers = 10;
  const databaseBackedStartupReads = 3;

  assert.equal(databasePoolLimits.max, 32);
  assert.ok(
    databasePoolLimits.max >= declaredUsers * databaseBackedStartupReads,
  );
  assert.equal(databasePoolLimits.connectionTimeoutMillis, 3000);
  assert.equal(databasePoolLimits.statement_timeout, 10000);
});
