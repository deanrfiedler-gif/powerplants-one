# Current PR integration evidence

<!-- versioning: git; committed history is authoritative -->

Owner: Dean Fiedler. Verification and business acceptance remain separate.

## 16 October 2026 integration

Dean requested merging every current PR and correcting conflicts and failures. The integration starts from main `cb838c7` and preserves the original PR commits as merge parents. It includes #524, #525, #526, #527, #528, #529, #533 and #535. Independent status/index/register additions are retained together; the UI build sequence is regenerated from the combined register. Proposal records remain Proposed, and retained captures are unchanged.

PJ-06 #530 remains owned by the separate backend verification chat until its reconciled source is handed back. TypeScript #534 cannot install with either typescript-eslint 8.69.0 or the current 8.71.2: both require TypeScript below 6.1. The direct compiler replacement is excluded pending disposition; peer checks have not been disabled.

## URL control correction

PR #533's CRM and compiled-browser CI repeatedly lose characters during sequential search input. Its compiled desktop lane also refuses the Unknown effort checkbox. Both hosts derive controlled values solely from the framework's search-parameter render after native history writes; that render can lag the already updated browser URL.

The correction uses React's existing external-store hook to read the current browser search string synchronously after owned history writes and on Back/Forward. Framework subscription and the server search snapshot remain for navigation and hydration. Scheduling changes compose against the current URL, so rapid edits preserve earlier criteria. Search still replaces history, view changes still push it, signed cursors stay transient and access/session clearing remains intact. No server write or authority changes.

The component fixture can defer its framework URL render by 80 ms. The new browser regression types every key without artificial typing delays, checks the exact input and URL, focus, result count, unchanged history length and reload recovery at 1440, 390 and 320 px. Existing CRM navigation and capacity browser proofs remain unchanged and must pass in combined CI. This fixture is a component proof, not an end-to-end or device acceptance claim.

## Local verification and limits

- Foundation: passed, 78 parent requirements, 10,591 links, no unresolved markers.
- Naming and PP-01 consistency: passed; project instructions remain 7,995 characters.
- Development register: passed, 362 entries and 47 components; 334 unreviewed and 28 stale page reviews remain visible.
- Initial corrected deferred-render regression: three of three passed on Node 24.21.0, Chrome 155.0.8059.80 and the pre-existing local dependencies (React 19.2.8 / Playwright 1.63.0). This does not validate the new locked dependency versions.
- Original-source control: the identical regression failed at all three widths, receiving only `e` instead of the complete search phrase. The control bundled the committed original `crm-worklist-location.ts` in memory; application source was not rewritten. The corrected bundle was restored afterward. Final combined dependency and native-browser results belong in the integration PR.

The local disk reached less than 30 MB free. New managed checkout creation failed and cleanup of generated cache was blocked by automatic approval. The existing primary checkout therefore hosts the isolated integration branch. Full dependency installation/build and database suites require sufficient space or fresh CI. A local whole-tree typecheck was interrupted; it does not count as a pass. No local database, hosted demo, production integration or deployment is changed by this work.
