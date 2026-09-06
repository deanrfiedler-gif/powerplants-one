import { execFileSync } from "node:child_process";
import { twoTaskStarted } from "../helpers/field-two-tasks";
import assert from "node:assert/strict";
import { test, beforeEach, after } from "node:test";
import { randomUUID } from "node:crypto";
import { readFile, unlink, writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { homedir } from "node:os";
import { reset, migrate, seed } from "../../scripts/database";
import { database, closeDatabase } from "../../src/platform/database";
import { localConfig } from "../../src/platform/config";
import { readOperation } from "../../src/shared/receipts";
import {
  readPack,
  acknowledgePack,
  withdrawPack,
  insert,
} from "../../src/documents/packs";
import { issued, queued, id as fixtureId } from "../helpers/packs";
import { processRenderJob, readBundle } from "../../src/documents/worker";
import {
  cancelAppointment,
  readAppointment,
  moveAppointment,
} from "../../src/scheduling/planner";
import { saveWorkScope, readWorkOrder } from "../../src/service/work-orders";
import { readFieldJob } from "../../src/field/reads";
import { startAttendance } from "../../src/field/start";
import { captureEntry } from "../../src/field/entries";
import {
  initiateAttachment,
  uploadAttachment,
  finaliseAttachment,
  attachmentMetadata,
  attachmentBytes,
} from "../../src/field/attachments";
import { saveCompletionDraft } from "../../src/field/completion";
import { digest } from "../../src/documents/store";
import {
  started,
  acknowledged,
  startInput,
  entry,
  timePayload,
  materialPayload,
  photo,
  png,
  draft,
  principal,
  base,
  rows,
} from "../helpers/field";
if (localConfig().database_name !== "ppo_synthetic_test")
  throw Error("Use the disposable test database.");
process.env.PPO_ALLOW_RESET = "dispose-synthetic";
process.env.PPO_RESET_DATABASE = "ppo_synthetic_test";
beforeEach(reset);
after(closeDatabase);
const code =
  (...codes: string[]) =>
  (e: unknown) =>
    codes.includes((e as { code: string }).code);
async function fresh(p: Awaited<ReturnType<typeof principal>>, id: string) {
  return (await readFieldJob(p, id)).items[0];
}
test("P07 upgrade from P06 and repeat seed retain exact original issue, source, receipts and revoked grants", async () => {
  await database().query(
    await readFile("db/migrations/0001-recover.sql", "utf8"),
  );
  await database().query("DROP TABLE public.ppo_migrations");
  await migrate(6);
  await seed(6);
  const q = await issued();
  await database().query(
    "UPDATE ppo.permission_grants SET valid_to='2026-09-01' WHERE user_id=$1 AND capability='pack.acknowledge'",
    [fixtureId("30", 10)],
  );
  const before = await rows(
    "SELECT (SELECT jsonb_agg(to_jsonb(i) ORDER BY id) FROM ppo.pack_issues i) issues,(SELECT jsonb_agg(to_jsonb(r) ORDER BY id) FROM ppo.operation_receipts r) receipts,(SELECT jsonb_agg(to_jsonb(a) ORDER BY id) FROM ppo.appointments a) appointments",
  );
  await migrate();
  await seed();
  await seed();
  assert.deepEqual(
    await rows(
      "SELECT (SELECT jsonb_agg(to_jsonb(i) ORDER BY id) FROM ppo.pack_issues i) issues,(SELECT jsonb_agg(to_jsonb(r) ORDER BY id) FROM ppo.operation_receipts r) receipts,(SELECT jsonb_agg(to_jsonb(a) ORDER BY id) FROM ppo.appointments a) appointments",
    ),
    before,
  );
  assert.equal(
    (await rows("SELECT count(*)::int n FROM public.ppo_migrations"))[0].n,
    9,
  );
  assert.equal(
    (
      await rows(
        "SELECT count(*)::int n FROM ppo.permission_grants WHERE user_id=$1 AND capability='field.start.own'",
        [fixtureId("30", 10)],
      )
    )[0].n,
    0,
  );
  assert.ok(
    (await readBundle(q.p, q.pack.issues[0].manifest)).pdf.length > 1000,
  );
});
test("PT-06 complete procedure: queued renderer is not Issued, first crew response refuses actual start, second permits one real start", async () => {
  const q = await queued();
  assert.equal(q.pack.issues.length, 0);
  assert.equal(q.receipt.receipt.state, "Queued");
  await processRenderJob(q.pack.jobs[0].id);
  const p = await principal("assigned-technician"),
    m = await principal("second-technician");
  let pack = (await readPack(q.p, q.pack.id)).items[0];
  for (const actor of [p, m]) {
    const r = pack.readiness.recipients.find(
      (x: { user_id: string }) => x.user_id === actor.actor_id,
    )!;
    await acknowledgePack(actor, pack.current_issue_id!, {
      ...base(),
      assignment_id: r.assignment_id,
      assignment_version: r.assignment_version,
      presented_hash: pack.issues[0].output_hash,
      captured_at: new Date().toISOString(),
    });
    if (actor === p) {
      const job = await fresh(p, pack.appointment_id);
      await assert.rejects(
        startAttendance(p, job.id, startInput(job)),
        code("StartBlocked"),
      );
      assert.equal(
        (await rows("SELECT count(*)::int n FROM ppo.field_attendances"))[0].n,
        0,
      );
    }
  }
  const job = await fresh(p, pack.appointment_id);
  assert.equal(job.readiness.component_ready, true);
  const accepted = await startAttendance(p, job.id, startInput(job));
  assert.equal((await fresh(p, job.id)).status, "InProgress");
  assert.equal(
    (await rows("SELECT count(*)::int n FROM ppo.pack_issues"))[0].n,
    1,
  );
  assert.equal(
    (await rows("SELECT count(*)::int n FROM ppo.field_attendances"))[0].n,
    1,
  );
  pack = (await readPack(q.p, q.pack.id)).items[0];
  assert.equal(pack.needs_review, false);
  const issue = pack.issues[0],
    bundle = await readBundle(q.p, issue.manifest);
  const directory = "verification-evidence/PT-06";
  await mkdir(directory, { recursive: true });
  await writeFile(`${directory}/${issue.manifest.filename}`, bundle.pdf);
  await writeFile(`${directory}/original.html`, bundle.html);
  await writeFile(
    `${directory}/execution.json`,
    JSON.stringify(
      {
        procedure: "PT-06",
        status: "Passed",
        scope: "Complete synthetic coded procedure; not independent review or owner acceptance",
        provenance: {
          run_id: process.env.GITHUB_RUN_ID,
          run_attempt: process.env.GITHUB_RUN_ATTEMPT,
          source_branch: process.env.GITHUB_HEAD_REF,
          executed_checkout: execFileSync("git", ["rev-parse", "HEAD"], {
            encoding: "utf8",
          }).trim(),
          executed_tree: execFileSync("git", ["rev-parse", "HEAD^{tree}"], {
            encoding: "utf8",
          }).trim(),
        },
        preconditions: {
          confirmed_two_person_appointment: true,
          checked_nine_section_pack: true,
          exact_technical_sources: true,
        },
        outcomes: {
          queued_not_issued: true,
          first_person_start: "StartBlocked",
          first_person_attendance_count: 0,
          complete_crew_readiness: true,
          final_appointment_status: "InProgress",
          final_issue_count: 1,
          final_attendance_count: 1,
        },
        issue,
        revision: pack.revisions[0],
        recipients: pack.readiness.recipients,
        acknowledgements: await rows(
          "SELECT k.* FROM ppo.pack_acknowledgements k JOIN ppo.pack_recipients r ON r.id=k.recipient_id WHERE r.issue_id=$1 ORDER BY k.actor_id",
          [issue.id],
        ),
        attendance: (
          await rows("SELECT * FROM ppo.field_attendances WHERE appointment_id=$1", [job.id])
        )[0],
        start_receipt: accepted.receipt,
      },
      null,
      2,
    ),
  );
});
test("P07 concurrent identical starts replay once; changed operation conflicts; another crew member records only their own start", async () => {
  const q = await acknowledged(),
    p = await principal("assigned-technician"),
    m = await principal("second-technician"),
    job = await fresh(p, q.pack.appointment_id),
    cmd = startInput(job);
  const results = await Promise.all([
    startAttendance(p, job.id, cmd),
    startAttendance(p, job.id, cmd),
  ]);
  assert.deepEqual(results[0].receipt, results[1].receipt);
  assert.equal(results.filter((x) => x.replayed).length, 1);
  await assert.rejects(
    startAttendance(p, job.id, { ...cmd, reason: "changed reuse" }),
    code("OperationConflict"),
  );
  const mj = await fresh(m, job.id);
  assert.equal(mj.attendance, null);
  await startAttendance(m, job.id, startInput(mj));
  assert.equal(
    (await rows("SELECT count(*)::int n FROM ppo.field_attendances"))[0].n,
    2,
  );
  assert.equal(
    (await rows("SELECT count(*)::int n FROM ppo.field_entries"))[0].n,
    0,
  );
  assert.deepEqual(
    await readOperation(p, cmd.operation_id),
    results[0].receipt,
  );
});
test("P07 distinct simultaneous personal starts admit one and reject the stale competitor", async () => {
  const q = await acknowledged(),
    p = await principal("assigned-technician"),
    j = await fresh(p, q.pack.appointment_id);
  const x = await Promise.allSettled([
    startAttendance(p, j.id, startInput(j)),
    startAttendance(p, j.id, startInput(j)),
  ]);
  assert.equal(x.filter((v) => v.status === "fulfilled").length, 1);
  assert.equal(
    (await rows("SELECT count(*)::int n FROM ppo.field_attendances"))[0].n,
    1,
  );
});
test("P07 actual start races ordinary cancellation without losing either original evidence or the started-work boundary", async () => {
  const q = await acknowledged(),
    p = await principal("assigned-technician"),
    co = await principal(),
    j = await fresh(p, q.pack.appointment_id),
    a = (await readAppointment(co, j.id)).items[0];
  const cancel = {
    ...base(),
    expected_version: a.version,
    expected_work_order_version: a.work_order_version,
    expected_assignment_version: a.assignment_version,
  };
  const x = await Promise.allSettled([
    startAttendance(p, j.id, startInput(j)),
    cancelAppointment(co, j.id, cancel),
  ]);
  assert.equal(x.filter((v) => v.status === "fulfilled").length, 1);
  const saved = (await readAppointment(co, j.id)).items[0];
  assert.ok(["InProgress", "Cancelled"].includes(saved.status));
  if (saved.status === "InProgress")
    await assert.rejects(
      cancelAppointment(co, j.id, {
        ...base(),
        expected_version: saved.version,
        expected_work_order_version: saved.work_order_version,
        expected_assignment_version: saved.assignment_version,
      }),
      code("ActualWorkRecorded"),
    );
  assert.equal(
    (await rows("SELECT count(*)::int n FROM ppo.pack_issues"))[0].n,
    1,
  );
});
for (const change of ["move", "reassign", "scope", "withdraw"] as const)
  test(`P07 start racing ${change} preserves original source and returns a controlled outcome`, async () => {
    const q = await acknowledged(),
      p = await principal("assigned-technician"),
      co = await principal(),
      j = await fresh(p, q.pack.appointment_id),
      a = (await readAppointment(co, j.id)).items[0];
    let competing: () => Promise<unknown>;
    if (change === "withdraw")
      competing = () =>
        withdrawPack(co, q.pack.id, {
          ...base(),
          expected_version: q.pack.version,
        });
    else if (change === "scope") {
      const w = (await readWorkOrder(co, a.work_order_id)).items[0];
      competing = () =>
        saveWorkScope(
          co,
          w.id,
          {
            ...base(),
            expected_version: w.version,
            change_reason: "SYN additional scope requires review",
            scope: {
              summary: "SYN successor draft only",
              exclusions: "No intervention",
              diagnostic_limit: "External observation only",
              pending_account_plan: "SYN Finance review separate",
              authority_evidence: {
                title: "SYN draft authority",
                content_text: "SYN proposal only",
                source_reference: "SYN-PPO-P07",
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
    } else
      competing = () =>
        moveAppointment(co, j.id, {
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
          end_at: new Date(
            new Date(a.end_at).getTime() + 3600000,
          ).toISOString(),
          crew: (change === "reassign" ? [9, 5] : [9, 2]).map((n, i) => ({
            resource_id: fixtureId("a4", n),
            resource_version: 1,
            calendar_version: 1,
            crew_role: i ? "Technician" : "Lead",
            travel_before_minutes: 0,
            travel_after_minutes: 0,
            travel_reason: "SYN explicit zero",
          })),
        });
    const outcomes = await Promise.allSettled([
      startAttendance(p, j.id, startInput(j)),
      competing(),
    ]);
    assert.ok(outcomes.some((x) => x.status === "fulfilled"));
    for (const x of outcomes)
      if (x.status === "rejected")
        assert.ok(
          [
            "StartBlocked",
            "VersionConflict",
            "RecordUnavailable",
            "ActualWorkRecorded",
            "PackNotReady",
            "ScopeReviewRequired",
          ].includes(x.reason.code),
          String(x.reason),
        );
    const attendance = await rows("SELECT * FROM ppo.field_attendances");
    if (attendance.length) {
      assert.equal(attendance[0].issue_id, q.issue_id);
      assert.equal(attendance[0].scope_revision_id, j.scope_revision_id);
    }
    assert.ok(
      (await readBundle(co, q.pack.issues[0].manifest)).pdf.length > 1000,
    );
    if (["move", "reassign"].includes(change))
      assert.equal(outcomes.filter((x) => x.status === "fulfilled").length, 1);
  });
test("P07 future-effective crew can be booked and acknowledge but cannot confer current actual-start authority", async () => {
  // Publish a new fictional resource bundle; do not mutate an issued source or disable guards.
  const original = (await rows("SELECT * FROM ppo.resources WHERE id=$1", [fixtureId("a4", 9)]))[0],
    futureId = randomUUID(),
    futureFrom = new Date("2026-09-22T00:00:00Z");
  assert.ok(futureFrom.getTime() > Date.now());
  await insert(database(), "resources", {
    ...original,
    id: futureId,
    name: "SYN Morgan future-effective resource",
    status: "Draft",
    effective_from: futureFrom,
    evidence: "SYN P07 future resource eligibility; valid for the booking, not current attendance",
  });
  for (const site of await rows("SELECT * FROM ppo.resource_sites WHERE resource_id=$1", [original.id]))
    await insert(database(), "resource_sites", { ...site, resource_id: futureId });
  const evidenceIds = new Map<string, string>();
  for (const evidence of await rows("SELECT * FROM ppo.resource_evidence WHERE resource_id=$1", [original.id])) {
    const evidenceId = randomUUID();
    evidenceIds.set(evidence.id, evidenceId);
    await insert(database(), "resource_evidence", { ...evidence, id: evidenceId, resource_id: futureId });
  }
  for (const skill of await rows("SELECT * FROM ppo.skill_evidence WHERE resource_id=$1", [original.id]))
    await insert(database(), "skill_evidence", {
      ...skill,
      id: randomUUID(),
      resource_id: futureId,
      evidence_ref: evidenceIds.get(skill.evidence_ref),
    });
  await database().query("UPDATE ppo.resources SET status='Published' WHERE id=$1", [futureId]);
  const q = await acknowledged([futureId, fixtureId("a4", 2)]),
    p = await principal("assigned-technician"),
    job = await fresh(p, q.pack.appointment_id);
  assert.equal(job.readiness.component_ready, true);
  await assert.rejects(startAttendance(p, job.id, startInput(job)), code("StartBlocked"));
  assert.equal((await rows("SELECT count(*)::int n FROM ppo.field_attendances"))[0].n, 0);
  assert.equal((await fresh(p, job.id)).status, "Confirmed");
  assert.ok((await readBundle(q.p, q.pack.issues[0].manifest)).pdf.length > 1000);
});
for (const field of [
  "expected_version",
  "schedule_version",
  "assignment_version",
  "scope_version",
  "issue_hash",
  "issue_id",
  "assignment_id",
  "scope_revision_id",
] as const)
  test(`P07 stale or forged ${field} cannot start attendance`, async () => {
    const q = await acknowledged(),
      p = await principal("assigned-technician"),
      j = await fresh(p, q.pack.appointment_id),
      cmd = startInput(j);
    const value =
      typeof cmd[field] === "number"
        ? Number(cmd[field]) + 1
        : field === "issue_hash"
          ? "0".repeat(64)
          : randomUUID();
    await assert.rejects(
      startAttendance(p, j.id, { ...cmd, [field]: value }),
      code("VersionConflict", "RecordUnavailable", "AuthorityChanged"),
    );
    assert.equal(
      (await rows("SELECT count(*)::int n FROM ppo.field_attendances"))[0].n,
      0,
    );
  });
test("P07 current capability, assignment, same-404 and receipt/file boundaries survive revoked permission", async () => {
  const q = await started(),
    f = await photo(q.job, q.p),
    other = await principal("second-technician");
  await captureEntry(q.p, entry(q.job));
  assert.equal((await fresh(q.p, q.job.id)).follow_ups.length, 1);
  await database().query(
    "UPDATE ppo.permission_grants SET valid_to='2026-09-01' WHERE user_id=$1 AND capability='activity.read'",
    [q.p.actor_id],
  );
  await seed();
  const withoutActivityAccess = await fresh(q.p, q.job.id);
  assert.equal(withoutActivityAccess.follow_ups.length, 0);
  assert.equal(withoutActivityAccess.entries.length, 1);
  await assert.rejects(
    readFieldJob(q.p, randomUUID()),
    code("RecordUnavailable"),
  );
  await assert.rejects(
    readFieldJob(q.p, fixtureId("a8", 8)),
    code("RecordUnavailable"),
  );
  await assert.rejects(
    uploadAttachment(other, f.id, {
      ...base(),
      expected_version: 1,
      content_base64: f.bytes.toString("base64"),
    }),
    code("RecordUnavailable"),
  );
  await assert.rejects(
    readOperation(other, q.cmd.operation_id),
    code("RecordUnavailable"),
  );
  for (const profile of [
    "coordinator",
    "systems",
    "other-workspace",
    "second-company",
    "technician",
  ]) {
    const p = await principal(profile);
    await assert.rejects(readFieldJob(p, q.job.id), code("Forbidden"));
    await assert.rejects(attachmentMetadata(p, f.id), code("Forbidden"));
    await assert.rejects(attachmentBytes(p, f.id), code("Forbidden"));
  }
  await database().query(
    "UPDATE ppo.permission_grants SET valid_to='2026-09-01' WHERE user_id=$1 AND capability LIKE 'field.%'",
    [q.p.actor_id],
  );
  await seed();
  await assert.rejects(
    readOperation(q.p, q.cmd.operation_id),
    code("Forbidden"),
  );
  await assert.rejects(attachmentBytes(q.p, f.id), code("Forbidden"));
  assert.equal(
    (
      await rows(
        "SELECT count(*)::int n FROM ppo.permission_grants WHERE user_id=$1 AND capability LIKE 'field.%' AND valid_to IS NULL",
        [q.p.actor_id],
      )
    )[0].n,
    0,
  );
});
test("P07 typed evidence preserves attribution, failed fixes and exact decimals; duplicate capture and changed reuse are controlled", async () => {
  const q = await started(),
    cmd = entry(q.job);
  const [a, b] = await Promise.all([
    captureEntry(q.p, cmd),
    captureEntry(q.p, cmd),
  ]);
  assert.deepEqual(a.receipt, b.receipt);
  await assert.rejects(
    captureEntry(q.p, {
      ...cmd,
      payload: { ...(cmd.payload as object), finding: "changed" },
    }),
    code("OperationConflict"),
  );
  await captureEntry(q.p, entry(q.job, "Time", timePayload()));
  await captureEntry(q.p, entry(q.job, "Material", materialPayload()));
  await captureEntry(
    q.p,
    entry(q.job, "Reading", {
      name: "SYN substrate measurement",
      numeric_value: "0.100001",
      text_value: null,
      unit: "mS/cm",
      context: "SYN fictional instrument, external observation",
    }),
  );
  const j = await fresh(q.p, q.job.id);
  assert.equal(j.entries.length, 4);
  assert.equal(
    j.entries.find((x) => x.kind === "Time")!.payload.elapsed_seconds,
    5400,
  );
  assert.equal(
    j.entries.find((x) => x.kind === "Material")!.payload.quantity,
    "2",
  );
  assert.equal(
    j.entries.find((x) => x.kind === "Reading")!.payload.numeric_value,
    "0.100001",
  );
  assert.equal(j.entries[0].issue_hash, q.job.attendance!.issue_hash);
  assert.equal(j.follow_ups.length, 1);
  assert.equal(j.entries[0].review_status, "Draft");
  assert.doesNotMatch(
    JSON.stringify(j),
    /CONFIDENTIAL-MARGIN|PRIVATE_FINANCE|pending_account_plan/,
  );
});
test("P07 actor-wide time conflict prevents concurrent overlapping labour but allows adjacent intervals", async () => {
  const q = await started(),
    payload = timePayload(),
    a = entry(q.job, "Time", payload),
    b = entry(q.job, "Time", { ...payload, time_kind: "Travel" });
  const x = await Promise.allSettled([
    captureEntry(q.p, a),
    captureEntry(q.p, b),
  ]);
  assert.equal(x.filter((v) => v.status === "fulfilled").length, 1);
  assert.equal(
    (x.find((v) => v.status === "rejected") as PromiseRejectedResult).reason
      .code,
    "TimeOverlap",
  );
  await captureEntry(
    q.p,
    entry(q.job, "Time", {
      time_kind: "Break",
      start_at: payload.end_at,
      end_at: new Date(Date.parse(payload.end_at) + 60000).toISOString(),
      note: null,
    }),
  );
  assert.equal(
    (await rows("SELECT count(*)::int n FROM ppo.field_time_ranges"))[0].n,
    2,
  );
});
test("P07 correction creates an immutable successor, requires own current source version and retains all original authority", async () => {
  const q = await started(),
    cmd = entry(q.job, "Material", materialPayload());
  await captureEntry(q.p, cmd);
  const before = (
      await rows("SELECT * FROM ppo.field_entries WHERE id=$1", [cmd.id])
    )[0],
    correct = {
      ...cmd,
      ...base(),
      id: randomUUID(),
      expected_version: 1,
      payload: { ...materialPayload(), quantity: "1" },
      reason: "SYN correct double-counted sleeve",
    };
  const result = await captureEntry(q.p, correct, cmd.id);
  assert.equal(result.receipt.record_version, 2);
  assert.deepEqual(
    (await rows("SELECT * FROM ppo.field_entries WHERE id=$1", [cmd.id]))[0],
    before,
  );
  await assert.rejects(
    captureEntry(q.p, { ...correct, ...base(), id: randomUUID() }, cmd.id),
    code("VersionConflict"),
  );
  await assert.rejects(
    captureEntry(await principal("second-technician"), correct, cmd.id),
    code("RecordUnavailable"),
  );
  await assert.rejects(
    database().query(
      'UPDATE ppo.field_entries SET payload=payload||\'{"quantity":"9"}\' WHERE id=$1',
      [cmd.id],
    ),
  );
  const saved = (
    await rows("SELECT * FROM ppo.field_entries WHERE id=$1", [correct.id])
  )[0];
  assert.equal(saved.supersedes_entry_id, cmd.id);
  assert.equal(saved.issue_hash, before.issue_hash);
  assert.equal(saved.scope_revision_id, before.scope_revision_id);
});
test("P07 exact correction moves the active time projection and retains the original interval", async () => {
  const q = await started(),
    payload = timePayload(),
    cmd = entry(q.job, "Time", payload);
  await captureEntry(q.p, cmd);
  const corrected = {
    ...cmd,
    ...base(),
    id: randomUUID(),
    expected_version: 1,
    payload: {
      ...payload,
      end_at: new Date(Date.parse(payload.end_at) - 60000).toISOString(),
    },
    reason: "SYN correct actual interval",
  };
  await captureEntry(q.p, corrected, cmd.id);
  assert.equal(
    (
      await rows("SELECT payload FROM ppo.field_entries WHERE id=$1", [cmd.id])
    )[0].payload.elapsed_seconds,
    5400,
  );
  assert.equal(
    (await rows("SELECT entry_id FROM ppo.field_time_ranges"))[0].entry_id,
    corrected.id,
  );
});
test("P07 rejects unknown fields, forged actor, wrong task/asset, invalid time/material/reading/checklist and missing traceability", async () => {
  const q = await started(),
    cmd = entry(q.job);
  for (const bad of [
    { ...cmd, actor_id: randomUUID() },
    { ...cmd, payload: { ...(cmd.payload as object), approved: true } },
    { ...cmd, scope_item_id: randomUUID() },
    { ...cmd, asset_id: randomUUID() },
    { ...cmd, attendance_id: randomUUID() },
    {
      ...cmd,
      kind: "Time",
      payload: { ...timePayload(), end_at: timePayload().start_at },
    },
    {
      ...cmd,
      kind: "Time",
      payload: { ...timePayload(), time_kind: "Other", note: null },
    },
    {
      ...cmd,
      kind: "Material",
      payload: { ...materialPayload(), quantity: "-1" },
    },
    {
      ...cmd,
      kind: "Material",
      payload: { ...materialPayload(), uom: "gallons" },
    },
    {
      ...cmd,
      kind: "Material",
      payload: { ...materialPayload(), movement_kind: "Posted" },
    },
    {
      ...cmd,
      kind: "Material",
      payload: { ...materialPayload(), item_reference: "SYN-PART-LOT" },
    },
    {
      ...cmd,
      kind: "Material",
      payload: { ...materialPayload(), stock_status: "VerifiedReference" },
    },
    {
      ...cmd,
      kind: "Reading",
      payload: {
        name: "SYN",
        numeric_value: "1",
        text_value: "both",
        unit: "°C",
        context: "SYN",
      },
    },
    {
      ...cmd,
      kind: "Checklist",
      payload: {
        check_id: "SYN-SITE-CONTROLS",
        result: "NotApplicable",
        reason: "SYN cannot waive",
        evidence_ids: [],
      },
    },
  ])
    await assert.rejects(captureEntry(q.p, bad));
  assert.equal(
    (await rows("SELECT count(*)::int n FROM ppo.field_entries"))[0].n,
    0,
  );
});
test("P07 withdrawal after start holds further work, permits original-context evidence requiring review and preserves P05 move/cancel refusal", async () => {
  const q = await started(),
    co = await principal();
  await withdrawPack(co, q.pack.id, {
    ...base(),
    expected_version: q.pack.version,
  });
  await captureEntry(q.p, entry(q.job));
  const saved = await fresh(q.p, q.job.id);
  assert.equal(saved.entries[0].authority_state, "ReviewRequired");
  assert.equal(saved.readiness.component_ready, false);
  assert.equal(saved.attendance!.issue_hash, q.job.attendance!.issue_hash);
  assert.equal(saved.pack!.status, "Withdrawn");
});
test("P07 durable photo initiation is not availability; unchanged upload/finalise retry retain original identity, bytes and hash", async () => {
  const q = await started(),
    bytes = png(),
    id = randomUUID(),
    cmd = {
      ...base(),
      id,
      appointment_id: q.job.id,
      attendance_id: q.job.attendance!.id,
      filename: "SYN-photo.png",
      media_type: "image/png",
      byte_count: bytes.length,
      sha256: digest(bytes),
    };
  await initiateAttachment(q.p, cmd);
  assert.equal((await attachmentMetadata(q.p, id)).status, "Pending");
  await assert.rejects(attachmentBytes(q.p, id), code("AttachmentUnavailable"));
  const upload = {
      ...base(),
      expected_version: 1,
      content_base64: bytes.toString("base64"),
    },
    a = await uploadAttachment(q.p, id, upload);
  assert.deepEqual(
    (await uploadAttachment(q.p, id, upload)).receipt,
    a.receipt,
  );
  assert.equal((await attachmentMetadata(q.p, id)).retrieval_verified, false);
  const final = { ...base(), expected_version: 2 },
    f = await finaliseAttachment(q.p, id, final);
  assert.deepEqual(
    (await finaliseAttachment(q.p, id, final)).receipt,
    f.receipt,
  );
  assert.deepEqual((await attachmentBytes(q.p, id)).bytes, bytes);
  assert.equal((await attachmentMetadata(q.p, id)).sha256, digest(bytes));
});
test("P07 storage success/database failure recovers the original upload without duplicate bytes or a false Available reference", async () => {
  const q = await started(),
    bytes = png(),
    id = randomUUID();
  await initiateAttachment(q.p, {
    ...base(),
    id,
    appointment_id: q.job.id,
    attendance_id: q.job.attendance!.id,
    filename: "SYN-recover.png",
    media_type: "image/png",
    byte_count: bytes.length,
    sha256: digest(bytes),
  });
  const upload = {
    ...base(),
    expected_version: 1,
    content_base64: bytes.toString("base64"),
  };
  await assert.rejects(
    uploadAttachment(q.p, id, upload, {
      afterStore: async () => {
        throw Error("SYN injected database failure after durable store");
      },
    }),
  );
  assert.equal((await attachmentMetadata(q.p, id)).status, "Pending");
  await uploadAttachment(q.p, id, upload);
  await finaliseAttachment(q.p, id, { ...base(), expected_version: 2 });
  assert.deepEqual((await attachmentBytes(q.p, id)).bytes, bytes);
  assert.equal(
    (await rows("SELECT count(*)::int n FROM ppo.field_attachments"))[0].n,
    1,
  );
});
test("P07 wrong hash/interrupted bytes remain Pending; unsupported exact bytes are Rejected; missing uploaded bytes become Quarantined", async () => {
  const q = await started(),
    bytes = png(),
    id = randomUUID();
  await initiateAttachment(q.p, {
    ...base(),
    id,
    appointment_id: q.job.id,
    attendance_id: q.job.attendance!.id,
    filename: "SYN-interrupted.png",
    media_type: "image/png",
    byte_count: bytes.length,
    sha256: digest(bytes),
  });
  await assert.rejects(
    uploadAttachment(q.p, id, {
      ...base(),
      expected_version: 1,
      content_base64: bytes.subarray(0, 50).toString("base64"),
    }),
    code("AttachmentHashMismatch"),
  );
  await uploadAttachment(q.p, id, {
    ...base(),
    expected_version: 1,
    content_base64: bytes.toString("base64"),
  });
  const a = (
      await rows("SELECT * FROM ppo.field_attachments WHERE id=$1", [id])
    )[0],
    path = join(
      process.env.PPO_DOCUMENT_DIRECTORY ??
        join(homedir(), ".ppo-synthetic-documents"),
      a.workspace_id,
      a.storage_item_id,
    );
  await unlink(path);
  const result = await finaliseAttachment(q.p, id, {
    ...base(),
    expected_version: 2,
  });
  assert.equal(result.receipt.state, "Quarantined");
  await writeFile(path, bytes, { mode: 0o600 });
  await finaliseAttachment(q.p, id, { ...base(), expected_version: 3 });
  assert.deepEqual((await attachmentBytes(q.p, id)).bytes, bytes);
  const bad = Buffer.from("<svg>SYN unsupported</svg>"),
    bid = randomUUID();
  await initiateAttachment(q.p, {
    ...base(),
    id: bid,
    appointment_id: q.job.id,
    attendance_id: q.job.attendance!.id,
    filename: "SYN-invalid.png",
    media_type: "image/png",
    byte_count: bad.length,
    sha256: digest(bad),
  });
  assert.equal(
    (
      await uploadAttachment(q.p, bid, {
        ...base(),
        expected_version: 1,
        content_base64: bad.toString("base64"),
      })
    ).receipt.state,
    "Rejected",
  );
  await assert.rejects(
    attachmentBytes(q.p, bid),
    code("AttachmentUnavailable"),
  );
});
for (const outcome of ["Partial", "UnableToProceed"])
  test(`P07 ${outcome} draft saves exact evidence and owned remaining work without order/report/Finance closure`, async () => {
    const q = await started();
    await captureEntry(q.p, entry(q.job));
    const j = await fresh(q.p, q.job.id),
      cmd = draft(j, outcome),
      r = await saveCompletionDraft(q.p, j.id, cmd);
    assert.equal(r.receipt.state, "Draft");
    const saved = await fresh(q.p, j.id);
    assert.equal(saved.status, "InProgress");
    assert.equal(saved.work_order.status, "Authorised");
    assert.ok(saved.draft_revisions[0].follow_up_activity_id);
    assert.ok(saved.draft_revisions[0].entries.length);
    assert.equal(
      (
        await rows(
          "SELECT ((SELECT count(*) FROM ppo.service_reports)+(SELECT count(*) FROM information_schema.tables WHERE table_schema='ppo' AND table_name='financial_handoffs'))::int AS n",
        )
      )[0].n,
      0,
    );
    assert.deepEqual(
      (await saveCompletionDraft(q.p, j.id, cmd)).receipt,
      r.receipt,
    );
  });
test("P07 Complete draft requires every task/check and Available attachment; saved draft is not attendance/report approval", async () => {
  const q = await started();
  await assert.rejects(
    saveCompletionDraft(q.p, q.job.id, draft(q.job, "Complete")),
    code("CompletionBlocked"),
  );
  const f = await photo(q.job, q.p);
  await captureEntry(
    q.p,
    entry(q.job, "Photo", {
      attachment_id: f.id,
      caption: "SYN fictional inspection fixture, external view",
    }),
  );
  for (const check_id of ["SYN-SITE-CONTROLS", "SYN-TASK-RESULT"])
    await captureEntry(
      q.p,
      entry(q.job, "Checklist", {
        check_id,
        result: "Pass",
        reason: null,
        evidence_ids: check_id === "SYN-SITE-CONTROLS" ? [f.id] : [],
      }),
    );
  const j = await fresh(q.p, q.job.id),
    cmd = draft(j, "Complete");
  await saveCompletionDraft(q.p, j.id, cmd);
  const saved = await fresh(q.p, j.id);
  assert.equal(saved.draft_revisions[0].scope_outcome, "Complete");
  assert.deepEqual(saved.draft_revisions[0].blockers, []);
  assert.equal(saved.status, "InProgress");
  assert.equal(
    (
      await rows("SELECT actual_end_at FROM ppo.appointments WHERE id=$1", [
        j.id,
      ])
    )[0].actual_end_at,
    null,
  );
});
test("P07 completion references are exact; corrections mark prior draft stale and required unavailable attachments block Complete", async () => {
  const q = await started(),
    cmd = entry(q.job);
  await captureEntry(q.p, cmd);
  let j = await fresh(q.p, q.job.id);
  await saveCompletionDraft(q.p, j.id, draft(j));
  await captureEntry(
    q.p,
    {
      ...cmd,
      ...base(),
      id: randomUUID(),
      expected_version: 1,
      payload: {
        ...(cmd.payload as object),
        finding: "SYN corrected uncertainty",
      },
    },
    cmd.id,
  );
  j = await fresh(q.p, j.id);
  assert.equal(j.draft_revisions[0].evidence_changed, true);
  const bytes = png(),
    id = randomUUID();
  await initiateAttachment(q.p, {
    ...base(),
    id,
    appointment_id: j.id,
    attendance_id: j.attendance!.id,
    filename: "SYN-pending.png",
    media_type: "image/png",
    byte_count: bytes.length,
    sha256: digest(bytes),
  });
  j = await fresh(q.p, j.id);
  await saveCompletionDraft(q.p, j.id, draft(j));
  const saved = await fresh(q.p, j.id);
  assert.ok(
    saved.draft_revisions[0].blockers.includes(
      "A required original photo is unavailable.",
    ),
  );
  await assert.rejects(
    saveCompletionDraft(q.p, j.id, draft(saved, "Complete")),
    code("CompletionBlocked"),
  );
});
for (const command of ["start", "capture", "draft"] as const)
  for (const table of ["audit_events", "operation_receipts", "outbox_jobs"])
    test(`P07 ${command} late ${table} failure rolls back every database effect`, async () => {
      const q = command === "start" ? await acknowledged() : await started(),
        p = "startReceipt" in q ? q.p : await principal("assigned-technician"),
        j = await fresh(p, q.pack.appointment_id);
      const counts = async () =>
        rows(
          "SELECT (SELECT count(*)::int FROM ppo.field_attendances) a,(SELECT count(*)::int FROM ppo.field_entries) e,(SELECT count(*)::int FROM ppo.completion_drafts) d,(SELECT count(*)::int FROM ppo.completion_draft_revisions) v,(SELECT count(*)::int FROM ppo.activities) act,(SELECT count(*)::int FROM ppo.operation_receipts) r,(SELECT count(*)::int FROM ppo.outbox_jobs) o,(SELECT count(*)::int FROM ppo.audit_events) audit",
        );
      const before = await counts();
      await database().query(
        `CREATE FUNCTION ppo.fail_p07() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'SYN late rollback challenge'; END $$; CREATE TRIGGER p07_failure BEFORE INSERT ON ppo.${table} FOR EACH ROW EXECUTE FUNCTION ppo.fail_p07()`,
      );
      const run = () =>
        command === "start"
          ? startAttendance(p, j.id, startInput(j))
          : command === "capture"
            ? captureEntry(p, entry(j))
            : saveCompletionDraft(p, j.id, draft(j));
      await assert.rejects(run());
      assert.deepEqual(await counts(), before);
    });

test("P07 PT-14 component preserves two task/asset outcomes and uncertain identity with owned remaining work", async () => {
  const q = await twoTaskStarted(),
    j = q.job;
  assert.equal(j.scope.items.length, 2);
  const first = entry(j, "Observation", {
    finding: "SYN controller external inspection finished",
    confidence: "Reported",
    attempted_fix: null,
    result: null,
    follow_up_required: false,
  });
  await captureEntry(q.p, first);
  const second = j.scope.items[1];
  await captureEntry(q.p, {
    ...entry(j),
    scope_item_id: second.id,
    asset_id: second.assets[0].id,
  });
  const current = await fresh(q.p, j.id),
    cmd = draft(current);
  cmd.task_outcomes[0].outcome = "Complete";
  cmd.task_outcomes[1].outcome = "UnableToProceed";
  await saveCompletionDraft(q.p, j.id, cmd);
  const saved = await fresh(q.p, j.id);
  assert.deepEqual(
    saved.draft_revisions[0].task_outcomes
      .map((t: { scope_item_id: string; outcome: string }) => ({
        id: t.scope_item_id,
        outcome: t.outcome,
      }))
      .sort((a: { id: string }, b: { id: string }) => a.id.localeCompare(b.id)),
    cmd.task_outcomes
      .map((t: {scope_item_id: string; outcome: string}) => ({ id: t.scope_item_id, outcome: t.outcome }))
      .sort((a: {id:string}, b: {id:string}) => a.id.localeCompare(b.id)),
  );
  assert.equal(
    saved.scope.items[1].assets[0].identity_status,
    second.assets[0].identity_status,
  );
  assert.notEqual(saved.scope.items[1].assets[0].identity_status, "Verified");
  assert.equal(saved.work_order.status, "Authorised");
  assert.equal(saved.status, "InProgress");
  assert.ok(saved.draft_revisions[0].follow_up_activity_id);
  await assert.rejects(
    rows(
      "UPDATE ppo.completion_drafts SET actor_id=$2,version=version+1 WHERE id=$1",
      [cmd.id, q.co.actor_id],
    ),
  );
  await assert.rejects(
    rows(
      "UPDATE ppo.completion_entry_refs SET entry_version=999 WHERE revision_id=$1",
      [saved.draft_revisions[0].id],
    ),
  );
  assert.equal(
    (
      await rows(
        "SELECT count(*)::int n FROM ppo.appointments WHERE work_order_id=$1",
        [saved.work_order.id],
      )
    )[0].n,
    1,
  );
});
