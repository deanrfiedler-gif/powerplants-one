import { test, expect } from "@playwright/test";
test("N19/N31 labelled destinations and shell controls retain all established breakpoints",async({page,isMobile})=>{
  test.skip(isMobile,"This fixture owns explicit phone/tablet/desktop viewport transitions.");
  test.setTimeout(90000);
  expect((await page.request.post("/api/v1/local-session",{headers:{Origin:new URL(test.info().project.use.baseURL!).origin},data:{profile:"coordinator"}})).ok()).toBe(true);
  for(const width of [320,390,780,781,1199,1200,1440]){
    await page.setViewportSize({width,height:900});
    const read=page.waitForResponse(r=>r.url().includes("/api/v1/crm/opportunities")&&r.request().method()==="GET"&&r.ok());
    await page.goto("/sales/opportunities");await read;
    await expect(page.locator(".crm-workspace")).toBeVisible();
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
    if(width<=780){
      await expect(page.locator(".ppo-rail")).toBeHidden();
      await expect(page.getByRole("navigation",{name:"Mobile navigation",exact:true})).toBeVisible();
      await expect(page.getByRole("navigation",{name:"Mobile navigation",exact:true}).getByText("Activities",{exact:true})).toBeVisible();
    }else{
      await expect(page.locator(".ppo-rail")).toBeVisible();
      await page.getByRole("button",{name:/Expand primary navigation/}).click();
      expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
    }
    await page.getByRole("button",{name:"More",exact:true}).click();
    await expect(page.getByLabel("Workspace",{exact:true})).toBeVisible();
    const bounds=await page.getByRole("searchbox",{name:"Find a menu item",exact:true}).boundingBox();
    expect(bounds!.x).toBeGreaterThanOrEqual(0);expect(bounds!.x+bounds!.width).toBeLessThanOrEqual(width);
    await page.screenshot({path:test.info().outputPath(`nav-${width}.png`)});
    await page.keyboard.press("Escape");await expect(page.getByRole("button",{name:"More",exact:true})).toBeFocused();
    if(width>780)await page.getByRole("button",{name:"Collapse primary navigation",exact:true}).click();
  }
});
