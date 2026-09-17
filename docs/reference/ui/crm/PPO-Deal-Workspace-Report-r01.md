---
document_id: PPO-DEAL-WORKSPACE-REPORT
title: Deal Workspace — Detailed Design Report
revision: r01
date: 2026-09-17
owner: Dean Fiedler
status: Authorised standalone design; owner acceptance and application integration separate
---

# Powerplants One — Deal Workspace r01

**Scope:** CR-01 — Opportunity detail and internal work  
**Module:** Sales  
**Artifact:** [PPO-Deal-Workspace-r01.html](PPO-Deal-Workspace-r01.html)  
**Source:** [Maintainable design package](../../../design/deal-workspace/README.md)  
**Evidence:** [Verification and limitations](../../../testing/evidence/deal-workspace-r01/README.md)

## 1. Purpose and result

Deal Workspace r01 provides a dedicated place to understand and progress one sales opportunity. It turns the direction in the approved build report into a self-contained interactive HTML, while retaining the distinction between a sales record and its related estimating, quotation, customer and delivery records.

The workspace has eight views: Overview, Scope & sites, Activities, Tasks, Estimates & quotations, Correspondence, Documents and History. Six synthetic opportunities provide different stages, owners, incomplete information, returned estimating work, exact quotation revisions and a Won handover obligation.

A compact Board/List preview shares the same in-memory deal model. Users can open a deal, edit it, return to their selected view and see the changed record without a second copy of the deal data. This harness demonstrates the navigation contract; the complete r36 Deals Board remains a separate, unchanged reference.

This is a design package. It adds no application route, schema, migration, network adapter or live transaction. The intended application destination remains the existing /crm/opportunities/[id] route within Sales.

## 2. Conformance and source authority

| Required declaration | r01 implementation |
|---|---|
| Scope identity | CR-01, Opportunity detail and internal work, from page coverage register r06. Parent requirements CRM-02, CRM-03, CRM-04, CRM-05, CRM-07 and CRM-08 are retained |
| Page type | r20 Record detail, supported by Form / guided workflow and Document & evidence workspace; the navigation harness is a limited Register / worklist |
| Reused visual components | PPO navy/green palette, Roboto font assets and SVG icon set from the existing Customer 360 source package; r20 local identity/context, tabs, facts, form and docked inspection patterns |
| Reused interaction direction | r36 full deal page, snapshot, task/activity separation, document revision handling, waiting-on, estimating intake and delivery-planning concepts |
| Source authority | User-authorised build following the Deal Workspace build report; inspected main aa94dcdcb1dd08798be240325857c3d32d04af02; r36 and r20 remain design sources with their own authority |
| Incoming context | Stable deal ID, version, current owner, pipeline/stage identity, customer/site links, exact quote/document references and simulated identity capability |
| Outgoing context | Versioned synthetic deal changes, owned work, captured intake submissions and an unsent receiving preparation; actual receiving decisions remain domain-owned |
| Recovery | Retained validation input, known failure, stale comparison/retry, lost-response reconciliation, partial supporting reads, denied/read-only views and returned intake |
| Departures | Eight tabs reorganise r36’s detail content; contacts are a persistent supporting view; a compact shared Board/List replaces no existing full board functionality |
| Verification | Model, DOM and native-browser evidence are recorded separately. Native-device, screen-reader and business acceptance remain separate |

The issued HTML embeds a metadata manifest with the base commit and source hashes. r36 input SHA-256 is 918f8c54798d7844ce5b16d5d8cf3b9ff5a6b25940bca94563a3b9cb978b06f1. The inspected r20 Git blob is 462dac4943fb4350cf5739787a1d29e7e096716d.

The existing modular Next.js/TypeScript application remains the runtime destination. The standalone HTML uses the same dependency-free browser-script approach as neighbouring design modules. No new application technology or dependency is introduced.

## 3. Page composition

The workspace is an application interior. It does not duplicate the global navigation rail, logo, account controls or global search. The small review strip identifies Sales, the design revision and the review guide.

| Region | Information and behaviour |
|---|---|
| Local identity | Back to Deals, permanent synthetic opportunity reference, title, organisation, site, sales outcome and current editability |
| Action group | Snapshot, Edit deal, Add activity and More deal actions |
| Key facts | AUD value excluding GST, weighted value or explicit unavailability, expected close, deal owner, forecast category and designated next activity |
| Stage strip | Shared pipeline name, stage names, current stage, days in stage and contextual help |
| Tabs | Eight local sections with selected-tab semantics and keyboard navigation |
| Main area | Broad primary column and supporting column, stacking at narrower widths |
| Docked panel | Exact record/evidence inspection and spacious edit forms |
| Decision dialog | Short confirmations such as stage changes, filing a draft or discarding unsaved work |
| Feedback | Inline validation/recovery messages and non-blocking save notifications |

The main content uses one page scroll. Tabs stay available as content scrolls. Longer panels scroll their body while retaining their heading and decision buttons. Document/PDF inspection can use a contained viewer.

Visual treatment follows the supplied PPO palette and font direction: navy #242a37, green #62bb46, white cards, restrained neutral surfaces, compact labels and clear monetary alignment. Status also uses text, so colour is not the sole signal.

## 4. The six example opportunities

All names, addresses of correspondence, values and evidence references are fictional. Email addresses use example.invalid.

| Example | Starting position | What it demonstrates |
|---|---|---|
| Berry fertigation expansion | Scoping; Kate Morgan; AUD 185,000.00 | Two growing areas, an overdue customer follow-up, rotting, a draft brief and an outstanding water-analysis dependency |
| Greenhouse climate upgrade | Negotiation; Kate Morgan; AUD 127,500.50 | Issued quotation revision 2, a newer draft revision 3 and alternative estimates |
| Automated dispatch line | Closing; Kate Morgan; AUD 89,500.00 | Exact accepted revision/options, controlled Won decision and receiving preparation |
| Irrigation system renewal | Discovery; Jordan Price; value unknown | Unknown contact/site scope, no designated activity and incomplete commercial information |
| Propagation monitoring package | Quoting; Kate Morgan; AUD 42,800.00 | Returned estimating brief requiring sensor-layout clarification |
| Heating plant replacement | Won, retaining Closing; Kate Morgan; AUD 214,000.00 | Captured closing accountability, handover due and exact accepted basis |

The fixture clock is fixed at 17 September 2026 for reproducible review. The interface identifies that date and uses Brisbane/AEST for timed activity display. Browser reload restores the starting examples.

## 5. Overview

Overview brings the sales conversation and the next responsible action together.

The first card displays the designated next customer activity: purpose, type, owner, due date and overdue state. The owner can record its outcome; the deal owner can plan or revise the action. When none is designated, the card explicitly says that the next action is needed.

The main column also contains the customer objective, production context, selected scope locations, advisory stage guidance, unresolved questions and recent changes. These are linked to their detailed sections.

Supporting cards contain customer/primary-contact context, estimating and quotation progress, waiting-on information and deal-health explanations. Won records additionally show the receiving obligation.

Every warning includes its reason. The module does not turn unknown information into a reassuring score or automatically mark a record Lost.

## 6. Scope & sites

This view includes:

- Customer need and desired outcome.
- Inclusions, exclusions, assumptions and unresolved questions.
- Primary organisation and site context.
- Available growing areas/facilities and which are selected for this deal.
- Crop/production context and working window.
- Customer-requested date.
- Versioned Sales-to-Estimating brief.
- Sourced delivery-planning comparison.
- Destination previews for survey, installed equipment, site access and Engineering.

Editing scope changes the working CRM brief. It does not rewrite previously submitted intake snapshots or an issued quotation. Scope locations retain stable identities, and selecting an area does not grant access or establish readiness.

The shared organisation/site masters are not edited from this form. An opportunity with an unconfirmed site is shown honestly; the user cannot manufacture a master site by typing a label into the deal.

The delivery comparison adds supply, transport and installation calendar-day durations to a proposed order date and compares that with the customer-requested date. It identifies the supplier-evidence reference and confirmation date. The illustrative freshness rule is 30 days; older evidence requires confirmation. This is a planning comparison, not a booking, stock reservation or promised delivery date.

## 7. Activities and Tasks

### Activities

Activities represent customer or relationship work. Supported preview types are Call, Meeting, Visit, Technical follow-up, Supplier follow-up and Email.

Each activity contains purpose, owner, due date, optional AEST time, status, completion outcome and whether it is the designated next action. Blank time means date-only work. Blank date explicitly means Date needed; a timed activity requires a date.

The view filters all, open or completed activities. Planning a new designated action clears the previous designation while retaining the existing activity. Completion requires an outcome and is available only to that activity’s assigned preview identity.

Recording completion updates the deal’s meaningful activity timestamp. It does not change stage, sales outcome, quotation acceptance or message delivery.

### Tasks

Tasks represent internal deliverables. They have a title, description, owner, due date, priority, status, blocking reason and related milestone.

The module supports creation, editing and completion, with open/blocked/completed/all filters. A Blocked task requires a reason and must be moved out of Blocked before completion. Completion retains a note and timestamp.

Task ownership remains separate from deal ownership. Task changes and completion do not reset the rotting timer or fulfil the designated customer activity. A My Work destination preview explains how the same source task would appear in its owner’s queue.

## 8. Estimates & quotations

The commercial view shows a compact progression across brief, estimate, quotation, response and receiving work, followed by exact estimate and quotation records.

Alternative estimates identify reference, option, saved revision, owner, status and value. Their totals are not added together. A deliberate “Use for deal value” comparison allows the user to adopt an exact source value into the CRM forecast, with a reason. The source estimate remains unchanged.

Quotation rows identify exact revision, option, amount, issue state and response. Inspection distinguishes:

- Approval recorded for that revision.
- Whether it has been issued.
- Distribution evidence.
- Validity.
- Customer response.
- Exact acceptance evidence, person, time and selected option.

The Closing fixture carries accepted revision 2 and a newer draft revision 3. The draft does not inherit the earlier acceptance. The receiving basis uses the accepted revision rather than whichever document happens to be latest.

The workspace does not edit estimate quantities, approve discounts, issue a quotation, collect a signature or convert an order. Dedicated destination panels explain and link to the relevant existing design references for Estimating, estimate review, ES-05, ES-06 and ES-07.

## 9. Estimating brief lifecycle

The intake demonstration supports a meaningful receiving journey:

| State/action | Effect |
|---|---|
| Draft | The sales owner records estimator, requested review date and note |
| Submit | Requires customer need, selected scope location, review date and explicit acknowledgement |
| Submitted basis | Captures deal version, scope, selected location IDs, exact document revisions and submission time |
| Accept | The named estimator records a receiving review note; status becomes Accepted for estimating |
| Return | The named estimator gives a reason; the submission remains in history |
| Revise | The sales owner starts a new numbered draft after a return or acceptance |
| Later scope edit | Changes working scope only; the earlier submitted basis stays intact |

Kate Morgan and Alex Chen are separate review identities. Switching personas in the review guide allows the receiving path to be exercised without presenting a generic “approve anything” action to the salesperson.

The workflow is explicitly synthetic. It prepares the application contract and layout; it does not submit to a live estimating service.

## 10. Correspondence and contacts

Correspondence supports filed sample emails, private unsent drafts and filed internal communication notes.

The user can prepare an individual email to a linked contact, save the private draft and deliberately file it against the deal. Filing changes its visibility within the synthetic deal view; it never sends the message. Private drafts are omitted when reviewing as another identity.

The internal synthetic opportunity reference is used in the sample subject. The module does not invent a MYOB opportunity number. A future mapped MYOB reference can support the agreed subject convention when the mapping actually exists.

Draft, filed and sent are separate concepts. No “sent”, delivered, acknowledgement or customer-acceptance state is manufactured by saving a note or draft.

Contacts remain accessible from Overview and the Manage contacts panel. The user can inspect shared identity/contact details, record participation role, mark engagement and select the primary contact. Identity edits remain with People. A contact’s role does not prove authority to sign or spend.

## 11. Documents and evidence

The document view includes search, category filtering and an explicit option to show superseded revisions. Rows show title, filename, revision, source, audience, date and status.

The docked viewer identifies the exact reference and revision. Embedded example documents are synthetic text evidence, including issued-versus-draft quotation examples and current-versus-superseded survey observations. These files are not represented as production quotation PDFs.

Local attachments support PDF, PNG, JPEG, WebP and UTF-8 plain text. The file extension must agree with a supported signature; text must decode as UTF-8. Limits are 10 MB per file and 50 MB across the session. Duplicate bytes on the same deal are rejected.

Images and PDFs use a temporary browser object URL; text is escaped and rendered as text. Users can download the exact inspected file. Object URLs are released when the panel closes.

Uploaded supporting files always remain Attachments. They do not become an issued quotation or a SharePoint record. Reload removes local files along with other session changes.

## 12. History, probability and health

History can be filtered by event type and searched by change, person or reason. Each event records the actor, fixed preview time, resulting deal version and explanation. Stage, ownership, commercial, task, activity, document and handover events remain distinguishable.

The workspace records original and current deal owners separately. Source references and creation context remain visible in the provenance card.

Probability follows the current stage:

**Weighted amount = known deal value × stage percentage, rounded to cents.**

Unknown value stays unpriced. Omitted deals and closed outcomes are excluded from open weighted totals. When the feature is off, the interface reports that probability is off and retains configured percentages.

Rotting uses days since the last deal information/scope update, stage change, adopted value or completed activity. A future planned activity, task change, owner transfer, waiting-on edit or pipeline configuration change does not reset it. It flags at the configured threshold, not one day afterwards.

Other independent warnings include missing next activity, unknown activity date, overdue activity, expected close passed, unknown value and blocked/overdue internal tasks. These reminders do not alter the sales outcome.

The shared pipeline settings panel supports pipeline/stage names, global probability and rotting switches, individual stage percentages and rotting thresholds. Stable stage IDs survive renaming. Percentage bounds are 0–100; day thresholds are whole numbers from 1 to 3,650.

Adding, deleting, reordering or creating pipelines remains with the full r36 Board editor. The r01 navigation harness deliberately does not reproduce that complete administration surface. Its current stage semantics retain Discovery → Scoping → Quoting → Negotiation → Closing.

## 13. Ownership, sales outcomes and receiving work

Opportunity transfer compares the current and proposed eligible owner, requires a reason and shows outstanding activity responsibility. It changes the deal owner only. Activities, tasks, estimates and captured closing accountability are retained.

The outcome design follows the implemented application boundary:

- Won is available only from the stable Closing stage identity.
- Lost is available from any open stage.
- Won requires acceptance or order evidence.
- Lost uses Price, Competitor, Timing or No decision.
- The stage remains recorded after closure.
- There is no reopening, second outcome or stage movement after closure.
- Independent permitted information corrections cannot rewrite the captured outcome basis.

Won creates Handover due, with closing owner, exact outcome version, time and evidence. When an accepted quotation exists, its exact revision, selected option and amount are captured separately from the newer draft.

A receiving preparation records proposed route, proposed queue/owner and unresolved matters. It preserves the Won and accepted-commercial basis and can be downloaded as synthetic JSON. The preparation is clearly marked not sent or accepted. The original Handover due status stays unchanged. Duplicate preparation against this fixture obligation is refused.

No project, work order, sales order, ERP operation, customer message or delivery booking is created. Further receiving acceptance/return and conversion remain with CR-03 and the appropriate downstream module.

## 14. Cross-module boundaries

| Source or destination | r01 presentation | Ownership retained |
|---|---|---|
| Customer 360 / Customers / Sites / People | Context links and contact participation | Shared identity, hierarchy, company mappings and permissions |
| Equipment / Survey / Site access | Contextual destination panels | Asset identity, observations, applicability and readiness |
| My Work / Email & Calendar | Linked task/activity/communication context | Queue, provider, appointment and sending behaviour |
| Sales → Estimating | Exact synthetic submitted brief and receiving decision | Independent estimator responsibility |
| Estimating / Estimate Review | Exact alternatives and source review destination | Costs, quantities, margin exceptions and review |
| ES-05 / ES-06 | Exact quotation and acceptance summaries | Approval, issue, distribution and customer response |
| ES-07 | Conversion-context destination | Mappings, original operation and ERP/order conversion |
| Engineering / Projects / Service | Proposed receiving context | Technical approval, programme, service authorisation and booking |
| Documents / SharePoint | Exact revisions, viewer and temporary attachments | Business document authority and source access |
| CRM opportunity route | Planned implementation destination | Server permissions, transactions, persistence and audit |

Destination panels name the source deal/version/customer/site and explain the receiving boundary. They are explanatory previews, not operational modules loaded behind the scenes. Existing reference links open separately so the current deal remains available.

## 15. Board, List and browser navigation

The compact harness demonstrates shared record identity rather than a new full Deals release. It provides Board/List switching, customer/title/reference search, owner, stage and outcome filters, known-value and weighted summaries, cards, snapshots and detail navigation.

Editing the workspace changes the same model rendered by the worklist. Back to Deals retains filters, view, vertical position and horizontal board position where applicable. If an outcome or stage change removes the record from the retained filter, the interface explains the disappearance instead of clearing the filter.

Browser Back follows the same record routes. A dirty or unresolved command requires the user to finish/discard/reconcile before leaving. Direct links identify the deal by stable fixture ID and the selected tab; title changes do not break them.

The full r36 Board’s drag/drop, bulk actions, saved views, column resizing, insights, triage and complete stage administration remain unchanged and outside this harness. Application integration must connect to the actual worklist context, including its cursor and saved-view contracts.

## 16. Editing, access and recovery

| Situation | Implemented treatment |
|---|---|
| Invalid input | Error in the form with proposed values retained |
| Known save failure | No mutation; input remains ready for retry |
| Concurrent change | Current title/value/version comparison plus deliberate retry against the new version |
| Lost response | Server simulation records the effect, the displayed draft freezes, and the original operation is reconciled once |
| Reused operation with different data | Refused by the model |
| Revoked/currently ineligible actor | Current authority is checked before mutation or original-receipt replay |
| Dirty cancel | Keep editing or explicitly discard |
| Read-only identity | Editing controls unavailable; permitted inspection remains |
| Supporting source failure | Commercial/documents show unavailable rather than empty/zero |
| Denied primary read | Record-dependent title, references, values and actions are omitted |
| Reload | Restores fixtures, removing all session work and attachments |

The four preview identities are Kate Morgan and Jordan Price as sales owners, Alex Chen as estimator, and Riley Brooks as read-only. A sales owner edits their own deal; an activity/task owner completes their own work; the named estimator reviews a submitted brief.

These are simulated capabilities. The standalone file necessarily contains synthetic fixtures in its source and is not an authentication or data-security boundary. Actual application integration must derive permissions and projections on the server.

The model uses copied state, expected versions and original-operation receipts. A failed validation does not partially mutate the source state. External integrations are not simulated as automatically successful.

## 17. Responsive behaviour and accessibility

The two-column workspace stacks as width narrows. Key facts reduce from five columns to three and then two. On phones, actions wrap, tabs scroll within their own row and stage labels stay within the stage strip.

Board uses stage columns on desktop and a vertical stage sequence on phone. List changes to labelled record cards at narrow widths. The evidence panel fills the available phone viewport.

Keyboard users can navigate tabs with arrows, Home and End; dialogs use native focus containment and Escape handling. Closing returns focus to the initiating control where it still exists. A skip link goes to the main tab content.

Forms retain visible labels and error summaries. Status is conveyed by words and colour. Document text and user-entered content are escaped. Long names and narratives wrap rather than expanding the page.

The target review widths are 1440, 1024, 768, 390 and 320 pixels. Exact native-browser captures and results are recorded in the evidence folder once verified; physical devices and independent assistive-technology review remain separate.

## 18. Source structure, verification and integration

The package has versionless editable sources:

| File | Responsibility |
|---|---|
| template.html | Workspace frame, accessible panel and metadata placeholders |
| fonts.css / icons.json | Retained shared assets |
| fixtures.js | Six fictional opportunities, people, documents and exact commercial bases |
| model.js | Pure validation, permissions, calculations and copied-state commands |
| workspace.css | Scoped composition, panels and responsive treatment |
| workspace.js | Rendering, forms, navigation and simulated transport/recovery |
| build-deal-workspace.py | Deterministic standalone HTML assembly |
| check-deal-workspace-model.mjs | Meaningful domain/integrity checks |
| check-deal-workspace-browser.mjs | Native interactions, adverse journeys and responsive captures |

The HTML needs no server, fonts CDN, network request, installation or browser storage. It opens directly in a browser. A simple local server or repository CI is used for native verification and download testing.

At the initial build checkpoint, 31 model groups and 14 local DOM-adapter groups passed. The local Chromium process was blocked by the execution environment’s socket restriction; that is not browser-layout evidence. The dedicated repository workflow supplies native-browser verification. The maintained evidence record is the authoritative source for the final tested HTML hash, source commit, run and capture review.

The application integration should reuse the existing /crm/opportunities/[id] route, CRM reads/commands, shared record components and architecture. This design introduces no runtime shortcut around the existing permission, version or terminal-outcome guards.

## 19. Retained differences and next implementation work

The design is deliberately truthful about these boundaries:

- Session memory is demonstrated; durable application saves and CRM offline support are not added.
- Cross-module previews explain destinations but do not connect live services.
- Embedded quotation examples are text evidence, not full production quotation output.
- Customer/contact/site master creation and reassociation remain with their shared modules.
- Full pipeline creation and stage addition/deletion/reordering stay in the existing r36 Board editor.
- The compact Board/List proves shared data and return behaviour; it does not replace the complete Board.
- Receiving preparation is not submission, acceptance, order conversion or delivery readiness.
- No email is sent, no ERP record is created and no SharePoint upload occurs.
- Reopening/archive and broader accepted CRM scope remain tracked work requiring explicit runtime contracts.
- Native device, screen-reader, owner design acceptance and integrated business acceptance remain separate.

The next implementation increment is to apply the reviewed CR-01 composition to the current opportunity route while preserving actual server contracts. New task, probability/rotting, correspondence and receiving projections should be adopted in bounded slices with their own current-authority and persistence evidence.

