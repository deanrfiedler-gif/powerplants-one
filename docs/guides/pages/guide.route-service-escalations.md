---
guide_key: "guide.route-service-escalations"
entry_key: "route:/service/escalations"
title: "Remote diagnosis and escalation"
status: Draft
versioning: git
owner_role: "Prototype content owner: Dean Fiedler"
source_commit: "ccc2251bbba9df266cac9027ddaa9418ab9abc1d"
---

## Purpose and applicability {#purpose}

Use Escalations in Service review to retain synthetic remote diagnosis and manufacturer correspondence. A case links an existing finding and equipment. PPO sends nothing and cannot change controller settings. Service coordinators and senior technicians need the case duty and permission to the source equipment/finding.

## Using this page {#quick-start}

1. In Findings, open the finding and choose Request remote diagnosis, or choose Open case in Escalations and select a permitted finding. Confirm equipment, owner and fault.
2. Record diagnostics already tried, their results and source. Capture the current Equipment configuration read-only. Maintaining a missing manufacturer support route also needs Equipment edit permission.
3. Prepare the evidence pack. Download and inspect both HTML and PDF, including photos and free text. Confirm customer contact details, prices and credentials are left out. Review binds those exact hashes.
4. A named person sends the files from their own mailbox or manufacturer portal. Then choose Record as sent and record the actual sender/time, route, manufacturer's reference and reply-expected date. The sending time cannot precede the pack’s creation. The reply-expected date creates a chase in My Work; recording sends nothing.
5. Record a received reply and any retained attachments. Use Record next action, with Service work-order edit and Activity edit permission, to turn advice into owned work against the existing finding. If settings changes are advised, grower approval is required before any change.
6. Close with an outcome after the current reply has an owned next action, or record a follow-up question to return to Diagnosing. Closing or withdrawing a case never closes its source finding.

## If something is unavailable {#recovery}

Use the Equipment source to correct missing manufacturer/configuration facts. Capture newer configuration and prepare/review a new pack when evidence changes. Missing or denied source context cannot be bypassed by opening an old case link. Failed reads show no trusted rows or counts; retry after resolving access or connectivity.

If the original owner loses access, an authorised Service coordinator with case and Activity duties can record the reply or withdraw; the original owner and action history remain. Close or withdraw open cases before moving their equipment to another site. Refresh keeps the current rows visible while loading; History uses the same action names as the controls.

An unconfirmed save keeps the original entries and operation: retry it unchanged to recover its receipt. A version conflict keeps your entries while you compare the current case; explicitly use that version before retrying. Inspecting tabs or guidance does not discard entries. Verify owner, due date, retained hashes and My Work handover before leaving.

This guide is Draft. Functional proof, visual review, owner acceptance and deployment are separate; synthetic output is not operational authority.
