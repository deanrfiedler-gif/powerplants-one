// Optional, explicitly labelled command-only proof when the pinned renderer is absent.
// Never loaded by npm test/check/CI or by the application. The ordinary database and
// HTTP suites retain their real renderer requirement. These bytes are NOT a PDF proof.
// Run with Node's --experimental-test-module-mocks, --import tsx, then --import this file.
import { mock } from "node:test";
import { createHash } from "node:crypto";
import { localConfig } from "../../src/platform/config.ts";
import * as browser from "../../src/platform/browser.ts";

if (
  process.env.PPO_B2_SYNTHETIC_RENDERER !== "command-proof-only" ||
  localConfig().database_name !== "ppo_synthetic_test"
)
  throw Error("Explicit B2 command-only proof on ppo_synthetic_test required");

mock.module(new URL("../../src/platform/browser.ts", import.meta.url).href, {
  namedExports: {
    ...browser,
    launchDocumentBrowser: async () => ({
      version: () => "SYNTHETIC-B2-STORED-BYTES-NOT-RENDERED",
      close: async () => {},
      newPage: async () => {
        let html = "";
        return {
          route: async () => {},
          setContent: async (value) => {
            html = value;
          },
          // Command-only placeholder for font readiness/checks; no font or layout proof.
          evaluate: async () => true,
          pdf: async () =>
            Buffer.from(
              `%PDF-SYNTHETIC-B2-COMMAND-PROOF-NOT-RENDERED\n${createHash("sha256").update(html).digest("hex")}\n`,
            ),
        };
      },
    }),
  },
});
