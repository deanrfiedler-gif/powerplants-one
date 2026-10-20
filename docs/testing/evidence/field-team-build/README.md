# Field team implementation verification

Scope: PL-02, `/service/technicians` and `/service/technicians/[id]`.
Owner visual review: pending. This is an implementation work record, not acceptance or deployment evidence.

## Build plan

Refine the existing register and person record against the [accepted Field team design](../../../decisions/field-team-figma-design.md), Figma file "PPO - Design", page `1289:54`, named version "Field team — accepted". Preserve the existing Visits and Needs preparation behaviour and its controlled handovers. Conversations is outside this build.

- Files: the FieldTechniciansScreen and ResourceWorkspaceScreen, page-local styles and view helpers, scoped test fixtures/specs, the three PL-02 page contracts, narrow register/guide/component consumer entries, generated build sequence and a status fragment.
- Reuse: the application shell and compact phone header, SecondaryMenuFrame/useSecondaryMenu, RegisterTable, Button/ButtonLink, ProductIcon through the existing Font Awesome mapping, Field/SelectField, ReadState/Stamp, planner laneDay and competenceState.
- Data: existing permission-scoped synthetic scheduling reads. Use the accepted resource-type fallback for Q3; reuse the planner's standard-hours calculation for Q4. Verify competence completeness before rendering summaries. No source editing or new authority.
- Tests: meaningful unit checks for summaries and URL handovers; browser checks for register, snapshot, record, evidence panel, read states, access boundaries and 320/390/1024/1440 layouts; repository assurance, lint, typecheck, unit suite and build.
- Risks: old r05 browser assertions will need updating for the accepted default/view layout; read completeness must prevent stale evidence; source role labels are not published; phone sheets, picker/menu interiors and tablet person layout have no accepted drawings. Record any necessary adaptation explicitly.

## Results

The initial focused unit run passed all four tests. The focused Playwright presentation run passed all six desktop/phone scenarios, covering 1440, 1024, 390 and 320 CSS px. It uses the real routes and shell with explicitly synthetic browser read fixtures; it is not server permission or database integration proof. Assertions cover person-filtered View visits, no horizontal page overflow, seven day tracks, reviewer ID, evidence-panel focus return, loading/error/partial/denied invalidation, clearing no-match filters and anonymous busy intervals.

`npm run studio:check` passed (366 entries, 48 components, 210 source routes; 338 unreviewed and 28 stale remain visible). `python scripts/check_naming.py` passed. `python3` is the Windows Store alias on this host, so repository Python commands use `python` with Python 3.14. Full lint/typecheck, reduced-concurrency unit replay, foundation and final build checks are being completed before handover; do not read this intermediate commit as their pass.

The local synthetic identity endpoint returned DependencyUnavailable/ConnectionFailure before browser setup. `npm run db:health` on unmodified main also returned ECONNREFUSED for the configured loopback database. No database suite or real backend workflow is claimed. No database was created, migrated, seeded or changed. Existing server scope/permission logic is untouched.

The first development start failed because Turbopack refused the worktree's node_modules junction outside its filesystem root. Copying the existing dependency tree into this worktree resolved startup; no package or lockfile changed. The first unrestricted unit run was stopped during host resource contention; a replay with two workers records its own result separately.

## Visual comparison and explicit adaptations

Live Figma screenshots and design context were inspected for the accepted desktop, tablet, phone, all five states, evidence panel and notes. Local browser screenshots are transient ignored test results, with the Font Awesome Kit blocked; no Pro artwork, Figma key or file URL is retained. The reference captures in docs/reference remain unchanged.

Compared the actual register, snapshot, person record and evidence panel with the named source at matching widths. Corrected the fallback refresh icon, left alignment of names, snapshot spacing/footer and navigation, 320 px chooser wrapping, person identification and the error-notice colour collision. Also inspected loading, no matches, failed, incomplete and view-only states. Final owner/device review remains pending; this comparison grants no fingerprint.

Known adaptations:

- Q3 resource type instead of unpublished job role; Q5 reviewer ID instead of an unprovided name.
- Live/synthetic read values determine the names, versions, sites, skill counts and booked totals. They need not equal the composed Casey example.
- The later phone-header amendment P3 governs the current shared header: position and navigation there, person name/role/status in page content. The current shared shell is reused, including its existing icons; this change adds no Conversations action.
- Existing native date inputs have browser-specific formatting and picker appearance. The drawn custom text-picker interior is unspecified. The primary rail remains user-controlled; the tablet reference is compared in its collapsed state.
- Undrawn filters, row menus, phone evidence sheet and tablet record use existing controls/responsive reflow. The r05 Visits/Needs preparation content remains under the new navigation; the new-shell compositions for those views are not supplied.
- Column settings is disabled because behaviour and persistence are unspecified. No saved view, bulk action or source editor is invented.
- Page-local 40 px grid, purple avatar and availability colours are scoped accepted-design variants. Anonymous busy intervals stay unlabelled; no offline support is added.

Open owner questions: define column-settings behaviour if required, and review the undrawn menu/filter/tablet/phone-panel compositions. Publication of job roles and reviewer names belongs to the resource/people source. None of these gaps is silently labelled accepted.
