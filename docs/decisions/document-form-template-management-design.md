---
document_id: PPO-DK06-DEC
title: DK-06 Document and form template management design and receiving handover
date: 2026-09-17
owner: Dean Fiedler
project: Powerplants One
scope_id: DK-06
status: Authorised standalone design; owner acceptance, operational template approval and application integration separate
language: en-AU
versioning: git
---

# DK-06 — Document and form template management: design decision and receiving handover

## Decision

Build DK-06 as a standalone synthetic HTML design that separates **template authoring**, **review**, **publication** and **current eligibility**, and hand the receiving implementation a read-only catalogue increment first.

Artifact: [PPO-Document-and-Form-Template-Management-r01.html](../reference/ui/template-management/PPO-Document-and-Form-Template-Management-r01.html).
Detailed report: [PPO-Document-and-Form-Template-Management-Report-r01.md](../reference/ui/template-management/PPO-Document-and-Form-Template-Management-Report-r01.md).
Source: [`docs/design/template-management/`](../design/template-management/README.md). Verification: [template-management-r01](../testing/evidence/template-management-r01/README.md).

This design is proposed. It approves no template, appoints no reviewer, adopts no policy and changes no application behaviour.

## Context and alternatives

The build plan `PPO-DK06-PLAN r01` proposed a bounded structured editor rather than a general authoring engine. Three options were considered.

| Option | Assessment |
|---|---|
| **Bounded typed editor** (adopted) | Supported structures and failure states can be demonstrated and verified. Rules are declarative and checkable. Chosen. |
| General WYSIWYG document designer | Needs its own capability, accessibility, security and format-compatibility assessment, and cannot be honestly verified as a synthetic prototype. Deferred. |
| Direct editing of the existing runtime template sources | The inspected sources are fingerprinted and shared across OUT-09, OUT-10 and OUT-14. Editing them in place is a controlled change to several output families at once, not an authoring mechanism. Rejected. |

The same three-way split applies to the runtime: catalogue visibility first, managed proposals second, supported publication third.

## What the design retains from existing code

These are contracts to preserve, not behaviour this design replaces. All were inspected at `a5406a81c02d37c4a23e75c1b71c7653fcec0d80`.

| Retained control | Where | Consequence for DK-06 |
|---|---|---|
| `supportedTemplateDefinition` recognises versions 1 and 2 for OUT-09, OUT-10 and OUT-14 only | `src/documents/p11-template.ts` | A new revision label in DK-06 cannot make an arbitrary runtime version supported. Every proposed successor in the artifact reports **no supported runtime version**. |
| Version 2 definitions fingerprint renderer sources, fonts, branding and rendering dependencies | `src/documents/p11-template.ts` | A shared renderer or branding change may invalidate more than one family. The artifact models this and names the affected families. |
| Original definitions preserved; versioned domain policy pointers advanced separately under guards | `src/documents/p11-fixtures.ts` | Immutable definitions and current use policy are separate records, versioned independently. |
| Pack context checks the exact supported template, hash, policy version and renderer version | `src/documents/context.ts` | Publication cannot substitute a newer template into a reserved operation. |
| Report template identity covers actual renderer, projection and escaping source bytes | `src/reports/template.ts` | Dependency identity is byte identity, not a descriptive label. |
| The report worker revalidates template, policy, source and audience before release, and reconciles stored bundles | `src/reports/worker.ts` | Stale-template refusal and original-operation recovery must survive any authoring workflow. |
| Document, issue and distribution contract r07 | `docs/contracts/document-issue-distribution.md` | Original output bytes, template and source fingerprints, current policy checks and recovery remain binding. |

## Design decisions recorded

1. **Family, definition, publication, schema, renderer, output revision and response version are seven separate identities.** A revision label is metadata; it is never a primary key and never a runtime version.
2. **A content fingerprint is a SHA-256 over a canonical serialisation of the definition body and its dependency manifest.** It is computed, not displayed from a stored label, and is verified against `node:crypto` in the model suite.
3. **Audience filtering happens before projection.** A customer-audience definition bound to an internal or restricted source fails validation, and it still fails when a condition would hide the field.
4. **Conditions are three-valued.** Where an unknown controlling value governs required content, the content is not hidden; validation is blocked instead.
5. **Effective intervals are start-inclusive and end-exclusive, with an explicitly open end.** This convention is proposed for review; runtime selection must use trusted server time.
6. **No precedence rule is assumed.** Overlapping assignments on one scope return *Ambiguous match*. Succession over an open-ended predecessor is possible but must be confirmed explicitly.
7. **Publication binds the exact approved definition and the intended use assignment in one durable operation** with an outcome and a receipt. An unknown outcome holds the assignment and refuses a repeat of the same intent until the original operation is reconciled.
8. **A finding response does not close a finding.** The authorised reviewer records acceptance or requests correction; changed content needs a fresh reviewable snapshot.
9. **Impact actions prepare tasks.** Nothing upgrades a consumer, rewrites a response or regenerates an issued file.
10. **Not applicable is a distinct scenario result** from passed, failed, blocked and not run, and is used only where the construct genuinely does not exist in the definition.

## Receiving implementation plan

The runtime remains the TypeScript/Next.js modular monolith with PostgreSQL, domain services, durable operations and outbox, and replaceable adapters, under ADR-0003 and BP-02.

| Stage | Bounded outcome | Required evidence before it is accepted |
|---|---|---|
| **R1 — Catalogue and usage visibility** | Authorised users inspect exact current and historical supported definitions, their dependency fingerprints and their consumer references. Read-only. | Current record and file permissions; complete versus partial reads distinguished; historical identity retained; no mutation of any existing record. |
| **R2 — Managed draft proposals** | Structured proposals and review evidence stored separately from active runtime definitions. | Schema validation, concurrency control, source-binding permissions, and proof that no existing render job is affected. |
| **R3 — Supported definition publication** | A deliberately supported schema and renderer path, and exact definition publication, for one selected family. | Immutable dependency support, original-operation recovery, domain approval and applicable database tests. Must not register a new version number while `supportedTemplateDefinition` returns unsupported for it. |
| **R4 — Controlled use assignment** | Eligible use changed under versioned policy with explicit applicability and effective-time semantics. | Uniqueness and overlap rules, trusted server time, atomic policy updates and refusal of stale in-flight operations. |
| **R5 — Broader forms and providers** | Extension to accepted families, supported formats, real source stores and operational capture. | Real source and schema contracts, form-response migration rules, provider permission and retention, and device acceptance evidence. |

R1 needs no migration, no new endpoint surface for writes and no change to the seed mechanism. It must not convert the guarded seed into an administrative API.

No existing issued PDF or HTML is regenerated as part of catalogue publication or recovery. Historical retrieval uses retained exact bytes under current permissions; reproducing an old sample for comparison is a separate, honestly labelled activity, as the artifact's reconstruction dialog demonstrates.

## Boundaries with adjacent modules

| Module | DK-06 supplies | The other module retains |
|---|---|---|
| DK-01 / DK-02 document library | Exact template and source references and retained review attachments | Source availability, document linkage and technical document review |
| DK-03 output centre | The exact eligible template and the reason for any hold | Output preparation, domain issue, distribution attempts and recipient evidence |
| Estimating / ES-05, ES-06 | Proposed quotation structure and approved template references | Prices, tax, scope and options, terms, commercial approval, issue and customer acceptance |
| Service operations | Proposed pack and report layouts and field definitions | Work and appointment authority, pack checking, visit review, issue and customer response |
| Engineering and Quality | Supported forms and technical output structure | Technical criteria, calculations, competent review, inspection results and native CAD |
| Projects | Progress and handover layouts and document-list references | Project facts, forecasts, scope decisions, staged handover and completion acceptance |
| Finance | Permitted definition and confidentiality rules for supporting evidence | Financial definitions, handoff review, posting and reconciliation, and accounting-document authority |
| Administration / AD-02 | Consumption of versioned vocabulary and approved policy references | Adoption of those policies and values |
| SH-06 / My Work | Prepared review tasks and owned change-impact follow-up | Domain approval and completion of the underlying obligation |

## Open decisions still required from the business

These are held open in the artifact and are not resolved by it: template owner, reviewer and publisher authority and delegation; the accepted runtime schema, renderer path and supported import and export formats; adoption of any new requiredness, unit or technical criterion; the actual applicability precedence policy across entities, purposes, audiences and periods; trusted effective-time boundaries and the authority for policy transitions; rules for ongoing capture sessions, corrections and migration; source-owner acceptance of new branding, terms and response wording; retention under D-012; a compatible supported rendering implementation for all affected families; and any live deployment or publication.

## Verification and status

35 model groups and 38 native-browser groups passed on the authoring source, with zero page and console errors, and 43 captures recorded by identity. The three repository documentation checks passed and 78 parent requirement identities are preserved. Local verification ran on Node 22.22.2 and Chromium 141 rather than the repository's pinned Node 24.21.0 and Chrome channel; the pinned-runtime result comes from the focused workflow on the contribution and is not claimed before it completes.

Owner design acceptance, physical-device and screen-reader review, server permissions and atomic concurrency, real provider and retention behaviour, receiving-system acceptance and application integration remain separate. No merge, deployment, access change, live document issue or business communication was performed.
