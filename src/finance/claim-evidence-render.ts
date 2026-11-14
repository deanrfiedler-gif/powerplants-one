import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { launchDocumentBrowser } from "../platform/browser";
import { escapeHtml as e, rendererVersion } from "../documents/render";
import type { ReservedOutput } from "./render";

export type ClaimEvidence = {
  source_kind: "ProjectClaim" | "AgreementCharge";
  reference: string;
  source_reference: string;
  revision: number;
  company_id: string;
  customer_id: string;
  account: string;
  currency: string;
  tax_basis: string;
  mode: string;
  source_hash: string;
  review_id: string;
  reconciliation_id: string;
  treatment_basis: string;
  reconciliation_basis: string;
  total: string;
  lines: {
    id: string;
    kind: string;
    entitlement_id: string;
    amount: string;
    due_date: string | null;
    evidence: unknown;
  }[];
  source_manifest: unknown;
  definition: unknown;
  review: unknown;
  reconciliation: unknown;
  target_evidence: unknown;
  corrections: unknown;
};
export function isClaimEvidence(s: object): s is ClaimEvidence {
  return (
    "source_kind" in s &&
    (s.source_kind === "ProjectClaim" || s.source_kind === "AgreementCharge")
  );
}
export async function claimEvidenceHtml(s: ClaimEvidence, o: ReservedOutput) {
  const [font, logo] = await Promise.all([
    readFile(join(process.cwd(), "public/brand/Roboto-variable.woff")),
    readFile(
      join(process.cwd(), "public/brand/powerplants-logo-green-white.png"),
    ),
  ]);
  const literal = (v: unknown) => e(JSON.stringify(v, null, 2));
  const title =
    s.source_kind === "ProjectClaim"
      ? "Project claim evidence"
      : "Agreement charge evidence";
  return `<!doctype html><html lang="en-AU"><head><meta charset="utf-8"><title>${e(s.reference)} ${title}</title><style>
@font-face{font-family:'PPO Roboto';src:url(data:font/woff;base64,${font.toString("base64")}) format('woff');font-weight:100 900;font-display:block}
*{box-sizing:border-box}body{font:11px/1.55 'PPO Roboto',Roboto,Verdana,sans-serif;color:#242a37;margin:0}h1{font-size:29px;line-height:1.15}h2{font-size:17px;border-top:3px solid #62bb46;padding-top:12px;margin-top:28px;break-after:avoid}p,td,dd,pre{overflow-wrap:anywhere}p{white-space:pre-wrap}.brand{display:inline-flex;background:#242a37;padding:16px}.brand img{width:88px;height:88px;object-fit:contain}.notice{background:#eef7ea;padding:12px;border-left:4px solid #62bb46}dl{display:grid;grid-template-columns:125px 1fr;gap:6px 12px}dt{font-weight:bold}dd{margin:0}table{border-collapse:collapse;width:100%;table-layout:fixed}th,td{padding:8px 5px;border-bottom:1px solid #ccd2da;text-align:left;vertical-align:top}th{background:#eef0f3}thead{display:table-header-group}tr{break-inside:avoid}pre{white-space:pre-wrap;font:9px/1.5 monospace;orphans:4;widows:4}.appendix{break-before:page}.amount{text-align:right;font-variant-numeric:tabular-nums}small{font-size:9px}</style></head><body>
<header><div class="brand"><img alt="Powerplants" src="data:image/png;base64,${logo.toString("base64")}"></div><p>Powerplants One · Finance · OUT-14</p><h1>${title}</h1></header>
<p class="notice"><strong>Synthetic prototype — not for operational use</strong><br>Restricted Finance supporting evidence. This is not an invoice, a customer payment demand, revenue or cash evidence. MYOB retains accounting document authority. No customer distribution.</p>
<dl><dt>Handoff</dt><dd>${e(s.reference)} · revision ${s.revision}</dd><dt>${s.source_kind === "ProjectClaim" ? "Project" : "Agreement"}</dt><dd>${e(s.source_reference)}</dd><dt>Customer identity</dt><dd>${e(s.customer_id)}</dd><dt>Legal company</dt><dd>${e(s.company_id)}</dd><dt>Account / currency</dt><dd>${e(s.account)} · ${e(s.currency)}</dd><dt>Recorded tax basis</dt><dd>${e(s.tax_basis)} — no tax calculated</dd><dt>Mode / state</dt><dd>${e(s.mode)} · Reconciled</dd><dt>Prepared (UTC)</dt><dd>${e(o.prepared_at)}</dd><dt>Reserved issue</dt><dd>${e(o.issue_id)}</dd></dl>
<h2>Exact reconciled entitlements</h2><table><thead><tr><th style="width:65%">Entitlement / source identity</th><th>Due date</th><th class="amount">Amount ${e(s.currency)}</th></tr></thead><tbody>${s.lines.map((l) => `<tr><td>${e(l.kind)} · ${e(l.entitlement_id)}<br><small>Allocation ${e(l.id)}</small></td><td>${e(l.due_date ?? "Not applicable")}</td><td class="amount">${e(l.amount)}</td></tr>`).join("")}</tbody></table><p class="amount"><strong>Total ${e(s.currency)} ${e(s.total)}</strong></p><p>Each row is one whole monetary entitlement. Amounts are exact recorded amounts; no quantity, tax, discount, retention or exchange-rate calculation is inferred. Project milestones and variations are separate from agreement charges. Covered service quantities are separate cost evidence.</p>
<h2>Reviewed treatment</h2><p>${e(s.treatment_basis)}</p><h2>Reconciliation</h2><p>${e(s.reconciliation_basis)}</p><p>Processed per recorded synthetic ERP outcome. This document records the reconciled historical basis; later project closure or agreement changes do not rewrite it.</p>
<div class="appendix"><h2>Recorded synthetic processing outcome</h2><pre>${literal(s.target_evidence)}</pre><h2>Independent review and reconciliation</h2><pre>${literal({ review: s.review, reconciliation: s.reconciliation })}</pre></div>
<div class="appendix"><h2>Exact source and template manifest</h2><dl><dt>Source SHA-256</dt><dd>${e(s.source_hash)}</dd><dt>Review</dt><dd>${e(s.review_id)}</dd><dt>Reconciliation</dt><dd>${e(s.reconciliation_id)}</dd><dt>Template SHA-256</dt><dd>${e(o.template_hash)}</dd></dl><pre>${literal(s.source_manifest)}</pre><h2>Entitlement evidence</h2><pre>${literal(s.lines.map((l) => ({ entitlement_id: l.entitlement_id, evidence: l.evidence })))}</pre><h2>Finance definition and policy</h2><pre>${literal(s.definition)}</pre><h2>Correction requests at preparation</h2><pre>${literal(s.corrections)}</pre></div></body></html>`;
}
export async function renderClaimEvidence(s: ClaimEvidence, o: ReservedOutput) {
  const html = await claimEvidenceHtml(s, o);
  const browser = await launchDocumentBrowser();
  try {
    const page = await browser.newPage();
    await page.route("**/*", (route) => route.abort());
    await page.setContent(html, { waitUntil: "load" });
    await page.evaluate(() => document.fonts.ready);
    if (!(await page.evaluate(() => document.fonts.check('16px "PPO Roboto"'))))
      throw Error("Complete output font did not load");
    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      tagged: true,
      outline: true,
      displayHeaderFooter: true,
      margin: { top: "22mm", right: "15mm", bottom: "22mm", left: "15mm" },
      headerTemplate: `<div style="font:8px Verdana;width:100%;margin:0 15mm;overflow-wrap:anywhere">${e(s.reference)} · ${e(s.source_reference)} · Restricted Finance evidence</div>`,
      footerTemplate:
        '<div style="font:8px Verdana;margin:0 15mm">Synthetic — not an invoice · <span class="pageNumber"></span> / <span class="totalPages"></span></div>',
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
