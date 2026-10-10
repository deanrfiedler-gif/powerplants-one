# ADR-0051 — Claude Design for page design

<!-- versioning: git; committed history is authoritative -->

Owner: Dean Fiedler. **Status:** accepted by the owner, 10 October 2026.

Related: [ADR-0040](ADR-0040-development-workspace.md) (Git-backed design and development workspace); the [hosted design workspace](hosted-design-workspace.md); [ADR-0050](ADR-0050-font-awesome-light-icons.md) (Font Awesome Pro licence limits); the [UI build and review sequence](ui-build-sequence.md); the board records for [ES-01](es01-design-board.md), [ES-02](es02-design-board.md), [ES-08](es08-design-board.md) and the [navigation architecture](navigation-architecture-board.md); [HTML module conformance](../standards/html-module-conformance.md); the [design and build workflow](../design/development/README.md).

## Owner decision — 10 October 2026

Dean asked whether designing the UI pages in Claude Design was "the correct and most professional approach". Claude recommended keeping Claude Design as the drawing surface, with Git as the authority, and noted that Figma is the usual tool for design teams. Dean then said that he will be designing the pages himself and no one else will be involved, and asked whether Figma would still help. Claude recommended staying with Claude Design. Dean replied: "Proceed with the ADR and resync the design system."

Accepted: Dean designs the Powerplants One pages himself in Claude Design. Figma is not adopted.

## Context

- **How pages are designed now.** Since 23 September 2026, page designs have been drawn as Claude Design boards: private Design artifacts in Dean's claude.ai account. The boards use the [Powerplants One design system](https://claude.ai/artifact/WwJiq36rg1KDdv1yS486SP) artifact. It is built from the repository's stylesheets, fonts, logos and component catalogue, not drawn by hand. The repository's records link seven claude.ai artifacts, including the design system and the UI refinement canvas.
- **What the repository already holds.** Git is the design authority (ADR-0040 and the hosted workspace decision). It holds the runtime tokens in `src/app/globals.css` and the shell stylesheets, and the component catalogue in `docs/design/development/components.json`, which `/development/design-system` renders with real components. Page contracts are under `docs/design/development/pages/`. Board decisions are in `docs/decisions/`, with captures and their hashes under `docs/reference/ui/`.
- **No record of the tool choice.** `AGENTS.md` asks for an ADR before a technology is chosen. The board records name their artifacts, but nothing recorded why Claude Design was used, its limits or when to change.
- **One designer.** Dean is the only designer, and an AI agent builds the pages. No staff, stakeholder or agency reviews the designs.
- **Limits observed by 10 October 2026:**
  - Boards are private to Dean's account. The ES-01 record says of its board: "Only the owner can open it". The retained captures are the durable record.
  - Several Claude sessions edited the UI refinement canvas at once and caused publish conflicts.
  - Desktop boards that copied the application shell drifted from the app. They kept the selected rail state from before ADR-0050 until the canvas moved to one shared shell board.
  - The design system recorded its last sync as `main@5499df4` (23 September 2026), 668 commits before `main@ed3ccb8`. The rail colours, icon delivery and 17 catalogue components had changed since.
  - Font Awesome Pro artwork must not be made publicly available (ADR-0050).

## Options

| Option | For | Against |
|---|---|---|
| A. Claude Design boards on the repository-derived design system (current) | Boards use the app's own tokens, fonts and shell, so they look close to what gets built. The same agent can draw a board, read it back and build from it, with no handoff step. The decision records and captures already point to it. No extra licence. | Boards are private to one account. It handles several sessions on one board poorly. Fine adjustments are described in words rather than moved by hand. The design system needs a resync when the app changes. The boards live on a hosted service that could stop serving them. |
| B. Figma | The industry standard. Direct manipulation for fine visual work, mature components with variants and variables, click-through prototypes on a phone, plugins, and many designers who know it. | Its collaboration features would have no second user. It needs a second, hand-maintained copy of the tokens, shell and components, which drifts from the CSS: the drift seen with copied shells, on a larger scale. Claude can read Figma frames through a connector, but Dean would do the drawing. The design history would be split between two tools. Licence cost and learning time. |
| C. Design only in the running app and the component catalogue | Cannot drift, because it is the app. Real data states and real components. | Slow for exploring layouts of pages that do not exist yet, and for comparing options side by side. |

## Decision

Option A, with option C for refinements of existing pages.

1. **Git stays the authority.** Claude Design is a drawing surface and never the master. Before a board is relied on, its decision goes into `docs/decisions/` and its captures, with hashes, into `docs/reference/ui/`. Page contracts and the design register follow the existing workflow.
2. **Boards use the repository-derived design system.** Resync the design system artifact when the tokens, shell, icons or component catalogue change, and record the source commit in the provenance block of its `tokens.json`. A board never copies the shell's markup: desktop boards mount the shared shell board.
3. **Board or app.** Draw a board for a new page, a structural layout choice or a side-by-side comparison of options. Refine an existing page in the running app at the review viewport, using the component catalogue.
4. **One editor per board.** Only one session edits a given board at a time.
5. **Licensed artwork stays private.** Font Awesome Pro artwork never goes into the link-shared design system, the repository or a retained capture. Specify an icon by its mapped Font Awesome name.

## Consequences

- No tool, dependency, licence or service is added, and nothing in the application changes. No page, scope ID or parent requirement ID changes; all 78 parent IDs remain.
- Resyncing the design system becomes routine maintenance. The first resync under this decision ran on 10 October 2026 (see Validation).
- Boards stay private. Anyone else, including a later designer, sees the retained captures and decision records.
- **Revisit when** someone else joins the design work, Powerplants staff need to comment on designs directly, PPO moves from prototype to a funded build with a design team, or Claude Design stops serving the work. Git holds the tokens, components, contracts and captures, so a move to Figma would build its library from those sources. No repository record would need rewriting.

## Validation

On 10 October 2026 the design system artifact was resynced from `main@ed3ccb8`, giving version 8 (`1791634586-d2f5`):

- Three rail colours changed for the white selected tile with a navy glyph (`ppo-rail-selected`, `ppo-rail-ink` and `ppo-icon-cutout`), and the 232 px labelled rail is noted on `ppo-rail-width`.
- Twelve component guides were updated and seventeen added. The design system now covers 40 of the catalogue's 41 entries; the 41st, Theme foundations, is its tokens.
- The new Status `tone` option, the ReadState and ErrorNotice `focusOnError` option and `LocalDateTimeField` are in the guides and types.
- The iconography guidance follows ADR-0050, and the Icons group is described as the local fallback drawings. No Pro artwork was uploaded.
- The rules copied into the system's `bundle.css` were compared with `main` and are unchanged.
- Hand-written notes in the guides were kept. Each guide was merged against the catalogue as it stood at the last sync, so only the sections the catalogue had changed were rewritten.

The resync found ten en dashes and six arrows double-encoded in `docs/design/development/components.json` on `main`, introduced by `d29c020`. The design system carries the correct characters; this decision does not change the repository file.

This record implies no owner visual review of any page or component.
