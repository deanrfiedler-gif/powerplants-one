# Specialist configuration r01 verification

This record separates design verification from EA-16/EA-17 mathematical and business acceptance.

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
