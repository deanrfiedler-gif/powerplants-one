# Customer and contact directory

<!-- versioning: git; committed history is authoritative -->

Owner: Dean Fiedler. Catalogue key: `crm-directory`. Review: pending.

This host entry binds the real CrmDirectory in /customers, /people and the selected /contacts view. CS-01/CS-02 use the Register/worklist page type. The existing Customer 360 reference is retained; no new accepted mockup or isolated renderer is claimed.

## Behaviour and states

Keep existing scoped reads, saved filters, sorting, totals and page content. All six directory Link sites use explicit navigation: desktop names, person affiliations, numeric Site/Facility links, New, local directory tabs and phone record cards. Automatic viewport, hover and touch prefetch is disabled for these links. Hrefs, department context and shared leave-intent handling are unchanged. Shared-shell and Contacts view-tab behaviour remain separately owned.

## Figma components

**Status:** None · **Location:** Components, in the private "PPO - Design" Figma file

No main component on the Components page yet. Page frames may draw this pattern; add a component when an accepted design needs one. The Customer 360 register is drawn only on the proposal page 554:2. The mapping is kept in `../components.json` (`figma`); node IDs are stable, and the file link stays out of this repository (ADR-0053). It records where the design component is, not visual alignment or review.

## Desktop

Support ordinary pointer and sequential Tab/Enter activation. Keep existing columns and scoped table content; numeric links open the same organisation as its name.

## Mobile

Phone cards support taps, readable names and the existing 320/390 px layout. Loading, empty, denied and saved-view states keep their existing UI and recovery. Open only the exact selected record; a background read must never be mistaken for a completed navigation.

## Fixtures and acceptance

`tests/browser/directory-navigation.spec.ts` observes explicit prefetch flags and exercises each Link site through real receiving pages. Existing saved/scoped directory queries, department Contacts continuation and unsaved-navigation cases provide integration checks. The one-browser request probe is separate from ten-user timing evidence.

Prefetch can make later navigation faster, so suppressing it is a bounded experiment with an explicit next-navigation tradeoff. Retain actual request counts and timing limits; do not call reduced background requests a proven whole-page speedup. Owner, physical-device, assistive-technology and visual acceptance remain pending.

## Customers startup boundary

The receiving duplicate-identity panel is `DuplicateCandidates` in its own shared module. Its existing CustomerWorkspace and legacy ContextDetail consumers retain the same permitted query, self-exclusion, loading/retry and exact identity links. The catalogue binds `/customers/[id]` as the receiving host; P03 asserts the other seeded same-name organisation and absence of the current-record link on desktop/phone. This extraction responds to the first direct-entry trial's mixed record-opening tradeoff; the [retained trial](../../../testing/evidence/pt27-loading/direct-directory/README.md) remains separate from the new controlled refinement.

The PT-27 candidate mounts this existing component directly from `src/app/(business)/customers/page.tsx`, retaining `src/app/styles/customers.css`. People still enters through ContextList; Contacts keeps its existing host. This changes the Customers initial client-module boundary, not the CS-01/CS-02 page type, visible controls or guide tasks. Incoming session/current-company authority and outgoing exact record navigation remain unchanged.

The cold-start host state uses `scripts/quality-customer-comparison.ts`: fresh contexts, exact scoped data, the original ten-browser workload and actual desktop/phone record activation. Compare control/candidate/candidate/control on one runner and fixture, inspect compiled manifests and captures, and retain all timing misses. The [startup isolation](../../../testing/evidence/pt27-loading/startup-isolation/README.md) is diagnostic evidence, not visual or performance acceptance. Existing HTML references remain authoritative; a new accepted mockup image is unavailable.

PT-27 refined execution: [source-bound timing and captures](../../../testing/evidence/pt27-loading/direct-directory-refined/README.md) pass all 320 directory loads and 80 actual record openings. Initial script bytes fall 6.91%; cold targets and visual/owner/device review remain open. This evidence changes no accepted reference or review fingerprint.

## Figma register consumer proposal — 14 October 2026

The user requested the missing Customers entry screen for the Customer 360 design. [Working page contract](../pages/route-customers.md), [fixture states](../customer-register-fixtures.json) and [r03 capture manifest](../../../reference/ui/customers/customer-360-figma-r03/README.md) record a desktop table and phone cards in the shared PPO shell. The new catalogue state is reference-only evidence attached to this existing host, not a replacement renderer or a runtime change.

The two canonical fixture IDs open separate Willowbank and Rothwell workspaces. Desktop Name sorting, preset Willowbank search, Due today/Clear and conditional Back preserve the demonstrated list state. Customer name/reference, owner, primary contact, site count and next follow-up stay visible. A lifecycle status is not fabricated. No Finance record counts or balances appear. Page-local row/card compositions reuse the accepted controls and tokens without adding a shared component family.

Read-back confirms exact destinations and return actions; visual inspection covers 1440 × 900 and 390 × 844. The proposal has no arbitrary text search, combined filters, larger-page population or browser/keyboard/device proof. Pair it with the native directory and actual receiving Back behaviour before adoption. Owner acceptance and named Figma version remain pending; earlier runtime evidence and review records retain their meaning.

The table-alignment follow-up uses existing Figma Grid / Header cell components, white 40 px headers, 14/20 Roboto, square edges, 12 px insets and semantic row/column rules. Customer rows retain secondary fields at 64 px; simple detail rows use 40 px and richer source rows grow. The [r04 manifest](../../../reference/ui/customers/customer-360-figma-r04/README.md) and fixture table inventory bind all sixteen Customer-module table instances as reference-only styling evidence. No shared component main, runtime grid or bulk-selection workflow changes.
