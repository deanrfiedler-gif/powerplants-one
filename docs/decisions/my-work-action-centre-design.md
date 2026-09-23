---
document_id: PPO-MYWORK-DES
date: 2026-09-16
owner: Dean Fiedler
status: Authorised standalone design; owner acceptance and application integration pending
source_commit: a4061c43b11d6a53604ec628cdf370ee72f54f7a
versioning: git
---

# My Work & Action Centre design

Dean authorised the six-view My Work recommendation and requested both an interactive r01 HTML and a detailed companion Markdown report aligned to the attached r20 theme board. The [HTML](../reference/ui/my-work/PPO-My-Work-and-Action-Centre-r01.html) and [report](../reference/ui/my-work/PPO-My-Work-and-Action-Centre-Report-r01.md) deliver that bounded design.

The design extends the existing `/work`/Activity direction under adopted [F06 and F04](../requirements/product-quality-register.md), covering SH-02/SH-03/SH-06 P1 worklist, notifications and reviews. The original parent requirement set is unchanged; no requirement is marked accepted by this design.

## Decision and effects

Retain the existing standalone HTML/CSS/JavaScript and Python build pattern. There is no architecture or technology exception: no new runtime dependency, application route, migration, adapter, ERP responsibility or document-authority change is introduced. The source model and interaction layer are separated for review and targeted verification.

The six views are Today, My actions, Reviews & handovers, Blocked & waiting, Team queue, and Updates & preferences. A stable source obligation has one projection; notices are separate events. Completion, ownership and review controls use the relevant source rules. Quality acceptance and scope release remain separate, and the OEM action stays visible after the Northbank release.

The Northbank Quality model is reused unchanged from proposed [PR #208](https://github.com/deanrfiedler-gif/powerplants-one/pull/208), head `23199a8a4e11e71c52d774d9d58ad5e4ae4c8c32`. Its exact hash and r20/font provenance are in the report. That proposal is not relabelled as an accepted baseline. Other receiving designs are reference links; separate standalone sessions do not exchange records.

Browser persistence, complete synthetic session export/restore, partial/failed/empty reads, version conflicts and failed/lost save demonstrations make recovery reviewable. Preview roles are not authentication. Required obligations cannot be completed by reading or quieting updates. Paused schedules remain paused; no messages or external business records are created.

## Handover and status

The [source guide](../design/my-work/README.md) gives the deterministic build and targeted checks. The [evidence record](../testing/evidence/my-work-r01/README.md) identifies actual source/run results and visual inspection. The HTML index, document register and status row identify this proposal without changing an accepted UI baseline or deployment status.

Application receiving work must preserve server-side permissions, stable source/version routing, source-owned receipts, notification/obligation separation and the full F04/F06 contracts. Owner visual acceptance and application integration remain separate from this authorised design creation and draft contribution.
