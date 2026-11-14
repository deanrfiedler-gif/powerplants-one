import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { before, after, test } from "node:test";
import { reset } from "../../scripts/database";
import {
  database,
  closeDatabase,
  transaction,
} from "../../src/platform/database";
import { localConfig } from "../../src/platform/config";
import { prepareSupplyReturn } from "../../src/maintenance/supply-return";
import { workspace } from "../../src/maintenance/reads";
import { recoveryCommand } from "../../src/maintenance/recovery";
import { warrantyCommand } from "../../src/maintenance/warranty";
import { readOperation } from "../../src/shared/receipts";
import { saveRecord, recordFact } from "../../src/supply/commands";
import { supplyRecord } from "../../src/supply/context";
import { source, principal, base, rows } from "../helpers/maintenance";
import { supplyFact, supplyInput } from "../helpers/supply";
import { warrantyReturnFixture } from "../helpers/warranty-supply-return";

if (localConfig().database_name !== "ppo_synthetic_test")
  throw Error("Use only ppo_synthetic_test");
process.env.PPO_ALLOW_RESET = "dispose-synthetic";
process.env.PPO_RESET_DATABASE = "ppo_synthetic_test";
before(reset);
after(closeDatabase);
const errorCode =
  (...codes: string[]) =>
  (e: unknown) =>
    codes.includes((e as { code: string }).code);
const refused = errorCode(
  "SourceReviewRequired",
  "VersionConflict",
  "InvalidData",
  "ValidationFailed",
);
const denied = errorCode("Forbidden", "RecordUnavailable", "Unavailable");
const counts = async () =>
  (
    await rows(`SELECT
  (SELECT count(*)::int FROM ppo.supply_records) records,
  (SELECT count(*)::int FROM ppo.maintenance_events) events,
  (SELECT count(*)::int FROM ppo.operation_receipts) receipts,
  (SELECT count(*)::int FROM ppo.audit_events WHERE outcome='Accepted') audit,
  (SELECT count(*)::int FROM ppo.outbox_jobs) jobs`)
  )[0];
const progress = async (f: Awaited<ReturnType<typeof warrantyReturnFixture>>) =>
  (await workspace(f.p, "recovery", f.claimId)).sources.sc08 as Record<
    string,
    unknown
  >;

test("MA07-SC08 one atomic bridge, exact replay and separate native operation recovery", async () => {
  const f = await warrantyReturnFixture(),
    before = await counts();
  assert.equal((await progress(f)).state, "NotPrepared");
  const [a, b] = await Promise.all([
    prepareSupplyReturn(f.p, f.claimId, f.cmd),
    prepareSupplyReturn(f.p, f.claimId, f.cmd),
  ]);
  assert.deepEqual(a.receipt, b.receipt);
  assert.notEqual(a.replayed, b.replayed);
  const after = await counts();
  assert.deepEqual(after, {
    records: before.records + 1,
    events: before.events + 1,
    receipts: before.receipts + 2,
    audit: before.audit + 2,
    jobs: before.jobs + 2,
  });
  assert.deepEqual(await readOperation(f.p, f.cmd.operation_id), a.receipt);
  assert.equal(
    (await readOperation(f.p, f.cmd.supply_operation_id)).record_id,
    f.cmd.return_id,
  );
  assert.equal((await progress(f)).stage, "Prepared");
  assert.equal(
    (
      await rows(
        "SELECT count(*)::int n FROM ppo.supply_facts WHERE record_id=$1",
        [f.cmd.return_id],
      )
    )[0].n,
    0,
  );
  await assert.rejects(
    prepareSupplyReturn(f.p, f.claimId, { ...f.cmd, quantity: "1" }),
    errorCode("OperationConflict"),
  );
  await assert.rejects(
    prepareSupplyReturn(f.p, f.claimId, {
      ...f.cmd,
      ...base(),
      expected_version: 3,
      return_id: randomUUID(),
      supply_operation_id: randomUUID(),
    }),
    refused,
  );
  assert.deepEqual(await counts(), after);
  await assert.rejects(
    database().query(
      "UPDATE ppo.maintenance_events SET reason='rewritten' WHERE record_id=$1",
      [f.claimId],
    ),
  );
});

test("MA07-SC08 competing fresh operations create one return only", async () => {
  const f = await warrantyReturnFixture(),
    before = await counts();
  const outcomes = await Promise.allSettled(
    [
      f.cmd,
      {
        ...f.cmd,
        ...base(),
        return_id: randomUUID(),
        supply_operation_id: randomUUID(),
      },
    ].map((cmd) => prepareSupplyReturn(f.p, f.claimId, cmd)),
  );
  assert.equal(outcomes.filter((r) => r.status === "fulfilled").length, 1);
  assert.equal(outcomes.filter((r) => r.status === "rejected").length, 1);
  assert.equal((await counts()).records, before.records + 1);
});

test("MA07-SC08 exact quantity, source versions and demand identity are enforced without partial writes", async () => {
  const f = await warrantyReturnFixture(),
    before = await counts();
  for (const changes of [
    { quantity: "0" },
    { quantity: "11" },
    { quantity: 2 },
    { quantity: "0.0000001" },
    { expected_version: 1 },
    { expected_case_version: 2 },
    { expected_demand_version: 2 },
    { authorisation_event_id: randomUUID() },
    { delivery_fact_id: randomUUID() },
    { supply_operation_id: f.cmd.operation_id },
  ])
    await assert.rejects(
      prepareSupplyReturn(f.p, f.claimId, { ...f.cmd, ...changes }),
      refused,
    );
  assert.deepEqual(await counts(), before);
  const unrelated = supplyInput("Demand");
  await saveRecord(f.p, unrelated);
  await assert.rejects(
    prepareSupplyReturn(f.p, f.claimId, { ...f.cmd, demand_id: unrelated.id }),
    refused,
  );
  await assert.rejects(
    prepareSupplyReturn(f.p, f.claimId, { ...f.cmd, owner_id: randomUUID() }),
    denied,
  );
  assert.equal(
    (
      await rows("SELECT count(*)::int n FROM ppo.supply_records WHERE id=$1", [
        f.cmd.return_id,
      ])
    )[0].n,
    0,
  );
});

test("MA07-SC08 preserves old external evidence; Received and NotRequired are not imported as custody", async () => {
  const f = await warrantyReturnFixture();
  await recoveryCommand(f.p, f.claimId, {
    ...base(),
    expected_version: 2,
    action: "ReturnEvidence",
    data: {
      stage: "Received",
      reference: "SYN external receipt",
      source_date: "2026-09-03",
      evidence: "External evidence only",
    },
  });
  const before = await counts();
  await assert.rejects(
    prepareSupplyReturn(f.p, f.claimId, { ...f.cmd, expected_version: 3 }),
    refused,
  );
  assert.deepEqual(await counts(), before);
  const detail = await workspace(f.p, "recovery", f.claimId);
  assert.equal(
    detail.history.find((e) => e.action === "ReturnEvidence")!.content
      .receiving_state,
    "SupplyReceivingNotIntegrated",
  );
  assert.equal((detail.sources.sc08 as { state: string }).state, "NotPrepared");
  const unnecessary = await warrantyReturnFixture("NotRequired");
  await assert.rejects(
    prepareSupplyReturn(unnecessary.p, unnecessary.claimId, unnecessary.cmd),
    refused,
  );
});

test("MA07-SC08 source changes block new preparation but retain original lookup and replay", async () => {
  const f = await warrantyReturnFixture();
  const first = await prepareSupplyReturn(f.p, f.claimId, f.cmd);
  await warrantyCommand(f.p, f.id, {
    ...base(),
    expected_version: f.version,
    action: "ReviseSource",
    data: { source: { ...source(), revision: "2" } },
  });
  assert.deepEqual(
    (await prepareSupplyReturn(f.p, f.claimId, f.cmd)).receipt,
    first.receipt,
  );
  assert.deepEqual(await readOperation(f.p, f.cmd.operation_id), first.receipt);
  const next = await warrantyReturnFixture();
  await warrantyCommand(next.p, next.id, {
    ...base(),
    expected_version: next.version,
    action: "ReviseSource",
    data: { source: { ...source(), revision: "2" } },
  });
  await assert.rejects(
    prepareSupplyReturn(next.p, next.claimId, {
      ...next.cmd,
      expected_case_version: next.version + 1,
    }),
    refused,
  );
});

test("MA07-SC08 scope, revoked Supply access and history redaction apply before receipt replay", async () => {
  const f = await warrantyReturnFixture();
  for (const profile of ["observer", "other-workspace", "second-company"])
    await assert.rejects(
      prepareSupplyReturn(await principal(profile), f.claimId, f.cmd),
      denied,
    );
  await prepareSupplyReturn(f.p, f.claimId, f.cmd);
  const grants = await rows(
    "SELECT id,valid_to::text AS valid_to FROM ppo.permission_grants WHERE workspace_id=$1 AND user_id=$2 AND capability IN ('supply.read','supply.return') AND (valid_to IS NULL OR valid_to>clock_timestamp())",
    [f.p.workspace_id, f.p.actor_id],
  );
  assert.ok(grants.length);
  try {
    await database().query(
      "UPDATE ppo.permission_grants SET valid_to=clock_timestamp() WHERE id=ANY($1::uuid[])",
      [grants.map((g) => g.id)],
    );
    const detail = await workspace(f.p, "recovery", f.claimId);
    assert.equal(
      (detail.sources.sc08 as { state: string }).state,
      "Restricted",
    );
    assert.ok(!JSON.stringify(detail).includes(f.cmd.return_id));
    assert.ok(!JSON.stringify(detail).includes(f.demand.id));
    await assert.rejects(prepareSupplyReturn(f.p, f.claimId, f.cmd), denied);
    await assert.rejects(readOperation(f.p, f.cmd.operation_id), denied);
    await assert.rejects(readOperation(f.p, f.cmd.supply_operation_id), denied);
  } finally {
    for (const grant of grants)
      await database().query(
        "UPDATE ppo.permission_grants SET valid_to=$2 WHERE id=$1",
        [grant.id, grant.valid_to],
      );
  }
  assert.equal((await progress(f)).stage, "Prepared");
});

test("MA07-SC08 native partial receipt and disposition stay independent of customer and Finance outcomes", async () => {
  const f = await warrantyReturnFixture();
  await prepareSupplyReturn(f.p, f.claimId, f.cmd);
  let v = 1;
  const fact = async (
    kind: Parameters<typeof supplyFact>[0],
    data: Record<string, string>,
    predecessor_id: string | null = null,
    completeness = "Complete",
  ) => {
    const cmd = { ...supplyFact(kind, v, data), predecessor_id, completeness };
    const r = await recordFact(f.p, f.cmd.return_id, cmd);
    v = r.receipt.record_version;
    return cmd.id;
  };
  await assert.rejects(
    fact("ReturnReceipt", { received: "1", usable: "0", quarantined: "1" }),
    errorCode("InvalidTransition"),
  );
  const proposal = await fact("ReturnAuthorisation", {
    state: "Proposed",
    quantity: "2",
  });
  await fact(
    "ReturnAuthorisation",
    { state: "Approved", quantity: "2" },
    proposal,
  );
  assert.equal((await progress(f)).stage, "Authorised");
  await fact("ReturnReceipt", { received: "1", usable: "0", quarantined: "1" });
  assert.equal((await progress(f)).stage, "PartiallyReceived");
  await fact("ReturnReceipt", { received: "1", usable: "0", quarantined: "1" });
  assert.equal((await progress(f)).received_quantity, "2");
  const proposed = await fact("Disposition", {
    state: "Proposed",
    outcome: "ReturnToSupplier",
    quantity: "2",
  });
  const approved = await fact(
    "Disposition",
    { state: "Approved", outcome: "ReturnToSupplier", quantity: "2" },
    proposed,
  );
  await fact(
    "Disposition",
    { state: "Executed", outcome: "ReturnToSupplier", quantity: "2" },
    approved,
  );
  await fact("SupplierMovement", { quantity: "2" });
  const detail = await workspace(f.p, "recovery", f.claimId);
  assert.equal(
    (detail.sources.sc08 as { stage: string }).stage,
    "DispositionExecuted",
  );
  assert.equal(detail.row.state, "Prepared");
  assert.equal(
    (detail.row as unknown as { credited_minor: string }).credited_minor,
    "0",
  );
  assert.equal((detail.sources.case as { state: string }).state, "Open");
  assert.equal((detail.sources.credits as unknown[]).length, 0);
  await recoveryCommand(f.p, f.claimId, {
    ...base(),
    expected_version: 3,
    action: "ReturnEvidence",
    data: {
      stage: "Received",
      reference: "SYN later external observation",
      source_date: "2026-09-03",
      evidence: "Retained separately from native receiving",
    },
  });
  const later = await workspace(f.p, "recovery", f.claimId);
  assert.equal(
    later.history.at(-1)!.content.receiving_state,
    "ExternalEvidenceOnly",
  );
  assert.equal(
    (later.sources.sc08 as { stage: string }).stage,
    "DispositionExecuted",
  );
});

test("MA07-SC08 incomplete native evidence never yields a complete receiving total", async () => {
  const f = await warrantyReturnFixture();
  await prepareSupplyReturn(f.p, f.claimId, f.cmd);
  await recordFact(f.p, f.cmd.return_id, {
    ...supplyFact("ReturnAuthorisation", 1, {
      state: "Proposed",
      quantity: "2",
    }),
    completeness: "Partial",
  });
  const d = await progress(f);
  assert.equal(d.stage, "EvidenceNeeded");
  assert.equal(d.received_quantity, null);
});

test("MA07-SC08 unknown outcomes remain visible until original native reconciliation", async () => {
  const f = await warrantyReturnFixture();
  await prepareSupplyReturn(f.p, f.claimId, f.cmd);
  const cmd = supplyFact("ExternalOutcome", 1, {
    source_operation: "SYN-return-original",
    effect: "Return",
    state: "Unknown",
    lookup_evidence: "SYN outcome not yet established",
  });
  await recordFact(f.p, f.cmd.return_id, cmd);
  assert.equal((await progress(f)).stage, "OutcomeUnknown");
  assert.equal((await progress(f)).received_quantity, null);
  await assert.rejects(
    recordFact(
      f.p,
      f.cmd.return_id,
      supplyFact("ReturnAuthorisation", 2, {
        state: "Proposed",
        quantity: "2",
      }),
    ),
    errorCode("ReconciliationRequired"),
  );
  await recordFact(f.p, f.cmd.return_id, {
    ...supplyFact("ExternalOutcome", 2, {
      ...cmd.data,
      state: "Absent",
      lookup_evidence: "SYN verified no effect",
    }),
    predecessor_id: cmd.id,
  });
  assert.equal((await progress(f)).stage, "Prepared");
  assert.equal((await progress(f)).received_quantity, "0");
});

test("MA07-SC08 native revisions preserve identity and allow owned coordination changes", async () => {
  const f = await warrantyReturnFixture();
  await prepareSupplyReturn(f.p, f.claimId, f.cmd);
  const row = await transaction((c) => supplyRecord(c, f.p, f.cmd.return_id));
  const original = supplyInput("Return", {
    id: row.id,
    company_id: row.company_id,
    site_id: row.site_id,
    reference: row.reference,
    item: row.item,
    unit: row.unit,
    quantity: "2",
    owner_id: row.owner_id,
    data: row.data,
    source_reference: row.source_reference,
  });
  for (const changes of [
    { quantity: "1" },
    { data: { ...row.data, warranty_reference: "Unrelated" } },
    { source_reference: "Changed" },
  ])
    await assert.rejects(
      saveRecord(f.p, { ...original, expected_version: 1, ...changes }, true),
      refused,
    );
  await saveRecord(
    f.p,
    { ...original, expected_version: 1, next_action: "SYN owned next review" },
    true,
  );
  assert.equal((await progress(f)).version, 2);
});

test("MA07-SC08 bridged demand revisions refuse customer and equipment relinking but allow coordination", async () => {
  const f = await warrantyReturnFixture();
  await prepareSupplyReturn(f.p, f.claimId, f.cmd);
  const row = await supplyRecord(database(), f.p, f.demand.id),
    before = await counts();
  for (const changes of [
    { customer_id: null },
    { asset_id: null },
    { customer_id: null, asset_id: null },
    { asset_id: "80000000-0000-4000-8000-000000000002" },
  ])
    await assert.rejects(
      saveRecord(
        f.p,
        {
          ...f.demand,
          ...base(),
          expected_version: row.version,
          data: { ...row.data, ...changes },
        },
        true,
      ),
      errorCode("SourceReviewRequired"),
    );
  assert.deepEqual(await counts(), before);
  assert.deepEqual(await supplyRecord(database(), f.p, row.id), row);
  const revised = await saveRecord(
    f.p,
    {
      ...f.demand,
      ...base(),
      expected_version: row.version,
      next_action: "SYN confirm receiving appointment",
      data: { ...row.data, required_on: "2026-10-02" },
    },
    true,
  );
  const saved = await supplyRecord(database(), f.p, row.id);
  assert.equal(revised.receipt.record_version, row.version + 1);
  assert.equal(saved.next_action, "SYN confirm receiving appointment");
  assert.equal(saved.data.required_on, "2026-10-02");
  assert.equal(saved.data.customer_id, row.data.customer_id);
  assert.equal(saved.data.asset_id, row.data.asset_id);
  assert.equal((await progress(f)).state, "Available");
  assert.equal((await progress(f)).stage, "Prepared");
});

test("MA07-SC08 reads detect parent demand identity drift outside the native revision command", async () => {
  const f = await warrantyReturnFixture();
  await prepareSupplyReturn(f.p, f.claimId, f.cmd);
  const row = await supplyRecord(database(), f.p, f.demand.id);
  // Simulate a legacy writer; retain the live database guards and exact version advance.
  // The application revision guard is deliberately bypassed to prove read-side defence.
  for (const changes of [
    { customer_id: null },
    { asset_id: null },
    { asset_id: "80000000-0000-4000-8000-000000000002" },
  ]) {
    try {
      await database().query(
        "UPDATE ppo.supply_records SET data=$3::jsonb,version=version+1 WHERE workspace_id=$1 AND id=$2",
        [f.p.workspace_id, row.id, JSON.stringify({ ...row.data, ...changes })],
      );
      const result = await progress(f);
      assert.equal(result.state, "ReviewRequired");
      assert.equal(result.stage, undefined);
      assert.match(String(result.message), /customer and equipment/);
    } finally {
      await database().query(
        "UPDATE ppo.supply_records SET data=$3::jsonb,version=version+1 WHERE workspace_id=$1 AND id=$2",
        [f.p.workspace_id, row.id, JSON.stringify(row.data)],
      );
    }
  }
  assert.equal((await progress(f)).state, "Available");
  assert.equal((await progress(f)).stage, "Prepared");
});

test("MA07-SC08 rejected native authorisation is explicit without receiving or changing claim outcomes", async () => {
  const f = await warrantyReturnFixture();
  await prepareSupplyReturn(f.p, f.claimId, f.cmd);
  const proposal = supplyFact("ReturnAuthorisation", 1, {
    state: "Proposed",
    quantity: "2",
  });
  await recordFact(f.p, f.cmd.return_id, proposal);
  assert.equal((await progress(f)).stage, "Prepared");
  const rejected = {
    ...supplyFact("ReturnAuthorisation", 2, {
      state: "Rejected",
      quantity: "2",
    }),
    predecessor_id: proposal.id,
  };
  await recordFact(f.p, f.cmd.return_id, rejected);
  const result = await progress(f);
  assert.equal(result.state, "Available");
  assert.equal(result.stage, "AuthorisationRejected");
  assert.equal(result.received_quantity, "0");
  assert.equal((result.authorisation as { id: string }).id, rejected.id);
  assert.equal(
    (result.authorisation as { data: { state: string } }).data.state,
    "Rejected",
  );
  assert.equal(
    (await workspace(f.p, "recovery", f.claimId)).row.state,
    "Prepared",
  );
  assert.equal((await workspace(f.p, "cases", f.id)).row.state, "Open");
});

test("MA07-SC08 a used native operation or identity rolls the entire bridge back", async () => {
  const f = await warrantyReturnFixture();
  const before = await counts();
  await assert.rejects(
    prepareSupplyReturn(f.p, f.claimId, {
      ...f.cmd,
      supply_operation_id: f.demand.operation_id,
    }),
    refused,
  );
  await assert.rejects(
    prepareSupplyReturn(f.p, f.claimId, { ...f.cmd, return_id: f.demand.id }),
    errorCode("RelationshipConflict"),
  );
  assert.deepEqual(await counts(), before);
  assert.equal((await progress(f)).state, "NotPrepared");
});
