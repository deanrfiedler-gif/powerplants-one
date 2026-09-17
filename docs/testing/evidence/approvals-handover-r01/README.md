# SH-06 r01 verification and handover

The requested [HTML](../../../reference/ui/approvals-handover/PPO-Cross-Module-Approvals-and-Handover-Inbox-r01.html) and [detailed report](../../../reference/ui/approvals-handover/PPO-Cross-Module-Approvals-and-Handover-Inbox-Report-r01.md) are published in [draft PR #223](https://github.com/deanrfiedler-gif/powerplants-one/pull/223).

Baseline: `main` at `e1b705acc5457dab6fc0b6a2f0c977132cbd2215`. Branch: `design/cross-module-approvals-handover-r01`. Final verified design commit: `3d5ca696c26d359829dcd91f8c9b17c51140173c`. Subsequent evidence-only publication does not change the verified HTML or its source.

HTML SHA-256: `c2ed70b59fba7b10e1bf874aeed88a72f22407d3a6152f9fd2622305e9965668`. [Source hashes](source-hashes.json) identify the template, model, controller, CSS and unchanged embedded assets.

## Verification outcome

| Check | Actual result |
|---|---|
| Model behaviour | **18 groups passed**, locally and in the focused GitHub workflow. [Results](model-results.json). |
| JavaScript and builder | Syntax, focused ESLint and deterministic HTML rebuild passed. |
| Native browser | **16 groups passed**, Chrome **153.0.8010.47**, Playwright **1.63.0**, Node **24.21.0**; no captured page script errors. [Native results](native-results.json). |
| Responsive behaviour | Browser checked **1440, 1024, 768, 390 and 320 px** widths, including source destinations, phone list/detail navigation, expandable filters and absence of horizontal page overflow. |
| Visual inspection | Desktop inbox, quotation destination and 390 px selected detail reviewed. Final JPEG captures are byte-identical to those inspected; original PNGs remain in the workflow artifact. [Review record](visual-review.json). |
| Repository assurance | Foundation, prototype and naming all passed. All **78 parent IDs** and issued-source integrity checks remain intact. [Documentation results](documentation-results.json). |
| GitHub documentation gate | Passed on the verified design commit. Wider application workflows are separate from this design proof and were still queued/running at handover. |

The authoritative focused run is [35166067713](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/35166067713), job [105027320324](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/35166067713/job/105027320324). Its [original evidence artifact](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/35166067713/artifacts/10474562813) retains native PNG captures and original result files for 14 days. Selected JPEG review captures are also emitted by the job, allowing inspection through the authenticated GitHub connection. No screenshot is an AI-generated reconstruction.

## Defects and refinements found during verification

- The initial local model expectation was corrected from eight to **nine** owned tasks; the sent CRM handover is also owned by Dean. Source data was not changed to satisfy the assertion.
- The first native assertion assumed a view switch would select the first returned item. The UI correctly retained the still-visible Engineering selection. The test now explicitly selects the intended Service record.
- A visibility assertion initially rejected the word “Finance” in Service's explanatory handoff boundary. It now verifies visible source domains, the restricted source reference and permitted domain options; legitimate explanatory text is retained.
- Exact queue criteria and selected-item return were extended to survive destination reloads, with validated return criteria.
- Visual review identified too much phone filter chrome. Counts are now compact; additional filters expand on demand; selecting an item sets summary/filter controls aside and retains Back to list.
- The final refinement run caught a real navigation race: a deferred scroll restoration could access a queue already replaced by a new destination. The restoration now checks that the queue still exists. The succeeding final run passed all 16 groups with no page script errors.

Local native rendering was unavailable: Chromium was not installed and its download timed out. All native evidence above therefore comes from the pinned GitHub workflow. Local model/syntax checks used Node 24.19.0; they are not misreported as the application pin.

## What this evidence does and does not establish

The implemented standalone UI supports source-owned routing, permission-filtered fixture reads/counts, source-task deduplication, dates, return ageing, revision checks, scoped visibility, unavailable/revoked destinations, unknown Finance outcomes and local preference recovery. Reading, filtering, navigation and saved views do not mutate the underlying source records.

The seven destinations are labelled authored previews, not connected copies of the full approval modules. Preview identities are not authentication. Server permission enforcement, live integrations, event sequencing, concurrent business commands, real documents, production use, owner design acceptance and real-device/assistive-technology acceptance remain separate.

The bounded next implementation is one permission-checked source review task integrated with shared My Work, its exact source route and its source-owned receipt. No merge, deployment or transaction is part of this handover.
