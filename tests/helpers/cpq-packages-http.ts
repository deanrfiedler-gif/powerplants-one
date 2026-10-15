import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { createSession } from "../../src/platform/identity";
import type { OperationReceipt } from "../../src/platform/operations";
import type { readPackage } from "../../src/cpq/packages";
import type { previewPackages } from "../../src/cpq/package-bindings";
import type { readRelease, readRun } from "../../src/cpq/reads";
import type { previewCalculation, previewAdoption } from "../../src/cpq/runs";
import { qualityActors, currentQuality } from "./cpq-quality";
import { reviewedCost, costDefinition, costDiscovery } from "./cpq-costs";
import { packageFixture, packageDecision } from "./cpq-packages";
import { cpqHttp } from "./cpq-products";
import { cpqInput } from "./cpq";
import { CRM, crmBase } from "./crm";

export async function cpqPackageHttpScenario() {
  const actors = await qualityActors(),
    cookie = `ppo_local_session=${(await createSession("coordinator")).token}`,
    reviewerCookie = `ppo_local_session=${(await createSession("products-reviewer")).token}`,
    publisherCookie = `ppo_local_session=${(await createSession("products-publisher")).token}`;
  const operations: {
    cookie: string;
    path: string;
    command: ReturnType<typeof crmBase> & Record<string, unknown>;
    receipt: OperationReceipt;
  }[] = [];
  const post = async (
    cookie: string,
    path: string,
    command: ReturnType<typeof crmBase> & Record<string, unknown>,
    loseReceipt = false,
  ) => {
    let receipt: OperationReceipt;
    if (loseReceipt) {
      const origin =
        process.env.PPO_TEST_ORIGIN ??
        `http://127.0.0.1:${process.env.PPO_PORT ?? "3000"}`;
      const controller = new AbortController();
      const lost = await fetch(`${origin}/api/v1/${path}`, {
        method: "POST",
        headers: {
          Cookie: cookie,
          Origin: origin,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(command),
        signal: controller.signal,
      });
      assert.equal(lost.status, 201);
      controller.abort();
      await assert.rejects(
        lost.json(),
        (error: unknown) => (error as Error).name === "AbortError",
      );
      receipt = await cpqHttp<OperationReceipt>(
        cookie,
        `operations/${command.operation_id}`,
      );
    } else
      receipt = await cpqHttp<OperationReceipt>(cookie, path, command, 201);
    operations.push({ cookie, path, command, receipt });
    return receipt;
  };
  const d = costDefinition([
    await reviewedCost(actors.p),
    await reviewedCost(actors.p, "hour", "40"),
  ]);
  const content = packageFixture(actors.p.actor_id, d),
    id = randomUUID(),
    path = `cpq/packages/${id}`;
  const save = {
    ...crmBase(),
    id,
    company_id: CRM.company,
    kind: "Rules",
    expected_version: 0,
    content,
  };
  await post(cookie, "cpq/packages", save);
  let view = await cpqHttp<Awaited<ReturnType<typeof readPackage>>>(
    cookie,
    path,
  );
  await post(cookie, path + "/attest", packageDecision(view), true);
  view = await cpqHttp(cookie, path);
  assert.equal(view.package.state, "Tested");
  await post(reviewerCookie, path + "/review", {
    ...packageDecision(view),
    evidence_hash: view.events.at(-1)!.report_hash,
    outcome: "Approved",
  });
  view = await cpqHttp(cookie, path);
  await post(publisherCookie, path + "/publish", {
    ...packageDecision(view),
    evidence_hash: view.events.at(-1)!.report_hash,
  });
  view = await cpqHttp(cookie, path);
  const refs = [
    {
      package_id: id,
      revision_id: view.current.id,
      content_hash: view.current.content_hash,
      publication_id: view.events.at(-1)!.id,
    },
  ];
  const composed = await cpqHttp<Awaited<ReturnType<typeof previewPackages>>>(
    cookie,
    "cpq/packages/compose",
    { company_id: CRM.company, definition: content.definition, packages: refs },
  );
  assert.equal(
    composed.package_manifest[0].fixture_owner_id,
    actors.p.actor_id,
  );
  const releaseId = randomUUID(),
    releasePath = `cpq/releases/${releaseId}`;
  await post(cookie, "cpq/releases", {
    ...crmBase(),
    id: releaseId,
    company_id: CRM.company,
    expected_version: 0,
    definition: composed.definition,
    packages: refs,
  });
  let release = await cpqHttp<Awaited<ReturnType<typeof readRelease>>>(
    cookie,
    releasePath,
  );
  await post(reviewerCookie, releasePath + "/review", {
    ...crmBase(),
    expected_version: 1,
    revision_id: release.current.id,
    content_hash: release.current.content_hash,
    outcome: "Approved",
  });
  const q = await cpqHttp<Awaited<ReturnType<typeof currentQuality>>>(
    cookie,
    releasePath + "/quality",
  );
  await post(cookie, releasePath + "/quality/assess", {
    ...crmBase(),
    expected_version: q.expected_version,
    report_hash: q.report_hash,
  });
  const assessed = await cpqHttp<Awaited<ReturnType<typeof currentQuality>>>(
    reviewerCookie,
    releasePath + "/quality",
  );
  await post(reviewerCookie, releasePath + "/quality/review", {
    ...crmBase(),
    expected_version: assessed.expected_version,
    assessment_id: assessed.latest_assessment!.id,
    report_hash: assessed.report_hash,
    outcome: "Approved",
  });
  release = await cpqHttp(cookie, releasePath);
  await post(publisherCookie, releasePath + "/activate", {
    ...crmBase(),
    expected_version: release.release.version,
    revision_id: release.current.id,
    content_hash: release.current.content_hash,
    expected_activation_version: q.report.baseline?.activation_version ?? 0,
  });
  const g = await costDiscovery(actors.p),
    endpoint = `estimating/workspaces/${g.id}/cpq`;
  const basis = await cpqHttp<Awaited<ReturnType<typeof previewCalculation>>>(
    cookie,
    endpoint + `/preview?option_id=${g.option_id}&revision_id=${g.revision_id}`,
  );
  const command = {
    ...crmBase(),
    id: randomUUID(),
    option_id: g.option_id,
    revision_id: g.revision_id,
    binding_hash: basis.binding_hash,
    parent_id: null,
    input: cpqInput(),
  };
  await post(cookie, endpoint, command);
  const run = await cpqHttp<Awaited<ReturnType<typeof readRun>>>(
    cookie,
    `cpq/runs/${command.id}`,
  );
  assert.deepEqual(run.binding.packages, composed.package_manifest);
  const preview = await cpqHttp<Awaited<ReturnType<typeof previewAdoption>>>(
    cookie,
    `cpq/runs/${run.id}/adoption`,
  );
  const adoption = {
    ...crmBase(),
    preview_hash: preview.preview_hash,
    result_hash: preview.result_hash,
    estimate_id: randomUUID(),
    title: "SYN package provenance",
    scope: {
      included: "SYN sensors",
      excluded: "Operational use",
      assumptions: "Synthetic target ownership",
    },
  };
  await post(cookie, `cpq/runs/${run.id}/adoption`, adoption, true);
  const withdraw = packageDecision(view);
  await post(cookie, path + "/withdraw", withdraw);
  const historical = await cpqHttp<Awaited<ReturnType<typeof readPackage>>>(
    cookie,
    path,
  );
  return {
    id,
    path,
    cookie,
    reviewerCookie,
    publisherCookie,
    operations,
    composed,
    run,
    release_id: releaseId,
    estimate_id: adoption.estimate_id,
    historical,
  };
}
