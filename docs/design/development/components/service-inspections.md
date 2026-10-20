# Service inspection host

<!-- versioning: git; committed history is authoritative -->

Owner: Dean Fiedler. Independent visual/device acceptance pending.

ServiceInspectionScreen binds FI-03/FI-04 to permitted synthetic appointments. It reuses Button/ButtonLink, ReadState, ErrorNotice, RecordTabs/RecordPanel, LocalDateTimeField, RegisterTable/RegisterChip/RegisterEmpty/RegisterFooter, SecondaryMenuFrame, WizardDialog, RecordIdentity, the compact phone header, original-command recovery and global guidance. Presentation states use tests/fixtures/inspections-accepted.ts and tests/browser/inspections-design.spec.ts. Authority proof uses tests/browser/service-inspections.spec.ts, tests/database/service-inspections.test.ts and tests/database/inspection-attribution-upgrade.test.ts. No isolated catalogue renderer is claimed.

At 1440 use the flush review register, ruled record summary, readiness strip and tabbed readings; at 1024 collapse the shared secondary menu. At 390/320 use stacked capture sections, compact saved checks, per-reading instruments, a pinned Save/Submit bar and a bottom submission sheet. Four choices wrap into two columns at 320. Use 16 px input text and 44 px primary targets. Keep one shell content scroll owner, readable exact evidence, keyboard validation and guide focus return. Physical-device and 200% zoom acceptance remain separate.

Show required measurement type/range/unit and certificate requirements beside capture fields. Distinguish the unsaved catalogue selection from the test-time snapshot retained by saving; submitted review shows that exact certificate reference/revision and its current assessment.

The host permits a bounded 6,000,000-character journal for evidence originals. Quota failure precedes transport. All other consumers retain the 32 KiB default. Same-tab reload retains the unchanged original; unsaved entries remain browser memory. No offline queue is introduced.

The accepted source is "PPO - Design", named version "Inspections — accepted", page 1339:4184 and notes 1345:2979. The four owning page contracts list every desktop, tablet, phone and state node and the retained icon-free captures. Quality r01 remains historical context. Reading attribution is separately authorised in inspections-reading-instruments.md. See the [verification record](../../../testing/evidence/service-inspections/accepted-design.md); delivery grants no owner visual approval.

## Figma components

**Status:** None · **Location:** Components, in the private "PPO - Design" Figma file

No main component on the Components page yet. Page frames may draw this pattern; add a component when an accepted design needs one. The mapping is kept in `../components.json` (`figma`); node IDs are stable, and the file link stays out of this repository (ADR-0053). It records where the design component is, not visual alignment or review.

## Desktop

1440/1024: flush register and shared secondary menu; summary and readings columns; shared line/focus/surface tokens; exact sources and wrapped evidence. Preparation exposes retained HTML/PDF before a separate issue confirmation.

## Mobile

390/320: compact phone header, stacked controls, offline last-saved notice, uncertainty recovery and attendance refusal. Preserve unsaved memory and the original command journal; no offline queue. Reviewer actions stay reachable below the retest timeline. Verify page overflow and focus at both widths.

## Original-receipt selection availability — 3 October 2026

Attempt buttons are disabled while the existing command guard is busy or has an unresolved original. They become selectable after recovery; permission and applicability still govern receiving actions. The fixture holds the real actor-bound receipt response and verifies disabled selection followed by enabled selection, on desktop and phone. `tests/browser/service-inspections.spec.ts` also awaits the exact recovered draft read before its unchanged display assertion. Existing FI-03/FI-04 and both inspection-route bindings remain; no new authority or offline protocol. [Current evidence](../../../testing/evidence/field-integrated-acceptance/README.md) records actual outcomes. Review remains pending; no fingerprint or accepted native mockup is manufactured.
