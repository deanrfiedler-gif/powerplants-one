import assert from "node:assert/strict";
import { after, test } from "node:test";
import { randomBytes, randomUUID } from "node:crypto";
import { tokenHash } from "../../src/platform/identity";
import { database, closeDatabase } from "../../src/platform/database";
import { localConfig } from "../../src/platform/config";
import { sourceInput } from "../helpers/estimating-sources";
import { CRM, crmBase, crmCreate } from "../helpers/crm";
import { estimateInput } from "../helpers/estimating";

const origin = process.env.PPO_TEST_ORIGIN ?? "http://127.0.0.1:3000";
if (localConfig().database_name !== "ppo_synthetic_test")
  throw Error("Disposable synthetic database only");
after(closeDatabase);
async function isolatedActor(template: string) {
  const user = randomUUID(),
    token = randomBytes(32).toString("hex");
  await database().query(
    "INSERT INTO ppo.users(id,workspace_id,issuer,subject_id,display_name) VALUES($1,$2,'PPO-LocalSynthetic',$3,'SYN ES03 HTTP revocation actor')",
    [user, CRM.workspace, `source-http-${randomUUID()}`],
  );
  await database().query(
    "INSERT INTO ppo.permission_grants(workspace_id,user_id,company_id,capability,scope_type,scope_id,site_id) SELECT workspace_id,$1,company_id,capability,scope_type,scope_id,site_id FROM ppo.permission_grants WHERE user_id=$2 AND capability IN ('shared.read','estimating.read','estimating.edit','estimating.source.review') AND valid_to IS NULL",
    [user, template],
  );
  // A real opaque server session; revoke only this test's actors while other HTTP files run.
  await database().query(
    "INSERT INTO ppo.sessions(token_hash,workspace_id,actor_id,expires_at) VALUES($1,$2,$3,clock_timestamp()+interval '1 hour')",
    [tokenHash(token), CRM.workspace, user],
  );
  return { user, cookie: `ppo_local_session=${token}` };
}
async function session(profile: string) {
  const r = await fetch(`${origin}/api/v1/local-session`, {
    method: "POST",
    headers: { Origin: origin, "Content-Type": "application/json" },
    body: JSON.stringify({ profile }),
  });
  assert.equal(r.status, 200);
  return r.headers.get("set-cookie")!.split(";")[0];
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
test("ES03 HTTP exact review, scoped reads, altered replay and revoked receipt authority", async () => {
  const ownerActor = await isolatedActor(CRM.owner),
    reviewerActor = await isolatedActor("e5030045-0000-4000-8000-000000000001"),
    owner = ownerActor.cookie,
    reviewer = reviewerActor.cookie,
    input = sourceInput(),
    path = `estimating/cost-sources/${input.id}`;
  const created = await request(owner, "estimating/cost-sources", input);
  assert.equal(created.status, 201);
  const receipt = await created.json();
  assert.deepEqual(
    await (await request(owner, `operations/${input.operation_id}`)).json(),
    receipt,
  );
  assert.equal(
    (await request(owner, "estimating/cost-sources", input)).status,
    200,
  );
  assert.equal(
    (
      await request(owner, "estimating/cost-sources", {
        ...input,
        reason: "Altered original",
      })
    ).status,
    409,
  );
  const read = await request(owner, path);
  assert.match(read.headers.get("cache-control")!, /no-store/);
  const d = await read.json();
  assert.equal(
    (
      await request(owner, `${path}/review`, {
        ...crmBase(),
        expected_version: 1,
        revision_id: d.revision.id,
        action: "Submit",
      })
    ).status,
    200,
  );
  assert.equal(
    (
      await request(owner, `${path}/review`, {
        ...crmBase(),
        expected_version: 2,
        revision_id: d.revision.id,
        action: "Reviewed",
      })
    ).status,
    404,
  );
  const decision = {
    ...crmBase(),
    expected_version: 2,
    revision_id: d.revision.id,
    action: "Reviewed",
  };
  assert.equal(
    (await request(reviewer, `${path}/review`, decision)).status,
    200,
  );
  assert.equal(
    (
      await request(owner, path, {
        ...crmBase(),
        expected_version: 1,
        content: input.content,
      })
    ).status,
    409,
  );
  const second = await session("second-company"),
    technician = await session("assigned-technician");
  assert.equal(
    (
      await (
        await request(second, `estimating/cost-sources?q=${input.reference}`)
      ).json()
    ).items.length,
    0,
  );
  assert.equal((await request(second, path)).status, 404);
  assert.equal((await request(technician, path)).status, 404);
  assert.equal(
    (await request(owner, "estimating/cost-sources?state=Approved")).status,
    422,
  );
  await database().query(
    "UPDATE ppo.permission_grants SET valid_to=clock_timestamp() WHERE user_id=$1 AND capability='estimating.source.review'",
    [reviewerActor.user],
  );
  try {
    assert.equal(
      (await request(reviewer, `operations/${decision.operation_id}`)).status,
      404,
    );
    assert.equal(
      (await request(reviewer, `${path}/review`, decision)).status,
      404,
    );
    const reduced = await (await request(reviewer, path)).json();
    assert.equal(reduced.can_review, false);
  } finally {
    await database().query(
      "UPDATE ppo.permission_grants SET valid_to=NULL WHERE user_id=$1 AND capability='estimating.source.review'",
      [reviewerActor.user],
    );
  }
  await database().query(
    "UPDATE ppo.permission_grants SET valid_to=clock_timestamp() WHERE user_id=$1 AND capability='estimating.read'",
    [ownerActor.user],
  );
  try {
    const denied = await request(owner, `${path}?revision_id=${d.revision.id}`);
    assert.equal(denied.status, 404);
    assert(
      !JSON.stringify(await denied.json()).includes(
        input.content.evidence_excerpt,
      ),
    );
    assert.equal(
      (await request(owner, `operations/${input.operation_id}`)).status,
      404,
    );
  } finally {
    await database().query(
      "UPDATE ppo.permission_grants SET valid_to=NULL WHERE user_id=$1 AND capability='estimating.read'",
      [ownerActor.user],
    );
  }
});
test("ES03 HTTP comparison is read-only, exact-version guarded and recovers one successor", async () => {
  const owner = await session("coordinator"),
    reviewer = await session("estimating-source-reviewer"),
    input = sourceInput(),
    source = `estimating/cost-sources/${input.id}`;
  assert.equal(
    (await request(owner, "estimating/cost-sources", input)).status,
    201,
  );
  const d = await (await request(owner, source)).json();
  await request(owner, `${source}/review`, {
    ...crmBase(),
    expected_version: 1,
    revision_id: d.revision.id,
    action: "Submit",
  });
  await request(reviewer, `${source}/review`, {
    ...crmBase(),
    expected_version: 2,
    revision_id: d.revision.id,
    action: "Reviewed",
  });
  const opportunity = crmCreate(),
    estimate = estimateInput(opportunity.id),
    path = `estimating/estimates/${estimate.id}`;
  assert.equal(
    (await request(owner, "crm/opportunities", opportunity)).status,
    201,
  );
  assert.equal(
    (await request(owner, "estimating/estimates", estimate)).status,
    201,
  );
  const old = await (await request(owner, path)).json();
  const proposal = {
    estimate_version_id: old.saved.id,
    pricing_date: "2026-09-24",
    selections: [
      {
        line_id: old.saved.lines[0].id,
        source_id: input.id,
        revision_id: d.revision.id,
        expected_source_version: 3,
      },
    ],
  };
  const preview = await request(
    owner,
    `${path}/source-refresh/preview`,
    proposal,
  );
  assert.equal(preview.status, 200);
  const comparison = await preview.json();
  assert.equal(comparison.cost_change, "-40.00");
  assert.equal((await (await request(owner, path)).json()).version, 1);
  const command = {
    ...crmBase(),
    expected_version: 1,
    proposal,
    comparison_hash: comparison.comparison_hash,
    reviewed: true,
  };
  assert.equal(
    (
      await request(owner, `${path}/source-refresh`, {
        ...command,
        comparison_hash: "0".repeat(64),
      })
    ).status,
    409,
  );
  const accepted = await request(owner, `${path}/source-refresh`, command);
  assert.equal(accepted.status, 200);
  const receipt = await accepted.json();
  assert.deepEqual(
    await (await request(owner, `operations/${command.operation_id}`)).json(),
    receipt,
  );
  assert.equal(
    (await request(owner, `${path}/source-refresh`, command)).status,
    200,
  );
  assert.equal((await (await request(owner, path)).json()).version, 2);
  assert.deepEqual(
    (await (await request(owner, `${path}?version_id=${old.saved.id}`)).json())
      .saved,
    old.saved,
  );
  assert.equal(
    (await request(owner, `${path}/source-refresh/preview`, proposal)).status,
    409,
  );
});
