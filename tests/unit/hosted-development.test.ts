import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { QueryClient } from "../../src/platform/permissions";
import { developmentAvailable, developmentRequest, developmentFramePolicy } from "../../src/development/access";
import { readDevelopmentSnapshot, snapshotPath } from "../../src/development/snapshot";

const tenant = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa", owner = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb", other = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";
const env = { NODE_ENV: "production", PPO_ENV: "azure-demo", PPO_EXPOSURE: "https", PPO_IDENTITY: "entra",
  PPO_DEMO_ORIGIN: "https://ca-ppo-demo-example.region.azurecontainerapps.io",
  DATABASE_URL: "postgresql://synthetic:fictional@pg-ppo-demo-example.postgres.database.azure.com/ppo_demo_20260909",
  PPO_ENTRA_TENANT_ID: tenant, PPO_ENTRA_CLIENT_ID: other, PPO_ENTRA_CLIENT_SECRET: "synthetic-client-secret-only",
  PPO_BLOB_ACCOUNT: "ppodemoexample", PPO_BLOB_CONTAINER: "ppo-demo-20260909", PPO_BLOB_KEY: "synthetic-key-only",
  PPO_DEVELOPMENT_WORKSPACE: "on", PPO_DEVELOPMENT_OWNER_OBJECT_ID: owner, PPO_LOCAL_GATEWAY: "test-gateway" };
const headers = new Headers({ "x-ppo-local-gateway": env.PPO_LOCAL_GATEWAY, cookie: `__Host-ppo_demo_session=${"a".repeat(64)}` });

test("hosted design access fails closed and never treats ordinary business access as owner access", async () => {
  let queries = 0, rows: unknown[] = [{tenant_id: tenant, object_id: owner}];
  const client = {query: async () => { queries++; return {rows, rowCount: rows.length}; }} as unknown as QueryClient;
  assert.equal(developmentAvailable(env), true);
  assert.equal(await developmentRequest(headers, env, client), true);
  rows = [{tenant_id: tenant, object_id: other}];
  assert.equal(await developmentRequest(headers, env, client), false);
  rows = [{tenant_id: other, object_id: owner}];
  assert.equal(await developmentRequest(headers, env, client), false);
  rows = []; // expired, disabled or removed membership produces no row
  assert.equal(await developmentRequest(headers, env, client), false);
  rows = [{tenant_id: tenant, object_id: owner}, {tenant_id: tenant, object_id: owner}];
  assert.equal(await developmentRequest(headers, env, client), false);
  const before = queries;
  for (const patch of [{PPO_DEVELOPMENT_WORKSPACE: "off"}, {PPO_DEVELOPMENT_WORKSPACE: undefined}, {PPO_DEVELOPMENT_OWNER_OBJECT_ID: undefined}, {PPO_DEVELOPMENT_OWNER_OBJECT_ID: owner + "," + other}, {PPO_IDENTITY: "synthetic"}, {PPO_ENTRA_TENANT_ID: "common"}])
    assert.equal(await developmentRequest(headers, {...env,...patch}, client), false);
  for (const h of [new Headers(), new Headers({cookie: headers.get("cookie")!, "x-ppo-local-gateway": "forged"}), new Headers({"x-ppo-local-gateway": env.PPO_LOCAL_GATEWAY}), new Headers({"x-ppo-local-gateway": env.PPO_LOCAL_GATEWAY, cookie: `${headers.get("cookie")}; ${headers.get("cookie")}`})])
    assert.equal(await developmentRequest(h, env, client), false);
  assert.equal(queries, before, "malformed requests must not reach the database");
  assert.equal(await developmentRequest(headers, env, {query: async () => {throw Error("database unavailable");}} as unknown as QueryClient), false);
  assert.equal(developmentFramePolicy("/development/component-preview", env), "SAMEORIGIN");
  for (const path of ["/development/design-system", "/work", "/development/component-preview/extra"])
    assert.equal(developmentFramePolicy(path, env), "DENY");
});

test("a deployed snapshot must match the exact release and cannot fall back to a working directory", async () => {
  const root = await mkdtemp(join(tmpdir(), "ppo-release-")), commit = "a".repeat(40);
  try {
    await assert.rejects(readDevelopmentSnapshot(root, commit));
    await mkdir(join(root, ".ppo-development"));
    const value = { schema_version: 1, commit, catalog: {schema_version: 2, checkout_commit: commit, errors: []}, components: {checkout_commit: commit, errors: []}, guides: [] };
    await writeFile(join(root, snapshotPath), JSON.stringify(value));
    assert.equal((await readDevelopmentSnapshot(root, commit)).commit, commit);
    for (const sha of [undefined, "main", "b".repeat(40)]) await assert.rejects(readDevelopmentSnapshot(root, sha));
    for (const patch of [{schema_version: 9}, {components: {...value.components, errors: ["Broken reference"]}}, {catalog: {...value.catalog, checkout_commit: "b".repeat(40)}}]) {
      await writeFile(join(root, snapshotPath), JSON.stringify({...value, ...patch}));
      await assert.rejects(readDevelopmentSnapshot(root, commit));
    }
  } finally { await rm(root, {recursive: true, force: true}); }
});
