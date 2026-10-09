import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";
import { mkdtemp, realpath, rm } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { localConfig } from "../../src/platform/config";

test("PT-18 source identity, reviewed reconciliation and retained output recovery", async (t) => {
  if (localConfig().database_name !== "ppo_synthetic_test")
    throw Error("Disposable synthetic database required");
  const env = { ...process.env };
  delete env.NODE_TEST_CONTEXT;
  // Ordinary database CI uses the default store. Give this filesystem-fault proof
  // a private directory of its own, with a canonical path on Windows as well.
  const ownedStore = env.PPO_DOCUMENT_DIRECTORY
    ? null
    : await realpath(await mkdtemp(join(homedir(), ".ppo-pt18-")));
  if (ownedStore) env.PPO_DOCUMENT_DIRECTORY = ownedStore;
  try {
    const result = await promisify(execFile)(
      process.execPath,
      [
        "--conditions=react-server",
        "--import",
        "tsx",
        "--test",
        fileURLToPath(
          new URL("../helpers/document-identity-recovery.ts", import.meta.url),
        ),
      ],
      { env, timeout: 110000, maxBuffer: 1024 * 1024 },
    );
    if (result.stderr) throw Error(result.stderr);
    t.diagnostic(result.stdout);
  } finally {
    // Only the exact directory created by this wrapper is eligible for cleanup.
    if (ownedStore) await rm(ownedStore, { recursive: true, force: true });
  }
});
