import assert from "node:assert/strict";
import { beforeEach, after, test } from "node:test";
import { randomUUID } from "node:crypto";
import { reset } from "../../scripts/database";
import {
  closeDatabase,
  database,
  transaction,
} from "../../src/platform/database";
import { localConfig } from "../../src/platform/config";
import { inspectionCommand } from "../../src/inspections/service-commands";
import { readOperation } from "../../src/shared/receipts";
import {
  inspectionFixture,
  openInspection,
  saveInspection,
  inspect,
  base,
  principal,
  rows,
} from "../helpers/service-inspections";
import { activityCommand, readActivity } from "../../src/activities/activities";
import { recordCalibration } from "../../src/equipment/evidence";
import { saveCs, readCs } from "../../src/shared/cs/service";
import { rename } from "node:fs/promises";
import { join } from "node:path";
import { homedir } from "node:os";
import {
  previewEquipmentChange,
  proposeEquipmentChange,
  reviewEquipmentChange,
} from "../../src/equipment/changes";
if (localConfig().database_name !== "ppo_synthetic_test")
  throw Error("Use only ppo_synthetic_test");
process.env.PPO_ALLOW_RESET = "dispose-synthetic";
process.env.PPO_RESET_DATABASE = "ppo_synthetic_test";
beforeEach(reset);
after(closeDatabase);
const code = (s: string) => (e: unknown) => (e as { code: string }).code === s;
test("FI03/FI04 atomic failed capture, owned correction, retained fresh retest, independent review and exact issued bytes", async () => {
  const f = await inspectionFixture(),
    id = await openInspection(f, f.tech, 1),
    a = await saveInspection(f, id);
  await database().query(
    "UPDATE ppo.permission_grants SET valid_to=clock_timestamp() WHERE user_id=$1 AND capability LIKE 'field.%'",
    [f.co.actor_id],
  );
  const original = {
    ...base(),
    action: "submit",
    attempt_id: id,
    expected_version: a.row.version,
  };
  const receipts = await Promise.all([
    inspectionCommand(f.tech, f.id, original, "capture"),
    inspectionCommand(f.tech, f.id, original, "capture"),
  ]);
  assert.deepEqual(receipts[0].receipt, receipts[1].receipt);
  assert.deepEqual(
    await readOperation(f.tech, original.operation_id),
    receipts[0].receipt,
  );
  let v = await inspect(f.co, f.id, "review");
  assert.equal(v.defects.length, 1);
  assert.deepEqual(
    await rows(
      "SELECT DISTINCT rule_version FROM ppo.inspection_results WHERE attempt_id=$1",
      [id],
    ),
    [{ rule_version: "service-inspection-rules-1" }],
  );
  assert.ok(v.defects[0].activity_id);
  const activity = await readActivity(f.tech, v.defects[0].activity_id!);
  await activityCommand(
    f.tech,
    activity.id,
    {
      ...base(),
      expected_version: activity.version,
      outcome:
        "SYN follow-up performed; inspection defect still needs accepted retest.",
    },
    "complete",
  );
  assert.equal((await inspect(f.co, f.id, "review")).defects[0].state, "Open");
  const frozen = await rows(
    "SELECT to_jsonb(a) AS row FROM ppo.inspection_attempts a WHERE id=$1",
    [id],
  );
  for (const decision of ["ClarificationRequired", "OnHold"] as const) {
    await inspectionCommand(
      f.co,
      f.id,
      {
        ...base(),
        action: "review",
        id: randomUUID(),
        attempt_id: id,
        decision,
        decision_reason:
          "SYN explain original failure and retain the outstanding obligation.",
        owner_id: f.tech.actor_id,
        due: "2026-12-10",
      },
      "review",
    );
    if (decision === "ClarificationRequired") {
      await inspectionCommand(
        f.tech,
        f.id,
        {
          ...base(),
          action: "clarify",
          id: randomUUID(),
          attempt_id: id,
          decision_reason:
            "SYN original reading is confirmed; fresh correction and retest are still required.",
        },
        "capture",
      );
      assert.equal(
        (await inspect(f.co, f.id, "review")).attempts[0].review,
        "InReview",
      );
    }
  }
  await inspectionCommand(
    f.co,
    f.id,
    {
      ...base(),
      action: "review",
      id: randomUUID(),
      attempt_id: id,
      decision: "Returned",
      decision_reason:
        "Failed exact pressure check; correct and retain retest.",
      owner_id: f.tech.actor_id,
      due: "2026-12-10",
    },
    "review",
  );
  await inspectionCommand(
    f.tech,
    f.id,
    {
      ...base(),
      action: "correct",
      defect_id: v.defects[0].id,
      expected_version: v.defects[0].version,
      note: "SYN external test setup corrected; no equipment intervention.",
    },
    "capture",
  );
  const retest = await openInspection(f, f.tech, 1, id),
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
  await inspectionCommand(
    f.co,
    f.id,
    {
      ...base(),
      action: "review",
      id: randomUUID(),
      attempt_id: retest,
      decision: "Accepted",
      decision_reason: "Fresh exact evidence accepted independently.",
    },
    "review",
  );
  v = await inspect(f.co, f.id, "review");
  assert.equal(v.defects[0].state, "Closed");
  assert.equal(v.defects[0].closed_by_attempt_id, retest);
  assert.deepEqual(
    await rows(
      "SELECT to_jsonb(a) AS row FROM ppo.inspection_attempts a WHERE id=$1",
      [id],
    ),
    frozen,
  );
  // A second procedure on the same visit remains outstanding. Its correction
  // is remaining work, never evidence accepted by this pressure outcome.
  const other = await openInspection(f, f.tech, 0),
    otherDraft = (await inspect(f.tech, f.id)).attempts.find(
      (x) => x.row.id === other,
    )!;
  await inspectionCommand(
    f.tech,
    f.id,
    {
      ...base(),
      action: "save",
      attempt_id: other,
      expected_version: otherDraft.row.version,
      occurred_at: new Date().toISOString(),
      readings: otherDraft.row.plan.map((d) => ({
        check_key: d.key,
        state: "NotTested",
        reason: "SYN other procedure has unresolved basis",
      })),
    },
    "capture",
  );
  const otherSaved = (await inspect(f.tech, f.id)).attempts.find(
    (x) => x.row.id === other,
  )!;
  await inspectionCommand(
    f.tech,
    f.id,
    {
      ...base(),
      action: "submit",
      attempt_id: other,
      expected_version: otherSaved.row.version,
    },
    "capture",
  );
  const otherDefect = (await inspect(f.tech, f.id)).defects.find(
    (d) => d.source_attempt_id === other,
  )!;
  await inspectionCommand(
    f.tech,
    f.id,
    {
      ...base(),
      action: "correct",
      defect_id: otherDefect.id,
      expected_version: otherDefect.version,
      note: "SYN unrelated correction must remain outside the pressure evidence.",
    },
    "capture",
  );
  const release = {
    ...base(),
    action: "release",
    id: randomUUID(),
    attempt_id: retest,
    decision_reason:
      "Release only this synthetic pressure inspection; all other domains excluded.",
  };
  await inspectionCommand(f.co, f.id, release, "review");
  const prior = await rows(
    "SELECT to_jsonb(o) AS row FROM ppo.service_inspection_outputs o WHERE id=$1",
    [release.id],
  );
  assert.equal(prior[0].row.manifest.remaining_work.length, 2);
  assert.equal(prior[0].row.manifest.corrections.length, 1);
  assert(
    !prior[0].row.manifest.corrections.some(
      (e: { details: { defect_id: string } }) =>
        e.details.defect_id === otherDefect.id,
    ),
  );
  await inspectionCommand(f.co, f.id, release, "review");
  assert.deepEqual(
    await rows(
      "SELECT to_jsonb(o) AS row FROM ppo.service_inspection_outputs o WHERE id=$1",
      [release.id],
    ),
    prior,
  );
  assert.equal((await inspect(f.tech, f.id)).appointment.status, "InProgress");
  assert.equal((await inspect(f.tech, f.id)).work_order.status, "Authorised");
});

test("FI03 retained calibration, repeated failure, missing preparation and retired basis cannot become accepted history", async () => {
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
  const original = (await inspect(f.tech, f.id)).attempts.find(
    (x) => x.row.id === id,
  )!;
  let defect = (await inspect(f.tech, f.id)).defects[0];
  await inspectionCommand(
    f.tech,
    f.id,
    {
      ...base(),
      action: "correct",
      defect_id: defect.id,
      expected_version: defect.version,
      note: "SYN first correction did not resolve the observation.",
    },
    "capture",
  );
  const retest = await openInspection(f, f.tech, 1, id),
    bad = await saveInspection(f, retest, "125");
  await inspectionCommand(
    f.tech,
    f.id,
    {
      ...base(),
      action: "submit",
      attempt_id: retest,
      expected_version: bad.row.version,
    },
    "capture",
  );
  const repeated = await inspect(f.tech, f.id);
  assert.equal(repeated.defects.length, 1);
  assert.equal(repeated.defects[0].id, defect.id);
  assert.equal(repeated.defects[0].state, "Open");
  assert.equal(repeated.defects[0].activity_id, defect.activity_id);
  assert(
    repeated.links.some(
      (l) => l.attempt_id === retest && l.relation === "Repeated",
    ),
  );
  const instrument = original.instruments[0].snapshot;
  await recordCalibration(f.co, {
    ...base(),
    id: randomUUID(),
    company_id: f.q.pack.company_id,
    instrument_id: original.instruments[0].instrument_id,
    expected_version: 1,
    withdrawn_effective_from: "2026-01-01",
  });
  const withdrawn = await inspect(f.tech, f.id);
  assert.equal(
    withdrawn.attempts.find((x) => x.row.id === id)!.instruments[0].assessment,
    "WithdrawnForUse",
  );
  assert.equal(
    withdrawn.attempts.find((x) => x.row.id === id)!.applicability,
    "ReassessmentRequired",
  );
  assert.deepEqual(
    withdrawn.attempts.find((x) => x.row.id === id)!.instruments[0].snapshot,
    instrument,
  );
  await assert.rejects(
    inspectionCommand(
      f.co,
      f.id,
      {
        ...base(),
        action: "review",
        id: randomUUID(),
        attempt_id: retest,
        decision: "Accepted",
        decision_reason: "Must remain blocked",
      },
      "review",
    ),
    code("ReassessmentRequired"),
  );
  const source = (await readCs(f.co, "Readiness", f.source)).record;
  await saveCs(f.co, "Readiness", f.source, {
    ...base(),
    expected_version: source.version,
    name: source.name,
    owner_id: source.owner_id,
    content: { ...source.content, evidence: [] },
  });
  await assert.rejects(openInspection(f, f.tech, 1), code("InspectionHeld"));
  await database().query(
    "INSERT INTO ppo.service_inspection_template_retirements(workspace_id,company_id,template_id,reason,recorded_by) VALUES($1,$2,$3,'SYN withdrawn procedure basis',$4)",
    [
      f.co.workspace_id,
      f.q.pack.company_id,
      "e9550000-0000-4000-8000-000000000001",
      f.co.actor_id,
    ],
  );
  assert(
    (await inspect(f.tech, f.id)).attempts
      .find((x) => x.row.id === id)!
      .applicability_reasons.some((x) => x.includes("retired")),
  );
  assert.deepEqual(
    (await inspect(f.tech, f.id)).attempts.find((x) => x.row.id === id)!.row,
    original.row,
  );
  defect = (await inspect(f.tech, f.id)).defects[0];
  assert.equal(defect.state, "Open");
});
test("FI03 concurrent crew/procedures, stale saves, invalid units and inaccessible evidence preserve drafts", async () => {
  const f = await inspectionFixture(),
    one = await openInspection(f, f.tech, 1),
    two = await openInspection(f, f.second, 1),
    other = await openInspection(f, f.tech, 0);
  assert.equal((await inspect(f.tech, f.id)).attempts.length, 3);
  assert.notEqual(one, two);
  await assert.rejects(openInspection(f, f.tech, 1), code("DraftOpen"));
  const a = await saveInspection(f, one);
  await assert.rejects(
    inspectionCommand(
      f.second,
      f.id,
      {
        ...base(),
        action: "save",
        attempt_id: one,
        expected_version: a.row.version,
        readings: [],
      },
      "capture",
    ),
    code("RecordUnavailable"),
  );
  await assert.rejects(
    inspectionCommand(
      f.tech,
      f.id,
      {
        ...base(),
        action: "save",
        attempt_id: one,
        expected_version: 1,
        readings: [],
      },
      "capture",
    ),
    code("VersionConflict"),
  );
  await assert.rejects(
    inspectionCommand(
      f.tech,
      f.id,
      {
        ...base(),
        action: "save",
        attempt_id: one,
        expected_version: a.row.version,
        readings: [
          {
            check_key: a.row.plan[0].key,
            state: "Recorded",
            value: "215",
            unit: "psi",
          },
        ],
      },
      "capture",
    ),
    code("InvalidUnit"),
  );
  const evidence = a.evidence[0];
  await assert.rejects(
    inspectionCommand(
      f.tech,
      f.id,
      {
        ...base(),
        action: "evidence",
        attempt_id: one,
        expected_version: a.row.version,
        evidence: {
          id: randomUUID(),
          kind: "StoredFile",
          check_key: a.row.plan[0].key,
          label: "SYN corrupt upload",
          purpose: "Test",
          access_class: "Internal",
          media_type: "text/plain",
          byte_count: 2,
          sha256: "0".repeat(64),
          content_base64: "YQ==",
        },
      },
      "capture",
    ),
    code("EvidenceHashMismatch"),
  );
  assert.equal(
    (await inspect(f.tech, f.id)).attempts.find((x) => x.row.id === one)!
      .evidence[0].content_hash,
    evidence.content_hash,
  );
  assert.equal(
    (await inspect(f.tech, f.id)).attempts.find((x) => x.row.id === other)!
      .results.length,
    0,
  );
  const path = join(
    process.env.PPO_DOCUMENT_DIRECTORY ??
      join(homedir(), ".ppo-synthetic-documents"),
    f.tech.workspace_id,
    evidence.storage_id!,
  );
  await rename(path, path + ".unavailable-proof");
  try {
    await assert.rejects(
      inspectionCommand(
        f.tech,
        f.id,
        {
          ...base(),
          action: "submit",
          attempt_id: one,
          expected_version: a.row.version,
        },
        "capture",
      ),
      code("ExactDocumentUnavailable"),
    );
    assert.equal(
      (await inspect(f.tech, f.id)).attempts.find((x) => x.row.id === one)!.row
        .state,
      "Draft",
    );
  } finally {
    await rename(path + ".unavailable-proof", path);
  }
  const asset = a.binding.asset_id,
    preview = await previewEquipmentChange(f.co, asset),
    change = randomUUID();
  await proposeEquipmentChange(f.co, asset, {
    ...base(),
    id: change,
    expected_version: preview.impact.asset_version,
    kind: "Configuration",
    effective_at: new Date().toISOString(),
    source_reference: "SYN changed configuration proof",
    source_revision: "1",
    basis_hash: preview.basis_hash,
    configuration: "SYN observed successor configuration",
    consequences:
      "Inspection evidence retains its old exact configuration and requires reassessment.",
  });
  await reviewEquipmentChange(f.co, change, {
    ...base(),
    expected_version: 1,
    decision: "Apply",
  });
  assert.equal(
    (await inspect(f.tech, f.id)).attempts.find((x) => x.row.id === one)!
      .applicability,
    "ReassessmentRequired",
  );
  await assert.rejects(
    inspectionCommand(
      f.tech,
      f.id,
      {
        ...base(),
        action: "submit",
        attempt_id: one,
        expected_version: a.row.version,
      },
      "capture",
    ),
    code("ReassessmentRequired"),
  );
});
test("FI03 missing criteria and unknown applicability remain incomplete owned obligations; source/permission changes deny new work and receipts", async () => {
  const f = await inspectionFixture(),
    id = await openInspection(f, f.tech, 0),
    a = (await inspect(f.tech, f.id)).attempts.find((a) => a.row.id === id)!;
  const cmd = {
    ...base(),
    action: "save",
    attempt_id: id,
    expected_version: a.row.version,
    occurred_at: new Date().toISOString(),
    readings: a.row.plan.map((d) => ({
      check_key: d.key,
      state: "NotTested",
      reason: "Missing approved criterion or known applicability",
    })),
  };
  await inspectionCommand(f.tech, f.id, cmd, "capture");
  const saved = (await inspect(f.tech, f.id)).attempts.find(
    (x) => x.row.id === id,
  )!;
  await inspectionCommand(
    f.tech,
    f.id,
    {
      ...base(),
      action: "submit",
      attempt_id: id,
      expected_version: saved.row.version,
    },
    "capture",
  );
  assert.equal((await inspect(f.co, f.id, "review")).defects.length, 2);
  await assert.rejects(
    inspectionCommand(
      f.co,
      f.id,
      {
        ...base(),
        action: "review",
        id: randomUUID(),
        attempt_id: id,
        decision: "Accepted",
        decision_reason: "Must fail",
      },
      "review",
    ),
    code("AcceptanceIncomplete"),
  );
  const wrong = await principal("second-company");
  await assert.rejects(inspect(wrong, f.id, "review"));
  await database().query(
    "UPDATE ppo.permission_grants SET valid_to=clock_timestamp() WHERE user_id=$1 AND capability='field.capture.own'",
    [f.tech.actor_id],
  );
  await assert.rejects(readOperation(f.tech, cmd.operation_id));
  const member = (await rows(`SELECT r.user_id FROM ppo.assignments x JOIN ppo.resources r
    ON r.workspace_id=x.workspace_id AND r.id=x.resource_id
    WHERE x.appointment_id=$1 AND x.active AND x.crew_role<>'Lead'`, [f.id]))[0];
  const removed = member.user_id === f.tech.actor_id ? f.tech : f.second;
  await inspect(removed, f.id);
  // Simulate loss of the live crew association with the same complete
  // reservation/assignment fixture transition used by FI-05; keep its guard on.
  await transaction(async (c) => {
    await c.query(
      `UPDATE ppo.resource_reservations SET active=false WHERE assignment_id IN (
      SELECT x.id FROM ppo.assignments x JOIN ppo.resources r ON r.workspace_id=x.workspace_id AND r.id=x.resource_id
      WHERE x.appointment_id=$1 AND r.user_id=$2)`,
      [f.id, removed.actor_id],
    );
    await c.query(
      `UPDATE ppo.assignments x SET active=false FROM ppo.resources r
       WHERE x.workspace_id=r.workspace_id AND x.resource_id=r.id AND x.appointment_id=$1 AND r.user_id=$2`,
      [f.id, removed.actor_id],
    );
  });
  await assert.rejects(inspect(removed, f.id), code("RecordUnavailable"));
});

test("FI03 overdue certificate renewal cannot repair a retained test-time snapshot", async () => {
  const f = await inspectionFixture(),
    id = await openInspection(f, f.tech, 1),
    a = await saveInspection(f, id, "215"),
    expired = randomUUID();
  const calibration = {
    company_id: f.q.pack.company_id,
    reference: "SYN-EXPIRED-PG",
    description: "SYN deliberately overdue certificate",
    calibration_reference: "SYN-CAL-EXPIRED",
    calibration_version: "1",
    valid_from: "2026-01-01",
    valid_to: "2026-02-01",
    measurement_type: "Pressure",
    measurement_range: "0–1000 kPa",
    measurement_unit: "kPa",
    certificate_reference: "SYN-CERT-EXPIRED",
    certificate_revision: "1",
  };
  await recordCalibration(f.co, {
    ...base(),
    id: randomUUID(),
    instrument_id: expired,
    ...calibration,
  });
  await inspectionCommand(
    f.tech,
    f.id,
    {
      ...base(),
      action: "save",
      attempt_id: id,
      expected_version: a.row.version,
      occurred_at: a.row.occurred_at!.toISOString(),
      instrument_ids: [expired],
      readings: a.results.map((r) => ({
        check_key: r.check_key,
        state: "Recorded",
        value: r.raw_value,
        unit: r.unit,
        choice: r.choice,
      })),
    },
    "capture",
  );
  const before = (await inspect(f.tech, f.id)).attempts[0];
  assert.equal(before.instruments[0].assessment, "InvalidAtUse");
  await recordCalibration(f.co, {
    ...base(),
    id: randomUUID(),
    instrument_id: randomUUID(),
    ...calibration,
    predecessor_id: expired,
    expected_version: 1,
    calibration_version: "2",
    valid_from: "2026-03-01",
    valid_to: "2032-12-31",
    certificate_revision: "2",
  });
  const after = (await inspect(f.tech, f.id)).attempts[0];
  assert.deepEqual(
    after.instruments[0].snapshot,
    before.instruments[0].snapshot,
  );
  assert.equal(after.instruments[0].assessment, "InvalidAtUse");
  await assert.rejects(
    inspectionCommand(
      f.tech,
      f.id,
      {
        ...base(),
        action: "submit",
        attempt_id: id,
        expected_version: after.row.version,
      },
      "capture",
    ),
    code("SubmissionBlocked"),
  );
});
