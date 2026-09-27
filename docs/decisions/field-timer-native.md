# FI-01 durable work timer and FI-02 offline field extensions

<!-- versioning: git; committed history is authoritative -->

Implementation decision under the authorised FI-01/FI-02 programme. Owner: Dean Fiedler. Review: native implementation and visual review pending; this is not business acceptance.

Execution baseline: main `80b2f418b90a69d267ac2e65682a5b560a8b4356`, tree `5c9ee19d6af6e12b5cb5bf464338aacba9172059`. FI05 merged in PR #316 (`cad98aca42cb233f142029d11601a78d7d4b521e`). Refreshed main includes Supply Chain migration 0049, Scheduling and Estimating changes; no open competing PR was present. This increment allocates 0050. Issued references and all parent requirements remain unchanged.

## Evidence and decision

The live schema has immutable `field_attendances` (actual arrival authority), immutable `field_entries` with correction lineage, a current `field_time_ranges` overlap projection, and report submission/acceptance guards. Time is a closed positive whole-second interval, at most 48 hours. Neither an open Time interval nor updates to the actual arrival record fit those contracts.

Use the existing PostgreSQL/TypeScript modular monolith. A small timer companion stores Running/Paused/Stopped state and append-only transitions against the original attendance; it is not a second time-entry engine. Completed positive stretches become ordinary P07 Time entries inside the same operation transaction. A transaction-scoped extraction of the existing capture mutation retains all its attribution, currentness, report, overlap and follow-up rules; direct Capture/Correct command meaning and hashes remain unchanged. Zero-second transitions keep their event without fabricating time. Current interval totals resolve P07 correction lineage.

The timer companion key is the original attendance UUID; operations/receipts are attributable Appointment commands, with attendance/event/entry IDs in audit details. No business identity type, user, permission, seed or framework is added. The migration is additive; generic runtime grants cover the companion. A SQL report guard also prevents freezing evidence while a timer remains open. Issued sources and old hashes are unchanged. The refreshed main baseline fixes this increment at migration 0050; it has no seed.

Alternatives rejected: mutate attendance (wrong authority); create open/zero P07 Time (violates its contract); maintain independent completed timer totals (duplicate costing truth); client-only clock (not durable); new offline queue/database (breaks P08 ownership/recovery).

## Prototype rules and boundaries

One Running or Paused personal timer per workspace/actor, enforced by a unique partial index and serialized original operations. This reversible prototype rule is not payroll policy. Start/Resume need current exact attendance, assignment, issued pack and capture authority. Pause/Stop retain already observed time as ReviewRequired if source authority changes while capture access remains. Lost assignment/capability refuses all new commands and receipt access. The open original is retained, never silently ended. Service must restore legitimate scope before the owner can resolve that timer; the new-job refusal must explain this without disclosing inaccessible work. This is a deliberate recovery restriction, not automatic stop-work permission.

Break and Travel pause immediately. WaitingForParts, WaitingForAccessOrCustomer, WaitingForApproval, UnsafeToContinue and Other require a note. Their P07 kinds are Waiting (first four) or Other. Start and resumed Labour require the original task/asset attribution. Capture records job-cost evidence only: no payroll, billability, Finance, customer authority, attendance acceptance, report submission or work completion follows.

Times are explicit actual whole-second instants, ordered within the timer and no more than five minutes ahead of the server. Forgotten finish requires an explicit selected finish within 48 hours of the open stretch and a reason. No estimated allowance/crew source exists: display Not established. Optional remaining work uses the existing completion draft, not an invented crew allowance.

Pause/Stop Undo may append a compensating transition within 8 seconds of server acceptance, only if no later transition, report freeze, loss of authority or competing personal timer prevents it. It never erases accepted evidence: adjacent Labour intervals may replace the preview's visually continuous stretch. Undo after Stop resumes from the original stop instant; Undo after Pause reclassifies the still-open pause as resumed Labour from that pause instant. The original event and prior closed Time remain. Offline Undo is excluded until the same temporal authority can be proven; use a later Resume/correction while keeping originals. Exact original-operation retry is always independent of the Undo window.

## Offline integration

Extend the maintained `src/offline` protocol/store/app/server, retain IndexedDB v2 and its owner key. Timer commands use original attendance dependencies and exact downloaded authority. Explicitly cached FI05 review binds its selected source hash/record version/facility/activity and the downloaded appointment; acknowledgements before arrival validate that exact current assignment/issue/schedule rather than bypassing authority or borrowing attendance semantics. A conflict creates no rewritten original. Changed meaning needs a successor under existing recovery rules. Downloads expose last verification, cached/current distinction, queue/photos/failed/retained totals and safe actions. Network availability is a hint only. Inspection offline work follows with FI03 after its server contract is complete.

The live P08 database recovery guard has a bounded factual-command list, unchanged since 0008. Extend that exact list for Timer and FieldReadiness while retaining every original actor/workspace/visit/granted-authority equality. Recovery remains RetainedForReview/ClarificationRequired, with no promotion into ordinary acceptance. StartAttendance and pack-acknowledgement intent remain excluded. Timer receipts bind the Appointment plus exact attendance/event, so offline completion must first send its timer originals and download the resulting P07 entry manifest; it cannot fabricate entry IDs or silently omit newly closed timer intervals. Undo and forgotten-finish resolution use the current online timer. These are deliberate bounded offline constraints.

## Presentation and verification

Accepted timer r05 is unchanged and remains the presentation baseline. Reuse its 43 tokens in `#ppo-work-timer`, record header, desktop controls, 96/64 px clock, three readouts, visit track, time/activity lists, job menu and phone control dock. Existing shell remains the sole global navigation. Actual arrival keeps its existing explicit StartPanel; timer Start only begins attributable costing capture. No simulated Add 15 minutes, cross-job automatic stop/start or fabricated allowances become authority. Record paired source/application captures and deliberate adaptations, not owner acceptance. Run the required baseline app comparison at 1440/1024/820/390, narrow 320 px and actual 200% zoom, plus keyboard/dialog/dock checks.

Required proofs: concurrent originals and tabs, changed operation reuse, stale version/authority/revocation, ordered time/overlap, required pause notes, Undo lineage, correction retention, report freeze, process restart, private offline identity/stale originals/dependencies and lost response, migration registry/upgrade preservation and affected P07/P08/P09/CS/inspection regressions. Executed evidence and outstanding review are maintained in the field programme handover and the field-timer-native evidence record.

## Native integration declaration

| Contract | FI-01 / FI-02 increment |
|---|---|
| Scope and page type | Existing FI-01 Record detail at `/my-jobs/[id]`, supporting Register / worklist at `/my-jobs`; FI-02 Work queue + persistent detail at `/offline/index.html`. No parent requirement or scope ID changes. |
| Shell and scroll | Existing padded business page and document scrolling; the shell alone owns global navigation. The phone timer dock clears the existing 64 px navigation bar. |
| Reuse | Accepted timer r05, shared r22 Button through `src/components/ui/button.tsx`, ReadState/ErrorNotice/Stamp, useCrmCommand original-action recovery, LocalDateTimeField, native labelled dialog and existing P08 storage/queue. |
| Incoming | Current assignment and exact acknowledged issued pack, original actual arrival, original scope/asset and permitted actor/workspace. Cached offline sources retain their downloaded verification time. |
| Outgoing | Closed positive intervals enter the existing P07 correction lineage. Report submission needs a stopped timer; Service review and Finance acceptance retain their separate authorities. |
| Proposed adaptations | Keep explicit actual arrival outside timer Start; display Not established for an unavailable allowance; retain previously accepted intervals on Undo; omit the preview's simulated time and cross-job automatic stop/start; use the host document scroll and existing navigation. These runtime adaptations are reviewable, not a new owner-approved visual baseline. |
| Evidence | `tests/browser/field-timer.spec.ts` independently loads retained r05 and compares the compiled application at 1440/1024/820/390/320 px. Source and shared-control bytes remain unchanged. Owner, physical-device, assistive-technology and actual browser zoom review remain open. |
