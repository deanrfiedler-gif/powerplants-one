import assert from "node:assert/strict";
import { after, test } from "node:test";
import { mkdtemp, realpath } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { database, closeDatabase } from "../../src/platform/database";
import { localConfig } from "../../src/platform/config";
import { migrate, seed } from "../../scripts/database";
import { LocalSyntheticDocumentStore } from "../../src/documents/store";
import { excelImportSetup } from "../helpers/excel-import";
import { revisionCommand, changedWorkbook } from "../helpers/excel-reimport";
import { commitExcelWorkbook } from "../../src/estimating/import/commit";
import { reimportExcelWorkbook } from "../../src/estimating/import/reimport";
import {
  readExcelImport,
  readExcelSource,
} from "../../src/estimating/import/retained";
import { readOperation } from "../../src/shared/receipts";
import { recoverSchema } from "../helpers/recover-schema";
if (localConfig().database_name !== "ppo_synthetic_test")
  throw Error("Disposable synthetic database only");
after(closeDatabase);
test("XI95 populated original workbook upgrades to 0096 with exact source, rows, grants and original ledger; reapply is inert", async () => {
  await recoverSchema();
  await database().query("DROP TABLE IF EXISTS public.ppo_migrations");
  await migrate(95);
  await seed(95);
  const s = await excelImportSetup(),
    store = new LocalSyntheticDocumentStore(
      await realpath(await mkdtemp(join(tmpdir(), "ppo-reimport-upgrade-"))),
    );
  const accepted = await commitExcelWorkbook(s.p, s.input.id, s.command, store);
  const tables = [
    "excel_imports",
    "excel_import_lines",
    "estimates",
    "estimate_versions",
    "estimate_discovery_bases",
    "operation_receipts",
    "audit_events",
    "outbox_jobs",
    "permission_grants",
    "users",
    "seed_receipts",
  ];
  const snapshot = () =>
    Promise.all(
      tables.map(
        async (t) =>
          (
            await database().query(
              // Seeds 107 (SYN-PPO-P04 v2, field readiness gate) and 108 (Conversations grants) are the only later seeds; readiness-gate.test.ts and conversations-upgrade.test.ts prove them.
              `SELECT to_jsonb(r) value FROM ppo.${t} r${t === "seed_receipts" ? " WHERE r.version NOT IN (107,108)" : t === "permission_grants" ? " WHERE r.capability NOT LIKE 'conversation.%'" : ""} ORDER BY to_jsonb(r)::text`,
            )
          ).rows,
      ),
    );
  const original = await snapshot(),
    ledger = (
      await database().query(
        "SELECT * FROM public.ppo_migrations ORDER BY version",
      )
    ).rows;
  await migrate();
  assert.deepEqual(await snapshot(), original);
  const after = (
    await database().query(
      "SELECT * FROM public.ppo_migrations ORDER BY version",
    )
  ).rows;
  assert.deepEqual(after.slice(0, ledger.length), ledger);
  assert.deepEqual(
    after.slice(ledger.length).map((r) => r.version),
    [96, 97, 98, 99, 100, 101, 102, 103, 104, 105, 106, 107, 108, 109],
  );
  assert.equal(
    (await database().query("SELECT * FROM ppo.excel_reimports")).rowCount,
    0,
  );
  const version = original[0][0].value.estimate_version_id;
  assert.equal(
    (await readExcelImport(s.p, accepted.receipt.record_id, version)).review
      .hash,
    s.review.review_hash,
  );
  assert.deepEqual(
    (await readExcelSource(s.p, accepted.receipt.record_id, version, store))
      .bytes,
    Buffer.from(s.command.file.base64, "base64"),
  );
  assert.deepEqual(
    await readOperation(s.p, s.command.operation_id),
    accepted.receipt,
  );
  await migrate();
  await seed();
  assert.deepEqual(await snapshot(), original);
  assert.deepEqual(
    (
      await database().query(
        "SELECT * FROM public.ppo_migrations ORDER BY version",
      )
    ).rows,
    after,
  );
  const r = await revisionCommand(s, changedWorkbook);
  assert.equal(
    (await reimportExcelWorkbook(s.p, s.input.id, r.command, store)).receipt
      .record_version,
    2,
  );
});
