import assert from "node:assert/strict";
import { test } from "node:test";
import { localConfig } from "../../src/platform/config";

test("optional proof correlation is numeric and confined to private API responses", async () => {
  const origin = localConfig().origin;
  const enabled = process.env.PPO_PROOF_DIAGNOSTICS === "1";
  const first = await fetch(`${origin}/api/v1/local-session`, {
    headers: { "X-PPO-Proof-Request": "untrusted-client-label" },
  });
  assert.equal(first.status, 401);
  assert.match(first.headers.get("cache-control") ?? "", /no-store/);
  const id = first.headers.get("x-ppo-proof-request");
  if (enabled) assert.match(id ?? "", /^\d+$/);
  else assert.equal(id, null);
  const second = await fetch(`${origin}/api/v1/local-session`);
  if (enabled) assert.notEqual(second.headers.get("x-ppo-proof-request"), id);
  else assert.equal(second.headers.get("x-ppo-proof-request"), null);
  for (const path of [
    "/customers",
    "/brand/powerplants-logo-green-white.png",
  ]) {
    const response = await fetch(origin + path);
    assert.equal(response.status, 200);
    assert.equal(response.headers.get("x-ppo-proof-request"), null);
  }
  const refused = await fetch(`${origin}/api/v1/local-session`, {
    headers: { "X-PPO-Local-Gateway": "forged" },
  });
  assert.equal(refused.status, 403);
  assert.equal(refused.headers.get("x-ppo-proof-request"), null);
});
