# ADR-0022 — Maintained browser runtime

**Revision:** r01
**Status:** Selected for authorised maintenance; verification and publication recorded in issue #160
**Date:** 14 September 2026
**Owner:** Dean Fiedler
**Source commit:** 5855713c107500ee80319952473fa1fcf7783f33

## Reason and decision

Playwright 1.63.0 is the latest stable release checked on 14 September. Its bundled Chromium is 153.0.8010.12, before Google's 8 September security update. Keep the exact Playwright packages and use its supported `chrome` stable channel for both tests and new document rendering. Require Chrome 153.0.8010.36 or later within major 153. Refuse an older, malformed or unreviewed-major browser before loading document content. A later major requires a tested maintenance change to this range. Do not silently fall back to bundled Chromium or alter its installed package metadata.

Install through Playwright's official Chrome installer; record the actual browser and Node versions during CI and container builds. Chrome stable installation is a rolling vendor patch within the accepted major, not a byte-pinned browser archive. The deployed application image remains selected by immutable digest. Local installation can update an existing Chrome stable installation; the runbook makes that explicit.

All five document renderers use the same guarded launcher. Existing request blocking, escaped templates, source hashes, browser-version receipts and immutable stored output remain. This changes only future rendering; existing issued bytes and acknowledgements are not regenerated. The Playwright package renderer identifier remains accurate; each output already records its actual browser version. No template, SQL or business-state migration is needed.

Also select Node 24.21.0 with npm 11.19.0 and Azure login v3.1.0 at `a641126d1b8aa4d1fa005f4f92df94a3a4c4c906` (verified `node24` action). Preserve federation, scopes, environment/main restrictions and manual deployment gates.

## Alternatives and limits

Waiting for a Playwright patch retains the known browser gap. A canary Playwright release changes the automation API without stable-release support. A custom executable download adds platform-specific extraction and integrity management; the documented stable channel is the smaller supported change. This decision does not establish that each CVE is exploitable in PPO, that Chrome is free of vulnerabilities, or that the existing browser process is suitable for arbitrary untrusted HTML. Existing synthetic content and network restrictions remain essential; no sandbox flags or host permissions are weakened.

The current Azure demo is older than main. A routine dependency update must not silently apply unrelated schema migrations. Verify its exact source, web/worker image digests, runtime and PostgreSQL server version; stop a deployment if its existing schema fails the ordinary verification gate. A repository merge is not proof of a hosted rollout.

## Evidence and references

- [Maintenance issue #160](https://github.com/deanrfiedler-gif/powerplants-one/issues/160)
- [Playwright browser pin](https://github.com/microsoft/playwright/blob/v1.63.0/packages/playwright-core/browsers.json)
- [Supported Chrome channel](https://playwright.dev/docs/browsers#google-chrome--microsoft-edge)
- [Google security release](https://chromereleases.googleblog.com/2026/09/stable-channel-update-for-desktop_0808145027.html)
- [Azure action metadata](https://github.com/Azure/login/blob/a641126d1b8aa4d1fa005f4f92df94a3a4c4c906/action.yml)
- [Node 24.21.0 release](https://nodejs.org/en/blog/release/v24.21.0)
- [GitHub Node 20 removal](https://github.blog/changelog/2025-09-19-deprecation-of-node-20-on-github-actions-runners/)
