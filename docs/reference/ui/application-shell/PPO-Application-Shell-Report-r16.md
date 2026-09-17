# Powerplants One — Application Shell r16

**Date:** 17 September 2026  
**Status:** Standalone shell refinement, ready for owner review. Native visual review and application integration remain outstanding.  
**Predecessor:** Application Shell r15, preserved unchanged.

## Changes in this revision

| Request | Delivered behaviour |
|---|---|
| Quick add to the right of search | The navy plus is immediately right of the centred desktop search field, separated by 12 px. Its popup aligns beneath this side of search. The mobile search panel also places Quick add after its search field. Keyboard order now follows this visual order. |
| Neutral template heading | The shell initially shows only **Powerplants One**, with no divider or Sales / CRM suffix. Remembering or changing a development workspace does not insert a page breadcrumb. Opening a destination supplies its page name, for example **Powerplants One \| Deals**, **Powerplants One \| Leads** or **Powerplants One \| Projects**. |
| Fixed More footer | The title, scrollable body and footer are separate siblings. The body scrollbar begins below the title container and finishes above the fixed footer. Revision and destination count remain visible; the count updates when the menu is filtered. |
| Page information icon | A matching 22 px circled information icon in a 44 px target sits before Quick Help on desktop. It remains in the mobile header beside search and the account control. Its tooltip is **Page guide**, and its accessible label identifies the current page. |
| Detailed guidance | The information icon opens a wider guide panel with a complete application-shell guide, step-by-step instructions, a four-stage journey map, mobile guidance, shortcuts and recovery advice. |
| Additional refinements | All panel footers now remain fixed. Search recognises “Deals” as the Sales destination. Neutral-state mobile navigation does not falsely mark More as the current page. Clicking the empty workspace no longer re-runs navigation. Resetting the preview also clears the stale search input. |

The original 54 px corporate logo, 76 px navy rail, embedded Roboto fonts, DF account avatar, seven-workspace selector and grouped More destinations are retained. The main workspace remains blank for shell review.

## Heading and navigation contract

The application name and current page are separate pieces of context:

1. Opening or refreshing this template starts with **Powerplants One**. The last workspace preference still determines Quick add choices and mobile navigation.
2. Choosing a development workspace returns to the neutral template heading, with that workspace's preview context selected.
3. Opening a page through More, search or mobile navigation adds that page's name to the heading. The Sales workspace entry opens the **Deals** page context; the Estimating workspace entry opens **Estimates**. A secondary destination uses its actual name, such as **Leads** or **Drawing register**.
4. Opening a shared page retains the selected business workspace. Opening another domain's destination switches to that domain.

The heading is ready for an actual router to supply the active page. This preview does not create module content or a multi-level record breadcrumb system. On narrow screens the current page can truncate visually, while its full name remains in the heading's accessible label and page-guide label. Mobile displays the application and page on separate lines when a page is selected.

The established preference key, `ppo.shell.r15.preferences`, is intentionally retained. r16 uses the same validated schema so an existing choice can carry forward when both files share browser storage. Local-file storage behaviour depends on the browser; this is not cross-device or signed-in profile persistence. Invalid values fall back to Sales / CRM. Storage failure permits visit-only selection and is explained in the account popup.

## More and the fixed panel frame

More still provides 20 root destinations in four searchable groups:

| Group | Destinations |
|---|---|
| Workspaces | Sales / CRM; Estimating & quotation; Engineering; Projects; Service operations; Supply chain; Finance |
| My workspace | Home; My Work; Email & Calendar |
| Shared records | Customers; Contacts; Sites; Equipment; Products; Documents; Reports |
| Administration & support | Settings; Exceptions & recovery; Help |

The search field, grouped destinations and mobile utility buttons occupy the scrollable middle region. The **More** title and close control remain above it, while **Shell preview · r16** and the result count remain below it. The footer is outside the scrolling body rather than overlapping it. The same arrangement is used for Account, Search, Quick add, Notifications, Quick Help and Page guide.

Global search additionally exposes seven secondary destinations, for 27 navigation targets overall. It remains a navigation search in this preview, not connected business-record search.

## Page guide and journey map

**Quick Help** provides brief tips and keyboard shortcuts. **Page guide** provides the longer explanation for the current page. Quick Help also links to Page guide.

The guide is a right-aligned panel up to 560 px wide on desktop, below the application header. Its content scrolls between its fixed title and footer. On mobile it fits inside the viewport and uses the existing modal background and focus-containment behaviour. Escape and the close control dismiss it; opening the guide does not change the selected page.

The delivered **Application shell** guide contains:

| Section | Content |
|---|---|
| Overview | What the shared shell does; navigation, page context and the distinction between quick help and a page guide. |
| How to use it | Five steps covering destination selection, global search, development workspace selection, contextual Quick add and guidance/notifications. |
| Journey map | Start → Find a page → Confirm your context → Work with guidance, shown as a numbered vertical sequence with explanations. |
| On your phone | Header controls, workspace-specific bottom navigation and utilities available through More. |
| Keyboard shortcuts | Search, Escape, arrow navigation, activation and moving between controls. |
| If something is unavailable | No-result searches, unavailable browser storage, resetting the preference and the preview's disconnected services. |

Overview, How to use and Journey map buttons move to the corresponding section without leaving the panel.

Guide resolution follows the current page's stable route ID. Only the shell's detailed guide is authored in this shell package. When a business page is selected, the panel names that page and clearly states that its guide has not been added yet. It offers access to the shell guide without changing the selected page. This avoids presenting general navigation advice as an authoritative business procedure.

Individual module guides should be supplied with those modules and cover their purpose, prerequisites, permissions, steps, decisions, exceptions, evidence and receiving destination. Their instructions must reflect the actual delivered workflow. No new Sales, Engineering, Finance or other business procedure is invented by this revision.

## Retained mobile destinations

Every mobile workspace also includes **My Work** and **More**:

| Workspace | Primary | Secondary |
|---|---|---|
| Sales / CRM | Deals | Leads |
| Estimating & quotation | Estimates | Intake |
| Engineering | Engineering | Drawings |
| Projects | Projects | Programme |
| Service operations | Service | Planner |
| Supply chain | Materials | Deliveries |
| Finance | Finance | Accounts |

## Scope and conformance

| Field | Declaration |
|---|---|
| Scope identity | Existing shared Application Shell, increment r15 → r16. No new business-page ID. Page Coverage Register r06 remains the scope reference. |
| Related scopes | SH-01 Home, SH-02 My Work, SH-03 Notifications, SH-04 Global search, DK-07 Page guides and contextual help, AD-01 User/access context. This package supplies shell entry points and guide presentation; it does not complete these business modules. |
| Page type | Shared application-frame variant, with navigation and contextual guidance panels. The r20 business-page taxonomy does not directly classify the shell; no new business page type is introduced. |
| Reused components | r15 corporate and compact logos, three embedded Roboto fonts, rail/header frame, icon paths, controls, account selector, navigation model, panel behaviour and mobile treatment. The existing information icon is reused; a small matching chevron is added for guide links. |
| Source authority | The current user instruction authorises these refinements and bug fixes. r15 is the accepted predecessor for this increment. The supplied footer screenshot illustrates the requested scroll boundary. r16 remains a reviewable design successor; no deployed-baseline acceptance is inferred. |
| Incoming handover | Integration supplies authenticated identity, authorised destinations, current router page, module content and route-specific guide content. Guided procedures must be authored against the receiving module's actual workflow. |
| Outgoing handover | Standalone HTML, editable sources, navigation/guide configuration and report. Selecting a page or opening a guide does not create, approve, issue, accept, send or convert a business record. |
| Exceptions and recovery | Invalid preference fallback, visit-only selection when storage is unavailable, unknown-route preservation, empty search results, disabled creation, disconnected notifications and explicit missing-page-guide treatment. No business transaction recovery is claimed. |
| Departures | Requested: Quick add position, neutral template heading, fixed More footer and contextual information guide. Additional refinements: fixed footers across all panels, page-aware heading labels, search alias, corrected neutral selection and empty-area click handling. |
| Verification | 26 pure model groups and 16 static package groups passed; model/controller syntax checks passed; exact rebuild matched. Native visual, DOM interaction, device and accessibility acceptance remain unverified. |

## Verification and review limits

The model suite checks route identities, preferences, domain-specific mobile destinations, navigation/search, neutral initial and development-selection states, page breadcrumb names and guide availability. It confirms that unavailable page guides cannot silently use another page's guide.

The static suite checks build markers, static element IDs and ARIA references, embedded assets, logo dimensions, control labels, icon references, blank workspace, responsive declarations, CSS delimiter balance and deterministic output. Node syntax checks verify that the scripts parse.

No native browser rendering or click-through was performed. The authoring browser previously rejected local shell navigation under its URL policy; no alternate browser route was used. Source and model checks do not establish measured layout, DOM events, actual focus behaviour, screen-reader output or WCAG conformance.

For visual review, inspect desktop widths of 1440, 1280, 1024 and 820 px, phone widths of 390 and 320 px, and 200% zoom. Confirm:

- Quick add stays right of search without overlapping the information or account controls.
- Initial and development-selection headings contain only Powerplants One; selecting Leads, Deals or Projects adds the correct page name.
- The More title/footer stay visible while its middle region scrolls, including after filtering to zero or one result.
- Page guide opens the complete shell instructions initially, follows a selected page's identity, shows an honest missing-guide state, and can open the shell guide without navigating away.
- Guide section buttons, keyboard dismissal, focus return and mobile focus containment work as intended.

Application integration and Azure deployment are outside this revision. Actual identity, permissions, router destinations, business actions, notification feeds and module-specific guide content still belong to the receiving application.

## Exact artifact identity

- Predecessor r15 HTML SHA-256: `232ef6e461a031da6bf2d3cd9a356fffef6b536ec2eb92b0e8f316f23a6bbcd2`
- Delivered r16 HTML SHA-256: `c4bd1a78ae1bf81985acc2e7704d01a8984f3cceddf1c51565fc787d9b7581f5`
- Coverage register r06 SHA-256: `672f626ddfdfc2c67287c646e97485681872b1bb29ddddedf4072917db71a770`

The ZIP retains the standalone preview, report, editable sources, build/check scripts, test results, an exact file manifest and the unchanged r15 HTML reference.
