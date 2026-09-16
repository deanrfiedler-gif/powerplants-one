---
document_id: PPO-ES09-DES
title: ES-09 Estimate-to-Actual Outcome Review design and receiving handover
revision: r01
date: 2026-09-16
owner: Dean Fiedler
status: Proposed standalone design; owner acceptance, financial-definition adoption and application integration remain separate
source_commit: 0769a16dd842e9dc1c349a853036ab71949e7807
---

# ES-09 — Estimate-to-Actual Outcome Review

Dean authorised the design and build of **ES-09 Estimate-to-Actual Outcome Review**: a five-view interactive HTML workspace and a detailed companion Markdown report, connecting Estimating, the accepted quotation lifecycle, Projects, Service, Supply Chain, Returns, Finance and Sales Aftercare.

The central question is: **how did the delivered outcome compare with what we estimated, why did it differ, and what should we learn?**

## Review deliverables

- [Interactive workspace r01](../reference/ui/estimate-actual-review/PPO-Estimate-to-Actual-Outcome-Review-r01.html)
- [Detailed companion report r01](../reference/ui/estimate-actual-review/PPO-Estimate-to-Actual-Outcome-Review-Report-r01.md) — 22 sections covering every view, field, action, filter, source relationship, formula, definition, allocation rule, permission, review state, recovery behaviour, a worked reconciliation, a 52-row capability traceability table, receiving requirements, limitations and open decisions
- [Reproducible source and check commands](../design/estimate-actual-review/README.md)
- [Executed verification evidence](../testing/evidence/estimate-actual-review-r01/README.md)

## Scope and evidence decision

ES-09 had no HTML, no register entry and no decision before this contribution, so nothing is superseded. Its only design authority was the merged [estimate-to-actual feedback loop proposal r05](../blueprints/estimate-actual-feedback-design.md), in which **nothing is adopted**. This package therefore builds the workspace the coverage-register brief describes while adopting none of the financial definitions the loop would eventually need.

That constraint shaped the design rather than limiting it. Where a definition is absent, the workspace **withholds the number and names the missing definition**: no margin or profitability measure is computed anywhere (D-017 open); materiality is declared per review and labelled unadopted; only the `direct` allocation basis is marked adopted and an equal split is never a default; every variance reason code renders "proposed registry, not adopted". No cost breakdown code registry is invented, because that registry is the load-bearing element the r05 record identifies and it is an owner decision.

The r05 blueprint's `SYN-PPO-DOR-` reference example is deliberately **not** used. PPO-STD-001 section 10.2 requires a deliberate type-code amendment, so local `SYN-EAR-nnnn` fixture labels are used, exactly as `SYN-QA-*` is in the Quality workspace. All 78 parent requirement IDs are preserved; the r05 child-requirement proposals remain proposals.

## The distinctions the design exists to hold apart

Issued estimate cost basis, accepted scope cost basis and each approved change are three separate records with their own saved version, timestamp, option, cost schema, supplier sources and quoted price. A declared comparison basis **names which records it includes and overwrites none of them**.

Estimated cost and quoted selling price never meet. Negotiated price movement is recorded as its own components — in the fixture a 3,620.00 scope reduction and a 4,500.00 discount conceded at close — and never enters a cost calculation. An **approved variation's selling price is refused as a cost budget**: a variation with no recorded estimating cost basis cannot be added to the comparison, and its attributable actual is reported separately.

A commitment is not an incurred cost, captured hours are not reviewed hours, and customer invoices are not job costs. The model refuses each of those treatments by name. Two included observations sharing a source key raise a blocking possible-duplicate. Units and currencies are never converted without a reviewed basis, and description similarity is never a match.

An anticipated recovery is never netted. The fixture carries an approved supplier claim with no issued credit while a replacement unit has already been consumed, so actual cost carries five drives, the variance is explained as a pending recovery, and 1,850.00 sits as an owned outstanding matter.

## Formula, sign convention and the integrity check

Variance is **actual − estimated**; positive means more cost than the declared basis. Percentages state their denominator and are withheld as `n/a` against a zero or unestablished one.

Where both sides carry an established quantity and rate on the same unit and currency, the difference decomposes into quantity, rate and **joint** effects, with any rounding residual shown as its own term, so the components reconcile to the line variance by construction. The joint term is displayed rather than absorbed, because the usual two-factor split pushes the interaction into whichever factor is computed second and attributes the variance to the wrong cause. This is a presentation decomposition and is explicitly not accounting policy.

The workspace enforces the identity the r05 record specifies:

```
total cost variance against the issued basis
    = scope change at acceptance + approved change cost basis + delivery variance
+10,509.54 = (−3,619.20) + 4,534.40 + 9,594.34
```

and declares the identity **unavailable**, rather than forcing it, when a basis is not established on both sides or when any basis line lacks an established actual.

## Architecture

The established standalone HTML/CSS/JavaScript pattern with a deterministic Python assembler is reused from Maintenance, Service Review, Quality and My Work. This is not a new technology choice: no framework, dependency pin, application route, database migration, external provider or hosting change is introduced. Money is exact integer cents and quantity exact integer thousandths, extended HALF_UP, matching the adopted `SYN-EST-ARITHMETIC-01` discipline in the E1 contract.

The applied r20 page type is Review / comparison, supported by a register, record detail views, docked source snapshots and focused decision forms, beneath the shared application shell. The module draws no rail, logo or global navigation.

## Receiving boundaries

Preparing an ES-10 handover is a **local proposal**. It creates no ES-10 record, sends no notification, and changes no Screen Systems formula, approved input range, parts mapping, labour rate, catalogue price, existing estimate or quotation, or historical job result. The workspace states that refusal on screen. Completing an ES-09 review closes no originating project, work order, supplier claim or Finance exception.

**The commercial lineage this module needs does not exist yet**, and the report says so rather than assuming it: no estimate version, quote revision or breakdown code is reachable from a delivered project or work order today, and FD-05 and FD-06 remain undefined under D-017. Overlapping open contributions are recorded at their actual state — ES-08 (PR #210) supplies formula evidence that is received and not accepted as an approved definition pack; ES-05/ES-06 (PR #212) and ES-07 (PR #213) are open drafts; Projects readiness, Supply Chain, Warranty and Sales aftercare are design-only or not started.

MYOB Acumatica remains the intended ERP authority and every read is labelled *(simulated read)*. SharePoint retains business documents and native CAD retains authoring. No customer or supplier communication, booking, stock movement, accounting entry, deployment or schedule change occurs.

## Verification

39 model groups and 29 native browser groups passed with zero page or console errors; the three repository checks and the conflict-marker scan passed. 23 original captures at 1440, 390 and 320 px were reviewed, and three defects found during inspection were corrected and re-verified: a comparison table that required horizontal scrolling on a phone; a reviewer's free-text explanation quoting a supplier rate that remained visible to the read-only observer; and an export that retained operation-receipt payloads containing the original command text.

The pinned Chrome channel was unavailable locally, so the native checks ran against bundled Chromium 141.0.7390.37 through an explicit override that the check script records in its manifest. **That is not evidence for the pinned runtime**; the focused workflow added with this contribution runs the same commands on the pinned Node, npm and Chrome, and its result must be read from the run. `npm ci` could not run because the environment provided Node 22.22.2 against a 24.21.0 pin; Playwright 1.63.0 was installed standalone for the check only and no pin, lockfile or `package.json` entry was changed.

Screen-reader, 200% zoom, print and physical-device review remain outstanding. Exact hashes, group inventories and limits are in the [verification record](../testing/evidence/estimate-actual-review-r01/README.md).

## Open owner decisions

Ten are listed in section 20.5 of the report. The four that block any application work are: which ES-09 identifier meaning is canonical (the coverage register's or the estimating screen specification's); who owns the variance reason and allocation basis registries and which entries are adopted; whether non-punitive use is stated as policy; and whether FD-05 and FD-06 are resolved under D-017 before any Projects cost read is trusted.

## Next bounded increment

**ES-09/A1 — comparison basis record and read-only comparison, Service delivery target only.** A persisted basis record binding an existing immutable estimate cost version and quote revision to an existing work order, with a cost definition and quantity class that cannot be null at submission; the actual side pre-populated from existing P09-reviewed quantities only; treatment, allocation share and reason per observation; and the line comparison with its sign convention, explicit denominators and withheld states. No decomposition, no reason registry, no findings, no ES-10 handover, no Projects target and no ERP read.

Projects coverage follows only after commercial lineage exists and FD-05/FD-06 are resolved. Calibration belongs to ES-10 and remains impossible until a rule registry and an approval authority exist.

## Recovery

Recovery is to revert this isolated design contribution. No issued HTML, accepted baseline hash, application source or application data is changed by it.
