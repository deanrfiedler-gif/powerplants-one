import { png } from "./field";
import { hashBytes } from "../../src/service/escalations/model";
import { createAsset } from "../../src/shared/commands";
import { randomUUID } from "node:crypto";
import { confirmed, principal, base } from "./packs";
import { readFindings } from "../../src/service/findings/reads";
import {
  createCase,
  commandCase,
  recordSupportRoute,
} from "../../src/service/escalations/commands";
import { caseOptions, readCase } from "../../src/service/escalations/reads";
import { database } from "../../src/platform/database";
export { principal, base };
export async function escalationFixture() {
  const appointment = await confirmed(),
    p = await principal();
  const finding = (
    await readFindings(p, { source: "schedule", q: appointment.display_number })
  ).items[0];
  if (!finding) throw Error("Expected native scheduling follow-up");
  // The seed intentionally invents no manufacturer. This test explicitly authors
  // equipment using the fictional manufacturer already present in accepted frame 04.
  const equipmentId = randomUUID();
  await createAsset(p, {
    ...base(),
    id: equipmentId,
    company_id: finding.company_id,
    site_id: finding.site.id,
    description: "SYN escalation test controller",
    identity_status: "Unresolved",
    manufacturer: "SYN Boiler Controls",
    model: "BC-200",
    serial: `SYN-${equipmentId}`,
    effective_at: "2026-09-01T00:00:00.000Z",
    configuration: "SYN firmware 4.1; observation only; no settings changed",
    warranty_end: "2027-03-31",
  });
  const options = await caseOptions(p, { finding_key: finding.id });
  const asset = options.equipment.find((a) => a.id === equipmentId);
  if (!asset)
    throw Error("Expected permitted seeded equipment with manufacturer");
  const id = randomUUID(),
    command = {
      ...base(),
      id,
      finding_key: finding.id,
      asset_id: asset.id,
      owner_id: p.actor_id,
      fault: "SYN controller reading intermittently unavailable",
      fault_type: "Controller communications",
    };
  const receipt = await createCase(p, command);
  return { p, id, command, receipt, finding, asset };
}
export async function act(
  f: Awaited<ReturnType<typeof escalationFixture>>,
  action: string,
  fields: Record<string, unknown> = {},
) {
  const d = await readCase(f.p, f.id);
  const cmd = {
    ...base(),
    expected_version: d.record.version,
    action,
    ...fields,
  };
  return { receipt: await commandCase(f.p, f.id, cmd), cmd };
}
export async function preparedEscalation() {
  const f = await escalationFixture();
  await act(f, "diagnose", {
    attempted_at: new Date().toISOString(),
    diagnostic: "SYN inspected external status indicators",
    result: "Intermittent indicator remains; no controller settings changed",
    source_reference: "SYN technical observation",
  });
  const photo = png();
  await act(f, "photo", {
    media_type: "image/png",
    content_base64: photo.toString("base64"),
    sha256: hashBytes(photo),
    confirmed_exclusions: true,
  });
  await act(f, "capture_configuration");
  await act(f, "prepare_pack");
  const d = await readCase(f.p, f.id),
    pack = d.packs[0];
  await act(f, "review_pack", {
    pack_id: pack.id,
    html_sha256: pack.html_sha256,
    pdf_sha256: pack.pdf_sha256,
    confirmed_exclusions: true,
  });
  await recordSupportRoute(f.p, f.asset.id, {
    ...base(),
    expected_version: d.equipment.version,
    method: "Email",
    recipient: "synthetic-support@example.invalid",
  });
  return f;
}
export async function sentEscalation() {
  const f = await preparedEscalation(),
    d = await readCase(f.p, f.id);
  await act(f, "record_sent", {
    pack_id: d.record.reviewed_pack_id,
    sent_at: new Date().toISOString(),
    sent_by: f.p.actor_id,
    method: "Email",
    recipient: "synthetic-support@example.invalid",
    manufacturer_reference: "SYN manufacturer reference 1",
    reply_expected_at: new Date(Date.now() + 86400000).toISOString(),
  });
  return f;
}
export async function repliedEscalation() {
  const f = await sentEscalation();
  await act(f, "record_reply", {
    received_at: new Date().toISOString(),
    reply: "SYN manufacturer recommends checking the sensor input",
    advice: "Record a new reading and compare it with the retained evidence",
    settings_change: true,
    attachments: [
      {
        media_type: "image/png",
        content_base64: png().toString("base64"),
        sha256: hashBytes(png()),
      },
    ],
  });
  return f;
}
export async function nativeLedger() {
  return (
    await database().query(
      "SELECT (SELECT count(*) FROM ppo.operation_receipts)::int receipts,(SELECT count(*) FROM ppo.outbox_jobs)::int jobs,(SELECT count(*) FROM ppo.service_escalation_cases)::int cases",
    )
  ).rows[0];
}
