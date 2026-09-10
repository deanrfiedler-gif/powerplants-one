import assert from "node:assert/strict";
import { test } from "node:test";
import { demoConfig } from "../../src/platform/demo-config";
import { localConfig } from "../../src/platform/config";
import { demoRequestAllowed, readCookie, secureCookie } from "../../src/platform/demo-request";
import { verifiedDemoObject } from "../../src/platform/demo-auth";
import { testerInput, demoCapabilities } from "../../scripts/demo-database";

const tenant = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const env = { NODE_ENV: "production", PPO_ENV: "azure-demo", PPO_EXPOSURE: "https", PPO_IDENTITY: "entra",
  PPO_DEMO_ORIGIN: "https://ca-ppo-demo-example.region.azurecontainerapps.io",
  DATABASE_URL: "postgresql://synthetic:fictional@pg-ppo-demo-example.postgres.database.azure.com/ppo_demo_20260909",
  PPO_ENTRA_TENANT_ID: tenant, PPO_ENTRA_CLIENT_ID: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb", PPO_ENTRA_CLIENT_SECRET: "synthetic-client-secret-only",
  PPO_BLOB_ACCOUNT: "ppodemoexample", PPO_BLOB_CONTAINER: "ppo-demo-20260909", PPO_BLOB_KEY: "synthetic-key-only" };

test("hosted mode requires HTTPS, Entra and the matching remote database/storage epoch", () => {
  assert.equal(demoConfig(env).database_name, "ppo_demo_20260909");
  for (const patch of [{ PPO_IDENTITY: "synthetic" }, { NODE_ENV: "development" }, { PPO_EXPOSURE: "loopback" },
    { PPO_DEMO_ORIGIN: "http://example.azurecontainerapps.io" }, { PPO_DEMO_ORIGIN: "https://attacker.invalid" },
    { PPO_DEMO_ORIGIN: env.PPO_DEMO_ORIGIN + "/other" }, { PPO_BLOB_CONTAINER: "ppo-demo-20260910" }, { PPO_ENTRA_TENANT_ID: "common" },
    { DATABASE_URL: "postgresql://x:y@127.0.0.1/ppo_synthetic" }, { DATABASE_URL: env.DATABASE_URL + "?sslmode=disable" },
    { DATABASE_URL: env.DATABASE_URL.replace("ppo_demo_20260909", "company_production") }, { PPO_PORT: "80" }])
    assert.throws(() => demoConfig({ ...env, ...patch }));
  assert.throws(() => localConfig(env));
});

test("gateway rejects forged origin and internal headers, permits only bounded browser navigation", () => {
  const origin = env.PPO_DEMO_ORIGIN, headers = { host: new URL(origin).host, "x-forwarded-proto": "https", origin };
  assert.equal(demoRequestAllowed(headers, "POST", "/api/v1/crm/opportunities", origin), true);
  for (const patch of [{ host: "attacker.invalid" }, { origin: "https://attacker.invalid" }, { "x-forwarded-proto": "http" },
    { "x-forwarded-proto": "https,http" }, { "x-ppo-local-gateway": "forged" }, { "sec-fetch-site": "cross-site" }])
    assert.equal(demoRequestAllowed({ ...headers, ...patch }, "POST", "/api/v1/crm/opportunities", origin), false);
  assert.equal(demoRequestAllowed({ ...headers, origin: undefined }, "POST", "/auth/logout", origin), false);
  assert.equal(demoRequestAllowed(headers, "DELETE", "/customers", origin), false);
  assert.equal(demoRequestAllowed({ ...headers, origin: undefined, "sec-fetch-site": "cross-site" }, "GET", "/auth/callback", origin), true);
  assert.equal(demoRequestAllowed({ ...headers, origin: undefined, "sec-fetch-site": "cross-site", "sec-fetch-mode": "navigate", "sec-fetch-dest": "document" }, "GET", "/", origin), true);
});

test("cookies are host-only secure/HTTP-only; ambiguous cookies are refused", () => {
  assert.equal(readCookie("a=1; session=abc", "session"), "abc");
  assert.equal(readCookie("session=a; session=b", "session"), undefined);
  assert.equal(readCookie("other_session=a", "session"), undefined);
  assert.match(secureCookie("__Host-ppo_demo_session", "abc", 3600, true), /Path=\/; HttpOnly; Secure; SameSite=Lax; Max-Age=3600/);
  assert.doesNotMatch(secureCookie("__Host-ppo_demo_session", "abc", 3600), /Domain=/);
});

test("only the validated selected tenant and stable object ID can map to a tester", () => {
  const claims = { iss: `https://login.microsoftonline.com/${tenant}/v2.0`, tid: tenant, oid: tenant };
  assert.equal(verifiedDemoObject(claims, tenant), tenant);
  for (const patch of [{ iss: "https://attacker.invalid" }, { tid: "common" }, { oid: undefined }, { oid: "dean@example.invalid" }])
    assert.throws(() => verifiedDemoObject({ ...claims, ...patch }, tenant));
});

test("tester grants are distinct, expiring and limited to Company A commercial journeys", () => {
  const now = Date.parse("2026-09-09T00:00:00Z"), entry = { object_id: tenant, expires_at: "2026-09-10T00:00:00Z" };
  assert.equal(testerInput([entry], now).length, 1);
  assert.equal(testerInput([], now).length, 0);
  for (const value of [[entry, entry], [{ ...entry, expires_at: "2026-09-08T00:00:00Z" }],
    [{ ...entry, expires_at: "2027-01-01T00:00:00Z" }], [{ ...entry, role: "Owner" }], [{ ...entry, object_id: "email@example.invalid" }]])
    assert.throws(() => testerInput(value, now));
  assert.ok(["crm.lead.read", "crm.lead.create", "crm.lead.edit", "crm.lead.convert"].every(cap => (demoCapabilities as readonly string[]).includes(cap)));
  assert.equal(demoCapabilities.some(c => /finance|service|schedule|pack|report|field/.test(c)), false);
});
