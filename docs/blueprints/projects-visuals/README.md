# Projects — static design plates

**Revision:** r01 · **Date:** 7 September 2026 · **Status:** Synthetic visual proposal, no application behaviour.

[Screen contract](../projects-screen-specification.md) · [BP-06](../BP-06-projects-commercial-delivery.md) · [Handover](../../delivery/projects-discovery-handover.md)

| Plate | SVG source | Intended review |
|---|---|---|
| [Project register](projects-register-desktop.png) | [SVG](projects-register-desktop.svg) | 1440×960 desktop; four fictional projects, scoped-summary definitions and full identity/action context |
| [Project detail](project-detail-desktop.png) | [SVG](project-detail-desktop.svg) | 1440×960 desktop; health/blocker, manual outlook, milestone and next action |
| [Phone detail](project-detail-phone.png) | [SVG](project-detail-phone.svg) | 390×1080 content sample; stacked content and full-width actions |
| [Recovery states](project-recovery-states.png) | [SVG](project-recovery-states.svg) | 1280×840; uncertain save, conflict, no matches and changed access |

PNG captures are rasterised at 1.25× source dimensions for readability. Static text uses outlines from the existing embedded Roboto; the unchanged existing logo is embedded as PNG bytes. The supplied logo attachment was hash-compared with that source. Preserve complete logo/padding/aspect ratio and existing semantic colours. Source artwork and its licence remain in the existing UI assets; this package adds no new font or logo.

`python3 docs/blueprints/projects-visuals/render.py` reproduces SVGs/PNGs with fontTools and PyMuPDF available in the authoring environment. These are authoring dependencies only; no application lockfile is changed. [render.py](render.py) contains synthetic design values, not a product data model or working UI. The screen contract governs future interactions and long-content responsiveness. PNG inspection does not pass keyboard, browser, responsive implementation, save or permission tests.
