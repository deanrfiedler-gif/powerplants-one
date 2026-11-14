---
title: Products vocabulary, duplicate matching and catalogue order built
date: 2026-11-13
---

[PR #947](https://github.com/deanrfiedler-gif/powerplants-one/pull/947), owned by Codex on `codex/products-pr1-vocabulary-catalogue`, builds items 3, 16, 18, 19 and 24 of the [Products record](../decisions/products-module-refined-ui-proposal.md). The build basis is the private file “PPO - Products module (accepted)” (formerly “PPO - Products module”), named version “PPO - Products module (accepted) · alignment batch” (13 November 2026), as recorded in that decision and Dean's brief. The Figma version was not inspected. Section 6 remains unchanged for Claude to record closure after merge.

The [catalogue contract](../contracts/products-catalogue.md) now describes the shared vocabulary, legacy-preserving reads, new-write lifecycle validation, explicit successor/import word changes, duplicate suggestions, URL order and transaction read time. Retired displays and filters as Discontinued; CandidateReplacement displays as Alternative to. The PR records both defaults for Dean's veto. Comparison and history preserve stored words; import source bytes and hashes remain unchanged. No migration, stored-content rewrite, existing hash change, permission, grant, seed, route, integration or shell rebuild is included. All 78 parent requirement IDs remain intact.

Validation: `npm run check` passed (studio, lint, typecheck, 1,454 unit tests and production build); the focused Products unit tests passed 11/11. The Products database runs passed 69/69, including all 56 unchanged Products upgrade cases and the named-duty access proof. Ten CPQ regression/upgrade cases also passed (nine mapped-catalogue/provenance cases and the unchanged populated package-upgrade proof). Foundation, migration numbering and status-source checks passed. The studio check reported no errors and the existing 26 stale entries; no register touch or page-guide rewrite was needed.

The Products browser command was attempted but no specs ran: Chrome is absent at `/opt/google/chrome/chrome`, also confirmed on unmodified main `bdcdd347f`. The setup script reported the database ready and browser unavailable. Updated vocabulary, order, footer, keyboard and responsive browser checks are left to GitHub CI. The full database suite and unrelated upgrade suites were not run locally. Independent Claude review and final CI remain outstanding; Dean merges. No business acceptance or deployment is claimed.

The initial validation and review status above are superseded by the [14 November review-fix record](2026-11-14-products-pr1-review-fixes.md).
