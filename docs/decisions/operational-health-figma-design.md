---
document_id: PPO-AD09-OPERATIONAL-HEALTH-FIGMA-DEC
date: 2026-10-31
owner: Dean Fiedler
status: Owner-accepted design; implementation, scheduled checks, alerts and release records separate
source_commit: 7eb4432baefcf8b098a37726b250a311f21e67dc
versioning: git
---

# Operational health design — owner decision

On 24 October 2026 Dean asked Claude "to design and build the 'Operational health, recovery and release readiness (AD-09)' UI page in Figma as a proposal for my review. Draw the page; do not stop at a written brief." Claude drew it and asked "Do you accept the AD-09 design with the recommended answers?". On 31 October 2026 Dean answered: "Accept as drawn". That answer was offered as accepting the design with Claude's recommendations, including departures D1–D10 and the recommended answers to Q1–Q7.

The same day Dean asked Claude to "Give the pages an audit and polish", to find refinements, new features, ways to be more professional and gaps. Claude corrected the accepted frames, drew the gaps as additions with D11–D16 and Q8–Q10, listed ideas I1–I7, and asked "Do you accept the audit additions with the recommended answers?". Dean answered: "Accept additions". That answer was offered as accepting the additions, D11–D16 and the recommended answers to Q8–Q10. It decides none of the ideas.

Claude drew the page from these sources:
- the existing `/foundation`, `/admin` and `/admin/recovery/[id]` pages, their read models and `src/shell/navigation.ts`;
- [ADR-0006](ADR-0006-p01-local-foundation.md) and [ADR-0007](ADR-0007-p02-shared-foundation.md);
- the hosted demo decisions ([private prototype demo](private-prototype-demo.md), [Azure private demo](azure-private-demo.md), [Azure existing-demo upgrade](azure-existing-demo-upgrade.md), [Azure demo connection](azure-demo-connection.md)) and `scripts/demo-upgrade.ts`;
- `scripts/check_migrations.py`, `db/reservations/` and the [CI performance profiles](ci-performance-profiles.md);
- [ADR-0056](ADR-0056-dependency-update-and-audit-gates.md), the dependency update and audit gates;
- the accepted [Settings hub design](settings-hub-figma-design.md) (AD-02) and [Users and access design](users-and-access-figma-design.md) (AD-01), whose shell and people the page reuses;
- the Figma proposals for Integrations AD-04, Mappings & reconciliation AD-05, Data quality AD-03 and Audit history AD-07.

**Those last four were still proposals when AD-09 was accepted.** AD-09 reuses AD-04's story and its phone list row exactly, and accepting AD-09 accepts none of them. If AD-04 changes before acceptance, AD-09's summary, phone row and handover wording follow it.

Scope:
- `scope:AD-09` "Operational health, recovery and release readiness", destination `/foundation` in the register.
- Parent requirements NFR-02, NFR-05, NFR-06, NFR-09, NFR-11 and NFR-12; none is added or renamed, and none is marked complete.

This is a design decision. It authorises no application code, route, read model, migration, capability, grant, scheduled check, alert, notification, workflow change or deployment. The page never claims production readiness, real uptime or business acceptance, and "Ready for demo upgrade" means only that.

## 1. Decisions and evidence

| Item | Classification | Evidence |
|---|---|---|
| Design AD-09 in Figma | User decision, 24 October 2026 | Dean's request quoted above |
| Departures D1–D10 | Accepted as recommended, 31 October 2026 | "Accept as drawn". Section 4 |
| Q1 Who owns incidents by default | Resolved as recommended | The support rota's systems administrator until a named person takes it. An unowned incident shows first and blocks release reviews |
| Q2 Email alerts through My account channels | Resolved as recommended | Not yet: PPO notifications only while the outbound mailbox is Not configured ([ADR-0058](ADR-0058-outbound-customer-email.md)). Then an opt-in My account channel for incident owners and the rota, for failing checks and unowned incidents only, honouring quiet hours except for unowned Open incidents |
| Q3 Who signs off a demo upgrade | Resolved as recommended | Dean Fiedler as owner. The preparer can't sign off; another person reviews the demo upgrade gate note |
| Q4 Foundation checks on the hosted demo | Resolved as recommended | Never. Hosted health comes from the Overview's checks; a saved link on the hosted demo explains why (S7) |
| Q5 Does a Mitigated incident block a release | Resolved as recommended | No, when a reviewer notes the release didn't cause it. Open and Investigating block (S6) |
| Q6 Backup before a demo upgrade | Resolved as recommended | A manual confirmation by the preparer, citing the automatic backup retention, until the workflow records it. It is a proposed check, not one that exists today |
| Q7 Should PPO read CI results itself | Resolved as recommended | Not yet. The preparer records each evidence link with its time; reading results automatically needs its own ADR |
| Q8 Sign off from a phone | Resolved as recommended | Yes once every check has passed, with the same form: Dean uses the demo from his phone, and sign-off starts nothing. The phone release frames are drawn read-only, with the failed run as their action |
| Q9 Rehearse a restore | Resolved as recommended | Once on a disposable copy before the next upgrade that adds real risk, then recorded in Recovery readiness. Until then it says Not proved. Running it needs its own go-ahead |
| Q10 Does an unverified upgrade block the next review | Resolved as recommended | A warning, not a block, naming the check still waiting |
| Audit and polish | User decision, 31 October 2026 | "Give the pages an audit and polish". Section 4 lists what changed |
| Additions, D11–D16 | Accepted as recommended, 31 October 2026 | "Accept additions" |
| Ideas I1–I7 | Not decided | Section 5 |
| Accept the design | User decision, 31 October 2026 | Quoted above |
| Named Figma version | Not saved yet | Section 7 |
| Building the page | Not decided | Section 5 |

## 2. Design reference

| Reference | Identity |
|---|---|
| Accepted design | Figma file "PPO - Design", private to Dean's Figma team. The file's link is not recorded in this public repository (ADR-0050, ADR-0053) |
| Page | "Operational health · AD-09" `2333:797215`, last under "— Administration —". The page header `2333:797216` holds the conformance declaration; the notes card `2348:805772` is in Flows and notes. File index row `2836:394378` |
| Desktop 1440 | Health overview `2333:797959`; Incidents register `2866:41097`; Incident SYN-INC-000007 `2342:557`; Close with reason `2866:444389`; Exceptions & recovery register `2866:41743`; Recovery item SYN-RPT-000067 `2343:801185`; Recovery readiness `2866:42429`; Release readiness, Not ready `2345:803059`; Sign off `2866:445085`; Ready for demo upgrade `2345:803910`; After the upgrade `2866:445710`; Foundation checks `2346:802674` |
| Tablet 1024 | Health overview `2347:806400` |
| Phone 390 | Overview after the alert `2347:806961`; Incident `2347:807808`; Recovery item `2866:453673`; Release readiness `2866:453889` |
| Phone 320 | Overview after the alert `2347:807227`; Incident `2347:807918`; Recovery item `2866:453781`; Release readiness `2866:454019` |
| States | S1 Loading `2347:809014`; S2 All healthy `2347:809189`; S3 A check failing `2347:809408`; S4 Results stale `2347:809607`; S5 Incident unowned `2347:809796` (phone 390); S6 Release blocked by an open incident `2347:809906`; S7 Local-only checks on the hosted demo `2346:803292` (desktop); S8 No access `2866:454477`; S9 Could not load `2866:454649`; S10 Retry running `2866:454149`; S11 Retry refused, source changed `2866:454259`; S12 Retry failed again `2866:454367` (phone 390) |
| Page parts | None new. Reused: Shell v2, Record / Header, Record / Readiness bar, Record / Section heading, Field, Grid / Header cell, Grid / Cell, Grid / Checkbox cell, Grid / Row actions cell, Grid / Group band, Controls / Form field, Controls / Choice option, Toolbar search, Tag, Button, Tab, Attention row (AD-02), Integrations / Sync list row (phone, an AD-04 proposal part), Shell / Phone header · compact, Tab bar, Quick add |
| Prototype | Flows "AD-09 — desktop" (from the Health overview), "AD-09 — phone" (from the 390 overview) and "AD-09 — phone release" (from the 390 release frame); 101 links, none off the page |
| Story | Synthetic, section 3 |
| Retained captures | [Operational health design r01](../reference/ui/operational-health-design-r01/README.md): 33 icon-free PNGs with hashes, from copies `2875:32516`–`2875:42635` on Captures at y = 684,341 onward |

## 3. Story and conformance

Synthetic, as at Tue 13 Oct 2026, 09:00 AEST, signed in as Taylor Quinn (systems administrator, AD-01). Jordan Kim (independent reviewer, AD-01) reviews the demo upgrade gate. Dean Fiedler signs off. The phone frames are the out-of-hours moment: PPO alerts Taylor at 06:10 that the render queue is slow again, and Taylor acknowledges at 06:18. Later frames: S6 Wed 14 Oct, 10:15; Sign off 10:30; Ready 10:40; After the upgrade 15:10. The Sign off frame is signed in as Dean Fiedler, and so is the phone release frame.

- Outbox: two sends blocked for SYN-RCT-000083 (MYOB refused unit BX; the release transfer is held behind it), owned in Integrations AD-04.
- SYN-INC-000007 "Document rendering slow on hosted demo": Mitigated, owned by Taylor Quinn. Recovery items SYN-RPT-000065 and 000066 were retried and are Durable; SYN-RPT-000067 failed at 08:31 and its safe retry is ready, for SYN-PPO-WO-000040.
- SYN-REL-000004, the next demo upgrade: Not ready, because the database-5 upgrade suite failed (the Products upgrade proof still pins 117). It adds migration 0118 and seed 111. A test-only fix on Wed 09:40 moves the source, so repository checks re-run on it; the gate note stands because the migration and seed didn't change.
- SYN-INC-000006 "Scheduled worker missed two runs": Resolved, closed in the Close with reason frame with the worker's run records as evidence.

Those numbers are the story's, not the repository's. The latest migration was 117 and the latest seed 110 when the page was drawn on 24 October 2026; `main` has since moved to migration 121 with the guard moved to match. The rule the page shows is unchanged.

New synthetic references: SYN-INC-000005–000008, SYN-REL-000003 and 000004, SYN-RPT-000065–000067. No real infrastructure name, address or credential appears on the page.

Conformance:

| Item | Declaration |
|---|---|
| Scope identity | `scope:AD-09`; existing `/foundation`, `/admin` and `/admin/recovery/[id]`; proposed Overview, Incidents, Recovery readiness and Release readiness views under the same Support entry |
| Page type (r20) | Overview / dashboard (Health overview); Record detail (Incident, Recovery item); Review / comparison (Release readiness review); Register / worklist (Foundation checks) |
| Incoming handovers | Integrations AD-04 (connector summary, outbox sends); recovery items from document rendering and the offline field workspace; release evidence links from repository checks; people from Users and access AD-01 |
| Outgoing handovers | Integrations AD-04 (failed sync items); Audit history AD-07 (incident, recovery and release events); each recovery item's source record; My account alert channels (later, Q2); the private demo update workflow, run by Dean and never started by PPO |

What exists today, which is the basis for showing only real checks:
- `/foundation` "Foundation checks" (P02, local only, hidden on hosted): demonstration identity, Check connection, Save draft, Retry the same save, Reload current version, Load shared context, and the browser-storage experiment.
- `/admin` "Exceptions and recovery": owner-only retained field evidence cases, append-only, with no retry. Render jobs have states, append-only attempts, a recovery owner and "Retry with the same identities". Outbox jobs are Ready, Running, Done, Retry, Blocked or Outcome unknown.
- Release checks: `check_migrations.py` (unique, registered, in order, seeds after migrations, reservations); Application assurance, whose database shards run the `*-upgrade` proofs; Compiled application browser and Documentation assurance; the merged-tree check; Azure demo preparation checks (the demo upgrade proof); Dependency audit "Locked npm advisories"; the P11 development and compiled performance profiles; the guard in `scripts/demo-upgrade.ts`; and the manual private demo update workflow (Check, Deploy, Upgrade and deploy).
- Not built: scheduled hosted checks, incidents, alerts, readiness records, sign-off, and a backup step in the upgrade.

## 4. What the design shows

| ID | Departure or rule | Basis |
|---|---|---|
| D1 | Under Support, a new "Operational health" item holds Overview, Incidents, Exceptions & recovery, Release readiness and Foundation checks, so the two accepted Support items become its children. Integrations stays with AD-04 (connector health); AD-09 owns the application and its operations. This settles the difference between AD-01, which maps Integrations & recovery to AD-04 and Foundation checks to AD-09, and AD-02, which lists "Health and recovery (AD-09)" | AD-02 D2; AD-01 handovers; AD-04 nests its views the same way |
| D2 | The Health overview shows application (web, database, worker), queues with waiting, running, failed and oldest age, storage and rendering, the AD-04 summary (read and linked, never re-counted), recent incidents and the next release. Every check shows its last check time and its result in words | NFR-05, NFR-11; the brief |
| D3 | Scheduled hosted checks every 5 minutes, reusing what a deploy already proves (health address, exact image, migration history, runtime role) plus the worker's run record. Results older than 15 minutes show as Stale and never count as healthy (S4) | NFR-11; the deploy workflow's checks |
| D4 | A new incident record with owner, impact in words, timeline notes, linked recovery items and audit events; Open, Investigating, Mitigated, Resolved, Closed with reason. Closing needs a reason and a cause-addressed check with evidence; a closed incident is not reopened. A failing check opens one automatically, owned by the support rota until someone takes it (S3, S5) | NFR-02, NFR-11 |
| D5 | Failed outputs appear as recovery items with an owner and a safe retry that reuses the same identities, after checking the source is current and no attempt is running. Items link to an incident. Field evidence cases stay as AD-04 D9 draws them | Built render recovery; `exception-screens.tsx`; NFR-09 |
| D6 | One release readiness record per candidate, listing only checks that exist, each with evidence link, time and reviewer. The result is "Ready for demo upgrade" or "Not ready" with reasons, never production ready. Open or Investigating incidents block; Mitigated needs a reviewer's note. The owner signs off; the preparer can't; sign-off never starts the workflow. A backup confirmation row is shown as proposed, not as a check | `demo-upgrade.ts` guard and stages; Azure existing-demo upgrade; ADR-0056; CI performance profiles; NFR-06, NFR-12 |
| D7 | Each Foundation check says what it verifies, and all are tagged Local. They stay hidden on the hosted demo, and a saved link there explains why (S7) | `localOnly` in `navigation.ts`; the foundation panel |
| D8 | The owner or the rota is alerted in PPO notifications when a check fails, results go stale or a queue passes its age limit. Acknowledging records it without changing status. The drawn 10-minute render queue limit is a synthetic example, not an operating threshold | NFR-11; ADR-0058 |
| D9 | Phone: compact header "Health", grouped list rows, an alert banner; an incident record with status steps, facts and one 48 px action (Acknowledge alert, Take ownership), the rest under More. 320 keeps the same content | [Phone header amendment](phone-header-amendment.md) P1–P9 |
| D10 | Status is always in words (tags, Slow, Stale, Local). Queue and rendering figures are stated in words, and nothing claims uptime | The brief; the scope page |
| D11 | Evidence belongs to one source. Each check counts only for the release's exact source; a change re-runs repository checks and lapses a sign-off | Demo runbook: "confirm the applicable checks passed for the selected source" |
| D12 | Incidents and Exceptions & recovery get grid registers with group bands across the checkbox and settings columns. Exceptions & recovery keeps the built links (Document preparation, Finance follow-up, Personal saved work), Refresh recovery cases and "up to 100 recent owned cases; not a complete backlog total" | `exception-screens.tsx`; Dean's register preference |
| D13 | Recovery readiness, a sixth Operational health menu item, shows backup and restore evidence, recovery procedures and known limitations. It says Not proved: retention is a setting and no rehearsal is recorded. Objectives stay candidates | The [coverage audit](../reference/ui/module-page-register/PPO-HTML-Page-Coverage-Audit-r03.md)'s AD-09 scope; NFR-06; the demo runbook |
| D14 | The steps themselves: Close with reason (reason, cause addressed, evidence) and Sign off (what you are confirming, note, what happens) | The brief; Q3 |
| D15 | After the upgrade: the workflow's receipt and checks, then the runbook's checks by a person. A scheduled worker run is checked separately. "Verified" means on the demo only | Demo runbook, release steps 4–6 |
| D16 | Recovery item and release readiness on the phone at 390 and 320. States S8 no access, S9 could not load (never read as down), S10 retry running, S11 retry refused because the source changed, S12 retry failed again | Scope page state list; built Stale source and attempt rules |

The audit also corrected the accepted frames without changing their design:
- The avatar showed DF on Taylor Quinn's frames.
- The render queue said 0 failed while SYN-RPT-000067 was Failed, and that item was missing from Needs a person.
- "Everything else is green" overlooked the waiting check.
- The incident's timeline and audit list had no entry for SYN-RPT-000067.
- Open incidents was labelled as an existing check and reviewed by the incident's own owner; it now says it comes with D4 and Jordan Kim reviews it.
- The Ready frame reused Tuesday's evidence after the source changed.
- The Ready frame's main action is now Record the upgrade run.
- S5's hidden action sheet named the wrong incident, and a phone row's age contradicted the 06:12 moment.

The release readiness checklist:

| Check | What it verifies | Exists today |
|---|---|---|
| Migrations in order | `check_migrations.py`: unique, registered, in order; seeds follow their migrations; no open reservation | Yes |
| Upgrade suites | Database shards 1–8, every `*-upgrade` proof, and the demo upgrade proof | Yes |
| Other application suites | The P01–P11 gate, browser, mobile, finance, reports, HTTP and compiled browser | Yes |
| Performance profiles | Development and compiled profiles in the P11 declared load proof | Yes |
| Dependency audit | No high or critical runtime advisory; the full tree only with a recorded exception | Yes |
| Demo upgrade gate | The guard moved to the new migration with a "Reviewed for" note | Yes |
| Workflow check run | The private demo update workflow, operation Check | Yes |
| Open incidents | None Open or Investigating | Proposed with D4, because incidents don't exist yet |
| Backup confirmed | A recent automatic backup exists before the upgrade | Proposed (D6, Q6); today only the reset procedure asks |

## 5. What this does not decide or build

- The Overview, Incidents, Recovery readiness and Release readiness views, their read models, capabilities and records aren't built, and no capability is added to `src/platform/permissions.ts`. Each needs its own go-ahead.
- Scheduled hosted checks and alerts aren't built. Their 5-minute interval, 15-minute staleness and 10-minute queue limit are drawn proposals, not operating policy.
- PPO doesn't run the private demo update workflow, read CI results or change `scripts/demo-upgrade.ts`. A hosted upgrade still follows the [Azure existing-demo upgrade decision](azure-existing-demo-upgrade.md).
- The design doesn't change backup, restore or recovery objectives (NFR-06).
- No restore rehearsal is authorised by Q9 until Dean gives its go-ahead.
- Not drawn: release history, alert thresholds in Settings, the field evidence case (drawn on AD-04), and tablet frames other than the overview.
- Ideas, not decided; each needs Dean's go-ahead:
  - I1: build the review's header from the migration registry (migrations, seeds, grants, testers affected).
  - I2: a 24-hour strip of results in words per check, never an uptime percentage.
  - I3: one alert per incident, with repeats joining the open incident.
  - I4: a tester notice on the demo during an upgrade or open incident.
  - I5: an incident summary drafted by the Assistant for the owner to edit.
  - I6: a follow-up review when closing, creating owned actions.
  - I7: an evidence pack exporting a release's checks, sign-off and receipt.

## 6. Verification

Layout audit of 24 October 2026, by script and screenshots: no frame overlaps and nothing sits outside its section. Re-run on 31 October 2026 after the additions, with the same result. Off-page links are only the shared components' hover states; all 101 navigation links stay on the page. Capture copies: 33 frames, no Font Awesome instance and no prototype link left. The new frames were inspected by eye.

The prototype flows were **not** played in Present mode; their links were traced in code only. Design acceptance is not functional, business or deployment acceptance.

Open for those pages' next change, not changed here:
- AD-01 maps Integrations & recovery to AD-04 and AD-02 lists Health and recovery under AD-09. D1 settles this going forward, but those two records keep their wording.
- The register still gives `/foundation` as AD-09's destination; the Overview's route is for the build to decide.

## 7. Named version

Named Figma version "Operational health — accepted": not saved yet. It waits for Dean, or for his explicit instruction to Claude.
