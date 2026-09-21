---
document_id: PPO-UICONS-DEC
title: Existing modules UI consistency
revision: r01
date: 2026-09-21
owner: Dean Fiedler
status: Implemented on a branch; CI, owner visual review and business acceptance separate
source_commit: 920b058a7ee6e20951edf36b21374f75f25dfd29
---

# Existing modules UI consistency

The accepted Equipment presentation supplies reusable rules for the shell, the secondary menu and a
register. This change applies those rules to the modules Powerplants One has already built. It is a
presentation and interaction change to the existing native application: no record, workflow, route,
permission, query, business term or source-owned behaviour is altered, no schema migration, capability
or seed is added, and no framework or dependency is introduced.

## Sources and what is missing

| Source | State |
|---|---|
| [Theme style board r22](../reference/ui/theme-style-board/powerplants-one-theme-style-board-r22.html) | In the repository. SHA-256 `a305361c5d937296a8837e751f1a80ac7e6ca7615013705c7ad55ad794957df0`, 16,677,780 bytes. Every token value below is read from it. |
| `PPO-EQ-01-Installed-Base-Register-and-Equipment-Workspace-Build-Plan-r02.md` | **Not in the repository and not supplied.** |
| `PPO-EQ-01-Installed-Base-and-Equipment-Workspace-Desktop-UI-Mockup-r10.png` | **Not in the repository and not supplied.** |

The written contract in the instruction was implemented; the two missing files were not reconstructed,
and no other image or document is registered, hashed or described as r10 or as the build plan. The
[Equipment and Installed Base workspace design](equipment-workspace-design.md) r02 HTML that *is* in the
repository is a separate, earlier authored design; it remains an authored design for review and is
unchanged here. No UI baseline is registered by this change.

## What the rules mean here

**One shared shell.** The breadcrumb, the centred search-and-quick-add group, the secondary-menu
trigger, the secondary menu itself and the More panel are one implementation used by every module. They
were changed once, in `src/components/product-navigation.tsx`, `src/shell/secondary-menu.tsx`,
`src/app/desktop-shell.css` and `src/app/styles/my-work.css`, not module by module.

**The breadcrumb is the page's identity.** It is built from route metadata — the workspace a
destination belongs to, the destination, and the view a workspace's own secondary menu names — never
from URL slugs. It carries `nav`/`ol`/`li` semantics and `aria-current`, the parent is quieter and the
current page darker and semibold, the product name is gone because the rail's logo already carries it,
and ancestors give way before the current page with the whole path kept in the accessibility tree and
in the breadcrumb's `title`.

**Search and quick add are one group.** The group's combined bounding box is centred on the whole
application viewport, the navy rail included. The coordinate is the header's own (`50% - rail/2`), not
a viewport unit, so a scrollbar cannot enter the measurement and no page-specific margin is involved.

**The secondary menu owns its own edge.** Grey `#f5f6f8`, 240px measured from the right edge of the
rail and exposed as `--ppo-secondary-menu-width`, a white current item with no coloured left accent,
the menu's own right border as the collapse target and a 24px strip with a grip as the expand target.
Nothing protrudes into the workspace, no gutter is reserved, and hover never opens the strip.

**More is measured from one coordinate.** On a page that has secondary navigation, More's right edge is
rail right plus the expanded menu width, in both menu states. The two surfaces keep different left
anchors, so the width is derived from that right coordinate rather than declared equal. Pages without a
secondary menu keep More's established geometry and reserve no phantom menu width.

## Decisions taken

| Decision | Reason |
|---|---|
| The product name leaves every module breadcrumb, and stays on the home page where there is no page to name. | The rail's logo is the product identity on every business route. |
| A docked secondary menu still takes the view crumb, because it names that view and marks it current. | This is EN-06's accepted rule, generalised rather than dropped. Collapsed, overlaid or absent, the breadcrumb carries the view again. |
| EN-06's zero-width collapse becomes the shared 24px strip. | EN-06 A34's "no residual track" predates this rule; §5 requires a discoverable strip that never collapses to nothing. Its browser proof is updated and the change is stated there. |
| A register's title band is removed only where the breadcrumb already says the same thing. | Estimating Discovery ("Scope and options"), Finance ("Finance handoffs") and Email keep their visible titles: those names are not what the breadcrumb says, so removing them would delete identity, not a duplicate. |
| A removed description is published to the page-information panel, not discarded. | `src/shell/page-description.ts` holds one page's description at a time and clears it on unmount; the information icon shows it. |
| Routes governed by an in-force UI baseline keep their page geometry. | `/engineering` (engineering-r02), `/service/technicians` (field-technicians-r04) and `/sales/opportunities` (deals-r38) are registered, hashed and conformance-checked. Changing their geometry would contradict an accepted design; it needs a baseline revision, which is the owner's decision. They receive the shared shell refinements like every other route. |
| The Customers and Contacts directory takes the existing full-bleed host contract without a `moduleWorkspaces` entry. | The `data-module-layout` attribute is the host contract and EN-06 already uses it that way. A `moduleWorkspaces` entry is a *baseline* registration requiring an accepted design, hashes and proofs, and no accepted design exists for this register. |
| A person's organisations and roles stay a list inside one cell. | It is a real one-to-many relationship, not a stacked cell; flattening it to one line would lose affiliations. |

## Departures from what existed

- The retained [Application Shell r17](../reference/ui/application-shell/PPO-Application-Shell-r17.html)
  reference file is unchanged. Two comparisons against it in `tests/ui/desktop-shell.spec.ts` now assert
  the new contract and name the departure: the product name is no longer in a module breadcrumb, and the
  search and quick-add panels open 28px left of r17's anchor because their triggers moved into one
  centred group. The other five panels keep r17's absolute anchor exactly.
- `tests/browser/engineering-materials.spec.ts` A34/A35 record the 24px strip and the 240px menu.
- `main` moved to `b4806af` (PR #268) during this work and is merged in. #268's breadcrumb rule — a name
  is shown whole or not at all, never cut short to make room for another — is carried into the
  breadcrumb that replaced the heading it was written against: no crumb shrinks or ellipsises, one that
  does not fit wraps out of a one-line box, and ancestors are dropped whole at 1560px. The handover
  records each conflict and its resolution.

## Boundaries

This change authorises no business transaction, production integration, customer communication or
migration. Code delivery is separate from owner visual acceptance, business approval and deployment.
Browser emulation establishes no physical-device or assistive-technology acceptance.
