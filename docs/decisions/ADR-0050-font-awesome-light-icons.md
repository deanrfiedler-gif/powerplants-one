# ADR-0050 — Font Awesome Pro Light for application icons

<!-- versioning: git; committed history is authoritative -->

Owner: Dean Fiedler. **Status:** the icon style and the delivery method (the Kit script, option A) are accepted by the owner (10 October 2026). This record authorises no implementation or configuration change; building it needs Dean's separate go-ahead.

Related: NFR-03, NFR-05, NFR-07, NFR-08, NFR-12; BP-01 sections 8.2 and 20; [department navigation icons](department-navigation-icons.md); [shared UI specification](../standards/ui-style-specification.md).

## Owner decision — 10 October 2026

Dean has a Font Awesome Pro account (version 7.3.1, monthly plan) and asked whether it could improve the icons on the [phase 00 refinement canvas](https://claude.ai/artifact/E5wdx1FiF3ZUVb86oXps2E). After a local comparison of the app's icons with Font Awesome Classic Light, Classic Regular and Free, he decided: "Light looks best, write the decision record."

Accepted direction: the application's functional icons move from locally drawn shapes to Font Awesome Pro **Classic Light**. **Classic Solid** replaces the filled shape the app now draws for a selected item, such as the current page in the department navigation list.

The delivery method was decided later the same day (below). Not decided here: the final icon-by-icon mapping, and when the change is built.

## Context

- **Today's icons** are drawn in-house on a 24-unit grid with a 1.7 line. Seventeen source files draw them, in several catalogues: the semantic navigation set with filled selected variants (`src/components/navigation-icons.tsx`), the shell set (`shell-icon.tsx`), the product set (`product-icons.tsx`), My Work (`my-work-ui.tsx`), the shared secondary menu, and module drawings for job packs, materials, engineering changes, commissioning, acceptance, fertigation, leads, the Gantt chart and the sign-in page.
- **The department navigation icons decision** chose locally drawn shapes. It rejected an icon dependency as unnecessary, and because no package offered a matching filled family. Font Awesome Light with Solid supplies that matching pair. This record therefore amends that decision for the source of the shapes only. Its semantic catalogue, destination IDs, 48 px targets, 25 px rail glyphs and selection rules remain.
- **The shared UI specification** says the prototype uses Lucide for functional controls. That sentence describes the retired standalone design preview (`docs/standards/ui-assets/README.md`), not the running application.
- **The repository is public.** Font Awesome's Pro licence forbids making Pro files publicly available, so Pro icon files cannot be committed. The monthly plan offers no downloadable bundle (Dean, 10 October 2026). Its Kit settings also state that packages aren't included on monthly plans and need annual billing (Dean's Kit settings, 10 October 2026). On the monthly plan, Pro icons reach a project only through the Kit script, which Dean holds and restricts to approved websites.
- **Font Awesome Free 7.3.1** has 273 outline (Regular) icons and 2,001 filled (Solid) icons, according to the package's published file list on 10 October 2026. A Free-only set would therefore mix outline and filled icons.
- **The offline field workspace** (`public/offline/`, FI-02) must keep working without a network connection (NFR-07).

## Comparison evidence

A local page compared four versions of four surfaces: the Sales phone bar, the My Work quick actions, the desktop header, and the Sales navigation list with Deals selected. The four versions were the app's icons, Font Awesome Light, Font Awesome Regular and Font Awesome Free.

The app's icons were copied from main `8d3b509`. The Font Awesome icons were drawn live by Dean's Kit: 78 drawn, none missing. Font Awesome Light matched the weight of the app's line most closely. Regular was visibly heavier. Free mixed outline and filled icons.

No capture is retained in this repository, because an image of Pro artwork here would publish it. The page itself was temporary and is not retained.

The mapping used for the comparison is a starting point, not the final mapping:

| App icon | Font Awesome Pro | Free substitute, where Pro-only |
|---|---|---|
| My Work (phone bar) | `clipboard-list` | |
| Deals / opportunity | `circle-dollar` | `dollar-sign` |
| Activities (phone bar) | `calendar-day` | `calendar-days` |
| Activities, aftercare (navigation list) | `calendar-days` | |
| Contacts (phone bar / navigation list) | `user` / `address-card` | |
| More | `ellipsis` | |
| Emails, Sales Inbox | `envelope` | |
| Leads (quick action / navigation list) | `bullseye` / `crosshairs` | |
| Map | `location-dot` | |
| Insights | `chart-line` | |
| Tasks (quick action / navigation list) | `square-check` / `clipboard-check` | |
| Pulse | `heart-pulse` | |
| Sales-to-Estimating handovers | `inbox` | |
| Won-deal receiving | `badge-check` | `circle-check` |
| Search, page guide, help | `magnifying-glass`, `circle-info`, `circle-question` | |
| Notifications, quick add, expand | `bell`, `plus`, `chevron-right` | |

## Delivery options

| Option | For | Against |
|---|---|---|
| A. Kit script from Font Awesome's servers | No build change and no secret. No Pro files in the repository. | Every page needs Font Awesome's servers, and icons are missing offline (NFR-05, NFR-07). Icons disappear for every user if the plan lapses. The Kit ID becomes public and relies on the Kit's website restrictions. A third-party script runs on every page and rewrites the page after React renders it. |
| B. Kit package installed with npm and built into the app | Icons are served from the app's own address, so they work offline and need no runtime call. Only the icons used are included. Rendering stays with React components. | Needs a Font Awesome package token wherever the app is installed: each developer's machine, CI and the hosted-demo build. The token must stay a secret and never reach the repository, lockfile or logs (NFR-03). Adds three dependencies. Not available on the monthly plan: packages need annual billing. |
| C. Font Awesome Free, self-hosted | No account or secret. Works offline. | Too few outline icons: the set mixes outline and filled, as the comparison showed. |
| D. Keep the locally drawn icons | No dependency, and the current consistent weight. | Every new icon must be drawn in-house. Dean preferred Light. |
| E. Commit Pro icon files | Self-contained. | Forbidden by the Pro licence in a public repository, and the monthly plan has no download. |

## Delivery decision — 10 October 2026

B was the better technical fit, but it needs annual billing. Offered the choice between annual billing with B and the monthly plan with A, Dean decided: "Stay monthly and use the Kit script."

- **Online pages** load the Pro icons through Dean's Kit script.
- **The offline field workspace** keeps its current locally drawn shapes, so it never depends on Font Awesome's servers (NFR-07).
- **Accepted risks for the private synthetic prototype:**
  - If Font Awesome's servers are unreachable, icon-only buttons lose their visible cue. Every control keeps its accessible name (NFR-05, NFR-08).
  - If the plan lapses, the icons disappear for every user.
  - A third-party script runs on every online page (NFR-03). Production use would need this risk reviewed again.
- **B remains available** if Dean later moves to annual billing. The semantic icon layer means the change would stay inside the icon components.

## Consequences

- **Implementation** replaces the drawing inside the existing icon components and keeps their semantic names, so the pages that use them do not change. The selected state switches to Solid. Glyphs render square at today's sizes. They stay hidden from assistive technology, and every control keeps its accessible name (NFR-08).
- **The same pull request** updates:
  - the Lucide sentence in the shared UI specification and the asset README;
  - an amendment note on the department navigation icons record;
  - the application-shell component guide and the design register;
  - tests that measure icon size or shape, such as `tests/ui/desktop-shell.spec.ts` and the My Work menu check in `tests/browser/engineering-changes.spec.ts`.
- **Kit configuration:** the Kit ID is not a secret, because it appears in every page that loads it. Even so, supplying it through configuration rather than hard-coding it keeps forks and other copies of this public repository from drawing on Dean's Kit. The Kit's website restrictions remain the control.
- **Licence:** the prototype depends on Dean's personal monthly subscription. Production use needs a company-held licence and company-controlled configuration (NFR-12). If the plan lapses, the icons disappear immediately. The licence position after a lapse is not verified.
- **Reversal:** the semantic icon layer stays, so returning to local shapes means restoring the previous drawings in the icon components from Git history.

## Open questions before implementation

1. What page-view or bandwidth limits apply to the Kit on the monthly plan?
2. What do the licence terms say about continued use after a lapse, and about the private hosted demo?
3. Which addresses must the Kit allow: `localhost` and the hosted demo's address?
4. What is the final mapping for every semantic icon name in the catalogues listed above, including names with no close Light match?
5. Which Kit technology should be used? Web Font styles React's own markup. SVG + JS replaces that markup after React renders it.
6. Should automated tests and CI load the Kit, which adds a network dependency and uses page views, or run without icons?
7. Dean's visual review of the built icons, which remains separate from this record.

Resolved on 10 October 2026: billing stays monthly with the Kit script, and the offline workspace keeps its local shapes.

## Validation

Documentation only. `python3 scripts/check_naming.py` and `python3 scripts/check_foundation.py` are run for this record. No application behaviour changes.
