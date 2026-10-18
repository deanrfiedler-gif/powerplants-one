---
document_id: PPO-SHELL-RAIL-MENU-FIGMA-DEC
title: Rails and secondary menus aligned with Figma
date: 2026-10-18
owner: Dean Fiedler
status: User instruction implemented on a branch for review; CI, owner visual review of the application and deployment separate
source_commit: c089e132de43a046c5b2938851ed59f0de770259
versioning: git
---

# Rails and secondary menus aligned with Figma

On 18 October 2026 Dean asked: "Fix the left navigation rails and secondary menus in the Powerplants One application so they align with the ones that we have designed in Figma. Also, remove the search box that is showing in the secondary menu."

## 1. Source designs

The rails and menus are the Shell v2 components on the Components page of the private "PPO - Design" file (section Components · Shell and navigation). Every accepted page that has a rail or a secondary menu uses them: Leads `190:20237`, Engineering workload `184:1047`, Work orders `193:18953`, Products `653:38`, ES-08 `406:2` and others. The components' own descriptions still begin "PROPOSAL" from 11 October; the accepted pages are what make them the design, and Dean's instruction is the decision to build them.

| Figma component | Node | Values used |
|---|---|---|
| v2 / Rail | `84:197` | 240 / 76 px navy `#242a37`; 64 px brand with a 46 px logo; 40 px toggle 2 px below; department heading 11/16 Medium caps `#acaeb3`; items 2 px apart; More directly after the last item |
| v2 / Rail item | `73:29` | Labelled 224 × 44, 20 px glyph, 14/20 label `#e0e1e3`; collapsed 48 × 44 with a 22 px glyph; hover `#343c4c` with white text; selected white tile, navy Solid glyph, Medium label |
| Rail · Service | `198:3778` | Grouped rail: 40 px items; group heading 24 px with a 1 px `#474c57` rule and 11/16 Medium caps; collapsed, a 24 px rule centred in 10 px |
| Rail · Sales | `190:20238` | Label "Estimating handovers" (Dean, 11 October 2026, [Leads design](leads-design.md)) |
| v2 / Menu item | `73:46` | 40 px row, 12 px side padding, 10 px gap, 6 px radius; 16 px icon `#596779`; 14/20 `#242a37`; count 12/16 `#667181`; hover `#f0f2f5`; selected `#e3e8ee` with `#355b80` Medium text, icon and count |
| v2 / Menu heading | `73:48` | 18 px above, none below; 11/16 Medium caps, 0.66 px tracking, `#667181` |
| v2 / Menu strip | `73:63` | 20 px `#f6f7f9` with a 1 px `#e1e5eb` right line and a 4 × 36 handle `#cbd2dc`; hover `#f0f2f5` with a `#365d8b` handle |
| v2 / Menu edge | `73:54` | 10 px target on the right border; hover turns it into a 3 px `#365d8b` line |
| Side menu on the accepted pages | e.g. `190:20519` | 240 px `#f6f7f9`, 8 px padding, 2 px between rows, no title block |

## 2. What changed in the application

- **Rail toggle.** "Collapse navigation" took the open-panel fill and blue underline meant for More, because both use `aria-expanded`. It is now the plain 40 px row Figma draws, in both widths.
- **Collapsed rail.** 46 px logo, 22 px glyphs and the first item at y = 108, as drawn (were 54 px, 25 px and 120).
- **Grouped rail (Service).** 40 px items and the drawn group headings and rules, so all destinations and More fit at 900 px without the rail scrolling.
- **Department heading.** Every rail shows it. Projects pages other than the register showed none, because a Projects-only label was drawn only on the register.
- **Sales rail label.** The labelled rail shows "Estimating handovers" (`railLabel` in `src/shell/navigation.ts`). The accessible name, the tooltip, the page title and More keep "Sales-to-Estimating handovers", which contains the visible words.
- **Secondary menus.** `SecondaryMenuFrame` now defaults to the Figma menu, with selectors that carry the same weight as the shared rules in `my-work.css`. My Work, the four Engineering control modules, Acceptance & closeout, Facilities, Products and the ES-08 lists take it. The module title block is no longer drawn (the breadcrumb names the module; the menu keeps its accessible name). Acceptance's retained baseline presentation is removed. ES-08's own menu rows take the drawn selected row.
- **More.** The "Find a menu item" search box is removed from the More panel and the phone menu, with its filtering. The top bar's global search still finds pages by name. Opening More moves focus to its first control.
- **More Workspace dropdown and footer.** Asked whether to draw them in Figma or remove them from the application, Dean chose: "Remove the More panel's Workspace dropdown and the "N destinations" footer from the app, so it matches the Figma v2 / More panel." Both are removed from the desktop panel and the phone menu. Workspaces in More is now the department choice: it offers every department the identity can reach (as the dropdown did, including one whose main page is withheld), and each link opens that department's landing and becomes the remembered department. The shell guide says so.

## 3. Not changed

Rail membership, order, permissions and destinations; the More panel's groups and Help; Job Pack and the Projects register, which keep their own accepted page menus; Fertigation and CPQ section menus; the phone navigation bar; no migration, seed, capability or parent ID.

## 4. Still different from Figma

- Menu contents on some pages: Products keeps its filters in the menu and has no icons (Figma draws Quick views with icons); ES-08 keeps its back link and note.
- Leads, Work orders and Engineering workload have no secondary menu in the application yet, though their accepted pages draw one. Each needs its views built.
- On 18 October the component's "Find a menu item" search (`Menu search`) was removed in Figma to match the application; its instances inherit the change, and the Leads panels (`190:20688`, `190:20690`) were checked. No named version is saved and the committed captures are unchanged.
- Rail count badges are drawn on several rails; only Projects has a count in the application.
- The More panel still has a close button, Help, installation actions and the Shared records and Administration & support groups, which `v2 / More panel` does not draw; its department group is titled "Department pages" where Figma draws "More in" and the department name (for example "More in Estimating").

## 5. Verification

Measured on the running application (synthetic coordinator, 1440 × 900) against the Figma values above: the labelled and collapsed Service rail match item for item, the Projects and Sales rails match, and My Work, Engineering materials and Acceptance menus match the menu item, heading and container values. Owner visual review of the application and CI are separate; no review fingerprint is copied.
