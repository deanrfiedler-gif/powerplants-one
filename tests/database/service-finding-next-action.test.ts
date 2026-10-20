import assert from "node:assert/strict";
import { after, beforeEach, test } from "node:test";
import { randomUUID } from "node:crypto";
import { reset } from "../../scripts/database";
import {
  database,
  transaction,
  closeDatabase,
} from "../../src/platform/database";
import { localConfig } from "../../src/platform/config";
import { withWorkingCompany } from "../../src/platform/working-company";
import {
  readNextAction,
  setNextAction,
} from "../../src/service/findings/next-action";
import { readFindings, readFinding } from "../../src/service/findings/reads";
import {
  activityCommand,
  activityHistory,
  readActivity,
} from "../../src/activities/activities";
import { readOperation } from "../../src/shared/receipts";
import { confirmed, principal, base } from "../helpers/packs";
import {
  inspectionFixture,
  inspect,
  openInspection,
  saveInspection,
} from "../helpers/service-inspections";
import { inspectionCommand } from "../../src/inspections/service-commands";
import { reportIssued, response } from "../helpers/reports";
import { readReport, recordResponse } from "../../src/reports/service";
import { incidentCommand, incidentRead } from "../../src/incidents/service";
import { binding } from "../../src/incidents/context";

if (localConfig().database_name !== "ppo_synthetic_test")
  throw Error("Disposable test database only");
process.env.PPO_ALLOW_RESET = "dispose-synthetic";
process.env.PPO_RESET_DATABASE = "ppo_synthetic_test";
beforeEach(reset);
after(closeDatabase);
const denied = (e: unknown) =>
  [403, 404].includes((e as { status: number }).status);
const code = (expected: string) => (e: unknown) =>
  (e as { code: string }).code === expected;
async function input(
  p: Awaited<ReturnType<typeof principal>>,
  key: string,
  owner = p.actor_id,
) {
  const c = await readNextAction(p, key);
  return {
    ...base(),
    source_token: c.source_token,
    expected_version: c.expected_version,
    owner_id: owner,
    due_at: "2031-11-11T03:00:00Z",
    instruction: "SYN investigate and retain observations",
    required_evidence: "SYN photo and measured reading",
  };
}
async function state() {
  return (
    await database().query(`SELECT
    (SELECT count(*) FROM ppo.activities)::int activities,
    (SELECT count(*) FROM ppo.audit_events)::int audits,
    (SELECT count(*) FROM ppo.operation_receipts)::int receipts,
    (SELECT count(*) FROM ppo.outbox_jobs)::int jobs,
    (SELECT count(*) FROM ppo.service_finding_activity_bindings)::int bindings,
    (SELECT count(*) FROM ppo.service_finding_action_details)::int details`)
  ).rows[0];
}
async function nativeRows() {
  const tables = [
    "inspection_defects",
    "incident_actions",
    "incidents",
    "report_revisions",
    "customer_responses",
    "appointments",
    "schedule_follow_ups",
  ];
  return Promise.all(
    tables.map((t) =>
      database()
        .query(
          `SELECT to_jsonb(x) AS row FROM ppo.${t} x ORDER BY to_jsonb(x)::text`,
        )
        .then((r) => r.rows),
    ),
  );
}

test("SV07 R2 changes one scheduling Activity, retains history, retries and source bytes", async () => {
  const a = await confirmed(),
    p = await principal();
  const row = (
    await readFindings(p, { source: "schedule", q: a.display_number })
  ).items[0];
  const cmd = await input(p, row.id),
    before = await state(),
    origins = await nativeRows();
  cmd.due_at = "2020-01-01T00:00:00Z";
  const original = await readActivity(p, row.action!.id);
  assert.equal(original.can_edit, false);
  await assert.rejects(
    activityCommand(
      p,
      original.id,
      {
        ...base(),
        expected_version: original.version,
        owner_id: p.actor_id,
        summary: "SYN bypass",
        due_at: null,
        due_needed: true,
      },
      "update",
    ),
    code("SourceWorkflowRequired"),
  );
  const results = await Promise.all([
    setNextAction(p, row.id, cmd),
    setNextAction(p, row.id, cmd),
  ]);
  assert.equal(results.filter((r) => r.replayed).length, 1);
  assert.deepEqual(results[0].receipt, results[1].receipt);
  assert.equal(results[0].receipt.record_id, row.action!.id);
  assert.deepEqual(await state(), {
    ...before,
    audits: before.audits + 1,
    receipts: before.receipts + 1,
    jobs: before.jobs + 1,
    bindings: before.bindings + 1,
    details: before.details + 1,
  });
  assert.deepEqual(await nativeRows(), origins);
  const detail = await readActivity(p, row.action!.id);
  assert.equal(detail.summary, cmd.instruction);
  assert.equal(detail.required_evidence, cmd.required_evidence);
  assert.equal(detail.due_date_only, false);
  assert.equal((await readNextAction(p, row.id)).item.overdue, true);
  assert.equal((await readFinding(p, row.id)).item.overdue, true);
  const change = {
    ...(await input(p, row.id)),
    instruction: "SYN compare follow-up readings",
    required_evidence: null,
  };
  await setNextAction(p, row.id, change);
  assert.equal((await readFinding(p, row.id)).item.action!.id, row.action!.id);
  const history = await activityHistory(p, row.action!.id);
  assert.equal(
    history.items[0].before?.required_evidence,
    cmd.required_evidence,
  );
  assert.equal(history.items[0].after?.required_evidence, null);
  assert.equal(history.items[0].before?.summary, cmd.instruction);
  assert.deepEqual(
    (await setNextAction(p, row.id, cmd)).receipt,
    results[0].receipt,
  );
  assert.deepEqual(
    await readOperation(p, cmd.operation_id),
    results[0].receipt,
  );
  await assert.rejects(
    setNextAction(p, row.id, { ...cmd, instruction: "different" }),
    code("OperationConflict"),
  );
  await assert.rejects(
    setNextAction(p, row.id, { ...cmd, operation_id: randomUUID() }),
    code("VersionConflict"),
  );
  const current = await input(p, row.id);
  const distinct = await Promise.allSettled([
    setNextAction(p, row.id, current),
    setNextAction(p, row.id, { ...current, operation_id: randomUUID() }),
  ]);
  assert.equal(distinct.filter((r) => r.status === "fulfilled").length, 1);
  const terminal = await readActivity(p, row.action!.id);
  await activityCommand(
    p,
    terminal.id,
    {
      ...base(),
      expected_version: terminal.version,
      outcome: "SYN contact action completed",
    },
    "complete",
  );
  assert.equal((await readNextAction(p, row.id)).can_edit, false);
  await assert.rejects(
    setNextAction(p, row.id, await input(p, row.id)),
    code("SourceDispositionRequired"),
  );
  assert.deepEqual(
    (await setNextAction(p, row.id, cmd)).receipt,
    results[0].receipt,
  );
  const grants = (
    await database().query(
      "SELECT id,valid_to FROM ppo.permission_grants WHERE user_id=$1 AND capability='service.work_order.edit'",
      [p.actor_id],
    )
  ).rows;
  try {
    await database().query(
      "UPDATE ppo.permission_grants SET valid_to=clock_timestamp() WHERE user_id=$1 AND capability='service.work_order.edit'",
      [p.actor_id],
    );
    await assert.rejects(setNextAction(p, row.id, cmd), denied);
    await assert.rejects(readOperation(p, cmd.operation_id), denied);
  } finally {
    for (const g of grants)
      await database().query(
        "UPDATE ppo.permission_grants SET valid_to=$2 WHERE id=$1",
        [g.id, g.valid_to],
      );
  }
});

test("SV07 R2 creates only a missing inspection task; technician cannot set it and closure remains native", async () => {
  const f = await inspectionFixture(),
    attempt = await openInspection(f, f.tech, 1),
    saved = await saveInspection(f, attempt);
  await inspectionCommand(
    f.tech,
    f.id,
    {
      ...base(),
      action: "submit",
      attempt_id: attempt,
      expected_version: saved.row.version,
    },
    "capture",
  );
  const defect = (await inspect(f.tech, f.id)).defects[0],
    key = `inspection:${defect.id}`;
  // A legacy/imported missing-task source, within the nullable native schema.
  // Retain the original Activity and every source field thereafter.
  await database().query(
    "UPDATE ppo.inspection_defects SET activity_id=NULL,version=version+1 WHERE id=$1",
    [defect.id],
  );
  const origins = await nativeRows(),
    before = await state(),
    cmd = await input(f.co, key, f.tech.actor_id);
  assert.equal(cmd.expected_version, 0);
  assert.equal((await readNextAction(f.tech, key)).blocked_reason, "ViewOnly");
  await assert.rejects(setNextAction(f.tech, key, cmd), denied);
  await assert.rejects(
    setNextAction(f.co, key, { ...cmd, owner_id: randomUUID() }),
    denied,
  );
  await assert.rejects(
    withWorkingCompany(
      f.co.actor_id,
      "20000000-0000-4000-8000-000000000002",
      () => setNextAction(f.co, key, cmd),
    ),
    denied,
  );
  const results = await Promise.allSettled([
    setNextAction(f.co, key, cmd),
    setNextAction(f.co, key, { ...cmd, operation_id: randomUUID() }),
  ]);
  assert.equal(results.filter((r) => r.status === "fulfilled").length, 1);
  const created = results.find((r) => r.status === "fulfilled")!;
  assert.equal(created.status, "fulfilled");
  const receipt = created.value.receipt;
  assert.equal((await state()).activities, before.activities + 1);
  assert.deepEqual(await nativeRows(), origins);
  const row = (await readFinding(f.co, key)).item;
  assert.equal(row.action!.id, receipt.record_id);
  const owned = await readActivity(f.tech, receipt.record_id);
  assert.equal(owned.can_edit, false);
  await assert.rejects(
    activityCommand(
      f.tech,
      owned.id,
      {
        ...base(),
        expected_version: owned.version,
        owner_id: f.tech.actor_id,
        summary: "SYN bypass",
        due_at: null,
        due_needed: true,
      },
      "update",
    ),
    code("SourceWorkflowRequired"),
  );
  assert.equal(
    (
      await readFindings(f.co, {
        source: "inspection",
        q: row.source_record.reference,
      })
    ).items[0].action!.id,
    receipt.record_id,
  );
  const change = await input(f.co, key, f.second.actor_id);
  await setNextAction(f.co, key, change);
  assert.equal(
    (await readActivity(f.second, receipt.record_id)).owner_id,
    f.second.actor_id,
  );
  const stale = await input(f.co, key, f.second.actor_id);
  await inspectionCommand(
    f.tech,
    f.id,
    {
      ...base(),
      action: "correct",
      defect_id: defect.id,
      expected_version: defect.version + 1,
      note: "SYN correction pending retest",
    },
    "capture",
  );
  await assert.rejects(setNextAction(f.co, key, stale), code("FindingChanged"));
  const now = await readActivity(f.second, receipt.record_id);
  await activityCommand(
    f.second,
    now.id,
    {
      ...base(),
      expected_version: now.version,
      outcome: "SYN task completed, review still required",
    },
    "complete",
  );
  assert.equal((await readFinding(f.co, key)).item.state, "WaitingReview");
  await assert.rejects(
    setNextAction(f.co, key, await input(f.co, key)),
    code("ActivityDispositionRequired"),
  );
});

test("SV07 R2 completion and response reuse native tasks and preserve immutable observations", async () => {
  const f = await reportIssued(),
    completionKey = `completion:${f.report.revisions[0].id}`;
  const command = {
    ...response(f.report, "AcceptedWithReservations"),
    subject: "ReportContent",
  };
  await recordResponse(f.p, f.report.id, command);
  const responseKey = `response:${command.id}`,
    origins = await nativeRows();
  for (const key of [completionKey, responseKey]) {
    const previous = await readNextAction(f.reviewer, key),
      cmd = await input(f.reviewer, key);
    await setNextAction(f.reviewer, key, cmd);
    assert.equal(
      (await readNextAction(f.reviewer, key)).item.action!.id,
      previous.item.action!.id,
    );
  }
  assert.deepEqual(await nativeRows(), origins);
  const stale = await input(f.reviewer, responseKey),
    report = (await readReport(f.p, f.report.id)).items[0];
  await recordResponse(f.p, f.report.id, {
    ...response(report, "Accepted"),
    subject: "ReportContent",
    supersedes_response_id: command.id,
    correction_reason: "SYN correction of exact response",
  });
  await assert.rejects(
    setNextAction(f.reviewer, responseKey, stale),
    code("FindingChanged"),
  );
  assert.equal(
    (await readNextAction(f.reviewer, responseKey)).blocked_reason,
    "SourceDispositionRequired",
  );
});

test("SV07 R2 incident action changes retain hold, accepted facts and source-authorised owner", async () => {
  const f = await inspectionFixture(),
    target = (await inspect(f.tech, f.id)).targets[0];
  const b = await transaction((c) =>
      binding(c, f.tech, f.id, target.scope_item_id, target.asset_id),
    ),
    id = randomUUID();
  await incidentCommand(f.tech, {
    ...base(),
    id,
    action: "create",
    appointment_id: f.id,
    scope_item_id: target.scope_item_id,
    asset_id: target.asset_id,
    source_hash: b.source_hash,
    facts: {
      classification: "Incident",
      occurred_at: new Date().toISOString(),
      summary: "SYN observed fault",
      observations: "SYN observation",
      immediate_response: "Reported",
      source_reference: "SYN source",
      restricted_details: "SYN private fact",
    },
  });
  await incidentCommand(f.tech, {
    ...base(),
    id,
    action: "submit",
    expected_version: (await incidentRead(f.tech, id)).row.version,
  });
  await incidentCommand(f.co, {
    ...base(),
    id,
    action: "triage",
    expected_version: (await incidentRead(f.co, id)).row.version,
    owner_id: f.tech.actor_id,
    due_at: "2031-11-10T00:00:00Z",
    priority: "Routine",
    assessment: "Assessed",
    hold: true,
  });
  const action = randomUUID();
  await incidentCommand(f.co, {
    ...base(),
    id,
    action: "action",
    expected_version: (await incidentRead(f.co, id)).row.version,
    action_id: action,
    owner_id: f.tech.actor_id,
    due_at: "2031-11-10T00:00:00Z",
    instruction: "SYN retain corrective evidence",
  });
  const key = `incident:${action}`,
    cmd = await input(f.co, key, f.second.actor_id),
    origins = await nativeRows();
  const grants = (
    await database().query(
      "SELECT id,valid_to FROM ppo.permission_grants WHERE user_id=$1 AND capability='incident.read'",
      [f.second.actor_id],
    )
  ).rows;
  try {
    await database().query(
      "UPDATE ppo.permission_grants SET valid_to=clock_timestamp() WHERE user_id=$1 AND capability='incident.read'",
      [f.second.actor_id],
    );
    const before = await state();
    await assert.rejects(setNextAction(f.co, key, cmd), denied);
    assert.deepEqual(await state(), before);
  } finally {
    for (const g of grants)
      await database().query(
        "UPDATE ppo.permission_grants SET valid_to=$2 WHERE id=$1",
        [g.id, g.valid_to],
      );
  }
  const accepted = await setNextAction(f.co, key, cmd);
  assert.deepEqual(await nativeRows(), origins);
  assert.equal(
    (await readActivity(f.second, accepted.receipt.record_id))
      .required_evidence,
    cmd.required_evidence,
  );
  // A storage failure after the Activity update rolls back its history/version too.
  const next = await input(f.co, key, f.second.actor_id),
    before = await state(),
    prior = await readActivity(f.second, accepted.receipt.record_id);
  await database().query(
    "CREATE FUNCTION ppo.syn_fail_action_detail() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'SYN rollback probe'; END $$; CREATE TRIGGER syn_fail_action_detail BEFORE UPDATE ON ppo.service_finding_action_details FOR EACH ROW EXECUTE FUNCTION ppo.syn_fail_action_detail()",
  );
  try {
    await assert.rejects(setNextAction(f.co, key, next), /SYN rollback probe/);
  } finally {
    await database().query(
      "DROP TRIGGER syn_fail_action_detail ON ppo.service_finding_action_details; DROP FUNCTION ppo.syn_fail_action_detail()",
    );
  }
  assert.deepEqual(await state(), before);
  assert.deepEqual(
    await readActivity(f.second, accepted.receipt.record_id),
    prior,
  );
});
