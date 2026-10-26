import assert from "node:assert/strict";
import { test } from "node:test";
import { readFrontMatter } from "../../src/guides/compile";
import type { GuideFrontMatter } from "../../src/guides/model";
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
