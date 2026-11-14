# Mailbox connection and synchronisation status — design reference

Stable entry: `scope:EC-02`. Owner: Dean Fiedler. Status: **Refined Figma design owner-accepted, 13 November 2026; not built to it**. The guidance below remains a draft for visual review.
Source baseline: `ccc2251bbba9df266cac9027ddaa9418ab9abc1d`. Application destination: `/email/connections`.
This is an editable working specification. Existing accepted page baselines take precedence over these proposed common-layout rules. A blank review record is not approval.

## Purpose and task

Implement mailbox connection, consent, sync health, reconnect and removal/purge status.

1. Inspect connection and last-success information
2. Resolve consent or provider failures through the supported process
3. Review removal and retained-data implications

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

Refined design, owner-accepted 13 November 2026: the private Figma file "PPO - Settings module", page "My account and preferences · SH-03 · SH-05 · EC-02" (`11:15`, 26 sheets: desktop at 1440, dialogs and panels, states, tablet at 1024, phone at 390 and 320). The [Settings refined UI record](../../../decisions/settings-module-refined-ui-proposal.md) lists each sheet with its node ID in section 3 and records the acceptance in section 11. It is drawn inside the accepted shell and governs layout, states and wording where it differs from this page. The page is shared with SH-03 and SH-05; the mailbox connection sheets are this scope's part. Build basis: the named version "PPO - Settings module (accepted)", saved by Dean on 13 November 2026 (record section 12). No image export is retained in the repository and no application capture exists. Visual review, functional proof and deployment remain separate.

No exact image or HTML reference is linked. Keep this gap visible.

## Behaviour, handovers and verification

The draft User Guide `guide.ec.02` carries prerequisites, tasks, outcomes and recovery. Review that article against the running release before publication. Keep source presence, visual review, functional testing, owner acceptance and deployment separate.

Acceptance evidence is pending. Capture matching original-reference and application views, then verify keyboard order, focus return, 200% zoom, wrapping, scroll ownership, phone states and the relevant business journey. Do not replace a comparison image simply to make a test pass.
