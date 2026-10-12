---
document_id: PPO-ES02-WIZARD-UI-BUILD-DEC
date: 2026-10-12
owner: Dean Fiedler
status: Built to the design board on Dean's instruction; owner visual acceptance pending; no UI baseline entry
source_commit: 4a286d3f8d1b3fea75b4a51aa4ed3c3b0a4cc7a3
versioning: git
---

# ES-02 Estimation Wizard — page built to design board r01

On 12 October 2026 Dean asked for the Estimation Wizard page to be built to the
[design board](es02-design-board.md) (private artifact `Vbv36BDx24MruAiRgzytaL`, page
*In the app · ES-02 r04*; retained captures in
[design board r01](../reference/ui/estimating/design-board-r01/README.md)), describing it as
one of the most important modules in the application and asking for professional, accurate and
user-friendly work. That instruction is the owner decision that the board's composition becomes
the page. It does not change the configuration definition, the data model, any API or the
business rules of [build plan r04](../reference/ui/estimating/PPO-ES-02-Estimation-Wizard-Discovery-Alternatives-and-Revisions-Refinement-Build-Plan-r04.md),
and it is not visual acceptance of the result: that review is Dean's and is still to be recorded.

Scope stays `scope:ES-02`, route `/estimating/discovery/[id]`, parents PPO-010 and
EST-01–EST-09 under [ADR-0035](ADR-0035-es02-structured-discovery.md). All 78 parent IDs are
unchanged. No migration, seed, permission grant or external integration is added.

## 1. What the board decided and what this build adopts

| Board item | Disposition in this build |
|---|---|
| Composition (boards 05, S1–S5, V1–V6, X1–X4, R1–R4, 10) | Built: context row with the synthetic marker, viewed alternative and save state; equal-width tabs with count badges; five steps with a status line from findings; family cards with Add; estimator-led information row; toolbar, neutral attention strip and flush systems table; selected-system editor with the evidence facts table and Technical details; Scope & responsibilities table with a selected-row editor, exclusions and assumptions cards and delivery questions; Pricing with the cost-basis strip, saved lines, totals tiles and allowances; Review with four tiles, findings by effect, the facts grid and the actions card; Alternatives and Revisions registers; save dialog with changes since the last revision; 380 px summary |
| P3 · menu collapsed at 1440 px and below | Built. With no remembered choice the Estimating menu starts collapsed at 1440 px and below and open above it; a remembered choice always wins (`scope-preferences.ts` now records whether a choice was made) |
| P4 · summary stays in reach below 1200 px | Built. A labelled summary bar sits under the steps and opens the full summary as a sheet; the working-copy bar stays in view |
| P5 · phone steps as a select with previous and next | Built at 780 px and below |
| P6 · change markers carry a glyph and a word | Built for Added, Changed, Removed, Unchanged and Not comparable |
| P7 · evidence in a right-side panel | Built as a 440 px non-modal panel that overlays the summary, closes on Escape and never replaces the summary's identity |
| P9 · summary findings link to their step and field | Built. Every readiness finding in the summary and on Review opens its step, selects its record and focuses its field; the working copy is kept |
| O1 · desktop control height | The record's recommended option: 44 px fields and working-copy actions, the 40 px dense-grid allowance for toolbar and in-table controls, 44 px throughout on phones |
| B1 · amber attention strip | Corrected: neutral surface, amber dot, neutral count |
| B2 · summary narrowed to 320 px | Corrected: 380 px at every docked width |
| B3 · 14 px phone fields | Corrected: 16 px at 780 px and below |
| B4 · phone controls under 44 px | Corrected |
| B5 · search shortcut contrast | Already corrected on `main` (`desktop-shell.css` uses the secondary text token) |
| B6 · unreachable table scroll regions | Corrected: every sideways-scrolling table is a labelled, focusable region |
| P1 · six equipment families, 108 categories | **Not built.** The family list is the configuration definition `PPO-ES02-CONFIG-r01`; the successor definition, migration and ADR-0035 amendment that the [design board record](es02-design-board.md#3-equipment-families--user-decision) describes are still needed. The cards, filters and editor already render whatever families the definition holds |
| P2 · family then category when adding a system | **Not built**, for the same reason: there is no category concept until P1 lands |
| P8 · phone breadcrumb shows the current page only | **Not built.** The breadcrumb belongs to the shared shell, not to this scope |
| Timing fields on Scope & delivery | **Not built.** Requested completion, estimated duration and agreed commitment have no field in the saved discovery; only each work item's requested date exists |
| Compare alternatives as an aspect table (V2) | The comparison uses the exact saved-source comparison the server already provides (V4 form) for any two saved revisions, including other alternatives'; aspect summaries would be a new read model |

## 2. Rules kept from build plan r04

Review in the wizard is a completeness and source check, not approval. Saving creates an
immutable revision with a required reason; the server assigns the number and time. Saved prices
come from the exact saved estimate version and discovery edits never reprice them. Viewing an
alternative never selects it; archived alternatives still count towards ten. Counts in the
summary use the whole viewed working scope, not the table filter. No draft is written to
browser storage. Margin appears only as a labelled calculation.

## 3. Changed files

`src/components/estimation-wizard.tsx`, `estimation-wizard.css`, `configuration-editor.tsx`,
`discovery-fields.tsx` (Requirements split into the opportunity-and-site and brief sections;
answer state tags), new `estimation-wizard-ui.tsx` (icons with local outline fallbacks under
ADR-0050, tags, change markers, labelled scroll regions), `font-awesome-icons.ts` (the wizard's
icon map), `record-ui.tsx` (tab labels may carry a count badge), `scope-preferences.ts`
(remembered-menu flag), `tests/browser/estimating-wizard.spec.ts` (three copy changes), the
page entry `docs/design/development/pages/route-estimating-discovery-id.md`, the route's
register entry and this record.

## 4. Verification

Recorded in the pull request: type check, lint, unit tests, the development-register check, a
production build, and the compiled ES-02 browser proof (`playwright.es02.config.ts`) against a
disposable PostgreSQL 16 cluster with the Northbank fixture. Screenshots at 1920 × 1200,
1440 × 1000, 1024 × 768 and 390 × 844 were compared with the retained board captures during the
build; they are working evidence, not owner acceptance.

Not done: Dean's visual review, manual keyboard and screen-reader passes, 200 % zoom, real
devices, and business acceptance. The page entry keeps *Needs review*; the UI baseline register
is not updated.
