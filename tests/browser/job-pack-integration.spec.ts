import { openPackView } from "../helpers/job-pack-design";
import { test, expect, type Page } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { registerClock, registerRows } from "../fixtures/pack-register";
import {
  assertJobPackHost,
  jobPackViewports,
} from "../helpers/job-pack-design";
async function session(page: Page) {
  expect(
    (
      await page.request.post("/api/v1/local-session", {
        headers: { Origin: new URL(test.info().project.use.baseURL!).origin },
        data: { profile: "coordinator" },
      })
    ).status(),
  ).toBe(200);
}
async function fixture(page: Page) {
  const read = JSON.parse(
    await readFile("tests/fixtures/job-pack-read.json", "utf8"),
  );
  await session(page);
  await page.route(`**/api/v1/packs/${read.items[0].id}`, (r) =>
    r.fulfill({ json: read }),
  );
  const ready = page.waitForResponse(
    (r) =>
      r.url().endsWith(`/api/v1/packs/${read.items[0].id}`) &&
      r.status() === 200,
  );
  await page.goto(`/service/packs/${read.items[0].id}`);
  await ready;
  await expect(page.locator("#jp-panel-pack .jp-paper-section")).toHaveCount(9);
  return read.items[0];
}

test("SV05 Figma register uses the compiled shell and shared controls with scoped attention views", async ({
  page,
}) => {
  await session(page);
  await page.route("**/api/v1/packs", (route) =>
    route.fulfill({
      json: { items: registerRows, observed_at: registerClock },
    }),
  );
  await page.route("**/api/v1/packs/visits", (route) =>
    route.fulfill({ json: { items: [], observed_at: registerClock } }),
  );
  await page.goto("/service/packs");
  await expect(page.locator(".jpr-count")).toHaveText("6 job packs");
  await expect(page.locator("#ppo-pack-register")).toHaveAttribute(
    "data-module-layout",
    "full-bleed",
  );
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  const attention = page.getByRole("button", {
    name: /^Readiness not satisfied/,
  });
  if (!(await attention.isVisible()))
    await page.locator(".ppo-menu-toggle").click();
  await expect(page.getByRole("button", { name: /^Prepared by me/ })).toHaveCSS(
    "color",
    "rgb(36, 42, 55)",
  );
  await attention.click();
  await expect(page.locator(".jpr-count")).toHaveText("1 job pack");
});
test("SV05 packless visit counts distinguish unavailable, loading and recovered reads", async ({ page }) => {
  await session(page);
  await page.route("**/api/v1/packs", route => route.fulfill({
    json: { items: registerRows, observed_at: registerClock },
  }));
  let unavailable = true;
  let release!: () => void;
  const pending = new Promise<void>(resolve => { release = resolve; });
  await page.route("**/api/v1/packs/visits", async route => {
    if (unavailable) {
      await route.fulfill({ status: 503, json: {
        code: "DependencyUnavailable", message: "SYN visits unavailable. Retry the read.", retryable: true,
      } });
      return;
    }
    await pending;
    await route.fulfill({ json: {
      observed_at: "2031-11-10T00:00:00Z",
      items: [{ id: "22222222-2222-4222-8222-222222222222", display_number: "SYN visit without a pack",
        work_order_reference: "SYN Work order", start_at: "2031-11-11T00:00:00Z",
        site_timezone: "Australia/Brisbane", site_name: "SYN Site" }],
    } });
  });
  await page.goto("/service/packs?view=visits");
  await expect(page.getByRole("alert").filter({ hasText: "SYN visits unavailable" })).toBeVisible();
  await expect(page.locator(".jpr-count")).toHaveText("Unavailable");
  await expect(page.getByText("No confirmed visits without a pack", { exact: true })).toHaveCount(0);
  unavailable = false;
  await page.getByRole("button", { name: "Retry loading", exact: true }).click();
  await expect(page.locator(".jpr-count")).toHaveText("Loading…");
  release();
  await expect(page.locator(".jpr-count")).toHaveText("1 visit");
  await expect(page.locator(".jpr-visits > article")).toHaveCount(1);
  await expect(page.locator(".jpr-environment")).toContainText("10 Nov 2031");
  const actions = page.getByRole("button", { name: "Register actions", exact: true });
  if (!test.info().project.name.startsWith("mobile")) {
    await expect(actions).toBeVisible();
    await actions.click();
    await expect(page.getByRole("button", { name: "Export list", exact: true })).toHaveCount(0);
    await page.keyboard.press("Escape");
  }
});

test("SV05-I5 compiled shell and state-dependent pack header fit all widths and 200% zoom reflow", async ({
  page,
}, info) => {
  test.skip(
    info.project.name.startsWith("mobile"),
    "Desktop project sweeps all widths and the effective 200% zoom viewport.",
  );
  await fixture(page);
  for (const viewport of jobPackViewports) {
    await page.setViewportSize(viewport);
    await assertJobPackHost(page);
    expect(
      await page.locator(".jp-heading-actions > .jp-primary").count(),
    ).toBeLessThanOrEqual(1);
  }
  // A 1440 x 960 display at 200% browser zoom has a 720 x 480 CSS viewport.
  // CSS zoom alone does not rerun viewport media queries and is not equivalent.
  await page.setViewportSize({ width: 720, height: 480 });
  await assertJobPackHost(page);
  await openPackView(page, "Preparation");
  await expect(page.locator("#jp-panel-prepare")).toBeVisible();
});
test("SV05-I5 browser print shows saved work and excludes unsaved preparation and shell", async ({
  page,
}) => {
  const pack = await fixture(page);
  await openPackView(page, "Preparation");
  await page
    .locator("#jp-panel-prepare textarea")
    .first()
    .fill("SYN unsaved print exclusion sentinel");
  await page.emulateMedia({ media: "print" });
  await expect(page.locator("#jp-panel-prepare")).toBeHidden();
  await expect(page.locator("#s-9")).toBeVisible();
  expect(
    await page.locator("style[data-jp-print-reference]").textContent(),
  ).toContain("@top-left");
  await expect(page.locator(".jp-reference-line")).toContainText(
    pack.display_number,
  );
  await expect(page.locator(".jp-print-warning")).toContainText(
    "controlled document is the exact issued output",
  );
  await expect(page.locator(".ppo-shell-header")).toBeHidden();
  await expect(page.locator(".mobile-navigation")).toBeHidden();
  expect(
    await page
      .locator("#ppo-job-pack")
      .evaluate((n) => n.clientHeight >= n.scrollHeight),
  ).toBe(true);
  await page.emulateMedia({ media: "screen" });
  await expect(page.locator("#jp-panel-prepare textarea").first()).toHaveValue(
    "SYN unsaved print exclusion sentinel",
  );
});
test("SV05-I5 field and appointment handovers use current pack identity and hide stale links", async ({
  page,
}) => {
  await session(page);
  let state:
    "existing" | "prepare" | "unavailable" | "denied" | "forbidden" | "failed" =
    "existing";
  const id = "10000000-0000-4000-8000-000000000042";
  await page.route("**/api/v1/appointments/*/pack", (r) =>
    ["denied", "forbidden", "failed"].includes(state)
      ? r.fulfill({
          status: state === "failed" ? 500 : state === "forbidden" ? 403 : 404,
          json: { message: "SYN pack unavailable to this identity" },
        })
      : r.fulfill({
          json: {
            pack:
              state === "existing"
                ? {
                    id,
                    display_number: "SYN-PPO-PACK-000042",
                    status: "Draft",
                    needs_review: true,
                  }
                : null,
            can_prepare: state === "prepare",
          },
        }),
  );
  await page.goto("/service/technicians");
  await page.getByLabel("Visit date", { exact: true }).fill("2031-09-22");
  await page
    .getByRole("button", { name: /^Open visit:/ })
    .first()
    .click();
  const appointment = await page
    .getByRole("link", { name: "Open full visit", exact: true })
    .getAttribute("href");
  await page.getByRole("tab", { name: "Job pack", exact: true }).click();
  const entry = page.getByRole("region", {
    name: "Visit job pack",
    exact: true,
  });
  await expect(
    entry.getByRole("link", { name: "Open job pack", exact: true }),
  ).toHaveAttribute("href", `/service/packs/${id}`);
  state = "prepare";
  await entry.getByRole("button", { name: "Refresh pack status" }).click();
  await expect(
    entry.getByRole("link", { name: "Prepare job pack" }),
  ).toHaveAttribute(
    "href",
    `/service/packs/new?appointment_id=${appointment!.split("/").pop()}`,
  );
  state = "unavailable";
  await entry.getByRole("button", { name: "Refresh pack status" }).click();
  await expect(entry.getByRole("link")).toHaveCount(0);
  await expect(entry).toContainText(
    "No job pack is available to this identity",
  );
  state = "existing";
  await entry.getByRole("button", { name: "Refresh pack status" }).click();
  await expect(entry.getByRole("link")).toBeVisible();
  state = "denied";
  await entry.getByRole("button", { name: "Refresh pack status" }).click();
  await expect(entry.getByRole("status")).toHaveText(
    "Job pack access is unavailable to this identity.",
  );
  await expect(entry.getByRole("alert")).toHaveCount(0);
  await expect(entry.getByRole("link")).toHaveCount(0);
  state = "forbidden";
  await entry.getByRole("button", { name: "Refresh pack status" }).click();
  await expect(entry.getByRole("status")).toHaveText(
    "Job pack access is unavailable to this identity.",
  );
  await expect(entry.getByRole("link")).toHaveCount(0);
  state = "failed";
  await entry.getByRole("button", { name: "Refresh pack status" }).click();
  await expect(entry.getByRole("alert")).toBeVisible();
  await expect(entry.getByRole("status")).toHaveCount(0);
  await expect(entry.getByRole("link")).toHaveCount(0);
  state = "existing";
  await page.goto(appointment!);
  await expect(
    entry.getByRole("link", { name: "Open job pack", exact: true }),
  ).toHaveAttribute("href", `/service/packs/${id}`);
});
