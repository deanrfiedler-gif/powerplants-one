# Warranty r01 verification record

Initial source: main `d041de7c40e7ba73acdef3252d5f18f1bf8ccb2f` plus this isolated design contribution. Publication/source identity will be recorded after the dedicated workflow runs.

- Pure model: 25 groups passed locally. [Reproducible suite](../../../../scripts/check-warranty-model.mjs).
- Non-rendered DOM smoke: six groups passed through the actual forms and six views; dialog, scrolling and URL download APIs were stubbed. This does not demonstrate layout or native behaviour.
- Native Chrome: pending published workflow. [Suite](../../../../scripts/check-warranty-browser.mjs) and [workflow](../../../../.github/workflows/warranty-design.yml).
- Owner/device/business acceptance and full AT-19/AT-33: not claimed.

The native result manifest records source head, generated HTML hash, browser version, individual groups, console errors and screenshot hashes. Original workflow screenshots and synthetic exports are retained as a review artifact. Results and capture inspection will be reconciled here before final delivery.
