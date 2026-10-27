---
title: Module integrations become one file each
date: 2026-10-27
---

This is the fourth hotspot change under the 27 October amendment to the [merge-conflict record](../decisions/merge-conflict-reduction.md). A page build records its shell integration contract in its own file, `docs/standards/ui-baselines/module-integrations/<id>.json` ([folder guide](../standards/ui-baselines/module-integrations/README.md)). It no longer appends to `module_integrations` in `docs/standards/ui-baselines.json`, which three of the six pairs of #717's page builds conflicted on. The array is frozen at its 66 entries; existing entries stay.

All four readers now go through `tests/helpers/ui-baselines.ts`, which returns the array followed by the files in name order: the conformance spec and the FI-06, FI-07 and FI-03 browser specs. Every reader finds by unique id, so order does not matter to any of them. `tests/unit/ui-baselines.test.ts` fails if the array grows, if a file's name differs from its id, if a required field is missing or if an id repeats. The rest of the baseline register (`baselines`, `viewports`, `shared_token_core`, `known_divergences`) and its readers are unchanged.

Verified:
- The four builds' changes to `ui-baselines.json` were pure appends. As five files beside the pre-#717 array, they give exactly `main`'s 66 integrations.
- On that converted tree, the conformance spec's loop run through the helper checks all 64 route-table entries with no problem: route, scope, layout, both recomputed hashes and the three proof paths.
- Replaying the converted builds pairwise, no pair conflicts on the register; before, three did.

Not changed: `CONTRIBUTING.md` (the entry-folder line is the one the component-bindings change also edits, so it follows once that lands), and the route table, which is the next hotspot.
