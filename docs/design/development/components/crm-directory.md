# Customer and contact directory

<!-- versioning: git; committed history is authoritative -->

Owner: Dean Fiedler. Catalogue key: `crm-directory`. Review: pending.

This host entry binds the real CrmDirectory in /customers, /people and the selected /contacts view. CS-01/CS-02 use the Register/worklist page type. The existing Customer 360 reference is retained; no new accepted mockup or isolated renderer is claimed.

## Behaviour and states

Keep existing scoped reads, saved filters, sorting, totals and page content. All six directory Link sites use explicit navigation: desktop names, person affiliations, numeric Site/Facility links, New, local directory tabs and phone record cards. Automatic viewport, hover and touch prefetch is disabled for these links. Hrefs, department context and shared leave-intent handling are unchanged. Shared-shell and Contacts view-tab behaviour remain separately owned.

## Desktop

Support ordinary pointer and sequential Tab/Enter activation. Keep existing columns and scoped table content; numeric links open the same organisation as its name.

## Mobile

Phone cards support taps, readable names and the existing 320/390 px layout. Loading, empty, denied and saved-view states keep their existing UI and recovery. Open only the exact selected record; a background read must never be mistaken for a completed navigation.

## Fixtures and acceptance

`tests/browser/directory-navigation.spec.ts` observes explicit prefetch flags and exercises each Link site through real receiving pages. Existing saved/scoped directory queries, department Contacts continuation and unsaved-navigation cases provide integration checks. The one-browser request probe is separate from ten-user timing evidence.

Prefetch can make later navigation faster, so suppressing it is a bounded experiment with an explicit next-navigation tradeoff. Retain actual request counts and timing limits; do not call reduced background requests a proven whole-page speedup. Owner, physical-device, assistive-technology and visual acceptance remain pending.
