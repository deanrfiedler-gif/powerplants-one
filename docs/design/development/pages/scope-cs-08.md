# Site surveys — CS-08 build contract

<!-- versioning: git; committed history is authoritative -->

Stable entry: `scope:CS-08`. Owner: Dean Fiedler. Routes: /surveys and /surveys/[id]. The accepted design and delivered code have separate review status. Owner visual review: **pending**. Deployment: not performed by this change.

## Design source and acceptance

Build from **PPO - Design**, named version **Site surveys — accepted**, page 1464:2918 and notes 1464:4164; index 630:2. [Design decision](../../../decisions/site-surveys-figma-design.md) records D1–D7 and Q1–Q4. Dean subsequently authorised [shorter new references and migration](../../../decisions/readable-reference-namespaces.md). No source snapshot is rewritten.

| View | Exact nodes | Retained icon-free capture |
|---|---|---|
| Desktop register and create | 1464:2955, 1464:3366 | 01, 08 |
| Scope, observations, photos | 1464:3055, 1468:3554, 1470:2833 | 02, 03, 04 |
| Follow-up, review, handover | 1471:2847, 1472:3102, 1473:3371 | 05, 06, 07 |
| Tablet register | 1464:3695 | 09 |
| Phone list, scope 390 and 320 | 1464:3779, 1464:3821, 1464:3890 | 10, 11, 12 |
| Successor observation | 1478:3552 | 13 |
| Loading, no reviewed surveys, could not load | 1464:3958, 1464:4016, 1464:4059 | 14 |
| Changed scope source | 1464:4095 | Within source state set; live frame governs |
| Grid header, row, photo tile, notes | 1465:2977, 1464:4188, 1470:3265, 1464:4164 | Live page parts / notes |

Capture numbers refer to [site-surveys-design-r01](../../../reference/ui/customers/site-surveys-design-r01/README.md). Those issued sources stay unchanged. No private file link or icon artwork belongs in Git. Shared ShellIcon maps through font-awesome-icons.ts under ADR-0050.

## Desktop and shell

r20 page types: Register / worklist and Document & evidence workspace. Reuse the current PPO rail, top bar and compact phone header. The register has a flush secondary menu: Sites; Facilities & growing areas; All surveys, Drafts, Awaiting review, Returned, Reviewed; Access & readiness and Equipment. It uses a compact site/owner toolbar and ruled grid. Columns retain survey, status, site, visit, open gaps, handover, revision, owner, observation count and reference. Horizontal overflow belongs to the register, never the page. Selection currently has no adopted bulk action. Sorting is by title within the loaded page; pagination remains explicit.

The record has a full-width identity/action band, submission/handover checks, ruled facts and six URL-retained tabs: Survey scope, Observations, Photos & evidence, Follow-up, Review & handover and History. Retained history remains available; full-size History redesign is excluded. New survey groups Survey, Scope and Purpose, with existing surveys and readiness beside the form. Scope includes an equipment item's installed area; served areas require explicit selection.

Shared components: SecondaryMenuFrame/useSecondaryMenu, usePhoneHeader, SharedRecord/RecordFactSection, PageHeader, RecordTabs/RecordPanel, RegisterTable/RegisterSortHeader/RegisterFooter, Button, Field/SelectField, LocalDateTimeField, MultiChoice, ValidationFields, ReadState/ErrorNotice, CommandStatus/useCrmCommand and ShellIcon. Survey-specific composition remains private to this page. SharedRecord adds an optional accessible sourceLabel with its existing default preserved. Styling uses shared shell/control tokens, including compact 40 px rows and ruled sections; no new shared component family, library or Pro artwork.

## Phone, tablet and accessibility

Compare desktop 1440, tablet 1024, phone 390 and 320 CSS px with the exact frames. Phone uses the shared compact header with Choose view, New survey and Filter. Register rows keep title/status/site/owner/revision/gaps/visit or handover. Filters use a native modal with Escape and return focus. The record retains a scrolling keyboard-operated tab strip, contact/visit context and a reachable primary action. Measurement value and unit stay side by side at 320 px; other inputs reflow. Buttons and links have visible focus; required fields and errors are labelled; permission denial is never rendered as an empty success.

## Recorded facts, permissions and handovers

New surveys allocate SYN-SRV-000nnn from the permanent counter with at least six digits. Existing references of every type remain unchanged. Migration 0114 gives previously unnumbered surveys their first reference without altering retained revision content, submission hashes or audit events. Planned start/end and contact on site are explicit recorded fields; historical missing values say Not recorded. They are never inferred from a revision timestamp. New-survey inputs require the visit interval; purpose and significant-gap follow-ups are required before submission.

Use existing cs permissions and canonical permitted Site/People/Facilities/Equipment reads. No new capability or grant. Owner, submitter and recorder cannot review. Recorder checks include retained observation authors and photo recorders, rather than relying only on an editable display name. Review and return share the same form, with a required decision note and an exact submitted revision. Changed scope sources remain visible to the reviewer and do not block an independent review. A handover records an exact Reviewed snapshot, destination Estimating or Engineering and permitted receiving owner; it neither sends communication nor replaces the receiving basis. A successor draft does not inherit a current handover indicator.

Measured zero is valid with units; Unknown never becomes zero. Significant Unknowns and Assumptions require an owned open Site Activity with a due date before submission. A successor observation can explicitly answer a retained earlier Unknown. Original supported PNG/JPEG/WebP bytes and hashes remain unchanged; caption corrections are separate immutable entries. The existing synthetic store is reused, with eight originals per survey, 1 MiB per new file and bounded image dimensions; historical PNG reads keep their earlier limit. No document-storage connection is added.

## States and recovery

Loading, empty reviewed view, unavailable/retry, partial paginated data, permission denied, source changed, validation, dirty discard and uncertain-save recovery are distinct. Read failures may retain the last authorised record with a warning; access revocation clears it. Forms pin their original record version. Unsaved text remains in memory across section tabs. Navigation uses the shared dirty/uncertain guard; uncertain outcomes use Confirm original save with the same operation identity. No survey offline save, durable browser queue or automatic synchronisation is claimed. Follow the [offline system contract](../systems/offline.md); browser restart can lose an unsubmitted form.

## Unspecified behaviour and deviations

The drawn More/settings and selection controls do not define bulk operations or column personalisation; none is invented. Local sorting and pagination are explicit adaptations of the existing read contract. Native labelled date/time inputs expose start and end separately. The observation UI retains the recorded date at the model's date precision; it does not fabricate the clock time drawn in the example. Existing Activity links provide follow-up creation and ownership; no new inline Activity command is introduced. Conversations and document-store connections are outside this page's scope.

Open for Dean: define register More/settings and any bulk actions; decide whether observations need persisted clock-time precision in a future change; confirm the existing synthetic photo size/format limits for field use. These questions do not undo accepted D1–D7/Q1–Q4. Any remaining visual mismatch belongs in the [execution evidence](../../../testing/evidence/site-surveys-native/README.md), not in an altered reference.

## Verification

[Build decision](../../../decisions/site-surveys-native-build.md), [execution evidence](../../../testing/evidence/site-surveys-native/README.md), tests/unit/site-surveys.test.ts, tests/database/site-surveys-upgrade.test.ts and customer-location.test.ts distinguish contract proof from visual review. Documentation checks are not business acceptance. Review fingerprints, reviewer and reviewed date remain empty until a real owner review.
