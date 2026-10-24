# Native CPQ implementation

> **Direction change — 17 October 2026:** Dean adopted the [estimating hub, CPQ and workbench model](estimating-configurator-model.md) (PPO-EST-CONFIGURATOR-MODEL-DEC). It **amends** this record (CM2, CM3): CPQ becomes the single priced line table. Each line has one origin (Rule, Workbench or Manual), each with its own replacement rule. An Express workspace can run CPQ without a Complete discovery (Q1). The text below is retained as written; running behaviour changes only when the matching build step (B0–B6) is delivered.

> **Amended by [ADR-0066](ADR-0066-configuration-rule-sets.md) — 24 October 2026:** "full no-code rule authoring" moves from tracked work in this record to configuration rule sets, which extend this interpreter with a new definition schema. The interpreter stays restricted and deterministic, inside the existing worker limits.

<!-- versioning: git; committed history is authoritative -->

Owner: Dean Fiedler. Implementation authorised in the 12 October 2026 CPQ conversation. Technical choice recorded before implementation; owner visual and operational acceptance remain pending.

## Decision

Extend ES-02 configuration and ES-03 costing with a native CPQ workbench and a company-scoped rule-release studio. Preserve ES-04 through ES-07 receiving, review, quotation and conversion. ES-08 remains Screen Systems. This implements the first usable governed CCE path from the [CCE proposal](../architecture/cce-technical-specification.md); it is not a claim that the entire proposal or Tacton parity is delivered.

Use the existing TypeScript/Next/PostgreSQL stack, exact rational arithmetic and a restricted, typed, deterministic rules interpreter. Use a bounded worker thread with a supervisor deadline for execution. The fixed worker entry loads the existing `tsx` runtime; Next marks that package external so its native loader is not bundled into API routes. The current application image retains the source and installed dependencies; standalone packaging requires an explicit worker/source inclusion contract. No new dependency, arbitrary JavaScript, network lookup or filesystem lookup inside rule evaluation. A general constraint solver, optimization search, CAD and live MYOB integration are separate subsequent deliveries. Explicit constraint diagnostics can block adoption; they do not prove global satisfiability.

Alternatives considered: embedding arbitrary expressions is unsafe and non-reproducible; adding a solver service now adds deployment and licensing decisions before operating constraints exist; browser-only calculations cannot supply authoritative evidence. Preserve the reference package unchanged and adapt its arithmetic into application-owned source with tests.

Release and run identities use UUIDs; release labels provide display names. No new readable reference type is invented. Release content is immutable. Each revision captures the typed facts, components, constraints, pricing and rules together; review binds its exact hash and fixture results. Author, reviewer and publisher are separate actors. Activation is company-scoped and version checked. New CPQ capabilities default to no grants; existing access management assigns them explicitly. No identity silently gains a duty.

Runs freeze release, discovery revision/context, user inputs, pricing date and overrides. Unknown required facts, conflicting contributions, expired prices, unresolved overrides and receiving limits block adoption. Only a current successful run from the active release may enter the native estimate. Adoption shares one transaction with the native estimate writer, CPQ evidence and operation receipt. It checks the exact estimate/workspace versions and source context. Existing unrelated cost lines are preserved; CPQ-owned lines alone are replaced. No silent truncation beyond the existing 100-line AUD/excluding-tax contract.

Costs, discounts and overrides remain internal. Native quotation projection continues to whitelist customer fields. Synthetic examples are explicitly labelled; passing fixtures is software evidence, not engineering or pricing approval. Source-bound operational price books, global optimization, full no-code rule authoring, customer portal and external connectors remain tracked delivery work.

## Design and validation

Dean subsequently assigned the UI/Figma work to Claude and this workstream to planning and backend implementation. This change contains no application page or Figma edits. The API handover defines the UI's required states and recovery controls; visual acceptance belongs to that separate workstream.

Acceptance requires deterministic execution; typed unknown handling; exact arithmetic; same-release replay; separate author/reviewer/publisher; scoped access before command recovery; stale-source rejection; atomic estimate adoption; preserved manual costs; immutable history; keyboard-labelled forms; clear error/retry states; and populated migration upgrade evidence.
