---
title: Page-build shared-list hotspots measured; restructuring adopted
date: 2026-10-27
---

The [merge-conflict record](../decisions/merge-conflict-reduction.md#amendment--27-october-2026-page-builds-stop-appending-to-shared-lists) gains a 27 October amendment. Claude first proposed it with three questions. Dean replied "Proceed however you believe is the most professional", which delegates the choice, so the recommendations are adopted as written. This contribution changes no application, test, script or workflow file; each hotspot changes in its own pull request.

What was measured, with `git merge-tree` on exact heads (26 October 2026, about 21:45 UTC, `main` at `923f1284`): all six pairs of the four page builds later merged by #717 (#696, #697, #700, #701) conflict, and so did #717's own merges of #700, #701 and #697. Of 200 merges made since 19 October, 70 had conflicted. Ranked page-build hotspots: `components.json` and the component specifications (every pair, 24 merges each), the root-ID selector lists in `my-work.css` and `figma-shell.css` (165 lists each new page joins), `module_integrations` in `ui-baselines.json`, the route table in `module-workspaces.ts`, `register.json` and `guides.json`, and dated sections at the end of contracts. `STATUS.md` and the decisions index have not conflicted since 23 October.

Adopted: consumer binding files instead of appends to `components.json` and the specifications; frozen ID lists plus one opt-in attribute (`data-ppo-workspace="shared"`) with unchanged specificity; one file per `module_integrations` entry; sorted, order-independent route entries; no change yet for the register and guides; and a placement rule for contract changes, now in [CONTRIBUTING.md](../../CONTRIBUTING.md#working-in-parallel). Codex does not hold new builds; a build in progress converts once for each change that lands under it.

Checked for this contribution: the Python documentation checks and `build_status.py --check`. `npm run check` and the browser suites were not run locally, because no application file changed; CI ran the full suites on the first head. Open: an independent second-model review of the amendment, which CONTRIBUTING requires for an owner decision paper. Also found: three design builds pin `docs/contracts/document-issue-distribution.md` by hash, and on `main` after #717 the file no longer matches the pin, so those builds refuse to run until the change is reviewed and the pins are updated.

<!-- decision-index -->
[Merge-conflict reduction](../decisions/merge-conflict-reduction.md) (PPO-MERGE-CONFLICT-DEC) gains a 27 October amendment: page builds stop appending to shared lists, adopted under Dean's delegation.
