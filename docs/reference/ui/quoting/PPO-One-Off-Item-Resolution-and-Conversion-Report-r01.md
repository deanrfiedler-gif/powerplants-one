---
document_id: PPO-ES07-REPORT
title: One-off item resolution and conversion — detailed feature report
revision: r01
date: 2026-09-16
owner: Dean Fiedler
status: Authorised design package; detailed presentation and operational implementation pending acceptance
source_commit: 8d821e9d764737ab41a753c6fb72342b399428a2
---

# ES-07 — One-off item resolution and conversion

## 1. Purpose and package

[Open the companion HTML](PPO-One-Off-Item-Resolution-and-Conversion-r01.html). It is a self-contained, interactive staff workspace that takes the exact accepted quotation through item resolution, destination verification, receiving review and simulated order conversion. It preserves the original operation when a result is partial or unknown, so recovery does not imply creating a second order.

This is the existing **ES-07** scope in the [HTML Page Coverage Register r06](../module-page-register/PPO-HTML-Page-Coverage-Register-r06.html). The requested package follows ES-06 and reuses the r20 design language. It does not replace the retained customer quotation r03 or introduce a new estimating family. The earlier screen specification has its own local screen numbering; those identifiers are not silently renumbered to match this page register.

The HTML is a design demonstration with fictional records and provider outcomes. It makes no network requests to create items, change catalogue status or place orders. Its local evidence demonstrates the intended controls; it is not an authenticated audit service. The [design and receiving handover](../../../decisions/item-resolution-conversion-design.md), [build instructions](../../../blueprints/item-conversion/README.md) and [verification record](../../../testing/item-conversion-verification.md) form the rest of the package.

## 2. Scope and design conformance

| Required declaration | ES-07 r01 treatment |
|---|---|
| Scope identity | ES-07 — One-off item resolution and conversion, coverage register r06; BP-04 EST-08/EST-09 and IF-01/IF-02/IF-03 provide related receiving, item and conversion boundaries |
| Primary r20 page type | **Form / guided workflow**: five steps with explicit decisions and a persistent accepted quotation context |
| Supporting page type | **Review / comparison**: accepted source against proposed destination, quantities, prices, tax and unresolved blockers |
| Reused workspace components | ES-05 r02 workspace title and context strip, cards, status badges, table controls, support column, action bar and decision dialogs |
| Reused evidence treatment | Right-docked accepted-basis and record-evidence snapshots; centred dialogs reserved for short decisions, reasons and confirmations |
| Reused visual language | r20 Roboto, navy `#242a37`, green `#62bb46`, neutral surfaces, restrained borders, established button and field styles; shared application shell remains outside the module |
| Incoming boundary | ES-06 exact current accepted revision, selected options, response identity, amounts, issue bytes and owned prepared handover; complete supporting evidence is required before receiving approval |
| Outgoing boundary | Frozen reviewed conversion plan, one original operation, per-target results and reconciliation evidence for the receiving integration; an unresolved handover returns to ES-06 with owner and due date |
| Departures declared | Five-step composition and source/target comparison are a proposed ES-07 composition. A complete-pack attestation and destination capabilities are explicitly hypothetical fixture assumptions |
| Approval status | User authorised this package and direction. Detailed visual/device acceptance and application integration remain separate; no accepted baseline register is changed |

The presentation differs from the customer quotation because the work is sequential internal preparation. The customer document retains its own r03 masthead and signing experience. ES-07 uses the same staff workspace vocabulary as corrected ES-05, without a competing app-level header.

The support column is 292 px and the docked inspector is 448 px on suitable desktop widths, inherited from the preceding workspace. On narrow screens, forms and comparison panels stack, the inspector fills the viewport and the step navigation scrolls horizontally. Line review has a phone card presentation. These are implemented styles; native device and visual review is still open.

## 3. What the page contains

The local header identifies ES-07, design revision r01 and its purpose. Persistent context shows the quotation, revision, accepted value and receiving ownership. The five steps are **Accepted basis**, **Resolve items**, **Destination**, **Review conversion** and **Conversion evidence**. Previous/continue controls support a linear walkthrough, while direct step navigation allows inspection of the whole case. Navigation does not bypass action guards.

Support cards surface readiness, required next decisions and explanatory context. Amber blockers link back to the responsible step. Status text distinguishes resolved items, known unsynchronised effects, uncertain effects, prepared conversion and confirmed target results. Colour supplements text rather than carrying the entire meaning.

A demonstration section contains the role selector, upstream supersession simulation, case export and explicit scenario reset. The top banner makes the fictional nature and local save state visible. There are no operational connection settings or invented live ERP endpoints.

## 4. Accepted quotation basis

The initial scenario derives its acceptance through the **actual ES-06 response model**, using the retained Riverbend R02 issue and valid permitted selections. It is a generated example, not a claim that a customer signed a real quotation. The accepted basis retains:

- quotation and revision, issue identity and exact issued-output SHA-256;
- response operation, time, signatory name, position and represented customer;
- selected options, included scope, quantities, net amounts, discount and totals;
- the original ES-06 handover identity, owner and preparation state;
- source currency, terms/lead-time context, currentness and completeness provenance.

The docked snapshot keeps this information available from every step. A basis check needs an observation and the Resolver capability. It is evidence of a check; it cannot manufacture missing source files or transfer an acceptance to a successor revision.

### Demonstration amounts

| Exact accepted component | Value |
|---|---:|
| Net accepted amount | AUD 154,566.67 |
| GST | AUD 15,456.67 |
| Total including GST | AUD 170,023.34 |
| Separately retained project discount | AUD −4,500.00 |
| Default included commercial lines | 10, including selected root-zone scope and the discount |

The existing pump selection is zero-delta context, not an additional supply line. Unselected weather scope does not enter conversion. A different permitted ES-06 selection changes included target lines and exact amounts through the source model rather than by editing the conversion screen.

The eight-zone valve line is a useful precision case: the accepted AUD 1,866.67 requires **AUD 233.33375 per zone** to preserve its amount at quantity eight. A fictional target with five-decimal unit support can represent it. Choosing the two-decimal comparison profile creates a blocker. ES-07 neither rounds the accepted amount nor hides a compensating difference elsewhere. This is a compatibility check, not a claim about verified MYOB field precision.

### Complete scenario versus imported evidence

The supplied customer reference names supporting documents whose actual files are unavailable. The default scenario contains a clearly labelled **hypothetical complete-pack attestation** solely to exercise the complete conversion journey. Its evidence still records that actual attachment files were not supplied. This is not a completion claim about the retained r03 source.

The **Import ES-06 handover** action accepts the JSON produced by ES-06’s “Export prepared handover”. It checks the scope/design identifiers, exact issue-byte hash, original source projection, valid response state, accepted amounts and selections, original receiving handover, and absence of unresolved negotiation or revision requirements. Altered content, unsupported response qualifiers and mismatched acceptance evidence are refused before replacing the case. This version supports the retained Riverbend R02 fixture and its permitted selections; it is not a general-purpose quotation importer.

Imported handovers do not contain the supporting files. Their completeness remains **missing**, conversion remains blocked and there is no UI override. A claimed attachment flag inside JSON does not remove that hold. The imported exact issue can be downloaded for inspection and is not executed inside this module. Imports are held after item effects or conversion preparation, and the case is rechecked after asynchronous file validation.

## 5. Item resolution

The item register compares each included accepted line with its destination binding. It presents source identity and description, quantity/unit, accepted net amount, mapping status and available resolution action. An unresolved filter narrows the work. Item snapshots retain the chosen target, destination company, resolution method and evidence.

The fixture includes unresolved one-off lines and an inactive catalogue candidate. Resolution supports four distinct routes:

| Route | Behaviour and retained evidence |
|---|---|
| Bind existing item | Requires an active candidate in the exact destination company with a matching unit and an explicit mapping reason; accepted pricing remains unchanged |
| Create one-off item | Prepares a separate original item operation with its own identity, target and payload; a simulated known creation still awaits synchronisation |
| Reactivate existing item | Uses a separate reactivation operation and requires evidence that the same target is active and synchronised before binding |
| Request clarification | Records the question/reason and leaves the accepted line visibly unresolved; it does not substitute a different item or price |

Item creation and order conversion are separate operations. A known creation result is **Created, not synchronised**; reactivation has the corresponding state. Both retain the original target reference. Synchronisation requires that same reference and supporting observation. Until then, the item remains a conversion blocker.

An unknown item outcome holds retry, rebinding and destination-company changes because the provider may already have acted. Reconciliation records either discovery of the original target awaiting sync or an evidenced no-effect outcome. Only a confirmed no-effect failure can retry the same item operation. If the Resolver instead binds an existing item after a no-effect failure, the obsolete create attempt is closed so it cannot later produce a duplicate.

## 6. Company and entity mappings

The destination form captures company, external customer key, ship-to/site key, contact key, currency, tax profile and supported unit precision. It also requires the Resolver’s mapping verification note. The AU destination and NZ comparison profile are fictional keys used to exercise compatibility controls, not provisioned company configurations.

Required entity keys must match the chosen company. Currency must preserve the accepted AUD basis; no conversion rate is supplied. The fixture uses 10% GST rounded at document level, with alternative line-rounding and no-tax profiles held as incompatible. This package adopts no tax policy and performs no live tax determination.

Before external effects, changing company clears item bindings and the active receiving approval so every mapping is reviewed against the new destination. After known or uncertain item effects, a company change is held. Invalid profiles are rejected before they can partially clear state.

Destination edits are staged until saved. Leaving the form asks whether to discard unsaved changes; changing the demonstration role is held until those edits are saved or discarded. A saved mapping change produces a new proposal version. Earlier receiving decisions remain in history even when their approval is no longer current.

## 7. Conversion review and receiving decision

Review presents the accepted source beside the proposed destination, followed by detailed source-to-target lines. It exposes mapped item, quantity, unit, precise unit price, net amount, tax treatment and totals. Readiness checks cover currentness, supporting evidence, basis review, unresolved/inactive/unsynchronised items, company/unit identity, external entity keys, currency, tax compatibility, representable unit prices and exact total agreement.

The **Receiver** records receipt and approval of the exact proposal with a reason and explicit confirmation. The decision binds the proposal version and SHA-256 of its canonical conversion plan. Changing the proposal invalidates the active approval while preserving its history. Checks repeat after hashing so a changed version or capability cannot silently approve a different plan.

Receiving approval is separate from order preparation and from actual provider confirmation. The **Operator** must then confirm authority to prepare the original conversion. The frozen payload includes exact source/acceptance identities, company and external keys, mapped lines, quantities, prices, tax, totals and source lead-time context. Preparing it creates no order effect.

## 8. Original conversion, evidence and recovery

The default conversion has eleven targets: one order header and ten included commercial lines. Each target has a stable correlation identity beneath one original operation. Expected keys are labelled synthetic lookup data; confirmed external references appear only with a confirmed result.

| Outcome | Page behaviour |
|---|---|
| Prepared | Frozen reviewed payload exists; no dispatch result is implied |
| Confirmed | Original target reference and evidence are retained; it is excluded from later retries |
| Outcome unknown | Original correlation is retained and retry is held pending a provider lookup |
| Failed, confirmed no effect | Eligible for retry under the same original operation once unknown siblings are resolved |
| Partially confirmed | Header/line outcomes remain separate; confirmed targets survive while siblings are reconciled |

The simulated partial result gives a mixture of confirmed, unknown and confirmed-no-effect targets. The evidence screen shows status, attempts, correlation and available recovery per target. An aggregate status does not conceal an unresolved line.

Reconciliation requires an evidence observation and exact target identity. An order header must be confirmed before confirming its lines. An unknown result is never interpreted as a failure merely because the response was interrupted. A reload that finds a target left in Submitted restores it as unknown rather than resending it.

Retry selects only confirmed-no-effect targets. It keeps the original operation, frozen payload and per-target correlations, increments the relevant attempts and leaves confirmed siblings unchanged. Duplicate preparation, duplicate completion and retry while any relevant outcome is unknown are refused in the local model. These checks illustrate the intended prevention of duplicates; production guarantees require durable server and provider controls.

Simulating an upstream supersession marks the accepted source no longer current. New dispatch and retries stop, while lookup/reconciliation of original effects remains available. Existing orders are not silently cancelled or rewritten. Compensation, cancellation or a changed conversion payload would require its own reviewed and authorised action outside this prototype.

## 9. Ownership, local persistence and exports

| Demonstration capability | Responsibility |
|---|---|
| Resolver — Alex | Check incoming basis, resolve item mappings and verify destination entities/capabilities |
| Receiver — Jordan | Receive and approve the exact ready proposal, or return an incomplete handover |
| Operator — Casey | Prepare the original conversion and record/reconcile simulated provider outcomes |
| Read only | Inspect existing case and evidence without changing business state |

These selectable capabilities exercise local guards; they are not authentication or verified grants. The receiving application must supply real permissions, separation of duties, fresh authority and company scope.

Local storage retains the case, decisions, original operations and outcome evidence. Reload checks the frozen payload hash, plan identity, item payloads and target correlations. Malformed saved evidence is held rather than silently overwritten. A storage failure stops further business actions and exposes the session-only state for export. A change from another tab makes the current page read-only until reload. Local storage can be cleared or modified by its owner and is not a secure, durable audit ledger.

Exports include the full case evidence JSON, original conversion operation JSON, imported exact issue HTML when available, and a return-to-ES-06 record. A return requires reason, receiving owner and due date and is held after external effects. It freezes preparation; the exported record does not itself send a message or prove upstream receipt. Reset is an explicit demonstration-only replacement of this module’s local case.

## 10. Handover boundaries and excluded work

ES-06 owns customer response, signature/consent evidence, negotiation and preparation of the receiving pack. ES-05 owns approval and issue of changed customer content. ES-07 checks and maps that accepted content; it cannot alter the accepted commercial agreement. Catalogue/entity authority and real provider results belong to the receiving integration and its authorised company context, with the r06 dependency on AD-05 retained.

Successful simulated conversion prepares evidence for the order-owning integration. It does not authorise Engineering or Projects work, procure goods, reserve stock, send acknowledgements, invoice, recognise revenue or establish a project release. Those receiving processes keep their own gates. ES-08 remains Screen Systems configuration; this package does not expand it into an order module.

Application delivery must establish the verified MYOB company/capability mapping, complete source files and retention, durable operations/outbox/receipts, provider correlation and idempotency behaviour, concurrency, grant refresh, exact decimal/tax representation and controlled recovery. See [BP-04](../../../blueprints/BP-04-estimating-quotation.md) and the [MYOB discovery blueprint](../../../contracts/myob-integration-blueprint.md). No endpoint, tenant, live credential or deployment is introduced here.

## 11. Suggested review walkthrough

1. Open the default complete synthetic scenario. Inspect the accepted snapshot and record the Resolver’s basis observation.
2. Resolve the unresolved active candidates by binding, reactivate the inactive item, record a known effect and then verify synchronisation. Use reset for an alternative one-off creation or unknown-item scenario.
3. Save the AU destination review. Try two-decimal precision to inspect the amount blocker, then restore the five-decimal fictional capability and save again.
4. Switch to Receiver, inspect the source/target comparison and approve the exact ready plan with evidence and confirmation.
5. Switch to Operator, prepare the original conversion and simulate Partial. Inspect confirmed references, reconcile the unknown target and retry only the no-effect siblings.
6. Export evidence, reload and inspect retained original identities. Separately import an ES-06 handover to review the missing-supporting-files hold and owned return path.

## 12. Verification and open acceptance

**33 focused groups pass** against the actual generated HTML scripts in a Node VM with a lightweight DOM adapter. They cover source amounts/options, precision, item effects/synchronisation, destination identity, role/version gates, review history, frozen payloads, partial and unknown outcomes, exact-target reconciliation, unchanged confirmed siblings, supersession, reload integrity, ES-06 imports, owned returns, staged edits and storage/cross-tab recovery.

The [verification record](../../../testing/item-conversion-verification.md) contains the artifact hash, source preservation, deterministic build and repository checks. Native browser access was blocked by the available environment’s policy, so this package does not claim a visual, device, native-dialog, assistive-technology or print pass. Those reviews and Dean’s detailed design acceptance remain open. Passing model checks and publishing a draft PR do not promote a new UI baseline or establish live conversion readiness.
