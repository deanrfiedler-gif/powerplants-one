"use client";
import Link from "next/link";
import { Fragment, type ReactNode } from "react";
import { linkShape } from "./links";
import type { BlockNode, CompiledGuide, InlineNode } from "./model";

// Renders a compiled guide (ADR-0065, decision 7). React draws every node, so text is escaped and no HTML string is
// ever built: nothing under src/guides uses an HTML injection API, and a unit test fails if one does. A guide carried
// over from a TypeScript page guide gives exactly the markup of the accepted panel in
// src/components/shell-page-guide.tsx. This module imports no Node modules, so a client component can use it.

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

type Context = { LinkComponent: GuideLinkComponent; onOpenGuide?: GuideArticleProps["onOpenGuide"] };
type List = Extract<BlockNode, { kind: "list" }>;
type Table = Extract<BlockNode, { kind: "table" }>;
type Callout = Extract<BlockNode, { kind: "callout" }>;

const newTabSuffix = " (opens in a new tab)";

// The accepted panel's jump (shell-page-guide.tsx): focus the heading without scrolling, then scroll it to the top.
function jump(id: string) {
  const section = document.getElementById(id);
  section?.focus({ preventScroll: true });
  section?.scrollIntoView({ block: "start", behavior: "instant" });
}

export function GuideArticle({ guide, eyebrow, children, onOpenGuide, LinkComponent = Link }: GuideArticleProps) {
  const { front } = guide;
  const context: Context = { LinkComponent, onOpenGuide };
  // A contents map in the front matter names the sections that get a button, in its order and with its labels.
  // Without one, every section gets a button with its own title.
  const mapped = Object.entries(front.contents);
  const contents = mapped.length > 0
    ? mapped.map(([id, label]) => ({ id, label }))
    : guide.sections.map((section) => ({ id: section.id, label: plainText(section.title) }));
  const jumpTargets = new Set(contents.map((entry) => entry.id));
  return <article className="ppo-page-guide">
    <div className="ppo-guide-intro"><span className="ppo-guide-eyebrow">{eyebrow}</span><h3>{front.title}</h3>{guide.lead.map((node, index) => block(node, index, context, false))}</div>
    <nav className="ppo-guide-contents" aria-label="Guide sections">{contents.map(({ id, label }, index) => <button key={index} onClick={() => jump(`ppo-guide-${id}`)}>{label}</button>)}</nav>
    {guide.sections.map((section, index) => {
      const target = jumpTargets.has(section.id);
      return <section key={index} className="ppo-guide-section">
        <h3 id={target ? `ppo-guide-${section.id}` : undefined} tabIndex={target ? -1 : undefined}>{inline(section.title, context)}</h3>
        {sectionBlocks(section.blocks, context, front.list_styles[section.id] === "journey")}
      </section>;
    })}
    {children}
  </article>;
}

// The text of inline nodes with no formatting, for a contents button that falls back to the section title.
function plainText(nodes: InlineNode[]): string {
  return nodes.map((node) => (node.kind === "text" || node.kind === "code" ? node.text : node.kind === "break" ? " " : plainText(node.children))).join("");
}

function inline(nodes: InlineNode[], context: Context): ReactNode[] {
  return nodes.map((node, index) => inlineNode(node, index, context));
}

function inlineNode(node: InlineNode, key: number, context: Context): ReactNode {
  switch (node.kind) {
    case "text":
      return node.text;
    case "strong":
      return <strong key={key}>{inline(node.children, context)}</strong>;
    case "emphasis":
      return <em key={key}>{inline(node.children, context)}</em>;
    case "code":
      return <code key={key}>{node.text}</code>;
    case "break":
      return <br key={key} />;
    case "link":
      return link(node.href, inline(node.children, context), key, context);
    default:
      return null; // a node kind this renderer does not know, from a hand-edited model: draw nothing
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
  switch (node.kind) {
    case "paragraph":
      return <p key={key}>{inline(node.children, context)}</p>;
    case "heading":
      return <h4 key={key}>{inline(node.children, context)}</h4>;
    case "list":
      return list(node, key, context, journey);
    case "table":
      return table(node, key, context);
    case "callout":
      return callout(node, key, context);
    default:
      return null; // a node kind this renderer does not know, from a hand-edited model: draw nothing
  }
}

function blocks(nodes: BlockNode[], context: Context): ReactNode[] {
  return nodes.map((node, index) => block(node, index, context, false));
}

// The blocks of a ## section. Headings and their paragraphs make the feature grid only when every ### heading has
// exactly one paragraph under it, since a heading owns everything up to the next one. `journey` is the front matter's
// list style for this section: it turns numbered steps into the journey band.
function sectionBlocks(nodes: BlockNode[], context: Context, journey: boolean): ReactNode[] {
  const first = nodes.findIndex((node) => node.kind === "heading");
  const features = first < 0 ? undefined : featurePairs(nodes.slice(first));
  if (!features) return nodes.map((node, index) => block(node, index, context, journey));
  return [
    ...nodes.slice(0, first).map((node, index) => block(node, index, context, journey)),
    <div key="features" className="ppo-guide-features">{features.map(({ title, text }, index) => <div key={index}><h4>{inline(title, context)}</h4><p>{inline(text, context)}</p></div>)}</div>,
  ];
}

function featurePairs(run: BlockNode[]): { title: InlineNode[]; text: InlineNode[] }[] | undefined {
  const pairs: { title: InlineNode[]; text: InlineNode[] }[] = [];
  for (let at = 0; at < run.length; at += 2) {
    const title = run[at];
    const text = run[at + 1];
    if (title?.kind !== "heading" || text?.kind !== "paragraph") return undefined;
    pairs.push({ title: title.children, text: text.children });
  }
  return pairs;
}

type Step = { title: InlineNode[]; text: InlineNode[]; more: BlockNode[] };

// Numbered steps: every item opens with a paragraph that starts with a bold lead and a line break.
function stepsOf(items: BlockNode[][]): Step[] | undefined {
  const steps: Step[] = [];
  for (const [first, ...more] of items) {
    if (first?.kind !== "paragraph") return undefined;
    const [lead, lineBreak, ...text] = first.children;
    if (lead?.kind !== "strong" || lineBreak?.kind !== "break") return undefined;
    steps.push({ title: lead.children, text, more });
  }
  return steps.length > 0 ? steps : undefined;
}

function list(node: List, key: number, context: Context, journey: boolean): ReactNode {
  const steps = node.ordered ? stepsOf(node.items) : undefined;
  if (steps) {
    return <ol key={key} className={journey ? "ppo-guide-journey" : "ppo-guide-steps"}>{steps.map(({ title, text, more }, index) => <li key={index}>
      <span className="ppo-step-number" aria-hidden="true">{index + 1}</span>
      <div><h4>{inline(title, context)}</h4>{text.length > 0 && <p>{inline(text, context)}</p>}{blocks(more, context)}</div>
    </li>)}</ol>;
  }
  const Tag = node.ordered ? "ol" : "ul";
  // The model does not record whether a list was loose, so an item holding one paragraph shows that text directly.
  return <Tag key={key}>{node.items.map((item, index) => <li key={index}>{item.length === 1 && item[0].kind === "paragraph" ? inline(item[0].children, context) : blocks(item, context)}</li>)}</Tag>;
}

// A two-column table whose every key is a single code span is a shortcut list. Its header row is not shown.
function shortcutsOf(node: Table): { key: string; text: InlineNode[] }[] | undefined {
  if (node.header.length !== 2 || node.rows.length === 0) return undefined;
  const shortcuts: { key: string; text: InlineNode[] }[] = [];
  for (const row of node.rows) {
    const key = row.length === 2 && row[0].length === 1 ? row[0][0] : undefined;
    if (key?.kind !== "code") return undefined;
    shortcuts.push({ key: key.text, text: row[1] });
  }
  return shortcuts;
}

function table(node: Table, key: number, context: Context): ReactNode {
  const shortcuts = shortcutsOf(node);
  if (shortcuts) {
    return <dl key={key} className="ppo-guide-shortcuts">{shortcuts.map((shortcut, index) => <div key={index}><dt><kbd>{shortcut.key}</kbd></dt><dd>{inline(shortcut.text, context)}</dd></div>)}</dl>;
  }
  return <table key={key}>
    <thead><tr>{node.header.map((cell, index) => <th key={index} scope="col">{inline(cell, context)}</th>)}</tr></thead>
    <tbody>{node.rows.map((row, index) => <tr key={index}>{row.map((cell, at) => <td key={at}>{inline(cell, context)}</td>)}</tr>)}</tbody>
  </table>;
}

// A note holding one paragraph is the accepted panel's boundary box: the text sits directly in the box.
function callout(node: Callout, key: number, context: Context): ReactNode {
  const only = node.children.length === 1 ? node.children[0] : undefined;
  if (node.tone === "note" && only?.kind === "paragraph") return <div key={key} className="ppo-guide-note">{inline(only.children, context)}</div>;
  return <div key={key} className="ppo-guide-note" data-tone={node.tone}>{blocks(node.children, context)}</div>;
}
