---
title: CR05 browser failure investigation
date: 2026-10-29
---

Independent investigation of the CR-05 Customer review readiness failure recorded on [PR #735](https://github.com/deanrfiedler-gif/powerplants-one/pull/735#issuecomment-6471903090), under [integration issue #737](https://github.com/deanrfiedler-gif/powerplants-one/issues/737). Owner: this Codex session for Dean; dedicated branch `codex/cr05-browser-investigation` from main `af079a2f11abb8e5c80d184d99ba0029702cee47`. The guide-security contribution remains separate.

Initial verified evidence: the latest CI artifact (run 40693504129, artifact 12823268962, SHA-256 `1b1236d97b9ef61f1f4cd9284d9af4ba3337ad39c70592ab264079058907e1e1`) shows **Loading aftercare review…** in both the screenshot and accessibility snapshot, with no review workspace or displayed resource error. Trace ZIPs and generated Playwright reports are explicitly excluded by the workflow. The main server transport diagnostic log hit its cap at 13:51:03.837 UTC, before the CR05 test started at 14:21:30.304 UTC on 28 October; it cannot establish that test's request ordering.

The original `b9b1455e` failure archive was also downloaded and digest-verified; its screenshot and page snapshot show the same loading state. The [Native Sales evidence chapter](../testing/evidence/sales-native-completion/README.md#cr05-initial-read-investigation--29-october-2026) records both sources and the gaps in retained telemetry. Stable Chrome 156.0.8078.73 crashes before opening a local browser page, so no local browser reproduction is claimed.

The initial CR05 read now emits bounded, content-free request and visible-state diagnostics into the existing test artifact path. The delayed request and the response matched by the waiter are numbered independently, allowing the next CI result to establish whether they are the same request and whether later reads superseded it. At diagnostic head `0428d205`, all six CR05 cases passed across focused CRM, compiled shards and full Application desktop/mobile runs. Their content-free JSON is retained in the evidence chapter. The full desktop tab appeared just 259 ms before the next GET. Separate Travel assertions failed in broader lanes; these are not all-green suite results. No application behaviour, permission, error handling or timeout changes.

A test-only synchronisation candidate now identifies the held response and follows the current record GET before the unchanged five-second tab assertion. Four local Node tests pass, including preservation of current refusals and rejection of failed current reads. A controlled desktop/mobile overlap replay must reproduce the former premature assertion failure and then prove readiness after the current response. Browser validation of that candidate remains pending.

The historical root cause remains unconfirmed. The completed controls and forced hook experiment support an overlap mechanism but do not establish the missing historical sequence. No application correction, successful browser regression, independent review, acceptance, merge or deployment is claimed.
