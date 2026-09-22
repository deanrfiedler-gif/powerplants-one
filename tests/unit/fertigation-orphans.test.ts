import assert from "node:assert/strict";
import { test } from "node:test";
import { randomUUID } from "node:crypto";
import {
  mkdtemp,
  realpath,
  utimes,
  unlink,
  rmdir,
  stat,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { QueryClient } from "../../src/platform/permissions";
import { LocalSyntheticDocumentStore, digest } from "../../src/documents/store";
import {
  hasStoredReference,
  inspectClosedOrphan,
  removeExactOrphan,
} from "../../src/estimating/fertigation/orphan-maintenance";
function references(found = false) {
  return {
    query: async (sql: string) => ({
      rows: sql.includes("information_schema")
        ? [
            {
              table_name: "retained_documents",
              column_name: "manifest",
              data_type: "jsonb",
            },
            {
              table_name: "operation_receipts",
              column_name: "operation_id",
              data_type: "uuid",
            },
          ]
        : [{ found }],
    }),
  } as unknown as QueryClient;
}
test("FN-T39 closed orphan audit conservatively retains shared references and bounds schema inventory", async () => {
  assert.equal(
    await hasStoredReference(references(true), randomUUID(), randomUUID()),
    true,
  );
  const c = {
    query: async () => ({
      rows: Array.from({ length: 513 }, () => ({
        table_name: "x",
        column_name: "id",
        data_type: "uuid",
      })),
    }),
  } as unknown as QueryClient;
  await assert.rejects(
    hasStoredReference(c, randomUUID(), randomUUID()),
    /bounded local audit/,
  );
});
test("FN-T39 local orphan cleanup checks age, exact bytes and canonical paths; retains other files", async () => {
  const temp = await realpath(tmpdir()),
    root = await realpath(
      await mkdtemp(join(temp, "ppo-fertigation-orphans-")),
    ),
    workspace_id = randomUUID(),
    actor_id = randomUUID(),
    operation_id = randomUUID(),
    other = randomUUID(),
    bytes = Buffer.from("SYN uncommitted evidence bytes"),
    store = new LocalSyntheticDocumentStore(root);
  const row = {
    workspace_id,
    actor_id,
    operation_id,
    scope_id: randomUUID(),
    command: "AttachFertigationEvidence",
  };
  try {
    await store.store(row, bytes, digest(bytes));
    await store.store({ ...row, operation_id: other }, bytes, digest(bytes));
    assert.equal(
      (await inspectClosedOrphan(references(), row, root)).status,
      "Retained: minimum 24-hour age",
    );
    const old = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
    await utimes(join(root, workspace_id, operation_id), old, old);
    assert.equal(
      (await inspectClosedOrphan(references(true), row, root)).status,
      "Retained: shared reference",
    );
    const candidate = await inspectClosedOrphan(references(), row, root);
    assert.equal(candidate.status, "Eligible closed orphan");
    assert.equal(candidate.sha256, digest(bytes));
    await assert.rejects(
      removeExactOrphan(
        root,
        workspace_id,
        actor_id,
        operation_id,
        "0".repeat(64),
      ),
      /bytes changed/,
    );
    await removeExactOrphan(
      root,
      workspace_id,
      actor_id,
      operation_id,
      digest(bytes),
    );
    assert.equal(
      (await inspectClosedOrphan(references(), row, root)).status,
      "Absent",
    );
    assert.ok(await stat(join(root, workspace_id, other)));
    await assert.rejects(
      removeExactOrphan(root, "../outside", actor_id, other, digest(bytes)),
    );
  } finally {
    // Only the known synthetic fixture files and now-empty directories are removed.
    assert.ok(root.startsWith(join(temp, "ppo-fertigation-orphans-")));
    for (const id of [operation_id, other])
      await unlink(join(root, workspace_id, id)).catch((e) => {
        if (e.code !== "ENOENT") throw e;
      });
    await rmdir(join(root, workspace_id));
    await rmdir(root);
  }
});
