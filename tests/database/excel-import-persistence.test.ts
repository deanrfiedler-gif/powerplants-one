import assert from "node:assert/strict";
import { after, beforeEach, test } from "node:test";
import { randomUUID } from "node:crypto";
import { mkdtemp, readFile, writeFile, realpath } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { database, closeDatabase } from "../../src/platform/database";
import { localConfig } from "../../src/platform/config";
import { createSession } from "../../src/platform/identity";
import { reset } from "../../scripts/database";
import { LocalSyntheticDocumentStore } from "../../src/documents/store";
import type { DocumentStoreAdapter } from "../../src/adapters/contracts";
import {
  commitExcelWorkbook,
  excelStorageOperation,
} from "../../src/estimating/import/commit";
import {
  readExcelImport,
  readExcelSource,
} from "../../src/estimating/import/retained";
import { readOperation } from "../../src/shared/receipts";
import { readEstimate } from "../../src/estimating/reads";
import { adoptDiscoveryCosting } from "../../src/estimating/cost-basis-service";
import {
  prepareExcelReview,
  previewExcelWorkbook,
} from "../../src/estimating/import/service";
import { excelImportSetup } from "../helpers/excel-import";
import { excelSnapshot } from "../helpers/excel-review-database";
import { excelUpload, nativeWorkbook, setCell } from "../helpers/excel-review";
import {
  reviseCostDiscovery,
  manualCostCommand,
} from "../helpers/estimating-cost-basis";
import { excelDiscovery } from "../helpers/excel-review";

if (localConfig().database_name !== "ppo_synthetic_test")
  throw Error("Disposable ppo_synthetic_test only");
process.env.PPO_ALLOW_RESET = "dispose-synthetic";
process.env.PPO_RESET_DATABASE = "ppo_synthetic_test";
beforeEach(reset);
after(closeDatabase);
const code = (expected: string) => (e: unknown) =>
  (e as { code: string }).code === expected;
async function store() {
  const path = await realpath(
    await mkdtemp(join(tmpdir(), "ppo-excel-proof-")),
  );
  return { path, adapter: new LocalSyntheticDocumentStore(path) };
}
async function snapshot() {
  return {
    native: await excelSnapshot(),
    imports: (
      await database().query(
        "SELECT to_jsonb(i) AS value FROM ppo.excel_imports i ORDER BY estimate_version_id",
      )
    ).rows,
    lines: (
      await database().query(
        "SELECT to_jsonb(i) AS value FROM ppo.excel_import_lines i ORDER BY estimate_version_id,ordinal",
      )
    ).rows,
  };
}
const denied = (e: unknown) =>
  ["RecordUnavailable", "PermissionDenied"].includes(
    (e as { code: string }).code,
  );

test("XI03/04 competing operations create only one estimate; explicit NoneDeclared survives; source reads recheck authority after I/O", async () => {
  const discovery = excelDiscovery();
  discovery.answers[1].value = { choice: "NoneDeclared" };
  const s = await excelImportSetup(discovery, (parts) => {
      for (const cell of ["A7", "B7", "C7"]) setCell(parts, 3, cell, null);
    }),
    disk = await store();
  assert.equal(s.review.validation_passed, true);
  assert.equal(s.review.scope_comparison[1].proposed, "");
  const results = await Promise.allSettled([
    commitExcelWorkbook(s.p, s.input.id, s.command, disk.adapter),
    commitExcelWorkbook(
      s.p,
      s.input.id,
      { ...s.command, operation_id: randomUUID() },
      disk.adapter,
    ),
  ]);
  const accepted = results.filter((r) => r.status === "fulfilled");
  assert.equal(accepted.length, 1);
  const refused = results.find(
    (r) => r.status === "rejected",
  ) as PromiseRejectedResult;
  assert.equal(refused.reason.code, "ExcelImportComparisonRequired");
  const estimate = await readEstimate(s.p, accepted[0].value.receipt.record_id);
  assert.equal(estimate.saved.scope.excluded, "None declared.");
  const evidence = await readExcelImport(s.p, estimate.id, estimate.saved.id);
  assert.equal(evidence.proposal.scope_comparison[1].proposed, "");
  assert.equal(
    (
      await database().query(
        "SELECT count(*)::integer AS n FROM ppo.excel_imports WHERE option_id=$1",
        [s.input.option_id],
      )
    ).rows[0].n,
    1,
  );
  let grants: { id: string }[] = [];
  try {
    await assert.rejects(
      readExcelSource(s.p, estimate.id, estimate.saved.id, {
        store: disk.adapter.store.bind(disk.adapter),
        read: async (...args) => {
          const bytes = await disk.adapter.read(...args);
          grants = (
            await database().query(
              "UPDATE ppo.permission_grants SET valid_to=clock_timestamp() WHERE user_id=$1 AND capability='estimating.read' AND valid_to IS NULL RETURNING id",
              [s.p.actor_id],
            )
          ).rows;
          return bytes;
        },
      }),
      denied,
    );
  } finally {
    await database().query(
      "UPDATE ppo.permission_grants SET valid_to=NULL WHERE id=ANY($1::uuid[])",
      [grants.map((g) => g.id)],
    );
  }
});

test("XI01/04 exact workbook, twelve lines and seven sections survive new adapter/pool; original operation recovers after selection changes", async () => {
  const s = await excelImportSetup(),
    disk = await store();
  const result = await commitExcelWorkbook(
    s.p,
    s.input.id,
    s.command,
    disk.adapter,
  );
  assert.equal(result.replayed, false);
  assert.equal(result.receipt.record_version, 1);
  const estimate = await readEstimate(s.p, result.receipt.record_id),
    version = estimate.saved.id;
  assert.equal(estimate.totals.cost, "62952.38");
  assert.equal(estimate.totals.sell, "85607.63");
  const evidence = await readExcelImport(s.p, estimate.id, version);
  assert.deepEqual(evidence.proposal, JSON.parse(JSON.stringify(s.review)));
  assert.equal(evidence.proposal.sections.length, 7);
  assert.equal(evidence.lines.length, 12);
  assert.equal(new Set(evidence.lines.map((l) => l.line_id)).size, 12);
  assert.deepEqual(
    evidence.lines.map((l) => l.line_id),
    estimate.saved.lines.map((l) => l.id),
  );
  assert.equal(evidence.review.actor_id, s.p.actor_id);
  assert.equal(evidence.review.recorded, true);
  assert.ok(!JSON.stringify(evidence).includes("source_key"));
  const original = Buffer.from(s.upload.file.base64, "base64");
  assert.deepEqual(
    Buffer.from(
      (await readExcelSource(s.p, estimate.id, version, disk.adapter)).bytes,
    ),
    original,
  );
  const before = await snapshot();
  assert.deepEqual(
    (
      await commitExcelWorkbook(
        s.p,
        s.input.id,
        { ...s.command, confirmations: [...s.command.confirmations].reverse() },
        disk.adapter,
      )
    ).receipt,
    result.receipt,
  );
  await assert.rejects(
    commitExcelWorkbook(
      s.p,
      s.input.id,
      { ...s.command, reason: "Different reviewed reason" },
      disk.adapter,
    ),
    code("OperationConflict"),
  );
  await assert.rejects(
    commitExcelWorkbook(
      s.p,
      s.input.id,
      { ...s.command, file: { ...s.command.file, name: "different.xlsx" } },
      disk.adapter,
    ),
    code("OperationConflict"),
  );
  assert.deepEqual(await snapshot(), before);
  await closeDatabase();
  assert.deepEqual(
    await readOperation(s.p, s.command.operation_id),
    result.receipt,
  );
  assert.deepEqual(
    Buffer.from(
      (
        await readExcelSource(
          s.p,
          estimate.id,
          version,
          new LocalSyntheticDocumentStore(disk.path),
        )
      ).bytes,
    ),
    original,
  );
  await reviseCostDiscovery(s, excelDiscovery(), true);
  assert.equal(
    (await commitExcelWorkbook(s.p, s.input.id, s.command, disk.adapter))
      .replayed,
    true,
  );
  assert.deepEqual(
    await readOperation(s.p, s.command.operation_id),
    result.receipt,
  );
  assert.deepEqual(
    (await readExcelImport(s.p, estimate.id, version)).proposal,
    JSON.parse(JSON.stringify(s.review)),
  );
  for (const table of ["excel_imports", "excel_import_lines"]) {
    await assert.rejects(
      database().query(
        `DELETE FROM ppo.${table} WHERE estimate_version_id=$1`,
        [version],
      ),
    );
    await assert.rejects(
      database().query(
        `UPDATE ppo.${table} SET workspace_id=workspace_id WHERE estimate_version_id=$1`,
        [version],
      ),
    );
  }
  const path = join(
    disk.path,
    s.p.workspace_id,
    excelStorageOperation(s.p, s.command.operation_id),
  );
  const saved = await readFile(path);
  await writeFile(path, Buffer.from("corrupted synthetic source"));
  await assert.rejects(
    readExcelSource(s.p, estimate.id, version, disk.adapter),
    code("ExactDocumentUnavailable"),
  );
  assert.deepEqual(
    await readOperation(s.p, s.command.operation_id),
    result.receipt,
  );
  await writeFile(path, saved);
});

test("XI04 storage/readback and native/evidence/audit/receipt/outbox faults leave no database effect; the original operation can retry", async () => {
  const s = await excelImportSetup(),
    disk = await store(),
    before = await snapshot();
  const failed: DocumentStoreAdapter = {
    store: async () => {
      throw Error("Injected storage failure");
    },
    read: async () => new Uint8Array(),
  };
  await assert.rejects(
    commitExcelWorkbook(s.p, s.input.id, s.command, failed),
    /Injected storage/,
  );
  assert.deepEqual(await snapshot(), before);
  await assert.rejects(
    commitExcelWorkbook(s.p, s.input.id, s.command, {
      store: disk.adapter.store.bind(disk.adapter),
      read: async () => new Uint8Array([1]),
    }),
    code("ExcelSourceVerificationFailed"),
  );
  assert.deepEqual(await snapshot(), before);
  for (const table of [
    "estimate_versions",
    "excel_imports",
    "excel_import_lines",
    "audit_events",
    "operation_receipts",
    "outbox_jobs",
  ]) {
    await database()
      .query(`CREATE FUNCTION ppo.excel_test_fault() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'Injected atomic failure'; END $$;
      CREATE TRIGGER excel_test_fault BEFORE INSERT ON ppo.${table} FOR EACH ROW EXECUTE FUNCTION ppo.excel_test_fault()`);
    try {
      await assert.rejects(
        commitExcelWorkbook(s.p, s.input.id, s.command, disk.adapter),
        /Injected atomic failure/,
      );
    } finally {
      await database().query(
        `DROP TRIGGER excel_test_fault ON ppo.${table}; DROP FUNCTION ppo.excel_test_fault()`,
      );
    }
    assert.deepEqual(await snapshot(), before, table + " must roll back");
  }
  // Test the deferred graph independently: corrupt membership after service validation.
  await database()
    .query(`CREATE FUNCTION ppo.excel_test_fault() RETURNS trigger LANGUAGE plpgsql AS $$
    BEGIN NEW.line_id=gen_random_uuid(); RETURN NEW; END $$;
    CREATE TRIGGER excel_test_fault BEFORE INSERT ON ppo.excel_import_lines FOR EACH ROW EXECUTE FUNCTION ppo.excel_test_fault()`);
  try {
    await assert.rejects(
      commitExcelWorkbook(s.p, s.input.id, s.command, disk.adapter),
      code("InvalidRelationship"),
    );
  } finally {
    await database().query(
      "DROP TRIGGER excel_test_fault ON ppo.excel_import_lines; DROP FUNCTION ppo.excel_test_fault()",
    );
  }
  assert.deepEqual(await snapshot(), before);
  const accepted = await commitExcelWorkbook(
    s.p,
    s.input.id,
    s.command,
    disk.adapter,
  );
  assert.equal(accepted.replayed, false);
  assert.deepEqual(
    await readOperation(s.p, s.command.operation_id),
    accepted.receipt,
  );
});

test("XI03/04 concurrent identical and competing intents serialize; permission loss hides workbook, evidence and receipts", async () => {
  const s = await excelImportSetup(),
    disk = await store();
  const results = await Promise.all([
    commitExcelWorkbook(s.p, s.input.id, s.command, disk.adapter),
    commitExcelWorkbook(s.p, s.input.id, s.command, disk.adapter),
  ]);
  assert.deepEqual(results[0].receipt, results[1].receipt);
  assert.equal(results.filter((r) => !r.replayed).length, 1);
  const estimate = await readEstimate(s.p, results[0].receipt.record_id),
    version = estimate.saved.id;
  const before = await snapshot();
  await assert.rejects(
    commitExcelWorkbook(
      s.p,
      s.input.id,
      { ...s.command, operation_id: randomUUID() },
      disk.adapter,
    ),
    code("ExcelImportComparisonRequired"),
  );
  assert.deepEqual(await snapshot(), before);
  const other = (await createSession("second-company")).principal;
  const quoteOnly = (await createSession("observer")).principal;
  await database().query(
    `INSERT INTO ppo.permission_grants(workspace_id,user_id,company_id,capability,scope_type,scope_id,site_id,valid_from,valid_to)
     SELECT workspace_id,$2,company_id,capability,scope_type,scope_id,site_id,valid_from,valid_to
     FROM ppo.permission_grants WHERE user_id=$1 AND capability='estimating.quote.read' ON CONFLICT DO NOTHING`,
    [s.p.actor_id, quoteOnly.actor_id],
  );
  assert.equal(
    (
      await database().query(
        "SELECT count(*)::integer AS n FROM ppo.permission_grants WHERE user_id=$1 AND capability='estimating.read'",
        [quoteOnly.actor_id],
      )
    ).rows[0].n,
    0,
  );
  for (const p of [other, quoteOnly]) {
    await assert.rejects(readExcelImport(p, estimate.id, version), denied);
    await assert.rejects(
      readExcelSource(p, estimate.id, version, disk.adapter),
      denied,
    );
    await assert.rejects(readOperation(p, s.command.operation_id), denied);
    await assert.rejects(
      commitExcelWorkbook(p, s.input.id, s.command, disk.adapter),
      denied,
    );
  }
  for (const cap of ["estimating.read", "estimating.edit", "shared.read"]) {
    const grants = (
      await database().query(
        "UPDATE ppo.permission_grants SET valid_to=clock_timestamp() WHERE user_id=$1 AND capability=$2 AND valid_to IS NULL RETURNING id",
        [s.p.actor_id, cap],
      )
    ).rows;
    assert.ok(grants.length);
    await assert.rejects(
      commitExcelWorkbook(s.p, s.input.id, s.command, disk.adapter),
      denied,
    );
    await assert.rejects(readOperation(s.p, s.command.operation_id), denied);
    if (cap !== "estimating.edit") {
      await assert.rejects(readExcelImport(s.p, estimate.id, version), denied);
      await assert.rejects(
        readExcelSource(s.p, estimate.id, version, disk.adapter),
        denied,
      );
    }
    await database().query(
      "UPDATE ppo.permission_grants SET valid_to=NULL WHERE id=ANY($1::uuid[])",
      [grants.map((g) => g.id)],
    );
  }
});

test("XI02/03 no source write for missing confirmations, mismatched reviews, blocked workbooks, stale basis or pre-existing costing; authority is rechecked after storage", async () => {
  const s = await excelImportSetup(),
    disk = await store(),
    before = await snapshot();
  let writes = 0;
  const adapter: DocumentStoreAdapter = {
    store: async (...args) => {
      writes++;
      return disk.adapter.store(...args);
    },
    read: disk.adapter.read.bind(disk.adapter),
  };
  await assert.rejects(
    commitExcelWorkbook(
      s.p,
      s.input.id,
      { ...s.command, confirmations: [] },
      adapter,
    ),
  );
  await assert.rejects(
    commitExcelWorkbook(
      s.p,
      s.input.id,
      { ...s.command, review_hash: "a".repeat(64) },
      adapter,
    ),
    code("ExcelImportReviewChanged"),
  );
  const parts = nativeWorkbook(s.context.target);
  setCell(parts, 5, "G6", null);
  const invalid = excelUpload(s.context.target, s.context.basis_hash, parts);
  await assert.rejects(
    commitExcelWorkbook(s.p, s.input.id, { ...s.command, ...invalid }, adapter),
    code("ExcelImportBlocked"),
  );
  assert.equal(writes, 0);
  assert.deepEqual(await snapshot(), before);
  let grants: { id: string }[] = [];
  await assert.rejects(
    commitExcelWorkbook(s.p, s.input.id, s.command, {
      store: disk.adapter.store.bind(disk.adapter),
      read: async (...args) => {
        const bytes = await disk.adapter.read(...args);
        grants = (
          await database().query(
            "UPDATE ppo.permission_grants SET valid_to=clock_timestamp() WHERE user_id=$1 AND capability='estimating.edit' AND valid_to IS NULL RETURNING id",
            [s.p.actor_id],
          )
        ).rows;
        return bytes;
      },
    }),
    denied,
  );
  await database().query(
    "UPDATE ppo.permission_grants SET valid_to=NULL WHERE id=ANY($1::uuid[])",
    [grants.map((g) => g.id)],
  );
  assert.deepEqual(await snapshot(), before);
  await database().query(
    "UPDATE ppo.facilities SET version=version+1 WHERE id=$1",
    [s.context.target.discovery.scope.facility_ids[0]],
  );
  await assert.rejects(
    commitExcelWorkbook(s.p, s.input.id, s.command, adapter),
    code("ExcelImportBasisChanged"),
  );
  await adoptDiscoveryCosting(s.p, s.input.id, await manualCostCommand(s));
  const context = await prepareExcelReview(s.p, s.input.id, {
    option_id: s.input.option_id,
    revision_id: s.input.revision_id,
  });
  const upload = excelUpload(context.target, context.basis_hash),
    review = await previewExcelWorkbook(s.p, s.input.id, upload);
  const saved = await snapshot();
  await assert.rejects(
    commitExcelWorkbook(
      s.p,
      s.input.id,
      { ...s.command, ...upload, review_hash: review.review_hash },
      adapter,
    ),
    code("ExcelImportComparisonRequired"),
  );
  assert.deepEqual(await snapshot(), saved);
  assert.equal(writes, 0);
});
