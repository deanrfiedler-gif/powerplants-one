import { toggleWorklistFilters, fillOpportunitySearch, keyOpportunitySearch } from "../helpers/crm-worklist-ui";
import { captureTransferComparison } from "../helpers/crm-transfer-capture";
import { keyActivate, keySelect, keyType } from "../helpers/quality-keyboard";
import { committed } from "../helpers/quality-prepare";
import {
  test,
  expect,
  type Frame,
  type Page,
  type Request,
} from "@playwright/test";
import { randomUUID, randomBytes, createHash } from "node:crypto";
import { database, closeDatabase } from "../../src/platform/database";
import { localConfig } from "../../src/platform/config";
import { crmCreate, crmQualify, crmBase, crmDiscovery, crmAction, CRM } from "../helpers/crm";
import type { DirectoryView } from "../../src/crm/directory";
test.describe.configure({ timeout: 120000 });
test.beforeAll(() => {
  process.loadEnvFile(".env.local");
  if (localConfig().database_name !== "ppo_synthetic_test")
    throw new Error("CRM browser fixture writes require disposable ppo_synthetic_test");
});
test.afterAll(closeDatabase);
async function call(page: Page, path: string, body?: unknown) {
  const r = await page.request.fetch(`/api/v1/${path}`, {
    method: body === undefined ? "GET" : "POST",
    headers: body === undefined ? {} : { Origin: "http://127.0.0.1:3000" },
    data: body,
  });
  expect(r.ok(), await r.text()).toBe(true);
  return r.json();
}
test("owner transfer compares separate activities and persists original/current ownership on desktop and phone",async({page},info)=>{
  await call(page,"local-session",{profile:"coordinator"});
  const input={...crmDiscovery(),title:`SYN Transfer journey ${info.project.name}`};input.initial_action.summary=("SYN Long separate activity comparison "+"scopeword".repeat(220)).slice(0,2000);await call(page,"crm/opportunities",input);
  await page.goto(`/sales/opportunities/${input.id}`);
  await keyActivate(page,page.getByRole("button",{name:"Transfer deal owner",exact:true}));
  const dialog=page.getByRole("dialog");
  await expect(dialog.getByRole("region",{name:"Activity comparison"})).toContainText("SYN Coordinator");
  await keySelect(page,dialog.getByLabel("New deal owner"),"30000000-0000-4000-8000-000000000015");
  await keyType(page,dialog.getByLabel("Transfer reason"),"SYN "+"r".repeat(996));
  const comparison=dialog.getByRole("region",{name:"Activity comparison"});
  const noClippedComparison=()=>comparison.locator("p").evaluateAll(ps=>ps.every(p=>p.scrollWidth<=p.clientWidth));
  expect(await noClippedComparison()).toBe(true);
  await comparison.screenshot({path:info.outputPath("crm-transfer-full-activity-comparison.png")});
  await page.screenshot({path:info.outputPath("crm-transfer-comparison.png"),fullPage:false});
  await captureTransferComparison(page,info,comparison);
  if(info.project.use.isMobile){await page.setViewportSize({width:320,height:844});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);expect(await noClippedComparison()).toBe(true);await comparison.screenshot({path:info.outputPath("crm-transfer-full-activity-comparison-320.png")});await page.screenshot({path:info.outputPath("crm-transfer-comparison-320.png"),fullPage:false});await captureTransferComparison(page,info,comparison);}
  await expect(dialog.getByLabel("Transfer reason")).toHaveValue("SYN "+"r".repeat(996));
  await committed(page,`crm/opportunities/${input.id}/transfer-owner`,()=>keyActivate(page,dialog.getByRole("button",{name:"Confirm owner transfer",exact:true})));
  await expect(dialog).not.toBeVisible();await page.reload();
  await expect(page.getByText("Original deal owner: SYN Coordinator · Current owner: SYN Sales receiver",{exact:true})).toBeVisible();
  await expect(page.getByRole("button",{name:"Transfer deal owner",exact:true})).toHaveCount(0);
  const saved=(await call(page,`crm/opportunities/${input.id}`)).items[0];expect(saved.owner_id).toBe("30000000-0000-4000-8000-000000000015");expect(saved.actions[0].owner_id).toBe(input.owner_id);expect(saved.owner_transfers).toHaveLength(1);expect(saved.events.at(-1).reason).toHaveLength(1000);
  await page.screenshot({path:info.outputPath("crm-transfer-persisted.png"),fullPage:false});
  await call(page,"local-session",{profile:"crm-receiver"});await page.reload();
  await expect(page.getByRole("button",{name:"Transfer deal owner",exact:true})).toHaveCount(0);
  await expect(page.getByRole("button",{name:"Edit deal information",exact:true})).toBeVisible();
  await page.goto("/sales/opportunities");await fillOpportunitySearch(page, input.title);
  await expect(page.locator(`[data-opportunity-id="${input.id}"]`)).toBeVisible();
  await page.getByRole("button",{name:"List",exact:true}).click();await expect(page.getByRole("link",{name:input.title,exact:true})).toBeVisible();
});
test("lost accepted transfer response recovers the original actor receipt and stale activity comparison requires review",async({page},info)=>{
  await call(page,"local-session",{profile:"coordinator"});
  const input=crmDiscovery();await call(page,"crm/opportunities",input);await page.goto(`/sales/opportunities/${input.id}`);
  await page.getByRole("button",{name:"Transfer deal owner",exact:true}).click();const dialog=page.getByRole("dialog");
  await dialog.getByLabel("New deal owner").selectOption("30000000-0000-4000-8000-000000000015");await dialog.getByLabel("Transfer reason").fill("SYN Deliberate transfer after reviewing separate activity completion");
  await call(page,`activities/${input.initial_action.id}/complete`,{...crmBase(),expected_version:1,outcome:"SYN Completed while comparison remained open"});
  await dialog.getByRole("button",{name:"Confirm owner transfer",exact:true}).click();
  await expect(dialog.getByText("An activity changed. Reload and review its owner and outcome before transferring.",{exact:true})).toBeVisible();
  expect((await call(page,`crm/opportunities/${input.id}`)).items[0].version).toBe(1);
  await page.screenshot({path:info.outputPath("crm-transfer-conflict.png"),fullPage:false});
  await dialog.getByRole("button",{name:"Load current saved version for comparison"}).click();
  await expect(dialog.getByRole("region",{name:"Activity comparison"})).toContainText("Completed");
  let original:string|undefined;
  await page.route(`**/api/v1/crm/opportunities/${input.id}/transfer-owner`,async route=>{
    original=route.request().postDataJSON().operation_id;const response=await route.fetch();expect(response.ok(),await response.text()).toBe(true);await route.abort("connectionfailed");
  },{times:1});
  await dialog.getByRole("button",{name:"Confirm owner transfer",exact:true}).click();
  await expect(dialog.getByRole("button",{name:"Confirm original save outcome"})).toBeVisible();
  await expect(dialog.getByLabel("New deal owner")).toBeDisabled();
  await page.screenshot({path:info.outputPath("crm-transfer-unknown.png"),fullPage:false});
  await dialog.getByRole("button",{name:"Confirm original save outcome"}).click();await expect(dialog).not.toBeVisible();
  expect((await call(page,`operations/${original}`)).record_version).toBe(2);
  const saved=(await call(page,`crm/opportunities/${input.id}`)).items[0];expect(saved.owner_transfers).toHaveLength(1);expect(saved.next_action_state).toBe("Needed");
});
test("revoked transfer access clears comparison and discards a late eligible-owner response",async({page},info)=>{
  const user=randomUUID(),token=randomBytes(32).toString("hex");
  await database().query("INSERT INTO ppo.users(id,workspace_id,issuer,subject_id,display_name) VALUES($1,$2,'PPO-LocalSynthetic',$3,'SYN Transfer browser actor')",[user,CRM.workspace,randomUUID()]);
  await database().query("INSERT INTO ppo.permission_grants(workspace_id,user_id,company_id,capability,scope_type,scope_id,site_id) SELECT workspace_id,$1,company_id,capability,scope_type,scope_id,site_id FROM ppo.permission_grants WHERE user_id=$2",[user,CRM.owner]);
  await database().query("INSERT INTO ppo.sessions(token_hash,workspace_id,actor_id,expires_at) VALUES($1,$2,$3,clock_timestamp()+interval '1 hour')",[createHash("sha256").update(token).digest("hex"),CRM.workspace,user]);
  await page.context().addCookies([{name:"ppo_local_session",value:token,domain:"127.0.0.1",path:"/",httpOnly:true,sameSite:"Strict"}]);
  const input={...crmDiscovery(),title:`SYN Private transfer ${randomUUID()}`,owner_id:user,initial_action:crmAction(user)};
  await call(page,"crm/opportunities",input);await page.goto(`/sales/opportunities/${input.id}`);
  await page.getByRole("button",{name:"Transfer deal owner",exact:true}).click();const dialog=page.getByRole("dialog");
  await expect(dialog.getByRole("region",{name:"Activity comparison"})).toBeVisible();
  await dialog.getByLabel("Transfer reason").fill("SYN confidential proposed transfer reason");
  let release!:()=>void,held=false,intercept=true;const pending=new Promise<void>(r=>{release=r;});
  const pattern=`**/api/v1/crm/opportunities/${input.id}/handover-options?**`;
  await page.route(pattern,async route=>{if(!intercept){await route.continue();return;}intercept=false;const response=await route.fetch();expect(response.ok()).toBe(true);held=true;await pending;await route.fulfill({response});});
  await page.evaluate(()=>window.dispatchEvent(new Event("focus")));await expect.poll(()=>held).toBe(true);
  await database().query("DELETE FROM ppo.permission_grants WHERE user_id=$1 AND capability='crm.opportunity.read'",[user]);
  const denied=page.waitForResponse(r=>r.url().includes(`/opportunities/${input.id}/handover-options?`)&&r.status()===404);
  await page.evaluate(()=>window.dispatchEvent(new Event("focus")));await denied;
  await expect(dialog.getByLabel("New deal owner")).toHaveCount(0);await expect(dialog.getByLabel("Transfer reason")).toHaveCount(0);
  const late=page.waitForResponse(r=>r.url().includes(`/opportunities/${input.id}/handover-options?`)&&r.status()===200);release();await(await late).finished();
  await page.evaluate(()=>new Promise<void>(r=>requestAnimationFrame(()=>requestAnimationFrame(()=>r()))));
  await expect(dialog.getByRole("region",{name:"Activity comparison"})).toHaveCount(0);
  expect(await page.locator("body").innerText()).not.toContain("SYN confidential proposed transfer reason");
  expect(await page.locator("body").innerText()).not.toContain(input.title);
  await page.screenshot({path:info.outputPath("crm-transfer-denied-after-late-response.png"),fullPage:false});
  expect((await page.request.get(`/api/v1/operations/${input.operation_id}`)).status()).toBe(404);
});
test("owned Won handover and structured Lost survive reload on desktop and phone", async ({ page }, info) => {
  await call(page,"local-session",{profile:"coordinator"});
  for (const outcome of ["Won","Lost"]) {
    const input={...crmDiscovery(),title:`SYN ${outcome} outcome ${info.project.name}`};
    await call(page,"crm/opportunities",input);
    let version=1;
    if(outcome==="Won") for(const stage_id of ["Scoping","Quoting","Negotiation","Closing"])
      await call(page,`crm/opportunities/${input.id}/stage`,{...crmBase(),expected_version:version++,stage_id,qualification_note:null,identification_activity_id:null});
    await page.goto(`/sales/opportunities/${input.id}`);
    await page.getByRole("button",{name:"Record sales outcome",exact:true}).click();
    const dialog=page.getByRole("dialog");
    if(outcome==="Won") await dialog.getByLabel("Acceptance or order evidence").fill("SYN Fictional accepted scope for controlled handover");
    else {
      await dialog.getByRole("button",{name:"Record outcome",exact:true}).click();
      await expect(dialog.getByText("Choose Price, Competitor, Timing, No decision.", {exact:true})).toBeVisible();
      await dialog.getByLabel("Lost reason").selectOption("Competitor");
    }
    await committed(page,`crm/opportunities/${input.id}/outcome`,()=>dialog.getByRole("button",{name:"Record outcome",exact:true}).click());
    await expect(dialog).not.toBeVisible();
    await page.reload();
    await expect(page.getByRole("button",{name:"Record sales outcome",exact:true})).toHaveCount(0);
    await expect(page.getByLabel("Saved sales outcome",{exact:true})).toHaveText(`Outcome: ${outcome}`);
    await expect(page.getByLabel("Saved sales outcome",{exact:true})).toBeVisible();
    await expect(page.locator('.crm-stage-track [aria-current="step"]')).toBeDisabled();
    if(outcome==="Won") await expect(page.getByRole("region",{name:"Handover due"})).toContainText("SYN Coordinator");
    else { await page.getByRole("tab", { name: "History", exact: true }).click(); await expect(page.getByText("Lost reason: Competitor",{exact:true})).toBeVisible(); }
    const saved=(await call(page,`crm/opportunities/${input.id}`)).items[0];
    expect(saved.close_outcome).toBe(outcome); expect(saved.version).toBe(version+1);
    expect(saved.actions[0].owner_id).toBe(input.initial_action.owner_id);
    await page.screenshot({path:info.outputPath(`crm-${outcome.toLowerCase()}-persisted.png`),fullPage:false});
    await page.goto("/sales/opportunities");
    await fillOpportunitySearch(page, input.title);
    await expect(page.locator(`[data-opportunity-id="${input.id}"]`)).toHaveCount(0);
    await toggleWorklistFilters(page);
    await page.getByLabel("Sales outcome",{exact:true}).selectOption(outcome);
    await toggleWorklistFilters(page);
    if(info.project.use.isMobile) await page.getByRole("group",{name:"Choose Board stage"}).getByRole("button",{name:outcome === "Won" ? /^Closing / : /^Discovery /}).click();
    const card=page.locator(`[data-opportunity-id="${input.id}"]`);
    await expect(card).toBeVisible(); await expect(card).toHaveAttribute("draggable","false");
    await page.getByRole("button",{name:"List",exact:true}).click();
    await expect(page.getByRole("link",{name:input.title,exact:true})).toBeVisible();
  }
});
test("accepted outcome with a lost response recovers its original receipt without another effect", async ({page})=>{
  await call(page,"local-session",{profile:"coordinator"});
  const input=crmDiscovery(); await call(page,"crm/opportunities",input);
  await page.goto(`/sales/opportunities/${input.id}`);
  await page.getByRole("button",{name:"Record sales outcome",exact:true}).click();
  const dialog=page.getByRole("dialog"); await dialog.getByLabel("Lost reason").selectOption("Timing");
  let acceptedOperation:string|undefined;
  await page.route(`**/api/v1/crm/opportunities/${input.id}/outcome`,async route=>{
    acceptedOperation=route.request().postDataJSON().operation_id;
    const response=await route.fetch(); expect(response.ok(),await response.text()).toBe(true);
    await route.abort("connectionfailed");
  },{times:1});
  await dialog.getByRole("button",{name:"Record outcome",exact:true}).click();
  await expect(dialog.getByRole("button",{name:"Confirm original save outcome"})).toBeVisible();
  await expect(dialog.getByLabel("Lost reason")).toBeDisabled();
  await dialog.getByRole("button",{name:"Confirm original save outcome"}).click();
  await expect(dialog).not.toBeVisible();
  const saved=(await call(page,`crm/opportunities/${input.id}`)).items[0];
  expect(saved.version).toBe(2); expect(saved.events.filter((e:{event_type:string})=>e.event_type==="OpportunityOutcomeRecorded")).toHaveLength(1);
  expect((await call(page,`operations/${acceptedOperation}`)).state).toBe("Lost");
});
test("card hit areas, snapshot, core pencil, separate scope and stage changes persist", async ({
  page,
}, info) => {
  await call(page, "local-session", { profile: "coordinator" });
  const input = crmCreate();
  input.title = `SYN CRM refinements ${info.project.name}`;
  await call(page, "crm/opportunities", input);
  await page.goto("/sales/opportunities?pipeline=I1");
  await fillOpportunitySearch(page, input.title);
  const card = page.locator(`[data-opportunity-id="${input.id}"]`);
  await expect(card).toBeVisible();
  expect(await card.locator(".crm-card-body a").count()).toBe(0);
  await expect(card.locator(".crm-card-contact")).not.toContainText(
    "SYN Coordinator",
  );
  if (!info.project.use.isMobile) {
    await expect(card).toHaveAttribute("draggable", "true");
    await card.getByRole("button", { name: /^Snapshot:/ }).click();
    const snapshot = page.getByRole("dialog");
    await expect(snapshot).toBeVisible();
    await expect(
      snapshot.getByRole("heading", { name: "Deal summary" }),
    ).toBeVisible();
    await expect(page).toHaveURL(url => url.pathname === "/sales/opportunities" && url.search === `?${new URLSearchParams({ pipeline: "I1", q: input.title })}`);
    await page.keyboard.press("Escape");
    await expect(snapshot).not.toBeVisible();
    await expect(card.getByRole("button", { name: /^Snapshot:/ })).toBeFocused();
    await card.getByRole("button", { name: /^Snapshot:/ }).click();
    await page
      .getByRole("link", { name: "Open full deal", exact: true })
      .click();
  } else {
    await expect(card).toHaveAttribute("draggable", "false");
    await card.locator(".crm-card-company").click();
    await expect(page.getByRole("dialog")).toHaveCount(0);
  }
  await expect(page).toHaveURL(url => url.pathname === `/sales/opportunities/${input.id}`);
  await page
    .getByRole("button", { name: "Edit deal information", exact: true })
    .click();
  let dialog = page.getByRole("dialog", { name: "Edit deal", exact: true });
  await expect(dialog.getByLabel("Deal title", { exact: true })).toBeVisible();
  await expect(
    dialog.getByLabel("Customer need and objective", { exact: true }),
  ).toHaveCount(0);
  await dialog
    .getByLabel("Deal title", { exact: true })
    .fill(input.title + " updated");
  await dialog
    .getByLabel("Deal value · AUD, excl. GST", { exact: true })
    .fill("12345.67");
  await dialog
    .getByLabel("Expected close date", { exact: true })
    .fill("2031-12-01");
  await dialog.getByRole("button", { name: "Save deal", exact: true }).click();
  await expect(dialog).not.toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("heading", { name: input.title + " updated", exact: true }),
  ).toBeVisible();
  await expect(page.locator(".crm-deal-key-facts")).toContainText("$12,345.67");
  await page.getByRole("tab", { name: "Scope & sites", exact: true }).click();
  await page
    .getByRole("button", { name: "Edit requirements and scope", exact: true })
    .click();
  dialog = page.getByRole("dialog", {
    name: "Edit requirements and scope",
    exact: true,
  });
  await dialog
    .getByLabel("Inclusions", { exact: true })
    .fill("SYN Sensors and commissioning");
  await dialog
    .getByRole("button", { name: "Save requirements and scope", exact: true })
    .click();
  await expect(dialog).not.toBeVisible();
  await page.reload();
  await page.getByRole("tab", { name: "Scope & sites", exact: true }).click();
  await expect(page.locator(".crm-scope-section")).toContainText(
    "SYN Sensors and commissioning",
  );
  if (!info.project.use.isMobile) {
    await page.goto("/sales/opportunities?pipeline=I1");
    await fillOpportunitySearch(page, input.title);
    await card.dragTo(page.locator('[data-drop-stage="Qualified"]'), { sourcePosition: { x: 8, y: 8 } });
  } else {
    await page.locator(".crm-stage-track button").last().click();
  }
  dialog = page.getByRole("dialog", { name: "Change deal stage", exact: true });
  await expect(dialog).toBeVisible();
  await dialog
    .getByLabel("Deal stage", { exact: true })
    .selectOption("Qualified");
  await dialog
    .getByLabel("Qualification outcome", { exact: true })
    .fill("SYN Need and contact confirmed");
  await dialog.getByRole("button", { name: "Save stage", exact: true }).click();
  await expect(dialog).not.toBeVisible();
  let record = (await call(page, `crm/opportunities/${input.id}`)).items[0];
  expect(record.stage_id).toBe("Qualified");
  expect(record.value_amount).toBe("12345.67");
  expect(record.scope_details.inclusions).toBe("SYN Sensors and commissioning");
  if (!info.project.use.isMobile) {
    await page
      .getByRole("button", { name: "Undo stage move", exact: true })
      .click();
    await page
      .getByRole("dialog")
      .getByRole("button", { name: "Save stage", exact: true })
      .click();
    await expect(page.getByRole("dialog")).not.toBeVisible();
    record = (await call(page, `crm/opportunities/${input.id}`)).items[0];
    expect(record.stage_id).toBe("Enquiry");
  }
  await page.goto(`/sales/opportunities/${input.id}`);
  await page.getByRole("tab", { name: "Documents", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Deal documents", exact: true }),
  ).toBeVisible();
  await page.screenshot({ path: info.outputPath("crm-deal-files.png") });
  await page.goto("/sales/opportunities?pipeline=I1");
  await fillOpportunitySearch(page, input.title);
  if (info.project.use.isMobile)
    await page.getByRole("button", { name: /^Qualified \(/ }).click();
  await card.locator(".crm-card-activity").click();
  await page
    .getByRole("link", { name: "Open full activity", exact: true })
    .click();
  await expect(page).toHaveURL(new RegExp(`/work/${input.initial_action.id}$`));
});
test("desktop directory tables and mobile lists share saved, scoped queries", async ({
  page,
}, info) => {
  await call(page, "local-session", { profile: "coordinator" });
  await page.goto("/people");
  await expect(
    page.getByRole("heading", { name: "People", exact: true }),
  ).toBeVisible();
  const savedView = page.getByLabel("Saved view", { exact: true });
  await expect(savedView).toBeVisible();
  await expect(savedView).toHaveAccessibleName("Saved view");
  await page.getByLabel("Status", { exact: true }).selectOption("Active");
  await page.getByLabel("Rows per page", { exact: true }).selectOption("50");
  if (info.project.use.isMobile) {
    await expect(page.locator(".crm-directory-mobile")).toBeVisible();
    await expect(page.locator(".crm-directory-table-scroll")).not.toBeVisible();
    await page.setViewportSize({ width: 320, height: 640 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  } else {
    await expect(page.getByRole("table")).toBeVisible();
    await page.getByRole("button", { name: /^Name/ }).click();
    await expect(page.locator('th[aria-sort="descending"]')).toContainText(
      "Name",
    );
  }
  await page
    .getByRole("button", { name: "Columns and views", exact: true })
    .click();
  await page.getByRole("checkbox", { name: "Phone", exact: true }).uncheck();
  const viewName = `SYN Contact view ${info.project.name}`;
  await page.getByLabel("View name", { exact: true }).fill(viewName);
  await page.getByRole("button", { name: "Save view", exact: true }).click();
  await expect(
    page.getByText("View saved for your account.", { exact: true }),
  ).toBeVisible();
  await expect(savedView).toHaveValue(viewName);
  // Observe the real reload read, so a missing preset fails at its source.
  // Exclude a save-time refresh or poll belonging to the outgoing document.
  let reloadCommitted = false;
  const reloadRequests = new Set<Request>();
  const onNavigation = (frame: Frame) => {
    if (frame === page.mainFrame()) reloadCommitted = true;
  };
  const onRequest = (request: Request) => {
    if (reloadCommitted) reloadRequests.add(request);
  };
  page.on("framenavigated", onNavigation);
  page.on("request", onRequest);
  let persisted: { version: number; views: DirectoryView[] };
  try {
    const [viewsResponse] = await Promise.all([
      page.waitForResponse((response) => {
        const url = new URL(response.url());
        return (
          reloadRequests.has(response.request()) &&
          response.request().method() === "GET" &&
          url.pathname === "/api/v1/crm/directory/views" &&
          url.searchParams.get("kind") === "people"
        );
      }),
      page.reload(),
    ]);
    expect(viewsResponse.status()).toBe(200);
    persisted = await viewsResponse.json();
  } finally {
    page.off("framenavigated", onNavigation);
    page.off("request", onRequest);
  }
  expect(persisted.version).toBeGreaterThan(0);
  expect(persisted.views.find((view) => view.name === viewName)).toEqual({
    name: viewName,
    q: "",
    status: "Active",
    mine: "false",
    sort: "name",
    direction: info.project.use.isMobile ? "asc" : "desc",
    limit: "50",
    columns: [
      "name",
      "organisations",
      "email",
      "preference",
      "status",
      "deals",
    ],
  });
  await expect(savedView).toHaveAccessibleName("Saved view");
  await expect(savedView).toHaveValue("");
  await savedView.selectOption(viewName);
  await expect(savedView).toHaveValue(viewName);
  await expect(page.getByLabel("Status", { exact: true })).toHaveValue(
    "Active",
  );
  await expect(page.getByLabel("Rows per page", { exact: true })).toHaveValue(
    "50",
  );
  if (!info.project.use.isMobile) {
    await expect(page.locator('th[aria-sort="descending"]')).toContainText(
      "Name",
    );
    await expect(
      page.getByRole("columnheader", { name: "Phone", exact: true }),
    ).toHaveCount(0);
  }
  await page.screenshot({ path: info.outputPath("crm-people-directory.png") });
  await page.goto("/customers");
  await expect(
    page.getByRole("heading", { name: "Organisations", exact: true }),
  ).toBeVisible();
  await expect(
    page.locator(
      info.project.use.isMobile
        ? ".crm-directory-mobile"
        : ".crm-directory-table",
    ),
  ).toContainText("SYN");
  await page.screenshot({
    path: info.outputPath("crm-organisations-directory.png"),
  });
});

test("SA-09 board stage change uses native keyboard controls on desktop and phone", async ({
  page,
}, info) => {
  await call(page, "local-session", { profile: "coordinator" });
  const input = crmCreate();
  input.title = `SYN keyboard stage ${info.project.name}`;
  await call(page, "crm/opportunities", input);
  await page.goto("/sales/opportunities?pipeline=I1");
  await keyOpportunitySearch(page, input.title);
  const action = page.getByRole("button", {
    name: `Change stage for ${input.title}`,
    exact: true,
  });
  await keyActivate(page, action);
  const dialog = page.getByRole("dialog", {
    name: "Change deal stage",
    exact: true,
  });
  await keySelect(
    page,
    dialog.getByLabel("Deal stage", { exact: true }),
    "Qualified",
  );
  await keyType(
    page,
    dialog.getByLabel("Qualification outcome", { exact: true }),
    "SYN reviewed need and contact; keyboard proof only.",
  );
  await committed(page, `crm/opportunities/${input.id}/stage`, () =>
    keyActivate(
      page,
      dialog.getByRole("button", { name: "Save stage", exact: true }),
    ),
  );
  await expect(dialog).not.toBeVisible();
  await expect(page).toHaveURL(url => url.pathname === "/sales/opportunities" && url.search === `?${new URLSearchParams({ pipeline: "I1", q: input.title, selected: "Qualified" })}`);
  await expect(action).toBeFocused();
  await expect(action).toBeInViewport({ ratio: 1 });
  const record = (await call(page, `crm/opportunities/${input.id}`)).items[0];
  expect(record.stage_id).toBe("Qualified");
  expect(record.version).toBe(2);
  expect(record.events.at(-1).event_type).toBe("OpportunityStageChanged");
  await page.screenshot({
    path: info.outputPath("crm-board-keyboard-stage.png"),
  });
  await page.reload();
  expect(
    (await call(page, `crm/opportunities/${input.id}`)).items[0].events,
  ).toEqual(record.events);
});

async function qualifiedBoard(page: Page, title: string) {
  await call(page, "local-session", { profile: "coordinator" });
  const input = crmCreate();
  input.title = title;
  await call(page, "crm/opportunities", input);
  await call(page, `crm/opportunities/${input.id}/qualify`, crmQualify());
  await page.goto("/sales/opportunities?pipeline=I1");
  await fillOpportunitySearch(page, title);
  const card = page.locator(`[data-opportunity-id="${input.id}"]`);
  await expect(
    page.locator('[data-drop-stage="Qualified"]').locator(card),
  ).toBeVisible();
  return { input, card };
}

test("SA-07/08 refused drag returns to saved stage and Undo sends no replacement command", async ({
  page,
}, info) => {
  test.skip(
    !!info.project.use.isMobile,
    "Native desktop drag; the phone uses the separately tested keyboard action.",
  );
  const { input, card } = await qualifiedBoard(page, "SYN refused board drag");
  const saved = (await call(page, `crm/opportunities/${input.id}`)).items[0];
  let posts = 0;
  await page.route(
    `**/api/v1/crm/opportunities/${input.id}/stage`,
    async (route) => {
      posts++;
      // A real concurrent edit wins before the original browser command reaches the server.
      await call(page, `crm/opportunities/${input.id}/information`, {
        ...crmBase(),
        expected_version: saved.version,
        title: saved.title,
        primary_person_id: saved.primary_person_id,
        contact_unknown_reason: saved.contact_unknown_reason,
        value_amount: saved.value_amount,
        expected_close_date: saved.expected_close_date,
      });
      await route.continue();
    },
  );
  await card.dragTo(page.locator('[data-drop-stage="Enquiry"]'), { sourcePosition: { x: 8, y: 8 } });
  await expect(page.locator(".crm-change-feedback")).toContainText(
    "This opportunity changed",
  );
  await expect(
    page.locator('[data-drop-stage="Qualified"]').locator(card),
  ).toBeVisible();
  await expect(
    page.locator('[data-drop-stage="Enquiry"]').locator(card),
  ).toHaveCount(0);
  await page
    .getByRole("button", { name: "Undo stage move", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  expect(posts).toBe(1);
  const current = (await call(page, `crm/opportunities/${input.id}`)).items[0];
  expect(current.version).toBe(saved.version + 1);
  expect(current.stage_id).toBe("Qualified");
  expect(
    current.events.filter(
      (e: { event_type: string }) => e.event_type === "OpportunityStageChanged",
    ),
  ).toHaveLength(0);
  await page.screenshot({
    path: info.outputPath("crm-board-refused-drag.png"),
  });
});

test("SA-08 lost drag response confirms the exact original receipt before undo is enabled", async ({
  page,
}, info) => {
  test.skip(
    !!info.project.use.isMobile,
    "Native desktop drag; the phone uses the separately tested keyboard action.",
  );
  const { input, card } = await qualifiedBoard(
    page,
    "SYN lost board drag response",
  );
  let posts = 0;
  let operation = "";
  await page.route(
    `**/api/v1/crm/opportunities/${input.id}/stage`,
    async (route) => {
      posts++;
      operation = route.request().postDataJSON().operation_id;
      const response = await route.fetch();
      expect(response.ok()).toBe(true);
      await route.abort("failed");
    },
  );
  await card.dragTo(page.locator('[data-drop-stage="Enquiry"]'), { sourcePosition: { x: 8, y: 8 } });
  await expect(page.locator(".crm-change-feedback")).toContainText(
    "Save outcome uncertain",
  );
  await expect(
    page.locator('[data-drop-stage="Qualified"]').locator(card),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Undo stage move", exact: true }),
  ).toBeDisabled();
  await expect(
    page.getByRole("button", { name: "Dismiss", exact: true }),
  ).toBeDisabled();
  await expect(
    page.getByRole("button", {
      name: `Change stage for ${input.title}`,
      exact: true,
    }),
  ).toBeDisabled();
  const lookup = page.waitForResponse(
    (r) =>
      new URL(r.url()).pathname === `/api/v1/operations/${operation}` &&
      r.request().method() === "GET",
  );
  await page
    .getByRole("button", { name: "Confirm original save outcome", exact: true })
    .click();
  expect((await lookup).ok()).toBe(true);
  await expect(
    page.locator('[data-drop-stage="Enquiry"]').locator(card),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Undo stage move", exact: true }),
  ).toBeEnabled();
  expect(posts).toBe(1);
  const current = (await call(page, `crm/opportunities/${input.id}`)).items[0];
  expect(current.stage_id).toBe("Enquiry");
  expect(current.version).toBe(3);
  expect(
    current.events.filter(
      (e: { event_type: string }) => e.event_type === "OpportunityStageChanged",
    ),
  ).toHaveLength(1);
  await page.screenshot({
    path: info.outputPath("crm-board-confirmed-original-drag.png"),
  });
});


test("SA-12 default five-stage board persists Discovery movement and qualification on desktop and phone", async ({ page }, info) => {
  await call(page, "local-session", { profile: "coordinator" });
  const input = crmDiscovery(); input.title = `SYN Discovery cutover ${info.project.name}`;
  await call(page, "crm/opportunities", input);
  await page.goto("/sales/opportunities");
  await keyOpportunitySearch(page, input.title);
  // Stage names only: the r22 stage-options menu carries its own dialog title
  // heading inside the same header row.
  await expect(page.locator(".crm-board-headers .crm-stage-heading-copy h2")).toHaveText(["Discovery", "Scoping", "Quoting", "Negotiation", "Closing"]);
  const action = page.getByRole("button", { name: `Change stage for ${input.title}`, exact: true });
  await keyActivate(page, action);
  const dialog = page.getByRole("dialog", { name: "Change deal stage", exact: true });
  await keySelect(page, dialog.getByLabel("Deal stage", { exact: true }), "Scoping");
  await expect(dialog.getByLabel("Qualification outcome", { exact: true })).toHaveCount(0);
  await committed(page, `crm/opportunities/${input.id}/stage`, () => keyActivate(page, dialog.getByRole("button", { name: "Save stage", exact: true })));
  await expect(dialog).not.toBeVisible(); await expect(action).toBeFocused();
  await expect(action).toBeInViewport({ ratio: 1 });
  const saved = (await call(page, `crm/opportunities/${input.id}`)).items[0];
  expect(saved.stage_id).toBe("Scoping"); expect(saved.qualification_note).toBe(input.qualification_note);
  expect(saved.events.map((e: {to_stage:string}) => e.to_stage)).toEqual(["Discovery", "Scoping"]);
  await page.screenshot({ path: info.outputPath("crm-five-stage-persisted.png") });
  if (info.project.use.isMobile) {
    await page.setViewportSize({ width: 320, height: 844 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await expect(action).toBeFocused();
    await expect(action).toBeInViewport({ ratio: 1 });
    await page.screenshot({ path: info.outputPath("crm-five-stage-persisted-320.png") });
  }
  await page.reload();
  expect((await call(page, `crm/opportunities/${input.id}`)).items[0].events).toEqual(saved.events);
});


test("an accepted detail stage save preserves an independently edited next-action proposal for comparison", async ({ page }) => {
  await call(page, "local-session", { profile: "coordinator" });
  const input = crmDiscovery(); await call(page, "crm/opportunities", input);
  await page.goto(`/sales/opportunities/${input.id}`);
  await page.getByRole("tab", { name: "Activities", exact: true }).click();
  const purpose = page.getByLabel("Action purpose", { exact: true });
  await purpose.fill("SYN independently edited follow-up must retain its original version");
  await page.locator(".crm-stage-track").getByRole("button", { name: "Scoping", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Change deal stage", exact: true });
  await committed(page, `crm/opportunities/${input.id}/stage`, () => dialog.getByRole("button", { name: "Save stage", exact: true }).click());
  await expect(dialog).not.toBeVisible();
  await expect(page.getByRole("heading", { name: "Compare saved version 2 with your proposal", exact: true })).toBeVisible();
  await expect(purpose).toHaveValue("SYN independently edited follow-up must retain its original version");
  await expect(page.getByRole("button", { name: "Save next action", exact: true })).toBeDisabled();
  expect((await call(page, `crm/opportunities/${input.id}`)).items[0].actions).toHaveLength(1);
  await page.getByRole("button", { name: "Use current version for deliberate retry", exact: true }).click();
  await expect(page.getByRole("button", { name: "Save next action", exact: true })).toBeEnabled();
  await expect(purpose).toHaveValue("SYN independently edited follow-up must retain its original version");
});
