---
document_id: PPO-SUP-DEC-01
date: 2026-10-17
owner: Dean Fiedler
status: User decision; two synthetic prototype rules for material readiness, built in PR #557; not MYOB or corporate policy, and authorises no supplier, customer or booking action
source_commit: d4f3285
versioning: git
---

# Supply readiness promise rules — 17 October 2026

The SUP-1 fix ([PR #557](https://github.com/deanrfiedler-gif/powerplants-one/pull/557)) left two questions about when a supplier promise may turn a shortage from Blocked into At risk. Each was put to Dean with a recommendation, and he replied:

> "Proceed based on your recommendations."

Requirements: SCM-04 (promise basis and date), SCM-06 and SCM-08. The state table is in the [readiness contract](../contracts/supply-chain-readiness.md).

## Decisions

| # | Question | Decision | Reason given |
|---|---|---|---|
| 1 | Does an Estimated promise date count as cover? | No. Only a SupplierConfirmed promise can make a shortage At risk; an Estimated one leaves it Blocked. | At risk tells the coordinator the gap is covered and only needs watching. An estimate is PPO's or the supplier's informal guess and does not earn that. SCM-04 already separates the two bases. |
| 2 | What happens when a promise date passes without the goods? | The promise is broken: if usable allocation still falls short and the promised date is before today, the demand is Blocked. | An overdue promise reading At risk is the error that sends a technician out without parts. |

## How it is built

- `readiness()` in `src/supply/model.ts` takes `today` as an argument instead of reading the clock. `materialBasis()` supplies it as the calendar date in the demand's own timezone, so a promise dated 30 September still counts at 23:30 that day at the site.
- A promise due today still counts. A promise dated after the required date is late and has never counted.
- The field readiness gate (draft PR #541) maps Blocked and At risk to the same outcome, so neither rule changes what technicians are shown.

## Not decided here

- An overdue promise does not yet raise a review Activity of its own. SCM-08 says delays trigger review; doing that without a user action needs a scheduled job, and is a separate increment.
- A third state such as "At risk (estimated)" was considered and not adopted, because every consumer of the state would have to handle it.
