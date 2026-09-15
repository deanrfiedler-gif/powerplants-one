---
document_id: PPO-QUALITY-DEC
revision: r01
date: 2026-09-14
owner: Dean Fiedler - prototype owner
status: Adopted product scope; implementation and acceptance tracked separately
source_commit: 10625815187f26179f316b887fcdee33467ac81f
---

# Product quality and capability adoption

Dean instructed, on 14 September 2026: **“I would like to incorporate all of your below recommendations into the Powerplants One app.”** The accompanying message enumerates eight product refinements, five engineering/design standards and the existing capabilities to carry forward. This is the authority for adopting them into the product and staged implementation scope. They are no longer unadopted research suggestions.

## Adopted outcome

Keep the seven business domains, current visual direction and BP-02/ADR-0003 architecture. Deliver QR-linked equipment, structured inspections/commissioning, service-bulletin tracking, personal/team views, readiness explanations/change-impact previews, actionable My Work, data-quality/integration operations and horticultural visit readiness. Carry forward the existing portal, recurring maintenance, warranty, knowledge, estimate-to-actual learning, AI assistance, voice and global-search scope.

Adopt explicit security coverage, business-operation monitoring, shared components, accessibility/performance measurement and recoverable releases. The [quality and gap register](../requirements/product-quality-register.md) defines the full set, parent mappings, acceptance and evidence status. The [delivery plan](../delivery/product-quality-plan.md) orders the work and records the three first implementation packages. These are derived requirements, not new parent IDs or an eighth domain.

The instruction approves the product direction and staged synthetic development. It does not manufacture missing site rules, equipment limits, commercial definitions, response commitments or source-system facts. Such inputs remain visible dependencies. Use versioned fictional values for synthetic implementation; retain the existing authority boundaries for live integrations, paid services, communications and production transition.

## Source and design reconciliation

The previous assessment inspected main `10625815`, including normally merged #177. Live inspection for this adoption found the same main and open #179, which already implements #120 URL restoration and documents #121 scrolling/layers. Named saved views follow that contribution; do not duplicate it. Open #180 addresses retained-contact permissions and is separate. Older pending-integration wording in STATUS is not evidence that #177 remains unmerged.

The current attachment label says `powerplants-one-theme-style-board-r17.html`, but the supplied readable file is `powerplants-one-theme-style-board-r16(2).html` and its internal title identifies **r16**. Its SHA-256 is `19d96d383fadfda3bb03b5939cb933a64e4b220e69b8cb9a21df3f48d90b794f`. Source inspection establishes r16 content only. No r17 bytes, visual review or r17 baseline acceptance is claimed. This does not block scope adoption; reconcile the actual r17 file before implementing its particular changes.

The [accepted UI baseline register](../standards/ui-baselines.json) continues to identify exact accepted module designs. The theme board informs shared direction; it does not silently replace those files. Preserve their issued bytes and resolve differences through a reviewed successor. The r16 AI explanations, guided change reviews and recurring monitoring examples are design evidence, not working services.

## Technology disposition

| Recommendation | Adopted requirement | Implementation decision still needed |
|---|---|---|
| OWASP ASVS 5.0.0 | Versioned applicability/control/evidence mapping across the selected application | Threat-based applicability and verification depth; no certification inferred |
| OpenTelemetry / Next.js instrumentation | Correlate business operations across web, database and workers | Bounded instrumentation/exporter ADR, redaction, sampling and operating destination before adding dependencies |
| Executable design system | Shared semantic tokens and tested components using accepted designs | Evaluate DTCG 2025.10 interchange; compare with current CSS/token register; no wholesale CSS or framework replacement |
| WCAG 2.2 AA / browser responsiveness | Complete-workflow accessibility and separate browser-performance evidence | Representative devices, journeys and field-sample coverage; no conformance from screenshots alone |
| Recoverable releases | Source-bound dependency inventory, staged checks, stop conditions and restore evidence | Costed operating ownership and infrastructure-specific procedures before production |

DTCG evaluation is approved; selecting it as the canonical storage format is not predetermined. Likewise, accepting observability does not choose a paid monitoring service. Preserve existing tests and evidence; adding a quality goal does not waive a current failure or modify a passing criterion retroactively.

## Record boundaries

This contribution changes specifications and planning only. Feature code, schema, workflows, dependencies, hosted configuration and issued references are unchanged. The register records implementation status honestly. A document merge adopts scope; each runtime increment still needs its own code, applicable checks, accepted journey evidence and deliberate Azure update. Full PP-01 acceptance and existing operational decisions remain open.

Original assessment: *PPO-Product-Quality-and-Opportunity-Assessment-r01.md*, 14 September 2026, and the recommendations quoted in Dean's adoption instruction. Primary technical references are retained in the register. The original research artifact remains a historical assessment; this decision supersedes its “not adopted” status only for the scope explicitly mapped here.
