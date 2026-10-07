import assert from "node:assert/strict";
import { before, after, test } from "node:test";
import { database, closeDatabase } from "../../src/platform/database";
import { localConfig } from "../../src/platform/config";
import { reset } from "../../scripts/database";
import { createSession } from "../../src/platform/identity";
import { productFixture, publishProduct } from "../helpers/products";
import { crmBase, crmCreate, CRM } from "../helpers/crm";
import { createOpportunity } from "../../src/crm/opportunities";
import { createEstimate, prepareQuote } from "../../src/estimating/service";
import { readEstimate } from "../../src/estimating/reads";
import { estimateInput, quoteCommand } from "../helpers/estimating";
import { sourceInput } from "../helpers/estimating-sources";
import {
  createCostSource,
  decideCostSource,
  reviseCostSource,
} from "../../src/estimating/sources/commands";
import { readCostSource } from "../../src/estimating/sources/reads";
import {
  previewSourceRefresh,
  applySourceRefresh,
} from "../../src/estimating/sources/refresh";
import { bindProductSource, reviseProduct } from "../../src/products/commands";
import { readProduct, productPricing } from "../../src/products/reads";
import {
  previewProductUse,
  linkProductUse,
  readProductUses,
} from "../../src/products/uses";
if (localConfig().database_name !== "ppo_synthetic_test")
  throw Error("Disposable test database required");
process.env.PPO_ALLOW_RESET = "dispose-synthetic";
process.env.PPO_RESET_DATABASE = "ppo_synthetic_test";
before(reset);
after(closeDatabase);

test("PD catalogue retirement and CostSource successors preserve saved estimate, quote and exact installed-use originals", async () => {
  const f = await productFixture(["estimating.read"]),
    p = (await createSession("coordinator")).principal,
    reviewer = (await createSession("estimating-source-reviewer")).principal;
  const source = sourceInput();
  await createCostSource(p, source);
  let s = await readCostSource(p, source.id);
  await decideCostSource(p, source.id, {
    ...crmBase(),
    expected_version: 1,
    revision_id: s.revision.id,
    action: "Submit",
  });
  await decideCostSource(reviewer, source.id, {
    ...crmBase(),
    expected_version: 2,
    revision_id: s.revision.id,
    action: "Reviewed",
  });
  const published = await publishProduct(
    f.author.p,
    f.reviewer.p,
    f.variant.id,
  );
  await bindProductSource(f.author.p, f.variant.id, {
    ...crmBase(),
    expected_version: published.product.version,
    revision_id: published.revision.id,
    source_id: source.id,
    source_revision_id: s.revision.id,
    status: "Mapped",
    evidence: "SYN exact product/source mapping",
  });
  const opportunity = crmCreate();
  await createOpportunity(p, opportunity);
  const estimate = estimateInput(opportunity.id);
  await createEstimate(p, estimate);
  const first = await readEstimate(p, estimate.id);
  const proposal = {
    estimate_version_id: first.saved.id,
    pricing_date: "2026-09-25",
    selections: [
      {
        line_id: first.saved.lines[0].id,
        source_id: source.id,
        revision_id: s.revision.id,
        expected_source_version: 3,
      },
    ],
  };
  const preview = await previewSourceRefresh(p, estimate.id, proposal);
  await applySourceRefresh(p, estimate.id, {
    ...crmBase(),
    expected_version: 1,
    proposal,
    comparison_hash: preview.comparison_hash,
    reviewed: true,
  });
  const saved = await readEstimate(p, estimate.id),
    quote = quoteCommand(saved.saved, 2);
  await prepareQuote(p, estimate.id, quote);
  const originalQuote = (
    await database().query(
      "SELECT to_jsonb(q) value FROM ppo.draft_quote_revisions q WHERE id=$1",
      [quote.id],
    )
  ).rows[0].value;
  const asset = (
    await database().query(
      "SELECT to_jsonb(a) value FROM ppo.assets a WHERE company_id=$1 ORDER BY id LIMIT 1",
      [CRM.company],
    )
  ).rows[0].value;
  const use = await previewProductUse(f.author.p, f.variant.id, {
    kind: "Asset",
    target_id: asset.id,
  });
  await linkProductUse(f.author.p, f.variant.id, {
    ...crmBase(),
    expected_version: use.product_version,
    revision_id: published.revision.id,
    kind: "Asset",
    target_id: asset.id,
    target_version: asset.version,
    evidence: "SYN exact installed product observation",
  });
  const retainedUses = await readProductUses(f.author.p, f.variant.id),
    before = await readProduct(f.author.p, f.variant.id);
  await reviseProduct(f.author.p, f.variant.id, {
    ...crmBase(),
    expected_version: before.product.version,
    content: {
      ...before.revision.content,
      lifecycle: "Retired",
      lifecycle_evidence:
        "SYN discontinuation source; installed impact requires Equipment review",
    },
  });
  await publishProduct(f.author.p, f.reviewer.p, f.variant.id);
  await reviseCostSource(p, source.id, {
    ...crmBase(),
    expected_version: 3,
    content: {
      ...source.content,
      title: "SYN later source",
      tiers: [{ minimum_quantity: "1", unit_cost: "125" }],
    },
  });
  s = await readCostSource(p, source.id);
  await decideCostSource(p, source.id, {
    ...crmBase(),
    expected_version: 4,
    revision_id: s.revision.id,
    action: "Submit",
  });
  await decideCostSource(reviewer, source.id, {
    ...crmBase(),
    expected_version: 5,
    revision_id: s.revision.id,
    action: "Reviewed",
  });
  assert.deepEqual((await readEstimate(p, estimate.id)).saved, saved.saved);
  assert.deepEqual(
    (
      await database().query(
        "SELECT to_jsonb(q) value FROM ppo.draft_quote_revisions q WHERE id=$1",
        [quote.id],
      )
    ).rows[0].value,
    originalQuote,
  );
  assert.deepEqual(
    (
      await database().query(
        "SELECT to_jsonb(a) value FROM ppo.assets a WHERE id=$1",
        [asset.id],
      )
    ).rows[0].value,
    asset,
  );
  assert.deepEqual(
    await readProductUses(f.author.p, f.variant.id),
    retainedUses,
  );
  assert.equal(
    (
      await readProduct(f.author.p, f.variant.id, {
        revision_id: published.revision.id,
      })
    ).selected_state,
    "Superseded",
  );
  // Historical source bindings survive catalogue publication; refreshing remains an explicit owner-domain command.
  assert.equal(
    (
      await productPricing(f.author.p, f.variant.id, {
        revision_id: published.revision.id,
      })
    ).sources.length,
    1,
  );
  const nextProposal = {
    ...proposal,
    estimate_version_id: saved.saved.id,
    selections: [
      {
        ...proposal.selections[0],
        revision_id: s.revision.id,
        expected_source_version: 6,
      },
    ],
  };
  const nextPreview = await previewSourceRefresh(p, estimate.id, nextProposal);
  assert.notEqual(nextPreview.cost_change, "0.00");
  assert.equal(nextPreview.sell_change, "0.00");
  assert.equal((await readEstimate(p, estimate.id)).saved.id, saved.saved.id);
  await applySourceRefresh(p, estimate.id, {
    ...crmBase(),
    expected_version: 2,
    proposal: nextProposal,
    comparison_hash: nextPreview.comparison_hash,
    reviewed: true,
  });
  assert.deepEqual(
    (await readEstimate(p, estimate.id, { version_id: saved.saved.id })).saved,
    saved.saved,
  );
  assert.deepEqual(
    (
      await database().query(
        "SELECT to_jsonb(q) value FROM ppo.draft_quote_revisions q WHERE id=$1",
        [quote.id],
      )
    ).rows[0].value,
    originalQuote,
  );
});

test("PD concurrent distinct successor commands have one winner and preserve an exact predecessor", async () => {
  const f = await productFixture(),
    before = await readProduct(f.author.p, f.variant.id);
  const outcomes = await Promise.allSettled(
    ["A", "B"].map((title) =>
      reviseProduct(f.author.p, f.variant.id, {
        ...crmBase(),
        expected_version: 1,
        content: {
          ...before.revision.content,
          title: `SYN concurrent ${title}`,
        },
      }),
    ),
  );
  assert.equal(outcomes.filter((o) => o.status === "fulfilled").length, 1);
  const rejected = outcomes.find((o) => o.status === "rejected");
  assert.equal(rejected?.reason.code, "StaleVersion");
  const after = await readProduct(f.author.p, f.variant.id);
  assert.equal(after.revisions.length, 2);
  assert.equal(after.previous?.id, before.revision.id);
});
