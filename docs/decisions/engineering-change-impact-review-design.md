---
document_id: PPO-EN07-INT
revision: r01
date: 2026-09-20
owner: Dean Fiedler
scope_id: EN-07
principal_requirement: ENG-06
status: Implemented on a branch, pushed on Dean's authority as draft PR #266, for owner review; visual acceptance, business acceptance and the accepted UI baseline register remain separate
source_commit: 5d54c4e (main with EN-06 merged as PR #265, which this branch was rebased onto on 20 September 2026; main was 1a69e93 at the planning checkpoint)
---

# EN-07 Engineering Change-Impact Review: application integration

**Scope:** page/module EN-07 under parent requirement ENG-06. The two identifiers belong to different registers and are not conflated; EN-08 (ENG-07) keeps commissioning and as-built release. **Authority:** on 20 September 2026 Dean supplied Build Plan r02, the audited desktop mockup r02 and the VS Code build prompt r01, and instructed that the working module be built in the local application, verified and left running. Later the same day, with the first build pushed, he supplied **desktop mockup r03** and wrote: "You can commit the attached EN-07 files. The UI design is an updated design." The plan and r03 are therefore in the repository, and the screen was brought to r03 (D16). The prompt makes routine, reversible implementation decisions the implementer's and asks for them to be recorded. This is that record, together with what was checked and what remains open.

This is a change to a synthetic prototype. Nothing here is a production claim, a business acceptance, a technical authority, or evidence that an ERP, SharePoint, CAD, commercial, supply, service or commissioning integration exists.

## 1. References and what each was used for

| Reference | Location | Used for |
|---|---|---|
| Build Plan r02 | Issued copy: [`docs/reference/ui/engineering-changes/PPO-EN-07-Engineering-Change-Impact-Review-Build-Plan-r02.md`](../reference/ui/engineering-changes/PPO-EN-07-Engineering-Change-Impact-Review-Build-Plan-r02.md), listed in the source manifest. Stable working plan, as the plan's section 22 names it: [`docs/delivery/engineering-change-impact-review-build-plan.md`](../delivery/engineering-change-impact-review-build-plan.md). Both are byte-identical to the supplied file (SHA-256 `388eb244…523dea99`) | Domain boundaries, state rules, the visual contract, the fixture and cases EN07-A01–A60 |
| VS Code build prompt r01 | Found beside the plan in Dean's Downloads; it was not among the files he attached, so it is **not in the repository** (SHA-256 `8f2c3239…a5d3ca9f`) | The executable instruction and its ten sections |
| Desktop mockup r03, the updated design | [`docs/reference/ui/engineering-changes/PPO-EN-07-Engineering-Change-Impact-Review-Desktop-UI-Mockup-r03.png`](../reference/ui/engineering-changes/PPO-EN-07-Engineering-Change-Impact-Review-Desktop-UI-Mockup-r03.png), listed in the source manifest (SHA-256 `b55cdf0e…48067ad5`) | Composition, hierarchy and the selected-record presentation, as now built. Inspected as an image; written tokens and data rules governed exact values |
| Desktop mockup r02 | Supplied in the conversation; superseded by r03 and **not in the repository** (SHA-256 `048f4905…21733ea6`) | What the first build, commits `a816da9`–`7a47b2f`, was audited against. Its composition survives wherever r03 did not change it |
| Theme style board r22 | `docs/reference/ui/theme-style-board/powerplants-one-theme-style-board-r22.html` | Semantic tokens and the register profile |
| My Work shell and styles | `src/shell/secondary-menu.tsx`, `src/app/styles/my-work.css` | The menu itself, reused rather than imitated |
| EN-06 server and UI | `src/engineering/materials/`, migration 0029 | Conventions, retained upstream sources, shared register and inspector rules |
| Master Blueprint section 11; Coverage Register r06 | `docs/blueprints/BP-01-master-blueprint.md`; `docs/reference/ui/module-page-register/` | ENG-06 obligations and the EN-05 dependency |
| Project delivery readiness design; Supply Chain readiness contract | `docs/decisions/project-delivery-readiness-design.md`; `docs/contracts/supply-chain-readiness.md` | Receiving boundaries. Both are designs or contracts, not runtimes |

The plan and mockup r03 were committed on Dean's words quoted above. The source manifest guards the bytes of the issued plan and of r03, so `check_foundation.py` fails if either is altered. Nothing is registered in the accepted UI baseline register: that register pins HTML baselines to application mappings, and r03 is a raster image. **Source order where references disagree**, as the plan sets it and with r03 in r02's place: Dean's explicit UI instructions; the plan's data, authority and audit rules; the actual My Work menu and shared shell; mockup r03; the r22 profiles.

**The pasted prompt was EN-06's.** The message that started this work attached the EN-07 plan and mockup and pasted the EN-06 build prompt. EN-06 was at that moment being built by another session in the same checkout. The EN-07 companion prompt named by the attached plan was found beside it and followed. Nothing of EN-06's was rebuilt here.

## 2. Decisions

| # | Decision | Evidence and effect |
|---|---|---|
| D1 | Stack on the EN-06 branch, in an isolated worktree | EN-07 needs migration 0029, EN-06's retained sources and the menu primitive EN-06 extracted. The shared checkout was in use, so the work was done in `tmp/en07-change-impact` and rebased three times onto EN-06's moving tip (last `49c7bcc`). It must merge after EN-06 |
| D2 | Migration **0030**, additive | 0029 was already taken. Sixteen tables (`ppo.engineering_changes`, fifteen `ppo.change_*`), nine guard functions, five CHECK constraints widened by the 0020 idiom, typed identity dispatch extended in place. Because it alters `ppo.business_identities`, it settles the deferred `identity_target` checks first and restores deferral straight after, as AGENTS.md has required since 0029 met that failure in CI |
| D3 | No new reference type | PPO-STD-001 catalogues none for an engineering change, so none is invented. References are package-local `SYN-EN07-nnn` aliases, constrained to that form in the schema, and consume no SYN-PPO counter. A real type is an STD-001 amendment for Dean |
| D4 | Sources are EN-06's retained upstream snapshots | EN-07 reads `ppo.material_sources` and never copies, publishes, edits or withdraws one. Three kinds are added for it (TestProcedure, TestEvidence, InstalledConfiguration); no material line can name them. One line of EN-06's parser changed to accept them |
| D5 | One identity, numbered revisions, one hash | Submitting freezes content, affected objects, source links and retest definitions under one hash. Reviews, the decision, every payload and the closure bind to it. Coordination (owner, date, priority) is outside it and never invalidates anything |
| D6 | Every command advances the change version | A closure or decision made against version N cannot race past a result recorded after N. Child records keep their own version for their own commands |
| D7 | Five capabilities and a separate versioned policy, both required | `engineering.change.review/decide/receive/verify/close`. The AD-01 access-review catalogue is regenerated for them on LF bytes, with a plain-English label each and its pinned contract size moved from 65 to 70. `engineering.edit` is authorship only. An absent policy answers "Authority not configured". Independence is checked against everyone who authored or changed the proposal, in the service and again in the database |
| D8 | Commercial and scheduling are an in-module synthetic prerequisite | No commercial or scheduling runtime exists. Accepting a change raises owned prerequisites from its cost and dates findings; their outcome carries the authority label `SyntheticPrerequisiteFixture` for ever and is never a Project, Finance or booking approval |
| D9 | Receivers are local fictional people | No Supply, Service, Commissioning or document-control runtime exists to receive anything. A receiver accepts, returns or declines their own destination's exact payload. Accepting records receipt; it proves no physical work and rewrites nothing upstream |
| D10 | Whole-scope implementation only | No command accepts a subset of the assessed scope, so hiding rows or ticking boxes cannot narrow an assessment. An independent child scope is future work |
| D11 | Currentness is derived; the time shown is a recorded check | The condition compares the retained snapshot with the adapter's present answer. The time beside "Sources current" is a `change_source_checks` row, written by an explicit check or by a decision that rests on current sources, never by a page load. The successor a change itself asked for is its expected result |
| D12 | An obligation with no attempt is "Test pending" | Nothing here can know a test was performed and is awaiting its paperwork, so "Awaiting evidence" is never inferred |
| D13 | Shared rules are shared by scope id, not copied | `#ppo-changes` is named beside `#ppo-my-work` and `#ppo-materials` through `:is()` in `my-work.css` and `engineering-materials.css`, which keeps the specificity of an id. EN-07's own sheet holds only the tone treatment, the wider inspector and the assessment surfaces |
| D14 | EN-06's status colours are not reused | They are the saturated oranges the EN-07 audit rejected. The shared r22 tokens already hold every prescribed value; only the information pair had no variable and is a scoped alias |
| D15 | Inspector width follows available space | 448px where the split allows, 400px beside an expanded menu so the eight default columns stay in view at the audited 1672×941, and an overlay once the register would fall under about 760px |
| D16 | Mockup r03 supersedes r02, on Dean's words, and the built screen follows it | **Register:** review state and attention are pills, the tone's text colour on the tone's own surface from the plan's "Optional surface" column with an outline glyph, which the plan's section 5.3.1 permits while preferring restraint; still no filled row and the one amber strip is the inspector's. Draft, Assessing, Decision recorded, Returned and Assessment needed take the glyphs r03 draws, through the same single mapping, and no tone changed. Due dates are written in full ("21 Sep 2026", never "Sept"); Add condition, Sort and the pager are outlined controls; "Next action owner" may take two lines; the page closes with the synthetic notice alone. **Context:** one "Package / project" cell replaces the separate Engineering package cell; the package title stays in the picker's options and the cell's tooltip. **Menu:** linked nodes for Impact assessment, a flask for Retest & verification, a plain clock for Changes & history. **Inspector:** review-state and "Technical accepted" chips under the title; a "Technical basis" heading over unboxed As released and Proposed ("Rev C"); Sources current, then the recorded check time with its zone ("3:30 pm AEST" in r03: the application formats moments in `Australia/Brisbane`, so the label is a fact, not decoration), then the link; open summary rows with "Pending review" in the caution colour and the owner and due date as one line beneath; follow-through as whole-row links with the record's own state and a chevron, a pending receiving outcome now in the information tone; the amber strip under the follow-through it blocks, reading "Implementation is not authorised until this prerequisite is resolved."; then the primary action, an outlined "Review handover" and the assessment link. A third inspector width, 368px, applies under a 1320px split, so all eight columns stay in view at r03's own 1586×992 beside the real 220px menu. **Unchanged on purpose:** the server's `technical_decision` and `implementation` projections, which the database suite asserts; the chip wording is a second mapping (`decisionChip`) over the same decision. Where the strip is absent, an accepted change shows its implementation state as a third chip, so r03's removal of the Implementation row loses nothing |

## 3. Routes

`/engineering/changes` (permitted package picker) and, under `/engineering/[id]/changes`: the register, `impact`, `reviews`, `handovers`, `verification`, `history`. `[id]` is the Engineering package UUID. `?change=<uuid>` names the selected change in every destination and is validated against the package on the server; a missing or foreign one is reported as unavailable with nothing shown in its place. The API mirrors these under `/api/v1/engineering/[id]/changes`, plus `prerequisites`, `handovers/preview`, `candidates`, `people` and `export`. Entry links were added to the Engineering workspace beside EN-06's.

## 4. What is synthetic, and its limits

| Absent runtime | What stands in | What it cannot claim |
|---|---|---|
| EN-02/03/05 sources, CAD | EN-06's synthetic upstream adapter (local retained snapshots) | A live provider check. Freshness is "as retained locally"; no drawing geometry is compared |
| Projects commercial and scheduling | In-module prerequisite | Any commercial, variation or booking authority |
| Supply, Service, Commissioning, release and document owners | Fictional receiving profiles | That a PO, stock, booking, asset or document changed |
| Inspection and EN-08 | `SyntheticInspectionFixture` attempts and an as-built reference field | Test execution, thresholds or as-built release. The module supplies no engineering limit |
| My Work and the shared inbox | Requests and reviews are listed inside EN-07 (My actions view, per-destination queues) | **Not integrated.** No Activity or inbox record is created, so these do not appear in `/work` |
| Notifications, DK-03 distribution | None | Any delivery or acknowledgement outside the module |

## 5. Departures from the plan or mockup

1. **Menu labels keep the plan's names, and wrap.** r03 draws "Review & decision" and a truncated "Actions & handove…". The plan's section 6 names the destinations "Review & decisions" and "Actions & handovers", and text resolves an image; they take two lines beside their badge because the menu is My Work's at its real 220px with its real spacing, which was not changed to reproduce the mockup's narrower, single-line menu. A label is never truncated.
2. **Names carry the SYN prefix** and the Project reference is the allocated `SYN-PPO-PRJ-…`, not the mockup's illustrative alias. The fixture lives on the EN-06 scenario's package so that it links real material lines.
3. **"Awaiting evidence" is unused** (D12), and **no phone mockup was audited**: the phone composition is an implementation of the written requirement only.
4. **Related-record discovery** suggests material lines, their releases and active site assets only, and says so. Requirements, interfaces, supply observations, milestones, job packs and tests are added by exact reference.
5. **Print** uses the browser's own print of the history view. No print stylesheet or PDF renderer was added.
6. **The inspector starts under the context row.** Both mockups draw it as a full-height column beside a shortened context row. The context row and the split beneath it are EN-06's shared layout, which was not restructured. The cost is about 80px of inspector height: at r03's own 1586×992 everything r03 shows is in view, and at 768px height r03's new order puts the amber strip below the fold of the inspector's scrolling body, while the caution-toned "Pending review" and the pinned "Open commercial review" stay in view.
7. **Kept although r03 does not draw them:** the count of distinct linked objects beside the affected scope, which the plan's register contract requires; the count inside each saved view's name; the sentence telling a reader who cannot resolve a prerequisite whose it is; and the third, implementation chip described in D16.
8. **The suites' due dates are r03's, moved forward 261 whole weeks.** The mockup dates its eight changes 21 to 25 September 2026. A suite that seeds those literally starts failing on the calendar the day after: an open change past its date also says "Overdue", and the register journey asserts each Due cell exactly. ADR-0030 decided what happens to every still-future fixture date, so the same transform (its own `shift_text`, offset and "only future dates move" rule) was applied to EN-07's helper and its database, HTTP and browser suites, and to nothing else: run over the whole repository the script would move `main`'s already-shifted fixtures a second time. The journeys therefore read "22 Sep 2031" to "26 Sep 2031"; dates deliberately in the past, such as the recorded retest of 20 September 2026, stay. The local demonstration fixture and the retained captures keep r03's literal dates, which is what makes them comparable with the mockup; from 22 September 2026 that local fixture will truthfully show its first rows as overdue.

## 6. Verification performed (local, 20 September 2026)

| Check | Result |
|---|---|
| Scoped `tsc --noEmit` over EN-07, the shared files it touched, its helpers, scripts and tests | Clean |
| `eslint` over the same | Clean |
| `tests/unit/engineering-changes.test.ts` (12) and `migration-registry.test.ts` (2) | 14 pass |
| Migration 0030 and seed 30 inside one rolled-back transaction on the development schema | 29 positive steps, 43 intended refusals, deferred identity checks forced. It caught a NULL-unsafe independence constraint before anything was applied |
| Applied with the official `migrate` and `seed` | Applied. The runner first refused on line-ending checksums of migrations 1–27 in a fresh worktree; it was given the bytes it expects and was not bypassed |
| `scripts/engineering-changes-scenario.ts` through the running application | Eight records; the server derives the audited stage and attention pairs, badges 2 and 3, and the SYN-EN07-003 inspector. A rerun changes nothing |
| `tests/browser/engineering-changes.spec.ts` on a task-owned server (port 3107) | 3 desktop and 1 phone journeys pass. Includes computed r22 colours, flush geometry, dock and overlay, menu geometry compared with `/work` itself, lost-reply recovery and cost withholding |
| `tests/http/engineering-changes.test.ts` on the same server | Passes, on two consecutive runs after one flaky assertion of mine was corrected (a bare `1250` can occur inside a content hash) |
| EN-06's own browser suite on this branch | 5 pass (4 desktop, 1 phone): the shared style and header changes regressed nothing there |
| The three traps EN-06's CI found (AGENTS.md) | Met before CI. Seed 30 adds 21 grants, so the exact added-grant set that the two Estimating upgrade proofs expect now covers seeds 29 and 30; checked read-only against the development database it accepts the real 52 additions in both row shapes and refuses an extra grant, a changed original, an unapplied seed 30 and a change duty given to an author. With a real pending identity event, 0030 without the settle pair fails with `cannot ALTER TABLE "business_identities" because it has pending trigger events`; with it, it runs and deferral is restored (rolled back). The access-review model check and all 40 native browser groups pass at 70 capabilities. Python wrote CRLF into the two generated files on Windows; they are committed as the LF bytes CI regenerates |
| Re-run after the later rebases | Whole-project `tsc` and tracked-tree `eslint` clean; unit 152 of 156 (the four known Windows path failures, which also fail on `main`); HTTP passes; 9 of 9 applicable browser journeys pass (EN-07 four, EN-06 five) |
| Restart | The same digest of records, versions, 41 events and recorded check time before the stop, after the restart and after a scenario rerun |
| Captures inspected | 1920, 1672, 1440, 1366, 1280, 960 (200% of 1920) and 390 wide; see the evidence folder |
| After bringing the screen to mockup r03 | Whole-project `tsc` and `eslint` over EN-07 clean; unit 12 of 12 with the r03 glyphs, the decision chip and the pending-outcome tone asserted; HTTP passes; 3 desktop and 1 phone browser journeys pass with the pill surfaces, chips, basis wording, zone-labelled check time, owner line, strip position and button order asserted as computed or rendered values. `check_foundation.py` (17 manifest entries) and `check_naming.py` report no errors. All captures were taken again, with one added at r03's own 1586×992. EN-06's suites were not rerun: nothing shared was edited in this step |
| A defect the r03 run exposed, not caused by it | The request builder chose a request's receiving owner as it was added, from a people list that might not have arrived; a fast click left the owner empty for good and "Preview exact requests" disabled. The three add buttons now wait for that list. The slower first compile after the restyle made a previously passing journey hit it |
| After the rebase onto `main` (EN-06 merged, fixture-date fix #263, installation #261) | No conflict. Whole-project `tsc` clean; unit 12 of 12, with `fixture-expiry` and `migration-registry` passing beside it; HTTP passes; 3 desktop and 1 phone browser journeys pass on the shifted dates. The task-owned dev server had to be restarted first: the rebase removed and re-created the nested route folders under it and its watcher then answered them with the framework's 404. Every record was as it had been after the restart |

**Not run locally:** `tests/database/engineering-changes.test.ts` and every other database and demo suite, which need `ppo_synthetic_test`; the compiled build; the Engineering intake and My Work browser suites, whose specs address port 3000 literally. CI is their first run. Defects found by running the application and fixed: a reloaded proposal hashed differently from the saved one; an owner rule that wrongly caught the recipients list; a clipped Attention column; a breadcrumb that truncated before the destination.

## 7. Acceptance cases EN07-A01–A60

All were *planned* in the plan. Status here is task-local and none is a parent acceptance pass. **B** browser journey, **H** HTTP suite, **U** unit, **T** rolled-back database proof, **S** scenario or restart proof, **D** authored in the database suite and not yet executed, **C** holds by construction with no dedicated assertion.

| Cases | Status |
|---|---|
| A01 package identity | H |
| A02 six destinations | B for direct links, reload and unavailable selection; Back/Forward not asserted |
| A03–A08 header, menu parity, preference, flush tables, inspector geometry, inspect versus select | B. Flush geometry is measured on the register; the focused views use the same rule and were inspected in captures |
| A09 register controls, A10 missing dates and counts | H and B. Column sizing has a menu alternative only; no drag resize exists |
| A11 draft persistence | S |
| A12 exact baseline fields | Built and inspected; not asserted |
| A13 coordination-only purpose | U. No fixture exercises it end to end |
| A14 completeness, A16 location versus served areas | U, D; A16 also B |
| A15 scope independent of filters | C, and D for closure counting every request |
| A17 shared dependencies, A18 option change | U for A17 (whole-scope only, D10); A18 C through the content hash |
| A19 quantities and units | Not applicable to this increment: EN-07 holds no quantity; EN-06 owns them |
| A20 commercial unknowns | U, H, B |
| A21 dates and commitments | C: no command moves a commitment |
| A22 independence, A23 authority policy | T, D, U. Company B's absent policy is not exercised end to end |
| A24 return and correction | D |
| A25 technical versus implementation, A29 request purposes, A30 exact preview | U, B, D |
| A26 source advance, A27 benign change, A28 competing edits | D; A27 and A28 H |
| A31–A33 receiver ownership, mixed outcomes, same-identity resubmission | D, U |
| A34 post-acceptance amendment | Built (Amendment purpose, stale-revision flag); not exercised |
| A35 fail before commit | C (one transaction) and T |
| A36 lost response, A37 duplicate and racing | B, H; the parallel race is D. Recovery after a restart is not separately asserted |
| A38 adapter and outbox uncertainty | C: one outbox job per accepted command; no remote receiver exists to retry |
| A39–A43 test basis, failed and repeat tests, closure, no-implementation closure, historical integrity | T, U, D; the failed attempt is also S and inspected |
| A44 permission projection, A45 revoked access on recovery | B, H, D. Another identity is refused a receipt; revocation after the fact is not exercised |
| A46 responsive and accessibility | B at 390; captures at seven widths. No keyboard-only, screen-reader or physical-device audit |
| A47 export and print | H for CSV; print not reviewed |
| A48 migration and seed compatibility | T, U, D, and the registry consumers updated |
| A49 adjacent regression | EN-06 suite B; My Work menu measured; Engineering intake not rerun |
| A50 complete walkthrough | D, with its parts B and H |
| A51 overlapping proposals | D; the fixture shows a real overlap (002 and 003 share material line 010) |
| A52 withdrawn source | U only |
| A53–A60 semantic formatting, currentness, follow-through, next action, menu reuse, counts, visual fixture, fallback | B, with U, H and D where noted above |

## 8. Open items for Dean

1. **Supplied sources.** Settled for the plan and mockup r03 by Dean's words on 20 September 2026 (section 1). Still outside the repository: the VS Code build prompt r01, which was never attached, and mockup r02, which the updated design supersedes; say so if either should be retained. No UI baseline is registered for EN-07: the register holds HTML baselines, and whether a raster mockup should be admitted to it is Dean's call.
2. **Reference type.** `SYN-EN07-nnn` is a labelled alias (D3). A catalogued type is an STD-001 amendment.
3. **My Work and inbox integration** (section 4) is the largest functional gap against the plan's ownership table.
4. **Merge order.** Settled: EN-06 merged to `main` as PR #265 on 20 September 2026 and this branch was rebased onto it without conflict, so draft PR #266 now shows EN-07's commits alone. Dean authorised publication the same day ("I authorise you to push to github"). Merging #266 is Dean's.
5. **Development database ledger, row 30.** 0030 was applied to `ppo_synthetic` before the settle pair was added, exactly as happened to EN-06's 0029. Row 29 has since been corrected (read back on 20 September 2026: it matches its file); row 30 still holds its first checksum, `8f85831c…`, against the file's `3674efdd…`. It bites only where 0030 is registered, so not on `main` today but on `main` once #266 merges, when `npm run db:migrate` will refuse until the ledger is told. The schema 0030 produced is unchanged and the running application is unaffected. It is left for Dean because it is a direct write outside the runner: `UPDATE public.ppo_migrations SET sha256 = '3674efdd59991fca4b6caa8cc4caa6f8507eccb2a0934db53785c067d44be67a' WHERE version = 30;` The value is the SHA-256 of the file as it now stands on LF bytes; 0030 must not be edited again.
6. D-008 and D-019 (source systems, technical authority), real commercial and scheduling rules, and verified receiving contracts remain operational dependencies, exactly as the plan's section 21 lists them.
