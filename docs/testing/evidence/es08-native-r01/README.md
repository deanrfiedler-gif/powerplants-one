---
document_id: PPO-ES08-EVD
revision: r01
date: 2026-09-21
owner: Dean Fiedler
status: Final local verification in progress; owner acceptance separate
---

# ES-08 native verification record

[Handover and ES08-T01–T80 index](../../../delivery/es08-specialist-workbench-handover.md)
records scope, architecture, deterministic demonstration, exact-decimal differences
and residual source decisions. All fixture data is synthetic. Issued r02 documents
and r03 design source remain unchanged. The source manifest pins normalized LF
hashes; the final evidence manifest records actual executable-file fingerprints.

Evidence is from Windows, Node 24.21.0, npm 11.19.0, PostgreSQL 16.15,
Chrome 153.0.8010.53 and Playwright 1.63.0. Local database testing is restricted to
`ppo_synthetic_test`. No deployment, owner acceptance or engineering approval is
implied. A 960 CSS-pixel viewport demonstrates reflow equivalent to a 1920-pixel
viewport at 200%; a separate manual browser-zoom/assistive-technology audit is not
claimed.

The compiled design test opens the issued Specialist r03 and shared theme in
separate pages, checks their retained hashes, compares actual font/logo/menu/header
tokens and measures global-search/add centring at 1920, 1440 and 1280. A deliberate
20-pixel displacement is the negative control. It checks the shared 24-pixel
collapse strip, keyboard operation and active menu row. Curated native screenshots
will be copied here from the final passing run; traces with complete request bodies
are not part of the published handover.

Visual inspection covers the six views, 143-row local table scrolling, working
inspector, pricing separation, summary width, dialog focus return, read-only and
permission-loss states. It led to the compact permission-error correction. Owner
visual/accessibility acceptance remains pending.
