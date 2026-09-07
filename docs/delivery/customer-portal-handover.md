---
title: Customer portal - design and staged delivery handover
revision: r01
date: 2026-09-06
owner: Dean Fiedler
status: Draft PR published; design browser and visual review passed; full regression/publication pending
source_commit: 94289a20fc609e47af647b29ca8170557da312bb
---

# Customer portal handover

[Issue #50](https://github.com/deanrfiedler-gif/powerplants-one/issues/50) records Dean's instruction to design now and implement in bounded stages as supporting workflows become ready. This package is the design delivery; no runtime portal is delivered.

## Deliverables

| File | Purpose |
|---|---|
| [Design](../blueprints/customer-portal-design.md) | Role/grant matrix, five business journeys, screen and data contracts, canonical support, exact publications, report responses, knowledge, sources, traceability and operational gaps |
| [Clickable walkthrough](../blueprints/customer-portal-mockup.html) | Branded Overview, Support, Projects, Equipment/reports and Knowledge; temporary request/reply; clear empty/unavailable/access-changed scenarios |
| [CP1–CP5 plan](customer-portal-implementation-plan.md) | Bounded stages, dependencies, exit evidence and current readiness |
| [Acceptance](../testing/customer-portal-acceptance.md) | Sixteen future runtime procedures with adversarial customer/record scope and recovery fixtures; all Not run |
| [Decision](../decisions/customer-portal-direction.md) | User authority, D-027 partial direction, seven-domain/shared-source and coexistence choices |
| [CP1 starter](customer-portal-cp1-starter.md) | Detailed continuation under existing authority when core dependencies are verified |

## Inspected baseline and preservation

Repository main `94289a20fc609e47af647b29ca8170557da312bb`; local isolated branch `docs/customer-portal-design`. GitHub connector read access succeeded; direct HTTPS clone had no CLI credentials. An existing local Git object copy was used to reconstruct this exact baseline without altering other working branches. GitHub remains the publication authority. P10 #48, CRM I2 #47 and estimating E1 #49 were open at inspection; no application source, migration, lockfile or issued source asset is changed by this package.

During preparation, estimating E1 PR #49 merged at `1f13dd8d6f5006559152fe9d5410aed3fff64234`, tree `2ec197b6cdb41c913e9c404daee727f734fcb593`. The complete matching Git tree was hydrated from the existing local E1 object copy, and shared documentation was reconciled with both contributions retained. This newer publication base preserves E1; its draft-only commercial scope does not make CP5 ready.

The supplied logo matches the existing shared PNG exactly; PDF p17/p18 were rendered and visually inspected. Preview embeds the exact shared logo and the already-used Roboto subset to remain self-contained with no external fetch. Navy text on brand green follows shared contrast guidance. Reference hashes and original parent IDs remain unchanged.

## Verification record

The reconstructed local Git tree exactly matched the first published tree `417c8309c5c602743a98019bb448ed2ef84c7d43` at contribution `7577e3bda7b67afb43dc6f3928d680a4d22d9bac`. E1's merged tree is preserved in full; the portal diff is eighteen design/documentation/preview/workflow paths only.

| Check | Actual outcome |
|---|---|
| Foundation | Passed locally: 4 issued sources, 78 parents, 29 original decisions, 38 master acceptance records and all local links |
| Prototype | Passed locally: original 78 dispositions, 30 PT procedures and 12 implementation packages preserved |
| Naming | Passed locally: 61 document records, original 7 exceptions, copy-ready instructions below 8,000 characters |
| JavaScript | Exact Node 24.20.0 parsed both the inline preview and browser-check script; existing ESLint passed for the new check |
| Brand/source | Original PDF p17/p18 and supplied PNG visually inspected; exact logo hash equals existing asset; self-contained font/logo preserved |
| Browser design checks | Not run: local pinned Chromium download timed out; cloud browser rejected the local-file URL under its URL policy. No alternate URL or browser-policy bypass attempted. |
| GitHub checks | First PR jobs failed before executing any steps; runner ID 0 and no artifact/log was produced. Cause beyond that is not verified. No test failure is inferred and no test pass is claimed. |
| Visual walkthrough QA | Pending: no rendered walkthrough capture was produced or inspected. Layout and interaction source review is not a substitute. |
| Runtime CPA / business acceptance | CPA-01–CPA-16 remain Not run; no portal application/security/production acceptance claimed |

Initial failed-run dispositions: the naming instruction-size check failed before duplicate closing guidance was consolidated; the final local check passed. Local Chromium installation timed out on its advertised CDN. GitHub design run [34066046773](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/34066046773), documentation run [34066046788](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/34066046788), application run [34066046697](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/34066046697) and E1 run [34066046810](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/34066046810) stopped before runner steps. Connector step lists were empty; design artifacts were empty. Detailed check annotations could not be retrieved through the connector. The separate browser was signed out and could not inspect this private Actions page. Do not guess a billing or account-setting diagnosis.

Source review additionally fixed unbroken detail-title wrapping and retained the submitted unknown-equipment/site context and impact in the example request. These fixes have syntax/static verification only until browser execution is available. No independent human review claim.

Commands for continuation:

```sh
python3 scripts/check_foundation.py
python3 scripts/check_prototype.py
python3 scripts/check_naming.py
node docs/blueprints/customer-portal-design-check.mjs
```

The browser check must emit original PNGs and a source/capture hash manifest under `verification-evidence/customer-portal-design/`, using the existing exact package/renderer. Inspect those original desktop/390px/320px captures before merging. Retain selected original images and results; do not fabricate or substitute screenshots. Existing application/E1 regression gates stay enabled. A repository check failure does not authorise runner, billing, permission or required-check changes.

## Readiness and next step

### 7 September 2026 continuation: original browser evidence

Fresh checks on other PPO branches demonstrated that runners could execute again. The four previously prestart-failed workflows at exact portal head `b85bc01a14766de1e403c28d79e5a955700e19bf` were retried once (attempt 2); no settings or checks were changed. [Design run 34066391012](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/34066391012/attempts/2) and [documentation run 34066390954](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/34066390954/attempts/2) passed. Application and E1 regression outcomes remain governed by the external publication record; this is not a merge-readiness claim.

The original [design manifest](../testing/evidence/customer-portal-design/r01/design-review.json) and all 18 unmodified PNG captures are retained in the same evidence directory. Artifact `10000298806` ZIP SHA-256 is `741e7072acf89952e01e31b4ba0999524437cf89c495fcca33faf2dcc3805730`; downloaded bytes matched. Every capture was checked against the manifest. Preview SHA-256 remains `cb619eabe549c0ef515585e1af0ebcf1beec26d5807c215abf2dcaa92d188484`; no preview source or issued asset was changed in this continuation.

The existing pinned browser check passed its 14 named check groups at 1440×1000, 390×844 and 320×800 using Node 24.20.0 and the existing locked Playwright/Chromium. It exercised navigation, search, field/unknown-context validation, retained input, focus return, temporary requests/replies, plain-text markup, reset on reload, report illustration, article provenance, empty/unavailable/access-changed states, long text, and absence of browser storage/external requests/page errors. This is standalone design evidence, not DB/API/restart or CPA runtime acceptance.

All 18 original overview, request-form, conversation, project, article and access-changed captures were visually inspected. Text and controls reflow at all three widths; the complete logo, synthetic boundaries, date bases, public-message separation and access-loss clearing remain clear. Form captures intentionally show the validation-focused scroll position, not the whole dialog; conversation captures retain the transient unsaved-status toast. These are original interaction-state captures, not edited presentation images. Equipment/report interactions passed automated checks but have no separate captured visual-review claim. Runtime CP1 must still perform its own complete screen and permission/restart acceptance.

Source review reconciled one contradictory sentence: CP1 is strictly text-only and uploads belong to separately verified CP2a, matching the plan, starter and Dean's bounded instruction. No stage or authority was expanded. No independent human review is claimed. Local foundation/prototype/naming checks were rerun successfully on the original source tree; subsequent contribution checks and actual-main verification remain required.

Fresh main remains `1f13dd8d6f5006559152fe9d5410aed3fff64234`. P10 #48 and CRM I2 #47 are separately active; P11/P12 are absent. Migration 0011 / ADR-0016 remain reserved by P10; E1 occupies 0012 / ADR-0017. This design allocates neither. CP1 remains unready and no runtime work was started.

CP1 is prepared but was not ready on the inspected main: P11/P12 integrated quality and recovery are absent; P10 is still open. External membership and public conversation are CP1 implementation work. Continue CP1 under existing authority after actual readiness verification, with text-only support and real persistence/permission/restart proof. CP2/CP3/CP4/CP5 depend only on their explicitly listed owning workflows; no dates or production availability are promised.

Operational identity/hosting, real customer membership/delegation, publishing/support/urgent-contact policy, retention, supplier content rights and MYOB/SharePoint entitlements remain open for real activation. No live customer access, invitation/message, paid service or operational integration was performed.

## Publication and continuation

[Draft PR #51](https://github.com/deanrfiedler-gif/powerplants-one/pull/51) contains the reviewable design. First contribution: `7577e3bda7b67afb43dc6f3928d680a4d22d9bac`; publication base: `1f13dd8d6f5006559152fe9d5410aed3fff64234`. The external PR publication comment governs the latest contribution head and failed/check evidence. Normal merge and actual merged-main verification are pending. Keep #50 open until the design verification and publication finish.

An hourly condition task, “Continue PPO customer portal”, was successfully configured on 6 September 2026 in Australia/Brisbane context. It checks current repository readiness, first completes #51's verification/publication when possible, and then resumes one authorised bounded synthetic stage when its dependencies are verified. It checks active work before mutating, avoids repeating an unchanged blocker and cannot bypass access, CI, billing or deployment boundaries. The task is a configured continuation mechanism; document storage itself never schedules work.
