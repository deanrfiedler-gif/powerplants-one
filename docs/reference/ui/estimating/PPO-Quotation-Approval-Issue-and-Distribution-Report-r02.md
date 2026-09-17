---
document_id: PPO-ES05-REPORT
title: Quotation approval, issue and distribution — feature and design report
revision: r02
date: 2026-09-16
owner: Dean Fiedler
status: Proposed interactive design; owner visual acceptance and application integration pending
source_commit: 9921be2439ca479135482c51fbf3ed4b28615f37
---

# Quotation approval, issue and distribution

## Design conformance and r02 change record

| Required package declaration | This issue |
|---|---|
| Existing scope ID | **ES-05 — Quotation approval, issue and distribution**; existing register identity retained |
| Primary r20 page type | **Review / comparison** for exact approval decisions |
| Supporting r20 page types | **Register / worklist** for quotations and issues; **Document & evidence workspace** for customer output; Record detail for retained evidence |
| Reused components | Workspace page title, quotation context strip, scoped tabs, named state badges, metrics, register/cards, action footer, 292 px supporting column, native decision dialogs, 448 px inspection panel; r03 customer document components |
| Incoming boundary | Approved source estimate and exact selected scope, terms and template; source approval remains a separate decision |
| Outgoing boundary | Frozen issue bytes, SHA-256, exact issue/revision identity and recipient evidence to ES-06; no customer acceptance created here |
| Retained baseline | Supplied r20 and customer quotation r03 remain unchanged; ES-05 r01 remains an issued historical comparison |
| Departures / proposals | Bounded iframe preview retains independent document scrolling; simplified source quotations show only evidenced content, without inventing r03’s detailed clauses or taxes. These are scoped design choices, not a new application baseline |
| Delivery and acceptance | New r02 design is delivered for review. Native visual, device and owner acceptance remain separate |

The user authorised correction of ES-05 before creation of ES-06. The correction removes the additional app masthead, replaces the centred **Basis snapshot** dialog with a right-side inspection panel, and replaces the former independent output styling with r03 customer document components. Approval, issue and distribution guards are retained. Centred dialogs remain for decisions, including reasons and confirmations; they are not used as the default snapshot inspection surface.

The source r03 attachment and repository reference are byte-identical, SHA-256 `7ee657ef0f78d905486e9227a0821d88f86beddc9e13b872202b4095e2b6fe9a`. Its complete customer stylesheet and original embedded logo are reused by the deterministic builder. This is reuse of a known presentation, not an assertion that the ES-05 sample contains r03’s full commercial dataset.

The r20 composition study distinguishes source-backed patterns from proposed page layouts. Selecting its Review / comparison and Document & evidence types does not itself approve every measurement as a universal application standard. The [module conformance standard](../../../standards/html-module-conformance.md) requires each later package to state its own selection and departures.

r02 uses a separate local-storage key from ES-05 r01, preserving any earlier r01 demonstration state without rewriting its retained outputs.

ES-05 and ES-06 are separate standalone design files with different clearly labelled synthetic datasets. This package does not implement automatic record synchronisation, an issue import service or authenticated customer links between them. Their exact receiving contracts are documented; no acceptance is transferred between their examples.

## 1. Purpose and delivered package

This report describes the **ES-05 Quotation approval, issue and distribution** module for Powerplants One. Its purpose is to answer three practical questions: **What exactly are we approving? Which quotation revision has been released? What evidence do we have that each intended recipient received it?**

The companion [interactive HTML workspace](PPO-Quotation-Approval-Issue-and-Distribution-r02.html) presents six connected views, fictional quotation records, guarded demonstration actions and local recovery. It is a self-contained file: the styling, Roboto fonts, supplied corporate logo and demonstration logic are embedded. No network service is needed to display the module. Browser support for local storage and Web Crypto is required for the full demonstration; file-origin behaviour can vary, so an approved local static preview server is an alternative where available.

This is a proposed module design, not the application implementation of commercial approval or customer distribution. Existing E1/E2 draft generation remains governed by its maintained contracts. No existing quotation design, issued reference, application baseline or commercial policy is replaced by this package.

## 2. Authority, references and scope

The design was prepared against repository `main` at `9921be2439ca479135482c51fbf3ed4b28615f37`, after inspecting AGENTS, README, STATUS, BP-04, the E1 contract, the E3 decision pack, quotation-builder design, document issue/distribution contract, shared UI specification and current HTML index. The supplied r20 theme board was inspected directly.

| Source | Application to this module |
|---|---|
| [BP-04 Estimating and Quotation](../../../blueprints/BP-04-estimating-quotation.md) | Separate estimate and quotation reviews; exact source revisions; controlled issue; customer-safe output; state locks and source freshness |
| [E1 contract](../../../contracts/estimating-e1.md) | Existing bounded manual estimate and exact Draft output; no claim that this design extends the runtime |
| [E3 decision pack](../../../delivery/estimating-e3-decision-pack.md) | Approval authority, self-review policy, pricing rules and operative terms remain unresolved |
| [Document issue and distribution contract](../../../contracts/document-issue-distribution.md) | Distinct output preparation, actual issue, distribution and response evidence; preserved bytes and recovery |
| [Quotation Builder specification](../../../blueprints/quotation-builder-design.md) | Customer-safe source/content controls and separation of broader builder design from existing Draft generation |
| [r20 theme board](../theme-style-board/powerplants-one-theme-style-board-r20.html) | Navy/green tokens, embedded Roboto, review and document layouts, supporting context, responsive adaptation and visible feedback |
| [Coverage register r06](../module-page-register/PPO-HTML-Page-Coverage-Register-r06.html) | ES-05 is the named page scope. This package supplies a proposed design; the issued planning register is preserved |

Attachment provenance: `powerplants-one-theme-style-board-r20(3).html`; SHA-256 `c68a499e857b1705d47bd6598d4b2e89526bf0861a0d234394c3da023f19b617`. The staff workspace retains the embedded fonts from that attachment. Customer document branding and its embedded logo come from the byte-identical r03 reference.

The relevant parent requirements are **EST-03** (revisions and options), **EST-07** (separate approvals and current authority), **EST-08** (exact quotation output and controlled issue), with **OUT-06** as the customer quotation output. The design supports the intent of BP-04's EA-01/09/10/11/12 and AT-01/03/05/26/36; these parent acceptance procedures have not been executed or closed by this work.

## 3. Workspace structure

The workspace begins with its local page title; the separate app-style masthead from r01 has been removed. Product navigation, app branding and global search belong to the shared application shell. The page contains its name, explanatory line and a Basis snapshot action. A persistent quotation context strip shows the readable reference, revision, lifecycle state, release hold when applicable, title, organisation, site/facility, owner and amount with AUD/excluding-GST basis.

All six views retain the selected quotation. The main work area occupies the available width, while a 292 px supporting column shows the exact source basis and recent events. The preview follows the theme board's module-interior composition: the application rail and global search are intentionally left to the shared application shell, rather than reproduced as non-functional navigation.

| View | Primary question | Main content |
|---|---|---|
| Overview | What needs attention next? | Summary filters, next action, release readiness and searchable quotation worklist |
| Source & output | What exact offer is being reviewed? | Source estimate, scope, exclusions, terms, template and complete customer HTML output |
| Approval | Has the quotation itself been reviewed? | Readiness evidence, reviewer confirmations, return reason or exact approval |
| Issue register | Which revisions have been released? | Issue reference, actual release evidence, retained output, fingerprint and supersession |
| Distribution | What happened for each recipient? | Preparation, simulated submission, delivery/acknowledgement evidence and reconciliation |
| Revision history | What changed, and what remains valid? | Retained revisions, value/source/content comparisons, reasons and evidence inspection |

The footer contains a collapsible demonstration control area for role selection, simulated newer source versions, JSON export and reset. A banner makes the fictional/local nature and save status visible throughout.

## 4. Overview and worklist

Four summary cells act as filters: **Awaiting approval**, **Release held**, **Distribution follow-up**, and **Current issued offers**. They count different things deliberately: approval/hold counts concern working quotations; distribution follow-up counts unknown/failed recipient records; current issues can remain valid while a newer draft is being prepared.

The Next action panel links to review, issue or distribution according to the selected quotation's state. Release readiness presents the source approval/freshness, scope/terms/template configuration, exact output inspection and separate quote approval. Each row combines a text explanation with an explicit state; colour is supplementary.

The worklist searches quotation reference, customer and title. The same records are represented as a desktop table and phone cards. Selecting a quotation changes all views and context. Filters can be cleared, and an empty result provides a recovery action. Amounts always retain cents, currency and the excluding-GST basis. They are fictional source amounts represented in integer minor units; the module does not introduce tax, discount, FX or margin calculations.

## 5. Exact source estimate and scope

Each quotation revision records its source estimate reference and version, scope text, exclusions, assumptions, quotation value, terms reference and text, template identifier, validity date, supply/programme statement and preparation time. The latest available source version is shown independently from the version captured by the quotation.

A source estimate approval is evidence required before quotation approval. It is **not** the quotation approval. Missing source approval creates a visible hold. The primary fixture uses an approved synthetic source so the end-to-end design journey can be explored; it is not evidence of an implemented estimate approval service.

A simulated newer estimate never refreshes the existing quote automatically. Submitted or approved content requires a reasoned successor. An existing Draft has a **Review source update** action: it compares the current/latest references, explains the effect, requires a reason and clears output inspection when adopted. In this bounded fixture, the source-version change preserves the source amount and does not calculate new prices. A real receiving implementation must compare complete authorised source snapshots before adopting changed content or values.

Draft scope, exclusions and the template version can be edited through a dialog. Required fields are validated. Editing clears the exact output inspection and reviewer confirmations. Submitted, approved and issued revisions cannot be edited through that action.

## 6. Terms, template and customer content

The selected terms reference and complete fictional terms text are part of the generated output. The template has its own identifier and version, separate from the quotation revision. The specimen includes the customer and contact, addressed facility context, scope, amount, exclusions, assumptions, validity, indicative programme and source/template references.

The sample terms are explicitly fictional and non-operative. They demonstrate what it means to retain exact content; they do not establish legal terms, payment policy, delegated commercial authority or customer agreement. The programme statement is also fictional. Operative clauses, approved contact blocks, payment milestones, taxes and release conditions require separate source evidence and approval.

Customer-safe HTML contains no internal purchase cost, margin, supplier allowance or approval routing detail. The customer document reuses the supplied r03 Powerplants Australia masthead and logo. Its customer, site, scope, terms and synthetic preparer are projected from the selected ES-05 record. It does not copy Riverbend’s amounts, tax, payment schedule or legal clauses into unrelated quotations.

## 7. Output preview and integrity

The Source & output view provides the complete generated HTML specimen in a sandboxed viewer. In r02, the preview uses the retained r03 customer stylesheet and embedded brand assets, quotation heading, overview metrics, information cards, supporting summary and print rules. The exact selected ES-05 content replaces the previous simplified document. Its toolbar distinguishes review output from retained issue bytes and permits an HTML download. The viewer is an HTML document surface; it is not a production PDF renderer. Long documents may scroll within this bounded viewer.

The browser calculates a real **SHA-256** fingerprint of the exact HTML string encoded as UTF-8. Mark output inspected records that fingerprint for the selected revision. Quote approval is bound to the same fingerprint. At issue, the design recalculates and compares it before retaining the HTML and hash with the release record. No post-issue stamp is inserted into the retained document: actual release time is evidence in the issue register, separate from the document preparation timestamp.

On loading a saved issue, the script verifies its retained bytes against its stored hash. A mismatch prevents the normal workspace from being initialised and directs the user to export/recovery. This is useful demonstration integrity, not a tamper-resistant audit service: all local data remains editable outside the UI. Production requires server-controlled storage, permissions, transactions and retention.

## 8. Quotation approval

Approval concerns the exact customer quotation, including commercial narrative and output. The Reviewer demonstration role is separate from Preparer and Issuer. The three confirmation statements cover source/scope/amount, terms/validity/template, and complete customer-safe output.

Approval requires the selected revision to be Submitted, an approved/current source, configured demonstration policy, inspected output and all three confirmations. A confirmation dialog requires a decision note. The resulting record retains actor, time, note, output hash and the demonstration policy identifier. It changes the state to Approved but creates neither an issue nor a distribution record.

Return with reason records a correction request owned by Alex, the synthetic preparer. A reason is mandatory and the submitted basis remains retained. The correction proceeds through a successor Draft; the returned revision is not overwritten.

The role selector is a simulation control, not authentication. Real reviewer grants, delegation, self-review restrictions, authority revocation, commercial thresholds and scope rules remain open decisions in the repository. No numerical approval threshold is invented here.

## 9. Issue register and controlled release

Issue requires the Approved state, current release prerequisites, an unchanged approved output and the Issuer demonstration role. A dialog identifies the quotation, revision, recipient organisation and amount, and requires explicit confirmation of the release basis.

A successful issue creates a readable synthetic issue reference, actual release timestamp, actor, exact HTML and SHA-256. Earlier current issues for that quotation become Superseded and receive an event explaining the successor. Their stored bytes, approval records, distribution history and responses remain intact.

Repeated issue confirmation does not create another release: the first action changes the state, and later attempts fail the expected-state guard. This is local command assurance only; concurrent server requests require durable original-operation receipts and database constraints.

The register provides **Retained output** and **Issue evidence** downloads. The evidence export includes quotation/source/content references, minor-unit value/currency/tax basis, approval, release metadata/hash, recipient records and events. Issued does not mean Sent, Delivered, Acknowledged or Accepted.

## 10. Recipient preparation and distribution

Prepare distribution is available for the working issued revision when no new release hold is present and the current demonstration role is Issuer. The dialog captures recipient name, synthetic email, channel and explicit confirmation of recipient plus exact issue. Email addresses must end in `.example`, preventing this specimen from becoming an accidental live-address workflow.

Channel choices are Email, Customer portal and Manual handover. They illustrate record classification; none connects to an email provider, portal, delivery service or customer device. Each record retains a readable distribution reference, original identity, issue relationship, recipient, channel, attempt count, state, owner and timestamped evidence events. The displayed subject contains the synthetic quotation reference and revision; it makes no claim about an established MYOB opportunity key.

Duplicate preparation for the same recipient/channel on one issue is rejected. The user is directed back to the original record to inspect or reconcile it. This bounded design does not provide routine re-sending after a confirmed successful submission; a future resupply policy must distinguish deliberate re-supply from accidental duplicate delivery.

## 11. Distribution states and recovery

| State | Evidence represented | Available progression |
|---|---|---|
| Prepared | Recipient and exact issue selected and checked | Simulate submission outcome |
| Sent | Synthetic submission receipt recorded | Record separate delivery evidence |
| Unknown | No reliable outcome for the original operation | Reconcile original operation; no retry |
| Failed | Fixture confirms no submission was accepted | Prepare a retry under the same distribution identity, with incremented attempt |
| Delivered | Evidence that the specific output reached the recipient | Record explicit receipt acknowledgement |
| Acknowledged | Recipient confirms receipt of the specific revision | Retain evidence; no automatic commercial acceptance |

The outcome dialog offers confirmed submission, interrupted/unknown outcome and confirmed no-effect failure. Reconciliation requires a description/reference for the observation; it can leave the outcome Unknown, establish Sent or establish Failed. It retains the original operation identity. Retry is available only after confirmed failure and preserves all earlier events.

Delivered and Acknowledged each require an evidence note. Acknowledgement cannot be recorded directly from Sent in this demonstration. Customer acceptance, rejection, option selection, negotiation and order conversion belong to the separate ES-06/receiving processes. This module does not create them or authorise work.

Historical recipient records remain visible under their own revision. Superseded revisions cannot receive new distribution actions. Changed source context prevents new distribution of the working issue until its release hold is resolved; existing delivery outcomes can still be reconciled to preserve factual history.

## 12. Revisions, comparison and supersession

The history view shows revision, state, value, source, terms, template and reason. Adjacent revisions are compared for value, source, scope, exclusions and terms/template. Each revision has an evidence dialog and, where issued, a retained output download.

Creating a successor requires the Preparer role, a reason and confirmation of predecessor treatment. A pending review or unissued approval is explicitly Withdrawn, with an event. An issued predecessor stays Issued while the new draft is prepared and becomes Superseded only when the new approved revision is released.

The successor receives a new revision number and preparation time. It uses the latest source reference and copies draftable content for review. It starts with no approval, issue, distribution, customer response, output inspection or reviewer confirmations. Copying a draft basis therefore does not transfer commercial authority or recipient acknowledgement. An existing Draft is edited or explicitly adopts a new source rather than creating uncontrolled parallel drafts.

## 13. Demonstration records

| Reference | Customer and location | Initial working state | Purpose |
|---|---|---|---|
| SYN-PPO-QUO-0247 r03 | Northbank Horticulture; Bundaberg, Greenhouse 2 | Submitted; AUD 127,500.50 ex GST | Main review/issue journey; earlier r02 issue and acknowledgement retained |
| SYN-PPO-QUO-0248 r01 | Hillview Propagation; Childers, Propagation House 1 | Draft; AUD 28,750.00 ex GST | Unapproved source blocks release |
| SYN-PPO-QUO-0249 r01 | Riverbend Nursery; Gin Gin, Propagation House | Issued; AUD 43,825.00 ex GST | Unknown distribution outcome requires original-operation reconciliation |
| SYN-PPO-QUO-0250 r01 | Coastal Berry Farm; Maryborough, Irrigation Shed | Draft; AUD 69,450.00 ex GST | Missing release authority/terms policy is visible |

These are fictional organisations, people, facilities, prices, source reviews and receipts. The demonstration date is **16 September 2026** for validity evaluation. User-triggered events use the actual browser time and are displayed in **Australia/Brisbane (AEST)**. Initial history uses fixed fictional timestamps. This design preview does not silently turn into an operational expiry engine as time passes.

## 14. Demonstration capabilities

| Capability | Preparer | Reviewer | Issuer | Read only |
|---|---|---|---|---|
| Inspect displayed content / download existing evidence | Yes | Yes | Yes | Yes |
| Record output inspection | Yes | Yes | No | No |
| Edit Draft / adopt newer source / create successor / submit | Yes | No | No | No |
| Confirm review / approve / return | No | Yes | No | No |
| Issue / prepare distribution / record and reconcile outcomes | No | No | Yes | No |
| Change source fixture | Yes | Yes | Yes | No |

These proposed responsibilities illustrate the requested workflow. They do not assign actual employees or grant permissions in PPO. Read only describes demonstration business commands, not the ability to switch demo roles or manage the disposable local demonstration.

## 15. Persistence, error handling and recovery

Successful local actions save the demonstration under a module-specific local-storage key. Selection, filters, selected view, role, revisions and event evidence survive reload in the same browser origin. Saving is labelled **Saved locally**, distinguishing it from server persistence or synchronisation.

Malformed/unrecognised saved data is not overwritten silently. A fresh session is shown with a recovery warning; the unread original entry remains until the user explicitly resets. A storage write failure keeps the in-memory work available and warns that it is session-only. Export demonstration record downloads the currently loaded state for inspection; the prototype does not provide import/merge recovery.

A storage-change event from another tab makes the current tab read-only and disables role switching, directing the user to reload and inspect the saved state. This is a conservative demonstration hold, not database concurrency control. Reset uses a confirmation dialog and replaces this module's local synthetic state only. Embedded fonts and logo make retained issue files substantial; repeated revisions can reach browser storage limits, which must remain a visible save failure. A production solution needs optimistic concurrency, durable receipts/outbox, transactional audit, recoverable drafts and explicit unsent evidence handling.

## 16. r20 visual alignment and accessibility intent

| Design element | Applied treatment |
|---|---|
| Core palette | Navy `#242a37`, green `#62bb46`, workspace `#f5f6f8`, white panels and pale neutral surfaces |
| Typography | r20 Roboto for the staff workspace; the retained r03 embedded Roboto and original customer stylesheet for the document |
| Geometry | 24 px desktop / 16 px phone workspace padding; 6 px controls; 7–8 px panels; 292 px support; 448 px desktop inspection panel, full-width on phone |
| Review layout | Working evidence first, related source/history alongside it; explicit action areas |
| Document layout | Customer output and source controls in the primary column; exact basis visible alongside |
| State styling | Named state tags with text, icon/dot and tone; warning/hold descriptions include next action |
| Phone adaptation | Support stacks below work; metrics form two columns; register becomes cards; tabs scroll horizontally |
| Controls | Named buttons and form labels; visible focus; keyboard tab navigation; native modal focus containment; Escape/cancel returns focus |
| Feedback | Persistent local-save status, field/dialog errors and live status/toast messages |

The page includes a skip link, tablist/tab/tabpanel relationships, Left/Right/Home/End tab navigation, labelled output iframe and native dialogs. Long hashes and content wrap. The customer HTML uses escaped user-entered content and a sandboxed viewer. External fonts, analytics and network calls are absent.

These are implemented design features and responsive CSS intentions. Native desktop/phone rendering, keyboard operation, zoom and assistive-technology behaviour remain **unverified** because the available cloud browser blocked local preview access. This report does not claim visual acceptance, WCAG conformance, tagged PDF or PDF/UA support.

## 17. Suggested walkthrough

1. Open the HTML and select **Source & output** for Northbank r03. Read the complete offer, then choose **Mark output inspected**.
2. Open **Approval** as Reviewer, complete the three confirmations and record an approval note. Observe that it is Approved but not yet Issued.
3. Expand **Demonstration controls**, select Issuer, open **Issue register** and confirm issue. Inspect the retained output and issue evidence. Earlier r02 becomes Superseded.
4. Open **Distribution**, confirm the synthetic recipient and prepare a local record. Simulate Unknown. Observe that retry is unavailable.
5. Reconcile the original operation with evidence of confirmed failure, prepare a retry and simulate confirmed submission. Record delivery evidence, then receipt acknowledgement. Observe that no quotation acceptance is created.
6. Change to Preparer and create a successor with a reason. Inspect the new Draft and retained earlier evidence. It inherits no approval or acknowledgement.
7. Simulate a newer source. Review and adopt it into the Draft, inspect its changed output and submit it for fresh review.
8. Use the Overview worklist to inspect the blocked source and missing-policy examples. Export the demonstration or use Reset to return to the fixtures.

## 18. Verification and limitations

The supplied [command/state assurance script](../../../testing/quotation-release-r02-model-check.cjs) runs the actual embedded HTML script under a Node VM with a small DOM adapter. **24 groups passed**, covering all view functions, exact SHA-256, approval/issue preconditions, required notes, duplicate commands, synthetic recipient validation, Unknown recovery, separate delivery/acknowledgement, immutable predecessor output, clean successors, draft changes, explicit source adoption, reload persistence, missing source/policy, read-only commands, cross-tab hold, malformed storage, save failure, return reasons, empty search and separate docked basis inspection. Source checks also confirm that the global masthead is absent and the customer preview uses r03 layout components.

This verification executes commands and state transitions; it is not a browser engine and does not verify layout or native focus. [Recorded evidence](../../../testing/quotation-lifecycle-verification.md) gives actual assurance results and the browser limitation. The repository foundation, prototype and naming checks are run against the reconstructed source snapshot plus this contribution; their results are recorded there. No database, application endpoint, live integration or complete parent acceptance procedure is claimed by these design checks.

## 19. Production receiving contract

Before application integration, specify and review the following bounded requirements:

- Server-authorised actor and record scope for source visibility, draft edit, quotation review, issue, distribution and recovery. Recheck current authority at every command and every evidence retrieval.
- Immutable source estimate/scope/terms/template versions and canonical output/content identities. Preserve original E1/E2 Draft bytes and version contracts.
- Exact role/delegation and self-review policy; pricing review criteria; approved terms, validity and output definitions; final PDF/HTML rendering and customer-safe content checks.
- Expected-version checks, an idempotent original-operation receipt, and atomic review/issue/audit/outbox transactions. Persist exact files before release and reconcile uncertain storage outcomes.
- Authoritative document storage and retention, intended SharePoint ownership and verified adapter behaviour. No SharePoint path or API is invented here.
- Verified recipient identity, channel authority, sender identity, provider submission/delivery semantics, manual evidence provenance, attachment validation and no automatic duplicate send after Unknown.
- ES-06 response links that name exact issue/revision and prevent inherited acceptance. Separate sales/order/project handover and MYOB ownership from quotation release.
- Integration with notification-owned actions, document recovery and audit, plus current/stale context, revoked permissions, competing reviews/issues and interrupted responses in real browser/database tests.

## 20. Outstanding decisions and next bounded step

Owner review should first confirm the corrected workspace-only presentation, docked inspection, retained r03 document components, source/output clarity, role/action placement, supersession behaviour and phone treatment. Visual/device acceptance is outstanding. Commercial policy decisions remain with the owner and business reviewers; the sample actors and terms are not proposed as an approved operational delegation or legal template.

The companion ES-06 design now extends the retained r03 customer experience. The next application implementation step remains a separately specified synthetic quotation review/issue slice on the existing exact Draft output foundation. Define the reviewed source and policy contract, exact output retention, server permissions and command recovery before adding provider distribution. No deployment, customer communication, live ERP transaction or migration is authorised or performed by this design package.
