import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { beforeEach, after, test } from "node:test";
import { reset } from "../../scripts/database";
import {
  database,
  closeDatabase,
  transaction,
} from "../../src/platform/database";
import { localConfig } from "../../src/platform/config";
import { createCs, saveCs, readCs } from "../../src/shared/cs/service";
import {
  readFieldReadiness,
  acknowledgeFieldReadiness,
} from "../../src/field/readiness";
import { readOperation } from "../../src/shared/receipts";
import { hasPermission } from "../../src/platform/permissions";
import { confirmed, principal, base, rows } from "../helpers/packs";

if (localConfig().database_name !== "ppo_synthetic_test")
  throw Error("Use only ppo_synthetic_test");
process.env.PPO_ALLOW_RESET = "dispose-synthetic";
process.env.PPO_RESET_DATABASE = "ppo_synthetic_test";
beforeEach(reset);
after(closeDatabase);
const code = (name: string) => (e: unknown) =>
  (e as { code: string }).code === name;
async function fixture() {
  const appointment = await confirmed(),
    coordinator = await principal(),
    tech = await principal("assigned-technician");
  const a = (
    await rows("SELECT * FROM ppo.appointments WHERE id=$1", [appointment.id])
  )[0];
  const id = randomUUID();
  await createCs(coordinator, "Readiness", {
    ...base(),
    id,
    context_id: a.site_id,
    name: "SYN Field readiness source",
    owner_id: coordinator.actor_id,
  });
  return { appointment: a, coordinator, tech, id };
}
function command(v: Awaited<ReturnType<typeof readFieldReadiness>>) {
  assert.ok(v.source);
  return {
    ...base(),
    record_id: v.source.id,
    expected_version: v.source.version,
    presented_hash: v.source.presented_hash,
    activity: v.source.preparation.activity,
    facility_ids: v.source.preparation.facility_ids,
  };
}
test("FI05 exact assigned review reuses CS records, keeps missing induction unknown and recovers one original under concurrent retry", async () => {
  const f = await fixture(),
    query = { record_id: f.id, activity: "Inspection" };
  const facility = (
    await rows(
      "SELECT id FROM ppo.facilities WHERE site_id=$1 ORDER BY id LIMIT 1",
      [f.appointment.site_id],
    )
  )[0];
  const requirement = {
    id: randomUUID(),
    revision: 1,
    title: "SYN personal induction",
    kind: "Induction",
    facility_id: null,
    activity: "Inspection",
    source: "SYN Site induction source",
  };
  const expired = {
    id: randomUUID(),
    requirement_id: requirement.id,
    requirement_revision: 1,
    facility_id: null,
    activity: "Inspection",
    person_id: null,
    captured_on: "2020-01-01",
    expires_on: "2020-02-01",
    source: "SYN expired induction evidence",
  };
  let cs = await readCs(f.coordinator, "Readiness", f.id);
  await saveCs(f.coordinator, "Readiness", f.id, {
    ...base(),
    expected_version: cs.record.version,
    name: cs.record.name,
    owner_id: cs.record.owner_id,
    content: {
      schema_version: 1,
      requirements: [requirement],
      evidence: [expired],
      windows: [],
    },
  });
  assert.equal(
    await hasPermission(
      database(),
      f.tech,
      "shared.edit",
      f.appointment.company_id,
      f.appointment.site_id,
    ),
    false,
  );
  let view = await readFieldReadiness(f.tech, f.appointment.id, query);
  assert.equal(view.site.id, f.appointment.site_id);
  assert.equal(view.job.id, f.appointment.id);
  assert.equal(view.work_authority, "Not granted");
  assert.match(view.personal_induction, /Not verified/);
  assert.equal(
    view.source!.evidence_status[expired.id].status,
    "Expired for this visit",
  );
  assert.ok(
    view.source!.assessment.blockers.some((x) =>
      x.includes("individual visitor"),
    ),
  );
  const original = command(view);
  const results = await Promise.all([
    acknowledgeFieldReadiness(f.tech, f.appointment.id, original),
    acknowledgeFieldReadiness(f.tech, f.appointment.id, original),
  ]);
  assert.deepEqual(results[0].receipt, results[1].receipt);
  assert.equal(results.filter((r) => r.replayed).length, 1);
  assert.deepEqual(
    await readOperation(f.tech, original.operation_id),
    results[0].receipt,
  );
  assert.equal(
    (
      await rows(
        "SELECT id FROM ppo.cs_record_events WHERE details->>'operation_id'=$1",
        [original.operation_id],
      )
    ).length,
    1,
  );
  await assert.rejects(
    acknowledgeFieldReadiness(f.tech, f.appointment.id, {
      ...original,
      reason: "Changed meaning",
    }),
    code("OperationConflict"),
  );
  view = await readFieldReadiness(f.tech, f.appointment.id, query);
  assert.equal(view.acknowledgements.length, 1);
  assert.equal(view.acknowledgements[0].current_selection, true);
  const originalSnapshot = (
    await rows("SELECT basis FROM ppo.cs_snapshots WHERE record_id=$1", [f.id])
  )[0].basis;
  assert.equal(originalSnapshot.field_context.actor_id, f.tech.actor_id);
  assert.equal(
    originalSnapshot.field_context.assignment_id,
    view.job.assignment_id,
  );
  assert.deepEqual(originalSnapshot.preparation.person_ids, []);
  cs = await readCs(f.coordinator, "Readiness", f.id);
  await saveCs(f.coordinator, "Readiness", f.id, {
    ...base(),
    expected_version: cs.record.version,
    name: cs.record.name,
    owner_id: cs.record.owner_id,
    content: {
      schema_version: 1,
      requirements: [
        { ...requirement, source: "SYN changed access instructions" },
      ],
      evidence: [expired],
      windows: [],
    },
  });
  view = await readFieldReadiness(f.tech, f.appointment.id, query);
  assert.equal(view.acknowledgements[0].current_selection, false);
  assert.equal(
    view.source!.evidence_status[expired.id].status,
    "Superseded requirement",
  );
  assert.deepEqual(
    (
      await rows("SELECT basis FROM ppo.cs_snapshots WHERE record_id=$1", [
        f.id,
      ])
    )[0].basis,
    originalSnapshot,
  );
  await assert.rejects(
    acknowledgeFieldReadiness(f.tech, f.appointment.id, {
      ...original,
      operation_id: randomUUID(),
    }),
    code("SourceChanged"),
  );
  // A new meaning uses a new operation, retaining the old review.
  await acknowledgeFieldReadiness(f.tech, f.appointment.id, command(view));
  assert.equal(
    (await readFieldReadiness(f.tech, f.appointment.id, query)).acknowledgements
      .length,
    2,
  );
  if (facility) {
    const selected = await readFieldReadiness(f.tech, f.appointment.id, {
      ...query,
      facility_ids: facility.id,
    });
    assert.deepEqual(selected.source!.preparation.facility_ids, [facility.id]);
    assert.equal(selected.acknowledgements[0].current_selection, false);
  }
  const after = (
    await rows(
      "SELECT status,actual_start_at FROM ppo.appointments WHERE id=$1",
      [f.appointment.id],
    )
  )[0];
  assert.equal(after.status, "Confirmed");
  assert.equal(after.actual_start_at, null);
  assert.equal(
    (
      await rows(
        "SELECT id FROM ppo.field_attendances WHERE appointment_id=$1",
        [f.appointment.id],
      )
    ).length,
    0,
  );
  assert.equal(
    (
      await rows("SELECT id FROM ppo.service_reports WHERE appointment_id=$1", [
        f.appointment.id,
      ])
    ).length,
    0,
  );
});
test("FI05 server denies cross-Site/unassigned reads, stale schedule and revoked originals without erasing evidence", async () => {
  const f = await fixture(),
    tech = f.tech,
    a = f.appointment,
    source = { id: f.id },
    other = await principal("second-company");
  const query = { record_id: source.id, activity: "Inspection" },
    view = await readFieldReadiness(tech, a.id, query),
    original = command(view);
  await assert.rejects(readFieldReadiness(other, a.id, query));
  await assert.rejects(
    readFieldReadiness(await principal("coordinator"), a.id, query),
  );
  const crossSite = (
    await rows("SELECT id FROM ppo.facilities WHERE site_id<>$1 LIMIT 1", [
      a.site_id,
    ])
  )[0];
  assert.ok(crossSite);
  await assert.rejects(
    readFieldReadiness(tech, a.id, { ...query, facility_ids: crossSite.id }),
    code("RecordUnavailable"),
  );
  await rows(
    "UPDATE ppo.appointments SET schedule_version=schedule_version+1,version=version+1 WHERE id=$1",
    [a.id],
  );
  await assert.rejects(
    acknowledgeFieldReadiness(tech, a.id, original),
    code("SourceChanged"),
  );
  const saved = await acknowledgeFieldReadiness(
    tech,
    a.id,
    command(await readFieldReadiness(tech, a.id, query)),
  );
  await transaction(async (c) => {
    await c.query(
      "UPDATE ppo.resource_reservations SET active=false WHERE assignment_id=$1",
      [view.job.assignment_id],
    );
    await c.query("UPDATE ppo.assignments SET active=false WHERE id=$1", [
      view.job.assignment_id,
    ]);
  });
  await assert.rejects(
    readFieldReadiness(tech, a.id, query),
    code("RecordUnavailable"),
  );
  await assert.rejects(
    readOperation(tech, saved.receipt.operation_id),
    code("RecordUnavailable"),
  );
  await assert.rejects(
    acknowledgeFieldReadiness(tech, a.id, original),
    code("RecordUnavailable"),
  );
  assert.ok(
    (
      await rows(
        "SELECT id FROM ppo.cs_record_events WHERE record_id=$1 AND kind='Acknowledged'",
        [source.id],
      )
    ).length === 1,
  );
});
