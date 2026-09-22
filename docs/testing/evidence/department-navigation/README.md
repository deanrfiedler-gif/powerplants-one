# Department navigation — local implementation evidence

22 September 2026. [Handover](../../../delivery/department-navigation-icons.md) and [destination coverage](../../../delivery/department-navigation-coverage.md) distinguish implementation, local verification, withheld capabilities and owner acceptance. Starting base: 9fa8bd5a40232e4f432b431a235bdb34a9dbbebe; reconciled main: c01106a884f50c2060da36333c218f93228563bf.

Final compiled-browser suite: **14 passed** on Node 24.21.0 / Chrome 153.0.8010.53 / Playwright 1.63.0, using isolated loopback app 3043 and disposable synthetic PostgreSQL 55443. **23 focused unit** and **8 affected database** tests passed. Build, lint, typecheck, foundation and naming checks passed. Full unit result was 323/327; the same four Windows document-store/recovery/path failures reproduced on untouched main.

Screenshots are synthetic local application evidence. The icon-pairs image is an explicitly labelled component fixture; unavailable Products/Insights are samples, not live navigation. Empty-access is an explicit UI fixture. The 720x450 capture demonstrates equivalent 200% layout reflow, not a native Chrome zoom-control or physical-device test. Owner visual acceptance and production readiness remain open.

## Review views

- [All 62 outline/active pairs at 25px](icon-pairs-25px.png)
- [Populated Pulse](sales-pulse-populated.png), [same saved Tasks](sales-tasks-populated.png), [populated Deals board](sales-deals-populated.png)
- [Sales](department-sales-1440x900.png), [Estimating](department-estimate-1440x900.png), [Engineering](department-engineering-1440x900.png), [Projects](department-projects-1440x900.png), [Service](department-service-1440x900.png), [Supply](department-supply-1440x900.png), [Finance](department-finance-1440x900.png)
- [Focus plus selected state](active-keyboard-focus.png), [More open](more-open.png), [1280x400 scrolling rail](short-desktop-1280x400.png)
- [Phone Deals](mobile-deals-390x844.png), [retained Leads phone exception](mobile-leads-exception.png), [200% equivalent reflow](reflow-200-percent-equivalent.png)
- [Fertigation preserved](fertigation-preserved.png), [exact Finance account](finance-exact-account.png), [Programme schedule context](programme-existing-schedule.png)

The browser assertions verify dimensions/order, at most one active rail entry, deliberate selected drawings, focus/tooltip/Escape behaviour, logo/More anchoring, shared context across navigation/reload/history/new tabs, storage refusal fallback, real account guards, same-action completion and the Programme chooser round trip. The Gantt return link uses the existing breadcrumb so it creates no extra outer column.

## Changed files and scope

[Exact changed-file manifest](changed-files.txt) lists this contribution relative to reconciled main; [screenshot SHA-256 manifest](screenshots.sha256) identifies retained image bytes.

Changes cover the SVG catalogue and compatibility delegates; navigation configuration/context/More; scoped rail and Sales adapter CSS; bounded route adapters and their existing-service reads; Deals presentation labels; focused unit/database/browser proof and exact affected label locators; source snapshots, decision/coverage/handover and maintained status/guidance. There is no migration, permission-grant, ES-08 geometry/audit or Fertigation domain change. Shared module-workspaces.ts is unchanged against main.

Raw local logs are retained in the isolated worktree's tmp/nav-proof: build.log, lint.log, typecheck.log, unit-tests.log, main-baseline-tests.log, focused-unit.log, database-tests.log, browser-tests.log, foundation.log and naming.log. Generated fixture HTML and the complete screenshot set remain in verification-evidence/department-navigation. These raw paths are not committed and contain no production fixtures.

The [handover's PR #279 follow-up](../../../delivery/department-navigation-icons.md#evidence-and-next-step) records repaired component-router mocks, exact navigation assertion updates and the pagination-safe same-action proof, with additional local component, CRM, quality and actual-restart results. The issued r17 reference and original reviewed screenshot set are unchanged.

Re-run after starting the compiled isolated app and waiting for readiness:

    npx playwright test --config playwright.navigation.config.ts
    node --import tsx scripts/build-navigation-icon-fixture.ts
    node --import tsx scripts/build-navigation-coverage.ts

Any later main change requires renewed shared-file/Fertigation review and affected checks before merge. This evidence authorises no merge, deployment or live business action.
