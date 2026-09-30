import { test, expect, type APIRequestContext } from "@playwright/test";
import { closeDatabase } from "../../src/platform/database";
import { setupPolicy, reviewed, rows } from "../helpers/policy-commands";
import { acknowledged } from "../helpers/field";

let pack: Awaited<ReturnType<typeof acknowledged>>,
  policy: Awaited<ReturnType<typeof reviewed>>;
test.beforeAll(async () => {
  await setupPolicy();
  pack = await acknowledged();
  policy = await reviewed();
});
test.afterAll(closeDatabase);
async function call(request: APIRequestContext, path: string, data?: unknown) {
  const r = await request.fetch(`/api/v1/${path}`, {
    method: data === undefined ? "GET" : "POST",
    headers: { Origin: `http://127.0.0.1:${process.env.PPO_PORT ?? "3000"}` },
    data,
  });
  expect(r.ok(), await r.text()).toBeTruthy();
  return r.json();
}
test("compiled Step 4: stale preparation, immediate field hold, controlled cancellation and exact uncertain resolution recovery", async ({
  page,
  request,
}, info) => {
  const id = pack.pack.appointment_id;
  await call(page.request, "local-session", { profile: "coordinator" });
  await page.goto(`/service/appointments/${id}`);
  await page
    .getByRole("button", { name: "Move or reassign", exact: true })
    .click();
  const form = page.getByRole("region", { name: "Move or reassign" });
  await expect(form.getByText(/Publication head 1/)).toBeVisible();
  await form
    .getByLabel("Change reason", { exact: true })
    .fill("SYN retain exact current preparation across publication");
  expect(
    (await page.request.get("/api/v1/schedule/policy-family")).status(),
  ).toBe(403);
  await call(request, "local-session", {
    profile: "scheduling-policy-publisher",
  });
  expect((await call(request, "schedule/policy-family")).head.version).toBe(1);
  const published = await call(
    request,
    "schedule/policy-publications",
    policy.publish,
  );
  const same = await call(
    request,
    "schedule/policy-publications",
    policy.publish,
  );
  expect(same).toEqual(published);
  await form.getByRole("button", { name: "Save proposed move" }).click();
  await expect(
    form.getByText(
      "Published scheduling authority changed. Prepare and review this visit again.",
      { exact: true },
    ),
  ).toBeVisible();
  await form
    .getByRole("button", { name: "Review current booking policy" })
    .click();
  await expect(form.getByText(/Publication head 2/)).toBeVisible();
  // Automatic policy-read failures must not steal focus during native date editing.
  const startControl = form.getByLabel("Start (site time)", { exact: true });
  const finishControl = form.getByLabel("Finish (site time)", { exact: true });
  const invalidStart = new Date(
    Date.parse((await finishControl.inputValue()) + "Z") + 86400000,
  )
    .toISOString()
    .slice(0, 16);
  await startControl.fill(invalidStart);
  await expect(
    form.getByRole("alert").filter({ hasText: "Finish must follow start." }),
  ).toBeVisible();
  await expect(startControl).toBeFocused();
  await expect(
    form.getByRole("button", { name: "Save proposed move" }),
  ).toBeDisabled();
  await expect(finishControl).toBeEnabled();
  await form.getByRole("button", { name: "Close proposal" }).click();
  await page.reload();
  await expect(page.getByText(/Responsible owner:/).first()).toBeVisible();
  await expect(page.getByText(/Source publication:/).first()).toBeVisible();
  for (const width of info.project.name.includes("mobile")
    ? [390, 320]
    : [1440, 1024]) {
    await page.setViewportSize({ width, height: 960 });
    await page
      .getByText(/Responsible owner:/)
      .first()
      .scrollIntoViewIfNeeded();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({
      path: info.outputPath(`appointment-hold-${width}.png`),
      fullPage: true,
    });
  }
  await call(page.request, "local-session", { profile: "assigned-technician" });
  await page.goto("/my-jobs");
  await expect(
    page
      .getByText(
        "Scheduling policy hold. Open the job for its owner and required resolution.",
      )
      .first(),
  ).toBeVisible();
  await page.goto(`/my-jobs/${id}`);
  await expect(page.getByText(/Scheduling policy hold/).first()).toBeVisible();
  await page
    .getByLabel("Start context", { exact: true })
    .fill("SYN current policy hold refuses this original start");
  await page.getByRole("button", { name: "Record my actual start" }).click();
  await expect(
    page.getByText("Resolve the current start blockers.", { exact: true }),
  ).toBeVisible();
  await page.screenshot({
    path: info.outputPath("field-start-held.png"),
    fullPage: true,
  });
  expect(
    (
      await rows(
        "SELECT count(*)::int n FROM ppo.field_attendances WHERE appointment_id=$1",
        [id],
      )
    )[0].n,
  ).toBe(0);
  await call(page.request, "local-session", { profile: "coordinator" });
  await page.goto("/schedule/policy-impact");
  await expect(
    page.getByRole("heading", {
      name: "Published scheduling impacts",
      exact: true,
    }),
  ).toBeVisible();
  await expect(page.getByText(/Responsible owner:/).first()).toBeVisible();
  await page.goto(`/service/appointments/${id}`);
  await page
    .getByRole("button", { name: "Cancel appointment", exact: true })
    .click();
  await page
    .getByLabel("Cancellation reason", { exact: true })
    .fill("SYN controlled cancellation after published impact");
  await page
    .getByRole("button", { name: "Cancel future appointment", exact: true })
    .click();
  await expect(
    page.getByText(
      "Cancellation reason: SYN controlled cancellation after published impact",
    ),
  ).toBeVisible();
  await page
    .getByText("Resolve scheduling impact after a controlled change", {
      exact: true,
    })
    .click();
  await page
    .getByLabel("Controlled outcome", { exact: true })
    .selectOption("Cancelled");
  await page
    .getByLabel("Resolution reason", { exact: true })
    .fill("SYN exact controlled cancellation verified");
  await page
    .getByRole("button", { name: "Evaluate current booking", exact: true })
    .click();
  await expect(page.getByText(/Current disposition: Unresolved/)).toBeVisible();
  const submitted: string[] = [];
  let drop = true;
  await page.route(
    "**/api/v1/schedule/policy-impacts/*/resolve",
    async (route) => {
      submitted.push(route.request().postData()!);
      const response = await route.fetch();
      if (drop) {
        drop = false;
        expect(response.status()).toBe(201);
        await route.abort("failed");
      } else {
        expect(response.status()).toBe(200);
        await route.fulfill({ response });
      }
    },
  );
  await page
    .getByRole("button", { name: "Save verified resolution", exact: true })
    .click();
  await expect(
    page.getByText(/Result uncertain. Retry this unchanged resolution/),
  ).toBeVisible();
  await expect(
    page.getByLabel("Controlled outcome", { exact: true }),
  ).toBeDisabled();
  await page
    .getByRole("button", { name: "Retry original resolution", exact: true })
    .click();
  await expect(
    page.getByText(
      "Policy resolution saved. Independent readiness checks still apply.",
      { exact: true },
    ),
  ).toBeVisible();
  expect(submitted).toHaveLength(2);
  expect(submitted[1]).toBe(submitted[0]);
  await expect(page.getByText(/Current disposition: Current/)).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: info.outputPath("resolution-recovered.png"),
    fullPage: true,
  });
  expect(
    (
      await rows(
        "SELECT count(*)::int n FROM ppo.scheduling_policy_resolutions WHERE appointment_id=$1",
        [id],
      )
    )[0].n,
  ).toBe(1);
});
