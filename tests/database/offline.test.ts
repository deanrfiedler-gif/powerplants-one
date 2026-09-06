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
import { attachmentBytes } from "../../src/field/attachments";
import { withdrawPack, readPack } from "../../src/documents/packs";
import {
  cancelAppointment,
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
  principal,
  rows,
  draft,
  timePayload,
} from "../helpers/field";
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
  const q = await started();
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
  assert.equal(
    (await rows("SELECT count(*)::int n FROM public.ppo_migrations"))[0].n,
    8,
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
  assert.equal((await rows("SELECT count(*)::int n FROM ppo.field_follow_ups WHERE entry_id=$1", [String(op.payload.id)]))[0].n,1);
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
