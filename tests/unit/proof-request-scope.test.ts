import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

const moduleUrl = new URL("../../src/platform/proof-diagnostics.ts", import.meta.url).href;
const script = `
import assert from 'node:assert/strict';
import { setTimeout } from 'node:timers/promises';
import { proofRequest, proofReadRequest, proofReadPhase, proofEvent } from ${JSON.stringify(moduleUrl)};
const raw = '/api/v1/reports/11111111-1111-4111-8111-111111111111?PRIVATE_CANARY';
const original = new Error('PRIVATE_CANARY');
await Promise.all([7,8].map(id => proofRequest({request_id:id,path:'/api/v1/reports/:id'}, () => proofReadRequest(raw, async () => {
  proofReadPhase('start-' + id);
  await setTimeout(id === 7 ? 5 : 1);
  proofReadPhase('end-' + id);
  if(id === 7) throw original;
  return id;
})).then(value => assert.equal(value,8), error => assert.equal(error,original))));
proofReadPhase('outside-scope');
proofEvent('done');
`;
const environment: NodeJS.ProcessEnv = {
  ...process.env, PPO_PROOF_DIAGNOSTICS: "1", PPO_ENV: "local-synthetic",
  PPO_EXPOSURE: "loopback", PPO_IDENTITY: "synthetic", NODE_ENV: "test",
};
const run = (directory: string, env = environment) => execFileSync(process.execPath,
  ["--import", import.meta.resolve("tsx"), "--input-type=module", "--eval", script],
  { cwd: directory, env, encoding: "utf8" });

test("diagnostic scopes preserve concurrent request identities, values and original rejections without retaining request data", async () => {
  const dir = await mkdtemp(join(tmpdir(), "ppo-proof-scope-"));
  try {
    run(dir);
    const logs = join(dir, "verification-evidence", "transport-diagnostics");
    const text = await readFile(join(logs, (await readdir(logs))[0]), "utf8");
    const events = text.trim().split("\n").map(line => JSON.parse(line));
    assert.equal(events.length, 5);
    for (const e of events.filter(e => e.event === "read-phase")) {
      assert.equal(e.request_id, Number(e.phase.at(-1)));
      assert.equal(e.path, "/api/v1/reports/:id");
      assert.ok(e.route_id > 0);
    }
    assert.ok(!text.includes("PRIVATE_CANARY"));
    assert.ok(!text.includes("11111111"));
    assert.ok(!text.includes("outside-scope"));
  } finally { await rm(dir, { recursive: true, force: true }); }
});

test("diagnostics remain disabled outside the opt-in synthetic boundary", async () => {
  const dir = await mkdtemp(join(tmpdir(), "ppo-proof-disabled-"));
  try {
    run(dir, { ...environment, PPO_PROOF_DIAGNOSTICS: "0" });
    run(dir, { ...environment, NODE_ENV: "production" });
    assert.deepEqual(await readdir(dir), []);
  } finally { await rm(dir, { recursive: true, force: true }); }
});

test("unwritable diagnostics preserve the business result and original rejection", async () => {
  const dir = await mkdtemp(join(tmpdir(), "ppo-proof-unavailable-"));
  try {
    await writeFile(join(dir, "verification-evidence"), "occupied");
    run(dir);
    assert.equal(await readFile(join(dir, "verification-evidence"), "utf8"), "occupied");
  } finally { await rm(dir, { recursive: true, force: true }); }
});
