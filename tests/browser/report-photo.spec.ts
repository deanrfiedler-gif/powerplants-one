import { test, expect } from "@playwright/test";
import { randomUUID, createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import { prepared, call, login } from "../helpers/offline-browser";
import { base, draft, entry, png, startInput } from "../helpers/field";

test("Service photo inspection verifies exact bytes, preserves review input and clears protected previews", async ({
  page,
  request,
}, info) => {
  test.setTimeout(120000);
  const setup = await prepared(
    page,
    info.project.name.startsWith("mobile") ? "2030-09-12" : "2030-09-11",
    true,
  );
  let job = (await call(page.request, `my-jobs/${setup.appointment_id}`))
    .items[0];
  await call(page.request, `appointments/${job.id}/start`, startInput(job));
  job = (await call(page.request, `my-jobs/${job.id}`)).items[0];
  const bytes = png(960, 640),
    attachmentId = randomUUID(),
    hash = createHash("sha256").update(bytes).digest("hex");
  await call(page.request, "attachments/initiate", {
    ...base(),
    id: attachmentId,
    appointment_id: job.id,
    attendance_id: job.attendance.id,
    filename: "SYN-review-photo.png",
    media_type: "image/png",
    byte_count: bytes.length,
    sha256: hash,
  });
  const upload = await call(
    page.request,
    `attachments/${attachmentId}/upload`,
    {
      ...base(),
      expected_version: 1,
      content_base64: bytes.toString("base64"),
    },
  );
  await call(page.request, `attachments/${attachmentId}/finalise`, {
    ...base(),
    expected_version: upload.record_version,
  });
  await call(
    page.request,
    "field-entries",
    entry(job, "Photo", {
      attachment_id: attachmentId,
      caption: "SYN visual evidence for Service inspection",
    }),
  );
  job = (await call(page.request, `my-jobs/${job.id}`)).items[0];
  await call(
    page.request,
    `appointments/${job.id}/completion-draft`,
    draft(job),
  );
  job = (await call(page.request, `my-jobs/${job.id}`)).items[0];
  const reportId = randomUUID();
  await call(page.request, `appointments/${job.id}/submit-completion`, {
    ...base(),
    id: reportId,
    attendance_id: job.attendance.id,
    draft_revision_id: job.draft_revisions[0].id,
    expected_draft_version: job.draft.version,
    expected_report_version: 0,
    expected_appointment_version: job.version,
    attendance_end_at: new Date().toISOString(),
  });
  await login(page.request, "coordinator");
  const before = (await call(page.request, `reports/${reportId}`)).items[0],
    revision = before.revisions[0];
  const path = `/api/v1/reports/${reportId}/photo?revision_id=${revision.id}&attachment_id=${attachmentId}`;
  const response = await page.request.get(path);
  expect(response.status()).toBe(200);
  expect(response.headers()["cache-control"]).toBe("private, no-store");
  expect(response.headers()["x-content-type-options"]).toBe("nosniff");
  expect(await response.body()).toEqual(bytes);
  expect(
    (
      await page.request.get(`/api/v1/attachments/${attachmentId}/bytes`)
    ).status(),
  ).toBe(403);
  await login(request, "assigned-technician");
  expect((await request.get(path)).status()).toBe(403);
  expect(
    await (
      await request.get(`/api/v1/attachments/${attachmentId}/bytes`)
    ).body(),
  ).toEqual(bytes);
  await page.goto(`/service/reports/${reportId}`);
  const photo = page.locator(".report-photo"),
    image = photo.getByRole("img", {
      name: "SYN visual evidence for Service inspection",
    });
  const reason = page.getByRole("textbox", {
    name: "Entry 1 review reason",
    exact: true,
  });
  await reason.fill(
    "SYN retain my unfinished review while inspecting and retrying",
  );
  await page
    .getByLabel("Entry 1 decision", { exact: true })
    .selectOption("Returned");
  await expect(image).toHaveCount(0);
  // Explicit refusal and corrupted-body responses are injected UI recovery cases.
  await page.route(`**/reports/${reportId}/photo?*`, (route) =>
    route.fulfill({
      status: 503,
      contentType: "application/json",
      body: JSON.stringify({
        code: "ReportPhotoUnavailable",
        message: "SYN original photo needs recovery",
        retryable: true,
      }),
    }),
  );
  await photo
    .getByRole("button", { name: "Inspect submitted photo", exact: true })
    .focus();
  await page.keyboard.press("Enter");
  await expect(photo.getByRole("alert")).toContainText(
    "SYN original photo needs recovery",
  );
  await expect(photo.getByRole("alert")).toBeFocused();
  await expect(reason).toHaveValue(
    "SYN retain my unfinished review while inspecting and retrying",
  );
  await page.unroute(`**/reports/${reportId}/photo?*`);
  await photo.getByRole("button", { name: "Retry photo", exact: true }).focus();
  await page.keyboard.press("Enter");
  await expect(image).toBeVisible();
  await expect(
    photo.getByRole("button", { name: "Hide submitted photo", exact: true }),
  ).toBeFocused();
  await expect(image).toHaveJSProperty("naturalWidth", 960);
  const firstUrl = await image.getAttribute("src");
  await expect(
    page.getByLabel("Entry 1 decision", { exact: true }),
  ).toHaveValue("Returned");
  await photo.scrollIntoViewIfNeeded();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({ path: info.outputPath("submitted-photo.png") });
  if (info.project.name.startsWith("mobile")) {
    await page.setViewportSize({ width: 320, height: 844 });
    await expect(image).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await photo.scrollIntoViewIfNeeded();
    await page.screenshot({ path: info.outputPath("submitted-photo-320.png") });
    await page.setViewportSize({ width: 390, height: 844 });
  }
  await photo
    .getByRole("button", { name: "Hide submitted photo", exact: true })
    .click();
  await expect(image).toHaveCount(0);
  expect(
    await page.evaluate(async (url) => {
      try {
        await fetch(url!);
        return false;
      } catch {
        return true;
      }
    }, firstUrl),
  ).toBe(true);
  await page.route(`**/reports/${reportId}/photo?*`, (route) =>
    route.fulfill({ status: 200, contentType: "image/png", body: png(64, 64) }),
  );
  await photo
    .getByRole("button", { name: "Inspect submitted photo", exact: true })
    .click();
  await expect(photo.getByRole("alert")).toContainText(
    "differs from the submitted original",
  );
  await expect(image).toHaveCount(0);
  await page.unroute(`**/reports/${reportId}/photo?*`);
  await photo.getByRole("button", { name: "Retry photo", exact: true }).click();
  await expect(image).toBeVisible();
  const beforeRefreshUrl = await image.getAttribute("src");
  const freshPhoto = page.waitForResponse((r) => r.url().endsWith(path));
  await page
    .getByRole("button", { name: "Refresh exact report", exact: true })
    .click();
  expect((await freshPhoto).status()).toBe(200);
  await expect(image).toBeVisible();
  expect(await image.getAttribute("src")).not.toBe(beforeRefreshUrl);
  expect(
    await page.evaluate(async (url) => {
      try {
        await fetch(url!);
        return false;
      } catch {
        return true;
      }
    }, beforeRefreshUrl),
  ).toBe(true);
  const switchedUrl = await image.getAttribute("src");
  await expect(reason).toHaveValue(
    "SYN retain my unfinished review while inspecting and retrying",
  );
  const after = (await call(page.request, `reports/${reportId}`)).items[0];
  expect({
    version: after.version,
    status: after.status,
    reviews: after.reviews,
    presentations: after.presentations,
    revisions: after.revisions,
  }).toEqual({
    version: before.version,
    status: before.status,
    reviews: before.reviews,
    presentations: before.presentations,
    revisions: before.revisions,
  });
  // Actual same-tab identity switch unmounts/revokes the protected photo.
  await page
    .getByRole("button", { name: "Change identity", exact: true })
    .click();
  await page
    .getByLabel("Identity", { exact: true })
    .selectOption("assigned-technician");
  await page
    .getByRole("button", { name: "Use this identity", exact: true })
    .click();
  await expect(photo).toHaveCount(0);
  expect(
    await page.evaluate(async (url) => {
      try {
        await fetch(url!);
        return false;
      } catch {
        return true;
      }
    }, switchedUrl),
  ).toBe(true);
  await writeFile(
    info.outputPath("photo-inspection.json"),
    JSON.stringify(
      {
        source_head: execFileSync("git", ["rev-parse", "HEAD"], {
          encoding: "utf8",
        }).trim(),
        captured_at: new Date().toISOString(),
        project: info.project.name,
        viewport: page.viewportSize(),
        report_id: reportId,
        revision_id: revision.id,
        attachment_id: attachmentId,
        sha256: hash,
        byte_count: bytes.length,
        current_reviewer_status: response.status(),
        technician_report_photo_status: 403,
        coordinator_field_photo_status: 403,
        review_state_unchanged: true,
        retained_review_input: true,
        identity_switch_cleared_preview: true,
        source_hashes: Object.fromEntries(
          await Promise.all(
            [
              "src/reports/photos.ts",
              "src/app/api/v1/reports/[id]/photo/route.ts",
              "src/components/report-photo.tsx",
              "src/components/report-screens.tsx",
              "tests/browser/report-photo.spec.ts",
            ].map(async (file) => [
              file,
              createHash("sha256")
                .update(await readFile(file))
                .digest("hex"),
            ]),
          ),
        ),
      },
      null,
      2,
    ),
  );
});
