---
document_id: PPO-ADR-0033
revision: r01
date: 2026-09-21
owner: Dean Fiedler
status: Implemented and verified in synthetic scope; owner acceptance pending
---

# ADR-0033 — Structured ES-02 discovery and exact saved reads

Dean requested execution of the supplied ES-02 implementation prompt r03 and
refinement plan r04. This decision implements that independent scope under
PPO-010, EST-01–EST-09, E2-D02/D03 and DR-02. The starting checkout is
`0b3669c`, branch `refactor/existing-modules-ui-consistency`, newer than the
brief's `b4806af`. The clean working tree was branched to
`feat/es02-estimation-wizard`. Existing shared-header/menu refinements stay.

## Representation and compatibility

Retain PostgreSQL immutable revision JSON, TypeScript validation and existing
operation/audit/receipt/outbox transactions. Add an optional `configuration`
snapshot with `schema_version: 1` and definition `PPO-ES02-CONFIG-r01`.
Absence means legacy questionnaire-only input. Explicit null and unknown
versions are rejected. The ten-question `SYN-E2-QUESTIONS/r01` definition,
its hash and work tags are unchanged. No conversion occurs on historical reads.
All paths through `compileDiscovery` dispatch the captured extension, including
saved cost bases and quote-safe historical authority. No pricing or new grant
is introduced. Migration 0030 protects new JSON memberships and permanent child ownership;
the inspected pre-change registry ended at 0029.

Snapshot JSON avoids duplicating the aggregate and its immutable transaction
boundary across mutable child tables. Client-only state would not meet reload,
readiness or authority requirements. A generic schema/rule engine would add
dependencies and unapproved engineering policy. Neither alternative is selected.

## Bounded field contract

Every child has a UUID unique across its configuration graph. Its owning
workspace/option is the containing revision, never an installed Asset identity.
Arrays sort by UUID; set memberships sort and reject duplicates. Fact identity
also includes its system and catalog field; duplicate fields on a system fail.
All object keys are strict. These are technical bounds, not commercial policy.

| Entity | Fields and bounds |
|---|---|
| Area, maximum 20 | id, label (100), optional Facility from saved scope, purpose Growing/Ancillary/Unknown, optional use/stage (500/100), evidence IDs, state Answered/Confirmed/Unknown/Assumed, owned unknown |
| System, maximum 40 | id, name (100), family ControlsClimate/Fertigation/MonitoringWeather/NurseryMachinery/Infrastructure/Other, type (100), intent New/Retain/RetainExpand, proposed work (1000), explicit coverage, saved-scope equipment IDs, evidence IDs |
| Coverage | Defined with 1–20 area IDs; NotAreaSpecific with attributed reason (500); Unknown with eligible owner/reason and no area IDs |
| Fact, maximum 160 | id, system_id, catalog field, role Requirement/Observation/Capability/Assumption, typed value, explicit unit, Answered/Confirmed/Unknown/Assumed, source text (500), evidence IDs, owned unknown |
| Evidence, maximum 120 | id, Manual/Asset/Facility/Site source, optional exact external id/version for native source, observation text (1000), date, note (500). Server captures current native observation/hash; manual text is never upgraded into a document revision |
| Responsibility, maximum 80 | id, explicit area/system IDs, work (1000), Included/Excluded/Optional, PPO/Customer/Supplier/Unknown party, requested business date, source (500), state and owned unknown |
| Follow-up, maximum 160 | id, owner, reason (1000), optional due date, originating fact ID, optional permitted Activity ID. Recorded date is distinct from the Activity's live due date; no Activity mutation |

Catalog v1 supports required climate zones (integer 1–100000, Zones), verified
capacity (integer 1–100000, Zones), equipment model (text 200, Text), supply
description (text 500, Text), and network scope (text 500, Text). A system always
needs a confirmed supply description. Retained ControlsClimate additionally
needs verified capacity; retained MonitoringWeather needs equipment model.
These are capture/confirmation requirements, not a suitability calculation.
Roles remain explicit; a Requirement cannot satisfy a Capability finding.
Unknown values are null with an eligible owner/reason. Units are never converted.

Complete requires both the unchanged questionnaire compiler and all required
extended facts, coverage, areas and responsibility assignments. Informational
routing/source-integration absences do not become blockers. Findings carry stable
key, category, step, entity/field, message and action. Missing or malformed data
blocks save; valid owned unknowns save as Incomplete.

Both complete discovery and costing envelopes remain bounded to 65,536 canonical
UTF-8 bytes, including operation/revision IDs, reason, hashes and confirmations.
Individual maxima cannot all be filled simultaneously. Nothing is truncated.
Ten Facilities, 100 equipment references and 1–3 work tags remain independent.

## Confirmation, copying and source review

Extended confirmations use their own list of `{fact_id, fingerprint}` tokens;
they never enter `confirmed_question_ids`. The fingerprint binds the whole
proposed fact, ownership, schema and observed review context. Preview returns
required tokens, acceptance recomputes them. Changed values/units/source cannot
reuse an earlier acknowledgment. Existing unchanged confirmations persist.

CopyDiscovery continues to reject an edited body. A separately supplied copy
allocation UUID binds deterministic destination child IDs to source revision,
entity ID and allocation. Preview, acceptance and original retry share it.
All child links remap together; immutable lineage records the exact source
revision/entity. External IDs stay external. Confirmed facts/areas/responsibilities
downgrade with explicit copy follow-up. Money, quotations and Activities do not
copy. Same-option history preserves IDs; cross-option comparison uses exact
lineage only. Unrelated same-label rows are added/removed.

Historical starting-point proposals name a historical source separately from
current `expected_revision_id` and workspace version. Current guards remain;
source reads are reauthorised and changed confirmations are reviewed anew.

## Services and routes

| Surface | Contract and consumer |
|---|---|
| Existing workspace create/change/preview | Add configuration dispatch/confirmation; preserve old canonical requests and CopyDiscovery rules |
| GET workspace summary?option_id | Read-only saved estimate/version/exact basis, NoEstimate/Available/Unavailable, current read authority; independent of owner/selected/Complete adoption checks |
| GET workspace history?option_id&before | Descending immutable version cursor, 20 rows plus one authorised look-ahead; aggregate history-count query checks historical scopes/contacts/Activities without returning all payloads. Denied history withholds counts rather than exposing ordinals as totals |
| GET workspace cost-versions?option_id&before | Twenty independently permitted exact versions per page; no automatic money baseline |
| POST workspace compare | Exactly two revision IDs, optional two exact compatible cost versions, current authority on both; deterministic field differences, no selection or writes |
| Existing form options | Scoped bounded candidates, explicit truncation and selected-reference hydration; current authority on save |
| Evidence | Captured/current native observations rechecked through existing shared reads; no CS-08, ES-03 or ES-08 service is fabricated |

Use existing AppError envelopes: invalid structure 422, denied 404, owner 403,
stale source/context/version 409. `costing_import: NotImplemented` remains for
old consumers; additive manual-costing availability describes ADR-0027.

## Native draft and conformance

One memory proposal survives all five steps and three tabs, keyed by identity,
workspace, option and base. Presentation does not save. Record departures offer
Stay, explicit discard, or acknowledged save then continue. Pending/unknown
commands freeze conflicting actions and reconcile their original operation.
Native unload warning adds no persistent browser cache. Debounced previews are
bound to exact input/base and late responses are ignored; failed previews cannot
show Complete. Identity loss clears protected content.

The native Navigation API guards Back/Forward. Captured links and a wrapper
around public History methods stop transitions before Next changes its route
state. The shared shell's programmatic search and installed Reload use a mounted
navigation-review callback; other workspaces retain their existing behavior.
The first browser capture exposed a canceled History update that still changed
the breadcrumb, so URL retention is a negative regression control. Native unload
remains the browser's own warning. Column visibility, width/order and the menu
store only actor/module presentation preferences, never a business draft.

Configuration lineage rechecks exact saved source contexts, including retained
contacts, using the caller's read capability. At most ten distinct ancestral
sources are accepted under the ten-option contract. Typed native source changes
require explicit source-version review; changed observed context requires fresh
acknowledgment of confirmed configuration facts. Historical restoration must name
the exact same-option source containing each restored identity.

ES-02 uses r20 Form / guided workflow with Review / comparison supporting views,
full-bleed native route `/estimating/discovery/[id]`. Reuse SecondaryMenuFrame,
HeaderContent, RecordTabs, native field/table preferences and the actual PPO
logo/Roboto. One main vertical scroll owner; local horizontal table scrolling;
right summary remains outside bottom actions. Incoming: canonical Opportunity,
Site and permitted source records. Outgoing: immutable discovery revision and
separately reviewed manual estimate basis, then existing Draft output.

Retain source container `#ppo-estimate-wizard` and parent scope ES-02. The runtime
module registry and the integration entry in `ui-baselines.json` declare the
native host contract. Evidence and saved-revision inspection use a right-side
modal inspector; short save/option decisions use centered dialogs. The summary
can be hidden independently of the menu. This is an authorized native adaptation
of the written r04 contract; owner baseline acceptance is still pending.

Wizard r03 SHA-256 is
`7ce47597beb1f16e161bac1381c7cfaaabaf4eff357dcbf65ef558f0c02252b2`.
Written refinements and current native shell control missing-image details.
The generated desktop image was not supplied locally and is not claimed as
inspected or an approved native baseline. W06 must record actual source/tests,
payload/performance measurements, native captures and ES02-T01–T70 dispositions.


Implementation refinements recorded 21 September: an optional initial
`option_label` supports the specified “A — Base scope” fixture; omission retains
legacy A and the original command canonical shape. Equipment candidate labels
use an actual recorded external equipment reference when present, otherwise the
native display number; stable IDs, captured source snapshots and external records
are unchanged. Requirements, Configuration and Scope editors remain mounted
within the viewed alternative so selection, filters and drafts survive five-step
and three-tab navigation. Changing the alternative remounts this presentation
state; it never transfers one option's draft to another.

Chrome same-document Back/Forward uses the in-app review. Crossing a document
boundary, browser Reload and tab close use the native unsaved-work warning; the
installed-app Reload entry uses the explicit in-app review before reloading.
Navigation API behaviour was verified in Chrome 153. Other browser families have
not been accepted by this proof. No persistent browser draft/recovery is added.
