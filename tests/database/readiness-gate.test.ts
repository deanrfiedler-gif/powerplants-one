import assert from "node:assert/strict";
import { beforeEach, after, test } from "node:test";
import { randomUUID } from "node:crypto";
import {
  database,
  closeDatabase,
  transaction,
} from "../../src/platform/database";
import { localConfig } from "../../src/platform/config";
import { reset } from "../../scripts/database";
import {
  acknowledgePack,
  answerReturn,
  checkPack,
  dispatchReadiness,
  listPacks,
  readPack,
  returnPack,
  revisePack,
} from "../../src/documents/packs";
import { readWorkOrder } from "../../src/service/work-orders";
import { readFieldJob } from "../../src/field/reads";
import { startAttendance } from "../../src/field/start";
import { saveRecord, allocate } from "../../src/supply/commands";
import { workspace } from "../../src/supply/reads";
import { base, principal, rows, content, issued, prepared } from "../helpers/packs";
import { startInput } from "../helpers/field";
import { supplyInput, supplyBase } from "../helpers/supply";
import {
  v2Issued,
  noPartsNeeded,
  recipientFields,
  gateEvidence,
} from "../helpers/readiness-gate";
import type { Principal } from "../../src/platform/identity";

// Field readiness gate (PPO-SVC-FIELD-READINESS-GATE-PROP, accepted in PPO-UXB-DEC-01 decision 4):
// P1 Parts criterion, P2 technician Return, P3 checker Return task, R1 to R11.
if (localConfig().database_name !== "ppo_synthetic_test")
  throw Error("Use the disposable test database.");
process.env.PPO_ALLOW_RESET = "dispose-synthetic";
process.env.PPO_RESET_DATABASE = "ppo_synthetic_test";
beforeEach(reset);
after(closeDatabase);
const code = (value: string) => (e: unknown) =>
  (e as { code: string }).code === value;
const note =
  "SYN section 04 lists an SD-450 drive, but the nameplate I photographed on 2 Oct reads SD-450B.";
const returnInput = (
  pack: Parameters<typeof recipientFields>[0],
  p: Principal,
  reason_codes = ["PartsIncorrect"],
) => ({ ...recipientFields(pack, p), reason_codes, note });
const appointment = async (id: string) =>
  (await rows("SELECT * FROM ppo.appointments WHERE id=$1", [id]))[0];

test("P2 technician Return holds dispatch, tasks the preparer and service owner, and waits for an answer before acknowledgement", async () => {
  const q = await issued(),
    tech = await principal("assigned-technician"),
    other = await principal("second-technician"),
    pack = (await readPack(q.p, q.pack.id)).items[0];
  const input = returnInput(pack, tech);
  const accepted = await returnPack(tech, q.issue_id, input);
  assert.equal(accepted.receipt.state, "Returned");
  const replay = await returnPack(tech, q.issue_id, input);
  assert.equal(replay.replayed, true);
  assert.deepEqual(replay.receipt, accepted.receipt);

  const [returned] = await rows("SELECT * FROM ppo.pack_returns");
  assert.deepEqual(returned.reason_codes, ["PartsIncorrect"]);
  assert.equal(returned.actor_id, tech.actor_id);
  assert.equal(returned.note, note);
  const event = (
    await rows("SELECT * FROM ppo.pack_issue_events WHERE id=$1", [
      returned.issue_event_id,
    ])
  )[0];
  assert.equal(event.kind, "Returned");
  assert.equal(event.issue_id, q.issue_id);
  const visit = await appointment(pack.appointment_id);
  assert.equal(visit.dispatch_hold, true);
  assert.equal(visit.pack_requirement, "ReviewRequired");

  // The preparer's task, due by 09:00 site time on the visit day or two hours before the start (Q4).
  const [preparer] = await rows(
    "SELECT a.*,least(((v.start_at AT TIME ZONE v.site_timezone)::date+time '09:00') AT TIME ZONE v.site_timezone,v.start_at-interval '2 hours') AS expected_due FROM ppo.pack_return_follow_ups f JOIN ppo.activities a ON a.id=f.activity_id JOIN ppo.appointments v ON v.id=$1",
    [pack.appointment_id],
  );
  assert.equal(preparer.kind, "TechnicalFollowUp");
  assert.equal(preparer.owner_id, q.p.actor_id);
  assert.equal(preparer.status, "Open");
  assert.equal(preparer.due_needed, false);
  assert.equal(preparer.due_at.getTime(), preparer.expected_due.getTime());
  assert.match(
    preparer.summary,
    /^Revise job pack SYN-PPO-PACK-\d+ · r01 returned by .+: parts incorrect\. Note: SYN section 04/,
  );
  // The scheduler's at-risk task is the work order's service owner's (Q3).
  const [scheduler] = await rows(
    "SELECT a.*,w.service_owner_id FROM ppo.pack_follow_ups f JOIN ppo.activities a ON a.id=f.activity_id JOIN ppo.appointments v ON v.id=$2 JOIN ppo.work_orders w ON w.id=v.work_order_id WHERE f.issue_event_id=$1",
    [event.id, pack.appointment_id],
  );
  assert.equal(scheduler.kind, "CustomerContact");
  assert.equal(scheduler.owner_id, scheduler.service_owner_id);
  assert.match(scheduler.summary, /returned by the crew: appointment .+ is at risk/);
  assert.equal(
    (await rows("SELECT kind FROM ppo.outbox_jobs WHERE kind='PackIssueReturned'")).length,
    1,
  );

  const read = (await readPack(q.p, q.pack.id)).items[0];
  assert.equal(read.returns.length, 1);
  assert.deepEqual(read.returns[0].reason_codes, ["PartsIncorrect"]);
  assert.ok(
    read.readiness.reasons.some((r: string) =>
      /returned this issue: parts incorrect/.test(r),
    ),
  );
  assert.ok(read.follow_ups.some((f: { activity_id: string }) => f.activity_id === preparer.id));
  assert.equal(
    (await listPacks(q.p)).items.find((r) => r.id === q.pack.id)?.returned,
    1,
  );
  // The technician sees their own return on the current issue.
  const own = (await readPack(tech, q.pack.id)).items[0];
  assert.equal(own.returns.length, 1);

  // One of acknowledge or return: no acknowledgement while the return is unanswered, and no second return.
  await assert.rejects(
    acknowledgePack(tech, q.issue_id, recipientFields(pack, tech)),
    code("IssueReturned"),
  );
  await assert.rejects(
    returnPack(tech, q.issue_id, { ...input, ...base() }),
    code("IssueReturned"),
  );
  await assert.rejects(
    database().query(
      "INSERT INTO ppo.pack_acknowledgements(id,workspace_id,recipient_id,actor_id,operation_id,presented_hash,captured_at) VALUES($1,$2,$3,$4,$5,$6,clock_timestamp())",
      [
        randomUUID(),
        tech.workspace_id,
        returned.recipient_id,
        tech.actor_id,
        randomUUID(),
        returned.presented_hash,
      ],
    ),
    /after the preparer answers the return/,
  );
  // Another crew member still acknowledges the same issue.
  await acknowledgePack(other, q.issue_id, recipientFields(pack, other));
  // Only someone who can prepare the pack answers a return.
  await assert.rejects(
    answerReturn(tech, returned.id, { ...base(), note: "SYN no change" }),
  );

  // Q2: "No change needed" with a reason the technician sees.
  await answerReturn(q.p, returned.id, {
    ...base(),
    note: "SYN the reserved SD-450 is correct; the B suffix names the gearbox.",
  });
  const [answered] = await rows("SELECT * FROM ppo.activities WHERE id=$1", [
    preparer.id,
  ]);
  assert.equal(answered.status, "Completed");
  assert.match(answered.outcome, /^No change needed: SYN the reserved SD-450/);
  const held = await appointment(pack.appointment_id);
  assert.equal(held.dispatch_hold, true);
  assert.equal(held.pack_requirement, "AwaitingAcknowledgement");
  await assert.rejects(
    answerReturn(q.p, returned.id, { ...base(), note: "SYN again" }),
    code("ReturnAnswered"),
  );
  const seen = (await readPack(tech, q.pack.id)).items[0];
  assert.match(seen.returns[0].answer, /B suffix names the gearbox/);

  // The technician now acknowledges the same issue, and dispatch clears (policy v1: no parts criterion).
  await acknowledgePack(tech, q.issue_id, recipientFields(pack, tech));
  const ready = await transaction((c) =>
    dispatchReadiness(c, q.p, pack.appointment_id),
  );
  assert.deepEqual(ready.reasons, []);
  assert.equal(ready.parts, null);
  assert.equal((await appointment(pack.appointment_id)).dispatch_hold, false);
});

test("P2 a recipient who acknowledged cannot return, and a successor revision completes the return tasks (R6)", async () => {
  const q = await issued(),
    tech = await principal("assigned-technician"),
    other = await principal("second-technician"),
    pack = (await readPack(q.p, q.pack.id)).items[0];
  await acknowledgePack(tech, q.issue_id, recipientFields(pack, tech));
  await assert.rejects(
    returnPack(tech, q.issue_id, returnInput(pack, tech)),
    code("IssueAcknowledged"),
  );
  await assert.rejects(
    returnPack(other, q.issue_id, {
      ...returnInput(pack, other),
      reason_codes: ["PartsMissing", "PartsMissing"],
    }),
    code("InvalidData"),
  );
  await assert.rejects(
    returnPack(other, q.issue_id, {
      ...returnInput(pack, other),
      reason_codes: [],
    }),
    code("InvalidData"),
  );
  await returnPack(
    other,
    q.issue_id,
    returnInput(pack, other, ["PartsMissing", "SiteNotConfirmed"]),
  );
  const [returned] = await rows("SELECT * FROM ppo.pack_returns");
  const current = (await readPack(q.p, q.pack.id)).items[0];
  await revisePack(q.p, q.pack.id, {
    ...base(),
    reason: "SYN corrected the drive to SD-450B",
    expected_version: current.version,
    content: content(),
  });
  const tasks = await rows(
    "SELECT a.status,a.outcome FROM ppo.activities a WHERE a.id IN (SELECT activity_id FROM ppo.pack_return_follow_ups UNION SELECT f.activity_id FROM ppo.pack_follow_ups f JOIN ppo.pack_issue_events e ON e.id=f.issue_event_id WHERE e.kind='Returned')",
  );
  assert.equal(tasks.length, 2);
  for (const t of tasks) {
    assert.equal(t.status, "Completed");
    assert.equal(t.outcome, "Successor revision r02 saved: SYN corrected the drive to SD-450B");
  }
  await assert.rejects(
    answerReturn(q.p, returned.id, { ...base(), note: "SYN too late" }),
    code("IssueNotApplicable"),
  );
});

test("P3 a checker Return tasks the preparer and the successor revision completes it", async () => {
  const p = await principal(),
    pack = await prepared();
  await checkPack(p, pack.id, {
    ...base(),
    expected_version: pack.version,
    decision: "Returned",
    reason: "SYN section 07 does not say who collects the tester from the workshop.",
  });
  const [task] = await rows(
    "SELECT a.*,f.check_id FROM ppo.pack_check_follow_ups f JOIN ppo.activities a ON a.id=f.activity_id",
  );
  assert.equal(task.kind, "TechnicalFollowUp");
  assert.equal(task.owner_id, p.actor_id);
  assert.equal(task.due_needed, true);
  assert.equal(task.due_at, null);
  assert.match(
    task.summary,
    /^Revise job pack SYN-PPO-PACK-\d+ · r01 returned at the check: SYN section 07/,
  );
  const returned = (await readPack(p, pack.id)).items[0];
  assert.ok(returned.follow_ups.some((f: { activity_id: string }) => f.activity_id === task.id));
  await revisePack(p, pack.id, {
    ...base(),
    reason: "SYN named the collector",
    expected_version: returned.version,
    content: content(),
  });
  const [done] = await rows("SELECT status,outcome FROM ppo.activities WHERE id=$1", [task.id]);
  assert.equal(done.status, "Completed");
  assert.equal(done.outcome, "Successor revision r02 saved: SYN named the collector");
});

test("P1 a v2 visit holds dispatch until parts are ready, excepted or recorded as not needed", async () => {
  const v = await v2Issued(),
    tech = await principal("assigned-technician"),
    other = await principal("second-technician");
  assert.equal(
    (await rows("SELECT policy_version_id FROM ppo.appointments WHERE id=$1", [v.aid]))[0]
      .policy_version_id,
    "94000000-0000-4000-8000-000000000002",
  );
  const visit = (await readWorkOrder(v.co, v.wid)).items[0].visits.find(
    (x: { id: string }) => x.id === v.aid,
  );
  const parts = visit.readiness.find(
    (x: { criterion_code: string }) => x.criterion_code === "PartsReadiness",
  );
  assert.equal(parts.blocking_stage, "Dispatch");
  assert.equal(parts.outcome, "Unknown");
  assert.deepEqual(parts.parts.lines, []);
  // Nobody records a pass, in the service or the database.
  const w = (await readWorkOrder(v.co, v.wid)).items[0];
  await assert.rejects(
    (await import("../../src/service/work-orders")).assessWorkReadiness(v.co, v.wid, {
      ...base(),
      expected_version: w.version,
      assessment: {
        scope_revision_id: v.scope.id,
        scope_version: v.scope.version,
        appointment_id: v.aid,
        criterion_code: "PartsReadiness",
        outcome: "Pass",
        reason: "SYN parts look fine",
        evidence: gateEvidence,
        source_as_at: "2026-09-05T00:00:00Z",
      },
    }),
    code("InvalidData"),
  );
  await assert.rejects(
    database().query(
      "INSERT INTO ppo.readiness_assessments(id,workspace_id,scope_revision_id,scope_version,appointment_id,criterion_code,policy_version_id,assessment_version,outcome,blocking_stage,exception_allowed,evidence_ref,assessed_by,reason,source_as_at) SELECT $1,a.workspace_id,a.scope_revision_id,a.scope_version,a.id,'PartsReadiness',a.policy_version_id,99,'Pass','Dispatch',true,(SELECT id FROM ppo.document_references WHERE work_order_id=a.work_order_id LIMIT 1),$3,'SYN forged pass',clock_timestamp() FROM ppo.appointments a WHERE a.id=$2",
      [randomUUID(), v.aid, v.co.actor_id],
    ),
    /never recorded as a pass/,
  );
  // Both technicians acknowledge; dispatch stays held on Parts alone.
  for (const p of [tech, other])
    await acknowledgePack(p, v.pack.current_issue_id!, recipientFields(v.pack, p));
  let ready = await transaction((c) => dispatchReadiness(c, v.co, v.aid));
  assert.equal(ready.dispatch_hold, true);
  assert.deepEqual(ready.reasons, [
    "Parts ready for the stated material scope: Unknown. No parts demand is linked to this visit, and no “No parts needed” statement is recorded.",
  ]);
  assert.equal((await appointment(v.aid)).dispatch_hold, true);
  // The database backstop refuses clearing the hold directly.
  await assert.rejects(
    database().query(
      "UPDATE ppo.appointments SET dispatch_hold=false,pack_requirement='Acknowledged',version=version+1 WHERE id=$1",
      [v.aid],
    ),
    /Parts ready for the stated material scope/,
  );
  // The preparer's "No parts needed for this visit" (R1) satisfies it, and the visit starts.
  await noPartsNeeded(v.co, v.wid, v.aid);
  ready = await transaction((c) => dispatchReadiness(c, v.co, v.aid));
  assert.deepEqual(ready.reasons, []);
  assert.equal(ready.parts?.outcome, "NotApplicable");
  const job = (await readFieldJob(tech, v.aid)).items[0];
  await startAttendance(tech, v.aid, startInput(job));
  assert.equal((await appointment(v.aid)).status, "InProgress");
});

test("P1 Supply readiness of linked demands decides Parts; a later supply change holds dispatch again (R2, Q7)", async () => {
  const v = await v2Issued(),
    tech = await principal("assigned-technician"),
    other = await principal("second-technician");
  await noPartsNeeded(v.co, v.wid, v.aid);
  for (const p of [tech, other])
    await acknowledgePack(p, v.pack.current_issue_id!, recipientFields(v.pack, p));
  assert.equal((await appointment(v.aid)).dispatch_hold, false);
  const before = await rows("SELECT id FROM ppo.activities");

  // A demand linked to the visit after dispatch cleared: not yet allocated, so Evidence needed.
  const demand = supplyInput("Demand", {
    title: "SYN SD-450B drive motor",
    item: "SYN-SD-450B",
    quantity: "1",
    data: {
      ...supplyInput().data,
      origin_kind: "WorkOrder",
      origin_id: v.wid,
      appointment_id: v.aid,
    },
  });
  await saveRecord(v.co, demand);
  const held = await appointment(v.aid);
  assert.equal(held.dispatch_hold, true);
  const added = (await rows("SELECT * FROM ppo.activities")).filter(
    (a) => !before.some((b) => b.id === a.id),
  );
  const rehold = added.find((a) => /parts readiness changed after dispatch was cleared/.test(a.summary));
  assert.ok(rehold);
  assert.equal(rehold.kind, "CustomerContact");
  assert.equal(rehold.owner_id, v.co.actor_id);
  // The booking never moves.
  assert.equal(held.start_at.getTime(), Date.parse("2031-12-05T00:00:00Z"));
  // A linked demand outranks "No parts needed", which can no longer be recorded.
  let ready = await transaction((c) => dispatchReadiness(c, v.co, v.aid));
  assert.equal(ready.parts?.outcome, "Unknown");
  assert.equal(ready.parts?.lines[0].state, "Evidence needed");
  await assert.rejects(noPartsNeeded(v.co, v.wid, v.aid), code("InvalidData"));

  // Usable stock allocated: Ready for the stated material scope, so Parts passes.
  const stock = supplyInput("Supply", { item: "SYN-SD-450B", quantity: "1" });
  await saveRecord(v.co, stock);
  const d = (await workspace(v.co, demand.id)).record,
    s = (await workspace(v.co, stock.id)).record;
  await allocate(v.co, {
    ...supplyBase(),
    id: randomUUID(),
    expected_version: null,
    demand_id: d.id,
    supply_id: s.id,
    demand_version: d.version,
    supply_version: s.version,
    quantity: "1",
    unit: d.unit,
    basis: "Usable",
  });
  ready = await transaction((c) => dispatchReadiness(c, v.co, v.aid));
  assert.equal(ready.parts?.outcome, "Pass");
  assert.deepEqual(ready.reasons, []);
  // Technicians read the line state without supply permissions or costs.
  const seen = (await readPack(tech, v.pid)).items[0].readiness.parts;
  assert.deepEqual(Object.keys(seen.lines[0]).sort(), [
    "id", "item", "promised_on", "quantity", "reference", "required_on", "shortage", "state", "title", "unit",
  ]);
  assert.equal(seen.lines[0].state, "Ready for the stated material scope");

  // Q7: a demand on the work order with no visit keeps Parts Unknown until it is linked.
  await saveRecord(
    v.co,
    supplyInput("Demand", {
      data: {
        ...supplyInput().data,
        origin_kind: "WorkOrder",
        origin_id: v.wid,
      },
    }),
  );
  ready = await transaction((c) => dispatchReadiness(c, v.co, v.aid));
  assert.equal(ready.parts?.outcome, "Unknown");
  assert.match(ready.reasons[0], /on the work order but not linked to this visit/);
  // A permitted exception (Q1) holds whatever the lines say.
  await noPartsNeeded(v.co, v.wid, v.aid, "PermittedException");
  ready = await transaction((c) => dispatchReadiness(c, v.co, v.aid));
  assert.equal(ready.parts?.outcome, "PermittedException");
  assert.deepEqual(ready.reasons, []);
});
