import assert from "node:assert/strict";
import { test, before, after } from "node:test";
import { randomUUID } from "node:crypto";
import { performance } from "node:perf_hooks";
import { mkdir, writeFile } from "node:fs/promises";
import { reset } from "../../scripts/database";
import { database, closeDatabase } from "../../src/platform/database";
import { localConfig } from "../../src/platform/config";
import { commitExcelWorkbook } from "../../src/estimating/import/commit";
import { reimportExcelWorkbook } from "../../src/estimating/import/reimport";
import { prepareExcelQuotation } from "../../src/estimating/import/quotation";
import { readExcelSource } from "../../src/estimating/import/retained";
import { readEstimate, readQuote } from "../../src/estimating/reads";
import { readOperation } from "../../src/shared/receipts";
import { excelImportSetup } from "../helpers/excel-import";
import { excelQuoteProposal } from "../helpers/excel-quotation";
import { revisionCommand } from "../helpers/excel-reimport";
import { capacityWorkbook } from "../helpers/excel-capacity";
import { excelSnapshot } from "../helpers/excel-review-database";
if (localConfig().database_name !== "ppo_synthetic_test")
  throw Error("Disposable synthetic database only");
process.env.PPO_ALLOW_RESET = "dispose-synthetic";
process.env.PPO_RESET_DATABASE = "ppo_synthetic_test";
before(reset);
after(closeDatabase);
test("XI07 500-line atomic import, explicit overflow, stable successor, quotation and exact replay", async () => {
  const times: Record<string, number> = {},
    start = performance.now();
  const s = await excelImportSetup(undefined, (p) => capacityWorkbook(p, 500));
  assert.equal(s.review.validation_passed, true);
  times.prepare_ms = performance.now() - start;
  let at = performance.now();
  const [a, b] = await Promise.all([
    commitExcelWorkbook(s.p, s.input.id, s.command),
    commitExcelWorkbook(s.p, s.input.id, s.command),
  ]);
  assert.deepEqual(a.receipt, b.receipt);
  assert.notEqual(a.replayed, b.replayed);
  times.duplicate_commit_ms = performance.now() - at;
  const e = await readEstimate(s.p, a.receipt.record_id);
  assert.equal(e.saved.lines.length, 500);
  assert.equal(e.saved.cost_total, "625.00");
  assert.equal(e.saved.sell_total, "1250.00");
  assert.deepEqual(
    (await readExcelSource(s.p, e.id, e.saved.id)).bytes,
    Buffer.from(s.command.file.base64, "base64"),
  );
  const oldIds = e.saved.lines.map((l) => l.id).sort();
  at = performance.now();
  const revision = await revisionCommand(s, (p) => {
    capacityWorkbook(p, 500, true);
    p["xl/worksheets/sheet5.xml"] = p["xl/worksheets/sheet5.xml"].replace(
      "CAP-500",
      "CAP-NEW",
    );
  });
  times.compare_ms = performance.now() - at;
  assert.equal(revision.comparison.omissions.length, 1);
  const before = await excelSnapshot();
  await assert.rejects(
    reimportExcelWorkbook(s.p, s.input.id, revision.command),
    (e) => (e as { code: string }).code === "InvalidData",
  );
  assert.deepEqual(await excelSnapshot(), before);
  revision.command.decisions[0].action = "Remove";
  at = performance.now();
  const r = await reimportExcelWorkbook(s.p, s.input.id, revision.command);
  times.reimport_ms = performance.now() - at;
  const next = await readEstimate(s.p, e.id);
  assert.equal(next.saved.lines.length, 500);
  assert.equal(
    next.saved.lines.filter((l) => oldIds.includes(l.id)).length,
    499,
  );
  await assert.rejects(
    reimportExcelWorkbook(s.p, s.input.id, {
      ...revision.command,
      operation_id: randomUUID(),
    }),
    (e) =>
      (e as { code: string }).code === "ExcelImportReviewChanged" ||
      (e as { code: string }).code === "ExcelImportComparisonChanged",
  );
  at = performance.now();
  const proposal = await excelQuoteProposal({ ...s, e: next });
  const q = await prepareExcelQuotation(s.p, e.id, proposal.command);
  times.quote_ms = performance.now() - at;
  const quote = await readQuote(s.p, q.receipt.record_id);
  assert.equal(quote.snapshot.items.length, 500);
  assert.equal(quote.snapshot.total, "1250.00");
  at = performance.now();
  const retainedRevision = await revisionCommand(s, (p) =>
    capacityWorkbook(p, 1),
  );
  assert.equal(retainedRevision.command.decisions.length, 499);
  await reimportExcelWorkbook(s.p, s.input.id, retainedRevision.command);
  const retainedEstimate = await readEstimate(s.p, e.id);
  assert.equal(retainedEstimate.saved.lines.length, 500);
  assert.equal(retainedEstimate.saved.sell_total, "1250.00");
  times.retained_reimport_ms = performance.now() - at;
  const snapshot = await excelSnapshot();
  assert.deepEqual(
    (await commitExcelWorkbook(s.p, s.input.id, s.command)).receipt,
    a.receipt,
  );
  assert.deepEqual(
    (await reimportExcelWorkbook(s.p, s.input.id, revision.command)).receipt,
    r.receipt,
  );
  assert.deepEqual(
    (await prepareExcelQuotation(s.p, e.id, proposal.command)).receipt,
    q.receipt,
  );
  assert.deepEqual(await readOperation(s.p, s.command.operation_id), a.receipt);
  assert.deepEqual(await excelSnapshot(), snapshot);
  assert.deepEqual(
    (await readExcelSource(s.p, e.id, e.saved.id)).bytes,
    Buffer.from(s.command.file.base64, "base64"),
  );
  await mkdir("verification-evidence/excel-capacity", { recursive: true });
  await writeFile(
    "verification-evidence/excel-capacity/database.json",
    JSON.stringify(times, null, 2),
  );
});

test("XI07 database denies unbound large versions and rolls back a fault at line 500", async () => {
  const guardCase = await excelImportSetup(undefined, (p) =>
    capacityWorkbook(p, 500),
  );
  const guardAccepted = await commitExcelWorkbook(
    guardCase.p,
    guardCase.input.id,
    guardCase.command,
  );
  const guardEstimate = await readEstimate(
    guardCase.p,
    guardAccepted.receipt.record_id,
  );
  const c = await database().connect();
  try {
    await c.query("BEGIN");
    await c.query(
      `INSERT INTO ppo.estimate_versions SELECT (jsonb_populate_record(NULL::ppo.estimate_versions,to_jsonb(v)||jsonb_build_object('id',$1::text,'version',v.version+1,'predecessor_id',v.id,'scope_revision_id',gen_random_uuid()))).* FROM ppo.estimate_versions v WHERE v.id=$2`,
      [randomUUID(), guardEstimate.saved.id],
    );
    await assert.rejects(
      c.query("SET CONSTRAINTS ppo.excel_capacity IMMEDIATE"),
      /Large estimates require accepted Excel capacity evidence/,
    );
  } finally {
    await c.query("ROLLBACK");
    c.release();
  }
  const s = await excelImportSetup(undefined, (p) => capacityWorkbook(p, 500)),
    before = await excelSnapshot();
  await database().query(
    `CREATE FUNCTION ppo.test_capacity_failure() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN IF NEW.ordinal=499 THEN RAISE EXCEPTION 'Synthetic last-line failure' USING ERRCODE='23514'; END IF; RETURN NEW; END $$; CREATE TRIGGER test_capacity_failure BEFORE INSERT ON ppo.excel_import_lines FOR EACH ROW EXECUTE FUNCTION ppo.test_capacity_failure()`,
  );
  try {
    await assert.rejects(
      commitExcelWorkbook(s.p, s.input.id, s.command),
      (e) => (e as { code: string }).code === "InvalidRelationship",
    );
    assert.deepEqual(await excelSnapshot(), before);
  } finally {
    await database().query(
      "DROP TRIGGER test_capacity_failure ON ppo.excel_import_lines; DROP FUNCTION ppo.test_capacity_failure()",
    );
  }
});
