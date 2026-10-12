import { readFileSync } from "node:fs";
import { crc32, deflateRawSync } from "node:zlib";

// Independently constructed synthetic OOXML, based on the retained r01 fixture.
// These headers are contract fixtures, deliberately not imported from the reader.
export const headers = [
  ["field", "value"],
  [
    "section_ref",
    "label",
    "facility_ref",
    "growing_area_ref",
    "system",
    "phase",
  ],
  ["scope_ref", "kind", "text"],
  [
    "source_ref",
    "source_kind",
    "supplier_label",
    "document_ref",
    "source_date",
    "valid_until",
    "internal_notes",
  ],
  [
    "line_ref",
    "section_ref",
    "description",
    "category",
    "quantity",
    "unit",
    "unit_cost",
    "unit_sell",
    "allowance",
    "source_ref",
    "source_date",
    "include",
    "print",
    "source_sheet",
    "source_row",
    "workbook_cost",
    "workbook_sell",
  ],
  ["control", "value"],
];
const names = ["Metadata", "Sections", "Scope", "Sources", "Lines", "Control"];
export const spreadsheet =
  "http://schemas.openxmlformats.org/spreadsheetml/2006/main";
export const relation =
  "http://schemas.openxmlformats.org/officeDocument/2006/relationships";
const packageNs =
  "http://schemas.openxmlformats.org/package/2006/relationships";
const contentNs =
  "http://schemas.openxmlformats.org/package/2006/content-types";
const sheetType = "application/vnd.openxmlformats-officedocument.spreadsheetml";
type Scalar = string | number | boolean;
type Fixture = {
  metadata: Record<string, string>;
  sections: Scalar[][];
  scope: Scalar[][];
  sources: Scalar[][];
  lines: Scalar[][];
};
const fixture = JSON.parse(
  readFileSync(
    new URL(
      "../../docs/blueprints/excel-estimate-import/fixture.json",
      import.meta.url,
    ),
    "utf8",
  ),
) as Fixture;
export type WorkbookParts = Record<string, string>;
export const linesSheet = "xl/worksheets/sheet5.xml";
export const linesTable = "xl/tables/table5.xml";
export const escapeXml = (value: string) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");

function column(n: number) {
  let value = "";
  for (; n; n = Math.floor((n - 1) / 26))
    value = String.fromCharCode(65 + ((n - 1) % 26)) + value;
  return value;
}
function cell(value: Scalar, address: string) {
  if (typeof value === "boolean")
    return `<c r="${address}" t="b"><v>${Number(value)}</v></c>`;
  if (typeof value === "number") return `<c r="${address}"><v>${value}</v></c>`;
  return `<c r="${address}" t="inlineStr"><is><t xml:space="preserve">${escapeXml(value)}</t></is></c>`;
}

export function workbookParts(): WorkbookParts {
  const costs = [
    14500, 1350, 18500, 1218.38, 1400, 11160, 204, 5600, 4200, 2040, 1500, 1280,
  ];
  const sells = [
    19000, 1920, 24500, 1669.63, 1960, 14880, 288, 8800, 5400, 3240, 1950, 2000,
  ];
  const rows: Scalar[][][] = [
    Object.entries(fixture.metadata),
    fixture.sections,
    fixture.scope,
    fixture.sources,
    fixture.lines.map((row, i) => [
      ...row,
      "SYN Calculation",
      i + 6,
      costs[i],
      sells[i],
    ]),
    [
      ["line_count", 12],
      ["workbook_cost", 62952.38],
      ["workbook_sell", 85607.63],
      ["included_sell", 85607.63],
    ],
  ];
  const parts: WorkbookParts = {
    "_rels/.rels": `<Relationships xmlns="${packageNs}"><Relationship Id="book" Type="${relation}/officeDocument" Target="/xl/workbook.xml"/></Relationships>`,
    "xl/workbook.xml": `<workbook xmlns="${spreadsheet}" xmlns:r="${relation}"><workbookPr date1904="0"/><sheets>${names.map((name, i) => `<sheet name="SYN ${name}" sheetId="${i + 1}" r:id="sheet${i + 1}"/>`).join("")}</sheets></workbook>`,
    "xl/_rels/workbook.xml.rels": `<Relationships xmlns="${packageNs}">${names.map((_, i) => `<Relationship Id="sheet${i + 1}" Type="${relation}/worksheet" Target="worksheets/sheet${i + 1}.xml"/>`).join("")}</Relationships>`,
  };
  const types = [
    `<Override PartName="/xl/workbook.xml" ContentType="${sheetType}.sheet.main+xml"/>`,
  ];
  for (let i = 0; i < names.length; i++) {
    const id = i + 1;
    const tableRows = [headers[i], ...rows[i]];
    const data = tableRows
      .map(
        (row, r) =>
          `<row r="${r + 5}"${i === 4 && r === 2 ? ' hidden="1"' : ""}>${row
            .map((value, c) => {
              const address = `${column(c + 1)}${r + 5}`;
              return i === 4 && r > 0 && c >= 15
                ? `<c r="${address}"><f>ROUND(E${r + 5}*${c === 15 ? "G" : "H"}${r + 5},2)</f><v>${value}</v></c>`
                : cell(value, address);
            })
            .join("")}</row>`,
      )
      .join("");
    const extra =
      i === 4
        ? '<row r="105"><c r="P105" t="str"><f>IF(A105=&quot;&quot;,&quot;&quot;,1)</f><v></v></c></row>'
        : "";
    parts[`xl/worksheets/sheet${id}.xml`] =
      `<worksheet xmlns="${spreadsheet}" xmlns:r="${relation}"><sheetData>${data}${extra}</sheetData><tableParts count="1"><tablePart r:id="table"/></tableParts></worksheet>`;
    parts[`xl/worksheets/_rels/sheet${id}.xml.rels`] =
      `<Relationships xmlns="${packageNs}"><Relationship Id="table" Type="${relation}/table" Target="../tables/table${id}.xml"/></Relationships>`;
    const end = i === 4 ? 105 : rows[i].length + 5;
    parts[`xl/tables/table${id}.xml`] =
      `<table xmlns="${spreadsheet}" id="${id}" name="PPO_${names[i]}" displayName="PPO_${names[i]}" ref="A5:${column(headers[i].length)}${end}" totalsRowCount="0"><tableColumns count="${headers[i].length}">${headers[i].map((name, c) => `<tableColumn id="${c + 1}" name="${name}"/>`).join("")}</tableColumns></table>`;
    types.push(
      `<Override PartName="/xl/worksheets/sheet${id}.xml" ContentType="${sheetType}.worksheet+xml"/>`,
      `<Override PartName="/xl/tables/table${id}.xml" ContentType="${sheetType}.table+xml"/>`,
    );
  }
  parts["[Content_Types].xml"] =
    `<Types xmlns="${contentNs}"><Default Extension="xml" ContentType="application/xml"/><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>${types.join("")}</Types>`;
  return parts;
}

export function zipEntries(
  entries: readonly (readonly [string, string | Buffer])[],
  options: { deflate?: boolean; descriptor?: boolean } = {},
) {
  const locals: Buffer[] = [],
    indexes: Buffer[] = [];
  let offset = 0;
  for (const [name, input] of entries) {
    const filename = Buffer.from(name),
      bytes = Buffer.isBuffer(input) ? input : Buffer.from(input);
    const data = options.deflate ? deflateRawSync(bytes) : bytes;
    const local = Buffer.alloc(30),
      index = Buffer.alloc(46),
      flags = 0x800 | (options.descriptor ? 8 : 0),
      method = options.deflate ? 8 : 0;
    local.writeUInt32LE(0x04034b50);
    local.writeUInt16LE(20, 4);
    local.writeUInt16LE(flags, 6);
    local.writeUInt16LE(method, 8);
    if (!options.descriptor) {
      local.writeUInt32LE(crc32(bytes), 14);
      local.writeUInt32LE(data.length, 18);
      local.writeUInt32LE(bytes.length, 22);
    }
    local.writeUInt16LE(filename.length, 26);
    index.writeUInt32LE(0x02014b50);
    index.writeUInt16LE(20, 4);
    index.writeUInt16LE(20, 6);
    index.writeUInt16LE(flags, 8);
    index.writeUInt16LE(method, 10);
    index.writeUInt32LE(crc32(bytes), 16);
    index.writeUInt32LE(data.length, 20);
    index.writeUInt32LE(bytes.length, 24);
    index.writeUInt16LE(filename.length, 28);
    index.writeUInt32LE(offset, 42);
    const descriptor = Buffer.alloc(options.descriptor ? 16 : 0);
    if (options.descriptor) {
      descriptor.writeUInt32LE(0x08074b50);
      descriptor.writeUInt32LE(crc32(bytes), 4);
      descriptor.writeUInt32LE(data.length, 8);
      descriptor.writeUInt32LE(bytes.length, 12);
    }
    locals.push(local, filename, data, descriptor);
    indexes.push(index, filename);
    offset += local.length + filename.length + data.length + descriptor.length;
  }
  const directory = Buffer.concat(indexes),
    end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50);
  end.writeUInt16LE(entries.length, 8);
  end.writeUInt16LE(entries.length, 10);
  end.writeUInt32LE(directory.length, 12);
  end.writeUInt32LE(offset, 16);
  return Buffer.concat([...locals, directory, end]);
}
export const workbookBytes = (
  parts = workbookParts(),
  options: { deflate?: boolean; descriptor?: boolean } = {},
) => zipEntries(Object.entries(parts), options);
