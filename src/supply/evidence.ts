import { database } from "../platform/database";
import type { Principal } from "../platform/identity";
import { sharedOperation } from "../platform/operations";
import { AppError, unavailable } from "../platform/errors";
import {
  common,
  commonKeys,
  object,
  uuid,
  label,
  version,
} from "../shared/validation";
import { documentStore, digest } from "../documents/store";
import { inspectPng } from "../field/media";
import { captureCapability, currentVersion, supplyRecord } from "./context";
export async function uploadEvidence(p: Principal, id: string, input: unknown) {
  const r = object(input, [
    ...commonKeys,
    "id",
    "expected_version",
    "caption",
    "content_base64",
  ]);
  if (
    typeof r.content_base64 !== "string" ||
    r.content_base64.length > 2_666_668 ||
    !/^[A-Za-z0-9+/]*={0,2}$/.test(r.content_base64)
  )
    throw new AppError(422, "InvalidImage", "Choose a PNG up to 2 MB.");
  const bytes = Buffer.from(r.content_base64, "base64");
  inspectPng(bytes);
  const cmd = {
    ...common(r),
    id: uuid(r.id, "id"),
    expected_version: version(r.expected_version),
    record_id: id,
    caption: label(r.caption, "caption", 300),
    sha256: digest(bytes),
  };
  return sharedOperation(
    p,
    cmd,
    "Supply:Attachment",
    async (c) => {
      const record = await supplyRecord(c, p, id);
      return supplyRecord(c, p, id, captureCapability(record.kind));
    },
    async (c, record) => {
      currentVersion(record.version, cmd.expected_version);
      // Store and read exact bytes before making their immutable metadata available. A failed DB commit
      // leaves an unreferenced immutable file; replay uses the same storage identity and hash.
      const key = await documentStore().store(
        { ...p, operation_id: cmd.id },
        bytes,
        cmd.sha256,
      );
      const retained = await documentStore().read(
        { ...p, operation_id: cmd.id },
        key,
      );
      if (digest(retained) !== cmd.sha256)
        throw new AppError(
          503,
          "EvidenceUnavailable",
          "The exact stored evidence could not be verified.",
        );
      await c.query(
        "INSERT INTO ppo.supply_attachments(id,workspace_id,company_id,record_id,storage_key,sha256,byte_length,mime_type,caption,created_by) VALUES($1,$2,$3,$4,$5,$6,$7,'image/png',$8,$9)",
        [
          cmd.id,
          p.workspace_id,
          record.company_id,
          id,
          key,
          cmd.sha256,
          bytes.length,
          cmd.caption,
          p.actor_id,
        ],
      );
      const updated = (
        await c.query(
          "UPDATE ppo.supply_records SET version=version+1,updated_at=clock_timestamp(),updated_by=$3,last_reason=$4 WHERE workspace_id=$1 AND id=$2 RETURNING *",
          [p.workspace_id, id, p.actor_id, cmd.reason],
        )
      ).rows[0];
      return {
        id,
        version: updated.version,
        state: "EvidenceAvailable",
        updated_at: updated.updated_at,
        audit_details: { attachment_id: cmd.id, sha256: cmd.sha256 },
      };
    },
    "SupplyRecord",
    "SupplyRecorded",
  );
}
export async function evidenceBytes(p: Principal, id: string) {
  const file = (
    await database().query(
      "SELECT * FROM ppo.supply_attachments WHERE workspace_id=$1 AND id=$2",
      [p.workspace_id, uuid(id, "id")],
    )
  ).rows[0];
  if (!file) throw unavailable();
  await supplyRecord(database(), p, file.record_id);
  const bytes = await documentStore().read(
    { ...p, operation_id: id },
    file.storage_key,
  );
  if (digest(bytes) !== file.sha256 || bytes.length !== file.byte_length)
    throw new AppError(
      503,
      "EvidenceUnavailable",
      "The original evidence needs recovery; its reference is retained.",
    );
  return bytes;
}
