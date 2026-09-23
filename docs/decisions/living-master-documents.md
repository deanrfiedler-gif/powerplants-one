---
document_id: PPO-LIVING-MASTERS
title: Living master documents and committed history
versioning: git
status: User-authorised naming policy; implementation verification recorded below
owner: Dean Fiedler
date: 2026-09-23
---

# Living master documents and committed history

Dean authorised this recommendation on 23 September 2026: living master documents have stable paths and clean titles, while Git records committed edits. Review, issue and deployment remain separate events. This refines PPO-STD-001 and the development workspace in ADR-0040; it does not revise issued business records.

## Application

The document register explicitly classifies living blueprints, specifications, design decisions, plans, standards and native register sources as `git`. Their current revision fields are empty. The previous label remains in `last_labelled_revision` as fixed migration provenance. Existing IDs, paths, source commits, historical change sections, issued references and actual status/owner records are retained. Historical delivery handovers, issue decisions, test runs and source artefacts remain `retained-record`; the classification does not grant acceptance.

The 266-entry native register and its 262 articles use schema 2. Article revisions are removed; titles and keys remain stable. The page reader shows owner, the design file's last committed change, local edit state, last recorded reviewer/date and history links. The guide reader and global information panel expose the same distinction. A guide's history is explicitly the history of the whole library file, not a fabricated article-specific change date.

GitHub source/history links use the checkout commit so a branch is not incorrectly presented as main. Uncommitted edits are labelled; missing Git metadata stays unavailable. A just-created unpushed commit will not resolve on GitHub until pushed. Public GitHub source history does not imply a matching running deployment.

Guide review requires a reviewer, date and content hash; changed content displays Changes awaiting review. Page review also depends on its tracked source, design and shared components. All imported guides remain Draft and no reviewer/date is invented. Git source dates are change evidence, not approval evidence.

The original r04/r05 HTML, their portable guide library, issued mockups, journey maps and other retained references are unchanged. Business record revisions, document issue/acknowledgement controls, schema/API/software versions and all 78 parent requirement IDs remain intact.

## Maintenance and validation

New document-register records must declare `git` or `retained-record`. The naming check validates stable master names, lifecycle metadata, document IDs and retained revision matches, preserving at least the 192 metadata checks observed before migration. Route discovery and one-time import write schema 2 without manual article revisions.

Run the naming, foundation, prototype and development-register checks, the focused development tests, lint/type checking and build. Test saved versus unsaved/untracked/no-Git history, exact commit links, draft/reviewed/changed article states, and unchanged issued bytes. Inspect the native reader at desktop and mobile sizes. Validation results and the publication commit are recorded in this document after execution.

Publication continues in [PR #283](https://github.com/deanrfiedler-gif/powerplants-one/pull/283). No merge, hosted deployment or business acceptance is included in this naming change.

## Executed verification — 23 September 2026

- Naming: 372 document records, 103 Git masters, 217 metadata comparisons and 7,994-character copy-ready instructions passed. Six additional existing contract/package files lost their routine edition labels without introducing new document identities.
- Foundation and prototype: local links and all 78 parent requirement dispositions passed; historical section anchors and revision/glossary tables were retained.
- Development register: 266 entries, 262 Draft articles, 112 source addresses, 30 journey references and 24 current journey families; no integrity errors. All 266 page/system reviews remain unrecorded.
- Seven focused development/history tests passed, including changed imported dependencies, saved/local/untracked/no-Git states, commit-pinned links and explicit article review invalidation. A transient Windows temporary-folder lock exposed unfinished parallel Git reads; awaiting all results fixed it, and the rerun passed.
- Full repository lint, TypeScript and the compiled application build passed. The prior whole-suite Windows findings remain recorded in the workspace handover; the focused tests are the behavioural coverage for this change.
- The compiled local application at port 3006 was inspected in the native browser at 1440 × 960 and 390 × 844. Draft status, clean article titles, owner/history/review distinctions and uncommitted warnings were visible. History points to the actual checkout commit. The mobile reader wraps metadata and retains its close control. Escape returns focus to User guide. The global information panel resolves the development register article with the same metadata. The temporary viewport override was reset.
- The original r04 SHA-256 remains `b049869ac8b500cced535360ebb86650c55bbc5cd3ee4a18872ef83ea0b4b16e`; r05 remains `b07890f2cec602847af41bb4a790407ff3a6456a1842846520e0aede61233b93`. No files under `docs/reference/`, the portable register sources or root reference folder changed in this naming follow-up.

This is local source/UI verification. Physical-device, assistive-technology, independent visual and business acceptance remain separate. The isolated preview's business context service is unavailable; the development library works without its database. No claim about hosted availability follows from this work.
