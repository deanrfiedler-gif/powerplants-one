---
document_id: PPO-USER-GUIDE-PROP
title: Powerplants One user guide, direction paper
date: 2026-10-23
owner: Dean Fiedler
status: Accepted by the owner 23 October 2026 (Q1–Q11 as recommended). Stage 1 and later stages are not authorised by this record; no guide content, application change, image storage or Help Centre build is authorised
versioning: git
---

# Powerplants One user guide, direction paper

**Owner:** Dean Fiedler. **State:** Accepted by the owner, 23 October 2026: "Proceed: I accept Q1–Q11 as recommended. Record my decision in the paper and mark PR #674 ready for review." The acceptance covers the direction and the recommended answers in section 11. Each stage in section 10 still needs its own go-ahead, and stage 1 begins with the parser ADR (section 4.2).

**Raised by:** Dean, 23 October 2026: "I will eventually need to design and develop a very extensive user guide for the entire Powerplants One app. The guide should include all modules, workflows, procedures, screenshots, instructions, etc." He suggested starting it as a Claude Design artifact board, beginning with the board's style and a table of contents, and asked: "What is your professional recommendation relating to designing and developing the user guide for the Powerplants One app?"

Claude recommended against keeping the guide in a design board. Dean then asked for that recommendation to be audited ("Audit the information you just provided to ensure it is accurate and the most professional approach"). The audit, and a further check of the audit itself, corrected several points; the corrected findings are in sections 2 and 5. Dean then said: "Proceed: draft the user guide decision record (building on PPO-HELP-DEC r01, covering all three content sources) and the table of contents, on a branch with a draft PR." He asked for the drafts to be reviewed for accuracy and professionalism before he accepts them: "Once you are satisfied with the information, I will then accept it as recommended." An independent fact-check against the repository was run on 23 October 2026, and its findings are corrected in this version.

**Related:**

- Builds on: [Contextual help direction and design handover](contextual-help.md) (PPO-HELP-DEC r01) and the [contextual help design](../blueprints/contextual-help-design.md) (PPO-HELP-DES). This paper does not edit either record.
- Companion: [User guide table of contents](../guides/user-guide-contents.md) (PPO-USER-GUIDE-TOC).
- Content rules: [page guide template](../standards/page-guide-template.md); [acceptance and pilot plan](../testing/contextual-help-acceptance.md) (HELP-01–HELP-14, T1–T6).
- Decisions: [ADR-0050](ADR-0050-font-awesome-light-icons.md) (Font Awesome Pro licence limits); [ADR-0053](ADR-0053-figma-page-design.md) (Figma for page design, Claude Design retired for new work, and rule 9: Pro artwork never goes into the repository or a retained capture); [living master documents](living-master-documents.md); [workshop, settings and preferences scope](workshop-settings-preferences-scope.md) (conditional CX scopes); [Users, roles, teams and access review](users-roles-access-review-design.md) (AD-01).
- Requirements: DOC-04 (owned, reviewed knowledge and SOP links), NFR-01 (server authorisation; here, guide content limited to what the reader may see), NFR-05 (useful unavailable states), NFR-07 (offline field work), NFR-08 (accessible, readable guidance). No parent requirement ID is added or changed.
- Scopes: `scope:DK-07` Page guides and contextual help coverage (`/help`); `scope:AD-10` User onboarding, learning and support (`/help/onboarding`); `scope:SH-04` Search. Both help scopes already exist in the design register, so this paper adds no scope ID.

Everything below was written as a PPO proposal and is now the accepted direction. It explains how the user guide is written, kept and delivered. It writes no guide content.

## 1. What this builds on

On 13 September 2026 PPO-HELP-DEC r01 recorded that Dean asked for a help/information icon on every page, with a detailed professional user guide that could link to SOPs. Its design (PPO-HELP-DES) prepared the details of in-app help **for review**. r01 says plainly that it "is not adoption of every proposed detail", and both records are still marked as prepared for review. This paper proposes adopting these details as the base for the whole guide (Q11):

- **Release binding.** Help ships in the same release as the screens it describes. A guide never pulls "latest" instructions from `main` at runtime.
- **Content rules.** The page guide template's sections, Australian English, exact on-screen labels, synthetic examples, and the rule that no business rule is stated only in help.
- **SOPs.** A page guide explains how to use PPO. The SOP governs the business procedure. SharePoint stays the business-document authority. Guides link to SOPs and never copy or revise them.
- **Lifecycle and roles.** Content moves through Draft, InReview, Reviewed, Published, Superseded and Withdrawn, as set out in the page guide template (section 4.3 reconciles this with `guides.json`). Business reviewers are nominated for each module before operational use.
- **Reader behaviour.** A side panel on desktop and a full-screen reader on phones, with the design's keyboard, focus and stable-geometry rules. The panel built today is a narrower first version of that design; it has not been checked against those rules.
- **No new system.** Reviewed content in the repository, bundled with the application. No external CMS, SaaS subscription or runtime service.

What r01 and its design did not settle, and this paper proposes:

1. Moving from a guide per page to a **whole-application user guide**, with journeys across modules, a contents, and search across every guide.
2. Choosing **one content source**. Three now exist (section 2).
3. **Screenshots** under the Font Awesome Pro licence.
4. **Print and offline** copies.
5. The **structure** of the guide (the companion table of contents).
6. A **writing standard** and the order in which chapters are written.

## 2. What PPO has today

Checked against `main` at `01cef391`, 23 October 2026.

| Source | Where it lives | What it covers | Who sees it | Quality |
|---|---|---|---|---|
| **A. Released page guides** (TypeScript) | `src/components/leads-guide.ts` (defines the `PageGuide` type), `src/activities/work-guide.ts`, `src/components/estimating-workload-guide.ts`, `src/components/cost-sources-guide.ts`, `src/supply/guide.ts`, `src/engineering/control/guide.ts`, `src/shell/guide.ts` | Leads, My Work, Estimating workload, Cost sources, the ten Supply chain pages (SC-01–SC-10), the Engineering workload page and four Engineering control pages (design basis, drawings, queries, reviews), and a general application guide. Six sections: overview, how to use, your journey, on your phone, keyboard shortcuts, and if something is unavailable (with a boundary note) | **Every signed-in user**, from the Page guide (information) icon. Pages without one say "The detailed … guide is being prepared" and offer the general guide | Written for users; the best prose of the three |
| **B. Development draft guides** (JSON) | `docs/design/development/guides.json`, schema 2 | 364 entries: 212 routes and 152 scopes. 293 follow the 13-section layout; 33 have only 3 sections. All Draft; no reviewer recorded. 120 open with the template sentence "Use … to work towards this outcome" | Only users with design-workspace access, as an extra section of the same panel | Broad coverage, mostly scaffolding; needs rewriting, not publishing |
| **C. Markdown pilot** | `docs/guides/crm-deals.md` (PPO-HELP-CRM) | CRM Deals, written to the page guide template | Not rendered in the app | Good model of depth and tone, but describes the old two-stage workflow (Enquiry, Qualified); the current workflow has five stages |

Also relevant:

- **The Help Centre pages are registered but not built.**
  - `scope:DK-07` is registered at `/help` with the state "refine". The page guide panel it extends exists, but the `/help` page itself does not exist in `src/app`.
  - `scope:AD-10` is registered at `/help/onboarding` as "unbuilt".
- **There is no glossary** anywhere in `docs/`.
- **No acceptance checks have run.** HELP-01–HELP-14 and T1–T6 have not been run against the application.
- **Quick Help is separate.** It remains a separate header panel (keyboard shortcuts and support).
- **The roles are only proposed.** AD-01's role bundles are proposals, not adopted roles. Only service, field, finance, observer and hosted-demo bundles exist; there are none for sales, estimating, engineering or projects. D-020 is still open.

## 3. The guide's shape

**One guide, written once, delivered in three places.**

| Place | What the reader gets | Scope |
|---|---|---|
| **Page guide** (the existing information icon) | The guide for the page in front of them, opened at the right section. Unchanged in principle from r01 | Existing shell control; DK-07 coverage |
| **Help Centre** (`/help`) | The whole guide: contents, search across every published guide, journeys, reference and troubleshooting | `scope:DK-07` |
| **Onboarding and What's new** (`/help/onboarding`) | A first-day path for each job function, and the changes in each release | `scope:AD-10` |

A printable copy of any chapter comes from the Help Centre (section 7).

**The guide is organised by what the reader is trying to do,** following the Diátaxis split between learning, doing, looking up and understanding:

| Part | Kind of content | Purpose |
|---|---|---|
| 1. Getting started | Tutorial | First use: signing in, the screen layout, My Work, search, phones |
| 2. How Powerplants One works | Explanation | How records connect, ownership, statuses and handovers, and what PPO does versus MYOB Acumatica, SharePoint and CAD tools |
| 3. Journeys | Tutorial and how-to | End-to-end work across modules, such as enquiry to issued quotation |
| 4. Module reference | Reference and how-to | One chapter per module, made from the page guides |
| 5. Tasks and procedures | How-to | Short task index, each linking to the page guide section and the SharePoint SOP where one is approved |
| 6. Administration | How-to and reference | Users and access, settings, templates, integrations |
| 7. Reference | Reference | Glossary, statuses, record numbers, roles and capabilities, shortcuts |
| 8. Troubleshooting | How-to | Access refused, uncertain saves, offline conflicts, getting support |
| 9. What's new | Reference | Changes in each release |

The page guides are the module reference (part 4). Every other part is written once and links into them rather than repeating them.

**Who the guide is for:** Powerplants staff. The customer portal (CP-01–CP-06) gets its own separate customer guide when the portal is built, because its readers, permissions and wording differ.

## 4. One content source

### 4.1 Options

| Option | For | Against |
|---|---|---|
| **A. Markdown, one file per guide, with front matter** (the recommendation in PPO-HELP-DES, section 5.1) | Readable diffs in pull requests. One file per guide, so parallel PRs rarely collide. Suits long prose, tables and steps. Front matter can carry the schema 2 metadata: guide key, entry key (which the register maps to routes), status, reviewer and review hash. Industry-standard "docs as code" | Needs a build step that validates it and compiles it for the app. The repository has no Markdown parser or sanitiser today, so one must be chosen. Tooling (`studio:sync`, the development reader) has to read it |
| B. Structured JSON (`guides.json`) | Already validated by `studio:check`. Already read by the development reader | One 76,000-line file that every guide edit touches: the shared-file conflict that the [merge-conflict reduction](merge-conflict-reduction.md) moved other registers away from. Prose inside JSON strings is hard to write and review |
| C. TypeScript objects (`src/`) | Type-checked. Already released | Content lives in application code: every wording fix is a code change, and a non-developer cannot edit it safely. The 7-section type is too small for the full template |
| D. Outside the repository (Claude Design board, SharePoint pages, or a CMS) | Visual editing | Cannot be bound to routes and releases, reviewed in pull requests, searched by the app or checked by CI. Creates a second copy that drifts. Claude Design is retired for new work (ADR-0053). PPO-HELP-DES defers an external CMS until authoring volume justifies it |

### 4.2 Recommendation

**Option A.** Each guide is one Markdown file in a guide folder, with its schema 2 metadata in front matter. A build step validates every file, checks route bindings and section anchors, and compiles the published guides into the application bundle. The compiled output is generated during the build and never committed.

The Markdown is restricted to headings, paragraphs, lists, tables, links, images and callouts. PPO-HELP-DES already forbids executable MDX, script URLs and executable raw content. This paper goes further and proposes no raw HTML at all, so that the sanitiser has less to trust.

**Choosing the parser needs an ADR.** The parser and sanitiser are a technology choice and probably a new dependency. PPO-HELP-DES already asks for "the final renderer/sanitisation choice and dependency rationale" to be recorded before implementation. Stage 1 therefore writes that ADR first, comparing a small maintained library with a restricted parser written for PPO.

### 4.3 Consequences for the three sources

- **A (TypeScript):** each released guide is moved to Markdown without loss, then its TypeScript object is deleted in the same pull request, so users never see a gap.
- **B (JSON):** the 363 drafts stay where they are as working notes until a module is written properly. Writing a module's chapter turns its drafts into Markdown files and removes them from `guides.json`. `studio:sync` then creates Markdown stubs instead of JSON entries. Once empty, `guides.json` is retired by a later record.
- **C (CRM pilot):** rewritten for the five-stage Deals workflow before it is published, keeping its document ID and history.
- **Status words:** three vocabularies exist today:
  - the page guide template uses Draft, InReview, Reviewed, Published, Superseded and Withdrawn;
  - schema 2 of `guides.json` and the development reader accept only Draft and Reviewed;
  - PPO-HELP-DES omits Reviewed.

  **Recommendation:** the template's six states become the one vocabulary. Reviewed means the content was checked against a running release; Published means it is released to all users. Stage 1 extends the schema and reader to match. Existing Draft and Reviewed values keep their meaning, and no existing review evidence is changed.

This is a migration of content and tooling. It needs its own build plan and does not happen in this pull request.

## 5. Screenshots and images

### 5.1 Constraints

- **The repository is public, and the Pro licence forbids publishing Pro files.** ADR-0050 forbids committing Pro icon files. ADR-0053, rule 9, goes further: "Pro artwork never goes into the repository or into a retained capture." Any screenshot of the running app shows Pro icons when the Kit is loaded.
- **Public CI artifacts count as publishing.** GitHub's documentation says anyone signed in with read access can download a workflow's artifacts, and every GitHub user has read access to a public repository. Screenshots of Pro icons must not be uploaded there either.
- **What Font Awesome says.** A web search on 23 October 2026 reported that Font Awesome's support FAQ says Pro icons cannot be directly included in open source projects, and that sharing Pro assets with anyone not covered by the licence violates it. Neither statement mentions screenshots. Font Awesome's own licence and support pages returned no text to an automated fetch, so the licence text has **not** been read on this point.
- **Without the Kit, the app shows its own drawings.** Wherever `PPO_FONT_AWESOME_KIT` is not set, as in CI, the app shows its own local icon drawings. Those are safe to publish, but they look different from what staff see.
- **Kit domains.** The Kit loads on `localhost` but never on `127.0.0.1`. Whether its allowed domains include the hosted demo's address is still an open item in ADR-0050.
- **Test data dates move.** The synthetic fixture dates shift over time, so a capture must fix the clock or every image changes on each run.
- **PPO-HELP-DES rules still apply.** Screenshots show synthetic records only, match the release they describe, carry useful alternative text and never replace written steps.

### 5.2 Options

| Option | For | Against |
|---|---|---|
| A. Commit screenshots to the repository | Simple; reviewable in pull requests | Forbidden by ADR-0053 rule 9 while the repository is public |
| B. Capture without the Kit (local drawings) and commit them | Licence-safe; reviewable | Icons differ from the live app, which confuses readers. A user guide must match what users see |
| **C. Capture with the Kit on a licensed machine, keep images out of Git, deliver them only inside the signed-in app** | Matches the live app. Licensed users see icons they already see in the app | Needs a private image store and a capture script. Images cannot be reviewed in GitHub diffs; review happens in the running app |
| D. Few or no screenshots | Nothing to store; never out of date | Weaker for complex screens and for first-time users |

### 5.3 Recommendation

1. **Write every guide so that it works without screenshots.** Use the exact labels, where each control is and what the reader sees next. The page guide opens beside the live page, which is a better reference than any picture.
2. **Use option C for the Help Centre and printed chapters.** Screenshots come from a capture script run against the synthetic database at `localhost`, with a fixed clock, and are stored privately. They are bundled into the private release image, never committed and never uploaded as CI artifacts. Where they are stored is a technology choice, so it needs its own ADR when screenshot capture is built. No new service is assumed here.
3. **Diagrams can be committed.** Diagrams drawn without Pro icons, such as journey flows and record relationships, are ordinary repository content.
4. **Dean asks Font Awesome** whether screenshots of an application in a user guide, shown to licensed users or printed for staff, are permitted. If Font Awesome confirms that screenshots are not "Pro files", ADR-0053 rule 9 could be amended to allow option A. Until then, option C stands.

## 6. Journeys and job functions

AD-01 has no adopted roles (section 2), so journeys cannot be organised by permission role. **Recommendation:** organise journeys by business flow, and name the reader by job function in plain words ("estimator", "service coordinator", "field technician"). Where a step needs a permission, the guide says which capability it needs, not which role. Once D-020 roles are adopted, add a "Your role" index that points each role at its journeys. The journeys themselves do not need rewriting.

The issued workflow maps under `docs/reference/ui/module-workflow-maps/` are a checklist for which journeys exist. Most were issued in September, before the 8 October product direction and the Figma redesigns, so each journey is written from the current build, not from the map.

## 7. Print and offline

- **Print.** The Help Centre gets a print stylesheet, so any chapter or journey prints cleanly or saves as PDF from the browser. This adds no dependency. A generated PDF of the whole guide, using the existing document renderer, is a later option if Powerplants needs a controlled, issued manual. That would be a separate decision.
- **Offline.** Field technicians work offline (FI-02, NFR-07). PPO-HELP-DES already says offline help needs its own cached-guide policy. **Recommendation:** when the offline workspace is next extended, cache the published guides for the My Jobs pages only, bound to the cached release. Do not cache SOPs; their links say they need a connection.

## 8. Writing standard

- **Process standard.** [ISO/IEC/IEEE 26514:2022](https://www.iso.org/standard/77451.html), *Design and development of information for users*, checked 23 October 2026. It starts from what users need to know and do, then sets the structure, content and format, and covers maintaining information through the product's life. This paper follows it: the job functions and journeys are the audience and task analysis; the table of contents is the structure; release binding and review states are the maintenance.
- **Content types.** [Diátaxis](https://diataxis.fr/): tutorials, how-to guides, reference and explanation are kept separate (section 3).
- **Style.** The [Australian Government Style Manual](https://www.stylemanual.gov.au/), the government's digital-first writing guide, for plain language, Australian spelling, dates and numbers. PPO-HELP-DES's rules on exact labels and AUD, GST and unit meanings also apply.
- **Terminology.** A short PPO terminology sheet, kept with the guide's glossary (there is none yet; part 7.1 of the table of contents creates it), fixes the words that drift, for example "deal" and "opportunity" (the CRM pilot uses both). The guide uses the words on screen; where the screen is inconsistent, that is raised as a UI defect, not papered over in the guide.
- **Accessibility.** PPO-HELP-DES sets keyboard, focus, zoom and reduced-motion rules for the reader; HELP-01 to HELP-05 and HELP-12 test them. Guide content also needs heading order, meaningful link text, table headers and alternative text, against WCAG 2.2 AA.

## 9. When chapters are written

- **Write the structure and shared parts now.** That means the table of contents, Getting started, How Powerplants One works, Reference and Troubleshooting.
- **Write a module's chapter only after its page design is accepted and built** (ADR-0053 lock-in, then the build), in the same pull request as the build where possible. Pages change weekly. Writing ahead of the build documents designs that will change.
- **Write a journey once every module it crosses has a published chapter.**
- **Don't publish too early.** A chapter reaches Published only after it has been read against the running release and the module's business reviewer has signed it off. Until then it stays InReview or Reviewed, and general users see the "being prepared" message.
- **Who does what.**
  - Claude writes each chapter in the pull request that builds or changes its page, and updates affected chapters whenever a workflow changes (PPO-HELP-DES, section 5.2).
  - Dean reviews it as content owner.
  - The module's business reviewer checks business accuracy before publication.
  - An edit never grants review.
- **No silent gaps.** The release check that PPO-HELP-DES requires also applies to the Help Centre: every route has a published guide or an explicit "being prepared" fallback. The design register already fails CI on a missing page registration.

## 10. Stages

| Stage | Outcome | Not included |
|---|---|---|
| 0. This paper | Direction and table of contents, accepted 23 October 2026 | Any content, code or tooling |
| 1. Source and tooling | ADR for the Markdown parser and sanitiser; build plan; one status vocabulary; move the released TypeScript guides into Markdown; rewrite the CRM pilot for five stages | New chapters |
| 2. Help Centre design | Help Centre page, contents, search and print layout drawn in Figma (ADR-0053), using the PPO design tokens | Build |
| 3. Help Centre build | `/help` with contents, search across published guides and journeys; HELP-01–HELP-14 run | Screenshots |
| 4. Chapters | Module chapters and journeys in build order, each with its business reviewer | Unbuilt modules |
| 5. Images, onboarding, offline | Screenshot capture and private storage (with its ADR); What's new and onboarding (AD-10); cached field guides | Customer portal guide |

## 11. Questions for Dean, with recommended answers

**Decision:** Dean accepted every recommended answer below on 23 October 2026 ("I accept Q1–Q11 as recommended"). The alternatives are kept as a record of what was considered.

| # | Question | Recommended answer | Alternative |
|---|---|---|---|
| Q1 | Where does the guide's content live? | **In the repository**, released with the app | A Claude Design board, SharePoint pages or a CMS (section 4.1, option D) |
| Q2 | Which content source? | **Markdown, one file per guide** (section 4.2) | Keep `guides.json` (B) |
| Q3 | How is the whole guide delivered? | **A Help Centre at `/help` under DK-07, with search across all published guides**, beside the existing page guide | Page guides only, as today |
| Q4 | How is the guide structured? | **The nine parts in section 3**, as set out in the [table of contents](../guides/user-guide-contents.md) | — |
| Q5 | How are journeys organised while roles are unadopted? | **By business flow, with job functions named in plain words** (section 6) | Wait for D-020 roles |
| Q6 | How are screenshots handled? | **Write guides to work without them; use option C for the Help Centre and print; ask Font Awesome about screenshots** (section 5.3) | Option B (local drawings, committed) |
| Q7 | Print and offline? | **Browser print per chapter now; cached field guides when the offline workspace is next extended** (section 7) | A generated whole-guide PDF |
| Q8 | Which writing standard? | **Australian Government Style Manual plus a PPO terminology sheet**, under ISO/IEC/IEEE 26514 and Diátaxis (section 8) | — |
| Q9 | Where is the guide's look designed? | **In Figma**, as a Help Centre page and print layout using the PPO tokens (ADR-0053) | A Claude Design board (retired for new work) |
| Q10 | When is each chapter written? | **After its module page is accepted and built**; shared parts now (section 9) | Draft every module now from the registered designs |
| Q11 | Are the contextual help design's prepared details adopted as the base for the whole guide? | **Yes**: release binding, content rules, SOP linking, the page guide template's six status words and the reader rules (section 1) | Review each detail separately |

## 12. Limits of this record

- **It sets direction only.** Dean accepted the direction and Q1–Q11. Each stage in section 10 still needs its own go-ahead.
- **One action is Dean's.** Asking Font Awesome about screenshots (section 5.3, point 4).
- **It changes nothing in the app or guides.** It changes no application code, guide content, `guides.json`, TypeScript guide, route, permission or CI job.
- **The licence point is unconfirmed.** It has not been confirmed with Font Awesome or against the full licence text.
- **The facts are a snapshot.** Counts and states are as of `main` at `01cef391` and will drift as work lands.
- **The build states are approximate.** The design register's build states (used in the table of contents) lag behind some recent work. Each chapter checks the current build when it is written.
- **The workflow maps were not read in full.** The issued maps are named as a journey checklist only; this paper does not reconcile them.
- **Nothing has been reviewed or tested.** No user study, business review or acceptance run has taken place. HELP-01–HELP-14 and T1–T6 remain not run.
