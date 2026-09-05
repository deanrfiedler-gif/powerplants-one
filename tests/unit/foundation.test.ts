import assert from "node:assert/strict";
import { test } from "node:test";
import { randomUUID } from "node:crypto";
import { spawnSync } from "node:child_process";
import { localConfig } from "../../src/platform/config";
import { draftCommand } from "../../src/service/tickets";
import {
  SyntheticErpReadAdapter,
  SyntheticErpCommandAdapter,
  SyntheticDocumentStoreAdapter,
  SyntheticDistributionAdapter,
} from "../../src/adapters/synthetic";
const env = {
  PPO_ENV: "local-synthetic",
  PPO_EXPOSURE: "loopback",
  PPO_IDENTITY: "synthetic",
  DATABASE_URL:
    "postgresql://synthetic:placeholder@127.0.0.1:5432/ppo_synthetic_test",
};
test("launcher exits before serving in production, remote or shared configurations", () => {
  const cases: Record<string, string>[] = [
    { NODE_ENV: "production" },
    { PPO_ENV: "remote-synthetic" },
    { PPO_EXPOSURE: "shared" },
  ];
  for (const blocked of cases) {
    const result = spawnSync(
      process.execPath,
      ["--import", "tsx", "scripts/local-server.ts"],
      {
        env: {
          ...process.env,
          ...env,
          ...blocked,
          NEXT_TELEMETRY_DISABLED: "1",
        },
        encoding: "utf8",
        timeout: 5000,
      },
    );
    assert.equal(result.error, undefined);
    assert.equal(result.status, 1);
    assert.match(
      result.stderr,
      /Synthetic identity requires an explicitly local/,
    );
    assert.doesNotMatch(result.stdout, /local synthetic only/);
  }
});
test("synthetic configuration rejects production, missing, remote and shared settings", () => {
  assert.equal(localConfig(env).origin, "http://127.0.0.1:3000");
  for (const replacement of [
    { NODE_ENV: "production" },
    { PPO_ENV: "remote-synthetic" },
    { PPO_ENV: undefined },
    { PPO_EXPOSURE: "shared" },
    { PPO_EXPOSURE: "0.0.0.0" },
    { PPO_IDENTITY: "real" },
    { VERCEL: "1" },
    { CONTAINER_APP_NAME: "remote" },
    { PPO_PORT: "80" },
  ])
    assert.throws(() => localConfig({ ...env, ...replacement }));
  for (const url of [
    "postgresql://x:y@db.example/ppo_synthetic",
    "postgresql://x:y@127.0.0.1/live",
    "postgresql://x:y@127.0.0.1/ppo_synthetic?host=db.example",
    "postgresql://x:y@localhost/ppo_synthetic",
    "postgresql://127.0.0.1/ppo_synthetic",
  ])
    assert.throws(() => localConfig({ ...env, DATABASE_URL: url }));
});
test("draft schema rejects forged authority, unlisted fields, unsafe versions and malformed input", () => {
  const valid = {
    operation_id: randomUUID(),
    expected_version: 1,
    schema_version: 1,
    summary: "  Synthetic inspection  ",
    reason: "Clarify the draft",
  };
  assert.equal(draftCommand(valid).summary, "Synthetic inspection");
  for (const replacement of [
    { actor_id: randomUUID() },
    { role: "Coordinator" },
    { workspace_id: randomUUID() },
    { status: "Authorised" },
    { expected_version: 0 },
    { expected_version: "1" },
    { schema_version: 2 },
    { operation_id: "fake" },
    { summary: "   " },
    { summary: "New\nline" },
    { reason: "" },
    { summary: "x".repeat(201) },
  ])
    assert.throws(() => draftCommand({ ...valid, ...replacement }));
  for (const input of [null, [], true, "text"])
    assert.throws(() => draftCommand(input));
});
test("adapter stubs retain source identity and never claim live or durable outcomes", async () => {
  const context = {
    workspace_id: randomUUID(),
    actor_id: randomUUID(),
    operation_id: randomUUID(),
  };
  const key = {
    provider: "Synthetic" as const,
    erp_connection_id: "PPO-SIM",
    erp_company_id: "SYN-B",
    entity_type: "Account",
    external_id: "000Ab-09",
  };
  const observation = await new SyntheticErpReadAdapter().read(context, key);
  assert.deepEqual(observation.key, key);
  assert.equal(observation.completeness, "Unknown");
  assert.deepEqual(observation.data, { availability: "NotImplemented" });
  assert.equal(
    (await new SyntheticErpCommandAdapter().execute(context, key, {})).outcome,
    "NotProcessed",
  );
  await assert.rejects(
    new SyntheticErpCommandAdapter().execute(
      context,
      { ...key, provider: "MYOB" },
      {},
    ),
  );
  const doc = {
    provider: "Synthetic" as const,
    tenant_id: null,
    site_id: null,
    drive_id: null,
    item_id: "synthetic-marker",
    version_id: "1",
    sha256: "0".repeat(64),
  };
  await assert.rejects(new SyntheticDocumentStoreAdapter().read(context, doc));
  await assert.rejects(
    new SyntheticDocumentStoreAdapter().store(
      context,
      new Uint8Array(),
      doc.sha256,
    ),
  );
  assert.deepEqual(
    await new SyntheticDistributionAdapter().prepare(
      context,
      doc,
      "SYN recipient",
    ),
    { state: "Prepared", synthetic: true, delivered: false },
  );
});
