---
title: Configuration rule sets ADR-0066 proposed
date: 2026-10-24
---

[ADR-0066](../decisions/ADR-0066-configuration-rule-sets.md) proposes building configuration rule sets on the existing CPQ interpreter. Workbenches would run published rule sets, and engineers would edit them in an extended Rules studio. Dean decided on 24 October 2026 to build the module rather than buy one.

The model covers:

- typed inputs and ordered derived values;
- lookup tables with exact and range matching;
- rules that choose their part and have conditions on derived values;
- labour from quantities;
- reference cases compared line by line;
- coverage checks;
- an Excel round trip.

An offline prototype reproduced a private screen estimator workbook across eight Excel-recalculated cases: 544 line comparisons, 0 differences. The evidence section records a second-family proof. The prototype and the workbook data stay outside the repository.

The Figma proposal and the [engineer walkthrough plan](../testing/rule-sets-engineer-walkthrough.md) are ready for review. Not done:

- owner acceptance of the model, amendments and Q1–Q8;
- the walkthrough with an engineer;
- the authority decision for real rule sets;
- build steps R1–R6.

No code, migration, seed, permission or route changed. Checks run: documentation checks only.

<!-- decision-index -->
[ADR-0066: Configuration rule sets built in Powerplants One](../decisions/ADR-0066-configuration-rule-sets.md) proposes extending the CPQ interpreter with a rule set model (derived values, range tables, part selection, labour from quantities, line-level reference cases and coverage checks) that workbenches such as ES-08 run, and records Dean's decision to build rather than buy.
