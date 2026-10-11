# Users, roles, teams and access review — design reference

Stable entry: `scope:AD-01`. Owner: Dean Fiedler. Status: **Draft for visual review**.
Source baseline: `ccc2251bbba9df266cac9027ddaa9418ab9abc1d`. Application destination: `/admin/access`.
This is an editable working specification. Existing accepted page baselines take precedence over these proposed common-layout rules. A blank review record is not approval.

## Purpose and task

Implement users, roles, teams and access-review pages; current server permissions and setup scripts do not provide this management UI.

1. Inspect existing access and its business basis
2. Review requested changes with the authorised owner
3. Retain decisions and recheck effective access

## Desktop

Use the application shell for navigation, search, identity and the existing information icon. Keep the page title, selected record/scope and primary action visible. Use a register/worklist for multiple records and a record/evidence workspace for an individual record. Match the linked page-specific reference where one exists; retain its accepted geometry.

At 1440 × 960 and 1024 × 768, inspect the complete shell and stylesheet order. Let long titles and unknown values wrap. Keep one owner for content scrolling. Record the actual dimensions and any approved adaptation here after paired source/application review.

## Mobile

At 390 × 844 and 320 CSS px, retain the same task and record context. Stack related fields and use labelled cards for dense worklists. Keep primary actions, validation and the close control reachable. Inputs use readable 16 px text; touch controls use the shared minimum target. Do not hide a required decision or critical state solely to fit the screen.

The exact mobile composition has not been visually accepted for this entry. Retain mobile-specific evidence here when reviewed; a desktop image is not mobile evidence.

## Shared components and states

Use the global Roboto/Verdana typography and semantic tokens. Reuse the shared Button component for new controls; preserve documented existing page-specific exceptions until deliberately migrated. Use consistent primary/secondary/quiet/danger meanings. Include hover, visible focus, disabled and loading states.

Review loading, empty, filtered-empty, read-only/denied, missing context, validation error, stale revision, saving, uncertain result and success where the workflow supports them. Status must include words, not colour alone. Preserve a draft when opening guidance or inspecting a reference.

## Visual references

- [PPO-Users-Roles-and-Access-Review-r01.html](../../../reference/ui/access-review/PPO-Users-Roles-and-Access-Review-r01.html)

## Behaviour, handovers and verification

The draft User Guide `guide.ad.01` carries prerequisites, tasks, outcomes and recovery. Review that article against the running release before publication. Keep source presence, visual review, functional testing, owner acceptance and deployment separate.

Acceptance evidence is pending. Capture matching original-reference and application views, then verify keyboard order, focus return, 200% zoom, wrapping, scroll ownership, phone states and the relevant business journey. Do not replace a comparison image simply to make a test pass.

## Current permission catalogue working master

The stable [AD-01 working HTML](../../access-review/access-review.html) is generated from the current capability registry. The issued r01 HTML and its original captures remain unchanged historical evidence; their catalogue count is not the working count. Server permission enforcement is separate from this explanatory design. Generator/model/browser checks use the versionless master. No owner review or current fingerprint is inferred from regeneration.

Step 3 adds `schedule.policy.review` and `schedule.policy.publish` to the 100-entry working catalogue. Their labels describe distinct fictional duties; the policy handlers additionally require explicit current Workspace scope and complete source visibility. A generic capability explanation in AD-01 does not prove those command conditions. Existing role bundles and hosted tester authority are unchanged. Publication and resolution are internal test-harness commands until Step 4; PL-04 publication controls remain Step 5. No new mockup or accepted desktop/mobile capture accompanies this catalogue update; issued r01 images remain historical references.


## Native read-only increment — 11 October 2026

The [implementation decision](../../../decisions/access-review-native.md) adds the directory and person inspection routes. Current Workspace admin.access.read is required; Company/Site grants cannot inspect the workspace. Native People/grants/explanation are implemented; roles, teams, access changes and review campaigns remain open, so AD-01 is to refine rather than complete. The separate record route is a proposed adaptation of the reference inspector. Shared controls are reused; no accepted geometry or visual fingerprint is invented. See the [execution ledger](../../../testing/evidence/access-inspection/README.md).

## Capability catalogue continuation

Browse the capability catalogue from people/person access to inspect permissions across the workspace. Holder links carry the capability and matching company/site into the person form; they never imply a positive result. Submit a fresh eligibility check. See the [catalogue contract](route-admin-access-capabilities.md), [holder contract](route-admin-access-capabilities-id.md) and [execution ledger](../../../testing/evidence/access-capabilities/README.md). Existing review records remain unchanged.

## Proposed-role continuation

Users and access links to the seven proposed bundles; Person access links to the exact company/site comparison. See the [role comparison contract](route-admin-access-id-roles.md) and [evidence](../../../testing/evidence/access-roles/README.md). This implements inspection only; teams, assignments, access-changing commands and campaigns remain open. Existing captures retain their original source and do not establish review of the new links.

## Request and independent-review continuation

Local synthetic single-add proposals can be submitted and independently decided from [Access-change requests](route-admin-access-requests.md). Approved remains ineffective: apply, teams and campaigns remain open. Existing captures retain their original source; no acceptance of the new handover is inferred.

## Saved local team record inspection — 11 October 2026

The [local team contract](../../../decisions/access-local-teams.md) adds immutable local records and initial rosters. `/admin/access/roles#saved-local-teams` reuses record-grid/card styles, Button, ReadState and Stamp. Retained team examples remain separately labelled. Incoming data is the local team API; outgoing inspection is the exact original roster and audit-linked creation history. There is no native creation/editing form or membership-derived authority.

At desktop widths, use the existing card grid. At 390/320 px, stack cards and wrap UUIDs, names, purpose and reason using `narrative`. Keyboard Enter/Space opens/closes the selected roster; pagination and Refresh saved teams are shared buttons. Collection loading and unavailable reads hide saved cards; detail loading hides the previous roster while retaining the opener and its focus; denied inspection clears the protected catalogue. Identity activity is current, while the roster is the immutable initial record. No source join/expiry dates are copied into it.

Host fixtures live in `tests/browser/access-local-teams.spec.ts`; exact-record/concurrency/rollback and upgrade fixtures live in `tests/database/access-local-teams.test.ts`. Evidence and source-bound desktop/phone captures: `docs/testing/evidence/access-local-teams/README.md`. This is a small existing-page refinement under ADR-0053 rule 6. An accepted native Figma image is missing; the retained AD-01 HTML is a workflow reference, not visual acceptance of this addition. Owner, screen-reader and physical-device acceptance remain open; no review fingerprint is granted.

Actual implementation review: [six source-bound captures and observations](../../../testing/evidence/access-local-teams/review.md), source `ee327bc`, 1440/390/320 widths. No horizontal document overflow observed. Existing phone-title truncation, card height and vertical scrolling remain explicit limits; owner acceptance is still pending.
