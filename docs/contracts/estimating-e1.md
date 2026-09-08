# BP-04 E1 physical and API contract

**Scope:** Authorised manual synthetic estimate and draft quotation, issue #46 / ADR-0017. Verification is recorded in the [handover](../delivery/estimating-e1-handover.md). The broader BP-04 design and 78 master parents remain unchanged.

## Identity and history

Migration 0012 introduces `Estimate` (EST display reference), immutable `EstimateVersion`, `DraftQuote` (QUO display reference) and immutable `DraftQuoteRevision` business identities. One Estimate belongs to one existing Opportunity and fixed eligible owner, company and optional site. Its option A UUID and estimation revision r01 UUID remain distinct. Each version has an exact predecessor, separate scope revision UUID, manual lines, author, reason, policy and canonical content hash. A current header advances once with an exact deferred graph check. No version is updated or deleted.

One draft Quote per Estimate advances through immutable revisions. Preparation binds an exact saved estimate version, explicit line membership, a safe projection and captured template/input hashes. Quote preparation checks both current Estimate version and current Quote revision (zero before the first quote). Historical saved versions can be selected deliberately; unsaved proposals are never read by preparation. Quote states remain Draft. No tax, issue, delivery, signature, acceptance or operational terms are inferred.

## Manual arithmetic

`SYN-EST-ARITHMETIC-01` is the adopted E1 synthetic subset, not an operational or CREMS parity claim. Decimal strings are canonicalised before receipt hashing. Quantities are positive, at most 100,000 with up to three decimal places. Unit cost and sell are 0–1,000,000 AUD with up to two places; estimate sell must be at least cost. Each extended line is rounded HALF_UP to two places, then summed using scaled integers. Margin uses sell as denominator; markup uses cost. A zero denominator is N/A. Empty scope-only drafts have unknown totals and cannot generate a quotation. A legitimate all-zero complete estimate has explicit zero totals.

Each nonempty saved line requires description, Product/Labour/Freight category, quantity, unit, manual cost and sell, source and actual source date. Up to 100 lines are allowed within the 64 KiB command limit. The design's discount, foreign exchange, landed-cost and three-place unit-price examples remain design fixtures outside E1; they are not silently rounded or adopted as runtime behaviour. Tax is excluded and not calculated.

Include and print are independent. Exclusion removes price. An included unprinted line contributes to one named, priced “Included scope allowance”; printed lines plus allowance equal the draft total. The safe output contains only title, recipient/site/contact display context, explicitly entered scope/exclusions/assumptions and selected sell extensions. Source notes, unit costs, margins, markup, choices and internal version history are never copied into that projection. Authors must put internal notes in line sources rather than customer-facing scope.

## Access and commands

All routes use the existing loopback gateway/session and current company/site grants. `estimating.read` governs internal reads; `estimating.edit` plus ownership and current underlying Opportunity/customer/person visibility governs saves. `estimating.quote.read` governs the safe quote and files; `estimating.quote.prepare` additionally requires internal read, edit-owner eligibility and quote read. Ownership alone grants nothing. Current relationship visibility is rechecked on aggregates, direct records, reads, commands, receipt lookup/replay and worker finalisation. Seed receipt 12 grants the four capabilities only to eligible synthetic Coordinator/Company B profiles once; reseeding cannot revive revoked grants. Safe-only readers can be explicitly provisioned in tests without internal estimating access. Systems and technicians receive no default estimating authority.

| Route under `/api/v1/` | Contract |
|---|---|
| `crm/opportunities/[id]/commercial` GET | Mobile CRM projection of current permitted estimate identity/version/sell total, site, exact draft quotation revision links and current creation eligibility; no query parameters or mutations |
| `estimating/options` GET | Up to 100 currently eligible Opportunities without an Estimate; current estimator context |
| `estimating/estimates` GET / POST | Permitted latest-first internal list / atomic CreateEstimate |
| `estimating/estimates/[id]` GET | Current saved detail, optional exact `version_id`, history and current capabilities |
| `estimating/estimates/[id]` POST | SaveEstimate with expected version, full proposed scope/lines and reason |
| `estimating/estimates/[id]/quotes` POST | PrepareDraftQuote with exact saved version, expected Estimate/Quote versions, choices and reason |
| `estimating/quotes/[id]` GET | Safe immutable revision and durable output status; internal links only with internal read |
| `estimating/quotes/[id]/render` POST | Empty body; owner requests generation/recovery of the original render job |
| `estimating/quotes/[id]/file?kind=html` or `pdf` GET | Exact ready bytes after current safe-read authority and binding/hash checks |
| `operations/[id]` GET | Existing actor-owned receipt, now reauthorised for Estimate/DraftQuoteRevision originals |

Mutation inputs are whitelisted. Business commands use the existing operation UUID/schema/reason envelope, canonical payload hash, workspace transaction, expected versions, receipt, audit and outbox. Same UUID/content replays the accepted original; changed content conflicts. Current authority precedes receipt access. Browser uncertainty freezes a proposal and reconciles its original command. A changed saved version requires explicit comparison and adoption of the current predecessor before a new save intent.

## Exact output and recovery

Preparation captures the PPA logo bytes, Verdana fallback and `PPO-E1-DRAFT-r01` HTML definition. The draft input is immutable. A separate two-minute leased job records attempts and retains one immutable bundle keyed by job UUID through the existing private synthetic document adapter. PDF generation uses the repository's pinned Playwright renderer with external requests blocked. The bundle binds workspace/job/revision/template/input, original HTML and PDF hashes, byte counts and browser version. A Ready job cannot be overwritten. A file acknowledgement followed by a process/database interruption recovers the stored original bundle rather than rendering another output. Missing/corrupt original bytes report unavailable while retaining the reference. Render retry is a POST, never a GET side effect. No document crosses into a live storage adapter.

The UI provides scope and manual line editing, separate proposal/saved totals, saved history and exact-source draft preview/downloads. Phone context is compact and cost controls reflow. Shared identity changes unmount sensitive forms. Browser entries are online memory only; no offline-save claim is made.

## Mobile CRM presentation projection

The authorised mobile increment reuses `visibleOpportunity`, `relationshipContext` and `readEstimate` for the commercial read above. It requires current `estimating.read` plus underlying CRM/shared visibility. Draft quote links use the exact existing revision IDs and their current read permissions. Creation eligibility is true only when no estimate exists and the current estimator relationship permits editing. Missing/unavailable context returns the existing scoped failure; it never creates a record or exposes hidden commercial totals. See the [mobile mapping](../decisions/mobile-crm-implementation.md).
