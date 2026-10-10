import { test } from "node:test";
import assert from "node:assert/strict";
import { proofDiagnosticsAllowed, proofPath } from "../../src/platform/proof-diagnostics";

test("proof logging requires opt-in and the actual local synthetic non-production runtime", () => {
  const local = { PPO_PROOF_DIAGNOSTICS: "1", PPO_ENV: "local-synthetic", PPO_EXPOSURE: "loopback", PPO_IDENTITY: "synthetic", NODE_ENV: "test" };
  assert.equal(proofDiagnosticsAllowed(local), true);
  for (const key of Object.keys(local).filter(key => key !== "NODE_ENV"))
    assert.equal(proofDiagnosticsAllowed({ ...local, [key]: undefined }), false);
  for (const override of [{ NODE_ENV: "production" }, { PPO_ENV: "azure-demo" }, { PPO_EXPOSURE: "shared" }, { PPO_IDENTITY: "entra" }])
    assert.equal(proofDiagnosticsAllowed({ ...local, ...override }), false);
});

test("transport diagnostics retain asset paths but discard query, identity and arbitrary route data", () => {
  assert.equal(proofPath("/_next/static/chunks/%5Bturbopack%5D_client.js?token=PRIVATE"), "/_next/static/chunks/%5Bturbopack%5D_client.js");
  assert.equal(proofPath("/api/v1/render-jobs/10000000-0000-4000-8000-000000000001/retry?secret=PRIVATE"), "/api/v1/render-jobs/:id/retry");
  assert.equal(proofPath("/api/v1/customers/PRIVATE_NAME"), "/api/v1/customers/:other");
  assert.equal(proofPath("/api/v1/customers/" + "a".repeat(64)), "/api/v1/customers/:other");
  assert.equal(proofPath("/PRIVATE_NAME"), "/other");
  for (const path of ["/api/v1/local-session", "/api/v1/shell/context", "/api/v1/crm/directory"])
    assert.equal(proofPath(`${path}?token=PRIVATE`), path);
  assert.equal(proofPath("/api/v1/shell/PRIVATE_NAME"), "/api/v1/:other/:other");
});
