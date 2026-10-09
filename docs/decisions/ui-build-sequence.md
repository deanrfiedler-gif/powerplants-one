---
document_id: PPO-UI-SEQ-DEC
date: 2026-10-09
owner: Dean Fiedler
status: Adopted sequence rules SD-01 to SD-05 (9 October 2026); phase 00 owner verdicts recorded 9 October 2026; other placements and pages not owner-reviewed
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

## Phase 00 review, session 1 (9 October 2026)

Claude prepared the first review session; the verdicts remain Dean's.

- **Material:** [the evidence set](../testing/evidence/ui-review-phase-00-r01/README.md) holds 42 hashed captures of all 30 phase 00 entries at 1440 and 390 px from the running app, plus the automated checks and the findings.
- **Automated checks:** every page answered 200 in about 2 s, with no horizontal overflow, console errors or failed API calls. One shared contrast failure, the search shortcut hint, appears on 18 desktop pages.
- **Shared findings:** S1 to S9. Under SD-02 these are fixed first in the shell, theme and guidance, because each one fixes many pages.
- **Claude's proposed verdicts:** 7 accept, 5 accept with minor fixes, 16 refine, 1 own session (theme, through the component catalogue) and 1 later phase (FI-07, with SV-06).
- **Owner verdicts (9 October 2026):** Dean accepted the proposed verdicts. 28 entries now hold an owner visual review: a record in the page contract, then the reviewer, date and fingerprint in the register. Of these, 7 are accept, 5 accept with minor fixes and 16 refine. The theme review is deferred to a component-catalogue session, and FI-07 to phase 04. Phase 00 is not complete under SD-05 until the refinements have recorded outcomes.
- **Refinement batch 1:** the shared shell findings S1, S2, S4 and S7 are fixed; S3 was withdrawn after verification ([evidence](../testing/evidence/ui-refinement-batch-1/README.md)). The 28 reviews are now stale and need a fresh owner look. S5, S6, S8, S9 and the page-level refinements follow in later batches.

## Phase 00 refinement canvas (9 October 2026)

Dean asked for refinements to be worked on a separate board. Each phase gets its own refinement canvas, so the navigation canvas stays an architecture record.

- **Canvas:** [PPO UI refinement · Phase 00](https://claude.ai/artifact/E5wdx1FiF3ZUVb86oXps2E). It is private to Dean and is built with the Powerplants One design system.
- **Shared rules:** three boards propose S6 (one date and time format), S5 (plain wording in place of specification text) and S9 (page guide content). S6 asks Dean to choose between 24-hour times, which are the current rule, and am/pm.
- **Pages:** four pairs for My Work. Each pair has a "today" board with the batch 1 captures and a proposed desktop and phone layout. The pages are the overview, the activity record, Create activity and Reviews & handovers.
- **Proposed new behaviour:** Create activity fills in the working company. Today the user chooses it. Reviews & handovers renames tab and filter labels (All I can see, Area, Type, Owner) and shows exact counts in place of "(0+)".
- **Next on the canvas:** Sales and Service phase 00 pages.

The canvas is a proposal. Nothing on it is adopted until Dean marks it up or accepts it, and nothing changes in the app until a later batch builds it with fresh evidence. The repository remains the authority. The canvas has no retained capture.

### Owner decisions (9 October 2026)

Dean replied: "24-hour; accept S5, S9 and all My Work proposals".

| ID | Decision | Applies |
|---|---|---|
| S6 | Adopted, with **24-hour** times: year always shown; every scheduled time carries its zone and offset, e.g. "4 Sep 2026, 10:00 AEST (UTC+10)"; dense lists state the zone once; relative urgency keeps the actual date beside it; internal zone names such as Australia/Brisbane are never shown. Built as one shared formatter with its own tests. | Every phase 00 instance on the board |
| S5 | Adopted: each listed instance is rewritten in plain words, moved to the page guide or hidden. Statements that protect people stay visible in plain words; synthetic and fictional-data labels stay. | Every phase 00 instance on the board |
| S9 | Adopted: the drafted My Work guide becomes the page guide, and the development draft disclosure and revision label are shown only in the development workspace. The guide stays a draft in the register until Dean reviews it in the running app. | My Work, then each phase 00 page |
| My Work | All four proposals accepted: the overview, activity record, Create activity and Reviews & handovers. This includes the new Create activity behaviour: the person's working company is filled in for them and can still be changed. | `route:/work`, `/work/[id]`, `/work/new`, `/work/reviews`, `/work/waiting` |

**Build order.** Batch 2 builds the shared S6 formatter, S9 and the My Work pages, with the S5 and S6 instances on those pages. The S5 and S6 instances on Sales, Planner, Appointment, Field and Offline pages are built with those pages' own refinements in later batches, so each page changes once and is recaptured once. An acceptance here is a design decision; each built page still needs Dean's fresh visual review in the register before phase 00 closes (SD-05).

**Batch 2 built (9 October 2026).** The shared S6 formatter, the four My Work pages, the Blocked & waiting wording and the My Work guide are built ([evidence](../testing/evidence/ui-refinement-batch-2/README.md)). Two points differ from the drawings:

- **Access labels:** the canvas said "Service team only". The real rule is "Anyone who can see the linked record" (RestrictedService). The boards and the app use the accurate wording.
- **Company prefill:** if the person has no working company but can reach only one company, that company is filled in, as the header already shows it.

Every affected entry's owner review stays stale until Dean looks at the built page.

## Where it is shown

The navigation architecture canvas gains a **UI build sequence** board drawn from the generated data. The repository files remain the authority. The board was added after the r02 capture set, so no capture of it is retained.

## Still open

- Owner review of individual placements, starting with phase 00.
- Whether any r02 rank should change now that most of phases 00 to 06 is built. No re-ranking is proposed without that review.
