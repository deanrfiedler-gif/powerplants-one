# Scheduling policy impact review evidence

<!-- versioning: git; committed history is authoritative -->

**Owner:** Dean Fiedler · **Executed:** 27 September 2026 · **Status:** Focused local synthetic component proof passed; owner, visual, device and full PT-28 acceptance remain open.

The [manifest](manifest.json) pins source `89faa078a22525653e6e8f07cb82425372385b07`, its source/database trees, compiled build and eight retained artifacts. [Handover](../../../delivery/scheduling-policy-impact-handover.md), [decision](../../../decisions/scheduling-policy-impact-review.md) and [page contract](../../../design/development/pages/route-schedule-policy-impact.md) define the boundary.

- [Fourteen units](unit.txt): duration equality/excess, half-open effective dates, offset equivalence, existing scheduling scenarios and civil-time guards.
- [Seven database tests](database.txt): exact immutable policy context, scoped future bookings, boundary crossing, denied identity/company/site/workspace, stale and forged inputs, current grant revocation, actual-start exclusion and over-200 refusal. Load fixtures retain real reference, complete-crew and reservation constraints; they are not command/calendar approval evidence. Every PPO table's row count and canonical database value hash stayed identical before/after analysis. Source fixtures exist; this is not a fresh issued-file/rollback proof.
- [Six compiled browser cases](browser.txt): comparison, edited-input invalidation, exact booking handover, no write request, failed refresh/retry, denied identity, POST 405, plus existing scheduling navigation/reflow. Desktop 1440/1024 and mobile 390/320 CSS widths were exercised; mobile uses Chromium touch emulation, not physical hardware or native 200% zoom.

Build, lint, type checking and documentation/design-register checks passed. Foundation retains all 78 parent IDs; 321 entry reviews and 29 component reviews remain pending. The database run used the same implementation before its source commit and final test formatting; clean source `89faa07` was used for the retained units and compiled browser run. Build `PvEW5-9M5Wh7oBNkZbDxh` was compiled from the same runtime files before that commit.

## Inspected captures

[Desktop overview](desktop-overview.png), [phone form](phone-form.png), [desktop review card](desktop-review.png), [phone review card](phone-review.png). The two card captures use the retained [capture source](capture-source.txt) to scroll the exact review link into view and also check the authenticated source GET's no-store header. Captures show the actual synthetic app; they are not accepted design mockups. The narrow capture is scrolled and retains the fixed shell. No review fingerprint has been assigned.

## Earlier failures and limits

Initial test assertions used an incorrect unavailable-error name and an unprefixed synthetic appointment reference. Correcting those assertions required no runtime bypass. The first volume fixture was refused by the actual reference and complete-crew constraints; the final fixture supplies valid identities and non-overlapping reservations without disabling constraints. Naming assurance required the maintained project instructions to remain within 8,000 characters.

An intermediate final-browser launch raced the ordinary Playwright development-server fallback against compiled startup. That incomplete run is not counted as compiled proof. The retained run disables the fallback, verifies the listener belongs to the compiled launcher, checks HTTP readiness, and then runs the unchanged committed tests. Original private logs/traces remain outside committed evidence; no tokens, cookies, database dumps or raw profile files are included here.

No policy was published, saved impact task created, booking changed, document reissued or hosted app deployed. API-C26/EVT-12 publication, complete PT-28/PT-30, independent owner/device/visual acceptance and production readiness remain open. The earlier compatible-update evidence keeps its original source and scope.
