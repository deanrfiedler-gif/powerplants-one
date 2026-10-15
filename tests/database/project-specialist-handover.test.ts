import assert from "node:assert/strict";
import { after, beforeEach, test } from "node:test";
import { randomUUID } from "node:crypto";
import { reset } from "../../scripts/database";
import {
  database,
  closeDatabase,
  transaction,
} from "../../src/platform/database";
import { localConfig } from "../../src/platform/config";
import { createSession } from "../../src/platform/identity";
import { canonical } from "../../src/platform/operations";
import { sha256 } from "../../src/engineering/materials/context";
import {
  handoverCommand,
  sourceCommand,
  releaseCommand,
} from "../../src/engineering/materials/commands";
import {
  readHandovers,
  readHistory,
  readRegister,
} from "../../src/engineering/materials/reads";
import { readOperation } from "../../src/shared/receipts";
import { coordinateEngineering } from "../../src/engineering/service";
import { engineeringUpdate } from "../helpers/engineering";
import {
  specialistHandoverFixture,
  handoverAction,
} from "../helpers/project-specialist-handover";
if (localConfig().database_name !== "ppo_synthetic_test")
  throw Error("Only disposable ppo_synthetic_test");
process.env.PPO_ALLOW_RESET = "dispose-synthetic";
process.env.PPO_RESET_DATABASE = "ppo_synthetic_test";
beforeEach(reset);
after(closeDatabase);
const code = (name: string) => (error: unknown) =>
  (error as { code: string }).code === name;
const rows = async (sql: string, values: unknown[] = []) =>
  (await database().query(sql, values)).rows;
const snapshot = async (
  tables = [
    "material_handovers",
    "material_events",
    "operation_receipts",
    "audit_events",
    "outbox_jobs",
    "business_identities",
  ],
) =>
  Promise.all(
    tables.map((t) =>
      rows(`SELECT to_jsonb(x) row FROM ppo.${t} x ORDER BY to_jsonb(x)::text`),
    ),
  );

test("PJ06-R2-01 exact accepted brief travels with native release, original units, independent outcome and original receipts", async () => {
  const f = await specialistHandoverFixture(),
    id = f.prepare.id as string,
    engineering = f.engineering.id;
  const preserved = [
    "project_specialist_events",
    "project_commercial_events",
    "material_releases",
    "material_release_lines",
    "material_lines",
    "supply_records",
    "supply_facts",
  ];
  const before = await snapshot(preserved);
  const prepared = await handoverCommand(f.owner, engineering, f.prepare);
  const send = handoverAction({
    action: "send",
    handover_id: id,
    expected_version: 1,
  });
  await handoverCommand(f.owner, engineering, send);
  const decide = handoverAction({
    action: "decide",
    handover_id: id,
    expected_version: 2,
    result: "Accepted",
  });
  await assert.rejects(
    handoverCommand(f.owner, engineering, decide),
    code("Forbidden"),
  );
  const concurrent = await Promise.all([
    handoverCommand(f.receiver, engineering, decide),
    handoverCommand(f.receiver, engineering, decide),
  ]);
  assert.deepEqual(concurrent.map((r) => r.replayed).sort(), [false, true]);
  assert.deepEqual(concurrent[0].receipt, concurrent[1].receipt);
  const detail = await readHandovers(f.receiver, engineering, {
    set: f.set,
    handover_id: id,
  });
  const payload = detail.selected!.payload!;
  assert.equal(payload.schema_version, 2);
  assert.deepEqual(payload.specialist, {
    id: f.package.id,
    version: 3,
    source_hash: (
      await rows(
        "SELECT source_hash FROM ppo.project_specialist_events WHERE package_id=$1 AND version=3",
        [f.package.id],
      )
    )[0].source_hash,
    accept_operation_id: (
      await rows(
        "SELECT operation_id FROM ppo.project_specialist_events WHERE package_id=$1 AND version=3",
        [f.package.id],
      )
    )[0].operation_id,
    content: f.package.content,
  });
  assert.deepEqual(
    [
      payload.lines[0].quantity,
      payload.lines[0].unit,
      payload.lines[0].procurement!.quantity,
      payload.lines[0].procurement!.unit,
    ],
    ["120", "M", "4", "PACK"],
  );
  assert.equal(sha256(payload), detail.selected!.payload_hash);
  assert.equal(detail.selected!.specialist_source_status, "Current");
  assert.deepEqual(await snapshot(preserved), before);
  const final = await snapshot();
  assert.deepEqual(
    (await handoverCommand(f.owner, engineering, f.prepare)).receipt,
    prepared.receipt,
  );
  assert.deepEqual(
    await readOperation(f.receiver, decide.operation_id),
    concurrent[0].receipt,
  );
  await assert.rejects(
    handoverCommand(f.receiver, engineering, {
      ...decide,
      reason: "SYN changed content",
    }),
    code("OperationConflict"),
  );
  assert.deepEqual(await snapshot(), final);
});

test("PJ06-R2-02 inaccessible specialist sources withhold native lists, history, footer and recovery without leaking counts", async () => {
  const f = await specialistHandoverFixture(),
    id = f.prepare.id as string,
    engineering = f.engineering.id;
  const other = (await createSession("second-company")).principal;
  await assert.rejects(
    handoverCommand(other, engineering, f.prepare),
    code("RecordUnavailable"),
  );
  await handoverCommand(f.owner, engineering, f.prepare);
  const before = await snapshot();
  await rows(
    "UPDATE ppo.permission_grants SET valid_to=clock_timestamp() WHERE user_id=$1 AND capability='project.specialist.read'",
    [f.owner.actor_id],
  );
  assert.deepEqual(
    (await readHandovers(f.owner, engineering, { set: f.set })).items,
    [],
  );
  await assert.rejects(
    readHandovers(f.owner, engineering, { set: f.set, handover_id: id }),
    code("RecordUnavailable"),
  );
  assert.deepEqual(
    (
      await readHistory(f.owner, engineering, {
        set: f.set,
        subject: "MaterialHandover",
      })
    ).events,
    [],
  );
  assert.equal(
    (
      await readHistory(f.owner, engineering, {
        set: f.set,
        subject: "MaterialHandover",
      })
    ).has_more,
    false,
  );
  assert.equal(
    (await readRegister(f.owner, engineering, { set: f.set })).footer!
      .supply_handover,
    "Not prepared",
  );
  await assert.rejects(
    readOperation(f.owner, f.prepare.operation_id),
    code("RecordUnavailable"),
  );
  await assert.rejects(
    handoverCommand(f.owner, engineering, f.prepare),
    code("Forbidden"),
  );
  assert.deepEqual(await snapshot(), before);
});

test("PJ06-R2-03 unaccepted and stale sources block new use; native return and original recovery preserve evidence", async () => {
  const f = await specialistHandoverFixture(),
    id = f.prepare.id as string,
    engineering = f.engineering.id;
  const before = await snapshot();
  await assert.rejects(
    handoverCommand(f.owner, engineering, {
      ...f.prepare,
      specialist: { id: f.package.id, version: 2 },
    }),
    code("RecordUnavailable"),
  );
  await assert.rejects(
    handoverCommand(f.owner, engineering, {
      ...f.prepare,
      specialist: { id: randomUUID(), version: 3 },
    }),
    code("RecordUnavailable"),
  );
  assert.deepEqual(await snapshot(), before);
  const saved = await handoverCommand(f.owner, engineering, f.prepare);
  await sourceCommand(
    f.owner,
    engineering,
    handoverAction({ action: "withdraw", source_id: f.sources.demand }),
  );
  await assert.rejects(
    handoverCommand(
      f.owner,
      engineering,
      handoverAction({ action: "send", handover_id: id, expected_version: 1 }),
    ),
    code("HandoverBlocked"),
  );
  assert.deepEqual(
    (await handoverCommand(f.owner, engineering, f.prepare)).receipt,
    saved.receipt,
  );
});

test("PJ06-R2-04 accepted native outcome cannot follow withdrawn release; return and successor lineage remain exact", async () => {
  const f = await specialistHandoverFixture(),
    id = f.prepare.id as string,
    engineering = f.engineering.id;
  await handoverCommand(f.owner, engineering, f.prepare);
  await handoverCommand(
    f.owner,
    engineering,
    handoverAction({ action: "send", handover_id: id, expected_version: 1 }),
  );
  await releaseCommand(
    f.releaser,
    engineering,
    handoverAction({
      action: "withdraw",
      release_id: f.release,
      expected_version: 5,
    }),
  );
  const before = await snapshot();
  await assert.rejects(
    handoverCommand(
      f.receiver,
      engineering,
      handoverAction({
        action: "decide",
        handover_id: id,
        expected_version: 2,
        result: "Accepted",
      }),
    ),
    code("HandoverBlocked"),
  );
  assert.deepEqual(await snapshot(), before);
  const returned = handoverAction({
    action: "decide",
    handover_id: id,
    expected_version: 2,
    result: "Returned",
    reasons: [{ line_id: f.line, reason: "SYN withdrawn technical release" }],
    owner_id: f.owner.actor_id,
    due: "2031-10-01",
  });
  const saved = await handoverCommand(f.receiver, engineering, returned);
  assert.deepEqual(
    await readOperation(f.receiver, returned.operation_id),
    saved.receipt,
  );
});

test("PJ06-R2-05 native database rejects forged exact briefs, quantities, hashes and reference replacement; transaction rollback is exact", async () => {
  const f = await specialistHandoverFixture(),
    engineering = f.engineering.id;
  await handoverCommand(f.owner, engineering, f.prepare);
  const before = await snapshot(),
    row = (
      await rows("SELECT * FROM ppo.material_handovers WHERE id=$1", [
        f.prepare.id,
      ])
    )[0];
  assert.equal(
    (
      await rows("SELECT ppo.specialist_handover_json($1::jsonb) AS value", [
        JSON.stringify(row.payload),
      ])
    )[0].value,
    canonical(row.payload),
  );
  for (const patch of [
    {
      payload: {
        ...row.payload,
        specialist: { ...row.payload.specialist, source_hash: "0".repeat(64) },
      },
    },
    {
      payload: {
        ...row.payload,
        lines: [{ ...row.payload.lines[0], quantity: "119" }],
      },
    },
    { payload_hash: "0".repeat(64) },
    { specialist_version: 2 },
  ])
    await assert.rejects(
      transaction(async (c) => {
        const forged = { ...row, ...patch, id: randomUUID(), revision: 2 };
        if (patch.payload) forged.payload_hash = sha256(forged.payload);
        await c.query(
          "INSERT INTO ppo.material_handovers SELECT (jsonb_populate_record(NULL::ppo.material_handovers,$1)).*",
          [JSON.stringify(forged)],
        );
      }),
      code("23514"),
    );
  await assert.rejects(
    transaction(async (c) => {
      await c.query(
        "UPDATE ppo.material_handovers SET version=version+1,specialist_package_id=NULL,specialist_version=NULL WHERE id=$1",
        [row.id],
      );
    }),
    code("55000"),
  );
  assert.deepEqual(await snapshot(), before);
});

test("PJ06-R2-06 changed brief sources block acceptance while historical payload and explicit return survive", async () => {
  const f = await specialistHandoverFixture(),
    id = f.prepare.id as string,
    engineering = f.engineering.id;
  const saved = await handoverCommand(f.owner, engineering, f.prepare);
  await handoverCommand(
    f.owner,
    engineering,
    handoverAction({ action: "send", handover_id: id, expected_version: 1 }),
  );
  const original = (
    await readHandovers(f.receiver, engineering, {
      set: f.set,
      handover_id: id,
    })
  ).selected!.payload;
  await coordinateEngineering(f.owner, engineering, engineeringUpdate(1));
  const before = await snapshot();
  await assert.rejects(
    handoverCommand(
      f.receiver,
      engineering,
      handoverAction({
        action: "decide",
        handover_id: id,
        expected_version: 2,
        result: "Accepted",
      }),
    ),
    code("SpecialistSourceChanged"),
  );
  assert.deepEqual(
    (await handoverCommand(f.owner, engineering, f.prepare)).receipt,
    saved.receipt,
  );
  const detail = (
    await readHandovers(f.receiver, engineering, {
      set: f.set,
      handover_id: id,
    })
  ).selected!;
  assert.equal(detail.specialist_source_status, "Changed");
  assert.deepEqual(detail.payload, original);
  assert.deepEqual(await snapshot(), before);
  await handoverCommand(
    f.receiver,
    engineering,
    handoverAction({
      action: "decide",
      handover_id: id,
      expected_version: 2,
      result: "Returned",
      reasons: [{ line_id: null, reason: "SYN changed source" }],
      owner_id: f.owner.actor_id,
      due: "2031-10-01",
    }),
  );
});
