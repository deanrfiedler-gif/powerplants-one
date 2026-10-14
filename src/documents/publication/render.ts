import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { launchDocumentBrowser } from "../../platform/browser";
import { AppError } from "../../platform/errors";
import {
  escapeHtml as e,
  packHtml,
  rendererVersion,
  type PackSnapshot,
} from "../render";
import {
  supportedPackHtml as legacyHtml,
  supportedRenderPack as legacyRender,
} from "../p11-render";
import { digest } from "../store";
import { parseDefinition, supportedTemplateDefinition } from "./definition";
type Snapshot = PackSnapshot & {
  template: PackSnapshot["template"] & { definition?: string };
};
export async function supportedPackHtml(
  s: Snapshot,
  output?: { prepared_at: string; issue_id: string },
) {
  if (s.template.version < 3) return legacyHtml(s, output);
  const retained = s.template.definition;
  if (
    !retained ||
    digest(retained) !== s.template.hash ||
    (await supportedTemplateDefinition(
      "OUT-09",
      s.template.version,
      retained,
    )) !== retained ||
    s.template.renderer_version !== rendererVersion
  )
    throw new AppError(
      409,
      "StaleTemplate",
      "The exact published definition and renderer dependencies are required.",
    );
  const { body } = parseDefinition(retained);
  // Explicit projection only; no dynamic paths, expressions, markup or URLs.
  const values: Record<string, string> = {
    "site.name": s.site.name,
    "customer.name": s.customer.name,
    "work.reference": s.work.reference,
    "appointment.start_at": s.appointment.start_at,
  };
  const fields = body.fields
    .map((f) => {
      const value = values[f.binding];
      if (f.required && (typeof value !== "string" || !value.trim()))
        throw new AppError(
          422,
          "TemplateSourceMissing",
          "A required published source value is unavailable.",
        );
      return `<div><dt>${e(f.label)}</dt><dd>${e(value || "Not recorded")}</dd></div>`;
    })
    .join("");
  const [font, logo] = await Promise.all([
    readFile(join(process.cwd(), "public/brand/Roboto-variable.woff")),
    readFile(
      join(process.cwd(), "public/brand/powerplants-logo-green-white.png"),
    ),
  ]);
  const style = `@font-face{font-family:'PPO Roboto';src:url(data:font/woff;base64,${font.toString("base64")}) format('woff');font-weight:100 900}body{font-family:'PPO Roboto',Verdana,sans-serif}.template-fields{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px}.template-fields dt{font-weight:bold}.template-fields dd{margin:0;overflow-wrap:anywhere}.template-brand{background:#242a37;padding:12px;width:88px;height:88px}`;
  return packHtml(s, output)
    .replace("</style>", style + "</style>")
    .replace(
      "<h1>Technician job pack</h1>",
      `<img class="template-brand" src="data:image/png;base64,${logo.toString("base64")}" alt="Powerplants" width="88" height="88"><h1>${e(body.title)}</h1><dl class="template-fields">${fields}</dl>`,
    )
    .replace(
      "</head>",
      '<meta name="ppo-output-template" content="DK06-OUT09-1"></head>',
    );
}
export async function supportedRenderPack(
  s: Snapshot,
  output: { prepared_at: string; issue_id: string },
) {
  if (s.template.version < 3) return legacyRender(s, output);
  const html = await supportedPackHtml(s, output),
    browser = await launchDocumentBrowser();
  try {
    const page = await browser.newPage();
    await page.route("**/*", (r) => r.abort());
    await page.setContent(html, { waitUntil: "load" });
    await page.evaluate(() => document.fonts.ready);
    if (!(await page.evaluate(() => document.fonts.check('16px "PPO Roboto"'))))
      throw Error("Output font did not load");
    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      tagged: true,
      outline: true,
      displayHeaderFooter: true,
      margin: { top: "22mm", right: "15mm", bottom: "22mm", left: "15mm" },
      headerTemplate: `<div style="font:8px Verdana;margin:0 15mm">${e(s.pack_reference)} · ${e(s.site.name)}</div>`,
      footerTemplate:
        '<div style="font:8px Verdana;margin:0 15mm">Synthetic prototype — not for operational use · <span class="pageNumber"></span> / <span class="totalPages"></span></div>',
    });
    if (!pdf.subarray(0, 5).equals(Buffer.from("%PDF-")))
      throw Error("Invalid PDF");
    return {
      html,
      pdf,
      browser_version: browser.version(),
      renderer_version: rendererVersion,
    };
  } finally {
    await browser.close();
  }
}
