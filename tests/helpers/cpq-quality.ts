import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { database } from "../../src/platform/database";
import {
  readQuality,
  assessQuality,
  reviewQuality,
} from "../../src/cpq/quality";
import { saveRelease, reviewRelease } from "../../src/cpq/releases";
import { readRelease } from "../../src/cpq/reads";
import { previewAdoption, adoptRun } from "../../src/cpq/runs";
import type { Principal } from "../../src/platform/identity";
import {
  costActors,
  costDiscovery,
  calculateCosts,
  publishCosts,
} from "./cpq-costs";
import { cpqDefinition } from "./cpq";
import { crmBase, CRM } from "./crm";

export async function currentQuality(p: Principal, id: string) {
  const view = await readQuality(p, id);
  assert.ok("report" in view && view.report);
  return {
    expected_version: view.expected_version!,
    enrolled: view.enrolled!,
    latest_assessment: view.latest_assessment ?? null,
    report: view.report,
    report_hash: view.report_hash!,
  };
}
export async function retainedQuality(
  p: Principal,
  id: string,
  assessment_id: string,
) {
  const view = await readQuality(p, id, { assessment_id });
  assert.ok("assessment" in view && view.assessment);
  return { assessment: view.assessment, review: view.review };
}
export async function qualityActors() {
  const actors = await costActors();
  for (const actor of [actors.reviewer, actors.publisher])
    for (const cap of [
      "shared.read",
      "shared.internal.read",
      "crm.opportunity.read",
    ])
      await database().query(
        "INSERT INTO ppo.permission_grants(workspace_id,user_id,company_id,capability,scope_type,scope_id) VALUES($1,$2,$3,$4,'Company',$3) ON CONFLICT DO NOTHING",
        [CRM.workspace, actor.actor_id, CRM.company, cap],
      );
  return actors;
}
export async function qualityEstimate(p: Principal) {
  const group = await costDiscovery(p);
  const calculation = await calculateCosts(p, group);
  const preview = await previewAdoption(p, calculation.run.id);
  const command = {
    ...crmBase(),
    preview_hash: preview.preview_hash,
    result_hash: preview.result_hash,
    estimate_id: preview.binding.estimate_id ?? randomUUID(),
    title: "SYN quality impact estimate",
    scope: {
      included: "SYN sensors",
      excluded: "Operational work",
      assumptions: "Fictional software fixture",
    },
  };
  const receipt = await adoptRun(p, calculation.run.id, command);
  return { group, calculation, command, receipt };
}
export async function qualitySetup(withEstimate = false) {
  const actors = await qualityActors();
  const baseline = await publishCosts(actors, cpqDefinition());
  const estimate = withEstimate ? await qualityEstimate(actors.p) : null;
  const candidate = cpqDefinition();
  candidate.parts[0].tiers[0].unit_cost = "12.00";
  candidate.fixtures[0].expected.cost = "74.00";
  await saveRelease(actors.p, {
    ...crmBase(),
    id: baseline.release.id,
    company_id: CRM.company,
    expected_version: 3,
    definition: candidate,
  });
  const view = await readRelease(actors.p, baseline.release.id);
  await reviewRelease(actors.reviewer, view.release.id, {
    ...crmBase(),
    expected_version: view.release.version,
    revision_id: view.current.id,
    content_hash: view.current.content_hash,
    outcome: "Approved",
  });
  return { ...actors, baseline, view, candidate, estimate };
}
export async function assessAndReview(
  s: Awaited<ReturnType<typeof qualitySetup>>,
) {
  const preview = await currentQuality(s.p, s.view.release.id);
  const assess = {
    ...crmBase(),
    expected_version: preview.expected_version,
    report_hash: preview.report_hash,
  };
  const receipt = await assessQuality(s.p, s.view.release.id, assess);
  const assessed = await currentQuality(s.reviewer, s.view.release.id);
  const review = {
    ...crmBase(),
    expected_version: assessed.expected_version,
    assessment_id: assessed.latest_assessment!.id,
    report_hash: assessed.report_hash,
    outcome: "Approved",
  };
  const reviewed = await reviewQuality(s.reviewer, s.view.release.id, review);
  return { preview, assess, receipt, review, reviewed };
}
