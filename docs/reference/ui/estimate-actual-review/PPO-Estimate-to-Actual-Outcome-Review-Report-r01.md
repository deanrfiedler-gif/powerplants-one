---
document_id: PPO-ES09-REPORT
title: ES-09 Estimate-to-Actual Outcome Review — detailed design report
revision: r01
date: 2026-09-16
owner: Dean Fiedler
status: Proposed standalone design; owner acceptance, financial-definition adoption and application integration remain separate
source_commit: 0769a16dd842e9dc1c349a853036ab71949e7807
---

# ES-09 — Estimate-to-Actual Outcome Review

Companion report to the [interactive workspace r01](PPO-Estimate-to-Actual-Outcome-Review-r01.html).

**The question the workspace answers:** how did the delivered outcome compare with what we estimated, why did it differ, and what should we learn?

**The discipline the workspace enforces:** estimated cost, quoted selling price, approved scope change and delivery performance are four different things. An approved scope increase is not an estimating failure. A customer discount is not a delivery over-run. An incomplete source set is not a favourable variance.

---

## 1. What this is, and what it is not

| | |
|---|---|
| **Is** | A standalone, self-contained HTML design for ES-09, a detailed specification of every view, field, rule and formula it implements, a worked reconciliation of one synthetic job, and a receiving-requirements record for the application increment that would follow. |
| **Is not** | An application, a route, a migration, a live integration, an accounting policy, an adopted materiality threshold, an adopted allocation basis, an adopted variance-reason registry, a margin definition, or an owner acceptance of the visual design. |

Nothing in this package adopts a financial definition. Where a definition is missing, the workspace withholds the number and names the missing definition instead of computing a plausible one. That behaviour is the design, not a gap in it.

This contribution changes no application source, database, dependency pin, hosted service, accepted UI baseline or issued predecessor design.

---

## 2. Exact repository and design sources

Verified on `main` at `0769a16dd842e9dc1c349a853036ab71949e7807` (merge of PR #209, 16 September 2026).

### 2.1 Governing sources read before building

| Source | What it governs here |
|---|---|
| [Estimate-to-actual feedback loop design r05](../../../blueprints/estimate-actual-feedback-design.md) | The only existing ES-09 design authority. Supplies the four-layer separation (measurement, attribution, calibration, governance), the two-baseline requirement and its identity, the `NotComparable` state, the variance reason taxonomy, the statistical constraints and the preconditions P1–P6. **Nothing in it is adopted**, and this workspace does not adopt it either. |
| [HTML page coverage audit r04](../module-page-register/PPO-HTML-Page-Coverage-Audit-r04.md) | The ES-09 and ES-10 briefs, family parent mapping EST-01–EST-09, and the C05 journey "Estimate-to-actual learning — comparable basis, reviewed calibration and no automatic repricing". |
| [BP-04 Estimating and quotation](../../../blueprints/BP-04-estimating-quotation.md) | Routing by nature of work, CommercialOption / EstimationRevision / QuoteRevision separation. |
| [E1 physical and API contract](../../../contracts/estimating-e1.md) | Immutable `EstimateVersion`, immutable `DraftQuoteRevision`, `SYN-EST-ARITHMETIC-01` decimal rules, the customer-safe projection boundary, and the rule that internal cost sources never enter a customer-facing output. |
| [E2 receiving and preservation contract](../../../contracts/estimating-e2-design.md) | Estimate basis link (estimate version → option / estimation / scope / answer UUIDs and hashes), "never attach a new meaning to an older cost version", and the rule that a builder must not pair Option A prices with a currently selected Option B. |
| [ADR-0023 estimating line taxonomy](../../../decisions/ADR-0023-estimating-line-taxonomy.md) and [ADR-0027 discovery cost basis](../../../decisions/ADR-0027-estimating-discovery-cost-basis.md) | Category set and the separate explicit Allowance flag; the cost-version identity this review binds to. |
| [PP-01 Finance and customer-account contract](../../../contracts/finance-handoff.md) | Captured / Service-approved / billable / ERP-processed quantities as distinct facts; the rule that comparing amounts needs an approved matching currency, tax and rounding definition; `OutcomeUnknown` and `ReconciliationRequired`; "supplier recovery, customer credit and physical return each need their own authoritative evidence". |
| [Supply Chain readiness contract](../../../contracts/supply-chain-readiness.md) | Ordered / received / issued / usable / quarantined / returned as separate observations; no implicit unit conversion; allocation without over-allocation; "planning a movement is not posting it". |
| [Finance workspace r02 design](../../../decisions/finance-workspace-design.md) | The no-posting and correction journeys this review hands to, and the restricted display boundary. |
| [Project delivery readiness and change control r01](../../../decisions/project-delivery-readiness-design.md) | Approved project change records, their own evidence, and the rule that a change proposal is not an executed change. |
| [Warranty and customer resolution r01](../../../decisions/warranty-customer-resolution-design.md) | Supplier approval, physical return, Finance credit link and unrecovered disposition as distinct records. |
| [Service review and reports r01](../../../decisions/service-review-reports-workspace-design.md) | Where reviewed labour, parts and findings become reviewed quantities. |
| [Quality, safety and site assurance r01](../../../decisions/quality-site-assurance-design.md) | The established r20 module pattern this workspace reuses: register, context card, summary cells, docked snapshots, focused decision dialogs, local session and recovery. |
| [Shared UI style specification r07](../../../standards/ui-style-specification.md) | Palette, typography, control geometry, state language, bounded scroll and layer rules. |
| [PPO-STD-001 naming conventions](../../../standards/naming-conventions.md) | Reference type catalogue (section 10.2), synthetic `SYN-PPO-` references, and the rule that a new type code is added deliberately. |
| [ADR-0005 project naming adoption](../../../decisions/ADR-0005-project-naming-adoption.md) | Product name, project code, independence from the other project's standard. |

### 2.2 Visual source

Theme board **r20**, `docs/reference/ui/theme-style-board/powerplants-one-theme-style-board-r20.html`, SHA-256 `c68a499e857b1705d47bd6598d4b2e89526bf0861a0d234394c3da023f19b617`. This is the same byte-identical board recorded by the Quality, Site Survey and Projects contributions. Only its three embedded Roboto `@font-face` declarations were extracted (63,656 bytes); the 16 MB board is not copied into this package.

The applied r20 page type is **Review / comparison**, supported by a register, record detail views, docked source snapshots and focused decision forms — the composition the ES-09 brief calls for.

### 2.3 Overlapping open contributions and their actual state

| Contribution | State on 16 September 2026 | Effect on this package |
|---|---|---|
| PR #210 — ES-08 Specialist configuration workbench r02 | Open draft, branch `design/specialist-screen-systems-r01`. Its r02 record states that a recovered Screen Systems workbook now supplies executable source expressions, but **G06 formula evidence is received and not accepted as a complete approved definition pack**; approved engineering ranges, parts/units/MYOB mappings and full branch examples remain open. | ES-09 reads the Screen Systems context only as **named provenance** — configuration reference, option and cost-version identity. It executes no Screen Systems formula, reproduces no recovered quantity and proposes no change to one. The fixture reuses `SYN-PPO-EST-000042`, `SYN-OPT-A`, `SYN-CFG-SCREEN-001` and `Northbank Nursery` for continuity of identity only. |
| PR #212 — ES-05 correction and ES-06 quotation response and negotiation r01 | Open draft. Establishes the issued-revision / acceptance / decline / expiry / revised-offer lifecycle and states that "a response is neither work authority nor order conversion". | ES-09 treats the accepted quotation revision and its acceptance evidence as an **input identity**. It does not re-derive acceptance, and it does not read or write the ES-06 fixture. |
| PR #213 — ES-07 one-off item resolution and conversion r01 | Open draft, based on the #212 branch. | No overlap. ES-09 does not resolve or convert items. |
| PR #211 — SH-03 notification inbox r01 | Open draft. | No overlap. ES-09 raises no notification. |
| Dormant branch `design/estimate-actual-feedback-loop` | The branch that produced the merged r05 blueprint. No HTML, no competing ES-09 workspace. | Superseded in practice by this contribution for the HTML scope; the r05 record itself is unchanged. |

**ES-09 is a new page.** No predecessor HTML, register entry or decision existed for it before this contribution, so nothing is superseded.

### 2.4 Restricted evidence

No historical customer workbook, operational export, private pricing, recovered quote value or restricted record is placed in this repository. Every customer, site, facility, estimate, quotation, variation, invoice, claim, rate and amount in the fixture is authored synthetic data. The ES-08 recovered workbook is referenced by name and limit only; **no value in this package is recalculated from it**.

---

## 3. ES-09 scope and parent traceability

### 3.1 Coverage-register scope

> **ES-09 · N — Estimate-to-actual outcome review — Page.** Compare issued estimate, accepted estimate and attributable actuals; separate negotiation from delivery variance, retain reason codes and explicitly mark incomparable cases.

Every clause of that brief is implemented and is named in the traceability table at section 18.

**Identifier collision, recorded not resolved.** `docs/blueprints/estimating-screen-specification.md` uses "ES-09" for an *issue-and-response* screen. The coverage register r06 and audits r02–r04 use ES-09 for *estimate-to-actual outcome review*, and the instruction for this work uses the register meaning. This package uses the register meaning throughout. The collision is an open documentation matter for the owner; nothing here renames either source.

### 3.2 Parent requirements

No new parent requirement is created. All 78 parent IDs are preserved and unchanged. The family mapping is EST-01–EST-09, and the related parents this design touches as *inputs* are:

| Parent | Relationship |
|---|---|
| EST-03, EST-04 | Estimate version identity, line identity and cost provenance — the basis this review binds to |
| EST-06 | Specialist configuration — named as provenance only |
| PRJ-05, PRJ-08 | Contract variations and project close-out — the approved-change and delivery-target inputs |
| SVC-10 | Service evidence review — the source of reviewed labour and parts |
| SCM-05, SCM-06, SCM-07 | Allocation, receipt/inspection and return/claim/credit observations |
| FIN-04, FIN-07 | Cost definitions and measure definitions — the definitions this review declares and, where absent, withholds |
| NFR-01, NFR-07, NFR-09 | Integrity, permission and usability qualities |

The r05 blueprint's proposed child requirements (EST-04.1, EST-03.1, SVC-10.1, PRJ-08.1, FIN-04.1, FIN-07.1) remain **proposals**. This package does not allocate them; allocation is an owner act.

### 3.3 Decisions this design depends on and does not make

| Decision | State | How the design behaves |
|---|---|---|
| D-017 — Finance definitions, posted cost, committed cost, overhead, margin | Open | No margin, profitability or percentage-of-revenue measure is computed anywhere. The commercial card states the missing definition in place of a number. |
| D-009 / D-010 — estimating rule and calculation authority | Open | No formula is executed, proposed as executable, or changed. |
| Materiality threshold | Not adopted | Declared per review by the reviewer, recorded with the review, and labelled "proposed review-level threshold; no Powerplants materiality policy is adopted". |
| Allocation basis registry | Not adopted | Four bases are offered; only `direct` is marked adopted. An equal split is never a default and requires an explicit reason of at least 20 characters. |
| Variance reason registry | Not adopted | Twelve codes are offered and every rendered code carries "proposed registry, not adopted". |
| Reference type code for an outcome-review record | Not allocated | The r05 blueprint's `SYN-PPO-DOR-` example is **not** used. Local labels `SYN-EAR-nnnn` are design fixture identifiers, exactly as `SYN-QA-*` is in the Quality workspace. Adding a type code to PPO-STD-001 section 10.2 is an open owner decision. |

---

## 4. The essential business distinctions

These are the distinctions the workspace holds apart at every surface. Collapsing any of them is the failure mode the design exists to prevent.

| Kept separate | Why it matters | Where it is enforced |
|---|---|---|
| **Issued estimate cost basis** vs **accepted scope cost basis** | The accepted scope is frequently not the scope that was quoted. Binding an outcome to only one answers half the question. | Two independent basis records, each with its own saved version, timestamp, option, cost schema, supplier sources and quoted price. |
| **Estimated cost** vs **quoted selling price** | A discount changes the commercial outcome without changing a single cost assumption. Comparing sell price to actual cost learns neither. | Price lives in its own card in the basis view and is never an input to any cost calculation. |
| **Negotiated price change** vs **change of accepted scope** | Both move the offer; only one moves the cost basis. | Two separately recorded commercial components, each with its own amount, date, reason and evidence. Neither is derived from the other. |
| **Approved variation** vs **estimating error** | An approved scope increase must never appear as an estimating failure. | Approved changes enter the comparison basis as their own cost lines, and the reconciliation ladder shows their contribution as a distinct term. |
| **An approved variation's selling price** vs **its cost budget** | They are different numbers with different authority. | A variation without a recorded cost basis **cannot** be added to the comparison basis. The model refuses it. Its attributable actual is reported separately as "actual with no estimated basis". |
| **Quantity difference** vs **rate difference** | Only the decomposition tells the estimator which assumption to revisit. | Quantity, rate and joint effects, reconciling exactly, with any rounding residual shown. |
| **Commitment** vs **incurred cost** | A purchase order is not a cost. Adding actual and committed double-counts. | `Commitment` is a treatment; the model refuses to include a commitment as actual cost. |
| **Captured** vs **reviewed** quantity | Captured field hours are not reviewed hours. | The model refuses to include a source whose status is "Captured — not reviewed". |
| **Customer billing** vs **job cost** | Invoices and payments are not costs. | The model refuses to include a customer-billing observation as actual cost. |
| **Anticipated recovery** vs **confirmed recovery** | Netting an unissued credit understates actual cost and overstates the result. | Returns, claims and credits are separate records; nothing is netted. An unissued credit is an open outstanding matter. |
| **Observed difference** vs **suspected explanation** vs **reviewed finding** | Recording all three in one field destroys all three. | Three separate record types: line comparison, explanation with share, finding with evidence. |
| **Improvement suggestion** vs **reviewed proposal** vs **approved configuration change** | Only the first two exist in ES-09. | Three finding states, and the third is explicitly out of scope with the refusal stated on screen. |
| **Delivery completion** vs **financial completeness** | A finished job can carry unposted cost, an open claim and an unresolved allocation. | Separate register columns, an explicit completeness declaration, and a provisional conclusion state. |

---

## 5. Information architecture

Five connected views in a module-only workspace. The page draws no application shell, no left navigation rail and no logo; it designs the content area only, per section 7.1 of the shared UI specification.

| # | View | Answers |
|---|---|---|
| 1 | **Outcome review register** | Which delivered scopes need reviewing, what is blocking each one, and who owns the next step? |
| 2 | **Estimate & accepted basis** | Exactly what are we comparing against, and where did the offer move commercially? |
| 3 | **Actuals & source reconciliation** | What did this scope actually consume, from which source, on what basis, and what could not be attributed? |
| 4 | **Variance review** | What is the difference, does it reconcile, and why did it happen? |
| 5 | **Lessons & improvement proposals** | What is worth learning, what does one job actually support, and where does it go next? |

Persistent chrome: a module header, a synthetic-context strip carrying the revision, date, currency basis, current preview role and save status; a five-tab bar; and a **selected-review context card** carrying review identity, customer, site, equipment family, delivery target, estimate and quotation references, cut-off, state chips and two docked snapshot openers. The context card is present on every view so that no comparison is read without knowing which record it belongs to.

---

## 6. View 1 — Outcome review register

### 6.1 Summary cells

Five contiguous cells. Each is a filter over the same register, not a separate list. Selecting the active cell again returns to all reviews.

| Cell | Membership |
|---|---|
| Awaiting evidence | `Draft`, `AwaitingEvidence`, `NotComparable` |
| Ready for review | `ReadyForReview` |
| In review | `InReview`, `Returned` |
| Findings requiring action | Any review with an open suggestion, an open reviewed proposal, or an open owned action |
| Reviewed | `Reviewed`, `ReviewedProvisional` |

### 6.2 Register columns

| Column | Content |
|---|---|
| Review | Title and local reference (`SYN-EAR-nnnn`), with a successor marker where applicable |
| Customer and site | Customer, site, equipment family |
| Commercial references | Opportunity, estimate, accepted quotation and issue |
| Delivery | Delivery target type (Project / Work order / Sales order) and its reference |
| Owners | Review owner, estimator, delivery owner |
| Cut-off | Scope cut-off date, last source observation date and source revision number |
| Status | Review state, and the count of open financial matters |
| Sources | Completeness declaration, comparable line count and withheld line count |
| Next action | The single next thing to do, derived from the live blockers — not a stored string |

### 6.3 Filters and views

Search plus six filters: customer, owner, equipment family, delivery type, review status and source completeness. **Search matches record identity, title, customer, site and reference text only. It never matches an amount**, so a restricted value cannot be discovered by guessing it in the search box. Clear all resets search and every filter; the selected review and the named view are retained.

Selecting a review opens its basis view; returning to the register restores the search, filters and named view unchanged. This is verified in the browser check.

### 6.4 Behaviour the register is required to refuse

- An incomplete source set never renders as a zero-cost job. Where cost is not established the cell reads *Not established*, never `0.00`.
- A withheld line count is shown beside the comparable line count, so a small comparable set is visible as a small comparable set.
- A completed delivery with open financial matters shows both facts.

---

## 7. View 2 — Estimate and accepted comparison basis

### 7.1 What is retained for each basis

Two basis cards, each rendering a saved, read-only record:

| Field | Issued basis | Accepted basis |
|---|---|---|
| Version reference | `SYN-PPO-EST-000042 · cost version r03` | `SYN-PPO-EST-000042 · cost version r04` |
| Saved at | Exact source timestamp | Exact source timestamp |
| Commercial option | `SYN-OPT-A` | `SYN-OPT-A` |
| Cost schema | schema 1 — Product / Labour / Freight | schema 1 |
| Calculator / formula provenance | ES-08 Screen Systems reference fixture, configuration `SYN-CFG-SCREEN-001`, labelled *authored fixture, not an approved formula pack* | same |
| Cost lines | code, label, quantity, unit, rate, extended cost, and the total | same |
| Supplier price sources | reference, supplier, scope, currency, validity date | same |
| Quoted selling price | with the explicit note that a quoted price is not a cost basis | same |

Each card opens a **docked source snapshot** stating "the latest estimate is never substituted for the version being assessed". Neither card is editable anywhere in the workspace.

### 7.2 Approved scope changes

Each approved change is its own record: reference, title, approval date, reason, evidence, selling price, and either its own cost lines or an explicit statement that no cost basis was recorded.

A change with a recorded cost basis can be **included** in the comparison basis. A change without one can only be **acknowledged**. The model refuses any attempt to include it, with the message *"this approved change has no recorded cost basis and cannot be added to the comparison basis. Its selling price is not a cost budget."*

### 7.3 Declaring a comparison basis

A focused dialog records which approved changes are included, which changes without a cost basis are acknowledged, and a free-text statement of what the basis includes. The declaration stores the declaring actor and time.

The declared basis is a **naming of records, not a new record**. The issued and accepted cost versions are not merged, rewritten or replaced; both remain independently inspectable. Where the accepted scope cannot be reliably linked to an estimate cost version, the review is marked `NotComparable` with a reason rather than compared on a guess.

Submission is blocked until every approved change is either included or acknowledged, so a variation can never be silently omitted.

### 7.4 Commercial movement — selling price only

A separate card holds: issued quoted price, accepted quotation price, the movement between them, the approved-change selling prices, and the accepted-plus-approved-changes total.

Below it, each **recorded component** of the movement appears with its own amount, date, reason and evidence. In the fixture:

| Component | Amount | Note |
|---|---|---|
| Scope change at acceptance | −3,620.00 | Edge seal removed from the offer during negotiation |
| Negotiated discount conceded at close | −4,500.00 | Commercial discount to close the order in the planting window; **no cost basis changed** |

The components are **recorded facts, not derived splits**. The accepted-scope *price* reduction of 3,620.00 and the accepted-scope *cost* reduction of 3,619.20 are separate figures from separate records; neither is calculated from the other, and the small difference between them is exactly the point.

**Margin is withheld.** The card states: *"No approved margin definition exists. D-017 leaves posted cost, committed cost, overhead treatment and margin undefined, so no margin or profitability figure is computed here."*

### 7.5 Scope boundary card

Currency, tax basis, quantity class, cost definition, scope cut-off and reporting cut-off, with a Finance-validation control and an explicit *Finance validation outstanding* state until it is used.

---

## 8. View 3 — Actuals and source reconciliation

### 8.1 Source observation record

Each observation renders every field below. Nothing is summarised away.

| Field | Purpose |
|---|---|
| Source system | PPO Supply Chain · PPO Service review · MYOB Acumatica (simulated read) |
| Company / entity | Legal entity context; amounts are never aggregated across entities |
| Record reference and line reference | Exact source identity |
| Description | Source-supplied description |
| Scope reference | Job, site, equipment or task the source names |
| Category | Material issue · Material return · Labour · Supplier invoice · Freight · Subcontract · Commitment · Customer billing · Credit · Correction |
| Quantity class | Ordered · Received · Issued · Used · Returned · Invoiced · Paid · Not applicable |
| Quantity, unit, rate, amount | Each independently nullable; unknown renders *Not established*, never zero |
| Currency and tax basis | Displayed on every amount |
| Transaction / service date | Source date |
| Source status and version | e.g. Posted, Reviewed, Committed, "Approved — credit not issued", "Captured — not reviewed" |
| Observation time | When PPO observed the source |
| Treatment and reason | Undecided · Included · Excluded · Commitment · Unresolved, with a recorded reason |
| Mapping | Each allocation with its share, basis, adoption state and evidence |
| Unallocated remainder | Percentage and recorded reason |
| Reviewer and question | Open reviewer question retained with the record |

### 8.2 Treatment rules the model enforces

| Rule | Message |
|---|---|
| A commitment cannot be actual cost | *A purchase commitment is not an incurred cost and cannot be included as actual cost.* |
| Customer billing cannot be a job cost | *Customer invoices and payments are not job costs.* |
| Captured is not reviewed | *Captured quantities are not reviewed quantities. Complete the source review first.* |
| Every treatment needs a reason | 8–2,000 characters, enforced |
| Changing away from Included releases its allocations | Allocations are removed transactionally, not left dangling |

### 8.3 Mapping and allocation rules

- **One-to-many and many-to-one** are both supported: one source may be allocated across several comparison lines, and several sources may be allocated to one line.
- **Shares are bounded.** A share is greater than 0 and at most 1; total allocated share for one observation can never exceed the source record. The model refuses an over-allocation and leaves state unchanged.
- **Unallocated remainder is preserved**, displayed as a percentage and an amount, and requires a recorded reason before submission. It is never forced onto a line.
- **Shared costs need an adopted basis.** Four bases are offered — `direct` (adopted), `measured`, `time`, `equal` (all proposed). Any non-adopted basis requires a reason of at least 20 characters. **An equal split is never applied by default**, and choosing it is flagged as an unapproved basis.
- **Units are not converted.** Allocating a source whose unit differs from the line's unit is refused unless a reviewed conversion exists for that observation: *"kg and m cannot be compared without a reviewed conversion. A similar description is not a conversion."*
- **Currencies are not converted.** A source in a currency other than the comparison currency cannot be allocated, and cannot pass submission, without a documented conversion basis.
- **Duplicates are detected, not assumed.** Observations carry a `dedupeKey` naming the underlying economic event. Two *Included* observations sharing a key raise a blocking *Possible duplicate* with both references named; the reviewer excludes one with a reason. This is the guard against counting a material issue and its supplier invoice, or reviewed labour and an aggregate cost import, as two costs.
- **Description similarity is never a match.** No automatic matching exists anywhere in the design.

### 8.4 Completeness and submission

Completeness is a declaration — `Complete`, `Partial` or `Unavailable` — with a mandatory reason whenever it is not Complete.

Submission is refused while any of these hold, each blocker named individually on screen:

1. the comparison basis is not declared;
2. an approved change is neither included nor acknowledged;
3. any observation treatment is `Undecided`;
4. an included observation is in a foreign currency with no reviewed conversion;
5. an included observation has an unallocated remainder with no reason;
6. allocated shares exceed a source record;
7. two included observations share a source key;
8. completeness is not declared, or is not Complete without a reason.

### 8.5 Three summary cards

**Included in the comparison** (attributable actual cost, comparable line count, actual with no estimated basis) · **Held out of the comparison** (commitments not incurred, unresolved amounts, unmapped remainder) · **Outstanding financial matters** (each with type, status, amount or *No amount established*, owner, due date and evidence).

The held-out card carries the standing statement: *"Shown separately; never netted against actual cost."*

---

## 9. View 4 — Variance review

### 9.1 Sign convention and denominators

> **variance = actual − estimated**

A **positive** variance means more cost than the declared basis. Positive cost variances render in the danger tone, negative in the success tone, zero in the muted tone — and the tone is always accompanied by the sign and the word, never colour alone.

**Percentage = variance ÷ estimated amount on the named basis.** The denominator is stated in the table footer and in the reconciliation ladder. Percentage is withheld and rendered `n/a`, with the reason available, when:

- the estimated basis for the line is zero — *"No percentage — the estimated basis for this line is zero."*
- either side is not established — *"No percentage — the cost comparison is not established on both sides."*

No percentage is ever produced against a zero, missing or unsuitable denominator.

### 9.2 Line comparison table

Columns: line and basis provenance · estimated quantity · estimated rate · estimated cost · actual quantity · actual rate · actual cost · variance · percentage · decomposition · status and attribution.

The **status** cell states one of: *Comparable*, *Quantity only*, *Actual only — no estimated cost basis*, *Estimated only — no established actual cost*, *Not comparable*. A line outside the declared basis states so explicitly. Material lines carry a *Material* chip once materiality is declared.

The **attribution** cell states the attributed percentage and the unexplained remainder, e.g. *95% attributed, 5% unexplained*.

The footer totals **comparable lines only**, names its denominator, and states how many lines are withheld from the totals. Lines that are not comparable on both sides are shown and excluded — never treated as zero.

### 9.3 Quantity / rate decomposition — exact formula

Where estimated quantity, estimated rate, actual quantity and actual rate are all established, on the same unit and in the same currency, and the estimated quantity is non-zero:

```
Δcost          = (actualQty × actualRate) − (estQty × estRate)

quantityEffect = (actualQty − estQty) × estRate
rateEffect     = (actualRate − estRate) × estQty
jointEffect    = (actualQty − estQty) × (actualRate − estRate)
residual       = Δcost − (quantityEffect + rateEffect + jointEffect)

Δcost          = quantityEffect + rateEffect + jointEffect + residual     (always)
```

The **joint effect is shown, not absorbed**. The common two-factor split silently pushes the interaction term into whichever factor is computed second, which makes the components look tidy and the attribution wrong. Here all three terms are displayed, and any rounding residual from the three independent HALF_UP roundings is displayed as its own term, so the components reconcile to the line variance by construction. The model check asserts this on every decomposed line.

**This is a presentation decomposition, not approved accounting policy.** It is not adopted, and it is not a variance-analysis standard.

Decomposition is withheld — *Not available* — where units differ, currencies differ, a rate is not established on either side, or the estimated quantity is zero.

### 9.4 Reconciliation ladder and identity check

The ladder renders, in order:

| Row | Fixture value (AUD, ex GST) |
|---|---|
| Issued estimate cost basis | 50,424.00 |
| Scope change at acceptance | −3,619.20 |
| Approved change cost basis (included: `SYN-PPO-VAR-024101`) | 4,534.40 |
| **Comparison basis** | **51,339.20** |
| Attributable actual cost | 60,933.54 |
| **Delivery variance** | **+9,594.34** |
| **Total cost variance against the issued basis** | **+10,509.54** |

The identity enforced is:

```
total cost variance against issued
    = scope change at acceptance + approved change cost basis + delivery variance
+10,509.54 = (−3,619.20) + 4,534.40 + 9,594.34          ✓
```

The identity row renders *Reconciles* or *Does not reconcile*, and is deliberately **unavailable** rather than forced when either basis is not fully established on both sides, or when not every line of the declared comparison basis has an established actual. That second guard matters: without it the identity would appear to hold on a partial comparison, which is exactly when a reader most needs to be told it does not.

This is a free integrity check. If it fails, a basis has been rebound or a line has been added without a revision, and the comparison is wrong before anyone reads it.

### 9.5 Amounts held outside the comparison

A second card totals, separately and without netting: actual with no estimated basis · commitments not incurred · unresolved source amounts · unmapped remainder · open financial matters. In the fixture these are 1,960.00, 3,700.00, 0.00, 0.00 and 8,192.20.

### 9.6 Explanation categories

Twelve proposed codes in six groups. Every rendered code carries "proposed registry, not adopted".

| Group | Codes |
|---|---|
| Scope | Approved scope change · Customer-requested change awaiting disposition |
| Quantity and technical | Original quantity assumption · Site conditions · Substitution |
| Rate and price | Different purchase rate · Different labour rate basis · Freight or logistics difference |
| Productivity | Rework |
| Commercial | Return or confirmed recovery |
| Data | Mapping or timing difference · Cause not yet established |

Attribution rules:

- More than one cause may contribute to one line.
- Each contribution carries a share between 0 and 1 and a written reviewed explanation.
- The same code cannot be recorded twice on one line.
- Attributed shares can never exceed the observed difference. The model refuses the attempt: *"Attributed shares would exceed the observed difference. Leave the remainder unexplained instead."*
- **The unexplained remainder is retained and displayed.** It is never rounded away or absorbed into a convenient code.
- Reason codes name causes, not people. No individual is attached to a variance record.

Customer aftercare feedback may be recorded as context on the originating records; it cannot establish technical causation or cost attribution by itself, and no aftercare field feeds a reason code or an amount.

### 9.7 Materiality

A review cannot be concluded until the reviewer declares a materiality basis. The form states plainly that no Powerplants policy is adopted and explains why a single dollar threshold cannot work across the delivered value range. The declared basis is *the greater of a percentage of the line comparison basis and an amount*; the fixture proposal is 5% or AUD 1,500.

Every material variance must carry at least one reviewed reason before conclusion. A variance below materiality may be left unattributed.

---

## 10. Returns, credits and unresolved outcomes

### 10.1 Separate records, no netting

Physical return, supplier claim, supplier credit, customer credit, inventory correction and payment are separate facts with separate evidence and separate authority. The workspace never nets one against another, and never nets an anticipated recovery against actual cost.

The fixture carries the full sequence: a drive unit is damaged in transit, a **replacement is issued and invoiced before any recovery** (so actual cost carries five units, not four), the supplier **approves a claim** for 1,850.00, and **no credit note exists at the cut-off**. The comparison therefore reports 9,250.00 of actual drive cost, an explained variance of +1,850.00 attributed to *Return or confirmed recovery* with the note that the claim is not netted, and an open outstanding matter of 1,850.00 owned by Finance with a due date.

Two further unresolved shapes are demonstrated: a **shared cost with no adopted allocation basis** (5,600.00 held out) and an **unmapped actual with no comparison line** (742.20 held out, with the reviewer's question retained).

The other shapes the brief names are representable with the same records and states: goods returned with no credit confirmed; a customer credit issued while supplier recovery remains open; labour captured but awaiting review (demonstrated on `SYN-EAR-0005`); a supplier invoice received after the cut-off (demonstrated by the source change on `SYN-EAR-0001`); and cost coded to the wrong job awaiting correction (the `Correction` outstanding type and the `MAPPING-TIMING` reason code).

### 10.2 Provisional conclusion

A review with any open outstanding matter, a completeness declaration other than Complete, or any line that is not comparable on both sides **cannot be concluded as complete**. The dialog offers only *Reviewed — provisional*, lists the reasons, and the model refuses a complete conclusion with those reasons in the message.

A provisional conclusion freezes and retains: the cut-off, the comparison snapshot version, the declared basis, the full totals and the identity result at the moment of conclusion, the list of provisional reasons, and every open matter with its owner and due date.

### 10.3 New evidence after conclusion

A source change advances the review's source revision and sets `refreshRequired`. The concluded record is **not** rewritten: the frozen totals stay exactly as concluded, and the live totals move. The variance view states *"Sources changed after this comparison was captured"*, and conclusion is blocked until the comparison is refreshed.

New evidence is carried by a **successor review** with its own identity (`SYN-EAR-0001-S2`), linked by `supersedes` / `supersededBy`, opened in `Draft` with no inherited conclusion. The predecessor remains readable exactly as concluded. In the fixture, the predecessor keeps a delivery variance of 9,594.34 while the successor computes 10,034.34 on the revised freight invoice. Both are true; they are answers to different questions asked at different cut-offs.

---

## 11. Review controls, permissions and recovery

### 11.1 Proposed capabilities

Four proposed capabilities with fictional holders. **No real employee is assigned and no departmental authority is established.**

| Capability | Fictional holder | Permitted actions |
|---|---|---|
| Delivery owner · preparer | Jordan Blake | declare basis, set treatment, allocate, remove allocation, declare completeness, submit, record not comparable, explain, record action |
| Estimating & commercial reviewer | Sam Whitfield | claim, return, declare materiality, explain, record finding, review finding, prepare ES-10 handover, conclude, record not comparable, open successor, record action |
| Finance validation | Priya Raman | validate the declared basis, record a reviewed conversion, set treatment, record an outstanding matter, record a source change, record action |
| Read-only observer | Lee Nakamura | none |

### 11.2 Restricted information

The read-only observer sees structure and status but no commercial value. Specifically withheld: every amount, rate and price; the materiality amount; and **every free-text field recorded beside a restricted value** — treatment reasons, allocation reasons, explanation notes, commercial component reasons and evidence, reviewer questions and outstanding-matter evidence. These render as *Restricted* or *Restricted narrative*.

The same boundary is applied to the three other disclosure surfaces the brief names:

| Surface | Behaviour |
|---|---|
| **Summaries** | Summary cards and totals use the same restricted renderer; no aggregate leaks a restricted value. |
| **Search** | The searchable text is built from identity and description fields only. Searching for a known amount returns no match. Verified in the browser check. |
| **Exports** | The export strips amounts, rates, prices and narrative, and **also redacts the retained operation-receipt payloads**, which would otherwise carry the original command text verbatim. The envelope states what was removed. |

**Two honest limits.** First, a reviewer can still type a restricted rate into a *finding* narrative, which is deliberately not withheld because findings are the shareable learning. That residual risk is an open decision at section 20. Second, role switching in the HTML is an explanatory display control. It is not authentication, and it is not access control. In the application every one of these boundaries must be enforced on the server, on every read, aggregate, search, export and receipt lookup.

### 11.3 Demonstrated integrity behaviour

| Behaviour | Demonstration |
|---|---|
| Source changes during review | *Preview options → Source changes after capture*: advances the source revision, invalidates the captured comparison, blocks conclusion, preserves history. |
| Stale comparison or mapping revision | Every command carries `expectedVersion`. A stale form is refused with *"The workspace changed since this form was opened"* and state is unchanged. |
| Concurrent edits | The same version guard; the workspace version advances once per accepted command. |
| Incomplete or unavailable sources | Completeness declaration, *Not established* rendering, withheld lines, withheld identity. |
| Unresolved units, currencies or allocation rules | Refusals at mapping and at submission, each naming the missing basis. |
| Save or storage failure | *Preview options → Next record save: Fails*. The dialog stays open with entries intact, the error is announced, and state is byte-identical before and after. |
| Lost response after submission | *Next record save: Response is lost*. A recovery banner appears; **Recover the original operation** replays the same operation identity and returns the original result. No second record is created. |
| Customer / company / identity switching | Five reviews across four customers; switching the selected review re-renders every view against that record only, and the register never mixes records. |
| Access changes | Switching to the observer role immediately re-renders every view, summary and export under the restricted boundary. |
| Damaged saved session | Unparseable saved bytes are **preserved exactly**, never overwritten; the workspace offers to display them and to reset deliberately. |

### 11.4 Binding and closure

Every review decision is bound to the exact basis declaration, source set, declared cost definition, quantity class and allocation records current at the moment it was taken, and to the comparison snapshot version. Concluded records are immutable in the workspace; correction is by successor.

**Completing an ES-09 review closes nothing else.** The originating project, work order, supplier claim and Finance exception all retain their own state, and the browser check asserts this after conclusion.

---

## 12. Worked reconciliation of the synthetic example

Northbank Nursery, retractable shade screens, `SYN-PPO-PRJ-024101`. AUD, excluding GST. Cut-off 31 August 2026.

### 12.1 Issued basis — estimate cost version r03, saved 11 May 2026

| Code | Line | Qty | Unit | Rate | Cost |
|---|---|---:|---|---:|---:|
| SCR-CLOTH | Retractable shade cloth supply | 2,560 | m² | 8.40 | 21,504.00 |
| SCR-DRIVE | Drive and motor assemblies | 4 | EA | 1,850.00 | 7,400.00 |
| SCR-INST | Screen installation labour | 240 | h | 68.00 | 16,320.00 |
| SCR-SEAL | Edge seal materials | 320 | m | 6.25 | 2,000.00 |
| FRT-INB | Inbound freight | 1 | lot | 3,200.00 | 3,200.00 |
| | **Issued estimated cost** | | | | **50,424.00** |

Issued quoted selling price: **78,400.00**.

### 12.2 Accepted basis — estimate cost version r04, saved 26 May 2026

Edge seal removed from the offer during negotiation; cloth area and installation hours reduced accordingly.

| Code | Qty | Unit | Rate | Cost |
|---|---:|---|---:|---:|
| SCR-CLOTH | 2,432 | m² | 8.40 | 20,428.80 |
| SCR-DRIVE | 4 | EA | 1,850.00 | 7,400.00 |
| SCR-INST | 232 | h | 68.00 | 15,776.00 |
| FRT-INB | 1 | lot | 3,200.00 | 3,200.00 |
| **Accepted estimated cost** | | | | **46,804.80** |

Accepted quotation selling price: **70,280.00** = 78,400.00 − 3,620.00 (scope change at acceptance) − 4,500.00 (negotiated discount).

**Scope change at acceptance, cost effect:** 46,804.80 − 50,424.00 = **−3,619.20**.

### 12.3 Approved variations

| Variation | Approved | Cost basis | Selling price |
|---|---|---|---:|
| `SYN-PPO-VAR-024101` — blackout screen added to bay 8 | 2 Jul 2026 | 304 m² @ 9.10 = 2,766.40 · 26 h @ 68.00 = 1,768.00 → **4,534.40** | 6,850.00 |
| `SYN-PPO-VAR-024102` — elevated access method change | 19 Jul 2026 | **Not recorded** — no estimating cost version was prepared | 2,400.00 |

`SYN-PPO-VAR-024102` is acknowledged, not included. Its selling price is not used as a cost budget anywhere.

**Comparison basis** = 46,804.80 + 4,534.40 = **51,339.20**.

### 12.4 Attributable actuals

| Line | Source evidence | Actual qty | Actual rate | Actual cost |
|---|---|---:|---:|---:|
| SCR-CLOTH | Issue `SYN-ISS-4471` 2,598 m² @ 8.95, return `SYN-RET-0219` −88 m² @ 8.95 → used 2,510 m² | 2,510 | 8.95 | 22,464.50 |
| SCR-DRIVE | Invoice `SYN-INV-88117`, five units (the fifth replaced a transit-damaged unit) | 5 | 1,850.00 | 9,250.00 |
| SCR-INST | Reviewed labour `SYN-LAB-3318`, base installation task | 291 | 68.00 | 19,788.00 |
| FRT-INB | Invoice `SYN-INV-88190`, sea freight and customs handling | 1 | 4,180.00 | 4,180.00 |
| SCR-CLOTH-V1 | Issue `SYN-ISS-4502`, blackout cloth for the approved variation | 312 | 9.42 | 2,939.04 |
| SCR-INST-V1 | Reviewed labour `SYN-LAB-3319`, variation task | 34 | 68.00 | 2,312.00 |
| | **Attributable actual cost (comparable lines)** | | | **60,933.54** |

### 12.5 Line variances and decomposition

| Line | Estimated | Actual | Variance | % | Quantity | Rate | Joint | Residual |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| SCR-CLOTH | 20,428.80 | 22,464.50 | +2,035.70 | +9.96% | +655.20 | +1,337.60 | +42.90 | 0.00 |
| SCR-DRIVE | 7,400.00 | 9,250.00 | +1,850.00 | +25.00% | +1,850.00 | 0.00 | 0.00 | 0.00 |
| SCR-INST | 15,776.00 | 19,788.00 | +4,012.00 | +25.43% | +4,012.00 | 0.00 | 0.00 | 0.00 |
| FRT-INB | 3,200.00 | 4,180.00 | +980.00 | +30.63% | 0.00 | +980.00 | 0.00 | 0.00 |
| SCR-CLOTH-V1 | 2,766.40 | 2,939.04 | +172.64 | +6.24% | +72.80 | +97.28 | +2.56 | 0.00 |
| SCR-INST-V1 | 1,768.00 | 2,312.00 | +544.00 | +30.77% | +544.00 | 0.00 | 0.00 | 0.00 |
| ACCESS-V2 | *Not established* | 1,960.00 | *Not established* | n/a | — | — | — | — |
| **Comparable totals** | **51,339.20** | **60,933.54** | **+9,594.34** | **+18.69%** | | | | |

Every decomposition reconciles exactly; the model check asserts `quantityEffect + rateEffect + jointEffect + residual = Δcost` on every decomposed line.

### 12.6 The reconciliation

```
Issued estimate cost basis                                    50,424.00
Scope change at acceptance                                    − 3,619.20
Approved change cost basis (SYN-PPO-VAR-024101)               + 4,534.40
                                                              ──────────
Comparison basis                                              51,339.20
Attributable actual cost                                      60,933.54
                                                              ──────────
Delivery variance                                             + 9,594.34   (+18.69%)

Total cost variance against the issued basis
    = 60,933.54 − 50,424.00                                  = +10,509.54
    = (−3,619.20) + 4,534.40 + 9,594.34                      = +10,509.54   ✓
```

### 12.7 Held outside the comparison — never netted

| Matter | Amount | Treatment |
|---|---:|---|
| `SYN-INV-88204` elevated access hire — approved variation with no cost basis | 1,960.00 | Attributable actual, no estimated basis; no variance computed |
| `SYN-PPO-REQ-024118` open purchase order, two spare drive kits | 3,700.00 | Commitment; ordered and not received at the cut-off |
| `SYN-INV-88228` shared site establishment and crane hire | 5,600.00 | Excluded pending an adopted allocation basis; open outstanding matter |
| `SYN-INV-88213` line 3, gutter brackets, no breakdown code | 742.20 | Excluded as unmapped; open outstanding matter with the reviewer's question |
| `SYN-CLM-00318` approved supplier claim, credit not issued | 1,850.00 | Excluded from cost; open outstanding recovery |
| `SYN-CINV-55021` customer progress invoice | 42,000.00 | Excluded — customer billing is not a job cost; retained for context |

### 12.8 What the reconciliation actually says

The delivered outcome cost **10,509.54 more than the issued estimate**. Reading that as a 21% estimating failure would be wrong on three counts, and the ladder shows why:

- **−3,619.20** of it is scope the customer removed before accepting. The estimate was never delivered as issued.
- **+4,534.40** of it is an **approved variation with its own approved cost basis**. That is scope the business agreed to add and priced separately; it is not an estimating defect.
- **+9,594.34** is the delivery variance — the part the estimate is actually accountable for, and even that decomposes: roughly 1,850.00 of it is a transit-damaged unit awaiting an approved-but-unissued supplier credit, and 4,012.00 is an installation-hours assumption that did not hold.

Separately, **8,120.00 of commercial movement** — 3,620.00 of scope and 4,500.00 of negotiated discount — sits entirely outside this analysis, because a discount conceded to win the order teaches the estimator nothing about screen installation.

That is the whole point of the module: the same job supports one honest conclusion about estimating, a different one about commercial negotiation, and a third about delivery, and they are not the same number.

---

## 13. The other demonstration journeys

| # | Journey | Where |
|---|---|---|
| 1 | **Quantity-only comparison with missing cost rates.** No supplier invoice is posted and the catalogue cost source expired before the order. Quantities compare (18 EA estimated, 21 EA issued; 54 h estimated, 61.5 h reviewed); cost is withheld on both sides and the identity is unavailable. | `SYN-EAR-0003` Greenhaven Produce |
| 2 | **Shared cost requiring allocation review.** 5,600.00 naming two projects; equal split refused; a measured basis accepted with a reason; the unallocated remainder preserved; finally held out entirely pending an adopted basis. | `SYN-EAR-0001` observation `SYN-INV-88228` |
| 3 | **Unmatched actual line.** A supplier invoice line with no breakdown code, preserved with its reviewer question, excluded from the comparison and tracked as an outstanding matter. | `SYN-EAR-0001` observation `SYN-INV-88213` |
| 4 | **Currency and unit incompatibility.** An invoice in EUR priced by mass against an estimate in AUD priced by length. Allocation refused, submission blocked, both missing conversion bases recorded as owned outstanding matters. | `SYN-EAR-0004` Cedar Vale Growers |
| 5 | **Source update after review.** A revised freight invoice posted after the cut-off: source revision advances, the concluded result is frozen at 9,594.34, the live comparison moves to 10,034.34, conclusion is blocked pending refresh. | `SYN-EAR-0001` |
| 6 | **Provisional review with outstanding financial evidence.** Three open matters force *Reviewed — provisional*; the complete option is not offered and the model refuses it. | `SYN-EAR-0001` |
| 7 | **Lost submission response recovered without duplicate findings.** The save response is lost, a recovery banner appears, the original operation identity is replayed, and the result is byte-identical with exactly one record created. | *Preview options → Next record save: Response is lost* |
| 8 | **Switching customers and identities without mixing records.** Five reviews across Northbank Nursery, Greenhaven Produce, Cedar Vale Growers and Willowbank Horticulture; switching review or role re-renders every view against that record and boundary alone. | Register and context selector |

A ninth, `SYN-EAR-0005` Willowbank Horticulture, demonstrates **captured hours that are not yet reviewed hours** and a freight invoice not posted at the cut-off — the ordinary "delivery is finished, the financial picture is not" case.

---

## 14. Incoming evidence and outgoing boundaries

### 14.1 What ES-09 consumes

| From | Evidence | Actual state on `main` |
|---|---|---|
| Estimating (E1/E2) | Immutable estimate cost version, option, line identity, source and effective date, supplier price sources, quoted price | **Implemented** for E1 manual estimates and the adopted E2 subset. Durable cross-version line identity and a shared cost breakdown code **do not exist** (r05 preconditions P2 and P3). |
| ES-05 / ES-06 | Accepted quotation revision and acceptance evidence | **Open draft PR #212**; design only. |
| ES-08 | Specialist configuration and formula provenance | **Open draft PR #210**; formula evidence received, not accepted as an approved definition pack. |
| Projects | Approved variations with their own cost basis, delivery target identity | **Design only** (readiness r01/r02); `ppo.projects` carries no cost field and no commercial link to an estimate or quote (r05 precondition P1). |
| Service | Reviewed labour, travel, parts and findings | **Implemented** through P07/P09/P10 for the PP-01 journey. |
| Supply Chain | Issues, returns, receipts, allocations, supplier claims | **Candidate contract only**; no runtime. |
| Warranty / returns | Supplier claim, physical return, credit and unrecovered disposition | **Open draft** design only. |
| Finance | Cost definitions, posted and committed cost, reconciliation state | **Partly implemented** (P10 handoff). FD-05 posted cost and FD-06 open committed cost are **undefined** pending D-017. |
| Sales aftercare (CR-05) | Post-installation feedback as context | **Not started.** Recorded here as context only; it cannot establish causation or attribution. |

**The commercial lineage this module needs does not exist yet.** That is the single largest receiving requirement, and it is stated plainly rather than assumed: today no estimate version, quote revision or breakdown code is reachable from a delivered project or work order.

### 14.2 What ES-09 produces, and where it stops

| Output | Boundary |
|---|---|
| A reviewed comparison bound to an exact basis, source set and definition version | Read-only once concluded; correction by successor |
| Reviewed explanations with shares and an unexplained remainder | Judgements, not facts; not a performance measure |
| Findings with cited comparison evidence and stated limits | One case, never a rule or a benchmark |
| A **locally prepared ES-10 handover** | Creates no ES-10 record, sends no notification, and changes no calculator, rate, mapping or price |
| Owned follow-up actions and outstanding financial matters | Owned inside the review; they close nothing elsewhere |

**ES-09 never alters**, and the workspace states this on screen: Screen Systems formulas · approved input ranges · parts mappings · labour rates · catalogue prices · existing estimates or quotations · historical job results.

### 14.3 Receiving application requirements

Documented separately, as the instruction requires. The application increment that receives this design must establish:

1. **Commercial lineage** — estimate version, quote revision and delivery-target references reachable from the delivered object (r05 precondition P1).
2. **Durable line identity or a shared cost breakdown code registry**, versioned, owned, and bound at save (P2, P3).
3. **A declared comparison basis record**, versioned, with a cost definition that cannot be null at submission (P4).
4. **Server-enforced permissions** on every read, aggregate, search, export and receipt lookup, including the restricted-narrative boundary of section 11.2.
5. **Durable operations**: operation UUID, canonical payload hash, expected-version guard, receipt, audit and outbox — the existing PPO pattern, including replay of the same identity and refusal of changed content.
6. **Source adapters** that record system, entity, record identity, version, status and observation time, and that never infer a conversion or a match.
7. **Concurrency and locking** so two reviews cannot allocate the same source quantity twice.
8. **Immutable conclusions** with successor linkage, and retention of every superseded comparison.
9. **Adopted registries** for variance reasons, allocation bases and materiality, each with a named owner and approval authority.
10. **Resolved definitions** — FD-05 and FD-06 under D-017 — before any Projects cost read is trusted, and before any margin measure is displayed at all.

None of these exists today. This design is buildable in increments only after items 1–3 and 10.

---

## 15. Visual and interaction specification

| Rule | Applied behaviour |
|---|---|
| Module beneath a shared shell | Single scope container `#ppo-outcome-review`; no rail, logo, global header or duplicate navigation. |
| Palette | `#242a37` navy, `#62bb46` green, `#f5f6f8` workspace, white surfaces; labelled warning and danger states with words and icons, never colour alone. |
| Typography | Embedded Roboto 400/500/700 from r20; 25 px page title, 19 px view heading, 15 px card heading, 14 px body, 12–11 px metadata. |
| Numeric treatment | Right-aligned, tabular numerals, thousands separators, negatives in parentheses, AUD and tax basis visible, and an explicit *Not established* instead of zero. |
| Controls | 40 px controls, 44 px form inputs, 6 px control radius, 7 px card radius, 10 px dialog radius; native labels and visible focus. |
| Registers | Semantic tables with sticky headers inside bounded scroll regions; phone layout converts every row to a labelled stacked card. |
| Comparison table | Horizontally scrollable at desktop widths; at 600 px and below each line becomes a labelled card so no comparison column is hidden. |
| Docked source snapshots | Right-hand `dialog.drawer` at 560 px, full width on phone; native Escape and focus return. |
| Focused decisions | Native `<dialog>` with a sticky footer, inline error region with `role="alert"` and focus, and entries preserved on failure. |
| Responsive | Verified with no horizontal overflow at 1440×960, 1024×768, 820×800, 390×844 and 320×740. |
| Keyboard | Skip link to content; Arrow Left/Right move between view tabs; Escape closes a dialog and returns focus to its opener. |
| Australian conventions | Australian English throughout; dates read *16 September 2026* in prose and ISO 8601 in filenames; AUD with GST stated separately. |

---

## 16. Working interactions versus future application requirements

| Behaviour | In this HTML | In the application |
|---|---|---|
| Role selection | Display control that re-renders the restricted boundary | Authenticated identity with server-enforced grants on every read, aggregate, search, export and receipt |
| Comparison basis declaration | Local record with actor and time | Versioned record bound to immutable estimate and quote identities with hashes |
| Source observations | Authored synthetic fixtures | Adapter reads recording system, entity, version, status and observation time, with completeness reported per query |
| Allocation | Local mapping with share, basis and reason | Server-side quantity conservation, locking against competing allocations, and an adopted basis registry |
| Duplicate detection | `dedupeKey` on the fixture | A source-derived economic key, or an explicit reviewer decision where no key exists |
| Conversions | Locally recorded, not applied to arithmetic | A versioned, approved conversion basis with its own authority |
| Version guard | `expectedVersion` in page memory | Database-level expected-version checks inside the workspace transaction |
| Receipts and recovery | Page-session receipts keyed by operation identity | Durable operation receipts, audit and outbox with reauthorisation before replay |
| Persistence | `localStorage` under one key, with preserved damaged bytes | PostgreSQL with migration, backup and retention |
| Export | Browser download of labelled synthetic JSON | A permissioned export with its own audit record |
| Receiving handovers | Local proposals with no effect | Domain commands against ES-10, Finance and Projects, each with its own authority |
| Links to other modules | Repository links to design files | Application routes under current permissions |

The HTML's receipts, version guard and recovery are **page-session behaviour**. They demonstrate the required semantics; they are not evidence of database or HTTP idempotency.

---

## 17. Synthetic data and identity

Every record is synthetic. Customer, site and facility identities reuse existing repository fixtures for continuity: **Northbank Nursery** with `SYN-PPO-SITE-000012`, `SYN-FAC-NB-GH02` and work order `SYN-PPO-WO-000241` from Equipment r02 and the Quality workspace; **Willowbank Horticulture** with project `SYN-PPO-PRJ-024001` from Projects readiness r01; **Greenhaven Produce** and **Cedar Vale Growers** from the Quality fixture.

`SYN-PPO-` references follow the PPO-STD-001 type catalogue for existing types (OPP, EST, QUO, PRJ, WO, VAR, REQ, SITE, AST). `SYN-EAR-nnnn`, `SYN-ISS-`, `SYN-RET-`, `SYN-INV-`, `SYN-LAB-`, `SYN-CLM-`, `SYN-CINV-` and `SYN-SUP-Q-` are **local design fixture labels**, not new entries in the reference type catalogue and not server-allocated references. No counter is implemented.

Estimator, delivery owner, reviewer and Finance names are fictional. Proposed department roles assign no employees and establish no corporate sponsorship.

---

## 18. Capability to HTML and verification traceability

| # | Required capability | HTML surface | Verified by |
|---|---|---|---|
| 1 | Searchable register of scopes requiring review | View 1 register, six filters, five named views | Browser: *Five views and the five-row register…*, *Named views, filters and search…* |
| 2 | Delivery completion and financial completeness separate | Status and Sources columns, completeness declaration | Browser: *Delivery completion and financial completeness are separate columns* |
| 3 | Incomplete sources never a zero-cost job | *Not established* rendering; withheld line count | Model: *Variance uses actual minus estimated…*; *A quantity-only comparison…* |
| 4 | Filter and navigation context preserved | Selection keeps search, filters and named view | Browser: *Selecting a review keeps the search context…* |
| 5 | Exact issued basis retained | Issued basis card and docked snapshot | Model: *Issued, accepted and approved-change bases stay separate records* |
| 6 | Exact accepted basis retained | Accepted basis card | Model: same |
| 7 | Approved changes with their own cost basis | Approved change records with cost lines | Model: *An approved change with no cost basis cannot be added…* |
| 8 | Variation selling price is not a cost budget | Refusal at basis declaration; separate reporting | Model: same; Browser: *Declaring the comparison basis records what it includes* |
| 9 | Combined basis names its records without overwriting | Basis declaration note; both originals inspectable | Model: *Declaring a basis never rewrites the issued or accepted originals* |
| 10 | Negotiated price separate from cost | Commercial card; components; margin withheld | Model: *Negotiated price movement stays out of the cost comparison* |
| 11 | Source register with full identity and status | View 3 observation rows | Browser: *An unresolved shared cost and an unissued credit…* |
| 12 | Ordered/received/issued/used/returned/invoiced/paid distinct | `quantityClass` on every observation | Model: *Quantity classes are preserved and a store return reduces consumption…* |
| 13 | Commitments are not actual cost | Treatment refusal | Model and Browser: *A commitment … can never be treated as actual cost* |
| 14 | Captured hours are not reviewed hours | Treatment refusal | Model: *A commitment, customer billing and unreviewed capture…* |
| 15 | Customer invoices are not job costs | Treatment refusal | Model: same |
| 16 | Double counting prevented | `dedupeKey` conflict blocks submission | Model: *Possible duplicates between two source systems…* |
| 17 | One-to-many and many-to-one allocation | Mapping records with shares | Model: *A shared cost cannot be split equally…* |
| 18 | Shared cost needs an adopted basis; no equal split by default | Allocation basis registry and refusal | Model and Browser: same |
| 19 | Unmapped records and partial allocations preserved | Unallocated remainder with reason | Model: *An unallocated remainder is preserved…* |
| 20 | No forced match on description | No matching logic exists; unit and currency guards | Model: *Different units cannot be allocated together…* |
| 21 | Quantity precision and approved conversions retained | Exact integer thousandths; conversion records | Model: *Serialised state round-trips…*; section 19.2 |
| 22 | Units and currencies not compared without a basis | Mapping and submission refusals | Model: *A different currency cannot be allocated…* |
| 23 | Quantity-only comparison supported | Comparable status *Quantity only* | Model: *A quantity-only comparison is supported…* |
| 24 | Estimated and actual quantities, rates, costs | View 4 comparison table | Browser: *Variance uses actual minus estimated…* |
| 25 | Absolute and percentage differences with explicit denominator | Variance and % columns; footer denominator | Browser: same |
| 26 | Zero/missing/unsuitable denominators handled | `n/a` with reason | Browser: *An unsuitable denominator shows n/a…* |
| 27 | Scope changes and approved variations shown | Reconciliation ladder terms | Model: *The three comparisons satisfy the recorded identity* |
| 28 | Outstanding commitments shown separately | Held-outside card | Model: *Actual with no estimated basis and commitments…* |
| 29 | Comparison status and completeness shown | Status column; completeness chips | Browser: *Delivery completion and financial completeness…* |
| 30 | Sign convention defined | Stated in the view heading and this report | Browser: *Variance uses actual minus estimated…* |
| 31 | Decomposition documented and reconciling | q / r / j / residual columns | Model: *Quantity, rate and joint effects reconcile exactly…* |
| 32 | Reason categories, multiple causes, unexplained remainder | Explanation records with shares | Model: *Attributed shares cannot exceed the observed difference…* |
| 33 | Observed / suspected / reviewed kept distinct | Three record types | Model: *A suggestion, a reviewed proposal and an approved change…* |
| 34 | Margin only where defined | Withheld with the missing definition named | Model: *Negotiated price movement stays out…* |
| 35 | Returns, credits and unresolved made visible | Outstanding matters card | Model: *An anticipated recovery is never netted…* |
| 36 | No automatic netting of anticipated recovery | Excluded treatment plus outstanding record | Model: same |
| 37 | Provisional review retained with cut-off and follow-up | `ReviewedProvisional` with frozen snapshot | Model and Browser: *A review with open financial matters…* |
| 38 | New evidence creates a successor | `supersedes` / `supersededBy` | Model and Browser: *A successor review carries the new evidence…* |
| 39 | Structured findings with limits and owner | View 5 finding records | Browser: *A finding cites its evidence…* |
| 40 | Routing to ES-10 without automatic change | Local handover; explicit refusal statement | Model and Browser: *The handover changed no estimating basis…* |
| 41 | One job is one case | Stated in the view heading, the form and each finding | Browser: *A finding cites its evidence…* |
| 42 | Proposed permissions without assigning authority | Four fictional capabilities | Model: *A read-only observer holds no action authority* |
| 43 | Restricted information protected in page, summaries, search and export | Restricted renderers, search source, export redaction | Browser: *The read-only observer sees no restricted amount anywhere*; *Search never matches a restricted amount…* |
| 44 | Source changes during review | Source-change control and refresh requirement | Model and Browser: *A source change after conclusion…* |
| 45 | Stale comparison and concurrent edits | `expectedVersion` guard | Model: *Wrong role and stale version are refused atomically* |
| 46 | Save failure and lost response | Demo controls, preserved form, receipt recovery | Browser: *A failed save changes nothing…*; *A lost response is recovered…* |
| 47 | Identity and access switching | Review selector and role control | Browser: *The read-only observer sees no restricted amount anywhere* |
| 48 | Decisions bound to basis, sources and definitions | Frozen conclusion snapshot | Model: *Provisional conclusion retains the cut-off, snapshot and outstanding matters* |
| 49 | ES-09 closes no originating record | No outward state change | Model and Browser: *Concluding … closes no originating record* |
| 50 | Damaged session preserved | Raw-bytes inspection and deliberate reset | Browser: *A damaged saved session is preserved…* |
| 51 | Desktop, tablet and phone presentation | Five viewports, all five views | Browser: *All five views fit desktop, tablet and phone viewports…* |
| 52 | Keyboard behaviour | Skip link, tab arrows, dialog Escape | Browser: *Keyboard navigation, dialog escape and the skip link…* |

---

## 19. Arithmetic, rounding and precision

### 19.1 Money

Money is held as **exact integer cents**. A decimal string is parsed by digits, never through a binary float. An extension is `quantity(thousandths) × rate(cents) ÷ 1000`, rounded **HALF_UP** to cents, then summed with scaled integers — the same discipline as the adopted `SYN-EST-ARITHMETIC-01` subset in the E1 contract. Negative amounts are exact and display in parentheses.

### 19.2 Quantity

Quantity is held as **exact integer thousandths** (three decimal places, matching E1's quantity bound). Display trims trailing display zeros only; no value is rounded and no precision is inferred from a source that did not state it. A quantity that is not established is `null` and renders *Not established*, never `0`.

### 19.3 Derived rate

An actual rate is derived only when both the mapped cost and the mapped quantity are established and the quantity is non-zero: `rate = cost × 1000 ÷ quantity`, HALF_UP to cents. Otherwise it is *Not established*, and the decomposition is withheld.

### 19.4 Allocated share

A share is applied to the source amount and to the source quantity independently, each rounded HALF_UP. Because the unallocated remainder is reported separately rather than implied, share rounding cannot silently create or destroy value in the totals.

### 19.5 Percentage

`round(variance ÷ estimated × 10000) ÷ 100`, giving two decimal places. Computed only when both sides are established and the denominator is non-zero.

---

## 20. Verification, limitations and open decisions

### 20.1 What was executed

| Check | Command | Result |
|---|---|---|
| Deterministic assembly | `python3 scripts/build-estimate-actual-review.py` | Built; output byte-identical on repeat |
| Model and command rules | `node scripts/check-estimate-actual-review-model.mjs` | **39 groups passed** |
| Native browser interaction | `node scripts/check-estimate-actual-review-browser.mjs` | **29 groups passed**, zero page or console errors |
| Documentation foundation | `python3 scripts/check_foundation.py` | Passed |
| Prototype consistency | `python3 scripts/check_prototype.py` | Passed |
| Naming and register | `python3 scripts/check_naming.py` | Passed |
| Conflict markers | `git --no-pager grep -n -E "^(<<<<<<<\|=======$\|>>>>>>>)" -- docs` | No match |
| Visual inspection | 23 original captures at 1440, 390 and 320 px across all five views, plus observer, conclusion and source-changed states | Reviewed; one defect found and corrected (see 20.3) |

Exact hashes, capture list and the browser manifest are recorded in the [verification evidence](../../../testing/evidence/estimate-actual-review-r01/README.md).

### 20.2 What was not executed, and why

- **The pinned Chrome channel was not available in the authoring environment.** The native checks ran against the bundled Chromium **141.0.7390.37** through the `PPO_BROWSER_EXECUTABLE` override, and the browser manifest records which binary ran. The repository's pinned Chrome 153 run happens in the focused GitHub Actions workflow added with this contribution; **its result is not inherited here and must be read from the workflow run**.
- `npm ci` could not run in the authoring environment because `package.json` pins Node 24.21.0 and npm 11.19.0. Playwright 1.63.0 was installed standalone for the check only; **no dependency pin, lockfile or `package.json` entry was changed**.
- No screen-reader, 200% zoom, print-pagination or physical-device review was performed.
- No accessibility certification is claimed. Contrast pairs follow the shared specification's calculated values; this is not a WCAG conformance statement.
- No application, database, hosted environment or external system was touched.

### 20.3 Defects found and corrected during this work

| Finding | Correction |
|---|---|
| At 390 px and 320 px the comparison table required horizontal scrolling, pushing comparison columns out of view on a phone. | Added a phone treatment converting each comparison line into a labelled stacked card, so no comparison column is hidden at any verified viewport. Re-verified. |
| A reviewer's free-text explanation quoting a supplier rate was visible to the read-only observer, defeating the restricted boundary. | Added a `Restricted narrative` renderer for every free-text field recorded beside a restricted value, applied in the page, in summaries and in the export. |
| The export retained operation-receipt payloads containing the original command text verbatim, including restricted narrative. | Receipt payloads are redacted in a restricted export, and the envelope states that they were. |

### 20.4 Limitations that remain

1. **Free-text disclosure.** A finding narrative is deliberately visible to the observer because findings are the shareable learning. A reviewer could still type a restricted rate into one. No technical control closes this; it is a policy and review-practice matter.
2. **No cost breakdown code registry.** Comparison lines in this design are bound to their estimate line code. Without the shared registry the r05 blueprint identifies as load-bearing (precondition P3), cross-job learning at driver level is not possible — which is precisely why ES-10, not ES-09, owns calibration.
3. **The identity check is an integrity check, not a proof of completeness.** It holds when the three bases are established; it says nothing about whether the source set is complete. Completeness is a separate declaration for exactly that reason.
4. **Single-case evidence.** Every finding in this workspace rests on one job. No sample size, median or range is computed anywhere, and none should be until ES-10 exists.
5. **Simulated sources.** Every MYOB read is labelled *(simulated read)*. No ERP endpoint is invented, called or implied.

### 20.5 Open decisions for the owner

| # | Decision | Why it matters |
|---|---|---|
| 1 | Is the register's ES-09 meaning (estimate-to-actual) or the estimating screen specification's ES-09 meaning (issue and response) the canonical one? | Two documents currently use the same identifier for different pages. |
| 2 | Is a reference type code added to PPO-STD-001 section 10.2 for an outcome-review record, and is it `DOR`, `OCR` or something else? | `SYN-EAR-` is a fixture label. A real record needs a deliberate type-code amendment. |
| 3 | Who owns the variance reason registry, and is the proposed twelve-code set adopted? | An unowned registry decays within a year, and it carries the non-punitive policy. |
| 4 | Who owns the allocation basis registry, and which bases are adopted? | Today only `direct` is adopted, which forces most shared costs to be held out. |
| 5 | What materiality basis applies, per size band? | A single dollar threshold cannot work across a 5,000 to 10,000,000 range. |
| 6 | Is non-punitive use stated as policy? | It determines whether the recorded data is truthful. Blame drift is the largest failure mode in the r05 risk table. |
| 7 | Is the quantity / rate / joint decomposition accepted as a presentation, and is it explicitly *not* accounting policy? | It is persuasive and will be quoted; its status should be recorded before that happens. |
| 8 | Are FD-05 and FD-06 resolved under D-017 before any Projects cost read is trusted? | Projects coverage is blocked until they are. |
| 9 | Can a finding narrative be visible to a restricted reader, or must it be reviewed before release? | The residual disclosure route at 20.4 item 1. |
| 10 | Is the accepted-Sales-Quote population in scope for outcome review at all? | r05 decision 1f is still open; this design supports it but does not assume it. |

---

## 21. The next bounded application increment

Not the whole module. The smallest slice that is genuinely useful and genuinely verifiable:

> **ES-09/A1 — Comparison basis record and read-only comparison, Service delivery target only.**
>
> Add a persisted comparison-basis record binding an existing immutable estimate cost version and draft quote revision to an existing work order, with a declared cost definition and quantity class that cannot be null at submission. Pre-populate the actual side from **existing P09-reviewed quantities only** — the one source PPO already owns — with treatment, allocation share and reason recorded per observation. Render the line comparison, the sign convention, the explicit denominators and the withheld states. **No decomposition, no reason registry, no findings, no ES-10 handover, no Projects target, no ERP read.**

It is the right first slice for three reasons. It needs no new source system, because reviewed service quantities already exist and are already reviewed. It exercises the two integrity behaviours that are expensive to retrofit — declared basis and declared completeness — against real persistence, permissions and concurrency. And it deliberately stops short of attribution, which needs the reason registry, its owner and the non-punitive policy to exist first.

Projects coverage follows only after commercial lineage (P1) exists and FD-05/FD-06 are resolved. Calibration is ES-10's, not this module's, and remains impossible until a rule registry and an approval authority exist.

---

## 22. Revision record

| Revision | Date | Change |
|---|---|---|
| r01 | 16 September 2026 | First ES-09 design package: five-view interactive workspace, this report, the reproducible source, the verification record and the receiving requirements. Based on `main` `0769a16dd842e9dc1c349a853036ab71949e7807`. No predecessor exists; nothing is superseded. |

---

*Powerplants One is Dean Fiedler's personal synthetic prototype. This document is a proposed design and a receiving-requirements record. It is not business acceptance, not an accounting policy, and not a test of application behaviour, which does not exist for this scope.*
