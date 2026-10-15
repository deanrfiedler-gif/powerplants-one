import assert from "node:assert/strict";
import { after, test } from "node:test";
import { readFile, mkdtemp, realpath } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { database, closeDatabase } from "../../src/platform/database";
import { localConfig } from "../../src/platform/config";
import { migrate, seed } from "../../scripts/database";
import { LocalSyntheticDocumentStore } from "../../src/documents/store";
import { excelImportSetup } from "../helpers/excel-import";
import { revisionCommand } from "../helpers/excel-reimport";
import { commitExcelWorkbook } from "../../src/estimating/import/commit";
import { reimportExcelWorkbook } from "../../src/estimating/import/reimport";
import {
  readExcelImport,
  readExcelSource,
} from "../../src/estimating/import/retained";
import { excelQuoteProposal } from "../helpers/excel-quotation";
import { prepareExcelQuotation } from "../../src/estimating/import/quotation";
import { readEstimate } from "../../src/estimating/reads";
import { capacityWorkbook } from "../helpers/excel-capacity";
import { readOperation } from "../../src/shared/receipts";
if (localConfig().database_name !== "ppo_synthetic_test")
  throw Error("Disposable synthetic database only");
after(closeDatabase);
test("XI96 populated workbook and quotation upgrade to Excel capacity with exact source, rows, grants and original ledger; reapply is inert", async () => {
  await database().query(
    await readFile("db/migrations/0001-recover.sql", "utf8"),
  );
  await database().query("DROP TABLE IF EXISTS public.ppo_migrations");
  await migrate(96);
  await seed(96);
  const s = await excelImportSetup(),
    store = new LocalSyntheticDocumentStore(
      await realpath(await mkdtemp(join(tmpdir(), "ppo-reimport-upgrade-"))),
    );
  const accepted = await commitExcelWorkbook(s.p, s.input.id, s.command, store);
  const e = await readEstimate(s.p, accepted.receipt.record_id);
  const quotation = await excelQuoteProposal({ ...s, e });
  const quoted = await prepareExcelQuotation(s.p, e.id, quotation.command);
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
    "draft_quote_revisions",
    "draft_quotes",
    "estimate_quote_jobs",
  ];
  const snapshot = () =>
    Promise.all(
      tables.map(
        async (t) =>
          (
            await database().query(
              `SELECT to_jsonb(r) value FROM ppo.${t} r ORDER BY to_jsonb(r)::text`,
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
    [97, 98, 99, 100, 101, 102],
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
  const r = await revisionCommand(s, (p) => capacityWorkbook(p, 500, true));
  r.command.decisions.forEach((d) => (d.action = "Remove"));
  assert.deepEqual(
    await readOperation(s.p, quotation.command.operation_id),
    quoted.receipt,
  );
  assert.equal(
    (await reimportExcelWorkbook(s.p, s.input.id, r.command, store)).receipt
      .record_version,
    2,
  );
});
