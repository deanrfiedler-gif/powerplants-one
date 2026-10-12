import { XMLParser } from "fast-xml-parser";
import { refuse, WorkbookRejected, WORKBOOK_LIMITS } from "./archive";

export const NS = Object.freeze({
  main: "http://schemas.openxmlformats.org/spreadsheetml/2006/main",
  rel: "http://schemas.openxmlformats.org/officeDocument/2006/relationships",
  package: "http://schemas.openxmlformats.org/package/2006/relationships",
  content: "http://schemas.openxmlformats.org/package/2006/content-types",
});
export type XmlNode = {
  name: string;
  ns: string;
  attrs: Map<string, string>;
  children: XmlNode[];
  text: string;
};
type OrderedNode = Record<string, unknown>;
export type XmlBudget = { remaining: number };

function expanded(
  qname: string,
  namespaces: Map<string, string>,
  attribute = false,
) {
  const bits = qname.split(":");
  if (bits.length > 2 || bits.some((bit) => !bit))
    refuse("Invalid XML name in workbook.");
  const prefix = bits.length === 2 ? bits[0] : "",
    name = bits.at(-1)!;
  const ns = !prefix && attribute ? "" : (namespaces.get(prefix) ?? "");
  if (prefix && !ns) refuse("An XML namespace prefix is not declared.");
  return { name, ns };
}

function element(
  value: OrderedNode,
  inherited: Map<string, string>,
  depth: number,
): XmlNode {
  if (depth > WORKBOOK_LIMITS.xmlDepth)
    refuse("Workbook XML nesting exceeds 64 levels.");
  const keys = Object.keys(value).filter((key) => key !== ":@");
  if (keys.length !== 1 || keys[0].startsWith("#") || keys[0].startsWith("?"))
    refuse("Unsupported workbook XML node.");
  const attributes = (value[":@"] ?? {}) as Record<string, string>,
    namespaces = new Map(inherited);
  for (const [key, val] of Object.entries(attributes)) {
    if (key === "xmlns") namespaces.set("", val);
    else if (key.startsWith("xmlns:")) namespaces.set(key.slice(6), val);
  }
  const { name, ns } = expanded(keys[0], namespaces),
    attrs = new Map<string, string>();
  for (const [key, val] of Object.entries(attributes)) {
    if (key === "xmlns" || key.startsWith("xmlns:")) continue;
    const a = expanded(key, namespaces, true),
      canonical = `${a.ns}|${a.name}`;
    if (attrs.has(canonical)) refuse("Duplicate expanded XML attribute.");
    attrs.set(canonical, val);
  }
  const children: XmlNode[] = [];
  let text = "";
  if (!Array.isArray(value[keys[0]])) refuse("Invalid workbook XML structure.");
  for (const child of value[keys[0]] as OrderedNode[]) {
    if (Object.hasOwn(child, "#text")) text += String(child["#text"]);
    else if (Object.keys(child).some((key) => key.startsWith("?")))
      refuse("Workbook processing instructions are unsupported.");
    else children.push(element(child, namespaces, depth + 1));
  }
  return { name, ns, attrs, children, text };
}

export function workbookXml(
  bytes: Buffer,
  budget: XmlBudget = { remaining: 100000 },
): XmlNode {
  try {
    const text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    if (/[\x00]/.test(text) || /<!DOCTYPE|<!ENTITY/i.test(text))
      refuse("Workbook XML declarations and custom entities are unsupported.");
    const encoding = text.match(
      /^\s*<\?xml\s[^?]*encoding\s*=\s*["']([^"']+)["']/i,
    )?.[1];
    if (encoding && !/^utf-8$/i.test(encoding))
      refuse("Use UTF-8 workbook XML.");
    const parser = new XMLParser({
      preserveOrder: true,
      ignoreAttributes: false,
      attributeNamePrefix: "",
      parseTagValue: false,
      parseAttributeValue: false,
      trimValues: false,
      ignoreDeclaration: true,
      maxNestedTags: WORKBOOK_LIMITS.xmlDepth,
      processEntities: {
        enabled: true,
        maxEntityCount: 0,
        maxTotalExpansions: 100000,
        maxExpandedLength: WORKBOOK_LIMITS.expanded,
      },
      htmlEntities: false,
      updateTag: (name) => {
        if (--budget.remaining < 0)
          refuse("Workbook XML exceeds the 100,000-element limit.");
        return name;
      },
    });
    const nodes = parser.parse(text, true) as OrderedNode[];
    const roots = nodes.filter((node) => !Object.hasOwn(node, "#text"));
    if (
      roots.length !== 1 ||
      nodes.some(
        (node) => Object.hasOwn(node, "#text") && String(node["#text"]).trim(),
      )
    )
      refuse("Workbook XML requires one root element.");
    return element(
      roots[0],
      new Map([["xml", "http://www.w3.org/XML/1998/namespace"]]),
      1,
    );
  } catch (error) {
    if (error instanceof WorkbookRejected) throw error;
    refuse("Workbook XML is malformed or exceeds the supported bounds.");
  }
}

export const attribute = (node: XmlNode, name: string, ns = "") =>
  node.attrs.get(`${ns}|${name}`);
export const children = (node: XmlNode, name: string, ns: string = NS.main) =>
  node.children.filter((child) => child.name === name && child.ns === ns);
export function single(
  node: XmlNode,
  name: string,
  ns: string = NS.main,
  required = true,
) {
  const found = children(node, name, ns);
  if (found.length > 1 || (required && !found.length))
    refuse(`Workbook requires one ${name} element.`);
  return found[0];
}
export function rootIs(node: XmlNode, name: string, ns: string = NS.main) {
  if (node.name !== name || node.ns !== ns)
    refuse(`Unsupported workbook ${name} structure or namespace.`);
  return node;
}
export const allText = (node: XmlNode): string =>
  node.text + node.children.map(allText).join("");
