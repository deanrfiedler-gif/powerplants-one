// Local measurement probe: the docked secondary menu's two states, the collapsed strip, the More
// panel's right edge against the expanded menu coordinate, and what the breadcrumb reads in each.
import { chromium } from "playwright";
const origin = process.env.PPO_ORIGIN ?? "http://127.0.0.1:3107";
const route = process.env.PPO_ROUTE ?? "/work";
const profile = process.env.PPO_PROFILE ?? "coordinator";
const browser = await chromium.launch({ channel: "chrome" });
const page = await (await browser.newContext({ locale: "en-AU", viewport: { width: 1440, height: 960 } })).newPage();
const r = await page.request.post(`${origin}/api/v1/local-session`, { headers: { Origin: origin }, data: { profile } });
if (!r.ok()) throw new Error(await r.text());
await page.goto(`${origin}${route}`, { waitUntil: "domcontentloaded" });
await page.waitForTimeout(1200);
const read = () => page.evaluate(() => {
  const rail = document.querySelector(".ppo-rail")?.getBoundingClientRect();
  const menu = document.querySelector(".mw-menu:not([hidden])")?.getBoundingClientRect();
  const strip = document.querySelector(".mw-menu-strip")?.getBoundingClientRect();
  const edge = document.querySelector(".mw-menu-edge")?.getBoundingClientRect();
  const content = document.querySelector(".mw-content")?.getBoundingClientRect();
  const first = document.querySelector(".em-table-scroll, .mw-content table")?.getBoundingClientRect();
  const more = document.querySelector("#desktop-more-panel");
  const moreBox = more && !more.hidden ? more.getBoundingClientRect() : null;
  const search = document.querySelector(".ppo-header-centre .ppo-global-search")?.getBoundingClientRect();
  const quick = document.querySelector(".ppo-header-centre .ppo-quick-add")?.getBoundingClientRect();
  const active = document.querySelector(".mw-menu li a[aria-current=page]");
  return {
    state: document.querySelector("[data-menu]")?.getAttribute("data-menu"),
    railRight: rail?.right ?? null,
    menuRight: menu?.right ?? null, menuWidth: menu?.width ?? null,
    menuFill: menu ? getComputedStyle(document.querySelector(".mw-menu:not([hidden])")).backgroundColor : null,
    activeFill: active ? getComputedStyle(active).backgroundColor : null,
    activeAccent: active ? getComputedStyle(active, "::before").content : null,
    stripWidth: strip?.width ?? null, stripRight: strip?.right ?? null,
    edgeLeft: edge?.left ?? null, edgeWidth: edge?.width ?? null,
    contentLeft: content?.left ?? null, tableLeft: first?.left ?? null,
    moreRight: moreBox?.right ?? null,
    groupCentre: search && quick ? (Math.min(search.left, quick.left) + Math.max(search.right, quick.right)) / 2 : null,
    crumbs: [...document.querySelectorAll(".ppo-crumbs li")].map(li => `${li.textContent}${getComputedStyle(li).display === "none" ? " [hidden]" : ""}`),
  };
});
const log = async (what) => console.log(what, JSON.stringify(await read()));
// Each workspace remembers its own default, so start from a known state.
if ((await read()).state === "collapsed") {
  await page.getByRole("button", { name: /^Expand .* menu$/ }).click();
  await page.waitForTimeout(600);
}
await log("expanded      ");
await page.getByRole("button", { name: /^Collapse .* menu$/ }).click();
await page.waitForTimeout(500);
await log("collapsed     ");
await page.getByRole("button", { name: "More", exact: true }).click();
await page.waitForTimeout(400);
await log("collapsed+More");
await page.keyboard.press("Escape");
await page.waitForTimeout(300);
await page.getByRole("button", { name: /^Expand .* menu$/ }).click();
await page.waitForTimeout(500);
await page.getByRole("button", { name: "More", exact: true }).click();
await page.waitForTimeout(400);
await log("expanded+More ");
await page.keyboard.press("Escape");
await page.waitForTimeout(300);
await log("after More    ");
await browser.close();
