import {
  test,
  expect,
  request,
  type APIRequestContext,
} from "@playwright/test";
import { randomUUID } from "node:crypto";
import { database, closeDatabase } from "../../src/platform/database";
import { localConfig } from "../../src/platform/config";
import { CRM, crmBase } from "../helpers/crm";
import { createCostingWorkspace } from "../helpers/estimating-costing-api";
import { screenDefinition, screenInput } from "../../src/cpq/pilot";
import type { readRelease } from "../../src/cpq/reads";
import type { previewCalculation } from "../../src/cpq/runs";
test.describe.configure({ timeout: 240000 });
const grants: string[] = [];
test.beforeAll(async () => {
  if (!process.env.DATABASE_URL) process.loadEnvFile(".env.local");
  if (localConfig().database_name !== "ppo_synthetic_test")
    throw Error("Disposable synthetic database only");
  for (const [profile, caps] of [
    ["coordinator", ["cpq.read", "cpq.author", "cpq.calculate"]],
    ["products-reviewer", ["cpq.read", "cpq.review"]],
    ["products-publisher", ["cpq.read", "cpq.publish"]],
  ] as const)
    for (const cap of caps) {
      const id = randomUUID(),
        insert = await database().query(
          `INSERT INTO ppo.permission_grants(id,workspace_id,user_id,company_id,capability,scope_type,scope_id)
    SELECT $1,$2,u.id,$3,$4,'Company',$3 FROM ppo.users u WHERE u.workspace_id=$2 AND u.subject_id=$5 AND NOT EXISTS(SELECT 1 FROM ppo.permission_grants g WHERE g.workspace_id=$2 AND g.user_id=u.id AND g.company_id=$3 AND g.capability=$4) RETURNING id`,
          [id, CRM.workspace, CRM.company, cap, profile],
        );
      if (insert.rowCount) grants.push(id);
    }
});
test.afterAll(async () => {
  if (grants.length)
    await database().query(
      "DELETE FROM ppo.permission_grants WHERE id=ANY($1::uuid[])",
      [grants],
    );
  await closeDatabase();
});
async function api(
  context: APIRequestContext,
  origin: string,
  path: string,
  body?: unknown,
) {
  const r = await context.fetch(`/api/v1/${path}`, {
    method: body === undefined ? "GET" : "POST",
    headers: body === undefined ? {} : { Origin: origin },
    data: body,
  });
  expect(r.ok(), await r.text()).toBe(true);
  return r.json();
}
test("CPQ saves, explains, reopens and adopts an exact evaluation; rule drafts and test bench retain their state", async ({
  page,
  baseURL,
}, info) => {
  if (!info.project.name.includes("mobile"))
    await page.setViewportSize({ width: 1440, height: 960 });
  const origin = new URL(baseURL!).origin,
    call = (path: string, body?: unknown) =>
      api(page.request, origin, path, body);
  await call("local-session", { profile: "coordinator" });
  const releaseId = randomUUID();
  await call("cpq/releases", {
    ...crmBase(),
    id: releaseId,
    company_id: CRM.company,
    expected_version: 0,
    definition: screenDefinition(),
  });
  let release: Awaited<ReturnType<typeof readRelease>> = await call(
    `cpq/releases/${releaseId}`,
  );
  for (const [profile, actions] of [
    ["products-reviewer", ["review"]],
    ["products-publisher", ["seal", "activate"]],
  ] as const) {
    const ctx = await request.newContext({ baseURL });
    await api(ctx, origin, "local-session", { profile });
    try {
      for (const action of actions) {
        await api(ctx, origin, `cpq/releases/${releaseId}/${action}`, {
          ...crmBase(),
          expected_version: release.release.version,
          revision_id: release.current.id,
          content_hash: release.current.content_hash,
          ...(action === "review"
            ? { outcome: "Approved" }
            : action === "activate"
              ? { expected_activation_version: release.active?.version ?? 0 }
              : {}),
        });
        release = await call(`cpq/releases/${releaseId}`);
      }
    } finally {
      await ctx.dispose();
    }
  }
  const s = await createCostingWorkspace(call);
  const basis: Awaited<ReturnType<typeof previewCalculation>> = await call(
      `${s.path}/cpq/preview?option_id=${s.input.option_id}&revision_id=${s.input.revision_id}`,
    ),
    runId = randomUUID();
  await call(`${s.path}/cpq`, {
    ...crmBase(),
    id: runId,
    option_id: s.input.option_id,
    revision_id: s.input.revision_id,
    binding_hash: basis.binding_hash,
    parent_id: null,
    input: screenInput(),
  });
  const deal: string = (await call(s.path)).context.display_number;
  await call(`${s.path}/cpq`);
  await call(`cpq/runs/${runId}`);
  await call(`cpq/revisions/${release.current.id}`);
  await call(
    `cpq/drafts?company_id=${CRM.company}&kind=Configuration&estimating_workspace_id=${s.input.id}&option_id=${s.input.option_id}`,
  );
  await page.goto(
    `/estimating/cpq/${s.input.id}?option_id=${s.input.option_id}`,
  );
  await expect(
    page.getByRole("heading", {
      name: "SYN Controls upgrade qualification",
      exact: true,
    }),
  ).toBeVisible();
  // Shell top bar amendment R2/R4 (table 1040:62): the owner, then the reference the loaded configuration
  // publishes. It has no SYN-CPQ reference of its own, so it is its deal's; the tab title adds the record.
  await expect(page).toHaveTitle(
    new RegExp(
      `^${deal} · SYN Controls upgrade qualification · .+ · Configure & price · Estimating & quotation — Powerplants One$`,
    ),
  );
  if (!info.project.name.includes("mobile")) {
    const crumbs = page.locator(".ppo-crumbs li .ppo-crumb");
    await expect(crumbs).toHaveText(["Configure & price", deal]);
    await expect(crumbs.first()).toHaveAttribute("href", "/estimating/cpq");
    await expect(page.locator(".ppo-crumb-current")).toHaveAttribute(
      "aria-current",
      "page",
    );
  }
  await page
    .locator(".cpq-card")
    .filter({
      has: page.getByRole("heading", {
        name: "1 · Greenhouse 2 shade screen",
        exact: true,
      }),
    })
    .getByRole("button", { name: "Configure", exact: true })
    .click();
  await expect(page.getByLabel(/^Cable run distance/)).toHaveValue("140");
  await expect(page.locator(".cpq-header h1")).toHaveCSS(
    "letter-spacing",
    "normal",
  );
  const choices = page.getByRole("radiogroup", {
    name: "Screen cloth",
    exact: true,
  });
  const choiceBounds = (await choices.boundingBox())!;
  const firstChoice = (await choices
    .locator(".cpq-option")
    .nth(0)
    .boundingBox())!;
  const secondChoice = (await choices
    .locator(".cpq-option")
    .nth(1)
    .boundingBox())!;
  expect(Math.abs(firstChoice.width - choiceBounds.width)).toBeLessThanOrEqual(
    1,
  );
  expect(Math.abs(secondChoice.width - choiceBounds.width)).toBeLessThanOrEqual(
    1,
  );
  expect(secondChoice.y).toBeGreaterThanOrEqual(
    firstChoice.y + firstChoice.height,
  );
  await expect(
    page.getByRole("button", { name: "Save configuration", exact: true }),
  ).toBeEnabled();
  if (!info.project.name.includes("mobile")) {
    const expand = page.getByRole("button", {
      name: "Expand primary navigation",
      exact: true,
    });
    if (await expand.isVisible()) await expand.click();
    // Retained Figma frame 16: the white 380 px summary spans the complete
    // workspace beside its header and footer. This catches the prior layout
    // defect where the summary began below the tabs and ended above Save.
    const summary = page.locator(".cpq-workbench > .cpq-summary");
    await expect(summary).toBeVisible();
    await expect(summary).toHaveCSS("background-color", "rgb(255, 255, 255)");
    const panel = (await summary.boundingBox())!;
    const header = (await page.locator(".cpq-header").boundingBox())!;
    const footer = (await page.locator(".cpq-footer").boundingBox())!;
    await expect(page.locator(".cpq-footer")).toHaveCSS("font-size", "14px");
    await expect(page.getByLabel(/^Cable run distance/)).toHaveCSS(
      "margin",
      "0px",
    );
    await expect(page.getByLabel(/^Cable run distance/)).toHaveCSS(
      "font-weight",
      "400",
    );
    expect(
      (await page
        .getByRole("complementary", { name: "Application navigation" })
        .boundingBox())!.width,
    ).toBe(240);
    expect(panel.width).toBe(380);
    expect(Math.abs(panel.y - header.y)).toBeLessThanOrEqual(1);
    expect(
      Math.abs(panel.y + panel.height - footer.y - footer.height),
    ).toBeLessThanOrEqual(1);
    const actions = page.locator(".cpq-footer");
    const save = (await actions
      .getByRole("button", { name: "Save configuration", exact: true })
      .boundingBox())!;
    const use = (await actions
      .getByRole("button", { name: "Use in estimate", exact: true })
      .boundingBox())!;
    expect(save.x).toBeLessThan(use.x);
    expect(Math.abs(save.y - use.y)).toBeLessThanOrEqual(1);
    expect(footer.height).toBeLessThanOrEqual(82);
  }
  await page.screenshot({ path: info.outputPath("cpq-configure.png") });
  await page.getByLabel(/^Cable run distance/).fill("145");
  await expect(
    page.getByRole("button", { name: "Save configuration", exact: true }),
  ).toBeEnabled();
  await expect(
    page
      .locator(".cpq-footer")
      .getByRole("button", { name: "Use in estimate", exact: true }),
  ).toBeDisabled();
  await page
    .getByRole("button", { name: "Materials & labour", exact: true })
    .click();
  const why = page.getByRole("button", {
    name: "Why Cable brackets, galvanised?",
    exact: true,
  });
  await why.click();
  await expect(
    page.getByRole("dialog", { name: "Why this line?" }),
  ).toContainText("35");
  await page.keyboard.press("Escape");
  await expect(why).toBeFocused();
  const adjust = page.getByRole("button", {
    name: "Adjust Cable brackets, galvanised",
    exact: true,
  });
  await adjust.click();
  let adjustment = page.getByRole("dialog", {
    name: "Adjust line",
    exact: true,
  });
  await adjustment.getByLabel("Your quantity", { exact: false }).fill("40");
  await adjustment
    .getByLabel("Reason", { exact: false })
    .fill("SYN additional end supports.");
  await adjustment
    .getByRole("button", { name: "Apply adjustment", exact: true })
    .click();
  await page.getByRole("button", { name: "Configure", exact: true }).click();
  await page.getByLabel(/^Cable run distance/).fill("150");
  await page
    .getByRole("button", { name: "Materials & labour", exact: true })
    .click();
  await expect(
    page
      .locator(".cpq-pill")
      .filter({ hasText: /^Needs review$/ })
      .first(),
  ).toBeVisible();
  await adjust.click();
  adjustment = page.getByRole("dialog", {
    name: "Review adjustment",
    exact: true,
  });
  await expect(adjustment).toContainText("effective 40");
  await adjustment
    .getByRole("combobox", { name: "Decision", exact: true })
    .selectOption("Keep");
  await adjustment
    .getByLabel("Reason", { exact: false })
    .fill("SYN reviewed increased cable run; retain forty supports.");
  await adjustment
    .getByRole("button", { name: "Apply adjustment", exact: true })
    .click();
  await expect(
    page.locator(".cpq-pill").filter({ hasText: /^Needs review$/ }),
  ).toHaveCount(0);
  // The server commits, but the browser loses the response. Recover the exact
  // receipt instead of creating a second evaluation or abandoning the draft.
  let intercepted = false;
  await page.route("**/api/v1/estimating/workspaces/*/cpq", async (route) => {
    if (intercepted || route.request().method() !== "POST")
      return route.continue();
    intercepted = true;
    const accepted = await route.fetch();
    expect(accepted.status()).toBe(201);
    await route.abort("failed");
  });
  await page
    .getByRole("button", { name: "Save configuration", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Confirm original action", exact: true })
    .click();
  await expect(
    page
      .locator(".cpq-footer")
      .getByRole("button", { name: "Use in estimate", exact: true }),
  ).toBeEnabled();
  expect(intercepted).toBe(true);
  expect((await call(`${s.path}/cpq`)).items).toHaveLength(2);
  await page.reload();
  await page
    .locator(".cpq-card")
    .filter({
      has: page.getByRole("heading", {
        name: "1 · Greenhouse 2 shade screen",
        exact: true,
      }),
    })
    .getByRole("button", { name: "Configure", exact: true })
    .click();
  await expect(page.getByLabel(/^Cable run distance/)).toHaveValue("150");
  await page
    .locator(".cpq-footer")
    .getByRole("button", { name: "Use in estimate", exact: true })
    .click();
  const dialog = page.getByRole("dialog");
  await dialog
    .getByLabel("Estimate title", { exact: true })
    .fill("SYN CPQ browser estimate");
  for (const k of ["Included", "Excluded", "Assumptions"])
    await dialog
      .getByLabel(k, { exact: true })
      .fill(`SYN ${k.toLowerCase()} scope`);
  await dialog
    .getByRole("button", { name: "Use saved evaluation", exact: true })
    .click();
  await expect(
    page.getByText(/The configuration was used in the estimate/),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Materials & labour", exact: true })
    .click();
  if (info.project.name.includes("mobile"))
    await page.setViewportSize({ width: 320, height: 740 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({ path: info.outputPath("cpq-bom.png") });
  // A configuration that cannot be read publishes nothing: the destination alone, never the URL's ID.
  const unknown = randomUUID();
  await page.goto(`/estimating/cpq/${unknown}?option_id=${s.input.option_id}`);
  await expect(
    page.getByRole("link", { name: "Return to estimation wizard", exact: true }),
  ).toBeVisible();
  await expect(page).toHaveTitle(
    "Configure & price · Estimating & quotation — Powerplants One",
  );
  if (!info.project.name.includes("mobile"))
    await expect(page.locator(".ppo-crumbs li .ppo-crumb")).toHaveText([
      "Configure & price",
    ]);
  await page.goto(`/estimating/rules/${releaseId}`);
  await expect(
    page.getByRole("heading", { name: "Support spacing", exact: true }),
  ).toBeVisible();
  // Table 1040:62 "Rules studio / INST-SUP-001": the open rule by the key its saved release holds.
  await expect(page).toHaveTitle(
    "support_spacing · Support spacing · Rules studio · Estimating & quotation — Powerplants One",
  );
  if (!info.project.name.includes("mobile")) {
    const crumbs = page.locator(".ppo-crumbs li .ppo-crumb");
    await expect(crumbs).toHaveText(["Rules studio", "support_spacing"]);
    await expect(crumbs.first()).toHaveAttribute("href", "/estimating/rules");
  }
  // Frame 486:641 above "Applies when": the context header's "⋯" menu replaces the rule picker,
  // the four rule states are separate, and the view tabs carry counts as descriptions.
  await expect(
    page.getByRole("button", { name: "More rule actions", exact: true }),
  ).toBeVisible();
  await expect(page.getByLabel("Selected rule")).toHaveCount(0);
  const ruleState = page.getByRole("group", { name: "Rule state", exact: true });
  await expect(ruleState.getByText("Valid", { exact: true })).toBeVisible();
  await expect(ruleState).toContainText("Not run on this draft");
  await expect(
    page.getByRole("button", { name: "Test bench", exact: true }),
  ).toHaveAccessibleDescription("1 saved scenario");
  // The quick test runs the selected scenario on this exact draft, read only, with the rule's
  // own quantity, its substitution, the saved comparison and each condition's outcome.
  if (!info.project.name.includes("mobile")) {
    const quickTest = page.getByRole("region", {
      name: "Quick test",
      exact: true,
    });
    await expect(quickTest).toContainText("33 each");
    await expect(quickTest).toContainText("ceil(140 ÷ 10) × 2 + 5 = 33");
    await expect(quickTest).toContainText(
      /(Published v1|Saved version 1) gives 33 · no difference for this scenario/,
    );
    await expect(quickTest.getByText(/^True · Drive units > 0/)).toBeVisible();
  }
  // Frame 486:641: the formula reads as tokens in the action card and is edited in its dialog.
  const formulaBox = page.getByRole("group", {
    name: "Quantity formula",
    exact: true,
  });
  await expect(formulaBox).toHaveAttribute(
    "data-formula",
    screenDefinition().rules[0].quantity,
  );
  await expect(formulaBox).toContainText("Valid · result in each");
  await page.screenshot({ path: info.outputPath("cpq-definition.png") });
  await page.getByRole("button", { name: "Edit formula", exact: true }).click();
  const formulaDialog = page.getByRole("dialog", {
    name: /^Quantity formula ·/,
  });
  await expect(formulaDialog.locator(":scope > header h2")).toHaveCSS(
    "letter-spacing",
    "normal",
  );
  await expect(formulaDialog.locator(":scope > header h2")).toHaveCSS(
    "font-size",
    "20px",
  );
  await expect(formulaDialog.locator(":scope > header h2")).toHaveCSS(
    "line-height",
    "26px",
  );
  const proposedFormula = `max(${screenDefinition().rules[0].quantity}, 0)`;
  await formulaDialog
    .getByLabel("Formula", { exact: true })
    .fill(proposedFormula);
  await formulaDialog
    .getByRole("button", { name: "Run server test", exact: true })
    .click();
  await expect(
    formulaDialog.getByText("Scenario expectations match", { exact: true }),
  ).toBeVisible();
  const formulaHeader = (await formulaDialog
    .locator(":scope > header")
    .boundingBox())!;
  const formulaFooter = (await formulaDialog
    .locator(":scope > footer")
    .boundingBox())!;
  expect(formulaHeader.y).toBeGreaterThanOrEqual(0);
  expect(formulaFooter.y + formulaFooter.height).toBeLessThanOrEqual(
    page.viewportSize()!.height,
  );
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({ path: info.outputPath("cpq-formula.png") });
  await formulaDialog
    .getByRole("button", { name: "Apply to draft", exact: true })
    .click();
  await expect(formulaBox).toHaveAttribute("data-formula", proposedFormula);
  await page.getByRole("button", { name: "Edit formula", exact: true }).click();
  await formulaDialog.getByLabel("Formula", { exact: true }).fill("min(");
  await formulaDialog
    .getByRole("button", { name: "Cancel", exact: true })
    .click();
  await expect(formulaBox).toHaveAttribute("data-formula", proposedFormula);
  await page.getByRole("button", { name: "Save draft", exact: true }).click();
  await expect(
    page.locator(".cpq-footer").getByText(/· revision \d+ · saved /),
  ).toBeVisible();
  await expect(page).toHaveURL(/draft=/);
  await page.reload();
  await expect(formulaBox).toHaveAttribute("data-formula", proposedFormula);
  await page.getByRole("button", { name: "Edit formula", exact: true }).click();
  await formulaDialog
    .getByLabel("Formula", { exact: true })
    .fill(screenDefinition().rules[0].quantity);
  await formulaDialog
    .getByRole("button", { name: "Apply to draft", exact: true })
    .click();
  await expect(formulaBox).toHaveAttribute(
    "data-formula",
    screenDefinition().rules[0].quantity,
  );
  await page.getByRole("button", { name: "Test bench", exact: true }).click();
  // Tablet frame 39 and the phone Test tab: below 1100 px the quick test joins the Test bench.
  if (info.project.name.includes("mobile"))
    await expect(
      page.getByRole("region", { name: "Quick test", exact: true }),
    ).toContainText("33 each");
  await page.getByRole("button", { name: /Run all 1 scenarios/ }).click();
  await expect(page.getByText("Pass", { exact: true }).first()).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({ path: info.outputPath("cpq-rules.png") });
  release = await call(`cpq/releases/${releaseId}`);
  const nextDefinition = screenDefinition();
  nextDefinition.rules[0].description = "Support spacing — next draft";
  await call("cpq/releases", {
    ...crmBase(),
    id: releaseId,
    company_id: CRM.company,
    expected_version: release.release.version,
    definition: nextDefinition,
  });
  await page.goto("/estimating/rules");
  const currentRuleHref = `/estimating/rules/${releaseId}?rule=${nextDefinition.rules[0].key}`;
  const nextDraftLink = page
    .getByRole("link", {
      name: "Support spacing — next draft",
      exact: true,
    })
    .and(page.locator(`a[href="${currentRuleHref}"]`));
  await expect(nextDraftLink).toBeVisible();
  const activeFilter = page.getByRole("button", {
    name: "Active releases",
    exact: true,
  });
  if (!(await activeFilter.isVisible()))
    await page.locator("button.ppo-menu-toggle").click();
  await activeFilter.click();
  await expect(nextDraftLink).toHaveCount(0);
  await page.screenshot({ path: info.outputPath("cpq-active-rules.png") });
  await page
    .getByRole("link", { name: "Support spacing", exact: true })
    .and(
      page.locator(
        `a[href="${currentRuleHref}&revision=${release.current.id}"]`,
      ),
    )
    .click();
  await expect(page).toHaveURL(new RegExp(`revision=${release.current.id}`));
  await expect(
    page.getByText(/Viewing immutable release version/),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Edit formula", exact: true }),
  ).toBeDisabled();
  await expect(formulaBox).toHaveAttribute(
    "data-formula",
    screenDefinition().rules[0].quantity,
  );
  await page
    .getByRole("button", { name: "Return to working draft", exact: true })
    .click();
  await expect(
    page.getByRole("heading", {
      name: "Support spacing — next draft",
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Edit formula", exact: true }),
  ).toBeEnabled();
});
test("rule conditions follow accepted frames 486:641 and 488:1029: typed rows, inline actions, keyboard reordering and incomplete states", async ({
  page,
  baseURL,
}, info) => {
  const mobile = info.project.name.includes("mobile");
  if (!mobile) await page.setViewportSize({ width: 1440, height: 960 });
  const origin = new URL(baseURL!).origin;
  await api(page.request, origin, "local-session", { profile: "coordinator" });
  const definition = screenDefinition(),
    releaseId = randomUUID();
  definition.rules[0].when = {
    op: "ALL",
    items: [
      { op: "GT", fact: "cable_run_distance", value: "0" },
      { op: "IN", fact: "vent", values: ["Open", "Closed"] },
      { op: "NOT", item: { op: "EQ", fact: "include_install", value: false } },
    ],
  };
  await api(page.request, origin, "cpq/releases", {
    ...crmBase(),
    id: releaseId,
    company_id: CRM.company,
    expected_version: 0,
    definition,
  });
  await page.goto(`/estimating/rules/${releaseId}`);
  await expect(
    page
      .getByRole("group", { name: "Applies when", exact: true })
      .getByRole("button", { name: "When conditions are true", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  const field = page.getByLabel("Condition 1 field", { exact: true });
  await expect(field).toHaveValue("cable_run_distance");
  await expect(
    page.getByLabel("Condition 3 operator", { exact: true }),
  ).toHaveValue("EQ:false");
  await expect(
    page.getByRole("button", { name: "Condition 2 value", exact: true }),
  ).toContainText("Open, Closed");
  if (!mobile) {
    // Move up / Move down / Remove sit on the condition's own line.
    const row = (await field.boundingBox())!,
      down = (await page
        .getByRole("button", { name: "Move condition 1 down", exact: true })
        .boundingBox())!;
    expect(
      Math.abs(row.y + row.height / 2 - (down.y + down.height / 2)),
    ).toBeLessThan(2);
  }
  await field.focus();
  await page.keyboard.press("Alt+ArrowDown");
  const second = page.getByLabel("Condition 2 field", { exact: true });
  await expect(second).toHaveValue("cable_run_distance");
  await expect(second).toBeFocused();
  await page
    .getByRole("button", { name: "Move condition 2 up", exact: true })
    .click();
  await expect(field).toHaveValue("cable_run_distance");
  await field.selectOption("controller");
  await expect(
    page.getByText(
      "Shared controller is text, so “is greater than 0 m” was cleared. Choose a text operator and a value.",
      { exact: true },
    ),
  ).toBeVisible();
  const operator = page.getByLabel("Condition 1 operator", { exact: true });
  await expect(operator).toHaveValue("");
  // Frame 488:1029: the draft states, the quick test and the draft bar all say it is incomplete.
  const ruleState = page.getByRole("group", { name: "Rule state", exact: true });
  await expect(ruleState).toContainText("Unsaved changes");
  await expect(ruleState).toContainText("Incomplete · 1");
  if (!mobile)
    await expect(
      page.getByRole("region", { name: "Quick test", exact: true }),
    ).toContainText("No result: condition 1 is incomplete");
  await expect(
    page.getByRole("button", { name: "Create version…", exact: true }),
  ).toHaveAccessibleDescription(
    "An incomplete draft can be saved. It cannot become a version until it is complete and tested.",
  );
  await expect(
    page.getByRole("button", { name: "Create version…", exact: true }),
  ).toBeDisabled();
  await expect(
    page.getByRole("heading", {
      name: "This draft is incomplete · 1 item",
      exact: true,
    }),
  ).toBeVisible();
  await page
    .getByRole("button", {
      name: "Applies when › condition 1: choose an operator and a value for Shared controller",
      exact: true,
    })
    .click();
  await expect(operator).toBeFocused();
  await operator.selectOption("EQ");
  await page.getByLabel("Condition 1 value", { exact: true }).fill("CP-01");
  await expect(
    page.getByRole("heading", { name: /This draft is incomplete/ }),
  ).toHaveCount(0);
  await expect(ruleState.getByText("Valid", { exact: true })).toBeVisible();
  // Rules are switched from the header menu; the in-page rule picker is not drawn.
  await page.getByRole("button", { name: "More rule actions", exact: true }).click();
  await page.getByRole("menuitem", { name: "Switch rule…", exact: true }).click();
  const switcher = page.getByRole("dialog", { name: "Switch rule", exact: true });
  await expect(
    switcher.getByRole("button", { name: /^Support spacing/ }),
  ).toHaveAttribute("aria-current", "true");
  await switcher.getByRole("button", { name: /^Standard motor cable/ }).click();
  await expect(switcher).toHaveCount(0);
  await expect(
    page.getByRole("heading", { name: "Standard motor cable", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "More rule actions", exact: true }).click();
  await page.getByRole("menuitem", { name: "Switch rule…", exact: true }).click();
  await switcher.getByRole("button", { name: /^Support spacing/ }).click();
  await expect(
    page.getByRole("heading", { name: "Support spacing", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Add action", exact: true }),
  ).toBeDisabled();
  await expect(
    page.getByRole("article", { name: "Material quantity", exact: true }),
  ).toContainText("Cable brackets, galvanised · each");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({ path: info.outputPath("cpq-conditions.png") });
});
