---
document_id: PPO-012-READINESS-VERIFY
revision: r01
date: 2026-09-15
owner: Dean Fiedler
status: Model and DOM component checks passed; native visual review outstanding
source_commit: bc1dcf21490dda37979227f5fc13224183853d5a
---

# Delivery readiness workspace r01 verification

This records component checks for the [issued HTML](../reference/ui/projects/PPO-Project-Delivery-Readiness-and-Change-Control-r01.html). The [handover](../decisions/project-delivery-readiness-design.md) governs interpretation. The machine-readable [results and hashes](project-delivery-readiness/results.json) identify the exact checked files. No application or parent acceptance is asserted.

## Executed checks

| Check | Result and scope |
|---|---|
| Isolated synthetic model | 11 behavioural groups passed: quantity conservation/rejection, scoped assessments, independent programme/booking, source race with targeted review invalidation, unavailable sources, both save-failure modes, same-identity scheduler return/resubmission/acceptance, alternative/staging guards, owned completion/reassignment, restricted exports and proposal validation. |
| DOM interaction simulation | 15 groups passed through the actual assembled HTML: six tabs, connected counts/filters, typed material snapshot/correction, Gantt/List records, source inspection with retained specialist draft, role-owned reviews, source race, lost-response recovery, scheduler return, revised resubmission and acceptance, restricted export/print content, Assistant Stop, text escaping, project isolation and dock/overlay mode flags. No JavaScript console errors were recorded. |
| Syntax and assembly | Inline scripts parse; the builder produces identical working/review bytes; three embedded font faces; no external runtime script, stylesheet, image or font request; no placeholder assembly tokens. |
| Repository checks | Foundation, prototype and naming checks executed; exact results are retained in `results.json`. These are documentation assurance, not operational acceptance. |

DOM checks use an existing jsdom installation supplied through `PPO_DOM_MODULE`. Dialog opening, scrolling, downloads and print are simulated to exercise event/state boundaries. This does not establish native focus behaviour, visual geometry, actual file-download UX or printed pagination. Blob construction and role-visible generated content are checked; actual browser download and print remain pending.

## Native browser access limitation

The available Browser skill was initialised and its documented API used. A local HTTP navigation returned `ERR_BLOCKED_BY_CLIENT`. Its documented synchronized-file route then returned an explicit Browser URL policy denial. That policy forbids alternate browser surfaces or indirect workarounds for the blocked action, so browser attempts stopped. The fallback was non-browser model and DOM verification, not a substitute browser renderer.

There are **no native captures for this HTML**. Earlier repository captures concern different pages and do not validate r01. Native visual acceptance remains open for these cases:

| Surface | Required review |
|---|---|
| 1440 and 1366 px desktop | Overview hierarchy, full register columns, two-column comparison, Gantt bars/diamonds, square-edged dock and modeless focus. |
| 1024 and 820 px | Container breakpoints, horizontal table containment, supporting sections and overlay threshold. |
| 390 and 320 px phone | Card labels, full dates/units/currency, queue-to-detail navigation, touch targets, full-width panel, native keyboard/date selection. |
| 200% browser zoom and short-height viewport | Final form fields/buttons reachable, dialog scrolling, no page-wide horizontal overflow or obscured action. |
| Native keyboard / assistive technology | Visible focus, semantic announcements, Tab/Shift+Tab/Escape and focus return, modal background inertness, modeless panel freedom. |
| Print and download | Exact selected comparison, stale designation, permitted commercial content, open items and readable pagination. |

## Remaining review boundaries

The primary synthetic journey is covered by model and DOM checks, including preservation of the old booking source after scheduler acceptance. The four distinct claims remain: authored design, component behaviour, native visual review, and operational/application acceptance. Only the first two are supplied here. This does not verify durable server permissions, database races, source adapters, actual calendars, technical release, stock use, pack issue, financial authority or real-device usability.
