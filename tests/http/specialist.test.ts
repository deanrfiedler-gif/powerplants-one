import assert from "node:assert/strict";
import { before, test } from "node:test";
import { randomUUID } from "node:crypto";
import { execFileSync } from "node:child_process";
import {
  fixtureIds,
  fixtureProposal,
  receivingPolicy,
} from "../../src/estimating/specialist/fixture-policy";
import { base } from "../helpers/specialist";
const origin = process.env.PPO_TEST_ORIGIN ?? "http://127.0.0.1:3000";
let cookie = "";
before(async () => {
  execFileSync(
    process.execPath,
    ["--env-file=.env.local", "--import", "tsx", "scripts/es08-fixture.ts"],
    { stdio: "pipe" },
  );
  const r = await fetch(origin + "/api/v1/local-session", {
    method: "POST",
    headers: { Origin: origin, "Content-Type": "application/json" },
    body: JSON.stringify({ profile: "coordinator" }),
  });
  assert.equal(r.status, 200);
  cookie = r.headers.get("set-cookie")!.split(";")[0];
});
async function call(path: string, value?: unknown, raw?: string) {
  const r = await fetch(origin + "/api/v1/" + path, {
    method: value === undefined && raw === undefined ? "GET" : "POST",
    headers: {
      Connection: "close",
      Cookie: cookie,
      Origin: origin,
      "Content-Type": "application/json",
    },
    body: raw ?? (value === undefined ? undefined : JSON.stringify(value)),
  });
  return { status: r.status, headers: r.headers, body: await r.json() };
}
test("ES08-T05/T27/T35/T53/T57/T61/T70/T79 scoped full-envelope HTTP contract", async () => {
  const g = await call(
    `estimating/workspaces/${fixtureIds.estimating_workspace}`,
  );
  assert.equal(g.status, 200);
  const id = randomUUID(),
    p = fixtureProposal();
  for (const v of Object.values(p.inputs)) v.attribution.note = "é".repeat(600);
  p.inputs.span.raw = "-";
  p.inputs.sheet.raw = "1.";
  const create = {
    ...base(),
    id,
    name: "SYN HTTP incomplete screen study",
    estimating_workspace_id: fixtureIds.estimating_workspace,
    option_id: fixtureIds.option,
    revision_id: fixtureIds.revision,
    coverage: {
      kind: "FacilityScope",
      system_id: null,
      area_ids: [],
      facility_ids: [fixtureIds.facility],
    },
    expected_workspace_version: g.body.workspace.version,
    proposal: p,
  };
  assert.ok(Buffer.byteLength(JSON.stringify(create)) > 65536);
  assert.ok(Buffer.byteLength(JSON.stringify(create)) < 262144);
  const accepted = await call("estimating/configurations", create);
  assert.equal(accepted.status, 201, JSON.stringify(accepted.body));
  assert.match(accepted.headers.get("cache-control")!, /no-store/);
  assert.deepEqual(
    (await call(`operations/${create.operation_id}`)).body,
    accepted.body,
  );
  assert.equal((await call("estimating/configurations", create)).status, 200);
  const route = `estimating/configurations/${id}`,
    saved = await call(route);
  assert.equal(saved.body.draft.proposal.inputs.span.raw, "-");
  assert.equal(saved.body.draft.proposal.inputs.sheet.raw, "1.");
  const preview = await call(`${route}/preview`, {
    expected_version: 1,
    proposal: p,
  });
  assert.equal(preview.status, 200);
  assert.equal(preview.body.calculation.state, "Invalid");
  assert.equal(preview.body.calculation.positions.length, 0);
  for (const mutation of [
    { approved: true },
    { configuration_id: randomUUID() },
    { totals: { cost: "1" } },
    { schema_version: 2 },
  ])
    assert.equal(
      (
        await call(`${route}/preview`, {
          expected_version: 1,
          proposal: p,
          ...mutation,
        })
      ).status,
      422,
    );
  for (const rejected of [
    await call(`${route}/preview`, undefined, " ".repeat(262145) + "{}"),
    await call(`${route}/preview`, {
      expected_version: 1,
      proposal: p,
      extra: "é".repeat(140000),
    }),
    await call("estimating/estimates", undefined, " ".repeat(65537) + "{}"),
  ]) {
    assert.equal(rejected.status, 422); // established platform transport contract
    assert.equal(rejected.body.code, "PayloadTooLarge");
  }
  assert.equal((await call(`${route}?forged=1`)).status, 422);
  assert.equal(
    (
      await call("estimating/configurations", {
        ...create,
        ...base(),
        id: randomUUID(),
        coverage: {
          kind: "StructuredSystem",
          system_id: randomUUID(),
          area_ids: [randomUUID()],
          facility_ids: [],
        },
      })
    ).status,
    404,
  );
  assert.equal(
    (
      await call("estimating/configurations", {
        ...create,
        ...base(),
        id: randomUUID(),
        option_id: randomUUID(),
      })
    ).status,
    404,
  );
  const bad = JSON.stringify({ expected_version: 1, proposal: p }).replace(
    '"schema_version":1',
    '"__proto__":{},"schema_version":1',
  );
  assert.equal((await call(`${route}/preview`, undefined, bad)).status, 422);
  const cfg = await call(
    `estimating/configurations/${fixtureIds.configuration}`,
  );
  assert.equal(cfg.status, 200);
  const evidence = await call(
    `estimating/configurations/${fixtureIds.configuration}/history?run_id=${cfg.body.current_run.id}&export=1`,
  );
  assert.equal(evidence.status, 200);
  assert.match(evidence.headers.get("cache-control")!, /no-store/);
  assert.ok(JSON.stringify(evidence.body).includes("synthetic"));
});

test("ES08-T35/T39/T46/T59/T65/T70 native HTTP receiver rechecks signed exact server policy", async () => {
  const route = `estimating/configurations/${fixtureIds.configuration}`,
    d = (await call(route)).body,
    input = {
      run_id: d.current_run.id,
      resolved_set_id: d.current_resolved.id,
      resolved_set_hash: d.current_resolved.content_hash,
      estimate_id: d.estimate.id,
      estimate_version_id: d.estimate.version_id,
      expected_configuration_version: d.configuration.version,
      expected_workspace_version: d.source.workspace_version,
      expected_estimate_version: d.estimate.version,
      discovery_revision_id: d.current_run.snapshot.binding.revision_id,
      source_context_hash: d.current_run.snapshot.binding.context_hash,
      receiving_policy_id: d.receiving_policy.id,
      receiving_policy_hash: d.receiving_policy.hash,
      decisions: [],
      price_and_unit_proposals: receivingPolicy.mappings.map((m) => ({
        key: m.key,
        unit_cost: "1.00",
        unit_sell: "2.00",
        effective_date: "2026-09-21",
        reason: "SYN authored HTTP receiving proof",
      })),
    };
  const preview = await call(`${route}/receiving-preview`, input);
  assert.equal(preview.status, 200);
  assert.deepEqual(preview.body.blockers, []);
  assert.match(preview.headers.get("server-timing")!, /specialist;dur=/);
  assert.equal(
    (
      await call(`${route}/receiving-preview`, {
        ...input,
        synthetic: true,
        approved: true,
      })
    ).status,
    422,
  );
  assert.ok(
    (
      await call(`${route}/receiving-preview`, {
        ...input,
        receiving_policy_hash: "0".repeat(64),
      })
    ).body.blockers.length,
  );
  const invalid = {
    ...input,
    price_and_unit_proposals: input.price_and_unit_proposals.map((p, i) =>
      i ? p : { ...p, unit_sell: "0.99" },
    ),
  };
  assert.ok(
    (await call(`${route}/receiving-preview`, invalid)).body.blockers.some(
      (b: { code: string }) => b.code === "SpecialistPriceInvalid",
    ),
  );
  const command = {
    ...base(),
    ...input,
    proposal_signature: preview.body.proposal_signature,
  };
  assert.equal(
    (
      await call(`${route}/apply`, {
        ...command,
        proposal_signature: "0".repeat(64),
      })
    ).status,
    409,
  );
  assert.equal((await call(route)).body.estimate.version, d.estimate.version);
  const accepted = await call(`${route}/apply`, command);
  assert.equal(accepted.status, 201, JSON.stringify(accepted.body));
  assert.equal((await call(`${route}/apply`, command)).status, 200);
  assert.deepEqual(
    (await call(`operations/${command.operation_id}`)).body,
    accepted.body,
  );
  assert.equal(
    (await call(route)).body.estimate.version,
    d.estimate.version + 1,
  );
});
