// Capture the Powerplants One design-system kit from the running application (ADR-0051).
//
// Every preview's markup comes from a real page or the real component catalogue. bundle.css is every
// rule in the app's own stylesheets that applies to that markup, in the app's cascade order, as the
// browser parsed it. Font Awesome is blocked, so only the local fallback drawings are captured: the
// Pro licence forbids publishing Pro artwork (ADR-0050).
//
// Run from the repository root against a local server that serves the commit being synced:
//   PPO_KIT_REF=main@<sha> node scripts/design-system/capture-kit.mjs
// Output: tmp/design-kit/project/components/{bundle.css,<Part>/preview.html}, plus app captures in
// tmp/design-kit/app/ for the side-by-side check. See scripts/design-system/README.md.
import { chromium } from "playwright";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const ORIGIN = process.env.PPO_KIT_ORIGIN ?? "http://127.0.0.1:3000";
const REF = process.env.PPO_KIT_REF ?? `main@${execFileSync("git", ["rev-parse", "--short", "HEAD"]).toString().trim()}`;
const OUT = path.resolve("tmp/design-kit");
// The design system's upload of public/brand/powerplants-logo-green-white.png (same bytes).
const LOGO_BLOB = "/_blob/62e11753ca4265f5e970a8edaa145f16";
const cp = (component, state) => `/development/component-preview?component=${component}&state=${state}`;
const DESKTOP = { width: 1440, height: 900 };
const PHONE = { width: 390, height: 844 };

// The kit: only parts the app shares today. A part joins when it exists as a shared component.
const PARTS = [
  { name: "ApplicationShell", pages: [{ url: "/estimating", vp: DESKTOP, pick: "shell" }], card: { group: "Navigation", width: 1440, height: 640, subtitle: "Desktop rail, header and module navigation" }, bare: true },
  { name: "ApplicationShellPhone", pages: [{ url: "/estimating", vp: PHONE, pick: "shell" }], card: { group: "Navigation", width: 390, height: 640, subtitle: "Phone header, module navigation and bottom bar" }, bare: true },
  { name: "ModuleNavigation", pages: [{ url: "/estimating", vp: DESKTOP, pick: ".module-navigation" }], card: { group: "Navigation", width: 1200, height: 60, subtitle: "Module navigation row under the header" }, bare: true },
  { name: "PageHeader", pages: [{ url: "customer-record", vp: DESKTOP, pick: ".business-heading" }], card: { group: "Foundations", height: 110, subtitle: "Record page header" } },
  { name: "Button", pages: [{ url: cp("buttons", "default"), vp: DESKTOP, pick: "catalogue" }], card: { group: "Foundations", height: 150, subtitle: "Button and ButtonLink variants" } },
  { name: "Fields", pages: [{ url: cp("fields", "default"), vp: DESKTOP, pick: "catalogue" }], card: { group: "Forms", height: 640, subtitle: "Field, SelectField, date and LocalDateTimeField" } },
  { name: "Lookup", pages: [{ url: cp("lookup", "default"), vp: DESKTOP, pick: "catalogue" }], card: { group: "Forms", height: 200, subtitle: "LookupField" } },
  { name: "Validation", pages: [{ url: cp("validation", "invalid"), vp: DESKTOP, pick: "catalogue" }], card: { group: "Forms", height: 420, subtitle: "ErrorNotice and invalid fields" } },
  { name: "Status", pages: [{ url: cp("status", "default"), vp: DESKTOP, pick: "catalogue" }], card: { group: "Feedback", height: 96, subtitle: "Status chips by tone" } },
  { name: "ReadState", pages: ["loading", "empty", "error"].map((s) => ({ url: cp("read-state", s), vp: DESKTOP, pick: "catalogue" })), card: { group: "Feedback", height: 360, subtitle: "Loading, empty and error with retained details" } },
  { name: "Tabs", pages: [{ url: cp("tabs", "default"), vp: DESKTOP, pick: "catalogue" }], card: { group: "Navigation", height: 200, subtitle: "RecordTabs and RecordPanel" } },
  { name: "SegmentedControl", pages: [{ url: "/schedule", vp: DESKTOP, pick: ".view-switch" }], card: { group: "Navigation", height: 90, subtitle: "The planner's view switch (.view-switch) in a toolbar row" }, kitStyle: ".kit{display:flex;align-items:center;gap:12px}" },
];

// Runs in the page: the part's markup, without scripts, comments or live links.
function pickMarkup(pick) {
  const clean = (node) => {
    node.querySelectorAll("script,noscript,template,next-route-announcer").forEach((n) => n.remove());
    node.querySelectorAll("a[href]").forEach((a) => { if (!a.getAttribute("href").startsWith("#")) a.setAttribute("href", "#"); });
    node.querySelectorAll("form[action]").forEach((f) => f.removeAttribute("action"));
    const walker = document.createTreeWalker(node, NodeFilter.SHOW_COMMENT), comments = [];
    while (walker.nextNode()) comments.push(walker.currentNode);
    comments.forEach((c) => c.remove());
    return node;
  };
  if (pick === "shell") {
    const frame = document.querySelector(".app-frame").cloneNode(true);
    const main = frame.querySelector("main");
    if (main) main.replaceChildren();
    return { html: clean(frame).outerHTML, main: !!main };
  }
  if (pick === "catalogue") {
    // The catalogue's own frame (.catalogue-preview) is presentation, so only its example is kept.
    const box = document.querySelector("main .catalogue-preview").cloneNode(true);
    box.querySelectorAll(".catalogue-fixture-label").forEach((n) => n.remove());
    box.querySelectorAll("p[role=status]").forEach((n) => { if (!n.textContent.trim()) n.remove(); });
    return { html: clean(box).innerHTML };
  }
  const el = document.querySelector(pick);
  if (!el) return { html: "", missing: pick };
  return { html: clean(el.cloneNode(true)).outerHTML };
}

// Runs in the page after the body holds only the part: every applicable rule, hover and focus included.
function extractRules() {
  const DYN = /:(hover|focus-visible|focus-within|focus|active|visited|link|target)(?![\w-])/g;
  const NOT_DYN = /:not\(\s*(?::(?:hover|focus-visible|focus-within|focus|active|visited|link|target))+\s*\)/g;
  const PSEUDO_EL = /::?(before|after|placeholder|marker|selection|backdrop|first-line|first-letter|file-selector-button|-webkit-[\w-]+|-moz-[\w-]+)(?![\w-])/g;
  const root = document.documentElement;
  const split = (text) => {
    const out = [];
    let depth = 0, cur = "";
    for (const ch of text) {
      if (ch === "(" || ch === "[") depth++;
      else if (ch === ")" || ch === "]") depth--;
      if (ch === "," && depth === 0) { out.push(cur); cur = ""; } else cur += ch;
    }
    out.push(cur);
    return out.map((s) => s.trim()).filter(Boolean);
  };
  const applies = (selectorText) => split(selectorText).some((raw) => {
    const s = raw.replace(NOT_DYN, "").replace(PSEUDO_EL, "").replace(DYN, "").replace(/:(is|where)\(\s*\)/g, "").replace(/[>+~]\s*$/, "").trim();
    if (!s) return false;
    try { return root.matches(s) || !!document.querySelector(s); } catch { return false; }
  });
  const kept = [], other = [];
  [...document.styleSheets].forEach((sheet, si) => {
    let rules;
    try { rules = sheet.cssRules; } catch { return; }
    const href = sheet.href ? sheet.href.replace(location.origin, "") : "inline:" + si;
    const walk = (list, conds, trail) => [...list].forEach((r, i) => {
      const p = trail.concat(i);
      if (r instanceof CSSStyleRule) { if (applies(r.selectorText)) kept.push({ href, path: p, conds, text: r.cssText }); }
      else if (r instanceof CSSMediaRule) walk(r.cssRules, conds.concat("@media " + r.conditionText), p);
      else if (r instanceof CSSSupportsRule) walk(r.cssRules, conds.concat("@supports " + r.conditionText), p);
      else if (typeof CSSLayerBlockRule !== "undefined" && r instanceof CSSLayerBlockRule) walk(r.cssRules, conds.concat("@layer " + r.name), p);
      else if (typeof CSSContainerRule !== "undefined" && r instanceof CSSContainerRule) walk(r.cssRules, conds.concat("@container " + r.conditionText), p);
      else if (r instanceof CSSKeyframesRule) kept.push({ href, path: p, conds, text: r.cssText, keyframes: r.name });
      else if (!(r instanceof CSSFontFaceRule)) other.push({ href, type: r.constructor.name }); // fonts come from tokens.css
    });
    walk(rules, [], []);
  });
  return { kept, other };
}

async function newPage(browser, vp) {
  const context = await browser.newContext({ viewport: vp });
  const page = await context.newPage();
  const blocked = [];
  await page.route(/fontawesome/i, (r) => { blocked.push(r.request().url()); return r.abort(); });
  await page.goto(ORIGIN + "/work");
  const res = await page.request.post(ORIGIN + "/api/v1/local-session", { headers: { Origin: ORIGIN }, data: { profile: "coordinator" } });
  if (res.status() !== 200) throw new Error("local session " + res.status());
  return { context, page, blocked };
}

async function customerRecord(page) {
  await page.goto(ORIGIN + "/customers", { waitUntil: "networkidle" });
  const href = await page.evaluate(() => [...document.querySelectorAll("a[href^='/customers/']")].map((a) => a.getAttribute("href")).find((h) => /\/customers\/[0-9a-f-]{8,}/.test(h)));
  if (!href) throw new Error("no customer record link");
  return href;
}

function stylesheet(rules, sheetOrder) {
  const rank = (href) => (href.startsWith("inline") ? 1e6 : sheetOrder.indexOf(href));
  const cmp = (a, b) => rank(a.href) - rank(b.href) || a.path.reduce((d, v, i) => d || v - (b.path[i] ?? -1), 0) || a.path.length - b.path.length;
  let sorted = [...rules].sort(cmp);
  const styleText = sorted.filter((r) => !r.keyframes).map((r) => r.text).join("\n");
  sorted = sorted.filter((r) => !r.keyframes || new RegExp(`\\b${r.keyframes}\\b`).test(styleText));
  let css = `/* Powerplants One kit stylesheet, extracted from the running application at deanrfiedler-gif/powerplants-one@${REF.split("@").pop()}.\n` +
    "   Every rule in the app's own stylesheets that applies to a kit preview, in the app's cascade order, as the browser\n" +
    "   parsed it (hover and focus rules included). Fonts and tokens come from tokens.css. Regenerate; never edit by hand. */\n";
  const open = [];
  let currentSheet = null;
  const close = () => { while (open.length) { open.pop(); css += "}\n"; } };
  for (const r of sorted) {
    if (r.href !== currentSheet) {
      close();
      currentSheet = r.href;
      css += `\n/* ${r.href.startsWith("inline") ? "inline style" : rank(r.href) === 0 ? "application stylesheets (src/app/layout.tsx imports)" : "route stylesheet " + r.href.split("/").pop()} */\n`;
    }
    let same = 0;
    while (same < open.length && same < r.conds.length && open[same] === r.conds[same]) same++;
    while (open.length > same) { open.pop(); css += "}\n"; }
    for (const c of r.conds.slice(same)) { open.push(c); css += c + " {\n"; }
    css += r.text + "\n";
  }
  close();
  return { css, count: sorted.length, sheets: Object.fromEntries(sheetOrder.map((h) => [h, sorted.filter((r) => r.href === h).length])) };
}

function preview(part, bodies) {
  let body = bodies.join(part.bare ? "\n" : '\n<hr class="kit-gap">\n');
  body = body.replace(/src="\/brand\/powerplants-logo-green-white\.png"/g, `src="${LOGO_BLOB}"`);
  const { group, width, height, subtitle } = part.card;
  const marker = `<!-- @dsCard group="${group}"${width ? ` width=${width}` : ""} height=${height} subtitle="${subtitle}, captured from the running app at ${REF}" -->`;
  const style = part.bare
    ? "html,body{margin:0;background:var(--paper)}"
    : "html,body{background:var(--white)}\n.kit{padding:16px;background:var(--white)}\n.kit-gap{border:0;height:24px;margin:0}" + (part.kitStyle ? "\n" + part.kitStyle : "");
  return `${marker}\n<!doctype html>\n<html><head><style>\n${style}\n</style></head><body>\n${part.bare ? body : `<div class="kit">\n${body}\n</div>`}\n</body></html>\n`;
}

const browser = await chromium.launch();
const kept = new Map(), sheetOrder = [], report = { ref: REF, origin: ORIGIN, parts: {}, other: [], blockedFontAwesome: 0 };
fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(path.join(OUT, "app"), { recursive: true });
try {
  for (const part of PARTS) {
    const bodies = [];
    for (const [n, source] of part.pages.entries()) {
      const { context, page, blocked } = await newPage(browser, source.vp);
      const url = source.url === "customer-record" ? await customerRecord(page) : source.url;
      const res = await page.goto(ORIGIN + url, { waitUntil: "networkidle" });
      await page.waitForTimeout(1200);
      const picked = await page.evaluate(pickMarkup, source.pick);
      if (!picked.html) throw new Error(`${part.name}: nothing matched ${source.pick} on ${url}`);
      const shot = path.join(OUT, "app", `${part.name}${part.pages.length > 1 ? "-" + n : ""}.png`);
      if (source.pick === "shell") await page.screenshot({ path: shot });
      else if (source.pick === "catalogue") await page.locator("main .catalogue-preview").screenshot({ path: shot });
      else await page.locator(source.pick).first().screenshot({ path: shot });
      // Match rules against the part alone, as the design system's preview frame holds it.
      await page.evaluate((html) => { document.body.innerHTML = html; }, picked.html);
      const found = await page.evaluate(extractRules);
      const artwork = await page.evaluate(() => document.querySelectorAll("svg.svg-inline--fa, [data-prefix]").length);
      if (artwork) throw new Error(`${part.name}: Font Awesome artwork in the capture`);
      for (const rule of found.kept) {
        if (!sheetOrder.includes(rule.href)) sheetOrder.push(rule.href);
        const key = rule.href + "|" + rule.path.join(".");
        if (!kept.has(key)) kept.set(key, rule);
      }
      found.other.forEach((o) => { if (!report.other.some((x) => x.type === o.type && x.href === o.href)) report.other.push(o); });
      report.blockedFontAwesome += blocked.length;
      report.parts[part.name + (part.pages.length > 1 ? "#" + n : "")] = { url, status: res.status(), rules: found.kept.length, bytes: picked.html.length };
      bodies.push(picked.html);
      await context.close();
    }
    fs.mkdirSync(path.join(OUT, "project/components", part.name), { recursive: true });
    fs.writeFileSync(path.join(OUT, "project/components", part.name, "preview.html"), preview(part, bodies));
  }
} finally {
  await browser.close();
}
const { css, count, sheets } = stylesheet(kept.values(), sheetOrder);
fs.writeFileSync(path.join(OUT, "project/components/bundle.css"), css);
Object.assign(report, { rules: count, bundleBytes: Buffer.byteLength(css), byStylesheet: sheets, urls: [...new Set(css.match(/url\([^)]*\)/g) ?? [])] });
fs.writeFileSync(path.join(OUT, "report.json"), JSON.stringify(report, null, 1));
console.log(JSON.stringify({ ref: REF, rules: count, bytes: report.bundleBytes, byStylesheet: sheets, urls: report.urls, blockedFontAwesome: report.blockedFontAwesome }, null, 1));
