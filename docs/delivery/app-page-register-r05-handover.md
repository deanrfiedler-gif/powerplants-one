---
document_id: PPO-PAGE-REGISTER-HANDOVER
title: App page register r05 handover
revision: r01
date: 2026-09-23
owner: Dean Fiedler
status: Standalone document delivered for review; application integration and operational acceptance pending
source_commit: ccc2251bbba9df266cac9027ddaa9418ab9abc1d
---

# App page register r05 — handover

The [r05 HTML](../reference/ui/app-page-register/PPO-App-Page-Register-r05.html) gives each of 150 scopes and 110 app routes a detailed draft guide, local/live destinations and a UI-image action. [r04](../reference/ui/app-page-register/PPO-App-Page-Register-r04.html) is retained byte-for-byte. The [manifest](../design/app-page-register/build-manifest.json) records both hashes and the counts; [source and integration instructions](../design/app-page-register/README.md) describe rebuilding and the later global information-icon adapter.

## Delivered behaviour

- 260 articles with thirteen sections, scope-specific preparation/tasks/outcomes, route-specific task focus, examples, recovery, handovers and source/applicability evidence.
- Guide contents, search and empty result, related-guide back navigation, shareable entry/section links, reading-state retention, full-article print content and separate article export.
- Local origin `http://127.0.0.1:3000`; the hosted origin from `docs/delivery/azure-private-demo.md` is the default live destination. Both are editable origin-only preferences. Record links require separate environment UUIDs; unbuilt routes/views remain labelled future references.
- Eight embedded PNG references across fifteen entries, with fit/actual-size controls, download, original provenance, alternative HTML design links and missing-image states. Other entries deliberately do not reuse unrelated images.
- Source-route additions, guide/image/destination filters, optional search across guide text, enriched CSV and retained source/review exports.
- Existing scope/build order, dependencies, notes, shortlist, table/cards, settings and storage keys retained. Review notes do not change article content or verified scope status.

## Evidence and limits

Worktree branch: `feat/design-development-workspace`, starting from `ccc2251bbba9df266cac9027ddaa9418ab9abc1d`. Main's unrelated `src/app/(business)/facilities/page.tsx` modification was left untouched. This handover covers the standalone document; the subsequently authorised native application source changes and their local-only boundary are recorded in the [development-workspace handover](development-workspace-handover.md). No database or deployed environment was changed.

The [generated-document results](../testing/evidence/app-page-register-r05/dom-results.json) bind the executed behaviour checks to the HTML hash. They use jsdom 30.1.1 with explicit dialog/printing substitutes. These checks establish document behaviour and reference integrity, not real browser layout, native focus trapping, assistive technology, successful PDF printing or application workflow acceptance.

Browser preview of the HTML was rejected by the browser tool's URL policy. No alternate browser, server/protocol workaround or external renderer was used to bypass that restriction. Eight selected source images were visually inspected separately as existing files; that does not establish r05 layout quality. Desktop, tablet, 390/320 px mobile, 200% zoom, keyboard/screen-reader and print-preview review remain open.

The live root returned HTTP 401 and “Sign in · Powerplants One” on 23 September. That verifies the sign-in host, not per-route deployment, login success or business data. Local root HTTP 200 was observed in the preceding check; individual local pages were not re-audited. No availability badge claims a passing per-page connection test.

All articles are Draft r01 with unassigned reviewer/review date and no release-level approval. Profiles distinguish proposals from current source context; verified control labels and required/conditional field rules still need a workflow walkthrough before operational publication. Future SOP links require exact authorised resource metadata; none is invented here.

## Reproduce verification

1. Run `python scripts/build-app-page-register.py` in a checkout matching the pinned application source. Repeat and compare the three generated hashes.
2. Install jsdom 30.1.1 in a disposable test-tools directory; this package does not add an application dependency. Set `PPO_DESIGN_JSDOM_MODULE` to its `lib/api.js` file URL, then run `node scripts/check-app-page-register-dom.mjs`. Leave `PPO_REGISTER_QUICK_TEST` unset for the complete 260-entry run and evidence output.
3. Run `python scripts/check_foundation.py`, `python scripts/check_prototype.py`, `python scripts/check_naming.py`, the JS syntax check and `git diff --check`.
4. Open the HTML manually in an allowed browser for the remaining visual/device/print checks. Export the prior review backup and import it if the browser assigns the new file a different storage origin.

The 16 full DOM groups passed against HTML SHA-256 `b07890f2cec602847af41bb4a790407ff3a6456a1842846520e0aede61233b93`. Final repository assurance and publication are recorded with the [combined native handover](development-workspace-handover.md). No hosted deployment is part of this contribution.

## Next bounded application increment

Use the exported route bindings to extend the existing shell information icon, beginning with the current PP-01 journey and Leads/Deals/Estimation Wizard. Review the exact articles against the implemented build, implement permission-filtered/release-bound content, and execute HELP-01–HELP-14 as applicable. Importing the HTML's unrestricted public authoring bundle is not the application integration strategy.
