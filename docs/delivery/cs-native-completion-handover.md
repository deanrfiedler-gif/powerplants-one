# Customers, contacts and sites — native completion

<!-- versioning: git; committed history is authoritative -->

**Owner:** Dean Fiedler. **State:** Native implementation and synthetic verification delivered for PR review; owner acceptance and deployment separate. **Date:** 23 September 2026.

## Receiving checkpoint

GitHub identity `deanrfiedler-gif` and repository ADMIN access verified. Fetched all remotes with pruning. Source `origin/main` is `743d58f2e3246eb16da8b0027f868b71d1d7ffd2`, tree `f74a1bc9ad90380b31f741512385db1365e52542`. Dedicated branch `feat/cs-customer-location-completion` starts there. The original checkout's uncommitted Facilities page is untouched.

Compared with the supplied preparation audit (`c0f4550`), PR #283 has merged as `743d58f`: maintain `docs/design/development/` and use its page guides. PR #284 remains OPEN at `0bb5ede9`, with failing checks at the checkpoint. It is the only open PR. Its published file list reserves migration 0043 and ADR-0041 and owns notifications, shared search, saved views, review coordination and related shell/My Work changes. No unmerged implementation is copied or cherry-picked. Recheck before shared integration or migration allocation and before publication. Existing main ends at migration 0042.

The attached build plan is supporting evidence. The current user request authorises native implementation; older design-only gates do not override it. Issued references remain unchanged. Parents CRM-01/04/06/08, SVC-06, DOC-01/02 and DAT-01–03 retain their scope.

## Focused receiving matrix

| Scope / register requirement | Design evidence | Existing native route and service | Database / permission | Delivered behaviour | Missing / receiving treatment | Proof |
|---|---|---|---|---|---|---|
| CS-01 Customer register / 360 | Customer 360 r01; `customer-360-workspace-design.md` | `/customers`, `/customers/new`, `/customers/[id]`; CrmDirectory, ContextDetail, customerContext | organisations, relationships, site_parties, ERP mappings; shared.read plus each source-domain read | Canonical directory, details/sites/timeline, source context | Eight restorable projection views; source-specific unavailable/restricted/completeness; source-owned commands and separate currencies | Shared/CRM/Finance regression plus projection permission and reconciliation tests |
| CS-02 Contact directory/detail | Contacts & Stakeholders r01; receiving plan | `/contacts?view=people|organisations`, `/people`, `/people/[id]`; CrmDirectory, personContext | people, person_company_contexts, relationships; shared.read/create/edit | Identity, channels, free-text preference, affiliations, directory views | Safe versioned maintenance, active state, end affiliation, primary contact; reliance and correction history; no consent inference | Contact command concurrency/replay, scope, HTTP and browser journeys |
| CS-03 Stakeholders | Same CS-02 package / CS-03 register | No dedicated route; canonical relationship queries reusable | relationships, sites.primary_contact_id, site_parties; company/site-scoped shared.read | Source relationships only | Native organisation relationship view; current/historic affiliations, site parties, gaps and source-owned reliance; recorded role is not purchasing authority | Restricted versus empty, validity, exact IDs and source permissions |
| CS-04 Site workspace | Customers/Sites r03, maps r03 | `/sites`, `/sites/[id]`; ContextDetail, siteContext/siteHistory | sites, site_parties, history_records, assets; shared.read/edit/history.record | Address/timezone/access/biosecurity, contact, parties, equipment/history and Facility register | Refine native context/navigation, safe map handoff, readiness/survey entries; preserve all existing commands | Shared and Facilities database/HTTP/browser regression |
| CS-05 Facilities / growing areas | ADR-0037; CS-05 native handover | `/facilities`, `/facilities/new`, `/facilities/[id]`, `/facilities/[id]/edit`; shared/facilities | Canonical facilities, facility_sources, asset_served_facilities; migration 0041; shared.read/create/edit | Rich durable forms, hierarchy, sources, pin review, service memberships | Preserve; only needed navigation/guide integrations. Installed location remains distinct from served areas; Estimating snapshots immutable | Existing facilities unit/database/HTTP/browser proof |
| CS-06 Access/readiness | Site Access r01 six views | Site rudimentary access notes only | No durable readiness aggregate on main; inspect live schema before additive model | Basic access/biosecurity context | Exact site/facility/activity/person/visit evidence; revisioned requirements, reviewed evidence, seasonal work windows, retained preparations/recheck/acknowledgement without work authority | Exact scope, expiry, seasons, stale sources and snapshot tests |
| CS-07 Account development | CS-07 register; CRM PAR-07 | No workflow; `/customers/[id]/account` is Finance and retained | Organisation context and Activity available | No account plan master | Bounded `/customers/[id]/development`; free-text objectives/optional context, owners, intended visits and retained plan revisions; canonical Activity follow-up; no automatic booking or forecast | Revision/scope, unknown context, unchanged appointments/opportunities and Activity identity |
| CS-08 Survey/as-found | Site Survey r01; retained model evidence | No native workflow | Canonical site/facility/asset and private evidence abstractions available | Standalone design only | Durable scope, typed observations, original photos, owned gaps, exact submission/review/revision and reviewed-snapshot handover | Cross-site, units/unknowns, bytes/hash, correction successors, stale lifecycle and handover |

## Integration and implementation decisions

- Existing Next.js/React/TypeScript, PostgreSQL plain SQL, `sharedOperation`, current permissions, API envelopes and native controls remain the stack; no new dependency.
- Person corrections use `shared.edit` in **every** existing company context, matching creation and receipt authority. Site-only visibility does not grant company-wide Person maintenance. Affiliation changes version the Organisation. Source read permissions govern reliance; denied collections expose no hidden counts.
- CS-03 reads canonical records. It adds no stakeholder, designation, authority or role-taxonomy master. Interaction history remains explicitly derived while Activity links do not support Person.
- CS-05 is retained, not rebuilt. No business integration, live source data, external communication, deployment or owner acceptance is claimed.

## Delivered native routes and source ownership

| Scope | Native receiving surface | Owning contract |
|---|---|---|
| CS-01 | `/customers`, `/customers/new`, `/customers/[id]?view=overview` (also deals, orders, service, projects, sites, accounts, activity) | Canonical Organisation; permission-filtered source projections and exact links; no mixed-currency totals |
| CS-02 | `/contacts?view=people`, `/people`, `/people/[id]` | Canonical Person correction, active state, channels/preferences, affiliations, reliance and audit |
| CS-03 | `/customers/[id]/stakeholders` | Canonical affiliations, Site parties and contact gaps; no separate stakeholder master or inferred customer authority |
| CS-04 | `/sites`, `/sites/[id]` | Canonical Site and exact primary contact; address-only external map handoff; existing equipment/history and embedded Facility register retained |
| CS-05 | `/facilities`, `/facilities/new`, `/facilities/[id]`, `/facilities/[id]/edit` | Existing migration 0041, services and native forms retained unchanged |
| CS-06 | `/sites/[id]/readiness` | Six views; requirements, individually applicable evidence, work windows, exact preparation, acknowledgement and retained review/history |
| CS-07 | `/customers/[id]/development` | Account context, objectives, proposed visits, canonical Activity next actions, retained revisions/reviews; Finance `/account` unchanged |
| CS-08 | `/surveys?site_id=[id]`, `/surveys/[id]` | Scope, typed observations, private original PNG evidence, owned gaps, controlled submission/return/review and exact reviewed handover |

All record views reuse the current native shell, labelled fields, RecordTabs and original-operation recovery. CS tabs are URL-restorable. Proposed native layouts are registered in `ui-baselines.json` and `module-workspaces.ts`; this is receiving implementation, not retrospective owner approval of standalone HTML geometry. Page Guides cover purpose, tasks, states, boundaries, error recovery and the retained source designs.

## Post-#284 reconciliation

PR #284 merged at `25170bf83008727f005e36b5603841a7b9359027` on 23 September 2026 with every reported required check successful. The CS work was safely stashed, the dedicated branch fast-forwarded to merged main, and both contributions reconciled. No unmerged SH commit was copied. The resulting source tree is `e8b83e55744efdd13a5cead826d9b221d11bac78`.

SH owns shared search/previews, notifications, personal preferences/views, review coordination and shell controls. CS adds adapters to that implementation: canonical Customer/Contact/Site/Facility search stays intact; three new CS record types use the shared search registry; survey filters use the existing personal saved-view store; submitted/returned survey reviews project into SH and return to the exact CS review route. Owned CS follow-up uses canonical Activities, so its events appear through the existing Activity notification mechanism. There is no separate task, saved-view, global search or inbox store. No new notification subscription or unapproved external message is introduced. Readiness evidence review remains in CS; no assignment policy for readiness reviewers is fabricated.

Migration 0043 and all SH guide changes are preserved. CS uses 0044. Exact registry assertions now include both versions; hosted upgrade arithmetic includes both additions. Neither migration number was reused.

After PR #285 passed every check and merged externally, native reconciliation `2165546` incorporated main `4c8fd6dba83794f6c64aee6859cadb913401fd64`, tree `b6bfad22214ab0ce13216011242cea3b77730beb`, with no implementation changes or conflicts. Native head `7fd2a25` subsequently passed all six required checks, including 325 compiled desktop/mobile browser cases (60 intentional skips).

The final refresh found PR #286 newly merged at main `91512668e969b545c8e99280b96d9d48d719a729`, tree `3d104bbfa85fb2991271b770937209dd033c1e8d`. It had remained isolated while open; no unfinished code was copied. The CS reconciliation preserves its ApplicationFrame, component preview isolation, extracted planner controls, all incoming guides and catalogue maintenance instructions. STATUS keeps both outcomes. SH keyboard assurance keeps the CS session-ready condition and the merged identity/responsive-control/focus assertions. The 17 CS guides remain intact alongside the incoming catalogue guides; the combined register has 273 entries and 119 routes. Actual CS control consumers are bound into the existing component catalogue with explicit pending alignment, and the real RecordTabs example gains an eight-label Customer 360 fixture. This adds no generic runtime control or business command. The registry remains through migration 0044, with no new grants, migration, saved-view or notification store. Reconciled checks are recorded in the evidence index.

## Data, API and permissions

[ADR-0042](../decisions/ADR-0042-customer-location-workflows.md) records the additive data model and alternatives. Migration 0044 adds `site_readiness`, `site_surveys`, `customer_plans`, immutable `cs_record_revisions`, `cs_snapshots`, `cs_record_events`, `cs_survey_photos` and `cs_photo_captions`. Root context cannot move; current version must advance exactly once; retained evidence/revisions cannot be updated or deleted. The identity-target constraint is flushed before widening the business identity registry and deferred afterwards. Original bytes/hash remain in the existing private document adapter; caption successors never rewrite bytes.

Existing `shared.read/create/edit` scopes apply on the server. Canonical dependencies must be currently permitted and in the exact company/Site; Person corrections require all company contexts. Review requires a different editor from the submitter/capturer, explicitly a synthetic receiving safeguard, not an adopted operational approval threshold. Handover receiver eligibility uses existing `estimating.edit` / `engineering.edit`. Seed 44 adds only the dedicated fictional `cs-reviewer` user and four existing company-A duties; no existing user's grants change and no new Capability is added.

Read APIs: `GET /api/v1/customers/[id]/workspace`, `/stakeholders`, `GET /api/v1/people/[id]/workspace`, and Site primary-contact options. Versioned contact commands: `POST /api/v1/people/[id]/revise`, `POST /api/v1/customers/[id]/affiliations/end`, `POST /api/v1/sites/[id]/primary-contact`.

CS API: `GET/POST /api/v1/cs/[kind]`, `GET /options?context_id=[uuid]`, `GET /[id]`, `POST /[id]/save`, `POST /[id]/actions`; kind is the closed set `Readiness`, `Survey`, `AccountPlan`. Commands use schema 1, original operation UUID, reason and expected version. Photo capture/caption commands sit under `Survey/[id]/photos`; exact private PNG reads are permission-checked and no-store. Changed operation reuse is refused and original receipts can be recovered through the established operation endpoint. Source changes invalidate current preparation/submission checks while preserving retained history.

## Bounded decisions and unresolved definitions

- MYOB sales orders and a general SharePoint library have no connected verified source service: Customer 360 says Not configured. It never substitutes an empty count or fabricated ERP response. Source lists declare their bounded windows and own permissions; no cross-currency or alternative-estimate total is invented.
- Contacts have recorded free-text roles and preference, without consent, designation taxonomy or purchasing authority. Historic affiliations remain available. Person interaction history is derived from permitted linked source records because canonical Activity does not link to Person.
- CS-06 captures exact requirements and evidence; no Facility type/parent confers readiness. Unknown work windows block a positive preparation conclusion. Captured evidence is not reviewed evidence. Acknowledgement grants no work authority, booking, reservation, pack issue or dispatch clearance.
- CS-07 leaves territory, sector, cadence and account health definitions optional/unresolved. Plans do not create Appointments, opportunities, forecasts or tasks. CR-05 retains aftercare-event follow-up ownership.
- CS-08 supports private PNG originals up to 4 MiB, explicitly refuses unsupported formats, and retains immutable review/handover snapshots. Measurements need units; Unknown is null. Significant gaps require an open owned Activity with a due date before submission. Review grants no design, capacity, safety or work certification. Handover records exact source and receiving owner without rewriting accepted Estimate/Engineering bases.
- Content is deliberately bounded (40 rows per collection, 50 exact reference IDs, 256 KiB document). Read histories show bounded permitted records. These are explicit prototype limits, not production capacity promises.

## Verification and publication

[Evidence index](../testing/evidence/cs-native-completion/README.md) records exact commands, results, baseline comparisons and inspected captures. Delivery is code review and synthetic assurance. Owner/device acceptance, unresolved operational definitions, live integrations and deployment remain separate. Branch and final commit/PR identifiers are recorded with the publication evidence; no PR is merged by this task.

Review order: [server contracts PR #285](https://github.com/deanrfiedler-gif/powerplants-one/pull/285), head `51b4787`, passed all 20 reported checks and merged externally at `4c8fd6d` on 23 September 2026. [Native PR #287](https://github.com/deanrfiedler-gif/powerplants-one/pull/287), branch `feat/cs-customer-location-completion`, now targets `main`. Its reviewable outcomes are `f682204` (Customer/Contact/Stakeholder/Site), `36035a309db04000c703386e5edf5b3815de2daa` (durable receiving workflows and proof), `94e7d05` (guides/evidence) and `d662047` (multi-Facility readiness refusal and retained browser-contract reconciliation), followed by the main merge and this evidence successor. Native implementation remains unmerged at this checkpoint; remote checks are visible on its exact head. This task did not perform the contract merge or any deployment.
