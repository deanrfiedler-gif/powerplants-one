---
document_id: PPO-SHELL-TOPBAR-AMENDMENT-DEC
title: Shell top bar amendment
date: 2026-10-16
owner: Dean Fiedler
status: Owner-accepted design, locked in under ADR-0053; implemented on a branch for review; CI, owner visual review of the application and deployment separate
source_commit: 034e6ff4b79703754f9c476208dbed3dbbafdeb1
versioning: git
---

# Shell top bar amendment — owner decision

On 16 October 2026 Dean compared Powerplants One's breadcrumbs with Pipedrive's and asked for two changes to the shared top bar: a shorter breadcrumb, and a global search that stays in one place. Claude drew the proposal on its own Figma page, with nine rules, a before-and-after table covering every accepted page, and a proposed top bar. Dean adopted the recommended answers and asked for the named version to be saved, which accepted the design.

This record locks the design in under [ADR-0053](ADR-0053-figma-page-design.md) and records how the shared Figma component, the accepted pages and the application were brought into line with it.

## 1. Dean's words

Quotes 1–5 are from 16 October 2026 and quote 6 from 17 October 2026, quoted as written:

1. "Pipedrive only use the active page name in the breadcrumbs section…"
2. "Yes: draft the shorter breadcrumb as a proposed amendment to the shared Shell / Top bar and the accepted pages, for my decision"
3. "Proceed however you believe is the most professional" — recorded as adopting the recommended answers to Q1–Q4.
4. "I also what to ensure that the global search bar is always in the same position at the top of the screen very every page, which should be in the centre horizontally within the main container that it is in" — rule R9 and Q5.
5. "Yes: save named versions for the Shell top bar amendment and the Quotations amendment A1 so both are accepted."
6. Asked how R9 should treat the working-company chip beside the account, he asked "What is your professional opinion regarding how R9 should handle it?", and after Claude's recommendation answered "I am happy for you to proceed however you believe is the most professional." — recorded as adopting C1.

## 2. Decisions and evidence

| Item | Classification | Evidence |
|---|---|---|
| A shorter breadcrumb, drafted as an amendment to the shared top bar and the accepted pages | User decision | Quotes 1 and 2 |
| The global search in the same place on every page, centred in the top bar | User decision | Quote 4 |
| R1–R9 and the recommended answers to Q1–Q5 | Claude's recommendations, adopted | Quotes 3 and 4 |
| Acceptance | User decision | Quote 5; named version "Shell top bar amendment — accepted" |
| Lock-in and build | Requested of this session by the session that drew the design, and confirmed by Dean when asked about the named version ("Save it for me") | Section 6 |
| C1 The working company is named by the account control, not by a chip beside it | Claude's recommendation, adopted | Quote 6; section 5 |

### Rules R1–R9, as adopted

| Rule | Text (from the rules card) | Example |
|---|---|---|
| R1 | A top-level page shows its own name only. | Work orders · Quotations · Schedule · My Work |
| R2 | A page or record beneath something shows its owner as a link, then itself. | Work orders / SYN-PPO-WO-000041 · My Work / My actions · Estimation wizard / Excel import |
| R3 | Never more than two items. The owner is the nearest list the page belongs to; the department is never shown. | Releases / Screen systems R6, not Estimating / Rules studio / Releases / Screen systems R6 |
| R4 | A record shows its reference only; its title is already in the record header. | Deals / SYN-PPO-OPP-000326 (main showed "reference · title") |
| R5 | Filters, saved views and tabs never appear; the menu and the tabs show them. | Projects, not Projects / Project register; Rules studio, not Rules studio / All rules |
| R6 | Long names: the owner truncates first; a record reference never truncates. The full path stays in the tooltip and the Page hierarchy panel. | Specialist confi… / Screen Configurator Workbench |
| R7 | Phone is unchanged: page name only, with the header's back chevron. Tablet already uses this form on several accepted pages. | My jobs / SYN-PPO-WO-000040 (My jobs tablet `865:2756`) |
| R8 | Accessibility is unchanged: a navigation landmark named "Breadcrumb", the current item marked as the current page and not a link, separators hidden from screen readers. The browser-tab title keeps the department. | Tab: "SYN-PPO-WO-000041 · Work orders · Service" |
| R9 | The global search sits in the same place on every page: a fixed width, centred in the top bar. The breadcrumb and the actions each get an equal side zone, so nothing a page shows can move it; the breadcrumb truncates before it reaches the search. | Accepted pages measured 47 px left to 28 px right of centre; the proposal gives 0 px on every page |

### Questions, with the answers adopted

| Question | Answer |
|---|---|
| Q1 Adopt R1 to R8 for every desktop page? | Yes |
| Q2 Record crumb: the reference only, or the title? | The reference only; the title stays the record header's heading |
| Q3 Keep the Page hierarchy button that main shows when there is more than one crumb? | Keep it, so the full path stays one click away |
| Q4 Module sub-pages such as My Work / My actions and Rules studio / Fact dictionary: keep the module as the owner? | Yes |
| Q5 R9: centre the global search in the top bar on every page | Adopted on Dean's instruction; the side zones are equal width and the search keeps its 403 px |

## 3. Design reference

| Reference | Identity |
|---|---|
| Accepted design | Figma file "PPO - Design", private to Dean's Figma team, at the named version "Shell top bar amendment — accepted". The file's link is not recorded in this public repository (ADR-0050, ADR-0053) |
| Page | "Shell top bar amendment" `1035:48`, under "— System —". Header `1035:49`; File index row `1040:259262` |
| Rules and components | Rules card `1037:49`; component set Shell / Breadcrumb (proposed) `1037:103` (Top level `1037:93`, Beneath `1037:95`, Truncated `1037:99`); examples `1037:105` |
| R9 | Section `1047:1538`; component Shell / Top bar (proposed, centred search) `1046:259953` (equal Fill zones, 403 px search, padding 16/16) |
| Before and after | Table `1040:62`: 38 frames, one per accepted or proposed page |
| In context | Work orders register `1040:257189` and Work order record `1040:258559` |
| Notes | `1040:259238` (Q1–Q5, "If accepted", "Unchanged") |
| Retained captures | [Shell top bar amendment r01](../reference/ui/application-shell/shell-top-bar-amendment-r01/README.md): six icon-free PNGs with hashes |

## 4. Conformance declaration

Declared under [PPO-UI-CONFORMANCE](../standards/html-module-conformance.md).

| Field | Declaration |
|---|---|
| Scope identity | The shared application shell on every desktop route. No page, route, scope ID or parent requirement ID is added or renamed; all 78 parent IDs remain |
| Page type (r20) | Shared shell component; no page type changes |
| Reused components | Shell / Top bar (Figma `35:138`), the breadcrumb and Page hierarchy in `src/components/product-navigation.tsx`, the header controls in `src/components/shell-controls.tsx` |
| Source authority | Route metadata in `src/shell/navigation.ts` and `src/engineering/control/navigation.ts`; the record identity each page publishes (`src/shell/record-identity.tsx`) |
| Incoming handovers | None; the breadcrumb reads only route metadata and loaded, authorised record identity |
| Outgoing handovers | None |
| States shown | Top-level page, sub-page, record, long names, no access to the owner, signed out (section 7) |
| Departures | Section 5 |

## 5. What changes, and what it supersedes

### Application

- **Breadcrumb.** `src/shell/breadcrumb.ts` builds the full path (the trail) and the visible breadcrumb from route metadata. The visible breadcrumb is the page and, beneath something, its nearest owner as a link (R1–R3); a record by its reference alone (R4); never a register's default view — Projects' "Project register", the Engineering modules' registers, Acceptance's "Staged Acceptance & Closeout" (R5). The trail stays in the Page hierarchy panel and the breadcrumb's tooltip (R6, Q3). The tab title is built as before (R8, NR-17).
- **Engineering workload.** `/engineering` is named "Engineering workload", its rail and Figma name, instead of the department name "Engineering".
- **Top bar.** On desktop the header is one grid: a start zone (menu trigger and breadcrumb), the global search alone in the centre column, and an end zone (Quick add, the utilities and the account). The two side columns are equal and the side padding sits inside them, so the search's centre is the top bar's centre (R9). The search keeps `clamp(232px, 28vw, 420px)`, which is 403 px at 1440; the expanded rail narrows it to 220 px up to 1200 px. Only where the top bar is too narrow for equal columns, on the narrowest desktops or at high zoom, does the end column keep its controls' width and the search narrow (to no less than 140 px) before the breadcrumb loses its last 120 px.
- **Working company (C1).** The chip that named the working company beside the account on desktops 1200 px and wider widened the end zone by about 190 px and put the search up to 132 px left of centre. The working company is now named in the account button's tooltip and accessible description ("Working company: …"), a dot on the avatar marks that one company of several narrows every page, and the account panel keeps the full choice, as narrower screens already did. Access and filtering are unchanged.
- **Truncation.** The owner gives way first, then the current page, with an ellipsis (R6). From 781 to 1199 px the current page shows alone with the Page hierarchy button, as before.
- **Separators.** The "/" separator now carries empty alternative text, so screen readers that read generated content skip it (R8).
- **Header controls stay mounted.** The search, Quick add and utilities reset themselves when the route changes instead of being remounted, because the account mount must sit in the end zone and must never be replaced.
- **Removed:** the viewport-centred search group and its expanded-rail rule (`desktop-shell.css`), the Figma-shell rule that let the search flow with the breadcrumb and the docked-menu view-crumb rules (`figma-shell.css`), the narrow-header overrides in `cost-sources.css` and `estimating-workload.css`, the search and heading overrides in `fertigation-figma.css`, the ES-08 rule that hid the owner (`specialist-figma.css`), #268's wrap rule and the 1560 px "last two crumbs" rule.
- `src/shell/guide.ts` describes the new breadcrumb and the search's fixed place.

### Earlier records this amends

| Record | What changes |
|---|---|
| [Existing modules UI consistency](existing-modules-ui-consistency.md) | "Search and quick add are one group … centred on the whole application viewport" is replaced by R9: the search alone is centred in the top bar, Quick add opens the end zone 12 px to its right. "A docked secondary menu still takes the view crumb" is replaced by R2 and R5. #268's "shown whole or not at all" rule is replaced by R6 |
| [Figma UI implementation](figma-ui-implementation.md) | "Show the current destination, or the module while its menu is docked … The search flows between the heading and utilities" is replaced by R2, R5 and R9 |
| [Application shell integration](application-shell-integration.md) | "Quick add sits 12px to the right of the globally centred desktop search field": still 12 px to its right, but the search is centred in the top bar, not the viewport |
| EN-06, EN-07 and EN-08 header naming (A03–A05 in their build plans) | The header named the module and, while the menu was hidden, the destination. It now names the module, then any destination other than the register, whatever the menu's state |
| ES-08 workbench | The workbench showed "Screen Configurator Workbench" alone; it now shows "Specialist configurations / Screen Configurator Workbench" (R2, R6), as the table's After column does |
| NR-18 working company in the header ([navigation architecture board](navigation-architecture-board.md), AU-02) | The company was shown as a chip beside the account from 1200 px. C1 moves it into the account control; what the working company filters is unchanged |

### Known differences between the app and the After column

| ID | Difference | Why |
|---|---|---|
| D1 | Configure & price and Rules studio records show the destination alone, not "Configure & price / SYN-CPQ-000014" | The CPQ pages publish no record identity; the shell never guesses one from the URL. Publishing it is CPQ work |
| D2 | Some app labels differ from the Figma names: "Organisations" (Customers), "Intake" (Sales briefs), "Priva Fertigation Configurator" | The labels come from `src/shell/navigation.ts` and are outside this amendment |
| D3 | Excel import, Inventory, Document library, Outputs, Templates and the PJ-05 records have no app route yet | They follow these rules when built |
| D4 | From 781 to 1199 px the app shows the current page alone; the tablet frames show the owner too | Existing narrow-desktop rule, kept; Page hierarchy holds the owner |
| D5 | Breadcrumb labels are 14 px in the app (Shell v2) and 16 px in Figma; the search-to-Quick-add gap is 12 px in the app and 14 px in Figma | Existing differences, unchanged here |

## 6. Figma lock-in pass

Made by this session on 16 October 2026, after the named version was saved:

- **Shell / Top bar `35:138`** (then on page Shell `31:214`; since the 17 October consolidation on Components `1:4`, structure unchanged) restructured in place to the accepted three zones: Left zone `1064:269163` (Fill, clips; Menu toggle `35:139`, Breadcrumb `35:143`), Global search `35:148` (403 px), Right zone `1064:269164` (Fill; Quick add `35:155`, Spacer `35:159`, Actions `35:160`, Identity `35:177`); padding 16/16; the left spacer `35:147` removed. The owner text `35:144` truncates at 280 px (R6). Node IDs and component properties are unchanged, so every page's overrides were kept; an instance on CPQ Rules studio (`492:2725`) and one on the Work order record (`315:2097`) measured the search centre at 0 px.
- **Breadcrumb overrides** on the accepted pages were set by the rules: the department dropped, the owner the nearest list, the default views "All rules" and "Project register" dropped, at most two items. Of 29 pages checked, 27 changed: 232 instances, every result matching the table's After column (Fertigation and CPQ responsive states already complied). Kept as drawn: tablet frames already in the short form, and the Document library tablet's "Documents / SYN-PPO-DOC-000101", where "Documents" stands for the owner.
- **Kept unchanged:** the 270 top bars on "Captures (icon-free)" `115:2`, the six "before" bars in the R9 section and one on the archived Screens page were detached before the component changed, so the issued captures and the amendment's evidence keep today's look. The proposal pages (Deals `549:2`, Customer 360 `554:2`, ES-08 `406:2`) and the UX benchmark exemplars were not edited; they take the new layout from the component but keep their breadcrumb text until accepted.
- **Not drawn:** C1 needs no Figma change, because the accepted right zone never had the company chip; the avatar dot is an application state only. The proposed components Shell / Breadcrumb (proposed) `1037:103` and Shell / Top bar (proposed, centred search) `1046:259953` stay on the amendment page as part of the accepted proposal; `35:138` is the library component.
- **Captures** for this record: copies on "Captures (icon-free)" under the heading `1067:116649` (`1067:116650` … `1067:119519`), 247 icons swapped for `Icon/placeholder` and none left.

## 7. Verification

- Unit: `tests/unit/shell-breadcrumb.test.ts` covers R1–R6 and R8 on the app's routes, including the owner without access and a signed-out view.
- Browser and component suites that assert breadcrumb text or header geometry were updated to the new rules; the PR description lists what was run locally and what is left to CI.
- This record implies no owner visual review of the application and no UI baseline. A Figma design never becomes a production claim on its own.

## 8. Boundaries

This change authorises no business transaction, production integration, customer communication, migration, permission or capability change.
