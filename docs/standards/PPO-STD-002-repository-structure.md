---
document_id: PPO-STD-002
title: Repository structure, layer model and naming
revision: r03
date: 19 September 2026
owner: Dean Fiedler
status: Adopted as a forward target; existing files move only when already being changed
---

# Repository structure, layer model and naming

| Document control | Value |
|---|---|
| Document ID | **PPO-STD-002** |
| Short title | Repository Structure Standard |
| Revision | **r03** |
| Status | **Adopted as a forward target** |
| Prepared for | Dean Fiedler — private prototype owner |
| Authoritative working path | `docs/standards/PPO-STD-002-repository-structure.md` |
| Related | [PPO-STD-001](naming-conventions.md), [ADR-0028](../decisions/ADR-0028-repository-structure.md) |
| Scope of this edition | Folder structure, layer model, module surfaces and structural naming |

## 1. Purpose and adoption

This standard records the target structure of the `powerplants-one` repository: how
folders are organised, which layer may depend on which, what a domain exposes to the rest
of the application, and how structural names are chosen.

Adoption is **forward-first**. Every new file follows this standard from the moment it is
created. Existing files are retrofitted **opportunistically** — when a file is already
being changed for another reason, it moves to its target location as part of that change.

**Conformance is not expected of the current tree.** No file in the repository becomes
non-conformant by virtue of this standard being adopted, and nothing is migrated on its
account. There is no migration project, no deadline and no sweep. A file that never needs
changing may stay where it is indefinitely without being in breach.

Where this standard records "the current position", it states a measured fact about the
repository at the commit this revision was written against. Those measurements are
evidence for the rule that follows; they are not defects logged against anyone.

## 2. Layer model

Dependencies run in one direction:

```
app  ->  domains  ->  platform / adapters  ->  shared
```

Each layer may import from its right, never from its left.

| Layer | Purpose | May import from |
|---|---|---|
| `app` | Routing, page composition and layout. Holds no business rules. | domains, platform, adapters, shared |
| domains | One business capability each. Owns its model, reads, commands and permissions. | platform, adapters, shared |
| `platform` / `adapters` | Cross-cutting services: identity, permissions, errors, database access, external system calls. | shared |
| `shared` | Generic UI primitives and library helpers with no business meaning. | nothing in this repository |

Two further rules apply across the domain layer:

- **No domain may import another domain's internals.** A domain reaches another domain
  only through its public surface (section 4). Importing from `../crm/reads` is a breach;
  importing from `../crm` is not.
- **A lower layer never imports a higher one.** `shared` does not know that `crm` exists,
  and `platform` does not import from `app`.

The rules above are **not currently enforced**. No eslint boundary configuration
exists in this repository. When one is added it becomes the authoritative,
machine-checkable statement of these rules, and where this section and that
configuration disagree, the configuration is the one that runs.

### The current position

Measured on `main` at the commit this revision was written against, the domain
layer does not follow these rules. This is recorded as a fact, not a defect list:
the rules describe where the code is going, not where it is.

- **122 cross-domain imports** across **34 ordered domain pairs**
- **No domain has an `index.ts`**, so every cross-domain import reaches into
  another domain's internal files — `../crm/context`, `../documents/packs`,
  `../scheduling/planner` and so on
- At least **4 circular pairs** exist, where each domain imports the other:
  `activities` and `crm`, `activities` and `service`, `documents` and `finance`,
  and `documents` and `reports`

The heaviest couplings are `finance` to `documents` (13 imports), `reports` to
`documents` (13), `crm` to `activities` (10) and `offline` to `field` (10).

Two consequences follow for section 13:

- **Adding eslint boundary rules is not step 1 and is not low risk.** Enabled
  against the current tree it fails lint at every one of those imports. It is
  enforceable only after public surfaces exist.
- **A circular pair cannot be resolved by adding a surface at each end.** A cycle
  needs one direction broken, which means deciding which domain owns the shared
  concept. Those are design decisions, and they are unresolved.

`scheduling` is worth noting separately: it is imported by `documents`, `field`,
`finance` and `reports`, and imports `activities` and `service`. Work that extends
scheduling should read through existing paths rather than adding new cross-domain
edges.

## 3. Folder map

```
src/
  app/                    routing and page composition only
    styles/               all CSS
  <domain>/               one folder per business capability
    index.ts              the domain's entire public surface
    model.ts              types and domain rules
    reads.ts              query-side access
    commands.ts           write-side operations
    permissions.ts        the domain's permission checks
    components/           server components
    components/client/    client components
  shell/                  application chrome
  platform/               identity, permissions, errors, cross-cutting services
  adapters/               calls to external systems
  shared/
    ui/                   generic UI primitives, no business meaning
    lib/                  generic helpers, no business meaning

db/
  migrations/
  seeds/
    core/                 seed data every environment needs
    scenarios/            named demonstration scenarios

tests/
  unit/  integration/  database/  http/  browser/
  fixtures/
  helpers/

scripts/
  design/                 build design output
  checks/
    documentation/  design/  application/
  proofs/                 evidence-producing scripts
  tooling/                repository maintenance

config/                   tool and build configuration

docs/                     as it currently stands, plus:
  reference/ui/           organised by page coverage register family
```

### No `src/modules/` wrapper

Domain folders sit **directly under `src/`**. There is no `src/modules/` wrapper folder
and none is planned; ADR-0028 records why the option was rejected.

A consequence is that `src/` contains both domain folders and non-domain folders (`app`,
`shell`, `platform`, `adapters`, `shared`), and nothing in the folder name distinguishes
them. **The authoritative list of which folders are domains lives in the eslint boundary
configuration**, not in a folder name, a README or this document. A new domain is created
by adding its folder and adding it to that configuration; a folder not listed there is not
a domain, and the boundary rules will not treat it as one.

### `docs/reference/ui`

Built design output is organised by the families defined in the page coverage register,
not by the design package that produced it. Section 9 explains why the two trees are
organised differently.

## 4. Module public surface

**Each domain exposes `index.ts` and nothing else.** Every other file in the domain —
`model.ts`, `reads.ts`, `commands.ts`, `permissions.ts` and everything under
`components/` — is internal, and no file outside the domain may import it directly.

The surface is a deliberate, curated list. It is not a wildcard re-export of each internal
file: re-exporting everything makes every internal a public commitment and defeats the
purpose of having a surface at all.

A worked example — `src/crm/index.ts`:

```ts
// The public surface of the CRM domain. Everything the rest of the
// application may use from `crm` appears here and nowhere else.

export type { Lead, Opportunity, OpportunityStage } from "./model";

export { listOpportunities, getOpportunity } from "./reads";
export { createLead, convertLead, transferOpportunity } from "./commands";

export { OpportunityBoard } from "./components/opportunity-board";
```

`reads.ts` and `commands.ts` remain free to export helpers that `index.ts` does not
re-export; those are internal to the domain and can be changed without co-ordinating with
any other part of the application. That freedom is the point of the rule.

## 5. Capability enforcement

**Capabilities are declared once, in the `Capability` union in
`src/platform/permissions.ts`. Every parameter that accepts a capability must be
typed `Capability`, never `string`.**

That is the enforceable rule, and the compiler enforces it. A mistyped capability
fails `npm run typecheck` before it can reach a permission check.

```ts
export async function requireCapability(
  client: QueryClient,
  p: Principal,
  capability: Capability,
) { /* ... */ }
```

A capability literal at a call site is therefore acceptable. It is checked
against the union at compile time, and is not a raw string in the sense that
matters.

### The current position

Measured at the commit this revision was written against:

- **53** capabilities are declared in the `Capability` union
- **50** distinct capability literals appear across `src/`, in **48** files
- **Zero** functions accept a capability typed as `string`. The single
  `capability: string` occurrence, in `src/shell/reads.ts`, is a database row
  type for reading whatever grants exist, which is correct and is not a
  parameter.

The enforcement gap that r01 described does not exist.

### What is genuinely missing

Nothing ties a capability to its meaning, the grants that carry it, or the
decision that introduced it. The union gives the authoritative set; it gives no
explanation of any member.

Named constants do not close that gap — a constant name restates the string. A
capability register does: one row per capability recording its meaning, the
scope types it accepts, and the decision or requirement that introduced it.

That register is **not yet written**, and is recorded here as an open item rather
than a rule. It is documentation work, not a refactor of application code.

### Superseded in r02

r01 required named constants for every capability and forbade capability
literals at call sites. That requirement is withdrawn. It would have changed 48
files to restate a set the compiler already enforces, and it addressed a gap
that does not exist. No code was changed under the r01 wording.

## 6. Naming conventions

Structural naming for code and files. Documents continue to follow
[PPO-STD-001](naming-conventions.md); **this standard does not change document naming.**

| Thing | Convention | Example |
|---|---|---|
| Folders | kebab-case | `src/crm`, `components/client` |
| Files | kebab-case | `opportunity-board.tsx`, `reads.ts` |
| React components | PascalCase export | `export function OpportunityBoard()` |
| Client components | `.client.tsx`, under `components/client/` | `components/client/stage-picker.client.tsx` |
| Types and enums | PascalCase | `type OpportunityStage` |
| Database fields | snake_case | `work_order_id`, `valid_from` |
| Stylesheets | named for the scope they style | `crm-board.css`, not `crm-r38.css` |
| Documents | per PPO-STD-001 | unchanged by this standard |

## 7. Business names versus identifiers

Two kinds of name appear in this repository, and they are governed by opposite rules.

**Business names** are the language operators actually use. They appear in labels,
headings, menu entries and URLs. They are expected to change as the business changes its
own vocabulary, and changing one is an ordinary content edit.

**Identifiers** are chosen once and kept stable. They include permission namespaces,
page-family codes, folder names, database fields and document IDs. They exist to be
referenced from other places, and their value is precisely that the reference keeps
resolving. Changing one invalidates every reference to it.

This follows PPO-STD-001's rule that **names are not primary keys**. The correct response
to "we call it Sales now" is to change the labels, not the identifiers.

### Worked example

The business calls this capability **Sales**, and the records in it **Deals**. So:

| Surface | Value | Kind |
|---|---|---|
| Interface labels and headings | Sales, Deals | business name — may change |
| URL | `/sales/...` | business name — may change |
| Permission namespace | `crm.*` | identifier — stable |
| Page family code | `CR` | identifier — stable |
| Domain folder | `src/crm` | identifier — stable |

The interface says Sales and Deals and the URL reads `/sales/...`, while the permission
namespace stays `crm.*`, the page family stays `CR` and the domain folder stays `src/crm`.
This is not an inconsistency to be tidied up; it is the rule working as intended. ADR-0028
records the rejection of both renames.

## 8. Stylesheets

**One stylesheet per module, named for what it styles — never for the revision or the pull
request that created it — and updated in place.**

A stylesheet named for its scope tells a reader what is inside it and where a new rule
belongs. A stylesheet named for a revision tells them only when it was written, which is
what git already records, and gives no answer at all to "where does this rule go?" The
predictable result is that the next change creates another file rather than editing an
existing one.

### The current position

The Deals board is styled by three files — `crm-refinements.css`, `crm-board-polish.css`
and `crm-r38.css` — totalling **1,830 lines**. Four selectors are each defined in more
than one of the three:

| Selector | Defined in |
|---|---|
| `.crm-card` | all three |
| `.crm-stage` | all three |
| `.crm-change-feedback` | `crm-refinements.css`, `crm-board-polish.css` |
| `.crm-workspace` | `crm-board-polish.css`, `crm-r38.css` |

None of the three names says which rules it owns, so which file a given rule lands in
depends on import order in `layout.tsx` rather than on scope. Consolidation is
opportunistic (section 13), not scheduled.

## 9. Design source and built output

Two trees, deliberately organised differently:

| Tree | Holds | Organised by |
|---|---|---|
| `docs/design/<package>/` | maintainable source | build package |
| `docs/reference/ui/<family>/` | built output | page coverage register family |

**They are not mirrored, and must not be made to mirror.** A build package and a register
family are different things: one is a unit of authorship, the other a unit of coverage.
One package legitimately writes into several families, and many families have no package
at all. A folder-name correspondence cannot express either relationship. ADR-0028 records
the rejection of mirroring in full.

The two are bound by **metadata, not by path**. A design report declares its
`design_source` and `builder` in its front matter, and those declarations are what tie an
output back to the source and the script that produced it. Following the metadata always
works; guessing from the path does not.

### The current position

Measured at the commit this revision was written against: **192 reference HTML files
exist. 29 builders write 33 of them. The remaining 159 have no builder** — for those the
reference copy is the only copy, and editing it by hand is the only way to change it.

This is why `design_source` and `builder` front matter matters: for most of the tree it is
the only record of where a file came from, and for 159 files it correctly records that
there is no generating source to go back to.

## 10. Revision retention

**One working file per module family, with no revision in the name, updated in place.**
Git holds the history. A working file is the file people edit; its past editions are
recovered with `git log`, not by keeping them beside it.

A separate `rNN` file is retained **only** when one of the following is true:

1. It is registered in `ui-baselines.json`.
2. A decision record cites it as exact bytes.
3. It was issued outside the repository.

Outside those three cases, a numbered file beside a working file is a duplicate.

### Which file is authoritative

Apply the test in order, and stop at the first that answers:

1. **Registered** — is it named in `ui-baselines.json`?
2. **Most-cited** — which edition do other documents actually reference?
3. **Latest** — only if the first two do not decide it.

**Never the highest number alone.** The number records when a file was written, not
whether anything depends on it.

### Worked example

The theme style board, measured at the commit this revision was written against:

| Edition | Inbound references | Registered in `ui-baselines.json` |
|---|---|---|
| `...-theme-style-board-r20.html` | 43 references across 34 files | no |
| `...-theme-style-board-r22.html` | 9 references across 8 files | **yes** |

`r22` is authoritative because it is registered, which is step 1 — not because it is the
higher number. Note that the first two steps disagree here: citation weight alone would
have picked `r20` by a wide margin. Neither "highest number" nor "most links" is the test
on its own; the ordered test is, and it has to be applied rather than assumed. There is no
`r21` in the tree, so the numbering is not contiguous either, and a reader who assumed the
latest edition was "the last number plus one" would be looking for a file that does not
exist.

### Deletion

When a superseded revision is deleted, **the design index records the commit SHA where it
last existed**, so the bytes remain recoverable by a reader who has only the index.

## 11. Hashed files and line endings

**Any file whose bytes are hashed must check out identically on every platform, and must
be pinned in `.gitattributes`.**

A hash compares raw bytes. A CRLF rewrite on Windows changes those bytes, so a file that
is byte-identical in content reads as modified, and the check fails for a reason that has
nothing to do with its content.

Three mechanisms in this repository hash file bytes:

1. **Migration checksums** stored in the database.
2. **`ui-baselines.json`** — the UI baseline register.
3. **Design `source-pins.json`** — design source pins.

Any file reached by one of these must have an explicit `eol=lf` entry in `.gitattributes`,
and any new hashing mechanism must pin its inputs there before it is relied on.

## 12. Where does this go?

| I have… | It goes… |
|---|---|
| A new screen | `src/app/` for the route; the components in the owning domain |
| Logic used by one domain | that domain, internal — not exported from `index.ts` |
| Logic two domains need | `src/platform/`, or the owning domain's public surface if it belongs to one of them |
| A generic helper, no business meaning | `src/shared/lib/` |
| A UI primitive, no business meaning | `src/shared/ui/` |
| A call to an external system | `src/adapters/` |
| A permission | `src/platform/permissions.ts`, as a named constant (section 5) |
| A design source package | `docs/design/<package>/` |
| Built design HTML | `docs/reference/ui/<family>/`, by register family (section 9) |
| A decision | `docs/decisions/`, as a numbered ADR |
| Evidence a check passed | `verification-evidence/` |
| A local screenshot | nowhere in the repository — attach it to the pull request |

If two rows seem to apply, the more specific one wins. If genuinely neither does, that is a
gap in this standard: record the choice in the pull request and raise it as a revision here
rather than inventing a location silently.

## 13. Adoption order

The retrofit sequence, cheapest and safest first. **Nothing in this table is scheduled**;
it records the order to take things in if and when they are taken on.

| # | Step | Risk | Blast radius | Notes |
|---|---|---|---|---|
| 1 | Resolve the circular domain pairs | Medium | Design decision, then code | Each cycle needs one direction broken; a public surface at each end does not resolve it |
| 2 | Domain `index.ts` surfaces | Low | Additive | Adding a surface breaks nothing. Least-coupled domains first |
| 3 | eslint boundary rules | **High until 1 and 2 are done** | All of `src/` | Fails lint at every cross-domain import until public surfaces exist. Not a configuration-only change |
| 4 | `scripts/` and `config/` grouping | Low | Workflows, `package.json` | Path updates only |
| 5 | `db/seeds` grouping | Low | Seed commands | Path updates only |
| 6 | `docs/reference/ui` family taxonomy | Medium | Documentation links | `check_foundation` catches every broken link |
| 7 | CSS consolidation | Medium | Deals board styling | Opportunistic only; visual regressions are not caught by a check |
| 8 | `src/components` into domains | **High** | Imports across the application | **One domain per pull request. Never while a pull request touching that domain is open.** |

Steps 1 and 3 are no longer safe to take at any time. Step 1 is a design decision
before it is a change, and step 3 cannot be taken until steps 1 and 2 are done: enabled
earlier it fails lint at every cross-domain import. Step 2 is additive and safe at any
time, and so are steps 4 and 5. Step 6 is safe because a check verifies it. Steps 7 and 8
are the ones that can cause real damage, and both are constrained: step 7 to opportunistic
changes only, step 8 to one domain at a time with no concurrent open work on that domain. A
large move landing under an open pull request produces conflicts that are resolved by hand
in exactly the files least able to tolerate a mistake.

## 14. Open questions

Recorded as unresolved. **This standard does not decide them**, and neither does ADR-0028.
Until each is decided, the current arrangement stands.

### 14.1 `src/login` and `src/offline` sit at domain level

Both currently sit alongside the business domains, and neither is obviously one.

- **`src/login`** is identity, and identity is a platform concern. It arguably belongs in
  `src/platform` as the identity module.
- **`src/offline`** is a platform capability that the domains consume, not a business
  capability of its own.

Moving either would be step 8 work — high risk, wide blast radius — so neither should move
on the strength of a structural argument alone. Both are recorded here as open.

### 14.2 Two `docs/reference/ui` folders have no register family

`docs/reference/ui/quality-safety` and `docs/reference/ui/quality-site-assurance` have no
corresponding family in the page coverage register. Section 3 organises built output by
register family, and these two cannot be placed under a rule that assumes a family exists.

Assigning them requires **a decision about the register**, not about this standard: either
the register gains a family covering them, or they are folded into an existing family, or
they are recognised as output that the register does not cover. That decision is out of
scope here and is recorded as open.
