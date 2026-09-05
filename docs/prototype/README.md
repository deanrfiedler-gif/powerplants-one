# Powerplants One — First Prototype Definition & Architecture

**Package:** PP-01 · **Edition:** v01 · **Date:** 5 September 2026 · **Owner:** Dean Fiedler

**Status:** Authored design package for a personal, private, synthetic prototype. P01 foundation implementation is under verification; the full PP-01 journey and business acceptance remain incomplete. See the [P01 handover](../delivery/p01-handover.md). Technical selections below are the recommended design basis; they are not claims of company approval, purchased services or proven tenant integration.

## Decision brief

Build one complete planned-service journey: customer/site/equipment context → triage → authorised work → checked and issued job pack → coordinated attendance → field evidence → reviewed report → reconciled Finance handoff. Preserve separate identities and states for requests, work, appointments, reports and financial processing.

The recommended architecture is a TypeScript/Next.js modular monolith backed by PostgreSQL, with a bounded browser offline queue, server-enforced permissions and replaceable ERP/document adapters. Begin with synthetic data and local development; use simulated MYOB/SharePoint adapters and an explicit manual Finance queue. Evaluate an Azure-hosted container and managed PostgreSQL for a later private environment, after the implementation proof and cost review.

This is an extension of the [master blueprint](../blueprints/BP-01-master-blueprint.md), not a replacement of the seven-domain programme. It turns the selected Wave A obligations into build inputs while keeping later CRM, estimating, Engineering, Projects, supply-chain and Finance scope visible.

## Reading order and deliverables

| Document | Question answered |
|---|---|
| [Scope and service journey](scope-and-journey.md) | What will the prototype demonstrate, for whom, and where does it stop? |
| [BP-02 — Platform architecture](../architecture/BP-02-platform-architecture.md) | How should it be built, updated, secured, integrated and recovered? |
| [BP-07 — Service operations](../blueprints/BP-07-service-operations.md) | What does each screen/action do, including exceptions and mobile behaviour? |
| [Service data dictionary](../contracts/service-data-dictionary.md) | What records, fields, values, relationships and required-stage constraints exist? |
| [Service API and event contracts](../contracts/service-api.md) | How are commands, reads, concurrency, retry and offline capture handled? |
| [Minimum Finance contract](../contracts/finance-handoff.md) | How do reviewed work and account references connect to MYOB without false balances or duplicate processing? |
| [Document and issue contract](../contracts/document-issue-distribution.md) | How are exact packs, reports and evidence generated, issued and retained? |
| [Synthetic acceptance pack](../testing/prototype-acceptance.md) | Which demonstrations and failure scenarios must the implementation pass? |
| [Ordered implementation plan](../delivery/prototype-implementation-plan.md) | What should be built first, what depends on it, and what proves completion? |
| [Decision and evidence register](decisions-and-evidence.md) | What is known, what is a design assumption and what still needs evidence? |
| [Parent requirement disposition](traceability.csv) | Where does every one of the 78 parent requirements sit in this prototype? |
| [Package assurance](assurance.md) | What document checks were performed and what remains untested? |

## How to use the package

1. Read the scope and BP-02 decision brief, then review the end-to-end example in BP-07.
2. Use the dictionary, command contracts and test scenarios together when implementing a feature. A screen mock-up alone does not satisfy a workflow requirement.
3. Implement work packages P01–P12 in dependency order. Complete P01 verification before the bounded P02 task. Existing PPO issues remain discovery/design records; they are not silently converted into application tasks.
4. Preserve source IDs (SVC, DAT, TR, BR, IF, OUT, FD, AT, D). PP/SC/CMP/SR/VAL/PT/P identifiers below are local to this package and are never ERP references.
5. Record actual test results against a commit and environment. All PT scenarios in this edition are **Not run**.

## Evidence and authority

The source baseline is the issued Master Blueprint v02 and its inherited evidence, supplemented by the user's explicit request for this package. No new Pipedrive, Smartsheet, MYOB, CAD or SharePoint operational audit was performed for this package. Official technical documentation supports architecture options only; see BP-02 references.

Current user direction authorises preparation of the selected design package and repository changes. Dean remains prototype owner. Department names in this package are functional roles to simulate, not assigned employees or an approved organisation chart. Live operational authority remains in the decision register.

The working master now uses the adopted BP-01 filename and r03 naming/ownership metadata. The [issued v02 snapshot](../reference/baselines/GEN_SPC_PPABusinessPlatform_MasterBlueprint_v02.md) remains hash-protected. [ADR-0005](../decisions/ADR-0005-project-naming-adoption.md) records the naming adoption and design-contract alignment; requirement scope and application acceptance status remain unchanged.

## Review outcome sought

The useful review is whether the proposed service journey and exceptions fit the intended business operation, whether the architecture is maintainable for the prototype, and whether the ordered build can demonstrate those outcomes. Missing external facts are visible and do not prevent synthetic development. They must be resolved before the corresponding live capability is enabled.
