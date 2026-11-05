import { launchDocumentBrowser } from "../../platform/browser";
import { escapeHtml } from "../../documents/render";
import { invalid, object } from "../../shared/validation";
import { hashBytes, sha } from "./model";

// A second boundary after the typed projection: neither structured source objects
// nor arbitrary source JSON are ever serialized into a manufacturer output.
export function redactedTechnical(value: string) {
  return value
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "[contact left out]")
    .replace(
      /(?:[$£€]\s*|\b(?:AUD|USD|GBP|EUR)\s*)\d[\d,.]*/gi,
      "[price left out]",
    )
    .replace(/\+\d[\d ()-]{7,}\d/g, "[contact left out]");
}
export type TechnicalEvidence = {
  schema_version: 1;
  case_reference: string;
  fault: string;
  site: string;
  equipment: {
    reference: string;
    manufacturer: string | null;
    model: string | null;
    serial: string | null;
  };
  configuration: {
    source_id: string;
    revision: number;
    description: string;
    sha256: string;
  };
  diagnostics: {
    attempted_at: string;
    recorded_by: string;
    diagnostic: string;
    result: string;
    source_reference: string;
  }[];
  observations: {
    attempt_id: string;
    occurred_at: string | null;
    state: string;
    readings: {
      check: string;
      value: string;
      unit: string;
      instrument: string;
      calibration: string;
    }[];
  }[];
  finding: {
    reference: string;
    source: string;
    state: string;
    summary: string;
    correction: { note: string; recorded_at: string | null } | null;
  };
  photos: {
    id: string;
    media_type: string;
    sha256: string;
    bytes: number;
    content_base64: string;
  }[];
};
export function evidenceHtml(input: TechnicalEvidence) {
  const t = (v: unknown) =>
    escapeHtml(redactedTechnical(String(v ?? "Not recorded")));
  // Revalidate the image boundary even when a caller bypasses the database loader.
  for (const photo of input.photos)
    fileInput(
      {
        media_type: photo.media_type,
        content_base64: photo.content_base64,
        sha256: photo.sha256,
      },
      true,
    );
  // Explicit projection, including nested arrays. Extra contact/price properties are ignored.
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src data:; style-src 'unsafe-inline'"><title>${t(input.case_reference)} evidence</title><style>body{font:14px Roboto,Verdana,sans-serif;color:#242a37;margin:32px;line-height:1.5}h1{font-size:24px}h2{font-size:18px;border-bottom:2px solid #62bb46;padding-bottom:8px}article{break-inside:avoid;margin:16px 0}img{max-width:100%;max-height:480px}code{overflow-wrap:anywhere;font-size:11px}table{border-collapse:collapse;width:100%}td,th{padding:8px;border:1px solid #ccd3dd;text-align:left}.notice{background:#f1f4f8;padding:12px}</style></head><body><header><p>Synthetic prototype · technical evidence · not for operational use</p><h1>${t(input.fault)}</h1><p>${t(input.case_reference)} · ${t(input.site)}</p></header><h2>Equipment</h2><p>${t(input.equipment.reference)} · ${t(input.equipment.manufacturer)} · ${t(input.equipment.model)} · ${t(input.equipment.serial)}</p><h2>Diagnostics already tried</h2>${input.diagnostics.map((d) => `<article><strong>${t(d.diagnostic)}</strong><p>${t(d.result)}</p><p>${t(d.recorded_by)} · ${t(d.attempted_at)} · ${t(d.source_reference)}</p></article>`).join("")}<h2>Read-only configuration</h2><p>Settings belong to the grower. No settings are changed here.</p><p>${t(input.configuration.description)}</p><p>Revision ${t(input.configuration.revision)} · <code>${t(input.configuration.sha256)}</code></p><h2>Inspection attempts and readings</h2>${input.observations.map((a) => `<article><p>${t(a.attempt_id)} · ${t(a.occurred_at)} · ${t(a.state)}</p><table><thead><tr><th>Check</th><th>Reading</th><th>Instrument</th><th>Calibration</th></tr></thead><tbody>${a.readings.map((r) => `<tr><td>${t(r.check)}</td><td>${t(r.value)} ${t(r.unit)}</td><td>${t(r.instrument)}</td><td>${t(r.calibration)}</td></tr>`).join("")}</tbody></table></article>`).join("") || "<p>No permitted inspection readings linked.</p>"}<h2>Finding</h2><p>${t(input.finding.reference)} · ${t(input.finding.source)} · ${t(input.finding.state)}</p><p>${t(input.finding.summary)}</p>${input.finding.correction ? `<p>Recorded correction · ${t(input.finding.correction.recorded_at)}</p><p>${t(input.finding.correction.note)}</p>` : "<p>No correction recorded on this source.</p>"}<h2>Reviewed technical photos</h2>${input.photos.map((p) => `<article><img alt="Reviewed technical evidence" src="data:${p.media_type};base64,${p.content_base64}"><p>${t(p.bytes)} bytes · SHA-256 <code>${t(p.sha256)}</code></p></article>`).join("") || "<p>No reviewed technical photos.</p>"}<p class="notice">Customer contact details and prices · left out. This pack names the site, not customer contacts. PPO sends nothing.</p></body></html>`;
}
export async function renderEvidence(input: TechnicalEvidence) {
  const html = evidenceHtml(input),
    browser = await launchDocumentBrowser();
  try {
    const context = await browser.newContext({ javaScriptEnabled: false });
    await context.route("**/*", (r) => r.abort());
    const page = await context.newPage();
    await page.setContent(html, { waitUntil: "load", timeout: 30000 });
    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      tagged: true,
      margin: { top: "15mm", bottom: "15mm", left: "15mm", right: "15mm" },
    });
    if (!pdf.subarray(0, 5).equals(Buffer.from("%PDF-")))
      throw Error("Invalid evidence PDF");
    return {
      html,
      pdf,
      html_sha256: hashBytes(html),
      pdf_sha256: hashBytes(pdf),
      renderer_version: `SV08/1 Chrome/${browser.version()}`,
    };
  } finally {
    await browser.close();
  }
}
export function fileInput(input: unknown, photo = false) {
  const r = object(input, ["media_type", "content_base64", "sha256"]);
  if (
    typeof r.content_base64 !== "string" ||
    r.content_base64.length > 2800000 ||
    !/^[A-Za-z0-9+/]*={0,2}$/.test(r.content_base64)
  )
    invalid("content_base64", "Choose a file up to 2 MB.");
  const bytes = Buffer.from(r.content_base64 as string, "base64");
  if (
    !bytes.length ||
    bytes.length > 2097152 ||
    bytes.toString("base64") !== r.content_base64
  )
    invalid("content_base64", "Use an exact base64 file up to 2 MB.");
  const mime = r.media_type;
  const signature =
    mime === "image/png"
      ? bytes
          .subarray(0, 8)
          .equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
      : mime === "image/jpeg"
        ? bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255
        : !photo &&
          mime === "application/pdf" &&
          bytes.subarray(0, 5).equals(Buffer.from("%PDF-"));
  if (!signature)
    invalid(
      "media_type",
      photo
        ? "Use a PNG or JPEG technical photo."
        : "Use a PNG, JPEG or PDF attachment.",
    );
  const digest = sha(r.sha256, "sha256");
  if (hashBytes(bytes) !== digest)
    invalid("sha256", "The attachment bytes do not match their hash.");
  return { bytes, sha256: digest, media_type: mime as string };
}
