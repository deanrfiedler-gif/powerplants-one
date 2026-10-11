import { posix } from "node:path";
import { workbookArchive, refuse } from "./archive";
import { attribute, children, NS, rootIs, workbookXml, type XmlNode } from "./xml";

export type Relationship = { id: string; type: string; target: string };
const office = "http://schemas.openxmlformats.org/officeDocument/2006/relationships/";
const relationshipTypes = new Set([
  ...["officeDocument", "worksheet", "table", "styles", "sharedStrings", "theme", "calcChain", "extended-properties", "custom-properties"].map(type => office + type),
  "http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties",
]);
const contentTypes = new Set([
  "application/vnd.openxmlformats-package.relationships+xml",
  "application/xml",
  "application/vnd.openxmlformats-package.core-properties+xml",
  "application/vnd.openxmlformats-officedocument.extended-properties+xml",
  "application/vnd.openxmlformats-officedocument.custom-properties+xml",
  "application/vnd.openxmlformats-officedocument.theme+xml",
  ...["sheet.main", "worksheet", "table", "styles", "sharedStrings", "calcChain"].map(type => `application/vnd.openxmlformats-officedocument.spreadsheetml.${type}+xml`),
]);
const permittedPath = /^(?:\[Content_Types\]\.xml|_rels\/\.rels|docProps\/[A-Za-z0-9_.-]+\.xml|xl\/[A-Za-z0-9_.-]+\.xml|xl\/(?:worksheets|tables|theme)\/[A-Za-z0-9_.-]+\.xml|xl\/_rels\/[A-Za-z0-9_.-]+\.xml\.rels|xl\/(?:worksheets|tables|theme)\/_rels\/[A-Za-z0-9_.-]+\.xml\.rels)$/;

export function resolvePart(owner: string, target: string) {
  if (!target || /[\\%:#?\x00-\x20]/.test(target) || target.startsWith("//")) refuse("External or ambiguous workbook relationships are unsupported.");
  const resolved = posix.normalize(target.startsWith("/") ? target.slice(1) : posix.join(posix.dirname(owner), target));
  if (resolved.startsWith("../") || resolved === ".." || !permittedPath.test(resolved)) refuse("The workbook relationship leaves the supported package.");
  return resolved;
}
function ownerForRelationship(path: string) {
  if (path === "_rels/.rels") return "";
  const match = path.match(/^(.*)\/_rels\/([^/]+)\.rels$/);
  if (!match) refuse("Invalid workbook relationship part.");
  return `${match[1]}/${match[2]}`;
}

export async function workbookPackage(bytes: Buffer, filename: string) {
  const parts = await workbookArchive(bytes, filename), documents = new Map<string, XmlNode>();
  const budget = { remaining: 100000 };
  for (const [name, data] of parts) {
    if (!permittedPath.test(name)) refuse("Remove macros, embedded objects, external connections and unsupported parts from the pilot workbook.");
    documents.set(name, workbookXml(data, budget));
  }
  const required = (path: string) => {
    const document = documents.get(path);
    if (!document) refuse("A required workbook package part is missing.");
    return document;
  };
  const types = rootIs(required("[Content_Types].xml"), "Types", NS.content);
  const defaults = new Map<string, string>(), overrides = new Map<string, string>();
  for (const node of types.children) {
    if (node.ns !== NS.content || !["Default", "Override"].includes(node.name)) refuse("Unsupported workbook content-type declaration.");
    const type = attribute(node, "ContentType");
    if (!type || !contentTypes.has(type)) refuse("The workbook contains an unsupported content type.");
    if (node.name === "Default") {
      const extension = attribute(node, "Extension");
      if (!extension || !["xml", "rels"].includes(extension) || defaults.has(extension)) refuse("Duplicate or unsupported workbook extension.");
      defaults.set(extension, type);
    } else {
      const name = attribute(node, "PartName");
      if (!name?.startsWith("/") || !permittedPath.test(name.slice(1)) || overrides.has(name.slice(1)) || !documents.has(name.slice(1))) refuse("Invalid or duplicate workbook content-type target.");
      overrides.set(name.slice(1), type);
    }
  }
  for (const name of parts.keys()) {
    if (name === "[Content_Types].xml") continue;
    if (!overrides.has(name) && !defaults.has(name.endsWith(".rels") ? "rels" : posix.extname(name).slice(1))) refuse("A workbook part has no declared content type.");
  }
  const relationships = new Map<string, Map<string, Relationship>>();
  for (const [path, document] of documents) {
    if (!path.endsWith(".rels")) continue;
    rootIs(document, "Relationships", NS.package);
    const owner = ownerForRelationship(path), rows = new Map<string, Relationship>();
    if (owner && !documents.has(owner)) refuse("A workbook relationship has no owning part.");
    for (const rel of document.children) {
      if (rel.ns !== NS.package || rel.name !== "Relationship") refuse("Unsupported workbook relationship declaration.");
      const id = attribute(rel, "Id"), type = attribute(rel, "Type"), mode = attribute(rel, "TargetMode"), target = attribute(rel, "Target");
      if (!id || rows.has(id) || !type || !relationshipTypes.has(type) || (mode && mode !== "Internal") || !target) refuse("External, duplicate or unsupported workbook relationships are not accepted.");
      const resolved = resolvePart(owner, target);
      if (!documents.has(resolved)) refuse("A workbook relationship points to a missing package part.");
      rows.set(id, { id, type, target: resolved });
    }
    relationships.set(owner, rows);
  }
  const follow = (owner: string, id: string, kind: string) => {
    const relation = relationships.get(owner)?.get(id);
    if (!relation || relation.type !== office + kind) refuse(`A workbook ${kind} relationship is missing or invalid.`);
    return relation.target;
  };
  const offices = [...(relationships.get("")?.values() ?? [])].filter(row => row.type === office + "officeDocument");
  if (offices.length !== 1) refuse("The workbook must declare one spreadsheet document.");
  const workbookPath = offices[0].target;
  if (overrides.get(workbookPath) !== "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml") refuse("Use a macro-free standard .xlsx workbook.");
  const workbook = rootIs(required(workbookPath), "workbook");
  if (children(workbook, "workbookPr").some(node => ["true", "1"].includes(attribute(node, "date1904") ?? ""))) refuse("The pilot supports the 1900 Excel date system only.");
  return { workbook, workbookPath, documents, required, relationships, follow };
}
