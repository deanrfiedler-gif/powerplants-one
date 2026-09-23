import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { equipmentTimeline } from "../../src/equipment/timeline";
import { equipmentReviewTasks } from "../../src/equipment/reviews";
import { equipmentOptions } from "../../src/equipment/options";
import { before, after, test } from "node:test";
import { readFile } from "node:fs/promises";
import { reset, migrate, seed } from "../../scripts/database";
import { database, closeDatabase } from "../../src/platform/database";
import { localConfig } from "../../src/platform/config";
import { createSession } from "../../src/platform/identity";
import { createAsset } from "../../src/shared/commands";
import { readOperation } from "../../src/shared/receipts";
import { equipmentLookup, equipmentRegister } from "../../src/equipment/reads";
import {
  currentConfiguration,
  previewEquipmentChange,
  proposeEquipmentChange,
  reviewEquipmentChange,
} from "../../src/equipment/changes";
import {
  bulletinWorkspace,
  closeBulletin,
  createEquipmentEvidence,
  equipmentEvidence,
  equipmentInstruments,
  recordCalibration,
  reviewBackup,
  reviewBulletin,
} from "../../src/equipment/evidence";
import { CRM, crmBase as base } from "../helpers/crm";
if (localConfig().database_name !== "ppo_synthetic_test")
  throw Error("Use only ppo_synthetic_test");
process.env.PPO_ALLOW_RESET = "dispose-synthetic";
process.env.PPO_RESET_DATABASE = "ppo_synthetic_test";
before(reset);
after(closeDatabase);
const p = async (profile = "coordinator") =>
  (await createSession(profile)).principal;
const rows = async (sql: string, args: unknown[] = []) =>
  (await database().query(sql, args)).rows;
const code =
  (...codes: string[]) =>
  (e: unknown) =>
    codes.includes((e as { code: string }).code);
async function asset(extra: Record<string, unknown> = {}) {
  const actor = await p(),
    id = randomUUID();
  await createAsset(actor, {
    ...base(),
    id,
    company_id: CRM.company,
    site_id: CRM.site,
    description: "SYN Equipment test pump",
    identity_status: "Unresolved",
    manufacturer: "SYN Equip",
    model: "Pump45",
    serial: `SYN-${id}`,
    effective_at: "2026-09-01T00:00:00.000Z",
    configuration: "SYN initial hardware H1 / firmware F1",
    ...extra,
  });
  return { actor, id };
}
async function proposal(id: string, extra: Record<string, unknown> = {}) {
  const actor = await p(),
    preview = await previewEquipmentChange(actor, id),
    change = randomUUID();
  const command = {
    ...base(),
    id: change,
    expected_version: preview.impact.asset_version,
    kind: "Configuration",
    effective_at: "2026-09-20T00:00:00.000Z",
    source_reference: "SYN technical change source",
    source_revision: "r01",
    basis_hash: preview.basis_hash,
    configuration: "SYN hardware H1 / firmware F2",
    consequences:
      "Reviewed exact configuration, documents, Service, warranty and maintenance consequences; no authority transfer.",
    ...extra,
  };
  const result = await proposeEquipmentChange(actor, id, command);
  return { actor, change, command, result };
}
test("EQ-01/02 permission-scoped register, exact counts and read-only lookup outcomes", async () => {
  const { actor, id } = await asset({ serial: "SYN-DUPLICATE-45" });
  await asset({ serial: "SYN-DUPLICATE-45" });
  const before = await rows("SELECT * FROM ppo.assets WHERE id=$1", [id]);
  const register = await equipmentRegister(actor, { q: "SYN-DUPLICATE-45" });
  assert.equal(register.total, 2);
  assert.equal(register.items.length, 2);
  assert.equal((await equipmentLookup(actor, { q: id })).outcome, "Exact");
  assert.equal(
    (await equipmentLookup(actor, { q: "SYN-DUPLICATE-45" })).outcome,
    "Ambiguous",
  );
  assert.equal(
    (await equipmentLookup(actor, { q: "javascript:alert(1)" })).outcome,
    "Malformed",
  );
  assert.equal(
    (await equipmentLookup(actor, { q: randomUUID() })).outcome,
    "UnknownOrInaccessible",
  );
  for (const profile of ["other-workspace", "second-company"]) {
    assert.equal(
      (await equipmentLookup(await p(profile), { q: id })).items.length,
      0,
    );
    assert.ok(
      !(await equipmentRegister(await p(profile))).items.some(
        (a) => a.id === id,
      ),
    );
  }
  assert.deepEqual(
    await rows("SELECT * FROM ppo.assets WHERE id=$1", [id]),
    before,
  );
  const timeline = await equipmentTimeline(actor, id);
  assert.ok(
    timeline.sources.every((s) => s.state === "available"),
    JSON.stringify(timeline.sources),
  );
  assert.ok((await equipmentOptions(actor, { asset_id: id })).asset?.id === id);
  assert.ok((await equipmentInstruments(actor)).items.length > 0);
});
test("EQ-03 immutable successor, exact original receipt, changed-payload refusal and stale proposals", async () => {
  const { actor, id } = await asset(),
    old = await rows(
      "SELECT * FROM ppo.asset_configurations WHERE asset_id=$1",
      [id],
    );
  const a = await proposal(id),
    stale = await proposal(id);
  const apply = { ...base(), expected_version: 1, decision: "Apply" };
  assert.ok(
    (await equipmentReviewTasks(actor, null)).items.some(
      (t) => t.record_id === a.change && t.actionable,
    ),
  );
  const first = await reviewEquipmentChange(actor, a.change, apply);
  const retry = await reviewEquipmentChange(actor, a.change, apply);
  assert.equal(retry.replayed, true);
  assert.deepEqual(first.receipt, retry.receipt);
  assert.deepEqual(
    await readOperation(actor, apply.operation_id),
    first.receipt,
  );
  await assert.rejects(
    reviewEquipmentChange(actor, a.change, { ...apply, reason: "changed" }),
    code("OperationConflict"),
  );
  assert.deepEqual(
    await rows("SELECT * FROM ppo.asset_configurations WHERE id=$1", [
      old[0].id,
    ]),
    old,
  );
  assert.equal(
    (await currentConfiguration(database(), CRM.workspace, id))?.revision,
    2,
  );
  await assert.rejects(
    database().query(
      "UPDATE ppo.asset_configurations SET description='bad' WHERE id=$1",
      [old[0].id],
    ),
    code("55000"),
  );
  await assert.rejects(
    reviewEquipmentChange(actor, stale.change, {
      ...base(),
      expected_version: 1,
      decision: "Apply",
    }),
    code("VersionConflict"),
  );
  await assert.rejects(
    reviewEquipmentChange(await p("observer"), a.change, apply),
    code("RecordUnavailable"),
  );
});
test("EQ-04 exact relocation guard, old location retained and moved lookup", async () => {
  const { actor, id } = await asset();
  const destination = "70000000-0000-4000-8000-000000000002";
  await assert.rejects(
    database().query(
      "UPDATE ppo.assets SET site_id=$2,version=version+1 WHERE id=$1",
      [id, destination],
    ),
    code("23514"),
  );
  const a = await proposal(id, {
    kind: "Relocate",
    configuration: null,
    site_id: destination,
  });
  await reviewEquipmentChange(actor, a.change, {
    ...base(),
    expected_version: 1,
    decision: "Apply",
  });
  const events = await rows(
    "SELECT * FROM ppo.asset_location_events WHERE asset_id=$1 ORDER BY effective_at",
    [id],
  );
  assert.equal(events.length, 2);
  assert.equal(events[0].to_site_id, CRM.site);
  assert.equal(events[1].from_site_id, CRM.site);
  assert.equal(events[1].to_site_id, destination);
  assert.equal((await equipmentLookup(actor, { q: id })).outcome, "Moved");
  await assert.rejects(
    proposal(id, {
      kind: "Relocate",
      configuration: null,
      site_id: "70000000-0000-4000-8000-000000000003",
    }),
    code("RecordUnavailable"),
  );
});
test("EQ-04 components block retirement; replacement preserves two identities and no warranty transfer", async () => {
  const parent = await asset();
  await asset({ parent_asset_id: parent.id });
  const blocked = await proposal(parent.id, {
    kind: "Retire",
    configuration: null,
  });
  await assert.rejects(
    reviewEquipmentChange(parent.actor, blocked.change, {
      ...base(),
      expected_version: 1,
      decision: "Apply",
    }),
    code("InvalidData"),
  );
  const old = await asset({
      warranty_start: "2026-01-01",
      warranty_end: "2027-01-01",
    }),
    next = await asset();
  const a = await proposal(old.id, {
    kind: "Replace",
    configuration: null,
    successor_id: next.id,
    successor_version: 1,
  });
  await reviewEquipmentChange(old.actor, a.change, {
    ...base(),
    expected_version: 1,
    decision: "Apply",
  });
  const successor = (
    await rows("SELECT * FROM ppo.assets WHERE id=$1", [next.id])
  )[0];
  assert.equal(successor.predecessor_asset_id, old.id);
  assert.equal(successor.warranty_end, null);
  assert.equal(
    (await equipmentLookup(old.actor, { q: old.id })).outcome,
    "Removed",
  );
  const retired = await asset(),
    retire = await proposal(retired.id, {
      kind: "Retire",
      configuration: null,
    });
  await reviewEquipmentChange(retired.actor, retire.change, {
    ...base(),
    expected_version: 1,
    decision: "Apply",
  });
  assert.equal(
    (
      await rows("SELECT lifecycle_status FROM ppo.assets WHERE id=$1", [
        retired.id,
      ])
    )[0].lifecycle_status,
    "Decommissioned",
  );
});
test("EQ-08 backup review stages, independent verification and changed configuration basis", async () => {
  const { actor, id } = await asset(),
    configuration = (await currentConfiguration(
      database(),
      CRM.workspace,
      id,
    ))!;
  const backup = randomUUID();
  const body = {
    ...base(),
    id: backup,
    asset_id: id,
    expected_asset_version: 1,
    configuration_id: configuration.id,
    reference: "SYN backup 45",
    captured_at: "2026-09-02T00:00:00.000Z",
    captured_by: "SYN capture operator",
    custodian: "SYN Engineering",
    source_reference: "SYN protected backup archive",
    source_revision: "r01",
    compatibility: "SYN F1 / H1",
    procedure_reference: "SYN recovery procedure",
    procedure_revision: "r01",
    relationship: "Baseline",
  };
  await assert.rejects(
    createEquipmentEvidence(actor, "backups", {
      ...body,
      source_reference: "password=synthetic-test-value",
    }),
    code("InvalidData"),
  );
  await createEquipmentEvidence(actor, "backups", body);
  const review = (step: string, v: number) => ({
    ...base(),
    expected_review_version: v,
    expected_asset_version: 1,
    configuration_id: configuration.id,
    step,
    result: "Passed",
    evidence_reference: "SYN reviewed evidence",
    evidence_revision: "r01",
    occurred_at: "2026-09-03T00:00:00.000Z",
  });
  await assert.rejects(
    reviewBackup(actor, backup, review("RecoveryVerified", 1)),
    code("InvalidData"),
  );
  await reviewBackup(actor, backup, review("BackupReviewed", 1));
  await reviewBackup(actor, backup, review("ProcedureReviewed", 2));
  await reviewBackup(actor, backup, review("RecoveryTested", 3));
  await assert.rejects(
    reviewBackup(actor, backup, review("RecoveryVerified", 4)),
    code("InvalidData"),
  );
  await reviewBackup(
    await p("cs-reviewer"),
    backup,
    review("RecoveryVerified", 4),
  );
  const change = await proposal(id);
  await reviewEquipmentChange(actor, change.change, {
    ...base(),
    expected_version: 1,
    decision: "Apply",
  });
  const record = (await equipmentEvidence(actor, "backups", { asset_id: id }))
    .items[0];
  assert.equal(record.current_configuration, false);
  assert.equal(record.reviews.length, 4);
  await assert.rejects(
    reviewBackup(actor, backup, {
      ...review("BackupReviewed", 5),
      expected_asset_version: 2,
    }),
    code("StaleSource"),
  );
});
test("EQ-06 candidate is not applicability; per-Asset follow-up, retry and incomplete closure", async () => {
  const { actor, id } = await asset(),
    bulletin = randomUUID();
  await createEquipmentEvidence(actor, "bulletins", {
    ...base(),
    id: bulletin,
    company_id: CRM.company,
    reference: "SYN-BUL-45",
    revision: "r01",
    title: "SYN pump inspection notice",
    source_reference: "SYN supplier notice",
    published_on: "2026-09-01",
    manufacturer: "SYN Equip",
    model: "Pump45",
  });
  const view = await bulletinWorkspace(actor, bulletin);
  assert.ok(view.candidates.some((a) => a.id === id));
  assert.equal(view.reviews.length, 0);
  const review = {
    ...base(),
    expected_version: 1,
    asset_id: id,
    expected_asset_version: 1,
    expected_review_version: 1,
    disposition: "Unknown",
    evidence_reference: "SYN missing serial criterion",
    evidence_revision: "r01",
    owner_id: actor.actor_id,
    due_at: "2026-10-01T00:00:00.000Z",
  };
  const first = await reviewBulletin(actor, bulletin, review);
  assert.deepEqual(
    (await reviewBulletin(actor, bulletin, review)).receipt,
    first.receipt,
  );
  const after = await bulletinWorkspace(actor, bulletin);
  assert.equal(after.reviews.length, 1);
  assert.ok(after.reviews[0].activity_id);
  assert.equal(
    (
      await rows("SELECT * FROM ppo.activity_links WHERE activity_id=$1", [
        after.reviews[0].activity_id,
      ])
    ).length,
    1,
  );
  await assert.rejects(
    closeBulletin(actor, bulletin, { ...base(), expected_version: 1 }),
    code("InvalidData"),
  );
});
test("EQ-07 source-backed Unknown never changes physical lifecycle", async () => {
  const { actor, id } = await asset();
  const before = await rows("SELECT * FROM ppo.assets WHERE id=$1", [id]);
  const input = {
    ...base(),
    id: randomUUID(),
    asset_id: id,
    expected_asset_version: 1,
    source_reference: "Unknown",
    source_revision: "not available",
    source_date: "2026-09-20",
    conclusion: "Unknown",
    uncertainty: "Supplier evidence not available; no inference from age",
  };
  await createEquipmentEvidence(actor, "support", input);
  await assert.rejects(
    createEquipmentEvidence(actor, "support", {
      ...input,
      ...base(),
      id: randomUUID(),
      conclusion: "Discontinued",
    }),
    code("InvalidData"),
  );
  assert.deepEqual(
    await rows("SELECT * FROM ppo.assets WHERE id=$1", [id]),
    before,
  );
});
test("EQ-09 canonical calibration renewal and retrospective withdrawal retain original record", async () => {
  const actor = await p(),
    id = randomUUID(),
    body = {
      ...base(),
      id: randomUUID(),
      company_id: CRM.company,
      instrument_id: id,
      reference: "SYN-INS-EQ45",
      description: "SYN pressure test instrument",
      calibration_reference: "SYN-CAL-45",
      calibration_version: "r01",
      valid_from: "2026-01-01",
      valid_to: "2026-09-10",
      measurement_type: "Pressure",
      measurement_range: "0-10",
      measurement_unit: "bar",
      certificate_reference: "SYN exact certificate",
      certificate_revision: "r01",
    };
  await recordCalibration(actor, body);
  const before = await rows(
    "SELECT * FROM ppo.inspection_instruments WHERE id=$1",
    [id],
  );
  const renewal = {
    ...body,
    ...base(),
    id: randomUUID(),
    instrument_id: randomUUID(),
    predecessor_id: id,
    expected_version: 1,
    calibration_version: "r02",
    valid_from: "2026-09-11",
    valid_to: "2027-09-10",
    certificate_revision: "r02",
  };
  await recordCalibration(actor, renewal);
  assert.deepEqual(
    await rows("SELECT * FROM ppo.inspection_instruments WHERE id=$1", [id]),
    before,
  );
  const list = await equipmentInstruments(actor);
  assert.equal(
    list.items.filter((i) => i.reference === body.reference).length,
    2,
  );
  assert.equal(
    list.items.find((i) => i.id === id)!.current.assessment,
    "InvalidAtUse",
  );
  await recordCalibration(actor, {
    ...base(),
    id: randomUUID(),
    company_id: CRM.company,
    instrument_id: id,
    expected_version: 1,
    withdrawn_effective_from: "2026-08-01",
  });
  const old = (
    await rows("SELECT * FROM ppo.inspection_instruments WHERE id=$1", [id])
  )[0];
  assert.equal(old.calibration_version, "r01");
  assert.equal(old.withdrawn_reason, "SYN I1 behaviour verification");
});
test("EQ migration upgrade across deferred identity backfill, retained originals and repeat seed", async () => {
  await database().query(
    await readFile("db/migrations/0001-recover.sql", "utf8"),
  );
  await database().query("DROP TABLE public.ppo_migrations");
  await migrate(25);
  await seed(25);
  const before = await rows(
    "SELECT row_to_json(a) AS row FROM ppo.assets a ORDER BY id",
  );
  await migrate();
  await seed();
  assert.deepEqual(
    await rows(
      "SELECT row_to_json(a) AS row FROM ppo.assets a WHERE id=ANY($1::uuid[]) ORDER BY id",
      [before.map((r) => r.row.id)],
    ),
    before,
  );
  await seed();
  await migrate();
  assert.equal(
    (await rows("SELECT max(version) AS n FROM public.ppo_migrations"))[0].n,
    45,
  );
});
