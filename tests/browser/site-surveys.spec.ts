import { test, expect, type Page } from "@playwright/test";
import {
  id,
  record,
  register,
  workspace,
} from "../helpers/site-surveys-presentation";
const site = "70000000-0000-4000-8000-000000000001",
  owner = "30000000-0000-4000-8000-000000000001",
  reviewer = "30000000-0000-4000-8000-000000000009";
async function mount(page: Page, baseURL: string) {
  const response = await page.request.post(baseURL + "/api/v1/local-session", {
    headers: { origin: baseURL },
    data: { profile: "coordinator" },
  });
  expect(response.status()).toBe(200);
  await page.route("**/api/v1/sites?*", (r) =>
    r.fulfill({
      json: {
        items: [{ id: site, display_name: "SYN Riverside Nursery" }],
        next_cursor: null,
      },
    }),
  );
  await page.route("**/api/v1/cs/Survey/options?*", (r) =>
    r.fulfill({
      json: {
        context: { id: site, timezone: "Australia/Brisbane" },
        can_create: true,
        owners: {
          edit: [{ id: owner, display_name: "SYN Alex Chen" }],
          estimating: [{ id: reviewer, display_name: "SYN Morgan Lee" }],
          engineering: [{ id: reviewer, display_name: "SYN Morgan Lee" }],
        },
        people: [],
        facilities: [],
        assets: [],
        activities: [],
      },
    }),
  );
}
test.beforeEach(async ({ page, baseURL }) => mount(page, baseURL!));
test("CS08 register keeps every drawn column and phone rows within the viewport", async ({
  page,
  isMobile,
}) => {
  await page.route("**/api/v1/cs/Survey?*", (r) =>
    r.fulfill({ json: register() }),
  );
  await page.goto("/surveys");
  await expect(
    page
      .getByRole("link", { name: new RegExp("^" + record.name) })
      .filter({ visible: true }),
  ).toBeVisible();
  if (!isMobile) {
    await expect(
      page.getByRole("columnheader", { name: "Reference", exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("columnheader", { name: "Open gaps", exact: true }),
    ).toBeVisible();
  } else {
    await page
      .getByRole("button", { name: /Filter/ })
      .first()
      .click();
    await expect(
      page.getByRole("dialog", { name: "Filter surveys" }),
    ).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).not.toBeVisible();
  }
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
test("CS08 loading, empty, unavailable, denied and paginated reads remain distinct", async ({
  page,
}) => {
  let release!: () => void;
  const hold = new Promise<void>((resolve) => (release = resolve));
  let mode = "loading";
  await page.route("**/api/v1/cs/Survey?*", async (r) => {
    if (mode === "loading") await hold;
    if (mode === "error" || mode === "denied")
      return r.fulfill({
        status: mode === "denied" ? 403 : 503,
        json: {
          error: {
            code: mode === "denied" ? "Forbidden" : "Unavailable",
            message: "SYN unavailable read",
          },
        },
      });
    return r.fulfill({
      json: {
        ...register(),
        items: mode === "empty" ? [] : register().items,
        next_cursor: mode === "partial" ? id : null,
      },
    });
  });
  await page.goto("/surveys?view=Reviewed");
  await expect(
    page.getByRole("heading", { name: "Loading site surveys…", exact: true }),
  ).toBeVisible();
  mode = "empty";
  release();
  await expect(
    page.getByRole("heading", { name: "No reviewed surveys", exact: true }),
  ).toBeVisible();
  for (const next of ["error", "denied", "partial"]) {
    mode = next;
    await page.reload();
    await expect(
      page.getByText(
        next === "error"
          ? "Could not load site surveys"
          : next === "denied"
            ? "Survey access unavailable"
            : "This is a page of permitted surveys.",
        { exact: false },
      ),
    ).toBeVisible();
  }
});
test("CS08 submitted source change is visible and the independent review and return share one form", async ({
  page,
}) => {
  const data = workspace();
  data.survey.sources.push(
    ...[
      {
        key: "Site:" + site,
        id: site,
        name: "Bay 4",
        version: 1,
        current_version: 2,
        changed: true,
      },
    ],
  );
  await page.route("**/api/v1/cs/Survey/" + id, (r) =>
    r.fulfill({ json: data }),
  );
  await page.goto("/surveys/" + id + "?view=review");
  await expect(
    page.getByRole("heading", { name: "Scope changed since submission" }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Review submission", exact: true })
    .first()
    .click();
  await expect(page.getByLabel("Review note", { exact: true })).toBeVisible();
  await page
    .getByRole("button", { name: "Return with clarification", exact: true })
    .last()
    .click();
  await expect(page.getByLabel(/clarification/i)).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
test("CS08 reviewer conflict is explained without offering a successful review", async ({
  page,
}) => {
  const data = workspace();
  data.survey.independent_reviewer = false;
  await page.route("**/api/v1/cs/Survey/" + id, (r) =>
    r.fulfill({ json: data }),
  );
  await page.goto("/surveys/" + id + "?view=review");
  await expect(
    page.getByText(
      "The owner, recorder and submitter cannot review their own survey.",
      { exact: true },
    ),
  ).toBeVisible();
});
test("CS08 phone measurement preserves zero, visible labels and the unsaved value across tabs", async ({
  page,
}) => {
  const data = workspace();
  data.record.state = "Draft";
  await page.route("**/api/v1/cs/Survey/" + id, (r) =>
    r.fulfill({ json: data }),
  );
  for (const width of [390, 320]) {
    await page.setViewportSize({ width, height: 844 });
    await page.goto("/surveys/" + id + "?view=observations");
    await page
      .getByRole("button", { name: "Record observation", exact: true })
      .first()
      .click();
    await page.getByLabel("Title", { exact: true }).fill("SYN zero reading");
    await page.getByLabel("Value", { exact: true }).fill("0");
    await page.getByLabel("Unit", { exact: true }).fill("mm");
    const v = await page.getByLabel("Value", { exact: true }).boundingBox(),
      u = await page.getByLabel("Unit", { exact: true }).boundingBox();
    expect(Math.abs(v!.y - u!.y)).toBeLessThan(2);
    await page.setViewportSize({ width: 1024, height: 844 });
    await page.getByRole("tab", { name: "Survey scope", exact: true }).click();
    await page.getByRole("tab", { name: "Observations", exact: true }).click();
    await page.setViewportSize({ width, height: 844 });
    await expect(page.getByLabel("Value", { exact: true })).toHaveValue("0");
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    page.once("dialog", (d) => d.accept());
    await page.getByRole("button", { name: "Cancel", exact: true }).click();
  }
});

test("CS08 handover names a receiving workflow and owner against the exact reviewed submission", async ({
  page,
}) => {
  const data = workspace();
  data.record.state = "Reviewed";
  await page.route("**/api/v1/cs/Survey/" + id, (r) =>
    r.fulfill({ json: data }),
  );
  await page.goto("/surveys/" + id + "?view=review");
  await page
    .getByRole("button", { name: "Record handover", exact: true })
    .first()
    .click();
  await expect(
    page.getByText("SYN-SRV-000127 · revision 2", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Engineering", exact: true }).click();
  await page
    .getByLabel("Accountable receiving owner", { exact: true })
    .selectOption(reviewer);
  await page
    .getByLabel("Handover reason", { exact: true })
    .fill("SYN receiving review required");
  const request = page.waitForRequest(
    (r) =>
      r.url().endsWith("/cs/Survey/" + id + "/actions") &&
      r.method() === "POST",
  );
  await page.route("**/api/v1/cs/Survey/" + id + "/actions", (r) =>
    r.fulfill({
      status: 409,
      json: {
        code: "VersionConflict",
        message: "SYN survey changed. Reload before retrying.",
      },
    }),
  );
  await page
    .getByRole("button", { name: "Record reviewed handover", exact: true })
    .click();
  const body = (await request).postDataJSON();
  expect(body).toMatchObject({
    action: "handover",
    snapshot_id: data.snapshots[0].id,
    expected_version: data.record.version,
    destination: "Engineering",
    receiving_owner_id: reviewer,
  });
  await expect(page.getByLabel("Handover reason", { exact: true })).toHaveValue(
    "SYN receiving review required",
  );
  await expect(page.locator(".business-error[role=alert]")).toContainText(
    "SYN survey changed",
  );
});
