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
