---
document_id: PPO-SHELL-REFINED-BUILD-GATES-DEC
date: 2026-11-08
owner: Dean Fiedler
status: Owner decision 8 November 2026 ([DEAN] comment on PR #874); adds a page-header stage and a whole-shell comparison gate to the staged refined shell build; changes no application behaviour
versioning: git
---

# Refined shell: page-header stage and whole-shell gate

## Owner decision — 8 November 2026

The refined shell is built in stages from the accepted design ([PPO-SHELL-REFINED-FIGMA-DEC](shell-refined-concept-design.md)), with each stage built from the named version ([handoff decision](figma-named-version-build-handoff.md)). S1 ([PR #874](https://github.com/deanrfiedler-gif/powerplants-one/pull/874)) builds the 48 px bar. That bar no longer holds the breadcrumb, which the accepted design gives to the page header, so S1 added a separate breadcrumb band, a departure that sheet A does not show. Sheet Y shows the page header only as a skeleton inside the content region, and no shared page header has been designed or accepted.

Dean decided in a [DEAN] comment on #874 ([comment 6728218179](https://github.com/deanrfiedler-gif/powerplants-one/pull/874#issuecomment-6728218179)):

> My goal is that the shell matches the accepted Figma design exactly. For S1 I accept the separate breadcrumb band as a temporary bridge (finding 5's proposed departure), visible only to identities that opt in to the refined shell. Before the page-header stage is built, Claude designs the shared page header (title, breadcrumb, actions and tabs) in the accepted shell file for my acceptance under a new named version. That stage moves the breadcrumb and page hierarchy into the page header and removes the band. The refined shell becomes the default only after a whole-shell comparison against the named version, with every difference fixed or accepted by me. No change to S1 for this.

## Rules

1. **The goal is an exact match.** The finished refined shell matches the accepted design. No single stage is expected to match the whole design, because each stage builds only its part.
2. **S1's breadcrumb band is a temporary bridge.** It is accepted only for S1, and only for identities that opt in to the refined shell. It keeps the page hierarchy, the full-path title, the current-page marker and separators hidden from screen readers.
3. **A page-header stage replaces the band.**
   - Before it is built, Claude designs the shared page header (title, breadcrumb, actions and tabs) in the accepted shell file, at the design's desktop, tablet and phone sizes, and passes Design ready.
   - Dean accepts it under a new named version.
   - Codex then builds it from that version. The build moves the breadcrumb and page hierarchy into the page header and removes the band.
4. **Whole-shell comparison before default.** The refined shell stays opt-in until every accepted sheet has been compared with the running application at its viewport, and Dean has fixed or accepted every difference. Only then does it become the default.

## Limits

- This record adds a stage and a gate. It does not change S1, the accepted design or any decided question.
- The page header's design is not yet drawn. Until Dean accepts it, its layout is not decided.
- No application behaviour, route, migration, permission, token or parent requirement ID changes. All 78 parent IDs remain.

Reverse by: a later [DEAN] comment or owner decision.
