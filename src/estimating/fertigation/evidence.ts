import type { Principal } from "../../platform/identity";
import type { DocumentKey } from "../../adapters/contracts";
import { database } from "../../platform/database";
import { sharedOperation } from "../../platform/operations";
import { AppError, unavailable } from "../../platform/errors";
import {
  object,
  common,
  commonKeys,
  uuid,
  version,
  label,
  invalid,
} from "../../shared/validation";
import { inspectPng } from "../../field/media";
import { documentStore, digest } from "../../documents/store";
import { expected } from "../service";
import { scopeRecord, savedRevision, writable, notClosed } from "./context";

export const evidenceLimit = 4_194_304;
export async function attachEvidence(
  p: Principal,
  id: string,
  value: unknown,
  bytes: Buffer,
) {
  const r = object(value, [
    ...commonKeys,
    "expected_version",
    "revision_id",
    "label",
    "filename",
    "source_revision",
    "attribution",
    "applicability",
  ]);
  const filename = label(r.filename, "filename", 100);
  if (
    !/^[A-Za-z0-9][A-Za-z0-9 _.-]{0,90}\.png$/.test(filename) ||
    filename.includes("..")
  )
    invalid(
      "filename",
      "Use a short PNG filename with letters, numbers, spaces, dots, underscores or hyphens.",
    );
  inspectPng(bytes);
  const input = {
    ...common(r),
    scope_id: uuid(id, "scope_id"),
    expected_version: version(r.expected_version),
    revision_id: uuid(r.revision_id, "revision_id"),
    label: label(r.label, "label", 200),
    filename,
    source_revision: label(r.source_revision, "source_revision", 200),
    attribution: label(r.attribution, "attribution", 200),
    applicability: label(r.applicability, "applicability", 1000),
    sha256: digest(bytes),
    byte_length: bytes.length,
  };
  return sharedOperation(
    p,
    input,
    "AttachFertigationEvidence",
    async (c) => {
      await notClosed(c, p, input.operation_id);
      const scope = await scopeRecord(c, p, id, true);
      await savedRevision(c, p, scope, input.revision_id, true);
      return scope;
    },
    async (c, scope) => {
      expected(scope.version, input.expected_version);
      await writable(c, p, scope);
      if (scope.current_revision_id !== input.revision_id)
        throw new AppError(
          409,
          "FertigationEvidenceStale",
          "The scope changed during file selection. Review the current revision before attaching these bytes.",
        );
      // Validate the bounded PNG before storage. The immutable private object is
      // addressed by the original operation; retries cannot replace its bytes.
      // A failed database commit may leave an inaccessible orphan in the adapter;
      // no download exists without the authorised committed manifest below.
      const key = await documentStore().store(
        {
          workspace_id: p.workspace_id,
          actor_id: p.actor_id,
          operation_id: input.operation_id,
        },
        bytes,
        input.sha256,
      );
      await c.query(
        `INSERT INTO ppo.fertigation_evidence(id,workspace_id,company_id,scope_id,revision_id,label,filename,mime_type,byte_length,sha256,document_key,source_revision,attribution,applicability,created_by) VALUES($1,$2,$3,$4,$5,$6,$7,'image/png',$8,$9,$10,$11,$12,$13,$14)`,
        [
          input.operation_id,
          p.workspace_id,
          scope.company_id,
          id,
          input.revision_id,
          input.label,
          input.filename,
          input.byte_length,
          input.sha256,
          key,
          input.source_revision,
          input.attribution,
          input.applicability,
          p.actor_id,
        ],
      );
      return {
        ...scope,
        audit_details: {
          revision_id: input.revision_id,
          evidence_id: input.operation_id,
          sha256: input.sha256,
        },
      };
    },
    "FertigationScope",
    "FertigationScopeSaved",
  );
}
type EvidenceRow = {
  id: string;
  revision_id: string;
  filename: string;
  label: string;
  sha256: string;
  document_key: DocumentKey;
  mime_type: string;
  byte_length: number;
  source_revision: string;
  attribution: string;
  applicability: string;
};
export async function readEvidence(
  p: Principal,
  id: string,
  evidenceId: string,
) {
  const scope = await scopeRecord(database(), p, id),
    row = (
      await database().query<EvidenceRow>(
        "SELECT * FROM ppo.fertigation_evidence WHERE workspace_id=$1 AND scope_id=$2 AND id=$3",
        [p.workspace_id, id, uuid(evidenceId, "evidence_id")],
      )
    ).rows[0];
  if (!row) throw unavailable();
  await savedRevision(database(), p, scope, row.revision_id);
  const bytes = await documentStore().read(
    {
      workspace_id: p.workspace_id,
      actor_id: p.actor_id,
      operation_id: row.id,
    },
    row.document_key,
  );
  if (bytes.length !== row.byte_length || digest(bytes) !== row.sha256)
    throw new AppError(
      409,
      "FertigationEvidenceMismatch",
      "The retained original evidence requires recovery.",
    );
  return { bytes, filename: row.filename, sha256: row.sha256 };
}
export async function listEvidence(p: Principal, id: string) {
  const scope = await scopeRecord(database(), p, id),
    rows = (
      await database().query<EvidenceRow>(
        "SELECT id,revision_id,label,filename,mime_type,byte_length,sha256,source_revision,attribution,applicability FROM ppo.fertigation_evidence WHERE workspace_id=$1 AND scope_id=$2 ORDER BY created_at DESC,id DESC LIMIT 50",
        [p.workspace_id, id],
      )
    ).rows,
    result: Omit<EvidenceRow, "document_key">[] = [];
  for (const row of rows) {
    try {
      await savedRevision(database(), p, scope, row.revision_id);
      result.push(row);
    } catch (e) {
      if (e instanceof AppError && (e.status === 403 || e.status === 404))
        continue;
      throw e;
    }
  }
  return {
    items: result,
    policy:
      "Validated bounded PNG only. No malware scanner is configured; validation is not a clean-file certification. Other file types require a separately reviewed adapter policy.",
  };
}
