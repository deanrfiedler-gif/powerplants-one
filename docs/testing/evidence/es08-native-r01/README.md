---
document_id: PPO-ES08-EVD
revision: r01
date: 2026-09-21
owner: Dean Fiedler
status: Verified in synthetic scope; owner acceptance separate
---

# ES-08 native verification record

[Handover and ES08-T01–T80 index](../../../delivery/es08-specialist-workbench-handover.md)
records scope, architecture, deterministic demonstration, exact-decimal differences
and residual source decisions. All fixture data is synthetic. Issued r02 documents
and r03 design source remain unchanged. The source manifest pins normalized LF
hashes; the final evidence manifest records actual executable-file fingerprints.
Retained text logs normalize LF line endings and trailing whitespace without
changing reported content. The same `.gitattributes` convention as ES-02 preserves
LF; hashes identify retained bytes and are checked against staged Git blobs and
working files.

Evidence is from Windows, Node 24.21.0, npm 11.19.0, PostgreSQL 16.15,
Chrome 153.0.8010.53 and Playwright 1.63.0. Local database testing is restricted to
`ppo_synthetic_test`. No deployment, owner acceptance or engineering approval is
implied. A 960 CSS-pixel viewport demonstrates reflow equivalent to a 1920-pixel
viewport at 200%; a separate manual browser-zoom/assistive-technology audit is not
claimed.

The compiled design test opens the issued Specialist r03 and shared theme in
separate pages, checks their retained hashes, compares actual font/logo/menu/header
tokens and measures global-search/add centring at 1920, 1440 and 1280. A deliberate
20-pixel displacement is the negative control. It checks the shared 24-pixel
collapse strip, keyboard operation and active menu row. Curated native screenshots are retained here; traces with complete request bodies
are not part of the published handover.

Visual inspection covers the six views, 143-row local table scrolling, working
inspector, pricing separation, summary width, dialog focus return, read-only and
permission-loss states. It led to the compact permission-error correction. Owner
visual/accessibility acceptance remains pending.


## Exact execution provenance

Application commit `df93ff4` includes the final phone-menu and accepted-version
refresh corrections; its engine, database and services are unchanged from
`9ecab79`. Final browser proof uses
`PPO_SOURCE_HEAD=b421c7c`; only browser synchronization changed after the build.
Direct HTTP assertions
in `37c6c7d` preserve the existing transport contract. The receiving scenario
holds a background refresh until review succeeds against the newly accepted
version. All five scenarios run in both desktop and touch-phone projects.
No screenshots are promoted to an owner-approved baseline.

[Initial Estimating run](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/35586327777)
records 177/177 unit and 70/70 database passes at `9ecab79`, including 15 specialist
cases. Its later HTTP assertion failure is disclosed in the handover. The
[hosted-demo preparation run](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/35590275615)
passed at `b421c7c`. The final local specialist HTTP rerun passed 2/2. The four
Windows full-unit failures were separately reproduced on unmodified main and all
177 units passed in Linux CI. No renderer/hosted identity limitation is used to
explain a new application failure.

The [full compiled application run](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/35590275717)
passed 244 cases with 37 intentional skips, including all ten specialist scenarios
in one run at `b421c7c`. [Selected raw CI log lines](ci-compiled-browser.txt) retain
those passes and the existing Engineering/Estimating cases that timed out in
separate development-server jobs. The handover discloses those failures.
Workflow-only `74ecac4` selects the existing compiled configuration for the E1
browser stage. The manifest separates that workflow fingerprint from the tested
application and browser source; no assertions or timeouts are changed.
The [final integrated Estimating run](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/35592341601)
then passed all stages at `74ecac4`: 177 unit, 70 database, seven HTTP, restart proof,
13 E1 project checks including warm-up, 29 ES-02 and ten ES-08 browser cases.
[Stage metadata](ci-estimating-final.json) and [selected log lines](ci-estimating-final.txt)
retain the exact result. Application and browser source are unchanged from `b421c7c`.


The native design comparison checks independent retained HTML pages, not values
exported by the native app. Source hashes:

- Specialist r03: `3cc832c3368f5b7ac9eb3352eee0fc3525e5220984214eb6c459c6ae2fb79881`
- Shared theme r22: `a305361c5d937296a8837e751f1a80ac7e6ca7615013705c7ad55ad794957df0`
- Issued build plan r02: `d2331c4d5f038d1d4cacfb34f9aafb2d01cbe4a8176e7dc3c5f37f89db569553`
- Issued prompt r02: `b370eac589a720cdfd8343051ac0fa02851c8b765ffaf296b6f52c66ed8e5c28`

Both issued r02 files match their supplied bytes and their committed Git blobs.
No raw private workbook, quote-specific prices or credentials are included.


## Retained artifacts

[Manifest](manifest.json) pins verification commit `b421c7c` and compiled application `df93ff4`, executable hashes and artifacts.
[Full compiled browser run](specialist-browser.txt) passed 9/10 scenarios; the
remaining phone receiving scenario stopped in fixture setup at the timezone-seed
statement timeout. Its [separate rerun](specialist-browser-phone-followup.txt) passed
1/1. All ten desktop/touch-phone scenarios therefore have executed passing evidence
at `b421c7c`; the setup failure is retained, not relabelled as a pass.
[HTTP](specialist-http.txt) passed two cases; [unit](specialist-unit.txt)
passed sixteen. [Local database first run](specialist-database-initial.txt) preserves
the seed-timeout failure; [targeted upgrade/retention rerun](database-upgrade-followup.txt)
passed all three cases. The complete 70/70 database result is in the linked CI run.
[Independent source comparison](es08-source-comparison.json) retains actual measurements.

| Review surface | Capture |
|---|---|
| Configure / shared shell | [1920](es08-configure-1920.png), [1440](es08-configure-1440.png), [1280](es08-configure-1280.png), [1024](es08-configure-1024.png) |
| Phone / reflow / reachable actions | [390](es08-configure-390.png), [320](es08-configure-320.png), [960 CSS px](es08-configure-960.png), [320 actions](es08-actions-320.png) |
| Parts and source working | [Parts](es08-parts-1920.png), [working inspector](es08-working-1920.png) |
| Pricing / comparison | [Pricing](es08-pricing-1920.png), [configuration comparison](es08-compare-1920.png), [receiving](es08-receiving-comparison.png), [manual retention and deletion](es08-receiving-manual-deletion.png) |
| Actual touch-phone receiving / recovery | [Receiving](phone-es08-receiving-comparison.png), [manual retention/deletion](phone-es08-receiving-manual-deletion.png), [configuration after recovery](phone-es08-terminal-recovery.png) |
| Definition / exact history | [Definition](es08-definition-1920.png), [history](es08-history-1920.png) |
| Diagrams | [Plan](es08-diagram-plan-1920.png), [screen cut](es08-diagram-screen-cut-1920.png), [cross section](es08-diagram-cross-section-1920.png), [bay section](es08-diagram-bay-section-1920.png) |
| Authority and recovery | [Read only](es08-read-only.png), [withdrawn permission](es08-permission-withdrawn.png), [terminal recovery](es08-terminal-recovery.png) |

Captures were visually reviewed for legibility, table boundaries, restrained status,
menu/header geometry, numeric diagram equivalents and actionable controls. Native
screen cut/sections are schematic and explicitly labelled; these are not CAD or
engineering release drawings. The final receiving capture confirms the empty warning
strip is absent when there are no blockers. Print/export are internal review evidence.
