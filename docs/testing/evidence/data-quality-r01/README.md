---
document_id: PPO-AD03-VERIFY
title: Data Quality Workbench r01 verification evidence
revision: r01
date: 2026-09-18
owner: Dean Fiedler
status: Original portable verification and fresh maintained-preview checks; CI and owner acceptance separate
source_commit: 108b1600152ee12443c75ffaf7feb7cc857316f5
---

# AD-03 verification evidence

## Original issue

The issued HTML SHA-256 is `be9d546dfc8826f99e3219e2dd46243d0760206c0f79cd0311b408c81f371c97`. The original build/report task ran 36 model, 24 generated-DOM and 15 native-browser groups successfully. Exact original result JSON and captures are in `original/`; [build manifest](original/build-manifest.json), [model](original/model-results.json), [DOM](original/dom-results.json), [native browser](original/browser-results.json).

The original native run used Chromium 153.0.8010.0, not the repository's pinned Chrome channel. Five widths (1440/1024/768/390/320), six views, native dialog focus/Escape, source focus return, a full returned correction, interrupted reload/recovery, scoped download and a true second-tab storage conflict were exercised. A 200% CSS zoom check is a reflow proxy, not browser-toolbar zoom acceptance. Captures inspected at original delivery included desktop queue, phone comparison, tablet proposal and enlarged review.

## Repository publication pass

The issued HTML/report are unchanged. Maintained source removes unused bindings, uses an explicit model exposure and ESM verification imports. The versionless maintained preview has its own [build manifest](repository/build-manifest.json) and fresh results: [model](repository/model-results.json), [DOM](repository/dom-results.json), [native browser](repository/browser-results.json). Do not treat original output identities as identities of the maintained preview.

The [builder](../../../../scripts/build-data-quality-workbench.py) verifies the original issue hash and deterministically reproduces the maintained preview. Repository-native checks retain the original behavioural assertions; environment/path/import changes do not weaken them. No lint rule is disabled for this package and the issued files are not overwritten to make the source pass.

Fresh local results: 36 model groups, 24 generated-DOM groups and 15 native-browser groups passed on the maintained preview. The native rerun uses the same disclosed substitute Chromium 153.0.8010.0. Focused source/script lint and deterministic rebuild checks passed. Foundation, prototype and naming results are recorded in the publication PR; their successful execution is a repository assurance claim, not business acceptance.

No new workflow or application dependency is added. Full application build, database/browser suites and pinned-runtime CI were not executed locally for this standalone design contribution. Existing configured CI may run on the PR; read its exact result before merge.

## Limits and traceability

The [issued report](../../../reference/ui/data-quality/PPO-Data-Quality-Workbench-Report-r01.md) maps all 48 original plan rows, including partial/unverified items. The 75 executed groups are not a claim that every planned requirement or parent acceptance is complete. Real integrations, durable transactions, physical-device review, assistive technology, full contrast/keyboard coverage, browser-toolbar zoom and independent owner acceptance remain outstanding.

Current source and receiving scope are in the [design handover](../../../decisions/data-quality-workbench-design.md). Reversal of this documentation contribution consists of reverting its package and index rows; no operational record is changed by the repository update.
