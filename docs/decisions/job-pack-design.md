# Approved Job Pack design

**Status:** Approved design baseline r02, superseded for new work by the accepted successor r03 (below); application integration remains separate.
**Design revision:** r02 (accepted 10 September 2026) · successor r03 (accepted 12 September 2026)
**Work item:** [#103](https://github.com/deanrfiedler-gif/powerplants-one/issues/103)
**Owner approval:** Dean Fiedler, 10 September 2026
**Scope:** Service / full Job Pack page, SC-06; SVC-03 and SVC-06; OUT-09.
**Inspected main:** `f97148b96429686f94777f9112be777923f8eadd`.

## Decision and exact baseline

Dean approved the audited Job Pack r02 with: “I'm happy with that version. We can lock that into the design of the Powerplants One app.” This records design acceptance. The preceding audit's recommendation to seek design acceptance is superseded by this decision; its unexecuted browser and print checks remain unexecuted.

Use the [approved HTML](../reference/ui/job-pack/powerplants-one-job-pack-r02.html) as the presentation baseline and the [original audit](../reference/ui/job-pack/powerplants-one-job-pack-audit-r02.md) as its refinement and verification record. Both are retained unchanged. The source manifest records their sizes and hashes. The HTML SHA-256 is `fe2ded4a0cd9813c06e666499cc9842691e73c95be9b9e18f2aae9bf59c262fd`.

The HTML's **design r02** is distinct from the fictional job pack's **Draft r01**. Approval of this design neither issues that fictional pack nor approves a technician's work.

## Presentation to preserve

- Internal Service content container with 24 px desktop / 16 px mobile outer padding.
- Roboto with Verdana fallback; navy `#242a37`, green `#62bb46`, pale grey workspace and white bordered panels.
- Compact job identity and customer/site header, restrained labelled statuses and navy primary actions.
- Job pack, Preparation and Revision history views; green active-tab indicator.
- Contents navigation, readable central pack and preparation/issue summary on desktop; responsive arrangements on narrower screens.
- Guided preparation, specific validation, controlled unsaved-print choices and traceable preparation/review events.
- Clear distinction between preparation checks, review, issue, crew acknowledgement, dispatch and work authority.

This extends the accepted Field Technicians direction associated with [PR #97](https://github.com/deanrfiedler-gif/powerplants-one/pull/97). Its job drawer retains Overview, Job pack, Asset history and Field notes. Integration should open this full page from the selected job's Job pack section using the canonical permitted pack identity; it must not create a disconnected duplicate record.

## Nine-section content and entry contract

| Section | Main source / entry responsibility |
|---|---|
| Job and visit details | Linked work order, appointment, customer/site and assigned crew; maintained in their source records. |
| Customer arrangements | Site/contact context plus visit-specific coordinator entries. |
| Authorised scope and limits | Exact approved work-order scope; coordinator briefing supplements that scope. |
| Equipment and configuration | Equipment register and applicable configuration; coordinator verification notes. |
| History and unresolved issues | Selected relevant records, retaining their attribution and distinctions between reports and verified findings. |
| Technical information | Selected exact document revisions; unavailable or superseded references handled explicitly. |
| Parts, tools and readiness | Approved job requirements and coordinator/workshop preparation evidence. |
| Site controls | Applicable approved site requirements and recorded visit-specific confirmation. |
| Completion and escalation | Evidence requirements and escalation instructions prepared before attendance; actual results recorded in the field workflow. |

These sections implement the presentation of [BP-07 section 8](../blueprints/BP-07-service-operations.md#8-readiness-and-job-pack-specification) and [master section 13.2](../blueprints/BP-01-master-blueprint.md#132-minimum-job-pack). Existing requirement IDs, scope approval and source authority are retained.

## Integration boundary

P06 already has a bounded pack implementation. This design decision does not replace its domain model or treat the HTML's in-memory simulation as production code. Apply the accepted presentation to the existing pack workbench using its permitted reads and commands. Preserve the [document contract](../contracts/document-issue-distribution.md), [P06 decision](ADR-0011-p06-controlled-job-packs.md) and [P06 handover](../delivery/p06-handover.md).

The preview's “Review requested” is a presentation of a handover intention, not an adopted replacement for existing pack enums or TR-04. Map it to verified supported behaviour during integration. No six-item client checklist can replace server readiness, exact source/version checks, applicable work controls or per-recipient acknowledgement.

Source references stay permission-filtered and revision-specific. Preparation entries must persist through the app's existing ownership/version rules; the HTML's reload-reset behaviour is confined to its fictional demonstration. Field evidence, report review, Finance, SharePoint and MYOB responsibilities are unchanged.

## Evidence and remaining work

Prior audit evidence: 17 targeted Node VM logic checks passed with controlled DOM stubs; JavaScript syntax, generated section/ID/label structure, embedded-font identity and source padding checks passed. These are not rendered browser, native-dialog, screen-reader or pagination tests.

This adoption changes design references and documentation only. It adds no application, API, database, migration, permission, deployment or notification changes. Actual integration and its rendered desktop/mobile, keyboard/dialog and A4-print checks remain outstanding. User design acceptance is recorded separately from implementation and operational acceptance.

For this documentation adoption, the repository foundation, prototype and naming checks all passed. Foundation assurance verified six reference hashes, all 78 parent requirements and 1,544 local links. Whitespace checking passed for the authored documentation; the preserved HTML font licence and audit retain their original trailing whitespace. These documentation results do not extend the original audit's runtime evidence. Subsequent design changes should record a successor and rationale, preserving these approved bytes.

## Successor r03 — accepted 12 September 2026

Dean accepted design r03 as the successor to r02 (“I accept.”, 12 September 2026) after a rendered audit of the approved r02 and a change record tracing every r03 change to an audit finding. r02 and its original audit remain byte-identical at their paths; the manifest records both hashes.

| | |
|---|---|
| Successor HTML | [`powerplants-one-job-pack-r03.html`](../reference/ui/job-pack/powerplants-one-job-pack-r03.html) · 481,380 bytes · SHA-256 `5b41481460984bdeb09f683b76a5ba30cdd805eb19f90735e725d01fedc6b825` |
| Rationale | [Rendered audit of r02](../reference/ui/job-pack/powerplants-one-job-pack-audit-r02-rendered.md) (executes the browser, keyboard/dialog and A4 checks the original audit left open) and the [r03 change record](../reference/ui/job-pack/powerplants-one-job-pack-r03-change-record.md) |
| Presentation preserved | Padding, palette, Roboto/Verdana, three views, contents rail, readiness rail, guided preparation, print choices — unchanged from the list above |

What r03 adds to the presentation baseline, in substance: a per-event change reason with field-level deltas in the revision history; readiness criteria with the BP-07 §8 outcome vocabulary (Pass, Blocked, PermittedException, NotApplicable) including an evidenced tool exception; a source version and as-at on every section with a source-change assessment that blocks submission until recorded; a required originating history entry; one event timestamp format with zone derived from the site record; registry-form synthetic references; a repeating A4 print header with page numbers; and a semantic token set shared with Field Technicians r05.

Recorded with the acceptance:

- `SYN-PPO-DOC-nnnnnn` is used provisionally for document references. PPO-STD-001 §10.2 has no controlled-document type code and requires an explicit amendment to add one; the alternative is to present documents by their SharePoint identity with revision separate. Open naming decision.
- Readiness rows cite “PP-01 synthetic policy r01”; the application's readiness registry supplies real policy references at integration.
- The shared appointment `SYN-PPO-APT-000242` keeps the Job Pack values (11 September, 09:00–12:00, Draft r01 not issued); Field Technicians r05 is aligned to them.

The integration boundary above is unchanged: r03 is presentation, not P06 code; its in-memory simulation of source change and review remains a demonstration of TR-07 and TR-04 intent to be mapped to verified behaviour.
