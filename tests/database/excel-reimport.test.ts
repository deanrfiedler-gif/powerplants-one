import assert from "node:assert/strict";
import { after, beforeEach, test } from "node:test";
import { randomUUID } from "node:crypto";
import { mkdtemp, realpath } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { database, closeDatabase } from "../../src/platform/database";
import { localConfig } from "../../src/platform/config";
import { createSession } from "../../src/platform/identity";
import { reset } from "../../scripts/database";
import { LocalSyntheticDocumentStore } from "../../src/documents/store";
import type { DocumentStoreAdapter } from "../../src/adapters/contracts";
import { commitExcelWorkbook } from "../../src/estimating/import/commit";
import { reimportExcelWorkbook } from "../../src/estimating/import/reimport";
import { compareExcelWorkbook } from "../../src/estimating/import/comparison";
import {
  readExcelImport,
  readExcelSource,
} from "../../src/estimating/import/retained";
import { readOperation } from "../../src/shared/receipts";
import { readEstimate } from "../../src/estimating/reads";
import { saveEstimate, prepareQuote } from "../../src/estimating/service";
import { excelImportSetup } from "../helpers/excel-import";
import { excelSnapshot } from "../helpers/excel-review-database";
import {
  revisionCommand,
  revisionUpload,
  changedWorkbook,
  reorderWorkbook,
} from "../helpers/excel-reimport";
import { setCell } from "../helpers/excel-review";
import { excelDiscovery } from "../helpers/excel-review";
import { CRM, crmCreate } from "../helpers/crm";
import { reviseCostDiscovery } from "../helpers/estimating-cost-basis";

if (localConfig().database_name !== "ppo_synthetic_test")
  throw Error("Disposable ppo_synthetic_test only");
process.env.PPO_ALLOW_RESET = "dispose-synthetic";
process.env.PPO_RESET_DATABASE = "ppo_synthetic_test";
beforeEach(reset);
after(closeDatabase);
const code = (value: string) => (e: unknown) =>
  (e as { code: string }).code === value;
const denied = (e: unknown) =>
  ["RecordUnavailable", "PermissionDenied"].includes(
    (e as { code: string }).code,
  );
async function setup(opportunity = crmCreate()) {
  const s = await excelImportSetup(undefined, undefined, opportunity),
    store = new LocalSyntheticDocumentStore(
      await realpath(await mkdtemp(join(tmpdir(), "ppo-reimport-"))),
    );
  const accepted = await commitExcelWorkbook(s.p, s.input.id, s.command, store);
  const estimate = await readEstimate(s.p, accepted.receipt.record_id);
  return { ...s, store, accepted, estimate };
}
async function snapshot() {
  return {
    native: await excelSnapshot(),
    imports: (
      await database().query(
        "SELECT to_jsonb(i) AS value FROM ppo.excel_import_history i ORDER BY estimate_version_id",
      )
    ).rows,
  };
}
async function manual(s: Awaited<ReturnType<typeof setup>>, add = true) {
  const e = await readEstimate(s.p, s.estimate.id),
    extra = {
      ...e.saved.lines[0],
      id: randomUUID(),
      description: "PPO-only exact manual line",
    };
  const lines = e.saved.lines.map((l, i) =>
    i === 1 ? { ...l, description: "PPO intervening edit" } : l,
  );
  if (add) lines.push(extra);
  await saveEstimate(s.p, e.id, {
    schema_version: 2,
    operation_id: randomUUID(),
    reason: "Synthetic intervening manual edit",
    expected_version: e.version,
    title: e.saved.title,
    scope: e.saved.scope,
    policy: e.saved.policy,
    lines,
  });
  return extra;
}
test("XI03 successor source stays readable while comparison refuses a revoked historical Site basis", async () => {
  const site2 = "70000000-0000-4000-8000-000000000002";
  await database().query(
    `INSERT INTO ppo.site_parties(id,workspace_id,created_by,updated_by,company_id,site_id,organisation_id,role,valid_from)
    VALUES($1,$2,$3,$3,$4,$5,$6,'BillingParty','2026-01-01')`,
    [randomUUID(), CRM.workspace, CRM.owner, CRM.company, site2, CRM.org],
  );
  const s = await setup({ ...crmCreate(), site_id: site2 });
  const discovery = excelDiscovery();
  discovery.scope = {
    ...discovery.scope,
    site_id: site2,
    site_reason: null,
    facility_ids: [],
    equipment_ids: [],
    systems: [{ tag: "ProductSupply", facility_ids: [] }],
  };
  const revision = await reviseCostDiscovery(s, discovery);
  const current = {
      ...s,
      input: { ...s.input, revision_id: revision.revision_id },
    },
    r = await revisionCommand(current);
  const accepted = await reimportExcelWorkbook(
    s.p,
    s.input.id,
    r.command,
    s.store,
  );
  const saved = await readEstimate(s.p, s.estimate.id);
  assert.equal(
    (await readExcelImport(s.p, s.estimate.id, saved.saved.id)).receipt_id,
    accepted.receipt.receipt_id,
  );
  // Current CRM and successor use Site 2; only the earlier E2 basis uses Site 1.
  await database().query(
    "UPDATE ppo.permission_grants SET scope_type='Site',scope_id=$3,company_id=$2,site_id=$3 WHERE user_id=$1 AND capability='estimating.read'",
    [s.p.actor_id, CRM.company, site2],
  );
  assert.equal(
    (await readEstimate(s.p, s.estimate.id)).saved.id,
    saved.saved.id,
  );
  assert.deepEqual(
    (await readExcelSource(s.p, s.estimate.id, saved.saved.id, s.store)).bytes,
    Buffer.from(r.command.file.base64, "base64"),
  );
  await assert.rejects(
    readExcelImport(s.p, s.estimate.id, saved.saved.id),
    denied,
  );
});
test("XI03/04/07 final capacity includes kept lines; current version and permissions recheck after source I/O", async () => {
  const s = await setup(),
    e = s.estimate;
  const extras = Array.from({ length: 88 }, (_, i) => ({
    ...e.saved.lines[0],
    id: randomUUID(),
    description: `Synthetic manual ${i}`,
  }));
  await saveEstimate(s.p, e.id, {
    schema_version: 2,
    operation_id: randomUUID(),
    reason: "Synthetic capacity boundary",
    expected_version: e.version,
    title: e.saved.title,
    scope: e.saved.scope,
    policy: e.saved.policy,
    lines: [...e.saved.lines, ...extras],
  });
  const r = await revisionCommand(s, changedWorkbook),
    before = await snapshot();
  const noIO: DocumentStoreAdapter = {
    store: async () => {
      throw Error("Unexpected capacity storage");
    },
    read: async () => {
      throw Error("Unexpected capacity read");
    },
  };
  await assert.rejects(
    reimportExcelWorkbook(s.p, s.input.id, r.command, noIO),
    code("InvalidData"),
  );
  assert.deepEqual(await snapshot(), before);
  // Removing the omitted original makes exactly 100 resolved lines eligible.
  r.command.decisions.find((d) => d.line_id === e.saved.lines[0].id)!.action =
    "Remove";
  const mutateDuringStore: DocumentStoreAdapter = {
    store: async (...args) => {
      const key = await s.store.store(...args);
      await manual(s, false);
      return key;
    },
    read: s.store.read.bind(s.store),
  };
  await assert.rejects(
    reimportExcelWorkbook(s.p, s.input.id, r.command, mutateDuringStore),
    code("ExcelImportComparisonChanged"),
  );
  assert.equal(
    (await database().query("SELECT * FROM ppo.excel_reimports")).rowCount,
    0,
  );
  const current = await revisionCommand(s, changedWorkbook);
  current.command.decisions.find(
    (d) => d.line_id === e.saved.lines[0].id,
  )!.action = "Remove";
  const revokeDuringStore: DocumentStoreAdapter = {
    store: async (...args) => {
      const key = await s.store.store(...args);
      await database().query(
        "UPDATE ppo.permission_grants SET valid_to=clock_timestamp() WHERE user_id=$1 AND capability='estimating.edit'",
        [s.p.actor_id],
      );
      return key;
    },
    read: s.store.read.bind(s.store),
  };
  await assert.rejects(
    reimportExcelWorkbook(s.p, s.input.id, current.command, revokeDuringStore),
    denied,
  );
  assert.equal(
    (await database().query("SELECT * FROM ppo.excel_reimports")).rowCount,
    0,
  );
});
test("XI05 whole-estimate comparison exposes PPO edits and provenance; explicit removals, kept manual lines, reorder and resurrection retain IDs and originals", async () => {
  const s = await setup(),
    first = await readExcelImport(s.p, s.estimate.id, s.estimate.saved.id);
  const quoteId = randomUUID();
  await prepareQuote(s.p, s.estimate.id, {
    schema_version: 1,
    operation_id: randomUUID(),
    reason: "Synthetic original draft",
    id: quoteId,
    estimate_version_id: s.estimate.saved.id,
    expected_version: 1,
    expected_quote_version: 0,
    choices: s.estimate.saved.lines.map((l) => ({
      line_id: l.id,
      included: true,
      print: true,
    })),
  });
  const oldQuote = (
    await database().query(
      "SELECT to_jsonb(q) value FROM ppo.draft_quote_revisions q WHERE estimate_id=$1",
      [s.estimate.id],
    )
  ).rows;
  const extra = await manual(s),
    r = await revisionCommand(s, changedWorkbook);
  assert.equal(
    r.comparison.lines.find((l) => l.line_ref === "L-NEW")!.kind,
    "Added",
  );
  assert.ok(
    r.comparison.lines.some(
      (l) =>
        l.before?.description === "PPO intervening edit" &&
        l.changes.some((c) => c.field === "description"),
    ),
  );
  assert.ok(
    r.comparison.lines.some((l) =>
      l.changes.some((c) => c.field === "section"),
    ),
  );
  assert.ok(
    r.comparison.lines.some((l) => l.changes.some((c) => c.field === "source")),
  );
  assert.ok(
    r.comparison.lines.some((l) => l.changes.some((c) => c.field === "print")),
  );
  assert.deepEqual(
    r.comparison.omissions.map((o) => o.kind),
    ["RemovedImported", "PPOOnly"],
  );
  const original = await snapshot();
  await assert.rejects(
    reimportExcelWorkbook(
      s.p,
      s.input.id,
      { ...r.command, decisions: [] },
      s.store,
    ),
    code("ExcelImportDecisionsRequired"),
  );
  assert.deepEqual(await snapshot(), original);
  r.command.decisions[0].action = "Remove";
  const accepted = await reimportExcelWorkbook(
      s.p,
      s.input.id,
      r.command,
      s.store,
    ),
    saved = await readEstimate(s.p, s.estimate.id);
  assert.equal(saved.version, 3);
  assert.equal(saved.saved.predecessor_id, r.comparison.predecessor.version_id);
  assert.equal(saved.saved.lines.length, 13);
  assert.deepEqual(saved.saved.lines.at(-1), extra);
  const evidence = await readExcelImport(s.p, s.estimate.id, saved.saved.id);
  assert.deepEqual(
    evidence.resolution!.decisions,
    r.command.decisions.sort((a, b) => a.line_id.localeCompare(b.line_id)),
  );
  assert.deepEqual(
    (await readExcelSource(s.p, s.estimate.id, saved.saved.id, s.store)).bytes,
    Buffer.from(r.command.file.base64, "base64"),
  );
  assert.deepEqual(
    await readExcelImport(s.p, s.estimate.id, s.estimate.saved.id),
    first,
  );
  assert.deepEqual(
    (await readExcelSource(s.p, s.estimate.id, s.estimate.saved.id, s.store))
      .bytes,
    Buffer.from(s.command.file.base64, "base64"),
  );
  assert.deepEqual(
    (
      await database().query(
        "SELECT to_jsonb(q) value FROM ppo.draft_quote_revisions q WHERE estimate_id=$1",
        [s.estimate.id],
      )
    ).rows,
    oldQuote,
  );
  const back = await revisionCommand(s, reorderWorkbook);
  assert.equal(
    back.comparison.lines.find((l) => l.line_ref === first.lines[0].line_ref)!
      .line_id,
    first.lines[0].line_id,
  );
  back.command.decisions.forEach((d) => (d.action = "Remove"));
  await reimportExcelWorkbook(s.p, s.input.id, back.command, s.store);
  const restored = await readEstimate(s.p, s.estimate.id);
  assert.deepEqual(
    new Set(restored.saved.lines.map((l) => l.id)),
    new Set(s.estimate.saved.lines.map((l) => l.id)),
  );
  const same = await revisionCommand(s, reorderWorkbook);
  assert.ok(same.comparison.lines.every((l) => l.kind === "Unchanged"));
  await assert.rejects(
    database().query("UPDATE ppo.excel_reimports SET reason='rewrite'"),
    /append-only/i,
  );
  await assert.rejects(
    database().query("DELETE FROM ppo.excel_reimports"),
    /append-only/i,
  );
  assert.deepEqual(
    await readOperation(s.p, r.command.operation_id),
    accepted.receipt,
  );
});
test("XI03/04 identical concurrent revisions recover once; changed intent conflicts; competing operations and stale review never overwrite", async () => {
  const s = await setup(),
    r = await revisionCommand(s, changedWorkbook);
  const duplicates = await Promise.all([
    reimportExcelWorkbook(s.p, s.input.id, r.command, s.store),
    reimportExcelWorkbook(s.p, s.input.id, r.command, s.store),
  ]);
  assert.deepEqual(duplicates[0].receipt, duplicates[1].receipt);
  assert.equal(duplicates.filter((r) => r.replayed).length, 1);
  assert.equal((await readEstimate(s.p, s.estimate.id)).version, 2);
  const noIO: DocumentStoreAdapter = {
    store: async () => {
      throw Error("Unexpected storage");
    },
    read: async () => {
      throw Error("Unexpected source read");
    },
  };
  assert.equal(
    (await reimportExcelWorkbook(s.p, s.input.id, r.command, noIO)).replayed,
    true,
  );
  await assert.rejects(
    reimportExcelWorkbook(
      s.p,
      s.input.id,
      { ...r.command, reason: "Changed intent" },
      noIO,
    ),
    code("OperationConflict"),
  );
  await assert.rejects(
    reimportExcelWorkbook(
      s.p,
      s.input.id,
      { ...r.command, operation_id: randomUUID() },
      s.store,
    ),
    code("ExcelImportComparisonChanged"),
  );
  const next = await revisionCommand(s);
  const competing = await Promise.allSettled([
    reimportExcelWorkbook(s.p, s.input.id, next.command, s.store),
    reimportExcelWorkbook(
      s.p,
      s.input.id,
      { ...next.command, operation_id: randomUUID() },
      s.store,
    ),
  ]);
  assert.equal(competing.filter((r) => r.status === "fulfilled").length, 1);
  const stale = await revisionCommand(s);
  await manual(s, false);
  await assert.rejects(
    reimportExcelWorkbook(s.p, s.input.id, stale.command, s.store),
    code("ExcelImportComparisonChanged"),
  );
  await reviseCostDiscovery(s);
  assert.equal(
    (await reimportExcelWorkbook(s.p, s.input.id, r.command, noIO)).replayed,
    true,
  );
});
test("XI03/07 wrong identity, blocked upload, missing confirmation, foreign and revoked access refuse without mutation or storage", async () => {
  const s = await setup(),
    r = await revisionCommand(s);
  const noIO: DocumentStoreAdapter = {
    store: async () => {
      throw Error("Unexpected storage");
    },
    read: async () => {
      throw Error("Unexpected source read");
    },
  };
  const otherPrincipals = await Promise.all(
    ["observer", "second-company"].map(
      async (profile) => (await createSession(profile)).principal,
    ),
  );
  const before = await snapshot();
  await assert.rejects(
    reimportExcelWorkbook(
      s.p,
      s.input.id,
      { ...r.command, changes_confirmed: false },
      noIO,
    ),
    code("InvalidData"),
  );
  await assert.rejects(
    reimportExcelWorkbook(
      s.p,
      s.input.id,
      { ...r.command, comparison_hash: "a".repeat(64) },
      noIO,
    ),
    code("ExcelImportComparisonChanged"),
  );
  await assert.rejects(
    compareExcelWorkbook(
      s.p,
      s.input.id,
      await revisionUpload(s, (p) => setCell(p, 5, "G6", null)),
    ),
    code("ExcelImportBlocked"),
  );
  const wrong = await revisionUpload(s, (p) => {
    p["xl/worksheets/sheet1.xml"] = p["xl/worksheets/sheet1.xml"].replace(
      s.review.metadata.workbook_ref!,
      "OTHER-WORKBOOK",
    );
  });
  await assert.rejects(
    compareExcelWorkbook(s.p, s.input.id, wrong),
    code("ExcelImportWorkbookChanged"),
  );
  for (const p of otherPrincipals) {
    await assert.rejects(compareExcelWorkbook(p, s.input.id, r.upload), denied);
    await assert.rejects(
      reimportExcelWorkbook(p, s.input.id, r.command, noIO),
      denied,
    );
  }
  // Session audit already existed in the snapshot; all evidence remains exact.
  assert.deepEqual(await snapshot(), before);
  await database().query(
    "UPDATE ppo.permission_grants SET valid_to=clock_timestamp() WHERE user_id=$1 AND capability='estimating.read'",
    [s.p.actor_id],
  );
  await assert.rejects(compareExcelWorkbook(s.p, s.input.id, r.upload), denied);
  await assert.rejects(
    reimportExcelWorkbook(s.p, s.input.id, r.command, noIO),
    denied,
  );
});
test("XI04 storage, readback, native/evidence/audit/receipt/outbox faults and tampered projection roll back the whole successor", async () => {
  const s = await setup(),
    r = await revisionCommand(s, changedWorkbook),
    before = await snapshot();
  await assert.rejects(
    reimportExcelWorkbook(s.p, s.input.id, r.command, {
      store: async () => {
        throw Error("store fault");
      },
      read: s.store.read.bind(s.store),
    }),
    /store fault/,
  );
  await assert.rejects(
    reimportExcelWorkbook(s.p, s.input.id, r.command, {
      store: s.store.store.bind(s.store),
      read: async () => Buffer.from("corrupt"),
    }),
    code("ExcelSourceVerificationFailed"),
  );
  assert.deepEqual(await snapshot(), before);
  for (const table of [
    "estimate_versions",
    "excel_reimports",
    "audit_events",
    "operation_receipts",
    "outbox_jobs",
  ]) {
    await database()
      .query(`CREATE FUNCTION ppo.reimport_fault() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'synthetic reimport fault'; END $$;
      CREATE TRIGGER reimport_fault BEFORE INSERT ON ppo.${table} FOR EACH ROW EXECUTE FUNCTION ppo.reimport_fault()`);
    try {
      await assert.rejects(
        reimportExcelWorkbook(s.p, s.input.id, r.command, s.store),
        /synthetic reimport fault/,
      );
    } finally {
      await database().query(
        `DROP TRIGGER reimport_fault ON ppo.${table}; DROP FUNCTION ppo.reimport_fault()`,
      );
    }
    assert.deepEqual(await snapshot(), before);
  }
  await database()
    .query(`CREATE FUNCTION ppo.reimport_fault() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN NEW.projection:=jsonb_set(NEW.projection,'{0,line,id}',to_jsonb(gen_random_uuid()::text)); RETURN NEW; END $$;
    CREATE TRIGGER reimport_fault BEFORE INSERT ON ppo.excel_reimports FOR EACH ROW EXECUTE FUNCTION ppo.reimport_fault()`);
  try {
    await assert.rejects(
      reimportExcelWorkbook(s.p, s.input.id, r.command, s.store),
      /Check the record relationships/,
    );
  } finally {
    await database().query(
      "DROP TRIGGER reimport_fault ON ppo.excel_reimports; DROP FUNCTION ppo.reimport_fault()",
    );
  }
  assert.deepEqual(await snapshot(), before);
  const accepted = await reimportExcelWorkbook(
    s.p,
    s.input.id,
    r.command,
    s.store,
  );
  assert.equal(accepted.receipt.record_version, 2);
  await database().query(
    "UPDATE ppo.permission_grants SET valid_to=clock_timestamp() WHERE user_id=$1 AND capability='estimating.edit'",
    [s.p.actor_id],
  );
  await assert.rejects(
    reimportExcelWorkbook(s.p, s.input.id, r.command, s.store),
    denied,
  );
  await assert.rejects(readOperation(s.p, r.command.operation_id), denied);
});
