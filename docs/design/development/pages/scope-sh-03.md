# Notifications and preferences — design reference

Stable entry: `scope:SH-03`. Owner: Dean Fiedler. Status: **Draft for visual review**.
Source baseline and existing issued references remain recorded in the register. SH implementation is synthetic and bounded; guide, visual and owner acceptance remain separate.

## Purpose and task

Use Inbox, Grouped changes, Owned escalations and Preferences to coordinate current permitted Activity work. A notice is a source event; reading it is not completing the Activity.

1. Open the header notification bell or My Work > Updates & preferences.
2. Choose a view, inspect the source and open a notice for current details.
3. Mark read or unread explicitly; open the source Activity to complete the actual work.

## Desktop

Keep four labelled view controls, source-state notices, saved views and list actions in the existing My Work shell. Notice rows must keep selection, source text and actions aligned. Preferences expose dirty/save status without stretching labels. Retain the existing 1440/1280/1024 layout and test the intermediate 768 width. The merged global design-workspace and information controls remain available.

## Mobile

At 390 and 320 CSS px, wrap filters and notice actions, stack preference fields and retain readable source labels. Use Tab and Escape with the native detail dialog and return focus to its opener. Offline notification writes are not supported. Verification covered widths 430, 390 and 320; physical-device and owner acceptance remain pending.

## Shared components and states

Use existing My Work styles, semantic tokens, WorkDialog and platform resource lifecycle controls. The scoped native SH button/input styles are retained as the My Work compatibility exception; this change does not replace the shared control system.

Loading, empty, partial/unavailable, denied, stale and save-error states are distinct. An unavailable source is not a zero workload. A conflicting save requires refresh/review rather than silent overwrite.

## Visual references

- [notifications-inbox-desktop.png](../../../testing/evidence/sh-platform/captures/notifications-inbox-desktop.png) — synthetic implementation capture, pre-PR #283 shell integration; not an approved mockup.
- [notifications-inbox-320.png](../../../testing/evidence/sh-platform/captures/notifications-inbox-320.png) — synthetic implementation capture, pre-PR #283 shell integration; not an approved mockup.
- [preferences-phone.png](../../../testing/evidence/sh-platform/captures/preferences-phone.png) — synthetic implementation capture, pre-PR #283 shell integration; not an approved mockup.
- [PPO-Notification-Inbox-and-Preferences-r01.html](../../../reference/ui/notifications/PPO-Notification-Inbox-and-Preferences-r01.html) — retained design reference.

## Behaviour, handovers and verification

Opening or reading a notice never changes source status. Source completion remains in the Activity workflow. Saved preferences persist but do not schedule or send email, push or SMS.

Each notice retains event identity/time and source version. Current text and access are resolved again when opened. Inbox is a bounded slice of 200 notices, with a visible limit; owned obligations are read independently.

[SH verification](../../../testing/evidence/sh-platform/README.md) records actual checks, inspected captures and CI repairs; [handover](../../../delivery/sh-platform-handover.md) records scope and dependencies. Images above predate the merged development-workspace shell controls and require a fresh paired review for that integration. No review fingerprint or owner acceptance is claimed. The article `guide.sh.03` remains Draft.
