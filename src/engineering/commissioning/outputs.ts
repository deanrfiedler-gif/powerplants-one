// Bounded support for two blueprint outputs: OUT-12 Commissioning/test record and OUT-13 Handover pack. It reuses
// the application's document browser, exact byte store, hash and canonical-JSON primitives and adds only what
// these two outputs need. It is not a template editor and not the DK-03 distribution runtime: nothing here
// emails, uploads, delivers or acknowledges anything. The reviewed bytes are the issued bytes: they are rendered
// once, stored once under the reserved output identity, and read back under their hash every time.
import { digest, documentStore } from "../../documents/store";
import { escapeHtml, rendererVersion } from "../../documents/render";
import { launchDocumentBrowser } from "../../platform/browser";
import { AppError } from "../../platform/errors";
import type { Principal } from "../../platform/identity";
import { canonical } from "../../platform/operations";
import { criterionText, inspectionLabel } from "../../inspections/model";
import { configurationLabel, stamp, type Access, type Loaded, type ReleaseRow } from "./context";
import { label, obligationPresentation, receivingPresentation, redlinePresentation, type Destination } from "./model";

export type OutputKind = "OUT-12" | "OUT-13";
export type Audience = "Internal" | "Customer";
export const templateDefinitions: Record<OutputKind, string> = {
  "OUT-12": "PPO OUT-12 commissioning/test record; semantic HTML/A4 v1; escaped plain text; no external requests; fictional limits labelled; audience filtered before rendering; tagged PDF requested; no PDF/UA claim.",
  "OUT-13": "PPO OUT-13 handover pack; semantic HTML/A4 v1; escaped plain text; no external requests; audience filtered before rendering; tagged PDF requested; no PDF/UA claim.",
};
export const templateVersion = (kind: OutputKind) => `${kind} v1 · ${digest(templateDefinitions[kind]).slice(0, 16)}`;

// ---------------------------------------------------------------------------------------------
// Content. Audience filtering happens here, before anything is rendered: a customer-safe record drops internal
// review notes, people's names and internal-only evidence, and keeps every failure, exclusion and open obligation.
// Filtering never makes an acceptance look more complete than it is.
const person = (audience: Audience, name: string | null, role: string) => (audience === "Internal" ? (name ?? role) : role);
export function releaseManifest(l: Loaded, access: Access, release: Pick<ReleaseRow, "id" | "reference" | "revision_number" | "partial" | "included" | "excluded" | "audience" | "recipients" | "scope_id" | "basis_id" | "configuration_id">, names: ReadonlyMap<string, string>) {
  const included = new Set(release.included), items = l.scope.items.filter((i) => included.has(i.key)), definitions = l.definitions.filter((d) => d.scope_key === null || included.has(d.scope_key));
  return {
    schema_version: 1, synthetic: true, kind: release.partial ? "Partial technical release" : "Technical release",
    release: { id: release.id, reference: release.reference, revision: release.revision_number, partial: release.partial, audience: release.audience },
    package: { id: l.row.id, reference: l.row.reference, title: l.row.title, system: l.row.system_name, area: l.row.area, engineering_package: access.pkg.display_number, project: access.pkg.context_title, customer: access.pkg.customer_name, site: access.site_name, timezone: access.site_timezone },
    scope: { id: l.scope.id, number: l.scope.scope_number, hash: l.scope.content_hash, included: items.map((i) => ({ key: i.key, kind: i.kind, reference: i.reference, title: i.title, installed_location: i.installed_location, served_areas: i.served_areas, identity: i.identity, asset_id: i.asset_id })),
      excluded: release.excluded.map((e) => ({ ...e, title: l.scope.items.find((i) => i.key === e.key)?.title ?? e.key, owner_name: e.owner_id ? names.get(e.owner_id) ?? null : null })),
      interfaces: l.scope.interfaces.filter((f) => f.items.some((k) => included.has(k))).map((f) => ({ key: f.key, label: f.label, assessment: f.assessment, note: f.note })) },
    basis: l.approved_basis ? { id: l.approved_basis.id, reference: l.approved_basis.reference, revision: l.approved_basis.revision, row_version: l.approved_basis.version, hash: l.approved_basis.submitted_hash, purpose: l.approved_basis.approval_purpose, approved_at: stamp(l.approved_basis.decided_at), policy_version: l.approved_basis.policy_version,
      sources: l.bound.map((b) => ({ role: b.role, ...b.snapshot })) } : null,
    configuration: l.configuration ? { id: l.configuration.id, tested: configurationLabel(l.configuration), hash: l.configuration.content_hash, reconciled_at: stamp(l.configuration.reconciled_at),
      items: l.differences.filter((d) => d.scope_key === null || included.has(d.scope_key)).map((d) => ({ key: d.item_key, component: d.component, kind: d.kind, intended: d.intended_value, observed: d.observed_value, as_built: d.proposed_as_built ?? d.observed_value, disposition: d.disposition })) } : null,
    checks: definitions.map((d) => {
      const e = l.effective.find((x) => x.check_key === d.key);
      return { key: d.key, name: d.name, scope_key: d.scope_key, criterion: criterionText(d), evaluation: e?.evaluation ?? "NotTested", review: e?.review ?? "NotSubmitted", applicability: e?.applicability ?? "Current", attempt: e?.attempt_number ?? null };
    }),
    // Every attempt that touched this scope, failures included. A later pass never removes the failure before it.
    attempts: l.attempts.filter((a) => a.row.state === "Submitted").map((a) => ({
      id: a.row.id, number: a.row.attempt_number, predecessor_id: a.row.predecessor_id, hash: a.row.submitted_hash, configuration: a.row.configuration_reference, occurred_at: stamp(a.row.occurred_at), timezone: a.row.timezone, received_at: stamp(a.row.received_at), performer_id: a.row.performer_id,
      review: a.review, results: a.results.map((r) => ({ check_key: r.check_key, state: r.entry_state, value: r.raw_value, unit: r.unit, choice: r.choice, evaluation: r.evaluation, reason: r.evaluation_reason })),
      instruments: a.instruments.map((i) => ({ reference: i.snapshot.reference, calibration: i.snapshot.calibration_reference, valid_from: i.snapshot.valid_from, valid_to: i.snapshot.valid_to, assessment: i.assessment })),
      evidence: a.evidence.map((e) => ({ id: e.id, label: e.label, kind: e.kind, hash: e.content_hash, access_class: e.access_class })), reviews: a.reviews.map((v) => ({ decision: v.decision, decided_at: stamp(v.decided_at), decided_by: v.decided_by, reason: v.reason })),
    })),
    defects: l.defects.map((d) => ({ reference: d.reference, check_key: d.check_key, title: d.title, state: d.state, owner_id: d.owner_id, due: d.due, closed_at: stamp(d.closed_at) })),
    redlines: l.redlines.map((r) => ({ reference: r.reference, source: `${r.source_snapshot.reference} Rev ${r.source_snapshot.revision}`, component: r.component, state: r.state, successor_source_id: r.successor_source_id })),
    obligations: l.obligations.map((o) => ({ id: o.id, kind: o.kind, title: o.title, stage: o.required_stage, state: o.state, owner_id: o.owner_id, due: o.due })),
    recipients: release.recipients,
  };
}
export type ReleaseManifest = ReturnType<typeof releaseManifest>;
export const manifestComplete = (m: ReleaseManifest) => !!m.basis && !!m.configuration && m.scope.included.length > 0 && m.checks.length > 0;

export type HandoverManifest = ReturnType<typeof handoverManifest>;
export function handoverManifest(l: Loaded, access: Access, release: ReleaseRow, request: { destination: Destination; recipient_id: string; purpose: string; support_owner_id: string | null }, names: ReadonlyMap<string, string>, correction: { note: string; previous_hash: string } | null) {
  const released = release.manifest as ReleaseManifest;
  return {
    schema_version: 1, synthetic: true, destination: request.destination, recipient_id: request.recipient_id, recipient_name: names.get(request.recipient_id) ?? null, purpose: request.purpose,
    support_owner: request.support_owner_id ? { id: request.support_owner_id, name: names.get(request.support_owner_id) ?? null } : null,
    release: { id: release.id, reference: release.reference, revision: release.revision_number, partial: release.partial, manifest_hash: release.manifest_hash, issued_at: stamp(release.issued_at) },
    package: released.package, scope: released.scope, basis: released.basis, configuration: released.configuration ? { tested: released.configuration.tested, hash: released.configuration.hash } : null,
    tests: { checks: released.checks.length, accepted: released.checks.filter((c) => c.evaluation === "Pass" && c.review === "Accepted").length, retained_failures: released.attempts.reduce((n, a) => n + a.results.filter((r) => r.evaluation === "Fail").length, 0), output_record: l.outputs.find((o) => o.release_id === release.id && o.kind === "OUT-12" && o.state === "Issued")?.id ?? null },
    // Each of these is its own evidenced fact at the moment this manifest was made. A later change is a corrected manifest, never an edit.
    manuals: l.obligations.filter((o) => o.kind === "Manual" || o.kind === "SupportContext").map((o) => ({ title: o.title, revision: o.content_revision, source: o.source_reference, state: o.state })),
    backups: l.backups.map((k) => ({ asset: k.asset_reference, configuration_version: k.configuration_version, format: k.native_format, reference: k.access_class === "Restricted" && request.destination === "Projects" ? "Restricted reference" : k.stored_reference, hash: k.content_hash, available: !!k.available_at, identity_verified: !!k.identity_at, restore_verified: !!k.restore_at })),
    training: l.obligations.filter((o) => o.kind === "Training").map((o) => ({ title: o.title, subject: o.subject, content_revision: o.content_revision, stage: o.required_stage, state: o.state, planned_on: o.planned_on, delivered_on: o.delivered_on, evidence: o.evidence, competence: o.competence_note })),
    warranty_maintenance: l.obligations.filter((o) => o.kind === "WarrantyMaintenance").map((o) => ({ title: o.title, source: o.source_reference, state: o.state, note: "Context only. No warranty start and no maintenance schedule is set or implied by this pack." })),
    open_obligations: l.obligations.filter((o) => !["EvidenceRecorded", "CompetenceConfirmed", "Complete", "Dispositioned"].includes(o.state)).map((o) => ({ title: o.title, kind: o.kind, stage: o.required_stage, state: o.state, owner_id: o.owner_id, owner_name: o.owner_name, due: o.due })),
    correction,
  };
}

// ---------------------------------------------------------------------------------------------
const e = escapeHtml, css = `:root{color-scheme:light}*{box-sizing:border-box}body{margin:0;color:#242a37;background:#fff;font:15px/1.55 Roboto,Verdana,Arial,sans-serif}main{max-width:1000px;margin:auto;padding:28px}header{border-top:8px solid #242a37;border-bottom:1px solid #e1e5eb;padding:16px 0}h1{font-size:28px;margin:6px 0}h2{font-size:19px;line-height:1.3;border-bottom:2px solid #62bb46;padding-bottom:6px;margin:28px 0 12px;break-after:avoid}h3{font-size:15px;margin:18px 0 6px;break-after:avoid}p{margin:6px 0;overflow-wrap:anywhere}.classification{font-weight:700;color:#80530e}.meta{font-size:13px;color:#596779}table{width:100%;border-collapse:collapse;margin:8px 0;font-size:13px}th,td{text-align:left;vertical-align:top;padding:6px 8px;border-bottom:1px solid #e1e5eb;overflow-wrap:anywhere}th{background:#eef0f3;color:#606977;font-weight:500}tr{break-inside:avoid}.fail{color:#993b2a;font-weight:500}.pass{color:#416d33}.note{border-left:3px solid #efdbb6;background:#fff2d9;color:#80530e;padding:8px 12px;margin:10px 0}footer{margin-top:28px;border-top:1px solid #e1e5eb;padding-top:10px;font-size:12px;color:#596779}@media print{body{font-size:10pt}main{padding:0}h1{font-size:20pt}h2{font-size:13pt}table{font-size:8.5pt}}`;
const table = (head: string[], rows: (string | number | null)[][], empty: string) => (rows.length ? `<table><thead><tr>${head.map((h) => `<th scope="col">${e(h)}</th>`).join("")}</tr></thead><tbody>${rows.map((r) => `<tr>${r.map((c) => `<td>${e(c ?? "—")}</td>`).join("")}</tr>`).join("")}</tbody></table>` : `<p class="meta">${e(empty)}</p>`);
const banner = (output: { id: string; prepared_at: string } | null) => (output
  ? `Output reference ${e(output.id)} · prepared ${e(output.prepared_at)} (UTC). This is the time the bytes were reserved and rendered. The actual issue event, its time and current applicability are recorded in Powerplants One; this file alone is not proof of issue, delivery or acknowledgement.`
  : "Preparation preview — not prepared, not issued.");
const shell = (title: string, m: { package: ReleaseManifest["package"] }, output: { id: string; prepared_at: string } | null, body: string, foot: string) =>
  `<!doctype html><html lang="en-AU"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${e(title)}</title><style>${css}</style></head><body><main><header><p class="classification">Synthetic prototype — fictional limits and records — not for operational use</p><p>POWERPLANTS ONE · ENGINEERING</p><h1>${e(title)}</h1><p><strong>${e(m.package.reference)} · ${e(m.package.title)}</strong></p><p>${e(m.package.customer)} · ${e(m.package.site ?? "No site recorded")} · ${e(m.package.project)}</p><p class="meta">${banner(output)}</p></header>${body}<footer>${foot}</footer></main></body></html>`;

export function recordHtml(m: ReleaseManifest, names: ReadonlyMap<string, string>, output: { id: string; prepared_at: string } | null) {
  const audience = m.release.audience as Audience, who = (id: string | null, role: string) => person(audience, id ? names.get(id) ?? null : null, role), scopeTitle = (key: string | null) => (key ? m.scope.included.find((i) => i.key === key)?.title ?? key : "Whole scope");
  const body = `
 <section><h2>1. Release and scope</h2><p><strong>${e(m.kind)} ${e(m.release.reference)} revision ${m.release.revision}</strong> · ${e(m.package.system)} · ${e(m.package.area)}</p>
 ${m.release.partial ? `<p class="note">Partial technical release. Only the scope listed as included is released. It completes no Project, authorises no site operation and starts no warranty.</p>` : `<p class="meta">A technical release. It completes no Project, authorises no site operation and starts no warranty.</p>`}
 <h3>Included</h3>${table(["Item", "Kind", "Installed at", "Areas served", "Identity"], m.scope.included.map((i) => [`${i.reference} — ${i.title}`, i.kind, i.installed_location, i.served_areas.join("; ") || null, i.identity]), "No scope is included.")}
 <h3>Excluded</h3>${table(["Item", "Reason", "Residual obligation", "Next owner"], m.scope.excluded.map((x) => [x.title, x.reason, x.residual, audience === "Internal" ? x.owner_name : x.owner_name ? "Named owner" : null]), "Nothing is excluded from the declared scope.")}
 <h3>Shared interfaces</h3>${table(["Interface", "Assessment", "Reasoning"], m.scope.interfaces.map((f) => [f.label, f.assessment, f.note]), "No shared interface touches this scope.")}</section>
 <section><h2>2. Approved test basis</h2>${m.basis ? `<p>Procedure <strong>${e(m.basis.reference)} ${e(m.basis.revision)}</strong> · approved for ${e(label(m.basis.purpose).toLowerCase())} ${e(m.basis.approved_at)} · policy version ${e(m.basis.policy_version)}</p>${table(["Role", "Source", "Revision", "File version", "Content hash"], m.basis.sources.map((s) => [s.role, s.reference, s.revision, s.file_version, s.content_hash]), "No source is bound.")}` : `<p class="note">No approved test basis.</p>`}
 <p class="meta">Every acceptance limit below is fictional and exists only to exercise this prototype.</p></section>
 <section><h2>3. Tested configuration</h2>${m.configuration ? `<p><strong>${e(m.configuration.tested)}</strong> · reconciled ${e(m.configuration.reconciled_at)}</p>${table(["Component", "Intended", "Observed", "As built", "Disposition"], m.configuration.items.map((i) => [i.component, i.intended, i.observed ?? "Unknown", i.as_built ?? "Unknown", label(i.disposition)]), "No compared item.")}` : `<p class="note">No reconciled configuration.</p>`}</section>
 <section><h2>4. Required checks</h2>${table(["Check", "Scope", "Criterion (fictional)", "Result", "Evidence review", "Attempt"], m.checks.map((c) => [c.name, scopeTitle(c.scope_key), c.criterion, inspectionLabel(c.evaluation), inspectionLabel(c.review), c.attempt === null ? null : String(c.attempt).padStart(2, "0")]), "No check is defined.")}</section>
 <section><h2>5. Attempts, failures and retests</h2>${m.attempts.map((a) => `<h3>Attempt ${String(a.number).padStart(2, "0")}${a.predecessor_id ? ` — retest of attempt ${String(m.attempts.find((x) => x.id === a.predecessor_id)?.number ?? 0).padStart(2, "0")}` : ""}</h3>
 <p class="meta">Tested ${e(a.occurred_at)} (${e(a.timezone)}) · received ${e(a.received_at)} · configuration ${e(a.configuration)} · performed by ${e(who(a.performer_id, "the assigned performer"))} · content ${e(a.hash)}</p>
 ${table(["Check", "Entry", "Evaluation", "Reason"], a.results.map((r) => [m.checks.find((c) => c.key === r.check_key)?.name ?? r.check_key, r.state === "Recorded" ? (r.choice ?? `${r.value} ${r.unit}`) : inspectionLabel(r.state), inspectionLabel(r.evaluation ?? "NotTested"), r.reason]), "No entry.")}
 ${table(["Instrument", "Calibration", "Valid", "At the time of test"], a.instruments.map((i) => [i.reference, i.calibration, `${i.valid_from} to ${i.valid_to}`, inspectionLabel(i.assessment)]), "No instrument recorded.")}
 ${table(["Evidence", "Kind", "Content hash"], a.evidence.filter((x) => audience === "Internal" || x.access_class === "CustomerSafe").map((x) => [x.label, x.kind, x.hash]), audience === "Internal" ? "No evidence attached." : "No customer-safe evidence is attached; internal evidence is retained in the application.")}
 ${table(["Review decision", "When", "By", ...(audience === "Internal" ? ["Reason"] : [])], a.reviews.map((v) => [inspectionLabel(v.decision), v.decided_at, who(v.decided_by, v.decision === "ClarificationProvided" ? "the performer" : "the independent reviewer"), ...(audience === "Internal" ? [v.reason] : [])]), "Not reviewed.")}`).join("") || `<p class="meta">No submitted attempt.</p>`}</section>
 <section><h2>6. Defects and redlines</h2>${table(["Defect", "Check", "State", "Due", "Closed"], m.defects.map((d) => [`${d.reference} — ${d.title}`, m.checks.find((c) => c.key === d.check_key)?.name ?? d.check_key, inspectionLabel(d.state), d.due, d.closed_at]), "No defect was raised.")}
 ${table(["Redline", "Against", "Component", "State"], m.redlines.map((r) => [r.reference, r.source, r.component, redlinePresentation[r.state].label]), "No field redline was recorded.")}</section>
 <section><h2>7. Obligations that remain</h2>${table(["Obligation", "Kind", "Required", "State", "Due"], m.obligations.map((o) => [o.title, label(o.kind), label(o.stage), obligationPresentation[o.state].label, o.due]), "No obligation is recorded.")}</section>
 <section><h2>8. Required recipients</h2>${table(["Destination", "Recipient", "Purpose"], m.recipients.map((r) => [label(r.destination), who(r.recipient_id, "Named receiver"), r.purpose]), "No recipient is named.")}<p class="meta">Each recipient records their own receiving decision in Powerplants One. Preparing or issuing this record sends nothing to anyone.</p></section>`;
  return shell(`Commissioning and test record — ${m.kind.toLowerCase()}`, m, output, body, `<p>Exact release manifest ${e(digest(canonical(m)))} · template ${e(templateVersion("OUT-12"))} · audience ${e(audience)}.</p><p>PDF tagging is requested; PDF/UA conformance is not verified. Use the HTML view for navigation and adaptable text.</p>`);
}
export function packHtml(m: HandoverManifest, output: { id: string; prepared_at: string } | null) {
  const body = `
 <section><h2>1. What is handed over, to whom and why</h2><p><strong>${e(label(m.destination))}</strong> · ${e(m.recipient_name ?? "Named receiver")} · ${e(m.purpose)}</p><p>Release <strong>${e(m.release.reference)} revision ${m.release.revision}</strong>${m.release.partial ? " (partial technical release)" : ""} · issued ${e(m.release.issued_at)} · manifest ${e(m.release.manifest_hash)}</p>
 ${m.correction ? `<p class="note">Corrected manifest. ${e(m.correction.note)} It replaces manifest ${e(m.correction.previous_hash)}, which is retained exactly as it was judged. An earlier decision does not carry over to this one.</p>` : ""}
 <p class="meta">Support owner: ${e(m.support_owner?.name ?? "Not named")}. Accepting this pack is the receiver's own decision about this exact manifest. It is not Project completion, customer acceptance, a warranty start or a commercial closure.</p></section>
 <section><h2>2. Released scope</h2>${table(["Item", "Kind", "Installed at", "Areas served", "Identity"], m.scope.included.map((i) => [`${i.reference} — ${i.title}`, i.kind, i.installed_location, i.served_areas.join("; ") || null, i.identity]), "No scope.")}
 ${table(["Excluded", "Reason", "Residual obligation"], m.scope.excluded.map((x) => [x.title, x.reason, x.residual]), "Nothing is excluded.")}</section>
 <section><h2>3. As-built and test references</h2><p>Test basis ${e(m.basis ? `${m.basis.reference} ${m.basis.revision}` : "none")} · as-built configuration ${e(m.configuration?.tested ?? "none")} · ${m.tests.accepted} of ${m.tests.checks} required checks accepted · ${m.tests.retained_failures} earlier failed result${m.tests.retained_failures === 1 ? "" : "s"} retained in the test record${m.tests.output_record ? ` (${e(m.tests.output_record)})` : ""}.</p></section>
 <section><h2>4. Manuals and support context</h2>${table(["Item", "Revision", "Source", "State"], m.manuals.map((x) => [x.title, x.revision, x.source, obligationPresentation[x.state].label]), "No manual or support item is recorded.")}</section>
 <section><h2>5. Configuration backup references</h2>${table(["Asset", "Configuration version", "Format", "Reference", "Available", "Identity verified", "Restore verified"], m.backups.map((k) => [k.asset, k.configuration_version, k.format, k.reference, k.available ? "Yes" : "No", k.identity_verified ? "Yes" : "No", k.restore_verified ? "Yes" : "Not evidenced"]), "No backup reference is recorded.")}<p class="meta">References only. No backup content, credential or controller setting is held in this pack.</p></section>
 <section><h2>6. Training</h2>${table(["Training", "Content revision", "Required", "Planned", "Delivered", "Evidence", "Competence", "State"], m.training.map((t) => [t.title, t.content_revision, label(t.stage), t.planned_on, t.delivered_on, t.evidence, t.competence ?? "Not confirmed", obligationPresentation[t.state].label]), "No training obligation is recorded.")}</section>
 <section><h2>7. Warranty and maintenance context</h2>${table(["Item", "Source", "State", "Note"], m.warranty_maintenance.map((w) => [w.title, w.source, obligationPresentation[w.state].label, w.note]), "No warranty or maintenance context is recorded.")}</section>
 <section><h2>8. Open obligations</h2>${table(["Obligation", "Kind", "Required", "State", "Owner", "Due"], m.open_obligations.map((o) => [o.title, label(o.kind), label(o.stage), obligationPresentation[o.state].label, o.owner_name, o.due ?? "Date needed"]), "No obligation is open.")}</section>
 <section><h2>9. Decision required</h2><p>The named receiver records <strong>${e(receivingPresentation.Accepted.label)}</strong>, <strong>${e(receivingPresentation.Returned.label)}</strong> or <strong>${e(receivingPresentation.ClarificationRequired.label)}</strong> against this exact manifest in Powerplants One, with a reason.</p></section>`;
  return shell("Handover pack", m, output, body, `<p>Exact handover manifest ${e(digest(canonical(m)))} · template ${e(templateVersion("OUT-13"))}.</p><p>PDF tagging is requested; PDF/UA conformance is not verified. Use the HTML view for navigation and adaptable text.</p>`);
}

// ---------------------------------------------------------------------------------------------
export type Renderer = (html: string, head: string, foot: string) => Promise<{ pdf: Buffer; browser_version: string }>;
export const renderPdf: Renderer = async (html, head, foot) => {
  const browser = await launchDocumentBrowser();
  try {
    const page = await browser.newPage();
    await page.route("**/*", (route) => route.abort());
    await page.setContent(html, { waitUntil: "load" });
    const pdf = await page.pdf({ format: "A4", printBackground: true, tagged: true, outline: true, displayHeaderFooter: true, margin: { top: "20mm", right: "15mm", bottom: "22mm", left: "15mm" },
      headerTemplate: `<div style="font:8px Verdana;width:100%;margin:0 15mm;color:#242a37">${e(head)}</div>`, footerTemplate: `<div style="font:8px Verdana;width:100%;margin:0 15mm;color:#242a37">Synthetic prototype — not for operational use · ${e(foot)} · <span class="pageNumber"></span> / <span class="totalPages"></span></div>` });
    if (!pdf.subarray(0, 5).equals(Buffer.from("%PDF-"))) throw Error("Invalid rendered PDF");
    return { pdf, browser_version: browser.version() };
  } finally {
    await browser.close();
  }
};
export type Bundle = { schema_version: 1; output_id: string; kind: OutputKind; audience: Audience; manifest_hash: string; template_version: string; prepared_at: string; html: string; pdf_base64: string; renderer_version: string; browser_version: string };
export type Prepared = { id: string; kind: OutputKind; audience: Audience; manifest_hash: string; template_version: string; renderer_version: string; prepared_at: string; bundle_sha256: string; bundle_bytes: number; html_sha256: string; html_bytes: number; pdf_sha256: string; pdf_bytes: number; recovered: boolean };
const describe = (b: Bundle, bytes: Buffer, recovered: boolean): Prepared => {
  const pdf = Buffer.from(b.pdf_base64, "base64");
  return { id: b.output_id, kind: b.kind, audience: b.audience, manifest_hash: b.manifest_hash, template_version: b.template_version, renderer_version: b.renderer_version, prepared_at: b.prepared_at, bundle_sha256: digest(bytes), bundle_bytes: bytes.length,
    html_sha256: digest(b.html), html_bytes: Buffer.byteLength(b.html), pdf_sha256: digest(pdf), pdf_bytes: pdf.length, recovered };
};
// Render once, store once. The output id is the reserved identity and the storage key, so a retry after a lost
// response or a crash finds the bytes it already made and never renders a second, different file. Bytes that
// belong to other content are never overwritten. Nothing here touches the database: a failure leaves the release
// exactly as it was, unissued, and the caller reports the real failure.
export async function prepareBundle(p: Principal, input: { output_id: string; kind: OutputKind; audience: Audience; manifest_hash: string; template_version?: string; html: (output: { id: string; prepared_at: string }) => string; head: string; foot: string }, render: Renderer = renderPdf): Promise<Prepared> {
  const context = { workspace_id: p.workspace_id, actor_id: p.actor_id, operation_id: input.output_id }, store = documentStore();
  try {
    const existing = "locate" in store ? await store.locate(context) : null;
    if (existing) {
      const b = JSON.parse(Buffer.from(existing.bytes).toString("utf8")) as Bundle;
      if (b.output_id !== input.output_id || b.kind !== input.kind || b.manifest_hash !== input.manifest_hash || b.audience !== input.audience || b.template_version !== (input.template_version ?? templateVersion(input.kind)))
        throw new AppError(409, "OutputIdentityInUse", "This output identity already holds bytes prepared from different content. Those bytes are retained; prepare the changed content under a new output identity.");
      return describe(b, Buffer.from(existing.bytes), true);
    }
    const prepared_at = new Date().toISOString(), html = input.html({ id: input.output_id, prepared_at }), rendered = await render(html, input.head, input.foot);
    const bundle: Bundle = { schema_version: 1, output_id: input.output_id, kind: input.kind, audience: input.audience, manifest_hash: input.manifest_hash, template_version: input.template_version ?? templateVersion(input.kind), prepared_at, html, pdf_base64: rendered.pdf.toString("base64"), renderer_version: rendererVersion, browser_version: rendered.browser_version };
    const bytes = Buffer.from(canonical(bundle));
    await store.store(context, bytes, digest(bytes));
    return describe(bundle, bytes, false);
  } catch (error) {
    if (error instanceof AppError && error.code === "OutputIdentityInUse") throw error;
    throw new AppError(503, "RenderOrStorageFailure", `The output could not be prepared (${error instanceof AppError ? error.code : error instanceof Error ? error.message.slice(0, 160) : "unknown failure"}). Nothing was issued and the release is unchanged. Retry with the same output identity to recover.`);
  }
}
// The exact bytes of a prepared or issued output, re-verified against every recorded hash each time they are read.
export async function readBundle(p: Principal, o: { id: string; bundle_sha256: string; bundle_bytes: number; html_sha256: string; pdf_sha256: string; pdf_bytes: number }) {
  const bytes = Buffer.from(await documentStore().read({ workspace_id: p.workspace_id, actor_id: p.actor_id, operation_id: o.id }, { provider: "Synthetic", tenant_id: null, site_id: null, drive_id: null, item_id: o.id, version_id: o.bundle_sha256, sha256: o.bundle_sha256 }));
  const b = JSON.parse(bytes.toString("utf8")) as Bundle, pdf = Buffer.from(b.pdf_base64, "base64");
  if (bytes.length !== o.bundle_bytes || digest(b.html) !== o.html_sha256 || digest(pdf) !== o.pdf_sha256 || pdf.length !== o.pdf_bytes) throw new AppError(503, "ExactDocumentUnavailable", "The exact output bytes are unavailable. Their reference is retained; nothing is substituted for them.");
  return { html: b.html, pdf, prepared_at: b.prepared_at };
}
