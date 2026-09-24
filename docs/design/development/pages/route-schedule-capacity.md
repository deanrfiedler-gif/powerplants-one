# Cross-domain resource demand and capacity — design contract

Stable entry: `route:/schedule/capacity`. Owner: Dean Fiedler. Status: **Draft for visual review**.

## Native workflow

Page type: **Review / comparison**. Canonical destination: `/schedule/capacity`. Source authority: [PPO-SCHED-ADR](../../../decisions/scheduling-resources-architecture.md).

1. Select a 7-, 28- or 90-day horizon, display timezone and permitted site. Review each source domain’s completeness or Unavailable state.
2. Filter by domain, source commitment, resource mapping, required skill or unknown effort. Unknown resource/skill filters explicitly retain missing mappings.
3. Review source references, UUIDs, versions/as-at, customer/site context, owner, time basis and next action. Follow the exact owning-domain link for resolution.
4. Exclude contributions from an analytical scenario and compare its count and reserved resource minutes against the visible baseline. Reset or refresh discards the scenario.

Project programme dates and Engineering required dates never become labour effort. Service reservations include crew and explicit buffers; they are not labour estimates. No utilisation denominator or percentage is claimed.

## Desktop

Place source availability first, then horizon/domain/commitment/resource/skill filters, analytical comparison, supply basis and exact contributing records. Use readable cards at 1440 x 960 and 1024 x 768. Never make programme duration or due dates an effort quantity.

## Mobile

Stack filters and evidence cards at 390 x 844 and 320 CSS px. Scenario checkboxes have explicit labels; source/owner links and unknown effort remain readable. No utilisation gauge, automatic application or hidden mutation action appears. Review native 200% browser zoom separately; CSS-width reflow is not a substitute.

## Shared components and states

CapacityWorkspaceScreen and shared ReviewSelect/WindowControls composition over Field, SelectField, ReadState, Stamp, Button/ButtonLink and the native shell. This page does not consume PlannerBoard.

Loading, empty/filtered empty, failed and denied reads remove prior evidence. Words identify Unknown and source completeness. These review pages have no source-mutation save action; analytical state is explicitly disposable.

## Handovers and authority

Incoming: repeatable-read, independently scoped Service, Projects and Engineering contributions. Outgoing: exact source-owned records and named next actions. Exclusions compare analytical counts/reservation minutes and reset on refresh. Unknown effort prevents a defensible net-capacity or overload calculation; inspect supplied busy/block intervals for reservation conflicts.

## Visual references and verification

No exact page-specific retained HTML or accepted mockup exists. The native composition is proposed for owner visual review.

[Executed checks, inspected captures and remaining review](../../../testing/evidence/scheduling-resources/README.md) identify the exact evidence. Draft guides, source presence, functional proof, owner visual acceptance and deployment remain separate. No review fingerprint is adopted by this edit.
