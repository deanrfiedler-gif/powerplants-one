# AD-01 proposed-role comparison evidence

<!-- versioning: git; committed history is authoritative -->

Owner: Dean Fiedler. Status: local verification recorded; PR CI and owner acceptance remain separate.

## Scope and source

[Native decision](../../../decisions/access-review-native.md#proposed-role-comparison-continuation--11-october-2026). Branch `codex/ad01-role-comparison`; prerequisite [PR #413](https://github.com/deanrfiedler-gif/powerplants-one/pull/413) at `27863308e52fb35a78f34f43eb051194c34b06ba`. Main `ba1f4e3` is integrated.

Seven retained business/approval proposals are inspected and compared against current grants at one exact company/site. Service coordinator r02 remains Draft and adds only pack.check. Native definitions preserve the source bundle IDs/revisions and are checked against the retained design model. The operator-managed hosted tester set is excluded. Teams, role assignment, access-changing commands and campaigns remain subsequent work. No migration, seed, capability/grant, dependency, hosted configuration or deployment change.

Final compiled application source: `fd8cd548b66f1b7e71c873867874a8c4511da04b`. Browser/ capture checkout: `3118920944cc8f92cd8b98153de2407ce0ab1c72`; the only intervening changes correct a browser selector and retain the initial failed run. The database/service, proposal definitions and database tests remain unchanged from `abdbdc9`; the database run preceded subsequent presentation-only changes. [Machine-readable checks](checks.json) and [capture manifest](captures.json) retain these boundaries.

## Actual checks

| Check | Result |
|---|---|
| Compiled build and whole-project TypeScript | Pass at final application source |
| Full AD-01 database suite on disposable ppo_synthetic_test | 22 pass; [raw result](database.txt) |
| Compiled browser and HTTP suite | 24 pass, 8 cases at 1440/390/320 px; [raw result](browser.txt) |
| Source-fidelity and navigation unit checks | 18 pass; [raw result](unit.txt) |
| Changed-source ESLint, including corrected selector | Pass |
| Foundation, prototype and naming checks | Pass; documentation assurance, not business acceptance |
| Live design register | 356 entries / 202 source routes, zero errors; 328 unreviewed, 28 stale and 41 component reviews pending |
| Capture integrity | 15 images plus retained reference hash verified against the manifest |

Database cases prove exact proposal/revision validation; same-name company keys; Company, Site and Workspace scope; working-company narrowing; missing workspace targets; inactive identities; future/expired grants; expired/denied reviewer access; hosted-name masking; and unchanged users, grants, audit, sessions and working-company rows after reads. They retain all earlier upgrade/reseed and capability inspection cases.

Browser checks cover the real catalogue, keyboard disclosure with a 44 px target, exact revision delta, scoped matches/refusals, company/site handover, GET-only/no-store API responses, denied context removal and unavailable retry. Source review identified a cached-result edge case when returning to an earlier selection. Both comparison and existing person explanation now advance the resource request before reading; a delayed-response test proves the old result stays hidden until the fresh read returns at all three widths.

The [initial browser run](initial-browser-selector-failure.txt) used the label Retry where the shared ReadState control says Retry loading. One desktop case timed out; the run was stopped after 12 passes and that failure, with the remaining cases unexecuted. Correcting the selector alone produced the final 24-pass run on the unchanged compiled app. Failed/interrupted evidence is not counted as passing. No timeout or runtime control was changed for that correction.

## Native/reference observation

Fifteen captures at 1440 × 960, 390 × 844 and 320 × 740 are bound to `3118920944cc8f92cd8b98153de2407ce0ab1c72` and Chrome 155.0.8059.40. The final reference captures select the actual Role bundles subview. Native captures include the catalogue, positive first-site comparison, negative second-site comparison and explicit capability outcome/Explain link. These are synthetic implementation observations, not accepted mockups. The reference uses a fixed historical design fixture; it is not a current database comparison.

Representative paired desktop/phone captures were inspected by the implementing agent:

- The retained design uses a role list, persistent detail panel and supporting warnings. Native pages use the current shell, shared cards and a separate person comparison. The r01/r02 distinction and added pack.check remain explicit; this layout adaptation awaits owner acceptance.
- At 390/320 px, cards and result text wrap without page-wide horizontal overflow. Exact company/site text is repeated in the result even when a native select truncates its closed label. Long pages scroll; the role draft and capability outcomes can be below the first screen.
- The native result checks one selected company/site through the server rule. It does not copy the design's scope-independent match shortlist or infer membership.
- Shared disclosure focus/targets, status text and the fresh explanation link remain visible. Capture review does not prove physical-device, 200% zoom or screen-reader acceptance.

| Width | Native proposals | Native positive result | Native different-site result | Native capability outcome | Retained role subview |
|---|---|---|---|---|---|
| 1440 px | [Catalogue](native-1440-roles.png) | [Match](native-1440-comparison.png) | [Refusal](native-1440-different-site.png) | [Outcome](native-1440-outcome.png) | [Reference](reference-1440-roles.png) |
| 390 px | [Catalogue](native-390-roles.png) | [Match](native-390-comparison.png) | [Refusal](native-390-different-site.png) | [Outcome](native-390-outcome.png) | [Reference](reference-390-roles.png) |
| 320 px | [Catalogue](native-320-roles.png) | [Match](native-320-comparison.png) | [Refusal](native-320-different-site.png) | [Outcome](native-320-outcome.png) | [Reference](reference-320-roles.png) |

## Remaining work

Owner visual, device, zoom and screen-reader review; the operational D-020 matrix/security review; canonical teams; controlled independent access changes; attestation campaigns; full current-head CI and deployment remain separate. No accepted review fingerprint, adopted role or production authority is inferred.
