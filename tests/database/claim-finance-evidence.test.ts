import assert from "node:assert/strict";
import { beforeEach, after, test } from "node:test";
import { reset, migrate, seed } from "../../scripts/database";
import { database, closeDatabase } from "../../src/platform/database";
import { localConfig } from "../../src/platform/config";
import { createSession } from "../../src/platform/identity";
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
import { agreementCommand } from "../../src/maintenance/agreements";
import {
  prepareClaimEvidence,
  verifyClaimEvidence,
} from "../helpers/claim-finance-evidence";
import {
  requestFinanceEvidence,
  processFinanceJob,
  financeIssueBytes,
} from "../../src/finance/worker";
import { supportedTemplateDefinition } from "../../src/documents/publication/contracts";
import { supportedTemplateDefinition as legacyDefinition } from "../../src/documents/p11-template";
import { documentStore } from "../../src/documents/store";
import { listTemplates } from "../../src/documents/template-catalogue";
if (localConfig().database_name !== "ppo_synthetic_test")
  throw Error("Disposable database required");
process.env.PPO_ALLOW_RESET = "dispose-synthetic";
process.env.PPO_RESET_DATABASE = "ppo_synthetic_test";
beforeEach(reset);
after(closeDatabase);
const code =
  (...names: string[]) =>
  (e: unknown) =>
    names.includes((e as { code: string }).code);
async function reconciled() {
  const f = await agreementChargeFixture(),
    a = await saveAgreementClaim(f);
  await submitAgreementClaim(f, a.id);
  await reviewAgreementClaim(f, a.id);
  await beginAgreementClaim(f, a.id);
  await outcomeAgreementClaim(f, a.id);
  await reconcileAgreementClaim(f, a.id);
  return { f, id: a.id };
}
test("Claim evidence retains exact monetary output, template history, original bytes and receipt after agreement withdrawal/reseed", async () => {
  const { f, id } = await reconciled();
  const old = (
    await database().query("SELECT * FROM ppo.finance_templates ORDER BY id")
  ).rows;
  const policy = (
    await database().query("SELECT * FROM ppo.finance_template_policy")
  ).rows;
  await agreementCommand(f.reviewer, f.id, {
    ...base(),
    expected_version: 2,
    action: "Withdraw",
    authority_reference:
      "SYN withdrawal preserves exact historical charge evidence",
  });
  const out = await verifyClaimEvidence(
    f.reconciler,
    id,
    "AgreementCharge",
    "4800.00",
  );
  assert.match(out.html.bytes.toString(), new RegExp(f.first));
  assert.match(out.html.bytes.toString(), /2026-01-01/);
  assert.doesNotMatch(out.html.bytes.toString(), /Captured|undefined|null ·/);
  const template = (
    await database().query("SELECT * FROM ppo.finance_templates WHERE id=$1", [
      out.job.render_snapshot.template.id,
    ])
  ).rows[0];
  assert.equal(
    await supportedTemplateDefinition("OUT-14", 3, template.definition),
    template.definition,
  );
  const retained = (
    await listTemplates(f.reconciler, { family: "OUT-14" })
  ).items.find((t) => t.id === template.id);
  assert.ok(retained);
  assert.equal(retained.runtime_support, "Supported");
  assert.equal(retained.definition_integrity, true);
  assert.equal(retained.selected_by_policy, false);
  assert.equal(retained.definition_eligible, false);
  assert.deepEqual(
    (await database().query("SELECT * FROM ppo.finance_template_policy")).rows,
    policy,
  );
  for (const t of old)
    assert.equal(await legacyDefinition("OUT-14", t.version), t.definition);
  await migrate();
  await seed();
  assert.deepEqual(
    (
      await database().query(
        "SELECT * FROM ppo.finance_templates WHERE version<3 ORDER BY id",
      )
    ).rows,
    old,
  );
  assert.deepEqual(
    (await financeIssueBytes(f.reconciler, out.issue, { format: "pdf" })).bytes,
    out.pdf.bytes,
  );
});
test("Claim evidence recovers the same stored bundle after a post-storage failure without a second issue", async () => {
  const { f, id } = await reconciled(),
    { job } = await prepareClaimEvidence(f.reconciler, id);
  const failed = await processFinanceJob(job.id, {
    afterStore: async () => {
      throw Error("SYN database response lost after storage");
    },
  });
  assert.equal("state" in failed && failed.state, "Failed");
  const ctx = { ...f.reconciler, operation_id: job.id };
  const original = await documentStore().locate(ctx);
  assert.ok(original);
  const retry = await processFinanceJob(job.id, {
    afterRender: async () => {
      assert.fail("Original bundle must never be rendered again");
    },
  });
  assert.ok("issue_id" in retry, JSON.stringify(retry));
  assert.deepEqual(await documentStore().locate(ctx), original);
  assert.equal(retry.issue_id, job.render_snapshot.output.issue_id);
  assert.equal(
    (
      await database().query(
        "SELECT count(*)::int n FROM ppo.finance_issues WHERE handoff_id=$1",
        [id],
      )
    ).rows[0].n,
    1,
  );
});
test("Claim evidence refuses release when the selected template policy changes during rendering", async () => {
  const { f, id } = await reconciled(),
    { job } = await prepareClaimEvidence(f.reconciler, id);
  const result = await processFinanceJob(job.id, {
    afterStore: async () => {
      await database().query(
        "UPDATE ppo.finance_template_policy SET version=version+1 WHERE workspace_id=$1",
        [f.reconciler.workspace_id],
      );
    },
  });
  assert.ok(
    "state" in result && result.state === "StaleSource",
    JSON.stringify(result),
  );
  assert.equal(
    (
      await database().query(
        "SELECT count(*)::int n FROM ppo.finance_issues WHERE handoff_id=$1",
        [id],
      )
    ).rows[0].n,
    0,
  );
});
test("Claim evidence rechecks source and Finance issue authority before release and current read authority for originals", async () => {
  const { f, id } = await reconciled(),
    { job } = await prepareClaimEvidence(f.reconciler, id);
  const denied = await processFinanceJob(job.id, {
    afterStore: async () => {
      await database().query(
        "UPDATE ppo.permission_grants SET valid_to=clock_timestamp() WHERE user_id=$1 AND capability='finance.issue'",
        [f.reconciler.actor_id],
      );
    },
  });
  assert.ok(
    "state" in denied && denied.state === "Failed",
    JSON.stringify(denied),
  );
  assert.equal(
    (
      await database().query(
        "SELECT count(*)::int n FROM ppo.finance_issues WHERE handoff_id=$1",
        [id],
      )
    ).rows[0].n,
    0,
  );
  await database().query(
    "UPDATE ppo.permission_grants SET valid_to=null WHERE user_id=$1 AND capability='finance.issue'",
    [f.reconciler.actor_id],
  );
  const issued = await processFinanceJob(job.id);
  assert.ok("issue_id" in issued, JSON.stringify(issued));
  for (const profile of [
    "coordinator",
    "systems",
    "assigned-technician",
    "second-company",
    "other-workspace",
  ]) {
    const p = (await createSession(profile)).principal;
    await assert.rejects(
      financeIssueBytes(p, issued.issue_id, { format: "html" }),
      code("Forbidden", "RecordUnavailable"),
    );
  }
  await database().query(
    "UPDATE ppo.permission_grants SET valid_to=clock_timestamp() WHERE user_id=$1 AND capability='maintenance.read'",
    [f.reconciler.actor_id],
  );
  await assert.rejects(
    financeIssueBytes(f.reconciler, issued.issue_id, { format: "pdf" }),
    code("Forbidden", "RecordUnavailable"),
  );
});
test("Claim evidence requires reconciled state and exact IDs; concurrent original requests create one job", async () => {
  const f = await agreementChargeFixture(),
    a = await saveAgreementClaim(f);
  const r = await readFinance(f.reconciler, a.id);
  await assert.rejects(
    requestFinanceEvidence(f.reconciler, a.id, {
      ...base(),
      expected_version: r.handoff.version,
      revision_id: r.handoff.current_revision_id,
      review_id: f.first,
      reconciliation_id: f.second,
    }),
    code("FinanceStateChanged"),
  );
  await submitAgreementClaim(f, a.id);
  await reviewAgreementClaim(f, a.id);
  await beginAgreementClaim(f, a.id);
  await outcomeAgreementClaim(f, a.id);
  await reconcileAgreementClaim(f, a.id);
  const ready = await readFinance(f.reconciler, a.id);
  const cmd = {
    ...base(),
    expected_version: ready.handoff.version,
    revision_id: ready.handoff.current_revision_id,
    review_id: ready.reviews[0].id,
    reconciliation_id: ready.reconciliations[0].id,
  };
  await assert.rejects(
    requestFinanceEvidence(f.reconciler, a.id, { ...cmd, review_id: f.first }),
    code("SourceChanged"),
  );
  const results = await Promise.all([
    requestFinanceEvidence(f.reconciler, a.id, cmd),
    requestFinanceEvidence(f.reconciler, a.id, cmd),
  ]);
  assert.deepEqual(results[0].receipt, results[1].receipt);
  assert.equal(
    (
      await database().query(
        "SELECT count(*)::int n FROM ppo.finance_render_jobs WHERE handoff_id=$1",
        [a.id],
      )
    ).rows[0].n,
    1,
  );
});
