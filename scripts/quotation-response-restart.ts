// Run write, restart the application and PostgreSQL, then run verify.
import assert from "node:assert/strict";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID, createHash } from "node:crypto";
import { database, closeDatabase } from "../src/platform/database";
import { localConfig } from "../src/platform/config";
import {
  session,
  request,
  json,
  httpFixture,
  detail,
  releasePath,
  prepare,
  approve,
  issue,
  envelope,
} from "../tests/helpers/quotation-release-http";
import {
  responseDetail,
  responsePath,
  response,
  responseCommand,
} from "../tests/helpers/quotation-response-http";
if (localConfig().database_name !== "ppo_synthetic_test")
  throw Error("Disposable ppo_synthetic_test only");
const directory =
    process.env.PPO_RESPONSE_PROOF_DIRECTORY ??
    "verification-evidence/estimating-e1-response-restart",
  file = path.join(directory, "checkpoint.json");
const sha = (v: Uint8Array) => createHash("sha256").update(v).digest("hex");
async function snapshot(id: string) {
  return (
    await database().query(
      `SELECT kind,value FROM (
    SELECT 'estimate' kind,to_jsonb(e) value FROM ppo.estimates e WHERE id=$1
    UNION ALL SELECT 'version',to_jsonb(v) FROM ppo.estimate_versions v WHERE estimate_id=$1
    UNION ALL SELECT 'review',to_jsonb(r) FROM ppo.estimate_review_events r WHERE estimate_id=$1
    UNION ALL SELECT 'quote',to_jsonb(q) FROM ppo.draft_quote_revisions q WHERE estimate_id=$1
    UNION ALL SELECT 'base',to_jsonb(b) FROM ppo.quote_release_bases b WHERE revision_id IN(SELECT id FROM ppo.draft_quote_revisions WHERE estimate_id=$1)
    UNION ALL SELECT 'event',to_jsonb(e) FROM ppo.quote_release_events e WHERE revision_id IN(SELECT id FROM ppo.draft_quote_revisions WHERE estimate_id=$1)
    UNION ALL SELECT 'response',to_jsonb(e) FROM ppo.quote_response_events e WHERE revision_id IN(SELECT id FROM ppo.draft_quote_revisions WHERE estimate_id=$1)
    UNION ALL SELECT 'receipt',to_jsonb(r) FROM ppo.operation_receipts r WHERE record_id=$1 OR record_id IN(SELECT id FROM ppo.draft_quote_revisions WHERE estimate_id=$1)
  ) evidence ORDER BY kind,value::text`,
      [id],
    )
  ).rows;
}
async function startTime() {
  return (
    await database().query("SELECT pg_postmaster_start_time()::text started")
  ).rows[0].started;
}
try {
  if (process.argv[2] === "write") {
    const f = await httpFixture(),
      receipts: {
        actor: string;
        path: string;
        command: Record<string, unknown>;
        receipt: unknown;
      }[] = [];
    await json(f.owner, `estimating/quotes/${f.draft.id}/render`, {});
    const p = prepare(await detail(f.owner, f.draft.id)),
      aPath = releasePath(p.id);
    receipts.push({
      actor: "coordinator",
      path: releasePath(f.draft.id) + "/prepare",
      command: p,
      receipt: await json(f.owner, releasePath(f.draft.id) + "/prepare", p),
    });
    await json(f.owner, `estimating/quotes/${p.id}/render`, {});
    const a = approve(await detail(f.approver, p.id));
    receipts.push({
      actor: "quotation-approver",
      path: aPath + "/approval",
      command: a,
      receipt: await json(f.approver, aPath + "/approval", a),
    });
    const i = issue(await detail(f.issuer, p.id));
    receipts.push({
      actor: "quotation-issuer",
      path: aPath + "/issue",
      command: i,
      receipt: await json(f.issuer, aPath + "/issue", i),
    });
    const d = await detail(f.issuer, p.id),
      send = {
        ...envelope(d),
        issue_id: d.issue!.id,
        attempt_id: randomUUID(),
        resolves_event_id: null,
        outcome: "SimulatedDelivered",
      };
    receipts.push({
      actor: "quotation-issuer",
      path: aPath + "/distribution",
      command: send,
      receipt: await json(f.issuer, aPath + "/distribution", send),
    });
    const initial = response(await responseDetail(f.owner, p.id));
    receipts.push({
      actor: "coordinator",
      path: responsePath(p.id) + "/record",
      command: initial,
      receipt: await json(f.owner, responsePath(p.id) + "/record", initial),
    });
    const rd = await responseDetail(f.owner, p.id),
      handover = {
        ...responseCommand(rd),
        owner_id: rd.owner_id,
        due_date: "2026-10-10",
        note: "SYN independent receiving checks remain",
      };
    receipts.push({
      actor: "coordinator",
      path: responsePath(p.id) + "/prepare",
      command: handover,
      receipt: await json(f.owner, responsePath(p.id) + "/prepare", handover),
    });
    const correction = {
      ...response(await responseDetail(f.owner, p.id), "Declined"),
      action: "Correct",
    };
    receipts.push({
      actor: "coordinator",
      path: responsePath(p.id) + "/record",
      command: correction,
      receipt: await json(f.owner, responsePath(p.id) + "/record", correction),
    });
    await mkdir(directory, { recursive: true });
    const files = [];
    for (const id of [f.draft.id, p.id])
      for (const kind of ["html", "pdf"]) {
        const bytes = new Uint8Array(
            await (
              await request(
                f.owner,
                `estimating/quotes/${id}/file?kind=${kind}`,
              )
            ).arrayBuffer(),
          ),
          name = `${id}.${kind}`;
        await writeFile(path.join(directory, name), bytes);
        files.push({ id, kind, name, hash: sha(bytes) });
      }
    await writeFile(
      file,
      JSON.stringify(
        {
          estimate: f.input.id,
          revision: p.id,
          receipts,
          files,
          rows: await snapshot(f.input.id),
          postmaster: await startTime(),
        },
        null,
        2,
      ),
    );
    console.log(
      "ES06 retained separate release, response, preparation and correction receipts plus original Draft and release HTML/PDF before restart.",
    );
  } else if (process.argv[2] === "verify") {
    const data = JSON.parse(await readFile(file, "utf8"));
    assert.notEqual(
      await startTime(),
      data.postmaster,
      "Restart actual PostgreSQL before verification",
    );
    assert.deepEqual(await snapshot(data.estimate), data.rows);
    for (const item of data.receipts) {
      const cookie = await session(item.actor);
      assert.deepEqual(
        await json(cookie, `operations/${item.command.operation_id}`),
        item.receipt,
      );
      assert.deepEqual(
        await json(cookie, item.path, item.command),
        item.receipt,
      );
    }
    const owner = await session("coordinator");
    for (const item of data.files) {
      const r = await request(
        owner,
        `estimating/quotes/${item.id}/file?kind=${item.kind}`,
      );
      assert.equal(r.status, 200);
      const bytes = Buffer.from(await r.arrayBuffer());
      assert.equal(sha(bytes), item.hash);
      assert.deepEqual(bytes, await readFile(path.join(directory, item.name)));
    }
    const d = await detail(owner, data.revision);
    assert.equal(d.events.length, 4);
    const rd = await responseDetail(owner, data.revision);
    assert.equal(rd.events.length, 3);
    assert.equal(rd.events[0].report!.outcome, "Accepted");
    assert.equal(rd.state.response!.report!.outcome, "Declined");
    assert.equal(rd.state.preparedApplicable, false);
    assert.equal(d.issue!.output_hash, d.approval!.output_hash);
    assert.deepEqual(await snapshot(data.estimate), data.rows);
    console.log(
      "ES06 application/PostgreSQL restart verified unchanged rows, seven exact original replays and original Draft/release HTML/PDF bytes.",
    );
  } else throw Error("Use write or verify");
} finally {
  await closeDatabase();
}
