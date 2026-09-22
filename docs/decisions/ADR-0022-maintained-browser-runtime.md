# ADR-0022 — Maintained browser runtime

**Revision:** r02
**Status:** Selected for authorised maintenance; r02 adds Chrome major 154 after the stable channel rolled. Verification and publication for r01 recorded in issue #160
**Date:** 23 September 2026 (r02); 14 September 2026 (r01)
**Owner:** Dean Fiedler
**Source commit:** ccc2251bbba9df266cac9027ddaa9418ab9abc1d (r02); 5855713c107500ee80319952473fa1fcf7783f33 (r01)

## Reason and decision

Playwright 1.63.0 is the latest stable release checked on 14 September. Its bundled Chromium is 153.0.8010.12, before Google's 8 September security update. Keep the exact Playwright packages and use its supported `chrome` stable channel for both tests and new document rendering. Require Chrome 153.0.8010.36 or later within major 153 (r02 below extends the accepted set to major 154). Refuse an older, malformed or unreviewed-major browser before loading document content. A later major requires a tested maintenance change to this range. Do not silently fall back to bundled Chromium or alter its installed package metadata.

Install through Playwright's official Chrome installer; record the actual browser and Node versions during CI and container builds. Chrome stable installation is a rolling vendor patch within the accepted major, not a byte-pinned browser archive. The deployed application image remains selected by immutable digest. Local installation can update an existing Chrome stable installation; the runbook makes that explicit.

All five document renderers use the same guarded launcher. Existing request blocking, escaped templates, source hashes, browser-version receipts and immutable stored output remain. This changes only future rendering; existing issued bytes and acknowledgements are not regenerated. The Playwright package renderer identifier remains accurate; each output already records its actual browser version. No template, SQL or business-state migration is needed.

Also select Node 24.21.0 with npm 11.19.0 and Azure login v3.1.0 at `a641126d1b8aa4d1fa005f4f92df94a3a4c4c906` (verified `node24` action). Preserve federation, scopes, environment/main restrictions and manual deployment gates.

## r02 — Chrome stable major 154, 23 September 2026

Chrome stable rolled to 154 on 22 September 2026. `scripts/install-browser.sh` installs Google's current stable, so CI installed `154.0.8037.57` and the r01 guard correctly refused it as an unreviewed major: PR #280's CRM Leads job failed inside `npm run browser:install`, on all three attempts, before any test ran. This is the tested maintenance change that range requires.

Accept each reviewed major with its own earliest patch: **153 from `153.0.8010.36`** and **154 from `154.0.8037.57`**, the first stable 154 that CI installed. Major 153 stays accepted because installed workstations still carry it, so no one is forced to upgrade Chrome to run the suites. Major 155, and anything below a reviewed major's minimum, stay refused; nothing is adopted silently.

No fallback to bundled Chromium is introduced. No launch flag, sandbox setting or installed package metadata changes, and no issued output is regenerated. Each rendered output continues to record its actual browser version, so evidence produced under 153 and 154 remains distinguishable.

**Limits.** Chrome 154 is accepted on the evidence of CI's own installation and the browser suites that run against it. It has had no separate security review here, and this records no claim about its vulnerabilities. Local verification for r02 ran on Chrome 153.0.8010.53, which is what this workstation carries; the 154 evidence is CI's.

## Alternatives and limits

Waiting for a Playwright patch retains the known browser gap. A canary Playwright release changes the automation API without stable-release support. A custom executable download adds platform-specific extraction and integrity management; the documented stable channel is the smaller supported change. This decision does not establish that each CVE is exploitable in PPO, that Chrome is free of vulnerabilities, or that the existing browser process is suitable for arbitrary untrusted HTML. Existing synthetic content and network restrictions remain essential; no sandbox flags or host permissions are weakened.

The current Azure demo is older than main. A routine dependency update must not silently apply unrelated schema migrations. Verify its exact source, web/worker image digests, runtime and PostgreSQL server version; stop a deployment if its existing schema fails the ordinary verification gate. A repository merge is not proof of a hosted rollout.

## Evidence and references

- [Maintenance issue #160](https://github.com/deanrfiedler-gif/powerplants-one/issues/160)
- r02: [PR #280 CRM Leads run 35756165586](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/35756165586), where `npm run browser:install` installed Chrome 154.0.8037.57 over 152.0.7977.82 and the r01 guard refused it three times
- [Playwright browser pin](https://github.com/microsoft/playwright/blob/v1.63.0/packages/playwright-core/browsers.json)
- [Supported Chrome channel](https://playwright.dev/docs/browsers#google-chrome--microsoft-edge)
- [Google security release](https://chromereleases.googleblog.com/2026/09/stable-channel-update-for-desktop_0808145027.html)
- [Azure action metadata](https://github.com/Azure/login/blob/a641126d1b8aa4d1fa005f4f92df94a3a4c4c906/action.yml)
- [Node 24.21.0 release](https://nodejs.org/en/blog/release/v24.21.0)
- [GitHub Node 20 removal](https://github.blog/changelog/2025-09-19-deprecation-of-node-20-on-github-actions-runners/)
