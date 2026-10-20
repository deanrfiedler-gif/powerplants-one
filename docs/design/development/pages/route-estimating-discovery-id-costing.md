# Discovery costing — page contract

Stable entry: `route:/estimating/discovery/[id]/costing`. Scope: **ES-02**. Owner: Dean Fiedler. Implementation visual review: **pending**. Route: `/estimating/discovery/[id]/costing`. r20 page type: **Record workspace**, inside the saved discovery wizard's Pricing step.

## Authority and sources

[Accepted design decision](../../../decisions/discovery-costing-figma-design.md): Dean accepted D1–D7 and Q1–Q4. Source: **PPO - Design**, page `1431:809`, named version **Discovery costing — accepted**. Live metadata, variables, context and screenshots were read for this implementation. Source acceptance does not accept this implementation.

| Source | Node |
|---|---|
| Desktop, full length | `1431:846` |
| Review/adopt | `1432:375662` |
| Discovery changed / not ready | `1432:376321`, `1432:377502` |
| Tablet | `1431:1610` |
| Phone 390, full length, 320 | `1433:2403`, `1431:1921`, `1433:2492` |
| Adopting / uncertain / original retained / denied | `1433:376501`, `1431:2114`, `1431:2129`, `1431:2143` |
| Loading / notes | `1431:2157`, `1431:2195` |

The ten icon-free retained captures are in `docs/reference/ui/estimating/discovery-costing-figma-design-r01/`, numbered 01–10; exact filenames remain in this entry's `image_paths`. These source bytes are unchanged. The earlier container HTML is `docs/reference/ui/estimating/PPO-Estimation-Wizard-Container-r03.html`; it is historical context. No dedicated line-editor, Cost types, costing Alternatives/Revisions, or phone review-dialog image is supplied. The notes card supplies Q4's phone-editor authority.

## Workflow and handovers

D1/D2: reuse the Estimating rail, shared shell/header and wizard context, tabs and steps. Enter with a saved workspace and explicit option. A selected Active option with Complete discovery and an existing saved estimate can be costed. Q1's no-saved-estimate case retains the existing manual screen outside this increment.

D3: the existing comparison endpoint compares the exact saved basis revision with the reviewed current revision, preserving source identities and lineage. Display changes and unchanged system definitions separately. Exact source disclosure names scope/answer snapshots and content hash, with current and previous recorded scope available. Discovery findings return to the appropriate workspace step. No quantity, cost or line is inferred from discovery.

D4/D5: prefill from the current saved cost version. Native line validation and `SYN-EST-ARITHMETIC-01` remain authoritative. All amounts use the existing exact base-10 calculations. Pen markers compare stable line IDs and all persisted line fields; the summary's sell change compares the proposal with the saved sell total. Added/removed lines remain explicit in adoption review. Unknown amounts and historical unspecified allowances do not become zero or No. New-line and allowance checks are informational, not invented approval rules.

Q3: retain every line's source/date. Only a retained typed reviewed source binding links to the exact ES-03 source revision. Changing source-sensitive fields drops that inherited link using the native inheritance criteria. Free text is never promoted into reviewed provenance. No automatic pricing.

D6: Review and adopt shows the exact revision, successor cost version, changes, totals, wording and checks. Require the existing reason and an explicit review confirmation. Use the unchanged preview/adopt commands and expected versions/context hash. A confirmed original receipt hands over to the saved estimate. ES-04 owns commercial review. Earlier saved versions and quotations keep their own basis.

D7: preserve the proposal if discovery, selection or the saved estimate changes; block adoption until explicit fresh comparison. Incomplete discovery exposes findings and retains saved prices. Adopting freezes edits and dismissal. Uncertain outcome uses existing original-operation recovery, including retry of the same idempotent request when no receipt exists. Do not claim the server saved nothing after a lost response. A legacy option retains its estimate and hands back to the workspace to branch. Lost source authority removes protected cost details. Failed reads offer retry, and a missing comparison blocks adoption.

## Desktop

Desktop reference: 1440 px, shared 240 px rail, 380 px costing summary, 94 px context, 52 px tabs, 48 px steps and 24 px content insets. Use ruled sections, compact toolbar and a bounded horizontal semantic table; keep four 112 px total tiles aligned. No internal module container. White/neutral surfaces use shared tokens, and the primary action uses navy.

Tablet reference: 1024 × 768. Hide the side summary behind Summary; retain bounded grid scrolling.

## Mobile

Phone: 390 × 844 and 320 px. Use the current shared compact phone header, equal view links, viewed alternative, Pricing controls, cost cards, two compact total rows and fixed Summary / Review and adopt footer. Q4: Edit opens a full-screen, labelled line editor; all fields including source/date remain available. The same editor is used on desktop to preserve native validation. Keep keyboard focus in modal dialogs and return it to the opener; show visible focus and native labelled inputs.

Reused components: `Button`, `ButtonLink`, `Field`, `SelectField`, `ValidationFields`, `ErrorNotice`, wizard `Icon`/`Tag`/`Row`/`TableScroll`, `ProductIcon` through the existing Font Awesome mapping, `ScopeView`, `FertigationReceivedNotes`, `RecordIdentity`, `usePhoneHeader`, `useCrmResource`, `useCrmCommand`. The page-local modal is composed around native `dialog` focus behaviour. The inherited wizard reset requires the existing `mw-button` opt-in classes around shared buttons; this page-local compatibility treatment and the compact-header override do not change the shared APIs. No shared component API, dependency, capability, database object or pricing command is added.

## Unspecified details and implementation departures

- Cost types is drawn but its behaviour is unspecified. It remains unavailable; there is no invented aggregate/pricing mode.
- Alternatives/Revisions open the existing workspace, whose views are currently local state. Select the desired view there. A direct-link contract and option picker amendment remain open for Dean.
- The phone editor is authorised by Q4 but undrawn. The desktop uses that labelled editor rather than introducing an unreviewed editable-grid interaction. Search and Add manual line remain accessible on phones.
- Native estimate title and arithmetic explanation remain available alongside customer wording even where omitted from the phone reference. Dynamic native readiness and data replace illustrative Figma quantities, counters and timestamps.
- The current shared compact phone header supersedes the older page-specific header illustration, as requested. Icon-free evidence cannot establish the appearance of the private Pro kit.
- The saved-revision comparison can contain narrative changes, historical source identities and removals beyond the three illustrated scope rows. Do not truncate it to match the mock example.

Owner questions: confirm the undrawn line-editor treatment and desktop edit interaction; specify Cost types if needed; decide whether direct Alternatives/Revisions/option navigation should be adopted in the owning wizard. None changes native costing or authorises automatic pricing.

## Online and verification boundaries

Follow the [offline contract](../systems/offline.md). This page has no offline business queue, persistent draft or restart-safe operation journal. Its proposal and original operation live in the current page; navigation is guarded and reload can discard them. Read/permission state, code delivery, source presence, functional proof, owner visual review, business acceptance and deployment remain distinct.

[Execution evidence](../../../testing/evidence/discovery-costing/README.md) records checks, fixture boundaries, viewport comparisons and remaining mismatches. Owner/device/assistive-technology review is pending. Documentation assurance is not business acceptance.
