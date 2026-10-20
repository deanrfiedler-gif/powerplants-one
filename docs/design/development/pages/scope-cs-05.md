# Facilities and growing areas — working design contract

Stable entry: `scope:CS-05`. Scope: **CS-05**. Owner: Dean Fiedler. r20 page type: **Register / record / form / comparison**.

Native source baseline: PR #274, merged as `ab96e2b`; imported register source `ccc2251bbba9df266cac9027ddaa9418ab9abc1d`. ADR-0037 and CS05-D01–D05 retain authority and traceability. No parent requirement IDs, business permissions, migrations or external records are changed.

## Accepted reference

Accepted source: **PPO - Design**, named version **Facilities and growing areas — accepted**. Page `1415:357158`; notes `1415:358266`; index row `1423:376950` under index `630:2`. The live frames and notes were read for this build. Dean accepted D1–D7 and Q1–Q4 in the [decision](../../../decisions/facilities-figma-design.md). This implementation is requested separately by Dean; owner visual review of the running page remains **pending**.

Desktop: register `1415:357195`, snapshot `1416:363644`, hierarchy `1416:365147`, Overview `1415:357445`, Equipment `1416:366300`, correction `1416:366753`, review `1416:367175`, create `1416:367649`. Tablet register `1415:357718`. Phone list `1415:357952`, Overview 390 `1415:357991`, Overview 320 `1416:369291`, review `1416:369765`. States: loading `1415:358128`, no matches `1415:358186`, failure `1415:358229`, conflict `1418:362899`, uncertain `1418:363291`, view only `1418:363685`. Grid parts `1415:358287` and `1415:358302`.

[Seventeen icon-free retained captures](../../../reference/ui/customers/facilities-design-r01/README.md) remain unchanged. No reference image is missing for the listed frames. Sources/History at full size, pin review, service-link dialogs, tablet record and mobile create are not drawn. [Earlier native evidence](../../../testing/evidence/cs05-native-r01/README.md) remains provenance, not the current visual target.

## Desktop

Use All facilities, Growing areas, Non-growing or Details to complete. Filter by Site, Structure or Use; Search and filter holds extra filters. The view counts cover permitted areas, while the toolbar count follows the active filters.

Select a desktop row name for its read-only snapshot, then Open facility. A phone row opens the record directly. Overview, Equipment, Sources and History keep context and its evidence separate.

Use the existing shell rail and breadcrumb, flush Facilities side menu and compact ruled grid; the record removes the secondary menu and uses a 380 px details column. No module container surrounds the workspace. The tablet register collapses the menu and moves Use into Search and filter. Group headings span the entire table. Tokens come from the existing shell/theme; icons use existing Font Awesome Kit mappings with repository fallback drawings. Conversations is outside this change.

## Mobile

Use the shared 56 px compact phone header (the later accepted shell amendment), area rows at 390 px and wrapped record cards at 390/320 px. Record actions replace the global phone navigation bar, so Open site and Correct details remain reachable. The comparison stacks Saved and Proposed values while preserving the acknowledgement. Tablet record and mobile create are responsive adaptations awaiting owner review, not separately accepted drawings.

## Reused components and handovers

Reuse SecondaryMenuFrame, usePhoneHeader, RecordIdentity, RegisterTable/Chip/SortHeader, Button/ButtonLink, ShellIcon/ProductIcon and the mapped My Work refresh Icon, PageHeader, RecordTabs/RecordPanel, Field/SelectField, LookupField, ValidationFields, ReadState/ErrorNotice, useCrmResource/useCrmCommand, SourceField, SitePicker, ParentPicker and CopyId. The page-local FacilityRecordLayout binds these existing controls; see [component contract](../components/facility-workspace.md).

Incoming: Sites CS-04 related menu, site-filtered register, equipment installation links and More. Outgoing: exact site, equipment and facility records, retained source/history, and external maps. Work orders, visits, access and readiness remain on the site (Q4); Estimating keeps its own snapshot. MYOB/SharePoint/CAD authority is unchanged.

## Data, states and recovery

Register reads include parent, basis, installed equipment count and last actor/change; all counts use existing site/workspace visibility. Side-menu counts represent the complete permitted set; filter counts and keyset pages remain separate. Details to complete includes missing/Unknown structure or use, or an unrecorded footprint (Q3). Zero is never substituted. Equipment separates physical installation, current explicit service and ended service; no parent inheritance or totals are inferred.

Loading and failed reads hide old rows/counts. No matches preserves active filters. Pagination discloses loaded coverage. View-only records remove correction. Labelled validation, comparison focus, acknowledgement and dialog Escape/return focus remain available. A conflict retains explicit edits while adopting unrelated newer values; a new comparison requires a new acknowledgement. Uncertain results lock the original and offer History plus original-operation recovery. No durable offline draft or queued mutation is added; follow the [offline contract](../systems/offline.md). Reloading loses the in-tab draft/recovery context.

## Unspecified behaviour and deviations for review

- The accepted create card highlights a closest name, but defines no matching/ranking rule. This build highlights exact names and lists the other permitted site areas; fuzzy ranking remains an open question for Dean.
- Record position and previous/next need a retained query/order contract. No position is fabricated; direct record opens show their path and version. Decide the navigation context before adding these controls.
- Checkboxes select loaded register rows only. No bulk action or configurable columns are invented; the row menu opens the snapshot.
- Sources, History, pin review and service-link commands retain earlier native controls. Additional correction fields are disclosed below Measurements and Growing context. They are not new accepted layouts.
- The synthetic capture fixture is a UI-only composition, not a new database seed. Real register counts/names follow the existing synthetic database; device and source equality remain separate from authorisation.

## Evidence and review

[Build evidence, commands, results and visual differences](../../../testing/evidence/cs05-accepted-build/README.md). Automated source/functional checks are not business acceptance. Owner visual review, physical-device/accessibility review and hosted deployment remain pending; no fingerprint, reviewer or acceptance date has been manufactured.
