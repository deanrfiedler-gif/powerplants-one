# Contact directory — native working reference

Stable entry: `route:/people`. Scope: **CS-02**. Owner: Dean Fiedler.
Source main: `25170bf83008727f005e36b5603841a7b9359027`. Route: `/people`.
Native implementation and adaptations are proposed for owner review; this is not a new accepted visual baseline.

## Purpose and page type

Find a permitted canonical Person or organisation, review its directory summary and open the selected record. Detailed corrections and reliance checks belong to the separate record workspace.

r20 page type: **Register / worklist**. `/people` shows People; the `/contacts` hub switches between People and Organisations. Identity, relationships, reliance and correction history belong to [Person detail](route-people-id.md).

## Desktop

Use the existing full-bleed CrmDirectory register with PageHeader, scoped search, saved views, columns, sortable table and pagination. Names open exact records; People affiliations open the related organisation. New opens the corresponding shared-record form. Keep shell navigation and Contacts hub view selection separately owned.

## Mobile

Use the existing readable record cards, labelled directory controls and phone taps. Preserve keyboard access, loading/error recovery and the same scoped query across 390/320 CSS px. Person correction controls belong to the receiving detail page.

## Sources, handovers and authority

Person has no invented display reference, structured role taxonomy or purchasing authority. Interaction history is explicitly derived from permitted linked workflows because Activities do not link directly to Person. Restricted contacts and affiliations are not presented as absent.

Incoming: the current permitted directory kind and optional department context. Outgoing: the exact selected Person or organisation and the appropriate New form. Downstream Activity, survey and correction handovers are owned by the receiving record pages.

Reference: docs/reference/ui/customers/PPO-Contacts-Stakeholders-and-Relationships-r01.html

## Verification and acceptance

The detailed page guide is `guide.page.people`. [CS receiving handover](../../../delivery/cs-native-completion-handover.md) records executed behaviour, visual inspection, source hashes and open business definitions. Owner/device acceptance and deployment remain separate.

## Directory link loading

The current directory consumer is `CrmDirectory`: CS-01/CS-02 Register/worklist with the existing desktop table and phone cards. Its record names, affiliation/count links, New and local context sections load destinations on activation. Shared shell and Contacts hub view links retain their separate behaviour. Exact hrefs, department context, permission checks and unsaved-work handling are unchanged. See [component contract](../components/crm-directory.md) and `tests/browser/directory-navigation.spec.ts`; source presence and automated proof do not grant visual or device acceptance.
