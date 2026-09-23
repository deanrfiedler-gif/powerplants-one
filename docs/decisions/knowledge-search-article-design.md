---
document_id: PPO-KNOWLEDGE-DES
date: 2026-09-16
owner: Dean Fiedler
status: Proposed DK-04 design; local model and DOM verification passed; native visual review and application integration pending
source_commit: 07eb34d5df5ea430c365da78e160cb6aa0b76f20
versioning: git
---

# Knowledge search and article detail — design and receiving handover

Dean authorised a Knowledge search and article detail module with an interactive HTML and a detailed professional Markdown report, aligned with the supplied r20 theme. This contribution addresses **DK-04**; **DK-05 authoring, technical review, publication and withdrawal** remains a distinct workflow.

- [Standalone HTML r01](../reference/ui/knowledge/PPO-Knowledge-Search-and-Article-Detail-r01.html)
- [Detailed companion report r01](../reference/ui/knowledge/PPO-Knowledge-Search-and-Article-Detail-Report-r01.md)
- [Maintained source and build instructions](../design/knowledge/README.md)
- [Actual verification and limitations](../testing/evidence/knowledge-r01/README.md)

## Design decisions

1. Show validation, review currency and context applicability independently in results, snapshots and details. A reviewed label cannot conceal incompatible equipment or changed required evidence.
2. Evaluate article and required source applicability separately across model, firmware, control software, facility and crop stage. Unknown values remain unknown. A parent/facility relationship does not establish suitability or readiness.
3. Preserve suspected fixes as hypotheses, lessons as reference material and superseded advice as history with a successor link. None becomes a validated procedure through reading, saving or feedback.
4. Retain exact article revision in deep links, copied references and article-linked review requests. An unavailable revision is not silently substituted.
5. Provide browser-local bookmarks and owned review requests, with failure recovery and synthetic export. No reviewer is notified and no article approval or business action occurs.
6. Keep the module interior aligned with r20, using existing embedded fonts/icons, navy/green tokens, compact controls, responsive layouts and the right-side snapshot. Preserve supplied and issued references unchanged.

## Traceability and receiving boundary

The inspected source is main `07eb34d5df5ea430c365da78e160cb6aa0b76f20`. BP-01 §16.3, DOC-04/06, ENG-07, SVC-06, C04 and the DK-04 coverage brief inform this design. AT-20/AT-37 and [issue #181](https://github.com/deanrfiedler-gif/powerplants-one/issues/181) remain open at their broader scope. No parent requirement is renamed or closed.

This is a standalone synthetic artifact, not a new runtime application route. The existing modular monolith and document authority remain. Real sources, version-range rules, role grants, publication policy, expiry timezone, authenticated search/excerpts, immutable source hashes, concurrent commands and offline controls need their own implementation and evidence. Portal publication, technical authoring and any work authorisation are separate.

The detailed report inventories all views, fields, interactions, status rules, fixture scenarios, persistence/recovery, theme mapping, integration obligations and a review walkthrough. It is the companion explanation requested by Dean.

## Verification and handover

Fifteen model groups and thirteen local non-rendered DOM interaction groups passed. Repository foundation, prototype and naming assurance results are recorded in the evidence record. A native Playwright review harness is included but has not been run: browser security policy blocked local HTTP and file preview navigation. No visual, real-device, accessibility, business acceptance or production-readiness claim is made.

Contribution branch: `design/knowledge-search-article-r01`. This session is scoped to the Knowledge package and additive index/status/register entries. Preserve unrelated contributions on integration. GitHub publication was attempted but blocked: `git push` could not obtain an HTTPS username/credential. CONTRIBUTING requires stopping on a blocked push, so no remote branch or PR was created through another route. The completed local commit and patch preserve the contribution. No default-branch push, merge, deployment or source-system change occurred.
