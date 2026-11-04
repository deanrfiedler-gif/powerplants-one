---
document_id: PPO-SV08-NATIVE-DEC
date: 2026-11-01
owner: Dean Fiedler
status: Agent implementation decisions; Claude finding confirmation pending; no owner visual acceptance
versioning: git
---

# Remote diagnosis and escalation implementation

Scope SV-08, SVC-01, SVC-06 and SVC-10. This implements the [accepted design](escalations-figma-design.md) under Dean's direct build instruction and his 1 November override of this task's three-build stop. The source design remains accepted; these are Codex decisions under the standing order, not Dean's acceptance of implementation differences.

## Finding required at opening (D3 and frame 04)

Require a currently permitted native finding and a permitted same-site equipment record. If the finding identifies equipment, the case must use that equipment. D3 says the case always links to both; frame 04 instead shows no finding yet. Prefer D3's explicit rule: Findings projects native inspection, incident, completion, response and scheduling evidence. Creating a source-free finding here would invent a new source and closure authority. Replies therefore record the existing finding's owned next action; the case never closes that finding. The frame-04 unlinked state is unavailable and its action becomes Record next action. Reverse by defining and independently testing a standalone native finding source in a later change.

## Existing stack and transaction boundaries

Reuse PostgreSQL, the identity registry/number allocator, scoped permissions, strict native commands, operation receipts/audit, existing Activities and the existing HTML-to-PDF renderer. This needs no package, service or external integration. An isolated in-memory case store would lose restart and concurrent-command guarantees; a separate messaging service would contradict D6. All commands recheck current scope before receipt replay and persist business facts, owned work, audit and receipts atomically. New case references use SYN-ESC numbering; issued references remain unchanged.

## Evidence and correspondence

Configuration is captured from the equipment record as an immutable read-only snapshot, with provenance and hash. The evidence renderer uses an explicit technical field allowlist; contacts, prices, arbitrary source objects and internal correspondence are excluded. Each pack revision retains its exact HTML/PDF bytes and hashes. Review binds the exact version/hash; newer diagnostic or configuration evidence invalidates current readiness. Record as sent records a named person's already-completed action and never invokes a channel, mailbox, portal or sending worker. Manufacturer routes are maintained from equipment manufacturer records; missing values block readiness rather than being invented. Warranty dates are equipment facts, not coverage decisions.

## Owned work and limits

A reply-expected instant creates owned chase work in My Work with a currently authorised return link to the case. The case owns its owner/date, so the generic Activity editor cannot change them. The Activity owner retains native start/complete/cancel duties. A case recorder may resolve an outstanding chase when recording the reply or withdrawal; this source-driven cancellation is audited in the same operation. Receiving a reply resolves that reminder without completing the finding's technical work. Grower approval remains a prerequisite outside PPO for settings changes; the case cannot write controller settings. Withdrawing and closing retain all evidence and require a reason/outcome. No synthetic state constitutes a production escalation process, owner acceptance or deployment.

## Review fixes — agent decisions under the standing order, 4 November 2026

Keep the original case/chase owner immutable. If that owner loses access, a currently authorised coordinator with case, native-source, Equipment-read, Activity-edit and Service-work-order-edit duties in the case scope may record the reply or withdraw. Only the outstanding chase is cancelled; its original owner and the actor's linked audit remain. This bounded source resolution does not reassign work or bypass native next-action authority.

Refuse Relocate and CorrectLocation across sites while the equipment has a nonterminal escalation case. The stated remedy is to close or withdraw the case first; moving it would break its original finding/site evidence. Same-site changes remain available.

Maintaining a manufacturer support route also requires Equipment edit (`shared.edit`) because it advances the Asset version. Recording a native next action requires Findings' Service-work-order-edit and Activity-edit duties before replay. Sending time must be at or after the retained pack's creation time; reject earlier facts rather than rewrite the entered time.
