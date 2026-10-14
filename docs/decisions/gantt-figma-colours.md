---
document_id: PPO-GANTT-FIGMA-COLOURS-DEC
date: 2026-10-14
owner: Dean Fiedler
status: Owner decision; colours implemented on a branch; Overdue state, owner visual review and deployment separate
source_commit: 65141dcb8a3e39f6516f69955e8260ed447d152b
versioning: git
---

# Projects Gantt colours — adopt the Figma set

On 14 October 2026 Dean compared the Gantt drawn in Figma (the Schedule view of the Project record page) with the Gantt built in the application, and said: "Regarding the Gantt chart, I think I like the Figma version more. What is your professional opinion?" Claude advised adopting the Figma colours and recorded the reasons below. Claude proposed three steps: a decision record, a separate code change with a rendered before-and-after check, and carrying over the conflicted-task state. Dean replied: "Yes, go ahead with those steps."

The built Gantt is the r10 design that Dean approved on 10 September 2026 ("Lets lock it in and integrate it into the Powerplants One app", recorded in [Approved Projects Gantt integration](projects-gantt-integration.md)). This record changes the colours of that Gantt only. The retained r10 HTML, and its geometry and behaviour, are unchanged.

Scope:
- **Where:** the `ProjectsGantt` component, shown on the Schedule view of `/projects/[id]` and in the Programme view, and the component catalogue example.
- **What:** the colours of bars, milestones, phase summary bars, the today marker, the list-row status dots, the task progress track and the legend. The legend also gains Planned and Today entries.
- **Parent record:** [Approved Projects Gantt integration](projects-gantt-integration.md). No parent requirement ID is added or renamed; all 78 remain.

This is a presentation decision. It authorises none of the following:
- a change to task data, statuses, dependencies, dates, the calendar, an API, a migration, a permission or a capability;
- a derived Overdue state (see section 3);
- a change to bar or row geometry, or to the toolbar and list columns;
- deployment.

## 1. Why the Figma set

| Reason | Detail |
|---|---|
| Each colour has one meaning | In PPO, green means complete or confirmed. The built chart used green for complete bars and for the today line, and teal for in-progress bars. Teal sits next to green, so three near-green signals carried different meanings, and teal and green are hard to tell apart for some colour-blind users. The Figma set uses green for complete, blue for in progress, orange for at risk and a purple today marker that no status uses |
| Outlines use PPO status tokens | Bar outlines use the existing status colours (success `#416d33`, warning `#80530e`) and the control border `#828e9f`. Only the blue and the purple are new |
| Contrast | The today marker is 5.0 : 1 against white where the old green line was 4.3 : 1. Every bar and milestone outline is at least 3.3 : 1 against white (section 5) |
| Owner preference | Dean preferred the Figma version |

## 2. Colour mapping

The Figma variables already carried the code syntax `var(--gantt-*)`. The stylesheet now defines them, so the Figma names resolve.

| Use | Figma variable | CSS variable | Value |
|---|---|---|---|
| In-progress bar fill | `proposal/gantt-blue-fill` | `--gantt-blue-fill` | `#e8f1fb` |
| In-progress progress fill | `proposal/gantt-blue-progress` | `--gantt-blue-progress` | `#b7d1ef` |
| In-progress outline, list dot, task progress track | `proposal/gantt-blue-outline` | `--gantt-blue-outline` | `#4a7bb7` |
| At-risk progress fill | `proposal/gantt-orange-progress` | `--gantt-orange-progress` | `#f6cd8b` |
| Complete milestone fill | `proposal/gantt-green-progress` | `--gantt-green-progress` | `#9fcd8e` |
| Overdue milestone fill (not yet used) | `proposal/gantt-red-progress` | `--gantt-red-progress` | `#f2b5a7` |
| Today line and label outline | `proposal/gantt-today` | `--gantt-today` | `#7c5cc4` |
| Today label fill | `proposal/gantt-today-surface` | `--gantt-today-surface` | `#eee9fb` |
| Today label text | `proposal/gantt-today-text` | `--gantt-today-text` | `#5b3fb0` |
| Complete bar fill and outline, list dot | `status/success/surface`, `status/success/text` | `--success-surface`, `--success` | `#edf5e9`, `#416d33` |
| At-risk bar fill and outline | `status/warning/surface`, `status/warning/text` | `--warning-surface`, `--warning` | `#fff2d9`, `#80530e` |
| Planned bar fill, planned outline, phase summary bars | `surface/subtle`, `border/control` | `--surface`, `--control-border` | `#f6f7f9`, `#828e9f` |

The page defines these in its own scope, `#ppo-gantt-page`, with the same names and values as the shared My Work tokens. A planned bar's progress fill uses the hairline `#cbd2dc`, which Figma does not draw because a planned task has no progress. The unused teal variable was removed.

## 3. Not changed, and differences from the Figma design

- **Overdue:** the Figma legend and one milestone show an Overdue state in red. The application has four task statuses (Planned, In progress, At risk, Complete) and no Overdue. Showing it needs a rule for how overdue is derived (against which date, calendar and status). That is a business rule, so it is not built. The `--gantt-red-progress` variable is defined for it.
- **Conflicted tasks:** the built chart outlines a task with a schedule conflict in red and tints it. The Figma Schedule frame draws no conflicted bar, so this state is kept as built.
- **Phase summary bars:** a completed phase's summary bar was green. It is now grey like every other summary bar, as in Figma.
- **List-row status dots:** the Figma list draws no dots. The built dots are kept and follow the new palette: green for complete, blue for in progress.
- **Geometry:** bar radius (4 px in the application, 3 px in Figma), row heights, the today label's position and the phase bar shape are unchanged.
- **In-bar percentage text:** was dark teal and is now the page ink colour.
- **Retained references:** the r10 HTML and the Figma capture [PPO-Project-Record-02-Desktop-Schedule-Gantt-r01.png](../reference/ui/projects/project-record-page-design-r01/PPO-Project-Record-02-Desktop-Schedule-Gantt-r01.png) are unchanged.

## 4. What changed in the code

- `src/app/projects-gantt.css`: tokens, bars, the progress fills that a later block overrides, milestones (both the `.milestone` and the `.milestone-shape` rules), summary bars, the today line and label, the list dots, the task progress track, the legend and the unused swatch rules.
- `src/components/projects-gantt.tsx`: two legend entries, Planned and Today. No logic changed.

## 5. Accessibility

Progress is stated as a percentage in its own column, and the legend names each colour in words. A task's status is otherwise carried by bar colour and outline, as it is in the Figma design and in the r10 design before it. That is a limit: a reader who cannot tell the colours apart gets no text cue for the status. Adding one, such as an icon or a pattern, would be a design change and is not made here.

| Pair | Ratio |
|---|---:|
| Planned bar and milestone outline `#828e9f` on white | 3.3 : 1 |
| Complete bar outline `#416d33` on white | 6.1 : 1 |
| In-progress bar outline `#4a7bb7` on white | 4.4 : 1 |
| At-risk bar outline `#80530e` on white | 6.6 : 1 |
| Today line `#7c5cc4` on white | 5.0 : 1 |
| Today line `#7c5cc4` on the weekend band `#f7f8fa` | 4.7 : 1 |
| Today label text `#5b3fb0` on `#eee9fb` | 6.4 : 1 |
| Progress fill `#b7d1ef` on the in-progress bar fill `#e8f1fb` | 1.4 : 1 |
| Progress fill `#f6cd8b` on the at-risk bar fill `#fff2d9` | 1.4 : 1 |

The last two rows are weak, as they are in the Figma design. Progress is also stated as a percentage in its own column, so it is not conveyed by the fill alone. A darker progress fill would be a design change and is not made here.

## 6. Verification

- **Rendered check:** the real `ProjectsGantt` component was rendered with the catalogue fixture, once with the stylesheet from main and once with the changed stylesheet, at 1440 × 900. A second scenario sets every status so that each colour appears. The four images and their hashes are in the [evidence record](../testing/evidence/gantt-figma-colours/README.md). The first rendering showed that two later override blocks still painted the old colours, and they were fixed before the images were taken.
- **Checks run:** ESLint on the changed component, the Font Awesome unit test that renders the Gantt icons, `npm run studio:check` (no errors, unreviewed and stale counts unchanged), `check_naming.py` and `check_foundation.py`.
- **Typecheck:** `tsc --noEmit` reports five errors, all in `src/estimating/import/archive.ts`, because the dependency `yauzl` is declared in `package.json` but not installed in the shared `node_modules` used for this check. None is in a changed file.
- **Not run:** the compiled browser suites (`tests/browser/projects-gantt.spec.ts`, `tests/projects-ui/gantt.spec.ts`) need a database and run in CI. No test asserts a Gantt colour. No real device was used, and the render has no Kit icons.

## 7. What remains open

- **Overdue state:** needs an owner decision on how it is derived, then a build.
- **Owner visual review:** the Gantt component review stays Pending, and no fingerprint was refreshed.
- **Figma library:** the nine `proposal/gantt-*` variables are now built, so the `proposal/` prefix is out of date. The Start here "Library source" line and the Figma library check recorded in PR #478 (not yet merged, so not linked here) still list the Gantt colours as a difference. Both need updating when this merges.
- **Status without colour:** a text, icon or pattern cue for each status, designed in Figma first.
- **Darker progress fill:** a possible refinement, also in Figma first.
