---
title: Route table sorted, with lookup order made explicit
date: 2026-10-27
---

This is the fifth hotspot change under the 27 October amendment to the [merge-conflict record](../decisions/merge-conflict-reduction.md). The entries of `moduleWorkspaces` in `src/shell/module-workspaces.ts` are now one line per route, sorted by route. A page build inserts its route in its own place instead of beside every other new page. #696 and #701 conflicted because both inserted at the top.

`moduleWorkspaceForPath` no longer depends on entry order. It tries an exact route first, then a record pattern (`[id]` as a 36-character id), then the module rules (Surveys records, the five prefix modules and Estimate wizard records). Under the old first-match rule, one path was order-sensitive: `/estimating/discovery/<id>` matched both `es02-r01` and `es02-costing-figma`. The record pattern still returns `es02-r01`.

`tests/unit/module-workspaces.test.ts` fails if the table is out of route order, if a route repeats or if two entries share a line, and it pins the precedence cases. The file is unchanged apart from the order of the 64 entry lines, one removed blank line, the new lookup and a comment.

Verified:
- Compared with `main`'s lookup over 379 probe paths (every route, its record form with a real id, child, trailing-slash, upper-case and malformed forms, and unrelated paths), the new lookup returns the same entry for every path; 113 paths match a workspace.
- The set of 64 entries is byte-identical.
- Replaying the four builds' route additions on the sorted table, #696 × #701 no longer conflicts, and no pair does.
