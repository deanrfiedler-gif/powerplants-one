import assert from "node:assert/strict";
import { test, beforeEach, after } from "node:test";
import { randomUUID } from "node:crypto";
import { reset } from "../../scripts/database";
import { database, closeDatabase } from "../../src/platform/database";
import { localConfig } from "../../src/platform/config";
import { createSession } from "../../src/platform/identity";
import {
  prepareExcelQuotation,
  reviewExcelQuotation,
  readExcelQuotationEvidence,
} from "../../src/estimating/import/quotation";
import { readOperation } from "../../src/shared/receipts";
import { readQuote, readEstimate } from "../../src/estimating/reads";
import { prepareQuote, saveEstimate } from "../../src/estimating/service";
import {
  readQuoteJob,
  runQuoteJob,
  draftBytes,
  QuoteWorkerInterrupted,
} from "../../src/estimating/worker";
import { reimportExcelWorkbook } from "../../src/estimating/import/reimport";
import { digest } from "../../src/documents/store";
import {
  importedForQuote,
  excelQuoteProposal,
} from "../helpers/excel-quotation";
import { revisionCommand, changedWorkbook } from "../helpers/excel-reimport";
import { excelSnapshot } from "../helpers/excel-review-database";
import {
  reviseCostDiscovery,
  selectCostOption,
} from "../helpers/estimating-cost-basis";
import { excelDiscovery } from "../helpers/excel-review";
import { CRM } from "../helpers/crm";
if (localConfig().database_name !== "ppo_synthetic_test")
  throw Error("Disposable ppo_synthetic_test only");
process.env.PPO_ALLOW_RESET = "dispose-synthetic";
process.env.PPO_RESET_DATABASE = "ppo_synthetic_test";
beforeEach(reset);
after(closeDatabase);
const code = (name: string) => (e: unknown) =>
  (e as { code: string }).code === name;
async function snapshot() {
  return {
    native: await excelSnapshot(),
    quotes: (
      await database().query(
        "SELECT to_jsonb(q) AS value FROM ppo.draft_quote_revisions q ORDER BY id",
      )
    ).rows,
    jobs: (
      await database().query(
        "SELECT to_jsonb(j) AS value FROM ppo.estimate_quote_jobs j ORDER BY id",
      )
    ).rows,
  };
}

test("XI06 exact source, four include/print combinations, atomic duplicate receipt and immutable review", async () => {
  const s = await importedForQuote(),
    before = await snapshot();
  const initial = await excelQuoteProposal(s);
  assert.equal(initial.review.reconciliation.quote_total, "85607.63");
  assert.deepEqual(await snapshot(), before);
  const choices = initial.command.choices!.map((c, i) => ({
    ...c,
    included: i !== 2 && i !== 3,
    print: i !== 1 && i !== 3,
  }));
  const { review, command } = await excelQuoteProposal(s, choices);
  assert.equal(review.choice_changes.length, 3);
  const results = await Promise.all([
    prepareExcelQuotation(s.p, s.e.id, command),
    prepareExcelQuotation(s.p, s.e.id, command),
  ]);
  assert.equal(results.filter((r) => r.replayed).length, 1);
  assert.deepEqual(results[0].receipt, results[1].receipt);
  const q = await readQuote(s.p, command.id),
    stored = (await readQuoteJob(s.p, command.id)).q;
  assert.equal(q.estimate_version_id, s.e.saved.id);
  assert.equal(q.snapshot.total, review.reconciliation.quote_total);
  assert.equal(
    q.snapshot.items.at(-1)!.description,
    "Included scope allowance",
  );
  for (const choice of choices.filter((c) => !c.included || !c.print))
    assert.ok(
      !stored.input_html.includes(
        s.e.saved.lines.find((l) => l.id === choice.line_id)!.description,
      ),
    );
  assert.doesNotMatch(
    stored.input_html,
    /unit_cost|cost_total|margin_percent|supplier_label|source_key|\.xlsx|internal_notes|PPO_Metadata/,
  );
  assert.equal(digest(stored.input_html), stored.input_hash);
  const evidence = await readExcelQuotationEvidence(s.p, command.id);
  assert.deepEqual(
    evidence.evidence.review,
    JSON.parse(JSON.stringify(review)),
  );
  assert.equal(evidence.actor_id, s.p.actor_id);
  assert.equal(evidence.reason, command.reason);
  assert.deepEqual(
    await readOperation(s.p, command.operation_id),
    results[0].receipt,
  );
  assert.equal(
    (
      await prepareExcelQuotation(s.p, s.e.id, {
        ...command,
        choices: [...choices].reverse(),
      })
    ).replayed,
    true,
  );
  await assert.rejects(
    prepareExcelQuotation(s.p, s.e.id, {
      ...command,
      reason: "Different intent",
    }),
    code("OperationConflict"),
  );
  await assert.rejects(
    database().query(
      "UPDATE ppo.audit_events SET reason='changed' WHERE operation_id=$1",
      [command.operation_id],
    ),
    code("55000"),
  );
  await assert.rejects(
    database().query("DELETE FROM ppo.draft_quote_revisions WHERE id=$1", [
      command.id,
    ]),
    code("55000"),
  );
  assert.equal((await readEstimate(s.p, s.e.id)).version, 1);
});

test("XI06 stale or incomplete reviews and late transaction failure leave no partial quote", async () => {
  const s = await importedForQuote(),
    { command } = await excelQuoteProposal(s),
    before = await snapshot();
  for (const invalid of [
    { ...command, confirmations: [] },
    { ...command, choices: command.choices!.slice(1) },
    { ...command, choices: [command.choices![0], command.choices![0]] },
  ])
    await assert.rejects(prepareExcelQuotation(s.p, s.e.id, invalid));
  await assert.rejects(
    prepareExcelQuotation(s.p, s.e.id, {
      ...command,
      review_hash: "0".repeat(64),
    }),
    code("ExcelQuoteReviewChanged"),
  );
  const changed = command.choices!.map((c, i) =>
    i ? c : { ...c, print: !c.print },
  );
  await assert.rejects(
    prepareExcelQuotation(s.p, s.e.id, { ...command, choices: changed }),
    code("ExcelQuoteReviewChanged"),
  );
  assert.deepEqual(await snapshot(), before);
  await database()
    .query(`CREATE FUNCTION ppo.reject_excel_quote_test() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN IF NEW.kind='DraftQuotePrepared' THEN RAISE EXCEPTION 'synthetic late failure'; END IF; RETURN NEW; END $$;
    CREATE TRIGGER reject_excel_quote_test BEFORE INSERT ON ppo.outbox_jobs FOR EACH ROW EXECUTE FUNCTION ppo.reject_excel_quote_test()`);
  try {
    await assert.rejects(
      prepareExcelQuotation(s.p, s.e.id, command),
      /synthetic late failure/,
    );
    assert.deepEqual(await snapshot(), before);
  } finally {
    await database().query(
      "DROP TRIGGER reject_excel_quote_test ON ppo.outbox_jobs; DROP FUNCTION ppo.reject_excel_quote_test()",
    );
  }
  await prepareQuote(
    s.p,
    s.e.id,
    (({ review_hash, confirmations, ...native }) => {
      void review_hash;
      void confirmations;
      return native;
    })(command),
  );
  await assert.rejects(
    prepareExcelQuotation(s.p, s.e.id, {
      ...command,
      id: randomUUID(),
      operation_id: randomUUID(),
    }),
    code("VersionConflict"),
  );
});

test("XI06 re-import retained and PPO-only lines need explicit choices; originals and accepted replay survive successors", async () => {
  const s = await importedForQuote(),
    first = await excelQuoteProposal(s);
  const accepted = await prepareExcelQuotation(s.p, s.e.id, first.command),
    original = (await readQuoteJob(s.p, first.command.id)).q;
  const extra = {
    ...s.e.saved.lines[0],
    id: randomUUID(),
    description: "SYN PPO-only retained line",
  };
  await saveEstimate(s.p, s.e.id, {
    schema_version: 2,
    operation_id: randomUUID(),
    reason: "SYN manual costing",
    expected_version: 1,
    title: s.e.saved.title,
    scope: s.e.saved.scope,
    policy: s.e.saved.policy,
    lines: [...s.e.saved.lines, extra],
  });
  await assert.rejects(
    reviewExcelQuotation(s.p, s.e.id, { estimate_version_id: s.e.saved.id }),
    code("ExcelQuoteReviewChanged"),
  );
  const revision = await revisionCommand(s, changedWorkbook);
  await reimportExcelWorkbook(s.p, s.input.id, revision.command);
  const pending = await excelQuoteProposal(s);
  assert.equal(pending.review.can_prepare, false);
  assert.equal(pending.review.review_hash, null);
  assert.equal(pending.review.unresolved_line_ids.length, 2);
  const e = await readEstimate(s.p, s.e.id);
  const chosen = await excelQuoteProposal(
    s,
    e.saved.lines.map((l) => ({
      line_id: l.id,
      included: true,
      print: l.id !== extra.id,
    })),
  );
  await prepareExcelQuotation(s.p, s.e.id, chosen.command);
  assert.equal((await readQuote(s.p, chosen.command.id)).snapshot.revision, 2);
  assert.deepEqual((await readQuoteJob(s.p, first.command.id)).q, original);
  assert.deepEqual(
    (await prepareExcelQuotation(s.p, s.e.id, first.command)).receipt,
    accepted.receipt,
  );
  assert.deepEqual(
    await readOperation(s.p, first.command.operation_id),
    accepted.receipt,
  );
});

test("XI03 only current selected Complete basis can continue; changed E2 invalidates review while originals remain recoverable", async () => {
  const s = await importedForQuote(),
    first = await excelQuoteProposal(s);
  await prepareExcelQuotation(s.p, s.e.id, first.command);
  const next = await excelQuoteProposal(s);
  const branch = await reviseCostDiscovery(s, excelDiscovery(), true);
  await selectCostOption(s, branch.new_option_id!);
  await assert.rejects(
    prepareExcelQuotation(s.p, s.e.id, next.command),
    code("DiscoveryRevisionChanged"),
  );
  assert.equal(
    (await prepareExcelQuotation(s.p, s.e.id, first.command)).replayed,
    true,
  );
});

test("XI03 quote-safe reader cannot see import review; revocation also prevents accepted recovery", async () => {
  const s = await importedForQuote(),
    observer = (await createSession("observer")).principal,
    other = (await createSession("second-company")).principal;
  const { command } = await excelQuoteProposal(s);
  await prepareExcelQuotation(s.p, s.e.id, command);
  for (const capability of [
    "crm.opportunity.read",
    "shared.internal.read",
    "estimating.quote.read",
  ])
    await database().query(
      "INSERT INTO ppo.permission_grants(workspace_id,user_id,company_id,capability,scope_type,scope_id,valid_from) VALUES($1,$2,$3,$4,'Company',$3,'2026-01-01') ON CONFLICT DO NOTHING",
      [CRM.workspace, observer.actor_id, CRM.company, capability],
    );
  const safe = await readQuote(observer, command.id);
  assert.equal(safe.snapshot.total, "85607.63");
  assert.equal(safe.estimate_id, undefined);
  assert.doesNotMatch(
    JSON.stringify(safe),
    /unit_cost|margin|supplier|\.xlsx|source_sha256|review_hash|estimate_version_id|choices|proposals/,
  );
  for (const p of [observer, other]) {
    await assert.rejects(readExcelQuotationEvidence(p, command.id));
    await assert.rejects(
      reviewExcelQuotation(p, s.e.id, { estimate_version_id: s.e.saved.id }),
    );
    await assert.rejects(prepareExcelQuotation(p, s.e.id, command));
  }
  await database().query(
    "UPDATE ppo.permission_grants SET valid_to=clock_timestamp() WHERE user_id=$1 AND capability='estimating.edit'",
    [s.p.actor_id],
  );
  await assert.rejects(prepareExcelQuotation(s.p, s.e.id, command));
  await assert.rejects(readOperation(s.p, command.operation_id));
  assert.equal(
    (await readQuote(observer, command.id)).snapshot.total,
    "85607.63",
  );
});

test("XI08 renderer interruption recovers the original stored bundle and source-bound draft", async () => {
  const s = await importedForQuote(),
    { command } = await excelQuoteProposal(s);
  await prepareExcelQuotation(s.p, s.e.id, command);
  const { j } = await readQuoteJob(s.p, command.id);
  await assert.rejects(
    runQuoteJob(j.id, {
      afterStore: async () => {
        throw new QuoteWorkerInterrupted("SYN exit after durable output");
      },
    }),
    QuoteWorkerInterrupted,
  );
  await database().query(
    "UPDATE ppo.estimate_quote_jobs SET lease_until=clock_timestamp()-interval '1 second' WHERE id=$1",
    [j.id],
  );
  await runQuoteJob(j.id, {
    render: async () => {
      throw Error("Must recover stored bytes without rendering");
    },
  });
  const output = await draftBytes(s.p, command.id);
  assert.ok(output.pdf.subarray(0, 5).equals(Buffer.from("%PDF-")));
  assert.equal(output.manifest.html_hash, digest(output.html));
  assert.equal(output.manifest.pdf_hash, digest(output.pdf));
  const again = await draftBytes(s.p, command.id);
  assert.deepEqual(again.pdf, output.pdf);
  assert.equal((await readQuote(s.p, command.id)).job.state, "Ready");
});
