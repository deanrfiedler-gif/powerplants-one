---
document_id: PPO-ES10-WORKSPACE-REPORT
title: Reference Cases and Calibration Proposals — Detailed Design Report
revision: r01
date: 2026-09-17
owner: Dean Fiedler
status: Proposed standalone design; owner acceptance and application integration separate
source_commit: d565a9de01b94aa7ad3fffe3a996f78c3aee589b
---

# Reference Cases & Calibration Proposals

## 1. Executive overview

The ES-10 workspace closes the design loop between reviewing a delivered job and preparing a future estimate. It makes relevant experience available at the point of estimating, preserves the evidence behind each suggestion, and provides a controlled route for proposing an improvement.

The package contains a self-contained [interactive HTML workspace](PPO-Reference-Cases-and-Calibration-Proposals-r01.html), maintainable source, deterministic builder, model checks, native-browser checks and a receiving handover. The HTML opens without a build, network connection or external font service. Local review actions are saved in the browser when storage is available.

Five connected views cover the reference register, case detail and applicability, comparable-job comparison, calibration proposals, and a proposed reference panel beside an estimate line. The initial demonstration uses Screen Systems, specifically retractable shade installation labour. It does not introduce another specialist equipment calculator.

The distinction at the centre of this design is that an observed delivery difference, an explanation of that difference, a proposed improvement and adoption of a new estimating rule are separate records and decisions. The prototype supports the first three at a synthetic design level. Adoption is unavailable because the governed rule registry and actual approval authority remain unresolved.

**Delivery status:** proposed HTML design. Publication, automated checks, independent visual acceptance, application integration and production readiness are separate milestones. Executed results and limitations are maintained in the [verification record](../../../testing/evidence/reference-calibration-r01/README.md).

## 2. Scope, authority and source reconciliation

### 2.1 Authorised increment

Dean requested this build following the recommendation to create **ES-10 — Reference cases and calibration proposals**, with interactive HTML, a professional detailed Markdown report and alignment to the Powerplants One theme board. This package implements that page brief and a demonstrative estimator panel; it does not implement application services, database tables, external integrations or a pricing policy.

ES-10 is the page identifier from the HTML coverage register. It is not a new parent requirement. The existing EST-01–EST-09 parent requirements and all 78 master requirement IDs remain unchanged. The principal links are EST-04 cost provenance and EST-06 specialist calculation evidence. The feedback proposal also identifies EST-03 durable line identity and FIN-04/FIN-07 comparison definitions as future receiving dependencies; its proposed child requirements remain unallocated.

### 2.2 Sources inspected

| Source | How it informs this package |
|---|---|
| Main `d565a9de01b94aa7ad3fffe3a996f78c3aee589b` | Repository baseline, guidance, current UI references and shared registers. |
| [Coverage register r06](../module-page-register/PPO-HTML-Page-Coverage-Register-r06.html) | ES-10 page plus estimator panel; dependency on ES-09; reviewed comparable cases, sample limitations and calibration proposals. |
| [Estimate-to-actual feedback proposal](../../../blueprints/estimate-actual-feedback-design.md) | Separates observation, attribution, calibration and governance; proposes sample treatments and reference evidence at line entry. This record expressly says its policies are not adopted. |
| [ES-09 PR #220](https://github.com/deanrfiedler-gif/powerplants-one/pull/220), inspected at `19a029bb9f7e97517432b9538ba17f7144ed2023` | Incoming reference evidence and a boundary that prepares a local ES-10 proposal without creating an ES-10 record or altering a formula. |
| [ES-08 source-informed r02 handover](../../../decisions/specialist-screen-systems-design.md) | Screen Systems formula evidence exists, but approved ranges, mappings and complete branch examples remain open. |
| [Theme board r20](../theme-style-board/powerplants-one-theme-style-board-r20.html) | Register, detail, review/comparison and guided-form composition; component tokens and snapshot geometry. Inspected blob `462dac4943fb4350cf5739787a1d29e7e096716d`. |
| [Customer 360 source](../../../design/customer-360/README.md) | Existing module-only workspace pattern and embedded Roboto font asset. |
| [PPO naming standard](../../../standards/naming-conventions.md) | Revision metadata, stable source paths and explicit separation of record identity, label, revision and state. |

### 2.3 Reconciled boundaries

The earlier feedback-loop proposal favours Projects-led delivery and describes later F4/F5 application increments. ES-09's current receiving handover proposes a smaller Service-only A1 implementation first. This ES-10 contribution is an HTML design, so it does not choose between or authorise those runtime increments. Future integration must reconcile their commercial lineage and financial-definition prerequisites explicitly.

The Northbank fixture in ES-09 is **Draft / Partial** at the inspected source. The ES-10 demonstration preserves that fact. Its accepted installation labour is 232 hours and its attributed base-scope labour observation is 291 hours. Those numbers are shown as incoming evidence, not silently promoted to a reviewed case. Its original issued estimate, accepted cost version and variation lines remain separate source records; ES-10 does not recompute the parent job's financial outcome.

Five separately authored completed examples demonstrate the eligible path. They are not claimed to be actual customer jobs, imported ES-09 outcomes or recovered workbook records. No raw operational workbook, customer export or restricted source document is included.

## 3. User outcomes

An estimator can find a relevant prior example, understand why it is comparable, inspect its assumptions and source status, and prepare an evidence-backed proposal. A reviewer can inspect the exact proposal revision, record an independent rationale, return it or reject it. A read-only observer can inspect cases, comparisons and proposal history without performing those business mutations.

The working question is: **Which reviewed experience is relevant to this estimate, and what should we propose changing?**

The workspace prevents a convenient historical number from appearing to be a current approved rate or formula. It shows sample size, full range, scope, source completeness and limitations alongside comparison results.

## 4. Page structure and navigation

The HTML contains a module heading, a context row, five local navigation tabs, a content region, a local save-status footer, a record snapshot and a modal form/review surface. It intentionally fits inside the established application shell; it does not duplicate the global rail, search, notifications, user menu or logo.

| View | Primary purpose | Principal action |
|---|---|---|
| Reference cases | Locate and select relevant evidence | Compare selected cases |
| Case detail | Inspect the full basis and applicability | Add to comparison |
| Compare cases | Compare eligible jobs and retain exclusions | Prepare proposal |
| Calibration proposals | Track exact local drafts and reviews | Prepare or open a proposal |
| Estimator panel | Explore reference evidence alongside a sample estimate line | Inspect evidence or propose an improvement |

Register selection survives changes of filter and local view during the current page session. It is not a persistent named view. Proposal and source-change records persist independently of those temporary presentation settings.

## 5. Reference case register

The register presents nine synthetic records. Four summary tiles show the number of cases, comparable cases, cases requiring separate treatment, and proposals currently in review. These are descriptive counts, not approvals or financial metrics.

The search field matches customer, title, source reference and growing context. The eligibility filter offers all cases, comparable cases and separate treatment. Clear filters restores the complete register. The name-heading control switches between alphabetical customer order and original source order. Checkboxes select cases for comparison; selection is preserved across filters and the selection count explains when selected records are hidden by the current filter.

| Register information | Meaning |
|---|---|
| Customer and case reference | A readable fixture label; opening the customer shows a snapshot. |
| Screen system | Retractable shade or the explicitly separate blackout example. |
| Growing context | Clear-access greenhouse, occupied multi-zone greenhouse or propagation house. |
| Area and work grouping | Synthetic area in square metres and a descriptive routine/bespoke grouping. These groupings are not an adopted monetary size-band registry. |
| Estimated / actual hours | Accepted estimated installation hours and used/reviewed hours from the fixture. Parent review status is separately visible. |
| Eligibility | Comparable, awaiting review, individual case only, superseded or different context. |
| Review due date | Checked against the fixed demonstration date, 17 September 2026. |

A no-result state offers a clear route back to all cases. Selecting all comparable examples includes only eligible cases. Clearing selection does not change any case or proposal.

## 6. Record snapshot and case detail

Clicking a case opens the r20-style snapshot. It shows eligibility, synthetic status, title, full source and applicability fields, and the recorded lesson. **Open full case** moves to the dedicated detail view. Escape or the close control dismisses the snapshot and restores focus when the original control remains available.

The full detail view includes:

- Case reference and source revision.
- Customer, site and growing-area context.
- Screen system, working context, driver and unit.
- Exact accepted-basis label and quantity class.
- Review state, reviewer, date, due date and completeness.
- Source reference and provenance explanation.
- Accepted estimated hours, reviewed used hours and their difference.
- Recorded cause, reusable lesson, applicable scope and exclusions.
- Explicit eligibility result and all exclusion reasons.
- A source-review timeline.

For Northbank, the source contribution link opens PR #220. Other fixtures display authored source references without pretending that an external document is available. Partial parent evidence is not labelled complete because an individual labour observation has a value.

A single-case ratio is not presented as a benchmark. Case detail shows the hours and difference and explains that one example does not establish an approved factor.

## 7. Comparable-job comparison

### 7.1 Eligibility

The initial cohort is deliberately narrow: Screen Systems, retractable shade, installation labour, clear-access greenhouse, defined scope, routine installation, hours, reviewed used quantities and AUD source context. Currency remains part of the comparison context even though no money is aggregated.

The model excludes records that are unreviewed, incomplete, expired, superseded, bespoke, from a different system or growing context, based on incompatible units or quantity classes, or missing valid non-negative actual hours and a positive estimate denominator. Excluded selected cases remain visible with their reason. They are not counted in the sample.

The example is a fixed cohort demonstration, not a general similarity-ranking service. No unvalidated unit conversion, currency conversion, inflation adjustment, site-factor conversion or machine-learned recommendation occurs.

### 7.2 Calculation

For each eligible job:

`job ratio = reviewed used installation hours / accepted estimated installation hours`

The displayed centre is the median of those per-job ratios. For an even number of jobs, the median is the mean of the two central sorted ratios. The full low-to-high range is retained. Job identities are deduplicated so repeated selection cannot increase sample size.

| Initial comparable example | Estimated hours | Used hours | Per-job ratio |
|---|---:|---:|---:|
| Willowbank | 200 | 240 | 1.20 |
| Fernhaven | 160 | 184 | 1.15 |
| Riverbend | 240 | 312 | 1.30 |
| Greenridge | 120 | 132 | 1.10 |
| Wattle Creek | 180 | 225 | 1.25 |

The initial sample is five jobs, median **1.20×**, range **1.10–1.30×**. These are authored demonstration values, not empirical company benchmarks. The visual bars accompany the numeric ratios and never supply information unavailable as text.

### 7.3 Proposed display thresholds

| Eligible sample | Display |
|---:|---|
| 0–2 | Aggregate ratio and range withheld; insufficient data. |
| 3–4 | Median and range shown as indicative only. |
| 5 or more | Illustrative comparison with sample size and full range. |

These thresholds come from the unadopted feedback proposal and are labelled **demonstration thresholds, not adopted policy**. Five examples do not establish statistical confidence. Outliers are not automatically removed. Major bespoke work remains individual reference evidence. Only won and delivered work is represented; un-won opportunities do not produce actuals, so survivorship limitations remain explicit.

A labour-factor proposal needs at least three eligible cases in this demonstration. A scope-checklist or formula-validation request may reference one eligible case because it does not claim an aggregate labour factor.

## 8. Calibration proposals

### 8.1 Preparation fields

Only the Estimator preview role can prepare or edit a proposal.

| Field | Behaviour |
|---|---|
| Title | Required; maximum 2,000 characters. |
| Improvement type | Labour allowance, scope checklist, or formula validation request. |
| Illustrative factor | Required and finite for labour allowance; 0.10–5.00 preview limit. It is neither an approved engineering range nor a computed recommendation. |
| Applicable scope | Required explanation of the circumstances where the proposal might apply. |
| Evidence rationale | Required explanation tying the suggestion to retained evidence. |
| Limitations and validation needed | Required; travels with the proposal. |
| Evidence selection | Eligible selected case identities, captured as an exact snapshot on creation. Ineligible selections are omitted with an explicit form explanation. |
| Identity and version | A separate fixture reference, proposal revision, author and creation time. |

An editable draft can be corrected before submission. Submission locks that content. The UI offers a successor draft when a completed, returned or rejected proposal needs another revision, or when a draft's source has changed. The original record remains intact.

### 8.2 Review states and actions

| Current state | Permitted next action | Result |
|---|---|---|
| Draft | Author edits the draft | Same proposal and retained evidence; no review decision inherited. |
| Draft | Author submits an unchanged evidence basis | In review. |
| In review | Independent reviewer records rationale | Reviewed proposal, Returned or Rejected. |
| In review with changed evidence | Reviewer returns it for revision | Returned, with a source-change reason. |
| Draft, Returned, Reviewed proposal or Rejected | Estimator creates a successor | New identity, next revision, current evidence, empty review history and link to predecessor. |

There is no Adopt, Apply to estimates or Approve formula action. **Reviewed proposal** means the suggestion received a local review recommendation. It changes no rate, rule, part mapping, existing estimate or quotation.

### 8.3 Evidence integrity

The retained snapshot includes case identity, revision, estimated and used hours, source reference, review state, completeness, expiry and the comparison dimensions. Current evidence is compared with this snapshot before submission and review. A changed source produces an Evidence changed warning and blocks direct continuation.

The review dialog displays original quantities even after the source changes. A successor uses the current evidence while keeping its predecessor and original decision history available. Creating a successor does not erase or silently reject an earlier reviewed proposal.

## 9. Estimator reference panel

The fifth view demonstrates where reference evidence would appear beside an estimate line. The sample line is installation labour for a defined-scope retractable shade installation in a clear-access greenhouse.

The left side contains editable **scenario-only** estimated hours and factor, a calculated hours preview, the difference from the entered hours, scope questions and an explicit unchanged-estimate notice. The right side contains the eligible sample, median, range, three example cases, source lessons and limitations.

`scenario hours = entered hours × entered factor`

The input bounds are 1–10,000 hours and 0.10–5.00. These prevent unusable preview values; they do not validate real engineering or commercial inputs. Invalid values show an error and suppress the scenario result. Calculations use JavaScript numeric arithmetic and display up to two decimal places; no money, pricing extension or financial rounding contract is invoked.

Suggested scoping questions address clear access and access equipment, controls interfaces and limit adjustment, crop-sensitive windows and shutdown restrictions, and whether blackout sealing or additional zones are in scope.

The panel does not write an estimate, generate parts, rerun the Screen Systems engine or use the median automatically. The initial factor is an explicit authored scenario value. When source evidence changes, the aggregate can change while the entered scenario factor remains unchanged.

## 10. Roles and permission boundaries

| Preview role | Allowed behaviour |
|---|---|
| Estimator — Alex Morgan | Inspect all synthetic evidence; create and edit own drafts; submit; create successors. |
| Reviewer — Sam Taylor | Inspect; independently review submitted proposals; return stale reviews; perform the labelled synthetic source-revision demonstration. |
| Read-only observer | Inspect cases, comparisons and proposal history; explore non-persistent scenarios; export the synthetic review copy. |

Role changes close open record and editor surfaces. Mutation rules are also enforced in the model, so hiding a button is not the only local check. The identity names are fictional role fixtures, not assignments of actual staff or adopted departmental authority.

This is client-side demonstration behaviour, not authentication or security enforcement. Production integration needs server-side workspace, company, record and action permissions, protected evidence storage, actor attribution, concurrency control, audit history and an adopted approval policy. The JSON export contains only authored synthetic state; the page has no hidden operational cost data.

## 11. Saving, concurrency and recovery

Local changes are persisted under the isolated key `ppo.es10.reference-calibration.r01`. The state includes schema and monotonically increasing version, cases, proposals and history. A command is calculated on a copy; the visible state changes only after the storage write succeeds.

- A failed-save demonstration fails once before persistence. The form remains open with its entered values and a retry message. Retrying creates a single draft because the failed attempt did not commit.
- Submission cannot be repeated after the proposal leaves Draft.
- Before a mutation, the current saved version is compared with the in-memory version. A different version pauses writing rather than replacing another tab's newer work.
- A storage event from another tab displays a conflict notice and reload/export choices.
- Unreadable or incompatible saved data is retained, saving pauses, and the page offers export and explicit reset options. It does not overwrite the unreadable value on startup.
- Source changes preserve earlier proposal evidence and review history.
- Reset is an explicit two-step demonstration control. It clears only this design's key and restores the authored fixtures.

Local storage is not a shared database or a guaranteed durable record system. Storage availability and behaviour for downloaded files vary by browser. Filters, selected case, active tab, role and unsubmitted form text are temporary session state. Closing or reloading an unsaved form can discard its unsaved text; there is no offline queue, automatic form recovery or cross-device sync. The export is a human-review JSON copy; an import/restore workflow is not implemented.

The design does not claim lost-server-response recovery or financial idempotency. Future command endpoints need stable operation identities and durable receipts before any external effect is introduced.

## 12. Demonstration and export controls

The Review guide explains the recommended walkthrough and labels the synthetic environment. It also exposes three deliberate controls: fail the next save once, revise Willowbank's source as Reviewer, and explicitly reset the demonstration.

The source revision adds 10 synthetic used hours to Willowbank and increments its source revision. This creates an observable stale-evidence case. It changes no ES-09 or ES-08 file, historical calculation or external record.

Export review copy creates `PPO-ES10-Synthetic-Review-Copy.json`, containing the design version, synthetic flag, export time, limitations and current local state. It includes exact original proposal snapshots and local decision history. It is not a SharePoint issue, approval package, system backup or notification.

## 13. r20 theme alignment

| Pattern | Applied treatment |
|---|---|
| Brand and typography | Embedded existing Roboto font asset; Verdana fallback; navy `#242a37`, green `#62bb46`, paper `#f5f6f8`. |
| Module heading | One page title, short outcome statement, synthetic/revision label and local guide action. |
| Local navigation | White context strip and tabs, green active underline, labelled preview role. |
| Register / worklist | Compact toolbar, evidence filter, selection, readable table and contextual next action. |
| Record detail | Main evidence column plus concise supporting panels; explicit applicability and source facts. |
| Review / comparison | Declared comparison basis, paired quantities, exclusions and separate decision controls. |
| Form / guided workflow | Required labelled fields, explanation of evidence and local validation near the form. |
| Snapshot | 448 px desktop, square dock edge, full-width small-phone treatment and Open full case action. |
| Cards and controls | Seven-pixel card corners, six-pixel control corners, restrained borders and neutral surfaces. |
| Status semantics | Text-labelled success, warning, information and superseded/rejected states; colour is supplementary. |
| Modal reviews | Ten-pixel corners, clear close/cancel actions, focus containment supplied by native dialog. |

Retained visual examples: [desktop estimator panel](../../../testing/evidence/reference-calibration-r01/desktop-estimator-panel.png) and [phone case comparison](../../../testing/evidence/reference-calibration-r01/phone-case-comparison.png), captured from the verified layout source recorded in the evidence manifest.

Native select controls are retained in this first package for predictable keyboard behaviour. They use the shared field colours and dimensions; the richer r20 custom choice-card menu is not implemented. The estimator panel is an ES-10 composition extension built from existing card, review and reference patterns, not an accepted application baseline. No existing shell or baseline hash is replaced.

## 14. Responsive and accessibility treatment

The desktop register becomes labelled record rows on smaller screens so its facts remain readable without a page-wide horizontal table. Summary tiles become two columns, detail and estimator sections stack, and proposal actions wrap. The snapshot uses the available phone width.

The page uses `lang="en-AU"`, a skip link, real buttons, form labels, tab roles with selected state and arrow/Home/End navigation, visible keyboard focus, live save/error messages, text status labels, a native dialog and reduced-motion support. Mobile control targets are at least 44 px tall. Inputs, scenarios and reference quantities display units.

The native test harness exercises 1440, 1024, 820, 390 and 320 px layouts, overflow, the snapshot, keyboard tabs and all five views. This is not a WCAG conformance claim. Physical-device, screen-reader, high-contrast and independent 200% zoom acceptance remain separate. Print CSS is a basic reading treatment; paginated print output is not a controlled issued document.

## 15. Detailed demonstration walkthrough

1. Open the HTML. The register shows nine cases with the five comparable examples selected.
2. Search for Northbank. Select it, clear the filter and confirm selection persists.
3. Open Northbank's snapshot, then full case. Review its Draft / Partial lineage and exclusion reasons.
4. Open Compare cases. Confirm the sample remains five eligible jobs and Northbank remains separately visible.
5. Inspect the median 1.20×, range 1.10–1.30×, sample warning and declared hours basis.
6. As Estimator, prepare a proposal with scope, rationale and limitations. Save the draft and inspect its retained evidence.
7. Edit the draft if needed, then submit its exact revision.
8. Switch to Reviewer. Open the proposal and record a rationale and outcome.
9. Confirm Reviewed proposal does not provide an adoption action.
10. Use Review guide to revise the Willowbank source. Inspect the old proposal's original 240-hour value and Evidence changed warning.
11. As Estimator, create a successor. Confirm its new 250-hour source value, link to the predecessor and empty review history.
12. Open Estimator panel. Enter a separate hours/factor scenario and inspect the preview while the estimate remains unchanged.
13. Export the synthetic review copy. Reload and confirm saved proposal history remains available.

For small-sample behaviour, select one or two eligible cases in the register. The comparison withholds aggregate ratios. Add a third to see the indicative state. Adding the bespoke, superseded or blackout examples retains the relevant exclusion without inflating the sample.

## 16. Receiving contracts for application work

| Boundary | Required future contract |
|---|---|
| ES-09 → ES-10 | Stable reviewed outcome identity and revision; exact comparison-basis record; line identity; source scope, units, completeness and review evidence; explicit receiving acceptance. A local ES-09 handover is not enough. |
| ES-10 → Estimating | Permission-scoped reference queries, explicit applicability and limitations, durable source links, and a deliberate estimator decision. |
| ES-10 → ES-08 | A proposal may request formula/range/mapping validation. Any accepted change needs an approved versioned definition pack, branch examples and safe rerun/override treatment. |
| Governance | Named review/adoption authority, a governed rule registry, lifecycle and invalidation policy; confirmed thresholds and taxonomy. |
| Finance / MYOB | Authoritative definitions and source keys for any later cost comparison. D-017, posted versus committed cost and completeness cannot be inferred from hours. |
| Documents / SharePoint | Actual source access, retention, revision identity, exact bytes and applicable review/distribution evidence. |
| Shared platform | Server permissions, workspace/company scoping, durable commands and receipts, audit, stale-version conflicts and resilient saves. |

The screen must not imply that creating or reviewing a proposal closes its originating project, work order, supplier claim, finance exception or customer follow-up. Knowledge articles and validated technical procedures retain their separate review lifecycle.

## 17. Implementation package and maintainability

Sources are in [docs/design/reference-calibration](../../../design/reference-calibration/README.md): `template.html`, `fonts.css`, `workspace.css`, `model.js` and `workspace.js`. The Python builder embeds them into one offline HTML file. The source structure mirrors existing standalone PPO designs and adds no dependency, framework, database migration or runtime application route.

The model owns seed data, eligibility, aggregation, evidence snapshots and transition validation. The browser layer owns presentation, interaction and local storage. User-entered text is escaped before HTML rendering. Model checks run independently of a browser; native checks exercise the generated artifact.

Fixture labels `SYN-ES10-REF-…` and `SYN-ES10-CAL-…` are explicitly local demonstration labels. This contribution does not register new PPO-STD-001 record-type codes or treat a readable label as a production primary key. The proposed runtime model must use immutable UUIDs and separately governed readable references.

## 18. Verification and evidence

The local model suite checks calculations, sample suppression, selection deduplication, exclusions, invalid quantities and inputs, role restrictions, draft editing, exact submission, immutable review history, source changes, stale evidence, successors and state-version conflicts.

**Executed design verification:** 24 model groups and 18 native-browser groups passed on final HTML source `e5e3eb233e7dc865a67a7d8867757dc5d510e19b`, using Chrome 153.0.8010.47, with no page/console errors and 28 captures. Focused lint, deterministic assembly, foundation, prototype and naming checks passed in [run 35157933992](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/35157933992). Desktop and phone captures were inspected; a sticky-navigation focus issue and skip-link capture artefact identified in the first run were corrected and reverified. The final HTML and screenshot hashes were checked against the returned CI evidence. Later evidence/report-only publication does not change the verified HTML bytes.

The native suite checks search and filtering, snapshots and detail navigation, incomplete-source exclusion, failed save with retained text and retry, escaped draft content, role-based review, persistence on reload, stale-source successors, scenario isolation, keyboard tabs, export contents, cross-tab conflicts, corrupt saved-data retention, responsive widths and phone snapshot behaviour.

Repository assurance uses the required foundation, prototype and naming scripts. Full results must be read from the current contribution's CI and the linked evidence record. A local shallow clone was unavailable in this environment; source files were read through the GitHub connector. No local complete-repository assurance pass is claimed. The cloud review browser blocked local URLs, so native execution and screenshots are delegated to the repository's existing CI runtime, not inferred from source inspection.

## 19. Explicit exclusions and open decisions

This package does not provide production rule adoption, automatic repricing, live ERP or SharePoint reads, monetary benchmarking, margin, profitability, an accepted financial cost definition, an approved specialist formula pack, a general case-similarity algorithm, automatic data ingestion, notifications, operational messages, offline sync or server-enforced permissions.

Before integration, decide the owner and review authority, reference-case acceptance criteria, supported source contracts, registry and calibration lifecycle, sample thresholds, fixed/variable labour treatment, normalisation rules for any future costs, exact change invalidation, retention and access policy, and the runtime increment that should receive this design.

The first useful application increment would be **permission-scoped read-only reference cases beside an existing estimate**, after a reviewed-source receiving contract exists. Proposal persistence and governed adoption should remain separately bounded increments. This recommendation does not expand the current authorisation beyond the standalone HTML and report.

## 20. Handover

Review the five views, the included Screen Systems journey, the stale-source successor path and the responsive layouts. Record owner design feedback against this exact revision. The [design decision and receiving handover](../../../decisions/reference-calibration-design.md) and verification record retain the repository baseline, dependency state, actual test evidence and remaining acceptance work.
