---
title: Working draft of the Figma module file audit standard filed before its pilot
date: 2026-11-14
---

On Dean's instruction of 14 November 2026 ("I am happy to proceed based on your recommendations"), the procedure for auditing one module Figma file is now a working standard in the repository rather than a pasted prompt. The [Figma module file audit](../standards/figma-module-file-audit.md) (PPO-FIGMA-FILE-AUDIT-STD) is a working draft that is not yet adopted.

**Why it is in the repository.** The prompt behind the cross-file alignment audit was never committed, so the meanings of some of its check codes had to be reconstructed. With this procedure in the repository, each audit session reads the current version from `main` and cites the commit it applied, and later changes go through review.

**What the standard sets out.**
- **Inputs.** Four inputs. The session derives the rest from the repository and lists it for Dean to confirm.
- **Rules ledger.** Built from the repository, with seed rules that cite their records. They include Dean's decisions of 14 November 2026 in [section S11 of the cross-file audit](../decisions/figma-cross-file-alignment-audit.md).
- **Checks.** 52 checks, each with a pass criterion, a method and a priority. These are the 43 codes of the cross-file audit, plus new traceability checks (TR1 to TR4) and design-ready checks (DR1 to DR5).
- **Grading.** A severity calibration table for proposal and accepted files, with precedents from earlier audits.
- **Verdict.** A readiness verdict that is not acceptance.
- **Quality review.** A separate quality review against the product direction.
- **Outputs.** Fixed CSV columns, so per-file results can be combined without new Figma calls.

**Next.** The standard is to be piloted on the Finance file. Dean adopts it in words after the pilot. A link from §2 of the [design-to-build standard](../standards/design-to-build-standard.md) waits until then.

**Checked.** `python3 scripts/build_status.py --check`, `python3 scripts/check_foundation.py` and `python3 scripts/check_naming.py`, the last of which reads the new register entry.

**No other change.** No Figma file, decision, design register, page guide or application code changed, and the design-to-build standard is unchanged. All 78 parent requirement IDs remain.
