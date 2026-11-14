---
title: Project readiness excludes withdrawn and superseded specialist briefs
date: 2026-11-14
---

Codex addressed finding 1 of [Claude review 5902702017](https://github.com/deanrfiedler-gif/powerplants-one/pull/948#pullrequestreview-5902702017) on [PR #948](https://github.com/deanrfiedler-gif/powerplants-one/pull/948), following Dean's request. The [SpecialistPackage contract row](../contracts/project-delivery-readiness.md#source-and-authority-mapping) now excludes Withdrawn briefs and briefs with a successor in the same workspace and Project before the candidate limit. The successor carries its own assessment under existing native authority. Omission publishes no successor identity or relationship; native specialist history remains unchanged.

Database cases PJ07-08 and PJ07-09 reproduce the review's withdrawn and superseded scenarios. They cover withdrawal with and without source drift, omission from published counts, resolving the remaining material blocker without terminal history keeping the Project Blocked, draft and accepted successors, and revoked source authority. The existing non-release boundary remains explicit. No migration, seed, permission, grant, dependency or UI changes.

Current main was merged without rewriting pushed history. Local validation and full final-head CI, including **Check merged tree against main**, are recorded in the PR handover. The cloud setup provides disposable PostgreSQL but reports Chrome unavailable; local specialist fixtures use the existing explicit command-only renderer and do not establish real PDF rendering. Browser and real-renderer proof are left to CI. Claude's one independent review exists; confirmation of finding 1 only remains separate from this implementation record. Dean owns the PR merge; nothing is deployed.
