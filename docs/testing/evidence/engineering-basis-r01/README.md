---
document_id: PPO-EN02-VERIFY
title: EN-02 r01 actual verification record
revision: r01
date: 2026-09-17
owner: Dean Fiedler
status: Model and DOM checks passed; native browser review not completed
source_commit: 108b1600152ee12443c75ffaf7feb7cc857316f5
---

# EN-02 r01 verification

The [HTML](../../../reference/ui/engineering-basis/PPO-Design-Basis-and-Interface-Register-r01.html) is a synthetic standalone design, generated from the [maintained sources](../../../design/engineering-basis/README.md). The [manifest](../../../design/engineering-basis/manifest.json) identifies the exact bytes. This record reports executed checks separately from proposed and blocked checks.

| Check | Actual result |
|---|---|
| Pure model assertions | **38 passed, 0 failed**; [individual results](model-results.json) |
| DOM interaction assertions | **22 passed, 0 failed**; [individual results](dom-results.json) |
| JavaScript parse checks | Source and verification scripts parse successfully |
| Focused lint | Checked against the repository configuration; see assurance record for actual QA dependency versions |
| Rebuild and manifest | Two consecutive builds produce identical HTML and manifest bytes; every input/artifact hash checked |
| Repository assurance | Foundation, prototype, naming and whitespace checks recorded in [assurance results](assurance-results.json) |
| Native browser | **Not executed**; cloud-browser navigation to the local review file was rejected by the browser URL policy |
| Screenshots / geometry | **Not produced or inspected** |
| Native keyboard / screen reader / zoom | **Pending** |
| Runtime integration / engineering acceptance | **Not performed** |

Local execution used Node **24.19.0**, not the repository's pinned **24.21.0**. DOM checks used jsdom **26.1.0** in a separate QA directory. They execute the generated artifact's actual scripts but model native dialogs, object URLs, print calls and a narrow `innerWidth` value. No layout engine is involved; 22 passing DOM groups are not 22 passing browser journeys. No external site is loaded by those tests. An earlier Chromium dependency download also failed; after the browser URL policy rejection, no alternate browser route was attempted.

## Meaningful coverage

Model groups cover context/provenance, unknown/zero/not-applicable quantities, missing criteria, source availability, owned assumptions, independent response acceptance, two-sided interface agreement, retained predecessor evidence, exact submitted bytes, return/correct/review, policy and source staleness, nonblocking limitations, withdrawal, cyclic and indirect dependencies, read completeness, stale versions, operation identity and original receiving recovery. Refusal helpers also prove retained state did not mutate.

DOM groups cover the six actual views, button names and labels, tab handler behavior, inspection routing, actual form saves, escaped markup, search empty states, matrix state, selected-package exports, Opportunity context, full resolve → review → prepare → interrupted receive → reconcile → reassess flow, returned successor/finding response, failed local save retry, stale form export, corrupt-state preservation, partial/failed reads, source history, numeric zero, modeled narrow-dock semantics and print content.

## Defects corrected before the retained passing run

1. Propagated source adoption and requirement edits into indirect calculation/interface dependencies; retained check results remain visible while current use needs reassessment.
2. Retained earlier source bytes and pre-edit interface confirmations rather than losing them on an editable draft change.
3. Blocked submission and assumption response when a successor source has not been adopted into the basis.
4. Added reachable retry/export actions inside a failed-save dialog, preserving the original operation and unsaved form fields.
5. Sanitized selected-package pending exports and fixed modal-to-inspection navigation, matrix selected state and an unnamed menu button.
6. Kept Returned work frozen until a successor and limited the changed-source review form to a return outcome.
7. Replaced inherited irrigation narratives in the secondary Opportunity/field fixtures with their actual mounting/power and controls contexts.

One initial model failure was a test-helper assumption: the ready-input helper incorrectly required an existing returned finding to be closed. It was corrected to distinguish technical inputs from the deliberately outstanding finding; M18 separately verifies reviewer acceptance is required.

## Remaining native review

Open the exact manifest artifact in a supported local browser. Review all six tabs at desktop, tablet, phone, 320 px and 200% zoom; long forms and terminal actions; selection versus focus; record-dock focus and resize behavior; real local storage failures and simultaneous-tab writes; native JSON download and print pagination; screen-reader announcements; all source/review/history surfaces. Follow the in-product demonstration and the detailed report's returned-work variant.

Record exact browser/OS/viewport, original captures, errors and reviewer/device scope. Correct observed defects in a successor issued revision. These pending checks do not justify a claim of visual acceptance, WCAG conformance, operational authority or complete BP-05 delivery.
