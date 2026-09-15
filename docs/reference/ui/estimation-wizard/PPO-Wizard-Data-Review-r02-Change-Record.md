# PPO Wizard Data Review r02 — change and verification record

**Delivered:** a self-contained, read-only HTML review module with the r16 Wizard theme applied. Open `PPO-Wizard-Data-Review-r02.html` in your desktop browser. It includes the same historical dataset as r01; it does not connect to SharePoint, update the register or approve information for a new estimate.

## What changed

| Area | r02 behaviour |
| --- | --- |
| Source disposition | Specifications display **Source disposition** and **Register review** separately. Confirmed facts sort first; superseded facts remain accessible and labelled. Rumbalara's 650 L confirmation and superseded 1,200 L quotation wording remain separate records. |
| Specification values | Units are added once to numeric values. Existing text containing units or qualifiers is preserved. All seven identified duplicate-unit cases are corrected in presentation. Original wording and raw values remain unchanged. |
| Evidence inspection | A modeless, square-edged panel shows the clicked value, exact cell/page locator, filename, source version and record/source revisions. It also exposes original wording, technical identifiers and complete record data. Copy evidence reference includes the precise locator and snapshot. |
| Pricing summary | Duplicate base/costed amounts are combined visually. Missing additional schedules are described as not separately recorded. RDB's separate wireless schedule and unresolved combined total remain distinct. Boomaroo is labelled a package/stage reference without an invented project total. |
| Snapshot context | Header shows **Selected at export** and the original export timestamp in UTC. Details retain bundle, project snapshot, revision and policy. r02 is the interface revision, not a new historical extraction. |
| Review workflow | Primary action opens the combined 86-record queue. Project entries show review counts. Review scope, status, source disposition and record-type filters support triage. Existing user confirmations remain available. |
| Project filtering | A search that excludes the inspected project retains its detail, displays an explanation and offers **Show this project**. Clearing filters keeps the inspected project. |
| Shared clauses/rules | A selector switches between Draft clauses and Candidate rules. Search applies to the selected content. Neither is selected for a project or approved by opening it. |
| Theme | Embedded Roboto, 26/20 px Wizard heading hierarchy, exact r16 navy/green/neutral tokens, 6 px controls, 1 px control/menu borders, 14 px choice cards and shared focus styling. No app-wide side navigation is added. |
| Keyboard and responsive structure | Associated tabs support arrows, Home and End. Controls persist across pagination. Enhanced selects include keyboard selection, type-ahead and native fallback. Phone CSS uses 16 px inputs, 44 px controls and labelled record layouts. Inspection has a named region and explicit close/focus return. Native behaviour still requires the checks below. |
| Print and report | **Print all filtered records** builds every matching record in the current section, including all 878 Boomaroo components when unfiltered. A standalone filtered HTML report provides the same complete record scope, source locators and snapshot provenance. |
| Reference export | JSON includes the complete inspected project, shared reference library, export timestamp, selected-at-export state and original policy. Snapshot-specific filenames distinguish copies. Filters do not reduce this full project export. |
| Component isolation | CSS is scoped to `.ppo-review`; the preview body rule is separate. Script state stays within the component. A root-level `ppoReview.mount()` / `ppoReview.dispose()` lifecycle removes listeners, menus and enhanced controls on disposal. |

## How to use it

1. Open the r02 HTML. It starts on **Rumbalara Nursery**.
2. Use the project list and its category/family filters to find a reference. The number beside each project is its imported review-record count.
3. Open **Specifications & scope**. Review both status columns before treating a value as the reference. Source confirmation does not automatically complete register or technical review.
4. Click a cell/page reference to inspect that specific evidence. Close the panel to return to the source control.
5. Choose **Review imported items** for the combined queue, or use **Review scope → Inspected project**. Check **Existing user confirmations** before asking the same business question again.
6. Use **Export reference** to download the full inspected-project JSON or all filtered records in the current section as an internal HTML report. Project-list filters do not reduce a section report; its stated section/review scope does.
7. Record actual review decisions through the source-register workflow, then generate a refreshed extraction. This viewer deliberately has no pretend Save, Resolve or Approve action.

## Preservation and verification

The embedded JSON matches r01 **byte-for-byte**. The original r01 HTML is also retained unchanged in the verification bundle.

| Retained data | Count |
| --- | ---: |
| Projects | 12 |
| Pricing packages | 140 |
| Supporting component rows | 1,848 |
| Specification/scope facts | 992 |
| Imported review records | 86 |
| Shared Draft clauses | 18 |
| Shared Candidate rules | 31 |

**41 deterministic assertions passed** against the delivered script with a minimal DOM harness. They cover the seven unit cases; Rumbalara evidence/status distinctions; known Sohi, Bush to Bowl, RDB and Boomaroo pricing treatment; retained filter context; queue/filter counts; tab/menu event handling; full 878-row report generation; project JSON preservation; and component disposal/remounting. Separate static checks verify dataset identity, HTML structure, embedded assets and r16 tokens/geometry.

These are source and DOM-model checks, not native browser acceptance. The connected browser's URL security policy blocked opening this local HTML file. No alternate browser route was attempted. There is no claimed screenshot, screen-reader, native download/printing or Excel verification.

## Remaining desktop acceptance

Before app integration, open the delivered file in your normal Chrome or Edge browser and check:

- Desktop layout, 390 px responsive width, long text and 200% zoom. Verify there is no unintended page overflow and essential values remain accessible.
- Tab arrows/Home/End, menu type-ahead, Escape, modeless inspection and actual focus return. Inspect with a screen reader where required.
- Download one project JSON and filtered HTML report; confirm their filenames and full record counts.
- Print preview for a filtered report and the 878-row component report. Confirm pagination, page breaks, full text and source context are legible.
- Embed only after checking host CSS, module lifecycle and print behaviour. The standalone wrapper does not constitute live app integration.

Workbook recalculation, macros, technical compatibility and approval of candidate dependencies remain separate outstanding work. No prices, formulas, source statuses, review decisions or rule approvals were changed by r02.
