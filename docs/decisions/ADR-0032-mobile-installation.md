# ADR-0032 — Mobile installation of the hosted application

**Revision:** r01
**Status:** Selected local implementation; merge, deployment and physical-device acceptance pending
**Date:** 20 September 2026
**Owner:** Dean Fiedler
**Source commit:** e6492a7f75632957633bf765f007b12137c0d6fb

## Reason and decision

Dean wants the existing Azure-hosted prototype to open from a device icon in its own window: Chrome on an Android phone, and Safari Add to Home Screen on iPhone and iPad. Installation is a browser and operating-system capability that needs a web app manifest, real icons and a document that the device can read before a session exists. Nothing about the business application needs to change to get it.

Use the framework's own manifest convention rather than a PWA library. `src/app/manifest.ts` returns `MetadataRoute.Manifest` and Next.js serves one canonical `/manifest.webmanifest` and emits one `<link rel="manifest">` per document. The manifest identity is deliberately record-free: `id` `/`, `start_url` `/work`, `scope` `/`, `display` `standalone`, unlocked orientation, the existing navy and light-canvas tokens. No identity, tenant, token, timestamp, deployment hash or per-install query string enters it, so an installed icon survives ordinary releases on the same origin.

Reuse the issued PPO logo pack. The 192, 512 and 180 px exports are copied byte-identically from `docs/reference/ui/ppo-logo-pack/icons/` into `public/pwa/`; the issued pack itself is unchanged. A maskable icon is not claimed without measuring it. `scripts/pwa-icons.ts` renders a padded derivative from the issued vector mark and then decodes every published PNG to report real dimensions, per-pixel opacity and the artwork radius as a fraction of the icon width. The pack's own square exports measure 0.389 against the 0.40 safe-circle limit — inside the limit, but with about three per cent of margin, and the rendered launcher crops show their ellipse tips meeting the circular mask. The separate derivative measures 0.330 and keeps real margin, so only it is declared `maskable`. The tooling uses the reviewed Chrome channel already required for document rendering, so no runtime image dependency is added.

The hosted gateway resolves identity before ordinary assets, which is correct for business pages and wrong for a manifest. Add the smallest possible exception: `publicInstallationAsset()` in `src/platform/installation.ts` permits GET and HEAD for five exact path strings and nothing else. It is consulted after the existing origin, host and internal-header checks and before identity resolution, and it hands the request to the same application handler. No prefix, directory, wildcard or caller-controlled filesystem endpoint is introduced, and percent-encoded or traversal variants do not match an exact string. Business pages, API authentication, the hosted offline refusals and the local-session refusal are untouched.

The separate sign-in document does not inherit the Next.js head, so it carries the same manifest link, icon links and Apple metadata from the shared contract. Its policy gains only `img-src 'self'` and `manifest-src 'self'`; the inline script and style hashes, `default-src 'none'` and the Microsoft form action are unchanged.

Change the successful sign-in destination from `/sales/opportunities` to `/work`. A manifest `start_url` alone does not decide where a fresh sign-in finishes, and an installed icon that lands somewhere other than its start URL is the defect this is meant to avoid. This intentionally changes the default landing page for ordinary browser sign-ins as well. No `returnUrl` parameter, OAuth state or nonce handling, registered callback URL or provider configuration is touched.

The in-app installation action is deliberately modest and truthful. A module-scope controller listens once for `beforeinstallprompt`, prevents its default, retains the event, and enables **Install Powerplants One** in the existing More surface only while a real unconsumed event is held. It invokes `prompt()` from the user's click, handles accepted, dismissed and rejected outcomes, refuses a concurrent prompt and discards the consumed event. A dismissal does not reopen; a later eligible event re-enables the action. Safari has no such API, so a **How to install this app** entry is always available and opens a platform-selectable instruction panel covering iPhone, iPad, Android and Mac Add to Dock. The panel is labelled as instructions, never simulates the system dialog and never reports success when it closes. The controller stores nothing: an ordinary tab cannot see an installation made in another browser, profile or device, so no localStorage flag is kept and absence of an event is never read as "not installed".

An installed window has no browser reload button, so a **Reload app** action appears only in standalone mode. It performs a full document load and deletes no cache, storage or queued work. Dirty forms and in-flight commands register in `src/components/pending-work.ts`, and the action asks before discarding them.

## Alternatives and limits

A PWA framework, a native wrapper, a separate mobile codebase or app-store packaging would all be larger than the problem; installation needs a manifest, icons and a readable document. A static `public/manifest.json` alongside generated metadata risks two competing manifests. Making `public/`, `/pwa/*` or all images public would widen the hosted boundary far beyond installation. Labelling an existing square export `maskable` without measuring it would be a claim rather than a check.

`viewport-fit=cover` is deliberately not set. Without it, iOS keeps content inside the safe areas, so the existing header, bottom navigation and dialogs need no full-bleed rework; the status bar stays opaque. Going full-bleed would require safe-area work across every existing screen and is not part of an installation change.

Installability is not offline capability. No root service worker is added, the field worker's scope is unchanged, the hosted offline refusals stand, and no authenticated HTML or API response is cached. An installed app shows a new release when the next network-backed document loads; an already-open page does not change by itself.

What this decision does not establish: that Chrome will offer a real installation on any particular device, that iOS or iPadOS will present Add to Home Screen with the labels described, that an installed Apple web app shares the browser's session, or that Mac Add to Dock has been exercised. A synthetic `beforeinstallprompt` proves this controller only. Emulated display modes, desktop browser emulation and manifest inspection are not installed-device evidence. Samsung, iPhone and iPad remain separate physical acceptance targets, and Mac has its own optional smoke check.

## Evidence and references

- Build plan `PPO-Mobile-PWA-Installation-Build-Plan-r02.md`, acceptance labels PWA-A01–PWA-A11. These are task-local labels, not blueprint requirement IDs.
- `tests/unit/installation.test.ts` — manifest contract, icon provenance and dimensions, exact-path allowlist, sign-in document and policy.
- `tests/unit/login.test.ts` — the real gateway serving installation assets with no cookie, an expired cookie and a valid cookie without resolving identity, alongside the unchanged sign-in, API, offline and forged-request boundaries.
- `tests/browser/installation.spec.ts` — emitted head, served manifest and decoded icons, install-event lifecycle, instruction panel and standalone reload.
- `scripts/pwa-icons.ts` — `build` renders the maskable derivative; `verify` reports measured dimensions, opacity and safe-zone fractions; `preview` writes launcher-sized circular and rounded-square crops.
- [W3C icon masks and safe zone](https://www.w3.org/TR/appmanifest/#icon-masks)
- [Next.js manifest file convention](https://nextjs.org/docs/app/api-reference/file-conventions/metadata/manifest)
- [MDN — Making PWAs installable](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Making_PWAs_installable)
- [Apple — Add a website to the iPhone Home Screen](https://support.apple.com/guide/iphone/iph42ab2f3a7/ios), [iPad](https://support.apple.com/guide/ipad/bookmark-a-website-ipadc602b75b/ipados), [Safari web apps on Mac](https://support.apple.com/en-au/104996)
