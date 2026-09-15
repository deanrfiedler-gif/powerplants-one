# Maintenance r01 verification

The final **24 model groups and 15 native Chrome browser groups passed**, with no page or console errors. The deterministic build reproduced the checked HTML. [Native results and original image hashes](native-results.json), [model results](model-results.json), [exact source record](source.json).

- Verified source: `2ce9fbaca5de51b03e7141dd53d4682e04fb7235`.
- HTML SHA-256: `66644e809bab58106037f4226f68f025fd2d8d462fdcce1693710bd310be14db`.
- [Run 34962528501](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/34962528501), job `104359239424`; Chrome `153.0.8010.36`, Node `24.21.0`, Playwright `1.63.0` using the maintained Chrome channel.
- Original artifact: [Maintenance-design-evidence / 10394231597](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/34962528501/artifacts/10394231597). ZIP SHA-256 `e65ca68f7e00fb9d430aa2e1b965d241830cf60e748317d0b71655f0ef72f146`; retained until 29 September 2026. The downloaded archive and all 23 original PNG hashes were checked. Repository JSON retains the manifest after artifact expiry; rerun the source script for later review captures.

The browser suite exercises the complete coverage → crop-window deferral → owned request → partial result → remaining request journey; source-template revisions/review; duplicate-safe generation; renewal proposals; saved-state reload/export; failed and unknown save recovery; read-only/denied previews; native modal focus and skip-link keyboard navigation. All six views have overflow checks at 1440, 1024, 820, 390 and 320 pixels; selected phone filter text is also checked for clipping.

Original captures of all six views at desktop and 390/320-pixel phone widths, plus the deferral dialog, were visually inspected. The first successful run exposed a hidden skip-link overlay in full-page captures and compressed phone filter labels. Both were corrected and the final originals confirm the correction. These are desktop Chrome viewport checks, not physical-device, 200% zoom or screen-reader acceptance.

The initial native run [34961507453](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/34961507453) failed before browser launch because the new script requested default Chromium while the repository installs Chrome. Commit `12108012978a65ed02bd46cac2dad60f44569772` aligned the script with the installed channel. That initial failure remains a failure; final evidence comes from the corrected source above.

The earlier local **12 non-rendered DOM groups passed** with no JavaScript errors. [Original results](dom-results.json). That check used JSDOM with native dialog, scrolling and URL-download stubs against the initial HTML hash recorded in `source.json`. Later changes were confined to CSS and the native runner; model and workspace JavaScript remained unchanged. The final native run verifies the current HTML and supersedes the earlier native-review-pending status.

Foundation, prototype and naming checks passed. Documentation checks establish consistency only. Owner design acceptance, managed agreement/occurrence services and complete SVC-12/PPO-015 business acceptance remain separate. See the [handover](../../../decisions/service-agreements-maintenance-design.md) and [draft PR #204](https://github.com/deanrfiedler-gif/powerplants-one/pull/204).
