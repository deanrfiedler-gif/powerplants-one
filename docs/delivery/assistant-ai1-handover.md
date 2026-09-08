# PPO Assistant AI1 implementation handover

**Document:** PPO-AI1-HO · **Revision:** r01 · **Date:** 8 September 2026 · **Owner:** Dean Fiedler · **State:** Implemented on a review branch; exact verification and publication recorded in the pull request.

Dean explicitly instructed implementation of the first synthetic journey with a clearly labelled simulated assistant, followed by real-provider evaluation only after account and budget selection. [Issue #66](https://github.com/deanrfiedler-gif/powerplants-one/issues/66) tracks this work under D-027 and the [AI specification](../blueprints/ppo-assistant-specification.md). This handover succeeds the design-only status for this implementation slice; it does not retroactively turn the twenty full AIA procedures into passes.

## Working journey

Open `/assistant` from the existing navigation. The page consistently says **Simulated assistant · Synthetic data only**, identifies local rules and text-only input, and states that no provider is connected. Try “Find customer SYN”, “Show my opportunities with next action needed”, or “Add a deal for SYN to review irrigation controls”. The parser recognises these bounded forms and optional labelled lines, retaining unrecognised details in the visible original request rather than claiming general natural-language understanding.

Choose an existing permitted customer, read the bounded Customer CRM summary, complete the opportunity and initial follow-up fields, prepare a durable review, and press **Confirm and create opportunity**. This invokes the existing atomic CRM creation command: Enquiry / Open opportunity, initial Internal Activity, links, domain event, identity/reference allocation, audit, receipt and outbox. The review displays every business field, selected record names, pipeline/stage effect and explicit unknown reasons. No model or simulated chat response can invoke confirmation.

The minimal server proposal belongs to the current actor/workspace. UUIDs, immutable command hash and review identity survive a refresh. Editing supersedes a Ready review with a fresh proposal; confirming rechecks relationships, eligible owners, current grants, expiry and selected record versions. Original operation IDs are reused after interrupted submissions. Ordinary permission-checked operation receipts establish success, including after the assistant is switched off. A late response from an old identity cannot repopulate the unmounted view.

Customer search returns only identifiers, company context, reference, name and link. Summaries use existing current-permission predicates, source IDs, record versions, update/read times and canonical links. They cover a customer identity, up to ten opportunities and twenty Internal CRM Activities per page; signed cursors are actor/workspace/customer bound. Facts remain literal source text. Stored narrative is never parsed as an instruction; suggestions are visually separate. Service, equipment, projects, email, Finance and external knowledge are explicitly outside the result. Opportunity worklist interpretation and first-page limits are visible.

## Local setup and retention

Use the existing exact repository pins and disposable loopback setup in the root README. Run `npm run db:migrate` then `npm run db:seed`. Set `PPO_ASSISTANT_MODE=simulated` in the private local environment file to opt in, then `npm run dev`. The committed example defaults to `off`; any other mode fails closed. No dependency, key, provider SDK, paid account or network inference is added. Existing unsafe-host/identity/startup restrictions remain.

Migration 0016 adds only `ppo.assistant_proposals`; 0015 is reserved by independent [Email & Calendar implementation #64](https://github.com/deanrfiedler-gif/powerplants-one/pull/64). The explicit migration runner includes 0016 without assuming 0015 exists on this branch. At integration retain both independent entries in numeric order and run an upgrade/combined regression; do not renumber or edit applied migrations. The AI1 upgrade test checks populated schema 14 plus repeat application. It does not claim an unrun 0015/0016 combined integration result.

Chat and summary contents are memory-only and clear on view unmount or identity change. The URL contains only the proposal ID. Ready reviews expire after fifteen minutes. The local server's hourly retention worker removes expired Ready/Superseded proposals within 24 hours while running and clears accepted command/selection copies within seven days; it runs at startup after downtime. Unresolved Submitting originals are never purged. Canonical audit/receipts retain existing policy. No raw conversation or source-summary log is written. If the local server is stopped, scheduled deletion resumes on startup; there is no claim of an always-on hosted retention service.

## Deliberate first-slice limits

- A responsive full page reuses the current shell, field controls, identity boundary and native brand assets. The specification's contextual 400px desktop drawer and contextual customer-record entry point remain a later UI refinement; this change does not redesign the shell.
- Source pages use stable ID order with explicit coverage, not “latest ten”. Each page is a fresh permission-checked read with a read timestamp; pages do not imply a single complete historical snapshot.
- Voice, free-form model reasoning, email drafts, external knowledge retrieval and equipment troubleshooting remain unimplemented. No missing provider account is needed for this synthetic slice.
- Do not equate Chromium mobile viewports with real-phone or screen-reader acceptance. No independent review, owner acceptance, operational-data permission or production readiness is claimed.

## Verification and publication

Local TypeScript, full ESLint, all 23 then-existing unit cases, the production build and prototype/naming checks passed using exact Node 24.20.0 and the repository pins. A fourth parser/date case and an exact saved-date browser assertion were then added for explicit-offset conversion. The first build attempt rejected an out-of-root dependency symlink; copying the identical verified dependencies into this checkout resolved that environment issue. The build retains the existing report-template dynamic filesystem tracing warning. Local foundation reports omitted historical evidence images in this partial materialisation; the unchanged full-checkout documentation workflow passed.

Initial CI [34190477299](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/34190477299) passed seven AI1 PostgreSQL cases and 33 retained CRM database cases. Its restart save succeeded, then an overly broad alert assertion matched the framework route announcer as well as the application error. The assertion was scoped to the assistant conversation and rerun. No application grant/command check was relaxed. Exact subsequent head/tree, all runtime results and final evidence remain in the [implementation PR #67](https://github.com/deanrfiedler-gif/powerplants-one/pull/67).

Six local layout-fixture captures at 1440/390/320 px were inspected for the welcome and prepared review states, with the existing brand assets and without horizontal overflow in the fixture assertions. This supplemental run used a locally available Chromium 143 binary and mocked API replies; it is visual evidence only, not pinned-browser or database journey proof. CI uses the repository-pinned browser and actual HTTP/database services. No real-device, screen-reader or software-keyboard proof is inferred.

The focused workflow is `.github/workflows/assistant-ai1.yml`. Its commands cover:

| Evidence | Command / scope | AIA coverage contribution |
| --- | --- | --- |
| Parser | `npm run test:unit` | Explicit simulation, bounded interpretation and explicit-offset UTC conversion; parts of AIA-03/08/09/10/16 |
| Database | `node --env-file=.env.local --import tsx --test --test-concurrency=1 tests/assistant/database.test.ts` | No prepare-time domain effects, atomic concurrent confirmation, strict fields, hash/expiry/edit/selection changes, current grants, tenant isolation, rollback, off-mode recovery, citations/cursors/inert narrative, retention and upgrade |
| Retained CRM | `tests/database/crm.test.ts` and `crm-i2.test.ts` | Reused command and read regressions |
| HTTP | `tests/assistant/http.test.ts` against the actual gateway | Same-origin/auth/no-store/strict body, reviewed confirmation, original receipt and sign-out |
| Browser | `npx playwright test --config playwright.assistant.config.ts` | Desktop/phone customer-context-create journey, explicit edit, lost accepted response/reload, identity clearing and 320px keyboard flow |
| Durable recovery | `scripts/assistant-restart-proof.ts write`, `accept`, `verify` with real PostgreSQL restarts between phases | Persisted intent before dispatch, unknown accepted browser response, recovery off-mode across two database and three application/browser process starts |

The browser configuration explicitly uses the full pinned Chromium channel for these new tests. It does not change retained workflow/browser configurations or silently adopt the separate P11 fix. Workflow evidence records executed checkout/tree, test output, synthetic screenshots and restart identifiers. The PR records exact source head, check URLs, image inspection and unresolved results; an authored test is never reported as executed evidence.

Starting source was main `b3597f79413f87b9b2f1ce75a66a2addefbb0e34` and design #65. During implementation main advanced to `b489a8c0a68271dc10dd92c85f06bbee7606559f` with Email & Calendar design #62; its files and shared index additions were preserved. Publication uses a real Git tree based on current main with only reviewed changes, since the local environment lacks shell GitHub credentials. No branch/main force update, check bypass or deployment is used. #54/#63 P11 and #61 mobile work keep their own unresolved verification/publication status.

## Next provider decision

Keep mode off by default. Once Dean selects a provider account and evaluation budget, use synthetic fixtures to compare retrieval accuracy, supported-field extraction, source fidelity, permission failures, latency and measured token cost against this deterministic baseline. Select the model and adapter only then. The earlier cost scenarios are assumptions, not an approved spend or a measured bill. AI1 itself incurs no model usage.
