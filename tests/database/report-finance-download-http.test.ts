import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";
import { test } from "node:test";
import { localConfig } from "../../src/platform/config";

test("PT-01 / PT-18 Service and Finance download authority and exact recovery over HTTP", async (t) => {
  if (localConfig().database_name !== "ppo_synthetic_test")
    throw Error("Disposable synthetic database required");
  const env = { ...process.env };
  delete env.NODE_TEST_CONTEXT;
  const result = await promisify(execFile)(
    process.execPath,
    [
      "--conditions=react-server",
      "--import",
      "tsx",
      "--test",
      fileURLToPath(
        new URL("../helpers/report-finance-download-http.ts", import.meta.url),
      ),
    ],
    { env, timeout: 110000, maxBuffer: 1024 * 1024 },
  );
  if (result.stderr) throw Error(result.stderr);
  t.diagnostic(result.stdout);
});
