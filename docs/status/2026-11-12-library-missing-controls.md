---
title: Missing controls added to PPO - Library
date: 2026-11-12
---

The library audit listed controls the private Figma file "PPO - Library" lacked, and Dean agreed an order for them. On 12 November 2026, asked for the next steps, Claude recommended drawing them while the page acceptances and the shell copy were with Dean, and Dean answered: "Proceed based on your recommendations." The [Controls record](../decisions/library-controls.md) (PPO-LIBRARY-CONTROLS-PROP), section 7, lists what was drawn.

- **Eleven parts, all `Status: Proposed`.**
  - Search field, for use inside pickers, popovers, drawers and phone sheets.
  - Multi-select, with Removable chip and Check option.
  - File drop and Upload row.
  - Pager, with a Load more form.
  - Switch and Switch field.
  - Segment and Segmented.
- **Review board.** Four new cards on the Controls page: Search and multi-select; Files; Paging; Switch and segmented. Card 9 lists the new values.
- **An accepted rule found.** "No second search" (Sales and Estimating refined files) says no search box appears in the content area of any page. The search field is drawn for pickers and sheets only, and its placement is an item to confirm.
- **To confirm.** Six items need Dean's decision:
  - where a search field goes;
  - the multi-select;
  - file types and size;
  - rows per page;
  - the switch;
  - the segmented control.
- **Also changed.** The Gantt page's toolbar example uses the segmented control. Three older layers with default names were renamed.

**Checked:** each new part and card was rendered and inspected, and drawing defects found on the way were fixed. A structural read of the Controls page found no solid fill or stroke without a variable, no text without a text style, no default layer name and no component without a status line. Repository checks: `python3 scripts/build_status.py --check`, `python3 scripts/check_naming.py`, `python3 scripts/check_foundation.py` and `python3 scripts/check_design_tokens.py`.

**Not done:**
- Breadcrumb, progress bar and date range are still not drawn.
- Fourteen plain corner radii remain on older focus rings and example frames.
- The built search boxes, switch, view switch and pagers are unchanged.
- No prototype links were set, and nothing was tried with a keyboard or on a touch screen.
- No page is accepted and the library is not published.
- No application code, binding, register or page guide changed. No variable was added.

Every record shown is synthetic. File links are not recorded here (ADR-0050, ADR-0053).

<!-- decision-index -->
[Controls in PPO - Library](../decisions/library-controls.md) (PPO-LIBRARY-CONTROLS-PROP) now records the controls added on 12 November 2026 from the audit's list: search field, multi-select, file drop, pager, switch and segmented control, as eleven Proposed parts. It lists six items for Dean to confirm, including where a search field may be placed under the accepted "No second search" rule. It authorises no application code, route, migration, permission or deployment.
