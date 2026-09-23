# Powerplants One — working design and build register

**Owner:** Dean Fiedler · **Working issue:** r01 · **Schema:** 1 · **Date:** 23 September 2026.

This folder is the Git master for the local development workspace. Open `/development/page-register` through the local application or the **Design and build workspace** icon next to global search. `/development/design-system` shows the current root tokens and real shared controls. These routes and supporting endpoints are unavailable in hosted/production mode. Set `PPO_DEVELOPMENT_WORKSPACE=off` to disable them locally.

## What is maintained

| Source | Responsibility |
|---|---|
| `register.json` | Stable scope/route/system keys, source and design links, owners, dependencies, review fingerprints and separate delivery states |
| `guides.json` | Structured per-entry articles; section IDs, revision, draft/review state, tasks, recovery, evidence and applicability |
| `pages/*.md` | Editable desktop and mobile design contracts, exact images/HTML and observable review requirements |
| `systems/*.md` | Shell, theme, guidance and offline cross-page contracts |
| `src/app/globals.css`, `src/components/ui/` | Runtime tokens and shared component implementation; the theme page reads these |
| `docs/reference/ui/module-workflow-maps/` | Automatically discovered journey-map files; earlier issues remain available |

The imported baseline has 150 scopes and 110 source destinations from r05. Two new development pages and four shared systems extend it to 266 entries, 262 draft articles and 266 design references. Eight existing images are linked across fifteen baseline entries. Their provenance distinguishes design references from implementation captures. Missing images are visible work, not broken placeholder links. The standalone r05 is a retained portable issue; routine changes belong here rather than in a new HTML revision.

## Daily change workflow

1. Find the stable entry and inspect its exact source, accepted baseline, guide, desktop/mobile contract and shared dependencies before changing a page.
2. For a new route, run `npm run studio:sync`. It adds draft entries, articles and design stubs while retaining editorial content. Complete the page-specific purpose, tasks, fields, states, handovers and desktop/mobile contract in the same PR. Discovery stubs are not complete documentation.
3. Edit existing working files directly. Add exact available images and HTML paths, including their revision and intended viewport in the Markdown contract. Retain old issued references. Do not substitute an unrelated screenshot to fill a missing image.
4. Implement using shared components/tokens. Document accepted exceptions and gradually migrate legacy controls when their page is refined. The gallery does not yet replace every legacy button family.
5. Run `npm run studio:check`, applicable tests and a paired reference/application review. CI fails missing canonical routes, missing files/guides, duplicate keys or broken guide/related bindings. Review warnings remain separate from integrity failures. New journey HTML is discovered without editing a second index.
6. Record actual review evidence, reviewer, viewport, source/release and result in the Markdown contract. Only then copy the current fingerprint and date into the entry. Keep functional and deployment evidence distinct. A matching fingerprint means no tracked change since that recorded review; it is not an approval system.
7. Commit the code, guide and design changes together. Review the PR and deploy only under the existing authority. Refresh the local register after editing; it also checks every 30 seconds while visible and no reader is open. An open reader stays stable. A changed file hash asks for a refresh instead of silently substituting a different reference.

The dedicated GitHub workflow and `npm run check` enforce coverage. The repository `AGENTS.md` and PR template require this maintenance. Automation detects omissions and changed sources; it cannot invent correct business instructions or approve visual similarity.

## Source change and review model

Fingerprints include shared shell/theme sources, explicit dependencies, literal relative imports/re-exports recursively, the page design, exact image/HTML bytes and article content. CRLF/LF differences in text do not invalidate reviews. Runtime-computed files and external design dependencies must be declared explicitly. There are no TypeScript path aliases in the current project; introduce resolver support if aliases are adopted. This dependency scan is an impact aid, not a substitute for functional tests.

Each entry separates retained scope assessment, source presence, visual review, functional evidence and deployment. A planned scope may point at a proposed future address. The register never infers successful deployment from source presence or HTTP 200. Reviews start unassigned/pending; no blanket approval was migrated from an older document.

## Link and guide behaviour

Local defaults to `http://127.0.0.1:3000`; hosted defaults to the verified sign-in origin from the Azure runbook. Per-visit overrides must be plain HTTP(S) origins. Record UUIDs are separate for each environment and cleared when the reader closes. Planned routes remain available as future references. The same UUID is not assumed to exist in both environments.

The global information icon retains released help and adds a **Development draft guide for this page** section locally. A canonical static route wins before a dynamic record route; unknown routes get an honest unavailable message. The full register supplies scope-specific articles and related design references. Publishing these drafts into hosted operational help, permission-bound SOPs, query-specific variants and release-bound approval requires the existing HELP-01–HELP-14 review; it is not implied by this development preview.

Guides use Australian English and thirteen sections: purpose, prerequisites, quick start, page tour, information, tasks, completion/handover, states, example, recovery, mobile/keyboard/offline, resources and review. Explain actual controls, required/conditional fields, save states and observable outcomes as each page is verified. Keep planned behaviour explicit. Do not invent permission grants, financial definitions, offline support or completed handovers.

## Closing the image-to-implementation gap

For each new approved mockup, record its immutable path/hash, viewport, revision and scope; describe layout regions, dimensions, spacing, typography, colour tokens, control variants, table/card behaviour, responsive transformations and loading/empty/error states in the Markdown contract. Separate observed image details from proposed behaviour. Compare the actual page at the same viewport and state. Record mismatches and resolve them against the accepted reference instead of updating a screenshot merely to pass.

Images alone do not specify interaction or mobile behaviour. Attach a mobile image where available and state what remains unspecified. Shared shell/theme contracts govern consistent controls; page-specific accepted exceptions must be explicit. Future richer design tooling can use these stable IDs and references without creating another source of truth.

## Theme changes and recovery

The live gallery renders the real shared Button/ButtonLink and semantic CSS tokens. Its colour/radius controls change only an isolated sample; exported JSON is an unapplied proposal. Ask Codex to apply a proposal through source changes, inspect all affected consumers, update references and run checks. Reload the gallery after changes. Revert unwanted changes through Git; avoid copying temporary browser state into an unreviewed global theme.

## Accessibility and security

The native reader uses a labelled dialog, keyboard Escape, heading focus and return to the opener. Cards reflow, long paths wrap, inputs retain labels and reference tables have their own scroll region. The mobile dialog fills the viewport. Native/device/screen-reader acceptance is recorded separately in the handover.

Reference serving accepts registry-derived IDs only, resolves real paths within the repository, restricts published extensions, checks expected hashes and disables caching. HTML previews run in a sandbox with no same-origin privileges, network requests, form submission or top navigation. The archived r04/r05 register is not exposed through this preview endpoint. No filesystem editor, Git credentials or business mutation is exposed to the browser.

See [ADR-0040](../../decisions/ADR-0040-development-workspace.md) and the [delivery handover](../../delivery/development-workspace-handover.md).
