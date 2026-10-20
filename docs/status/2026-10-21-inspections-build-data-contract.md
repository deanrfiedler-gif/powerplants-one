---
title: Inspections accepted-design implementation and authorised reading attribution
date: 2026-10-21
---

Draft PR #647 implements the accepted FI-03 capture and FI-04 review register at the existing routes. The [design acceptance](../decisions/inspections-figma-design.md) remains distinct from code delivery and owner visual review. The page contracts, register, Australian English guides and shared-component consumer bindings describe the compact register, record summary, saved checks, per-reading instruments, phone action bars, original-command recovery and separate outcome preparation/issue.

Dean authorised the [reading-to-instrument extension and migration](../decisions/inspections-reading-instruments.md). Reserved migration 0115 adds explicit attribution for new Service attempts without inferring links or changing the hashes of historical submitted attempts. Live schema was inspected in an isolated local `ppo_synthetic_test` database built from current-main migrations. The populated upgrade proof passed, retaining the original attempts, snapshots, hashes, grants, seed receipts and migration ledger. There is no new seed or capability.

Functional and visual validation is recorded separately in the [verification record](../testing/evidence/service-inspections/accepted-design.md). Owner visual review remains pending. No production integration, business transaction, deployment or business acceptance is claimed. The existing online-only capture contract and attempt/retest authority remain in force. Compare attempts, JPEG capture, new Evidence/Review history layouts, a new clarification reply design and Conversations remain outside this change.

<!-- decision-index -->

Dean authorised explicit reading-to-instrument attribution and migration 0115 for FI-03/FI-04. The [decision](../decisions/inspections-reading-instruments.md) requires immutable links for new Service attempts, no inferred historical attribution, preserved original hashes and populated-upgrade proof. Design acceptance and owner visual review remain separate.
