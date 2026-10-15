import assert from "node:assert/strict";
import { createSession } from "../../src/platform/identity";
import { readRelease } from "../../src/cpq/reads";
import type { OperationReceipt } from "../../src/platform/operations";
import { cpqHttp } from "./cpq-products";
import { qualitySetup, currentQuality, retainedQuality } from "./cpq-quality";
import { crmBase } from "./crm";

export async function cpqQualityHttpScenario() {
  const s = await qualitySetup(true);
  const cookie = `ppo_local_session=${(await createSession("coordinator")).token}`;
  const reviewerCookie = `ppo_local_session=${(await createSession("products-reviewer")).token}`;
  const publisherCookie = `ppo_local_session=${(await createSession("products-publisher")).token}`;
  const id = s.view.release.id,
    path = `cpq/releases/${id}/quality`;
  const q = await cpqHttp<Awaited<ReturnType<typeof currentQuality>>>(
    cookie,
    path,
  );
  assert.equal(q.enrolled, false);
  assert.ok(
    q.report.affected_estimates.some(
      (e) => e.estimate_id === s.estimate!.command.estimate_id,
    ),
  );
  const assess = {
    ...crmBase(),
    expected_version: q.expected_version,
    report_hash: q.report_hash,
  };
  const assessmentReceipt = await cpqHttp<OperationReceipt>(
    cookie,
    path + "/assess",
    assess,
    201,
  );
  const assessed = await cpqHttp<Awaited<ReturnType<typeof currentQuality>>>(
    reviewerCookie,
    path,
  );
  const review = {
    ...crmBase(),
    expected_version: assessed.expected_version,
    assessment_id: assessed.latest_assessment!.id,
    report_hash: assessed.report_hash,
    outcome: "Approved",
  };
  const reviewReceipt = await cpqHttp<OperationReceipt>(
    reviewerCookie,
    path + "/review",
    review,
    201,
  );
  const root = await readRelease(s.publisher, id);
  const activate = {
    ...crmBase(),
    expected_version: root.release.version,
    revision_id: root.current.id,
    content_hash: root.current.content_hash,
    expected_activation_version: q.report.baseline!.activation_version,
  };
  const activationReceipt = await cpqHttp<OperationReceipt>(
    publisherCookie,
    `cpq/releases/${id}/activate`,
    activate,
    201,
  );
  const historicalPath = `${path}?assessment_id=${review.assessment_id}`;
  const historical = await cpqHttp<Awaited<ReturnType<typeof retainedQuality>>>(
    cookie,
    historicalPath,
  );
  assert.deepEqual(historical.assessment.details.report, q.report);
  return {
    id,
    path,
    historicalPath,
    historical,
    cookie,
    reviewerCookie,
    publisherCookie,
    assess,
    review,
    activate,
    assessmentReceipt,
    reviewReceipt,
    activationReceipt,
    estimate_id: s.estimate!.command.estimate_id,
    p: s.p,
  };
}
