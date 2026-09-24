import assert from "node:assert/strict";
import { AppError } from "../../src/platform/errors";
import { before, after, test } from "node:test";
import { reset } from "../../scripts/database";
import { database, closeDatabase } from "../../src/platform/database";
import { localConfig } from "../../src/platform/config";
import { captureEntry } from "../../src/field/entries";
import { saveRecord, recordFact } from "../../src/supply/commands";
import { workspace, recover } from "../../src/supply/reads";
import { started, entry, materialPayload, principal } from "../helpers/field";
import { supplyInput, supplyFact } from "../helpers/supply";
if (localConfig().database_name !== "ppo_synthetic_test")
  throw Error("Use only ppo_synthetic_test");
process.env.PPO_ALLOW_RESET = "dispose-synthetic";
process.env.PPO_RESET_DATABASE = "ppo_synthetic_test";
before(reset);
after(closeDatabase);
test("actual Field parts capture reconciles each issued service-stock unit once; restart retains original receipt", async () => {
  const q = await started(),
    p = await principal();
  const appointment = (
    await database().query(
      "SELECT work_order_id FROM ppo.appointments WHERE id=$1",
      [q.job.id],
    )
  ).rows[0];
  const demand = supplyInput("Demand", {
    data: {
      ...supplyInput().data,
      origin_kind: "WorkOrder",
      origin_id: appointment.work_order_id,
      appointment_id: q.job.id,
    },
  });
  await saveRecord(p, demand);
  const custody = supplyInput("Custody", {
    data: {
      ...supplyInput("Custody").data,
      demand_id: demand.id,
      technician_id: q.p.actor_id,
      appointment_id: q.job.id,
    },
  });
  await saveRecord(p, custody);
  const capture = entry(q.job, "Material", {
    ...materialPayload(),
    item_reference: custody.item,
    quantity: "6",
  });
  await captureEntry(q.p, capture);
  const observed = {
    held: "0",
    at_job: "0",
    used: "6",
    returned: "3",
    damaged: "1",
    quarantined: "0",
    missing: "0",
    field_entry_id: capture.id,
    state: "Closed",
    inventory_reference: "SYN original inventory reconciliation reference",
    inventory_observed_at: new Date().toISOString(),
  };
  await assert.rejects(
    recordFact(
      p,
      custody.id,
      supplyFact("Custody", 1, { ...observed, returned: "2" }),
    ),
    (error: unknown) => error instanceof AppError && error.status === 422 && error.code === "InvalidData" && error.field_errors.some(field => /issued|explain|quantity/i.test(field.message)),
  );
  await assert.rejects(
    recordFact(
      p,
      custody.id,
      supplyFact("Custody", 1, { ...observed, inventory_reference: null }),
    ),
    (error: unknown) => error instanceof AppError && error.status === 422 && error.code === "InvalidData" && error.field_errors.some(field => /inventory|reconcil/i.test(field.message)),
  );
  await assert.rejects(
    recordFact(
      p,
      custody.id,
      supplyFact("Custody", 1, { ...observed, used: "5", returned: "4" }),
    ),
    /capture.*match/i,
  );
  const cmd = supplyFact("Custody", 1, observed),
    saved = await recordFact(p, custody.id, cmd);
  await closeDatabase();
  assert.deepEqual(await recover(p, cmd.operation_id), saved.receipt);
  assert.equal((await recordFact(p, custody.id, cmd)).replayed, true);
  const w = await workspace(p, custody.id);
  assert.equal(w.current_facts[0].data.state, "Closed");
  assert.equal(w.current_facts[0].data.used, "6");
  assert.equal(w.current_facts[0].data.returned, "3");
  assert.equal(
    (
      await database().query(
        "SELECT count(*) n FROM ppo.field_entries WHERE id=$1",
        [capture.id],
      )
    ).rows[0].n,
    "1",
  );
});
