---
document_id: PPO-AD03-DES
title: Data Quality Workbench design and repository handover
revision: r01
date: 2026-09-18
owner: Dean Fiedler
status: User-authorised repository publication of standalone AD-03 design; owner acceptance and application integration separate
source_commit: 108b1600152ee12443c75ffaf7feb7cc857316f5
---

# AD-03 — Data Quality Workbench

Dean requested the [build plan](../delivery/data-quality-workbench-build-plan.md), continued with the standalone HTML and detailed report, and then authorised the repository update with **“Push them.”** This contribution records the issued package, maintains its source and verification entry points, and updates repository navigation. It does not implement an application route, external write, migration or deployment.

## Deliverables

- [Issued r01 HTML](../reference/ui/data-quality/PPO-Data-Quality-Workbench-r01.html), retained byte-for-byte.
- [Issued detailed report](../reference/ui/data-quality/PPO-Data-Quality-Workbench-Report-r01.md), including all features, sixteen scenarios, demonstration instructions and the original 48-row plan verification mapping.
- [Maintained preview](../reference/ui/data-quality/PPO-Data-Quality-Workbench-working.html), [source and builder guide](../design/data-quality/README.md), and repository-native verification scripts.
- [Original and repository verification evidence](../testing/evidence/data-quality-r01/README.md).

The original report is a pre-publication issue and therefore states that no repository update was performed by its build increment. That statement remains accurate for the original increment; this handover records the subsequent publication task. The original source ZIP remains a delivered companion; the repository contains its expanded sources and evidence rather than another duplicate archive.

## Scope and design conformance

| Field | Recorded decision |
|---|---|
| Scope identity | AD-03 from page coverage register r06; CRM-08, FIN-06 and inherited NFR-01–NFR-12; supporting F07/F07-A and DAT-01–DAT-03 context |
| Primary composition | Work queue + persistent detail; supporting review/comparison, guided form, record detail and evidence views |
| Shared shell | Workspace interior only; global navigation, identity and search remain with the application shell |
| Reuse | Supplied theme r22 exact embedded Roboto rules and navy/green/neutral tokens; Customer 360 exact icon set; SH-06/Customer 360 queue/detail and portable-build lineage |
| Incoming | Permitted finding origin, stable subjects, exact target/source/impact/policy basis and accountable owner |
| Outgoing | Frozen proposal and review, local simulated Equipment receipt or prepared domain-owner request, with owned follow-up |
| Exceptions | Missing/partial/stale sources, unavailable counterpart, returned revisions, unconfigured policy, changed target, failed local save, stale tab and unknown receiving outcome |
| Departures | Six AD-03 views; proposed fixture role/policy vocabulary; one bounded local serial-correction receiver; r22 selection treatment over the r20 composition lineage |
| Verification | Original and maintained-preview results are separate; native substitute Chromium, device/accessibility limits and broader plan gaps remain explicit |

No parent requirement or acceptance identity is added. Scenario DQ labels are package references, not allocated production record codes. No accepted UI baseline is promoted.

## Architecture/reuse decision

Retain PPO's existing standalone HTML/CSS/JavaScript and deterministic Python-assembler pattern. The required result is a portable, reviewable design over fictional data; a new Next.js route or server command would add authenticated receiving scope. The pure model, UI controller and fixture set remain separate. No application dependency is added.

The repository lint pass required removal of unused bindings and explicit cross-fragment model exposure. Those maintenance changes are confined to a versionless working preview. The original issued HTML/report and their source hashes remain unchanged. The builder checks the original hash on every run and produces the maintained preview through a temporary portable staging layout.

## Delivered behaviour

Six views cover the queue, record comparison, correction proposal, impact/relationships, review/resolution and history/follow-up. The main journey compares two same-name pumps at different addressed sites, retains both identities, submits an exact serial correction, receives an independent return, creates a corrected successor, accepts its exact response, applies one local Equipment correction, recovers an interrupted original result and verifies closure with a prepared Service follow-up. Issued bytes and acknowledgements remain retained.

Keep separate closes as a reviewed no-change result. Genuine consolidation, site/hierarchy, served-area, unit and ERP mapping changes remain prepared owner requests. No automatic merge, generic master update, physical relocation, ERP posting or message delivery is available.

The report explicitly records narrower plan coverage: controlled fixture graph validation, limited manual capture and filters, blocking rather than advisory findings, JSON-only review export, synthetic dependency sets, latest-note retention and incomplete recurrence/scroll/accessibility acceptance.

## Receiving contract

Equipment owns actual identity/lifecycle corrections; Customers/Sites own locations and effective parties; MYOB retains ERP authority and AD-05 mapping reconciliation; AD-02 owns approved policy/vocabulary; AD-04/AD-06 own connector/import/migration operations; DK and SharePoint retain document authority; SH-06/Activities/Service receive actual review and follow-up work.

Production implementation requires server-side scope checks, explicit field ownership, accepted-proposal/version binding, one authoritative mutation/audit/outbox/receipt transaction, durable original-result lookup, permitted evidence and controlled exports. Browser localStorage and preview roles demonstrate behaviour only. Independent owner/device acceptance and application receiving implementation remain outstanding.

## Publication and coordination

This repository-writing session is AD-03 publication, workspace `6219d95543f0`, branch `design/ad03-data-quality-workbench-r01`, based on main `108b1600`. Existing open PR #236 uploads other module references and the r22 theme; its file list contains no AD-03 paths. This contribution does not edit that PR or add a competing theme copy. The supplied theme is pinned by hash and the required font assets are embedded here.

The branch is prepared as one complete contribution. Authoritative pushed commit, pull request and CI outcomes remain in GitHub. No merge or deployment is part of this instruction.
