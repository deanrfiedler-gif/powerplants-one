---
title: Two new Record parts drawn in PPO - Library
date: 2026-11-12
---

On 12 November 2026 Dean said: "I confirm that you can proceed however you believe is the most professional." Claude took that as the go-ahead for the next agreed work in the private Figma file "PPO - Library": the two parts of audit direction B7, "How this was worked out" and "Changed since you last looked". Both are drawn on the Record page, rules-based, with no AI. The [Record record](../decisions/library-record.md) (PPO-LIBRARY-RECORD-PROP), section 7, holds them.

- **How this was worked out.** The Worked out marker on a fact opens Record / Working: the result, the rule as a sentence, and each input with its source and when it was read.
  - It restates the stored value and never works it out again.
  - A missing input means no result, and the panel says what is needed.
  - A rule that is not an adopted business rule is labelled "Proposed calculation".
- **Changed since you last looked.** Record / Changes strip sits under the record header and lists what someone else changed since the person last opened the record.
  - Each changed fact carries a Changed chip, and Record / History marker draws a line in History above what is new.
  - What a person has seen is their own state; it never alters History.
  - Changes the person may not see are left out and never counted.
- **Parts.** Four new `Status: Proposed` components: Record / Working input, Working, Changes strip and History marker. Record / Fact gained a Changed option.
- **Review board.** A new card 10, "Worked-out values and what changed". The former cards 10 and 11 are now 11 and 12, and card 12 lists the new values and items.
- **To confirm.** Five items, R7 to R11, each drawn as recommended:
  - R7: the panel's name, and that it opens as a 360 px popover or a phone sheet.
  - R8: what an explanation shows and withholds.
  - R9: only changes to facts and state count.
  - R10: when "last opened" moves on.
  - R11: where the markers show.

  Dean's go-ahead covered the drawing; it did not confirm these.
- **Audit record.** Direction B7 is marked drawn ([library audit](../decisions/library-audit.md)).

**Checked:** the four components, the Fact set and card 10 were rendered and inspected. The changed Read me texts, card names, items and component options were read back from the file. A structural read of the Record page found no solid fill or stroke without a variable, no text without a text style, no default layer name and no component without a status line. Repository checks: `python3 scripts/build_status.py --check`, `python3 scripts/check_naming.py`, `python3 scripts/check_foundation.py` and `python3 scripts/check_design_tokens.py`.

**Not done:**
- The phone forms of both parts are stated as rules and not drawn.
- The application stores no per-person "last opened" time for a record. Building one needs its own decision, a migration and tests; none is authorised here.
- The example rules (age in days, margin as a share of the quoted value) are synthetic illustrations, not adopted business rules.
- No prototype links were set, no variable was added, and the variables snapshot is unchanged.
- No page is accepted and the library is not published.
- No application code, binding, register or page guide changed.

Every record shown is synthetic. File links are not recorded here (ADR-0050, ADR-0053).

<!-- decision-index -->
[Record · Details, tabs and history in PPO - Library](../decisions/library-record.md) (PPO-LIBRARY-RECORD-PROP) now records two parts drawn on 12 November 2026 under audit direction B7: how a worked-out value was formed, and what changed on a record since the person last opened it. Five items, R7 to R11, await Dean's confirmation. It authorises no application code, route, migration, permission or deployment; all data is synthetic.
