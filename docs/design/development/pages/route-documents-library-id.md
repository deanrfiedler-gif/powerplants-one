# DK-02 Document library native workspace

Owner: Dean Fiedler. Working draft; visual review and owner acceptance remain pending.

## Purpose and authority

Follow the [accepted design](../../../decisions/document-library-figma-design.md), [phone header amendment](../../../decisions/phone-header-amendment.md) and [API contract](../../../contracts/document-library.md). Incoming native issue handovers retain exact issue identity. Outgoing Project, Work order, Site, Asset, Organisation and Engineering references preserve receiving authority. `/documents/[id]` remains the issued-pack route.

## Desktop

Register: shared secondary menu, search/filter toolbar, 40 px shared grid rows, separate review/content/source/current-use facts, bounded paging and exact-revision links. Number and Updated sorting use signed continuations. Record: shared header, evidence strip, ruled context, Overview/Revisions/Findings/Links/History, native command panels and independent-review dialog. At 1440 × 900 and 1024 × 768 verify scroll ownership, wrapping, focus return, source labels and historical restrictions.

## Mobile

At 390 × 844 and 320 px, use the compact shell header and a flush document list; move filters into the panel. Record tabs scroll horizontally, context follows the main view and primary actions remain reachable. All controls need 44 px targets, keyboard focus, escape/close recovery and 200% zoom proof. Forms retain unchanged pending operations and warn on dirty navigation.

## States and fixtures

Cover loading, no matches, denied, failure/retry, stale revision, partial links/history, withdrawn, historical, unavailable exact content, independent-review refusal and uncertain save. Use synthetic fixtures only. Do not label a partial result as a complete total or treat Unreviewed as missing content.

## References and verification

[Retained icon-free captures](../../../reference/ui/document-library/document-library-figma-r01/README.md): 01–02 register/snapshot, 03–06 record, 07–13 commands, 14 tablet, 15–17 phone and 18 states. Live source frames were inspected read-only on 31 October 2026. Application screenshots at 1440, 1024, 390 and 320 px and focused browser/API evidence are recorded in the [workspace ledger](../../../testing/evidence/document-library/workspace/README.md). Developer comparison found and corrected toolbar spacing and the phone action/tab-bar overlap. Independent visual acceptance remains pending. No fingerprint is copied by this edit.
