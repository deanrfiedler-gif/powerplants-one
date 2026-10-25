# Rule sets R2: storage and versioning, Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task by task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build step R2 of [ADR-0066](../../decisions/ADR-0066-configuration-rule-sets.md), which Dean asked for on 24 October 2026: "Yes: start ADR-0066 build step R2, storage and versioning of rule sets, as its own PR."

R2 stores rule sets with the governance ADR-0066 sets:
- draft, check, review, publish;
- a named engineering owner (Q2);
- reference cases and coverage findings recorded with every revision;
- only the owner accepts a blocking finding, with a written reason (Q5);
- immutable published versions.

It builds on the R1 engine ([PR #688](https://github.com/deanrfiedler-gif/powerplants-one/pull/688)) and is stacked on that branch until it merges. Screens (R3), Excel (R4) and ES-08 (R5) are later.

**Authority:**
- Rule sets stay synthetic. Every root carries `synthetic CHECK(synthetic)`, as CPQ releases do, until the ADR-0066 Q6 authority decision.
- The existing duties `cpq.read`, `cpq.author`, `cpq.review` and `cpq.publish` govern rule sets. No new capability, grant or seed.

## The migration (0119)

1. Extend the object types (`business_identities`, `audit_events`) with `CpqRuleSet`, and the identity dispatch with `cpq_rule_sets`. Follow the 0020/0086 idiom: `SET CONSTRAINTS ppo.identity_target IMMEDIATE` before the ALTERs and `DEFERRED` straight after.
2. Create the tables:
   - **`ppo.cpq_rule_sets`** (root): `company_id`, `key` (unique per company), `label`, `family`, `owner_id` (the engineering owner), `version`, `current_revision_id`, `state` (`Draft`, `Reviewed`, `Rejected`, `Published`), `synthetic`, created and updated by and at.
   - **`ppo.cpq_rule_set_revisions`** (immutable): `version`, `predecessor_id`, `definition` (schema 5, at most 600,000 bytes), `content_hash`, `test` (the R1 `testRuleSet` result: case statuses, line counts and coverage findings), `reason`, `created_by`.
   - **`ppo.cpq_rule_set_acceptances`** (immutable): one per blocking finding of one revision (`code`, `subject`), with `reason` and `accepted_by`. A trigger requires `accepted_by` to be the rule set owner and the finding to be a blocking finding of that revision.
   - **`ppo.cpq_rule_set_reviews`** (immutable, one per revision): `reviewer_id`, `outcome`, `content_hash`, `test` and `reason`. A trigger requires:
     - a reviewer who is not the author;
     - the exact content hash;
     - the owner to be the author or the reviewer (Q2);
     - for Approved, every case passing and every blocking finding accepted.
   - **`ppo.cpq_rule_set_publications`** (immutable): `version` per rule set, `revision_id`, `review_id`, `created_by` and `reason`. A trigger requires an approved review of that exact revision, and a publisher who is neither the author nor the reviewer.
   - **`ppo.cpq_rule_set_heads`**: the current publication of each rule set.

## The service and API

`src/cpq/rule-set-store.ts`, using the existing `sharedOperation` (operation identity, reason, receipts, audit and the `CpqChanged` outbox kind):

| Command | Route | Rule |
|---|---|---|
| Save | POST `/api/v1/cpq/rule-sets` | `cpq.author`. Creates a rule set, or a new Draft revision with `expected_version`. The definition must pass R1 validation; failing cases and blocking findings are saved, not refused. The first save names the owner, who must hold `cpq.author` or `cpq.review` for the company. The rule set key cannot change. |
| Accept a finding | POST `/api/v1/cpq/rule-sets/[id]/acceptances` | Owner only. The exact revision, `code`, `subject` and a reason. |
| Review | POST `/api/v1/cpq/rule-sets/[id]/review` | `cpq.review` and independent. Exact revision and hash; reruns the tests in the worker. |
| Publish | POST `/api/v1/cpq/rule-sets/[id]/publish` | `cpq.publish` and a third person. Exact reviewed revision and hash; moves the head. |
| List, read | GET `/api/v1/cpq/rule-sets?company_id=`, GET `/api/v1/cpq/rule-sets/[id]?revision_id=` | `cpq.read`. A read returns the root, its revisions, acceptances, reviews, publications and current head. |

## Migration obligations (AGENTS.md)

- Delete `db/reservations/0119.md` in this PR.
- Extend every applied-version list, preserved ledger, exact added-version list and `atVersion(N)` found by `git grep -lwE '0?117' tests/` (65 files today), plus the computed from-0025 ledgers, the `tests/demo/upgrade.test.ts` count and the Products upgrade suite.
- Check `scripts/demo-upgrade.ts` before moving `latestMigrationVersion`.
- Prove the migration in an upgrade with estimates present (the `identity_target` rule).

## Tasks

- [ ] **Task 1:** the migration and its registry entry.
- [ ] **Task 2:** the store, the routes and the reads.
- [ ] **Task 3:** database tests: the full lifecycle, each governance refusal (also enforced by the triggers when the service is bypassed), immutability and replay.
- [ ] **Task 4:** the upgrade-suite obligations.
- [ ] **Task 5:** the contract update, a status fragment and review.
