# DK-03 distribution during a started visit

Owner: Dean Fiedler. Date: 15 October 2026. Backend correction authorised by the continuing backend programme; verification and operational acceptance remain separate.

## Context and decision

The G1 candidate in the [accepted output design](output-issue-figma-design.md) concerns existing DK-03 / DOC-01–DOC-06 / OUT-09 behaviour. On main `41c8479a0aa4ff8eeebec5efb66712c95ecc8874`, the output detail and native pack context recognise `Confirmed` and `InProgress`; distribution's audience check instead names `Started`. The native Field start command saves `InProgress`. Reproduce the resulting disagreement through that command before correcting the audience check.

Retain the existing distribution service, transaction, permissions, exact recipient/issue binding, retained byte verification and original-operation receipts. Align its appointment-state check with the native lifecycle for both preparation and a new simulated send. All other applicability conditions and post-storage authority checks remain in force. Historical non-send/unknown recording and reconciliation retain their existing semantics.

## Architecture and persistence

This is a correction within the existing modular monolith, with no new technology, dependency, persistence or permission. A new appointment alias would contradict the native schema and propagate the defect. A migration or rewritten historical event would change evidence unnecessarily. A new generic applicability abstraction would enlarge a one-condition correction across independently scoped native readers. Select the local state correction, with a connected regression proving the native start transition, exact read and both distribution commands agree.

## Verification and boundaries

Retain the failing unchanged-main reproduction. Verify successful `InProgress` preparation and simulated outcome, original recovery and replay, refused stale schedule/crew/review or terminal states without partial writes, existing isolation/withdrawal/rollback cases, compiled API and actual process/database restart. Preserve historical issue hashes, ledgers, recipients and receipts. No real distribution, UI implementation, operational approval, merge or deployment is implied. Other documented read additions remain separate increments.
