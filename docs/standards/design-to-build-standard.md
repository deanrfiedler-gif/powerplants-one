---
document_id: PPO-DESIGN-TO-BUILD-STD
title: Design-to-build standard
owner: Dean Fiedler
status: Working standard under ADR-0067; individual page acceptance remains separate
versioning: git
---

# Design-to-build standard

How Powerplants One UI pages are designed in Figma and built in the app. The reasons are in [ADR-0067](../decisions/ADR-0067-design-to-build-operating-model.md). This page says what to do, and everyone follows it: Dean, Claude and Codex.

**Transition.** Until cut-over (stage 3 of ADR-0067), pages are still drawn in "PPO - Design". Sections 1, 2, 7 and 8 and the capture rule in section 9 apply now. Sections 3 to 6 apply from cut-over.

## 1. Who decides what, and what is true

Dean accepts every page design and decides business matters. Claude and Codex draw, build and maintain the process.

| Question | Source of truth |
|---|---|
| How should this page look? | The accepted Figma design and its named version |
| What new colour, size or component should we use? | Figma |
| Has it been approved? | The decision record in Git |
| What value does the app use? | The token file in Git, which must match Figma |
| How does the page behave: permissions, data, business rules? | Git: blueprints, page contracts and tests |
| What are users actually seeing? | The running app |

A proposal is never a source of truth. A Figma design never becomes a production claim.

## 2. The lifecycle of a page

1. **Propose.** Draw it from the library, with synthetic data, on a page named `[Page name] · [scope ID]`.
2. **Design ready.** Pass the checklist below, and record anything left open as a question.
3. **Accept.** Dean accepts it in words, and those words go in the decision record.
4. **Lock in.** Save the named version, retain the captures, and add the decision record, register rows and status fragment.
5. **Build.** Build it from shared components and tokens, adding any new token to the app in the same pull request.
6. **Build done.** Pass the checklist below.
7. **Review.** Dean's visual review, functional proof and deployment stay separate claims.

### Design ready

- [ ] Uses the shared shell and library components, with no detached copies. New parts are labelled Proposed.
- [ ] Uses variables and text styles only, with no raw values. Any new variable has a role-based name and a CSS name.
- [ ] Desktop 1440, tablet 1024, and phone 390 and 320 are drawn, or the frame says why not.
- [ ] Loading, empty, error, denied, stale and read-only states are drawn where they apply.
- [ ] Long text and realistic synthetic data have been tried, with no clipping or overlap.
- [ ] Text contrast is at least 4.5:1, or 3:1 for large text and control boundaries. Colour is never the only signal. Touch targets are at least 24 px, and phone actions follow the existing 44 px control height.
- [ ] Focus order and any non-obvious keyboard behaviour are noted.
- [ ] The incoming and outgoing handovers, permissions and open questions are written on the page.
- [ ] The main journey plays in Present mode.

### Build done

- [ ] It matches the accepted capture at the same viewport and data, or each difference is fixed or recorded.
- [ ] It uses shared components and tokens, and adds no new hard-coded colour.
- [ ] Figma and CSS use the same token names, and `python3 scripts/check_design_tokens.py` passes.
- [ ] Keyboard, focus, reflow and phone behaviour have been checked. WCAG 2.2 AA is the proposed NFR-08 target; visual inspection alone does not establish conformance.
- [ ] Application checks and `npm run studio:check` pass, and the page contract, guide and register are current.
- [ ] The report separates code delivery, test results, visual review and acceptance.

## 3. Figma files

| Folder | File | Holds |
|---|---|---|
| `PPO Library` | `PPO - Library` | Variables, styles, icons, shared components, page template, shared patterns |
| `PPO Domains` | `PPO - Workspace & Assistant` | My Work, Conversations, Assistant, search, calling, account |
| | `PPO - Sales & Products` | Sales, Products |
| | `PPO - Estimating & Quotation` | Estimating, CPQ, configurators, quotations |
| | `PPO - Engineering & Projects` | Engineering, Projects |
| | `PPO - Service & Field` | Service, planning, field, maintenance |
| | `PPO - Supply Chain & Workshop` | Supply chain, workshop |
| | `PPO - Finance & Reporting` | Finance, Reporting |
| | `PPO - Records & Documents` | Customers, sites, equipment, documents, knowledge |
| | `PPO - Administration` | Administration, settings |
| | `PPO - Customer Portal` | Customer portal |
| | Powerplants One configurator workflows | The existing FigJam board, name unchanged |
| `PPO Record` | `PPO - Design` | The frozen original, Captures included |

- Create a domain file only when its first page needs it.
- Enable `PPO - Library` for all team files.
- Never edit, rename or delete from `PPO - Design`. There is no lock control, so this is enforced by this rule, a committed manifest and a private `.fig` backup.
- File keys never go in the repository. Sessions read them from private memory.
- Add a file only when a whole product surface needs one. Split a file when section 10 requires it.

## 4. Inside a domain file

Pages, in order:

1. `Read me`, with the file's purpose, its scope IDs and these rules. Use a consistent file cover.
2. `— Accepted —`, then accepted pages in rail order.
3. `— Proposals —`, then proposals. At acceptance the page moves up, with its name and node ID unchanged.
4. `Scratch`, for temporary work. Empty it at the end of each session.

There is no archive page. Save a named version, then delete. One Figma page holds one app page, with numbered pages only under ADR-0055 rule 9. Status never goes in a page name.

Draw each new page from the template in `PPO - Library`. Do not keep a separate template copy in each file.

## 5. The library

**Contents.** Tokens, icons, Shell, Controls, Grid, Record and parts used in more than one domain. A part used by only one domain moves to that domain's file once a usage count proves it, using Figma's "Move to this file" flow. Library pages hold one component group each.

**Status.** The first line of each component's description is `Status: Proposed`, `Accepted`, `Built` or `Deprecated`.

| Status | Meaning |
|---|---|
| Proposed | Drawn for a proposal. Not for use outside it |
| Accepted | In an accepted design, not yet in the app |
| Built | In the app and mapped in the component catalogue |
| Deprecated | Do not use. The description names the replacement |

**Naming.** `Area / Component`, matching the code name where one exists. Use one name per component. Do not use scope IDs or version numbers as name prefixes.

**Before the first publish.** Clean up near-duplicates and confirm which items are hidden from publishing. Hide `Prototype`, `Deals · r37 reference` and internal parts, unless the rehearsal shows they are needed. Add a code name to every variable that the app uses. Unwanted community libraries are not enabled.

**Each publish.**

- [ ] One session holds the library, stated in its draft pull request.
- [ ] Token changes are accepted, and the snapshot is refreshed.
- [ ] A named version is saved, recording the source commit.
- [ ] The release note says what changed, what to do, and whether accepted pages look different.
- [ ] Updates are accepted in each domain file.

A change that would visibly alter an accepted page needs Dean's acceptance first, and is recorded on that page's decision record. No accepted design changes silently.

**Deprecation.** Mark it Deprecated and name its replacement. Remove it only after a usage count shows no instances. Library analytics need an Organization plan, so counts come from a script.

## 6. Moving a page into a domain file

Do this only when the page next changes.

1. Copy the page, using the method that passed the rehearsal, and bring its own main components with it.
2. Compare the copy with the source: layer count, instance links, missing components, variable bindings, flow starting points, prototype actions and hidden layers. Compare an icon-free export hash where the page must look identical.
3. If it looks identical, it keeps its acceptance. If not, it is an amendment and needs Dean's acceptance.
4. Add the new location to the page's decision record and design entry. Review its open comments, which do not travel with a copy.

### Rehearsal pass criteria (stage 2)

Run on a throwaway duplicate, with pages including `CPQ · 2` to `CPQ · 4`, Screen Configurator, Quotations and Estimation Wizard. A method passes only if:

- Instances link to the library, with none missing.
- No duplicate local variables or styles appear in the destination.
- Colour, spacing, padding and text bindings are kept.
- Flow starting points, prototype actions and variable-driven prototypes still work.
- Page-held main components and nested swaps survive.
- An icon-free export matches the source, or each difference is listed.
- The memory meter is recorded before and after.

Test two methods: pasting from a published duplicate, and pasting from the frozen file followed by a scripted swap by component key. Prefer the second, because it leaves the library free of design pages. If neither passes, follow the stop rule in ADR-0067.

## 7. Tokens

**Adding a token.**

1. Reuse an existing token if one fits.
2. Create the variable in Figma with a role-based name, such as `status/warning/text`, not one that describes its colour, and set its CSS name.
3. Check its contrast and accept it with the page that needs it.
4. In the pull request that builds the page, add the CSS property with the same value and refresh [`docs/design/figma-variables.json`](../design/figma-variables.json).
5. Run `python3 scripts/check_design_tokens.py`.

**Code goes first only** for an urgent fix or something found during the build, such as a contrast failure. Update Figma and the snapshot in the same pull request.

**Variables with no CSS name** are marked `design-only` in the snapshot for drawing, annotation and overlay colours the app does not use. Those in `unmapped` are a dated baseline to clear at reconciliation, and no new ones may be added.

**Differences.** The accepted Figma value wins unless it fails contrast or the difference is a documented page override. Do not convert hard-coded colours in unrelated files.

**Refreshing the snapshot.** Read the `PPO colour` and `PPO layout` variables through the connector, and record their name, value and code name.

## 8. Citing a design

Cite the file name, node ID and named version: `PPO - Sales & Products`, `123:456`, "Deals — accepted". **A citation with no file name means the frozen `PPO - Design`**, so older records stay correct and are not rewritten. In the component catalogue, `figma.location` names the file for anything outside it. Never put a Figma link in the repository.

## 9. Evidence

- **A named version** marks acceptance, as before.
- **Captures:** at lock-in, copy the frames to a temporary page named `Capture · in progress`, replace icons with `Icon/placeholder`, export them, hash them, then delete that page. Do not keep capture copies in Figma.
- **Keep only what a builder needs:** one capture per viewport for each distinct layout or state. Do not retain repeats that add nothing.
- **Capture READMEs** cite the source frame, named version and hash, not the deleted copy.
- **Existing captures and READMEs** stay unchanged.

## 10. File health

- Read **Main menu > View > Memory usage** on a fresh load before each library publish, before a large drawing session and at least monthly. Record it in the status fragment of the work it precedes.
- Act at 70%: remove scratch work and hidden layers, or split the file by surface. This is a working threshold, to be reviewed once real readings exist. Figma alerts at 90% and locks at 100%.
- Do not load every page unless an audit needs it. Figma counts loaded pages, and `use_figma` is limited to about 10 calls a minute and 200 a day across all sessions.
- One session edits a page at a time, and one session edits the library at a time. A session drawing in a file states this in its draft pull request.

## 11. Checks

| Check | Proves |
|---|---|
| `python3 scripts/check_design_tokens.py` | Mapped tokens match the CSS, and no new unmapped variable exists |
| `python3 scripts/check_design_tokens.py --report` | Also lists multi-valued properties and hard-coded colours (report-only until stage 5) |
| `npm run studio:check` | Design register integrity |
| Application tests and visual comparison | That build's behaviour and appearance, within their scope |

No check proves acceptance. That remains Dean's decision, recorded in Git.
