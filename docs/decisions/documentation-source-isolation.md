---
document_id: PPO-DOCUMENTATION-SOURCE-ISOLATION-DEC
date: 2026-10-22
owner: Dean Fiedler
status: Implementation authorised; pull request review pending
source_commit: 002af00e4e19e9aa0d12f83d36199bebe6572a1b
versioning: git
---

# Documentation sources without shared generated diffs

## Decision and scope

On 22 October 2026 Dean instructed Codex to extend the existing fragment system, stabilise the README, update contributor instructions and checks, and open a pull request for review. This decision continues the [merge-conflict reduction controls](merge-conflict-reduction.md). It supersedes the requirement for each contribution to commit regenerated status and decision indexes. Implementation and review are separate; this change grants no business acceptance or production authority.

## Architecture and alternatives

Keep the existing Python standard-library generator and dated status fragments. Make the tracked status and decision pages stable navigation and historical records. Render the combined views into ignored `tmp/documentation/` output and publish source-bound copies as read-only Documentation assurance artifacts. Preserve the legacy text and issued references. The root README describes purpose, setup and navigation rather than a sequence of feature deliveries.

Committing generated indexes in every feature PR was rejected because independent fragments still changed the same output lines. A bot committing to main was rejected because it would introduce write permissions and a protected-branch publication process. Read-only generated artifacts follow the existing UI build-sequence approach and need no package, service or environment-variable changes.

Routine feature PRs own their source files and relevant documentation. Required shared contracts and design registers still change with the implementation, using declared scope and coordinated ownership. A new chapter is added only when no authoritative chapter exists. Decisions, contracts, guides and evidence retain their existing locations and IDs.

## Implementation claim

Owner: Codex, working for Dean Fiedler. Expected paths: `README.md`, `AGENTS.md`, `CONTRIBUTING.md`, the PR template, status/decision landing pages and fragment guide, maintained ChatGPT instructions, status generator and documentation-scope checker/tests, Documentation assurance and merged-tree workflows, this decision and its status/register entries. No application, database, capability, runtime design-register or issued-reference changes are planned.

## Acceptance

- Independent fragments combine deterministically without modifying tracked outputs.
- Malformed fragments, broken documentation links and changed legacy entry identities still fail validation.
- Routine PR edits to shared navigation pages fail with an actionable message; narrowly declared documentation-maintenance changes remain reviewable.
- Generated artifacts identify their source and keep links usable outside the checkout.
- README content remains useful without per-feature updates; instructions and checks describe the same workflow.

Validation and remaining limits will be recorded with the completed implementation.
