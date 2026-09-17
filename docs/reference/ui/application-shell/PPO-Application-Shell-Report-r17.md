# Powerplants One — Application Shell r17

**Date:** 17 September 2026  
**Scope:** Rename the Sales workspace; retain the r16 shell behaviour.  
**Status:** Standalone design preview; native visual review and application integration remain outstanding.

## Naming recommendation

Use **Sales** as the business workspace name and keep sales-focused CRM capabilities within it. A separate CRM workspace would introduce an overlapping navigation category for the planned PPO structure. Customer relationship information should remain available to all the modules that use it.

| Responsibility | Recommended home |
|---|---|
| Leads, opportunities/deals, qualification, pipeline, sales follow-up and account development | Sales workspace, using shared activities and records where appropriate |
| Canonical customers, contacts, organisations, sites and relationship data | Shared records, accessible from authorised modules |
| Customer 360 view | The existing Customers workspace, bringing together permitted Sales, Projects, Service and Finance context |
| Estimating, project execution, service operations and financial workflows | Their existing owning modules, linked to the same customer records |

CRM describes a set of relationship-management capabilities in PPO. It does not need to appear as a second department or a slash-separated navigation label. **Sales**, **Engineering**, **Projects** and **Finance** use the same clear, business-facing naming approach.

This is a navigation and ownership recommendation. This revision does not implement a new data architecture, split modules or remove CRM capabilities.

## Implemented changes

- The workspace label is now **Sales** in More, the development selector, search context and contextual Quick add.
- Reset confirmation and the shell guide's recovery text now use **Sales**.
- Page breadcrumbs continue to name the actual page: **Powerplants One | Leads** or **Powerplants One | Deals**. The neutral template still initially displays **Powerplants One** only.
- The existing `sales` route/workspace identity and preference storage key are retained. Saved workspace choices remain compatible when the same browser storage is available.

The smaller logo, clear rail, right-of-search Quick add, information icon, detailed shell guide, fixed popup footers and workspace-specific mobile navigation retain the r16 implementation. The previous edition and its detailed report are retained in `reference/` in the source package.

## Scope and handover declaration

| Field | Declaration |
|---|---|
| Scope identity | Existing shared Application Shell, r16 → r17. No new page-register ID. The r06 coverage register remains the scope reference. |
| Page type | Shared application-frame variant; this naming change creates no business overview, register, form or record-detail page. |
| Reused components | All r16 shell components, assets, navigation model and guide presentation. Only the Sales label, associated explanatory copy and revision identifiers change. |
| Source authority | The user requested a professional recommendation and expressed a preference for removing the slash and using Sales if the capabilities remain grouped. The implemented label follows that direction. Shared-record ownership is the accompanying recommendation, not a claim of new runtime integration. |
| Incoming handover | The application supplies actual identity, authorised destinations, active page, module content and guide content. |
| Outgoing handover | Updated standalone preview and source package. No business records, permissions, transactions, repository deployment or Azure configuration are changed. |
| Exceptions and recovery | All r16 treatments are retained: invalid preference fallback, visit-only state on storage failure, empty search, unavailable module guides, disabled creation and disconnected notifications. |
| Departures | The displayed workspace name changes from Sales / CRM to Sales. Leads and Deals remain the Sales mobile destinations. |
| Verification | Seven workspace IDs and the preference key are unchanged; the old label is absent from current shell source. All 26 model groups and 16 static package groups pass. Deterministic HTML rebuild passes. |

## Verification limits

The checks cover source, navigation, search, preferences and package structure. No native browser visual or click-through review was performed. The prior browser URL-policy restriction on local preview remains the recorded limitation; no alternate browser route was used. The label change does not resolve the visual, device, focus or accessibility review items recorded in the r16 report.

## Exact artifact identities

| Artifact | SHA-256 |
|---|---|
| Predecessor r16 HTML | `c4bd1a78ae1bf81985acc2e7704d01a8984f3cceddf1c51565fc787d9b7581f5` |
| Delivered r17 HTML | `fd934f2d22501aec9dd96c924bb002f5fecf2db36e49264a2487c6dd9361572d` |

The complete source package includes the preview, this report, editable sources, embedded assets, build/check scripts, current check results, a manifest and the unchanged r16 HTML/report reference.
