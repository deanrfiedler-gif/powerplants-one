# Powerplants One — Application Shell r15

**Date:** 17 September 2026  
**Status:** Implemented standalone shell preview; native visual review and application integration outstanding.  
**Previous reference:** PPO-Application-Shell-r14(3).html, retained unchanged.

## Delivered refinements

| Area | r15 behaviour |
|---|---|
| Brand | Original Powerplants artwork reduced to 54 × 54 px, centred in the original 76 px rail and 64 px desktop header. |
| Rail | Logo at the top; three-dot More control at the bottom. Department icons removed. |
| Header | Single-line product name, divider and current workspace on wide desktops. Original embedded Roboto fonts retained. |
| Quick add | Navy circular control immediately left of global search, with a 12 px control-to-field gap. The search field remains centred across the shell. |
| Header utilities | Help and Notifications use matching 22 px icons in 44 px targets, with consistent hover and focus treatments. |
| Account | Restrained DF avatar; Dean Fiedler shown inside the popup as the preview account. |
| Development selector | Account → Development → Preview workspace offers all seven domains. A validated browser preference restores the last selection. |
| More | Searchable groups for Workspaces, My workspace, Shared records, and Administration & support. All seven domains remain reachable without rail icons. |
| Mobile | Bottom navigation follows the selected domain. Quick add, Help and Notices remain reachable through More; Quick add also sits beside search in the mobile search panel. |

Additional refinements include consistent menu spacing, selected-state checks, restrained panel shadows, keyboard shortcuts, empty search results with a clear action, reduced-motion styling, a skip link, focus handling, and honest disconnected states for Quick add and Notifications. The central workspace remains intentionally blank for reviewing the shared frame.

## Navigation and preview behaviour

More contains these 20 root destinations:

| Group | Destinations |
|---|---|
| Workspaces | Sales / CRM; Estimating & quotation; Engineering; Projects; Service operations; Supply chain; Finance |
| My workspace | Home; My Work; Email & Calendar |
| Shared records | Customers; Contacts; Sites; Equipment; Products; Documents; Reports |
| Administration & support | Settings; Exceptions & recovery; Help |

Global search searches these destinations and seven domain-specific destinations, for 27 navigation targets. It does not search business records. Navigation changes the shell context; it does not implement the destination's business page.

Mobile navigation always includes **My Work** and **More**, with two domain-specific positions between them:

| Selected workspace | Primary position | Secondary position |
|---|---|---|
| Sales / CRM | Deals | Leads |
| Estimating & quotation | Estimates | Intake |
| Engineering | Engineering | Drawings |
| Projects | Projects | Programme |
| Service operations | Service | Planner |
| Supply chain | Materials | Deliveries |
| Finance | Finance | Accounts |

These are preview navigation labels, not additional module-delivery claims. Selecting a business workspace through More or search also updates the workspace preference. Opening a shared destination retains the selected workspace for subsequent quick actions and mobile navigation. On a shared destination, the header names that destination; on domain destinations, it names the workspace.

The initial selection is Sales / CRM when no valid r15 preference exists. Only schema version and workspace ID are stored under `ppo.shell.r15.preferences`; account identity, access permissions and business records are not stored. Invalid or obsolete values fall back to the default. If browser storage is unavailable, selection remains usable for the visit and the account popup explains the limitation. Reset preview preference clears only this shell's preference.

## Responsive and keyboard treatment

- Above 1320 px, the full product/divider/workspace heading is displayed on one line. At narrower desktop widths the product label and divider are hidden to preserve space for the current workspace and centred search.
- At 780 px and below, the rail becomes a four-position bottom bar. The compact mobile brand and two-line identity replace the desktop heading. Panels are constrained to the viewport with a scrollable interior and mobile background blocking.
- Help and Notifications move into More on mobile. The account and search controls remain in the header.
- Ctrl/Cmd K opens search. Escape closes the workspace picker before closing its parent panel. Arrow keys navigate the picker and navigation results. Native buttons support Enter/Space. Focus return and mobile panel focus containment are implemented.

These behaviours are implemented in the source. Native rendering, real keyboard focus and assistive-technology acceptance have not been established by the checks below.

## Scope and conformance declaration

| Field | Declaration |
|---|---|
| Scope identity | Shared Application Shell, r14 → r15. The supplied Page Coverage Register r06 is the scope reference. This increment provides the common frame around the SH family; it creates no new business page ID. |
| Related existing scope | SH-01 Role-based home overview; SH-02 My Work action centre; SH-03 Notification inbox and preferences; SH-04 Global search results and record preview; DK-07 Page guides and contextual help coverage; AD-01 Users, roles, teams and access review. These are receiving boundaries, not completed modules. |
| Page type | Shared application-frame variant. The r20 business-page taxonomy does not directly describe a reusable shell. Navigation panels and a development preference selector support the frame; no business overview, register, form or record-detail page is supplied. This exception is explicit and does not define a new page type for business modules. |
| Reused components | Exact desktop and compact mobile logo data and the three embedded Roboto font definitions from the supplied r14. Existing icon paths retained. Navy/green palette, blank workspace surface, 76 px rail and 64 px desktop header retained; layout and interaction controller revised. No unseen r20 component source is claimed as copied. |
| Source authority | The user's current instruction authorises the listed r15 changes and additional refinement. The uploaded r14 is the previous shell reference. r15 is the resulting reviewable composition, not an automatically accepted application baseline. Dean Fiedler/DF is the explicitly requested preview identity; no business fixture data is included. |
| Incoming handover | For integration, the application must supply the authenticated user, authorised destinations, active route/workspace and owned module content. Real search requires authorised, source-bound results; real notifications require owned event and read-state services. This file accepts none of those live sources. |
| Outgoing handover | This package provides the shell design, navigation configuration, controller and reproducible standalone build. The receiving application owns router integration, permission filtering, actual identity, business pages and service connections. Selecting a preview does not send, receive, accept, approve, issue or convert a business record. |
| Exceptions and recovery | Missing/malformed preferences fall back to Sales; storage failures use visit-only state; unknown routes preserve the current state; unmatched searches show an empty result with Clear search. Creation actions are disabled and notifications explicitly disconnected. No stale business-record, returned submission, superseded version or unknown transaction handling is claimed. |
| Departures | Requested and authorised: smaller logo, cleared rail, development selector, moved Quick add, normalised utilities, new More groups and domain-specific mobile navigation. Additional proposed refinements: compact desktop heading below 1320 px, panel styling, focus/keyboard behaviour and contextual disabled quick-action previews. Owner acceptance and runtime integration remain separate. |
| Verification | 23 pure model groups and 16 static package groups passed, along with JavaScript syntax checks and an exact deterministic rebuild. Native visual, DOM interaction, device and accessibility acceptance remain outstanding. |

The repository conformance standard was inspected at main commit `e1b705acc5457dab6fc0b6a2f0c977132cbd2215`. That is the inspection reference, not a claim that r15 has been committed, merged or deployed.

## Verification evidence and limits

| Check | Result | What it establishes |
|---|---|---|
| Navigation/preference model | 23 groups passed | Seven domain identities; preference encoding/decoding and fallback; mobile route selection; shared/domain transitions; More coverage; search and unknown-route handling. |
| Static package | 16 groups passed | Resolved build markers; unique static IDs; existing static ARIA references; embedded resources; dimensions; labels; icon references; blank workspace; responsive declarations; CSS delimiter balance; reproducible output. |
| JavaScript syntax | Passed for model and controller | Scripts parse in Node. It does not establish browser interaction. |
| Rebuild | Exact SHA-256 match | Retained build sources reproduce the delivered HTML in the checked environment. |
| Native browser review | Blocked | The browser URL policy rejected local-file navigation. No alternate browser route was attempted. There is no r15 rendered screenshot or native click-through evidence in this package. |

The model tests use Node assertions without a browser or DOM. Static checks use Python's HTML parser and source checks. They are not substitutes for CSS rendering, measured overlap, focus behaviour, screen-reader testing, WCAG conformance or module acceptance.

Before application integration, visually review the header and open panels at 1440, 1280, 1024 and 820 px desktop widths, then 390 and 320 px phone widths and at 200% zoom. Exercise all seven workspace choices; refresh to check preference restoration; search More and global navigation; inspect no-result states; check Engineering/Projects mobile destinations; and exercise keyboard opening, Escape, focus return and mobile focus containment. The menu must remain readable and operable without clipped controls.

Integration must replace the preview account with the signed-in identity, restrict development selection to the intended development context, filter destinations by authorised access, connect real routes and services, and enforce permissions at the server. This package makes no Azure, authentication, API or deployed application change.

## Retained source identities

| File | SHA-256 |
|---|---|
| Supplied PPO-Application-Shell-r14(3).html | `9f4ab001225f7e538277870b9dcce4f467b158415c05a759af0870e45e8441d3` |
| Supplied PPO-HTML-Page-Coverage-Register-r06.html | `672f626ddfdfc2c67287c646e97485681872b1bb29ddddedf4072917db71a770` |
| Delivered PPO-Application-Shell-r15.html | `232ef6e461a031da6bf2d3cd9a356fffef6b536ec2eb92b0e8f316f23a6bbcd2` |

The ZIP contains the standalone HTML, this report, editable sources, embedded assets, build/check scripts, recorded check results, a file manifest and an unchanged r14 reference. The manifest records exact package file identities. The coverage register is a cited scope reference, not a modified deliverable.
