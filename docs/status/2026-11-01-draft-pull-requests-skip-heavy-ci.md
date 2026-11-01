---
title: Draft pull requests skip the heavy CI suites
date: 2026-11-01
---

Dean paused the scheduled agents on 1 November 2026 to clear 79 open pull requests; nothing had merged for 21 hours and 171 pull request runs were queued. Every push to a draft started the full database and browser suites. The ten workflows with a `Change scope` job now skip their heavy jobs while a pull request is a draft and run them in full when it is marked ready (`ready_for_review` added to their triggers). `scripts/ci_scope.py` reads the draft flag from the pull request event and fails open: any doubt runs everything. The scope, merged-tree, documentation, dependency and register checks still run on drafts. The [merge-conflict reduction record, section 4](../decisions/merge-conflict-reduction.md#4-merged-tree-check-and-documentation-only-ci-scope) holds the decision, the checks run and the limits, and CONTRIBUTING.md tells contributors to mark a pull request ready when it needs the full suites.

Checked: the classifier self-test (71 of 71), a simulated draft, ready and push event, a parse of every workflow with each of the seven required check names on exactly one job, and `actionlint` on the ten changed workflows. Not verified: a real draft-to-ready transition on GitHub, which this pull request's own runs and the next drafts will show. Seven path-filtered workflows are unchanged and still run on drafts when their paths change. No application code, migration, permission or branch protection setting changes.

<!-- decision-index -->
- [Merge-conflict reduction, section 4](../decisions/merge-conflict-reduction.md#4-merged-tree-check-and-documentation-only-ci-scope) (amendment, 1 November 2026): draft pull requests run only the quick checks; marking a pull request ready runs the full suites.
