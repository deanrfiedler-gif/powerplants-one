# ADR-0053 — Figma for page design

<!-- versioning: git; committed history is authoritative -->

Owner: Dean Fiedler. **Status:** accepted by the owner, 11 October 2026. This record revisits [ADR-0051](ADR-0051-claude-design-page-design.md) and replaces its choice of drawing tool. ADR-0051's other rules continue, as set out under Decision.

Related: [ADR-0051](ADR-0051-claude-design-page-design.md) (Claude Design for page design); [ADR-0040](ADR-0040-development-workspace.md) (Git-backed design and development workspace); [ADR-0050](ADR-0050-font-awesome-light-icons.md) (Font Awesome Pro licence limits); the [UI build and review sequence](ui-build-sequence.md); the [navigation architecture](navigation-architecture-board.md); the [ES-04 review](estimating-review-native.md) and [ES-05 quotation approval](quotation-approval-issue-distribution-design.md) decisions that the comparison page follows; the [design and build workflow](../design/development/README.md).

## Owner decision — 11 October 2026

On 11 October 2026 Dean opened a Figma account to see what it could do. He later moved his team to Figma's Professional plan with a Full seat. Claude built a trial file from the running app. While other pull requests waited, Claude used it to draw a new page: a proposal for Reviews & approvals, the reserved Estimating slot. The page compared Figma with Claude Design boards on three questions, written on the page itself.

Claude asked Dean to compare the two tools. His answers:

| Question | Dean's answer |
|---|---|
| Faster to get right: which tool got the page to a good first version with less back-and-forth? | Figma |
| Easier to refine: which was easier when something changed, for example editing the review row and watching every row update? | Figma |
| Better to click through: which gives the more useful clickable preview? | Figma |
| Overall: what should happen to ADR-0051? | "Figma wins: revisit" |

Claude then asked three follow-on questions, each with a recommended option. Dean chose the recommended option each time:

- **Claude Design:** "Retire for new work". New pages and option comparisons are drawn in Figma. Existing boards, the design system artifact and the UI refinement canvas stay as historical records, and are no longer resynced.
- **Working file:** "Keep the trial file". It keeps everything the trial built. Dean renamed it "PPO - Design" the same day.
- **Evidence:** "Icon-free capture + version". Decision records cite the Figma file, the node IDs and a named Figma version. The repository keeps a capture, with its hash, in which the icons are replaced by plain placeholders.

Accepted: Dean designs the Powerplants One pages himself in Figma. Git stays the authority. Claude Design is retired for new work.

## Context

- **ADR-0051 (10 October 2026)** kept Claude Design and did not adopt Figma. It named four reasons to revisit: a second designer, Powerplants staff commenting on designs directly, a funded build with a design team, or Claude Design no longer serving the work. None of these has happened. This revisit comes instead from the owner's direct comparison of the two tools on the same kind of work.
- **What ADR-0051 expected of Figma, and what the trial found:**
  - ADR-0051 said: "Claude can read Figma frames through a connector, but Dean would do the drawing." In the trial, Claude drew the whole file through the Figma connector's write tool (`use_figma`, which runs the Figma Plugin API). That covered variables, text styles, components with variants, the shell, three templates, and the comparison page with its prototype interactions. Dean learnt the editor alongside, and built a practice component himself.
  - ADR-0051 said Figma "needs a second, hand-maintained copy of the tokens, shell and components, which drifts from the CSS". That is still true. The trial took its colour variables from `src/app/styles/my-work.css`, giving each one its CSS name as its code syntax. It built the shell from `main@ed3ccb8` and from measurements of the running app. Nothing keeps the two in step automatically.
  - ADR-0051 listed licence cost and learning time. Dean has taken on both: a paid seat, and learning the editor with step-by-step guidance.
- **What the trial built**, in the file now named "PPO - Design":
  - Variables: "PPO colour" (from `my-work.css`), "PPO layout" (radii, spacing and shell sizes) and "Prototype" (the menu toggle). The `PPO/*` text styles use Roboto.
  - Components: Tag, Button, Menu item, Rail item, Attention item, Activity row, Side panel, and 49 icons. Each icon is named `Icon/<name>`, matching `src/components/font-awesome-icons.ts`.
  - The Shell page: the logo, the rail (collapsed and expanded), the top bar, the menu, the More link and panel, the phone header, tabs, the tab bar and quick add. It also has three templates: desktop, desktop without the menu, and phone.
  - Reviews & approvals (proposal): desktop and phone screens, two page components (Review row and Review card) and a notes card. The page fills the reserved Estimating slot `estimate-reviews` with synthetic data and follows the ES-04 and ES-05 rules. It is a proposal: not built and not accepted. Its open questions are listed on its notes card.
- **Limits observed in the trial:**
  - The file holds Font Awesome Pro artwork (ADR-0050). It must therefore stay private, and its frames cannot be captured into this public repository as they are.
  - The connector's read tools, for screenshots and metadata, use a monthly allowance on Dean's seat; its write tool does not. Claude checks its work with screenshots taken inside the write tool.
  - The connector cannot see a Font Awesome library. New icons are copied from Dean's Kit through a temporary local page, then drawn as components in the file.
  - The free Starter plan limited a file to three pages and blocked prototype variables and conditional actions. The paid plan removed both limits.
  - Several sessions can have the file open at once. Figma merges their edits, but one session can still undo another's work.

## Options

| Option | For | Against |
|---|---|---|
| A. Keep Claude Design (ADR-0051) | Boards are built from the app's own CSS, so they look close to what gets built. There is no second library and no extra licence. Existing decision records already point to it. | Dean's comparison judged it slower to get right, harder to refine and worse to click through. Boards are private to one account, and several sessions editing one board caused publish conflicts. |
| B. Figma, with Claude Design retired for new work | Dean judged it better on all three questions. With component variants and variables, one change updates every use. Present mode gives a click-through prototype. Fine visual work can be done by hand. Claude can draw in it through the connector. | A second library that has to be kept in step with the CSS by hand. Pro icon artwork keeps the file private and complicates captures. A paid seat. The connector's reads are limited. |
| C. Both tools | Each tool is used where it is strongest. | Two libraries to resync, and design history split between two places, for a single designer. |

## Decision

Option B.

These rules come from Dean's answers:

1. **Figma is the drawing surface.** Draw the following in the Figma file "PPO - Design": new pages, structural layout choices, side-by-side comparisons of options, and visual refinements that Dean wants to make by hand. Claude draws through the Figma connector, explaining each step so that Dean can make changes himself.
2. **Claude Design is retired for new work.** No new boards are drawn, and the design system artifact is not resynced again. Existing boards, the design system artifact and the UI refinement canvas stay as they are, linked from the decision records that relied on them. Those records are not rewritten.
3. **Evidence is a named version and an icon-free capture.** Before a Figma design is relied on, save a named version in the file's version history. The decision record cites the file name, the frame's node IDs and that version. Retain a capture of the frame under `docs/reference/ui/` with its hash, as for boards. In the capture, every icon is replaced by the `Icon/placeholder` shape, so no Pro artwork reaches the repository. The file's link is never put in this repository: if its sharing were ever opened, the link would publish the artwork.

These rules carry over from ADR-0051, with Figma in place of boards:

4. **Git stays the authority.** Figma is a drawing surface and never the master. Its designs are proposals until a decision record in `docs/decisions/` accepts them. Page contracts and the design register follow the existing workflow.
5. **The Figma library describes only what the app has, and is built from the repository.** Variables take their values and code syntax from the app's CSS. The shell and shared components are built from the app's stylesheets and checked against the running app at the same viewport. A part the app does not have yet is drawn on the page that needs it and labelled as proposed, as Review row and Review card are. It joins the library only after it is built as a shared component in the app. When the tokens, the shell, the icons or the component catalogue change, Claude updates the library and records the source commit on the file's Start here page.
6. **Small refinements can still be made in the app.** Small refinements of an existing page can be made directly in the running app, at the review viewport, using the component catalogue.
7. **Compare the built page with its design before calling it done.** Use the design's viewport and data, then fix or record each difference.
8. **One Claude session edits a given page of the file at a time.**
9. **Licensed artwork stays private.** The Figma file stays private to Dean's team and is never published to the Figma Community. Pro artwork never goes into the repository or into a retained capture. Repository text names an icon by its mapped Font Awesome name.

Group 2 of the design kit (ADR-0051) continues. Each part, starting with the register table, is built as a shared component in the app and added to the component catalogue. It is then drawn as a Figma component, rather than joining the Claude Design kit.

## Consequences

- No application code, dependency or service changes. No page, scope ID or parent requirement ID changes; all 78 parent IDs remain. Figma is a design tool on Dean's own seat, not part of the application.
- ADR-0051 remains the record of the Claude Design period. Its board records, captures and artifact links remain valid as history. Its status line now points to this record.
- Keeping the Figma library in step with the code becomes routine maintenance. The trial library reflects `main@ed3ccb8`. Up to `main@0e10459`, main has added planner styles for `/schedule` but has not changed the tokens, the shell or the icon mapping.
- The `scripts/design-system/` tools captured the Claude Design kit's previews. They are no longer routine maintenance, but they stay in the repository.
- A Figma design never becomes a production claim or an accepted design on its own.
- **Revisit when** someone else joins the design work, Dean's Figma seat or the connector's write access ends, keeping the library in step costs more than it saves, or Figma stops serving the work. If someone else joins, first check the Font Awesome Pro licence for a shared file. Git holds the tokens, components, contracts and captures, so any move would rebuild from those sources.

## Validation

- The evidence for this decision is Dean's comparison of 11 October 2026. It is one owner's judgement on one page, not a measured study.
- Rule 3 was first used on 11 October 2026 for the [Reviews & approvals design](estimate-reviews-design.md): seven captures from copies of the accepted frames, with every icon swapped for `Icon/placeholder`, cited with the named version "Reviews & approvals — Pipedrive pattern, accepted".
- This record implies no owner visual review of any page or component.
