# Specialist configuration r01 verification

This record separates design verification from EA-16/EA-17 mathematical and business acceptance.

## Final verified result

**27 model groups and 23 native Chrome groups pass**, with no browser console errors. Focused ESLint, deterministic assembly and documentation foundation/prototype/naming checks pass. All five views were checked at 1440, 1024, 820, 390 and 320 px. Fourteen original captures were reviewed directly or matched byte-for-byte to already inspected captures; the exact method and hashes are in visual-review.json.

- Verified source: 0c5e60868b6651e9eee55742fa04bb722cbf894a.
- HTML SHA-256: 52c59d94b8a743eb6e521917c3db88564e3aaaaaea5f2f29959f40a4deae5639.
- Native run: [35048234854](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/35048234854).
- Runtime: repository Node 24.21.0 / Playwright 1.63.0; actual Chrome 153.0.8010.47.
- Original results: results.json and model-results.json. Earlier failures and the prior passing run remain in separate files.
- Review package: [draft PR #210](https://github.com/deanrfiedler-gif/powerplants-one/pull/210). Subsequent documentation-only commits retain the verified HTML bytes.

The preceding source 3acbf202f96be1bbc4f823ab1db9955c3e974e23 also passed all 23 native groups in run [35047879245](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/35047879245); prior-passing-results.json retains that result. The final rerun additionally checks live source-status consistency while typing.

The focused design result does not claim completion of every repository-wide application workflow or business acceptance. Native ZIP artifacts have 14-day retention; the checked-in scripts, exact hashes, original JSON results and visual-review record support reproduction.

## Initial local checks

- JavaScript syntax and deterministic assembly pass.
- 27 model groups pass; original structured results are in model-results.json.
- An initial test expectation counted the zero-cost-cloth subtotal as AUD 3,220 instead of AUD 3,100. Independent line addition confirmed AUD 3,100; the expectation was corrected. Model arithmetic was unchanged.
- Native Chrome controls, responsive layouts and visual review are pending at initial publication.

The native runner records exact source SHA, HTML hash, browser version, named groups, console errors and image hashes. Original evidence is retained before visual refinements. Final delivery will record the executed run and reviewed captures.

No approved formula, accepted golden calculation, production permission service, estimate API or database integration is exercised. EA-16/17 and G06 remain open.

## Initial native finding

Run [35047113294](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/35047113294), source f6be6170976947f2ddd031b9fcc6e95484b51573, HTML SHA-256 34a1f081a67506ae201daca414eddc9fe033dcc290b1526f8708872fbcb54282, rendered the initial view successfully. The next check exposed an input blur handler that replaced the Next button before its click could validate the field. The text-input change handler now preserves the button; selection changes still refresh conditional fields. The assertion was retained. Original results are in initial-results.json.

The initial 1440 px Configure capture was visually inspected: r20 styling, form/preview proportions, fixed scope, evidence boundary, labels and controls were readable without overlap. This is a partial initial review, not final responsive assurance.

Additional model checks cover a previously retained manual key returning in a later reference and rejection of altered part units or forged totals. Explicit lock/scope-change messages were added. These refinements await the subsequent native run.

## Second native and static findings

Run [35047412498](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/35047412498), source 4b483357090b531fd0c2d9943fce02123a7386e2, HTML SHA-256 c9e20e408db944a32bb9018bfa5d18f703061226e67e42c335506d59cb19e87a, passed 13 native groups through input validation, overrides, staging, manual/unmatched rerun, immutable snapshots and the definition catalogue. Preview role selection then exposed a compound accessible label containing option text. Explicit accessible names now identify the preview selectors and all main fields; the original interaction check remains. Original results are in second-results.json.

The E1 and Email Calendar workflows also rejected two unused catch parameters in the new workspace source at their shared lint gate. Both unused parameters were removed; focused ESLint now passes and is included in the specialist workflow. No application-domain code was changed.

## Live source-status refinement

Text-input edits now update the calculation-status strip as well as the computed preview, without replacing form buttons. Current validation errors and override-version reviews are displayed with the source boundary. The arbitrary-input native check now also verifies that the visible strip reports no matching reference result immediately after the answer change. This closes the stale-label risk introduced when preserving the form click target.
