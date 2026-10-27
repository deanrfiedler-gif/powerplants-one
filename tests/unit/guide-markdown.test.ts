import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { test } from "node:test";
import { compileGuide, readFrontMatter } from "../../src/guides/compile";
import { allowedHttpsHosts, linkShape } from "../../src/guides/links";
import type { BlockNode, CompiledGuide, GuideError, GuideFrontMatter, InlineNode } from "../../src/guides/model";
import { guideStateFor } from "../../src/guides/status";

// User guide stage 1 (ADR-0065, decision 2): the front matter of a guide file is read with yaml, and the reader
// refuses anything the typed schema does not name. These tests use synthetic values only.
const path = "docs/guides/sales-leads.md";
const required = [
  "guide_key: guide.page.sales.leads",
  "entry_key: route:/sales/leads",
  "title: Leads",
  "versioning: git",
  "status: Draft",
  "owner_role: Prototype content owner",
  'source_commit: "0123456789abcdef0123456789abcdef01234567"',
];
const withoutKey = (key: string) => required.filter((line) => !line.startsWith(`${key}:`));
const file = (...lines: string[]) => ["---", ...lines, "---", "", "## Overview {#overview}", ""].join("\n");
const read = (...lines: string[]) => readFrontMatter(path, file(...lines));
const refused = (...lines: string[]) => {
  const result = read(...lines);
  assert.equal(result.front, undefined);
  assert.ok(result.errors.length > 0, "an error was expected");
  return result.errors;
};

test("front matter reads a complete guide", () => {
  const result = read(...required);
  assert.deepEqual(result.errors, []);
  assert.equal(result.front?.guide_key, "guide.page.sales.leads");
  assert.equal(result.front?.entry_key, "route:/sales/leads");
  assert.deepEqual(result.front?.also_applies_to, []);
  assert.equal(result.front?.status, "Draft");
  assert.equal(result.front?.source_commit, "0123456789abcdef0123456789abcdef01234567");
  assert.equal(result.body, "\n## Overview {#overview}\n");
  assert.equal(result.bodyLine, required.length + 3);
});

test("front matter applies the documented defaults and reads every key", () => {
  assert.deepEqual(read(...required).front, {
    guide_key: "guide.page.sales.leads",
    entry_key: "route:/sales/leads",
    also_applies_to: [],
    carried_over_from: null,
    shown_before_review: false,
    contents: {},
    list_styles: {},
    document_id: null,
    title: "Leads",
    versioning: "git",
    status: "Draft",
    issued_revision: null,
    audience: null,
    owner_role: "Prototype content owner",
    reviewer: null,
    reviewed_at: null,
    reviewed_content_hash: null,
    review_due_at: null,
    source_commit: "0123456789abcdef0123456789abcdef01234567",
    workflow_basis: null,
    runtime_evidence: null,
    resource_ids: [],
    supersedes: null,
    section_aliases: {},
    change_summary: null,
  } satisfies GuideFrontMatter);

  const all = read(
    "guide_key: guide.page.sales.leads",
    "entry_key: route:/sales/leads",
    "also_applies_to: [route:/sales/leads/new, route:/sales/leads/import]",
    "carried_over_from: src/components/shell-page-guide.tsx",
    "shown_before_review: true",
    "contents: { overview: Overview, steps: How to use }",
    "list_styles: { steps: journey }",
    "document_id: SYN-GUIDE-0001",
    "title: Leads",
    "versioning: git",
    "status: Reviewed",
    "issued_revision: SYN-REV-1",
    "audience: Sales staff",
    "owner_role: Prototype content owner",
    "reviewer: Synthetic Reviewer",
    "reviewed_at: 2026-10-23",
    "reviewed_content_hash: sha256:abc",
    "review_due_at: 2028-02-29",
    'source_commit: "0123456789abcdef0123456789abcdef01234567"',
    "workflow_basis: SYN-WORKFLOW-01",
    "runtime_evidence: SYN-EVIDENCE-01",
    "resource_ids: [SYN-RES-1, SYN-RES-2]",
    "supersedes: guide.page.sales.old",
    "section_aliases: { start: overview }",
    "change_summary: Synthetic change",
  );
  assert.deepEqual(all.errors, []);
  assert.deepEqual(all.front, {
    guide_key: "guide.page.sales.leads",
    entry_key: "route:/sales/leads",
    also_applies_to: ["route:/sales/leads/new", "route:/sales/leads/import"],
    carried_over_from: "src/components/shell-page-guide.tsx",
    shown_before_review: true,
    contents: { overview: "Overview", steps: "How to use" },
    list_styles: { steps: "journey" },
    document_id: "SYN-GUIDE-0001",
    title: "Leads",
    versioning: "git",
    status: "Reviewed",
    issued_revision: "SYN-REV-1",
    audience: "Sales staff",
    owner_role: "Prototype content owner",
    reviewer: "Synthetic Reviewer",
    reviewed_at: "2026-10-23",
    reviewed_content_hash: "sha256:abc",
    review_due_at: "2028-02-29",
    source_commit: "0123456789abcdef0123456789abcdef01234567",
    workflow_basis: "SYN-WORKFLOW-01",
    runtime_evidence: "SYN-EVIDENCE-01",
    resource_ids: ["SYN-RES-1", "SYN-RES-2"],
    supersedes: "guide.page.sales.old",
    section_aliases: { start: "overview" },
    change_summary: "Synthetic change",
  } satisfies GuideFrontMatter);
});

test("front matter refuses unknown keys, duplicates and aliases", () => {
  const unknown = refused(...required, "colour: red");
  assert.match(unknown[0].message, /colour/);

  const duplicate = refused("title: A", "title: A", ...withoutKey("title"));
  assert.equal(duplicate.length, 1);
  assert.match(duplicate[0].message, /unique/i);

  // The brief's literal case. "a" and "b" are unknown keys, so this alone could pass for the wrong reason.
  refused("a: &x 1", "b: *x");

  // The same alias on known keys, with nothing else wrong, must fail for the alias itself.
  const alias = refused("title: &x A", "owner_role: *x", ...withoutKey("title").filter((line) => !line.startsWith("owner_role:")));
  assert.equal(alias.length, 1);
  assert.match(alias[0].message, /alias/i);
  assert.equal(alias[0].line, 3);
});

test("front matter refuses unknown tags on known keys", () => {
  // yaml reports an unresolved tag only as a warning, so the reader must count warnings as refusals.
  const errors = refused("title: !!js/function x", ...withoutKey("title"));
  assert.equal(errors.length, 1);
  assert.match(errors[0].message, /tag/i);
});

test("front matter refuses __proto__, nested aliases and tags, merge keys, second documents and directives", () => {
  // Each is refused today. These cases pin that, so an update of yaml cannot start accepting one unnoticed.
  // The first line after the required keys is file line `next`.
  const next = required.length + 2;
  const cases: [string, string[], number, RegExp][] = [
    ["a __proto__ key", [...required, "__proto__: x"], next, /"__proto__" is not a front matter key/],
    ["an alias inside a list", [...required, "also_applies_to:", "  - &a route:/sales/leads/new", "  - *a"], next + 2, /alias/i],
    ["an alias used as a mapping key", [...required, "contents: { &k overview: Overview }", "section_aliases: { *k : overview }"], next + 1, /alias/i],
    ["a tag on a value inside a list", [...required, "resource_ids: [SYN-RES-1, !custom SYN-RES-2]"], next, /tag/i],
    ["a merge key", [...required, "contents:", "  <<: { overview: Overview }"], next, /"contents" must pair each section id with text/],
    ["a second document after a ... line", [...required, "...", "colour: red"], next + 1, /multiple documents/],
    // yaml reports the second document on the --- line that starts it.
    ["a second document with a %YAML directive", [...required, "...", "%YAML 1.2", "--- ", "colour: red"], next + 2, /multiple documents/],
    // A directive must be followed by a --- line, so yaml reports the line after it, where that --- is missing.
    ["a %YAML directive", ["%YAML 1.2", ...required], 3, /directives-end/],
  ];
  for (const [name, lines, line, message] of cases) {
    const result = read(...lines);
    assert.equal(result.front, undefined, name);
    assert.deepEqual(result.errors.map((error) => [error.path, error.line]), [[path, line]], name);
    assert.match(result.errors[0].message, message, name);
  }
});

test("front matter refuses route_patterns and bad values", () => {
  const routes = refused(...required, "route_patterns: [/x]");
  assert.ok(routes.some((error) => error.message.includes("use entry_key and also_applies_to")));
  const sections = refused(...required, "entry_sections: [a]");
  assert.ok(sections.some((error) => error.message.includes("use entry_key and also_applies_to")));

  const status = refused(...withoutKey("status"), "status: Approved");
  assert.match(status[0].message, /status/);
  const date = refused(...required, "reviewed_at: 23/10/2026");
  assert.match(date[0].message, /reviewed_at/);
  const notReal = refused(...required, "review_due_at: 2026-02-30");
  assert.match(notReal[0].message, /review_due_at/);
  const versioning = refused(...withoutKey("versioning"), "versioning: r01");
  assert.match(versioning[0].message, /versioning/);
});

test("front matter refuses missing required keys and wrong types", () => {
  for (const key of ["guide_key", "entry_key", "title", "versioning", "status", "owner_role", "source_commit"]) {
    const errors = refused(...withoutKey(key));
    assert.equal(errors.length, 1, key);
    assert.match(errors[0].message, new RegExp(key));
  }
  const blank = refused(...withoutKey("title"), 'title: "  "');
  assert.match(blank[0].message, /title/);
  const number = refused(...withoutKey("source_commit"), "source_commit: 1234567");
  assert.match(number[0].message, /source_commit/);

  for (const bad of [
    "reviewer: 5",
    "also_applies_to: route",
    "also_applies_to: [1]",
    "resource_ids: [a, [b]]",
    "contents: [a]",
    "contents: { a: 1 }",
    "section_aliases: { a: [b] }",
    "list_styles: { steps: numbered }",
    "list_styles: [steps]",
    "shown_before_review: yes please",
    "shown_before_review: 1",
    "carried_over_from: [a]",
  ]) {
    const errors = refused(...required, bad);
    assert.match(errors[0].message, new RegExp(bad.split(":")[0]), bad);
  }
});

test("front matter accepts null for optional text keys", () => {
  const result = read(...required, "reviewer: null", "reviewed_at: ~", "carried_over_from:");
  assert.deepEqual(result.errors, []);
  assert.equal(result.front?.reviewer, null);
  assert.equal(result.front?.reviewed_at, null);
  assert.equal(result.front?.carried_over_from, null);
});

test("front matter refuses a file without a front matter block", () => {
  const none = readFrontMatter(path, "## Overview {#overview}\n");
  assert.equal(none.front, undefined);
  assert.deepEqual(none.errors.map(({ path: p, line }) => [p, line]), [[path, 1]]);

  const open = readFrontMatter(path, ["---", ...required, "", "## Overview {#overview}", ""].join("\n"));
  assert.equal(open.front, undefined);
  assert.deepEqual(open.errors.map(({ path: p, line }) => [p, line]), [[path, 1]]);

  const empty = readFrontMatter(path, "---\n---\n");
  assert.equal(empty.front, undefined);
  assert.equal(empty.errors.length, 1);

  const list = readFrontMatter(path, "---\n- guide_key\n---\n");
  assert.equal(list.front, undefined);
  assert.equal(list.errors.length, 1);

  const text = readFrontMatter(path, "---\njust some words\n---\n");
  assert.equal(text.front, undefined);
  assert.equal(text.errors.length, 1);
});

test("front matter reports errors against the file path and file line", () => {
  // Line 1 is the opening ---, so the first YAML line is file line 2.
  const unknown = refused(...required, "colour: red");
  assert.deepEqual(unknown[0], { path, line: required.length + 2, message: unknown[0].message });

  const duplicate = refused(...required, "title: Again");
  assert.equal(duplicate[0].path, path);
  assert.equal(duplicate[0].line, required.length + 2);

  const tag = refused("title: Leads", "versioning: !!js/function x", ...withoutKey("title").filter((line) => !line.startsWith("versioning:")));
  assert.equal(tag[0].line, 3);

  const broken = readFrontMatter(path, "---\nguide_key: [a\ntitle: B\n---\n");
  assert.equal(broken.front, undefined);
  assert.ok(broken.errors.length > 0);
  assert.ok(broken.errors.every((error) => error.path === path && error.line >= 2 && error.line <= 4));
});

test("shown_before_review needs carried_over_from", () => {
  const errors = refused(...required, "shown_before_review: true");
  assert.match(errors[0].message, /carried_over_from/);

  const blank = refused(...required, "shown_before_review: true", 'carried_over_from: ""');
  assert.match(blank[0].message, /carried_over_from/);

  const allowed = read(...required, "shown_before_review: true", "carried_over_from: src/components/shell-page-guide.tsx");
  assert.deepEqual(allowed.errors, []);
  assert.equal(allowed.front?.shown_before_review, true);

  assert.deepEqual(read(...required, "shown_before_review: false").errors, []);
});

test("front matter is identical for CRLF and LF", () => {
  const lf = file(...required, "also_applies_to: [route:/sales/leads/new]");
  const crlf = lf.replace(/\n/g, "\r\n");
  assert.deepEqual(readFrontMatter(path, crlf), readFrontMatter(path, lf));

  const badLf = file(...required, "colour: red");
  assert.deepEqual(readFrontMatter(path, badLf.replace(/\n/g, "\r\n")), readFrontMatter(path, badLf));

  // marked also reads a lone CR as a line break, so a file with lone CR line endings reads as LF too: the same front
  // matter, body, bodyLine and error lines.
  assert.deepEqual(readFrontMatter(path, lf.replace(/\n/g, "\r")), readFrontMatter(path, lf));
  assert.deepEqual(readFrontMatter(path, badLf.replace(/\n/g, "\r")), readFrontMatter(path, badLf));
});

test("front matter ends at the first line that is exactly three dashes", () => {
  const text = [...["---", ...required, "---"], "## Overview {#overview}", "", "---", "not: front matter", ""].join("\n");
  const result = readFrontMatter(path, text);
  assert.deepEqual(result.errors, []);
  assert.equal(result.body, "## Overview {#overview}\n\n---\nnot: front matter\n");
  assert.equal(result.bodyLine, required.length + 3);
});

test("state follows the hash", () => {
  const base: GuideFrontMatter = {
    ...read(...required).front!,
    reviewer: "Synthetic Reviewer",
    reviewed_at: "2026-10-23",
    reviewed_content_hash: "sha256:aaa",
  };
  assert.equal(guideStateFor({ ...base, status: "Published" }, "sha256:aaa"), "Reviewed");
  assert.equal(guideStateFor({ ...base, status: "Published" }, "sha256:bbb"), "Changes awaiting review");
  assert.equal(guideStateFor({ ...base, status: "InReview" }, "sha256:aaa"), "In review");
});

test("state needs a reviewer, a review date and a hash before a guide reads as reviewed", () => {
  const base: GuideFrontMatter = {
    ...read(...required).front!,
    reviewer: "Synthetic Reviewer",
    reviewed_at: "2026-10-23",
    reviewed_content_hash: "sha256:aaa",
  };
  assert.equal(guideStateFor({ ...base, status: "Reviewed" }, "sha256:aaa"), "Reviewed");
  assert.equal(guideStateFor({ ...base, status: "Reviewed" }, "sha256:bbb"), "Changes awaiting review");
  for (const missing of ["reviewer", "reviewed_at", "reviewed_content_hash"] as const) {
    for (const status of ["Reviewed", "Published"] as const) {
      assert.equal(guideStateFor({ ...base, status, [missing]: null }, "sha256:aaa"), "Changes awaiting review", `${status} without ${missing}`);
    }
  }
  // An empty hash on both sides is not a review.
  assert.equal(guideStateFor({ ...base, status: "Published", reviewed_content_hash: "" }, ""), "Changes awaiting review");
});

test("state names the other statuses without looking at the hash", () => {
  const base: GuideFrontMatter = read(...required).front!;
  assert.equal(guideStateFor({ ...base, status: "Draft" }, "sha256:aaa"), "Draft");
  assert.equal(guideStateFor({ ...base, status: "InReview" }, "sha256:aaa"), "In review");
  assert.equal(guideStateFor({ ...base, status: "Superseded" }, "sha256:aaa"), "Superseded");
  assert.equal(guideStateFor({ ...base, status: "Withdrawn" }, "sha256:aaa"), "Withdrawn");
});

// ADR-0065, decisions 3 to 6: the body is compiled into PPO's own allowlisted model, and every link passes the URL
// policy. Anything else is refused with the file and line. Body line i of guideText(...) is file line firstBodyLine + i.
const guideText = (...body: string[]) => ["---", ...required, "---", ...body].join("\n") + "\n";
const firstBodyLine = required.length + 3;
const compile = (...body: string[]) => compileGuide(path, guideText(...body));
const compiled = (...body: string[]): CompiledGuide => {
  const result = compile(...body);
  assert.deepEqual(result.errors, []);
  assert.ok(result.guide, "a compiled guide was expected");
  return result.guide;
};
const refusals = (...body: string[]): GuideError[] => {
  const result = compile(...body);
  assert.equal(result.guide, undefined);
  assert.ok(result.errors.length > 0, "an error was expected");
  assert.ok(result.errors.every((error) => error.path === path));
  return result.errors;
};
// Every error sits on the expected body line, and at least one names the construct.
const refusedAt = (body: string[], index: number, message: RegExp, label = body.join(" / ")) => {
  const errors = refusals(...body);
  assert.deepEqual(errors.map((error) => error.line), errors.map(() => firstBodyLine + index), label);
  assert.ok(errors.some((error) => message.test(error.message)), `${label}: ${errors.map((error) => error.message).join(" | ")}`);
  return errors;
};
const text = (value: string): InlineNode => ({ kind: "text", text: value });
const paragraph = (...children: InlineNode[]): BlockNode => ({ kind: "paragraph", children });

test("compiles every allowed construct", () => {
  const guide = compiled(
    "A lead paragraph.", // 0
    "",
    "## How to use it {#how}", // 2
    "",
    "1. **Find the record**\\", // 4
    "   Open the list and choose a row.",
    "2. Check the *status*.",
    "",
    "| Key | Action |", // 8
    "| --- | --- |",
    "| `Ctrl+K` | Search |",
    "",
    "> [!WARNING]", // 12
    "> Press `Esc` to close *without* saving. Open [Deals](/sales/opportunities) next.",
    "",
    "### Shortcuts", // 15
    "",
    "- One",
    "- Two",
  );

  assert.equal(guide.path, path);
  assert.equal(guide.front.guide_key, "guide.page.sales.leads");
  assert.deepEqual(guide.lead, [paragraph(text("A lead paragraph."))]);
  assert.equal(guide.sections.length, 1);
  const [section] = guide.sections;
  assert.equal(section.id, "how");
  assert.deepEqual(section.title, [text("How to use it")]);

  const [list, , callout] = section.blocks;
  assert.ok(list.kind === "list" && list.ordered);
  const [step] = list.items[0];
  assert.ok(step.kind === "paragraph");
  assert.deepEqual(step.children.slice(0, 2).map((node) => node.kind), ["strong", "break"]);
  assert.ok(callout.kind === "callout");
  assert.equal(callout.tone, "warning");
  assert.equal(guide.references[0].href, "/sales/opportunities");

  assert.deepEqual(section.blocks, [
    {
      kind: "list",
      ordered: true,
      items: [
        [paragraph({ kind: "strong", children: [text("Find the record")] }, { kind: "break" }, text("Open the list and choose a row."))],
        [paragraph(text("Check the "), { kind: "emphasis", children: [text("status")] }, text("."))],
      ],
    },
    { kind: "table", header: [[text("Key")], [text("Action")]], rows: [[[{ kind: "code", text: "Ctrl+K" }], [text("Search")]]] },
    {
      kind: "callout",
      tone: "warning",
      children: [
        paragraph(
          text("Press "),
          { kind: "code", text: "Esc" },
          text(" to close "),
          { kind: "emphasis", children: [text("without")] },
          text(" saving. Open "),
          { kind: "link", href: "/sales/opportunities", children: [text("Deals")] },
          text(" next."),
        ),
      ],
    },
    { kind: "heading", children: [text("Shortcuts")] },
    { kind: "list", ordered: false, items: [[paragraph(text("One"))], [paragraph(text("Two"))]] },
  ] satisfies BlockNode[]);
  assert.deepEqual(guide.references, [{ href: "/sales/opportunities", line: firstBodyLine + 13 }]);
});

// Body lines that put each refused construct after a lead, a section, a list and a table.
const before = [
  "A lead paragraph",
  "over two lines.",
  "",
  "## Overview {#overview}",
  "",
  "1. First",
  "2. Second",
  "",
  "| Key | Action |",
  "| --- | --- |",
  "| `K` | Keep |",
  "",
];

test("refuses disallowed constructs with their line", () => {
  const cases: [string, string[], number, RegExp][] = [
    ["block HTML", ["<div>x</div>"], 0, /HTML/],
    ["inline HTML", ["Some text", "a <b>x</b>"], 1, /HTML/],
    ["HTML comment", ["<!-- a note -->"], 0, /comment/],
    ["inline HTML comment", ["Text <!-- a note --> here"], 0, /comment/],
    ["fenced code block", ["Text.", "", "```", "code", "```"], 2, /code block/i],
    ["indented code block", ["Text.", "", "    code"], 2, /code block/i],
    ["horizontal rule", ["***"], 0, /horizontal rule/i],
    ["setext heading", ["Title", "==="], 0, /underlined/],
    ["reference definition", ["[a]: /work"], 0, /definition/],
    ["footnote", ["Text", "see [^1]"], 1, /footnote/i],
    ["plain quote", ["> quote"], 0, /callout/],
    ["inline image", ["An image", "![alt](/image.png) here"], 1, /image/i],
    // Nested constructs keep their own line.
    ["HTML in a callout", ["> [!NOTE]", "> Text", ">", "> <div>x</div>"], 3, /HTML/],
    ["code in a list item", ["- item", "", "  ```", "  x", "  ```"], 2, /code block/i],
    ["HTML in a nested list", ["- a", "  - b", "    <span>x</span>"], 2, /HTML/],
    ["image in a table row", ["| A | B |", "| - | - |", "| x | y |", "| z | ![i](/i.png) |"], 3, /image/i],
    ["definition in a quote", ["> [!NOTE]", "> Text", ">", "> [b]: /work"], 3, /definition/],
    ["footnote split by an escape", ["Text", "see \\[^1]"], 1, /footnote/i],
    ["footnote inside strong text", ["Text **see", "[^note]**"], 1, /footnote/i],
  ];
  for (const [label, lines, index, message] of cases) refusedAt([...before, ...lines], before.length + index, message, label);

  // A footnote reference with its definition becomes a link, and is still named as a footnote.
  const footnote = refusals(...before, "see [^1]", "", "[^1]: note");
  assert.ok(footnote.some((error) => error.line === firstBodyLine + before.length && /footnote/i.test(error.message)));
  assert.ok(footnote.some((error) => error.line === firstBodyLine + before.length + 2 && /definition/.test(error.message)));

  // Every footnote in a run of text is reported on its own line.
  const footnotes = refusals("Text [^a] and", "more [^b] text.");
  assert.deepEqual(footnotes.map((error) => error.line), [firstBodyLine, firstBodyLine + 1]);

  // Code spans are literal text, so footnote syntax inside one is allowed.
  compiled("Type `[^1]` to see it.");
});

test("refuses bad headings and ids", () => {
  const lead = ["Lead.", ""];
  const one = (lines: string[], index: number, message: RegExp) => {
    const errors = refusedAt([...lead, ...lines], lead.length + index, message);
    assert.equal(errors.length, 1, lines.join(" / "));
  };
  one(["# Title"], 0, /front matter/);
  one(["#### Deep"], 0, /####/);
  one(["## Overview"], 0, /section id/);
  one(["## A {#Bad_Id}"], 0, /Bad_Id/);
  one(["## How {#how}", "", "Text.", "", "## Again {#how}"], 4, new RegExp(`"how" is already used on line ${firstBodyLine + 2}`));

  one(["## Emphasis *last {#emphasis}*"], 0, /section id/);
  one(["## {#empty}"], 0, /title/);
  one(["### Sub {#sub}"], 0, /## headings only/);
  one(["#tag {#tag}", "---"], 0, /underlined/);
  one(["- ## Listed {#listed}"], 0, /inside a list or a callout/);
  one(["> [!NOTE]", "> ### Inside"], 1, /inside a list or a callout/);

  // Both id forms are accepted when they are well formed, and the closing #s of a heading are ignored.
  const guide = compiled("## How to use it {#how-to-use-2}", "", "## Next {#next} ##");
  assert.deepEqual(guide.sections.map((section) => section.id), ["how-to-use-2", "next"]);
  assert.deepEqual(guide.sections[1].title, [text("Next")]);
});

test("refuses headings and contents labels with no visible text", () => {
  // A heading or a contents button without text has no accessible name.
  const lead = ["Lead.", ""];
  for (const [line, message] of [
    ["### ", /### heading needs text/],
    ["### ##", /### heading needs text/],
    ["### [](/work)", /### heading needs text/],
    ["### [ ](/work)", /### heading needs text/],
    ["## {#empty}", /needs a title/],
    ["## [](/work) {#empty}", /needs a title/],
    ["## [ ](/work) {#empty}", /needs a title/],
    ["## **[](/work)** {#empty}", /needs a title/],
  ] as const) {
    const errors = refusedAt([...lead, line], lead.length, message, line);
    assert.equal(errors.length, 1, line);
  }
  // Text, code and a link with text are all visible.
  const guide = compiled("## `Ctrl+K` {#keys}", "", "### [Leads](/sales/leads)", "", "Text.");
  assert.deepEqual(guide.sections[0].title, [{ kind: "code", text: "Ctrl+K" }]);

  // A contents label is the text of its button, so an empty one is refused on the contents line.
  for (const contents of [['contents: { overview: "" }'], ['contents: { overview: "   " }'], ["contents:", "  overview: Overview", '  steps: " "']]) {
    const errors = refused(...required, ...contents);
    assert.deepEqual(errors.map((error) => error.line), [required.length + 2], contents.join(" / "));
    assert.match(errors[0].message, /"contents" gives the section "(overview|steps)" an empty label/, contents.join(" / "));
  }
  assert.deepEqual(read(...required, "contents: { overview: Overview }").errors, []);
});

test("refuses unsafe links", () => {
  for (const href of [
    "javascript:alert(1)",
    "data:text/html,x",
    "http://example.com",
    "//evil.example",
    "mailto:a@b.c",
    "https://example.com",
    "/\\evil.example",
    "/x\\y",
    "work",
    "/work?tab=1",
    "/work#how",
    "guide:guide.page.work",
  ]) {
    const errors = refusals("Lead.", "", "## Links {#links}", "", "Text", `See [x](${href}).`);
    assert.equal(errors.length, 1, href);
    assert.equal(errors[0].line, firstBodyLine + 5, href);
    assert.ok(errors[0].message.includes(`"${href}"`), errors[0].message);
  }

  const guide = compiled("See [work](/work) and", "[how](guide:guide.page.work#how).");
  assert.deepEqual(guide.references, [
    { href: "/work", line: firstBodyLine },
    { href: "guide:guide.page.work#how", line: firstBodyLine + 1 },
  ]);
});

test("route links refuse square brackets, so a route pattern is never a link", () => {
  // A pattern such as /sales/opportunities/[id] would match its own register entry exactly and render as a broken link.
  for (const href of ["/sales/opportunities/[id]", "/a]b", "/a[b"]) assert.equal(linkShape(href), "refused", href);
  // A concrete record path keeps the route shape. Whether a guide may link to one is the authoring contract's rule.
  for (const href of ["/work", "/sales/opportunities/SYN-1"]) assert.equal(linkShape(href), "route", href);

  for (const href of ["/sales/opportunities/[id]", "/a]b"]) {
    const errors = refusedAt(["Text", `Open [a deal](${href}).`], 1, /is not allowed/, href);
    assert.equal(errors.length, 1, href);
    assert.ok(errors[0].message.includes(`"${href}"`), errors[0].message);
  }
});

test("keeps typography, and CRLF equals LF", () => {
  // Invisible characters are written as escapes in these tests, so an editor cannot drop or change them unseen. The
  // space in "20 °C" below is a non-breaking space (U+00A0).
  const typography = "Allow 2–3 days for “quoted” work: 4 × 2 m at 20\u00A0°C, then sign.";
  const title = "Steps 2–3: the “quoted” work";
  const cell = "2–3 “days” at 20\u00A0°C";
  const body = ["Lead.", "", "## Overview {#overview}", "", typography, "", `## ${title} {#steps}`, "", "| Key | Note |", "| --- | --- |", `| \`K\` | ${cell} |`];
  const guide = compiled(...body);
  assert.deepEqual(guide.sections[0].blocks, [paragraph(text(typography))]);
  const [kept] = guide.sections[0].blocks;
  assert.ok(kept.kind === "paragraph" && kept.children[0].kind === "text" && kept.children[0].text.includes("20\u00A0°C"), "the compiled text keeps the non-breaking space");
  // A section title and a table cell keep their characters exactly.
  assert.deepEqual(guide.sections[1].title, [text(title)]);
  assert.deepEqual(guide.sections[1].blocks, [{ kind: "table", header: [[text("Key")], [text("Note")]], rows: [[[{ kind: "code", text: "K" }], [text(cell)]]] }]);
  // So does a contents label.
  const labelled = compileGuide(path, ["---", ...required, 'contents: { steps: "Steps 2–3 “now”" }', "---", ...body].join("\n") + "\n");
  assert.deepEqual(labelled.errors, []);
  assert.deepEqual(labelled.guide?.front.contents, { steps: "Steps 2–3 “now”" });
  // Section IDs stay ASCII.
  for (const id of ["café", "2–3"]) {
    const errors = refusedAt(["Lead.", "", `## Title {#${id}}`], 2, new RegExp(`"${id}" must use lower-case letters, digits and single hyphens`), id);
    assert.equal(errors.length, 1, id);
  }

  // marked also reads a lone CR as a line break, so CRLF and lone CR line endings both compile exactly as LF.
  const lf = guideText(...body);
  const crlf = lf.replace(/\n/g, "\r\n");
  const cr = lf.replace(/\n/g, "\r");
  assert.ok(crlf.includes("\r\n"));
  assert.ok(cr.includes("\r") && !cr.includes("\n"));
  for (const [name, copy] of [["CRLF", crlf], ["CR", cr]]) {
    const result = compileGuide(path, copy);
    assert.equal(result.guide?.contentHash, guide.contentHash, name);
    assert.deepEqual(result, compileGuide(path, lf), name);
  }

  const bad = guideText(...before, "<div>x</div>", "", "Text", "see [^1]", "", "> quote", "", "- [ ] task");
  const lfErrors = compileGuide(path, bad).errors;
  assert.deepEqual(compileGuide(path, bad.replace(/\n/g, "\r\n")).errors, lfErrors);
  assert.deepEqual(compileGuide(path, bad.replace(/\n/g, "\r")).errors, lfErrors, "CR");
  const at = firstBodyLine + before.length;
  assert.deepEqual(lfErrors.map((error) => error.line), [at, at + 3, at + 5, at + 7]);
});

test("content hash ignores review fields", () => {
  const body = ["Lead.", "", "## Overview {#overview}", "", "Text."];
  const guide = compiled(...body);
  const withReview = (...extra: string[]) => {
    const result = compileGuide(path, ["---", ...required, ...extra, "---", ...body].join("\n") + "\n");
    assert.deepEqual(result.errors, []);
    return result.guide!.contentHash;
  };
  assert.equal(withReview("reviewer: Synthetic Reviewer"), guide.contentHash);
  assert.equal(withReview("reviewer: Another Reviewer", "reviewed_at: 2026-10-23", "reviewed_content_hash: abc"), guide.contentHash);
  assert.notEqual(compiled(...body.slice(0, -1), "Other text.").contentHash, guide.contentHash);
  assert.notEqual(withReview("also_applies_to: [route:/sales/leads/new]"), guide.contentHash);

  // The hash is SHA-256 hex over these keys, in this order, with the LF body.
  const expected = createHash("sha256")
    .update(
      JSON.stringify({
        guide_key: "guide.page.sales.leads",
        entry_key: "route:/sales/leads",
        also_applies_to: [],
        title: "Leads",
        section_aliases: {},
        contents: {},
        list_styles: {},
        body: body.join("\n") + "\n",
      }),
    )
    .digest("hex");
  assert.equal(guide.contentHash, expected);
});

test("holds the plain text the author typed", () => {
  // marked's lexer does not HTML-escape text; React escapes at render, so the model must hold the characters typed.
  const guide = compiled("Tom & Jerry say \"hi\", it's x < y", "", "Inline `a<b>&\"'` code and \\*stars\\* \\& more.");
  assert.deepEqual(guide.lead, [
    paragraph(text("Tom & Jerry say \"hi\", it's x < y")),
    paragraph(text("Inline "), { kind: "code", text: "a<b>&\"'" }, text(" code and *stars* & more.")),
  ]);

  // Character references would show literally here but decoded on GitHub, so they are refused.
  for (const reference of ["&amp;", "&copy;", "&#169;", "&#xA9;"]) {
    refusedAt(["Text", `A ${reference} B`], 1, /character reference/, reference);
  }
  refusedAt(["See [x](/a&amp;b)."], 0, /character reference/);
  const references = refusals("Text &amp; more", "and &copy; &reg; end.");
  assert.deepEqual(references.map((error) => error.line), [firstBodyLine, firstBodyLine + 1, firstBodyLine + 1]);
  compiled("Use `&amp;` in code, or write \\&amp; to show it.");
});

test("turns soft line breaks into spaces and keeps hard breaks", () => {
  const guide = compiled("One line", "  and the next,", "then a hard\\", "break and another  ", "end.");
  assert.deepEqual(guide.lead, [
    paragraph(text("One line and the next, then a hard"), { kind: "break" }, text("break and another"), { kind: "break" }, text("end.")),
  ]);
});

test("refuses strikethrough, task checkboxes and ordered lists that do not start at 1", () => {
  refusedAt(["Text", "a ~~gone~~ b"], 1, /strikethrough/i);
  refusedAt(["Text", "a ~gone~ b"], 1, /strikethrough/i);
  refusedAt(["- one", "- [ ] two"], 1, /checkbox/i);
  refusedAt(["- one", "- [x] two"], 1, /checkbox/i);
  const errors = refusedAt(["Text.", "", "3. three", "4. four"], 2, /start at 1/);
  assert.equal(errors.length, 1);
  refusedAt(["0. zero"], 0, /start at 1/);

  const guide = compiled("1. one", "2. two", "", "- a", "  1) nested");
  assert.deepEqual(guide.lead, [
    { kind: "list", ordered: true, items: [[paragraph(text("one"))], [paragraph(text("two"))]] },
    { kind: "list", ordered: false, items: [[paragraph(text("a")), { kind: "list", ordered: true, items: [[paragraph(text("nested"))]] }]] },
  ] satisfies BlockNode[]);
});

test("compiles callouts and refuses other quotes", () => {
  const guide = compiled(
    "> [!NOTE]",
    "> First line",
    "> second line.",
    "",
    "> [!IMPORTANT]",
    ">",
    "> A separate paragraph.",
    ">",
    "> - and a list",
  );
  assert.deepEqual(guide.lead, [
    { kind: "callout", tone: "note", children: [paragraph(text("First line second line."))] },
    {
      kind: "callout",
      tone: "important",
      children: [paragraph(text("A separate paragraph.")), { kind: "list", ordered: false, items: [[paragraph(text("and a list"))]] }],
    },
  ] satisfies BlockNode[]);

  refusedAt(["Text", "", "> [!NOTE]", "> Text", ">", "> > nested"], 5, /another quote/);
  // The problems inside a refused quote are reported too.
  const inside = refusedAt(["> [!NOTE]", "> Text", ">", "> > [a]: /work"], 3, /another quote/);
  assert.ok(inside.some((error) => /definition/.test(error.message)));
  refusedAt(["> plain <b>quote</b>"], 0, /HTML/);
  refusedAt(["> [!note]", "> lower case"], 0, /callout/);
  refusedAt(["> [!TIP]", "> unknown tone"], 0, /callout/);
  refusedAt(["> [!WARNING]"], 0, /no text/);
  refusedAt(["Text", "> \\[!NOTE]", "> escaped"], 1, /callout/);
});

test("a callout marker must stand alone on its line", () => {
  // ADR-0065, decision 5: the quote's first line is [!NOTE], [!WARNING] or [!IMPORTANT] and nothing else. GitHub shows
  // a marker with text after it on the same line as a plain quote, so the compiler refuses it as one.
  for (const line of ["> [!NOTE] text", "> [!NOTE]x", "> [!WARNING] Check first.", "> [!IMPORTANT]   then text"]) {
    const errors = refusedAt(["Text", "", line, "> More."], 2, /must be a callout/, line);
    assert.equal(errors.length, 1, line);
  }

  // The marker alone on its line, followed by text on the next line or in a separate paragraph, still compiles, and
  // so does a marker followed only by spaces or a tab.
  const guide = compiled(
    "> [!NOTE]",
    "> Next line.",
    "",
    "> [!WARNING]",
    ">",
    "> Separate paragraph.",
    "",
    "> [!IMPORTANT]   ",
    "> After trailing spaces.",
    "",
    "> [!NOTE]\t",
    "> After a tab.",
  );
  assert.deepEqual(guide.lead, [
    { kind: "callout", tone: "note", children: [paragraph(text("Next line."))] },
    { kind: "callout", tone: "warning", children: [paragraph(text("Separate paragraph."))] },
    { kind: "callout", tone: "important", children: [paragraph(text("After trailing spaces."))] },
    { kind: "callout", tone: "note", children: [paragraph(text("After a tab."))] },
  ] satisfies BlockNode[]);
});

test("lists every link with its own line", () => {
  const guide = compiled(
    "Lead [a](/a).", // 0
    "",
    "## Section [b](/b) {#section}", // 2
    "",
    "- [c](/c)", // 4
    "",
    "| Link | Note |", // 6
    "| --- | --- |",
    "| [d](/d) | x |",
    "| y | [e](/e) |", // 9
    "",
    "> [!NOTE]", // 11
    "> Text",
    "> **[f](guide:guide.page.other#top)**",
    "",
    "### Sub [g](/g)", // 15
  );
  assert.deepEqual(guide.references, [
    { href: "/a", line: firstBodyLine },
    { href: "/b", line: firstBodyLine + 2 },
    { href: "/c", line: firstBodyLine + 4 },
    { href: "/d", line: firstBodyLine + 8 },
    { href: "/e", line: firstBodyLine + 9 },
    { href: "guide:guide.page.other#top", line: firstBodyLine + 13 },
    { href: "/g", line: firstBodyLine + 15 },
  ]);
  assert.deepEqual(guide.sections[0].title, [text("Section "), { kind: "link", href: "/b", children: [text("b")] }]);
});

test("refuses link titles and GFM autolinks", () => {
  refusedAt(["Text", 'See [x](/work "Work").'], 1, /title/);
  for (const [line, href] of [
    ["Visit https://example.com today.", "https://example.com"],
    ["Visit www.example.com today.", "http://www.example.com"],
    ["Write to someone@example.com today.", "mailto:someone@example.com"],
    ["Visit <https://example.com> today.", "https://example.com"],
  ]) {
    const errors = refusedAt(["Text", line], 1, /link target/, line);
    assert.ok(errors[0].message.includes(`"${href}"`), errors[0].message);
  }
});

test("reports body errors even when the front matter fails", () => {
  const other = "docs/guides/other.md";
  const result = compileGuide(other, ["---", "title: A", "colour: red", "---", "", "<div>x</div>", "", "## Overview"].join("\n"));
  assert.equal(result.guide, undefined);
  assert.ok(result.errors.every((error) => error.path === other));
  assert.deepEqual(
    result.errors.map((error) => error.line),
    [...result.errors.map((error) => error.line)].sort((a, b) => a - b),
  );
  assert.ok(result.errors.some((error) => error.line === 3 && /colour/.test(error.message)));
  assert.ok(result.errors.some((error) => error.line === 6 && /HTML/.test(error.message)));
  assert.ok(result.errors.some((error) => error.line === 8 && /section id/.test(error.message)));

  // Without a closing ---, there is no body to compile: only the front matter error is reported.
  const open = compileGuide(other, ["---", ...required, "", "***", ""].join("\n"));
  assert.equal(open.guide, undefined);
  assert.deepEqual(open.errors.map((error) => error.line), [1]);
});

test("link policy accepts routes and guide links and refuses everything else", () => {
  assert.deepEqual(allowedHttpsHosts, []);
  for (const href of ["/", "/work", "/sales/opportunities", "/sales/leads/new", "/a-b/c_d.e"]) assert.equal(linkShape(href), "route", href);
  for (const href of ["guide:guide.page.work#how", "guide:guide.page.sales.leads#how-to-use-2"]) assert.equal(linkShape(href), "guide", href);
  for (const href of [
    "",
    "work",
    " /work",
    "/work ",
    "/a b",
    "/a?b=1",
    "/a#b",
    "//evil.example",
    "/\\evil.example",
    "/x\\y",
    "\\\\evil.example",
    "/\t/evil.example",
    "/a\u0000b",
    "/a\u200Bb",
    "javascript:alert(1)",
    "JavaScript:alert(1)",
    "data:text/html,x",
    "vbscript:x",
    "file:///etc/hosts",
    "http://example.com",
    "mailto:a@b.c",
    "https://example.com",
    "guide:guide.page.work",
    "guide:Guide.Page#how",
    "guide:guide.page.work#How",
    "guide:guide.page.work#a--b",
  ]) {
    assert.equal(linkShape(href), "refused", JSON.stringify(href));
  }
});

test("link policy accepts https only for a listed host", () => {
  const hosts = ["help.example"];
  for (const href of ["https://help.example/", "https://help.example/a/b?c=1#d", "https://HELP.example/x", "https://help.example:8443/x"]) {
    assert.equal(linkShape(href, hosts), "https", href);
  }
  for (const href of [
    "https://user@help.example/",
    "https://user:secret@help.example/",
    "HTTPS://help.example/",
    "https:help.example",
    "https:/help.example",
    "https://help.example.evil.example/",
    "https://evil.example/#help.example",
    "https://evil.example\\@help.example/",
    "https://help.example /",
    "https://help.example/\u0007",
    "https://help.example./",
    "http://help.example/",
  ]) {
    assert.equal(linkShape(href, hosts), "refused", JSON.stringify(href));
  }
  // The reviewed list is empty, so no https link is accepted without a reviewed change.
  assert.equal(linkShape("https://help.example/"), "refused");
});
