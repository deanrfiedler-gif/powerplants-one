# CREMS constraint uplift backlog

<!-- versioning: git; committed history is authoritative -->

Owner: Dean Fiedler. Recorded: 8 October 2026. Status: backlog register only. It authorises no implementation, and no item is adopted until it is separately scoped and decided. Review: not reviewed.

## Purpose

On 8 October 2026 Dean adopted the [independent product direction](../decisions/product-direction-quality.md): CREMS is historical background, and CREMS parity, hidden-formula reconstruction and CREMS screen or workflow patterns are no longer prerequisites. On the same day Dean asked for a record of everything in Powerplants One that was held back, deferred or shaped by CREMS information, so it can be raised to a more professional, PPO-native standard later.

This register is that record. The decision has so far been applied as banners on the top-level documents (BP-01, BP-04, `estimating-evidence.md`, the estimating programme handover, `backlog.md`, AGENTS.md and the ChatGPT instructions). The detailed rows, gates, acceptance cases and runtime screens underneath them are mostly unchanged.

## Boundaries

- Historical CREMS sources in `docs/reference/` stay byte-for-byte unchanged. Parent requirement IDs, CRE IDs and issue numbers stay as identifiers; any rewording adds a current interpretation and does not delete history.
- Removing the CREMS prerequisite does not supply real commercial values, technical claims or operational approval. Thresholds, rates and prices still need their own evidence and owner decision. Until then, a PPO rule may run with a clearly labelled synthetic value set.
- Independently adopted PPO decisions stay in force until explicitly superseded (decision line 9). These include ADR-0034, E2-D02/D03 and DR-01/DR-02.
- Each new rule must state its purpose, inputs, units, rounding, assumptions, boundaries and owner, and come with independent test cases. This is the requirement in the 8 October decision.
- Operational migration and CREMS retirement evidence (BP-01 cutover rows) remain valid and are not part of this backlog.

## Method and limits

The register was compiled from a repository search on 8 October 2026 at main `dcec2cf`. Sample citations were rechecked by hand. Line numbers are as found at that commit. No `src/` or `tests/` file contains the word "CREMS"; in code, the influence shows as copied vocabulary, "Not configured" placeholders and the recovered Screen Systems workbook port. Where a CREMS link is an inference, the row says so.

Suggested priority: **P1** blocks or degrades a user-visible journey now; **P2** is a rule or model the product needs before estimating can be called complete; **P3** is wording, traceability or test re-authoring.

## Register

### A. Governance, registers and status wording

| ID | Item | Where (at `dcec2cf`) | How CREMS holds it back | PPO-native treatment | Priority |
|---|---|---|---|---|---|
| CU-01 | PPO-010 and issue #10 still framed as CREMS reconstruction | `initial-backlog.json:314,325`; `backlog.md:46`; issue #10 title and body | "Prepare CREMS rule evidence and BP-04 reconstruction scope"; acceptance asks to validate CRE-01–CRE-26 against CREMS sources | Restate the #10 acceptance criteria as "define, own and test PPO estimating rules" (rule registry, owners, fixtures), or close it with a cross-reference to a new PPO-native rules issue | P3 |
| CU-02 | Decisions D-009 and D-010, BP-01 gates and risk R-04 assume CREMS evidence | `decision-register.csv:10-11`; BP-01 lines 1587, 1623, 1663, 1949–1950, 1991 | D-009 closes on "versioned source configuration and accepted examples"; R-04 mitigates with "obtain source rules" | Re-scope D-009 as adoption of a PPO estimating rule registry; keep D-010 for real commercial authority and thresholds only | P2 |
| CU-03 | BP-01 §10.4 CRE-01–CRE-26 register, and the design check that enforces it | BP-01:712–743; `estimating-evidence.md:41-69`; `docs/testing/estimating-design-check.py:68,76` | "Every disposition … pending D-009/D-010"; most rows say "Preserve"; the check requires exactly CRE-01..26 | Convert it to a PPO estimating capability and decision register, keep CRE IDs as a historical cross-reference column, and stop the check requiring CREMS coverage | P3 |
| CU-04 | Parent requirements EST-01 and EST-06 worded around CREMS | `requirements.csv:10,15`; BP-01:684, 689 | "Validate existing CREMS routes"; "obtain formulas … before replacement" | Keep the IDs; add a current acceptance-intent note that refers to PPO-adopted rules | P3 |
| CU-05 | Acceptance scenarios gated on CREMS formulas | `acceptance-scenarios.csv` AT-04, AT-26, AT-27, AT-28, AT-36; `estimating-acceptance.md` EA-02, EA-05, EA-07, EA-08, EA-16, EA-17 | "Exercise CREMS routing"; "Missing formula blocks supported-engine claim"; all still Planned or Not run | Re-author as PPO-rule acceptance cases with PPO-owned, owner-approved fixtures | P2 |
| CU-06 | Prototype documents still say "no estimating engine" | `prototype/scope-and-journey.md:23`; `prototype/decisions-and-evidence.md:25`; `prototype-implementation-plan.md:91` | "No invented estimating engine"; "CREMS reconstruction deferred" | Add a current-direction note pointing to PPO-defined, tested rules | P3 |
| CU-07 | BP-04 body, the evidence gap register and the implementation plan gate work on CREMS | BP-04:131, 147, 204, 209; `estimating-evidence.md:78-93`; `estimating-implementation-plan.md:25,27` | "E5 after formula evidence"; G05 "blocks parity and operational calculation" | Split gaps G01–G14 into PPO rule-definition decisions and operational-evidence items (G07–G11 stay as evidence) | P2 |
| CU-08 | BP-01 wave and gate wording | BP-01:262, 289, 378, 698, 747 | "Before implementation, obtain the current CREMS … exports" | Annotate inline, separating PPO rule definition from cutover evidence | P3 |
| CU-09 | CRM PAR-08 (pursuit alternatives) tied to CREMS-dependent decisions | `crm-parity.md:116-119` | "E2 maintained CREMS alternatives/source design" | Re-point to the PPO alternative and forecast-basis rule | P3 |

### B. Routing, intake and discovery

| ID | Item | Where | How CREMS holds it back | PPO-native treatment | Priority |
|---|---|---|---|---|---|
| CU-10 | Delivery routing shows "Not configured" on every estimating screen | `estimation-wizard.tsx:213,1398`; `discovery-screens.tsx:682,868`; `configuration-editor.tsx:1276`; `estimating-derived-routing.md:28,36,151-154`; BP-01:747 | Derivation is calibrated against the CREMS declared model; DR-03 to DR-06 remain open | Adopt a synthetic PPO advisory routing rule set (presence-based signals plus an ambiguous band, DR-03/DR-04) with independent reference cases; keep binding at acceptance, as already adopted | P1 |
| CU-11 | "Full / Express / Unknown" effort vocabulary copied from CREMS | `src/estimating/discovery.ts:46,204-206`; `discovery-fields.tsx:500-505`; CRE-02 | "Full Project starts Scoping; Express begins Estimating" | Replace with a plain-language PPO effort classification tied to PPO signals and a stated purpose, for example Quick quote, Scoped estimate, Needs clarification | P1 |
| CU-12 | Discovery question set limited to a fictional ten-question subset | `discovery-definition.ts:1-6,34-35`; `estimating-e2-rules.md:34`; CRE-05; G04 | "No invented question catalogue"; G04 "blocks questionnaire replacement" | An owner-approved, versioned PPO question library by work type (supply, service, upgrade, project) with answered and blank exports | P1 |

### C. Options, pricing and quote calculations

| ID | Item | Where | How CREMS holds it back | PPO-native treatment | Priority |
|---|---|---|---|---|---|
| CU-13 | Option layering, default option "A" and the post-Draft lock matrix | ADR-0017:9; `discovery-workspaces.ts:439`; CRE-03/04; G03 | "Simpler than implementing the general CREMS branching engine before its lock policy is resolved" | Named PPO alternatives and a PPO-defined lock policy for submitted, issued and converted states. Draft-only exploration (E2-D02) and ES-02 alternatives already exist | P2 |
| CU-14 | FX, unit conversion and landed-cost allocation "Not configured" | `cost-sources.tsx:140-143`; `cost-sources-guide.ts:85`; BP-04:131; G05; `estimating-e3-decision-pack.md:19-29` | "D-009 must confirm operational formulas" | Adopt the PPO conventions prepared in the E3 pack (rate direction and date, rounding stage, conserving allocation with residual cent) with independent tests | P1 |
| CU-15 | Pricing outcomes (block, escalate, advise) and policy versioning "Not configured" | `estimate-review.tsx:180-181`; CRE-09/10; EA-08 | "Configure no numbers until supplied" | A versioned PPO three-outcome pricing-policy engine running on a labelled synthetic threshold set, ready to take real values. Real thresholds still need commercial evidence | P1 |
| CU-16 | Container propositions EC-D01 to EC-D05 never decided | `estimating-container-propositions.md:16`; `audit-follow-through-policy-package.md:22` | "Nothing here is adopted … CREMS source gaps remain open" | Adopt EC-D01 (versioned rule registry with provenance) and EC-D04 (pending, never zero) as PPO architecture; decide EC-D02/D03/D05 on their merits | P2 |
| CU-17 | Quote presentation model (inference: not yet built) | BP-01:736-737 (CRE-19/20); `estimating-screen-specification.md:26,42`; EA-10 | Section flags and group-discount behaviour defined only as CREMS preservation | Define a PPO quote presentation model (sections, visibility, discounts, annexes) from PPO output needs | P2 |

### D. Specialist Screen Systems (ES-08)

The link from this workbook to CREMS is an inference: the documents trace it to CRE-13–CRE-17 and G06 but describe it as a "normalized historical screen estimator workbook".

| ID | Item | Where | How CREMS holds it back | PPO-native treatment | Priority |
|---|---|---|---|---|---|
| CU-18 | Runtime engine is a port of a recovered workbook, including its known defects | `specialist/source-manifest.json:4-5` (`SS-RECOVERED-QTY-r02`), REV-01–REV-23; `engine.ts:520-527`; `specialist-workbench.tsx:640,988,1481`; ADR-0034; test ES08-T22 | "Legacy area per motor … omits slots 3–5 and offcuts" reproduces REV-09; the UI shows workbook cell references (G89, G99) | A PPO-owned Screen Systems rule set: named rules with purpose, units, rounding and owner; settle each REV finding by decision; replace cell references with rule IDs; keep the legacy-parity test as differential evidence only | P2 |
| CU-19 | Other Screen Systems families and any supported-engine claim blocked on G06 | `specialist-screen-systems-design.md:18-20`; EA-16; REV-05, REV-11 | "Other families remain unavailable pending separate definitions" | PPO family definitions and acceptance cases for the families the business actually sells | P2 |
| CU-20 | Screen geometry kept subordinate to the recovered quantities | `es08-screen-geometry-study.md:12,20-21`; `es08-geometry-build-plan.md:5,24`; STATUS "accepted Screen geometry" | "Richer drawings do not supersede the recovered quantity definition"; mapping defaults to None | Make a PPO geometry-to-quantity model primary, reconciled against the recovered engine as evidence. The build plan also still awaits a separate instruction | P2 |
| CU-21 | "Recipe Refetch Latest Version" carried over as a requirement | BP-04:149; CRE-17; AT-28; EA-17 | A CREMS concept retained in requirement text; ES-08 already implements rerun and compare natively | Drop the requirement unless PPO publishes recipes; keep PPO's rerun and compare model | P3 |

## Related GitHub issues

- #10 (open): the primary CREMS-framed issue (CU-01).
- #76 (open): BP-04 E2 routing, alternatives and scoped questions; its body depends on #10 and D-009/D-010 (CU-10 to CU-13).
- #46 (closed): BP-04 E1; mentions CREMS and D-009 for history only.

No issues have been created or edited for this register.

## Already handled or not CREMS-related

Not carried into the register:

- CRE-06 re-snapshot (ES-02), durable drafts and resume (CRE-14, CRE-24), stale-totals recovery (CRE-11, CRE-15) and derive/advise/bind routing (DR-01/DR-02) are already PPO-native.
- ES-09/ES-10 are blocked on lineage and governance, not CREMS. Excel estimate import, PJ-07's r02 source gap, Priva fertigation parity and Pipedrive parity are separate matters.
- "Legacy" in `src/` refers to PPO's own earlier records and styles, not CREMS.

## Suggested order

1. P1 items CU-10, CU-11, CU-12, CU-14 and CU-15. These are visible to users as "Not configured" or as copied vocabulary on the estimating screens. Each needs a PPO rule definition plus tests; real values can follow.
2. CU-16 next, because the rule registry (EC-D01) is the home for every later rule.
3. The Screen Systems items, CU-18 to CU-20, as one ES-08 follow-up.
4. P3 wording items as part of whichever increment touches each document.
