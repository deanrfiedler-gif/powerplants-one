# Sites CS-04 implementation

<!-- versioning: git; committed history is authoritative -->

Owner: Dean Fiedler. Contributor: this Codex Sites session, branch `codex/sites-cs04`, dedicated worktree from main `971ac350`. Preflight complete; implementation awaiting the numbering clarification below. Owner visual review pending.

Authority: [Sites accepted design](../decisions/sites-figma-design.md), PPO - Design, page `1375:2901`, named version **Sites — accepted**. Desktop register `1375:2937`, overview `1375:3183`, equipment `1375:3312`; tablet `1375:3449`; phones `1375:328008`, `1375:3678`, `1379:2365`; states `1375:328046`, `1375:328103`, `1375:328145`; notes `1380:2175`. The later [compact phone header](../decisions/phone-header-amendment.md) applies. Existing [icon-free captures](../reference/ui/sites/sites-design-r01/README.md) stay unchanged.

## Build plan

- Refine existing `/sites` and `/sites/[id]`, with page-specific components/styles and scoped read models under `src/shared/`. Preserve existing receiving routes, identity and permissions.
- Reuse the application shell and compact phone header, SecondaryMenuFrame, RegisterTable, RegisterSortHeader, RegisterChip, Button/ButtonLink, RecordTabs/RecordPanel, WorklistChoice/Menu/Panel, ReadState and existing mapped icons/tokens. Catalogue edits are limited to Sites consumer bindings and state evidence.
- Read synthetic Site, party/contact, facility/equipment, visit and permitted work data from existing sources. Show source absence and restricted reads explicitly. P4 customer confirmation is outside scope: readiness links to CS-06 and never grants work authority. No migration, capability, dependency, Conversations action or production integration.
- Add meaningful read-scope, state, filtering, exact handover and responsive browser tests, with synthetic fixtures. Compare desktop 1440, tablet 1024, phone 390/320 and the drawn states against live Figma.
- Update the three CS-04 page contracts, narrow register/guide/component bindings, status fragment and generated build sequence in this PR. Leave owner review pending.
- Run studio, lint, typecheck, unit, build, naming and foundation checks as applicable. Record Windows limitations and reproduce any suspected baseline failure on unmodified main.

## Risks and unresolved design

P4 is unbuilt; the drawn confirmed/reconfirmed customer-readiness story cannot be reported as live operating state. Undrawn tabs, editing/creation, restricted states and checkbox actions retain existing behaviours or explicit unavailable explanations. No invented business workflow. The accepted phone amendment supersedes duplicate phone toolbar rows. People PR #625 is a separate active claim; its source files are not owned here. No independent review, deployment or owner/device acceptance is claimed.

## Numbering clarification required before implementation

Q3 and the accepted frames specify `SYN-SITE-…`. The running synthetic database instead uses canonical `SYN-PPO-SITE-…` references. A read-only inspection on 20 October 2026 confirmed that all 23 Site rows in that local database have a number. The live `ppo.register_identity` trigger allocates the `SYN-PPO` prefix, validates that prefix and raises `Reference is permanent` when an existing reference is changed. This is current-schema evidence, not an assumption from the original migration.

Recommended resolution for Dean: display the existing canonical `SYN-PPO-SITE-…` reference on every Site and record the spelling difference from Figma as an explicit implementation deviation. Do not strip the prefix in presentation, allocate an alias or rename existing identities. If the shorter spelling remains a requirement, settle its identity and migration scope separately before code proceeds. Dean's build instruction explicitly requires a stop for a material source conflict or an unauthorised migration; no acceptance of this recommendation is implied.

## Preflight evidence

The Git acceptance record, live notes card and File index agree on CS-04 and the accepted design. Live screenshots of all ten viewport/state frames plus the notes card were read privately; high-fidelity design context and tokens were retrieved, with register/tablet context split into visible child nodes where the full frame response was sparse. Existing icon-free repository captures remain unchanged. No Figma link, file key or licensed artwork is retained in this contribution.

Existing routes, Site reads, permanent identifiers, equipment installed/served reads, permissions, shared controls, page contracts, build queue and offline boundary were inspected. The existing dependencies were installed without changing the lockfile. Application implementation and verification have not started; this draft currently changes only this build/clarification record.
