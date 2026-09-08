import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { chromium } from "playwright";
import {
  packHtml,
  renderPack,
  escapeHtml,
  rendererVersion,
  type PackSnapshot,
} from "./render";
import { reportHtml, renderReport } from "../reports/render";
import { financeHtml, renderFinance } from "../finance/render";
import { proofEvent } from "../platform/proof-diagnostics";

async function branded(html: string) {
  const [font, logo] = await Promise.all([
    readFile(join(process.cwd(), "public/brand/Roboto-variable.woff")),
    readFile(
      join(process.cwd(), "public/brand/powerplants-logo-green-white.png"),
    ),
  ]);
  const style = `@font-face{font-family:'PPO Roboto';src:url(data:font/woff;base64,${font.toString("base64")}) format('woff');font-weight:100 900;font-style:normal;font-display:block}body{font-family:'PPO Roboto',Roboto,Verdana,sans-serif;color:#242a37}h1,h2,h3,a,.classification,.source{color:#242a37}header,h2,.notes{border-color:#62bb46}.p11-brand{display:inline-flex;background:#242a37;padding:16px;margin:0 0 12px;break-inside:avoid}.p11-brand img{display:block;width:88px;height:88px;object-fit:contain}@media print{.p11-brand{padding:4mm}.p11-brand img{width:24mm;height:24mm}}`;
  const mark = `<div class="p11-brand"><img src="data:image/png;base64,${logo.toString("base64")}" alt="Powerplants" width="88" height="88"></div>`;
  if (!html.includes("</style>") || !html.includes("<body>"))
    throw Error("Unsupported original HTML structure");
  const prepared = html
    .replace("</style>", style + "</style>")
    .replace(
      "</head>",
      '<meta name="ppo-output-template" content="P11 version 2"></head>',
    );
  return prepared.includes("<header>")
    ? prepared.replace("<header>", "<header>" + mark)
    : prepared.replace("<body>", "<body>" + mark);
}
async function renderBranded(html: string, reference: string, context: string) {
  const renderAt = Date.now();
  const stage = (event: string) => proofEvent(`render-${event}`, { render_at_ms: renderAt, elapsed_ms: Date.now() - renderAt });
  stage("launch-start");
  const browser = await chromium.launch();
  stage("launch-complete");
  try {
    const page = await browser.newPage();
    stage("page-created");
    await page.route("**/*", (r) => r.abort());
    await page.setContent(html, { waitUntil: "load" });
    stage("content-loaded");
    await page.evaluate(() => document.fonts.ready);
    if (!(await page.evaluate(() => document.fonts.check('16px "PPO Roboto"'))))
      throw Error("Complete output font did not load");
    stage("fonts-ready");
    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      tagged: true,
      outline: true,
      displayHeaderFooter: true,
      margin: { top: "22mm", right: "15mm", bottom: "22mm", left: "15mm" },
      headerTemplate: `<div style="font:8px Verdana,sans-serif;color:#242a37;width:100%;margin:0 15mm;overflow-wrap:anywhere">${escapeHtml(reference)} · ${escapeHtml(context)}</div>`,
      footerTemplate:
        '<div style="font:8px Verdana,sans-serif;color:#242a37;width:100%;margin:0 15mm">Synthetic prototype — not for operational use · <span class="pageNumber"></span> / <span class="totalPages"></span></div>',
    });
    if (!pdf.subarray(0, 5).equals(Buffer.from("%PDF-")))
      throw Error("Invalid PDF");
    stage("pdf-complete");
    return {
      html,
      pdf,
      browser_version: browser.version(),
      renderer_version: rendererVersion,
    };
  } finally {
    stage("close-start");
    await browser.close();
    stage("close-complete");
  }
}
export async function supportedPackHtml(
  s: PackSnapshot,
  output?: Parameters<typeof packHtml>[1],
) {
  const html = packHtml(s, output);
  if (s.template.version === 1) return html;
  if (s.template.version !== 2) throw Error("Unsupported pack template");
  return branded(html);
}
export async function supportedRenderPack(
  s: PackSnapshot,
  output: Parameters<typeof renderPack>[1],
) {
  if (s.template.version === 1) return renderPack(s, output);
  return renderBranded(
    await supportedPackHtml(s, output),
    s.pack_reference,
    `${s.customer.name} · ${s.site.name} · ${s.work.reference}`,
  );
}
export async function supportedReportHtml(
  s: Parameters<typeof reportHtml>[0],
  output: Parameters<typeof reportHtml>[1],
  version: number,
) {
  const html = reportHtml(s, output);
  if (version === 1) return html;
  if (version !== 2) throw Error("Unsupported report template");
  return branded(html);
}
export async function supportedRenderReport(
  s: Parameters<typeof renderReport>[0],
  output: Parameters<typeof renderReport>[1],
  version: number,
) {
  if (version === 1) return renderReport(s, output);
  return renderBranded(
    await supportedReportHtml(s, output, version),
    s.reference,
    `${s.customer.name} · ${s.site.name} · ${s.work.reference}`,
  );
}
export async function supportedFinanceHtml(
  s: Parameters<typeof financeHtml>[0],
  output: Parameters<typeof financeHtml>[1],
  version: number,
) {
  const html = financeHtml(s, output);
  if (version === 1) return html;
  if (version !== 2) throw Error("Unsupported Finance template");
  return branded(html);
}
export async function supportedRenderFinance(
  s: Parameters<typeof renderFinance>[0],
  output: Parameters<typeof renderFinance>[1],
  version: number,
) {
  if (version === 1) return renderFinance(s, output);
  return renderBranded(
    await supportedFinanceHtml(s, output, version),
    s.reference,
    `${s.work_reference} · Restricted synthetic Finance evidence`,
  );
}
