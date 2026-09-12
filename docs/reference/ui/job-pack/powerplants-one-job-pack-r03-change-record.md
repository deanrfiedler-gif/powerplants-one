# PPO Job Pack — design r03 change record

**Deliverable** `powerplants-one-job-pack-r03.html` · 481,380 bytes · SHA-256 `5b41481460984bdeb09f683b76a5ba30cdd805eb19f90735e725d01fedc6b825`
**Predecessor** Approved r02 · SHA-256 `fe2ded4a0cd9813c06e666499cc9842691e73c95be9b9e18f2aae9bf59c262fd` · retained unchanged. The embedded Roboto WOFF and its OFL licence comment are byte-identical in r03.
**Date** 12 September 2026
**Basis** [Job Pack r02 rendered audit](powerplants-one-job-pack-audit-r02-rendered.md) §8 (Streams A–E) and the cross-baseline finding M2 in the [Field Technicians r04 audit](../field-technicians/powerplants-one-field-technicians-audit-r04.md).
**Status** Accepted by Dean Fiedler on 12 September 2026 as the r02 successor (see [decision](../../../decisions/job-pack-design.md)). Not application code; not a change to the P06 pack workbench, its enums or TR-04. The decision record's "presentation to preserve" list is unchanged: same padding, palette, typography, three views, rails, guided preparation and print choices.
**Stored as** `docs/reference/ui/job-pack/powerplants-one-job-pack-r03.html` and this record, beside the preserved r02 files.

---

## 1. What changed, by audit finding

| Audit | Change in r03 | Where |
|---|---|---|
| **M1** stale change reason | The persistent "Preparation / change reason" field is removed. Saving opens **Record preparation change**: it lists every changed field with before → after (arrays as added/removed items) and requires a reason. Submit for review does the same when unsaved edits are included. Revision history shows the reason and the field-level delta on each event. | `requestSave()`, `diff()`, `commitSave()`, `renderHistory()` |
| **M2** binary readiness | Six criteria from a registry with stage (Review / Dispatch), policy reference and exception-permitted flag; outcomes **Pass · Blocked · PermittedException · NotApplicable · Unknown**. Tools: selecting *Unavailable* reveals an evidenced-exception block (alternative plan + approved by) and yields PermittedException; Parts is NotApplicable from scope with assessor; site access and controls state "no exception permitted". Pack section 07 prints the exception. | `criteria[]`, `evaluate()`, `readinessRow()` |
| **M3** no source as-at | Every section source tag reads e.g. "From work order r01 + appointment v3 · as at 10 Sep 2026 · 14:18 AEST". The draft records its **basis** (WO r01 · APT v3 · site r02 · register v5) in the pack subtitle, rail foot, Pack record and print. A newer source version raises a **Source changed** notice with an **Assess source change** dialog (category, material yes/no, note) that blocks submission until recorded — TR-07's review requirement presented. A material change while in review withdraws the review request. A footer control *Preview: simulate appointment change* demonstrates it. | `sources`, `draftBasis`, `sourceTag()`, `assessChange()` |
| **M4** vacuous checks, literal `6` | "Scope and visit linked" and "Evidence requirements" are context rows without a tick; all counts derive from `readinessSummary()`. The review dialog and print use the derived figures. | `contextRows()`, `renderReadiness()` |
| **M5** originating issue droppable | History entry `h1` is `required` (originating ticket); deselecting it blocks review with a per-item error and marks section 05 in the rail. | `history[]`, `validationErrors()` |
| **M6** timestamp format / actor / zone literal | One formatter for all events: `dd Mon yyyy · HH:mm ZONE · actor`; zone label and offset derived from `site.timeZone` via `Intl`, not typed; actor from `session`. | `fmtDateTime()`, `zoneLabel()`, `eventStamp()` |
| **M7** references outside the registry | Equipment `SYN-PPO-AST-000031`, instrument `SYN-PPO-AST-000047`, site `SYN-PPO-SITE-000018`, history origins `SYN-PPO-TKT-000097` / `SYN-PPO-RPT-…`. Serial number is a manufacturer-style key (`CCD-26-0184`), not a SYN reference. Documents use **`SYN-PPO-DOC-nnnnnn` — a proposed type code**, see §3. Print carries "Synthetic example — not for operational use". | fixtures, `renderPrintSummary()` |
| **U1** scroll-spy | Last section selected when the page is at its scroll limit; a nav jump locks the spy for 600 ms so the clicked section stays current. Verified 07 → 07, 08 → 08, 09 → 09. | scroll handler, `focusJump()` |
| **U2** dialog focus | Confirmation dialogs focus the primary action (or the reason field when one is required); information dialogs focus the heading. | `openDialog()` |
| **U3** no unsaved signal on phones | An **Unsaved changes** badge in the header status row at every width. | `#unsaved-badge` |
| **U4** submit far from status | The notice bar's action becomes **Submit for review** when preparation is complete. | `renderReadiness()` |
| **U5** `DRAFT r01 · DRAFT` | Print status line rebuilt: `SYNTHETIC EXAMPLE — NOT FOR OPERATIONAL USE · SYN-PPO-PACK-000185 · r01 · DRAFT · NOT ISSUED · Prepared by …`. | `renderPrintSummary()` |
| **U6** contrast | Current-row number inherits ink; unavailable option text uses `--muted` (4.95:1). 0 failures at 1440 / 1024 / 390. | CSS |
| **U7** semantics | `role="presentation"` on the tab-trailing span; tabpanels no longer `tabindex="0"`; history items are `<h3>`; "Job pack, 9 sections" `aria-label`; toast is a persistent `role="status"` region revealed before its text changes; error messages use the field-label map. | markup, `notify()`, `FIELDS` |
| **U8 / U9** | `align-items:start` on the rail; jump-select options carry "⚠ needs preparation"; scope revision, visit date and timezone appear in the pack subtitle and rail foot. | CSS, `renderNav()` |
| **P1** orphaned subheading | `break-after: avoid` on `.subheading`. | print CSS |
| **P3** pages without identity | `@page` margin boxes: top-left pack reference · revision · state · "Not issued"; top-right **Page n of N**; bottom-centre synthetic statement, customer and title. Verified on all 4 A4 pages. | `#print-page-style` |
| **P4** print provenance | Source tags and "Prepared by" print. | print CSS |
| **D1** tokens | 41 semantic tokens (surfaces, lines, success/warning/danger/info/neutral) replace 64 hard-coded values; 8 remain (shadows with alpha, hover, page ground). Inline styles in templates reduced from 25 to 3 (table `colgroup` widths). | CSS |

## 2. Verification performed on the delivered file

Playwright 1.56 / Chromium 1194, same procedures as the r02 audit: 0 console/page errors on all views at 1440 × 960, 1024 × 768 and 390 × 844; `scrollWidth` = `clientWidth` at 390 px on all views; 0 WCAG AA contrast failures (250 text-bearing elements measured on the desktop pack view); output escaping held under `<img onerror>` injection into all nine text fields and the change-reason field (0 executions); scroll-spy 07/08/09 all selectable; dialog focus as designed; tool exception path unblocks review; source change blocks submission until assessed and updates the draft basis; two consecutive saves record two different reasons with field deltas; unsaved badge visible on the pack view at 390 px; A4 print 4 pages with repeating header and "Page n of 4"; "Collection and preparation instructions" no longer orphaned.

Not done: screen-reader, Safari/Firefox, physical device. `@page` margin boxes need Chromium 131+; older browsers print without the running header but with the in-body status lines.

## 3. Decisions recorded with acceptance (12 September 2026)

1. **r03 accepted as the successor baseline.** r02 bytes and hash are preserved unchanged; this record is the rationale.
2. **`SYN-PPO-DOC` type code.** PPO-STD-001 §10.2 has no controlled-document reference type and says additions need an explicit amendment. Alternatives: register `DOC` for local document references, or present documents by their SharePoint identity with revision separate (BP-02 makes SharePoint the document owner). r03 uses `DOC` provisionally and labels nothing as final.
3. **Readiness policy identity.** Rows cite "PP-01 synthetic policy r01". The application's readiness registry should supply real policy references at integration; r03 shows where they appear.
4. **Cross-baseline fixture.** r03 keeps the Job Pack values for `SYN-PPO-APT-000242` (11 September, 09:00–12:00, pack Draft r01). Field Technicians r05 should align to these (its audit A2).

## 4. Deliberately unchanged

Nine sections and their entry contract; Draft ↔ Review requested as the only states (issue, acknowledgement and dispatch remain outside the preview, as the decision record requires); memory-only persistence with reload reset; the "Review requested" wording as a handover intention to be mapped at integration.
