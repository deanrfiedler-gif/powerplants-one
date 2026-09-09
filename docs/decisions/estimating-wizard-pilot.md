---
document_id: PPO-010-WIZARD-DECISION
revision: r01
date: 2026-09-09
status: User-authorised design direction; synthetic pilot prepared for review
owner: Dean Fiedler
---

# Guided estimating pilot decision and handover

Dean authorised the recommendation to design and prove one repeatable supply-and-installation package, from requirements through estimator adjustment to a quotation draft. The [design](../blueprints/estimating-wizard-design.md) implements that bounded direction with a fictional sensor package. The [preview](../blueprints/estimating-wizard-mockup.html) is a standalone design document, not a hosted PPO route or persistent application feature.

Source baseline: main `f8035b5c55251da4da52430adf2f83094feccd6b`, tree `524de59ff42ef1fb8e364ab16b1c88c5b0b72f24`, inspected 9 September 2026. Repository access and clean local checkout verified. AGENTS, README, STATUS, CONTRIBUTING, naming, ADR-0003/0017, BP-04, E1 contract, E2 starter, estimating implementation plan and shared UI guidance inspected. Issue #10 remains the parent. Open CRM/demo/Assistant/Email work was inspected by title/head and preserved; no runtime behaviour from those branches is assumed.

The connected repository reports public visibility, superseding the older private wording in repository documents. This contribution contains synthetic design/source only and references the existing repository brand assets. No supplied logo/PDF bytes, real operational details or customer quotation are published. Visibility is not changed.

The first template uses explicit fictional parts and labour rules. The estimator can adjust labour and must resolve that adjustment on rerun. Unknowns remain incomplete. AI is deferred; no verified supplier, CREMS, MYOB or engineering behaviour is inferred. No architecture replacement or live source connection is introduced.

The quotation projection follows BP-04/E1 and remains Draft. Reconcile the separately requested Quotation Builder/Rumbalara mapping when its maintained contract is available. E1 runtime remains manual; E2/E3/E5 runtime work is not begun. This design adds no migration, grant, approval policy, deployment or customer communication.

## Verification

Local foundation/prototype/naming assurance and `git diff --check` passed on 9 September 2026. The fictional model check passed baseline, override, rerun keep/adopt/removal, unchanged originals, input bounds/unknowns and quotation projection. The cloud preview browser returned `net::ERR_BLOCKED_BY_CLIENT` for the local preview, so local rendered layout and browser interaction are not claimed. The existing estimating design workflow now includes the focused wizard model and browser check, producing five screens at each of 1440px, 390px and 320px; CI execution and screenshot inspection remain pending. The executable design checks are `node docs/testing/estimating-wizard-check.mjs`; existing foundation/prototype/naming checks remain applicable. Full database/browser regression is not a design acceptance claim and is not manually requested for this documentation contribution.

## Continuation

Review the four-screen journey and keep/adopt/cancel behaviour. Obtain one real package's rule and source evidence, then prepare its bounded application integration against current E1 and the questionnaire/source contracts. Main is unchanged until a normal reviewed merge; this contribution ends at a reviewable design PR. No independent human review or business acceptance is claimed.

Initial design run [34347239009](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/34347239009) at `a46c5cac` passed existing estimating design/model checks and the new baseline/labour interactions. Its wizard browser check stopped at the manual-adjustment selector: the wrapping select label included option text and did not match its intended exact accessible name. The correction adds explicit accessible names to the three select controls; assertions and timeouts are unchanged. The initial failure remains recorded, and corrected-head verification is pending.
