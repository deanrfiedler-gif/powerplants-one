import { test, expect, type Page, type TestInfo } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { prepareFieldAppointment } from "../helpers/field-http";
import { png } from "../helpers/field";
async function call(page: Page, path: string, body?: unknown) {
  const r = await page.request.fetch("/api/v1/" + path, {
    method: body === undefined ? "GET" : "POST",
    headers:
      body === undefined
        ? {}
        : {
            Origin: "http://127.0.0.1:3000",
            "Content-Type": "application/json",
          },
    data: body,
  });
  const data = await r.json();
  expect(r.ok(), JSON.stringify(data)).toBeTruthy();
  return data;
}
async function identity(page: Page, profile: string) {
  await expect(page.getByRole("region", { name: "Local demonstration identity", exact: true })).toHaveAttribute("aria-busy", "false");
  if (!(await page.getByLabel("Identity", { exact: true }).isVisible())) await page.getByRole("button", { name: "Change identity", exact: true }).click();

  await page.getByLabel("Identity", { exact: true }).selectOption(profile);
  await page
    .getByRole("button", { name: "Use this identity", exact: true })
    .click();
  await expect(page.getByRole("button", { name: "Change identity", exact: true })).toBeEnabled();
  await expect(page.getByRole("region", { name: "Local demonstration identity", exact: true })).toHaveAttribute("aria-busy", "false");
}
async function capture(
  page: Page,
  info: TestInfo,
  name: string,
  extra: Record<string, unknown> = {},
) {
  if (await page.locator(".read-meta").count())
    await expect(page.locator(".read-meta").last()).toBeVisible();
  await page.evaluate(() => scrollTo(0, 0));
  await page.evaluate(
    () =>
      new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
      ),
  );
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await mkdir(info.outputPath("."), { recursive: true });
  const bytes = await page.screenshot({
    path: info.outputPath(`P07-${name}.png`),
    fullPage: true,
  });
  await writeFile(
    info.outputPath(`P07-${name}.json`),
    JSON.stringify(
      {
        scenario: name,
        run_id: process.env.GITHUB_RUN_ID,
        run_attempt: process.env.GITHUB_RUN_ATTEMPT,
        source_head: process.env.GITHUB_HEAD_REF,
        executed_checkout: execFileSync("git", ["rev-parse", "HEAD"], {
          encoding: "utf8",
        }).trim(),
        executed_tree: execFileSync("git", ["rev-parse", "HEAD^{tree}"], {
          encoding: "utf8",
        }).trim(),
        project: info.project.name,
        viewport: page.viewportSize(),
        url: page.url(),
        captured_at: new Date().toISOString(),
        byte_count: bytes.length,
        sha256: createHash("sha256").update(bytes).digest("hex"),
        ...extra,
      },
      null,
      2,
    ),
  );
}
async function task(
  page: Page,
  job: { scope: { items: { id: string; assets: { id: string }[] }[] } },
) {
  await page
    .getByLabel("Authorised task", { exact: true })
    .selectOption(job.scope.items[0].id);
  await page
    .getByLabel("Affected asset", { exact: true })
    .selectOption(job.scope.items[0].assets[0].id);
}
async function save(page: Page) {
  await page
    .getByLabel("Capture context", { exact: true })
    .fill("SYN online browser evidence within original inspection authority");
  await page
    .getByRole("button", { name: "Save evidence online", exact: true })
    .click();
  await expect(page.getByLabel("Capture context", { exact: true })).toHaveValue(
    "",
  );
}
test("P07 actual online visit: independent crew start, all typed forms, durable photo, correction, uncertain-response recovery and completion", async ({
  page,
}, info) => {
  test.setTimeout(180000);
  await page.goto("/my-jobs");
  await identity(page, "coordinator");
  const setup = await prepareFieldAppointment(
    (path, body) => call(page, path, body),
    info.project.name.startsWith("mobile") ? "2026-12-03" : "2026-12-02",
  );
  await identity(page, "assigned-technician");
  await page.goto("/my-jobs");
  await expect(
    page.getByRole("heading", { name: "My Jobs", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Open field job" }).first(),
  ).toBeVisible();
  await capture(page, info, "assigned-jobs");
  await page.goto(`/my-jobs/${setup.appointment_id}`);
  await expect(
    page.getByRole("heading", { name: "Current work context" }),
  ).toBeVisible();
  await expect(
    page.getByText("Field workflow preview — integrated acceptance incomplete", {
      exact: true,
    }),
  ).toBeVisible();
  await page
    .getByRole("button", {
      name: "I have read and acknowledge this exact pack",
    })
    .click();
  await expect(
    page.getByRole("button", {
      name: "I have read and acknowledge this exact pack",
    }),
  ).toHaveCount(0);
  await page
    .getByLabel("Start context")
    .fill("SYN actual start after independently reading original pack");
  const startButton = page.getByRole("button", {
    name: "Record my actual start",
  });
  await startButton.focus();
  await expect(startButton).toBeFocused();
  await startButton.press("Enter");
  await expect(page.locator(".business-error")).toContainText(
    "Resolve the current start blockers",
  );
  await expect(page.getByLabel("Start context")).toHaveValue(
    "SYN actual start after independently reading original pack",
  );
  await capture(page, info, "first-recipient-start-refused");
  await identity(page, "second-technician");
  await page
    .getByRole("button", {
      name: "I have read and acknowledge this exact pack",
    })
    .click();
  await expect(
    page.getByRole("button", {
      name: "I have read and acknowledge this exact pack",
    }),
  ).toHaveCount(0);
  await identity(page, "assigned-technician");
  await page
    .getByLabel("Start context")
    .fill("SYN personally starting after both crew acknowledgements");
  await page.getByRole("button", { name: "Record my actual start" }).click();
  await expect(
    page.getByText("Your actual start is server-saved."),
  ).toBeVisible();
  let job = (await call(page, `my-jobs/${setup.appointment_id}`)).items[0];
  await capture(page, info, "started-authority", {
    authority_hash: job.attendance.authority_hash,
    appointment_id: job.id,
  });
  await task(page, job);
  await page
    .getByLabel("Time start (UTC ISO)")
    .fill(
      info.project.name.startsWith("mobile")
        ? "2026-08-02T00:00:00Z"
        : "2026-08-01T00:00:00Z",
    );
  await page
    .getByLabel("Time finish (UTC ISO)")
    .fill(
      info.project.name.startsWith("mobile")
        ? "2026-08-02T01:30:00Z"
        : "2026-08-01T01:30:00Z",
    );
  await page
    .getByLabel("Time explanation")
    .fill("SYN recorded exact elapsed labour; no payroll inference");
  await save(page);
  await page.getByLabel("Evidence type").selectOption("Material");
  await task(page, job);
  await page
    .getByLabel("Material description")
    .fill("SYN fictional inspection label sleeve");
  await page.getByLabel("Positive quantity").fill("-2");
  await page
    .getByLabel("Capture context", { exact: true })
    .fill("SYN validate positive material quantities");
  await page.getByRole("button", { name: "Save evidence online" }).click();
  await expect(page.locator(".business-error")).toBeVisible();
  await expect(page.getByLabel("Positive quantity")).toHaveValue("-2");
  await capture(page, info, "material-validation-retains-input");
  await page.getByLabel("Positive quantity").fill("2");
  let originalBody: string | null = null;
  await page.route(
    "**/api/v1/field-entries",
    async (route) => {
      originalBody = route.request().postData();
      await route.fetch();
      await route.abort("failed");
    },
    { times: 1 },
  );
  await page.getByRole("button", { name: "Save evidence online" }).click();
  await expect(
    page.getByText(/Outcome uncertain — original submission retained/),
  ).toBeVisible();
  await expect(page.getByLabel("Positive quantity")).toBeDisabled();
  await capture(page, info, "accepted-response-lost");
  const replay = page.waitForRequest((r) => r.url().endsWith("/field-entries"));
  await page.getByRole("button", { name: "Retry original submission" }).click();
  expect((await replay).postData()).toBe(originalBody);
  await expect(page.getByLabel("Capture context", { exact: true })).toHaveValue(
    "",
  );
  await page.getByRole("button", { name: "Photos", exact: true }).click();
  const bytes = png();
  await page.getByLabel("Synthetic photo file").setInputFiles({
    name: "SYN-browser-original.png",
    mimeType: "image/png",
    buffer: bytes,
  });
  await page.getByRole("button", { name: "1. Register photo" }).click();
  await expect(
    page.getByRole("button", { name: "2. Upload original bytes" }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByText("Your actual start is server-saved."),
  ).toBeVisible();
  await page.getByRole("button", { name: "Photos", exact: true }).click();
  await page.getByLabel("Synthetic photo file").setInputFiles({
    name: "SYN-browser-original.png",
    mimeType: "image/png",
    buffer: bytes,
  });
  await page.getByRole("button", { name: "2. Upload original bytes" }).click();
  await expect(
    page.getByRole("button", { name: "3. Verify and make available" }),
  ).toBeVisible();
  await capture(page, info, "uploaded-awaiting-verification");
  await page
    .getByRole("button", { name: "3. Verify and make available" })
    .click();
  await expect(
    page.getByRole("link", { name: "Preview original photo" }),
  ).toBeVisible();
  job = (await call(page, `my-jobs/${job.id}`)).items[0];
  expect(job.attachments.length).toBe(1);
  const attachment = job.attachments[0];
  const file = await page.request.get(
    `/api/v1/attachments/${attachment.id}/bytes`,
  );
  expect(await file.body()).toEqual(bytes);
  await writeFile(info.outputPath("SYN-browser-original.png"), bytes);
  await capture(page, info, "durable-photo-available", {
    attachment,
    photo_sha256: createHash("sha256").update(bytes).digest("hex"),
  });
  await page.getByRole("button", { name: "Capture", exact: true }).click();
  await page.getByLabel("Evidence type").selectOption("Observation");
  await task(page, job);
  await page
    .getByLabel("Finding", { exact: true })
    .fill(
      "SYN equipment label remains unclear. " +
        "Retain the unverified identity and original inspection context. ".repeat(
          18,
        ),
    );
  await page.getByLabel("Finding confidence").selectOption("Suspected");
  await page
    .getByLabel("Attempted action")
    .fill("SYN visual reading attempted without intervention");
  await page
    .getByLabel("Action result")
    .fill("SYN failed to resolve identity; owner follow-up required");
  await save(page);
  await page.getByLabel("Evidence type").selectOption("Reading");
  await task(page, job);
  await page.getByLabel("Reading name").fill("SYN external temperature");
  await page.getByLabel("Numeric value").fill("21.500");
  await page
    .getByLabel("Measurement context")
    .fill("SYN fictional ambient reading with unverified calibration");
  await save(page);
  await page.getByLabel("Evidence type").selectOption("Checklist");
  await task(page, job);
  await page.getByLabel("Checklist result").selectOption("Pass");
  await page.getByLabel("Supporting photo").selectOption(attachment.id);
  await save(page);
  await page.getByLabel("Evidence type").selectOption("Photo");
  await task(page, job);
  await page.getByLabel("Durable photo reference").selectOption(attachment.id);
  await page
    .getByLabel("Meaningful photo caption")
    .fill(
      "SYN fictional two-colour inspection fixture, original bytes verified",
    );
  await save(page);
  await page.getByRole("button", { name: "History", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Saved evidence and corrections" }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Correct this material entry" })
    .click();
  await expect(
    page.getByRole("heading", { name: "Correct material evidence v1" }),
  ).toBeVisible();
  await page.getByLabel("Positive quantity").fill("1");
  await page
    .getByLabel("Correction reason")
    .fill("SYN original included one unused sleeve; retain both versions");
  await page.getByRole("button", { name: "Save successor correction" }).click();
  await expect(
    page.getByRole("heading", { name: "Capture field evidence" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "History", exact: true }).click();
  await expect(page.getByText("Superseded", { exact: true })).toBeVisible();
  await expect(
    page.getByRole("img", {
      name: "SYN fictional two-colour inspection fixture, original bytes verified",
    }),
  ).toBeVisible();
  await capture(page, info, "typed-evidence-original-and-correction");
  await page.getByRole("button", { name: "Completion", exact: true }).click();
  await page
    .getByLabel("Actual work performed")
    .fill(
      "SYN external visual inspection completed for the available portion; label identity unresolved",
    );
  await page
    .getByLabel("Remaining work and reasons")
    .fill(
      "SYN service owner must resolve label identity and arrange the remaining task through existing controls",
    );
  await page.getByLabel("My time declaration").selectOption("AllRecorded");
  await page.getByLabel("My material declaration").selectOption("AllRecorded");
  await page
    .getByLabel("Declaration explanation")
    .fill(
      "SYN actual time and consumed sleeve recorded; quantities are not approved or billable",
    );
  await page
    .getByLabel("Task 1 explanation")
    .fill(
      "SYN partial inspection; remaining identification work owned by service owner",
    );
  await page.getByRole("button", { name: "Save completion draft" }).click();
  await expect(
    page.getByRole("heading", { name: "Saved completion draft v1 · Partial" }),
  ).toBeVisible();
  await expect(
    page.getByText("Server-saved · Draft v1", { exact: true }),
  ).toBeVisible();
  job = (await call(page, `my-jobs/${job.id}`)).items[0];
  expect(job.status).toBe("InProgress");
  expect(
    job.entries
      .filter((e: { kind: string; superseded: boolean }) => !e.superseded)
      .map((e: { kind: string }) => e.kind)
      .sort(),
  ).toEqual([
    "Checklist",
    "Material",
    "Observation",
    "Photo",
    "Reading",
    "Time",
  ]);
  expect(job.follow_ups.length).toBeGreaterThan(0);
  await capture(page, info, "partial-completion-owned-work", {
    appointment_id: job.id,
    entry_refs: job.entries.map((e: { id: string; version: number }) => ({
      id: e.id,
      version: e.version,
    })),
    draft: job.draft,
    work_order: job.work_order,
  });
});
test("P07 missing scope and read failure show controlled access and honest server state", async ({
  page,
}, info) => {
  await page.goto("/my-jobs");
  await identity(page, "assigned-technician");
  await page.goto("/my-jobs/00000000-0000-4000-8000-000000000001");
  await expect(page.locator(".business-error")).toBeVisible();
  await page.goto("/my-jobs");
  await page.route("**/api/v1/my-jobs", (r) =>
    r.fulfill({
      status: 503,
      contentType: "application/json",
      body: JSON.stringify({
        code: "DependencyUnavailable",
        message:
          "The online job list is unavailable; no saved state can be confirmed.",
        retryable: true,
      }),
    }),
  );
  await page.reload();
  await expect(page.locator(".business-error")).toContainText(
    "online job list is unavailable",
  );
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await capture(page, info, "read-unavailable");
});
