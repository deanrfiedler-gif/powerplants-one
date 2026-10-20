# Create discovery workspace — page contract

<!-- versioning: git; committed history is authoritative -->

Stable entry: `route:/estimating/discovery/new`. Scope: **ES-02**, PPO-010, EST-01–EST-09. Owner: Dean Fiedler. Page type: r20 record workspace with an opportunity intake step. Owner visual review: **pending**. Functional evidence and deployment are separate.

## Authority and visual source

Build from **PPO - Design**, page `1414:356570`, named version **Create discovery workspace — accepted**, confirmed against file index `630:2`. The [accepted decision](../../../decisions/create-discovery-workspace-figma-design.md) records D1–D7 and Q1–Q4. Read the live notes card `1416:366159`.

| Reference | Nodes |
|---|---|
| Desktop choose / first Requirements, full length | `1415:1065`, `1414:356639` |
| Review and create / dialog content | `1416:2974`, `1416:3223` |
| Tablet | `1416:361254` |
| Phone choose, 390 / 320 | `1416:361934`, `1416:364983` |
| Phone Requirements / full length | `1416:363399`, `1416:364882` |
| Creating / outcome unconfirmed / already exists / not permitted | `1416:7553`, `1416:7630`, `1416:7715`, `1416:7799` |
| Needs attention / no eligible opportunities / phone loading | `1416:359389`, `1416:359903`, `1416:365050` |
| Parts / Opportunity choice row / notes | `1415:360239`, `1415:360253`, `1416:366159` |

The [eleven retained icon-free captures](../../../reference/ui/estimating/create-discovery-workspace-figma-design-r01/README.md) remain immutable evidence. Live frames supply layout and variants; the captures cross-check provenance. The older [wizard HTML](../../../reference/ui/estimating/PPO-Estimation-Wizard-Container-r03.html) is historical context.

The later [reviewed creation direction](../../../decisions/discovery-creation-journey.md) authorises initial estimator assignment and saving the exact accepted Sales link in the creation transaction. [Creation contract](../../../contracts/discovery-creation.md) and [LC-13](../../../contracts/lead-to-delivery-continuity.md) govern the relationship. Sales receiver, creator and assigned estimator remain distinct. This page introduces no migration, capability, dependency or operating rule; it depends on the separate prerequisite.

## Journey and current data

1. Choose one of the newest 100 eligible native opportunities, using search and radio rows. Existing `estimatingOptions` remains authoritative. Rows show internal reference, customer, optional Site and permitted Sales brief state. Restricted Sales context is labelled unavailable without its revision.
2. Continue to the five-step first discovery. Entry from an accepted Sales handover skips selection and locks its opportunity. Review Sales problem and scope in the disclosure. Q01–Q03 start as reported **Answered** statements, never Confirmed; full text is retained even if it exceeds the discovery field limit.
3. Requirements, Configuration, Scope & delivery, Pricing and Review share one draft. Work tags, effort, confirmations and follow-up reasons require explicit input. Required unconfirmed answers need eligible owners and reasons. The adopted six-family catalogue starts new configuration; no family implies technical suitability.
4. Review and create from any step once the minimum is recorded. Server preview rechecks current context. The dialog names opportunity, estimator, exact brief, first option/revision, scope and owned follow-ups. Require a change reason and acknowledgements of values explicitly marked Confirmed.
5. Only a successful receipt establishes the saved workspace. General entry opens its Requirements step; Sales entry returns to the handover with the created workspace reference. Existing-workspace linking retains its separate reviewed command.

Before creation, Alternatives and Revisions show zero. No price is calculated: cost basis is Not costed and routing Not configured. Readiness stays Not checked until server preview, then displays its result.

## Desktop

Use the existing shell, Estimating navigation group and page guide. At 1440 px retain the 240 px rail, 380 px summary, ruled context/tabs, five 48 px steps and 64 px footer. No extra module container. Main column and summary own separate scrolling. Choice rows are compact and keyboard-selectable. Started discovery steps retain “In progress” when navigating elsewhere; visiting a step does not claim completion or saved readiness.

At 1024 px the existing wizard rule uses the 76 px rail; Summary opens a native dialog. Requirements uses two-column canonical context, full-width included work and half-width declarations. AreasEditor, FamilyOverview, SystemsEditor and ResponsibilitiesEditor retain their editing contracts.

“Review site scope and effort details” also retains the existing work-tag facility membership and specialist-clarification controls through DiscoveryFields. These legacy scope declarations remain distinct from technical equipment families.

## Mobile

At 390 and 320 CSS px use the shared compact phone header, wrapped radio rows, equal view tabs, viewed alternative and step selector. The footer retains Summary and Create workspace; the scroll region contains the same draft. Native dialogs contain keyboard focus, Escape closes dismissible states and closing restores the opener. Creating is not dismissible.

Use visible focus, labelled inputs, associated validation, keyboard tabs and selected-step semantics. Go to first reaches the incomplete field or its editor. Colour supplements state words.

This route is **online only** under the [offline contract](../systems/offline.md). Draft and pending original request remain in page memory. No offline queue, autosave, reload recovery or device persistence is claimed. Identity changes clear the business view. Unsaved navigation is guarded.

## States and recovery

- Loading has four skeletons and disabled continuation. Empty eligibility and filtered-empty have distinct copy/actions. Read failure offers reload.
- Validation preserves input and links to the first issue; server validation remains authoritative.
- Sales source drift requires renewed review without overwriting discovery entries.
- Creating freezes reviewed input and close controls.
- An unconfirmed outcome retains the original operation and payload. Confirm original save outcome checks its receipt and, only if absent, retries that exact request. Access loss during recovery keeps the outcome unconfirmed; it does not claim nothing was saved.
- A definite duplicate refusal offers only a currently permitted existing workspace. Entries are not copied. A definite creation permission refusal says nothing was created by that request.

## Shared controls and adaptations

Reuse Button/ButtonLink, Field/SelectField, ValidationFields/ErrorNotice, RecordTabs, usePhoneHeader, useCrmResource/useCrmCommand, AnswerFields/FollowUpFields, AreasEditor, FamilyOverview, SystemsEditor, ResponsibilitiesEditor, SalesBriefContent, wizard Icon/StateTag/Tag/Dot/Row/ChangeMarker and WizardDialog. WizardDialog is extracted from the saved wizard; creation adds busy dismissal and opener-focus handling. Icons resolve through `font-awesome-icons.ts`; no artwork is retained.

The command hook adds an opt-in to retain an unconfirmed creation after a failed recovery lookup; other callers keep their behaviour. Consumer bindings, fixture states and alignment gaps are maintained in the component catalogue.

Explicit adaptations for owner visual review:

- Combined creation replaces the older separate-link banner, as authorised by the later direction.
- The compact shared phone header supersedes the earlier task header.
- Follow-up totals follow existing rules, not the example's two items. Answer state/source/follow-up details use the existing dialog editor; brief texts remain directly editable.
- Required work tags and scope/effort controls remain visible. Phone area/family controls continue below the brief to retain the shared wizard's authoring capability.
- Readiness and confirmation counts are not asserted before successful preview.
- The shared permission-filtered shell supplies the current navigation and breadcrumb; the capture fixture exposes fewer shortcuts than the design sample. Existing family cards retain their current catalogue copy and horizontal phone strip. Technical areas/systems start empty until entered; the populated Figma example is not an inferred Sales-to-configuration mapping.
- Estimator choices are bounded to the first 100 active users, creator first then name/ID, with a truncation message.

## Verification and open questions

`tests/helpers/discovery-creation.ts` supplies stable synthetic API observations. Unit proofs protect Sales provenance, explicit follow-ups and oversized text. Browser proofs cover responsive selection, direct Sales entry, validation, original recovery through access loss, duplicate/denied outcomes and busy freezing. A focused database proof additionally checks eligible choice metadata, disappearance after creation, cross-workspace refusal and current-access refusal on the existing-workspace link. API observations do not substitute for the prerequisite transactional database tests.

See [execution evidence](../../../testing/evidence/create-discovery-workspace/README.md) for actual results and limits. Owner visual review, physical devices, screen-reader and 200% browser zoom review remain pending. No reviewer, date or fingerprint has been copied.

Open questions: scalable estimator search beyond the bounded list; future reload-safe draft/recovery requirements; phone Alternatives/Revisions compositions beyond zero-state guidance. No guessed behaviour implements these. Accepted Q1–Q4 choices remain recorded.
