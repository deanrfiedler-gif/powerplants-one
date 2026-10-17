---
document_id: PPO-SUP-ZERO-ALLOCATION-PROP
date: 2026-10-17
owner: Dean Fiedler
status: Proposed for Dean's decision; his current decision is to keep both rules for now; no code, test or behaviour changes; synthetic prototype rules, not MYOB or corporate policy
source_commit: b2bd011
versioning: git
---

# Unallocated demand: Supply and the field gate disagree — proposal

Two rules in the prototype answer the same question differently: what is the material readiness of an approved demand that has no allocation?

- **Supply** (audit SUP-1, [PR #557](https://github.com/deanrfiedler-gif/powerplants-one/pull/557)) says it is a known shortage: **Blocked**, or **At risk** if a supplier-confirmed promise covers it.
- **The field readiness gate** ([PR #541](https://github.com/deanrfiedler-gif/powerplants-one/pull/541), [proposal](field-readiness-gate-proposal.md) P1) says it is missing evidence: **Evidence needed**, so the Parts criterion is **Unknown**.

Both landed together in [PR #563](https://github.com/deanrfiedler-gif/powerplants-one/pull/563), which is where the disagreement became visible. This record sets the two rules side by side and recommends one outcome. It is a **proposal**. It changes no code, test, migration, seed, permission or route.

## Current user decision

On 17 October 2026, Dean decided:

> "Keep both rules for now."

He asked for this comparison as a follow-up once #563 had merged. Until he decides below, both rules stand as built. Requirements: SCM-06 and SCM-08 (readiness), SVC-03 (readiness evidence precedes dispatch). The Supply state table is in the [readiness contract](../contracts/supply-chain-readiness.md); the Supply decisions to date are in [PPO-SUP-DEC-01](supply-readiness-promise-rules.md).

## Where each rule lives

| | Supply | Field gate |
|---|---|---|
| Code | `materialBasis()` in `src/supply/reads.ts`: `complete = true`, comment "Nothing allocated is a known zero (a shortage), not missing evidence" | `line()` in `src/service/parts-readiness.ts`: `complete = allocations.length > 0`, comment "no allocation here is missing evidence … Unknown until a linked demand has been allocated" |
| Shared piece | `readiness()` in `src/supply/model.ts`, the state table. Its `sourcesComplete` argument is the only thing that differs. The table's own header says an empty register "is a known zero, not missing evidence" | The same `readiness()`, called with the different argument |
| Pinned by | `tests/unit/supply.test.ts` (the "nothing allocated" rows) and `tests/database/supply.test.ts` ("approved demand with nothing allocated is a shortage … (SUP-1)") | `tests/database/readiness-gate.test.ts` around line 379: outcome `Unknown`, line state `Evidence needed` |
| Documented in | The readiness contract and `docs/STATUS.md` | The comment in `parts-readiness.ts` and the test; the gate proposal's P1 table maps *Supply's* state to the outcome, so it never says what an unallocated demand is |

The field gate has its own copy of the allocation loop rather than calling `materialBasis()`, because technicians need no `supply.read` and the loop there skips the permission checks. That copy is why the rules could diverge.

## What each rule means

Take an approved, complete demand for 1 EA with a required date and nothing allocated.

| Question | Supply's rule (known zero) | Field gate's rule (evidence needed) |
|---|---|---|
| Supply register and workspace state | **Blocked**, shortage 1 EA; **At risk** with a confirmed on-time promise | Not applicable: the register uses Supply's rule |
| Field gate outcome for the Parts criterion | Would be **Blocked** (Blocked and At risk both map to Blocked) | **Unknown** |
| Is dispatch held? | Yes | **Yes**. Only Pass, PermittedException and NotApplicable satisfy the criterion (`satisfied()` in `src/service/parts-hold.ts`, and the check in `src/documents/packs.ts`) |
| Can a permitted exception clear it? | Yes | Yes |
| Does a later change re-hold dispatch? | Yes | Yes. `parts-hold.ts` tests the same `satisfied()` set |
| Dispatch reason text | "Parts ready for the stated material scope: Blocked. *Title*: Blocked · promised *date* · 1 EA short · 0 of 1 lines ready for the stated scope." | "Parts ready for the stated material scope: Unknown. *Title*: Evidence needed · 0 of 1 lines ready for the stated scope." No quantity short and no promised date, even if a promise is recorded |
| Office screen | Criterion row shown as blocked (`wo-blocked`) | The same: `Unknown` and `Blocked` share the class in `work-order-screens.tsx` |
| Technician line | Shortage and promised date appear in the line's words | State only; `shortage` is null |

**Dispatch.** The divergence does not change whether dispatch is held. It changes what the coordinator is told is wrong and what they do next: "1 EA short" tells them to allocate stock or chase the promise; "Evidence needed" tells them the check could not be completed, without naming the missing evidence.

**Customer-facing wording.** Neither state reaches a customer today. The customer-communications paper ([D-025](customer-communications-d025.md), proposed; nothing sends) triggers its messages from facts staff have recorded, and does not bind a Supply readiness state into a template. This question is therefore about staff and technician wording only. If a visit notice ever quotes parts state, the choice below decides whether it can say "short" or only "not yet confirmed".

**Supply's shortage display.** Under the known-zero rule an unallocated demand shows its full quantity as the shortage, which is the audit's point: the register must not hide a real gap behind "Evidence needed, shortage unknown".

## What the field rule gets right

A demand linked to a visit has often just been raised. A planner has not yet had a chance to allocate stock, so "Blocked, 1 EA short" can read as an alarm where "not yet checked" is the truth. The field rule tells the coordinator the check is incomplete. That is a real distinction. The difficulty is that the code reads nothing that separates "nobody has looked yet" from "looked, and there is none": an empty allocation register is the only signal both rules have.

## Options

| | Option | Dispatch | Wording | Breaks if built |
|---|---|---|---|---|
| A | Keep both (current) | Held | Two vocabularies for one state; the Supply register says Blocked while the visit says Unknown | Nothing. Risk: a coordinator sees "Blocked" in Supply and "Unknown" on the visit for the same demand, and the two copies of the loop can drift again |
| B | Field gate adopts Supply's rule | Held | Field says Blocked with the quantity short and any promised date | The comment in `parts-readiness.ts`; `readiness-gate.test.ts` line 353 (comment) and lines 379–380 (outcome and line state). Nothing else asserts the unallocated case, since lines 288, 322 and 422 test unlinked demands and `tests/unit/readiness-gate.test.ts` tests only the mapping |
| C | Supply adopts the field rule | Held | Supply shows Evidence needed and no shortage for an unallocated demand | Reverses the SUP-1 fix and the contract's state table; the "nothing allocated" rows in `tests/unit/supply.test.ts`; `tests/database/supply.test.ts` SUP-1; `docs/STATUS.md` and the contract text. Also stops promise cover from ever showing At risk for an unallocated demand |
| D | Split: keep both, but record why | Held | Unchanged | Nothing. Needs a signal that does not exist yet: Supply recording that a demand was *reviewed with zero available*, as distinct from never reviewed |

## Recommendation

**Option B**, built as one change that makes the field gate reuse the same allocation reading as Supply instead of keeping its own copy.

- Dispatch stays held, so nothing becomes less safe. The change is only that the reason names the shortage and any promised date, which is more actionable than "Evidence needed".
- The approved P1 table maps Supply's state to the outcome. Under it, Supply's Blocked produces a Blocked criterion. The Unknown for an unallocated demand came from the duplicated loop, not from a recorded decision.
- Option C is rejected: it reintroduces the fault the audit found.
- Option D is worth building only if Dean wants "Unknown" to mean "supply has not reviewed this yet". That is a real feature (a recorded review), not a wording choice, and nothing in the current code supports it.

If Dean chooses B, one small wording addition is worth including: say "nothing allocated yet" next to the shortage, so a newly raised demand reads as unplanned rather than as a supplier failure.

## Not decided here

- Whether the field gate's duplicated loop should call `materialBasis()` directly or a shared pure helper. The permission difference above decides it, so it is a build question.
- Any customer message text. D-025 stays open.
- Business acceptance. Both rules are synthetic prototype rules.

## Questions for Dean

| # | Question | Recommended answer |
|---|---|---|
| Q1 | Should the field gate follow Supply's rule, so an unallocated linked demand reads Blocked with its shortage? | Yes (Option B) |
| Q2 | If yes, add "nothing allocated yet" to the shortage wording? | Yes |
| Q3 | Or keep both rules until a recorded supply review exists (Option D)? | Only if "Unknown" must mean "not yet reviewed" |
