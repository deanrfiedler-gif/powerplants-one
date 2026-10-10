import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve, sep } from "node:path";
import { pathToFileURL } from "node:url";

test("database observation preserves pg callback, promise, error and release behavior without recording data", () => {
  const root = mkdtempSync(join(tmpdir(), "ppo-proof-pool-"));
  const source = pathToFileURL(resolve("src/platform/proof-database.ts")).href;
  const diagnostics = pathToFileURL(resolve("src/platform/proof-diagnostics.ts")).href;
  try {
    for (const mode of ["0", "1"]) {
    const output = execFileSync(process.execPath, ["--import", "tsx", "--input-type=module", "-e", `
      import assert from 'node:assert/strict';
      import { EventEmitter } from 'node:events';
      const { installDatabaseProof } = await import(${JSON.stringify(source)});
      const { proofReadRequest } = await import(${JSON.stringify(diagnostics)});
      process.chdir(${JSON.stringify(root)});
      const pool = new EventEmitter();
      Object.assign(pool, { totalCount: 1, idleCount: 1, waitingCount: 0, options: { max: 32, connectionString: 'PRIVATE' } });
      const client = { release(error) { pool.emit('release', error, client); } };
      let failure;
      pool.connect = callback => {
        if (callback) { queueMicrotask(() => callback(failure, failure ? undefined : client, client.release)); return; }
        return failure ? Promise.reject(failure) : Promise.resolve(client);
      };
      pool.query = () => { throw new Error('The observer must not replace query'); };
      const connect = pool.connect, query = pool.query;
      installDatabaseProof(pool);
      const installed = pool.connect;
      installDatabaseProof(pool);
      assert.equal(pool.connect, installed);
      assert.equal(pool.query, query);
      if (process.env.PPO_PROOF_DIAGNOSTICS !== '1') {
        assert.equal(pool.connect, connect);
        assert.equal(pool.listenerCount('release'), 0);
      } else {
        assert.notEqual(pool.connect, connect);
        await proofReadRequest('/api/v1/local-session?token=PRIVATE', async () => {
          assert.equal(await pool.connect(), client);
          client.release();
          await new Promise((done, reject) => pool.connect((error, actual, release) => {
            try { assert.equal(error, undefined); assert.equal(actual, client); assert.equal(release, client.release); release(); done(); } catch (e) { reject(e); }
          }));
          failure = new Error('timeout exceeded when trying to connect', { cause: new Error('PRIVATE') });
          await assert.rejects(pool.connect(), error => error === failure);
          await new Promise(done => pool.connect((error, actual) => { assert.equal(error, failure); assert.equal(actual, undefined); done(); }));
        });
      }
      console.log(process.pid);
    `], { encoding: "utf8", env: { ...process.env, NODE_ENV: "test", PPO_ENV: "local-synthetic", PPO_EXPOSURE: "loopback", PPO_IDENTITY: "synthetic", PPO_PROOF_DIAGNOSTICS: mode } });
    const file = join(root, "verification-evidence", "transport-diagnostics", `process-${output.trim()}.jsonl`);
    if (mode === "0") { assert.equal(existsSync(file), false); continue; }
    const raw = readFileSync(file, "utf8");
    const rows = raw.trim().split("\n").map(line => JSON.parse(line));
    assert.equal(rows.filter(row => row.event === "database-pool-created").length, 1);
    assert.equal(rows.filter(row => row.event === "database-acquired").length, 2);
    assert.equal(rows.filter(row => row.event === "database-release").length, 2);
    const failed = rows.filter(row => row.event === "database-acquire-failed");
    assert.equal(failed.length, 2);
    assert.ok(failed.every(row => row.error_category === "DatabasePoolWaitTimeout"));
    assert.ok(!raw.includes("PRIVATE") && !raw.includes("timeout exceeded"));
    }
  } finally {
    assert.ok(resolve(root).startsWith(resolve(tmpdir()) + sep + "ppo-proof-pool-"));
    rmSync(root, { recursive: true, force: true });
  }
});
