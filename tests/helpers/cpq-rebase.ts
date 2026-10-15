import { randomUUID } from "node:crypto";
import { database } from "../../src/platform/database";
import { evaluate } from "../../src/cpq/engine";
import { readRun } from "../../src/cpq/reads";
import { previewRebase, rebaseRun } from "../../src/cpq/rebase";
import { previewAdoption } from "../../src/cpq/runs";
import { saveEstimate } from "../../src/estimating/service";
import { arithmeticPolicy } from "../../src/estimating/math";
import { readEstimate } from "../../src/estimating/reads";
import type { Override } from "../../src/cpq/types";
import type { RebaseDecision } from "../../src/cpq/rebase-model";
import {
  costActors,
  reviewedCost,
  costDefinition,
  publishCosts,
  costDiscovery,
  calculateCosts,
} from "./cpq-costs";
import { productFixture, publishProduct } from "./products";
import { cpqInput } from "./cpq";
import { CRM, crmBase } from "./crm";

export const rebaseDecision = (
  o: Override,
  action: RebaseDecision["action"] = "Keep",
  value: string | null = null,
  target: string | null = null,
): RebaseDecision => ({
  source_target: o.target,
  kind: o.kind,
  action,
  target,
  value,
  reason: "SYN explicit rebase review",
});
export async function rebaseSetup(withProduct = false) {
  const actors = await costActors();
  const refs = [
    await reviewedCost(actors.p),
    await reviewedCost(actors.p, "hour", "40"),
  ];
  const d = costDefinition(refs);
  let product = null;
  let productAuthor = null;
  if (withProduct) {
    const f = await productFixture();
    productAuthor = f.author.p;
    product = await publishProduct(f.author.p, f.reviewer.p, f.variant.id);
    for (const actor of [actors.p, actors.reviewer, actors.publisher])
      await database().query(
        "INSERT INTO ppo.permission_grants(workspace_id,user_id,company_id,capability,scope_type,scope_id) VALUES($1,$2,$3,'products.read','Company',$3) ON CONFLICT DO NOTHING",
        [CRM.workspace, actor.actor_id, CRM.company],
      );
    d.parts[0].product = {
      product_id: product.product.id,
      revision_id: product.revision.id,
      content_hash: product.revision.content_hash,
      relationships: [],
    };
  }
  const release = await publishCosts(actors, d),
    g = await costDiscovery(actors.p);
  const input = cpqInput(),
    baseline = evaluate(d, input);
  const quantity: Override = {
    target: baseline.lines[0].target,
    basis_hash: baseline.lines[0].basis_hash,
    kind: "Quantity",
    value: "4.000",
    reason: "SYN original material choice",
  };
  const withQuantity = evaluate(d, { ...input, overrides: [quantity] });
  const labour: Override = {
    target: withQuantity.lines[1].target,
    basis_hash: withQuantity.lines[1].basis_hash,
    kind: "SellPrice",
    value: "90.00",
    reason: "SYN original labour choice",
  };
  input.overrides = [quantity, labour];
  const original = await calculateCosts(actors.p, g, null, input);
  return {
    ...actors,
    refs,
    d,
    product,
    productAuthor,
    release,
    g,
    original,
    overrides: [quantity, labour],
  };
}
export async function rebaseSuccessor(
  s: Awaited<ReturnType<typeof rebaseSetup>>,
  install = true,
) {
  const input = cpqInput();
  input.instances[0].facts.count = "6";
  input.instances[0].facts.install = install;
  const proposal = {
    revision_id: s.g.revision_id,
    input,
    decisions: [
      rebaseDecision(s.overrides[0]),
      rebaseDecision(s.overrides[1], install ? "Keep" : "Revoke"),
    ],
  };
  const preview = await previewRebase(s.p, s.original.run.id, proposal);
  const command = {
    ...crmBase(),
    ...proposal,
    id: randomUUID(),
    preview_hash: preview.preview_hash,
  };
  const receipt = await rebaseRun(s.p, s.original.run.id, command);
  return {
    proposal,
    preview,
    command,
    receipt,
    run: await readRun(s.p, command.id),
  };
}
export const rebaseAdoption = (
  preview: Awaited<ReturnType<typeof previewAdoption>>,
  decisions?: import("../../src/cpq/adoption-resolution").LineDecision[],
) => ({
  ...crmBase(),
  estimate_id: preview.binding.estimate_id ?? randomUUID(),
  preview_hash: preview.preview_hash,
  result_hash: preview.result_hash,
  title: "SYN explicit CPQ receiving",
  scope: {
    included: "SYN sensor package",
    excluded: "Live work",
    assumptions: "Synthetic governed prices",
  },
  ...(decisions ? { resolution: { decisions } } : {}),
});
export async function editRebaseEstimate(
  p: Awaited<ReturnType<typeof rebaseSetup>>["p"],
  id: string,
  lines: Awaited<ReturnType<typeof readEstimate>>["saved"]["lines"],
) {
  const e = await readEstimate(p, id);
  await saveEstimate(p, id, {
    ...crmBase(),
    schema_version: 2,
    expected_version: e.version,
    title: e.saved.title,
    scope: e.saved.scope,
    policy: arithmeticPolicy,
    lines,
  });
  return readEstimate(p, id);
}
