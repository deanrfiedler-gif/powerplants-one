# Powerplants One — Deal Workspace r01
## Detailed design and build report

**Prepared for:** Dean Fiedler  
**Date:** 17 September 2026  
**Status:** Proposed build specification; no Deal Workspace r01 implementation or deployment is delivered by this report.  
**Scope:** CR-01 — Opportunity detail and internal work, within PPO-009 / BP-03 CRM.  
**Repository checkpoint:** main at aa94dcdcb1dd08798be240325857c3d32d04af02.  
**Primary design inputs:** Deals r36; the r20 theme/style board; existing CRM runtime; connected PPO module designs.

## 1. Recommendation and intended result

I recommend building **Deal Workspace r01 as a dedicated record workspace within Sales**, with its own maintainable source and issued HTML review file. The Deals Board and List will remain the places to review multiple opportunities; the Deal Workspace will be the place to understand and progress one opportunity.

The user-facing separation will be simple:

- **Deals Board/List:** prioritise the pipeline, filter opportunities and compare progress.
- **Deal snapshot:** inspect a deal quickly without losing the current worklist.
- **Deal Workspace:** manage the customer need, scope, actions, people, commercial progress, correspondence, documents and history of one deal.

This is an extension of the existing opportunity-detail page, not a new top-level application area. The application already has the route /crm/opportunities/[id]. The implementation should develop that route and retain one canonical opportunity record. A standalone HTML will provide a focused design deliverable; it will not create a second operational CRM database.

The workspace should answer five questions immediately:

1. What is the customer trying to achieve, and where?
2. Who owns the deal, and who owns the next action?
3. What is stopping progress?
4. What has been estimated, offered and accepted?
5. What needs to happen next, including any receiving handover?

The design will start from the full deal page already embedded in Deals r36. Its useful features will be reconciled against the application and reorganised, rather than discarded in a wholesale redesign. [Current opportunity route][route] · [CRM screen implementation][runtime] · [Page coverage register][coverage]

## 2. What the evidence establishes

### 2.1 Current application foundation

The inspected repository already contains opportunity detail, editing of deal information and scope, controlled stage changes, next-action handling, history, owner transfer, Won/Lost outcomes, and linked estimating/document views.

The current detail tabs are Timeline, Details, Commercial and Files. The commercial view already distinguishes alternative estimates and draft quotation revisions, and explicitly states that option estimates are not added together into the opportunity forecast. These are foundations to preserve. [Current CRM components][runtime] · [Current commercial and files components][commercial]

The current five-stage pipeline is **Discovery → Scoping → Quoting → Negotiation → Closing**. The historical Enquiry/Qualified definition remains separate. Current commands enforce their own movement and evidence rules; changing the visual labels must not change those rules accidentally. [Current stage definitions][stages]

### 2.2 Design references and their status

| Reference | How it informs r01 | Status at this review |
|---|---|---|
| Deals r36 from this conversation | Embedded full deal page, snapshots, tasks, correspondence, documents, pipeline configuration and health indicators | Latest local design input; synthetic and session-only. The inspected main index still points to r35 |
| Theme/style board r20 | Record-detail layout, supporting context, forms, evidence panels, responsive behaviour and shared visual language | Inspected reference; individual proposed patterns do not automatically become accepted application behaviour |
| Application Shell r17, PR #224 | Host navigation, search, breadcrumbs and page-guide placement | Open and unmerged when checked; main and the pending shell must be distinguished |
| Customer 360 r01; Customers/Sites/Growing Areas r03 | Customer relationships, account context and precise site/facility scope | Available design references; full integration remains separate |
| Sales → Estimating intake r02 | Versioned brief and receiving responsibility | Proposed workflow reference |
| Supplier Pricing & Cost Sources r01 | Cost provenance and controlled refresh | On inspected main as a proposed design |
| Estimate Review & Pricing Exceptions r01, PR #225 | Review findings, pricing exceptions and exact reviewed basis | Open and unmerged when checked |
| Quotation r03; approval/issue/distribution r02; response/negotiation r01; conversion r01 | The chain from draft offer to exact accepted basis and downstream conversion | Available designs; their existence does not establish all runtime connections |
| Cross-module approvals and handover inbox r01, PR #223 | Shared entry into domain-owned reviews and returned handovers | Open and unmerged when checked |
| Engineering, Projects, Service, Supply Chain, Finance and shared module references | Receiving destinations and contextual summaries | Mixed design and bounded runtime status; use each owning module’s recorded boundary |

The repository’s HTML index contains dated audit text. I have used it to identify references, and checked the current status of the three relevant open PRs separately. This report is grounded in repository source and design artifacts; it does not claim that the currently deployed application has been inspected or that every design is integrated. [HTML reference index][index] · [Shell PR #224][pr224] · [Estimate Review PR #225][pr225] · [Approvals Inbox PR #223][pr223]

### 2.3 Existing scope identity

The coverage register already defines **CR-01, Opportunity detail and internal work**, with parents CRM-02, CRM-03, CRM-04, CRM-05, CRM-07 and CRM-08. It specifically calls for reconciling the existing deal-detail tabs and preserving separate opportunity and activity ownership.

The workspace will retain this identity. CR-02 owns Sales-to-Estimating handover; CR-03 owns Won-deal receiving handover. A link or status summary in CR-01 will not silently absorb those complete workflows. [Coverage register][coverage] · [HTML module conformance][conformance]

## 3. Scope of the first version

### 3.1 Included in the r01 design package

The first version will demonstrate a complete, coherent deal-management experience:

- Open the same opportunity from Board, List, snapshot and contextual links.
- View and edit permitted deal information and requirements.
- Inspect pipeline stage, sales outcome, probability and ageing as separate concepts.
- Plan and record activities; create and manage internal tasks.
- Understand customer, contacts, site, growing areas and relevant equipment.
- Prepare an estimating brief and inspect its receiving status.
- Review linked estimates, alternatives, quotations and customer responses.
- File and inspect individual correspondence and exact document revisions.
- Review deal history and current responsibilities.
- Record a controlled sales outcome and inspect the resulting handover obligation.
- Experience validation, unavailable sources, denied access, concurrent changes and uncertain saves.
- Use the workspace on desktop, tablet and phone.

Local actions will work against clearly labelled synthetic fixtures. Cross-module destinations will be functioning links where an integrated preview exists, or labelled destination previews where it does not. No control should imply that a live external transaction occurred.

### 3.2 Kept outside the workspace’s ownership

The workspace will not become an estimate line editor, quotation approval engine, electronic-signature service, customer master editor, scheduling board, project planner or ERP order-entry page.

Those capabilities remain in their owning PPO modules. The Deal Workspace will show the source, status, next responsibility and a direct route to the appropriate screen.

The accepted CRM feature scope includes broader reopening/archive history, deliberate activity reassignment and later automation/AI. These remain tracked requirements. The first workspace must not introduce unsupported commands simply because the design can draw a button: current runtime refuses reopening, and opportunity transfer does not transfer activities. Those differences will be recorded as implementation gaps. [Accepted CRM blueprint][blueprint] · [Outcome contract and delivery][outcomes] · [Owner-transfer delivery][transfer]

## 4. Navigation and relationship with the Deals Board

### 4.1 Entry points

| Entry | Result |
|---|---|
| Click a deal card title or list title | Open the full Deal Workspace for that opportunity |
| Select the eye/snapshot control | Open the compact snapshot and retain the worklist |
| Select “Open full deal” in the snapshot | Open the same opportunity in the workspace |
| Open a linked deal from Customer 360 | Open the workspace with an explicit return route to that customer context |
| Open a task, activity, notification or review linked to the deal | Open the relevant tab and, where permitted, focus the linked item |
| Follow a copied internal deal link | Resolve the canonical record, check current access and show a safe default context |

Record identity will use the stable opportunity ID. A title change will not invalidate the link.

### 4.2 Returning to work

“Back to Deals” must restore the originating pipeline, Board/List mode, filters, search, sort, saved-view selection, page/cursor and useful scroll position. Browser Back should produce the same practical result.

After a saved change, the returned view will reconcile the changed deal against its existing filter. If the deal has moved out of that view, the UI will explain that it no longer matches; it will not silently reset the filters to make the card reappear.

Deep links without a worklist origin will use the last valid permitted Deals context where available, then a documented default. Return destinations will be internal and validated.

Unsaved edits will remain in their form when switching inspection panels. Leaving a dirty form will offer a clear save/discard/stay choice. Pending or uncertain commands will keep their original recovery state.

### 4.3 Board refinements carried forward

The wider pipeline selector, create/edit pipeline entry points, reduced column gaps and full-height filter panel from r36 remain Board concerns. Extracting the workspace must preserve them. Pipeline administration will remain in the shared pipeline editor; the workspace will display and use the relevant configuration.

## 5. Page layout and visual direction

### 5.1 Composition

The primary r20 page family will be **Record detail**. Forms and exact document inspection will reuse the corresponding shared patterns.

| Page region | Content and behaviour |
|---|---|
| Application shell | Existing navigation, global search, user controls and shell breadcrumb. Supplied by the host |
| Local identity header | Back link, deal title, permanent reference, customer/site context, Open/Won/Lost and key actions |
| Key-facts strip | Deal value with currency/tax basis, expected close, current owner, next action and due state |
| Stage strip | Current pipeline and stage, permitted progression, stage-entered date/age and relevant help |
| Local navigation | Eight tabs, with the current tab clearly marked |
| Main content | The selected tab’s records, forms or narrative |
| Supporting context | Relevant customer/contact, blocking question, commercial summary or linked work |
| Docked inspection panel | Contact, activity, source evidence or document snapshot; closes back to the initiating control |
| Contextual save area | Visible Save/Cancel while editing, with saving/error/recovery state |

The workspace interior will not repeat the application logo, global search, global navigation rail or shell breadcrumb. Standalone review mode can provide a labelled host frame around it, but that frame will remain separate from the reusable workspace.

### 5.2 Desktop behaviour

The overview will use a broad main column and a narrower supporting column, approximately two-thirds to one-third where space permits. The initial viewport will prioritise customer need, next action and blockers, rather than displaying every available field.

A compact identity header and local navigation can remain visible while the page scrolls, provided they do not consume excessive height on short screens. Detailed sections will use one principal page scroll. Document viewers and long tables may have contained scrolling where it is necessary and clearly identified.

The action hierarchy will remain stable: **Add activity** as the principal everyday action; Edit deal and More beside it. Stage changes, transfer and outcomes will be explicit actions with their own forms. Won/Lost will not be prominent accidental one-click commands.

### 5.3 Visual treatment

Use the established PPO navy (#242a37), green (#62bb46), neutral surfaces, shared typography, icon family, spacing scale and control styles. Green will indicate primary action or positive status; it will not be the only way to convey meaning.

Long titles and customer names will wrap sensibly. Monetary values will align consistently. Unknown dates and amounts will use plain language. Empty cards and oversized decorative gaps will be avoided.

These are composition proposals within existing standards, not an independent design system. The exact component/token mapping will be documented when r01 is built. [Theme/style board r20][theme] · [Shared UI specification][style] · [Conformance standard][conformance]

## 6. Proposed tabs and their contents

### 6.1 Overview

This is the landing tab and concise operational summary.

The main column will show the customer’s objective, current qualification, next action, outstanding questions and a short recent-activity feed. A stage-readiness section will explain the next decision and any configured required evidence.

The supporting column will show the primary contact, site/growing-area context, commercial progress and important linked records. A Won deal will gain a prominent handover card with the captured closing responsibility and current receiving status.

Health messages will be actionable: “No next activity”, “Due date needed”, “Activity overdue”, “Expected close passed”, “Rotting” or “Waiting for customer”. Each will explain its basis and open the relevant action. Missing data will not be converted into a reassuring score.

### 6.2 Scope & sites

This tab will contain:

- Customer need, desired outcome and reason for the purchase.
- Scope inclusions, exclusions, assumptions and unresolved questions.
- Primary organisation and site.
- Selected facilities, growing areas, greenhouse zones or irrigation blocks.
- Relevant crop/production context and working windows.
- Existing equipment and proposed changes, visibly distinguished.
- Technical requirements, survey evidence and dependencies.
- Requested delivery/installation timing, with source and confidence.
- Site access/readiness references and their precise applicability.
- The estimating brief’s version, completeness and receiving status.

The existing saved scope fields will be retained. New structured fields will be mapped deliberately; they will not overwrite estimate scope, site master records or previously submitted briefs.

A deal can describe several areas at one site. Broader multi-site pursuits will be represented as explicit linked scope locations, with a primary site where required by the existing application. They will not be inferred from an organisation hierarchy or a comma-separated site name.

### 6.3 Activities

Activities represent customer-facing or relationship work: calls, meetings, visits, technical clarification, supplier follow-up and similar actions, subject to supported activity types.

The tab will show upcoming, overdue, due-date-needed and completed work. Each item will carry its own owner, purpose, due meaning, linked context and outcome.

Users will be able to plan an activity, open its detail, record an outcome and deliberately identify the next action. Completing a call will not automatically mark a quotation accepted, move a stage or send a message.

Date-only work and timed appointments will remain distinguishable. Times will show a timezone. Completed outcomes retain their author and occurrence time, with recorded time available in history.

### 6.4 Tasks

Tasks represent internal work needed to progress the deal: obtain an electrical drawing, clarify a valve quantity, review a margin exception or organise a site survey.

Each task will include title, description, owner, status, due date or explicit date-needed state, priority, blocking reason and related evidence/module record.

The prototype will demonstrate create, edit, assign, complete and filter. Completion will record who completed it and when. Activity and task counts will remain separate; creating an internal task will not automatically satisfy the designated customer follow-up.

A task may link to an estimating finding or handover request. It will reference that source rather than creating an independent copy of the source decision.

### 6.5 Estimates & quotations

This tab replaces the mixed commercial content of “Scope & estimating” with a focused commercial view.

It will show the progression through estimating intake, estimate alternatives, review findings, quotations, distribution, customer response and conversion readiness. Each stage will name the responsible module and owner or queue where known.

An estimate row will identify its reference, option, saved version, owner, status and value basis. A quotation row will identify its reference, exact revision, selected options, amount, validity and distinct approval/issue/distribution/response states.

Alternative estimates will not be added together. A newer draft will not replace the accepted revision in the acceptance summary. The deal’s expected value will remain a separate CRM field unless the user deliberately adopts a supported source value.

The full estimating, approval, negotiation and conversion actions will open their respective workspaces. r01 can demonstrate these handovers with labelled fixtures while actual contracts are completed.

### 6.6 Correspondence

“Conversation” becomes **Correspondence**, reflecting individual email and filed customer communication.

The view will support linked threads, individual messages, communication notes, attachments and source references. It will distinguish a private message from a message deliberately filed against the deal.

Actions will include inspect thread, link existing correspondence, add a communication note and open a prepared draft in the Email workspace. Draft, queued, sent, failed, delivered and acknowledged states will only appear when the source supports them.

The r01 standalone file will simulate preparation and filing; it will not send email. Selecting a contact, saving a note or logging a call must never imply that communication was transmitted.

### 6.7 Documents

Documents will include briefs, surveys, drawings, photos, estimates, quotation outputs, purchase-order evidence and supporting correspondence.

The list will show document type, reference/name, revision, source, linked record, audience, status, author/date and whether the displayed revision is current or historical.

Users will be able to search/filter, inspect in the shared viewer, follow the source, link permitted evidence and compare available revisions. Upload demonstration will explain its temporary scope and validate supported file attributes.

Issued quotation output and acceptance evidence will retain exact identity. “Latest document” will be a separate convenience link, never a substitute for the revision used in a decision. SharePoint remains the intended business document authority.

### 6.8 History

The history will combine permitted events into a readable chronology, with filters for deal changes, stage/outcome, ownership, activities/tasks, commercial references, correspondence and handovers.

Entries will retain actor, event time, recorded time where different, source, reason and relevant before/after values. Corrections will append evidence rather than erase originals.

The UI will avoid duplicating the same event simply because it appears in two linked systems. Source history remains authoritative; unavailable history will be labelled as unavailable rather than “No history”.

### 6.9 Where Contacts and existing tabs go

| Existing r36 area | r01 destination |
|---|---|
| Overview | Overview |
| Scope & estimating | Scope & sites plus Estimates & quotations |
| Activities | Activities |
| Tasks | Tasks |
| Conversation | Correspondence |
| Documents | Documents |
| Contacts | Persistent primary-contact summary plus a “Manage contacts” supporting view accessible from Overview and Scope & sites |
| History | History |

Contacts remain first-class information. The supporting view will show primary contact, commercial decision-maker, technical contact, site contact and billing contact where known, including affiliation and effective context. Role labels will not be treated as proof of signing or spending authority.

## 7. Information model and editing boundaries

| Information group | Main information | Ownership and proposed editing |
|---|---|---|
| Identity | Opportunity ID/reference, title, pipeline, stage, outcome, creation source, originating lead | CRM; immutable identity, controlled changes to mutable fields |
| Customer | Legal/customer organisation, group context, relevant company, primary contact | Shared records; choose permitted links and open the owner module for master edits |
| Location | Primary site, scope locations, facilities/growing areas, applicability | Shared location records plus deal-specific scope links |
| Accountability | Original/current deal owner, activity owners, task owners, estimator, receiving responsibility | Each record retains its own owner; transfers are explicit |
| Requirement | Need, scope, inclusions, exclusions, assumptions, unknowns | CRM working brief; submitted snapshots retain their own versions |
| Commercial context | Expected value, currency, tax basis, close date, value source/review date | CRM estimate of the pursuit; distinguish from quotation, order and invoiced values |
| Forecast | Stage probability, weighted value, forecast category, omitted state | r36 design direction; server policy and persistence require explicit integration |
| Ageing | Created age, time in stage, last meaningful update, next activity state | Derived from identified events and configuration |
| Activity/task | Purpose, owner, dates, status, outcome and linked evidence | Shared Activity/current task owner model; no implicit reassignment |
| Estimates/quotes | References, alternatives, exact versions, statuses, values and acceptance basis | Estimating/quotation modules |
| Documents/messages | Source identity, revision, audience, filing state and delivery evidence | Documents/communications owners |
| Receiving work | Handover source, route, receiver/queue, status, returned questions, resulting records | Handover and receiving domain |
| History/recovery | Version, actor, operation result and audit references | Application services; advanced detail only where useful |

The displayed amount will retain the current runtime’s **AUD, excluding GST** basis. The design will leave space for currency labels, but will not claim multi-currency valuation is implemented.

“Not estimated”, “Date needed”, “Not recorded” and “Source unavailable” are different states. Zero is reserved for an actual zero. A source outage must not reset a previously known value.

Master-data reassociation needs particular care: changing an organisation or site can invalidate contact eligibility, scope, estimates and permissions. r01 will not add unrestricted reassociation to the ordinary Edit deal form.

## 8. Principal interactive features

| Action | Interaction | Required result |
|---|---|---|
| Edit deal | Focused form for title, contact, expected value and expected close | Validated, versioned save; preserve input on error |
| Edit scope | Structured sections with visible unknowns and evidence | Update working CRM scope; identify submitted briefs needing review |
| Move stage | Stage control opens a deliberate transition form | Apply current permitted movement/evidence rules and append history |
| Transfer owner | Compare current/new owner and outstanding activities; enter reason | Transfer only the opportunity responsibility allowed by the current command |
| Add activity | Purpose, type, owner and due meaning | Create one linked activity and deliberately set next action where supported |
| Complete activity | Record outcome and next-step choice | Retain completion evidence; no automatic commercial decision |
| Manage task | Create/edit/assign/complete with due and blocked states | Consistent status in deal and linked work views |
| Prepare estimating brief | Review customer, scope locations, evidence, unknowns and requested date | Create a versioned proposed handover with a receiving queue/owner |
| Inspect quote | Select exact revision and options | Show that basis in a docked snapshot or open quotation workspace |
| Update expected value from source | Compare current and proposed value and source | Deliberate CRM update; no silent commercial overwrite |
| Prepare correspondence | Select permitted recipients/context and open draft | Draft preparation only until the communications service records sending |
| Link document | Find permitted source, select revision and purpose | Retain exact link, source and audience |
| Record Won/Lost | Dedicated decision form with required evidence/reason | One controlled outcome, preserving stage and prior history |
| Open receiving work | Inspect exact outcome/accepted basis and current receiver status | Navigate to the owning workflow without duplicate conversion |
| Copy deal link | Copy canonical internal URL | Stable link without embedding confidential record content |

Large scope/contact forms will use a supporting page area or spacious panel. Short decisions will use centred dialogs. Evidence inspection will use the shared docked panel. Nested modal stacks will be avoided.

## 9. Pipeline, probability and deal-health rules

### 9.1 Pipeline configuration

The workspace will consume the same pipeline definition used by the Board. Its stage labels, order and configuration must come from stable stage identities.

Creating pipelines, adding/deleting/reordering stages and changing probabilities or rotting thresholds belong in the shared pipeline editor. A workspace shortcut may open that editor for authorised users, but r01 will not maintain another set of settings.

The configurable r36 prototype and current fixed runtime need a deliberate reconciliation. In particular, r36 permits Won from a configured final stage, while the current runtime permits Won only from Closing in the current five-stage definition. Runtime integration must define versioned configuration and stage semantics before exposing arbitrary pipeline edits. Historical records and their events must remain interpretable.

### 9.2 Probability and weighted value

For the first design, probability will be inherited from the deal’s stage. A separate per-deal override will not be added to r01 without a defined policy and provenance.

When enabled:

**Weighted value = known deal value × stage probability / 100.**

For example, a synthetic AUD 100,000 deal at 40% contributes AUD 40,000 to the weighted forecast. Unknown values remain unpriced; omitted deals are excluded under the r36 convention. Owner forecast categories remain separate.

Turning the pipeline probability feature off will hide the weighted amount and probability-dependent summaries while retaining the configured percentages for later use. It will not change the deal’s value, sales outcome or quotation acceptance.

A keyboard/touch-accessible information control will explain the calculation and the fact that it is an estimate.

### 9.3 Rotting and other reminders

r01 should initially match the r36 demonstration: the timer is based on the last deal update; editing deal details, recording an activity or changing stage restarts it. Internal tasks and pipeline-setting changes do not. A future scheduled activity does not hide an existing rotting warning.

The configured pipeline and stage switches determine whether rotting is shown. Each stage’s configured whole-day threshold applies to open deals. Turning the feature off hides this reminder without disabling overdue or missing-activity warnings.

The help text will make this precise. **Time in stage**, **no future activity**, **overdue activity**, **expected close passed** and **rotting** will remain independent signals.

Before runtime implementation, the event basis and day/timezone boundary must be specified and tested. The UI must not infer “last customer contact” from a generic database updated_at timestamp.

### 9.4 Qualification and readiness

The workspace will explain configured exit criteria and unresolved facts. It will distinguish a reminder from a blocking requirement. Thresholds, mandatory questions and approval conditions will not be invented from the sample data.

## 10. Sales outcomes and post-sale handover

### 10.1 Preserve the implemented outcome contract

Current application behaviour provides a firm baseline:

- Won is available only from Closing in the current five-stage pipeline.
- Lost is available from any of those five stages.
- Won requires acceptance/order evidence.
- Lost uses the supported structured reasons: Price, Competitor, Timing or No decision.
- A closed deal retains its stage; subsequent stage movement, reopening and a second fresh outcome are refused.
- Recording Won creates a handover-due record tied to the closing owner and exact outcome version/event/time.
- Won does not itself create a project, service order, sales order, ERP transaction or customer message.

The workspace will preserve these semantics. Broader desired reopening/archive behaviour will remain a recorded later implementation requirement. Independent permitted information/scope/activity edits after closure must not rewrite the captured outcome basis. [Implemented outcome contract][outcomes]

### 10.2 Handover presentation

A Won overview will show “Handover due” with the accountable closing owner, captured basis, outstanding receiving decision and next action.

The proposed receiving summary will distinguish:

1. Handover due.
2. Preparation in progress.
3. Submitted to a receiving queue/owner.
4. Returned for clarification.
5. Accepted by the receiving domain.
6. Resulting delivery/order record confirmed, where applicable.

Only the first of these is established by the current CRM Won contract. The others are proposed linked receiving states, not new implicit CRM outcomes.

A returned handover will preserve the original submission, return reason, author and required follow-up. Acceptance will identify exactly what was accepted. Receiving responsibility and the original closing accountability will remain distinguishable.

### 10.3 Commercial basis must stay exact

Quote approval, issue, sending, delivery, customer acknowledgement, customer acceptance, sales Won, order conversion and delivery readiness are separate facts.

The workspace will show them separately. It will not inherit acceptance onto a revised quotation, substitute a newer draft into a handover, or claim conversion succeeded while the original external result is unknown. [Quotation issue boundary][quoteissue] · [Response and negotiation boundary][quoteresponse] · [Conversion boundary][conversion]

## 11. Connections to the wider PPO app

| Module or family | Information shown in the deal | Action and ownership boundary |
|---|---|---|
| Leads | Originating lead and qualification/conversion provenance | Open original lead; never duplicate conversion |
| Customer 360 | Customer summary, related deals and permitted account/service context | Open customer workspace; company-specific ERP mappings remain explicit |
| Customers, Sites & Growing Areas | Organisation, site and exact selected scope locations | Open shared records; do not use hierarchy as access permission |
| Contacts/People | Primary and supporting contacts, roles and affiliations | Maintain shared identity in People; deal participation is a link |
| Equipment & Installed Base | Relevant existing assets and warranties | Open equipment; proposed products are not installed assets |
| Site Survey & As-Found | Survey status, findings, evidence and applicability | Request/open survey; findings retain source revision |
| Site Access & Horticultural Readiness | Relevant access, biosecurity, crop and seasonal constraints | Open source readiness; commercial promise is not site clearance |
| Products/catalogue and specialist systems | Relevant proposed systems/products and configuration reference | Open configuration/catalogue; specialist engineering remains separately reviewed |
| Sales → Estimating intake, CR-02 | Brief version, missing information, receiver and returned questions | Prepare/open intake; receiving acceptance remains explicit |
| Supplier Pricing and Estimate Review | Relevant unresolved cost/review findings | Open owning source/review; no margin or approval policy invented in CRM |
| Estimating | Alternative estimates, owners, exact saved versions and values | Create/open estimate under existing permissions |
| Quotation approval/issue/distribution, ES-05 | Exact revision and distinct approval, issue and recipient evidence | Open owning workflow; deal stage does not issue a quote |
| Response/negotiation, ES-06 | Exact customer response, options and open negotiations | Open response record; later drafts do not inherit acceptance |
| Item resolution/conversion, ES-07 | Mapping issues, accepted basis and conversion result | Open controlled conversion; reconcile unknown result before retry |
| Engineering | Linked technical requests, owners and design status | Open/request Engineering through its intake |
| Projects and delivery readiness | Linked project, receiving owner and meaningful milestone/readiness summary | Open Projects; sales dates do not become committed programme dates |
| Supply Chain | Sourced material/lead-time dependencies relevant to the offer | Open material readiness; do not promise stock or delivery from stale evidence |
| Service cases, work orders and scheduling | Relevant service-origin opportunity or accepted service work | Open Service; diagnosis, authorisation, booking and attendance stay separate |
| Job Pack and Field Technicians | Relevant completed survey/visit/report evidence | Inspect source; no field execution controls inside the sales page |
| Service Agreements, Warranty and aftercare | Relevant coverage, renewal or post-sale follow-up links | Open owning module; a sales opportunity does not establish warranty entitlement |
| Finance & Commercial Controls | Permitted, sourced account/commercial constraints and applicable company | Open Finance; amounts here are not ledger or credit authority |
| Documents and Knowledge | Exact evidence and applicable guidance | Open viewer/article; retain source revision and audience |
| Email & Calendar | Filed correspondence and linked appointments | Open communications; no automatic send or provider sync claim |
| My Work, Notifications and Approvals Inbox | User’s linked actions, source-owned review requests and returned work | Deep-link to the correct record; no duplicate generic approval |
| Reporting | Drill-through to this deal with definition/as-at context | Use shared source definitions; avoid duplicate forecasting logic |

Some rows represent available designs or registered future scope rather than complete application features. In particular, broader CR-03 receiving handover, CR-05 aftercare and returns/claims scope must not be described as delivered merely because the page register includes them. [Module index][index] · [Coverage register][coverage] · [Customer 360 boundary][customer360]

## 12. Example end-to-end journeys

### A. Greenhouse fertigation expansion

A salesperson opens the deal from the Scoping column. Overview shows the grower’s capacity objective, next technical call and an outstanding water-analysis question.

Scope & sites identifies the relevant greenhouse zones and links the survey. An internal task is assigned to clarify dosing requirements, while the customer call retains its own owner. A versioned estimating brief is prepared with unknowns visible.

The estimator returns a question; the salesperson sees the return and responds against that submission. Estimate alternatives and later quotation revisions appear in the commercial tab without being added together.

### B. Quotation negotiation

The customer requests a reduced scope against quotation revision 2. Correspondence links the request; ES-06 owns the negotiation.

Revision 3 becomes a separate offer. Acceptance of revision 2 does not automatically apply to revision 3. The workspace shows the exact response basis and the next owner action.

### C. Won deal with an incomplete receiving handover

A Closing-stage deal is recorded Won with order evidence. The workspace shows handover due and retains the closing owner.

The receiving workflow identifies an unresolved site-access question. Sales remains able to coordinate follow-up; the project is not shown as accepted or ready simply because the deal is Won.

### D. Supply-only sale

A parts/equipment opportunity follows the appropriate estimating/quotation path. After acceptance, item/customer/company mappings and controlled order conversion are resolved by ES-07 and the receiving sales-order process.

The workspace shows the confirmed resulting reference when available. A timeout leaves “Result unconfirmed” and reconciliation, not another “Create order” attempt.

### E. Service or warranty origin

An existing case reveals a paid upgrade opportunity. The deal links back to the case and equipment so the commercial discussion has context.

Service diagnosis and warranty decisions remain in their owner modules. Creating a deal neither authorises attendance nor rejects a warranty claim.

### F. Lost opportunity and later renewed interest

The user records a supported Lost reason and relevant notes. Existing activities and history remain visible according to their own permissions.

If the customer returns later, the current runtime still does not support reopening. A future deliberate reopen or linked-new-pursuit workflow must preserve the original outcome and be implemented explicitly; r01 will not provide a misleading live Reopen control.

## 13. Permissions, exceptions and recovery

### 13.1 Permission model

Use the existing server-derived capabilities and scoped reads. “Salesperson”, “Sales manager”, “Estimator” or “Viewer” may be useful preview personas, but a role label will not itself grant authority.

The interface will independently check whether the person can view the opportunity, edit information, change stage, transfer ownership, record an outcome, act on an activity and inspect a linked document.

A user allowed to open the deal may still be unable to see commercial costs, private correspondence or a Finance record. Hidden records will not leak through counts, snippets, search results or history.

### 13.2 State design

| State | Intended experience |
|---|---|
| Loading | Stable page structure and clear loading text; suppress stale record actions |
| No linked records | Specific empty state such as “No estimates available in this view” |
| Unknown business fact | “Not estimated”, “Contact to be confirmed” or an owned information-needed action |
| Supporting source unavailable | Keep the permitted primary record; mark that section unavailable and offer retry |
| Permission denied/revoked | Remove protected content and sensitive drafts; show a safe access message |
| Validation failed | Summary plus field errors, focus guidance and retained entered values |
| Concurrent edit | Preserve proposal, show safe current comparison and require deliberate retry |
| Save outcome unknown | Freeze the original operation and reconcile its result; do not issue a fresh command |
| Source revision changed | Keep the captured reference and show that review against the new revision is needed |
| Receiving handover returned | Show exact reason, owner and follow-up against the retained submission |
| Read-only/closed | Keep inspection available; disable only actions forbidden by actual state/capability |
| No connection | Explain that CRM is online; do not claim offline durability |

Current command infrastructure already provides version and original-operation recovery patterns. The implementation should reuse those patterns rather than add a second save mechanism. [CRM runtime][runtime] · [Owner transfer][transfer] · [Outcomes][outcomes]

## 14. Responsive layout and accessibility

At wide desktop widths, the main/supporting columns will remain readable alongside a docked panel. At narrower widths, supporting information will stack or open on demand. The switch will be based on available workspace width, including any open panel.

On phones:

- Title, outcome and principal action stay near the top.
- Key facts become a compact labelled layout.
- Tabs use a controlled overflow/More pattern with the current tab visible.
- Tables become meaningful cards or contained tables where comparison is essential.
- Inspection panels use the available viewport and restore focus on close.
- Forms use one column, with visible errors and touch-friendly controls.
- Long pipeline, stage, customer and document names remain accessible.

Keyboard access will cover tabs, menus, dialogs, stage actions and file inspection. Focus will be visible and return to the opening control. Information icons will have descriptive accessible names and work on focus or tap, not hover alone.

Status will use text as well as colour. Field labels will remain visible. Dates, amounts and hierarchy will be understandable to assistive technology. Planned testing includes 320, 390, 768, 1024 and 1440-pixel widths, short viewport heights, zoom and long-content fixtures.

## 15. Technical build approach

### 15.1 Separate the source without splitting the deal record

I will extract the reusable detail experience from the embedded r36 page into stable source files. The issued r01 HTML will be generated from those sources for straightforward review.

Proposed source structure:

| Proposed file or area | Purpose |
|---|---|
| docs/design/deal-workspace/template.html | Workspace structure and isolated preview frame |
| docs/design/deal-workspace/workspace.css | Scoped styles using shared tokens |
| docs/design/deal-workspace/workspace.js | Rendering, navigation and accessible interaction wiring |
| docs/design/deal-workspace/model.js | Deal projections, validation and local state transitions |
| docs/design/deal-workspace/fixtures.js | Explicitly synthetic journeys, personas and adverse states |
| docs/design/deal-workspace/build.mjs | Deterministic standalone HTML assembly |
| docs/reference/ui/crm/PPO-Deal-Workspace-r01.html | Issued interactive design artifact |
| docs/testing/evidence/deal-workspace-r01/ | Actual checks, captures, manifests and limitations |

These are proposed paths for the build, not files created by this report. Issued rNN references will remain stable; editable sources will use versionless names under the repository’s conventions.

### 15.2 Preview integration

Two arbitrary downloaded HTML files do not share JavaScript memory. Therefore the design package will support:

1. An independent Deal Workspace HTML for focused review.
2. An integrated preview host that mounts Board and Workspace against the same synthetic store and navigation adapter.

That host will prove board/detail synchronisation and return behaviour. Cross-file links will carry safe fixture identifiers, not a whole mutable deal in a URL.

The standalone r01 will use session memory by default and clearly explain reset-on-refresh behaviour. Persistent browser caching of customer information will not be introduced casually. Existing r36 will remain usable until the extraction and integrated host have been verified.

### 15.3 Application integration

After the design has been reviewed and runtime work is authorised, the same composition will be implemented in the existing Next.js/TypeScript application route.

The current modular architecture, CRM reads, typed services, command hooks, shared record components and PostgreSQL integrity rules should be reused. The workspace does not justify a new framework, microservice or parallel CRM backend. Cross-domain requests should use existing transaction/outbox conventions where applicable. [Architecture decision][architecture]

The UI can be decomposed into a header, facts/stage strip, tab container, tab sections and shared inspection panel. The server projection will supply current permissions and allowed actions; the client must not infer authority from a stage name or preview persona.

### 15.4 Proposed read contract

The workspace needs a primary opportunity projection and separately loadable related sections:

- Stable opportunity ID/reference, version, pipeline definition/version and stage identity.
- Sales outcome, current/original ownership and allowed actions.
- Customer/site/contact links and explicit unknown reasons.
- Need/scope, expected value and close date.
- Designated next activity and separate activity/task summaries.
- Exact linked commercial/document/handover references.
- Source freshness, completeness and safe error state per supporting section.

Existing fields and endpoints should be reused first. Any additional projection fields or commands will be specified as contract extensions and tested. New task, probability, rotting, correspondence and receiving features must not be presented as existing database capabilities simply because the HTML can demonstrate them.

## 16. Build sequence and deliverables

| Phase | Work | Reviewable result |
|---|---|---|
| 1. Reconcile | Map every embedded r36 feature to current runtime and CR-01; record gaps and owner boundaries | Feature/field/action matrix and source manifest |
| 2. Extract and compose | Create maintainable source; build identity, facts, stage strip, tabs and panel | Clickable workspace skeleton within the correct shell boundary |
| 3. Complete core work | Implement synthetic information/scope edits, activities, tasks, ownership and navigation | Coherent daily sales journey with shared preview state |
| 4. Add connected context | Add estimates/quotes, correspondence, documents, contacts and handover summaries | Exact linked-source and receiving demonstrations |
| 5. Add adverse states | Validation, stale versions, denied reads, partial sources, uncertain results and returned handovers | Reviewable recovery journeys |
| 6. Verify and polish | Model checks, native-browser journeys, keyboard/reflow checks and capture review | Evidence attached to the exact generated HTML |
| 7. Issue design package | Publish r01 HTML, detailed companion, source/decision and maintained reference entries | Reproducible design handover with explicit remaining work |
| 8. Integrate runtime separately | Implement bounded slices at the existing route, with database/API/permission checks | Actual application evidence and separately recorded acceptance |

The reference index, document register, status and receiving decision should be updated together when the design is actually issued. This report does not reserve a migration, claim owner acceptance, merge a PR or deploy the application.

A calendar estimate would be premature before the extraction and gap map are complete. The useful first milestone is a fully navigable CR-01 design with a proven Board ↔ Workspace round trip, followed by the complete commercial and recovery journeys.

## 17. Acceptance and verification plan

The build will be assessed against user outcomes, not just whether buttons respond.

| Check | Passing behaviour |
|---|---|
| Canonical identity | Board, List, snapshot and workspace refer to the same deal |
| Return context | Pipeline, view, filters, search, sort and useful position are restored |
| Saved-change reconciliation | A moved/closed deal is reconciled without silently clearing filters |
| Long-content layout | Long titles, names and stage labels remain readable without page overflow |
| Existing behaviour preservation | Every retained r36 detail feature has a working destination or documented deferred boundary |
| Deal edits | Valid saves update the shared projection; invalid inputs remain in the form |
| Stage transition | Current movement/evidence rules apply through every entry point |
| Pipeline rename/configuration | Stable identities preserve record/history meaning; configuration-version issues are explicit |
| Probability | Calculation, unknown value, omitted state and feature-off behaviour agree |
| Rotting | Threshold boundary, reset events and independent activity warnings agree |
| Ownership | Opportunity transfer does not silently reassign activities, tasks or handover accountability |
| Activities/tasks | Owners, due meanings and completion outcomes remain distinct |
| Brief handover | Submission and returned clarification preserve exact source versions |
| Commercial alternatives | Optional estimates are not double-counted or silently adopted as deal value |
| Quotation acceptance | Revision/options remain exact; later revisions do not inherit acceptance |
| Won/Lost | Required evidence/reasons, terminal guards and retained stage are respected |
| Receiving work | Won produces the truthful handover state; no implied project/order creation |
| Documents/correspondence | Exact revision, audience and private/filed distinction are respected |
| Permission loss | Restricted content, counts and sensitive drafts are removed safely |
| Concurrent edits | Proposal survives; retry follows review of the current version |
| Uncertain result | Reconciliation returns the original result without duplicate effect |
| Partial failure | Supporting failure does not masquerade as zero or erase the primary deal |
| Responsive/keyboard | Key journeys work at target widths, with visible focus and reliable panel/dialog return |
| Reload semantics | Preview reset and later application persistence match their stated behaviour |

For the HTML, tests will cover meaningful model invariants and native-browser journeys, with exact-source screenshots reviewed. Runtime integration will additionally require applicable API/database, permission, concurrency and persistence checks.

No new Deal Workspace r01 tests have been run because this turn produces the build report. Earlier r36 model/DOM results do not prove the future workspace. The earlier local browser restriction also means the new build must obtain actual native-browser evidence through an available approved test environment before claiming visual verification.

## 18. Recommended defaults and decisions to resolve during implementation

The following defaults allow the design to proceed without interrupting the user for minor choices:

| Topic | Recommended r01 decision |
|---|---|
| Placement | Dedicated Sales detail workspace; no new top-level rail item |
| Scope ID | Retain CR-01 and its existing parent requirements |
| Base | Extract and improve the r36 detail experience |
| Tabs | The eight tabs in section 6, with contacts always accessible |
| First view | Overview focused on next action, customer need and blockers |
| Pipeline settings | Shared with the Board; one configuration source |
| Probability | Stage-derived only; no ad hoc deal override in r01 |
| Rotting | Match the documented r36 preview basis, then formalise the runtime event/day contract |
| Outcome rules | Preserve current runtime rules until a deliberate contract change |
| Ownership | Keep deal, activity, task and receiving responsibilities distinct |
| Shared modules | Summary and direct links in CR-01; full decisions remain with their owners |
| Preview persistence | Session-only standalone plus integrated shared-state host |
| Shell | Workspace-only interior, compatible with the host shell; reconcile PR #224 at build start |
| Proposed extras | Do not make AI, automation, live email or ERP integration a dependency of r01 |

Before runtime implementation, resolve: operational pipeline configuration/versioning; required qualification evidence; forecast policy; exact rotting events/time boundary; task persistence and activity relationship; scope-location cardinality; receiving contracts; and permissions for the additional commercial/message/document projections.

These decisions do not block the requested report or the proposed visual design. They identify the points where application behaviour must be specified rather than guessed.

## 19. Source record and traceability

### Repository and local provenance

- Repository: deanrfiedler-gif/powerplants-one.
- Main inspected at aa94dcdcb1dd08798be240325857c3d32d04af02, associated with the 17 September 2026 merge of PR #222.
- Deals r36 local design SHA-256: 918f8c54798d7844ce5b16d5d8cf3b9ff5a6b25940bca94563a3b9cb978b06f1.
- Theme/style board r20 Git blob: 462dac4943fb4350cf5739787a1d29e7e096716d.
- PR #223 inspected head: ac0f7abbf22bd7b96c85aa4ec97479830ec65fe2, open.
- PR #224 inspected head: f71f936069bd0f520fe029b0cf16f485c98bad41, open.
- PR #225 inspected head: 3a2593f47e6c496f808bd35a0b93ba143dcbde33, open.

The report’s new layout, tabs, field extensions and build sequence are recommendations. Existing behaviour is attributed to the current runtime and delivery records. Source links below are pinned to the inspected main commit; PR links identify separately reviewed work in progress.

### Primary references

1. [Existing opportunity route][route] and [CRM screen source][runtime].
2. [Current commercial and files components][commercial] and [deal controls][controls].
3. [Current pipeline definitions][stages].
4. [CRM accepted scope and blueprint][blueprint].
5. [CRM outcome implementation and limits][outcomes].
6. [CRM owner-transfer implementation and limits][transfer].
7. [HTML reference index][index] and [page coverage register r06][coverage].
8. [HTML module conformance standard][conformance].
9. [Theme/style board r20][theme] and [shared UI specification][style].
10. [Prototype architecture][architecture].
11. [Customer 360 design and receiving boundary][customer360].
12. [Quotation approval/issue/distribution][quoteissue], [response/negotiation][quoteresponse] and [item resolution/conversion][conversion].
13. [Cross-module approvals PR #223][pr223], [Application Shell PR #224][pr224] and [Estimate Review PR #225][pr225].

[route]: https://github.com/deanrfiedler-gif/powerplants-one/blob/aa94dcdcb1dd08798be240325857c3d32d04af02/src/app/%28business%29/crm/opportunities/%5Bid%5D/page.tsx
[runtime]: https://github.com/deanrfiedler-gif/powerplants-one/blob/aa94dcdcb1dd08798be240325857c3d32d04af02/src/components/crm-screens.tsx
[commercial]: https://github.com/deanrfiedler-gif/powerplants-one/blob/aa94dcdcb1dd08798be240325857c3d32d04af02/src/components/opportunity-commercial.tsx
[controls]: https://github.com/deanrfiedler-gif/powerplants-one/blob/aa94dcdcb1dd08798be240325857c3d32d04af02/src/components/crm-deal-controls.tsx
[stages]: https://github.com/deanrfiedler-gif/powerplants-one/blob/aa94dcdcb1dd08798be240325857c3d32d04af02/src/crm/stages.ts
[blueprint]: https://github.com/deanrfiedler-gif/powerplants-one/blob/aa94dcdcb1dd08798be240325857c3d32d04af02/docs/blueprints/BP-03-crm.md
[outcomes]: https://github.com/deanrfiedler-gif/powerplants-one/blob/aa94dcdcb1dd08798be240325857c3d32d04af02/docs/delivery/crm-owned-outcomes-handover.md
[transfer]: https://github.com/deanrfiedler-gif/powerplants-one/blob/aa94dcdcb1dd08798be240325857c3d32d04af02/docs/delivery/crm-owner-transfer-runtime-handover.md
[index]: https://github.com/deanrfiedler-gif/powerplants-one/blob/aa94dcdcb1dd08798be240325857c3d32d04af02/docs/reference/ui/README.md
[coverage]: https://github.com/deanrfiedler-gif/powerplants-one/blob/aa94dcdcb1dd08798be240325857c3d32d04af02/docs/reference/ui/module-page-register/PPO-HTML-Page-Coverage-Register-r06.html
[conformance]: https://github.com/deanrfiedler-gif/powerplants-one/blob/aa94dcdcb1dd08798be240325857c3d32d04af02/docs/standards/html-module-conformance.md
[theme]: https://github.com/deanrfiedler-gif/powerplants-one/blob/aa94dcdcb1dd08798be240325857c3d32d04af02/docs/reference/ui/theme-style-board/powerplants-one-theme-style-board-r20.html
[style]: https://github.com/deanrfiedler-gif/powerplants-one/blob/aa94dcdcb1dd08798be240325857c3d32d04af02/docs/standards/ui-style-specification.md
[architecture]: https://github.com/deanrfiedler-gif/powerplants-one/blob/aa94dcdcb1dd08798be240325857c3d32d04af02/docs/decisions/ADR-0003-prototype-architecture.md
[customer360]: https://github.com/deanrfiedler-gif/powerplants-one/blob/aa94dcdcb1dd08798be240325857c3d32d04af02/docs/decisions/customer-360-workspace-design.md
[quoteissue]: https://github.com/deanrfiedler-gif/powerplants-one/blob/aa94dcdcb1dd08798be240325857c3d32d04af02/docs/decisions/quotation-approval-issue-distribution-design.md
[quoteresponse]: https://github.com/deanrfiedler-gif/powerplants-one/blob/aa94dcdcb1dd08798be240325857c3d32d04af02/docs/decisions/quotation-response-negotiation-design.md
[conversion]: https://github.com/deanrfiedler-gif/powerplants-one/blob/aa94dcdcb1dd08798be240325857c3d32d04af02/docs/decisions/item-resolution-conversion-design.md
[pr223]: https://github.com/deanrfiedler-gif/powerplants-one/pull/223
[pr224]: https://github.com/deanrfiedler-gif/powerplants-one/pull/224
[pr225]: https://github.com/deanrfiedler-gif/powerplants-one/pull/225

