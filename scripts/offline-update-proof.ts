import assert from "node:assert/strict";
import { createHash, randomUUID } from "node:crypto";
import { execFileSync, spawn } from "node:child_process";
import { mkdir, open, readFile, writeFile } from "node:fs/promises";
import { createServer } from "node:net";
import { resolve, join } from "node:path";
import { chromium, expect, type Page } from "@playwright/test";
import { localConfig } from "../src/platform/config";
import { database, closeDatabase } from "../src/platform/database";
import {
  browserChannel,
  assertSupportedBrowser,
} from "../src/platform/browser";
import { prepareFieldAppointment } from "../tests/helpers/field-http";
import { base, png } from "../tests/helpers/field";
import type { WireOperation, Receipt } from "../src/offline/protocol";

// An explicit, local three-phase release rehearsal. The caller migrates the
// disposable database between prepare and verify; this script never resets it,
// changes policy, downgrades schema, or restores a possibly processed original.
const [phase, releaseArgument, rootArgument] = process.argv.slice(2);
assert.ok(["prepare", "verify", "rollback"].includes(phase));
assert.ok(
  releaseArgument && rootArgument,
  "Supply release checkout and private proof directory",
);
const config = localConfig();
assert.equal(config.database_name, "ppo_synthetic_test");
assert.equal(
  config.port,
  3000,
  "The retained field fixture uses the explicit loopback origin",
);
const release = resolve(releaseArgument),
  root = resolve(rootArgument);
const privateDirectory = join(root, "private"),
  evidence = join(root, "review");
const profile = join(privateDirectory, "profile"),
  proofPath = join(privateDirectory, "before.json");
await mkdir(privateDirectory, { recursive: true, mode: 0o700 });
await mkdir(evidence, { recursive: true });
const hash = (v: string | Buffer) =>
  createHash("sha256").update(v).digest("hex");
const git = (...args: string[]) =>
  execFileSync("git", args, { cwd: release, encoding: "utf8" }).trim();
assert.equal(git("status", "--porcelain"), "", "Release source must be clean");
const identity = {
  head: git("rev-parse", "HEAD"),
  source_tree: git("rev-parse", "HEAD:src"),
  database_tree: git("rev-parse", "HEAD:db"),
  public_tree: git("rev-parse", "HEAD:public"),
  package_lock_sha256: hash(await readFile(join(release, "package-lock.json"))),
  build: (await readFile(join(release, ".next/BUILD_ID"), "utf8")).trim(),
  worker_sha256: hash(await readFile(join(release, "public/offline/sw.js"))),
  offline_app_sha256: hash(
    await readFile(join(release, "public/offline/modules/offline/app.js")),
  ),
};
type Row = {
  original: WireOperation;
  status: { state: string; code?: string; receipt?: Receipt };
};
type Proof = {
  identity: typeof identity;
  appointment_id: string;
  pack_issue_id: string;
  originals: WireOperation[];
  prior_receipts: Receipt[];
  pending_id: string;
  unsupported_id: string;
  pack_outputs: Record<string, string>;
  migrations: { version: number; sha256: string }[];
  system_identifier: string;
};
async function rows(page: Page): Promise<Row[]> {
  return page.evaluate(async () => {
    const path = "/offline/modules/offline/store.js",
      store = await import(path);
    return store.queue((await store.ownership()).owner);
  });
}
async function localPhoto(page: Page, operation: string) {
  return page.evaluate(async (id) => {
    const path = "/offline/modules/offline/store.js",
      protocol = "/offline/modules/offline/protocol.js";
    const store = await import(path),
      crypto = await import(protocol);
    const bytes = await store.bytesFor((await store.ownership()).owner, id);
    return crypto.sha256(new Uint8Array(await bytes.bytes.arrayBuffer()));
  }, operation);
}
async function call(page: Page, path: string, body?: unknown) {
  const response = await page.request.fetch(`${config.origin}/api/v1/${path}`, {
    method: body === undefined ? "GET" : "POST",
    headers: body === undefined ? {} : { Origin: config.origin },
    data: body,
  });
  assert.ok(response.ok(), `Synthetic ${path} returned ${response.status()}`);
  return response.json();
}
async function packOutputs(page: Page, id: string) {
  const outputs: Record<string, string> = {};
  for (const format of ["html", "pdf", "manifest"]) {
    const response = await page.request.get(
      `${config.origin}/api/v1/pack-issues/${id}/${format}`,
    );
    assert.ok(response.ok());
    outputs[format] = hash(await response.body());
  }
  return outputs;
}
async function capture(page: Page, name: string) {
  await page.screenshot({
    path: join(evidence, `${name}.png`),
    fullPage: true,
  });
}
const migrations = (
  await database().query(
    "SELECT version,sha256 FROM public.ppo_migrations ORDER BY version",
  )
).rows;
const systemIdentifier = (
  await database().query(
    "SELECT system_identifier::text FROM pg_control_system()",
  )
).rows[0].system_identifier;
// Refuse an already occupied port rather than accidentally testing another app.
await new Promise<void>((done, reject) => {
  const probe = createServer();
  probe.once("error", reject);
  probe.listen(config.port, "127.0.0.1", () => probe.close(() => done()));
});
const log = await open(
  join(privateDirectory, `${phase}-server.log`),
  "w",
  0o600,
);
const server = spawn(
  process.execPath,
  ["--import", "tsx", "scripts/local-server.ts", "--compiled"],
  {
    cwd: release,
    env: process.env,
    stdio: ["ignore", log.fd, log.fd],
    windowsHide: true,
  },
);
let context:
  Awaited<ReturnType<typeof chromium.launchPersistentContext>> | undefined;
const errors: string[] = [];
async function browser() {
  context = await chromium.launchPersistentContext(profile, {
    channel: browserChannel,
    headless: true,
    baseURL: config.origin,
    viewport: { width: 390, height: 844 },
    timezoneId: "UTC",
  });
  const page = context.pages()[0];
  page.on("pageerror", (error) => errors.push(error.message));
  const cdp = await context.newCDPSession(page);
  const version = (await cdp.send("Browser.getVersion")).product.replace(
    /^Chrome\//,
    "",
  );
  await cdp.detach();
  assertSupportedBrowser(version);
  return { page, version };
}
try {
  await expect
    .poll(
      async () => {
        assert.equal(
          server.exitCode,
          null,
          "Owned release process exited during startup",
        );
        try {
          return (await fetch(config.origin)).ok;
        } catch {
          return false;
        }
      },
      { timeout: 60000 },
    )
    .toBe(true);
  let { page, version } = await browser();
  if (phase === "prepare") {
    assert.equal(migrations.at(-1).version, 49);
    await call(page, "local-session", { profile: "coordinator" });
    const setup = await prepareFieldAppointment(
      (path, body) => call(page, path, body),
      "2026-12-07",
    );
    for (const actorProfile of ["assigned-technician", "second-technician"]) {
      const actor = await call(page, "local-session", {
        profile: actorProfile,
      });
      const recipient = setup.pack.readiness.recipients.find(
        (r: { user_id: string }) => r.user_id === actor.actor_id,
      );
      await call(
        page,
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
    await call(page, "local-session", { profile: "assigned-technician" });
    const outputs = await packOutputs(page, setup.pack.current_issue_id);
    await page.goto("/offline/index.html");
    await expect(page.locator("#workspace")).toBeVisible();
    await page.waitForFunction(() => !!navigator.serviceWorker.controller);
    await page
      .getByLabel("Assigned job to download")
      .selectOption(setup.appointment_id);
    await page
      .getByRole("button", { name: "Download selected job", exact: true })
      .click();
    await expect(page.locator("#notice")).toContainText(
      "Job context and exact pack saved",
    );
    await context!.setOffline(true);
    await page.reload();
    await page
      .getByRole("button", { name: "Open saved field job", exact: true })
      .click();
    await page
      .getByRole("button", {
        name: "Save provisional start intent",
        exact: true,
      })
      .click();
    await expect(page.locator("#queue .queue-row")).toHaveCount(1);
    async function observation(text: string, count: number) {
      await page
        .getByLabel("Evidence type", { exact: true })
        .selectOption("Observation");
      await page.getByLabel("Finding", { exact: true }).fill(text);
      await page
        .getByLabel("Attempted fix", { exact: true })
        .fill("SYN external visual check only");
      await page
        .getByLabel("Result, including unsuccessful work", { exact: true })
        .fill("SYN finding retained for review");
      await page
        .getByLabel("Capture context", { exact: true })
        .fill("SYN pre-update schema-1 original");
      await page
        .getByRole("button", {
          name: "Save evidence on this device",
          exact: true,
        })
        .click();
      await expect(page.locator("#queue .queue-row")).toHaveCount(count);
    }
    await observation(
      "SYN accepted before application update; receipt response will be lost",
      2,
    );
    await page
      .getByLabel("Evidence type", { exact: true })
      .selectOption("Photo");
    await page.getByLabel("Original synthetic PNG").setInputFiles({
      name: "SYN-before-update.png",
      mimeType: "image/png",
      buffer: png(),
    });
    await page
      .getByLabel("Photo caption")
      .fill("SYN immutable pre-update PNG original");
    await page
      .getByRole("button", {
        name: "Save evidence on this device",
        exact: true,
      })
      .click();
    await expect(page.locator("#queue .queue-row")).toHaveCount(6);
    let accepted:
      { outcomes: { state: string; receipt: Receipt }[] } | undefined;
    await page.route("**/api/v1/sync/operations", async (route) => {
      accepted = await (await route.fetch()).json();
      await route.abort("failed");
    });
    await context!.setOffline(false);
    await page
      .getByRole("button", { name: "Send next batch / retry originals" })
      .click();
    await expect
      .poll(
        async () =>
          (await rows(page)).filter((r) => r.status.code === "OutcomeUncertain")
            .length,
      )
      .toBe(6);
    assert.ok(accepted?.outcomes.every((r) => r.state === "ServerSaved"));
    await page.unroute("**/api/v1/sync/operations");
    await context!.setOffline(true);
    await observation(
      "SYN queued on old application and never submitted before update",
      7,
    );
    const pending = (await rows(page)).at(-1)!.original;
    // A deliberately unsupported fixture exercises retention. Normal UI never
    // emits schema 2; use the same hash/owner-checked writer as the P12 proof.
    const unsupportedId = randomUUID();
    await page.evaluate(
      async ({ pending, id }) => {
        const path = "/offline/modules/offline/store.js",
          protocol = "/offline/modules/offline/protocol.js";
        const store = await import(path),
          crypto = await import(protocol);
        const original = {
          ...pending,
          schema_version: 2,
          operation_id: id,
          payload: {
            ...pending.payload,
            id,
            operation_id: id,
          },
        };
        original.payload_hash = await crypto.sha256(
          crypto.canonical(crypto.original(original)),
        );
        await store.commitOperations((await store.ownership()).owner, [
          original,
        ]);
      },
      { pending, id: unsupportedId },
    );
    await page.reload();
    const originals = (await rows(page)).map((r) => r.original);
    assert.equal(originals.length, 8);
    assert.ok(originals.filter((o) => o.schema_version === 1).length === 7);
    const upload = originals.find((o) => o.command === "AttachmentUpload")!;
    assert.equal(await localPhoto(page, upload.operation_id), hash(png()));
    const proof: Proof = {
      identity,
      appointment_id: setup.appointment_id,
      pack_issue_id: setup.pack.current_issue_id,
      originals,
      prior_receipts: accepted!.outcomes.map((r) => r.receipt),
      pending_id: pending.operation_id,
      unsupported_id: unsupportedId,
      pack_outputs: outputs,
      migrations,
      system_identifier: systemIdentifier,
    };
    await writeFile(proofPath, JSON.stringify(proof, null, 2), {
      flag: "wx",
      mode: 0o600,
    });
    await capture(page, "before-update");
    await writeFile(
      join(evidence, "prepared.json"),
      JSON.stringify(
        {
          identity,
          browser: version,
          supported_originals: 7,
          accepted_response_lost: 6,
          queued_unsubmitted: 1,
          unsupported_fixture: 1,
          pack_outputs: outputs,
          png_sha256: hash(png()),
          migration_version: 49,
          originals_sha256: hash(JSON.stringify(originals)),
        },
        null,
        2,
      ),
    );
  } else {
    const before: Proof = JSON.parse(await readFile(proofPath, "utf8"));
    assert.equal(
      systemIdentifier,
      before.system_identifier,
      "Continue the same database, without restore",
    );
    assert.deepEqual(
      migrations.slice(0, before.migrations.length),
      before.migrations,
    );
    assert.equal(migrations.length, before.migrations.length + 1);
    assert.equal(migrations.at(-1).version, 50);
    const expected =
      phase === "verify"
        ? before.identity
        : JSON.parse(await readFile(join(evidence, "verified.json"), "utf8"))
            .identity;
    assert.notEqual(identity.head, expected.head);
    assert.notEqual(identity.build, expected.build);
    assert.notEqual(identity.worker_sha256, expected.worker_sha256);
    if (phase === "rollback") assert.deepEqual(identity, before.identity);
    await page.goto("/offline/index.html");
    await expect(page.locator("#workspace")).toBeVisible();
    assert.deepEqual(
      (await rows(page)).map((r) => r.original),
      before.originals,
    );
    // Exercise real worker update lifecycle: an open old client retains its
    // shell; the installed successor waits. Never force skipWaiting or clear
    // caches, registrations, IndexedDB, cookies or originals.
    await page.evaluate(async () => {
      await (await navigator.serviceWorker.getRegistration(
        "/offline/",
      ))!.update();
    });
    await page.waitForFunction(
      async () =>
        !!(await navigator.serviceWorker.getRegistration("/offline/"))?.waiting,
      undefined,
      { timeout: 30000 },
    );
    const shellHash = () =>
      page.evaluate(async () => {
        const bytes = await (
          await fetch("/offline/modules/offline/app.js")
        ).arrayBuffer();
        return [...new Uint8Array(await crypto.subtle.digest("SHA-256", bytes))]
          .map((x) => x.toString(16).padStart(2, "0"))
          .join("");
      });
    assert.equal(
      await shellHash(),
      expected.offline_app_sha256,
      "Open client keeps its previous shell",
    );
    assert.deepEqual(
      (await rows(page)).map((r) => r.original),
      before.originals,
    );
    await capture(page, `${phase}-waiting`);
    await context!.close();
    context = undefined;
    ({ page, version } = await browser());
    await page.goto("/offline/index.html");
    await expect(page.locator("#workspace")).toBeVisible();
    await expect
      .poll(shellHash, { timeout: 30000 })
      .toBe(identity.offline_app_sha256);
    assert.deepEqual(
      (await rows(page)).map((r) => r.original),
      before.originals,
    );
    const upload = before.originals.find(
      (o) => o.command === "AttachmentUpload",
    )!;
    assert.equal(await localPhoto(page, upload.operation_id), hash(png()));
    assert.deepEqual(
      await packOutputs(page, before.pack_issue_id),
      before.pack_outputs,
    );
    const priorFacts = async () =>
      (
        await database().query(
          "SELECT operation_id,payload_hash,receipt_id FROM ppo.sync_acceptances WHERE operation_id=ANY($1::uuid[]) ORDER BY operation_id",
          [before.originals.map((o) => o.operation_id)],
        )
      ).rows;
    const existing = await priorFacts();
    assert.equal(existing.length, phase === "verify" ? 6 : 7);
    for (let attempt = 0; attempt < 2; attempt++) {
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
      await expect
        .poll(
          async () =>
            (await rows(page)).find(
              (r) => r.original.operation_id === before.unsupported_id,
            )?.status.code,
        )
        .toBe("PayloadVersionUnsupported");
      await expect(
        page.getByRole("button", { name: "Send next batch / retry originals" }),
      ).toBeEnabled();
    }
    const after = await rows(page),
      facts = await priorFacts();
    assert.equal(facts.length, 7);
    assert.deepEqual(
      after.map((r) => r.original),
      before.originals,
    );
    for (const receipt of before.prior_receipts)
      assert.deepEqual(
        after.find((r) => r.original.operation_id === receipt.operation_id)!
          .status.receipt,
        receipt,
      );
    assert.ok(
      after.find((r) => r.original.operation_id === before.pending_id)!.status
        .receipt,
    );
    assert.equal(
      after.find((r) => r.original.operation_id === before.unsupported_id)!
        .status.state,
      "ReviewRequired",
    );
    for (const fact of facts) {
      assert.equal(
        fact.payload_hash,
        before.originals.find((o) => o.operation_id === fact.operation_id)!
          .payload_hash,
      );
      assert.equal(
        fact.receipt_id,
        after.find((r) => r.original.operation_id === fact.operation_id)!.status
          .receipt!.receipt_id,
      );
    }
    const job = (await call(page, `my-jobs/${before.appointment_id}`)).items[0];
    assert.equal(job.entries.length, 3);
    assert.equal(job.status, "InProgress");
    assert.equal(job.draft, null);
    const response = await page.request.get(
      `${config.origin}/api/v1/attachments/${job.attachments[0].id}/bytes`,
    );
    assert.ok(response.ok());
    assert.equal(hash(await response.body()), hash(png()));
    assert.deepEqual(
      await packOutputs(page, before.pack_issue_id),
      before.pack_outputs,
    );
    const retained = {
      facts,
      entries_sha256: hash(JSON.stringify(job.entries)),
      attendance: job.attendance,
      outputs: before.pack_outputs,
      originals_sha256: hash(JSON.stringify(before.originals)),
    };
    if (phase === "verify")
      await writeFile(
        join(privateDirectory, "after.json"),
        JSON.stringify(retained),
        { mode: 0o600 },
      );
    else
      assert.deepEqual(
        retained,
        JSON.parse(
          await readFile(join(privateDirectory, "after.json"), "utf8"),
        ),
      );
    await capture(page, `${phase}-retained`);
    await writeFile(
      join(evidence, phase === "verify" ? "verified.json" : "rollback.json"),
      JSON.stringify(
        {
          identity,
          previous_identity: expected,
          browser: version,
          node: process.version,
          platform: process.platform,
          migration_version: 50,
          retained_migration_checksums: before.migrations.length,
          same_database: true,
          app_pid: server.pid,
          supported_originals: 7,
          prior_receipts_recovered: 6,
          newly_accepted: phase === "verify" ? 1 : 0,
          unsupported_retained: 1,
          exact_png_sha256: hash(png()),
          pack_outputs: before.pack_outputs,
          originals_sha256: retained.originals_sha256,
          acceptance_facts: facts,
          page_errors: errors,
          limits:
            "Local compiled update/rollback component. No schema downgrade, policy publication, Finance/external outcome, backup restore, hosted deployment, physical-device or complete PT-28 acceptance.",
        },
        null,
        2,
      ),
    );
  }
  assert.deepEqual(errors, []);
  console.log(
    `PT-28 ${phase}: original ownership, bytes, schema and receipt assertions passed.`,
  );
} finally {
  await context?.close();
  server.kill("SIGTERM");
  if (server.exitCode === null)
    await new Promise<void>((done) => server.once("exit", () => done()));
  await log.close();
  await closeDatabase();
}
