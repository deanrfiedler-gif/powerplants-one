import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { chromium } from "playwright";
import { escapeHtml as e, rendererVersion } from "../documents/render";
import { digest } from "../documents/store";
import { canonical } from "../platform/operations";
export type FinanceOutput = {
  reference: string;
  work_reference: string;
  status: string;
  revision: number;
  company_id: string;
  customer: string;
  site: string;
  account: string;
  currency: string;
  mode: string;
  source_hash: string;
  review_id: string;
  reconciliation_id: string;
  treatment_basis: string;
  remaining_work_basis: string;
  reconciliation_basis: string;
  definition: unknown;
  corrections: unknown;
  lines: {
    id: string;
    entry_id: string;
    entry_version: number;
    captured_quantity: string;
    reviewed_quantity: string;
    allocated_quantity: string;
    billable_quantity: string;
    uom: string;
    direction: string;
    disposition: string;
    reason: string;
    target_group: string | null;
  }[];
  source_manifest: unknown;
  target_evidence: unknown;
  no_posting: unknown;
};
export type ReservedOutput = {
  issue_id: string;
  prepared_at: string;
  template_hash: string;
};
export async function currentFinanceTemplate() {
  const sources = [];
  const bytes = await Promise.all([
    readFile(join(process.cwd(), "src/finance/render.ts")),
    readFile(join(process.cwd(), "src/documents/render.ts")),
  ]);
  for (const [path, b] of [
    ["src/finance/render.ts", bytes[0]],
    ["src/documents/render.ts", bytes[1]],
  ] as const) {
    sources.push({ path, sha256: digest(b), byte_count: b.length });
  }
  return canonical({
    definition:
      "PPO OUT-14 Finance A4 v1; current scoped Finance; exact synthetic quantity and target evidence; no customer distribution",
    sources,
  });
}
export function financeHtml(s: FinanceOutput, o: ReservedOutput) {
  const literal = (v: unknown) => e(JSON.stringify(v, null, 2));
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>${e(s.reference)} Finance evidence</title><style>
  *{box-sizing:border-box}body{font:11px/1.55 Roboto,Verdana,sans-serif;color:#242a37;margin:0}h1{font-size:29px;line-height:1.15;margin:12px 0}h2{font-size:17px;border-top:3px solid #62bb46;padding-top:12px;margin-top:28px;break-after:avoid}p,td,dd,pre{overflow-wrap:anywhere}p{white-space:pre-wrap}.eyebrow{letter-spacing:.09em;font-weight:bold;text-transform:uppercase}.notice{background:#eef7ea;padding:12px;border-left:4px solid #62bb46}dl{display:grid;grid-template-columns:115px 1fr;gap:6px 12px}dt{font-weight:bold}dd{margin:0}table{border-collapse:collapse;width:100%;table-layout:fixed}th,td{padding:8px 5px;border-bottom:1px solid #ccd2da;text-align:left;vertical-align:top}th{background:#eef0f3;font-size:9px}thead{display:table-header-group}tr{break-inside:avoid}pre{white-space:pre-wrap;font:9px/1.5 monospace;orphans:4;widows:4}small{font-size:9px}.appendix{break-before:page}.appendix+.appendix{break-before:auto}.compact-fact{break-inside:avoid}</style></head><body>
  <div class="eyebrow">Powerplants One · Finance · OUT-14</div><h1>Finance handoff evidence</h1><p class="notice"><strong>Synthetic prototype — not for operational use</strong><br>Restricted to currently authorised Finance. Prepared bytes are released only after the exact source recheck. No live ERP transaction or customer distribution.</p>
  <dl><dt>Handoff</dt><dd>${e(s.reference)} · revision ${s.revision}</dd><dt>Work order</dt><dd>${e(s.work_reference)}</dd><dt>Customer / site</dt><dd>${e(s.customer)} · ${e(s.site)}</dd><dt>Legal company</dt><dd>${e(s.company_id)}</dd><dt>Account / currency</dt><dd>${e(s.account)} · ${e(s.currency)}</dd><dt>Mode / state</dt><dd>${e(s.mode)} · ${e(s.status)}</dd><dt>Prepared (UTC)</dt><dd>${e(o.prepared_at)}</dd><dt>Reserved issue</dt><dd>${e(o.issue_id)}</dd></dl>
  <h2>Reviewed treatment</h2><p>${e(s.treatment_basis)}</p><h2>Remaining work and dependencies</h2><p>${e(s.remaining_work_basis)}</p>
  <h2>Exact source quantities and allocations</h2><table><thead><tr><th style="width:26%">Source / disposition</th><th>Captured</th><th>Reviewed</th><th>Allocated</th><th>Billable</th><th>Unit / direction</th></tr></thead><tbody>${s.lines.map((l) => `<tr><td>${e(l.entry_id)}<br>v${l.entry_version} · ${e(l.disposition)}</td><td>${e(l.captured_quantity)}</td><td>${e(l.reviewed_quantity)}</td><td>${e(l.allocated_quantity)}</td><td>${e(l.billable_quantity ?? "Unknown")}</td><td>${e(l.uom)}<br>${e(l.direction)}</td></tr><tr><td colspan="6"><small>Allocation ${e(l.id)} · target group ${e(l.target_group ?? "No posting")}<br>${e(l.reason)}</small></td></tr>`).join("")}</tbody></table>
  <h2>Reconciliation</h2><p>${e(s.reconciliation_basis)}</p><p>Captured, reviewed, allocated, billable and posted quantities remain separate facts. Like-unit fixture comparisons use exact equality. No tax, price, stock, payroll or operational charging policy is inferred.</p>
  <div class="appendix"><h2>Authoritative synthetic target evidence</h2><pre>${literal(s.target_evidence)}</pre><div class="compact-fact"><h2>Reviewed no-posting dispositions</h2><pre>${literal(s.no_posting)}</pre></div></div>
  <div class="appendix"><h2>Exact source and review manifest</h2><dl><dt>Source SHA-256</dt><dd>${e(s.source_hash)}</dd><dt>Finance review</dt><dd>${e(s.review_id)}</dd><dt>Reconciliation</dt><dd>${e(s.reconciliation_id)}</dd><dt>Template SHA-256</dt><dd>${e(o.template_hash)}</dd></dl><pre>${literal(s.source_manifest)}</pre><h2>Reviewed definition and policy</h2><pre>${literal(s.definition)}</pre><h2>Linked correction requests at preparation</h2><pre>${literal(s.corrections)}</pre></div></body></html>`;
}
export async function renderFinance(s: FinanceOutput, o: ReservedOutput) {
  const html = financeHtml(s, o),
    browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    await page.route("**/*", (r) => r.abort());
    await page.setContent(html, { waitUntil: "load" });
    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      tagged: true,
      outline: true,
      displayHeaderFooter: true,
      margin: { top: "20mm", right: "15mm", bottom: "22mm", left: "15mm" },
      headerTemplate: `<div style="font:8px/1.5 Verdana;color:#242a37;margin:0 15mm">${e(s.reference)} · ${e(s.work_reference)} · Restricted synthetic Finance evidence<br>${e(s.customer.length > 65 ? s.customer.slice(0, 65) + "…" : s.customer)} · ${e(s.site.length > 65 ? s.site.slice(0, 65) + "…" : s.site)}</div>`,
      footerTemplate: `<div style="font:8px Verdana;color:#242a37;margin:0 15mm">Synthetic · no customer distribution · <span class="pageNumber"></span> / <span class="totalPages"></span></div>`,
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
