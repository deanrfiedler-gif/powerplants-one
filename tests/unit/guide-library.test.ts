import assert from "node:assert/strict";
import { mkdir, mkdtemp, rm, utimes, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { test, type TestContext } from "node:test";
import { readMaster } from "../../src/development/catalog";
import { matchEntry, type Entry } from "../../src/development/model";
import { compileGuide } from "../../src/guides/compile";
import {
  awaitingRewrite,
  carriedOverSources,
  readGuideLibrary,
  releasedFile,
  releasedGuideLibrary,
  type GuideLibrary,
} from "../../src/guides/library";
import type { CompiledGuide } from "../../src/guides/model";
import { guideForPath, releasedGuides, routeForPath } from "../../src/guides/released";

// User guide stage 1 (ADR-0065, decision 8): the library finds the guide files, checks them against the
// development register and against each other, and decides which guides general users may see. These tests use a
// temporary root, an in-memory register and synthetic values only.
const environment = process.env as Record<string, string | undefined>;

async function withNodeEnv<T>(value: string | undefined, run: () => Promise<T>): Promise<T> {
  const before = environment.NODE_ENV;
  if (value === undefined) delete environment.NODE_ENV;
  else environment.NODE_ENV = value;
  try {
    return await run();
  } finally {
    if (before === undefined) delete environment.NODE_ENV;
    else environment.NODE_ENV = before;
  }
}

// Replaces console.error for one call and hands back what it was given, so test output stays clean.
async function capturingErrors<T>(run: () => Promise<T>): Promise<{ result: T; logged: unknown[][] }> {
  const original = console.error;
  const logged: unknown[][] = [];
  console.error = (...args: unknown[]) => {
    logged.push(args);
  };
  try {
    return { result: await run(), logged };
  } finally {
    console.error = original;
  }
}

const entry = (key: string, path: string | null, guideKey: string | null, kind: Entry["kind"] = "route"): Entry => ({
  key,
  title: `Synthetic ${key}`,
  kind,
  module: "ZZ",
  summary: "A synthetic register entry.",
  path,
  source_paths: [],
  guide_key: guideKey,
  design_path: "docs/design/development/pages/synthetic.md",
  html_path: null,
  image_paths: [],
  dependencies: [],
  scope_status: "built",
  visual_status: "Not recorded",
  functional_status: "Not recorded",
  deployment_status: "Not verified",
  review_fingerprint: null,
  reviewed_at: null,
  reviewer: null,
  owner: "Synthetic owner",
  build_rank: null,
  related_keys: [],
});

const entries: Entry[] = [
  entry("route:/sales/leads", "/sales/leads", "guide.page.sales.leads"),
  entry("route:/sales/opportunities/new", "/sales/opportunities/new", "guide.page.sales.opportunities.new"),
  entry("route:/sales/opportunities/[id]", "/sales/opportunities/[id]", "guide.page.sales.opportunities.id"),
  entry("route:/a", "/a", "guide.page.a"),
  entry("route:/b", "/b", "guide.page.b"),
  entry("scope:ZZ-01", "/zz", "guide.zz.01", "scope"),
  entry("system:shell", null, "guide.shell", "system"),
  entry("system:theme", null, null, "system"),
];

type Spec = { guide_key: string; entry_key: string; status?: string; front?: string[]; body?: string[] };
const defaultBody = ["## Overview {#overview}", "", "Synthetic text."];
const guideText = ({ guide_key, entry_key, status = "Draft", front = [], body = defaultBody }: Spec) =>
  [
    "---",
    `guide_key: ${guide_key}`,
    `entry_key: ${entry_key}`,
    "title: Synthetic guide",
    "versioning: git",
    `status: ${status}`,
    "owner_role: Prototype content owner",
    'source_commit: "0123456789abcdef0123456789abcdef01234567"',
    ...front,
    "---",
    "",
    ...body,
    "",
  ].join("\n");

// The 1-based line of the first line that starts with `start`.
const lineOf = (text: string, start: string): number => {
  const index = text.split("\n").findIndex((line) => line.startsWith(start));
  assert.ok(index >= 0, `no line starts with ${start}`);
  return index + 1;
};

// A guide users see before its review: carried over from a TypeScript guide and shown while it is in review.
const carried = ["shown_before_review: true", `carried_over_from: ${carriedOverSources[0]}`];
const shown = (spec: Omit<Spec, "status">): Spec => ({ ...spec, status: "InReview", front: [...(spec.front ?? []), ...carried] });

const compiled = (spec: Spec, path = "docs/guides/synthetic.md"): CompiledGuide => {
  const result = compileGuide(path, guideText(spec));
  assert.deepEqual(result.errors, []);
  assert.ok(result.guide, "a compiled guide was expected");
  return result.guide;
};
const library = (...guides: CompiledGuide[]): GuideLibrary => ({ guides, errors: [] });

async function makeRoot(t: TestContext, files: Record<string, string> = {}): Promise<string> {
  const root = await mkdtemp(join(tmpdir(), "ppo-guide-library-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  await writeFiles(root, files);
  return root;
}
async function writeFiles(root: string, files: Record<string, string>): Promise<void> {
  for (const [path, text] of Object.entries(files)) {
    await mkdir(dirname(join(root, path)), { recursive: true });
    await writeFile(join(root, path), text);
  }
}

const messages = (errors: { message: string }[]) => errors.map((error) => error.message).join("\n");

test("binds guides to register entries and refuses mismatches", async (t) => {
  const wrong = guideText({ guide_key: "guide.page.wrong", entry_key: "route:/sales/opportunities/new" });
  const unknown = guideText({ guide_key: "guide.page.nowhere", entry_key: "route:/nowhere" });
  const unkeyed = guideText({ guide_key: "guide.theme", entry_key: "system:theme" });
  const root = await makeRoot(t, {
    "docs/guides/good.md": guideText({ guide_key: "guide.page.sales.leads", entry_key: "route:/sales/leads" }),
    "docs/guides/wrong.md": wrong,
    "docs/guides/unknown.md": unknown,
    "docs/guides/unkeyed.md": unkeyed,
  });
  const result = await readGuideLibrary(root, entries);

  assert.deepEqual(result.guides.map((guide) => guide.front.guide_key), ["guide.page.sales.leads"]);
  assert.deepEqual(result.guides[0].path, "docs/guides/good.md");
  assert.deepEqual(
    result.errors.map((error) => [error.path, error.line]),
    [
      ["docs/guides/unkeyed.md", lineOf(unkeyed, "guide_key:")],
      ["docs/guides/unknown.md", lineOf(unknown, "entry_key:")],
      ["docs/guides/wrong.md", lineOf(wrong, "guide_key:")],
    ],
  );
  const [unkeyedError, unknownError, wrongError] = result.errors;
  assert.match(unkeyedError.message, /system:theme.*no guide_key/);
  assert.match(unknownError.message, /"route:\/nowhere".*not in the development register/);
  assert.match(wrongError.message, /"guide\.page\.wrong".*"guide\.page\.sales\.opportunities\.new"/);
});

test("static route wins over dynamic", async (t) => {
  const root = await makeRoot(t, {
    "docs/guides/new.md": guideText(shown({ guide_key: "guide.page.sales.opportunities.new", entry_key: "route:/sales/opportunities/new" })),
    "docs/guides/id.md": guideText(shown({ guide_key: "guide.page.sales.opportunities.id", entry_key: "route:/sales/opportunities/[id]" })),
  });
  const result = await readGuideLibrary(root, entries);
  assert.deepEqual(result.errors, []);
  const released = releasedGuides(result, entries);

  assert.equal(guideForPath(released, "/sales/opportunities/new")?.front.guide_key, "guide.page.sales.opportunities.new");
  assert.equal(
    guideForPath(released, "/sales/opportunities/0d0c3b1e-5f4a-4c7e-9a31-000000000001")?.front.guide_key,
    "guide.page.sales.opportunities.id",
  );
  assert.equal(guideForPath(released, "/sales/opportunities"), null);
  assert.equal(guideForPath(released, "/sales/opportunities/"), null);
});

test("a hidden static route does not fall through to a dynamic route", () => {
  const hidden = compiled({ guide_key: "guide.page.sales.opportunities.new", entry_key: "route:/sales/opportunities/new" }); // Draft
  const visible = compiled(shown({ guide_key: "guide.page.sales.opportunities.id", entry_key: "route:/sales/opportunities/[id]" }));
  const released = releasedGuides(library(hidden, visible), entries);

  assert.equal(guideForPath(released, "/sales/opportunities/new"), null);
  assert.equal(guideForPath(released, "/sales/opportunities/SYN-1")?.front.guide_key, "guide.page.sales.opportunities.id");
  assert.deepEqual(routeForPath(released.routes, "/sales/opportunities/new"), { path: "/sales/opportunities/new", guide_key: null });
});

test("route matching follows the register's precedence", () => {
  const routes = [
    { path: "/x/[id]", guide_key: "short" },
    { path: "/x/[id]/long", guide_key: "long" },
    { path: "/x/[id]/[sub]", guide_key: "two" },
    { path: "/x/fixed/[sub]", guide_key: "fixed" },
  ];
  const pick = (pathname: string) => routeForPath(routes, pathname)?.guide_key ?? null;
  assert.equal(pick("/x/anything"), "short");
  assert.equal(pick("/x/anything/other"), "two");
  // Patterns are tried longest first, by the length of the pattern text, as matchEntry does. Here /x/[id]/[sub]
  // (13 characters) is tried before /x/[id]/long (12), although the second is the more specific.
  assert.equal(pick("/x/anything/long"), "two");
  assert.equal(pick("/x/fixed/other"), "fixed", "/x/fixed/[sub] (14 characters) is tried first");
  assert.equal(pick("/x/"), null, "[param] needs a non-empty segment");
  assert.equal(pick("/x"), null);
  assert.equal(pick("/x/a/b/c"), null, "the segment count must match");
  assert.equal(pick("/y/a"), null);
  assert.equal(routeForPath([], "/x"), null);
  assert.equal(routeForPath([{ path: "/x/[id]", guide_key: null }], "/x/[id]")?.path, "/x/[id]", "an exact path wins even when it looks like a pattern");
});

test("route matching agrees with the development register", async () => {
  const { entries: real } = await readMaster(process.cwd());
  const routes = real.flatMap((e) => (e.kind === "route" && e.path !== null ? [{ path: e.path, guide_key: null }] : []));
  assert.ok(routes.length > 100, "the real register holds the route entries");
  for (const route of routes) {
    const concrete = route.path.replace(/\[[^\]]+\]/g, "SYN-1");
    assert.equal(routeForPath(routes, concrete)?.path, matchEntry(real, concrete)?.path, `parity for ${concrete}`);
    assert.ok(routeForPath(routes, concrete), `${concrete} matches a route`);
  }
});

test("also_applies_to extends a guide and cannot be claimed twice", async (t) => {
  const extended = guideText(shown({ guide_key: "guide.page.a", entry_key: "route:/a", front: ["also_applies_to:", "  - route:/b"] }));
  const root = await makeRoot(t, { "docs/guides/a.md": extended });
  const single = await readGuideLibrary(root, entries);
  assert.deepEqual(single.errors, []);
  const released = releasedGuides(single, entries);
  assert.equal(guideForPath(released, "/a")?.front.guide_key, "guide.page.a");
  assert.equal(guideForPath(released, "/b")?.front.guide_key, "guide.page.a");

  // A second guide that owns /b is refused together with the first, and each error names the other file.
  const claimant = guideText(shown({ guide_key: "guide.page.b", entry_key: "route:/b" }));
  const claimed = await makeRoot(t, { "docs/guides/a.md": extended, "docs/guides/b.md": claimant });
  const both = await readGuideLibrary(claimed, entries);
  assert.deepEqual(both.guides, []);
  assert.deepEqual(
    both.errors.map((error) => [error.path, error.line]),
    [
      ["docs/guides/a.md", lineOf(extended, "also_applies_to:")],
      ["docs/guides/b.md", lineOf(claimant, "entry_key:")],
    ],
  );
  assert.match(both.errors[0].message, /"route:\/b".*docs\/guides\/b\.md/);
  assert.match(both.errors[1].message, /"route:\/b".*docs\/guides\/a\.md/);

  // Two guides that both list the same entry under also_applies_to are refused in the same way.
  const first = guideText({ guide_key: "guide.page.a", entry_key: "route:/a", front: ["also_applies_to: [route:/sales/leads]"] });
  const second = guideText({ guide_key: "guide.page.b", entry_key: "route:/b", front: ["also_applies_to: [route:/sales/leads]"] });
  const twice = await readGuideLibrary(await makeRoot(t, { "docs/guides/a.md": first, "docs/guides/b.md": second }), entries);
  assert.deepEqual(twice.guides, []);
  assert.deepEqual(twice.errors.map((error) => error.path), ["docs/guides/a.md", "docs/guides/b.md"]);
  assert.match(twice.errors[0].message, /docs\/guides\/b\.md/);
  assert.match(twice.errors[1].message, /docs\/guides\/a\.md/);
});

test("a guide listing its own entry again is not refused", async (t) => {
  const root = await makeRoot(t, {
    "docs/guides/a.md": guideText({ guide_key: "guide.page.a", entry_key: "route:/a", front: ["also_applies_to: [route:/a, route:/a]"] }),
  });
  const result = await readGuideLibrary(root, entries);
  assert.deepEqual(result.errors, []);
  assert.equal(result.guides.length, 1);
});

test("an unknown also_applies_to key is refused", async (t) => {
  const text = guideText({ guide_key: "guide.page.a", entry_key: "route:/a", front: ["also_applies_to:", "  - route:/ghost"] });
  const result = await readGuideLibrary(await makeRoot(t, { "docs/guides/a.md": text }), entries);
  assert.deepEqual(result.guides, []);
  assert.deepEqual(result.errors.map((error) => [error.path, error.line]), [["docs/guides/a.md", lineOf(text, "also_applies_to:")]]);
  assert.match(result.errors[0].message, /"route:\/ghost".*not in the development register/);
});

test("a duplicated guide_key refuses both guides", async (t) => {
  const twin = [entry("route:/p", "/p", "guide.page.twin"), entry("route:/q", "/q", "guide.page.twin")];
  const p = guideText({ guide_key: "guide.page.twin", entry_key: "route:/p" });
  const q = guideText({ guide_key: "guide.page.twin", entry_key: "route:/q" });
  const result = await readGuideLibrary(await makeRoot(t, { "docs/guides/p.md": p, "docs/guides/q.md": q }), twin);
  assert.deepEqual(result.guides, []);
  assert.deepEqual(
    result.errors.map((error) => [error.path, error.line]),
    [
      ["docs/guides/p.md", lineOf(p, "guide_key:")],
      ["docs/guides/q.md", lineOf(q, "guide_key:")],
    ],
  );
  assert.match(result.errors[0].message, /"guide\.page\.twin".*docs\/guides\/q\.md/);
  assert.match(result.errors[1].message, /"guide\.page\.twin".*docs\/guides\/p\.md/);
});

test("a link to a removed route fails with file and line", async (t) => {
  const body = ["Start at [leads](/sales/leads).", "", "## Overview {#overview}", "", "Open [one opportunity](/sales/opportunities/SYN-1) or [the old page](/sales/gone).", ""];
  const text = guideText({ guide_key: "guide.page.sales.leads", entry_key: "route:/sales/leads", body });
  const result = await readGuideLibrary(await makeRoot(t, { "docs/guides/leads.md": text }), entries);

  assert.deepEqual(result.guides, []);
  assert.deepEqual(result.errors.map((error) => [error.path, error.line]), [["docs/guides/leads.md", lineOf(text, "Open [one")]]);
  assert.match(result.errors[0].message, /"\/sales\/gone"/);

  const fixed = text.replace("/sales/gone", "/sales/leads");
  const ok = await readGuideLibrary(await makeRoot(t, { "docs/guides/leads.md": fixed }), entries);
  assert.deepEqual(ok.errors, []);
  assert.equal(ok.guides.length, 1);
});

test("one malformed file leaves the others usable", async (t) => {
  const bad = guideText({
    guide_key: "guide.page.sales.opportunities.new",
    entry_key: "route:/sales/opportunities/new",
    front: ["bogus_key: 1"],
    body: ["<div>raw</div>"],
  });
  const root = await makeRoot(t, {
    "docs/guides/good.md": guideText({ guide_key: "guide.page.sales.leads", entry_key: "route:/sales/leads" }),
    "docs/guides/bad.md": bad,
  });
  const result = await readGuideLibrary(root, entries);

  assert.deepEqual(result.guides.map((guide) => guide.path), ["docs/guides/good.md"]);
  assert.ok(result.errors.length >= 2);
  assert.ok(result.errors.every((error) => error.path === "docs/guides/bad.md"));
  assert.ok(result.errors.some((error) => error.line === lineOf(bad, "bogus_key:")));
  assert.ok(result.errors.some((error) => error.line === lineOf(bad, "<div>")));
});

test("a file that makes the compiler throw is reported and the others still compile", async (t) => {
  const root = await makeRoot(t, {
    "docs/guides/good.md": guideText({ guide_key: "guide.page.sales.leads", entry_key: "route:/sales/leads" }),
    "docs/guides/deep.md": guideText({
      guide_key: "guide.page.sales.opportunities.new",
      entry_key: "route:/sales/opportunities/new",
      body: ["> ".repeat(5000) + "deep"],
    }),
  });
  const result = await readGuideLibrary(root, entries);

  assert.deepEqual(result.guides.map((guide) => guide.path), ["docs/guides/good.md"]);
  assert.equal(result.errors.length, 1);
  assert.equal(result.errors[0].path, "docs/guides/deep.md");
  assert.equal(result.errors[0].line, 1);
  assert.match(result.errors[0].message, /could not be compiled/);
});

test("a guide awaiting its rewrite is skipped and any other malformed file is an error", async (t) => {
  assert.deepEqual([...awaitingRewrite], ["docs/guides/crm-deals.md"]);
  const oldTemplate = ["---", "document_id: PPO-HELP-CRM", "guide_key: crm.deals.worklist", "status: InReview - pilot", "route_patterns: /crm/opportunities", "---", "", "# Old template", ""].join("\n");
  const root = await makeRoot(t, {
    "docs/guides/crm-deals.md": oldTemplate,
    "docs/guides/other.md": oldTemplate,
  });
  const result = await readGuideLibrary(root, entries);

  assert.deepEqual(result.guides, []);
  assert.ok(result.errors.length > 0);
  assert.ok(result.errors.every((error) => error.path === "docs/guides/other.md"));
});

test("discovery finds guides by their guide_key and ignores other files", async (t) => {
  const crlf = guideText({ guide_key: "guide.page.sales.leads", entry_key: "route:/sales/leads" }).replace(/\n/g, "\r\n");
  const unclosed = "---\nguide_key: guide.page.a\nentry_key: route:/a\n";
  const spare = guideText({ guide_key: "guide.page.b", entry_key: "route:/b" });
  const root = await makeRoot(t, {
    "docs/guides/user-guide-contents.md": "---\ndocument_id: PPO-USER-GUIDE-TOC\ntitle: Contents\n---\n\n# Contents\n",
    "docs/guides/plain.md": "# No front matter\n",
    "docs/guides/notes.txt": "---\nguide_key: guide.page.ignored\n---\n",
    "docs/guides/sales/leads.md": crlf,
    "docs/guides/broken.md": unclosed,
    // A byte order mark or a space after the opening --- is a mistake in a guide, never a reason to skip the file.
    "docs/guides/bom.md": `﻿${spare}`,
    "docs/guides/spaced.md": spare.replace(/^---/, "--- "),
  });
  const result = await readGuideLibrary(root, entries);

  assert.deepEqual(result.guides.map((guide) => guide.path), ["docs/guides/sales/leads.md"]);
  // Only the three malformed guides are reported, each with its front matter problem on line 1.
  assert.deepEqual([...new Set(result.errors.map((error) => error.path))], ["docs/guides/bom.md", "docs/guides/broken.md", "docs/guides/spaced.md"]);
  const frontMatterError = (name: string) => result.errors.find((error) => error.path === `docs/guides/${name}` && error.line === 1);
  assert.match(frontMatterError("bom.md")?.message ?? "", /must start with front matter/);
  assert.match(frontMatterError("broken.md")?.message ?? "", /not closed/);
  assert.match(frontMatterError("spaced.md")?.message ?? "", /must start with front matter/);
});

// ADR-0065, decision 8: every guide compiles or the build fails, so no file may drop out of the library unreported.
// Each probe below is a valid guide in every other respect.
test("discovery accounts for every probe file instead of skipping it", async (t) => {
  const valid = guideText({ guide_key: "guide.page.a", entry_key: "route:/a" });
  const probe = async (path: string, text: string) => readGuideLibrary(await makeRoot(t, { [path]: text }), entries);
  const refused = async (name: string, path: string, text: string) => {
    const result = await probe(path, text);
    assert.deepEqual(result.guides, [], name);
    assert.ok(result.errors.length > 0, `${name}: an error was expected`);
    assert.ok(result.errors.every((error) => error.path === path), `${name}: every error names ${path}`);
    return result;
  };

  // Front matter that does not open on line 1 is an error for the file, however the opener is spoiled.
  await refused("a leading blank line", "docs/guides/blank.md", `\n${valid}`);
  await refused("a leading comment", "docs/guides/comment.md", `<!-- a note -->\n${valid}`);
  await refused("a leading space", "docs/guides/space.md", valid.replace(/^---/, " ---"));
  // A misspelt key is found by its likeness to guide_key, and then refused because guide_key is missing.
  const typo = await refused("a mistyped key", "docs/guides/typo.md", valid.replace("guide_key:", "guide-key:"));
  assert.ok(typo.errors.some((error) => /guide_key/.test(error.message)));

  // The extension is read in any case, and a quoted key is the same key to YAML. Both are valid guides, so they
  // join the library: found and compiled, which is what matters.
  for (const [name, path, text] of [
    ["an upper-case extension", "docs/guides/upper.MD", valid],
    ["a quoted key", "docs/guides/quoted.md", valid.replace("guide_key:", '"guide_key":')],
  ]) {
    const result = await probe(path, text);
    assert.deepEqual(result.errors, [], name);
    assert.deepEqual(result.guides.map((guide) => guide.path), [path], name);
  }

  // The same files with a real defect are refused, by name.
  const wrong = guideText({ guide_key: "guide.page.wrong", entry_key: "route:/a" });
  await refused("an upper-case extension with a defect", "docs/guides/upper.MD", wrong);
  await refused("a quoted key with a defect", "docs/guides/quoted.md", wrong.replace("guide_key:", '"guide_key":'));
});

test("every file under pages is a guide, and a file that cannot be read as one is an error", async (t) => {
  const valid = (key: string, entryKey: string) => guideText({ guide_key: key, entry_key: entryKey });
  const root = await makeRoot(t, {
    "docs/guides/pages/a.MD": valid("guide.page.a", "route:/a"),
    "docs/guides/pages/sub/b.md": valid("guide.page.b", "route:/b"),
    "docs/guides/pages/plain.md": "# No front matter, and no guide_key to find\n",
    "docs/guides/pages/notes.txt": valid("guide.page.sales.leads", "route:/sales/leads"),
    "docs/guides/pages/sub/image.png": "not a guide",
  });
  const result = await readGuideLibrary(root, entries);

  assert.deepEqual(result.guides.map((guide) => guide.path), ["docs/guides/pages/a.MD", "docs/guides/pages/sub/b.md"]);
  assert.deepEqual([...new Set(result.errors.map((error) => error.path))], [
    "docs/guides/pages/notes.txt",
    "docs/guides/pages/plain.md",
    "docs/guides/pages/sub/image.png",
  ]);
  const at = (name: string) => result.errors.filter((error) => error.path === `docs/guides/pages/${name}`);
  for (const name of ["notes.txt", "sub/image.png"]) {
    assert.equal(at(name).length, 1, name);
    assert.equal(at(name)[0].line, 1, name);
    assert.match(at(name)[0].message, /\.md extension/, name);
  }
  assert.ok(at("plain.md").some((error) => error.line === 1 && /front matter/.test(error.message)));
});

test("outside pages, a Markdown file is a guide only when its first 40 lines declare a guide key", async (t) => {
  const prose = (count: number) => Array.from({ length: count }, () => "Synthetic prose.");
  const root = await makeRoot(t, {
    "docs/guides/notes/readme.md": "# Notes\n\nNothing here names a guide.\n",
    "docs/guides/notes/mentions.md": ["# Notes", "", "A guide_key is written in the front matter."].join("\n"),
    // The key sits on line 41, past the window, so this file is an ordinary document.
    "docs/guides/notes/late.md": [...prose(40), "guide_key: guide.page.late"].join("\n"),
    // The key sits on line 40, inside the window, so this file is a guide and has no front matter to compile.
    "docs/guides/notes/early.md": [...prose(39), "guide_key: guide.page.early"].join("\n"),
    "docs/guides/notes/early.txt": ["guide_key: guide.page.ignored"].join("\n"),
  });
  const result = await readGuideLibrary(root, entries);

  assert.deepEqual(result.guides, []);
  assert.deepEqual([...new Set(result.errors.map((error) => error.path))], ["docs/guides/notes/early.md"]);
});

test("a missing guides folder is an empty library", async (t) => {
  assert.deepEqual(await readGuideLibrary(await makeRoot(t), entries), { guides: [], errors: [] });
});

test("visibility follows status", () => {
  const base = { guide_key: "guide.page.sales.leads", entry_key: "route:/sales/leads" };
  const evidence = (valid: boolean) => [
    "reviewer: Synthetic Reviewer",
    'reviewed_at: "2026-10-23"',
    `reviewed_content_hash: "${valid ? compiled(base).contentHash : "0".repeat(64)}"`,
  ];
  const visible = (spec: Spec) => releasedGuides(library(compiled(spec)), entries).guides.length === 1;

  assert.equal(visible({ ...base, status: "Published", front: evidence(true) }), true, "Published with valid evidence");
  assert.equal(visible({ ...base, status: "InReview", front: carried }), true, "InReview, carried over and shown");
  assert.equal(visible({ ...base, status: "Reviewed", front: carried }), true, "Reviewed, carried over and shown");

  assert.equal(visible({ ...base, status: "Draft" }), false, "Draft");
  assert.equal(visible({ ...base, status: "InReview" }), false, "InReview without the flag");
  assert.equal(visible({ ...base, status: "InReview", front: [`carried_over_from: ${carriedOverSources[0]}`] }), false, "InReview carried over but not shown");
  assert.equal(visible({ ...base, status: "Reviewed" }), false, "Reviewed without the flag");
  assert.equal(visible({ ...base, status: "Superseded" }), false, "Superseded");
  assert.equal(visible({ ...base, status: "Withdrawn" }), false, "Withdrawn");
  assert.equal(visible({ ...base, status: "Published", front: evidence(false) }), false, "Published with a stale hash");
  assert.equal(visible({ ...base, status: "Published" }), false, "Published without evidence");
});

test("visibility never shows a Draft, Superseded or Withdrawn guide, whatever its flags", () => {
  const base = { guide_key: "guide.page.sales.leads", entry_key: "route:/sales/leads" };
  for (const status of ["Draft", "Superseded", "Withdrawn"]) {
    assert.equal(releasedGuides(library(compiled({ ...base, status, front: carried })), entries).guides.length, 0, status);
  }
  // Published reads as reviewed only on its own evidence: the carry-over flags do not rescue a stale hash.
  const stale = ["reviewer: Synthetic Reviewer", 'reviewed_at: "2026-10-23"', `reviewed_content_hash: "${"0".repeat(64)}"`, ...carried];
  assert.equal(releasedGuides(library(compiled({ ...base, status: "Published", front: stale })), entries).guides.length, 0);
});

test("released guides list every route and bind the visible guide", () => {
  const leads = compiled(shown({ guide_key: "guide.page.sales.leads", entry_key: "route:/sales/leads" }));
  const draft = compiled({ guide_key: "guide.page.a", entry_key: "route:/a", front: ["also_applies_to: [route:/b]"] });
  const shell = compiled(shown({ guide_key: "guide.shell", entry_key: "system:shell" }));
  const released = releasedGuides(library(leads, draft, shell), entries);

  assert.deepEqual(released.guides.map((guide) => guide.front.guide_key), ["guide.page.sales.leads", "guide.shell"]);
  assert.equal(released.shell?.front.guide_key, "guide.shell");
  assert.deepEqual(released.routes, [
    { path: "/sales/leads", guide_key: "guide.page.sales.leads" },
    { path: "/sales/opportunities/new", guide_key: null },
    { path: "/sales/opportunities/[id]", guide_key: null },
    { path: "/a", guide_key: null },
    { path: "/b", guide_key: null },
  ]);

  const hiddenShell = releasedGuides(library(compiled({ guide_key: "guide.shell", entry_key: "system:shell" })), entries);
  assert.equal(hiddenShell.shell, null);
  assert.deepEqual(hiddenShell.guides, []);
});

test("guideForPath returns nothing when the bound guide is not in the library", () => {
  const released = { guides: [], routes: [{ path: "/a", guide_key: "guide.page.a" }], shell: null };
  assert.equal(guideForPath(released, "/a"), null);
});

test("guide links resolve to known sections", async (t) => {
  const target = guideText({
    guide_key: "guide.page.a",
    entry_key: "route:/a",
    front: ["section_aliases:", "  old-name: overview"],
    body: ["## Overview {#overview}", "", "Synthetic text.", "", "## Second part {#second-part}", "", "More text."],
  });
  const source = guideText({
    guide_key: "guide.page.b",
    entry_key: "route:/b",
    body: [
      "## Overview {#overview}",
      "",
      "Fine: [by id](guide:guide.page.a#second-part) and [by alias](guide:guide.page.a#old-name).",
      "",
      "Missing section: [broken](guide:guide.page.a#missing).",
      "",
      "Missing guide: [broken](guide:guide.page.nowhere#overview).",
    ],
  });
  const result = await readGuideLibrary(await makeRoot(t, { "docs/guides/a.md": target, "docs/guides/b.md": source }), entries);

  assert.deepEqual(result.guides.map((guide) => guide.path), ["docs/guides/a.md"]);
  assert.deepEqual(
    result.errors.map((error) => [error.path, error.line]),
    [
      ["docs/guides/b.md", lineOf(source, "Missing section:")],
      ["docs/guides/b.md", lineOf(source, "Missing guide:")],
    ],
  );
  assert.match(result.errors[0].message, /guide\.page\.a.*"missing"/);
  assert.match(result.errors[1].message, /"guide\.page\.nowhere"/);
});

test("section maps and carry-over sources are checked against the guide", async (t) => {
  const text = guideText({
    guide_key: "guide.page.a",
    entry_key: "route:/a",
    status: "InReview",
    front: [
      "carried_over_from: src/elsewhere/guide.ts",
      "section_aliases:",
      "  old-name: gone",
      "  fine-name: overview",
      "contents:",
      "  overview: Overview",
      "  nope: Nothing",
      "list_styles:",
      "  ghost: journey",
    ],
  });
  const result = await readGuideLibrary(await makeRoot(t, { "docs/guides/a.md": text }), entries);

  assert.deepEqual(result.guides, []);
  assert.deepEqual(
    result.errors.map((error) => error.line).sort((a, b) => a - b),
    [lineOf(text, "carried_over_from:"), lineOf(text, "section_aliases:"), lineOf(text, "contents:"), lineOf(text, "list_styles:")],
  );
  const text2 = messages(result.errors);
  assert.match(text2, /carried_over_from "src\/elsewhere\/guide\.ts"/);
  assert.match(text2, /"old-name".*"gone"/);
  assert.match(text2, /contents.*"nope"/);
  assert.match(text2, /list_styles.*"ghost"/);
  assert.doesNotMatch(text2, /fine-name/);
});

test("every carried-over source is accepted", async (t) => {
  for (const source of carriedOverSources) {
    const text = guideText({ guide_key: "guide.page.a", entry_key: "route:/a", status: "InReview", front: [`carried_over_from: ${source}`] });
    const result = await readGuideLibrary(await makeRoot(t, { "docs/guides/a.md": text }), entries);
    assert.deepEqual(result.errors, [], source);
  }
});

test("the development cache keeps a file's result until its mtime changes", async (t) => {
  const path = "docs/guides/a.md";
  const draft = (title: string) => guideText({ guide_key: "guide.page.a", entry_key: "route:/a" }).replace("title: Synthetic guide", `title: ${title}`);
  const root = await makeRoot(t, { [path]: draft("Alpha one") });
  const first = new Date("2026-01-01T00:00:00.000Z");
  const second = new Date("2026-01-02T00:00:00.000Z");
  const titleNow = async (known: Entry[] = entries) => (await readGuideLibrary(root, known)).guides[0]?.front.title;

  await withNodeEnv("development", async () => {
    await utimes(join(root, path), first, first);
    assert.equal(await titleNow(), "Alpha one");

    // The same mtime means the same result, even though the file changed.
    await writeFile(join(root, path), draft("Alpha two"));
    await utimes(join(root, path), first, first);
    assert.equal(await titleNow(), "Alpha one");

    // The cross-checks run again on every call, cached file or not.
    assert.equal(await titleNow(entries.filter((e) => e.key !== "route:/a")), undefined);

    await utimes(join(root, path), second, second);
    assert.equal(await titleNow(), "Alpha two");
  });

  // Production never caches.
  await writeFile(join(root, path), draft("Alpha six"));
  await utimes(join(root, path), second, second);
  assert.equal(await withNodeEnv("production", titleNow), "Alpha six");
});

test("released library survives a missing release file", async (t) => {
  const root = await makeRoot(t);
  const { result, logged } = await capturingErrors(() => withNodeEnv("production", () => releasedGuideLibrary(root)));

  assert.deepEqual(result, { guides: [], routes: [], shell: null });
  assert.equal(logged.length, 1);
  assert.equal(logged[0].length, 1);
  assert.equal(typeof logged[0][0], "string");
  assert.doesNotMatch(String(logged[0][0]), /\n/);
});

test("released library refuses an unreadable or misshapen release file without leaking it", async (t) => {
  const secret = "SYN-SECRET-CONTENT";
  const files: Record<string, string> = {
    "not json": `{ "guides": [${secret}`,
    "guides is not a list": JSON.stringify({ guides: {}, routes: [], shell: null, secret }),
    "routes is missing": JSON.stringify({ guides: [], shell: null, secret }),
    "shell is missing": JSON.stringify({ guides: [], routes: [], secret }),
    "a list": JSON.stringify([secret]),
    "null": "null",
  };
  for (const [name, text] of Object.entries(files)) {
    const root = await makeRoot(t, { [releasedFile]: text });
    const { result, logged } = await capturingErrors(() => withNodeEnv("production", () => releasedGuideLibrary(root)));
    assert.deepEqual(result, { guides: [], routes: [], shell: null }, name);
    assert.equal(logged.length, 1, name);
    assert.doesNotMatch(String(logged[0][0]), new RegExp(secret), name);
  }
});

test("released library reads the release file in production and remembers it", async (t) => {
  const leads = compiled(shown({ guide_key: "guide.page.sales.leads", entry_key: "route:/sales/leads" }));
  const released = releasedGuides(library(leads), entries);
  const root = await makeRoot(t, { [releasedFile]: JSON.stringify(released) });

  const first = await withNodeEnv("production", () => releasedGuideLibrary(root));
  assert.deepEqual(first, JSON.parse(JSON.stringify(released)));
  assert.equal(guideForPath(first, "/sales/leads")?.front.guide_key, "guide.page.sales.leads");

  await rm(join(root, releasedFile));
  const second = await withNodeEnv("production", () => releasedGuideLibrary(root));
  assert.equal(second, first, "a successful read is kept for the process");
});

test("released library compiles the guide files and the register in development", async (t) => {
  const register = {
    schema_version: 2,
    title: "Synthetic register",
    source_baseline: "synthetic",
    local_base: "http://127.0.0.1:3000",
    live_base: "http://127.0.0.1:3000",
    shared_sources: [],
    entries,
  };
  const root = await makeRoot(t, {
    "docs/design/development/register.json": JSON.stringify(register),
    "docs/guides/leads.md": guideText(shown({ guide_key: "guide.page.sales.leads", entry_key: "route:/sales/leads" })),
    "docs/guides/new.md": guideText({ guide_key: "guide.page.sales.opportunities.new", entry_key: "route:/sales/opportunities/new" }),
  });
  const result = await withNodeEnv("development", () => releasedGuideLibrary(root));

  assert.deepEqual(result.guides.map((guide) => guide.path), ["docs/guides/leads.md"]);
  assert.equal(guideForPath(result, "/sales/leads")?.front.guide_key, "guide.page.sales.leads");
  assert.equal(guideForPath(result, "/sales/opportunities/new"), null);
  assert.equal(result.routes.length, 5);
  assert.equal(result.shell, null);

  // Without a register the call still returns, and says so once.
  const bare = await makeRoot(t);
  const { result: empty, logged } = await capturingErrors(() => withNodeEnv("development", () => releasedGuideLibrary(bare)));
  assert.deepEqual(empty, { guides: [], routes: [], shell: null });
  assert.equal(logged.length, 1);
});
