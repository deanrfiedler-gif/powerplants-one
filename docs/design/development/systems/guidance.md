# Contextual guidance — working design reference

Stable entry: `system:guidance`. Owner: Dean Fiedler. Status: Draft for review.

Page-to-guide mapping, reader behaviour, release applicability and content review.

## Guide source and pipeline

User guide stage 1 ([ADR-0065](../../../decisions/ADR-0065-guide-markdown-parser.md)) makes Markdown files under `docs/guides/` the single source of every page guide. The [authoring contract](../../../guides/README.md) holds the rules for writing them.

- **Source.** One Markdown file per guide, with its metadata in front matter: `docs/guides/pages/<guide key>.md`, and `docs/guides/crm-deals.md`, which keeps its issued path. A guide names its register entry (`entry_key`) and any other entries it covers (`also_applies_to`); its `guide_key` must equal the register's `guide_key` for that entry. A key lives in Markdown or in `guides.json`, never both.
- **Compiler.** `src/guides/compile.ts` is the only importer of `marked` (lexer only) and `yaml`. It turns each file into PPO's typed guide model through an allowlist, and refuses everything else with the file and line.
- **Library.** `src/guides/library.ts` finds the guide files, compiles them and checks them against the register and each other: entry and guide keys, claims, section maps and links.
- **Build and gates.** `npm run build` runs `scripts/build-guides.ts` first. It fails on any guide error and writes the visible guides to the ignored `.ppo-guides/released.json`. `npm run studio:check` reads the same library and reports its errors as catalogue errors.
- **Delivery.** Production and the hosted demo read the release file through `src/guides/released-server.ts`, from a fixed path, so each page's build trace holds that one file rather than the repository. The local development server compiles the files on request; it loads `library.ts` only outside production. A missing or damaged release file is logged once per server process. The root layout passes the released guides to the shell through a client context (`src/guides/provider.tsx`), so the browser receives the compiled model, never the parser. A missing or damaged release file leaves the shell working, with every page on the "being prepared" fallback.
- **Rendering.** `src/guides/render.tsx` draws the model with React and no HTML strings, and checks each link again before drawing it. `src/components/shell-page-guide.tsx` chooses the guide for the current route: an exact route wins over a dynamic pattern, and a static route whose guide is hidden never falls through to a dynamic route's guide. Its fallback text is unchanged.
- **Design workspace.** The development page guide and the workspace reader show the Markdown guide that covers an entry, through its own key or through `also_applies_to`, before any JSON draft. `npm run studio:sync` writes a Draft Markdown stub for a new route instead of a `guides.json` entry.

## Who sees a guide

The six statuses are Draft, InReview, Reviewed, Published, Superseded and Withdrawn. General users see a guide only when:

1. it is Published, with its reviewer, review date and reviewed content hash recorded, and that hash still matches the content; or
2. it was carried over from a retired TypeScript guide that users already saw: it carries `shown_before_review: true` and `carried_over_from`, and it is InReview or Reviewed.

Every other page shows the existing "being prepared" fallback. Draft, Superseded and Withdrawn guides are never shown. The rule is applied when the build writes the release file and again when the production server reads it. Users with design-workspace access see every guide, whatever its status, in the **Development draft guide for this page** section and the workspace reader.

As of stage 1 (1 November 2026), the twenty carried-over guides are InReview and shown before review, so users keep exactly the released guides they saw before. The rewritten CRM Deals guide is InReview without `shown_before_review`, so the Deals pages still show the fallback. No guide is Reviewed or Published.

## Desktop

Use the actual shared application sources `src/components/shell-page-guide.tsx` and `src/guides/render.tsx`. The released panel's markup and typography are an accepted design: the carried-over guides render the same markup as the retired TypeScript guides, and a unit test compares them. The shell owns branding, navigation, global search, identity and viewport allocation. Development pages occupy the workspace interior. Shared changes must be checked against every affected consumer, using the complete root stylesheet order.

## Mobile

Check 390 × 844, 320 CSS px and 200% zoom. Preserve meaningful context, labelled actions and reachable close controls. A changed header must leave adequate room for search, the existing information icon and account controls. Preserve the established mobile navigation and unsaved-work protection.

## Change discipline

The live component gallery consumes runtime tokens and the shared Button component. Preview edits are temporary and scoped to the sample. Commit durable changes to source, inspect the consumer list, compare retained references and update any accepted exception deliberately. Record independent visual, functional and release evidence; do not treat a matching token as whole-page conformance.

## Recovery and review

Restore an unwanted working-source change through a reviewed successor in Git. Preserve issued references and past acceptance evidence. Verify keyboard navigation, focus, long content, loading, read-only and error states in the owning workflow. No complete visual review is recorded for this new development surface yet.

## Owner visual review — 9 October 2026

- **Reviewer:** Dean Fiedler. He accepted Claude's proposed verdicts from the phase 00 review boards (navigation canvas version 29).
- **Result:** Refine.
- **Evidence:** [phase 00 review, session 1](../../../testing/evidence/ui-review-phase-00-r01/README.md). Synthetic data; compiled build at `a52cb01`; 1440 × 900 and 390 × 844 headless Chromium, captures for this entry.
- **Findings:** S9: write the Home and My Work guides now. The panel itself works on desktop and phone.
- **Scope of this record:** visual review of the captured state only. Device, screen-reader, zoom and operational acceptance remain separate. A later source change marks this review stale.

## Refinement batch 2 — 9 October 2026

- **My Work guide (S9):** the information icon on My Work opens the drafted guide. It was written in `src/activities/work-guide.ts` and registered in `src/components/shell-page-guide.tsx`; since user guide stage 1 its content is in `docs/guides/pages/guide.page.work.md`, carried over unchanged. It covers:
  - what you see;
  - common tasks;
  - views and filters;
  - the phone;
  - what to do when something looks wrong.
- **Development-only detail:** the "Development draft guide" disclosure was already shown only in the development workspace. The panel footer's revision label ("Powerplants One · r17") is now shown only there too. Users see "Powerplants One" and "User guide and journeys".
- **Status:** the guide is a draft until Dean reviews it in the running app. Other phase 00 pages get their guides the same way in later batches.
