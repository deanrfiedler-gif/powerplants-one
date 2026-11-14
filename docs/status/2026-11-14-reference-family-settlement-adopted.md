---
title: Reference-family settlement adopted into PPO-STD-001
date: 2026-11-14
---

On Dean's instruction of 14 November 2026 ("Proceed however you believe is the most professional"), [PPO-STD-001](../standards/naming-conventions.md) section 10.2 adopts the settlement of the reference-family clashes between the module files. The settlement was drawn as a proposal on the Settings numbering registry (GL04, cross-file audit AF-141). The section gains eight catalogue rows (DSP, DPT, CLM, SCL, EAR, CAL, INS and CMS) and a dated amendment:

- Supply dispatches keep DSP and Finance disputes move to DPT.
- Finance progress claims keep CLM and Supply supplier claims move to SCL.
- EAR, CAL and INS stay the Estimating outcome review, the Estimating calibration proposal and the Service inspection.
- CMS is registered for commissioning handovers, as Dean decided in the Service alignment audit (Q11) on 13 November 2026.
- A record keeps its number when it changes family.

The amendment also records Q11's rule for test-instrument and certificate tags. They are asset tags outside the six-digit rule and Addendum A2, and their prefixes never reuse a record type: MEG for insulation testers, ERT for earth testers, PRS for pressure gauges, FLO for flow meters and INST for the Engineering instrument drawn as `SYN-CAL-002`.

This removes one of the two shared questions the alignment batches were waiting on. The Finance, Supply and Engineering files renumber in their own reviewed changes, and accepted files need a new named version when they do. The codes name synthetic design records only; no counter, column, allocation or application code changes.

Checked: each settled code's owner and example were read on `main` (the Settings record section 11, the cross-file audit AF-024, AF-043 and AF-141, the Service audit Q11, the Engineering, Supply, Finance and shared-records audits, and the Estimating ES-09 and ES-10 records). Repository checks: `python3 scripts/build_status.py --check`, `python3 scripts/check_foundation.py`, `python3 scripts/check_naming.py` and `python3 scripts/check_documentation_scope.py`. Not done: no Figma file, register, page guide or code is changed.
