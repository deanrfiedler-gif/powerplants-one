---
document_id: PPO-002-MYOB-HO
revision: r01
date: 2026-09-15
owner: Dean Fiedler
status: Authored discovery package; tenant evidence and visual acceptance outstanding
source_commit: dcabfec1b5cde1c2cf220359e6cf1c63408512d6
---

# MYOB integration handbook — discovery handover

Dean authorised the r01 interactive integration blueprint, field-mapping handbook and maintained GitHub specification/register on 15 September 2026. This package addresses the existing [PPO-002 issue #2](https://github.com/deanrfiedler-gif/powerplants-one/issues/2). The issue remains open: actual installed MYOB configuration, operational ownership and verified integration feasibility are not established by a synthetic discovery document.

## Sources and delivery

Repository access, clean dedicated clone and `main` commit `dcabfec1b5cde1c2cf220359e6cf1c63408512d6` were verified. AGENTS, README, STATUS, BP-02, ADR-0003, the prototype index, adopted naming, Finance handoff, shared data dictionary and relevant master requirements were read. Existing status is preserved; this package makes no claims about unrelated PRs or hosted deployment.

The [blueprint](../contracts/myob-integration-blueprint.md) defines responsibilities, actual configuration evidence, mapping/relationship contracts, API setup, synchronisation, J-01–J-05 journeys, procedures, acceptance and maintenance. The [CSV](../contracts/myob-field-mappings.csv) and [content source](../design/myob-integration/content.json) contain 60 proposed entries. Null observed/API/approval fields are intentional. Field families require expansion into exact atomic fields during installed-schema discovery.

The supplied attachment title confirms **r20**, resolving the earlier r16/r19 label discrepancy. Its SHA-256 is `c68a499e857b1705d47bd6598d4b2e89526bf0861a0d234394c3da023f19b617`. Three embedded Roboto font faces and the supplied compact on-navy symbol are retained. The source board is not changed or committed. Font licensing remains in [the existing Roboto licence](../standards/ui-assets/roboto-ofl.txt).

## Implementation choice

Use the established self-contained HTML/CSS/JavaScript design-document approach with a standard-library Python generator. Structured JSON supplies all 60 mapping entries and the CSV. No framework, new application infrastructure or runtime dependency is introduced. The alternative of an application route would exceed this discovery deliverable and imply integration work that is not yet specified. The application architecture remains under ADR-0003; no new architecture reservation is needed for this document renderer.

The delivered HTML contains search and combined filters, desktop rows/mobile cards, per-mapping detail panels, all/matching/single CSV exports, linked journeys, eight reviewable procedures, local review JSON export/import, protected reset and print-all behaviour. All evidence states are fixed to the supplied discovery facts. Local checkbox marks can never confer MYOB verification or approval.

## Verification

Verification results and the final generated artifact hash are recorded in [the evidence manifest](../testing/evidence/myob-handbook-r01.json). The standalone interaction check uses DOM emulation, which is explicitly different from a native browser. The test runner requires a separately installed jsdom path; it adds no project dependency and does not alter any CI workflow.

The final run passed **42/42 DOM/document checks**. It covers all-section rendering, mapping/evidence integrity, desktop/mobile ID equivalence, combined filters and sorting, exact detail identity, CSV scopes, workflow links, procedure links, local review restart/export/import, malformed/incompatible/unknown/duplicate import rejection, reset cancellation, blocked storage, incompatible saved-byte preservation, and print preparation/restoration. Foundation, prototype and naming checks also passed. These do not count as native-browser or actual MYOB tests.

The first DOM run passed 39/42. The focus-return failure led to explicitly retaining the invoking mapping control. Two harness defects were corrected: the expected key list is sorted before comparing to sorted JSON keys; jsdom's animation-frame emulation is enabled for procedure navigation. Native dialogs and scrolling remain inert adapters. Mapping panels also reset their content scroll on open and handle Escape through the same explicit close path.

Native browser visual verification is **pending**. No local Chromium executable was installed; an official Playwright Chromium download timed out. The available Browser tool explicitly rejected navigation to the synchronised local HTML under its URL security policy. No workaround, alternate browser surface or indirect execution was attempted after that rejection. Desktop/mobile geometry, actual font rendering, picker placement, native dialog focus, print pagination and real-device accessibility therefore remain unverified.

No MYOB tenant was accessed, no endpoint invoked, no live record imported, no company configuration changed and no financial posting performed. All 24 MYOB acceptance cases remain Not run. Documentation/interaction assurance is not operational acceptance.

## Publication and concurrent changes

The initial reviewed source was published as `40e6dccb09f76a9ca3eecd30bdb467a22fd984a6` in [draft PR #194](https://github.com/deanrfiedler-gif/powerplants-one/pull/194). Main advanced to `64574208ca604fee381e45c1b7db1b2b03c1dc8b` through the naming/SharePoint package while the handbook was being authored. That main was incorporated, resolving only the shared STATUS and document-register conflicts by retaining both contributions. The handbook HTML/content remains unchanged; the three documentation checks were rerun after reconciliation. The original source links remain bound to the inspected `dcabfec` snapshot.

## Next bounded step

Visually review the rendered r01 on desktop and phone, including 320px reflow, keyboard menus/dialogs and print. Then use CFG-01–CFG-12 and PROC-01 with the actual administrator/partner to gather authorised, redacted configuration and field-use evidence. Select a small customer/account/location/item read pilot only after the exact ownership, company scope, endpoint and test-access facts are known. Live command design and production release remain separate increments.
