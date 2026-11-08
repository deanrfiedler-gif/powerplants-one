---
title: Refined shell S1 claim and data-mapping questions
date: 2026-11-08
---

Codex claims S1 of Dean's staged refined desktop shell build. Source: PPO-SHELL-REFINED-FIGMA-DEC and the exported shell rules in design-record PR #873. The branch starts from current main; the design record remains owned by its author.

Scope: the 66 colour tokens, an opt-in shell version preference and CI override, and the desktop top bar and its tenant, New and account menus. The accepted phone header stays unchanged. No route, permission, grant, migration or data-model change is planned.

Implementation and validation are pending. This claim records no UI baseline, owner acceptance, device verification or production readiness. S2 waits for Dean to merge S1.

### Source inspection and hold

[Draft PR #874](https://github.com/deanrfiedler-gif/powerplants-one/pull/874) records the S1 claim. Codex read the full exported rules on the design-record branch, inspected sheets A, G, I, N and T, measured the 1280/1024/1920 bars and the 834 tablet bar, and read all 66 colour variable values. The 1440 search is 448 px at x496, New starts at x960, and the tenant/New/account popovers are 280 px wide at y52. Later rules and the decision record govern older component descriptions. The tablet frame's search zone measures 262 px but its nested field measures 360 px; the decision's 262 px governs.

Implementation is paused for Dean's answer to two data-mapping questions, as the build instruction requires before departing from a decided question or adding a store:

- Q13 names Powerplants Australia and Demo company. Existing `src/shell/company.ts` returns grant-filtered companies and a nullable working-company choice; `src/components/business-session.tsx` exposes All companies. `db/seed.sql` defines SYN-A and SYN-B as SYN Greenhouse Demonstration, with a separate SYN-C isolation company. No mapping identifies the two named tenants. Recommendation for S1: retain the existing company names and All companies, pending a separate tenant mapping; do not relabel fixture companies or broaden grants.
- R104 names role and last sign-in time/device. `ShellContext` and `Principal` carry no role or sign-in metadata; local session creation audits identity selection but does not record the device. Recommendation for S1: show existing identity/profile information where available and an explicit unavailable sign-in detail, without inventing history or adding a store.

No application code or tests have changed. Typecheck, lint, unit, browser/UI and studio checks have not run; this is a source-inspection and claim-only draft, not an implemented stage.
