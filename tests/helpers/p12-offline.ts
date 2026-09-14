import assert from "node:assert/strict";
import { spawn, execFile } from "node:child_process";
import { promisify } from "node:util";
import { mkdir, readFile, writeFile, copyFile, chmod } from "node:fs/promises";
import { join } from "node:path";
import { chromium, expect, type Page } from "@playwright/test";
import {
  browserChannel,
  assertSupportedBrowser,
} from "../../src/platform/browser";
import type { WireOperation, Receipt } from "../../src/offline/protocol";
import { digest } from "../../src/documents/store";
import { png } from "./field";

const execute = promisify(execFile),
  origin = "http://127.0.0.1:3000";
type LocalRow = {
  original: WireOperation;
  status: { state: string; code?: string; receipt?: Receipt };
};
type OfflineProof = {
  appointment_id: string;
  originals: WireOperation[];
  accepted: {
    outcomes: { operation_id: string; state: string; receipt: Receipt }[];
  };
  all_originals: WireOperation[];
  pending_id: string;
  unsupported_id: string;
  local_png_sha256: string;
  browser_version: string;
};
async function rows(page: Page): Promise<LocalRow[]> {
  return page.evaluate(async () => {
    const path = "/offline/modules/offline/store.js",
      s = await import(path);
    return s.queue((await s.ownership()).owner);
  });
}
async function fileHash(page: Page, operationId: string) {
  return page.evaluate(async (id) => {
    const path = "/offline/modules/offline/store.js",
      protocol = "/offline/modules/offline/protocol.js";
    const s = await import(path),
      h = await import(protocol),
      owner = (await s.ownership()).owner;
    const file = await s.bytesFor(owner, id);
    return {
      hash: await h.sha256(new Uint8Array(await file.bytes.arrayBuffer())),
      bytes: file.byte_count,
    };
  }, operationId);
}
async function withBrowser<T>(
  profile: string,
  work: (page: Page, version: string) => Promise<T>,
) {
  const server = spawn(
    process.execPath,
    ["--env-file=.env.local", "--import", "tsx", "scripts/local-server.ts"],
    { stdio: "ignore" },
  );
  let context:
    Awaited<ReturnType<typeof chromium.launchPersistentContext>> | undefined;
  try {
    let ready = false;
    for (let n = 0; n < 120; n++) {
      if (server.exitCode !== null)
        throw Error("P12 offline application startup failed.");
      try {
        if ((await fetch(origin)).ok) {
          ready = true;
          break;
        }
      } catch {}
      await new Promise((r) => setTimeout(r, 250));
    }
    assert.ok(ready, "P12 offline application became ready");
    context = await chromium.launchPersistentContext(profile, {
      channel: browserChannel,
      headless: true,
      baseURL: origin,
      viewport: { width: 390, height: 844 },
    });
    const page = context.pages()[0],
      cdp = await context.newCDPSession(page);
    const version = (await cdp.send("Browser.getVersion")).product.replace(
      /^Chrome\//,
      "",
    );
    await cdp.detach();
    assertSupportedBrowser(version);
    await page.goto("/offline/index.html");
    await expect(page.locator("#workspace")).toBeVisible();
    return await work(page, version);
  } finally {
    await context?.close();
    server.kill("SIGTERM");
    await new Promise<void>((resolve) => {
      if (server.exitCode !== null) resolve();
      else server.once("exit", () => resolve());
    });
  }
}
async function capture(page: Page, scenario: string, version: string) {
  const directory = "verification-evidence/p12-recovery/offline";
  await mkdir(directory, { recursive: true });
  const bytes = await page.screenshot({
    path: join(directory, `${scenario}.png`),
    fullPage: true,
  });
  await writeFile(
    join(directory, `${scenario}.json`),
    JSON.stringify(
      {
        scenario,
        viewport: page.viewportSize(),
        sha256: digest(bytes),
        byte_count: bytes.length,
        source_head: process.env.PPO_SOURCE_HEAD ?? process.env.GITHUB_SHA,
        executed_checkout: (
          await execute("git", ["rev-parse", "HEAD"])
        ).stdout.trim(),
        executed_tree: (
          await execute("git", ["rev-parse", "HEAD^{tree}"])
        ).stdout.trim(),
        run_id: process.env.GITHUB_RUN_ID,
        run_attempt: process.env.GITHUB_RUN_ATTEMPT,
        browser_version: version,
      },
      null,
      2,
    ),
  );
}

export async function prepareOfflineRecovery(root: string) {
  const temporary = join(root, "offline-source"),
    originalDirectory = join(temporary, "ppo-p08-restart"),
    profile = join(originalDirectory, "profile");
  await mkdir(temporary, { recursive: true, mode: 0o700 });
  // Execute the unchanged accepted six-original UI/HTTP procedure. Each phase
  // actually closes its application and persistent browser before returning.
  for (const phase of ["write", "accept"]) {
    try {
      await execute(
        process.execPath,
        [
          "--env-file=.env.local",
          "--import",
          "tsx",
          "scripts/offline-restart-proof.ts",
          phase,
        ],
        {
          env: { ...process.env, RUNNER_TEMP: temporary },
          timeout: 180000,
          maxBuffer: 8 * 1024 * 1024,
        },
      );
    } catch {
      throw Error(
        `P12 original offline ${phase} procedure failed; no profile or private subprocess output is published.`,
      );
    }
    const evidence = join(
      "verification-evidence/p12-recovery/offline",
      `original-${phase}`,
    );
    await mkdir(evidence, { recursive: true });
    for (const extension of ["png", "json"])
      await copyFile(
        `verification-evidence/p08-restart/${phase}.${extension}`,
        join(evidence, `${phase}.${extension}`),
      );
  }
  const original = JSON.parse(
    await readFile(join(originalDirectory, "proof.json"), "utf8"),
  ) as OfflineProof;
  const proof = await withBrowser(profile, async (page, version) => {
    const before = await rows(page);
    assert.equal(before.length, 6);
    assert.deepEqual(
      before.map((r) => r.original),
      original.originals,
    );
    assert.ok(before.every((r) => r.status.state !== "ServerSaved"));
    assert.ok(
      original.accepted.outcomes.every((r) => r.state === "ServerSaved"),
    );
    // A supported pending original and a future-version fixture exercise the
    // same durable, owner/hash-checked IndexedDB writer as the accepted P08 gate.
    const added = await page.evaluate(async () => {
      const path = "/offline/modules/offline/store.js",
        protocol = "/offline/modules/offline/protocol.js";
      const s = await import(path),
        h = await import(protocol),
        owner = (await s.ownership()).owner;
      const source =
        (await s.queue(owner)).find(
          (r: LocalRow) =>
            r.original.command === "Capture" &&
            r.original.payload.type === "Observation",
        )?.original ??
        (await s.queue(owner)).find(
          (r: LocalRow) => r.original.command === "Capture",
        )!.original;
      const operations = [];
      for (const schema_version of [1, 2]) {
        const operation_id = crypto.randomUUID(),
          op = {
            ...source,
            schema_version,
            operation_id,
            payload: {
              ...source.payload,
              id: crypto.randomUUID(),
              operation_id,
            },
          };
        op.payload_hash = await h.sha256(h.canonical(h.original(op)));
        operations.push(op);
      }
      await s.commitOperations(owner, operations);
      return {
        pending_id: operations[0].operation_id,
        unsupported_id: operations[1].operation_id,
      };
    });
    const originals = (await rows(page)).map((r) => r.original);
    assert.equal(originals.length, 8);
    const upload = originals.find((r) => r.command === "AttachmentUpload")!;
    const file = await fileHash(page, upload.operation_id);
    assert.equal(file.hash, digest(png()));
    assert.equal(file.bytes, png().length);
    await page.context().setOffline(true);
    await page.reload();
    await expect(page.locator("#queue .queue-row")).toHaveCount(8);
    await capture(page, "source-accepted-response-lost-and-pending", version);
    return {
      ...original,
      ...added,
      all_originals: originals,
      local_png_sha256: file.hash,
      browser_version: version,
    };
  });
  await chmod(profile, 0o700);
  // Retain the exact private harness metadata with the closed profile so the
  // restore needs no file from the old profile or source environment.
  await writeFile(
    join(profile, "ppo-p12-original-proof.json"),
    JSON.stringify(proof),
    { flag: "wx", mode: 0o600 },
  );
  return { profile, proof };
}

export async function verifyOfflineRecovery(profile: string) {
  const proof = JSON.parse(
    await readFile(join(profile, "ppo-p12-original-proof.json"), "utf8"),
  ) as OfflineProof;
  return withBrowser(profile, async (page, version) => {
    assert.deepEqual(
      (await rows(page)).map((r) => r.original),
      proof.all_originals,
    );
    const upload = proof.all_originals.find(
      (r) => r.command === "AttachmentUpload",
    )!;
    assert.equal(
      (await fileHash(page, upload.operation_id)).hash,
      proof.local_png_sha256,
    );
    await capture(page, "restored-before-original-recovery", version);
    await page
      .getByRole("button", { name: "Send next batch / retry originals" })
      .click();
    await expect
      .poll(
        async () =>
          (await rows(page)).filter((r) => r.status.state === "ServerSaved")
            .length,
        { timeout: 30000 },
      )
      .toBe(7);
    const saved = await rows(page),
      unsupported = saved.find(
        (r) => r.original.operation_id === proof.unsupported_id,
      )!;
    assert.equal(unsupported.status.state, "ReviewRequired");
    assert.equal(unsupported.status.code, "PayloadVersionUnsupported");
    for (const outcome of proof.accepted.outcomes)
      assert.deepEqual(
        saved.find((r) => r.original.operation_id === outcome.operation_id)!
          .status.receipt,
        outcome.receipt,
      );
    assert.deepEqual(
      saved.map((r) => r.original),
      proof.all_originals,
    );
    assert.ok(
      saved.find((r) => r.original.operation_id === proof.pending_id)!.status
        .receipt,
    );
    const response = await page.request.get(
      `${origin}/api/v1/my-jobs/${proof.appointment_id}`,
    );
    assert.ok(response.ok());
    const job = (await response.json()).items[0];
    assert.equal(job.entries.length, 3);
    assert.equal(job.status, "InProgress");
    assert.equal(job.draft, null);
    const image = await page.request.get(
      `${origin}/api/v1/attachments/${job.attachments[0].id}/bytes`,
    );
    assert.deepEqual(await image.body(), png());
    await capture(
      page,
      "original-receipts-recovered-unsupported-retained",
      version,
    );
    // Use the actual saved-workspace lock before changing identity. The next
    // owner must not acquire these originals through the normal local API.
    await page
      .getByRole("button", { name: "Lock saved workspace", exact: true })
      .click();
    await expect(page.locator("#workspace")).toBeHidden();
    await page.request.post(`${origin}/api/v1/local-session`, {
      headers: { Origin: origin },
      data: { profile: "coordinator" },
    });
    await page.reload();
    const locked = await page.evaluate(async () => {
      const path = "/offline/modules/offline/store.js",
        s = await import(path);
      return (await s.ownership())?.locked;
    });
    assert.equal(locked, true);
    const retained = await page.evaluate(async () => {
      const path = "/offline/modules/offline/store.js",
        s = await import(path);
      const db = await s.openStore();
      const originals = await new Promise<WireOperation[]>(
        (resolve, reject) => {
          const tx = db.transaction("operations"),
            request = tx.objectStore("operations").getAll();
          request.onsuccess = () =>
            resolve(request.result.map((r: LocalRow) => r.original));
          request.onerror = () => reject(request.error);
        },
      );
      db.close();
      return originals;
    });
    assert.deepEqual(
      retained.map((r) => r.payload_hash).sort(),
      proof.all_originals.map((r) => r.payload_hash).sort(),
    );
    await capture(page, "restored-profile-owner-change-locked", version);
    return {
      original_count: 8,
      exact_prior_receipts: 6,
      newly_accepted_originals: 1,
      unsupported_retained: 1,
      png_sha256: digest(png()),
      owner_change_locked: true,
      browser_version: version,
      originals: saved.map((r) => ({
        operation_id: r.original.operation_id,
        payload_hash: r.original.payload_hash,
        schema_version: r.original.schema_version,
        state: r.status.state,
        receipt_id: r.status.receipt?.receipt_id ?? null,
      })),
    };
  });
}
