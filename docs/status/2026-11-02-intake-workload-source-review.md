---
title: Intake workload Discovery source review isolation
date: 2026-11-02
---

PR [#703](https://github.com/deanrfiedler-gif/powerplants-one/pull/703) addresses Claude's narrowed P1 and P3 findings. A visible candidate whose Discovery definition or retained evidence needs review is omitted from workload rows and counts; the current owner window receives a separate `source_review_required` count and one-line notice. Other errors retain their existing handling. Shared Discovery validation is unchanged. CSV object URL cleanup runs on the next timer task after the download starts.

The [page contract](../design/development/pages/route-estimating.md) and [component consumer note](../design/development/component-bindings/2026-10-31-intake-workload.md) describe the response and presentation. Synthetic database regressions exercise both review errors, preserved valid rows/counts, owner and readiness filtering, hidden sources and unrelated validation failures. A browser fixture covers the notice's current-response boundary. Validation and its environment limits are recorded in the [implementation evidence](../testing/evidence/intake-workload-accepted/README.md). Claude confirms the existing findings; Dean merges. No deployment or owner acceptance is implied.
