import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { before, after, test } from "node:test";
import { readFile } from "node:fs/promises";
import { database, closeDatabase } from "../../src/platform/database";
import { localConfig } from "../../src/platform/config";
import { createSession } from "../../src/platform/identity";
import { reset, migrate, seed } from "../../scripts/database";
import {
  saveRecord,
  recordFact,
  allocate,
  sourceReservation,
} from "../../src/supply/commands";
import { workspace, register, recover } from "../../src/supply/reads";
import { uploadEvidence, evidenceBytes } from "../../src/supply/evidence";
import { png } from "../helpers/field";
import { supplyInput, supplyFact, supplyBase } from "../helpers/supply";
import { CRM } from "../helpers/crm";
import { projectInput } from "../helpers/projects";
import { createProject } from "../../src/projects/service";
import { confirmed, id as fixtureId } from "../helpers/packs";
import type { Principal } from "../../src/platform/identity";
import type { Fields, FactKind, RecordKind } from "../../src/supply/model";
if (localConfig().database_name !== "ppo_synthetic_test")
  throw Error("Use only ppo_synthetic_test");
process.env.PPO_ALLOW_RESET = "dispose-synthetic";
process.env.PPO_RESET_DATABASE = "ppo_synthetic_test";
before(reset);
after(closeDatabase);
const actor = async (profile = "coordinator") =>
  (await createSession(profile)).principal;
const code =
  (...values: string[]) =>
  (e: unknown) =>
    values.includes((e as { code: string }).code);
async function create(
  p: Principal,
  kind: RecordKind = "Demand",
  extra: Record<string, unknown> = {},
) {
  const input = supplyInput(kind, extra);
  await saveRecord(p, input);
  return (await workspace(p, input.id)).record;
}
async function fact(
  p: Principal,
  id: string,
  kind: FactKind,
  data: Fields = {},
  predecessor_id: string | null = null,
) {
  const w = await workspace(p, id),
    cmd = { ...supplyFact(kind, w.record.version, data), predecessor_id };
  const result = await recordFact(p, id, cmd);
  return { cmd, result };
}
async function allocation(
  p: Principal,
  did: string,
  sid: string,
  amount = "10",
  basis = "Usable",
) {
  const d = (await workspace(p, did)).record,
    s = (await workspace(p, sid)).record;
  const cmd = {
    ...supplyBase(),
    id: randomUUID(),
    expected_version: null,
    demand_id: did,
    supply_id: sid,
    demand_version: d.version,
    supply_version: s.version,
    quantity: amount,
    unit: d.unit,
    basis,
  };
  await allocate(p, cmd);
  return cmd;
}
async function delivered(p: Principal, amount = "4") {
  const d = await create(p),
    s = await create(p, "Supply");
  await allocation(p, d.id, s.id);
  await fact(p, d.id, "Pick", { quantity: "6" });
  await fact(p, d.id, "Stage", { quantity: "5" });
  const prepared = await fact(p, d.id, "Dispatch", {
    state: "Prepared",
    quantity: amount,
  });
  await fact(
    p,
    d.id,
    "Dispatch",
    {
      state: "Moved",
      quantity: amount,
      movement_at: "2026-09-24T01:00:00.000Z",
    },
    prepared.cmd.id,
  );
  await fact(p, d.id, "Delivery", { quantity: amount });
  return d;
}

test("Supply company/site reads, strict payloads, immutable identity and operation recovery", async () => {
  const p = await actor(),
    input = supplyInput();
  const accepted = await saveRecord(p, input);
  assert.deepEqual((await saveRecord(p, input)).receipt, accepted.receipt);
  assert.equal((await saveRecord(p, input)).replayed, true);
  await assert.rejects(
    saveRecord(p, { ...input, title: "Changed content" }),
    code("OperationConflict"),
  );
  assert.deepEqual(await recover(p, input.operation_id), accepted.receipt);
  for (const profile of ["second-company", "other-workspace"]) {
    const other = await actor(profile);
    await assert.rejects(
      workspace(other, input.id),
      code("RecordUnavailable", "Forbidden"),
    );
  }
  const observer = await actor("observer");
  assert.equal((await workspace(observer, input.id)).capabilities.edit, false);
  await assert.rejects(
    saveRecord(observer, supplyInput()),
    code("RecordUnavailable", "Forbidden"),
  );
  const counts = (
    await database().query(
      "SELECT (SELECT count(*) FROM ppo.audit_events WHERE operation_id=$1) audit,(SELECT count(*) FROM ppo.operation_receipts WHERE operation_id=$1) receipt,(SELECT count(*) FROM ppo.outbox_jobs WHERE operation_id=$1) outbox",
      [input.operation_id],
    )
  ).rows[0];
  assert.deepEqual(counts, { audit: "1", receipt: "1", outbox: "1" });
  await assert.rejects(
    database().query(
      "UPDATE ppo.supply_revisions SET snapshot='{}' WHERE record_id=$1",
      [input.id],
    ),
  );
  const w = (await workspace(p, input.id)).record;
  await assert.rejects(
    saveRecord(
      p,
      {
        ...input,
        ...supplyBase(),
        expected_version: w.version,
        site_id: "70000000-0000-4000-8000-000000000002",
      },
      true,
    ),
    code("InvalidRelationship"),
  );
});
test("Project demand, split shipment and quarantined partial receipt keep readiness blocked", async () => {
  const p = await actor(),
    project = projectInput();
  await createProject(p, project);
  const dinput = supplyInput();
  const d = await create(p, "Demand", {
    data: { ...dinput.data, origin_kind: "Project", origin_id: project.id },
  });
  const sinput = supplyInput("Supply"),
    s = await create(p, "Supply", {
      data: {
        ...sinput.data,
        supply_kind: "Shipment",
        shipment_id: randomUUID(),
        usable: null,
      },
      quantity: "10",
    });
  await fact(p, d.id, "Promise", {
    quantity: "10",
    basis: "SupplierConfirmed",
  });
  await allocation(p, d.id, s.id, "6", "Incoming");
  const d2 = await create(p, "Demand", { quantity: "4" });
  await allocation(p, d2.id, s.id, "4", "Incoming");
  await fact(p, s.id, "Receipt", {
    received: "8",
    inspected: "8",
    damaged: "2",
    quarantined: "3",
    usable: "5",
    short: "2",
  });
  await allocation(p, d.id, s.id, "3");
  await allocation(p, d2.id, s.id, "2");
  const w = await workspace(p, d.id);
  assert.equal(w.basis?.readiness.state, "Blocked");
  assert.equal(w.basis?.usable, "3");
  assert.equal(w.basis?.readiness.shortage, "7");
  await fact(p, d.id, "Assessment", {
    scope:
      "SYN cable line only; excludes technical, site and booking readiness",
  });
  assert.ok(
    (await workspace(p, d.id)).current_facts.find(
      (f) => f.kind === "Assessment",
    )?.data.basis,
  );
  const units = await create(p, "Demand", { unit: "M" });
  await assert.rejects(allocation(p, units.id, s.id, "1"), code("InvalidData"));
});
test("racing allocations conserve one source and failed writes leave no receipt/outbox", async () => {
  const p = await actor(),
    s = await create(p, "Supply", {
      quantity: "5",
      data: { ...supplyInput("Supply").data, usable: "5" },
    }),
    a = await create(p),
    b = await create(p);
  const input = (d: typeof a) => ({
    ...supplyBase(),
    id: randomUUID(),
    expected_version: null,
    demand_id: d.id,
    supply_id: s.id,
    demand_version: 1,
    supply_version: 1,
    quantity: "4",
    unit: "EA",
    basis: "Usable",
  });
  const one = input(a),
    two = input(b);
  const results = await Promise.allSettled([
    allocate(p, one),
    allocate(p, two),
  ]);
  assert.equal(results.filter((r) => r.status === "fulfilled").length, 1);
  assert.equal(
    (
      await database().query(
        "SELECT sum(quantity)::text n FROM ppo.supply_allocations WHERE supply_id=$1",
        [s.id],
      )
    ).rows[0].n,
    "4",
  );
  const failed = results[0].status === "rejected" ? one : two;
  assert.equal(
    (
      await database().query(
        "SELECT 1 FROM ppo.operation_receipts WHERE operation_id=$1",
        [failed.operation_id],
      )
    ).rowCount,
    0,
  );
  await assert.rejects(sourceReservation(p, a.id), code("NotConfigured"));
});
test("pick, stage, partial movement and partial delivery retain exact outstanding and corrections", async () => {
  const p = await actor(),
    d = await delivered(p);
  let w = await workspace(p, d.id);
  assert.deepEqual(w.fulfilment, {
    picked: "6",
    staged: "5",
    moved: "4",
    delivered: "4",
    outstanding: "6",
  });
  const original = w.current_facts.find((f) => f.kind === "Delivery")!;
  await fact(
    p,
    d.id,
    "Delivery",
    { ...original.data, quantity: "3" },
    original.id,
  );
  w = await workspace(p, d.id);
  assert.equal(w.fulfilment?.outstanding, "7");
  assert.equal(w.facts.find((f) => f.id === original.id)?.data.quantity, "4");
  await assert.rejects(
    fact(p, d.id, "Delivery", { quantity: "2" }),
    code("InvalidRelationship"),
  );
  const stale = supplyFact("Pick", 1, { quantity: "1" });
  await assert.rejects(recordFact(p, d.id, stale), code("VersionConflict"));
});
test("customer remedy completes independently of supplier recovery, with remaining-return and restricted credits", async () => {
  const p = await actor(),
    d = await delivered(p);
  const data = {
    ...supplyInput("Return").data,
    demand_id: d.id,
    identity_status: "Verified",
    direction: "Customer",
  };
  const r = await create(p, "Return", { quantity: "2", data });
  await assert.rejects(
    create(p, "Return", { quantity: "3", data }),
    code("InvalidRelationship"),
  );
  const proposed = await fact(p, r.id, "ReturnAuthorisation", {
    quantity: "2",
    state: "Proposed",
  });
  await fact(
    p,
    r.id,
    "ReturnAuthorisation",
    { quantity: "2", state: "Approved" },
    proposed.cmd.id,
  );
  await fact(p, r.id, "ReturnReceipt", {
    received: "2",
    usable: "0",
    quarantined: "2",
  });
  const dp = await fact(p, r.id, "Disposition", {
    state: "Proposed",
    outcome: "Replace",
    quantity: "2",
  });
  const approved = await fact(
    p,
    r.id,
    "Disposition",
    { state: "Approved", outcome: "Replace", quantity: "2" },
    dp.cmd.id,
  );
  await fact(
    p,
    r.id,
    "Disposition",
    { state: "Executed", outcome: "Replace", quantity: "2" },
    approved.cmd.id,
  );
  await fact(p, r.id, "CustomerOutcome", { state: "Complete" });
  await fact(p, r.id, "Claim", { state: "Open" });
  const w = await workspace(p, r.id);
  assert.equal(
    w.current_facts.find((f) => f.kind === "CustomerOutcome")?.data.state,
    "Complete",
  );
  assert.equal(
    w.current_facts.find((f) => f.kind === "Claim")?.data.state,
    "Open",
  );
  const finance = await actor("finance-reconciler");
  await recordFact(finance, r.id, {
    ...supplyFact("Credit", w.record.version, {
      amount: "45.25",
      erp_reference: "SYN-FINANCE-PRIVATE-CANARY",
    }),
    reason: "SYN-FINANCE-REASON-CANARY",
  });
  assert.match(
    JSON.stringify(await workspace(finance, r.id)),
    /SYN-FINANCE-(PRIVATE|REASON)-CANARY/,
  );
  assert.doesNotMatch(
    JSON.stringify(await workspace(p, r.id)),
    /SYN-FINANCE-(PRIVATE|REASON)-CANARY/,
  );
  assert.doesNotMatch(
    JSON.stringify(await register(p, { q: "SYN-FINANCE-PRIVATE-CANARY" })),
    /SYN-FINANCE-PRIVATE-CANARY/,
  );
});
test("unknown source outcome reconciles the original operation and idempotent replay never repeats effect", async () => {
  const p = await actor(),
    d = await create(p);
  const unknown = await fact(p, d.id, "ExternalOutcome", {
    source_operation: "SYN-ORIGINAL-TRANSFER",
    effect: "Transfer",
    state: "Unknown",
  });
  await assert.rejects(
    fact(p, d.id, "Promise", { quantity: "10" }),
    code("ReconciliationRequired"),
  );
  await assert.rejects(
    fact(
      p,
      d.id,
      "ExternalOutcome",
      {
        source_operation: "SYN-NEW-TRANSFER",
        effect: "Transfer",
        state: "Confirmed",
      },
      unknown.cmd.id,
    ),
    code("InvalidTransition"),
  );
  const reconciled = await fact(
    p,
    d.id,
    "ExternalOutcome",
    {
      source_operation: "SYN-ORIGINAL-TRANSFER",
      effect: "Transfer",
      state: "Confirmed",
    },
    unknown.cmd.id,
  );
  assert.equal((await recordFact(p, d.id, reconciled.cmd)).replayed, true);
  assert.equal(
    (await workspace(p, d.id)).current_facts.filter(
      (f) => f.kind === "ExternalOutcome",
    ).length,
    1,
  );
});
test("Service promise delay creates one owned impact and preserves confirmed appointment", async () => {
  const p = await actor(),
    appointment = await confirmed();
  const before = (
    await database().query(
      "SELECT to_jsonb(a) value FROM ppo.appointments a WHERE id=$1",
      [appointment.id],
    )
  ).rows[0].value;
  const d = await create(p, "Demand", {
    data: {
      ...supplyInput().data,
      origin_kind: "WorkOrder",
      origin_id: appointment.work_order_id,
      appointment_id: appointment.id,
    },
  });
  const promise = await fact(p, d.id, "Promise", {
    quantity: "10",
    promised_on: "2026-10-10",
    basis: "SupplierConfirmed",
  });
  await recordFact(p, d.id, promise.cmd);
  const w = await workspace(p, d.id),
    impact = w.current_facts.filter((f) => f.kind === "Impact");
  assert.equal(impact.length, 1);
  assert.ok(impact[0].activity_id);
  assert.deepEqual(
    (
      await database().query(
        "SELECT to_jsonb(a) value FROM ppo.appointments a WHERE id=$1",
        [appointment.id],
      )
    ).rows[0].value,
    before,
  );
  assert.equal(
    (
      await database().query(
        "SELECT count(*) n FROM ppo.activities WHERE id=$1",
        [impact[0].activity_id],
      )
    ).rows[0].n,
    "1",
  );
});
test("exact durable photo is scoped, hashed and replayable", async () => {
  const p = await actor(),
    s = await create(p, "Supply"),
    bytes = png();
  const input = {
    ...supplyBase(),
    id: randomUUID(),
    expected_version: 1,
    caption: "SYN inspection",
    content_base64: bytes.toString("base64"),
  };
  const result = await uploadEvidence(p, s.id, input);
  assert.deepEqual(Buffer.from(await evidenceBytes(p, input.id)), bytes);
  assert.equal((await uploadEvidence(p, s.id, input)).replayed, true);
  assert.equal(result.receipt.record_version, 2);
  await assert.rejects(
    evidenceBytes(await actor("second-company"), input.id),
    code("RecordUnavailable"),
  );
});
test("reseed and upgrade preserve exact original records, revisions and revoked grants", async () => {
  const original = (
    await database().query(
      "SELECT jsonb_agg(to_jsonb(r) ORDER BY id) value FROM ppo.supply_records r",
    )
  ).rows[0].value;
  await database().query(
    "UPDATE ppo.permission_grants SET valid_to=clock_timestamp() WHERE user_id=$1 AND capability='supply.inspect'",
    [CRM.owner],
  );
  await database().query(await readFile("db/seed-supply.sql", "utf8"));
  await seed();
  await migrate();
  assert.deepEqual(
    (
      await database().query(
        "SELECT jsonb_agg(to_jsonb(r) ORDER BY id) value FROM ppo.supply_records r",
      )
    ).rows[0].value,
    original,
  );
  assert.equal(
    (
      await database().query(
        "SELECT 1 FROM ppo.permission_grants WHERE user_id=$1 AND capability='supply.inspect' AND valid_to IS NULL",
        [CRM.owner],
      )
    ).rowCount,
    0,
  );
  assert.ok(
    (await readFile("db/migrations/0049-supply-chain.sql", "utf8")).includes(
      "SET CONSTRAINTS ppo.identity_target IMMEDIATE",
    ),
  );
  assert.equal(fixtureId("a8", 9).length, 36);
});
