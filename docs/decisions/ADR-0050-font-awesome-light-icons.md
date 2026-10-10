# ADR-0050 — Font Awesome Pro Light for application icons

<!-- versioning: git; committed history is authoritative -->

Owner: Dean Fiedler. **Status:** the icon style and the delivery method (the Kit script, option A) are accepted by the owner (10 October 2026). Dean then authorised the build: "Build the icons, start with the mapping." The first increment is described below. Dean's visual review of the built icons is pending.

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

## Implementation — first increment, 10 October 2026

- **Mapping.** `src/components/font-awesome-icons.ts` maps all 198 names in the five shared icon sets: navigation 62, shell 35, product 51, My Work 45 and secondary menu 5. Each map is typed against its set, so a new name without a mapping fails the type check. All 198 Light icons and the 62 Solid navigation icons were drawn by the Kit on a review page: 260 drawn, none missing.
- **Loading.** The root layout loads the Kit only when `PPO_FONT_AWESOME_KIT` holds a plain Kit ID. Anything else is ignored, so the setting cannot become an arbitrary script address. Hosted and local values are configuration, not code.
- **Kit technology (open question 5).** The Kit keeps its current SVG + JS technology. Font Awesome is told to nest its SVG inside the `<i>` element React renders, so React keeps every node it owns. Each icon asks Font Awesome to draw it. Font Awesome's page watcher missed icons that appeared while the Kit was still starting, which was observed locally.
- **Fallback.** Every icon renders its local drawing until the Kit's Font Awesome engine is running, and keeps it if the Kit never arrives. The offline workspace and sign-in page are static and unchanged.
- **Tests (open question 6).** Automated tests and CI do not load the Kit, because no Kit ID is configured there. They render the local drawings, so existing assertions remain valid. A unit test covers the Kit ID check, the name format and the fallback.
- **Scope.** This increment covers the five shared icon sets. Module drawings still draw locally: job packs, materials, engineering changes, commissioning, acceptance, fertigation, leads, the Gantt chart and the sign-in page.
- **Local verification.** A dev server on a disposable synthetic database was checked as the Coordinator:
  - My Work at 1440 px drew 102 Font Awesome icons, with no fallbacks and no failures.
  - Deals showed its selected rail item in Solid.
  - My Work at phone width showed the quick actions, Needs attention, the weekly agenda and the Sales phone bar in Light.
  - The Kit accepted both `localhost` and `127.0.0.1`.

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

## Open questions

1. What page-view or bandwidth limits apply to the Kit on the monthly plan?
2. What do the licence terms say about continued use after a lapse, and about the private hosted demo?
3. The Kit must also allow the hosted demo's address before `PPO_FONT_AWESOME_KIT` is set there.
4. Which module icon sets come next, and what are their mappings?
5. Dean's visual review of the built icons, which remains separate from this record.

Resolved on 10 October 2026:
- Billing stays monthly with the Kit script.
- The offline workspace keeps its local shapes.
- The shared icon sets are mapped.
- The Kit keeps SVG + JS, with its SVG nested inside the app's elements.
- Tests and CI run without the Kit.

## Validation

The decision record: `python3 scripts/check_naming.py` and `python3 scripts/check_foundation.py`.

The first increment: `npx tsc --noEmit`, `npm run studio:check`, ESLint on the changed files, and `npm run test:unit`. The unit suite's three Windows-only file-path failures (document store and recovery) also occur on unchanged `main` locally. The browser suites run in CI without the Kit, so they exercise the local drawings.
