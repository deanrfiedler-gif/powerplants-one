---
document_id: PPO-010-EXCEL-DEC
date: 2026-09-15
owner: Dean Fiedler - prototype owner
status: User-authorised design package; implementation remains separate
source_commit: dcabfec1b5cde1c2cf220359e6cf1c63408512d6
versioning: git
---

# Excel estimate import design decision

Dean instructed “Proceed” with the recommended Excel Estimate Import design package. The accepted direction is a controlled import into PPO's estimate/version workflow, supported by a standard workbook/export structure while retaining flexible specialist calculation sheets. Reconciliation, source retention, permissions, history and customer-safe quotations are integral to the design.

The contribution prepares a populated synthetic standard workbook r01, [assessment](../blueprints/excel-estimate-workbook-assessment.md), [field mapping and workflow specification](../contracts/excel-estimate-import.md), [interactive module preview](../blueprints/excel-estimate-import.html), [implementation plan](../delivery/excel-estimate-import-plan.md) and [handover](../delivery/excel-estimate-import-handover.md). It belongs to PPO-010 / issue #10 under existing EST parents. All seven domains and P01–P12 remain intact.

Proposed pilot choices preserve current E1 amounts/precision/100-line limits and schema-2 categories, bind the exact current Complete E2 basis, and add immutable import/source/section provenance at implementation. A candidate 5 MiB compressed/20 MiB expanded parser envelope is an engineering proposal pending profiling. No parser technology, migration slot, operational approval authority, margin threshold, tax, currency policy or retention period is adopted by this design.

No operational workbook was available. The HTML supplied as a theme reference identifies r16 internally despite advertised r19 metadata. Native Excel formula protection, actual r19 comparison and browser verification remain explicit open items. This is a reviewable first design, not an accepted production UI baseline or departmental template.

No application/database/permission/workflow files are changed. The workbook and preview contain fictional values and new SYN-PPO design references; those references are not represented as existing seeded business records. Company prices, supplier documents, hosted deployment, customer communications and real ERP/SharePoint writes are outside this contribution.
