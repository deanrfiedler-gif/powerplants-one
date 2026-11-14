import assert from "node:assert/strict";
import type { Principal } from "../../src/platform/identity";
import { database } from "../../src/platform/database";
import { readFinance } from "../../src/finance/reads";
import { crmBase } from "./crm";
import {
  requestFinanceEvidence,
  processFinanceJob,
  financeIssueBytes,
} from "../../src/finance/worker";

export async function prepareClaimEvidence(p: Principal, id: string) {
  const r = await readFinance(p, id);
  const cmd = {
    ...crmBase(),
    expected_version: r.handoff.version,
    revision_id: r.handoff.current_revision_id,
    review_id: r.reviews[0].id,
    reconciliation_id: r.reconciliations[0].id,
  };
  const requested = await requestFinanceEvidence(p, id, cmd);
  assert.deepEqual(
    (await requestFinanceEvidence(p, id, cmd)).receipt,
    requested.receipt,
  );
  const job = (
    await database().query(
      "SELECT * FROM ppo.finance_render_jobs WHERE handoff_id=$1",
      [id],
    )
  ).rows[0];
  return { cmd, requested, job };
}
export async function verifyClaimEvidence(
  p: Principal,
  id: string,
  kind: string,
  total: string,
) {
  const { cmd, requested, job } = await prepareClaimEvidence(p, id);
  assert.equal(job.render_snapshot.source.source_kind, kind);
  assert.equal(job.render_snapshot.source.total, total);
  const result = await processFinanceJob(job.id);
  assert.ok("issue_id" in result, JSON.stringify(result));
  const html = await financeIssueBytes(p, result.issue_id, { format: "html" });
  const pdf = await financeIssueBytes(p, result.issue_id, { format: "pdf" });
  assert.match(
    html.bytes.toString(),
    new RegExp(`Total AUD ${total.replace(".", "\\.")}`),
  );
  assert.match(html.bytes.toString(), /not an invoice/);
  assert.match(html.bytes.toString(), /No customer distribution/);
  assert.ok(pdf.bytes.subarray(0, 5).equals(Buffer.from("%PDF-")));
  assert.deepEqual(
    (await requestFinanceEvidence(p, id, cmd)).receipt,
    requested.receipt,
  );
  assert.deepEqual(await processFinanceJob(job.id), { processed: false });
  assert.equal(
    (
      await database().query(
        "SELECT count(*)::int n FROM ppo.finance_issues WHERE handoff_id=$1",
        [id],
      )
    ).rows[0].n,
    1,
  );
  return { job, html, pdf, issue: result.issue_id };
}
