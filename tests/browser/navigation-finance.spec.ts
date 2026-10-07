import { test, expect } from "@playwright/test";
import { readFile } from "node:fs/promises";
test("N29 Finance entry rechecks exact sources without creating a handoff",async({page,baseURL})=>{
  let f:{report:string;handoff:string;work:string;profile:string};
  try {f=JSON.parse(await readFile("verification-evidence/navigation/finance-fixture.json","utf8"));}
  catch {test.skip(true,"Run bounded verify-navigation-finance.ts against the task-owned synthetic database.");return;}
  expect((await page.request.post("/api/v1/local-session",{headers:{Origin:baseURL!},data:{profile:f.profile}})).ok()).toBe(true);
  let writes=0;page.on("request",r=>{if(r.method()==="POST"&&r.url().includes("/api/v1/finance/handoffs"))writes++;});
  const source=page.waitForResponse(r=>r.url().includes(`/api/v1/finance/work-orders/${f.work}/sources`)&&r.ok());
  await page.goto(`/finance/handoffs/new?work_order_id=${f.work}&report_id=${f.report}`);await source;
  await expect(page.getByRole("heading",{name:"Prepare Finance handoff",level:1,exact:true})).toBeVisible();
  await expect(page.getByRole("combobox",{name:"Work order",exact:true})).toHaveValue(f.work);
  await expect(page.getByRole("combobox",{name:"Synthetic account",exact:true})).toHaveValue("");
  await expect(page.getByRole("button",{name:"Select this reviewed source report",exact:true})).toBeEnabled();
  await expect(page.getByRole("link",{name:"Return to source report",exact:true})).toHaveAttribute("href",`/service/reports/${f.report}`);
  await page.goto(`/finance/handoffs/new?work_order_id=${f.work}&report_id=10000000-0000-4000-8000-000000000099`);
  await expect(page.getByText(/Source report unavailable or not eligible/)).toBeVisible();
  await expect(page.getByRole("button",{name:"Select this reviewed source report",exact:true})).toHaveCount(0);
  await page.goto(`/finance/handoffs/${f.handoff}`);
  await expect(page.getByRole("navigation",{name:"Breadcrumb",exact:true})).toContainText("Finance handoff");
  expect(writes).toBe(0);
});

test("N14 exact permitted Finance account extends its module hierarchy",async({page,baseURL})=>{
  expect((await page.request.post("/api/v1/local-session",{headers:{Origin:baseURL!},data:{profile:"finance"}})).ok()).toBe(true);
  const list=await page.request.get("/api/v1/navigation/accounts");expect(list.ok()).toBe(true);
  const {items}=await list.json();expect(items.length).toBeGreaterThan(0);const account=items[0];
  await page.goto("/finance/accounts");
  const read=page.waitForResponse(r=>r.url().includes(`/api/v1/customers/${account.customer_id}/account-observations?account_id=${account.id}`)&&r.ok());
  await page.locator(`main a[href='/customers/${account.customer_id}/account?account_id=${account.id}&department=finance']`).click();
  const exact=await (await read).json();const breadcrumb=page.getByRole("navigation",{name:"Breadcrumb",exact:true});
  await expect(breadcrumb).toContainText(exact.account.fixture_key);
  await expect(breadcrumb.getByRole("link",{name:"Customer accounts",exact:true})).toHaveAttribute("href","/finance/accounts");
  expect((await page.request.post("/api/v1/local-session",{headers:{Origin:baseURL!},data:{profile:"technician"}})).ok()).toBe(true);
  const denied=page.waitForResponse(r=>r.url().includes(`/api/v1/customers/${account.customer_id}/account-observations?account_id=${account.id}`)&&[403,404].includes(r.status()));
  await page.reload();await denied;await expect(breadcrumb).not.toContainText(exact.account.fixture_key);
});
