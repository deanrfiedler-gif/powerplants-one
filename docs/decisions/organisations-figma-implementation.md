---
document_id: PPO-CS01-ORGANISATIONS-FIGMA-IMPLEMENTATION
date: 2026-10-19
owner: Dean Fiedler
status: Implementation in progress; native visual review and acceptance pending
versioning: git
---

# Organisations Figma implementation

Dean's 19 October brief authorises this implementation. The [accepted design](organisations-figma-design.md) owns D1-D7 and Q1-Q4; this record links those decisions rather than replacing them. The [inventory](../status/2026-10-19-organisations-figma-build.md) records the wider source audit. Branch owner: this Codex session, [draft PR #604](https://github.com/deanrfiedler-gif/powerplants-one/pull/604).

## Scope and source

CS-01, `/customers`, `/customers/[id]` and organisation creation at `/customers/new`. Preserve CRM-01, CRM-04, CRM-06 and SVC-06, route keys and all other shared-create variants. r20 types: Register/worklist; Record detail with overview; Form. The application shell owns navigation and viewport; the page owns its full-bleed interior.

Sources are the ten [icon-free retained captures](../reference/ui/customers/organisations-design-r01/README.md) and the accepted record's node IDs, including desktop register `1443:2652`, overview `1443:2745`, Sales `1445:381060`, filtered Sales `1449:381169`, create `1445:381483`, tablet `1443:3145`, phones `1443:3223`, `1443:3263`, `1443:3332`, and four state frames `1443:3400`, `1443:3458`, `1443:3501`, `1443:3537`. No live Figma read or write is made. The source record says the proposed named version **Organisations — accepted** is not saved; this implementation does not assert otherwise. Issued reference bytes remain unchanged.

## Gap analysis before application changes

| Design shows | Built page shows today | Data source and whether it exists | Action | Decision ref |
|---|---|---|---|---|
| 1440 register: flush 40 px header/rows, checkbox, settings and row menu | CrmDirectory's separate table and contact-hub navigation | `crm/directory` has permitted rows and older column set | Restyle using shared RegisterTable/SortHeader; keep saved-view commands reachable | D1 |
| Status/relationship-owner filters, full-match count/time and refresh | Status, mine, search, pagination and saved views | Existing directory read/preferences; named owner filter and new views absent | New read dedicated to CS-01, without changing the shared People list contract | D1-D2 |
| All, Prospects, Possible duplicates, Without a current site, Inactive menu | Saved views / mine filter | Current organisations and dated site relationships exist; duplicate signal needs a stated match basis | New read; reuse SecondaryMenuFrame and existing menu controls | D2 |
| Sites, open deals, open service, next follow-up; sector/areas/reference by horizontal scroll | Sites/facilities and deal count; service/follow-up absent | Existing domain predicates and activities; existing directory deal count includes all outcomes | New read using source permissions; missing/restricted values remain words, never false zero | D1, D4 |
| Selection snapshot (required by implementation brief; no CS-01 capture) | Direct record links | Current authorised Customer 360 read exists | Reuse shared panel pattern; preserve register URL and opener focus | Brief section 12; D3 |
| 1440 overview header, source bar, left identity/sites/people, right tabs/open work | PageHeader, equal actions, eight tabs, source-availability list | Customer 360 provides context and source states; contact context exists; readiness/last-author details are incomplete | New shared record composition; reuse authorised reads; omit unsupported author/readiness rather than guess | D3-D5, Q1-Q3 |
| Desktop Sales table, type chips, Status control | Separate Deals/Estimates & quotations and Sales orders tabs | Existing permitted deal/quotation source items are bounded; orders unconfigured | Restyle and preserve source partiality; never total revisions or invent currency/tax values | D5-D6 |
| Quotations selected with Status menu open at 1440 | No such controls | Filter already-authorised items with explicit source status; unknown stays unknown | Reuse WorklistMenu; persist tab/type/status criteria in URL | D6 |
| Create at 1440: Organisation, Owner/source, Notes; check-before-create column | SharedCreateForm has company/name/status/owner and search matches | `createOrganisation` already accepts legal name/sector/notes; permitted company/owner selectors exist | Restyle organisation variant; preserve its command, draft and uncertain-save recovery | D7 |
| Similar-name candidate, Open and Use this record; lead context read-only | Substring matches, existing lead-return resolution flow | Existing customer search and lead resolution; a return preselects an identity and requires saving resolution | New bounded candidate read; retain explicit Lead save boundary and explain it in UI | D7; LC-12 retained authority |
| 1024 register, secondary menu collapsed | Legacy responsive table/cards | Same authorised register data | Restyle interior with container queries; existing shared collapse behaviour | D1-D2 |
| 390 register list | Legacy directory cards | Same authorised row data | Restyle list rows; accessible row and snapshot actions | D1, Q4 |
| 390 overview, contact, four leading tabs, sticky follow-up | Legacy eight-tab workspace and sections | Permitted contacts/sites and source items; primary role must be recorded, never inferred from list order | New shared record composition; contact absence is explicit | D3-D5, Q4 |
| 320 overview | Legacy flowing record | Same sources | Restyle; wrap long content and keep actions inside viewport | Q4 |
| Phone loading | Generic loading message | Request state exists | Restyle with no invented rows/counts | D4; state `1443:3400` |
| Phone no matching organisations | Generic empty list | Successful authorised empty result exists | Restyle with permitted-scope explanation | D1; state `1443:3458` |
| Phone failed list, no counts | Generic read error | Existing error/denial distinction | Restyle; hide rows/counts after failed list read | D4; state `1443:3501` |
| Phone Service unavailable, other sources retained | Per-source Unavailable exists | Customer 360 keeps source states separately | Reuse distinction; never show unavailable service as zero or retain its obsolete rows | D4; state `1443:3537` |
| 1280, 320 list, snapshot/menu sheets, create tablet/phone; undrawn record tabs | Existing app patterns | Existing source reads and commands | Adaptation using shared responsive/keyboard patterns, with explicit evidence limits | Brief sections 7.2-7.6; D5-D7 |

Undrawn states to verify: denied, empty versus filtered-empty, failed refresh, stale rows, long names, unknown dates, partial sources, keyboard selection and Escape/focus return, create validation, dirty leave and uncertain original-operation recovery. CS-01 has no offline write authority; a failed offline read is an error state. No synthetic story name, count, date or identity is copied into runtime code.

## Implementation decision

Planned reuse: existing React/Next and CSS tokens; runtime/fallback icons; `SecondaryMenuFrame`, `RegisterTable`, `RegisterSortHeader`, `WorklistMenu`, `WorklistPanel`, `RecordTabs`/`RecordPanel`, Button/ButtonLink, fields and existing command hooks. Shared record presentation is extracted for later shared-record pages and registered with real fixture states. Figma Components page `1:4` mappings remain the catalogue authority: grid cells map to RegisterTable, View tab to RecordTabs, Button/Tag to the existing controls, record field/header/readiness patterns to the shared record composition. No new technology is selected.

The proposed dedicated CS-01 register and duplicate-candidate reads use existing source visibility and signed pagination. They do not change the older directory endpoint consumed by People or global search. Record source reuse preserves Complete, Partial, Restricted, Unavailable and Not configured. Schema inspection so far finds no reason for a migration, grant or capability. Any later need triggers the brief's explicit stop boundary.

## Handovers and adaptations

Incoming: authorised company/identity, shared-register navigation, exact organisation from a Lead, people/sites/service and global search. Outgoing: existing exact source records, account development, stakeholders, My Work follow-up, Sales create and the Lead's reviewed resolution. Creating or selecting an organisation never creates an ERP debtor account or sends a message.

Keep actual synthetic identities and the shared S6 year/time-zone formatter, even where captures abbreviate dates. Current application shell controls and department navigation are retained. Unavailable last-change author, site readiness, source amounts and record position are omitted or labelled unknown unless an authorised read supplies them. The create screenshot's broad notes-visibility wording is narrowed to actual existing internal-note permission; permissions are not widened. For Lead returns, Use this record preselects the organisation for explicit review/save in the Lead, preserving LC-12 rather than silently linking it. These adaptations remain visible for owner review.

## Verification

In progress. This gap analysis precedes application changes; no completed implementation, parity, device review, independent review, baseline acceptance or deployment is recorded here. Captures will use an unconfigured Kit. Guides stay Draft and review fingerprints remain untouched.
