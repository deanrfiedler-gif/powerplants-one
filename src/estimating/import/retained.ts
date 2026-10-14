import type { Principal } from "../../platform/identity";
import type { QueryClient } from "../../platform/permissions";
import type {
  DocumentKey,
  DocumentStoreAdapter,
} from "../../adapters/contracts";
import { transaction } from "../../platform/database";
import { unavailable, AppError } from "../../platform/errors";
import { documentStore, digest } from "../../documents/store";
import { uuid } from "../../shared/validation";
import {
  workspaceAuthority,
  revisionAuthority,
} from "../discovery-workspace-context";
import { estimateContext } from "../context";
import type { reviewWorkbook } from "./review";

type RetainedImport = {
  workspace_id: string;
  company_id: string;
  estimate_id: string;
  estimate_version_id: string;
  estimating_workspace_id: string;
  option_id: string;
  revision_id: string;
  operation_id: string;
  receipt_id: string;
  source_key: DocumentKey;
  review: ReturnType<typeof reviewWorkbook>;
  review_hash: string;
  confirmations: string[];
  created_by: string;
  created_at: Date;
  reason: string;
};
async function retainedAuthority(
  c: QueryClient,
  p: Principal,
  id: string,
  versionId: string,
  edit = false,
) {
  const row = (
    await c.query<RetainedImport>(
      "SELECT * FROM ppo.excel_imports WHERE workspace_id=$1 AND estimate_id=$2 AND estimate_version_id=$3",
      [p.workspace_id, uuid(id, "estimate_id"), uuid(versionId, "version_id")],
    )
  ).rows[0];
  if (!row) throw unavailable();
  const g = await workspaceAuthority(c, p, row.estimating_workspace_id, edit);
  await revisionAuthority(c, p, g, row.revision_id, edit);
  await estimateContext(
    c,
    p,
    id,
    edit ? "estimating.edit" : "estimating.read",
    versionId,
  );
  return row;
}
export async function excelReceiptAuthority(
  c: QueryClient,
  p: Principal,
  id: string,
  operationId: string,
) {
  const row = (
    await c.query(
      "SELECT estimate_version_id FROM ppo.excel_imports WHERE workspace_id=$1 AND estimate_id=$2 AND operation_id=$3 AND created_by=$4",
      [p.workspace_id, id, operationId, p.actor_id],
    )
  ).rows[0];
  if (!row) throw unavailable();
  return retainedAuthority(c, p, id, row.estimate_version_id, true);
}
export async function readExcelImport(
  p: Principal,
  id: string,
  versionId: string,
) {
  return transaction(async (c) => {
    const row = await retainedAuthority(c, p, id, versionId);
    const lines = (
      await c.query(
        "SELECT ordinal,line_ref,line_id,section_ref,source_ref,included,print FROM ppo.excel_import_lines WHERE workspace_id=$1 AND estimate_version_id=$2 ORDER BY ordinal",
        [p.workspace_id, versionId],
      )
    ).rows;
    return {
      state: "Imported",
      synthetic: true,
      durable: true,
      estimate_id: id,
      estimate_version_id: versionId,
      operation_id: row.operation_id,
      receipt_id: row.receipt_id,
      proposal: row.review,
      review: {
        recorded: true,
        hash: row.review_hash,
        confirmations: row.confirmations,
        actor_id: row.created_by,
        recorded_at: row.created_at,
        reason: row.reason,
      },
      lines,
      source_retained: true,
    };
  });
}
export async function readExcelSource(
  p: Principal,
  id: string,
  versionId: string,
  store: DocumentStoreAdapter = documentStore(),
) {
  const row = await transaction((c) => retainedAuthority(c, p, id, versionId));
  const bytes = await store.read(
    { ...p, operation_id: row.operation_id },
    row.source_key,
  );
  if (
    bytes.byteLength !== row.review.file.bytes ||
    digest(bytes) !== row.review.file.sha256
  )
    throw new AppError(
      503,
      "ExcelSourceVerificationFailed",
      "The retained original workbook could not be verified.",
    );
  // Permission can change during external storage I/O.
  await transaction((c) => retainedAuthority(c, p, id, versionId));
  return { bytes, name: row.review.file.name, sha256: row.review.file.sha256 };
}
