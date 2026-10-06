# Scheduling policy impact review — design reference

Stable entry: `route:/schedule/policy-impact`. Parent scope: **PL-04**, unchanged. Owner: Dean Fiedler. **Draft for visual review**.

## Native workflow and conformance

r20 page type: **Review / comparison** within the existing rescheduling scope. This is a proposed native composition; no matching issued mockup or image exists. The [Scheduling r01 HTML](../../../reference/ui/service/PPO-Scheduling-and-Appointments-Workspace-r01.html) provides module context, not an accepted policy-editor baseline. Issued references remain unchanged.

Read the immutable published policy, enter an explicit future effective local time/timezone and whole maximum visit minutes, optionally restrict the site, and compare. Source terms and expiry stay fixed. Results show permitted comparison count, review reasons, service owner, exact dates and booking versions. Zero results are not publication or dispatch approval. More than 200 candidates is a refusal; no silent truncation.

## Desktop

Use the existing shell, SchedulingNavigation, semantic scheduling styles, PageHeader, Field, SelectField, Button, ReadState, ErrorNotice and Stamp. Published context precedes the form, result summary and responsive review cards. Keep one shell scroll owner at 1440 × 900 and 1024 × 900. Provenance is in a disclosure with wrapping hashes; it must not force horizontal page scroll.

## Mobile

Stack form fields and review cards at 390 and 320 CSS px. Preserve full labels, site/timezone context and exact booking links. Native local date/time controls keep their labels; ambiguous clock-change times are refused explicitly. Enter submits comparison, Tab traverses controls and native focus remains visible. Phone emulation is not physical-device or native 200% zoom acceptance.

## States and handovers

Input changes, refresh and identity changes clear prior analysis. Loading, unavailable and denied reads never retain a successful count or previous booking evidence. Server errors retain current inputs for correction. Temporary comparison and its refresh remain GETs only. The separate saved workflow uses guarded online API-C26 commands; it is never an offline queue.

Incoming: PL scheduling date/site context and current read permissions. Outgoing: exact appointment at `/schedule/changes`, with date/timezone and appointment identity. The proposed rule is not handed to a booking command or persisted in the page address. Current controlled booking authority remains separate.

## Evidence and boundaries

[Architecture and limits](../../../decisions/scheduling-policy-impact-review.md). [Executed checks and remaining obligations](../../../delivery/scheduling-policy-impact-handover.md). Runtime captures, where recorded there, are implementation evidence rather than mockups. Owner paired review, physical-device, assistive-technology and broader programme acceptance remain open. No fingerprint is adopted.

## Scheduling Step 4 integration

Preserve this entry's scope ID and page type. Reuse shared fields, Button, ReadState/ErrorNotice and existing appointment/planner controls. Incoming handovers: exact published selection, immutable impact, retained booking pin and owned Activity. Outgoing handovers: controlled appointment/resolution receipt and refreshed readiness; customer, pack, Finance and issued documents retain their separate authority.

Desktop must show the impact reason, responsible owner, source publication and permitted next action. Booking preparation follows the proposed interval and publication head, including future policies; stale saves retain entries and need fresh review. Completing an Activity or acknowledging a pack cannot clear the policy hold. Later source changes restore it. The appointment's online resolution disclosure requires controlled change/cancellation/replacement and fresh evaluation. Uncertain responses retry the original unchanged.

At 390/320 px, stack fields/actions, wrap exact identifiers and keep hold/recovery text readable without horizontal overflow. Retain keyboard alternatives to drag and native disclosure/label semantics. Delayed offline Start is rechecked on reconnect and may remain ReviewRequired with original evidence retained. Publication and resolution are online only. No Step 4 issued mockup is available; the existing retained HTML remains the source reference. Additional content is a proposed visual departure pending owner review. Functional evidence: `docs/testing/evidence/scheduling-policy-enforcement/README.md`; captures and source checks do not grant visual/device/owner acceptance.

## Step 5 proposed native composition

Canonical route and scope remain unchanged: `/schedule/policy-impact`, PL-04, **Review / comparison**, padded Scheduling workspace with the shared shell as the single content scroll owner. Query selectors `proposal`, `review` and `publication` open immutable records on the same route; they add no new page classification. Reuse `PolicyPublicationWorkspace`, Field/SelectField, ValidationFields/ErrorNotice, Button, ReadState, Stamp, the existing online command journal and shared identity boundaries. No new UI framework or editor baseline is adopted.

The saved workflow precedes the retained temporary comparison. Dedicated reviewer/publisher duties see paged saved-record discovery, current exact head/source/fixed terms, labelled unsaved inputs, immutable proposal/successor, complete review and explicit publication consequences. Ordinary permitted users retain comparison and owned hold handovers. The native local identity selector exposes the existing fictional duties without new grants or hosted roles.

Review shows exact proposal/source/hash binding, review time, complete candidate/compliant/affected counts, every evaluated booking/reason/owner, exclusions and seven checks. Current display labels remain separate from frozen identities. A filtered preview or zero result is never promoted to review. More than 200 candidates refuses without truncation. Published evidence retains exact receipt identity and publisher-authorised receipt content; typed Activity IDs are separate from outbox task IDs.

Saved headings receive focus on opening; editing a successor focuses its unsaved form heading. Validation is linked to labelled fields. An uncertain response freezes the original action, retains its exact envelope and offers receipt lookup or explicit unchanged retry. Reload first reads the receipt. It never silently publishes or substitutes new evidence. Loading, denied, failed and identity-lock states discard protected display/in-flight results; correctable form input survives definitive validation refusal.

At 1440/1024 px keep source, action, review and publication sections in reading order. At 390/320 px stack all controls/cards, wrap UUIDs/hashes/receipt JSON and actions, and preserve the shell scroll owner. No fixed-height internal review scroller is introduced. Incoming: current complete source authority, immutable records and Scheduling context. Outgoing: exact saved proposal/review/publication links and existing appointment/Activity handovers. Step 4 appointment resolution exclusively owns clearing a hold; publication, acknowledgement and Activity completion do not confer Start authority.

There is **no accepted policy-editor mockup**. Existing HTML and earlier comparison captures are module context only. Step 5 captures in `docs/testing/evidence/scheduling-policy-interface/` are proposed/implementation evidence. Exact inspected capture references and results are recorded with the verification handover; owner, physical-device and accessibility acceptance remain open. No visual fingerprint is adopted.

Inspected Step 5 implementation captures: [review 1440](../../../testing/evidence/scheduling-policy-interface/desktop-review-1440.png), [1024](../../../testing/evidence/scheduling-policy-interface/desktop-review-1024.png), [390](../../../testing/evidence/scheduling-policy-interface/phone-review-390.png), [320](../../../testing/evidence/scheduling-policy-interface/phone-review-320.png); [saved publication desktop](../../../testing/evidence/scheduling-policy-interface/desktop-publication-1024.png) and [phone](../../../testing/evidence/scheduling-policy-interface/phone-publication-320.png). Empty/refusal captures and exact source/log fingerprints are in the [verification record](../../../testing/evidence/scheduling-policy-interface/README.md). These captures do not replace an accepted mockup or confer owner review.

## Step 6 functional evidence

[Integrated execution and release map](../../../testing/evidence/scheduling-step6/README.md) and [owner walkthrough](../../../delivery/scheduling-step6-owner-walkthrough.md) add update/restart/rollback and Service/Finance handovers. Scope, page type, reused components, incoming/outgoing bindings and implementation are unchanged. No new accepted mockup exists; visual/guide/component review remains pending and no fingerprint is adopted.

Step 6 inspected implementation review captures: [1440×1000 desktop](../../../testing/evidence/scheduling-step6/desktop-review.png) and [390×844 phone emulation](../../../testing/evidence/scheduling-step6/phone-review.png). These show the complete saved two-booking review in the existing shell; they do not replace the missing accepted editor mockup.

## Delayed-head successor focus

The saved proposal and current publication head are separate permitted reads. Selecting Edit before the head finishes loading must focus the successor heading when its form mounts. Repeating Edit focuses an already mounted heading; typing must retain field focus. This applies to desktop and phone without changing page type, scope, incoming evidence or outgoing handovers. [Source-specific failure and regression evidence](../../../testing/evidence/scheduling-successor-focus/README.md) does not replace the missing accepted editor mockup or grant owner/device acceptance.

## Saved-record disclosure during reread

Reopen saved records retains explicit open intent when choosing another record type or refreshing the permitted list. Loading still removes protected evidence; current results return into the open native disclosure. Pointer and keyboard close/open remain available. The existing PolicyPublicationWorkspace host and SelectField consumer binding stay on PL-04 with the same incoming reads and outgoing exact saved-record links. Fixture: `tests/scheduling-browser/record-disclosure.spec.ts`; [unchanged-main comparison and execution evidence](../../../testing/evidence/scheduling-record-disclosure/README.md). No accepted editor image or review fingerprint is supplied by this repair.
