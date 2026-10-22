import { createHash } from "node:crypto";
import type { Study } from "./model";
import type { Assessment, AssessmentResult } from "./assessment-model";
const esc = (v: unknown) =>
  String(v ?? "Unknown").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ]!,
  );
const table = (headers: string[], rows: unknown[][]) =>
  "<table><thead><tr>" +
  headers.map((h) => "<th>" + esc(h) + "</th>").join("") +
  "</tr></thead><tbody>" +
  rows
    .map(
      (r) =>
        "<tr>" + r.map((c) => "<td>" + esc(c) + "</td>").join("") + "</tr>",
    )
    .join("") +
  "</tbody></table>";
const shown = (v: { display: string; unit: string } | null) =>
  v ? v.display + " " + v.unit : "Not assessable";
export function assessmentOutputs(
  id: string,
  source: { id: string; content_hash: string; study: Study },
  input: Assessment,
  result: AssessmentResult,
) {
  const shell = (title: string, body: string) =>
    '<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>' +
    esc(title) +
    "</title><style>body{font:16px system-ui;margin:2rem;max-width:75rem;color:#162f38}table{border-collapse:collapse;width:100%;margin:1rem 0}th,td{border:1px solid #bccbd0;padding:.6rem;text-align:left;vertical-align:top;overflow-wrap:anywhere}pre{white-space:pre-wrap;overflow-wrap:anywhere}.process{display:flex;flex-wrap:wrap;gap:1rem}.process li{border:1px solid;padding:.7rem;margin-left:1rem}h1,h2,p{overflow-wrap:anywhere}@media(max-width:600px){body{margin:1rem}table{font-size:12px}th,td{padding:.2rem}}</style><main><h1>" +
    esc(title) +
    "</h1><p><strong>Internal estimating study — not for fabrication.</strong> No manufacturer approval, performance warranty, labour price or CPQ acceptance is implied.</p><p>Assessment " +
    esc(id) +
    " · Rule edition " +
    esc(result.edition) +
    " · Nursery source " +
    esc(source.id) +
    " · Source hash " +
    esc(source.content_hash) +
    "</p>" +
    body +
    "</main></html>";
  const process =
    '<h2>Concept process</h2><p>Recorded order; actual directed interfaces and phase applicability govern assessment. Geometry does not certify clearance or safety.</p><ol class="process">' +
    input.stages
      .map(
        (s) =>
          "<li>" +
          esc(s.name) +
          " · " +
          esc(s.phase) +
          " · " +
          esc(s.selection) +
          "</li>",
      )
      .join("") +
    "</ol>";
  const equipment = table(
    [
      "Stage",
      "Role / phase",
      "Configuration",
      "Disposition / selection",
      "Technical units",
      "Installation units",
      "Spares / waste",
      "Purchase",
    ],
    input.stages.map((s) => {
      const q = result.quantities.find((q) => q.stage_id === s.id)!;
      return [
        s.name,
        s.role + " / " + s.phase,
        (s.candidate_id ?? "No candidate") +
          " / " +
          (s.configuration ?? "Unconfirmed"),
        s.disposition + " / " + s.selection,
        shown(q.technical),
        shown(q.installation),
        shown(q.spare) + " / " + shown(q.waste),
        shown(q.purchase_units) + " (" + shown(q.purchase_packs) + ")",
      ];
    }),
  );
  const scenarios = table(
    [
      "Scenario / phase",
      "Capacity",
      "Rate basis",
      "Running time",
      "Good output",
      "Required output",
      "Quantity comparison",
    ],
    result.scenarios.map((r) => [
      source.study.scenarios.find((s) => s.id === r.scenario_id)?.name +
        " / " +
        r.phase,
      shown(r.line_rate),
      r.rate_basis,
      shown(r.running_minutes),
      shown(r.good_output),
      shown(r.target),
      r.target_state,
    ]),
  );
  const interfaces = table(
    ["Direction", "Scenarios", "Checks", "Buffer coverage"],
    input.connections.map((c) => [
      input.stages.find((s) => s.id === c.from_id)?.name +
        " → " +
        input.stages.find((s) => s.id === c.to_id)?.name,
      c.scenario_ids
        .map(
          (id) => source.study.scenarios.find((s) => s.id === id)?.name ?? id,
        )
        .join(", "),
      c.checks
        .map((k) => k.aspect + ": " + k.state + " (" + k.review.state + ")")
        .join("; "),
      shown(
        result.buffers.find((b) => b.connection_id === c.id)?.minutes ?? null,
      ),
    ]),
  );
  const evidence = JSON.stringify(
    { source: source.study, input, results: result },
    (key, value) =>
      ["owner", "next_action", "action"].includes(key) ? undefined : value,
    2,
  );
  const study = shell(
    input.name,
    "<p>Technical status: <strong>" +
      esc(result.technical_state) +
      "</strong>. Capacity and target comparisons are separate from equipment suitability and commercial readiness.</p>" +
      process +
      "<h2>Equipment and quantity schedule</h2>" +
      equipment +
      "<h2>Production scenarios</h2>" +
      scenarios +
      "<h2>Interfaces and utility evidence</h2>" +
      interfaces +
      "<h2>Technical findings</h2>" +
      table(
        ["Rule", "Subject", "Gate", "Finding"],
        result.findings.map((f) => [f.rule, f.subject, f.gate, f.message]),
      ) +
      "<h2>Saved inputs, assumptions and exact calculation evidence</h2><pre>" +
      esc(evidence) +
      "</pre>",
  );
  const clarifications = shell(
    input.name + " — internal clarifications",
    table(
      ["Stable key", "Rule", "Subject", "Finding", "Owner", "Next action"],
      result.findings.map((f) => [
        f.key,
        f.rule,
        f.subject,
        f.message,
        f.owner,
        f.action,
      ]),
    ),
  );
  const wrap = (html: string) => ({
    mime: "text/html" as const,
    html,
    hash: createHash("sha256").update(html).digest("hex"),
    byte_length: Buffer.byteLength(html),
  });
  return { study: wrap(study), clarifications: wrap(clarifications) };
}
