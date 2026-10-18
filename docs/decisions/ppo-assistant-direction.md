# PPO Assistant — Direction and architecture decision

**Document:** PPO-AI-DEC · **Revision:** r03 · **Date:** 8 September 2026; r02 17 October 2026; r03 18 October 2026 · **Owner:** Dean Fiedler · **State:** Design direction authorised; implementation architecture proposed; runtime not implemented. Amendment A2 (stored record threads) accepted by Dean on 17 October 2026, issuing r02. Amendment A1 (Claude API as first live provider) accepted by Dean on 18 October 2026, issuing r03.

## Decision and authority

Dean requested an assistant for internal search, typed/spoken record creation, summaries, equipment knowledge and email drafting, then authorised proceeding with the proposed design/implementation specification. Prepare and publish the [bounded specification](../blueprints/ppo-assistant-specification.md). Start the planned scope with customer CRM search/summary and reviewed opportunity plus initial Activity creation. Voice, email and wider knowledge follow their evidence dependencies.

This is a bounded D-027 direction within PPO-009/#9 and shared architecture work. Existing D-027 scope stays open for broader AI and other optional capabilities. Preserve all 78 parents, original decision wording, issued source bytes and P01–P12 order. Current user direction brings design forward from the master's later-wave default; it does not authorise paid services, operational records or implementation in this contribution.

## Proposed architecture and alternatives

Keep ADR-0003/ADR-0015's modular monolith and PostgreSQL business boundary. Add narrow server tools that project permitted records and prepare validated proposals. Real users confirm a fixed proposal through a separate server route; the model receives no confirmation capability. Reuse `createOpportunity` and `sharedOperation` rather than parallel writes or a privileged AI identity.

Use a durable actor-bound proposal/intent to bridge review and uncertain-save recovery; it retains the original command/operation identity without becoming another customer/activity store. Existing CRM mutation, audit, receipt and outbox remain atomic. Proposal metadata may lag and must reconcile from those receipts. Extract read-only authority validation only with regression proof; allocate additive schema at implementation against current main.

Choose a deterministic, clearly labelled provider adapter for the first local workflow proof. Recommend evaluating the direct OpenAI API first for live synthetic use, with Azure OpenAI in Microsoft Foundry retained as an alternative. The specification records dated primary sources and costs. No exact SDK/model pin or provider purchase is made by this decision. [Amendment A1](#amendment-a1--claude-api-first-16-october-2026), accepted on 18 October 2026, makes the direct Claude API the first live candidate instead; where this paragraph differs, A1 governs.

| Alternative | Reason for disposition |
|---|---|
| Unrestricted database/SQL agent | Rejected: bypasses narrow read projections and introduces an unnecessary arbitrary-query boundary |
| Browser automation to fill PPO forms | Rejected for the app assistant: domain commands supply a stable permission/transaction contract |
| Stateless draft only | Insufficient for the proposed browser-restart/uncertain-command recovery requirement; use minimal durable intent, not full chat storage |
| Hosted file/vector index in AI1 | Deferred: bounded relational records answer the selected questions; document ingestion, revision/deletion and index permissions need a later case |
| Separate microservice or agent framework | Deferred: no demonstrated need; thin adapters and existing services suffice for this pilot |
| Direct OpenAI versus Azure OpenAI | Direct API is the first evaluation candidate; Azure alignment is useful but actual region/model/tenant and cost are unverified. Preserve replaceability. |
| Direct Claude API funded by Max 20x API credits | Adopted in Amendment A1 (r03, 18 October 2026) as the first live synthetic evaluation provider, ahead of both OpenAI options. |
| Stored, shared threads on records | Adopted in Amendment A2 (r02, 17 October 2026) for the Conversations page; the "Stateless draft only" disposition above stands for side-panel chat. |

## Amendment A1 — Claude API first (16 October 2026)

**Status:** Proposed by Claude on 16 October 2026. Accepted by Dean on 18 October 2026, issuing r03 of this record and updating the [document register](../standards/document-register.csv). The original wording above is kept; where A1 differs from it, A1 governs.

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
| Direct Claude API, credit-funded | First live synthetic evaluation provider (accepted 18 October 2026) |
| Direct OpenAI API | Retained alternative; needs its own account and budget |
| Azure OpenAI in Microsoft Foundry | Retained alternative for an Azure/Entra operating model; region, model and cost remain unverified |
| Claude in Microsoft Foundry, Bedrock or Vertex | Not proposed now: the credit does not apply and billing is separate; a possible later Azure-aligned Claude route |
| Buy API credits or enable auto-reload | Not proposed: turns credit exhaustion into continued spend; needs a separate paid-use decision |

**Not authorised by A1.** This amendment does not create or link a Console organisation, claim credits, create an API key, buy a service, use real or operational data, add runtime code or a migration, or pin a model or SDK. A live evaluation still needs a named billing owner, an approved ceiling, a server-held secret outside Git, restricted outbound destinations, and the specification's other pre-call checks.

**Decision required.** Dean can accept, amend or decline A1. The billing owner, data region, retention settings and authority for real data stay open whichever he chooses.

**Dean's decision (18 October 2026):** "I accept Amendment A1 (Claude API first, credit-funded, US$30 monthly ceiling enforced in PPO, no purchased credits or auto-reload). Record my decision and plan T2." Dean chose this reply from answers Claude offered in the session. It adopts proposal items 1 to 4 as written.

**Provider set-up done at Dean's direction, 18 October 2026.** This set-up is a fact about the account on that date, not something A1 authorised. Dean linked the Max 20x credit to a Claude Console organisation under his work login; it shows US$200 of promotional credit. The organisation holds no purchased credit and no payment method, so auto-reload cannot run. At Dean's request Claude created a dedicated, non-default workspace, "Powerplants One", with a US$30 monthly spend limit. Its data at rest is stored in the United States, and inference is global by default. Dean created an API key scoped to that workspace. It is held only in his git-ignored local `.env.local`, under the PPO-prefixed name `PPO_ANTHROPIC_API_KEY`. A free model-list request with it returned HTTP 200, and no model request has been made. The key, organisation and workspace identifiers are kept out of this public repository.

**Still open after acceptance:**
- **Pre-call checks.** Specification §8 still requires these before any paid call: the PPO-enforced reservation for the ceiling, restricted outbound destinations, and proof that no real data enters requests or logs.
- **Billing owner.** Dean holds the plan, so he funds the synthetic evaluation. Who pays for any operational use is not decided.
- **Data region and retention.** These are as configured above, and they are acceptable only for synthetic data. There is no Australian option and no zero-data-retention arrangement.
- **Real data.** Using operational or customer data is not authorised.
- **Model and SDK.** No model or SDK is pinned. The build that first calls the API pins them.

## Amendment A2 — stored record threads (17 October 2026)

**Status:** Accepted by Dean on 17 October 2026, issuing r02 of this record and updating the [document register](../standards/document-register.csv). Proposed by Claude the same day at Dean's instruction. Where A2 differs from this record or the specification, A2 governs.

**Question.** On 17 October 2026 Dean proposed a dedicated AI and internal communications page. On it, a conversation belongs to a record such as a deal, branches into side conversations, and tags colleagues and the AI agent, provisionally named Carl. He instructed that the AI1 no-stored-chat rule be amended as a proposal. The [AI and internal communications threads proposal](ai-communications-threads-proposal.md) (PPO-AI-THREADS-PROP) quotes his words and holds the design.

**Proposal.**

1. A message posted to a record thread, by a person or by the agent at a person's request, is a stored business communication on that record, visible to the thread's participants. It is not an answer cache.
2. Side-panel chat stays in page memory as specification §7 says, until a person chooses "Keep as a thread".
3. Provider conversation state is still never reused across people. Each agent turn rebuilds its context from records that the current person and the participants can read, and rechecks access before dispatch (specification §6 unchanged).
4. An unsent agent draft is discarded when the person leaves the thread, or after 24 hours.
5. In the synthetic prototype, threads are kept until the synthetic reset. Real retention is a company decision under DOC-06.
6. No raw audio is stored.

**Unchanged by A2.** The model still has no confirmation capability, and there is still no privileged AI identity. Every saved business change still goes through the canonical command with its receipt. The consequences below still apply.

**Not authorised by A2.** This amendment adds no runtime code, migration, route, provider use or real data.

**Dean's decision (17 October 2026):** "I accept the AI and internal communications threads proposal and Amendment A2 with your recommendations and the recommended answers to Q1 to Q12. Carl's name stays subject to his agreement."

## Consequences and review triggers

The assistant can only populate implemented fields; no opportunity money, closing date or transfer is added implicitly. It cannot approve designs, issue quotations, authorise costs, change equipment settings or send customer commitments. Internal summaries cite permitted source records and disclose coverage. Normal screens and receipt recovery continue when AI is unavailable or the budget is exhausted.

Review this design when CRM schema/permissions change, a provider/data-region requirement changes, evaluations fail, actual usage invalidates costs, remote identity becomes available, or a wider source requires document-level permission/revision controls. AI1 implementation and live-model validation require their own actual evidence; design publication establishes neither.

Publication and failed-check dispositions are recorded in the [handover](../delivery/ppo-assistant-handover.md) and its linked PR. No new numbered ADR or migration is reserved while concurrent work is active.
