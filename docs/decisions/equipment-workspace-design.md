---
document_id: PPO-EQUIPMENT-DES
revision: r01
date: 2026-09-14
owner: Dean Fiedler
status: Authorised standalone design; visual review and application integration pending
source_commit: 10625815187f26179f316b887fcdee33467ac81f
---

# Equipment and Installed Base workspace

Dean authorised the Equipment and Installed Base interactive HTML workspace after the 14 September design-coverage audit. The [r01 design](../reference/ui/equipment/PPO-Equipment-and-Installed-Base-Workspace-r01.html) connects equipment lookup, current record context, retained history, inspection capture, owned defects and reviewed retests. It provides one complete synthetic journey without creating another application asset model.

This is an authored design for review. It is not an accepted application baseline, production inspection procedure or implementation of QR scanning, AI1, offline synchronisation, service completion or ERP processing. The UI baseline register is unchanged pending visual acceptance. Finance design PR #178 merged during this work; product-quality scope PR #182 remains separate.

## Sources and design choice

At the start of design work, `main` and a complete clean clone were verified at `10625815187f26179f316b887fcdee33467ac81f`, tree `37fab6114f905c09183f28f15c6e2d51bf300d38`. AGENTS, README, STATUS, naming, shared UI guidance, the shared customer/equipment implementation and relevant contracts were inspected. Before publication, the branch was rebased onto `c3797ce9605a9eb1afab1f839e47e63095de1f7d`, preserving the Finance design and both sets of documentation entries. Existing Equipment pages use `ContextDetail` and already retain configuration, attributed history and location events; those capabilities are not labelled unstarted.

The earlier Equipment and Installed Base Lifecycle Workflow Map r01 supplies workflow context. This contribution is the operational workspace, not a replacement workflow map. The user-authorised [product-quality delivery package](https://github.com/deanrfiedler-gif/powerplants-one/pull/182) prioritises the equipment-to-inspection journey F01/F02/F08 and the later lifecycle extensions.

The supplied attachment label says r18, but the available HTML title and internal revision identify **r16**. Source SHA-256: `19d96d383fadfda3bb03b5939cb933a64e4b220e69b8cb9a21df3f48d90b794f`. This design retains its three embedded Roboto font faces, exact navy `#242a37` and green `#62bb46`, supplied compact on-navy symbol, neutral surfaces, one-pixel borders and bottom-only drawer corners. It does not claim r18-specific provenance. The supplied source file is not modified or added to Git.

Self-contained HTML/CSS/JavaScript follows the existing standalone design approach. This avoids a new framework or runtime integration for a reviewable file. Native semantic controls and a shared pure model support meaningful local verification. The production TypeScript/Next.js/PostgreSQL architecture remains unchanged.

## Delivered views

| View | Behaviour |
|---|---|
| Equipment register | Seven fictional assets across three customer sites; search reference, serial, model, location, customer and system; combined customer/condition filters and name/customer sort; equivalent desktop rows and mobile cards; useful empty state |
| Equipment record | Separate stable sample UUID and readable reference; identity/condition, model, serial, owner, site hierarchy and explicit unknown warranty/coverage evidence |
| Service history | Unsuccessful repair, suspected/unresolved condition, reviewed report extract, owned OEM clarification and local inspection events; no inference that an inspection closes other work |
| Documents and configuration | Inspectable exact synthetic source revisions; equipment-specific association; configuration and moved-asset location history retained; no unrelated asset inherits the sample visit document |
| Inspection workspace | Confirm identity, access and isolation evidence; require current fictional instrument calibration; capture fixed-unit readings, visual condition, narrative and local image/sample evidence; preserve exact submitted snapshots |
| Identification | Exact reference, serial or UUID lookup; no-match and explicit confirmation states; sample QR result; manual fallback; no camera permission requested |
| Contextual assistance | Scripted, visibly synthetic summary bound to the selected asset; source extracts; editable follow-up with eligible owner and valid due date; explicit save; a separate UUID-based local Activity candidate |

The responsive shell retains Equipment and Inspections navigation plus Identify and Guide actions. The file works without remote resources. It exposes only the review scenario's two simulated roles, Alex Morgan (Technician) and Casey Reed (Reviewer). This selector illustrates responsibility, not authentication or server permission enforcement.

## Complete synthetic journey

1. Open Fertigation unit 01 (`SYN-PPO-AST-00101`) through the register or exact identification lookup. Confirm its Propagation site / Glasshouse 02 context.
2. Continue the fictional visit on 15 September 2026, 07:30–10:00 AEST. Confirm physical identity, approved fictional access/isolation evidence and instrument `SYN-PPO-INS-00009`, calibration `CAL-r02`.
3. Record **5.60 bar**, **2.00 mS/cm**, visual condition, a finding and a photograph or explicitly illustrated sample. The pressure fails the fictional template r03 range. Limits are labelled as design examples, not operating instructions.
4. Submit as the technician. The exact site, area, equipment UUID/reference, configuration r02, template r03, units/limits, instrument evidence, author, timestamp, narrative and image are retained in inspection r01. One failed submission creates one linked defect 00048; retry does not duplicate it.
5. Switch to the reviewer. Assign Alex Morgan, a valid due date and a reason; return for retest. A failed inspection cannot be accepted as passed.
6. Switch to the technician. Start r02, reconfirm prerequisites and capture **4.60 bar** with new evidence. Original r01 remains unchanged. Submit the successor.
7. Switch to the reviewer and record the review outcome. Acceptance references the exact passing submission and closes only defect 00048. Existing OEM defect 00047, work-order completion, customer acceptance and Finance handoff remain separate.

A passing initial inspection can also be reviewed without manufacturing a defect. Empty, negative, non-finite, exponent and excess-precision readings are rejected; supported readings have at most two decimal places so the result cannot contradict rounded display values. Retest due dates cannot precede the fictional visit or contain invalid calendar dates.

## State, persistence and recovery

Drafts and review entries are kept separately from submitted snapshots. The standalone file uses one revision-specific localStorage key. Input and role/navigation state are restored on reload where browser storage permits. Photo inputs accept JPEG/PNG/WebP up to 1 MiB; the source bytes are retained rather than silently compressed. The built-in sample is labelled an illustration, never a photograph or live reading. An asynchronous upload cannot overwrite a submitted or different draft revision.

Storage failure is disclosed as **Session only**, with an evidence download available. Incompatible saved data is not silently overwritten. Reset has a separate confirmation and applies only to this design's local key. The downloadable JSON includes draft, original submissions, source context, review, linked defect and follow-ups; it is not an issued service report. No offline queued/synchronised claim or durable server receipt is made.

Design references for inspections, configuration and defects are fictional display examples, not additions to the application's allocator or enums. Follow-ups use a UUID and a separate label, retaining the existing Activity identity distinction. The sample objects are not migration fixtures and must not be imported as operational records.

## Traceability and implementation boundary

| Existing authority | Design relationship |
|---|---|
| CRM-01/CRM-06; DAT-01–DAT-03 | Equipment/customer/site identity, permitted linked context and distinct account authority |
| SVC-03/SVC-06 | Prepared visit source, attributed history, unsuccessful fixes and unresolved work |
| DOC-01/DOC-02 | Exact source references and retained original submissions; export is not controlled issue |
| [Service data dictionary](../contracts/service-data-dictionary.md) and [service API](../contracts/service-api.md) | Reuse canonical Asset/Site/configuration/location/history and Activity semantics during future integration |
| [ADR-0008](ADR-0008-p03-customer-intake.md) | Existing context and owned follow-up; the design introduces no competing master or external authority |
| [Document contract](../contracts/document-issue-distribution.md) | Production issue/distribution, file permissions and immutable source integrity require the existing server controls |

Later implementation must define the minimum structured-inspection schema, current server permissions, supported template approval/limits/instrument rules, assignment changes, exact-source validation, stale revisions, durable command recovery, file storage and any offline extension. Client role checks and local JSON snapshots do not provide those guarantees. MYOB remains the intended ERP authority and SharePoint the intended business-document authority. No existing application route, database, migration, dependency pin, workflow or acceptance procedure changes here.

## Verification and limits

- `node scripts/check-equipment-design.mjs`: **46** pure design-model/static checks passed, including invalid evidence, role separation, exact identity, failed-result acceptance refusal, retest ownership, original preservation, repeat-effect prevention and JSON restart.
- `scripts/check-equipment-design-dom.cjs`: **23** Node DOM-emulation checks passed against the contributed HTML, including the complete journey, search/filter equivalence, source access, explicit scan confirmation, reviewed AI follow-up and reload recovery. The optional scratch QA dependency was jsdom 27.0.1; no application dependency was added. Dialog open/close and scroll were inert test adapters; no native-browser result is claimed.
- JavaScript syntax, static IDs, embedded-resource independence and exact font/logo source identity were checked. Node was 24.19.0 and Python 3.12.14 in this design environment; no application build was attempted under that Node version.
- **Visual browser verification is pending.** The Browser tool explicitly rejected the synchronized local HTML URL under its URL security policy. No alternate browser surface or workaround was attempted. Desktop/mobile geometry, 200% zoom, native dialog/focus behaviour, print layout, actual camera handling and physical-device accessibility remain unverified.
- The [evidence manifest](../testing/evidence/equipment-workspace-r01.json) binds results to the HTML hash. Foundation, prototype and naming results are recorded there after execution. These are documentation/design checks, not application or business acceptance.

The next bounded step is visual review at 1440, 1024, 390 and 320 pixels, keyboard and 200% zoom; refine r01 before accepting it as an application baseline. Then implement the specified equipment/inspection slice through the existing domain services and F01/F02/F08 package. Publication remains a reviewable design PR; no hosting or production deployment is included.
