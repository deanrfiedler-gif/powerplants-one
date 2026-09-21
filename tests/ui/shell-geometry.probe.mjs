// Local measurement probe for the existing-modules UI refinement. Not a suite: it measures the
// running application at several widths and prints the numbers the refinement is judged by.
import { chromium } from "playwright";
const origin = process.env.PPO_ORIGIN ?? "http://127.0.0.1:3107";
const widths = [[1920,1080],[1440,960],[1366,768],[1024,768]];
const routes = JSON.parse(process.env.PPO_ROUTES ?? '[["coordinator","/work"],["coordinator","/sales/leads"],["coordinator","/sales/opportunities"],["coordinator","/customers"],["coordinator","/projects"],["coordinator","/service/tickets"]]');
const browser = await chromium.launch({ channel: "chrome" });
const context = await browser.newContext({ locale: "en-AU" });
const page = await context.newPage();
const signIn = async (profile) => {
  const r = await page.request.post(`${origin}/api/v1/local-session`, { headers: { Origin: origin }, data: { profile } });
  if (!r.ok()) throw new Error(`sign-in ${profile}: ${r.status()} ${await r.text()}`);
};
const measure = () => page.evaluate(() => {
  const root = document.querySelector(".app-frame") ?? document.documentElement;
  const rootBox = root.getBoundingClientRect();
  const search = document.querySelector(".ppo-header-centre .ppo-global-search");
  const quick = document.querySelector(".ppo-header-centre .ppo-quick-add");
  const group = search && quick ? { left: Math.min(search.getBoundingClientRect().left, quick.getBoundingClientRect().left), right: Math.max(search.getBoundingClientRect().right, quick.getBoundingClientRect().right) } : null;
  const menu = document.querySelector(".mw-menu:not([hidden])");
  const strip = document.querySelector(".mw-menu-strip");
  const scope = document.querySelector("[data-menu]");
  const table = document.querySelector(".em-table-scroll, .mw-content table, table");
  const crumbs = [...document.querySelectorAll(".ppo-crumbs li")].map(li => ({ text: li.textContent, hidden: getComputedStyle(li).display === "none", kind: li.dataset.crumb }));
  const toggle = document.querySelector(".ppo-header-menu-slot .ppo-menu-toggle");
  const heading = document.querySelector(".product-heading");
  return {
    rootLeft: rootBox.left, rootWidth: rootBox.width,
    targetCentre: rootBox.left + rootBox.width / 2,
    groupCentre: group ? (group.left + group.right) / 2 : null,
    gap: search && quick ? quick.getBoundingClientRect().left - search.getBoundingClientRect().right : null,
    railRight: document.querySelector(".ppo-rail")?.getBoundingClientRect().right ?? null,
    menuRight: menu?.getBoundingClientRect().right ?? null,
    menuWidth: menu?.getBoundingClientRect().width ?? null,
    stripWidth: strip?.getBoundingClientRect().width ?? null,
    stripRight: strip?.getBoundingClientRect().right ?? null,
    menuState: scope?.getAttribute("data-menu") ?? null,
    contentLeft: document.querySelector(".mw-content")?.getBoundingClientRect().left ?? null,
    tableLeft: table?.getBoundingClientRect().left ?? null,
    crumbs,
    toggleWidth: toggle?.getBoundingClientRect().width ?? null,
    toggleToCrumb: toggle && heading ? heading.getBoundingClientRect().left - toggle.getBoundingClientRect().right : null,
    pageFits: document.documentElement.scrollWidth <= innerWidth + 1,
  };
});
const out = [];
let current = null;
for (const [profile, route] of routes) {
  if (profile !== current) { await signIn(profile); current = profile; }
  for (const [w, h] of widths) {
    await page.setViewportSize({ width: w, height: h });
    await page.goto(`${origin}${route}`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(900);
    const m = await measure();
    out.push({ route, size: `${w}x${h}`, ...m });
  }
}
console.log(JSON.stringify(out, null, 1));
await browser.close();
