---
document_id: PPO-010-E2-DES
revision: r02
date: 2026-09-14
owner: Dean Fiedler - prototype owner
status: Adopted options and questions reconciled; no E2 runtime implementation
---

# E2 — from enquiry to a selected estimating basis

This is the concrete design supporting [E2-D01–03](../decisions/estimating-e2-rules.md). The [audit package](../decisions/audit-follow-through-policy-package.md) adopts the options/questions subset and category/equipment extensions. This r02 reconciles its timing with [advisory routing](../decisions/estimating-derived-routing.md). Section 2 and the unchanged walkthrough/route fixtures are explicitly historical declared-model examples; they are not executable adopted delivery policy. The [walkthrough](estimating-e2-walkthrough.html) is an in-memory illustration; reload resets it. [Contracts](../contracts/estimating-e2-design.md) and [acceptance cases](../testing/estimating-e2-acceptance.md) define future implementation obligations.

## 1. End-to-end journey

1. Open an existing permitted Opportunity. Reuse its company, organisation and existing site/contact context. Review current eligibility; do not create a second customer or change the sales stage.
2. Record the estimating owner’s Full/Express effort declaration, or an owned unresolved item. Create the first option and select it atomically with valid, possibly Incomplete discovery. Delivery-route confirmation is not an entry requirement. Until an advisory rule set is adopted, show routing Not configured with its missing policy, without claiming a derived result.
3. Select existing Site/Facilities, declare supported work systems and record included work, exclusions and assumptions. Answer only applicable questions. Partial discovery can be saved as Incomplete with owned unresolved items.
4. Compare an alternative where useful. Deliberately inherited source answers start unconfirmed. A changed effort declaration or future advisory route alone does not require a new option; distinct commercial alternatives remain explicit choices. Show each option separately, with one explicit Selected basis label.
5. Review the exact scope/answer snapshot, unresolved count and definition. Confirm the applicable required answers. A ready snapshot may become the source of a new manual estimate version through a deliberate command. It generates no quantities, cost lines or price changes.
6. Work on manual costing and an exact draft quotation through the retained E1 contracts. A later Quotation Builder may explicitly import approved customer-safe facts from this saved basis. Changing the selected option never refreshes a saved estimate or draft quotation.

Full means more discovery before costing; Express is a shorter discovery entry. Neither is a pricing tier, risk certification, approval, ERP transaction or customer commitment.

## 2. Historical declared routing model — SYN-E2-ROUTE-r01

The following unchanged model was never adopted. Its route-before-option, immutable-route and new-option-on-route-change statements describe r01 history only. Current normative behaviour is in sections 1, 3–4 and the r02 receiving contract. It may inform a later calibration study after rule decisions; it must not gate option creation, scope saves or manual E1 costing.

Inputs `engineering_required`, `project_management_required`, `scope_settled`, `enquiry_kind`, `supply_defined` and `prepayment_required` are separate facts. Boolean choices are Yes/No/Unknown. Kind is DefinedSupply/ServiceRepair/Unknown. Missing is evaluated as Unknown but retains its original NotAnswered state. A malformed or unsupported value is Invalid, never coerced. Every known answer records actor/time/source note; unknowns have an owner and reason before saving discovery.

Validate the complete submitted shape first. Then evaluate these ordered branches, stopping at the first matching outcome. Unused answers stay in captured evidence but cannot decide the route. A required earlier Unknown stops evaluation even if a later answer would suggest Full; users see the exact blocking question rather than a guessed decisive reason.

| Priority | Predicate after earlier rules did not decide | Outcome / decisive rule |
|---|---|---|
| R01 | Engineering required = Yes | Full / Project |
| R02 | Engineering required = Unknown | Needs clarification; engineering |
| R03 | Project management required = Yes | Full / Project |
| R04 | Project management required = Unknown | Needs clarification; project management |
| R05 | Scope settled = No | Full / Project |
| R06 | Scope settled = Unknown | Needs clarification; scope |
| R07 | Enquiry kind = Unknown | Needs clarification; enquiry kind |
| R08 | Kind = DefinedSupply and supply/any labour fixed = Yes | Express / SalesOrderCandidate |
| R09 | Kind = DefinedSupply and supply/any labour fixed = No | Full / Project; further scope work required |
| R10 | Kind = DefinedSupply and supply/any labour fixed = Unknown | Needs clarification; supply definition |
| R11 | Kind = ServiceRepair and prepayment required = Yes | Express / SalesOrderCandidate |
| R12 | Kind = ServiceRepair and prepayment required = No | Express / ServiceOrderCandidate |
| R13 | Kind = ServiceRepair and prepayment required = Unknown | Needs clarification; prepayment |

The three Candidate category labels are internal routing evidence, never real orders. R02/R04 and R09/R10 make previously underspecified cases explicit. R13 deliberately differs from the documented unknown-prepayment Service Order fallback. There is **no amount threshold and no manual route override** in this candidate. Only the current permitted estimating owner can confirm routing inputs or a new option. A correction requires an attributed reason; changing a confirmed option's route means creating a new option, not overwriting the route. A request for exceptional authority remains outside E2.

Contract review is captured separately as Required/NotRequired/Unknown and never changes these predicates. Unknown review need can remain an owned discovery item; it does not grant commercial approval. Prepayment need is neither quoted payment terms nor evidence of receipt. Once route-confirmed, an option's definition/version, full input snapshot and decisive rule are immutable. Successor estimation revisions inherit them byte-for-byte. If new facts disagree with that route, show the difference and require a new option; same-route evidence corrections remain attributed supplemental history and do not replace the original routing snapshot.

## 3. Options, revisions and locks — SYN-E2-OPTIONS-r01

The bounded workspace has one mutually exclusive option group per Opportunity, at most 10 options including archived ones, and one `selected_option_id` once its first option exists. No sum of alternatives is a workspace amount. The selection identifies the next estimating basis; CRM forecast selection, default navigation, Won/Lost and customer acceptance are separate. E2 offers no additive-option total or default-option command.

| Identity | Meaning | Change policy |
|---|---|---|
| Option A / B | A distinct commercial approach; no fixed delivery route | Stable UUID; state Active or Archived; append-only state events. Selection is an independent workspace pointer. |
| Estimation r01 / r02 | A scope and question basis within that option | Immutable snapshot and exact predecessor; successor reason mandatory. One current revision per option. |
| Scope / answer snapshot | Exact membership, definition and answers captured by a revision | Immutable UUID/hash; readiness Complete or Incomplete derived from captured rules. |
| Estimate / version v01 / v02 | Manual costing identity and saved cost/scope versions | Preserve E1 immutability, arithmetic and receipts. New version deliberately chooses a basis; old scope is never relabelled. |
| Draft Quote / revision r01 / r02 | Customer-safe presentation of an exact estimate version | Immutable input/HTML/PDF and source link. Render status does not change commercial Draft state. |

| Workspace condition | New alternative / change selection | New estimation revision / archive or reopen | E1 costing and draft quote action |
|---|---|---|---|
| Valid attributed discovery; all commercial content Draft | Allow with expected workspace version and reason; new alternative stays unselected until explicit selection | Allow current owner; archive only an unselected option; reopening stays unselected | Allow on Active options under current E1 guards. Nonselected option clearly labelled Alternative. |
| Incomplete questionnaire on an Active option | Allow comparison/selection; selection does not imply readiness | Allow saving an Incomplete successor; readiness blocks using it as a new costing basis | Existing E1 originals remain readable and can retain their old basis. Do not bind a new estimate version to an incomplete E2 snapshot. |
| Existing Draft quotation Preparing/Ready/RecoveryRequired | Allow; the exact original job/revision remains bound to its source | Allow under Draft rules; rendered output remains retrievable when authorised | Recover the original render operation; never replace it with output from a different option. |
| Save/selection outcome unknown to the client | Freeze that client's mutations and reconcile the original operation first | Same; do not manufacture a fresh operation ID | Same E1 uncertainty rule; other authorised clients still face server versions and atomic guards. |
| Stale expected version | Reject command without effect; show current selection and retained proposal | Explicit compare/cancel before a new intent | Retain E1 conflict behaviour. |
| Archived option | Cannot select until explicit reopen; branching from it requires reopen first | Read history; Reopen Active with reason if workspace otherwise editable. Cannot archive the sole selected option. | Read/recover exact originals; no new costing or quotation revision while archived. |
| Any Submitted/Approved/PendingResponse/Accepted/ConversionPending/OutcomeUnknown commercial state anywhere in the group | Hold group changes | Hold group changes | Hold new commercial content; allow authorised read and original recovery only. These future states are not implemented by E2. |
| Returned/Withdrawn/Declined or other terminal commitment from a later increment | Hold until that increment defines release/reopen authority | No generic E2 reopen can unlock it | Do not infer that a declined or expired quote releases the group. |
| Unknown state, failed lock read or inaccessible related record | Hold; report unavailable/denied without revealing private lock details | Hold; no success based on absent records | No new mutation; current authorised exact reads/recovery only when their own access checks succeed. |

An E1 Draft quote therefore does **not** impose the guide's broad draft-quote branch lock. This adopted subset keeps comparison useful before commitments. The whole group is checked inside the same transaction as selection/branching; supported-state whitelists fail closed when a later module introduces a new state. Two users selecting different options from workspace version 7 cannot both succeed: one advances to 8; the other compares the saved winner. Creating B does not select B. Archive/select replacement are separate explicit actions; the selected option cannot be archived between them.

A branch copies scope membership and compatible answer values only after a comparison. Copied Confirmed answers become Answered/Needs confirmation with `copied_from` provenance. Deferred/unknown items remain unresolved with eligible owners rechecked. A deliberately different commercial approach reuses permitted context only; scoped answers may be proposed through the same comparison. Future advisory changes retain immutable observations and do not themselves force branching. No estimate prices, review, quotation output or response is copied automatically. A new estimation revision preserves confirmed values only when definition and scoped membership are unchanged; affected answers need reconfirmation.

## 4. Scope and questionnaire — SYN-E2-QUESTIONS-r01

Use existing Organisation → Site → Facility relationships. Up to 10 existing Facilities, from one current permitted Site, can be selected. A parent selection never implies child membership. Facility name and version are captured for display, with the original UUID. No matching by name, hierarchy roll-up or editing shared Facility attributes here. An explicitly off-site supply scope can choose No site required with a reason; any on-site work requires an existing Site before the basis is Complete. Full/Express is estimating effort, not delivery-route or site authority. Unknown site is savable as Incomplete. Facility membership is optional and explicit; a Site-wide scope is distinguishable from a named Facility scope.

DR-02 adds zero or more existing permitted equipment IDs to the exact scope revision, bounded to 100 IDs and the 64 KiB command. Each must belong to its selected Site. Capture ID/version/display context; recheck current visibility on reads, commands, comparison and history. Empty membership does not assert that equipment is unnecessary. No copied name becomes an asset identity or a derived Service route.

Three local system tags describe the **proposed work**, not a new equipment master: `ProductSupply`, `DefinedLabour`, `Freight`. At least one must be selected. Each applies either to the site-wide/no-site scope or an explicit subset of the selected Facilities; never to an unselected or inaccessible Facility. One tag can have several facility members but appears once. The first questionnaire uses global questions plus one question group per tag; multi-system engineering configuration is deferred. Unsupported systems are recorded as an owned scope gap and keep the basis Incomplete, without forcing them into a false tag.

| Stable question ID | Label / answer type | Visibility and readiness requirement |
|---|---|---|
| Q01 | Included work; text 1–2,000 characters | Always; required Confirmed |
| Q02 | Exclusions; text 1–2,000 characters, or explicit NoneDeclared choice | Always; required Confirmed; blank differs from no declared exclusions |
| Q03 | Assumptions; text 1–2,000 characters, or explicit NoneDeclared choice | Always; required Confirmed |
| Q04 | Contract review need; Required/NotRequired/Unknown | Always; recorded; Unknown retains owned follow-up and never decides routing or approval |
| Q05 | Product description; text 1–500 characters | ProductSupply selected; required Confirmed |
| Q06 | Product count; positive whole number 1–100,000, unit Each | ProductSupply selected; required Confirmed; discovery count only, never auto-generated estimate quantity |
| Q07 | Is work on site? Yes/No/Unknown | DefinedLabour selected; required Confirmed Yes or No; Unknown is unresolved |
| Q08 | On-site work description; text 1–1,000 characters | Q07 = Yes; required Confirmed and existing Site required. Does not replace Site access/safety controls. |
| Q09 | Freight responsibility; PPO/Customer/Unknown | Freight selected; required Confirmed PPO or Customer; not a delivery booking or approved commercial term |
| Q10 | Delivery description; text 1–500 characters | Freight selected and Q09 = PPO; required Confirmed; text is proposed delivery scope, not a new Site/address record |

Definition uses stable choice IDs `Yes`, `No`, `Unknown`, `NoneDeclared`, `Required`, `NotRequired`, `PPO`, `Customer`. Text is plain text, never HTML. Empty, Deferred, Answered, Confirmed and Assumed are distinct recorded states. An unknown enum cannot be Confirmed to satisfy a required known value. Deferred and Assumed require a reason and an eligible follow-up owner; neither satisfies mandatory confirmation. Confirmed records actor/time and source note. E2 allows no mandatory-question override. Scope text and line source notes retain separate audiences.

An Incomplete snapshot can be saved after structural validation and attribution of each unresolved mandatory input; invalid types/ranges, cross-site links or unsupported supplied fields reject the whole command. Complete means ready for the **manual estimating basis only**, not technically safe, commercially approved or ready to issue. Q04 Unknown does not alone prevent this narrow readiness but stays visible as an open review item. Unanswered optional questions do not silently become negative answers.

### Definition and scope changes

Published definitions are immutable IDs + revisions + hashes. There is no arbitrary rules engine: visibility uses only selected system, explicit scope membership and the named equality conditions above. The synthetic r02 compatibility example changes Q06 from integer Each to decimal metres, removes Q08, and adds required Q11 Packaging (Box/Crate). This is a **comparison fixture**, not a second policy proposed for immediate use.

| Change | Comparison and successor result |
|---|---|
| Label-only edit with identical ID/type/unit/choices/condition | Show text change; preserve compatible value and original attribution after deliberate resnapshot |
| New required Q11 | Unanswered in the proposed successor; owns a follow-up and blocks Complete until confirmed |
| Q06 Each → metres, or integer → decimal | Retain old value in history as Incompatible; never convert 2 Each to 2 metres. Enter and confirm a new answer with its new unit. |
| Remove Q08 or hide it by Q07 = No | Retain prior answer in history, exclude from active readiness and outgoing projection; display removal explicitly |
| Remove ProductSupply or a member Facility | List affected answers and downstream estimate/quote sources; reconfirm remaining system-group answers whose membership changed. Do not rewrite downstream originals. |
| Restore a tag/Facility or make Q08 visible again | Start affected active answers unanswered; history offers deliberate reuse as Answered, not automatic confirmation |
| Effort or route-relevant facts change | Compare the exact prior and proposed facts. A successor retains the old snapshot; neither change forces a new option. No classification is computed until an adopted rule set exists; later advisory observations never bind receiving authority. |

The comparison may be cancelled with no write. Saving an unresolved comparison creates an explicitly Incomplete successor only after the actor acknowledges removed/incompatible values and owns the outstanding items; otherwise reject. The old revision remains intact and remains the source of its existing estimates. A subsequent completed snapshot needs a new predecessor and reason. Nothing is repriced or reissued.

## 5. Historical screen walkthrough and current runtime obligations

The unchanged r01 walkthrough demonstrates the historical declared model. Its Route screen is not a runtime acceptance oracle for r02. The implementation must replace route confirmation before entry with effort evidence and separately labelled routing availability; selected-option and scoped-question interactions retain the requirements below.

The walkthrough uses the intact repository PPA logo, navy `#242a37`, green `#62bb46`, Roboto/Verdana and 44px labelled controls. It follows the current compact shared shell; unrelated unmerged CRM layout changes are reference work, not copied runtime dependencies. At 390px and 320px metadata and option cards reflow naturally; no scaled desktop view or horizontal page scrolling.

| Screen | What the estimator sees and does |
|---|---|
| Route | Existing opportunity context; six explicit input choices; proposed outcome and decisive reason; compare Complete, Incomplete and Full examples |
| Options | A selected basis and B alternative, route, readiness and exact revision for each; propose B, compare original/proposed, apply to preview or cancel |
| Scope | Exact Site/Facility membership and three work-system tags; conditional questions; open items; old saved example versus changed proposal |
| Compare | Exact old/proposed definitions, values, units and affected content; cancel, or retain an incomplete proposal; no misleading successful-save label |
| Review | Selected option, routing evidence, readiness, immutable source references and future manual-estimate/Quotation Builder handoff |

Required runtime states: Loading (no zero/empty claim), Empty (no option yet), Dirty (proposed basis), Saving (request active), Saved (server receipt/version), Conflict (compare current), Outcome unknown (reconcile original), Unavailable (preserve source reference), and Denied (clear business data and return to permitted work). The preview labels all such states as **illustrations** and does not claim a server save. Keyboard navigation uses ordinary labelled controls and visible focus; status uses a polite live region. No Send/Issue/Accept or offline-save action is shown.
