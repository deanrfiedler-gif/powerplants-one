---
document_id: PPO-ADR-0038
revision: r01
date: 2026-09-22
owner: Dean Fiedler
status: Authorised implementation in progress; acceptance remains open
---

# ADR-0038 — Native ES-02 fertigation scope

The user authorised native implementation of the r02 prompt under the existing
ES-02 Fertigation family and PPO-010. Reuse TypeScript/Next.js, PostgreSQL,
existing authentication, scoped estimating ownership and operation receipts.
No dependency or service is added. A dedicated immutable scope aggregate keeps
the irrigation graph outside Discovery's 65,536-byte contract; an iframe and
browser storage cannot provide that authority. ES-08's Screen Systems aggregate
and formulas retain their existing meaning. Routes use `/estimating/fertigation`.

The source binding records the exact saved Discovery workspace, option, revision,
selected system and represented areas. Canonical Facility data already owns
structure, use, crop and footprint; saved Discovery captures its own source
context. Separately authorised current observations must identify their version
and must never silently enrich that history. Process context belongs to the
specialist proposal, not a duplicate Facility or installed Asset. Production
tags, crop, growing system, application method and hydraulic arrangement remain
independent, default to unknown, and confer no access or technical approval.

Native schema 1 is a strictly keyed, bounded 2 MiB JSON snapshot. Child UUIDs
are globally unique within a scope and permanently owned by its aggregate.
The service binds ownership/source identities separately from caller input.
Explicit Save revision advances the aggregate atomically; viewing and draft
editing do not save. Operation retry, expected version, exact source authority
and immutable historical reads follow the existing estimating contracts.
Missing technical input may save; malformed values and foreign references fail.

Migration 0042 adds the distinct `FertigationScope` identity and `FRT` readable
reference counter (`SYN-PPO-FRT-000001`), with no new grant or seed. The service
captures exact Discovery identity/hash separately from current Facility
observations and checks the upstream fingerprint on save.

The browser-safe calculation edition `PPO-FERT-NATIVE-CALC-r01` is pure and shared with
server recomputation. Canonical area is m²; hectares convert by exactly 10,000.
Area roles are explicit. Emitter inventory, measured flow and design allowance
are separate active bases. Dormant observations survive a basis switch but are
not added. Independent emitters/hubs count their flow once, never per outlet.
Measured totals do not establish per-crop distribution without an explicit
allocation. Result states distinguish known, unknown, not applicable and outside
the supported model. Context labels never alter hydraulic arithmetic. The
initial timing/storage model is one sequential single-pass circuit. Return-water
and recirculating context is retained, with consumption/storage results withheld.

Irrigation valves and mainline/master valves have distinct prominent registers,
stable identity, phase, source, allocations and typed control assignments. Manual
and external control does not invent an output. Referenced removal requires a
validated atomic proposal; past revisions remain unchanged. Draft application
must say Apply to draft until a server save succeeds. Evidence is a bounded exact
reference, never embedded attachment bytes or an unchecked remote fetch.

Candidates retain the five requested families, exact variant and source evidence;
no manufacturer rating is seeded. User-entered failures remain failures even
when evidence is unverified. Supplier confirmation, PPO review and commissioning
are separate facts. Prepared/accepted/adopted receiving must bind the exact
revision and retain existing Complete/selected-source manual-costing gates;
there is no automatic price or installed-asset effect.

The first receiving consumer uses the explicit binding alternative allowed by
the implementation prompt sections 5.4 and 12.2. Accepting a reviewed F1 creates
an immutable association to its exact originating selected Complete D3; it does
not manufacture a D4 revision or mutate D3's answers, content hash or context
fingerprint. A separate current/historical Discovery projection and manual-cost
preview reauthorise that F1 and show its saved typed quantities, open findings,
actions and exact reportable hash. New Discovery revisions do not silently inherit
the association. Later scope revisions label the retained received F1 as historical.
Receipt as manual scoping notes remains distinct from technical approval and from
adoption for costing. Existing manual-cost save, price and ES-08 lineage writers
retain their original contracts; no automatic SKU or estimate line is introduced.

Exact r02 HTML and audit were read in Downloads: SHA-256
`b51bf2cab7cb1af54e33a0ec739921c4ca1a08da918165d615ead347d6463ab9`
and `945924a4f2842c302446b13c72b5d49721f95f971b0e1cd352423afda6ee8cc8`.
The r01 HTML hash also matches the prompt. The extracted starter-pack directory,
standalone builder/tests/manifests and original build-plan file were not found in
bounded Downloads/Projects searches. The supplied audit preserves requirement
captions but does not replace the missing full build plan. No standalone rerun
or complete parity is claimed. Technical ZIPs were inventoried without running
their binaries; private manual bytes remain outside public Git.

Verification uses independent unit arithmetic and adversarial graph cases,
PostgreSQL transaction/ownership/upgrade tests, HTTP authority tests and compiled
browser save/sign-out/clean-context/exact-revision reopening with a valve. Native
performance must separately measure 100 areas/1,000 valves; technical initial
budgets are 2 MiB request body, 2,000 curve points and 10,000 generated events.
Portable import alone has an 8 MiB UTF-8 file and full JSON-command envelope
limit: a supported 100-area/1,000-valve native export also includes retained
calculation results and readable JSON formatting, which exceed the editable
graph size. The file and escaped transport envelope must each fit their bound.
The imported editable scope still passes the unchanged 2 MiB graph validator;
supplied calculation results are discarded and recomputed. All ordinary native
commands retain their 2 MiB envelope. Strict JSON key, depth and item-count
checks remain in force; embedded attachment migration remains separate.
Native JSON ingress retains at most the accepted 2/8 MiB bound. Rejected uploads
are discarded without parsing until EOF, with a separate 16 MiB transport ceiling
and 10-second read deadline, so ordinary oversized requests receive a complete
actionable 422 JSON response. Exceeding that hard transport/time ceiling may
terminate the connection as a resource safeguard. No rejected bytes reach a
domain command; authentication still precedes body processing.
These are resource bounds, not achieved latency claims. Browser, supplier,
business, owner visual and hosted readiness remain separate gates. This record
selects the foundation; it does not claim all FN-W01–FN-W06 have been delivered.

Additional bounded contracts retain the existing transport and services: the raw_json import field accepts native JSON, representable strict standalone schema-1/2 JSON, or the declared 17-column valve CSV projection. The CSV parser checks quoting, duplicate/type-conflicting IDs and quantities, remaps all local identities, and creates unknown related-register placeholders; it cannot supply canonical authority or omitted emitter/control facts. Legacy measurement provenance is distinct from a planted-area role, and unsupported analogue signal variants remain unknown with their original declaration retained. Neither mapping grants approval.

Scenario comparisons are read-only alternatives over the same physical graph. Candidate constraint tracing is a separately versioned explanatory projection over an exact calculation/proposal pair, rather than a new suitability engine. Local orphan maintenance is restricted to permanently closed failed native storage operations and one exact unreferenced private file; committed preparations and historical bytes remain retained. No hosted cleanup adapter or generic document deletion capability is introduced.
