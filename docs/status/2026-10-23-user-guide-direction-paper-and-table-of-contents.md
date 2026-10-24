---
title: User guide direction paper and table of contents
date: 2026-10-23
---

Dean asked for a professional recommendation on building a user guide for the whole application, then for an audit of that recommendation, then for a draft decision record and table of contents. He then asked for both drafts to be reviewed before accepting them. On 23 October 2026 he accepted both: "Proceed: I accept Q1–Q11 as recommended."

- The [user guide direction paper](../decisions/user-guide-direction.md) (PPO-USER-GUIDE-PROP) builds on the contextual help direction (PPO-HELP-DEC r01) without changing it.
  - **One content source:** Markdown, in place of the three that exist today: the released TypeScript page guides, the 364 draft entries in `guides.json`, and the two-stage CRM pilot.
  - **A Help Centre:** at `/help` (DK-07), beside the existing page guide.
  - **A nine-part structure.**
  - **Screenshots:** kept out of the public repository under ADR-0053 rule 9.
  - **When chapters are written:** only after each module page is accepted and built.
  - **Status words:** one vocabulary.
  - **Parser ADR:** a Markdown parser ADR comes before any build.
  - **The contextual help design's prepared details** become the base (Q11).
- The [table of contents](../guides/user-guide-contents.md) (PPO-USER-GUIDE-TOC) places every registered scope.
  - The customer portal is set aside for a separate customer guide.
  - The five conditional CX options are listed separately.
  - It adds 12 journeys, organised by business flow because AD-01's role bundles are proposals only.

Checked against `main` at `01cef391`:

- The guide sources and counts, the DK-07 and AD-10 register entries (there is no `/help` route), AD-01's proposed bundles and the Kit fallback behaviour.
- ISO/IEC/IEEE 26514:2022 was confirmed by web search.
- A script confirmed that the table of contents names every scope in the design register.
- An independent fact-check of both documents against the repository found 16 inaccuracies, all corrected before acceptance. They included wrong entry counts, two build states, a decision row number, misattributed rules and a status vocabulary conflict.

Not done or not verified:

- **Stages 1–5** are not authorised; each needs its own go-ahead.
- **Screenshots.** Dean is to ask Font Awesome whether the Pro licence permits screenshots of the app; the licence page returned no text to an automated fetch.
- **Build states.** These come from the design register, which lags behind some recent work.
- **Workflow maps.** The issued maps were not reconciled.
- **Code and acceptance.** No application, guide content or tooling has changed, and HELP-01–HELP-14 have not been run.

<!-- decision-index -->
[User guide direction paper](../decisions/user-guide-direction.md) (PPO-USER-GUIDE-PROP) sets how the full user guide is written, kept and published, building on PPO-HELP-DEC r01. Accepted by the owner 23 October 2026 (Q1–Q11 as recommended); stages not yet authorised.
