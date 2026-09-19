---
document_id: PPO-ADR-0028
revision: r01
date: 2026-09-19
owner: Dean Fiedler
status: accepted
source_commit: ade6d3db1b31db6e6377ac5f38b316c9e5e8e7ed
---

# ADR-0028 — Repository structure adopted as a forward target

## Status

**Accepted.** Owner: Dean Fiedler. Date: 19 September 2026.

## Related decisions and requirements

| Reference | Relationship |
|---|---|
| [ADR-0003](ADR-0003-prototype-architecture.md) — Prototype application architecture | **Extends.** ADR-0003 chose the application architecture; this records the folder and layer structure that architecture is expressed in. |
| [ADR-0005](ADR-0005-project-naming-adoption.md) — Project naming adoption | **Extends.** |
| [PPO-STD-001](../standards/naming-conventions.md) — Naming standard | **Extends.** Document naming is unchanged; this adds structural naming for code and folders. |
| [PPO-STD-002](../standards/PPO-STD-002-repository-structure.md) | The standard this decision adopts. |

**This decision extends those records; it supersedes none of them.** Nothing previously
decided in ADR-0003, ADR-0005 or PPO-STD-001 is reversed, narrowed or reopened here.

## Context and constraints

The repository has grown to roughly twenty folders under `src/`, twenty-eight design
packages, fifty-eight built-output folders and a documentation tree with several hundred
inbound cross-references. Structural choices have been made per pull request, each
reasonable in isolation, with no written record of the target they were heading towards.
The observable results include stylesheets named after the pull request that created them,
built output organised by neither the register family nor the producing package
consistently, and permission strings written as literals at every call site.

Two constraints shape every option below.

**The first is that this is a private prototype with real accumulated references.** Roughly
two hundred inbound references across the design index, decision records and reports point
at current paths. Those references are the traceability of the project; breaking them
costs more than the tidiness gained.

**The second is that there is no functional problem to solve.** The application works. Every
option here trades present risk for future clarity, so an option that carries real risk has
to earn it, and none of the rejected options below does.

An unresolved source fact: `src/login` and `src/offline` sit at domain level and are
arguably platform concerns. This decision deliberately does not resolve that; PPO-STD-002
section 14 records it as open. Likewise, two built-output folders have no page coverage
register family, which needs a register decision rather than a structural one.

## Options considered and rejected

The substance of this decision is what was **not** adopted.

### 1. A `src/modules/` wrapper folder

Placing every business domain under `src/modules/` so that domains are visually separated
from `app`, `platform`, `adapters` and `shared`.

**Rejected.** It changes every import path in the codebase for visual separation only. The
domain folders already sit at the right level; the wrapper adds a path segment without
adding a constraint. The real need — an unambiguous answer to "which folders are domains?"
— is met properly by the eslint boundary configuration, which is machine-checkable and
actually enforces the layer rules. **The authoritative list of domains belongs in the
boundary configuration, not in a folder name.** A folder name that is merely suggestive is
worse than a configuration that is enforced.

### 2. Mirroring `docs/design` folder names into `docs/reference/ui`

Renaming built-output folders so that each matches the design package that produced it.

**Rejected**, on three independent grounds.

- **It changes almost nothing.** Twenty-two of twenty-eight package names already match a
  built-output folder name. The proposal would change six.
- **Four of those six are genuine one-to-many relationships that a rename cannot
  express.** `customer-360` writes into both `customers` and `theme-style-board`;
  `sales-delivery-handover` writes into both `crm` and `quoting`. A single folder name
  cannot record that a package writes into two families. Forcing a match would have to
  either split the package or misattribute the output.
- **It cannot reach the actual problem.** Thirty-six built-output folders have no design
  package at all. The duplication this proposal is meant to reduce lives mostly in those
  thirty-six, which a renaming scheme based on package names cannot touch by construction.

There is a fourth, more serious objection. Mirroring would adopt **per-artefact
organisation for output** — organising built files by who produced them rather than by what
they cover. That is the fragmentation the exercise is trying to reduce, and adopting it as
the scheme would entrench it at precisely the point of trying to fix it. Output is
organised by page coverage register family, and source by build package, because they
answer different questions. They are bound by `design_source` and `builder` metadata
instead, which can express one-to-many and can describe a file with no producing package.

### 3. Renaming the `crm.*` permission namespace to `sales.*`

Aligning the permission namespace with the business vocabulary now used in the interface.

**Rejected.** Twenty-six distinct permission strings appear across forty-two source files,
and the same strings appear in database role grants. The rename therefore spans code and
data, and the two cannot be changed atomically.

**A half-applied rename of an authorisation identifier is an authorisation hole, not a
cosmetic bug.** A grant that still reads `crm.opportunity.edit` against a check that now
reads `sales.opportunity.edit` does not fail loudly — it denies access, or, depending which
side is missed, fails to deny it. The interface can say Sales without the identifier
changing; PPO-STD-001 already establishes that names are not primary keys.

### 4. Renaming the `CR` page family code

**Rejected.** The `CR` code is cited across the page coverage register, decision records and
reports. **It is the traceability key** — the thing that lets a reader connect a page, its
coverage entry, the decision that introduced it and the report that verified it. Renaming
a key to improve its readability destroys the property that makes it a key. It is an
identifier under PPO-STD-002 section 7 and is kept stable.

### 5. A single global stylesheet

Consolidating the CSS into one file.

**Rejected**, because it misdiagnoses the problem. **The current twelve files are already
global** — `layout.tsx` imports all of them, so every rule is already in scope on every
route. Merging them into one file would change the file count without changing a single
thing about scoping. The problem is not that there are twelve files; it is **fragmentation
without scope**: three of the twelve style the same board, four selectors are defined in
more than one of them, and no name says which rules it owns.

One file per module, named by scope, fixes the actual defect. It keeps module boundaries
visible in the file tree, gives every new rule an obvious home, and leaves per-route
imports possible later — which a single merged global file would foreclose.

### 6. A big-bang migration to the target structure

Moving the existing tree to conform in one co-ordinated change.

**Rejected.** Roughly two hundred inbound references across the design index, decision
records and reports would need updating, against **no functional gain whatsoever** — the
application behaves identically before and after. The cost is a large, conflict-prone
change touching nearly every path in the repository, and the benefit is realised just as
fully by adopting the target forward-first and letting files move when they are already
being edited.

Forward-first adoption captures the value without the risk. It also front-loads nothing:
the structure applies to new work immediately, which is where most of the value is.

## Selected decision

Adopt [PPO-STD-002](../standards/PPO-STD-002-repository-structure.md) as a **forward
target**: the layer model, folder map, module public surfaces, permission registry rule,
naming conventions, stylesheet rule and revision retention rule described there.

New files conform from creation. Existing files move only when they are already being
changed for another reason. The adoption table in PPO-STD-002 section 13 governs the order
of any retrofit that is undertaken, and schedules none of it.

## Consequences

- **New files conform from creation.** This is the operative effect of the decision.
- **The adoption table in PPO-STD-002 section 13 governs retrofit**, in the order given,
  cheapest and lowest-risk first. It commits to no dates.
- **Nothing in the current tree becomes non-conformant by virtue of this decision.** No
  file is in breach, no cleanup is owed, and no existing pull request needs to change.
- **Nothing is migrated by this decision.** It moves no file and changes no code.
- The eslint boundary configuration becomes the authoritative list of domains once step 2
  of the adoption table is taken; until then, the layer model is documentation.
- Two questions are explicitly left open (PPO-STD-002 section 14): whether `src/login` and
  `src/offline` belong in platform, and which register families cover the two
  `quality-*` built-output folders.

### Migration and compatibility effects

None. No file is moved, no import path changes, no permission string changes, and no
database object is touched. Every existing inbound reference continues to resolve.

## Reversal path

**The standard and this ADR can be superseded by a later ADR, and no code or data depends
on either.** Because the decision moves nothing, reversing it requires writing a record —
not undoing a change. Any structural work later undertaken under the adoption table is
reversible on its own terms, as an ordinary revert of the pull request that performed it.

## Validation evidence and remaining questions

Every figure quoted above was measured against the repository at `ade6d3d`, the commit this
ADR was written on:

| Claim | Measured |
|---|---|
| Permission literals | 26 distinct strings across 42 files under `src/` |
| Deals board stylesheets | 3 files, 1,830 lines, 4 selectors defined more than once |
| Globally imported stylesheets | 12, all imported by `layout.tsx` |
| Design packages matching a built-output folder name | 22 of 28; 6 differ |
| Built-output folders with no design package | 36 |
| Built reference HTML | 192 files; 29 builders write 33; 159 have no builder |

Remaining questions are those recorded in PPO-STD-002 section 14, which this decision does
not resolve.
