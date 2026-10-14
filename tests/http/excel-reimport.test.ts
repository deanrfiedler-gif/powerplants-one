import assert from "node:assert/strict";
import { after, test } from "node:test";
import { randomUUID } from "node:crypto";
import { closeDatabase } from "../../src/platform/database";
import { localConfig } from "../../src/platform/config";
import { httpAcceptance } from "../helpers/acceptance-http";
import { excelImportSetup } from "../helpers/excel-import";
import { revisionUpload, changedWorkbook } from "../helpers/excel-reimport";
if (localConfig().database_name !== "ppo_synthetic_test")
  throw Error("Disposable synthetic database only");
after(closeDatabase);
const origin = localConfig().origin,
  h = httpAcceptance(origin);
test("XI HTTP exact comparison, explicit decisions, successor source, access and original operation recovery", async () => {
  const s = await excelImportSetup(),
    base = `estimating/workspaces/${s.input.id}/excel-import/`;
  const first = await h.call("coordinator", base + "commit", s.command);
  assert.equal(first.status, 200);
  const upload = await revisionUpload(s, changedWorkbook),
    cookie = await h.cookie("coordinator");
  for (const route of ["compare", "reimport"]) {
    for (const [headers, status] of [
      [{ origin }, 401],
      [{ cookie, origin: "https://invalid.example" }, 403],
    ] as const) {
      const r = await fetch(origin + "/api/v1/" + base + route, {
        method: "POST",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify(upload),
      });
      assert.equal(r.status, status);
    }
  }
  const compared = await h.call("coordinator", base + "compare", upload);
  assert.equal(compared.status, 200, JSON.stringify(compared.body));
  const c = compared.body;
  assert.equal(c.omissions.length, 1);
  assert.equal(
    c.lines.find((l: { line_ref: string }) => l.line_ref === "L-NEW").kind,
    "Added",
  );
  const command = {
    ...s.command,
    ...upload,
    operation_id: randomUUID(),
    review_hash: c.proposal.review_hash,
    comparison_hash: c.comparison_hash,
    changes_confirmed: true,
    decisions: c.omissions.map((o: { line_id: string }) => ({
      line_id: o.line_id,
      action: "Remove",
    })),
  };
  assert.equal(
    (
      await h.call("coordinator", base + "reimport", {
        ...command,
        decisions: [],
      })
    ).status,
    422,
  );
  const accepted = await h.call("coordinator", base + "reimport", command);
  assert.equal(accepted.status, 200, JSON.stringify(accepted.body));
  assert.equal(accepted.body.receipt.record_version, 2);
  const estimate = await h.call(
    "coordinator",
    `estimating/estimates/${first.body.receipt.record_id}`,
  );
  const path = `estimating/estimates/${first.body.receipt.record_id}/excel-import/${estimate.body.saved.id}`;
  const evidence = await h.call("coordinator", path);
  assert.equal(evidence.status, 200);
  assert.equal(
    evidence.body.resolution.comparison.comparison_hash,
    c.comparison_hash,
  );
  assert.ok(!JSON.stringify(evidence.body).includes("source_key"));
  const source = await fetch(origin + "/api/v1/" + path + "/source", {
    headers: { cookie },
  });
  assert.equal(source.status, 200);
  assert.equal(source.headers.get("cache-control"), "private, no-store");
  assert.deepEqual(
    Buffer.from(await source.arrayBuffer()),
    Buffer.from(upload.file.base64, "base64"),
  );
  assert.deepEqual(
    (await h.call("coordinator", "operations/" + command.operation_id)).body,
    accepted.body.receipt,
  );
  const replay = await h.call("coordinator", base + "reimport", command);
  assert.equal(replay.body.replayed, true);
  assert.deepEqual(replay.body.receipt, accepted.body.receipt);
  assert.equal(
    (
      await h.call("coordinator", base + "reimport", {
        ...command,
        reason: "different intent",
      })
    ).body.code,
    "OperationConflict",
  );
  assert.equal(
    (
      await h.call("coordinator", base + "reimport", {
        ...command,
        operation_id: randomUUID(),
      })
    ).body.code,
    "ExcelImportComparisonChanged",
  );
  for (const profile of ["observer", "second-company"]) {
    for (const p of [
      path,
      path + "/source",
      "operations/" + command.operation_id,
    ])
      assert.ok([403, 404].includes((await h.call(profile, p)).status));
    assert.ok(
      [403, 404].includes(
        (await h.call(profile, base + "compare", upload)).status,
      ),
    );
    assert.ok(
      [403, 404].includes(
        (await h.call(profile, base + "reimport", command)).status,
      ),
    );
  }
});
