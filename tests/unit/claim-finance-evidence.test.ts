import assert from "node:assert/strict";
import { test } from "node:test";
import {
  claimEvidenceHtml,
  type ClaimEvidence,
} from "../../src/finance/claim-evidence-render";
import {
  claimEvidenceDefinition,
  supportedClaimDefinition,
} from "../../src/finance/claim-evidence-template";
import { supportedTemplateDefinition } from "../../src/documents/p11-template";

test("Claim HTML escapes source prose and renders money distinctly from service quantities", async () => {
  const source: ClaimEvidence = {
    source_kind: "ProjectClaim",
    reference: "SYN-FIN-1",
    source_reference: "SYN-PRJ-1",
    revision: 1,
    company_id: "company",
    customer_id: "customer",
    account: "SYN-account",
    currency: "AUD",
    tax_basis: "ExcludingTax",
    mode: "SyntheticApi",
    source_hash: "a".repeat(64),
    review_id: "review",
    reconciliation_id: "reconciliation",
    treatment_basis: '<script>attack()</script> & "quoted"',
    reconciliation_basis: "Exact comparison",
    total: "900719925474.10",
    lines: [
      {
        id: "line",
        kind: "Milestone",
        entitlement_id: "milestone",
        amount: "900719925474.10",
        due_date: null,
        evidence: { note: "<unsafe>" },
      },
    ],
    source_manifest: {},
    definition: {},
    review: {},
    reconciliation: {},
    target_evidence: {},
    corrections: [],
  };
  const html = await claimEvidenceHtml(source, {
    issue_id: "issue",
    prepared_at: "2026-11-13T00:00:00Z",
    template_hash: "b".repeat(64),
  });
  assert.match(html, /900719925474\.10/);
  assert.match(html, /&lt;script&gt;attack\(\)&lt;\/script&gt;/);
  assert.doesNotMatch(html, /<script>|Captured|Billable quantity|undefined/);
  assert.match(html, /MYOB retains accounting document authority/);
});
test("Claim definitions preserve legacy definitions and bind the selected base policy and current renderer bytes", async () => {
  const old = await supportedTemplateDefinition("OUT-14", 2);
  const base = {
    id: "00000000-0000-4000-a000-000000000001",
    version: 2,
    policy_version: 1,
    content_hash: "a".repeat(64),
  };
  const current = await claimEvidenceDefinition(base);
  assert.equal(await supportedClaimDefinition(current), current);
  assert.notEqual(
    await claimEvidenceDefinition({ ...base, policy_version: 2 }),
    current,
  );
  const changed = JSON.parse(current);
  changed.sources[0].sha256 = "b".repeat(64);
  assert.notEqual(
    await supportedClaimDefinition(JSON.stringify(changed)),
    JSON.stringify(changed),
  );
  assert.equal(await supportedTemplateDefinition("OUT-14", 2), old);
  assert.equal(
    await supportedClaimDefinition('{"family":"OUT-09","version":3}'),
    null,
  );
});
