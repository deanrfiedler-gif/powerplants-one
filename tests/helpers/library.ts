import { randomUUID } from "node:crypto";
import { database } from "../../src/platform/database";
import { createSession } from "../../src/platform/identity";
import type { Principal } from "../../src/platform/identity";
import type { Capability } from "../../src/platform/permissions";
import { CRM, crmBase } from "./crm";
export { CRM };
export const base = crmBase;
export const libraryInput = (owner_id = CRM.owner) => ({
  ...base(),
  id: randomUUID(),
  revision_id: randomUUID(),
  company_id: CRM.company,
  organisation_id: CRM.org,
  site_id: CRM.site,
  title: "SYN Pump reference",
  document_type: "Technical reference",
  applicability: "Fictional pump inspection; no operating authority.",
  audience: "Internal service",
  owner_id,
  source: {
    kind: "SyntheticText",
    text: "SYN exact pump reference\nRevision one.",
  },
});
export async function grantLibrary(
  p: Principal,
  caps: Capability[] = [
    "document.read",
    "document.register",
    "document.review",
  ],
) {
  for (const cap of caps)
    await database().query(
      `INSERT INTO ppo.permission_grants(workspace_id,user_id,company_id,capability,scope_type,scope_id)
    SELECT $1,$2,$3,$4,'Company',$3 WHERE NOT EXISTS(SELECT 1 FROM ppo.permission_grants WHERE workspace_id=$1 AND user_id=$2 AND capability=$4 AND company_id=$3 AND scope_type='Company' AND scope_id=$3)`,
      [p.workspace_id, p.actor_id, CRM.company, cap],
    );
}
export async function librarySetup() {
  const p = (await createSession("coordinator")).principal,
    reviewer = (await createSession("cs-reviewer")).principal,
    observer = (await createSession("observer")).principal;
  await grantLibrary(p);
  await grantLibrary(reviewer);
  await grantLibrary(observer, ["document.read"]);
  return { p, reviewer, observer };
}
export function successor(
  input: ReturnType<typeof libraryInput>,
  expected_version: number,
  text = "SYN revised exact content",
) {
  const {
    id: _id,
    company_id: _company,
    organisation_id: _organisation,
    site_id: _site,
    ...fields
  } = input;
  void _id;
  void _company;
  void _organisation;
  void _site;
  return {
    ...fields,
    ...base(),
    revision_id: randomUUID(),
    expected_version,
    observed_revision_id: input.revision_id,
    source: { kind: "SyntheticText", text },
  };
}
