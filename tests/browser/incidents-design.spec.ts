import { test, expect } from "@playwright/test";
import { destinations } from "../../src/shell/navigation";
import {
  incidentId,
  incidentRow,
  incidentContext,
  incidentFixture,
} from "../helpers/incident-design-fixture";

// Presentation/state proof uses synthetic reads. Persisted commands remain covered by field-incidents.spec.ts.
test.beforeEach(async ({ page }) => {
  await page.route(/^https:\/\/[^/]+\.fontawesome\.com\//, (route) =>
    route.abort(),
  );
  await page.route("**/api/v1/**", (route) =>
    route.fulfill({
      json: {
        items: [],
        observed_at: incidentRow.reported_at,
        completeness: "Complete",
      },
    }),
  );
  await page.route("**/api/v1/local-session", (route) =>
    route.fulfill({
      json: {
        actor_id: incidentRow.reporter_id,
        workspace_id: "10000000-0000-4000-8000-000000000001",
        display_name: incidentRow.reporter,
      },
    }),
  );
  await page.route("**/api/v1/shell/context", (route) =>
    route.fulfill({
      json: {
        display_name: incidentRow.reporter,
        preference_scope: "fi06-design",
        actions: [],
        navigation: destinations.map((d) => d.id),
        can_preview: true,
      },
    }),
  );
  await page.route("**/api/v1/service/incidents/context?*", (route) =>
    route.fulfill({ json: incidentContext }),
  );
});

test("FI-06 uncertain submit retries the exact original operation and sends site time as UTC", async ({ page }, info) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const current = structuredClone(incidentFixture);
  current.row.state = "Draft";
  let first: Record<string, unknown> | undefined;
  let retry: Record<string, unknown> | undefined;
  await page.route(`**/api/v1/service/incidents/${incidentId}`, route => route.fulfill({ json: current }));
  await page.route("**/api/v1/operations/*", route => route.fulfill({ status: 404, json: { code: "Unavailable", message: "Original receipt unavailable" } }));
  await page.route("**/api/v1/service/incidents", async route => {
    const body = route.request().postDataJSON();
    if (body.action === "save") {
      expect(body.facts.occurred_at).toBe("2026-10-12T01:35:00.000Z");
      current.row.facts = body.facts;
      current.row.version++;
    } else if (!first) {
      first = body;
      await route.abort("connectionreset");
      return;
    } else {
      retry = body;
      current.row.state = "Submitted";
      current.row.version++;
    }
    await route.fulfill({ status: 201, json: { operation_id: body.operation_id, record_id: incidentId, record_version: current.row.version, state: current.row.state, receipt_id: "16000000-0000-4000-8000-000000000069", accepted_at: incidentRow.reported_at } });
  });
  await page.goto(`/service/incidents/${incidentId}`);
  await page.getByLabel("Occurred", { exact: true }).fill("2026-10-12T11:35");
  await page.getByLabel("Reason for this report or correction", { exact: true }).fill("SYN occurrence clarified before submission");
  await page.getByRole("button", { name: "Submit report", exact: true }).click();
  await page.getByRole("dialog", { name: "Submit this report?" }).getByRole("button", { name: "Submit report", exact: true }).click();
  await expect(page.getByText("We don’t know if your report arrived", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Save draft", exact: true })).toBeDisabled();
  await page.locator(".shared-record").evaluate(e => e.scrollTop = 0);
  await page.screenshot({ path: info.outputPath("uncertain-submit-390.png") });
  await page.getByRole("button", { name: "Recover the original", exact: true }).click();
  await expect(page.locator(".shared-record-title")).toContainText("Submitted");
  expect(first?.action).toBe("submit");
  expect(retry).toEqual(first);
});

test("FI-06 register filters, counts, semantic grid, menu focus and responsive widths", async ({
  page,
}, info) => {
  let denied = false;
  await page.route("**/api/v1/service/incidents", (route) =>
    route.fulfill(
      denied
        ? {
            status: 403,
            json: {
              code: "Unavailable",
              message: "Current incident access unavailable",
            },
          }
        : {
            json: {
              items: [
                incidentRow,
                {
                  ...incidentRow,
                  id: "16000000-0000-4000-8000-000000000065",
                  reference: "SYN-PPO-INC-000042",
                  state: "Closed",
                  hold: false,
                  actions_open: 0,
                  site_id: "other",
                  site: "SYN Other site",
                },
              ],
              as_at: incidentRow.reported_at,
              window: "Latest 200 candidates, individually permission checked.",
            },
          },
    ),
  );
  for (const width of [1440, 1024, 390, 320]) {
    await page.setViewportSize({
      width,
      height: width < 600 ? 844 : width === 1024 ? 768 : 900,
    });
    await page.goto("/service/incidents?department=service");
    await expect(
      page.getByRole("link", { name: incidentRow.reference, exact: true }),
    ).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth + 1,
      ),
    ).toBe(true);
    expect(
      (await page.locator("#ppo-incidents tbody tr").first().boundingBox())!
        .height,
    ).toBeLessThanOrEqual(44);
    await page.screenshot({ path: info.outputPath(`register-${width}.png`) });
  }
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.reload();
  await page.getByRole("button", { name: /Holding work/ }).click();
  await expect(
    page.getByRole("link", { name: "SYN-PPO-INC-000042", exact: true }),
  ).toHaveCount(0);
  await page.getByRole("button", { name: "Site", exact: true }).click();
  await page
    .getByRole("menuitemradio", { name: "SYN Other site", exact: true })
    .click();
  await expect(
    page.getByText("No matching incidents", { exact: true }),
  ).toBeVisible();
  await page.screenshot({ path: info.outputPath("empty.png") });
  await page
    .getByRole("button", { name: "Incident register actions", exact: true })
    .click();
  await page.keyboard.press("Escape");
  await expect(
    page.getByRole("button", {
      name: "Incident register actions",
      exact: true,
    }),
  ).toBeFocused();
  denied = true;
  await page
    .getByRole("button", { name: "Refresh incidents", exact: true })
    .click();
  await expect(
    page.getByText("Current incident access unavailable"),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: incidentRow.reference, exact: true }),
  ).toHaveCount(0);
  await page.screenshot({ path: info.outputPath("denied.png") });
});

test("FI-06 record states keep authority and original evidence separate", async ({
  page,
}, info) => {
  let current = structuredClone(incidentFixture);
  await page.route(`**/api/v1/service/incidents/${incidentId}`, (route) =>
    route.fulfill({ json: current }),
  );
  await page.goto(`/service/incidents/${incidentId}?department=service`);
  await expect(
    page.getByText("Scope held: SYN Dosing pump DP-01", { exact: true }),
  ).toBeVisible();
  await page.screenshot({ path: info.outputPath("submitted.png") });
  await page
    .getByRole("tab", { name: "Triage and review", exact: true })
    .click();
  await page
    .getByLabel("Basis for the assessment", { exact: true })
    .fill("SYN guard assessed from original report");
  await page.getByLabel("Assessment", { exact: true }).selectOption("Assessed");
  await page.getByLabel("Priority", { exact: true }).selectOption("Routine");
  await page
    .getByLabel("Accountable owner", { exact: true })
    .selectOption(incidentRow.reporter_id);
  await page.getByLabel("Due time", { exact: true }).fill("2026-10-13T12:00");
  await expect(
    page.getByRole("button", { name: "Save triage", exact: true }),
  ).toBeEnabled();
  await page.screenshot({ path: info.outputPath("triage.png") });
  await page.getByRole("tab", { name: "Actions 1", exact: true }).click();
  await page
    .getByRole("tab", { name: "Triage and review", exact: true })
    .click();
  await expect(
    page.getByLabel("Basis for the assessment", { exact: true }),
  ).toHaveValue("SYN guard assessed from original report");
  // A new page starts from saved authority; the dirty form above is deliberately discarded by navigation.
  page.once("dialog", (dialog) => dialog.accept());
  await page.reload();
  await page.getByRole("tab", { name: "Actions 1", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Accept evidence", exact: true }),
  ).toBeDisabled();
  await page.getByRole("radio", { name: /Use SYN Guard verification/ }).check();
  await page
    .getByLabel("Reason for your decision", { exact: true })
    .fill("SYN checked exact original bytes");
  await expect(
    page.getByRole("button", { name: "Accept evidence", exact: true }),
  ).toBeEnabled();
  await page.screenshot({ path: info.outputPath("accepting-evidence.png") });
  current = {
    ...current,
    row: {
      ...current.row,
      state: "Accepted",
      assessment: "Assessed",
      priority: "Routine",
    },
    actions: current.actions.map((a) => ({
      ...a,
      accepted_by: "independent-synthetic-reviewer",
    })),
  };
  await page.reload();
  await page
    .getByRole("tab", { name: "Triage and review", exact: true })
    .click();
  await expect(
    page.getByText("Preview · not issued", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText(/Restricted details and evidence stay out/),
  ).toBeVisible();
  await page.screenshot({ path: info.outputPath("ready-to-close.png") });
  current = {
    ...current,
    duties: Object.fromEntries(
      Object.keys(current.duties).map((k) => [k, false]),
    ) as typeof current.duties,
    sensitive: false,
  };
  await page.reload();
  await page
    .getByRole("tab", { name: "Triage and review", exact: true })
    .click();
  await expect(
    page.getByRole("button", {
      name: "Close incident and issue internal outcome",
      exact: true,
    }),
  ).toHaveCount(0);
  for (const width of [390, 320]) {
    await page.setViewportSize({ width, height: 844 });
    await page
      .getByRole("tab", { name: "Factual report", exact: true })
      .click();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth + 1,
      ),
    ).toBe(true);
    await page.screenshot({ path: info.outputPath(`reporter-${width}.png`) });
  }
});

test("FI-06 report form validates, uses site time, confirms hold and retains input offline", async ({
  page,
}, info) => {
  for (const width of [1440, 390, 320]) {
    await page.setViewportSize({ width, height: width < 600 ? 844 : 900 });
    await page.goto(
      `/service/incidents/new?appointment_id=${incidentRow.appointment_id}`,
    );
    await page
      .getByLabel("Exact affected scope and equipment", { exact: true })
      .selectOption(
        `${incidentContext.targets[0].scope_item_id}:${incidentContext.targets[0].asset_id}`,
      );
    await page.getByRole("radio", { name: "Near miss", exact: true }).check();
    await page
      .getByLabel("Operational summary", { exact: true })
      .fill(incidentRow.summary);
    await page
      .getByLabel("Factual observations", { exact: true })
      .fill(incidentFixture.row.facts.observations);
    await page
      .getByLabel("Immediate response already taken", { exact: true })
      .fill(incidentFixture.row.facts.immediate_response);
    await page
      .getByLabel("Source reference", { exact: true })
      .fill(incidentFixture.row.facts.source_reference);
    await page
      .getByLabel("Reason for this report or correction", { exact: true })
      .fill("SYN factual observation for triage");
    await page.getByLabel("Occurred", { exact: true }).fill("2026-10-12T10:35");
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth + 1,
      ),
    ).toBe(true);
    await page.locator(".shared-record").evaluate((e) => (e.scrollTop = 0));
    await page.screenshot({
      path: info.outputPath(`report-form-${width}.png`),
    });
    await page
      .getByRole("button", { name: "Submit report", exact: true })
      .click();
    const sheet = page.getByRole("dialog", {
      name: "Submit this report?",
      exact: true,
    });
    await expect(sheet).toBeVisible();
    await expect(sheet.getByText(/until the incident is closed/)).toBeVisible();
    await page.screenshot({
      path: info.outputPath(`submit-sheet-${width}.png`),
    });
    await page.keyboard.press("Escape");
    await expect(sheet).toHaveCount(0);
    await expect(
      page.getByRole("button", { name: "Submit report", exact: true }),
    ).toBeFocused();
    await page.context().setOffline(true);
    await expect(
      page.getByRole("button", { name: "Submit report", exact: true }),
    ).toBeDisabled();
    await expect(
      page.getByRole("button", { name: "Save draft", exact: true }),
    ).toBeDisabled();
    await expect(
      page.getByText(/Not connected — reports are never queued offline/),
    ).toBeVisible();
    await page.locator(".shared-record").evaluate((e) => (e.scrollTop = 0));
    await page.screenshot({
      path: info.outputPath(`not-connected-${width}.png`),
    });
    await expect(
      page.getByLabel("Operational summary", { exact: true }),
    ).toHaveValue(incidentRow.summary);
    await page.context().setOffline(false);
    page.once("dialog", (dialog) => dialog.accept());
  }
});
