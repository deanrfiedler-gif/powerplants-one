# Theme and shared controls — working design reference

Stable entry: `system:theme`. Owner: Dean Fiedler. Status: Draft for review.

Runtime tokens, typography, controls and documented visual exceptions.

## Desktop

Use the actual shared application source `src/app/globals.css`. The shell owns branding, navigation, global search, identity and viewport allocation. Development pages occupy the workspace interior. Shared changes must be checked against every affected consumer, using the complete root stylesheet order.

## Mobile

Check 390 × 844, 320 CSS px and 200% zoom. Preserve meaningful context, labelled actions and reachable close controls. A changed header must leave adequate room for search, the existing information icon and account controls. Preserve the established mobile navigation and unsaved-work protection.

## Change discipline

The live component gallery consumes runtime tokens and the shared Button component. Preview edits are temporary and scoped to the sample. Commit durable changes to source, inspect the consumer list, compare retained references and update any accepted exception deliberately. Record independent visual, functional and release evidence; do not treat a matching token as whole-page conformance.

## Recovery and review

Restore an unwanted working-source change through a reviewed successor in Git. Preserve issued references and past acceptance evidence. Verify keyboard navigation, focus, long content, loading, read-only and error states in the owning workflow. No complete visual review is recorded for this new development surface yet.

## Owner visual review — 9 October 2026

- **Reviewer:** Dean Fiedler. He accepted Claude's proposed verdicts from the phase 00 review boards (navigation canvas version 29).
- **Result:** Deferred to its own component-catalogue session.
- **Evidence:** [phase 00 review, session 1](../../../testing/evidence/ui-review-phase-00-r01/README.md). Synthetic data; compiled build at `a52cb01`; 1440 × 900 and 390 × 844 headless Chromium.
- **Findings:** The component catalogue lists 41 components with reviews pending or stale. A theme verdict needs its own catalogue session rather than one capture. S6 (one date and time formatter) belongs here.
- **Scope of this record:** no visual review is recorded; the verdict defers it.

## Figma application increment — 13 October 2026

The [implementation decision](../../../decisions/figma-ui-implementation.md) records the exact inspected Shell v2 and My Work source frames, SH-01/SH-02 scope, r20 Overview / dashboard type, shared components and source-command handovers. The [execution ledger](../../../testing/evidence/figma-ui/README.md) separates compiled functional proof, visual comparison and remaining owner/device review.

Desktop: 240 px labelled / 76 px compact rail; preserve the saved identity preference. The My Work secondary menu is 240 px, with a 20 px collapsed edge. At 1440 × 900, content starts at x=480; toolbar 60 px, summary 64 px, content gutters 24 px and side column 320 px. Narrower interiors stack side cards. Source-backed compact activity rows use a done ring for Record outcome and an actions menu for rescheduling. The page title and freshness no longer occupy a greeting block.

Phone: 390 × 844 and 320 px containment; current page heading, Emails/Leads/Tasks with labels, flush attention and agenda lists, accessible icon-only 64 px navigation and reachable Create. Unconfigured weather remains hidden. Preserve full details, unknown counts, permission checks, focus return and draft protection. Shared tokens come from the existing theme and the explicit Shell v2 palette in `src/app/styles/figma-shell.css`; overview rules are scoped in `src/app/styles/my-work-figma.css`.

Reuse the real application shell, SecondaryMenuFrame, ProductIcon/Icon, Menu and the existing Activity dialogs; no parallel renderer or new isolated fixture is claimed. The `figma-my-work-overview` host fixture and alignment item are in components.json and navigation-fixtures.json. Exact icon-free source images: `PPO-My-Work-01-Desktop-Overview-r01.png` and `PPO-My-Work-09-Phone-Overview-Actions-Activity-r01.png` in the retained My Work page-design capture set. Public standalone Shell v2 images are not supplied; the private inspected Figma frame and accepted module captures are the available reference. Runtime identity/guidance controls, unavailable counters and conditional weather are explicit adaptations. Other module interiors, My Work grids and detail/outcome overlay compositions still require their own implementation. Existing owner review fingerprints are preserved and stale; this edit grants no review.
