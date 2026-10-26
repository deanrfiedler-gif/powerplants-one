# Users and access

Stable entry: `route:/admin/access`. Scope: AD-01. Owner: Dean Fiedler. Status: Draft; owner visual review pending.

## Purpose and authority

Inspect workspace identities and recorded grants with an active Workspace admin.access.read grant and no working company selected. The identity register implements the selected accepted composition; person details, proposed roles, local teams and access requests retain their existing routes and authority. A positive grant count does not establish authentication or permission to perform a business action.

## Desktop

The [accepted Users and access design](../../../decisions/users-and-access-figma-design.md), captures 01 and 09 in [design r01](../../../reference/ui/access-review/users-and-access-design-r01/README.md), supplies the desktop grid and Administration secondary menu. The native implementation uses SecondaryMenuFrame, shared register table, sort header/footer, Button, WorklistChoice/Menu/Panel, ReadState and existing icon mappings. Shared shell and tokens remain authoritative.

At 1440 × 900, retain the 240 px secondary menu, 60 px toolbar, 40 px table rows and horizontally scrolling columns within the content region. At 1024 × 900 the shared secondary menu collapses. Search is literal text, submitted explicitly; All, Active, Inactive and Hosted views combine with a company reach filter. Page size is 50 with stable server ordering. Current, Scheduled and Expired columns sort; column selection and row selection stay local to the page. Selection offers only an existing person handover. Company keys remain explicit, including same-name companies.

## Mobile

Captures 10 and 13 supply the Active list and compact header. At 390 × 844 and 320 × 844, use the shared phone header, view chooser and search/filter panel, 85 px minimum identity rows, scope/team summary and grant attention text. The 320 px shared header combines search and filter. The page defaults to Active and most recently recorded change; an explicit URL view/order takes precedence. Retain visible date years under the shared date convention. Phone rows open the same person route as desktop, preserving department context. No horizontal page overflow is permitted.

## States and recovery

Loading, failed, denied and working-company-selected reads hide prior rows and counts. Refresh rechecks current authority. Empty/filtered-empty has explicit copy and Clear filters. Hosted names are masked, provider subject identifiers are omitted, and local-only team/request metadata is unavailable in hosted mode. Approved requests remain ineffective until the existing independent apply workflow succeeds.

## Sources and handovers

Incoming: current users, exact permission grants and company/site keys, plus existing saved local teams and access requests in local synthetic mode. Outgoing: person details, capability catalogue, proposed-role comparison, saved local teams and access requests. No new write command is introduced. The [native contract continuation](../../../decisions/access-review-native.md#identity-register-continuation--24-october-2026) defines the bounded register read and design adaptations.

Preserve the [AD-01 working HTML](../../access-review/access-review.html), [issued r01](../../../reference/ui/access-review/PPO-Users-Roles-and-Access-Review-r01.html) and all parent IDs. This is implementation of the accepted design, not a revision to issued sources or new owner acceptance.

## Evidence and open review

The [identity-register evidence](../../../testing/evidence/access-identity-register/README.md) separates real database/HTTP proof from Figma example rows used only for visual comparison. [Fixture inventory](../access-identity-register-fixtures.json) binds desktop, tablet, phone and state coverage. Historical [native evidence](../../../testing/evidence/access-inspection/README.md) remains historical.

Recorded departures: no fabricated grant-history timestamp; Last recorded change means the latest applied access request, otherwise Not recorded. Scope reach covers recorded grants, including future/expired grants. Request cells show actual Submitted/Approved totals rather than an invented request reference. Dates retain years and timestamp zones; the changed column is wider to label its narrower meaning. Shell controls depend on actual principal authority, so the Systems preview does not gain illustrative Service navigation or Conversation access. Licensed icon artwork is supplied only by the existing runtime kit; public fallback glyphs and retained icon-free captures do not establish exact production-icon review.

Owner visual acceptance, physical-device, screen-reader and zoom review remain open. Source presence, functional checks, visual comparison and deployment remain separate; no review fingerprint is copied into acceptance records.
