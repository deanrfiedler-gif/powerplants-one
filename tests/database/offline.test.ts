import assert from "node:assert/strict";
import { test, beforeEach, after } from "node:test";
import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { reset, migrate, seed } from "../../scripts/database";
import { database, closeDatabase } from "../../src/platform/database";
import { localConfig } from "../../src/platform/config";
import { syncBatch } from "../../src/offline/server";
import {
  downloadContext,
  preserveRecovery,
  ownRecovery,
  reviewRecovery,
  dispositionRecovery,
  recoveryBytes,
} from "../../src/offline/recovery";
import { readOperation } from "../../src/shared/receipts";
import { readFieldJob } from "../../src/field/reads";
import { captureEntry } from "../../src/field/entries";
import { attachmentBytes } from "../../src/field/attachments";
import { withdrawPack, revisePack, readPack } from "../../src/documents/packs";
import {
  cancelAppointment,
  moveAppointment,
  readAppointment,
} from "../../src/scheduling/planner";
import { digest } from "../../src/documents/store";
import {
  started,
  acknowledged,
  startInput,
  entry,
  base,
  png,
  photo,
  principal,
  rows,
  draft,
  timePayload,
} from "../helpers/field";
import { id as fixtureId, content } from "../helpers/packs";
import { readBundle } from "../../src/documents/worker";
import { saveWorkScope, readWorkOrder } from "../../src/service/work-orders";
import { operation, rehash } from "../helpers/offline";
if (localConfig().database_name !== "ppo_synthetic_test")
  throw Error("Use disposable synthetic test database.");
process.env.PPO_ALLOW_RESET = "dispose-synthetic";
process.env.PPO_RESET_DATABASE = "ppo_synthetic_test";
beforeEach(reset);
after(closeDatabase);
const code =
  (...values: string[]) =>
  (e: unknown) =>
    values.includes((e as { code: string }).code);
async function fresh(p: Awaited<ReturnType<typeof principal>>, id: string) {
  return (await readFieldJob(p, id)).items[0];
}
test("P08 additive P07 upgrade preserves attendance, receipt, bytes and revoked grants", async () => {
  await database().query(
    await readFile("db/migrations/0001-recover.sql", "utf8"),
  );
  await database().query("DROP TABLE public.ppo_migrations");
  await migrate(7);
  await seed(7);
  const q = await started(),
    image = await photo(q.job, q.p);
  const fileBefore = await rows(
    "SELECT * FROM ppo.field_attachments ORDER BY id",
  );
  const receiptsBefore = await rows(
    "SELECT * FROM ppo.operation_receipts ORDER BY id",
  );
  await database().query(
    "UPDATE ppo.permission_grants SET valid_to='2026-09-01' WHERE user_id=$1 AND capability='field.start.own'",
    [q.p.actor_id],
  );
  const before = await rows("SELECT * FROM ppo.field_attendances");
  await migrate();
  await seed();
  await migrate();
  await seed();
  assert.deepEqual(await rows("SELECT * FROM ppo.field_attendances"), before);
  assert.deepEqual(
    await rows("SELECT * FROM ppo.field_attachments ORDER BY id"),
    fileBefore,
  );
  assert.deepEqual(
    await rows("SELECT * FROM ppo.operation_receipts ORDER BY id"),
    receiptsBefore,
  );
  assert.deepEqual((await attachmentBytes(q.p, image.id)).bytes, image.bytes);
  assert.deepEqual(
    (await rows("SELECT version FROM public.ppo_migrations ORDER BY version")).map(r=>r.version),
    [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 17],
  );
  assert.equal(
    (
      await rows(
        "SELECT count(*)::int n FROM ppo.permission_grants WHERE user_id=$1 AND capability='field.start.own' AND valid_to IS NULL",
        [q.p.actor_id],
      )
    )[0].n,
    0,
  );
});
test("P08 provisional start resolves an immutable causal reference and isolates a failed sibling", async () => {
  const q = await acknowledged(),
    p = await principal("assigned-technician"),
    j = await fresh(p, q.pack.appointment_id),
    start = operation(p, j, "Start", startInput(j));
  const capture = operation(
    p,
    j,
    "Capture",
    {
      ...entry({ ...j, attendance: { id: randomUUID() } }),
      attendance_id: { operation_id: start.operation_id },
    },
    [start.operation_id],
  );
  const malformed = rehash({
    ...capture,
    operation_id: randomUUID(),
    payload: {
      ...capture.payload,
      operation_id: randomUUID(),
      extra: "forbidden",
    },
  });
  const result = await syncBatch(p, {
    operations: [capture, malformed, start],
  });
  assert.equal(result.outcomes[0].state, "ServerSaved", JSON.stringify(result));
  assert.equal(result.outcomes[2].state, "ServerSaved");
  assert.notEqual(result.outcomes[1].state, "ServerSaved");
  assert.equal(
    (await rows("SELECT count(*)::int n FROM ppo.field_entries"))[0].n,
    1,
  );
  assert.deepEqual(
    (await syncBatch(p, { operations: [start, capture] })).outcomes.map(
      (x) => x.receipt,
    ),
    [result.outcomes[2].receipt, result.outcomes[0].receipt],
  );
  const stored = (
    await rows(
      "SELECT envelope FROM ppo.sync_acceptances WHERE operation_id=$1",
      [capture.operation_id],
    )
  )[0].envelope;
  assert.deepEqual(stored.payload.attendance_id, {
    operation_id: start.operation_id,
  });
});
test("P08 100 original captures replay exact receipts once and changed reuse conflicts", async () => {
  const q = await started(),
    ops = Array.from({ length: 100 }, () =>
      operation(q.p, q.job, "Capture", entry(q.job)),
    ),
    receipts = [];
  for (let i = 0; i < 100; i += 20) {
    const result = await syncBatch(q.p, { operations: ops.slice(i, i + 20) });
    assert.ok(
      result.outcomes.every((x) => x.state === "ServerSaved"),
      JSON.stringify(result),
    );
    receipts.push(...result.outcomes.map((x) => x.receipt));
  }
  await closeDatabase(); // application connection-pool restart, with durable facts retained
  for (let i = 0; i < 100; i += 20)
    assert.deepEqual(
      (await syncBatch(q.p, { operations: ops.slice(i, i + 20) })).outcomes.map(
        (x) => x.receipt,
      ),
      receipts.slice(i, i + 20),
    );
  assert.equal(
    (await rows("SELECT count(*)::int n FROM ppo.field_entries"))[0].n,
    100,
  );
  assert.equal(
    (await rows("SELECT count(*)::int n FROM ppo.sync_acceptances"))[0].n,
    100,
  );
  const changed = rehash({
    ...ops[0],
    payload: { ...ops[0].payload, reason: "SYN changed meaning" },
  });
  assert.equal(
    (await syncBatch(q.p, { operations: [changed] })).outcomes[0].code,
    "OperationConflict",
  );
});
test("P08 exact PNG causal chain and interrupted finalisation recover one immutable file and completion draft", async () => {
  const q = await started(),
    bytes = png(),
    id = randomUUID();
  const init = operation(q.p, q.job, "AttachmentInitiate", {
    ...base(),
    id,
    appointment_id: q.job.id,
    attendance_id: q.job.attendance!.id,
    filename: "SYN-offline.png",
    media_type: "image/png",
    byte_count: bytes.length,
    sha256: digest(bytes),
  });
  const upload = operation(
      q.p,
      q.job,
      "AttachmentUpload",
      {
        ...base(),
        expected_version: 1,
        sha256: digest(bytes),
        byte_count: bytes.length,
      },
      [init.operation_id],
      id,
    ),
    finalise = operation(
      q.p,
      q.job,
      "AttachmentFinalise",
      { ...base(), expected_version: 2 },
      [upload.operation_id],
      id,
    ),
    photo = operation(
      q.p,
      q.job,
      "Capture",
      entry(q.job, "Photo", {
        attachment_id: id,
        caption: "SYN exact offline photo",
      }),
      [finalise.operation_id],
    );
  let result = await syncBatch(q.p, {
    operations: [photo, finalise, upload, init],
  });
  assert.equal(result.outcomes[0].code, "DependencyPending");
  assert.equal(result.outcomes[2].code, "MissingOriginalBytes");
  assert.equal(result.outcomes[3].state, "ServerSaved");
  result = await syncBatch(q.p, {
    operations: [photo, finalise, upload, init],
    transfers: { [upload.operation_id]: bytes.toString("base64") },
  });
  assert.ok(
    result.outcomes.every((x) => x.state === "ServerSaved"),
    JSON.stringify(result),
  );
  assert.deepEqual(
    (await syncBatch(q.p, { operations: [finalise] })).outcomes[0].receipt,
    result.outcomes[1].receipt,
  );
  assert.deepEqual((await attachmentBytes(q.p, id)).bytes, bytes);
  const job = await fresh(q.p, q.job.id),
    completion = operation(q.p, job, "CompletionDraft", draft(job), [
      photo.operation_id,
    ]);
  const saved = await syncBatch(q.p, { operations: [completion] });
  assert.equal(saved.outcomes[0].state, "ServerSaved", JSON.stringify(saved));
  assert.equal((await fresh(q.p, job.id)).status, "InProgress");
  assert.equal(
    (await rows("SELECT count(*)::int n FROM ppo.field_attachments"))[0].n,
    1,
  );
});
test("P08 unknown fields, wrong actor/workspace/site/appointment and unsupported payload isolate failures", async () => {
  const q = await started(),
    op = operation(q.p, q.job, "Capture", entry(q.job));
  for (const bad of [
    { ...op, extra: true },
    rehash({ ...op, actor_id: randomUUID() }),
    rehash({ ...op, workspace_id: randomUUID() }),
    rehash({ ...op, appointment_id: randomUUID() }),
    rehash({
      ...op,
      authority: { ...op.authority, scope_revision_id: randomUUID() },
    }),
    rehash({ ...op, schema_version: 2 }),
  ])
    assert.notEqual(
      (await syncBatch(q.p, { operations: [bad] })).outcomes[0].state,
      "ServerSaved",
    );
  assert.equal(
    (await rows("SELECT count(*)::int n FROM ppo.field_entries"))[0].n,
    0,
  );
  await assert.rejects(
    syncBatch(q.p, { operations: Array(21).fill(op) }),
    code("BatchLimit"),
  );
});
test("P08 missing and cyclic dependencies preserve siblings without accepting children", async () => {
  const q = await started(),
    a = operation(q.p, q.job, "Capture", entry(q.job)),
    b = operation(q.p, q.job, "Capture", entry(q.job), [a.operation_id]),
    cycle = rehash({ ...a, depends_on: [b.operation_id] }),
    sibling = operation(q.p, q.job, "Capture", entry(q.job));
  const result = await syncBatch(q.p, { operations: [cycle, b, sibling] });
  assert.equal(result.outcomes[0].code, "DependencyPending");
  assert.equal(result.outcomes[1].code, "DependencyPending");
  assert.equal(result.outcomes[2].state, "ServerSaved");
});
test("P08 normal acceptance and restricted recovery are exclusive under competing original-operation locks", async () => {
  const q = await started(),
    context = await downloadContext(q.p, q.job.id, {}),
    op = operation(q.p, q.job, "Capture", entry(q.job)),
    before = (await rows("SELECT count(*)::int n FROM ppo.activities"))[0].n,
    input = {
      grant_id: context.recovery.id,
      token: context.recovery.token,
      operation: op,
    };
  const saved = await preserveRecovery(q.p, input);
  assert.deepEqual(await preserveRecovery(q.p, input), saved);
  const refused = (await syncBatch(q.p, { operations: [op] })).outcomes[0];
  assert.equal(refused.code, "RecoveryDispositionRequired");
  assert.equal(refused.state, "ReviewRequired");
  assert.equal(refused.receipt, undefined);
  await assert.rejects(
    captureEntry(q.p, op.payload),
    code("RecoveryDispositionRequired"),
  );
  const changed = rehash({
    ...op,
    payload: { ...op.payload, reason: "SYN changed quarantined meaning" },
  });
  assert.equal(
    (await syncBatch(q.p, { operations: [changed] })).outcomes[0].code,
    "OperationConflict",
  );
  assert.equal(
    (await rows("SELECT count(*)::int n FROM ppo.field_entries"))[0].n,
    0,
  );

  const competing = operation(q.p, q.job, "Capture", entry(q.job));
  const [normal, recovery] = await Promise.allSettled([
    syncBatch(q.p, { operations: [competing] }),
    preserveRecovery(q.p, { ...input, operation: competing }),
  ]);
  if (normal.status !== "fulfilled") throw normal.reason;
  const outcome = normal.value.outcomes[0];
  if (outcome.state === "ServerSaved") {
    assert.equal(recovery.status, "rejected");
    if (recovery.status === "rejected")
      assert.ok(code("AlreadyAccepted")(recovery.reason));
    assert.deepEqual(
      (await syncBatch(q.p, { operations: [competing] })).outcomes[0].receipt,
      outcome.receipt,
    );
  } else {
    assert.equal(outcome.code, "RecoveryDispositionRequired");
    assert.equal(recovery.status, "fulfilled");
  }
  const facts = (
    await rows(
      "SELECT (SELECT count(*) FROM ppo.sync_acceptances WHERE operation_id=$1)::int accepted,(SELECT count(*) FROM ppo.offline_recovery_cases WHERE operation_id=$1)::int recovered",
      [competing.operation_id],
    )
  )[0];
  assert.equal(facts.accepted + facts.recovered, 1);
  assert.equal(
    (await rows("SELECT count(*)::int n FROM ppo.activities"))[0].n,
    before + 2,
  );
});
test("P08 revoked permission blocks accepted normal receipt recovery and preserves local-only identity", async () => {
  const q = await started(),
    op = operation(q.p, q.job, "Capture", entry(q.job));
  assert.equal(
    (await syncBatch(q.p, { operations: [op] })).outcomes[0].state,
    "ServerSaved",
  );
  await database().query(
    "UPDATE ppo.permission_grants SET valid_to='2026-09-01' WHERE user_id=$1 AND capability='field.capture.own'",
    [q.p.actor_id],
  );
  assert.equal(
    (await syncBatch(q.p, { operations: [op] })).outcomes[0].code,
    "Forbidden",
  );
  await assert.rejects(readOperation(q.p, op.operation_id), code("Forbidden"));
});
test("P08 revoked ordinary access requires the exact prior recovery capability and an owned immutable disposition", async () => {
  const q = await started(),
    context = await downloadContext(q.p, q.job.id, {}),
    op = operation(q.p, q.job, "Capture", entry(q.job));
  await database().query(
    "UPDATE ppo.permission_grants SET valid_to='2026-09-01' WHERE user_id=$1 AND capability LIKE 'field.%'",
    [q.p.actor_id],
  );
  assert.equal(
    (await syncBatch(q.p, { operations: [op] })).outcomes[0].code,
    "Forbidden",
  );
  await assert.rejects(
    preserveRecovery(q.p, {
      grant_id: context.recovery.id,
      token: "0".repeat(64),
      operation: op,
    }),
    code("RecordUnavailable"),
  );
  const input = {
      grant_id: context.recovery.id,
      token: context.recovery.token,
      operation: op,
    },
    saved = await preserveRecovery(q.p, input);
  assert.deepEqual(await preserveRecovery(q.p, input), saved);
  assert.equal(saved.normal_acceptance, false);
  assert.equal(
    (await rows("SELECT count(*)::int n FROM ppo.field_entries"))[0].n,
    0,
  );
  const minimal = await ownRecovery(q.p, String(saved.case_id));
  assert.equal("envelope" in minimal, false);
  assert.equal("actor_id" in minimal, false);
  const owner = await principal("coordinator");
  await assert.rejects(
    reviewRecovery(q.p, String(saved.case_id)),
    code("Forbidden"),
  );
  await assert.rejects(
    ownRecovery(await principal("second-technician"), String(saved.case_id)),
    code("RecordUnavailable"),
  );
  const review = await reviewRecovery(owner, String(saved.case_id));
  assert.equal(review.owner_id, owner.actor_id);
  const decision = {
    ...base(),
    disposition: "ClarificationRequired",
    note: "SYN contact original technician; no normal approval.",
  };
  const receipt = await dispositionRecovery(
    owner,
    String(saved.case_id),
    decision,
  );
  assert.deepEqual(
    await dispositionRecovery(owner, String(saved.case_id), decision),
    { ...receipt, replayed: true },
  );
  assert.equal(
    (await ownRecovery(q.p, String(saved.case_id))).disposition,
    "ClarificationRequired",
  );
  await assert.rejects(
    database().query("DELETE FROM ppo.offline_recovery_cases WHERE id=$1", [
      saved.case_id,
    ]),
  );
});
test("P08 recovery retains exact private PNG and denies inactive identity or other owner byte access", async () => {
  const q = await started(),
    context = await downloadContext(q.p, q.job.id, {}),
    bytes = png(),
    op = operation(
      q.p,
      q.job,
      "AttachmentUpload",
      {
        ...base(),
        expected_version: 1,
        sha256: digest(bytes),
        byte_count: bytes.length,
      },
      [],
      randomUUID(),
    );
  const input = {
    grant_id: context.recovery.id,
    token: context.recovery.token,
    operation: op,
    content_base64: bytes.toString("base64"),
  };
  await assert.rejects(
    preserveRecovery(q.p, {
      ...input,
      content_base64: png(32, 32).toString("base64"),
    }),
    code("AttachmentHashMismatch"),
  );
  const saved = await preserveRecovery(q.p, input);
  assert.deepEqual(
    await recoveryBytes(await principal("coordinator"), String(saved.case_id)),
    bytes,
  );
  await assert.rejects(
    recoveryBytes(q.p, String(saved.case_id)),
    code("Forbidden"),
  );
  await database().query("UPDATE ppo.users SET active=false WHERE id=$1", [
    q.p.actor_id,
  ]);
  await assert.rejects(
    ownRecovery(q.p, String(saved.case_id)),
    code("AuthenticationRequired"),
  );
});
test("P08 cancelled-before-start intent never creates attendance; stale factual evidence has restricted recovery", async () => {
  const q = await acknowledged(),
    p = await principal("assigned-technician"),
    j = await fresh(p, q.pack.appointment_id),
    context = await downloadContext(p, j.id, {}),
    start = operation(p, j, "Start", startInput(j)),
    capture = operation(
      p,
      j,
      "Capture",
      {
        ...entry({ ...j, attendance: { id: randomUUID() } }),
        attendance_id: { operation_id: start.operation_id },
      },
      [start.operation_id],
    );
  const a = (await readAppointment(q.p, j.id)).items[0];
  await cancelAppointment(q.p, j.id, {
    ...base(),
    expected_version: a.version,
    expected_work_order_version: a.work_order_version,
    expected_assignment_version: a.assignment_version,
  });
  assert.notEqual(
    (await syncBatch(p, { operations: [start, capture] })).outcomes[0].state,
    "ServerSaved",
  );
  assert.equal(
    (await rows("SELECT count(*)::int n FROM ppo.field_attendances"))[0].n,
    0,
  );
  assert.equal(
    (
      await preserveRecovery(p, {
        grant_id: context.recovery.id,
        token: context.recovery.token,
        operation: capture,
      })
    ).normal_acceptance,
    false,
  );
});
test("P08 withdrawn pack preserves started factual capture as review-required authority, without reopening work", async () => {
  const q = await started(),
    op = operation(q.p, q.job, "Capture", entry(q.job)),
    co = await principal("coordinator"),
    pack = (await readPack(co, q.pack.id)).items[0];
  await withdrawPack(co, pack.id, {
    ...base(),
    expected_version: pack.version,
  });
  assert.equal(
    (await syncBatch(q.p, { operations: [op] })).outcomes[0].state,
    "ReviewRequired",
  );
  assert.equal(
    (await fresh(q.p, q.job.id)).entries[0].authority_state,
    "ReviewRequired",
  );
  assert.equal(
    (
      await rows(
        "SELECT count(*)::int n FROM ppo.field_follow_ups WHERE entry_id=$1",
        [String(op.payload.id)],
      )
    )[0].n,
    1,
  );
});
test("P08 actor-wide time overlap and immutable successor evidence remain enforced through sync", async () => {
  const q = await started(),
    a = operation(q.p, q.job, "Capture", entry(q.job, "Time", timePayload())),
    b = operation(
      q.p,
      q.job,
      "Capture",
      entry(q.job, "Time", a.payload.payload),
    );
  const result = await syncBatch(q.p, { operations: [a, b] });
  assert.equal(result.outcomes[0].state, "ServerSaved");
  assert.equal(result.outcomes[1].code, "TimeOverlap");
  const corrected = operation(
    q.p,
    q.job,
    "Correct",
    {
      ...a.payload,
      ...base(),
      id: randomUUID(),
      expected_version: 1,
      reason: "SYN retain original and revise note",
      payload: {
        ...(a.payload.payload as object),
        note: "SYN corrected original",
      },
    },
    [],
    String(a.payload.id),
  );
  corrected.supersedes_operation_id = a.operation_id;
  const fixed = rehash(corrected);
  assert.equal(
    (await syncBatch(q.p, { operations: [fixed] })).outcomes[0].state,
    "ServerSaved",
  );
  assert.equal(
    (await rows("SELECT count(*)::int n FROM ppo.field_entries"))[0].n,
    2,
  );
});
for (const table of [
  "audit_events",
  "operation_receipts",
  "outbox_jobs",
  "sync_acceptances",
]) {
  test(`P08 late ${table} failure rolls back capture and all accepted facts`, async () => {
    const q = await started(),
      op = operation(q.p, q.job, "Capture", entry(q.job));
    await database().query(
      `CREATE FUNCTION ppo.fail_p08() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'synthetic late failure'; END $$; CREATE TRIGGER p08_fail BEFORE INSERT ON ppo.${table} FOR EACH ROW EXECUTE FUNCTION ppo.fail_p08()`,
    );
    try {
      assert.equal(
        (await syncBatch(q.p, { operations: [op] })).outcomes[0].state,
        "Failed",
      );
      assert.equal(
        (await rows("SELECT count(*)::int n FROM ppo.field_entries"))[0].n,
        0,
      );
      assert.equal(
        (await rows("SELECT count(*)::int n FROM ppo.sync_acceptances"))[0].n,
        0,
      );
    } finally {
      await database().query(
        `DROP TRIGGER p08_fail ON ppo.${table}; DROP FUNCTION ppo.fail_p08()`,
      );
    }
    assert.equal(
      (await syncBatch(q.p, { operations: [op] })).outcomes[0].state,
      "ServerSaved",
    );
  });
}

for (const change of ["reassign", "amend", "scope"] as const)
  test(`P08 queued ${change} refuses stale start and preserves exact original evidence in owned recovery`, async () => {
    const q = await acknowledged(),
      p = await principal("assigned-technician"),
      co = await principal(),
      j = await fresh(p, q.pack.appointment_id),
      grant = await downloadContext(p, j.id, {}),
      start = operation(p, j, "Start", startInput(j)),
      capture = operation(
        p,
        j,
        "Capture",
        {
          ...entry({ ...j, attendance: { id: randomUUID() } }),
          attendance_id: { operation_id: start.operation_id },
        },
        [start.operation_id],
      );
    const original = JSON.stringify([start, capture]),
      issuedBytes = (await readBundle(co, q.pack.issues[0].manifest)).pdf;
    if (change === "reassign") {
      const a = (await readAppointment(co, j.id)).items[0];
      await moveAppointment(co, j.id, {
        ...base(),
        expected_version: a.version,
        expected_work_order_version: a.work_order_version,
        expected_assignment_version: a.assignment_version,
        scope_revision_id: a.scope_revision_id,
        scope_version: a.scope_version,
        policy_version_id: a.policy_version_id,
        scheduling_policy_id: fixtureId("a0"),
        scheduling_policy_version: 1,
        start_at: new Date(
          new Date(a.start_at).getTime() + 3600000,
        ).toISOString(),
        end_at: new Date(new Date(a.end_at).getTime() + 3600000).toISOString(),
        crew: [5, 2].map((n, i) => ({
          resource_id: fixtureId("a4", n),
          resource_version: 1,
          calendar_version: 1,
          crew_role: i ? "Technician" : "Lead",
          travel_before_minutes: 0,
          travel_after_minutes: 0,
          travel_reason: "SYN explicit zero for controlled reassignment",
        })),
      });
    } else if (change === "amend") {
      const pack = (await readPack(co, q.pack.id)).items[0];
      await revisePack(co, pack.id, {
        ...base(),
        expected_version: pack.version,
        content: content(),
      });
    } else {
      const a = (await readAppointment(co, j.id)).items[0],
        w = (await readWorkOrder(co, a.work_order_id)).items[0];
      await saveWorkScope(
        co,
        w.id,
        {
          ...base(),
          expected_version: w.version,
          change_reason: "SYN queued old scope requires review",
          scope: {
            summary: "SYN successor draft only",
            exclusions: "No intervention",
            diagnostic_limit: "External observation only",
            pending_account_plan: "SYN Finance review separate",
            authority_evidence: {
              title: "SYN draft authority",
              content_text: "SYN proposal only",
              source_reference: "SYN-PPO-P08",
              source_version: "1",
            },
            coverage: {
              status: "Disputed",
              agreement_reference: null,
              source_version: null,
              effective_from: null,
              effective_to: null,
              assessment: "SYN review",
              reason: "SYN review",
              charging_route: "FinanceReview",
            },
            items: [
              {
                task_kind: "Inspection",
                task_description: "SYN proposed observation",
                expected_outcome: "Record observations",
                completion_requirements: ["SYN stop before intervention"],
                required_skill_codes: ["SYN-VISUAL"],
                shutdown_condition: null,
                access_condition: null,
                assets: [
                  {
                    asset_id: fixtureId("80"),
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
    }
    const outcomes = (await syncBatch(p, { operations: [capture, start] }))
      .outcomes;
    assert.notEqual(outcomes[1].state, "ServerSaved");
    assert.equal(outcomes[0].code, "DependencyPending");
    assert.equal(
      (await rows("SELECT count(*)::int n FROM ppo.field_attendances"))[0].n,
      0,
    );
    assert.equal(JSON.stringify([start, capture]), original);
    await assert.rejects(
      preserveRecovery(p, {
        grant_id: grant.recovery.id,
        token: "0".repeat(64),
        operation: capture,
      }),
      code("RecordUnavailable"),
    );
    const saved = await preserveRecovery(p, {
      grant_id: grant.recovery.id,
      token: grant.recovery.token,
      operation: capture,
    });
    assert.equal(saved.normal_acceptance, false);
    assert.deepEqual(
      (await readBundle(co, q.pack.issues[0].manifest)).pdf,
      issuedBytes,
    );
    assert.equal(
      (
        await rows(
          "SELECT envelope FROM ppo.offline_recovery_cases WHERE id=$1",
          [saved.case_id],
        )
      )[0].envelope.authority.issue_hash,
      capture.authority.issue_hash,
    );
  });

test("P08 restricted PNG storage-success/database-failure keeps original hash and recovers one case and Activity", async () => {
  const q = await started(),
    grant = await downloadContext(q.p, q.job.id, {}),
    bytes = png(),
    op = operation(
      q.p,
      q.job,
      "AttachmentUpload",
      {
        ...base(),
        expected_version: 1,
        sha256: digest(bytes),
        byte_count: bytes.length,
      },
      [],
      randomUUID(),
    ),
    input = {
      grant_id: grant.recovery.id,
      token: grant.recovery.token,
      operation: op,
      content_base64: bytes.toString("base64"),
    };
  const before = (await rows("SELECT count(*)::int n FROM ppo.activities"))[0]
    .n;
  await database().query(
    "CREATE FUNCTION ppo.fail_recovery() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'SYN late recovery failure'; END $$; CREATE TRIGGER fail_recovery BEFORE INSERT ON ppo.offline_recovery_cases FOR EACH ROW EXECUTE FUNCTION ppo.fail_recovery()",
  );
  try {
    await assert.rejects(preserveRecovery(q.p, input));
    assert.equal(
      (await rows("SELECT count(*)::int n FROM ppo.offline_recovery_cases"))[0]
        .n,
      0,
    );
    assert.equal(
      (await rows("SELECT count(*)::int n FROM ppo.activities"))[0].n,
      before,
    );
  } finally {
    await database().query(
      "DROP TRIGGER fail_recovery ON ppo.offline_recovery_cases; DROP FUNCTION ppo.fail_recovery()",
    );
  }
  const saved = await preserveRecovery(q.p, input);
  assert.deepEqual(await preserveRecovery(q.p, input), saved);
  assert.deepEqual(
    await recoveryBytes(await principal(), String(saved.case_id)),
    bytes,
  );
  assert.equal(
    (await rows("SELECT count(*)::int n FROM ppo.activities"))[0].n,
    before + 1,
  );
  assert.equal(
    (
      await rows(
        "SELECT count(*)::int n FROM ppo.operation_receipts WHERE operation_id=$1",
        [op.operation_id],
      )
    )[0].n,
    0,
  );
});

test("P08 expired prior recovery capability cannot preserve or disclose original evidence", async () => {
  const q = await started(),
    grant = await downloadContext(q.p, q.job.id, {}),
    expired = randomUUID(),
    op = operation(q.p, q.job, "Capture", entry(q.job));
  await database().query(
    "INSERT INTO ppo.offline_recovery_grants(id,workspace_id,actor_id,company_id,site_id,appointment_id,owner_id,token_hash,authority,issued_at,expires_at) SELECT $1,workspace_id,actor_id,company_id,site_id,appointment_id,owner_id,$2,authority,clock_timestamp()-interval '8 days',clock_timestamp()-interval '1 day' FROM ppo.offline_recovery_grants WHERE id=$3",
    [expired, digest(Buffer.from("1".repeat(64))), grant.recovery.id],
  );
  await assert.rejects(
    preserveRecovery(q.p, {
      grant_id: expired,
      token: "1".repeat(64),
      operation: op,
    }),
    code("RecordUnavailable"),
  );
  assert.equal(
    (await rows("SELECT count(*)::int n FROM ppo.offline_recovery_cases"))[0].n,
    0,
  );
  assert.equal(
    (await rows("SELECT count(*)::int n FROM ppo.field_entries"))[0].n,
    0,
  );
});
