# Nursery Automation Configurator acceptance catalogue

<!-- versioning: git; committed history is authoritative -->

Owner: Dean Fiedler. Status: proposed cases, not executed application tests. Basis: [specification](../blueprints/nursery-automation-configurator.md), [scope direction](../decisions/nursery-automation-specification.md), O1–O15 and DP1–DP8 from the user-supplied updated plan.

These local NAC-AT IDs derive from existing EST parents; they do not replace or close parent requirements. All examples use synthetic data. Technical, software, owner and commercial acceptance remain separate.

| Case | Parents | Setup and expected proof |
|---|---|---|
| NAC-AT01 Single replacement | EST-02/06 | Bind existing site/equipment, one new machine and retained conveyors. Purchase only the new machine; preserve retained interfaces and applicable installation/commissioning. |
| NAC-AT02 Connected line | EST-02/06 | Include media, dispenser, potter, manual planting and take-off. Per-scenario capacity is limited by the slowest compatible stage; missing planting rate makes it unassessable. |
| NAC-AT03 Staged retrofit | EST-03/06 | Compare current and future phases. Future robot is not counted in current capacity or base price; current take-off remains covered. |
| NAC-AT04 Containers and source conflict | EST-02/06 | Test lower/upper boundary, outside range, flexible nesting and conflicting supplier limits. No size-only suitability; retain both sources and owned clarification. |
| NAC-AT05 Units and output | EST-04/06 | Independently expect 300 trays/hour × 12 = 3,600 pots/hour; 2,400 × 6 × 0.95 = 13,680 good pots. Net-good input does not apply the quality loss again. Zero/unknown occupancy and excessive stops are explicit. |
| NAC-AT06 Buffers/topology | EST-06 | 240 places at 40 pots/minute gives six minutes; zero demand is N/A. A shared operator or branched line is not passed through the simple minimum-rate model. |
| NAC-AT07 Quantity bases | EST-04/06 | Two installed units plus one spare yields three purchased units but two installation drivers. Customer-supplied/reused items need no purchase but retain selected work. Pack/waste conversion has one reviewed basis. |
| NAC-AT08 Supply-only scope | EST-02/04/08 | Installation is separately classified by applicability, selection and responsibility. No inferred PPO labour or promise; customer enabling works remain visible. |
| NAC-AT09 Supplier commissioning | EST-04/08 | Base commissioning has supplier responsibility and exact coverage evidence. No second PPO commissioning charge; local integration tests can remain additional if distinct. Missing evidence holds coverage unresolved. |
| NAC-AT10 Assembly/shared work | EST-04/06 | Assembly activity covers its components; shared project mobilisation appears once across Nursery, Screen and Priva instances. Additive/replacement conflict blocks Use until resolved. |
| NAC-AT11 Labour dimensions | EST-04/05 | Independent expected 2 × 3 person-hours + 2 setup = 8 person-hours. Units/person-hour is inverted; crew hours convert once. Factors apply only to declared portions, then ordered minima/rounding. Unknown required standard is not zero. |
| NAC-AT12 Manual activity fallback | EST-04/07 | Missing standard can use an authorised reasoned Manual basis with source and review. Preserve calculated/adjusted values and supported zero reasons; incomplete required effort blocks Use. |
| NAC-AT13 Matched source projections | EST-03/06 | Parts from run A and facts from run B are refused as a pair. Exact source/instance/alternative, edition and hashes survive Accept, pricing and Use. |
| NAC-AT14 Mapping and rerun | EST-03/09 | Unmapped active line blocks Use. Unchanged identity/unit/basis can retain eligible local mapping; changed technical selection or mapping conflicts require review. Local resolution does not publish a shared mapping. |
| NAC-AT15 Override/removal | EST-03/04 | Change generated quantity after a CPQ override; preview Keep/Replace/Remove as allowed. Part/unit changes prohibit quantity carry-forward. Removed/reintroduced parts and explicit empty contributions need review; unrelated instances/manual lines survive. |
| NAC-AT16 Options | EST-03/04/08 | Offered unselected training has separate complete basis/price and is absent from base total. Selected dependencies are present. Alternatives remain isolated; parking cannot hide required scope or active unmapped items. |
| NAC-AT17 Change impact | EST-03/07 | New technical scenario reruns affected technical work/facts; rate-only change recalculates CPQ; approved editorial clause change takes quotation review route. Publishing profiles/standards does not silently adopt them. |
| NAC-AT18 Content reconciliation | EST-07/08 | Detect promised installation without priced/evidenced coverage, contradictory exclusions and duplicate clauses. Do not expose productivity, internal hours/cost/margin. Fixed-price text makes no inferred duration/hour-cap promise. |
| NAC-AT19 Exact outputs | EST-03/08 | Only adopted-run documents offered. Changed bytes require successor manifest/source even with unchanged quantities; required failure blocks receipt, optional output can be withheld. Original issue downloads remain byte-identical. |
| NAC-AT20 Recovery and access | EST-03/07 | Lost Accept/Use response recovers same original authorised receipt with same payload, even after later edits. Different payload requires new operation. Current revoked/cross-company source or target access refuses reads/actions without disclosure. |
| NAC-AT21 Limits | EST-04/06 | Exact adopted quantity/line/document limits pass at boundary and fail above it; retain all data, no truncation or artificial split. Count parked/retained scope according to the reconciled shared contract. |
| NAC-AT22 Desktop/mobile | EST-02/06 | Complete configuration, resolve a source conflict, save/reopen, preview receiving and review delivery scope at desktop/phone widths. Keyboard order, focus return, 200% zoom, long descriptions and uncertain-save recovery are usable. |
| NAC-AT23 Complete journey | EST-01–09 | Saved Discovery and Express cases each reach exact priced estimate, reviewed customer scope, approved issue and existing controlled handover; no live ERP/customer sending. Shared prerequisites must be implemented before reporting pass. |

## Pilot evidence and benefit measurement

Use three representative synthetic projects: replacement, connected line and staged upgrade. Capture source/contract versions, inputs, independent expected results, actual output, reviewer, desktop/phone evidence and unresolved findings. A software test does not replace supplier confirmation or the user's acceptance.

Measure estimator time, clarification rounds, omitted equipment/services and quotation rework against a comparable current process. Record sample count and project complexity; agree improvement targets with the owner after baseline collection. No savings target or production-readiness claim is assumed.

## Documentation and template assurance — 22 October 2026

Foundation, naming and development-register checks passed; these establish document/link/register integrity, not acceptance of the proposed workbench. Existing design review statuses remain unchanged. All nine workbook sheets were rendered and visually inspected. An independent read of the exported Excel file verified ZIP integrity, sheet names, freeze panes, 151 dictionary fields/labels/units/examples/guidance, 453 blank input/evidence/source cells and all 176 dropdown cells. The file contains no formulas or external workbook links. Native Excel editing and future import behaviour have not been tested.

The workbook authoring process saved its output and completed its own checks but returned a nonzero exit without a diagnostic. The independent exported-file checks above passed; a clean authoring-process exit is not claimed. No NAC-AT application scenario has been executed because this package adds no application behaviour.
