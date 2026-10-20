# Site record

Stable entry: `route:/sites/[id]`. Owner visual review **pending**. Page type: r20 register/worklist and record detail.

## Authority and references

Scope **CS-04**. Owner: Dean Fiedler. Design authority: [Sites decision](../../../decisions/sites-figma-design.md), PPO - Design, named version **Sites — accepted**. Page `1375:2901`; desktop register `1375:2937`, overview `1375:3183`, equipment `1375:3312`; tablet `1375:3449`; phone list `1375:328008`, overview 390 `1375:3678`, overview 320 `1379:2365`; loading `1375:328046`, no matches `1375:328103`, error `1375:328145`; notes `1380:2175`; grid header `1375:3745`, grid rows `1375:3759`.

[Eight retained icon-free captures](../../../reference/ui/sites/sites-design-r01/README.md) remain unchanged. The live frames and notes were read during preflight. The later [phone header amendment](../../../decisions/phone-header-amendment.md) supersedes the older phone headers and duplicate toolbar rows. The [short-reference decision](../../../decisions/site-reference-convention.md) resolves Q3. No private design link or licensed artwork is retained.

## Desktop

The register is a flush grid with one secondary menu: Organisations, People; All sites, Readiness to confirm, Biosecurity unknown, Address to review; Facilities, Surveys and Equipment. More remains the shared-record entry in the existing rail. The compact toolbar carries customer/readiness filters, search/filter, refresh, observation time and options. Columns are Site, Customer, Location, Site readiness, Biosecurity, Areas, Equipment, Next visit, Primary contact and Time zone. Checkbox and action columns stay pinned; overflow belongs to the grid. Row selection has no business effect. Settings changes visible columns. Sorting and pagination stay within the permitted population.

The record has a header, Before the next visit strip, ruled Site/access/next-visit facts, and Overview, Facilities & areas, Equipment, Work and visits and History tabs. Overview leads with readiness and its CS-06 handover, followed by permitted work and the maps note. Equipment separates Installed in and Serves with full-width installation group bands, identity in words and a link to the site-filtered register. The existing FacilityRegister and primary-contact editor retain their own controls and recovery. More exposes current/historical parties, surveys, owned follow-up and technical context.

Check the full application at 1440 × 900 and 1024 × 900. Reuse shared tokens, Button/ButtonLink, RegisterTable/RegisterSortHeader/RegisterChip/RegisterFooter, SecondaryMenuFrame, WorklistChoice/Menu/Panel, RecordTabs/RecordPanel, ReadState, ProductIcon, SitePrimaryContact and FacilityRegister. Icons pass through the existing Font Awesome mapping; no artwork is copied.

## Mobile

Check 390 × 844 and 320 × 844. The shared compact 56 px header owns the view/count/search/filter and record navigation. The register removes duplicate phone toolbar rows and uses labelled Site rows with current reference, customer/location, next permitted visit and a textual status. Readiness is first on the record, followed by access and biosecurity, Maps and Call. At 390 px the sticky footer includes Readiness and Service request; at 320 px Readiness is in Site actions. Local table/tab overflow must not widen the page. Touch actions use at least 44 px targets; keyboard focus remains visible.

## Data, permissions and handovers

`src/shared/sites.ts` composes existing sources; all counts/filter options use permitted rows and current party relationships. Appointments require schedule read, work-order visibility and their source ticket/site/customer access. Denied related sources disclose no rows. The same Site search accepts `SYN-SITE-…` and `SYN-PPO-SITE-…`; shared Site reads expose the current and previous references while storage and UUID links stay unchanged. No migration, new grant, dependency or external integration.

P4 customer confirmation is unavailable: neither a booked visit, a Confirmed appointment status, a note nor a source absence establishes customer readiness. Readiness to confirm is a view of upcoming permitted visits and is labelled with that limitation. CS-06 owns the handover. Address/biosecurity presence means recorded, not verified. Maps is an external address handoff, with arrival-point confirmation. Delivery basis remains unverified.

Outgoing: `/sites/[id]/readiness`, `/facilities/[id]`, `/equipment?site_id=…`, `/equipment/[id]`, `/surveys?context_id=…`, exact visit/work-order/follow-up links and `/service/tickets/new?site=…` with **Start service request** (phone **Service request**). Existing editing links and versioned primary-contact commands remain permission controlled. No Conversations action is added.

## States and accessibility

Loading: current results unconfirmed and six skeleton rows. Empty: no matching permitted sites and Clear the search. Failure: no retained rows/counts, Retry loading. Denied: unavailable-with-this-access message without revealing hidden records. Related sources distinguish available, partial, restricted and unavailable; unknown facts stay explicit. Changing filters invalidates the signed cursor. Keyboard sorting, checkbox labels, tab arrows/Home/End, Escape and modal focus return use native/shared controls. The primary-contact editor retains validation, version-conflict and uncertain-save recovery.

This is an online page under the [offline system contract](../systems/offline.md); it introduces no offline storage or queue. A failed current read removes displayed data.

## Adaptations and open questions

- P4 states in the design story are replaced by explicit unavailability and CS-06 links. No readiness calculation or customer confirmation is invented.
- Global search remains cross-application. A labelled local Search and filter control provides Site filtering without changing the shell search contract.
- Every row shows its short Site reference. This adds a second line to desktop rows and phone rows; the grid remains compact and may exceed the drawn 40 px for readable content.
- Shared date formatting retains year and time-zone/offset information. Long dates wrap rather than copying the abbreviated synthetic story dates.
- Equipment grouping uses the recorded installation facility; it does not invent a parent-building relationship. Installed and served links remain distinct.
- Undrawn Facilities, Work and visits, History, details/editing, tablet record and restricted/partial states compose existing controls. Work/History tab totals are omitted because no exact combined source total exists. Record previous/next appears only within a complete returned population; UUID identity replaces an unknown position.
- Dean's owner visual review is pending, including these adaptations, source wording and undrawn views. No new business question is answered by a fixture or documentation check.

## Evidence and delivery

Source presence, design acceptance, owner visual review, functional proof and deployment are separate. Current checks and deviations are recorded in [Sites implementation](../../../delivery/sites-cs04-build.md) and [test evidence](../../../testing/evidence/sites-cs04/README.md). Guides remain Draft and review fingerprints/reviewer/dates remain empty. No deployment, physical-device acceptance or business acceptance is claimed.
