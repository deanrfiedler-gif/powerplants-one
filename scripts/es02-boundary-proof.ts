import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { writeFile } from "node:fs/promises";
import { canonical } from "../src/platform/operations";
import { localConfig } from "../src/platform/config";
import { maximumStructuredDiscovery } from "../tests/helpers/estimating-configuration";
import { crmBase, crmCreate } from "../tests/helpers/crm";
import type {
  previewDiscoveryCreate,
  previewDiscoveryChange,
} from "../src/estimating/discovery-workspaces";

if (localConfig().database_name !== "ppo_synthetic_test")
  throw Error("Disposable synthetic proof only");
const origin = process.env.PPO_TEST_ORIGIN ?? localConfig().origin;
assert.equal(new URL(origin).hostname, "127.0.0.1");
const login = await fetch(`${origin}/api/v1/local-session`, {
  method: "POST",
  headers: { Origin: origin, "Content-Type": "application/json" },
  body: JSON.stringify({ profile: "coordinator" }),
});
assert.equal(login.status, 200);
const cookie = login.headers.get("set-cookie")!.split(";")[0];
const measurements: {
  name: string;
  request_bytes: number;
  response_bytes: number;
  elapsed_ms: number;
  status: number;
}[] = [];
async function call<T>(
  name: string,
  path: string,
  value?: unknown,
  status = 200,
): Promise<T> {
  const body = value === undefined ? undefined : canonical(value),
    start = performance.now();
  const response = await fetch(`${origin}/api/v1/${path}`, {
    method: body === undefined ? "GET" : "POST",
    headers: {
      Cookie: cookie,
      ...(body ? { Origin: origin, "Content-Type": "application/json" } : {}),
    },
    body,
  });
  const bytes = await response.text();
  measurements.push({
    name,
    request_bytes: body ? Buffer.byteLength(body) : 0,
    response_bytes: Buffer.byteLength(bytes),
    elapsed_ms: Math.round((performance.now() - start) * 100) / 100,
    status: response.status,
  });
  assert.equal(response.status, status, bytes);
  return JSON.parse(bytes);
}
const opportunity = crmCreate();
await call("create opportunity", "crm/opportunities", opportunity, 201);
const discovery = maximumStructuredDiscovery();
const first = await call<Awaited<ReturnType<typeof previewDiscoveryCreate>>>(
  "maximum create preview",
  "estimating/workspaces/preview",
  { opportunity_id: opportunity.id, discovery },
);
const command = {
  ...crmBase(),
  id: randomUUID(),
  option_id: randomUUID(),
  revision_id: randomUUID(),
  opportunity_id: opportunity.id,
  discovery,
  expected_opportunity_version: first.expected_opportunity_version,
  context_hash: first.context_hash,
  confirmed_question_ids: first.required_confirmation_ids,
  configuration_confirmations: first.configuration_confirmations,
};
await call("maximum create", "estimating/workspaces", command, 201);
const path = `estimating/workspaces/${command.id}`;
await call("maximum main read", path);
discovery.configuration.systems[0].proposed_work =
  "SYN retained identity after a bounded maximum-scope edit";
const proposal = {
  kind: "Save",
  option_id: command.option_id,
  expected_version: 1,
  expected_revision_id: command.revision_id,
  discovery,
};
const preview = await call<Awaited<ReturnType<typeof previewDiscoveryChange>>>(
  "maximum working preview",
  path + "/preview",
  proposal,
);
const successor = {
  ...crmBase(),
  ...proposal,
  revision_id: randomUUID(),
  context_hash: preview.context_hash,
  comparison_hash: preview.comparison_hash,
  confirmed_question_ids: preview.required_confirmation_ids,
  configuration_confirmations: preview.configuration_confirmations,
};
await call("maximum save", path, successor);
await call("maximum exact comparison", path + "/compare", {
  baseline_id: command.revision_id,
  target_id: successor.revision_id,
});
// Full UTF-8 envelopes include confirmations, reason, hashes and IDs. Cross the
// byte limit with legal individual manual-evidence entries, not invalid fields.
const large = structuredClone(successor);
while (Buffer.byteLength(canonical(large)) < 65537) {
  large.discovery.configuration.evidence.push({
    id: randomUUID(),
    lineage: null,
    source_type: "Manual",
    source_id: null,
    source_version: null,
    observation: "界".repeat(1000),
    observed_on: "2026-09-21",
    note: null,
  });
}
await call("over-limit whole multibyte command", path, large, 422);
const result = {
  schema: discovery.configuration.definition_id,
  areas: 20,
  systems: 40,
  facts: 40,
  shared_request_limit: 65536,
  request_count: measurements.length,
  measurements,
  route: `/estimating/discovery/${command.id}?step=Configuration`,
  workspace_id: command.id,
  option_id: command.option_id,
  environment: {
    node: process.version,
    platform: process.platform,
    server_configuration: process.env.PPO_PROOF_CONFIGURATION ?? "Not recorded",
    loopback: true,
  },
  qualification:
    "One synthetic local sample per operation; not a production SLA. All independent collection maxima cannot be combined beyond the shared byte ceiling.",
};
await writeFile("tmp/es02-maximum.json", JSON.stringify(result, null, 2));
console.log(JSON.stringify(result, null, 2));
