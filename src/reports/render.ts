import { chromium } from "playwright";
import { escapeHtml as e, rendererVersion } from "../documents/render";
import { canonical } from "../platform/operations";
import { digest } from "../documents/store";
export const reportTemplateDefinition =
  "PPO OUT-10 semantic HTML/A4 v1; customer-safe exact reviewed evidence; navy/green; escaped text; repeated identity and table headers; no external requests; no inherited signature; tagged PDF requested; stable evidence labels and compact print spacing.";
type SubmissionSnapshot = {
  customer: { id: string; name: string };
  site: { id: string; name: string };
  work: { id: string; reference: string };
  appointment: { id: string; reference: string; timezone: string };
  attendance: {
    id: string;
    name: string;
    start_at: string;
    end_at: string;
    scope_revision_id: string;
    scope_hash: string;
    issue_id: string;
    issue_hash: string;
  };
  scope: {
    id: string;
    version: number;
    content_hash: string;
    summary: string;
    exclusions: string;
  };
  tasks: { id: string; task_description: string; expected_outcome: string }[];
  assets: { id: string; display_name: string; identity_status: string }[];
  completion: {
    blockers: string[];
    scope_outcome: string;
    work_performed: string;
    exclusions: string;
    remaining_work: string;
    task_outcomes: { scope_item_id: string; outcome: string; reason: string }[];
  };
  entries: {
    id: string;
    version: number;
    kind: string;
    scope_item_id: string | null;
    asset_id: string | null;
    payload: Record<string, unknown>;
  }[];
  attachments: { id: string; sha256: string; byte_count: number }[];
};
export function customerSnapshot(
  s: SubmissionSnapshot,
  reference: string,
  revision: number,
  audience: { id: string; name: string; version: number },
  authorityDisposition = "Current",
) {
  const evidence = s.entries.map((v) => {
    const p = v.payload;
    let facts: Record<string, unknown> = {};
    switch (v.kind) {
      case "Time":
        facts = {
          kind: p.time_kind,
          start_at: p.start_at,
          end_at: p.end_at,
          elapsed_seconds: p.elapsed_seconds,
          elapsed_minutes: p.elapsed_minutes,
        };
        break;
      case "Material":
        facts = {
          movement: p.movement_kind,
          description: p.description,
          quantity: p.quantity,
          unit: p.uom,
        };
        break;
      case "Observation":
        facts = {
          finding: p.finding,
          confidence: p.confidence,
          attempted_fix: p.attempted_fix,
          result: p.result,
          follow_up_required: p.follow_up_required,
        };
        break;
      case "Reading":
        facts = {
          name: p.name,
          numeric_value: p.numeric_value,
          text_value: p.text_value,
          unit: p.unit,
          context: p.context,
        };
        break;
      case "Checklist":
        facts = { check: p.check_id, result: p.result, reason: p.reason };
        break;
      case "Photo":
        facts = {
          caption: p.caption,
          evidence:
            "Original photo retained privately; no filename or private location is distributed.",
        };
        break;
      default:
        throw Error("Unsupported customer evidence kind");
    }
    return {
      id: v.id,
      version: v.version,
      kind: v.kind,
      scope_item_id: v.scope_item_id,
      asset_id: v.asset_id,
      facts,
    };
  });
  return {
    schema_version: 1 as const,
    synthetic: true as const,
    reference,
    revision,
    authority_disposition: authorityDisposition,
    audience: {
      id: audience.id,
      name: audience.name,
      version: audience.version,
    },
    customer: { id: s.customer.id, name: s.customer.name },
    site: { id: s.site.id, name: s.site.name },
    work: { id: s.work.id, reference: s.work.reference },
    appointment: {
      id: s.appointment.id,
      reference: s.appointment.reference,
      timezone: s.appointment.timezone,
    },
    attendance: {
      id: s.attendance.id,
      name: s.attendance.name,
      start_at: s.attendance.start_at,
      end_at: s.attendance.end_at,
    },
    authorised_scope: {
      id: s.scope.id,
      version: s.scope.version,
      hash: s.scope.content_hash,
      summary: s.scope.summary,
      exclusions: s.scope.exclusions,
    },
    assets: s.assets.map((a) => ({
      id: a.id,
      name: a.display_name,
      identity: a.identity_status,
    })),
    tasks: s.tasks.map((t) => ({
      id: t.id,
      description: t.task_description,
      expected_outcome: t.expected_outcome,
      ...s.completion.task_outcomes.find((x) => x.scope_item_id === t.id),
    })),
    completion: {
      outcome: s.completion.scope_outcome,
      blockers: s.completion.blockers,
      work_performed: s.completion.work_performed,
      exclusions: s.completion.exclusions,
      remaining_work: s.completion.remaining_work,
      next_action_owner: "Service coordinator",
    },
    evidence,
    source_attachments: s.attachments.map((a) => ({
      id: a.id,
      sha256: a.sha256,
      byte_count: a.byte_count,
    })),
  };
}
export type CustomerSnapshot = ReturnType<typeof customerSnapshot>;
const fieldOrder: Record<string, readonly string[]> = {
  Time: ["kind", "start_at", "end_at", "elapsed_minutes", "elapsed_seconds"],
  Material: ["description", "movement", "quantity", "unit"],
  Observation: [
    "finding",
    "confidence",
    "attempted_fix",
    "result",
    "follow_up_required",
  ],
  Reading: ["name", "numeric_value", "text_value", "unit", "context"],
  Checklist: ["check", "result", "reason"],
  Photo: ["caption", "evidence"],
};
function evidenceFields(kind: string, facts: Record<string, unknown>) {
  return fieldOrder[kind].map(
    (key) =>
      [
        key.replaceAll("_", " ").replace(/^./, (c) => c.toUpperCase()),
        facts[key],
      ] as const,
  );
}
export function reportHtml(
  s: CustomerSnapshot,
  output: {
    kind: "DraftEvidence" | "IssuedReport";
    prepared_at?: string;
    issue_id?: string;
    template_hash?: string;
  },
) {
  const rev = `r${String(s.revision).padStart(2, "0")}`,
    time = (v: string) =>
      new Intl.DateTimeFormat("en-AU", {
        dateStyle: "medium",
        timeStyle: "short",
        timeZone: s.appointment.timezone,
      }).format(new Date(v));
  const text = (v: unknown) =>
    v == null
      ? "Not recorded"
      : typeof v === "boolean"
        ? v
          ? "Yes"
          : "No"
        : String(v);
  return `<!doctype html><html lang="en-AU"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${e(s.reference)} ${rev} — Service report</title><style>*{box-sizing:border-box}body{margin:0;color:#183344;background:white;font:16px/1.5 Verdana,Arial,sans-serif}main{max-width:1000px;margin:auto;padding:24px}header{border-top:8px solid #207354;border-bottom:1px solid #b6c9cb;padding:18px 0}h1{font-size:30px;margin:8px 0}h2{font-size:21px;color:#123448;border-bottom:2px solid #207354;padding-bottom:6px;margin:28px 0 12px;break-after:avoid}h3{font-size:17px;break-after:avoid}p{margin:8px 0}p,td,th,dd{overflow-wrap:anywhere;white-space:pre-wrap}.banner{font-weight:bold;color:#14593f}.meta{font-size:13px}table{width:100%;border-collapse:collapse;table-layout:fixed}thead{display:table-header-group}th{text-align:left;background:#eaf3ef}td,th{vertical-align:top;border:1px solid #b6c9cb;padding:9px}th:first-child{width:26%}dl{margin:8px 0 20px}dt{font-weight:bold}dd{margin:0 0 10px}footer{border-top:1px solid #b6c9cb;margin-top:28px;padding-top:12px;font-size:12px}.note{border-left:4px solid #207354;padding:10px 14px;background:#f1f7f4}@media(max-width:500px){main{padding:16px}h1{font-size:25px}table{font-size:14px}td,th{padding:6px}}@media print{body{font-size:10.5pt;line-height:1.45}main{padding:0}h1{font-size:23pt}h2{font-size:14pt}h3{font-size:11pt}p{orphans:3;widows:3}.meta{font-size:8.5pt}td,th{padding:6pt}footer{font-size:8pt}.note{break-inside:avoid;padding:6pt 9pt;margin:6pt 0}footer{margin-top:12pt;padding-top:6pt}.fact{break-inside:avoid}}</style></head><body><main><header><p class="banner">Synthetic prototype — not for operational use</p><p>POWERPLANTS ONE · SERVICE OPERATIONS</p><h1>Customer service report</h1><p><strong>${e(s.reference)} · ${rev}</strong></p><p>${e(s.customer.name)} · ${e(s.site.name)}</p><p class="meta">Work ${e(s.work.reference)} · Visit ${e(s.appointment.reference)}</p><p>Prepared for ${e(s.audience.name)}</p><p class="note">${output.kind === "DraftEvidence" ? "DRAFT EVIDENCE — reviewed content awaiting controlled issue. Any response describes only this draft; it will never be transferred to an issued report." : `Reserved output preparation ${e(output.prepared_at)} · Issue ${e(output.issue_id)}. Release requires the application's separate immutable issue event. This file alone does not prove release or delivery.`}</p></header><section><h2>Attendance and scope</h2><p>${e(s.attendance.name)} · ${e(time(s.attendance.start_at))} to ${e(time(s.attendance.end_at))} (${e(s.appointment.timezone)})</p><p>Attendance acceptance is separate from remaining work, customer response and financial treatment.</p><p>${e(s.authorised_scope.summary)}</p><p><strong>Authorised exclusions:</strong> ${e(s.authorised_scope.exclusions)}</p><p><strong>Scope outcome:</strong> ${e(s.completion.outcome)}</p><p>Authority review: ${e(s.authority_disposition)}. Original-attendance-only review gives no further work authority.</p></section><section><h2>Equipment and identity</h2>${s.assets.length ? `<table><thead><tr><th>Equipment</th><th>Identity</th></tr></thead><tbody>${s.assets.map((a) => `<tr><td>${e(a.name)}</td><td>${e(a.identity)}</td></tr>`).join("")}</tbody></table>` : "<p>No specific asset attributed. No identity verification is implied.</p>"}</section><section><h2>Authorised tasks and outcomes</h2>${s.tasks.map((t) => `<h3>${e(t.description)}</h3><p><strong>Expected:</strong> ${e(t.expected_outcome)}</p><p><strong>${e(t.outcome)}</strong> · ${e(t.reason)}</p>`).join("")}</section><section><h2>Work performed</h2><p>${e(s.completion.work_performed)}</p></section><section><h2>Findings, attempted fixes and evidence</h2>${
    s.evidence.length
      ? s.evidence
          .map(
            (v, i) =>
              `<h3>${i + 1}. ${e(v.kind)}</h3><dl>${evidenceFields(
                v.kind,
                v.facts,
              )
                .map(
                  ([k, v]) =>
                    `<div class="fact"><dt>${e(k)}</dt><dd>${e(text(v))}</dd></div>`,
                )
                .join("")}</dl>`,
          )
          .join("")
      : "<p>No individual field entry was declared. Refer to the explicit work and unable-to-proceed context.</p>"
  }</section><section><h2>Exclusions and remaining work</h2><p>${e(s.completion.exclusions)}</p><p>${e(s.completion.remaining_work)}</p>${s.completion.blockers.map((b) => `<p class="note">${e(b)}</p>`).join("")}<p>Next-action owner: ${e(s.completion.next_action_owner)}. A proposed return requires separate confirmation and work authority.</p></section><section><h2>Customer response context</h2><p class="note">A response describes only the exact content presented. It does not approve billing, the entire project, statutory compliance or warranty settlement. Stated identity and an optional synthetic mark are not independently verified identity. Responses are recorded separately; this PDF is never changed to add a signature.</p></section><footer><p>Exact customer content ${digest(canonical(s))}</p><p>${output.template_hash ? `Template ${e(output.template_hash)} · ` : ""}${e(s.reference)} ${rev}. Findings retain their recorded confidence; uncertain findings are not established diagnoses.</p></footer></main></body></html>`;
}
export async function renderReport(
  s: CustomerSnapshot,
  output: {
    kind: "IssuedReport";
    prepared_at: string;
    issue_id: string;
    template_hash: string;
  },
) {
  const html = reportHtml(s, output),
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
      margin: { top: "22mm", right: "15mm", bottom: "22mm", left: "15mm" },
      headerTemplate: `<div style="font:8px Verdana;width:100%;margin:0 15mm;color:#183344;overflow-wrap:anywhere">${e(s.customer.name)} · ${e(s.site.name)} · ${e(s.work.reference)}</div>`,
      footerTemplate: `<div style="font:8px Verdana;width:100%;margin:0 15mm;color:#183344">Synthetic prototype — not for operational use · ${e(s.reference)} r${String(s.revision).padStart(2, "0")} · <span class="pageNumber"></span> / <span class="totalPages"></span></div>`,
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
