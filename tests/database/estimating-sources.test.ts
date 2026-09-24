import assert from "node:assert/strict";
import { before, after, test } from "node:test";
import { randomUUID } from "node:crypto";
import { database, closeDatabase } from "../../src/platform/database";
import { localConfig } from "../../src/platform/config";
import { createSession } from "../../src/platform/identity";
import { reset } from "../../scripts/database";
import { readOperation } from "../../src/shared/receipts";
import { createOpportunity } from "../../src/crm/opportunities";
import {
  createEstimate,
  saveEstimate,
  prepareQuote,
} from "../../src/estimating/service";
import { readEstimate, readQuote } from "../../src/estimating/reads";
import {
  createCostSource,
  decideCostSource,
  reviseCostSource,
} from "../../src/estimating/sources/commands";
import {
  readCostSource,
  listCostSources,
} from "../../src/estimating/sources/reads";
import {
  previewSourceRefresh,
  applySourceRefresh,
} from "../../src/estimating/sources/refresh";
import { crmBase, crmCreate } from "../helpers/crm";
import { estimateInput, quoteCommand } from "../helpers/estimating";
import { sourceInput } from "../helpers/estimating-sources";

if (localConfig().database_name !== "ppo_synthetic_test")
  throw Error("Disposable ppo_synthetic_test only");
process.env.PPO_ALLOW_RESET = "dispose-synthetic";
process.env.PPO_RESET_DATABASE = "ppo_synthetic_test";
before(reset);
after(closeDatabase);
const code = (status: string) => (e: unknown) =>
  Boolean(e && typeof e === "object" && "code" in e && e.code === status);
async function fixture() {
  const p = (await createSession("coordinator")).principal,
    reviewer = (await createSession("estimating-source-reviewer")).principal,
    input = sourceInput();
  await createCostSource(p, input);
  const d = await readCostSource(p, input.id);
  return { p, reviewer, input, d };
}
async function reviewed() {
  const f = await fixture();
  await decideCostSource(f.p, f.input.id, {
    ...crmBase(),
    expected_version: 1,
    revision_id: f.d.revision.id,
    action: "Submit",
  });
  await decideCostSource(f.reviewer, f.input.id, {
    ...crmBase(),
    expected_version: 2,
    revision_id: f.d.revision.id,
    action: "Reviewed",
  });
  return { ...f, d: await readCostSource(f.p, f.input.id) };
}
test("ES03 immutable exact revisions, independent review, scope, stale writes and recoverable original receipts", async () => {
  const { p, reviewer, input, d } = await fixture();
  assert.equal((await createCostSource(p, input)).replayed, true);
  await assert.rejects(
    createCostSource(p, { ...input, reason: "Different payload" }),
    code("OperationConflict"),
  );
  assert.equal(
    (await listCostSources(p, { q: input.reference })).items.length,
    1,
  );
  assert.equal(
    (
      await listCostSources((await createSession("second-company")).principal, {
        q: input.reference,
      })
    ).items.length,
    0,
  );
  const submit = {
    ...crmBase(),
    expected_version: 1,
    revision_id: d.revision.id,
    action: "Submit",
  };
  await decideCostSource(p, input.id, submit);
  await assert.rejects(
    reviseCostSource(p, input.id, {
      ...crmBase(),
      expected_version: 2,
      content: { ...input.content, title: "Changed while submitted" },
    }),
    code("SourceInReview"),
  );
  await assert.rejects(
    decideCostSource(p, input.id, {
      ...crmBase(),
      expected_version: 2,
      revision_id: d.revision.id,
      action: "Reviewed",
    }),
  );
  const review = {
    ...crmBase(),
    expected_version: 2,
    revision_id: d.revision.id,
    action: "Reviewed",
  };
  const accepted = await decideCostSource(reviewer, input.id, review);
  assert.deepEqual(
    await readOperation(reviewer, review.operation_id),
    accepted.receipt,
  );
  await reviseCostSource(p, input.id, {
    ...crmBase(),
    expected_version: 3,
    content: {
      ...input.content,
      tiers: [{ minimum_quantity: "1", unit_cost: "110" }],
    },
  });
  const successor = await readCostSource(p, input.id);
  assert.equal(successor.source.revision, 2);
  assert.equal(successor.source.state, "Draft");
  for (const action of ["Returned", "Rejected"] as const) {
    const current = await readCostSource(p, input.id);
    await decideCostSource(p, input.id, {
      ...crmBase(),
      expected_version: current.source.version,
      revision_id: current.revision.id,
      action: "Submit",
    });
    await decideCostSource(reviewer, input.id, {
      ...crmBase(),
      expected_version: current.source.version + 1,
      revision_id: current.revision.id,
      action,
    });
    const decided = await readCostSource(p, input.id);
    assert.equal(decided.source.state, action);
    assert.equal(decided.can_revise, true);
    assert.equal(decided.can_submit, false);
    if (action === "Returned")
      await reviseCostSource(p, input.id, {
        ...crmBase(),
        expected_version: decided.source.version,
        content: { ...input.content, title: "SYN corrected returned evidence" },
      });
  }
  assert.equal(
    successor.previous_revision?.content_hash,
    d.revision.content_hash,
  );
  assert.equal(
    (await readCostSource(p, input.id, { revision_id: d.revision.id })).revision
      .content_hash,
    d.revision.content_hash,
  );
  assert.equal(
    (await decideCostSource(reviewer, input.id, review)).replayed,
    true,
  );
  await assert.rejects(
    reviseCostSource(p, input.id, {
      ...crmBase(),
      expected_version: 3,
      content: input.content,
    }),
    code("VersionConflict"),
  );
  await assert.rejects(
    database().query(
      "UPDATE ppo.cost_source_revisions SET reason='rewrite' WHERE id=$1",
      [d.revision.id],
    ),
    code("55000"),
  );
  await assert.rejects(
    database().query("DELETE FROM ppo.cost_source_events WHERE source_id=$1", [
      input.id,
    ]),
    code("55000"),
  );
  await database().query(
    "UPDATE ppo.permission_grants SET valid_to=clock_timestamp() WHERE user_id=$1 AND capability='estimating.source.review'",
    [reviewer.actor_id],
  );
  try {
    await assert.rejects(readOperation(reviewer, review.operation_id));
    await assert.rejects(decideCostSource(reviewer, input.id, review));
  } finally {
    await database().query(
      "UPDATE ppo.permission_grants SET valid_to=NULL WHERE user_id=$1 AND capability='estimating.source.review'",
      [reviewer.actor_id],
    );
  }
});
test("ES03 explicit successor retains original estimate and quote bytes, carries exact reviewed provenance and replays once", async () => {
  const { p, input, d } = await reviewed(),
    opportunity = crmCreate();
  await createOpportunity(p, opportunity);
  const estimate = estimateInput(opportunity.id);
  await createEstimate(p, estimate);
  const old = await readEstimate(p, estimate.id),
    quote = quoteCommand(old.saved);
  await prepareQuote(p, estimate.id, quote);
  const quoteBefore = (
    await database().query(
      "SELECT to_jsonb(q) AS value FROM ppo.draft_quote_revisions q WHERE id=$1",
      [quote.id],
    )
  ).rows[0].value;
  const proposal = {
    estimate_version_id: old.saved.id,
    pricing_date: "2026-09-24",
    selections: [
      {
        line_id: old.saved.lines[0].id,
        source_id: input.id,
        revision_id: d.revision.id,
        expected_source_version: 3,
      },
    ],
  };
  const comparison = await previewSourceRefresh(p, estimate.id, proposal);
  assert.equal(comparison.cost_change, "-40.00");
  assert.equal(comparison.sell_change, "0.00");
  assert.match(comparison.changes[0].warning!, /Unknown/);
  const command = {
    ...crmBase(),
    expected_version: 1,
    proposal,
    comparison_hash: comparison.comparison_hash,
    reviewed: true,
  };
  const receipt = await applySourceRefresh(p, estimate.id, command);
  assert.equal(
    (await applySourceRefresh(p, estimate.id, command)).replayed,
    true,
  );
  assert.deepEqual(
    await readOperation(p, command.operation_id),
    receipt.receipt,
  );
  const saved = await readEstimate(p, estimate.id);
  assert.equal(saved.version, 2);
  assert.equal(
    saved.saved.source_bindings?.[0].source_revision_id,
    d.revision.id,
  );
  assert.equal(saved.saved.lines[0].unit_sell, old.saved.lines[0].unit_sell);
  assert.deepEqual(
    (await readEstimate(p, estimate.id, { version_id: old.saved.id })).saved,
    old.saved,
  );
  assert.deepEqual(
    (
      await database().query(
        "SELECT to_jsonb(q) AS value FROM ppo.draft_quote_revisions q WHERE id=$1",
        [quote.id],
      )
    ).rows[0].value,
    quoteBefore,
  );
  const observer = (await createSession("observer")).principal;
  for (const capability of [
    "crm.opportunity.read",
    "shared.internal.read",
    "estimating.quote.read",
  ])
    await database().query(
      "INSERT INTO ppo.permission_grants(workspace_id,user_id,company_id,capability,scope_type,scope_id,valid_from) VALUES($1,$2,$3,$4,'Company',$3,'2026-01-01') ON CONFLICT DO NOTHING",
      [p.workspace_id, observer.actor_id, input.company_id, capability],
    );
  const safe = await readQuote(observer, quote.id);
  assert(!JSON.stringify(safe).includes(input.reference));
  assert(!JSON.stringify(safe).includes("unit_cost"));
  const sourcedQuote = quoteCommand(saved.saved, 2, 1);
  await prepareQuote(p, estimate.id, sourcedQuote);
  const sourcedSafe = JSON.stringify(
    await readQuote(observer, sourcedQuote.id),
  );
  assert(!sourcedSafe.includes(input.reference));
  assert(!sourcedSafe.includes("source_bindings"));
  assert(!sourcedSafe.includes("unit_cost"));
  const { title, scope, lines, policy } = saved.saved;
  await saveEstimate(p, estimate.id, {
    ...crmBase(),
    expected_version: 2,
    title: title + " wording",
    scope,
    lines,
    policy,
  });
  assert.equal(
    (await readEstimate(p, estimate.id)).saved.source_bindings?.[0]
      .source_revision_id,
    d.revision.id,
  );
  await saveEstimate(p, estimate.id, {
    ...crmBase(),
    expected_version: 3,
    title,
    scope,
    policy,
    lines: lines.map((l, i) => (i ? l : { ...l, quantity: "3.000" })),
  });
  assert.equal(
    (await readEstimate(p, estimate.id)).saved.source_bindings,
    undefined,
  );
  await assert.rejects(
    database().query(
      `INSERT INTO ppo.estimate_cost_source_bindings SELECT workspace_id,company_id,$1,line_id,source_revision_id,review_event_id,pricing_date,tier_minimum_quantity,unit_cost,created_by,created_at FROM ppo.estimate_cost_source_bindings WHERE estimate_version_id=$2`,
      [old.saved.id, saved.saved.id],
    ),
    code("55000"),
  );
});
test("ES03 comparison conflicts and a failed version write roll back all source bindings, events and receipts", async () => {
  const { p, input, d } = await reviewed(),
    opportunity = crmCreate();
  await createOpportunity(p, opportunity);
  const estimate = estimateInput(opportunity.id);
  await createEstimate(p, estimate);
  const old = await readEstimate(p, estimate.id);
  const proposal = {
    estimate_version_id: old.saved.id,
    pricing_date: "2026-09-24",
    selections: [
      {
        line_id: old.saved.lines[0].id,
        source_id: input.id,
        revision_id: d.revision.id,
        expected_source_version: 3,
      },
    ],
  };
  const comparison = await previewSourceRefresh(p, estimate.id, proposal),
    command = {
      ...crmBase(),
      expected_version: 1,
      proposal,
      comparison_hash: comparison.comparison_hash,
      reviewed: true,
    };
  await assert.rejects(
    applySourceRefresh(p, estimate.id, {
      ...command,
      comparison_hash: "0".repeat(64),
    }),
    code("SourceComparisonChanged"),
  );
  await database()
    .query(`CREATE FUNCTION ppo.test_source_fail() RETURNS trigger LANGUAGE plpgsql AS $$BEGIN RAISE EXCEPTION 'Synthetic failure before binding commit'; END$$;
    CREATE TRIGGER test_source_fail BEFORE INSERT ON ppo.estimate_cost_source_bindings FOR EACH ROW EXECUTE FUNCTION ppo.test_source_fail()`);
  try {
    await assert.rejects(
      applySourceRefresh(p, estimate.id, command),
      /Synthetic failure/,
    );
  } finally {
    await database().query(
      "DROP TRIGGER test_source_fail ON ppo.estimate_cost_source_bindings; DROP FUNCTION ppo.test_source_fail()",
    );
  }
  assert.equal(
    (await readEstimate(p, estimate.id)).current_version_id,
    old.saved.id,
  );
  assert.equal(
    (
      await database().query(
        "SELECT 1 FROM ppo.operation_receipts WHERE operation_id=$1",
        [command.operation_id],
      )
    ).rowCount,
    0,
  );
  await reviseCostSource(p, input.id, {
    ...crmBase(),
    expected_version: 3,
    content: { ...input.content, title: "A revised evidence title" },
  });
  await assert.rejects(
    applySourceRefresh(p, estimate.id, command),
    code("VersionConflict"),
  );
  const changed = {
    ...proposal,
    selections: [{ ...proposal.selections[0], expected_source_version: 4 }],
  };
  const newer = await previewSourceRefresh(p, estimate.id, changed);
  assert.equal(
    newer.bindings[0].source_revision_id,
    d.revision.id,
    "a deliberately selected previously reviewed revision remains an exact historical choice",
  );
  await applySourceRefresh(p, estimate.id, {
    ...command,
    operation_id: randomUUID(),
    proposal: changed,
    comparison_hash: newer.comparison_hash,
  });
});
