# ADR-0065: Reading user guide Markdown with marked and yaml

<!-- versioning: git; committed history is authoritative -->

Status: accepted by the owner on 23 October 2026: "Proceed: I accept ADR-0065 as written. Record my decision and start the stage 1 build using the plan, subagent-driven." The stage 1 build follows the [build plan](../superpowers/plans/2026-10-23-user-guide-stage-1.md). The user guide direction ([PPO-USER-GUIDE-PROP](user-guide-direction.md), Q2 and section 4.2) required this ADR before stage 1 built anything. Dean asked for it on 23 October 2026: "Proceed with stage 1: write the ADR for the Markdown parser and sanitiser, then the build plan."
Date: 23 October 2026. Owner: Dean Fiedler. Builder: Claude.

Related:
- [User guide direction](user-guide-direction.md) (PPO-USER-GUIDE-PROP), sections 4 and 8
- [Contextual help design](../blueprints/contextual-help-design.md) (PPO-HELP-DES), section 5.1, which asks for "the final renderer/sanitisation choice and dependency rationale" before implementation
- [Page guide template](../standards/page-guide-template.md), the metadata adopted under Q11
- [ADR-0056](ADR-0056-dependency-update-and-audit-gates.md) (dependency gates); [ADR-0006](ADR-0006-p01-local-foundation.md) (exact pins)
- [Stage 1 build plan](../superpowers/plans/2026-10-23-user-guide-stage-1.md)
- DOC-04, NFR-01, NFR-08

## Context

Dean accepted Markdown as the single source for the user guide: one file per guide, with its metadata in front matter. The application has to turn those files into the page guides that every signed-in user reads. Today:

- **No parser exists.** The repository has no Markdown parser, YAML reader or HTML sanitiser. The design workspace shows Markdown design contracts as raw text in a `<pre>` block (`src/development/workspace.tsx:819`).
- **No HTML strings exist.** `src/` contains no `dangerouslySetInnerHTML`. Both page guide readers render text through React elements, which escape it:
  - the released guides, held as TypeScript objects in seven modules and drawn by `src/components/shell-page-guide.tsx`;
  - the development drafts (`src/development/page-guide.tsx`).
- **The released panel is an accepted design.** `tests/ui/desktop-shell.spec.ts` compares its markup and typography with the shell reference (contents buttons "Overview", "How to use" and "Journey map", the feature grid, numbered steps, the journey band and the shortcut list).
- **Dependencies are few and pinned.** `package.json` has ten runtime dependencies, each pinned exactly (`save-exact=true`). ADR-0056 audits the runtime tree with no exceptions, and Dependabot proposes weekly updates.
- **The authors are trusted.** Guides are written in reviewed pull requests by Claude and Dean. No customer or staff member submits Markdown, so the risk is mistakes rather than attacks: a stray HTML tag, a `javascript:` link pasted from elsewhere, or a construct that renders differently from what the author meant.
- **The repository is public.** Guide files ship in the public repository and the private release image. PPO-HELP-DES keeps private SOP links and titles out of the public bundle.

The guides need:

- headings with **stable section IDs**, for deep links and section aliases;
- paragraphs, ordered and unordered lists, tables, links, bold and italic text, inline code for keys, and **callouts** (note, warning, important);
- the page guide template's author metadata;
- later, images from the private store (direction paper, section 5).

## Decision

1. **Parse with the marked lexer only.** Use **marked 18.1.0**, pinned exactly.
   - PPO calls only `new Lexer({ gfm: true, breaks: false, pedantic: false }).lex(body)`, which returns a token tree.
   - PPO never calls `marked.parse`, `marked()` or any renderer, so no HTML string is ever produced.
2. **Read front matter with yaml.** Use **yaml 2.9.1**, pinned exactly.
   - Call `parseDocument(text, { schema: "core", uniqueKeys: true })`.
   - Treat every entry in the document's `errors` **and** `warnings` as a refusal. An unknown tag such as `!!js/function` produces only a warning in yaml, so warnings must count.
   - Then call `toJS({ maxAliasCount: 0 })`, which refuses aliases.
   - Check the value against PPO's typed schema. Unknown or missing keys are refused.
3. **Compile into PPO's own model, using an allowlist.** One module, `src/guides/compile.ts`, is the only importer of either package. It turns each file into a typed `CompiledGuide` made only of these nodes:
   - **Blocks:** paragraph, level-3 heading, list, table and callout.
   - **Inline:** text, strong, emphasis, inline code, line break and link.

   Any other marked token is a compile error naming the file and line, never silently dropped: raw HTML (block or inline, comments included), code blocks, horizontal rules, images (refused until the private image store exists) and nested blockquotes.

   Three constructs marked does not emit as distinct tokens get explicit checks:
   - **Reference-style link definitions**, which marked moves into `tokens.links`. A non-empty `links` map is an error.
   - **Footnote syntax `[^…]`**, which marked leaves as text. A text node matching `\[\^[^\]]+\]` is an error.
   - **Setext headings** (a line underlined with `=` or `-`). A heading token whose raw text does not start with `#` is an error.
4. **Section IDs are explicit.** Every `##` heading ends with `{#section-id}`, and the ID must match `^[a-z0-9]+(-[a-z0-9]+)*$`. IDs are unique within a guide, and section aliases must point at a real ID. `#` and `####` and deeper headings are errors, because the title comes from front matter.
5. **Callouts use the GFM alert form.** A blockquote whose first line is `[!NOTE]`, `[!WARNING]` or `[!IMPORTANT]` becomes a callout. Any other blockquote is an error.
6. **Links pass a URL policy.** `src/guides/links.ts` holds the policy, and both the compiler and the renderer use it.
   - **Allowed:**
     - an application path that starts with a single `/` and matches a registered route pattern;
     - `guide:<guide_key>#<section-id>`, which must name a known guide and section;
     - `https:` to a host on `allowedHttpsHosts`, which starts empty. Adding a host is a reviewed change.
   - **Refused:** every other scheme (`javascript:`, `data:`, `vbscript:`, `file:`, `http:`, `mailto:`), protocol-relative `//` addresses and unparseable links.
   - **SOP links** come from resource records (PPO-HELP-DES, section 4), never from guide text.
7. **React renders the model, and the accepted panel stays the same.** Components in `src/guides/render.tsx` render each node type.
   - **No HTML strings.** No file under `src/guides/` uses `dangerouslySetInnerHTML`, and a unit test fails if one does.
   - **Links are checked again before render**, in case a compiled document was edited by hand.
   - **Generic rules reproduce the accepted panel:**
     - a section of `###` headings, each followed by one paragraph, renders as the feature grid;
     - an ordered list whose items start with a bold lead renders as numbered steps;
     - a section mapped to `journey` in the front matter `list_styles` map renders those steps as the journey band;
     - a two-column table whose first-column cells are each one inline code span renders as the shortcut list, with `<kbd>`;
     - the contents buttons come from an optional `contents` map in front matter (section ID to button label); without it, every section gets a button with its own title.
8. **Compile at build and check at every gate.** This follows the direction paper (section 4.2) and PPO-HELP-DES (section 5.1).
   - **The build.** `npm run build` first runs `scripts/build-guides.ts`. It compiles every guide, fails the build on any error, and writes the released guides to `.ppo-guides/released.json`. That folder is ignored by Git and lives inside the release image, so help ships with the commit it describes.
   - **Production and the hosted demo** read that file. If it is missing or unreadable, every page shows the "being prepared" fallback and the shell keeps working.
   - **The local development server** compiles guide files on request, recompiling a file when it changes.
   - **Other gates.** `npm run studio:check` and the release image's snapshot step also compile every guide and fail on any error.
   - **Delivery to the browser.** The root layout (`src/app/layout.tsx`), which mounts the shell header, passes the released guides to the shell through a client context. The browser receives the compiled model, never the parser.
9. **Both packages are runtime dependencies.** The local development server runs the compiler, so both packages go in `dependencies`. That puts them under ADR-0056's strict runtime audit.

**Why these versions.** marked 18.1.0 was published on 5 October 2026, and yaml 2.9.1 on 11 September 2026 (UTC). They are the newest releases at least two weeks old on the date of this record, so early regressions have had time to surface. marked 18.1.1 (12 October) is newer but under two weeks old; Dependabot will propose it. Both were checked with `npm view` on 23 October 2026:
- **marked:** MIT licence, no runtime dependencies, Node 20 or later, types included.
- **yaml:** ISC licence, no runtime dependencies, Node 14.6 or later, types included.

## Options considered

| Option | For | Against | Result |
|---|---|---|---|
| **marked lexer + yaml** | Two packages, neither with dependencies of its own. The token tree maps directly onto an allowlist. Widely used and maintained, with GFM tables | Less strict than CommonMark in rare edge cases, and three constructs need explicit checks (decision 3). marked does not sanitise, which does not matter because PPO never renders HTML with it | **Chosen** |
| markdown-it + yaml | Close CommonMark compliance; an `html: false` option | Six runtime dependencies (`entities`, `linkify-it`, `mdurl`, `punycode.js`, `uc.micro`, `argparse`). Its flat open/close token stream needs more code to build a tree | Rejected |
| unified/remark (`remark-parse`, `remark-gfm`, `remark-frontmatter`, `rehype-sanitize`) | The most correct parser (micromark), a standard syntax tree and a mature sanitiser | Dozens of packages: `micromark` alone has 16 runtime dependencies, its GFM extension 8 more, and `mdast-util-from-markdown` 12. More audit surface and weekly churn for trusted authors. The sanitiser solves a problem PPO avoids by never producing HTML | Rejected |
| A parser written for PPO | No dependency and no lockfile change | Markdown's emphasis, list, escape and table rules are hard to get right. PPO would own a parser and its bugs instead of a small allowlist | Rejected |
| MDX | Components inside content | Executable content, which PPO-HELP-DES forbids | Rejected |
| Render HTML and sanitise it (marked + DOMPurify) | A familiar pattern | It brings back `dangerouslySetInnerHTML`, and every page's safety then depends on the sanitiser's configuration | Rejected |

## Consequences

- **Lockfile and DK-06.** Adding two packages changes `package-lock.json`. As with every lockfile change (ADR-0056, consequences), managed template publications made earlier read `DefinitionChanged`, and Job pack preparation refuses with `TemplateUnavailable` until they are republished. The build PR must say this.
- **Dependency gates.** The build PR runs `npm audit --omit=dev --audit-level=high` and `node scripts/check-npm-audit.mjs`, and reports both results.
- **Recorded design reviews go stale.** Replacing the guide modules changes files that the design register follows for every entry: `shell-controls.tsx` and the root layout are shared sources. All 26 entries with a recorded visual review will therefore show "Source or design changed since review" until they are reviewed again. No review fingerprint is refreshed without a review.
- **A departure from the direction paper.** Section 4.3 of the direction paper keeps the `guides.json` drafts until a module is written properly. Carrying the released guides over to Markdown takes their guide keys, and a key may live in only one source. So the JSON drafts for those keys are removed in stage 1. Their text stays in Git history, and the build PR lists each one for the later rewrite. Drafts for routes that a Markdown guide only covers through `also_applies_to` stay.
- **Markdown edge cases.** Constructs where marked differs from CommonMark are avoided by the allowlist, and the compiler's tests pin the behaviour PPO relies on. Each Dependabot update of marked must pass those tests unchanged.
- **The authoring contract.** The rules are documented once, in `docs/guides/README.md`, and enforced by the build and by `studio:check`.
- **Reversal.** The compiled model belongs to PPO. Replacing marked with micromark, or with PPO's own parser, changes only `src/guides/compile.ts`; guide files and renderers are unaffected.

## Validation

The build that installs the packages adds `tests/unit/guide-markdown.test.ts`, `guide-library.test.ts`, `guide-render.test.ts` and `guide-parity.test.ts`. Together they prove that:

- **Allowed content compiles.** Every allowed construct compiles to the expected model.
- **Disallowed content is refused**, each with the file and line: raw HTML and comments, code blocks, horizontal rules, setext headings, reference definitions, footnote syntax, unknown blockquotes, bad or duplicate section IDs, and unknown front matter keys.
- **Unsafe links are refused.** `javascript:`, `data:`, `http:`, protocol-relative and unknown `https:` links fail, while registered routes and guide references are accepted.
- **Unsafe YAML is refused.** YAML aliases, duplicate keys and unknown tags (on known keys too) fail.
- **The carried-over guides are unchanged.** Every guide carried over from TypeScript renders the same panel markup as the TypeScript version did.
- **No HTML strings.** No file under `src/guides/` contains `dangerouslySetInnerHTML`.
