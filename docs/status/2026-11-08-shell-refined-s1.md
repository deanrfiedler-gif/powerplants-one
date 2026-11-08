---
title: Refined shell S1 implementation and verification
date: 2026-11-08
---

Codex claims S1 of Dean's staged refined desktop shell build. Source: PPO-SHELL-REFINED-FIGMA-DEC and the exported shell rules in design-record PR #873. The branch starts from current main; the design record remains owned by its author.

Scope: the 66 colour tokens, an opt-in shell version preference and CI override, and the desktop top bar and its tenant, New and account menus. The accepted phone header stays unchanged. No route, permission, grant, migration or data-model change is planned.

Implementation is supplied for review; browser validation remains pending. This fragment records no UI baseline, owner acceptance, device verification or production readiness. S2 waits for Dean to merge S1.

### S1 implementation and verification

[Draft PR #874](https://github.com/deanrfiedler-gif/powerplants-one/pull/874) holds the S1 branch. Codex read the full exported rules on the design-record branch, inspected sheets A/G/I/N/T and measured the responsive bars and all 66 variables. The 1440 search is 448 px at x496, New starts at x960, and tenant/New/account popovers are 280 px wide at y52. The record's 262 px tablet search governs the mismatched 360 px nested drawing.

Dean answered Yes and then “Proceed however you believe is the most professional” to retaining the existing company choices and explicitly unavailable sign-in metadata. The [S1 build record](../decisions/shell-refined-s1-build.md) records these bounded adaptations. No migration, route, permission or grant changes. The existing working-company store and unsaved-work review are reused.

S1 code adds the tokens, version preference/CI override, top bar, tenant/New/account menus and keyboard handling. The navigation registry filters New actions; no unregistered Assistant or quotation-create route is invented. The shell master, component rules and additive consumer bindings describe the built scope and remaining stages. Refined user-guide instructions are proposed in the binding note; the carried-over guide and its parity fixture remain intact until release review.

Typecheck, lint, the 1,443-test unit suite, production build, studio:check, foundation, naming, status, documentation-scope and migration-numbering checks passed. The source tree includes main a78b1b066 without conflicts. Studio reports 26 already-stale page/system reviews (including system:shell) and no newly stale review compared with the initial base; no review fingerprint is changed. Exact-head results and remaining gates are recorded in the PR. Cloud setup succeeded with the disposable synthetic database but reported Chrome unavailable; browser:check confirmed the missing executable. Browser/UI suites and new captures are therefore unexecuted here and left to CI under AGENTS.md. No independent review has yet occurred. The PR stays draft; no owner acceptance, UI baseline, production readiness or physical-device verification is claimed. S2 remains gated on Dean merging S1.
