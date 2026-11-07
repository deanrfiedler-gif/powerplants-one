import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync, existsSync, utimesSync } from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";

const script = fileURLToPath(new URL("../../scripts/install-browser.sh", import.meta.url));
const linux = process.platform === "linux";

// PATH shims never run apt, sudo or a real package/browser install. Only the
// watchdog is real, shortened here so the process-tree regression takes <1s.
function run(scenario: string, options: { nonRoot?: boolean; downloadTimeout?: string } = {}) {
  const root = mkdtempSync(join(tmpdir(), "ppo browser install "));
  const bin = join(root, "bin");
  const sharedRegistry = join(root, "shared-registry");
  mkdirSync(bin);
  mkdirSync(join(sharedRegistry, "__dirlock"), { recursive: true });
  function shim(name: string, body: string) {
    writeFileSync(join(bin, name), `#!/usr/bin/env bash\nset -eu\n${body}\n`, { mode: 0o755 });
  }
  shim("id", `echo '${options.nonRoot ? 1001 : 0}'`);
  shim("sudo", `echo "sudo:$*" >> "$STATE/events"; [[ "$1 $2" == '-n -E' ]]; shift 2; exec "$@"`);
  shim("sleep", `echo "sleep:$*" >> "$STATE/events"`);
  shim("timeout", `
    echo "timeout:$*" >> "$STATE/events"
    signal="$1"; duration="$2"; shift 2
    case "$duration" in
      120s) duration=0.3s ;;
      30s) duration=0.3s ;;
    esac
    exec /usr/bin/timeout "$signal" "$duration" "$@"
  `);
  shim("dpkg", `
    echo "dpkg:$*" >> "$STATE/events"
    [[ "$*" == '--configure -a' ]]
    [[ "$SCENARIO" != recovery-fails ]] || exit 1
    # Model the kernel lock held by the killed package-manager descendant.
    flock -n "$STATE/package.lock" true
  `);
  shim("npx", `
    count=0; [[ ! -f "$STATE/count" ]] || count="$(cat "$STATE/count")"
    count=$((count + 1)); echo "$count" > "$STATE/count"
    echo "install:$count:$*" >> "$STATE/events"
    echo "$PLAYWRIGHT_DOWNLOAD_CONNECTION_TIMEOUT" >> "$STATE/download-timeouts"
    echo "$PLAYWRIGHT_BROWSERS_PATH" >> "$STATE/registries"
    [[ "$*" == '--no-install playwright install --with-deps chrome' ]]
    echo synthetic-ffmpeg > "$PLAYWRIGHT_BROWSERS_PATH/ffmpeg-fixture"
    case "$SCENARIO:$count" in
      fail:*|recovery-fails:*|fail-once:1) exit 1 ;;
      hang:*|hang-once:1)
        # Both the launcher and a lock-holding child ignore TERM. KILL must
        # reach the entire group before recovery/the next attempt can proceed.
        trap '' TERM
        flock -x "$STATE/package.lock" bash -c 'trap "" TERM; for _ in {1..50}; do /bin/sleep 0.1; done' &
        wait
        ;;
    esac
  `);
  shim("npm", `
    echo "guard:$*" >> "$STATE/events"
    [[ "$*" == 'run browser:check' ]]
    case "$SCENARIO" in
      guard-fails) exit 1 ;;
      guard-hangs) trap '' TERM; for _ in {1..50}; do /bin/sleep 0.1; done ;;
    esac
  `);
  const env: NodeJS.ProcessEnv = { ...process.env, PATH: `${bin}:${process.env.PATH}`, STATE: root,
    SCENARIO: scenario, PLAYWRIGHT_BROWSERS_PATH: sharedRegistry };
  delete env.PLAYWRIGHT_DOWNLOAD_CONNECTION_TIMEOUT;
  if (options.downloadTimeout !== undefined) env.PLAYWRIGHT_DOWNLOAD_CONNECTION_TIMEOUT = options.downloadTimeout;
  const started = performance.now();
  try {
    const result = spawnSync("bash", [script], { env, encoding: "utf8", timeout: 10_000 });
    assert.ifError(result.error);
    const elapsed = performance.now() - started;
    const read = (name: string) => existsSync(join(root, name)) ? readFileSync(join(root, name), "utf8").trim().split("\n") : [];
    const events = read("events");
    const registries = read("registries");
    assert.ok(existsSync(join(sharedRegistry, "__dirlock")), "must not remove another installer's lock");
    for (const registry of registries) assert.equal(registry, sharedRegistry, "preserve the caller's cache across sudo/retries");
    if (registries.length) assert.equal(readFileSync(join(sharedRegistry, "ffmpeg-fixture"), "utf8"), "synthetic-ffmpeg\n");
    return { ...result, events, elapsed, downloadTimeouts: read("download-timeouts") };
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

test("browser installer succeeds once and checks the original user's browser/PDF", { skip: !linux }, () => {
  const result = run("success", { nonRoot: true });
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.events.filter(x => x.startsWith("install:")).length, 1);
  assert.equal(result.events.filter(x => x.startsWith("guard:")).length, 1);
  assert.deepEqual(result.downloadTimeouts, ["120000"]);
  assert.ok(result.events.some(x => x.startsWith("sudo:-n -E timeout --signal=KILL 120s env")));
  assert.ok(result.events.some(x => x === "timeout:--signal=KILL 30s npm run browser:check"));
  assert.ok(!result.events.some(x => x.startsWith("sleep:") || x.startsWith("dpkg:")));
  assert.ok(!result.events.some(x => x.startsWith("sudo:") && x.includes("browser:check")));
});

test("ordinary install failure repairs before retry and preserves caller download timeout", { skip: !linux }, () => {
  const result = run("fail-once", { downloadTimeout: "7000" });
  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(result.downloadTimeouts, ["7000", "7000"]);
  assert.equal(result.events.filter(x => x === "sleep:10").length, 1);
  assert.ok(result.events.indexOf("dpkg:--configure -a") < result.events.findIndex(x => x.startsWith("install:2:")));
  assert.equal(result.events.filter(x => x.startsWith("guard:")).length, 1);
  assert.match(result.stderr, /failed on attempt 1; retrying in 10 seconds/);
});

test("three install failures exit 1, sleep only twice and never run the guard", { skip: !linux }, () => {
  const result = run("fail");
  assert.equal(result.status, 1);
  assert.equal(result.events.filter(x => x.startsWith("install:")).length, 3);
  assert.equal(result.events.filter(x => x === "sleep:10").length, 2);
  assert.equal(result.events.filter(x => x.startsWith("guard:")).length, 0);
  assert.match(result.stderr, /failed after 3 attempts/);
});

test("failed dpkg recovery refuses a new install without deleting package locks", { skip: !linux }, () => {
  const result = run("recovery-fails");
  assert.equal(result.status, 1);
  assert.equal(result.events.filter(x => x.startsWith("install:")).length, 1);
  assert.equal(result.events.filter(x => x.startsWith("dpkg:")).length, 2);
  assert.equal(result.events.filter(x => x === "sleep:10").length, 2);
});

test("a real timeout kills TERM-resistant descendants, releases their lock and retries successfully", { skip: !linux }, () => {
  const result = run("hang-once");
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.events.filter(x => x.startsWith("install:")).length, 2);
  assert.equal(result.events.filter(x => x.startsWith("guard:")).length, 1);
  assert.match(result.stderr, /attempt 1 timed out/);
  assert.ok(result.elapsed < 5000, `elapsed ${result.elapsed}ms`);
});

for (const scenario of ["hang", "guard-fails", "guard-hangs"]) {
  test(`browser installer remains bounded and fails closed: ${scenario}`, { skip: !linux }, () => {
    const result = run(scenario);
    assert.equal(result.status, 1, result.stderr);
    assert.equal(result.events.filter(x => x.startsWith("install:")).length, 3);
    assert.equal(result.events.filter(x => x === "sleep:10").length, 2);
    assert.equal(result.events.filter(x => x.startsWith("guard:")).length, scenario === "hang" ? 0 : 3);
    assert.match(result.stderr, /failed after 3 attempts/);
    assert.ok(result.elapsed < 5000, `elapsed ${result.elapsed}ms`);
  });
}

test("pinned Playwright preserves a fresh lock, reclaims a dead owner's stale lock and retains cached assets", { skip: !linux }, () => {
  const root = mkdtempSync(join(tmpdir(), "ppo playwright lock "));
  const cache = join(root, "cache");
  const fixture = join(root, "installer.cjs");
  const require = createRequire(import.meta.url);
  // Exercise the pinned implementation rather than duplicate its stale-lock logic.
  const bundle = join(dirname(require.resolve("playwright-core/package.json")), "lib/coreBundle.js");
  mkdirSync(cache);
  writeFileSync(join(cache, "ffmpeg-fixture"), "retained video dependency");
  writeFileSync(fixture, `
    const { registry } = require(${JSON.stringify(bundle)}).registry;
    const fs = require('node:fs');
    const hold = process.argv[2] === 'hold';
    registry.install(hold ? [{ name: 'synthetic', _isHermeticInstallation: true,
      _install: async () => {
        fs.writeFileSync(${JSON.stringify(join(root, "acquired"))}, 'yes');
        await new Promise(() => setInterval(() => {}, 100));
      }
    }] : [], { gc: false }).catch(error => { console.error(error); process.exitCode = 1; });
  `);
  const env = { ...process.env, PLAYWRIGHT_BROWSERS_PATH: cache };
  const invoke = (duration: string, mode: string) => spawnSync("/usr/bin/timeout",
    ["--signal=KILL", duration, process.execPath, fixture, mode], { env, encoding: "utf8", timeout: 5000 });
  try {
    const killed = invoke("1s", "hold");
    assert.ifError(killed.error);
    assert.equal(killed.signal, "SIGKILL", killed.stderr);
    assert.ok(existsSync(join(root, "acquired")), "the real Playwright owner acquired the lock before being killed");
    const lock = join(cache, "__dirlock");
    assert.ok(existsSync(lock), "KILL leaves Playwright's directory lock behind");
    const fresh = invoke("0.5s", "release");
    assert.ifError(fresh.error);
    assert.equal(fresh.signal, "SIGKILL", fresh.stderr);
    assert.ok(existsSync(lock), "a fresh lock is not stolen");
    // Advance only the abandoned lock's age past the pinned 10-second lease.
    // The separate PATH proof checks that the wrapper retains both 10s pauses.
    const expired = new Date(Date.now() - 11_000);
    utimesSync(lock, expired, expired);
    const recovered = invoke("3s", "release");
    assert.ifError(recovered.error);
    assert.equal(recovered.status, 0, recovered.stderr);
    assert.equal(existsSync(lock), false, "Playwright reacquired and released its own stale lock");
    assert.equal(readFileSync(join(cache, "ffmpeg-fixture"), "utf8"), "retained video dependency");
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
