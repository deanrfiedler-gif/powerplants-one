# Gantt Figma colours — rendered before and after

<!-- versioning: git; committed history is authoritative -->

Owner: Dean Fiedler. Executed 14 October 2026 on `main` at `65141dcb8a3e39f6516f69955e8260ed447d152b` plus the colour change in [decision](../../../decisions/gantt-figma-colours.md). These images are renderings of the real `ProjectsGantt` component with the synthetic catalogue fixture (reference date 23 September 2026). They are not screenshots of the running application, and they carry no Font Awesome Kit icons: the component shows its own line icons, as it does when the Kit is not running.

## Method

A temporary script, not committed, rendered `ProjectsGantt` with React's static server renderer and the fixture `projectFixture` from `src/development/component-fixtures.ts`. It wrapped the markup in a page that loads only `src/app/projects-gantt.css`, once as it is on `main` and once as changed, and took a 1440 × 900 screenshot of each in Chromium through Playwright.

Two scenarios were rendered:
- **fixture:** the catalogue fixture as it ships.
- **statuses:** the same fixture with the task statuses changed to Complete, At risk, In progress, Complete and Planned, so that every status colour appears.

## Images

| Scenario | State | File | Size (px) | Bytes | SHA-256 |
|---|---|---|---|---:|---|
| fixture | Before | [gantt-before-fixture.png](gantt-before-fixture.png) | 1440 × 900 | 125,282 | `4acd9dc8af5d2b8a09d13efa600cf19c2716083468027a12044c69d04d456ff3` |
| fixture | After | [gantt-after-fixture.png](gantt-after-fixture.png) | 1440 × 900 | 123,757 | `c837bb42664cd4ffe2321d38cb1850124c3efb249ad43d3ede4d399bd69e5c07` |
| statuses | Before | [gantt-before-statuses.png](gantt-before-statuses.png) | 1440 × 900 | 125,306 | `dfd0deb7fff45695e20520ad58f0358ba0cebc5f9a048912e47f32fc5aa6308f` |
| statuses | After | [gantt-after-statuses.png](gantt-after-statuses.png) | 1440 × 900 | 123,797 | `5d2a0c10be026227f016a6bac451935387148f1b9ee234d9c8ecceaab785cfc3` |

## What the images show

- **Complete:** a pale green bar with a dark green outline, where the old bar was a saturated green fill.
- **In progress:** a pale blue bar with a blue outline and a light blue progress fill, where the old bar was teal.
- **At risk:** a pale orange bar with an orange progress fill and a brown outline.
- **Planned:** a pale grey bar with a grey outline, and the legend now lists it.
- **Milestones:** outlined diamonds when planned, and a green filled diamond when complete, where the old diamonds were dark grey and filled.
- **Phase bars:** all grey. A completed phase was green.
- **Today:** a solid purple line, where it was a dashed green line. The legend now lists Today.
- **Conflicted task:** unchanged, a red outline and tint.

## Limits

- The renders use the page stylesheet alone. They do not include the application shell, the Kit icons or the page's other stylesheets, so they show the chart, not the whole page.
- Fonts depend on the machine that rendered them.
- Only 1440 × 900 was rendered. The phone layout and the list view were not.
- A person has not compared these with the Figma frame side by side. The comparison was made by the author against the Figma colour values and the retained capture.
- No browser or database suite was run for this change. Those run in CI.
