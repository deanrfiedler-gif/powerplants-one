# Site Survey & As-Found workspace

<!-- versioning: git; committed history is authoritative -->

**Owner:** Dean Fiedler · **Date:** 15 September 2026 · **State:** Proposed interactive HTML; native visual review and application integration pending.

The [standalone module](../reference/ui/customers/PPO-Site-Survey-and-As-Found-Workspace-r01.html) implements the requested CS-08 design extension: capture the existing horticultural site conditions before preparing an Estimating or Engineering brief. It has six local views, without a left navigation rail, corporate masthead or application shell. It uses embedded HTML, CSS, JavaScript, fonts and synthetic context, with no new framework or application dependency.

## Source and scope

- Repository source: main `64574208ca604fee381e45c1b7db1b2b03c1dc8b`. Relevant contracts are [BP-03 CRM](../blueprints/BP-03-crm.md), [BP-04 Estimating](../blueprints/BP-04-estimating-quotation.md), the [service data dictionary](../contracts/service-data-dictionary.md) and [document issue contract](../contracts/document-issue-distribution.md).
- The customer/location context comes from the [Customers, Sites & Growing Areas r03 design at source b6066d1](https://github.com/deanrfiedler-gif/powerplants-one/blob/b6066d18602b7b544a1883b8beb3a12ed0ecf09c/docs/reference/ui/customers/PPO-Customers-Sites-and-Growing-Areas-Workspace-r03.html), in open PR #193 when inspected. This survey file embeds only the read-only synthetic organisation, site, contact, facility, equipment and source context; it does not require #193 to run and does not replace those master records.
- User-supplied r20 theme board SHA-256: `c68a499e857b1705d47bd6598d4b2e89526bf0861a0d234394c3da023f19b617`. Its 41 Intake tokens resolve to 47 shared/workspace values. The three original embedded Roboto font faces are retained; combined font-face SHA-256: `a3c83afa45da8ccb05686729f4cfdd2f4694e6771334b025f00207ef381185e9`.
- Navy `#242a37`, green `#62bb46`, field/card/dialog shapes and the rounded dropdown container/inset follow that source. Custom select menus support keyboard navigation, typeahead, owning-dialog placement and viewport clamping. One modeless inspection/Assistant dock is shared; forms, source inspection and decisions use dialogs. Responsive CSS supplies stacked capture forms and local table/tab scrolling. These are implemented behaviours, not evidence of native visual acceptance.

## Connected views

| View | Included in r01 |
|---|---|
| Survey register | Searchable synthetic surveys with organisation, addressed site, purpose, owner, visit date, status and revision; create a survey with site-scoped facilities, assets and contacts. |
| Survey scope | Objectives, arrival/contact/access context, Google Maps address link, selected facilities and equipment; one pump identity with separate installed location and three served areas. |
| Measurements and observations | Title, exact target, detail, capture date, recorder, method and source. Measured, Observed, Customer statement, Assumption and Unknown are distinct. A measurement needs a numeric value and unit; unknowns are never converted to zero. |
| Photos and evidence | Original local JPG/PNG/WebP upload, exact target, caption, capture date, recorder and source. Caption corrections retain original bytes and before/after metadata. The starter contains no fabricated photograph. |
| Missing information and follow-up | Linked observation, exact facility/asset, responsible person, due date, next action, status and resolution. Unknowns/assumptions must have open owned follow-up before submission. |
| Review and handover | Submission, return for correction, reviewed revisions, change history and an exact-source handover for Estimating or Engineering with a receiving owner. A later revision preserves earlier submissions, review decisions, evidence and prepared handovers. |

The Willowbank demonstration retains two addressed sites and nine facilities covering greenhouse, tunnel, propagation house, pack room, irrigation block/field and irrigation shed. The primary survey concerns pump `SYN-PPO-AST-000501`, installed in Irrigation Shed 01, and three served growing areas. Seven initial observations distinguish a fictional measured greenhouse length, observed equipment/location and crop-access context, a customer statement about simultaneous circuits, unknown flow/electrical capacity and an assumption about retaining a mainline. Three owned follow-ups preserve those initial limitations. A second, reviewed field-site survey demonstrates a separate addressed-site context.

## State and evidence rules

The local Coordinator can capture Draft/Returned revisions and submit them. The local Reviewer can return or review a submission, acknowledging any remaining owned information gaps. The Observer can inspect. These role controls are a demonstration, not server authorisation. The preview role is chosen under Workspace information.

Submission captures an immutable local snapshot and locks editing. Return reasons and later corrections retain earlier content. Reviewing preserves the exact submitted evidence; preparing a handover binds a specific Reviewed snapshot. Starting the next revision creates a new draft. The mutation guard refuses changes to existing snapshots, handovers or history. Review status does not certify a design basis, site safety, access permission or equipment capacity.

Scope changes cannot orphan existing observations, photos or follow-ups, and all selected records must belong to the selected site. Including equipment also includes its installed facility. Survey corrections do not overwrite shared facility dimensions, installed asset identity, access rules, issued estimates or Engineering records.

Contextual assistance offers observation/site summaries, missing-information prompts and a handover draft, with inspectable source snapshots. It is explicitly scripted, scoped to the selected record, and stale-context guarded. It does not call a model, issue documents or send a handover to another person/system.

The file uses only `ppo-site-survey-as-found-r01` in localStorage. Competing-tab writes are refused against the retained storage basis. Invalid saved data is preserved with a recovery explanation. Storage failure is labelled session-only. JSON backup restoration previews validated contents, requires confirmation and rechecks before replacing this design's data. Reset is separately confirmed. This is local browser persistence, without server sync or durable offline receipts.

Images are limited to 1 MiB per upload, eight per survey and 10,000 pixels per dimension, with file-signature/decode checks. Retained data is limited to 6,000,000 JSON characters, including history and repeated snapshot evidence; this can be reached before the image-count limit. Browser quotas may be lower and are reported. Original image metadata is not silently stripped. Restored-image checks validate declared type/header and PNG dimensions; a backup is not a cryptographic authenticity proof or a replacement for controlled document storage.

## Traceability and remaining implementation

CS-08 is page-register coverage, not a new parent requirement. CRM-01/CRM-04/CRM-06 cover customer/site context, visits and permitted related records; SVC-06 covers attributable site/asset findings and unresolved information; DOC-01/DOC-02 and DAT-01–DAT-03 cover source/identity continuity. All existing parent IDs and issued references remain unchanged. This design adds no acceptance-procedure pass or approved application baseline.

Future application work must use canonical entities, authenticated permissions, durable original evidence, actual file/document storage, server concurrency and the receiving Estimating/Engineering contract. MYOB remains the intended ERP authority, SharePoint the business-document authority and native CAD tools the authoring authority. No route, migration, production adapter, communication, deployment or integration was added here.

## Verification and handover

The [check script](../../scripts/check-site-survey-design.mjs) exercised **40 model/DOM checks**, including the full capture → submit → return → correct → review → prepare handover → next revision journey; exact original photo bytes; explicit measurement clearing; source-scoped assistance; cross-site/orphan refusals; stale writes; backup restore; read-only controls; and storage recovery. The [evidence manifest](../testing/evidence/site-survey-workspace-r01.json) binds results to the delivered HTML hash. jsdom 27.0.1 is an optional scratch QA dependency, not an added application dependency. Run with `PPO_DESIGN_JSDOM_MODULE` pointing to its absolute `lib/api.js` entry, then `node scripts/check-site-survey-design.mjs --write-evidence`.

Foundation, prototype and naming documentation checks passed: 78 parent requirements retained, 2,017 local links resolved and 175 document records checked. The check script also passed Node syntax validation. No full application build, lint or backend test run is claimed for this standalone contribution.

Dialog/scroll behaviour and image decoding were stubbed in that DOM check. Native menu geometry, focus/top-layer behaviour, mobile camera handling, actual downloads/clipboard, print, 200% zoom and physical-device accessibility remain unverified. The Browser tool rejected the earlier local HTML preview under its URL security policy; no alternate browser or hosting workaround was attempted. The next review is the standalone file at desktop, tablet, 390px and 320px widths with keyboard and touch. This is a reviewable design contribution, not application or business acceptance.
