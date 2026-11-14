---
title: Sales alignment batch independently checked: accept after the listed fixes
date: 2026-11-14
---

A session that drew none of the Sales alignment batch checked it in the live "PPO - Sales module (accepted)" file, read-only, against proposal record sections 15.1 to 15.7, the accepted Shell toolbar and collapsed strip, the Products file's CA14 and the Estimating file's Riverbend sheets. The [review record](../decisions/sales-module-independent-review.md#13-independent-check--14-november-2026), section 13, holds the method, what holds, 19 findings (SC-01 to SC-19), a view on each decision in section 15.2 and the verdict: accept after the listed fixes.

What holds:

- the 37 toolbar headers and 82 collapsed strips;
- the panel and dialog widths and the page structure;
- the weekdays, the retired names and the time zone;
- contrast, text sizes and the phone tab bars;
- the Riverbend brief dates, which match the Estimating file.

The fixes are mechanical but must come first:

- Riverbend's quotation still reads Draft on ten sheets.
- Fifteen owner cells still read "PN" beside Kate Morgan's avatar.
- Avatar initials of retired people remain (LB, NC).
- AD05 dates three past changes after the story clock.
- Two references each name two records.
- Two deal records contradict each other between sheets.
- Three kit copies depart from the Shell: two disabled buttons drawn live, and the strip handle at full colour.
- TB08 does not follow CA14 as recorded.

Checked: 42 read-only scripts and 36 renders. The scripts scanned about 15,900 texts, every toolbar, strip, tab bar, panel and dialog, and compared the kit copies with their Shell originals node by node. The renders covered 32 Sales sheets in full and one in part, plus CA14. Repository checks: `python3 scripts/build_status.py --check` and `python3 scripts/check_foundation.py`.

Not done or not verified:

- About 80 sheets were not read by eye.
- The Customers, Sites & Equipment file, addendum A3 and the version history were not read.
- Section 16 was checked only where it overlaps.
- Keyboard and touch behaviour cannot be tested in a static file.
- No Figma file, design register, page guide or application code changed.

After the batch session's fixes and a confirmation of those findings only, Dean saves one named version, recommended title "PPO - Sales module (accepted) · alignment batch · checked", which pins sections 14 to 16 and the fixes. The build basis stays "· batch 2 · N13" until then.

<!-- decision-index -->
[PPO - Sales module independent review](../decisions/sales-module-independent-review.md) (PPO-SALES-REVIEW-PROP) section 13 records the independent check of the alignment batch of 14 November 2026: accept after the listed fixes SC-01 to SC-19; it accepts no design and authorises no application code.
