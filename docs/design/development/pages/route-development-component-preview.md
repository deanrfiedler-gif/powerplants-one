# Component preview — working design reference

<!-- versioning: git; committed history is authoritative -->

**Owner:** Dean Fiedler · **Review:** Pending · **Stable entry:** `route:/development/component-preview`.

## Purpose

Internal catalogue renderer. Open through a catalogue example link with a registered component and state. Unknown IDs/states are unavailable. The server enforces the local gateway or hosted owner access gate. This document mounts actual components with synthetic fixtures and no business session or shell requests.

## Desktop

Use the application's global CSS import order. Keep only a concise synthetic-context label around the component. Do not override component geometry merely to improve its catalogue appearance. Component-specific rules remain in the catalogue specification.

## Mobile

The iframe width is the real viewport for media queries. Allow intrinsic component scrolling and expose any remaining alignment differences. Use the same example at 390 and 320 px; device keyboards and zoom require separate review.

## Behaviour and recovery

Interactions affect preview memory only. Synthetic-record links are intercepted; owning page links belong in Used on. Reset/reload discards changes. Gantt uses a fixed reference date and disables layout persistence in catalogue mode. Application defaults remain unchanged. Escape/focus behaviour belongs to the actual runtime overlay components.

## Protected hosted workspace

In the private hosted app, show the Design & Development shell entry only for the configured owner with an active Microsoft session. Authorise direct pages, previews, guides and reference downloads on the server too. Show the exact deployed Git commit. Hosted refresh reads that release; local refresh reads working files. Temporary examples and theme proposals never save business data or Git edits. Other testers retain their existing help and business access. Verify denied and expired sessions as well as owner access, desktop/mobile wrapping, reference isolation and preview framing. See [release and access decision](../../../decisions/hosted-design-workspace.md).
