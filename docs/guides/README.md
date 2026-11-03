# User guides: authoring contract

<!-- versioning: git; committed history is authoritative -->

**Owner:** Dean Fiedler. **Applies to:** every page guide under `docs/guides/`. **Rules from:** [ADR-0065](../decisions/ADR-0065-guide-markdown-parser.md) and the [user guide direction](../decisions/user-guide-direction.md) (PPO-USER-GUIDE-PROP). This file states the rules once; the guide compiler (`src/guides/compile.ts`) and library (`src/guides/library.ts`) enforce them. Where this file and the code disagree, the code is what runs: correct this file in the same pull request.

A page guide is the help that opens from the information icon in the application header. Each guide is one Markdown file with its metadata in front matter. Writing or editing a guide never grants review or publication: a guide is shown to general users only under the visibility rule below.

## Contents

1. Where a guide lives
2. Front matter
3. From the page guide template
4. Statuses and who changes them
5. Who sees a guide
6. The body: allowed Markdown
7. How the panel draws a guide
8. Links
9. Callouts
10. What is refused
11. Add a guide for a new page
12. Record a review
13. Retire a carried-over guide
14. Check your work

## 1. Where a guide lives

- **New guides** go in `docs/guides/pages/`, one file per guide, named after its guide key with `.md` added: the guide for the key `guide.route-supply-stock` is `docs/guides/pages/guide.route-supply-stock.md`.
- **Every file in `docs/guides/pages/` is a guide.** A file there that cannot be read as a guide, or that does not end in `.md`, is an error and fails the build.
- **The CRM Deals guide keeps its path**, [`crm-deals.md`](crm-deals.md), because issued r01 records link to it.
- **Elsewhere in `docs/guides/`**, a Markdown file is read as a guide when its front matter declares a guide key, or when any of its first 40 lines looks like a guide key line. That is why this README keeps its front matter examples further down, inside code blocks: it is not a guide, and the library reports nothing for it. The [table of contents](user-guide-contents.md) is not a guide either.
- **Line endings.** CRLF and LF files compile to the same guide, hash and line numbers.

## 2. Front matter

The file starts with a line of `---`, then one key per line written `key: value`, then another line of `---`. The front matter is read as YAML (core schema). Every YAML error or warning is a refusal, and so are duplicate keys, aliases (`*name`) and unknown tags such as `!!js/function`.

Quote a value that holds `[`, `]`, `: ` or ` #`, or that YAML would read as a number, true, false or null. Lists and maps may be written on one line, as the examples show. The order of keys does not matter.

The example below is the front matter of a carried-over guide, abridged: the real file's `also_applies_to` also lists `route:/estimating/estimates/[id]/sources`. A new guide normally has fewer keys.

```yaml
---
guide_key: guide.route-estimating-cost-sources
entry_key: route:/estimating/cost-sources
also_applies_to: ["route:/estimating/cost-sources/[id]", "route:/estimating/cost-sources/new"]
carried_over_from: src/components/cost-sources-guide.ts
title: Cost sources and reviewed estimate refresh
status: InReview
shown_before_review: true
versioning: git
owner_role: "Prototype content owner: Dean Fiedler"
source_commit: b95d335987ee3b8f2c9f19509e7832c5200db67d
contents: { overview: "Overview", how: "How to use", journey: "Journey map" }
list_styles: { journey: journey }
---
```

**Required keys.** A guide without any of these is refused.

| Key | Value | Rule |
|---|---|---|
| `guide_key` | Text | The stable key of the guide. It must equal the `guide_key` that the [design register](../design/development/register.json) gives the `entry_key` entry. Every guide needs its own key, and a key lives in a Markdown guide or in `guides.json`, never both |
| `entry_key` | Text | The register entry the guide belongs to, such as `route:/supply/stock` or `system:shell`. It must be in the register |
| `title` | Text | The heading of the guide in the panel |
| `status` | One of the six statuses | See section 4 |
| `versioning` | `git` | A guide's history is its Git history, not a revision label |
| `owner_role` | Text | The accountable content owner, such as `"Prototype content owner: Dean Fiedler"` |
| `source_commit` | Text | The commit whose application source the guide describes. Quote it if it is all digits |

**Optional keys.** Leave a key out rather than writing an empty value, unless the table says otherwise.

| Key | Value | Rule |
|---|---|---|
| `also_applies_to` | List of entry keys | Other register entries the guide covers, such as a record page beside its list. Each must be in the register, and no entry may be claimed by two guides |
| `shown_before_review` | `true` or `false` | Only for a carried-over guide. When true, `carried_over_from` is required |
| `carried_over_from` | Text | The retired TypeScript module the guide was carried over from. It must be one of the seven paths in `carriedOverSources` in `src/guides/library.ts`; no new value is ever added |
| `contents` | Map of section ID to button label | The contents buttons of the panel, in this order. Each ID must be a section of the guide, and a label may not be empty or only spaces. See section 7 |
| `list_styles` | Map of section ID to `journey` | Draws the numbered steps of that section as the journey band. `journey` is the only style |
| `section_aliases` | Map of old section ID to current section ID | Keeps existing `guide:` links to a renamed section passing the link check: a `guide:` link may name an alias in place of a section ID. Each target must be a section of the guide |
| `document_id` | Text | Only for a guide registered in the [document register](../standards/document-register.csv), such as `PPO-HELP-CRM`. It must match the register row |
| `issued_revision` | Text | Only for a separately issued, frozen copy of a guide. Never a counter on the working file |
| `audience` | Text | Who the guide is for, and any restriction. The repository is public, so nothing restricted goes in a guide |
| `workflow_basis` | Text | The workflow, contract or capability baseline the guide was written from |
| `runtime_evidence` | Text | What was run against the application, or `Not run.` with the reason |
| `resource_ids` | List of text | Verified SOP, template or reference IDs. An empty list is acceptable. SOP links come from resource records, never from guide text |
| `change_summary` | Text | What users need to relearn, and why |
| `supersedes` | Text | The guide or issued revision this one replaces |
| `reviewer` | Text | Review evidence: the person who reviewed the guide. See section 12 |
| `reviewed_at` | Date, `YYYY-MM-DD` | Review evidence: the date of the review. It must be a real date |
| `reviewed_content_hash` | Text | Review evidence: the content hash of the guide as reviewed |
| `review_due_at` | Date, `YYYY-MM-DD` | An agreed review date, or leave it out. Never invent an expiry rule |

Any other key is refused, naming the file and line.

## 3. From the page guide template

The [page guide template](../standards/page-guide-template.md) (PPO-HELP-TPL) is still the guide to what a page guide says: its user sections, from Purpose and outcome to Guide review and feedback, and its author evidence checklist. Its author metadata becomes the front matter above, with these changes:

- **`route_patterns` becomes `entry_key` and `also_applies_to`.** A guide names register entries, not routes; the register maps each entry to its route. `entry_key` is the register entry whose `guide_key` equals the guide's own `guide_key`, and the library refuses any other. Every other entry the guide covers goes in `also_applies_to`. Exact routes still win over dynamic patterns: `/sales/opportunities/new` never shows the guide of `/sales/opportunities/[id]`.
- **`entry_sections` becomes the section IDs in the headings**, as `## Title {#section-id}` (section 6). Retired section IDs go in `section_aliases`, so existing `guide:` links to them still pass the check.
- **`route_patterns` and `entry_sections` are refused** if they appear, with a message saying to use `entry_key` and `also_applies_to`.
- **`workflow_basis` is one piece of text.** The JSON drafts in `guides.json` hold it as a list; a Markdown guide does not.
- **The `USER GUIDE START` and `USER GUIDE END` markers are not used in Markdown guides.** The whole body after the front matter is the article. HTML comments are refused, so the markers cannot be copied in.
- **The template's `#` title line is not used.** The title comes from `title` in the front matter, and a `#` heading is refused.
- **The author evidence checklist stays out of the guide.** Record it in the pull request.

## 4. Statuses and who changes them

A guide has exactly one of six statuses, spelled as shown. The status records an intention; for Reviewed and Published, the review evidence (section 12) is what counts.

| Status | Meaning | Who sets it | Seen by general users |
|---|---|---|---|
| `Draft` | Being written. `npm run studio:sync` creates new stubs as Draft | The author (Claude or Dean) | No |
| `InReview` | Ready for the content owner's review | The author, in the pull request that offers it for review | No, except a carried-over guide (section 5) |
| `Reviewed` | Checked against a running release by the content owner, with the evidence recorded | Dean, as content owner, after a genuine review | No, except a carried-over guide (section 5) |
| `Published` | Released to all users | Dean, after the review and, before operational use, the module's business reviewer's sign-off | Yes, while its review evidence matches its content |
| `Superseded` | Replaced by a newer guide; kept for history | Dean | No |
| `Withdrawn` | Must no longer be followed | Dean | No |

- An edit never grants review, and a passing check is not a review.
- A Reviewed or Published guide whose content changes after the review reads **Changes awaiting review** in the design workspace, and a Published one is hidden again until it is reviewed again.
- Two guides can never claim the same entry, whatever their status. A Superseded or Withdrawn guide keeps its claim, and its pages show the "being prepared" fallback.
- The JSON drafts in `guides.json` accept the same six statuses.

## 5. Who sees a guide

General users see a guide only when one of these holds:

1. it is `Published`, and its `reviewer`, `reviewed_at` and `reviewed_content_hash` are recorded and the hash matches the current content; or
2. it was carried over from a TypeScript guide that users already saw: it has `shown_before_review: true` and a `carried_over_from` source, and it is `InReview` or `Reviewed`.

Every other page shows the existing fallback, "The detailed … guide is being prepared." `Draft`, `Superseded` and `Withdrawn` guides are never shown, whatever their flags. The build writes only the visible guides to `.ppo-guides/released.json`, and the production server applies the same rule again when it reads that file.

Users with design-workspace access also see every guide, whatever its status, in the **Development draft guide for this page** section of the panel and in the design workspace.

## 6. The body: allowed Markdown

Everything after the closing `---` is the body. Text before the first `##` heading is the lead, shown under the title. Write in Australian English and type characters as they are: en dashes (–), curly quotes (“ ”), ×, ° and non-breaking spaces all survive. Section IDs stay plain ASCII.

**Section heading.** Every `##` heading ends with its section ID in braces. The ID uses lower-case letters, digits and single hyphens, and is unique in the guide.

```markdown
## How to use it {#how}
```

**Sub-heading.** `###` has no ID.

```markdown
### Read the observation basis
```

**Paragraph.** Lines next to each other join into one paragraph; a blank line starts the next.

```markdown
Review company, warehouse, bin, item and unit. Unknown values remain unknown, never zero.
```

**Line break.** End the line with a backslash (or two spaces) to break it inside a paragraph.

```markdown
**Find the record**\
Search and completeness filters remain in the URL.
```

**Bold and italic.**

```markdown
Recording **Won** does not create an order. The record is *saved*, not sent.
```

**Inline code**, for keys and short exact values.

```markdown
Press `Escape` to close the guide.
```

**Bulleted list.** Lists may hold other lists.

```markdown
- the deal owner;
- the next activity and its due date.
```

**Numbered list.** It must start at 1.

```markdown
1. Open **Deals**.
2. Select **Deal**.
```

**Table.** A pipe table with a header row. Column alignment is ignored.

```markdown
| What you see | What it means |
|---|---|
| Due date needed | The next activity has no due date |
```

**Link.** See section 8.

```markdown
Open [Leads](/sales/leads), or read [the five stages](guide:guide.page.sales.opportunities#purpose).
```

**Callout.** See section 9.

```markdown
> [!NOTE]
> Synthetic records only.
```

Lists, callouts, bold and italic text and links may nest up to 8 levels deep; deeper nesting is refused.

## 7. How the panel draws a guide

The panel draws the compiled guide with React, never from an HTML string. A few patterns get the accepted panel's own layout. The carried-over guides use all of them, and a test proves they draw the same markup as the retired TypeScript guides did.

- **Contents buttons (`contents`).** With a `contents` map, the panel shows one button for each listed section, in the map's order, with the map's label, and only those sections can be jumped to. Without it, every section gets a button labelled with its title.
- **Journey band (`list_styles`).** A section mapped to `journey` draws its numbered steps as the journey band.
- **Feature grid.** When everything from a section's first `###` heading to its end is sub-headings each followed by exactly one paragraph, they draw as a grid of cards. Text before the first `###` heading stays above the grid. Anything else after it, such as a sub-heading with two paragraphs or a list, turns the grid off for that section.
- **Numbered steps.** A numbered list whose every item starts with a bold title and a line break draws as numbered steps, the title as the step heading and the rest as its text:

  ```markdown
  1. **Find the record**\
     Search and completeness filters remain in the URL.
  2. **Save deliberately**\
     Saved is shown only after a server receipt.
  ```

- **Shortcut list.** A two-column table whose every first cell is one inline code span draws as a list of keys. Its header row is not shown:

  ```markdown
  | Key | Action |
  |---|---|
  | `Escape` | Close the form or page guide. |
  ```

- **Boundary box.** A `[!NOTE]` callout holding one paragraph draws as the panel's note box. Other callouts draw as a box with their tone.
- **Everything else** draws as plain paragraphs, lists and tables. A `##` heading draws as the section heading, and `###` as a sub-heading.

## 8. Links

A link is its text in square brackets followed by its target in round brackets, and the target must have one of three shapes:

- **A page:** a path starting with a single `/` that matches a registered route, such as `/sales/leads`. No query (`?`), fragment (`#`), backslash, square brackets or `.` and `..` segments. A dynamic pattern such as `/sales/opportunities/[id]` is not a link: link to the list page instead.
- **A section of a guide:** `guide:<guide key>#<section ID>`, such as `guide:guide.page.sales.opportunities#purpose`. The guide must exist, and the section must be one of its section IDs or `section_aliases`. The build checks the link, but the released page panel shows a `guide:` link as plain text. Only the design workspace reader opens it, and it opens the target guide at the top, not at the section.
- **An approved website:** `https:` to a host on `allowedHttpsHosts` in `src/guides/links.ts`. The list is empty, so no web link is accepted today; adding a host is a reviewed change. Such a link opens in a new tab and says so.

Everything else is refused: `http:`, `mailto:`, `javascript:`, `data:`, `file:`, protocol-relative `//` addresses, link titles (`[text](/path "title")`), spaces or invisible characters in a target, and character references such as `&amp;`. A bare web or email address in the text becomes a link, so it is refused too. Write it as inline code if it must appear.

The library checks every page link against the register and every guide link against the guides. If a route is removed while a guide still links to it, `npm run studio:check` and the build fail, naming the file and line. The panel checks each link again before it draws it.

## 9. Callouts

A callout is a quote whose first line is exactly one of `[!NOTE]`, `[!WARNING]` or `[!IMPORTANT]`, alone on its line. The text goes on the next lines:

```markdown
> [!WARNING]
> Recording **Won** does not create an order in the finance system.
```

A quote without a marker, a marker followed by text on the same line, a callout with no text, and a quote inside a callout are all refused.

## 10. What is refused

The compiler and the library refuse each of these with the file, the line and a message saying what to write instead, and both `npm run studio:check` and the build fail. Nothing is silently dropped. One exception: a guide key present in both a Markdown guide and `guides.json` is a catalogue error that only `npm run studio:check` reports, without a file or line; the build does not check it.

- **HTML**, inline or as a block, including HTML comments.
- **Code blocks**, fenced or indented by four spaces. Use inline code. (The code blocks in this README are allowed only because it is not a guide.)
- **Horizontal rules** (`---`, `***` or `___` on a line of their own) in the body. Start a new `##` section instead.
- **Headings** written `#`, `####` or deeper, underlined with `=` or `-`, placed inside a list or callout, a `##` heading without a title or ID, a `###` heading with an ID, and a duplicate or badly formed section ID.
- **Images.** Refused until the private image store exists.
- **Reference-style links** and their definitions (`[label]: target`), and **footnotes** (`[^1]`).
- **Strikethrough** (`~~text~~`) and **task list checkboxes** (`[ ]`, `[x]`).
- **Plain quotes**, nested quotes and empty callouts (section 9).
- **A numbered list that starts at any number but 1.**
- **Links** outside the policy in section 8.
- **Character references** such as `&amp;` or `&#169;`: type the character itself.
- **Nesting** deeper than 8 levels.
- **Front matter problems:** an unknown, missing or misspelt key, a wrong value type, a duplicate key, an alias, a tag, a status outside the six, `versioning` other than `git`, a date that is not real, `shown_before_review: true` without `carried_over_from`, and a `contents`, `list_styles` or `section_aliases` entry that names a section the guide does not have.
- **Register problems:** an `entry_key` or `also_applies_to` entry that is not registered, a `guide_key` that does not match the register, a guide key used twice, an entry claimed by two guides, and a guide key present in both Markdown and `guides.json` (`studio:check` only, as above).

## 11. Add a guide for a new page

1. **Register the page.** For a new route, run `npm run studio:sync`. It adds the register entry and its design brief, and writes a Draft stub at `docs/guides/pages/<guide key>.md` with three sections (`purpose`, `quick-start` and `recovery`). It never overwrites a guide file that already exists.
2. **Replace the stub.** Write the page's guide from the template's user sections, using the exact on-screen labels, synthetic `SYN-` examples and the section IDs you want to keep. Describe what the application does at `source_commit`, not what a design proposes. Put "No approved SOP linked yet." in the resources section when there is none.
3. **Cover related pages.** Add record and creation pages that share the guide to `also_applies_to`.
4. **Move an existing draft.** If the entry already has a JSON draft in `guides.json` under the same key, remove that draft in the same change: a key may live in only one source.
5. **Set the status.** Leave it `Draft` while writing; set `InReview` when it is ready for Dean's review. A new guide is not shown to general users until it is `Published` (section 5).
6. **Check it** (section 14) and open the pull request with the code, guide and design changes together.

## 12. Record a review

Only a genuine review supplies the evidence: `reviewer`, `reviewed_at` and `reviewed_content_hash`. The hash is SHA-256 over the guide's binding keys, title, section maps and body, so recording the review fields does not change it. Print it with:

```sh
node --import tsx -e 'import("./src/guides/compile.ts").then(({ compileGuide }) => { const path = process.argv[1]; const result = compileGuide(path, require("node:fs").readFileSync(path, "utf8")); console.log(result.guide?.contentHash ?? result.errors); })' docs/guides/pages/guide.page.work.md
```

Record the hash of the text that was reviewed, in the same change as the status. Any later change to the body, title or binding keys makes the guide read **Changes awaiting review** until it is reviewed again. Never copy a hash, reviewer or date without the review it records.

## 13. Retire a carried-over guide

The twenty guides in `docs/guides/pages/` with `carried_over_from` were carried over unchanged from the TypeScript page guides in stage 1. They are shown before review only so that users keep the help they already had. A carried-over guide leaves that state when its rewrite is reviewed:

1. Rewrite the guide in place, keeping its `guide_key`, `entry_key` and file name.
2. In the same change, remove `carried_over_from` and `shown_before_review`, and delete the guide's line from `tests/unit/fixtures/released-guide-markup.json`. The parity test compares only carried-over guides, and fails on a fixture line that no longer belongs to one.
3. Without those two keys the guide is hidden until it is `Published` with its review evidence. To avoid a gap for users, record the review and publish it in the same change; otherwise its pages show the "being prepared" fallback until it is published.

## 14. Check your work

```sh
npm run studio:check
node --import tsx --test tests/unit/guide-library.test.ts tests/unit/guide-parity.test.ts
npm run build
```

`npm run studio:check` and the build compile every guide and fail on any error, naming the file and line. The build prints how many guides were compiled and released. Then open the page locally and read the guide in the panel. A passing check shows the guide is well formed; it does not review its content.
