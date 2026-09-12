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
finding and the answer taken, and section 4 records where the rule goes under the
five-stage model accepted in `crm-pipeline-stage-model.md`, together with one
naming contradiction that record and the supplied containers do not agree on. The
accepted stage journey is restored in the code, so the suite that describes it
keeps its drag assertions unchanged; every assertion that was re-baselined is
listed in section 7, and each is naming or presentation. Section 8 is the
verification, run against a real PostgreSQL database and the real application.

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
Section 3 is that problem and the answer taken. The rest of the control is intact:
the same server validation, version check and operation id apply, and the save
status is shown rather than assumed.

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

Both were then confirmed by execution rather than by reading. `parseDealStage`
exercised directly with the two payloads:

```
REJECT  drop payload      Enquiry -> Qualified    422 InvalidData
ACCEPT  drop payload      Qualified -> Enquiry    note=null
ACCEPT  dialog payload    Enquiry -> Qualified    note="SYN Contact confirmed..."
```

and `tests/browser/crm-refinements.spec.ts:113` run against a real PostgreSQL
database, which failed on the missing **Change deal stage** dialog exactly as the
validator predicted.

**The requirement is also a table constraint, not only a validator.**
`ppo.opportunities` carries:

```sql
CHECK ((stage_id = 'Enquiry'  AND qualification_note IS NULL
                              AND identification_activity_id IS NULL)
    OR (stage_id = 'Qualified' AND qualification_note IS NOT NULL
                              AND length(btrim(qualification_note)) BETWEEN 1 AND 2000
                              AND (primary_person_id IS NOT NULL
                                OR identification_activity_id IS NOT NULL)))
```

On the current model the qualification outcome is therefore a data invariant of the
Qualified stage: relaxing it would mean changing the table, not only the validator.

That collapses the three answers this section previously offered. Options 2 and 3
both require changing `parseDealStage` and the constraint above, which is a contract
and schema change this branch states it does not make. Option 1 requires neither.
It is adopted:

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

## 4. Where this goes under the five-stage model

The rule this branch enforces is correct for the two-stage model it runs against.
It is not the rule the five-stage model needs.
[`crm-pipeline-stage-model.md`](crm-pipeline-stage-model.md) owns the stage set,
its names, its exit conditions and its permitted transitions; this section records
only what the accepted model does to the evidence rule in
`stageRequiresEvidence`, and does not restate or amend it.

That model places qualification in the Leads module: a lead that qualifies becomes
an opportunity and enters the board at the first stage, so everything on the board
is already qualified. The supplied `PPO-Leads-Desktop-Container-r01` shows the same
division — its **Convert to deal** dialog requires a qualification note and refuses
to convert without an organisation, a contact and a next activity, which are the
two gates the server applies today, `narrative()` and
`CRM_IDENTIFICATION_REQUIRED`, relocated to Leads.

That is coherent because **the entry stage is reached by conversion, not by a
drag.** Board movement is then between working stages that carry no evidence of
their own, so `stageRequiresEvidence` returns false for all of them: the direct
save this branch already implements becomes the path for every board move, and the
dialog branch becomes unreachable rather than wrong.

The requirement therefore belongs to the transition **into** the pipeline, not to
any stage on the board. Retiring it is part of the five-stage increment:

1. `convertLead` becomes the gate — organisation, contact, next activity,
   qualification note, as the leads container specifies.
2. `stageRequiresEvidence` returns false for every board stage, and
   `parseDealStage` stops special-casing the qualification transition.
3. The check constraint above is rewritten. Written for two stages, it demands a
   note for `Qualified` and forbids one for `Enquiry`; under five stages it needs a
   clause per stage, with the note set at conversion and carried forward.
4. The deal page's stage track stops being a literal. `crm-screens.tsx:464` maps
   `["Enquiry", "Qualified"]`, so it will show two stages against a five-stage
   board until it reads the stage definitions the board already reads. It is also
   the only keyboard path to a stage change, so it cannot be left behind.

**The trap to avoid.** `stageRequiresEvidence` and `parseDealStage` key off the
literal `"Qualified"`. `ppo.crm_stage_definitions` is a table with a foreign key
from `opportunities`, so the stage set is data and can be extended by inserting
rows; the validation and the check constraint are not, and do not move with it. If
the accepted stage set retains a stage whose identifier is `Qualified`, that
literal survives the migration while meaning something different — the entry
column rather than the qualification event — and every drag *backwards* into it
will silently demand a fresh qualification note, treating a routine correction as
a qualification event. If the entry stage is named otherwise, the same stale
special-case fails loudly instead, because no board stage matches the literal.
Failing loudly is the safer of the two, which is a reason to prefer a first-stage
identifier that is not `Qualified`, independent of the naming argument below.

**Open contradiction — one line from Dean settles it.** The accepted record was
amended on 11 September 2026 at 21:06 (`f71f24a`, "Dean confirmed … rename the
first stage to Discovery") from the stage set accepted 24 minutes earlier
(`ff46cc0`, "Dean accepted Qualified -> Scoping -> Quoting -> Negotiation ->
Closing"). On 12 September 2026 Dean stated the board's five stages as Qualified,
Scoping, Quoting, Negotiation, Closing, and supplied `ppo-deal-pipeline_r13`,
which hard-codes `const STAGES = ['Qualified','Scoping','Quoting','Negotiation',
'Closing']` at line 307 and contains no occurrence of Discovery. The later
statement is Dean's, so it is not treated as superseded; the likelier reading is
that r13 predates the rename and the 12 September message restated the container
rather than reversing the decision. Recommendation: keep Discovery as confirmed
and reissue the container to match, because the rename's stated reason holds — if
qualification is the Leads module's responsibility, a column named Qualified
describes a state every card on the board already holds — and because of the
loud-failure argument above. Nothing else in this section depends on the answer:
the gate moves to lead conversion either way.

## 5. What this does not decide

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
  database still supplies Enquiry and Qualified from `ppo.crm_stage_definitions`.
  Section 4 sets out where the five-stage model takes the evidence rule; the
  migration itself is a separate increment.
- **Whether dragging is an accepted way to change stage.**
  [`crm-pipeline-stage-model.md`](crm-pipeline-stage-model.md) records that
  drag-and-drop stage movement and bulk stage changes "are not proposed and do not
  satisfy the evidence, validation and conflict requirements". Dragging is
  nevertheless implemented and asserted by `tests/browser/crm-refinements.spec.ts`
  and `tests/browser/crm-i2.spec.ts`, and predates this branch, which changes only
  what a drop does. The two statements need reconciling — either the drag path
  gains the accessible alternative, validation and conflict handling that record
  requires, or it is withdrawn — and this branch settles neither. The accessible
  alternative exists but not on the board: the deal detail page renders a
  `crm-stage-track` of real buttons (`src/components/crm-screens.tsx:464`), which
  is how the phone journey changes stage. On the board itself a drop is the only
  path, because the per-card stage menu in `ppo-deal-pipeline_r13` has no
  implementation here.

## 6. Corrections made while preparing this branch

Four defects were found and fixed here rather than carried into review.

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

**Cards in a column stopped matching in height, on desktop as well as phone.** The
card body and activity strip moved to automatic rows, so a one-line and a two-line
title or action text no longer produced the same card. Phone cards came out 194px
and 215px. Desktop was **not** unaffected, as first recorded here: running
`crm-i2.spec.ts:326` against a real database showed a 20.25px spread, exactly one
line at 15px/1.35. Both boards assert equal heights — the component suite to the
pixel, `crm-i2.spec.ts` to within one. Two lines are now reserved for the title and
the action text at both widths, as the fixed row heights did before.

**The eight-entry rail did not fit short viewports.** The shell's approved geometry
requires the rail not to scroll. At 800×500 the ninth control overflowed by about
23px. The compact-height rules are tightened — brand 86→78px, item 44→40px, gap
3→2px at ≤580px, with the ≤690px band adjusted to match — which fits all nine with
room to spare. Icons stay 30px.

## 7. Re-baselined checks

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

The card-height rules in `src/app/crm-board-polish.css` are recorded in section 6.

## 8. Verification status

Run in the container against **PostgreSQL 16.13**, a migrated and seeded synthetic
database and the real application — not only the component fixture.

**Static and unit**

- `npx eslint .` — passes.
- `tsc --noEmit` — passes.
- `npm run test:unit` — 77 of 77 pass.
- `npm run build` — completes.
- `check_foundation`, `check_prototype`, `check_naming` — pass.

**Component review suite** — `playwright.crm-ui.config.ts`: 24 passed, 6 skipped,
0 failed across desktop, phone and narrow-phone, run against the section 3 change.

**Database-backed browser suites**

The whole of `tests/browser` on the desktop project: **75 passed, 0 failed** in
18.1 minutes — every P01–P11 journey, not only CRM.

The five CRM specs on both desktop and mobile — `crm-i2`, `crm-refinements`, `crm`,
`mobile-crm`, `leads`: 37 passed, 1 skipped.

Three failures were found on the way, each observed before being fixed:

| Observed | Cause | Fix |
|---|---|---|
| `crm-refinements.spec.ts:113` — no **Change deal stage** dialog | the drop saved directly and the command was refused | section 3 |
| `crm-i2.spec.ts:326` — card heights differ by 20.25px | automatic card rows, one line of title | section 6 |
| `crm-i2.spec.ts:297` — strict-mode violation on "Deals" | the name appears in both the bottom bar and the module dialog | section 7 |

**Database tests** — `tests/database/crm-refinements.test.ts` and
`tests/database/desktop-shell.test.ts`: 6 of 6 pass.

One local-only failure is **not** a defect in this branch.
`tests/browser/leads.spec.ts:167` expects its created lead to be the only match for
its title, but `leadCreate()` in `tests/helpers/leads.ts` uses the fixed title
`"SYN Greenhouse controls enquiry"`. Repeated runs against a persistent database
accumulate rows — six were present after three runs — and the count assertion then
fails. CI migrates and seeds fresh each run, so it passes there, and it passed here
before the rows accumulated. Worth noting as a test-isolation weakness in that
helper; it is pre-existing and unrelated to this change.

**Not run here:** the compiled-application suite, the P11 journeys under their own
workflows, and the mobile project of the full sweep. CI remains the evidence for
those.

**Still missing, and required before acceptance:** the stage command has no
concurrency, stale-version or lost-response test. The optimistic placement is now
dropped as soon as the command reports an error, so a card is not left in a column
the server never confirmed — but that behaviour is asserted nowhere, and it is
exactly what such a test would cover.

No schema, migration, seed, read-contract, permission or deployment change is
included. Stage movement continues to require server validation, version-conflict
handling and durable history, and the qualification outcome is captured on every
move into Qualified, whether the actor drags the card or opens the dialog.
