# Service inspection host

<!-- versioning: git; committed history is authoritative -->

Owner: Dean Fiedler. Independent visual/device acceptance pending.

ServiceInspectionScreen binds FI-03/FI-04 to real permitted appointments. Reuse shared Button, Field, ReadState, ErrorNotice, original-command recovery and global guidance. State fixtures: tests/browser/service-inspections.spec.ts and tests/database/service-inspections.test.ts. No isolated catalogue renderer is claimed.

At 1440/1024 use wrapped cards and fieldsets; at 390/320 stack controls with 16 px input text and 44 px targets. Keep one shell content scroll owner, readable exact evidence, keyboard validation, guide focus return and actual 200% zoom.

Show required measurement type/range/unit and certificate requirements beside capture fields. Distinguish the unsaved catalogue selection from the test-time snapshot retained by saving; submitted review shows that exact certificate reference/revision and its current assessment.

The host permits a bounded 6,000,000-character journal for evidence originals. Quota failure precedes transport. All other consumers retain the 32 KiB default. Same-tab reload retains the unchanged original; unsaved entries remain browser memory. No offline queue is introduced.

Quality r01 is a proposed reference. Accepted native desktop/phone images are missing. See page contracts, decision and verification evidence; delivery grants no owner approval.

## Desktop

1440/1024: responsive columns, shared card/line/focus tokens, exact sources and wrapped evidence; one shell content scroll owner.

## Mobile

390/320: stacked controls, no horizontal page overflow, readable evidence and 200% browser zoom.

## Original-receipt selection availability — 3 October 2026

Attempt buttons are disabled while the existing command guard is busy or has an unresolved original. They become selectable after recovery; permission and applicability still govern receiving actions. The fixture holds the real actor-bound receipt response and verifies disabled selection followed by enabled selection, on desktop and phone. `tests/browser/service-inspections.spec.ts` also awaits the exact recovered draft read before its unchanged display assertion. Existing FI-03/FI-04 and both inspection-route bindings remain; no new authority or offline protocol. [Current evidence](../../../testing/evidence/field-integrated-acceptance/README.md) records actual outcomes. Review remains pending; no fingerprint or accepted native mockup is manufactured.
