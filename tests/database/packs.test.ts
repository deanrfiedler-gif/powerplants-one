import assert from "node:assert/strict";
import { beforeEach, after, test } from "node:test";
import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { database, closeDatabase } from "../../src/platform/database";
import { localConfig } from "../../src/platform/config";
import { reset, migrate, seed } from "../../scripts/database";
import {
  createPack,
  readPack,
  checkPack,
  requestIssue,
  revisePack,
  withdrawPack,
  acknowledgePack,
  dispatchReadiness,
  recordDistribution,
} from "../../src/documents/packs";
import {
  readBundle,
  processRenderJob,
  readRenderJob,
} from "../../src/documents/worker";
import { saveWorkScope, readWorkOrder } from "../../src/service/work-orders";
import { documentStore } from "../../src/documents/store";
import { readOperation } from "../../src/shared/receipts";
import {
  readAppointment,
  cancelAppointment,
  moveAppointment,
} from "../../src/scheduling/planner";
import {
  id,
  base,
  principal,
  rows,
  content,
  prepared,
  queued,
  issued,
  confirmed,
} from "../helpers/packs";
if (localConfig().database_name !== "ppo_synthetic_test")
  throw Error("Use the disposable test database.");
process.env.PPO_ALLOW_RESET = "dispose-synthetic";
process.env.PPO_RESET_DATABASE = "ppo_synthetic_test";
beforeEach(reset);
after(closeDatabase);
const code = (code: string) => (e: unknown) =>
  (e as { code: string }).code === code;
async function ack(
  pack: Awaited<ReturnType<typeof readPack>>["items"][number],
  profile: string,
  issueId = pack.current_issue_id!,
) {
  const p = await principal(profile),
    recipient = pack.readiness.recipients.find(
      (r: {
        user_id: string;
        assignment_id: string;
        assignment_version: number;
      }) => r.user_id === p.actor_id,
    )!;
  return {
    p,
    input: {
      ...base(),
      assignment_id: recipient.assignment_id,
      assignment_version: recipient.assignment_version,
      presented_hash: pack.issues.find(
        (i: { id: string; output_hash: string }) => i.id === issueId,
      )!.output_hash,
      captured_at: new Date().toISOString(),
    },
  };
}
test("P06 upgrade and repeat seed preserve exact P05 SQL evidence, revoked grants and accepted receipts", async () => {
  await database().query(
    await readFile("db/migrations/0001-recover.sql", "utf8"),
  );
  await database().query("DROP TABLE public.ppo_migrations");
  await migrate(5);
  await seed(5);
  await database().query(
    "UPDATE ppo.permission_grants SET valid_to='2026-09-01' WHERE user_id=$1 AND capability='schedule.manage'",
    [id("30")],
  );
  const old = await rows(
    "SELECT (SELECT jsonb_agg(to_jsonb(a) ORDER BY id) FROM ppo.appointments a) a,(SELECT jsonb_agg(to_jsonb(r) ORDER BY appointment_id,version) FROM ppo.appointment_revisions r) r,(SELECT jsonb_agg(to_jsonb(d) ORDER BY id) FROM ppo.document_references d) d,(SELECT jsonb_agg(to_jsonb(o) ORDER BY id) FROM ppo.operation_receipts o) o",
  );
  await migrate();
  await seed();
  await seed();
  assert.deepEqual(
    await rows(
      "SELECT (SELECT jsonb_agg(to_jsonb(a) ORDER BY id) FROM ppo.appointments a) a,(SELECT jsonb_agg(to_jsonb(r) ORDER BY appointment_id,version) FROM ppo.appointment_revisions r) r,(SELECT jsonb_agg(to_jsonb(d) ORDER BY id) FROM ppo.document_references d) d,(SELECT jsonb_agg(to_jsonb(o) ORDER BY id) FROM ppo.operation_receipts o) o",
    ),
    old,
  );
  assert.deepEqual(
    (await rows("SELECT version FROM public.ppo_migrations ORDER BY version")).map(r=>r.version),
    [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 17, 18, 19],
  );
  assert.equal(
    (
      await rows(
        "SELECT valid_to<'2026-09-05' AS revoked FROM ppo.permission_grants WHERE user_id=$1 AND capability='schedule.manage'",
        [id("30")],
      )
    )[0].revoked,
    true,
  );
});
test("P06 prepare/check while dispatch held; queued is not Issued; same operation returns exact queued receipt", async () => {
  const q = await queued();
  assert.equal(q.receipt.receipt.state, "Queued");
  assert.equal(q.pack.readiness.dispatch_hold, true);
  assert.equal(q.pack.issues.length, 0);
  assert.deepEqual(await requestIssue(q.p, q.pack.id, q.cmd), {
    ...q.receipt,
    replayed: true,
  });
  assert.deepEqual(
    await readOperation(q.p, q.cmd.operation_id),
    q.receipt.receipt,
  );
  await assert.rejects(
    requestIssue(q.p, q.pack.id, { ...q.cmd, reason: "changed" }),
    code("OperationConflict"),
  );
});
test("P06 exact immutable output and two independent acknowledgements control component readiness", async () => {
  const q = await issued();
  assert.equal(q.pack.issues.length, 1);
  assert.equal(q.pack.readiness.recipients.length, 2);
  const manifest = q.pack.issues[0].manifest,
    b = await readBundle(q.p, manifest);
  assert.match(b.html, /Synthetic prototype/);
  assert.ok(b.pdf.length > 1000);
  assert.doesNotMatch(
    b.html,
    /PRIVATE_FINANCE|CONFIDENTIAL-MARGIN|pending_account_plan/,
  );
  const first = await ack(q.pack, "assigned-technician");
  const result = await acknowledgePack(first.p, q.issue_id, first.input);
  assert.equal(
    (await dispatchReadiness(database(), q.p, q.pack.appointment_id))
      .dispatch_hold,
    true,
  );
  assert.deepEqual(
    (await acknowledgePack(first.p, q.issue_id, first.input)).receipt,
    result.receipt,
  );
  await assert.rejects(
    acknowledgePack(first.p, q.issue_id, { ...first.input, reason: "changed" }),
    code("OperationConflict"),
  );
  const second = await ack(q.pack, "second-technician");
  await acknowledgePack(second.p, q.issue_id, second.input);
  const ready = await dispatchReadiness(database(), q.p, q.pack.appointment_id);
  assert.equal(ready.component_ready, true);
  assert.equal(ready.actual_start_implemented, true); // P07 supplies the real guarded start; original acknowledgement assertions remain.
  assert.equal(
    (await readAppointment(q.p, q.pack.appointment_id)).items[0].dispatch_hold,
    false,
  );
  assert.deepEqual(await readBundle(q.p, manifest), b);
});
test("P06 competing workers and competing issue requests cannot duplicate file/issue/tasks", async () => {
  const q = await queued();
  const attempts = await Promise.allSettled([
    requestIssue(q.p, q.pack.id, {
      ...base(),
      expected_version: q.pack.version,
    }),
    processRenderJob(q.pack.jobs[0].id),
    processRenderJob(q.pack.jobs[0].id),
  ]);
  assert.equal(attempts[0].status, "rejected");
  const p = (await readPack(q.p, q.pack.id)).items[0];
  assert.equal(p.issues.length, 1);
  assert.equal(p.readiness.recipients.length, 2);
  assert.equal(
    (
      await rows(
        "SELECT count(*)::int n FROM ppo.pack_distribution_events WHERE kind='TaskCreated'",
      )
    )[0].n,
    2,
  );
});
test("P06 same recipient concurrency is one response and cannot acknowledge for another crew member", async () => {
  const q = await issued(),
    first = await ack(q.pack, "assigned-technician"),
    second = await ack(q.pack, "second-technician");
  await assert.rejects(
    acknowledgePack(first.p, q.issue_id, second.input),
    code("RecordUnavailable"),
  );
  const results = await Promise.allSettled([
    acknowledgePack(first.p, q.issue_id, first.input),
    acknowledgePack(first.p, q.issue_id, { ...first.input, ...base() }),
  ]);
  assert.equal(results.filter((x) => x.status === "fulfilled").length, 1);
  assert.equal(
    (await rows("SELECT count(*)::int n FROM ppo.pack_acknowledgements"))[0].n,
    1,
  );
});
test("P06 return retains comments; amendment freezes predecessor; old issue cannot satisfy successor", async () => {
  const q = await issued(),
    oldBytes = await readBundle(q.p, q.pack.issues[0].manifest),
    first = await ack(q.pack, "assigned-technician");
  await acknowledgePack(first.p, q.issue_id, first.input);
  let p = (await readPack(q.p, q.pack.id)).items[0];
  await revisePack(q.p, p.id, {
    ...base(),
    expected_version: p.version,
    content: content(),
  });
  p = (await readPack(q.p, p.id)).items[0];
  assert.equal(p.readiness.dispatch_hold, true);
  await checkPack(q.p, p.id, {
    ...base(),
    expected_version: p.version,
    decision: "Returned",
    reason: "SYN clarify collection arrangements",
  });
  p = (await readPack(q.p, p.id)).items[0];
  assert.equal(p.checks[0].decision, "Returned");
  await checkPack(q.p, p.id, {
    ...base(),
    expected_version: p.version,
    decision: "Checked",
  });
  p = (await readPack(q.p, p.id)).items[0];
  await requestIssue(q.p, p.id, { ...base(), expected_version: p.version });
  p = (await readPack(q.p, p.id)).items[0];
  await processRenderJob(p.jobs[0].id);
  p = (await readPack(q.p, p.id)).items[0];
  assert.equal(p.issues.length, 2);
  assert.notEqual(p.current_issue_id, q.issue_id);
  assert.ok(
    p.readiness.recipients.every(
      (r: { acknowledged_at: string | null }) => !r.acknowledged_at,
    ),
  );
  await assert.rejects(
    acknowledgePack(first.p, q.issue_id, { ...first.input, ...base() }),
    code("IssueNotApplicable"),
  );
  assert.deepEqual(await readBundle(q.p, q.pack.issues[0].manifest), oldBytes);
  assert.ok(p.events.some((e: { kind: string }) => e.kind === "Superseded"));
});
test("P06 withdrawal preserves exact original issue and individual response history", async () => {
  const q = await issued(),
    before = await readBundle(q.p, q.pack.issues[0].manifest);
  await withdrawPack(q.p, q.pack.id, {
    ...base(),
    expected_version: q.pack.version,
  });
  const p = (await readPack(q.p, q.pack.id)).items[0];
  assert.equal(p.status, "Withdrawn");
  assert.equal(p.readiness.dispatch_hold, true);
  assert.deepEqual(await readBundle(q.p, q.pack.issues[0].manifest), before);
  await assert.rejects(
    database().query(
      "UPDATE ppo.pack_issues SET output_hash=repeat('0',64) WHERE id=$1",
      [q.issue_id],
    ),
  );
  await assert.rejects(
    database().query("DELETE FROM ppo.pack_revisions WHERE pack_id=$1", [
      q.pack.id,
    ]),
  );
});
for (const change of [
  "source",
  "template",
  "assignment",
  "permission",
] as const)
  test(`P06 ${change} changed during render prevents issue and retains prior generated bytes`, async () => {
    const q = await queued(),
      job = q.pack.jobs[0];
    const result = await processRenderJob(job.id, {
      afterRender: async () => {
        if (change === "source")
          await database().query(
            "UPDATE ppo.pack_source_locations SET available=false,version=version+1 WHERE source_id=$1",
            [id("c2")],
          );
        if (change === "template") {
          await database().query(
            "INSERT INTO ppo.pack_templates(id,workspace_id,version,name,renderer_version,definition,content_hash) SELECT $1,workspace_id,(SELECT max(version)+1 FROM ppo.pack_templates),name,renderer_version,definition,content_hash FROM ppo.pack_templates WHERE id=$2",
            [id("c1", 99), id("c1")],
          );
          await database().query(
            "UPDATE ppo.pack_policy SET version=version+1,template_id=$1",
            [id("c1", 99)],
          );
        }
        if (change === "permission")
          await database().query(
            "UPDATE ppo.permission_grants SET valid_to='2026-09-01' WHERE capability='pack.issue'",
          );
        if (change === "assignment") {
          const a = (await readAppointment(q.p, q.pack.appointment_id))
            .items[0];
          await cancelAppointment(q.p, a.id, {
            ...base(),
            expected_version: a.version,
            expected_work_order_version: a.work_order_version,
            expected_assignment_version: a.assignment_version,
          });
        }
      },
    });
    assert.ok(!("issue_id" in result));
    assert.equal(
      (await rows("SELECT count(*)::int n FROM ppo.pack_issues"))[0].n,
      0,
    );
    assert.ok(await documentStore().locate({ ...q.p, operation_id: job.id }));
  });
for (const at of ["afterStore", "beforeFinalise"] as const)
  test(`P06 ${at} failure recovers exact original output without rendering or duplicate effects`, async () => {
    const q = await queued(),
      job = q.pack.jobs[0];
    const failed = await processRenderJob(job.id, {
      [at]: async () => {
        throw Error("injected failure");
      },
    });
    assert.equal("state" in failed && failed.state, "Failed");
    const first = await documentStore().locate({
      ...q.p,
      operation_id: job.id,
    });
    assert.ok(first);
    const recovered = await processRenderJob(job.id, {
      render: async () => {
        throw Error("must reuse original durable bundle");
      },
    });
    assert.ok("issue_id" in recovered);
    assert.deepEqual(
      await documentStore().locate({ ...q.p, operation_id: job.id }),
      first,
    );
    assert.equal(
      (await rows("SELECT count(*)::int n FROM ppo.pack_issues"))[0].n,
      1,
    );
    assert.equal(
      (await rows("SELECT count(*)::int n FROM ppo.pack_recipients"))[0].n,
      2,
    );
    assert.equal((await readRenderJob(q.p, job.id)).attempts, 2);
  });
test("P06 render failure remains owned and recoverable with no file or issued claim", async () => {
  const q = await queued(),
    job = q.pack.jobs[0];
  const failure = await processRenderJob(job.id, {
    render: async () => {
      throw Error("renderer unavailable");
    },
  });
  assert.equal("state" in failure && failure.state, "Failed");
  const j = await readRenderJob(q.p, job.id);
  assert.equal(j.recovery_owner_id, id("30"));
  assert.equal(j.issue_id, null);
  assert.equal(
    await documentStore().locate({ ...q.p, operation_id: job.id }),
    null,
  );
  assert.ok("issue_id" in (await processRenderJob(job.id)));
});
test("P06 missing historical source is never replaced by latest; existing issue remains retrievable", async () => {
  const q = await issued(),
    bytes = await readBundle(q.p, q.pack.issues[0].manifest);
  await database().query(
    "UPDATE ppo.pack_source_locations SET display_name='SYN renamed source',version=version+1 WHERE source_id=$1",
    [id("c2")],
  );
  assert.deepEqual(await readBundle(q.p, q.pack.issues[0].manifest), bytes);
  await database().query(
    "UPDATE ppo.pack_source_locations SET available=false WHERE source_id=$1",
    [id("c2")],
  );
  await assert.rejects(
    revisePack(q.p, q.pack.id, {
      ...base(),
      expected_version: q.pack.version,
      content: content(),
    }),
    code("StaleSource"),
  );
  assert.deepEqual(await readBundle(q.p, q.pack.issues[0].manifest), bytes);
});
test("P06 source and metadata audience filtering rejects Finance, internal and cross-record traversal", async () => {
  const a = await confirmed(),
    p = await principal();
  await assert.rejects(
    createPack(p, {
      ...base(),
      id: randomUUID(),
      appointment_id: a.id,
      expected_appointment_version: a.version,
      content: { ...content(), source_ids: [id("c2", 3)] },
    }),
    code("RecordUnavailable"),
  );
  const pack = await createPack(p, {
    ...base(),
    id: randomUUID(),
    appointment_id: a.id,
    expected_appointment_version: a.version,
    content: content(),
  });
  await assert.rejects(
    readPack(await principal("observer"), pack.receipt.record_id),
    code("Forbidden"),
  );
  await assert.rejects(
    readPack(await principal("second-company"), pack.receipt.record_id),
  );
  await assert.rejects(
    readPack(await principal("assigned-technician"), randomUUID()),
    code("RecordUnavailable"),
  );
});
test("P06 actual checked source is immutable and stale preparation/check is refused", async () => {
  const pack = await prepared(),
    p = await principal();
  await database().query("UPDATE ppo.pack_policy SET version=version+1");
  await assert.rejects(
    checkPack(p, pack.id, {
      ...base(),
      expected_version: pack.version,
      decision: "Checked",
    }),
    code("StaleSource"),
  );
  await assert.rejects(
    database().query(
      "UPDATE ppo.pack_revisions SET change_reason='rewrite' WHERE pack_id=$1",
      [pack.id],
    ),
  );
});
test("P06 narrow commands reject forged identity and invented acknowledgement/delivery", async () => {
  const pack = await prepared(),
    p = await principal();
  await assert.rejects(
    checkPack(p, pack.id, {
      ...base(),
      expected_version: pack.version,
      decision: "Checked",
      actor_id: randomUUID(),
    }),
    code("InvalidData"),
  );
  await assert.rejects(
    recordDistribution(p, randomUUID(), {
      ...base(),
      recipient_id: randomUUID(),
      kind: "Delivered",
      evidence: "no evidence",
    }),
    code("InvalidData"),
  );
});
test("P06 P05 cancellation atomically withdraws real issue and keeps original output/history", async () => {
  const q = await issued(),
    a = (await readAppointment(q.p, q.pack.appointment_id)).items[0],
    bytes = await readBundle(q.p, q.pack.issues[0].manifest);
  await cancelAppointment(q.p, a.id, {
    ...base(),
    expected_version: a.version,
    expected_work_order_version: a.work_order_version,
    expected_assignment_version: a.assignment_version,
  });
  const p = (await readPack(q.p, q.pack.id)).items[0];
  assert.equal(p.status, "Withdrawn");
  assert.ok(p.events.some((e: { kind: string }) => e.kind === "Withdrawn"));
  assert.equal(p.readiness.dispatch_hold, true);
  assert.deepEqual(await readBundle(q.p, q.pack.issues[0].manifest), bytes);
});
test("P06 P05 confirmed move invalidates real pack/assignment applicability and preserves issued bytes", async () => {
  const q = await issued(),
    a = (await readAppointment(q.p, q.pack.appointment_id)).items[0];
  await moveAppointment(q.p, a.id, {
    ...base(),
    expected_version: a.version,
    expected_work_order_version: a.work_order_version,
    expected_assignment_version: a.assignment_version,
    scope_revision_id: a.scope_revision_id,
    scope_version: a.scope_version,
    policy_version_id: a.policy_version_id,
    scheduling_policy_id: id("a0"),
    scheduling_policy_version: 1,
    start_at: "2026-09-23T03:00:00Z",
    end_at: "2026-09-23T05:00:00Z",
    crew: [9].map((n, i) => ({
      resource_id: id("a4", n),
      resource_version: 1,
      calendar_version: 1,
      crew_role: i ? "Technician" : "Lead",
      travel_before_minutes: 0,
      travel_after_minutes: 0,
      travel_reason: "SYN reviewed zero allowance",
    })),
  });
  const p = (await readPack(q.p, q.pack.id)).items[0];
  assert.equal(p.needs_review, true);
  assert.ok(
    p.events.some((e: { kind: string }) => e.kind === "ReviewRequired"),
  );
  assert.equal(p.readiness.dispatch_hold, true);
  assert.equal(p.issues[0].output_hash, q.pack.issues[0].output_hash);
  assert.equal(p.follow_ups.length, 1);
  assert.equal(p.follow_ups[0].owner_id, id("30"));
  await assert.rejects(
    readPack(await principal("assigned-technician"), p.id),
    code("RecordUnavailable"),
  );
  await revisePack(q.p, p.id, {
    ...base(),
    expected_version: p.version,
    content: content(),
  });
  let next = (await readPack(q.p, p.id)).items[0];
  await checkPack(q.p, p.id, {
    ...base(),
    expected_version: next.version,
    decision: "Checked",
  });
  next = (await readPack(q.p, p.id)).items[0];
  await requestIssue(q.p, p.id, { ...base(), expected_version: next.version });
  next = (await readPack(q.p, p.id)).items[0];
  await processRenderJob(next.jobs[0].id);
  next = (await readPack(q.p, p.id)).items[0];
  assert.notEqual(next.current_issue_id, q.issue_id);
  assert.equal(next.readiness.recipients.length, 1);
  assert.equal(next.readiness.recipients[0].user_id, id("30", 11));
  assert.equal(next.readiness.recipients[0].acknowledged_at, null);
  const replacement = await ack(next, "second-technician");
  await acknowledgePack(
    replacement.p,
    next.current_issue_id!,
    replacement.input,
  );
  assert.equal(
    (
      await rows(
        "SELECT count(*)::int n FROM ppo.pack_acknowledgements WHERE recipient_id=$1",
        [next.readiness.recipients[0].id],
      )
    )[0].n,
    1,
  );
});
test("P06 database dispatch guard replaces the old unconditional hold without allowing a forged clearance", async () => {
  const a = await confirmed();
  await assert.rejects(
    database().query(
      "UPDATE ppo.appointments SET dispatch_hold=false,pack_requirement='Acknowledged',version=version+1 WHERE id=$1",
      [a.id],
    ),
  );
  assert.equal(
    (await readAppointment(await principal(), a.id)).items[0].dispatch_hold,
    true,
  );
});
for (const table of [
  "pack_issues",
  "pack_recipients",
  "pack_distribution_events",
  "audit_events",
  "operation_receipts",
  "outbox_jobs",
])
  test(`P06 late ${table} database failure rolls back issue and recovers original stored bytes`, async () => {
    const q = await queued(),
      job = q.pack.jobs[0];
    await database().query(
      `CREATE FUNCTION ppo.fail_p06_write() RETURNS trigger LANGUAGE plpgsql AS $$BEGIN RAISE EXCEPTION 'SYN injected P06 finalisation rollback'; END$$; CREATE TRIGGER fail_write BEFORE INSERT ON ppo.${table} FOR EACH ROW EXECUTE FUNCTION ppo.fail_p06_write()`,
    );
    const result = await processRenderJob(job.id);
    assert.equal("state" in result && result.state, "Failed");
    const stored = await documentStore().locate({
      ...q.p,
      operation_id: job.id,
    });
    assert.ok(stored);
    assert.equal(
      (await rows("SELECT count(*)::int n FROM ppo.pack_issues"))[0].n,
      0,
    );
    assert.equal(
      (await rows("SELECT count(*)::int n FROM ppo.pack_recipients"))[0].n,
      0,
    );
    assert.equal(
      (
        await rows("SELECT count(*)::int n FROM ppo.pack_distribution_events")
      )[0].n,
      0,
    );
    assert.deepEqual(
      await readOperation(q.p, q.cmd.operation_id),
      q.receipt.receipt,
    );
    assert.equal(
      (await readPack(q.p, q.pack.id)).items[0].current_issue_id,
      null,
    );
    await database().query(
      `DROP TRIGGER fail_write ON ppo.${table}; DROP FUNCTION ppo.fail_p06_write()`,
    );
    assert.ok(
      "issue_id" in
        (await processRenderJob(job.id, {
          render: async () => {
            throw Error("No replacement rendering permitted");
          },
        })),
    );
    assert.deepEqual(
      await documentStore().locate({ ...q.p, operation_id: job.id }),
      stored,
    );
    assert.equal(
      (await rows("SELECT count(*)::int n FROM ppo.pack_recipients"))[0].n,
      2,
    );
    assert.equal(
      (
        await rows(
          "SELECT count(*)::int n FROM ppo.outbox_jobs WHERE kind='PackIssued'",
        )
      )[0].n,
      1,
    );
  });
test("P06 acknowledgement audit failure rolls back response/hold and unchanged retry succeeds", async () => {
  const q = await issued(),
    first = await ack(q.pack, "assigned-technician");
  await database().query(
    "CREATE FUNCTION ppo.fail_p06_ack() RETURNS trigger LANGUAGE plpgsql AS $$BEGIN RAISE EXCEPTION 'SYN acknowledgement rollback'; END$$; CREATE TRIGGER fail_ack BEFORE INSERT ON ppo.audit_events FOR EACH ROW EXECUTE FUNCTION ppo.fail_p06_ack()",
  );
  await assert.rejects(acknowledgePack(first.p, q.issue_id, first.input));
  assert.equal(
    (await rows("SELECT count(*)::int n FROM ppo.pack_acknowledgements"))[0].n,
    0,
  );
  assert.equal(
    (await readAppointment(q.p, q.pack.appointment_id)).items[0].dispatch_hold,
    true,
  );
  await database().query(
    "DROP TRIGGER fail_ack ON ppo.audit_events; DROP FUNCTION ppo.fail_p06_ack()",
  );
  await acknowledgePack(first.p, q.issue_id, first.input);
  await database().query(
    "UPDATE ppo.permission_grants SET valid_to='2026-09-01' WHERE user_id=$1 AND capability='pack.acknowledge'",
    [first.p.actor_id],
  );
  await assert.rejects(
    acknowledgePack(first.p, q.issue_id, first.input),
    code("Forbidden"),
  );
  await assert.rejects(
    readOperation(first.p, first.input.operation_id),
    code("Forbidden"),
  );
});
test("P06 current recipient access is non-waivable and published competency remains immutable", async () => {
  const q = await issued(),
    first = await ack(q.pack, "assigned-technician");
  await acknowledgePack(first.p, q.issue_id, first.input);
  await assert.rejects(
    database().query(
      "UPDATE ppo.skill_evidence SET active=false WHERE resource_id=$1",
      [id("a4", 9)],
    ),
  );
  await database().query(
    "UPDATE ppo.permission_grants SET valid_to='2026-09-01' WHERE user_id=$1 AND capability='pack.read'",
    [id("30", 11)],
  );
  const second = await ack(q.pack, "second-technician");
  await acknowledgePack(second.p, q.issue_id, second.input);
  const state = await dispatchReadiness(database(), q.p, q.pack.appointment_id);
  assert.equal(state.dispatch_hold, true);
  assert.match(state.reasons.join(" "), /access/);
});
test("P06 amendment contact activity failure rolls back withdrawal and exact retry creates one owned task", async () => {
  const q = await issued(),
    cmd = { ...base(), expected_version: q.pack.version };
  for (const table of ["activities", "activity_links", "pack_follow_ups"]) {
    await database().query(
      `CREATE FUNCTION ppo.fail_followup() RETURNS trigger LANGUAGE plpgsql AS $$BEGIN RAISE EXCEPTION 'SYN follow-up rollback'; END$$; CREATE TRIGGER fail_followup BEFORE INSERT ON ppo.${table} FOR EACH ROW EXECUTE FUNCTION ppo.fail_followup()`,
    );
    await assert.rejects(withdrawPack(q.p, q.pack.id, cmd));
    await database().query(
      `DROP TRIGGER fail_followup ON ppo.${table}; DROP FUNCTION ppo.fail_followup()`,
    );
    assert.equal((await readPack(q.p, q.pack.id)).items[0].status, "Issued");
  }
  await withdrawPack(q.p, q.pack.id, cmd);
  await withdrawPack(q.p, q.pack.id, cmd);
  const current = (await readPack(q.p, q.pack.id)).items[0];
  assert.equal(current.follow_ups.length, 1);
  assert.equal(current.follow_ups[0].status, "Open");
  await database().query(
    "UPDATE ppo.permission_grants SET valid_to='2026-09-01' WHERE user_id=$1 AND capability='activity.read'",
    [q.p.actor_id],
  );
  assert.deepEqual((await readPack(q.p, q.pack.id)).items[0].follow_ups, []);
});

test("P06 successor scope Draft atomically invalidates real pack without altering authorised scope or original files", async () => {
  const q = await issued(),
    a = (await readAppointment(q.p, q.pack.appointment_id)).items[0],
    w = (await readWorkOrder(q.p, a.work_order_id)).items[0];
  const original = await rows(
    "SELECT to_jsonb(r) snapshot FROM ppo.scope_revisions r WHERE id=$1",
    [w.authorised_scope_revision_id],
  );
  const bytes = await readBundle(q.p, q.pack.issues[0].manifest);
  await saveWorkScope(
    q.p,
    w.id,
    {
      ...base(),
      expected_version: w.version,
      change_reason:
        "SYN review additional observations; no extra-work authority",
      scope: {
        summary: "SYN proposed successor",
        exclusions: "No shutdown or intervention",
        diagnostic_limit: "External visual inspection only",
        pending_account_plan: "SYN Finance review remains separate",
        authority_evidence: {
          title: "SYN proposed authority",
          content_text: "SYN draft evidence only",
          source_reference: "SYN-PPO-P06-SUCCESSOR",
          source_version: "1",
        },
        coverage: {
          status: "Disputed",
          agreement_reference: null,
          source_version: null,
          effective_from: null,
          effective_to: null,
          assessment: "SYN disputed",
          reason: "SYN review",
          charging_route: "FinanceReview",
        },
        items: [
          {
            task_kind: "Inspection",
            task_description: "SYN external observation",
            expected_outcome: "Record observations",
            completion_requirements: ["Stop before intervention"],
            required_skill_codes: ["SYN-VISUAL"],
            shutdown_condition: null,
            access_condition: null,
            assets: [
              {
                asset_id: id("80"),
                configuration_id: null,
                identification_plan: null,
              },
            ],
          },
        ],
      },
    },
    true,
  );
  const current = (await readWorkOrder(q.p, w.id)).items[0],
    pack = (await readPack(q.p, q.pack.id)).items[0];
  assert.notEqual(
    current.scope_revision_id,
    current.authorised_scope_revision_id,
  );
  assert.equal(
    current.authorised_scope_revision_id,
    w.authorised_scope_revision_id,
  );
  assert.deepEqual(
    await rows(
      "SELECT to_jsonb(r) snapshot FROM ppo.scope_revisions r WHERE id=$1",
      [w.authorised_scope_revision_id],
    ),
    original,
  );
  assert.equal(pack.needs_review, true);
  assert.equal(pack.readiness.dispatch_hold, true);
  assert.equal(pack.follow_ups.length, 1);
  assert.deepEqual(await readBundle(q.p, q.pack.issues[0].manifest), bytes);
});
