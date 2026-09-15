---
document_id: PPO-NAM-HO
revision: r01
status: Authored package; verification and publication recorded below
owner: Dean Fiedler — personal prototype owner
date: 2026-09-15
---

# PPO Naming, Communications and SharePoint Design Package

One shared design connects files, folders, email subjects and task messages through confirmed business references. It supplies four written deliverables and one interactive review companion, plus maintained contracts and traceability. The user authorised the complete package; visual acceptance and application/live integration remain separate.

## Deliverables

| Deliverable | Revision | Purpose |
|---|---|---|
| [PPO-STD-001](../standards/naming-conventions.md#24-business-filing-and-communication-assistance) | r04 | Business filing and communication rules; automatic/suggested naming and exceptions |
| [Functional specification](../blueprints/naming-and-communication-assistance.md) | r01 | Connected workflows, actors, validation, state/recovery and receiving data contract |
| [SharePoint configuration](../architecture/sharepoint-information-architecture.md) | r01 | Site/library configuration matrix, fields, permissions, views, source migration and open decisions |
| [Interactive HTML](../blueprints/naming-filing-prototype/index.html) | r01 | Five-view synthetic journey: Filing, Naming review, Communications, Libraries and History |
| [Pilot/acceptance plan](naming-sharepoint-pilot.md) | r01 | N0–N6 scope/dependencies, 22 observable cases, evidence and useful measures |

Supporting [decision](../decisions/naming-communications-sharepoint.md), [derived requirements](../requirements/naming-assistance.csv), [document contract](../contracts/document-issue-distribution.md), [Email & Calendar design](../blueprints/email-calendar-integration.md) and [Microsoft pilot](email-calendar-microsoft-pilot.md) preserve established ownership and read/write boundaries.

## Review the interactive example

Open the HTML in a modern browser. All assets are embedded and the sample makes no network requests. Start with Filing: review the selected work, choose a destination, adjust a sample filename and simulate filing. Continue to Naming review for individual/batch decisions, a retained supplier/CAD source, conflict and uncertain-outcome recovery. Simulate the pre-reviewed report issue, then prepare an email subject and follow-up from Communications. History shows the linked decisions and original names. Libraries explains the proposed configuration; it does not provision SharePoint.

The sample uses Banksia Demonstration Nursery — Synthetic and one work reference, `SYN-PPO-WO-000001`. All success messages explicitly identify simulation. Changes last for the current page session only; Reset sample or reload restores fixtures. Local files, application records, SharePoint and Outlook are untouched. The identity selector demonstrates UI restrictions, not real security.

## Verification and publication

Inspected main: `42383fc2e3a85f6cf9c38c829683b14787578579`. Dedicated branch: `design/naming-communications-sharepoint`. Reconciled onto `dcabfec1b5cde1c2cf220359e6cf1c63408512d6`, preserving the Equipment design and Finance r02 updates. Theme: verified r18 SHA-256 `e55ccbabef40a0b07a95ee5847f99147a8f29e8f7c84f90497df2b4d5e6696ab`.

Design tracking: [issue #187](https://github.com/deanrfiedler-gif/powerplants-one/issues/187). Publication is on the contribution branch through a reviewable pull request.

| Check | Result and exact scope |
|---|---|
| Synthetic naming model and standalone source | 35 checks passed: identity/replay, collisions, missing/stale context, protected originals, partial batches, uncertain outcome reconciliation, issue, subjects, tasks and exact source embedding |
| DOM event wiring | 21 checks passed with jsdom 26.1.0: complete journey, individual/batch review, stale selection, original-name search, reply/native-Outlook controls, history/reset, simulated read-only state and escaped text |
| Parent requirements | All 78 rows and every pre-existing column value preserved; 16 new derived requirements traced without replacing existing child mappings |
| Theme | Exact r18 source hash verified; 39 tokens, 3 font faces and original brand mark embedded; responsive desktop/mobile source authored |
| Repository assurance | Foundation, prototype and naming checks executed; machine-readable results linked below |
| Browser and visual acceptance | **Blocked / not performed.** Browser security policy rejected opening the local HTML. No screenshots, rendered desktop/mobile layout, native dialog/focus trapping, accessibility-tree or physical touch evidence is claimed. DOM emulation is not browser evidence |
| Live application/Microsoft | Not exercised by this standalone design package. No database persistence, provisioning, upload/rename, mailbox draft/send or add-in implementation is claimed |

[Model results](../testing/evidence/naming-assistance/r01/model-checks.json), [DOM results](../testing/evidence/naming-assistance/r01/dom-checks.json) and [verification manifest](../testing/evidence/naming-assistance/r01/verification.json) retain exact checked source hashes and commands. DOM checks use stubbed top-layer APIs; native browser behaviour remains unverified. NA-15 visual acceptance and the unimplemented cases in the pilot plan remain open. Do not treat written acceptance cases or model checks as executed application/provider proof.

## Remaining work and next bounded step

Review the design and workflow with Dean, then implement N1's durable synthetic naming slice under its own bounded issue. N2 starts the separately scoped read-only SharePoint test-library proof after actual identity/resource/owner decisions. Existing read-only Email & Calendar pilot remains unchanged in permissions. Live rename, controlled issue, sends and Outlook-native composition follow their own receiving stages. Staff quick-reference guidance follows reviewed actual behaviour.
