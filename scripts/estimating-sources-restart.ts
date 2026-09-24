import assert from "node:assert/strict";
import { readFile, writeFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import { join } from "node:path";
import { expect, type Page } from "@playwright/test";
import { database } from "../src/platform/database";
import { localConfig } from "../src/platform/config";
import { createSession } from "../src/platform/identity";
import { digest } from "../src/documents/store";
import { decideCostSource } from "../src/estimating/sources/commands";
import type { readCostSource } from "../src/estimating/sources/reads";
import type { readEstimate } from "../src/estimating/reads";
import type { previewSourceRefresh } from "../src/estimating/sources/refresh";
import type { OperationReceipt } from "../src/platform/operations";
import { readOperation } from "../src/shared/receipts";
import { crmBase, crmCreate } from "../tests/helpers/crm";
import { estimateInput } from "../tests/helpers/estimating";
import { sourceInput } from "../tests/helpers/estimating-sources";
import type { CostingCall } from "../tests/helpers/estimating-costing-api";

type Accepted = {
  path: string;
  body: Record<string, unknown>;
  receipt: OperationReceipt;
};
type Saved = Awaited<ReturnType<typeof readEstimate>>["saved"];
type Proof = {
  source_id: string;
  revision_id: string;
  estimate_id: string;
  original: Saved;
  saved: Saved;
  source: unknown;
  rows: unknown[];
  accepted: Accepted[];
  review: { body: Record<string, unknown>; receipt: OperationReceipt };
  pids: number[];
  starts: string[];
};

async function exactRows(sourceId: string, estimateId: string) {
  // JSON projection retains exact database values without driver date conversions.
  const sourceRows = await Promise.all(
    ["cost_sources", "cost_source_revisions", "cost_source_events"].map(
      async (table) =>
        (
          await database().query(
            `SELECT to_jsonb(t) AS row FROM ppo.${table} t WHERE ${table === "cost_sources" ? "id" : "source_id"}=$1 ORDER BY to_jsonb(t)::text`,
            [sourceId],
          )
        ).rows,
    ),
  );
  const estimateRows = await Promise.all(
    ["estimates", "estimate_versions"].map(
      async (table) =>
        (
          await database().query(
            `SELECT to_jsonb(t) AS row FROM ppo.${table} t WHERE ${table === "estimates" ? "id" : "estimate_id"}=$1 ORDER BY to_jsonb(t)::text`,
            [estimateId],
          )
        ).rows,
    ),
  );
  const bindings = (
    await database().query(
      `SELECT to_jsonb(b) AS row FROM ppo.estimate_cost_source_bindings b JOIN ppo.estimate_versions v ON v.id=b.estimate_version_id WHERE v.estimate_id=$1 ORDER BY to_jsonb(b)::text`,
      [estimateId],
    )
  ).rows;
  return [...sourceRows, ...estimateRows, bindings];
}

export async function sourcesRestart({
  phase,
  root,
  evidence,
  call,
  page,
  pid,
  databaseStart,
}: {
  phase: string;
  root: string;
  evidence: string;
  call: CostingCall;
  page: Page;
  pid: number;
  databaseStart: string;
}) {
  if (localConfig().database_name !== "ppo_synthetic_test")
    throw Error("Disposable ppo_synthetic_test only");
  assert.ok(["write", "recover", "verify"].includes(phase));
  const file = join(root, "cost-sources-proof.json");
  const reviewer = (await createSession("estimating-source-reviewer"))
    .principal;
  let proof: Proof;
  if (phase === "write") {
    const accepted: Accepted[] = [];
    const record: CostingCall = async (path, body) => {
      const result = await call(path, body);
      if (body && typeof body === "object" && "operation_id" in body)
        accepted.push({
          path,
          body: body as Record<string, unknown>,
          receipt: result as OperationReceipt,
        });
      return result;
    };
    const input = sourceInput(),
      path = `estimating/cost-sources/${input.id}`;
    await record("estimating/cost-sources", input);
    const initial = (await call(path)) as Awaited<
      ReturnType<typeof readCostSource>
    >;
    await record(`${path}/review`, {
      ...crmBase(),
      expected_version: 1,
      revision_id: initial.revision.id,
      action: "Submit",
    });
    const reviewBody = {
      ...crmBase(),
      expected_version: 2,
      revision_id: initial.revision.id,
      action: "Reviewed",
    };
    const reviewResult = await decideCostSource(reviewer, input.id, reviewBody);
    const opportunity = crmCreate(),
      estimate = estimateInput(opportunity.id);
    await record("crm/opportunities", opportunity);
    await record("estimating/estimates", estimate);
    const original = (
      (await call(`estimating/estimates/${estimate.id}`)) as Awaited<
        ReturnType<typeof readEstimate>
      >
    ).saved;
    const proposal = {
      estimate_version_id: original.id,
      pricing_date: "2026-09-24",
      selections: [
        {
          line_id: original.lines[0].id,
          source_id: input.id,
          revision_id: initial.revision.id,
          expected_source_version: 3,
        },
      ],
    };
    const comparison = (await call(
      `estimating/estimates/${estimate.id}/source-refresh/preview`,
      proposal,
    )) as Awaited<ReturnType<typeof previewSourceRefresh>>;
    assert.equal(comparison.cost_change, "-40.00");
    assert.equal(comparison.sell_change, "0.00");
    await record(`estimating/estimates/${estimate.id}/source-refresh`, {
      ...crmBase(),
      expected_version: 1,
      proposal,
      comparison_hash: comparison.comparison_hash,
      reviewed: true,
    });
    const saved = (
      (await call(`estimating/estimates/${estimate.id}`)) as Awaited<
        ReturnType<typeof readEstimate>
      >
    ).saved;
    assert.equal(
      saved.source_bindings?.[0].source_revision_id,
      initial.revision.id,
    );
    assert.equal(saved.lines[0].unit_sell, original.lines[0].unit_sell);
    // A later source draft must not rewrite the exact reviewed binding or saved costs.
    await record(path, {
      ...crmBase(),
      expected_version: 3,
      content: {
        ...input.content,
        title: "SYN later draft after deliberate cost refresh",
        tiers: [{ minimum_quantity: "1", unit_cost: "110" }],
      },
    });
    proof = {
      source_id: input.id,
      revision_id: initial.revision.id,
      estimate_id: estimate.id,
      original,
      saved,
      source: await call(`${path}?revision_id=${initial.revision.id}`),
      rows: await exactRows(input.id, estimate.id),
      accepted,
      review: { body: reviewBody, receipt: reviewResult.receipt },
      pids: [pid],
      starts: [databaseStart],
    };
  } else {
    proof = JSON.parse(await readFile(file, "utf8"));
    assert.ok(!proof.pids.includes(pid), "Require a new application process");
    assert.ok(
      !proof.starts.includes(databaseStart),
      "Require an actual PostgreSQL restart",
    );
    proof.pids.push(pid);
    proof.starts.push(databaseStart);
  }
  for (const original of proof.accepted) {
    assert.deepEqual(
      await call(`operations/${original.body.operation_id}`),
      original.receipt,
    );
    assert.deepEqual(
      await call(original.path, original.body),
      original.receipt,
    );
  }
  assert.deepEqual(
    await readOperation(reviewer, String(proof.review.body.operation_id)),
    proof.review.receipt,
  );
  assert.deepEqual(
    (await decideCostSource(reviewer, proof.source_id, proof.review.body))
      .receipt,
    proof.review.receipt,
  );
  assert.deepEqual(
    (
      (await call(`estimating/estimates/${proof.estimate_id}`)) as Awaited<
        ReturnType<typeof readEstimate>
      >
    ).saved,
    proof.saved,
  );
  assert.deepEqual(
    (
      (await call(
        `estimating/estimates/${proof.estimate_id}?version_id=${proof.original.id}`,
      )) as Awaited<ReturnType<typeof readEstimate>>
    ).saved,
    proof.original,
  );
  assert.deepEqual(
    await call(
      `estimating/cost-sources/${proof.source_id}?revision_id=${proof.revision_id}`,
    ),
    proof.source,
  );
  assert.deepEqual(
    await exactRows(proof.source_id, proof.estimate_id),
    proof.rows,
  );
  await page.goto(
    `${process.env.PPO_TEST_ORIGIN ?? "http://127.0.0.1:3000"}/estimating/cost-sources/${proof.source_id}?revision_id=${proof.revision_id}`,
  );
  await expect(
    page.getByRole("heading", {
      name: "SYN Controller unit price",
      exact: true,
    }),
  ).toBeVisible();
  const screenshot = await page.screenshot({
    path: join(evidence, `sources-${phase}.png`),
  });
  const checkout = execFileSync("git", ["rev-parse", "HEAD"], {
    encoding: "utf8",
  }).trim();
  await writeFile(
    join(evidence, `sources-${phase}.json`),
    JSON.stringify(
      {
        phase,
        source_head: process.env.PPO_SOURCE_HEAD ?? checkout,
        executed_checkout: checkout,
        tree: execFileSync("git", ["rev-parse", "HEAD^{tree}"], {
          encoding: "utf8",
        }).trim(),
        run_id: process.env.GITHUB_RUN_ID,
        run_attempt: process.env.GITHUB_RUN_ATTEMPT,
        viewport: page.viewportSize(),
        byte_count: screenshot.length,
        sha256: digest(screenshot),
        application_pids: proof.pids,
        database_starts: proof.starts,
        source_id: proof.source_id,
        estimate_id: proof.estimate_id,
        exact_rows_sha256: digest(Buffer.from(JSON.stringify(proof.rows))),
        receipt_count: proof.accepted.length + 1,
      },
      null,
      2,
    ),
  );
  await writeFile(file, JSON.stringify(proof, null, 2));
  console.log(
    `ES03 ${phase}: exact source history, reviewed binding, estimate predecessor/successor and ${proof.accepted.length + 1} original receipts retained across actual processes.`,
  );
}
