---
document_id: PPO-UI-SEQ-DEC
date: 2026-10-09
owner: Dean Fiedler
status: Adopted sequence rules SD-01 to SD-05 (9 October 2026); placements and pages not owner-reviewed
source_commit: 5005e7e1763bd53a28b47d6d48f3c87210f5cc1c
versioning: git
---

# UI build and review sequence

On 9 October 2026 Dean asked for one page listing every UI page that still needs to be created or refined, and the order in which to work through them, starting from a home page. He asked for the most professional approach.

## What already existed

Dean's request did not need a new inventory or a new order:

- **Inventory:** the live design register (`docs/design/development/register.json`) holds every page and scope: 350 entries, made up of 196 routes, 150 scopes and 4 shared systems. It also records each entry's build, visual-review and functional-proof status.
- **Order:** the r05 App Page Register issued build plan r02 on 23 September 2026. It is a dependency-led sequence of 12 phases (00 to 11) with an explicit predecessor list for each of the 150 scopes. Its rank 1 is SH-01, the role-based home overview. r02 describes itself as "not an approved schedule or an estimate of effort".

A second, hand-made list would drift from both. The sequence is therefore **derived**: `scripts/build-ui-sequence.py` reads the register and the issued plan, then writes [the generated sequence](../design/development/ui-build-sequence.md) and its JSON data. The `--check` mode fails if either output is stale. No `build_rank`, scope ID or issued byte is changed.

## Today's position (generated at this commit)

| Measure | Count |
|---|---:|
| Register entries | 350 |
| Placed in a phase | 347 |
| Excluded (development tooling) | 3 |
| Built, awaiting owner visual review | 190 |
| To refine | 105 |
| To build | 46 |
| Awaiting a scope decision (phase 11) | 6 |
| Owner visual review recorded | 0 |

The bottleneck is review, not building: no entry has an owner visual review recorded yet.

## Departures from r02, adopted 9 October 2026

The r02 phase order and every issued rank are kept. Five rules are added on top. Dean adopted SD-01 to SD-05 on 9 October 2026 and started the phase 00 review. Adoption covers the rules, not each placement: individual placements and every page still need owner review.

| ID | Rule | Reason |
|---|---|---|
| SD-01 | A register entry added after r05, and therefore unranked, takes the phase and rank of its first ranked related scope. This places 79 routes; each row shows its placement basis. Development tooling routes are excluded. | Every entry lands in exactly one place by a rule anyone can rerun. To move an entry, edit its register record, not the generated output. |
| SD-02 | The four shared systems (shell, theme, guidance, offline) belong to phase 00. | They already exist and every page depends on them, so they are verified with the baseline. Changing a shared template fixes many pages at once. |
| SD-03 | Two tracks run in phase order. The **review track** covers built and to-refine entries and starts at phase 00. The **build track** covers unbuilt entries and starts at phase 01 (AD-01 first). Within a phase, review and refinement come before new builds. | Review is the constraint. Refinements to templates and shared controls should land before new pages copy them. The tracks are independent queues, so a review never waits on a build. |
| SD-04 | Walk one synthetic job, from customer to management report (15 steps), after each phase as far as the built pages reach. Re-check SH-01 home and SH-02 My Work after phase 08. | Phase order is not journey order. The walk shows handover gaps that page-by-page review misses; the 8 October direction asks for exactly these connected journey walks. Home aggregates later phases, so its content is only judgeable once they exist. r02 asked to "recheck affected flows after every later phase"; this makes the check concrete. |
| SD-05 | A phase is complete when every placed entry has an owner visual review recorded in the register and every to-refine entry has a recorded outcome. Functional proof and deployment stay separate statuses. | Gives each phase a finish line that is visible in the register, without folding review into implementation evidence. |

## Phase 00 first

The first review phase is the existing baseline. It contains:

- the 4 shared systems;
- SH-01 role-based home;
- SH-02 My Work;
- SV-04 appointment detail;
- PL-01 service planner;
- FI-01 technician Today;
- FI-02 offline;
- FI-07 attendance and report response;
- their 19 routes.

Starting here matches Dean's suggestion to begin with the home page.

## Where it is shown

The navigation architecture canvas gains a **UI build sequence** board drawn from the generated data. The repository files remain the authority. The board was added after the r02 capture set, so no capture of it is retained.

## Still open

- Owner review of individual placements, starting with phase 00.
- Whether any r02 rank should change now that most of phases 00 to 06 is built. No re-ranking is proposed without that review.
