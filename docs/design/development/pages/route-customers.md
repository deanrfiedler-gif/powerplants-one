# Customer register — design reference

Stable entry: `route:/customers`. Owner: Dean Fiedler. Status: **Draft for visual review**.
Source baseline: `ccc2251bbba9df266cac9027ddaa9418ab9abc1d`. Application destination: `/customers`.
This is an editable working specification. Existing accepted page baselines take precedence over these proposed common-layout rules. A blank review record is not approval.

## Current CS-01 implementation — 19 October 2026

[Accepted D1–D7 / Q1–Q4](../../../decisions/organisations-figma-design.md) and [implementation/adaptations](../../../decisions/organisations-figma-implementation.md) govern the current native build. Earlier proposal sections below remain provenance, not the current target. No issued reference or parent requirement ID changes.

Register: authorised one-snapshot rows/counts/owners, signed pagination, Status/owner/search/views in the URL, shared grid on desktop and rows on phones, snapshot and legacy saved-view commands. Open service is Unknown because no combined closure read is established. Organisation row selection never enters the URL. Numeric site/area links retain the exact organisation handover.

Load contract: the register reads `/api/v1/customers/register`; the declared-load sampler observes that exact endpoint. Counts and the earliest permitted follow-up are aggregated within the same authorised population, retaining restricted/null distinctions and due-date/ID ordering. The 1,000-organisation regression retains exact counts, 25-row pages and signed continuation under the unchanged database statement limit. This is functional/load evidence, not visual acceptance.

Record: shared identity/source/facts layout, seven URL-retained tabs, type and status filters, exact source handovers and sticky phone follow-up. Current site roles are separate from historical relationships. Source limitations, unavailable/partial/denied states and finance restrictions stay explicit. Correct details uses only the existing display-name revision; stale and uncertain writes keep the original operation.

Create: Organisation, Owner and source, Notes, and Check before creating; actual company/owner selectors and duplicate-name read, optional legal name/sector/notes using the existing create command. Notes keep Internal visibility. A Lead selection returns for explicit LC-12 review/save. Other shared-create variants retain their workflows.

Desktop checks: 1440 × 900/1234, 1280 × 900 and 1024 × 900. Phone: 390 × 844 and 320 × 844. Exact source captures 01–10 are listed in [r01](../../../reference/ui/customers/organisations-design-r01/README.md). Additional snapshot, denied, correction and form-recovery states use established shared patterns; no additional accepted image exists for them. [Host state recipes](../organisations-native-fixtures.json) and [native evidence](../../../testing/evidence/organisations-native-r01/README.md) retain the verification limits.

Guides remain Draft. Source presence, local proof, visual review, baseline acceptance and deployment remain separate.

## Purpose and task

Find a permitted canonical organisation, confirm its identity and open that exact Customer 360 workspace. Search, filters and sort survive a record return through the URL. The signed page trail and scroll position are transient and restart on return; selection is not persisted. The 18 October accepted design supersedes the earlier proposal; native owner review remains pending.

1. Search for an existing organisation before creating another
2. Confirm contacts and sites belong to the correct organisation
3. Follow linked records to review relationship history

## Desktop

Accepted design: the [Organisations design decision](../../../decisions/organisations-figma-design.md) of 18 October 2026, with captures 01 and 06 in [design r01](../../../reference/ui/customers/organisations-design-r01/README.md) (Figma `1443:2652`, tablet `1443:3145`). The register is a grid (D1): name, status, relationship owner, sites, open deals, open service and next follow-up, then sector, areas and reference. The side menu lists People and Sites, then All organisations, Prospects, Possible duplicates, Without a current site and Inactive (D2). The native implementation is now tracked in the current section above.

Use the application shell for navigation, search, identity and the existing information icon. Keep the page title, selected record/scope and primary action visible. Use a register/worklist for multiple records and a record/evidence workspace for an individual record. Match the linked page-specific reference where one exists; retain its accepted geometry.

At 1440 × 960 and 1024 × 768, inspect the complete shell and stylesheet order. Let long titles and unknown values wrap. Keep one owner for content scrolling. Record the actual dimensions and any approved adaptation here after paired source/application review.

## Mobile

Accepted design: captures 07 and 10 in [design r01](../../../reference/ui/customers/organisations-design-r01/README.md): the organisations list and the loading, no-matches and could-not-load states.

At 390 × 844 and 320 CSS px, retain the same task and record context. Stack related fields and use labelled cards for dense worklists. Keep primary actions, validation and the close control reachable. Inputs use readable 16 px text; touch controls use the shared minimum target. Do not hide a required decision or critical state solely to fit the screen.

The exact mobile composition has not been visually accepted for this entry. Retain mobile-specific evidence here when reviewed; a desktop image is not mobile evidence.

## Shared components and states

Use the global Roboto/Verdana typography and semantic tokens. Reuse the shared Button component for new controls; preserve documented existing page-specific exceptions until deliberately migrated. Use consistent primary/secondary/quiet/danger meanings. Include hover, visible focus, disabled and loading states.

Review loading, empty, filtered-empty, read-only/denied, missing context, validation error, stale revision, saving, uncertain result and success where the workflow supports them. Status must include words, not colour alone. Preserve a draft when opening guidance or inspecting a reference.

## Visual references

- [PPO-Customer-360-Workspace-r01.html](../../../reference/ui/customers/PPO-Customer-360-Workspace-r01.html)

## Behaviour, handovers and verification

Accepted Figma design: [Organisations design r01 captures](../../../reference/ui/customers/organisations-design-r01/README.md) and its [decision](../../../decisions/organisations-figma-design.md). Desktop register states and hover are not drawn.

The draft User Guide `guide.page.customers` carries prerequisites, tasks, outcomes and recovery. Review that article against the running release before publication. Keep source presence, visual review, functional testing, owner acceptance and deployment separate.

Acceptance evidence is pending. Capture matching original-reference and application views, then verify keyboard order, focus return, 200% zoom, wrapping, scroll ownership, phone states and the relevant business journey. Do not replace a comparison image simply to make a test pass.

## Bounded read performance

The organisation directory calculates relationship counts after selecting a page for text/reference/status/owner sorts. Numeric count sorts still use counts across the complete permitted population. Search, total rows, permissions, page order and visible counts retain their existing meaning. The focused retained-fixture comparison is in `scripts/quality-directory-proof.ts` and `scripts/quality-customer-browser-proof.ts`; see `docs/testing/evidence/product-quality-next/README.md` for measured results and limits. This query correction grants no visual or production acceptance.

## Directory link loading

The PT-27 candidate imports CrmDirectory and its existing customer stylesheet directly from this route, avoiding the initial ContextList entry that also imports site and facility screens. CS-01/CS-02 remain Register/worklist. The shared session/shell, scoped directory data, desktop table, mobile cards, guide tasks and outgoing record contract stay in place. The component catalogue binds the cold-start fixture, original ten-browser comparison and actual receiving navigation. Source presence does not establish speed or visual acceptance; review the compiled manifest, stylesheet order, 1440 px desktop and 390 px phone captures, plus the existing 320 px contract. No new accepted image is available.

Historical PT-27 directory consumer: `CrmDirectory`: CS-01/CS-02 Register/worklist with the existing desktop table and phone cards. Its record names, affiliation/count links, New and local context sections load destinations on activation. Shared shell and Contacts hub view links retain their separate behaviour. Exact hrefs, department context, permission checks and unsaved-work handling are unchanged. See [component contract](../components/crm-directory.md) and `tests/browser/directory-navigation.spec.ts`; source presence and automated proof do not grant visual or device acceptance.

## Shell destination loading — PT-27

ProductNavigation retains the original main prefetch policy on desktop and phone. Both experimental reductions are withdrawn after the retained trials failed to establish a repeatable improvement. The incoming Customers page retains its normal session, current-company checks, directory and saved-view reads; outgoing links retain their exact URLs, permissions, dirty-state guard and Back behaviour. The existing directory record-link activation policy remains separate. The shell host fixture captures prefetch observations without treating a lower request count as performance acceptance.

Desktop keyboard/pointer and phone touch fixtures are in `tests/browser/shell-loading.spec.ts`, `directory-navigation.spec.ts` and `navigation-safety.spec.ts`. The [loading evidence](../../../testing/evidence/pt27-loading/README.md) records source-specific timing and receiving outcomes. Geometry, fonts, labels, icons and accepted reference bytes are unchanged. No new mockup image is needed for this transport-only change; actual captures and existing references remain separate from owner/device/visual acceptance. Existing stale reviews are preserved.

PT-27 refined execution: [source-bound timing and captures](../../../testing/evidence/pt27-loading/direct-directory-refined/README.md) pass all 320 directory loads and 80 actual record openings. Initial script bytes fall 6.91%; cold targets and visual/owner/device review remain open. This evidence changes no accepted reference or review fingerprint.

## Figma register proposal — 14 October 2026

r20 page type: **Register / worklist**; receiving Customer 360: **Record detail / Overview dashboard**. The [r03 manifest](../../../reference/ui/customers/customer-360-figma-r03/README.md) supplies exact nodes, 1440 × 900 desktop and 390 × 844 phone captures and hashes. Issued HTML/report and previous captures remain unchanged.

Desktop: 240 px navy primary rail, 240 px saved-view menu, 64 px global header and 960 px content region. Use 24 px content gutters and the shared PPO Roboto, colours, buttons and tags. Keep Customers and its population visible; four compact cards show bounded Customers, Sites, visible Open follow-ups and Due today. The 912 px table shows Customer/reference, Relationship owner, Primary contact, Sites and Next follow-up. Whole-row activation opens the canonical customer. Counts, search results and follow-up timing remain explicit. No lifecycle status is inferred from this fixture.

Phone: shared 64 px header and bottom bar, 16 px gutters, a 44 px search target with 16 px input text, a Due today control and two 358 px customer cards. Preserve name/reference, owner, primary contact, site count and next follow-up. Each card is a single exact-customer target. The detail keeps a 44 px Back to customers control above the customer identity and its single scrolling body. No 320 px Figma capture is supplied; that adaptation remains unverified.

Reused components: Brand / Logo; Shell / Top bar and Phone header; v2 Rail item, Menu item and Menu heading; phone tab items; Button, Tag, Icon and existing PPO variables/text styles. Table rows and phone cards are page-local compositions, not newly adopted shared components. The crm-directory catalogue host and application-shell binding retain their native implementations.

Prototype fixtures: all customers, desktop Name descending, preset Willowbank search and Follow-up due today. All rows/cards store the originating register frame, then navigate to the selected canonical customer. Back/Change customer and the Customers rail/breadcrumb use a conditional return with scroll reset disabled, including after Willowbank view changes. The source provides two customers; larger populations, arbitrary combined filters, empty/loading/failure/denied states, pagination and keyboard/device behaviour remain future implementation/review work. Search is a fixed Figma example. Existing permission boundaries remain; no finance values are exposed in the register.

Incoming: permitted organisation directory and the exact scenario fixture. Outgoing: canonical Customer 360 and subsequent owned source records. Native follow-up/ERP actions are outside the register flow. Agent visual/structural inspection is recorded in the manifest; paired native comparison, named Figma version and owner acceptance remain pending. The Draft guide labels its prototype example separately from running-release tasks.

## Shared table treatment — 14 October 2026

The [r04 table-alignment manifest](../../../reference/ui/customers/customer-360-figma-r04/README.md) replaces the r03 desktop-register image as the current proposal. Reuse the accepted Leads Grid / Header cell (74:9 / 74:11): white 40 px header, 14/20 Roboto Medium, square edges and thin row/column dividers. Customer rows are 64 px with 12 px horizontal insets; columns are 276 / 164 / 148 / 60 / 220 / 44 px within the 912 px table. Whole-row actions and Name sorting are retained. The phone cards and profile-return contract are unchanged. Hover/selection behaviour remains native review work; this drawing does not invent bulk-selection actions.
