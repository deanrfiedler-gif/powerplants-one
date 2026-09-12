# CRM Sales rail and board interaction

**12 September 2026 · PPO-009 / CRM-01–04/08 · Proposed, not accepted**

This records a navigation and board-interaction change that was authored outside a
checkout, carried as `board-refinements.patch` / `board-fixes.patch`, and initially
pushed onto the branch for pull request #122 alongside an unrelated five-stage
review fixture. #122 has been reduced to that fixture. The change is raised here on
its own so it can be reviewed as what it is: a shell and interaction change, not
presentation evidence.

Nothing here is accepted. The suites have been re-baselined so the change is
reviewable against a passing build, which is not the same as agreement that the
new baseline is correct. Sections 3 and 6 list what needs a decision from Dean.

## 1. What changes

**The rail becomes the Sales section.** It previously carried seven department
entries — Sales / CRM, Estimating & Quotation, Engineering, Projects, Service,
Supply Chain, Finance. It now carries eight Sales entries: Pulse, Leads, Deals,
Inbox, Activities, Contacts, Products, Insights. Pulse, Products and Insights have
no destination and render as planned. The six departments move to an **Other
modules** group in the More panel; nothing becomes unreachable.

**Module names follow the rail.** `moduleFor` now reports Leads for `/crm/leads`,
Deals for other `/crm/` paths, Inbox for `/email` and Activities for `/calendar`.
The Leads/Deals tab row under the CRM header is removed, because Leads is a rail
entry rather than a tab.

**A drop is the instruction.** Dragging a card to another column previously opened
a stage picker. It now issues the stage command directly — the same endpoint,
operation id and `expected_version` check the dialog used — places the card in the
target column immediately, and shows that command's own status rather than assuming
success. Undo issues a real reverse command, not a local revert.

**The activity strip opens a snapshot.** It was a link to `/work/{id}`; it is now a
button opening an activity snapshot dialog, matching the deal snapshot, with
**Open full activity** to the same destination. The card's missing-information
warning becomes its own link to the activity form rather than an icon inside the
title.

## 2. Why

The department rail treated CRM as one of seven equals, which does not match how
the work is actually done: a salesperson lives in Leads, Deals, Inbox and
Activities all day and visits Projects or Finance occasionally. Promoting the
Sales section and demoting departments to More reflects that, and leaves room for
the sections other roles will need later.

The stage picker on drop asked the user to confirm an instruction they had already
given by dragging. Removing it does not weaken the control: the same server
validation, version check and operation id apply, and the save status is shown
rather than assumed.

## 3. What this does not decide

- **Whether the Sales rail is the right rail.** It is currently the only section.
  How a Service or Finance user reaches their own section is unresolved, and a
  per-role or switchable rail is not proposed here.
- **Pulse, Products and Insights.** Three of eight entries have no destination and
  no specification. They may be premature.
- **Contacts.** The rail entry now points at `/people`, matching
  `moduleFor("/people")`. It arrived pointing at `/customers`, which reports the
  Customers module and so never highlighted. Whether the Sales rail's Contacts
  should mean people, organisations or both is open.
- **Inbox and Activities in the More panel.** The More panel still lists a single
  **Email & Calendar** entry, so it does not highlight when the rail reports Inbox
  or Activities. Splitting it would change the demo suite's expectations and is
  left until the naming above is settled.
- **The stage model.** This changes presentation and the save path only. The
  database still supplies Enquiry and Qualified. The five-stage proposal remains a
  separate contract and migration question.

## 4. Corrections made while preparing this branch

Three defects were found and fixed here rather than carried into review.

**The scoped opportunity search had been deleted.** `SalesWorklist` lost the
"Search opportunities" control and its `HeaderContent` slot, while `filters.q`
remained in the query string with nothing able to set it. The control is restored
in both the desktop toolbar and the phone header slot. This was patch-application
loss, not a design choice; `scripts/crm-restart-proof.ts` and five browser suites
depend on it.

**Quick-add context was broken by the renames.** `src/shell/model.ts` still tagged
the Lead and Opportunity actions `module: "CRM Sales"` while `moduleFor` reported
Leads and Deals, so neither action showed *In this module* or sorted first on its
own page. The action modules are now Leads and Deals, and the two component
fixtures follow. The navigation `items` entry is renamed Deals for the same reason,
which also restores the mobile module dialog's current-page highlight.

**The eight-entry rail did not fit short viewports.** The shell's approved geometry
requires the rail not to scroll. At 800×500 the ninth control overflowed by about
23px. The compact-height rules are tightened — brand 86→78px, item 44→40px, gap
3→2px at ≤580px, with the ≤690px band adjusted to match — which fits all nine with
room to spare. Icons stay 30px.

## 5. Re-baselined checks

These assertions describe the accepted shell, so changing them is part of the
proposal and not incidental tidying.

- `tests/ui/desktop-shell.spec.ts` — rail icon count 7 → 8, and the hovered label
  list replaced with the eight Sales labels.
- `tests/ui/crm-board.spec.ts` — the activity strip is asserted as a dialog trigger
  rather than an `/work/` link, and the snapshot's **Open full activity** link is
  checked for that destination.
- `tests/browser/crm-i2.spec.ts` — the active rail and module-dialog link is Deals
  on both desktop and mobile, replacing Sales / CRM and CRM Sales.

`src/app/crm-board-polish.css` also regains a two-line minimum on the phone card
title. The redesign relaxed the card body to automatic rows, so a one-line and a
two-line title produced 194px and 215px cards and the uniform-height check failed
at 320px. Desktop was unaffected, because its fixed body and activity heights
already enforce it.

## 6. Verification status

Run against this branch, in the container, with the review fixture built from the
actual components and CSS:

- `npx eslint .` — passes.
- `tsc --noEmit` — passes.
- `npm run test:unit` — 77 of 77 pass.
- `npx playwright test --config=playwright.crm-ui.config.ts` — 24 pass, 6 skipped,
  none failing, across the desktop, phone and narrow-phone projects.

**Not run here:** the database, compiled-application and full browser suites, which
need PostgreSQL and a compiled build. CI is the evidence for those, and its result
is required before this is treated as verified. The drag-to-save path in particular
has had no concurrency, stale-version or lost-response test written for it, and
should not be accepted without one.

No schema, migration, seed, read-contract, permission, transition-policy or
deployment change is included. Stage movement continues to require server
validation, version-conflict handling and durable history.
