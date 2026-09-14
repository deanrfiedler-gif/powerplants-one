import { test, expect, type Page, type TestInfo } from "@playwright/test";
import { randomUUID, createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { writeFile } from "node:fs/promises";
import { crmCreate, crmBase, CRM } from "../helpers/crm";
import { discoveryInput } from "../helpers/estimating-discovery";
import { discoveryDefinition } from "../../src/estimating/discovery-definition";
test.describe.configure({ timeout: 240000 });
test.use({ actionTimeout: 15000 });
async function call(page: Page, path: string, body?: unknown) {
  const r = await page.request.fetch(`/api/v1/${path}`, {
    method: body === undefined ? "GET" : "POST",
    headers:
      body === undefined
        ? {}
        : {
            Origin: "http://127.0.0.1:3000",
            "Content-Type": "application/json",
          },
    data: body,
  });
  expect(r.ok(), await r.text()).toBe(true);
  return r.json();
}
async function identity(page: Page, profile = "coordinator") {
  await expect(
    page.getByRole("region", {
      name: "Local demonstration identity",
      exact: true,
    }),
  ).toHaveAttribute("aria-busy", "false");
  if (!(await page.getByLabel("Identity", { exact: true }).isVisible()))
    await page
      .getByRole("button", { name: "Change identity", exact: true })
      .click();
  await page.getByLabel("Identity", { exact: true }).selectOption(profile);
  await page
    .getByRole("button", { name: "Use this identity", exact: true })
    .click();
  await expect(
    page.getByRole("region", {
      name: "Local demonstration identity",
      exact: true,
    }),
  ).toHaveAttribute("aria-busy", "false");
  await expect(
    page.getByRole("button", { name: "Change identity", exact: true }),
  ).toBeEnabled();
}
async function opportunity(page: Page) {
  await page.goto("/estimating/discovery");
  await identity(page);
  const o = { ...crmCreate(), title: `SYN E2 browser ${randomUUID()}` };
  await call(page, "crm/opportunities", o);
  return o;
}
async function saved(page: Page) {
  const o = await opportunity(page),
    discovery = discoveryInput(),
    preview = await call(page, "estimating/workspaces/preview", {
      opportunity_id: o.id,
      discovery,
    });
  const input = {
    ...crmBase(),
    id: randomUUID(),
    option_id: randomUUID(),
    revision_id: randomUUID(),
    opportunity_id: o.id,
    discovery,
    expected_opportunity_version: preview.expected_opportunity_version,
    context_hash: preview.context_hash,
    confirmed_question_ids: preview.required_confirmation_ids,
  };
  await call(page, "estimating/workspaces", input);
  await page.goto(`/estimating/discovery/${input.id}`);
  await expect(
    page.getByRole("heading", {
      name: "Saved revision 1 · Complete",
      exact: true,
    }),
  ).toBeVisible();
  return { input, path: `estimating/workspaces/${input.id}` };
}
async function capture(
  page: Page,
  info: TestInfo,
  name: string,
  anchor = ".business-heading",
) {
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page
    .locator(anchor)
    .first()
    .evaluate((e) => e.scrollIntoView({ block: "start" }));
  const bytes = await page.screenshot({
      path: info.outputPath(`E2-${name}.png`),
    }),
    checkout = execFileSync("git", ["rev-parse", "HEAD"], {
      encoding: "utf8",
    }).trim();
  await writeFile(
    info.outputPath(`E2-${name}.json`),
    JSON.stringify(
      {
        name,
        viewport: page.viewportSize(),
        source_head: process.env.PPO_SOURCE_HEAD ?? checkout,
        executed_checkout: checkout,
        tree: execFileSync("git", ["rev-parse", "HEAD^{tree}"], {
          encoding: "utf8",
        }).trim(),
        run_id: process.env.GITHUB_RUN_ID,
        run_attempt: process.env.GITHUB_RUN_ATTEMPT,
        byte_count: bytes.length,
        sha256: createHash("sha256").update(bytes).digest("hex"),
      },
      null,
      2,
    ),
  );
}
async function acknowledge(page: Page) {
  // Locator.all() does not wait for the asynchronous comparison to render.
  // Read the actual comparison before enumerating its required confirmations.
  await expect(
    page.getByRole("region", { name: "Discovery comparison", exact: true }),
  ).toBeVisible();
  for (const checkbox of await page
    .getByRole("checkbox", { name: /^I confirm Q/ })
    .all())
    await checkbox.check();
}
async function compareSave(page: Page, reason: string) {
  await page
    .getByLabel("Discovery change reason", { exact: true })
    .fill(reason);
  await page
    .getByRole("button", { name: "Compare discovery proposal", exact: true })
    .click();
  await expect(
    page.getByRole("region", { name: "Discovery comparison", exact: true }),
  ).toBeVisible();
  await acknowledge(page);
  await page
    .getByRole("button", { name: "Save discovery revision", exact: true })
    .click();
  await expect(
    page.getByRole("region", { name: "Discovery proposal", exact: true }),
  ).toHaveCount(0);
}
async function fillQuestion(
  page: Page,
  id: string,
  value: string | number | { choice: string },
) {
  const q = discoveryDefinition.questions.find((q) => q.id === id)!;
  await page
    .getByLabel(`${id} answer state`, { exact: true })
    .selectOption("Confirmed");
  if (q.type === "TextOrNone" && typeof value === "object")
    await page
      .getByLabel(`${id} declaration`, { exact: true })
      .selectOption(value.choice);
  else if (q.type === "Choice")
    await page
      .getByLabel(`${id} ${q.label}`, { exact: true })
      .selectOption(String(value));
  else
    await page
      .getByLabel(`${id} ${q.label}`, { exact: true })
      .fill(String(value));
  await page
    .getByLabel(`${id} source`, { exact: true })
    .fill("SYN browser recorded source");
}

test("E2 browser creates scoped discovery and retains the original unknown creation through candidate refresh", async ({
  page,
}, info) => {
  const o = await opportunity(page),
    input = discoveryInput(),
    options = await call(
      page,
      `estimating/workspaces/form-options?opportunity_id=${o.id}`,
    );
  await page.goto(`/estimating/discovery/new?opportunity=${o.id}`);
  await page
    .getByRole("checkbox", { name: "Product supply", exact: true })
    .check();
  const facility = options.facilities.find(
    (f: { id: string }) => f.id === input.scope.facility_ids[0],
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
    (e: { id: string }) => e.id === input.scope.equipment_ids[0],
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
    .fill("SYN estimator declaration");
  for (const answer of input.answers)
    await fillQuestion(
      page,
      answer.question_id,
      answer.value as string | number | { choice: string },
    );
  await page
    .getByLabel("Discovery change reason", { exact: true })
    .fill("SYN create exact scoped discovery");
  await page
    .getByRole("button", { name: "Compare discovery proposal", exact: true })
    .click();
  const save = page.getByRole("button", {
    name: "Create discovery workspace",
    exact: true,
  });
  await expect(save).toBeDisabled();
  await acknowledge(page);
  await expect(save).toBeEnabled();
  await capture(page, info, "create-comparison", ".e2-comparison");
  let original: Record<string, unknown> | undefined;
  await page.route("**/api/v1/estimating/workspaces", async (route) => {
    if (route.request().method() !== "POST") return route.continue();
    original = route.request().postDataJSON();
    const accepted = await route.fetch();
    expect(accepted.ok()).toBe(true);
    await route.abort("failed");
  });
  await save.click();
  const recovery = page.getByRole("button", {
    name: "Confirm original save outcome",
    exact: true,
  });
  await expect(recovery).toBeVisible();
  await expect(
    page.getByLabel("Existing opportunity", { exact: true }),
  ).toBeDisabled();
  const refreshed = page.waitForResponse(
    (r) =>
      r.url().endsWith("/api/v1/estimating/options") &&
      r.request().method() === "GET",
  );
  await page.evaluate(() => window.dispatchEvent(new Event("focus")));
  await refreshed;
  await expect(recovery).toBeVisible();
  await expect(
    page.getByLabel("Q01 Included work", { exact: true }),
  ).toBeDisabled();
  await capture(
    page,
    info,
    "creation-original-retained",
    '.business-error[role="alert"]',
  );
  await page.unroute("**/api/v1/estimating/workspaces");
  await recovery.click();
  await expect(
    page.getByRole("heading", { name: "Estimating workspace", exact: true }),
  ).toBeVisible();
  const d = await call(page, `estimating/workspaces/${original!.id}`);
  expect(d.workspace.version).toBe(1);
  expect(d.options).toHaveLength(1);
  expect(d.options[0].revision.input.scope).toEqual(input.scope);
  await page.reload();
  await expect(
    page.getByRole("heading", {
      name: "Saved revision 1 · Complete",
      exact: true,
    }),
  ).toBeVisible();
  await capture(page, info, "saved-reload", ".e2-snapshot");
});

test("E2 browser retains a stale proposal, explicitly compares the new predecessor and reconciles one original save", async ({
  page,
}, info) => {
  const s = await saved(page);
  await page
    .getByRole("button", { name: "Edit discovery", exact: true })
    .click();
  await page
    .getByLabel("Q01 Included work", { exact: true })
    .fill("SYN retained local proposal");
  const change = {
    kind: "Save",
    option_id: s.input.option_id,
    expected_version: 1,
    expected_revision_id: s.input.revision_id,
    discovery: {
      ...s.input.discovery,
      answers: s.input.discovery.answers.map((a) =>
        a.question_id === "Q01"
          ? { ...a, value: "SYN another writer saved this" }
          : a,
      ),
    },
  };
  const preview = await call(page, s.path + "/preview", change);
  await call(page, s.path, {
    ...crmBase(),
    ...change,
    revision_id: randomUUID(),
    context_hash: preview.context_hash,
    comparison_hash: preview.comparison_hash,
    confirmed_question_ids: preview.required_confirmation_ids,
  });
  await page
    .getByLabel("Discovery change reason", { exact: true })
    .fill("SYN compare current revision before saving");
  await page
    .getByRole("button", { name: "Compare discovery proposal", exact: true })
    .click();
  await expect(page.getByRole("alert").first()).toBeVisible();
  await page.evaluate(() => window.dispatchEvent(new Event("focus")));
  await expect(
    page.getByLabel("Q01 Included work", { exact: true }),
  ).toHaveValue("SYN retained local proposal");
  await page
    .getByText("Compare current saved revision before continuing", {
      exact: true,
    })
    .click();
  await page
    .getByRole("button", {
      name: "Keep my proposal and compare against the current revision",
      exact: true,
    })
    .click();
  await page
    .getByRole("button", { name: "Compare discovery proposal", exact: true })
    .click();
  await expect(
    page.getByRole("checkbox", { name: "I confirm Q01 in this exact proposal", exact: true }),
  ).toBeVisible();
  await acknowledge(page);
  let original: Record<string, unknown> | undefined;
  await page.route(`**/api/v1/${s.path}`, async (route) => {
    if (route.request().method() !== "POST") return route.continue();
    original = route.request().postDataJSON();
    const accepted = await route.fetch();
    expect(accepted.ok()).toBe(true);
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
  await expect(
    page.getByLabel("Q01 Included work", { exact: true }),
  ).toBeDisabled();
  await expect(page.getByRole("button", { name: /^Option A/ })).toBeDisabled();
  await capture(
    page,
    info,
    "successor-uncertain",
    '.business-error[role="alert"]',
  );
  await page.unroute(`**/api/v1/${s.path}`);
  await page
    .getByRole("button", { name: "Confirm original save outcome", exact: true })
    .click();
  await expect(
    page.getByRole("heading", {
      name: "Saved revision 3 · Complete",
      exact: true,
    }),
  ).toBeVisible();
  const d = await call(page, s.path);
  expect(d.workspace.version).toBe(3);
  expect(d.options[0].revision.id).toBe(original!.revision_id);
  expect(
    (await call(page, s.path + `/revisions?revision_id=${s.input.revision_id}`))
      .input,
  ).toEqual(s.input.discovery);
});

test("E2 browser hides and restores original answers, copies unconfirmed discovery and explicitly selects, archives and reopens", async ({
  page,
}, info) => {
  const s = await saved(page);
  await page
    .getByRole("button", { name: "Edit discovery", exact: true })
    .click();
  await page
    .getByRole("checkbox", { name: "Product supply", exact: true })
    .uncheck();
  await page
    .getByRole("checkbox", { name: "Defined labour", exact: true })
    .check();
  await fillQuestion(page, "Q07", "No");
  await compareSave(
    page,
    "SYN changed system with original product answers retained",
  );
  let d = await call(page, s.path);
  expect(
    d.options[0].revision.retained_hidden_answers.map(
      (a: { question_id: string }) => a.question_id,
    ),
  ).toEqual(["Q05", "Q06"]);
  await page
    .getByRole("button", { name: "Edit discovery", exact: true })
    .click();
  await page
    .getByRole("checkbox", { name: "Defined labour", exact: true })
    .uncheck();
  await page
    .getByRole("checkbox", { name: "Product supply", exact: true })
    .check();
  await expect(
    page.getByLabel("Q05 Product description", { exact: true }),
  ).toHaveValue("SYN sensor reference");
  await page
    .getByLabel("Discovery change reason", { exact: true })
    .fill("SYN reconfirm reactivated product scope");
  await page
    .getByRole("button", { name: "Compare discovery proposal", exact: true })
    .click();
  await expect(
    page.getByRole("checkbox", {
      name: "I confirm Q05 in this exact proposal",
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Save discovery revision", exact: true }),
  ).toBeDisabled();
  await acknowledge(page);
  await page
    .getByRole("button", { name: "Save discovery revision", exact: true })
    .click();
  await expect(
    page.getByRole("region", { name: "Discovery proposal", exact: true }),
  ).toHaveCount(0);
  await page
    .getByRole("button", { name: "Copy discovery to alternative", exact: true })
    .click();
  await page.getByLabel("New option label", { exact: true }).fill("B");
  await page
    .getByLabel("Copied answers owner", { exact: true })
    .selectOption(CRM.owner);
  await page
    .getByLabel("Copied answers follow-up reason", { exact: true })
    .fill("SYN confirm alternative scope independently");
  await page
    .getByLabel("Discovery change reason", { exact: true })
    .fill("SYN explicit alternative");
  await page
    .getByRole("button", { name: "Compare discovery proposal", exact: true })
    .click();
  await expect(
    page.getByRole("region", { name: "Discovery comparison", exact: true }),
  ).toContainText("Incomplete");
  await expect(page.getByRole("checkbox", { name: /^I confirm/ })).toHaveCount(
    0,
  );
  await page
    .getByRole("button", { name: "Create alternative", exact: true })
    .click();
  await expect(
    page.getByRole("region", { name: "Discovery proposal", exact: true }),
  ).toHaveCount(0);
  await page
    .getByRole("button", { name: /^Option B · Alternative · Active/ })
    .click();
  await expect(
    page.getByRole("heading", {
      name: "Saved revision 1 · Incomplete",
      exact: true,
    }),
  ).toBeVisible();
  await capture(page, info, "copied-unconfirmed", ".e2-snapshot");
  await page
    .getByRole("button", { name: "Select this option", exact: true })
    .click();
  await page
    .getByLabel("Option action reason", { exact: true })
    .fill("SYN choose B basis");
  await page
    .getByRole("button", { name: "Confirm select", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: /^Option B · Selected basis/ }),
  ).toBeVisible();
  await page.getByRole("button", { name: /^Option A · Alternative/ }).click();
  await page
    .getByRole("button", { name: "Archive this option", exact: true })
    .click();
  await page
    .getByLabel("Option action reason", { exact: true })
    .fill("SYN archive unused A");
  await page
    .getByRole("button", { name: "Confirm archive", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: /^Option A · Alternative · Archived/ }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Reopen this option", exact: true })
    .click();
  await page
    .getByLabel("Option action reason", { exact: true })
    .fill("SYN reopen A for later comparison");
  await page
    .getByRole("button", { name: "Confirm reopen", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: /^Option A · Alternative · Active/ }),
  ).toBeVisible();
  d = await call(page, s.path);
  expect(d.workspace.version).toBe(7);
  expect(d.workspace.selected_option_id).not.toBe(s.input.option_id);
  await capture(page, info, "reopened-unselected", ".e2-options");
});

test("E2 browser clears unsaved answers on identity change and keeps keyboard controls within 320px", async ({
  page,
}, info) => {
  await saved(page);
  await page.setViewportSize({ width: 320, height: 844 });
  await page
    .getByRole("button", { name: "Edit discovery", exact: true })
    .click();
  await page
    .getByLabel("Q01 Included work", { exact: true })
    .fill("SYN private unsaved E2 proposal");
  await page.getByLabel("Q01 Included work", { exact: true }).focus();
  await expect(
    page.getByLabel("Q01 Included work", { exact: true }),
  ).toBeFocused();
  await capture(page, info, "phone-320-proposal", ".e2-question");
  await identity(page, "systems");
  await expect(
    page.getByLabel("Q01 Included work", { exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByText("SYN private unsaved E2 proposal", { exact: true }),
  ).toHaveCount(0);
  await expect(page.getByRole("alert").first()).toBeVisible();
  await capture(
    page,
    info,
    "identity-cleared",
    '.business-error[role="alert"]',
  );
});
