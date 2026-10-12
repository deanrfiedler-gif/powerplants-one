# CCE architecture proposal and documentation publication

<!-- versioning: git; committed history is authoritative -->

**Owner:** Dean Fiedler. **Date:** 12 October 2026. **Status:** documentation publication authorised; architecture proposed. **Review:** author reconciliation; independent engineering/security review and business rule acceptance outstanding. **Publication baseline:** `4228d470ca4c566a15e7c3397fc053b8f7bef4bc`.

## User decision and scope

Dean requested improvements and validation of the CCE report, then a reusable Figma design prompt. He subsequently authorised: “Yes, please proceed with the documentation-only branch and pull request.” This record publishes that package for future reference. It does not record adoption of every proposed rule, schema, library or workflow, and it does not authorise application implementation or merge/deployment.

Dean subsequently clarified that this module is only for entering rules, conditions and related configuration data, plus a CPQ module; estimating wizard and quoting pages have already been created. This is the controlling UI scope. Existing estimating/quotation/review/delivery pages are sources and receiving destinations, not new deliverables. The report retains their persistence and handover contracts because CPQ must integrate with them, while the Figma brief is narrowed to authoring and CPQ screens.

The maintained sources are the [technical specification](../architecture/cce-technical-specification.md), [Figma brief](../delivery/cce-figma-design-prompt.md) and [reference evidence](../testing/evidence/cce-reference-validation/README.md). This is a candidate architecture decision record; it reserves no numbered ADR and leaves the existing parent requirement register unchanged. A later adoption should cite this record and resolve the report's DEC/GAP entries explicitly.

## Context and proposed design

The CCE would let domain specialists author bounded configuration and quantity rules while preserving immutable historical estimates. Existing TypeScript/PostgreSQL infrastructure, exact native estimate versions, cost sources, specialist configurators, authority checks and original-operation recovery constrain the design. MYOB Acumatica remains intended ERP authority; SharePoint remains business-document authority and native CAD tools remain authors.

Propose a restricted typed condition/action language, exact bounded arithmetic, immutable rule versions and sealed releases, separate evaluation/adoption, persistent manual intent, and explanations derived from saved evidence. Reuse existing native writers, scoped permissions and receiving workflows. A rule-language engine is not permission to let user-authored code run in the application process.

| Alternative | Trade-off and disposition |
|---|---|
| Small typed language within current TypeScript application | Best fit for explicit allowed actions and reproducible quantities; incurs compiler, unit-system, security and maintenance obligations; proposed, not adopted |
| Broad mathematical expression library | More existing functions, but still requires AST restrictions, resource limits, exact-number policy and security/version review; not automatically sandbox-safe |
| Separate Python/Go evaluator service | Could provide process isolation or specialist libraries; adds deployment, contract and reproducibility overhead without a measured requirement |
| Full decision-management/DMN platform | More mature authoring/interchange capabilities; evaluate licensing, integration and operational cost before selection |
| Code-only rules | Fits existing review and testing but does not meet nontechnical authoring needs by itself |
| Arbitrary runtime scripting | Unbounded capabilities and difficult deterministic/security guarantees; outside the proposed supported language |

Revisit the recommendation if approved requirements need optimisation/solvers, substantial new mathematics, cross-language use, measured throughput beyond the current boundary or decision-table interchange. No new production dependency is introduced by this publication. The Ajv lockfile is retained evidence tooling only.

## Reconciliation with current PPO

| Existing source/boundary | Relationship to the proposal |
|---|---|
| [BP-04](../blueprints/BP-04-estimating-quotation.md), BP-01 parent EST-01–EST-09, PPO-010 | Preserve all parent IDs and exact saved option/estimate lineage; CCE detail derives from this scope, not a replacement catalogue |
| [Independent PPO direction](product-direction-quality.md) | Historical CREMS behaviour is evidence, not a parity or formula-reconstruction prerequisite |
| [Native Estimating programme](../delivery/estimating-programme-handover.md) | ES-04 review, ES-05 quotation release, ES-06 response and ES-07 conversion/continuation already have native contracts; CCE must hand over to them explicitly |
| [Priva Fertigation](../delivery/priva-fertigation-native-handover.md) and [Screen geometry audit](../delivery/es08-geometry-audit.md) | Retain specialist identities and validated evidence. Generic CCE does not rename ES-08 or certify unverified specialist formulae |
| [ADR-0053](ADR-0053-figma-page-design.md) | Use the private existing “PPO - Design” file; preserve named versions and icon-free public captures; no private file URL in Git |
| [Reviews & approvals](estimate-reviews-design.md), [Intake & workload](intake-workload-design.md), [Cost sources](cost-sources-design.md) | Accepted design intent informs CCE layout. New rule-builder/explanation patterns remain proposals; accepted designs and implemented components have separate status |

EST parent IDs and ES page scope IDs are different namespaces. In particular, parent EST-08 is quotation/response/ERP-conversion scope; page ES-08 is Screen Systems. Do not conflate them in a design or implementation register.

The report's historical run inspected `ba1f4e3c155ce6a45dc15e87689de01d42a47e1f`, with 76 migrations through 0077. Current publication source includes 0083. No database results are relabelled as proof of that newer source. The broader JSON schema exceeds the implemented material reference profile, and the native save/snapshot probes are not an atomic CCE adoption command.

## Publication treatment and validation

The report becomes a stable Git working document. Its original export hash and the archive's original hashes remain in the import manifest. Retained evidence, corrected failures and unresolved decisions remain discoverable. Machine-specific paths are removed from public working instructions and redacted in identified historical JSON copies. The public database harness adaptations require a clean checkout of the recorded baseline; they are not application migrations.

The documentation index, programme handover, STATUS and document register link the package. The maintained project instructions provide a short source pointer. This task creates no UI page or component, so it does not create route registrations, review fingerprints or an accepted design record. A later design/implementation increment follows the existing design-register workflow.

[Publication validation](../testing/evidence/cce-reference-validation/publication-validation.json) records checks actually executed for this import and any corrections. Original SQL/native/restart evidence remains distinct from fresh pure checks. Existing issued sources and parent records are unchanged.

## Remaining decisions

Sections 10.2–10.3 of the report remain the detailed decision/gap register. Before implementation, resolve action-profile scope, operating formulas, quantities/units, rounding, cost source/expiry, pricing authority, override/rebase policy, publication duties, worker isolation, native adoption transaction and provider reconciliation. Owners of technical and commercial rules remain to be assigned. No fabricated threshold, synthetic price or component pass grants business acceptance.
