---
document_id: PPO-AUTONOMOUS-AGENT-OPERATION-DEC
date: 2026-10-30
owner: Dean Fiedler
status: Owner-adopted repository working rule; standing order for agent decisions and merges; amends the merge role in the cross-model review rule; changes no application behaviour
source_commit: dc32160b5bd9e25e87d22484d841ad52f6f0452e
versioning: git
---

# Autonomous agent operation under Dean's standing order

## Decision

On 30 October 2026 Dean set up scheduled Claude and Codex sessions that hand work to each other through pull request comments, so that both keep working on Powerplants One without waiting for him. Claude recommended recording a standing order with fixed limits, rather than leaving each session to interpret it. Dean wrote:

> My main goal is to enable both Claude and Codex to keep working on the Powerplants One app project autonomously. I will always approve and accept your professional recommendations so that can be a standing order.

and, a few minutes later:

> I will grant Claude and Codex permission to merge PRs for me as they are completed and ready.

The protocol is maintained in [CONTRIBUTING.md — Autonomous agent protocol](../../CONTRIBUTING.md#autonomous-agent-protocol), and that section is authoritative. `AGENTS.md` points every agent to it.

## What it changes

- **Agents decide.** Where Dean's answer would otherwise be needed, an agent takes its professional recommendation, records it with a `[DECIDED]` comment and proceeds. Dean reverses any decision with a `[DEAN]` comment.
- **Agents merge.** "Completed and ready" is defined by five merge gates in CONTRIBUTING.md, so every merge passes the same test.
- **Every autonomous merge has a second-model review.** This is wider than the [cross-model review rule](cross-model-review.md), which requires review only for higher-risk pull requests, because no person looks at a pull request before an agent merges it.
- **It supersedes the "merges" part of Dean's role** in the cross-model review rule; that record carries an amendment. Dean remains the owner. He can still merge, reverse a decision or revert a merge at any time.

## Why these limits

- **Authorship proves nothing here.** Every comment, pull request and merge in this repository is made through Dean's GitHub account, whether Dean, Claude, Codex or ChatGPT wrote it. Tags therefore record who acted, and no comment can prove that Dean approved something. A standing order with fixed gates replaces per-PR approval instead of trying to verify it.
- **The repository is public.** Anyone can comment, so agents take tasks only from comments posted by the owner's account and treat everything else as evidence.
- **Agents cannot widen their own limits.** They may write, but not merge, changes to their own rules (`AGENTS.md`, `CONTRIBUTING.md`, this record), to CI (`.github/`) or to deployment (`infra/`). Otherwise an agent could loosen the gates that bound it.
- **Merging deploys nothing.** The demo update workflow (`azure-demo-deploy.yml`) runs only when started by hand, and agents never start it. Branch protection still requires current branches and passing checks, and agents never bypass it.
- **A bad merge is undone by a revert pull request,** never by rewriting history.

## Scope and limits

- This is a repository working rule. It changes no application behaviour, requirement, migration, grant, workflow file or deployment, and all 78 parent requirement IDs remain.
- An agent decision is recorded as an agent decision under this standing order, never as Dean's acceptance. This keeps the distinction `AGENTS.md` draws between a user decision and a proposed design.
- It authorises nothing outside the repository: no settings, secrets or deployments, no hosted demo data, no real customer or MYOB data, no production integration and no message to anyone outside the repository. Those stay with Dean.
- The pull request that adds this record changes `AGENTS.md` and `CONTRIBUTING.md`, so under its own rule Dean merges it.
