import { test, expect, type Page } from "@playwright/test";
import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
const company = "20000000-0000-4000-8000-000000000001",
  site = "70000000-0000-4000-8000-000000000001",
  org = "50000000-0000-4000-8000-000000000001",
  person = "60000000-0000-4000-8000-000000000001",
  owner = "30000000-0000-4000-8000-000000000001";
const base = () => ({
  schema_version: 1,
  operation_id: randomUUID(),
  reason: "SYN CS native browser proof",
});
async function login(page: Page, origin: string, profile = "coordinator") {
  const r = await page.request.post(origin + "/api/v1/local-session", {
    headers: { origin },
    data: { profile },
  });
  expect(r.status()).toBe(200);
}
async function post(
  page: Page,
  origin: string,
  path: string,
  data: unknown,
  status = 200,
) {
  const r = await page.request.post(origin + "/api/v1/" + path, {
    headers: { origin },
    data,
  });
  expect(r.status(), await r.text()).toBe(status);
  return r.json();
}
async function survey(page: Page, origin: string) {
  const id = randomUUID();
  await post(
    page,
    origin,
    "cs/Survey",
    {
      ...base(),
      id,
      context_id: site,
      name: "SYN Native as-found brief",
      owner_id: owner,
    },
    201,
  );
  return id;
}
test.beforeEach(async ({ page, baseURL }) => login(page, baseURL!));
test("CS01 source tabs restore through URL navigation and exact canonical links", async ({
  page,
}) => {
  await page.goto(`/customers/${org}?view=sites`);
  await expect(
    page.getByRole("tab", { name: "Sites & equipment", exact: true }),
  ).toHaveAttribute("aria-selected", "true");
  await expect(
    page.getByRole("link", { name: "Account development", exact: true }),
  ).toHaveAttribute("href", `/customers/${org}/development`);
  await page.getByRole("tab", { name: "Sales orders", exact: true }).click();
  await expect(
    page.getByText("No verified sales-order read contract is connected.", {
      exact: false,
    }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("tab", { name: "Sales orders", exact: true }),
  ).toHaveAttribute("aria-selected", "true");
  await page
    .getByRole("tab", { name: "Sales orders", exact: true })
    .press("Home");
  await expect(
    page.getByRole("tab", { name: "Overview", exact: true }),
  ).toHaveAttribute("aria-selected", "true");
  await expect(
    page.getByRole("link", {
      name: "Stakeholders & relationships",
      exact: true,
    }),
  ).toHaveAttribute("href", `/customers/${org}/stakeholders`);
});
test("CS02 contact correction persists and a competing writer keeps the unsaved correction visible", async ({
  page,
  baseURL,
}) => {
  const id = randomUUID();
  await post(
    page,
    baseURL!,
    "people",
    {
      ...base(),
      id,
      company_ids: [company],
      display_name: "SYN browser contact",
    },
    201,
  );
  await page.goto(`/people/${id}`);
  await page
    .getByRole("button", { name: "Correct contact", exact: true })
    .click();
  await page
    .getByLabel("Name", { exact: true })
    .fill("SYN corrected browser contact");
  await page
    .getByLabel("Reason for correction", { exact: true })
    .fill("SYN corrected source");
  await page
    .getByRole("button", { name: "Save contact correction", exact: true })
    .click();
  await expect(
    page.getByRole("heading", {
      name: "SYN corrected browser contact",
      exact: true,
    }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Correct contact", exact: true })
    .click();
  await page.getByLabel("Name", { exact: true }).fill("SYN retained draft");
  await post(page, baseURL!, `people/${id}/revise`, {
    ...base(),
    expected_version: 2,
    display_name: "SYN concurrent source",
    email: null,
    phone: null,
    contact_preference: null,
    active: true,
  });
  await page
    .getByLabel("Reason for correction", { exact: true })
    .fill("SYN stale proof");
  await page
    .getByRole("button", { name: "Save contact correction", exact: true })
    .click();
  await expect(page.locator(".business-error[role=alert]")).toContainText(
    /changed|version|reload/i,
  );
  await expect(page.getByLabel("Name", { exact: true })).toHaveValue(
    "SYN retained draft",
  );
  page.once("dialog", (dialog) => dialog.accept());
  await page
    .getByRole("button", { name: "Cancel correction", exact: true })
    .click();
});
test("CS08 UI captures a measured zero with an explicit unit and independently reviews the exact submission", async ({
  page,
  baseURL,
}) => {
  const id = await survey(page, baseURL!);
  await page.goto(`/surveys/${id}?view=observations`);
  await page
    .getByRole("button", { name: "Edit observations", exact: true })
    .click();
  await page.getByLabel("Survey scope and purpose",{exact:true}).fill("SYN inspect the water-line fall at this Site");
  await page
    .getByRole("button", { name: "Add observation", exact: true })
    .click();
  await page
    .getByLabel("Observation", { exact: true })
    .fill("SYN observed zero fall");
  await page
    .getByLabel("Observation basis", { exact: true })
    .selectOption("Measured");
  await page.getByLabel("Measured value", { exact: true }).fill("0");
  await page.getByLabel("Explicit unit", { exact: true }).fill("mm");
  await page
    .getByLabel("Finding / missing information", { exact: true })
    .fill("SYN zero explicitly measured, not unknown");
  await page
    .getByLabel("Observer or source person", { exact: true })
    .fill("SYN field observer");
  await page
    .getByLabel("Method and source", { exact: true })
    .fill("SYN spirit-level observation");
  await page
    .getByLabel("Reason for this revision", { exact: true })
    .fill("SYN first capture");
  await page
    .getByRole("button", { name: "Save revision", exact: true })
    .click();
  await expect(page.getByText("0 mm", { exact: true })).toBeVisible();
  await page
    .getByRole("tab", { name: "Review & handover", exact: true })
    .click();
  await page
    .getByLabel("Review, clarification or acknowledgement reason", {
      exact: true,
    })
    .fill("SYN submission");
  await page
    .getByRole("button", { name: "Record action", exact: true })
    .click();
  await expect(page.getByText(/Submitted · revision 1/)).toBeVisible();
  await login(page, baseURL!, "cs-reviewer");
  await page.reload();
  await page.getByLabel("Action", { exact: true }).selectOption("review");
  const snapshots = page.getByLabel("Exact retained snapshot", { exact: true });
  await snapshots.selectOption({ index: 1 });
  await page
    .getByLabel("Review, clarification or acknowledgement reason", {
      exact: true,
    })
    .fill("SYN independent as-found review");
  await page
    .getByRole("button", { name: "Record action", exact: true })
    .click();
  await expect(page.getByText(/Reviewed · revision 1/)).toBeVisible();
  await expect(
    page.getByText(/does not certify design suitability/).first(),
  ).toBeVisible();
});

async function ensurePlan(
  page: Page,
  origin: string,
  kind: "Readiness" | "AccountPlan",
) {
  const context_id = kind === "Readiness" ? site : org;
  const found = await (
    await page.request.get(
      `${origin}/api/v1/cs/${kind}?context_id=${context_id}`,
    )
  ).json();
  if (found.items[0]) return found.items[0].id as string;
  const id = randomUUID();
  await post(
    page,
    origin,
    `cs/${kind}`,
    {
      ...base(),
      id,
      context_id,
      name: `SYN ${kind} native proof`,
      owner_id: owner,
    },
    201,
  );
  return id;
}
test("CS06 native preparation retains blockers and acknowledgement grants no authority", async ({
  page,
  baseURL,
}) => {
  await ensurePlan(page, baseURL!, "Readiness");
  await page.goto(`/sites/${site}/readiness?view=preparation`);
  await page
    .getByLabel("Exact activity basis", { exact: true })
    .fill("SYN Inspection");
  await page
    .getByLabel("Attendance starts", { exact: true })
    .fill("2026-10-01T09:00");
  await page
    .getByLabel("Attendance ends", { exact: true })
    .fill("2026-10-01T10:00");
  await page
    .getByLabel("Review, clarification or acknowledgement reason", {
      exact: true,
    })
    .fill("SYN retain unconfirmed work window");
  await page
    .getByRole("button", { name: "Record action", exact: true })
    .click();
  await expect(
    page.locator("summary").filter({hasText:/Preparation.*revision/}).first(),
  ).toBeVisible();
  await page.getByLabel("Action", { exact: true }).selectOption("acknowledge");
  await page
    .getByLabel("Exact retained snapshot", { exact: true })
    .selectOption({ index: 1 });
  await page
    .getByLabel("Review, clarification or acknowledgement reason", {
      exact: true,
    })
    .fill("SYN read the retained blockers; no work authorised");
  await page
    .getByRole("button", { name: "Record action", exact: true })
    .click();
  await expect(page.getByText(/Acknowledged/).first()).toBeVisible();
  await expect(page.getByText(/does not authorise work/).first()).toBeVisible();
});
test("CS07 native plan saves proposed visits and retains unknown context", async ({
  page,
  baseURL,
}) => {
  await ensurePlan(page, baseURL!, "AccountPlan");
  await page.goto(`/customers/${org}/development?view=visits`);
  await page.getByRole("button", { name: "Edit visits", exact: true }).click();
  await page
    .getByLabel("Relationship objectives", { exact: true })
    .fill("SYN understand the customer growing plans");
  await page
    .getByRole("button", {
      name: "Add planned relationship visit",
      exact: true,
    })
    .click();
  await page
    .getByLabel("Visit purpose", { exact: true })
    .last()
    .fill("SYN discuss the next growing season");
  await page
    .getByLabel("Reason for this revision", { exact: true })
    .fill("SYN proposed visit, no resource booking");
  await page
    .getByRole("button", { name: "Save revision", exact: true })
    .click();
  await expect(
    page
      .getByText("SYN discuss the next growing season", { exact: true })
      .first(),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByText(/Planned visits are proposals/).first(),
  ).toBeVisible();
});
for (const width of [1440, 1280, 1024, 768, 430, 390, 320]) {
  test(`CS native family remains operable without application overflow at ${width}px`, async ({
    page,
    baseURL,
  }, info) => {
    test.skip(
      info.project.name !== "desktop-chromium",
      "One exact viewport proof per declared width.",
    );
    await page.setViewportSize({ width, height: 960 });
    await ensurePlan(page, baseURL!, "Readiness");
    await ensurePlan(page, baseURL!, "AccountPlan");
    const surveyId = await survey(page, baseURL!);
    const screens = [
      ["customer", `/customers/${org}`, "Overview"],
      ["contact", `/people/${person}`, "Identity"],
      ["stakeholders", `/customers/${org}/stakeholders`, "Current"],
      ["site", `/sites/${site}`, "Details"],
      ["readiness", `/sites/${site}/readiness`, ""],
      ["plan", `/customers/${org}/development`, ""],
      ["survey", `/surveys/${surveyId}`, "Survey scope"],
    ] as const;
    for (const [name, path, tab] of screens) {
      await page.goto(path);
      await expect(
        page.locator(".cs-workspace, .record-tablist").first(),
      ).toBeVisible();
      if (tab)
        await expect(
          page.getByRole("tab", { name: new RegExp(tab) }).first(),
        ).toBeVisible();
      await expect(page.locator(".business-heading h1").first()).toBeVisible();
      await expect(page.getByText(/^Loading permitted records/)).toHaveCount(0);
      await expect(page.locator(".business-error[role=alert]")).toHaveCount(0);
      await expect
        .poll(() =>
          page.locator(".ppo-shell-header").evaluate((header) => {
            const bounds = header.getBoundingClientRect();
            return Array.from(header.querySelectorAll(".ppo-header-utilities button"))
              .filter((button) => button.getClientRects().length > 0)
              .every((button) => {
                const rect = button.getBoundingClientRect();
                return rect.top >= bounds.top && rect.bottom <= bounds.bottom;
              });
          }),
        )
        .toBe(true);
      await expect
        .poll(() =>
          page.evaluate(
            () => document.documentElement.scrollWidth <= window.innerWidth + 1,
          ),
        )
        .toBe(true);
      await page.screenshot({
        path: info.outputPath(`cs-${name}-${width}.png`),
        fullPage: false,
      });
    }
  });
}
test("CS receiving references retain their source workflow and independent desktop/mobile captures", async ({
  browser,
}, info) => {
  test.skip(
    info.project.name !== "desktop-chromium",
    "Sources captured once per declared width.",
  );
  const refs = [
    [
      "customer",
      "docs/reference/ui/customers/PPO-Customer-360-Workspace-r01.html",
      "Customer 360",
    ],
    [
      "contacts",
      "docs/reference/ui/customers/PPO-Contacts-Stakeholders-and-Relationships-r01.html",
      "Contacts",
    ],
    [
      "sites",
      "docs/reference/ui/customers/PPO-Customers-Sites-and-Growing-Areas-Workspace-r03.html",
      "Sites",
    ],
    [
      "readiness",
      "docs/reference/ui/site-access/PPO-Site-Access-and-Horticultural-Readiness-r01.html",
      "Readiness",
    ],
    [
      "survey",
      "docs/reference/ui/customers/PPO-Site-Survey-and-As-Found-Workspace-r01.html",
      "Survey",
    ],
  ] as const;
  const page = await browser.newPage();
  try {
    for (const [name, file, term] of refs) {
      const source = await readFile(file, "utf8");
      expect(source.toLowerCase()).toContain(term.toLowerCase());
      for (const width of [1440, 390]) {
        await page.setViewportSize({ width, height: 960 });
        await page.goto(pathToFileURL(resolve(file)).href);
        await expect(page.locator("h1").first()).toBeVisible();
        await page.screenshot({
          path: info.outputPath(`source-${name}-${width}.png`),
          fullPage: false,
        });
      }
    }
  } finally {
    await page.close();
  }
});
