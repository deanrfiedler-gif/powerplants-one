# PT-27 network-method assurance

<!-- versioning: git; committed history is authoritative -->

Owner: Dean Fiedler. Review: draft. Recorded 11 October 2026 Brisbane. Scope: PT-27, NFR-04, D-021, AT-23. [Architecture decision](../../../../decisions/ADR-0052-pt27-network-calibration.md).

[Prior integrated-head CI](prior-complete-ci.json), source `99a0e9951569539b9b8eab342059752317e80120`, finishes with 52 successful checks and one skipped optional manual diagnostic. It covers the prior integrated application and planner repair. It is separate from the later calibration harness and final publication head; it does not confer performance or owner acceptance.

PR #391 merged at that head on 11 October, creating main commit `1842708135d187c6fd7337f2c69685aa254b4e5e`. The network-method follow-up continues in the existing PR #409; final-head CI is a separate gate. The earlier temporary-ref check cancellations remain historical observations, not the publication-head disposition.

Twenty focused checks pass (eleven TypeScript and nine Python). They cover opt-in/default network methods, source/browser/condition binding, rejection of missing/incorrect/uncapped probes, aggregate limits, opaque relay delivery and target refusal, independent directional classes, and legacy `tc` parsing. The existing observer/CPU profile tests remain. Type checking and changed-file ESLint pass after narrowing the missing-class guard. The source-specific measurement READMEs preserve every result and distinguish application failures from collector defects.

[Real Chrome relay integration](relay-browser-integration.json) verifies the unshaped SOCKS path locally at the `2fce332` helper: browser fetch and APIRequestContext setup both traverse the relay with exact bytes. Windows Chrome 155.0.8059.40 is distinct from CI Chrome 155.0.8059.39. This is transport integration proof only; no Linux shaping, application, database or timing acceptance is inferred. The relay rejects destinations outside the single declared loopback target; the CI application fixture has no configured external Font Awesome Kit. This method is not qualified for external assets or hosted URLs.

[Superseded check cancellations](superseded-checks.json) records sixteen obsolete pull-request workflows at intermediate measurement sources `c946745` and `11dc74f`. Current-source checks and all original measurement workflows remain separate. The [queued parser-fix cancellation](../network-packet-setup/parser-cancelled-ci.json) has no executed steps or samples. These cancellations are not passes or substituted evidence.

Twelve [duplicate full-assurance workflows](duplicate-measurement-checks.json) on the temporary measurement refs at `2fce332` and `beb4d0c` were also cancelled to release shared runner capacity. Scoped manual measurements, delivery PR #391 and other feature branches were excluded. Final delivery-head assurance remains a separate required gate; cancelled checks cannot support a success claim.

No application, database, public-asset or dependency source changed relative to `99a0e99` during this increment. The design register retains 322 unreviewed entries, 28 stale visual reviews and 41 pending component reviews. Original failures, the three-second target, full PT-27, the earlier HTTP 503 cause, owner/device/accessibility acceptance and deployment remain open.

All 306 new stored/original artifact hash pairs and private-value scans pass across the global calibration/comparison, packet setup failure and final packet calibration/comparison. All five summaries reproduce byte-for-byte with their documented source-specific tools; support files remain separately identified. No original failed sample is replaced or relabelled.
