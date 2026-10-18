---
title: PPO Assistant: Claude API accepted as first live provider
date: 2026-10-18
---

Dean accepted [Amendment A1](../decisions/ppo-assistant-direction.md#amendment-a1--claude-api-first-16-october-2026), issuing r03 of PPO-AI-DEC: "I accept Amendment A1 (Claude API first, credit-funded, US$30 monthly ceiling enforced in PPO, no purchased credits or auto-reload). Record my decision and plan T2."
- **Provider:** the credit-funded direct Claude API is the first live synthetic evaluation provider. The direct OpenAI API and Azure OpenAI stay alternatives behind the same adapter, and the labelled simulated adapter is still built first.
- **Provider-side controls:** set up the same day at Dean's direction (no purchased credit or auto-reload, a US$30 workspace spend limit, a key held outside Git). Account details stay outside this public repository, and no model request has been made.
- **Still open:** the specification's pre-call checks, the model and SDK pin, the billing owner for any operational use, and any use of real data.

No application code, dependency, migration or route changes. Carl's answers in Conversations are build step T2, and live answers follow the pre-call checks.
