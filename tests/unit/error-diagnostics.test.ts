import assert from "node:assert/strict";
import { test } from "node:test";
import { unexpectedFailureCategory } from "../../src/platform/errors";

test("unexpected failure diagnostics distinguish bounded causes without copying sensitive error content", () => {
  const secret = "SYN private SQL, payload, connection string and session must not enter diagnostics";
  for (const [code, expected] of [
    ["53300", "DatabaseConnectionCapacity"],
    ["57014", "DatabaseQueryCancelled"],
    ["57P01", "DatabaseRestartOrShutdown"],
    ["57P02", "DatabaseRestartOrShutdown"],
    ["57P03", "DatabaseRestartOrShutdown"],
    ["40001", "DatabaseTransactionConflict"],
    ["40P01", "DatabaseTransactionConflict"],
    ["ECONNREFUSED", "ConnectionFailure"],
    ["ECONNRESET", "ConnectionFailure"],
    ["ETIMEDOUT", "ConnectionFailure"],
  ]) {
    assert.equal(unexpectedFailureCategory({ code, message: secret, detail: secret, stack: secret }), expected);
  }
  for (const error of [undefined, null, secret, new Error(secret), { code: secret }, { code: 53300 }, { code: "23505", detail: secret }]) {
    assert.equal(unexpectedFailureCategory(error), "UnexpectedFailure");
  }
  assert.equal(unexpectedFailureCategory(new Error("timeout exceeded when trying to connect")), "DatabasePoolWaitTimeout");
  assert.equal(unexpectedFailureCategory(new Error("Connection terminated due to connection timeout", { cause: new Error(secret) })), "DatabaseConnectTimeout");
  assert.equal(unexpectedFailureCategory(new Error(`timeout exceeded when trying to connect ${secret}`)), "UnexpectedFailure");
});
