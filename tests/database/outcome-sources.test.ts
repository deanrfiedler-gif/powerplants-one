import assert from "node:assert/strict";
import { before, after, test } from "node:test";
import { readFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { reset, migrate, seed } from "../../scripts/database";
import { database, closeDatabase } from "../../src/platform/database";
import { localConfig } from "../../src/platform/config";
import { createSession } from "../../src/platform/identity";
import { createOpportunity } from "../../src/crm/opportunities";
import { changeDealStage } from "../../src/crm/refinements";
import {
  recordOpportunityOutcome,
  parseOpportunityOutcome,
} from "../../src/crm/outcomes";
import { readOpportunity } from "../../src/crm/reads";
import { readOutcomeBasis } from "../../src/crm/outcome-sources";
import { readOperation } from "../../src/shared/receipts";
import { createEstimate, prepareQuote } from "../../src/estimating/service";
import { readEstimate } from "../../src/estimating/reads";
import { readResponse } from "../../src/estimating/response/reads";
import { recordResponse } from "../../src/estimating/response/service";
import { reviewed, prepared, issued } from "../helpers/quotation-release";
import { response } from "../helpers/quotation-response";
import { estimateInput, quoteCommand } from "../helpers/estimating";
import { crmBase, crmDiscovery } from "../helpers/crm";

if (localConfig().database_name !== "ppo_synthetic_test")
  throw Error("Disposable ppo_synthetic_test only");
process.env.PPO_ALLOW_RESET = "dispose-synthetic";
process.env.PPO_RESET_DATABASE = "ppo_synthetic_test";
before(reset);
after(closeDatabase);
const rows = async (q: string, values: unknown[] = []) =>
  (await database().query(q, values)).rows;
const code = (name: string) => (e: unknown) =>
  (e as { code: string }).code === name;
const tables = [
  "opportunities",
  "opportunity_events",
  "opportunity_handovers_due",
  "opportunity_outcome_sources",
  "audit_events",
  "operation_receipts",
  "outbox_jobs",
];
const snapshot = (names = tables) =>
  Promise.all(
    names.map((t) =>
      rows(`SELECT to_jsonb(t) row FROM ppo.${t} t ORDER BY to_jsonb(t)::text`),
    ),
  );
async function deal(quoting = false) {
  const owner = (await createSession("coordinator")).principal,
    o = crmDiscovery();
  await createOpportunity(owner, o);
  for (const [i, stage] of ["Scoping", "Quoting", "Negotiation", "Closing"]
    .slice(0, quoting ? 2 : 4)
    .entries())
    await changeDealStage(owner, o.id, {
      ...crmBase(),
      expected_version: i + 1,
      stage_id: stage,
      qualification_note: null,
      identification_activity_id: null,
    });
  return { owner, o };
}
async function fixture(outcome = "Accepted") {
  const f = await deal(true),
    reviewer = (await createSession("estimating-source-reviewer")).principal,
    approver = (await createSession("quotation-approver")).principal,
    issuer = (await createSession("quotation-issuer")).principal;
  const input = estimateInput(f.o.id);
  await createEstimate(f.owner, input);
  await reviewed(f.owner, reviewer, input.id);
  const estimate = await readEstimate(f.owner, input.id),
    draft = quoteCommand(estimate.saved);
  await prepareQuote(f.owner, input.id, draft);
  const full = { ...f, reviewer, approver, issuer, input, estimate, draft },
    released = await prepared(full);
  await issued(full, released.id);
  await recordResponse(
    f.owner,
    released.id,
    response(await readResponse(f.owner, released.id), outcome),
  );
  for (const [i, stage_id] of ["Negotiation", "Closing"].entries())
    await changeDealStage(f.owner, f.o.id, {
      ...crmBase(),
      expected_version: i + 3,
      stage_id,
      qualification_note: null,
      identification_activity_id: null,
    });
  return { ...full, id: released.id };
}
const outcome = (expected_version = 5, close_outcome = "Won") => ({
  ...crmBase(),
  expected_version,
  close_outcome,
  lost_reason: close_outcome === "Lost" ? "Timing" : null,
  acceptance_evidence:
    close_outcome === "Won"
      ? "SYN staff-reviewed fictional order evidence"
      : null,
});
async function command(
  f: Awaited<ReturnType<typeof fixture>>,
  close_outcome = "Won",
) {
  const basis = await readOutcomeBasis(f.owner, f.o.id, { revision_id: f.id });
  assert.ok(basis.source);
  return {
    ...outcome(basis.opportunity_version, close_outcome),
    commercial_source: basis.source,
  };
}

test("LC-15 exact quotation-based Won retains one outcome and original recovery after a native response correction", async () => {
  const f = await fixture(),
    input = await command(f);
  const before = await snapshot([
    "estimates",
    "estimate_versions",
    "draft_quote_revisions",
    "quote_release_events",
    "quote_response_events",
  ]);
  const results = await Promise.all([
    recordOpportunityOutcome(f.owner, f.o.id, input),
    recordOpportunityOutcome(f.owner, f.o.id, input),
  ]);
  assert.deepEqual(results[0].receipt, results[1].receipt);
  assert.equal(results.filter((r) => r.replayed).length, 1);
  assert.deepEqual(
    await snapshot([
      "estimates",
      "estimate_versions",
      "draft_quote_revisions",
      "quote_release_events",
      "quote_response_events",
    ]),
    before,
  );
  assert.equal(
    (
      await rows(
        "SELECT * FROM ppo.opportunity_outcome_sources WHERE opportunity_id=$1",
        [f.o.id],
      )
    ).length,
    1,
  );
  assert.equal(
    (
      await rows(
        "SELECT * FROM ppo.opportunity_handovers_due WHERE opportunity_id=$1",
        [f.o.id],
      )
    ).length,
    1,
  );
  await recordResponse(f.owner, f.id, {
    ...response(await readResponse(f.owner, f.id), "Declined"),
    action: "Correct",
  });
  const d = await readOpportunity(f.owner, f.o.id),
    source = d.outcome_sources[0];
  assert.equal(d.close_outcome, "Won");
  assert.equal(source.kind, "Quotation");
  if (source.kind === "Quotation") {
    assert.equal(source.recorded_response, "Accepted");
    assert.equal(source.current_response, "Declined");
    assert.equal(source.changed, true);
  }
  assert.deepEqual(
    await readOperation(f.owner, input.operation_id),
    results[0].receipt,
  );
  assert.deepEqual(
    (await recordOpportunityOutcome(f.owner, f.o.id, input)).receipt,
    results[0].receipt,
  );
  await assert.rejects(
    recordOpportunityOutcome(f.owner, f.o.id, {
      ...input,
      reason: "Changed original",
    }),
    code("OperationConflict"),
  );
  await assert.rejects(
    database().query(
      "UPDATE ppo.opportunity_outcome_sources SET reported_outcome='Declined' WHERE opportunity_id=$1",
      [f.o.id],
    ),
  );
});

test("LC-15 separate evidence is explicit; absent legacy source retains its exact old payload and narrative outcome", async () => {
  const f = await deal(),
    input = outcome(5, "Lost");
  assert.deepEqual(parseOpportunityOutcome(f.o.id, input), {
    ...input,
    id: f.o.id,
  });
  const saved = await recordOpportunityOutcome(f.owner, f.o.id, input);
  assert.deepEqual(
    (await readOpportunity(f.owner, f.o.id)).outcome_sources,
    [],
  );
  assert.deepEqual(
    (await recordOpportunityOutcome(f.owner, f.o.id, input)).receipt,
    saved.receipt,
  );
  const independent = await deal(),
    c = {
      ...outcome(),
      commercial_source: {
        kind: "Independent",
        evidence:
          "SYN external order reviewed separately from quotation response",
      },
    };
  await recordOpportunityOutcome(independent.owner, independent.o.id, c);
  const source = (await readOpportunity(independent.owner, independent.o.id))
    .outcome_sources[0];
  assert.equal(source.kind, "Independent");
  if (source.kind === "Independent")
    assert.equal(source.evidence, c.commercial_source.evidence);
  assert.throws(() =>
    parseOpportunityOutcome(randomUUID(), {
      ...outcome(),
      commercial_source: { kind: "Independent", evidence: "" },
    }),
  );
});

test("LC-15 stale reviewed response, wrong Deal and mismatched outcome refuse every effect", async () => {
  const f = await fixture(),
    input = await command(f),
    other = await deal();
  let before = await snapshot();
  await assert.rejects(
    recordOpportunityOutcome(other.owner, other.o.id, input),
    code("RecordUnavailable"),
  );
  await assert.rejects(
    recordOpportunityOutcome(f.owner, f.o.id, {
      ...input,
      close_outcome: "Lost",
      lost_reason: "Timing",
      acceptance_evidence: null,
    }),
    code("OutcomeSourceChanged"),
  );
  assert.deepEqual(await snapshot(), before);
  await recordResponse(f.owner, f.id, {
    ...response(await readResponse(f.owner, f.id), "Declined"),
    action: "Correct",
  });
  before = await snapshot();
  await assert.rejects(
    recordOpportunityOutcome(f.owner, f.o.id, input),
    code("OutcomeSourceChanged"),
  );
  assert.deepEqual(await snapshot(), before);
  await recordOpportunityOutcome(f.owner, f.o.id, await command(f, "Lost"));
  assert.equal((await readOpportunity(f.owner, f.o.id)).close_outcome, "Lost");
  assert.equal(
    (
      await rows(
        "SELECT * FROM ppo.opportunity_handovers_due WHERE opportunity_id=$1",
        [f.o.id],
      )
    ).length,
    0,
  );
});

test("LC-15 current quote permission governs stored source identities and original outcome recovery", async () => {
  const f = await fixture(),
    input = await command(f);
  await recordOpportunityOutcome(f.owner, f.o.id, input);
  const grants = await rows(
    "SELECT * FROM ppo.permission_grants WHERE workspace_id=$1 AND user_id=$2 AND capability='estimating.quote.read'",
    [f.owner.workspace_id, f.owner.actor_id],
  );
  await database().query(
    "DELETE FROM ppo.permission_grants WHERE workspace_id=$1 AND user_id=$2 AND capability='estimating.quote.read'",
    [f.owner.workspace_id, f.owner.actor_id],
  );
  try {
    const source = (await readOpportunity(f.owner, f.o.id)).outcome_sources[0];
    assert.deepEqual(Object.keys(source).sort(), ["event_id", "kind"]);
    assert.equal(source.kind, "Restricted");
    await assert.rejects(readOperation(f.owner, input.operation_id));
    await assert.rejects(recordOpportunityOutcome(f.owner, f.o.id, input));
  } finally {
    await database().query(
      "INSERT INTO ppo.permission_grants SELECT * FROM jsonb_populate_recordset(NULL::ppo.permission_grants,$1::jsonb)",
      [JSON.stringify(grants)],
    );
  }
});

test("LC-15 a quotation successor invalidates a reviewed new outcome without changing the original issued evidence", async () => {
  const f = await fixture(),
    input = await command(f);
  const original = await snapshot([
    "quote_release_events",
    "quote_response_events",
  ]);
  await prepareQuote(
    f.owner,
    f.input.id,
    quoteCommand(
      f.estimate.saved,
      1,
      input.commercial_source.expected_quote_version,
    ),
  );
  const before = await snapshot();
  await assert.rejects(
    recordOpportunityOutcome(f.owner, f.o.id, input),
    code("OutcomeSourceChanged"),
  );
  assert.deepEqual(await snapshot(), before);
  assert.deepEqual(
    await snapshot(["quote_release_events", "quote_response_events"]),
    original,
  );
});

test("LC-15 late publication failure rolls back outcome, handover, source, receipt and audit together", async () => {
  const f = await fixture(),
    input = await command(f),
    before = await snapshot();
  await database().query(
    "CREATE FUNCTION ppo.lc15_fail_publication() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN IF NEW.kind='OpportunityOutcomeRecorded' THEN RAISE EXCEPTION 'SYN LC15 late publication failure' USING ERRCODE='P0001'; END IF; RETURN NEW; END $$; CREATE TRIGGER lc15_fail BEFORE INSERT ON ppo.outbox_jobs FOR EACH ROW EXECUTE FUNCTION ppo.lc15_fail_publication()",
  );
  try {
    await assert.rejects(
      recordOpportunityOutcome(f.owner, f.o.id, input),
      (e) => String(e).includes("SYN LC15 late publication failure"),
    );
  } finally {
    await database().query(
      "DROP TRIGGER lc15_fail ON ppo.outbox_jobs; DROP FUNCTION ppo.lc15_fail_publication()",
    );
  }
  assert.deepEqual(await snapshot(), before);
  await recordOpportunityOutcome(f.owner, f.o.id, input);
});

test("LC-15 populated 0074 upgrade retains every old outcome and original receipt without fabricating native provenance", async () => {
  await database().query(
    await readFile(
      new URL("../../db/migrations/0001-recover.sql", import.meta.url),
      "utf8",
    ),
  );
  await database().query("DROP TABLE IF EXISTS public.ppo_migrations");
  await migrate(74);
  await seed(74);
  const f = await deal(),
    input = outcome(),
    original = await recordOpportunityOutcome(f.owner, f.o.id, input);
  const names = tables
      .filter((t) => t !== "opportunity_outcome_sources")
      .concat("permission_grants", "business_identities"),
    before = await snapshot(names),
    ledger = await rows("SELECT * FROM public.ppo_migrations ORDER BY version");
  await migrate();
  await seed();
  await migrate();
  await seed();
  assert.deepEqual(await snapshot(names), before);
  const after = await rows(
    "SELECT * FROM public.ppo_migrations ORDER BY version",
  );
  assert.deepEqual(after.slice(0, -1), ledger);
  assert.equal(after.at(-1)?.version, 75);
  assert.deepEqual(
    (await readOpportunity(f.owner, f.o.id)).outcome_sources,
    [],
  );
  assert.deepEqual(
    await readOperation(f.owner, input.operation_id),
    original.receipt,
  );
  assert.deepEqual(
    (await recordOpportunityOutcome(f.owner, f.o.id, input)).receipt,
    original.receipt,
  );
});
