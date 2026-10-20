# Discovery costing implementation evidence

Scope: ES-02, `/estimating/discovery/[id]/costing`. Source: **PPO - Design**, page `1431:809`, **Discovery costing — accepted**; full frame inventory and departures are in the [page contract](../../../design/development/pages/route-estimating-discovery-id-costing.md). Owner visual review remains pending.

Implementation starts from `971ac3502f87d5ba7e093bbe37abc83e75d4fb99`. Synthetic browser fixture: `tests/helpers/discovery-costing-presentation.ts`; browser spec: `tests/browser/discovery-costing-presentation.spec.ts`; exact arithmetic/provenance unit proof: `tests/unit/discovery-costing-presentation.test.ts`. No operational exports, Figma links, private artwork or data-model changes are included.

## Proof boundary

The browser tests mount the real route, shell and components with synthetic API responses. They exercise line edits, validation, source handovers, immutable native adoption payloads, pending/uncertain/denied outcomes, stale discovery and 1440/1024/390/320 px layouts. They do not prove database persistence or grant authority. Native costing services and their existing tests are unchanged. Screenshot capture blocks private kit hosts and uses existing local fallback glyphs.

## Local execution

Execution is in a dedicated Windows worktree with pinned dependencies installed by `npm ci`. The first borrowed dependency junction was rejected by Turbopack; it was removed without traversing its target and replaced with an independent install. A subsequent production build reached Next.js 16.4.2 but encountered Windows OS error 1450 (insufficient system resources) while reading a dependency. That attempt is not a successful build or evidence of a page regression.

Final check results and visual observations are recorded below when execution completes. Owner review, physical-device/screen-reader checks and hosted deployment are not performed by this change.

## Design limits retained for review

The native scope comparison renders saved narratives and exact source-identity changes instead of manufacturing the illustrated quantities. Phone line editing is authorised but undrawn; desktop uses the same labelled editor. Cost types remains unavailable, and Alternatives/Revisions hand back to the existing workspace. The shared compact phone header is retained. See the page contract for Dean's open questions; these are not silently marked accepted.
