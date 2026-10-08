# Navigation screenshot inspection

<!-- versioning: git; committed history is authoritative -->

Owner: Dean Fiedler. Owner/device acceptance: **Pending**. Codex inspected actual ready-state local synthetic captures. [Capture manifest](capture-manifest.json) records exact commit, fixture, viewport and SHA-256. These older screenshots retain their actual capture commits; the final hierarchy addition is separately checked/captured.

| Capture | Inspection |
|---|---|
| [compact-sales.png](captures/compact-sales.png) · 1440x900 | Navy compact rail and intact logo; active Deal has inset marker plus contrasting background; full board headings readable. |
| [expanded-my-work.png](captures/expanded-my-work.png) · 1440x1000 | 232 px labels and My Work secondary menu coexist; repaired content width keeps actual Activity titles and action buttons readable. |
| [short-service-more.png](captures/short-service-more.png) · 1280x400 | Logo and More remain anchored; rail and menu scroll instead of clipping endpoints. Popover stays inside short window. |
| [mobile-320-more.png](captures/mobile-320-more.png) · 320x900 | Labelled Workspace and destinations fit; menu search focus visible; body contained within viewport. This is reflow, not zoom. |
| [restricted-mobile.png](captures/restricted-mobile.png) · 390x844 | Restricted destinations and ordinary Workspace are labelled; Finance/Engineering are absent; My inspections remains reachable. |
| [expanded-781-more.png](captures/expanded-781-more.png) · 781x900 | Desktop transition retains expanded rail and bounded More; underlying board uses its existing internal view width. |
| [expanded-1200-more.png](captures/expanded-1200-more.png) · 1200x900 | Expanded labels wrap without clipping; menu fits next to rail with visible selected Sales context. |

| Final capture | Inspection |
|---|---|
| [finance-desktop-hierarchy.png](captures/finance-desktop-hierarchy.png) · 1440x1000 CSS px (scale 1) | All authorized ancestors and exact account reference are usable in the disclosed path; explicit 44 px trigger retains compact-header space. |
| [finance-mobile-hierarchy.png](captures/finance-mobile-hierarchy.png) · 390x844 CSS px (scale 1) | Phone inline text is shortened; labelled hierarchy exposes the complete readable path and exact reference. Native popover stays inside viewport; keyboard Escape focus test passed. |
| [final-mobile-320-more.png](captures/final-mobile-320-more.png) · 320x900 CSS px (scale 1) | Final source still fits labelled Workspace and More at 320 CSS px; search focus visible and destinations readable. Reflow only. |

The first expanded My Work capture at `6284b34` exposed compressed titles beside the docked menu. The content container repair at `0c9d138` was tested with a real populated Activity row (minimum readable row width plus no page overflow) and the ready-state replacement above was inspected. That observation is a repair, not retrospective acceptance of the earlier image.

The 780/781 shell transition and 1200 secondary-menu threshold remain unchanged. Screenshots of More at 1200 do not themselves prove every secondary-menu consumer. Keyboard/Escape focus and selected geometry have automated proof; physical touch, screen reader, actual browser 200% zoom, rotation, 1920/1366 desktop capture and owner/device review remain unrun. Reduced viewports are reflow, never zoom. Final-head CI and deployment are separate.
