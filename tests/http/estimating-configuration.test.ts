import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { test } from "node:test";
import { crmBase, crmCreate } from "../helpers/crm";
import { structuredDiscovery } from "../helpers/estimating-configuration";
const origin = process.env.PPO_TEST_ORIGIN ?? "http://127.0.0.1:3000";
async function session(profile = "coordinator") {
  const response = await fetch(origin + "/api/v1/local-session", {
    method: "POST",
    headers: { Origin: origin, "Content-Type": "application/json" },
    body: JSON.stringify({ profile }),
  });
  assert.equal(response.status, 200);
  return response.headers.get("set-cookie")!.split(";")[0];
}
async function call(cookie: string, path: string, value?: unknown) {
  const response = await fetch(origin + "/api/v1/" + path, {
    method: value === undefined ? "GET" : "POST",
    headers: {
      Cookie: cookie,
      ...(value === undefined
        ? {}
        : { Origin: origin, "Content-Type": "application/json" }),
    },
    body: value === undefined ? undefined : JSON.stringify(value),
  });
  return {
    status: response.status,
    headers: response.headers,
    body: await response.json(),
  };
}
test("ES02 HTTP: exact structured create/receipt/history/summary/evidence/compare routes preserve authority and refuse future schema", async () => {
  const cookie = await session(),
    o = crmCreate();
  assert.equal((await call(cookie, "crm/opportunities", o)).status, 201);
  const discovery = structuredDiscovery(),
    first = await call(cookie, "estimating/workspaces/preview", {
      opportunity_id: o.id,
      discovery,
    });
  assert.equal(first.status, 200);
  const command = {
    ...crmBase(),
    id: randomUUID(),
    option_id: randomUUID(),
    revision_id: randomUUID(),
    opportunity_id: o.id,
    discovery,
    expected_opportunity_version: first.body.expected_opportunity_version,
    context_hash: first.body.context_hash,
    confirmed_question_ids: first.body.required_confirmation_ids,
    configuration_confirmations: first.body.configuration_confirmations,
  };
  const receipt = await call(cookie, "estimating/workspaces", command);
  assert.equal(receipt.status, 201);
  assert.deepEqual(
    (await call(cookie, `operations/${command.operation_id}`)).body,
    receipt.body,
  );
  assert.deepEqual(
    (await call(cookie, "estimating/workspaces", command)).body,
    receipt.body,
  );
  const path = `estimating/workspaces/${command.id}`;
  const reads = [
    path,
    `${path}/summary?option_id=${command.option_id}`,
    `${path}/history?option_id=${command.option_id}`,
    `${path}/cost-versions?option_id=${command.option_id}`,
    `${path}/evidence?revision_id=${command.revision_id}`,
  ];
  for (const target of reads) {
    const result = await call(cookie, target);
    assert.equal(result.status, 200, JSON.stringify(result.body));
    assert.match(result.headers.get("cache-control")!, /no-store/);
  }
  const comparison = {
    baseline_id: command.revision_id,
    target_id: command.revision_id,
  };
  assert.deepEqual(
    (await call(cookie, path + "/compare", comparison)).body.differences,
    [],
  );
  for (const profile of [
    "second-company",
    "other-workspace",
    "assigned-technician",
  ]) {
    const denied = await session(profile);
    for (const target of reads)
      assert.equal((await call(denied, target)).status, 404);
    assert.equal(
      (await call(denied, path + "/compare", comparison)).status,
      404,
    );
    assert.equal(
      (await call(denied, `operations/${command.operation_id}`)).status,
      404,
    );
  }
  assert.equal((await call("", reads[1])).status, 401);
  assert.equal(
    (
      await call(cookie, path + "/compare", {
        ...comparison,
        target_id: randomUUID(),
      })
    ).status,
    404,
  );
  const future = structuredClone(discovery) as unknown as {
    configuration: { schema_version: number };
  };
  future.configuration.schema_version = 2;
  assert.equal(
    (
      await call(cookie, path + "/preview", {
        kind: "Save",
        expected_version: 1,
        expected_revision_id: command.revision_id,
        option_id: command.option_id,
        discovery: future,
      })
    ).status,
    422,
  );
  assert.equal((await call(cookie, path)).body.workspace.version, 1);
});
