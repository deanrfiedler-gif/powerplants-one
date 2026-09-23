# Theme & shared controls — working design reference

Stable entry: `route:/development/design-system`. Owner: Dean Fiedler. Revision: r01. Status: Implemented for local review; visual acceptance pending.

## Purpose and tasks

Inspect the runtime theme tokens and reusable controls, and prepare a proposed global style adjustment with its likely page impact.

1. Inspect the current buttons, input labels, focus and disabled/busy examples before changing the sample.
2. Choose a navy colour or corner radius. Confirm that only the sample changes; no global stylesheet is saved.
3. Use Reset sample to restore current source defaults or Export change proposal to download the proposed values.
4. Inspect the affected-page list and the shared desktop/mobile specification.
5. Apply an agreed change through source and a pull request, update relevant references, run checks and reload the gallery.

## Desktop

Use full-width white sections with the existing shell. Keep adjustment controls above the isolated sample, then token tiles in three columns and affected consumers in an expandable list. Show exact token names/values and label each button variant.

## Mobile

Stack token tiles and the impact list below 700 CSS px. Wrap sample actions without clipping their labels. Preserve the colour input, radius choice, Reset and Export at 390/320 CSS px and 200% zoom. All controls retain 44 px minimum targets.

## Components and states

Reuse the application shell, runtime semantic tokens and shared Button/ButtonLink. Use navy/green, Roboto/Verdana, meaningful visible labels and visible keyboard focus.

Sample actions announce their result without changing business records. Disabled and busy controls remain distinct. A proposal download is not a save confirmation. Tokens shown below the sample continue to describe source values.

## References and verification

No exact mockup image is linked yet. This document specifies the new surface; it does not claim approved visual parity. Source: `src/app/development/design-system/page.tsx`. Related shared records: shell, theme and guidance.

Verify search/proposal controls as applicable, dialog keyboard/focus behaviour, actual link targets, responsive wrapping, stale references and unavailable states. Record execution evidence in the development-workspace handover.

## Recovery

Reset sample discards temporary colour/radius choices. Reload reads the current source. If a legacy page looks different, inspect its scoped CSS and accepted reference; do not assume the gallery already governs every legacy control.
