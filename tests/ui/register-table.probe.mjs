// Local measurement probe: for each register table, the gap between the table and its container's
// usable edge, any rounded frame around it, how many elements scroll the same list, and the row rhythm.
import { chromium } from "playwright";
const origin = process.env.PPO_ORIGIN ?? "http://127.0.0.1:3107";
const routes = JSON.parse(process.env.PPO_ROUTES ?? "[]");
const browser = await chromium.launch({ channel: "chrome" });
const page = await (await browser.newContext({ locale: "en-AU", viewport: { width: 1600, height: 1000 } })).newPage();
let current = null;
for (const [profile, route, selector] of routes) {
  if (profile !== current) {
    const r = await page.request.post(`${origin}/api/v1/local-session`, { headers: { Origin: origin }, data: { profile } });
    if (!r.ok()) { console.log(route, "SIGN-IN FAILED"); continue; }
    current = profile;
  }
  await page.goto(`${origin}${route}`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1400);
  const m = await page.evaluate((sel) => {
    const table = document.querySelector(sel);
    if (!table) return { missing: sel };
    const scroller = table.closest("div,section") ?? table.parentElement;
    const host = document.querySelector("main .business-content, .mw-content, main") ?? document.body;
    const s = getComputedStyle(scroller);
    const scrollers = [...document.querySelectorAll("main *")].filter(e => {
      const c = getComputedStyle(e);
      return /auto|scroll/.test(c.overflowY) && e.scrollHeight > e.clientHeight + 2;
    }).map(e => e.className || e.tagName);
    const row = table.querySelector("tbody tr");
    const cell = table.querySelector("tbody td,tbody th");
    return {
      tableLeft: Math.round(table.getBoundingClientRect().left),
      hostLeft: Math.round(host.getBoundingClientRect().left),
      tableRight: Math.round(table.getBoundingClientRect().right),
      hostRight: Math.round(host.getBoundingClientRect().right),
      frameBorder: s.borderTopWidth + " " + s.borderTopColor,
      frameRadius: s.borderRadius,
      frameMaxHeight: s.maxHeight,
      innerScrollers: scrollers,
      rowHeight: row ? Math.round(row.getBoundingClientRect().height) : null,
      cellFont: cell ? getComputedStyle(cell).fontSize : null,
      headFill: table.querySelector("thead th") ? getComputedStyle(table.querySelector("thead th")).backgroundColor : null,
      stacked: [...table.querySelectorAll("tbody td,tbody th")].filter(c => c.querySelectorAll("small,span,br,div").length > 1 && c.getBoundingClientRect().height > 44).length,
    };
  }, selector);
  console.log(route.padEnd(24), JSON.stringify(m));
}
await browser.close();
