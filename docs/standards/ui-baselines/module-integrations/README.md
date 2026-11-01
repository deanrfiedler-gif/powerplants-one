# Module integrations

<!-- versioning: git; committed history is authoritative -->

**Owner:** Dean Fiedler · **Decision:** [PPO-MERGE-CONFLICT-DEC](../../../decisions/merge-conflict-reduction.md), 27 October 2026 amendment

A page build that integrates an accepted design into the shell records its host contract in one new file here, named by its id: `<id>.json`. It no longer appends to `module_integrations` in [`../../ui-baselines.json`](../../ui-baselines.json), which every such build appended to. That array is frozen at its 66 entries; existing entries stay there and may be corrected in place.

Each file holds one object with the same fields as the array's entries: `id`, `route`, `scope` (with `#`), `layout`, optional `scroll_owner`, `design` and `sha256`, `shared_design` and `shared_sha256`, `component_proof`, `application_proof`, `authority` and `adaptations`. The route's entry in `src/shell/module-workspaces.ts` names the id as its `baseline`.

`tests/helpers/ui-baselines.ts` reads the array and then these files in name order. The conformance test (`tests/ui/deals-design-conformance.spec.ts`) checks every route-table entry against its integration and recomputes both hashes, and the browser specs read their own entries through the same helper. `tests/unit/ui-baselines.test.ts` fails if the array grows, if a file's name differs from its id, if a field is missing or if an id repeats. The files are JSON, so a change here runs the full suites. The baseline register's other parts (`baselines`, `viewports`, `shared_token_core`, `known_divergences`) are unchanged.

To convert a branch that appended to the array: take `main`'s `ui-baselines.json` and move the branch's own entries into one file each here.
