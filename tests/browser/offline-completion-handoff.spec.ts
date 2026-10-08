import { test, expect } from "@playwright/test";
import { writeFile, readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import {
  prepared,
  open,
  note,
  save,
  call,
  localRows,
} from "../helpers/offline-browser";
import { png } from "../helpers/field";
import type { WireOperation } from "../../src/offline/protocol";
type Stored = {
  original: WireOperation;
  status: { state: string; code?: string };
};

test("large offline queue continues through online completion with all 100 original captures", async ({
  page,
  context,
}, info) => {
  test.setTimeout(240000);
  const setup = await prepared(
    page,
    info.project.name.startsWith("mobile") ? "2030-08-06" : "2030-08-05",
    true,
  );
  await open(page, setup.appointment_id);
  await context.setOffline(true);
  await page
    .getByRole("button", { name: "Save provisional start intent", exact: true })
    .click();
  await expect(page.locator("#queue .queue-row")).toHaveCount(1);
  for (let i = 1; i <= 99; i++) {
    await note(page, `SYN online continuation original ${i}`);
    await save(page);
  }
  await page.getByLabel("Evidence type", { exact: true }).selectOption("Photo");
  await page.getByLabel("Original synthetic PNG").setInputFiles({
    name: "SYN-continuation.png",
    mimeType: "image/png",
    buffer: png(),
  });
  await page.getByLabel("Photo caption").fill("SYN retained original photo");
  await page
    .getByLabel("Capture context", { exact: true })
    .fill("SYN visual inspection only");
  await save(page);
  const originals = ((await localRows(page)) as Stored[]).map(
    (x) => x.original,
  );
  expect(originals).toHaveLength(104);
  await context.setOffline(false);
  await page
    .getByRole("button", { name: "Continue completion online", exact: true })
    .click();
  await expect(page.locator("#error")).toContainText(
    "Send or resolve every original",
  );
  await expect(page).toHaveURL(/\/offline\/index.html$/);
  const send = async () => {
    const sent = page.waitForRequest(
      (r) => new URL(r.url()).pathname === "/api/v1/sync/operations",
    );
    await page
      .getByRole("button", {
        name: "Send next batch / retry originals",
        exact: true,
      })
      .click();
    await (await sent).response();
    await expect(
      page.getByRole("button", {
        name: "Send next batch / retry originals",
        exact: true,
      }),
    ).toBeEnabled();
  };
  await page.route("**/api/v1/sync/operations", async (route) => {
    await route.fetch();
    await route.abort("failed");
  });
  await send();
  await page.unroute("**/api/v1/sync/operations");
  expect(
    ((await localRows(page)) as Stored[]).some(
      (x) => x.status.code === "OutcomeUncertain",
    ),
  ).toBe(true);
  await page
    .getByRole("button", { name: "Continue completion online", exact: true })
    .click();
  await expect(page.locator("#error")).toContainText(
    "Send or resolve every original",
  );
  for (let i = 0; i < 6; i++) await send();
  expect(
    ((await localRows(page)) as Stored[]).every(
      (x) => x.status.state === "ServerSaved",
    ),
  ).toBe(true);
  await page
    .getByRole("button", { name: "Download selected job", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Download selected job", exact: true }),
  ).toBeEnabled({ timeout: 45000 });
  await page
    .getByRole("button", {
      name: "Save completion draft on this device",
      exact: true,
    })
    .click();
  await expect(page.locator("#error")).toContainText("more than 30");
  // This user-visible continuation must exist after following the old advice.
  await expect(
    page.getByRole("button", {
      name: "Continue completion online",
      exact: true,
    }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Continue completion online", exact: true })
    .click();
  await expect(page).toHaveURL(new RegExp(`/my-jobs/${setup.appointment_id}$`));
  await page.getByRole("button", { name: "Completion", exact: true }).click();
  await page
    .getByLabel("Actual work performed", { exact: true })
    .fill("SYN visual inspection and 100 original observations/photo retained");
  await page
    .getByLabel("Remaining work and reasons", { exact: true })
    .fill("SYN coordinator owns remaining identification work");
  await page
    .getByLabel("My time declaration", { exact: true })
    .selectOption("None");
  await page
    .getByLabel("My material declaration", { exact: true })
    .selectOption("None");
  await page
    .getByLabel("Declaration explanation", { exact: true })
    .fill("SYN no time or materials claimed");
  const tasks = page.getByLabel(/Task \d+ explanation/);
  for (let i = 0; i < (await tasks.count()); i++)
    await tasks
      .nth(i)
      .fill("SYN partial visual observation; coordinator owns follow-up");
  await page
    .getByRole("button", { name: "Save completion draft", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Saved completion draft v1 · Partial" }),
  ).toBeVisible();
  const job = (await call(page.request, `my-jobs/${setup.appointment_id}`))
    .items[0];
  expect(job.entries).toHaveLength(100);
  expect(job.draft_revisions).toHaveLength(1);
  expect(
    job.draft_revisions[0].entries.map((x: { id: string }) => x.id).sort(),
  ).toEqual(
    originals
      .filter((x) => x.command === "Capture")
      .map((x) => x.payload.id)
      .sort(),
  );
  expect(job.attachments).toHaveLength(1);
  expect(job.attachments[0].status).toBe("Available");
  expect(
    await (
      await page.request.get(
        `/api/v1/attachments/${job.attachments[0].id}/bytes`,
      )
    ).body(),
  ).toEqual(png());
  await page
    .getByLabel("Submission reason", { exact: true })
    .fill("SYN submit exact 100-entry evidence for independent review");
  const timerPath = `**/api/v1/my-jobs/${setup.appointment_id}/timer`;
  const staleTimer = await call(
    page.request,
    `my-jobs/${setup.appointment_id}/timer`,
  );
  expect(staleTimer.capture_closed).toBe(false);
  // Delay the independent timer's fresh result beyond the submitted job read.
  await page.route(timerPath, (route) => route.fulfill({ json: staleTimer }));
  const submitPath = `**/api/v1/appointments/${setup.appointment_id}/submit-completion`;
  let releaseSubmission: () => void = () => {};
  const release = new Promise<void>((resolve) => {
    releaseSubmission = resolve;
  });
  let savedSubmission: () => void = () => {};
  const saved = new Promise<void>((resolve) => {
    savedSubmission = resolve;
  });
  await page.route(submitPath, async (route) => {
    const response = await route.fetch();
    expect(response.ok()).toBe(true);
    savedSubmission();
    await release;
    await route.fulfill({ response });
  });
  await page
    .getByRole("button", {
      name: "Submit exact evidence for review",
      exact: true,
    })
    .click();
  await saved;
  try {
    await page.getByRole("button", { name: "Start work", exact: true }).click();
    const dialog = page.getByRole("dialog", {
      name: "Start work",
      exact: true,
    });
    await dialog
      .getByLabel("Short note", { exact: true })
      .fill("SYN retain my note when the submitted report arrives");
    releaseSubmission();
    await expect(
      dialog.getByRole("button", { name: "Start work", exact: true }),
    ).toBeDisabled();
    await expect(dialog.getByLabel("Short note", { exact: true })).toHaveValue(
      "SYN retain my note when the submitted report arrives",
    );
    await expect(dialog.getByRole("status")).toContainText(
      "evidence is frozen",
    );
    page.once("dialog", (warning) => warning.accept());
    await dialog.getByRole("button", { name: "Cancel", exact: true }).click();
    await expect(dialog).toHaveCount(0);
  } finally {
    releaseSubmission();
  }
  await page.unroute(submitPath);
  await expect(
    page
      .getByRole("link", { name: "Open report review and revision history" })
      .locator(".."),
  ).toContainText("Submitted");
  const submitted = (
    await call(page.request, `my-jobs/${setup.appointment_id}`)
  ).items[0];
  expect(submitted.report.status).toBe("Submitted");
  await expect(page.locator("#ppo-work-timer .tag")).toHaveText("Timer closed");
  await expect(
    page.getByRole("button", { name: "Timer closed", exact: true }),
  ).toBeDisabled();
  await page.unroute(timerPath);
  await page.screenshot({ path: info.outputPath("completion-online.png") });
  const reportLink = page.getByRole("link", {
    name: "Open report review and revision history",
  });
  const reportHref = (await reportLink.getAttribute("href"))!;
  await reportLink.click();
  await expect(
    page.getByRole("heading", { name: /Revision \d+ · Submitted/ }),
  ).toBeVisible();
  await page.goto("/offline/index.html");
  await expect(page.locator("#workspace")).toBeVisible();
  await page.reload();
  await expect(page.locator("#workspace")).toBeVisible();
  const retained = (await localRows(page)) as Stored[];
  expect(retained.map((x) => x.original)).toEqual(originals);
  expect(retained.every((x) => x.status.state === "ServerSaved")).toBe(true);
  await call(page.request, "local-session", { profile: "coordinator" });
  await page.goto(reportHref);
  await expect(
    page.getByRole("heading", {
      name: "Review exact submitted entries",
      exact: true,
    }),
  ).toBeVisible();
  await expect(page.getByLabel(/Entry \d+ review reason/)).toHaveCount(100);
  const report = (await call(page.request, `reports/${submitted.report.id}`))
    .items[0];
  expect(report.can_review).toBe(true);
  expect(
    report.revisions[0].snapshot.entries
      .map((e: { id: string }) => e.id)
      .sort(),
  ).toEqual(
    job.draft_revisions[0].entries.map((e: { id: string }) => e.id).sort(),
  );
  expect(
    await (
      await page.request.get(
        `/api/v1/attachments/${job.attachments[0].id}/bytes`,
      )
    ).body(),
  ).toEqual(png());
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({ path: info.outputPath("service-review.png") });
  await writeFile(
    info.outputPath("completion-handoff.json"),
    JSON.stringify(
      {
        source_head: execFileSync("git", ["rev-parse", "HEAD"], {
          encoding: "utf8",
        }).trim(),
        app_sha256: createHash("sha256")
          .update(await readFile("src/offline/app.ts"))
          .digest("hex"),
        timer_sha256: createHash("sha256")
          .update(await readFile("src/components/work-timer.tsx"))
          .digest("hex"),
        test_sha256: createHash("sha256")
          .update(
            await readFile("tests/browser/offline-completion-handoff.spec.ts"),
          )
          .digest("hex"),
        captured_at: new Date().toISOString(),
        viewport: page.viewportSize(),
        project: info.project.name,
        appointment_id: setup.appointment_id,
        capture_ids: job.draft_revisions[0].entries,
        original_operation_ids: originals.map((x) => x.operation_id),
        attachment: {
          id: job.attachments[0].id,
          status: job.attachments[0].status,
        },
        report: { id: submitted.report.id, status: submitted.report.status },
        retained_originals: retained.length,
      },
      null,
      2,
    ),
  );
});

test("online completion handoff preserves originals and unsaved text when current access or navigation fails", async ({
  page,
}, info) => {
  test.setTimeout(120000);
  const setup = await prepared(
    page,
    info.project.name.startsWith("mobile") ? "2030-08-08" : "2030-08-07",
    true,
  );
  await open(page, setup.appointment_id);
  await page
    .getByRole("button", { name: "Save provisional start intent", exact: true })
    .click();
  await expect(page.locator("#queue .queue-row")).toHaveCount(1);
  await note(page);
  await save(page);
  const sent = page.waitForResponse(
    (r) => new URL(r.url()).pathname === "/api/v1/sync/operations",
  );
  await page
    .getByRole("button", {
      name: "Send next batch / retry originals",
      exact: true,
    })
    .click();
  expect((await sent).ok()).toBe(true);
  await expect(
    page.getByRole("button", {
      name: "Send next batch / retry originals",
      exact: true,
    }),
  ).toBeEnabled();
  const original = await localRows(page);
  const handoff = page.getByRole("button", {
    name: "Continue completion online",
    exact: true,
  });
  for (const status of [503, 403]) {
    await page.route(`**/api/v1/my-jobs/${setup.appointment_id}`, (route) =>
      route.fulfill({
        status,
        json: {
          code: "SYNCurrentReadRefused",
          message: "SYN current job unavailable",
        },
      }),
    );
    await handoff.click();
    await expect(page.locator("#error")).toContainText(
      "SYN current job unavailable",
    );
    await expect(page).toHaveURL(/\/offline\/index.html$/);
    expect(await localRows(page)).toEqual(original);
    await page.unroute(`**/api/v1/my-jobs/${setup.appointment_id}`);
  }
  await page
    .getByLabel("Work performed", { exact: true })
    .fill("SYN unsaved completion wording must remain after Cancel");
  const dialog = page.waitForEvent("dialog");
  const navigating = handoff.click();
  const warning = await dialog;
  expect(warning.type()).toBe("beforeunload");
  await warning.dismiss();
  await navigating;
  await expect(page).toHaveURL(/\/offline\/index.html$/);
  await expect(page.getByLabel("Work performed", { exact: true })).toHaveValue(
    "SYN unsaved completion wording must remain after Cancel",
  );
  expect(await localRows(page)).toEqual(original);
  await call(page.request, "local-session", { profile: "second-company" });
  await handoff.click();
  await expect(page.locator("#error")).toContainText("active identity changed");
  await expect(page).toHaveURL(/\/offline\/index.html$/);
  await call(page.request, "local-session", { profile: "assigned-technician" });
  await page
    .getByRole("button", { name: "Verify identity online", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Verify identity online", exact: true }),
  ).toBeEnabled();
  expect(await localRows(page)).toEqual(original);
});
