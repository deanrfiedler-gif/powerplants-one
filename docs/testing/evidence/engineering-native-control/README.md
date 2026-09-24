# Native Engineering implementation evidence

Owner: Dean Fiedler. Captured and inspected by Codex on 24 September 2026. Synthetic fixtures only. Implementation inspection is separate from owner visual review, business acceptance and deployment; no review fingerprint is adopted.

Application source: `04444fb5ae293c55cbb2f164c03bff65c0888687`, incorporating main `9e49a57332aacfbb45a43fdd4d17c1d031fc80fb` and foundation `49249e2a06e189aa3693f3f2502bd291b8e459af`. The accompanying browser-test change adds captures after the persisted answer/acknowledgement is visible. Production code is unchanged by capture work. [Programme handover](../../../delivery/engineering-native-control-handover.md) contains the scope, regression results, PRs and open authority questions.

## Capture manifest

Desktop uses Chromium at 1440 × 960; phone uses Chromium emulation at 390 × 844. The responsive matrix also uses 1024 × 768, 320 × 844 and 720 × 480 CSS pixels. The last is the reflow-equivalent viewport for 200% scaling of 1440 × 960, not proof of every browser's native zoom or a physical device test.

| Exact route and state | Captures |
|---|---|
| `/engineering/[id]/basis/review`; saved draft with retained requirement and sources, Review & handover | [Desktop](engineering-basis-review-desktop-chromium.png), [phone](engineering-basis-review-mobile-chromium.png) |
| `/engineering/[id]/drawings`; selected current document, exact revision B and long native reference | [1440 × 960](engineering-drawings-1440x960.png), [1024 × 768](engineering-drawings-1024x768.png), [390 × 844](engineering-drawings-390x844.png), [320 × 844](engineering-drawings-320x844.png), [720 × 480](engineering-drawings-720x480.png) |
| Same drawing; scrolled exact native version, published output and hash | [390 × 844](engineering-drawings-evidence-390x844.png), [320 × 844](engineering-drawings-evidence-320x844.png) |
| `/engineering/[id]/queries`; saved formal answer before independent disposition | [Desktop](engineering-query-answer-desktop-chromium.png), [phone](engineering-query-answer-mobile-chromium.png) |
| `/engineering/[id]/reviews/issues`; exact issue and separate sent, delivered and named recipient acknowledgement | [Desktop](engineering-issue-acknowledged-desktop-chromium.png), [phone](engineering-issue-acknowledged-mobile-chromium.png) |

The automated fixtures generate different synthetic IDs per run. No capture is a production account observation, live SharePoint/CAD output, approved technical decision or customer communication.

## Inspection and functional evidence

- Desktop retains a register and docked inspector. At widths up to 1100px, context, filters and selected record use one workspace scroll surface, with explicit close/return and repeated package/customer/site context. The phone evidence captures show that complete source and distribution evidence remains reachable.
- Primary buttons retain readable white text; long titles, native references and hashes wrap. The viewport checks reject horizontal page overflow. Dialog Escape and close return focus; keyboard navigation retains a visible outline.
- The final local run passed 12/12 executed cases with two intentional skips: a desktop-only department-rail measurement and a duplicate phone matrix (the desktop case explicitly sets all five sizes). It covers native forms, original-operation recovery, loading, server validation, stale comparison, saving, exact review/issue/acknowledgement, existing EN-01 coordination and all seven canonical department rails. The local capture runner allows 30 seconds for assertions on the busy Windows host; shipped browser assertions and the application/database timeouts remain unchanged.
- The final capture suite at `04444fb` passed all seven executed native cases with one intentional duplicate-matrix skip, after the inspector-return button sizing correction. Production build and TypeScript passed. All thirteen images here are from that final run. An earlier capture attempt had one fixture-creation database cancellation; its individual rerun passed and the later complete capture run was clean.
- Native query and issue screenshots wait for the saved content to appear, rather than capturing the previous state during its read refresh. Separate evidence captures are not substitutes for saved-state assertions.

The issued [EN-02 six-view HTML](../../../reference/ui/engineering-basis/PPO-Design-Basis-and-Interface-Register-r01.html) and [Engineering r02](../../../reference/ui/engineering/PPO-Engineering-Container-r02.html) remain unchanged. EN-03 and EN-05 still have no dedicated approved image/HTML baseline. Their native compositions are proposed PPO designs using the existing shell, shared controls and documented scope. Exact captures for every subordinate view, all transient states, assistive technology and physical devices remain absent; browser behaviour checks do not imply those reviews occurred.

## Review disposition

Owner review is required for the proposed EN-03/EN-05 compositions, all new guides, narrow-screen context/filter density and discipline/purpose authority. Capture presence, source presence, automated functional proof, visual approval and deployment remain separate in the living design register.
