import { test } from "node:test";
import assert from "node:assert/strict";
import { proofPath } from "../../src/platform/proof-diagnostics";

test("transport diagnostics retain asset paths but discard query, identity and arbitrary route data", () => {
  assert.equal(proofPath("/_next/static/chunks/%5Bturbopack%5D_client.js?token=PRIVATE"), "/_next/static/chunks/%5Bturbopack%5D_client.js");
  assert.equal(proofPath("/api/v1/render-jobs/10000000-0000-4000-8000-000000000001/retry?secret=PRIVATE"), "/api/v1/render-jobs/:id/retry");
  assert.equal(proofPath("/api/v1/customers/PRIVATE_NAME"), "/api/v1/customers/:other");
  assert.equal(proofPath("/api/v1/customers/" + "a".repeat(64)), "/api/v1/customers/:other");
  assert.equal(proofPath("/PRIVATE_NAME"), "/other");
});
