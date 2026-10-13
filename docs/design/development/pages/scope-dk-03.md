# Output, issue and distribution centre — design reference

Stable entry: `scope:DK-03`. Owner: Dean Fiedler. Status: **Draft for visual review**.
Source baseline: `ccc2251bbba9df266cac9027ddaa9418ab9abc1d`. Application destination: `/documents/issues`.
This is an editable working specification. Existing accepted page baselines take precedence over these proposed common-layout rules. A blank review record is not approval.

## Purpose and task

Consolidate existing domain-specific outputs into the Output, Issue & Distribution Centre; preserve generation/issue/delivery/acknowledgement distinctions.

1. Review the prepared output and source basis
2. Issue only through the owning authorised workflow
3. Track sent, delivered and acknowledged outcomes distinctly

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

- [PPO-Output-Issue-and-Distribution-Centre-r01.html](../../../reference/ui/output-distribution/PPO-Output-Issue-and-Distribution-Centre-r01.html)

## Behaviour, handovers and verification

The draft User Guide `guide.dk.03` carries prerequisites, tasks, outcomes and recovery. Review that article against the running release before publication. Keep source presence, visual review, functional testing, owner acceptance and deployment separate.

Acceptance evidence is pending. Capture matching original-reference and application views, then verify keyboard order, focus return, 200% zoom, wrapping, scroll ownership, phone states and the relevant business journey. Do not replace a comparison image simply to make a test pass.

## First backend receiving increment — 13 October 2026

The [read API](../../../contracts/output-register.md) and [implementation decision](../../../decisions/output-issue-register-backend.md) provide a consolidated register and exact issue detail over native Job Packs and Service Reports. The planned page is still unbuilt; backend tests do not approve this visual design. No new controls/components are introduced here.

Incoming handovers are existing prepared/issued pack and report records. Outgoing handovers use their native preparation, review, issue, response and recovery pages, plus exact issue/presentation file endpoints. Reuse the application shell, shared Button, register/table and evidence-detail patterns when the page is built; do not invent a universal issue permission.

Desktop and phone consumers must show live-window coverage, selected family, original issue/revision/template, exact-byte availability and source applicability separately. Label generated/durable preparation without suggesting it is issued. Display simulated sends, opens/downloads and individual acknowledgements distinctly. Service Report responses apply only to the selected issue's ReportContent presentation; attendance acceptance is separate. Missing bytes retain original metadata and an owned recovery handover, never a replacement download.

The 200-visible-record family windows can be incomplete: show the explicit coverage and window count instead of a complete total. Phone cards must retain these qualifiers and the exact selected issue context. Missing native desktop/mobile implementation comparison images are explicitly pending. The issued HTML above remains the visual reference. [Execution evidence](../../../testing/evidence/output-register/README.md) is separate from visual review and deployment.

## Controlled action receiving increment — 13 October 2026

The [action API](../../../contracts/output-actions.md) delegates issue, Pack withdrawal and original render recovery to native services. Its synthetic distribution ledger keeps exact issue/recipient attempts and additive reconciliation. New commands require current source permissions. Desktop and mobile designs must retain the original operation, current attempt version, recovery owner and the explicit Synthetic label. An unknown outcome blocks a replacement attempt until reconciled. Real sending, delivery, opens and responses must remain distinct. No new native controls or accepted comparison images are delivered here; visual/device review remains pending.
