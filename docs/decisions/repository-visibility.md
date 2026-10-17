---
document_id: PPO-REPOSITORY-VISIBILITY
title: Repository ownership and visibility
date: 2026-10-17
owner: Dean Fiedler
status: Adopted 17 October 2026
versioning: git
---

# Repository ownership and visibility

## Context

On 17 October 2026 Dean asked whether the repository should change from public to private. He confirmed that he owns the work, not Powerplants, and that he is happy to keep it public for now. He then accepted the recommendation below: "Yes, proceed on the basis of your recommendations."

Facts checked that day:

- The repository had 0 forks, 0 stars and 0 watchers, no GitHub Pages site and no licence file.
- Secret scanning, push protection and Dependabot security updates were enabled. These are free for public repositories; a private repository needs a paid add-on for secret scanning.
- `main` requires 7 status checks. GitHub Pro (which Dean holds) keeps branch protection on a private repository.
- Actions ran 1,411 workflows on 15 October and 882 on 16 October. A sample of 15 runs averaged about 18 job-minutes each. A private repository on Pro includes about 3,000 minutes a month, so CI would stop or become a monthly charge.
- Three tracked documents contained the private Figma file's link (cleaned up separately).

## Decision

1. Keep the repository public. Dean owns the work; [LICENSE](../../LICENSE) states that all rights are reserved and that the repository is published for viewing only. Third-party material keeps its own terms.
2. Keep the existing rules strict ([AGENTS.md](../../AGENTS.md), ADR-0053): synthetic or approved redacted data only; no credentials, real exports, Font Awesome Pro artwork, Figma file links, real customer, supplier or staff names, or real prices and margins.
3. Keep the "PPO - Design" Figma file restricted to invited people. Its key appears in Git history, so the Figma share setting, not the repository, protects the designs. On 17 October 2026 the file's general access was "Anyone – can view", so anyone with the published link could open it. With Dean's go-ahead it was changed in the Figma desktop app to "People invited to file"; Dean is the only person with access. The Figma connection used for design work still reads the file.

## When to make the repository private

Make it private before any of these happens:

- real customer data, real pricing or real staff information is needed;
- the work is to be commercialised or sold;
- a third party supplies material under confidentiality.

Before switching, reduce Actions usage (tighter path filters, full suites only on ready pull requests, no duplicate push runs) and set an Actions spending limit. Switching is reversible; content that was public may already have been copied.

## Not decided

This record is not legal advice and does not settle any question with a third party. It does not change CI.
