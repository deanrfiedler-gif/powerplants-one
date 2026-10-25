---
document_id: PPO-RULE-SETS-AUTHORITY-DEC
date: 2026-10-26
owner: Dean Fiedler
status: Owner decision, 26 October 2026; answers ADR-0066 Q6 and sets the order for accepting the Rules studio design; authorises no build, environment or real data
review: Second-model review pending before merge (CONTRIBUTING.md)
source_commit: 55722e8226b62c2a0e2e3bfe67b38b104bb09590
versioning: git
---

# Real rule sets: where they may be stored, and when the Rules studio design is accepted

## Decision

[ADR-0066](ADR-0066-configuration-rule-sets.md) Q6, accepted on 24 October 2026, requires an authority decision before any real rule set is stored. On 26 October 2026 Claude recommended the rules below and, for the Rules studio design, running the planned engineer walkthrough before acceptance. Dean replied: "proceed with your recommendations".

A **real rule set** is one built from Powerplants' own engineering rules, part identities, factors, lookup tables or reference cases taken from real jobs, quotations, catalogues or workbooks. Everything else is synthetic.

### Where real rule sets may be stored (Q6)

1. **Never in this repository or the hosted demo.** The repository is public, and a real rule set records Powerplants' engineering know-how and part identities. This covers rule set definitions, tables, reference cases, Excel exports and test fixtures.
2. **Only in a private Powerplants One environment**, once one exists and Dean has approved it to hold operational data. No such environment exists yet; the hosting choice (D-022) is open.
3. **One product family at a time.** Before the first real revision of a family is saved, Dean authorises that family in a decision record that names its engineering owner ([ADR-0066](ADR-0066-configuration-rule-sets.md) Q2) and the environment.
4. **Until all three hold, every rule set is synthetic**: synthetic names, part identities, factors, tables and reference cases, as R1 and R2 are today. Synthetic values must not be copied from Powerplants' workbooks, quotations or catalogues.

### When the Rules studio design is accepted

- The [engineer walkthrough](../testing/rule-sets-engineer-walkthrough.md) runs on the Figma proposal (page "Rules studio · rule sets, derived values & tables · ES-02 · ES-03", node `2315:792701`) before the proposal is put up for acceptance. Each failed task becomes a design change first, as the plan says.
- The participant is the engineering owner for screens once Dean names one (ADR-0066 Q2), so the person who will own the rules tests the screens.
- Build step R3, the Rules studio screens, still waits for that acceptance.

## What stays open

| Item | State |
|---|---|
| Engineering owner for screens | Not named. Dean names the person; until then the walkthrough cannot run as planned |
| Private environment for operational data | None exists; depends on D-022 |
| Authority for each product family | None given; screens, Priva fertigation and Priva control each need their own |
| Rules studio design acceptance | After the walkthrough |
| Build steps R3 to R6 | Not authorised; each is its own pull request |

## Scope and limits

This decision adds no code, migration, seed, permission, capability, route, environment or dependency. It does not change the R1 engine or R2 storage, which already hold only synthetic data. It is not engineering approval of any rule. All 78 parent requirement IDs are unchanged.
