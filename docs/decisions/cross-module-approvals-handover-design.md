---
document_id: PPO-SH06-DES
revision: r01
date: 2026-09-17
owner: Dean Fiedler
status: Authorised standalone package; design acceptance and runtime integration pending
source_commit: e1b705acc5457dab6fc0b6a2f0c977132cbd2215
---

# SH-06 — Cross-module approvals and handover inbox

Dean requested the existing SH-06 module now, including an interactive HTML and professional detailed Markdown companion aligned to the attached Powerplants One theme board. The [HTML](../reference/ui/approvals-handover/PPO-Cross-Module-Approvals-and-Handover-Inbox-r01.html) and [report](../reference/ui/approvals-handover/PPO-Cross-Module-Approvals-and-Handover-Inbox-Report-r01.md) provide that bounded design.

## Source and scope

Verified `main` at `e1b705acc5457dab6fc0b6a2f0c977132cbd2215`, including merged #214's restoration of original HTML source packages. Read AGENTS, README, STATUS, naming and ADR-0003/0005, BP-01/BP-02, the implementation plan, F06/F06-A, SH-06, the HTML conformance standard and adjacent My Work/Notifications designs. Open neighbouring proposals were inspected by title/status; they are not assumed merged dependencies.

Attached r20 is byte-identical to the repository board, SHA-256 `c68a499e857b1705d47bd6598d4b2e89526bf0861a0d234394c3da023f19b617`. The report retains the exact conformance table and distinct SH-family/F06 parent mappings. All 78 parent IDs and issued reference bytes remain unchanged.

## Composition decision

Use r20 **Work queue + persistent detail**, supported by **Record detail** and **Review / comparison**. Retain the module-only shell boundary, SH-03 title/environment, Roboto assets, line icons, r20 tokens, labelled statuses and focused next-action controls. Reuse the established standalone HTML/CSS/JavaScript + Python builder approach; no new framework, dependency or architecture selection is needed.

Six views distinguish owned reviews, all permitted open tasks, returned submissions, handovers, sent submissions and historical outcomes. Total age, review-cycle age, source due date and unknown dates remain distinct. Reading, navigation, view preferences and notifications cannot approve or complete a source task.

Seven domain-owned route previews retain exact task/source/revision context. They are authored explanatory destination screens, not a universal decision engine or connected copies of the full domain modules. Related pinned design references are explicitly labelled. Domain commands, current permissions, policy and immutable receipts remain receiving responsibilities.

The phone list-to-detail treatment is a proposed departure from r20's stacked processing study, with visible Back to list and focus preservation. It does not establish a replacement accepted baseline.

## Handover boundaries

Incoming: permission-filtered source task and company, exact source revision, ownership, due date/unknown, next action, supporting evidence, receipt and source freshness. Outgoing: validated domain destination and retained queue return. Source services own decisions, transfers, corrections, resubmission, issue, sending, receiving acceptance and reconciliation. Sent, received and accepted outcomes are separate.

The package demonstrates source mismatch, changed revision, unknown Finance outcome, partial/failed/empty loading, read-only and Service-only visibility, unavailable/revoked target and saved-preference recovery. Runtime event sequencing, transactional deduplication, server enforcement, real document identities and concurrent mutations are not implemented by these fixtures.

## Verification and continuation

[Source guide](../design/approvals-handover/README.md) and [verification record](../testing/evidence/approvals-handover-r01/README.md) identify actual checks and limits. The current status, HTML index and document register identify this proposal without promoting it to an accepted baseline. No application source, migration, production interface, deployment or business message is changed.

The next implementation increment should connect one existing domain task to the shared permission-filtered queue with its exact source route and source-owned receipt. Domain-specific policy and acceptance remain separate from authorised creation of this review package.
