# Approved login r02 integration

Revision: r01 · Date: 10 September 2026 · Owner: Dean Fiedler

Status: Implemented and checked locally; the initial automatic approval block is historical, and later user-authorised publication remains tracked separately from this decision note.

## Decision and scope

Dean accepted `Powerplants-One-Login-r02.html` and instructed implementation in Powerplants One. Keep the solid #242a37 navy panel, intact supplied Powerplants logo, Roboto typography, green accent, split desktop composition and compact phone header. The approved artifact SHA-256 is `1753c487a27a51dd508bcc8cd860e7a56c3d894aa1e8d223994d89d372a3fe75`.

This contribution starts at `ec7fa6912c4976dd30bc3976e0eeb306eba143b0`, the [desktop shell integration #84](https://github.com/deanrfiedler-gif/powerplants-one/pull/84). It is a separate branch stacked on #84, preserving the existing #73 → #75 → #84 dependency order. It does not merge those contributions or update Azure. Its implementation belongs to the existing identity boundary in [BP-02](../architecture/BP-02-platform-architecture.md) and [private demo runtime](azure-private-demo.md).

## Resulting behaviour

The hosted gateway's old inline placeholder is replaced by the approved login page. It is served before the authenticated Next.js application, so the shared navigation, global search, account controls and record queries do not appear on the signed-out page. `src/login/` holds the maintained template, scoped CSS, progressive-enhancement script, official Microsoft symbol and server renderer. This follows the existing gateway entry architecture; no new framework, dependency, migration or identity provider is introduced.

| Entry or outcome | Behaviour |
|---|---|
| Hosted `/login` | Public, record-free login page; Microsoft button submits natively to `/auth/login`. |
| Hosted protected page without a session | HTTP 401 with the approved login page. A rejected existing session shows the expired-session message. |
| Unauthenticated API request | Retains HTTP 401 JSON; no HTML redirect, record read or local identity selection. |
| Pending sign-in | Announces “Opening Microsoft…”, prevents repeated submission and restores the action on browser Back. Microsoft performs account selection and verification. |
| Validated provider cancellation | Clears the attempt cookie and returns to the cancelled message with retry. A raw query error or state mismatch cannot establish this outcome. |
| Account without invited access | Denied message and “Use another Microsoft account”; the existing provider request already uses account selection. |
| Expired sign-in attempt | Expired message and a fresh sign-in action. |
| Provider or identity service unavailable | Bounded unavailable message; no raw provider response, SQL or connection details. |
| Existing login rate limit | Retains 30 starts per 10 minutes and HTTP 429 / Retry-After 600; the page states the wait. |
| Successful sign-in | Retains the server-issued opaque session, secure cookies and fixed `/crm/opportunities` destination. Caller-supplied return URLs are ignored. |
| Hosted sign-out | Ends the server session, clears its cookie and returns to `/login`. |
| Local `/login` | Same visual layout, clearly marked local/fictional, Microsoft button disabled and a separate `/work` link. Existing loopback and synthetic identity restrictions remain. |

The Microsoft action works without JavaScript. Help has a native dialog with keyboard wrapping, Escape, focus return and independently scrolling content. A readable help section is available without JavaScript. The design-state chooser and simulated provider modal are removed. The environment marker remains visible. No new support address is invented; access requests go to the existing administrator, while Microsoft owns password recovery.

The logo reuses `public/brand/powerplants-logo-green-white.png` unchanged, SHA-256 `8d12f0ecc394950cd9eb66964c588efb71c8e6f445390336c245c3f6712b9694`, matching the supplied original. Typography reuses the application's existing variable Roboto WOFF. All guest-page assets are embedded from local repository files, avoiding a broad unauthenticated asset exception. The response uses no-store, no-referrer, no-index and a hash-based content-security policy. The CSS reset belongs only to this standalone gateway document; it is not imported into application styles.

The Microsoft symbol is unchanged from the [official asset](https://learn.microsoft.com/en-us/entra/identity-platform/media/howto-add-branding-in-apps/ms-symbollockup_mssymbol_19.svg), using the [official sign-in wording](https://learn.microsoft.com/en-us/entra/identity-platform/howto-add-branding-in-apps). There are no account inputs or tokens in the HTML.

## Verification and integration limits

`tests/unit/login.test.ts` exercises real HTTP gateway decisions with synthetic identity/provider dependencies: public/protected separation, JSON API denial, forged headers, hosted feature restrictions, cookie rotation/clearing, fixed redirects, recovery mapping, rate limiting and local entry. A separate case uses the installed OIDC library to prove correct-state cancellation and rejection of wrong/missing state. These do not replace live tenant verification.

`tests/ui/login.spec.ts` renders the actual gateway template and CSP in the existing component browser suite. It covers desktop/phone/narrow-phone layouts, 781 px heading containment, all recovery messages, help keyboard/scrolling behaviour, native form navigation, Back recovery and JavaScript-free sign-in/help. Its provider destination is an explicitly synthetic test response. Existing application, demo mapping, CRM, Email/Calendar and estimating checks remain enabled.

Local validation: pinned Node 24.20.0, npm 11.19.0 and the unchanged lockfile; lint, TypeScript, all 49 unit tests and Next.js build pass. Foundation, prototype and naming checks pass, retaining four issued sources and all 78 parent requirements. A smoke check through the actual local launcher also passes for both login paths and rejects forged Host/forwarded headers without contacting a database or provider. All 15 login component browser cases pass in the available Chromium 152.0.7977.0, using the pinned Playwright 1.63.0 driver; the repository's pinned Chromium 153 download timed out. Desktop, 781px, phone/narrow-phone, denied-access and expanded-help captures were visually inspected. This browser-version distinction remains explicit.

The first browser fixture attempted to intercept both sides of a redirect; the second request was not intercepted and returned ERR_EMPTY_RESPONSE. The fixture now ends at the actual `/auth/login` handoff endpoint and blocks all outside requests. Browser native submission, Back recovery and no-JavaScript checks pass; gateway HTTP tests separately verify its 302 destination and secure cookies. Live Microsoft navigation is not claimed. The pending test originally used locator assertions that waited for a deliberately held navigation; it now reads the still-visible document before commit, preserving busy/disabled/announcement and single-request assertions. No application timeout or existing assertion was relaxed.

Automatic approval review rejected creating the public GitHub work item, stating that publication of the detailed implementation/authentication/workflow payload required explicit user approval. No issue, remote branch, PR, merge or deployment was completed. The exact local patch and review evidence are prepared for approval. CI, pinned-browser and full database/application regression remain unrun on this contribution until publication is permitted. Physical-device, independent screen-reader and live Microsoft/HTTPS/tenant acceptance remain separate. The earlier r02 design review did not complete actual 200% browser zoom; a narrow viewport alone must not be reported as that test.

No deployment, tenant setting, tester invitation, live identity transaction, operational data, ERP integration or support communication is included. The approved design is implemented; production readiness and the broader private-demo acceptance remain governed by their existing handovers.
