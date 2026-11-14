---
document_id: PPO-FIGMA-ADDENDUM-A2
date: 2026-11-09
owner: Dean Fiedler
status: Living companion to the Figma build prompts; applies PPO-REFERENCE-NAMESPACES-DEC and, from 14 November 2026, the reference-family settlement and asset-tag rule of PPO-STD-001 section 10.2
versioning: git
---

# Addendum A2 · Reference form

**In the repository.** Added on 14 November 2026 as a living master, so that every design, audit and build session can read the same text. Most alignment audits of 12 and 13 November 2026 recorded that they had not been given it. The module Figma build prompts it amends are working files kept outside the repository; where it says "the prompt", it means the module's build prompt, and where it names a prompt's section or question, that is the prompt's numbering. The private file it calls "PPO - Shell (accepted)" is now named "PPO - Shell". Later owner decisions in `docs/decisions/` take precedence over this text. No Figma link or file key is recorded here (ADR-0050, ADR-0053), and every person, record and value is synthetic.

Applies to: the Estimating module prompt (version 4, decision D12 and question Q7), the Projects module prompt (version 2, decision D3 and question Q1) and the Supply module prompt (decision D7). Paste after the prompt. Dated 9 November 2026.

## A2.1 The rule

`docs/decisions/readable-reference-namespaces.md` (PPO-REFERENCE-NAMESPACES-DEC), adopted by Dean on 20 October 2026, sets the readable reference for every new PPO record as **`<NAMESPACE>-<TYPE>-<NUMBER>`**: `SYN-SRV-000031` for a synthetic record, `PPO-SRV-000031` for a future operational one. Six digits is a minimum; counters continue and never reset; existing `SYN-PPO-…` references remain valid legacy and are not rewritten. It supersedes the longer prefix in PPO-STD-001 section 10 and ADR-0005.

## A2.2 What this changes in the prompts

- **Estimating v4, D12** said "catalogue form `SYN-PPO-EST-`, `SYN-PPO-QUO-`" and asked Q7 about it. That inverted the rule. **Draw the short form**: `SYN-EST-000312`, `SYN-QUO-000214 r02`, `SYN-OPP-000312`, `SYN-DEM-000103`. Revisions stay two-digit (`r01`, `v03`). Q7 is withdrawn.
- **Projects v2, D3** said "catalogue form `SYN-PPO-PRJ-`" and asked Q1 about it. **Draw the short form**: `SYN-PRJ-000027`, `SYN-PRJ-000024`, `SYN-QUO-000174 r02`. Q1 is withdrawn. The short form the PJ-01 page and the Sales handover sheets already use is correct, not a departure.
- **Sales file**: its `SYN-OPP-`, `SYN-QUO-`, `SYN-PRJ-` forms are correct. The Sales follow-up listed in both prompts for "reconciling the short forms" is withdrawn. Its revision labels (`r1`, `r2`) become `r01`, `r02` in a polish batch, nothing more.
- **Supply**: D7 already uses the short form.
- **Addendum A1**: the drawn toolbar component in the Shell file now reads `SYN-QUO-000214` and `SYN-EST-000312`; A1's text needs no change.

## A2.3 What stays

The `SYN-PPO-QUO-000174 r02`, `SYN-PPO-PRJ-000027`, `SYN-PPO-BLD-000042` and `SYN-PPO-PO-000215` references on the accepted Design pages (PJ-03, PJ-05, Receiving, Workshop builds) are legacy examples under the rule and are cited as such in each record's "Assumptions and proposed departures"; the numbers carry over unchanged (`SYN-QUO-000174`, `SYN-PRJ-000027`, `SYN-BLD-000042`, `SYN-PO-000215`). Specialised reference families that already have their own implemented suffix formats keep them; serials `SYN-SN-26nnnn` and test definitions `SYN-TDF-000nnn` are unaffected.

## A2.4 Repository

No repository change now. Each module record cites PPO-REFERENCE-NAMESPACES-DEC in "Rules applied" and lists the legacy examples it departed from in "Assumptions and proposed departures".

## A2.5 Reference families and asset tags (added 14 November 2026)

**One family per kind of record**, as [PPO-STD-001](naming-conventions.md) section 10.2 lists them. Its amendment of 14 November 2026 settles the clashes between module files:

| Code | Means | Instead of |
|---|---|---|
| DSP | Supply dispatch | Finance disputes, which use DPT |
| DPT | Finance dispute | `SYN-DSP-` |
| CLM | Finance progress claim | Supply supplier claims, which use SCL |
| SCL | Supply supplier claim | `SYN-CLM-` |
| EAR | Estimating outcome review (ES-09) | An earth tester tag, which uses ERT |
| CAL | Estimating calibration proposal (ES-10) | An instrument tag, which uses INST |
| INS | Service inspection | An insulation tester tag, which uses MEG |
| CMS | Commissioning handover | No family before |

A record keeps its number when it changes family: `SYN-DSP-000003` becomes `SYN-DPT-000003`.

**Asset tags are not references.** Tags written on test instruments and certificates are asset tags. They keep their three or four digits and are exempt from A2.1's six-digit minimum (Service alignment decision Q11, 13 November 2026). Examples: `SYN-MEG-002`, `SYN-CLP-006`, `SYN-PRS-001`, `SYN-FLO-001`, `SYN-TMR-002`, `SYN-CERT-0417`.

A tag prefix names the instrument's kind and never reuses a record type:
- MEG for insulation testers;
- ERT for earth testers;
- PRS for pressure gauges;
- FLO for flow meters;
- INST for the Engineering instrument drawn as `SYN-CAL-002`.

**Earlier four-digit references stay as drawn.** References that predate the six-digit rule keep their four digits, for example `SYN-EAR-0001`, `SYN-CAL-0003` and `SYN-SRC-0024`. New allocations use six digits.
