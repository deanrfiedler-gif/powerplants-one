import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import test from "node:test";
import { readWorkbook } from "../../src/estimating/import/reader";
import {
  workbookArchive,
  WorkbookRejected,
} from "../../src/estimating/import/archive";
import { workbookXml } from "../../src/estimating/import/xml";
import {
  linesSheet,
  linesTable,
  relation,
  spreadsheet,
  workbookBytes,
  workbookParts,
  zipEntries,
  type WorkbookParts,
} from "../helpers/excel-workbook";

for (const options of [
  {},
  { deflate: true },
  { deflate: true, descriptor: true },
]) {
  test(`synthetic r01 tables preserve source values and locators: ${JSON.stringify(options)}`, async () => {
    const bytes = workbookBytes(undefined, options);
    const parsed = await readWorkbook(bytes, "SYN-estimate.xlsx");
    assert.deepEqual(parsed.file, {
      name: "SYN-estimate.xlsx",
      sha256: createHash("sha256").update(bytes).digest("hex"),
      bytes: bytes.length,
    });
    assert.equal(parsed.parser, "PPO-XLSX-1");
    assert.deepEqual(
      Object.fromEntries(
        Object.entries(parsed.tables).map(([name, rows]) => [
          name,
          rows.length,
        ]),
      ),
      {
        PPO_Metadata: 17,
        PPO_Sections: 7,
        PPO_Scope: 3,
        PPO_Sources: 6,
        PPO_Lines: 12,
        PPO_Control: 4,
      },
    );
    const lines = parsed.tables.PPO_Lines;
    assert.deepEqual(lines[0].locator, {
      sheet: "SYN Lines",
      table: "PPO_Lines",
      row: 6,
      range: "A6:Q6",
    });
    assert.equal(
      lines[1].cells.line_ref.value,
      "L-002",
      "hidden source rows remain included",
    );
    assert.equal(lines[3].cells.quantity.value, "180.5");
    assert.equal(lines[3].cells.workbook_cost.value, "1218.38");
    assert.equal(lines[3].cells.workbook_sell.value, "1669.63");
    assert.equal(lines[0].cells.allowance.kind, "boolean");
    assert.equal(lines[0].cells.allowance.value, false);
    assert.equal(lines[8].cells.allowance.value, true);
    assert.equal(lines[0].cells.source_date.value, "2026-09-10");
    assert.equal(lines[0].cells.workbook_sell.formula?.text, "ROUND(E6*H6,2)");
    assert.equal(
      parsed.formula_count,
      25,
      "includes the explicitly cached empty reserved-row formula",
    );
    assert.equal(parsed.tables.PPO_Control[1].cells.value.value, "62952.38");
    assert.equal(parsed.tables.PPO_Control[2].cells.value.value, "85607.63");
  });
}

test("sheet order and names are not business identity", async () => {
  const parts = workbookParts();
  parts["xl/workbook.xml"] = parts["xl/workbook.xml"].replace(
    'name="SYN Lines"',
    'name="Renamed export"',
  );
  const sheets = parts["xl/workbook.xml"].match(/<sheet [^>]+\/>/g)!;
  parts["xl/workbook.xml"] = parts["xl/workbook.xml"].replace(
    /<sheets>.*<\/sheets>/,
    `<sheets>${sheets.reverse().join("")}</sheets>`,
  );
  const parsed = await readWorkbook(workbookBytes(parts), "SYN.xlsx");
  assert.equal(parsed.tables.PPO_Lines[0].locator.sheet, "Renamed export");
  assert.equal(parsed.tables.PPO_Lines[0].cells.line_ref.value, "L-001");
});

test("shared strings retain rich text and whitespace without executing formulas", async () => {
  const parts = workbookParts();
  parts["xl/sharedStrings.xml"] =
    `<sst xmlns="${spreadsheet}"><si><r><t> SYN </t></r><r><t>&amp; shared </t></r></si></sst>`;
  parts["[Content_Types].xml"] = parts["[Content_Types].xml"].replace(
    "</Types>",
    '<Override PartName="/xl/sharedStrings.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sharedStrings+xml"/></Types>',
  );
  parts["xl/_rels/workbook.xml.rels"] = parts[
    "xl/_rels/workbook.xml.rels"
  ].replace(
    "</Relationships>",
    `<Relationship Id="strings" Type="${relation}/sharedStrings" Target="sharedStrings.xml"/></Relationships>`,
  );
  parts[linesSheet] = parts[linesSheet].replace(
    '<c r="C6" t="inlineStr"><is><t xml:space="preserve">Climate controller and interface</t></is></c>',
    '<c r="C6" t="s"><v>0</v></c>',
  );
  const parsed = await readWorkbook(workbookBytes(parts), "SYN.xlsx");
  assert.equal(
    parsed.tables.PPO_Lines[0].cells.description.value,
    " SYN & shared ",
  );
});

test("blank, explicit zero, cached empty string and unrounded numeric evidence stay distinct", async () => {
  const parts = workbookParts();
  parts[linesSheet] = parts[linesSheet]
    .replace('<c r="G6"><v>14500</v></c>', '<c r="G6"><v>0</v></c>')
    .replace('<c r="H6"><v>19000</v></c>', '<c r="H6"/>')
    .replace('<c r="E6"><v>1</v></c>', '<c r="E6"><v>1.000</v></c>');
  const { cells } = (await readWorkbook(workbookBytes(parts), "SYN.xlsx"))
    .tables.PPO_Lines[0];
  assert.deepEqual(cells.unit_cost, {
    kind: "number",
    value: "0",
    formula: null,
  });
  assert.deepEqual(cells.unit_sell, {
    kind: "blank",
    value: "",
    formula: null,
  });
  assert.equal(cells.quantity.value, "1.000");
  assert.equal(
    cells.workbook_sell.value,
    "19000",
    "the reader must not recalculate saved evidence",
  );
});

type Mutation = (parts: WorkbookParts) => void;
const badWorkbooks: [string, Mutation][] = [
  [
    "string formula with no saved cache cannot disappear as an empty reserved row",
    (p) => {
      p[linesSheet] = p[linesSheet].replace(
        "<f>IF(A105=&quot;&quot;,&quot;&quot;,1)</f><v></v>",
        "<f>IF(A105=&quot;&quot;,&quot;&quot;,1)</f>",
      );
    },
  ],
  [
    "numeric formula with missing cache",
    (p) => {
      p[linesSheet] = p[linesSheet].replace(
        '<v>14500</v></c><c r="Q6"',
        '</c><c r="Q6"',
      );
    },
  ],
  [
    "formula with Excel error",
    (p) => {
      p[linesSheet] = p[linesSheet].replace('<c r="P6">', '<c r="P6" t="e">');
    },
  ],
  [
    "external formula reference",
    (p) => {
      p[linesSheet] = p[linesSheet].replace(
        "ROUND(E6*G6,2)",
        "'[other.xlsx]Sheet1'!A1",
      );
    },
  ],
  [
    "external relationship",
    (p) => {
      p["xl/_rels/workbook.xml.rels"] = p["xl/_rels/workbook.xml.rels"].replace(
        'Target="worksheets/sheet1.xml"',
        'TargetMode="External" Target="https://invalid.example/sheet1.xml"',
      );
    },
  ],
  [
    "missing relationship target",
    (p) => {
      delete p["xl/worksheets/sheet1.xml"];
    },
  ],
  [
    "duplicate relationship identity",
    (p) => {
      p["xl/_rels/workbook.xml.rels"] = p["xl/_rels/workbook.xml.rels"].replace(
        'Id="sheet2"',
        'Id="sheet1"',
      );
    },
  ],
  [
    "relationship escaping the package",
    (p) => {
      p["xl/_rels/workbook.xml.rels"] = p["xl/_rels/workbook.xml.rels"].replace(
        'Target="worksheets/sheet1.xml"',
        'Target="../../sheet1.xml"',
      );
    },
  ],
  [
    "embedded object",
    (p) => {
      p["xl/embeddings/object1.xml"] = "<object/>";
    },
  ],
  [
    "macro part",
    (p) => {
      p["xl/vbaProject.bin"] = "SYN";
    },
  ],
  [
    "unsupported 1904 dates",
    (p) => {
      p["xl/workbook.xml"] = p["xl/workbook.xml"].replace(
        'date1904="0"',
        'date1904="1"',
      );
    },
  ],
  [
    "invalid date-system declaration",
    (p) => {
      p["xl/workbook.xml"] = p["xl/workbook.xml"].replace(
        'date1904="0"',
        'date1904="unknown"',
      );
    },
  ],
  [
    "relationship content type disagrees with its part",
    (p) => {
      p["[Content_Types].xml"] = p["[Content_Types].xml"].replace(
        "worksheet+xml",
        "styles+xml",
      );
    },
  ],
  [
    "duplicate sheet name",
    (p) => {
      p["xl/workbook.xml"] = p["xl/workbook.xml"].replace(
        'name="SYN Sections"',
        'name="syn metadata"',
      );
    },
  ],
  [
    "duplicate cell address",
    (p) => {
      p[linesSheet] = p[linesSheet].replace('r="B6"', 'r="A6"');
    },
  ],
  [
    "duplicate row",
    (p) => {
      p[linesSheet] = p[linesSheet].replace(
        'r="7" hidden="1"',
        'r="6" hidden="1"',
      );
    },
  ],
  [
    "cell outside its row",
    (p) => {
      p[linesSheet] = p[linesSheet].replace('r="A6"', 'r="A7"');
    },
  ],
  [
    "cell beyond Excel bounds",
    (p) => {
      p[linesSheet] = p[linesSheet].replace('r="A6"', 'r="XFE6"');
    },
  ],
  [
    "duplicate table name",
    (p) => {
      p[linesTable] = p[linesTable].replace(
        'name="PPO_Lines"',
        'name="PPO_Metadata"',
      );
    },
  ],
  [
    "missing required table",
    (p) => {
      p[linesTable] = p[linesTable].replaceAll("PPO_Lines", "SYN_WorkingLines");
    },
  ],
  [
    "export subtotals",
    (p) => {
      p[linesTable] = p[linesTable].replace(
        'totalsRowCount="0"',
        'totalsRowCount="1"',
      );
    },
  ],
  [
    "empty tables must still have exact headers",
    (p) => {
      p[linesTable] = p[linesTable].replace("A5:Q105", "A5:P5");
    },
  ],
  [
    "mismatched table column declaration",
    (p) => {
      p[linesTable] = p[linesTable].replace('name="line_ref"', 'name="wrong"');
    },
  ],
  [
    "unknown numeric representation",
    (p) => {
      p[linesSheet] = p[linesSheet].replace("<v>14500</v>", "<v>NaN</v>");
    },
  ],
  [
    "invalid Boolean",
    (p) => {
      p[linesSheet] = p[linesSheet].replace(
        '<c r="I6" t="b"><v>0</v>',
        '<c r="I6" t="b"><v>2</v>',
      );
    },
  ],
];
for (const [name, mutate] of badWorkbooks)
  test(`rejects ${name}`, async () => {
    const parts = workbookParts();
    mutate(parts);
    await assert.rejects(
      readWorkbook(workbookBytes(parts), "SYN.xlsx"),
      WorkbookRejected,
    );
  });

test("501 populated export lines are refused as one workbook", async () => {
  const parts = workbookParts(),
    row = parts[linesSheet].match(/<row r="6">.*?<\/row>/)![0];
  parts[linesSheet] = parts[linesSheet].replace(
    /<sheetData>.*<\/sheetData>/,
    `<sheetData>${parts[linesSheet].match(/<row r="5">.*?<\/row>/)![0]}${Array.from({ length: 501 }, (_, i) => row.replaceAll('r="6"', `r="${i + 6}"`).replace(/r="([A-Q])6"/g, `r="$1${i + 6}"`)).join("")}</sheetData>`,
  );
  parts[linesTable] = parts[linesTable].replace("A5:Q105", "A5:Q506");
  await assert.rejects(
    readWorkbook(workbookBytes(parts), "SYN.xlsx"),
    /500 populated/,
  );
});

test("a populated row without line identity is retained for later domain validation", async () => {
  const parts = workbookParts();
  parts[linesSheet] = parts[linesSheet].replace(">L-001</t>", "></t>");
  const parsed = await readWorkbook(workbookBytes(parts), "SYN.xlsx");
  assert.equal(parsed.tables.PPO_Lines.length, 12);
  assert.equal(parsed.tables.PPO_Lines[0].cells.line_ref.kind, "blank");
  assert.equal(parsed.tables.PPO_Lines[0].locator.row, 6);
});

for (const [name, xml] of [
  ["DTD", '<!DOCTYPE r [<!ENTITY x "SYN">]><r>&x;</r>'],
  ["malformed XML", "<r><unclosed></r>"],
  ["two roots", "<r/><s/>"],
  ["undeclared namespace", "<x:r/>"],
  [
    "duplicate expanded attributes",
    '<r xmlns:a="urn:test" xmlns:b="urn:test" a:id="1" b:id="2"/>',
  ],
  ["processing instruction", "<r><?synthetic command?></r>"],
  ["unsupported encoding", '<?xml version="1.0" encoding="UTF-16"?><r/>'],
  ["depth overflow", "<r>".repeat(65) + "</r>".repeat(65)],
  ["element budget", "<r>" + "<v/>".repeat(100001) + "</r>"],
])
  test(`XML refuses ${name}`, () =>
    assert.throws(() => workbookXml(Buffer.from(xml)), WorkbookRejected));

test("XML refuses invalid UTF-8 and shares the element budget across parts", () => {
  assert.throws(() => workbookXml(Buffer.from([0xff])), WorkbookRejected);
  const budget = { remaining: 2 };
  workbookXml(Buffer.from("<r/>"), budget);
  workbookXml(Buffer.from("<r/>"), budget);
  assert.throws(
    () => workbookXml(Buffer.from("<r/>"), budget),
    WorkbookRejected,
  );
});

test("archives refuse wrong extension, truncated input, excess bytes/entries/expansion and duplicate paths", async () => {
  await assert.rejects(
    workbookArchive(workbookBytes(), "SYN.xlsm"),
    WorkbookRejected,
  );
  await assert.rejects(
    workbookArchive(workbookBytes().subarray(0, -1), "SYN.xlsx"),
    WorkbookRejected,
  );
  await assert.rejects(
    workbookArchive(Buffer.alloc(5 * 1024 * 1024 + 1), "SYN.xlsx"),
    /5 MiB/,
  );
  await assert.rejects(
    workbookArchive(
      zipEntries(Array.from({ length: 257 }, (_, i) => [`p${i}`, "x"])),
      "SYN.xlsx",
    ),
    /256/,
  );
  await assert.rejects(
    workbookArchive(
      zipEntries([["large", Buffer.alloc(20 * 1024 * 1024 + 1)]], {
        deflate: true,
      }),
      "SYN.xlsx",
    ),
    /20 MiB/,
  );
  await assert.rejects(
    workbookArchive(
      zipEntries([
        ["xl/a.xml", "a"],
        ["xl/A.xml", "b"],
      ]),
      "SYN.xlsx",
    ),
    /Duplicate/,
  );
  await assert.rejects(
    workbookArchive(zipEntries([["../outside.xml", "a"]]), "SYN.xlsx"),
    WorkbookRejected,
  );
});

test("archive corruption and disagreement between local/index/descriptor metadata are refused", async () => {
  const corrupt = zipEntries([["a.xml", "<r>SYN</r>"]]);
  corrupt[35] ^= 1;
  await assert.rejects(workbookArchive(corrupt, "SYN.xlsx"), /checksum/);
  const mismatch = zipEntries([["a.xml", "<r/>"]]);
  mismatch.writeUInt32LE(99, 22);
  await assert.rejects(workbookArchive(mismatch, "SYN.xlsx"), WorkbookRejected);
  const descriptor = zipEntries([["a.xml", "<r/>"]], { descriptor: true });
  descriptor.writeUInt32LE(99, 43);
  await assert.rejects(
    workbookArchive(descriptor, "SYN.xlsx"),
    WorkbookRejected,
  );
  const encrypted = zipEntries([["a.xml", "<r/>"]]);
  encrypted.writeUInt16LE(0x801, 6);
  encrypted.writeUInt16LE(0x801, 47);
  await assert.rejects(
    workbookArchive(encrypted, "SYN.xlsx"),
    WorkbookRejected,
  );
});
