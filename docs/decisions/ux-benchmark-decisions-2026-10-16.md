---
document_id: PPO-UXB-DEC-01
date: 2026-10-16
owner: Dean Fiedler
status: User decision; 17 UX benchmark items adopted as recommended; each still needs its own redraw, lock-in and build; authorises no code, migration, permission or customer contact by itself
source_commit: 034e6ff4b79703754f9c476208dbed3dbbafdeb1
versioning: git
---

# UX benchmark decisions — 16 October 2026

On 16 October 2026 Dean decided the six items in the benchmark's Decision brief. Each was put to him with a recommended answer, and he replied:

> "I am happy to proceed with all six based on your recommendations."

In the same message he confirmed the ERP product the benchmark could not verify:

> "We use MYOB Acumatica - https://www.myob.com/au/erp-software"

This record adopts 17 items: seven recommendations and ten amendment items. The [UX benchmark research direction](ux-benchmark-research-direction.md) sets out how adopted items are recorded; this record follows its section 4. The benchmark's evidence is in the [research record](../design/research/ux-benchmark/README.md). Dean's private review document now shows **Adopt** for each item below.

No parent requirement ID is added, renamed or closed; all 78 remain. Each lock-in names the parent IDs it serves.

## 1. Decisions

| # | Decision put to Dean | Recommended answer, now adopted | Items adopted | Scope IDs and register keys |
|---|---|---|---|---|
| 1 | Adopt a written stale-deal rule | A deal is stale when it has no open next activity, or nothing logged for N days in its stage; Dean sets N per stage. Shown in words, never as an ageing colour or Pipedrive's timer | UXB-03, A16 | `scope:CR-04`, `scope:SH-02`, `route:/sales/opportunities`, `route:/sales/leads`; Deal record 879:44 |
| 2 | Build the My jobs offline state (R7) with drafts that survive app switches, calls and timeouts | Yes: time, materials, forms, photos and notes usable offline, with autosaved drafts | UXB-11, UXB-74, A19 | `scope:FI-01`, `scope:FI-02`, `scope:FI-03`, `system:offline`, `route:/my-jobs`, `route:/my-jobs/[id]`, `route:/offline/index.html` |
| 3 | Extend the activity model to quotes, work orders, job packs and engineering | Yes, with real Activities, so reschedule and complete work the same way everywhere | UXB-02, A08 | `scope:SH-02`, `scope:EC-03`, `route:/work`, `route:/work/actions`, `route:/work/waiting`, `route:/sales/tasks` |
| 4 | Accept the field-readiness proposal | Yes, with the parts-readiness ladder; the technician's word stays "Return", not "Decline" | UXB-09, UXB-10, A06, A07 | `scope:SV-05`, `scope:PL-01`, `scope:SC-01`, `route:/service/packs/[id]`, `route:/my-jobs`, `route:/supply/material-readiness`, `route:/projects/[id]`, `route:/service/work-orders/[id]` |
| 5 | Rule on amendments A02, A09, A18, A20 and A23 | Accept all five as worded. For A18, the large record window leaves the identifier column visible, rather than relying on previous and next | A02, A09, A18, A20, A23 | Shell v2 secondary menu; Quotations 123:40; the large record window (Intake & workload Amendment A1); Template management (DK-06) |
| 6 | Settle customer communications (D-025) and approve research with people | Email and SMS first, drafted from PPO records and sent by a named person; commission the delivery architecture decision record; approve the staff task tests and the grower interviews | UXB-92 | `scope:CP-01`, `scope:EC-04`, `scope:CX-03`; D-025 |

**Fact confirmed.** Powerplants runs **MYOB Acumatica**. The master blueprint, the naming standard (PPO-STD-001) and the MYOB integration handbook already assumed it; the benchmark's evidence on Acumatica's interfaces now applies. It shapes the MYOB read decision behind UXB-29 and UXB-76. MYOB remains the ERP authority.

## 2. What each decision settles, and what stays open

1. **Stale-deal rule.** This settles the My Work next-activity question (Q2) as the same rule. The per-stage limits drawn in exemplar E2 (21, 14, 10, 14 and 7 days) are examples, not adopted values; **Dean still sets N for each stage**. A planned activity does not pause the "nothing logged" clause, as the recommendation is worded.
2. **Offline and drafts.** This is the build decision for the accepted My jobs R7 design (`my-jobs-figma-design.md`) and its backend changes. The first release's list of online-only actions is drafted in exemplar E8 and confirmed at lock-in.
3. **Activity model.** Real Activities on quotes, work orders, job packs and engineering add schema. The build carries the full migration-registry ripple in `AGENTS.md`.
4. **Field readiness.** The [field-readiness proposal](field-readiness-gate-proposal.md) is accepted: its recommendations R1 to R11 and its recommended answers to Q1 to Q7. Its Figma frames (Job pack 958:9304; My jobs 959:243132) still need Dean's named version before lock-in. UXB-10's ladder reads the SC-01 material-readiness workspace, which needs SC-05 Q1 (the per-item read) and live reservations before it can be real.
5. **Amendments.** Each adopted amendment is recorded as an amendment in the accepted design's own decision record, with a named Figma version under [ADR-0053](ADR-0053-figma-page-design.md):

   | Item | Accepted design to amend |
   |---|---|
   | A02 | Shell v2 secondary menu: Pinned views in every module menu |
   | A06 | [Job pack](job-pack-figma-design.md): accept or Return with a reason that tasks the preparer; Parts criterion; "not opened" marker |
   | A07 | [My jobs](my-jobs-figma-design.md): accept or Return on the phone |
   | A08 | [My Work](my-work-page-design.md): reschedule presets, other modules' activities, volume budget, role cues |
   | A09, A20 | [Quotations](quotations-design.md): validity and expiry, follow-up date, a tax code per line, link plus PDF, owner notice on response |
   | A16 | [Deal record](deal-record-page-design.md): the written stale rule |
   | A18 | [Intake & workload](intake-workload-design.md) Amendment A1 large record window: the identifier column stays visible |
   | A19 | [My jobs](my-jobs-figma-design.md): autosaved drafts |
   | A23 | [Template management](template-management-figma-design.md): preview against a real record before publication, and an announcement to users |

6. **Customer communications.** This sets D-025's direction; **D-025 stays Open** until its detail is decided.
   - The decision that a named person sends every customer message changes the [D-025 paper](customer-communications-d025.md)'s C2, which proposed that dispatch, delay and visit notices (M1 to M3) send automatically.
   - Email and SMS are both first-class channels. [ADR-0058](ADR-0058-outbound-customer-email.md) covers email; an SMS delivery record is still to be written.
   - The paper's C1 and C3 to C8, and its questions Q1 to Q3 (freight booking, the Smartsheet customer update register, the sending mailbox), remain for Dean.
   - The staff task tests and grower interviews are approved in principle. Facilitator, headcounts, consent and the people to approach follow the private research kit. This record makes no contact with anyone.

## 3. Not decided here

- **UXB-20** (the quote follow-up queue) is no longer blocked by UXB-02, A09 or A20, but is not itself adopted here. Its follow-up view forms part of Quotations amendment A1, accepted separately on 16 October and recorded by its own lock-in.
- **UXB-05, UXB-06 and UXB-73** are unblocked by A02, A18 and A23, but are not adopted here.
- **UXB-84, UXB-89, UXB-15** and the other items D-025 holds up stay Proposed.
- The shell top bar amendment (shorter breadcrumb and centred global search) and Quotations amendment A1 were accepted on 16 October through their own named versions; their lock-in pull requests record them.

## 4. What this record authorises

- Setting `status` and `decision_record` for the 17 items in the [recommendations](../design/research/ux-benchmark/recommendations.csv) and [amendment items](../design/research/ux-benchmark/amendment-items.csv) registers.
- Recording the field-readiness acceptance on its proposal record, and D-025's direction on its paper.
- Planning the redraws, lock-ins and builds listed above.

Each build follows `AGENTS.md` in its own reviewable pull request, with design-register updates, the migration ripple where schema changes, and delivery, owner visual review and business acceptance kept separate. Nothing here sends a customer message, changes a permission or writes to MYOB.
