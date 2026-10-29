import assert from "node:assert/strict";
import { test } from "node:test";
import { mkdtempSync, readFileSync, rmSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  safeWriteDiagnostic, writeDiagnosticPath, writeDiagnostics,
} from "../helpers/p12-write-diagnostics";

const secret = "PRIVATE-canary-token-profile-path-output";

test("P12 diagnostic publishes only fixed phases, bounded time and error categories", () => {
  const records: string[] = [];
  let clock = 10;
  const d = writeDiagnostics("unused", (value) => records.push(value), () => clock);
  clock = 45.8;
  d.phase("download");
  const error = new Error(secret);
  error.name = "TimeoutError";
  error.stack = secret;
  d.failure(error);
  d.phase("cleanup");
  d.failure(new Error("second private failure"));
  assert.deepEqual(JSON.parse(records.at(-1)!), {
    phase: "download", elapsed_ms: 36, category: "timeout",
  });
  assert.equal(records.length, 3, "cleanup cannot overwrite the original failure");
  assert.equal(records.join("").includes(secret), false);
  assert.equal(safeWriteDiagnostic(records.at(-1)!),
    " [write phase=download; elapsed_ms=36; category=timeout]");
});

test("P12 diagnostic rejects private or malformed file contents without echoing them", () => {
  const valid = { phase: "workspace", elapsed_ms: 1, category: "running" };
  for (const raw of [
    secret, "null", "[]", "\"private\"", "{" + secret,
    JSON.stringify({ ...valid, phase: secret }),
    JSON.stringify({ ...valid, category: secret }),
    JSON.stringify({ ...valid, stdout: secret }),
    ...[-1, 600001, 0.5, "12", null].map((elapsed_ms) =>
      JSON.stringify({ ...valid, elapsed_ms })),
    " ".repeat(513) + JSON.stringify(valid),
  ]) {
    assert.equal(safeWriteDiagnostic(raw), " [write diagnostic unavailable]");
  }
});

test("P12 error categories never include arbitrary names, messages or getter output", () => {
  for (const [name, expected] of [
    ["AssertionError", "assertion"], ["TimeoutError", "timeout"],
    [secret, "error"],
  ]) {
    let output = "";
    const d = writeDiagnostics("unused", (value) => { output = value; });
    const e = new Error(secret);
    e.name = name;
    d.failure(e);
    assert.equal(JSON.parse(output).category, expected);
    assert.equal(output.includes(secret), false);
  }
  let output = "";
  const d = writeDiagnostics("unused", (value) => { output = value; });
  const hostile = new Error(secret);
  Object.defineProperty(hostile, "name", { get() { throw Error(secret); } });
  assert.doesNotThrow(() => d.failure(hostile));
  assert.equal(JSON.parse(output).category, "unknown");
});

test("P12 diagnostics are optional, best effort and bounded even for invalid clocks", () => {
  let writes = 0;
  const disabled = writeDiagnostics(undefined, () => { writes++; });
  disabled.phase("photo"); disabled.failure(new Error(secret));
  assert.equal(writes, 0);
  const broken = writeDiagnostics("unused", () => { throw Error(secret); });
  assert.doesNotThrow(() => { broken.phase("download"); broken.failure(secret); });
  for (const value of [-5, Number.NaN, Number.POSITIVE_INFINITY, 700000]) {
    let clock = 0, output = "";
    const d = writeDiagnostics("unused", (v) => { output = v; }, () => clock);
    clock = value;
    d.phase("proof-write");
    assert.equal(JSON.parse(output).elapsed_ms, value === 700000 ? 600000 : 0);
    d.phase(secret as never);
    assert.equal(JSON.parse(output).phase, "proof-write");
  }
});

test("P12 marker file contains no private payload and is created owner-only", () => {
  const root = mkdtempSync(join(tmpdir(), "p12-diagnostic-unit-"));
  try {
    const path = writeDiagnosticPath(root);
    const d = writeDiagnostics(path);
    d.phase("service-worker");
    d.failure(new Error(secret));
    assert.equal(statSync(path).mode & 0o777, 0o600);
    const bytes = readFileSync(path, "utf8");
    assert.equal(bytes.includes(secret), false);
    assert.match(safeWriteDiagnostic(bytes), /phase=service-worker; elapsed_ms=\d+; category=error/);
  } finally { rmSync(root, { recursive: true, force: true }); }
});
