import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { createElement, isValidElement, type ReactElement, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import type { PageGuide } from "../../src/components/leads-guide";
import { compileGuide } from "../../src/guides/compile";
import { allowedHttpsHosts } from "../../src/guides/links";
import type { BlockNode, CompiledGuide, InlineNode } from "../../src/guides/model";
import { GuideArticle, type GuideLinkProps } from "../../src/guides/render";
import { acceptedPanel } from "./guide-render-accepted";

// User guide stage 1 (ADR-0065, decision 7): React renders the compiled model and reproduces the accepted
// page-guide panel. These tests use synthetic values only.
const header = (...extra: string[]) => [
  "---",
  "guide_key: guide.page.synthetic.render",
  "entry_key: route:/synthetic/render",
  "title: Synthetic render",
  "versioning: git",
  "status: InReview",
  'owner_role: "Prototype content owner"',
  'source_commit: "0123456789abcdef0123456789abcdef01234567"',
  ...extra,
  "---",
  "",
];
const compiled = (extra: string[], body: string[]): CompiledGuide => {
  const result = compileGuide("docs/guides/synthetic-render.md", [...header(...extra), ...body].join("\n"));
  assert.deepEqual(result.errors, []);
  assert.ok(result.guide, "the fixture should compile");
  return result.guide;
};
const render = (guide: CompiledGuide, props: Partial<Parameters<typeof GuideArticle>[0]> = {}) =>
  renderToStaticMarkup(createElement(GuideArticle, { guide, eyebrow: "Page guide", ...props }));

// Models the compiler would refuse (a hand-edited link, text it would never produce) are built by hand: one section
// holding the given blocks, on the front matter of a compiled guide.
const baseGuide = compiled([], ["## Only {#only}", "", "Placeholder.", ""]);
const text = (value: string): InlineNode => ({ kind: "text", text: value });
const paragraph = (...children: InlineNode[]): BlockNode => ({ kind: "paragraph", children });
const handBuilt = (...blocks: BlockNode[]): CompiledGuide => ({ ...baseGuide, sections: [{ id: "only", title: [text("Only")], blocks }] });

const navLabels = (markup: string) => {
  const nav = /<nav class="ppo-guide-contents" aria-label="Guide sections">(.*?)<\/nav>/.exec(markup);
  assert.ok(nav, "the contents nav should be present");
  return [...nav[1].matchAll(/<button>(.*?)<\/button>/g)].map((match) => match[1]);
};

// GuideArticle uses no hooks and draws only host elements, so calling it returns its element tree. That lets a test
// find a button and call its handler without a browser.
type Element = ReactElement<{ children?: ReactNode; onClick?: () => void; type?: string }>;
const walk = (node: ReactNode, visit: (element: Element) => void): void => {
  if (Array.isArray(node)) return node.forEach((child) => walk(child, visit));
  if (!isValidElement(node)) return;
  visit(node as Element);
  walk((node.props as { children?: ReactNode }).children, visit);
};
const buttonsOf = (guide: CompiledGuide, props: Partial<Parameters<typeof GuideArticle>[0]> = {}) => {
  const found: Element[] = [];
  walk(GuideArticle({ guide, eyebrow: "Page guide", ...props }), (element) => {
    if (element.type === "button") found.push(element);
  });
  return found;
};

const panelBody = [
  "Start here.",
  "",
  "## What this page is for {#overview}",
  "",
  "Purpose.",
  "",
  "### First feature",
  "",
  "One paragraph.",
  "",
  "### Second feature",
  "",
  "Another paragraph.",
  "",
  "## How to use it {#how}",
  "",
  "1. **Open the page**\\",
  "   Read the list.",
  "2. **Choose a view**\\",
  "   Use the menu.",
  "",
  "## Your journey {#journey}",
  "",
  "Most records follow one path.",
  "",
  "1. **It arrives**\\",
  "   It appears in the list.",
  "2. **It is done**\\",
  "   It moves on.",
  "",
  "## Keyboard shortcuts {#shortcuts}",
  "",
  "| Key | Action |",
  "| --- | --- |",
  "| `Tab` | Move to the next control. |",
  "| `Esc` | Close a menu. |",
  "",
  "## If something is unavailable {#recovery}",
  "",
  "Try again.",
  "",
  "> [!NOTE]",
  "> Access is checked on the server.",
  "",
];
const panelFront = ["contents: { overview: Overview, how: How to use, journey: Journey map }", "list_styles: { journey: journey }"];

test("renders the accepted panel structure", () => {
  const markup = render(compiled(panelFront, panelBody));
  assert.deepEqual(navLabels(markup), ["Overview", "How to use", "Journey map"]);
  assert.match(markup, /^<article class="ppo-page-guide"><div class="ppo-guide-intro"><span class="ppo-guide-eyebrow">Page guide<\/span><h3>Synthetic render<\/h3><p>Start here\.<\/p><\/div><nav /);
  assert.match(markup, /<h3 id="ppo-guide-how" tabindex="-1">How to use it<\/h3>/);
  assert.match(markup, /<h3 id="ppo-guide-overview" tabindex="-1">What this page is for<\/h3>/);
  assert.match(markup, /<h3 id="ppo-guide-journey" tabindex="-1">Your journey<\/h3>/);
  // A section without a contents entry gets neither the ID nor the focus target.
  assert.equal(markup.match(/id="ppo-guide-/g)?.length, 3);
  assert.match(markup, /<h3>Keyboard shortcuts<\/h3>/);
  assert.match(markup, /<h3>If something is unavailable<\/h3>/);
  assert.match(markup, /<div class="ppo-guide-features"><div><h4>First feature<\/h4><p>One paragraph\.<\/p><\/div><div><h4>Second feature<\/h4><p>Another paragraph\.<\/p><\/div><\/div>/);
  assert.match(markup, /<ol class="ppo-guide-steps"><li><span class="ppo-step-number" aria-hidden="true">1<\/span><div><h4>Open the page<\/h4><p>Read the list\.<\/p><\/div><\/li><li><span class="ppo-step-number" aria-hidden="true">2<\/span><div><h4>Choose a view<\/h4><p>Use the menu\.<\/p><\/div><\/li><\/ol>/);
  // The journey section is mapped to the journey band, and only that section.
  assert.match(markup, /<ol class="ppo-guide-journey"><li><span class="ppo-step-number" aria-hidden="true">1<\/span><div><h4>It arrives<\/h4><p>It appears in the list\.<\/p><\/div><\/li>/);
  assert.equal(markup.match(/class="ppo-guide-steps"/g)?.length, 1);
  assert.equal(markup.match(/class="ppo-guide-journey"/g)?.length, 1);
  assert.match(markup, /<dl class="ppo-guide-shortcuts"><div><dt><kbd>Tab<\/kbd><\/dt><dd>Move to the next control\.<\/dd><\/div><div><dt><kbd>Esc<\/kbd><\/dt><dd>Close a menu\.<\/dd><\/div><\/dl>/);
  // A note holding one paragraph puts that paragraph's text straight into the box, with no inner <p>.
  assert.match(markup, /<div class="ppo-guide-note">Access is checked on the server\.<\/div>/);
  assert.doesNotMatch(markup, /<table/);
});

test("contents buttons follow the map's order and labels", () => {
  const guide = compiled(["contents: { journey: Map, overview: Start }", "list_styles: { journey: journey }"], panelBody);
  const markup = render(guide);
  assert.deepEqual(navLabels(markup), ["Map", "Start"]);
  // The sections named in the map are the only ones that get an ID.
  assert.match(markup, /id="ppo-guide-journey"/);
  assert.match(markup, /id="ppo-guide-overview"/);
  assert.doesNotMatch(markup, /id="ppo-guide-how"/);
  assert.equal(markup.match(/id="ppo-guide-/g)?.length, 2);
});

test("without a contents map every section gets a button with its title and an ID", () => {
  const guide = compiled([], panelBody);
  assert.deepEqual(guide.front.contents, {});
  const markup = render(guide);
  assert.deepEqual(navLabels(markup), ["What this page is for", "How to use it", "Your journey", "Keyboard shortcuts", "If something is unavailable"]);
  for (const id of ["overview", "how", "journey", "shortcuts", "recovery"]) {
    assert.match(markup, new RegExp(`<h3 id="ppo-guide-${id}" tabindex="-1">`));
  }
  // No journey mapping here, so the second list is a numbered-steps list as well.
  assert.equal(markup.match(/class="ppo-guide-steps"/g)?.length, 2);
  assert.doesNotMatch(markup, /class="ppo-guide-journey"/);
});

test("a contents button scrolls to its section and moves focus there, as the accepted panel does", () => {
  const calls: unknown[][] = [];
  const target = {
    focus: (...args: unknown[]) => calls.push(["focus", ...args]),
    scrollIntoView: (...args: unknown[]) => calls.push(["scrollIntoView", ...args]),
  };
  const looked: string[] = [];
  const scope = globalThis as unknown as { document?: unknown };
  const before = scope.document;
  scope.document = { getElementById: (id: string) => (looked.push(id), id === "ppo-guide-how" ? target : null) };
  try {
    const nav = buttonsOf(compiled(panelFront, panelBody));
    assert.equal(nav.length, 3);
    nav[1].props.onClick?.();
    nav[2].props.onClick?.(); // no element is found for this one: nothing may throw
  } finally {
    if (before === undefined) delete scope.document;
    else scope.document = before;
  }
  assert.deepEqual(looked, ["ppo-guide-how", "ppo-guide-journey"]);
  assert.deepEqual(calls, [["focus", { preventScroll: true }], ["scrollIntoView", { block: "start", behavior: "instant" }]]);
});

test("renders its children after the last section", () => {
  const markup = render(compiled(panelFront, panelBody), { children: createElement("p", { className: "after" }, "After") });
  assert.ok(markup.endsWith('<p class="after">After</p></article>'));
  assert.doesNotMatch(render(compiled(panelFront, panelBody)), /class="after"/);
});

test("never trusts a hand-edited href", () => {
  const refusedHrefs = [
    "javascript:alert(1)",
    "JaVaScRiPt:alert(1)",
    "data:text/html,x",
    "vbscript:x",
    "file:///etc/passwd",
    "http://synthetic.example/",
    "mailto:someone@synthetic.example",
    "//synthetic.example/",
    "/\\synthetic.example",
    "/path with space",
    "/path\u200B",
    "https://synthetic.example/", // https, but the host is not on the list
    "/sales/opportunities/[id]", // a route pattern, not an address
    "",
  ];
  for (const href of refusedHrefs) {
    const markup = render(handBuilt(paragraph({ kind: "link", href, children: [text("Open")] })));
    assert.doesNotMatch(markup, /href=/, `href ${JSON.stringify(href)} should draw no href`);
    assert.doesNotMatch(markup, /javascript/i);
    assert.match(markup, /<p>Open<\/p>/, "the link's text still shows");
  }
  const markup = render(handBuilt(paragraph({ kind: "link", href: "javascript:alert(1)", children: [text("Open")] })));
  assert.doesNotMatch(markup, /href="javascript/);
});

test("text is escaped", () => {
  const hostile = "<script>x</script>";
  const escaped = "&lt;script&gt;x&lt;/script&gt;";
  const guide = handBuilt(
    paragraph(text(hostile), { kind: "strong", children: [text(hostile)] }, { kind: "emphasis", children: [text(hostile)] }, { kind: "code", text: hostile }),
    paragraph({ kind: "link", href: "/sales/leads", children: [text(hostile)] }),
    { kind: "table", header: [[text("Key")], [text("Action")]], rows: [[[{ kind: "code", text: hostile }], [text(hostile)]]] },
    { kind: "callout", tone: "warning", children: [paragraph(text(hostile))] },
  );
  const markup = render({ ...guide, front: { ...guide.front, title: hostile, contents: { only: hostile } } }, { eyebrow: hostile });
  assert.ok(markup.includes(escaped));
  assert.doesNotMatch(markup, /<script/);
  assert.ok(markup.split(escaped).length - 1 >= 9, "every place that holds author text is escaped");
  assert.equal(render(handBuilt(paragraph(text("A & B")))).includes("A &amp; B"), true);
});

// A compiled guide edited by hand can hold any JSON. Whatever is not the shape the model names must draw nothing and
// must not throw, so one bad node cannot take down the panel. "LEAK" marks content that must never reach the markup.
const loose = (value: unknown) => value as never;
const shows = (guide: CompiledGuide, why: string) => {
  let markup = "";
  assert.doesNotThrow(() => {
    markup = render(guide);
  }, why);
  assert.doesNotMatch(markup, /LEAK|\[object/, why);
  return markup;
};

test("a node of an unknown kind draws nothing: in a title with no contents map, in a paragraph and as a block", () => {
  const mystery = { kind: "mystery", text: "LEAK", children: [{ kind: "text", text: "LEAK" }] };
  const childless = { kind: "mystery", text: "LEAK" }; // the review's probe: no children to read
  const guide: CompiledGuide = {
    ...baseGuide,
    sections: [{
      id: "only",
      title: [text("Real "), loose(mystery), loose(childless), text("title")],
      blocks: [paragraph(text("Before "), loose(mystery), text("after")), loose({ ...mystery, kind: "mystery-block" }), paragraph(text("Last"))],
    }],
  };
  assert.deepEqual(guide.front.contents, {}); // the title is the contents button's label
  const markup = shows(guide, "an unknown kind");
  assert.deepEqual(navLabels(markup), ["Real title"]);
  assert.match(markup, /<h3 id="ppo-guide-only" tabindex="-1">Real title<\/h3><p>Before after<\/p><p>Last<\/p><\/section>/);
});

test("a malformed inline node draws nothing and never throws", () => {
  const malformed: unknown[] = [
    null, 5, "LEAK", [], {}, { kind: "mystery", text: "LEAK" },
    { kind: "text" }, { kind: "text", text: 5 }, { kind: "text", text: { LEAK: 1 } },
    { kind: "strong" }, { kind: "strong", children: "LEAK" }, { kind: "strong", children: [null, 5, { kind: "mystery" }] },
    { kind: "emphasis", children: null }, { kind: "emphasis", children: { LEAK: 1 } },
    { kind: "code" }, { kind: "code", text: 5 }, { kind: "code", text: { LEAK: 1 } },
    { kind: "link" }, { kind: "link", href: { LEAK: 1 }, children: [text("shown")] }, { kind: "link", href: "/sales/leads" }, { kind: "link", href: "/sales/leads", children: "LEAK" },
  ];
  for (const node of malformed) {
    const why = `inline node ${JSON.stringify(node)}`;
    assert.match(shows(handBuilt(paragraph(text("Kept "), loose(node), text("text"))), why), /<p>Kept .*text<\/p>/, why);
    // The same node in a section title with no contents map, where plainText reads it.
    shows({ ...baseGuide, sections: [{ id: "only", title: [text("T"), loose(node)], blocks: [] }] }, why);
  }
  assert.match(shows(handBuilt(paragraph(loose({ kind: "link", href: { LEAK: 1 }, children: [text("shown")] }))), "a link with no address"), /<p>shown<\/p>/);
  assert.doesNotMatch(render(handBuilt(paragraph(loose({ kind: "link", href: { LEAK: 1 }, children: [text("shown")] })))), /href=/);
});

test("a malformed block node draws nothing and never throws", () => {
  const word = (kind: string, ...children: InlineNode[]) => ({ kind, children });
  const malformed: unknown[] = [
    null, 5, "LEAK", [], {}, word("mystery", text("LEAK")),
    { kind: "paragraph" }, { kind: "paragraph", children: null }, { kind: "paragraph", children: "LEAK" },
    { kind: "heading" }, { kind: "heading", children: { LEAK: 1 } },
    { kind: "list" }, { kind: "list", ordered: true }, { kind: "list", ordered: true, items: "LEAK" }, { kind: "list", ordered: false, items: { LEAK: 1 } },
    { kind: "list", ordered: false, items: [null, "LEAK", {}, [null, 5, "LEAK"], [{ kind: "mystery" }], [{ kind: "paragraph" }]] },
    { kind: "list", ordered: true, items: [null, [], "LEAK"] },
    { kind: "list", ordered: true, items: [[{ kind: "paragraph", children: [{ kind: "strong" }, { kind: "break" }] }]] },
    { kind: "list", ordered: true, items: [[{ kind: "paragraph", children: [{ kind: "strong", children: null }, { kind: "break" }, null] }, null, "LEAK"]] },
    { kind: "table" }, { kind: "table", header: "LEAK", rows: "LEAK" }, { kind: "table", header: { LEAK: 1 }, rows: { LEAK: 1 } },
    { kind: "table", header: [null, null], rows: [null, "LEAK", [null, "LEAK", 5], [[{ kind: "code" }], null]] },
    { kind: "table", header: [[], []], rows: [[[{ kind: "code" }], [text("x")]]] },
    { kind: "table", header: [[], []], rows: [[[{ kind: "code", text: 5 }], [text("x")]]] },
    { kind: "table", header: [[], []], rows: [[{ kind: "code", text: "Tab" }, "LEAK"]] },
    { kind: "callout" }, { kind: "callout", tone: "note" }, { kind: "callout", tone: { LEAK: 1 }, children: "LEAK" },
    { kind: "callout", tone: "note", children: [null] }, { kind: "callout", tone: "note", children: [{ kind: "paragraph" }] }, { kind: "callout", tone: "note", children: [word("mystery", text("LEAK"))] },
  ];
  for (const node of malformed) {
    const why = `block ${JSON.stringify(node)}`;
    assert.match(shows(handBuilt(paragraph(text("Before")), loose(node), paragraph(text("After"))), why), /<p>Before<\/p>.*<p>After<\/p>/, why);
    // The same node as the one block under a ### heading, where the feature grid looks at it.
    shows(handBuilt({ kind: "heading", children: [text("Head")] }, loose(node)), why);
  }
});

test("a malformed section, list of sections or front matter draws nothing and never throws", () => {
  const section = baseGuide.sections[0];
  const edited = (patch: Record<string, unknown>): CompiledGuide => loose({ ...baseGuide, ...patch });
  const editedSection = (patch: Record<string, unknown>): CompiledGuide => edited({ sections: [{ ...section, ...patch }] });
  const editedFront = (patch: Record<string, unknown>): CompiledGuide => edited({ front: { ...baseGuide.front, ...patch } });
  const cases: [string, CompiledGuide][] = [
    ["title null", editedSection({ title: null })], ["title string", editedSection({ title: "LEAK" })],
    ["blocks null", editedSection({ blocks: null })], ["blocks string", editedSection({ blocks: "LEAK" })],
    ["id number", editedSection({ id: 5 })], ["id missing", editedSection({ id: undefined })],
    ["section null", edited({ sections: [null, section, "LEAK", 5, []] })],
    ["sections null", edited({ sections: null })], ["sections string", edited({ sections: "LEAK" })],
    ["lead null", edited({ lead: null })], ["lead string", edited({ lead: "LEAK" })], ["lead unknown", edited({ lead: [{ kind: "mystery", text: "LEAK" }] })],
    ["contents null", editedFront({ contents: null })], ["contents string", editedFront({ contents: "LEAK" })], ["contents array", editedFront({ contents: ["LEAK"] })],
    ["contents label object", editedFront({ contents: { only: { LEAK: 1 } } })],
    ["list_styles null", editedFront({ list_styles: null })], ["list_styles string", editedFront({ list_styles: "LEAK" })],
    ["title object", editedFront({ title: { LEAK: 1 } })], ["title missing", editedFront({ title: undefined })],
    ["front null", edited({ front: null })], ["front missing", edited({ front: undefined })],
  ];
  for (const [why, guide] of cases) shows(guide, why);
  // A contents label that is not text is left out, so the button falls back to the section's own title.
  assert.deepEqual(navLabels(shows(editedFront({ contents: { only: { LEAK: 1 } } }), "label")), ["Only"]);
  // Valid sections around a bad one still render.
  assert.match(shows(edited({ sections: [null, section] }), "neighbours"), /<h3 id="ppo-guide-only" tabindex="-1">Only<\/h3><p>Placeholder\.<\/p>/);
});

test("no HTML injection API under src/guides", () => {
  const root = fileURLToPath(new URL("../../src/guides/", import.meta.url));
  const files = readdirSync(root, { recursive: true, encoding: "utf8" }).filter((name) => statSync(join(root, name)).isFile());
  assert.ok(files.includes("render.tsx"), "the scan should reach the renderer");
  // Every way to turn a string into markup: React's escape hatch and its __html object, the DOM's HTML properties and
  // methods, and an iframe's srcdoc (srcDoc in React, hence any case).
  const injection = /dangerouslySetInnerHTML|__html|innerHTML|outerHTML|insertAdjacentHTML|document\.write|createContextualFragment|srcdoc/i;
  for (const name of files) {
    assert.doesNotMatch(readFileSync(join(root, name), "utf8"), injection, `${name} must not inject HTML`);
  }
});

// The guide modules a client component may import. The browser receives the compiled model, never the parser
// (ADR-0065, decision 8), so these import only React, next/link and each other; released.ts may also import the
// register's types, which are erased.
const clientSafe = ["render.tsx", "released.ts", "links.ts", "model.ts", "status.ts"];
const clientImports = new Set(["react", "next/link", "./model", "./links", "./status"]);
const serverOnly = /^(?:node:|marked$|yaml$|\.\/compile$|\.\/library$)/;

// The module specifiers of a source file: import and export ... from statements, side-effect imports, import() and
// require(). `typeOnly` is true for a whole statement written `import type` or `export type`.
function importsOf(source: string): { specifier: string; typeOnly: boolean }[] {
  const statements = [...source.matchAll(/^[ \t]*(?:import|export)\s+(type\s+)?(?:[^"';]*?\s+from\s+)?["']([^"']+)["']/gm)];
  const calls = [...source.matchAll(/\b(?:import|require)\s*\(\s*["']([^"']+)["']/g)];
  return [
    ...statements.map((match) => ({ specifier: match[2], typeOnly: match[1] !== undefined })),
    ...calls.map((match) => ({ specifier: match[1], typeOnly: false })),
  ];
}

test("the client-safe guide modules import only React, next/link and each other", () => {
  const root = fileURLToPath(new URL("../../src/guides/", import.meta.url));
  for (const name of clientSafe) {
    for (const { specifier, typeOnly } of importsOf(readFileSync(join(root, name), "utf8"))) {
      assert.doesNotMatch(specifier, serverOnly, `${name} must not import ${specifier}`);
      const allowed = clientImports.has(specifier) || (name === "released.ts" && specifier === "../development/model" && typeOnly);
      assert.ok(allowed, `${name} imports ${specifier}${typeOnly ? " (types only)" : ""}, which is not on the client allowlist`);
    }
  }
  // The scan must not be vacuous: it reads every form of import these modules use.
  assert.deepEqual(importsOf(readFileSync(join(root, "released.ts"), "utf8")), [
    { specifier: "../development/model", typeOnly: true },
    { specifier: "./model", typeOnly: true },
    { specifier: "./status", typeOnly: false },
  ]);
  assert.deepEqual(importsOf('import "x";\nexport * from "y";\nconst z = await import("z");\nimport {\n  a,\n  type b,\n} from "w";'), [
    { specifier: "x", typeOnly: false },
    { specifier: "y", typeOnly: false },
    { specifier: "w", typeOnly: false },
    { specifier: "z", typeOnly: false },
  ]);
});

test("no client component under src imports the guide compiler or library", () => {
  const src = fileURLToPath(new URL("../../src/", import.meta.url));
  const files = readdirSync(src, { recursive: true, encoding: "utf8" }).filter((name) => /\.[cm]?[jt]sx?$/.test(name) && statSync(join(src, name)).isFile());
  const clients = files.filter((name) => /^\s*["']use client["']/.test(readFileSync(join(src, name), "utf8")));
  assert.ok(clients.includes(join("guides", "render.tsx")), "the scan should find the guide renderer as a client module");
  for (const name of clients) {
    for (const { specifier } of importsOf(readFileSync(join(src, name), "utf8"))) {
      // A relative specifier is resolved against the file, so ./compile from src/guides is found as well.
      const target = specifier.startsWith(".") ? join(dirname(join(src, name)), specifier) : specifier;
      assert.doesNotMatch(target.replace(/\.[cm]?[jt]sx?$/, ""), /(?:^|[\\/])guides[\\/](?:compile|library)$/, `${name} is a client component and must not import ${specifier}`);
    }
  }
});

test("a route link renders through the link component, which defaults to next/link", () => {
  const guide = compiled([], ["## Only {#only}", "", "Go to [Leads](/sales/leads) now.", ""]);
  const StubLink = ({ href, children }: GuideLinkProps) => createElement("a", { "data-test-link": "", href }, children);
  assert.match(render(guide, { LinkComponent: StubLink }), /<p>Go to <a data-test-link="" href="\/sales\/leads">Leads<\/a> now\.<\/p>/);
  assert.match(render(guide), /<p>Go to <a href="\/sales\/leads">Leads<\/a> now\.<\/p>/);
  assert.doesNotMatch(render(guide), /target=|rel=/);
});

test("a guide link is a button that opens the guide, or plain text without a handler", () => {
  const guide = compiled([], ["## Only {#only}", "", "Read the [Leads guide](guide:guide.page.sales.leads#overview) first.", ""]);
  assert.doesNotMatch(render(guide), /href=|<button type=/);
  assert.match(render(guide), /<p>Read the Leads guide first\.<\/p>/);
  const opened: [string, string][] = [];
  const onOpenGuide = (key: string, section: string) => opened.push([key, section]);
  assert.match(render(guide, { onOpenGuide }), /<p>Read the <button type="button">Leads guide<\/button> first\.<\/p>/);
  assert.doesNotMatch(render(guide, { onOpenGuide }), /href=/);
  const [button] = buttonsOf(guide, { onOpenGuide }).filter((element) => element.props.type === "button"); // the contents button has no type
  assert.equal(button.props.type, "button");
  button.props.onClick?.();
  assert.deepEqual(opened, [["guide.page.sales.leads", "overview"]]);
});

test("an https link opens in a new tab and says so in its visible text", () => {
  const hosts = allowedHttpsHosts as string[];
  const guide = handBuilt(paragraph(text("See "), { kind: "link", href: "https://synthetic.example/page", children: [text("the "), { kind: "strong", children: [text("notes")] }] }, text(".")));
  assert.deepEqual([...hosts], []); // a copy, so the assertion does not narrow `hosts` to never[]
  hosts.push("synthetic.example"); // a listed host is a reviewed change, so a test lists one for the moment
  try {
    assert.equal(
      render(guide).match(/<p>.*<\/p>/)?.[0],
      '<p>See <a href="https://synthetic.example/page" target="_blank" rel="noopener noreferrer">the <strong>notes</strong> (opens in a new tab)</a>.</p>',
    );
    // The host check stays exact: a look-alike host, a userinfo trick and a downgrade are all refused.
    for (const href of ["https://synthetic.example.evil.example/", "https://synthetic.example@evil.example/", "http://synthetic.example/"]) {
      assert.doesNotMatch(render(handBuilt(paragraph({ kind: "link", href, children: [text("Open")] }))), /href=/);
    }
  } finally {
    hosts.length = 0;
  }
  assert.doesNotMatch(render(guide), /href=/);
});

test("other tables, lists, callouts and headings render as plain blocks", () => {
  const guide = compiled([], [
    "## Reference {#reference}",
    "",
    "Intro.",
    "",
    "| Name | Unit | Note |",
    "| --- | --- | --- |",
    "| Width | mm | Measured |",
    "| Angle | `deg` | Rounded |",
    "",
    "- one",
    "- two",
    "",
    "1. plain one",
    "2. **bold lead**\\",
    "   with text on the next line",
    "",
    "> [!WARNING]",
    "> Check first.",
    "",
    "> [!NOTE]",
    "> One.",
    ">",
    "> Two.",
    "",
    "### Details",
    "",
    "First.",
    "",
    "Second.",
    "",
  ]);
  const markup = render(guide);
  assert.match(markup, /<table><thead><tr><th scope="col">Name<\/th><th scope="col">Unit<\/th><th scope="col">Note<\/th><\/tr><\/thead><tbody><tr><td>Width<\/td><td>mm<\/td><td>Measured<\/td><\/tr><tr><td>Angle<\/td><td><code>deg<\/code><\/td><td>Rounded<\/td><\/tr><\/tbody><\/table>/);
  assert.match(markup, /<ul><li>one<\/li><li>two<\/li><\/ul>/);
  // One item that is not bold-led keeps the whole list a plain list, even though the other item would be a step.
  assert.match(markup, /<ol><li>plain one<\/li><li><strong>bold lead<\/strong><br\/>with text on the next line<\/li><\/ol>/);
  assert.match(markup, /<div class="ppo-guide-note" data-tone="warning"><p>Check first\.<\/p><\/div>/);
  assert.match(markup, /<div class="ppo-guide-note" data-tone="note"><p>One\.<\/p><p>Two\.<\/p><\/div>/);
  // A ### heading with more than one block under it is not a feature grid.
  assert.match(markup, /<h4>Details<\/h4><p>First\.<\/p><p>Second\.<\/p>/);
  assert.doesNotMatch(markup, /ppo-guide-features|ppo-guide-steps|ppo-guide-shortcuts|<kbd>/);
});

test("a table is a shortcut list only when it has two columns and every key is one code span", () => {
  const rows = (...cells: InlineNode[][][]): BlockNode => ({ kind: "table", header: [[text("Key")], [text("Action")]], rows: cells });
  const keyed = render(handBuilt(rows([[{ kind: "code", text: "Tab" }], [text("Move.")]])));
  assert.match(keyed, /<dl class="ppo-guide-shortcuts"><div><dt><kbd>Tab<\/kbd><\/dt><dd>Move\.<\/dd><\/div><\/dl>/);
  assert.doesNotMatch(keyed, /<th|Key/, "the shortcut list has no header row");
  // One plain-text key, or a key with extra text beside the code span, keeps the table a table.
  assert.match(render(handBuilt(rows([[{ kind: "code", text: "Tab" }], [text("Move.")]], [[text("Esc")], [text("Close.")]]))), /<table>/);
  assert.match(render(handBuilt(rows([[{ kind: "code", text: "Tab" }, text(" key")], [text("Move.")]]))), /<table>/);
  // A three-column table, and a table without rows, are plain tables.
  assert.match(render(handBuilt({ kind: "table", header: [[text("A")], [text("B")], [text("C")]], rows: [[[{ kind: "code", text: "x" }], [text("y")], [text("z")]]] })), /<table>/);
  assert.match(render(handBuilt(rows())), /<table>/);
});

test("a ### heading and paragraph pair is a feature grid only when every heading has exactly one paragraph", () => {
  const heading = (value: string): BlockNode => ({ kind: "heading", children: [text(value)] });
  const grid = render(handBuilt(paragraph(text("Lead.")), heading("A"), paragraph(text("a.")), heading("B"), paragraph(text("b."))));
  assert.match(grid, /<p>Lead\.<\/p><div class="ppo-guide-features"><div><h4>A<\/h4><p>a\.<\/p><\/div><div><h4>B<\/h4><p>b\.<\/p><\/div><\/div>/);
  for (const blocks of [
    [heading("A"), paragraph(text("a.")), heading("B")],
    [heading("A"), heading("B"), paragraph(text("b."))],
    [heading("A"), paragraph(text("a.")), heading("B"), paragraph(text("b.")), paragraph(text("more."))],
  ]) {
    const plain = render(handBuilt(...blocks));
    assert.doesNotMatch(plain, /ppo-guide-features/);
    assert.match(plain, /<h4>A<\/h4>/);
  }
});

test("a numbered step keeps any further blocks inside its text column", () => {
  const strong = (value: string): InlineNode => ({ kind: "strong", children: [text(value)] });
  const item = (title: string, ...more: BlockNode[]): BlockNode[] => [paragraph(strong(title), { kind: "break" }, text("Detail.")), ...more];
  const markup = render(handBuilt({ kind: "list", ordered: true, items: [item("One", { kind: "list", ordered: false, items: [[paragraph(text("nested"))]] }), item("Two")] }));
  assert.match(markup, /<ol class="ppo-guide-steps"><li><span class="ppo-step-number" aria-hidden="true">1<\/span><div><h4>One<\/h4><p>Detail\.<\/p><ul><li>nested<\/li><\/ul><\/div><\/li><li><span class="ppo-step-number" aria-hidden="true">2<\/span><div><h4>Two<\/h4><p>Detail\.<\/p><\/div><\/li><\/ol>/);
  // A bold lead with no line break after it is not a step.
  const noBreak = render(handBuilt({ kind: "list", ordered: true, items: [[paragraph(strong("One"), text(" and more"))]] }));
  assert.match(noBreak, /<ol><li><strong>One<\/strong> and more<\/li><\/ol>/);
});

// The converter in plan Task 6 writes each carried-over guide in this body shape. The same synthetic guide is written
// twice, as the PageGuide the accepted panel takes and as Markdown, and both must give byte-identical markup.
const typography = {
  purpose: "A synthetic record of 3\u00A0mm × 4 at 45°, kept for “synthetic” use.",
  firstFeature: "Views – in the side menu",
  intro: "Your inbox for “synthetic” enquiries – work through each one.",
} as const;
const parityGuide: PageGuide = {
  title: "Synthetic parity",
  intro: typography.intro,
  overviewTitle: "What this page is for",
  purpose: typography.purpose,
  features: [
    [typography.firstFeature, "Inbox holds the records still in play – and Archived holds the rest."],
    ["The next column", "Every record shows its next action, e.g. 10\u00A0×\u00A05\u00A0mm at 30°."],
  ],
  steps: [
    ["Resolve records", "Open the form – then save at 45°."],
    ["Add a record", "Use the “+ Record” button."],
  ],
  journeyIntro: "Most enquiries follow one path through this page.",
  journey: [
    ["An enquiry arrives", "It appears with no next action."],
    ["You make contact", "Set the status – then schedule the next step."],
  ],
  mobile: "On a phone the table is a card list.",
  shortcuts: [
    ["Tab", "Move through the toolbar."],
    ["← →", "Resize the focused column by 10\u00A0pixels."],
    ["Home / End", "Set the focused column to its narrowest or widest."],
  ],
  recovery: "If the list cannot load, the page says so and offers to try again.",
  boundary: "This page shows only what your access allows – “checked again” on save.",
};
const parityMarkdown = [
  "---",
  "guide_key: guide.page.synthetic.parity",
  "entry_key: route:/synthetic/parity",
  "title: Synthetic parity",
  "versioning: git",
  "status: InReview",
  'owner_role: "Prototype content owner: Dean Fiedler"',
  'source_commit: "0123456789abcdef0123456789abcdef01234567"',
  "shown_before_review: true",
  "carried_over_from: src/components/leads-guide.ts",
  "contents: { overview: Overview, how: How to use, journey: Journey map }",
  "list_styles: { journey: journey }",
  "---",
  "Your inbox for “synthetic” enquiries – work through each one.",
  "",
  "## What this page is for {#overview}",
  "",
  "A synthetic record of 3\u00A0mm × 4 at 45°, kept for “synthetic” use.",
  "",
  "### Views – in the side menu",
  "",
  "Inbox holds the records still in play – and Archived holds the rest.",
  "",
  "### The next column",
  "",
  "Every record shows its next action, e.g. 10\u00A0×\u00A05\u00A0mm at 30°.",
  "",
  "## How to use it {#how}",
  "",
  "1. **Resolve records**\\",
  "   Open the form – then save at 45°.",
  "2. **Add a record**\\",
  "   Use the “+ Record” button.",
  "",
  "## Your journey {#journey}",
  "",
  "Most enquiries follow one path through this page.",
  "",
  "1. **An enquiry arrives**\\",
  "   It appears with no next action.",
  "2. **You make contact**\\",
  "   Set the status – then schedule the next step.",
  "",
  "## On your phone {#mobile}",
  "",
  "On a phone the table is a card list.",
  "",
  "## Keyboard shortcuts {#shortcuts}",
  "",
  "| Key | Action |",
  "| --- | --- |",
  "| `Tab` | Move through the toolbar. |",
  "| `← →` | Resize the focused column by 10\u00A0pixels. |",
  "| `Home / End` | Set the focused column to its narrowest or widest. |",
  "",
  "## If something is unavailable {#recovery}",
  "",
  "If the list cannot load, the page says so and offers to try again.",
  "",
  "> [!NOTE]",
  "> This page shows only what your access allows – “checked again” on save.",
  "",
].join("\n");

test("renders a carried-over guide exactly as the accepted panel", () => {
  const result = compileGuide("docs/guides/synthetic-parity.md", parityMarkdown);
  assert.deepEqual(result.errors, []);
  assert.ok(result.guide);
  const accepted = renderToStaticMarkup(acceptedPanel(parityGuide, "Page guide"));
  const rendered = render(result.guide);
  // The comparison must not be vacuous: the markup holds every part of the panel and the typography survives.
  for (const part of ["ppo-guide-features", "ppo-guide-steps", "ppo-guide-journey", "ppo-guide-shortcuts", "<kbd>", "ppo-guide-note", "Page guide"]) {
    assert.ok(accepted.includes(part), `the accepted markup should hold ${part}`);
  }
  for (const character of ["–", "“", "”", "×", "°", "\u00A0", "← →"]) {
    assert.ok(rendered.includes(character), `the rendered markup should keep ${JSON.stringify(character)}`);
  }
  // The non-breaking spaces are written as escapes above. They must reach the compiled text and the rendered markup.
  const [purpose] = result.guide.sections[0].blocks;
  assert.ok(purpose.kind === "paragraph" && purpose.children[0].kind === "text" && purpose.children[0].text.includes("3\u00A0mm × 4"), "the compiled text keeps the non-breaking space");
  assert.ok(rendered.includes("10\u00A0×\u00A05\u00A0mm"), "the rendered markup keeps the non-breaking spaces");
  assert.equal(accepted.match(/<li>/g)?.length, 4);
  assert.equal(accepted.match(/<dt>/g)?.length, 3);
  assert.equal(rendered, accepted);
});

// Task 7 rewrites shell-page-guide.tsx, and deletes the accepted-panel oracle and this guard together.
// The oracle copies lines of the shell panel, so the parity test is only as good as the copy. This guard compares the
// copy with the file as it stands now. The declared differences are the eyebrow expression on line 35, the choice of
// guide on line 33, the line 43 button and the indentation of the jump statements; any other difference is drift.
const shellEyebrow = '{showShell || !pageGuide ? "User guide" : "Page guide"}';
const sourceLines = (source: string) => source.split("\n").map((line) => line.trim());
const copiedSpan = (lines: string[], from: string, to: string) => {
  const start = lines.findIndex((line) => line.startsWith(from));
  const end = start < 0 ? -1 : lines.indexOf(to, start);
  return end > start ? lines.slice(start, end + 1) : undefined;
};
const firstDifference = (actual: string[], expected: string[]) => {
  for (let at = 0; at < Math.max(actual.length, expected.length); at++) {
    if (actual[at] !== expected[at]) return `line ${at + 1} of the block: the oracle has ${JSON.stringify(actual[at])} but the shell has ${JSON.stringify(expected[at])}`;
  }
  return undefined;
};
function oracleDrift(shellSource: string, oracleSource: string): string[] {
  const shell = sourceLines(shellSource);
  const oracle = sourceLines(oracleSource);
  const problems: string[] = [];
  const shellJump = copiedSpan(shell, "const jump = ", "};");
  const oracleJump = copiedSpan(oracle, "const jump = ", "};");
  const shellPanel = copiedSpan(shell, "const numbered = ", "</article>;");
  const oraclePanel = copiedSpan(oracle, "const numbered = ", "</article>;");
  if (!shellJump || !oracleJump || !shellPanel || !oraclePanel) return ["a copied block was not found: the jump handler or the panel from `const numbered` to `</article>;`"];
  if (!shellPanel.some((line) => line.includes(shellEyebrow))) problems.push("the shell no longer holds the eyebrow expression the oracle replaces with {eyebrow}");
  const expectedPanel = shellPanel
    .filter((line) => !line.startsWith("const guide: PageGuide = ") && !line.startsWith("{!showShell && <button"))
    .map((line) => line.replace(shellEyebrow, "{eyebrow}"));
  const panelDifference = firstDifference(oraclePanel, expectedPanel);
  if (panelDifference) problems.push(`panel markup drifted, ${panelDifference}`);
  const jumpDifference = firstDifference(oracleJump, shellJump);
  if (jumpDifference) problems.push(`jump handler drifted, ${jumpDifference}`);
  return problems;
}
// A file that cannot be read fails the guard: it never skips.
const readSource = (relative: string) => {
  try {
    return readFileSync(fileURLToPath(new URL(relative, import.meta.url)), "utf8");
  } catch (error) {
    return assert.fail(`cannot read ${relative}, so the oracle cannot be checked: ${error instanceof Error ? error.message : String(error)}`);
  }
};

test("the accepted-panel oracle still copies shell-page-guide.tsx", () => {
  assert.deepEqual(oracleDrift(readSource("../../src/components/shell-page-guide.tsx"), readSource("./guide-render-accepted.tsx")), []);
});

test("the oracle drift guard fails when the shell panel changes, and when a file cannot be read", () => {
  const shell = readSource("../../src/components/shell-page-guide.tsx");
  const oracle = readSource("./guide-render-accepted.tsx");
  const changed = (find: string, replacement: string) => {
    assert.ok(shell.includes(find), `the shell should hold ${find}`);
    return shell.replace(find, replacement);
  };
  assert.match(oracleDrift(changed("How to use it", "How to use this"), oracle).join("\n"), /panel markup drifted/);
  assert.match(oracleDrift(changed('<section className="ppo-guide-section"><h3>On your phone</h3>', '<section className="ppo-guide-section"><h3>Extra</h3></section>\n    <section className="ppo-guide-section"><h3>On your phone</h3>'), oracle).join("\n"), /panel markup drifted/);
  assert.match(oracleDrift(changed(shellEyebrow, '"Guide"'), oracle).join("\n"), /eyebrow expression/);
  assert.match(oracleDrift(changed('section?.focus({ preventScroll: true });', 'section?.focus();'), oracle).join("\n"), /jump handler drifted/);
  assert.match(oracleDrift(changed("const numbered = ", "const renamed = "), oracle).join("\n"), /was not found/);
  assert.match(oracleDrift(shell, oracle.replace("<h4>{title}</h4>", "<h5>{title}</h5>")).join("\n"), /panel markup drifted/);
  assert.throws(() => readSource("../../src/components/no-such-file.tsx"), /cannot read/);
});
