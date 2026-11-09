import { randomUUID } from "node:crypto";
import { database } from "../../src/platform/database";
import { createSession } from "../../src/platform/identity";
import { commercialFixture, approvedBasis } from "./project-commercial";
import { crmBase } from "./crm";
import { commandClaims } from "../../src/projects/commercial/claims";
import { financeOptions, readFinance } from "../../src/finance/reads";
import {
  saveFinance,
  submitFinance,
  reviewFinance,
} from "../../src/finance/service";
export { crmBase, readFinance };
export async function projectFinanceFixture() {
  const f = await commercialFixture();
  await approvedBasis(f);
  const action = (expected_version: number, action: string) => ({
    ...crmBase(),
    basis_id: f.create.id,
    expected_version,
    action,
  });
  const milestones = [
    {
      id: randomUUID(),
      title: "Acceptance",
      trigger: "Reviewed contract acceptance",
      amount: "105.00",
    },
    {
      id: randomUUID(),
      title: "Delivery",
      trigger: "Reviewed delivery evidence",
      amount: "245.00",
    },
  ];
  await commandClaims(f.owner, f.project.id, {
    ...action(0, "Save"),
    milestones,
  });
  await commandClaims(f.owner, f.project.id, action(1, "Submit"));
  await commandClaims(f.reviewer, f.project.id, action(2, "Approve"));
  const completion = (index: number) => ({
    kind: "Milestone",
    target_id: milestones[index].id,
    target_version: 1,
    document_id: f.document.id,
    revision_id: f.document.revision_id,
    review_id: f.options.source.input.document_review_id,
    document_version: f.options.source.input.document_version,
    occurred_at: "2026-10-01T00:00:00.000Z",
    explanation: "SYN reviewed completed milestone evidence",
  });
  for (const i of [0, 1])
    await commandClaims(f.owner, f.project.id, {
      ...action(i + 3, "RecordEvidence"),
      completion: completion(i),
    });
  const principals = await Promise.all(
    [
      "finance",
      "finance-reviewer",
      "finance-processor",
      "finance-reconciler",
    ].map(async (name) => (await createSession(name)).principal),
  );
  for (const p of principals)
    await database().query(
      `INSERT INTO ppo.permission_grants(workspace_id,user_id,company_id,capability,scope_type,scope_id,site_id) SELECT g.workspace_id,$2,g.company_id,g.capability,g.scope_type,g.scope_id,g.site_id FROM ppo.permission_grants g WHERE g.workspace_id=$1 AND g.user_id=$3 AND g.capability NOT IN ('project.commercial.prepare','project.commercial.review') AND NOT EXISTS(SELECT 1 FROM ppo.permission_grants r WHERE r.workspace_id=g.workspace_id AND r.user_id=$2 AND r.capability=g.capability AND r.scope_type=g.scope_type AND r.scope_id=g.scope_id)`,
      [f.owner.workspace_id, p.actor_id, f.owner.actor_id],
    );
  const [preparer, reviewer, processor, reconciler] = principals;
  const options = await financeOptions(preparer);
  const account = options.accounts.find(
    (a) =>
      a.customer_id === f.project.organisation_id &&
      a.company_id === f.project.company_id,
  );
  if (!account) throw Error("Synthetic project account fixture missing");
  const draft = (versions = [4, 5]) => ({
    ...crmBase(),
    id: randomUUID(),
    source_kind: "ProjectClaim",
    project_id: f.project.id,
    basis_id: f.create.id,
    completion_versions: versions,
    account_id: account.id,
    mode: "SyntheticApi",
    definition_id: options.definition.id,
    definition_version: options.definition.version,
    policy_version: options.definition.policy_version,
    treatment_basis:
      "SYN whole milestone amounts; no tax invoice or operational posting",
  });
  return {
    ...f,
    commercial: f,
    preparer,
    reviewer,
    processor,
    reconciler,
    draft,
    completion,
    action,
    milestones,
  };
}
export async function saveClaim(
  f: Awaited<ReturnType<typeof projectFinanceFixture>>,
  versions = [4, 5],
) {
  const cmd = f.draft(versions),
    result = await saveFinance(f.preparer, null, cmd);
  return { id: cmd.id, cmd, result };
}
export async function approveClaim(
  f: Awaited<ReturnType<typeof projectFinanceFixture>>,
  id: string,
) {
  let r = await readFinance(f.preparer, id);
  await submitFinance(f.preparer, id, {
    ...crmBase(),
    expected_version: r.handoff.version,
  });
  r = await readFinance(f.preparer, id);
  await reviewFinance(f.reviewer, id, {
    ...crmBase(),
    expected_version: r.handoff.version,
    revision_id: r.handoff.current_revision_id,
    source_hash: r.revisions[0].source_hash,
    decision: "Approved",
  });
}
