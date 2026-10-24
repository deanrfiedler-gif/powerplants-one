---
title: T2e scoring corrections and review documents ported onto PR 680 tooling
date: 2026-10-25
---

PR #686 conflicted with main because PR #680 had merged a different, reviewed T2E-SYN-01 corpus definition into the same catalogue and documents. On 25 October 2026 Dean decided: "Proceed with the recommendation: treat #686 as superseded, port its distinct scoring/gold fixes and review-document verification onto #680's tooling in a new PR, and leave #686 open for me to close."

This draft claims that port. It keeps #680's catalogue recipes, materialised corpus and commands. Its scope is the L03 and L11 oracle wording, predeclared scoring applicability, separate application invariants, generated case cards and sample table, and verification of those review documents. #686 remains open and unmerged for Dean to close; its retained artifacts are not imported. No corpus approval, calibration, live request, spending or merge authority is granted.
