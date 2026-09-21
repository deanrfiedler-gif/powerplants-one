import { spawn } from "node:child_process";
import { test as base } from "@playwright/test";
import { MY_WORK_NOW } from "./my-work-clock";

export const myWorkOrigin = `http://127.0.0.1:${process.env.PPO_MY_WORK_TEST_PORT ?? "3027"}`;

// A separate compiled server confines the controlled read clock to these two
// browser suites, even when they run alongside the full application proof.
// Keep browser timers running; only Date is fixed, so real timeout/retry behavior
// and all existing assertion budgets are retained.
export const test = base.extend<object, { myWorkServer: void }>({
  myWorkServer: [async ({}, run) => {
    const server = spawn(process.execPath, ["--env-file=.env.local", "--import", "tsx", "--import", "./tests/helpers/my-work-server.ts", "scripts/local-server.ts", "--compiled"], {
      env: { ...process.env, PPO_PORT: new URL(myWorkOrigin).port, PPO_MY_WORK_BROWSER_NOW: MY_WORK_NOW },
      stdio: ["ignore", "pipe", "pipe"],
      windowsHide: true,
    });
    let diagnostics = "";
    server.stderr.on("data", (chunk: Buffer) => { diagnostics = (diagnostics + chunk.toString()).slice(-4000); });
    try {
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => reject(Error(`My Work test server did not start: ${diagnostics}`)), 120000);
        server.once("error", (error) => { clearTimeout(timeout); reject(error); });
        server.once("exit", (code) => { clearTimeout(timeout); reject(Error(`My Work test server exited (${code}): ${diagnostics}`)); });
        server.stdout.on("data", (chunk: Buffer) => {
          diagnostics = (diagnostics + chunk.toString()).slice(-4000);
          if (diagnostics.includes(`local synthetic only — ${myWorkOrigin}`)) { clearTimeout(timeout); resolve(); }
        });
      });
      await run();
    } finally {
      server.kill();
      if (server.pid !== undefined && server.exitCode === null && server.signalCode === null)
        await new Promise<void>((resolve) => {
          const timeout = setTimeout(() => server.kill("SIGKILL"), 10000);
          server.once("exit", () => { clearTimeout(timeout); resolve(); });
        });
    }
  }, { scope: "worker", timeout: 150000 }],
  baseURL: myWorkOrigin,
  page: async ({ page, myWorkServer }, run) => {
    void myWorkServer;
    await page.clock.setFixedTime(new Date(MY_WORK_NOW));
    await run(page);
  },
});
