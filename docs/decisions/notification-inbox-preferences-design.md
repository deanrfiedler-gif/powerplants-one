---
document_id: PPO-NOTIFICATIONS-DES
revision: r01
date: 2026-09-16
owner: Dean Fiedler
status: Proposed standalone design; owner acceptance and application integration separate
source_commit: 07eb34d5df5ea430c365da78e160cb6aa0b76f20
---

# Notification inbox and preferences — design and receiving handover

Dean requested the SH-03 Notification inbox and preferences module, an interactive HTML file and a professional detailed Markdown companion, aligned with supplied Powerplants One r20. The delivered [four-view HTML](../reference/ui/notifications/PPO-Notification-Inbox-and-Preferences-r01.html) and [report](../reference/ui/notifications/PPO-Notification-Inbox-and-Preferences-Report-r01.md) cover Inbox, Grouped changes, Owned escalations and Preferences. The central rule is explicit and executable: **reading a notice does not complete its business action**.

## Source and scope

Based on main `07eb34d5df5ea430c365da78e160cb6aa0b76f20`. AGENTS, README, STATUS, BP-01/BP-02, naming, F06/F06-A, issue #181 and SH-03 were inspected. Supplied r20 is byte-identical to main, SHA-256 `c68a499e857b1705d47bd6598d4b2e89526bf0861a0d234394c3da023f19b617`. My Work #209 at `53351a574375bcaa00486320c8f239a9907532ae` is an open related design reference, not an assumed merged dependency. No source files from that branch are merged here.

This is a module-only synthetic design and a coverage supplement for SH-03. The issued coverage r06 remains unchanged. F06 parents CRM-03, PRJ-03, SVC-02/12, DOC-05 and NFR-01/11 remain open at their existing acceptance level. No parent IDs, architecture, dependencies, runtime route, migration, provider, delivery schedule or deployment changes.

## Proposed rules illustrated

- Personal read/unread state is independent of source status and exact document acknowledgement.
- Routine notice archive is reversible; active required notices remain in the inbox. Mixed protected bulk archives fail atomically.
- Owned escalations deduplicate source obligations, retain read-notice work and distinguish overdue, due-today and unknown dates.
- Group-read operations capture only displayed IDs; later source events remain unread.
- In-app notices stay visible. Email options and quiet/digest rules are draft proposals with local previews only. No emergency or mandatory external-delivery policy is invented.
- Deep links resolve exact local notice/source identity and disclose missing targets, revision changes and lost access. Repository module links are references, not live receiving commands.
- Local saved-state validation and stale-copy guards retain failed/corrupt state for recovery. They are not server persistence, authentication or atomic concurrency enforcement.

## Verification and next step

The [evidence record](../testing/evidence/notifications-r01/README.md) owns exact model/browser results, source/hash and visual findings. Component delivery and owner acceptance remain separate. The reviewable contribution includes maintainable sources, reproducible assembly and focused CI evidence.

Next bounded implementation: one existing synthetic source event projected to a recipient-scoped inbox with durable personal read state, then explicit source opening. Keep My Work's source obligations authoritative. Broader channel delivery, runtime preferences and operational policy require their own specified receiving increment; this design does not close issue #181 or grant external-send authority.
