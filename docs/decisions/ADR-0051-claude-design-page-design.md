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

## Design kit — 10 October 2026

Dean asked how the design system should be used. He had noticed that the boards were inconsistent with each other, and that pages built from a board did not always match it. Claude found two causes:

- The design system gave boards little to build with: seven previews and no page templates, so each board redrew tables, cards, panels and headers.
- Boards and the app were made from different parts, and built pages were not compared with their boards before being called done.

Claude recommended a kit captured from the app. Dean replied "Yes, start with the kit". He then approved the proposed contents and references: "Yes, approve both, go ahead".

These rules are added to the Decision above:

6. **The design system describes only what the app has.** A part joins the kit when it exists in the app as a shared component. Boards are assembled from the kit. When a board needs something the kit lacks, the board labels it as a proposed component. When it is built, it is built as a shared component, added to the component catalogue, and then added to the kit at the next resync.
7. **Kit previews are captured, not drawn.** Each preview is markup from the running app or its component catalogue. Its stylesheet is the app's own CSS rules for that markup, in the app's cascade order. [`scripts/design-system/`](../../scripts/design-system/README.md) regenerates them at each resync.
8. **Compare the built page with its board before calling it done.** Use the board's viewport and data, then fix or record each difference, as the [image-to-implementation workflow](../design/development/README.md) already requires.

### Group 1: built 10 October 2026

The kit has twelve parts. All of them already exist in the app as shared parts. They were captured from `main@ed3ccb8` and published as design system version 9 (`1791637382-b3c7`).

| Part | Captured from |
|---|---|
| Application shell, desktop and phone | `/estimating` at 1440 × 900 and 390 × 844 |
| Module navigation | `/estimating` |
| Page header (record) | A synthetic customer record |
| Buttons, fields (including `LocalDateTimeField`), lookup, validation, status, read states, section tabs | The component catalogue's examples |
| Segmented control | `/schedule` |

All 385 rules came from the app's shared stylesheet; none came from a module stylesheet. Font Awesome was blocked during the capture, and no Pro artwork reached the markup. Each preview was rendered with the design system's tokens and compared with the app at the same width. They match, with these exceptions:

- **The phone header's title.** On `/estimating` the app cuts the title off sooner, because of an Estimating-only override of the shared header (`.workspace:has(.est-workload) .product-heading { max-width: 22% }`).
- **Fieldset borders.** The in-app catalogue draws a border around fieldsets as presentation; real pages use the app's borderless fieldset, as the kit does.

The capture also showed that the app's page text is 14/1.45 (16px on phones): `shared-layout.css` overrides the 15/1.6 in `globals.css`. The design system's `body` and `label` styles are corrected. The "last loaded" timestamp is formatted text without markup of its own, so it is not a kit part.

### Group 2: references approved, to be built

These parts are repeated in each module, and the app has no shared version yet. Each one becomes a small PR. The PR builds the shared component in the app, switches the reference module to it, and adds it to the catalogue with its guide, fixtures and consumer links. The kit picks it up at the next resync.

| Order | Part | Approved reference |
|---|---|---|
| 1 | Register table | The house register from EN-06/EN-07 (`em-table`, `em-chip`, `src/app/styles/engineering-materials.css`) |
| 2 | Context strip | The compact EN-06/EN-07 context row (`em-context`) |
| 3 | Right-hand inspection panel | The Deals side panel: 448px, and 480px at 1600px and wider |
| 4 | Record cards | Sales board cards |
| 5 | Dialog | `WorklistPanel`, moved out of CRM |
| 6 | Filter bar, metric tiles, pills | No clear reference. Claude compares the module versions and brings Dean a recommendation first |

Two parts exist only on boards, not in code: the 292px supporting column and the action footer. They stay proposals until a page needs them.

### Group 3: page templates

Templates follow once groups 1 and 2 exist. Each template is the shell plus kit parts, laid out as one of the r20 page types. The first two are the most common on boards: a register list, and a work queue with a detail panel. A record page and a form follow.
