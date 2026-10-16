# PPO Assistant — Direction and architecture decision

**Document:** PPO-AI-DEC · **Revision:** r01 · **Date:** 8 September 2026 · **Owner:** Dean Fiedler · **State:** Design direction authorised; implementation architecture proposed; runtime not implemented. Amendment A1 (Claude API as first live provider) proposed 16 October 2026 and awaiting Dean's decision.

## Decision and authority

Dean requested an assistant for internal search, typed/spoken record creation, summaries, equipment knowledge and email drafting, then authorised proceeding with the proposed design/implementation specification. Prepare and publish the [bounded specification](../blueprints/ppo-assistant-specification.md). Start the planned scope with customer CRM search/summary and reviewed opportunity plus initial Activity creation. Voice, email and wider knowledge follow their evidence dependencies.

This is a bounded D-027 direction within PPO-009/#9 and shared architecture work. Existing D-027 scope stays open for broader AI and other optional capabilities. Preserve all 78 parents, original decision wording, issued source bytes and P01–P12 order. Current user direction brings design forward from the master's later-wave default; it does not authorise paid services, operational records or implementation in this contribution.

## Proposed architecture and alternatives

Keep ADR-0003/ADR-0015's modular monolith and PostgreSQL business boundary. Add narrow server tools that project permitted records and prepare validated proposals. Real users confirm a fixed proposal through a separate server route; the model receives no confirmation capability. Reuse `createOpportunity` and `sharedOperation` rather than parallel writes or a privileged AI identity.

Use a durable actor-bound proposal/intent to bridge review and uncertain-save recovery; it retains the original command/operation identity without becoming another customer/activity store. Existing CRM mutation, audit, receipt and outbox remain atomic. Proposal metadata may lag and must reconcile from those receipts. Extract read-only authority validation only with regression proof; allocate additive schema at implementation against current main.

Choose a deterministic, clearly labelled provider adapter for the first local workflow proof. Recommend evaluating the direct OpenAI API first for live synthetic use, with Azure OpenAI in Microsoft Foundry retained as an alternative. The specification records dated primary sources and costs. No exact SDK/model pin or provider purchase is made by this decision. Proposed [Amendment A1](#proposed-amendment-a1--claude-api-first-16-october-2026) would make the direct Claude API the first live candidate instead; this paragraph stands until Dean decides.

| Alternative | Reason for disposition |
|---|---|
| Unrestricted database/SQL agent | Rejected: bypasses narrow read projections and introduces an unnecessary arbitrary-query boundary |
| Browser automation to fill PPO forms | Rejected for the app assistant: domain commands supply a stable permission/transaction contract |
| Stateless draft only | Insufficient for the proposed browser-restart/uncertain-command recovery requirement; use minimal durable intent, not full chat storage |
| Hosted file/vector index in AI1 | Deferred: bounded relational records answer the selected questions; document ingestion, revision/deletion and index permissions need a later case |
| Separate microservice or agent framework | Deferred: no demonstrated need; thin adapters and existing services suffice for this pilot |
| Direct OpenAI versus Azure OpenAI | Direct API is the first evaluation candidate; Azure alignment is useful but actual region/model/tenant and cost are unverified. Preserve replaceability. |
| Direct Claude API funded by Max 20x API credits | Proposed in Amendment A1 as the first live synthetic evaluation candidate, ahead of both OpenAI options; awaiting Dean's decision. |

## Proposed Amendment A1 — Claude API first (16 October 2026)

**Status:** Proposed by Claude on 16 October 2026; not accepted. Revision r01 is unchanged until Dean decides. Acceptance would issue r02 of this record and update the [document register](../standards/document-register.csv). Where A1 differs from the section above, A1 governs only once accepted.

**Question.** On 16 October 2026 Dean asked whether the US$200 of monthly API credit in his Claude Max 20x plan could fund the PPO AI module. It can for the direct Claude API. The credit lands in one Claude Console organisation linked to the plan and pays for Claude API requests. It cannot be spent through Azure, Bedrock or Vertex. Specification §8 records the dated programme rules, data handling and costs.

**Proposal.**

1. Add the direct Claude API as a provider candidate. PPO's server would call it through a Console organisation linked to Dean's Max 20x plan.
2. Recommend it as the first provider for AI1's live synthetic evaluation, ahead of the direct OpenAI API.
3. Keep the direct OpenAI API and Azure OpenAI in Microsoft Foundry as alternatives behind the same replaceable provider adapter. The labelled deterministic adapter stays the default for the first implementation and its tests.
4. Keep the proposed US$30 monthly synthetic ceiling, enforced in PPO. Back it with a dedicated workspace spend limit, and leave the linked organisation with no purchased credits and auto-reload off, so that spent credit stops requests instead of charging a card.

**Reasons.** The credit already exists, so evaluation needs no new spend or account purchase. When it runs out with no other balance, requests stop rather than bill, which matches the specification's fail-closed budget. At the specification's reference assumption and the Claude Sonnet 5.5 rate, the US$30 ceiling covers about 900 tasks with contingency, and the full credit about 6,000. Claude supports application-executed tools with strict schemas and JSON structured outputs, which is the contract the adapter already assumes. Anthropic's Commercial Terms bar training on customer content. Because the adapter boundary is unchanged, changing provider later costs adapter work and a fresh evaluation, not a redesign.

**Constraints and risks.**

- The credit belongs to Dean's Max 20x subscription. It links to one Console organisation, which only Anthropic support can change. It expires each billing cycle without rollover, is shared by every key and workspace in that organisation, and stops if the plan ends.
- The credit covers the direct Claude API only. Claude in Microsoft Foundry, Bedrock or Vertex would be billed separately.
- There is no Australian processing or storage option. Inference runs globally by default or US-only at 1.1 times the price, and workspace data at rest is stored in the US.
- Retention is not zero. Anthropic's commercial policy deletes API inputs and outputs within 30 days, keeps flagged content for up to two years, and zero data retention needs a separate sales arrangement.
- Rates and programme rules change, so recheck them before each funded run. Model quality for these tasks is unmeasured; the model is chosen from the AI1 evaluation.

| Option under A1 | Disposition |
|---|---|
| Direct Claude API, credit-funded | Proposed first live synthetic evaluation provider |
| Direct OpenAI API | Retained alternative; becomes first again if A1 is declined; needs its own account and budget |
| Azure OpenAI in Microsoft Foundry | Retained alternative for an Azure/Entra operating model; region, model and cost remain unverified |
| Claude in Microsoft Foundry, Bedrock or Vertex | Not proposed now: the credit does not apply and billing is separate; a possible later Azure-aligned Claude route |
| Buy API credits or enable auto-reload | Not proposed: turns credit exhaustion into continued spend; needs a separate paid-use decision |

**Not authorised by A1.** This amendment does not create or link a Console organisation, claim credits, create an API key, buy a service, use real or operational data, add runtime code or a migration, or pin a model or SDK. A live evaluation still needs a named billing owner, an approved ceiling, a server-held secret outside Git, restricted outbound destinations, and the specification's other pre-call checks.

**Decision required.** Dean can accept, amend or decline A1. The billing owner, data region, retention settings and authority for real data stay open whichever he chooses.

**Dean's decision:** Not yet given. Record his exact words here when he decides.

## Consequences and review triggers

The assistant can only populate implemented fields; no opportunity money, closing date or transfer is added implicitly. It cannot approve designs, issue quotations, authorise costs, change equipment settings or send customer commitments. Internal summaries cite permitted source records and disclose coverage. Normal screens and receipt recovery continue when AI is unavailable or the budget is exhausted.

Review this design when CRM schema/permissions change, a provider/data-region requirement changes, evaluations fail, actual usage invalidates costs, remote identity becomes available, or a wider source requires document-level permission/revision controls. AI1 implementation and live-model validation require their own actual evidence; design publication establishes neither.

Publication and failed-check dispositions are recorded in the [handover](../delivery/ppo-assistant-handover.md) and its linked PR. No new numbered ADR or migration is reserved while concurrent work is active.
