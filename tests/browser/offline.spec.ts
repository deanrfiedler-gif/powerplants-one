import {
  test,
  expect,
  chromium,
  type Page,
  type TestInfo,
  type APIRequestContext,
} from "@playwright/test";
import { writeFile, readFile, mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { prepareFieldAppointment } from "../helpers/field-http";
import { png, base } from "../helpers/field";
const origin = "http://127.0.0.1:3000";
async function call(request: APIRequestContext, path: string, body?: unknown) {
  const r = await request.fetch(`${origin}/api/v1/${path}`, {
    method: body === undefined ? "GET" : "POST",
    headers:
      body === undefined
        ? {}
        : { Origin: origin, "Content-Type": "application/json" },
    data: body,
  });
  const data = await r.json();
  expect(r.ok(), JSON.stringify(data)).toBeTruthy();
  return data;
}
async function login(request: APIRequestContext, profile: string) {
  return call(request, "local-session", { profile });
}
async function prepared(page: Page, day: string) {
  await login(page.request, "coordinator");
  const setup = await prepareFieldAppointment(
    (path, body) => call(page.request, path, body),
    day,
  );
  for (const profile of ["assigned-technician", "second-technician"]) {
    const p = await login(page.request, profile),
      recipient = setup.pack.readiness.recipients.find(
        (x: { user_id: string }) => x.user_id === p.actor_id,
      );
    await call(
      page.request,
      `pack-issues/${setup.pack.current_issue_id}/acknowledge`,
      {
        ...base(),
        assignment_id: recipient.assignment_id,
        assignment_version: recipient.assignment_version,
        presented_hash: setup.pack.issues[0].output_hash,
        captured_at: new Date().toISOString(),
      },
    );
  }
  await login(page.request, "assigned-technician");
  return setup;
}
async function open(page: Page, id: string) {
  await page.goto("/offline/index.html");
  await expect(page.locator("#workspace")).toBeVisible();
  await page.waitForFunction(() => navigator.serviceWorker.controller !== null);
  await page.getByLabel("Assigned job to download").selectOption(id);
  await page
    .getByRole("button", { name: "Download selected job", exact: true })
    .click();
  // Identity, context and exact HTML are separate bounded requests. Wait for
  // their completion before asserting the durable local-save result.
  await expect(
    page.getByRole("button", { name: "Download selected job", exact: true }),
  ).toBeEnabled({ timeout: 45000 });
  await expect(page.locator("#notice")).toContainText(
    "Job context and exact pack saved",
  );
  await expect(page.locator("#jobs article")).toHaveCount(1);
  await expect(page.locator("#capture-form")).toBeVisible();
}
async function note(
  page: Page,
  text = "SYN offline factual observation; uncertain identity remains explicit",
) {
  await page
    .getByLabel("Evidence type", { exact: true })
    .selectOption("Observation");
  await page.getByLabel("Finding", { exact: true }).fill(text);
  await page
    .getByLabel("Attempted fix", { exact: true })
    .fill("SYN visual-only check; no intervention");
  await page
    .getByLabel("Result, including unsuccessful work", { exact: true })
    .fill("SYN label remains unclear; technical follow-up required");
  await page
    .getByLabel("Capture context", { exact: true })
    .fill("SYN original offline evidence within inspection scope");
}
async function save(page: Page) {
  const before = await page.locator("#queue .queue-row").count(),
    increment =
      (await page.getByLabel("Evidence type", { exact: true }).inputValue()) ===
      "Photo"
        ? 4
        : 1;
  await page
    .getByRole("button", { name: "Save evidence on this device", exact: true })
    .click();
  await expect(page.locator("#queue .queue-row")).toHaveCount(
    before + increment,
  );
  await expect(page.locator("#capture-form")).toContainText(
    "Saved on this device — awaiting server acceptance.",
  );
}
async function screenshot(page: Page, info: TestInfo, scenario: string) {
  await page.evaluate(() => scrollTo(0, 0));
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  const bytes = await page.screenshot({
    path: info.outputPath(`P08-${scenario}.png`),
    fullPage: true,
  });
  await writeFile(
    info.outputPath(`P08-${scenario}.json`),
    JSON.stringify(
      {
        scenario,
        run_id: process.env.GITHUB_RUN_ID,
        run_attempt: process.env.GITHUB_RUN_ATTEMPT,
        source_head: process.env.PPO_SOURCE_HEAD ?? process.env.GITHUB_SHA,
        source_tree: execFileSync("git", ["rev-parse", "HEAD^{tree}"], {
          encoding: "utf8",
        }).trim(),
        executed_checkout: execFileSync("git", ["rev-parse", "HEAD"], {
          encoding: "utf8",
        }).trim(),
        viewport: page.viewportSize(),
        url: page.url(),
        captured_at: new Date().toISOString(),
        byte_count: bytes.length,
        sha256: createHash("sha256").update(bytes).digest("hex"),
      },
      null,
      2,
    ),
  );
}
async function localRows(page: Page) {
  return page.evaluate(async () => {
    const path = "/offline/modules/offline/store.js",
      s = await import(path),
      p = (await s.ownership()).owner;
    return s.queue(p);
  });
}
test("P08 real offline UI interruption retains typed evidence and exact PNG, retries original receipt and saves draft", async ({
  page,
  context,
}, info) => {
  test.setTimeout(120000);
  const setup = await prepared(
    page,
    info.project.name.startsWith("desktop") ? "2026-12-15" : "2026-12-17",
  );
  await open(page, setup.appointment_id);
  await screenshot(page, info, "current-context");
  await context.setOffline(true);
  await page.reload();
  await expect(page.locator("#network")).toContainText("offline");
  await page
    .getByRole("button", { name: "Open saved field job", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Save provisional start intent", exact: true })
    .click();
  await expect(page.locator("#queue .queue-row")).toHaveCount(1);
  await note(page);
  await screenshot(page, info, "unsaved-offline");
  await save(page);
  await page.getByLabel("Evidence type", { exact: true }).selectOption("Time");
  const now =
    Math.floor(Date.now() / 1000) * 1000 -
    (info.project.name.startsWith("mobile") ? 10800000 : 0);
  await page
    .getByLabel("Actual start time (UTC)")
    .fill(new Date(now - 18000000).toISOString());
  await page
    .getByLabel("Actual end time (UTC)")
    .fill(new Date(now - 17400000).toISOString());
  await save(page);
  await page.getByLabel("Evidence type", { exact: true }).selectOption("Photo");
  const bytes = png();
  await page.getByLabel("Original synthetic PNG").setInputFiles({
    name: "SYN-offline-evidence.png",
    mimeType: "image/png",
    buffer: bytes,
  });
  await page
    .getByLabel("Photo caption")
    .fill("SYN exact fictional inspection image, navy and green");
  await save(page);
  await expect(page.locator("#queue .queue-row")).toHaveCount(7);
  await screenshot(page, info, "locally-saved-png");
  const originals = await localRows(page);
  await page.reload();
  await expect(page.locator("#queue .queue-row")).toHaveCount(7);
  expect(
    (await localRows(page)).map((x: { original: unknown }) => x.original),
  ).toEqual(originals.map((x: { original: unknown }) => x.original));
  await context.setOffline(false);
  let accepted: unknown = null;
  await page.route("**/api/v1/sync/operations", async (route) => {
    const r = await route.fetch();
    accepted = await r.json();
    await route.abort("failed");
  });
  await page
    .getByRole("button", { name: "Send next batch / retry originals" })
    .click();
  await expect(page.locator("#queue")).toContainText(
    "Server outcome is uncertain",
  );
  await screenshot(page, info, "uncertain-originals");
  await page.unroute("**/api/v1/sync/operations");
  await page.route("**/api/v1/sync/operations", async (route) => {
    await new Promise((r) => setTimeout(r, 1500));
    await route.continue();
  });
  await page
    .getByRole("button", { name: "Send next batch / retry originals" })
    .click();
  await expect(page.locator("#queue .status").first()).toHaveText("Sending");
  await screenshot(page, info, "sending");
  await expect(page.locator("#queue .status")).toHaveText(
    Array(7).fill("ServerSaved"),
  );
  await page.unroute("**/api/v1/sync/operations");
  const rows = await localRows(page),
    expected = accepted as {
      outcomes: { operation_id: string; receipt: unknown }[];
    };
  for (const row of rows)
    expect(row.status.receipt).toEqual(
      expected.outcomes.find(
        (x) => x.operation_id === row.original.operation_id,
      )!.receipt,
    );
  const job = (await call(page.request, `my-jobs/${setup.appointment_id}`))
    .items[0];
  expect(job.entries).toHaveLength(3);
  expect(job.status).toBe("InProgress");
  const image = await page.request.get(
    `/api/v1/attachments/${job.attachments[0].id}/bytes`,
  );
  expect(await image.body()).toEqual(bytes);
  await page
    .getByRole("button", { name: "Open saved field job", exact: true })
    .click();
  await page
    .getByLabel("Work performed", { exact: true })
    .fill("SYN partial visual inspection recorded offline");
  await page
    .getByLabel("Remaining work and next action")
    .fill(
      "SYN service owner to review the unclear label and plan any further visit",
    );
  await page
    .getByLabel("Personal time declaration")
    .selectOption("AllRecorded");
  await page.getByLabel("Personal material declaration").selectOption("None");
  await page
    .getByLabel("Declaration and draft reason")
    .fill("SYN captured quantities only; review remains outstanding");
  await page
    .getByLabel(/^Task reason:/)
    .fill("SYN remaining inspection requires owner review");
  await page
    .getByRole("button", { name: "Save completion draft on this device" })
    .click();
  await expect(page.locator("#completion-form")).toContainText(
    "Completion draft saved on this device",
  );
  await page
    .getByRole("button", { name: "Send next batch / retry originals" })
    .click();
  await expect(page.locator("#queue .status")).toHaveText(
    Array(8).fill("ServerSaved"),
  );
  await screenshot(page, info, "server-saved-draft");
  const final = (await call(page.request, `my-jobs/${job.id}`)).items[0];
  expect(final.draft_revisions[0].scope_outcome).toBe("Partial");
  expect(final.status).toBe("InProgress");
  await writeFile(info.outputPath("P08-original.png"), bytes);
  await writeFile(
    info.outputPath("P08-replay-evidence.json"),
    JSON.stringify(
      {
        accepted_response: accepted,
        originals: await localRows(page),
        server_job: final,
        png_sha256: createHash("sha256").update(bytes).digest("hex"),
      },
      null,
      2,
    ),
  );
  await login(page.request, "second-technician");
  await page.reload();
  await expect(page.locator("#identity")).toHaveText(
    "SYN Morgan Technician · identity verified online",
  );
  await expect(page.locator("#workspace")).toBeVisible();
  await expect(page.locator("#queue .queue-row")).toHaveCount(0);
  await expect(page.locator("#jobs article")).toHaveCount(0);
  await expect(page.locator("body")).not.toContainText(
    "SYN-offline-evidence.png",
  );
  await expect(page.locator("body")).not.toContainText(
    originals[0].original.operation_id,
  );
  await screenshot(page, info, "identity-switch-isolation");
  await login(page.request, "assigned-technician");
  await page.reload();
  await expect(page.locator("#identity")).toHaveText(
    "SYN Riley Technician · identity verified online",
  );
  await expect(page.locator("#queue .queue-row")).toHaveCount(8);
  expect(
    (await localRows(page))
      .slice(0, 7)
      .map((x: { original: unknown }) => x.original),
  ).toEqual(originals.map((x: { original: unknown }) => x.original));
});
test("P08 real IndexedDB quota/abort, multi-tab claim, identity lock and schema retention", async ({
  page,
  context,
}, info) => {
  test.setTimeout(120000);
  const setup = await prepared(
    page,
    info.project.name.startsWith("desktop") ? "2026-12-18" : "2026-12-21",
  );
  await open(page, setup.appointment_id);
  await page
    .getByRole("button", { name: "Save provisional start intent", exact: true })
    .click();
  await note(page, "SYN quota boundary must retain this unsaved value");
  await page.evaluate(() => {
    const original = IDBObjectStore.prototype.add;
    IDBObjectStore.prototype.add = function (value, key) {
      if (this.name === "operations")
        throw new DOMException(
          "SYN actual IDB write failure",
          "QuotaExceededError",
        );
      return original.call(this, value, key);
    };
  });
  await page
    .getByRole("button", { name: "Save evidence on this device", exact: true })
    .click();
  await expect(page.locator("#error")).toContainText("QuotaExceededError");
  await expect(page.getByLabel("Finding", { exact: true })).toHaveValue(
    "SYN quota boundary must retain this unsaved value",
  );
  await expect(page.locator("#capture-form")).not.toContainText(
    "Saved on this device — awaiting",
  );
  expect(await localRows(page)).toHaveLength(1);
  await screenshot(page, info, "quota-failure-retained");
  page.on("dialog", (dialog) => dialog.accept());
  await page.reload();
  const tab = await context.newPage();
  await tab.goto("/offline/index.html");
  await expect(tab.locator("#workspace")).toBeVisible();
  const claimed = await page.evaluate(async () => {
    const path = "/offline/modules/offline/store.js",
      s = await import(path),
      p = (await s.ownership()).owner;
    await s.claim(p, "sender-a");
    return (await s.queue(p))[0].original;
  });
  const refused = await tab.evaluate(async () => {
    const path = "/offline/modules/offline/store.js",
      s = await import(path),
      p = (await s.ownership()).owner;
    return await s.claim(p, "sender-b");
  });
  expect(refused).toBeNull();
  const recovered = await tab.evaluate(async () => {
    const path = "/offline/modules/offline/store.js",
      s = await import(path),
      p = (await s.ownership()).owner;
    return await s.claim(p, "sender-b", Date.now() + 31000);
  });
  expect(recovered.sender).toBe("sender-b");
  await tab.close();
  const incompatible = await page.evaluate(async () => {
    const path = "/offline/modules/offline/store.js",
      protocol = "/offline/modules/offline/protocol.js",
      s = await import(path),
      h = await import(protocol),
      p = (await s.ownership()).owner,
      row = (await s.queue(p))[0],
      op = {
        ...row.original,
        schema_version: 2,
        operation_id: crypto.randomUUID(),
        payload: { ...row.original.payload, operation_id: "placeholder" },
      };
    op.payload.operation_id = op.operation_id;
    op.payload_hash = await h.sha256(h.canonical(h.original(op)));
    await s.commitOperations(p, [op]);
    return op;
  });
  const upgrade = await page.evaluate(async () => {
    const path = "/offline/modules/offline/store.js",
      s = await import(path),
      db = await s.openStore(3);
    const names = [...db.objectStoreNames];
    db.close();
    return names;
  });
  expect(upgrade).toContain("operations");
  await page.reload();
  await expect(page.locator("#error")).toContainText("VersionError");
  const persisted = await page.evaluate(
    async () =>
      new Promise<unknown[]>((resolve, reject) => {
        const r = indexedDB.open("PPO-offline-field", 3);
        r.onsuccess = () => {
          const tx = r.result.transaction("operations"),
            q = tx.objectStore("operations").getAll();
          q.onsuccess = () => resolve(q.result);
          q.onerror = () => reject(q.error);
          tx.oncomplete = () => r.result.close();
        };
        r.onerror = () => reject(r.error);
      }),
  );
  expect(persisted).toHaveLength(2);
  expect(persisted).toEqual(
    expect.arrayContaining([
      expect.objectContaining({ original: claimed }),
      expect.objectContaining({ original: incompatible }),
    ]),
  );
});
test("P08 persistent browser process restart retains two jobs and original evidence during actual offline navigation", async ({
  browserName,
}, info) => {
  expect(browserName).toBe("chromium");
  test.setTimeout(120000);
  const directory = await mkdtemp(join(tmpdir(), "ppo-p08-profile-")),
    viewport = info.project.use.viewport as { width: number; height: number };
  let context = await chromium.launchPersistentContext(directory, {
      headless: true,
      viewport,
      baseURL: origin,
    }),
    page = context.pages()[0];
  const one = await prepared(
      page,
      info.project.name.startsWith("desktop") ? "2026-12-23" : "2026-12-25",
    ),
    two = await prepared(
      page,
      info.project.name.startsWith("desktop") ? "2026-12-24" : "2026-12-28",
    );
  await open(page, one.appointment_id);
  await page
    .getByLabel("Assigned job to download")
    .selectOption(two.appointment_id);
  await page
    .getByRole("button", { name: "Download selected job", exact: true })
    .click();
  await expect(page.locator("#jobs article")).toHaveCount(2);
  await expect(page.locator("#notice")).toContainText(
    "Job context and exact pack saved",
  );
  await page
    .getByRole("button", { name: "Save provisional start intent", exact: true })
    .click();
  await expect(page.locator("#queue .queue-row")).toHaveCount(1);
  await context.setOffline(true);
  await note(page, "SYN persistent-profile restart original");
  await save(page);
  const before = await localRows(page);
  const workerPath = "public/offline/sw.js",
    worker = await readFile(workerPath, "utf8");
  try {
    const updated = worker.replace(
      "PPO-field-shell-",
      "PPO-field-shell-SYN-update-",
    );
    await writeFile(workerPath, updated);
    await context.setOffline(false);
    await page.evaluate(async () => {
      const r = await navigator.serviceWorker.getRegistration("/offline/");
      await r!.update();
    });
    await page.waitForFunction(
      async () =>
        !!(await navigator.serviceWorker.getRegistration("/offline/"))?.waiting,
    );
    expect(
      (await localRows(page)).map((x: { original: unknown }) => x.original),
    ).toEqual(before.map((x: { original: unknown }) => x.original));
    await writeFile(
      info.outputPath("P08-worker-update.json"),
      JSON.stringify(
        {
          scenario:
            "Real waiting service-worker update with pending original evidence",
          before_sha256: createHash("sha256").update(worker).digest("hex"),
          after_sha256: createHash("sha256").update(updated).digest("hex"),
          pending: before.map(
            (x: { original: { operation_id: string } }) =>
              x.original.operation_id,
          ),
        },
        null,
        2,
      ),
    );
  } finally {
    await writeFile(workerPath, worker);
  }
  await context.close();
  context = await chromium.launchPersistentContext(directory, {
    headless: true,
    viewport,
    baseURL: origin,
  });
  await context.setOffline(true);
  page = context.pages()[0];
  await page.goto("/offline/index.html");
  await expect(page.locator("#jobs article")).toHaveCount(2);
  await expect(page.locator("#queue .queue-row")).toHaveCount(2);
  expect(
    (await localRows(page)).map((x: { original: unknown }) => x.original),
  ).toEqual(before.map((x: { original: unknown }) => x.original));
  await screenshot(page, info, "persistent-browser-offline-restart");
  await context.setOffline(false);
  await page
    .getByRole("button", { name: "Send next batch / retry originals" })
    .click();
  await expect(page.locator("#queue .status")).toHaveText([
    "ServerSaved",
    "ServerSaved",
  ]);
  await context.close();
});

test("P08 UI time conflict keeps original local evidence and keyboard recovery controls", async ({
  page,
}, info) => {
  test.setTimeout(120000);
  const setup = await prepared(
    page,
    info.project.name.startsWith("desktop") ? "2026-12-29" : "2026-12-30",
  );
  await open(page, setup.appointment_id);
  await page
    .getByRole("button", { name: "Save provisional start intent", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Send next batch / retry originals" })
    .click();
  await expect(page.locator("#queue .status")).toHaveText(["ServerSaved"]);
  await page.getByLabel("Evidence type", { exact: true }).selectOption("Time");
  await page
    .getByLabel("Capture context", { exact: true })
    .fill("SYN controlled original time conflict; no inferred labour");
  const now =
    Math.floor(Date.now() / 1000) * 1000 -
    (info.project.name.startsWith("mobile") ? 259200000 : 172800000);
  await page
    .getByLabel("Actual start time (UTC)")
    .fill(new Date(now - 600000).toISOString());
  await page
    .getByLabel("Actual end time (UTC)")
    .fill(new Date(now).toISOString());
  await save(page);
  await page
    .getByRole("button", { name: "Send next batch / retry originals" })
    .click();
  await expect(page.locator("#queue .status")).toHaveText([
    "ServerSaved",
    "ServerSaved",
  ]);
  await save(page);
  await page
    .getByRole("button", { name: "Send next batch / retry originals" })
    .click();
  await expect(page.locator("#queue .status")).toHaveText([
    "ServerSaved",
    "ServerSaved",
    "Conflict",
  ]);
  await expect(page.locator("#queue")).toContainText("overlaps");
  const originals = (await localRows(page)).map(
    (x: { original: unknown }) => x.original,
  );
  await screenshot(page, info, "time-conflict-original-retained");
  const recovery = page.getByRole("button", {
    name: "Preserve original for service-owner review",
    exact: true,
  });
  await recovery.focus();
  await expect(recovery).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.locator("#queue")).toContainText(
    "Restricted recovery receipt",
  );
  await screenshot(page, info, "restricted-recovery-keyboard-focus");
  expect(
    (await localRows(page)).map((x: { original: unknown }) => x.original),
  ).toEqual(originals);
  const own = (await localRows(page)).at(-1).status.recovery;
  const detail = await call(page.request, `sync/recovery/${own.case_id}`);
  expect(detail.normal_acceptance).toBe(false);
  expect(Object.keys(detail).sort()).toEqual(
    [
      "case_id",
      "disposition",
      "normal_acceptance",
      "operation_id",
      "payload_hash",
      "received_at",
      "recovery_receipt_id",
    ].sort(),
  );
  const job = (await call(page.request, `my-jobs/${setup.appointment_id}`))
    .items[0];
  expect(job.entries).toHaveLength(1);
  expect(job.status).toBe("InProgress");
  await writeFile(
    info.outputPath("P08-exception-originals.json"),
    JSON.stringify(
      { originals, case: detail, server_entry_count: job.entries.length },
      null,
      2,
    ),
  );
  await login(page.request, "coordinator");
  await page.reload();
  await page
    .getByRole("button", { name: "Load owned recovery cases", exact: true })
    .click();
  const ownedCase = page
    .locator("#review-cases article")
    .filter({ hasText: own.case_id });
  await expect(ownedCase).toBeVisible();
  await ownedCase
    .getByLabel("Owned disposition")
    .selectOption("ClarificationRequired");
  await ownedCase
    .getByLabel("Disposition note")
    .fill(
      "SYN service owner will reconcile the overlapping original before any reviewed entry set",
    );
  await ownedCase
    .getByRole("button", { name: "Record owned disposition", exact: true })
    .click();
  await expect(page.locator("#notice")).toContainText(
    "Owned disposition recorded",
  );
  await screenshot(page, info, "service-owner-disposition");
});
