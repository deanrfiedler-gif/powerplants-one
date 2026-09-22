import assert from "node:assert/strict";
import { before, after, test } from "node:test";
import { randomUUID } from "node:crypto";
import {
  fertigationFixture,
  saveCommand,
  fertigationBase,
} from "../helpers/fertigation";
import { closeDatabase } from "../../src/platform/database";
import {
  exportScope,
  outputBasis,
} from "../../src/estimating/fertigation/artifacts";
import { largeFertigationScope } from "../helpers/fertigation-large";
import { nativeExport } from "../../src/estimating/fertigation/output";
import { calculate } from "../../src/estimating/fertigation/engine";
const origin = process.env.PPO_TEST_ORIGIN ?? "http://127.0.0.1:3000";
let fixture: Awaited<ReturnType<typeof fertigationFixture>>,
  cookie = "";
async function signIn(profile = "coordinator") {
  const response = await fetch(origin + "/api/v1/local-session", {
    method: "POST",
    headers: { Origin: origin, "Content-Type": "application/json" },
    body: JSON.stringify({ profile }),
  });
  assert.equal(response.status, 200);
  return response.headers.get("set-cookie")!.split(";")[0];
}
async function call(
  path: string,
  value?: unknown,
  options: { cookie?: string; origin?: string; raw?: string } = {},
) {
  const payload =
    options.raw ?? (value === undefined ? undefined : JSON.stringify(value));
  const response = await fetch(origin + "/api/v1/" + path, {
    method: value === undefined && options.raw === undefined ? "GET" : "POST",
    headers: {
      Connection: "close",
      Cookie: options.cookie ?? cookie,
      Origin: options.origin ?? origin,
      "Content-Type": "application/json",
    },
    body: payload,
  });
  let body: string;
  try {
    body = await response.text();
  } catch (cause) {
    throw new Error(
      `HTTP response body failed for ${path}: status ${response.status}, type ${response.headers.get("content-type") ?? "absent"}, request bytes ${payload === undefined ? 0 : Buffer.byteLength(payload)}`,
      { cause },
    );
  }
  return {
    status: response.status,
    headers: response.headers,
    body: response.headers.get("content-type")?.includes("application/json")
      ? JSON.parse(body)
      : { message: body },
  };
}
before(async () => {
  fixture = await fertigationFixture();
  cookie = await signIn();
});
after(closeDatabase);

test("FN-T44/T56 direct HTTP portable import accepts the supported large graph while ordinary commands retain 2 MiB", async () => {
  const proposal = largeFertigationScope(),
    raw_json = JSON.stringify(
      nativeExport(
        outputBasis(fixture.detail.scope, fixture.detail.revision),
        proposal,
        calculate(proposal),
      ),
      null,
      2,
    );
  assert.ok(Buffer.byteLength(raw_json) > 2_097_152);
  const input = {
    id: randomUUID(),
    name: "SYN large portable import",
    estimating_workspace_id: fixture.workspaceId,
    option_id: fixture.optionId,
    revision_id: fixture.revisionId,
    expected_workspace_version: 1,
    coverage: fixture.create.coverage,
    raw_json,
  };
  const preview = await call("estimating/fertigation/import-preview", input);
  assert.equal(preview.status, 200, JSON.stringify(preview.body));
  assert.equal(preview.body.scope.valves.length, 1000);
  const accepted = await call("estimating/fertigation/import", {
    ...input,
    ...fertigationBase(),
    proposal_signature: preview.body.proposal_signature,
  });
  assert.equal(accepted.status, 201, JSON.stringify(accepted.body));
  const exact = await call(`estimating/fertigation/${input.id}`);
  assert.equal(exact.status, 200);
  assert.equal(exact.body.revision.proposal.valves.length, 1000);
  assert.equal(exact.body.calculation.connected_flow_m3h.value, 1000);
  const ordinaryOverflow = await call("estimating/fertigation", {
    ...fertigationBase(),
    raw_json,
  });
  assert.equal(ordinaryOverflow.status, 422);
  assert.equal(ordinaryOverflow.body.code, "PayloadTooLarge");
  assert.match(ordinaryOverflow.body.message, /Reduce the file or scope/);
  const portableOverflow = await call("estimating/fertigation/import-preview", {
    ...input,
    raw_json: "x".repeat(8 * 1024 * 1024),
  });
  assert.equal(portableOverflow.status, 422);
  assert.equal(portableOverflow.body.code, "PayloadTooLarge");
});
test("FN-T03/T08/T09/T11/T78/T86 direct HTTP exact revision, original replay and clean-session read", async () => {
  const path = `estimating/fertigation/${fixture.create.id}`,
    saved = await call(path);
  assert.equal(saved.status, 200);
  assert.match(saved.headers.get("cache-control")!, /no-store/);
  const proposal = saveCommand(fixture.detail);
  proposal.proposal.valves[0].label = "SYN HTTP edited irrigation valve";
  const accepted = await call(path + "/revisions", proposal);
  assert.equal(accepted.status, 201, JSON.stringify(accepted.body));
  assert.equal((await call(path + "/revisions", proposal)).status, 200);
  assert.deepEqual(
    (await call("operations/" + proposal.operation_id)).body,
    accepted.body,
  );
  const clean = await signIn();
  const exact = await call(
    `${path}?revision_id=${fixture.detail.revision.id}`,
    undefined,
    { cookie: clean },
  );
  assert.equal(exact.status, 200);
  assert.equal(
    exact.body.revision.content_hash,
    fixture.detail.revision.content_hash,
  );
  assert.equal(
    exact.body.revision.proposal.valves[0].label,
    fixture.proposal.valves[0].label,
  );
  const forbidden = await signIn("second-company");
  assert.equal(
    (await call(path, undefined, { cookie: forbidden })).status,
    404,
  );
  assert.equal((await call(path, undefined, { cookie: "" })).status, 401);
});
test("FN-T08/T41/T42/T44 direct HTTP native import preview and confirmation bind exact source/file and one authenticated intent", async () => {
  const raw_json = (
    await exportScope(
      fixture.p,
      fixture.create.id,
      fixture.detail.revision.id,
      "json",
    )
  ).body;
  const input = {
    id: randomUUID(),
    name: "SYN HTTP imported study",
    estimating_workspace_id: fixture.workspaceId,
    option_id: fixture.optionId,
    revision_id: fixture.revisionId,
    expected_workspace_version: 1,
    coverage: fixture.create.coverage,
    raw_json,
  };
  const path = "estimating/fertigation",
    preview = await call(path + "/import-preview", input);
  assert.equal(preview.status, 200, JSON.stringify(preview.body));
  assert.equal(preview.body.held, false);
  const command = {
    ...input,
    ...fertigationBase(),
    proposal_signature: preview.body.proposal_signature,
  };
  const foreign = await signIn("second-company");
  assert.equal(
    (await call(path + "/import-preview", input, { cookie: foreign })).status,
    404,
  );
  assert.equal(
    (await call(path + "/import", command, { cookie: foreign })).status,
    404,
  );
  assert.equal(
    (
      await call(path + "/import", command, {
        origin: "http://example.invalid",
      })
    ).status,
    403,
  );
  assert.equal(
    (
      await call(path + "/import", {
        ...command,
        name: "Changed after preview",
      })
    ).status,
    409,
  );
  const accepted = await call(path + "/import", command);
  assert.equal(accepted.status, 201, JSON.stringify(accepted.body));
  assert.equal((await call(path + "/import", command)).status, 200);
  assert.equal(
    (
      await call(path + "/import", {
        ...command,
        name: "Changed accepted intent",
      })
    ).status,
    409,
  );
  const exact = await call(`${path}/${input.id}`);
  assert.equal(exact.status, 200);
  assert.notEqual(
    exact.body.revision.proposal.valves[0].id,
    fixture.proposal.valves[0].id,
  );
  assert.equal(
    exact.body.revision.proposal.valves[0].master_id,
    exact.body.revision.proposal.masters[0].id,
  );
  assert.equal(
    (
      await call(path + "/import-preview", {
        ...input,
        raw_json: '{"duplicate":1,"duplicate":2}',
      })
    ).status,
    422,
  );
  const portable = JSON.parse(raw_json);
  portable.scope.evidence = [
    {
      id: randomUUID(),
      label: "Held document",
      kind: "document_reference",
      reference: `ppo-file:${randomUUID()}`,
      source_revision: "r01",
      sha256: "b".repeat(64),
      captured_date: null,
      attribution: "Synthetic",
      applicability: "Requires separately authorised bytes",
      notes: "",
    },
  ];
  const heldInput = {
      ...input,
      id: randomUUID(),
      raw_json: JSON.stringify(portable),
    },
    held = await call(path + "/import-preview", heldInput);
  assert.equal(held.status, 200);
  assert.equal(held.body.held, true);
  assert.equal(
    (
      await call(path + "/import", {
        ...heldInput,
        ...fertigationBase(),
        proposal_signature: held.body.proposal_signature,
      })
    ).status,
    422,
  );
});
test("FN-T10/T11/T86 direct HTTP rejects origin, spoofed authority, stale references and oversized UTF-8 envelopes", async () => {
  const path = `estimating/fertigation/${fixture.create.id}`,
    detail = (await call(path)).body,
    base = {
      ...fertigationBase(),
      expected_version: detail.scope.version,
      expected_revision_id: detail.revision.id,
      source_context_hash: detail.revision.binding.upstream_context_hash,
      proposal: detail.revision.proposal,
    };
  assert.equal(
    (
      await call(path + "/revisions", base, {
        origin: "http://example.invalid",
      })
    ).status,
    403,
  );
  for (const extra of [
    { approved: true },
    { actor_id: randomUUID() },
    { calculation: { fits: true } },
    { synthetic: false },
  ])
    assert.equal(
      (await call(path + "/revisions", { ...base, ...extra })).status,
      422,
    );
  assert.equal(
    (
      await call(path + "/revisions", {
        ...base,
        expected_revision_id: randomUUID(),
      })
    ).status,
    409,
  );
  const changed = structuredClone(base);
  changed.proposal.valves[0].master_id = randomUUID();
  assert.equal((await call(path + "/revisions", changed)).status, 422);
  assert.equal(
    (
      await call(path + "/revisions", undefined, {
        raw: JSON.stringify({ ...base, padding: "é".repeat(1_100_000) }),
      })
    ).status,
    422,
  );
  assert.equal(
    (await call(path + "/revisions", undefined, { raw: "{broken" })).status,
    422,
  );
});
