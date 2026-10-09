# Contextual guidance — working design reference

Stable entry: `system:guidance`. Owner: Dean Fiedler. Status: Draft for review.

Page-to-guide mapping, reader behaviour, release applicability and content review.

## Desktop

Use the actual shared application source `src/components/shell-page-guide.tsx`. The shell owns branding, navigation, global search, identity and viewport allocation. Development pages occupy the workspace interior. Shared changes must be checked against every affected consumer, using the complete root stylesheet order.

## Mobile

Check 390 × 844, 320 CSS px and 200% zoom. Preserve meaningful context, labelled actions and reachable close controls. A changed header must leave adequate room for search, the existing information icon and account controls. Preserve the established mobile navigation and unsaved-work protection.

## Change discipline

The live component gallery consumes runtime tokens and the shared Button component. Preview edits are temporary and scoped to the sample. Commit durable changes to source, inspect the consumer list, compare retained references and update any accepted exception deliberately. Record independent visual, functional and release evidence; do not treat a matching token as whole-page conformance.

## Recovery and review

Restore an unwanted working-source change through a reviewed successor in Git. Preserve issued references and past acceptance evidence. Verify keyboard navigation, focus, long content, loading, read-only and error states in the owning workflow. No complete visual review is recorded for this new development surface yet.

## Owner visual review — 9 October 2026

- **Reviewer:** Dean Fiedler. He accepted Claude's proposed verdicts from the phase 00 review boards (navigation canvas version 29).
- **Result:** Refine.
- **Evidence:** [phase 00 review, session 1](../../../testing/evidence/ui-review-phase-00-r01/README.md). Synthetic data; compiled build at `a52cb01`; 1440 × 900 and 390 × 844 headless Chromium, captures for this entry.
- **Findings:** S9: write the Home and My Work guides now. The panel itself works on desktop and phone.
- **Scope of this record:** visual review of the captured state only. Device, screen-reader, zoom and operational acceptance remain separate. A later source change marks this review stale.

## Refinement batch 2 — 9 October 2026

- **My Work guide (S9):** the information icon on My Work opens the drafted guide (`src/activities/work-guide.ts`, registered in `src/components/shell-page-guide.tsx`). It covers:
  - what you see;
  - common tasks;
  - views and filters;
  - the phone;
  - what to do when something looks wrong.
- **Development-only detail:** the "Development draft guide" disclosure was already shown only in the development workspace. The panel footer's revision label ("Powerplants One · r17") is now shown only there too. Users see "Powerplants One" and "User guide and journeys".
- **Status:** the guide is a draft until Dean reviews it in the running app. Other phase 00 pages get their guides the same way in later batches.
