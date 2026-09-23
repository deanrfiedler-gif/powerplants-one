# Personal saved views — design reference

Stable entry: `scope:SH-05`. Owner: Dean Fiedler. Status: **Draft for visual review**.
Source baseline and existing issued references remain recorded in the register. SH implementation is synthetic and bounded; guide, visual and owner acceptance remain separate.

## Purpose and task

Reuse named personal criteria in supported workspaces. Existing My Work saved-view IDs/storage remain intact; new Search, Reviews and Updates targets use registered criteria schemas.

1. Set supported filters and choose Save view.
2. Name the view and save it to My views.
3. Choose a saved view to apply its criteria, then manage it if needed.

## Desktop

Reuse the saved-view controls and native WorkDialog; preserve existing My Work geometry and editor. Do not imply that personal pinning shares the view. Retain the existing 1440/1280/1024 layout and test the intermediate 768 width. The merged global design-workspace and information controls remain available.

## Mobile

Saved-view controls and the editor wrap at 390 and 320 CSS px. Retain labelled names, explicit update actions, Escape and focus return. Offline writes are not supported. Verification covered widths 430, 390 and 320; physical-device and owner acceptance remain pending.

## Shared components and states

Use existing My Work styles, semantic tokens, WorkDialog and platform resource lifecycle controls. The scoped native SH button/input styles are retained as the My Work compatibility exception; this change does not replace the shared control system.

Empty, invalid criteria, capacity reached, saving and version conflict remain visible. Review a refreshed version before retrying a stale write.

## Visual references

- [saved-views-desktop.png](../../../testing/evidence/sh-platform/captures/saved-views-desktop.png) — synthetic implementation capture, pre-PR #283 shell integration; not an approved mockup.
- [saved-views-phone.png](../../../testing/evidence/sh-platform/captures/saved-views-phone.png) — synthetic implementation capture, pre-PR #283 shell integration; not an approved mockup.
- No accepted standalone page mockup is available. The retained implementation captures are explicitly distinct from design approval.

## Behaviour, handovers and verification

Saving criteria does not modify source records, permission grants or another user’s views. A view name is not a shared team definition.

Each target validates only its supported criteria and retains a version for conflict handling. A maximum of twelve personal views is supported per registered target.

[SH verification](../../../testing/evidence/sh-platform/README.md) records actual checks, inspected captures and CI repairs; [handover](../../../delivery/sh-platform-handover.md) records scope and dependencies. Images above predate the merged development-workspace shell controls and require a fresh paired review for that integration. No review fingerprint or owner acceptance is claimed. The article `guide.sh.05` remains Draft.
