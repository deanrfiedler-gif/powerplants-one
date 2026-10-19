---
document_id: PPO-ERP-OPERATING-MODEL-DEC
date: 2026-10-19
owner: Dean Fiedler
status: Owner-adopted direction (19 October 2026); integration technology, tenant contract, field-level authority changes, build and licence changes separate
source_commit: 5b72049d727327537fa1c351c647e071ef81615d
versioning: git
---

# PPO as the daily workspace, MYOB Acumatica as the book of record — direction

## 1. Context and decision

On 19 October 2026, while deciding how the workshop should work, Dean said: "Our staff find MYOB very confusing and difficult to use. However, it is a very good accounting platform. I was thinking we could sync MYOB and the Powerplants One app, and do as much day to day operational work as possible in the Powerplants One app, then the data could be synced back to MYOB." He added that it "may also reduce costs relating to MYOB subscription fees". Claude recommended the direction with the integration principles in section 2. Dean adopted it: "Yes, record the wider direction: PPO is the day-to-day workspace for all modules and MYOB Acumatica is the book of record, with the integration principles you recommended, as its own decision record."

**Direction.** Across all modules, staff do as much day-to-day operational work as possible in Powerplants One. MYOB Acumatica remains the book of record: the general ledger, receivables and payables, tax, stock valuation and cost, and detailed financial reporting. Finance staff keep working in MYOB for accounting work. Everyone else should rarely need to open it.

This extends the workshop's [option A](workshop-settings-preferences-scope.md) (WS-D5) to every module. It confirms the existing authority split: [ADR-0048](ADR-0048-products-native-catalogue.md) (MYOB retains authoritative ERP items, stock and purchasing) and [ADR-0049](ADR-0049-native-supply-chain.md) (no second inventory or Finance ledger) stay in force. The repository's existing direction that MYOB Acumatica is the intended ERP authority is unchanged.

## 2. Integration principles

| ID | Principle | What it means in practice |
|---|---|---|
| EI-1 | **One owner per item of data** | Every field is written in one system only. PPO owns operational records: leads, deals, estimates, quotations, projects, engineering, service, schedules, field work, workshop builds and activities. MYOB owns posted financial documents, payments, general-ledger accounts, tax codes, stock valuation and costs. Never two-way edit the same field. |
| EI-2 | **Shared master data is entered once** | Staff create and maintain customers, suppliers and items in PPO, which writes them to MYOB. MYOB's copy stays authoritative for its financial fields (account, tax code, terms, credit limit, cost), which PPO reads and shows but does not edit. Changing the authority of any field needs its own decision. |
| EI-3 | **Send finished business events, not every keystroke** | PPO sends a document to MYOB when a business step is complete and approved: for example, a customer invoice ready to raise, a purchase order issued, goods received, materials issued to a job or build, a finished unit, an approved timesheet. MYOB sends back what it decided: the posted number, payment status, balances and costs. |
| EI-4 | **Approve before posting; correct by reversal** | A named person approves a financial document in PPO before it is sent. Once MYOB has posted it, a mistake is fixed with a reversing or credit document, never by editing the posted record from PPO. |
| EI-5 | **Nothing is lost silently** | Each outgoing document has a unique key so it can be retried without being posted twice. Every sync item has a visible state (waiting, sent, posted, failed, needs attention). Failures land in Integration health and exception recovery (`scope:AD-04`) and External mapping and reconciliation (`scope:AD-05`), which become essential pages. |
| EI-6 | **Reconcile every day** | Counts and dollar totals of what PPO sent and what MYOB posted are compared daily, and any difference is owned until it is cleared. |
| EI-7 | **Supported interfaces only** | Use MYOB Acumatica's supported web-service API with a pinned endpoint version. No direct database access and no screen scraping. The tenant contract (DEC-CCE-10 in the [CCE technical specification](../architecture/cce-technical-specification.md)) is confirmed against a sandbox tenant before anything writes to MYOB. The existing [field-mapping handbook](myob-handbook-discovery.md) and [`myob-field-mappings.csv`](../contracts/myob-field-mappings.csv) are the starting point. |
| EI-8 | **Least privilege and audit** | The integration uses its own MYOB account with only the rights it needs. Credentials stay outside the repository. Every posting is attributable in PPO's audit history (`scope:AD-07`). |
| EI-9 | **Start read-only, then widen one module at a time** | First read from MYOB (customers, suppliers, items, prices, stock levels, balances). Then post low-risk documents one way. Then extend module by module, with PPO and MYOB run side by side during each cutover (`scope:AD-06`). |
| EI-10 | **Count savings only once verified** | Whether this lowers MYOB fees depends on how the subscription is priced: by user, by module or by transaction volume. Confirm that with the MYOB partner before relying on a saving. Integration traffic may count against transaction limits. Building and supporting the integration costs money too. Drop a MYOB module or user only after PPO's replacement workflow is live and reconciled. |

## 3. Alternatives considered

| Alternative | Why not |
|---|---|
| Keep operational work in MYOB as now | Dean's staff find MYOB confusing and difficult to use; this is the problem being solved. |
| Make PPO the stock and purchasing authority, MYOB the ledger only (option B) | Not adopted for the workshop on 19 October 2026. It would reverse ADR-0048 and ADR-0049 and make PPO responsible for stock valuation, stocktakes and purchasing controls. |
| Replace MYOB entirely | The master blueprint excludes replacing the ERP ledger. MYOB Acumatica is a good accounting platform; the issue is its day-to-day usability for non-accounting staff. |
| Two-way sync of the same records | Two systems editing the same field produces conflicts, duplicates and posting errors. EI-1 rules it out. |

## 4. Limits and what follows

- This is a direction. It authorises no integration, adapter, endpoint, credential, migration, production connection, business transaction or licence change. Production integration remains outside this repository task.
- The integration technology (a built-in adapter, middleware or an integration platform) is not chosen. Choosing it needs its own architecture decision record with reasons, constraints and alternatives.
- The exact Acumatica instance, endpoint version, entities and company keys (DEC-CCE-10) remain open. No undocumented endpoint is assumed.
- Each module's page designs should show, where they touch money or stock, what is sent to MYOB, when, and what comes back. That is design guidance for future pages, not a change to accepted designs.
- The MYOB subscription saving is Dean's hypothesis to verify with the MYOB partner, not an established fact.
