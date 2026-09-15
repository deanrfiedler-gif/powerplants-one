# Warranty r01 verification record

Published for review in [draft PR #206](https://github.com/deanrfiedler-gif/powerplants-one/pull/206). Base: main `d041de7c40e7ba73acdef3252d5f18f1bf8ccb2f`. Business-owner acceptance, application integration and full AT-19/AT-33 remain separate.

## Initial published result

Source `0e41d579d509b4a9618b909337ded3f25a7291ef` passed the [dedicated workflow 35029846844](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/35029846844), job `104585517965`.

- Generated HTML SHA-256: `02282ffeefc34bb4090c7462fd9c8972dbd4a2f0056b5f165468e184a463a478`.
- Model: 25 groups passed; [original results](model-results.json).
- Native Chrome `153.0.8010.47`: 17 groups passed, no console/page errors; [original manifest](initial-native-results.json).
- Artifact `10421425339`, Warranty-design-evidence, 8,113,573 bytes; ZIP SHA-256 `f44de726864b9b781012bdc598f4297e56c4f9b360fc6b9da581ed187139ecfe`. Original artifact expires 29 September 2026.
- 27 original PNGs, three synthetic exports and both result files were downloaded. ZIP and all 27 image hashes matched the original manifest.

All six views were inspected at 1440, 390 and 320 px, including original full-page captures and top/bottom contact sheets. The customer-resolved/recovery-open state, coverage dates, evidence illustration and replacement dialog were inspected separately. Native assertions also covered 1024/820 px, no document overflow, filter-label fit, keyboard/skip/modal focus, roles, partial/failed reads, stale writes, exact exports and save failure/recovery. The layouts were readable without overlapping controls or clipped records.

Capture review found one content inconsistency: changing the supplier status to partial approval retained a pending-approval default explanation. The successor uses neutral supplier-response wording and explicit partial-approval fixture evidence. This does not change the model rules. Final successor verification is recorded below; the initial result remains retained as historical evidence.

## Final HTML result

Source `101ab550bc213b307628402479f5f2e44a8c0445` passed [workflow 35030396519](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/35030396519), job `104587302344`.

- Final HTML SHA-256: `81abea8363d638dd220915af27bac5a12a52ac595f4799510145ad9f39252dde`.
- 25 model groups and 17 native Chrome `153.0.8010.47` groups passed; no console/page errors. Model result bytes match the original retained model results.
- [Final native result manifest](final-native-results.json) retains source, HTML digest, all individual results and all 27 image hashes.
- [Original artifact 10421505449](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/35030396519/artifacts/10421505449), 8,190,072 bytes, ZIP SHA-256 `ab451a504f603ab618bbd3451b2e2015c1eb2a93342e2e793f436c6d2d7208ba`, expiry 29 September 2026.
- Final ZIP and all image hashes verified after download. Corrected supplier partial-approval wording and the remaining $500 balance were visually inspected in desktop and 320 px original captures. Earlier all-view layout review remains applicable; no CSS/template/layout changed in the wording refinement.
- Exact generated-file consistency and source-model/browser execution passed in the dedicated workflow. Documentation assurance passed on this source. Later report/evidence/index commits are documentation only and do not change these tested HTML bytes.

## Other assurance and limits

Six non-rendered DOM smoke groups passed locally through actual forms; dialog, scroll and URL-download APIs were stubbed. These checks are not native visual proof. Foundation, naming and prototype documentation checks passed locally. Published Documentation and registered UI baseline checks passed on the initial source. The Application assurance job's Static, unit and build checks passed (`npm run check`, including lint/typecheck/unit/build); its broader integration procedures were still running at this snapshot.

This is bounded design verification, not business acceptance, production authentication or proof of receiving application integration. No external business action was performed. Later documentation-only commits do not change the tested HTML bytes; exact PR checks remain authoritative for their own head.
