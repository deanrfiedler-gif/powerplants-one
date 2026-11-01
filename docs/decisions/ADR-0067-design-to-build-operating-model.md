# ADR-0067 — Design-to-build operating model

<!-- versioning: git; committed history is authoritative -->

Owner: Dean Fiedler. **Status:** decided by Claude on 1 November 2026 under the delegation quoted below. It is an agent decision under delegated authority, not an owner acceptance of any page. Dean can overrule any part of it. It amends [ADR-0053](ADR-0053-figma-page-design.md) and [ADR-0055](ADR-0055-figma-file-structure.md). The working rules are in the [design-to-build standard](../standards/design-to-build-standard.md).

## Owner direction — 1 November 2026

Figma warned that the file was running out of memory. Dean supplied a general SOP and asked for the most professional structure. When an audit cited ADR-0053 against designing tokens in Figma first, he explained how he works: he designs in Figma, then builds the app to match, because the CSS was started before there was a plan. He then wrote:

> "You need to take into account that I am very inexperienced with designing and developing apps, so the approached I have been taking and some of the ADR rules may not be the most professional approaches that align with industry best practices. You have full control to overrule and update any documents, rules, etc., to ensure we setup the most professional structure relating to designing and building the UI pages in Figma to then build and implement in the Powerplants One app."

This covers the UI design-and-build process. It does not accept any page design, settle a business rule, authorise production work or decide a licence question.

## Context

Measured on 1 November 2026, read-only:

| Finding | Evidence |
|---|---|
| The file is large and one page dominates it | 191 pages, about 800,000 frames, instances and text layers. `Captures (icon-free)` holds 373,471 of them in 2,037 top-level frames. The next largest page holds 9,475 |
| The memory cause is not proven | Figma counts memory only for loaded pages, and layers are a proxy. No meter reading has been taken |
| Captures are duplicated | The repository holds 1,178 PNGs under `docs/reference/ui` (610 MB), including the exported captures. Each worktree costs about 0.95 GB, nearly all of it `docs` |
| The design is cited everywhere | 309 documents name "PPO - Design", and 118 mention its File index |
| Nothing is published | 702 publishable components and sets, and all variables, are local to the one file |
| The library rule is not being followed | 127 of the 702 are named "proposed", although ADR-0053 rule 5 admits only what the app has. 37 are legacy Deals parts |
| Components also sit on design pages | 626 main components on 61 design pages, 110 of them on `CPQ · 2` |
| Figma and CSS agree where they are mapped, but the CSS has two generations | All 63 variables with a CSS name match a value in `src/`. 51 of the 114 colour and layout variables have no CSS name. 57 of 200 CSS properties hold more than one value: newer pages use a Figma-aligned block in `my-work.css`, while `globals.css` still differs for `--line`, `--muted` and `--paper`. 1,997 hard-coded hex colours remain |
| Practice had already moved past the rules | Pages are designed and accepted in Figma, then built to match. ADR-0053 rules 4 and 5 describe the reverse |

## Options

### Where design decisions start and where tokens live

| Option | For | Against |
|---|---|---|
| A. Keep ADR-0053: code is the source and Figma follows | Code is what ships | Contradicts the actual workflow, and promotes CSS that predates any plan |
| B. Figma alone is the master | Simple for a designer | The file is private, has no diff or pull-request review, and no check can read it. Figma cannot hold behaviour, permissions or data rules |
| C. Tokens in a repository file generate both Figma and CSS | Used by large system teams, for example GitLab | Needs a build pipeline, and Figma's Variables REST API requires an Enterprise plan. Too much for one owner today |
| **D. Figma leads design, Git records acceptance and shipped values, and a check catches differences** | Fits a design-led team, keeps one owner per fact, and works on the Professional plan | The saved snapshot must be refreshed by a session |

### File architecture

| Option | For | Against |
|---|---|---|
| A. One file, without Captures | Least work, and may solve memory alone | No published library, whole-file named versions, and parallel sessions share one heavy file |
| B. Move every page now into department files | One home per department at once | New IDs break citations, about 170 hand-pasted pages, and accepted designs risk changing silently |
| **C. Freeze the original, publish one library, and create domain files on demand** | Keeps every citation true, needs no bulk copy, and costs little until needed | Designs sit in two places during the transition |

## Decision

Option D for tokens and option C for files.

1. **Source of truth depends on the question.** Accepted Figma design: how a page should look. Figma: new visual decisions. Git decision record: whether it was accepted. Git token file: what the app ships. Git blueprints, contracts and tests: behaviour, permissions and data. The running app: what users see. Proposals are never a source of truth.
2. **New tokens and components start in Figma.** Each token gets a role-based name and its CSS name when created, and is added to the app in the pull request that builds its page. Code may go first only for an urgent fix or something found during the build, and that change goes back into Figma in the same pull request.
3. **One owner per token, with an automated check.** `scripts/check_design_tokens.py` compares a committed snapshot of the Figma variables with the CSS. It enforces mapped values and new unmapped variables now. Hard-coded colours and multi-valued properties are report-only until the reconciliation stage, because 61 pull requests are open and an immediate limit would fail unrelated work.
4. **The accepted Figma value wins** where it differs from the CSS, unless it fails contrast or the difference is a documented page override. Reconciliation lists every difference first, and converts hard-coded colours as pages are built, not in one sweep.
5. **Freeze "PPO - Design" as the permanent record.** Its name, node IDs and named versions stay valid, so no record is rewritten. A citation with no file name means this file. Nothing is deleted from it.
6. **One published library, `PPO - Library`.** It holds variables, styles, icons, shared components, the page template and shared patterns. One library suits one owner. Split it only if a licence or sharing need appears or memory requires it. It starts as a duplicate of the frozen file because Figma documents copying variables between files, not moving their bindings.
7. **Domain files are created on demand, from a fixed map of ten.** No empty file is created ahead of need.
8. **Pages are copied when they next change.** A new page goes straight into its domain file. A proposal or accepted page is copied when it is next worked on, not in bulk. This follows ADR-0055's "start with new designs" and protects accepted designs from silent change.
9. **Every page has one live home**, recorded by its decision record and design entry. The hand-kept File index stops at the freeze.
10. **Named lifecycle for components:** Proposed, Accepted, Built, Deprecated, held in the description. Publishing follows a checklist with a release note. One session edits the library at a time.
11. **Quality gates.** A design must pass Design ready before acceptance, and a page must pass Build done before merge. These add the states and WCAG 2.2 AA checks (the proposed NFR-08 target) that the process did not require.
12. **Captures are temporary in Figma and selective in Git.** Copies are made on a temporary page, exported with hashes, and the page is deleted. Only frames a builder needs are retained. Existing captures stay unchanged.
13. **Unchanged:** Dean accepts every page design. Named versions remain the acceptance marker. The file link and Pro artwork stay out of the repository. A private Figma team, one page per app page and real scope IDs all continue.

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
| 2. Measure and rehearse | Read the meter on a fresh load. On a throwaway duplicate, test the hardest pages: `CPQ · 2` to `CPQ · 4`, Screen Configurator, Quotations, Estimation Wizard and one simple page | Every criterion in the standard passes |
| 3. Cut over | Finish pending named versions, save "Before split", freeze with a committed manifest and a private backup, create the library, clean it and publish | The library is published, and a new page can be drawn from it |
| 4. Copy on change | New pages in domain files, other pages when next changed | Each copy passes the comparison in the standard |
| 5. Reconcile tokens | Merge the two CSS generations into one token home, then make the report-only checks enforcing | No unlisted difference between Figma and CSS |

**Stop rule.** If no linking method passes stage 2, do not cut over. Fall back to option A with a published library, and revisit this record. Until stage 3 finishes, pages are still drawn in "PPO - Design". Only decisions 1 to 4, 11 and the capture rule take effect immediately.

## Consequences

- No application behaviour, route, migration, permission or parent requirement ID changes. All 78 parent IDs remain.
- Library updates must be accepted in each domain file by hand. No Plugin API for this appears in the typings, which is another reason to create files on demand.
- The frozen file's named versions depend on a paid Figma plan, because Starter keeps 30 days of history. The PNGs and hashes in Git remain the lasting evidence.
- Whether the Font Awesome Pro licence allows a second person into a file holding Pro artwork remains open under ADR-0050. A team library stays private to Dean's team.

## Limits

Cross-file behaviour is untested: whether duplicates keep node IDs, and whether pasting keeps instance links, bindings and prototype flows. Stage 2 exists to settle these. Comparing mapped tokens checks values, not appearance. The published practice comes from the sources below, and GitLab and Atlassian details come from their documentation as summarised by search, not from full reads. An independent reviewer audited the recommendation before this decision, and its findings are reflected here. This record has not had the cross-model review its pull request requires.

## Reversing this

Decisions 1 to 4 and 10 to 12 can be reversed by amending this record, with nothing lost. Stages 3 and 4 add files without changing the frozen record, so a reversal stops using them. Pages drawn only in a domain file would need copying back.

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
