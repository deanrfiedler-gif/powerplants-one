# ES-05 r02 / ES-06 r01 verification

Date: 16 September 2026. Repository source: `9921be2439ca479135482c51fbf3ed4b28615f37`. Contribution parent: `9c848f8db93f4cfadce682afe9ef567722d65f01`, existing draft PR [#212](https://github.com/deanrfiedler-gif/powerplants-one/pull/212). This is standalone design and documentation assurance; it does not establish application, business or production acceptance.

## Executed checks

| Check | Result and actual scope |
|---|---|
| ES-05 r02 generated command/state script | **24 groups passed**. Actual embedded script in Node VM with a lightweight DOM adapter. Exact output hash, release guards, immutable earlier issue, revision/source changes, distribution recovery and separate docked inspection |
| ES-06 generated model/UI/customer adapter | **24 groups passed**. Actual generated staff script and r03 adapter in Node VM. Exact amounts, selections, signatures/consent, identity/hash checks, original-operation recovery, negotiation, expiry/supersession, handover, persistence and storage/concurrency holds |
| Deterministic assembly | Rebuilding both HTML files produces identical SHA-256 values. Builder pins r03 and ES-05 r01 source hashes |
| Retained source preservation | Customer r03 and supplied attachment are byte-identical; issued r03, r20 and ES-05 r01 remain unchanged. The accepted UI baseline register is untouched |
| Foundation | Passed after completing this note: 78 requirements, 29 decisions and 38 planned acceptance identities preserved; no broken links or conflict markers |
| Prototype | Passed: 78 parent dispositions, 29 master decisions, 30 prototype procedures and 12 implementation packages preserved |
| Naming | Passed: 220 document records; maintained project instructions 7,962 characters; no naming errors |

Commands:

```sh
python3 docs/blueprints/quotation-lifecycle/build.py
node docs/testing/quotation-release-r02-model-check.cjs
node docs/testing/quotation-response-model-check.cjs
python3 scripts/check_foundation.py
python3 scripts/check_prototype.py
python3 scripts/check_naming.py
```

Exact HTML SHA-256 values and individual test names are retained in [ES-05 results](quotation-release-r02-model-results.json) and [ES-06 results](quotation-response-model-results.json). Those JSON files identify the tested artifacts. Re-run the scripts after any generated-content change; do not carry a previous hash forward.

The first foundation pass found five links to this verification note before it had been written. No source/requirement error was reported. The completed-file pass resolved those links and passed. This intermediate documentation failure is not represented as a clean first run.

## Native browser and visual limitation

The available cloud browser previously returned `ERR_BLOCKED_BY_CLIENT` for the local preview, then explicitly rejected a shared-file URL under its security policy. No alternative path or browser workaround was attempted after that denial. No new native screenshots are supplied.

The tests execute state transitions, renderer functions and event wiring, including the customer adapter. Their DOM shims cannot establish actual layout, responsive fit, keyboard focus, iframe/native-dialog behaviour, font loading, screen-reader output or printed/PDF pagination. Those checks and owner acceptance remain open. Reused CSS and source preservation are evidence of consistency, not a claimed visual pass.

## Source reconstruction and publication boundary

The local verification tree was reconstructed from a local `07eb34d5` checkout plus the 20 current-main source entries fetched through the GitHub connector at `9921be24`. Their Git blob hashes were compared to the current tree before the original ES-05 contribution was overlaid. Current main and PR branch were rechecked before publication and remained at the source/parent commits above.

Only the explicit contribution file list is published. The local Git diff also contains reconstructed baseline changes, so it must not be used as an indiscriminate upload list. Existing ES-05 r01 artifacts and reports remain in PR #212; this correction adds r02 and ES-06, updates stable handover/index/status/register guidance and adds reproducible sources and focused checks. No `src/`, database, deployment, adapter or accepted baseline file changes are part of this continuation.

The GitHub PR is the publication and review record. Remote CI conclusions must be read from the actual new commit, not inherited from the earlier r01 commit. No merge, hosted deployment or customer communication is part of this delivery.

## Review matrix still open

| Surface | Native review required |
|---|---|
| ES-05 staff | All six views at desktop, 390 px phone and narrow width; worklist cards; action bars; right-side snapshot; decision dialogs |
| ES-05 customer output | Correct selected customer/amount/terms; r03 component appearance; long scope wrapping; full output scroll and download |
| ES-06 customer | Compare against r03; select options; confirm signature; submit Recorded/Unknown/Failed; retain entries; ask a question; decline; inspect printed output |
| ES-06 staff | Five views, owned negotiation, original-operation reconciliation, expiry/withdrawal/supersession and prepared handover |
| Accessibility | Keyboard tab sequence, arrow-key tabs, dialog and snapshot Escape/focus return, zoom, status/error announcements and assistive technology |

Operational receiving work remains separate: complete approved source/terms/attachment evidence, authenticated authority and signing policy, server time, exact ES-05 issue loading, durable response storage/concurrency, document retention and ES-07 conversion. The standalone fixtures do not synchronise automatically and local evidence is not a secure audit store.
