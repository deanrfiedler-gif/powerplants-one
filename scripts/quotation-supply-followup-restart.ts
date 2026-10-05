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
import { nativeRevision } from "../tests/helpers/quotation-disposition";
import {
  referral,
  acknowledgement,
  supplyReview,
  supplyApply,
  reservationReview,
} from "../tests/helpers/quotation-supply-followup";
import {
  receiptProposal,
  receiptReceiving,
  receiptReview,
} from "../tests/helpers/quotation-receipt-correction";
import { supplyInput, supplyFact } from "../tests/helpers/supply";
import { crmBase } from "../tests/helpers/crm";
const dispositionProof = false;
if (localConfig().database_name !== "ppo_synthetic_test")
  throw Error("Disposable ppo_synthetic_test only");
const directory =
    process.env.PPO_CONVERSION_PROOF_DIRECTORY ??
    "verification-evidence/quotation-supply-followup-restart",
  file = path.join(directory, "checkpoint.json");
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
    const save = async (target: string, command: Record<string, unknown>) => {
      receipts.push({
        actor: "coordinator",
        path: target,
        command,
        receipt: await json(f.owner, target, command),
      });
    };
    cd = await conversionDetail(f.owner, p.id);
    const td = cd.dispositions[0],
      r = td.basis.target;
    await save(
      `supply/records/${r.id}`,
      nativeRevision(td, {
        data: {
          ...r.data,
          demand_class: "Approved",
          authority: "SYN pre-existing native classification",
        },
      }),
    );
    const supply = supplyInput("Supply", {
      item: r.item,
      unit: r.unit,
      owner_id: r.owner_id,
    });
    await save("supply/records", supply);
    const other = supplyInput("Demand", {
      item: r.item,
      unit: r.unit,
      owner_id: r.owner_id,
      quantity: "8",
    });
    await save("supply/records", other);
    for (const [id, quantity] of [
      [r.id, "2"],
      [other.id, "8"],
    ]) {
      const dr = (await json(f.owner, `supply/records/${id}`)).record,
        sr = (await json(f.owner, `supply/records/${supply.id}`)).record;
      await save("supply/allocations", {
        ...crmBase(),
        id: randomUUID(),
        expected_version: null,
        demand_id: id,
        supply_id: supply.id,
        demand_version: dr.version,
        supply_version: sr.version,
        quantity,
        unit: r.unit,
        basis: "Usable",
      });
    }
    const current = async () =>
      (await conversionDetail(f.owner, p.id)).followups[0];
    await save(
      conversionPath(p.id) + "/supply-refer",
      referral(await current()),
    );
    await save(
      conversionPath(p.id) + "/supply-receive",
      acknowledgement(await current()),
    );
    await save(
      conversionPath(p.id) + "/supply-review",
      supplyReview(await current(), "AdjustAllocation", "1.375001"),
    );
    const native = (await current()).review!.command!;
    await save(
      conversionPath(p.id) + "/supply-apply",
      supplyApply(await current()),
    );
    receipts.push({
      actor: "coordinator",
      path: "supply/allocations",
      command: native,
      receipt: await json(f.owner, `operations/${native.operation_id}`),
    });
    await save(
      `supply/records/${r.id}/facts`,
      supplyFact(
        "ExternalOutcome",
        (await current()).basis.conversion.target.version,
        {
          source_operation: "SYN-restart-reservation-" + randomUUID(),
          effect: "Reservation",
          state: "Unknown",
          lookup_evidence: "SYN original unknown response",
        },
      ),
    );
    await save(
      conversionPath(p.id) + "/supply-review",
      reservationReview(await current()),
    );
    const reservationNative = (await current()).review!.command!;
    assert.ok("record_id" in reservationNative);
    await save(
      conversionPath(p.id) + "/supply-apply",
      supplyApply(await current()),
    );
    const { record_id: reservationTarget, ...reservationCommand } =
      reservationNative;
    receipts.push({
      actor: "coordinator",
      path: `supply/records/${reservationTarget}/facts`,
      command: reservationCommand,
      receipt: await json(
        f.owner,
        `operations/${reservationNative.operation_id}`,
      ),
    });
    // Existing native Stock Receipt: its separate Stock capacity is unchanged.
    const supplyNow = (await json(f.owner, `supply/records/${supply.id}`))
      .record;
    await save(
      `supply/records/${supply.id}/facts`,
      supplyFact("Receipt", supplyNow.version, {
        received: "10",
        inspected: "10",
        usable: "10",
      }),
    );
    await save(
      conversionPath(p.id) + "/receipt-propose",
      receiptProposal(await current()),
    );
    for (const affected of (await current()).receipt_correction.required)
      await save(
        conversionPath(p.id) + "/receipt-receive",
        receiptReceiving(await current(), affected.demand.id),
      );
    await save(
      conversionPath(p.id) + "/supply-review",
      receiptReview(await current()),
    );
    const receiptNative = (await current()).receipt_correction.proposal!
      .command;
    await save(
      conversionPath(p.id) + "/supply-apply",
      supplyApply(await current()),
    );
    const { record_id: receiptTarget, ...receiptCommand } = receiptNative;
    receipts.push({
      actor: "coordinator",
      path: `supply/records/${receiptTarget}/facts`,
      command: receiptCommand,
      receipt: await json(f.owner, `operations/${receiptNative.operation_id}`),
    });
    assert.equal(
      (await current()).receipt_correction.effects!.capacity_basis,
      "Separate Stock observation unchanged",
    );
    cd = await conversionDetail(f.owner, p.id);
    await save(
      conversionPath(p.id) + "/disposition-review",
      dispositionReview(cd.dispositions[0]),
    );
    cd = await conversionDetail(f.owner, p.id);
    await save(
      conversionPath(p.id) + "/disposition-apply",
      dispositionApply(cd.dispositions[0]),
    );
    assert.equal(
      (await conversionDetail(f.owner, p.id)).dispositions[0].status,
      "Resolved",
    );
    await save(
      conversionPath(p.id) + "/supply-review",
      supplyReview(await current(), "Retain"),
    );
    await save(responsePath(p.id) + "/record", {
      ...response(await responseDetail(f.owner, p.id), "Clarification"),
      action: "Correct",
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
    const sessionCutoff = (
      await database().query("SELECT clock_timestamp()::text cutoff")
    ).rows[0].cutoff;
    await writeFile(
      file,
      JSON.stringify(
        {
          estimate: f.input.id,
          revision: p.id,
          dispositionProof,
          supply: supply.id,
          other: other.id,
          receipts,
          files,
          rows: await snapshot(f.input.id, sessionCutoff),
          sessionCutoff,
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
    assert.deepEqual(
      await snapshot(data.estimate, data.sessionCutoff),
      data.rows,
    );
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
    assert.equal(rd.events.length, 4);
    assert.equal(rd.events[0].report!.outcome, "Accepted");
    assert.equal(rd.state.response!.report!.outcome, "Clarification");
    assert.equal(rd.state.preparedApplicable, false);
    assert.equal(d.issue!.output_hash, d.approval!.output_hash);
    const cd = await conversionDetail(owner, data.revision);
    assert.equal(cd.targets.length, 1);
    assert.equal(cd.plan_applicable, false);
    assert.equal(
      cd.targets[0].current.quantity,
      dispositionProof ? "1.375001" : "2",
    );
    assert.equal(cd.targets[0].current.version, 8);
    assert.equal(cd.targets[0].current.data.demand_class, "Approved");
    assert.equal(cd.dispositions[0].status, "Review required");
    assert.equal(cd.followups[0].events.length, 9);
    assert.equal(cd.followups[0].can_apply, false);
    assert.equal(
      cd.followups[0].reservation_dependencies[0].fact.data.state,
      "Confirmed",
    );
    assert.ok(
      cd.followups[0].adjustment_holds.some((h) => h.includes("Consequential")),
    );
    const followup = cd.followups[0];
    const reservationOutcome = followup.events.find(
      (e) =>
        e.action === "Apply" && e.decision === "ReconcileReservationOutcome",
    )!;
    assert.ok(reservationOutcome.native_receipt);
    assert.deepEqual(
      await json(
        owner,
        `operations/${reservationOutcome.native_receipt.operation_id}`,
      ),
      reservationOutcome.native_receipt,
    );
    assert.equal(followup.outcome!.decision, "CorrectReceipt");
    const correction = followup.receipt_correction;
    assert.equal(correction.events.length, 3);
    assert.equal(correction.required.length, 2);
    assert.equal(
      followup.outcome!.receipt_proposal_id,
      correction.proposal!.id,
    );
    assert.deepEqual(
      followup.outcome!.effect_receiving_ids,
      correction.required.map((x) => x.decision!.id),
    );
    assert.ok(
      correction.required.every((x) => x.decision!.decision === "Accepted"),
    );
    assert.equal(
      correction.effects!.capacity_basis,
      "Separate Stock observation unchanged",
    );
    assert.equal(correction.effects!.usable, "10");
    const native = correction.proposal!.command;
    assert.equal(
      followup.outcome!.native_receipt!.operation_id,
      native.operation_id,
    );
    const supply = await json(owner, `supply/records/${data.supply}`);
    const successor = supply.facts.find(
      (f: { id: string }) => f.id === native.id,
    )!;
    assert.equal(successor.predecessor_id, native.predecessor_id);
    assert.deepEqual(successor.data, native.data);
    assert.ok(
      supply.facts.some((f: { id: string }) => f.id === native.predecessor_id),
    );
    assert.equal(supply.record.version, native.expected_version! + 1);
    for (const affected of correction.proposal!.dependencies.group.demands) {
      const current = await json(owner, `supply/records/${affected.record.id}`);
      assert.equal(current.record.version, affected.record.version + 1);
      assert.equal(current.record.quantity, affected.record.quantity);
      assert.deepEqual(current.record.data, affected.record.data);
      assert.equal(
        current.facts.filter((f: { kind: string }) => f.kind === "Impact")
          .length,
        affected.facts.filter((f) => f.kind === "Impact").length + 1,
      );
    }
    assert.equal(
      cd.followups[0].basis.position[0].usable_allocated,
      "9.375001",
    );
    assert.equal(
      cd.followups[0].basis.conversion.dependencies.allocations[0].quantity,
      "1.375001",
    );
    assert.equal(
      cd.followups[0].basis.position[0].demands.find(
        (d) => d.record.id === data.other,
      )!.record.quantity,
      "8",
    );
    assert.equal(
      (
        await request(
          owner,
          conversionPath(data.revision) + "/supply-apply",
          supplyApply(cd.followups[0]),
        )
      ).status,
      409,
    );
    assert.equal(
      (await request(owner, `supply/records/${cd.targets[0].target_id}`))
        .status,
      200,
    );
    assert.deepEqual(
      await snapshot(data.estimate, data.sessionCutoff),
      data.rows,
    );
    await writeFile(
      path.join(directory, "verification.json"),
      JSON.stringify(
        {
          source_head: process.env.PPO_SOURCE_HEAD ?? null,
          verified_at: new Date().toISOString(),
          original_postmaster: data.postmaster,
          restarted_postmaster: await startTime(),
          exact_receipts: data.receipts.length,
          unchanged_snapshot_rows: data.rows.length,
          unchanged_output_files: data.files,
          receipt_proposal_id: correction.proposal!.id,
          affected_receiving_ids: followup.outcome!.effect_receiving_ids,
          native_receipt: followup.outcome!.native_receipt,
          predecessor_fact_id: native.predecessor_id,
          successor_fact_id: native.id,
          retained_reservation_receipt: reservationOutcome.native_receipt,
        },
        null,
        2,
      ),
    );
    console.log(
      `ES07 application/PostgreSQL restart verified unchanged source and target rows, ${data.receipts.length} exact original replays, ${data.rows.length} snapshot rows and ${data.files.length} original Draft/release output files.`,
    );
  } else throw Error("Use write or verify");
} finally {
  await closeDatabase();
}
