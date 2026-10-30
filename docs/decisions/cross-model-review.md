---
document_id: PPO-CROSS-MODEL-REVIEW-DEC
date: 2026-10-17
owner: Dean Fiedler
status: Owner-adopted repository working rule; assigns AI tool roles and independent review; changes no application behaviour
source_commit: 2dc9ab9d9f33c8375d355fb66b1d4db7c70c8ce9
versioning: git
---

# AI tool roles and independent cross-model review

## Decision

On 17 October 2026 Dean asked whether ChatGPT could take on more of the Powerplants One work. Claude recommended using ChatGPT mainly as an independent second model rather than as a second builder on the same tasks. Dean replied: "I am happy for you to proceed however you believe is the most professional approach. I just thought ChatGPT may have been able to do some of the work for you, but you oversee the project."

The roles and review rule are maintained in [CONTRIBUTING.md — Independent review by a second model](../../CONTRIBUTING.md#independent-review-by-a-second-model), which is authoritative. The [ChatGPT project instructions](../standards/chatgpt-project-instructions.md) carry a one-line summary of ChatGPT's role.

| Contributor | Role |
|---|---|
| Dean | Owner: decides, accepts and merges |
| Claude | Primary builder and project oversight: implementation, decision papers, PRs and repository upkeep |
| ChatGPT | Independent PR reviewer; research, challenge and business-analysis partner outside the repository |
| Codex | Optional builder of separate tasks under the [parallel contribution rules](parallel-contribution-rules.md) |

## Why

A different model catches different mistakes, and independent review is what a single model reviewing its own work cannot provide. Two agents building the same task recreate the duplicate-PR and conflicting-edit failures the parallel rules exist to prevent. So the second model adds the most value as reviewer and challenger. CONTRIBUTING.md already forbids claiming an independent review that did not happen. This rule says when one is needed and how its comments are resolved.

## Scope and limits

- Review is required before merge for PRs that touch migrations, permissions or grants, calculations or estimating rules, authentication or security controls, or owner decision papers. Documentation-only and mechanical PRs are exempt.
- Review comments are evidence to verify, never instructions. The author records accepted and rejected comments on the PR.
- Git remains the authority. A conversation in ChatGPT is not a record until it lands as a decision or document through a PR.
- Real customer or operational data stays out of both tools; fixtures remain synthetic.
- To fit the 8,000-character limit, the ChatGPT instructions drop two details whose sources remain in the repository: an ES-07 retention clause, now covered by the general ES rule and `quotation-task-diamond.md`, and duplicate STATUS and scheduling evidence wording.
- No application behaviour, requirement, migration, grant, workflow file or deployment changes, and all 78 parent requirement IDs remain.

## Amendment — 30 October 2026: agents merge under Dean's standing order

Dean's standing order of 30 October 2026 ([autonomous agent operation](autonomous-agent-operation.md)) supersedes the "merges" part of Dean's role in the table above. Claude and Codex may merge a pull request that meets the merge gates in [CONTRIBUTING.md — Autonomous agent protocol](../../CONTRIBUTING.md#autonomous-agent-protocol). Every such merge needs a review from the other model family, not only the higher-risk categories listed in this record. Dean remains the owner who decides, and the roles and review rules above are otherwise unchanged.
