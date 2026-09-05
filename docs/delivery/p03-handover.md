# P03 — Customer context, service intake and owned follow-up handover

**Revision:** r01 · **Date:** 5 September 2026 · **Owner:** Dean Fiedler · **Environment:** private local synthetic prototype.

**Delivery state:** Implementation and verification in progress under [issue #24](https://github.com/deanrfiedler-gif/powerplants-one/issues/24), branch `feature/p03-customer-intake`. No merge or completed business acceptance is claimed by this interim record. P04 has not started.

[Decision and compatibility treatment](../decisions/ADR-0008-p03-customer-intake.md) · [P02 handover](p02-handover.md) · [Ordered plan](prototype-implementation-plan.md).

Verified starting main: `4caac32d5c581c40a435021c2aff5cd3d79e20c8`; tree `d2862a0a74769768a5c2cad98fff31159eb50de8`. Private repository, default main, authenticated account deanrfiedler-gif with write permission. No earlier P03 implementation existed. Exact clean P02 checkout was cloned locally into an isolated directory; repository transport uses the connected GitHub tools. No unrelated work was changed.

The retained dependency pins and local configuration remain as documented in P02. Install and launch with `npm ci`, ignored `.env.local` from `.env.example`, `npm run db:migrate`, `npm run db:seed`, `npm run db:health`, `npm run dev`. Existing PostgreSQL data upgrades through migration 0003, not destructive reset. The complete exact command runbook, publication/merge record and executed evidence will be completed before final review.

Local PostgreSQL remains unavailable: `runuser -u nobody -- id` returns `cannot set groups: Operation not permitted`. No access restriction was bypassed; real PostgreSQL, HTTP, restart and browser checks use authorised ephemeral repository CI. Local static/type/unit/build checks are being executed with the exact verified Node/npm pins. No hosting occurs.

## Next bounded task — P04, not started

P04 is **Work scope, coverage and readiness**: SC-05; explicit work-order and ticket junction; scope revisions/items/assets/tasks; manual coverage and authority evidence; allowed readiness exceptions; planned visits. Read maintained P03 state/ADR-0008, BP-07 SC-05/TR-02, DAT-05–06, API-C03 and PT-04/PT-05 first. Reuse the current identity, references, scope and atomic operations. Identify typed approval evidence and exact authority/readiness prerequisites before enabling Authorised. Do not lift ERP mapping/configuration verification restrictions without their required evidence model. P04 does not authorise planner, packs, field capture, reports, Finance processing, offline queues or live integration. Begin only under a separately authorised P04 task.
