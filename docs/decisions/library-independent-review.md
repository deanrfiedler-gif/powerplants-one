---
document_id: PPO-LIBRARY-REVIEW-PROP
date: 2026-11-12
owner: Dean Fiedler
status: Independent read-only review of the private Figma file "PPO - Library" on 12 November 2026 at Dean's request, by a session that does not hold the library; findings and recommendations only; the choices in section 5 are Claude's under Dean's instruction to proceed and are not Dean's acceptance of any design; nothing was changed in Figma; no application code, route, migration, permission or deployment
versioning: git
---

# PPO - Library independent review, 12 November 2026

**Owner:** Dean Fiedler · **Date:** 12 November 2026 · **Status:** Review findings and recommendations. Nothing is drawn. The session that holds the library decides what to draw, and Dean accepts each page.

## 1. The request

Dean asked a second Claude session to audit `PPO - Library` "to ensure it looks as professional as possible and aligns with industry best design practices". He supplied a UI/UX conformance audit dated 10 November 2026 as background; that document is not in this repository. When the findings were reported he answered: "Proceed however you believe is the most professional."

The session that draws the library made its own audit on 11 November 2026, recorded as PPO-LIBRARY-AUDIT-DEC in `docs/decisions/library-audit.md` (pull request #915, not yet on `main`). This review was made before reading that record, then checked against it and against each page record. **Where a record already decides something, that decision stands** and section 3 says so.

## 2. Basis and limits

- **Read-only.** Every call through the Figma connector was a read. No node, variable, style, comment or version was created or changed.
- **Scan.** All 13 pages, 139 variables in six collections, 13 text styles and 3 effect styles. At first reading 66 component sets and 72 single components; 76 and 73 at the last.
- **Measured.** Inside components, not counting the insides of nested instances: variable binding of fills, strokes, corner radii, padding and gaps; text styles; layer names. Text contrast against the nearest solid background, on every page.
- **Rendered and inspected.** Every component section, the cover, the Read me, and three cards of the Board review board.
- **The library was being edited at the time.** Pull request #915 holds the claim. Eleven Controls parts appeared during the review. Counts are from the first reading unless stated; the eleven were read by name and options only.
- **Not examined.** `PPO - Shell`, any module file, `PPO - Design`, prototype links, Dev Mode and the application. The Foundations page was read for bindings, not line by line. Status lines were parsed on the Controls page only.
- **Contrast** covers text, not icons or borders. It is not a WCAG conformance result.

## 3. Findings

### Agrees with the earlier audit

- Every solid fill (1,194) and stroke (332) inside a component is bound to a variable.
- Every text layer uses a text style: 678 inside components and about 3,800 outside.
- No default layer name on any page. Every component has a description.
- The pattern pages are built from the shared controls. No remote component and no community library.
- Density and control size are variable modes.
- No resting-state text fails 4.5:1.

### New, or different from the earlier audit

| ID | Finding | Evidence | Bears on |
|---|---|---|---|
| R1 | **Grid / Cell · Edit paints black.** Editable hover `24:538` and Editable focus `42:1862` have a fill bound to `surface/hover` that stores and renders `#000000` at full opacity. The value text on it is 1.46:1. Locked, bound to the same variable, renders correctly | Read of the paint and two renders | PPO-LIBRARY-AUDIT-DEC sections 2 and 7 took this for an overlay and left it unconfirmed. It is a fault |
| R2 | **Spacing is not fully bound.** 788 padding and gap values inside components use a variable and 342 do not; 85 of the 342 are 1 px offsets. By page, bound to plain: Controls 208/56, Grid 72/6, Board 75/89, Time 6/103, Gantt 0/15, Forms 121/20, States 57/34, Record 98/9, Phone 151/10 | Scan; checked by hand on Time / Event's body `98:240` (padding 8, 6, 4, 4 and gap 2, no spacing variable) | PPO-LIBRARY-AUDIT-DEC section 3 says no spacing is left unbound |
| R3 | **Chosen and pointer state share one option.** Checkbox, Radio, Form / Choice, Check option, Tab, Filter chip, Menu item and Segment each list both in `State`. A ticked and disabled tick box, a ticked one with focus, and the current tab with focus cannot be drawn | Component options | Audit decision A4 added Hover to the same option. Controls / Switch already separates them |
| R4 | **Option names differ between parts.** The resting state is `Default` in 16 sets and `Rest` in 13. Chosen is `Selected`, `Current`, `Active`, `On`, `Chosen` or `Highlighted`. The kind of part is `Kind` in 16 sets, `Type` in 3, and `Style`, `Shape` or `Layout` elsewhere. Show-or-hide options start with "Show" 21 times and are bare nouns 17 times | Component options | No record sets a naming rule for options |
| R5 | **Several parts do one job.** Seven banner-shaped parts share no base: Controls / Banner, State / Outcome banner, State / Connection banner, Record / State banner, Record / Readiness bar, Phone / Status line and Form / Error summary. Board / Count and Move / Count badge are both count badges. Board / Card and Grid / Row draw their own placeholders beside State / Placeholder | Nested-instance read | Design-to-build standard section 5: clean up near-duplicates before the first publish |
| R6 | **Danger button, Pressed.** The white 24% layer gives `#b16a5d`; the white label on it is 4.13:1, below 4.5:1 | Render | Controls C1, which Dean confirmed. A white 18% layer gives 4.72:1 |
| R7 | **Form / Day.** Outside and Unavailable look the same. Unavailable uses `line/control` as its text colour, at 3.32:1 | Read and render | Forms record |
| R8 | **Form / Save bar.** The variant Phone, Uncertain is 56 px taller than its set `142:353`, which clips it | Read | Cause not established |
| R9 | **Phone links.** Controls / Link sits 18 px high in Phone / Status line and Phone / Selection bar | Read | Audit decision A4 set the target rule for tick boxes and radios only |
| R10 | **Dialog corners.** `radius/dialog` is 12, as shell R70 sets. The application has `--radius-dialog:10px` in `src/app/crm-r38.css` and `src/app/styles/my-work.css`, and `docs/design/figma-variables.json` maps the frozen file's `radius/dialog` to it at 10 | Read | Audit direction B3: the variable cannot take that CSS name until one side changes |
| R11 | **Scopes.** The 29 colour variables copied from `PPO - Shell` can be picked for any fill, stroke or effect, so `text/ink` is offered as a frame fill and `line/soft` as a text colour. The person, accent and Gantt variables are scoped | Read | Grid record: "scopes … as in PPO - Shell" |
| R12 | **Disabled.** Menu item dims its text to 70%; the accepted rule is 45%. At 45% a Tab label, already `text/secondary`, is 1.94:1 | Scan | Controls record |
| R13 | **Time / Band.** The Not working and Unavailable variants carry the default label "Extended hours" | Read | Time record |

Smaller points, none urgent:

- The 35 hand-drawn icons use four frame sizes and six stroke weights.
- Time / Hatch is one component of 100 line layers.
- The three elevation styles hold a plain shadow colour.
- Component sets have no title on the canvas, and 52 of the first 66 have no auto-layout.
- Three names carry a middle dot where a variant or a plain name would do: Board / Stage · Collapsed, Grid / Header cell · Select, Grid / Cell · Edit.
- The library holds twelve workspace accent pairs; a decision on the module list would touch them.

### Already decided: no change proposed

| Subject | Where it is decided |
|---|---|
| A second tier of colour variables | Audit direction B2: deferred until a second theme or brand exists |
| Themes | B1: light only; high contrast before dark |
| CSS names. 30 of 139 variables have one | B3: all of them before the first publish |
| Mapping components to code | Design-to-build standard section 5: after the pilot |
| The icon set | Controls record: the shared set is the 101 in `PPO - Shell`; the Icons page is interim |
| Chip tones | Controls C2 |
| At risk and Conflict share the Attention icon on a Gantt bar | Gantt G3; the task list names every status in words |
| Disabled at 45% | Sales ST01 and the Controls record |
| Plain corner radii on focus rings | PPO-LIBRARY-AUDIT-DEC section 7 |
| Tick-box and radio targets | A4 |

The first report given to Dean in session, before these records were read, proposed a role layer of colour variables, a decision on the icon set and a gate on CSS names. Those three are withdrawn in favour of B2, the Controls record and B3.

## 4. A naming rule for options

Proposed. It follows the more common usage already in the file where there is one.

| Meaning | Option | Values | In place of |
|---|---|---|---|
| What the pointer or keyboard is doing | `State` | Rest, Hover, Pressed, Focus, Disabled, Loading | `Default`; `Interaction` |
| Ticked or not | `Checked` | Off, On, Mixed | `State` Off, On |
| Chosen among siblings | `Selected` | true, false | `Current`, `Active`, `Chosen`, `Highlighted` |
| What kind of part | `Kind` | per part | `Type`, `Style` |
| Meaning shown by colour | `Tone` | per part | — |
| The record's status | `Status` | per part | — |
| A part that can be hidden | `Show …` | true, false | bare nouns |

Renaming an option after the library is published resets the choices made on placed instances, which the standard grades as High impact. Before publishing it costs nothing.

## 5. Choices taken under Dean's instruction

Dean's answer was to proceed on professional judgement. These are Claude's choices under that instruction and the standing order of 30 October 2026. None is Dean's acceptance of a design. Dean reverses any of them by saying so.

| # | Question | Choice | Reason |
|---|---|---|---|
| 1 | Should this session fix the library? | No. The findings go to the session that holds it | One session edits the library at a time, and pull request #915 holds the claim |
| 2 | `Rest` or `Default` | `Rest` | `Default` also means "the default variant", and the pattern pages already say `Rest` |
| 3 | When to separate chosen from pointer state (R3) | Before the first publish, in the shape Controls / Switch already has | After publishing it is a High-impact change |
| 4 | `radius/dialog`, 12 or 10 | 12 stands | Shell R70 is accepted; the application aligns at its next reviewed change |
| 5 | A role layer of colour variables | Not proposed | B2 already defers it |

## 6. Handed to the session that holds the library

In order. Each stays that session's call, and each new or changed part stays `Status: Proposed`.

1. Re-apply `surface/hover` on the two Grid / Cell · Edit variants (R1), then re-render the Grid review board and Playground.
2. Correct the sentence in PPO-LIBRARY-AUDIT-DEC section 3 that says no spacing is unbound, and close its open item on the Grid hover reading.
3. Resize the Form / Save bar set (R8) and correct the two band labels (R13).
4. Adopt the naming rule in section 4, then separate chosen from pointer state (R3, R4). Do this before drawing more parts; the eleven drawn on 12 November 2026 already use three different sets of names.
5. Bind the plain 4, 6, 8, 12 and 16 px spacing (R2). Values 10, 20 and 32 are in use with no variable.
6. Give the banners one base, keep one count badge, and place State / Placeholder inside the card and row placeholders (R5).
7. Give Unavailable days a mark that is not colour (R7). Use a button at Touch size where a link stands alone on a phone (R9).
8. Add R10 to the list for the B3 reconciliation. Scope the copied colour variables (R11) at the same time, since both differ from `PPO - Shell`.

## 7. Not done and open

- **Nothing was changed** in Figma, in pull request #915 or in any other record.
- **For Dean.** R6 changes a value he confirmed (C1): Pressed on Danger from a 24% to an 18% white layer. Page acceptance and publishing remain his.
- **Not verified.** Whether the faults in R1 show in a module file; nothing is published, so none should. Whether other shared values differ between the library and the application as R10 does. Icon and border contrast.
- **No application code, binding, register or page guide changed.**

## 8. Checks

- R1 was read twice and rendered twice, once as the set and once in the Grid component section.
- R2 was scanned on every page and then read by hand on one component, after the earlier audit was found to say otherwise.
- R6 was measured from a render of the Button set; the 18% figure is calculated, not drawn.
- The Controls page was read again at the end. A second copy of its component section, seen part-way through, was gone.
- Repository checks for this change: `python3 scripts/build_status.py --check`, `python3 scripts/check_naming.py` and `python3 scripts/check_foundation.py`.
