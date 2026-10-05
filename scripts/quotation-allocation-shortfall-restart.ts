// Actual application and PostgreSQL restart proof; preserved original suite remains separate.
import assert from "node:assert/strict";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { createHash } from "node:crypto";
import { database, closeDatabase } from "../src/platform/database";
import { localConfig } from "../src/platform/config";
import {
  shortfallHttpFixture,
  shortfallProposal,
  shortfallReceiving,
  shortfallReview,
  supplyApply,
  conversionDetail,
  json,
  request,
  session,
} from "../tests/helpers/quotation-allocation-shortfall-http";
if (localConfig().database_name !== "ppo_synthetic_test")
  throw Error("Disposable ppo_synthetic_test only");
const directory =
  process.env.PPO_SHORTFALL_PROOF_DIRECTORY ??
  "verification-evidence/quotation-allocation-shortfall-restart";
const file = path.join(directory, "checkpoint.json");
const sha = (v: Uint8Array) => createHash("sha256").update(v).digest("hex");
async function snapshot(id: string, sessionCutoff: string) {
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
    UNION ALL SELECT 'supply-event',to_jsonb(e) FROM ppo.quote_supply_events e
    UNION ALL SELECT 'shortfall',to_jsonb(e) FROM ppo.quote_supply_shortfall_events e
    UNION ALL SELECT 'receipt-correction',to_jsonb(e) FROM ppo.quote_supply_receipt_events e
    UNION ALL SELECT 'all-native-record',to_jsonb(e) FROM ppo.supply_records e
    UNION ALL SELECT 'all-native-revision',to_jsonb(e) FROM ppo.supply_revisions e
    UNION ALL SELECT 'allocation',to_jsonb(e) FROM ppo.supply_allocations e
    UNION ALL SELECT 'allocation-history',to_jsonb(e) FROM ppo.supply_allocation_history e
    UNION ALL SELECT 'all-native-fact',to_jsonb(e) FROM ppo.supply_facts e
    UNION ALL SELECT 'all-activity',to_jsonb(e) FROM ppo.activities e
    UNION ALL SELECT 'all-activity-link',to_jsonb(e) FROM ppo.activity_links e
    UNION ALL SELECT 'all-receipt',to_jsonb(e) FROM ppo.operation_receipts e
    UNION ALL SELECT 'all-audit',to_jsonb(e) FROM ppo.audit_events e WHERE e.object_type<>'Session' OR e.occurred_at<=$2::timestamptz
    UNION ALL SELECT 'all-outbox',to_jsonb(e) FROM ppo.outbox_jobs e
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
      [id, sessionCutoff],
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
    const f = await shortfallHttpFixture(),
      receipts: {
        path: string;
        command: Record<string, unknown>;
        receipt: unknown;
      }[] = [];
    await json(f.owner, `estimating/quotes/${f.draft.id}/render`, {});
    const save = async (path: string, command: Record<string, unknown>) =>
      receipts.push({
        path,
        command,
        receipt: await json(f.owner, path, command),
      });
    await save(
      f.path + "/shortfall-propose",
      shortfallProposal(await f.current()),
    );
    for (const r of (await f.current()).allocation_shortfall.required)
      await save(
        f.path + "/shortfall-receive",
        shortfallReceiving(await f.current(), r.demand.id),
      );
    await save(f.path + "/supply-review", shortfallReview(await f.current()));
    const reviewed = await f.current(),
      native = reviewed.allocation_shortfall.proposal!.command;
    assert.ok("changes" in native);
    await save(f.path + "/supply-apply", supplyApply(reviewed));
    receipts.push({
      path: "supply/allocations/reduce",
      command: native,
      receipt: await json(f.owner, `operations/${native.operation_id}`),
    });
    const t = await f.current(),
      cd = await conversionDetail(f.owner, f.id);
    assert.equal(t.basis.position[0].usable_allocated, "4.375001");
    assert.equal(cd.dispositions[0].status, "Review required");
    const originalOperations = [];
    for (const e of [
      ...t.events,
      ...t.receipt_correction.events,
      ...t.allocation_shortfall.events,
    ])
      originalOperations.push({
        operation_id: e.operation_id,
        receipt: await json(f.owner, `operations/${e.operation_id}`),
      });
    for (const e of t.events.filter((e) => e.native_receipt))
      originalOperations.push({
        operation_id: e.native_receipt!.operation_id,
        receipt: await json(
          f.owner,
          `operations/${e.native_receipt!.operation_id}`,
        ),
      });
    await mkdir(directory, { recursive: true });
    const files = [];
    for (const id of [f.draft.id, f.id])
      for (const kind of ["html", "pdf"]) {
        const response = await request(
          f.owner,
          `estimating/quotes/${id}/file?kind=${kind}`,
        );
        assert.equal(response.status, 200);
        const bytes = new Uint8Array(await response.arrayBuffer()),
          name = `${id}.${kind}`;
        await writeFile(path.join(directory, name), bytes);
        files.push({ id, kind, name, hash: sha(bytes) });
      }
    const sessionCutoff = (
      await database().query("SELECT clock_timestamp()::text cutoff")
    ).rows[0].cutoff;
    await writeFile(
      file,
      JSON.stringify(
        {
          estimate: f.input.id,
          revision: f.id,
          receipts,
          originalOperations,
          files,
          sessionCutoff,
          rows: await snapshot(f.input.id, sessionCutoff),
          position: t.basis.position,
          proposal: t.allocation_shortfall.proposal,
          outcome: t.outcome,
          postmaster: await startTime(),
        },
        null,
        2,
      ),
    );
    console.log(
      `Shortfall checkpoint: ${receipts.length} exact replays, ${originalOperations.length} original operation lookups, four output files.`,
    );
  } else if (process.argv[2] === "verify") {
    const data = JSON.parse(await readFile(file, "utf8"));
    assert.notEqual(
      await startTime(),
      data.postmaster,
      "Restart actual PostgreSQL first",
    );
    assert.deepEqual(
      await snapshot(data.estimate, data.sessionCutoff),
      data.rows,
    );
    const owner = await session("coordinator");
    for (const item of data.originalOperations)
      assert.deepEqual(
        await json(owner, `operations/${item.operation_id}`),
        item.receipt,
      );
    for (const item of data.receipts) {
      assert.deepEqual(
        await json(owner, `operations/${item.command.operation_id}`),
        item.receipt,
      );
      assert.deepEqual(
        await json(owner, item.path, item.command),
        item.receipt,
      );
    }
    for (const item of data.files) {
      const response = await request(
        owner,
        `estimating/quotes/${item.id}/file?kind=${item.kind}`,
      );
      assert.equal(response.status, 200);
      const bytes = Buffer.from(await response.arrayBuffer());
      assert.equal(sha(bytes), item.hash);
      assert.deepEqual(bytes, await readFile(path.join(directory, item.name)));
    }
    const d = await conversionDetail(owner, data.revision),
      t = d.followups[0];
    assert.deepEqual(t.basis.position, data.position);
    assert.deepEqual(t.outcome, data.outcome);
    assert.deepEqual(t.allocation_shortfall.proposal, data.proposal);
    assert.equal(t.basis.position[0].usable_allocated, "4.375001");
    assert.equal(t.allocation_shortfall.effects!.shortfall, "0");
    assert.ok(
      t.allocation_shortfall.effects!.demands.every((x) => x.unmet !== "0"),
    );
    assert.ok(
      t.basis.position[0].demands.every((x) =>
        x.facts.some(
          (f) => f.kind === "Impact" && f.data.state === "Requested",
        ),
      ),
    );
    assert.equal(d.dispositions[0].status, "Review required");
    assert.equal(t.can_apply, false);
    assert.deepEqual(
      await snapshot(data.estimate, data.sessionCutoff),
      data.rows,
    );
    const verification = {
      source_head: process.env.PPO_SOURCE_HEAD ?? null,
      verified_at: new Date().toISOString(),
      original_postmaster: data.postmaster,
      restarted_postmaster: await startTime(),
      exact_replays: data.receipts.length,
      original_operation_receipts: data.originalOperations.length,
      unchanged_snapshot_rows: data.rows.length,
      unchanged_output_files: data.files,
      receipt_correction_id:
        t.allocation_shortfall.proposal!.dependencies.correction.id,
      allocation_proposal_id: t.outcome!.allocation_proposal_id,
      receiving_ids: t.outcome!.effect_receiving_ids,
      native_receipt: t.outcome!.native_receipt,
      capacity: t.basis.position[0].usable,
      allocated: t.basis.position[0].usable_allocated,
      unmet: t.allocation_shortfall.effects!.demands.map((x) => ({
        id: x.record.id,
        quantity: x.unmet,
      })),
    };
    await writeFile(
      path.join(directory, "verification.json"),
      JSON.stringify(verification, null, 2),
    );
    console.log(
      `Shortfall application/PostgreSQL restart: ${data.receipts.length} exact replays, ${data.originalOperations.length} original receipts, ${data.rows.length} unchanged snapshot rows, four unchanged output files. Unmet Demand and operational holds retained.`,
    );
  } else throw Error("Use write or verify");
} finally {
  await closeDatabase();
}
