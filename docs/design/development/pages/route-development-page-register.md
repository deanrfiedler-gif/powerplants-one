# Design & build register — working design reference

Stable entry: `route:/development/page-register`. Owner: Dean Fiedler. Status: Implemented; review; visual acceptance pending.

## Purpose and tasks

Find every registered page, planned scope, shared system and journey reference; inspect its guidance, links and current review needs.

1. Search by title, route, stable key or task summary. Select Show 60 more to reach further results.
2. Open an entry to read its full scope, delivery states, desktop/mobile design, images and user guide.
3. Use local/live links with the record UUID for that specific environment. Proposed destinations remain labelled, even if the page is unbuilt.
4. Read a Markdown or sandboxed HTML reference. Use Back to return inside the reader and Close or Escape to return to the original card.
5. Inspect Coverage & changes. Update working files and refresh to verify changed coverage; export the snapshot or a review proposal for discussion.

## Desktop

At 1440 × 960 use three cards per row; below 1100 CSS px use two. Keep the shell intact, summary above the filters, and card actions visible. The reader is a centred dialog with a fixed heading/Close row and one scrolling body. Tables may scroll within their own region; long addresses wrap.

## Mobile

Below 700 CSS px stack cards, entry environment panels and token tiles. The summary uses two columns and the reader fills the viewport. Preserve search, filters, all actions, visible focus, labelled 16 px inputs and a reachable Close button at 390 and 320 CSS px. Check 200% zoom and long names.

## Components and states

Reuse the application shell, runtime semantic tokens and shared Button/ButtonLink. Use navy/green, Roboto/Verdana, meaningful visible labels and visible keyboard focus.

Loading and refresh errors use readable status messages. Empty filters explain how to recover. Source present, proposed scope, Draft guide and pending/stale visual review remain different badges. Opening guidance does not mutate business records.

## References and verification

No exact mockup image is linked yet. This document specifies the new surface; it does not claim approved visual parity. Source: `src/app/development/page-register/page.tsx`. Related shared records: shell, theme and guidance.

Verify search/proposal controls as applicable, dialog keyboard/focus behaviour, actual link targets, responsive wrapping, stale references and unavailable states. Record execution evidence in the development-workspace handover.

## Recovery

If refresh fails, the previous snapshot remains visible. Close the reader and refresh after a reference changes. A missing image opens an explanation and available design references. Unknown guides remain unavailable; no unrelated guide is substituted.

## Protected hosted workspace

In the private hosted app, show the Design & Development shell entry only for the configured owner with an active Microsoft session. Authorise direct pages, previews, guides and reference downloads on the server too. Show the exact deployed Git commit. Hosted refresh reads that release; local refresh reads working files. Temporary examples and theme proposals never save business data or Git edits. Other testers retain their existing help and business access. Verify denied and expired sessions as well as owner access, desktop/mobile wrapping, reference isolation and preview framing. See [release and access decision](../../../decisions/hosted-design-workspace.md).
