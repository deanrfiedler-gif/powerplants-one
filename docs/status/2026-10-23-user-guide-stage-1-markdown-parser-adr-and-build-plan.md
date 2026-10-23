---
title: "User guide stage 1: Markdown parser ADR and build plan"
date: 2026-10-23
---

Dean asked for stage 1 of the accepted [user guide direction](../decisions/user-guide-direction.md): "Proceed with stage 1: write the ADR for the Markdown parser and sanitiser, then the build plan." Both are written; nothing is built.

- [ADR-0065](../decisions/ADR-0065-guide-markdown-parser.md) proposes marked 18.1.0 (lexer only) and yaml 2.9.1 for guide Markdown. Both are MIT or ISC licensed, and neither has runtime dependencies of its own.
  - **Compiled model.** Guides compile at build time into PPO's own allowlisted model, which React renders with no HTML strings. `src/` has none today, and the ADR keeps it that way.
  - **The accepted panel stays the same.** Generic rendering rules reproduce today's page guide panel.
  - **Alternatives.** markdown-it, unified/remark, a parser written for PPO, MDX, and HTML with a sanitiser were compared and rejected.
- The [stage 1 build plan](../superpowers/plans/2026-10-23-user-guide-stage-1.md) has nine tasks:
  - the compiler, guide library and release file, and renderer;
  - the five-stage CRM Deals rewrite, kept hidden until reviewed;
  - carrying the released TypeScript guides over to Markdown, with a markup parity test against today's panel;
  - serving guides from the root layout and retiring the TypeScript guides;
  - the design workspace, one status vocabulary and Markdown stubs from `studio:sync`;
  - the authoring contract and full verification.

Checked:
- **npm registry, 23 October 2026:** versions, licences, dependencies, engines and publish dates.
- **yaml documentation:** the `core` schema, `uniqueKeys` and `maxAliasCount`.
- **The current guide pipeline:** `catalog.ts`, `runtime.ts`, the snapshot, `studio:sync`, both page guide readers, the root layout and application frame, and the CRM UI browser fixture and spec.
- **An independent fact-check** of the first drafts found 17 issues, all corrected. They included:
  - the provider placement: the shell header is mounted from the root layout, not the business layout;
  - register and component references to the deleted modules;
  - the Playwright configuration;
  - visual changes to the accepted panel;
  - template metadata keys needed by `check_naming`;
  - yaml tag warnings;
  - constructs marked does not emit as tokens;
  - the version choice;
  - task order.

Not done:
- **Nothing is built or installed.** No package is installed and no code has changed.
- **Dependency gates.** Installing the packages changes `package-lock.json`. Managed DK-06 templates then need republishing (ADR-0056), and the build PR must report the audit gates.
- **Reviews will go stale.** All 26 register entries with a recorded visual review will show as changed since review, because the guide modules are shared sources. No fingerprint will be refreshed without a review.
- **Departure.** Carrying the released guides over removes their keys' `guides.json` drafts in stage 1, rather than at each module's rewrite (direction paper, section 4.3). Their text stays in Git history.
- **Decision pending.** ADR-0065 awaits Dean's acceptance.

<!-- decision-index -->
[ADR-0065](../decisions/ADR-0065-guide-markdown-parser.md) (PPO-ADR-0065) proposes marked's lexer and yaml for user guide Markdown, compiled at build time to an allowlisted model and rendered by React without HTML strings. Proposed; awaiting the owner.
