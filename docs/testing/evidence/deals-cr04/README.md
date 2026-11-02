# Deals CR-04 implementation evidence

This is application evidence for PR #699 and the [24 October accepted design](../../../decisions/deals-figma-design.md#acceptance--24-october-2026). The [r02 captures](../../../reference/ui/crm/deals-design-r02/README.md) are the comparison source; earlier r01/r37/r38 compositions remain historical. Private Figma links and licensed artwork are not included.

## Scope and authority

Board, List, Forecast, Archive, snapshots, filters, column settings, selection and CSV, sequential opening, Add deal, outcomes, explicit receiving handover and stage-refusal recovery are implemented at `/sales/opportunities`. Native commands, permissions and expected versions remain authoritative. The supplementary snapshot read uses exact native estimate versions, issued quotation revisions and handover versions, with independent source permissions and bounded partial/unavailable states. Exit guidance is advisory and never a transition gate.

No migration, capability, grant or dependency is added. Bulk stage changes, pipeline settings/rotting, Deal record and Pipeline insights rebuilds are excluded. Expected close filtering was excluded because PR #790 was unmerged when implementation and publication finished. It merged on 1 November 2026 after publication; its design record and r03 captures are preserved on integration, and implementation remains a separately recorded follow-up under the original conditional scope.

## Fixtures and denominators

The application comparison runs the actual page and shared shell with fixed synthetic worklist reads from `tests/helpers/deals-accepted-fixture.ts`. The fixture observation is 15 October 2026, 09:00 AEST; production due wording uses the read observation time. Eighteen open deals, stage counts 4/3/7/2/2, two unknown estimates and $1,189,150.50 known value belong to this fixture, not production constants. The accepted corrected Potting story and related Deal record fixture remain consistent. Archive has six synthetic rows; individual amounts beyond the two retained historical records are fixture allocations, not recovered business facts.

All visible totals and subtotals use the returned page unless the read declares the matching result complete. CSV includes the selected, freshly revalidated permitted rows in displayed and chosen-column order. Unknown amounts export blank; zero remains zero. Values are unweighted AUD excluding GST. Permission or source changes invalidate selection and export.

## Validation record

| Proof | Result |
|---|---|
| Focused unit | 10 passed: CR-04, CRM presentation, unknown/zero values and URL context. |
| Native database | 2 passed: exact issued quotation/estimate/handover sources and independently revoked source access. |
| Native HTTP | 3 passed: paging/filter/sort/count equivalence and grant revocation; strict follow-through queries, private no-store responses, source versions, advisory semantics, authentication and hidden/missing equivalence. |
| CR-04 browser | All 9 cases passed across the final focused runs. Four exercise native creation, stale stage moves, outcomes/handover and refused drag; five exercise the actual page with fixed synthetic reads. |
| Retained CRM presentation | 13 passed across desktop and 390/320 px component cases, including focus, resizing, saved views, triage, totals and outcome drops. |
| Native stage-count geometry | Desktop and phone cases passed, including the two-stage I1 pipeline, fixed headers, retained scrolling and keyboard owner labels. The desktop retry followed a fixture qualification POST timeout; that failed attempt is not counted as a pass. |
| Repository checks | Full lint, typecheck with an 8192 MB heap, studio:check, foundation, naming and status validation passed; final publication checks are recorded in the PR. |

Browser proof covers selection/export cancellation after permission, source or route changes; sequential opening; chosen-column CSV; URL/history; modal discard; native Add/Lost uncertain-response recovery without duplicate commands; stale keyboard moves; explicit receiving navigation; snapshot and filter-option retry; initial loading; complete/partial/empty/denied/unavailable reads; native empty lanes; phone paging and controls. Paging tokens intentionally stay in memory rather than shareable URLs. Same-query refresh retains the last read while a fresh document shows loading placeholders. Initial test assumptions about those two existing contracts were corrected, without changing production navigation/read semantics.

The broader retained native CRM run remains non-green. Its latest ten-case retry passed the phone denied/empty/unavailable/keyboard case and failed nine cases during identity, native fixture-command or record-read waits. These are not included in the focused passing count. A comparison against unmodified main `1402c87b9069def4dcd4d82f291cd991cff40ca5` failed three of four cases: desktop pagination timed out during navigation, desktop identity returned DependencyUnavailable, and phone pagination did not reach the Activity heading; phone identity passed. Main also logged DatabaseConnectTimeout and HTTP 503 for Deals and local-session reads. This confirms that dependency/read failures occur on main; it does not establish that the wider suite is green or that every failed assertion is unrelated. The comparison used an archived main tree under ignored tmp, the same synthetic database, an owned server on port 3405, unchanged source/tests and an external environment file. The shared main checkout was untouched.

Only synthetic local services are used. The application server is owned by this task on port 3404; PostgreSQL 16.15 uses the isolated `ppo_synthetic_test` database. Node 24.22.2 and pinned npm installed with `npm ci`; no engine override was needed. Python checks use `python` (3.14), because this Windows environment has no `python3` alias. Browser setup retries only login/read prerequisites and uses a bounded cold-route warmup; business commands are not blindly replayed. Chrome 156 with Playwright 1.64.1 supplies the captures.

Not run: the complete repository database/HTTP/browser suites, a production build, physical-device testing or a comprehensive accessibility audit. These runs do not establish performance, availability, owner or deployment acceptance. Raw traces and error contexts are excluded from this evidence bundle.

## Documented adaptations and differences

- Current PPO shell, identity and native product icons replace the design capture's icon placeholders. The 448 px snapshot spans the viewport; selection keeps Open in sequence in its footer. Tablet comparison uses the existing collapsed-rail control; the user's rail preference is retained. Stage width derives from the returned stage count, so the legacy two-stage pipeline remains usable without a five-stage minimum width.
- Native creation qualification, source and initial-activity fields remain available. The 680 px outcome dialog retains native select controls for outcome/evidence, the Record outcome submit label, exact quotation or independent evidence, and stale/uncertain recovery instead of introducing a second command form.
- Snapshot source windows, exact versions, permissions and unavailable states remain explicit. Advisory prompts do not fabricate completed exit-condition counts.
- Existing refresh, paging, sort, density, saved views, activity/document shortcuts, triage, changes and help controls remain accessible. Page/count provenance and forecast explanation occupy space beyond the simplified design composition. The phone paging footer stays in document flow and reserves space for Add deal. An export whose workspace has unmounted is cancelled before download.
- Filter option-search disclosures and explicit failed-read retry remain available for bounded native company/site/owner reads. The compact phone sheet uses the accepted field order, Reset and Show deals action. Loading placeholders use the shared register pattern without inventing stage names or counts before the permitted read; the empty Board callout sits over the native empty lanes. The unmerged Expected close design is excluded.
- Undrawn phone Board/view choice, selection, Forecast and Archive states use existing PPO sheets, stage navigation and contained horizontal scrolling. Tablet Forecast/Archive preserve the same grouping and fixed selection/settings controls.
- Archive synthetic per-record amounts and native follow-through evidence are examples, not assertions about operational data. Fixed fixture dates remain separate from runtime observations.

Functional proof, developer visual inspection, independent code review, owner acceptance and deployment are separate. Developer inspection is not visual acceptance. Claude's exact-head review and owner application acceptance remain pending; no deployment is requested or performed.

## Retained application captures

The source implementation checkpoint is `0ee4e3b371fb6ddc48692e0345f193a11c67e6bc`. Captures come from passing focused cases across the final runs, rather than a single uninterrupted green suite. Native-command captures use generated synthetic records; fixed design-read captures use the dated comparison fixture described above. Empty/loading/no-match Board/List captures also use the accepted 1440 × 600 state-frame viewport. Developer inspection compared the actual application with r02 at 1440, 1024, 390 and 320 px; this is not owner visual acceptance.

| Capture | Viewport | SHA-256 |
|---|---|---|
| [application-add-1440](./application-add-1440.png) | 1440 × 960 | `f19a0a84c2125c0c9512c4d98ca24b603ed9c2a503b669215210aabd76130f33` |
| [application-add-filled-1440](./application-add-filled-1440.png) | 1440 × 960 | `3c07df5c84190e0252fe5af6f1a45e524a56c2c50b43c09ac86c37f6174ce913` |
| [application-archive-1024](./application-archive-1024.png) | 1024 × 768 | `b33ad4c34537b781f224cba55b5bf0efcb174e675d73b01361c525a4dacfdb28` |
| [application-archive-1440](./application-archive-1440.png) | 1440 × 960 | `b1ffde396b31540da9e60dc277bbcc9f6b106b3f06689eb1b383379ca79eb235` |
| [application-archive-320](./application-archive-320.png) | 320 × 844 | `9c4a73682cb3b45f7add8a5ca1324598a7524bbfd8d96672417dc82fde7997fd` |
| [application-archive-390](./application-archive-390.png) | 390 × 844 | `0c707bafef489a1bf5c6bae4c500998e5f59c0ff47f37c7dda03b51158c32a46` |
| [application-board-1024](./application-board-1024.png) | 1024 × 768 | `ed5bf8a469131b48e5870a512e4a8ac74e24a9964df476242834c7c6ca7bbc0d` |
| [application-board-1440](./application-board-1440.png) | 1440 × 960 | `5fc798f4fddf6ff7d1e5f62c339945c63d5859c8b6e7f171047b3edcaa8e87d2` |
| [application-board-320](./application-board-320.png) | 320 × 844 | `8e2d51b9a042c5432d60cf413247a74efb98355cb1d1574c84c4907e419e1245` |
| [application-board-390](./application-board-390.png) | 390 × 844 | `2619bfa4ba6acb684a1d553349b0e3e3408b985af95a044a723e21c57cbeb76e` |
| [application-board-loading-1440](./application-board-loading-1440.png) | 1440 × 600 | `24c258bd2118d6ff9efc1ce3e2844d8d74eda4ac66420bbc3dcf67fa3ae96d48` |
| [application-columns-1440](./application-columns-1440.png) | 1440 × 960 | `2c7bc57c0539a293fe94e4310c4c149a177cf3e0b3669a85fc6f9275c338c765` |
| [application-denied-1440](./application-denied-1440.png) | 1440 × 960 | `df761305e9ca810f75925f073e31b9df59361f6db74541ab41490aaa5a502c2f` |
| [application-empty-1440](./application-empty-1440.png) | 1440 × 600 | `70070daff276fad43e0e34433d708302d456da5a93b8b9b22940d8136760d45a` |
| [application-empty-320](./application-empty-320.png) | 320 × 844 | `6a8684db9d97f31053c9576262d43fa7b0b1e6065fb689abcd3f2aca8a301159` |
| [application-filter-unavailable-320](./application-filter-unavailable-320.png) | 320 × 844 | `48326c023817195935ce2e69acfb8af37ce509367552e3523c1b6d79bb83d68c` |
| [application-filters-1440](./application-filters-1440.png) | 1440 × 960 | `8fee33c79a3074bcfd07bb7c32edac589796521f651710e695731d3795fe6479` |
| [application-filters-320](./application-filters-320.png) | 320 × 844 | `85289965f7895e3bd28d8ff333090bbede85ecd13698dbd4e4446dae468289a6` |
| [application-forecast-1024](./application-forecast-1024.png) | 1024 × 768 | `f5c9d42fec47665a26987384abbf3ed6439003136224dca9df3ea772d1173131` |
| [application-forecast-1440](./application-forecast-1440.png) | 1440 × 960 | `7e921b672d0851cae020151f86836a3e08c56812f777fd1576cf675e0dded04d` |
| [application-forecast-320](./application-forecast-320.png) | 320 × 844 | `8685b48fb5e980a6284ae1330856d5a00f1e5d0c4397db3739c8e22deffa8a7e` |
| [application-forecast-390](./application-forecast-390.png) | 390 × 844 | `e48983d1f3d63949e719f830698bbcf0b7bd7cf13d7d92e82d4952d1acd31f16` |
| [application-list-1024](./application-list-1024.png) | 1024 × 768 | `9ecbe55a172bd5be743f27e589ccce5ac21dcaa6032eb58c1517932e035910fb` |
| [application-list-1440](./application-list-1440.png) | 1440 × 960 | `9bca9e359f0e735d37238b465bf6b42fc6d0cdc5ae168b41c636b4fabbfe5d91` |
| [application-list-320](./application-list-320.png) | 320 × 844 | `56e518ffb0b93b83920537662d1536e44870dc1a3953ba367f93989bd0786aac` |
| [application-list-390](./application-list-390.png) | 390 × 844 | `2975b506ec65978d45e24eb335a030074c1881885c0bdabb03b0f76bef408fc6` |
| [application-loading-1440](./application-loading-1440.png) | 1440 × 960 | `9b485cdab978dd28b779e830aeb4649875c691299e1915883278f00c90f35017` |
| [application-no-matches-1440](./application-no-matches-1440.png) | 1440 × 600 | `ad7af0fc7c04480aba6b196cadf0578464b76e6f7b15582121b57569b9649940` |
| [application-no-matches-320](./application-no-matches-320.png) | 320 × 844 | `39cc9670c916dd2f9298bb6e6ca44d7aef04aa65775b897f103365b9200b410f` |
| [application-partial-1440](./application-partial-1440.png) | 1440 × 960 | `a335903c76f2c4c17c2765f5f2d8da9c98da428a1cc35be337db03095aeb1675` |
| [application-partial-320](./application-partial-320.png) | 320 × 844 | `70141d74ccb2b8294b356ed022048425606764425578a774b689b75bbdb83d12` |
| [application-record-lost-1440](./application-record-lost-1440.png) | 1440 × 960 | `d43b41ae704682b4839e7d84aa3c43537a77917fb28dc40ccb387f9d37438f10` |
| [application-record-won-1440](./application-record-won-1440.png) | 1440 × 960 | `ae76b56e2c850b55d130fd0807d11581f0c49f858958cfbc00134d727767f63c` |
| [application-refused-drag-1440](./application-refused-drag-1440.png) | 1440 × 960 | `26ef2ecb7721d7eb4d1f6fbf8e9f51005446e5c1cd2808cf800bde48a36545d5` |
| [application-selection-1440](./application-selection-1440.png) | 1440 × 960 | `387f3d08146e1321a4316f9ab9f0b5cf8e76be3d625fb33fa8080a65a594fd92` |
| [application-selection-320](./application-selection-320.png) | 320 × 844 | `46b93ea06bf10a1fe3d7853fb8c53e173fff12ef0ef73a9fc10f3eb71ce7e5dd` |
| [application-snapshot-1440](./application-snapshot-1440.png) | 1440 × 960 | `ac67dea02d9f60913fd1452cdbe5a7b6fea0532c159b662ae5e8d5d95f0fcada` |
| [application-snapshot-unavailable-1440](./application-snapshot-unavailable-1440.png) | 1440 × 960 | `f5aaaa4c4b117ab57f1118432f22b0827b1401f3eeab617cd5c7d6eb8667eb7d` |
| [application-stale-stage-1440](./application-stale-stage-1440.png) | 1440 × 960 | `afc1c09692421a9ff83bb035384a38f1e7a98a6ed56abc87ca994e4f6d47377b` |
| [application-unavailable-1440](./application-unavailable-1440.png) | 1440 × 960 | `d4d8a4a146b6b9a19d4cfff35c34b8ee73858ed3652f659a227f5cc441b9430d` |
| [application-won-recorded-1440](./application-won-recorded-1440.png) | 1440 × 960 | `3ff244ba706fc7b4e8d2be7372d3495febc8e0160472ef2b2059867f187ca672` |

## Claude findings and CI correction evidence — 2 November 2026

This follow-up addresses [review 5743113432](https://github.com/deanrfiedler-gif/powerplants-one/pull/699#pullrequestreview-5743113432) on `d320cf27fddef0ce779189e7d44c753cbb8c6283`. Main `04fdb6b78a48e6d1e8d6ed5656c4d0580d2ee6bc` merged without conflicts. #851 was not merged at the start of this handover; work did not wait for it. The earlier waiver and instruction to merge remain superseded.

- P2: a changed result page clears selection and sequence, reports that fact, and retains the open dialog and draft, including a snapshot that entered stage/outcome editing internally. A new browser case selects two rows, opens their sequence, edits a stage, advances the polling clock, and asserts cleared selection/sequence, a visible notice, the retained value and the original discard guard.
- P3: follow-through uses an opening read and explicit reload/retry. No 15-second or focus read remains in this component. The existing transaction, workspace lock, permissions and service API response contract are unchanged. A new browser case counts source requests across polling/focus, explicit reload, failed-read suppression, retry and reopening.

The following are diagnoses and corrections from the old head's evidence, **not browser passes on the new code**. Inspected job logs: [CRM persistence and interactions](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/41517711000/job/125533866987), [CRM UI conformance](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/41517711000/job/125533867278), and [compiled desktop 1](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/41517711025/job/125526674837). Downloaded and inspected `CRM-refinements-evidence` (artifact 13178979116) and `CRM-header-board-review` (13179215487), including the named failures' error contexts and screenshots.

| Reported test at d320cf27 | Observed failure and correction | Authority and attribution |
| --- | --- | --- |
| `browser/crm-refinements.spec.ts:498` | Refusal appeared and the deal remained Qualified, but Undo stage move was absent. Restore the native Undo control; its existing definite-refusal path clears the optimistic move without sending a replacement. Test assertions unchanged. | PR removed the control on errors. D12 adds warning/recovery presentation and does not remove native command safeguards. |
| `browser/crm-refinements.spec.ts:553` | Lost response showed Confirm original save outcome, but the expected disabled Undo was absent. Restore it, disabled until the original receipt is resolved. Test assertions unchanged. | Same PR condition; no command or receipt contract change. |
| `browser/crm-refinements.spec.ts:28` | Owner/activity persistence assertions completed; phone timed out on a toolbar List button. Use the shared Choose view → List helper. | D13 removes phone toolbar rows; Q1 preserves Board default. The undrawn phone view sheet adaptation retains view switching. |
| `browser/sales-workflows.spec.ts:76` | Both projects timed out opening the old inline insights summary. Open Pipeline insights first, then the existing review. Restore its missing phone entry in Choose view; close the panel before drill-through. Eight tabs, scoped values, return URL and viewport checks remain. | PR moved insights behind a control and hid its only entry on phones. CR-04 retains existing Insights behaviour; D13/Q1 explain the phone entry location. |
| `browser/deals-design-conformance.spec.ts:3` | Compiled log reports choice-menu border `rgb(225,229,235)` instead of `rgb(220,224,229)`. Restore the native #dce0e5 menu border. Assertion unchanged. | Accepted native menu adaptation retains r22 geometry. The correction follows the computed-style failure and retained native contract. Whether the border failure also occurs on main cannot be determined from the available evidence; no browser comparison with main was possible. |
| `ui/deals-design-conformance.spec.ts:53` | At 1920px the card measured 10px padding and 6px corners against retained 11px/7px. Restore 11px inset, 7px corners and neutral card border, preserving the existing hover border. Original desktop geometry/font assertions retained; tablet expectations use the accepted r02 master as explained below. | D2 changes stage/card widths to 228/212px. It does not supersede the retained card corners/border in the Sales Board component contract. |
| `ui/deals-design-conformance.spec.ts:128` | Timed out on the former toolbar Sort menu. Exercise native Views menu geometry, Home/End/typeahead/activation/focus return; exercise Sort and its URL value in Filters. Snapshot modeless geometry and modal filter geometry assertions remain. | Accepted 24 October Filters frame lists Sort among its fields; open menus use native controls. This is a control-path correction, not relaxed geometry. |

Evidence limit: the compiled browser artifact `compiled-application-browser-desktop-1-evidence` (13179248554) is 89,380,630 bytes, above the tool's 32 MiB transfer limit, and its signed download URL returned 403. Its job log was read; that archive was **not** inspected. The overlapping drag failures have inspected CRM artifacts, but the compiled menu-border finding has log/code evidence only. Browser, UI and physical-device confirmation are not run here; left to GitHub CI. The browser absence does not establish a CI failure as pre-existing on main. No new visual acceptance or review fingerprint is claimed.

### Validation in this handover

- Passed `npm run check`: development-register coverage, lint, typecheck, all 1,331 unit tests and the production build. The earlier recovery-path failure is no longer present after merging main's cloud TMPDIR setup correction. A focused lint run also passed after the final follow-through/test edits.
- Passed foundation, prototype, naming and status checks, migration numbering, 25 documentation-tool unit tests and whitespace checks. The new status fragment initially lacked valid front matter; clean main's status check passed, the fragment was corrected, and all four Python checks then passed.
- The initial restricted-sandbox unit attempt returned only `test failed` for `azure-demo.test.ts`, `browser-fixture-transport.test.ts`, `fertigation-request-limit.test.ts`, `foundation.test.ts`, `guide-library.test.ts`, `login.test.ts`, `proof-database.test.ts`, `proof-request-scope.test.ts`, `quality-asset-observer.test.ts` and `quality-packet-network.test.ts` (all under `tests/unit/`). The same ten failed with the same message on the clean detached `origin/main` checkout at `04fdb6b78`: **pre-existing on main in this environment**. The permitted rerun passed every unit test; these are not outstanding test failures.
- Initial database startup failed in the restricted sandbox; `npm run db:health` exposed `connect EPERM 127.0.0.1:5432`. The seven CRM suites were rerun with network permission and the documented disposable-reset flags.
- Browser/UI suites (including the two new regression cases), HTTP suites and the remaining repository database suites: **not run here; left to GitHub CI**. Browser absence was reported by successful cloud setup. The historical captures above are not new-code validation.

### Completed compiled-browser shards on d320cf27

All four completed job logs were read after the additional handover request. Their failures cluster in this PR's Deals controls and geometry. The old head had 1,287 passing cases across these jobs; that is CI history, not a pass claim for these corrections.

| Job | Old-head result | Failures accounted for |
| --- | --- | --- |
| [desktop-1](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/41517711025/job/125526674837) | 338 passed, 9 skipped, 3 failed | Refused drag, lost drag response, native menu border, all described above. |
| [desktop-2](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/41517711025/job/125526674786) | 334 passed, 14 skipped, 1 failed | Insights drill-through times out at the old inline summary. Uses the corrected entry path above. |
| [mobile-1](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/41517711025/job/125526674996) | 295 passed, 51 skipped, 4 failed | Owner transfer's old List button; Won/Lost's same List button at `crm-refinements.spec.ts:150`; geometry at `deals-cr04.spec.ts:78`; old Views button at `deals-design-conformance.spec.ts:21`. |
| [mobile-2](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/41517711025/job/125526674975) | 320 passed, 28 skipped, 1 failed | The same insights entry timeout. Uses the corrected phone entry path above. |

The additional Won/Lost failure is the same D13/Q1 phone navigation mismatch as owner transfer. Its inspected CRM screenshot shows the saved Won card in Closing with no toolbar. The shared Choose view → List helper now replaces that second direct List click too; the persisted outcome, ownership, version, disabled stage and non-draggable assertions remain.

The phone conformance case no longer tries the hidden desktop Views button. Under D13/Q1 and the documented undrawn Choose view adaptation, it asserts the native modal sheet's four enabled views, selected Board state, 10px panel corners, viewport containment, Escape dismissal and focus return. Desktop keeps the unchanged r22 popover geometry assertion. Redirect and single-board-frame checks still run in both projects.

The geometry case measured 230px rather than 228px at a 1440px viewport in the mobile browser context. The current flexible tracks use the scroll container's inner width; the 10px thin scrollbar reservation is absent with overlay scrollbars, adding 2px to each of five tracks. The full-bleed board now caps its width against the shell's existing rail-width token, preserving the accepted D2 228px stages and 212px cards with either scrollbar presentation. The exact width assertions are unchanged. This diagnosis follows the logged dimensions and CSS; browser confirmation remains pending.

The full viewport UI comparison also retains r38's desktop geometry but explicitly uses the accepted D2/D14 tablet card master at 1024: 264px high with 11px inset and 7px corners. The r02 [Tablet Board](../../../reference/ui/crm/deals-design-r02/PPO-Deals-15-Tablet-Board-r02.png) was inspected: its first card runs from y=252 to y=516 and retains the 212px width. This supersedes the old HTML's 280px/10px tablet rule. No equality, font, viewport, keyboard, command or persistence assertion was removed to allow a failure.

The additional compiled archives also exceed the 32 MiB transfer limit: desktop-2 artifact 13181700933 is 122,146,923 bytes; mobile-1 artifact 13180133675 is 42,578,839 bytes; mobile-2 artifact 13181665535 is 69,265,856 bytes. They were listed but not transferred or inspected. The overlapping CRM artifacts supply the owner, Won/Lost and insights screenshots/error contexts; the new compiled-only width/phone-conformance cases have log, code and accepted-design evidence only. No CI failure is classified as pre-existing merely because this environment lacks Chrome.

### Database results

Seven suites ran with network access and disposable reset guards: `crm`, `crm-i2`, `crm-refinements`, `crm-five-stages`, `mobile-crm`, `sales-workflows` and `deals-cr04` under `tests/database/`. Result: **103 passed, six environment-blocked: browser/Chrome renderer**. Successful cloud setup reported the database ready and browser unavailable. The failures below require rendered quotation or report/pack bytes; no database failure remains unexplained.

| Test | Message |
| --- | --- |
| HV-21: E1 original owner, source and exact draft bytes survive CRM transfer; receiver gains no commercial authority | `ExactDraftUnavailable — The exact draft output is unavailable. Its saved revision is retained for recovery.` |
| CA-03/10 accepted-main upgrade preserves old commands, histories, IDs and hashes; repeat seed never repairs revocations or edits | `{"processed":true,"state":"Failed","error_code":"RenderOrStorageFailure"}` |
| CA-10 existing field and report follow-up projections obey every Opportunity target | `{"processed":true,"state":"Failed","error_code":"RenderOrStorageFailure"}` |
| CR-04 issued quotation read retains exact revision and issue identity without publishing internal estimating content | `ExactDraftUnavailable — The exact draft output is unavailable. Its saved revision is retained for recovery.` |
| CR05 issued source -> chosen date -> prepared review -> attributed feedback -> completed review -> closure and correction | `{"processed":true,"state":"Failed","error_code":"RenderOrStorageFailure"}` |
| CR05 source changes, separate training evidence and exact CRM receiving obey command and options authority | `{"processed":true,"state":"Failed","error_code":"RenderOrStorageFailure"}` |
