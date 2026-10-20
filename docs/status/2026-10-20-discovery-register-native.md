---
title: Discovery register ES-02 native implementation
date: 2026-10-20
---

The existing `/estimating/discovery` route now implements the accepted Discovery register design: compact desktop/tablet grid, responsive phone rows, overlapping saved-evidence views, owner/customer filters and read-only snapshot. Existing schema confirms a workspace owner, resolving Q2's Estimator label. The list read gains bounded authorised customer, owner, changed and selected-option cost fields; no migration, capability or dependency is added. The [implementation decision](../decisions/discovery-register-native.md) distinguishes authorisation to build from UI acceptance and documents remaining activity and unspecified-control questions.

The page contract, design/component register and guide are updated together. [Verification](../testing/evidence/discovery-register-native/README.md) records checks and limitations. Native owner visual review, business approval and deployment remain pending; the accepted Figma design is not evidence of an accepted native baseline.

<!-- decision-index -->
[Discovery register native implementation](../decisions/discovery-register-native.md) (PPO-ES02-DISCOVERY-REGISTER-NATIVE-DEC) records the ES-02 build, confirmed workspace owner, bounded read extensions and pending native review.
