---
title: User guide direction paper and table of contents
date: 2026-10-23
---

Dean asked for a professional recommendation on building a user guide for the whole application, then for an audit of that recommendation, then for a draft decision record and table of contents. Two documents are proposed. Neither is adopted.

- The [user guide direction paper](../decisions/user-guide-direction.md) (PPO-USER-GUIDE-PROP) builds on the contextual help direction (PPO-HELP-DEC r01) without changing it. It recommends one Markdown content source in place of the three that exist today: the released TypeScript page guides, the 364 draft entries in `guides.json`, and the two-stage CRM pilot. It also recommends a Help Centre at `/help` (DK-07) beside the existing page guide, and a nine-part structure. Screenshots are kept out of the public repository under ADR-0050, and module chapters are written only after each page is accepted and built. It also proposes one status vocabulary and an ADR for the Markdown parser before any build. It ends with eleven questions for Dean, each with a recommended answer.
- The [table of contents](../guides/user-guide-contents.md) (PPO-USER-GUIDE-TOC) places every registered scope. The customer portal is set aside for a separate customer guide, and the five conditional CX options are listed separately. It also adds 12 journeys, organised by business flow because AD-01's role bundles are proposals only.

Checked: facts were checked against `main` at `01cef391`: the guide sources and counts, the DK-07 and AD-10 register entries (there is no `/help` route), AD-01's proposed bundles and the Kit fallback behaviour. ISO/IEC/IEEE 26514:2022 was confirmed by web search. A script confirmed that the table of contents names every scope in the design register. An independent fact-check of both documents against the repository found 16 inaccuracies, all corrected. They included wrong entry counts, two build states, a decision row number, misattributed rules and a status vocabulary conflict.

Not verified:

- **Screenshots.** Whether the Font Awesome Pro licence permits screenshots of the app has not been confirmed: the licence page returned no text to an automated fetch.
- **Build states.** These come from the design register, which lags behind some recent work.
- **Workflow maps.** The issued maps were not reconciled.
- **Code and acceptance.** No application, guide content or tooling has changed, and HELP-01–HELP-14 have not been run.

<!-- decision-index -->
[User guide direction paper](../decisions/user-guide-direction.md) (PPO-USER-GUIDE-PROP) proposes how the full user guide is written, kept and published, building on PPO-HELP-DEC r01. Proposed; awaiting the owner's answers to Q1–Q11.
