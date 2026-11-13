import assert from "node:assert/strict";
import { after, test } from "node:test";
import { mkdir, writeFile } from "node:fs/promises";
import { database, closeDatabase } from "../../src/platform/database";
import { localConfig } from "../../src/platform/config";
import { httpAcceptance } from "../helpers/acceptance-http";
import {
  agreementChargeFixture,
  saveAgreementClaim,
  submitAgreementClaim,
  reviewAgreementClaim,
  beginAgreementClaim,
  outcomeAgreementClaim,
  reconcileAgreementClaim,
  base,
  readFinance,
} from "../helpers/agreement-charge-finance";
import { processFinanceJob } from "../../src/finance/worker";
import { digest } from "../../src/documents/store";
if (localConfig().database_name !== "ppo_synthetic_test")
  throw Error("Disposable database required");
after(closeDatabase);
const h = httpAcceptance(localConfig().origin);
async function prepare() {
  const f = await agreementChargeFixture(),
    a = await saveAgreementClaim(f);
  await submitAgreementClaim(f, a.id);
  await reviewAgreementClaim(f, a.id);
  await beginAgreementClaim(f, a.id);
  await outcomeAgreementClaim(f, a.id);
  await reconcileAgreementClaim(f, a.id);
  const r = await readFinance(f.reconciler, a.id);
  const cmd = {
    ...base(),
    expected_version: r.handoff.version,
    revision_id: r.handoff.current_revision_id,
    review_id: r.reviews[0].id,
    reconciliation_id: r.reconciliations[0].id,
  };
  const path = `finance/handoffs/${a.id}/request-evidence`;
  const requested = await h.call("finance-reconciler", path, cmd);
  assert.equal(requested.status, 201, JSON.stringify(requested.body));
  return { f, id: a.id, path, cmd, requested };
}
test("Claim evidence HTTP preserves exact request receipts and refuses foreign scope, wrong duties and altered commands", async () => {
  const q = await prepare();
  const replay = await h.call("finance-reconciler", q.path, q.cmd);
  assert.equal(replay.status, 200, JSON.stringify(replay.body));
  assert.deepEqual(replay.body, q.requested.body);
  const changed = await h.call("finance-reconciler", q.path, {
    ...q.cmd,
    reason: "SYN different original body must conflict",
  });
  assert.equal(changed.status, 409, JSON.stringify(changed.body));
  for (const profile of [
    "finance",
    "coordinator",
    "systems",
    "second-company",
    "other-workspace",
  ]) {
    const denied = await h.call(profile, q.path, {
      ...q.cmd,
      operation_id: base().operation_id,
    });
    assert.ok([403, 404].includes(denied.status), JSON.stringify(denied.body));
  }
  assert.equal(
    (
      await database().query(
        "SELECT count(*)::int n FROM ppo.finance_render_jobs WHERE handoff_id=$1",
        [q.id],
      )
    ).rows[0].n,
    1,
  );
});
test("Claim evidence HTTP real renderer serves exact protected original HTML and PDF", async () => {
  const q = await prepare();
  const job = (
    await database().query(
      "SELECT * FROM ppo.finance_render_jobs WHERE handoff_id=$1",
      [q.id],
    )
  ).rows[0];
  const issued = await processFinanceJob(job.id);
  assert.ok("issue_id" in issued, JSON.stringify(issued));
  const evidencePath = "verification-evidence/http/claim-finance-evidence";
  await mkdir(evidencePath, { recursive: true });
  for (const format of ["html", "pdf"]) {
    const url: string = `${localConfig().origin}/api/v1/finance/issues/${issued.issue_id}/bytes?format=${format}`;
    const response: Response = await fetch(url, {
      headers: { cookie: await h.cookie("finance-reconciler") },
    });
    assert.equal(response.status, 200);
    const cacheDirectives = new Set(
      response.headers
        .get("cache-control")
        ?.split(",")
        .map((value) => value.trim().toLowerCase()),
    );
    assert.ok(cacheDirectives.has("private"));
    assert.ok(cacheDirectives.has("no-store"));
    const bytes = Buffer.from(await response.arrayBuffer());
    assert.equal(response.headers.get("x-content-sha256"), digest(bytes));
    assert.equal(response.headers.get("x-content-type-options"), "nosniff");
    assert.match(
      response.headers.get("content-security-policy")!,
      /default-src 'none'/,
    );
    if (format === "pdf") {
      assert.ok(bytes.subarray(0, 5).equals(Buffer.from("%PDF-")));
      assert.ok(bytes.length > 1000);
    } else {
      assert.match(bytes.toString(), /Total AUD 4800\.00/);
      assert.doesNotMatch(bytes.toString(), /undefined/);
    }
    const again = await fetch(url, {
      headers: { cookie: await h.cookie("finance-reconciler") },
    });
    assert.deepEqual(Buffer.from(await again.arrayBuffer()), bytes);
    const denied = await fetch(url, {
      headers: { cookie: await h.cookie("coordinator") },
    });
    assert.ok([403, 404].includes(denied.status));
    await writeFile(`${evidencePath}/agreement-charge.${format}`, bytes);
  }
  const issue = (
    await database().query(
      "SELECT manifest FROM ppo.finance_issues WHERE id=$1",
      [issued.issue_id],
    )
  ).rows[0];
  await writeFile(
    `${evidencePath}/manifest.json`,
    JSON.stringify(
      { source_head: process.env.PPO_SOURCE_HEAD ?? "local", ...issue },
      null,
      2,
    ),
  );
});
