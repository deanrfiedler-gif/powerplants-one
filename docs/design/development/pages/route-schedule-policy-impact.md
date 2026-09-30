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

Input changes, refresh and identity changes clear prior analysis. Loading, unavailable and denied reads never retain a successful count or previous booking evidence. Server errors retain current inputs for correction. Analysis and refresh are GETs only; there is no Save, Publish or offline queue.

Incoming: PL scheduling date/site context and current read permissions. Outgoing: exact appointment at `/schedule/changes`, with date/timezone and appointment identity. The proposed rule is not handed to a booking command or persisted in the page address. Current controlled booking authority remains separate.

## Evidence and boundaries

[Architecture and limits](../../../decisions/scheduling-policy-impact-review.md). [Executed checks and remaining obligations](../../../delivery/scheduling-policy-impact-handover.md). Runtime captures, where recorded there, are implementation evidence rather than mockups. Owner paired review, physical-device, assistive-technology and publication acceptance remain open. No fingerprint is adopted.

## Scheduling Step 4 integration

Preserve this entry's scope ID and page type. Reuse shared fields, Button, ReadState/ErrorNotice and existing appointment/planner controls. Incoming handovers: exact published selection, immutable impact, retained booking pin and owned Activity. Outgoing handovers: controlled appointment/resolution receipt and refreshed readiness; customer, pack, Finance and issued documents retain their separate authority.

Desktop must show the impact reason, responsible owner, source publication and permitted next action. Booking preparation follows the proposed interval and publication head, including future policies; stale saves retain entries and need fresh review. Completing an Activity or acknowledging a pack cannot clear the policy hold. Later source changes restore it. The appointment's online resolution disclosure requires controlled change/cancellation/replacement and fresh evaluation. Uncertain responses retry the original unchanged.

At 390/320 px, stack fields/actions, wrap exact identifiers and keep hold/recovery text readable without horizontal overflow. Retain keyboard alternatives to drag and native disclosure/label semantics. Delayed offline Start is rechecked on reconnect and may remain ReviewRequired with original evidence retained. Publication and resolution are online only. No Step 4 issued mockup is available; the existing retained HTML remains the source reference. Additional content is a proposed visual departure pending owner review. Functional evidence: `docs/testing/evidence/scheduling-policy-enforcement/README.md`; captures and source checks do not grant visual/device/owner acceptance.
