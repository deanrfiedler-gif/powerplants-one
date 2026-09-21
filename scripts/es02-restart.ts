import assert from "node:assert/strict";
import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { expect, type Page } from "@playwright/test";
import { createNorthbankFixture, restoreFixtureOwner } from "./es02-fixture";
import { digest } from "../src/documents/store";
import type { readEstimate } from "../src/estimating/reads";
import { quoteCommand } from "../tests/helpers/estimating";

type Call = (path: string, body?: unknown) => Promise<unknown>;
type Proof = {
  fixture: Awaited<ReturnType<typeof createNorthbankFixture>>;
  reads: { path: string; value: unknown }[];
  receipts: {
    path: string;
    body: { operation_id: string };
    receipt: unknown;
  }[];
  quote: { id: string; html: string; pdf: string };
  pids: number[];
  starts: string[];
};
// Extends the existing real three-process E1/E2 harness. Original tests stay in
// place; structured revisions, independent v04/r02 costs and exact output join it.
export async function es02Restart({
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
  call: Call;
  page: Page;
  pid: number;
  databaseStart: string;
}) {
  const file = join(root, "es02-proof.json");
  let proof: Proof;
  if (phase === "write") {
    const fixture = await createNorthbankFixture();
    await restoreFixtureOwner();
    const path = `estimating/workspaces/${fixture.workspace_id}`;
    const estimate = (await call(
      `estimating/estimates/${fixture.estimate_id}`,
    )) as Awaited<ReturnType<typeof readEstimate>>;
    const quote = quoteCommand(estimate.saved, 4);
    await call(`estimating/estimates/${fixture.estimate_id}/quotes`, quote);
    await call(`estimating/quotes/${quote.id}/render`, {});
    const reads = [];
    for (const suffix of [
      "",
      `/summary?option_id=${fixture.option_id}`,
      `/history?option_id=${fixture.option_id}`,
      `/cost-versions?option_id=${fixture.option_id}`,
      ...[fixture.r01, fixture.r02, fixture.r03].map(
        (id) => `/revisions?revision_id=${id}`,
      ),
    ]) {
      reads.push({ path: path + suffix, value: await call(path + suffix) });
    }
    const receipts = [];
    for (const [kind, body] of Object.entries(fixture.commands)) {
      receipts.push({
        path: kind === "create" ? "estimating/workspaces" : path,
        body,
        receipt: await call(`operations/${body.operation_id}`),
      });
    }
    proof = {
      fixture,
      reads,
      receipts,
      quote: { id: quote.id, html: "", pdf: "" },
      pids: [pid],
      starts: [databaseStart],
    };
  } else {
    proof = JSON.parse(await readFile(file, "utf8"));
    assert.ok(
      !proof.pids.includes(pid),
      "A distinct application process is required",
    );
    assert.ok(
      !proof.starts.includes(databaseStart),
      "An actual PostgreSQL restart is required",
    );
    proof.pids.push(pid);
    proof.starts.push(databaseStart);
  }
  for (const read of proof.reads)
    assert.deepEqual(await call(read.path), read.value);
  for (const original of proof.receipts) {
    assert.deepEqual(
      await call(`operations/${original.body.operation_id}`),
      original.receipt,
    );
    assert.deepEqual(
      await call(original.path, original.body),
      original.receipt,
    );
  }
  const origin = process.env.PPO_TEST_ORIGIN ?? "http://127.0.0.1:3000";
  for (const kind of ["html", "pdf"] as const) {
    const response = await page
      .context()
      .request.get(
        `${origin}/api/v1/estimating/quotes/${proof.quote.id}/file?kind=${kind}`,
      );
    assert.ok(response.ok());
    const bytes = await response.body(),
      original = join(root, `es02-exact.${kind}`);
    if (phase === "write") {
      await writeFile(original, bytes);
      proof.quote[kind] = digest(bytes);
    } else {
      assert.deepEqual(bytes, await readFile(original));
      assert.equal(digest(bytes), proof.quote[kind]);
    }
  }
  await page.goto(`${origin}${proof.fixture.route}`);
  const summary = page.getByRole("complementary", { name: "Estimate summary" });
  await expect(summary).toContainText("AUD 58,400.00");
  await expect(summary).toContainText("Estimate v04");
  await expect(summary).toContainText("Discovery r02");
  await expect(page.getByRole("tab", { name: "Revisions 3" })).toBeVisible();
  const bytes = await page.screenshot({
    path: join(evidence, `es02-${phase}.png`),
  });
  await writeFile(file, JSON.stringify(proof));
  await writeFile(
    join(evidence, `es02-${phase}.json`),
    JSON.stringify(
      {
        phase,
        application_pids: proof.pids,
        database_starts: proof.starts,
        schema: proof.fixture.schema,
        quote: proof.quote,
        screenshot_sha256: digest(bytes),
        source_head:
          process.env.PPO_SOURCE_HEAD ?? "working tree; see handover manifest",
      },
      null,
      2,
    ),
  );
  console.log(
    `ES02 ${phase}: structured A r01/r02/r03, copied/fresh options, three original receipts, v04/r02 costs and original HTML/PDF bytes verified.`,
  );
}
