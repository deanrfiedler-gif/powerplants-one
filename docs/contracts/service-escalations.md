# Synthetic escalation case contract — SV-08

Owner: Dean Fiedler. Implementation decisions: Codex, 1 November 2026. Independent review pending. This contract defines synthetic application behaviour, not a production escalation process.

Sources: [accepted design D1–D7 and Q1–Q4](../decisions/escalations-figma-design.md), [agent decisions](../decisions/service-escalations-native.md), SVC-01, SVC-06 and SVC-10. Source findings retain all existing parent IDs and closure authority.

## Record and authority

An EscalationCase has a stable UUID, its own SYN-ESC-000nnn number, workspace/company/site/equipment context, mandatory native finding, owner, fault, fault type, version and append-only history. Existing issued numbers are never rewritten. Opening requires an active permitted finding and same-site permitted equipment; equipment identified by the finding must match. The case does not create a new source-free finding.

`service_escalation.record` is required for opening, reading, downloads, recording facts and receipt recovery. Native source and equipment visibility are checked as well. Seed 124 derives existing Activity scopes for the local coordinator and assigned senior technician only; it creates no users and never revives an expired grant. A named owner must be active, able to read the source and equipment, and hold case and Activity duties. All mutations recheck current authority before receipt replay, lock the workspace, check expected versions and commit facts, audit, Activities, outbox facts and receipts together. Those outbox facts send no message.

## Lifecycle

| State | Permitted duties | Transition |
| --- | --- | --- |
| Diagnosing | Record attempts/results, reviewed photos, configuration snapshot, prepare/review pack, record actual sending | Waiting on manufacturer |
| Waiting on manufacturer | Record received reply and attachments | Reply to act on |
| Reply to act on | Record the existing finding's owned next action, record a follow-up question, close with outcome | Diagnosing or Closed |
| Any nonterminal state | Withdraw with outcome | Withdrawn |
| Closed or Withdrawn | Read retained facts and files | None |

A fresh diagnostic or configuration snapshot invalidates pack review. Sending requires the latest reviewed pack, matching current evidence/configuration, a maintained manufacturer route, a named eligible sender, actual past sending time and a later reply-expected instant. Recording sends nothing. A reply cannot predate the sending. Reply attachments are retained, never executed or sent. A later sending clears the current-reply pointer while retaining earlier replies, attachments, sender names and exact sent-pack hashes in History; each reply remains linked to its own sending. Closing requires an owned native next action for the current reply and an outcome; it never completes that Activity or closes the finding. A cancelled or replaced action blocks closing.

## Evidence boundary

The immutable configuration snapshot names its existing Equipment source, revision and canonical SHA-256. It does not write controller settings. The technical pack explicitly projects equipment identity, site name, fault, attempts/results, read-only configuration, permitted submitted inspection readings/instruments/calibration, source finding state and reviewed technical photos. It excludes customer contact fields, prices, arbitrary source objects and correspondence. Recognisable contact/price patterns are rejected or redacted. Free text and photos still require the named person's exclusion review; pattern matching is not an automatic privacy guarantee.

Pack revisions retain exact HTML/PDF bytes and SHA-256 values, evidence projection hash and renderer version. Rendering uses the reviewed local browser with JavaScript and network requests disabled. Review binds both file hashes to the latest evidence. Downloads recheck scope, verify stored bytes, use no-store and attachment headers, and do not expose storage paths. PNG/JPEG photos and PNG/JPEG/PDF reply attachments require byte signatures and exact hashes, with a 2 MiB limit each, at most ten photos and five attachments per reply.

## Handovers

Findings offers Request remote diagnosis only with the case capability. Equipment supplies manufacturer, model, serial, site, warranty end and current configuration. Support routes are maintained per equipment/manufacturer pair; changing manufacturer makes an old route unusable. No manufacturer directory is invented. Warranty end is a fact, not a coverage decision.

Recording sending creates one owned TechnicalFollowUp Activity due at reply-expected time. Generic Activity editing cannot change its owner/date; the case owns those values. The owner can start/complete/cancel native work. Recording a reply or withdrawing resolves an outstanding chase with an audited source cancellation. The case's native next action uses Findings' versioned source token and Activity mutation. Settings advice records grower approval as required, not as granted.

## Reads and recovery

The register exposes authorised case rows, owner/manufacturer filters, read time and an explicit latest-1,000-candidate bound. Closed includes withdrawn cases. Failure or denied access hides rows and counts. Stable operation IDs recover uncertain commands without duplicate facts. Version conflicts preserve user entries until an explicit comparison/retry. Guidance and tab inspection preserve unsaved entries. No external sending, controller integration, customer communication or production deployment is provided.

## Verification

Unit: `tests/unit/service-escalations.test.ts`. Database: `tests/database/service-escalations.test.ts` plus populated historical upgrade and exact-grant suites. HTTP and browser proof, visual comparison, owner acceptance and deployment are recorded separately in the dated status fragment. Pending proof must not be represented as passed.
