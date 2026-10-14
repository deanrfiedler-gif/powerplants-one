# ADR-0055 — Figma file structure and index

<!-- versioning: git; committed history is authoritative -->

Owner: Dean Fiedler. **Status:** adopted on the owner's instruction, 14 October 2026. This record adds to [ADR-0053](ADR-0053-figma-page-design.md). It reverses none of its rules, and adds one step to the lock-in sequence in rule 3 (Decision 6).

Related: [ADR-0053](ADR-0053-figma-page-design.md) (Figma for page design); [ADR-0050](ADR-0050-font-awesome-light-icons.md) (Font Awesome Pro licence limits); the [UI conformance standard](../standards/html-module-conformance.md); the [design and build workflow](../design/development/README.md); the [CCE Figma brief](../delivery/cce-figma-design-prompt.md), which says not to create a competing library or a new file by default.

## Owner decision — 14 October 2026

Dean noticed that the CPQ design used six Figma pages while every other design used one, and asked why. Claude answered that the CCE brief had listed six pages. Dean replied: "I am fine with multiple pages, or single pages. Taking into account what we are using Figma for relating to the Powerplants One app, what is the most professional approach that aligns with industry best practices for designing UI pages in Figma?"

Claude recommended one library file plus one design file per department, with one Figma page per app page. Dean then instructed: "Ok. Taking that information into account, restructure the Powerplants One UI pages and files to ensure it aligns with industry best practices and is as professional as possible."

While the work was under way Dean added: "the other active session has finished with the Deals and Customer 360 pages, so you can now include those also."

Dean then said he liked the six CPQ pages and the ES-02 and ES-08 labels on the Fertigation and Screen Configurator pages, and asked whether to use that approach for every design ("We don't have to. What is your professional opinion?"). Claude advised scope labels on new pages where a real scope ID exists, and numbered pages only for large modules. Dean replied: "I am happy for you to proceed however you believe is the most professional approach."

This record keeps the decision, what was found, why the file stays whole for now, and the conditions for splitting it later.

## Context

What the audit found on 14 October 2026:
- **Order:** the file held 31 pages in the order they were created, not grouped by department.
- **Cover:** the Start here page still said "nothing here is reviewed or accepted yet" and described four pages.
- **Inconsistent page shape:** most designs had one Figma page and CPQ had six.
- **Names are evidence:** at least 33 repository files quote Figma page names: 17 decision records and 16 retained capture READMEs. The design register and the build records also quote node IDs, for example "pages 464:2–464:7" for CPQ. The retained READMEs must not be rewritten.
- **Code is built from the file:** CPQ, My Work, Fertigation, Screen Configurator and Projects have been built from these pages, using their node IDs.
- **Other sessions:** Deals and Customer 360 were being drawn by other sessions during the audit. Their open draft pull requests, #473 and #474, quote the names "Deals (proposal)" and "Customer 360 (proposal)" and node IDs on those pages.

## Options

| Option | For | Against |
|---|---|---|
| A. Leave the file as it is | No work, no risk to citations | Page list is unordered, the cover is wrong and new pages have no standard shape |
| B. Restructure inside the one file | Gives department grouping, a correct cover, an index and a template. No node ID or page name changes, so no citation breaks | The file stays large, and a named version still covers the whole file |
| C. Split now into a library file and department files | Smaller files, a named version that covers one department, a published library with controlled updates | Node IDs belong to one file. Moving a page gives its frames new IDs, which would break the IDs quoted in the records above. The tools Claude uses work inside one file and cannot move pages or components to another, so a move means doing it by hand in Figma, or rebuilding. A rebuilt shared library would compete with the existing one |
| D. Option B now, with a split only when a trigger occurs | Takes the benefit now and avoids the break | The single file's limits remain until a trigger occurs |

## Decision

Option D.

1. **One working file.** "PPO - Design" remains the home of every page design. No second file is created now.
2. **Department groups.** Pages sit in the order of the application's rail, between divider pages named "— System —", "— My Work —", "— Sales —", "— Estimating & quotation —", "— Engineering —", "— Projects —" and "— Service operations —". "— Evidence —" holds the icon-free captures page, and "— Archive —" holds superseded pages. Within a group, pages follow the rail order in `src/shell/navigation.ts`. A new page goes in its department group and not at the end of the file.
3. **Names.**
   - Existing page names do not change, because the records and open pull requests above quote them. The node ID is the stable reference.
   - New pages are named "[Page name] · [scope ID]", for example "Quotations · ES-05", with no status in the name. Status lives in the decision record and the file index, so a page's name never changes at acceptance.
   - Use a real scope ID. A page with none, such as a proposed extension like CPQ, is named without one, and an ID is never invented. A scope ID is not unique to a page (the Wizard and Fertigation are both ES-02), so the node ID and the route stay the identifiers, and the label is for scanning and traceability.
4. **Template.** The page "Template · App page" is the starting point for a new app page. Its header holds the fields of the UI conformance declaration, so a decision record can be written straight from it. Below the header are sections for Desktop 1440, Tablet 1024, Phone 390 and 320, States, and Flows and notes. Existing pages keep their layout.
5. **File index.** The Start here page carries a File index: every page with its node ID, route or scope, design status and decision record. It reports design status only. Build, review and deployment status stay in `docs/STATUS.md` and the design register.
6. **Lock-in step.** Rule 3 of ADR-0053 gains one step: when a design is accepted and its named version is saved, add or update its row in the File index. A page that has no decision record yet is listed with the record shown as pending, and never as accepted.
7. **Divider and template pages hold no design.** No record cites a frame on them.
8. **Pages other sessions are drawing.** Under ADR-0053 rule 8, a session that is drawing a page keeps it. Restructuring reorders such a page and leaves its name and frames alone.
9. **Page shape.** One Figma page holds one app page, drawn in the template's sections. A module may use numbered pages ("[Module] · 1 Read me, sources & decisions", "[Module] · 2 …") only when it has about 30 or more frames, or two or more journeys that share no frames. A module's own components do not justify a split, and stay on its page. Figma prototype links work only inside one page, so each journey stays on one page. The first numbered page holds the decisions, open questions and handover table, and every numbered page has its own File index row. CPQ, with about 55 frames and four journeys, is the model. Existing modules are not split, because records cite their page IDs.

## Deferred: splitting the file

A library file plus department files is the usual shape for a large product, and it remains the direction if a trigger occurs. It is not done now, for the reasons under option C. Any of these triggers a review of this ADR:
- a second designer or reviewer who needs access without the Pro artwork in the file (ADR-0050);
- file size or load time that slows the work;
- a decision to publish the components as a team library, and what the current plan allows;
- a new module whose design has not yet been cited anywhere.

If a trigger occurs:
- Amend this ADR first.
- Start with new designs, whose node IDs are not yet cited. Do not move accepted pages, whose IDs are evidence.
- Rehearse any component move on a duplicate file, because instances in the existing pages are linked to the existing components.
- The split is done by hand in Figma, or by rebuilding, since Claude's connector works inside one file.

## What changed on 14 October 2026

- **Pages:** nine divider pages and the Template page were added, and all 31 existing pages were reordered into the groups above. No page was renamed. No frame on any existing page except Start here was touched.
- **Start here:** the File index was added, and the guide and foundations frames were moved right by 1,300 px with their content unchanged. The guide's introduction and its list of contents were corrected, because they were out of date.
- **File index rows:** Deals and Customer 360 are listed as proposals with their pending records (draft pull requests #473 and #474).
- **Library source line:** re-checked against `main` and rewritten. See Consequences.
- **Repository:** this ADR, and corrections to the CPQ decision record, which still said no CPQ page was built after the pages had been built on 13 October.

## Consequences

- No application code, dependency, route, permission, capability or parent requirement ID changes. All 78 parent IDs remain.
- Earlier records stay accurate. Their page names and node IDs still resolve.
- The File index is a copy of facts held in the repository, so it can go stale. It carries the date and the `main` commit it was checked against, and rule 6 keeps it current at each lock-in.
- The Start here guide's library source line was re-checked on 14 October 2026 against `main` at `65141dc` (ADR-0053 rule 5). The 33 colour variables that have a CSS variable match, and the differences are listed in the [library check](../testing/evidence/figma-library-check/README.md). No variable, style or component was changed.
- Named versions still cover the whole file until a split.

## Verification

- The page order was read back after the change. It holds 41 pages: the 31 original, nine dividers and the template. Every original page ID and name was unchanged.
- The File index and the template header were inspected at full size in Figma. The index has one row for each of the 32 design pages, which is every page except the nine dividers.
