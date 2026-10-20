---
title: Facilities CS-05 accepted-design implementation
date: 2026-10-20
---

Dean requested the accepted Facilities and growing areas design in the four existing `/facilities` routes. [PR #627](https://github.com/deanrfiedler-gif/powerplants-one/pull/627) implements the compact register, permitted view counts, snapshot, hierarchy, record cards, grouped Equipment, in-record correction/review and failure recovery using existing schema and grants. Source: **PPO - Design**, page `1415:357158`, named version **Facilities and growing areas — accepted**; D1–D7 and Q1–Q4 retain the [accepted decision](../decisions/facilities-figma-design.md).

The page contracts, component consumer/state bindings and five guides are updated together. [Build evidence](../testing/evidence/cs05-accepted-build/README.md) records verification, visual differences and Windows limits. Closest-name ranking and previous/next register context remain unspecified. Owner visual review stays pending; this is synthetic code delivery, not business acceptance, production readiness or deployment.
