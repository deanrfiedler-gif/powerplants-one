import { test, expect } from "@playwright/test";
import { readFile } from "node:fs/promises";
type Fixture={batch:string;older:{estimate:string;quote:string;title:string};deal:string;estimate:string;original_version:string};
test.beforeEach(async({page,baseURL})=>{
  expect((await page.request.post("/api/v1/local-session",{headers:{Origin:baseURL!},data:{profile:"coordinator"}})).ok()).toBe(true);
});
async function fixture():Promise<Fixture>{
  try{return JSON.parse(await readFile("verification-evidence/navigation/commercial-fixture.json","utf8"));}
  catch{test.skip(true,"Run bounded verify-navigation-commercial.ts against the task-owned synthetic database.");throw Error("Fixture unavailable");}
}
test("N13 scoped continuation reaches a quotation beyond the first 100 estimates",async({page})=>{
  test.setTimeout(90000);const f=await fixture();
  const read=page.waitForResponse(r=>r.url().includes("/api/v1/navigation/quotations?")&&r.ok(),{timeout:60000});
  await page.goto(`/estimating/quotes?q=${encodeURIComponent(f.batch)}`);await read;
  await expect(page.getByText(/this is not a complete quotation register/)).toBeVisible();
  await expect(page.locator(`main a[href='/estimating/quotes/${f.older.quote}']`)).toHaveCount(0);
  await page.getByRole("link",{name:"Continue to older estimates",exact:true}).click();
  await expect(page).toHaveURL(/offset=100/);
  const exact=page.locator(`main a[href='/estimating/quotes/${f.older.quote}']`);
  await expect(exact).toContainText(f.older.title);await exact.click();
  await expect(page).toHaveURL(new RegExp(`/estimating/quotes/${f.older.quote}$`));
  await expect(page.getByRole("heading",{name:/Draft quotation/})).toBeVisible();
});
test("N24 Deal sections and exact estimate revisions restore through reload and Back",async({page})=>{
  const f=await fixture();await page.goto(`/sales/opportunities/${f.deal}?section=commercial`);
  await expect(page.getByRole("tab",{name:"Estimates & quotations",exact:true})).toHaveAttribute("aria-selected","true");
  await page.reload();await expect(page.getByRole("tab",{name:"Estimates & quotations",exact:true})).toHaveAttribute("aria-selected","true");
  await page.getByRole("tab",{name:"Overview",exact:true}).click();await expect(page).toHaveURL(/section=overview/);
  await page.goBack();await expect(page.getByRole("tab",{name:"Estimates & quotations",exact:true})).toHaveAttribute("aria-selected","true");
  await page.goto(`/estimating/estimates/${f.estimate}?version_id=${f.original_version}`);
  await expect(page.getByText(/Viewing saved version 1 · Current version 2/)).toBeVisible();
  await page.reload();await expect(page.getByText(/Viewing saved version 1 · Current version 2/)).toBeVisible();
  await page.goto(`/estimating/estimates/${f.estimate}?version_id=10000000-0000-4000-8000-000000000099`);
  await expect(page.getByText(/Requested revision unavailable/)).toBeVisible();
  await expect(page.getByText(/Viewing saved version 2 · Current version 2/)).toBeVisible();
});
