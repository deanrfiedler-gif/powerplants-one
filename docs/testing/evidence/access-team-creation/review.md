# AD-01 team creation: implementation observations

Observed by Codex on 12 October 2026 (Australia/Brisbane). Final application source: `999042e8926076beb12ca04f8fdf2cfa3496a6e6`. This is an implementation review, not owner acceptance, independent review, a Figma baseline or physical-device validation. Existing review fingerprints remain unchanged.

All twelve final images in [captures.json](captures.json) were inspected: form, pending result, accepted result and exact saved roster at 1440×960, 390×844 and 320×740. Chrome 155.0.8059.40, en-AU, synthetic local Systems identity and synthetic team names/people. SVG/icon artwork was replaced with simple placeholders in the DOM before each viewport capture; image pixels were not subsequently edited. These are scrolled viewport frames, not complete pages. The roster frame shows the selected team's membership and creation-history area; its heading may be above the frame. Same-named pre-existing synthetic records remain distinct by their IDs.

## Findings and correction

The twelve [initial captures](initial-captures/captures.json), at application source `ad9c9c073e6016a06e0acd6561a7b8bb28a560d9`, remain unchanged. Inspection found that the closed native lead selector clipped its UUID on phones. The final form exposes the complete selected lead ID as wrapped text below the selector. The final browser check asserts that exact ID; the final form captures show the added text. At 320 pixels, some lower form content is below the viewport and reached by ordinary scrolling.

Pending actions show the immutable team/operation IDs and explicit lookup/retry controls. At 320 pixels the controls stack without document overflow. Confirmed receipts distinguish recording from access grants and retain exact inspection/new-team actions. Saved roster/history IDs wrap on both phone widths. The browser proof checks receipt inspection focus and inspection outside the current list page, in addition to screenshots. No document-wide horizontal overflow was detected in the twelve final captured states.

## Remaining limits

The form is tall and requires scrolling. The existing phone header truncates its page title. Desktop grid neighbours can stretch with an expanded roster, and narrow action buttons wrap. These existing/layout observations remain visible; this increment does not change shared styles or claim their acceptance. Full-page visual review, zoom, keyboard coverage beyond the tested focus behaviour, assistive technology, physical devices and owner visual/security acceptance remain open. No accepted native image or new Figma design is claimed. D-020, membership lifecycle, campaigns and review routing remain separate work.
