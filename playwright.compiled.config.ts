import { defineConfig } from "@playwright/test";
import base from "./playwright.config";

// The same browser suite, projects and deadlines as playwright.config.ts, run
// against the compiled application (`npm run build` output) served by the
// loopback synthetic-identity launcher in `--compiled` mode. Requires a
// completed build in this checkout. The warm-up dependency project is kept as
// the control measurement: compiled first-request timings beside dev-server ones.
export default defineConfig({
  ...base,
  webServer: {
    ...base.webServer,
    command: "npm run serve:compiled",
  },
});
