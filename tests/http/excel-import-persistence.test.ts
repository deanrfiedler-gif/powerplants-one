import assert from "node:assert/strict";
import { after, test } from "node:test";
import { closeDatabase, database } from "../../src/platform/database";
import { localConfig } from "../../src/platform/config";
import { httpAcceptance } from "../helpers/acceptance-http";
import { excelImportSetup } from "../helpers/excel-import";
import { uploadRequestLimit } from "../../src/estimating/import/service";
if (localConfig().database_name !== "ppo_synthetic_test")
  throw Error("Disposable synthetic database only");
after(closeDatabase);
const origin = localConfig().origin,
  h = httpAcceptance(origin);
test("XI-HTTP first import retains exact source and authenticated review; original operation recovery, access and protected upload", async () => {
  const s = await excelImportSetup(),
    path = `estimating/workspaces/${s.input.id}/excel-import/commit`;
  const cookie = await h.cookie("coordinator");
  for (const [headers, status] of [
    [{ origin }, 401],
    [{ cookie, origin: "https://invalid.example" }, 403],
  ] as const) {
    const r = await fetch(origin + "/api/v1/" + path, {
      method: "POST",
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify(s.command),
    });
    assert.equal(r.status, status);
  }
  const huge = await h.call("coordinator", path, {
    padding: "x".repeat(uploadRequestLimit),
  });
  assert.equal(huge.status, 422);
  assert.equal(huge.body.code, "PayloadTooLarge");
  const missing = await h.call("coordinator", path, {
    ...s.command,
    confirmations: [],
  });
  assert.equal(missing.status, 422);
  const accepted = await h.call("coordinator", path, s.command);
  assert.equal(accepted.status, 200, JSON.stringify(accepted.body));
  assert.equal(accepted.body.replayed, false);
  const estimate = await h.call(
    "coordinator",
    `estimating/estimates/${accepted.body.receipt.record_id}`,
  );
  assert.equal(estimate.status, 200);
  assert.equal(estimate.body.totals.cost, "62952.38");
  const evidencePath = `estimating/estimates/${accepted.body.receipt.record_id}/excel-import/${estimate.body.saved.id}`;
  const evidence = await h.call("coordinator", evidencePath);
  assert.equal(evidence.status, 200);
  assert.equal(evidence.body.state, "Imported");
  assert.deepEqual(evidence.body.proposal, JSON.parse(JSON.stringify(s.review)));
  assert.equal(evidence.body.lines.length, 12);
  assert.equal(evidence.body.proposal.sections.length, 7);
  assert.ok(!JSON.stringify(evidence.body).includes("source_key"));
  const source = await fetch(origin + "/api/v1/" + evidencePath + "/source", {
    headers: { cookie },
  });
  assert.equal(source.status, 200);
  assert.equal(source.headers.get("cache-control"), "private, no-store");
  assert.equal(source.headers.get("x-content-type-options"), "nosniff");
  assert.match(source.headers.get("content-disposition")!, /^attachment;/);
  assert.deepEqual(
    Buffer.from(await source.arrayBuffer()),
    Buffer.from(s.upload.file.base64, "base64"),
  );
  assert.deepEqual(
    (await h.call("coordinator", "operations/" + s.command.operation_id)).body,
    accepted.body.receipt,
  );
  const replay = await h.call("coordinator", path, s.command);
  assert.equal(replay.status, 200);
  assert.equal(replay.body.replayed, true);
  assert.deepEqual(replay.body.receipt, accepted.body.receipt);
  const changed = await h.call("coordinator", path, {
    ...s.command,
    reason: "Different intent",
  });
  assert.equal(changed.status, 409);
  assert.equal(changed.body.code, "OperationConflict");
  for (const profile of ["second-company", "observer"]) {
    for (const p of [
      evidencePath,
      evidencePath + "/source",
      "operations/" + s.command.operation_id,
    ])
      assert.ok([403, 404].includes((await h.call(profile, p)).status));
    assert.ok(
      [403, 404].includes((await h.call(profile, path, s.command)).status),
    );
  }
  const grants = (
    await database().query(
      "UPDATE ppo.permission_grants SET valid_to=clock_timestamp() WHERE user_id=$1 AND capability='estimating.read' AND valid_to IS NULL RETURNING id",
      [s.p.actor_id],
    )
  ).rows;
  try {
    for (const p of [
      evidencePath,
      evidencePath + "/source",
      "operations/" + s.command.operation_id,
    ])
      assert.equal((await h.call("coordinator", p)).status, 404);
    assert.equal((await h.call("coordinator", path, s.command)).status, 404);
  } finally {
    await database().query(
      "UPDATE ppo.permission_grants SET valid_to=NULL WHERE id=ANY($1::uuid[])",
      [grants.map((g) => g.id)],
    );
  }
});
