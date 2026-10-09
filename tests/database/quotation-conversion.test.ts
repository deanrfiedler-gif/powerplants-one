import assert from "node:assert/strict";
import { before, after, test } from "node:test";
import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { database, closeDatabase } from "../../src/platform/database";
import { localConfig } from "../../src/platform/config";
import { reset, migrate, seed } from "../../scripts/database";
import { createSession } from "../../src/platform/identity";
import { readConversion } from "../../src/estimating/conversion/reads";
import {
  receiveQuotation,
  resolveQuotationItem,
  reviewConversionPlan,
  executeConversion,
} from "../../src/estimating/conversion/service";
import { readOperation } from "../../src/shared/receipts";
import { decimal } from "../../src/supply/model";
import { supplyRecord } from "../../src/supply/context";
import { draftBytes, retryQuote } from "../../src/estimating/worker";
import {
  plannedFixture,
  conversionFixture,
  conversion,
  receiving,
  resolution,
  plan,
} from "../helpers/quotation-conversion";
import { recordResponse } from "../../src/estimating/response/service";
import { readResponse } from "../../src/estimating/response/reads";
import { response } from "../helpers/quotation-response";
if (localConfig().database_name !== "ppo_synthetic_test")
  throw Error("Disposable ppo_synthetic_test only");
process.env.PPO_ALLOW_RESET = "dispose-synthetic";
process.env.PPO_RESET_DATABASE = "ppo_synthetic_test";
before(reset);
after(closeDatabase);
const code = (s: string) => (e: unknown) => (e as { code: string }).code === s;
test("ES07 exact receiving and reviewed real demand conversion retain commercial evidence, native receipts and immutable originals", async () => {
  const f = await plannedFixture();
  await retryQuote(f.owner, f.draft.id);
  const issued = await draftBytes(f.owner, f.id),
    draft = await draftBytes(f.owner, f.draft.id),
    cmd = conversion(f.d);
  const r = await executeConversion(f.owner, f.id, cmd),
    d = await readConversion(f.owner, f.id);
  assert.equal(d.targets.length, 1);
  assert.equal(d.source_lines.length, 3);
  const t = d.targets[0];
  assert.equal(t.current.quantity, "2");
  assert.equal(t.current.unit, "each");
  assert.equal(t.current.kind, "Demand");
  assert.equal(t.current.data.demand_class, "Forecast");
  assert.equal(t.line_id, d.lines[0].source.id);
  assert.equal(t.plan_id, f.d.plan!.id);
  assert.equal(t.current.data.quote_reference, d.issue.id);
  assert.deepEqual(f.d.plan!.plan!.basis.commercial, d.revision.snapshot);
  assert.equal(d.receiving!.created_by, f.owner.actor_id);
  assert.equal(d.receiving!.receiving!.decision, "Received");
  assert.deepEqual(
    (await executeConversion(f.owner, f.id, cmd)).receipt,
    r.receipt,
  );
  assert.deepEqual(await readOperation(f.owner, cmd.operation_id), r.receipt);
  const child = f.d.plan!.plan!.commands[0];
  assert.equal(
    (await readOperation(f.owner, child.operation_id)).record_id,
    t.target_id,
  );
  await assert.rejects(
    executeConversion(f.owner, f.id, { ...cmd, reason: "Changed input" }),
    code("OperationConflict"),
  );
  await assert.rejects(
    executeConversion(f.owner, f.id, {
      ...conversion(d),
      operation_id: randomUUID(),
    }),
    code("ConversionConflict"),
  );
  for (const table of ["quote_conversion_events", "quote_conversion_targets"]) {
    await assert.rejects(
      database().query(`DELETE FROM ppo.${table} WHERE revision_id=$1`, [f.id]),
      code("55000"),
    );
  }
  assert.deepEqual(await draftBytes(f.owner, f.id), issued);
  assert.deepEqual(await draftBytes(f.owner, f.draft.id), draft);
});
test("ES07 multiple product quantities survive unrelated saved-estimate changes without invalidating the issued offer", async () => {
  const f = await plannedFixture(1),
    original = f.d.plan!;
  const { saveEstimate } = await import("../../src/estimating/service");
  await saveEstimate(f.owner, f.input.id, {
    operation_id: randomUUID(),
    schema_version: 1,
    reason: "SYN unrelated future estimate",
    expected_version: 1,
    title: f.input.title,
    scope: f.input.scope,
    lines: f.input.lines,
    policy: f.input.policy,
  });
  let d = await readConversion(f.owner, f.id);
  assert.equal(d.plan_applicable, true);
  assert.deepEqual(d.plan, original);
  await executeConversion(f.owner, f.id, conversion(d));
  d = await readConversion(f.owner, f.id);
  assert.equal(d.targets.length, 2);
  for (const line of d.lines) {
    const target = d.targets.find((t) => t.line_id === line.source.id)!;
    assert.equal(
      decimal(target.current.quantity),
      decimal(line.source.quantity),
    );
    assert.equal(target.current.unit, line.source.unit);
  }
});
test("ES07 successor issue holds unexecuted plan and concurrent receiving edits cannot silently replace it", async () => {
  const f = await plannedFixture(),
    old = f.d.plan!,
    r = receiving(f.d, f.owner.actor_id);
  const outcomes = await Promise.allSettled([
    receiveQuotation(f.owner, f.id, { ...r, decision: "Held" }),
    receiveQuotation(f.owner, f.id, {
      ...r,
      operation_id: randomUUID(),
      decision: "Returned",
    }),
  ]);
  assert.equal(outcomes.filter((x) => x.status === "fulfilled").length, 1);
  const { readRelease } = await import("../../src/estimating/release/reads"),
    { prepareRelease } = await import("../../src/estimating/release/service"),
    { preparation, issued } = await import("../helpers/quotation-release");
  const input = preparation(await readRelease(f.owner, f.id));
  await prepareRelease(f.owner, f.id, input);
  await retryQuote(f.owner, input.id);
  await issued(f, input.id);
  const d = await readConversion(f.owner, f.id);
  assert.equal(d.current, false);
  assert.equal(d.plan_applicable, false);
  assert.deepEqual(d.plan, old);
  await assert.rejects(
    executeConversion(f.owner, f.id, conversion(d)),
    code("ConversionConflict"),
  );
  assert.equal(d.targets.length, 0);
  await assert.rejects(
    receiveQuotation(f.owner, f.id, receiving(d, f.owner.actor_id)),
    code("ConversionConflict"),
  );
  await receiveQuotation(f.owner, f.id, {
    ...receiving(d, f.owner.actor_id),
    decision: "Returned",
    reason: "SYN incomplete applicability after superseded offer",
  });
  assert.equal(
    (await readConversion(f.owner, f.id)).receiving!.receiving!.decision,
    "Returned",
  );
});
test("ES07 owned returns and corrections preserve originals; missing ambiguous obsolete and incompatible mappings hold review", async () => {
  const f = await conversionFixture(),
    returned = { ...receiving(f.d, f.owner.actor_id), decision: "Returned" };
  await receiveQuotation(f.owner, f.id, returned);
  let d = await readConversion(f.owner, f.id);
  assert.ok(d.holds.some((h) => h.includes("Received")));
  assert.ok(d.holds.some((h) => h.includes("Missing")));
  await assert.rejects(
    reviewConversionPlan(f.owner, f.id, plan(d)),
    code("ConversionConflict"),
  );
  await receiveQuotation(f.owner, f.id, receiving(d, f.owner.actor_id));
  d = await readConversion(f.owner, f.id);
  assert.equal(d.events[0].receiving!.decision, "Returned");
  assert.equal(d.receiving!.predecessor_id, d.events[0].id);
  for (const state of ["Ambiguous", "Obsolete", "Incompatible"]) {
    await resolveQuotationItem(f.owner, f.id, { ...resolution(d), state });
    d = await readConversion(f.owner, f.id);
    assert.ok(d.holds.some((h) => h.includes(state)));
    await assert.rejects(
      reviewConversionPlan(f.owner, f.id, plan(d)),
      code("ConversionConflict"),
    );
  }
  await assert.rejects(
    resolveQuotationItem(f.owner, f.id, { ...resolution(d), unit: "PACK" }),
    code("InvalidData"),
  );
  await resolveQuotationItem(f.owner, f.id, resolution(d));
  d = await readConversion(f.owner, f.id);
  await reviewConversionPlan(f.owner, f.id, plan(d));
  assert.equal((await readConversion(f.owner, f.id)).plan_applicable, true);
});
test("ES07 changed response holds frozen plan and retains exact original recovery", async () => {
  const f = await plannedFixture(),
    old = f.d.plan!,
    cmd = conversion(f.d);
  const rd = await readResponse(f.owner, f.id);
  await recordResponse(f.owner, f.id, {
    ...response(rd, "Declined"),
    action: "Correct",
  });
  const d = await readConversion(f.owner, f.id);
  assert.equal(d.plan_applicable, false);
  assert.deepEqual(d.plan, old);
  await assert.rejects(
    executeConversion(f.owner, f.id, cmd),
    code("ConversionConflict"),
  );
  assert.equal(
    (await readOperation(f.owner, old.operation_id)).state,
    "Reviewed",
  );
  assert.equal(d.targets.length, 0);
});
test("ES07 mapping changes hold only their reviewed basis; immutable replacement plans retain prior decisions", async () => {
  const f = await plannedFixture(),
    old = f.d.plan!;
  await resolveQuotationItem(f.owner, f.id, {
    ...resolution(f.d),
    label: "SYN corrected one-off label",
  });
  let d = await readConversion(f.owner, f.id);
  assert.equal(d.plan_applicable, false);
  await assert.rejects(
    executeConversion(f.owner, f.id, conversion(d)),
    code("ConversionConflict"),
  );
  await reviewConversionPlan(f.owner, f.id, plan(d));
  d = await readConversion(f.owner, f.id);
  assert.equal(d.plan!.predecessor_id, old.id);
  assert.deepEqual(
    d.events.find((e) => e.id === old.id),
    old,
  );
  assert.equal(d.plan_applicable, true);
  await executeConversion(f.owner, f.id, conversion(d));
  await receiveQuotation(f.owner, f.id, {
    ...receiving(await readConversion(f.owner, f.id), f.owner.actor_id),
    decision: "Held",
  });
  d = await readConversion(f.owner, f.id);
  assert.equal(d.targets.length, 1);
  assert.equal(d.plan_applicable, false);
  await assert.rejects(
    reviewConversionPlan(f.owner, f.id, plan(d)),
    code("ConversionConflict"),
  );
});
test("ES07 competing execution and duplicate originals produce exactly one native target", async () => {
  const f = await plannedFixture(),
    cmd = conversion(f.d);
  const results = await Promise.allSettled([
    executeConversion(f.owner, f.id, cmd),
    executeConversion(f.owner, f.id, cmd),
    executeConversion(f.owner, f.id, { ...cmd, operation_id: randomUUID() }),
  ]);
  assert.equal(results.filter((r) => r.status === "fulfilled").length, 2);
  assert.equal((await readConversion(f.owner, f.id)).targets.length, 1);
  const yes = results.filter((r) => r.status === "fulfilled");
  if (yes[0].status === "fulfilled" && yes[1].status === "fulfilled")
    assert.deepEqual(yes[0].value.receipt, yes[1].value.receipt);
});
test("ES07 revoked receiving and source duties deny reads, native targets and original receipts", async () => {
  const f = await plannedFixture(),
    cmd = conversion(f.d);
  await executeConversion(f.owner, f.id, cmd);
  const d = await readConversion(f.owner, f.id),
    observer = (await createSession("observer")).principal;
  await assert.rejects(
    receiveQuotation(observer, f.id, receiving(d, f.owner.actor_id)),
  );
  const grants = (
    await database().query(
      "SELECT id FROM ppo.permission_grants WHERE workspace_id=$1 AND user_id=$2 AND capability='supply.coordinate' AND valid_to IS NULL",
      [f.owner.workspace_id, f.owner.actor_id],
    )
  ).rows;
  await database().query(
    "UPDATE ppo.permission_grants SET valid_to=clock_timestamp() WHERE id=ANY($1::uuid[])",
    [grants.map((g) => g.id)],
  );
  try {
    await assert.rejects(executeConversion(f.owner, f.id, cmd));
    await assert.rejects(readOperation(f.owner, cmd.operation_id));
    assert.equal((await readConversion(f.owner, f.id)).can_write, false);
  } finally {
    await database().query(
      "UPDATE ppo.permission_grants SET valid_to=NULL WHERE id=ANY($1::uuid[])",
      [grants.map((g) => g.id)],
    );
  }
  const reads = (
    await database().query(
      "SELECT id FROM ppo.permission_grants WHERE workspace_id=$1 AND user_id=$2 AND capability='estimating.quote.read' AND valid_to IS NULL",
      [f.owner.workspace_id, f.owner.actor_id],
    )
  ).rows;
  await database().query(
    "UPDATE ppo.permission_grants SET valid_to=clock_timestamp() WHERE id=ANY($1::uuid[])",
    [reads.map((g) => g.id)],
  );
  try {
    await assert.rejects(readConversion(f.owner, f.id));
    await assert.rejects(
      supplyRecord(database(), f.owner, d.targets[0].target_id),
    );
    await assert.rejects(
      readOperation(f.owner, f.d.plan!.plan!.commands[0].operation_id),
    );
  } finally {
    await database().query(
      "UPDATE ppo.permission_grants SET valid_to=NULL WHERE id=ANY($1::uuid[])",
      [reads.map((g) => g.id)],
    );
  }
});
test("ES07 injected late failure rolls back native targets identities revisions and all receipts", async () => {
  const f = await plannedFixture(1),
    cmd = conversion(f.d),
    targets = f.d.plan!.plan!.commands;
  await database().query(
    `CREATE FUNCTION ppo.es07_test_failure() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN IF NEW.action='Execute' THEN RAISE EXCEPTION 'ES07 injected late failure'; END IF; RETURN NEW; END $$; CREATE TRIGGER es07_test_failure AFTER INSERT ON ppo.quote_conversion_events FOR EACH ROW EXECUTE FUNCTION ppo.es07_test_failure()`,
  );
  try {
    await assert.rejects(
      executeConversion(f.owner, f.id, cmd),
      /ES07 injected late failure/,
    );
  } finally {
    await database().query(
      "DROP TRIGGER es07_test_failure ON ppo.quote_conversion_events; DROP FUNCTION ppo.es07_test_failure()",
    );
  }
  for (const target of targets)
    for (const [table, column, value] of [
      ["supply_records", "id", target.id],
      ["business_identities", "id", target.id],
      ["supply_revisions", "record_id", target.id],
      ["operation_receipts", "operation_id", target.operation_id],
      ["operation_receipts", "operation_id", cmd.operation_id],
    ])
      assert.equal(
        (
          await database().query(
            `SELECT 1 FROM ppo.${table} WHERE ${column}=$1`,
            [value],
          )
        ).rowCount,
        0,
      );
  await executeConversion(f.owner, f.id, cmd);
  assert.equal((await readConversion(f.owner, f.id)).targets.length, 2);
});
test("ES07 selective target-basis hold and durable guards refuse forged receiving or target scope", async () => {
  const f = await plannedFixture(),
    b = f.d.plan!.plan!.basis;
  await database().query(
    "UPDATE ppo.sites SET timezone='Australia/Perth' WHERE id=$1",
    [b.target.site_id],
  );
  try {
    const d = await readConversion(f.owner, f.id);
    assert.equal(d.plan_applicable, false);
    await assert.rejects(
      executeConversion(f.owner, f.id, conversion(d)),
      code("ConversionConflict"),
    );
  } finally {
    await database().query("UPDATE ppo.sites SET timezone=$2 WHERE id=$1", [
      b.target.site_id,
      b.target.timezone,
    ]);
  }
  assert.equal((await readConversion(f.owner, f.id)).plan_applicable, true);
  const original = (
    await database().query(
      "SELECT to_jsonb(e) row FROM ppo.quote_conversion_events e WHERE id=$1",
      [f.d.receiving!.id],
    )
  ).rows[0].row;
  const receivingRow = {
    ...original,
    id: randomUUID(),
    operation_id: randomUUID(),
    sequence: f.d.sequence + 1,
    predecessor_id: original.id,
    receiving: { ...original.receiving, owner_id: null },
  };
  await assert.rejects(
    database().query(
      "INSERT INTO ppo.quote_conversion_events SELECT (jsonb_populate_record(NULL::ppo.quote_conversion_events,$1)).*",
      [receivingRow],
    ),
    code("23514"),
  );
  const prior = (
    await database().query(
      "SELECT to_jsonb(e) row FROM ppo.quote_conversion_events e WHERE id=$1",
      [f.d.plan!.id],
    )
  ).rows[0].row;
  const forged = {
    ...prior,
    id: randomUUID(),
    operation_id: randomUUID(),
    sequence: f.d.sequence + 1,
    predecessor_id: prior.id,
    plan: {
      ...prior.plan,
      basis: {
        ...prior.plan.basis,
        target: { ...b.target, customer_id: randomUUID() },
      },
    },
  };
  await assert.rejects(
    database().query(
      "INSERT INTO ppo.quote_conversion_events SELECT (jsonb_populate_record(NULL::ppo.quote_conversion_events,$1)).*",
      [forged],
    ),
    code("23514"),
  );
  assert.equal(
    (await readConversion(f.owner, f.id)).events.length,
    f.d.events.length,
  );
});
test("ES07 populated 0060 upgrade preserves every review release response grant identity receipt history and original output", async () => {
  await database().query(
    await readFile(
      new URL("../../db/migrations/0001-recover.sql", import.meta.url),
      "utf8",
    ),
  );
  await database().query("DROP TABLE public.ppo_migrations");
  await migrate(60);
  await seed(60);
  const { responseFixture, responseCommand } =
      await import("../helpers/quotation-response"),
    { prepareResponseHandover } =
      await import("../../src/estimating/response/service");
  const f = await responseFixture();
  await retryQuote(f.owner, f.draft.id);
  const draft = await draftBytes(f.owner, f.draft.id),
    issued = await draftBytes(f.owner, f.id);
  const accepted = response(f.d),
    receipt = await recordResponse(f.owner, f.id, accepted),
    rd = await readResponse(f.owner, f.id);
  await prepareResponseHandover(f.owner, f.id, {
    ...responseCommand(rd),
    owner_id: f.owner.actor_id,
    due_date: "2026-10-12",
    note: "SYN retained before ES07 upgrade",
  });
  const tables = [
    "estimates",
    "estimate_versions",
    "estimate_review_events",
    "draft_quotes",
    "draft_quote_revisions",
    "quote_release_bases",
    "quote_release_events",
    "quote_response_events",
    "estimate_quote_jobs",
    "estimate_quote_attempts",
    "permission_grants",
    "business_identities",
    "users",
    "audit_events",
    "operation_receipts",
    "outbox_jobs",
    "supply_records",
    "supply_revisions",
  ];
  const snapshot = async () =>
    Object.fromEntries(
      await Promise.all(
        tables.map(async (t) => [
          t,
          (
            await database().query(
              `SELECT to_jsonb(t) row FROM ppo.${t} t ORDER BY to_jsonb(t)::text`,
            )
          ).rows,
        ]),
      ),
    );
  const before = await snapshot(),
    ledger = (
      await database().query(
        "SELECT * FROM public.ppo_migrations ORDER BY version",
      )
    ).rows,
    seeds = (
      await database().query("SELECT * FROM ppo.seed_receipts ORDER BY version")
    ).rows;
  await migrate();
  await seed();
  assert.deepEqual(await snapshot(), before);
  const after = (
    await database().query(
      "SELECT * FROM public.ppo_migrations ORDER BY version",
    )
  ).rows;
  assert.deepEqual(after.filter(r => r.version <= 60), ledger);
  assert.deepEqual(after.filter(r => r.version > 60).map(r => r.version), [61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77]);
  assert.deepEqual(
    (await database().query("SELECT * FROM ppo.seed_receipts ORDER BY version"))
      .rows,
    seeds,
  );
  await migrate();
  await seed();
  assert.deepEqual(await snapshot(), before);
  assert.deepEqual(
    (
      await database().query(
        "SELECT * FROM public.ppo_migrations ORDER BY version",
      )
    ).rows,
    after,
  );
  assert.deepEqual(await draftBytes(f.owner, f.draft.id), draft);
  assert.deepEqual(await draftBytes(f.owner, f.id), issued);
  assert.deepEqual(
    await readOperation(f.owner, accepted.operation_id),
    receipt.receipt,
  );
  const d = await readConversion(f.owner, f.id);
  assert.equal(d.sequence, 0);
  assert.ok(d.preparation);
  await receiveQuotation(f.owner, f.id, receiving(d, f.owner.actor_id));
});
