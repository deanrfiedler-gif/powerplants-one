---
document_id: PPO-ADR-0034
revision: r01
date: 2026-09-21
owner: Dean Fiedler
status: Implemented for synthetic review; owner acceptance pending
---

# ADR-0034 — Native specialist configuration and exact estimate contributions

Dean requested execution of the Specialist Configuration Workbench implementation
prompt and native build plan r02. Their normative contract bodies are identical.
This work is ES-08 / EST-06 / E5, tracing CRE-13–CRE-17, EA-16/17, AT-04/28,
G06 and D-009. The historical ES-08 quotation-authoring number is not reused.
Neither recovered formulas nor the synthetic receiver confer engineering approval.

The clean starting checkout was `06dde4a`, with ES-02 changes through migration
0030, ahead of inspected and fetched main `8ed8b0c`. The prerequisite was subsequently
fast-forwarded to `ea57344`, retaining its historical-read authorization fix. The isolated branch is
`feat/es08-specialist-workbench`; ES-02 is a prerequisite, not overwritten work.
No merge or deployment is authorized. Issued source snapshots remain unchanged.

## Architecture and precision

Retain TypeScript, React/Next, PostgreSQL and the current shell, identity,
permissions, transaction and receipt contracts. No runtime dependencies or
external services are needed. A generic formula evaluator, browser-authoritative
storage and standalone HTML would weaken scope and evidence and are rejected.

Use an independently typed pure engine with reduced BigInt rational arithmetic.
Parse bounded decimal strings exactly. Preserve source floor, nearest-half-up
and upward rounding at their individual boundaries; never apply a blanket binary
epsilon. Exact numerator/denominator evidence accompanies nonterminating values;
display rounding cannot establish receiving precision. Native estimate money
continues through the unchanged `SYN-EST-ARITHMETIC-01` implementation.

The native bundle pins `SS-RECOVERED-QTY-r02`,
`SS-PART-IDENTITY-r03-PROVISIONAL`, all 64 fields, five extra slots, 143 positions,
14 manual quantities, six gates, 12 parameters and retained REV/AUD/WAS findings.
The native implementation has a distinct version/hash. Commercial values from
private sources remain withheld. Numeric drafts retain bounded raw text, including
incomplete entries; all stored scalars must parse for calculation, even dormant
ones. Percentages convert once. Parameters are positive six-decimal values;
four recorded-only parameters have no invented quantity consumer.

Calculation-input hash identifies normalized computation. Conservative manual
review basis includes noncommercial inputs, extras and all parameters. Proposal
signature binds raw proposal, decisions, exact source and expected versions.
Evidence hash additionally binds immutable descriptions, actor and time. The
platform operation hash and historical estimate hashes remain unchanged.

## Routes, commands and DTOs

| Surface | Contract |
|---|---|
| `/estimating/configurations` and `/new` | Scoped register and exact saved-source creation |
| `/estimating/configurations/[id]/[view]` | configure, parts, pricing, compare, definition, history; bare detail redirects to configure |
| GET `/api/v1/estimating/configurations` and `/[id]` | Authorized bounded summaries/current draft; no implicit source adoption |
| POST collection / `[id]/draft`, `/run`, `/resolved`, `/archive`, `/copy` | CreateSpecialistConfiguration, SaveSpecialistDraft, SaveSpecialistRun, SaveSpecialistResolvedSet, ArchiveSpecialistConfiguration, CopySpecialistConfiguration |
| POST `[id]/preview`, `/receiving-preview`, `/source-preview` | Read-only signed comparisons, standard identity/Origin/body boundary |
| POST `[id]/apply`, `/rebase`, `/finding` | ApplySpecialistConfiguration, RebaseSpecialistSource, RecordSpecialistFindingReview |
| GET `[id]/history` with `run_id` and optional `export=1` | Exact permitted immutable snapshots; pages at most 50 |
| POST `[id]/resolve-operation` | ResolveSpecialistOperation / ResolveSpecialistCreate; original-operation terminal disposition under compound operation locks |

Specialist HTTP wrappers enforce 262,144 transmitted UTF-8 bytes. Service
validation limits depth before canonicalizing and independently enforces the full
262,144-byte envelope. Existing 65,536-byte command routes do not change.
Strict DTOs reject unknown keys, actor/approval/eligibility spoofing and duplicates.

## Entities and authority

Migration 0033 adds scoped configuration aggregates, immutable bindings/drafts,
runs, resolved sets, adoptions, lineage manifests, finding reviews and terminal
operation closures. Composite foreign keys bind workspace/company/alternative
relationships. Immutable snapshots use bounded versioned JSON; relationship,
identity, version and hash columns remain explicit. No new global capability.

Reuse estimating.read/edit, current owner, related-record visibility and whole
group Draft checks. Native review accepts a saved incomplete Discovery revision.
Bind actual ES-02 system/area IDs where supplied; fallback FacilityScope coverage
is explicit. A legacy E1 estimate is never silently rebound. Receiving requires
the current selected Active Complete discovery and an exact existing E2 basis.
Historical reads/replay authorize accepted sources independently of later pointers.

The immutable server policy `SYN-ES08-RECEIVE-01` pins exact public fixture scope,
bundle, parameters, branch profiles, part/unit/category maps, finding dispositions
and synthetic AUD pricing. It is not enabled by a caller flag or role. Unresolved
active mapping/price/precision blocks receiving; the review lane remains available.

## Estimate writers, lineage and recovery checklist

All native version insertions currently use `insertVersion` in
`src/estimating/service.ts`: CreateEstimate, SaveEstimate and AdoptDiscoveryCosting
in `cost-basis-service.ts`. New specialist adoption uses the same client/helper.
Each writer must finalize a lineage manifest only after its discovery basis exists.
Surviving line IDs carry original generated/adopted baselines; missing IDs preserve
deletion history; later discovery adoption marks old source contributions for review.
Lineage binds exact version UUID, content hash, basis and predecessor; hash mismatch
refuses reuse. Legacy versions have explicit absent lineage and unchanged hashes.

Configuration rerun and estimate receiving each compare B/C/N independently.
User deletion requires Keep omitted or Restore; incompatible part/unit changes
require full-tuple retention or explicit conversion, never numeric carryover.
No-change compares complete run/resolved-set/policy/basis evidence, not totals.
All receiving writes, totals, lineage, adoption and receipt/audit/outbox are atomic.
Existing quotations retain their original exact estimate version.

Shared operations keep operation-lock → workspace-lock → authority → replay order.
Register SpecialistConfiguration identity and explicit receipt dispatch. Adoption
recovery checks accepted estimate plus accepted configuration sources. Online
closure acquires both operation locks sorted before workspace lock; either an
accepted original or a permanent terminal closure wins. Only a minimal actor-scoped
operation pointer can persist in browser storage, never proposal or price data.

## Native presentation and handover

ES-08 uses r20 Form / guided workflow with supporting Worklist and Review /
comparison views, hosted full-bleed in the current r22 shell. Reuse SecondaryMenuFrame,
HeaderContent, form controls, unsaved-change guard, tables and inspectors. Six views
belong in the shared secondary menu; Configure sections are local accordions.
Incoming handover: exact saved discovery scope. Outgoing: immutable review evidence
and explicitly accepted synthetic estimate contributions. Source findings stay visible.

Implementation checkpoints and actual verification are maintained in the
[delivery checklist](../delivery/es08-specialist-workbench-handover.md).


## Exact source and rounding ledger

Definition UUID `42482a87-bf98-51b6-85ea-e1ee390e14e7`; bundle SHA-256
`f1ec5980ce6f1a68ba1a5b59eeda59a08da1851a6c7f7736d94041a5986d35c8`.
Native quantity version `SS-NATIVE-EXACT-QTY-r01` deliberately differs from the
recovered JavaScript version at exact decimal boundaries. The 28 retained scenario
comparison asserts every position and records these three differences explicitly:

| Scenario | Position | r03 binary result | Native exact decimal result |
|---|---|---:|---:|
| bedTrussClip | CE-LINE-247 | 1171 | 1172 |
| replaceLSYes | CE-LINE-243 | 154 | 155 |
| extraTeksYes | CE-LINE-277 | 617 | 619 |

These are implementation precision corrections, not engineering validation. The
source's quote-specific cached differences and untested branches remain open.

The server receiving manifest hash is
`476ba9d7d233ad9cc884f3910134bcbeb3317c22e98c6bfcea437de747812d51`.
It permits only the dedicated fixture configuration/revision, default and changed
bay profiles, fourteen reviewed zero allowances, six closed gates, exact parameters
and eleven explicit calculation-unit mappings. Rates 1.00 cost / 2.00 sell AUD are
an authored proposal, not a supplier quote. A factor of one does not convert metre
quantities to procurement rolls. No generic conversion or catalogue-authoring UI
is claimed. A future bundle/receiver must define and test any new mapping.

The current ES-02 typed facts contain Text and Zones, with no compatible Screen
Systems geometry field. They remain visible as exact source context. Numeric text
equality cannot turn climate zones into spans; an inherited numeric attribution is
refused until a semantic, unit-compatible mapping is versioned. Entered/default/
assumed values remain distinct. Rebase compares source facts and actual coverage,
resets manual review and does not silently import unsupported facts.

Configuration UUIDs are internal identities. `SYN-PPO-CFG-<UUID>` is a stable,
human-readable synthetic reference, not a production sequential number allocator.
Unborn-create recovery uses the already authorized EstimatingWorkspace identity;
its immutable closure can precede configuration insertion and prevents late create.
Resolved receipt authorization follows original accepted draft/run/estimate IDs,
including copy and resolution receipts, rather than current pointers.

## PR #273 base integration, 21 September 2026

Dean requested resolution of PR #273's conflicts. Its ES-02 prerequisite advanced
to `c0ced54`, incorporating EN-07/EN-08 and their issued migrations 0030/0031;
ES-02 now owns 0032. Merge that published base into the ES-08 branch. Move the
unmerged, undeployed specialist migration from 0031 to 0033 with identical SQL
bytes and register its immutable definition/policy seed at 33. Preserve all
Engineering migrations, seeds, users and grants; update every exact registry
assertion and retain the reviewed hosted-upgrade guard through 33. No database
ledger is rewritten and no development or hosted database is reset.

The shared secondary-menu CSS changes differ only in their module scope selectors;
the combined selectors include My Work, EN-06, EN-07, EN-08, ES-02 and ES-08.
Both Engineering receipt dispatches and navigation survive alongside ES-08.
Historical evidence continues to identify its original executable commits.
Fresh integration verification is recorded in the
[handover](../delivery/es08-specialist-workbench-handover.md#pr-273-conflict-repair).
This branch integration does not merge the pull request or deploy the application.
