# Search — design reference

Stable entry: `route:/search`. Owner: Dean Fiedler. Status: **Draft for visual review**.
Source baseline and existing issued references remain recorded in the register. SH implementation is synthetic and bounded; guide, visual and owner acceptance remain separate.

## Purpose and task

Find permitted records through the same source registry in global compact search and the full Search page. Preview context, then open the owning record.

1. Enter at least two characters in global search, or open /search.
2. Choose View all results, then narrow by record type when more results are available.
3. Preview a result, inspect its company/site/source context and choose Open record.

## Desktop

Reuse the compact header search, full-page filter row, results list, saved-view dialog and WorkDialog preview. Keep context and source availability near results. Avoid unsupported global counts. Retain the existing 1440/1280/1024 layout and test the intermediate 768 width. The merged global design-workspace and information controls remain available.

## Mobile

Filters, saved-view controls and results wrap at 390 and 320 CSS px. Preserve long labels and context, keyboard result selection, Escape and dialog focus return. Search requires a connection; no offline search index is supplied. Verification covered widths 430, 390 and 320; physical-device and owner acceptance remain pending.

## Shared components and states

Use existing My Work styles, semantic tokens, WorkDialog and platform resource lifecycle controls. The scoped native SH button/input styles are retained as the My Work compatibility exception; this change does not replace the shared control system.

Distinguish empty from partial, unavailable and denied. There is no global total across bounded source pages. A revoked/missing preview has no usable source link.

## Visual references

- [compact-search-desktop.png](../../../testing/evidence/sh-platform/captures/compact-search-desktop.png) — synthetic implementation capture, pre-PR #283 shell integration; not an approved mockup.
- [search-desktop.png](../../../testing/evidence/sh-platform/captures/search-desktop.png) — synthetic implementation capture, pre-PR #283 shell integration; not an approved mockup.
- [search-320.png](../../../testing/evidence/sh-platform/captures/search-320.png) — synthetic implementation capture, pre-PR #283 shell integration; not an approved mockup.
- [search-preview-phone.png](../../../testing/evidence/sh-platform/captures/search-preview-phone.png) — synthetic implementation capture, pre-PR #283 shell integration; not an approved mockup.
- No accepted standalone page mockup is available. The retained implementation captures are explicitly distinct from design approval.

## Behaviour, handovers and verification

Open record hands off to the owning domain. Browser Back retains URL criteria. Search and preview do not grant permission or modify the source.

Use text and optional record type. Pagination requires one type and a cursor tied to the query. Facility context identifies site, physical parent and grouping; identical names alone do not establish identity.

[SH verification](../../../testing/evidence/sh-platform/README.md) records actual checks, inspected captures and CI repairs; [handover](../../../delivery/sh-platform-handover.md) records scope and dependencies. Images above predate the merged development-workspace shell controls and require a fresh paired review for that integration. No review fingerprint or owner acceptance is claimed. The article `guide.route-search` remains Draft.

## Post-rebase guide inspection

The implementation agent inspected the merged header/guide at 1440 × 1000 and 390 × 844 on `5f51713`. The route-specific Search article opens, retains Draft and Last reviewed: Not recorded, and links to its register entry. The phone guide wraps within the viewport. [Desktop capture](../../../testing/evidence/sh-platform/captures/rebased-search-guide-desktop.png) and [phone capture](../../../testing/evidence/sh-platform/captures/rebased-search-guide-phone.png) record that bounded check; the background results are not the subject of this capture. Owner and paired design acceptance remain pending, so no review fingerprint is set.
