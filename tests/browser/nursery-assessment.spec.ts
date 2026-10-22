import { test, expect, type Page } from "@playwright/test";
import { randomUUID } from "node:crypto";
import { crmCreate, crmBase } from "../helpers/crm";
import { discoveryInput } from "../helpers/estimating-discovery";
import { assessmentCase } from "../helpers/nursery-assessment-case";
import { openAccountPanel, identityToggle } from "../helpers/phone-menu";
test.setTimeout(180000);
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
async function fixture(page: Page) {
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
  await call(page, "crm/opportunities", opportunity);
  const discovery = discoveryInput(),
    preview = await call(page, "estimating/workspaces/preview", {
      opportunity_id: opportunity.id,
      discovery,
    });
  const id = randomUUID(),
    option_id = randomUUID();
  await call(page, "estimating/workspaces", {
    ...crmBase(),
    id,
    option_id,
    revision_id: randomUUID(),
    opportunity_id: opportunity.id,
    discovery,
    expected_opportunity_version: preview.expected_opportunity_version,
    context_hash: preview.context_hash,
    confirmed_question_ids: preview.required_confirmation_ids,
    configuration_confirmations: preview.configuration_confirmations,
  });
  const base = "estimating/workspaces/" + id + "/nursery",
    n = await call(page, base),
    f = assessmentCase();
  await call(page, base, {
    ...crmBase(),
    option_id,
    source_revision_id: n.source.id,
    source_hash: n.source.hash,
    expected_workspace_version: n.workspace.version,
    expected_revision_id: null,
    catalogue_hash: n.catalogue_hash,
    proposal: f.source,
  });
  const path = base + "/assessments",
    d = await call(page, path);
  await call(page, path, {
    ...crmBase(),
    option_id,
    nursery_revision_id: d.current_source.id,
    nursery_hash: d.current_source.content_hash,
    expected_workspace_version: d.workspace.version,
    expected_revision_id: null,
    rule_edition: d.current_rule_edition,
    proposal: f.input,
  });
  await page.goto(
    "/estimating/discovery/" + id + "/nursery/assessment?option=" + option_id,
  );
  await expect(
    page.getByRole("heading", {
      name: "Automation technical assessment",
      exact: true,
    }),
  ).toBeVisible();
  return { id, path };
}
test("N2 edit, known target shortfall, saved outputs, read-only history and narrow layout", async ({
  page,
}) => {
  const f = await fixture(page);
  await expect(page.getByText(/Good output 13680/)).toBeVisible();
  await page
    .getByRole("button", { name: "Edit assessment", exact: true })
    .click();
  await page
    .getByLabel("Assessment name", { exact: true })
    .fill("SYN reviewed potting line");
  await page
    .getByText("SYN Planting — scenario evidence", { exact: true })
    .count(); // scoped disclosures below
  await page
    .locator("summary")
    .filter({ hasText: /scenario.*Current/i })
    .first()
    .click();
  const planting = page
    .locator("details")
    .filter({
      has: page
        .locator("summary")
        .filter({ hasText: "SYN Planting — scenario evidence" }),
    })
    .last();
  await planting.locator("summary").first().click();
  await planting
    .getByLabel("Complete-stage rate value", { exact: true })
    .fill("2000");
  await page
    .getByLabel("Reason for saving this revision", { exact: true })
    .fill("SYN slower planting trial");
  await page
    .getByRole("button", { name: "Save and assess", exact: true })
    .click();
  await expect(page.getByText(/NotSuitable · PPO-NAC-TECH-1/)).toBeVisible();
  await expect(page.getByText(/Good output 11400/)).toBeVisible();
  const d = await call(page, f.path);
  const r = await page.request.get(
    "/api/v1/" +
      f.path +
      "/output?revision_id=" +
      d.selected.id +
      "&kind=study",
  );
  expect(r.ok()).toBe(true);
  expect(r.headers()["x-content-sha256"]).toBe(d.selected.outputs.study.hash);
  expect(await r.text()).toContain("Estimating study");
  await page
    .getByLabel("Saved assessment history", { exact: true })
    .selectOption(d.history[1].id);
  await expect(
    page.getByRole("button", { name: "Edit assessment", exact: true }),
  ).toHaveCount(0);
  await expect(page.getByText(/Good output 13680/)).toBeVisible();
  await page.setViewportSize({ width: 320, height: 844 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: test.info().outputPath("assessment-320.png"),
    fullPage: true,
  });
});
test("N2 transient refresh and lost save response retain the original operation; denied refresh clears data", async ({
  page,
}) => {
  const f = await fixture(page);
  await page
    .getByRole("button", { name: "Edit assessment", exact: true })
    .click();
  await page
    .getByLabel("Assessment name", { exact: true })
    .fill("SYN original N2 save");
  await page
    .getByLabel("Reason for saving this revision", { exact: true })
    .fill("SYN recovery");
  await page.route("**/api/v1/" + f.path + "?**", (route) =>
    route.fulfill({
      status: 503,
      contentType: "application/json",
      body: JSON.stringify({
        error: { code: "TemporaryUnavailable", message: "SYN unavailable" },
      }),
    }),
  );
  await page.evaluate(() => window.dispatchEvent(new Event("focus")));
  await expect(page.getByText(/Refresh failed. Your draft/)).toBeVisible();
  await expect(page.getByLabel("Assessment name", { exact: true })).toHaveValue(
    "SYN original N2 save",
  );
  await expect(
    page.getByRole("button", { name: "Save and assess", exact: true }),
  ).toBeDisabled();
  await page.unroute("**/api/v1/" + f.path + "?**");
  await page
    .getByRole("button", { name: "Try loading again", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Save and assess", exact: true }),
  ).toBeEnabled();
  // Presentation proof: an ordinary stale Discovery basis must not destroy the editor.
  await page.route("**/api/v1/" + f.path + "?**", async route => {
    const response = await route.fetch(), body = await response.json();
    await route.fulfill({ response, json: {...body, can_edit:false, discovery_changed:true} });
  });
  await page.evaluate(()=>window.dispatchEvent(new Event("focus")));
  await expect(page.getByText(/Discovery changed. Review and save Automation discovery/)).toBeVisible();
  await expect(page.getByLabel("Assessment name",{exact:true})).toHaveValue("SYN original N2 save");
  await expect(page.getByRole("button",{name:"Save and assess",exact:true})).toBeDisabled();
  await page.unroute("**/api/v1/" + f.path + "?**");
  await page.evaluate(()=>window.dispatchEvent(new Event("focus")));
  await expect(page.getByRole("button",{name:"Save and assess",exact:true})).toBeEnabled();
  await page.route("**/api/v1/" + f.path, async (route) => {
    if (route.request().method() === "POST") {
      await route.fetch();
      await route.abort("failed");
    } else await route.continue();
  });
  await page
    .getByRole("button", { name: "Save and assess", exact: true })
    .click();
  await expect(
    page.getByRole("button", {
      name: "Confirm original save outcome",
      exact: true,
    }),
  ).toBeVisible();
  await page.unroute("**/api/v1/" + f.path);
  await page
    .getByRole("button", { name: "Confirm original save outcome", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Edit assessment", exact: true }),
  ).toBeVisible();
  expect((await call(page, f.path)).history.length).toBe(2);
  await page.route("**/api/v1/" + f.path + "?**", (route) =>
    route.fulfill({
      status: 403,
      contentType: "application/json",
      body: JSON.stringify({
        error: { code: "Forbidden", message: "SYN denied" },
      }),
    }),
  );
  await page.evaluate(() => window.dispatchEvent(new Event("focus")));
  await expect(
    page.getByRole("heading", {
      name: "Automation technical assessment",
      exact: true,
    }),
  ).toHaveCount(0);
});
