---
title: Page-build shared-list hotspots measured; restructuring proposed
date: 2026-10-27
---

The [merge-conflict record](../decisions/merge-conflict-reduction.md#amendment--27-october-2026-page-builds-stop-appending-to-shared-lists-proposed) gains a **proposed** amendment. Dean has not decided it, and no application, test, script or workflow file has changed.

What was measured, with `git merge-tree` on exact heads (26 October 2026, about 21:45 UTC, `main` at `923f1284`): all six pairs of the four page builds in #717 (#696, #697, #700, #701) conflict, and so did #717's own merges of #700, #701 and #697. Of 200 merges made since 19 October, 70 had conflicted. Ranked page-build hotspots: `components.json` and the component specifications (every pair, 24 merges each), the root-ID selector lists in `my-work.css` and `figma-shell.css` (165 lists each new page joins), `module_integrations` in `ui-baselines.json`, the route table in `module-workspaces.ts`, `register.json` and `guides.json`, and dated sections at the end of contracts. The eight queued Codex claims carry no implementation yet. `STATUS.md` and the decisions index have not conflicted since 23 October.

Proposed: consumer binding files instead of appends to `components.json` and the specifications; frozen ID lists plus one opt-in attribute (`data-ppo-workspace="shared"`) with unchanged specificity; one file per `module_integrations` entry; sorted, order-independent route entries; no change yet for the register and guides; and a placement rule for contract changes. Each would land as its own pull request after #717, with a conflict replay, the repository checks and, for CSS, green browser suites with no visual change.

Checked for this change: the Python documentation checks and `build_status.py --check`. `npm run check` and the browser suites were not run, because no application file changed. Open: Dean's decision, and the three questions at the end of the amendment. Also found: once #717 lands, three design builds that pin `docs/contracts/document-issue-distribution.md` by hash will refuse to run until the pins are reviewed and updated.

<!-- decision-index -->
[Merge-conflict reduction](../decisions/merge-conflict-reduction.md) (PPO-MERGE-CONFLICT-DEC) has a proposed 27 October amendment for page-build shared lists, awaiting Dean's decision.
