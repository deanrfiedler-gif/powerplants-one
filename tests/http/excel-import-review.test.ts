import assert from "node:assert/strict";
import { after, test } from "node:test";
import { closeDatabase } from "../../src/platform/database";
import { localConfig } from "../../src/platform/config";
import { httpAcceptance } from "../helpers/acceptance-http";
import {
  discoveryCostSetup,
  reviseCostDiscovery,
} from "../helpers/estimating-cost-basis";
import {
  excelDiscovery,
  excelUpload,
  nativeWorkbook,
  setCell,
} from "../helpers/excel-review";
import { excelSnapshot } from "../helpers/excel-review-database";
import { uploadRequestLimit } from "../../src/estimating/import/service";

if (localConfig().database_name !== "ppo_synthetic_test")
  throw Error("Disposable ppo_synthetic_test only");
after(closeDatabase);
const origin = localConfig().origin,
  h = httpAcceptance(origin);
test("XI-HTTP compiled upload/context uses current owner authority, protected bounded input, exact reconciliation and no writes", async () => {
  const s = await discoveryCostSetup(excelDiscovery());
  for (const profile of ["coordinator", "second-company", "systems"])
    await h.cookie(profile);
  const path = `estimating/workspaces/${s.input.id}/excel-import`;
  const context = await h.call("coordinator", path + "/context", {
    option_id: s.input.option_id,
    revision_id: s.input.revision_id,
  });
  assert.equal(context.status, 200, JSON.stringify(context.body));
  const upload = excelUpload(context.body.target, context.body.basis_hash);
  const before = await excelSnapshot();
  const review = await h.call("coordinator", path + "/preview", upload);
  assert.equal(review.status, 200, JSON.stringify(review.body));
  assert.equal(review.body.state, "ReviewRequired");
  assert.equal(review.body.can_import, false);
  assert.equal(review.body.totals.sell, "85607.63");
  assert.equal(review.body.lines.length, 12);
  assert.deepEqual(
    (await h.call("coordinator", path + "/preview", upload)).body,
    review.body,
  );
  for (const profile of ["second-company", "systems"]) {
    const denied = await h.call(profile, path + "/preview", upload);
    assert.ok([403, 404].includes(denied.status));
    assert.equal(denied.body.original_tables, undefined);
    assert.equal(denied.body.totals, undefined);
  }
  const parts = nativeWorkbook(context.body.target);
  setCell(parts, 5, "P6", 14501);
  const blocked = await h.call(
    "coordinator",
    path + "/preview",
    excelUpload(context.body.target, context.body.basis_hash, parts),
  );
  assert.equal(blocked.status, 200);
  assert.equal(blocked.body.state, "Blocked");
  assert.ok(
    blocked.body.issues.some(
      (i: { code: string }) => i.code === "LineCostMismatch",
    ),
  );
  const malformed = await h.call("coordinator", path + "/preview", {
    ...upload,
    file: { name: "SYN.xlsx", base64: "AAAA" },
  });
  assert.equal(malformed.status, 422);
  assert.equal(malformed.body.code, "WorkbookRejected");
  const cookie = await h.cookie("coordinator");
  const unauthenticated = await fetch(origin + "/api/v1/" + path + "/preview", {
    method: "POST",
    headers: { origin, "Content-Type": "application/json" },
    body: JSON.stringify(upload),
  });
  assert.equal(unauthenticated.status, 401);
  const crossOrigin = await fetch(origin + "/api/v1/" + path + "/preview", {
    method: "POST",
    headers: {
      cookie,
      origin: "https://invalid.example",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(upload),
  });
  assert.equal(crossOrigin.status, 403);
  const tooLarge = await h.call("coordinator", path + "/preview", {
    padding: "x".repeat(uploadRequestLimit),
  });
  assert.equal(tooLarge.status, 422);
  assert.equal(tooLarge.body.code, "PayloadTooLarge");
  assert.deepEqual(await excelSnapshot(), before);
  await reviseCostDiscovery(s, excelDiscovery());
  const stale = await h.call("coordinator", path + "/preview", upload);
  assert.equal(stale.status, 409);
  assert.equal(stale.body.original_tables, undefined);
});
