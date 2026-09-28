import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";
import { test } from "node:test";
import { localConfig } from "../../src/platform/config";
test("API-C26 actual HTTP contract runs only in an isolated harness", async () => {
  if (localConfig().database_name !== "ppo_synthetic_test")
    throw Error("Disposable synthetic database required");
  const childEnv = { ...process.env };
  delete childEnv.NODE_TEST_CONTEXT;
  const result = await promisify(execFile)(
    process.execPath,
    [
      "--conditions=react-server",
      "--import",
      "tsx",
      "--test",
      fileURLToPath(
        new URL("../helpers/policy-http-harness.ts", import.meta.url),
      ),
    ],
    { env: childEnv, timeout: 110000, maxBuffer: 1024 * 1024 },
  );
  if (result.stderr) throw Error(result.stderr);
});
