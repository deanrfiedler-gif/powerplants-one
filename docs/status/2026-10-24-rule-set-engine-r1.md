---
title: Rule set engine R1 (ADR-0066)
date: 2026-10-24
---

Build step R1 of [ADR-0066](../decisions/ADR-0066-configuration-rule-sets.md) adds the configuration rule set engine. Dean asked for it on 24 October 2026: "Yes: start ADR-0066 build step R1, the rule set engine, as its own PR with synthetic fixtures."

`src/cpq/rule-sets/` implements definition schema 5, as described in the [rule set definition contract](../contracts/rule-set-definition.md):

- validation of untrusted definitions, reporting every problem with a path and a code;
- a typed formula language checked when a rule set is saved;
- exact evaluation with lookups that stop rather than guess;
- ordering by whole units, stock lengths and packs;
- labour from material quantities and installation minutes;
- line-by-line reference cases and the coverage checks;
- rule sets working together on one job, with shared parts flagged.

The isolated CPQ worker runs it through three new kinds. Definition schemas 1–4, their hashes and saved evidence are unchanged.

Evidence: 43 unit tests on fictional SYN screen, fertigation and control families, with expected values worked by hand. They include the eight cases a first independent review found, and the twelve (F1–F12) that Codex's review of `ddf3283f` found. Each of those twelve fails on `ddf3283f` and passes after the fixes. The existing CPQ unit tests still pass.

A probe for F9 showed that copying an 80 MB input value into the worker aborted the whole Node process, because the worker's memory limit does not cover the copy. The rule set runner now refuses an oversized request before it starts a worker. The older runner kinds are unchanged; whether every path to them bounds its request was not checked in this change.

Not done: storage and versioning (R2), the Rules studio screens (R3, which wait for the Figma design to be accepted), the Excel round trip (R4) and ES-08 on rule sets (R5). This change adds no migration, seed, permission, route or dependency.
