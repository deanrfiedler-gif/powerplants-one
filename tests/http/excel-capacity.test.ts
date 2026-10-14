import assert from "node:assert/strict";
import { after, test } from "node:test";
import { closeDatabase } from "../../src/platform/database";
import { localConfig } from "../../src/platform/config";
import { httpAcceptance } from "../helpers/acceptance-http";
import { excelImportSetup } from "../helpers/excel-import";
import { nativeWorkbook, excelUpload } from "../helpers/excel-review";
import { capacityWorkbook } from "../helpers/excel-capacity";
import { excelSnapshot } from "../helpers/excel-review-database";
if (localConfig().database_name !== "ppo_synthetic_test")
  throw Error("Disposable synthetic database only");
after(closeDatabase);
test("XI07 compiled capacity boundaries preserve the complete workbook and refuse 501 without mutation", async () => {
  const h = httpAcceptance(localConfig().origin),
    s = await excelImportSetup(undefined, (p) => capacityWorkbook(p, 500));
  await h.cookie("coordinator");
  const path = `estimating/workspaces/${s.input.id}/excel-import/preview`;
  const tooLarge = await h.call(
    "coordinator",
    `estimating/estimates/${s.input.id}/excel-quote/review`,
    { padding: "x".repeat(128 * 1024) },
  );
  assert.equal(tooLarge.status, 422);
  assert.equal(tooLarge.body.code, "PayloadTooLarge");
  const before = await excelSnapshot();
  const valid = await h.call("coordinator", path, s.upload);
  assert.equal(valid.status, 200);
  assert.equal(valid.body.lines.length, 500);
  assert.equal(valid.body.validation_passed, true);
  const parts = nativeWorkbook(s.context.target);
  capacityWorkbook(parts, 501);
  const refused = await h.call(
    "coordinator",
    path,
    excelUpload(s.context.target, s.context.basis_hash, parts),
  );
  assert.equal(refused.status, 422);
  assert.deepEqual(await excelSnapshot(), before);
});
