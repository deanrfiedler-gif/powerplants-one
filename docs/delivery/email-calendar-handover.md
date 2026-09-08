# Email & Calendar design handover

**Revision:** r02 · **Date:** 8 September 2026 · **Owner:** Dean Fiedler · **State:** Design and synthetic prototype prepared for review; browser visual verification and live integration remain outstanding.

## Delivered scope

- [Integration design](../blueprints/email-calendar-integration.md): eight desktop/mobile screen contracts, typed linking, explicit message sharing, permissions, provider identity, sync/recovery and calendar ownership.
- [Clickable synthetic prototype](../blueprints/email-calendar-prototype/index.html) and [review journey](../blueprints/email-calendar-prototype/README.md): inbox/Sent/search/filter, conversation, link selection, internal follow-up, selected-message/attachment sharing, recipient preview, record Email tab, agenda, privacy and degraded states.
- [First Microsoft pilot](email-calendar-microsoft-pilot.md): one proposed test mailbox, minimal read scope, setup sequence, dataset, responsibilities, 18 acceptance cases, cleanup and cost inputs.
- [Decision](../decisions/email-calendar-design.md): current authority, proposed Graph approach, alternatives and deferred operational decisions.
- Dependency-free model checks, a deterministic single-file export and a scoped design-assurance workflow. Existing PPO runtime, database, migration, dependency and actor-permission code unchanged.

## Baseline and source provenance

GitHub connector access verified: repository private, default branch main. Main read at `b3597f79413f87b9b2f1ce75a66a2addefbb0e34`, tree `8c72aae4da9117368f37fca9af94248bc276c7a3`, P11 PR #57 merge. Open mobile PR #61 inspected at `bfcf6e2d5c78e83fc848d18fdce4ef5fbf165e0d` for approved presentation mapping; it is not a dependency merge or a claim about that PR's final status. Other open work preserved.

Read AGENTS, README, STATUS, adopted naming/UI specifications, BP-03/PAR-06, ADR-0003/BP-02 and current relevant registers. Supplied Pipedrive screenshot used only as a layout reference. Supplied branding checked against PDF pp17–19, including visual colour-page and logo inspection. Repository logo/font bytes reused, no operational messages/addresses/attachments copied.

## Actual verification

| Check | Actual result / limitation |
|---|---|
| JavaScript syntax | Passed for app and fixtures |
| Synthetic model/projection checks | 29 cases passed ([evidence](../testing/evidence/email-calendar-design/r02/model-checks.json)); selected-message isolation, no sharing from linking alone, hidden attachment metadata, search isolation, target revocation, unlink withdrawal, distinct follow-up, escaping, private agenda, disconnect and reset |
| Single-file HTML export | Generated with embedded existing logo/font; no remote dependency. Export: 896,957 bytes; SHA-256 `2aeb7615e79530a246210d19d1fbb7e54e90e091e0f045ad97ae834b787e15d6`. [Artifact evidence](../testing/evidence/email-calendar-design/r02/artifact.json). |
| Brand source review | PDF palette page and supplied logo visually inspected; existing r08/mobile mapping reviewed |
| Browser preview | Environment blocked the internal preview address with `net::ERR_BLOCKED_BY_CLIENT`; preview service reported running. No browser interactions, responsive screenshots or visual screen pass are claimed. |
| Repository foundation / prototype / naming | PP-01 passed (78 parent dispositions); naming passed (88 document records). Local foundation reported 176 missing historical image/SVG links in the partial source projection; every destination was confirmed present in the exact upstream tree. No new-document link error. Full-tree CI outcome remains in the PR. |
| Microsoft, server permissions, database persistence, real device and assistive technology | Not run. Client-only fixture checks do not prove any of these. |

The model suite exercises actual rendering/projection and interaction functions in a minimal test harness. It is explicitly not a DOM layout, real browser, server access or full end-to-end test. The preview's "Preview as" and privacy controls only simulate policy. No message or calendar write capability exists in this deliverable.

Known review limits: full layout/keyboard/phone QA must be completed in an available browser before calling the UI accepted or merging under a visual-review gate. The placeholder Project record demonstrates the proposed destination; J1 is still a separate runtime increment. Preview changes survive navigation only and reset on reload. The test attachment is a text description, not an actual customer file.

## Publication and next bounded step

This work is intended for a dedicated design branch and reviewable PR under PPO-009 / #9. The PR's actual commit/check state is the publication record; no merged-main or independent review claim follows from this handover alone.

Next: finish the browser review of this concrete artifact, then implement one persisted synthetic Email → Opportunity link → internal follow-up journey using the retained server services and a synthetic provider adapter. Add real Microsoft reads only after the pilot's named-account, authentication, retention and consent prerequisites are verified and that live step is authorised. No live account setup, purchase, deployment or company message is required to review the current package.

### GitHub review evidence

[Draft PR #62](https://github.com/deanrfiedler-gif/powerplants-one/pull/62) was opened from `design/email-calendar-prototype`. On initial source commit `b603038770c619694b39223d42c81c9cadd55cc7`, full-tree [documentation assurance](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/34181663051) and [Email & Calendar model assurance](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/34181663045) passed. This resolves the local projection-only foundation limitation for that source. The export amendment embeds the existing Roboto licence. Documentation and model assurance also passed on `ed8fe4777e427567d7d0c0d6daf68a78747ee1df`. Broader application workflows exposed an unused cross-script fixture declaration in the new prototype; the fixture now explicitly uses `globalThis`, and focused ESLint plus all 20 model checks pass locally. The PR records the resulting final CI status. Browser visual review remains blocked, so no merge or UI acceptance is claimed.

## r02 mobile calendar and demo audit

**Basis:** source/layout review of the actual r01 HTML/CSS/JavaScript, supplied Pipedrive mobile calendar screenshot, retained Powerplants palette/logo/font and existing privacy model. The screenshot was inspected; its real appointments and customer details were not copied. Browser visual review was attempted again through the supported preview and returned `ERR_BLOCKED_BY_CLIENT`. No rendered mobile/desktop screenshot, touch/keyboard or screen-reader pass is claimed.

| Finding in r01 | Applied refinement in r02 |
|---|---|
| Agenda cards concealed empty time and meeting duration | Day timeline with proportional times/durations; retain Agenda for full wrapping context |
| Two-date dropdown gave little week context | Monday-first seven-day strip, month/year date picker and previous/next week navigation |
| Created follow-ups could fall outside the two selectable dates | Date picker reaches other dates; date/view/filter state stays coherent |
| Internal due times could be mistaken for booked appointments | Separate Due this day section without invented duration |
| Repeated badges and explanatory panels competed with the schedule | Compact source legend, restrained blue/green/grey event styles and details on tap |
| Phone header could wrap awkwardly at 320px | Remove fixed title minimum width and tighten header/identity spacing |
| Mobile navigation and dialogs lacked a consistent app treatment | Navy navigation matching the desktop rail; native modal bottom sheets with scrolling bodies and visible actions |
| Calendar privacy checks were spread across views | Reuse the permitted calendar projection for timeline, Agenda, week indicators and event-detail entry; deny internal details to the colleague and all source details after expiry |
| No representation of overlapping/very short meetings | Separate columns for two overlaps; readable Agenda fallback for short or denser meetings |
| Calendar refinement was hard to find in the download | Open Calendar on load; Email remains available in navigation |

**Verification:** all 29 model/projection cases pass, including the original email-sharing checks and new calendar navigation, ordering, duration, overlap, filter, date-validation and privacy cases. Focused repository ESLint passes. The self-contained export retains the logo/font/licence and no external requests or durable storage. Full-tree documentation CI is tracked on PR #62; broad application workflows are separate from visual acceptance. Historical r01 evidence remains unchanged.

**Remaining review:** open the exported file in a real browser at 320/390/768/1440px and 200% enlargement; inspect the first calendar viewport, long/full event details, narrow overlap rows, week navigation, mobile bottom-sheet scrolling, focus restoration, the Inbox → link → follow-up → share journey and desktop compatibility. The fixed line reads Sample · 9:45 and must not be described as the current time. Only that browser review can establish final visual acceptance.
