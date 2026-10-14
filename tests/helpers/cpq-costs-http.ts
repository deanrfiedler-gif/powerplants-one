import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { database } from "../../src/platform/database";
import { createSession } from "../../src/platform/identity";
import { reviseCostSource } from "../../src/estimating/sources/commands";
import type { readRun, readRelease } from "../../src/cpq/reads";
import type { previewCalculation, previewAdoption } from "../../src/cpq/runs";
import type { readEstimate } from "../../src/estimating/reads";
import { cpqHttp } from "./cpq-products";
import {
  costActors,
  reviewedCost,
  costDefinition,
  costDiscovery,
} from "./cpq-costs";
import { CRM, crmBase } from "./crm";
import { cpqInput } from "./cpq";

export async function cpqCostHttpScenario() {
  const actors = await costActors(),
    refs = [
      await reviewedCost(actors.p),
      await reviewedCost(actors.p, "hour", "40"),
    ];
  const session = await createSession("coordinator"),
    reviewer = await createSession("products-reviewer"),
    publisher = await createSession("products-publisher");
  const cookie = `ppo_local_session=${session.token}`,
    reviewCookie = `ppo_local_session=${reviewer.token}`,
    publishCookie = `ppo_local_session=${publisher.token}`;
  const input = {
    ...crmBase(),
    id: randomUUID(),
    company_id: CRM.company,
    expected_version: 0,
    definition: costDefinition(refs),
  };
  await cpqHttp(cookie, "cpq/releases", input, 201);
  const release = await cpqHttp<Awaited<ReturnType<typeof readRelease>>>(
    cookie,
    `cpq/releases/${input.id}`,
  );
  await cpqHttp(
    reviewCookie,
    `cpq/releases/${input.id}/review`,
    {
      ...crmBase(),
      expected_version: 1,
      revision_id: release.current.id,
      content_hash: release.current.content_hash,
      outcome: "Approved",
    },
    201,
  );
  const head = (
    await database().query(
      "SELECT coalesce(max(version),0)::integer AS version FROM ppo.cpq_activations WHERE company_id=$1",
      [CRM.company],
    )
  ).rows[0].version;
  await cpqHttp(
    publishCookie,
    `cpq/releases/${input.id}/activate`,
    {
      ...crmBase(),
      expected_version: 2,
      revision_id: release.current.id,
      content_hash: release.current.content_hash,
      expected_activation_version: head,
    },
    201,
  );
  const g = await costDiscovery(actors.p),
    endpoint = `estimating/workspaces/${g.id}/cpq`,
    query = `?option_id=${g.option_id}&revision_id=${g.revision_id}`;
  const basis = await cpqHttp<Awaited<ReturnType<typeof previewCalculation>>>(
    cookie,
    endpoint + "/preview" + query,
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
  const calculationReceipt = await cpqHttp(cookie, endpoint, command, 201);
  const run = await cpqHttp<Awaited<ReturnType<typeof readRun>>>(
    cookie,
    `cpq/runs/${command.id}`,
  );
  assert.equal(run.result.engine, "PPO-CPQ-4");
  assert.equal(run.cost_provenance!.length, 2);
  assert.equal(run.result.totals.cost, "56.00");
  const preview = await cpqHttp<Awaited<ReturnType<typeof previewAdoption>>>(
    cookie,
    `cpq/runs/${run.id}/adoption`,
  );
  assert.deepEqual(preview.cost_provenance, run.cost_provenance);
  const adoption = {
    ...crmBase(),
    preview_hash: preview.preview_hash,
    result_hash: preview.result_hash,
    estimate_id: randomUUID(),
    title: "SYN governed cost HTTP",
    scope: {
      included: "SYN sensors",
      excluded: "External work",
      assumptions: "Synthetic rates only",
    },
  };
  const adoptionReceipt = await cpqHttp(
    cookie,
    `cpq/runs/${run.id}/adoption`,
    adoption,
    201,
  );
  const estimate = await cpqHttp<Awaited<ReturnType<typeof readEstimate>>>(
    cookie,
    `estimating/estimates/${adoption.estimate_id}`,
  );
  assert.equal(estimate.saved.source_bindings!.length, 2);
  await reviseCostSource(actors.p, refs[0].source_id, {
    ...crmBase(),
    expected_version: 3,
    content: { ...refs[0].content, title: "SYN successor awaiting review" },
  });
  return {
    p: actors.p,
    cookie,
    release,
    refs,
    endpoint,
    command,
    calculationReceipt,
    run,
    adoption,
    adoptionReceipt,
    estimate,
  };
}
