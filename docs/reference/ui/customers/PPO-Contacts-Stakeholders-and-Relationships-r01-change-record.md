---
document_id: PPO-CS02-CHANGE
title: Contacts, Stakeholders and Relationships r01 change record
revision: r01
date: 2026-09-18
owner: Dean Fiedler
status: First issue record
source_commit: 01b9824a63e468b393265b159fa681f83f6e668c
---

# CS-02 / CS-03 Contacts, Stakeholders & Relationships r01 — change record

## Deliverable

| Field | Value |
|---|---|
| File | [`PPO-Contacts-Stakeholders-and-Relationships-r01.html`](PPO-Contacts-Stakeholders-and-Relationships-r01.html) |
| SHA-256 | `cd5f0be8e9000bcec683e44d806fd9e2a6147efc2cee4f72ca2554eea2287d40` |
| Bytes | 253,388 |
| Predecessor | **None.** First issue. CS-02 is register state D — a refinement of the live `/people` and `/people/[id]` surfaces — but no standalone design file preceded this one, so there is no predecessor SHA-256 to record |
| Scope container | `#ppo-contacts` |
| Base commit | `01b9824a63e468b393265b159fa681f83f6e668c`, with `origin/main` `be219114` merged in after PR #239 landed |
| Fixture manifest SHA-256 | `9cbb53da18964a4691921f32122515d4ff6c6810375f612b983d889c3dab32e4` |

## What changed

First issue. The package introduces, against page-register entries CS-02 and CS-03:

- Six connected views over one synthetic contact collection: directory, contact record, stakeholders and relationships, reliance and obligations, proposals and duplicates, history and explanation.
- Four preview roles producing genuinely different result sets, including a site-scoped technician who sees exactly one of ten contacts.
- The derived Person visibility rule rendered as a step-by-step explanation rather than applied silently.
- A four-value presence vocabulary — present, restricted, none, unknown — used by every list, count and panel.
- A downstream reliance view over fourteen bindings, each naming its contract column and its owning module.
- A correction and duplicate workflow in which every apply is labelled **Simulated**, because no command exists for any of it.
- Maintained sources under `docs/design/contacts/` and a deterministic Python builder.

## What was verified

| Check | Result |
|---|---|
| `scripts/build-contacts-design.py --check` | Verified byte for byte |
| `scripts/check-contacts-model.mjs` | 102 groups, 102 passed, 0 failed |
| `scripts/check-contacts-browser.mjs` | 60 groups, 60 passed, 0 failed, pinned Chrome channel |
| Page / console / request errors | Zero |
| Horizontal overflow, four declared viewports | 0 px, every view |
| Phone targets at 390 px | None under 44 px |
| Keyboard-only completion | Correction proposal and duplicate resolution |
| `check_foundation.py` / `check_prototype.py` / `check_naming.py` | All passed, 0 errors |
| Conflict markers in `docs` / `git diff --check` | No output |

Full detail is in [§10 of the report](PPO-Contacts-Stakeholders-and-Relationships-Report-r01.md): five defects found by the checks, and two more found by the owner's visual review — unpainted icon placeholders, and a selection ring applied per cell that gave the selected row column rules no other row had. All seven are fixed, and the two visual ones now have checks that fail when they return.

## What was deliberately left unchanged

- **The three known token divergences.** `--surface-hover`, `--line-soft` and `--success-tint` are not resolved by this package. It adopts the Field Technicians r05 side, which is also the side the r22 board itself carries; the stylesheet records that and the model check measures it.
- **`docs/standards/ui-baselines.json`.** This module is a standalone design, not an application integration, so it triggers no registration and none was made.
- **Every existing file under `docs/reference/ui/`** other than `README.md`. Issued bytes are untouched.
- **Everything under `src/` and `db/`.** No application, API, migration, seed, permission or deployment change.
- **`role_label` as free text.** No vocabulary exists in the repository; any taxonomy is labelled Proposed.
- **`contact_preference` as free text.** Rendered with no consent semantics, matching the data dictionary and the API contract.
- **One optional primary contact per site.** The contract limit is held, not extended.

## Corrections to the build plan

Two statements in `docs/delivery/contacts-stakeholders-build-plan.md` did not survive contact with the repository. Both are recorded rather than silently worked around:

1. **§10 describes the Person projection as "the seven fields in `reads.ts`".** It returns nine, which the plan's own §4.1 enumerates correctly. The check derives the list from the source.
2. **§8 describes "Northbank and Willowbank Hort" as organisations already in issued designs.** Willowbank Horticulture is an organisation in CS-01 r01; **Northbank is a site name** — `Rothwell Glasshouse — Northbank` — belonging to Rothwell Glasshouse Group. CS-01 r01 also carries no customer contacts at all, so every contact here is new.

## Decisions the owner still has to make

1. **Role vocabulary.** Build-plan open question 3, still open. `role_label` stays free text; fixture roles are fictional. If a real Powerplants vocabulary exists it belongs in a later revision.
2. **Whether any of the seven proposed extensions should be adopted**, each costed in the [decision record](../../../decisions/contacts-stakeholders-design.md).
3. **Native visual review.** Not claimable from the build environment.

## What this record does not establish

Owner acceptance, application integration, browser or print acceptance, accessibility certification, or production readiness. A passing check is component evidence. Publication is not approval.
