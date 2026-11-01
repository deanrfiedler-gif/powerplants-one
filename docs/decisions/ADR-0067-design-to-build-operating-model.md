# ADR-0067 — Design-to-build operating model

<!-- versioning: git; committed history is authoritative -->

Owner: Dean Fiedler. **Status:** decided by Claude on 1 November 2026 under the delegation quoted below. It is an agent decision under delegated authority, not an owner acceptance of any page. Dean can overrule any part of it. It amends [ADR-0053](ADR-0053-figma-page-design.md) and [ADR-0055](ADR-0055-figma-file-structure.md). The working rules are in the [design-to-build standard](../standards/design-to-build-standard.md).

## Owner direction — 1 November 2026

Figma warned that the file was running out of memory. Dean supplied a general SOP and asked for the most professional structure. When an audit cited ADR-0053 against designing tokens in Figma first, he explained how he works: he designs in Figma, then builds the app to match, because the CSS was started before there was a plan. He then wrote:

> "You need to take into account that I am very inexperienced with designing and developing apps, so the approached I have been taking and some of the ADR rules may not be the most professional approaches that align with industry best practices. You have full control to overrule and update any documents, rules, etc., to ensure we setup the most professional structure relating to designing and building the UI pages in Figma to then build and implement in the Powerplants One app."

This covers the UI design-and-build process. It does not accept any page design, settle a business rule, authorise production work or decide a licence question.

Later the same day he proposed the direction this record now follows:

> "My thought process is that as the original Figma design page file wasn't setup correctly from the beginning, we will start again from scratch and create new pages files and structures as per your recommendations. We can keep the existing file and use it as a reference, or to copy across pages to the new file structure if needed."

Claude's advice, adopted here, is to start the files fresh but not redraw every page or rebuild the library from a blank file. At about 40 connector calls a page (one measured session) and a limit of 200 a day, redrawing 170 pages would use about 34 days of the whole allowance, and 107 accepted pages would need re-accepting.

He then raised the design goal:

> "when we are rebuilding the new page files from scratch, I'm happy for you to make improvements and refinements to the UI pages to ensure they look like truly world class and professional designs that align with industry best practices. I like the UI that Pipedrive uses, but I think we can still improve on this so that our UI pages are modern, use the most recent techniques and features relating to UI designs, etc. My goal is to basically have the Powerplants One designed as professional as possible so it is more superior and user friendly than the likes of the existing apps that are already in the marketplace"

He named Pipedrive, Wrike, inFlow Inventory, ServiceTitan and simPRO. This permits proposing improvements; each changed design still needs his acceptance. Decision 14 sets how this works.

## Context

Measured on 1 November 2026, read-only:

| Finding | Evidence |
|---|---|
| The file is large and one page dominates it | 191 pages, about 800,000 frames, instances and text layers. `Captures (icon-free)` holds 373,471 of them in 2,037 top-level frames. The next largest page holds 9,475 |
| The file is close to its limit | Figma's meter read **80.4%, with 682,382 layers**, on a fresh load in the desktop app with only Start here open (1 November 2026). The reading repeated on a second load. Figma alerts at 90% and locks at 100% |
| Viewing pages uses memory | Opening one average page (`Assistant · AI-01`) raised the reading to **82.5%, with 687,991 layers**. If that rate holds, about 5 opened pages reach the alert and about 9 reach the lock. This is one test |
| Captures' share of memory is not proven | Figma shows no per-page figure, and why 682,382 layers count with one page open is unexplained. Stage 2 measures the effect of removing Captures directly |
| Most scopes are drawn | 139 of the 149 scope IDs in the design register have a page. Undrawn: EQ-02, EQ-03, EQ-05, FI-02, MA-05 and five conditional CX scopes. Future work is mostly accepting and amending, not new drawing |
| Review is the bottleneck | 293 of 372 register entries say "Needs review", and 26 have a recorded reviewer |
| The file sits in Drafts | Figma requires a file to be in a folder before it can publish a library |
| Captures are duplicated | The repository holds 1,178 PNGs under `docs/reference/ui` (610 MB), including the exported captures. Each worktree costs about 0.95 GB, nearly all of it `docs` |
| The design is cited everywhere | 309 documents name "PPO - Design", and 118 mention its File index |
| Nothing is published | 702 publishable components and sets, and all variables, are local to the one file |
| The library rule is not being followed | 127 of the 702 are named "proposed", although ADR-0053 rule 5 admits only what the app has. 37 are legacy Deals parts |
| Components also sit on design pages | 626 main components on 61 design pages, 110 of them on `CPQ · 2` |
| Mapped tokens have their Figma value in the CSS, but the CSS has two generations | All 63 variables with a CSS name have that value on their property somewhere in `src/`, which doesn't prove every page uses it. 51 of the 114 colour and layout variables have no CSS name. 56 of 198 CSS properties hold more than one value, 29 of them mapped tokens: newer pages use a Figma-aligned block in `my-work.css`, while `globals.css` still differs for `--line`, `--muted` and `--paper`. 1,998 hard-coded hex colours remain |
| Practice had already moved past the rules | Pages are designed and accepted in Figma, then built to match. ADR-0053 rules 4 and 5 describe the reverse |

## Options

### Where design decisions start and where tokens live

| Option | For | Against |
|---|---|---|
| A. Keep ADR-0053: code is the source and Figma follows | Code is what ships | Contradicts the actual workflow, and promotes CSS that predates any plan |
| B. Figma alone is the master | Simple for a designer | The file is private, has no diff or pull-request review, and no check can read it. Figma cannot hold behaviour, permissions or data rules |
| C. Tokens in a repository file generate both Figma and CSS | Used by large system teams; GitLab authors tokens in JSON in code | Needs a build pipeline and a route into Figma, which on Professional means a plugin or the connector, because the Variables REST API requires Enterprise. Too much for one owner today |
| **D. Figma leads design, Git records acceptance and shipped values, and a check catches differences** | Fits a design-led team, keeps one owner per fact, and works on the Professional plan | The saved snapshot must be refreshed by a session |

### File architecture

| Option | For | Against |
|---|---|---|
| A. One file, without Captures | Least work, and may solve memory alone | No published library, whole-file named versions, and parallel sessions share one heavy file |
| B. Move every page now into department files | One home per department at once | New IDs break citations, about 170 hand-pasted pages, and accepted designs risk changing silently |
| **C. Freeze the original, publish one library, and create domain files on demand** | Keeps every citation true, needs no bulk copy, and costs little until needed | Designs sit in two places during the transition |

## Decision

Option D for tokens and option C for files.

1. **Source of truth depends on the question.** Accepted Figma design: how a page should look. Figma: new visual decisions. Git decision record: whether it was accepted. Git stylesheets: what the app ships, in the interim token homes the standard names until stage 5 merges them. Git blueprints, contracts and tests: behaviour, permissions and data. The running app: what users see. Proposals are never a source of truth.
2. **New tokens and components start in Figma.** Each token gets a role-based name and its CSS name when created, and is added to the app in the pull request that builds its page. Code may go first only for an urgent fix or something found during the build, and that change goes back into Figma in the same pull request.
3. **One owner per token, with an automated check.** `scripts/check_design_tokens.py` compares a committed snapshot of the Figma variables with the CSS. It enforces mapped values and new unmapped variables now. Hard-coded colours and multi-valued properties are report-only until the reconciliation stage, because 61 pull requests are open and an immediate limit would fail unrelated work.
4. **The accepted Figma value wins** where it differs from the CSS, unless it fails contrast or the difference is a documented page override. Reconciliation lists every difference first, and converts hard-coded colours as pages are built, not in one sweep.
5. **Freeze "PPO - Design" as the permanent record.** Its name, node IDs and named versions stay valid, so no record is rewritten. A citation with no file name means this file. Nothing is deleted from it. Viewing it still uses memory, so people reload every few pages, prefer the captures in Git, and use a browsing copy without Captures if stage 2 shows one reads 60% or less.
6. **One published library, `PPO - Library`.** It holds variables, styles, icons, shared components, the page template and shared patterns. One library suits one owner. Split it only if a licence or sharing need appears or memory requires it. It starts as a duplicate of the frozen file because Figma documents copying variables between files, not moving their bindings.
7. **Domain files are created on demand, from a fixed map of ten.** No empty file is created ahead of need.
8. **Start fresh; copy, redraw or leave each old page.** A new page is drawn in its domain file. An accepted page that doesn't change stays in the frozen file. A small amendment or a proposal is copied when next worked on. A page being reworked, or built from many detached parts, is redrawn from the library using the old page as the reference. Nothing moves in bulk. This follows ADR-0055's "start with new designs" and protects accepted designs from silent change.
9. **Every page has one live home**, recorded by its decision record and design entry. The hand-kept File index stops at the freeze.
10. **Named lifecycle for components:** Proposed, Accepted, Built, Deprecated, held in the description; these are PPO's own labels. Publishing follows a checklist with a release note graded Low, Medium or High. Medium and High need Dean's acceptance, and High is tried on a duplicate first, because Figma doesn't flag library updates as design changes. One session edits the library at a time.
11. **Quality gates, checked by a second session.** A design must pass Design ready before acceptance, and a page must pass Build done before merge. A session other than the author checks them, and a graded comparison decides what must be fixed. These add the states and WCAG 2.2 AA checks (the proposed NFR-08 target) that the process did not require.
12. **Captures are temporary in Figma and selective in Git.** Copies are made on a temporary page, exported with hashes, and the page is deleted. Only frames a builder needs are retained. Existing captures stay unchanged.
13. **Unchanged:** Dean accepts every page design. Named versions remain the acceptance marker. The file link and Pro artwork stay out of the repository. A private Figma team, one page per app page and real scope IDs all continue.
14. **Raise the design language first, then redesign in waves.** Pipedrive's grammar stays the base, with Dean's recorded preferences. Improvements go first into the library's tokens, type, density, shell, grid, record, form and state patterns, then into five flagship journeys benchmarked against the named products. Other pages follow in tiers, module by module. "More professional" is judged by a scorecard, and "better than the market" is claimed only after task tests with Powerplants staff. Standard section 14 holds the detail. This narrows decision 8: a page in a redesign wave is redrawn, not copied.

## What this changes in earlier rules

| Rule | Change |
|---|---|
| ADR-0053 rule 1 | New work moves from "PPO - Design" to `PPO - Library` and the domain files at cut-over |
| ADR-0053 rule 3 | Citations name the file. Captures follow decision 12 from now on |
| ADR-0053 rule 4 | "Never the master" is replaced by decision 1 |
| ADR-0053 rule 5 | Replaced by decisions 2, 3 and 10 |
| ADR-0053 rule 8 | Extended with a library edit lock |
| ADR-0055 rules 1, 2, 5, 6 | Replaced at cut-over by decisions 5 to 9. The department dividers and File index stay in the frozen file |
| ADR-0055 "Deferred: splitting the file" | The file-size trigger is treated as met |
| [Components page decision](figma-components-page.md) D1 and D2 | Apply to the frozen file. The library's contents follow decision 6 |

## Stages and gates

| Stage | Work | Pass condition |
|---|---|---|
| 1. This change | Decision, standard, amendments, token check | Repository checks pass |
| 2. Freeze and build the library | Set a cut-off and finish pending named versions and in-progress drawing. Save "Before split". Commit a manifest and take a private backup, restoring one to prove it works. Move a small test file from Drafts to confirm its link, history and comments survive, then move `PPO - Design` to `PPO Record`. Duplicate it, delete Captures and Archive from the duplicate, read the meter and decide on the browsing copy. Make the library in `PPO Library`, clean up and publish | The library is published, with the memory readings recorded |
| 3. Pilot and go live (the "cut-over") | Draw one new page from the library. Copy `CPQ · 2` to `CPQ · 4`, Screen Configurator, Quotations, Estimation Wizard and one simple page into a pilot file. Move new work across if a method passes | Every criterion in the standard passes |
| 3b. Raise the design language | Benchmark the five products, improve the library, redraw the five flagship journeys, and test them with staff | Dean accepts the language and flagships; scorecard and task-test results are recorded |
| 4. Redesign waves, then copy or redraw on change | Tier by tier under the standard, with new pages in domain files and other pages under decisions 8 and 14 | Each page passes its gates, and each copy passes the comparison in the standard |
| 5. Reconcile tokens | Merge the two CSS generations into one token home, then make the report-only checks enforcing | No unlisted difference between Figma and CSS |

**Priority.** The 80.4% reading is above the 70% action level, so stages 2 and 3 come before further bulk drawing, and no new capture copies are kept in the file from now on. Because most scopes are drawn, copying and accepting existing pages will be the main route into the new files.

**Cost of decision 14.** Redrawing reopens accepted designs, adds to a review backlog of 293 entries, and means rebuilding built pages. At about 40 connector calls a page, the daily limit allows roughly five pages a day. This is why it runs in tiers, and why a page's visual-only build work waits while its redesign is due, while functional work continues.

**Follow-ups, each needing its own change.** Automated accessibility tests, which add a dependency and need their own record. A trial of Code Connect after the pilot. Marking accepted frames Ready for dev is manual, because no Plugin API for it appears in the typings, and Professional can't clear the Changed state.

**Stop rule.** If no linking method passes stage 3, the library file already holds every page except Captures and Archive, so it becomes the single working file with a published library, and this record is revisited. Until stage 2 starts, pages are still drawn in "PPO - Design", and drawing pauses during stages 2 and 3. Only decisions 1 to 4, 11 and the capture rule take effect immediately.

## Consequences

- No application behaviour, route, migration, permission or parent requirement ID changes. All 78 parent IDs remain.
- Library updates must be accepted in each domain file by hand. No Plugin API for this appears in the typings, which is another reason to create files on demand.
- The frozen file's named versions depend on a paid Figma plan, because Starter keeps 30 days of history. The PNGs and hashes in Git remain the lasting evidence.
- Whether the Font Awesome Pro licence allows a second person into a file holding Pro artwork remains open under ADR-0050. A team library stays private to Dean's team.

## Limits

Cross-file behaviour is untested: whether duplicates keep node IDs, and whether pasting keeps instance links, bindings and prototype flows. Stage 3 exists to settle these. Comparing mapped tokens checks values, not appearance. The published practice comes from the sources below, and GitLab and Atlassian details come from their documentation as summarised by search, not from full reads. Two independent reviews, of the recommendation and then of the reference built from it, are reflected here. Primitive colour tokens were considered and deferred to stage 5, because they change nothing for one light theme. This record has not had the cross-model review its pull request requires.

## Reversing this

Decisions 1 to 4, 10 to 12 and 14 can be reversed by amending this record, with nothing lost. Stages 2 to 4 add files without changing the frozen record's contents, so a reversal stops using them. Pages drawn only in a domain file would need copying back.

## Sources

- [Figma: Reduce memory usage in files](https://help.figma.com/hc/en-us/articles/360040528173-Reduce-memory-usage-in-files)
- [Figma: Team, folder and file organization](https://www.figma.com/best-practices/team-file-organization/)
- [Figma: Components, styles and shared libraries](https://www.figma.com/best-practices/components-styles-and-shared-libraries/)
- [Figma: Design tokens](https://www.figma.com/resource-library/design-tokens/)
- [Figma: Design system governance](https://www.figma.com/resource-library/design-system-governance/)
- [Figma: Variables REST API](https://developers.figma.com/docs/rest-api/variables/)
- [Figma: Create and manage variables](https://help.figma.com/hc/en-us/articles/15145852043927-Create-and-manage-variables-and-collections)
- [GitLab Pajamas: UI kit file structure](https://design.gitlab.com/get-started/uik-file-structure/)
- [GitLab Pajamas: Authoring design tokens](https://design.gitlab.com/product-foundations/design-tokens-authoring/)
- [Atlassian: Release phases](https://atlassian.design/release-phases)
