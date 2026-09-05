# P05 — SC-07/SC-08 visual component evidence

Original unmodified PNGs from [application run 33962234250](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/33962234250), artifact **9968406800**. PR source `97bf2c227587726e06d96ae671d2531c9004bdbf`, source tree `becdd7fbdac1f1badd102c428d3da1ef752a32d2`; CI executed merge ref `288734b24f545ede288223b575ad78326e65a913` with that identical tree. [manifest.json](manifest.json) retains every original path, dimension, SHA-256 and archive provenance.

The implementing agent manually inspected all **42 captures** on 5 September 2026 through full-page overviews and readable critical regions. Desktop viewport **1440×1000**; phone **390×844**, Chromium 153.0.8010.12 through Playwright 1.63.0, locale en-AU. All 28 browser cases passed. Original source PNG bytes were copied without alteration; temporary QA thumbnails/crops are not the retained evidence.

No blocking overlap or horizontal page clipping was found. Phone week lanes deliberately scroll horizontally within their labelled region; keyboard arrow scrolling is tested and Day remains available. Long forms and modal contents require vertical scrolling. Native date controls use browser formatting, and long single-line inputs/select values scroll or clip internally without losing stored input. Text labels, reasons and distinct version/state wording supplement colour. Error focus, original-position preservation, stale review and uncertain retry were inspected.

This is implementation self-review and synthetic viewport/component evidence. It is not independent review, real-device, screen-reader, production accessibility certification or full PT/AT/PP-01 acceptance. Database concurrency and actual reservation rollback are covered separately by the real PostgreSQL suite. No message, job pack or customer acknowledgement was produced.

| Scenario | Desktop | Phone | Manual inspection |
|---|---|---|---|
| Day | [PNG](desktop-day.png) | [PNG](mobile-day.png) | Readable resource lanes and explicit reserved travel periods; proposed demand remains separate. |
| Week | [PNG](desktop-week.png) | [PNG](mobile-week.png) | Seven desktop day columns; phone lanes use labelled internal scrolling with Day as an equivalent view. |
| Week keyboard scroll | — | [PNG](mobile-week-keyboard-scroll.png) | Phone lane receives visible keyboard focus and ArrowRight changes its scroll position. |
| Empty | [PNG](desktop-empty.png) | [PNG](mobile-empty.png) | Confirmed empty results retain resource evidence; no booking is inferred. |
| Keyboard focus | [PNG](desktop-keyboard-focus.png) | [PNG](mobile-keyboard-focus.png) | Move action is focusable and Enter opens the equivalent controlled form. |
| Keyboard move form | [PNG](desktop-keyboard-move-form.png) | [PNG](mobile-keyboard-move-form.png) | Keyboard form retains exact appointment/work-order context and complete crew/travel inputs. |
| Read failure | [PNG](desktop-read-failure.png) | [PNG](mobile-read-failure.png) | Read error and unknown availability are explicit; any retained data is labelled last successful read. |
| Systems refusal | [PNG](desktop-systems-refusal.png) | [PNG](mobile-systems-refusal.png) | Business records are removed after identity change; permission refusal and retry are visible. |
| Contact refusal input retained | [PNG](desktop-contact-refusal-input-retained.png) | [PNG](mobile-contact-refusal-input-retained.png) | Missing customer agreement refuses confirmation and preserves entered crew and reason. |
| Failed contact owned | [PNG](desktop-failed-contact-owned.png) | [PNG](mobile-failed-contact-owned.png) | Failed simulated contact creates visible owned follow-up without agreement or sending. |
| Confirmed crew | [PNG](desktop-confirmed-crew.png) | [PNG](mobile-confirmed-crew.png) | Actual confirmation shows complete saved crew, current versions and dispatch hold; the submitted form retains its observed version explicitly. |
| Cancelled | [PNG](desktop-cancelled.png) | [PNG](mobile-cancelled.png) | Terminal cancellation, reason, released current crew and owned contact consequences remain visible. |
| Drag proposal | [PNG](desktop-drag-proposal.png) | — | Desktop drag opens a proposal for review and leaves the original position until accepted. |
| Rejected move retained | [PNG](desktop-rejected-move-retained.png) | [PNG](mobile-rejected-move-retained.png) | Calendar refusal keeps the entered proposal and original booking; modal content scrolls normally. |
| Crew conflict original retained | [PNG](desktop-crew-conflict-original-retained.png) | [PNG](mobile-crew-conflict-original-retained.png) | Permitted resource/time conflict is named, with original booking retained and visible error focus. |
| Stale move current review | [PNG](desktop-stale-move-current-review.png) | [PNG](mobile-stale-move-current-review.png) | Saved and proposed versions are compared explicitly before using reviewed current versions. |
| Uncertain move retry | [PNG](desktop-uncertain-move-retry.png) | [PNG](mobile-uncertain-move-retry.png) | Accepted but unreadable response is presented as uncertain; unchanged retry recovers one result. |
| Move saved review held | [PNG](desktop-move-saved-review-held.png) | [PNG](mobile-move-saved-review-held.png) | Accepted move retains customer review and preparation/dispatch hold with saved-version context. |
| Project pending long content | [PNG](desktop-project-pending-long-content.png) | [PNG](mobile-project-pending-long-content.png) | Long project-reference reason wraps; Pending changes no booking and decisions need a reason. |
| Project rejected | [PNG](desktop-project-rejected.png) | [PNG](mobile-project-rejected.png) | Rejected request and reason persist while booking authority remains intact. |
| Project accepted held | [PNG](desktop-project-accepted-held.png) | [PNG](mobile-project-accepted-held.png) | Acceptance saves the guarded move with Changed commitment and owned review consequences. |
| Technician request boundary | [PNG](desktop-technician-request-boundary.png) | [PNG](mobile-technician-request-boundary.png) | Assigned fictional technician may propose its typed request; booking controls are absent. |
