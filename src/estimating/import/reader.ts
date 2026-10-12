import { createHash } from "node:crypto";
import { refuse, WORKBOOK_LIMITS } from "./archive";
import { workbookPackage } from "./package";
import { attribute, children, NS, rootIs, single, type XmlNode } from "./xml";

export const TABLE_HEADERS = {
  PPO_Metadata: ["field", "value"],
  PPO_Sections: [
    "section_ref",
    "label",
    "facility_ref",
    "growing_area_ref",
    "system",
    "phase",
  ],
  PPO_Scope: ["scope_ref", "kind", "text"],
  PPO_Sources: [
    "source_ref",
    "source_kind",
    "supplier_label",
    "document_ref",
    "source_date",
    "valid_until",
    "internal_notes",
  ],
  PPO_Lines: [
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
  PPO_Control: ["control", "value"],
} as const;
export type WorkbookTable = keyof typeof TABLE_HEADERS;
export type WorkbookCell = {
  kind: "blank" | "text" | "number" | "boolean";
  value: string | boolean;
  formula: { text: string; attributes: Record<string, string> } | null;
};
export type WorkbookLocator = {
  sheet: string;
  table: WorkbookTable;
  row: number;
  range: string;
};
export type WorkbookRow = {
  cells: Record<string, WorkbookCell>;
  locator: WorkbookLocator;
};
export type ParsedWorkbook = {
  parser: "PPO-XLSX-1";
  file: { name: string; sha256: string; bytes: number };
  formula_count: number;
  tables: Record<WorkbookTable, WorkbookRow[]>;
};
const blank = (): WorkbookCell => ({ kind: "blank", value: "", formula: null });
function coordinate(address: string) {
  const match = /^([A-Z]{1,3})([1-9][0-9]{0,6})$/.exec(address);
  if (!match) refuse("A worksheet contains an invalid cell address.");
  const column = [...match[1]].reduce(
      (number, letter) => number * 26 + letter.charCodeAt(0) - 64,
      0,
    ),
    row = Number(match[2]);
  if (column > 16384 || row > 1048576)
    refuse("A worksheet cell exceeds Excel bounds.");
  return { column, row };
}
function columnName(column: number) {
  let name = "";
  for (let n = column; n; n = Math.floor((n - 1) / 26))
    name = String.fromCharCode(65 + ((n - 1) % 26)) + name;
  return name;
}
function richText(node: XmlNode) {
  return node.children
    .flatMap((child) =>
      child.ns !== NS.main
        ? []
        : child.name === "t"
          ? [child.text]
          : child.name === "r"
            ? children(child, "t").map((text) => text.text)
            : [],
    )
    .join("");
}
function cell(node: XmlNode, shared: string[], location: string): WorkbookCell {
  const type = attribute(node, "t") ?? "n",
    formulaNode = single(node, "f", NS.main, false),
    cache = single(node, "v", NS.main, false);
  const formula = formulaNode
    ? {
        text: formulaNode.text,
        attributes: Object.fromEntries(formulaNode.attrs),
      }
    : null;
  if (
    formula &&
    (formula.text.length > 8192 ||
      /(?:WEBSERVICE|HYPERLINK|RTD|CUBEVALUE|CUBEMEMBER)\s*\(|\[[^\]]+\][^!]*!/i.test(
        formula.text,
      ))
  )
    refuse(
      `${location}: external or unsupported formula content. Recalculate in a self-contained workbook.`,
    );
  if (type === "e")
    refuse(
      `${location}: Excel saved an error result. Correct, recalculate and save the workbook.`,
    );
  if (formula && (!cache || (cache.text === "" && type !== "str")))
    refuse(
      `${location}: formula has no saved result. Recalculate and save in Excel.`,
    );
  let kind: WorkbookCell["kind"], value: string | boolean;
  if (type === "s") {
    if (
      !cache ||
      !/^(0|[1-9][0-9]*)$/.test(cache.text) ||
      Number(cache.text) >= shared.length
    )
      refuse(`${location}: invalid shared-string reference.`);
    kind = "text";
    value = shared[Number(cache.text)];
  } else if (type === "inlineStr") {
    if (formula || cache) refuse(`${location}: invalid inline-string result.`);
    kind = "text";
    value = richText(single(node, "is"));
  } else if (type === "str" || type === "d") {
    kind = "text";
    value = cache?.text ?? "";
  } else if (type === "b") {
    if (!cache || !["0", "1"].includes(cache.text))
      refuse(`${location}: invalid Boolean result.`);
    kind = "boolean";
    value = cache.text === "1";
  } else if (type === "n") {
    if (!cache || !cache.text) {
      kind = "blank";
      value = "";
    } else {
      if (
        cache.text.length > 64 ||
        !/^[+-]?(?:[0-9]+(?:\.[0-9]*)?|\.[0-9]+)(?:[Ee][+-]?[0-9]+)?$/.test(
          cache.text,
        )
      )
        refuse(`${location}: invalid numeric result.`);
      kind = "number";
      value = cache.text;
    }
  } else refuse(`${location}: unsupported cell result type.`);
  if (typeof value === "string" && value.length > 32767)
    refuse(`${location}: cell text exceeds Excel's supported length.`);
  return { kind: value === "" ? "blank" : kind, value, formula };
}

export async function readWorkbook(
  bytes: Buffer,
  filename: string,
): Promise<ParsedWorkbook> {
  const pkg = await workbookPackage(bytes, filename),
    tables: Partial<Record<WorkbookTable, WorkbookRow[]>> = {};
  const bookRelations = [
    ...(pkg.relationships.get(pkg.workbookPath)?.values() ?? []),
  ];
  const sharedRelations = bookRelations.filter(
    (relation) => relation.type === `${NS.rel}/sharedStrings`,
  );
  if (sharedRelations.length > 1)
    refuse("The workbook has duplicate shared-string parts.");
  const shared = sharedRelations.length
    ? children(
        rootIs(pkg.required(sharedRelations[0].target), "sst"),
        "si",
      ).map(richText)
    : [];
  const sheets = single(pkg.workbook, "sheets"),
    seenSheets = new Set<string>(),
    seenParts = new Set<string>(),
    seenTables = new Set<string>();
  let formulaCount = 0;
  for (const declaration of children(sheets, "sheet")) {
    const name = attribute(declaration, "name"),
      relation = attribute(declaration, "id", NS.rel);
    if (
      !name ||
      name.length > 31 ||
      seenSheets.has(name.toLowerCase()) ||
      !relation
    )
      refuse("Missing or duplicate worksheet identity.");
    seenSheets.add(name.toLowerCase());
    const path = pkg.follow(pkg.workbookPath, relation, "worksheet");
    if (seenParts.has(path))
      refuse("A worksheet part is referenced more than once.");
    seenParts.add(path);
    const sheet = rootIs(pkg.required(path), "worksheet"),
      data = single(sheet, "sheetData"),
      cells = new Map<string, WorkbookCell>(),
      seenRows = new Set<number>();
    for (const row of children(data, "row")) {
      const number = attribute(row, "r");
      if (
        !number ||
        !/^[1-9][0-9]{0,6}$/.test(number) ||
        Number(number) > 1048576 ||
        seenRows.has(Number(number))
      )
        refuse(`${name}: missing, invalid or duplicate worksheet row.`);
      seenRows.add(Number(number));
      for (const item of children(row, "c")) {
        const address = attribute(item, "r");
        if (
          !address ||
          cells.has(address) ||
          coordinate(address).row !== Number(number)
        )
          refuse(`${name}: missing, duplicate or inconsistent cell address.`);
        const parsed = cell(item, shared, `${name}!${address}`);
        if (parsed.formula) formulaCount++;
        cells.set(address, parsed);
      }
    }
    const tableParts = single(sheet, "tableParts", NS.main, false);
    for (const tablePart of tableParts
      ? children(tableParts, "tablePart")
      : []) {
      const id = attribute(tablePart, "id", NS.rel);
      if (!id) refuse(`${name}: a table relationship is missing.`);
      const tablePath = pkg.follow(path, id, "table"),
        table = rootIs(pkg.required(tablePath), "table"),
        tableName = attribute(table, "name");
      if (
        !tableName ||
        seenTables.has(tableName.toLowerCase()) ||
        seenParts.has(tablePath)
      )
        refuse("Duplicate or missing named table identity.");
      seenTables.add(tableName.toLowerCase());
      seenParts.add(tablePath);
      if (!Object.hasOwn(TABLE_HEADERS, tableName)) continue;
      const key = tableName as WorkbookTable;
      if (
        (attribute(table, "headerRowCount") ?? "1") !== "1" ||
        (attribute(table, "totalsRowCount") ?? "0") !== "0"
      )
        refuse(`${key}: use one header row and no subtotal rows.`);
      const range = attribute(table, "ref")?.split(":");
      if (!range || range.length !== 2) refuse(`${key}: invalid table range.`);
      const first = coordinate(range[0]),
        last = coordinate(range[1]),
        expected = TABLE_HEADERS[key];
      if (
        last.column - first.column + 1 !== expected.length ||
        last.row < first.row ||
        last.row - first.row > 1000
      )
        refuse(
          `${key}: table columns or row bounds differ from the r01 contract.`,
        );
      const headers = Array.from({ length: expected.length }, (_, index) =>
        cells.get(`${columnName(first.column + index)}${first.row}`),
      );
      if (
        headers.some(
          (value) => !value || value.kind !== "text" || value.formula,
        ) ||
        new Set(headers.map((value) => value!.value)).size !==
          expected.length ||
        expected.some(
          (value) => !headers.some((header) => header!.value === value),
        )
      )
        refuse(`${key}: use every exact r01 column once.`);
      const declaredColumns = children(
        single(table, "tableColumns"),
        "tableColumn",
      );
      if (
        declaredColumns.length !== headers.length ||
        declaredColumns.some(
          (column, index) =>
            attribute(column, "name") !== headers[index]!.value,
        )
      )
        refuse(
          `${key}: table column names disagree with the worksheet header.`,
        );
      const rows: WorkbookRow[] = [];
      for (let number = first.row + 1; number <= last.row; number++) {
        const values = headers.map(
          (_, index) =>
            cells.get(`${columnName(first.column + index)}${number}`) ??
            blank(),
        );
        if (values.every((value) => value.value === "")) continue;
        rows.push({
          cells: Object.fromEntries(
            headers.map((header, index) => [
              String(header!.value),
              values[index],
            ]),
          ),
          locator: {
            sheet: name,
            table: key,
            row: number,
            range: `${columnName(first.column)}${number}:${columnName(last.column)}${number}`,
          },
        });
      }
      if (key === "PPO_Lines" && rows.length > WORKBOOK_LIMITS.lines)
        refuse("More than 100 populated export rows: no rows were discarded.");
      tables[key] = rows;
    }
  }
  for (const name of Object.keys(TABLE_HEADERS) as WorkbookTable[])
    if (!tables[name]) refuse(`Missing required named table: ${name}.`);
  return {
    parser: "PPO-XLSX-1",
    file: {
      name: filename,
      sha256: createHash("sha256").update(bytes).digest("hex"),
      bytes: bytes.length,
    },
    formula_count: formulaCount,
    tables: tables as Record<WorkbookTable, WorkbookRow[]>,
  };
}
