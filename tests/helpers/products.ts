import { randomBytes, randomUUID } from "node:crypto";
import { database } from "../../src/platform/database";
import { localConfig } from "../../src/platform/config";
import { tokenHash, type Principal } from "../../src/platform/identity";
import type { Capability } from "../../src/platform/permissions";
import { createProduct, decideProduct } from "../../src/products/commands";
import { readProduct } from "../../src/products/reads";
import {
  productCapabilities,
  type Content,
  type RelationshipContent,
} from "../../src/products/model";
import { CRM, crmBase } from "./crm";

export const productContentFixture = (
  patch: Partial<Content> = {},
): Content => ({
  title: "SYN Verdant control unit",
  manufacturer: "Fictional Verdant Controls",
  model: "VC-20",
  variant: "24 V / two relay",
  technical_revision: "TECH-A",
  source_reference: "SYN-TECH-NOTE-ONE",
  source_revision: "A",
  source_date: "2026-09-20",
  description:
    "Fictional controls evidence for catalogue verification; no installation authority.",
  unit: "each",
  attributes: [
    {
      key: "voltage",
      value: "24",
      unit: "V",
      status: "Reviewed",
      evidence: "SYN bench source A",
      clarification_owner: null,
    },
    {
      key: "interface",
      value: null,
      unit: "text",
      status: "Unresolved",
      evidence: "Protocol not supplied",
      clarification_owner: "SYN Engineering clarification owner",
    },
  ],
  documents: [
    {
      provider: "Synthetic SharePoint reference",
      entity_key: "SYN-VC20-24V",
      revision: "A",
      title: "SYN 24 V control specification",
      type: "PDF",
      applicability: "Applicable",
      basis: "Exact 24 V variant",
      source_date: "2026-09-20",
    },
    {
      provider: "Synthetic SharePoint reference",
      entity_key: "SYN-VC20-230V",
      revision: "B",
      title: "SYN 230 V control specification",
      type: "PDF",
      applicability: "NotApplicable",
      basis: "Different voltage variant",
      source_date: "2026-09-19",
    },
  ],
  lifecycle: "Supported",
  lifecycle_evidence:
    "SYN source reports current support; end date not supplied.",
  support_until: null,
  data_mode: "Synthetic",
  ...patch,
});
export const productInput = (patch: Record<string, unknown> = {}) => ({
  ...crmBase(),
  id: randomUUID(),
  company_id: CRM.company,
  reference: `SYN-CATALOGUE-${randomUUID()}`,
  kind: "Family",
  parent_id: null,
  provider: "Synthetic catalogue",
  entity_key: `SYN-${randomUUID()}`,
  content: productContentFixture(),
  ...patch,
});
export const relationshipFixture = (
  patch: Partial<RelationshipContent> = {},
): RelationshipContent => ({
  type: "CandidateReplacement",
  purpose: "Inspect supplier-nominated replacement",
  evidence:
    "SYN supplier note names a successor without interface verification",
  source_revision: "B",
  source_date: "2026-09-20",
  conditions: "Separate design/application review before use",
  limitations: "No drop-in compatibility or installation authority",
  criteria: [
    {
      criterion: "Controller interface",
      outcome: "Unknown",
      evidence: "Protocol not provided",
      owner: "SYN Engineering reviewer",
    },
  ],
  affected_use:
    "SYN retired controller retained in original installed configuration; asset identity remains separate.",
  handover: "Both",
  ...patch,
});
// Disposable-test actors only; separate from seed 52's named local demonstration duties.
export async function productActor(
  capabilities: readonly Capability[] = productCapabilities,
  company = CRM.company,
) {
  if (localConfig().database_name !== "ppo_synthetic_test")
    throw Error("Products test grants require ppo_synthetic_test");
  const principal: Principal = {
      actor_id: randomUUID(),
      workspace_id: CRM.workspace,
      display_name: "SYN Products isolated proof actor",
    },
    token = randomBytes(32).toString("hex");
  await database().query(
    "INSERT INTO ppo.users(id,workspace_id,issuer,subject_id,display_name) VALUES($1,$2,'PPO-LocalSynthetic',$3,$4)",
    [
      principal.actor_id,
      principal.workspace_id,
      `products-test-${randomUUID()}`,
      principal.display_name,
    ],
  );
  for (const cap of new Set<Capability>(["shared.read", ...capabilities]))
    await database().query(
      "INSERT INTO ppo.permission_grants(workspace_id,user_id,company_id,capability,scope_type,scope_id) VALUES($1,$2,$3,$4,'Company',$3)",
      [principal.workspace_id, principal.actor_id, company, cap],
    );
  await database().query(
    "INSERT INTO ppo.sessions(token_hash,workspace_id,actor_id,expires_at) VALUES($1,$2,$3,clock_timestamp()+interval '4 hours')",
    [tokenHash(token), principal.workspace_id, principal.actor_id],
  );
  return { p: principal, cookie: `ppo_local_session=${token}`, token };
}
export async function productFixture(
  extraCapabilities: readonly Capability[] = [],
) {
  const author = await productActor([
      ...productCapabilities,
      ...extraCapabilities,
    ]),
    reviewer = await productActor(),
    technical = await productActor(["products.read"]),
    other = await productActor(productCapabilities, CRM.companyB);
  const family = productInput({
    content: productContentFixture({
      title: "SYN Verdant controllers",
      model: "Verdant",
      variant: "Family scope",
    }),
  });
  await createProduct(author.p, family);
  const model = productInput({ kind: "Model", parent_id: family.id });
  await createProduct(author.p, model);
  const variant = productInput({ kind: "Variant", parent_id: model.id });
  await createProduct(author.p, variant);
  const similar = productInput({
    kind: "Variant",
    parent_id: model.id,
    content: productContentFixture({
      variant: "230 V / two relay",
      technical_revision: "TECH-C",
      attributes: [
        {
          key: "voltage",
          value: "230",
          unit: "V",
          status: "SourceReported",
          evidence: "SYN different voltage",
          clarification_owner: null,
        },
      ],
    }),
  });
  await createProduct(author.p, similar);
  return {
    author,
    reviewer,
    technical,
    other,
    family,
    model,
    variant,
    similar,
  };
}
export async function publishProduct(
  author: Principal,
  reviewer: Principal,
  id: string,
) {
  let detail = await readProduct(author, id);
  await decideProduct(author, id, {
    ...crmBase(),
    expected_version: detail.product.version,
    revision_id: detail.revision.id,
    action: "Submit",
  });
  detail = await readProduct(author, id);
  await decideProduct(reviewer, id, {
    ...crmBase(),
    expected_version: detail.product.version,
    revision_id: detail.revision.id,
    action: "Reviewed",
  });
  detail = await readProduct(author, id);
  await decideProduct(author, id, {
    ...crmBase(),
    expected_version: detail.product.version,
    revision_id: detail.revision.id,
    action: "Published",
    purpose: "Synthetic technical catalogue",
    audience: "Internal permitted readers",
    effective_on: "2026-09-25",
  });
  return readProduct(author, id);
}
