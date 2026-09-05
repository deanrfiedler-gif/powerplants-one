import { deflateSync } from "node:zlib";
import { randomUUID } from "node:crypto";
import { issued, principal, base, rows } from "./packs";
import { acknowledgePack, readPack } from "../../src/documents/packs";
import { readFieldJob } from "../../src/field/reads";
import { startAttendance } from "../../src/field/start";
import {
  initiateAttachment,
  uploadAttachment,
  finaliseAttachment,
} from "../../src/field/attachments";
import { digest } from "../../src/documents/store";
export { principal, base, rows };
export function png(width = 96, height = 64) {
  function crc(b: Buffer) {
    let v = 0xffffffff;
    for (const x of b) {
      v ^= x;
      for (let i = 0; i < 8; i++) v = (v >>> 1) ^ (v & 1 ? 0xedb88320 : 0);
    }
    return (v ^ 0xffffffff) >>> 0;
  }
  function chunk(t: string, b: Buffer) {
    const x = Buffer.alloc(b.length + 12);
    x.writeUInt32BE(b.length);
    x.write(t, 4);
    b.copy(x, 8);
    x.writeUInt32BE(crc(x.subarray(4, b.length + 8)), b.length + 8);
    return x;
  }
  const h = Buffer.alloc(13);
  h.writeUInt32BE(width);
  h.writeUInt32BE(height, 4);
  h[8] = 8;
  h[9] = 2;
  const b = Buffer.alloc((width * 3 + 1) * height);
  for (let y = 0; y < height; y++)
    for (let x = 0; x < width; x++) {
      const n = y * (width * 3 + 1) + 1 + x * 3;
      b[n] = x < width / 2 ? 23 : 52;
      b[n + 1] = x < width / 2 ? 61 : 128;
      b[n + 2] = x < width / 2 ? 80 : 95;
    }
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk("IHDR", h),
    chunk("IDAT", deflateSync(b)),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}
export async function acknowledged() {
  const q = await issued();
  for (const profile of ["assigned-technician", "second-technician"]) {
    const p = await principal(profile),
      pack = (await readPack(q.p, q.pack.id)).items[0],
      recipient = pack.readiness.recipients.find(
        (x: {user_id: string}) => x.user_id === p.actor_id,
      )!;
    await acknowledgePack(p, q.issue_id, {
      ...base(),
      assignment_id: recipient.assignment_id,
      assignment_version: recipient.assignment_version,
      presented_hash: pack.issues[0].output_hash,
      captured_at: new Date().toISOString(),
    });
  }
  return q;
}
export function startInput(
  job: Awaited<ReturnType<typeof readFieldJob>>["items"][number],
) {
  return {
    ...base(),
    expected_version: job.version,
    schedule_version: job.schedule_version,
    assignment_id: job.assignment.id,
    assignment_version: job.assignment_version,
    issue_id: job.pack!.current_issue_id,
    issue_hash: job.pack!.output_hash,
    scope_revision_id: job.scope_revision_id,
    scope_version: job.scope_version,
    captured_at: new Date().toISOString(),
  };
}
export async function started() {
  const q = await acknowledged(),
    p = await principal("assigned-technician"),
    job = (await readFieldJob(p, q.pack.appointment_id)).items[0],
    cmd = startInput(job),
    receipt = await startAttendance(p, job.id, cmd);
  return {
    ...q,
    p,
    cmd,
    startReceipt: receipt,
    job: (await readFieldJob(p, job.id)).items[0],
  };
}
export function entry(
  job: Awaited<ReturnType<typeof readFieldJob>>["items"][number],
  kind = "Observation",
  payload: unknown = {
    finding: "SYN visual inspection found a loose external label",
    confidence: "Suspected",
    attempted_fix: "SYN attempted to read the label without intervention",
    result: "Still unclear; no identity verification",
    follow_up_required: true,
  },
) {
  const t = job.scope.items[0];
  return {
    ...base(),
    id: randomUUID(),
    appointment_id: job.id,
    attendance_id: job.attendance!.id,
    kind,
    scope_item_id: t.id,
    asset_id: t.assets[0]?.id ?? null,
    captured_at: new Date().toISOString(),
    payload,
  };
}
export function timePayload(offset = 0) {
  const now = Math.floor(Date.now() / 1000) * 1000 - 7200000 + offset;
  return {
    time_kind: "Labour",
    start_at: new Date(now).toISOString(),
    end_at: new Date(now + 5400000).toISOString(),
    note: "SYN exact 90-minute component interval",
  };
}
export const materialPayload = () => ({
  movement_kind: "Consumed",
  item_reference: null,
  description: "SYN fictional label sleeve",
  quantity: "2",
  uom: "EA",
  lot: null,
  serial: null,
  source_reference: null,
  stock_status: "Unknown",
});
export async function photo(
  job: Awaited<ReturnType<typeof readFieldJob>>["items"][number],
  p: Awaited<ReturnType<typeof principal>>,
  bytes = png(),
) {
  const id = randomUUID(),
    cmd = {
      ...base(),
      id,
      appointment_id: job.id,
      attendance_id: job.attendance!.id,
      filename: "SYN-inspection.png",
      media_type: "image/png",
      byte_count: bytes.length,
      sha256: digest(bytes),
    };
  await initiateAttachment(p, cmd);
  const upload = {
    ...base(),
    expected_version: 1,
    content_base64: bytes.toString("base64"),
  };
  const result = await uploadAttachment(p, id, upload);
  await finaliseAttachment(p, id, {
    ...base(),
    expected_version: result.receipt.record_version,
  });
  return { id, cmd, upload, bytes };
}
export function draft(
  job: Awaited<ReturnType<typeof readFieldJob>>["items"][number],
  outcome = "Partial",
) {
  return {
    ...base(),
    id: job.draft?.id ?? randomUUID(),
    attendance_id: job.attendance!.id,
    expected_version: job.draft?.version ?? 0,
    scope_outcome: outcome,
    work_performed: "SYN visual inspection performed within original scope",
    exclusions: "SYN no intervention or energised work",
    remaining_work:
      outcome === "Complete"
        ? "SYN no remaining task claimed; reviewer acceptance remains outstanding"
        : "SYN remaining inspection needs service-owner review",
    time_declaration: job.entries.some((e) => e.kind === "Time")
      ? "AllRecorded"
      : "None",
    material_declaration: job.entries.some((e) => e.kind === "Material")
      ? "AllRecorded"
      : "None",
    declaration_reason:
      "SYN explicit personal declaration, no approval or billing",
    task_outcomes: job.scope.items.map((t: {id:string}) => ({
      scope_item_id: t.id,
      outcome,
      reason: "SYN explicit task outcome and remaining-work reason",
    })),
    entries: job.entries
      .filter((e) => !e.superseded)
      .map((e) => ({ id: e.id, version: e.version })),
    required_attachment_ids: job.attachments
      .filter((x) => x.status !== "Rejected")
      .map((x) => x.id),
  };
}
