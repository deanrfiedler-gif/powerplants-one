---
document_id: PPO-DEAL-WORKSPACE-EVIDENCE
title: Deal Workspace r01 verification evidence
revision: r01
date: 2026-09-17
owner: Dean Fiedler
status: Verification in progress; design delivery and acceptance are separate
---

# CR-01 r01 verification

## Initial local checkpoint

- 31 model groups passed using scripts/check-deal-workspace-model.mjs.
- 14 local DOM-adapter groups passed, including all tabs, shared Board updates, editing, intake, document inspection and read-only controls.
- JavaScript syntax and deterministic assembly passed.
- Foundation, prototype and naming checks passed before the documentation additions; publication checks will repeat for the full package.
- Local Chromium could not launch because the execution environment refused the browser process singleton socket. No local browser-layout or screenshot pass is claimed.

## Native browser plan

The dedicated Deal workspace design workflow uses the existing repository runtime and browser pins. Its script checks real forms, dirty discard, stale comparison, original-result reconciliation, work ownership, versioned intake, exact quote basis, outcomes, receiving preparation, document validation, private/filed drafts, scoped access and navigation.

All eight views are captured at 1440, 1024, 768, 390 and 320 pixels. The artifact contains results.json with source, browser version, exact HTML SHA-256, passed groups, errors and image hashes. Review original captures before recording visual acceptance.

The initial native run and any corrections will be recorded here. Tests exercise a standalone synthetic model; they are not proof of runtime database permissions, durability, external integration, physical-device accessibility or owner business acceptance.

## First CI correction

Source 36654bd5c7b54aee86ea6b54d7404930542000f2, [run 35179926837](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/35179926837), stopped at the focused lint gate: the render dispatcher used a conditional expression as a statement. It is now an explicit if/else. Native checks did not run on that attempt. The browser launcher also explicitly uses the existing installed Chrome channel, matching browser:install. No assertion or lint rule was removed.

## Native form correction

Source 36a3813a5fc7eb225e5b504303a2afb065de642c, [run 35180091893](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/35180091893), passed deterministic assembly, focused lint, model and documentation gates and the first six browser groups. Activity creation exposed native form named-property shadowing: its hidden input named id masked the form.id property used by the submit dispatcher. The dispatcher now matches the form selector, independent of named controls. The browser assertion explicitly checks that creation produced the requested activity. No functional assertion was removed.

## Asynchronous attachment check correction

Source 9b719c39b5087eef3d9219ff52ac22145c5df853, [run 35180506059](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/35180506059), passed 14 native groups through private/filed correspondence. The attachment assertion read the error before asynchronous File.arrayBuffer validation finished. The check now waits for the specific visible validation result, or for the successful panel close, before asserting the record and continuing. Signature, escaped-text and duplicate-byte assertions remain intact. The HTML is unchanged by this correction.
