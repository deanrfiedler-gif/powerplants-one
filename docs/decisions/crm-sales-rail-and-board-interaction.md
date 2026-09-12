# CRM Sales rail and board interaction

**12 September 2026 · PPO-009 / CRM-01–04/08 · Proposed, not accepted**

This records a navigation and board-interaction change that was authored outside a
checkout, carried as `board-refinements.patch` / `board-fixes.patch`, and initially
pushed onto the branch for pull request #122 alongside an unrelated five-stage
review fixture. #122 has been reduced to that fixture. The change is raised here on
its own so it can be reviewed as what it is: a shell and interaction change, not
presentation evidence.

Nothing here is accepted. The finding that held this branch back is resolved: the
drag-to-save path both discarded the qualification capture the accepted stage-change
journey requires and was refused by the server for doing so. Section 3 records the
finding and the answer taken. The accepted stage journey is restored in the code, so
the suite that describes it keeps its drag assertions unchanged; every assertion that
was re-baselined is listed in section 6, and each is naming or presentation.

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

**A drop is the instruction, unless the transition carries evidence.** Dragging a
card to another column previously always opened a stage picker, to confirm an
instruction the actor had already given by dragging. It now issues the stage command
directly — the same endpoint, operation id and `expected_version` check the dialog
used — places the card in the target column immediately, and shows that command's own
status rather than assuming success. A drop into a stage whose transition carries
evidence the server requires still opens the dialog, pre-selected on that target
stage, so the qualification outcome is captured. Section 3 records why. Undo issues a
real reverse command where it can, and reopens the dialog where the evidence has to
come from the actor.

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

## 3. Resolved: the drop discarded the qualification capture, and the server refused it

`tests/browser/crm-refinements.spec.ts` encodes the accepted stage-change journey.
Dragging a card to Qualified opens the **Change deal stage** dialog, the actor
supplies a **Qualification outcome**, and only then is the stage saved. Undo goes
back through the same dialog.

The drag-to-save path sent `qualification_note: null` with
`reason: "Move on the board"` and no dialog at all. That was recorded here as a
transition-policy change needing a decision. On inspection it is also a defect.
`parseDealStage` in `src/crm/refinement-validation.ts` reads the qualification
outcome with `narrative()`, which rejects `null`:

```ts
qualification_note:
  stage_id === "Qualified"
    ? narrative(r.qualification_note, "qualification_note", 2000)
    : null,
```

So a drop into Qualified could not have succeeded. The server refuses it as a
validation error, and the optimistic placement leaves the card in a column the
server never accepted, with only the status line contradicting it. The same is
true of the reverse leg: an undo back into Qualified sent `null` as well.

That collapses the three answers this section previously offered. Options 2 and 3
both require changing `parseDealStage`, which is a contract change this branch
states it does not make. Option 1 requires none. It is adopted:

**A drop into a stage the server requires evidence for opens the dialog on that
target stage; every other drop saves directly.** The confirmation the actor had
already given by dragging is gone; the business control is not.

What that means in the code:

- `stageRequiresEvidence(stage)` in `src/components/crm-deal-controls.tsx` is the
  single place that names Qualified as the transition carrying required evidence.
  The dialog's own payload and its conditional fields now read from it, so the
  board cannot drift from the rule the dialog applies.
- A drop into Qualified opens **Change deal stage** with that target pre-selected.
  A drop into Enquiry saves directly, on the same endpoint, operation id and
  `expected_version` check.
- Undo reopens the dialog when the dialog saved the original — it is the only
  caller holding the qualification fields, which `listOpportunities` does not
  return — and when the reverse move itself needs evidence the board cannot
  reproduce. Otherwise it issues a real reverse command.
- A refused or uncertain save now drops the optimistic placement, so a card is
  never left in a column the server has not confirmed. Previously the board also
  discarded the undo target the moment a move was accepted, which made the Undo
  control unreachable after a successful move; it is retained now.

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
proposal and not incidental tidying.

**Changed:**

- `tests/ui/desktop-shell.spec.ts` — rail icon count 7 → 8, and the hovered label
  list replaced with the eight Sales labels.
- `tests/ui/crm-board.spec.ts` — the activity strip is asserted as a dialog trigger
  rather than an `/work/` link, and the snapshot's **Open full activity** link is
  checked for that destination. No control is lost: the full activity is still
  reachable, one action further on.
- `tests/browser/crm-i2.spec.ts` — the rail and module-menu link names at lines 292
  and 310 are now **Deals**, matching `moduleFor`. Line 292 is scoped to the menu
  dialog because the phone's bottom navigation also carries a link named Deals, so
  an unscoped query would match two elements. The activity-strip assertions at
  lines 154 and 337 select `button.crm-card-activity` rather than
  `a.crm-card-activity`; the full 2,000-character preview is still asserted on the
  card, and the `/work/` destination is now asserted on the snapshot's **Open full
  activity** link. Both pieces of evidence are kept.
- `tests/browser/crm-refinements.spec.ts` — the activity strip opens the snapshot
  and the test follows **Open full activity** to `/work/{id}`. **The drag journey
  is unchanged.** Dragging to Qualified still opens **Change deal stage**, still
  requires a **Qualification outcome**, still saves through **Save stage**, and
  Undo still goes back through the dialog. That is the point of section 3: the
  control is restored in the code rather than removed from the test.

`scripts/crm-restart-proof.ts` needs no change: the scoped search it drives is
restored.

`src/app/crm-board-polish.css` also regains a two-line minimum on the phone card
title. The redesign relaxed the card body to automatic rows, so a one-line and a
two-line title produced 194px and 215px cards and the uniform-height check failed
at 320px. Desktop was unaffected, because its fixed body and activity heights
already enforce it.

## 7. Verification status

Run against this branch:

- `npx eslint .` — passes.
- `tsc --noEmit` — passes.
- `npm run test:unit` — 77 of 77 pass.

**Not run against the section 3 change:** the component review suite
(`playwright.crm-ui.config.ts`), the database, compiled-application and full browser
suites. They need a Playwright browser, PostgreSQL and a compiled build. The
component suite passed 24 / 6 skipped / 0 failed before that change, which touches
the board's save path and the worklist's undo state but neither the activity strip
nor the snapshot that suite exercises. CI is the first run of the browser suites
against it, and it is the only place the restored drag journey is actually proven.

The drag-to-save path still has no concurrency, stale-version or lost-response test
written for it. One is required before acceptance. The optimistic placement is now
dropped as soon as the command reports an error, so a card is not left sitting in a
column the server never confirmed — but that behaviour is asserted nowhere.

No schema, migration, seed, read-contract, permission or deployment change is
included. Stage movement continues to require server validation, version-conflict
handling and durable history, and the qualification outcome is captured on every
move into Qualified, whether the actor drags the card or opens the dialog.
