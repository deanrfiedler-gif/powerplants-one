# Supplier Pricing & Cost Sources r01 verification

Baseline main: `d565a9de01b94aa7ad3fffe3a996f78c3aee589b`. Standalone PD-03 / ES-03 design; no runtime integration or business acceptance is implied.

## Final verified result

Contribution: [draft PR #222](https://github.com/deanrfiedler-gif/powerplants-one/pull/222). Final HTML source `71d486f39d11fb7420b2e6885e1c15b055f33bed` passed [run 35163851488](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/35163851488): **26 model groups, all 20 native-browser groups, no page/console errors, and 29 captures**. Focused lint, deterministic rebuild and foundation/prototype/naming assurance all passed in the complete CI checkout.

Native runtime: Chrome **153.0.8010.47**, repository-pinned Playwright 1.63.0 and Node 24.21.0. All five views were exercised at **1440, 1024, 820, 390 and 320 px**. The final phone snapshot check verifies Tab focus containment and Escape close.

Delivered HTML SHA-256: `a0a38d3f520b350a97886d5148865fe6caeb3ba1fe367a05cada6f926962a0e5`. Final ZIP SHA-256: `e08ecf74e46652b1fa6fce339366b95b25dea81671ff9297b46ddf60bd403417`. The ZIP, every PNG hash and the delivered HTML hash were verified. [Original final artifact](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/35163851488/artifacts/10474215541), retained by GitHub until 30 September 2026. Later evidence/report-only publication does not change the tested HTML bytes.

[Native result and capture manifest](native-results.json) and [model result](model-results.json) are the original returned JSON files. Two original final-source captures are retained durably:

- [Desktop price comparison](desktop-price-comparison.png).
- [Phone refresh impact](phone-refresh-impact.png).

These gallery images show the clean starting state: drive r4 awaits review; rail and tube are selected; the proposed known subtotal is AUD 6,603.12. Separate journey captures in the original artifact show the reviewed-drive subtotal AUD 6,843.92 and the saved successor.

Desktop register, price comparison, estimate cost review, saved successor, source snapshot, phone refresh and 320 px source detail were inspected during the corrected run review; the final phone snapshot was inspected after the focus correction. The final retained comparison/phone captures are checked against their source manifest. Visual review is not claimed for every one of the 29 captures.

## Local verification

- 26 model checks passed; [result](model-results.json).
- Model, UI and native-runner JavaScript syntax checked.
- Deterministic HTML assembly executed using the included builder.

## Native and repository verification

The dedicated `Supplier pricing and cost sources design` workflow runs focused lint, deterministic rebuild, model checks, foundation/prototype/naming assurance and the native browser journey using the repository's pinned runtime. The completed outcomes and original screenshots are recorded above. Executed evidence is distinct from the test definitions.

The cloud review browser previously blocked local HTTP/file navigation in this session. Native tests run as repository verification in CI; returned artifacts can be inspected locally without claiming local browser execution. Full repository documentation assurance is performed in the complete CI checkout.

## Evidence interpretation

The capture runner resets the workspace before its five-width gallery, so those images show starting fixtures. Separate journey captures show the independently reviewed drive revision and the saved successor. The gallery is not evidence of production data or owner acceptance.

Accessibility/device acceptance, governed review authority, exact external sources, production permissions and source/estimate receiving contracts remain separate.

## Initial-run correction

Source `d28ed37318408ea17ae2f1d3cc1a65602e4b03d2`, [run 35162851162](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/35162851162), passed focused lint, deterministic assembly, 25 original model checks and all three repository documentation checks. Native execution stopped after four groups: a hidden form field named `id` shadowed the form ID property, allowing the browser default submit instead of the review handler. The handler now reads the ID attribute explicitly. The failed-save check is retained and additionally asserts that no navigation occurs. The returned source-snapshot capture was inspected.

The corrected model also derives unresolved successor findings from actual retained lines, and the summary withholds a like-for-like difference when previously unknown costs become known. A new model case verifies that recovery, bringing the suite to 26 checks. Final native verification passed on the reconciled source recorded above.

## Responsive-run correction

Source `c990aaacd6817c7506ccf40339f240803f51e4d5`, [run 35163189640](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/35163189640), passed 26 model checks and the first 19 native groups, including the complete save/retry/review/successor journey and all five views at all five widths. No page/console errors were reported. The final focus-cycle assertion found that native dialog tab traversal could leave the snapshot; an explicit first/last focus loop now retains Tab and Shift+Tab inside both dialogs. The unchanged final assertion remains the acceptance gate for the correction.

The returned ZIP hash `e342e70b23e965957aa8a77cf8d8cca292bb1405cbfafe0ef56d0f2bf9bb0004` and all 29 returned PNG hashes were verified. Desktop source register and price comparison, plus phone refresh, were inspected and clear. No proposed change was changed from amber to neutral to avoid implying a source problem.

## Main reconciliation before final verification

The focus-fix source `b1fe895905f61cb40245999c54a19192b53ad3c6` did not receive a native run because newer main introduced shared documentation conflicts. Main `e1b705ac` from PR #214 was merged into this branch with all incoming files retained and only the three shared supplier-pricing entries added. Final verification passed on reconciled source `71d486f3`, as recorded above.
