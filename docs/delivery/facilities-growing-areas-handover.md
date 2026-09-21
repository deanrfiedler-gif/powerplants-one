# CS-05 Facilities & growing areas — native handover

**State:** Native implementation and bounded local verification complete; open as [draft PR #274](https://github.com/deanrfiedler-gif/powerplants-one/pull/274). Owner acceptance and deployment remain separate. **Branch:** `feat/cs05-facilities-growing-areas`. **Code candidate:** `5f6e683e7c809e1850e932ed684b9dd3725d13d0`; code tree `6dde740a7d3a017fff68ce7644893e02081e92f5`. **Source:** main `af3f045`. Dean authorised execution of the supplied r02 documents. No merge, deployment or operational writes.

## Delivery checkpoint — 22 September 2026

WP0–WP4 implemented and verified through the evidence listed below. The pre-existing ES-08 branch `ccdd192` remains untouched. Migration **0041** leaves 0039 for ES-02 #272 and 0040 for ES-08 #273 reconciliation. Existing migrations/central identity rows are unchanged; no new capability, user or grant is added. The additive fixtures register 16 new canonical identities; no FAC numbering/backfill is introduced.

Three reviewable code commits separate canonical persistence (`7e981df`), native workflows (`7545e5c`), and final recovery/proof work (`5f6e683`). Documentation/evidence follows in a separate commit. The [candidate manifest](../testing/evidence/cs05-native-r01/candidate-manifest.json) records exact source paths/hashes and build identity; the [evidence README](../testing/evidence/cs05-native-r01/README.md) records commands, failures and outcomes. The [80-case matrix](../testing/evidence/cs05-native-r01/acceptance-matrix.md) identifies executed layers and remaining limits.

Local evidence includes ten Facility DB groups; legacy/rich HTTP; 14 Facility browser project cases across completed runs; 32 compiled CRM/E1/E2 browser cases; real process/database restart; 5,000-row query measurements; and non-empty issued commissioning hash preservation. Broad DB regression first returned 218/229; all 11 failures are resolved by corrected fixture expectations or focused passing reruns, with setup timeouts compared against unchanged main. Full unit run returned 189/193; the four Windows/path failures reproduce on unchanged main and are retained as environment limits. Lint, typecheck, build, foundation and naming checks pass. This is not a claim that an unchanged 229-case broad run was repeated green or that all 80 cases have every manual layer complete.

Next action: review [draft PR #274](https://github.com/deanrfiedler-gif/powerplants-one/pull/274), native adaptations, case limits and captures. Owner design/business acceptance, screen-reader and physical-device checks, external map handoff and provider integration remain outstanding. No technical or commercial release follows from a Facility observation or measured value.

## Source and reuse map

The two supplied r02 contracts have been read, including §18. Business authority is FAC-D01–03 in `docs/decisions/facility-field-proposal.md`; trace is CRM-04/08, CA-05/06/10/13 and AT-02/23/25 components. Master IDs are unchanged.

| Source/component | Inspected role |
|---|---|
| `docs/decisions/customers-sites-workspace-design.md`, `customers-sites-workspace-audit-r02.md`, `customers-sites-maps-r03.md` | r03/r02 design and audit; source inspection, not owner rendered acceptance |
| `docs/reference/ui/customers/PPO-Customers-Sites-and-Growing-Areas-Workspace-r03.html` | Issued standalone reference; retained unchanged |
| `docs/reference/ui/module-page-register/PPO-HTML-Page-Coverage-Audit-r04.md` | CS-05 retained scope |
| `src/components/product-navigation.tsx`, `header-content.tsx`, `shell-controls.tsx`, `src/shell/module-workspaces.ts`, `secondary-menu.tsx`, `src/components/facility-shell.tsx`, `src/app/styles/my-work.css` | Existing shell, header, rail and secondary menu |
| `src/components/record-ui.tsx` | RecordTabs/RecordPanel, LookupField and unsaved navigation guard |
| `src/components/business-ui.tsx` | PageHeader, Field/Select, validation/error rendering, API transport and table patterns |
| `src/components/crm-state.ts`, `session-view-boundary.tsx` | Request generation, in-memory original intent and identity unmount |
| `src/components/context-screens.tsx`, `src/app/globals.css` | Site/Customer/Equipment entry points and native theme |
| `src/shared/commands.ts`, `reads.ts`, `receipts.ts`, `http.ts`, `src/platform/operations.ts` | Compatible legacy contracts, authority-before-receipt and workspace-first lock |
| `src/estimating/discovery-context.ts` | Existing exact Facility ID/name/version receiving snapshot, unchanged |

Page types: Register/worklist; Record detail; Form/guided workflow; Review/comparison. Incoming context is exact permitted Site/Facility/Asset UUID and current version. Outgoing context is the same canonical identity and immutable audit, never permission to work, pricing adoption or technical approval.

## Decisions for this contribution

- **CS05-D01:** Display existing authoritative reference or labelled canonical UUID; no FAC number allocation/backfill.
- **CS05-D02:** Add optional position, measurement provenance and dated context. Other function description follows the same conditional-description rule. Date-only facts are checked in the Site time zone.
- **CS05-D03:** Legacy parent means Grouping. New parent selection explicitly records Grouping or Physically within. No inherited area, service or authority.
- **CS05-D04:** Add/end explicit Asset service memberships, with one Asset version, independent of Facility version. Existing Asset move rejection remains in force.
- **CS05-D05:** Separate rich APIs; strict patch/preview, scoped keyset queries and original receipts. Dedicated validators leave legacy normalisation/hashes unchanged.

## Primitives and boundaries

Facility automatic history uses immutable `audit_events`; `history_records` is Site/Asset narrative history with restricted kinds. Pack, Finance, material and commissioning source services belong to their owners; no generic permitted Facility document lookup exists. CS-05 reported notes have immutable Facility-owned source identities; supported existing-source selection refers to these exact retained sources. Provider documents, Facility work links and visit-readiness relationships remain unsupported unless an exact owning relation is found. Equipment installed location and Estimating scope IDs are supported exact relationships. Engineering free-text `served_areas` is not imported.

Recovery is online memory only. Forced reload/closed tab loses a proposal/original intent; saved exact records and permitted history can be inspected, but the original must not be reconstructed. No browser draft storage or offline queue.

## Implemented boundaries and adaptations

Canonical routes are `/facilities`, `/facilities/new`, `/facilities/:id` and `/facilities/:id/edit`. The shell owns viewport height; the `.facility-host` inside `#ppo-facilities` owns its interior scrolling. The register uses a right-hand inspection dock on wide screens and full records on smaller screens. Site details embed the same filtered register. Native RecordTabs, LookupField, Field/Select, PageHeader, validation, session boundary and original-operation hook are reused. This increment follows CS-05 in the retained page register; no new scope ID is introduced.

The issued r03 composition is adapted to canonical server data: UUID labels replace speculative FAC numbers, reported-note sources replace unsupported provider documents, and unsupported work/document relations are explicitly labelled. The four r20 page types above and r22 controls remain the design basis. Inline comparison is part of the form, with exact before/after values and acknowledgements; it does not introduce a second app shell or another full-height frame. These native adaptations are reviewable, not a new owner-approved visual baseline.

The rich APIs are additive: `facilities/register`, `create-details`, `:id/workspace`, `history`, `equipment`, `sources`, `preview-change`, `revise`, `preview-pin`, `pin` and `pin/remove`; Asset-owned `assets/:id/served-facilities/add` and `:linkId/end`. Legacy GET/list/detail and POST-create contracts remain separate. Preview uses current authority and a workspace transaction without operation/audit/outbox writes. Commands use existing `shared.create` or `shared.edit`, schema version 1, operation UUID, reason and native receipts. Receipts recheck current authority, including edit-only users.

Exact source bindings, field grammar and cursor filters are defined by `src/shared/facilities/definition.ts`, `validation.ts`, `commands.ts` and `reads.ts`. Measurement fields are independent optional values; no area totals, crop inference or pricing is calculated. Current Site/Company authority is the available granularity; separate per-Facility ACLs do not exist. Source rows are immutable version-1 identities with successor links. E2 retains its own exact Facility ID/name/version snapshot and requires a fresh current context for new captures.

## Schema, locking and integration handover

Migration `db/migrations/0041-facilities-growing-areas.sql` extends canonical `ppo.facilities` with nullable typed structure/use/context/measurement/position and optional sourced pin fields. It adds immutable `ppo.facility_sources` and retained `ppo.asset_served_facilities` memberships. Direct SQL guards enforce the same Site, applicability, precision, parent graph and active relationship boundaries. Date-only observations use the owning Site time zone. The [service dictionary](../contracts/service-data-dictionary.md) contains the physical fields and provenance contracts; [ADR-0037](../decisions/ADR-0037-cs05-facilities-native.md) records technology/alternatives.

Commands reuse `sharedOperation`: current authority, actor/original-operation lock and existing workspace lock precede canonical target/version reads and exact preview dependency recomputation. Facility identity/details, source successors, audit, receipt and `SharedRecordUpdated` outbox effect commit together. Service membership changes lock/version the Asset, preserving Facility content versions and installation. The review dependency hash includes all equipment associations even when only the first 50 are displayed. Read cursors bind the actor/workspace/query to a process-local signature; expired cursors reset to the first page with the same filters.

E2 continues to own its captured Facility ID/name/version and explicit adoption. New Facility metadata never reprices an estimate. Engineering commissioning retains its own free-text served-area contract; CS-05 does not infer canonical membership from it. Actual issued release rows and manifests are unchanged in the recorded proof. MYOB remains intended ERP authority, SharePoint owns business documents, and native CAD tools own authoring.

## Visual review and residual limits

The agent inspected desktop register/inspection dock, phone table and horizontally exposed actions, exact clearing comparison, pin review, related equipment and accepted service ending, plus the main-to-candidate Site captures. The browser also compares independently rendered r22 controls and captures r03. Captures are observations of this synthetic candidate; no owner baseline is adopted. The canonical Facility workspace uses the existing secondary menu and one scroller. The Site's surrounding native tabs retain their existing treatment; Facility inner tabs use the documented scoped treatment.

Phone evidence is Chrome emulation, including 320px, not a physical phone. Keyboard labels/navigation/Escape/focus and deliberate dirty discard were executed; a screen reader was not. Finer per-Facility ACLs and Facility-specific provider work/document relationships do not exist. UI drafts and original operation intent are memory-only; forced reload discards unsaved state. Map launch on physical devices, individual delayed picker/actor combinations and the browser search-to-result timing budget remain explicitly partial in the case matrix. Local HTTP measurements are not production service levels.
