import { randomUUID } from "node:crypto";
import type { Principal } from "../../src/platform/identity";
import { publishTemplate } from "../../src/documents/publication/service";
import { readUsePolicy } from "../../src/documents/use/service";
import { reviewedDraft } from "./template-publication";
import { base, grantDraft } from "./template-drafts";
export async function publishedUse() {
  const f = await reviewedDraft();
  await publishTemplate(f.publisher, f.input.id, f.command);
  return f;
}
export async function useCommand(
  p: Principal,
  f: Awaited<ReturnType<typeof publishedUse>>,
) {
  const s = await readUsePolicy(p, {
    company_id: f.input.company_id,
    site_id: f.input.site_id,
  });
  return {
    ...base(),
    id: randomUUID(),
    company_id: f.input.company_id,
    site_id: f.input.site_id,
    publication_id: f.command.id,
    definition_hash: f.command.definition_hash,
    expected_policy_version: s.version,
    baseline_template_id: s.baseline_template_id,
    baseline_policy_version: s.baseline_policy_version,
    baseline_hash: s.baseline_hash,
    effective_from: null as string | null,
    effective_to: null as string | null,
    predecessor_id: null as string | null,
    approval_note:
      "SYN Service approval of exact OUT-09 use for this company/site and effective interval.",
  };
}
export async function useFixture() {
  const f = await publishedUse();
  await grantDraft(f.publisher, ["template.assign"]);
  return { ...f, use: await useCommand(f.publisher, f) };
}
