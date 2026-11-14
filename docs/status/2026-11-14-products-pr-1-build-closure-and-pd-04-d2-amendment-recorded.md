---
title: Products PR 1 build closure and PD-04 D2 amendment recorded
date: 2026-11-14
---

[PR #947](https://github.com/deanrfiedler-gif/powerplants-one/pull/947), merged by Dean on 14 November 2026, built items 3, 16, 18, 19 and 24 of section 6 of the [Products module record](../decisions/products-module-refined-ui-proposal.md). Its new section 16 records the closure, and section 6 stays as written. The record also names the three points where the build adds to or narrows the accepted design: Retired and CandidateReplacement read as Discontinued and Alternative to, Accessory for is added, and the lifecycle filter takes only stored write values.

The [PD-04 compatibility record](../decisions/product-compatibility-figma-design.md) gains section 8, an amendment to D2 on Dean's confirmed decisions 1 and 7. Accessory for is read from the accessory's side of a Requires accessory relationship. A Replaces relationship stores the original as `from` and its successor as `to`, so the original reads Replaced by and the successor reads Replaces. The section also states what #947 built of D2, D3 and D4, and what stays unbuilt: the page restyle, Needs reassessment (D10), Q3's criteria, Q4's estimator rule and Q6's L/h unit.

These were the two after-merge records that #947's handover and Claude's confirmation review left to Claude. The [Products contract](../contracts/products-catalogue.md) remains the authority for built behaviour and is not changed here.

Checked: each statement against the contract and the merged diff of #947 on `main`, and against Dean's comment confirming decisions 1–7 on the pull request. Repository checks: `python3 scripts/build_status.py --check`, `python3 scripts/check_foundation.py`, `python3 scripts/check_naming.py` and `python3 scripts/check_documentation_scope.py`. Documentation only: no code, contract, Figma file, register or page guide changes. This is a record of code delivery, not a visual review or acceptance of the built pages.
