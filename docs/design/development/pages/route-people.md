# People register — CS-02 implementation contract

<!-- versioning: git; committed history is authoritative -->

Stable entry: `route:/people`. Scope **CS-02**. Owner: Dean Fiedler. Route `/people`, also the People view of `/contacts`. Source base: main `d512bd38`. Design accepted; application owner visual/device review **pending**. r20 page type: **Register / worklist**.

## Authority and exact references

[Accepted People decision](../../../decisions/people-figma-design.md), 18 October 2026. Private Figma file **PPO - Design**, page `1395:150275`, named version **People — accepted**, notes `1395:151383`. Live metadata, variables, design context and screenshots were inspected for each register frame and state:

| Presentation | Figma node | Drawn viewport | Retained icon-free capture |
|---|---|---|---|
| Desktop register | `1395:150312` | 1440 × 900 | 01 |
| Tablet register | `1395:150835` | 1024 × 900 | 05 |
| Phone list | `1395:151069` | 390 × 844 | 06 |
| Loading / no matches / error | `1395:151245`, `1395:151303`, `1395:151346` | 390 × 844 each | 09, first three states |

[Capture filenames and hashes](../../../reference/ui/customers/people-design-r01/README.md). Retained bytes are unchanged. Person record nodes `1395:150562`, `1396:175528`, `1396:354723`, `1395:151108`, `1396:355861` and view-only `1396:355987` belong to the next PR, not this register delivery.

Shell references: top bar `35:138`, Service rail `198:3778`, side-menu components `73:46`, `73:48`, `73:54`, `73:63`. The later [Phone header amendment](../../../decisions/phone-header-amendment.md), named **Phone header amendment — accepted**, component `1530:110`, overrides the older header and toolbar rows under P1–P9.

## Desktop

`PeopleRegister` uses the shared `SecondaryMenuFrame`, `RegisterTable`, `RegisterSortHeader`, `RegisterFooter`, `Button`, `WorklistChoice`, `WorklistMenu`, `WorklistPanel`, `ShellIcon` and existing mapped refresh icon. Shared semantic tokens remain authoritative; no new dependency or inline layout is added.

- Full-bleed content, 240 px secondary menu, 60 px toolbar, 40 px ruled grid rows, 44 px pinned checkbox/actions columns. The 1718 px grid scrolls locally, retaining all ten columns; no module card wraps the register.
- Organisation and Notices filters; full matching count and read time; Refresh and options. Sort the existing name/email/phone/status keys. Optional columns can be hidden. Selection is transient and has no bulk command.
- Views: Active people (default), Site contacts, Channels to review, Inactive. Current affiliations and site-primary roles are descriptive, never purchasing authority. Names open exact Person IDs, organisations/sites open their exact permitted IDs.
- The shared tablet shell opens its secondary menu as an overlay. This inherited deviation from the drawn collapsed strip is retained and recorded below.

## Mobile

At the shared phone breakpoint (780 px), one 56 px compact header owns the view/count, search, Conversations where permitted, and Filter. At 320 px search and filter combine. P9 removes the two old toolbar rows; the first list row begins directly below the header. The 390 px row is 85 px, with name/preference, organisation/recorded role, one permitted status line and a chevron. Longer content may grow for readability, including at 320 px.

The shared modal supplies full-screen filters. Search, organisation and notices apply together; Reset changes draft inputs. The response count is not predicted for unsaved filters. A downward gesture of at least 80 px from the top, with less than 40 px horizontal movement, requests refresh; the filter panel retains a Refresh button as an accessible alternative. No offline support is claimed. Empty, loading and error compositions come from the three phone state frames. Failed/denied reads clear the rows and counts.

## Data, permissions and handovers

`GET /api/v1/people/register` is a read-only aggregate over existing tables. It needs `shared.read`, existing Person visibility, company-scoped affiliations and notice reads, and permitted primary sites. Latest notice ledger entries are counted per company and message class. Last correction is the latest `RevisePerson` audit event and is visible only under the existing all-company correction authority. No new capability, grant, migration, ERP endpoint or calculation is added.

One authorised population supplies rows and view counts. Search/filter/sort/limit/working company/actor/workspace bind signed cursors; changed populations invalidate a missing cursor row. Defaults are 25 rows, maximum 200. Counts never include hidden people. An unavailable affiliation or history is not presented as a verified absence. No sending or contact update happens in this register.

Incoming: `/people`, Contacts People tab, More menu, department context and URL query (`q`, `organisation`, `notices`, `people_view`, sort/direction/limit). Outgoing: exact `/people/[id]`, `/customers/[id]`, `/sites/[id]`, existing `/customers/new?kind=person`, Service requests. Stakeholders requires an organisation; the menu opens Organisations first. The receiving record retains its existing correction/version/reliance behaviour.

## Retained legacy workflow

The existing account saved-view directory remains at `people_layout=directory`, reachable through People options and the phone filter panel. It continues to use `CrmDirectory`, its stored filter/column schema and optimistic versioned account command. Saved values are neither migrated nor deleted. The Contacts Organisations tab also keeps the earlier directory because it is not drawn in the People decision. These are retained workflows, not new visual acceptances or a replacement saved-view design.

## Recorded gaps and open questions

| Gap | Actual treatment and question for Dean |
|---|---|
| Phone toolbar rows | Removed under accepted P6/P9. Compared list content shifts from retained y=166 to y=56; this is an authorised amendment, not an altered reference. |
| Tablet/menu and breakpoint | Existing shared tablet overlay replaces the drawn 20 px collapsed strip; inherited phone threshold 780 px differs from P1's below 768 px. Keep shell consistency pending separate shell alignment. |
| Phone filters | No People filter frame. Existing modal uses Reset, Show people and refresh; no speculative count on the apply button. What is the accepted detailed composition? |
| Checkbox/row actions | Grid draws them but specifies no bulk action or snapshot. Local page selection, Clear selection and Open person only. What job should selecting people enable? |
| Saved views and columns | No new design for account saved views. Preserve the earlier directory behind an explicit link; optional columns persist through query changes in the URL. Should the accepted page incorporate saved views? |
| Stakeholders | Requires organisation context; opens Organisations to choose one. Is a global stakeholder register intended? |
| Other missing frames | No 320 px register, desktop loading/empty/error, restricted-affiliation or denied frame, hover state or 200% zoom composition. Existing controls and explicit access states are used; no visual acceptance inferred. |
| Notice wording | A person can have several company/class entries. Use “notice preferences” for an aggregate rather than claiming unique classes across companies. |
| Source summaries | Site roles/affiliations include permitted links only. Role text has no taxonomy. No Activities-to-Person history or purchasing authority is invented. |
| Offline/device | Online-only per [offline contract](../systems/offline.md). Physical touch, screen-reader and owner/device review remain pending. |
| Read-time format | Shared S6 timestamp formatting includes the year and zone abbreviation rather than the frame’s compact date. No new date format is introduced. |
| Fonts/icons/shell data | Shared Roboto/tokens and local fallback icons in public evidence. Live Kit artwork and synthetic shell badges differ from retained icons/counts; no Pro artwork is committed. |

## Evidence and delivery status

[Host fixture manifest](../people-native-fixtures.json), [verification and comparisons](../../../testing/evidence/people-native/README.md), `tests/database/people-register.test.ts`, `tests/browser/people-native.spec.ts`, `tests/unit/people-register.test.ts`. Guide `guide.page.people` is Draft. Source presence, test results, visual comparison, owner review and deployment remain separate; no review fingerprint is copied.
