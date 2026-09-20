import type { Principal } from "../../platform/identity";
import { escapeHtml } from "../../documents/render";
import {
  prepareBundle,
  readBundle,
} from "../../engineering/commissioning/outputs";
import type { Detail, ProjectContext } from "./model";
import { hash } from "./context";
export const acceptanceTemplate = "ppo-out13-acceptance-v1";
// An explicit allowlist, shared by preview, immutable manifest and rendered bytes. Internal source details,
// private commercial values, notes, provider paths and credentials never enter this projection.
export function packProjection(
  project: ProjectContext,
  detail: Detail,
  audience: "Customer" | "Service",
  recipient: { id: string; name: string },
  purpose: string,
) {
  return {
    template: acceptanceTemplate,
    synthetic: true,
    audience,
    recipient,
    purpose,
    project: {
      id: project.id,
      reference: project.display_number,
      title: project.title,
      customer: project.customer_name,
      site: project.site_name,
    },
    stage: {
      id: detail.stage.id,
      reference: detail.stage.reference,
      title: detail.stage.title,
      revision: detail.stage.revision,
    },
    scope: detail.units.map((u) => ({
      id: u.id,
      reference: u.reference,
      title: u.title,
      system: u.system_name,
      function: u.function_name,
      installed_at: u.installed_at,
      served_areas: u.served_areas,
      configuration: u.configuration_version,
      disposition: u.disposition,
      exclusion_reason: u.disposition === "Excluded" ? u.reason : null,
    })),
    evidence: detail.requirements
      .filter((r) => r.gate !== "Commercial" && r.source.kind !== "Commercial")
      .map((r) => ({
        unit_id: r.unit_id,
        kind: r.source.kind,
        source: r.source.reference,
        version: r.source.source_version,
        outcome: r.outcome,
        availability: r.source.availability,
        release_id: r.source.release_id,
        release_hash: r.source.release_hash,
        tests_accepted: r.source.tests_accepted,
        tests_required: r.source.tests_required,
        training:
          r.source.kind === "Training"
            ? {
                planned: r.source.details.planned_on,
                delivered: r.source.details.delivered_on,
                attendance: r.source.details.attendance,
                competence: r.source.details.competence,
              }
            : null,
        backup:
          r.source.kind === "Backup"
            ? {
                available: r.source.details.backup_available,
                identity_verified: r.source.details.identity_verified,
                restore_verified: r.source.details.restore_verified,
              }
            : null,
      })),
    obligations: detail.obligations.map((o) => ({
      id: o.id,
      title: o.title,
      conditions: o.conditions,
      owner: o.owner_name,
      recipient: o.recipient_name,
      due: o.due,
      due_basis: o.due_basis,
      required_evidence: o.required_evidence,
      state: o.state,
      receiving_accepted: o.transfer_accepted,
    })),
    response_instructions:
      "Respond to this exact issue and its included scope. State your authority and any reservations. Issue, download and local submission do not establish acceptance. No warranty or payment date is inferred.",
  };
}
export type PackProjection = ReturnType<typeof packProjection>;
export function packHtml(
  m: PackProjection,
  prepared: { id: string; prepared_at: string },
) {
  const e = escapeHtml;
  const rows = (values: unknown[][]) =>
    values
      .map(
        (row) =>
          `<tr>${row.map((value) => `<td>${e(value === null || value === undefined ? "—" : String(value))}</td>`).join("")}</tr>`,
      )
      .join("");
  return `<!doctype html><html lang="en-AU"><head><meta charset="utf-8"><title>Handover pack · ${e(m.stage.reference)}</title><style>body{font:12px/1.5 Verdana,sans-serif;color:#242A37}h1{font-size:24px}h2{font-size:16px;margin-top:24px}table{border-collapse:collapse;width:100%;table-layout:fixed}td,th{padding:8px;text-align:left;border-bottom:1px solid #E1E5EB;overflow-wrap:anywhere}th{background:#EEF0F3}tr{break-inside:avoid}h2{break-after:avoid}.note{padding:12px;background:#F5F6F8}footer{margin-top:24px;font-size:10px}</style></head><body><p>POWERPLANTS ONE · SYNTHETIC LOCAL PROTOTYPE</p><h1>OUT-13 Handover pack</h1><p>${e(m.project.reference)} · ${e(m.project.title)}<br>${e(m.project.customer)} · ${e(m.project.site)}</p><h2>${e(m.stage.title)} · revision ${m.stage.revision}</h2><p>${e(m.audience)} · ${e(m.recipient.name)} · ${e(m.purpose)}</p><p class="note">Prepared ${e(prepared.prepared_at)}. Actual issue is a separate recorded event. This file is not proof of delivery, customer acceptance, Service receiving or commercial closeout.</p><h2>Exact scope</h2><table><thead><tr><th>Unit / system</th><th>Installed / served</th><th>Configuration</th><th>Disposition / exclusions</th></tr></thead><tbody>${rows(m.scope.map((u) => [`${u.reference} · ${u.title} · ${u.system} · ${u.function}`, `${u.installed_at} / ${u.served_areas.join(", ")}`, u.configuration, `${u.disposition}${u.exclusion_reason ? " — " + u.exclusion_reason : ""}`]))}</tbody></table><h2>Supporting technical and handover evidence</h2><table><thead><tr><th>Kind</th><th>Exact source / version</th><th>Outcome</th><th>Evidence facts</th></tr></thead><tbody>${rows(m.evidence.map((r) => [r.kind, `${r.source} · ${r.version}${r.release_id ? " · Issue " + r.release_id : ""}`, `${r.outcome} · ${r.availability}`, r.training ? JSON.stringify(r.training) : r.backup ? JSON.stringify(r.backup) : r.tests_required !== null ? `${r.tests_accepted} / ${r.tests_required} test evidence accepted` : r.release_hash]))}</tbody></table><h2>Remaining obligations</h2><table><thead><tr><th>Work / conditions</th><th>Owner / recipient</th><th>Due / evidence required</th><th>State</th></tr></thead><tbody>${rows(m.obligations.map((o) => [`${o.title} — ${o.conditions}`, `${o.owner} / ${o.recipient}`, `${o.due ?? "Date needed"} (${o.due_basis}) — ${o.required_evidence}`, `${o.state} · receiving ${o.receiving_accepted ? "accepted" : "required"}`]))}</tbody></table><h2>Response and continuing responsibility</h2><p>${e(m.response_instructions)}</p><footer>Output ${e(prepared.id)} · Template ${e(m.template)} · Manifest ${e(hash(m))}. Fictional records; not for operational use.</footer></body></html>`;
}
export async function preparePack(
  p: Principal,
  id: string,
  manifest: PackProjection,
) {
  return prepareBundle(p, {
    output_id: id,
    kind: "OUT-13",
    audience: "Customer",
    manifest_hash: hash(manifest),
    template_version: acceptanceTemplate,
    html: (prepared) => packHtml(manifest, prepared),
    head: "Powerplants One · Stage handover",
    foot: manifest.stage.reference,
  });
}
export { readBundle };
