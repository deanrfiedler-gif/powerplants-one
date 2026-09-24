# Equipment native verification evidence

<!-- versioning: git; committed history is authoritative -->

Owner: Dean Fiedler. Synthetic implementation evidence; owner, device and operational acceptance remain pending. The [programme handover](../../../delivery/equipment-native-completion-handover.md) records starting main, all nine scopes, migration 0045, canonical ownership, reconciliation and failed-run disposition. [ADR-0045](../../../decisions/ADR-0045-equipment-native-workflows.md) and the [API contract](../../../contracts/equipment-api.md) define the implementation boundaries.

## Runtime and provenance

Local verification used Windows, Node 24.21.0, Playwright 1.63.0, Chrome 154.0.8037.58, PostgreSQL 16.15 and the dedicated loopback `ppo_synthetic_test` database on port 55485. The app served the production build on loopback port 3045. No hosted environment, live provider or operational data was involved. The PNG manifest records the precise source path, capture dimensions, byte count, SHA-256 and build/source checkpoint. It retains original browser output; no image was retouched.

The two issued source packages are Equipment r02 and theme r22. Their captures are references, not native implementation screenshots. The application reuses the current shell, RecordTabs, Button, read/validation controls and tokens; the retained HTML is not a second runtime. Native image paths in the working design register identify implementation self-review, not accepted design images. Review fingerprints remain unset.

## Executed checks

| Command or maintained proof | Result |
|---|---|
| `npm run lint`; `npm run typecheck`; `npm run build` | Passed. Final build `vI00E-ErsiyjacwG81FJH`, including the phone-header correction, matches application checkpoint `cad07b4`; type checking and focused lint passed again. |
| `npm run test:unit` | Linux **385 passed** at `3413c65`; Windows has four reproduced baseline failures described below. |
| `npm run test:db` | Linux **559 passed**, zero failed/cancelled at `3413c65`, including fresh migration/seed/reseed, existing-estimate upgrade, Equipment and all retained domain regressions. |
| `node --import tsx --test tests/http/equipment.test.ts` | **1 passed** against the dedicated synthetic runtime after Site-02 fixture isolation. |
| `npx playwright test tests/browser/equipment.spec.ts tests/browser/intake.spec.ts --config playwright.compiled.config.ts --no-deps` | **Equipment: 38 passed, ten intentional duplicate skips.** Combined Equipment/intake run: 42 passed, two intake fixture-name failures, ten skipped. After unique-name isolation, the focused intake desktop/phone rerun passed 2/2; all six intake cases passed across the two runs. No application or test deadline changed. |
| `scripts/equipment-restart-proof.ts write`, actual app/PostgreSQL restarts, then `verify` | **Passed**, exact persisted data and original operation receipt/replay retained. See `restart-verification.json`. |
| `npm run studio:check` | Final publication rerun passed: 278 entries, 124 routes, 25 components, no integrity errors. Unreviewed entries and pending component acceptance remain visible. |
| `python scripts/check_foundation.py`; `python scripts/check_prototype.py`; `python scripts/check_naming.py` | Final publication reruns passed, with no errors. Foundation preserves all 78 parent requirements; naming checks 426 document records and the 7,995-character project instructions. Focused intake lint also passed after fixture-name isolation. |

The complete Linux database result is in [run 35927321649, job 107405386970](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/35927321649/job/107405386970). That job's later HTTP stage failed the old Site-01 count after an Equipment fixture added a third Asset; three files were cancelled. The new Equipment fixture uses Site 02, and the retained shared assertion stays unchanged. This is a passed database phase inside a failed overall job, not an overall CI pass.

Windows failures are the two private document-store cases, the private recovery-path case and the source-route separator case. The same four were reproduced on untouched starting main and again on current main `9e49a57`. The baseline is separate from the Equipment checkout. Application deadlines, database guards, concurrency checks and existing assertions were not weakened.

## Visual inspection

**All 39 retained originals were visually inspected on 24 September 2026.** [The manifest](manifest.json) binds each image to its source, actual dimensions and hash. The retained examples cover installed-base cards; identity and installed/served context; configuration and physical lifecycle forms; QR/manual lookup; a failed historical fix with exact legacy source and event-time Site; bulletin candidates and refused incomplete closure; Unknown support evidence; backup recording and five retained recovery stages after configuration change; and calibration snapshots at use alongside a later withdrawal.

Desktop and phone pairs use 1440 and 390 CSS px. Additional inspected samples cover 1280, 1024, 768, 430 and 320 px. Automated matrix checks exercise ten Equipment views at each of those seven widths, including controls, wrapping and application-level horizontal overflow. Header containment is asserted separately so shared utility controls cannot overlap scrolled records. The 720 × 480 capture exercises the effective CSS viewport of 1440 × 960 at 200%; it is not a physical-device or every-browser zoom claim. The final reference/application capture manifest states the actual heights.

Keyboard checks cover arrow-key RecordTabs selection, visible focus, guide-panel Escape and focus return on all seven routes. Each global information icon resolves its registered draft route article. The nine EQ scope guides remain accessible in the design register; publishing operational help and query-specific variants follows the existing HELP review contract.

Native phone evidence was recaptured after the Equipment-only header correction. Earlier captures exposed the legacy identity-grid overlap and are not used to imply that the corrected layout had already been reviewed. Full browser output remains a separate test artefact; this directory retains representative inspected images, not trace archives or browser sessions.

## Review limits

Functional assurance, visual self-review, owner acceptance, deployment and production readiness are separate. Camera capability/denial/manual fallback and unavailable sources have browser coverage, but physical camera/device and assistive-technology acceptance are open. Authentic supplier notices, calibration certificates and recovery procedures, business-duty approval, live integrations and deployment are not supplied by synthetic fixtures. No overall AT/PT acceptance status or parent requirement ID is promoted by this evidence.

## Inspected capture index

| Scope | Desktop | Phone | Additional evidence |
|---|---|---|---|
| EQ-01 Installed base | [eq-register-1440.png](eq-register-1440.png) | [eq-register-390.png](eq-register-390.png) | [eq-record-1440.png](eq-record-1440.png); [eq-record-390.png](eq-record-390.png) |
| EQ-02 Lookup | [eq-lookup-1440.png](eq-lookup-1440.png) | [eq-lookup-390.png](eq-lookup-390.png) | [eq-lookup-320.png](eq-lookup-320.png) |
| EQ-03 Configuration | [eq-configuration-1440.png](eq-configuration-1440.png) | [eq-configuration-390.png](eq-configuration-390.png) |  |
| EQ-04 Physical lifecycle | [eq-lifecycle-1440.png](eq-lifecycle-1440.png) | [eq-lifecycle-390.png](eq-lifecycle-390.png) |  |
| EQ-05 History | [eq-history-failed-fix-1440.png](eq-history-failed-fix-1440.png) | [eq-history-failed-fix-390.png](eq-history-failed-fix-390.png) |  |
| EQ-06 Bulletins | [eq-bulletins-1440.png](eq-bulletins-1440.png) | [eq-bulletins-390.png](eq-bulletins-390.png) | [eq-bulletin-closure-error-390.png](eq-bulletin-closure-error-390.png) |
| EQ-07 Support | [eq-support-recorded-desktop.png](eq-support-recorded-desktop.png) | [eq-support-recorded-mobile.png](eq-support-recorded-mobile.png) | [eq-support-detail-390.png](eq-support-detail-390.png) |
| EQ-08 Backups | [eq-backup-recorded-desktop.png](eq-backup-recorded-desktop.png) | [eq-backup-recorded-mobile.png](eq-backup-recorded-mobile.png) | [eq-backup-stages-1440.png](eq-backup-stages-1440.png); [eq-backup-stages-390.png](eq-backup-stages-390.png) |
| EQ-09 Instruments | [eq-instruments-1440.png](eq-instruments-1440.png) | [eq-instruments-390.png](eq-instruments-390.png) | [eq-calibration-at-use-1440.png](eq-calibration-at-use-1440.png); [eq-calibration-at-use-390.png](eq-calibration-at-use-390.png) |

Additional retained comparisons: [Equipment r02 desktop](source-equipment-1440.png) and [phone](source-equipment-390.png), [theme r22 desktop](source-theme-1440.png) and [phone](source-theme-390.png); [1280 register](eq-register-1280.png), [1024 configuration](eq-configuration-1024.png), [1024 x 768 record](eq-record-1024x768-1024.png), [768 lifecycle](eq-lifecycle-768.png), [430 lookup](eq-lookup-430.png), [320 lookup](eq-lookup-320.png) and [effective 200%](eq-effective-200-percent.png). Supplemental detail pairs retain [support desktop](eq-support-detail-1440.png)/[phone](eq-support-detail-390.png) and [refused closure desktop](eq-bulletin-closure-error-1440.png)/[phone](eq-bulletin-closure-error-390.png).
