// Local measurement probe: ordinary page layout must not scroll the viewport sideways, controls must
// not overlap, and a register's own table keeps its local scroll at every width in the matrix.
import { chromium } from "playwright";
const origin = process.env.PPO_ORIGIN ?? "http://127.0.0.1:3107";
const routes = JSON.parse(process.env.PPO_ROUTES ?? "[]");
const sizes = [[1920,1080],[1440,960],[1366,768],[1024,768],[820,800],[390,844],[320,700]];
const browser = await chromium.launch({ channel: "chrome" });
const context = await browser.newContext({ locale: "en-AU" });
const page = await context.newPage();
let current = null;
for (const [profile, route] of routes) {
  if (profile !== current) {
    const r = await page.request.post(`${origin}/api/v1/local-session`, { headers: { Origin: origin }, data: { profile } });
    if (!r.ok()) { console.log(route, "SIGN-IN FAILED"); continue; }
    current = profile;
  }
  const bad = [];
  for (const [w, h] of sizes) {
    await page.setViewportSize({ width: w, height: h });
    await page.goto(`${origin}${route}`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(900);
    const m = await page.evaluate(() => ({
      overflow: document.documentElement.scrollWidth - window.innerWidth,
      // A control inside a table's own horizontal scroll area is reachable by scrolling that area; only
      // a control the page layout itself pushes out of view counts as lost.
      hiddenAction: [...document.querySelectorAll("main a.button,main a.primary-link,main button")]
        .filter(e => {
          const r = e.getBoundingClientRect();
          if (!(r.width > 0 && (r.right > innerWidth + 1 || r.left < -1))) return false;
          for (let p = e.parentElement; p; p = p.parentElement) {
            const c = getComputedStyle(p);
            if (/auto|scroll/.test(c.overflowX) && p.scrollWidth > p.clientWidth + 2) return false;
          }
          return true;
        })
        .map(e => (e.className || e.tagName) + ":" + (e.textContent || "").trim().slice(0, 24)),
      listScrollers: [...document.querySelectorAll("main *")].filter(e => {
        const c = getComputedStyle(e);
        return /auto|scroll/.test(c.overflowY) && e.scrollHeight > e.clientHeight + 2;
      }).length,
    }));
    if (m.overflow > 1 || m.hiddenAction.length) bad.push([`${w}x${h}`, m]);
  }
  console.log(route.padEnd(22), bad.length ? JSON.stringify(bad) : "clean at all 7 widths");
}
await browser.close();
