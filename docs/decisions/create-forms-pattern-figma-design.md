---
document_id: PPO-CREATE-FORMS-FIGMA-DEC
date: 2026-11-01
owner: Dean Fiedler
status: Owner-accepted design; application changes and operating rules separate
source_commit: 1fc002978ee2a6871121d9252609a49c6dc31b9a
versioning: git
---

# Create forms shared pattern design — owner decision

On 31 October 2026 Dean asked Claude "to design and build a shared 'Create forms' pattern page in Figma, with the six create forms the accepted pages left undrawn, as a proposal for my review". After three rounds of audit and polish, Claude listed five items it was not satisfied with, and Dean answered "Yes, close them". Asked "Do you accept the Create forms pattern with the recommended answers?", Dean answered on 1 November 2026: "Accept recommendations". That answer adopts decisions D1–D17 and the recommended answers to Q1–Q16.

Claude drew the page from these sources:
- `src/components/shared-create-form.tsx` and each form's own code: `LeadForm` (`leads-workspace.tsx`), `NewOpportunity` (`crm-screens.tsx`), `NewWorkOrder` (`work-order-screens.tsx`), `RequestDialog` (`engineering-workspace.tsx`) and `ActivityCreate` (`activity-screens.tsx`);
- the create-route page contracts, such as [route-estimating-new](../design/development/pages/route-estimating-new.md);
- the decisions [Organisations](organisations-figma-design.md), [Deals](deals-figma-design.md), [Leads](leads-design.md), [Work orders](work-orders-design.md), [Work order record](work-order-record-page-design.md), [Workshop builds](workshop-builds-figma-design.md), [Engineering workload](engineering-workload-design.md), [My Work](my-work-page-design.md) and the [pipeline stage model](crm-pipeline-stage-model.md);
- the Figma pages Organisations CS-01, Facilities CS-05, Leads, Deals CR-04, Work orders SV-03, Workshop builds CX-02, Engineering workload EN-01, My Work, Service requests SV-01, Estimate detail ES-01 and Project initiation PJ-01. Only Deals was edited, under Q8.

**Accepting this pattern accepts no other page.** Where one of those pages is still a proposal, such as Project initiation PJ-01, it stays one.

Scope: a shared pattern with no scope ID of its own. Each form keeps its host's scope and route: `/sales/leads?create=1`, `/sales/opportunities/new`, `/service/work-orders/new`, Workshop New build under `scope:CX-02` (no route exists), `/engineering?create=1` and `/work/new`. Parent requirements CRM-01, CRM-02, SVC-02 and ENG-01 are unchanged, none is added or renamed, and none is marked complete.

This is a design decision. It authorises no application code, migration, capability, grant, adapter, endpoint, business transaction or deployment. Dean's instruction for this work was "Do not build the app page". Q1–Q16 are adopted as design direction for synthetic rules, not as verified operating rules.

## 1. Decisions and evidence

| Item | Classification | Evidence |
|---|---|---|
| Design the pattern and six forms as a proposal | User decision, 31 October 2026 | Dean's request quoted above |
| Start from Create organisation and do not invent a second pattern | User decision, 31 October 2026 | Dean's request |
| The shared rules: search first, keep unknowns explicit, review, save, inspect, continue; an uncertain save recovers the original; permissions decide fields; quick add and the full form share one field set | User decision, 31 October 2026, restating the create-route contracts | Dean's request |
| D1–D17 | Accepted as recommended, 1 November 2026 | "Accept recommendations". Section 4 |
| Q1–Q16 | Resolved as recommended; design direction | Section 5 |
| Accept the design | User decision, 1 November 2026 | Quoted above |
| Named Figma version | User action, 1 November 2026 | Dean saved it himself: "I have saved the named version as Create forms · shared pattern — accepted" |
| Changing any application form | Not decided | Section 6 |

## 2. Design reference

| Reference | Identity |
|---|---|
| Accepted design | Figma file "PPO - Design", private to Dean's Figma team, at the named version "Create forms · shared pattern — accepted". The file's link is not recorded in this public repository (ADR-0050, ADR-0053) |
| Page | "Create forms · shared pattern" `3036:220`, under "— System —". The page header `3036:221` holds the conformance declaration. File index row `3110:306` |
| Pattern | Quick add `3041:24222`; full form `3036:36929`; duplicate check `3036:41897`; unknown with a reason `3036:42238`; review before save `3036:42561`; saved and next step `3036:42901`; uncertain save `3036:43073`; validation errors `3036:43397`; permission-limited `3036:43723`; search picker `3044:15889`; top-bar + menu `3044:16220`; tablet full form `3044:16617`; tablet quick add `3048:12208` |
| + Lead | Quick add `3039:65763`; full form `3039:66252`; saved `3039:66722`; phone 390 `3039:66901`; phone 320 `3039:67023`; phone saved `3039:67145` |
| Create opportunity | Quick add `3039:67197`; full form `3039:67693`; from a lead `3039:68039`; contact unknown `3093:622251`; earlier follow-up kept `3093:623268`; saved `3039:68493`; phone `3039:68671`; phone from a lead `3048:12046`; phone saved `3041:10030` |
| New work order | Full form `3040:18363`; saved `3040:18736`; phone `3040:18929` |
| New build | Panel `3040:19046`; saved `3040:19379`; phone `3040:19529` |
| New engineering request | Panel `3040:19619`; saved `3040:20171`; phone `3040:20327` |
| Create activity | Full form `3040:20456`; saved `3040:20802`; phone 390 `3040:20955`; phone 320 `3040:21090`; phone saved `3040:21225` |
| States, desktop | Loading options `3040:21268`; option list failed `3040:21485`; duplicate chosen `3040:21714`; save refused, stale `3040:21949`; saving `3044:17003`; leave with unsaved entries `3044:17175`; not permitted `3044:17435`; no options `3044:17565`; opened from a record `3044:17881`; validation in a panel `3048:13272`; uncertain save in a panel `3048:14157` |
| States, phone 390 | Duplicate check `3044:18127`; validation `3044:18194`; uncertain save `3044:18257`; picker sheet `3044:18319`; loading `3048:15249`; option list failed `3048:15327`; save refused `3048:15414`; not permitted `3048:15475` |
| Reference cards | Coverage table `3041:10085`; notes `3041:10384`; ideas `3045:17926` |
| Page parts | Section "New parts": Create / Notice `3036:35235`, Create / Match card `3036:35236`, Create / Review row `3036:35251`. They stay on this page until a build needs them |
| Prototype | Flows "Create forms — desktop" (from `3039:65763`) and "Create forms — phone" (from `3039:66901`) |
| Retained captures | [Create forms design r01](../reference/ui/create-forms-design-r01/README.md). Copies were made on a temporary page and deleted after export, so the README cites each source frame |

## 3. Story and conformance

Synthetic, as at Tue 13 Oct 2026. Lee Wong of SYN Hillview Growers rings about fertigation and climate controls for Glasshouse 5, a new house planned beside Glasshouse 4.
- **Lead:** SYN-LEAD-000151, saved by Sasha Clarke at 08:46 from the 08:40 call. The check finds Morgan Chen's different lead with Lee, Boiler sensor retrofit.
- **Deal:** converted to SYN-OPP-000061 at 09:04, Discovery and Open. The site stays Not known yet because Glasshouse 5 has no site record. The next action is a discovery site visit on Tue 20 Oct.
- **Engineering request:** SYN-ENG-000721, Glasshouse 5 design basis, assigned to Casey Quinn, Queued.
- **Activity:** send Lee the fertigation questionnaire, due Thu 15 Oct. It links to the customer, because the form has no Deal record type (Q9).
- **Work order:** SYN-WO-000052, a draft for a dosing pump fault at SYN Block C Plant Room, linked to SYN-TKT-000118, owned by Sasha Cole.
- **Build:** SYN-BLD-000046, a second 4-channel fertigation dosing unit on Block C fertigation upgrade, Planned, by Drew Collins.

Claude added these synthetic references, and no other page holds them. No existing reference was rewritten.

Declared under [PPO-UI-CONFORMANCE](../standards/html-module-conformance.md).

| Field | Declaration |
|---|---|
| Scope identity | Shared pattern; see the Scope paragraph above |
| Page type (r20) | Form / guided workflow, opened over or from a Register / worklist. Phone: a full-screen form |
| Reused components | Linked Shell / Top bar `35:138`, host rails, Shell / Phone header · compact `1530:110`, Controls / Form field `2649:7479` and Choice option `2648:7409` (file audit proposals), Button `3:41`, Tag `3:13`, Record / Field `224:12`, Grid / Group band `2651:7352`, host register bodies copied. New: the three page parts above |
| Incoming handovers | A phone enquiry into + Lead; a qualified lead into Convert to deal (LC-11); a triaged service request into New work order; a project into New build; a deal or project into New engineering request; any permitted record into Create activity |
| Outgoing handovers | A lead to Plan activity or Convert to deal; a deal to its next action and to Engineering; a draft work order to the scope decision; a Planned build to kitting; a queued request to scope and effort review; an activity to My actions |
| Source authority | The code and decisions listed above. New build has no code, so it rests on the accepted register columns |
| Exceptions and recovery | Loading, list failed, no options, validation, saving, uncertain save, stale refusal, not permitted, duplicate chosen, leave with unsaved entries. Section 2 lists the frames |
| Departures | D1–D17 |
| Verification | Section 7 |

**Whose wording this is.** From the code or accepted pages: field labels, button words, the lead subtitle, "Names can be unverified at this stage", "Saved using your device's time zone", "Confirm original save", "Retry original request", the engineering rule and the restricted-site message. Proposed by Claude and accepted as a proposal: every validation message; "Not known yet" as an option; the loading, could-not-load, no-options, not-permitted, saving and leave wording; saved notices and next-step sentences; save-bar sentences; check and review panel wording on forms other than organisations; and everything on New build.

## 4. Departures

| ID | Departure | Basis |
|---|---|---|
| D1 | One pattern, not a second: Create organisation and the Facilities form. Same sections, save bar and right-hand check | Dean's request |
| D2 | Quick add and the full form share one field set. Where a route exists, quick add sits over the host page. Lead, Engineering request and Build have no route, so their panel is the only form | `LeadForm`, `RequestDialog`, Deals D10 |
| D3 | Check before creating is new for leads and deals, so it needs a new permitted read. It stays a prompt, never a block, and nothing merges | `shared-create-form.tsx` has it for organisations only |
| D4 | "Not known yet" is a choice with the reason field below. In the code the picker stays blank and the reason field appears. Reason labels are the code's own | Dean's rule 2; `NewOpportunityForm` |
| D5 | Review before save is the right panel on a full form, beside the check, and the sentence above the buttons on quick add and phone. No extra step. Create estimate has a similar list in its left column | Dean's rule 3 |
| D6 | Saved shows a notice and a short summary. Real record pages keep their accepted layouts; only the notice and next step are new | Dean's rule 4 |
| D7 | An uncertain save keeps entries locked and offers Confirm original save (Engineering: Retry original request). Recovery repeats the original request, so no second record is created. To check at build: + Lead makes its ID at submit, the others when the form opens | `useCrmCommand`, `RequestDialog`, `LeadForm` |
| D8 | Phones use the compact header, record type, with back and no tab bar; a 48 px main action; 16 px inputs. Back keeps the F42 leave guard | Phone header amendment; route contracts |
| D9 | The deal form uses the accepted Deals labels (Next action, Due, Action owner) over the code's, and Deal title first. Activity kind stays because the code requires it | Deals decision; 9 October finding S8 |
| D10 | Each form sits in its host's rail. My Work was accepted showing the Estimating rail, so Create activity shows it too | My Work decision |
| D11 | New build shows only the accepted register columns and the record's read-only rules. There is no model, route or capability | Workshop builds D2–D4 |
| D12 | Convert to deal comes from the code's own review, retaining the lead owner as deal owner. Create estimate and Create project are referenced, not redrawn | `LeadForm`; Dean's request |
| D13 | Required labels follow the server's validation, on selects as well as text | `src/crm/leads/validation.ts`, `src/engineering/validation.ts` |
| D14 | Long values wrap on phone and the control grows. A native text input does not wrap, so a long title needs an auto-growing field at build | Route contracts |
| D15 | The picker makes Not known yet deliberate and offers Create a site and return. The return path exists today only from a lead | `shared-create-form.tsx` |
| D16 | The leave prompt is an app dialog with plain wording. The app uses the browser's prompt today | F42; Q13 |
| D17 | Site and Contact on a deal read "Or say why unknown", not Required: the server accepts a value or a reason | `src/crm/leads/validation.ts`, `NewOpportunityForm` |

**Keyboard and screen reader.** Already in the code: the lead form focuses its first field, and its dialog holds and returns focus; a failed save focuses an error summary whose items jump to their fields (`ErrorNotice`); saving is announced as status; lookups are comboboxes with a match count. Proposed: the same on every form; Esc closes a panel through the leave check, except while saving or uncertain; at 200% zoom the check stacks above the form, as at 1024.

## 5. Questions resolved as recommended

| ID | Question | Accepted answer |
|---|---|---|
| Q1 | Quick add everywhere? | Only where the accepted page has "+": Leads, Deals, Engineering New request, Workshop New build. Work orders and activities open their full form. The top-bar + stays as the route to all of them |
| Q2 | Is the duplicate check mandatory? | Always shown for organisations, people, leads and opportunities, and still a prompt. Not on work orders, builds, engineering requests or activities |
| Q3 | Is phone creation allowed for every record type? | Yes for these six, online only, with the same fields. Estimating, cost-source and configuration creation stays desktop first |
| Q4 | Which "Not known yet" fields need a reason? | A deal's site and contact, as the server requires today, including at conversion. Lead capture needs none. Dates and assignees use plain words (Due date needed, Not assigned, Not set) |
| Q5 | Are five fields enough for New build? | Yes; the parts list and work instruction are read on the record. A workshop capability still needs its own decision |
| Q6 | "Block C" is under SYN Hillview Growers on Work orders and SYN Northbank Nursery on Workshop builds | Leave accepted pages unchanged and pick one owner when either page is next changed |
| Q7 | What counts as a likely duplicate lead? | Same organisation and contact, closest title first, permitted companies only |
| Q8 | Add Activity kind to Deals Add deal? | Yes, at this lock-in. Done: see the amendment in the [Deals decision](deals-figma-design.md) |
| Q9 | `/work/new` has no Deal record type, though the server accepts Deal and Lead links | Add Deal and Lead to the form in a small app change, when a build is requested |
| Q10 | The engineering dialog says Opportunity; Sales says Deal | Say Deal on screen and keep opportunity in the data |
| Q11 | "Request engineering" on a saved deal is new | Add it, opening the dialog with the deal filled in |
| Q12 | Should the undrawn rows follow next? | People and Sites first, then the rest as each page is next changed |
| Q13 | Replace the browser's leave prompt with the app dialog? | Yes. Closing the tab keeps the browser's prompt |
| Q14 | Which ideas go further? | I1, I3, I4, I6 and I10, each by its own decision. Accepting this answer decides none of them |
| Q15 | The shared form's code requires "Reason for capture", and the accepted Create organisation frame has no such field | Send a fixed reason, as the other forms do, and remove the field at build |
| Q16 | Create estimate says "Site to be confirmed" and "Unknown" | "Not known yet" on new forms; leave the accepted estimate until that page is next changed |

### Ideas, not decided

These are on the ideas card `3045:17926`. None is in the pattern. I1 lead from a logged call; I2 dictate the enquiry on a phone; I3 resume an interrupted form; I4 unknowns become owned follow-ups; I5 copy from an earlier record; I6 match on phone and email too; I7 keyboard and "Save and add another"; I8 next step carries the context; I9 site location from the phone (hold for a privacy decision); I10 show what we already know; I11 recent and likely choices first; I12 "still needed" beside Save.

### Coverage

Verdicts come from viewing each cited frame. "Not drawn" rests on a search of those pages for forms with Cancel and for New, Create or Add buttons, so a differently worded form could be missed. The same table is on the page.

| Route or dialog | Form in the code | Where it is drawn | Follows the pattern? | Still missing |
|---|---|---|---|---|
| `/sales/leads?create=1` | `LeadForm` | This page | Yes | Code has no duplicate check or review line |
| `/sales/opportunities/new` | `NewOpportunity` | This page; Deals `2368:8381` | Yes | Code has no duplicate check |
| `/customers/new` | `SharedCreateForm`, customer | Organisations `1445:381483` | Yes, the source | Review is the save-bar sentence only; Q15 |
| `/people` → `/customers/new?kind=person` | `SharedCreateForm`, person | Nowhere | Not drawn | Draw from this pattern, with the check (Q2, Q12) |
| `/sites` → `/customers/new?kind=site` | `SharedCreateForm`, site | Nowhere | Not drawn | Draw from this pattern (Q12) |
| `/customers/new?kind=asset`, affiliation, party, history | `SharedCreateForm`, other kinds | Nowhere | Not drawn | To draw |
| `/facilities/new` | `FacilityFormEntry` | Facilities `1416:367649` | Yes | Source of the section layout; review is the save-bar sentence only |
| `/service/tickets/new` | `TicketCreatePage` | Service requests `1259:3354` | Yes | Review is the save-bar sentence only |
| `/service/packs/new` | `NewJobPackScreen` | Nowhere; Job pack `272:2` draws issued packs | Not drawn | Starts from an appointment |
| `/service/incidents/new` | `IncidentScreen` | Incidents `1348:3653`, `1354:3571` | Partly | A report page with a checks bar and Save draft; no duplicate check, by design |
| `/service/work-orders/new` | `NewWorkOrder` | This page | Yes | Code has no review panel |
| `/estimating/new` | `NewEstimate` | Estimate detail `2248:772149`, `2248:772634`, `2248:773127`, `2262:9942` | Partly | Three steps of its own, review on the left, different unknown wording (Q16) |
| `/estimating/discovery/new` | `NewDiscoveryWorkspace` | Create discovery `1414:356639`, `1416:2974`, `1416:7630` | Partly | Own page and review dialog; choosing an opportunity and "Workspace already exists" cover duplicates |
| `/estimating/cost-sources/new` | `NewCostSource` | Nowhere | Not drawn | To draw |
| `/estimating/configurations/new` | `SpecialistCreate` | Nowhere | Not drawn | To draw, desktop first |
| `/estimating/fertigation/new` | `FertigationCreate` | Nowhere | Not drawn | To draw, desktop first. Not in Dean's list; found in the code |
| `/projects/new` | `NewProject` | Project initiation `2894:10413`, `2899:14469`, a proposal | Partly | In PJ-01's Project & link tab; offers Link an existing project first |
| `/finance/handoffs/new` | `FinanceForm` | Nowhere; Finance handoffs `2091:592837` draws the actions | Not drawn | To draw |
| Workshop New build | None | This page | Yes | The page, route, model and capability |
| Engineering New request | `RequestDialog` | This page | Yes | Q10 |
| `/work/new` | `ActivityCreate` | This page | Yes | Q9 |

## 6. Not decided and not drawn

- **Building any form.** The check, review panel, saved notice, picker options and app leave dialog each need their own pull request. New reads need their own review.
- **Not drawn:** the eight rows above; the Lead's reason dialogs and Transfer owner; a Deal-linked activity from the deal record; the two extra Convert to deal cases on phone; the source-activity (LC-17) and won-deal (LC-16) panels on the deal and work order forms, which stay with their own pages.
- **Rail mismatch:** Create activity shows Sasha Clarke (Sales) in the Estimating rail, as My Work was accepted. It changes with the person's department.

## 7. Audit and verification

- Three audit passes measured text, target sizes, overlap and links on every frame, and proofread the wording against the code. They found and fixed, among others: required labels missing on 90 fields; a clipped frame; design notes in user-facing text; a stale-save story the app does not allow (only the lead owner can change a lead); a phone flow opening the wrong form.
- Page-owned colours are bound to the file's variables, 1,199 nodes, and the Notice part uses the status tokens. Colours inside host bodies copied behind the panels were left alone. The lowest contrast calculated for the pattern's own text is 4.58:1. Disabled text and host pages were not measured.
- Links were traced in the file data: 25 on-page links, each visible, each reaching its intended frame.
- **Present mode was not played.** Dean declined Figma app access for that check. Devices, keyboard and screen reader were not checked. Nothing is built, so there is no application evidence, and this record implies no visual review of the application.
- Captures were made on a temporary page under the capture rule in the design-to-build standard, which is still in pull request #818, then the page was deleted.
- Dean saved the named version "Create forms · shared pattern — accepted" himself and told Claude so. Claude did not open version history to confirm it, because Figma app access was declined.
