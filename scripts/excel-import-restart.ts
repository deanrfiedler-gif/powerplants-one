// Write before, verify after actual compiled application and PostgreSQL restarts.
import assert from "node:assert/strict";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { database, closeDatabase } from "../src/platform/database";
import { localConfig } from "../src/platform/config";
import { digest } from "../src/documents/store";
import { httpAcceptance } from "../tests/helpers/acceptance-http";
import { excelImportSetup } from "../tests/helpers/excel-import";
import {
  revisionCommand,
  changedWorkbook,
} from "../tests/helpers/excel-reimport";
if (localConfig().database_name !== "ppo_synthetic_test")
  throw Error("Disposable synthetic database only");
const origin = localConfig().origin,
  h = httpAcceptance(origin);
const directory =
  process.env.PPO_EXCEL_PROOF_DIRECTORY ??
  "verification-evidence/excel-import-restart";
const file = join(directory, "checkpoint.json");
async function json(path: string, body?: unknown) {
  const result = await h.call("coordinator", path, body);
  assert.equal(result.status, 200, JSON.stringify(result.body));
  return result.body;
}
async function bytes(path: string) {
  const r = await fetch(origin + "/api/v1/" + path + "/source", {
    headers: { cookie: await h.cookie("coordinator") },
  });
  assert.equal(r.status, 200);
  return Buffer.from(await r.arrayBuffer());
}
const started = async () =>
  (await database().query("SELECT pg_postmaster_start_time()::text AS value"))
    .rows[0].value;
async function snapshot(id: string) {
  return (
    await database().query(
      `SELECT * FROM (
  SELECT 'estimate' AS kind,to_jsonb(e) AS value FROM ppo.estimates e WHERE id=$1
  UNION ALL SELECT 'version',to_jsonb(v) FROM ppo.estimate_versions v WHERE estimate_id=$1
  UNION ALL SELECT 'import',to_jsonb(i) FROM ppo.excel_imports i WHERE estimate_id=$1
  UNION ALL SELECT 'reimport',to_jsonb(i) FROM ppo.excel_reimports i WHERE estimate_id=$1
  UNION ALL SELECT 'line',to_jsonb(l) FROM ppo.excel_import_lines l WHERE estimate_version_id IN (SELECT estimate_version_id FROM ppo.excel_imports WHERE estimate_id=$1)
  UNION ALL SELECT 'receipt',to_jsonb(r) FROM ppo.operation_receipts r WHERE record_id=$1
  UNION ALL SELECT 'audit',to_jsonb(a) FROM ppo.audit_events a WHERE object_id=$1
  UNION ALL SELECT 'outbox',to_jsonb(j) FROM ppo.outbox_jobs j WHERE payload->>'record_id'=$1::text
 ) evidence ORDER BY kind,value::text`,
      [id],
    )
  ).rows;
}
try {
  if (process.argv[2] === "write") {
    const s = await excelImportSetup(),
      commitPath = `estimating/workspaces/${s.input.id}/excel-import/commit`;
    const accepted = await json(commitPath, s.command),
      id = accepted.receipt.record_id;
    const estimate = await json(`estimating/estimates/${id}`);
    const path = `estimating/estimates/${id}/excel-import/${estimate.saved.id}`;
    const evidence = await json(path),
      original = await bytes(path);
    assert.deepEqual(original, Buffer.from(s.upload.file.base64, "base64"));
    await mkdir(directory, { recursive: true });
    await writeFile(join(directory, "original.xlsx"), original);
    const revision = await revisionCommand(s, changedWorkbook);
    revision.command.decisions.forEach((d) => (d.action = "Remove"));
    const revisionPath = commitPath.replace(/commit$/, "reimport");
    const revised = await json(revisionPath, revision.command);
    const successor = await json(`estimating/estimates/${id}`);
    const successorPath = `estimating/estimates/${id}/excel-import/${successor.saved.id}`;
    const successorEvidence = await json(successorPath),
      revisedBytes = await bytes(successorPath);
    assert.deepEqual(
      revisedBytes,
      Buffer.from(revision.command.file.base64, "base64"),
    );
    assert.deepEqual(await json(path), evidence);
    assert.deepEqual(await bytes(path), original);
    await writeFile(join(directory, "revised.xlsx"), revisedBytes);
    await writeFile(
      file,
      JSON.stringify(
        {
          id,
          path,
          commitPath,
          command: s.command,
          receipt: accepted.receipt,
          evidence,
          rows: await snapshot(id),
          sha256: digest(original),
          revision: {
            path: successorPath,
            commitPath: revisionPath,
            command: revision.command,
            receipt: revised.receipt,
            evidence: successorEvidence,
            sha256: digest(revisedBytes),
          },
          postmaster: await started(),
        },
        null,
        2,
      ),
    );
    console.log(
      "XI08 saved original and revised workbooks, successor and both operations before restart.",
    );
  } else if (process.argv[2] === "verify") {
    const data = JSON.parse(await readFile(file, "utf8"));
    assert.notEqual(
      await started(),
      data.postmaster,
      "Restart the actual PostgreSQL instance before verification.",
    );
    assert.deepEqual(await snapshot(data.id), data.rows);
    assert.deepEqual(await json(data.revision.path), data.revision.evidence);
    assert.deepEqual(
      await bytes(data.revision.path),
      await readFile(join(directory, "revised.xlsx")),
    );
    assert.equal(digest(await bytes(data.revision.path)), data.revision.sha256);
    assert.deepEqual(
      await json("operations/" + data.revision.command.operation_id),
      data.revision.receipt,
    );
    const revisedReplay = await json(
      data.revision.commitPath,
      data.revision.command,
    );
    assert.equal(revisedReplay.replayed, true);
    assert.deepEqual(revisedReplay.receipt, data.revision.receipt);
    assert.deepEqual(await json(data.path), data.evidence);
    assert.deepEqual(
      await bytes(data.path),
      await readFile(join(directory, "original.xlsx")),
    );
    assert.equal(digest(await bytes(data.path)), data.sha256);
    assert.deepEqual(
      await json("operations/" + data.command.operation_id),
      data.receipt,
    );
    const replay = await json(data.commitPath, data.command);
    assert.equal(replay.replayed, true);
    assert.deepEqual(replay.receipt, data.receipt);
    assert.deepEqual(await snapshot(data.id), data.rows);
    await writeFile(
      join(directory, "result.json"),
      JSON.stringify(
        {
          status: "passed",
          source_sha256: data.sha256,
          revised_source_sha256: data.revision.sha256,
          postmaster_changed: true,
          exact_rows: true,
          exact_workbook: true,
          original_receipt: true,
          replay_without_new_rows: true,
        },
        null,
        2,
      ),
    );
    console.log(
      "XI08 both exact workbooks, versions, comparison, decisions and original receipts survived PostgreSQL and app restarts.",
    );
  } else throw Error("Choose write or verify.");
} finally {
  await closeDatabase();
}
