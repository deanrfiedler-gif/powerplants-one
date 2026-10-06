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
import {
  conversionDetail,
  conversionPath,
  receiving,
  resolution,
  plan,
  conversion,
} from "../tests/helpers/quotation-conversion-http";
import {
  dispositionReview,
  dispositionApply,
} from "../tests/helpers/quotation-disposition";
const dispositionProof = process.env.PPO_CONVERSION_DISPOSITION === "1";
if (localConfig().database_name !== "ppo_synthetic_test")
  throw Error("Disposable ppo_synthetic_test only");
const directory =
    process.env.PPO_CONVERSION_PROOF_DIRECTORY ??
    "verification-evidence/quotation-conversion-restart",
  file = path.join(directory, "checkpoint.json");
const sha = (v: Uint8Array) => createHash("sha256").update(v).digest("hex");
async function snapshot(id: string) {
  return (
    await database().query(
      `SELECT kind,value FROM (
    SELECT 'estimate' kind,to_jsonb(e) value FROM ppo.estimates e WHERE id=$1
    UNION ALL SELECT 'version',to_jsonb(v) FROM ppo.estimate_versions v WHERE estimate_id=$1
    UNION ALL SELECT 'review',to_jsonb(r) FROM ppo.estimate_review_events r WHERE estimate_id=$1
    UNION ALL SELECT 'quote-header',to_jsonb(q) FROM ppo.draft_quotes q WHERE estimate_id=$1
    UNION ALL SELECT 'quote',to_jsonb(q) FROM ppo.draft_quote_revisions q WHERE estimate_id=$1
    UNION ALL SELECT 'job',to_jsonb(j) FROM ppo.estimate_quote_jobs j WHERE revision_id IN(SELECT id FROM ppo.draft_quote_revisions WHERE estimate_id=$1)
    UNION ALL SELECT 'attempt',to_jsonb(a) FROM ppo.estimate_quote_attempts a WHERE job_id IN(SELECT j.id FROM ppo.estimate_quote_jobs j JOIN ppo.draft_quote_revisions q ON q.id=j.revision_id WHERE q.estimate_id=$1)
    UNION ALL SELECT 'base',to_jsonb(b) FROM ppo.quote_release_bases b WHERE revision_id IN(SELECT id FROM ppo.draft_quote_revisions WHERE estimate_id=$1)
    UNION ALL SELECT 'event',to_jsonb(e) FROM ppo.quote_release_events e WHERE revision_id IN(SELECT id FROM ppo.draft_quote_revisions WHERE estimate_id=$1)
    UNION ALL SELECT 'response',to_jsonb(e) FROM ppo.quote_response_events e WHERE revision_id IN(SELECT id FROM ppo.draft_quote_revisions WHERE estimate_id=$1)
    UNION ALL SELECT 'conversion',to_jsonb(e) FROM ppo.quote_conversion_events e WHERE revision_id IN(SELECT id FROM ppo.draft_quote_revisions WHERE estimate_id=$1)
    UNION ALL SELECT 'disposition',to_jsonb(e) FROM ppo.quote_disposition_events e WHERE revision_id IN(SELECT id FROM ppo.draft_quote_revisions WHERE estimate_id=$1)
    UNION ALL SELECT 'native-fact',to_jsonb(f) FROM ppo.supply_facts f WHERE record_id IN(SELECT target_id FROM ppo.quote_conversion_targets WHERE revision_id IN(SELECT id FROM ppo.draft_quote_revisions WHERE estimate_id=$1))
    UNION ALL SELECT 'native-activity',to_jsonb(a) FROM ppo.activities a WHERE id IN(SELECT activity_id FROM ppo.supply_facts WHERE record_id IN(SELECT target_id FROM ppo.quote_conversion_targets WHERE revision_id IN(SELECT id FROM ppo.draft_quote_revisions WHERE estimate_id=$1)))
    UNION ALL SELECT 'native-activity-link',to_jsonb(a) FROM ppo.activity_links a WHERE activity_id IN(SELECT activity_id FROM ppo.supply_facts WHERE record_id IN(SELECT target_id FROM ppo.quote_conversion_targets WHERE revision_id IN(SELECT id FROM ppo.draft_quote_revisions WHERE estimate_id=$1)))
    UNION ALL SELECT 'target-link',to_jsonb(t) FROM ppo.quote_conversion_targets t WHERE revision_id IN(SELECT id FROM ppo.draft_quote_revisions WHERE estimate_id=$1)
    UNION ALL SELECT 'target',to_jsonb(s) FROM ppo.supply_records s WHERE id IN(SELECT target_id FROM ppo.quote_conversion_targets WHERE revision_id IN(SELECT id FROM ppo.draft_quote_revisions WHERE estimate_id=$1))
    UNION ALL SELECT 'target-revision',to_jsonb(s) FROM ppo.supply_revisions s WHERE record_id IN(SELECT target_id FROM ppo.quote_conversion_targets WHERE revision_id IN(SELECT id FROM ppo.draft_quote_revisions WHERE estimate_id=$1))
    UNION ALL SELECT 'target-receipt',to_jsonb(s) FROM ppo.operation_receipts s WHERE record_id IN(SELECT target_id FROM ppo.quote_conversion_targets WHERE revision_id IN(SELECT id FROM ppo.draft_quote_revisions WHERE estimate_id=$1))
    UNION ALL SELECT 'target-audit',to_jsonb(s) FROM ppo.audit_events s WHERE object_id IN(SELECT target_id FROM ppo.quote_conversion_targets WHERE revision_id IN(SELECT id FROM ppo.draft_quote_revisions WHERE estimate_id=$1))
    UNION ALL SELECT 'target-outbox',to_jsonb(s) FROM ppo.outbox_jobs s WHERE operation_id IN(SELECT operation_id FROM ppo.operation_receipts WHERE record_id IN(SELECT target_id FROM ppo.quote_conversion_targets WHERE revision_id IN(SELECT id FROM ppo.draft_quote_revisions WHERE estimate_id=$1)))
    UNION ALL SELECT 'receipt',to_jsonb(r) FROM ppo.operation_receipts r WHERE record_id=$1 OR record_id IN(SELECT id FROM ppo.draft_quote_revisions WHERE estimate_id=$1)
    UNION ALL SELECT 'audit',to_jsonb(a) FROM ppo.audit_events a WHERE object_id=$1 OR object_id IN(SELECT id FROM ppo.draft_quote_revisions WHERE estimate_id=$1)
    UNION ALL SELECT 'outbox',to_jsonb(j) FROM ppo.outbox_jobs j WHERE operation_id IN(SELECT operation_id FROM ppo.operation_receipts WHERE record_id=$1 OR record_id IN(SELECT id FROM ppo.draft_quote_revisions WHERE estimate_id=$1))
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
    let cd = await conversionDetail(f.owner, p.id);
    const steps = [{ kind: "receive", body: receiving(cd, rd.owner_id) }];
    for (const step of steps) {
      const target = conversionPath(p.id) + "/" + step.kind;
      receipts.push({
        actor: "coordinator",
        path: target,
        command: step.body,
        receipt: await json(f.owner, target, step.body),
      });
    }
    cd = await conversionDetail(f.owner, p.id);
    for (const line of cd.lines) {
      const body = resolution(cd, line),
        target = conversionPath(p.id) + "/resolve";
      receipts.push({
        actor: "coordinator",
        path: target,
        command: body,
        receipt: await json(f.owner, target, body),
      });
      cd = await conversionDetail(f.owner, p.id);
    }
    const reviewed = plan(cd),
      planPath = conversionPath(p.id) + "/plan";
    receipts.push({
      actor: "coordinator",
      path: planPath,
      command: reviewed,
      receipt: await json(f.owner, planPath, reviewed),
    });
    cd = await conversionDetail(f.owner, p.id);
    const original = conversion(cd),
      executePath = conversionPath(p.id) + "/execute";
    receipts.push({
      actor: "coordinator",
      path: executePath,
      command: original,
      receipt: await json(f.owner, executePath, original),
    });
    for (const target of cd.plan!.plan!.commands)
      receipts.push({
        actor: "coordinator",
        path: "supply/records",
        command: target,
        receipt: await json(f.owner, `operations/${target.operation_id}`),
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
    if (dispositionProof) {
      const save = async (suffix: string, command: Record<string, unknown>) => {
        const target = conversionPath(p.id) + "/" + suffix;
        receipts.push({
          actor: "coordinator",
          path: target,
          command,
          receipt: await json(f.owner, target, command),
        });
      };
      cd = await conversionDetail(f.owner, p.id);
      await save(
        "disposition-review",
        dispositionReview(cd.dispositions[0], "ReviseQuantity", "1.375001"),
      );
      cd = await conversionDetail(f.owner, p.id);
      const native = cd.dispositions[0].review!.command!;
      await save("disposition-apply", dispositionApply(cd.dispositions[0]));
      receipts.push({
        actor: "coordinator",
        path: `supply/records/${native.id}`,
        command: native,
        receipt: await json(f.owner, `operations/${native.operation_id}`),
      });
      cd = await conversionDetail(f.owner, p.id);
      assert.equal(cd.dispositions[0].status, "Resolved");
      await save("disposition-review", dispositionReview(cd.dispositions[0]));
      const later = {
        ...response(await responseDetail(f.owner, p.id), "Clarification"),
        action: "Correct",
      };
      const target = responsePath(p.id) + "/record";
      receipts.push({
        actor: "coordinator",
        path: target,
        command: later,
        receipt: await json(f.owner, target, later),
      });
    }
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
          dispositionProof,
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
      `ES07 retained ${receipts.length} release, response, conversion${dispositionProof ? ", disposition" : ""} and native-target receipts plus original Draft and release HTML/PDF before restart.`,
    );
  } else if (process.argv[2] === "verify") {
    const data = JSON.parse(await readFile(file, "utf8"));
    assert.equal(data.dispositionProof, dispositionProof);
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
    assert.equal(rd.events.length, dispositionProof ? 4 : 3);
    assert.equal(rd.events[0].report!.outcome, "Accepted");
    assert.equal(
      rd.state.response!.report!.outcome,
      dispositionProof ? "Clarification" : "Declined",
    );
    assert.equal(rd.state.preparedApplicable, false);
    assert.equal(d.issue!.output_hash, d.approval!.output_hash);
    const cd = await conversionDetail(owner, data.revision);
    assert.equal(cd.targets.length, 1);
    assert.equal(cd.plan_applicable, false);
    assert.equal(
      cd.targets[0].current.quantity,
      dispositionProof ? "1.375001" : "2",
    );
    if (dispositionProof) {
      assert.equal(cd.targets[0].current.version, 2);
      assert.equal(cd.dispositions[0].events.length, 3);
      assert.equal(cd.dispositions[0].status, "Review required");
      assert.equal(cd.dispositions[0].can_apply, false);
      assert.equal(cd.dispositions[0].applied!.decision, "ReviseQuantity");
      assert.ok(
        cd.dispositions[0].review_holds.some((h) => h.includes("changed")),
      );
      assert.equal(
        (
          await request(
            owner,
            conversionPath(data.revision) + "/disposition-apply",
            dispositionApply(cd.dispositions[0]),
          )
        ).status,
        409,
      );
    }
    assert.equal(cd.targets[0].current.data.demand_class, "Forecast");
    assert.equal(
      (await request(owner, `supply/records/${cd.targets[0].target_id}`))
        .status,
      200,
    );
    assert.deepEqual(await snapshot(data.estimate), data.rows);
    console.log(
      `ES07 application/PostgreSQL restart verified unchanged source and target rows, ${data.receipts.length} exact original replays and original Draft/release HTML/PDF bytes.`,
    );
  } else throw Error("Use write or verify");
} finally {
  await closeDatabase();
}
