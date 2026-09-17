# ES-07 r01 verification

Date: 16 September 2026. Source/contribution parent: `8d821e9d764737ab41a753c6fb72342b399428a2`, ES-05/06 draft PR [#212](https://github.com/deanrfiedler-gif/powerplants-one/pull/212). This is standalone design and documentation assurance, not application, business or production acceptance.

## Executed checks

| Check | Actual scope / result |
|---|---|
| Generated model and UI commands | **33 groups passed**, executing the actual generated HTML scripts in Node VM with a lightweight DOM adapter; exact individual results are in [the results JSON](item-conversion-model-results.json) |
| Deterministic assembly | Passed: repeat build retained the exact ES-07 hash listed below |
| Retained references | Passed: r03, r20, ES-05 r02 and ES-06 r01 retain the hashes listed below; no accepted UI baseline update |
| Foundation, prototype and naming | All passed: 78 requirements, 29 decisions and 38 planned acceptance identities retained; 30 prototype procedures and 12 implementation packages; 223 document records and 7,962-character project instructions; no errors |

The focused groups cover all five views, exact accepted amounts/options/discount, five-decimal precision and incompatible two-decimal destination, item company/unit/reason checks, reactivation, known-but-unsynchronised effects, unknown/no-effect recovery, obsolete create closure, clarification, entity/currency/tax holds, atomic company change, role/version/confirmation gates, preserved review history, frozen conversion, partial outcomes, original-target identity, unchanged confirmed siblings, all-unknown header-first recovery, supersession, reload tampering, interrupted Submitted state, read-only mode, real ES-06 export validation, missing pack return, permitted alternate options, UI persistence, staged edits and cross-tab/storage failure.

Commands:

```sh
node docs/blueprints/item-conversion/build.cjs
node docs/testing/item-conversion-model-check.cjs > docs/testing/item-conversion-model-results.json
python3 scripts/check_foundation.py
python3 scripts/check_prototype.py
python3 scripts/check_naming.py
```

## Artifact identity

| Artifact | SHA-256 |
|---|---|
| ES-07 generated HTML r01 | `503f66ac6592d0ff6ff106d259f39c2c0fdb41477f20c871bd4ba93bb943ebcf` |
| Retained customer quotation r03 | `7ee657ef0f78d905486e9227a0821d88f86beddc9e13b872202b4095e2b6fe9a` |
| Retained r20 style board | `c68a499e857b1705d47bd6598d4b2e89526bf0861a0d234394c3da023f19b617` |
| Reused ES-05 r02 | `bf80f562ad0dce83158c50c530c5222a5f29164d4ba601833d761f24f426c842` |
| Pinned ES-06 r01 | `f7f6388c90d3d9fc38c58ddf74633db1e7614d8dea9588405ebd57777c2bb879` |
| Exact adapted issue inside ES-06 | `05805ace3087e930e63cb51e6a1f05e62e99a7a5aea1afe6f74455bb208331b9` |

The accepted default response is generated deterministically through the ES-06 response model, not inferred from the visible quote or asserted as a real customer action. Its hypothetical completeness attestation does not supply missing attachment bytes. Imported ES-06 handovers retain that incompleteness hold.

## Native browser and acceptance limit

The available cloud browser previously returned `ERR_BLOCKED_BY_CLIENT` for local preview, then rejected a shared-file URL under its security policy. No workaround, alternate browser path or new native screenshot was attempted after that denial. Script/DOM checks do not prove layout, responsive fit, font loading, native dialog behaviour, keyboard focus, screen-reader output or print pagination.

| Surface | Native review still required |
|---|---|
| Desktop and phone | Five steps, 390 px phone and narrow width, table/card transitions, support stacking, long labels/amounts, horizontal step navigation and action bar |
| Evidence and decisions | Docked inspector dimensions and scrolling, centred dialogs, Escape/focus return, storage/import notices and error focus |
| Guided forms | Keyboard sequence, unsaved destination discard, role selector, readiness links, confirmation and reason controls |
| Accessibility and print | Zoom, assistive technology, status announcements, contrast in context and printed current-view pagination |

Detailed owner visual acceptance and application integration remain open. The source preserves r20 vocabulary but does not claim a pixel or device comparison pass.

## Publication and receiving limits

The worktree is an isolated copy of the earlier verified reconstruction of main plus PR #212. Its Git diff includes older reconstruction changes, so publication uses an explicit ES-07 contribution manifest. Only ES-07 sources/output/report/checks/decision and scoped index/status/register amendments belong to this package. No `src/`, schema, service, deployment or accepted UI baseline change is included.

The dependent draft PR targets PR #212’s branch so the ES-05/06 sources are available without duplicating their contribution in the review diff. Parent branch/head and published file hashes must be checked at publication. Remote workflow results, if any, apply only to the actual new commit and must not be inherited from PR #212. No merge, deployment or customer communication is part of delivery.

Real grants, complete source documents, current issue authority, MYOB capabilities, decimal/tax behaviour, durable operations and receipts, provider correlation/idempotency, concurrency and controlled correction remain receiving integration work. The local checks do not establish protection against hostile edits or real provider duplication.
