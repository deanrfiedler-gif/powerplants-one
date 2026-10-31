# Rule sets: engineer walkthrough

<!-- versioning: git; committed history is authoritative -->

Owner: Dean Fiedler. Status: plan, not yet run. Purpose: check, before any code is written, that an engineer or estimator can understand and use the proposed rule set screens ([ADR-0066](../decisions/ADR-0066-configuration-rule-sets.md)). The result is usability evidence. It is not design acceptance or engineering approval.

## Set-up

- **Who.** One engineer or estimator who knows the screen systems, with Dean observing. A second person reviews afterwards. Dean decided on 26 October 2026 that the participant is the engineering owner for screens once named, and that this walkthrough runs before the Rules studio design is put up for acceptance ([decision](../decisions/rule-sets-real-data-authority.md)).
- **What.** The Figma prototype in "PPO - Design", page "Rules studio · rule sets, derived values & tables · ES-02 · ES-03", played in Present mode. Start from the flows "Rule sets — desktop (proposal)", "Rule sets — draft v4 capabilities (proposal)" and "Rule sets — phone review (proposal)".
- **Limits.** The prototype calculates nothing. Tasks ask the participant to show where they would act and to explain what the screen tells them.
- **Time.** About 45 minutes.
- **Rules for the session.** Think aloud, and don't give hints until a task is abandoned.

## Tasks

| # | Task | Done when the participant |
|---|---|---|
| 1 | Find out why a job gets 21 drive drums. | Opens the Tables tab, finds the Cable drum factor (3 per drive), and links it to 7 drives. |
| 2 | Change the Cable drum factor to 1 per drive and say what changes. | Finds the row and explains that the reference cases show the effect. |
| 3 | Explain why the "Pinion drive, two spans" case fails. | Reads the line differences and the reason, and says whether to accept the new expected values or revert the change. |
| 4 | Decide what to do about a finding that 10 table rows are unused. | Opens Coverage, then accepts it with a reason or opens the table, and says who will see the reason. |
| 5 | Say which motor a job needing 236 Nm gets, and what happens at 520 Nm. | Uses Try a value on Motor selection: row 3 at 236 Nm, and the case stops at 520 Nm. |
| 6 | Make delay units apply only to houses longer than 50 m. | Finds the condition, and picks Total length from the derived values in the field picker. |
| 7 | Explain where installer hours come from. | Reads the minutes breakdown and the half-hour rounding. |
| 8 | Update a table from Excel. | Explains the import review: the refused value, the effect on the cases, and that only the draft changes. |
| 9 | As the reviewer, decide on draft v3. | Reads the 8 changes in plain English, approves or returns, and says that approving does not publish. |

## What to record

For each task, record:

- whether it was completed without help;
- the time taken;
- any wrong turns, with the screen;
- the participant's confidence from 1 to 5;
- their own words.

Finish with three questions:

- What would stop you using this instead of the spreadsheet?
- What is missing?
- Would you rather edit tables here or in Excel?

## Pass mark

- At least 7 of the 9 tasks are completed without help.
- Every change on the reviewer's list is understood from its sentence alone.

Each failure becomes a design change before the Figma proposal is put up for acceptance. Results go in a dated evidence note beside this plan.
