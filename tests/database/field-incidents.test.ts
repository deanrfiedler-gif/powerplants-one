import assert from "node:assert/strict";
import { beforeEach, after, test } from "node:test";
import { randomUUID } from "node:crypto";
import { reset } from "../../scripts/database";
import {
  database,
  transaction,
  closeDatabase,
} from "../../src/platform/database";
import { localConfig } from "../../src/platform/config";
import {
  inspectionFixture,
  inspect,
  openInspection,
  saveInspection,
  base,
  principal,
  rows,
} from "../helpers/service-inspections";
import {
  incidentCommand,
  incidentRead,
  fileBytes,
} from "../../src/incidents/service";
import { binding } from "../../src/incidents/context";
import { incidentHolds } from "../../src/incidents/holds";
import { inspectionCommand } from "../../src/inspections/service-commands";
import {
  dispatchReadiness,
  readPack,
  withdrawPack,
} from "../../src/documents/packs";
import { activityCommand, readActivity } from "../../src/activities/activities";
import { readOperation } from "../../src/shared/receipts";
import { digest } from "../../src/documents/store";
import { readBundle } from "../../src/engineering/commissioning/outputs";
import { rename } from "node:fs/promises";
import { join } from "node:path";
import { homedir } from "node:os";
if (localConfig().database_name !== "ppo_synthetic_test")
  throw Error("Use only ppo_synthetic_test");
process.env.PPO_ALLOW_RESET = "dispose-synthetic";
process.env.PPO_RESET_DATABASE = "ppo_synthetic_test";
beforeEach(reset);
after(closeDatabase);
const code = (code: string) => (e: unknown) =>
  (e as { code: string }).code === code;
type P = Awaited<ReturnType<typeof principal>>;
async function create(
  f: Awaited<ReturnType<typeof inspectionFixture>>,
  p = f.tech,
) {
  const t = (await inspect(p, f.id)).targets[0],
    b = await transaction((c) =>
      binding(c, p, f.id, t.scope_item_id, t.asset_id),
    );
  const cmd = {
    ...base(),
    id: randomUUID(),
    action: "create",
    appointment_id: f.id,
    scope_item_id: t.scope_item_id,
    asset_id: t.asset_id,
    source_hash: b.source_hash,
    facts: {
      classification: "Incident",
      occurred_at: new Date().toISOString(),
      summary: "SYN observed leak",
      observations: "Original factual observation",
      immediate_response:
        "Reported the observed condition; no equipment control performed",
      source_reference: "SYN source note",
      restricted_details: "INCIDENT-RESTRICTED-CANARY",
    },
  };
  await incidentCommand(p, cmd);
  return { id: cmd.id, original: cmd, t };
}
async function send(
  p: P,
  id: string,
  action: string,
  fields: Record<string, unknown> = {},
) {
  const v = await incidentRead(p, id);
  return incidentCommand(p, {
    ...base(),
    id,
    action,
    expected_version: v.row.version,
    ...fields,
  });
}
async function evidence(
  p: P,
  id: string,
  action_id: string | null,
  audience = "Operational",
  text = "SYN corrective evidence",
) {
  const bytes = Buffer.from(text),
    eid = randomUUID();
  await send(p, id, "evidence", {
    evidence_id: eid,
    action_id,
    audience,
    label:
      audience === "Restricted"
        ? "PRIVATE-EVIDENCE-CANARY"
        : "SYN retained correction",
    media_type: "text/plain",
    byte_count: bytes.length,
    sha256: digest(bytes),
    content_base64: bytes.toString("base64"),
  });
  return eid;
}
test("FI06 complete persisted incident, independent passing inspection hold, Activity separation, exact outcome and reopening", async () => {
  const f = await inspectionFixture(),
    attempt = await openInspection(f, f.tech, 1),
    a = await saveInspection(f, attempt, "210");
  await inspectionCommand(
    f.tech,
    f.id,
    {
      ...base(),
      action: "submit",
      attempt_id: attempt,
      expected_version: a.row.version,
    },
    "capture",
  );
  await inspectionCommand(
    f.co,
    f.id,
    {
      ...base(),
      action: "review",
      id: randomUUID(),
      attempt_id: attempt,
      decision: "Accepted",
      decision_reason: "Independently accepted exact passing inspection",
      owner_id: f.tech.actor_id,
      due: "2031-11-10",
    },
    "review",
  );
  const q = await create(f);
  assert.equal((await incidentRead(f.tech, q.id)).row.state, "Draft");
  const submit = { ...base(), id: q.id, action: "submit", expected_version: 1 };
  const [one, two] = await Promise.all([
    incidentCommand(f.tech, submit),
    incidentCommand(f.tech, submit),
  ]);
  assert.deepEqual(one.receipt, two.receipt);
  assert.deepEqual(
    await readOperation(f.tech, submit.operation_id),
    one.receipt,
  );
  assert.equal(
    (await inspect(f.co, f.id, "review")).attempts.find(
      (a) => a.row.id === attempt,
    )?.review,
    "Accepted",
  );
  assert.equal(
    (await transaction((c) => incidentHolds(c, f.tech, f.id))).length,
    1,
  );
  await assert.rejects(
    inspectionCommand(
      f.co,
      f.id,
      {
        ...base(),
        action: "release",
        id: randomUUID(),
        attempt_id: attempt,
        decision_reason: "Passing evidence cannot clear independent incident",
      },
      "review",
    ),
    code("IncidentHold"),
  );
  const activeBefore = await rows(
    "SELECT * FROM ppo.field_attendances WHERE appointment_id=$1 ORDER BY id",
    [f.id],
  );
  await send(f.co, q.id, "triage", {
    owner_id: f.tech.actor_id,
    due_at: "2031-11-10T00:00:00Z",
    priority: "Routine",
    assessment: "Assessed",
    hold: true,
  });
  const action = randomUUID();
  const createAction = {
    ...base(),
    id: q.id,
    action: "action",
    expected_version: (await incidentRead(f.co, q.id)).row.version,
    action_id: action,
    owner_id: f.tech.actor_id,
    due_at: "2031-11-10T00:00:00Z",
    instruction:
      "SYN inspect the recorded leak and append factual correction evidence",
  };
  const actionResults = await Promise.all([
    incidentCommand(f.co, createAction),
    incidentCommand(f.co, createAction),
  ]);
  assert.deepEqual(actionResults[0].receipt, actionResults[1].receipt);
  assert.equal((await incidentRead(f.co, q.id)).actions.length, 1);
  assert.deepEqual(
    await readOperation(f.co, createAction.operation_id),
    actionResults[0].receipt,
  );
  const privateEvidence = await evidence(
    f.tech,
    q.id,
    null,
    "Restricted",
    "PRIVATE-BYTES-CANARY",
  );
  let v = await incidentRead(f.second, q.id);
  assert.doesNotMatch(JSON.stringify(v), /CANARY/);
  const task = await readActivity(f.tech, v.actions[0].activity_id);
  assert.doesNotMatch(JSON.stringify(task), /CANARY|Original factual/);
  assert.equal(task.incident_source?.id, q.id);
  await activityCommand(
    f.tech,
    task.id,
    {
      ...base(),
      expected_version: task.version,
      outcome: "SYN action performed; incident still needs review",
    },
    "complete",
  );
  assert.notEqual((await incidentRead(f.co, q.id)).row.state, "Closed");
  assert.equal(
    (await transaction((c) => incidentHolds(c, f.tech, f.id))).length,
    1,
  );
  await assert.rejects(send(f.co, q.id, "accept"), code("ActionsIncomplete"));
  await send(f.co, q.id, "review", { decision: "Returned" });
  v = await incidentRead(f.tech, q.id);
  await send(f.tech, q.id, "save", {
    facts: {
      ...v.row.facts,
      observations: "Corrected observation; original retained",
    },
    reason: "SYN clarifying correction; preserve original",
  });
  const eid = await evidence(f.tech, q.id, action);
  await send(f.co, q.id, "accept_action", {
    action_id: action,
    evidence_id: eid,
  });
  // A separate procedure's failures and withdrawn Job Pack are independent
  // receiving blockers. Incident closure must preserve both exact histories.
  const otherAttempt = await openInspection(f, f.second, 0);
  const otherSaved = await saveInspection(f, otherAttempt, "120", f.second);
  await inspectionCommand(
    f.second,
    f.id,
    {
      ...base(),
      action: "submit",
      attempt_id: otherAttempt,
      expected_version: otherSaved.row.version,
    },
    "capture",
  );
  const otherDefects = await rows(
    "SELECT * FROM ppo.inspection_defects WHERE source_attempt_id=$1 ORDER BY id",
    [otherAttempt],
  );
  assert.ok(otherDefects.some((d) => d.state !== "Closed"));
  const pack = (await readPack(f.co, f.q.pack.id)).items[0];
  await withdrawPack(f.co, pack.id, {
    ...base(),
    expected_version: pack.version,
  });
  const remainingReadiness = (
    await transaction((c) => dispatchReadiness(c, f.tech, f.id, true))
  ).reasons.filter((x) => !x.startsWith("Incident scope hold"));
  assert.ok(remainingReadiness.some((x) => x.includes("issued pack")));
  const rebound = await transaction((c) =>
    binding(c, f.co, f.id, q.t.scope_item_id, q.t.asset_id),
  );
  await send(f.co, q.id, "rebind", {
    scope_item_id: q.t.scope_item_id,
    asset_id: q.t.asset_id,
    source_hash: rebound.source_hash,
  });
  await send(f.co, q.id, "accept");
  await send(f.co, q.id, "close");
  assert.deepEqual(
    await rows(
      "SELECT * FROM ppo.inspection_defects WHERE source_attempt_id=$1 ORDER BY id",
      [otherAttempt],
    ),
    otherDefects,
  );
  assert.deepEqual(
    (await transaction((c) => dispatchReadiness(c, f.tech, f.id, true)))
      .reasons,
    remainingReadiness,
  );
  v = await incidentRead(f.co, q.id);
  assert.equal(v.row.state, "Closed");
  assert.equal(v.outputs.length, 1);
  const bytes = await readBundle(f.co, v.outputs[0].bundle);
  assert.doesNotMatch(bytes.html, /CANARY/);
  assert.match(bytes.html, /Synthetic prototype/);
  assert.equal(
    (await transaction((c) => incidentHolds(c, f.tech, f.id))).length,
    0,
  );
  assert.equal(
    (await rows("SELECT status FROM ppo.appointments WHERE id=$1", [f.id]))[0]
      .status,
    "InProgress",
  );
  assert.deepEqual(
    await rows(
      "SELECT * FROM ppo.field_attendances WHERE appointment_id=$1 ORDER BY id",
      [f.id],
    ),
    activeBefore,
  );
  assert.equal(
    (
      await fileBytes(
        f.tech,
        (await incidentRead(f.tech, q.id)).evidence.find(
          (e) => e.id === privateEvidence,
        )!,
      )
    ).toString(),
    "PRIVATE-BYTES-CANARY",
  );
  const retainedPath = join(
    process.env.PPO_DOCUMENT_DIRECTORY ??
      join(homedir(), ".ppo-synthetic-documents"),
    f.co.workspace_id,
    privateEvidence,
  );
  await rename(retainedPath, retainedPath + ".retained");
  try {
    assert.equal((await incidentRead(f.second, q.id)).operational_hold, true);
    assert.equal((await incidentRead(f.co, q.id)).outputs[0].current, false);
    assert.equal(
      (await transaction((c) => incidentHolds(c, f.second, f.id))).length,
      1,
    );
    assert.deepEqual(await readBundle(f.co, v.outputs[0].bundle), bytes);
  } finally {
    await rename(retainedPath + ".retained", retainedPath);
  }
  assert.equal((await incidentRead(f.co, q.id)).operational_hold, false);
  await send(f.co, q.id, "reopen");
  assert.equal(
    (await transaction((c) => incidentHolds(c, f.tech, f.id))).length,
    1,
  );
  const reopened = await incidentRead(f.co, q.id);
  assert.equal(reopened.outputs[0].current, false);
  await database().query(
    "UPDATE ppo.permission_grants SET valid_to=clock_timestamp() WHERE user_id=$1 AND capability='incident.read'",
    [f.second.actor_id],
  );
  assert.equal((await readActivity(f.second, task.id)).incident_source, null);
  assert.deepEqual(await readBundle(f.co, reopened.outputs[0].bundle), bytes);
  assert.match(JSON.stringify(reopened.events), /Original factual observation/);
  assert.match(JSON.stringify(reopened.events), /Corrected observation/);
  const ready = await transaction((c) =>
    dispatchReadiness(c, f.tech, f.id, true),
  );
  assert.equal(ready.component_ready, false);
  assert.ok(ready.incident_holds.length);
});
test("FI06 current authority, two reporters, separate repeated records, stale saves, unknown assessment and restricted receipt recovery", async () => {
  const f = await inspectionFixture(),
    a = await create(f),
    b = await create(f, f.second);
  assert.notEqual(a.id, b.id);
  await assert.rejects(incidentRead(f.second, a.id), code("RecordUnavailable"));
  await send(f.tech, a.id, "submit");
  await send(f.second, b.id, "submit");
  await send(f.co, b.id, "link", { repeated_report_id: a.id, defect_id: null });
  assert.equal(
    (await transaction((c) => incidentHolds(c, f.tech, f.id))).length,
    2,
  );
  await assert.rejects(
    incidentRead(await principal("second-company"), a.id),
    code("Forbidden"),
  );
  const old = await incidentRead(f.tech, a.id),
    save = {
      ...base(),
      id: a.id,
      action: "save",
      expected_version: old.row.version,
      facts: { ...old.row.facts, classification: "Unknown" },
    };
  await incidentCommand(f.tech, save);
  await assert.rejects(
    incidentCommand(f.tech, { ...save, operation_id: randomUUID() }),
    code("VersionConflict"),
  );
  await assert.rejects(
    incidentCommand(f.tech, { ...save, reason: "Changed original" }),
    code("OperationConflict"),
  );
  await assert.rejects(
    send(f.tech, a.id, "triage", {
      owner_id: f.tech.actor_id,
      due_at: "2031-11-10T00:00:00Z",
      priority: "Routine",
      assessment: "Assessed",
      hold: true,
    }),
    code("Forbidden"),
  );
  await assert.rejects(send(f.co, a.id, "accept"), code("AssessmentRequired"));
  await database().query(
    "UPDATE ppo.permission_grants SET valid_to=clock_timestamp() WHERE user_id=$1 AND capability='incident.report'",
    [f.tech.actor_id],
  );
  await assert.rejects(
    readOperation(f.tech, save.operation_id),
    code("Forbidden"),
  );
  assert.equal((await incidentRead(f.tech, a.id)).duties.save, false);
  assert.doesNotMatch(
    JSON.stringify(await incidentRead(f.second, a.id)),
    /CANARY/,
  );
  await database().query(
    "UPDATE ppo.permission_grants SET valid_to=clock_timestamp() WHERE user_id=$1 AND capability='incident.sensitive'",
    [f.co.actor_id],
  );
  assert.doesNotMatch(JSON.stringify(await incidentRead(f.co, a.id)), /CANARY/);
  await assert.rejects(
    send(f.co, a.id, "review", { decision: "OnHold" }),
    code("RecordUnavailable"),
  );
  const member = (
    await rows(
      `SELECT r.user_id FROM ppo.assignments x JOIN ppo.resources r
    ON r.workspace_id=x.workspace_id AND r.id=x.resource_id
    WHERE x.appointment_id=$1 AND x.active AND x.crew_role<>'Lead'`,
      [f.id],
    )
  )[0];
  const removed = member.user_id === f.tech.actor_id ? f.tech : f.second;
  const removedRecord = removed === f.tech ? a : b;
  await incidentRead(removed, removedRecord.id);
  await transaction(async (c) => {
    await c.query(
      "UPDATE ppo.resource_reservations SET active=false WHERE assignment_id IN (SELECT x.id FROM ppo.assignments x JOIN ppo.resources r ON r.workspace_id=x.workspace_id AND r.id=x.resource_id WHERE x.appointment_id=$1 AND r.user_id=$2)",
      [f.id, removed.actor_id],
    );
    await c.query(
      "UPDATE ppo.assignments x SET active=false FROM ppo.resources r WHERE x.workspace_id=r.workspace_id AND x.resource_id=r.id AND x.appointment_id=$1 AND r.user_id=$2",
      [f.id, removed.actor_id],
    );
  });
  await assert.rejects(
    incidentRead(removed, removedRecord.id),
    code("RecordUnavailable"),
  );
  await assert.rejects(
    incidentCommand(removed, removedRecord.original),
    code(removed === f.tech ? "Forbidden" : "RecordUnavailable"),
  );
});
test("FI06 upload failure, inaccessible exact evidence, action reassignment and changed source fail closed", async () => {
  const f = await inspectionFixture(),
    q = await create(f);
  await send(f.tech, q.id, "submit");
  await send(f.co, q.id, "triage", {
    owner_id: f.tech.actor_id,
    due_at: "2031-11-10T00:00:00Z",
    priority: "Routine",
    assessment: "Assessed",
    hold: true,
  });
  const action = randomUUID();
  await send(f.co, q.id, "action", {
    action_id: action,
    owner_id: f.tech.actor_id,
    due_at: "2031-11-10T00:00:00Z",
    instruction: "SYN original corrective obligation",
  });
  const v = await incidentRead(f.tech, q.id);
  await assert.rejects(
    send(f.tech, q.id, "evidence", {
      evidence_id: randomUUID(),
      action_id: action,
      audience: "Operational",
      label: "Bad upload",
      media_type: "text/plain",
      byte_count: 3,
      sha256: "0".repeat(64),
      content_base64: "YWJj",
    }),
    code("EvidenceHashMismatch"),
  );
  assert.equal((await incidentRead(f.tech, q.id)).row.version, v.row.version);
  const eid = await evidence(f.tech, q.id, action),
    task = await readActivity(f.co, v.actions[0].activity_id);
  await activityCommand(
    f.co,
    task.id,
    {
      ...base(),
      expected_version: task.version,
      owner_id: f.second.actor_id,
      summary: task.summary,
      due_at: "2031-11-11T00:00:00Z",
      due_needed: false,
    },
    "update",
  );
  const task2 = await readActivity(f.second, task.id);
  await activityCommand(
    f.second,
    task.id,
    {
      ...base(),
      expected_version: task2.version,
      outcome: "SYN done after reassignment",
    },
    "complete",
  );
  await assert.rejects(
    send(f.co, q.id, "accept_action", { action_id: action, evidence_id: eid }),
    code("ActionIncomplete"),
  );
  const task3 = await readActivity(f.co, task.id);
  await send(f.co, q.id, "adopt_assignment", {
    action_id: action,
    activity_version: task3.version,
  });
  const final = await evidence(f.second, q.id, action);
  const root =
      process.env.PPO_DOCUMENT_DIRECTORY ??
      join(homedir(), ".ppo-synthetic-documents"),
    path = join(root, f.co.workspace_id, final);
  await rename(path, path + ".retained");
  try {
    await assert.rejects(
      send(f.co, q.id, "accept_action", {
        action_id: action,
        evidence_id: final,
      }),
      code("ExactDocumentUnavailable"),
    );
  } finally {
    await rename(path + ".retained", path);
  }
  await send(f.co, q.id, "accept_action", {
    action_id: action,
    evidence_id: final,
  });
  await database().query(
    "UPDATE ppo.assets SET version=version+1 WHERE id=$1",
    [q.t.asset_id],
  );
  await assert.rejects(send(f.co, q.id, "accept"), code("SourceChanged"));
  assert.equal((await incidentRead(f.co, q.id)).source_current, false);
  assert.equal(
    (await transaction((c) => incidentHolds(c, f.tech, f.id))).length,
    1,
  );
});
import { acknowledged, startInput, entry } from "../helpers/field";
import { operation } from "../helpers/offline";
import { syncBatch } from "../../src/offline/server";
import { readFieldJob } from "../../src/field/reads";
import { startAttendance } from "../../src/field/start";

test("FI06 factual reporting before Start and delayed existing offline Start/capture revalidate a newer hold", async () => {
  const fixture = await acknowledged(),
    tech = await principal("assigned-technician"),
    second = await principal("second-technician"),
    id = fixture.pack.appointment_id;
  const before = (await readFieldJob(second, id)).items[0];
  const own = (await readFieldJob(tech, id)).items[0];
  await startAttendance(tech, id, startInput(own));
  const afterStart = (await readFieldJob(second, id)).items[0],
    delayed = operation(second, afterStart, "Start", startInput(afterStart));
  const active = (await readFieldJob(tech, id)).items[0],
    capture = operation(tech, active, "Capture", entry(active));
  const t = before.scope.items[0],
    asset = t.assets[0].id,
    b = await transaction((c) => binding(c, second, id, t.id, asset));
  const incident = randomUUID();
  await incidentCommand(second, {
    ...base(),
    id: incident,
    action: "create",
    appointment_id: id,
    scope_item_id: t.id,
    asset_id: asset,
    source_hash: b.source_hash,
    facts: {
      classification: "Unknown",
      occurred_at: new Date().toISOString(),
      summary: "SYN reported before work",
      observations: "Unassessed occurrence",
      immediate_response: "Factual report only",
      source_reference: "SYN external observation",
      restricted_details: null,
    },
  });
  await send(second, incident, "submit");
  const replay = await syncBatch(second, { operations: [delayed] });
  assert.notEqual(replay.outcomes[0].state, "ServerSaved");
  assert.match(JSON.stringify(replay), /StartBlocked/);
  const retained = await syncBatch(tech, { operations: [capture] });
  assert.equal(retained.outcomes[0].state, "ReviewRequired");
  assert.equal(retained.outcomes[0].code, "AuthorityReviewRequired");
  assert.ok(retained.outcomes[0].receipt);
  assert.equal(
    (
      await rows("SELECT authority_state FROM ppo.field_entries WHERE id=$1", [
        capture.payload.id,
      ])
    )[0].authority_state,
    "ReviewRequired",
  );
  assert.equal(
    (
      await rows(
        "SELECT count(*)::int n FROM ppo.field_attendances WHERE appointment_id=$1",
        [id],
      )
    )[0].n,
    1,
  );
  await send(second, incident, "save", {
    facts: {
      ...(await incidentRead(second, incident)).row.facts,
      observations: "Reporting still available under the hold",
    },
  });
  assert.deepEqual(
    (await syncBatch(tech, { operations: [capture] })).outcomes[0].receipt,
    retained.outcomes[0].receipt,
  );
});

test("FI06 linked defect requires original correction and fresh independent retest, then closure leaves unrelated blockers", async () => {
  const f = await inspectionFixture(),
    attempt = await openInspection(f, f.tech, 1),
    a = await saveInspection(f, attempt);
  await inspectionCommand(
    f.tech,
    f.id,
    {
      ...base(),
      action: "submit",
      attempt_id: attempt,
      expected_version: a.row.version,
    },
    "capture",
  );
  const defect = (await inspect(f.co, f.id, "review")).defects[0],
    q = await create(f);
  await send(f.tech, q.id, "submit");
  await send(f.co, q.id, "link", {
    defect_id: defect.id,
    repeated_report_id: null,
  });
  await send(f.co, q.id, "triage", {
    owner_id: f.tech.actor_id,
    due_at: "2026-01-01T00:00:00Z",
    priority: "Urgent",
    assessment: "Assessed",
    hold: true,
  });
  const action = randomUUID();
  await send(f.co, q.id, "action", {
    action_id: action,
    owner_id: f.tech.actor_id,
    due_at: "2026-01-01T00:00:00Z",
    instruction: "SYN overdue corrective work",
  });
  const task = await readActivity(
    f.tech,
    (await incidentRead(f.tech, q.id)).actions[0].activity_id,
  );
  await activityCommand(
    f.tech,
    task.id,
    {
      ...base(),
      expected_version: task.version,
      outcome: "SYN correction performed late",
    },
    "complete",
  );
  const eid = await evidence(f.tech, q.id, action);
  await send(f.co, q.id, "accept_action", {
    action_id: action,
    evidence_id: eid,
  });
  await assert.rejects(
    send(f.co, q.id, "accept"),
    code("DefectRetestRequired"),
  );
  await inspectionCommand(
    f.tech,
    f.id,
    {
      ...base(),
      action: "correct",
      defect_id: defect.id,
      expected_version: defect.version,
      note: "SYN original retained correction",
    },
    "capture",
  );
  const retest = await openInspection(f, f.tech, 1, attempt),
    fresh = await saveInspection(f, retest, "215");
  await inspectionCommand(
    f.tech,
    f.id,
    {
      ...base(),
      action: "submit",
      attempt_id: retest,
      expected_version: fresh.row.version,
    },
    "capture",
  );
  await assert.rejects(
    send(f.co, q.id, "accept"),
    code("DefectRetestRequired"),
  );
  await inspectionCommand(
    f.co,
    f.id,
    {
      ...base(),
      action: "review",
      id: randomUUID(),
      attempt_id: retest,
      decision: "Accepted",
      decision_reason: "SYN independent retest acceptance",
      owner_id: f.tech.actor_id,
      due: "2031-11-10",
    },
    "review",
  );
  assert.equal(
    (await transaction((c) => incidentHolds(c, f.tech, f.id))).length,
    1,
  );
  const scheduling = await reviewedPolicy();
  await publishSchedulingPolicy(scheduling.publisher, scheduling.publish);
  const historicalPolicy = await transaction((c) =>
    policyImpactHolds(c, f.tech, f.id),
  );
  assert.ok(historicalPolicy.every((x) => !x.held)); // Existing Step 6 attendance boundary.
  const otherAppointments = await rows(
    "SELECT DISTINCT appointment_id FROM ppo.scheduling_policy_impacts WHERE appointment_id<>$1",
    [f.id],
  );
  const remainingPolicies = [];
  for (const a of otherAppointments) {
    const holds = await transaction((c) =>
      policyImpactHolds(c, f.co, a.appointment_id),
    );
    if (holds.some((x) => x.held))
      remainingPolicies.push({ id: a.appointment_id, holds });
  }
  assert.ok(remainingPolicies.length);
  const unrelated = await create(f, f.second);
  await send(f.second, unrelated.id, "submit");

  await send(f.co, q.id, "accept");
  await send(f.co, q.id, "close");
  assert.equal(
    (await transaction((c) => incidentHolds(c, f.tech, f.id))).length,
    1,
  );
  assert.equal(
    (await transaction((c) => dispatchReadiness(c, f.tech, f.id, true)))
      .component_ready,
    false,
  );
  const closed = await incidentRead(f.co, q.id);
  const bytes = await readBundle(f.co, closed.outputs[0].bundle);
  await database().query(
    "UPDATE ppo.assets SET version=version+1 WHERE id=$1",
    [q.t.asset_id],
  );
  assert.equal((await incidentRead(f.co, q.id)).operational_hold, true);
  assert.deepEqual(
    await transaction((c) => policyImpactHolds(c, f.tech, f.id)),
    historicalPolicy,
  );
  for (const a of remainingPolicies)
    assert.deepEqual(
      await transaction((c) => policyImpactHolds(c, f.co, a.id)),
      a.holds,
    );
  assert.equal(
    (await transaction((c) => incidentHolds(c, f.tech, f.id))).length,
    2,
  );
  assert.deepEqual(await readBundle(f.co, closed.outputs[0].bundle), bytes);
  assert.equal(
    (await inspect(f.co, f.id, "review")).defects[0].state,
    "Closed",
  );
});
import { reviewed as reviewedPolicy } from "../helpers/policy-commands";
import { publishSchedulingPolicy } from "../../src/scheduling/policy-commands";
import { policyImpactHolds } from "../../src/scheduling/policy-holds";

test("FI06 two reviewers, concurrent decisions, authority loss, missing scope authority and immutable original history", async () => {
  const f = await inspectionFixture(),
    q = await create(f);
  await send(f.tech, q.id, "submit");
  const reviewer = await principal("observer");
  // Only this adversarial fixture adds a second scoped reviewer; runtime seed
  // remains nine grants to the three existing fictional identities.
  await database().query(
    `INSERT INTO ppo.permission_grants(workspace_id,user_id,company_id,capability,scope_type,scope_id,site_id,valid_from,valid_to)
    SELECT workspace_id,$2,company_id,capability,scope_type,scope_id,site_id,valid_from,valid_to FROM ppo.permission_grants WHERE user_id=$1 AND (capability LIKE 'incident.%' OR capability IN ('shared.read','service.work_order.read','service.work_order.edit','schedule.read','activity.read')) ON CONFLICT DO NOTHING`,
    [f.co.actor_id, reviewer.actor_id],
  );
  const current = await incidentRead(f.co, q.id),
    cmd = {
      ...base(),
      id: q.id,
      action: "review",
      expected_version: current.row.version,
      decision: "ClarificationRequired",
    };
  const race = await Promise.allSettled([
    incidentCommand(f.co, cmd),
    incidentCommand(reviewer, { ...cmd, operation_id: randomUUID() }),
  ]);
  assert.equal(race.filter((x) => x.status === "fulfilled").length, 1);
  assert.equal(
    race.filter(
      (x) => x.status === "rejected" && x.reason.code === "VersionConflict",
    ).length,
    1,
  );
  await assert.rejects(
    incidentCommand(f.tech, {
      ...q.original,
      id: randomUUID(),
      operation_id: randomUUID(),
      asset_id: randomUUID(),
    }),
    code("RecordUnavailable"),
  );
  await database().query(
    "UPDATE ppo.permission_grants SET valid_to=clock_timestamp() WHERE user_id=$1 AND capability='incident.review'",
    [reviewer.actor_id],
  );
  await assert.rejects(
    send(reviewer, q.id, "review", { decision: "OnHold" }),
    code("Forbidden"),
  );
  await transaction(async (c) => {
    await c.query(
      "ALTER TABLE ppo.incidents RENAME TO fi06_unavailable_source",
    );
    await assert.rejects(
      incidentHolds(c, f.tech, f.id),
      code("IncidentSourceUnavailable"),
    );
    await c.query(
      "ALTER TABLE ppo.fi06_unavailable_source RENAME TO incidents",
    );
  });
  await assert.rejects(
    database().query(
      "UPDATE ppo.incident_events SET reason='erased' WHERE incident_id=$1",
      [q.id],
    ),
    (e) => (e as { code: string }).code === "55000",
  );
  await database().query(
    "UPDATE ppo.permission_grants SET valid_to=clock_timestamp() WHERE user_id=$1 AND capability='field.read.own'",
    [f.tech.actor_id],
  );
  await assert.rejects(incidentRead(f.tech, q.id), code("Forbidden"));
});
