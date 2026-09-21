// Local measurement probe: for each register the refinement touches, confirm the duplicated title band
// no longer takes room, the heading is still in the accessibility tree, the page's own action is still
// visible, and the description reached the page-information panel.
import { chromium } from "playwright";
const origin = process.env.PPO_ORIGIN ?? "http://127.0.0.1:3107";
const routes = JSON.parse(process.env.PPO_ROUTES ?? '[]');
const browser = await chromium.launch({ channel: "chrome" });
const page = await (await browser.newContext({ locale: "en-AU", viewport: { width: 1440, height: 960 } })).newPage();
let current = null;
for (const [profile, route] of routes) {
  if (profile !== current) {
    const r = await page.request.post(`${origin}/api/v1/local-session`, { headers: { Origin: origin }, data: { profile } });
    if (!r.ok()) { console.log(route, "SIGN-IN FAILED", r.status()); continue; }
    current = profile;
  }
  await page.goto(`${origin}${route}`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1100);
  const m = await page.evaluate(() => {
    const h1 = document.querySelector("main h1");
    const band = document.querySelector(".business-heading");
    const titleBox = document.querySelector(".business-heading-register > div:first-child, h1.ppo-register-title");
    const actions = [...document.querySelectorAll(".business-heading a,.business-heading button")].filter(a => a.getBoundingClientRect().width > 0).map(a => a.textContent?.trim());
    return {
      h1: h1?.textContent?.trim() ?? null,
      // Visually hidden means the box that holds the title is clipped to a 1px square, not that the
      // heading left the document: it must stay in the accessibility tree.
      titleBoxHeight: titleBox ? Math.round(titleBox.getBoundingClientRect().height) : null,
      headingInTree: !!h1,
      bandHeight: band ? Math.round(band.getBoundingClientRect().height) : null,
      actions,
      crumbs: [...document.querySelectorAll(".ppo-crumbs li")].map(li => li.textContent),
      mains: document.querySelectorAll("main").length,
    };
  });
  await page.getByRole("button", { name: "Page guide", exact: true }).click();
  await page.waitForTimeout(350);
  const guide = await page.evaluate(() => document.querySelector(".ppo-guide-intro p")?.textContent ?? null);
  await page.keyboard.press("Escape");
  console.log(route.padEnd(26), JSON.stringify({ ...m, guide }));
}
await browser.close();
