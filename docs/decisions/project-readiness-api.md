---
document_id: PPO-PJ07-READINESS-API-DEC
date: 2026-11-13
owner: Dean Fiedler
status: Backend scope authorised in chat; implementation choices by Codex; independent review and operational acceptance separate
source_commit: bdcdd347fcb29c3806cd23d1e85be03f972b6628
versioning: git
---

# PJ-07 source-backed readiness API

Dean asked what backend work should follow the existing delivery. The recommendation named a permission-scoped PJ-07 readiness API, exact source evidence/owners, explicit missing/stale/unavailable sources and connected proof that completing a follow-up cannot clear a blocker. Dean replied: “Proceed with that work.” This authorises that bounded backend scope. It does not accept the Projects Figma proposal or the missing historical r02 source as an implementation baseline.

On 13 November 2026, after the completed implementation and validation were reported and an explicit exception to the three-build publication limit was requested, Dean replied: “Yes. Proceed however you believe is the most professional.” This authorises publishing the completed PJ-07 implementation to PR #948 despite the earlier builds' outstanding CI. It is a scoped exception for this contribution; the standing concurrency rule and Dean-only merge rule remain in place. Full CI and the required independent Claude review remain separate gates.

[DECIDED by Codex] Reuse the existing Next.js/TypeScript/PostgreSQL architecture and native source readers, with one read-only repeatable-read transaction. The [contract](../contracts/project-delivery-readiness.md) is the authoritative server boundary. No new framework, service, dependency, migration, capability, seed, UI or integration is selected.

1. Start with exact Project-bound Engineering coordination, Supply material demand and specialist briefs. Their native permission and historical-source checks are available now. Direct and indirect WorkOrder prerequisites, whole-project scope applicability and work-release decisions need later contracts; inferred same-site joins would misattribute evidence.
2. Preserve each source's meaning. An Engineering coordination state is not technical release; an accepted specialist brief is not work/competence acceptance. Use Supply's existing readiness calculation rather than introducing a competing quantity or promise rule.
3. Retain native source identities/versions and hashes of the exposed basis. A separate persisted PJ-07 aggregate would duplicate authority and require invalidation/replay rules before any write workflow exists. This increment needs neither a second writer nor durable receipts for a read.
4. Publish only permitted evidence in bounded windows. Mark incomplete coverage explicitly and fail unexpected source/database errors. Returning zero or Ready for an inaccessible source would falsely clear delivery concerns.
5. Return known source blockers and risks, but never full-project Ready or release authority. The complete applicability inventory and site/crew/customer/commercial release rules are unassessed. This is a useful source inspection dependency, not an invented approval process.

The earlier [readiness design](project-delivery-readiness-design.md) and [Projects proposal](projects-module-refined-ui-proposal.md) remain design references with their existing status. No issued bytes, screenshots, parent IDs or acceptance fingerprints change. Traceability remains PJ-07, BC-06, PPO-012, PRJ-02/03/04/05, SVC-03/05, ENG-06, SCM-08, FIN-03 and NFR-01/09. Claims, Finance outputs and Warranty receiving in PRs #905/#932/#945 retain their own owners and validation.
