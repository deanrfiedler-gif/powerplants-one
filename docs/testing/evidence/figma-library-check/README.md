# Figma library check against the application

<!-- versioning: git; committed history is authoritative -->

Owner: Dean Fiedler. Executed 14 October 2026 against `main` at `65141dcb8a3e39f6516f69955e8260ed447d152b`. This is the re-check that [ADR-0053](../../../decisions/ADR-0053-figma-page-design.md) rule 5 requires and that [ADR-0055](../../../decisions/ADR-0055-figma-file-structure.md) recorded as outstanding. The previous check was on 11 October 2026.

## Method

- **Figma side:** every local variable, with its value and code syntax, and every text style, was read from the working file "PPO - Design" through the Figma connector, and the names of the 174 icon components on the Components page were listed. Nothing in the file was changed to run the check.
- **Application side:** the 62 stylesheets under `src/` were scanned for custom properties, and `src/**/*.ts*` for literal values. Custom properties were resolved one step where one aliases another.
- **Comparison:** a colour variable with a code syntax of the form `var(--name)` passes when the application defines `--name` with the same hex value. A variable with no code syntax passes when its hex value appears anywhere under `src/`.

## Results

| Area | Result |
|---|---|
| Colour variables that map to a CSS variable | 33 of 33 defined variables match the application exactly. These are the 32 My Work tokens, plus `shell/rail-hover` |
| Colour variables with no code syntax | 13 of 17 appear in `src/`. Four do not: `proposal/row-selected` (`#eff2f6`), `proposal/rail-badge` (`#474c57`), `proposal/attention-dot` (`#c47f17`, drawn for graphics only) and `proposal/cpq-info-border` (`#c7d8ea`). The CPQ surface `#e9f1fa` is in `src/components/cpq.css` |
| Gantt colours | The nine `proposal/gantt-*` variables name CSS variables that do not exist, and none of their hex values appears in the application. The built Gantt page (`src/app/projects-gantt.css`) uses a teal progress bar and a green today line, where the Figma variables are blue progress fills and a purple today marker. The repository does not record which accepted Figma pages use them |
| Radii and control sizes | Match: radii 6, 7 and 10 px, control height 44 px, gap 8 px, padding 12 px |
| Rail and menu widths | Collapsed rail 76 px matches. The Figma variable `shell/rail-width-expanded` holds 232 px, the earlier shell's value (`src/app/desktop-shell.css`). The Shell v2 rail and the application's `src/app/styles/figma-shell.css` use 240 px. The secondary menu is 240 px in Figma and in the application, except one rule in `src/app/styles/my-work.css` that sets 220 px for the baseline menu presentation |
| Icons | The application uses 26 icons that the Figma library does not have: arrow-down-wide-short, blinds, book-user, bullseye, calendar-check, caret-down, cart-shopping, chart-column, circle-arrow-up, circle-dot, circle-nodes, circle-small, cloud-slash, dollar-sign, expand, file, file-export, file-plus-minus, flag, message, plug-circle-bolt, right-left, ship, square-kanban, wallet and wave-pulse. Thirty Figma icons did not match a name in `src/components/font-awesome-icons.ts`; most belong to proposed parts, for example the weather icons on My Work and the CPQ components, and some may be mapped in a file this scan did not parse |

## What this does not show

- Text styles were listed but not compared with the application's font sizes and line heights.
- Component geometry and states of the shell parts were not compared. Only variables and icon names were.
- The header height (64 px) has no CSS variable, so it was not checked.
- Icon artwork was not compared, only names.
- The 26 and 30 icon lists come from a pattern match on one file. They are a lead for a person to confirm, not a complete audit.

## Actions taken and not taken

- **Taken:** the Start here guide's "Library source" line was rewritten to say what was checked on 14 October and what differs. It no longer claims no change since 11 October.
- **Not taken:** no variable, style or component was changed. Altering a shared variable would restyle every accepted page that uses it, and none of the differences above is a proven error in an accepted design. They are listed for the owner to decide.

## Decisions for the owner

- **Gantt colours:** keep the application's teal and green and drop the unused Figma variables, or move the application to the Figma blue and purple, or amend the Figma pages that use them.
- **Expanded rail variable:** change `shell/rail-width-expanded` from 232 to 240 if the earlier shell page is no longer a reference.
- **Missing icons:** draw each of the 26 when a page that uses it is next designed, copying them from the Font Awesome Kit as ADR-0053 describes.
