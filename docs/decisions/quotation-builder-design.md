# Quotation Builder design decision

**Date:** 9 September 2026 · **Work:** PPO-010 / BP-04 · **State:** User-authorised bounded design; implementation not started by this contribution.

Dean requested a Quotation Builder design mapping the supplied quotation sections to their inputs and demonstrating one synthetic estimate becoming a complete branded draft. Prove entered text and templates first; add optional AI assistance later.

The [design](../blueprints/quotation-builder-design.md) and [standalone preview](../blueprints/quotation-builder.html) use three steps: Estimate, Content and Review draft. They retain all twelve reference sections, an exact saved-source draft, grouped/detailed pricing and explicit freight inclusion. The example uses fictional data, the existing Powerplants brand assets and E1's AUD excluding-tax boundary. The source operational quotation stays outside Git.

Extend the maintained E1 direction rather than select a new application architecture. Standalone HTML/JavaScript is an inspectable design artefact, not a replacement for the Next.js/domain-service architecture in ADR-0003. The demonstration is deliberately local to browser storage. Durable server saves, permission enforcement, immutable output recovery and formal commercial review remain implementation obligations.

AI is a later optional proposal tool with source references, visible differences and estimator acceptance. It does not calculate money, invent technical/commercial facts or issue/send documents. No provider, budget or live data transfer is selected.

No runtime, schema, workflow, dependency, deployment, source authority or existing commercial state is changed. E2–E6 and P01–P12 ordering, all 78 parent requirements and unrelated workstreams are preserved. Browser visual verification remains an explicit limitation; the synthetic model and PDF checks are recorded separately.
