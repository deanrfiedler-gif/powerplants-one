---
document_id: PPO-AUTOMATION-CONFIGURATOR-FIGMA-DEC
date: 2026-10-22
owner: Dean Fiedler
status: Owner-accepted design; native implementation and UI baseline acceptance separate
source_commit: 612ebecbfc328a20a035b71c363729f3223efe7f
versioning: git
---

# Automation Configurator workbench design — owner decision

On 22 October 2026 Dean asked for the UI page of the new specialist workbench: "We have added a new specialised configurator workbench module named Automation Configurator. This module will have the same function as the Priva Fertigation Congurator and Screen Configurator workbenches. Your task is to review the powerplants-one repo, as well as open and closed pull requests relating to this new module, then design and build the UI page in Figma for this new module. I want it to be a professional page and include similar high level technical information and details similar to what we have down in the Priva Fertigation Configurator and Screen Configurator workbenches."

Claude drew the page from these sources:
- the [Nursery Automation Configurator specification](../blueprints/nursery-automation-configurator.md) (PPO-NURSERY-AUTOMATION-SPEC, rules NAC-R01–R09) and its [scope decision](nursery-automation-specification.md);
- the [working design note](../design/development/nursery-automation.md) and the [N1 design contract](../design/development/pages/route-estimating-discovery-id-nursery.md);
- [ADR-0060](ADR-0060-nursery-discovery-foundation.md) and the N1 build (PR #661 specification, PR #662 N1, both merged), and the N2 technical assessment (PR #665, with ADR-0061 and the Automation Configurator naming direction; open while the page was drawn, merged into main on 23 October 2026 after acceptance);
- the [estimating hub, CPQ and workbench model](estimating-configurator-model.md) (CM1–CM11);
- the accepted ES-02 Priva Fertigation Workbench Figma page and the ES-08 Screen Configurator page (proposal), which the design follows;
- public Javo product information, shown only as unreviewed source observations (section 4).

Dean then asked for an audit and extensions ("Give the pages an audit and polish to ensure they are correct and as professional as possible. You can add any new and innovative features if you can think of any. Ensure you have included technical scoping information, any calculations that may be required, technical diagrams and drawings, etc, if needed."), then for D13 ("Add the drawing-generation model to the Automation Configurator notes card as D13, including the equipment geometry fields gap."), the entry forms ("Draw the scenario and requirement entry form (desktop drawer and phone) on the Automation Configurator Figma page, reusing the ES-08 Workbench / Field pattern.") and the entry point ("Draw the Discovery-to-Automation entry point (system route card and Actions menu item) as a proposal frame on the Automation Configurator page, without changing the accepted Estimation Wizard page.").

Asked "Accept the design with the recommended answers to D1–D15 and Q1–Q6?", Dean replied: "Proceed". That accepts the design, adopts D1–D15 and adopts the recommended answers to Q1–Q6.

Scope:
- `scope:ES-02` (Discovery) with `route:/estimating/discovery/[id]/nursery` and `route:/estimating/discovery/[id]/nursery/assessment`; CPQ receiving is `scope:ES-03` and quotation output `scope:ES-05`, which this design feeds but does not change. The proposed workbench type `nursery-automation` remains a registration candidate with no ES number; ES-08 remains Screen systems.
- Parent requirements EST-01 to EST-09, unchanged. No parent requirement ID is added or renamed.
- User-facing name "Automation" (PR #665 direction); routes, NAC identifiers, filenames and saved identities keep "nursery".

This is a design decision. It authorises no application code, route, read model, migration, permission, capability, grant, seed, integration or deployment. It approves no manufacturer limit, Products Variant, delivery profile, labour standard or price.

## 1. Decisions and evidence

| Item | Classification | Evidence |
|---|---|---|
| Design the Automation Configurator page in Figma | User decision, 22 October 2026 | Dean's request quoted above |
| Audit, polish and extensions (drawings, calculations, new features) | User decision, 22 October 2026 | Quoted above. Section 6 |
| D13 drawing-generation model, entry forms, entry from Discovery | User decisions, 22 October 2026 | Quoted above |
| Departures D1–D15 | Accepted as recommended, 22 October 2026 | Dean's "Proceed", quoted above. Section 4 |
| Q1 Rail placement | Resolved as recommended | The workbench sits under Specialist configurations, as Fertigation and ES-08 do. Discovery keeps Estimation wizard. The N1/N2 build highlights Estimation wizard today; changing it is a build step |
| Q2 Breadcrumb | Resolved as recommended | "Specialist configurations / SYN-AUT-000001", with "Return to Discovery alternative" in the section menu footer |
| Q3 Record type code | Resolved as recommended | Automation scopes use type code `AUT` under the readable-reference rule: `SYN-AUT-000nnn` for synthetic records, `PPO-AUT-` later. Allocating it in the application is a build prerequisite |
| Q4 Integration owner | Resolved as recommended | No default owner for the machine-to-conveyor handshake and stop/restart boundary; the estimator names PPO, the supplier or the site contractor |
| Q5 Tray automation | Resolved as recommended | Captured as a parked Phase 2 stage; sizing returns Not assessable and nothing is quoted |
| Q6 Menu wording | Resolved as recommended | The middle group reads "Assess the line" while Javo potting lines are the only equipment family |
| Accept the design | User decision, 22 October 2026 | "Proceed", quoted above |
| Named Figma version | Saved by Dean, 25 October 2026 | "Automation Configurator — workbench pattern, accepted". Dean confirmed: "I have saved it." Section 7 |
| Building the page | Not decided | Section 5 |

## 2. Design reference

| Reference | Identity |
|---|---|
| Accepted design | Figma file "PPO - Design", private to Dean's Figma team. The file's link is not recorded in this public repository (ADR-0050, ADR-0053) |
| Page | "Automation Configurator · ES-02" `2043:80`, after "ES-02 Priva Fertigation Workbench (accepted)" under "— Estimating & quotation —". The page header `2043:81` holds the conformance declaration; the notes card `2046:499139` is in Flows and notes |
| Desktop 1440, full length | Overview `2043:149`; Requirements `2044:492280`; Production scenarios `2044:492858`; Process & equipment `2044:493432`; Line capacity `2044:494006`; Interfaces & site `2044:494580`; Layout & drawings `2048:497757`; Delivery scope `2044:495158`; Quantities & handover `2044:495732`; Outputs & history `2044:496310` |
| Desktop overlays | Line capacity with the calculation trace open `2046:495252` and Process & equipment with Resolve a source conflict open `2046:495663` (1440 × 960); Production scenarios with Edit scenario open `2068:4939` and Requirements with Record answer open `2069:5435` (full length) |
| Entry from Discovery | Route to confirm `2075:509480` and route confirmed `2075:509879` (full length), Actions menu open `2076:6366` (1440 × 960). These are copies of the 21 October routing frame on the Estimation Wizard page; that accepted page is unchanged |
| Tablet 1024 | Overview, rail collapsed and section menu folded to its strip `2050:509999` |
| Phone 390 and 320 | Overview 390 `2046:497557`; Process & equipment stage list `2046:497895`; section sheet open `2046:498209`; Overview 320 `2046:498414`; Edit scenario S1 at 390 `2070:5771` and 320 `2070:5875`; Record answer I-03 at 390 `2070:5976` |
| States | Board of twelve states `2046:498880` |
| Page parts | Section "Parts (proposed, this page only)" `2044:488063`: Automation / Gate card `2044:488092`, Automation / Stage card `2044:498842`, Automation / System route card `2075:5993`. They stay on the page, as the People and AD-01 parts do. The page also reuses the ES-08 proposal parts Workbench / Field, Segment, Sheet header and Sheet title block |
| Prototype | Flows "Automation — desktop (proposal)" from Overview, "Automation — phone (proposal)" from the phone Overview and "Automation — entry from Discovery (proposal)" from the route-to-confirm frame: the ten-item section menu on every desktop frame, next actions to their sections, the trace and conflict drawers, the scenario and answer editors, the phone section sheet, confirm route, open the workbench and return to Discovery |
| Story | Synthetic, as at 21 October 2026, signed in as SC. SYN Isolation Nursery, Potting shed 2; automation scope SYN-AUT-000001 bound to Discovery alternative A revision 2; revision 3 and run R3 saved 21 Oct 16:40 by Alex Nguyen. Scenarios S1 Peak spring (Ø 14 cm, 13,000 good pots per shift), S2 Liner trays (12-cell trays, 300 trays/h = 3,600 pots/h, planting rate unknown) and S3 Herb pots (Ø 6 cm, Phase 2). Six stages with rates 3,600 / 3,400 / 3,200 / 2,400 / 2,800 / 3,000 pots/h; seven open findings. The rates reuse the specification's synthetic expected cases and are not equipment ratings |
| Retained captures | [Automation Configurator design r01](../reference/ui/estimating/automation-configurator-figma-design-r01/README.md): twenty-one icon-free PNGs with hashes |

## 3. Conformance declaration

Declared under [PPO-UI-CONFORMANCE](../standards/html-module-conformance.md).

| Field | Declaration |
|---|---|
| Scope identity | `scope:ES-02` and `route:/estimating/discovery/[id]/nursery` and `route:/estimating/discovery/[id]/nursery/assessment`; ES-03 receiving and ES-05 output fed, not changed; EST-01–EST-09 unchanged; capabilities unchanged |
| Page type (r20) | Specialist workbench: form and guided workflow with review and comparison views, the page type of the accepted ES-02 Priva Fertigation Workbench |
| Reused components | v2 / Rail (Configure & price on), Shell / Top bar with the Conversations action (detached), v2 / Menu strip, Menu edge and Menu heading, Fertigation / Section menu, Section item, Severity badge, Scope readiness, Context strip, Section head, Metric tile, Token, Next action row, Concept node and Headroom row, Record / Header, Banner, View tab and Filter chip, Grid header and cells, Wizard / Context header and Finding link, Button, Tag, Icon/*, and the ES-08 proposal parts Workbench / Field, Segment, Sheet header and Sheet title block. New, proposed: Automation / Gate card, Stage card and System route card |
| Incoming handovers | Entered from the Discovery Configuration tab (confirmed System route card or Actions › Open in a workbench) with the saved Discovery or Express alternative read-only; Javo catalogue snapshot and source observations read-only; questionnaire answers and evidence editable in Requirements |
| Outgoing handovers | Unpriced parts proposal (schema 1) and a separate versioned delivery-fact projection to the shared CPQ receiving preview; sealed drawings, equipment schedule and internal supplier enquiry pack. Never prices, labour hours, approved limits, Products publication or any message to a supplier |
| Source authority | The specification and scope decision above, the working design note, ADR-0060, the N2 work in PR #665 and the estimating configurator model |
| Proposed departures | D1–D15 in section 4, accepted |
| Status | Owner-accepted design, 22 October 2026 |
| Decision record | This file |
| Named version | "Automation Configurator — workbench pattern, accepted", saved by Dean on 25 October 2026 |

## 4. What the design shows

### Shell and section menu

The accepted Fertigation workbench shell: the record header (title, saved revision, binding to the Discovery alternative), a context strip with site and production scenario, a scope-readiness summary, and a section menu of ten sections in three groups: Define the requirement (Overview, Requirements, Production scenarios), Assess the line (Process & equipment, Line capacity, Interfaces & site, Layout & drawings) and Prepare the scope (Delivery scope, Quantities & handover, Outputs & history).

### Sections

- **Overview:** five separate readiness gates (Discovery basis, technical suitability, receipt readiness, CPQ Use, quotation readiness), next actions with severity, outputs and decisions needed, metric tiles, stage capacity against demand, a line concept, scenario cards, evidence maturity and the production brief.
- **Requirements:** questionnaire sections A–T with their source question IDs, answered counts and owners; unknown answers with owners and due dates; evidence with exact references.
- **Production scenarios:** the scenario matrix with retained tray-to-pot conversions; container, plant and media facts with their sources; the time basis and good output (NAC-R04); material flow per shift; staffing and manual stages.
- **Process & equipment:** a line schematic of stage cards and connection markers, an equivalent stage register, and a candidate comparison of Javo Standard 2.0 and Plus against every scenario, with public-source limits and the minimum-diameter conflict kept visible.
- **Line capacity:** scenario tabs, result tiles, stage rates against the required rate, the calculation trace (NAC-R02, R03, R04, R05, R09), model limits, draft-only what-if levers and alternatives compared without summing them.
- **Interfaces & site:** a connection register by aspect, utilities against documented demand, site and clearances, an electrical load estimate, the control handshake list and enabling works.
- **Layout & drawings:** sheet 01 line plan, sheet 02 side elevation with datum lines and the C-03 20 mm step, sheet 03 utilities and control schematic with E-stop zones, each with a title block marked "Estimating study · not for fabrication", and a drawing-data table repeating every drawn value.
- **Delivery scope:** technical drivers, delivery boundaries with applicability, selection, responsibility, coverage and review in separate columns, commissioning and acceptance trials, a provisional effort preview labelled as the shared CPQ model, and the handover checks.
- **Quantities & handover:** the immutable run identity, the unpriced parts proposal with technical, installed, spare and purchase quantities and mapping status, the delivery-facts projection and the read-only CPQ receiving preview with its three gates.
- **Outputs & history:** sealed outputs with eligibility, saved revisions, source and profile changes waiting for a decision, and a supplier enquiry preview of seven generated questions.

### Public source observations

The Javo Standard 2.0 product page (consulted 21–22 October 2026) gives about 900–8,000 pots/h, a pot range of 5.5–25 cm in the description and 6–25 cm in the technical data, 400 V 50 Hz 3~ +N +PE at about 4 kW on a 16 A CEE plug, 3,852 × 1,226 × 1,896 mm and 900 kg. Used-machine dealer listings give the Javo Plus about 780–3,720 pots/h and 8–23 cm. The design shows these as unreviewed observations; none is an approved limit (specification section 10).

### Departures, accepted

| ID | Departure |
|---|---|
| D1 | Ten sections in three groups; Line capacity and Layout & drawings are added to the design note's eight views |
| D2 | Five readiness gates on Overview, never merged into one score; new part Automation / Gate card |
| D3 | Line schematic of stage cards and connection markers with an equivalent stage register; new part Automation / Stage card |
| D4 | Candidate comparison as a check-by-candidate matrix across every scenario; source conflicts stay visible; a score never cancels a failure |
| D5 | Capacity as stage-rate bars against one required-rate marker, with the calculation trace in a drawer and the model limits stated |
| D6 | Interfaces as a connection-by-aspect matrix with an owner; utilities compare documented demand with verified supply |
| D7 | Delivery scope follows the 22 October Fertigation delivery-scope pattern; supplier-covered commissioning is included scope; effort is provisional and holds no rates |
| D8 | Parts and delivery facts in two separately labelled tables tied to one immutable run, with the read-only receiving preview |
| D9 | Layout & drawings section with three sheets and a drawing-data table |
| D10 | What-if levers in Line capacity, draft only |
| D11 | Material flow per shift, an electrical load estimate and a control handshake list, with every assumption marked |
| D12 | Alternatives compared without summing, a commissioning and acceptance trial plan, and a generated supplier enquiry preview |
| D13 | Drawings are generated by deterministic, versioned rules from the saved run (the ES-08 precedent); unknown geometry draws a placeholder and raises a finding; sealed sheets carry a manifest; SVG and PDF only |
| D14 | Requirement and scenario entry forms: an Edit scenario drawer and a Record answer drawer on desktop, full-screen editors on phone, each field an ES-08 Workbench / Field with unit, source and status, with conflicts, unknown owners, derived values and an impact preview |
| D15 | Entry from Discovery: a System route card (suggested, then confirmed) beside the System routes table, and an "Open in a workbench" group in the Discovery Actions menu, replacing today's "Nursery Automation discovery" item |

## 5. Not decided and not drawn

- **Building the page.** The built N1 and N2 routes keep their native pages (N2 merged in PR #665 on 23 October 2026). The build order is not decided.
- **Prerequisites for a build:**
  - the `AUT` record type allocated (Q3) and the rail placement changed (Q1);
  - equipment geometry fields in the equipment-data template, populated for Standard 2.0 and Plus from reviewed supplier sources, and a written drawing standard (D13);
  - the company-scoped workbench registry before the category map can suggest a route (D15);
  - the shared CPQ parts and delivery-facts receiver (N3) for the handover sections.
- **Not drawn:** editors for the other questionnaire sections and for stage rates; the "Request answers" dialog (described in conversation only); the supplier enquiry export dialog; a full revision compare view; a drawing inspector panel; tablet frames other than Overview; phone frames other than those listed; a phone drawing viewer; 200% zoom.
- **Data in the frames:** customers, sites, scenarios, rates, limits and references are synthetic or unreviewed public observations. They are not operational records and approve nothing.

## 6. Audit and extensions

At Dean's request Claude audited every frame and extended the page.

- **Corrected:** questionnaire totals (72 of 76 applicable answered, section T hidden); the Overview conveyor rate (2,800 pots/h, 81%); the utilities footnote (16 A demand against a 32 A outlet); the integration-test effort formula; the calculation-trace input count (six of eight assumed or customer advised); the elevator's volume reconciled with its advised rate; every section overline renumbered "n of 10".
- **Added:** the Layout & drawings section, what-if levers, material flow per shift, the electrical load estimate and handshake list, alternatives compared, the trial plan, the supplier enquiry preview, the drawing-generation model (D13), the entry forms (D14) and the entry from Discovery (D15).
- **Checked:** no clipped or truncated text, no unformatted numbers, no overlaps and nothing outside its section, no drawn element outside its sheet, and no prototype link to another page.

- **Post-acceptance audit, 24 October 2026** (Dean: "Carry out an audit and polish on the pages to ensure they are accurate and as professional as possible."): one findings model across every frame — 7 open findings, of which 6 block Use (3 technical: the C-03 interface, the dispenser air demand and S2 not assessable; 1 unmapped part P-03; 2 responsibility or coverage: the integration owner and supplier commissioning coverage), while the S3 minimum-diameter conflict is Phase 2 and does not block Use. The Technical suitability and CPQ Use gates, the receiving preview, the confirmed System route card and the receipt state were corrected; the Interfaces & site badge reads Conflict 2 on every menu and phone sheet; the Overview frame grew 32 px so its footer is no longer cut off. The captures were re-exported before merge.

The audit is recorded on the notes card `2046:499139`.

## 7. Verification

- Claude checked the frames with screenshots taken inside Figma while drawing and auditing, and measured every single-line text against its rendered width.
- The twenty-one captures are copies of the accepted frames, as corrected on 24 October 2026, on the "Captures (icon-free)" page from y = 364,000. Images 19 and 20 are frames holding copies of the phone frames. The 89 prototype reactions were removed and the 1,051 Font Awesome icon instances were swapped for `Icon/placeholder`. Scans then found:
  - no Font Awesome instance left, and no visible vector outside a placeholder, the logo or a drawing sheet;
  - none of 4,571 visible texts with a stored colour that differs from its bound variable;
  - no copy with a prototype link; the flow starting points that cloning added were removed, and the Captures page keeps its 105.
- The captures were exported at scale 1 with the Figma connector and downloaded directly into the captures folder, at their exact frame sizes. The hashes are in the [captures README](../reference/ui/estimating/automation-configurator-figma-design-r01/README.md).
- Dean saved the named Figma version "Automation Configurator — workbench pattern, accepted" himself, after the 24 October re-export, and confirmed on 25 October 2026: "I have saved it." It therefore includes the audit corrections shown in the captures.
- Claude did not play the flows in Present mode.
- Nothing is built, so there is no application or device evidence. No owner device, accessibility, supplier or operational review is recorded. The captures are design compositions, not application captures, and set no UI baseline.
