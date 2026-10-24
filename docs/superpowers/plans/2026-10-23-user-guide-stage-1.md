# User Guide Stage 1: Markdown Source and Tooling, Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make reviewed Markdown files in `docs/guides/` the single source of every page guide.
- Every signed-in user sees exactly the released guides and panel they see today, now compiled from Markdown.
- The design workspace reads the same files.
- One six-state status vocabulary is enforced.
- The CRM Deals guide is rewritten for the five-stage workflow and kept hidden until it is reviewed.

**Architecture:**
- `src/guides/compile.ts` is the only importer of `marked` (lexer only) and `yaml`. It turns each guide file into PPO's typed `CompiledGuide` through an allowlist.
- `npm run build` compiles every guide into `.ppo-guides/released.json`. Production reads that file; the local development server compiles on request.
- The root layout passes the released guides to the shell header through a client context.
- `src/guides/render.tsx` renders the model with React and no HTML strings, reproducing the accepted panel markup through generic rules.
- The development catalogue reads the same guides beside the legacy `guides.json` drafts.

**Tech Stack:**
- TypeScript 6, Next.js 16 App Router, React 19.
- `node:test` with `tsx`.
- Playwright 1.64, using the CRM UI review config for `tests/ui`.
- New: `marked` 18.1.0 and `yaml` 2.9.1, both exact pins.

**Spec:**
- `docs/decisions/ADR-0065-guide-markdown-parser.md`
- `docs/decisions/user-guide-direction.md` (PPO-USER-GUIDE-PROP: sections 4, 8 and 9, Q2 and Q11)

Also read:
- `docs/blueprints/contextual-help-design.md` (sections 2, 3 and 5)
- `docs/standards/page-guide-template.md`
- `AGENTS.md` (the design-register and component rules)
- `docs/design/development/README.md`
- `docs/design/development/components/README.md`

## Global Constraints

- **Packages.** `npm install --save-exact marked@18.1.0 yaml@2.9.1` puts both in `dependencies`. Add no other package.
- **Package imports.** Only `src/guides/compile.ts` imports `marked` or `yaml`. Never import `compile.ts` or `library.ts` into a client component or the esbuild fixture.
- **marked.** Call only `new Lexer({ gfm: true, breaks: false, pedantic: false }).lex(body)`. Never call `marked.parse`, `marked()` or a renderer.
- **yaml.** Use `parseDocument(text, { schema: "core", uniqueKeys: true })`. Every `errors` or `warnings` entry is a refusal. Then call `toJS({ maxAliasCount: 0 })`.
- **No HTML strings.** No `dangerouslySetInnerHTML` under `src/guides/`.
- **Status words.** Exactly `Draft`, `InReview`, `Reviewed`, `Published`, `Superseded` and `Withdrawn`.
- **Headings and section IDs.** Every `##` heading ends with `{#id}`, where the ID matches `^[a-z0-9]+(-[a-z0-9]+)*$`. Only `##` and `###` are allowed.
- **Callouts.** Only `> [!NOTE]`, `> [!WARNING]` and `> [!IMPORTANT]`.
- **Links.** Allowed: a single-slash path matching a registered route pattern; `guide:<guide_key>#<section-id>`; or `https:` to a host on `allowedHttpsHosts`, which is empty. Everything else is refused.
- **Images.** Refused in stage 1.
- **File locations.** New guide files go in `docs/guides/pages/<guide_key>.md`. `docs/guides/crm-deals.md` keeps its path, because issued r01 records link to it. YAML values containing `[` or `]` are quoted.
- **Binding.** A guide's `guide_key` equals the register `guide_key` of its `entry_key`. A key lives in Markdown or in `guides.json`, never both.
- **Visibility.** General users see a guide only if it is `Published` with valid review evidence, or carries both `shown_before_review: true` and `carried_over_from`. Everything else shows the existing fallback.
- **The accepted panel stays unchanged.** Carried-over guides render the same markup as today; a test proves it. Add no new user-visible text to the panel.
- **Audit and DK-06.** `npm audit --omit=dev --audit-level=high` and `node scripts/check-npm-audit.mjs` must pass. The PR states the DK-06 consequence of the lockfile change (ADR-0056).
- **Reviews stay as they are.** Refresh no `review_fingerprint`. All 26 reviewed register entries are expected to show "Source or design changed since review"; report them.
- **Nothing outside scope.** No migration, permission, capability or route change, no SOP links, no screenshots.

## Review Focus

1. **CRLF working copies.** A file with CRLF line endings compiles to the same model, hash and line numbers as LF. Tested in Tasks 1 and 2.
2. **Static route beside a dynamic route.** `/sales/opportunities/new` must not get the `/sales/opportunities/[id]` guide. Tested in Task 3.
3. **A route removed while a guide still links to it.** `studio:check` fails, naming the file and line. Tested in Task 3.
4. **Australian typography.** En dashes, curly quotes, ×, ° and non-breaking spaces survive, and IDs stay ASCII. Tested in Task 2.
5. **One bad file at run time.** One malformed guide, or a missing `released.json`, must not break the shell; that page falls back to "being prepared". Tested in Tasks 3 and 7.

---

### Task 1: Dependencies, guide model and front matter

**Files:**
- Modify: `package.json`, `package-lock.json`
- Create: `src/guides/model.ts`, `src/guides/status.ts`, `src/guides/compile.ts` (the front matter part)
- Test: `tests/unit/guide-markdown.test.ts`

**Interfaces:**
- Produces, in `model.ts`:
  ```ts
  export const guideStatuses = ["Draft","InReview","Reviewed","Published","Superseded","Withdrawn"] as const;
  export type GuideStatus = (typeof guideStatuses)[number];
  export type GuideFrontMatter = {
    // binding and PPO keys
    guide_key: string; entry_key: string; also_applies_to: string[];
    carried_over_from: string | null; shown_before_review: boolean;
    contents: Record<string, string>;            // section id -> contents button label
    list_styles: Record<string, "journey">;      // section id -> list style
    // page guide template keys (Q11)
    document_id: string | null; title: string; versioning: "git"; status: GuideStatus;
    issued_revision: string | null; audience: string | null; owner_role: string;
    reviewer: string | null; reviewed_at: string | null; reviewed_content_hash: string | null;
    review_due_at: string | null; source_commit: string; workflow_basis: string | null;
    runtime_evidence: string | null; resource_ids: string[]; supersedes: string | null;
    section_aliases: Record<string, string>; change_summary: string | null;
  };
  export type GuideError = { path: string; line: number; message: string };
  ```
- Produces, in `compile.ts`: `readFrontMatter(path: string, text: string): { front?: GuideFrontMatter; body: string; bodyLine: number; errors: GuideError[] }`.
  - **Required keys:** `guide_key`, `entry_key`, `title`, `versioning`, `status`, `owner_role` and `source_commit`. Every other key defaults to `null`, `[]`, `{}` or `false`.
  - **Errors:** unknown keys and wrong types.
  - **Template keys replaced by binding:** `route_patterns` and `entry_sections` are refused with the message "use entry_key and also_applies_to".
  - **Dates:** `reviewed_at` and `review_due_at` must be `YYYY-MM-DD`.
  - **Carry-over flags:** `shown_before_review: true` without `carried_over_from` is an error.
- Produces, in `status.ts`: `guideStateFor(front: GuideFrontMatter, contentHash: string): "Draft" | "In review" | "Reviewed" | "Changes awaiting review" | "Superseded" | "Withdrawn"`.
  - `Reviewed` and `Published` give "Reviewed" only when `reviewer`, `reviewed_at` and `reviewed_content_hash` are present and the hash equals `contentHash`. Otherwise they give "Changes awaiting review".
  - (The existing `guideReviewState` in `src/development/catalog.ts` stays for JSON guides.)

- [ ] **Step 1: Install**

Run: `npm install --save-exact marked@18.1.0 yaml@2.9.1 && npm ls marked yaml`
Expected: `package.json` gains `"marked": "18.1.0"` and `"yaml": "2.9.1"`; no other new packages appear.

- [ ] **Step 2: Write the failing tests**

Add these tests to `tests/unit/guide-markdown.test.ts`, using `node:test` and `node:assert/strict`:

- **`front matter reads a complete guide`:** `front.guide_key === "guide.page.sales.leads"`, `also_applies_to` deep-equals `[]` and there are no errors.
- **`front matter refuses unknown keys, duplicates and aliases`:** one case each for `colour: red`, `title: A` written twice, and `a: &x 1` followed by `b: *x`. Each gives an error, and `front === undefined`.
- **`front matter refuses unknown tags on known keys`:** `title: !!js/function x` gives an error. This proves that warnings count.
- **`front matter refuses route_patterns and bad values`:** one case each for `route_patterns: [/x]`, `status: Approved`, `reviewed_at: 23/10/2026` and `versioning: r01`.
- **`shown_before_review needs carried_over_from`**
- **`front matter is identical for CRLF and LF`**
- **`state follows the hash`:**
  - Published with a matching hash gives "Reviewed".
  - Published with a different hash gives "Changes awaiting review".
  - InReview gives "In review".

- [ ] **Step 3: Run the tests**

Run: `node --import tsx --test tests/unit/guide-markdown.test.ts`
Expected: FAIL (the module is not found).

- [ ] **Step 4: Implement**

Normalise `\r\n` to `\n` first. Front matter sits between a first line of `---` and the next line of `---`. Map yaml's error and warning positions to file lines.

- [ ] **Step 5: Run the tests**

Same command. Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json src/guides tests/unit/guide-markdown.test.ts
git commit -m "feat(guides): add marked and yaml with the guide model and front matter reader (ADR-0065)"
```

### Task 2: Body compiler and URL policy

**Files:**
- Modify: `src/guides/model.ts`, `src/guides/compile.ts`
- Create: `src/guides/links.ts`
- Test: `tests/unit/guide-markdown.test.ts`

**Interfaces:**
- Produces, in `model.ts`:
  ```ts
  export type InlineNode =
    | { kind: "text"; text: string } | { kind: "strong"; children: InlineNode[] }
    | { kind: "emphasis"; children: InlineNode[] } | { kind: "code"; text: string }
    | { kind: "break" } | { kind: "link"; href: string; children: InlineNode[] };
  export type BlockNode =
    | { kind: "paragraph"; children: InlineNode[] }
    | { kind: "heading"; children: InlineNode[] }            // a ### heading
    | { kind: "list"; ordered: boolean; items: BlockNode[][] }
    | { kind: "table"; header: InlineNode[][]; rows: InlineNode[][][] }
    | { kind: "callout"; tone: "note" | "warning" | "important"; children: BlockNode[] };
  export type GuideSection = { id: string; title: InlineNode[]; blocks: BlockNode[] };
  export type CompiledGuide = {
    path: string; front: GuideFrontMatter; lead: BlockNode[]; sections: GuideSection[];
    contentHash: string; references: { href: string; line: number }[];
  };
  ```
- Produces, in `compile.ts`: `compileGuide(path: string, text: string): { guide?: CompiledGuide; errors: GuideError[] }`.
  - `lead` holds the blocks before the first `##`.
  - `references` lists every link with its line.
  - `contentHash` is SHA-256 over `JSON.stringify({ guide_key, entry_key, also_applies_to, title, section_aliases, contents, list_styles, body })`, where `body` is LF-normalised. Review fields are excluded.
- Produces, in `links.ts`:
  - `export const allowedHttpsHosts: readonly string[] = [];`
  - `linkShape(href: string): "route" | "guide" | "https" | "refused"`, a syntax-only check:
    - `route` is `^/(?!/)[^\s?#]*$`;
    - `guide` is `^guide:[a-z0-9.\-]+#[a-z0-9]+(-[a-z0-9]+)*$`;
    - `https` is a parseable `https:` URL whose host is in the allowlist.

- [ ] **Step 1: Write the failing tests**

- **`compiles every allowed construct`:** a lead paragraph, then `## How to use it {#how}` containing:
  - an ordered list item written as `**Find the record**\` with the text on the next line;
  - a two-column table;
  - `> [!WARNING]` followed by a paragraph;
  - an inline code span, an emphasis span, and an inline Markdown link with text "Deals" and target `/sales/opportunities`.

  Assert:
  - `sections[0].id === "how"`;
  - the item's paragraph children start with `strong`, then `break`;
  - the callout's `tone === "warning"`;
  - `references[0].href === "/sales/opportunities"`.
- **`refuses disallowed constructs with their line`:** one case each for:
  - a block `<div>x</div>`;
  - inline `a <b>x</b>`;
  - an HTML comment;
  - a fenced code block;
  - `***` on its own line;
  - a line of text underlined with `===` (a setext heading);
  - a reference definition `[a]: /work`;
  - footnote text `see [^1]`;
  - a plain `> quote`;
  - an inline Markdown image.

  Each gives an error whose `line` is that construct's line in the file.
- **`refuses bad headings and ids`:** one case each for `# Title`, `#### Deep`, `## Overview` (no ID), `## A {#Bad_Id}`, and two headings both using `{#how}`.
- **`refuses unsafe links`:** one case each for `javascript:alert(1)`, `data:text/html,x`, `http://example.com`, `//evil.example`, `mailto:a@b.c` and `https://example.com`. Each gives an error, while `guide:guide.page.work#how` and `/work` compile.
- **`keeps typography, and CRLF equals LF`:** a paragraph containing `–`, `“quoted”`, `×`, `°` and a non-breaking space round-trips exactly. The CRLF and LF versions give an equal `contentHash` and equal error lines.
- **`content hash ignores review fields`:** changing `reviewer` keeps the hash; changing the body changes it.

- [ ] **Step 2: Run the tests**

Run: `node --import tsx --test tests/unit/guide-markdown.test.ts`
Expected: the new tests FAIL.

- [ ] **Step 3: Implement**

- Walk marked's tokens with a `switch` on `token.type`. Any unmapped type is an error.
- Work out each token's line by counting `\n` in the preceding `raw` text, starting from `bodyLine`.
- Add the three explicit checks from ADR-0065 decision 3:
  - a non-empty `tokens.links`;
  - a `\[\^[^\]]+\]` text match;
  - a heading whose `raw` does not start with `#`.
- Detect a callout from a blockquote's first paragraph text with `^\[!(NOTE|WARNING|IMPORTANT)\]\s*\n?`, then strip that marker.

- [ ] **Step 4: Run the tests**

Same command. Expected: PASS.

- [ ] **Step 5: Commit**

`git commit -m "feat(guides): compile guide Markdown to an allowlisted model with a URL policy"` (after `git add src/guides tests/unit/guide-markdown.test.ts`).

### Task 3: Guide library, release file and route matching

**Files:**
- Create: `src/guides/library.ts` (server), `src/guides/released.ts` (no Node imports), `scripts/build-guides.ts`
- Modify: `package.json` (`"build": "node --import tsx scripts/build-guides.ts && node --import tsx scripts/build-offline.ts && next build"`), `.gitignore` (add `.ppo-guides/`)
- Test: `tests/unit/guide-library.test.ts`

**Interfaces:**
- Consumes `compileGuide` and `readMaster`, and `Entry` from `src/development/model.ts`.
- `library.ts` produces:
  - `export const carriedOverSources = ["src/components/leads-guide.ts","src/activities/work-guide.ts","src/components/estimating-workload-guide.ts","src/components/cost-sources-guide.ts","src/supply/guide.ts","src/engineering/control/guide.ts","src/shell/guide.ts"] as const;`
  - `readGuideLibrary(root: string, entries: Entry[]): Promise<GuideLibrary>`, where `GuideLibrary = { guides: CompiledGuide[]; errors: GuideError[] }`.
    - It discovers `docs/guides/**/*.md` whose front matter declares a `guide_key`.
    - It compiles each file and keeps the valid ones in `guides`, with all errors in `errors`.
    - In development it caches by path and mtime.
  - `releasedGuideLibrary(root = process.cwd()): Promise<ReleasedLibrary>`.
    - When `NODE_ENV === "production"`, it reads `.ppo-guides/released.json`. Otherwise it reads the register, calls `readGuideLibrary` and then `releasedGuides`.
    - It never throws: on any failure it logs one `console.error` line and returns `{ guides: [], routes: [], shell: null }`.
- `released.ts` produces:
  ```ts
  export type ReleasedLibrary = {
    guides: CompiledGuide[];
    routes: { path: string; guide_key: string }[];   // route patterns bound to visible guides
    shell: CompiledGuide | null;                      // the guide bound to system:shell
  };
  export function releasedGuides(library: GuideLibrary, entries: Entry[]): ReleasedLibrary;
  export function guideForPath(released: ReleasedLibrary, pathname: string): CompiledGuide | null;
  ```
  `guideForPath` uses `matchEntry`'s precedence: the exact static path first, then the longest dynamic pattern, with `[param]` matching any non-empty segment.
- **Cross-check errors** name the file and, where relevant, the line:
  - the entry key is unknown;
  - `guide_key` is not equal to the entry's register `guide_key`;
  - an `also_applies_to` key is unknown, or is claimed twice;
  - a `guide_key` is duplicated;
  - a route link matches no registered pattern;
  - a `guide:` link names an unknown guide or section;
  - a `section_aliases` target is missing;
  - a `contents` or `list_styles` key is not a section ID;
  - `carried_over_from` is not in `carriedOverSources`.
- **`scripts/build-guides.ts`** reads the register, calls `readGuideLibrary`, and exits non-zero listing every error. Otherwise it writes `.ppo-guides/released.json`.

- [ ] **Step 1: Write the failing tests**

Use a `mkdtemp` root and an in-memory `Entry[]`.

- **`binds guides to register entries and refuses mismatches`**
- **`static route wins over dynamic`:** for entries `/sales/opportunities/new` (guide A) and `/sales/opportunities/[id]` (guide B), `"/sales/opportunities/new"` gives A and `"/sales/opportunities/0d0c…"` gives B.
- **`also_applies_to extends a guide and cannot be claimed twice`**
- **`a link to a removed route fails with file and line`**
- **`one malformed file leaves the others usable`**
- **`visibility follows status`:**
  - shown: Published with valid evidence; InReview with `shown_before_review` and `carried_over_from`;
  - hidden: Draft, InReview without the flag, Reviewed, Superseded, Withdrawn, and Published with a stale hash.
- **`guide links resolve to known sections`**
- **`released library survives a missing release file`:** with `NODE_ENV=production` and no file, the result is empty and the call does not throw.

- [ ] **Step 2: Run the tests**

Run: `node --import tsx --test tests/unit/guide-library.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement**

- [ ] **Step 4: Run the tests**

Run: `node --import tsx --test tests/unit/guide-library.test.ts tests/unit/guide-markdown.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

`git commit -m "feat(guides): guide library, release file and route matching"` (after adding `src/guides`, `scripts/build-guides.ts`, `package.json`, `.gitignore` and the test).

### Task 4: React renderer that reproduces the accepted panel

**Files:**
- Create: `src/guides/render.tsx` (client-safe; imports only `model.ts`, `links.ts`, `react` and `next/link`)
- Test: `tests/unit/guide-render.test.ts`

**Interfaces:**
- Produces `GuideArticle({ guide, eyebrow, children, onOpenGuide }: { guide: CompiledGuide; eyebrow: string; children?: React.ReactNode; onOpenGuide?: (key: string, section: string) => void }): JSX.Element`. It follows these markup rules, which are the current `shell-page-guide.tsx` markup (lines 34–44):
  - **The article.** `<article class="ppo-page-guide">` contains:
    - `div.ppo-guide-intro`, holding `span.ppo-guide-eyebrow` (`eyebrow`), an `h3` title (`front.title`), and the lead blocks;
    - `nav.ppo-guide-contents`, with `aria-label="Guide sections"`;
    - then one `section.ppo-guide-section` per section;
    - then `children`.
  - **Contents buttons.** With `front.contents`, there is one button per entry in its order, labelled with its value. Only those sections' `h3` elements get `id="ppo-guide-<id>"` and `tabIndex={-1}`. Without `front.contents`, every section gets a button with its title, and every section `h3` gets the ID.
  - **Section headings.** A `##` title renders as the section's `h3`, and `###` renders as `h4`.
  - **Feature grid.** A run of `###` headings, each followed by exactly one paragraph, renders as `div.ppo-guide-features`, where each item is a `div` holding the `h4` and a `p`.
  - **Numbered steps.** An ordered list whose every item's first paragraph starts with `strong` then `break` renders as `ol.ppo-guide-steps`. It becomes `ol.ppo-guide-journey` when `front.list_styles[section.id] === "journey"`. Each `li` holds `span.ppo-step-number` (`aria-hidden="true"`, the item number), then a `div` holding `h4` (the strong children) and `p` (the rest).
  - **Shortcut list.** A two-column table whose every first-column cell is one `code` node renders as `dl.ppo-guide-shortcuts`. Each row is a `div` holding `<dt><kbd>`key`</kbd></dt><dd>`text`</dd>`.
  - **Callouts.**
    - A `note` callout holding one paragraph renders that paragraph's inline content directly inside `div.ppo-guide-note`.
    - Other callouts render `div.ppo-guide-note` with `data-tone` and their blocks.
  - **Other blocks.** Other tables render `<table>` with `<th scope="col">`. Other lists render `ul` or `ol`.
- **Links** are re-checked with `linkShape`:
  - `route` renders through a `LinkComponent` prop that defaults to `next/link`;
  - `guide` renders as a button calling `onOpenGuide`, or as plain text without it;
  - `https` renders as `<a target="_blank" rel="noopener noreferrer">`, with the visible suffix " (opens in a new tab)";
  - `refused` renders the text only.

- [ ] **Step 1: Write the failing tests**

Use `renderToStaticMarkup` from `react-dom/server`; `phone-header.test.ts` already renders `next/link` this way.

- **`renders the accepted panel structure`:** a fixture guide with `contents` for `overview`, `how` and `journey`, and `list_styles: { journey: journey }`. Assert that:
  - there are exactly three nav buttons, with the given labels;
  - `id="ppo-guide-how"` is present;
  - the section without a contents entry has no `id`;
  - `ppo-guide-features`, `ppo-guide-steps`, `ppo-guide-journey`, `ppo-guide-shortcuts` with `<kbd>`, and a `ppo-guide-note` with no inner `<p>` are all present.
- **`never trusts a hand-edited href`:** `javascript:alert(1)` renders no `href="javascript`.
- **`text is escaped`:** `<script>x</script>` renders as `&lt;script&gt;`.
- **`no HTML injection API under src/guides`:** no file there contains `dangerouslySetInnerHTML`.

- [ ] **Step 2: Run the tests**

Run: `node --import tsx --test tests/unit/guide-render.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement**

- [ ] **Step 4: Run the tests**

Same command. Expected: PASS.

- [ ] **Step 5: Commit**

`git commit -m "feat(guides): render compiled guides with the accepted panel markup and no HTML strings"`

### Task 5: Rewrite the CRM Deals guide for the five-stage workflow

The guide is rewritten before the library is wired into `studio:check` (Task 8), because the current file already declares a `guide_key` and would fail.

**Files:**
- Modify: `docs/guides/crm-deals.md` (rewritten in place; `document_id: PPO-HELP-CRM` is kept)
- Modify: `docs/design/development/guides.json` (remove only the `guide.page.sales.opportunities` draft)
- Modify: `docs/standards/document-register.csv` (the PPO-HELP-CRM row's `status` only)

**Interfaces:**
- **Front matter:**
  - `guide_key: guide.page.sales.opportunities`
  - `entry_key: route:/sales/opportunities`
  - `also_applies_to: ["route:/sales/opportunities/[id]"]`
  - `status: InReview`
  - `shown_before_review: false`
  - `versioning: git`
  - `resource_ids: []`

  The register entry `route:/sales/opportunities/[id]` keeps its own JSON draft.
- **Sections:** the template's user sections in order, with the IDs `purpose`, `before`, `quick-start`, `page-tour`, `information`, `tasks`, `completion`, `states`, `examples`, `recovery`, `mobile`, `resources` and `review`.

- [ ] **Step 1: Read the workflow**

Read `src/crm/stages.ts` and the Deals list and record pages under `src/app/(business)/sales/opportunities/`, together with their components and services, until you can name every on-screen label, stage, requirement and recovery state. Record the commit in `source_commit`, and list the files in the PR description; the guide carries no author notes.

- [ ] **Step 2: Write the guide**

- Use Australian English and the exact screen labels.
- Describe the five stages as the code defines them, with one normal example and one recovery example, both using `SYN-` records.
- Use "deal", and mention once that the record is an opportunity.
- Link only to registered routes.
- Put "No approved SOP linked yet." in `resources`.

- [ ] **Step 3: Verify**

Run: `node --import tsx -e "import('./src/guides/compile.ts').then(async m=>{const fs=await import('node:fs');const r=m.compileGuide('docs/guides/crm-deals.md',fs.readFileSync('docs/guides/crm-deals.md','utf8'));console.log(r.errors);process.exit(r.errors.length?1:0)})"`
Expected: `[]`. Because the guide stays hidden, the Deals panel still shows "being prepared", which `tests/ui/desktop-shell.spec.ts:120` asserts.

- [ ] **Step 4: Commit**

`git commit -m "docs(guides): rewrite the CRM Deals guide for the five-stage workflow"`

### Task 6: Carry the released TypeScript guides over to Markdown

**Files:**
- Create (one-off, never committed): `scripts/convert-released-guides.ts`
- Create: `docs/guides/pages/*.md`, `tests/unit/fixtures/released-guide-markup.json`, `tests/unit/guide-parity.test.ts`
- Modify: `docs/design/development/guides.json` (remove the drafts whose keys move to Markdown; leave drafts for `also_applies_to` routes)
- Modify: `docs/design/development/register.json` (`system:shell` gets `"guide_key": "guide.system.shell"`; nothing else changes)

**Interfaces:**
- Consumes the seven `carriedOverSources` modules (unchanged in this task), `readGuideLibrary` and `GuideArticle`.

- [ ] **Step 1: List the bindings**

Follow the resolver in `src/components/shell-page-guide.tsx:17`: `supplyGuide`, then `engineeringControlGuide`, then the cost-sources rule, then `/estimating`, then `pageGuides[page]`. Here `page` is the label from `product-navigation.tsx:630`. List every registered route where each released guide shows today.
- The primary route's entry gives the file's `entry_key` and `guide_key`; the other routes go in `also_applies_to`.
- There is one file per supply page, one per engineering control module (`basis`, `drawings`, `queries`, `reviews`), one for the engineering workload (`/engineering` and `/engineering/[id]`), and `guide.system.shell.md` (`entry_key: system:shell`).

Put the list in the converter as data.

- [ ] **Step 2: Write the converter**

For each guide, the converter writes Markdown with:
- `status: InReview`, `shown_before_review: true`, `carried_over_from`, `versioning: git`, `owner_role: "Prototype content owner: Dean Fiedler"` and `source_commit` (from `git rev-parse HEAD`);
- `contents: { overview: "Overview", how: "How to use", journey: "Journey map" }` and `list_styles: { journey: journey }`.

The body follows the order of `shell-page-guide.tsx:34–42`:
- `intro` as the lead;
- `## <overviewTitle> {#overview}`, with `purpose`, then `### <feature title>` and its text for each feature;
- `## How to use it {#how}`, an ordered list of `**<title>**\` with the text on the next line;
- `## Your journey {#journey}`, with `journeyIntro` and the same list form;
- `## On your phone {#mobile}`;
- `## Keyboard shortcuts {#shortcuts}`, a `| Key | Action |` table with the key in inline code;
- `## If something is unavailable {#recovery}`, with `recovery`, then `> [!NOTE]` and `boundary`.

The converter also writes `tests/unit/fixtures/released-guide-markup.json`. For each `guide_key`, it records `renderToStaticMarkup` of a verbatim copy of `shell-page-guide.tsx` lines 34–42 (the article without its line-43 button). The eyebrow is "Page guide", or "User guide" for the shell guide.

- [ ] **Step 3: Write the parity test**

- **`carried-over guides render today's panel markup`:** for each library guide with `carried_over_from`, the `renderToStaticMarkup(<GuideArticle guide={g} eyebrow={…} />)` output, with whitespace between tags collapsed, equals the fixture entry. Guides without `carried_over_from` are skipped; a later reviewed rewrite removes the flag and deletes its fixture line.
- **`fixture has no orphan lines`**

- [ ] **Step 4: Run**

Run: `node --import tsx scripts/convert-released-guides.ts && node --import tsx --test tests/unit/guide-parity.test.ts tests/unit/guide-library.test.ts`
Expected: PASS. If parity fails, fix the converter or the Task 4 renderer rules; never edit the fixture by hand.

- [ ] **Step 5: Remove the moved JSON drafts and bind the shell guide**

Run the Step 4 command again. Expected: PASS. List the removed draft keys for the PR description (ADR-0065, consequences).

- [ ] **Step 6: Read every generated file once**

Fix the converter, not the output.

- [ ] **Step 7: Delete the converter and commit**

```bash
rm scripts/convert-released-guides.ts
git add docs/guides/pages docs/design/development/guides.json docs/design/development/register.json tests/unit/fixtures/released-guide-markup.json tests/unit/guide-parity.test.ts
git commit -m "docs(guides): carry the released page guides over to Markdown unchanged"
```

### Task 7: Serve the released guides from Markdown and retire the TypeScript guides

**Files:**
- Create: `src/guides/provider.tsx` (client)
- Modify:
  - `src/app/layout.tsx` (wrap `ApplicationFrame`)
  - `src/components/shell-page-guide.tsx`
  - `tests/ui/crm-board-fixture.tsx` and any other fixture that renders `ProductHeader` (find them with `git grep -l "ProductHeader" tests/ui`)
  - `scripts/build-crm-ui-review.mjs` (run `scripts/build-guides.ts` first, so the fixture can import `.ppo-guides/released.json`)
  - `docs/design/development/register.json`: replace each `source_paths` and `dependencies` reference to a deleted module (33 today) with `src/guides/render.tsx` and the guide file or files that now hold that content
  - `docs/design/development/components.json` (3 references) and the matching `docs/design/development/components/*.md`, per `components/README.md`
- Delete: the seven `carriedOverSources` modules and the `PageGuide` type

**Interfaces:**
- Produces:
  - `GuideLibraryProvider({ value, children }: { value: ReleasedLibrary; children: React.ReactNode })`.
  - `useReleasedGuides(): ReleasedLibrary`, which returns the empty library when there is no provider.
- **The root layout** awaits `releasedGuideLibrary()` and renders `<GuideLibraryProvider value={…}><ApplicationFrame …/></GuideLibraryProvider>`.
- **`ShellPageGuide({ page })`** keeps its props and today's behaviour:
  - the guide comes from `guideForPath(useReleasedGuides(), usePathname())`;
  - `usePageDescription()` still supplies the fallback description;
  - the shell guide opens directly when `page === "Application shell"`;
  - the fallback text is unchanged ("The detailed {page} guide is being prepared." and its note);
  - the "Read the application shell guide" button opens `released.shell` and is passed as `GuideArticle` children;
  - the eyebrow is "User guide" for the shell guide and "Page guide" otherwise.

- [ ] **Step 1: Write the failing test**

Add this test to `tests/unit/guide-render.test.ts`: **`ShellPageGuide falls back without a provider`**. Rendering inside a minimal pathname context with no provider shows the "being prepared" text and does not throw.

- [ ] **Step 2: Run the test**

Run: `node --import tsx --test tests/unit/guide-render.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement**

Add the provider, change the layout and `ShellPageGuide`, update the fixtures and registers, and delete the modules.

- [ ] **Step 4: Verify**

Run: `npm run test:unit && npm run typecheck && npm run lint && npm run studio:check`
Expected: PASS. Typecheck proves nothing imports a deleted module. `studio:check` reports no Missing reference errors.

- [ ] **Step 5: Browser specs**

Run: `node scripts/build-crm-ui-review.mjs && npx playwright test --config=playwright.crm-ui.config.ts tests/ui/desktop-shell.spec.ts`
Expected: PASS, with the spec unchanged. It covers the Deals fallback, the "Journey map" button, focus return and guide typography against the reference.

If Chrome cannot run locally, say so and rely on the `crm-refinements` workflow. Never edit the spec to make it pass.

- [ ] **Step 6: Commit**

`git commit -m "feat(guides): serve released page guides from Markdown and retire the TypeScript guides"` (after staging the files and deletions listed above).

### Task 8: Design workspace, status vocabulary and studio tooling

**Files:**
- Modify:
  - `src/development/model.ts` (`GuideDocument` gains `markdown?: CompiledGuide`, and `Guide.status` becomes `GuideStatus`)
  - `src/development/catalog.ts`: the guide lookup near line 282, the fingerprint at 305–307, the check at 313 and the checks at 355–376
  - `src/development/runtime.ts` and `src/development/page-guide.tsx`
  - `scripts/build-development-snapshot.ts` and `scripts/check-development-register.ts`
- Create: `src/development/sync.ts` (`syncNewRoutes(root: string): Promise<number>`, moved out of the script)
- Test: `tests/unit/development-workspace.test.ts`

**Behaviour:**
- **`buildCatalog`** calls `readGuideLibrary` and pushes its errors into `catalog.errors`.
  - **Covered entries.** An entry counts as covered when its own `guide_key` has a JSON or Markdown guide, or when a Markdown guide lists it in `also_applies_to`. Use that rule for `User guide missing`.
  - **Guide status.** `guide_status` uses `guideStateFor` for Markdown guides.
  - **Duplicate keys.** "Guide key exists in Markdown and guides.json: <key>" is an error.
  - **Fingerprints.** Markdown guides use `contentHash`; JSON guides keep `JSON.stringify(guide)`.
- **JSON guides** accept all six statuses. The review-evidence error applies to both `Reviewed` and `Published`.
- **The development reader** renders `GuideArticle` when `markdown` is present.
- **The snapshot** includes Markdown guides, each with its own file history.
- **`syncNewRoutes`** writes `docs/guides/pages/<guideKey>.md` instead of a JSON entry. The stub is `status: Draft` and has today's three sections (`purpose`, `quick-start`, `recovery`), with the same text.

- [ ] **Step 1: Write the failing tests**

- **`catalog reads Markdown guides and reports their errors`**
- **`also_applies_to covers an entry`**
- **`a guide key in both sources is an error`**
- **`JSON guides accept the six statuses`:** Published without a reviewer gives "Guide review evidence missing"; InReview gives no error.
- **`syncNewRoutes writes a Markdown stub that compiles`:** `guides.json` is left unchanged.
- The existing test at `development-workspace.test.ts:119` (`catalog.errors` deep-equals `[]`) keeps passing.

- [ ] **Step 2: Run the tests**

Run: `node --import tsx --test tests/unit/development-workspace.test.ts`
Expected: the new tests FAIL.

- [ ] **Step 3: Implement**

- [ ] **Step 4: Verify**

Run: `npm run studio:check && npm run test:unit`
Expected: no errors. Record the entries reported as "Source or design changed since review" (all 26 reviewed entries are expected); do not refresh them.

- [ ] **Step 5: Commit**

`git commit -m "feat(development): read Markdown guides, one status vocabulary, Markdown stubs from studio:sync"`

### Task 9: Authoring contract, design register, records and full verification

**Files:**
- Create: `docs/guides/README.md` (the authoring contract), covering:
  - the file location and filename rule;
  - every front matter key, with the mapping from the template's `route_patterns` to `entry_key` and `also_applies_to`;
  - the six statuses and who changes them;
  - the allowed Markdown, with one example each;
  - the panel rules (`contents`, `list_styles`, the feature grid, steps and shortcuts);
  - links and callouts;
  - what is refused;
  - how to add a guide for a new page;
  - how a carried-over guide leaves `carried_over_from`;
  - that the template's `USER GUIDE START` markers are not used in Markdown guides.
- Modify:
  - `docs/design/development/systems/guidance.md` (the Markdown pipeline and the visibility rule);
  - `docs/design/development/README.md`, the guide statements at lines 16, 31, 52, 80 and 96 only;
  - `docs/decisions/ADR-0065-guide-markdown-parser.md`: set its status to implemented, with the build commit and audit output.
- Create:
  - `docs/status/<date>-user-guide-stage-1-build.md`;
  - `docs/standards/document-register-entries/<date>-user-guide-stage-1-build.csv` (`PPO-GUIDES-README`).

- [ ] **Step 1: Write the documentation**

- [ ] **Step 2: Run the full checks**

```bash
npm run check
npm audit --omit=dev --audit-level=high
node scripts/check-npm-audit.mjs
python3 scripts/check_foundation.py
python3 scripts/check_naming.py
python3 scripts/build_status.py --check
node scripts/build-crm-ui-review.mjs && npx playwright test --config=playwright.crm-ui.config.ts
```
Expected: all pass. `check_naming` passes for PPO-HELP-CRM because its front matter declares `versioning: git`. Put the summary lines in the status fragment and the PR.

- [ ] **Step 3: Commit, then open the PR**

The PR description states:
- the DK-06 consequence;
- the audit results;
- the 26 Stale entries;
- the removed JSON draft keys;
- that the CRM guide is hidden (InReview);
- that no guide was reviewed or published.

Request a cross-model review of `src/guides/compile.ts` and `links.ts`, because the URL policy is a security control, and report its outcome.
