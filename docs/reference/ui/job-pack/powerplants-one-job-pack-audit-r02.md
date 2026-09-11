# Powerplants One — Job Pack design audit

**Audit date:** 10 September 2026  
**Reviewed baseline:** Job Pack design r01  
**Refined deliverable:** `powerplants-one-job-pack-r02.html`  
**Recommendation:** Retain the design and use r02 for final visual acceptance. A rebuild is unnecessary.

## Overall assessment

The existing page has a sound structure for a technician job pack. Its nine sections cover the visit context, customer arrangements, authorised scope, equipment, history, technical references, tools, site controls and completion requirements. Separating the readable pack from its preparation form keeps the technician view focused while giving the coordinator a clear place to enter information.

The principal weaknesses were in state consistency, validation feedback and print behaviour. These could make an otherwise professional page feel unreliable: a confirmed visit could still show pending access wording, a missing document could send the coordinator to the wrong checkbox, and printing could exclude recent edits with little opportunity to notice.

R02 addresses these findings while retaining the approved layout. This is an audited HTML design preview with fictional records; it is not evidence that the production app, issue workflow or backend integrations have been implemented.

## Design alignment

The audit compared the Job Pack source with the accepted Field Technicians r04 HTML and the supplied Powerplants brand guidance. The Leads and Projects screenshots in the conversation informed the wider visual direction; their pages were not re-tested during this audit.

| Element | Assessment and treatment |
| --- | --- |
| Page framing | Retained 24 px outer padding on desktop and 16 px at the mobile breakpoint. The content remains inset from the page edges. |
| Palette | Retained navy `#242a37`, green `#62bb46`, pale grey `#f5f6f8`, white panels and muted separators. |
| Typography | Preserved the original embedded Roboto font bytes and licence, with Verdana fallback. Increased selected 11 px metadata to 12 px. |
| Header and navigation | Retained the compact job heading, restrained badges, navy primary action and green active-tab underline. |
| Information density | Retained the contents rail, central document and readiness summary. No additional dashboard cards or decorative elements were introduced. |
| App container | Preserved this as an internal Service page. The broader app shell remains responsible for global navigation and branding. |
| Responsive structure | Retained the desktop, intermediate-width and mobile layouts. Short-height behaviour and access to record metadata were refined in CSS. |

**Visual conclusion:** The source styling is consistent with the approved direction. Rendered alignment, wrapping and spacing still need a browser inspection before final visual acceptance.

## Findings and applied refinements

Priority reflects the impact on using this design: **High** affects interpretation of a record or draft output; **Medium** affects completing or navigating a task; **Low** improves presentation.

| ID | Priority | Finding in r01 | Refinement applied in r02 |
| --- | --- | --- | --- |
| JP-01 | High | Customer arrangements continued to say controls-area access needed confirmation after confirmation was saved. | Customer guidance and the Site controls badge now derive from the saved access state and confirmation record. |
| JP-02 | High | Selecting “Confirmed for visit” without a confirmation record still displayed that label. Unavailable access and tools used generic pending wording. | The page distinguishes **Awaiting confirmation**, **Confirmation record needed**, **Confirmed for visit** and **Access unavailable**. Unavailable instruments receive an explicit message. |
| JP-03 | High | Printing with unsaved entries immediately opened print after a brief message. The output used the previous saved draft. | Print now offers **Save and print**, **Print saved draft** and **Cancel** when entries are unsaved. Printing does not change the pack’s review or issue state. |
| JP-04 | High | Print styling hid the readiness summary and outstanding-preparation notice. | A print-specific summary includes the saved preparation count, outstanding items, dispatch hold and unissued status. If edits remain unsaved, their exclusion is explicitly stated, including for the browser’s print command. |
| JP-05 | Medium | A missing required site document could direct the user to the configuration checkbox, even when configuration was already selected. | Each missing required document receives its own error and exact field target. |
| JP-06 | Medium | Readiness could show all six checks complete with an empty preparation/change reason, although review submission rejected it. | The preparation-instructions check now includes the change reason, so the summary and submission gate agree. |
| JP-07 | Medium | Validation messages and invalid-field state could linger after saving or discarding. | Errors clear on save and form reconstruction. After a failed submission, editing re-evaluates the displayed errors. Partial draft saves remain permitted. |
| JP-08 | Medium | Error summaries were not accompanied by field-level explanations, and help text lacked explicit description associations. | Added inline errors and programmatic associations between controls, help and error messages. Error links move focus to the relevant control. |
| JP-09 | Medium | Review submission saved the latest entries but could omit their preparation reason from the event history. | When submission includes unsaved changes, a preparation-save event retains the reason before the review-request event. |
| JP-10 | Medium | Closing a discard dialog could try to return focus to a button that had just become disabled. | Dialog focus returns to an available trigger, with the active tab as a fallback. Confirmation dialogs use “Cancel” for the secondary action. |
| JP-11 | Medium | Both section menus were regenerated using the active view’s link prefix. Changing views also reused the page’s current scroll position. | Each view now owns its section links and selected section. Pack, Preparation and Revision history retain separate scroll positions. |
| JP-12 | Medium | Preparation’s numeric tab badge did not explain what its count meant. | Its accessible name identifies the number of outstanding checks in the saved draft. Warning icons in the section menu also have text equivalents. |
| JP-13 | Medium | The tools table could require horizontal scrolling on mobile without an explicit keyboard-focusable scroll region. | Added a named, keyboard-focusable table region. Tab panels are also focusable. |
| JP-14 | Low | Some metadata was small and form-field borders were faint. | Raised source, readiness, crew and navigation metadata where applicable; strengthened editable-field borders while retaining the brand palette. |
| JP-15 | Medium | Sticky rails and form actions could occupy too much of a short viewport. Pack record metadata disappeared at intermediate widths. | Rails become static at shorter heights, and form actions become static in very short viewports. Added field scroll margins and retained Pack record at intermediate widths. Dialog actions can wrap. |

## Information and workflow review

The current content is appropriate for a full preparation and reference page. The following separations should remain part of implementation:

- **Linked context:** Customer, work order, appointment, equipment and approved scope come from their source records. Preparation notes must not silently change them.
- **Coordinator entries:** Arrival arrangements, task briefing, selected reference revisions, equipment verification notes, tools, access confirmation and completion requirements belong to the visit’s preparation.
- **Technician evidence:** Findings, readings, photos, time, parts used and actual completion remain in the field workflow, linked to the visit. The pack defines what is required.
- **Controlled issue:** A prepared draft and a review request are separate from issue, distribution, acknowledgement and work authority. R02 preserves that distinction.

The Preparation checklist intentionally describes the **saved draft**, as its helper text states. Review submission validates and saves the latest form entries. This avoids silently treating unsaved edits as the current pack.

The sample technical documents remain reference previews, not actual manuals or drawings. Production integration will need to resolve the selected revision to its retained document and show clear unavailable or superseded states. The current page makes its fictional references explicit.

## Verification performed

| Check | Result | Evidence boundary |
| --- | --- | --- |
| JavaScript syntax | Passed | Checked the authored script and the script extracted from the generated HTML. |
| Targeted behaviour checks | **17 passed** | Node VM tests with controlled DOM stubs exercised readiness, validation, state changes, print choices, escaping, focus fallback and scroll restoration. These are logic tests, not browser interaction tests. |
| Generated section structure | Passed | Parsed the actual generated read and preparation markup: nine sections in each view, one page heading and no duplicate IDs. |
| Labels and ARIA references | Passed | Label targets and `aria-labelledby`, `aria-describedby` and `aria-controls` references resolved in the combined markup. Native assistive-technology behaviour was not tested. |
| Assets and portability | Passed | Original embedded font bytes and licence retained. No external scripts, stylesheets, images or CSS asset URLs are required. |
| Outer spacing | Passed in source | Desktop 24 px and mobile 16 px padding remain in the final HTML. Rendered overflow was not measured. |
| Colour calculations | Passed for assessed pairs | Primary text against white: **14.37:1**. Secondary text against white: **4.95:1**. Input borders improved from **1.62:1** to **3.32:1** against white and are **3.07:1** against the page grey. This is not a whole-page accessibility certification. |
| Browser and print rendering | **Not verified** | Browser preview access was unavailable in this session. No rendered screenshots, native-dialog checks, screen-reader tests or A4 pagination checks are claimed. |

The 17 behaviour checks covered the two initial preparation gaps; complete preparation; missing change reason; one and both missing required references; confirmation without evidence; unavailable tools/access; saved access wording and escaped input; stale error removal; rejected review without mutation; successful review with retained reason; unsaved print choice; save-and-print; print-saved with an exclusion notice; dialog focus fallback; separate section-link prefixes; and independent view scroll positions.

## Final acceptance checks

R02 is ready for a focused visual review. The remaining checks should be performed in the browser used for the Powerplants One app:

1. **Desktop:** Inspect at normal zoom in a typical laptop window and a wide desktop window. Confirm the outer margins, header wrapping, section alignment and readiness column.
2. **Narrow viewport and zoom:** Inspect around 390 px width and at 200% zoom. Confirm that only the tools table scrolls horizontally where needed, and that form controls and actions remain reachable.
3. **Keyboard and dialogs:** Move through tabs and section links, open and cancel dialogs, follow validation links, then save and discard changes. Confirm visible focus and usable native-dialog behaviour.
4. **Print:** Preview A4 output for an incomplete draft and for unsaved changes. Confirm all nine sections, readable tables, page breaks and visible draft/readiness information.

No further structural redesign is recommended. Once those visual checks pass, r02 is the preferred design for acceptance and integration. Production persistence, permissions, document retrieval, issue and acknowledgement still require implementation and verification in the app.
