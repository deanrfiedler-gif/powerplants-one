---
document_id: PPO-PRODUCTS-REFINED-FIGMA-PROP
date: 2026-11-12
owner: Dean Fiedler
status: Owner-accepted design, 12 November 2026 ("accept"), covering 122 sheets and 7 notes cards on 7 scope pages; refinements R1 and R2 applied after the acceptance (section 12); named version not yet saved (section 13); drawn in a new private Figma file; not an implementation baseline; no application code, route, read model, migration, permission, capability, grant, seed, integration or deployment; every product, supplier, price, file and person shown is synthetic
source_commit: 1892f7a92784b811bd36f0ef289816cfcfd31d4c
versioning: git
---

# Products module refined UI pages — proposal

**Owner:** Dean Fiedler · **Date:** 12 November 2026 · **Status:** Owner-accepted design, 12 November 2026 ([Acceptance — 12 November 2026](#11-acceptance--12-november-2026)). Sections 1 to 9 are the proposal record as written before acceptance; section 10 holds the audit, section 11 the acceptance, section 12 what was applied after it, and section 13 the named version, which is Dean's to save.

On 12 November 2026 Dean supplied the prompt "Design the Products module pages for Powerplants One in Figma" with Addendum A3 (persona and story reconciliation, section A3.13 for Products) and a new, empty Figma file: "Below is the link to the new Figma page file that I have created for this." The prompt carries his standing instruction: "If you need any decisions from me, just proceed however you believe is the most professional and advanced approach."

This record began as a **proposal**; section 11 records Dean's acceptance. It describes what is drawn, the rules applied, the assumptions made and the places where the native build differs from the accepted designs. It changes no code, test, migration, seed, permission or route. Products has five owner-accepted page designs (15 October to 1 November 2026) that the code has not reached: the built pages are still the native composition of 7 October 2026 ([ADR-0048](ADR-0048-products-native-catalogue.md)). The file therefore redraws the accepted designs inside the refined shell as the target, and marks every sheet where the build or its data contract differs with a **Build difference** card. Section 6 is the union of those cards, ordered for a later build step. It is a list of design findings, not authorised work.

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

Sheets are listed by page and section, with the frame node ID. Sizes are width × height in pixels; sheets grow past 900 px to hold their content and Build difference card. The full name of each sheet is its label in the file; the "signed in as" part is shown here as Person.

### Catalogue and product record · PD-01

Page `9:4` · `scope:PD-01`, `/products`, `/products/[id]` · 34 sheets · notes card `26:31597`.

| Code | Sheet | Person | View | Size | Node |
|---|---|---|---|---|---|
| CA01 | Catalogue — 50 shown, full length | Sam Jordan | Desktop | 1440×2915 | `14:251` |
| CA02 | Catalogue — DP-25 selected, snapshot docked | Sam Jordan | Desktop | 1440×1316 | `17:1955` |
| CA03 | Dosing pump DP-25 — Technical, r04 · T3 Published, full length · later frame 09:50 | Sam Jordan | Desktop | 1440×1861 | `14:3666` |
| CA04 | Dosing pump DP-25 — Revisions tab, r04 · T3 Submitted, full length | Sam Jordan | Desktop | 1440×1759 | `22:2863` |
| CA05 | Screen drive SM-120 — opened from asset SYN-AST-000219, read only, full length | Ravi Kumar | Desktop | 1440×1500 | `22:3469` |
| CA06 | SM-120 motor assembly — Used in tab, with an inset later frame 15:40, full length | Sam Jordan | Desktop | 1440×1432 | `22:3965` |
| CA07 | Dosing pump DP-12 — Documents tab, r04 · T3 Published, full length | Sam Jordan | Desktop | 1440×1484 | `22:4487` |
| CA08 | Circulation pump CP-60 — no image, Draft r02 · T1, full length | Sam Jordan | Desktop | 1440×1672 | `25:4300` |
| CA09 | Circulation pump CP-40 — Pricing, Compatibility and Delivery profiles tabs, full length | Sam Jordan | Desktop | 1440×2036 | `25:4834` |
| CA10 | Dosing pump DP-25 — read-only viewer, supplier pricing restricted, full length | Lee Nakamura | Desktop | 1440×1747 | `25:5436` |
| CA11 | Circulation pump CP-40 — Availability and Inventory, read only, full length | Robin Hale | Desktop | 1440×1505 | `25:6018` |
| CA14 | Products — the Sales view, bounded read | Dean Fiedler | Desktop | 1440×1096 | `25:6579` |
| CA12 | New catalogue draft — panel over the catalogue | Sam Jordan | Dialog or panel | 1440×1332 | `25:7380` |
| X01 | New draft revision — dialog on Dosing pump DP-12 | Sam Jordan | Dialog or panel | 1440×991 | `25:8412` |
| X02 | Link an image — dialog on the draft DP-25 · 25 L/h | Sam Jordan | Dialog or panel | 1440×1057 | `25:8913` |
| X03 | Add a document reference — dialog on the draft DP-25 · 25 L/h | Sam Jordan | Dialog or panel | 1440×1057 | `25:9462` |
| X04 | Set an attribute's evidence — dialog, Unresolved with its clarification owner | Sam Jordan | Dialog or panel | 1440×1079 | `25:9974` |
| X15 | Filters — panel over the catalogue | Sam Jordan | Dialog or panel | 1440×1300 | `26:19820` |
| X16 | Columns — panel, reorder, show or hide and density | Sam Jordan | Dialog or panel | 1440×1235 | `26:20817` |
| X17 | Export — dialog, permitted rows only | Sam Jordan | Dialog or panel | 1440×947 | `26:21879` |
| X18 | Saved view — dialog | Sam Jordan | Dialog or panel | 1440×952 | `26:22827` |
| X19 | Keyboard shortcuts — dialog | Sam Jordan | Dialog or panel | 1440×1108 | `26:23770` |
| CA13 | Catalogue states — full length | Sam Jordan | States | 1440×1530 | `27:10459` |
| PS01 | Catalogue page states — full length | Sam Jordan | States | 1440×1538 | `27:10833` |
| TB01 | Catalogue — 50 shown, full length, tablet 1024 | Sam Jordan | Tablet | 1024×2358 | `17:2911` |
| TB02 | Dosing pump DP-25 — Technical, r03 · T2 Published, full length, tablet 1024 | Sam Jordan | Tablet | 1024×1792 | `26:31109` |
| PH01 | Catalogue list — phone 390 | Sam Jordan | Phone | 390×911 | `17:5064` |
| PH01-320 | Catalogue list — phone 320 | Sam Jordan | Phone | 320×844 | `27:11666` |
| PH02 | Dosing pump DP-25 — record, full length, phone 390 | Sam Jordan | Phone | 390×844 | `17:5262` |
| PH02-320 | Dosing pump DP-25 — record, full length, phone 320 | Sam Jordan | Phone | 320×866 | `27:11801` |
| PH03 | Dosing pump DP-25 — Technical attributes, phone 390 | Sam Jordan | Phone | 390×844 | `27:11199` |
| PH04 | Dosing pump DP-25 — Revisions, phone 390 | Sam Jordan | Phone | 390×844 | `27:11330` |
| PH05 | SM-120 motor assembly — Used in, phone 390 | Sam Jordan | Phone | 390×844 | `27:11451` |
| PH06 | Circulation pump CP-60 — not linked to Inventory, no image, phone 390 | Sam Jordan | Phone | 390×844 | `27:11556` |

Page assumptions: CA03 is a later frame at 09:50 so its primary can be New draft revision; the record tabs span the full content width. A-CAA1 the Revisions grid on CA04 shows chip, state, author, reviewer, publisher and Open, with dates in the History list under it. A-CAA2 DP-25 r01 and r02 name Casey Quinn as reviewer and Sam Jordan as publisher. A-CAA3 New draft revision is disabled for Sam Jordan on Alex Lee's product (CA06), with the reason. A-CAA4 CA05 opens on Used in with a strip naming the asset it was opened from. A-CAA5 to A-CAA6 the DP-12 document details and CP-60's draft values are illustrative. A-CAA7 CA09's two delivery profiles (`SYN-PROFILE-014@1` Installation, `SYN-PROFILE-015@1` Commissioning) are illustrative: the delivery-profile documents give no CP-40 values. A-CAA8 the read-only viewer keeps Outputs but has no Actions or primary. A-CAA9 CA11 takes the accepted r02 capture's values. A-CAA10 the bounded-read sentence leads CA14's facts strip. A-CAA11 TB02 shows the published basis r03 at 09:00 with the notice, primary "Open r04 in review".

### Publication · PD-02

Page `9:5` · `scope:PD-02`, `/products/publication` · 21 sheets · notes card `35:7333`.

| Code | Sheet | Person | View | Size | Node |
|---|---|---|---|---|---|
| PB01 | Publication queue — 24 shown, grouped by state, full length | Sam Jordan | Desktop | 1440×2165 | `28:16365` |
| PB02 | Authoring form — DP-25 r04, successor of r03, full length · earlier frame 08:48 | Sam Jordan | Desktop | 1440×2443 | `28:17659` |
| PB03 | Comparison — DP-25 r04 against the published r03, Submitted | Sam Jordan | Desktop | 1440×1276 | `28:18393` |
| PB05 | Review a frozen submission — DP-25 r04 · later frame 09:30 | Casey Quinn | Desktop | 1440×1259 | `32:1592` |
| PB07 | Dosing pump DP-25 — r04 Published, superseding r03 · later frame 09:50 | Sam Jordan | Desktop | 1440×1124 | `32:2112` |
| PB08 | EC and pH kit ECP-2 — r01 Returned | Priya Nair | Desktop | 1440×1243 | `32:2640` |
| PB04 | Submit for review — DP-25 r04 · earlier frame 08:50 | Sam Jordan | Dialog or panel | 1440×901 | `32:3122` |
| PB06 | Publish — DP-25 r04 · later frame 09:45 | Sam Jordan | Dialog or panel | 1440×982 | `32:3587` |
| PB09 | Withdraw — CC-8 r05, what-if | Alex Lee | Dialog or panel | 1440×900 | `32:4076` |
| X05 | Return with a reason — ECP-2 r01 · earlier frame Wed 4 Nov 15:00 | Casey Quinn | Dialog or panel | 1440×900 | `32:4473` |
| X06 | Check publication status — DP-25 r04 · later frame 09:45 | Sam Jordan | Dialog or panel | 1440×900 | `32:4870` |
| PB10 | Refusals | Sam Jordan | States | 1440×909 | `35:4275` |
| PB11 | Publication not confirmed — DP-25 r04 · later frame 09:45 | Sam Jordan | States | 1440×900 | `35:4565` |
| PB12 | New product and draft successor | Sam Jordan | States | 1440×900 | `35:4945` |
| PS02 | Publication page states | Sam Jordan | States | 1440×1190 | `35:5191` |
| TB03 | Publication queue — tablet 1024, full length | Sam Jordan | Tablet | 1024×1604 | `35:5499` |
| TB04 | Review a frozen submission — tablet 1024 · later frame 09:30 | Casey Quinn | Tablet | 1024×1049 | `35:6622` |
| PH07 | Review and approve — DP-25 r04, phone 390 · later frame 09:30 | Casey Quinn | Phone | 390×844 | `35:6957` |
| PH07-320 | Review and approve — DP-25 r04, phone 320 · later frame 09:30 | Casey Quinn | Phone | 320×844 | `35:7239` |
| PH08 | Outcome sheet — Reviewed recorded, phone 390 · later frame 09:30 | Casey Quinn | Phone | 390×844 | `35:7052` |
| PH09 | Comparison — r04 against r03, phone 390 | Casey Quinn | Phone | 390×844 | `35:7135` |

Page assumptions: A-PB1 PB02 is an earlier frame at 08:48; PB05, TB04 and the phone review are later frames at 09:30; PB06, PB11 and X06 at 09:45; PB07 at 09:50. A-PB2 the author publishes after an independent review (PD-02 Q3); seed 52 gives publish to a separate duty. A-PB3 PB09 Withdraw is a what-if on CC-8 r05. A-PB4 X05 shows Casey Quinn returning ECP-2 r01 as an earlier frame, Wed 4 Nov 2026, 15:00. A-PB5 the comparison hides the 11 unchanged fields behind "Show unchanged".

### Pricing · PD-03

Page `9:6` · `scope:PD-03`, `/products/pricing` · 19 sheets · notes card `38:6132`.

| Code | Sheet | Person | View | Size | Node |
|---|---|---|---|---|---|
| PP01 | Dosing pump DP-25 r03 — pricing, full length | Priya Nair | Desktop | 1440×1539 | `21:2975` |
| PP06 | Pricing worklist — no product chosen, 3 shown | Priya Nair | Desktop | 1440×1058 | `21:3560` |
| PP09 | ClimaLogic CX4 r02 — foreign currency as recorded | Priya Nair | Desktop | 1440×1178 | `21:4116` |
| PP12 | Priva fertigation controller · 4 dosing channels r02 — pricing | Priya Nair | Desktop | 1440×1108 | `21:4626` |
| PP02 | Dosing pump DP-25 — revision switcher open · later frame 09:50 | Priya Nair | Dialog or panel | 1440×900 | `24:1701` |
| PP03 | Bind a cost source — equal units, DP-25 r04 · later frame 10:10 | Priya Nair | Dialog or panel | 1440×1095 | `24:2234` |
| PP04 | Bind a cost source — unit mismatch · earlier frame Tue 3 Nov 2026, 11:05 | Priya Nair | Dialog or panel | 1440×1127 | `24:2699` |
| PP05 | Affected estimates — DP-25 r03, estimates known to you | Priya Nair | Dialog or panel | 1440×900 | `24:3236` |
| PP08 | Dosing pump DP-25 r03 — Mapped row menu and History | Priya Nair | Dialog or panel | 1440×1004 | `26:3061` |
| PP10 | Price check and validity timeline — F1 and F2 | Priya Nair | Dialog or panel | 1440×900 | `26:3605` |
| X07 | Ask Estimating to review the source — follow-up | Priya Nair | Dialog or panel | 1440×943 | `26:4161` |
| X08 | Record an Unresolved binding — confirm · earlier frame Tue 3 Nov 2026, 11:05 | Priya Nair | Dialog or panel | 1440×921 | `26:4705` |
| PP07 | Pricing — restricted | Lee Nakamura | States | 1440×900 | `38:4437` |
| PP11 | Pricing states | Priya Nair | States | 1440×1056 | `38:4823` |
| PS03 | Pricing page states | Priya Nair | States | 1440×1019 | `38:5124` |
| TB05 | Dosing pump DP-25 r03 — pricing, tablet 1024 | Priya Nair | Tablet | 1024×1023 | `38:5421` |
| PH10 | Pricing summary — DP-25 r03, phone 390, read only | Priya Nair | Phone | 390×844 | `38:5859` |
| PH11 | Unresolved source — SYN-SRC-000025 r1, phone 390, read only | Priya Nair | Phone | 390×844 | `38:5943` |
| PH12 | Restricted pricing — phone 390 | Lee Nakamura | Phone | 390×844 | `38:6036` |

Page assumptions: A-PP1 the CX4 FX date reads Tue 3 Nov 2026 (A17). A-PP2 Priya Nair binds, satisfying the seed's author duty and PD-03 Q1. A-PP3 the worklist holds three rows: Unresolved 1, Expired 1, Unknown 1. A-PP4 the binding made at 10:10 to r04 is a labelled later frame.

### Compatibility · PD-04

Page `9:7` · `scope:PD-04`, `/products/compatibility` · 20 sheets · notes card `28:16336`.

| Code | Sheet | Person | View | Size | Node |
|---|---|---|---|---|---|
| PC01 | Compatibility — relationship register, 11 shown, full length | Alex Lee | Desktop | 1440×1371 | `23:296` |
| PC02 | Compare — DP-12 r04, DP-25 r04 and MD-20 r03 | Sam Jordan | Desktop | 1440×1281 | `23:1029` |
| PC03 | Relationship SYN-PRL-000014 — DP-25 r03 Alternative to MD-20 r03, Unresolved, full length | Sam Jordan | Desktop | 1440×2133 | `23:1539` |
| PC05 | Replacement chains — ClimaLogic CX2 → CX4 with IO4-16 | Sam Jordan | Desktop | 1440×1643 | `23:2141` |
| PC06 | Relationship SYN-PRL-000011 — FV-32 r02 Alternative to FV-20 r02, Needs reassessment | Sam Jordan | Desktop | 1440×1864 | `25:11844` |
| PC07 | Handovers from Compatibility — EN-06, EQ-07 and EN-07 cards | Sam Jordan | Desktop | 1440×1046 | `25:12407` |
| PC04 | Review with conditions — SYN-PRL-000017, Contactor 25 A Replaces Contactor 18 A · earlier frame Wed 4 Nov 2026, 11:00 | Alex Morgan | Dialog or panel | 1440×1127 | `26:27485` |
| PC08 | New relationship — panel over the register, starter criteria for valves | Sam Jordan | Dialog or panel | 1440×1270 | `26:27987` |
| PC09 | Lifecycle on a product revision — ClimaLogic CX2 r05, Last-time buy, panel | Alex Lee | Dialog or panel | 1440×1148 | `26:28797` |
| X09 | Record criteria — Flow at the duty point, for a successor of SYN-PRL-000014, dialog | Sam Jordan | Dialog or panel | 1440×977 | `26:29306` |
| X10 | Hand over to EN-06 — SYN-PRL-000017, evidence only, dialog · earlier frame Wed 4 Nov 2026, 14:00 | Alex Lee | Dialog or panel | 1440×936 | `26:29828` |
| X11 | Compare — choose two to four exact revisions, dialog | Sam Jordan | Dialog or panel | 1440×990 | `26:30317` |
| PC10 | Compatibility states — units, evidence, uses, reviewer, compare limit, Conditional | Sam Jordan | States | 1440×950 | `25:12801` |
| PC11 | A successor that is not a substitute — SYN-PRL-000007, SM-120 r02 Replaces SM-90 r03, Conditional | Alex Lee | States | 1440×1511 | `25:13104` |
| PS04 | Compatibility page states — loading, empty, failed, denied, view only, conflict, limit, outcome unknown | Sam Jordan | States | 1440×1422 | `25:13626` |
| TB06 | Compatibility — relationship register, 11 shown, full length, tablet 1024 | Alex Lee | Tablet | 1024×1205 | `28:15031` |
| TB07 | Replacement chains — ClimaLogic CX2 → CX4 with IO4-16, tablet 1024 | Sam Jordan | Tablet | 1024×1496 | `28:15727` |
| PH13 | What replaces this product — ClimaLogic CX2, full length, phone 390 | Sam Jordan | Phone | 390×979 | `28:16072` |
| PH13-320 | What replaces this product — ClimaLogic CX2, full length, phone 320 | Sam Jordan | Phone | 320×1079 | `28:16247` |
| PH14 | Relationship summary — SYN-PRL-000014, full length, phone 390 | Sam Jordan | Phone | 390×849 | `28:16162` |

Page assumptions: A-PC1 `SYN-PRL-` with the accepted numbers 000006 to 000016. A-PC2 the register opens with the 12 px collapsed strip; records, Compare, chains and handovers open with the docked menu. A-PC3 "Awaiting review" is the display word for a recorded successor before its first review. A-PC4 Needs reassessment is raised when a newer revision of either product is Reviewed; DP-25 r04 is only Submitted at 09:00, so SYN-PRL-000014 stays Unresolved with "Newer revision exists". A-PC5 Compare names each revision's state. A-PC6 DP-12 and MD-20 values, criterion values and some recording times are invented for the drawing. A-PC7 a criterion's values are recorded on the relationship with their own evidence. A-PC8 the EQ-07 handover of SYN-PRL-000007 is drawn as taken up. A-PC9 X10 is at Wed 4 Nov 2026, 14:00. A-PC10 PC06 keeps Reassess… as the owner's primary. A-PC11 PS04 adds two tiles. A-PC12 phone sheets carry no Build difference card. A-PC13 the Last-time buy nudge goes to the product owner, Alex Lee.

### Import · PD-05

Page `9:8` · `scope:PD-05`, `/products/import` · 19 sheets · notes card `39:5296`.

| Code | Sheet | Person | View | Size | Node |
|---|---|---|---|---|---|
| PI01 | Import — history, grouped, no counts | Priya Nair | Desktop | 1440×915 | `24:3792` |
| PI02 | Import — stage a file | Priya Nair | Desktop | 1440×1041 | `24:4297` |
| PI03 | Import — map rows, dosetech-2026-11-04.json, full length | Priya Nair | Desktop | 1440×1386 | `28:3277` |
| PI05 | Import — plan summary, nfs-dosing-2026-10-12.json plan 3 · earlier frame Wed 14 Oct 2026 | Priya Nair | Desktop | 1440×1281 | `24:5252` |
| PI06 | Import — review, plan 2 returned · earlier frame Tue 13 Oct 2026 | Casey Quinn | Desktop | 1440×1537 | `26:8227` |
| PI07 | Import — plan 3 submitted and reviewed · earlier frame Wed 14 Oct 2026 | Priya Nair | Desktop | 1440×1545 | `26:8695` |
| PI09 | Import — applied result, nfs-dosing-2026-10-12.json | Priya Nair | Desktop | 1440×1376 | `26:9206` |
| PI04 | Import — row detail, row 5 (panel) | Priya Nair | Dialog or panel | 1440×1215 | `28:3830` |
| PI08 | Import — apply confirmation · earlier frame Thu 15 Oct 2026, 10:08 | Priya Nair | Dialog or panel | 1440×1023 | `28:4478` |
| X12 | Import — submit a plan for review (dialog) · earlier frame Wed 14 Oct 2026 | Priya Nair | Dialog or panel | 1440×904 | `28:5018` |
| X13 | Import — review a plan (dialog) · earlier frame Wed 14 Oct 2026 | Casey Quinn | Dialog or panel | 1440×1004 | `28:5461` |
| X14 | Import — abandon an import (dialog) · earlier frame Fri 9 Oct 2026 | Priya Nair | Dialog or panel | 1440×900 | `28:5913` |
| PI10 | Import — abandoned, nfs-dosing-2026-10-09.json, read only | Priya Nair | States | 1440×937 | `26:9804` |
| PI11 | Import — exception states in plain words | Priya Nair | States | 1440×1768 | `26:10218` |
| PS05 | Import — page states | Priya Nair | States | 1440×1184 | `26:10614` |
| TB08 | Import — map rows, dosetech-2026-11-04.json, full length, tablet 1024 | Priya Nair | Tablet | 1024×1331 | `28:6302` |
| PH15 | Import summary and review — Northgate plan 3, phone 390 · earlier frame Wed 14 Oct 2026 | Casey Quinn | Phone | 390×844 | `39:5033` |
| PH15-320 | Import summary and review — Northgate plan 3, phone 320 · earlier frame Wed 14 Oct 2026 | Casey Quinn | Phone | 320×844 | `39:5214` |
| PH16 | Mapping is a desktop task — dosetech-2026-11-04.json, phone 390 | Priya Nair | Phone | 390×844 | `39:5116` |

Page assumptions: A-PI1 the Northgate sheets are earlier frames on Tue 13 to Thu 15 Oct 2026. A-PI2 "In review" is the display word for a submitted plan; the build has no such state. A-PI3 counts on a plan are numbers of rows in that plan, never totals of the catalogue.

### Interaction states · PD

Page `9:9` · app-wide states for the Products pages · 3 sheets · notes card `28:10417`.

| Code | Sheet | Person | View | Size | Node |
|---|---|---|---|---|---|
| ST01 | Interaction states — chips, words and Products parts | Sam Jordan | Desktop | 1440×3486 | `28:7580` |
| ST02 | Interaction states — the register standard | Sam Jordan | Desktop | 1440×2789 | `28:8564` |
| ST03 | Interaction states — buttons, focus, keyboard and contrast | Sam Jordan | Desktop | 1440×3181 | `28:9346` |

Page assumptions: The prompt's ST01 is drawn as ST01, ST02 and ST03 so each stays readable; the other four sections are intentionally empty.

### Administration · PD

Page `9:10` · proposed Products settings, reached from Settings · 6 sheets · notes card `28:21988`.

| Code | Sheet | Person | View | Size | Node |
|---|---|---|---|---|---|
| AD01 | Products settings hub | Dean Fiedler | Desktop | 1440×1998 | `28:19457` |
| AD02 | Kinds, attributes and evidence words | Dean Fiedler | Desktop | 1440×2188 | `28:19884` |
| AD03 | Lifecycle, relationship words and starter criteria | Dean Fiedler | Desktop | 1440×1848 | `28:20322` |
| AD04 | Publication rules | Dean Fiedler | Desktop | 1440×2153 | `28:20745` |
| AD05 | Pricing rules | Dean Fiedler | Desktop | 1440×1685 | `28:21127` |
| AD06 | Import format, numbering, notifications and views | Dean Fiedler | Desktop | 1440×2563 | `28:21493` |

Page assumptions: Dean Fiedler administers Products settings (an assumption); purposes, audiences and withdrawal reasons are starting lists while the build stores free text; required attributes are named for Dosing pumps and Sensors only; the people beside each capability are personas, while seed 52 names four duties. The other four sections are intentionally empty.

### Read me and Shell and kit

Read me (page `0:1`): header card `40:293`, page template card `40:297`, sheet index and notes `40:300`, audit `40:336`. Shell and kit (page `9:11`): shell components `9:81`, Sales kit `9:82`, icons `9:83`, tablet and phone chrome `9:84`, Products parts `11:299`; the derived docked Sales menu with Products current `9:1679`, rail with More current `9:1024` and rail with Settings current `19:333`. Hidden build-time helper nodes sit in the kit section and are not part of the design.

In all: 122 sheets and 7 notes cards on seven scope pages.

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

Checks were run by script inside the file after the last sheet was drawn, page by page.

- **Structural pass and position audit.** Every scope page was re-gridded and refitted (sections 360 px apart, 60 px padding, labels at y − 26 truncated to the sheet's width). On all seven pages: no sheet outside its section, no child outside its sheet, no overlap between sheets, labels or sections, nothing loose on a page, every sheet labelled with its code and signed-in person, and Roboto the only font family. The pass found six phone sheets whose sticky action bar sat 1 px outside the sheet; they were corrected (section 10.1, C2) and the pass then reported no issue. The separator pages and Scratch are empty.
- **Evidence scan.** 17,371 text nodes were scanned for earlier fixtures (`SYN-REL-`, `SYN-PRD-`, `SYN-PROD-` aliases, `SYN-PPO-`, Kim Patel, Alex Nguyen, Priya Shah, Jordan Hale and Morgan Lee as product people, "Synthetic Company A", Brisbane time), ISO dates outside file names, gendered pronouns and the forbidden words. Five hits remain, all inside quoted rules or notes that name an earlier fixture: "expiring soon" three times in the rule that forbids it, "Mon 3 Nov" in A-PP1, and `SYN-REL-` in A-PC1. References found: `SYN-PROD-000001` to `000035` and `000041` to `000055`; `SYN-PRL-000006`, `000007` and `000009` to `000017`; `SYN-SRC-000024` to `000029`; `SYN-EST-000144`, `SYN-EST-000312`; `SYN-QUO-000214`; `SYN-AST-000102`, `000214`, `000219`, `000221`; `SYN-ECR-000014`, `SYN-SMT-000011`, `SYN-RCT-000081`, `SYN-ACR-000906`. Each matches the prompt's dataset and Addendum A3.13.
- **Counts.** The dataset was generated once and asserted before drawing: 50 products (Families 9, Models 35, Variants 6; Published 40, Draft 6, Submitted 1, Reviewed 1, Returned 1, Withdrawn 1; Current 42, Last-time buy 1, Discontinued 2, Unknown 5; 34 with an image), a publication queue of 24, 7 bindings (Mapped 6 after 10:10), 11 relationships (Needs reassessment 1, Unresolved 1, Not reviewed 2, Awaiting review 1, Conditional 4, Rejected 2) and 4 import files. Footers read "N shown · limit 100 · … · no total is claimed"; no menu shows a count.
- **Build-difference check.** Every desktop, dialog and state sheet carries a Build difference card, as do the tablet sheets except TB01 and TB04, whose differences are those of CA01 and PB05. Phone sheets carry none (the card is 720 px wide); their differences are those of the desktop sheets they follow. Every card item is classed UI change or Contract change and appears in section 6.
- **Contrast.** ST03 computes 20 colour pairs from the "PPO colour" variables, text pairs against 4.5:1 and interface edges against 3:1. All 20 read Pass.
- **Renders.** Sheets were rendered and read on every page, among them CA01 to CA03, CA09, the phone and tablet catalogue, PB05, PB06, PC01, PI03 and AD01, and the Read me page.
- **Repository.** `python3 scripts/build_status.py --check` and `python3 scripts/check_foundation.py` pass. No Figma link or file key is recorded.

Limits. The sheets were drawn by this session and by seven drawing agents working in parallel from one written brief, one helper library and one generated dataset. All seven agents stopped early when the session's usage credits ran out; this session then drew the 28 sheets and 3 notes cards still missing on the Publication, Pricing and Import pages, and checked every page with the pass above. The four notes cards written by the agents carry their own page assumptions (section 3). Version history and named versions cannot be read with the tools used. The frozen "PPO - Design" file was not opened; its retained captures were read. Addenda A1 and A2 were not supplied as files; their repository sources (shell rules R116 to R125 and the readable-reference decision) were used.

## 8. Not drawn and open questions

- **Proposals this design waits on:** [ADR-0057](ADR-0057-product-image-renditions.md) (image renditions) and [Product image references](product-image-references.md) are proposals; the identifier allocator for `SYN-PROD-` and `SYN-PRL-`; Inventory Q1 and MYOB item mapping (Mappings AD-05 owns it).
- **Questions the accepted designs left open:** PD-02 Q2 (required attributes, a new tested rule) and Q4 (notifications); PD-03 Q8 to Q10 (owner field, Mapped needs a Reviewed source, new reads) and Q12 (price check F3 and worklist F4); PD-04 Q3 (starter criteria per product kind) and Q6 (L/h); PD-05 Q3 (Submit as its own step) and Q4 (Abandoned).
- **Open decisions in BP-01 that bear on Products:** D-002 (functional ownership and delegated approvals), D-005 and D-006 (MYOB versions and endpoints), D-008 (CAD products and formats), D-009 (costing formulas), D-010 (pricing authority policies), D-012 (SharePoint locations and retention), D-019 (QHSE and customer operating controls), D-021 (availability, recovery and accessibility targets), D-024 (branding, templates and issue policy).
- **Not drawn:** dark mode; cost sources, estimates, CPQ lines and quotations (Estimating); Inventory, purchasing and receiving (Supply); materials, substitutions and change review (Engineering); equipment, bulletins and lifecycle (Customers, sites and equipment); mappings and data quality (Settings). Each is referenced by name where a Products page hands to it.
- **Not proposed, and recorded so:** automatic publication; unit or currency conversion; totals across sources or estimates; merging similar records; repricing saved work.

## 9. Boundary and next steps

Design only: no application code, route, migration, permission or integration. The design register, the Products scope pages and the page guidance follow in their own change (A24). The Sales file's PR01 and TB08, and the product rows of the Estimating, Supply, Engineering and Customers, sites and equipment files, align where Addendum A3.13 corrected them, each in that file's own batch. A named version is Dean's to save; any design change after it needs a new one ([named-version handoff](figma-named-version-build-handoff.md), rule 5).

## 10. Audit — 12 November 2026

Every page was read against first impression, usability, hierarchy, consistency and accessibility, and for Products against five questions: can a reader tell at a glance which exact revision is shown, what is evidence and what is unresolved, who acted, and that nothing here approves an installation, prices saved work or merges records? Corrections of errors were made in the file; the rest waits for Dean.

### 10.1 Corrected in the file (C)

| ID | Correction |
|---|---|
| C1 | The SVG import of the icons left a 24 × 24 background shape in 101 icon masters, which drew a solid square in every recoloured instance. The shape was removed from each master |
| C2 | The phone sticky action bar measured 73 px with its top border inside its layout and sat 1 px outside six phone sheets (PH07, PH08, PH07-320, PH13, PH14, PH13-320). The border was taken out of the layout and the helper corrected |
| C3 | PH01's phone tab bar marked Deals as current; Products opens from More on the phone, so More is current |
| C4 | CA02 was rebuilt at 900 px with its Build difference card inside the content, where it had floated over the grid |

### 10.2 Coverage

All 30 scenarios of the prompt have a sheet: S-01 CA01 · S-02 CA02 · S-03 CA03 · S-04 CA04 · S-05 CA06 · S-06 CA08, CA10 · S-07 PB01 · S-08 PB02, PB04 · S-09 PB03, PB05 · S-10 PB06, PB07 · S-11 PB08, X05 · S-12 PB10 · S-13 PB09 · S-14 PB11, X06 · S-15 PP01 · S-16 PP02, PP03 · S-17 PP04 · S-18 PP05 · S-19 PP06, PP09 · S-20 PP07 · S-21 PC01 · S-22 PC02 · S-23 PC03 · S-24 PC04, PC07 · S-25 PC05, PC07 · S-26 PC06 · S-27 PI01 · S-28 PI02, PI03 · S-29 PI05 to PI09 · S-30 CA05, CA11. The prompt's minimums are met: 34 dialogs and panels (24 asked), page-state boards on every scope page, 8 tablet sheets (the eight it names), 16 phone sheets at 390 px and 5 at 320 px, 6 administration sheets, and the interaction states. Product touchpoints of the other modules are shown where the page hands to them: CPQ and quotations (PP12, PB07), cost sources (PP01 to PP05, X07), Inventory (CA02, CA11), EN-06 and EN-07 (PC04, PC07, X10), EQ-07 (PC05, PC07, PC11), Mappings AD-05 (CA11, the N-P12 proposal).

### 10.3 Refinements (R)

| ID | Refinement | Recommendation |
|---|---|---|
| R1 | Record sub-lines carry long chains of facts | Cut each to one clause, as the Sales file did (its R11). Applied after the acceptance (section 12) |
| R2 | Build difference cards make most sheets taller than 900 px | Let them be hidden for stakeholder reviews. Applied after the acceptance (section 12) |
| R3 | The Sales phone tab bar has no Products entry | More could list recent products |
| R4 | CA09's delivery profiles are illustrative rows | Replace them with the adopted extension's own CP-40 values when its record gives them |
| R5 | The queue's "In state" column holds a duration for open revisions and a date for published ones | Split the date into its own column if Dean prefers |

### 10.4 Gaps (G)

G1 dark mode is not drawn. G2 200 % reflow and keyboard-only completion are specified in words on ST02 and ST03, not drawn step by step. G3 offline on the phone is a state tile, not a full sheet. G4 tablet variants exist for the eight sheets the prompt names, not for every desktop sheet.

### 10.5 New features (N)

Integrated as drawn: N-P1 the unit check on every binding, N-P2 duplicate suggestions that ignore case, spaces and hyphens, N-P3 Needs reassessment raised when a revision changes, N-P4 the comparison of a successor against its published basis. Proposed, each with a "Proposed · not accepted" chip: N-P5 an identifier allocator (AD06), N-P6 image renditions (CA03), N-P7 validity alerts (PP06), N-P8 starter criteria per product kind (PC08), N-P9 installed-base impact for a Last-time buy product (PC05), N-P10 price check F3 and worklist F4 (PP06), N-P11 CSV import with the same plan and review (PI02), N-P12 MYOB item mapping status beside Availability (CA11). Not proposed, and recorded so: automatic publication, unit or currency conversion, totals, merging similar records, repricing saved work.

### 10.6 Professional polish (P)

P1 the kit components keep their "Sales / …" names so the module files converge; rename them when PPO - Library is adopted. P2 icons are Lucide stand-ins for Font Awesome Light until publication. P3 some sheet labels are truncated at the sheet's width by design; the frame name holds the full label.

### 10.7 Recommended order

1. Dean reviews the flagship journeys (CA01 to CA03, PB01 to PB07, PP01 to PP04, PC03 to PC07, PI03 to PI09) and accepts or redirects.
2. Apply R1 and R2.
3. Dean saves a named version.
4. Hand section 6 to Codex in order: UI changes first, then the contract changes, each as its own authorised step.
5. Align the Sales file's PR01 and TB08, and the product rows of the Estimating, Supply, Engineering and Customers, sites and equipment files, in their own batches.

## 11. Acceptance — 12 November 2026

Asked for the next step, with the recommendation to review the flagship sheets and "reply 'accept' or with changes", Dean answered: "accept".

The acceptance covers the design as drawn: the 122 sheets and 7 notes cards of section 3, the rules of section 4, the assumptions and departures A1 to A24 of section 5 and each page's own assumptions, and the audit with its recommended order (section 10.7), whose next step was to apply R1 and R2.

It does not cover:

- **The build.** The differences of section 6 remain design findings. Each needs its own go-ahead and pull request, and the contract changes need their migrations reserved first.
- **The proposed automation candidates.** N-P5 to N-P12 stay proposals; each carries a "Proposed · not accepted" chip on the sheet that draws it.
- **The design register and the scope pages.** These still carry pre-design text (A24) and are corrected in their own change.
- **Production readiness.** Nothing here makes it so.

The administration sheets (A22) are accepted as the place where Products rules are shown. Who administers Products settings stays open.

On acceptance the seven scope pages were moved above the "— Proposals —" separator, between it and "— Accepted —", with every node ID unchanged. The Read me cards and the Administration sheets' header chips now read as accepted ("Accepted design · not built").

## 12. Applied after the acceptance — 12 November 2026

- **R1, record sub-lines.** 53 record header sub-lines on the Catalogue (13), Publication (8), Pricing (13), Compatibility (7) and Import (12) pages were cut to one line. Each cut drops whole trailing segments until the line is at most 100 characters, and never drops the reference, the alias, the exact revision or a plan number. The facts removed were the company, a reviewer and date, or a published basis that the same sheet states in its details column, banner or comparison. The rule cut the import batch records too deep, so their twelve sub-lines were rewritten to keep the provider, stager, date, rows, content hash and plan, for example "Northgate Fluid Systems · SYN-NFS · staged Mon 12 Oct 2026 by Priya Nair · 18 rows · SHA-256 9c41e7a0 … 1b6e2d90 · plan 3". PB02's sub-line stays at 124 characters, because its remaining segments name revisions; it fits one line at 1440 px.
- **R2, Build difference cards.** A variable collection "PPO review" with the modes Design review and Presentation holds one boolean, "review/show build differences" (shown in Design review, hidden in Presentation). The visibility of all 99 Build difference cards (Catalogue 25, Publication 16, Pricing 16, Compatibility 17, Import 16, Interaction states 3, Administration 6) is bound to it. Setting a page's, section's or sheet's "PPO review" mode to Presentation hides every card in it at once; the cards are not deleted and their items do not change.
- **Verification.** The structural pass reports no issue on any of the seven pages after both changes, and every rewritten import sub-line fits one 18 px line.

R3 to R5, G1 to G4 and P1 to P3 stay open as section 10 lists them.

## 13. Named version

None yet. Dean saves the named version in Figma; this section then records its name and date. Until it is saved, a later change to the file is not pinned, and under the [named-version handoff](figma-named-version-build-handoff.md) the build basis is the named version, not the file's current state. The suggested name, matching the Sales file, is "PPO - Products module (accepted)".
