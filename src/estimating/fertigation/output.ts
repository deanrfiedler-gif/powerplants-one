import { findingGuidance } from "./guidance";
import type { Calculation, Scope } from "./types";

/** r02 (proposed feature F7): summary-first layout, plain-language findings
 * from the guidance phrase register, document control at the end. Retained
 * r01 outputs keep their stored bytes and template identity. */
export const outputTemplate = "PPO-FERT-NATIVE-REPORT-r02";
export type OutputBasis = {
  scope_id: string;
  reference: string;
  revision_id: string;
  revision_number: number;
  content_hash: string;
  source_revision_id: string;
  source_context_hash: string;
  created_at: string;
  calculation_edition: string;
};
export type ReportAudience = "customer" | "internal";
export type ReportContext = {
  author_id: string;
  review: {
    id: string;
    disposition: string;
    created_by: string;
    created_at: string;
    basis_hash: string;
  } | null;
};
export function reportModel(
  basis: OutputBasis,
  scope: Scope,
  calculation: Calculation,
  audience: ReportAudience,
  context?: ReportContext,
) {
  // Customer fields are selected BEFORE serialization. Free-text source labels,
  // notes, evidence attribution and internal register contents are never sent.
  const scenario = scope.scenarios.find(
    (s) => s.id === calculation.scenario_id,
  );
  const common = {
    template_id: outputTemplate,
    audience,
    basis,
    authorship: {
      author_id: context?.author_id ?? null,
      review: context?.review
        ? {
            id: context.review.id,
            disposition: context.review.disposition,
            created_by: context.review.created_by,
            created_at: context.review.created_at,
            basis_hash: context.review.basis_hash,
          }
        : null,
      engineering_approval: "not_configured",
    },
    operating_basis: {
      selected_scenario: scenario
        ? `Scenario ${scope.scenarios.indexOf(scenario) + 1}`
        : "None selected",
      phase: scenario?.phase ?? "unknown",
      included_phases: scenario?.include_future
        ? ["existing", "proposed", "future"]
        : ["existing", "proposed"],
      excluded_phases: scenario?.include_future
        ? ["excluded", "unknown"]
        : ["future", "excluded", "unknown"],
      flow_basis:
        "Connected flow is the active physical-valve inventory; operating peak is the selected group's unit-path maximum.",
      applicability:
        scope.production_context.application_method === "drip" &&
        scope.production_context.hydraulic_arrangement === "single_pass"
          ? "Bounded sequential single-pass drip planner; incomplete dependencies remain unknown."
          : "Capture context only; the selected process is not a validated consumption/timing/storage model.",
    },
    status:
      "Synthetic draft scoping report — not for construction or commissioning",
    production_context: {
      tags: scope.production_context.tags,
      growing_system: scope.production_context.growing_system,
      application_method: scope.production_context.application_method,
      hydraulic_arrangement: scope.production_context.hydraulic_arrangement,
    },
    metrics: {
      represented_area: calculation.area_m2,
      containers: calculation.containers,
      plants: calculation.plants,
      connected_flow: calculation.connected_flow_m3h,
      operating_peak: calculation.operating_peak_m3h,
      daily_demand: calculation.daily_demand_m3,
    },
    findings: calculation.findings.map((f) => ({
      id: f.id,
      severity: f.severity,
      field: f.field,
    })),
    candidates: calculation.candidates.map((c) => ({
      family:
        scope.candidates.find((x) => x.id === c.id)?.family ?? "Unspecified",
      status: c.status,
      failed_checks: c.failures.length,
      unresolved_checks: c.unknowns.length,
    })),
    boundaries: [
      "Manufacturer confirmation remains pending for exact configurations.",
      "Neutral production context does not establish a validated process model or regulatory approval.",
      "Unknown, unsupported and not-applicable results are retained explicitly; no missing value is zero.",
      "The first supported planner is a bounded sequential shared circuit. No operational commands are generated.",
    ],
  };
  // Even result reasons/dependencies may acquire internal descriptions in a
  // future engine edition. The customer projection keeps only typed fields.
  const metrics = Object.fromEntries(
    Object.entries(common.metrics).map(([key, r]) => [
      key,
      { value: r.value, unit: r.unit, state: r.state },
    ]),
  ) as Record<string, { value: number | null; unit: string; state: string }>;
  return audience === "customer"
    ? {
        ...common,
        metrics,
        findings: common.findings.map((f) => ({
          ...f,
          id: f.id.split(":")[0],
        })),
      }
    : {
        ...common,
        scope,
        calculation,
        scenario_label: scenario?.label ?? null,
      };
}
const escape = (value: unknown) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ]!,
  );
function table(headers: string[], rows: unknown[][], widths?: number[]) {
  if (!rows.length) return "<p>None recorded.</p>";
  const columns = widths
    ? `<colgroup>${widths.map((width) => `<col style="width:${width}%">`).join("")}</colgroup>`
    : "";
  return `<table${widths ? ' class="valve-register"' : ""}>${columns}<thead><tr>${headers.map((h) => `<th>${escape(h)}</th>`).join("")}</tr></thead><tbody>${rows.map((row) => `<tr>${row.map((value) => `<td>${escape(value === null ? "Unknown" : value)}</td>`).join("")}</tr>`).join("")}</tbody></table>`;
}
function internalReport(scope: Scope, calculation: Calculation) {
  const name = (rows: { id: string; label: string }[], id: string | null) =>
    id
      ? (rows.find((r) => r.id === id)?.label ?? "Unresolved reference")
      : "Unspecified";
  return `<h2 class="internal-registers">Internal scope registers</h2><p>${escape(scope.name)}</p><h3>Growing areas</h3>${table(
    ["Area", "Phase", "Represented area (m²)", "Measurement role"],
    scope.areas.map((a) => [a.label, a.phase, a.area_m2, a.area_basis]),
  )}<h3>Mainline / master valves</h3>${table(
    ["Master", "Phase", "Circuit", "Control owner"],
    scope.masters.map((m) => [m.label, m.phase, m.circuit, m.control.owner]),
  )}<h3>Irrigation valves</h3>${table(
    ["Valve", "Master", "Flow basis", "Flow (m³/h)", "State", "Links"],
    scope.valves.map((v) => {
      const flow = calculation.valve_flows.find((f) => f.id === v.id)?.flow;
      return [
        v.label,
        name(scope.masters, v.master_id),
        v.flow_basis.replaceAll("_", " "),
        flow?.value ?? null,
        flow?.state ?? "unknown",
        v.allocations.length,
      ];
    }),
    [30, 20, 18, 12, 10, 10],
  )}<h3>Operating groups</h3>${table(
    ["Group", "Phase", "Valves", "Delivery (s)", "Flush (s)"],
    scope.groups.map((g) => [
      g.label,
      g.phase,
      g.valve_ids.map((id) => name(scope.valves, id)).join("; "),
      g.delivery_seconds,
      g.flush_seconds,
    ]),
  )}<h3>Evidence references</h3>${table(
    ["Label", "Source revision", "Attribution", "Applicability", "SHA-256"],
    scope.evidence.map((e) => [
      e.label,
      e.source_revision,
      e.attribution,
      e.applicability,
      e.sha256,
    ]),
  )}<h3>Unresolved actions</h3>${table(
    ["Action", "Owner", "Status", "Due date"],
    scope.actions.map((a) => [a.label, a.owner, a.status, a.due_date]),
  )}<p>Full typed inputs and calculation are retained in the separately authorised native JSON export. This report is a register summary; it does not replace exact source evidence.</p>`;
}
const months = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
/** dd Month yyyy from the recorded UTC timestamp; locale-independent. */
const proseDate = (iso: string) => {
  const d = new Date(iso);
  return Number.isFinite(d.getTime())
    ? `${d.getUTCDate()} ${months[d.getUTCMonth()]} ${d.getUTCFullYear()}`
    : iso;
};
const metricLabels: Record<string, string> = {
  represented_area: "Represented area",
  containers: "Containers",
  plants: "Plants",
  connected_flow: "Connected flow",
  operating_peak: "Operating peak",
  daily_demand: "Daily demand",
};
const severityWords: Record<string, [string, string]> = {
  conflict: ["Conflicts", "Two recorded values cannot both hold."],
  incomplete: ["Incomplete", "A required input is missing."],
  review: ["For review", "Evidence or specialist judgement is still needed."],
};
export function reportHtml(model: ReturnType<typeof reportModel>) {
  const internalAudience = "scope" in model;
  const value = (r: { value: number | null; unit: string; state: string }) =>
    r.value === null
      ? escape(r.state.replaceAll("_", " "))
      : `${escape(Number(r.value.toPrecision(8)).toLocaleString("en-AU"))} <small>${escape(r.unit)}</small>`;
  const tiles = Object.entries(model.metrics)
    .map(
      ([name, r]) =>
        `<div class="tile"><span>${escape(metricLabels[name] ?? name.replaceAll("_", " "))}</span><strong>${value(r)}</strong></div>`,
    )
    .join("");
  const metricRows = Object.entries(model.metrics)
    .map(
      ([name, result]) =>
        `<tr><th>${escape(metricLabels[name] ?? name.replaceAll("_", " "))}</th><td>${result.value === null ? escape(result.state.replaceAll("_", " ")) : escape(result.value)}</td><td>${escape(result.unit)}</td></tr>`,
    )
    .join("");
  const counts = { conflict: 0, incomplete: 0, review: 0 } as Record<
    string,
    number
  >;
  for (const f of model.findings)
    counts[f.severity] = (counts[f.severity] ?? 0) + 1;
  const total = model.findings.length;
  const bar = total
    ? `<div class="bar" aria-hidden="true">${[
        "conflict",
        "incomplete",
        "review",
      ]
        .filter((k) => counts[k])
        .map((k) => `<span class="${k}" style="flex-grow:${counts[k]}"></span>`)
        .join("")}</div>`
    : "";
  // Plain-language groups keyed by finding code: registry text only, so the
  // customer allowlist is unaffected.
  const groups = ["conflict", "incomplete", "review"]
    .filter((severity) => counts[severity])
    .map((severity) => {
      const byCode = new Map<string, number>();
      for (const f of model.findings.filter((x) => x.severity === severity)) {
        const code = f.id.split(":")[0];
        byCode.set(code, (byCode.get(code) ?? 0) + 1);
      }
      const items = [...byCode.entries()]
        .map(([code, n]) => {
          const phrase =
            findingGuidance[code]?.customer ??
            code.replaceAll("_", " ").replace(/^./, (c) => c.toUpperCase());
          return `<li>${escape(phrase)}${n > 1 ? ` <span class="muted">(${n})</span>` : ""}${internalAudience ? ` <code>${escape(code)}</code>` : ""}</li>`;
        })
        .join("");
      return `<div class="group"><h3>${escape(severityWords[severity][0])} · ${counts[severity]}</h3><ul>${items}</ul></div>`;
    })
    .join("");
  const context = model.production_context;
  const contextRows = [
    ["Growing system", context.growing_system],
    ["Application method", context.application_method],
    ["Hydraulic arrangement", context.hydraulic_arrangement],
    ["Context tags", context.tags.join(", ")],
  ]
    .map(
      ([label, v]) =>
        `<tr><th>${escape(label)}</th><td>${escape(String(v).replaceAll("_", " "))}</td></tr>`,
    )
    .join("");
  const internal =
    "scope" in model ? internalReport(model.scope, model.calculation) : "";
  const operating = `<p>${escape(model.operating_basis.selected_scenario)}${"scenario_label" in model && model.scenario_label ? `: ${escape(model.scenario_label)}` : ""} · Phase ${escape(model.operating_basis.phase)}. Included record phases: ${escape(model.operating_basis.included_phases.join(", "))}; ${escape(model.operating_basis.excluded_phases.join(", "))} remain outside active results.</p><p>${escape(model.operating_basis.applicability)} ${escape(model.operating_basis.flow_basis)}</p>`;
  const review = `<p>Revision author: ${escape(model.authorship.author_id ?? "Not supplied")}. ${model.authorship.review ? `Review ${escape(model.authorship.review.id)}: ${escape(model.authorship.review.disposition)}; recorded by ${escape(model.authorship.review.created_by)} at ${escape(model.authorship.review.created_at)}. Exact review basis: <code>${escape(model.authorship.review.basis_hash)}</code>.` : "No authenticated review recorded for this exact revision."} Engineering approval is not configured.</p>`;
  const style = `body{font:13px/1.5 Verdana,Arial,sans-serif;color:#183348;max-width:1000px;margin:24px auto;padding:0 16px}
.head{display:flex;justify-content:space-between;gap:16px;font-size:11px;color:#51627a}.head strong{display:block;color:#183348;letter-spacing:1.2px;text-transform:uppercase}
.rule{height:3px;background:#62bb46;margin:10px 0 20px}h1{font-size:26px;margin:0}h2{font-size:15px;margin:22px 0 8px}h3{font-size:13px;margin:8px 0 2px}
.sub{font-size:16px;margin:6px 0 2px}.muted{color:#51627a}.notice{padding:10px 12px;border:2px solid #183348;margin:14px 0}
.tiles{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}.tile{border:1px solid #c9d1db;border-radius:4px;padding:9px 12px}.tile span{display:block;font-size:11px;color:#51627a}.tile strong{font-size:19px}.tile small{font-size:12px;font-weight:400}
.bar{display:flex;gap:2px;height:10px;margin:6px 0}.bar span{display:block}.bar .conflict{background:#c4553f}.bar .incomplete{background:#c4851a}.bar .review{background:#5b9bc0}
.groups{display:grid;grid-template-columns:1fr 1fr;gap:0 24px}ul{margin:2px 0 6px;padding-left:18px}
table{width:100%;border-collapse:collapse}th,td{padding:6px 8px;border:1px solid #c9d1db;text-align:left;vertical-align:top;overflow-wrap:anywhere}th{background:#f3f5f8;font-weight:700;width:34%}
.results td:nth-child(2){text-align:right}.valve-register{table-layout:fixed}.valve-register th{width:auto}thead{display:table-header-group}code{overflow-wrap:anywhere;font-size:11px}
.control{margin-top:16px;padding:10px 12px;background:#f3f5f8;border:1px solid #c9d1db;font-size:11px;color:#51627a}.control strong{color:#183348}
@page{size:A4;margin:16mm}@media print{body{margin:0;max-width:none;padding:0}tr{break-inside:avoid}h2,h3{break-after:avoid}.page{break-before:page}h2.internal-registers{break-before:page}}`;
  return `<!doctype html><html lang="en-AU"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Fertigation scope ${escape(model.basis.reference)}</title><style>${style}</style></head><body>
<div class="head"><div><strong>Powerplants One</strong>Priva Fertigation Configurator</div><div>${model.audience === "customer" ? "Customer" : "Internal"} audience<br>Template ${escape(model.template_id)}</div></div><div class="rule"></div>
<h1>Fertigation scope report</h1><p class="sub">${escape(model.basis.reference)} · Revision ${model.basis.revision_number}</p><p class="muted">${escape(proseDate(model.basis.created_at))} · calculation ${escape(model.basis.calculation_edition)}</p>
<p class="notice"><strong>${escape(model.status)}.</strong> It records the scope as entered on this revision. It does not imply readiness or approval.</p>
<h2>At a glance</h2><div class="tiles">${tiles}</div>
<h2>Where the scope stands</h2>${bar}<p><strong>${total}</strong> open ${total === 1 ? "check" : "checks"}: ${counts.conflict} conflicts, ${counts.incomplete} incomplete, ${counts.review} for review. ${Object.values(
    severityWords,
  )
    .map(([w, d]) => `${escape(w)}: ${escape(d)}`)
    .join(" ")}</p>
<h2>Production context</h2><table><tbody>${contextRows}</tbody></table>
<h2>Operating basis</h2>${operating}
<h2 class="page">Recorded scope results</h2><table class="results"><thead><tr><th>Result</th><th>Value or state</th><th>Unit</th></tr></thead><tbody>${metricRows}</tbody></table>
<h2>Open checks in plain terms</h2><p>${total} findings remain recorded against this exact revision. This report does not imply readiness or approval.</p><div class="groups">${groups}</div>
<h2>Candidate assessment</h2>${model.candidates.length ? "" : "<p>No configured candidate is recorded. Suitability remains unassessed.</p>"}<ul>${model.candidates.map((c) => `<li>${escape(c.family)}: ${escape(c.status.replaceAll("_", " "))}; ${c.failed_checks} failed checks and ${c.unresolved_checks} unresolved checks.</li>`).join("")}</ul>
<h2>Scope boundaries</h2><ul>${model.boundaries.map((b) => `<li>${escape(b)}</li>`).join("")}</ul>
<h2>Review and approval</h2>${review}
<div class="control"><strong>Document control</strong><br>Exact scope <code>${escape(model.basis.scope_id)}</code> · Revision <code>${escape(model.basis.revision_id)}</code><br>Content <code>${escape(model.basis.content_hash)}</code> · Discovery source <code>${escape(model.basis.source_revision_id)}</code><br>Calculation ${escape(model.basis.calculation_edition)} · Template ${escape(model.template_id)} · created ${escape(model.basis.created_at)}</div>
${internal}</body></html>`;
}

export function nativeExport(
  basis: OutputBasis,
  scope: Scope,
  calculation: Calculation,
) {
  return {
    format: "PPO-FERT-NATIVE-EXPORT-r01",
    synthetic: true,
    audience: "internal",
    basis,
    scope,
    calculation,
    exclusions: [
      "Original attachment/report bytes require separately authorised downloads.",
      "Authenticated review events and receiving receipts are not transferable approval.",
    ],
    reimport:
      "Import as a new draft with explicit canonical source mapping and remapped scope-owned identities.",
  };
}
export function csvCell(value: unknown): string {
  let text = value === null || value === undefined ? "" : String(value);
  if (/^[\s]*[=+@-]/.test(text)) text = `'${text}`;
  return `"${text.replaceAll('"', '""')}"`;
}
export function valveCsv(scope: Scope) {
  const header = [
    "format",
    "valve_id",
    "label",
    "phase",
    "intent",
    "master_id",
    "source_id",
    "flow_basis",
    "measured_flow_m3h",
    "design_flow_m3h",
    "allocation_id",
    "area_id",
    "crop_group_id",
    "container_count",
    "served_area_m2",
    "flow_share_fraction",
    "projection_limits",
  ];
  const rows = scope.valves.flatMap((v) =>
    (v.allocations.length ? v.allocations : [null]).map((a) => [
      "PPO-FERT-VALVES-r01",
      v.id,
      v.label,
      v.phase,
      v.intent,
      v.master_id,
      v.source_id,
      v.flow_basis,
      v.measured_flow_m3h,
      v.design_flow_m3h,
      a?.id,
      a?.area_id,
      a?.crop_group_id,
      a?.container_count,
      a?.served_area_m2,
      a?.flow_share_fraction,
      "Register projection only; use native JSON for full emitter/control/evidence/ownership context. Not lossless interchange.",
    ]),
  );
  return [header, ...rows]
    .map((row) => row.map(csvCell).join(","))
    .join("\r\n");
}
