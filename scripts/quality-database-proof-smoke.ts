import assert from "node:assert/strict";
import { execFileSync, spawn } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { request } from "@playwright/test";
import { localConfig } from "../src/platform/config";
import { proofDiagnosticsEnabled } from "../src/platform/proof-diagnostics";

// Separate fresh-server smoke: prove compiled routes execute and emit the
// requested observations before collecting a ten-user performance run.
const label = process.argv[2];
assert.match(label ?? "", /^[a-z][a-z0-9-]+$/);
const config = localConfig();
assert.equal(config.database_name, "ppo_synthetic_test");
assert.ok(proofDiagnosticsEnabled());
const source = process.env.PPO_COMPILED_SOURCE;
assert.match(source ?? "", /^[0-9a-f]{40}$/);
execFileSync("git", ["diff", "--exit-code", source!, "--", "src", "db", "public", "package.json", "package-lock.json", "scripts/build-offline.ts", "next.config.ts"]);
const root = `verification-evidence/pt27-loading/${label}`;
await mkdir(root, { recursive: false });
const build = (await readFile(".next/BUILD_ID", "utf8")).trim();
const server = spawn(process.execPath, ["--env-file=.env.local", "--import", "tsx", "scripts/local-server.ts", "--compiled"], { stdio: "inherit" });
const closed = new Promise<void>(resolve => server.once("close", () => resolve()));
const client = await request.newContext({ baseURL: config.origin, extraHTTPHeaders: { Origin: config.origin } });
const paths = ["/api/v1/local-session", "/api/v1/shell/context", "/api/v1/crm/directory", "/api/v1/crm/directory/views"];
try {
  const deadline = performance.now() + 120000;
  let ready = false;
  while (performance.now() < deadline) {
    try { if ((await fetch(config.origin, { signal: AbortSignal.timeout(1000) })).ok) { ready = true; break; } } catch {}
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  assert.ok(ready, "Owned compiled server must start within 120 seconds");
  assert.equal((await client.post("/api/v1/local-session", { data: { profile: "coordinator" } })).status(), 200);
  for (const path of paths) {
    const response = await client.get(path + (path.includes("/directory") ? "?kind=organisations" : ""));
    assert.equal(response.status(), 200, path);
    assert.equal(response.headers()["cache-control"], "private, no-store");
    await response.json();
  }
  const raw = await readFile(`verification-evidence/transport-diagnostics/process-${server.pid}.jsonl`, "utf8");
  const events = raw.trim().split("\n").map(line => JSON.parse(line));
  for (const path of paths) {
    assert.ok(events.some(row => row.path === path && row.event === "read-phase" && row.phase === "route-complete"), `Missing compiled phase for ${path}`);
    assert.ok(events.some(row => row.path === path && row.event === "database-acquired"), `Missing compiled acquisition for ${path}`);
    assert.ok(events.some(row => row.path === path && row.event === "database-release"), `Missing compiled release for ${path}`);
  }
  assert.equal(events.filter(row => row.event === "database-acquire-failed").length, 0);
  await writeFile(`${root}/gateway.jsonl`, raw);
  await writeFile(`${root}/smoke.json`, JSON.stringify({ passed: true, compiled_source: source, build_id: build, paths, route_phases: events.filter(row => row.event === "read-phase").length, pools: events.filter(row => row.event === "database-pool-created").length }, null, 2));
  console.log("Compiled route, acquisition and release observations passed for all four read paths.");
} finally {
  await client.dispose();
  if (server.exitCode === null && server.signalCode === null) server.kill();
  await closed;
}
