# Application shell — working design reference

Stable entry: `system:shell`. Owner: Dean Fiedler. Status: Draft for review.

Navigation, global search, context, page guide and the local design-workspace entry.

## Desktop

Use the actual shared application source `src/components/product-navigation.tsx`. The shell owns branding, navigation, global search, identity and viewport allocation. Development pages occupy the workspace interior. Shared changes must be checked against every affected consumer, using the complete root stylesheet order.

## Mobile

Check 390 × 844, 320 CSS px and 200% zoom. Preserve meaningful context, labelled actions and reachable close controls. A changed header must leave adequate room for search, the existing information icon and account controls. Preserve the established mobile navigation and unsaved-work protection.

## Change discipline

The live component gallery consumes runtime tokens and the shared Button component. Preview edits are temporary and scoped to the sample. Commit durable changes to source, inspect the consumer list, compare retained references and update any accepted exception deliberately. Record independent visual, functional and release evidence; do not treat a matching token as whole-page conformance.

## Recovery and review

Restore an unwanted working-source change through a reviewed successor in Git. Preserve issued references and past acceptance evidence. Verify keyboard navigation, focus, long content, loading, read-only and error states in the owning workflow. No complete visual review is recorded for this new development surface yet.

## SH search and notification integration

The header search uses the same source registry as `/search`, with a full-results handoff and current-access preview. The notification bell lists durable personal Activity events and links to `/work/updates`; opening is not a read or business action. Preserve the merged development-workspace link and local draft guide within the information control. Validate compact search, the bell, identity changes, guide opening and desktop/mobile navigation together. [SH evidence](../../../testing/evidence/sh-platform/README.md) distinguishes prior captures from post-rebase checks. No new review fingerprint is claimed.
