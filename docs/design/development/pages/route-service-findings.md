# Findings and follow-up — native page

<!-- versioning: git; committed history is authoritative -->

Scope: `scope:SV-07`. Route: `/service/findings`. Page type: register with large snapshot; one scrolling record on phone.

[Scope contract](scope-sv-07.md) is the authoritative desktop/mobile contract, reused controls, handovers and accepted-image map. [Native read and next-action contract](../../../contracts/service-findings.md) owns data and authority. [Accepted design](../../../decisions/findings-figma-design.md) owns D1–D8 and Q1–Q4. Review status: Needs review; no acceptance fingerprint copied.

## Desktop

Use the shared register and Service review menu at 1440 and 1024 px. The [SV-07 scope contract](scope-sv-07.md) owns all columns, view definitions, snapshot layout, accepted capture references and build differences. Horizontal scrolling retains all ten columns. Counts name the authorised candidate window and read time.

## Mobile

At 390 and 320 px, use the phone list and one scrolling finding with source identity, remaining work, closure rule, next action, recurrence and source links. Preserve the unsaved/uncertain-save guard when changing records or views. The [scope contract](scope-sv-07.md) owns phone guidance and visual comparison status.

## Proof and handovers

Synthetic browser states live in `tests/helpers/findings-fixture.ts` and are exercised by `tests/browser/service-findings.spec.ts`. Native reads and saves retain their database/HTTP proof. Source presence, functional proof, visual review, owner acceptance and deployment are separate. Remote diagnosis remains outstanding for SV-08.
