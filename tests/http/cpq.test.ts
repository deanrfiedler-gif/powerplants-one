import assert from "node:assert/strict";
import { after, test } from "node:test";
import { randomBytes, randomUUID } from "node:crypto";
import { database, closeDatabase } from "../../src/platform/database";
import { localConfig } from "../../src/platform/config";
import { createSession, tokenHash } from "../../src/platform/identity";
import { CRM, crmBase, crmCreate } from "../helpers/crm";
import { cpqDefinition, cpqInput } from "../helpers/cpq";
import { createOpportunity } from "../../src/crm/opportunities";
import {
  createDiscoveryWorkspace,
  previewDiscoveryCreate,
} from "../../src/estimating/discovery-workspaces";
import { discoveryInput } from "../helpers/estimating-discovery";
if (localConfig().database_name !== "ppo_synthetic_test")
  throw Error("Disposable synthetic database only");
const origin = process.env.PPO_TEST_ORIGIN ?? `http://127.0.0.1:${process.env.PPO_PORT ?? "3000"}`;
after(closeDatabase);
async function actor(cap: string) {
  const id = randomUUID(),
    token = randomBytes(32).toString("hex");
  await database().query(
    "INSERT INTO ppo.users(id,workspace_id,issuer,subject_id,display_name) VALUES($1,$2,'PPO-LocalSynthetic',$3,'SYN CPQ HTTP actor')",
    [id, CRM.workspace, `cpq-http-${id}`],
  );
  for (const duty of ["shared.read", "cpq.read", cap])
    await database().query(
      "INSERT INTO ppo.permission_grants(workspace_id,user_id,company_id,capability,scope_type,scope_id) VALUES($1,$2,$3,$4,'Company',$3)",
      [CRM.workspace, id, CRM.company, duty],
    );
  await database().query(
    "INSERT INTO ppo.sessions(token_hash,workspace_id,actor_id,expires_at) VALUES($1,$2,$3,clock_timestamp()+interval '1 hour')",
    [tokenHash(token), CRM.workspace, id],
  );
  return { id, cookie: `ppo_local_session=${token}` };
}
async function request(cookie: string, path: string, body?: unknown) {
  return fetch(`${origin}/api/v1/${path}`, {
    method: body === undefined ? "GET" : "POST",
    headers: {
      Cookie: cookie,
      Origin: origin,
      "Content-Type": "application/json",
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}
test("CPQ HTTP uses scoped exact commands, server fixtures and original-operation recovery", async () => {
  const author = await actor("cpq.author"),
    reviewer = await actor("cpq.review"),
    publisher = await actor("cpq.publish"),
    input = {
      ...crmBase(),
      id: randomUUID(),
      company_id: CRM.company,
      expected_version: 0,
      definition: cpqDefinition(),
    };
  let response = await request(author.cookie, "cpq/releases", input);
  assert.equal(response.status, 201);
  assert.match(response.headers.get("cache-control") ?? "", /no-store/);
  const receipt = await response.json();
  response = await request(author.cookie, "cpq/releases", input);
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), receipt);
  response = await request(author.cookie, "cpq/releases", {
    ...input,
    reason: "SYN changed content",
  });
  assert.equal(response.status, 409);
  assert.equal((await response.json()).code, "OperationConflict");
  response = await request(reviewer.cookie, `cpq/releases/${input.id}`);
  assert.equal(response.status, 200);
  const view = await response.json();
  response = await request(
    reviewer.cookie,
    `cpq/revisions/${view.current.id}/tests`,
  );
  assert.equal(response.status, 200);
  assert.equal((await response.json()).results[0].passed, true);
  response = await request(reviewer.cookie, `cpq/releases/${input.id}/review`, {
    ...crmBase(),
    expected_version: 1,
    revision_id: view.current.id,
    content_hash: view.current.content_hash,
    outcome: "Approved",
  });
  assert.equal(response.status, 201);
  const activation = {
    ...crmBase(),
    expected_version: 2,
    revision_id: view.current.id,
    content_hash: view.current.content_hash,
    expected_activation_version:
      (
        await (
          await request(author.cookie, `cpq/releases?company_id=${CRM.company}`)
        ).json()
      ).active?.version ?? 0,
  };
  response = await request(
    publisher.cookie,
    `cpq/releases/${input.id}/activate`,
    activation,
  );
  assert.equal(response.status, 201);
  const published = await response.json();
  response = await request(
    publisher.cookie,
    `operations/${activation.operation_id}`,
  );
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), published);
  response = await request(
    author.cookie,
    `cpq/releases?company_id=${CRM.companyB}`,
  );
  assert.equal(response.status, 404);
  response = await request(
    author.cookie,
    `cpq/releases/${input.id}?include_private=true`,
  );
  assert.equal(response.status, 422);
  response = await request(author.cookie, "cpq/releases", {
    ...input,
    ...crmBase(),
    definition: { ...input.definition, currency: "USD" },
  });
  assert.equal(response.status, 422);
  response = await fetch(`${origin}/api/v1/cpq/releases`, {
    method: "POST",
    headers: {
      Cookie: author.cookie,
      Origin: "https://unrelated.invalid",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });
  assert.equal(response.status, 403);
  // Build native source fixtures, then exercise every calculation/adoption route over HTTP.
  const estimator = await createSession("coordinator"),
    p = estimator.principal;
  for (const cap of ["cpq.read", "cpq.calculate"])
    await database().query(
      "INSERT INTO ppo.permission_grants(workspace_id,user_id,company_id,capability,scope_type,scope_id) SELECT $1,$2,$3,$4,'Company',$3 WHERE NOT EXISTS(SELECT 1 FROM ppo.permission_grants WHERE workspace_id=$1 AND user_id=$2 AND company_id=$3 AND capability=$4)",
      [p.workspace_id, p.actor_id, CRM.company, cap],
    );
  const cookie = `ppo_local_session=${estimator.token}`,
    opportunity = crmCreate();
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
  response = await request(
    cookie,
    `${endpoint}/preview?option_id=${workspace.option_id}&revision_id=${workspace.revision_id}`,
  );
  assert.equal(response.status, 200);
  const basis = await response.json(),
    run = {
      ...crmBase(),
      id: randomUUID(),
      option_id: workspace.option_id,
      revision_id: workspace.revision_id,
      binding_hash: basis.binding_hash,
      parent_id: null,
      input: cpqInput(),
    };
  response = await request(cookie, endpoint, run);
  assert.equal(response.status, 201);
  response = await request(cookie, endpoint, run);
  assert.equal(response.status, 200);
  response = await request(cookie, `cpq/runs/${run.id}`);
  assert.equal(response.status, 200);
  assert.equal((await response.json()).result.totals.sell, "105.00");
  response = await request(cookie, endpoint);
  assert.equal(response.status, 200);
  assert.equal((await response.json()).items[0].id, run.id);
  response = await request(cookie, `cpq/runs/${run.id}/compare?with=${run.id}`);
  assert.equal(response.status, 200);
  response = await request(cookie, `cpq/revisions/${view.current.id}`);
  assert.equal(response.status, 200);
  response = await request(cookie, `cpq/runs/${run.id}/adoption`);
  assert.equal(response.status, 200);
  const receiving = await response.json(),
    adoption = {
      ...crmBase(),
      estimate_id: randomUUID(),
      preview_hash: receiving.preview_hash,
      result_hash: receiving.result_hash,
      title: "SYN HTTP CPQ estimate",
      scope: {
        included: "SYN sensor package",
        excluded: "Other work",
        assumptions: "Synthetic verification only",
      },
    };
  response = await request(cookie, `cpq/runs/${run.id}/adoption`, adoption);
  assert.equal(response.status, 201);
  const adopted = await response.json();
  response = await request(cookie, `cpq/runs/${run.id}/adoption`, adoption);
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), adopted);
  response = await request(cookie, `operations/${adoption.operation_id}`);
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), adopted);
  response = await request(cookie, `cpq/runs/${run.id}/adoption`);
  assert.equal(response.status, 409);
  assert.equal((await response.json()).code, "CpqBasisChanged");
  response = await request(author.cookie, `cpq/runs/${run.id}`);
  assert.equal(response.status, 404);
  await database().query(
    "DELETE FROM ppo.permission_grants WHERE user_id=$1 AND capability='cpq.publish'",
    [publisher.id],
  );
  response = await request(
    publisher.cookie,
    `operations/${activation.operation_id}`,
  );
  assert.equal(response.status, 404);
  response = await request(
    publisher.cookie,
    `cpq/releases/${input.id}/activate`,
    activation,
  );
  assert.equal(response.status, 404);
});
