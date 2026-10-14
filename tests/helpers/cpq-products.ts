import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { database } from "../../src/platform/database";
import { createSession } from "../../src/platform/identity";
import { createOpportunity } from "../../src/crm/opportunities";
import {
  createDiscoveryWorkspace,
  previewDiscoveryCreate,
} from "../../src/estimating/discovery-workspaces";
import {
  createRelationship,
  reviewRelationship,
} from "../../src/products/relationships";
import { decideProduct } from "../../src/products/commands";
import {
  productFixture,
  publishProduct,
  relationshipFixture,
} from "./products";
import { CRM, crmBase, crmCreate } from "./crm";
import { discoveryInput } from "./estimating-discovery";
import { cpqDefinition, cpqInput } from "./cpq";
import type {
  readRelease,
  readRun,
  readEstimateProducts,
} from "../../src/cpq/reads";
import type { previewCalculation, previewAdoption } from "../../src/cpq/runs";
import type { readEstimate } from "../../src/estimating/reads";

export async function cpqHttp<T>(
  cookie: string,
  path: string,
  body?: unknown,
  status = 200,
): Promise<T> {
  const origin =
    process.env.PPO_TEST_ORIGIN ??
    `http://127.0.0.1:${process.env.PPO_PORT ?? "3000"}`;
  const response = await fetch(`${origin}/api/v1/${path}`, {
    method: body === undefined ? "GET" : "POST",
    headers: {
      Cookie: cookie,
      Origin: origin,
      "Content-Type": "application/json",
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const result = await response.json();
  assert.equal(response.status, status, `${path}: ${JSON.stringify(result)}`);
  assert.match(response.headers.get("cache-control") ?? "", /no-store/);
  return result as T;
}

export async function cpqProductHttpScenario() {
  const f = await productFixture();
  const product = await publishProduct(f.author.p, f.reviewer.p, f.variant.id);
  const companion = await publishProduct(
    f.author.p,
    f.reviewer.p,
    f.similar.id,
  );
  const rel = {
    ...crmBase(),
    id: randomUUID(),
    from: { product_id: product.product.id, revision_id: product.revision.id },
    to: {
      product_id: companion.product.id,
      revision_id: companion.revision.id,
    },
    predecessor_id: null,
    content: relationshipFixture({
      type: "Compatibility",
      criteria: [
        {
          criterion: "Synthetic interface",
          outcome: "Met",
          evidence: "SYN conditional fixture only",
          owner: "SYN Engineering",
        },
      ],
    }),
  };
  await createRelationship(f.author.p, rel);
  const relationship = (
    await database().query(
      "SELECT * FROM ppo.product_relationships WHERE id=$1",
      [rel.id],
    )
  ).rows[0];
  await reviewRelationship(f.reviewer.p, rel.id, {
    ...crmBase(),
    expected_version: 1,
    content_hash: relationship.content_hash,
    outcome: "Conditional",
  });
  const review = (
    await database().query(
      "SELECT id FROM ppo.product_relationship_reviews WHERE relationship_id=$1",
      [rel.id],
    )
  ).rows[0];
  const d = cpqDefinition();
  d.schema_version = 2;
  d.parts[0].product = {
    product_id: product.product.id,
    revision_id: product.revision.id,
    content_hash: product.revision.content_hash,
    relationships: [
      {
        id: rel.id,
        content_hash: relationship.content_hash,
        review_id: review.id,
      },
    ],
  };
  d.parts.push({
    ...d.parts[0],
    key: "companion",
    product: {
      product_id: companion.product.id,
      revision_id: companion.revision.id,
      content_hash: companion.revision.content_hash,
      relationships: [],
    },
  });
  const estimator = await createSession("coordinator"),
    p = estimator.principal,
    cookie = `ppo_local_session=${estimator.token}`;
  for (const [actor, caps] of [
    [p, ["cpq.read", "cpq.author", "cpq.calculate", "products.read"]],
    [f.reviewer.p, ["cpq.read", "cpq.review"]],
    [f.author.p, ["cpq.read", "cpq.publish", "estimating.read"]],
  ] as const)
    for (const cap of caps)
      await database().query(
        "INSERT INTO ppo.permission_grants(workspace_id,user_id,company_id,capability,scope_type,scope_id) SELECT $1,$2,$3,$4,'Company',$3 WHERE NOT EXISTS(SELECT 1 FROM ppo.permission_grants WHERE workspace_id=$1 AND user_id=$2 AND company_id=$3 AND capability=$4)",
        [p.workspace_id, actor.actor_id, CRM.company, cap],
      );
  const release = {
    ...crmBase(),
    id: randomUUID(),
    company_id: CRM.company,
    expected_version: 0,
    definition: d,
  };
  await cpqHttp(cookie, "cpq/releases", release, 201);
  const view = await cpqHttp<Awaited<ReturnType<typeof readRelease>>>(
    cookie,
    `cpq/releases/${release.id}`,
  );
  await cpqHttp(
    f.reviewer.cookie,
    `cpq/releases/${release.id}/review`,
    {
      ...crmBase(),
      expected_version: 1,
      revision_id: view.current.id,
      content_hash: view.current.content_hash,
      outcome: "Approved",
    },
    201,
  );
  await cpqHttp(
    f.author.cookie,
    `cpq/releases/${release.id}/activate`,
    {
      ...crmBase(),
      expected_version: 2,
      revision_id: view.current.id,
      content_hash: view.current.content_hash,
      expected_activation_version: view.active?.version ?? 0,
    },
    201,
  );
  const opportunity = crmCreate();
  await createOpportunity(p, opportunity);
  const discovery = discoveryInput(),
    source = await previewDiscoveryCreate(p, {
      opportunity_id: opportunity.id,
      discovery,
    });
  const workspace = {
    ...crmBase(),
    id: randomUUID(),
    option_id: randomUUID(),
    revision_id: randomUUID(),
    opportunity_id: opportunity.id,
    discovery,
    expected_opportunity_version: source.expected_opportunity_version,
    context_hash: source.context_hash,
    confirmed_question_ids: source.required_confirmation_ids,
  };
  await createDiscoveryWorkspace(p, workspace);
  const endpoint = `estimating/workspaces/${workspace.id}/cpq`;
  const basis = await cpqHttp<Awaited<ReturnType<typeof previewCalculation>>>(
    cookie,
    `${endpoint}/preview?option_id=${workspace.option_id}&revision_id=${workspace.revision_id}`,
  );
  const command = {
    ...crmBase(),
    id: randomUUID(),
    option_id: workspace.option_id,
    revision_id: workspace.revision_id,
    binding_hash: basis.binding_hash,
    parent_id: null,
    input: cpqInput(),
  };
  const live = await cpqHttp<{ product_provenance: unknown }>(
    cookie,
    `${endpoint}/preview`,
    {
      option_id: command.option_id,
      revision_id: command.revision_id,
      binding_hash: command.binding_hash,
      input: command.input,
    },
  );
  const calculationReceipt = await cpqHttp(cookie, endpoint, command, 201);
  const run = await cpqHttp<Awaited<ReturnType<typeof readRun>>>(
    cookie,
    `cpq/runs/${command.id}`,
  );
  assert.deepEqual(run.product_provenance, live.product_provenance);
  const preview = await cpqHttp<Awaited<ReturnType<typeof previewAdoption>>>(
    cookie,
    `cpq/runs/${run.id}/adoption`,
  );
  const adoption = {
    ...crmBase(),
    estimate_id: randomUUID(),
    preview_hash: preview.preview_hash,
    result_hash: preview.result_hash,
    title: "SYN published Product estimate",
    scope: {
      included: "SYN sensor package",
      excluded: "Other work",
      assumptions: "Synthetic verification only",
    },
  };
  // Abort receipt delivery after the server commits. The client must recover
  // the original operation, never submit a newly invented adoption identity.
  const controller = new AbortController();
  const origin =
    process.env.PPO_TEST_ORIGIN ??
    `http://127.0.0.1:${process.env.PPO_PORT ?? "3000"}`;
  const lost = await fetch(`${origin}/api/v1/cpq/runs/${run.id}/adoption`, {
    method: "POST",
    headers: {
      Cookie: cookie,
      Origin: origin,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(adoption),
    signal: controller.signal,
  });
  assert.equal(lost.status, 201);
  controller.abort();
  await assert.rejects(
    lost.json(),
    (error: unknown) => (error as Error).name === "AbortError",
  );
  const adoptionReceipt = await cpqHttp(
    cookie,
    `operations/${adoption.operation_id}`,
  );
  const estimate = await cpqHttp<Awaited<ReturnType<typeof readEstimate>>>(
    cookie,
    `estimating/estimates/${adoption.estimate_id}`,
  );
  const provenancePath = `estimating/estimates/${estimate.id}/cpq-products?version_id=${estimate.current_saved.id}`;
  const provenance = await cpqHttp<
    Awaited<ReturnType<typeof readEstimateProducts>>
  >(cookie, provenancePath);
  assert.deepEqual(provenance.product_provenance, preview.product_provenance);
  assert.equal(
    provenance.product_provenance[0].product.compatibility,
    "ConditionalEvidence",
  );
  await decideProduct(f.author.p, product.product.id, {
    ...crmBase(),
    expected_version: product.product.version,
    revision_id: product.revision.id,
    action: "Withdrawn",
  });
  return {
    p,
    cookie,
    endpoint,
    command,
    calculationReceipt,
    run,
    adoption,
    adoptionReceipt,
    estimate,
    provenancePath,
    provenance,
    release,
  };
}
