---
title: Configuration rule sets ADR-0066 accepted
date: 2026-10-24
---

Dean accepted [ADR-0066](../decisions/ADR-0066-configuration-rule-sets.md) on 24 October 2026: "I accept ADR-0066 in PR deanrfiedler-gif/powerplants-one#681". Configuration rule sets will be built on the existing CPQ interpreter. Workbenches will run published rule sets, and engineers will edit them in an extended Rules studio. Earlier the same day Dean decided to build the module rather than buy one.

The acceptance covers the model, the amendments to four earlier records and the recommended answers to Q1–Q11. The model covers:

- typed inputs and ordered derived values;
- lookup tables with exact and range matching;
- rules that choose their part and have conditions on derived values;
- labour from quantities;
- reference cases compared line by line;
- coverage checks;
- an Excel round trip;
- several rule sets working together on one job, such as Priva fertigation and Priva control.

An offline prototype reproduced a private screen estimator workbook across eight Excel-recalculated cases: 544 line comparisons, 0 differences. A second proof against the synthetic fertigation design engine showed that design calculations need a programming-grade language. The ADR therefore keeps them as typed workbench modules, whose results feed rule sets. The prototype and the workbook data stay outside the repository.

[ADR-0034](../decisions/ADR-0034-es08-specialist-workbench.md), [CPQ rule packages](../decisions/cpq-rule-packages.md), [CPQ native runtime](../decisions/cpq-native-runtime.md) and the [estimating hub, CPQ and workbench model](../decisions/estimating-configurator-model.md) each carry a note pointing to ADR-0066. Not done:

- the walkthrough with an engineer ([plan](../testing/rule-sets-engineer-walkthrough.md));
- acceptance of the Figma design;
- the authority decision for real rule sets (Q6);
- build steps R1–R6, none of which this acceptance authorises.

No code, migration, seed, permission or route changed. Checks run: documentation checks only.

<!-- decision-index -->
[ADR-0066: Configuration rule sets built in Powerplants One](../decisions/ADR-0066-configuration-rule-sets.md), accepted by Dean on 24 October 2026, extends the CPQ interpreter with a rule set model (derived values, range tables, part selection, labour from quantities, line-level reference cases and coverage checks) that workbenches such as ES-08 run, and records his decision to build rather than buy.
