import { randomUUID } from "node:crypto";
import { database } from "../../src/platform/database";
import type { Principal } from "../../src/platform/identity";
import type { Capability } from "../../src/platform/permissions";
import { readTemplate } from "../../src/documents/template-catalogue";
import type { OutputFamily } from "../../src/documents/p11-template";
import { readProposal } from "../../src/documents/drafts/reads";
import { base, id, principal } from "./packs";
export { base, id, principal };
export async function grantDraft(
  p: Principal,
  caps: Capability[] = [
    "template.read",
    "template.propose",
    "template.review",
    "pack.read",
    "report.read",
    "finance.read",
    "shared.read",
    "shared.finance.read",
    "finance.account.read",
    "service.work_order.read",
    "schedule.read",
  ],
) {
  for (const cap of caps)
    await database().query(
      `INSERT INTO ppo.permission_grants(workspace_id,user_id,company_id,capability,scope_type,scope_id)
      SELECT $1,$2,$3,$4,'Company',$3 WHERE NOT EXISTS(SELECT 1 FROM ppo.permission_grants WHERE workspace_id=$1 AND user_id=$2 AND company_id=$3 AND capability=$4 AND scope_type='Company')`,
      [p.workspace_id, p.actor_id, id("20"), cap],
    );
}
export async function setupDraft() {
  const p = await principal(),
    reviewer = await principal("cs-reviewer");
  await grantDraft(p);
  await grantDraft(reviewer);
  return { p, reviewer };
}
export async function draftInput(
  p: Principal,
  family: OutputFamily = "OUT-09",
) {
  const t = await readTemplate(
    p,
    id(family === "OUT-09" ? "c1" : family === "OUT-10" ? "e1" : "f3", 2),
    { family },
  );
  return {
    ...base(),
    id: randomUUID(),
    revision_id: randomUUID(),
    company_id: id("20"),
    site_id: id("70"),
    family,
    base_template_id: t.id,
    base_content_hash: t.content_hash,
    body: {
      schema_version: 1,
      title: "SYN proposed field arrangement",
      audience: family === "OUT-10" ? "Customer" : "Internal",
      fields: [
        {
          key: "site",
          label: "Site",
          binding: family === "OUT-14" ? "site" : "site.name",
          required: true,
        },
      ],
    },
  };
}
export async function revisionInput(p: Principal, id: string) {
  const d = await readProposal(p, id);
  return {
    ...base(),
    expected_version: d.proposal.version,
    observed_revision_id: d.revision.id,
    revision_id: randomUUID(),
    body: { ...d.revision.body, title: "SYN revised arrangement" },
  };
}
export async function reviewCommand(
  p: Principal,
  id: string,
  outcome: "Reviewed" | "ChangesRequested" = "Reviewed",
) {
  const d = await readProposal(p, id);
  return {
    ...base(),
    review_id: randomUUID(),
    expected_version: d.proposal.version,
    revision_id: d.revision.id,
    content_hash: d.revision.content_hash,
    outcome,
    checks: Object.fromEntries(
      ["schema", "source_bindings", "audience"].map((key) => [
        key,
        {
          result: "Pass",
          note:
            "SYN inspected exact " + key + " proposal; no runtime publication.",
        },
      ]),
    ),
  };
}
