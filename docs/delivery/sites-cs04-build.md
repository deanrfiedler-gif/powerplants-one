# Sites CS-04 implementation

<!-- versioning: git; committed history is authoritative -->

Owner: Dean Fiedler. Contributor: this Codex Sites session, branch `codex/sites-cs04-page`, dedicated worktree updated through main `4c1097cc`. PR #626 merged the preflight record; PR #635 merged the reference decision and build claim only. This follow-up contains the page implementation. Owner visual review pending.

Authority: [Sites accepted design](../decisions/sites-figma-design.md), PPO - Design, page `1375:2901`, named version **Sites — accepted**. Desktop register `1375:2937`, overview `1375:3183`, equipment `1375:3312`; tablet `1375:3449`; phones `1375:328008`, `1375:3678`, `1379:2365`; states `1375:328046`, `1375:328103`, `1375:328145`; notes `1380:2175`. The later [compact phone header](../decisions/phone-header-amendment.md) applies. Existing [icon-free captures](../reference/ui/sites/sites-design-r01/README.md) stay unchanged.

## Build plan

- Refine existing `/sites` and `/sites/[id]`, with page-specific components/styles and scoped read models under `src/shared/`. Preserve existing receiving routes, identity and permissions.
- Reuse the application shell and compact phone header, SecondaryMenuFrame, RegisterTable, RegisterSortHeader, RegisterChip, Button/ButtonLink, RecordTabs/RecordPanel, WorklistChoice/Menu/Panel, ReadState and existing mapped icons/tokens. Catalogue edits are limited to Sites consumer bindings and state evidence.
- Read synthetic Site, party/contact, facility/equipment, visit and permitted work data from existing sources. Show source absence and restricted reads explicitly. P4 customer confirmation is outside scope: readiness links to CS-06 and never grants work authority. No migration, capability, dependency, Conversations action or production integration.
- Add meaningful read-scope, state, filtering, exact handover and responsive browser tests, with synthetic fixtures. Compare desktop 1440, tablet 1024, phone 390/320 and the drawn states against live Figma.
- Update the three CS-04 page contracts, narrow register/guide/component bindings, status fragment and generated build sequence in this PR. Leave owner review pending.
- Run studio, lint, typecheck, unit, build, naming and foundation checks as applicable. Record Windows limitations and reproduce any suspected baseline failure on unmodified main.

## Risks and unresolved design

P4 is unbuilt; the drawn confirmed/reconfirmed customer-readiness story cannot be reported as live operating state. Undrawn tabs, editing/creation, restricted states and checkbox actions retain existing behaviours or explicit unavailable explanations. No invented business workflow. The accepted phone amendment supersedes duplicate phone toolbar rows. The merged People patterns are preserved; Sites uses the shared frame’s phone-header binding. No independent review, deployment or owner/device acceptance is claimed.

## Numbering clarification resolved

Q3 and the accepted frames specify `SYN-SITE-…`. The running synthetic database instead uses canonical `SYN-PPO-SITE-…` references. A read-only inspection on 20 October 2026 confirmed that all 23 Site rows in that local database have a number. The live `ppo.register_identity` trigger allocates the `SYN-PPO` prefix, validates that prefix and raises `Reference is permanent` when an existing reference is changed. This is current-schema evidence, not an assumption from the original migration.

Dean approved adopting the shorter convention deliberately on 20 October 2026: "I am happy for you to adopt the shorter convention deliberately, as per your recommendation." The implementation uses `SYN-SITE-…` as the public Site reference, preserves the permanent stored identity as its legacy reference and accepts both in Site searches. UUID links remain stable. This is an explicit reference/lookup contract, tested at the API boundary, rather than a cosmetic replacement in a component. It requires no schema change or rewrite of issued records. The same convention may be adopted for other record types in their own bounded changes; this CS-04 change applies it only to Sites. See the [reference decision](../decisions/site-reference-convention.md).

## Preflight evidence

The Git acceptance record, live notes card and File index agree on CS-04 and the accepted design. Live screenshots of all ten viewport/state frames plus the notes card were read privately; high-fidelity design context and tokens were retrieved, with register/tablet context split into visible child nodes where the full frame response was sparse. Existing icon-free repository captures remain unchanged. No Figma link, file key or licensed artwork is retained in this contribution.

Existing routes, Site reads, permanent identifiers, equipment installed/served reads, permissions, shared controls, page contracts, build queue and offline boundary were inspected. Existing dependencies were installed without changing the lockfile. PRs #626 and #635 merged the preflight and numbering records while implementation continued in the isolated worktree; this PR contains the code and verification evidence.

## Implementation and adaptations

The page-specific `sites-register.tsx` and `site-workspace.tsx` replace only the existing Sites route compositions. `src/shared/sites.ts` supplies permission-scoped rows, view counts, contact, facility/equipment counts and permitted visits; the overview keeps independent work-order, follow-up and survey source states. `site-reference.ts` defines short/previous-reference compatibility at the shared Site read/search boundary. Existing UUID links and primary-contact/party/history commands remain in use.

Reused: SecondaryMenuFrame and compact phone-header bindings; Button/ButtonLink; RegisterTable, RegisterSortHeader, RegisterChip and RegisterFooter; RecordTabs/RecordPanel; WorklistChoice, WorklistMenu and WorklistPanel; ReadState; ProductIcon through the existing icon mapping; FacilityRegister; SitePrimaryContact. Shared menu CSS changes only add the Sites consumer selector. No new shared control, dependency, schema, grant or capability.

The CS-04 scope and both route contracts, register entries and Draft guides describe the actual controls. Component bindings, host states and the Sites fixture manifest are updated. The status fragment generates STATUS and the decision index; the build sequence is generated into `tmp/` under the current repository rule.

Explicit differences from the accepted frames:

- P4 is unavailable. Readiness links to CS-06; the design's synthetic confirmed/reconfirmed story is not asserted as live data. The Readiness view lists upcoming permitted visits and says so.
- Local Site filtering is offered in Search and filter; the global shell search retains its existing cross-application purpose.
- Site rows include the short reference, so long rows can exceed the drawn 40 px. Shared dates retain year and time-zone information; long values wrap.
- The later accepted compact phone header replaces duplicate phone toolbar rows. Phone actions use 44 px targets.
- Equipment groups use recorded installation facilities without inventing a parent-building relationship. Installed and served locations remain separate.
- Undrawn tabs, details and restricted/partial states use existing controls. Work/History do not show invented combined totals. Work rows are labelled as permitted work rather than implying every source has an open/closed definition. Record position is shown only for a complete returned population.
- Synthetic comparison fixtures preserve composition but use explicit P4-unavailable wording. Application captures use the repository's fallback icons with the private kit omitted; no Pro artwork is retained.

Open for Dean: owner visual review of the implementation and these adaptations; review of the undrawn tabs and source-state wording. No implementation decision grants visual approval or business acceptance.

## Verification and PR repair — 21 October 2026

PR #640 initially failed TypeScript because the survey link used an unsupported icon name. It now uses the existing mapped clipboard icon. Current main is merged, retaining People, Service reports and Discovery component consumers and regenerating the status/index from all fragments. The phone filter now uses the shared dialog's initial Close focus, keyboard navigation and opener restoration; the frame owns its phone-header registration.

The Contacts deterministic builder also pinned the changed shared-read source. Its Person projection, visibility, filtering and pagination were re-read and remain unchanged: only the Site branch maps references. The Reports pin was already stale on unmodified main `4c1097cc`; its register additions preserve the named-primary-contact approval contract. Both content pins were refreshed after that check. The issued Contacts HTML is byte-identical, and all 103 Contacts model groups pass. No owner-review fingerprint or reference capture is changed.

| Check | Executed result |
| --- | --- |
| `npm run studio:check` | Pass after merge: 366 entries, 48 components; owner reviews still pending. |
| `python scripts/check_naming.py` | Pass after merge: 745 records. |
| Contacts builder `--check` and model | Pass after source-contract inspection; issued HTML unchanged; 103/103 groups. |
| `npm run lint`, `npm run typecheck` | Pass on the merged branch. CI merged-tree typecheck also passes at `3ecd0135`. |
| `python scripts/check_foundation.py` | Pass locally and in CI after merge; all 78 parent requirements retained. |
| Focused reference/development unit tests | 10/10 pass on the merged branch, including history. Full unit attempts did not complete under Windows memory pressure; two document-store failures reproduced on pristine main `8f5ad31b`. No full unit-suite pass claimed. |
| Sites database assertions | 3/3 pass with the normal reset/seed hook on isolated `ppo_synthetic_test`. The first run hit its 120 s setup deadline; the rerun used a 600 s process deadline and completed in 81 s. Assertions and hooks were unchanged. |
| Sites browser tests | All three journeys pass: both fixture journeys at 1440/1024/390/320, including keyboard focus and handovers, plus the real API short/legacy reference and record-page journey against the compiled app and seeded database at `0a4087c6` (7.1 s). The state capture rerun also passes. Fifteen inspected captures are retained in the evidence folder. |
| `npm run build` | Pass at `0a4087c6`, with `CIRCLE_NODE_TOTAL=2` selecting one worker and private environment values loaded before spawning npm. Earlier attempts stopped under Windows memory pressure or rejected an inherited `--env-file` launcher flag; neither required an application change. |

The CI rerun now passes the merged-tree typecheck and documentation checks, but browser-dependent jobs stop before application tests because the stable installer supplies Chrome 156. The unchanged main guard reproduces the refusal. Dean authorised separate runtime maintenance PR #643; Sites does not alter browser policy. Full runtime CI remains pending that prerequisite. Owner visual/device review, deployment and business acceptance remain pending and separate.
