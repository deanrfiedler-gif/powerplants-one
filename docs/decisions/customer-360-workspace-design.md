---
document_id: PPO-CS01-DES
title: Customer 360 workspace design and receiving handover
date: 2026-09-16
owner: Dean Fiedler
status: Proposed design delivered for review; owner acceptance and application integration remain separate
source_commit: 0769a16dd842e9dc1c349a853036ab71949e7807
versioning: git
---

# CS-01 Customer 360 — design and receiving handover

Dean authorised CS-01 Customer 360 as an extension of the existing Customers, Sites & Growing Areas workspace, with sales orders as an explicit first-class section, MYOB Acumatica retained as the intended ERP authority and live integration outstanding. The requested deliverables are a professional interactive HTML design and a detailed companion Markdown report, delivered as a reviewable package.

- [HTML r01](../reference/ui/customers/PPO-Customer-360-Workspace-r01.html) — SHA-256 `ce8b117f5b62615389111c59e479f606c8c50b7b3c218cde5e5d86cd14edeab8`
- [Detailed report r01](../reference/ui/customers/PPO-Customer-360-Workspace-Report-r01.md)
- [Reproducible sources](../design/customer-360/README.md)
- [Verification evidence](../testing/evidence/customer-360-r01/README.md)

## Authority and revision

This is r01 of a new design family. It supersedes nothing. The Customers, Sites & Growing Areas [r03 workspace](../reference/ui/customers/PPO-Customers-Sites-and-Growing-Areas-Workspace-r03.html), its [design record](customers-sites-workspace-design.md), its [map extension](customers-sites-maps-r03.md) and its check scripts are unchanged, and remain the owning design for CS-04, CS-05 and CS-06.

Source checkpoint: `main` at `0769a16dd842e9dc1c349a853036ab71949e7807`, tree `57e788526e1521b839fd0ec6c2ef6f973d4dd406`, 16 September 2026. Draft pull requests #210, #211, #212 and #213 were open and are untouched by this contribution. ES-07 lives on #213 and is therefore referenced as an open contribution, not as a repository path on the default branch.

Rebase: #210 merged during preparation and `main` advanced to `d0a660d21d52cd9128ee996ce2025bf11285a1b8`. This contribution was rebased onto that head. `docs/STATUS.md` and `docs/reference/ui/README.md` merged automatically. `docs/standards/document-register.csv` conflicted where both contributions append rows at the end of the file; it was resolved by keeping both sets in order, ES-08's five rows followed by CS-01's five, with no row altered or removed. All three repository checks, the conflict-marker scan and both design check suites were re-run after the rebase.

## Scope and conformance

| Field | Decision / proposed treatment |
|---|---|
| Identity | CS-01 in coverage register r06, family CS, reviewer *CRM / site data steward*, parents CRM-01, CRM-04, CRM-06, SVC-06 |
| r20 type | Intake / data and forms profile, extended with register and review composition |
| Components | r03 workspace heading, context row, local tabs, cards, pills, callouts, detail lists, toolbars, docked snapshot, focused editor and centred decision; embedded r20 Roboto faces and the shared choice card, all carried across unchanged |
| New components | Scoped summary tile, attention item, register table/card pair, filter chip bar, source strip, separated-quantity key, money block, labelled receiving boundary |
| Input | Synthetic customer, site, facility, asset, opportunity, estimate, quotation, order, case, work-order, appointment, report, finding, agreement, warranty, project, account and activity fixtures |
| Output | A reading view. The only change a user can make is an internal Powerplants follow-up note held in browser storage |
| Departures | Eight local views against r03's five, and a register-and-snapshot composition the customer-location workspace does not use. No application masthead, rail or breadcrumb is added |
| Baseline | Accepted UI baseline register unchanged. No route, service, migration, adapter, dependency or CI gate is added |

## Business controls this design holds

**Identity.** An organisation is distinct from an ERP debtor account. One organisation relates to several company-specific accounts, each with its own connection, company, account code, currency, effective dates, mapping record and confirming owner. A customer or an order is never matched on a name or a displayed order number alone. A source account with a similar name and no mapping record is attributed to nobody, counted nowhere and owned by a dated follow-up.

**Sales orders.** Ordered, allocated, shipped, delivered, cancelled, returned and invoiced are seven independent measures. A measure is summed only within itself, only across lines sharing a unit, and only when every line supplies it. Outstanding supply is computed only where both the ordered and shipped quantities are known; otherwise it is unknown, never zero. Requested, confirmed and expected delivery are three distinct dates and a missing one stays missing. The accepted quotation and its exact revision are retained separately from any later change in the source, and a mapped difference is shown with the source's silence about its reason. The status vocabulary is treated as source-reported text, not as verified MYOB configuration.

**Conversion.** An accepted quotation awaiting conversion is not an existing ERP order and is never counted as one. An unknown conversion outcome stays unresolved, no second attempt is offered here, and resolution belongs to ES-07.

**Deals.** Alternative estimate options are mutually exclusive and are never totalled. Successive revisions of one quotation are one line of negotiation, not several commitments. A forecast opportunity value is not an order, an invoice or a payment.

**Service.** A completed visit does not resolve the case, complete the remaining work or settle anything commercially. Customer-reported symptom, suspected cause, verified finding and agreed resolution stay four separate statements. A report acknowledgement is bound to its exact revision and is not inherited by changed content. Customer warranty outcome and supplier recovery are separate facts.

**Projects.** Technical completion, customer acceptance and commercial closeout are three separate facts; none implies another. Variation values are separate commercial items and are not added to project, order or invoice measures.

**Accounts.** Invoiced, paid, credited, disputed, unapplied, held and outstanding amounts stay separate. An order's status never establishes payment. A balance appears only where a complete extraction supplies one; it is never derived from the rows that happened to arrive. No ageing band, credit rule or comparability calculation is invented — D-017 must supply them. Amounts are never consolidated across currencies or legal companies.

**Sources.** Every collection carries its observation: scope, source-as-at, last successful observation, pages declared against pages returned, row count and outcome. Complete, incomplete, no-records, failed and permission-restricted are five different results with five different presentations. A failed refresh retains last-good data with a visible age and failure, and a refresh request is a read that changes nothing.

**Permissions.** Withholding is by removal. A restricted role receives no amount, count, badge, search hit or snapshot from which a withheld value could be reconstructed. The role switch is a presentation demonstration and the design says so in those words.

## Receiving contract

Ten read contracts and one write contract are specified in [section 13 of the report](../reference/ui/customers/PPO-Customer-360-Workspace-Report-r01.md#13-receiving-application-contracts-and-open-decisions). Every collection response must carry the observation envelope, and `null` must survive to the client as unknown rather than being defaulted.

Implementation depends on evidence that does not exist yet: MYOB endpoint, schema, entity, key, paging, delta, error, authentication, role and company facts (CFG-01–CFG-12 in the [MYOB integration blueprint](../contracts/myob-integration-blueprint.md), all **Not supplied**); a persisted `ErpAccountMapping`; observed order status, hold and type vocabularies; real financial definitions under D-017; the service-authority decision under D-007; and ES-07 landing so the conversion boundary resolves. Refresh, retry and reconciliation must be specified so a repeated read cannot create a duplicate business effect and an unknown outcome is resolved by lookup, never by resubmission.

Server-enforced permission requirements — section-level authorisation, derived-value protection, private-communication filtering, ERP company scoping, document permissions and a read-only guarantee — are recorded in [section 9.3 of the report](../reference/ui/customers/PPO-Customer-360-Workspace-Report-r01.md#93-server-enforced-requirements-for-the-receiving-application).

## Verification

Run from the repository root; the optional jsdom and Playwright modules stay outside the application dependencies:

```sh
python3 scripts/build-customer-360-design.py
PPO_DESIGN_JSDOM_MODULE=/absolute/path/to/jsdom/lib/api.js \
  node scripts/check-customer-360-design.mjs --write-evidence
PPO_DESIGN_PLAYWRIGHT_MODULE=/absolute/path/to/playwright/index.js \
  PPO_DESIGN_CHROMIUM=/absolute/path/to/chrome \
  node scripts/check-customer-360-browser.mjs --write-evidence
```

**87 model and DOM-emulation groups** and **12 native Chromium groups** passed against the issued file. `check_foundation.py`, `check_prototype.py` and `check_naming.py` pass, and a conflict-marker scan over `docs` finds nothing. Four real defects were found during verification and fixed: a 68 px horizontal overflow at 320 px caused by non-shrinking native date inputs; keyboard focus being dropped after a tab re-render; a case-detail note occupying a third grid column; and nine lint violations in `workspace.js` that the repository's own `eslint .` reports, because it covers `docs/**` — five unused `catch (error)` bindings, three bare short-circuit call expressions and one helper written but never called. That last one failed three CI jobs on the first push. `eslint .` and `tsc --noEmit` are now clean across the repository, and the unused helper was put to work rather than deleted: a site filter now states how many records hold no site relationship and are excluded rather than assumed in. Exact results are in the [evidence record](../testing/evidence/customer-360-r01/README.md).

No screen reader, assistive technology, physical device, colour-contrast measurement, print review, second browser engine, owner visual acceptance or business acceptance has occurred. No MYOB endpoint, schema, permission, company definition, status vocabulary or financial definition has been verified against a real instance. No parent requirement and no acceptance case is passed by these design checks.

## Next bounded step

Build the read-only Overview and Sales orders sections against two synthetic server contracts, with the persisted `ErpAccountMapping` and server-enforced grants, and nothing else. The [report's section 16](../reference/ui/customers/PPO-Customer-360-Workspace-Report-r01.md#16-recommended-next-bounded-increment) records its scope, its acceptance evidence and what is explicitly excluded.
