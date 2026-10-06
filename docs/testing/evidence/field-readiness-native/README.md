# FI-05 native field readiness evidence

Owner: Dean Fiedler. Implementation verification, 25 September 2026. Owner visual review, real-device acceptance and deployment remain separate and pending. [Programme handover](../../../delivery/field-quality-native-handover.md), [decision](../../../decisions/field-readiness-native.md), [capture manifest](capture-manifest.json).

## Executed behaviour

New `tests/database/field-readiness.test.ts`: **2/2 passed** on the final source. This proves exact assignment/Site binding, no technician source-edit grant, expired and superseded evidence, immutable preparation/history, current source changes, concurrent identical retries, changed-operation conflict, receipt recovery, schedule drift, cross-company/Site and revoked-assignment refusal, and no attendance/start/report side effect. Existing `customer-readiness` units cover explicit Site versus exact Facility scope and no parent inheritance; the field consumer calls that same assessment.

`tests/browser/field-readiness.spec.ts`: **2/2 passed** against the compiled application in maintained Chrome 154.0.8037.58 (Playwright 1.63.0), desktop and touch-enabled phone. Each uses an isolated synthetic appointment and the Site's single CS readiness master. The browser loses the accepted save response, recovers its original receipt, verifies one retained acknowledgement, observes a later source change, refuses the stale form, explicitly begins a new review and verifies denied reads after identity switching. Note → checkbox → action keyboard order and a minimum 44 px action height pass.

Automated document-overflow checks/captures passed at 1440, 1024, 820, 390, 320 and 720 CSS px. Heights are 960 above 600 px and 844 below. The 720 px capture is a reflow probe, **not actual 200% browser zoom proof**. The phone project also executes the complete recovery journey at 390 × 844 with touch enabled. API reads assert `no-store`.

## Source/application comparison

The exact [Quality, Safety and Site Assurance r01 HTML](../../../reference/ui/quality-site-assurance/PPO-Quality-Safety-and-Site-Assurance-Workspace-r01.html) remains unchanged. It is a **proposed standalone design**, not accepted runtime policy. Its Site readiness tab was captured at 1440 and 390 px. The manifest records original bytes, source commit and hashes for each capture.

The implementation agent inspected both reference captures; native top views at 1440 and 320; native acknowledgement sections at 1440 and 390; and changed-source history/action reachability at 390. The app retains readable wrapping, shared shell, one content-scroll owner, explicit source/visit context and unresolved conditions. Native cards use the shared tokens and controls. Other captured widths have automated geometry evidence and are not silently labelled individually visually inspected.

Deliberate adaptations: native FI-05 is an assigned visit reader, so it uses the existing Service shell and vertically ordered sections instead of the standalone package's cross-domain tabs and right rail. It records an attributable review rather than the reference's simulated source-confirmation buttons. Personal induction is explicitly unverified without a Person binding. Tool, isolation and release policies are not invented from reference fixtures. The source-owned CS content and its periods/review remain authoritative.

The shell scrolls inside its content region; top, review and history images therefore capture different positions. A screenshot called full-page by the browser does not expose the whole inner scroll region. Review/action/history captures show the lower controls and their reachability. No new dialog was introduced.

## Verification limits

No owner visual acceptance, physical device/assistive-technology session or actual browser 200% zoom session is recorded. Offline durability is deferred to FI-02. Acknowledgement provides no work permission and cannot resolve the missing authoritative User/Person mapping. Broader application/regression results and baseline comparisons are retained in the programme handover; these two new cases are not a whole-programme acceptance claim.

Earlier browser attempts are not final evidence: one fixture wrongly tried to create a second CS source for the same Site; another contacted a stale compiled server; a replacement server had not finished listening. The fixture now reuses the unique Site master, and the final successful run began after the correct server reported readiness. No business assertion or timeout was weakened.
