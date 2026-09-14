import assert from "node:assert/strict";
import { test } from "node:test";
import { randomUUID } from "node:crypto";
import { crmBase, crmCreate } from "../helpers/crm";
import { discoveryInput } from "../helpers/estimating-discovery";
const origin = "http://127.0.0.1:3000";
async function session(profile = "coordinator") {
  const r = await fetch(`${origin}/api/v1/local-session`, {
    method: "POST",
    headers: { Origin: origin, "Content-Type": "application/json" },
    body: JSON.stringify({ profile }),
  });
  assert.equal(r.status, 200);
  return r.headers.get("set-cookie")!.split(";")[0];
}
async function call(cookie: string, path: string, body?: unknown) {
  const r = await fetch(`${origin}/api/v1/${path}`, {
    method: body === undefined ? "GET" : "POST",
    headers: {
      Cookie: cookie,
      ...(body === undefined
        ? {}
        : { Origin: origin, "Content-Type": "application/json" }),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  return { status: r.status, headers: r.headers, body: await r.json() };
}
async function setup() {
  const cookie = await session(),
    o = crmCreate();
  assert.equal((await call(cookie, "crm/opportunities", o)).status, 201);
  const discovery = discoveryInput(),
    preview = await call(cookie, "estimating/workspaces/preview", {
      opportunity_id: o.id,
      discovery,
    });
  assert.equal(preview.status, 200);
  const input = {
    ...crmBase(),
    id: randomUUID(),
    option_id: randomUUID(),
    revision_id: randomUUID(),
    opportunity_id: o.id,
    discovery,
    expected_opportunity_version: preview.body.expected_opportunity_version,
    context_hash: preview.body.context_hash,
    confirmed_question_ids: preview.body.required_confirmation_ids,
  };
  const result = await call(cookie, "estimating/workspaces", input);
  assert.equal(result.status, 201);
  return {
    cookie,
    o,
    input,
    result,
    path: `estimating/workspaces/${input.id}`,
  };
}
test("E2 HTTP persists explicit discovery, recovers one original response, branches without selecting and retains exact history", async () => {
  const s = await setup(),
    first = await call(s.cookie, s.path);
  assert.equal(first.status, 200);
  assert.match(first.headers.get("cache-control")!, /no-store/);
  assert.deepEqual(
    (await call(s.cookie, "estimating/workspaces", s.input)).body,
    s.result.body,
  );
  assert.deepEqual(
    (await call(s.cookie, `operations/${s.input.operation_id}`)).body,
    s.result.body,
  );
  const draft = {
    kind: "Branch",
    branch_mode: "CopyDiscovery",
    option_id: s.input.option_id,
    expected_version: 1,
    expected_revision_id: s.input.revision_id,
    copy_follow_up: {
      owner_id: first.body.workspace.owner_id,
      reason: "SYN reconfirm branch scope",
    },
  };
  const preview = await call(s.cookie, s.path + "/preview", draft);
  assert.equal(preview.status, 200);
  assert.equal(preview.body.compiled.scope_readiness, "Incomplete");
  const branch = {
    ...crmBase(),
    ...draft,
    new_option_id: randomUUID(),
    revision_id: randomUUID(),
    label: "B",
    context_hash: preview.body.context_hash,
    comparison_hash: preview.body.comparison_hash,
    confirmed_question_ids: [],
  };
  const accepted = await call(s.cookie, s.path, branch);
  assert.equal(accepted.status, 200);
  assert.deepEqual(
    (await call(s.cookie, `operations/${branch.operation_id}`)).body,
    accepted.body,
  );
  assert.deepEqual((await call(s.cookie, s.path, branch)).body, accepted.body);
  assert.equal(
    (await call(s.cookie, s.path)).body.workspace.selected_option_id,
    s.input.option_id,
  );
  const select = {
    ...crmBase(),
    action: "Select",
    option_id: branch.new_option_id,
    expected_version: 2,
    expected_revision_id: branch.revision_id,
    expected_selected_option_id: s.input.option_id,
  };
  assert.equal((await call(s.cookie, s.path + "/options", select)).status, 200);
  assert.equal(
    (await call(s.cookie, s.path + "/options", { ...select, ...crmBase() }))
      .status,
    409,
  );
  const archive = {
    ...crmBase(),
    action: "Archive",
    option_id: s.input.option_id,
    expected_version: 3,
    expected_revision_id: s.input.revision_id,
    expected_selected_option_id: branch.new_option_id,
  };
  assert.equal(
    (await call(s.cookie, s.path + "/options", archive)).status,
    200,
  );
  assert.deepEqual(
    (
      await call(
        s.cookie,
        s.path + `/revisions?revision_id=${s.input.revision_id}`,
      )
    ).body,
    first.body.options[0].revision,
  );
  assert.deepEqual(
    (await call(s.cookie, "estimating/workspaces", s.input)).body,
    s.result.body,
  );
  assert.equal(
    (await call(s.cookie, `estimating/workspaces?opportunity_id=${s.o.id}`))
      .body.items[0].selected_option_id,
    branch.new_option_id,
  );
  assert.equal(
    (await call(s.cookie, `crm/opportunities/${s.o.id}`)).body.version,
    1,
  );
});
test("E2 HTTP denies direct guessing, false confirmation, unsupported definitions, unbounded bodies and wrong origins without receipts", async () => {
  const s = await setup();
  for (const profile of [
    "systems",
    "assigned-technician",
    "observer",
    "second-company",
    "other-workspace",
  ]) {
    const other = await session(profile);
    for (const path of [
      s.path,
      s.path + `/revisions?revision_id=${s.input.revision_id}`,
      `operations/${s.input.operation_id}`,
    ])
      assert.equal((await call(other, path)).status, 404);
    assert.equal(
      (await call(other, "estimating/workspaces", s.input)).status,
      404,
    );
  }
  assert.equal((await call("", s.path)).status, 401);
  const draft = {
    kind: "Save",
    option_id: s.input.option_id,
    expected_version: 1,
    expected_revision_id: s.input.revision_id,
    discovery: discoveryInput(),
  };
  draft.discovery.scope.equipment_ids = [];
  const preview = await call(s.cookie, s.path + "/preview", draft);
  assert.equal(preview.status, 200);
  const input = {
    ...crmBase(),
    ...draft,
    revision_id: randomUUID(),
    context_hash: preview.body.context_hash,
    comparison_hash: preview.body.comparison_hash,
    confirmed_question_ids: [],
  };
  assert.equal(
    (await call(s.cookie, s.path, input)).body.code,
    "DiscoveryConfirmationRequired",
  );
  assert.equal(
    (await call(s.cookie, `operations/${input.operation_id}`)).status,
    404,
  );
  assert.equal(
    (
      await call(s.cookie, s.path, {
        ...input,
        confirmed_question_ids: preview.body.required_confirmation_ids,
        retained_hidden_answers: [],
      })
    ).status,
    422,
  );
  assert.equal(
    (
      await call(s.cookie, s.path + "/preview", {
        ...draft,
        discovery: { ...draft.discovery, definition_revision: "r02" },
      })
    ).status,
    422,
  );
  assert.equal(
    (
      await call(s.cookie, s.path + "/preview", {
        ...draft,
        padding: "x".repeat(65536),
      })
    ).body.code,
    "PayloadTooLarge",
  );
  const forbidden = await fetch(`${origin}/api/v1/${s.path}/preview`, {
    method: "POST",
    headers: {
      Cookie: s.cookie,
      Origin: "https://unrelated.invalid",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(draft),
  });
  assert.equal(forbidden.status, 403);
  assert.equal((await call(s.cookie, s.path)).body.workspace.version, 1);
});
