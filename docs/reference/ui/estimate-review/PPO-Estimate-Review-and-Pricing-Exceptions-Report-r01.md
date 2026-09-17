---
document_id: PPO-ES04-REPORT
title: Estimate Review and Pricing Exceptions — Feature and Design Report
revision: r01
date: 2026-09-17
owner: Dean Fiedler
status: Proposed standalone design; owner acceptance and application integration separate
source_commit: e1b705acc5457dab6fc0b6a2f0c977132cbd2215
---

# Estimate Review & Pricing Exceptions

## 1. Purpose and delivered package

The [ES-04 interactive HTML](PPO-Estimate-Review-and-Pricing-Exceptions-r01.html) provides a dedicated internal workspace for reviewing an estimate before its approved basis moves into quotation preparation. It answers six practical questions: which submission needs attention; exactly what is being priced; whether quantities and costs have evidence; which pricing departures need a decision; whether corrections have been independently checked; and what evidence is ready for the quotation owner.

The package includes six connected views, five fictional estimate cases, four preview identities, browser-local persistence, source and save-recovery scenarios, right-side evidence inspection, revision comparison, and an exact internal handover download. Editable source files and a deterministic builder accompany the portable HTML. This report describes the implemented design, its controls and its receiving boundaries; it does not claim application delivery or an adopted commercial policy.

The scope is the existing **ES-04 — Estimate review and pricing exceptions** in the r06 page coverage register. It supports BP-04's existing E3 cost-source, policy and estimate-review direction. It introduces no new parent requirement, estimating sequence, application route, database migration or external integration.

## 2. Position in the estimating journey

| Boundary | Evidence entering or leaving ES-04 | Ownership retained elsewhere |
|---|---|---|
| ES-02 scope and options | Customer, site, named growing areas, selected option and scope revision | Discovery, alternative selection and scope authoring |
| PD-03 / ES-03 supplier pricing | Exact cost source, currency, unit, date, validity and mapping context | Supplier-source maintenance and review; catalogue publication |
| ES-08 specialist configuration | Quantity and run references where a configured estimate uses them | Formula validation, generated parts, overrides and safe rerun |
| ES-04 internal review | Cost/quantity checks, findings, independent conclusion, pricing dispositions and estimate approval | This workspace's proposed domain boundary |
| ES-05 quotation lifecycle | Exact approved estimate basis and prepared receiving package | Quotation content, terms, approval, issue and distribution |
| SH-06 approvals inbox | Reference to the specific estimate and revision needing review | Aggregated tasks and navigation; no universal approval command |

The ES-03 and SH-06 sources inspected for this contribution are open design PRs, not merged or accepted runtime interfaces. The ES-04 cases are independently authored examples. Opening one does not import a supplier-pricing session or synchronise an inbox item. The report and design record retain those distinctions explicitly.

## 3. Scope and r20 design conformance

| Required declaration | ES-04 r01 treatment |
|---|---|
| Scope identity | ES-04, r06 HTML Page Coverage Register; BP-04 EST-03/04/05/07, with EST-02/06/08 receiving context. All 78 existing parent IDs are preserved. |
| Primary page type | r20 **Review / comparison** |
| Supporting page types | **Work queue + persistent detail**, **Register / worklist**, **Document & evidence workspace** and bounded correction forms |
| Reused visual components | Workspace interior header; contextual strip; green active-tab underline; navy actions; white cards; restrained status pills; two-column comparisons; definition-list metadata; 448 px right-side evidence snapshot; short native decision dialogs; responsive table-to-card treatment |
| Reference editions | Theme/style board r20; ES-05 r02 workspace boundaries; PD-03/ES-03 r01 price/source presentation; SH-06 r01 review navigation; existing notification font bundle |
| Incoming evidence | Exact submitted estimate, scope/option, source snapshots, quantities, document applicability, preparer, reviewer and supplied policy/authority |
| Outgoing evidence | Separate independent review, revision-bound exception decisions and estimate approval; prepared internal ES-05 package |
| Exceptions and recovery | Unknown or expired sources, missing policy, returned work, changed source, incomplete reads, read-only identity, failed local save, concurrent saved-state change, corrupt storage and stale links |
| Declared departures | ES-04-specific six-tab organisation and 320 px queue column; phone layouts stack the selected detail below the queue. Fictional policy enables a labelled end-to-end demonstration without adopting operational thresholds. |
| Acceptance | Proposed composition only; no change to the accepted UI baseline register. Exact verification results are recorded separately. |

The workspace contains no application rail, logo, global search or competing application masthead. Those remain shell-owned. All module CSS is scoped beneath `#ppo-estimate-review`; Roboto is embedded for portability, with Verdana and sans-serif fallbacks. Semantic colours use the r20 navy `#242a37`, green `#62bb46`, pale page surface, restrained borders and separate information, warning, success and error treatments.

## 4. Review queue

The opening page presents four summary cards: awaiting review, needing attention, returned and approved estimates. Awaiting review includes submitted work and draft corrections. Attention means evidence, source-scope or policy gaps in the available examples; it is not an operational risk score. Approved estimates remain distinct from quotations approved for issue.

Search matches the readable estimate reference, title, customer, site and named growing areas. The status filter supports all records, submitted, returned, draft corrections, approved and needs attention. A no-match state retains a clear-filter recovery action. The selection automatically follows the visible result set so the detail pane cannot silently describe an estimate excluded by the current search.

Each queue card shows its current review state, exact revision, project description, customer, site, principal growing area, due date and count of unresolved findings. Missing due dates display **Date needed**. Overdue classification uses the labelled fixture date of 17 September 2026 rather than the reader's machine date.

Persistent detail contains the estimate reference/revision, selected option, site and growing-area tags, known cost or complete cost total, proposed sell, margin/markup availability, up to three immediate evidence issues, preparer, reviewer, submission date, review due date, policy status and next owner. The principal action opens the exact cost-basis view. A secondary action opens its evidence snapshot.

In partial-source mode, the unavailable Riverbend record is removed from the queue and record picker. Summary counts are labelled as covering available records only, and write actions are paused. Failed, empty and denied states have distinct messages and do not present invented zero counts.

## 5. Exact scope and cost basis

The scope card identifies customer, site, named growing areas, chosen commercial option, included scope, exclusions, assumptions and source revision. A scope check records that the reviewer inspected the exact inclusion and location context; it is not a permission to attend site or perform work.

The quantity/cost register includes parts, labour, installation, freight, commissioning, allowances and an explicitly excluded line. Each row exposes description, category, included/excluded status, source title, quantity/unit, extended cost, net sell and line-review status. Its source button opens a docked snapshot rather than replacing the working context.

The snapshot contains estimate revision, source and source revision, source date, valid-through date, quantity basis, quantity/unit, unit cost, unit sell, discount, extended cost and net sell. The authored extract and absent original supplier document are clearly disclosed. It also explains the calculation convention and that the example does not apply additional currency conversion or landed-cost uplift.

Incomplete or expired lines cannot be marked checked. A checked line can be reopened while the revision remains submitted; reopening invalidates the completed independent review. Scope checking and line checking are deliberately individual actions, allowing an unresolved line to remain visible.

The commercial side panel shows source completeness and links directly to pricing exceptions. Supporting evidence names the source brief and installation worksheet with their revisions and current status. These are fictional extracts, not embedded copies of real customer or supplier files.

## 6. Quantities, arithmetic and financial presentation

All examples are AUD excluding tax. They calculate no GST, invoice, payment, balance, revenue or stock value. Proposed sell is an estimate value, not a sale or an ERP transaction.

The model uses scaled integers for decimal input and extended-line arithmetic. Quantities accept up to three decimal places; unit monetary values and discount percentages accept up to two. Inputs must be finite non-negative decimal strings. Included quantities must be positive and discount may not exceed 100%.

| Measure | Demonstration calculation and treatment |
|---|---|
| Extended cost | Quantity × unit cost, rounded half-up to cents per line |
| Gross sell | Quantity × unit sell, rounded half-up to cents per line |
| Net sell | Quantity × unit sell × (1 − discount), rounded once half-up to cents |
| Discount amount | Difference between the summed rounded gross and net values |
| Gross profit | Complete net sell minus complete cost |
| Margin | Gross profit ÷ net sell; displayed to two decimal places |
| Markup | Gross profit ÷ cost; displayed to two decimal places |
| Total percentages | Calculated from included totals, never an average of line percentages |
| Zero denominator | Not applicable; it is not a zero percentage |
| Unknown input | Unknown or a clearly incomplete known subtotal; it is never silently converted to zero |
| Excluded scope | Retained visibly but omitted from included commercial totals |

The Northbank example starts with known costs of **$57,010.00** and proposed net sell of **$85,010.00**. Commissioning cost is unknown, so profit, margin and markup are unavailable. Supplying the fictional commissioning rate of $85 per hour for 16 hours produces a complete cost of **$58,370.00** in a successor, while the predecessor remains unchanged.

The Valley example has cost **$9,296.00**, net sell **$14,000.00** and profit **$4,704.00**. Its margin is **33.60%** and markup **50.60%**, illustrating why those measures need distinct labels.

These conventions are bounded design choices. They do not establish CREMS parity or adopt D-009, tax, FX, freight-allocation or production rounding policy. ES-03 remains responsible for providing reviewed currency, mapping and landed-cost evidence in the eventual receiving contract.

## 7. Pricing exceptions and policy gaps

The pricing page places proposed selling value beside the two distinct percentage measures. It breaks out gross sell, discount amount, cost completeness and profit, then displays the policy evidence and individual exceptions.

Four examples use the explicitly fictional **SYN-PPO-POL-ES04-DEMO r01** to make the proposed workflow reviewable. It specifies a 25% minimum margin, a 30% advisory target, review of discounts above 10%, a named synthetic approver and an expiry date. These numbers are demonstration values, not Powerplants policy or a recommendation to adopt them. Below-cost approval is blocked within this demonstration.

Coastal Berry Growers has no policy. Its pricing thresholds, discount policy, authority and delegation display **Not configured**. A reviewer may still inspect and conclude the evidence review, but the separate approval cannot proceed.

Riverbend includes a 15% lighting discount, producing an explicit exception. The independent review must be complete before Casey, the demonstration approver, can record a reasoned exception disposition. A disposition is bound to the exact commercial basis and revision. It does not itself approve the estimate. Repeated disposition of the same exception is refused.

When no threshold exception is identified, the UI does not claim pricing clearance if costs remain incomplete. Below-target margin is an advisory observation; below-minimum and discount exceptions are separate decisions. Missing policy prevents classification rather than reporting an empty exception list as compliance.

## 8. Findings, responses and independent closure

A reviewer can create a finding against overall scope or a specific line. Required information includes title, classification, accountable owner and follow-up date. The example offers Blocking and Advisory classifications. Both require a recorded response and acceptance in this bounded implementation; the classification does not silently waive a finding.

Every finding retains its local ID, originating revision, author, related line, title, owner, due date and state. Responses retain text/evidence, actor, time and response revision. Acceptance retains the reviewer's evidence and exact revision. The supported sequence is **Open → Responded → Accepted**.

The estimator records a response in a returned version or its draft successor. A response on an earlier revision cannot satisfy the successor's review. After resubmission, the reviewer inspects it and records a separate acceptance. Merely typing a response does not clear the finding, complete the estimate review or authorise approval.

Return requires a reason and preserves the submitted commercial contents. A return can be used for a broader correction even when a dedicated line finding has not been raised. The queue and findings view retain responsibility for the next action.

## 9. Corrected successors and comparison

Submitted and approved commercial lines cannot be edited directly. An estimator creates a draft successor from returned or approved work, or to reconcile a changed source scope. A reason is required.

The predecessor remains byte-for-byte identical within the saved model. The successor receives a new revision, predecessor link and change reason. Its scope and line checks are reset. It inherits no completed review, exception decisions, estimate approval or prepared handover. Unaccepted findings carry forward as open items requiring a response against the new revision; resolved predecessor findings remain inspectable in history.

Included draft lines expose quantity, unit cost, unit sell, discount, source title, source revision, valid-through date and quantity basis. Each edit requires a reason. This is a bounded correction surface: it does not add/remove products, change units, replace the estimator or regenerate specialist parts.

Before resubmission, required numerical and current-source data must be complete and carried findings must have responses. Resubmission freezes the new commercial basis for independent checking. The reviewer must inspect the new scope and lines even when most numbers are unchanged.

The right-side revision comparison shows predecessor/current revisions, change reason, previous/current net values and changed quantity, cost, sell, discount, source, source revision, validity and quantity-basis fields. A source-scope change also shows the former and new wording. If no commercial field has changed yet, that is explicitly stated; a new revision label alone is not evidence of correction.

## 10. Independent review, approval and quotation handover

The decision page presents three separately labelled steps.

**Independent review** requires current source scope, complete usable cost evidence, accepted findings and completed scope/line checks. Alex records a reasoned conclusion against the exact estimate basis. The preparer cannot perform the independent review in this authored example. Completed review leaves the estimate submitted and unapproved.

**Estimate approval** requires that exact review, a current supplied policy, the designated approving identity and dispositions for applicable exceptions. Casey records a separate approval rationale. Missing or stale evidence, missing authority and a below-cost result prevent approval in the demonstration. Approval records its own policy snapshot, actor, time, revision and exact basis.

**ES-05 handover preparation** requires an exact current approval. Preparing creates one stable handover identity for the estimate/revision and identifies Morgan Ellis as the fictional receiving quotation owner. Duplicate preparation is refused; the original package remains available to inspect or download.

Prepared, sent, received, accepted and quotation-approved are distinct facts. This file produces **Prepared** only. It performs no transmission or ES-05 acceptance and does not generate a customer quotation. Quotation terms, presentation, approval, issue and distribution remain the receiving module's work.

## 11. Exact internal handover download

The internal JSON export includes the selected estimate identity, customer/site/areas, option, exact current estimate revision, cost lines, source and document evidence, findings, independent review, policy, approval, totals and prepared handover. It includes internal cost information and is labelled for internal estimating/quotation staff, not customer distribution.

The exported wrapper contains the exact JSON content string and its SHA-256 digest. A receiver can recompute the hash of that string to check byte integrity. The digest is not a digital signature, proof of identity or substitute for current source/permission checks.

The export explicitly records that no ES-05 importer is implemented. It is a reviewable receiving contract example. Downloading the package does not mark it sent, update the approvals inbox or make a business transaction.

## 12. History and navigation

History groups events by retained estimate revision and shows state, scope revision, net sell, approval and handover status. The timeline records submission, scope/line checks, findings, return, successor creation, draft edits, response, acceptance, independent review, exception decisions, approval and handover preparation.

Every event contains actor, timestamp and detail. Dates are presented in Australian English with Brisbane time context. The original synthetic events remain distinguishable from new browser-session actions through their actor and event text.

The six tabs support mouse/touch interaction and Left/Right/Home/End keyboard navigation. Record selection persists while changing tabs during the session. The queue preserves its search and status filter. A supplied hash link can address `estimate` and `revision`; an outdated revision pauses decisions, and an incomplete or unavailable target receives a distinct unavailable-link surface. No link operation completes a review.

## 13. Preview identities and permissions

| Preview identity | Demonstrated capability |
|---|---|
| Alex Morgan — Reviewer | Inspect the evidence; check scope/lines; raise findings; accept responses; complete independent review; return submitted work |
| Riley Chen — Estimator | Create permitted successors; edit included draft lines; respond to findings; resubmit corrections |
| Casey Taylor — Approver | Apply the explicit fictional policy; record exception dispositions; approve the exact estimate; prepare the handover |
| Jordan Lee — Read only | Inspect internal review information without changing the workflow |

Changing identity does not itself write business state. Read-only controls are disabled and the model independently rejects disallowed commands. These are illustrations over a complete synthetic file: a static HTML file cannot enforce confidentiality or prevent inspection of its embedded data. A production receiving implementation must enforce capabilities and company/site/record scope on the server, including reads, aggregates, files, history and exports. Real employees and departmental authority are not assigned by these examples.

## 14. Persistence, recovery and source states

The preview saves business changes to a versioned browser-local record only after the local storage operation succeeds. Submitted decisions and drafts survive reload where that browser supports storage for the opened file or origin. It is not multi-user storage or an offline estimating implementation.

Before writing, the controller compares the last read saved bytes with the current storage value. A concurrent change pauses saving. A failed save retains the proposed next state without advancing the displayed accepted business state. Retry saves that same proposal once, provided the original basis has not been replaced. Another-tab events and command-time checks both expose conflicts. The comparison is useful browser-local protection, not a server transaction guarantee.

Malformed saved data is not silently overwritten. The UI offers original-data download, reload and an explicit reset of the synthetic workspace. A reset confirmation explains that local review changes will be removed. Review export provides a separate way to retain the accepted workspace. There is no general JSON import feature in this revision.

Preview options expose current, partial, failed, loading, empty, denied and source-changed states, plus an illustrative saving state. A separate failed-save option exercises actual proposal retention and retry. The displayed saving scenario performs no hidden write. In denied mode, the main view clears the example details and normal workspace export is refused; this remains presentation evidence rather than actual authorisation.

## 15. Fictional cases and review paths

| Case | Starting condition | Useful demonstration |
|---|---|---|
| Northbank Nursery, Bundaberg | Screen retrofit r03; missing commissioning cost and an owned finding | Return → successor → line correction → response → resubmit → independent acceptance → fresh review |
| Valley Glasshouses, Maryborough | Pump replacement r02; complete cost sources, no initial finding | Scope/line checks → independent review → separate approval → prepared ES-05 handover |
| Coastal Berry Growers, Gin Gin | Controls r01; missing policy/authority and review due date | Evidence review remains possible; commercial approval stays Not configured |
| Riverbend Propagation, Childers | Lighting r02 returned for installation evidence; 15% discount | Retained return, response and resubmission; separate discount-exception disposition |
| Orchard Lane Growers, Hervey Bay | Weather station r01; expired offer and changed scope | Old basis is retained; source refresh requires a successor and renewed evidence |

All customer, employee-role, commercial, policy and source details are fictional. No customer export, supplier price list, secret, live account key or operational document is included.

## 16. Responsive and accessible presentation

Desktop uses a compact review queue beside persistent detail. At narrower widths the columns stack and selecting a queue record brings the detail into keyboard focus. Phone tables become labelled rows, preserving quantity, money and action context without making the whole page scroll sideways. The six-tab strip remains horizontally scrollable where necessary.

Native dialogs provide focus containment and Escape dismissal. Source and revision inspections dock to the right at 448 px, expanding to the available phone width. Decision forms use explicit labels, required fields, retained validation messages and focus on the error. Status text supplements colour. Keyboard focus indicators, a skip link, polite save feedback and reduced-motion handling are included.

The required review widths are 1440, 1024, 820, 390 and 320 px. Exact native-browser and visual findings, including limitations, belong to the [verification record](../../../testing/evidence/estimate-review-r01/README.md). Responsive HTML does not establish physical-device, screen-reader or complete accessibility acceptance.

## 17. Verification and reproducibility

The source is retained under `docs/design/estimate-review/`; the Python builder assembles the font, scoped CSS, model and controller into one standalone HTML file. It requires no new framework or runtime dependency. The repository's existing pinned browser/runtime workflow performs the native check.

Nineteen model groups cover exact arithmetic, unknown/excluded inputs, zero denominators, role/ref/version guards, current source requirements, immutable commercial content, review prerequisites, missing policy, duplicate handover prevention, successor preservation, the full correction loop, invalid inputs, discount dispositions, review invalidation and malformed data.

The native browser procedure exercises queue/filter behaviour, the complete review/approval/handover journey, export hash integrity, successor preservation, correction/resubmission, policy gaps, read-only controls, failed-save retry, corrupt/concurrent storage, source states, all six views across five widths, snapshot focus, tab navigation and stale links. Native results are reported only after execution; planned checks are not passes. Repository foundation, prototype and naming assurance remain documentation checks rather than business acceptance.

The initial local model run passed all 19 groups. Local native verification was unavailable: the browser-install download failed and the managed preview browser rejected the localhost URL. The dedicated GitHub workflow supplies the separate native execution and screenshot evidence. See the linked verification record for the final artifact hash, exact tested commit, run outcome and visually inspected captures.

## 18. Receiving implementation requirements

Before application integration, reconcile current Estimating records and source versions rather than importing the local model as a new master. The server must own current identity, source visibility, version checks, immutable submission/approval evidence, atomic events and receipt-backed commands. A lost response must retrieve the original operation rather than mint a new approval or handover.

The operational authority matrix, self-review/delegation treatment, minimum/target/discount policies, expiry rules and any below-cost rule need supplied evidence and explicit adoption. Current supplier/company/item/unit mappings, costing policy, tax/FX and source-document access need their existing owners. Specialist source references require real accepted definitions and run evidence where applicable.

SH-06 needs an exact domain task/read contract and completion derived from the owning service. ES-05 needs a validated approved-estimate receiving contract; a local download must not be treated as trusted approval. Estimate approval must remain separate from quotation approval, customer response, work authority and ERP conversion.

## 19. Material limitations and open decisions

This delivery is a standalone design package, not a deployed feature. It adds no live MYOB, SharePoint, supplier, email or calendar connection. It performs no issue, communication, booking, stock reservation, payment, ERP transaction or migration.

The fixtures do not settle operational pricing, authority or commercial rules. Source extracts have no original attachments. The bounded draft editor does not handle arbitrary line insertion, multiple currencies, quantity-unit conversion, advanced tax or specialist recomputation. The local state is not a secure record system, signed approval or multi-user workflow. Owner design acceptance, application integration and operational acceptance remain separate.

The next bounded step is owner review of the ES-04 composition and example journeys, followed by a scoped receiving contract under the existing E3 sequence. That future work should retain exact ES-03 provenance, ES-04 review/approval and ES-05 quotation boundaries.
