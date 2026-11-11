# Phone tab bar labels and rail colours

<!-- versioning: git; committed history is authoritative -->

Owner: Dean Fiedler. Design: Claude, 10 November 2026. Build owner: Codex, not started. Owner visual review, functional proof and deployment remain separate claims.

## application-shell

Dean adopted a visible label on every phone tab bar and directed that the bar take the desktop rail's colours ([decision](../../../decisions/phone-tab-bar-labels-and-rail-colours.md), rules T1–T8). This supersedes the icon-only `v2 / Tab bar (phone)` rule described in the specification's dated sections, which stay as history.

- **Mobile requirements.** Every cell shows its icon and a label: Roboto 11 px on a 14 px line, Regular, or Medium in the current cell. A label fits a five-cell bar at 320 px (60 px; 76 px with four cells), never wraps or truncates at the default text size, and is the cell's accessible name. The phone labels are in section 3 of the decision. The current cell keeps `aria-current="page"`, the rail's lighter surface and a 3 px green top line, and fills the full 64 px height.
- **Colours.** The bar uses the desktop rail's tokens: today `--ppo-rail-navy`, `--ppo-rail-hover` and `--green`. `surface/rail` and `surface/rail-active` arrive with the refined rail (S2), in the same pull request for both.
- **Figma.** Each module file's own Phone / Tab bar component is restyled: Sales `64:14209`, Estimating `14:553`, Supply `18:766`, Engineering `14:745`, Finance `10:463` and Projects `25:265`. The accepted Sales file needs a new named version before the build.
- **Application.** Not built yet. `src/app/styles/figma-shell.css`, and `src/app/styles/projects-register.css` for Projects, still hide the labels; the gap `application-shell-phone-tab-bar-labels` tracks the build. Existing review fingerprints are retained, and the resulting stale review stays visible.
