# PPO Assistant — Direction and architecture decision

**Document:** PPO-AI-DEC · **Revision:** r01 · **Date:** 8 September 2026 · **Owner:** Dean Fiedler · **State:** Design direction authorised; implementation architecture proposed; runtime not implemented.

## Decision and authority

Dean requested an assistant for internal search, typed/spoken record creation, summaries, equipment knowledge and email drafting, then authorised proceeding with the proposed design/implementation specification. Prepare and publish the [bounded specification](../blueprints/ppo-assistant-specification.md). Start the planned scope with customer CRM search/summary and reviewed opportunity plus initial Activity creation. Voice, email and wider knowledge follow their evidence dependencies.

This is a bounded D-027 direction within PPO-009/#9 and shared architecture work. Existing D-027 scope stays open for broader AI and other optional capabilities. Preserve all 78 parents, original decision wording, issued source bytes and P01–P12 order. Current user direction brings design forward from the master's later-wave default; it does not authorise paid services, operational records or implementation in this contribution.

## Proposed architecture and alternatives

Keep ADR-0003/ADR-0015's modular monolith and PostgreSQL business boundary. Add narrow server tools that project permitted records and prepare validated proposals. Real users confirm a fixed proposal through a separate server route; the model receives no confirmation capability. Reuse `createOpportunity` and `sharedOperation` rather than parallel writes or a privileged AI identity.

Use a durable actor-bound proposal/intent to bridge review and uncertain-save recovery; it retains the original command/operation identity without becoming another customer/activity store. Existing CRM mutation, audit, receipt and outbox remain atomic. Proposal metadata may lag and must reconcile from those receipts. Extract read-only authority validation only with regression proof; allocate additive schema at implementation against current main.

Choose a deterministic, clearly labelled provider adapter for the first local workflow proof. Recommend evaluating the direct OpenAI API first for live synthetic use, with Azure OpenAI in Microsoft Foundry retained as an alternative. The specification records dated primary sources and costs. No exact SDK/model pin or provider purchase is made by this decision.

| Alternative | Reason for disposition |
|---|---|
| Unrestricted database/SQL agent | Rejected: bypasses narrow read projections and introduces an unnecessary arbitrary-query boundary |
| Browser automation to fill PPO forms | Rejected for the app assistant: domain commands supply a stable permission/transaction contract |
| Stateless draft only | Insufficient for the proposed browser-restart/uncertain-command recovery requirement; use minimal durable intent, not full chat storage |
| Hosted file/vector index in AI1 | Deferred: bounded relational records answer the selected questions; document ingestion, revision/deletion and index permissions need a later case |
| Separate microservice or agent framework | Deferred: no demonstrated need; thin adapters and existing services suffice for this pilot |
| Direct OpenAI versus Azure OpenAI | Direct API is the first evaluation candidate; Azure alignment is useful but actual region/model/tenant and cost are unverified. Preserve replaceability. |

## Consequences and review triggers

The assistant can only populate implemented fields; no opportunity money, closing date or transfer is added implicitly. It cannot approve designs, issue quotations, authorise costs, change equipment settings or send customer commitments. Internal summaries cite permitted source records and disclose coverage. Normal screens and receipt recovery continue when AI is unavailable or the budget is exhausted.

Review this design when CRM schema/permissions change, a provider/data-region requirement changes, evaluations fail, actual usage invalidates costs, remote identity becomes available, or a wider source requires document-level permission/revision controls. AI1 implementation and live-model validation require their own actual evidence; design publication establishes neither.

Publication and failed-check dispositions are recorded in the [handover](../delivery/ppo-assistant-handover.md) and its linked PR. No new numbered ADR or migration is reserved while concurrent work is active.
