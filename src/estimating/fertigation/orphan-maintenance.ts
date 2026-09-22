import { lstat, realpath, unlink } from "node:fs/promises";
import { homedir } from "node:os";
import { isAbsolute, join, relative, resolve } from "node:path";
import { LocalSyntheticDocumentStore } from "../../documents/store";
import { localConfig } from "../../platform/config";
import { database, transaction } from "../../platform/database";
import type { QueryClient } from "../../platform/permissions";
import { uuid } from "../../shared/validation";

type Closed = {
  workspace_id: string;
  actor_id: string;
  operation_id: string;
  scope_id: string;
  command: string;
};
type ReferenceColumn = {
  table_name: string;
  column_name: string;
  data_type: string;
};
const identifier = (v: string) => `"${v.replaceAll('"', '""')}"`;
const ageMs = 24 * 60 * 60 * 1000;
const commands = ["AttachFertigationEvidence", "PrepareFertigationOutput"];
function directory() {
  return (
    process.env.PPO_DOCUMENT_DIRECTORY ??
    join(homedir(), ".ppo-synthetic-documents")
  );
}

/** Maintenance is deliberately conservative: any provider key or ordinary
 * record/operation identity reference in the live shared schema retains bytes. */
export async function hasStoredReference(
  c: QueryClient,
  workspaceId: string,
  itemId: string,
) {
  const columns = (
    await c.query<ReferenceColumn>(`SELECT c.table_name,c.column_name,c.data_type FROM information_schema.columns c
    JOIN information_schema.tables t ON (t.table_schema,t.table_name)=(c.table_schema,c.table_name)
    WHERE c.table_schema='ppo' AND t.table_type='BASE TABLE' AND c.table_name<>'fertigation_operation_closures'
      AND (c.data_type='jsonb' OR (c.data_type='uuid' AND c.column_name IN ('id','operation_id')))
      AND EXISTS(SELECT 1 FROM information_schema.columns w WHERE w.table_schema=c.table_schema AND w.table_name=c.table_name AND w.column_name='workspace_id')
    ORDER BY c.table_name,c.column_name LIMIT 513`)
  ).rows;
  if (columns.length > 512)
    throw Error(
      "Reference inventory exceeds the bounded local audit; retain the files.",
    );
  for (const row of columns) {
    const column = identifier(row.column_name),
      condition =
        row.data_type === "jsonb"
          ? `jsonb_path_exists(${column}, '$.**.item_id ? (@ == $item)',jsonb_build_object('item',$2::text))`
          : `${column}=$2::uuid`;
    if (
      (
        await c.query<{ found: boolean }>(
          `SELECT EXISTS(SELECT 1 FROM ppo.${identifier(row.table_name)} WHERE workspace_id=$1 AND ${condition}) AS found`,
          [workspaceId, itemId],
        )
      ).rows[0].found
    )
      return true;
  }
  return false;
}
export async function inspectClosedOrphan(
  c: QueryClient,
  row: Closed,
  root = directory(),
  now = Date.now(),
) {
  for (const [key, value] of Object.entries({
    workspace_id: row.workspace_id,
    actor_id: row.actor_id,
    operation_id: row.operation_id,
  }))
    uuid(value, key);
  if (!commands.includes(row.command))
    throw Error(
      "Only permanently closed native storage operations are eligible.",
    );
  const base = {
    workspace_id: row.workspace_id,
    actor_id: row.actor_id,
    operation_id: row.operation_id,
  };
  if (await hasStoredReference(c, row.workspace_id, row.operation_id))
    return {
      ...base,
      status: "Retained: shared reference",
      sha256: null,
      byte_length: null,
    };
  const saved = await new LocalSyntheticDocumentStore(root).locate(row);
  if (!saved)
    return { ...base, status: "Absent", sha256: null, byte_length: null };
  const file = await lstat(join(root, row.workspace_id, row.operation_id));
  return {
    ...base,
    status:
      now - file.mtimeMs < ageMs
        ? "Retained: minimum 24-hour age"
        : "Eligible closed orphan",
    sha256: saved.key.sha256,
    byte_length: saved.bytes.length,
  };
}
export async function auditClosedOrphans(workspaceId: string, offset = 0) {
  localConfig();
  uuid(workspaceId, "workspace_id");
  if (!Number.isSafeInteger(offset) || offset < 0 || offset > 1_000_000)
    throw Error("Use a non-negative audit offset no greater than 1000000.");
  const c = database(),
    rows = (
      await c.query<Closed>(
        "SELECT workspace_id,actor_id,operation_id,scope_id,command FROM ppo.fertigation_operation_closures WHERE workspace_id=$1 AND command=ANY($2::text[]) ORDER BY created_at,operation_id LIMIT 25 OFFSET $3",
        [workspaceId, commands, offset],
      )
    ).rows;
  const items = [];
  for (const row of rows) items.push(await inspectClosedOrphan(c, row));
  return {
    synthetic: true,
    provider: "Synthetic",
    offset,
    limit: 25,
    next_offset: rows.length === 25 ? offset + 25 : null,
    items,
  };
}
/** Removes one operator-reviewed exact file only, after all path and byte checks.
 * No directory traversal, recursive delete, manifest mutation or historical GC. */
export async function removeExactOrphan(
  root: string,
  workspaceId: string,
  actorId: string,
  operationId: string,
  sha256: string,
) {
  uuid(workspaceId, "workspace_id");
  uuid(actorId, "actor_id");
  uuid(operationId, "operation_id");
  if (!/^[a-f0-9]{64}$/.test(sha256) || !isAbsolute(root))
    throw Error(
      "Use an exact audited SHA-256 and absolute private document directory.",
    );
  const absolute = resolve(root),
    folder = join(absolute, workspaceId),
    target = join(folder, operationId);
  if (
    (await realpath(absolute)) !== absolute ||
    (await realpath(folder)) !== folder ||
    (await realpath(target)) !== target ||
    relative(absolute, target) !== join(workspaceId, operationId)
  )
    throw Error("Document paths changed; retain the file.");
  for (const path of [absolute, folder, target])
    if ((await lstat(path)).isSymbolicLink())
      throw Error("Linked document paths are not eligible for cleanup.");
  const value = await new LocalSyntheticDocumentStore(absolute).locate({
    workspace_id: workspaceId,
    actor_id: actorId,
    operation_id: operationId,
  });
  if (!value || value.key.sha256 !== sha256)
    throw Error("Exact orphan bytes changed; run the audit again.");
  await unlink(target);
}
export async function cleanupClosedOrphan(
  workspaceId: string,
  actorId: string,
  operationId: string,
  sha256: string,
) {
  localConfig();
  if (process.env.PPO_RECOVERY_STOPPED !== "application-worker-browser-stopped")
    throw Error(
      "Stop the local application, workers and browser, then set PPO_RECOVERY_STOPPED=application-worker-browser-stopped as required by the existing recovery policy.",
    );
  uuid(workspaceId, "workspace_id");
  uuid(actorId, "actor_id");
  uuid(operationId, "operation_id");
  return transaction(async (c) => {
    await c.query("SELECT 1 FROM ppo.workspaces WHERE id=$1 FOR UPDATE", [
      workspaceId,
    ]);
    await c.query("SELECT pg_advisory_xact_lock(hashtextextended($1,0))", [
      `${workspaceId}:${actorId}:${operationId}`,
    ]);
    const row = (
      await c.query<Closed>(
        "SELECT workspace_id,actor_id,operation_id,scope_id,command FROM ppo.fertigation_operation_closures WHERE workspace_id=$1 AND actor_id=$2 AND operation_id=$3",
        [workspaceId, actorId, operationId],
      )
    ).rows[0];
    if (!row)
      throw Error(
        "Permanently resolve the original operation without acceptance before cleanup.",
      );
    const result = await inspectClosedOrphan(c, row);
    if (result.status === "Absent") return result;
    if (result.status !== "Eligible closed orphan" || result.sha256 !== sha256)
      throw Error(
        "The exact orphan is not eligible; retain it and review a fresh audit.",
      );
    await removeExactOrphan(
      directory(),
      workspaceId,
      actorId,
      operationId,
      sha256,
    );
    return { ...result, status: "Removed exact closed orphan" };
  });
}
