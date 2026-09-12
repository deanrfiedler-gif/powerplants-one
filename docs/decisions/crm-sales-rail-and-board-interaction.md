# CRM Sales rail and board interaction

**12 September 2026 · PPO-009 / CRM-01–04/08 · Proposed, not accepted**

This records a navigation and board-interaction change that was authored outside a
checkout, carried as `board-refinements.patch` / `board-fixes.patch`, and initially
pushed onto the branch for pull request #122 alongside an unrelated five-stage
review fixture. #122 has been reduced to that fixture. The change is raised here on
its own so it can be reviewed as what it is: a shell and interaction change, not
presentation evidence.

Nothing here is accepted, and this branch is **not green**. One finding below is
blocking: the drag-to-save path drops the qualification capture that the accepted
stage-change journey requires. Section 3 states it. The component suite has been
re-baselined; the database-backed suites deliberately have not, because
re-baselining them would write that regression into the acceptance evidence.

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

The stage picker on drop asked the user to confirm an instruction the actor had
already given by dragging. Removing the confirmation is sound; removing it wholesale
is not, because the same dialog was also capturing the qualification outcome.
Section 3 is that problem. The rest of the control is intact: the same server
validation, version check and operation id apply, and the save status is shown
rather than assumed.

## 3. Blocking: the drop discards the qualification capture

`tests/browser/crm-refinements.spec.ts` encodes the accepted stage-change journey.
Dragging a card to Qualified opens the **Change deal stage** dialog, the actor
supplies a **Qualification outcome**, and only then is the stage saved. Undo goes
back through the same dialog.

The drag-to-save path sends `qualification_note: null` with
`reason: "Move on the board"` and no dialog at all. The same endpoint, operation id
and version check apply — that part of the claim holds — but the qualification
outcome is no longer captured on the move that sets Qualified. That is a change to
a business control, not to presentation, and #122 was explicitly described as
relaxing nothing of the kind.

This has to be decided before the branch is finished, and three answers are
defensible:

1. **Keep the dialog for transitions that require evidence, drop it for the rest.**
   A drop into Qualified opens the qualification dialog pre-filled with the target
   stage; a drop between stages that require nothing saves directly. This keeps the
   control and still removes the pointless confirmation. It is the option I would
   take.
2. **Save directly and capture the outcome afterwards,** leaving the opportunity in
   a "qualification outcome needed" state the worklist surfaces. This preserves the
   fast path but introduces a new state, a new read contract and a new exception —
   more work than it looks.
3. **Decide the qualification outcome is not required on a board move.** Defensible
   only with an explicit decision that says so and updates the journey; it must not
   arrive as a side effect of a drag-and-drop change.

Until this is settled, `tests/browser/crm-refinements.spec.ts` and
`tests/browser/crm-i2.spec.ts` are left exactly as they are. They will fail on this
branch. That is the correct result: the suites are describing a control the change
removes, and silencing them would destroy the evidence that it did.

## 4. What this does not decide

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

## 5. Corrections made while preparing this branch

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

## 6. Re-baselined checks

These assertions describe the accepted shell, so changing them is part of the
proposal and not incidental tidying. Only the component suite is changed here.

**Changed:**

- `tests/ui/desktop-shell.spec.ts` — rail icon count 7 → 8, and the hovered label
  list replaced with the eight Sales labels.
- `tests/ui/crm-board.spec.ts` — the activity strip is asserted as a dialog trigger
  rather than an `/work/` link, and the snapshot's **Open full activity** link is
  checked for that destination. No control is lost: the full activity is still
  reachable, one action further on.

**Deliberately not changed,** pending section 3:

- `tests/browser/crm-refinements.spec.ts` — the drag-to-Qualified journey, the
  qualification outcome, Save stage, Undo through the dialog, and the activity
  strip navigating to `/work/{id}`.
- `tests/browser/crm-i2.spec.ts` — `a.crm-card-activity` at lines 154 and 337, which
  assert the strip is a link with an `/work/` href and carry the owner tooltip and
  keyboard checks; and the rail and module-dialog link names at lines 292 and 310,
  which need Deals but are left with the rest of the file so the change lands in
  one reviewable piece.

`scripts/crm-restart-proof.ts` needs no change: the scoped search it drives is
restored.

`src/app/crm-board-polish.css` also regains a two-line minimum on the phone card
title. The redesign relaxed the card body to automatic rows, so a one-line and a
two-line title produced 194px and 215px cards and the uniform-height check failed
at 320px. Desktop was unaffected, because its fixed body and activity heights
already enforce it.

## 7. Verification status

Run against this branch, in the container, with the review fixture built from the
actual components and CSS:

- `npx eslint .` — passes.
- `tsc --noEmit` — passes.
- `npm run test:unit` — 77 of 77 pass.
- `npx playwright test --config=playwright.crm-ui.config.ts` — 24 pass, 6 skipped,
  none failing, across the desktop, phone and narrow-phone projects.

**Not run here:** the database, compiled-application and full browser suites, which
need PostgreSQL and a compiled build. They are **expected to fail** on this branch,
on the assertions listed in section 6 as deliberately unchanged. CI will show that,
and it is the honest result until section 3 is decided.

The drag-to-save path also has no concurrency, stale-version or lost-response test
written for it. One is required before acceptance: the optimistic column placement
means a rejected or lost save leaves the card showing a stage the server never
recorded, and only the status line contradicts it.

No schema, migration, seed, read-contract, permission or deployment change is
included. Stage movement continues to require server validation, version-conflict
handling and durable history. It no longer captures a qualification outcome on a
board move, which is the transition-policy change section 3 asks you to decide.
