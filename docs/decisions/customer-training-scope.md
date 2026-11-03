---
document_id: PPO-CUSTOMER-TRAINING-SCOPE-DEC
date: 2026-11-01
owner: Dean Fiedler
status: Dean decided the scope on 1 November 2026; the page is not drawn or built, and no training offer, price or Finance rule is set
source_commit: 5e2e7039033411f1156732fae3b4d1d8a6fe794c
versioning: git
---

# Customer training scope (CX-04)

## Decision

Customer training returns to the Figma design list as a training page under `scope:CX-04`. The page leaves out subscriptions. This changes [WS-D1](workshop-settings-preferences-scope.md) for CX-04 only.

Claude explained the five parked options on 1 November 2026. Dean said: "Out of all of those, I think the only one that would be beneficial to the Powerplants One app would the CX-04". Claude then asked two questions, and Dean chose the recommended answer to each:

| # | Question | Dean's answer |
| --- | --- | --- |
| CT-1 | Does Powerplants charge for customer training, or is it included in the work customers already pay for? | "Both (Recommended)" |
| CT-2 | What should "subscription" mean on this page? | "Leave it out (Recommended)" |

- **CT-1.** Each session records whether it is included in a project or service job, or sold separately. Only paid training goes to Finance.
- **CT-2.** The page holds refresher dates for customers who need repeat training, and no subscriptions. Powerplants' own recurring service stays with Service agreements and renewals (`scope:MA-01`, `scope:MA-02`, `scope:MA-05`), so there is no second renewals list.
- **Other options.** CX-01, CX-03, CX-05 and CX-06 stay parked. They remain in the design register as conditional scopes, and nothing is deleted.

## Proposed page content

These are Claude's proposals from the same discussion, to be settled when the page is drawn:

- training offerings, sessions, attendees, materials and attendance records;
- customer training needs, refresher dates and the owner of each commitment;
- needs that come from a handover or from repeated support questions;
- staff agreeing the scope, scheduling the session and recording who attended.

A session never proves competence. Attendance records that someone attended, and nothing more.

## What this does not decide

- No training offer, price, invoice rule or Finance handover kind is set. Paid training needs those before it can be built, and MYOB remains the ERP authority.
- Whether customers see their training in the portal is open.
- The register's CX-04 title and summary still say "subscription coordination". They change in the pull request that draws the page, which follows the CX-02 precedent in [WS-D1's record](workshop-settings-preferences-scope.md).
- This record changes no application code, migration, permission, Figma page or register entry.
