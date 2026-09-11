# Manual Leads implementation

Status: approved desktop integration implemented locally; verification in progress; no deployment acceptance.
Date: 10 September 2026.
Authority: Dean's instruction to proceed after approving the Leads UI and the proposed implementation journey.

The accepted UI reference remains `docs/blueprints/crm-leads-preview.html`, SHA-256 `e2111c3117a4f7d64cf3ca036cb0786f0df43009118a9ab2e089acb4430d6dea`. This implementation uses the existing Next/React/PostgreSQL modular application and adds no runtime dependency. It covers manual synthetic enquiries only.

## Baseline and integration

Runtime baseline is main `f8035b5c55251da4da52430adf2f83094feccd6b`, with the approved design from draft PR #82. PR #75 remains open at `8aa6c01f1b839c02b70fd4ba7b0c1176db9b65a2`, based on the separate email/CRM integration branch. Its tree contains migrations 0015 and 0017. Leads uses additive migration 0018 and does not claim those changes are merged. Before combining branches, reconcile `scripts/database.ts`, root CSS imports and CRM module navigation. Existing migrations remain byte-identical. PR #75's board layout and value totals remain its own review scope.

## Accepted behavior implemented

- `/crm/leads` is a paged, scoped list with search, lifecycle, owner, source and sort controls. `/crm/leads/:id` preserves list query context and opens retained source details.
- Phone Leads has the approved Inbox toolbar and safe Back to deals link, no bottom navigation, and a navy button with white plus. The add/edit form has fixed heading/actions and one scrolling body, growing narrative inputs and visual-viewport sizing. Existing Deals navigation is otherwise outside this UI slice.
- Manual capture permits unverified organisation/contact text and unknown requirements. Explicitly linked shared records remain separate, authorised identities. No fake masters, import, messages or downstream business transactions are created.
- Each lead version has an exact immutable event snapshot. Notes retain identity, actor and time. Archive, unarchive, reasoned disqualification and reopen retain history. Converted leads are terminal sources.
- The one conversion command keeps the lead owner, validates existing organisation/contact or an active owned identification action, records requirement and qualification note, and selects one active next action or explicitly creates one.
- The existing Enquiry/version-one and Qualified/version-two deal guards remain authoritative. Their two events occur inside the single shared conversion transaction. A narrowly checked event-uniqueness extension permits this pair only when tied to its exact immutable lead conversion. All other operation reuse remains rejected.
- Existing Activities and Lead associations survive. New Opportunity associations require current all-target visibility and eligible independent Activity owners. Site/class conflicts block the whole transaction, preserving history. Original Activity content, status, owners, due dates and versions are never rewritten by conversion.
- Unique source and destination conversion keys protect competing intents. Original operation hashes/receipts protect retries. Receipt authority is rechecked before replay, including all converted-deal Activities. Failed conversion rolls back all writes.
- Deal history displays authorised original source notes through the retained lead association. Hidden sources are omitted; restricted content is not copied into a broader feed.

## Verification contract

Focused unit, PostgreSQL and browser tests live in `tests/unit/leads-validation.test.ts`, `tests/database/leads.test.ts` and `tests/browser/leads.spec.ts`. The database suite covers competing retries, rollback, changed payloads, cross-company/Systems denial, revoked permission, immutable history, independent Activity ownership and a fresh-process read. Browser coverage includes actual API save/conversion/reload plus 1440, 390, 320 and reduced-height form layouts.

The focused `CRM Leads implementation` workflow supplements the retained application assurance workflow. No existing gate, timeout or assertion is weakened. Local dependencies run with Node 24.19.0/npm 11.9.0, while CI retains the repository's pinned Node 24.20.0/npm 11.19.0. Local PostgreSQL is unavailable; do not report local type/unit/build checks as database or browser acceptance. Actual CI evidence is recorded after execution.

This is not approval to merge, deploy, operate on customer records, migrate Pipedrive, introduce configurable pipelines or create estimates/orders. All 78 parent requirement identifiers and issued source snapshots remain unchanged.

## Local verification record — 10 September 2026

- Repository lint, type checking, all 32 unit tests and the application build passed locally. The build retains the pre-existing report-template filesystem tracing warning.
- The unchanged migration chain plus new migration 0018 and seeds executed successfully against a temporary PGlite engine. Seven command/graph cases passed, followed by the signed ordered-pagination case after its precision correction: eight supplemental SQL cases in total. This includes a fresh-process read of a converted source and its deal.
- PGlite and its socket multiplexer are temporary verification tools outside the repository. They are not new application dependencies and do not establish native PostgreSQL locking, isolation or restart acceptance.
- The pinned browser download timed out. An alternate local headless launch exited before any browser test could execute; it produced no valid screenshots or visual acceptance. A separate local HTTP attempt could not establish application readiness and is not counted as a passed journey.
- Native PostgreSQL, the pinned desktop/mobile browser journey, visual comparison with the approved reference and the retained full application assurance checks remain required before merge. The focused workflow and its source tests are prepared locally. GitHub publication is pending explicit approval after automatic review blocked the new implementation payload.

Review the implementation on the local `feature/crm-leads` branch. No remote runtime branch or runtime PR has been created, and no deployment has occurred.


## Approved desktop integration — 10 September 2026

Dean approved the refined desktop interior and instructed integration into PPO. The exact final source is [desktop preview](../blueprints/crm-leads-desktop-preview.html), SHA-256 `cddf7599ac1fc8eb1067538ea719d2a8037a63476f8ad85e31a13cf9257b784a`. Its r04 header identifies the final hover-only treatment. The separate [approved phone preview](../blueprints/crm-leads-preview.html) remains unchanged. This instruction supersedes the earlier local-only implementation hold for integration work; it does not deploy the application.

### Integration base and scope

`feature/leads-desktop-integration` builds on the existing shell PR #84 head `6e2951e49f41e2b980da6885357230ef310f8198`. The shell itself depends on #75 and #73. None is silently treated as merged main. The earlier local Leads commits `8bd6114` and `14625b0` are reconciled into this branch: retain Email receipt checks, migrations 0015/0017, the shell imports, existing navigation and all inherited domain behavior. Migration 0018 remains additive; no prior migration is rewritten. Upgrade checks include 0018 while retaining their prior-row/hash assertions.

The desktop page sits inside the existing shell. Its navy **+ Lead** button, lifecycle tabs, compact filters, table, right drawer and fixed-action forms follow the approved reference. Native React/API flows replace the HTML's in-memory demo handlers. Counts explicitly mean returned page counts; the design's cross-tab fixture totals and Reset demo control are not promoted to application data. Filter/source/sort choices use existing server-supported values. Clear filters retains the lifecycle and sort. The shell exposes Leads/Deals destinations, scoped Lead search and a capability-checked Quick add link. Phone Leads remains a list with a back control, navy floating plus, retained detail/form styling and no bottom navigation; its breakpoint aligns with the shell at 780px.

Columns resize independently using pixel widths, guarded local storage per workspace/actor, minimum widths, reset, double-click fit of current-page content, keyboard increments and drag cancellation. Light header borders remain visible. Green resize marks appear only on hover, drag or keyboard focus and stay centred on the borders. Enlarging a column scrolls the table horizontally without squeezing its neighbours. One table viewport scrolls vertically beneath sticky headings. Layout preferences contain only widths, never record content, and storage failures do not block the page.

### Verification and remaining gates

- Exact Node 24.20.0/npm 11.19.0 and locked dependencies are used locally. Lint, TypeScript, 47 unit checks and the Next build passed before browser follow-up. The existing report-template tracing warning remains.
- Local native PostgreSQL installation failed because this executor cannot perform the package install's user/group/filesystem operations. No privilege or database guard was bypassed. Native PostgreSQL 16.15 command, conversion, race and rollback acceptance remains a CI gate.
- The optional local browser harness uses temporary PGlite and Chromium 152 outside the repository. It exercises actual app HTTP routes, not mocked UI data, but cannot prove native PostgreSQL locking/restart behavior or the repository's pinned Chromium acceptance.
- An initial supplemental run rejected browser writes because the alternate browser's default arguments disabled normal web security/origin behavior. The temporary harness removes that argument. Its alternate single-process browser closes between test contexts, so supplemental procedures run in separate browser processes; the pinned repository harness is unchanged; the application Origin/CSRF guard is unchanged. Initial failed/interrupted runs are not counted as passes.
- The focused Leads workflow retains the native database suite and desktop/mobile journeys and includes scoped shell search checks plus the new column interaction case. Full inherited assurance and the dependency chain remain required before normal merge. The bounded Company A demo-tester capability list includes the four Lead grants for the next normal reconciliation, preserving existing expiry, tenant and company restrictions; no tester is reconciled or invited in this task. No Azure deployment, tenant configuration, live records or customer communications occur in this task.


### Current local review checkpoint

The combined source passes pinned-toolchain lint, TypeScript, 47 unit tests, application build and all three documentation checks (four issued sources and 78 parent requirements preserved). Supplemental actual-HTTP runs prove desktop and phone create/convert/reload and unverified capture, plus the desktop long-form scrolling/focus check. Desktop column width, alignment, persistence, reset and three viewport captures reached their assertions before the new Quick add test exposed a locator mismatch. The selector now includes the shell's existing “In this module” text, and query-triggered Quick add opens the form even when already on Leads. Long textarea inputs now retain an explicit accessible name after their content changes. Final supplemental checks and native CI remain separately reported; incomplete or interrupted runs do not establish full acceptance.

Visual inspection confirms the desktop list and retained drawer inside the actual shell. Native PostgreSQL and pinned Chromium/full inherited regression are required before merge. The approved HTML reference is review evidence, not a replacement for the app's server-backed state.


### Final supplemental browser result

All seven focused actual-HTTP procedures now pass against the combined source: four desktop (save/conversion/reload, long form/fixed actions/focus, unverified capture/reload, independent columns/persistence/reset/alignment/Quick add) and three phone equivalents. Sizes exercised include 1366×768, 1920×1080, 960×640, 1440×900, 390×844, 320×800 and 390×440. These use temporary PGlite and Chromium 152, in separate browser processes. The repository CI retains its ordinary pinned browser projects and native PostgreSQL 16.15 suite. No assertion or deadline is relaxed. The initial Quick add edit temporarily placed a query hook in the lookup component; this was caught before publication and corrected to the workspace. Final TypeScript/lint checks pass. Earlier failures and interrupted executions remain historical, not passes.

The final phone list and desktop shell/list captures were inspected; the reduced-height form's fixed footer and single body scroll are established by the passing assertions. Full native CI and dependency merge remain open.


### Final shell check and publication boundary

The final phone inspection exposed an inherited shell selector retaining a second header. The Leads-only mobile selector now wins that specificity conflict, leaving the approved Back/Inbox header. The focused phone conversion/reload and form/focus checks pass again, including an assertion that the shell header is hidden. The final phone list and reduced-height form captures were inspected. The final production build also exits successfully. Native database and pinned-browser CI acceptance remain pending.

The attempt to push `feature/leads-desktop-integration` was rejected by automatic approval review. Its stated reason was that the command would publish modified application source and documentation to an unverified public GitHub remote, while the user had authorized app integration but not disclosure to that destination. The destination is the public `deanrfiedler-gif/powerplants-one` repository. No alternative publication mechanism was attempted. All changes are retained in the local integration branch; no remote branch, pull request, merge or deployment was created. Explicit user approval to publish this source, tests and documentation to that public repository and open the integration PR is the remaining publication prerequisite.

## Combined Projects migration registration

The [Leads/Gantt reconciliation](leads-projects-integration.md) preserves Leads migration and seed receipt 18 and registers the unchanged Gantt SQL and seed at 19. Shared search, Quick add, permissions, receipts and styles include both domains. Its combined verification governs bringing the two branches together.
