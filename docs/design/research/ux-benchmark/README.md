---
document_id: PPO-UXB-RESEARCH
date: 2026-10-16
owner: Dean Fiedler
status: Research evidence and proposals for owner decision; 17 items adopted on 16 October 2026 (PPO-UXB-DEC-01), the rest proposed; owner review not recorded
source_commit: b223c5817be7a946b38c48c9838d9d9925298156
versioning: git
---

# PPO module UX benchmark — research record

This folder records the user-experience benchmark of every Powerplants One module, completed on 16 October 2026. It summarises the research and holds two registers generated from the reviewed report: [92 recommendations](recommendations.csv) and [24 amendment items](amendment-items.csv) that would change accepted designs. Every item is a **proposal for Dean's decision**; none is adopted. [Dean's direction](../../../decisions/ux-benchmark-research-direction.md) records what the research was authorised to do and how adopted items will be recorded.

Owner: Dean Fiedler. Review: Dean decided 17 items on 16 October 2026 ([UX benchmark decisions](../../../decisions/ux-benchmark-decisions-2026-10-16.md)); his decisions on the others are pending. Committing this record is not a review of its content.

No application code, route, migration, permission, design register entry, issued reference or parent requirement ID changes. All 78 parent IDs remain.

## Purpose

Dean asked for research to make every PPO module as professional and user friendly as possible. The benchmark compares each module with the products users rate highly in the same category and gathers what users of those products say. It turns the evidence into proposals tied to PPO's scope IDs and design register keys. Proposals are weighed against the five quality outcomes in the [product direction](../../../decisions/product-direction-quality.md):
- users find their work;
- understand state and next action;
- complete connected journeys;
- recover exact saved work;
- receive timely responses.

## Method

The research ran in four passes on 16 October 2026.

1. **Ten research streams.** Shell and cross-module patterns; CRM and customers; estimating, CPQ and quotations; projects and delivery; service, field and scheduling; equipment, maintenance and warranty; engineering and documents; products, inventory and supply; portal, assistant and reporting; innovation and UX standards. Each compared vendor documentation, release notes and expert guidance with a baseline of PPO today compiled from main `1552cfb`.
2. **User-feedback top-up.** Four streams gathered user voice from review platforms, app stores, ideas portals and vendor communities: field service and maintenance; CRM and estimating; projects and integrated suites; inventory, documents, AI and reporting. Three more streams read 57 Capterra listings directly to verify ratings.
3. **Independent check.** Five checks tested the report without editing it:
   - 377 unique links (715 occurrences);
   - 105 claims, covering the headline claims and the evidence behind the priority-1 items;
   - 135 PPO-today statements and all 24 amendment items, against `origin/main` at `b223c58` and the Figma working file;
   - the headline counts.

   Every finding that was not a plain confirmation was applied, and each edit was logged.
4. **Horticulture pass.** Two streams read the climate, irrigation and fertigation control software growers use, and how integrators serve growers, with the Australian grower context. Its PPO-today statements were checked against the same commit. It added UXB-85 to UXB-92.

## Evidence grades

| Grade | Source type | Treated as |
|---|---|---|
| A | Vendor documentation, help centres and release notes | Vendor fact |
| B | Review platforms: Capterra, Apple App Store, Trustpilot, Xero App Store, PeerSpot, SoftwareFinder, ProductReview.com.au | User claim |
| C | Forums, ideas portals and vendor communities | User claim |
| D | Usability research, academic studies, standards commentary, trade press and analyst surveys | Expert evidence |
| E | Vendor marketing | A claim, not a fact |
| I | The report's own reasoning | Inference |

A lowercase "s" marks a source read only through a search excerpt. A user-voice theme is recurring when three or more independent sources report it. Several reviews of one product on one platform count as one source.

## Headline findings

- **Build the connective tissue.** PPO's accepted page grammar already matches what the strongest single-module products converge on: grid registers, a snapshot window, a shared record page with a readiness bar and status in words. The higher value lies in the joins that integrated suites succeed or fail on:
  - one follow-up model across modules;
  - one search and command box;
  - shareable saved views;
  - a visible chain of linked records;
  - one status-and-feedback standard.

  PPO already has part of this (see below), so most of these moves extend what exists.
- **Users punish lost work, imposed change and silent failures.** In 2024–2026 reviews these weigh more than missing functions. Change pushed onto live work recurs in every category, alongside bugs and slowness at real data volumes. Accounting links that fail quietly at specific joints, such as GST rounding and payment allocation, recur too, MYOB links included.
- **Suites trail focused tools on ease of use by about 0.4.** Verified Capterra ratings put integrated suites at 3.8 to 4.2 (median 4.0) and focused CRM and project tools at 4.0 to 4.6 (median 4.4). The ranges overlap. The gap is what users pay in learning time for a connected chain.
- **Field apps must never lose input.** Technician reviews centre on four failures: rebuilt apps slower than the ones they replaced, crashes, input lost when a call comes in, and offline modes that fail in poor coverage. The Australian and New Zealand trade leaders were only bringing offline queues out of beta in 2026. Building the accepted My jobs offline design with autosave of unfinished input would set PPO apart (UXB-11, UXB-74).
- **PPO's largest exposure is its own migration.** There are 26 accepted Figma page designs and 211 page routes. Six designs are built (My Work only partly) and 20 wait to be built. Moving staff onto them will feel like a wave of redesigns. The report therefore proposes three rules (UXB-01, UXB-73):
  - finish modules whole;
  - announce what moved;
  - keep the old context until parity.
- **Horticulture: own the service trail around the controller.** PPO is a service provider, not a controller vendor. Its distinct value is one equipment and service history across vendors' systems, covering:
  - backup currency;
  - recorded setting changes and overrides;
  - the grower's consent to access;
  - an after-alarm service record.

  Control and alarm delivery stay with the controller platforms (UXB-85 to UXB-92).
- **What to leave alone.** The evidence shows these as sources of distrust:
  - chat-first assistants;
  - optimisation that applies itself;
  - opaque readiness scores;
  - weighted probability forecasts;
  - forced onboarding tours;
  - colour-only status;
  - redesigns made default before parity;
  - bots that replace a human contact route.

The report's executive summary groups the register into seventeen moves:

| # | Move (proposed) | Register |
|---:|---|---|
| 1 | Finish modules whole before drawing new ones | UXB-01, UXB-72 |
| 2 | Extend the one follow-up model to every module, with a written next-activity and stale rule | UXB-02, UXB-03 |
| 3 | Grow the existing search into a command palette | UXB-04 |
| 4 | Make saved views shareable and pinnable beyond My Work | UXB-05 |
| 5 | Show a linked-records chain on every snapshot and record header | UXB-06 |
| 6 | One status and feedback standard plus a WCAG 2.2 AA pass | UXB-07, UXB-08 |
| 7 | Parts readiness in the job-pack gate, and technician accept or decline with a reason | UXB-09, UXB-10 |
| 8 | Carrier and tracking fields on dispatch now; then a draft-approve-send communications record | UXB-14, UXB-84, UXB-15, UXB-35 |
| 9 | Build the accepted My jobs offline design and make phone capture lossless | UXB-11, UXB-74 |
| 10 | Turn the planner's unassigned-demand panel into a tray with reason-coded holds | UXB-12, UXB-31 |
| 11 | Finish the multi-site grower model in Customer 360 | UXB-13, UXB-24 |
| 12 | Commercial truth and follow-through in estimating | UXB-16 to UXB-20, UXB-77 |
| 13 | Commercial and schedule truth on the project record | UXB-27 to UXB-29 |
| 14 | An asset service passport and a coverage check that shows its reason | UXB-38, UXB-39 |
| 15 | A docked, labelled assistant with cited answers and proposal cards | UXB-52, UXB-53 |
| 16 | Change in the open, and fast at real volume | UXB-73, UXB-75, UXB-82 |
| 17 | Show the state of every value PPO hands to MYOB | UXB-76 |

Moves 7 and 8 answer three operational pain points Dean described on 16 October:
- technicians arriving without parts or to an unprepared site;
- no dispatch notice with freight tracking;
- no structured customer updates on long projects.

Those pain points come from conversation and are not yet a repository decision.

## What is already on main

The independent check found that, at `b223c58`, PPO already holds more of this than the first baseline recorded:
- one Activity model serves both `/sales/tasks` and `/work/actions`, with Overdue, Today and Upcoming groups;
- Ctrl/Cmd+K opens permission-trimmed record search, and an in-app notification inbox is built;
- personal saved views can be pinned in My Work;
- the planner's Move or reassign form is its keyboard route, and the Gantt shades weekends and has a baselines view;
- cost sources carry effective and expiry dates;
- CPQ explains its lines and has conflict states and a test bench;
- EN-07 records Unknown impact and requires dispositions;
- QR scan-to-open is built under [ADR-0045](../../../decisions/ADR-0045-equipment-native-workflows.md), and EQ-08 configuration backups are built;
- the assistant interface is [specified in text](../../../blueprints/ppo-assistant-specification.md) but not drawn or built;
- the [My jobs design](../../../decisions/my-jobs-figma-design.md) is merged, and its offline and timer rules were accepted as design on 15 October; it is not built;
- document metadata and access live in PPO's register;
- PPO makes no stock adjustments.

| On main (16 Oct) | Recommendations |
|---|---:|
| Largely built | 2 |
| Partly built | 43 |
| Designed: an accepted, proposed or text-specified design or a recorded rule covers it, but nothing is built | 9 |
| Not started | 38 |
| Not assessed | 0 |

So 54 of the 92 start from something built or designed.

**Live-app audit.** Later on 16 October, a live-app audit ran a compiled build of `origin/main` at `3e11502` with synthetic data. It opened 186 of the 213 page routes at 1440 × 900 and at 375 px wide. PPO averaged 2.9 of 5 against a world-class standard, and no module reached 4; Field scored lowest at 2.0, then Customers at 2.3. The audit settled the 13 items the check had not assessed: eight are partly built and five not started. The other 19 priority-1 states held, with two corrections:
- UXB-08: WCAG 3.2.6 is met, with the page guide and Quick Help in the same header place on every page except the offline page. 2.4.11 fails under sticky bars on phone, and 2.5.8 fails on many small controls.
- UXB-11: what runs today is the standalone offline workspace. The My jobs pages have no offline state, and keeping today's and tomorrow's visits on the phone is R7 design, not live.

The audit is recorded in Dean's private review material, outside the repository.

## What the registers hold

- **92 recommendations, UXB-01 to UXB-92.** 20 are priority 1, 56 priority 2 and 16 priority 3.
  - Priority 1 items are high impact with few dependencies, or bear directly on a stated pain point or open decision.
  - Priority 2 items mostly refine accepted designs or follow priority 1.
  - Priority 3 items are later or wait on an external decision.
- **24 amendment items, A01 to A24.** Each would reopen a design Dean has already accepted, and each states what is already there and what it would still change. Twenty-two are proposed. A22 and A24 were withdrawn after the check: A22's check passed, and A24 concerns stock adjustments that PPO does not make.

The full report also holds 123 patterns (PC-01 to PC-123), a user-voice digest and an innovation radar. Nine technology choices on the radar need an architecture decision record before any is chosen:
- maps and routing;
- SMS;
- weather;
- AI provider;
- a barcode decoder for supply barcodes;
- a grid library;
- a sync engine;
- Microsoft Graph mail and calendar;
- controller telemetry.

The report also offers thirteen **draft cross-module principles** for Dean to adopt, amend or reject. None is adopted.
1. Show the chain.
2. One next step, one place.
3. Explain before you block.
4. Propose, then confirm.
5. Words carry status; colour supports it.
6. Say what is missing, stale, partial, queued or simulated.
7. Frozen once issued.
8. Same pattern, same behaviour, any route.
9. Task-shaped phone that never loses input.
10. Accelerate without hiding.
11. Never lose work.
12. Authority stays visible.
13. Change in the open.

## Files

[recommendations.csv](recommendations.csv) has one row per recommendation:

| Column | Meaning |
|---|---|
| `id` | UXB-01 to UXB-92 |
| `priority` | 1, 2 or 3 |
| `recommendation_short` | The recommendation's lead clause, for scanning. Completed by hand from the same sentence for UXB-15, UXB-25, UXB-30, UXB-59 and UXB-61, where the clause stopped inside a list |
| `recommendation` | The report's full wording |
| `module_codes` | PPO module codes as the report gives them; blank where it names only register keys |
| `register_keys` | Design register keys as quoted in the report, separated by "; "; "A to B" is a range |
| `impact` | High, Medium or Low, with ranges such as Medium–High |
| `effort` | S (days), M (one to three weeks) or L (more than three weeks) of focused build. These are judgements, not sizings against code |
| `confidence` | The report's judgement of evidence strength and fit: High, Medium or Low |
| `evidence_grade` | Grades of the sources behind the item; see [Evidence grades](#evidence-grades) |
| `dependencies` | Decisions, designs or items it depends on; "amendment" points to the amendment items |
| `on_main_2026_10_16` | Largely built, Partly built, Designed or Not started, against `b223c58` and the Figma file. The 13 items the check did not assess take their state from the live-app audit at `3e11502` |
| `on_main_note` | The detail the report gives beside the state: the check's for UXB-85 to UXB-90, and the live-app audit's for the 13 items it settled and for UXB-08 and UXB-11. Elsewhere the recommendation's wording says what exists |
| `status` | Proposed, or Adopted (with the record in `decision_record`) |
| `decision_record` | Blank. Filled with the decision record's path when Dean decides the item |

[amendment-items.csv](amendment-items.csv) has one row per amendment item:

| Column | Meaning |
|---|---|
| `id` | A01 to A24 |
| `accepted_design_and_record` | The accepted design, with its decision record or Figma node |
| `already_there_2026_10_16` | What the check found already in the accepted design or on main |
| `proposal` | What the amendment would change. For A22 and A24 it is the item's original title from the report's change log, because their rows now carry only the withdrawal |
| `linked_recommendations` | UXB IDs, separated by "; " |
| `check_note` | The check's outcome where it qualified or withdrew the item |
| `status` | Proposed, Adopted (with the record in `decision_record`), or Withdrawn after check (A22 and A24) |
| `decision_record` | Blank. Filled with the decision record's path when Dean decides the item |

## Provenance

Both registers were generated by a one-off script from the reviewed report. The source is `PPO module UX benchmark reviewed.md`, dated 16 October 2026: 470,001 bytes, SHA-256 `dd58e2a385beb0582e80368d76e53175ce53bc14a7856726479a5e3ac43be41d`. The script removed Markdown formatting only. It checked that:
- the IDs run without gaps;
- the priority counts are 20, 56 and 16;
- each on-main state holds exactly the IDs the report's review log lists for it;
- there are 24 amendment IDs, with A22 and A24 withdrawn;
- all 297 register-key references exist in the [design register](../../development/register.json) at `b223c58`. UXB-72 also refers to the `/supply/*` routes in words;
- every field equals its source cell once formatting is removed.

After the live-app audit, 15 rows of the recommendations register were updated by hand to match the updated report: 475,390 bytes, SHA-256 `bed88bfbb62e96b81f3a819d01e37eb006d6ecc3724951111a25ce1b000fbb0b`. The changes are the on-main state and note of the 13 settled items, the notes of UXB-08 and UXB-11, and one clarified clause in UXB-11's wording.

The report, its review change log and the research notes are not committed. They run to about 470 KB, cite several hundred external pages and paraphrase third-party reviews at length. They remain in Dean's local working files. This record paraphrases them and quotes no third-party source.

Dean tracks his per-item decisions in a private review document outside the repository. The repository record of a decision is its decision record in `docs/decisions/`.

## Limits

- Reddit was unreachable by every route. G2 showed a bot check, so its figures are secondhand. Several vendor communities were blocked or have closed; some threads were read through archived copies.
- The first pass shared one search budget, which ran out part-way through each stream, and could not fetch review sites directly. The top-up read 57 Capterra listings directly.
- Much of the user voice comes from invited reviews, same-day review bursts or the roughly ten reviews an app store chooses to show. Frequencies are directional, not measured.
- No Powerplants staff, technician or grower has been asked yet. Grower voice is thin and mostly vendor-authored, and no Australian grower voice was found. UXB-92 proposes asking Powerplants' own growers before any grower-facing channel is built.
- Impact, effort and confidence are the report's judgements.
- PPO-today statements describe `b223c58` and the Figma file on 16 October and will date:
  - the Deal record and PJ-05 lock-ins were then only in open PRs #524 and #528;
  - the on-main state of 13 recommendations comes from the live-app audit at `3e11502` instead;
  - ES-08 and Fertigation explain-and-repair behaviour was not checked;
  - Figma was read through metadata and a few screenshots.
- The live-app audit could not open 27 record routes, which had no synthetic record. The seed holds little data for projects, deals and estimates, so those registers were not judged at volume. No screen reader or real phone was used.
- Which MYOB product Powerplants runs was not verified during the research. Dean confirmed MYOB Acumatica on 16 October 2026, so the evidence about MYOB Acumatica's interface applies.
- The reading of Australia's Farm Data Code behind UXB-87 is an interpretation, not legal advice.

## How to use this record

1. Decide item by item: Adopt, Adopt with changes, Defer or Reject. Nothing here is adopted by default, or by being built against.
2. Record each decision in `docs/decisions/`. Quote Dean's words, and cite the UXB or amendment IDs, scope IDs and register keys. Set `status` and `decision_record` in the register in the same pull request. Other columns stay as researched; Git history keeps every change.
3. An amendment item reopens an accepted design. Record it as an amendment in that design's own decision record, as [Products Amendment A1](../../../decisions/products-figma-design.md#8-amendment-a1--product-image-15-october-2026) was, with a named Figma version under [ADR-0053](../../../decisions/ADR-0053-figma-page-design.md).
4. A technology choice needs an architecture decision record first.
5. Build work follows `AGENTS.md`. Page work updates the design register, schema work carries the migration ripple, and owner visual review stays separate from build evidence.
6. Outside this folder, cite amendment items as "UX benchmark A01". This keeps them apart from a design's own amendment numbers, such as Products Amendment A1.
