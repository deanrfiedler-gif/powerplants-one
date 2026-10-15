import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { createSession } from "../../src/platform/identity";
import { reviseCostSource } from "../../src/estimating/sources/commands";
import { readEstimate } from "../../src/estimating/reads";
import type { readRun, readEstimateProducts } from "../../src/cpq/reads";
import type { previewRebase } from "../../src/cpq/rebase";
import type { previewAdoption } from "../../src/cpq/runs";
import { cpqHttp } from "./cpq-products";
import {
  rebaseSetup,
  rebaseAdoption,
  rebaseDecision,
  editRebaseEstimate,
} from "./cpq-rebase";
import { cpqInput } from "./cpq";
import { crmBase } from "./crm";
import { manualLines } from "./estimating";

export async function cpqRebaseHttpScenario() {
  const s = await rebaseSetup(true),
    session = await createSession("coordinator");
  const cookie = `ppo_local_session=${session.token}`;
  const parentEndpoint = `cpq/runs/${s.original.run.id}`;
  const first = rebaseAdoption(
    await cpqHttp<Awaited<ReturnType<typeof previewAdoption>>>(
      cookie,
      parentEndpoint + "/adoption",
    ),
  );
  await cpqHttp(cookie, parentEndpoint + "/adoption", first, 201);
  const old = await readEstimate(s.p, first.estimate_id);
  const sensor = {
    ...old.saved.lines[0],
    description: "SYN kept manual HTTP choice",
    unit_sell: "16.00",
  };
  const manual = { ...manualLines()[0], allowance: false };
  const edited = await editRebaseEstimate(s.p, old.id, [
    sensor,
    old.saved.lines[1],
    manual,
  ]);
  const input = cpqInput();
  input.instances[0].facts.count = "6";
  input.instances[0].facts.install = false;
  const proposal = {
    revision_id: s.g.revision_id,
    input,
    decisions: [
      rebaseDecision(s.overrides[0]),
      rebaseDecision(s.overrides[1], "Revoke"),
    ],
  };
  const preview = await cpqHttp<Awaited<ReturnType<typeof previewRebase>>>(
    cookie,
    parentEndpoint + "/rebase/preview",
    proposal,
  );
  assert.equal(preview.ready, true);
  assert.equal(preview.result.ready, true);
  const command = {
    ...crmBase(),
    ...proposal,
    id: randomUUID(),
    preview_hash: preview.preview_hash,
  };
  const rebaseReceipt = await cpqHttp(
    cookie,
    parentEndpoint + "/rebase",
    command,
    201,
  );
  const run = await cpqHttp<Awaited<ReturnType<typeof readRun>>>(
    cookie,
    `cpq/runs/${command.id}`,
  );
  assert.equal(run.binding.rebase!.parent_id, s.original.run.id);
  await cpqHttp(cookie, `cpq/runs/${run.id}/adoption`, undefined, 409);
  const incomplete = await cpqHttp<Awaited<ReturnType<typeof previewAdoption>>>(
    cookie,
    `cpq/runs/${run.id}/adoption/preview`,
    { decisions: [] },
  );
  assert.equal(incomplete.ready, false);
  const decisions = [
    {
      line_id: sensor.id,
      action: "Keep" as const,
      reason: "SYN keep manual HTTP line",
    },
    {
      line_id: old.saved.lines[1].id,
      action: "Remove" as const,
      reason: "SYN acknowledge obsolete HTTP line",
    },
  ];
  const receiving = await cpqHttp<Awaited<ReturnType<typeof previewAdoption>>>(
    cookie,
    `cpq/runs/${run.id}/adoption/preview`,
    { decisions },
  );
  assert.equal(receiving.ready, true);
  const adoption = rebaseAdoption(receiving, decisions);
  const adoptionReceipt = await cpqHttp(
    cookie,
    `cpq/runs/${run.id}/adoption`,
    adoption,
    201,
  );
  const estimate = await cpqHttp<Awaited<ReturnType<typeof readEstimate>>>(
    cookie,
    `estimating/estimates/${old.id}`,
  );
  assert.deepEqual(
    estimate.saved.lines,
    edited.saved.lines.filter((line) => line.id !== old.saved.lines[1].id),
  );
  const provenancePath = `estimating/estimates/${old.id}/cpq-products?version_id=${estimate.saved.id}`;
  const provenance = await cpqHttp<
    Awaited<ReturnType<typeof readEstimateProducts>>
  >(cookie, provenancePath);
  assert.equal(provenance.status, "ResolvedAdoption");
  assert.equal(
    provenance.retained_history![0].origin_run_id,
    s.original.run.id,
  );
  await reviseCostSource(s.p, s.refs[0].source_id, {
    ...crmBase(),
    expected_version: 3,
    content: {
      ...s.refs[0].content,
      title: "SYN later source after resolved adoption",
    },
  });
  return {
    cookie,
    parentEndpoint,
    parent_id: s.original.run.id,
    run,
    command,
    rebaseReceipt,
    adoption,
    adoptionReceipt,
    estimate,
    provenancePath,
    provenance,
    source_ids: s.refs.map((r) => r.source_id),
    release_id: s.release.release.id,
  };
}
