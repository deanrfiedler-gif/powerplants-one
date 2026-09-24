# Job Pack decision and print dialogs

<!-- versioning: git; committed history is authoritative -->

Owner: Dean Fiedler. Catalogue key: `job-pack-dialog`. Review: application verification in progress; owner/device acceptance pending.

## Source and consumers

`PackDialog` in `src/documents/components/client/job-pack-ui.tsx` serves Job Pack detail and first preparation. It retains the [r03 page reference](../../../reference/ui/job-pack/powerplants-one-job-pack-r03.html). It is a scoped existing exception, separate from the shared WorklistPanel. The catalogue lists it as reference-only because no isolated renderer is bound, while the real application uses it.

## Desktop

Retain the r03 heading, subtitle, body and wrapping action row.
## Mobile

On phones the dialog remains inside the viewport, its body can scroll, inputs use 16 px text and actions keep 44 px targets. Backdrop dismissal and Escape are refused during a command in flight.

## Keyboard and states

A reason dialog focuses its reason field; a choice focuses its primary action; an information dialog focuses its heading. Tab and Shift+Tab wrap between visible enabled controls. Shift+Tab from a heading outside the tab order goes to the last control. Closing returns focus to the opener, or the active pack tab if that opener no longer exists.

Saved preparation opens an exact saved-revision link. Unsaved preparation offers Save and print or Print saved draft. A refused or uncertain save retains the reason and entries; a confirmed save opens the exact successor choice. Printing never checks, issues or acknowledges a pack.

## Fixtures and evidence

`tests/fixtures/job-pack-read.json` supplies synthetic application context. `tests/browser/job-pack-source-print.spec.ts` exercises saved/unsaved choices, stale refusal, lost response, later concurrent revision, permissions and six viewport sizes. `tests/browser/packs.spec.ts` exercises the actual save-and-print API during the P06 journey. [I4 evidence and limits](../../../delivery/job-pack-i4-handover.md) keep functional, visual, device and owner review separate. This entry does not grant a review fingerprint or declare gallery implementation.
