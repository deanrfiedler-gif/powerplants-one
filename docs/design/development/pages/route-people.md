# Contact directory — native working reference

Stable entry: `route:/people`. Scope: **CS-02**. Owner: Dean Fiedler.
Source main: `25170bf83008727f005e36b5603841a7b9359027`. Route: `/people`.
Native implementation and adaptations are proposed for owner review; this is not a new accepted visual baseline.

## Purpose and page type

Find a permitted canonical Person or organisation, review its directory summary and open the selected record. Detailed corrections and reliance checks belong to the separate record workspace.

r20 page type: **Register / worklist**. `/people` shows People; the `/contacts` hub switches between People and Organisations. Identity, relationships, reliance and correction history belong to [Person detail](route-people-id.md).

## Desktop

Accepted design: the [People design decision](../../../decisions/people-figma-design.md) of 18 October 2026, with captures 01 (desktop 1440 × 900) and 05 (tablet 1024) in [design r01](../../../reference/ui/customers/people-design-r01/README.md). Figma page "People · CS-02" `1395:150275`: register `1395:150312`, tablet `1395:150835`.

- **Register:** a grid, one row per person (D1). Columns: Name, Organisation, Role (recorded), Phone, Email, Status, Contact preference, Sites where primary contact, Notice preferences and Last correction. The toolbar has Organisation and Notices filters, the count with its read time, Refresh and "…".
- **Views:** People is a shared record opened from More. The side menu lists Organisations and Sites, then Active people (default), Site contacts, Channels to review and Inactive, then Stakeholders and Service requests (D2).
- **Shell:** the proposed Conversations action sits left of the information icon.
- Nothing new is built; the CrmDirectory register below remains the built page.

Use the existing full-bleed CrmDirectory register with PageHeader, scoped search, saved views, columns, sortable table and pagination. Names open exact records; People affiliations open the related organisation. New opens the corresponding shared-record form. Keep shell navigation and Contacts hub view selection separately owned.

## Mobile

Accepted design: captures 06 and 09 in [design r01](../../../reference/ui/customers/people-design-r01/README.md) (`1395:151069` and the states `1395:151245`, `1395:151303`, `1395:151346`). List rows with the name and preferred channel, the organisation and recorded role, and one status line. States: loading, no matching people (people in companies you cannot see are not shown or counted) and could not load, with no list or counts.

Use the existing readable record cards, labelled directory controls and phone taps. Preserve keyboard access, loading/error recovery and the same scoped query across 390/320 CSS px. Person correction controls belong to the receiving detail page.

## Sources, handovers and authority

Person has no invented display reference, structured role taxonomy or purchasing authority. Interaction history is explicitly derived from permitted linked workflows because Activities do not link directly to Person. Restricted contacts and affiliations are not presented as absent.

Incoming: the current permitted directory kind and optional department context. Outgoing: the exact selected Person or organisation and the appropriate New form. Downstream Activity, survey and correction handovers are owned by the receiving record pages.

Reference: docs/reference/ui/customers/PPO-Contacts-Stakeholders-and-Relationships-r01.html

## Verification and acceptance

Accepted Figma design: [People design r01 captures](../../../reference/ui/customers/people-design-r01/README.md) (nine icon-free PNGs; design compositions, not application captures) and its [decision](../../../decisions/people-figma-design.md). Images of the desktop register states, hover states and the phone filters are still missing.

The detailed page guide is `guide.page.people`. [CS receiving handover](../../../delivery/cs-native-completion-handover.md) records executed behaviour, visual inspection, source hashes and open business definitions. Owner/device acceptance and deployment remain separate.

## Directory link loading

The current directory consumer is `CrmDirectory`: CS-01/CS-02 Register/worklist with the existing desktop table and phone cards. Its record names, affiliation/count links, New and local context sections load destinations on activation. Shared shell and Contacts hub view links retain their separate behaviour. Exact hrefs, department context, permission checks and unsaved-work handling are unchanged. See [component contract](../components/crm-directory.md) and `tests/browser/directory-navigation.spec.ts`; source presence and automated proof do not grant visual or device acceptance.
