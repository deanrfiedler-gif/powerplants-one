import assert from "node:assert/strict";
import { after, beforeEach, test } from "node:test";
import { randomUUID } from "node:crypto";
import { database, closeDatabase } from "../../src/platform/database";
import { localConfig } from "../../src/platform/config";
import { createSession } from "../../src/platform/identity";
import { withWorkingCompany } from "../../src/platform/working-company";
import { reset } from "../../scripts/database";
import {
  prepareExcelReview,
  previewExcelWorkbook,
} from "../../src/estimating/import/service";
import {
  discoveryCostSetup,
  manualCostCommand,
  reviseCostDiscovery,
} from "../helpers/estimating-cost-basis";
import { adoptDiscoveryCosting } from "../../src/estimating/cost-basis-service";
import { excelDiscovery, excelUpload } from "../helpers/excel-review";
import { excelSnapshot } from "../helpers/excel-review-database";

if (localConfig().database_name !== "ppo_synthetic_test")
  throw Error("Disposable ppo_synthetic_test only");
process.env.PPO_ALLOW_RESET = "dispose-synthetic";
process.env.PPO_RESET_DATABASE = "ppo_synthetic_test";
beforeEach(reset);
after(closeDatabase);
const code = (expected: string) => (e: unknown) =>
  (e as { code: string }).code === expected;
async function setup() {
  const s = await discoveryCostSetup(excelDiscovery());
  const prepare = () =>
    prepareExcelReview(s.p, s.input.id, {
      option_id: s.input.option_id,
      revision_id: s.input.revision_id,
    });
  const context = await prepare();
  return {
    ...s,
    prepare,
    context,
    upload: excelUpload(context.target, context.basis_hash),
  };
}
test("XI01/03 exact E2 preview/replay returns complete evidence without changing any business row, receipt or audit", async () => {
  const s = await setup(),
    before = await excelSnapshot();
  const result = await previewExcelWorkbook(s.p, s.input.id, s.upload);
  assert.equal(result.validation_passed, true);
  assert.equal(result.lines.length, 12);
  assert.equal(result.totals.cost, "62952.38");
  assert.equal(result.totals.sell, "85607.63");
  assert.deepEqual(
    await previewExcelWorkbook(s.p, s.input.id, s.upload),
    result,
  );
  assert.deepEqual(await excelSnapshot(), before);
  const input = await manualCostCommand(s);
  await adoptDiscoveryCosting(s.p, s.input.id, input);
  await assert.rejects(
    previewExcelWorkbook(s.p, s.input.id, s.upload),
    code("ExcelImportBasisChanged"),
  );
  const current = await s.prepare(),
    saved = await excelSnapshot();
  assert.equal(current.target.expected_estimate_version, 1);
  assert.equal(
    (
      await previewExcelWorkbook(
        s.p,
        s.input.id,
        excelUpload(current.target, current.basis_hash),
      )
    ).validation_passed,
    true,
  );
  assert.deepEqual(await excelSnapshot(), saved);
});
test("XI03 foreign company, working-company scope, non-owner and revoked read/edit/source authority are rechecked before parsing", async () => {
  const s = await setup(),
    other = (await createSession("second-company")).principal;
  const malformed = { ...s.upload, file: { name: "SYN.xlsx", base64: "AAAA" } };
  await assert.rejects(
    previewExcelWorkbook(other, s.input.id, malformed),
    (e) =>
      ["RecordUnavailable", "PermissionDenied"].includes(
        (e as { code: string }).code,
      ),
  );
  await assert.rejects(
    withWorkingCompany(
      s.p.actor_id,
      "20000000-0000-4000-8000-000000000002",
      () => previewExcelWorkbook(s.p, s.input.id, malformed),
    ),
  );
  // Give another real actor the same relevant duties; ownership itself is immutable.
  await database().query(
    `INSERT INTO ppo.permission_grants(workspace_id,user_id,company_id,capability,scope_type,scope_id,site_id,valid_from,valid_to)
     SELECT workspace_id,$2,company_id,capability,scope_type,scope_id,site_id,valid_from,valid_to
     FROM ppo.permission_grants WHERE user_id=$1
     AND capability IN ('estimating.read','estimating.edit','crm.opportunity.read','shared.read','shared.internal.read')
     ON CONFLICT DO NOTHING`,
    [s.p.actor_id, other.actor_id],
  );
  await assert.rejects(
    previewExcelWorkbook(other, s.input.id, malformed),
    code("EstimatingOwnerRequired"),
  );
  for (const capability of [
    "estimating.edit",
    "estimating.read",
    "shared.read",
  ]) {
    const rows = (
      await database().query(
        "UPDATE ppo.permission_grants SET valid_to=clock_timestamp() WHERE user_id=$1 AND capability=$2 AND valid_to IS NULL RETURNING id",
        [s.p.actor_id, capability],
      )
    ).rows;
    assert.ok(rows.length);
    await assert.rejects(
      previewExcelWorkbook(s.p, s.input.id, malformed),
      (e) =>
        ["RecordUnavailable", "PermissionDenied"].includes(
          (e as { code: string }).code,
        ),
    );
    await database().query(
      "UPDATE ppo.permission_grants SET valid_to=NULL WHERE id=ANY($1::uuid[])",
      [rows.map((r) => r.id)],
    );
  }
  assert.equal(
    (await previewExcelWorkbook(s.p, s.input.id, s.upload)).validation_passed,
    true,
  );
});
test("XI03 changed reference versions, stale revision, unknown option and incomplete scope refuse old previews", async () => {
  const s = await setup();
  await database().query(
    "UPDATE ppo.facilities SET version=version+1 WHERE id=$1",
    [s.context.target.discovery.scope.facility_ids[0]],
  );
  await assert.rejects(
    previewExcelWorkbook(s.p, s.input.id, s.upload),
    code("ExcelImportBasisChanged"),
  );
  await assert.rejects(
    prepareExcelReview(s.p, s.input.id, {
      option_id: randomUUID(),
      revision_id: s.input.revision_id,
    }),
    code("RecordUnavailable"),
  );
  const next = await reviseCostDiscovery(s, excelDiscovery());
  await assert.rejects(
    previewExcelWorkbook(s.p, s.input.id, s.upload),
    code("DiscoveryRevisionChanged"),
  );
  const incomplete = excelDiscovery();
  incomplete.answers[0] = {
    ...incomplete.answers[0],
    state: "Deferred",
    value: null,
    source: null,
    follow_up: { owner_id: s.p.actor_id, reason: "SYN unresolved scope" },
  };
  const changed = await reviseCostDiscovery(s, incomplete);
  await assert.rejects(
    prepareExcelReview(s.p, s.input.id, {
      option_id: s.input.option_id,
      revision_id: changed.revision_id,
    }),
    code("DiscoveryScopeIncomplete"),
  );
  assert.notEqual(next.revision_id, changed.revision_id);
});
test("XI07 malformed envelopes, oversized bytes, unsafe filenames and unreadable archives cannot create effects", async () => {
  const s = await setup(),
    before = await excelSnapshot();
  for (const file of [
    { name: "../SYN.xlsx", base64: s.upload.file.base64 },
    { name: "SYN.xlsm", base64: s.upload.file.base64 },
    { name: "SYN.xlsx", base64: s.upload.file.base64 + " " },
    { name: "SYN.xlsx", base64: "AB==" },
    {
      name: "SYN.xlsx",
      base64: "A".repeat(4 * Math.ceil((5 * 1024 * 1024) / 3) + 4),
    },
  ])
    await assert.rejects(
      previewExcelWorkbook(s.p, s.input.id, { ...s.upload, file }),
      code("InvalidData"),
    );
  await assert.rejects(
    previewExcelWorkbook(s.p, s.input.id, { ...s.upload, reviewed: true }),
    code("InvalidData"),
  );
  await assert.rejects(
    previewExcelWorkbook(s.p, s.input.id, {
      ...s.upload,
      file: { name: "SYN.xlsx", base64: "AAAA" },
    }),
    code("WorkbookRejected"),
  );
  assert.deepEqual(await excelSnapshot(), before);
});
