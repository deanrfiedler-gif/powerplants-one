import type { Principal } from "../platform/identity";
import type { QueryClient } from "../platform/permissions";
import { transaction } from "../platform/database";
import { AppError, unavailable } from "../platform/errors";
import { canonical } from "../platform/operations";
import { object, uuid } from "../shared/validation";
import { digest } from "../documents/store";
import { verifiedAttachmentBytes } from "../field/attachments";
import { reportContext } from "./context";

type PhotoSnapshot = {
  appointment: { id: string };
  attendance: { id: string; actor_id: string };
  entries: {
    id: string;
    version: number;
    kind: string;
    payload: { attachment_id?: string };
  }[];
  attachments: {
    id: string;
    version: number;
    sha256: string;
    byte_count: number;
  }[];
};
const missingPhoto = () =>
  new AppError(
    503,
    "ReportPhotoUnavailable",
    "The exact submitted photo is unavailable. Its original reference is retained; recover the original before reviewing it.",
  );

async function boundPhoto(
  c: QueryClient,
  p: Principal,
  reportId: string,
  revisionId: string,
  attachmentId: string,
) {
  // A report read or field assignment alone does not permit Service inspection.
  // Historical revisions remain inspectable by the current scoped review owner.
  const ctx = await reportContext(c, p, reportId, "report.review");
  const revision = (
    await c.query<{ snapshot: PhotoSnapshot; source_hash: string }>(
      "SELECT snapshot,source_hash FROM ppo.report_revisions WHERE workspace_id=$1 AND report_id=$2 AND id=$3",
      [p.workspace_id, reportId, revisionId],
    )
  ).rows[0];
  if (!revision) throw unavailable();
  const s = revision.snapshot;
  if (digest(canonical(s)) !== revision.source_hash) throw missingPhoto();
  if (
    s.appointment.id !== ctx.a.id ||
    s.attendance.id !== ctx.report.attendance_id ||
    s.attendance.actor_id !== ctx.report.actor_id
  )
    throw missingPhoto();
  const refs = s.attachments.filter((a) => a.id === attachmentId);
  const entries = s.entries.filter(
    (e) => e.kind === "Photo" && e.payload.attachment_id === attachmentId,
  );
  if (refs.length !== 1 || !entries.length) throw unavailable();
  const ref = refs[0];
  const boundEntries = (
    await c.query<{ id: string; version: number }>(
      `SELECT e.id,e.version FROM ppo.report_entry_refs r JOIN ppo.field_entries e
      ON (e.workspace_id,e.id,e.version)=(r.workspace_id,r.entry_id,r.entry_version)
      WHERE r.workspace_id=$1 AND r.report_revision_id=$2 AND e.kind='Photo'
      AND e.appointment_id=$3 AND e.attendance_id=$4 AND e.actor_id=$5
      AND e.payload->>'attachment_id'=$6 ORDER BY e.id`,
      [
        p.workspace_id,
        revisionId,
        ctx.a.id,
        ctx.report.attendance_id,
        ctx.report.actor_id,
        attachmentId,
      ],
    )
  ).rows;
  if (
    !entries.every((e) =>
      boundEntries.some((b) => b.id === e.id && b.version === e.version),
    )
  )
    throw missingPhoto();
  const file = (
    await c.query(
      "SELECT * FROM ppo.field_attachments WHERE workspace_id=$1 AND appointment_id=$2 AND attendance_id=$3 AND actor_id=$4 AND id=$5",
      [
        p.workspace_id,
        ctx.a.id,
        ctx.report.attendance_id,
        ctx.report.actor_id,
        attachmentId,
      ],
    )
  ).rows[0];
  if (
    !file ||
    file.access_class !== "RestrictedService" ||
    file.status !== "Available" ||
    file.media_type !== "image/png" ||
    file.version !== ref.version ||
    file.content_hash !== ref.sha256 ||
    file.byte_count !== ref.byte_count
  )
    throw missingPhoto();
  return file;
}

export async function reportPhotoBytes(
  p: Principal,
  id: string,
  input: unknown,
) {
  const q = object(input, ["revision_id", "attachment_id"]);
  const reportId = uuid(id, "report_id"),
    revisionId = uuid(q.revision_id, "revision_id"),
    attachmentId = uuid(q.attachment_id, "attachment_id");
  return transaction(async (c) => {
    const file = await boundPhoto(c, p, reportId, revisionId, attachmentId);
    let bytes: Buffer;
    try {
      bytes = await verifiedAttachmentBytes(p, file);
    } catch (e) {
      if (e instanceof AppError) throw missingPhoto();
      throw e;
    }
    // Storage may be slow. Re-read current owner, grants and attachment state
    // after retrieval, without substituting a newer revision or photograph.
    const current = await boundPhoto(c, p, reportId, revisionId, attachmentId);
    if (current.storage_item_id !== file.storage_item_id) throw missingPhoto();
    return { bytes, filename: `SYN-report-photo-${attachmentId}.png` };
  });
}
