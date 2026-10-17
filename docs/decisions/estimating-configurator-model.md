---
document_id: PPO-EST-CONFIGURATOR-MODEL-DEC
date: 2026-10-17
owner: Dean Fiedler
status: Proposed for owner review; records Dean's stated intent, but none of the proposals are adopted, and it authorises no code, migration, seed, permission, integration or deployment
source_commit: 271a386b98c0aa612a86a34c03b0ab1da6073b8e
versioning: git
---

# Estimating hub, CPQ and specialist workbench model — proposed decision

On 17 October 2026 Dean asked how the Estimation Wizard, CPQ, the Screen Configurator Workbench, the Priva Fertigation Configurator Workbench and Estimation Discovery fit between a Deal handover and the quotation. A walk-through of the current source showed that the modules are joined differently from how he intended. Dean then set out his intended model and asked for a professional opinion. He accepted the recommendation to record it, in these words: "Yes, draft a proposed decision record for the hub, CPQ and workbench model, including the shared workbench output contract, and identify which existing decisions it would change."

This record is that draft. It classifies each item as one of three things. A **user direction** is Dean's stated intent. A **proposal** is Claude's recommendation for carrying that intent out, and it is not adopted. An **open question** is a decision still for Dean. Nothing here changes an existing decision until Dean adopts it, and each adopted part still needs its own ADR or contract change before it is built.

Scope IDs: `scope:ES-02` (Estimation Wizard and discovery), `scope:ES-03` (costing and CPQ), `scope:ES-08` (Screen Configurator Workbench), the ES-02 fertigation scope of [ADR-0038](ADR-0038-priva-fertigation-native.md), and `scope:ES-05` for quotation output only. The parent requirements served are EST-01 to EST-09. No parent ID is added, renamed or closed, and all 78 parent IDs are unchanged.

## 1. Summary

| ID | Item | Classification | In one line |
|---|---|---|---|
| — | Wizard as hub, CPQ as priced table, workbenches as automated parts calculators that also produce supporting documents | User direction, 17 October 2026 | Section 2 quotes it in full |
| CM1 | Wizard routes each system to a branch | Proposal | A versioned category-to-branch map advises the route; the estimator confirms it, with a reason when they override it |
| CM2 | Direct-to-CPQ path | Proposal | CPQ can be opened straight from an estimating workspace, using a short Express scope instead of a full discovery |
| CM3 | CPQ is the single priced line table | Proposal | Every line has one origin: Rule, Workbench or Manual. Prices are set only in CPQ |
| CM4 | Manual Product-ID entry in CPQ | Proposal | The estimator picks an exact Products Variant, and CPQ prices it from that Variant's governed cost source |
| CM5 | Shared workbench output contract | Proposal | A server-generated **parts proposal**: parts, quantities, findings and documents, with no prices |
| CM6 | Receiving a proposal into CPQ | Proposal | Reuses CPQ's receiving preview. A re-run replaces only that workbench's unchanged lines, and estimator adjustments survive as reasoned overrides |
| CM7 | Pricing leaves the workbenches | Proposal | ES-08's Pricing view becomes a Parts view, and its price bridge retires |
| CM8 | Unmapped parts | Proposal | A part with no published Variant arrives flagged as Unmapped and blocks use in the estimate until it is mapped or made an explicit one-off |
| CM9 | Supporting documents in the quotation | Proposal | Customer-eligible workbench documents can be chosen as appendices when the quotation is prepared, bound by exact bytes |
| CM10 | Adding future workbenches | Proposal | A new workbench registers against the contract. CPQ, the Wizard and the quotation need no bespoke change |
| CM11 | Build order | Proposal | B0 to B6, piloted on Screen systems, then Fertigation |
| Q1–Q9 | Questions for Dean | Open questions | Section 8, each with a recommended answer |

## 2. Dean's intended model (user direction)

Dean's words, 17 October 2026:

> 1. The Estimation Wizard - this would be the hub and would determine the which branch/flow to use for the estimate.
> 2. CPQ - this estimator can go directly to this module and manually enter part and/or product ID's into the CPQ table which would then calculate pricing, etc.
> 3. The Screen and Priva Fertigation Workbenches - these are specialised modules that would serve as a stepping stone to the CPQ module. They would use specification inputs from the estimator to automatically generate parts and quantities that could then be used to automatically populate the CPQ table. It would basically be like an automated parts calculation tool. The estimator could then make any adjustments in the CPQ module if needed. These specialised workbenches also generate supporting information such as layout drawings, diagrams, etc., that could possibly flow through to the quotation and be loaded into the customer facing quotation document if needed. We will also be adding other specialised configurator workbenches in the future for things such as; Potting Machines, Control Systems, Sensors, Automation, etc., but we can use the Screen and Priva Fertigation Workbenches initially to test the journey/flow.

"Estimation Discovery" is the Discovery register at `/estimating/discovery` (titled "Scope and options"). The Estimation Wizard is one record in that register, at `/estimating/discovery/{id}`. This record treats them as one module.

### Claude's assessment

The model is sound. It matches the usual hub-and-configurator pattern, and it fixes three weaknesses of the current source:

- **Prices in one place.** Today ES-08 prices its own lines and writes them straight into the estimate, CPQ prices rule lines, and manual costing prices hand-entered lines. That gives three pricing paths and three places to correct a rate.
- **One rule for every workbench.** Today ES-08 writes priced estimate lines, while Fertigation attaches scoping notes and generates no lines ([ADR-0038](ADR-0038-priva-fertigation-native.md), lines 74–76). An estimator cannot predict what finishing a workbench does.
- **New workbenches scale.** Today each specialist module is a bespoke integration ([ADR-0034](ADR-0034-es08-specialist-workbench.md), [ADR-0038](ADR-0038-priva-fertigation-native.md)). Four more on that pattern would mean four more integrations into the estimate and the quotation.

The model's main risk is stale or overwritten work. An estimator adjusts a generated line in CPQ, the workbench is then re-run, and the adjustment is either lost or silently kept against a basis that no longer exists. CM6 addresses this. The second risk is parts that do not resolve to a catalogue Product (CM8). The third is drawings reaching a customer with an unclear status (CM9, Q5).

## 3. Constraints taken as fixed

These come from adopted decisions and are not reopened here:

- **Server authority.** Generated lines are calculated on the server and never accepted from the browser ([CPQ API](../interfaces/cpq-api.md): "never accept client-calculated cost lines").
- **Immutable records.** Discovery revisions, CPQ runs, workbench runs and estimate versions are immutable. Existing quotations keep their original exact estimate version ([ADR-0034](ADR-0034-es08-specialist-workbench.md), line 106).
- **Customer-safe output.** Costs, discounts and overrides stay internal. The quotation projection whitelists customer fields ([CPQ runtime](cpq-native-runtime.md), line 19; [ADR-0017](ADR-0017-estimating-e1.md), line 11).
- **Exact Product binding.** A Product binding is an exact Variant, revision and content hash, never "latest" by label ([CPQ published Products](cpq-published-products.md); [CPQ API](../interfaces/cpq-api.md), line 104).
- **Classification is not suitability.** An equipment category is "not product selection, unit conversion, engineering suitability, price or a costing rule" ([ADR-0054](ADR-0054-es02-equipment-catalogue.md), line 19). A route (CM1) only chooses where parts are calculated.
- **Authorities.** MYOB keeps ERP items, stock and purchasing, SharePoint keeps business documents and native CAD keeps authored files ([ADR-0048](ADR-0048-products-native-catalogue.md), line 29; [AGENTS.md](../../AGENTS.md)). Workbench drawings are estimating studies: every ES-08 sheet reads "Estimating study · not for fabrication" ([ES-08 design board](es08-design-board.md), line 99).
- **Synthetic only.** Rules, prices, mappings and fixtures stay synthetic. Passing fixtures is software evidence, not engineering or pricing approval.

## 4. Target journey

```text
Sales brief accepted at Intake
 └─ Estimation Wizard (hub): one opportunity, one site, alternatives A/B…
     Requirements → Configuration → Scope & delivery → Pricing → Review
     Each system in Configuration shows its route (CM1) and its status:
       Not started · In progress · Proposal ready · In CPQ · Stale
     │
     ├─ Workbench route ── Screen / Fertigation / (future) ──▶ parts proposal (CM5)
     │                                                          │ receiving preview (CM6)
     ├─ Direct CPQ route ─────────────────────────────────────▶ │
     │                                                          ▼
     └──────────────────────────────────────────────▶ CPQ: one priced table per alternative
                                                       origins: Rule · Workbench · Manual (CM3, CM4)
                                                       adjustments are reasoned overrides
                                                       │ Use (existing atomic adoption)
                                                       ▼
                                               Native estimate version → ES-04 review
                                                       ▼
                                   Quotation ES-05: prepare (choose appendices, CM9) → approve → issue
```

One CPQ configuration per discovery alternative collects every route that alternative uses. The estimate and quotation steps after CPQ are unchanged.

## 5. Proposals

### CM1 — The Wizard routes each system to a branch

- Each system recorded in the Configuration step resolves to one route: a **named workbench**, **Direct CPQ**, or **CPQ rules** (an active CPQ rule release covers that family).
- A versioned, company-scoped map from equipment `category_id` to route supplies the advice. The 108 categories of [ADR-0054](ADR-0054-es02-equipment-catalogue.md) are the key. Examples: `climate-screens-shade-thermal` to the Screen workbench, `automation-javo-potting-machines` to a future potting workbench, and categories with no workbench to Direct CPQ.
- The route is **advised, then confirmed**. This reuses the principles of the [derived routing direction](estimating-derived-routing.md): show the decisive reason, allow an override with a mandatory reason, and keep the result replayable from its snapshot. The route is a third decision, separate from that direction's effort class and delivery route.
- The Wizard's system rows and its Review step show each system's route and status. A system on a workbench route whose proposal is not yet in CPQ is a Review finding, not a silent gap. A workbench run against an older discovery revision reads as Stale.
- The catalogue has no Fertigation category today. Fertigation needs a category, or a mapping from `water-dosing-racks`, before it can be routed (Q8).

### CM2 — Direct-to-CPQ path

- An estimator can open CPQ from an estimating workspace without first working through the full five-step Wizard. This serves Dean's "go directly to this module" path for simple or repeat quotes.
- CPQ still binds to a Deal, an estimating workspace and an alternative, so the Sales link, quotation lineage and review chain are kept. It does not need a **Complete** full discovery. Instead it uses an **Express** scope: customer, site, a title and the scope wording the quotation prints. This matches the Express effort class already named in the [derived routing direction](estimating-derived-routing.md) (lines 44–48).
- Today a CPQ run requires a selected Complete discovery revision (`src/estimating/cost-basis-service.ts`, `DiscoveryScopeIncomplete`). CM2 changes that precondition for Express workspaces only (Q1).

### CM3 — CPQ is the single priced line table

- Every line in a CPQ configuration has exactly one **origin**:
  - **Rule**: generated by the active CPQ rule release, as today.
  - **Workbench**: received from a named workbench run's parts proposal (CM6).
  - **Manual**: entered by the estimator (CM4).
- Prices, costs, margins and tax are set only in CPQ, from governed cost sources ([CPQ governed costs](cpq-governed-costs.md)) or an explicit manual price with a reason.
- An adjustment to a Rule or Workbench line is an override recorded against that line's generated basis hash. This is the existing CPQ override model: Quantity, SellPrice and Suppress, each with a reason. The generated value is never edited in place, so a later re-run can show what changed.
- The native estimate keeps its existing shape. "Use" remains CPQ's existing atomic adoption: one transaction, an exact preview hash, and unrelated lines preserved.
- Manual costing ([ADR-0027](ADR-0027-estimating-discovery-cost-basis.md)) remains as it is until Q2 is decided. The recommendation is to fold it into CPQ Manual lines, so that there is one place to enter lines.

### CM4 — Manual Product-ID entry in CPQ

- The estimator adds a line by searching Products by code or name and choosing an exact **Variant**. The line binds that Variant's exact revision and content hash, as CPQ's schema-2 bindings already do.
- CPQ prices the line from the Variant's governed cost source at the run's pricing date. If no reviewed cost source exists, the line shows Price unknown. It is never priced at zero, and it blocks Use until the estimator enters a reasoned manual cost.
- A line with no catalogue Product is a **One-off**: a description, unit and manual cost with a reason. This matches ES-07's existing one-off treatment, and it creates no Product master or ERP item.
- The basis for this is the `ADD_MANUAL_LINE` intent of the [CCE specification](../architecture/cce-technical-specification.md) (§4.7), which was proposed but not built.

### CM5 — Shared workbench output contract: the parts proposal

Every workbench, current and future, produces the same server-generated, immutable **parts proposal** from a saved run. The proposal carries no prices.

| Element | Content |
|---|---|
| Envelope | Workbench type ID and contract schema version; engine or calculation edition; run ID and content hash; source binding (estimating workspace, alternative, discovery revision and its hash); created by and at |
| Readiness | `Ready` or `Blocked`, with the blocking findings. Only a Ready proposal can be received |
| Lines | Stable line key (survives re-runs); grouping (area, system or section); **part identity**, either an exact Products binding (Variant, revision, hash) or a workbench part identity with description when unmapped; quantity as an exact decimal with its unit; a derivation reference into the run's calculation trace; optional flags (optional item, alternative group) |
| Findings | Severity, message, the input it concerns, and whether it blocks. These feed the Wizard Review step and ES-04 review |
| Assumptions | The assumptions the run depends on, in words the quotation may quote |
| Documents | Supporting outputs: kind (layout drawing, diagram, schedule, report), title, format, exact bytes hash, page count, status wording (for example "Estimating study · not for fabrication"), and **audience**: Internal or CustomerEligible |

Rules:

- **No money.** A proposal never contains cost, sell, margin, tax or currency. Pricing belongs to CPQ (CM3).
- **Exact and replayable.** A proposal is derived from one saved run. The same run always yields the same proposal bytes.
- **Line keys are stable.** A re-run keeps the key of a line that represents the same part in the same place. This is what lets CM6 carry an override across a re-run.
- **Workbench-internal detail stays internal.** Geometry, hydraulics, I/O and other calculations stay in the workbench. Only the elements above cross the boundary.
- **Size limits are explicit.** A proposal larger than CPQ can receive is refused with an explanation, never truncated (Q6).

### CM6 — Receiving a proposal into CPQ

- "Send to CPQ" replaces ES-08's "Send to estimate" and Fertigation's scoping-note receipt. It opens CPQ's existing receiving preview for the alternative's configuration.
- On first receipt, every line arrives with the origin Workbench and the run's identity.
- On a re-run:
  - unchanged lines from that same workbench are replaced;
  - lines the estimator overrode show the new generated value beside the override, and the estimator chooses Keep override, Use new value or Remove;
  - removed parts are proposed for removal, never dropped silently;
  - Rule and Manual lines, and other workbenches' lines, are untouched.
  This reuses CPQ's existing `CpqOwnedLineChanged` decisions.
- Findings marked as blocking in the proposal block Use in CPQ until they are resolved in the workbench.
- The receipt records the exact proposal hash, so CPQ, the estimate and the quotation can each trace a line back to its workbench run.

### CM7 — Pricing leaves the workbenches

- ES-08's view "04 · Pricing" becomes **Parts**: quantities, units, part identities and mapping state, with no rates. It may show a read-only price preview fetched from CPQ, labelled as such.
- ES-08's synthetic receiving price policy (`SYN-ES08-RECEIVE-01`) and its price bridge with the reconciliation line (DEC-R1 in the [ES-08 design board](es08-design-board.md)) retire. If the recovered rounding policy is still wanted, it becomes a CPQ pricing rule (Q7).
- The Fertigation workbench needs no pricing removed. It gains a parts proposal, which it lacks today.

### CM8 — Unmapped parts

- Each workbench keeps a versioned, reviewed **part mapping** from its own part identities to Products Variants. ES-08's provisional `SS-PART-IDENTITY-r03-PROVISIONAL` identities and Fertigation's candidate families are the first to be mapped.
- An unmapped part arrives in CPQ as an **Unmapped** Workbench line. It blocks Use until the estimator maps it to a Variant or converts it to a One-off with a reasoned manual cost.
- An unmapped part is never dropped, guessed or matched by label.

### CM9 — Supporting documents in the quotation

- When preparing a quotation (ES-05), the preparer sees every CustomerEligible document from the workbench runs that the estimate version traces to, and chooses which to include as appendices.
- The quotation revision binds each chosen document by exact bytes and hash, alongside its existing template and projection. Approval covers the appendices, and issue renders them into the customer document.
- A document from a run that is no longer the one the estimate traces to cannot be chosen.
- A document marked Internal is never offered. Status wording such as "not for fabrication" stays printed on the document (Q5).
- Two prerequisites exist:
  - ES-08's drawing inputs must be saved in the run. Today drawing-only inputs stay in the browser ([ES-08 workbench build](es08-workbench-build.md), lines 41 and 73), so a drawing cannot be reproduced from the run. The [ES-08 geometry study](es08-screen-geometry-study.md) (line 23) already proposes a versioned drawing model saved in the immutable run.
  - The issued quotation, with its appendices, is filed in SharePoint under its document authority.

### CM10 — Adding future workbenches

A new workbench (potting machines, control systems, sensors, automation) is added by:

1. its own ADR for its calculations, inputs and engineering limits, as ADR-0034 and ADR-0038 did;
2. registering a workbench type ID, the equipment categories it serves (CM1), its calculation edition and its part mapping (CM8);
3. producing the CM5 parts proposal and its documents.

It needs no change to the Wizard, CPQ, the estimate or the quotation. A workbench that cannot express its output as a parts proposal is a reason to revise the contract, not to bypass it.

### CM11 — Build order

| Step | Content | Depends on |
|---|---|---|
| B0 | Adopt this record (or the parts Dean chooses); write the parts-proposal contract under `docs/contracts/` | Dean's decision |
| B1 | CPQ line origins (CM3) and Manual Variant and One-off lines (CM4) | B0 |
| B2 | ES-08 emits a parts proposal and Send to CPQ replaces Send to estimate (CM5, CM6, CM7). This is the pilot, consistent with CPQ's Screen systems pilot (D15 in the [CPQ design](cpq-figma-design.md)) | B1; ES-08 part mapping (CM8) |
| B3 | Wizard routing map and per-system route status (CM1); Direct CPQ for Express workspaces (CM2) | B1 |
| B4 | Fertigation emits a parts proposal (CM5), replacing scoping-note receipt | B2; Priva component Variants in Products (Q8) |
| B5 | Supporting documents as quotation appendices (CM9) | B2; ES-08 drawing inputs saved in the run |
| B6 | Retire manual costing into CPQ Manual lines, if Q2 is answered yes | B1 |

Each step is a separate, reviewable change. Steps with migrations follow the repository's migration rules in [AGENTS.md](../../AGENTS.md). Steps that touch calculations should also receive the independent second-model review proposed in open PR #543, if that rule is adopted.

## 6. Existing decisions this would change

"Supersede" means the statement would be replaced. "Amend" means it would be kept with a stated change. Line numbers refer to the files at `main` 271a386. Nothing changes until Dean adopts the matching proposal and the record is updated in its own change.

| Record | ID | Current statement | Effect | Proposal |
|---|---|---|---|---|
| [ADR-0054 equipment catalogue](ADR-0054-es02-equipment-catalogue.md) | PPO-ADR-0054 | Line 19: "No category-to-specialist routing is inferred." | Supersede | CM1: a versioned map advises the route, and the estimator confirms it. A category is still not a suitability or price rule |
| [ADR-0035 structured discovery](ADR-0035-es02-structured-discovery.md) | PPO-ADR-0035 | Lines 65–66: routing absences "do not become blockers"; lines 142–143: outgoing is the discovery revision and a manual estimate basis | Amend | CM1: an unrouted system or missing proposal is a Review finding; outgoing adds the confirmed route per system |
| [ES-02 Figma implementation](es02-wizard-figma-implementation.md) | — | Line 19: CPQ and Fertigation links are reused (static menu items; ES-08 has no link from the Wizard) | Amend | CM1: per-system route and status replace static links |
| [CPQ runtime](cpq-native-runtime.md) | PPO-CPQ-RUNTIME-DEC | Line 17: runs freeze the discovery revision; only "CPQ-owned lines" are replaced, and unrelated cost lines are preserved | Amend | CM2, CM3: Express runs; three origins, each with its own replacement rule |
| [CPQ API](../interfaces/cpq-api.md) | PPO-CPQ-API | Lines 18–19, 37 and 145: a selected Complete discovery revision is required. Line 51: input is facts and overrides only. Line 104: "No… Product price lookup" | Amend | CM2, CM4: Express precondition; Manual Variant and One-off lines with a cost-source lookup |
| [CPQ published Products](cpq-published-products.md) | PPO-CPQ-PRODUCTS-DEC | Line 11: Product bindings are authored in the rule release | Amend | CM4, CM8: the same exact binding is also made at run time by the estimator or a part mapping |
| [CPQ governed costs](cpq-governed-costs.md) | PPO-CPQ-COSTS-DEC | Lines 11–13: cost sources bind to release parts | Amend | CM4: cost-source lookup by Variant for Manual and Workbench lines |
| [CPQ Figma design](cpq-figma-design.md) | PPO-CPQ-FIGMA-DESIGN-DEC | Line 81 and D15 (line 122): ES-08 "supplies span and area facts" to CPQ | Supersede | CM5, CM6: ES-08 supplies a parts proposal, not facts |
| [ADR-0034 ES-08 specialist workbench](ADR-0034-es08-specialist-workbench.md) | PPO-ADR-0034 | Lines 93–94: specialist adoption writes straight into the native estimate. Lines 85–87 and 149: `SYN-ES08-RECEIVE-01` pins synthetic AUD pricing | Supersede | CM6, CM7: Send to CPQ; pricing leaves ES-08. Lineage (lines 96–101) is kept and re-homed in CPQ |
| [ES-08 workbench build](es08-workbench-build.md) | — | Line 23: "04 · Pricing… native AUD receiving proposal". Line 51 (A2): "Send to estimate stays the working synthetic receiving flow". Lines 41 and 73: drawing-only inputs are not written to the run | Supersede (Pricing, A2); Amend (drawing inputs) | CM7: Parts view; CM6: Send to CPQ; CM9: save drawing inputs |
| [ES-08 design board](es08-design-board.md) | PPO-ES08-DESIGN-BOARD-DEC | Line 49: the drawing set's "Next owner: the receiving estimate". Line 78 (DEC-R1): ES-08's price bridge and reconciliation line | Amend (line 49); Supersede (DEC-R1) | CM9: next owner is CPQ and the quotation; CM7 and Q7 for DEC-R1 |
| [ES-08 geometry study](es08-screen-geometry-study.md) | PPO-ES08-GEOMETRY-ADR | Line 23: save a versioned canonical drawing model in the immutable run (proposed, not built) | Preserve, and make a prerequisite | CM9 depends on drawings being reproducible from the run; CAD authority is unchanged |
| [ADR-0038 Priva fertigation](ADR-0038-priva-fertigation-native.md) | PPO-ADR-0038 | Lines 74–76: receipt as manual scoping notes; "no automatic SKU or estimate line is introduced". Lines 62–63: "no automatic price" | Supersede (lines 74–76); Amend (lines 62–63) | CM5, CM6: Fertigation emits a parts proposal into CPQ; prices still come only from CPQ |
| [Priva fertigation scoping design](priva-fertigation-scoping-design.md) | — | Lines 19–20: the outgoing handover is a technical scope, with no commercial quote | Amend | CM5: the outgoing handover adds a parts proposal |
| [ADR-0027 discovery cost basis](ADR-0027-estimating-discovery-cost-basis.md) | PPO-ADR-0027 | Line 14: "no pricing formula, automatic line generation". Line 26: costing fields are entered manually | Amend now; Supersede if Q2 is yes | CM3, B6: lines come from CPQ; manual entry moves to CPQ Manual lines |
| [ADR-0017 E1](ADR-0017-estimating-e1.md) and [E1 contract](../contracts/estimating-e1.md) | ADR-0017, PPO-010-E1-API | ADR-0017 line 11 and contract line 21: the safe output lists title, recipient, scope and sell extensions only. Contract line 19: a line has no Product or Variant field | Amend | CM9: appendices join the whitelist; CM4: a line can carry its exact Variant binding |
| [Quotation release](quotation-release-native.md) and [contract](../contracts/quotation-release.md) | — | Contract line 20: the bound source lists the estimate, choices, reviews, versions, policy, terms and template, with no attachments | Amend | CM9: the bound source adds chosen appendices by exact hash |
| [Derived routing direction](estimating-derived-routing.md) | PPO-010-ROUTE-DEC | Lines 44–48: two decisions, effort class and delivery route | Amend | CM1, CM2: adds the per-system estimating route as a third, separate decision, and uses Express for Direct CPQ |

## 7. Preserved

The model keeps these unchanged:

- CPQ's atomic adoption into the native estimate, its exact preview hash and the 100-line receiving limit, which refuses rather than truncates.
- Immutable discovery revisions, workbench runs and estimate versions, and ES-08 lineage manifests with their generated baselines (ADR-0034, lines 96–101).
- The rule that a re-run never silently overwrites a manual decision (the [Screen systems design](specialist-screen-systems-design.md), line 30).
- The ES-04 review, ES-05 approval and issue, ES-06 response and ES-07 conversion.
- The customer projection's exclusion of costs, discounts, overrides and internal free text.
- ES-08 study status on drawings ("Estimating study · not for fabrication") and the authority of CAD for authored files and SharePoint for business documents.
- The [CCE specification](../architecture/cce-technical-specification.md)'s direction that CPQ opens from an existing saved scope or estimate, rather than starting a second enquiry wizard (§3.6).
- All parent requirement IDs, scope IDs and issued reference bytes.

## 8. Open questions for Dean

| ID | Question | Recommendation |
|---|---|---|
| Q1 | Can CPQ be used without a Complete discovery? | Yes, for an Express workspace (CM2) that still links to the Deal and alternative. Full workspaces keep the Complete precondition |
| Q2 | Should manual costing fold into CPQ? | Yes, as B6, after CPQ Manual lines exist. Until then both remain, and a line belongs to only one of them |
| Q3 | Can an estimator edit a workbench line in CPQ, or must they change the workbench inputs? | Both. CPQ edits are reasoned overrides that surface for a decision on the next re-run. Changes to scope belong in the workbench |
| Q4 | One CPQ configuration per alternative, or one per workbench? | One per alternative, collecting every route, so the alternative has one priced total and one Use |
| Q5 | Which workbench documents may reach a customer, and who approves them? | Only documents the workbench marks CustomerEligible, chosen by the preparer and covered by the existing ES-05 independent approval. Study status stays printed on them |
| Q6 | Is 100 lines enough for large screen or fertigation jobs? | Keep the limit for the pilot and measure synthetic jobs. Raise it by a separate decision if real proposals exceed it; never truncate |
| Q7 | What happens to ES-08's recovered rounding policy (DEC-R1)? | Retire the price bridge. Recreate the rounding as a CPQ pricing rule only if Dean confirms it is a real commercial rule |
| Q8 | How does Fertigation get routed and mapped? | Add a Fertigation category (or map `water-dosing-racks`), and catalogue the Priva component Variants in Products before B4 |
| Q9 | Is the route mandatory? | Advisory with confirmation. An estimator can choose Direct CPQ for a workbench category with a reason, so a quote is never blocked by a missing workbench |

## 9. What this record does not do

It adopts nothing and changes no existing decision text. It adds no code, migration, seed, permission, capability, interface or design. It does not decide who sends the quotation to the customer, or how the quotation returns to the Sales representative; that gap was identified in the same conversation and needs its own record. It does not approve any synthetic rule, mapping, price or drawing for operational use.
