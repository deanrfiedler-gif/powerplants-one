import { chromium } from "playwright";
import { canonical } from "../platform/operations";
import { digest } from "./store";
import { sectionKeys, sectionLabels, type SectionKey } from "./validation";
export const rendererVersion = "playwright-1.63.0";
export const templateDefinition =
  "PPO OUT-09 semantic HTML/A4 v1; nine sections; navy/green; escaped plain text; all sections mandatory; no external requests; tagged PDF requested; no PDF/UA claim.";
export type PackSnapshot = {
  schema_version: 1;
  synthetic: true;
  pack_reference: string;
  revision: number;
  appointment: {
    id: string;
    reference: string;
    version: number;
    schedule_version: number;
    assignment_version: number;
    start_at: string;
    end_at: string;
    timezone: string;
    booking_hash: string;
  };
  work: {
    id: string;
    reference: string;
    version: number;
    scope_id: string;
    scope_version: number;
    scope_hash: string;
  };
  site: { id: string; version: number; name: string };
  customer: { id: string; version: number; name: string };
  template: {
    id: string;
    version: number;
    hash: string;
    policy_version: number;
    renderer_version: string;
  };
  recipients: {
    assignment_id: string;
    assignment_version: number;
    resource_id: string;
    user_id: string;
    name: string;
    role: string;
  }[];
  sources: {
    id: string;
    title: string;
    item_id: string;
    version_id: string;
    hash: string;
    byte_count: number;
    text: string;
    location_version: number;
  }[];
  history: { id: string; hash: string }[];
  evidence: { id: string; hash: string }[];
  sections: Record<
    SectionKey,
    { text: string; notes: string; source_ids: string[] }
  >;
};
export const escapeHtml = (x: unknown) =>
  String(x ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ]!,
  );
export function packHtml(
  s: PackSnapshot,
  output?: { prepared_at: string; issue_id: string },
) {
  const e = escapeHtml,
    revision = `r${String(s.revision).padStart(2, "0")}`;
  return `<!doctype html><html lang="en-AU"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${e(s.pack_reference)} ${revision} — Job pack</title><style>
 :root{color-scheme:light}*{box-sizing:border-box}body{margin:0;color:#183344;background:#fff;font:16px/1.55 Verdana,Arial,sans-serif}main{max-width:1000px;margin:auto;padding:28px}header{border-top:8px solid #207354;border-bottom:1px solid #b6c9cb;padding:18px 0}h1{font-size:30px;margin:6px 0;color:#123448}h2{font-size:21px;line-height:1.3;color:#123448;border-bottom:2px solid #207354;padding-bottom:7px;margin:30px 0 12px;break-after:avoid}p{margin:8px 0;overflow-wrap:anywhere}.classification{font-weight:bold;color:#14593f}.meta{font-size:13px}.text{white-space:pre-wrap;overflow-wrap:anywhere}section{break-inside:auto}.notes{border-left:3px solid #207354;padding-left:12px}.source{font-size:13px;color:#365563}a{color:#14593f}nav ol{padding-left:24px}footer{margin-top:30px;border-top:1px solid #b6c9cb;padding-top:12px;font-size:12px}h3{break-after:avoid;font-size:16px} @media(max-width:500px){main{padding:16px}h1{font-size:25px}h2{font-size:19px}} @media print{body{font-size:10.5pt;line-height:1.45}main{padding:0}h1{font-size:23pt}h2{font-size:14pt;margin-top:20pt}nav{display:none}p{orphans:3;widows:3}.meta,.source{font-size:9pt}footer{font-size:8pt}}
 </style></head><body><main><header><p class="classification">Synthetic prototype — not for operational use</p><p>POWERPLANTS ONE · SERVICE OPERATIONS</p><h1>Technician job pack</h1><p><strong>${e(s.pack_reference)} · ${revision}</strong></p><p>${e(s.customer.name)} · ${e(s.site.name)}</p><p class="meta">Work ${e(s.work.reference)} · Appointment ${e(s.appointment.reference)} · ${e(s.appointment.timezone)}</p><p class="meta">${output ? `Output prepared ${e(output.prepared_at)} · Issue reference ${e(output.issue_id)}. Issue status and issue time are recorded separately in the application.` : "Preparation preview — not issued"}</p></header>
 <nav aria-label="Pack contents"><ol>${sectionKeys.map((k, i) => `<li><a href="#${k}">${sectionLabels[i]}</a></li>`).join("")}</ol></nav>
 ${sectionKeys.map((k, i) => `<section aria-labelledby="${k}"><h2 id="${k}">${i + 1}. ${sectionLabels[i]}</h2><p class="text">${e(s.sections[k].text)}</p><p class="text notes">${e(s.sections[k].notes)}</p>${s.sections[k].source_ids.length ? `<p class="source">Source records: ${s.sections[k].source_ids.map(e).join("; ")}</p>` : ""}</section>`).join("")}
 <footer><p>Exact reviewed source snapshot: ${digest(canonical(s))}</p><p>Template version ${s.template.version} · ${e(s.template.hash)}. PDF tagging is requested; PDF/UA conformance is not verified. Use the HTML view for navigation and adaptable text.</p><p>Read the current applicability and individual acknowledgement status in Powerplants One. Opening this file does not acknowledge it or authorise attendance.</p></footer></main></body></html>`;
}
export async function renderPack(
  s: PackSnapshot,
  output: { prepared_at: string; issue_id: string },
) {
  const html = packHtml(s, output);
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    await page.route("**/*", (route) => route.abort());
    await page.setContent(html, { waitUntil: "load" });
    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      tagged: true,
      outline: true,
      displayHeaderFooter: true,
      margin: { top: "20mm", right: "15mm", bottom: "22mm", left: "15mm" },
      headerTemplate: `<div style="font:8px Verdana;width:100%;margin:0 15mm;color:#183344">${escapeHtml(s.customer.name)} · ${escapeHtml(s.site.name)} · ${escapeHtml(s.work.reference)}</div>`,
      footerTemplate: `<div style="font:8px Verdana;width:100%;margin:0 15mm;color:#183344">Synthetic prototype — not for operational use · ${escapeHtml(s.pack_reference)} r${String(s.revision).padStart(2, "0")} · <span class="pageNumber"></span> / <span class="totalPages"></span></div>`,
    });
    if (!pdf.subarray(0, 5).equals(Buffer.from("%PDF-")))
      throw Error("Invalid rendered PDF");
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
