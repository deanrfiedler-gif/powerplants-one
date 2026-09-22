# Priva Fertigation Configurator — native implementation plan

22 September 2026. Authorised implementation under ES-02 / EST-02, EST-03 and EST-06. Delivery, owner acceptance, manufacturer suitability and hosted deployment are separate states.

## Baseline and sources

The clean supplied checkout was on `feat/cs05-facilities-growing-areas` at `40dc2571c62ef4f6eb191b721896de5996b24be2`. Fetch confirmed `origin/main` at `0c95c5af776c97374997623bd1070d9de480cf82`; no open PR or native fertigation branch was found. Work continues on the dedicated `feat/priva-fertigation-native` branch from that main. Existing branches, worktrees and issued sources are preserved.

The complete native execution prompt r02 and Start Here r02 were read. Current user instructions authorise native implementation; the historical audit's offline HTML delivery instructions do not govern this increment. Source availability was confirmed before editing:

| Supplied source | SHA-256 / availability |
|---|---|
| r02 workbench HTML | `b51bf2cab7cb1af54e33a0ec739921c4ca1a08da918165d615ead347d6463ab9`, 310,069 bytes; exact match |
| r01 workbench HTML | `f3b18fa6bdc59e64224075d9a8b3517b28485813207a6ca4e4bd77a5efa4807f`, 265,640 bytes; exact match |
| Audit and Improvement Report r01 | `945924a4f2842c302446b13c72b5d49721f95f971b0e1cd352423afda6ee8cc8`; exact match |
| Native execution prompt r02, Start Here r02, historical audit prompt r01 | Readable in the supplied Downloads location |
| Supplier questionnaire DOCX/PDF | Readable; questions Q01–Q26 are not supplier answers |
| Technical ZIPs | 135 fertigation-unit files and 79 controller files inventoried; originals remain outside Git. Manuals require applicability/disclosure assessment; executable/firmware contents are not run |
| Customer scope report r02 | Readable supplied reference; synthetic output, not a released native report |
| Extracted starter-pack directory, README, receipt, manifest, correction source, builder and reference tests | Not located. User was asked for the actual folder path. Exact HTML access does not establish reproducibility of the absent package |
| Original detailed build-plan r01 | Not located as a standalone source; the audit retains its F/CALC/UI/AT mapping. Full original-source reconciliation remains open |

PR #275 published standalone r01. Merged PR #276 published one handover document; its earlier draft wording does not override merged metadata and it did not publish native code or the complete r02 package.

## Field ownership and lineage

| Owner / service | Actual fields | Native treatment |
|---|---|---|
| `src/shared/facilities/definition.ts` and permitted shared reads | `structure_type`, `use`, `crop`, `context_source`, `footprint_m2`, parent/location, version | Canonical physical record. Source-bound permitted observations retain exact ID/version/date; specialist edits never change the Facility |
| Saved Discovery `scope` / `discovery-context.ts` | Site/Facility/Asset IDs; `observed_context.facilities` captures only ID/version/name | Preserve captured history. Do not claim structure/crop/measurements were captured by an older Discovery revision |
| `configuration-definition.ts` | Area `facility_id`, `purpose`, `use`, `stage`, source/evidence/state; system family `Fertigation`, coverage and equipment IDs | Bind the exact alternative/revision and selected system/areas; no flow in Zones, no opaque model in a text fact |
| Fertigation scope, versioned native schema | Commercial-context associations, project crop groups, growing system, irrigation method, hydraulic arrangement, represented quantity/basis and evidence | Capture missing project/process detail once. Unknown defaults; commercial labels do not choose hydraulic formulas, recipes or equipment |
| Existing installed Assets | Exact canonical identity/version and observed role | Optional links require current authorisation; proposed equipment remains a scope record |
| Manual estimating | Existing exact selected Complete Discovery basis and manual line arithmetic | No automatic SKU/rate/margin/tax mapping or repricing. Prepared/accepted/adopted state must remain distinct |

Detailed choices are recorded in the native ADR. The existing TypeScript/Next.js/PostgreSQL stack, scoped domain services, shared command receipts, document adapters and shell are retained. No dependency, framework, live controller connection or new deployment infrastructure is required.

## Delivery sequence and bounds

FN-W01 establishes source reconciliation, field ownership, schema/calculation identities and traceability. FN-W02 proves an exact saved Discovery alternative → native scope → master/irrigation-valve draft → accepted immutable revision → sign-out → clean-context sign-in → exact revision reopen. Incomplete non-container/non-berry capture belongs in this milestone.

FN-W03 implements the nine native views and supported calculations. FN-W04 adds exact history, review/evidence/recovery, interchange and audience-safe output. FN-W05 implements controlled receiving without weakening manual costing. FN-W06 runs database, direct HTTP, compiled browser, regression, upgrade/reseed, visual and performance checks, and prepares a draft PR and deployment handover.

The editable detailed graph and ordinary commands have a separate 2 MiB bounded envelope; portable files and import-only command envelopes are bounded independently at 8 MiB so full retained calculation exports fit. Discovery's 65,536-byte contract and Screen Systems' 262,144-byte contract stay unchanged. Initial scope limits must accommodate the specified 100-area / 1,000-valve case. Proposed performance targets are <=2 s for warm native validation/calculation of that fixture, <=5 s for an isolated local save/read, and a paged valve register with <=50 rendered rows. These are review targets, not measured passes; hardware/runtime and actual results belong in the handover.

The first supported process remains one sequential shared delivery circuit. Neutral context capture is not a validated recirculation, ebb-and-flow or sector-specific process model. Known measured valve flow can support a flow result without population; it does not supply an allocation split, crop demand or fresh-water balance. GroScales with Compass remains in conflict with Dean's working scoping requirement pending exact manufacturer evidence.

## Authority and review

Current estimating read/edit, record ownership, workspace/company/source scope and exact historical source checks apply at service and HTTP boundaries. No capability is granted by a production-context label. Authenticated recording of a review is distinct from engineering approval or supplier confirmation. Missing review policy must be represented as not configured, never bypassed with a generic approval dropdown.

No merge, hosted migration, deployment, tester change, business transaction or customer/supplier communication is authorised. The PR remains draft while implementation or required checks are incomplete.
