---
document_id: PPO-010-E2-CONTRACT
revision: r01
date: 2026-09-09
owner: Dean Fiedler - prototype owner
status: Proposed receiving and persistence contract; no schema or API implementation
---

# E2 receiving and preservation contract

Read with the [policy design](../blueprints/estimating-e2-design.md). These are logical command contracts, not allocated routes or SQL objects. Existing `estimating/options` is E1's eligible-opportunity selector; do not repurpose its meaning silently. Physical names, forward migration number and deployment compatibility must be selected against actual main at implementation time.

## 1. Shared context and access

The fixed workspace/company and canonical Opportunity, Organisation, Site, Person, Facility and Activity identities remain authoritative. Derive organisation context from current relationships, not a copied owner name. Recheck current `estimating.read`/`estimating.edit`, current estimating ownership, shared/CRM target visibility and eligible receiving owner on every command. Quote-safe reads retain separate E1 capabilities. No new implicit grant for Systems, technicians, Sales or Finance follows from this design.

All selectors, counts, reads, source comparisons, history, output and receipt lookup/replay use current related-target access. A captured Facility name or answer does not remain readable after its underlying scope is revoked. Missing/inaccessible lock context cannot be interpreted as an empty group. Denial clears loaded and proposed content for the changed identity; a generic explanation must not disclose another option's private status or owner. Activity follow-up retains its independent owner/status/permissions; saving a snapshot does not create or complete an Activity silently.

## 2. Logical records

| Record | Required identity and content | Integrity rule |
|---|---|---|
| EstimatingWorkspace | Existing Opportunity/company; version; selected option | Unique workspace per Opportunity; first option + selection atomic; non-null selection once created; selected option must be Active and in the same group |
| CommercialOption | UUID; workspace; route snapshot; current estimation revision; Active/Archived; predecessor option where branched | Label is not a key. Immutable route; one current revision; archive guarded against selection |
| RoutingSnapshot | UUID; definition ID/revision/hash; all inputs and attribution; decisive rule; outcome | Confirmed option requires Full or Express; Invalid/NeedsClarification cannot confirm a new route |
| EstimationRevision | UUID; option; predecessor; reason; scope and answer snapshots | Immutable; sequential predecessor in the same option; no rewritten E1 r01 |
| ScopeSnapshot | UUID; exact Site/Facility IDs and observed versions/names; membership by work-system tag; explicit no-site/unknown reason | Same-company/site foreign-key checks plus current visibility; parent does not imply child; no duplicate membership |
| AnswerSnapshot | UUID; definition and exact active/hidden/incompatible answers; source attribution; follow-up owners; content hash; readiness | Required flags/conditions derived on server from captured definition; never trust client Complete |
| Estimate basis link | Estimate version UUID → exact option/estimation/scope/answer UUIDs and hashes | Append-only binding for newly authored versions; never attach a new meaning to an older cost version |

Bounded proposal: 10 options per workspace; 10 Facilities within one Site; three system tags; ten active r01 questions; plain-text limits from the design; maximum 64 KiB canonical command payload. Reject excess without truncation. Route answers and contract-review answers are separate namespaces. Dates/author are server derived; input evidence includes a bounded source note (1–500 characters). Change reasons and unresolved-item reasons are 1–1,000 characters. Values and counts never reuse a readable label as identity.

## 3. Commands and concurrency

Every mutation uses the existing operation UUID, schema version, canonical payload hash, expected versions, reason, server audit and durable outbox pattern. Same UUID/same canonical content has one effect; changed content with the same UUID conflicts. Reauthorise before returning an old receipt. Lost responses retain the original operation until reconciliation establishes its result; no replacement create is inferred from a timeout.

| Logical command | Required expectations and guards | Atomic result |
|---|---|---|
| ConfirmFirstOption | Expected no workspace; current Opportunity/context versions; complete route and valid initial snapshot | Workspace + option A + r01 + selected A; one receipt; an Incomplete questionnaire is allowed |
| BranchOption | Workspace/current source option revision; whole-group Draft whitelist; complete route for different-route branch; explicit copy choices | New Active unselected option and r01; old selected pointer and all source records unchanged |
| SelectOption | Expected workspace version and current selected UUID; target Active; whole-group state check | Replace one pointer and advance version once; one audit event; never update CRM money/stage |
| SaveScopeRevision | Workspace and current option revision; current target visibility; definition hash and acknowledged comparison; route compatibility | Immutable successor + source/hash/readiness; advances current pointer; no cost lines or quote output changed |
| ArchiveOption / ReopenOption | Workspace version; known Draft-only group; eligible owner; archive target unselected | Append state event; selection retained; no deletion of estimates/quotes |
| UseScopeForManualEstimate | Workspace and current Estimate version; chosen Active option; exact Complete scope/answer IDs/hashes; current E1 permissions | Explicit new Estimate or successor using retained E1 manual validation and immutable history; no generated/repriced lines |

Serialize group mutations through the same workspace lock and enforce the selected option relationship at database level. Scope save, branch and selection all advance the workspace version so a concurrent compare cannot accept stale assumptions. Estimate/quote mutations check the applicable workspace state in the same transaction. Do not implement locks only in UI. Original document workers retain their exact input and current-authority checks; they do not read the current selected option to reconstruct output.

Definition adoption/resnapshot is deliberate. Keep the old complete basis available to its old estimate while a new revision is Incomplete; the UI must identify both. A future module introducing approval/issue/terminal states must extend the lock contract explicitly. Until then those states block new group mutations without blocking independently authorised exact history reads.

## 4. E1 compatibility and upgrade proof

E1 currently allows one Estimate per Opportunity, with embedded option A and estimation r01 UUIDs. E2 must formalise those same UUIDs without altering the saved JSON, predecessor chains, content hashes, original operations, seed receipts, captured templates or HTML/PDF bundles. Do not infer missing questionnaire values or mark legacy scope as Complete.

Preserve A's existing context as `LegacyManual` in an additive compatibility record; display “E1 manual basis — E2 questionnaire not recorded”. The existing E1 contract remains usable against that exact legacy basis. A deliberately reviewed successor may attach the new E2 scope/answer snapshot. Adoption of an Express/defined-supply route for this legacy A requires an explicit attributed compatibility command that verifies the existing manual-defined-supply premise and records a new extension; it does not rewrite the old routing/scope content. A proposed Full or service route requires a new option. Existing A/r01 and every old cost/quote source remain unchanged.

The future migration must change the one-Estimate-per-Opportunity restriction only as needed for one Estimate per option, while retaining the unique legacy Estimate and its foreign keys. Old commands/receipts replay under their original schema and current access, not rewritten through a new request shape. Old creation clients must not accidentally create a second default workspace. Before coding, specify the exact E1/E2 command-version dispatch and constraints in the implementation ADR; this design reserves no schema number.

Capture a pre-upgrade manifest of all E1 IDs, hashes, reasons, receipt results and exact HTML/PDF bytes. Compare it after forward migration, repeated seed, same-operation replay, option B creation, selection changes, scope successors and distinct application/PostgreSQL restarts. Existing captured Facility data is immutable history; current grants still govern its use. No reset/reseed that deletes accepted originals is a compatibility proof.

## 5. Quotation Builder interface

This is a proposed handoff to the separately discussed templates-first builder, not a claim that its design is already published. A builder selects an **exact saved Estimate version**, which already points to its scope/answers. It must not pair Option A prices with whichever Option B is currently selected. A mismatch blocks import and shows the two sources; changing to a compatible source is explicit.

| Builder content | E2 source | Review boundary |
|---|---|---|
| Included work | Confirmed Q01 and explicitly selected work membership | Copy as a proposed customer-facing block with source identity; author reviews wording |
| Exclusions and assumptions | Confirmed Q02/Q03, preserving explicit NoneDeclared | No text inferred from missing answers; author review before inclusion |
| Product and delivery description | Applicable confirmed Q05/Q10 and selected scope labels | Whitelist intended customer content only; no hidden/history/incompatible answers |
| Price table and include/print | Exact E1 Estimate version and quote choices | E1 decimal arithmetic and customer-safe projection remain authoritative |
| Freight responsibility | Confirmed Q09 | An input for reviewed narrative; not approved Incoterms, charge or booking |
| Specifications, lead times, validity and payment terms | Separate explicit author inputs or later controlled sources | E2 does not invent these, convert route prepayment into terms or reuse a real customer document's wording |

Snapshot provenance remains internal: option/estimation/scope/answer/Estimate-version IDs, definition hashes, source field IDs and author changes. Internal notes, cost sources, supplier detail, margin, routing answers, open review items and inaccessible Facility names must not enter safe DTOs/HTML/PDF. Customer narrative can differ after review but retains the source relationship. Editing narrative never edits the source questionnaire; updated scope requires a new explicit import/diff and new draft revision. Optional AI later can propose wording for review, with no autonomous pricing or commitment.

E2 does not change the E1 template. Historical drafts continue using their captured `PPO-E1-DRAFT-r01` definition and stored original bytes. A builder template is a separate versioned design/implementation. No new estimate, draft quotation or customer-safe completeness is claimed merely by opening this walkthrough.
