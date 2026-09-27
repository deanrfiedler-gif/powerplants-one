import { type APIRequestContext, type Page } from "@playwright/test";
import { test, expect } from "../helpers/browser-lifecycle";
import { randomUUID, createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { prepareIsolatedFieldAppointment } from "../helpers/isolated-field-http";
import { startInput } from "../helpers/field";
import type { readFieldJob } from "../../src/field/reads";
import type { TimerView } from "../../src/field/timer-model";
type Job = Awaited<ReturnType<typeof readFieldJob>>["items"][number];

async function login(
  client: APIRequestContext,
  origin: string,
  profile: string,
) {
  const r = await client.post(origin + "/api/v1/local-session", {
    headers: { origin },
    data: { profile },
  });
  expect(r.status(), await r.text()).toBe(200);
  return r.json();
}
function caller(client: APIRequestContext, origin: string) {
  return async (path: string, body?: unknown) => {
    const r = await client.fetch(origin + "/api/v1/" + path, {
      method: body === undefined ? "GET" : "POST",
      headers: { origin },
      data: body,
    });
    expect(r.ok(), await r.text()).toBeTruthy();
    return r.json();
  };
}
async function prepared(
  page: Page,
  request: APIRequestContext,
  origin: string,
  day: string,
) {
  const call = caller(request, origin);
  await login(request, origin, "coordinator");
  const setup = await prepareIsolatedFieldAppointment(call, day);
  for (const profile of ["assigned-technician", "second-technician"]) {
    const who = await login(request, origin, profile);
    const recipient = setup.pack.readiness.recipients.find(
      (x: { user_id: string }) => x.user_id === who.actor_id,
    );
    await call(`pack-issues/${setup.pack.current_issue_id}/acknowledge`, {
      schema_version: 1,
      operation_id: randomUUID(),
      reason: "SYN independent crew pack review for timer proof",
      assignment_id: recipient.assignment_id,
      assignment_version: recipient.assignment_version,
      presented_hash: setup.pack.issues[0].output_hash,
      captured_at: new Date().toISOString(),
    });
  }
  await login(page.request, origin, "assigned-technician");
  const own = caller(page.request, origin);
  let job: Job = (await own(`my-jobs/${setup.appointment_id}`)).items[0];
  await own(`appointments/${job.id}/start`, startInput(job));
  job = (await own(`my-jobs/${job.id}`)).items[0];
  return { job, call: own };
}

test("FI01 accepted timer presentation, actual saved intervals and original-action recovery", async ({
  page,
  request,
  baseURL,
}, info) => {
  test.setTimeout(180000);
  const phone = info.project.name.startsWith("mobile");
  const { job, call } = await prepared(
    page,
    request,
    baseURL!,
    phone ? "2031-10-28" : "2031-10-27",
  );
  await page.goto(`/my-jobs/${job.id}`);
  await expect(
    page.getByRole("button", { name: "Start work", exact: true }),
  ).toBeEnabled();
  await page.getByRole("button", { name: "Start work", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Start work", exact: true });
  await expect(dialog).toBeVisible();
  expect(await dialog.evaluate((e) => e.contains(document.activeElement))).toBe(
    true,
  );
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Start work", exact: true }),
  ).toBeFocused();
  await page.keyboard.press("Enter");
  await dialog
    .getByLabel("Affected equipment")
    .selectOption(job.scope.items[0].assets[0].id);
  let original = "";
  await page.route(`**/api/v1/my-jobs/${job.id}/timer`, async (route) => {
    if (route.request().method() === "POST" && !original) {
      original = route.request().postData()!;
      const response = await route.fetch();
      expect(response.status()).toBe(201);
      await route.abort("connectionreset");
    } else await route.continue();
  });
  await dialog.getByRole("button", { name: "Start work", exact: true }).click();
  await expect(
    dialog.getByRole("button", { name: "Confirm original action" }),
  ).toBeVisible();
  await dialog.getByRole("button", { name: "Confirm original action" }).click();
  await expect(dialog).toHaveCount(0);
  const running: TimerView = await call(`my-jobs/${job.id}/timer`);
  expect(running.timer?.state).toBe("Running");
  expect(running.events).toHaveLength(1);
  expect(running.events[0].operation_id).toBe(
    JSON.parse(original).operation_id,
  );

  // Compare the actual accepted source, independently rendered at the same width.
  const reference = await page.context().newPage();
  const source = await readFile(
    "docs/reference/ui/field-work-timer/powerplants-one-field-work-timer-r05.html",
    "utf8",
  );
  const widths = phone ? [390, 320] : [1440, 1024, 820];
  const evidence: unknown[] = [];
  for (const width of widths) {
    await page.setViewportSize({ width, height: 960 });
    await reference.setViewportSize({ width, height: 960 });
    await reference.setContent(source);
    await expect(reference.locator("#ppo-work-timer")).toBeVisible();
    const measurements = (target: Page) =>
      target.locator("#ppo-work-timer").evaluate((root) => {
        const style = getComputedStyle(root);
        return {
          navy: style.getPropertyValue("--navy").trim(),
          green: style.getPropertyValue("--green").trim(),
          timerFont: getComputedStyle(root.querySelector(".elapsed")!).fontSize,
        };
      });
    expect(await measurements(page)).toEqual(await measurements(reference));
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth + 1,
      ),
    ).toBe(true);
    const control = page.getByRole("button", {
      name: "Stop work",
      exact: true,
    });
    await expect(control).toBeVisible();
    const box = await control.boundingBox();
    expect(box!.height).toBeGreaterThanOrEqual(44);
    const native = await page.screenshot({
      path: info.outputPath(`timer-native-${width}.png`),
    });
    const ref = await reference.screenshot({
      path: info.outputPath(`timer-reference-${width}.png`),
    });
    evidence.push({
      width,
      native_sha256: createHash("sha256").update(native).digest("hex"),
      reference_sha256: createHash("sha256").update(ref).digest("hex"),
      measurements: await measurements(page),
    });
  }
  await reference.close();
  await writeFile(
    info.outputPath("timer-presentation.json"),
    JSON.stringify(
      {
        reference_sha256: createHash("sha256").update(source).digest("hex"),
        evidence,
        limit:
          "Browser viewport proof; owner/device acceptance and actual browser zoom remain separate.",
      },
      null,
      2,
    ),
  );
  await page.getByRole("button", { name: "Pause", exact: true }).click();
  const pause = page.getByRole("dialog", { name: "Pause work" });
  await pause
    .getByRole("button", {
      name: "Waiting for approval · note required",
      exact: true,
    })
    .click();
  await pause
    .getByLabel("Short note")
    .fill("SYN waiting for the Service owner to confirm the inspected scope");
  await pause.getByRole("button", { name: "Pause with this reason" }).click();
  await expect(pause).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Resume work", exact: true }),
  ).toBeEnabled();
  await page.reload();
  await expect(
    page.getByRole("button", { name: "Resume work", exact: true }),
  ).toBeEnabled();
  await page.getByRole("button", { name: "Stop work", exact: true }).click();
  await expect
    .poll(async () => (await call(`my-jobs/${job.id}/timer`)).timer.state)
    .toBe("Stopped");
  const saved: Job = (await call(`my-jobs/${job.id}`)).items[0];
  expect(
    saved.entries
      .filter((e) => e.kind === "Time")
      .map((e) => e.payload.time_kind),
  ).toEqual(["Labour", "Waiting"]);
  expect(saved.attendance!.id).toBe(job.attendance!.id);
  await login(page.request, baseURL!, "technician");
  expect(
    (await page.request.get(`/api/v1/my-jobs/${job.id}/timer`)).status(),
  ).toBe(403);
});

test("FI02 retained offline timer sequence survives reload and a lost server response", async ({
  page,
  request,
  baseURL,
}, info) => {
  test.setTimeout(180000);
  const { job, call } = await prepared(
    page,
    request,
    baseURL!,
    info.project.name.startsWith("mobile") ? "2031-10-30" : "2031-10-29",
  );
  await page.goto("/offline/index.html");
  await page.waitForFunction(() => navigator.serviceWorker.controller !== null);
  await page.getByLabel("Assigned job to download").selectOption(job.id);
  await page
    .getByRole("button", { name: "Download selected job", exact: true })
    .click();
  await expect(page.locator("#notice")).toContainText(
    "Job context and exact pack saved",
  );
  let timer = page.locator(".field-extension").filter({
    has: page.getByRole("heading", {
      name: "Work timer saved on this device",
    }),
  });
  await timer
    .getByLabel("Affected equipment")
    .selectOption(job.scope.items[0].assets[0].id);
  await page.context().setOffline(true);
  await timer.getByRole("button", { name: "Save start timer locally" }).click();
  await expect(timer).toContainText("Timer intent: Running");
  await page.reload();
  await page
    .getByRole("button", { name: "Open saved field job", exact: true })
    .click();
  timer = page.locator(".field-extension").filter({
    has: page.getByRole("heading", {
      name: "Work timer saved on this device",
    }),
  });
  await expect(timer).toContainText("Timer intent: Running");
  await timer.getByRole("button", { name: "Save pause timer locally" }).click();
  await expect(timer).toContainText("Timer intent: Paused");
  await timer.getByRole("button", { name: "Save stop timer locally" }).click();
  await expect(timer).toContainText("Timer intent: Stopped");
  await expect(page.locator("#queue .queue-row")).toHaveCount(3);
  await page.screenshot({
    path: info.outputPath("timer-offline-retained.png"),
    fullPage: true,
  });
  await page.context().setOffline(false);
  let dropped = false;
  await page.route("**/api/v1/sync/operations", async (route) => {
    if (!dropped && route.request().method() === "POST") {
      dropped = true;
      await route.fetch();
      await route.abort("connectionreset");
    } else await route.continue();
  });
  await page
    .getByRole("button", { name: "Send next batch / retry originals" })
    .click();
  await expect(
    page.getByRole("button", { name: "Send next batch / retry originals" }),
  ).toBeEnabled();
  // The preserved original has the existing two-second retry backoff.
  await page.waitForTimeout(2100);
  await page
    .getByRole("button", { name: "Send next batch / retry originals" })
    .click();
  await expect
    .poll(async () => (await call(`my-jobs/${job.id}/timer`)).events.length)
    .toBe(3);
  const view: TimerView = await call(`my-jobs/${job.id}/timer`);
  expect(view.timer?.state).toBe("Stopped");
  expect(new Set(view.events.map((e) => e.operation_id)).size).toBe(3);
  await expect(page.locator("#queue")).toContainText(
    "Server accepted and saved",
  );
});
