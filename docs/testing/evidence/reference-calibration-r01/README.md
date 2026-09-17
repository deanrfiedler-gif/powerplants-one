# ES-10 r01 verification record

Contribution: [draft PR #221](https://github.com/deanrfiedler-gif/powerplants-one/pull/221). Baseline main: `d565a9de01b94aa7ad3fffe3a996f78c3aee589b`. Incoming ES-09: PR #220 source `19a029bb9f7e97517432b9538ba17f7144ed2023`.

## Executed results

| Source / run | Actual evidence |
|---|---|
| `0eafcf6c5efa259de4d409086a0bf893f5069374` / [35157172208](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/35157172208) | 24 model groups, 18 native groups, no page/console errors, 28 captures, focused lint, deterministic build and foundation/prototype/naming all passed. Visual inspection subsequently found a sticky-heading focus issue and skip-link capture artefact. |
| `dd3ed6b9358f2e290737568b5bf0c0e208fc6739` | Tightened malformed saved-data validation and compared all relevant evidence dimensions; original snapshots retained. |
| `788afdbb4b392f97c86344bfc495576ba12639d6` / [35157717859](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/35157717859) | Corrected focus/scroll and skip-link presentation. **24 model groups and 18 native groups passed**, no page/console errors, 28 captures. Added explicit assertions that view headings remain below local navigation. Focused lint, deterministic rebuild and all three repository documentation checks passed. |
| `e5e3eb233e7dc865a67a7d8867757dc5d510e19b` / [35157933992](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/35157933992) | Final activity wording verified. **24 model groups and 18 native groups passed**, with no page/console errors and 28 captures. Focused lint, deterministic assembly and foundation/prototype/naming checks all passed. This is the exact published HTML source; subsequent evidence/report-only publication does not alter its bytes. |

Verified native runtime: **Chrome 153.0.8010.47** through the repository-pinned Playwright dependency and Chrome channel. Tests covered all five views at **1440, 1024, 820, 390 and 320 px**, plus a full-width 320 px snapshot. Save failure/retry, escaped text, independent review, exact history, stale-source successors, reload persistence, role limits, scenario isolation, export contents, cross-tab conflict and corrupt-state retention were exercised.

`native-results.json` is the unmodified final native result/manifest from source `e5e3eb2`; `model-results.json` is its matching 24-group result. Final ZIP SHA-256 was verified as `4d3d9d7c1f45aab00500080c897f49b1af7f981bd92d27e6e30b8893b8a56cc4`, every one of its 28 PNG hashes matched the manifest, and its HTML hash matches the delivered file. [Final CI artifact](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/35157933992/artifacts/10471467971); retained by GitHub until 30 September 2026.

`layout-results.json` is the unmodified native result/manifest from source `788afdbb`. The original ZIP SHA-256 was verified as `76c62b8f98e613b0eab0a41dd503f8ecffe608940e89b577875b3b5354b3776b`, and every one of its 28 PNG hashes matched the manifest. [Original CI artifact](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/35157717859/artifacts/10471727176); retained by GitHub until 30 September 2026.

The layout-source HTML hash is `515b48f477815ee786d35ea8ed5cb82312370563b74761fd0083c979b0df2617`. Final wording-source HTML hash is `bd4b762dd9985b063591adf97f163b95ac979f75227da2178de582697ecf0410`. Later evidence/report-only commits do not change those HTML bytes.

## Visual review

Inspected the corrected desktop register, case detail, estimator panel, incoming snapshot and proposal review, plus phone comparison and 320 px estimator view. Headings remain visible, the skip link stays hidden until keyboard focus, snapshot content is readable and phone content stacks without page overflow. The native suite's overflow assertions cover all five sizes; visual inspection is not claimed for every capture.

Two original captures from the final source `e5e3eb2` are retained durably:

- [Desktop estimator panel](desktop-estimator-panel.png) — original `1440-estimator-panel.png` from the manifest.
- [Phone case comparison](phone-case-comparison.png) — original `390-compare-cases.png` from the manifest.

These depict the intentionally modified synthetic source after the stale-evidence demonstration; Willowbank shows 260 hours and the comparison median is 1.25×. The untouched starting examples remain 240 hours and median 1.20×. Screenshot state is not a change to the seed fixture.

## Environment limits and acceptance

A direct local clone was unavailable; source reads and publication used GitHub. Full repository checks were executed in the CI checkout, not claimed locally. The cloud browser blocked local HTTP/file navigation. Native verification therefore ran as repository tests, with returned CI artifacts inspected locally; no direct local-browser execution is claimed.

Owner design acceptance, screen-reader and physical-device review, high-contrast/200% zoom assessment, controlled print output, authenticated server permissions, durable storage, actual ES-09 receiving integration and ES-08/adoption governance remain separate. This contribution does not merge or deploy the design, adopt thresholds or approval authority, or close parent acceptance.
