---
document_id: PPO-PRODUCTS-REFINED-FIGMA-PROP
date: 2026-11-12
owner: Dean Fiedler
status: Proposal in progress, 12 November 2026 (the sheets are being drawn; sections 3, 7 and 10 are completed when they are); drawn in a new private Figma file; not an implementation baseline; no application code, route, read model, migration, permission, capability, grant, seed, integration or deployment; every product, supplier, price, file and person shown is synthetic
source_commit: 1892f7a92784b811bd36f0ef289816cfcfd31d4c
versioning: git
---

# Products module refined UI pages — proposal

**Owner:** Dean Fiedler · **Date:** 12 November 2026 · **Status:** Proposal in progress, awaiting completion and then Dean's acceptance. Sections 1 to 9 are the proposal record; section 10 holds the audit and section 11 the named version, which is Dean's to save.

On 12 November 2026 Dean supplied the prompt "Design the Products module pages for Powerplants One in Figma" with Addendum A3 (persona and story reconciliation, section A3.13 for Products) and a new, empty Figma file: "Below is the link to the new Figma page file that I have created for this." The prompt carries his standing instruction: "If you need any decisions from me, just proceed however you believe is the most professional and advanced approach."

This record is a **proposal**. It describes what is drawn, the rules applied, the assumptions made and the places where the native build differs from the accepted designs. It changes no code, test, migration, seed, permission or route. Products has five owner-accepted page designs (15 October to 1 November 2026) that the code has not reached: the built pages are still the native composition of 7 October 2026 ([ADR-0048](ADR-0048-products-native-catalogue.md)). The file therefore redraws the accepted designs inside the refined shell as the target, and marks every sheet where the build or its data contract differs with a **Build difference** card. Section 6 is the union of those cards, ordered for a later build step. It is a list of design findings, not authorised work.

Four statements stay separate. **Code delivery:** the native catalogue was built on 7 October 2026 and nothing here changes it. **Design acceptance:** Dean's, and not given by this record. **Production readiness:** not inferred. **Integration:** no MYOB item mapping, supplier feed, SharePoint image rendition or price-book service exists or is authorised; every product, supplier, price and file in the file is a synthetic placeholder.

## 1. Sources

| Source | Use |
|---|---|
| Private Figma file "PPO - Shell (accepted)", named version "Shell refined concept — accepted · record header toolbar" (10 November 2026) | Chrome and geometry: 48 px top bar, 80 px collapsed rail, 48 px right strip, content from x 80 to 1392, the 280 px docked Sales menu, the collapsed menu strip, the record header toolbar and its phone form (R116 to R125), the "PPO colour" variables. Read on 12 November 2026 (see A21) |
| Private Figma file "PPO - Sales module (accepted)", page "Shell and kit" | The local copies of the shell components, the Sales kit (status chip, button, avatar, checkbox, filter chip, tab, KPI tile), the icon set, the tablet and phone chrome and the build-time helper library, copied under the same names so the files converge on one library |
| The five accepted Products designs in the frozen "PPO - Design" file, read from their decision records and retained captures: [Products](products-figma-design.md) (PD-01, with Amendment A1), [Product publication](product-publication-figma-design.md) (PD-02), [Product pricing](product-pricing-figma-design.md) (PD-03), [Product compatibility](product-compatibility-figma-design.md) (PD-04), [Catalogue import](catalogue-import-figma-design.md) (PD-05) | Page content, decisions and vocabulary. The frozen file itself was not opened: its reads time out, and the standard prefers the retained captures |
| Retained captures under `docs/reference/ui/products/` (`products-figma-r02`, `product-publication-design-r01`, `product-pricing-design-r01`, `product-compatibility-design-r01`, `catalogue-import-design-r01`) | The accepted layouts and wording, redrawn in the refined shell |
| [Shell refined concept design](shell-refined-concept-design.md) and its [rules](../design/development/systems/shell-refined-concept-rules.md) | C5, R11, R13, R66, R67, R98, R108 to R110, R112, R116 to R125, Q21, Q22 |
| [Readable reference namespaces](readable-reference-namespaces.md) (the prompt's Addendum A2) | The short reference form `SYN-<TYPE>-<NUMBER>` |
| Addendum A3, section A3.13 (supplied with the prompt, not a repository file) | The one catalogue every module file reads: people, references, the DP-25 day, pricing, relationships, imports |
| [ADR-0048](ADR-0048-products-native-catalogue.md), [Products catalogue contract](../contracts/products-catalogue.md), `db/migrations/0052-products-catalogue.sql`, `src/products/`, `src/app/(business)/products/`, `src/shell/navigation.ts`, `db/seed-products.sql` | The build as it stands, for the Build difference cards and section 6 |
| [CPQ published products](cpq-published-products.md), [Inventory design](inventory-figma-design.md), [ADR-0057](ADR-0057-product-image-renditions.md) and [Product image references](product-image-references.md) (both proposals), [Products discovery proposal](products-discovery-proposal.md) | Neighbouring decisions the sheets hand to or wait on |
| [PPO-STD-001](../standards/naming-conventions.md), [conformance standard](../standards/html-module-conformance.md), [design-to-build standard](../standards/design-to-build-standard.md), [named-version handoff](figma-named-version-build-handoff.md), [Sales module record](sales-module-refined-ui-proposal.md) | Naming, the nine conformance fields, file and page conventions, and the record this one mirrors |

The new file's link and key are not recorded in this public repository (ADR-0050, ADR-0053). Node IDs are recorded so each sheet can be opened from the file. The file is named "PPO - Products module" as Dean created it; the design-to-build standard names "PPO - Sales & Products" as the domain file for Products (A1).

## 2. Conformance declaration

### 2.1 The module

| Field | Declaration |
|---|---|
| Scope identity | Products: `scope:PD-01` Catalogue and product technical workspace (`/products`, `/products/[id]`), `scope:PD-02` Catalogue authoring and publication (`/products/publication`), `scope:PD-03` Product supplier-source context (`/products/pricing`), `scope:PD-04` Compatibility, replacements and lifecycle (`/products/compatibility`), `scope:PD-05` Catalogue import and exception review (`/products/import`). Parents CRM-08, DOC-01, DOC-02, ENG-02 to ENG-06, EST-02 to EST-08, NFR-05, SCM-02, SCM-03, SCM-08 and interfaces IF-02, IF-06, IF-10, IF-12, IF-14. No parent requirement ID is added or renamed; all 78 remain |
| Page types (r20) | Register / worklist (catalogue, publication queue, pricing worklist, relationship register, import history); Record detail (product revision, relationship, import batch); Form / guided workflow (authoring form, stage a file, map rows, panels and dialogs); Review / comparison (comparison, review of a frozen submission, compare revisions, plan review); Document & evidence workspace (replacement chain); state boards |
| Reused components | Local copies of the accepted shell (top bar, collapsed rail, right strip, docked Sales menu, collapsed menu strip, record header toolbar and its phone form), the Sales kit, 101 icon components and the logo, the tablet and phone chrome, and the 67 "PPO colour" variables. Derived here: the docked Sales menu with Products current and its views nested (five variants), and the rail with More or Settings current. New here, as one Products parts family: Thumbnail, Image, Unit check, Action cell, Build difference item, Chain step, Chain link |
| Source authority | Dean's five acceptances and Amendment A1; the accepted shell; the prompt of 12 November 2026 with Addendum A3.13; the build as read at the source commit. The fixture is synthetic: as at Thu 5 Nov 2026, 09:00 AEDT, Powerplants AU, signed in as Sam Jordan unless a sheet says otherwise; later events are labelled later frames |
| Incoming handover | The Sales rail and docked menu, More › Shared records, global search, and links from an estimate line, a material line, an asset or an inventory item to an exact product revision. Arriving creates no record |
| Outgoing handover | Bindings and "review this source" follow-ups to Estimating (ES-03); published Variants by identity, revision and hash to CPQ; "see Inventory" to Supply (SC-05); relationship evidence cards to Engineering (EN-06, EN-07) and Equipment (EQ-07); drafts from an applied import to Publication; follow-ups and reviews to My Work. Each sends evidence only; the receiving page decides |
| Exceptions and recovery | Loading, true-empty, filtered-empty, could not load, denied or not found, view only, restricted supplier pricing, version conflict, source changed, the read limit, SharePoint, Inventory or ES-03 unavailable, offline on the phone, permission changed while open and outcome unknown are drawn on the state boards of each scope page |
| Departures | Section 5 |
| Verification | Section 7 |

### 2.2 Per scope

| Scope and route | Page types | Owns | Incoming handover | Outgoing handover |
|---|---|---|---|---|
| PD-01 · `/products`, `/products/[id]` | Register / worklist; Record detail | What an item is: families, models, variants and their exact revisions, documents and image. Approves no installation (PD-01 R1; PD-02 D8) | Sales menu, Shared records, links from estimates, materials, assets and inventory | Availability "see Inventory" (never a quantity); New draft revision to PD-02; Compare to PD-04 |
| PD-02 · `/products/publication` | Register / worklist; Form; Review / comparison | Drafting, submission, independent review, single publication and withdrawal. Every save is an immutable revision; saved work keeps its exact links (PD-02 D2, D7; the CPQ decision). Review is independent and publication single (PD-02 D4; the database) | Drafts from the catalogue and from an applied import | Published revisions to every reader; follow-ups and reviews to My Work |
| PD-03 · `/products/pricing` | Review / comparison; Register / worklist | Bindings of exact product revisions to exact cost-source revisions. Units and money show as recorded with no totals (PD-03 D5, D9, D15) | Cost-source revisions read from ES-03 | Follow-ups to Estimating; "Cost unknown" to CPQ where a price is missing. Estimating owns cost sources, estimates and quotations |
| PD-04 · `/products/compatibility` | Register / worklist; Record detail; Review / comparison; Document & evidence workspace | Relationship evidence between exact revisions, and lifecycle. Relationships are evidence handed to Engineering and Equipment, which decide (PD-04 D11, D12) | Uses read from assets and material lines | Evidence cards to EN-06, EN-07 and EQ-07 |
| PD-05 · `/products/import` | Register / worklist; Form / guided workflow; Review / comparison | Staged files, mapping plans, their review and application. Imports create drafts only (PD-05) | A supplier's JSON file | Drafts to Publication |

Ownership outside Products: Estimating owns cost sources, estimates and quotations; Supply and MYOB own stock and purchasing; Engineering owns releases and changes; Equipment owns installed units and aftercare; SharePoint owns images and documents; Settings owns MYOB mappings and data quality.

## 3. Sheet inventory

The sheets are being drawn. This section lists every sheet with its node ID when the build is complete.

## 4. Rules applied

- **The shell is the source of truth for chrome.** Shell parts are instances of local copies of the accepted components, never redrawn. Products has no rail item: it is the Sales workspace's REGISTERS page, with its views nested under it in the docked Sales menu while it is current (R108), and it shows no menu counts (PD-01 R4; shell Q22 allows worklist counts only and no Products read returns one).
- **Products records what an item is; nothing here approves its use** (PD-01 R1; PD-02 D8). Every record carries the facts strip "Catalogue evidence, not installation approval"; the Availability line reads "Observed [time] · [location] · see Inventory" and never a quantity (PD-01 P1).
- **Exact revisions everywhere** (PD-02 D2, D7): "catalogue r04 · technical T3", the chip "r04 · T3" beside every reference; reviewed and published content is never edited; "Newer revision exists" is a notice, never a swap.
- **Independence and single acts** (PD-02 D4; PD-04 Q2; PD-05 Q2): the author is never the reviewer and there is no assignment; Submit freezes; Publish happens once; a relationship's author never reviews it; an import's stager never reviews its plan. Three permission states always read differently.
- **Units and money as recorded** (PD-01 Q3; PD-03 D5, D9, D15; PD-05 D8): never converted; Mapped needs exactly equal units; no total across sources or estimates; FX shown as recorded.
- **Bounded reads** (PD-01 R4): "N shown · limit 100 · read live at 09:00 AEDT · no total is claimed"; Unknown is never 0; a failed read never becomes an empty register.
- **Vocabulary as PD-04 accepted it**: lifecycle Current, Last-time buy, Discontinued, Unknown; relationships Compatible with, Replaces, Replaced by, Alternative to, Requires accessory; criteria Met, Unresolved, Not met; conclusions Not reviewed, Conditional, Unresolved, Rejected and the derived Needs reassessment. Validity as at a date: Known, Unknown, Expired, Not yet effective, never "expiring soon" (PD-03 D4).
- **Register standard** (Sales file): one line per cell with an ellipsis, sideways scroll, a frozen first column, no second search box, no inline edit. **Record standard** (R116 to R125): breadcrumb, title with state chip and star, one sub-line, previous and next "n of N in view", Actions, Outputs where the record has outputs, and one state-driven primary; a person the rule excludes sees it disabled with the reason in words.
- **Page template** (Sales file): pages `Read me`, `— Accepted —`, `— Proposals —`, the seven scope pages, `Shell and kit`, `Scratch`; each scope page has the sections Desktop 1440, Dialogs and panels, States, Tablet 1024, Phone 390 and 320, Flows and notes; every sheet has a one-line label reading `CODE · Page — state (scope ID) [signed in as …]`.
- **One tone per chip meaning**, words never colour alone; dates as "Thu 5 Nov 2026"; amounts in AUD excluding GST as the source states them; Australian English; names or they/them for people.

## 5. Assumptions and proposed departures

| ID | Assumption or departure | Recommendation |
|---|---|---|
| A1 | The file is named "PPO - Products module" as Dean created it. The design-to-build standard names "PPO - Sales & Products" as the domain file for Products | Dean's to decide; nothing is renamed |
| A2 | Products is drawn as the Sales workspace's REGISTERS page with its views (Catalogue with Published, Draft and Lifecycle unknown; Publication; Pricing; Compatibility; Import) nested in the docked Sales menu (R108), replacing the accepted pages' expanded Sales rail and Products side menu, and PD-04's menu counts and rail collapse (its D5). The Shell draws no Products docked sheet, so the file derives a local component set with five variants; the menu body scrolls when the nested rows overflow (R109) | Keep; add the sheet to the Shell at its next version |
| A3 | Two more local rails are derived from the accepted collapsed rail: More current (a sheet opened from More › Shared records) and Settings current (the administration sheets) | Keep |
| A4 | The accepted collapsed menu strip is 12 px wide (its component set's frame is 80 px), so a register with the menu collapsed has 1,300 px of content, not the 1,232 px the prompt states | Keep the component's width |
| A5 | Panels are 432 px and sit flush beside the 48 px right strip, 480 px in all: the Shell's drawer (R98, R67) and the Library's `drawer/standard` of 11 November 2026. The Library's 640 px width for two-column forms is not used | Keep |
| A6 | The catalogue is a bounded read with no totals, pagers or view counts. The Sales file's PR01 and TB08 (412 and 248 products, view-tile counts, a pager, `SYN-PRD-F-` references) are earlier fixtures | The Sales file aligns in a polish batch |
| A7 | PD-04's lifecycle and relationship words are used on every Products page. The build stores Supported and Retired, Compatibility and CandidateReplacement, NotMet and Unknown | Contract change, section 6 |
| A8 | Dosing pump DP-25 is a Model with its first Variant `SYN-PROD-000013` (PD-02's reading), over PD-01's and PD-04's Variant at r01 and PD-03's Variant at r03 | Keep |
| A9 | References read `SYN-PROD-000nnn` with the model code as an alias, and relationships `SYN-PRL-000nnn` because `SYN-REL-` is the Settings releases family. Neither type code is in PPO-STD-001 section 10.2 and the database allocates neither | Contract change, section 6 |
| A10 | The typed L/h flow unit (PD-04 Q6) is drawn as accepted though unbuilt. DP-25 r03 records 0.42 L/min and r04 records 25 L/h; both show as recorded and nothing is converted | Contract change, section 6 |
| A11 | The product image (Amendment A1) is drawn as accepted, as a neutral placeholder of the exact sizes with the image revision in its caption. ADR-0057 and the image-reference decision are still proposals and the revision has no image field | Contract change, section 6 |
| A12 | The author publishes after an independent review (PD-02 Q3), as Sam Jordan and Alex Lee do here. Seed 52 gives publish to a separate duty; a separate publisher for every family is drawn as an option on AD04 | Keep; the grant difference is Dean's |
| A13 | People are Figma personas. Seed 52 holds four unnamed duty users (reader, author, reviewer, publisher) and no products; Priya Nair, an estimator, holds the author duty in the story, binds cost sources (PD-03 Q1) and stages and applies imports | Keep |
| A14 | Addendum A3.13 governs where an accepted page used another value: Alex Nguyen, Priya Shah, Jordan Hale and Morgan Lee as product people; the aliases `SYN-PROD-CP40` and `SYN-PRD-DP25`; `SYN-REL-` relationships; the estimates `SYN-EST-0144` and `SYN-EST-0142`; CP-40's "4 EA available, 2 EA reserved"; "Synthetic Company A"; Supported and Retired. All are earlier fixtures | Keep |
| A15 | The story runs in Melbourne time (AEDT) on Thu 5 Nov 2026, in place of the accepted pages' 9 to 24 October stories in Brisbane time | Keep |
| A16 | CA03, the DP-25 record, is a later frame at 09:50 so that it shows r04 · T3 Published with the primary New draft revision and the attributes scenario S-03 lists; at 09:00 the same record shows r04 Submitted with the primary disabled for its author (CA04) | Keep |
| A17 | The ClimaLogic CX4 source's FX date reads Tue 3 Nov 2026. The prompt and Addendum A3.13 write "Mon 3 Nov", which is not a date in 2026 | Estimating confirms the date in its own record |
| A18 | Each scope page's states are drawn as boards of state tiles inside the shell. ST01 is drawn as three sheets (chips and parts; the register standard; buttons, keyboard and contrast) | Keep |
| A19 | The Build difference card sits at the bottom of the sheet's content, or below the dialog on a sheet with a scrim. Sheets grow to fit their content, so many are taller than 900 px | Keep |
| A20 | The shell copies were made from the Sales file's local copies and from the Shell file as they stood on 12 November 2026. The record header's primary uses `action/primary`, a variable the Shell added on 12 November 2026, after the named version of 10 November 2026; version history cannot be read with the tools used | Dean confirms which named version pins it |
| A21 | The kit components keep their "Sales / …" names so the module files converge on one library. Table rows, group bands and phone rows are drawn with the shared register measurements, as in the Sales file, not as components | Move to PPO - Library when it is adopted |
| A22 | The administration sheets are proposals for where Products rules would be shown. They use the Settings rail and omit the right strip (R13) | Dean decides who administers Products settings |
| A23 | A record's position reads "n of N in view" (R120) where N is the number shown, because the catalogue read is bounded | Keep |
| A24 | The design register, the five Products scope pages and `ui-baselines.json` still carry pre-design text ("Registers use readable cards", "No new modal/drawer", bindings to the r04 HTML, `scope:PD-01` with no images). They are recorded here and not edited | Correct in their own change |

Assumptions made on individual pages are listed in section 3 with the page they belong to.

## 6. Build differences

Design findings for a separate build step, never work this record authorises. Each needs its own go-ahead and pull request. Three facts shape every contract change: stored revisions are re-validated on every read, so an enum change must keep reading the old values; revision content keys are strict, so a new field changes the content schema and its hash, which CPQ also checks; and the vocabularies live in revision content, not in SQL enums, so most word changes need no migration. UI-only items come first.

### 6.1 UI changes (no schema, enum, API or rule change)

| # | Scope | Accepted | Built | Code area |
|---|---|---|---|---|
| 1 | PD-01 to PD-05 | The refined shell: docked Sales menu with nested views, record header toolbar, no eyebrow or tab links | `ProductsFrame`: eyebrow "Shared catalogue · Synthetic data", tab links, an "Authority and source limits" aside | `src/products/components/shared.tsx`; shell build |
| 2 | PD-01 | A flat grid with the docked snapshot; quick views Published, Draft, Lifecycle unknown (P2, P3) | A page menu of workspace links and three filter selects; six columns; Revision reads "r4" only | `catalogue-register.tsx` |
| 3 | PD-01 | "N shown · limit 100 · read live at … · no total is claimed" | "N shown · maximum 100"; no read time | `catalogue-register.tsx` |
| 4 | PD-01 | Record tabs Technical, Documents, Revisions, Pricing, Compatibility, Used in; revision chip; "Newer revision exists"; a specification table | One page of panels and links titled "Product technical workspace"; cards per attribute | `catalogue.tsx`, `shared.tsx` |
| 5 | PD-02 | A publication queue grouped by state; a full-length authoring form | A product select, then that product's detail; an inline editor | `publication.tsx` |
| 6 | PD-02 | Comparison words Changed, Evidence only, Added, per attribute and document (D3) | Before and After printed as JSON, one change per top-level key | `model.ts` `compareContent`, `shared.tsx` |
| 7 | PD-02 | Publish and Withdraw as centred dialogs; "Not an automatic schedule"; what is superseded (D5, D6) | Inline panels; the four publish fields exist in the database and API | `publication.tsx` |
| 8 | PD-02 | A reviewer who is the author sees the control disabled with the reason; three permission wordings; "Publication not confirmed: check status" (D4, D11, D12) | Review actions hidden for the author; one read-only sentence; "Outcome unknown" | `publication.tsx`, `shared.tsx` |
| 9 | PD-03 | A bindings grid, a revision switcher, a History tab, phone read only (D2, D3, D11) | One card per binding; the revision from the URL; history returned but not shown | `pricing.tsx` |
| 10 | PD-03 | Validity words Known, Unknown, Expired, Not yet effective (D4) | "Within stated dates", "Unknown validity end", "Assessment date needed" | `pricing.tsx` |
| 11 | PD-03 | Mapped disabled when units differ, with the Unit check part; "Supplier pricing is restricted" (D5, D8) | The form still offers Mapped and the command refuses it; "Commercial evidence unavailable under current permissions…" | `pricing.tsx` |
| 12 | PD-03 | FX shown as recorded; validity timeline; follow-up links (D15, F2, F5) | Currency and tax basis only, although ES-03 holds the reviewed FX | `pricing.tsx` |
| 13 | PD-04 | A relationship register grouped by conclusion; "Not reviewed"; a review side form with Conditional disabled and "Reviewer is the author" (D3, D9) | A card per relationship; "Unreviewed"; three forms shown whenever review is allowed; no reason for the author | `compatibility.tsx` |
| 14 | PD-04 | Compare two to four revisions with "Not comparable"; three handover cards; "Uses known to you" (D7, D11, D12) | A per-relationship Original and Candidate disclosure; four links; "Exact downstream-use references" | `compatibility.tsx`, `uses.tsx` |
| 15 | PD-05 | The four-step bar; grouped history; the Action cell "Choose" with no default; a row detail panel; exception filters; rows, bytes and SHA-256 shown before storing; an apply confirmation listing every Draft; "Mapping is a desktop task" | Seven numbered headings; a flat history list; a missing decision is seeded as Resolve; inline row panels; the hash shown after staging | `import.tsx` |

### 6.2 Contract changes

| # | Scope | Accepted | Built | Needs |
|---|---|---|---|---|
| 16 | PD-01, PD-04 | Lifecycle Current, Last-time buy, Discontinued, Unknown (PD-04 D4, Q5) | Unknown, Supported, Discontinued, Retired | `model.ts` content rule and `reads.ts` filter; keep reading the built words; no migration |
| 17 | PD-01, PD-02 | L/h as a second typed flow unit, never converted (PD-04 Q6) | One unit per attribute key: flow in L/min only | `model.ts` attribute map; no migration |
| 18 | PD-04 | Five relationship words; criteria Unresolved and Not met (D2, D3) | CandidateReplacement and Compatibility; NotMet and Unknown | `model.ts` relationship content; existing rows keep their words; no migration |
| 19 | PD-05 | Duplicate matching that ignores case, spaces and hyphens (D9, X3) | Whole title or model equal after lower-casing | `imports.ts` `planRows`; no migration |
| 20 | PD-03 | Mapped needs a Reviewed source revision (Q9) | Not enforced | A rule in the bind command; no migration |
| 21 | PD-02 | Required attributes named by the Family; Submit refused only for an Unresolved required one (Q2) | No notion of required attributes | Family content schema and the Submit rule |
| 22 | PD-03 | A pricing worklist across products; binding counts per revision; quantity and amount on affected-estimate rows; a read-only price check (D1, D7, F1) | No worklist read; no counts; rows without quantity or amount | New reads, some in ES-03, which Estimating owns |
| 23 | PD-04 | Needs reassessment derived when either revision changes; a relationship record with its own route (D10) | Not computed for relationships; no read by id | A read extension and a route |
| 24 | PD-01 | Sort by Updated; the read time in the footer | Order by title only; no read time | `listProducts` query keys |
| 25 | PD-03 | An owner on a binding, required for Unresolved (Q8) | Columns status, evidence, created by, created at | **Migration** on `ppo.product_cost_source_bindings` |
| 26 | PD-05 | Submit for review as its own step (In review) and Abandoned (Q3, Q4) | States Staged, Mapped, Reviewed, Returned, Applied; any Mapped plan can be reviewed; no abandon | **Migration** on import states, events, guard, graph and the content-hash constraint |
| 27 | PD-01, PD-04 | Allocated references `SYN-PROD-000nnn` and `SYN-PRL-000nnn` | A typed alias; relationships and imports have no readable reference | **Migration** on the reference counters and identity triggers; PPO-STD-001 section 10.2 lists neither code |
| 28 | PD-01, PD-02 | One image per revision as a SharePoint reference (A1) | No image field | Content schema or **migration**, a scoped SharePoint read; blocked on two proposals |
| 29 | PD-01 | The Availability line | "Supply evidence: Not configured" | A product-to-inventory-item mapping and a scoped read; **migration** likely |
| 30 | PD-01 | The Delivery profiles tab (22 October extension) | No table or field | **Migration** and its own decision |
| 31 | PD-04 | Recorded handovers to EN-06, EN-07 and EQ-07; starter criteria by product category (D12, Q3) | Four links per card; one default criterion; no product category | A command and table, or a category field, if either is to be stored |
| 32 | PD-05, PD-02 | Stored apply confirmations; a same-content check before staging; notifications to owners of saved items | The check runs inside the stage command; no notifications | Event payload; a pre-stage read; a later increment |

Navigation also differs: `src/shell/navigation.ts` lists Products eleventh on the Sales rail and in the Shared records group, labels `/products/import` "Product import", and gives Publication, Pricing and Compatibility no destination of their own. No grant is changed by a design record: in seed 52 only the publisher duty holds `products.publish`, and no hosted user holds any Products capability.

## 7. Verification

Completed with the build.

## 8. Not drawn and open questions

- **Proposals this design waits on:** [ADR-0057](ADR-0057-product-image-renditions.md) (image renditions) and [Product image references](product-image-references.md) are proposals; the identifier allocator for `SYN-PROD-` and `SYN-PRL-`; Inventory Q1 and MYOB item mapping (Mappings AD-05 owns it).
- **Questions the accepted designs left open:** PD-02 Q2 (required attributes, a new tested rule) and Q4 (notifications); PD-03 Q8 to Q10 (owner field, Mapped needs a Reviewed source, new reads) and Q12 (price check F3 and worklist F4); PD-04 Q3 (starter criteria per product kind) and Q6 (L/h); PD-05 Q3 (Submit as its own step) and Q4 (Abandoned).
- **Open decisions in BP-01 that bear on Products:** D-002 (functional ownership and delegated approvals), D-005 and D-006 (MYOB versions and endpoints), D-008 (CAD products and formats), D-009 (costing formulas), D-010 (pricing authority policies), D-012 (SharePoint locations and retention), D-019 (QHSE and customer operating controls), D-021 (availability, recovery and accessibility targets), D-024 (branding, templates and issue policy).
- **Not drawn:** dark mode; cost sources, estimates, CPQ lines and quotations (Estimating); Inventory, purchasing and receiving (Supply); materials, substitutions and change review (Engineering); equipment, bulletins and lifecycle (Customers, sites and equipment); mappings and data quality (Settings). Each is referenced by name where a Products page hands to it.
- **Not proposed, and recorded so:** automatic publication; unit or currency conversion; totals across sources or estimates; merging similar records; repricing saved work.

## 9. Boundary and next steps

Design only: no application code, route, migration, permission or integration. The design register, the Products scope pages and the page guidance follow in their own change (A24). The Sales file's PR01 and TB08, and the product rows of the Estimating, Supply, Engineering and Customers, sites and equipment files, align where Addendum A3.13 corrected them, each in that file's own batch. A named version is Dean's to save; any design change after it needs a new one ([named-version handoff](figma-named-version-build-handoff.md), rule 5).

## 10. Audit

Completed with the build.

## 11. Named version

None yet. The file is a proposal; Dean saves the named version on acceptance and this section then records its name and date.
