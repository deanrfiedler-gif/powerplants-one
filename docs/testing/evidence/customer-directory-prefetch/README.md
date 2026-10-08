# Directory navigation experiment evidence

<!-- versioning: git; committed history is authoritative -->

Owner: Dean Fiedler. Executed 8 October 2026. [Decision and boundaries](../../../decisions/customer-directory-prefetch.md). Based on draft #372 at `5f4119f`. Application change `9e203be`; compiled source `000181202854ce4a8318d2bc00d806c48183af17`, build `7g3uZISDiEjWT5TK2rgeB`. The later test-only correction is `6dcea2e5100638b1d20fdaf4b689b47756e6e4d4`; its src/db/public/package files are unchanged from the compiled source.

## Confirmed application and request behaviour

Only the six CrmDirectory Link sites add `prefetch={false}`. Hrefs, record identity, department context, scope/permission reads and shared leave-intent handling are unchanged. The working catalogue now binds the real directory host to /customers, /people and /contacts, with directory-specific guides and pending review status.

The one-browser probe uses fresh desktop and phone contexts, the same seven-table synthetic fixture, no emulated network and the existing readiness boundary followed by one explicit second of observation. It preserves exact directory content, one core read and before/after fixture equality; listeners are detached and request arrays copied before context closure. The raw result stores the reference fixture; successful assertions establish equality, without inventing a separately stored after-fingerprint.

| Observation | Earlier source `77d91b6`, compiled `24d19b1` | Candidate source/build `0001812` |
|---|---:|---:|
| Desktop total / declared prefetch / pre-ready prefetch | 100 / 65 / 21 | 67 / 32 / 32 |
| Phone total / declared prefetch / pre-ready prefetch | 69 / 34 / 34 | 54 / 20 / 18 |
| Desktop exact customer-record prefetch requests | 28 | 0 |
| Phone exact customer-record prefetch requests | 9 | 0 |

These are separate bounded observations on separately identified builds, not a controlled page-latency comparison. Desktop pre-ready prefetch count increased even though record prefetch disappeared. Remaining background requests belong to other components; no whole-page speedup, ten-user result or next-navigation latency improvement is claimed. The earlier raw observation remains in [gateway evidence](../customer-server-diagnosis/prefetch-classification.json).

## Browser validation and unsuccessful attempts

The first selected compiled run at `0001812`, port 3034, reports four passes, four failures and one existing skip. Desktop department continuation and desktop/phone unsaved-navigation checks passed. The saved/scoped directory cases failed at login because their existing helper sends Origin port 3000. Both new link journeys reached the correct Equipment destination but expected the wrong heading, “Equipment”; the actual heading is “Installed base”. These failures are retained, with no gateway or helper relaxation.

The focused rerun at test source `6dcea2e`, port 3000 and the same compiled build passes all five cases: the four affected cases plus warm-up. It verifies desktop name links with sequential Tab/Enter, pointer affiliation/count links, New and section navigation, phone record/New/section taps, exact receiving IDs and successful workspace responses. Automatic record prefetch is absent during each bounded pre-activation observation. Existing saved/scoped views retain sorting, filtering, persistence and phone layout checks. Read the actual counts in [verification.json](verification.json); no single combined nine-pass run is implied. The older department test deliberately skips phone, so its reload/back/new-tab proof remains desktop only.

The initial probe invocation stopped at the existing synthetic-load opt-in guard before launching the app; the correctly flagged invocation passed. The first build completed its compilation/output but its wrapper failed printing Unicode to the Windows console before recording exit. The corrected wrapper reran the build and recorded exit 0, source and build ID. Both build logs remain. Initial catalogue errors (wrong dependency extension and missing Desktop/Mobile headings) were corrected before the passing studio check.

## Integrity and remaining acceptance

[verification.json](verification.json) binds source blobs and retained artifacts, records actual test counts and distinguishes compiled application from test source. Browser report/log paths are redacted; raw trace ZIPs, session cookies and full headers are not published. Original files remain local. These transformations preserve test outcomes and failure messages.

Final targeted lint, full typecheck, studio, foundation and naming checks pass. Desktop and 390 px directory screenshots were inspected for the captured content; the 320 px saved-view captures mainly show controls with records below the fold and are not a complete record-layout review. The automated overflow assertion remains separate evidence.

The candidate's ten-user CI timing and full-suite results remain pending at publication. Earlier #372 timing evidence remains bound to its own head. No runtime claim transfers automatically to this new source. PT-27, the older uninstrumented phone timeout, hosted performance, actual phone/screen-reader review and owner acceptance remain open. This completes the requested bounded step; no further application experiment, merge or deployment is included.
