"use client";
import Link from "next/link";
import { Fragment, type ReactNode } from "react";
import { linkShape } from "./links";
import { maxNesting, type BlockNode, type CompiledGuide, type GuideFrontMatter, type GuideSection, type InlineNode } from "./model";

// Renders a compiled guide (ADR-0065, decision 7). React draws every node, so text is escaped and no HTML string is
// ever built: nothing under src/guides uses an HTML injection API, and a unit test fails if one does. A guide carried
// over from a TypeScript page guide gives exactly the markup of the accepted panel in
// src/components/shell-page-guide.tsx. This module imports no Node modules, so a client component can use it.
//
// A compiled guide may have been edited by hand, so nothing here trusts the shape the types describe. A node of an
// unknown kind, a missing or non-array list, and text that is not a string each draw nothing and never throw: one bad
// node must not take down the whole panel. Nor can nesting: a list, callout, bold or italic text or link deeper than
// maxNesting draws nothing, as the compiler refuses it.

// A route link needs only an address and its text, so the shell can pass the component its router uses.
export type GuideLinkProps = { href: string; children: ReactNode };
export type GuideLinkComponent = (props: GuideLinkProps) => ReactNode;

export type GuideArticleProps = {
  guide: CompiledGuide;
  eyebrow: string;
  children?: ReactNode;
  // Called with the guide key and section ID of a guide:<key>#<section> link. Without it, those links show as text.
  onOpenGuide?: (key: string, section: string) => void;
  LinkComponent?: GuideLinkComponent; // defaults to next/link
};

// `depth` counts the lists, callouts, bold and italic text and links around the node being drawn.
type Context = { LinkComponent: GuideLinkComponent; onOpenGuide?: GuideArticleProps["onOpenGuide"]; depth: number };
type List = Extract<BlockNode, { kind: "list" }>;
type Table = Extract<BlockNode, { kind: "table" }>;
type Callout = Extract<BlockNode, { kind: "callout" }>;

const newTabSuffix = " (opens in a new tab)";

// What the model says is an array may be anything in a hand-edited guide: use it only when it is one.
function array<T>(value: readonly T[] | undefined): readonly T[] {
  return Array.isArray(value) ? value : [];
}

const isObject = (value: unknown): boolean => typeof value === "object" && value !== null && !Array.isArray(value);

// The context one level deeper, or undefined past maxNesting, where a container draws nothing.
const deeper = (context: Context): Context | undefined => (context.depth < maxNesting ? { ...context, depth: context.depth + 1 } : undefined);

// The accepted panel's jump (shell-page-guide.tsx): focus the heading without scrolling, then scroll it to the top.
function jump(id: string) {
  const section = document.getElementById(id);
  section?.focus({ preventScroll: true });
  section?.scrollIntoView({ block: "start", behavior: "instant" });
}

export function GuideArticle({ guide, eyebrow, children, onOpenGuide, LinkComponent = Link }: GuideArticleProps) {
  const front: Partial<GuideFrontMatter> = isObject(guide.front) ? guide.front : {};
  const context: Context = { LinkComponent, onOpenGuide, depth: 0 };
  const sections: readonly GuideSection[] = array(guide.sections).filter(isObject);
  // A contents map in the front matter names the sections that get a button, in its order and with its labels.
  // Without one, every section gets a button with its own title.
  const mapped = Object.entries(isObject(front.contents) ? front.contents ?? {} : {}).filter(([, label]) => typeof label === "string");
  const contents = mapped.length > 0
    ? mapped.map(([id, label]) => ({ id, label }))
    : sections.filter((section) => typeof section.id === "string").map((section) => ({ id: section.id, label: plainText(section.title) }));
  const jumpTargets = new Set(contents.map((entry) => entry.id));
  const listStyles = isObject(front.list_styles) ? front.list_styles : {};
  return <article className="ppo-page-guide">
    <div className="ppo-guide-intro"><span className="ppo-guide-eyebrow">{eyebrow}</span><h3>{typeof front.title === "string" ? front.title : null}</h3>{array(guide.lead).map((node, index) => block(node, index, context, false))}</div>
    <nav className="ppo-guide-contents" aria-label="Guide sections">{contents.map(({ id, label }, index) => <button key={index} onClick={() => jump(`ppo-guide-${id}`)}>{label}</button>)}</nav>
    {sections.map((section, index) => {
      const known = typeof section.id === "string";
      const target = known && jumpTargets.has(section.id);
      return <section key={index} className="ppo-guide-section">
        <h3 id={target ? `ppo-guide-${section.id}` : undefined} tabIndex={target ? -1 : undefined}>{inline(section.title, context)}</h3>
        {sectionBlocks(section.blocks, context, known && (listStyles as Record<string, unknown>)[section.id] === "journey")}
      </section>;
    })}
    {children}
  </article>;
}

// The text of inline nodes with no formatting, for a contents button that falls back to the section title.
function plainText(nodes: readonly InlineNode[] | undefined, depth = 0): string {
  return array(nodes).map((node) => {
    switch (node?.kind) {
      case "text":
      case "code":
        return typeof node.text === "string" ? node.text : "";
      case "break":
        return " ";
      case "strong":
      case "emphasis":
      case "link":
        return depth < maxNesting ? plainText(node.children, depth + 1) : "";
      default:
        return ""; // an unknown kind, or not a node at all
    }
  }).join("");
}

function inline(nodes: readonly InlineNode[] | undefined, context: Context): ReactNode[] {
  return array(nodes).map((node, index) => inlineNode(node, index, context));
}

function inlineNode(node: InlineNode, key: number, context: Context): ReactNode {
  switch (node?.kind) {
    case "text":
      return typeof node.text === "string" ? node.text : null;
    case "strong": {
      const inner = deeper(context);
      return inner ? <strong key={key}>{inline(node.children, inner)}</strong> : null;
    }
    case "emphasis": {
      const inner = deeper(context);
      return inner ? <em key={key}>{inline(node.children, inner)}</em> : null;
    }
    case "code":
      return typeof node.text === "string" ? <code key={key}>{node.text}</code> : null;
    case "break":
      return <br key={key} />;
    case "link": {
      const inner = deeper(context);
      return inner ? link(typeof node.href === "string" ? node.href : "", inline(node.children, inner), key, inner) : null;
    }
    default:
      return null; // an unknown kind, or not a node at all: draw nothing
  }
}

// The compiler refuses unsafe links, and this checks again in case a compiled guide was edited by hand. A link that
// fails the check shows its text and nothing else, so no element carries its address.
function link(href: string, content: ReactNode[], key: number, { LinkComponent, onOpenGuide }: Context): ReactNode {
  switch (linkShape(href)) {
    case "route":
      return <LinkComponent key={key} href={href}>{content}</LinkComponent>;
    case "guide": {
      if (!onOpenGuide) return <Fragment key={key}>{content}</Fragment>;
      const [guideKey, section] = href.slice("guide:".length).split("#");
      return <button key={key} type="button" onClick={() => onOpenGuide(guideKey, section)}>{content}</button>;
    }
    case "https":
      return <a key={key} href={href} target="_blank" rel="noopener noreferrer">{content}{newTabSuffix}</a>;
    default:
      return <Fragment key={key}>{content}</Fragment>; // refused
  }
}

function block(node: BlockNode, key: number, context: Context, journey: boolean): ReactNode {
  switch (node?.kind) {
    case "paragraph":
      return <p key={key}>{inline(node.children, context)}</p>;
    case "heading":
      return <h4 key={key}>{inline(node.children, context)}</h4>;
    case "list": {
      const inner = deeper(context);
      return inner ? list(node, key, inner, journey) : null;
    }
    case "table":
      return table(node, key, context);
    case "callout": {
      const inner = deeper(context);
      return inner ? callout(node, key, inner) : null;
    }
    default:
      return null; // an unknown kind, or not a node at all: draw nothing
  }
}

function blocks(nodes: readonly BlockNode[] | undefined, context: Context): ReactNode[] {
  return array(nodes).map((node, index) => block(node, index, context, false));
}

// The blocks of a ## section. Headings and their paragraphs make the feature grid only when every ### heading has
// exactly one paragraph under it, since a heading owns everything up to the next one. `journey` is the front matter's
// list style for this section: it turns numbered steps into the journey band.
function sectionBlocks(nodes: readonly BlockNode[] | undefined, context: Context, journey: boolean): ReactNode[] {
  const all = array(nodes);
  const first = all.findIndex((node) => node?.kind === "heading");
  const features = first < 0 ? undefined : featurePairs(all.slice(first));
  if (!features) return all.map((node, index) => block(node, index, context, journey));
  return [
    ...all.slice(0, first).map((node, index) => block(node, index, context, journey)),
    <div key="features" className="ppo-guide-features">{features.map(({ title, text }, index) => <div key={index}><h4>{inline(title, context)}</h4><p>{inline(text, context)}</p></div>)}</div>,
  ];
}

function featurePairs(run: readonly BlockNode[]): { title: readonly InlineNode[]; text: readonly InlineNode[] }[] | undefined {
  const pairs: { title: readonly InlineNode[]; text: readonly InlineNode[] }[] = [];
  for (let at = 0; at < run.length; at += 2) {
    const title = run[at];
    const text = run[at + 1];
    if (title?.kind !== "heading" || text?.kind !== "paragraph") return undefined;
    pairs.push({ title: array(title.children), text: array(text.children) });
  }
  return pairs;
}

type Step = { title: readonly InlineNode[]; text: readonly InlineNode[]; more: readonly BlockNode[] };

// Numbered steps: every item opens with a paragraph that starts with a bold lead and a line break.
function stepsOf(items: readonly (readonly BlockNode[])[]): Step[] | undefined {
  const steps: Step[] = [];
  for (const [first, ...more] of items) {
    if (first?.kind !== "paragraph") return undefined;
    const [lead, lineBreak, ...text] = array(first.children);
    if (lead?.kind !== "strong" || lineBreak?.kind !== "break") return undefined;
    steps.push({ title: array(lead.children), text, more });
  }
  return steps.length > 0 ? steps : undefined;
}

function list(node: List, key: number, context: Context, journey: boolean): ReactNode {
  const items = array(node.items).map((item) => array(item));
  const steps = node.ordered ? stepsOf(items) : undefined;
  if (steps) {
    return <ol key={key} className={journey ? "ppo-guide-journey" : "ppo-guide-steps"}>{steps.map(({ title, text, more }, index) => <li key={index}>
      <span className="ppo-step-number" aria-hidden="true">{index + 1}</span>
      <div><h4>{inline(title, context)}</h4>{text.length > 0 && <p>{inline(text, context)}</p>}{blocks(more, context)}</div>
    </li>)}</ol>;
  }
  const Tag = node.ordered ? "ol" : "ul";
  // The model does not record whether a list was loose, so an item holding one paragraph shows that text directly.
  return <Tag key={key}>{items.map((item, index) => <li key={index}>{item.length === 1 && item[0]?.kind === "paragraph" ? inline(item[0].children, context) : blocks(item, context)}</li>)}</Tag>;
}

// A two-column table whose every key is a single code span is a shortcut list. Its header row is not shown.
function shortcutsOf(node: Table): { key: string; text: readonly InlineNode[] }[] | undefined {
  const rows = array(node.rows).map((row) => array(row));
  if (array(node.header).length !== 2 || rows.length === 0) return undefined;
  const shortcuts: { key: string; text: readonly InlineNode[] }[] = [];
  for (const row of rows) {
    const cell = row.length === 2 ? array(row[0]) : [];
    const key = cell.length === 1 ? cell[0] : undefined;
    if (key?.kind !== "code" || typeof key.text !== "string") return undefined;
    shortcuts.push({ key: key.text, text: array(row[1]) });
  }
  return shortcuts;
}

function table(node: Table, key: number, context: Context): ReactNode {
  const shortcuts = shortcutsOf(node);
  if (shortcuts) {
    return <dl key={key} className="ppo-guide-shortcuts">{shortcuts.map((shortcut, index) => <div key={index}><dt><kbd>{shortcut.key}</kbd></dt><dd>{inline(shortcut.text, context)}</dd></div>)}</dl>;
  }
  return <table key={key}>
    <thead><tr>{array(node.header).map((cell, index) => <th key={index} scope="col">{inline(cell, context)}</th>)}</tr></thead>
    <tbody>{array(node.rows).map((row, index) => <tr key={index}>{array(row).map((cell, at) => <td key={at}>{inline(cell, context)}</td>)}</tr>)}</tbody>
  </table>;
}

// A note holding one paragraph is the accepted panel's boundary box: the text sits directly in the box.
function callout(node: Callout, key: number, context: Context): ReactNode {
  const inner = array(node.children);
  const only = inner.length === 1 ? inner[0] : undefined;
  if (node.tone === "note" && only?.kind === "paragraph") return <div key={key} className="ppo-guide-note">{inline(only.children, context)}</div>;
  return <div key={key} className="ppo-guide-note" data-tone={typeof node.tone === "string" ? node.tone : undefined}>{blocks(inner, context)}</div>;
}
