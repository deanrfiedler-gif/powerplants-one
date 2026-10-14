# Excel import: validated upload and review

<!-- versioning: git; committed history is authoritative -->

**Owner:** Dean Fiedler. **Status:** User-authorised synthetic backend increment; review, owner acceptance and deployment separate.

## Decision and boundary

Continue the recovered parser on current main `65141dc` under BC-04 / PPO-010. Use the existing TypeScript/Next.js monolith, PostgreSQL reads, exact E2 receiving authority and SYN-EST-ARITHMETIC-01. No new technology, dependency, migration or grant is required.

Provide a current target preparation endpoint and a bounded JSON upload/preview endpoint. JSON with canonical base64 reuses the existing authenticated, same-origin request reader; its explicit envelope limit accommodates a 5 MiB workbook. Multipart would introduce another unbounded parsing boundary and is unnecessary for this backend increment. The parser retains its 20 MiB expanded / 256-entry / 100-line limits. Both endpoints require the current estimating owner and existing read/edit permissions. Recheck the exact target after parsing; never hold database locks while parsing untrusted bytes.

This increment returns a transient review document, not a saved proposal or review approval. It includes original typed cells, actual locators, declared origins, normalized proposed values, formula evidence, context/scope differences, row issues and independently complete cost/sell aggregates. Even a fully reconciled workbook remains ReviewRequired and cannot be imported by this endpoint. No original bytes, estimate, receipt, audit, outbox event or authenticated review is persisted. Repeating the request revalidates current authority and basis. Durable storage, authenticated confirmation, atomic commit, stable persisted line mapping and re-import remain the next increment.

## Native mapping decisions

Workbook context references must be exact native UUIDs for the permitted opportunity, selected option, organisation and site. Facility references must belong to the selected E2 scope; growing-area references identify Growing areas in that exact discovery configuration, with compatible facility membership. Display labels and the historical fixture's symbolic references never resolve records. The existing illustrative workbook therefore needs a deliberately prepared native-context copy; issued references are unchanged.

Compare ordered Inclusion/Exclusion/Assumption text (joined with a newline per kind) exactly with E2 Q01/Q02/Q03. NoneDeclared matches an absent group. Differences block and direct the estimator to an E2 successor; preview cannot approve a scope change. Other configuration facts and section system/phase labels remain visible for human review, not inferred technical equivalence.

Accept only the six explicit units ea, m, m2, m3, h and lot, without aliases or conversions. Typed numeric OOXML values, including exponent notation and redundant trailing zeros, normalize exactly with integer arithmetic; excess meaningful precision is refused. Dates accept validated ISO calendar dates or integral 1900-system serials, excluding Excel day 60. Formula caches are evidence only. Source validity is a warning using database UTC date; unknown is distinct from expired. Source dates must agree between each line and its source.

The review hash binds actor, company, target versions, exact current context, source bytes/name, parser/mapping version, date and complete review data. It is a comparison fingerprint, not a bearer token or save authority. A caller cannot submit parsed rows, changed values or an approval flag.

Traceability: EST-02–EST-05, EST-07/08, DOC-01/02; XI-01/02/03/07 preview portions. [Original contract](../contracts/excel-estimate-import.md), [parser decision](excel-estimate-import-native.md), [ordered delivery](../delivery/excel-estimate-import-plan.md). No claim is made for XI-04/05/06/08 persistence, native Excel compatibility, UI or business acceptance.
