# Maintenance r01 verification

The local **24 model groups passed**. They cover coverage/source gates, role/version refusal, calendar anchors, duplicate-safe generation, source-defined successor task scope, original occurrence preservation, owned requests, partial results, remaining-work dates, renewal proposals and receipt recovery. [Original results](model-results.json).

The local **12 non-rendered DOM groups passed** with no JavaScript errors. The complete coverage → deferral → owned request → partial result → remaining request journey, plan/review/generation, renewal/Commercial proposal, roles, saved-state reload and failed/unknown saves were exercised. The scratch check uses JSDOM and stubs native dialog, scrolling and URL downloads; these are not native browser/layout results. [Original results](dom-results.json).

Native browser verification remains pending. The reproducible repository script `scripts/check-maintenance-browser.mjs` records exact source/HTML hashes, browser version, full journey assertions and original captures of all six views at desktop/phone widths, with overflow checks at 1440, 1024, 820, 390 and 320 pixels. The `Maintenance-design-evidence` workflow artifact is the expected native evidence location; existence and results must be checked before any pass is claimed.

The earlier local Chromium download timed out and the connected browser rejected local preview navigation. This contribution does not retry alternate URLs to bypass that restriction. No native focus, viewport, 200% zoom, screen-reader, physical-device or owner acceptance follows from the model/DOM results.

See the [handover](../../../decisions/service-agreements-maintenance-design.md) and contribution PR for source and publication evidence. Documentation checks verify consistency only; they do not close SVC-12 or PPO-015.
