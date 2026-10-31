# Intake & workload accepted-design implementation evidence

Owner: Dean Fiedler. Implementation and application comparison: Codex, 31 October 2026, dedicated branch `codex/intake-workload-accepted`, PR [#703](https://github.com/deanrfiedler-gif/powerplants-one/pull/703). Integrated main: `1402c87b9069def4dcd4d82f291cd991cff40ca5`. This is synthetic implementation evidence, not owner acceptance, business acceptance or deployment.

## Accepted source and comparison

Accepted page 128:8845; desktop 128:8846; selection 128:9024; Saved estimates 172:1535; phone 128:9231. Live design context and screenshots were inspected before implementation, including the named accepted version and later compact-header amendment. The [design decision](../../../decisions/intake-workload-design.md) and [immutable source captures](../../../reference/ui/estimating/intake-workload-design-r01/README.md) preserve provenance. The later compact header supersedes the original phone toolbar.

All 14 application captures below were visually inspected. The presentation suite was repeated after the independent-review corrections: three desktop/tablet snapshots changed only in the generic Sales-brief wording and were re-inspected; the other eleven captures are byte-identical to the original run. Earlier application captures remain in Git history. They use the real application shell and ES-01 controls with deterministic synthetic API-boundary fixtures from `tests/helpers/estimating-workload-presentation.ts`. They do not prove database rules. Native database/API/browser proofs are listed separately below. Licensed icon glyphs are hidden with screenshot-only CSS; controls retain their space and accessible names. Synthetic fixture counts and values differ from the accepted artwork.

| Surface | Application captures | Comparison and bounded adaptation |
|---|---|---|
| Desktop 1440 × 900 | [Register](captures/desktop-1440-workload.png), [snapshot](captures/desktop-1440-snapshot.png), [collapsed menu](captures/desktop-1440-collapsed-snapshot.png) | 240 px secondary menu, 60 px toolbar, 40 px rows, register begins at x=480 with both menus open. Snapshot stays 960 px wide and overlaps the unchanged register when the menu collapses. Shared shell and tokens retained. |
| Desktop selection | [Selection](captures/desktop-1440-selection.png) | 360 px panel overlaps the register. Seven selected records demonstrate internal scrolling and the persistent footer; source artwork shows two. Export and action explanation remain in the scrollable panel. No allocation or acceptance command. |
| Saved estimates | [Desktop](captures/desktop-1440-saved-estimates.png), [390 px](captures/phone-390-saved-estimates.png), [320 px](captures/phone-320-saved-estimates.png) | Exact saved versions, separate URL/search and null sell. Saved-row checkboxes become record icons because no saved-estimate bulk command is adopted. Phone uses the current compact shell. |
| Tablet 1024 × 768 | [Register](captures/tablet-1024-workload.png), [snapshot](captures/tablet-1024-snapshot.png), [Saved estimates](captures/tablet-1024-saved-estimates.png) | Shared menu overlay replaces a permanent narrow secondary column; register scroll stays contained. Snapshot is 944 px wide with controls inside the viewport. |
| Phone 390 × 844 | [Rows](captures/phone-390-workload.png), [record](captures/phone-390-snapshot.png) | Compact view/filter header and approximately 80 px flush rows. Full-screen snapshot retains reference, complete title, facts and bottom handovers; related context scrolls below. |
| Phone 320 × 844 | [Rows](captures/phone-320-workload.png), [record](captures/phone-320-snapshot.png) | Long row content wraps without page overflow. Snapshot actions hold previous/next; bottom handovers wrap. This completes missing narrow-phone composition using the established controls. |

Automated geometry checks assert the menu, toolbar, row and snapshot measurements, unchanged register width, opaque modal background and absence of page overflow. They also exercise phone view/filter controls, Enter/Escape, focus return and tablet keyboard scrolling. Visual comparison remains separate from Dean's review and physical-device/assistive-technology acceptance.

## Functional proof

The isolated synthetic PostgreSQL 16 cluster contains current migrations and seeds, database `ppo_synthetic_test`, and runs only on loopback. No migration, seed, grant or capability changes are part of this PR. Browser/HTTP tests use the native app at port 3143; presentation and negative-state fixtures are explicitly separated.

| Check | Result and scope |
|---|---|
| Workload unit suite | 7 passed: literal/strict query rules, URL restoration, exact version links, newest-first sequence, changed-fact selection fingerprint, allowlisted formula-safe CSV and Brisbane-year labels across three browser time zones. |
| Native workload database suite | The original six-case implementation proof passed across the initial four-case success and corrected two-case rerun; the new seventh case is verified in the follow-up below. Covers read-only behaviour, exact Discovery/saved basis, permission revocation, all owner/readiness combinations, independent SQL-before-limit owner windows and Sales receiving context. |
| Native boundary fixtures | 101 newer unstarted opportunities do not hide two older actor-owned Discovery workspaces from My work. Sales owner is deliberately different. Search and both supported sorts retain their own bounded counts; readiness counts are before view filtering. |
| Sales handover fixture | Submitted and accepted brief revisions/receiver context remain explicit; reading never accepts or links. Changing the accepted source through native `editDealScope` disables Start. Existing creation/link commands retain authority. |
| Native HTTP workload | 1 passed: current authority, no-store, strict filter validation, read-only route and denied/cross-company access. |
| Presentation browser suite | 4 passed at 1440, 1024, 390 and 320 px using installed Chrome and deterministic fixtures. Captures above come from this run. |
| Native and negative-state browser suites | All 12 cases passed across the final ten-case success and targeted four-case rerun (two repeated successes). Desktop and phone cover native Discovery entry, snapshot tabs/Escape/focus after reload, view/filter controls, My work, URL Back/Forward, sequence, fresh CSV/stale selection rejection, exact Saved versions/null sell, initial loading, no matches, no permitted rows, no-edit presentation, failed/denied reads and recovery. A controlled clock proves polling does not supersede an in-flight read. Four targeted stale/failure cases passed again after adding visible phone refresh feedback. |
| Application types | Full TypeScript check passed (`tsc --noEmit --pretty false`, 2 GiB heap cap). |
| Shared shell units | 4 passed: sorted one-line declarations, exact/pattern/module routing and frozen shared-style selector contracts. |
| Documentation controls | Status source check passed (184 fragments); naming passed (804 document records); migration numbering/registry check passed. |
| Register and lint | `npm run studio:check` passed (372 entries, 52 component entries, 216 source routes, no errors). ESLint passed for all changed TypeScript/TSX sources and tests. |
| Foundation | Passed: 22 issued sources, all 78 parent requirements, 14,059 local links, 7,398 marker-scanned files and 182 status fragments; no errors. Contribution scope is checked against `origin/main` after committing and recorded on PR #703. |

The first native boundary attempt used direct SQL for protected CRM changes; database triggers correctly rejected those fixtures. They now use native owner selection and `editDealScope`. On this memory-constrained Windows host, database reset cases exceeded the standard 120-second test limit; the local proof used a 600-second CLI timeout. Repository/CI timeouts remain unchanged. The first phone null-sell assertion selected a hidden desktop cell and was corrected to assert the visible representation. The reload-focus regression discovered during browser verification is covered explicitly. One native reload received a 503 with the existing DatabaseConnectTimeout boundary on this constrained host; its targeted desktop and phone rerun passed. The phone loading test was corrected to observe the shared menu count rather than a desktop-only account control.

## Independent review corrections — 31 October 2026

[Claude’s review of `0b1bde10`](https://github.com/deanrfiedler-gif/powerplants-one/pull/703#pullrequestreview-5720597983) identified two defects. Both are corrected:

- Absent and unreadable Sales briefs now have the same null projection, generic wording and opportunity-based Start navigation. Disabling Start only for an unreadable brief would still reveal its existence. The native creation review continues to reject unreadable sources; readable accepted-source drift still blocks Start. The [recorded decision](https://github.com/deanrfiedler-gif/powerplants-one/pull/703#issuecomment-6538451426) and route contract describe this boundary.
- Short date labels compare the Brisbane year of the record and current instant, matching the timezone used to print the date. The regression covers both sides of New Year in UTC, Los Angeles and Auckland browser zones.

Follow-up execution on the dedicated Windows worktree: 7 workload unit cases; 2 focused native database cases (identical absent/denied item and count projections, native creation refusal and unchanged receipts; exact accepted context and changed-source blocking); 1 native HTTP case; 4 responsive presentation cases; full TypeScript; changed-source ESLint; and studio:check all passed. The isolated database regression prepared in the [earlier handover](https://github.com/deanrfiedler-gif/powerplants-one/pull/703#issuecomment-6538500387) is now executed, rather than source/type inspection only. Both native desktop/phone handover reruns passed, including the generic Sales-context wording, Discovery entry, keyboard focus and URL restoration.

No native creation/link command, permission, migration or allocation policy changed. The first review’s findings have been addressed, but review of the new published head remains separate.

## Remaining review boundaries

- Exact-head independent review and GitHub CI must complete before any merge decision. Checks were queued at publication preparation; local results do not imply CI passed.
- Owner visual review, physical phone/tablet, zoom and screen-reader acceptance remain outstanding. The page/register review remains Needs review; no accepted fingerprint is copied from this implementation.
- Full programme business acceptance, the full repository unit/database/browser suites, the production build and compiled-browser proof were not run locally. The bounded ES-01 change is covered by the targeted native/UI checks and full TypeScript check above; full-repository and compiled-build assurance is left to the normal CI jobs and remains a merge review item. Deployment was not attempted.
- No new allocation, acceptance/return, priority or response-deadline policy is inferred. MYOB, production integration and hosted-demo data were not used.

Capture and relevant source hashes are recorded in [manifest.json](manifest.json). They establish the reviewed bytes; they are not an owner-acceptance fingerprint.
