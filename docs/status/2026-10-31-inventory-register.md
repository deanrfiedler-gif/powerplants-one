---
title: Inventory SC-05 implementation and proof
date: 2026-10-31
---

[PR #805](https://github.com/deanrfiedler-gif/powerplants-one/pull/805) implements Inventory SC-05 at `/supply/stock`, following [R1–R4 and Q1–Q3](../decisions/inventory-figma-design.md). Dean authorised this build and raised the concurrent page-build limit to 20 in the 31 October chat. Seven open Codex PRs contained `src/` implementation at preflight; no Inventory claim was found. Receiving design PR #787 remained open and unmerged at the implementation check.

The register, snapshot and item record read permitted native source observations through the existing Supply records endpoint. Exact company/item/unit groups preserve Unknown versus zero, source dates and flat locations. Incoming Shipment allocations remain separate from Stock totals. Activity is evidence history, not a ledger. No Product link is recorded or inferred; mapping persistence remains outstanding. The rail says Inventory only in Supply chain. Native observation forms, authority, expected versions and uncertain-save recovery remain in place. MYOB remains the intended ERP authority.

The Supply contract and guide, narrow SC-05 design-register entries, page contracts, component bindings and shell integration record are updated together. No migration, capability, grant, dependency, shared CSS page-ID list or frozen component register change was made. Protected landing documents and retained source captures remain unchanged.

Functional proof: 18 focused unit, 2 database, 1 HTTP, 7 Inventory browser and 30 native Supply browser cases passed; the duplicate capture-matrix project was intentionally skipped. All 11 desktop department-navigation cases passed across the initial run and the Sales Tasks rerun. Typecheck, full lint plus final-file lint, studio, foundation, naming and status checks passed. Quotation-to-Supply regression rerun is pending; earlier branch timeouts and the unmodified-main comparison are recorded without an unrelated-failure claim in [the evidence](../testing/evidence/inventory/README.md).

Visual comparison: Codex inspected 14 application captures at 1440, 1024, 390 and 320 px and recorded all observed departures, including absent Product mapping, actual source fields, shared-shell differences, phone density and adapted Source evidence. This is not visual acceptance. Owner application acceptance and independent exact-head Claude review remain pending. Deployment: not performed. Full repository test suites, production build, physical-device and screen-reader checks were not run. All data and execution are local and synthetic.
