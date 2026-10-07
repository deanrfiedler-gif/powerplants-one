import { test, expect, type Page } from "@playwright/test";
import { randomUUID } from "node:crypto";
import { crmBase, crmDiscovery, CRM } from "../helpers/crm";
import { discoveryInput } from "../helpers/estimating-discovery";
import { discoveryDefinition } from "../../src/estimating/discovery-definition";
import { emptyHandover } from "../../src/sales/handover-model";
test.describe.configure({ timeout: 120000 });
async function call(page: Page, path: string, body?: unknown) {
  const r = await page.request.fetch(`/api/v1/${path}`, {
    method: body === undefined ? "GET" : "POST",
    headers: body === undefined ? {} : { Origin: "http://127.0.0.1:3000" },
    data: body,
  });
  expect(r.ok(), await r.text()).toBe(true);
  return r.json();
}
async function fixture(page: Page) {
  await call(page, "local-session", { profile: "coordinator" });
  const o = {
    ...crmDiscovery(),
    title: `SYN LC13 estimating bridge ${randomUUID()}`,
  };
  o.initial_action.due_at = "2031-10-01T00:00:00.000Z";
  o.initial_action.due_needed = false;
  await call(page, "crm/opportunities", o);
  const id = randomUUID();
  await call(page, "sales/handovers", {
    ...crmBase(),
    id,
    opportunity_id: o.id,
    kind: "Estimating",
  });
  const content = {
    ...emptyHandover(),
    problem: "SYN Sales context, independently confirmed in Discovery",
    outcome: "SYN monitoring outcome",
    included_scope: "SYN controls",
    exclusions: "None",
    assumptions: "None",
    unknowns: "SYN estimator owns scope verification",
    requested_date: "2031-10-01",
    date_reason: "SYN request",
    next_activity_id: o.initial_action.id,
  };
  await call(page, `sales/handovers/${id}`, {
    ...crmBase(),
    action: "Save",
    expected_version: 1,
    content,
    receiving_owner_id: CRM.owner,
    note: "SYN prepare",
  });
  await call(page, `sales/handovers/${id}`, {
    ...crmBase(),
    action: "Submit",
    expected_version: 2,
    note: "SYN submit",
  });
  const d = await call(page, `sales/handovers/${id}`);
  await call(page, `sales/handovers/${id}`, {
    ...crmBase(),
    action: "Accept",
    expected_version: 3,
    source_hash: d.record.source_hash,
    note: "SYN exact acceptance",
  });
  return { o, id, content };
}
async function createNative(page: Page, opportunity: string) {
  const discovery = discoveryInput(),
    v = await call(page, "estimating/workspaces/preview", {
      opportunity_id: opportunity,
      discovery,
    });
  const input = {
    ...crmBase(),
    id: randomUUID(),
    option_id: randomUUID(),
    revision_id: randomUUID(),
    opportunity_id: opportunity,
    discovery,
    expected_opportunity_version: v.expected_opportunity_version,
    context_hash: v.context_hash,
    confirmed_question_ids: v.required_confirmation_ids,
  };
  await call(page, "estimating/workspaces", input);
  return input;
}
test("LC-13 create native Discovery from accepted Sales and return for an explicit link with independent recovery", async ({
  page,
}, info) => {
  const f = await fixture(page);
  await page.goto(`/sales/handoffs/estimating/${f.id}`);
  await page
    .getByRole("link", {
      name: "Create native estimating workspace",
      exact: true,
    })
    .click();
  await expect(
    page.getByLabel("Existing opportunity", { exact: true }),
  ).toBeDisabled();
  await page
    .getByText("Reported Sales problem and scope", { exact: true })
    .click();
  await expect(
    page.getByText(f.content.problem, { exact: true }),
  ).toBeVisible();
  const input = discoveryInput(),
    options = await call(
      page,
      `estimating/workspaces/form-options?opportunity_id=${f.o.id}`,
    );
  await page
    .getByRole("checkbox", { name: "Product supply", exact: true })
    .check();
  const facility = options.facilities.find(
    (x: { id: string }) => x.id === input.scope.facility_ids[0],
  );
  await page
    .getByRole("group", { name: /^Facilities \(/ })
    .getByRole("checkbox", { name: facility.display_name, exact: true })
    .check();
  await page
    .getByRole("group", { name: /^Product supply Facilities/ })
    .getByRole("checkbox", { name: facility.display_name, exact: true })
    .check();
  const equipment = options.equipment.find(
    (x: { id: string }) => x.id === input.scope.equipment_ids[0],
  );
  await page
    .getByRole("group", { name: /^Existing equipment/ })
    .getByRole("checkbox", {
      name: `${equipment.display_name} · ${equipment.identity_status} · ${equipment.lifecycle_status}`,
      exact: true,
    })
    .check();
  await page
    .getByLabel("Effort declaration", { exact: true })
    .selectOption("Express");
  await page
    .getByLabel("Effort source", { exact: true })
    .fill("SYN independent estimator declaration");
  for (const a of input.answers) {
    const q = discoveryDefinition.questions.find(
      (q) => q.id === a.question_id,
    )!;
    await page
      .getByLabel(`${q.id} answer state`, { exact: true })
      .selectOption("Confirmed");
    if (q.type === "TextOrNone" && typeof a.value === "object")
      await page
        .getByLabel(`${q.id} declaration`, { exact: true })
        .selectOption((a.value as { choice: string }).choice);
    else if (q.type === "Choice")
      await page
        .getByLabel(`${q.id} ${q.label}`, { exact: true })
        .selectOption(String(a.value));
    else
      await page
        .getByLabel(`${q.id} ${q.label}`, { exact: true })
        .fill(String(a.value));
    await page
      .getByLabel(`${q.id} source`, { exact: true })
      .fill("SYN independently reviewed native source");
  }
  await page
    .getByLabel("Discovery change reason", { exact: true })
    .fill("SYN independent native creation");
  await page
    .getByRole("button", { name: "Compare discovery proposal", exact: true })
    .click();
  await expect(
    page.getByRole("region", { name: "Discovery comparison", exact: true }),
  ).toBeVisible();
  for (const checkbox of await page
    .getByRole("checkbox", { name: /^I confirm Q/ })
    .all())
    await checkbox.check();
  let posts = 0,
    workspace = "";
  await page.route("**/api/v1/estimating/workspaces", async (route) => {
    if (route.request().method() !== "POST") return route.continue();
    posts++;
    workspace = route.request().postDataJSON().id;
    expect((await route.fetch()).ok()).toBe(true);
    await route.abort("failed");
  });
  await page
    .getByRole("button", { name: "Create discovery workspace", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Confirm original save outcome", exact: true })
    .click();
  await expect(page).toHaveURL(
    new RegExp(`/sales/handoffs/estimating/${f.id}`),
  );
  expect(posts).toBe(1);
  await expect(
    page.getByRole("button", { name: "Review workspace link", exact: true }),
  ).toBeVisible();
  expect(
    (await call(page, `estimating/workspaces/${workspace}/sales-briefs`)).items,
  ).toHaveLength(0);
  const before = await call(page, `estimating/workspaces/${workspace}`);
  await page
    .getByRole("button", { name: "Review workspace link", exact: true })
    .click();
  await page
    .getByLabel("Link reason", { exact: true })
    .fill("SYN reviewed accepted brief beside native scope");
  await page
    .getByRole("button", { name: "Link accepted brief", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: /Current accepted brief linked/ }),
  ).toBeVisible();
  await page
    .getByRole("link", {
      name: "Open linked estimating workspace",
      exact: true,
    })
    .click();
  await expect(
    page.getByRole("heading", { name: "Accepted Sales context", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText(f.content.problem, { exact: true }),
  ).toBeVisible();
  const after = await call(page, `estimating/workspaces/${workspace}`);
  expect(after.workspace).toEqual(before.workspace);
  expect(after.options).toEqual(before.options);
  await page.reload();
  await expect(
    page.getByText(f.content.problem, { exact: true }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page
    .getByRole("heading", { name: "Accepted Sales context", exact: true })
    .scrollIntoViewIfNeeded();
  await page.screenshot({
    path: info.outputPath("accepted-sales-context.png"),
  });
});
test("LC-13 stale reviewed link is refused and accepted lost-response link survives reload without a second POST", async ({
  page,
}, info) => {
  const f = await fixture(page),
    g = await createNative(page, f.o.id);
  await page.goto(`/sales/handoffs/estimating/${f.id}`);
  await page
    .getByRole("button", { name: "Review workspace link", exact: true })
    .click();
  const change = {
    kind: "Save",
    option_id: g.option_id,
    expected_version: 1,
    expected_revision_id: g.revision_id,
    discovery: g.discovery,
  };
  const preview = await call(
    page,
    `estimating/workspaces/${g.id}/preview`,
    change,
  );
  await call(page, `estimating/workspaces/${g.id}`, {
    ...crmBase(),
    ...change,
    revision_id: randomUUID(),
    context_hash: preview.context_hash,
    comparison_hash: preview.comparison_hash,
    confirmed_question_ids: preview.required_confirmation_ids,
  });
  const refresh = page.waitForResponse(
    (r) =>
      r.url().endsWith(`/sales/handovers/${f.id}/estimating`) &&
      r.request().method() === "GET",
  );
  await page.evaluate(() => window.dispatchEvent(new Event("focus")));
  await refresh;
  await page
    .getByLabel("Link reason", { exact: true })
    .fill("SYN reviewed before concurrent native save");
  const refusal = page.waitForResponse(
    (r) =>
      r.url().endsWith(`/sales/handovers/${f.id}/estimating`) &&
      r.request().method() === "POST",
  );
  await page
    .getByRole("button", { name: "Link accepted brief", exact: true })
    .click();
  expect((await refusal).status()).toBe(409);
  await page
    .getByRole("button", { name: "Discard comparison", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Review workspace link", exact: true })
    .click();
  await page
    .getByLabel("Link reason", { exact: true })
    .fill("SYN compared refreshed native version");
  let posts = 0;
  await page.route(
    `**/api/v1/sales/handovers/${f.id}/estimating`,
    async (route) => {
      if (route.request().method() !== "POST") return route.continue();
      posts++;
      expect((await route.fetch()).ok()).toBe(true);
      await route.abort("failed");
    },
  );
  await page
    .getByRole("button", { name: "Link accepted brief", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Check original link", exact: true }),
  ).toBeVisible();
  await page.screenshot({
    path: info.outputPath("estimating-link-recovery.png"),
  });
  page.on("dialog", (dialog) => dialog.accept());
  await page.reload();
  await expect(
    page.getByRole("heading", { name: /Current accepted brief linked/ }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Check original link", exact: true }),
  ).toHaveCount(0);
  expect(posts).toBe(1);
  expect(
    (await call(page, `estimating/workspaces/${g.id}/sales-briefs`)).items,
  ).toHaveLength(1);
});
