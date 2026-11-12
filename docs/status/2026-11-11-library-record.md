---
title: Record page drawn in PPO - Library
date: 2026-11-11
---

After the Gantt, Forms and States items were confirmed, Dean answered for the third time: "Proceed however you believe is the most professional." Record came next of the groups the design-to-build standard requires and the private Figma file "PPO - Library" lacked. The [proposal record](../decisions/library-record.md) (PPO-LIBRARY-RECORD-PROP) lists what was drawn.

- **Record page.** A page named "Record · Details, tabs and history" holds the parts every record page shares below its header:
  - the page's own bar;
  - the 380 px details column and its facts;
  - state banners;
  - the next activity and the composer;
  - History and files.

  The sources are the accepted lead, work order, project, deal, organisation, people, quotation and estimate record pages, the Sales and Estimating files and the shell's record header rules.
- **Shell parts not redrawn.** The record header and the snapshot drawer are accepted shell components. They move into the library with the shell, so the page draws them as layouts only.
- **Parts.** Eleven `Status: Proposed` parts: Fact, Details section, Details strip, Readiness bar, Key dates, State banner, Focus, Composer, History day, History item and File row. Five icons were added: Mail, File, Star, Printer and History.
- **Review board.** Eleven cards:
  - anatomy;
  - header and bars;
  - details column;
  - view tabs;
  - next activity and composer;
  - History and files;
  - editing;
  - states;
  - tablet and phone;
  - Do and Don't;
  - the values.
- **Variables.** `record/details-width` and `record/details-folded`. The edit drawer uses `drawer/standard` from the [drawer widths](../decisions/library-drawer-widths.md) Dean set the same day. The library now holds 124 variables; [`docs/design/library-variables.json`](../design/library-variables.json) is updated.
- **To confirm.** Five items need Dean's decision:
  - the header stays with the shell;
  - the shell's rules for previous and next and for Outputs, over Estimating's;
  - the folded column on tablets;
  - the phone title in the content;
  - the default tab.

  The sixth, the edit drawer's width, was decided with the drawer widths.

**Checked:** the components and every card were rendered and inspected, and drawing defects found on the way were fixed. A structural read of the page (1,985 nodes) found no solid fill or stroke without a variable, no text without a text style, no shadow without an effect style, no plain corner radius and no component without a status line. Variables were read back from the file. Repository checks: `python3 scripts/build_status.py --check`, `python3 scripts/check_naming.py`, `python3 scripts/check_foundation.py` and `python3 scripts/check_design_tokens.py`.

**Not done:**
- No page is accepted and the library is not published.
- The shell components were not moved.
- No prototype links were set on the Record parts.
- The accepted record pages and the built ones are unchanged.
- No application code, binding, register or page guide changed.

Every record shown is synthetic. File links are not recorded here (ADR-0050, ADR-0053).

<!-- decision-index -->
[Record · Details, tabs and history in PPO - Library](../decisions/library-record.md) (PPO-LIBRARY-RECORD-PROP) records the shared record-page parts drawn in the private library file on 11 November 2026 from the accepted record pages and the shell's record header rules: the page's own bar, the details column and facts, state banners, the next activity, the composer, History and files. It leaves the header and snapshot drawer to the shell move and lists five items for Dean to confirm. It authorises no application code, route, migration, permission or deployment; all data is synthetic.
