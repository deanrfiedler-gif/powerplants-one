import { test, expect, type Page, type TestInfo } from "@playwright/test";
import { createHash, randomUUID } from "node:crypto";
import { execFileSync } from "node:child_process";
import { writeFile } from "node:fs/promises";
import { CRM, crmCreate, crmBase, crmAction } from "../helpers/crm";
// Each case covers a multi-command journey; individual controls must still respond promptly.
test.describe.configure({ timeout: 120000 });
test.use({ actionTimeout: 15000 });
async function identity(page: Page, profile = "coordinator") {
  await page.getByLabel("Identity", { exact: true }).selectOption(profile);
  await page
    .getByRole("button", { name: "Use this identity", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Use this identity", exact: true }),
  ).toBeEnabled();
}
async function noOverflow(page: Page) {
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
}
async function capture(page: Page, info: TestInfo, scenario: string) {
  await noOverflow(page);
  const errors = ["validation", "denied", "unavailable", "revoked-activity"];
  const anchor = scenario === "loaded-sales-list"
    ? page.locator(".crm-worklist")
    : errors.includes(scenario)
    ? page.locator('.business-error[role="alert"]').first()
    : scenario === "conflict"
      ? page.getByRole("heading", { name: "Compare saved version 2 with your proposal" })
      : scenario === "uncertain-save"
        ? page.getByRole("button", { name: "Confirm original save outcome" })
        : scenario === "empty"
          ? page.getByText("No permitted opportunities match this view.", { exact: true })
          : scenario === "loading"
            ? page.getByText("Loading permitted sales records…", { exact: true })
            : scenario === "overdue"
              ? page.getByRole("heading", { name: "Overdue", exact: true })
              : scenario === "successor-action"
                ? page.getByRole("heading", { name: "Due date needed", exact: true })
                : scenario === "next-action-needed"
                ? page.getByRole("heading", { name: "Next action needed", exact: true })
                : scenario === "site-scoped-selectors"
                  ? page.getByLabel("Site", { exact: true })
                  : scenario === "reflow-320-keyboard"
                    ? page.getByLabel("Stage", { exact: true })
                    : page.locator("h1");
  await anchor.evaluate((element) => element.scrollIntoView({ block: "start" }));
  const bytes = await page.screenshot({
    path: info.outputPath(`I1-${scenario}.png`),
    fullPage: false,
  });
  await writeFile(
    info.outputPath(`I1-${scenario}.json`),
    JSON.stringify(
      {
        scenario,
        viewport: page.viewportSize(),
        source_head: process.env.PPO_SOURCE_HEAD,
        executed_checkout: execFileSync("git", ["rev-parse", "HEAD"], {
          encoding: "utf8",
        }).trim(),
        tree: execFileSync("git", ["rev-parse", "HEAD^{tree}"], {
          encoding: "utf8",
        }).trim(),
        run_id: process.env.GITHUB_RUN_ID,
        run_attempt: process.env.GITHUB_RUN_ATTEMPT,
        sha256: createHash("sha256").update(bytes).digest("hex"),
        bytes: bytes.length,
      },
      null,
      2,
    ),
  );
}
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
async function seeded(page: Page) {
  await page.goto("/crm/opportunities");
  await identity(page);
  const i = {
    ...crmCreate(),
    title: `SYN Browser opportunity ${randomUUID()}`,
    initial_action: {...crmAction(), due_at:"2026-01-01T00:00:00Z", due_needed:false},
  };
  await call(page, "crm/opportunities", i);
  await page.goto(`/crm/opportunities/${i.id}`);
  await expect(
    page.getByRole("heading", { name: i.title, exact: true }),
  ).toBeVisible();
  return i;
}
test("CA-01/04/13 desktop and phone full sales journey via real UI, validation, completion and reload", async ({
  page,
}, info) => {
  await page.goto("/crm/opportunities/new");
  await identity(page);
  await expect(
    page.getByRole("heading", { name: "New opportunity", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Create opportunity and action" })
    .click();
  await expect(page.locator('.business-error[role="alert"]')).toBeFocused();
  await capture(page, info, "validation");
  await page
    .getByLabel("Visibility company", { exact: true })
    .selectOption(CRM.company);
  await page.getByLabel("Organisation", { exact: true }).selectOption(CRM.org);
  await page.getByLabel("Site", { exact: true }).selectOption(CRM.site);
  await page.getByLabel("Contact", { exact: true }).selectOption(CRM.person);
  await page
    .getByLabel("Opportunity owner", { exact: true })
    .selectOption(CRM.owner);
  const title = `SYN ${info.project.name} controls upgrade for a very long growing-area description and staged qualification ${randomUUID()}`;
  await page.getByLabel("Opportunity title", { exact: true }).fill(title);
  await page
    .getByLabel("Customer need", { exact: true })
    .fill(
      "SYN Understand the monitoring need across the growing area. ".repeat(12),
    );
  await page
    .getByLabel("Source context (synthetic)", { exact: true })
    .fill("SYN Manually recorded fictional conversation");
  await page
    .getByLabel("Activity owner", { exact: true })
    .selectOption(CRM.owner);
  await page
    .getByLabel("Action purpose", { exact: true })
    .fill("SYN Call to clarify the irrigation controls need");
  await page
    .getByRole("button", { name: "Create opportunity and action" })
    .click();
  await expect(page).toHaveURL(/crm\/opportunities\/[a-f0-9-]+$/);
  const detailUrl = page.url();
  await expect(
    page.getByRole("heading", { name: title, exact: true }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("heading", { name: title, exact: true }),
  ).toBeVisible();
  await capture(page, info, "saved-opportunity");
  await page.getByRole("link", { name: "Open activity", exact: true }).click();
  await expect(
    page.getByRole("heading", {
      name: "SYN Call to clarify the irrigation controls need",
      exact: true,
    }),
  ).toBeVisible();
  await page
    .getByLabel("Completion outcome or cancellation reason", { exact: true })
    .fill("SYN Customer need explained. No price or order agreed.");
  await page
    .getByLabel("Reason for change", { exact: true })
    .fill("SYN Complete the qualification conversation");
  await page
    .getByRole("button", { name: "Complete with outcome", exact: true })
    .click();
  await expect(
    page.getByText("Completed", { exact: true }).first(),
  ).toBeVisible();
  await page.goto(detailUrl);
  await expect(
    page.getByRole("heading", { name: "Next action needed", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText(
      "Outcome: SYN Customer need explained. No price or order agreed.",
      { exact: true },
    ),
  ).toBeVisible();
  await capture(page, info, "next-action-needed");
  await page
    .getByLabel("Qualification outcome", { exact: true })
    .fill(
      "SYN Need reviewed with the known contact; proposal work is a future decision.",
    );
  await page
    .getByRole("button", { name: "Progress to Qualified", exact: true })
    .click();
  await expect(
    page.getByText("Qualified", { exact: true }).first(),
  ).toBeVisible();
  await page
    .getByLabel("Activity owner", { exact: true })
    .selectOption(CRM.owner);
  await page
    .getByLabel("Action purpose", { exact: true })
    .fill("SYN Arrange a technical discovery conversation");
  await page
    .getByRole("button", { name: "Save next action", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Due date needed", exact: true }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page
      .getByText("SYN Arrange a technical discovery conversation", {
        exact: true,
      })
      .first(),
  ).toBeVisible();
  await capture(page, info, "qualified-successor");
  await capture(page, info, "successor-action");
  await page.goto("/crm/opportunities");
  await page.getByLabel("Search opportunities", { exact: true }).fill(title);
  await expect(
    page.getByRole("link", { name: title, exact: true }),
  ).toBeVisible();
  await capture(page, info, "sales-worklist");
  await capture(page, info, "loaded-sales-list");
});
test("CA-02/03 real conflict retains proposed need; lost response reconciles original before a new intent", async ({
  page,
}, info) => {
  const i = await seeded(page);
  await expect(page.getByRole("heading",{name:"Overdue",exact:true})).toBeVisible();
  await capture(page,info,"overdue");
  await page
    .getByLabel("Qualified customer need", { exact: true })
    .fill("SYN Safe proposed need retained after conflict");
  await page
    .getByLabel("Qualification outcome", { exact: true })
    .fill("SYN Proposed qualification note");
  await call(page, `crm/opportunities/${i.id}/next-action`, {
    ...crmBase(),
    expected_version: 1,
    new_action: crmAction(),
  });
  await page
    .getByRole("button", { name: "Progress to Qualified", exact: true })
    .click();
  await expect(page.locator('.business-error[role="alert"]')).toContainText("changed");
  await expect(
    page.getByLabel("Qualified customer need", { exact: true }),
  ).toHaveValue("SYN Safe proposed need retained after conflict");
  await page
    .getByRole("button", { name: "Load current saved version for comparison" })
    .click();
  await expect(
    page.getByRole("heading", {
      name: "Compare saved version 2 with your proposal",
    }),
  ).toBeVisible();
  await capture(page, info, "conflict");
  await page
    .getByRole("button", { name: "Use current version for deliberate retry" })
    .click();
  let dropped = false,
    lookups = 0;
  await page.route(
    `**/api/v1/crm/opportunities/${i.id}/qualify`,
    async (route) => {
      if (!dropped) {
        dropped = true;
        const response = await route.fetch();
        expect(response.status()).toBe(200);
        await route.abort("failed");
      } else await route.continue();
    },
  );
  page.on("request", (r) => {
    if (r.url().includes("/api/v1/operations/")) lookups++;
  });
  await page
    .getByRole("button", { name: "Progress to Qualified", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Confirm original save outcome" }),
  ).toBeVisible();
  await capture(page, info, "uncertain-save");
  await page
    .getByRole("button", { name: "Confirm original save outcome" })
    .click();
  await expect(
    page.getByText("Saved to the server", { exact: true }),
  ).toBeVisible();
  expect(lookups).toBeGreaterThan(0);
  const o = (await call(page, `crm/opportunities/${i.id}`)).items[0];
  expect(o.version).toBe(3);
  expect(
    o.events.filter(
      (e: { event_type: string }) => e.event_type === "OpportunityQualified",
    ),
  ).toHaveLength(1);
});
test("CA-06/10/13 denied identity clears sensitive forms; real empty, unavailable, loading and 320px keyboard reflow", async ({
  page,
}, info) => {
  const i = await seeded(page);
  await page
    .getByLabel("Qualification outcome", { exact: true })
    .fill("SYN Sensitive unsaved proposal");
  await identity(page, "systems");
  await expect(
    page.getByRole("heading", { name: i.title, exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByText("SYN Sensitive unsaved proposal", { exact: true }),
  ).toHaveCount(0);
  await expect(page.locator('.business-error[role="alert"]')).toBeVisible();
  await capture(page, info, "denied");
  await page.goto("/crm/opportunities");
  await identity(page);
  await page
    .getByLabel("Search opportunities", { exact: true })
    .fill(`absent-${randomUUID()}`);
  await expect(
    page.getByText("No permitted opportunities match this view.", {
      exact: true,
    }),
  ).toBeVisible();
  await capture(page, info, "empty");
  await page.setViewportSize({ width: 320, height: 844 });
  await noOverflow(page);
  await page.getByLabel("Search opportunities", { exact: true }).focus();
  await page.keyboard.press("Tab");
  await expect(page.getByLabel("Stage", { exact: true })).toBeFocused();
  await capture(page, info, "reflow-320-keyboard");
  await page.route("**/api/v1/crm/opportunities?**", (route) =>
    route.fulfill({
      status: 503,
      contentType: "application/json",
      body: JSON.stringify({
        code: "DatabaseUnavailable",
        message: "Sales records are temporarily unavailable.",
        retryable: true,
      }),
    }),
  );
  await page.getByRole("button", { name: "Refresh from start" }).click();
  await expect(page.locator('.business-error[role="alert"]')).toContainText(
    "temporarily unavailable",
  );
  await capture(page, info, "unavailable");
  await page.unroute("**/api/v1/crm/opportunities?**");
  await page.route("**/api/v1/crm/opportunities?**", async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 1200));
    await route.continue();
  });
  await page.goto("/crm/opportunities");
  await expect(
    page.getByText("Loading permitted sales records…", { exact: true }),
  ).toBeVisible();
  await capture(page, info, "loading");
});

test("CA-06/10 real CRM permission revocation clears linked Activity content after refused completion",async({page},info)=>{
 // Private disposable DB fixture, no grant/admin route is added to the application.
 process.loadEnvFile(".env.local");
 const {database,closeDatabase}=await import("../../src/platform/database");
 const {localConfig}=await import("../../src/platform/config");
 expect(localConfig().database_name).toBe("ppo_synthetic_test");
 const {randomBytes}=await import("node:crypto");
 const user=randomUUID(),token=randomBytes(32).toString("hex");
 try {
  await database().query("INSERT INTO ppo.users(id,workspace_id,issuer,subject_id,display_name) VALUES($1,$2,'PPO-LocalSynthetic',$3,'SYN Browser revocation fixture')",[user,CRM.workspace,randomUUID()]);
  await database().query("INSERT INTO ppo.permission_grants(workspace_id,user_id,company_id,capability,scope_type,scope_id,site_id) SELECT DISTINCT workspace_id,$1,$3,capability,'Site',$4,$4 FROM ppo.permission_grants WHERE user_id=$2 AND capability IN ('shared.read','shared.internal.read','crm.opportunity.read','crm.opportunity.create','crm.opportunity.edit','activity.read','activity.edit')",[user,CRM.owner,CRM.company,CRM.site]);
  await database().query("INSERT INTO ppo.sessions(token_hash,workspace_id,actor_id,expires_at) VALUES($1,$2,$3,clock_timestamp()+interval '1 hour')",[createHash("sha256").update(token).digest("hex"),CRM.workspace,user]);
  await page.context().addCookies([{name:"ppo_local_session",value:token,url:"http://127.0.0.1:3000",httpOnly:true,sameSite:"Strict"}]);
  await page.goto("/crm/opportunities/new");await expect(page.getByRole("heading",{name:"New opportunity",exact:true})).toBeVisible();
  await page.getByLabel("Visibility company",{exact:true}).selectOption(CRM.company);await page.getByLabel("Organisation",{exact:true}).selectOption(CRM.org);
  await expect(page.getByText("Choose a permitted site. Your creation authority is limited to that site.",{exact:true})).toBeVisible();await expect(page.getByRole("button",{name:"Create opportunity and action"})).toBeDisabled();
  await page.getByLabel("Site",{exact:true}).selectOption(CRM.site);await page.getByLabel("Contact",{exact:true}).selectOption(CRM.person);await page.getByLabel("Opportunity owner",{exact:true}).selectOption(user);await page.getByLabel("Activity owner",{exact:true}).selectOption(user);await expect(page.getByRole("button",{name:"Create opportunity and action"})).toBeEnabled();await capture(page,info,"site-scoped-selectors");
  const i={...crmCreate(),title:"SYN Revoked opportunity private title",owner_id:user,initial_action:{...crmAction(user),summary:"SYN Revoked Activity private content"}};
  await call(page,"crm/opportunities",i);await page.goto(`/work/${i.initial_action.id}`);
  await expect(page.getByRole("heading",{name:i.initial_action.summary,exact:true})).toBeVisible();
  await page.getByLabel("Completion outcome or cancellation reason",{exact:true}).fill("SYN Sensitive proposed outcome");await page.getByLabel("Reason for change",{exact:true}).fill("SYN Attempt after actual revocation");
  await database().query("DELETE FROM ppo.permission_grants WHERE user_id=$1 AND capability='crm.opportunity.read'",[user]);
  await page.getByRole("button",{name:"Complete with outcome",exact:true}).click();await expect(page.locator('.business-error[role="alert"]')).toBeVisible();
  await expect(page.getByRole("heading",{name:i.initial_action.summary,exact:true})).toHaveCount(0);await expect(page.getByLabel("Completion outcome or cancellation reason",{exact:true})).toHaveCount(0);
  expect(await page.locator("body").innerText()).not.toContain(i.title);await capture(page,info,"revoked-activity");
  expect((await database().query("SELECT status,outcome FROM ppo.activities WHERE id=$1",[i.initial_action.id])).rows[0]).toEqual({status:"Open",outcome:null});
 } finally {await closeDatabase();}
});
