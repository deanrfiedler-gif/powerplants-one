// Read-only reopening of IJ-01 records around an operator-owned database restart.
// Each phase owns and stops its own compiled application; it never migrates/seeds.
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { chromium, expect, type BrowserContext } from "@playwright/test";
import { localConfig } from "../src/platform/config";
import { database, closeDatabase } from "../src/platform/database";
import { privatePath } from "./recovery";

type Entry = {
  project: string;
  lead: string;
  deal: string;
  estimatingHandover: string;
  workspace: string;
  estimate: string;
  quote: string;
  wonHandover: string;
  deliveryProject: string;
  followup: string;
  returnedLead: string;
  operations: string[];
};
const [phase, inputDirectory, evidenceDirectory] = process.argv.slice(2);
assert(phase === "before" || phase === "after");
assert(inputDirectory && evidenceDirectory);
const config = localConfig();
assert.equal(config.database_name, "ppo_synthetic_test");
const inputs = await privatePath(inputDirectory, false);
const root = await privatePath(evidenceDirectory, false);
await mkdir(root, { recursive: true });
const entries: Entry[] = [];
for (const d of await readdir(inputs, { withFileTypes: true })) {
  if (d.isDirectory() && !d.isSymbolicLink())
    entries.push(
      JSON.parse(
        await readFile(join(inputs, d.name, "entry-records.json"), "utf8"),
      ),
    );
}
assert.equal(
  entries.length,
  2,
  "Retained desktop and mobile IJ-01 entries required",
);
const previous =
  phase === "after"
    ? JSON.parse(await readFile(join(root, "before-reopen.json"), "utf8"))
    : undefined;
let occupied = false;
try {
  await fetch(config.origin, { signal: AbortSignal.timeout(1000) });
  occupied = true;
} catch {
  /* No existing listener; startup still checks its own child. */
}
assert(!occupied, "Stop the existing owned application before this phase");
const server = spawn(
  process.execPath,
  [
    "--env-file=.env.local",
    "--import",
    "tsx",
    "scripts/local-server.ts",
    "--compiled",
  ],
  { stdio: ["ignore", "inherit", "inherit"], windowsHide: true },
);
let browser: Awaited<ReturnType<typeof chromium.launch>> | undefined;
const proof: {
  phase: string;
  at: string;
  application_pid: number | undefined;
  database: { started: string; system: string };
  entries: {
    project: string;
    quote: string;
    hashes: Record<string, string>;
    receipts: unknown[];
    reopened: string[];
  }[];
} = {
  phase,
  at: new Date().toISOString(),
  application_pid: server.pid,
  database: JSON.parse(
    JSON.stringify(
      (
        await database().query(
          "SELECT pg_postmaster_start_time() started, system_identifier::text system FROM pg_control_system()",
        )
      ).rows[0],
    ),
  ),
  entries: [],
};
try {
  if (previous) {
    assert.notEqual(
      server.pid,
      previous.application_pid,
      "New application process",
    );
    assert.equal(
      proof.database.system,
      previous.database.system,
      "Same retained cluster",
    );
    assert.notEqual(
      proof.database.started,
      previous.database.started,
      "New database process",
    );
  }
  let ready = false;
  for (let attempt = 0; attempt < 480; attempt++) {
    assert.equal(server.exitCode, null, "Owned application must remain alive");
    try {
      if (
        (await fetch(config.origin, { signal: AbortSignal.timeout(2000) })).ok
      ) {
        ready = true;
        break;
      }
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  assert(ready);
  browser = await chromium.launch({ channel: "chrome" });
  for (const e of entries) {
    const mobile = e.project === "mobile-chromium";
    const context: BrowserContext = await browser.newContext({
      baseURL: config.origin,
      viewport: mobile
        ? { width: 390, height: 844 }
        : { width: 1440, height: 1000 },
      locale: "en-AU",
      timezoneId: "Australia/Brisbane",
    });
    const login = await context.request.post("/api/v1/local-session", {
      headers: { Origin: config.origin },
      data: { profile: "coordinator" },
    });
    assert(login.ok());
    const get = async (path: string) => {
      const r = await context.request.get("/api/v1/" + path);
      assert(r.ok(), path + ": " + (await r.text()));
      return r.json();
    };
    assert.equal((await get("crm/leads/" + e.lead)).deal.id, e.deal);
    assert.equal(
      (await get("crm/opportunities/" + e.deal)).items[0].close_outcome,
      "Won",
    );
    assert.equal(
      (await get("crm/leads/" + e.returnedLead)).next_activity.id,
      e.followup,
    );
    for (const path of [
      "sales/handovers/" + e.estimatingHandover,
      "estimating/workspaces/" + e.workspace,
      "estimating/estimates/" + e.estimate,
      "estimating/quotes/" + e.quote,
      "sales/handovers/" + e.wonHandover,
      "projects/" + e.deliveryProject,
      "activities/" + e.followup,
    ])
      await get(path);
    const receipts = [];
    for (const id of e.operations) receipts.push(await get("operations/" + id));
    assert.equal(receipts[0].state, "Won");
    const hashes: Record<string, string> = {};
    for (const kind of ["html", "pdf"]) {
      const r = await context.request.get(
        "/api/v1/estimating/quotes/" + e.quote + "/file?kind=" + kind,
      );
      assert(r.ok());
      const bytes = await r.body();
      hashes[kind] = createHash("sha256").update(bytes).digest("hex");
      const path = join(root, e.project + "-exact." + kind);
      if (previous)
        assert.deepEqual(
          bytes,
          await readFile(path),
          "Exact saved quotation bytes",
        );
      else await writeFile(path, bytes);
    }
    const page = await context.newPage(),
      errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    const reopened = [
      "/sales/leads/" + e.lead,
      "/sales/opportunities/" + e.deal,
      "/sales/handoffs/estimating/" + e.estimatingHandover,
      "/estimating/discovery/" + e.workspace,
      "/estimating/estimates/" + e.estimate,
      "/estimating/quotes/" + e.quote,
      "/sales/handoffs/won/" + e.wonHandover,
      "/projects/" + e.deliveryProject,
      "/work/" + e.followup,
      "/sales/leads/" + e.returnedLead,
    ];
    for (const path of reopened) {
      const response = await page.goto(path);
      assert(response?.ok(), path);
      await expect(page.locator("main")).toBeVisible();
      if (path === "/sales/opportunities/" + e.deal)
        await expect(page.getByLabel("Saved sales outcome")).toHaveText(
          "Outcome: Won",
        );
      if (path === "/projects/" + e.deliveryProject) {
        await page
          .getByRole("button", { name: "Sales handovers", exact: true })
          .click();
        await expect(
          page.getByText("Current accepted Sales handover", { exact: false }),
        ).toBeVisible();
      }
    }
    await page.screenshot({
      path: join(root, phase + "-" + e.project + ".png"),
    });
    assert.deepEqual(errors, []);
    const entry = {
      project: e.project,
      quote: e.quote,
      hashes,
      receipts,
      reopened,
    };
    if (previous)
      assert.deepEqual(
        entry,
        previous.entries.find(
          (p: { project: string }) => p.project === e.project,
        ),
      );
    proof.entries.push(entry);
    await context.close();
  }
  await writeFile(
    join(root, phase + "-reopen.json"),
    JSON.stringify(proof, null, 2),
  );
  console.log(
    phase +
      ": both retained journeys reopened; exact HTML/PDF and Won receipts verified.",
  );
} finally {
  await browser?.close();
  server.kill("SIGTERM");
  await new Promise<void>((resolve) => {
    if (server.exitCode !== null) resolve();
    else server.once("exit", () => resolve());
  });
  await closeDatabase();
}
