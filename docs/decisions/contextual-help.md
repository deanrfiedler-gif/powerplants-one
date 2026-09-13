---
document_id: PPO-HELP-DEC
title: Contextual Help Direction and Design Handover
revision: r01
date: 2026-09-13
status: Authorised design prepared; proposed details and application implementation pending
owner: Dean Fiedler - personal prototype owner
source_commit: 1cc882e53020bdfb22f7e9192365d90b1d8282ab
---

# Contextual Help Direction and Design Handover

**Work item:** [#149](https://github.com/deanrfiedler-gif/powerplants-one/issues/149) · **Branch:** `docs/contextual-help-design` · **Writing session:** PPO Contextual Help & User Guidance Design r01, 13 September 2026. Publication is confined to this branch and its review PR; other active work remains with its existing author. The task does not claim a repository-wide lock over those sessions.

## 1. Decision and scope

Dean asked for a help/information icon on every page with a detailed professional user guide, potentially linking SOPs. He then authorised the recommended design package through GitHub, with CRM Deals as the first worked pilot and Sales-to-Estimating guidance accompanying that workflow later.

**Established direction:** consistent contextual help, detailed navigable guidance, linked authoritative procedures, maintenance accountability and measured onboarding benefit. **Prepared details for review:** dimensions, reader modes, guide template, content lifecycle, release binding, example article and acceptance/pilot method. This record is not adoption of every proposed detail, corporate SOP approval or permission to deploy an application change.

## 2. Delivered package

| File | Result |
|---|---|
| [Design](../blueprints/contextual-help-design.md) | Shared desktop/mobile interface, route/context mapping, stable reading geometry, focus and recovery, SOP metadata/states/access, ownership and release maintenance. |
| [Template](../standards/page-guide-template.md) | Reusable user-article structure, separate author metadata, evidence and review checklist. |
| [CRM guide](../guides/crm-deals.md) | Detailed current-baseline instructions, requirements, ownership, examples and recovery; public synthetic content only. |
| [Interactive preview](../blueprints/contextual-help-preview.html) | Search, contents, non-modal side panel, expanded/mobile modal, close/focus, underlying synthetic note preservation. |
| [Acceptance and pilot](../testing/contextual-help-acceptance.md) | Fourteen future application cases, six task scenarios and denominators for independent completion, repeated support questions and information omissions. |

No `src/`, database, fixture, dependency, workflow, live SOP, customer record or hosted service changes are part of this package. Documentation completion, preview checks, application acceptance and owner adoption remain separate.

## 3. Evidence and conflicting material

The GitHub connection and local checkout both reported `main` at `1cc882e53020bdfb22f7e9192365d90b1d8282ab`. AGENTS, README, STATUS, CONTRIBUTING, relevant naming/shared UI/blueprint/architecture guidance and current CRM UI/service/validation files were read. STATUS's self-recorded head was older. The source code, including later refinements, grounds this guide.

At inspection, PR #147 (retry/verification documentation) and PR #148 (first part of five-stage implementation) were open. The working guide deliberately describes Enquiry/Qualified; proposed Discovery–Closing guidance cannot be presented as current for that baseline. Current code does support deal value and expected-close edits, despite older implementation prose that says commercial fields are absent. The guide distinguishes displayed known values from forecast/revenue and returned-page counts from full portfolio totals.

The app already contains desktop Quick Help with three general topics in `shell-controls.tsx`. The proposed interface evolves that affordance and adds mobile/page context; it does not build a competing generic help control or assume the old drawer already meets the new design.

Actual SOPs and the earlier intake questionnaires were not inspected in this task. No SOP identities, approval status, private URL or equipment/pricing rules are fabricated. No staff study or running PPO user walkthrough was performed.

## 4. Actual verification

Executed on 13 September 2026 against the completed local documentation tree based on `1cc882e`:

| Check | Actual result |
|---|---|
| `python3 scripts/check_foundation.py` | Passed: 78 parent requirements, 29 master decisions, 38 planned acceptance entries, 1,847 local links, 924 text files checked for merge markers; no errors. |
| `python3 scripts/check_prototype.py` | Passed: 78 parent dispositions and all existing PP-01 documentation registers retained. Documentation consistency only. |
| `python3 scripts/check_naming.py` | Passed: 138 registered documents, seven standing exceptions, copy-ready instructions unchanged at 7,872 characters. |
| `git diff --check` | Passed. |
| CRM source correspondence | Read UI, service and validation definitions; checked labels, conditional qualification, value/date scope, Activity ownership and command recovery. No running PPO application was exercised. |
| Preview source checks | Article-source hash, fifteen guide sections, unique IDs, safe local markup and JavaScript syntax checked separately before publication. These checks do not prove layout or interaction. |
| Visual/interaction QA | **Not run.** Local Chromium was absent and its download timed out. The managed browser rejected the local HTTP preview and then explicitly blocked the shared-file URL under its security policy. No workaround, alternate browser execution or public deployment was attempted after that policy block. |
| HELP-01–HELP-14 and T1–T6 | **Not run against the application.** No user study, business adoption, production-readiness or onboarding savings claim. |

The preview is supplied for design review with visual/interaction verification pending. Its code expresses the intended reading interactions; treat it as an unverified design aid until inspected in a permitted browser. Public publication verification is recorded in the PR, including the actual commit/tree and content hashes. A subsequent CI result does not replace that byte comparison.

## 5. Limits and next bounded step

- Owner review of r01 details and the CRM guide is pending. The guide is InReview; no operational training approval is claimed.
- Five-stage work is concurrent. Before an app increment, read the merged current stage catalogue, frontend, create/conversion and recovery paths, and prepare a guide revision matched to the intended build.
- The first proposed app increment implements the shared help renderer, CRM bindings, search/contents, desktop/mobile reader and explicit fallback for other routes; it does not connect private SOPs, add an AI model or implement later business workflows.
- Assign the actual module business reviewer and verify source SOP identities/permissions before operational publication. These facts do not block completing this synthetic design package.
- Run the future application cases and synthetic user-task pilot before claiming work preservation, access control or reduced onboarding time in PPO.

Re-read this handover and live repository state when continuing. Use a new bounded implementation issue/branch after design review; preserve the existing P01–P12 order and independent active branches.
