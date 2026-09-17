---
document_id: PPO-DEAL-WORKSPACE-EVIDENCE
title: Deal Workspace r01 verification evidence
revision: r01
date: 2026-09-17
owner: Dean Fiedler
status: Standalone delivery verified; owner acceptance and runtime integration separate
---

# CR-01 r01 verification

## Verified delivery

[Native run 35181456330](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/35181456330) passed on source 091e7ec6d0e382e098bd8966904d92af8e7720f5.

| Evidence | Result |
|---|---|
| Delivered HTML SHA-256 | 8fd467547d5369de0a42cde05700495ceb0068a433d5e1c4dea0fbd1485d507a |
| Browser | Chrome 153.0.8010.47 |
| Model | 31 groups passed |
| Native journeys | 22 groups passed; no browser errors |
| Responsive coverage | Eight views at 1440, 1024, 768, 390 and 320 pixels; no page overflow |
| Native captures | 47 originals; every capture hash checked against results.json |
| Assembly and lint | Deterministic output and focused ESLint passed |
| Documentation | Foundation, prototype and naming gates passed |

The [complete native manifest](results.json) and [model results](model-results.json) are retained here. [Archive 10480907235](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/35181456330/artifacts/10480907235) contained 49 files and matched SHA-256 228b75e5eb8685f955f7d230e702309dbf137fc8684cc54cd121b64c8d1e405d. Its GitHub retention expires on 1 October 2026; six original captures are retained permanently below.

| Retained original | Review |
|---|---|
| [Desktop overview](captures/desktop-overview.png) | Record identity, five facts, stage strip, local tabs and two-column composition |
| [Tablet tasks](captures/1024-tasks.png) | Header wrapping, aligned filter/actions and separation between Edit and Complete |
| [Phone overview](captures/390-overview.png) | Stacked content, wrapped actions and independent tab scrolling |
| [Phone Board](captures/320-board.png) | Explicit Board selection, five stages, readable wrapped filters and card navigation |
| [Phone List](captures/320-list.png) | Distinct List selection, labelled records and shared filters |
| [Phone document panel](captures/320-document-panel.png) | Full viewport panel, readable evidence and reachable download/context controls |

The final 1440 Activities capture was also inspected for action spacing and filter alignment. Earlier complete native captures supplied review of all eight desktop views, commercial acceptance and prepared handover; the changes after that review are recorded below. Transient synthetic-session notification toasts are retained in original captures. No image was edited to hide an interface state.

This is developer verification of the standalone synthetic HTML. Physical-device, screen-reader, owner design acceptance, durable server integration and integrated business acceptance remain separate. The subsequent evidence/report commit changes no tested HTML, JavaScript, CSS, fixtures or browser assertions.

## Initial local checkpoint

- 31 model groups passed using scripts/check-deal-workspace-model.mjs.
- 14 local DOM-adapter groups passed, including all tabs, shared Board updates, editing, intake, document inspection and read-only controls.
- JavaScript syntax and deterministic assembly passed.
- Foundation, prototype and naming checks passed before the documentation additions; publication checks will repeat for the full package.
- Local Chromium could not launch because the execution environment refused the browser process singleton socket. No local browser-layout or screenshot pass is claimed.

## Native browser plan

The dedicated Deal workspace design workflow uses the existing repository runtime and browser pins. Its script checks real forms, dirty discard, stale comparison, original-result reconciliation, work ownership, versioned intake, exact quote basis, outcomes, receiving preparation, document validation, private/filed drafts, scoped access and navigation.

All eight views are captured at 1440, 1024, 768, 390 and 320 pixels. The artifact contains results.json with source, browser version, exact HTML SHA-256, passed groups, errors and image hashes. Review original captures before recording visual acceptance.

The native runs and corrections are recorded below. Tests exercise a standalone synthetic model; they are not proof of runtime database permissions, durability, external integration, physical-device accessibility or owner business acceptance.

## First CI correction

Source 36654bd5c7b54aee86ea6b54d7404930542000f2, [run 35179926837](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/35179926837), stopped at the focused lint gate: the render dispatcher used a conditional expression as a statement. It is now an explicit if/else. Native checks did not run on that attempt. The browser launcher also explicitly uses the existing installed Chrome channel, matching browser:install. No assertion or lint rule was removed.

## Native form correction

Source 36a3813a5fc7eb225e5b504303a2afb065de642c, [run 35180091893](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/35180091893), passed deterministic assembly, focused lint, model and documentation gates and the first six browser groups. Activity creation exposed native form named-property shadowing: its hidden input named id masked the form.id property used by the submit dispatcher. The dispatcher now matches the form selector, independent of named controls. The browser assertion explicitly checks that creation produced the requested activity. No functional assertion was removed.

## Asynchronous attachment check correction

Source 9b719c39b5087eef3d9219ff52ac22145c5df853, [run 35180506059](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/35180506059), passed 14 native groups through private/filed correspondence. The attachment assertion read the error before asynchronous File.arrayBuffer validation finished. The check now waits for the specific visible validation result, or for the successful panel close, before asserting the record and continuing. Signature, escaped-text and duplicate-byte assertions remain intact. The HTML is unchanged by this correction.

## Keyboard containment and capture correction

Source f62fe2648f344407e4e72c599cf8178e7f83399c, [run 35180717145](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/35180717145), passed 17 native groups. The keyboard check found Tab could leave the modal's document focus sequence. Explicit forward/reverse focus wrapping now supplements the native dialog. Skip-to-content keeps the current deal URL rather than entering hash routing. The native check covers reverse wrapping and skip-link identity as well as forward focus and return. Full-page captures now begin at document top so sticky/fixed elements are not captured at a previous viewport offset; the unfocused skip link is clipped.

## Complete native pass and visual polish

Source e2122bac5d614e13649ff2fd56b767dcb8266254, [run 35181003558](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/35181003558), passed all gates: 31 model groups, 22 native browser groups, no browser errors, deterministic assembly, focused lint and documentation checks. Chrome 153.0.8010.47 captured 47 original PNGs. HTML SHA-256 was 3f2a863975e79635b6d560b5b891f6c7cc4bbfcf6d4661423aa6724a0062acb9. Downloaded archive 10480776707 matched f414287541761d98291be2029ee7abb95c16d3e5bb00a28738132a95147b8b76; all 47 capture hashes matched the manifest.

Inspection of all eight desktop views plus phone overview, commercial and document panel found two minor spacing improvements: adjacent Edit/Complete actions needed a gap, and labelled activity/task/correspondence filters needed their default form margin removed to align with action buttons. These CSS-only changes are included in the delivery candidate. Native verification and original captures will be recorded for that exact HTML below.

## Responsive review follow-up

The initial 320-board capture inherited List selection from the earlier round-trip journey. The phone test now explicitly selects Board and asserts five stage columns before capturing it, then separately selects List. Review of tablet and phone captures also prompted three small layout changes: header actions wrap as a group on medium widths, phone action padding is slightly tighter, and phone Board/List filters wrap onto two rows so their current values have usable space. This corrects the test's ambiguous Board evidence rather than treating a List image as a Board pass.
