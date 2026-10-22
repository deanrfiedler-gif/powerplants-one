import { emptyConfiguration } from "../../src/estimating/configuration-definition";
import { test, expect, type Page } from "@playwright/test";
import { randomUUID } from "node:crypto";
import { crmCreate, crmBase } from "../helpers/crm";
import { structuredDiscovery } from "../helpers/estimating-configuration";
import { discoveryInput } from "../helpers/estimating-discovery";
import { openAccountPanel, identityToggle } from "../helpers/phone-menu";
test.setTimeout(150000);
test.use({ actionTimeout: 15000 });
async function call(page: Page, path: string, body?: unknown) {
  const r = await page.request.fetch("/api/v1/" + path, {
    method: body === undefined ? "GET" : "POST",
    headers:
      body === undefined
        ? {}
        : {
            Origin: new URL(page.url()).origin,
            "Content-Type": "application/json",
          },
    data: body,
  });
  expect(r.ok(), await r.text()).toBe(true);
  return r.json();
}
async function fixture(page: Page, structured = false) {
  await page.goto("/estimating/discovery");
  await expect(
    page.getByRole("region", {
      name: "Local demonstration identity",
      exact: true,
    }),
  ).toHaveAttribute("aria-busy", "false");
  if (!(await page.getByLabel("Identity", { exact: true }).isVisible()))
    await openAccountPanel(page);
  await page
    .getByLabel("Identity", { exact: true })
    .selectOption("coordinator");
  await page
    .getByRole("button", { name: "Use this identity", exact: true })
    .click();
  await expect(identityToggle(page)).toBeEnabled();
  const opportunity = crmCreate();
  opportunity.title = "SYN Nursery browser " + randomUUID();
  await call(page, "crm/opportunities", opportunity);
  const discovery = structured ? structuredDiscovery(true) : discoveryInput(),
    preview = await call(page, "estimating/workspaces/preview", {
      opportunity_id: opportunity.id,
      discovery,
    });
  const input = {
    ...crmBase(),
    id: randomUUID(),
    option_id: randomUUID(),
    revision_id: randomUUID(),
    opportunity_id: opportunity.id,
    discovery,
    expected_opportunity_version: preview.expected_opportunity_version,
    context_hash: preview.context_hash,
    confirmed_question_ids: preview.required_confirmation_ids,
    configuration_confirmations: preview.configuration_confirmations,
  };
  await call(page, "estimating/workspaces", input);
  await page.goto(
    `/estimating/discovery/${input.id}/nursery?option=${input.option_id}`,
  );
  await expect(
    page.getByRole("heading", { name: "Nursery Automation", exact: true }),
  ).toBeVisible();
  return { id: input.id, path: `estimating/workspaces/${input.id}/nursery` };
}
async function failRefresh(page: Page, path: string, abort = false) {
  await page.route("**/api/v1/" + path + "?**", (route) =>
    abort
      ? route.abort("failed")
      : route.fulfill({
          status: 503,
          contentType: "application/json",
          body: JSON.stringify({
            error: {
              code: "TemporaryUnavailable",
              message: "SYN transient refresh failure",
            },
          }),
        }),
  );
  await page.evaluate(() => window.dispatchEvent(new Event("focus")));
  await expect(
    page.getByText(
      /Refresh failed. Your draft and original save recovery are retained/,
    ),
  ).toBeVisible();
}
async function recoverRefresh(page: Page, path: string) {
  await page.unroute("**/api/v1/" + path + "?**");
  await page
    .getByRole("button", { name: "Try loading again", exact: true })
    .click();
  await expect(
    page.getByText(
      /Refresh failed. Your draft and original save recovery are retained/,
    ),
  ).toHaveCount(0);
}

test("N1 native capture retains source conflict, supplier coverage and unknowns after original-save recovery", async ({
  page,
}, info) => {
  const f = await fixture(page);
  await page
    .getByRole("button", { name: "Edit discovery", exact: true })
    .click();
  await page
    .getByLabel("Study name", { exact: true })
    .fill("SYN native potting study");
  await failRefresh(page, f.path);
  await expect(page.getByLabel("Study name", { exact: true })).toHaveValue(
    "SYN native potting study",
  );
  await recoverRefresh(page, f.path);
  await page.getByLabel("Javo Standard 2.0", { exact: true }).check();
  await page
    .getByRole("button", { name: "Add production scenario", exact: true })
    .click();
  await page
    .getByLabel("Scenario 1 name", { exact: true })
    .fill("SYN current pot crop");
  await page
    .getByRole("combobox", {
      name: "Container diameter evidence state",
      exact: true,
    })
    .selectOption("Conflict");
  const diameter = page.getByRole("group", {
    name: "Container diameter (mm)",
    exact: true,
  });
  await diameter
    .getByRole("button", { name: "Add source claim", exact: true })
    .click();
  await page
    .getByLabel("Container diameter source claim 1", { exact: true })
    .fill("55");
  await page
    .getByLabel("Container diameter claim source 1", { exact: true })
    .fill("SYN customer brief");
  await diameter
    .getByRole("button", { name: "Add source claim", exact: true })
    .click();
  await page
    .getByLabel("Container diameter source claim 2", { exact: true })
    .fill("60");
  await page
    .getByLabel("Container diameter claim source 2", { exact: true })
    .fill("SYN sample note");
  await page
    .getByLabel("Container diameter clarification owner", { exact: true })
    .fill("SYN estimator");
  await page
    .getByLabel("Container diameter next action", { exact: true })
    .fill("Confirm sample");
  await page
    .getByRole("combobox", { name: "Commissioning applicability", exact: true })
    .selectOption("Applicable");
  await page
    .getByRole("combobox", { name: "Commissioning selection", exact: true })
    .selectOption("Base");
  await page
    .getByRole("combobox", {
      name: "Commissioning responsibility",
      exact: true,
    })
    .selectOption("Supplier");
  await page
    .getByLabel("Commissioning scope and coverage evidence", { exact: true })
    .fill("SYN supplier included; review pending");
  await page
    .getByRole("button", { name: "Add production scenario", exact: true })
    .click();
  await page
    .getByLabel("Scenario 2 name", { exact: true })
    .fill("SYN future phase");
  await page
    .getByRole("combobox", { name: "Scenario 2 phase", exact: true })
    .selectOption("Future");
  const formIds = await page
    .locator(".nac-page [id]")
    .evaluateAll((elements) => elements.map((e) => e.id));
  expect(new Set(formIds).size).toBe(formIds.length);
  await page
    .getByLabel("Reason for saving this revision", { exact: true })
    .fill("SYN capture customer requirements");
  await page.route("**/api/v1/" + f.path, async (route) => {
    if (route.request().method() !== "POST") return route.continue();
    const result = await route.fetch();
    expect(result.ok()).toBe(true);
    await route.abort("failed");
  });
  await page
    .getByRole("button", { name: "Save discovery revision", exact: true })
    .click();
  await expect(
    page.getByRole("button", {
      name: "Confirm original save outcome",
      exact: true,
    }),
  ).toBeVisible();
  await expect(page.getByLabel("Study name", { exact: true })).toBeDisabled();
  await failRefresh(page, f.path, true);
  await expect(
    page.getByRole("button", {
      name: "Confirm original save outcome",
      exact: true,
    }),
  ).toBeVisible();
  await expect(page.getByLabel("Study name", { exact: true })).toHaveValue(
    "SYN native potting study",
  );
  await recoverRefresh(page, f.path);
  await page.unroute("**/api/v1/" + f.path);
  await page
    .getByRole("button", { name: "Confirm original save outcome", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Edit discovery", exact: true }),
  ).toBeVisible();
  await page.reload();
  await expect(page.getByLabel("Study name", { exact: true })).toHaveValue(
    "SYN native potting study",
  );
  await expect(
    page
      .getByRole("combobox", {
        name: "Container diameter evidence state",
        exact: true,
      })
      .first(),
  ).toHaveValue("Conflict");
  await expect(
    page.getByRole("combobox", {
      name: "Commissioning responsibility",
      exact: true,
    }),
  ).toHaveValue("Supplier");
  const saved = await call(page, f.path);
  expect(saved.history).toHaveLength(1);
  expect(saved.proposal.scenarios[1].phase).toBe("Future");
  expect(saved.proposal.scenarios[0].facts.target_good_pots.value).toBeNull();
  for (const width of info.project.name.includes("mobile")
    ? [390, 320]
    : [1440, 1024]) {
    await page.setViewportSize({ width, height: 900 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.locator(".nac-context").scrollIntoViewIfNeeded();
    await page.screenshot({
      path: info.outputPath("nursery-" + width + ".png"),
    });
    await page
      .getByRole("group", { name: "Container diameter (mm)", exact: true })
      .first()
      .scrollIntoViewIfNeeded();
    await page.screenshot({
      path: info.outputPath("nursery-conflict-" + width + ".png"),
    });
  }
});
test("N1 stale edits remain unsaved and denied refresh removes the working copy", async ({
  page,
}) => {
  const f = await fixture(page);
  await page
    .getByRole("button", { name: "Edit discovery", exact: true })
    .click();
  await page
    .getByLabel("Study name", { exact: true })
    .fill("SYN retained local draft");
  const d = await call(page, f.path);
  await call(page, f.path, {
    ...crmBase(),
    reason: "SYN concurrent save",
    option_id: d.option.id,
    source_revision_id: d.source.id,
    source_hash: d.source.hash,
    expected_workspace_version: d.workspace.version,
    expected_revision_id: d.current_revision_id,
    catalogue_hash: d.catalogue_hash,
    proposal: d.proposal,
  });
  await page
    .getByLabel("Reason for saving this revision", { exact: true })
    .fill("SYN stale browser");
  await page
    .getByRole("button", { name: "Save discovery revision", exact: true })
    .click();
  await expect(
    page
      .getByRole("alert")
      .filter({
        hasText: /saved source or study changed|saved workspace changed/,
      })
      .first(),
  ).toBeVisible();
  await expect(page.getByLabel("Study name", { exact: true })).toHaveValue(
    "SYN retained local draft",
  );
  expect((await call(page, f.path)).history).toHaveLength(1);
  await page.route("**/api/v1/" + f.path + "?**", (route) =>
    route.fulfill({
      status: 403,
      contentType: "application/json",
      body: JSON.stringify({
        error: { code: "PermissionDenied", message: "SYN revoked access" },
      }),
    }),
  );
  await page.evaluate(() => window.dispatchEvent(new Event("focus")));
  await expect(page.getByLabel("Study name", { exact: true })).toHaveCount(0);
});

test("N1 historical context keeps removed system labels while successor editing uses current Discovery", async ({
  page,
}) => {
  const f = await fixture(page, true);
  const original = await call(page, f.path);
  const proposal = {
    ...original.proposal,
    system_id: original.source.systems[0].id,
  };
  await call(page, f.path, {
    ...crmBase(),
    option_id: original.option.id,
    source_revision_id: original.source.id,
    source_hash: original.source.hash,
    expected_workspace_version: original.workspace.version,
    expected_revision_id: null,
    catalogue_hash: original.catalogue_hash,
    proposal,
  });
  const saved = await call(page, f.path);
  await page.reload();
  await page
    .getByRole("combobox", { name: "Saved revision", exact: true })
    .selectOption(saved.selected.id);
  await expect(
    page.getByRole("button", { name: "Edit discovery", exact: true }),
  ).toHaveCount(0);
  await expect(page.getByLabel("Study name", { exact: true })).toBeDisabled();
  await page
    .getByRole("combobox", { name: "Saved revision", exact: true })
    .selectOption("");
  await expect(
    page.getByRole("button", { name: "Edit discovery", exact: true }),
  ).toBeVisible();
  const discovery = {
    ...discoveryInput(),
    configuration: emptyConfiguration(),
  };
  discovery.answers[0] = {
    question_id: "Q01",
    state: "Deferred",
    value: null,
    source: null,
    follow_up: {
      owner_id: original.reader_id,
      reason: "SYN changed source requires clarification",
    },
  };
  const change = {
    kind: "Save",
    option_id: original.option.id,
    expected_version: saved.workspace.version,
    expected_revision_id: original.source.id,
    discovery,
    branch_mode: null,
    copy_follow_up: null,
  };
  const preview = await call(
    page,
    `estimating/workspaces/${f.id}/preview`,
    change,
  );
  await call(page, `estimating/workspaces/${f.id}`, {
    ...crmBase(),
    ...change,
    revision_id: randomUUID(),
    context_hash: preview.context_hash,
    comparison_hash: preview.comparison_hash,
    confirmed_question_ids: preview.required_confirmation_ids,
    configuration_confirmations: preview.configuration_confirmations,
  });
  await page.reload();
  const system = page.getByRole("combobox", {
    name: "Discovery system",
    exact: true,
  });
  await expect(system).toHaveValue(proposal.system_id);
  await expect(system.locator("option:checked")).toHaveText(
    original.source.systems[0].name,
  );
  await expect(page.locator(".nac-context")).toContainText(
    "Discovery Complete",
  );
  await page
    .getByRole("button", { name: "Edit discovery", exact: true })
    .click();
  await expect(page.locator(".nac-context")).toContainText(
    "Discovery Incomplete",
  );
  await expect(system.locator("option:checked")).toContainText(
    "select a current system or clear the binding",
  );
  await system.selectOption("");
  await page
    .getByLabel("Reason for saving this revision", { exact: true })
    .fill("SYN explicitly clear removed system");
  await page
    .getByRole("button", { name: "Save discovery revision", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Edit discovery", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("combobox", { name: "Saved revision", exact: true })
    .selectOption(saved.selected.id);
  await expect(system).toHaveValue(proposal.system_id);
  await expect(system.locator("option:checked")).toHaveText(
    original.source.systems[0].name,
  );
  await expect(page.locator(".nac-context")).toContainText(
    "Discovery Complete",
  );
  await expect(
    page.getByRole("button", { name: "Edit discovery", exact: true }),
  ).toHaveCount(0);
});
