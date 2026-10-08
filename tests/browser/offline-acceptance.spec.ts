import {
  test,
  expect,
  chromium,
  type Page,
  type TestInfo,
} from "@playwright/test";
import { mkdtemp, writeFile, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createHash, randomUUID } from "node:crypto";
import { execFileSync } from "node:child_process";
import { png, draft, principal } from "../helpers/field";
import { operation, rehash } from "../helpers/offline";
import {
  origin,
  prepared,
  open,
  note,
  save,
  call,
  login,
  localRows,
} from "../helpers/offline-browser";
import { changeAuthority } from "../helpers/offline-authority";
import { closeDatabase, database } from "../../src/platform/database";
import { localConfig } from "../../src/platform/config";
import type {
  WireOperation,
  Outcome,
  Receipt,
} from "../../src/offline/protocol";

test.beforeAll(() => {
  if (!process.env.DATABASE_URL) process.loadEnvFile(".env.local");
  if (localConfig().database_name !== "ppo_synthetic_test")
    throw Error(
      "Acceptance requires an isolated disposable synthetic test database.",
    );
});
test.afterAll(closeDatabase);
type Row = {
  original: WireOperation;
  status: {
    state: string;
    receipt?: Receipt;
    code?: string;
    recovery?: {
      case_id: string;
      normal_acceptance: boolean;
      disposition: string;
    };
  };
};
const rows = (page: Page): Promise<Row[]> => localRows(page);
const hash = (bytes: Uint8Array | string) =>
  createHash("sha256").update(bytes).digest("hex");
async function send(page: Page) {
  const button = page.getByRole("button", {
    name: "Send next batch / retry originals",
    exact: true,
  });
  // Observe the real request's success or failure before the ordinary 5s UI
  // readiness assertion. The application's 15s network deadline still applies.
  const sent = page.waitForRequest(
    (request) => new URL(request.url()).pathname === "/api/v1/sync/operations",
  );
  await button.click();
  await (await sent).response();
  await expect(button).toBeEnabled();
}
async function photo(page: Page) {
  await page.getByLabel("Evidence type", { exact: true }).selectOption("Photo");
  await page.getByLabel("Original synthetic PNG").setInputFiles({
    name: "SYN-acceptance.png",
    mimeType: "image/png",
    buffer: png(),
  });
  await page
    .getByLabel("Photo caption")
    .fill("SYN original acceptance fixture; no operational image");
  await page
    .getByLabel("Capture context", { exact: true })
    .fill("SYN PT acceptance within the original downloaded inspection scope");
}
async function snapshot(page: Page) {
  return page.evaluate(async () => {
    const path = "/offline/modules/offline/store.js",
      s = await import(path),
      owner = (await s.ownership()).owner;
    const queue = await s.queue(owner),
      jobs = await s.contexts(owner),
      files = [];
    for (const row of queue) {
      if (row.original.command !== "AttachmentUpload") continue;
      const file = await s.bytesFor(owner, row.original.operation_id);
      files.push({
        operation_id: file.operation_id,
        sha256: file.sha256,
        byte_count: file.byte_count,
        bytes: [...new Uint8Array(await file.bytes.arrayBuffer())],
      });
    }
    // Recovery capabilities and cookies deliberately never leave the browser.
    return {
      jobs: jobs.map(
        (j: {
          job: { id: string };
          authority: unknown;
          verified_at: string;
          locked?: boolean;
        }) => ({
          id: j.job.id,
          authority: j.authority,
          verified_at: j.verified_at,
          locked: !!j.locked,
        }),
      ),
      originals: queue.map(
        (r: { original: WireOperation }) => r.original,
      ) as WireOperation[],
      files,
    };
  });
}
async function evidence(
  page: Page,
  info: TestInfo,
  id: string,
  result: unknown,
) {
  await writeFile(
    info.outputPath(`${id}.json`),
    JSON.stringify(
      {
        procedure: id,
        captured_at: new Date().toISOString(),
        browser: await page.evaluate(() => navigator.userAgent),
        viewport: page.viewportSize(),
        project: info.project.name,
        source_head: execFileSync("git", ["rev-parse", "HEAD"], {
          encoding: "utf8",
        }).trim(),
        source_patch_sha256: hash(
          execFileSync("git", [
            "diff",
            "HEAD",
            "--",
            "src",
            "tests",
            "scripts",
          ]),
        ),
        source_files: Object.fromEntries(
          await Promise.all(
            [
              "tests/browser/offline-acceptance.spec.ts",
              "tests/helpers/offline-browser.ts",
              "tests/helpers/offline-authority.ts",
            ].map(async (path) => [path, hash(await readFile(path))]),
          ),
        ),
        result,
      },
      null,
      2,
    ),
  );
}

test("PT-11 two jobs retain note, time and PNG through browser restart and a later partial write failure", async ({
  browserName,
}, info) => {
  test.setTimeout(120000);
  expect(browserName).toBe("chromium");
  const profile = await mkdtemp(join(tmpdir(), "ppo-pt11-"));
  const options = {
    channel: "chrome",
    headless: true,
    baseURL: origin,
    locale: "en-AU",
    viewport: info.project.use.viewport,
    isMobile: info.project.use.isMobile,
    hasTouch: info.project.use.hasTouch,
  };
  let context = await chromium.launchPersistentContext(profile, options);
  try {
    let page = context.pages()[0];
    const mobile = info.project.name.startsWith("mobile");
    const one = await prepared(
      page,
      mobile ? "2030-07-08" : "2030-07-04",
      true,
    );
    const two = await prepared(
      page,
      mobile ? "2030-07-09" : "2030-07-05",
      true,
    );
    await open(page, one.appointment_id);
    await page
      .getByLabel("Assigned job to download")
      .selectOption(two.appointment_id);
    await page
      .getByRole("button", { name: "Download selected job", exact: true })
      .click();
    await expect(page.locator("#notice")).toContainText(
      "Job context and exact pack saved",
    );
    await expect(page.locator("#jobs article")).toHaveCount(2);
    await context.setOffline(true);
    await page
      .getByRole("button", {
        name: "Save provisional start intent",
        exact: true,
      })
      .click();
    await expect(page.locator("#queue .queue-row")).toHaveCount(1);
    await note(page, "SYN PT-11 note retained across whole-browser restart");
    await save(page);
    await page
      .getByLabel("Evidence type", { exact: true })
      .selectOption("Time");
    const end =
      Math.floor(Date.now() / 1000) * 1000 - (mobile ? 9 : 8) * 3600000;
    await page
      .getByLabel("Actual start time (UTC)")
      .fill(new Date(end - 600000).toISOString());
    await page
      .getByLabel("Actual end time (UTC)")
      .fill(new Date(end).toISOString());
    await save(page);
    await photo(page);
    await save(page);
    const before = await snapshot(page);
    expect(before.originals).toHaveLength(7);
    expect(
      before.originals
        .filter((x) => x.command === "Capture")
        .map((x) => x.payload.kind)
        .sort(),
    ).toEqual(["Observation", "Photo", "Time"]);
    expect(Buffer.from(before.files[0].bytes)).toEqual(png());
    expect(before.files[0].sha256).toBe(hash(png()));
    await context.close();
    context = await chromium.launchPersistentContext(profile, options);
    await context.setOffline(true);
    page = context.pages()[0];
    await page.goto("/offline/index.html");
    await expect(page.locator("#jobs article")).toHaveCount(2);
    await expect(page.locator("#queue .queue-row")).toHaveCount(7);
    expect(await snapshot(page)).toEqual(before);
    await expect(page.locator("#jobs")).toContainText("Last verified");
    await expect(page.locator("#jobs")).toContainText(
      "stale reference when offline",
    );
    await page
      .getByRole("button", { name: "Open saved field job", exact: true })
      .nth(
        before.jobs.findIndex(
          (job: { id: string }) => job.id === two.appointment_id,
        ),
      )
      .click();
    await expect(page.locator("#job")).toContainText("Scope r1");
    await expect(page.locator("#job")).toContainText(
      "not proof of current authority",
    );
    await photo(page);
    await page.evaluate(() => {
      const add = IDBObjectStore.prototype.add;
      let attempts = 0;
      IDBObjectStore.prototype.add = function (value, key) {
        if (this.name === "operations" && ++attempts === 2)
          throw new DOMException(
            "SYN second write fails after the first queued insert",
            "QuotaExceededError",
          );
        return add.call(this, value, key);
      };
    });
    await page
      .getByRole("button", {
        name: "Save evidence on this device",
        exact: true,
      })
      .click();
    await expect(page.locator("#error")).toContainText("QuotaExceededError");
    await expect(page.locator("#capture-form")).not.toContainText(
      "Saved on this device — awaiting",
    );
    await expect(page.getByLabel("Photo caption")).toHaveValue(
      "SYN original acceptance fixture; no operational image",
    );
    expect(await snapshot(page)).toEqual(before);
    expect(
      (await rows(page)).every(
        (r) => r.status.state === "LocalSaved" && !r.status.receipt,
      ),
    ).toBe(true);
    await evidence(page, info, "PT-11", {
      before,
      after_failed_transaction: await snapshot(page),
      states: await rows(page),
      whole_browser_restart: true,
    });
    await page.screenshot({
      path: info.outputPath("PT-11.png"),
      fullPage: true,
    });
  } finally {
    await context.close();
  }
});

test("PT-12 exactly 100 captures replay original receipts and recover interrupted photo finalisation before completion", async ({
  page,
  context,
}, info) => {
  // A hundred real form submissions and twelve bounded network batches; existing component deadlines stay unchanged.
  test.setTimeout(240000);
  const setup = await prepared(
    page,
    info.project.name.startsWith("mobile") ? "2030-07-11" : "2030-07-10",
    true,
  );
  await open(page, setup.appointment_id);
  await context.setOffline(true);
  await page
    .getByRole("button", { name: "Save provisional start intent", exact: true })
    .click();
  await expect(page.locator("#queue .queue-row")).toHaveCount(1);
  for (let i = 1; i <= 99; i++) {
    await note(page, `SYN PT-12 original observation ${i} of 99`);
    await save(page);
  }
  await photo(page);
  await save(page);
  const original = await snapshot(page),
    operations = original.originals;
  expect(operations).toHaveLength(104); // Start + 100 captures + three attachment transport commands.
  expect(operations.filter((x) => x.command === "Capture")).toHaveLength(100);
  await context.setOffline(false);
  const readJob = async () =>
    (await call(page.request, `my-jobs/${setup.appointment_id}`)).items[0];
  expect((await readJob()).entries).toHaveLength(0);
  const receipts: Record<string, Receipt> = {};
  // Each batch really commits at the server before its acknowledgement is dropped.
  for (let batch = 0; batch < 5; batch++) {
    let accepted: Outcome[] = [];
    await page.route("**/api/v1/sync/operations", async (route) => {
      const response = await route.fetch();
      expect(response.ok()).toBe(true);
      accepted = (await response.json()).outcomes;
      await route.abort("failed");
    });
    await send(page);
    expect(accepted).toHaveLength(20);
    expect(accepted.every((x) => x.state === "ServerSaved")).toBe(true);
    expect(
      (await rows(page)).filter((x) => x.status.code === "OutcomeUncertain"),
    ).toHaveLength(20);
    await page.unroute("**/api/v1/sync/operations");
    await send(page);
    for (const outcome of accepted) {
      receipts[outcome.operation_id] = outcome.receipt!;
      expect(
        (await rows(page)).find(
          (x) => x.original.operation_id === outcome.operation_id,
        )!.status.receipt,
      ).toEqual(outcome.receipt);
    }
  }
  const photoOps = operations.filter(
    (x) => x.command.startsWith("Attachment") || x.payload.kind === "Photo",
  );
  const finalise = photoOps.find((x) => x.command === "AttachmentFinalise")!;
  const photoCapture = photoOps.find((x) => x.command === "Capture")!;
  // Commit initiate/upload, then cut the connection before finalisation runs.
  await page.route("**/api/v1/sync/operations", async (route) => {
    const body = route.request().postDataJSON();
    const response = await route.fetch({
      postData: JSON.stringify({
        ...body,
        operations: body.operations.filter((x: WireOperation) =>
          ["AttachmentInitiate", "AttachmentUpload"].includes(x.command),
        ),
      }),
    });
    const result = await response.json();
    expect(
      result.outcomes.every((x: Outcome) => x.state === "ServerSaved"),
    ).toBe(true);
    for (const outcome of result.outcomes)
      receipts[outcome.operation_id] = outcome.receipt;
    await route.abort("failed");
  });
  await send(page);
  await page.unroute("**/api/v1/sync/operations");
  const incomplete = await readJob();
  expect(incomplete.entries).toHaveLength(99);
  expect(incomplete.attachments).toHaveLength(1);
  expect(incomplete.attachments[0].status).not.toBe("Available");
  expect(
    (await rows(page)).filter((x) => x.status.code === "OutcomeUncertain"),
  ).toHaveLength(4);
  // This is the native completion command's dependency contract, not a claim
  // that the bounded offline form can hold 100 local dependencies.
  const completion = operation(
    await principal("assigned-technician"),
    incomplete,
    "CompletionDraft",
    {
      ...draft(incomplete),
      entries: [
        ...incomplete.entries.map((e: { id: string; version: number }) => ({
          id: e.id,
          version: e.version,
        })),
        { id: photoCapture.payload.id, version: 1 },
      ],
      required_attachment_ids: [incomplete.attachments[0].id],
    },
    [photoCapture.operation_id, finalise.operation_id],
  );
  const blocked = await call(page.request, "sync/operations", {
    operations: [completion],
  });
  expect(blocked.outcomes[0].code).toBe("DependencyPending");
  expect((await readJob()).draft_revisions).toHaveLength(0);
  // Lose the photo's successful response too: all 100 capture originals,
  // including the final photo, have now experienced a lost acknowledgement.
  let photoAccepted: Outcome[] = [];
  await page.route("**/api/v1/sync/operations", async (route) => {
    const response = await route.fetch();
    expect(response.ok()).toBe(true);
    photoAccepted = (await response.json()).outcomes;
    expect(photoAccepted).toHaveLength(4);
    expect(photoAccepted.every((x) => x.state === "ServerSaved")).toBe(true);
    for (const outcome of photoAccepted) {
      if (receipts[outcome.operation_id])
        expect(outcome.receipt).toEqual(receipts[outcome.operation_id]);
      receipts[outcome.operation_id] = outcome.receipt!;
    }
    await route.abort("failed");
  });
  await send(page);
  expect(
    (await rows(page)).filter((x) => x.status.code === "OutcomeUncertain"),
  ).toHaveLength(4);
  expect((await readJob()).entries).toHaveLength(100);
  await page.unroute("**/api/v1/sync/operations");
  await send(page);
  for (const row of await rows(page)) {
    expect(row.status.state).toBe("ServerSaved");
    expect(row.status.receipt).toEqual(receipts[row.original.operation_id]);
  }
  // Replay every original, including all 100 capture IDs; transport commands count separately.
  for (let i = 0; i < operations.length; i += 20) {
    const batch = operations.slice(i, i + 20);
    const replay = await call(page.request, "sync/operations", {
      operations: batch,
      transfers: Object.fromEntries(
        batch
          .filter((x) => x.command === "AttachmentUpload")
          .map((x) => [x.operation_id, png().toString("base64")]),
      ),
    });
    expect(replay.outcomes.map((x: Outcome) => x.receipt)).toEqual(
      batch.map((x) => receipts[x.operation_id]),
    );
  }
  const changed = rehash({
    ...operations[1],
    payload: {
      ...operations[1].payload,
      reason: "SYN changed meaning with reused original ID",
    },
  });
  const conflict = await call(page.request, "sync/operations", {
    operations: [changed],
  });
  expect(conflict.outcomes[0]).toMatchObject({
    state: "Conflict",
    code: "OperationConflict",
  });
  const available = await readJob();
  expect(available.entries).toHaveLength(100);
  expect(
    available.entries.map((entry: { id: string }) => entry.id).sort(),
  ).toEqual(
    operations
      .filter((x) => x.command === "Capture")
      .map((x) => x.payload.id)
      .sort(),
  );
  expect(new Set(available.entries.map((e: { id: string }) => e.id)).size).toBe(
    100,
  );
  expect(available.attachments).toHaveLength(1);
  expect(available.attachments[0].status).toBe("Available");
  const bytes = await page.request.get(
    `/api/v1/attachments/${available.attachments[0].id}/bytes`,
  );
  expect(await bytes.body()).toEqual(png());
  const completed = await call(page.request, "sync/operations", {
    operations: [completion],
  });
  expect(completed.outcomes[0].state).toBe("ServerSaved");
  const final = await readJob();
  expect(final.entries).toHaveLength(100);
  expect(final.draft_revisions).toHaveLength(1);
  expect(final.status).toBe("InProgress");
  expect(await snapshot(page)).toEqual(original);
  await evidence(page, info, "PT-12", {
    original,
    receipts,
    photo_lost_acknowledgement: photoAccepted,
    conflict: conflict.outcomes,
    interrupted_attachment: incomplete.attachments,
    completion_before: blocked.outcomes,
    completion_after: completed.outcomes,
    evidence_count: final.entries.length,
    attachment_count: final.attachments.length,
    counts: { captures: 100, wire_operations: 104, completion_commands: 1 },
  });
});

for (const [index, change] of (
  ["reassign", "cancel", "scope", "pack", "revoke", "withdraw-started"] as const
).entries()) {
  test(`PT-24 ${change} retains old browser originals and separates restricted recovery from normal acceptance`, async ({
    page,
    context,
  }, info) => {
    test.setTimeout(120000);
    // Monday-Friday pairs within the fixture's published policy window.
    const days = [
      "2030-07-15",
      "2030-07-16",
      "2030-07-17",
      "2030-07-18",
      "2030-07-19",
      "2030-07-22",
      "2030-07-23",
      "2030-07-24",
      "2030-07-25",
      "2030-07-26",
      "2030-07-29",
      "2030-07-30",
    ];
    const setup = await prepared(
      page,
      days[index + (info.project.name.startsWith("mobile") ? 6 : 0)],
      true,
    );
    await open(page, setup.appointment_id);
    await page
      .getByRole("button", {
        name: "Save provisional start intent",
        exact: true,
      })
      .click();
    await expect(page.locator("#queue .queue-row")).toHaveCount(1);
    if (change === "withdraw-started") {
      await send(page);
      expect((await rows(page))[0].status.state).toBe("ServerSaved");
      await page
        .getByRole("button", { name: "Download selected job", exact: true })
        .click();
      await expect(page.locator("#notice")).toContainText(
        "Job context and exact pack saved",
      );
    }
    await context.setOffline(true);
    await note(
      page,
      `SYN PT-24 ${change}: factual evidence keeps its original authority`,
    );
    await save(page);
    await photo(page);
    await save(page);
    const before = await snapshot(page),
      start = before.originals.find((x) => x.command === "Start")!;
    expect(before.originals).toHaveLength(6);
    await expect(page.locator("#job")).toContainText(
      "not proof of current authority",
    );
    const actor = start.actor_id;
    const grants =
      change === "revoke"
        ? (
            await database().query(
              "SELECT id,valid_to FROM ppo.permission_grants WHERE user_id=$1 AND capability LIKE 'field.%'",
              [actor],
            )
          ).rows
        : [];
    let serverChange: Awaited<ReturnType<typeof changeAuthority>> | undefined;
    try {
      if (change === "revoke") {
        await database().query(
          "UPDATE ppo.permission_grants SET valid_to=clock_timestamp() WHERE user_id=$1 AND capability LIKE 'field.%' AND valid_to IS NULL",
          [actor],
        );
      } else
        serverChange = await changeAuthority(
          change,
          setup.appointment_id,
          setup.pack.id,
        );
      await context.setOffline(false);
      if (change === "revoke" || change === "reassign") {
        const normal = await page.request.get(
          `/api/v1/my-jobs/${setup.appointment_id}`,
        );
        expect([403, 404]).toContain(normal.status());
      }
      await send(page);
      const outcomes = await rows(page);
      expect(outcomes.map((x) => x.original)).toEqual(before.originals);
      const attendances = (
        await database().query(
          "SELECT id FROM ppo.field_attendances WHERE appointment_id=$1",
          [setup.appointment_id],
        )
      ).rows;
      expect(attendances).toHaveLength(change === "withdraw-started" ? 1 : 0);
      if (change === "withdraw-started") {
        for (const row of outcomes.filter(
          (x) => x.original.command === "Capture",
        )) {
          expect(row.status).toMatchObject({
            state: "ReviewRequired",
            code: "AuthorityReviewRequired",
          });
          expect(row.status.receipt).toBeTruthy();
        }
      } else
        expect(
          outcomes.find((x) => x.original.command === "Start")!.status.state,
        ).toBe("ReviewRequired");

      if (change === "revoke") {
        // Retain the original prior capability inside this browser only. Remove
        // its cache through the real UI, prove missing-capability refusal, then
        // restore that same prior cache without obtaining fresh normal access.
        const priorGrantId = await page.evaluate(async () => {
          const path = "/offline/modules/offline/store.js",
            s = await import(path),
            owner = (await s.ownership()).owner;
          const cache = (await s.contexts(owner))[0];
          Reflect.set(globalThis, "restorePT24PriorCache", () =>
            s.cacheJob(owner, cache),
          );
          return cache.recovery.id as string;
        });
        await page
          .getByRole("button", {
            name: "Remove cached job context",
            exact: true,
          })
          .click();
        await expect(page.locator("#jobs article")).toHaveCount(0);
        await page
          .getByRole("button", {
            name: "Preserve original for service-owner review",
            exact: true,
          })
          .first()
          .click();
        await expect(page.locator("#error")).toContainText(
          "Original recovery capability is missing",
        );
        expect((await rows(page)).every((x) => !x.status.recovery)).toBe(true);
        await page.evaluate(async () => {
          await Reflect.get(globalThis, "restorePT24PriorCache")();
          Reflect.deleteProperty(globalThis, "restorePT24PriorCache");
        });
        const expired = randomUUID(),
          expiredToken = hash(randomUUID());
        await database().query(
          "INSERT INTO ppo.offline_recovery_grants(id,workspace_id,actor_id,company_id,site_id,appointment_id,owner_id,token_hash,authority,issued_at,expires_at) SELECT $1,workspace_id,actor_id,company_id,site_id,appointment_id,owner_id,$2,authority,clock_timestamp()-interval '8 days',clock_timestamp()-interval '1 day' FROM ppo.offline_recovery_grants WHERE id=$3",
          [expired, hash(expiredToken), priorGrantId],
        );
        for (const refusal of ["wrong", "expired"] as const) {
          let code: string | undefined;
          await page.route("**/api/v1/sync/recovery", async (route) => {
            const body = route.request().postDataJSON();
            const response = await route.fetch({
              postData: JSON.stringify({
                ...body,
                ...(refusal === "expired"
                  ? { grant_id: expired, token: expiredToken }
                  : { token: "0".repeat(64) }),
              }),
            });
            expect(response.status()).toBe(404);
            code = (await response.json()).code;
            await route.fulfill({ response });
          });
          await page
            .getByRole("button", {
              name: "Preserve original for service-owner review",
              exact: true,
            })
            .first()
            .click();
          await expect(page.locator("#error")).not.toBeEmpty();
          await expect.poll(() => code).toBe("RecordUnavailable");
          await page.unroute("**/api/v1/sync/recovery");
          expect((await rows(page)).every((x) => !x.status.recovery)).toBe(
            true,
          );
        }
      }
      if (change !== "withdraw-started") {
        for (let remaining = 5; remaining > 0; remaining--) {
          const preserve = page.getByRole("button", {
            name: "Preserve original for service-owner review",
            exact: true,
          });
          await expect(preserve).toHaveCount(remaining);
          await preserve.first().click();
          await expect(preserve).toHaveCount(remaining - 1);
        }
        await expect(page.locator("#queue")).toContainText(
          "normal acceptance: no",
        );
        for (const row of (await rows(page)).filter(
          (x) => x.original.command !== "Start",
        ))
          expect(row.status).toMatchObject({
            state: "ReviewRequired",
            recovery: {
              normal_acceptance: false,
              disposition: "ReviewRequired",
            },
          });
      }
      const retained = await snapshot(page);
      expect(retained.originals).toEqual(before.originals);
      expect(retained.files).toEqual(before.files);
      expect(
        retained.jobs.map((x: { authority: unknown }) => x.authority),
      ).toEqual(before.jobs.map((x: { authority: unknown }) => x.authority));
      const finalRows = await rows(page);
      const entries = (
        await database().query(
          "SELECT id,authority_state,review_status FROM ppo.field_entries WHERE appointment_id=$1",
          [setup.appointment_id],
        )
      ).rows;
      expect(entries).toHaveLength(change === "withdraw-started" ? 2 : 0);
      for (const e of entries) {
        expect(e.authority_state).toBe("ReviewRequired");
        expect(e.review_status).toBe("Draft");
      }
      const audit = (
        await database().query(
          "SELECT object_type,object_id,outcome,reason,details FROM ppo.audit_events WHERE actor_id=$1 AND details->>'original_operation_id'=ANY($2::text[])",
          [actor, before.originals.map((x) => x.operation_id)],
        )
      ).rows;
      if (change !== "withdraw-started") expect(audit).toHaveLength(5);
      await evidence(page, info, `PT-24-${change}`, {
        before,
        retained,
        outcomes: finalRows,
        attendances,
        entries,
        audit,
        server_change: serverChange,
        refused_capabilities:
          change === "revoke" ? ["missing", "wrong", "expired"] : [],
      });
      await login(page.request, "coordinator");
      for (const row of finalRows.filter((x) => x.status.recovery)) {
        const recovery = row.status.recovery!;
        const detail = await call(
          page.request,
          `sync/recovery-review/${recovery.case_id}`,
        );
        const { payload_hash: _hash, ...original } = row.original;
        void _hash;
        expect(detail.envelope).toEqual(original);
        expect(detail.normal_acceptance).toBe(false);
        if (row.original.command === "AttachmentUpload") {
          const bytes = await page.request.get(
            `/api/v1/sync/recovery-review/${recovery.case_id}/bytes`,
          );
          expect(await bytes.body()).toEqual(png());
          await page.goto(`/work/${detail.activity_id}`);
          await expect(
            page
              .getByText(
                "SYN offline evidence requires restricted service-owner disposition. Contact the technician before further work.",
                { exact: true },
              )
              .first(),
          ).toBeVisible();
          await page.screenshot({
            path: info.outputPath(`PT-24-${change}-contact.png`),
            fullPage: true,
          });
        }
      }
    } finally {
      // Only grants belonging to the test's synthetic actor are restored to
      // their exact prior expiry; production and other test actors are untouched.
      for (const grant of grants)
        await database().query(
          "UPDATE ppo.permission_grants SET valid_to=$2 WHERE id=$1",
          [grant.id, grant.valid_to],
        );
    }
  });
}
