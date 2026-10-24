import assert from "node:assert/strict";
import { after, test } from "node:test";
import { randomUUID } from "node:crypto";
import { migrate, seed } from "../../scripts/database";
import { database, closeDatabase } from "../../src/platform/database";
import { localConfig } from "../../src/platform/config";
import { attemptHash, planHash } from "../../src/inspections/service";
import { evaluate, type CheckDefinition } from "../../src/inspections/model";
import { recoverSchema } from "../helpers/recover-schema";
import { inspectionFixture, rows } from "../helpers/service-inspections";

if (localConfig().database_name !== "ppo_synthetic_test")
  throw Error("Use only ppo_synthetic_test");
after(closeDatabase);
test("0115 preserves populated legacy attempts, instrument snapshots, hashes and ledger without inferred attribution", async () => {
  await recoverSchema();
  await rows("DROP TABLE IF EXISTS public.ppo_migrations");
  await migrate(113);
  await seed(113);
  const f = await inspectionFixture(),
    id = randomUUID();
  const appointment = (
    await rows("SELECT * FROM ppo.appointments WHERE id=$1", [f.id])
  )[0];
  const d: CheckDefinition = {
    key: "legacy-pressure",
    name: "SYN legacy pressure",
    check_type: "Numeric",
    required: true,
    numeric: {
      unit: "kPa",
      precision: 1,
      lower: "100",
      lower_inclusive: true,
      upper: "200",
      upper_inclusive: true,
      conversions: [],
    },
    qualitative: null,
    condition: null,
    evidence_min: 0,
    instrument_required: true,
    scope_key: null,
    witness: "None",
    criterion_source_id: null,
  };
  const reading = {
    check_key: d.key,
    state: "Recorded" as const,
    value: "120",
    unit: "kPa",
    choice: null,
    reason: null,
    note: null,
    evidence_ids: [],
  };
  const result = {
    check_key: d.key,
    entry_state: reading.state,
    raw_value: reading.value,
    unit: reading.unit,
    choice: null,
    reason: null,
    note: null,
  };
  const instrument_id = "e9550000-0000-4000-8000-000000000003";
  const snapshot = (
    await rows(
      "SELECT to_jsonb(i)-'id'-'workspace_id'-'company_id' AS value FROM ppo.inspection_instruments i WHERE id=$1",
      [instrument_id],
    )
  )[0].value;
  const basis = {
    plan_hash: planHash([d]),
    scope_keys: [],
    check_keys: [d.key],
    configuration_reference: "SYN legacy configuration",
    configuration_source_id: null,
    performer_id: f.tech.actor_id,
    occurred_at: new Date().toISOString(),
    timezone: appointment.site_timezone,
    clock_concern: null,
    prerequisites: [],
    findings: "SYN retained legacy evidence",
  };
  const hash = attemptHash(basis, [result], [{ instrument_id, snapshot }], []);
  await rows(
    `INSERT INTO ppo.inspection_attempts(id,workspace_id,company_id,site_id,host_type,host_id,created_by,updated_by,attempt_number,plan_source,plan,plan_hash,scope_keys,check_keys,configuration_reference,performer_id,occurred_at,timezone,prerequisites,findings,content_hash)
    VALUES($1,$2,$3,$4,'ServiceAppointment',$5,$6,$6,1,$7,$8,$9,'[]',$10,$11,$6,$12,$13,'[]',$14,$15)`,
    [
      id,
      f.tech.workspace_id,
      appointment.company_id,
      appointment.site_id,
      f.id,
      f.tech.actor_id,
      JSON.stringify({
        type: "Synthetic",
        id: randomUUID(),
        reference: "SYN legacy",
        hash: basis.plan_hash,
      }),
      JSON.stringify([d]),
      basis.plan_hash,
      JSON.stringify([d.key]),
      basis.configuration_reference,
      basis.occurred_at,
      basis.timezone,
      basis.findings,
      hash,
    ],
  );
  await rows(
    "INSERT INTO ppo.inspection_results(id,workspace_id,company_id,attempt_id,check_key,entry_state,raw_value,unit,evaluation,rule_version) VALUES($1,$2,$3,$4,$5,'Recorded','120','kPa',$6,'service-inspection-rules-1')",
    [
      randomUUID(),
      f.tech.workspace_id,
      appointment.company_id,
      id,
      d.key,
      evaluate(d, reading).evaluation,
    ],
  );
  await rows(
    "INSERT INTO ppo.inspection_instrument_uses(workspace_id,company_id,attempt_id,instrument_id,snapshot) VALUES($1,$2,$3,$4,$5)",
    [
      f.tech.workspace_id,
      appointment.company_id,
      id,
      instrument_id,
      JSON.stringify(snapshot),
    ],
  );
  await rows(
    "UPDATE ppo.inspection_attempts SET version=version+1,state='Submitted',submitted_hash=content_hash,submitted_at=clock_timestamp(),submitted_by=$2,received_at=clock_timestamp(),submit_operation_id=$3 WHERE id=$1",
    [id, f.tech.actor_id, randomUUID()],
  );
  const snapshotTables = () =>
    Promise.all(
      [
        "inspection_results",
        "inspection_instrument_uses",
        "inspection_reviews",
        "service_inspection_outputs",
        "permission_grants",
        "seed_receipts",
      ].map((t) =>
        rows(
          `SELECT to_jsonb(t) AS row FROM ppo.${t} t${t === "seed_receipts" ? " WHERE t.version <> 120" : ""} ORDER BY to_jsonb(t)::text`,
        ),
      ),
    );
  const before = await snapshotTables(),
    original = (
      await rows(
        "SELECT to_jsonb(a) AS row FROM ppo.inspection_attempts a WHERE id=$1",
        [id],
      )
    )[0].row;
  const ledger = await rows(
    "SELECT * FROM public.ppo_migrations ORDER BY version",
  );
  await migrate();
  await seed();
  await migrate();
  await seed();
  assert.deepEqual(await snapshotTables(), before);
  assert.deepEqual((await database().query("SELECT version FROM ppo.seed_receipts WHERE version=120")).rows, [{version:120}]);
  const upgraded = (
    await rows(
      "SELECT to_jsonb(a) AS row FROM ppo.inspection_attempts a WHERE id=$1",
      [id],
    )
  )[0].row;
  assert.equal(upgraded.reading_instrument_version, 0);
  delete upgraded.reading_instrument_version;
  assert.deepEqual(upgraded, original);
  assert.equal(
    attemptHash(basis, [result], [{ instrument_id, snapshot }], []),
    original.submitted_hash,
  );
  assert.deepEqual(
    await rows("SELECT * FROM ppo.inspection_reading_instruments"),
    [],
  );
  assert.deepEqual(
    await rows(
      "SELECT * FROM public.ppo_migrations WHERE version<=113 ORDER BY version",
    ),
    ledger,
  );
  assert.deepEqual(
    await rows(
      "SELECT version FROM public.ppo_migrations WHERE version>113 ORDER BY version",
    ),
    [{ version: 114 }, { version: 115 }, { version: 116 }, { version: 117 }, { version: 120 }],
  );
  await assert.rejects(
    database().query(
      "INSERT INTO ppo.inspection_reading_instruments(workspace_id,company_id,attempt_id,check_key,instrument_id) VALUES($1,$2,$3,$4,$5)",
      [f.tech.workspace_id, appointment.company_id, id, d.key, instrument_id],
    ),
    (e: unknown) => (e as { code: string }).code === "55000",
  );
});
