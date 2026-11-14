---
title: Claim-specific Finance evidence build claimed
date: 2026-11-13
---

Dean instructed proceeding with claim-specific OUT-14 evidence and connected billing proof. Codex owns `codex/claim-finance-evidence`, in its dedicated worktree, dependent on C1 [PR #905](https://github.com/deanrfiedler-gif/powerplants-one/pull/905). Scope: a fixed, versioned internal claim evidence contract for ProjectClaim and AgreementCharge, immutable HTML/PDF through the existing Finance jobs/store, current authority and original-operation recovery, and connected synthetic tests. MYOB retains invoice authority. Claim authoring UI, real ERP, customer distribution and full manual TS-01/TS-02 acceptance remain separate.

Shared paths: `src/finance/worker.ts`, the unversioned document-template support dispatcher, Finance/document contracts, project billing decision, backend delivery plan and TS-01/TS-02 evidence notes. Historical renderer source files and original issued bytes remain unchanged. The initial claim has no implementation or test-completion claim. Independent Claude review and Dean's merge remain required.
