import { linesSheet, linesTable, type WorkbookParts } from "./excel-workbook";
import { setCell } from "./excel-review";
// Complete synthetic cases with independent arithmetic: each line costs 1.25 and sells 2.50.
export function capacityWorkbook(
  parts: WorkbookParts,
  count: number,
  changed = false,
) {
  const first = parts[linesSheet].match(/<row r="6">[\s\S]*?<\/row>/)![0];
  const rows = Array.from({ length: count }, (_, i) =>
    first
      .replace(/r="([A-Z]*)6"/g, (_, col) => `r="${col}${i + 6}"`)
      .replace("L-001", `CAP-${i + 1}`)
      .replace(
        "Climate controller and interface",
        `SYN capacity line ${i + 1}${changed && i === 0 ? " revised" : ""}`,
      ),
  ).join("");
  parts[linesSheet] = parts[linesSheet].replace(
    /<row r="6">[\s\S]*<\/sheetData>/,
    rows + "</sheetData>",
  );
  parts[linesTable] = parts[linesTable].replace("Q105", `Q${count + 5}`);
  for (let i = 0; i < count; i++) {
    const r = i + 6;
    setCell(parts, 5, `E${r}`, 1);
    setCell(parts, 5, `G${r}`, 1.25);
    setCell(parts, 5, `H${r}`, 2.5);
    setCell(parts, 5, `P${r}`, 1.25, `ROUND(E${r}*G${r},2)`);
    setCell(parts, 5, `Q${r}`, 2.5, `ROUND(E${r}*H${r},2)`);
  }
  setCell(parts, 6, "B6", count);
  setCell(parts, 6, "B7", count * 1.25);
  setCell(parts, 6, "B8", count * 2.5);
  setCell(parts, 6, "B9", count * 2.5);
}
