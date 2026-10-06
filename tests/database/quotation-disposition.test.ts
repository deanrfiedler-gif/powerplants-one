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
  executeConversion,
  receiveQuotation,
  resolveQuotationItem,
} from "../../src/estimating/conversion/service";
import {
  reviewDisposition,
  applyDisposition,
} from "../../src/estimating/disposition/service";
import { readOperation } from "../../src/shared/receipts";
import { saveRecord, recordFact } from "../../src/supply/commands";
import { draftBytes, retryQuote } from "../../src/estimating/worker";
import {
  completedFixture,
  dispositionReview,
  dispositionApply,
  nativeRevision,
} from "../helpers/quotation-disposition";
import {
  receiving,
  resolution,
  conversion,
  plannedFixture,
} from "../helpers/quotation-conversion";
import { crmBase } from "../helpers/crm";
import { response } from "../helpers/quotation-response";
import { readResponse } from "../../src/estimating/response/reads";
import { recordResponse } from "../../src/estimating/response/service";
if (localConfig().database_name !== "ppo_synthetic_test")
  throw Error("Disposable ppo_synthetic_test only");
process.env.PPO_ALLOW_RESET = "dispose-synthetic";
process.env.PPO_RESET_DATABASE = "ppo_synthetic_test";
before(reset);
after(closeDatabase);
const code = (s: string) => (e: unknown) => (e as { code: string }).code === s;
const target = async (
  f: Awaited<ReturnType<typeof completedFixture>>,
  index = 0,
) => (await readConversion(f.owner, f.id)).dispositions[index];

test("ES07 disposition review alone stays open; explicit retention resolves only exact exception and preserves conversion", async () => {
  const f = await completedFixture(),
    t = f.d.dispositions[0],
    original = t.basis.original_target;
  assert.equal(t.status, "Review required");
  assert.deepEqual(t.source_changes, ["receiving_id"]);
  const cmd = dispositionReview(t),
    reviewed = await reviewDisposition(f.owner, f.id, cmd);
  let current = await target(f);
  assert.equal(current.status, "Review required");
  assert.equal(current.can_apply, true);
  assert.deepEqual(
    (await reviewDisposition(f.owner, f.id, cmd)).receipt,
    reviewed.receipt,
  );
  const apply = dispositionApply(current),
    applied = await applyDisposition(f.owner, f.id, apply);
  current = await target(f);
  assert.equal(current.status, "Resolved");
  assert.deepEqual(current.basis.target, original);
  assert.equal(current.events.length, 2);
  assert.deepEqual(
    (await applyDisposition(f.owner, f.id, apply)).receipt,
    applied.receipt,
  );
  assert.deepEqual(
    await readOperation(f.owner, apply.operation_id),
    applied.receipt,
  );
  assert.deepEqual(
    (await executeConversion(f.owner, f.id, f.originalCommand)).receipt,
    f.original.receipt,
  );
  await assert.rejects(
    applyDisposition(f.owner, f.id, { ...apply, evidence: "Changed content" }),
    code("OperationConflict"),
  );
  await receiveQuotation(f.owner, f.id, {
    ...receiving(await readConversion(f.owner, f.id), f.owner.actor_id),
    decision: "Returned",
  });
  current = await target(f);
  assert.equal(current.status, "Review required");
  assert.equal(current.events.length, 2);
  assert.deepEqual(
    (await applyDisposition(f.owner, f.id, apply)).receipt,
    applied.receipt,
  );
  await assert.rejects(
    executeConversion(
      f.owner,
      f.id,
      conversion(await readConversion(f.owner, f.id)),
    ),
    code("ConversionConflict"),
  );
});
test("ES07 quantity disposition mutates native Forecast with exact version, original lineage, impact activity and native receipt", async () => {
  const f = await completedFixture(),
    t = f.d.dispositions[0];
  await retryQuote(f.owner, f.draft.id);
  const issued = await draftBytes(f.owner, f.id),
    draft = await draftBytes(f.owner, f.draft.id);
  await reviewDisposition(
    f.owner,
    f.id,
    dispositionReview(t, "ReviseQuantity", "1.250001"),
  );
  const reviewed = await target(f);
  await assert.rejects(
    saveRecord(f.owner, reviewed.review!.command!, true),
    code("DispositionConflict"),
  );
  assert.equal((await target(f)).basis.target.version, 1);
  const cmd = dispositionApply(reviewed),
    applied = await applyDisposition(f.owner, f.id, cmd),
    current = await target(f);
  assert.equal(current.status, "Resolved");
  assert.equal(current.basis.target.quantity, "1.250001");
  assert.equal(current.basis.target.version, 2);
  for (const key of [
    "id",
    "company_id",
    "site_id",
    "item",
    "unit",
    "external_key",
    "data",
    "source_reference",
  ] as const)
    assert.deepEqual(current.basis.target[key], t.basis.target[key]);
  assert.deepEqual(current.basis.original_target, t.basis.original_target);
  assert.equal(
    current.basis.dependencies.facts.filter((f) => f.kind === "Impact").length,
    1,
  );
  const impact = current.basis.dependencies.facts.find(
    (f) => f.kind === "Impact",
  )!;
  assert.ok(impact.activity_id);
  assert.equal(
    (
      await database().query("SELECT 1 FROM ppo.activities WHERE id=$1", [
        impact.activity_id,
      ])
    ).rowCount,
    1,
  );
  const native = reviewed.review!.command!;
  const receipt = await readOperation(f.owner, native.operation_id);
  assert.equal(receipt.record_id, t.target_id);
  assert.equal(receipt.record_version, 2);
  assert.deepEqual((await saveRecord(f.owner, native, true)).receipt, receipt);
  assert.deepEqual(
    (await applyDisposition(f.owner, f.id, cmd)).receipt,
    applied.receipt,
  );
  assert.equal((await target(f)).basis.target.version, 2);
  assert.deepEqual(await draftBytes(f.owner, f.id), issued);
  assert.deepEqual(await draftBytes(f.owner, f.draft.id), draft);
});
test("ES07 applicability is selective across sibling mappings, targets and unrelated saved estimates", async () => {
  const f = await completedFixture(1),
    t = f.d.dispositions[0];
  await reviewDisposition(
    f.owner,
    f.id,
    dispositionReview(t, "ReviseQuantity", "1.5"),
  );
  const cmd = dispositionApply(await target(f));
  let d = await readConversion(f.owner, f.id);
  const sibling = d.lines.find((l) => l.source.id !== t.basis.line_id)!;
  await resolveQuotationItem(f.owner, f.id, {
    ...resolution(d, sibling),
    label: "SYN sibling mapping only",
  });
  d = await readConversion(f.owner, f.id);
  const other = d.dispositions.find((x) => x.target_id !== t.target_id)!;
  await saveRecord(
    f.owner,
    nativeRevision(other, { title: "SYN unrelated other target" }),
    true,
  );
  const { saveEstimate } = await import("../../src/estimating/service");
  await saveEstimate(f.owner, f.input.id, {
    ...crmBase(),
    expected_version: 1,
    title: f.input.title,
    scope: f.input.scope,
    lines: f.input.lines,
    policy: f.input.policy,
  });
  assert.equal((await target(f)).can_apply, true);
  await applyDisposition(f.owner, f.id, cmd);
  d = await readConversion(f.owner, f.id);
  assert.equal(
    d.dispositions.find((x) => x.target_id === t.target_id)!.status,
    "Resolved",
  );
  assert.equal(
    d.dispositions.find((x) => x.target_id !== t.target_id)!.status,
    "Review required",
  );
});
test("ES07 changed response and superseded issue hold reviewed actions without losing completed targets", async () => {
  const f = await completedFixture();
  await reviewDisposition(
    f.owner,
    f.id,
    dispositionReview(f.d.dispositions[0], "ReviseQuantity", "1"),
  );
  const cmd = dispositionApply(await target(f));
  await recordResponse(f.owner, f.id, {
    ...response(await readResponse(f.owner, f.id), "Declined"),
    action: "Correct",
  });
  assert.equal((await target(f)).can_apply, false);
  await assert.rejects(
    applyDisposition(f.owner, f.id, cmd),
    code("DispositionConflict"),
  );
  const { readRelease } = await import("../../src/estimating/release/reads"),
    { prepareRelease } = await import("../../src/estimating/release/service"),
    { preparation, issued } = await import("../helpers/quotation-release");
  const successor = preparation(await readRelease(f.owner, f.id));
  await prepareRelease(f.owner, f.id, successor);
  await retryQuote(f.owner, successor.id);
  await issued(f, successor.id);
  let current = await target(f);
  assert.ok(current.source_changes.includes("issue_id"));
  assert.ok(current.source_changes.includes("response_id"));
  await reviewDisposition(f.owner, f.id, dispositionReview(current));
  current = await target(f);
  await applyDisposition(f.owner, f.id, dispositionApply(current));
  assert.equal((await target(f)).status, "Resolved");
  const successorRead = await readConversion(f.owner, successor.id);
  assert.equal(successorRead.original_conversion_revision, f.id);
  assert.equal(successorRead.dispositions[0].status, "Resolved");
  assert.equal(successorRead.targets.length, 1);
  assert.equal(successorRead.targets[0].current.version, 1);
});
test("ES07 target edits stale only their review; immutable Hold and replacement decisions preserve earlier effects", async () => {
  const f = await completedFixture();
  await reviewDisposition(
    f.owner,
    f.id,
    dispositionReview(f.d.dispositions[0], "Hold"),
  );
  let t = await target(f);
  assert.equal(t.can_apply, false);
  await assert.rejects(
    applyDisposition(f.owner, f.id, dispositionApply(t)),
    code("DispositionConflict"),
  );
  await reviewDisposition(
    f.owner,
    f.id,
    dispositionReview(t, "ReviseQuantity", "1"),
  );
  t = await target(f);
  const old = dispositionApply(t);
  await saveRecord(
    f.owner,
    nativeRevision(t, { title: "SYN downstream edit" }),
    true,
  );
  assert.equal((await target(f)).can_apply, false);
  await assert.rejects(
    applyDisposition(f.owner, f.id, old),
    code("DispositionConflict"),
  );
  await reviewDisposition(
    f.owner,
    f.id,
    dispositionReview(await target(f), "ReviseQuantity", "1.5"),
  );
  await applyDisposition(f.owner, f.id, dispositionApply(await target(f)));
  t = await target(f);
  assert.equal(t.basis.target.quantity, "1.5");
  assert.equal(t.basis.target.version, 3);
  assert.equal(t.events.length, 4);
  await reviewDisposition(f.owner, f.id, dispositionReview(t, "Hold"));
  assert.equal((await target(f)).status, "Review required");
  assert.equal((await target(f)).basis.target.quantity, "1.5");
  for (const sql of [
    "DELETE FROM ppo.quote_disposition_events WHERE target_id=$1",
    "UPDATE ppo.quote_disposition_events SET reason='rewrite' WHERE target_id=$1",
  ])
    await assert.rejects(database().query(sql, [t.target_id]), code("55000"));
});
test("ES07 Approved demand and consequential evidence hold quantity changes; retention remains explicit and non-operative", async () => {
  const f = await completedFixture(),
    t = f.d.dispositions[0];
  await saveRecord(
    f.owner,
    nativeRevision(t, {
      data: {
        ...t.basis.target.data,
        demand_class: "Approved",
        authority:
          "SYN native Supply approval evidence, no procurement authority",
      },
    }),
    true,
  );
  let current = await target(f);
  assert.ok(current.revision_holds.some((h) => h.includes("Approved")));
  await assert.rejects(
    reviewDisposition(
      f.owner,
      f.id,
      dispositionReview(current, "ReviseQuantity", "1"),
    ),
    code("DispositionConflict"),
  );
  await reviewDisposition(f.owner, f.id, dispositionReview(current));
  await applyDisposition(f.owner, f.id, dispositionApply(await target(f)));
  assert.equal((await target(f)).status, "Resolved");
  const g = await completedFixture(),
    gt = g.d.dispositions[0];
  await reviewDisposition(
    g.owner,
    g.id,
    dispositionReview(gt, "ReviseQuantity", "1"),
  );
  await recordFact(g.owner, gt.target_id, {
    ...crmBase(),
    id: randomUUID(),
    expected_version: 1,
    kind: "ExternalOutcome",
    data: {
      source_operation: randomUUID(),
      effect: "Reservation",
      state: "Unknown",
      lookup_evidence: "SYN original outcome remains unknown",
    },
    predecessor_id: null,
    evidence: "SYN uncertain downstream outcome",
    observed_at: new Date().toISOString(),
    completeness: "Unavailable",
    attachment_id: null,
  });
  current = await target(g);
  assert.equal(current.can_apply, false);
  assert.ok(current.revision_holds.length);
  await assert.rejects(
    applyDisposition(g.owner, g.id, dispositionApply(current)),
    code("DispositionConflict"),
  );
});
test("ES07 concurrent decisions and applications prevent duplicate or conflicting native effects", async () => {
  const f = await completedFixture(),
    cmd = dispositionReview(f.d.dispositions[0], "ReviseQuantity", "1.75");
  const reviews = await Promise.allSettled([
    reviewDisposition(f.owner, f.id, cmd),
    reviewDisposition(f.owner, f.id, {
      ...cmd,
      operation_id: randomUUID(),
      quantity: "1.25",
    }),
  ]);
  assert.equal(reviews.filter((r) => r.status === "fulfilled").length, 1);
  const apply = dispositionApply(await target(f));
  const results = await Promise.allSettled([
    applyDisposition(f.owner, f.id, apply),
    applyDisposition(f.owner, f.id, { ...apply, operation_id: randomUUID() }),
  ]);
  assert.equal(results.filter((r) => r.status === "fulfilled").length, 1);
  const t = await target(f);
  assert.equal(t.basis.target.version, 2);
  assert.equal(t.events.filter((e) => e.action === "Apply").length, 1);
  const accepted = results.find((r) => r.status === "fulfilled")!;
  assert.equal(accepted.status, "fulfilled");
  const original = t.applied!.operation_id;
  assert.deepEqual(
    await readOperation(f.owner, original),
    (
      accepted as PromiseFulfilledResult<
        Awaited<ReturnType<typeof applyDisposition>>
      >
    ).value.receipt,
  );
});
test("ES07 permission revocation protects review, target history, commands and exact original recovery", async () => {
  const f = await completedFixture(),
    t = f.d.dispositions[0],
    cmd = dispositionReview(t);
  const other = (await createSession("second-company")).principal;
  await assert.rejects(reviewDisposition(other, f.id, cmd));
  await assert.rejects(
    readConversion({ ...f.owner, workspace_id: randomUUID() }, f.id),
  );
  const r = await reviewDisposition(f.owner, f.id, cmd),
    apply = dispositionApply(await target(f));
  const grants = (
    await database().query(
      "DELETE FROM ppo.permission_grants WHERE user_id=$1 AND capability='supply.coordinate' RETURNING *",
      [f.owner.actor_id],
    )
  ).rows;
  try {
    await assert.rejects(reviewDisposition(f.owner, f.id, cmd));
    await assert.rejects(applyDisposition(f.owner, f.id, apply));
    await assert.rejects(readOperation(f.owner, cmd.operation_id));
    assert.equal((await readConversion(f.owner, f.id)).can_write, false);
  } finally {
    for (const g of grants)
      await database().query(
        "INSERT INTO ppo.permission_grants SELECT (jsonb_populate_record(NULL::ppo.permission_grants,$1)).*",
        [g],
      );
  }
  assert.deepEqual(await readOperation(f.owner, cmd.operation_id), r.receipt);
  const reads = (
    await database().query(
      "DELETE FROM ppo.permission_grants WHERE user_id=$1 AND capability='estimating.quote.read' RETURNING *",
      [f.owner.actor_id],
    )
  ).rows;
  try {
    await assert.rejects(readConversion(f.owner, f.id));
    await assert.rejects(readOperation(f.owner, cmd.operation_id));
    await assert.rejects(
      readOperation(f.owner, f.originalCommand.operation_id),
    );
  } finally {
    for (const g of reads)
      await database().query(
        "INSERT INTO ppo.permission_grants SELECT (jsonb_populate_record(NULL::ppo.permission_grants,$1)).*",
        [g],
      );
  }
});
test("ES07 late disposition failure rolls back native quantity, history, impact, activity, audit and receipts", async () => {
  const f = await completedFixture();
  await reviewDisposition(
    f.owner,
    f.id,
    dispositionReview(f.d.dispositions[0], "ReviseQuantity", "1.5"),
  );
  const t = await target(f),
    cmd = dispositionApply(t);
  const tables = [
    "supply_records",
    "supply_revisions",
    "supply_facts",
    "activities",
    "activity_links",
    "audit_events",
    "operation_receipts",
    "outbox_jobs",
    "quote_disposition_events",
  ];
  const snapshot = async () =>
    Object.fromEntries(
      await Promise.all(
        tables.map(async (table) => [
          table,
          (
            await database().query(
              `SELECT to_jsonb(t) row FROM ppo.${table} t ORDER BY to_jsonb(t)::text`,
            )
          ).rows,
        ]),
      ),
    );
  const before = await snapshot();
  await database().query(
    "CREATE FUNCTION ppo.es07_disposition_failure() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN IF NEW.action='Apply' THEN RAISE EXCEPTION 'SYN late disposition failure'; END IF; RETURN NEW; END $$; CREATE TRIGGER es07_disposition_failure BEFORE INSERT ON ppo.quote_disposition_events FOR EACH ROW EXECUTE FUNCTION ppo.es07_disposition_failure()",
  );
  try {
    await assert.rejects(applyDisposition(f.owner, f.id, cmd));
  } finally {
    await database().query(
      "DROP TRIGGER es07_disposition_failure ON ppo.quote_disposition_events; DROP FUNCTION ppo.es07_disposition_failure()",
    );
  }
  assert.deepEqual(await snapshot(), before);
  await applyDisposition(f.owner, f.id, cmd);
  assert.equal((await target(f)).basis.target.quantity, "1.5");
});
test("ES07 retains all six decimal places at the native quantity limit and durable guards refuse forged decision scope", async () => {
  const f = await completedFixture();
  const value = "999999999999.999999";
  await reviewDisposition(
    f.owner,
    f.id,
    dispositionReview(f.d.dispositions[0], "ReviseQuantity", value),
  );
  const t = await target(f),
    row = (
      await database().query(
        "SELECT to_jsonb(e) row FROM ppo.quote_disposition_events e WHERE id=$1",
        [t.review!.id],
      )
    ).rows[0].row;
  for (const change of [
    { basis: { ...row.basis, execution_id: randomUUID() } },
    {
      basis: {
        ...row.basis,
        source: { ...row.basis.source, receiving_id: randomUUID() },
      },
    },
    { command: { ...row.command, unit: "metres" } },
    { command: { ...row.command, quantity: "0" } },
  ]) {
    await assert.rejects(
      database().query(
        "INSERT INTO ppo.quote_disposition_events SELECT (jsonb_populate_record(NULL::ppo.quote_disposition_events,$1)).*",
        [
          {
            ...row,
            id: randomUUID(),
            operation_id: randomUUID(),
            predecessor_id: row.id,
            sequence: row.sequence + 1,
            ...change,
          },
        ],
      ),
      code("23514"),
    );
  }
  // Even a structurally valid direct insert cannot commit without its atomic receipt/audit/outbox.
  await assert.rejects(
    database().query(
      "INSERT INTO ppo.quote_disposition_events SELECT (jsonb_populate_record(NULL::ppo.quote_disposition_events,$1)).*",
      [
        {
          ...row,
          id: randomUUID(),
          operation_id: randomUUID(),
          predecessor_id: row.id,
          sequence: row.sequence + 1,
        },
      ],
    ),
    code("23514"),
  );
  const cmd = dispositionApply(t);
  await applyDisposition(f.owner, f.id, cmd);
  const after = await target(f);
  assert.equal(after.basis.target.quantity, value);
  assert.equal(after.review!.command!.quantity, value);
  assert.equal(
    (
      await database().query(
        "SELECT quantity::text FROM ppo.supply_records WHERE id=$1",
        [t.target_id],
      )
    ).rows[0].quantity,
    value,
  );
  assert.deepEqual(
    (await applyDisposition(f.owner, f.id, cmd)).receipt,
    await readOperation(f.owner, cmd.operation_id),
  );
});
test("ES07 downstream allocation/source changes hold retained reviews and revoked dependency access prevents frozen disclosure", async () => {
  const f = await completedFixture(),
    t = f.d.dispositions[0];
  const { supplyInput } = await import("../helpers/supply"),
    { allocate } = await import("../../src/supply/commands");
  await saveRecord(
    f.owner,
    nativeRevision(t, {
      data: {
        ...t.basis.target.data,
        demand_class: "Approved",
        authority: "SYN separately adopted Supply authority",
      },
    }),
    true,
  );
  const source = supplyInput("Supply", {
    item: t.basis.target.item,
    unit: t.basis.target.unit,
  });
  await saveRecord(f.owner, source);
  const current = await target(f);
  await allocate(f.owner, {
    ...crmBase(),
    id: randomUUID(),
    expected_version: null,
    demand_id: t.target_id,
    supply_id: source.id,
    demand_version: current.basis.target.version,
    supply_version: 1,
    quantity: "1",
    unit: t.basis.target.unit,
    basis: "Incoming",
  });
  let changed = await target(f);
  assert.ok(changed.revision_holds.some((h) => h.includes("allocations")));
  await reviewDisposition(f.owner, f.id, dispositionReview(changed));
  const review = await target(f),
    apply = dispositionApply(review);
  // A supply source revision changes dependencies without changing this demand's version.
  await saveRecord(
    f.owner,
    {
      ...source,
      ...crmBase(),
      expected_version: 2,
      title: "SYN updated source title",
    },
    true,
  );
  changed = await target(f);
  assert.equal(changed.basis.target.version, review.basis.target.version);
  assert.equal(changed.can_apply, false);
  await assert.rejects(
    applyDisposition(f.owner, f.id, apply),
    code("DispositionConflict"),
  );
  // Frozen dependency context is reauthorised, even when only its related entity became restricted.
  const { supplyRecord } = await import("../../src/supply/context");
  const grants = (
    await database().query(
      "DELETE FROM ppo.permission_grants WHERE user_id=$1 AND capability='supply.read' RETURNING *",
      [f.owner.actor_id],
    )
  ).rows;
  try {
    await assert.rejects(readConversion(f.owner, f.id));
    await assert.rejects(readOperation(f.owner, review.review!.operation_id));
    await assert.rejects(supplyRecord(database(), f.owner, source.id));
  } finally {
    for (const g of grants)
      await database().query(
        "INSERT INTO ppo.permission_grants SELECT (jsonb_populate_record(NULL::ppo.permission_grants,$1)).*",
        [g],
      );
  }
});
test("ES07 unavailable owner holds pending disposition and native receipt recovery rechecks current authority", async () => {
  const f = await completedFixture();
  await reviewDisposition(
    f.owner,
    f.id,
    dispositionReview(f.d.dispositions[0], "ReviseQuantity", "1.5"),
  );
  const t = await target(f),
    cmd = dispositionApply(t);
  const grants = (
    await database().query(
      "DELETE FROM ppo.permission_grants WHERE user_id=$1 AND capability='activity.edit' RETURNING *",
      [t.review!.owner_id],
    )
  ).rows;
  try {
    assert.equal((await target(f)).can_apply, false);
    await assert.rejects(
      applyDisposition(f.owner, f.id, cmd),
      code("DispositionConflict"),
    );
  } finally {
    for (const g of grants)
      await database().query(
        "INSERT INTO ppo.permission_grants SELECT (jsonb_populate_record(NULL::ppo.permission_grants,$1)).*",
        [g],
      );
  }
  await applyDisposition(f.owner, f.id, cmd);
  const native = t.review!.command!;
  const receipt = await readOperation(f.owner, native.operation_id);
  const reads = (
    await database().query(
      "DELETE FROM ppo.permission_grants WHERE user_id=$1 AND capability='estimating.quote.read' RETURNING *",
      [f.owner.actor_id],
    )
  ).rows;
  try {
    await assert.rejects(readOperation(f.owner, native.operation_id));
    await assert.rejects(saveRecord(f.owner, native, true));
  } finally {
    for (const g of reads)
      await database().query(
        "INSERT INTO ppo.permission_grants SELECT (jsonb_populate_record(NULL::ppo.permission_grants,$1)).*",
        [g],
      );
  }
  assert.deepEqual(await readOperation(f.owner, native.operation_id), receipt);
});
test("ES07 populated 0061 upgrade preserves complete commercial/conversion/native evidence, grants, identities and original bytes", async () => {
  await database().query(
    await readFile(
      new URL("../../db/migrations/0001-recover.sql", import.meta.url),
      "utf8",
    ),
  );
  await database().query("DROP TABLE public.ppo_migrations");
  await migrate(61);
  await seed(61);
  const f = await plannedFixture(),
    cmd = conversion(f.d),
    receipt = await executeConversion(f.owner, f.id, cmd);
  await retryQuote(f.owner, f.draft.id);
  const issued = await draftBytes(f.owner, f.id),
    draft = await draftBytes(f.owner, f.draft.id);
  const tables = (
    await database().query<{ tablename: string }>(
      "SELECT tablename FROM pg_tables WHERE schemaname='ppo' ORDER BY tablename",
    )
  ).rows.map((r) => r.tablename);
  const snapshot = async () =>
    Object.fromEntries(
      await Promise.all(
        tables.map(async (table) => [
          table,
          (
            await database().query(
              `SELECT to_jsonb(t) row FROM ppo.${table} t ORDER BY to_jsonb(t)::text`,
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
    ).rows;
  await migrate();
  await seed();
  assert.deepEqual(await snapshot(), before);
  const after = (
    await database().query(
      "SELECT * FROM public.ppo_migrations ORDER BY version",
    )
  ).rows;
  assert.deepEqual(
    after.filter((r) => r.version <= 61),
    ledger,
  );
  assert.deepEqual(
    after.filter((r) => r.version > 61).map((r) => r.version),
    [62, 63, 64, 65, 66, 67, 68, 69],
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
  assert.deepEqual(await draftBytes(f.owner, f.id), issued);
  assert.deepEqual(await draftBytes(f.owner, f.draft.id), draft);
  assert.deepEqual(
    await readOperation(f.owner, cmd.operation_id),
    receipt.receipt,
  );
  let d = await readConversion(f.owner, f.id);
  await receiveQuotation(f.owner, f.id, {
    ...receiving(d, f.owner.actor_id),
    decision: "Held",
  });
  d = await readConversion(f.owner, f.id);
  await reviewDisposition(
    f.owner,
    f.id,
    dispositionReview(d.dispositions[0], "ReviseQuantity", "1.125"),
  );
  d = await readConversion(f.owner, f.id);
  await applyDisposition(f.owner, f.id, dispositionApply(d.dispositions[0]));
  assert.equal(
    (await readConversion(f.owner, f.id)).targets[0].current.quantity,
    "1.125",
  );
});
