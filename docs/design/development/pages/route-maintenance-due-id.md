# Due maintenance detail — native design contract

<!-- versioning: git; committed history is authoritative -->

Stable entry: `route:/maintenance/due/[id]`. Scope: **MA-04**. Owner: Dean Fiedler. Visual/business acceptance: **Pending**. Source baseline: `0f10b7fb46a8ab512e9b019573ece272cf5920b9`.

## Purpose and page type

Disposition the original obligation and receive exact Service evidence. Destination: `/maintenance/due/[id]`. r20 page type: record/evidence workspace. Retain the complete native Service Operations shell; do not adopt historical `/service/agreements` links as route authority.

## Desktop

At 1440 × 960 and 1024 × 768, show module navigation, title/context, server-permitted actions, filters and the source worklist. Registers use two labelled card columns; detail uses shared RecordTabs and separately disclosed evidence/decisions. Long customer/site/source names and immutable identities wrap. Use the shell content pane as the sole vertical scrolling owner; no nested fixed-height record scroller.

## Mobile

At 390 × 844 and 320 CSS px, cards, fields and context stack. Inputs use 16 px text and actions at least 44 px high. Tabs and navigation wrap. Native disclosures keep all required decisions reachable. Test focus visibility, Tab/Shift+Tab, Enter/Space, 200% reflow and guide Escape/focus return; hardware keyboard/phone and assistive-technology acceptance remain separate.

## Controls and exact workflow

Reused components: PageHeader, Field, Button/ButtonLink, Status, ReadState, RecordTabs/RecordPanel, ValidationFields, ErrorNotice and useCrmCommand. MaForm composes source/site/task controls with retained drafts and original-operation recovery. SourceCard discloses immutable evidence.

1. Open an occurrence and compare original due date, revised target, task revision and equipment snapshot.
2. Defer retains original identity; Skip/Cancel requires an owner, reason and source evidence before work is requested.
3. Prepare owned Service request using the exact Covered entitlement for the original due date. It also creates a Draft work order with the plan's tasks and the covered agreement; open the Ticket and work order in Service to triage, add authority evidence, exclusions and the Finance route, and authorise.
4. Receive exact reviewed Service result by mapping every original task to a distinct reviewed scope item. Partial work remains open: Prepare follow-on Service request raises the outstanding tasks with a current Covered entitlement, one follow-on at a time, and its completed result completes the occurrence.

Generation and owned requests create no booking. Requested work cannot be cancelled here. Service controls return visits and actual work.

## Handovers and states

Reviewed plan → occurrence → canonical Service Ticket/Work Order/visit/report → exact Partial or Completed obligation.

Search, State, Order and Page live in the URL; a detail URL identifies selection and `view` identifies the open tab. Counts include only admitted rows from at most 200 source candidates; Partial is explicit. Required states: loading, empty, filtered empty, restricted/read-only, missing record/context, InvalidData, VersionConflict, source review required, saving, uncertain, recovered and accepted receipt. Drafts survive a guide open/close. A newer version never silently rebases a decision; compare it before Use current version after comparison. These workflows are online only.

## Source comparison and proposed departures

Exact source: [PPO-Service-Agreements-and-Maintenance-Workspace-r01.html](../../../reference/ui/maintenance/PPO-Service-Agreements-and-Maintenance-Workspace-r01.html). The retained r01 HTML is unchanged. Page-specific approved desktop/mobile mockup images: **missing**. Application verification captures are evidence, not replacement mockups.

Native adaptations awaiting owner baseline adoption: current shell/tokens and route names; wrapped card register instead of the standalone dense desktop table; PostgreSQL/server commands instead of local storage; explicit exact-source controls instead of fictional default policy; native disclosures for long evidence; original-operation recovery through the existing command hook. No claim of pixel equivalence or owner acceptance.

## Evidence and review

See [implementation handover](../../../delivery/maintenance-warranty-handover.md) and [evidence index](../../../testing/evidence/maintenance-warranty/README.md). Source presence, automated proof, visual inspection, owner/device acceptance and deployment remain separately recorded. No review fingerprint is adopted by generation.

## Prepared work orders and follow-on requests (M1) — 30 October 2026

Proposed addition, built as an agent decision under Dean's standing order of 30 October 2026; not Dean's acceptance (rules M-R2 and M-R4 of PPO-MAINTENANCE-TS02-DEC, proposed in [PR #754](https://github.com/deanrfiedler-gif/powerplants-one/pull/754)). Prepare owned Service request is offered while the occurrence is Open or Deferred, and only to someone who may edit both service requests and work orders. It now also creates a Draft work order; the record links "Open work order {reference}" beside each request the reader may see. When the occurrence is Partial, Prepare follow-on Service request takes a current Covered entitlement and an owner and raises only the outstanding tasks, one follow-on at a time; its request is labelled as a follow-on in the links and in the receiving request choice. Existing tab, disclosure and form patterns are reused. Exact images are missing. Functional evidence: `docs/testing/evidence/maintenance-m1/README.md`; no review fingerprint is changed.
