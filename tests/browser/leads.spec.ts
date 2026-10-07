import { test, expect, type Page } from "@playwright/test";
import { CRM, crmBase, crmAction } from "../helpers/crm";
import { leadCreate } from "../helpers/leads";
test.describe.configure({ timeout: 120000 });
test.beforeEach(async ({ page }) => {
  page.on("pageerror", error => console.error("Leads browser error:", error.message));
  page.on("console", message => { if (message.type() === "error") console.error("Leads console:", message.text()); });
});

test("LC-11 a site discovered after lead follow-up keeps source obligations through lost-response recovery", async ({ page }, info) => {
  await call(page, "local-session", { profile: "coordinator" });
  const input = { ...leadCreate(), site_id: null }, action = { ...crmAction(), summary: "SYN Resolve the original customer questions" };
  input.title = `SYN Site resolution ${input.id}`;
  await call(page, "crm/leads", input);
  await call(page, `crm/leads/${input.id}/next-action`, { ...crmBase(), expected_version: 1, activity_id: null, new_action: action });
  const original = (await call(page, `activities/${action.id}`)).items[0];
  await page.goto(`/sales/leads/${input.id}`);
  await page.getByRole("button", { name: "Convert to deal", exact: true }).click();
  await page.getByRole("combobox", { name: "Site", exact: true }).click();
  await page.locator(`[role=option][data-record-id="${CRM.site}"]`).click();
  await expect(page.getByRole("heading", { name: "Keep the original follow-up connected" })).toBeVisible();
  await expect(page.getByRole("combobox", { name: "Next activity", exact: true })).toBeDisabled();
  await page.getByLabel(`Review plan for ${action.summary}`).fill("SYN Confirm the unresolved questions against the newly identified site.");
  await page.getByLabel("Qualification note", { exact: true }).fill("SYN Customer and site confirmed for owned discovery.");
  await page.getByLabel("Source follow-up review summary", { exact: true }).fill("SYN Review retained enquiry questions with the site contact");
  await page.getByLabel("Due date and time (required for the source review)").fill("2031-11-13T13:00");
  await page.screenshot({ path: info.outputPath("lead-site-review.png") });
  let intercepted = 0;
  await page.route(`**/api/v1/crm/leads/${input.id}/convert`, async route => {
    intercepted++;
    const response = await route.fetch();
    expect(response.ok(), await response.text()).toBe(true);
    await route.abort("failed");
  });
  await page.getByRole("button", { name: "Convert to deal", exact: true }).click();
  await page.getByRole("button", { name: "Confirm original save", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Source follow-up review", exact: true })).toBeVisible();
  const lead = await call(page, `crm/leads/${input.id}`);
  expect(lead.status).toBe("Converted");
  expect(intercepted).toBe(1);
  expect((await call(page, `activities/${action.id}`)).items[0]).toEqual(original);
  await page.reload();
  await expect(page.getByRole("heading", { name: "Source follow-up review", exact: true })).toBeVisible();
  await page.goto(`/sales/opportunities/${lead.deal.id}`);
  await page.getByRole("tab", { name: "Activities", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Retained lead follow-up", exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: action.summary, exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: info.outputPath("deal-retained-lead-follow-up.png") });
});
async function call(page: Page, path: string, body?: unknown) {
  const r = await page.request.fetch(`/api/v1/${path}`, {
    method: body === undefined ? "GET" : "POST",
    headers: body === undefined ? {} : { Origin: "http://127.0.0.1:3000" },
    data: body,
  });
  expect(r.ok(), await r.text()).toBe(true);
  return r.json();
}

test("LC-12 resolves an unknown enquiry and recovers the exact saved context",async({page},info)=>{
  await call(page,"local-session",{profile:"coordinator"});
  const input={...leadCreate(),organisation_id:null,site_id:null,primary_person_id:null};
  input.title=`SYN Resolve customer ${input.id}`;
  await call(page,"crm/leads",input);
  await page.goto(`/sales/leads/${input.id}`);
  await page.getByRole("button",{name:"Resolve customer context",exact:true}).click();
  for(const [label,id] of [["Customer organisation",CRM.org],["Customer site",CRM.site],["Customer contact",CRM.person]]){
    await page.getByRole("combobox",{name:label,exact:true}).click();
    await page.locator(`[role=option][data-record-id="${id}"]`).click();
  }
  await page.getByLabel("Reason for this change",{exact:true}).fill("SYN Confirmed the customer, site and contact for the original enquiry.");
  await page.screenshot({path:info.outputPath("lead-customer-resolution.png")});
  let posts=0;
  await page.route(`**/api/v1/crm/leads/${input.id}/resolve`,async route=>{
    posts++;const response=await route.fetch();expect(response.ok(),await response.text()).toBe(true);await route.abort("failed");
  });
  await page.getByRole("button",{name:"Save customer context",exact:true}).click();
  await page.getByRole("button",{name:"Confirm original save",exact:true}).click();
  await expect(page.getByRole("heading",{name:"Resolved customer context",exact:true})).toBeVisible();
  expect(posts).toBe(1);
  const lead=await call(page,`crm/leads/${input.id}`);
  expect(lead.organisation_id).toBeNull();expect(lead.resolution.organisation_id).toBe(CRM.org);
  await page.reload();
  await expect(page.getByRole("dialog")).toContainText("Selected at lead version 2");
  await page.getByRole("button",{name:"Convert to deal",exact:true}).click();
  await expect(page.getByRole("combobox",{name:"Existing organisation",exact:true})).not.toHaveValue("");
  await page.getByRole("button",{name:"Cancel",exact:true}).click();
  await page.getByRole("button",{name:"Transfer ownership",exact:true}).click();
  await expect(page.getByRole("button",{name:"Transfer lead",exact:true})).toBeDisabled();
  await expect(page.getByRole("heading",{name:"Transfer lead ownership",exact:true})).toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.screenshot({path:info.outputPath("lead-owner-comparison.png")});
});

test("LC-12 a background refresh cannot advance the reviewed version and denied context is cleared",async({page})=>{
  await call(page,"local-session",{profile:"coordinator"});
  const input=leadCreate();input.title=`SYN Frozen review ${input.id}`;
  await call(page,"crm/leads",input);await page.goto(`/sales/leads/${input.id}`);
  await page.getByRole("button",{name:"Resolve customer context",exact:true}).click();
  await page.getByLabel("Reason for this change",{exact:true}).fill("SYN Selected the current customer context");
  await call(page,`crm/leads/${input.id}`,{...crmBase(),expected_version:1,action:"note",note:"SYN Concurrent customer update"});
  const refresh=page.waitForResponse(r=>r.url().endsWith(`/api/v1/crm/leads/${input.id}`)&&r.request().method()==="GET");
  await page.evaluate(()=>window.dispatchEvent(new Event("focus")));expect((await(await refresh).json()).version).toBe(2);
  await page.getByRole("button",{name:"Save customer context",exact:true}).click();
  await expect(page.getByRole("dialog")).toContainText("This lead changed");
  expect((await call(page,`crm/leads/${input.id}`)).resolution).toBeNull();
  // Presentation proof for a current-authority refusal; real permission checks are database-tested.
  await page.route(`**/api/v1/crm/leads/${input.id}/resolve`,route=>route.fulfill({status:403,contentType:"application/json",body:JSON.stringify({error:{code:"Forbidden",message:"Current access revoked",retryable:false}})}));
  await page.getByRole("button",{name:"Save customer context",exact:true}).click();
  await expect(page.getByRole("heading",{name:"Lead context unavailable",exact:true})).toBeVisible();
  await expect(page.getByRole("combobox",{name:"Customer organisation",exact:true})).toHaveCount(0);
});

test("LC-12 creates a customer, dated contact affiliation and site then returns for explicit lead resolution",async({page},info)=>{
  test.setTimeout(180000);
  await call(page,"local-session",{profile:"coordinator"});
  const input={...leadCreate(),organisation_id:null,site_id:null,primary_person_id:null,organisation_text:"",contact_text:"SYN Nursery Contact"};
  input.title=`SYN New prospect ${input.id}`;input.organisation_text=`SYN Nursery ${input.id}`;
  await call(page,"crm/leads",input);
  await page.goto(`/sales/leads/${input.id}`);
  await page.getByRole("button",{name:"Resolve customer context",exact:true}).click();
  await page.getByRole("button",{name:"Create customer and return",exact:true}).click();
  await expect(page.getByLabel("Display name",{exact:true})).toHaveValue(input.organisation_text!);
  await page.getByLabel("Reason for capture",{exact:true}).fill("SYN New prospect recorded from the enquiry");
  let creates=0;
  await page.route("**/api/v1/customers",async route=>{
    if(route.request().method()!=="POST") return route.continue();
    creates++;const response=await route.fetch();expect(response.ok(),await response.text()).toBe(true);await route.abort("failed");
  });
  await page.getByRole("button",{name:"Save record",exact:true}).click();
  await page.getByRole("button",{name:"Confirm original save",exact:true}).click();
  expect(creates).toBe(1);
  await expect(page.getByRole("heading",{name:"Resolve customer context",exact:true})).toBeVisible();
  expect((await call(page,`crm/leads/${input.id}`)).resolution).toBeNull();
  await page.getByRole("button",{name:"Create contact and return",exact:true}).click();
  await page.getByLabel("Reason for capture",{exact:true}).fill("SYN Contact supplied with this enquiry");
  await page.getByRole("button",{name:"Save record",exact:true}).click();
  await expect(page.getByRole("heading",{name:"Add an existing contact affiliation",exact:true})).toBeVisible();
  await expect(page.getByText("The contact has been saved.",{exact:false})).toBeVisible();
  await page.getByLabel("Affiliation role",{exact:true}).fill("Site contact");
  await page.getByLabel("Valid from",{exact:true}).fill("2026-01-01");
  await page.getByLabel("Reason for capture",{exact:true}).fill("SYN Customer confirmed the current affiliation");
  await page.getByRole("button",{name:"Save record",exact:true}).click();
  await expect(page.getByRole("heading",{name:"Resolve customer context",exact:true})).toBeVisible();
  await page.getByRole("button",{name:"Create site and return",exact:true}).click();
  await page.getByLabel("Display name",{exact:true}).fill(`SYN Site ${input.id}`);
  await page.getByLabel("Known location / explicit location uncertainty",{exact:true}).fill("SYN Growing site; access to be confirmed");
  await page.getByLabel("Relationship role",{exact:true}).selectOption("Operator");
  await page.getByLabel("Effective from (UTC)",{exact:true}).fill("2026-01-01T00:00");
  await page.getByLabel("Reason for capture",{exact:true}).fill("SYN Customer confirmed the site relationship");
  await page.getByRole("button",{name:"Save record",exact:true}).click();
  await expect(page.getByRole("heading",{name:"Resolve customer context",exact:true})).toBeVisible();
  await page.getByLabel("Reason for this change",{exact:true}).fill("SYN Reviewed all newly saved customer records against the enquiry");
  await page.getByRole("button",{name:"Save customer context",exact:true}).click();
  await expect(page.getByRole("heading",{name:"Resolved customer context",exact:true})).toBeVisible();
  const lead=await call(page,`crm/leads/${input.id}`);
  expect(lead.resolution.state).toBe("Available");expect(lead.resolution.site_id).toBeTruthy();expect(lead.resolution.primary_person_id).toBeTruthy();
  expect(lead.organisation_id).toBeNull();expect(lead.events.filter((e:{event_type:string})=>e.event_type==="ResolveLeadContext")).toHaveLength(1);
  await page.reload();await expect(page.getByRole("dialog")).toContainText(`SYN Site ${input.id}`);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.screenshot({path:info.outputPath("lead-created-customer-context.png")});
});
test("approved leads list/detail and atomic conversion persist through reload", async ({
  page,
}, info) => {
  await call(page, "local-session", { profile: "coordinator" });
  const input = leadCreate();
  await call(page, "crm/leads", input);
  const action = crmAction();
  await call(page, `crm/leads/${input.id}/next-action`, {
    ...crmBase(),
    expected_version: 1,
    activity_id: null,
    new_action: action,
  });
  await page.goto(`/sales/leads?q=${encodeURIComponent(input.title)}`);
  await expect(
    page.locator(`a[href*="/sales/leads/${input.id}"]:visible`).first(),
  ).toBeVisible();
  if (info.project.use.isMobile) {
    await expect(
      page.getByRole("link", { name: "Back to deals" }),
    ).toBeVisible();
    await expect(page.locator(".mobile-navigation")).toBeVisible();
    await expect(page.locator(".topbar.ppo-shell-header")).toBeVisible();
    await expect(page.getByRole("button", { name: "More", exact: true })).toBeVisible();
  }
  await page.screenshot({ path: info.outputPath("leads-list.png") });
  await page
    .locator(`a[href*="/sales/leads/${input.id}"]:visible`)
    .first()
    .click();
  await expect(page.getByRole("dialog")).toContainText(input.title);
  await page.screenshot({ path: info.outputPath("lead-detail.png") });
  await page
    .getByRole("button", { name: "Convert to deal", exact: true })
    .click();
  await page
    .getByLabel("Qualification note", { exact: true })
    .fill("SYN Credible requirement confirmed; proceed with owned follow-up.");
  await page
    .getByRole("button", { name: "Convert to deal", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toContainText("Converted");
  await page.reload();
  const lead = await call(page, `crm/leads/${input.id}`);
  expect(lead.status).toBe("Converted");
  expect(lead.deal.id).toBeTruthy();
  expect(lead.next_activity.id).toBe(action.id);
  await page.getByRole("link", { name: "Open deal", exact: true }).click();
  await page.getByRole("tab", { name: "Activities", exact: true }).click();
  await expect(
    page.getByRole("link", { name: lead.display_number, exact: true }),
  ).toBeVisible();
  const savedDeal = (await call(page, `crm/opportunities/${lead.deal.id}`)).items[0];
  expect(savedDeal.stage_id).toBe("Discovery");
  expect(savedDeal.version).toBe(1);
  expect(savedDeal.events).toHaveLength(1);
  expect(savedDeal.qualification_note).toBe("SYN Credible requirement confirmed; proceed with owned follow-up.");
  await page.screenshot({ path: info.outputPath("converted-deal.png") });
});
test("Add lead has one scroll body, fixed actions, focus return and navy add button at phone sizes", async ({
  page,
}, info) => {
  await call(page, "local-session", { profile: "coordinator" });
  await page.goto("/sales/leads");
  await expect(
    page.getByRole("button", { name: "Add lead", exact: true }),
  ).toBeVisible();
  for (const viewport of info.project.use.isMobile
    ? [
        { width: 390, height: 844 },
        { width: 320, height: 800 },
        { width: 390, height: 440 },
      ]
    : [{ width: 1440, height: 900 }]) {
    await page.setViewportSize(viewport);
    const add = page.getByRole("button", { name: "Add lead", exact: true });
    if (info.project.use.isMobile) {
      const addBounds = (await add.boundingBox())!;
      const navigationBounds = (await page.locator(".mobile-navigation").boundingBox())!;
      expect(addBounds.y + addBounds.height).toBeLessThanOrEqual(navigationBounds.y);
    }
    await add.click();
    const modal = page.getByRole("dialog", { name: "Add lead", exact: true });
    await expect(modal).toBeVisible();
    await page
      .getByLabel("Lead title", { exact: true })
      .fill("SYN Mobile manual enquiry");
    await page
      .getByLabel("Requirement / enquiry", { exact: true })
      .fill(
        "SYN Long requirement line for scrolling verification.\n".repeat(24),
      );
    const before = await modal.locator(".lead-dialog-foot").boundingBox();
    await modal.locator(".lead-dialog-body").evaluate((e) => {
      e.scrollTop = e.scrollHeight;
    });
    const after = await modal.locator(".lead-dialog-foot").boundingBox();
    expect(Math.abs(before!.y - after!.y)).toBeLessThan(1);
    await expect(
      page.getByRole("button", { name: "Save lead", exact: true }),
    ).toBeInViewport();
    expect(
      await page.evaluate(() => document.documentElement.style.overflow),
    ).toBe("hidden");
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    expect(
      await page
        .getByLabel("Requirement / enquiry", { exact: true })
        .evaluate((e) => e.scrollHeight <= e.clientHeight + 2),
    ).toBe(true);
    await page.screenshot({
      path: info.outputPath(
        `add-lead-${viewport.width}x${viewport.height}.png`,
      ),
    });
    await page.getByRole("button", { name: "Cancel", exact: true }).click();
    await expect(modal).not.toBeVisible();
    expect(
      await page.evaluate(() => document.documentElement.style.overflow),
    ).not.toBe("hidden");
    await expect(add).toBeFocused();
  }
  await page.getByRole("button", { name: "Add lead", exact: true }).click();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).not.toBeVisible();
});
test("manual lead saves with an unverified organisation and survives reload", async ({
  page,
}) => {
  await call(page, "local-session", { profile: "coordinator" });
  await page.goto("/sales/leads");
  await page.getByRole("button", { name: "Add lead", exact: true }).click();
  await page
    .getByLabel("Lead title", { exact: true })
    .fill("SYN Unverified inbox enquiry");
  const company = page.getByRole("combobox", { name: "Company", exact: true });
  await company.fill("SYN");
  await page.locator(`[role=option][data-record-id="${CRM.company}"]`).click();
  const owner = page.getByRole("combobox", { name: "Lead owner", exact: true });
  await owner.fill("SYN");
  await page.locator(`[role=option][data-record-id="${CRM.owner}"]`).click();
  await page
    .getByLabel("Organisation / business", { exact: true })
    .fill("SYN Unverified Nursery");
  await page
    .getByLabel("Source details", { exact: true })
    .fill("SYN Manual phone enquiry; contact to be confirmed.");
  await page.getByRole("button", { name: "Save lead", exact: true }).click();
  await expect(page.getByRole("dialog")).toContainText(
    "SYN Unverified Nursery",
  );
  await page.reload();
  await expect(page.getByRole("dialog")).toContainText(
    "SYN Unverified Nursery",
  );
});

test("approved desktop columns resize independently and retain widths with quiet aligned handles", async ({
  page,
}, info) => {
  test.skip(
    !!info.project.use.isMobile,
    "Desktop column interaction; phone journey covered separately.",
  );
  await call(page, "local-session", { profile: "coordinator" });
  const input = leadCreate();
  await call(page, "crm/leads", input);
  await page.goto(`/sales/leads?q=${encodeURIComponent(input.title)}`);
  await expect(page.locator(".lead-table tbody tr")).toHaveCount(1);
  await expect(page.locator(".lead-add")).toHaveText("Lead");
  await page.getByRole("button", { name: "Reset columns" }).click();
  // The selection and row-action rails are fixed; only .lead-col resizes.
  const widths = () =>
    page
      .locator(".lead-table col.lead-col")
      .evaluateAll((cs) => cs.map((c) => c.getBoundingClientRect().width));
  const handle = page.getByRole("separator", {
    name: "Resize Lead title column",
    exact: true,
  });
  const before = await widths();
  expect(
    await handle.evaluate((h) => getComputedStyle(h, "::after").opacity),
  ).toBe("0");
  await handle.hover();
  expect(
    await handle.evaluate((h) => getComputedStyle(h, "::after").opacity),
  ).toBe("1");
  const box = (await handle.boundingBox())!;
  await page.mouse.move(box.x + 5, box.y + 15);
  await page.mouse.down();
  await page.mouse.move(box.x + 125, box.y + 15);
  await page.mouse.up();
  const after = await widths();
  expect(after[0] - before[0]).toBeCloseTo(120, 0);
  expect(after.slice(1)).toEqual(before.slice(1));
  for (const offset of await page
    .locator(".lead-table th:has(.lead-column-resizer)")
    .evaluateAll((ths) =>
      ths.map(
        (th) =>
          th.querySelector(".lead-column-resizer")!.getBoundingClientRect()
            .right -
          (th.getBoundingClientRect().right - 0.5),
      ),
    ))
    expect(Math.abs(offset)).toBeLessThan(0.1);
  await page.reload();
  await expect(page.locator(".lead-table tbody tr")).toHaveCount(1);
  await expect.poll(widths).toEqual(after);
  await handle.focus();
  await page.keyboard.press("ArrowLeft");
  expect((await widths())[0]).toBeCloseTo(after[0] - 10, 0);
  await page.keyboard.press("Home");
  expect((await widths())[0]).toBe(190);
  await page.getByRole("button", { name: "Reset columns" }).click();
  await expect.poll(widths).toEqual(before);
  for (const viewport of [
    { width: 1366, height: 768 },
    { width: 1920, height: 1080 },
    { width: 960, height: 640 },
  ]) {
    await page.setViewportSize(viewport);
    await expect(page.locator(".ppo-shell-header")).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({
      path: info.outputPath(`leads-desktop-${viewport.width}.png`),
    });
  }
  await page.getByRole("button", { name: "Quick add", exact: true }).click();
  await page.getByRole("link", { name: "Lead In this module", exact: true }).click();
  await expect(
    page.getByRole("dialog", { name: "Add lead", exact: true }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).not.toBeVisible();
});
