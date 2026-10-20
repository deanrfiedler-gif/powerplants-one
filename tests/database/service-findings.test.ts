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
import { readFindings, readFinding } from "../../src/service/findings/reads";
import { activityCommand, readActivity } from "../../src/activities/activities";
import { inspectionCommand } from "../../src/inspections/service-commands";
import {
  inspectionFixture,
  inspect,
  openInspection,
  saveInspection,
} from "../helpers/service-inspections";
import { confirmed, principal, base } from "../helpers/packs";
import { submitted, reportIssued, response } from "../helpers/reports";
import { recordResponse, readReport } from "../../src/reports/service";
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
async function fingerprints() {
  return (
    await database().query(`SELECT
    (SELECT md5(string_agg(to_jsonb(a)::text,',' ORDER BY id)) FROM ppo.activities a) activities,
    (SELECT count(*) FROM ppo.audit_events) audits,(SELECT count(*) FROM ppo.operation_receipts) receipts,
    (SELECT count(*) FROM ppo.outbox_jobs) jobs,
    (SELECT md5(string_agg(to_jsonb(a)::text,',' ORDER BY id)) FROM ppo.appointments a) appointments`)
  ).rows;
}

test("SV07 scheduling findings use native source, stable paging and read-only closure projection", async () => {
  const a = await confirmed(),
    p = await principal();
  const before = await fingerprints();
  const list = await readFindings(p, {
    source: "schedule",
    view: "all",
    limit: 1,
  });
  assert.ok(list.total > 0);
  assert.equal(list.items.length, 1);
  assert.equal(list.count_scope, "AuthorisedCandidateWindow");
  assert.equal(list.total, 1);
  assert.equal(list.counts.all, 1);
  assert.equal(list.next_offset, 1);
  const next = await readFindings(p, {
    source: "schedule",
    view: "all",
    limit: 1,
    offset: list.next_offset!,
  });
  assert.equal(next.items.length, 1);
  assert.notEqual(next.items[0].id, list.items[0].id);
  assert.equal(next.next_offset, null);
  const closedWindow = await readFindings(p, {
    source: "schedule",
    view: "closed",
    limit: 1,
  });
  assert.equal(closedWindow.total, 0);
  assert.equal(closedWindow.next_offset, 1);
  const row = list.items.find((r) => r.appointment.id === a.id)!;
  assert.ok(row);
  assert.equal(row.action?.href, `/work/${row.action?.id}`);
  assert.equal(row.source_record.href, `/service/appointments/${a.id}`);
  assert.deepEqual((await readFinding(p, row.id)).item, row);
  assert.deepEqual(await fingerprints(), before);
  const filtered = await readFindings(p, {
    q: a.display_number,
    source: "schedule",
    owner_id: p.actor_id,
  });
  assert.equal(filtered.total, 1);
  const work = await readActivity(p, row.action!.id);
  await activityCommand(
    p,
    work.id,
    {
      ...base(),
      expected_version: work.version,
      outcome: "SYN contact follow-up completed; no booking change",
    },
    "complete",
  );
  assert.equal((await readFinding(p, row.id)).item.state, "Closed");
  assert.equal(
    (await readFindings(p, { source: "schedule", q: a.display_number })).total,
    0,
  );
  assert.equal(
    (
      await readFindings(p, {
        source: "schedule",
        view: "closed",
        q: a.display_number,
      })
    ).total,
    1,
  );
});

test("SV07 source permissions, working company and Activity revocation hide data and counts", async () => {
  await confirmed();
  const p = await principal();
  const row = (await readFindings(p, { source: "schedule" })).items[0];
  assert.ok(row);
  assert.equal((await readFindings(p, { site_id: randomUUID() })).total, 0);
  assert.equal(
    (
      await withWorkingCompany(
        p.actor_id,
        "20000000-0000-4000-8000-000000000002",
        () => readFindings(p),
      )
    ).total,
    0,
  );
  await assert.rejects(
    readFinding({ ...p, workspace_id: randomUUID() }, row.id),
    denied,
  );
  await database().query(
    "UPDATE ppo.permission_grants SET valid_to=clock_timestamp() WHERE user_id=$1 AND capability='activity.read'",
    [p.actor_id],
  );
  const hidden = await readFindings(p, {
    q: row.action!.summary,
    view: "all",
    limit: 1,
  });
  assert.equal(hidden.total, 0);
  assert.equal(hidden.next_offset, null);
  assert.ok(Object.values(hidden.counts).every((n) => n === 0));
  assert.doesNotMatch(JSON.stringify(hidden), new RegExp(row.source_id));
  await assert.rejects(readFinding(p, row.id), denied);
});

test("SV07 failed inspection stays open after its Activity completes and follows native correction/review", async () => {
  const f = await inspectionFixture(),
    id = await openInspection(f, f.tech, 1),
    a = await saveInspection(f, id);
  await inspectionCommand(
    f.tech,
    f.id,
    {
      ...base(),
      action: "submit",
      attempt_id: id,
      expected_version: a.row.version,
    },
    "capture",
  );
  const defect = (await inspect(f.tech, f.id)).defects[0];
  const row = (await readFinding(f.tech, `inspection:${defect.id}`)).item;
  assert.equal(row.source_id, defect.id);
  assert.deepEqual(
    (
      await readFindings(f.tech, {
        source: "inspection",
        q: row.source_record.reference,
      })
    ).items.map((r) => r.id),
    [row.id],
  );
  assert.equal(
    row.equipment?.id,
    (await inspect(f.tech, f.id)).targets[0].asset_id,
  );
  assert.match(row.source_record.href, /my-jobs\/inspections\?appointment_id=/);
  const task = await readActivity(f.tech, defect.activity_id!);
  await activityCommand(
    f.tech,
    task.id,
    {
      ...base(),
      expected_version: task.version,
      outcome: "SYN action done, retest remains",
    },
    "complete",
  );
  assert.equal(
    (await readFinding(f.co, row.id)).item.state,
    "FollowUpCompleted",
  );
  assert.equal(
    (await readFindings(f.co, { source: "inspection", view: "closed" })).total,
    0,
  );
  await inspectionCommand(
    f.tech,
    f.id,
    {
      ...base(),
      action: "correct",
      defect_id: defect.id,
      expected_version: defect.version,
      note: "SYN correction recorded for independent retest",
    },
    "capture",
  );
  assert.equal((await readFinding(f.co, row.id)).item.state, "WaitingReview");
  await inspectionCommand(
    f.co,
    f.id,
    {
      ...base(),
      action: "review",
      id: randomUUID(),
      attempt_id: id,
      decision: "Returned",
      decision_reason: "SYN require exact corrected retest",
      owner_id: f.tech.actor_id,
      due: "2031-11-10",
    },
    "review",
  );
  const retest = await openInspection(f, f.tech, 1, id);
  const passing = await saveInspection(f, retest, "215");
  await inspectionCommand(
    f.tech,
    f.id,
    {
      ...base(),
      action: "submit",
      attempt_id: retest,
      expected_version: passing.row.version,
    },
    "capture",
  );
  assert.equal((await readFinding(f.co, row.id)).item.state, "WaitingReview");
  await inspectionCommand(
    f.co,
    f.id,
    {
      ...base(),
      action: "review",
      id: randomUUID(),
      attempt_id: retest,
      decision: "Accepted",
      decision_reason: "SYN exact passing retest accepted independently",
    },
    "review",
  );
  assert.equal((await readFinding(f.co, row.id)).item.state, "Closed");
  const untested = await openInspection(f, f.tech, 0);
  const draft = (await inspect(f.tech, f.id)).attempts.find(
    (x) => x.row.id === untested,
  )!;
  await inspectionCommand(
    f.tech,
    f.id,
    {
      ...base(),
      action: "save",
      attempt_id: untested,
      expected_version: draft.row.version,
      occurred_at: new Date().toISOString(),
      readings: draft.row.plan.map((d) => ({
        check_key: d.key,
        state: "NotTested",
        reason: "SYN check unavailable; remains outstanding",
      })),
    },
    "capture",
  );
  const saved = (await inspect(f.tech, f.id)).attempts.find(
    (x) => x.row.id === untested,
  )!;
  await inspectionCommand(
    f.tech,
    f.id,
    {
      ...base(),
      action: "submit",
      attempt_id: untested,
      expected_version: saved.row.version,
    },
    "capture",
  );
  const outstanding = await readFindings(f.tech, {
    source: "inspection",
    q: "required check not tested",
  });
  assert.ok(outstanding.items.length > 0);
  assert.ok(
    outstanding.items.every(
      (r) => r.state === "Open" && r.what_remains.includes("not tested"),
    ),
  );
  const original = await fingerprints();
  await readFindings(f.co, { view: "all" });
  assert.deepEqual(await fingerprints(), original);
  await database().query(
    "UPDATE ppo.permission_grants SET valid_to=clock_timestamp() WHERE user_id=$1 AND capability='field.read.own'",
    [f.tech.actor_id],
  );
  assert.equal((await readFindings(f.tech, { source: "inspection" })).total, 0);
  await assert.rejects(readFinding(f.tech, row.id), denied);
});

test("SV07 remaining work keeps the exact submitted revision and does not equate Activity completion with completion of scope", async () => {
  const f = await submitted();
  const list = await readFindings(f.reviewer, { source: "completion" });
  assert.equal(list.total, 1);
  const row = list.items[0];
  assert.equal(row.source_id, f.report.revisions[0].id);
  assert.equal(
    (await readFindings(f.reviewer, { q: row.source_record.reference }))
      .items[0]?.id,
    row.id,
  );
  assert.equal(row.native_state, "Partial");
  assert.match(row.closes_when, /does not prove/);
  const action = await readActivity(f.reviewer, row.action!.id);
  await activityCommand(
    f.reviewer,
    action.id,
    {
      ...base(),
      expected_version: action.version,
      outcome: "SYN follow-up performed; original partial scope retained",
    },
    "complete",
  );
  assert.equal(
    (await readFinding(f.reviewer, row.id)).item.state,
    "FollowUpCompleted",
  );
  assert.equal(
    (await readFindings(f.reviewer, { source: "completion" })).total,
    1,
  );
  assert.equal(
    (await readReport(f.reviewer, f.report.id)).items[0].revisions[0].snapshot
      .completion.scope_outcome,
    "Partial",
  );
});

test("SV07 customer reservations remain exact and correction supersedes rather than overwrites the original", async () => {
  const f = await reportIssued(),
    cmd = {
      ...response(f.report, "AcceptedWithReservations"),
      subject: "ReportContent",
    };
  await recordResponse(f.p, f.report.id, cmd);
  const row = (await readFinding(f.reviewer, `response:${cmd.id}`)).item;
  assert.equal(row.native_state, "AcceptedWithReservations");
  assert.equal(row.what_remains, cmd.remarks);
  assert.ok(row.action);
  assert.doesNotMatch(
    JSON.stringify(row),
    /signature|presented_hash|respondent_name|storage/,
  );
  const current = (await readReport(f.p, f.report.id)).items[0];
  await recordResponse(f.p, f.report.id, {
    ...response(current, "Accepted"),
    subject: "ReportContent",
    supersedes_response_id: cmd.id,
    correction_reason: "SYN customer corrected the exact response",
  });
  assert.equal(
    (await readFinding(f.reviewer, row.id)).item.state,
    "Superseded",
  );
  assert.equal(
    (await readFindings(f.reviewer, { source: "response" })).total,
    0,
  );
  assert.equal(
    (await readFindings(f.reviewer, { source: "response", view: "superseded" }))
      .total,
    1,
  );
});

test("SV07 incident corrective action preserves source authority and excludes restricted facts", async () => {
  const f = await inspectionFixture(),
    target = (await inspect(f.tech, f.id)).targets[0];
  const b = await transaction((c) =>
    binding(c, f.tech, f.id, target.scope_item_id, target.asset_id),
  );
  const id = randomUUID();
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
      observations: "SYN factual observation",
      immediate_response: "Reported without intervention",
      source_reference: "SYN observation",
      restricted_details: "RESTRICTED-FINDINGS-CANARY",
    },
  });
  async function send(action: string, fields: Record<string, unknown> = {}) {
    return incidentCommand(f.co, {
      ...base(),
      id,
      action,
      expected_version: (await incidentRead(f.co, id)).row.version,
      ...fields,
    });
  }
  await incidentCommand(f.tech, {
    ...base(),
    id,
    action: "submit",
    expected_version: (await incidentRead(f.tech, id)).row.version,
  });
  await send("triage", {
    owner_id: f.tech.actor_id,
    due_at: "2031-11-10T00:00:00Z",
    priority: "Routine",
    assessment: "Assessed",
    hold: true,
  });
  const actionId = randomUUID();
  await send("action", {
    action_id: actionId,
    owner_id: f.tech.actor_id,
    due_at: "2031-11-10T00:00:00Z",
    instruction: "SYN check and retain corrective evidence",
  });
  const row = (await readFinding(f.second, `incident:${actionId}`)).item;
  assert.equal(row.what_remains, "SYN check and retain corrective evidence");
  assert.doesNotMatch(
    JSON.stringify(row),
    /CANARY|restricted_details|source_hash/,
  );
  assert.equal(row.source_record.href, `/service/incidents/${id}`);
  const task = await readActivity(f.tech, row.action!.id);
  await activityCommand(
    f.tech,
    task.id,
    {
      ...base(),
      expected_version: task.version,
      outcome: "SYN action performed; closure still independent",
    },
    "complete",
  );
  assert.equal(
    (await readFinding(f.co, row.id)).item.state,
    "FollowUpCompleted",
  );
  await database().query(
    "UPDATE ppo.permission_grants SET valid_to=clock_timestamp() WHERE user_id=$1 AND capability='incident.read'",
    [f.second.actor_id],
  );
  assert.equal((await readFindings(f.second, { source: "incident" })).total, 0);
  await assert.rejects(readFinding(f.second, row.id), denied);
});
